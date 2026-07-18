import React, { useState, useEffect } from 'react';
import { FaMoneyBillWave, FaReceipt, FaCheck, FaUndo, FaEye, FaFileCsv, FaFilePdf, FaCalendarAlt, FaSearch, FaFilter, FaTags } from 'react-icons/fa';
import axiosInstance from '../../Api/axiosInstance';

const ReceptionistPaymentCollection = () => {
  const [activeTab, setActiveTab] = useState('payment'); // 'payment', 'attendance', 'plans'
  const [loading, setLoading] = useState(false);
  const [adminId, setAdminId] = useState(null);
  const [branchId, setBranchId] = useState(null);
  
  // Real Data States
  const [payments, setPayments] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [plans, setPlans] = useState([]);
  const [members, setMembers] = useState([]);
  
  // Payment Collection State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentModalType, setPaymentModalType] = useState('view'); // 'view', 'add'
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [newPayment, setNewPayment] = useState({
    memberId: "",
    planId: "",
    amount: "",
    paymentMode: "Cash", // Changed default to Cash
    status: "Pending",
    trainerName: ""
  });
  
  // Attendance Report State
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attendanceModalType, setAttendanceModalType] = useState('view'); // 'view', 'filter'
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  
  // Pagination states
  const [paymentEntriesPerPage, setPaymentEntriesPerPage] = useState(10);
  const [paymentCurrentPage, setPaymentCurrentPage] = useState(1);
  const [attendanceEntriesPerPage, setAttendanceEntriesPerPage] = useState(10);
  const [attendanceCurrentPage, setAttendanceCurrentPage] = useState(1);
  
  // Get User Details
  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const userObj = JSON.parse(userStr);
        setAdminId(userObj.adminId || userObj.id);
        setBranchId(userObj.branchId || "all");
      }
    } catch(e) {}
  }, []);

  // Fetch Data Based on Active Tab
  useEffect(() => {
    if(!adminId) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'payment') {
          // Fetch Payments
          const res = await axiosInstance.get(`/payment/branch/${branchId}?adminId=${adminId}`);
          if(res.data.success) setPayments(res.data.payments);
          
          // Fetch Members (for dropdown)
          const memRes = await axiosInstance.get(`/member/admin/${adminId}`);
          if(memRes.data.success) setMembers(memRes.data.members || memRes.data.data);
          
          // Fetch Plans (for dropdown)
          const planRes = await axiosInstance.get(`MemberPlan?adminId=${adminId}`);
          if(planRes.data.success) setPlans(planRes.data.plans);
          
        } else if (activeTab === 'attendance') {
          // Fetch Attendance
          const res = await axiosInstance.get(`/memberattendence/admin?adminId=${adminId}`);
          if(res.data.success) setAttendanceRecords(res.data.attendance);
          
        } else if (activeTab === 'plans') {
          // Fetch Plans View
          const planRes = await axiosInstance.get(`MemberPlan?adminId=${adminId}`);
          if(planRes.data.success) setPlans(planRes.data.plans);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [activeTab, adminId, branchId]);

  // Payment pagination logic
  const paymentIndexOfLastEntry = paymentCurrentPage * paymentEntriesPerPage;
  const paymentIndexOfFirstEntry = paymentIndexOfLastEntry - paymentEntriesPerPage;
  const currentPayments = payments.slice(paymentIndexOfFirstEntry, paymentIndexOfLastEntry);
  const paymentTotalPages = Math.max(1, Math.ceil(payments.length / paymentEntriesPerPage));
  
  // Attendance pagination logic
  const attendanceIndexOfLastEntry = attendanceCurrentPage * attendanceEntriesPerPage;
  const attendanceIndexOfFirstEntry = attendanceIndexOfLastEntry - attendanceEntriesPerPage;
  const currentAttendanceRecords = attendanceRecords.slice(attendanceIndexOfFirstEntry, attendanceIndexOfLastEntry);
  const attendanceTotalPages = Math.max(1, Math.ceil(attendanceRecords.length / attendanceEntriesPerPage));
  
  const handlePaymentEntriesChange = (e) => {
    setPaymentEntriesPerPage(parseInt(e.target.value));
    setPaymentCurrentPage(1);
  };
  
  const handleAttendanceEntriesChange = (e) => {
    setAttendanceEntriesPerPage(parseInt(e.target.value));
    setAttendanceCurrentPage(1);
  };
  
  const paymentPaginate = (pageNumber) => setPaymentCurrentPage(pageNumber);
  const attendancePaginate = (pageNumber) => setAttendanceCurrentPage(pageNumber);
  
  const paymentNextPage = () => { if (paymentCurrentPage < paymentTotalPages) setPaymentCurrentPage(prev => prev + 1); };
  const paymentPrevPage = () => { if (paymentCurrentPage > 1) setPaymentCurrentPage(prev => prev - 1); };
  
  const attendanceNextPage = () => { if (attendanceCurrentPage < attendanceTotalPages) setAttendanceCurrentPage(prev => prev + 1); };
  const attendancePrevPage = () => { if (attendanceCurrentPage > 1) setAttendanceCurrentPage(prev => prev - 1); };

  // Payment Handlers
  const [memberType, setMemberType] = useState('existing');
  const [selectedMemberDetails, setSelectedMemberDetails] = useState(null);

  const handleAddPayment = () => {
    setPaymentModalType('add');
    setSelectedPayment(null);
    setNewPayment({ memberId: "", planId: "", amount: "", paymentMode: "Razorpay", status: "Paid" });
    setSelectedMemberDetails(null);
    setMemberType('existing');
    setIsPaymentModalOpen(true);
  };

  const handleViewPayment = (payment) => {
    setPaymentModalType('view');
    setSelectedPayment(payment);
    setIsPaymentModalOpen(true);
  };

  const submitNewPayment = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        memberId: newPayment.memberId,
        planId: newPayment.planId,
        amount: newPayment.amount,
        paymentMode: newPayment.paymentMode,
        trainerName: newPayment.trainerName
      };
      const res = await axiosInstance.post("/payment/create", payload);
      if(res.data.success) {
        alert("Payment added successfully!");
        closePaymentModal();
        // Refresh Payments
        const refreshRes = await axiosInstance.get(`/payment/branch/${branchId}?adminId=${adminId}`);
        if(refreshRes.data.success) setPayments(refreshRes.data.payments);
      }
    } catch (error) {
      console.error("Payment submission failed:", error);
      alert("Failed to add payment. Please check details.");
    }
  };

  const closePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setSelectedPayment(null);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toFixed(2)}`;
  };

  // Get status badge for payments
  const getPaymentStatusBadge = () => {
    return (
      <span className={`badge rounded-pill bg-success-subtle text-success-emphasis px-3 py-1`}>
        Paid
      </span>
    );
  };

  // Get status badge for attendance
  const getAttendanceStatusBadge = (status) => {
    const s = status || "Present";
    const badgeClasses = {
      Present: "bg-success-subtle text-success-emphasis",
      "In Gym": "bg-primary-subtle text-primary-emphasis",
      Absent: "bg-danger-subtle text-danger-emphasis",
      Late: "bg-warning-subtle text-warning-emphasis",
      Completed: "bg-success-subtle text-success-emphasis"
    };
    return (
      <span className={`badge rounded-pill ${badgeClasses[s] || 'bg-secondary'} px-3 py-1`}>
        {s}
      </span>
    );
  };

  // Format date
  const formatDate = (dateString) => {
    if(!dateString) return "—";
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // When plan is selected, auto-fill amount
  const handlePlanSelect = (e) => {
    const selectedPlanId = e.target.value;
    const plan = plans.find(p => p.id.toString() === selectedPlanId);
    setNewPayment({
      ...newPayment, 
      planId: selectedPlanId,
      amount: plan ? plan.price : ""
    });
  };

  return (
    <div className="mt-2">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <h2 className="fw-bold">Payments & Invoicing</h2>
          <p className="text-muted mb-0">Manage payments, plans, and view attendance reports</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="row mb-4">
        <div className="col-12">
          <ul className="nav nav-tabs border-0 flex-nowrap overflow-auto" style={{ whiteSpace: 'nowrap' }}>
            <li className="nav-item">
              <button
                className={`nav-link px-4 ${activeTab === 'payment' ? 'active' : ''}`}
                style={activeTab === 'payment' ? { backgroundColor: '#218ebaff', color: 'white', borderRadius: '8px 8px 0 0' } : {}}
                onClick={() => setActiveTab('payment')}
              >
                <FaMoneyBillWave className="me-2" /> Payment Collection
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link px-4 ${activeTab === 'plans' ? 'active' : ''}`}
                style={activeTab === 'plans' ? { backgroundColor: '#218ebaff', color: 'white', borderRadius: '8px 8px 0 0' } : {}}
                onClick={() => setActiveTab('plans')}
              >
                <FaTags className="me-2" /> Subscription Plans
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link px-4 ${activeTab === 'attendance' ? 'active' : ''}`}
                style={activeTab === 'attendance' ? { backgroundColor: '#218ebaff', color: 'white', borderRadius: '8px 8px 0 0' } : {}}
                onClick={() => setActiveTab('attendance')}
              >
                <FaCalendarAlt className="me-2" /> Daily Attendance Report
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      {/* Tab Content */}
      {!loading && (
        <div className="row">
          <div className="col-12">
            {/* Payment Collection Tab */}
            {activeTab === 'payment' && (
              <div>
                <div className="row mb-4 align-items-center">
                  <div className="col-12 col-lg-8">
                    <h3 className="fw-bold">Payment Collection</h3>
                    <p className="text-muted mb-0">Manage member payments and receipts</p>
                  </div>
                  <div className="col-12 col-lg-4 text-lg-end mt-3 mt-lg-0">
                    <button
                      className="btn d-flex align-items-center justify-content-center col-12"
                      style={{ backgroundColor: '#6EB2CC', color: 'white', borderRadius: '8px', padding: '10px 20px', fontWeight: '500' }}
                      onClick={handleAddPayment}
                    >
                      <i className="fas fa-plus me-2"></i> Add Payment
                    </button>
                  </div>
                </div>

                {/* Show Entries Dropdown */}
                <div className="row mb-3">
                  <div className="col-12 col-md-6">
                    <div className="d-flex align-items-center">
                      <span className="me-2">Show</span>
                      <select className="form-select form-select-sm w-auto" value={paymentEntriesPerPage} onChange={handlePaymentEntriesChange}>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                      </select>
                      <span className="ms-2">entries</span>
                    </div>
                  </div>
                </div>

                {/* Payment Table */}
                <div className="card shadow-sm border-0">
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="bg-light">
                        <tr>
                          <th className="fw-semibold">MEMBER</th>
                          <th className="fw-semibold">PLAN</th>
                          <th className="fw-semibold">AMOUNT</th>
                          <th className="fw-semibold">STATUS</th>
                          <th className="fw-semibold">INVOICE</th>
                          <th className="fw-semibold">DATE</th>
                          <th className="fw-semibold">COLLECTED BY</th>
                          <th className="fw-semibold text-center">ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentPayments.length === 0 ? (
                          <tr><td colSpan="7" className="text-center py-4">No payments found</td></tr>
                        ) : currentPayments.map((payment) => (
                          <tr key={payment.id}>
                            <td><strong>{payment.memberName}</strong></td>
                            <td><span className="badge bg-secondary">{payment.planName || 'N/A'}</span></td>
                            <td><strong>{formatCurrency(payment.amount)}</strong></td>
                            <td>{getPaymentStatusBadge()}</td>
                            <td>{payment.invoiceNo}</td>
                            <td>{formatDate(payment.paymentDate)}</td>
                            <td>
                              <span className="badge bg-light text-dark border">
                                {payment.collectedByName ? `${payment.collectedByName} (${payment.collectedByRole || 'Staff'})` : 'Online/Admin'}
                              </span>
                            </td>
                            <td className="text-center">
                              <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => handleViewPayment(payment)}>
                                <FaEye size={14} /> View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Payment Pagination */}
                <div className="row mt-3">
                  <div className="col-12 col-md-5">
                    <span>Showing {Math.min(paymentIndexOfFirstEntry + 1, payments.length)} to {Math.min(paymentIndexOfLastEntry, payments.length)} of {payments.length} entries</span>
                  </div>
                  <div className="col-12 col-md-7">
                    <nav className="d-flex justify-content-md-end">
                      <ul className="pagination mb-0">
                        <li className={`page-item ${paymentCurrentPage === 1 ? 'disabled' : ''}`}>
                          <button className="page-link" onClick={paymentPrevPage}>Previous</button>
                        </li>
                        <li className="page-item active"><button className="page-link">{paymentCurrentPage}</button></li>
                        <li className={`page-item ${paymentCurrentPage === paymentTotalPages ? 'disabled' : ''}`}>
                          <button className="page-link" onClick={paymentNextPage}>Next</button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                </div>
              </div>
            )}

            {/* Subscription Plans Tab */}
            {activeTab === 'plans' && (
              <div>
                <div className="row mb-4 align-items-center">
                  <div className="col-12">
                    <h3 className="fw-bold">Subscription Plans</h3>
                    <p className="text-muted mb-0">Active plans available in the gym</p>
                  </div>
                </div>
                
                <div className="row">
                  {plans.length === 0 ? (
                    <div className="col-12 text-center py-4 text-muted">No subscription plans found.</div>
                  ) : plans.map(plan => (
                    <div key={plan.id} className="col-12 col-md-4 mb-4">
                      <div className="card h-100 shadow-sm border-0 border-top border-4" style={{ borderColor: '#6EB2CC' }}>
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="badge px-2 py-1" style={{ backgroundColor: '#6EB2CC', color: 'white', fontSize: "0.75rem" }}>
                              {plan.type ? plan.type.toUpperCase() : "GROUP"}
                            </span>
                            {(plan.status !== undefined) && (
                              <span className={`badge ${plan.status === 'Active' || plan.status === true ? 'bg-success' : 'bg-secondary'} px-2 py-1`} style={{ fontSize: "0.75rem" }}>
                                {plan.status === true || plan.status === 'Active' ? 'Active' : 'Inactive'}
                              </span>
                            )}
                          </div>
                          <h5 className="card-title fw-bold text-dark mb-1">{plan.name}</h5>
                          <h3 className="fw-bold my-3" style={{ color: '#1e293b' }}>₹{Number(plan.price).toLocaleString()}</h3>
                          <div className="mb-3 d-flex flex-wrap gap-2">
                            <span className="badge bg-light text-dark border">📅 Validity: {plan.validityDays || 0} Days</span>
                            {plan.sessions > 0 && <span className="badge bg-light text-dark border">🎯 {plan.sessions} Sessions</span>}
                            {plan.trainerType && <span className="badge bg-light text-dark border">👤 Trainer: {plan.trainerType}</span>}
                          </div>
                          {plan.description && <p className="text-muted small mb-0">{plan.description}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Daily Attendance Report Tab */}
            {activeTab === 'attendance' && (
              <div>
                <div className="row mb-4 align-items-center">
                  <div className="col-12">
                    <h3 className="fw-bold">Daily Attendance Report</h3>
                    <p className="text-muted mb-0">View member attendance records</p>
                  </div>
                </div>

                <div className="card shadow-sm border-0">
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="bg-light">
                        <tr>
                          <th className="fw-semibold">MEMBER NAME</th>
                          <th className="fw-semibold">DATE</th>
                          <th className="fw-semibold">ROLE</th>
                          <th className="fw-semibold">STATUS</th>
                          <th className="fw-semibold">MODE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentAttendanceRecords.length === 0 ? (
                          <tr><td colSpan="5" className="text-center py-4">No attendance records found</td></tr>
                        ) : currentAttendanceRecords.map((record) => (
                          <tr key={record.id}>
                            <td><strong>{record.name || 'Unknown'}</strong></td>
                            <td>{formatDate(record.checkIn || record.date)}</td>
                            <td>{record.role || 'Member'}</td>
                            <td>{getAttendanceStatusBadge(record.status)}</td>
                            <td>{record.mode || 'QR'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Attendance Pagination */}
                <div className="row mt-3">
                  <div className="col-12 col-md-5">
                    <span>Showing {Math.min(attendanceIndexOfFirstEntry + 1, attendanceRecords.length)} to {Math.min(attendanceIndexOfLastEntry, attendanceRecords.length)} of {attendanceRecords.length} entries</span>
                  </div>
                  <div className="col-12 col-md-7">
                    <nav className="d-flex justify-content-md-end">
                      <ul className="pagination mb-0">
                        <li className={`page-item ${attendanceCurrentPage === 1 ? 'disabled' : ''}`}>
                          <button className="page-link" onClick={attendancePrevPage}>Previous</button>
                        </li>
                        <li className="page-item active"><button className="page-link">{attendanceCurrentPage}</button></li>
                        <li className={`page-item ${attendanceCurrentPage === attendanceTotalPages ? 'disabled' : ''}`}>
                          <button className="page-link" onClick={attendanceNextPage}>Next</button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PAYMENT MODAL */}
      {isPaymentModalOpen && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={closePaymentModal}>
          <div className="modal-dialog modal-lg modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header border-bottom-0 pb-0">
                <h5 className="modal-title fw-bold">
                  {paymentModalType === 'add' ? 'Add New Payment' : 'Payment Details'}
                </h5>
                <button type="button" className="btn-close" onClick={closePaymentModal}></button>
              </div>
              <div className="modal-body p-4">
                <form onSubmit={paymentModalType === 'add' ? submitNewPayment : (e) => e.preventDefault()}>
                  
                  {/* Toggle New vs Existing Member */}
                  {paymentModalType === 'add' && (
                    <div className="d-flex mb-4 p-1 bg-light rounded-pill" style={{ width: 'max-content' }}>
                      <button 
                        type="button" 
                        className={`btn rounded-pill px-4 ${memberType === 'existing' ? 'btn-primary text-white' : 'btn-light text-muted'}`}
                        onClick={() => setMemberType('existing')}
                        style={{ backgroundColor: memberType === 'existing' ? '#6EB2CC' : 'transparent', borderColor: 'transparent' }}
                      >
                        Existing Member
                      </button>
                      <button 
                        type="button" 
                        className={`btn rounded-pill px-4 ${memberType === 'new' ? 'btn-primary text-white' : 'btn-light text-muted'}`}
                        onClick={() => setMemberType('new')}
                        style={{ backgroundColor: memberType === 'new' ? '#6EB2CC' : 'transparent', borderColor: 'transparent' }}
                      >
                        New Walk-in
                      </button>
                    </div>
                  )}

                  {memberType === 'new' && paymentModalType === 'add' ? (
                    <div className="alert alert-info border-0 rounded-3 d-flex align-items-center">
                      <div>
                        <h6 className="fw-bold mb-1">New Member Registration Required</h6>
                        <p className="mb-2 mb-0 text-muted small">Please complete the full registration process for new walk-in members before collecting payment. This ensures their profile, goal, and health details are properly recorded.</p>
                        <button type="button" className="btn btn-sm text-white px-4 mt-2" style={{ backgroundColor: '#6EB2CC' }} onClick={() => { closePaymentModal(); window.location.href = '/receptionist/walk-in-registration'; }}>Go to New Registration Page</button>
                      </div>
                    </div>
                  ) : (
                  <>
                  {/* Member & Plan */}
                  <div className="row mb-3 g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label">Select Member <span className="text-danger">*</span></label>
                      {paymentModalType === 'add' ? (
                        <>
                        <select 
                          className="form-select rounded-3 mb-2" 
                          required
                          value={newPayment.memberId}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNewPayment({...newPayment, memberId: val});
                            const mem = members.find(m => (m.id || m.userId).toString() === val);
                            setSelectedMemberDetails(mem || null);
                          }}
                        >
                          <option value="">-- Choose Member --</option>
                          {Array.isArray(members) && members.map(m => (
                            <option key={m.id || m.userId} value={m.id || m.userId}>{m.fullName} ({m.phone})</option>
                          ))}
                        </select>
                        {selectedMemberDetails && (
                          <div className="card bg-light border-0 rounded-3 mt-2">
                            <div className="card-body p-3 py-2 text-sm">
                              <div className="d-flex flex-column gap-1">
                                <div><strong className="text-secondary">Name:</strong> {selectedMemberDetails.fullName}</div>
                                <div><strong className="text-secondary">Phone:</strong> {selectedMemberDetails.phone}</div>
                                <div><strong className="text-secondary">Email:</strong> {selectedMemberDetails.email}</div>
                                <div><strong className="text-secondary">Gender:</strong> {selectedMemberDetails.gender || 'N/A'}</div>
                              </div>
                            </div>
                          </div>
                        )}
                        </>
                      ) : (
                        <input type="text" className="form-control rounded-3" value={selectedPayment?.memberName || ''} readOnly />
                      )}
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">Subscription Plan <span className="text-danger">*</span></label>
                      {paymentModalType === 'add' ? (
                        <select 
                          className="form-select rounded-3" 
                          required
                          value={newPayment.planId}
                          onChange={handlePlanSelect}
                        >
                          <option value="">-- Choose Plan --</option>
                          {plans.map(p => (
                            <option key={p.id} value={p.id}>{p.name} (₹{p.price})</option>
                          ))}
                        </select>
                      ) : (
                        <input type="text" className="form-control rounded-3" value={selectedPayment?.planName || 'N/A'} readOnly />
                      )}
                    </div>
                  </div>

                  {/* Amount & Mode */}
                  <div className="row mb-3 g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label">Amount (₹) <span className="text-danger">*</span></label>
                      <input
                        type="number"
                        className="form-control rounded-3"
                        value={paymentModalType === 'add' ? newPayment.amount : selectedPayment?.amount || ''}
                        onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})}
                        readOnly={paymentModalType === 'view'}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">Payment Mode <span className="text-danger">*</span></label>
                      <select
                        className="form-select rounded-3"
                        value={newPayment.paymentMode}
                        onChange={(e) => setNewPayment({...newPayment, paymentMode: e.target.value})}
                        disabled={paymentModalType === 'view'}
                      >
                        <option value="Razorpay">Razorpay</option>
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                        <option value="UPI">UPI</option>
                      </select>
                    </div>
                  </div>

                  {/* Status & Invoice (For View Mode) */}
                  {paymentModalType === 'add' && (
                    <div className="row mb-3">
                      <div className="col-12">
                        <label className="form-label">Assign Trainer (Optional)</label>
                        <input
                          type="text"
                          className="form-control rounded-3"
                          placeholder="e.g. Rahul (Personal Trainer) or General Trainer"
                          value={newPayment.trainerName || ''}
                          onChange={(e) => setNewPayment({...newPayment, trainerName: e.target.value})}
                        />
                      </div>
                    </div>
                  )}

                  {/* Status & Invoice (For View Mode) */}
                  {paymentModalType === 'view' && (
                    <div className="row mb-3 g-3">
                      <div className="col-12 col-md-4">
                        <label className="form-label">Invoice Number</label>
                        <input type="text" className="form-control rounded-3" value={selectedPayment?.invoiceNo || ''} readOnly />
                      </div>
                      <div className="col-12 col-md-4">
                        <label className="form-label">Payment Date</label>
                        <input type="text" className="form-control rounded-3" value={formatDate(selectedPayment?.paymentDate)} readOnly />
                      </div>
                      <div className="col-12 col-md-4">
                        <label className="form-label">Collected By</label>
                        <input type="text" className="form-control rounded-3" value={selectedPayment?.collectedByName ? `${selectedPayment.collectedByName} (${selectedPayment.collectedByRole || 'Staff'})` : 'Online/Admin'} readOnly />
                      </div>
                    </div>
                  )}
                  </>
                  )}

                  <div className="text-end mt-4">
                    <button type="button" className="btn btn-light me-2" onClick={closePaymentModal}>Close</button>
                    {paymentModalType === 'add' && (
                      <button type="submit" className="btn text-white px-4" style={{ backgroundColor: '#6EB2CC' }}>Save Payment</button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionistPaymentCollection;