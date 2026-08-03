import React, { useState, useEffect } from 'react';
import { Card, Spinner, Alert, Badge } from 'react-bootstrap';
import { FaSearch, FaCalendarAlt, FaFileExcel, FaDownload, FaUser } from 'react-icons/fa';
import axiosInstance from '../Api/axiosInstance';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

const AttendanceHistory = () => {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(1); // First day of current month
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => {
        const d = new Date();
        return d.toISOString().split('T')[0]; // Today
    });

    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const branchId = userData.branchId || 'all';

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchAttendance = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Use the updated daily endpoint which supports startDate and endDate
            const response = await axiosInstance.get(`/memberattendence/daily`, {
                params: {
                    branchId,
                    startDate,
                    endDate,
                    search: searchTerm || undefined
                }
            });

            if (response.data.success) {
                setAttendance(response.data.attendance || []);
            } else {
                setError(response.data.message || 'Failed to fetch attendance');
            }
        } catch (err) {
            console.error("Error fetching attendance:", err);
            setError('An error occurred while fetching attendance records.');
        } finally {
            setLoading(false);
        }
    };

    // Use debouncing for search
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchAttendance();
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [startDate, endDate, searchTerm]);

    const totalPages = Math.ceil(attendance.length / itemsPerPage);
    const indexOfLast = currentPage * itemsPerPage;
    const indexOfFirst = indexOfLast - itemsPerPage;
    const currentAttendance = attendance.slice(indexOfFirst, indexOfLast);

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const handleExportExcel = () => {
        if (attendance.length === 0) return;

        const exportData = attendance.map(record => ({
            'Date': format(new Date(record.checkIn), 'dd MMM yyyy'),
            'Member Name': record.fullName || 'Unknown',
            'Check-In Time': format(new Date(record.checkIn), 'hh:mm a'),
            'Check-Out Time': record.checkOut ? format(new Date(record.checkOut), 'hh:mm a') : 'N/A',
            'Status': record.computedStatus || (record.checkOut ? 'Completed' : 'Active'),
            'Mode': record.mode || 'Manual'
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Attendance");
        XLSX.writeFile(wb, `Attendance_Report_${startDate}_to_${endDate}.xlsx`);
    };

    const formatTime = (dateString) => {
        if (!dateString) return '-';
        return format(new Date(dateString), 'hh:mm a');
    };

    const getStatusBadge = (status) => {
        if (status === 'Active') return <Badge bg="primary">Active (In Gym)</Badge>;
        if (status === 'Completed') return <Badge bg="success">Completed</Badge>;
        return <Badge bg="secondary">{status}</Badge>;
    };

    return (
        <div className="container-fluid py-4 bg-light min-vh-100">
            <div className="row mb-4 align-items-center">
                <div className="col-12 col-md-6 mb-3 mb-md-0">
                    <h2 className="mb-1 text-primary fw-bold">Attendance History</h2>
                    <p className="text-muted mb-0">View, search, and export attendance records</p>
                </div>
                <div className="col-12 col-md-6 text-md-end">
                    <button 
                        className="btn btn-success d-flex align-items-center justify-content-center mx-auto mx-md-0 ms-md-auto"
                        onClick={handleExportExcel}
                        disabled={attendance.length === 0 || loading}
                    >
                        <FaFileExcel className="me-2" /> Export to Excel
                    </button>
                </div>
            </div>

            <div className="card shadow-sm border-0 mb-4 rounded-3">
                <div className="card-header bg-white border-bottom py-3">
                    <div className="row g-3 align-items-center">
                        <div className="col-12 col-md-4">
                            <div className="input-group">
                                <span className="input-group-text bg-light border-end-0">
                                    <FaSearch className="text-muted" />
                                </span>
                                <input
                                    type="text"
                                    className="form-control border-start-0 ps-0 bg-light"
                                    placeholder="Search by member name or phone..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="col-12 col-md-8">
                            <div className="d-flex flex-wrap gap-2 justify-content-md-end align-items-center">
                                <div className="d-flex align-items-center">
                                    <label className="me-2 text-muted small mb-0">From:</label>
                                    <input 
                                        type="date" 
                                        className="form-control form-control-sm"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>
                                <div className="d-flex align-items-center">
                                    <label className="me-2 text-muted small mb-0">To:</label>
                                    <input 
                                        type="date" 
                                        className="form-control form-control-sm"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card-body p-0">
                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-2 text-muted">Loading attendance...</p>
                        </div>
                    ) : error ? (
                        <div className="p-4">
                            <Alert variant="danger">{error}</Alert>
                        </div>
                    ) : attendance.length === 0 ? (
                        <div className="text-center py-5">
                            <FaDownload className="text-muted mb-3" size={40} opacity={0.5} />
                            <h5 className="text-muted">No attendance records found</h5>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light text-muted">
                                    <tr>
                                        <th className="fw-medium px-4 py-3">Date</th>
                                        <th className="fw-medium py-3">Member</th>
                                        <th className="fw-medium py-3">Check In</th>
                                        <th className="fw-medium py-3">Check Out</th>
                                        <th className="fw-medium py-3">Status</th>
                                        <th className="fw-medium py-3">Mode</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentAttendance.map(record => (
                                        <tr key={record.id}>
                                            <td className="px-4">
                                                <div className="d-flex align-items-center">
                                                    <FaCalendarAlt className="text-muted me-2" size={14} />
                                                    {format(new Date(record.checkIn), 'dd MMM yyyy')}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <div className="bg-primary bg-opacity-10 text-primary rounded-circle p-2 me-3">
                                                        <FaUser size={14} />
                                                    </div>
                                                    <div>
                                                        <h6 className="mb-0">{record.fullName || 'Unknown'}</h6>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="fw-medium text-success">{formatTime(record.checkIn)}</span>
                                            </td>
                                            <td>
                                                <span className={record.checkOut ? "fw-medium text-danger" : "text-muted"}>
                                                    {formatTime(record.checkOut)}
                                                </span>
                                            </td>
                                            <td>
                                                {getStatusBadge(record.computedStatus)}
                                            </td>
                                            <td>
                                                <span className="text-muted small">{record.mode || 'Manual'}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {!loading && attendance.length > 0 && (
                    <div className="card-footer bg-white py-3 border-top d-flex flex-column flex-md-row justify-content-between align-items-center">
                        <span className="text-muted small mb-3 mb-md-0">
                            Showing {indexOfFirst + 1} to {Math.min(indexOfLast, attendance.length)} of {attendance.length} entries
                        </span>
                        <nav aria-label="Page navigation">
                            <ul className="pagination pagination-sm mb-0">
                                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                    <button className="page-link" onClick={() => goToPage(currentPage - 1)}>Previous</button>
                                </li>
                                {[...Array(totalPages)].map((_, index) => (
                                    <li key={index + 1} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
                                        <button className="page-link" onClick={() => goToPage(index + 1)}>
                                            {index + 1}
                                        </button>
                                    </li>
                                ))}
                                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                    <button className="page-link" onClick={() => goToPage(currentPage + 1)}>Next</button>
                                </li>
                            </ul>
                        </nav>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AttendanceHistory;
