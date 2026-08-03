import React, { useState, useEffect } from 'react';
import { FaEye, FaSearch, FaUser, FaCalendarAlt, FaFileExcel, FaDownload } from 'react-icons/fa';
import axiosInstance from '../../../Api/axiosInstance';
import * as XLSX from 'xlsx';
import { Spinner, Alert } from 'react-bootstrap';

const Membership = () => {
    const [payments, setPayments] = useState([]);
    const [filteredPayments, setFilteredPayments] = useState([]);
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

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const branchId = userData.branchId || 'all';
    const adminId = userData.roleId === 1 ? userData.id : (userData.adminId || userData.id);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await axiosInstance.get(`/payments/branch/${branchId}`, {
                params: {
                    adminId,
                    startDate,
                    endDate
                }
            });

            if (response.data.success) {
                setPayments(response.data.payments || []);
            } else {
                setError(response.data.message || 'Failed to fetch payments');
            }
        } catch (err) {
            console.error("Error fetching payments:", err);
            setError('An error occurred while fetching payment records.');
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch and fetch on date change
    useEffect(() => {
        fetchPayments();
    }, [startDate, endDate]);

    // Apply search filter locally
    useEffect(() => {
        if (!searchTerm) {
            setFilteredPayments(payments);
        } else {
            setFilteredPayments(
                payments.filter(p =>
                    (p.memberName && p.memberName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (p.invoiceNo && p.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()))
                )
            );
        }
        setCurrentPage(1); // Reset to first page on search
    }, [searchTerm, payments]);

    const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
    const indexOfLast = currentPage * itemsPerPage;
    const indexOfFirst = indexOfLast - itemsPerPage;
    const currentPayments = filteredPayments.slice(indexOfFirst, indexOfLast);

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const handleExportExcel = () => {
        if (filteredPayments.length === 0) return;

        const exportData = filteredPayments.map(p => ({
            'Invoice No': p.invoiceNo,
            'Date': new Date(p.paymentDate).toLocaleDateString(),
            'Member Name': p.memberName,
            'Plan Name': p.planName,
            'Amount Paid': p.amount,
            'Collected By': p.collectedByName,
            'Role': p.collectedByRole
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Payments");
        XLSX.writeFile(wb, `Payment_Report_${startDate}_to_${endDate}.xlsx`);
    };

    return (
        <div className="container-fluid py-4 bg-light min-vh-100">
            <div className="row mb-4 align-items-center">
                <div className="col-12 col-md-6 mb-3 mb-md-0">
                    <h2 className="mb-1 text-primary fw-bold">Payment History</h2>
                    <p className="text-muted mb-0">View, search, and export payment records</p>
                </div>
                <div className="col-12 col-md-6 text-md-end">
                    <button 
                        className="btn btn-success d-flex align-items-center justify-content-center mx-auto mx-md-0 ms-md-auto"
                        onClick={handleExportExcel}
                        disabled={filteredPayments.length === 0 || loading}
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
                                    placeholder="Search by member or invoice..."
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
                            <p className="mt-2 text-muted">Loading payments...</p>
                        </div>
                    ) : error ? (
                        <div className="p-4">
                            <Alert variant="danger">{error}</Alert>
                        </div>
                    ) : filteredPayments.length === 0 ? (
                        <div className="text-center py-5">
                            <FaDownload className="text-muted mb-3" size={40} opacity={0.5} />
                            <h5 className="text-muted">No payments found for this period</h5>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light text-muted">
                                    <tr>
                                        <th className="fw-medium px-4 py-3">Date</th>
                                        <th className="fw-medium py-3">Invoice No</th>
                                        <th className="fw-medium py-3">Member</th>
                                        <th className="fw-medium py-3">Plan</th>
                                        <th className="fw-medium py-3">Amount</th>
                                        <th className="fw-medium py-3">Payment Details</th>
                                        <th className="fw-medium py-3">Collected By</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentPayments.map(payment => (
                                        <tr key={payment.id + '-' + payment.invoiceNo}>
                                            <td className="px-4">
                                                <div className="d-flex align-items-center">
                                                    <FaCalendarAlt className="text-muted me-2" size={14} />
                                                    {new Date(payment.paymentDate).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td>
                                                <span className="badge bg-light text-dark border">
                                                    {payment.invoiceNo}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <div className="bg-primary bg-opacity-10 text-primary rounded-circle p-2 me-3">
                                                        <FaUser size={14} />
                                                    </div>
                                                    <div>
                                                        <h6 className="mb-0">{payment.memberName}</h6>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="text-secondary">{payment.planName}</span>
                                            </td>
                                            <td>
                                                <span className="fw-bold text-dark">₹{payment.amount}</span>
                                            </td>
                                            <td>
                                                <div className="d-flex flex-column">
                                                    <span className={`badge ${payment.paymentMode?.toLowerCase() === 'upi' ? 'bg-primary' : 'bg-success'} text-white mb-1`} style={{ width: 'fit-content' }}>
                                                        {payment.paymentMode || 'Cash'}
                                                    </span>
                                                    {payment.transactionId && (
                                                        <small className="text-muted text-break" style={{ fontSize: '0.75rem' }}>
                                                            UTR: {payment.transactionId}
                                                        </small>
                                                    )}
                                                    {payment.paymentProofImage && (
                                                        <a href={payment.paymentProofImage} target="_blank" rel="noopener noreferrer" className="small text-decoration-none mt-1" style={{ fontSize: '0.75rem' }}>
                                                            <FaDownload size={10} className="me-1" /> View Proof
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <span className="d-block small text-dark">{payment.collectedByName}</span>
                                                <span className="d-block small text-muted" style={{fontSize: '0.75rem'}}>{payment.collectedByRole}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {!loading && filteredPayments.length > 0 && (
                    <div className="card-footer bg-white py-3 border-top d-flex flex-column flex-md-row justify-content-between align-items-center">
                        <span className="text-muted small mb-3 mb-md-0">
                            Showing {indexOfFirst + 1} to {Math.min(indexOfLast, filteredPayments.length)} of {filteredPayments.length} entries
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

export default Membership;