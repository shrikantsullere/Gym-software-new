import React, { useState, useEffect } from 'react';
import { FaEye, FaEdit, FaTrashAlt, FaPlus, FaSearch, FaFilter, FaFileExport, FaExclamationTriangle, FaCheck, FaClock } from 'react-icons/fa';

const DutyRoster = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [modalType, setModalType] = useState('view');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [shiftType, setShiftType] = useState('Straight Shift');
  const [breaks, setBreaks] = useState([{ start: '', end: '' }]);
  const [roleFilter, setRoleFilter] = useState('All'); // 👈 Role Filter

  // 👇 STAFF MEMBERS WITH ROLE — NO BRANCH NEEDED
  const staffMembers = [
    { id: 101, name: "Alex Johnson", role: "Personal Trainer" },
    { id: 102, name: "Braidy Con", role: "Receptionist" },
    { id: 103, name: "Sarah Kim", role: "Housekeeping" },
    { id: 104, name: "Michael Brown", role: "General Trainer" },
    { id: 105, name: "Emily Davis", role: "Receptionist" }
  ];

  // Get unique roles for dropdown
  const allRoles = ['All', ...new Set(staffMembers.map(s => s.role))];

  // Sample managers (only for approval display)
  const managers = [
    { id: 201, name: "Manager Smith" },
    { id: 202, name: "Manager Johnson" },
    { id: 203, name: "Manager Williams" }
  ];

  // 👇 RECORDS — NO BRANCH FIELD ANYMORE!
  const [records, setRecords] = useState([
    {
      shift_id: 1,
      staff_id: 101,
      staff_name: "Alex Johnson",
      role: "Personal Trainer", // 👈 Role is now the key identifier
      shift_type: "Straight Shift",
      date: "2025-04-05",
      start_time: "2025-04-05T09:00:00",
      end_time: "2025-04-05T17:00:00",
      breaks: [],
      approved_by: 201,
      approved_by_name: "Manager Smith",
      approved_at: "2025-04-01T10:30:00",
      status: "Approved"
    },
    {
      shift_id: 2,
      staff_id: 102,
      staff_name: "Braidy Con",
      role: "Receptionist", // 👈 Role
      shift_type: "Break Shift",
      date: "2025-04-05",
      start_time: "2025-04-05T08:00:00",
      end_time: "2025-04-05T20:00:00",
      breaks: [
        { start: "2025-04-05T12:00:00", end: "2025-04-05T13:00:00" },
        { start: "2025-04-05T16:00:00", end: "2025-04-05T16:30:00" }
      ],
      approved_by: 201,
      approved_by_name: "Manager Smith",
      approved_at: "2025-04-01T11:15:00",
      status: "Approved"
    },
    {
      shift_id: 3,
      staff_id: 103,
      staff_name: "Sarah Kim",
      role: "Housekeeping", // 👈 Role
      shift_type: "Straight Shift",
      date: "2025-04-05",
      start_time: "2025-04-05T10:00:00",
      end_time: "2025-04-05T18:00:00",
      breaks: [],
      approved_by: null,
      approved_by_name: null,
      approved_at: null,
      status: "Scheduled"
    },
    {
      shift_id: 4,
      staff_id: 104,
      staff_name: "Michael Brown",
      role: "General Trainer", // 👈 Role
      shift_type: "Break Shift",
      date: "2025-04-06",
      start_time: "2025-04-06T07:00:00",
      end_time: "2025-04-06T19:00:00",
      breaks: [
        { start: "2025-04-06T12:30:00", end: "2025-04-06T13:30:00" }
      ],
      approved_by: null,
      approved_by_name: null,
      approved_at: null,
      status: "Scheduled"
    }
  ]);

  // Filter records based on search term AND role
  const filteredRecords = records.filter(record =>
    (record.staff_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     record.role.toLowerCase().includes(searchTerm.toLowerCase()) || // 👈 Search by Role
     record.status.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (roleFilter === 'All' || record.role === roleFilter) // 👈 Role Filter
  );

  const handleAddNew = () => {
    setModalType('add');
    setSelectedRecord(null);
    setShiftType('Straight Shift');
    setBreaks([{ start: '', end: '' }]);
    setIsModalOpen(true);
  };

  const handleView = (record) => {
    setModalType('view');
    setSelectedRecord(record);
    setShiftType(record.shift_type);
    setBreaks(record.breaks.length > 0 ? record.breaks : [{ start: '', end: '' }]);
    setIsModalOpen(true);
  };

  const handleEdit = (record) => {
    setModalType('edit');
    setSelectedRecord(record);
    setShiftType(record.shift_type);
    setBreaks(record.breaks.length > 0 ? record.breaks : [{ start: '', end: '' }]);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (record) => {
    setSelectedRecord(record);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedRecord) {
      setRecords(prev => prev.filter(r => r.shift_id !== selectedRecord.shift_id));
      alert(`Deleted shift record for ${selectedRecord.staff_name} (${selectedRecord.role}).`);
    }
    setIsDeleteModalOpen(false);
    setSelectedRecord(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
    setBreaks([{ start: '', end: '' }]);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedRecord(null);
  };

  // Prevent background scroll
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
    const badgeClasses = {
      Scheduled: "bg-warning text-dark",
      Approved: "bg-success text-white",
      Completed: "bg-info text-white"
    };
    return (
      <span className={`badge rounded-pill ${badgeClasses[status] || 'bg-secondary'} px-3 py-1`}>
        {status}
      </span>
    );
  };

  const getShiftTypeBadge = (type) => {
    const badgeClasses = {
      'Straight Shift': "bg-primary text-white",
      'Break Shift': "bg-info text-black"
    };
    return (
      <span className={`badge rounded-pill ${badgeClasses[type] || 'bg-secondary'} px-3 py-1`}>
        {type}
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const colors = {
      "Personal Trainer": "bg-primary",
      "Receptionist": "bg-info",
      "Housekeeping": "bg-secondary",
      "General Trainer": "bg-success"
    };
    return (
      <span className={`badge rounded-pill ${colors[role] || 'bg-light'} text-dark px-2 py-1 fs-7`}>
        {role}
      </span>
    );
  };

  const getModalTitle = () => {
    switch (modalType) {
      case 'add': return 'Add New Shift Allocation';
      case 'edit': return 'Edit Shift Allocation';
      case 'view':
      default: return 'View Shift Allocation';
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const formatTime = (timeString) => {
    if (!timeString) return <span className="text-muted">—</span>;
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return <span className="text-muted">—</span>;
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNextId = () => {
    return records.length > 0 ? Math.max(...records.map(r => r.shift_id)) + 1 : 1;
  };

  // Handle adding/removing breaks for Break Shift
  const addBreak = () => {
    setBreaks([...breaks, { start: '', end: '' }]);
  };

  const removeBreak = (index) => {
    if (breaks.length > 1) {
      const updatedBreaks = [...breaks];
      updatedBreaks.splice(index, 1);
      setBreaks(updatedBreaks);
    }
  };

  const handleBreakChange = (index, field, value) => {
    const updatedBreaks = [...breaks];
    updatedBreaks[index][field] = value;
    setBreaks(updatedBreaks);
  };

  // Handle form submission
  const handleFormSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    if (modalType === 'add') {
      const staffId = parseInt(formData.get('staff_id'));
      const staffData = staffMembers.find(s => s.id === staffId);
      if (!staffData) return alert("Invalid staff selection");

      const newRecord = {
        shift_id: getNextId(),
        staff_id: staffId,
        staff_name: staffData.name,
        role: staffData.role, // 👈 Auto-pick Role from staffMembers — NO BRANCH
        shift_type: formData.get('shift_type'),
        date: formData.get('date'),
        start_time: formData.get('start_time'),
        end_time: formData.get('end_time'),
        breaks: shiftType === 'Break Shift' ? breaks.filter(b => b.start && b.end) : [],
        approved_by: null,
        approved_by_name: null,
        approved_at: null,
        status: 'Scheduled'
      };
      setRecords(prev => [...prev, newRecord]);
      alert('New shift allocation added successfully!');
    } else if (modalType === 'edit') {
      const staffId = parseInt(formData.get('staff_id'));
      const staffData = staffMembers.find(s => s.id === staffId);
      if (!staffData) return alert("Invalid staff selection");

      const updatedRecord = {
        ...selectedRecord,
        staff_id: staffId,
        staff_name: staffData.name,
        role: staffData.role, // 👈 Update Role from staffMembers — NO BRANCH
        shift_type: formData.get('shift_type'),
        date: formData.get('date'),
        start_time: formData.get('start_time'),
        end_time: formData.get('end_time'),
        breaks: shiftType === 'Break Shift' ? breaks.filter(b => b.start && b.end) : [],
        status: formData.get('status') || selectedRecord.status
      };
      setRecords(prev =>
        prev.map(r => r.shift_id === selectedRecord.shift_id ? updatedRecord : r)
      );
      alert('Shift allocation updated successfully!');
    }
    closeModal();
  };

  // Handle approval of shift
  const approveShift = (record) => {
    const updatedRecord = {
      ...record,
      approved_by: 201,
      approved_by_name: "Manager Smith",
      approved_at: new Date().toISOString(),
      status: 'Approved'
    };
    setRecords(prev =>
      prev.map(r => r.shift_id === record.shift_id ? updatedRecord : r)
    );
    alert(`Shift for ${record.staff_name} (${record.role}) has been approved!`);
  };

  // Export CSV — NO BRANCH!
  const exportCSV = () => {
    const header = ["Date", "Staff Name", "Role", "Shift Type", "Start Time", "End Time", "Approved By", "Status"];
    const rows = filteredRecords.map(record => [
      record.date,
      record.staff_name,
      record.role,
      record.shift_type,
      formatTime(record.start_time),
      formatTime(record.end_time),
      record.approved_by_name || "-",
      record.status
    ]);
    const csv = [header, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `duty_roster_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="row mb-4 align-items-center">
        <div className="col-12 col-lg-8">
          <h2 className="fw-bold">Duty Roster Management</h2>
          <p className="text-muted mb-0">Manage staff shift allocations by role and shift type.</p>
        </div>
        <div className="col-12 col-lg-4 text-lg-end mt-3 mt-lg-0">
          <button
            className="btn w-100 w-md-auto"
          
            onClick={handleAddNew}
          >
            <FaPlus className="" /> New Shift
          </button>
        </div>
      </div>

      {/* Search, Role Filter & Actions */}
      <div className="row mb-4 g-3">
        <div className="col-12 col-md-6 col-lg-4">
          <div className="input-group">
            <span className="input-group-text bg-light border">
              <FaSearch className="text-muted" />
            </span>
            <input
              type="text"
              className="form-control border"
              placeholder="Search by staff name, role, or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-3">
          <label className="form-label">Filter by Role</label>
          <select
            className="form-select rounded-3"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            {allRoles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>

        <div className="col-6 col-md-3 col-lg-2">
          <button className="btn btn-outline-secondary w-100">
            <FaFilter className="me-1" /> Filter
          </button>
        </div>
        <div className="col-6 col-md-3 col-lg-2">
          <button className="btn btn-outline-secondary w-100" onClick={exportCSV}>
            <FaFileExport className="me-1" /> Export
          </button>
        </div>
      </div>

      {/* Table — NO BRANCH COLUMN! */}
      <div className="card shadow-sm border-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th className="fw-semibold">DATE</th>
                <th className="fw-semibold">STAFF NAME</th>
                <th className="fw-semibold">ROLE</th> {/* 👈 Role is now central */}
                <th className="fw-semibold">SHIFT TYPE</th>
                <th className="fw-semibold">START TIME</th>
                <th className="fw-semibold">END TIME</th>
                <th className="fw-semibold">APPROVED BY</th>
                <th className="fw-semibold">STATUS</th>
                <th className="fw-semibold text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <tr key={record.shift_id}>
                  <td>{formatDate(record.date)}</td>
                  <td><strong>{record.staff_name}</strong></td>
                  <td>{getRoleBadge(record.role)}</td> {/* 👈 Role Badge */}
                  <td>{getShiftTypeBadge(record.shift_type)}</td>
                  <td>{formatTime(record.start_time)}</td>
                  <td>{formatTime(record.end_time)}</td>
                  <td>{record.approved_by_name || <span className="text-muted">—</span>}</td>
                  <td>{getStatusBadge(record.status)}</td>
                  <td className="text-center">
                    <div className="btn-group" role="group">
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        title="View"
                        onClick={() => handleView(record)}
                      >
                        <FaEye size={14} />
                      </button>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        title="Edit"
                        onClick={() => handleEdit(record)}
                      >
                        <FaEdit size={14} />
                      </button>
                      {record.status !== 'Approved' && (
                        <button
                          className="btn btn-sm btn-outline-success"
                          title="Approve"
                          onClick={() => approveShift(record)}
                        >
                          <FaCheck size={14} />
                        </button>
                      )}
                      <button
                        className="btn btn-sm btn-outline-danger"
                        title="Delete"
                        onClick={() => handleDeleteClick(record)}
                      >
                        <FaTrashAlt size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MAIN MODAL (Add/Edit/View) — NO BRANCH FIELDS! */}
      {isModalOpen && (
        <div
          className="modal fade show"
          tabIndex="-1"
          style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={closeModal}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
            key={selectedRecord ? selectedRecord.shift_id : 'add'}
          >
            <div className="modal-content">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">{getModalTitle()}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeModal}
                ></button>
              </div>
              <div className="modal-body p-4">
                <form onSubmit={handleFormSubmit}>
                  {/* Staff & Role (Auto-filled from selection) */}
                  <div className="row mb-3 g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label">Staff Member <span className="text-danger">*</span></label>
                      <select
                        name="staff_id"
                        className="form-select rounded-3"
                        defaultValue={selectedRecord?.staff_id || ''}
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

                    {/* Display Selected Role (Read-only in View/Edit) */}
                    <div className="col-12 col-md-6">
                      <label className="form-label">Assigned Role</label>
                      <input
                        type="text"
                        className="form-control rounded-3"
                        defaultValue={selectedRecord?.role || ''}
                        readOnly
                        style={{ backgroundColor: '#f8f9fa' }}
                      />
                    </div>
                  </div>

                  {/* Shift Type & Date */}
                  <div className="row mb-3 g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label">Shift Type <span className="text-danger">*</span></label>
                      <select
                        name="shift_type"
                        className="form-select rounded-3 "
                        defaultValue={selectedRecord?.shift_type || 'Straight Shift'}
                        disabled={modalType === 'view'}
                        onChange={(e) => setShiftType(e.target.value)}
                        required
                      >
                        <option value="Straight Shift">Straight Shift</option>
                        <option value="Break Shift"  className='text-black'>Break Shift</option>
                      </select>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">Date <span className="text-danger">*</span></label>
                      <input
                        name="date"
                        type="date"
                        className="form-control rounded-3"
                        defaultValue={selectedRecord?.date || new Date().toISOString().split('T')[0]}
                        readOnly={modalType === 'view'}
                        required
                      />
                    </div>
                  </div>

                  {/* Start & End Time */}
                  <div className="row mb-3 g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label">Start Time <span className="text-danger">*</span></label>
                      <input
                        name="start_time"
                        type="datetime-local"
                        className="form-control rounded-3"
                        defaultValue={selectedRecord?.start_time || ''}
                        readOnly={modalType === 'view'}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">End Time <span className="text-danger">*</span></label>
                      <input
                        name="end_time"
                        type="datetime-local"
                        className="form-control rounded-3"
                        defaultValue={selectedRecord?.end_time || ''}
                        readOnly={modalType === 'view'}
                        required
                      />
                    </div>
                  </div>

                  {/* Breaks for Break Shift */}
                  {shiftType === 'Break Shift' && (
                    <div className="mb-3">
                      <label className="form-label d-flex justify-content-between align-items-center">
                        Breaks
                        {modalType !== 'view' && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={addBreak}
                          >
                            <FaPlus size={12} /> Add Break
                          </button>
                        )}
                      </label>
                      {breaks.map((breakItem, index) => (
                        <div key={index} className="row g-2 mb-2">
                          <div className="col-12 col-md-5">
                            <input
                              type="datetime-local"
                              className="form-control form-control-sm"
                              placeholder="Break Start"
                              value={breakItem.start}
                              onChange={(e) => handleBreakChange(index, 'start', e.target.value)}
                              readOnly={modalType === 'view'}
                            />
                          </div>
                          <div className="col-12 col-md-5">
                            <input
                              type="datetime-local"
                              className="form-control form-control-sm"
                              placeholder="Break End"
                              value={breakItem.end}
                              onChange={(e) => handleBreakChange(index, 'end', e.target.value)}
                              readOnly={modalType === 'view'}
                            />
                          </div>
                          {modalType !== 'view' && breaks.length > 1 && (
                            <div className="col-12 col-md-2 d-flex align-items-center">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger w-100"
                                onClick={() => removeBreak(index)}
                              >
                                <FaTrashAlt size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Status (for edit mode) */}
                  {modalType === 'edit' && (
                    <div className="mb-3">
                      <label className="form-label">Status</label>
                      <select
                        name="status"
                        className="form-select rounded-3"
                        defaultValue={selectedRecord?.status || 'Scheduled'}
                      >
                        <option value="Scheduled">Scheduled</option>
                        <option value="Approved">Approved</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  )}

                  {/* Approval Info (for view mode) */}
                  {modalType === 'view' && selectedRecord?.approved_by && (
                    <div className="mb-3 p-3 bg-light rounded">
                      <h6 className="fw-bold">Approval Information</h6>
                      <div className="row">
                        <div className="col-12 col-md-6 mb-2 mb-md-0">
                          <small className="text-muted">Approved By:</small>
                          <p className="mb-0">{selectedRecord.approved_by_name}</p>
                        </div>
                        <div className="col-12 col-md-6">
                          <small className="text-muted">Approved At:</small>
                          <p className="mb-0">{formatDateTime(selectedRecord.approved_at)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                    <button
                      type="button"
                      className="btn btn-outline-secondary px-4 py-2"
                      onClick={closeModal}
                    >
                      Cancel
                    </button>
                    {modalType !== 'view' && (
                      <button
                        type="submit"
                        className="btn"
                        style={{
                          backgroundColor: '#6EB2CC',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '10px 20px',
                          fontWeight: '500',
                        }}
                      >
                        {modalType === 'add' ? 'Add Shift' : 'Save Changes'}
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
          >
            <div className="modal-content">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Confirm Deletion</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeDeleteModal}
                ></button>
              </div>
              <div className="modal-body text-center py-4">
                <div className="display-6 text-danger mb-3">
                  <FaExclamationTriangle />
                </div>
                <h5>Are you sure?</h5>
                <p className="text-muted">
                  This will permanently delete the shift allocation for <strong>{selectedRecord?.staff_name}</strong> ({selectedRecord?.role}) on <strong>{selectedRecord ? formatDate(selectedRecord.date) : ''}</strong>.<br />
                  This action cannot be undone.
                </p>
              </div>
              <div className="modal-footer border-0 justify-content-center pb-4">
                <div className="d-grid gap-2 d-sm-flex justify-content-sm-center col-12">
                  <button
                    type="button"
                    className="btn btn-outline-secondary px-4"
                    onClick={closeDeleteModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger px-4"
                    onClick={confirmDelete}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DutyRoster;