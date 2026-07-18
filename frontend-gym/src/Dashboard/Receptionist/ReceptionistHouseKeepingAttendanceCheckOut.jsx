import React, { useState, useEffect } from 'react';
import {
    FaPlus,
    FaTrashAlt,
    FaEdit,
    FaEye,
    FaSearch,
    FaFileExport,
    FaExclamationTriangle,
    FaFilter,
    FaTimesCircle,
} from 'react-icons/fa';
import { Button, Spinner } from 'react-bootstrap';
import axiosInstance from '../../Api/axiosInstance';
import BaseUrl from '../../Api/BaseUrl';

const ReceptionistHouseKeepingAttendanceCheckOut = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [modalType, setModalType] = useState('view');
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [branchFilter, setBranchFilter] = useState('All');
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [branches, setBranches] = useState([]);
    const [staffMembers, setStaffMembers] = useState([]);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const customColor = "#6EB2CC";

    const getUserFromStorage = () => {
        try {
            const userStr = localStorage.getItem('user');
            return userStr ? JSON.parse(userStr) : null;
        } catch (err) {
            console.error('Error parsing user from localStorage:', err);
            return null;
        }
    };

    const user = getUserFromStorage();
    const memberId = user?.id || null;
    const branchId = user?.branchId || null;
    const adminId = user?.adminId || null;

    // ✅ FIXED: Use setRecords instead of setAttendance
    const handleCheckout = async (id) => {
        try {
            setRecords(prev =>
                prev.map(record =>
                    record.attendance_id === id
                        ? { ...record, checkingOut: true }
                        : record
                )
            );

            const response = await axiosInstance.put(`memberattendence/checkout/${id}`, {
                memberId: memberId,
                branchId: branchId
            });

            if (response.data?.success) {
                alert('Check-out successful!');
                // ✅ REFETCH the list after successful checkout
                await fetchAttendanceRecords();
            } else {
                alert(response.data.message || 'Check-out failed');
                setRecords(prev =>
                    prev.map(record =>
                        record.attendance_id === id
                            ? { ...record, checkingOut: false }
                            : record
                    )
                );
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Error during check-out';
            alert(errorMessage);
            setRecords(prev =>
                prev.map(record =>
                    record.attendance_id === id
                        ? { ...record, checkingOut: false }
                        : record
                )
            );
        }
    };

    useEffect(() => {
        fetchBranches();
        fetchStaffMembers();
        fetchAttendanceRecords();
    }, [adminId]);

    const fetchBranches = async () => {
        try {
            const response = await axiosInstance.get(`${BaseUrl}branches/by-admin/${adminId}`);
            if (response.data.success) {
                setBranches(response.data.branches);
            }
        } catch (err) {
            console.error('Error fetching branches:', err);
            setError('Failed to load branches');
        }
    };

    const fetchStaffMembers = async () => {
        try {
            const response = await axiosInstance.get(`${BaseUrl}staff/all`);
            if (response.data.success) {
                const transformedStaff = response.data.staff.map(staff => ({
                    id: staff.staffId,
                    staffId: staff.staffId,
                    name: staff.fullName,
                    role: getRoleName(staff.roleId),
                    branch: getBranchName(staff.branchId),
                    email: staff.email,
                    phone: staff.phone,
                    roleId: staff.roleId
                }));
                setStaffMembers(transformedStaff);
            }
        } catch (err) {
            console.error('Error fetching staff:', err);
            setError('Failed to load staff data');
        }
    };

    const calculateShiftType = (checkInTime) => {
        if (!checkInTime) return 'Unknown';
        try {
            const date = new Date(checkInTime);
            const hours = date.getHours();
            if (hours >= 5 && hours < 12) return 'Morning Shift';
            else if (hours >= 12 && hours < 17) return 'Day Shift';
            else if (hours >= 17 && hours < 22) return 'Evening Shift';
            else return 'Night Shift';
        } catch (err) {
            return 'Unknown';
        }
    };

    const fetchAttendanceRecords = async () => {
        try {
            const response = await axiosInstance.get(`${BaseUrl}memberattendence/admin?adminId=${adminId}`);
            if (response.data?.success && Array.isArray(response.data.attendance)) {
                const transformedRecords = response.data.attendance.map(record => {
                    const formattedRole = record.role
                        ? record.role.charAt(0).toUpperCase() + record.role.slice(1)
                        : 'Unknown';
                    return {
                        attendance_id: record.id || Date.now(),
                        staff_name: record.name || 'Unknown',
                        role: formattedRole,
                        date: record.date ? record.date.split('T')[0] : '',
                        checkin_time: record.checkIn,
                        checkout_time: record.checkOut,
                        mode: record.mode,
                        shift_name: record.shift || calculateShiftType(record.checkIn),
                        status: record.status || 'Unknown',
                        checkedOut: !!record.checkOut, // ✅ derive from actual checkOut
                    };
                });
                setRecords(transformedRecords);
            }
        } catch (err) {
            console.error('Error fetching attendance records:', err);
            setError('Failed to load attendance records');
        }
    };

    const getBranchName = (branchId) => {
        const branch = branches.find(b => b.id === branchId);
        return branch ? branch.name : 'Unknown';
    };

    const getRoleName = (roleId) => {
        const roles = {
            1: 'Admin',
            2: 'Manager',
            3: 'Trainer',
            4: 'Receptionist',
            5: 'Personal Trainer',
            6: 'General Trainer',
            7: 'Receptionist',
            8: 'Housekeeping'
        };
        return roles[roleId] || 'Unknown';
    };

    const allRoles = ['All', ...new Set(records.map(r => r.role))];
    const allStatuses = ['All', 'Present', 'Late', 'Absent', 'Overtime'];
    const allBranches = ['All', ...new Set(branches.map(b => b.name))];

    const filteredRecords = records.filter(record => {
        if (!record) return false;
        const staffName = (record.staff_name || '').toLowerCase();
        const role = (record.role || '').toLowerCase();
        const status = (record.status || '').toLowerCase();
        const term = searchTerm.toLowerCase();

        // 🔒 ONLY show Housekeeping and Member in the list (as per your earlier filter)
        // if (!(role === 'member' || role === 'housekeeping')) return false;
        if (!(role === 'housekeeping')) return false;

        const matchesSearch =
            staffName.includes(term) ||
            role.includes(term) ||
            status.includes(term);

        const matchesStatus = statusFilter === 'All' || record.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const handleDeleteClick = (record) => {
        setSelectedRecord(record);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedRecord) return;
        try {
            setRecords(prev =>
                prev.map(r =>
                    r.attendance_id === selectedRecord.attendance_id
                        ? { ...r, deleting: true }
                        : r
                )
            );

            const response = await axiosInstance.delete(`${BaseUrl}memberattendence/delete/${selectedRecord.attendance_id}`);
            if (response.data?.success) {
                setRecords(prev =>
                    prev.filter(r => r.attendance_id !== selectedRecord.attendance_id)
                );
                alert(`Deleted attendance record for ${selectedRecord.staff_name}.`);
            } else {
                throw new Error(response.data?.message || 'Delete failed');
            }
        } catch (err) {
            alert('Failed to delete record');
            setRecords(prev =>
                prev.map(r =>
                    r.attendance_id === selectedRecord.attendance_id
                        ? { ...r, deleting: false }
                        : r
                )
            );
        } finally {
            setIsDeleteModalOpen(false);
            setSelectedRecord(null);
        }
    };

    const closeModal = () => setIsModalOpen(false);
    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setSelectedRecord(null);
    };

    useEffect(() => {
        if (isModalOpen || isDeleteModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isModalOpen, isDeleteModalOpen]);

    const getStatusBadge = (status) => {
        if (!status) return <span className="badge rounded-pill bg-secondary px-2 py-1">Unknown</span>;
        const badgeClasses = {
            Present: "bg-success text-white",
            Late: "bg-warning text-dark",
            Absent: "bg-danger text-white",
            Overtime: "bg-info text-white"
        };
        return (
            <span className={`badge rounded-pill ${badgeClasses[status] || 'bg-secondary'} px-2 py-1`}>
                {status}
            </span>
        );
    };

    const getRoleBadge = (role) => {
        const colors = {
            "Housekeeping": "bg-secondary",
            "Member": "bg-dark",
            "Personal Trainer": "bg-primary",
            "General Trainer": "bg-success",
            "Receptionist": "bg-info",
            "Admin": "bg-danger",
            "Manager": "bg-warning",
            "Trainer": "bg-primary"
        };
        return (
            <span className={`badge rounded-pill ${colors[role] || 'bg-light text-dark'} px-2 py-1`}>
                {role}
            </span>
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const formatTime = (timeString) => {
        if (!timeString) return <span className="text-muted">—</span>;
        return new Date(timeString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const clearFilters = () => {
        setRoleFilter('All');
        setStatusFilter('All');
        setBranchFilter('All');
    };

    const MobileAttendanceCard = ({ record }) => (
        <div className="card mb-3 shadow-sm" style={{ borderRadius: '0.5rem' }}>
            <div className="card-body p-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <h6 className="mb-1 fw-bold" style={{ fontSize: '0.95rem' }}>{record.staff_name || 'Unknown'}</h6>
                        <div className="d-flex gap-1 flex-wrap">
                            {getRoleBadge(record.role)}
                        </div>
                    </div>
                    {getStatusBadge(record.status)}
                </div>
                <div className="row g-2 mb-2">
                    <div className="col-6">
                        <small className="text-muted d-block">Date</small>
                        <span style={{ fontSize: '0.85rem' }}>{formatDate(record.date)}</span>
                    </div>
                    <div className="col-6">
                        <small className="text-muted d-block">Shift</small>
                        <span style={{ fontSize: '0.85rem' }}>{record.shift_name || 'Unknown'}</span>
                    </div>
                    <div className="col-6">
                        <small className="text-muted d-block">Check-in</small>
                        <span style={{ fontSize: '0.85rem' }}>{formatTime(record.checkin_time)}</span>
                    </div>
                    <div className="col-6">
                        <small className="text-muted d-block">Check-out</small>
                        <span style={{ fontSize: '0.85rem' }}>{formatTime(record.checkout_time)}</span>
                    </div>
                </div>
                {record.notes && (
                    <div className="mb-2">
                        <small className="text-muted">Notes:</small>
                        <p className="mb-0" style={{ fontSize: '0.85rem' }}>{record.notes}</p>
                    </div>
                )}
                <div className="d-flex justify-content-end gap-1">
                    <button
                        className="btn btn-sm btn-outline-danger action-btn"
                        title="Delete"
                        onClick={() => handleDeleteClick(record)}
                        disabled={record.deleting}
                    >
                        {record.deleting ? (
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        ) : (
                            <FaTrashAlt size={12} />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="container-fluid p-2 p-md-4">
            {/* Header Section */}
            <div className="row mb-3 mb-md-4 align-items-center">
                <div className="col-12 col-md-8 mb-2 mb-md-0">
                    <h2 className="fw-bold mb-1" style={{ fontSize: 'clamp(1.25rem, 4vw, 1.75rem)' }}>HouseKeeping Checkout</h2>
                </div>
                <div className="col-12 col-md-4">
                </div>
            </div>

            {/* Filters Section */}
            <div className="card shadow-sm border-0 mb-3 mb-md-4">
                <div className="card-body p-2 p-md-3">
                    <div className="d-md-none mb-2">
                        <button
                            className="btn btn-outline-secondary btn-sm w-100 d-flex justify-content-between align-items-center"
                            onClick={() => setShowMobileFilters(!showMobileFilters)}
                        >
                            <span>Filters</span>
                            <FaFilter />
                        </button>
                    </div>
                    <div className={`row g-2 ${showMobileFilters ? 'd-block' : 'd-none d-md-flex'}`}>
                        <div className="col-12 col-md-5">
                            <div className="input-group input-group-sm">
                                <span className="input-group-text bg-light border">
                                    <FaSearch className="text-muted" style={{ fontSize: '0.875rem' }} />
                                </span>
                                <input
                                    type="text"
                                    className="form-control border"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ fontSize: '0.875rem' }}
                                />
                            </div>
                        </div>
                        {/* <div className="col-6 col-md-3">
                            <select
                                className="form-select form-select-sm"
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                style={{ fontSize: '0.875rem' }}
                            >
                                {allRoles.map(role => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                            </select>
                        </div> */}
                        <div className="col-6 col-md-3">
                            <select
                                className="form-select form-select-sm"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                style={{ fontSize: '0.875rem' }}
                            >
                                {allStatuses.map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-12 col-md-1">
                            <button
                                className="btn btn-outline-secondary btn-sm w-100"
                                onClick={clearFilters}
                                style={{ fontSize: '0.875rem' }}
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Records Section */}
            <div className="card shadow-sm border-0">
                <div className="card-header bg-light py-2 py-md-3">
                    <h6 className="mb-0 fw-bold" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>
                        Attendance
                    </h6>
                </div>
                <div className="card-body p-0">
                    <div className="d-none d-md-block">
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                                <thead className="bg-light">
                                    <tr>
                                        <th>DATE</th>
                                        <th>NAME</th>
                                        <th>ROLE</th>
                                        <th>CHECK-IN</th>
                                        <th>CHECK-OUT</th>
                                        <th>STATUS</th>
                                        <th>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRecords.length > 0 ? (
                                        filteredRecords.map((record) => (
                                            <tr key={record.attendance_id}>
                                                <td>{formatDate(record.date)}</td>
                                                <td><strong>{record.staff_name}</strong></td>
                                                <td>{getRoleBadge(record.role)}</td>
                                                <td>{formatTime(record.checkin_time)}</td>
                                                <td>{formatTime(record.checkout_time)}</td>
                                                <td>{getStatusBadge(record.status)}</td>
                                                <td>
                                                    <div className="d-flex gap-2">
                                                        {/* ✅ Only show checkout for Housekeeping */}
                                                        {record.role === 'Housekeeping' && !record.checkedOut ? (
                                                            <Button
                                                                variant="outline-success"
                                                                size="sm"
                                                                onClick={() => handleCheckout(record.attendance_id)}
                                                                disabled={record.checkingOut}
                                                            >
                                                                {record.checkingOut ? (
                                                                    <>
                                                                        <Spinner as="span" animation="border" size="sm" />
                                                                        <span className="ms-1">Out...</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <FaTimesCircle size={12} />
                                                                        <span className="ms-1">Check-out</span>
                                                                    </>
                                                                )}
                                                            </Button>
                                                        ) : record.role === 'Housekeeping' ? (
                                                            <Button variant="outline-secondary" size="sm" disabled>
                                                                <span className="ms-1">Checked Out</span>
                                                            </Button>
                                                        ) : null}

                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            onClick={() => handleDeleteClick(record)}
                                                            disabled={record.deleting}
                                                        >
                                                            {record.deleting ? (
                                                                <Spinner as="span" animation="border" size="sm" />
                                                            ) : (
                                                                <FaTrashAlt size={12} />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="text-center py-4 text-muted">
                                                No records found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="d-md-none p-3">
                        {filteredRecords.length > 0 ? (
                            filteredRecords.map(record => (
                                <MobileAttendanceCard key={record.attendance_id} record={record} />
                            ))
                        ) : (
                            <div className="text-center py-4">
                                <div className="text-muted">
                                    <FaSearch size={24} className="mb-2" />
                                    <p className="mb-0">No attendance records found matching your criteria.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MAIN MODAL - FIXED: Using controlled inputs for view/edit modes */}
            {isModalOpen && (
                <div
                    className="modal fade show"
                    tabIndex="-1"
                    style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
                >
                    <div
                        className="modal-dialog modal-dialog-centered"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            maxWidth: modalType === 'view' ? '500px' : '550px',
                            margin: 'auto',
                            position: 'relative',
                            transform: 'scale(0.95)',
                            transition: 'transform 0.2s ease-out'
                        }}
                    >
                        <div className="modal-content border-0 shadow" style={{ borderRadius: '0.5rem', overflow: 'hidden' }}>
                            <div className="modal-header py-2 px-3" style={{ backgroundColor: customColor, color: 'white' }}>
                                <h5 className="modal-title fw-bold m-0" style={{ fontSize: '1rem' }}>{getModalTitle()}</h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={closeModal}
                                    style={{ opacity: 0.8 }}
                                ></button>
                            </div>
                            <div className="modal-body p-3" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                                {error && <div className="alert alert-danger">{error}</div>}
                                <form onSubmit={handleFormSubmit}>
                                    <div className="row g-2">
                                        <div className="col-12">
                                            <label className="form-label fw-semibold" style={{ fontSize: '0.8rem' }}>Staff Member *</label>
                                            <select
                                                name="staff_id"
                                                className="form-select form-select-sm"
                                                value={selectedRecord?.staff_id || ''}
                                                onChange={(e) => setSelectedRecord({ ...selectedRecord, staff_id: e.target.value })}
                                                disabled={modalType === 'view'}
                                                required
                                            >
                                                <option value="">Select Staff Member</option>
                                                {staffMembers.map(staff => (
                                                    <option key={staff.id} value={staff.id}>
                                                        {staff.name} ({staff.role})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-6">
                                            <label className="form-label fw-semibold" style={{ fontSize: '0.8rem' }}>Date</label>
                                            <input
                                                name="date"
                                                type="date"
                                                className="form-control form-control-sm"
                                                value={selectedRecord?.date || new Date().toISOString().split('T')[0]}
                                                onChange={(e) => setSelectedRecord({ ...selectedRecord, date: e.target.value })}
                                                readOnly={modalType === 'view'}
                                                required
                                            />
                                        </div>
                                        <div className="col-6">
                                            <label className="form-label fw-semibold" style={{ fontSize: '0.8rem' }}>Shift</label>
                                            <select
                                                name="shift_id"
                                                className="form-select form-select-sm"
                                                value={selectedRecord?.shift_id || ''}
                                                onChange={(e) => setSelectedRecord({ ...selectedRecord, shift_id: e.target.value })}
                                                disabled={modalType === 'view'}
                                            >
                                                <option value="">No Shift</option>
                                                {shifts.map(shift => (
                                                    <option key={shift.id} value={shift.id}>
                                                        {shift.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-6">
                                            <label className="form-label fw-semibold" style={{ fontSize: '0.8rem' }}>Mode</label>
                                            <select
                                                name="mode"
                                                className="form-select form-select-sm"
                                                value={selectedRecord?.mode || 'QR'}
                                                onChange={(e) => setSelectedRecord({ ...selectedRecord, mode: e.target.value })}
                                                disabled={modalType === 'view'}
                                                required
                                            >
                                                <option value="QR">QR</option>
                                                <option value="Manual">Manual</option>
                                            </select>
                                        </div>
                                        <div className="col-6">
                                            <label className="form-label fw-semibold" style={{ fontSize: '0.8rem' }}>Status</label>
                                            <select
                                                name="status"
                                                className="form-select form-select-sm"
                                                value={selectedRecord?.status || 'Present'}
                                                onChange={(e) => setSelectedRecord({ ...selectedRecord, status: e.target.value })}
                                                disabled={modalType === 'view'}
                                                required
                                            >
                                                <option value="Present">Present</option>
                                                <option value="Late">Late</option>
                                                <option value="Absent">Absent</option>
                                                <option value="Overtime">Overtime</option>
                                            </select>
                                        </div>
                                        <div className="col-6">
                                            <label className="form-label fw-semibold" style={{ fontSize: '0.8rem' }}>Check-in Time</label>
                                            <input
                                                name="checkin_time"
                                                type="datetime-local"
                                                className="form-control form-control-sm"
                                                value={selectedRecord?.checkin_time || ''}
                                                onChange={(e) => setSelectedRecord({ ...selectedRecord, checkin_time: e.target.value })}
                                                readOnly={modalType === 'view'}
                                            />
                                        </div>
                                        <div className="col-6">
                                            <label className="form-label fw-semibold" style={{ fontSize: '0.8rem' }}>Check-out Time</label>
                                            <input
                                                name="checkout_time"
                                                type="datetime-local"
                                                className="form-control form-control-sm"
                                                value={selectedRecord?.checkout_time || ''}
                                                onChange={(e) => setSelectedRecord({ ...selectedRecord, checkout_time: e.target.value })}
                                                readOnly={modalType === 'view'}
                                            />
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label fw-semibold" style={{ fontSize: '0.8rem' }}>Notes</label>
                                            <input
                                                name="notes"
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder="Reason for absence or late entry..."
                                                value={selectedRecord?.notes || ''}
                                                onChange={(e) => setSelectedRecord({ ...selectedRecord, notes: e.target.value })}
                                                readOnly={modalType === 'view'}
                                            />
                                        </div>
                                    </div>
                                    <div className="d-flex justify-content-end gap-2 mt-3">
                                        <button
                                            type="button"
                                            className="btn btn-secondary btn-sm px-3"
                                            onClick={closeModal}
                                        >
                                            Cancel
                                        </button>
                                        {modalType !== 'view' && (
                                            <button
                                                type="submit"
                                                className="btn btn-sm px-3"
                                                style={{
                                                    backgroundColor: customColor,
                                                    color: 'white',
                                                    border: 'none'
                                                }}
                                            >
                                                {modalType === 'add' ? 'Add Record' : 'Save Changes'}
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRMATION MODAL */}
            {isDeleteModalOpen && (
                <div
                    className="modal fade show"
                    tabIndex="-1"
                    style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
                    onClick={closeDeleteModal}
                >
                    <div
                        className="modal-dialog modal-dialog-centered"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            maxWidth: '400px',
                            margin: 'auto',
                            position: 'relative',
                            transform: 'scale(0.95)',
                            transition: 'transform 0.2s ease-out'
                        }}
                    >
                        <div className="modal-content border-0 shadow" style={{ borderRadius: '0.5rem', overflow: 'hidden' }}>
                            <div className="modal-header py-2 px-3" style={{ backgroundColor: customColor, color: 'white' }}>
                                <h5 className="modal-title fw-bold m-0" style={{ fontSize: '1rem' }}>Confirm Deletion</h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={closeDeleteModal}
                                    style={{ opacity: 0.8 }}
                                ></button>
                            </div>
                            <div className="modal-body text-center py-3">
                                <div className="text-danger mb-2">
                                    <FaExclamationTriangle size={24} />
                                </div>
                                <h5 style={{ fontSize: '1rem' }}>Are you sure?</h5>
                                <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                                    This will permanently delete attendance record for <strong>{selectedRecord?.staff_name || 'Unknown'}</strong> ({selectedRecord?.role || 'Unknown'}) on <strong>{selectedRecord ? formatDate(selectedRecord.date) : ''}</strong>.<br />
                                    This action cannot be undone.
                                </p>
                            </div>
                            <div className="modal-footer border-0 justify-content-center pb-3">
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-sm px-3"
                                    onClick={closeDeleteModal}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-danger btn-sm px-3"
                                    onClick={confirmDelete}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
        .action-btn {
          width: 28px;
          height: 28px;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
        }
        @media (max-width: 576px) {
          .action-btn {
            width: 24px;
            height: 24px;
          }
        }
        .table-responsive {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        @media (max-width: 768px) {
          .container-fluid {
            padding-left: 0.75rem !important;
            padding-right: 0.75rem !important;
          }
        }
        .card {
          border: none;
          box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075) !important;
        }
        .table th {
          border-bottom: 2px solid #dee2e6;
          font-weight: 600;
          white-space: nowrap;
        }
        .table td {
          vertical-align: middle;
          white-space: nowrap;
        }
        .form-control, .form-select {
          border-radius: 0.375rem !important;
        }
        .btn {
          border-radius: 0.375rem;
          font-weight: 500;
        }
        .modal-header {
          border-radius: 0.375rem 0.375rem 0 0;
        }
        .modal-footer {
          border-radius: 0 0 0.375rem 0.375rem;
        }
        @media (max-width: 576px) {
          .modal-dialog {
            margin: 0.25rem;
            max-width: calc(100% - 0.5rem);
          }
          .modal-content {
            border-radius: 0.375rem;
          }
          .modal-body {
            padding: 1rem !important;
          }
        }
      `}</style>
        </div>
    );
};

export default ReceptionistHouseKeepingAttendanceCheckOut;