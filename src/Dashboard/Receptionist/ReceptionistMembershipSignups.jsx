import React, { useState } from 'react';
import { FaBell, FaCalendarAlt, FaUserCheck, FaExclamationTriangle, FaRedo, FaEnvelope, FaPlus, FaFilter, FaFileExport, FaSearch } from 'react-icons/fa';

const ReceptionistMembershipSignups = () => {
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isRenewalModalOpen, setIsRenewalModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination state
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Sample data
  const [members, setMembers] = useState([
    {
      id: 1,
      member_name: "Alex Johnson",
      member_id: "MBR-001",
      membership_plan: "Premium Annual",
      plan_start_date: "2024-06-15",
      plan_end_date: "2025-06-14",
      reminder_sent: false,
      reminder_date: null,
      follow_up_needed: true,
      contact_email: "alex.johnson@example.com",
      contact_phone: "+91 98765 43210"
    },
    {
      id: 2,
      member_name: "Priya Patel",
      member_id: "MBR-002",
      membership_plan: "Basic Monthly",
      plan_start_date: "2025-03-01",
      plan_end_date: "2025-04-30",
      reminder_sent: true,
      reminder_date: "2025-04-10",
      follow_up_needed: false,
      contact_email: "priya.patel@example.com",
      contact_phone: "+91 91234 56789"
    },
    {
      id: 3,
      member_name: "Amit Verma",
      member_id: "MBR-003",
      membership_plan: "Student Plan",
      plan_start_date: "2024-09-01",
      plan_end_date: "2025-05-31",
      reminder_sent: false,
      reminder_date: null,
      follow_up_needed: true,
      contact_email: "amit.verma@example.com",
      contact_phone: "+91 88888 77777"
    },
    {
      id: 4,
      member_name: "Sarah Kim",
      member_id: "MBR-004",
      membership_plan: "Corporate Package",
      plan_start_date: "2024-12-01",
      plan_end_date: "2025-05-31",
      reminder_sent: true,
      reminder_date: "2025-04-15",
      follow_up_needed: true,
      contact_email: "sarah.kim@example.com",
      contact_phone: "+91 77777 66666"
    },
    {
      id: 5,
      member_name: "Michael Brown",
      member_id: "MBR-005",
      membership_plan: "Weekend Warrior",
      plan_start_date: "2025-02-15",
      plan_end_date: "2025-05-14",
      reminder_sent: false,
      reminder_date: null,
      follow_up_needed: false,
      contact_email: "michael.brown@example.com",
      contact_phone: "+91 66666 55555"
    }
  ]);
  
  // Membership plans for dropdown
  const membershipPlans = [
    "Basic Monthly",
    "Premium Annual",
    "Student Plan",
    "Weekend Warrior",
    "Corporate Package"
  ];
  
  // Filter members based on search query
  const filteredMembers = members.filter(member => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      member.member_name.toLowerCase().includes(query) ||
      member.member_id.toLowerCase().includes(query) ||
      member.membership_plan.toLowerCase().includes(query)
    );
  });
  
  // Pagination logic
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = filteredMembers.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(filteredMembers.length / entriesPerPage);
  
  // Handle entries per page change
  const handleEntriesChange = (e) => {
    setEntriesPerPage(parseInt(e.target.value));
    setCurrentPage(1); // Reset to first page when entries per page changes
  };
  
  // Handle page change
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  // Navigation functions
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleSendReminder = (member) => {
    setSelectedMember(member);
    setIsReminderModalOpen(true);
  };
  
  const handleCreateRenewal = (member) => {
    setSelectedMember(member);
    setIsRenewalModalOpen(true);
  };
  
  const confirmSendReminder = () => {
    if (selectedMember) {
      const updatedMembers = members.map(m => 
        m.id === selectedMember.id 
          ? { 
              ...m, 
              reminder_sent: true, 
              reminder_date: new Date().toISOString().split('T')[0] 
            } 
          : m
      );
      setMembers(updatedMembers);
      alert(`Reminder sent to ${selectedMember.member_name} successfully!`);
    }
    setIsReminderModalOpen(false);
    setSelectedMember(null);
  };
  
  const confirmCreateRenewal = () => {
    if (selectedMember) {
      // In a real app, this would create a new membership record
      // For demo purposes, we'll just extend current membership
      const updatedMembers = members.map(m => 
        m.id === selectedMember.id 
          ? { 
              ...m, 
              plan_end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
              reminder_sent: false,
              reminder_date: null,
              follow_up_needed: false
            } 
          : m
      );
      setMembers(updatedMembers);
      alert(`Renewal record created for ${selectedMember.member_name}! Membership extended by one year.`);
    }
    setIsRenewalModalOpen(false);
    setSelectedMember(null);
  };
  
  const closeReminderModal = () => {
    setIsReminderModalOpen(false);
    setSelectedMember(null);
  };
  
  const closeRenewalModal = () => {
    setIsRenewalModalOpen(false);
    setSelectedMember(null);
  };
  
  // Prevent background scroll
  React.useEffect(() => {
    if (isReminderModalOpen || isRenewalModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isReminderModalOpen, isRenewalModalOpen]);
  
  // Calculate days until expiration
  const getDaysUntilExpiration = (endDate) => {
    const today = new Date();
    const expiration = new Date(endDate);
    const diffTime = expiration - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  
  // Get expiration status badge
  const getExpirationBadge = (days) => {
    if (days < 0) {
      return <span className="badge rounded-pill bg-danger-subtle text-danger-emphasis px-3 py-1">Expired</span>;
    } else if (days <= 7) {
      return <span className="badge rounded-pill bg-danger-subtle text-danger-emphasis px-3 py-1">Expires Soon</span>;
    } else if (days <= 30) {
      return <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis px-3 py-1">Expiring Soon</span>;
    } else {
      return <span className="badge rounded-pill bg-success-subtle text-success-emphasis px-3 py-1">Active</span>;
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Mobile Card Component
  const MemberCard = ({ member }) => {
    const daysUntilExpiration = getDaysUntilExpiration(member.plan_end_date);
    
    return (
      <div className="card mb-3 shadow-sm border-0">
        <div className="card-body p-3">
          {/* Header with name and actions */}
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div className="flex-grow-1">
              <h5 className="card-title mb-1 fw-bold">{member.member_name}</h5>
              <div className="small text-muted">{member.member_id}</div>
            </div>
            <div className="d-flex gap-1">
              <button
                className="btn btn-sm btn-outline-primary"
                title="Send Reminder"
                onClick={() => handleSendReminder(member)}
                disabled={member.reminder_sent}
              >
                <FaEnvelope size={14} />
              </button>
              <button
                className="btn btn-sm"
                title="Create Renewal Record"
                onClick={() => handleCreateRenewal(member)}
                style={{
                  backgroundColor: '#6EB2CC',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                }}
              >
                <FaRedo size={14} />
              </button>
            </div>
          </div>
          
          {/* Membership Details */}
          <div className="row g-2 mb-3">
            <div className="col-12">
              <div className="d-flex align-items-center p-2 bg-light rounded">
                <span className="text-muted me-2">Plan:</span>
                <span className="fw-medium">{member.membership_plan}</span>
              </div>
            </div>
            <div className="col-12">
              <div className="d-flex align-items-center p-2 bg-light rounded">
                <span className="text-muted me-2">End Date:</span>
                <span className="fw-medium">{formatDate(member.plan_end_date)}</span>
                <div className="ms-auto">
                  {getExpirationBadge(daysUntilExpiration)}
                </div>
              </div>
            </div>
          </div>
          
          {/* Status Indicators */}
          <div className="row g-2">
            <div className="col-6">
              <div className="p-2 bg-light rounded">
                <div className="small text-muted">Reminder</div>
                <div>
                  {member.reminder_sent ? (
                    <span className="badge rounded-pill bg-success-subtle text-success-emphasis px-2 py-1">
                      Sent
                    </span>
                  ) : (
                    <span className="badge rounded-pill bg-secondary-subtle text-secondary-emphasis px-2 py-1">
                      Not Sent
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="col-6">
              <div className="p-2 bg-light rounded">
                <div className="small text-muted">Follow Up</div>
                <div>
                  {member.follow_up_needed ? (
                    <span className="badge rounded-pill bg-danger-subtle text-danger-emphasis px-2 py-1">
                      Needed
                    </span>
                  ) : (
                    <span className="badge rounded-pill bg-success-subtle text-success-emphasis px-2 py-1">
                      Not Needed
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Reminder Date */}
          {member.reminder_date && (
            <div className="mt-2">
              <div className="small text-muted">Reminder Date: {formatDate(member.reminder_date)}</div>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="container-fluid p-3 p-md-4">
      {/* Header */}
      <div className="row mb-4 align-items-center">
        <div className="col-12 col-lg-8">
          <h2 className="fw-bold">Membership Renewal Reminders</h2>
          <p className="text-muted mb-0">Manage membership renewals and send reminders to members.</p>
        </div>
        <div className="col-12 col-lg-4 text-lg-end mt-3 mt-lg-0">
          <button
            className="btn d-flex align-items-center ms-auto w-100 w-lg-auto"
            style={{
              backgroundColor: '#6EB2CC',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              fontSize: '1rem',
              fontWeight: '500',
              transition: 'all 0.2s ease',
            }}
            onClick={() => {
              // In a real app, this would send reminders to all members with expiring memberships
              alert('Reminders sent to all members with expiring memberships!');
            }}
          >
            <FaEnvelope className="me-2" /> Send All Reminders
          </button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="row mb-4 g-3">
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body d-flex align-items-center">
              <div className="rounded-circle bg-primary bg-opacity-10 p-3 me-3">
                <FaUserCheck className="text-primary" size={24} />
              </div>
              <div>
                <h6 className="text-muted mb-1">Total Members</h6>
                <h4 className="mb-0 fw-bold">{members.length}</h4>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body d-flex align-items-center">
              <div className="rounded-circle bg-warning bg-opacity-10 p-3 me-3">
                <FaCalendarAlt className="text-warning" size={24} />
              </div>
              <div>
                <h6 className="text-muted mb-1">Expiring Soon</h6>
                <h4 className="mb-0 fw-bold">
                  {members.filter(m => {
                    const days = getDaysUntilExpiration(m.plan_end_date);
                    return days > 0 && days <= 30;
                  }).length}
                </h4>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body d-flex align-items-center">
              <div className="rounded-circle bg-success bg-opacity-10 p-3 me-3">
                <FaBell className="text-success" size={24} />
              </div>
              <div>
                <h6 className="text-muted mb-1">Reminders Sent</h6>
                <h4 className="mb-0 fw-bold">
                  {members.filter(m => m.reminder_sent).length}
                </h4>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body d-flex align-items-center">
              <div className="rounded-circle bg-danger bg-opacity-10 p-3 me-3">
                <FaExclamationTriangle className="text-danger" size={24} />
              </div>
              <div>
                <h6 className="text-muted mb-1">Follow Up Needed</h6>
                <h4 className="mb-0 fw-bold">
                  {members.filter(m => m.follow_up_needed).length}
                </h4>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Search & Actions */}
      <div className="row mb-4 g-3">
        <div className="col-12 col-md-6 col-lg-5">
          <div className="input-group">
            <span className="input-group-text bg-light border">
              <FaSearch className="text-muted" />
            </span>
            <input
              type="text"
              className="form-control border"
              placeholder="Search by member name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="col-6 col-md-3 col-lg-2">
          <button className="btn btn-outline-secondary w-100">
            <FaFilter className="me-1" /> <span className="d-none d-sm-inline">Filter</span>
          </button>
        </div>
        <div className="col-6 col-md-3 col-lg-2">
          <button className="btn btn-outline-secondary w-100">
            <FaFileExport className="me-1" /> <span className="d-none d-sm-inline">Export</span>
          </button>
        </div>
      </div>
      
      {/* Show Entries Dropdown */}
      <div className="row mb-3">
        <div className="col-12 col-md-6">
          <div className="d-flex align-items-center">
            <span className="me-2">Show</span>
            <select 
              className="form-select form-select-sm w-auto" 
              value={entriesPerPage}
              onChange={handleEntriesChange}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="ms-2">entries</span>
          </div>
        </div>
      </div>
      
      {/* Desktop Table View */}
      <div className="card shadow-sm border-0 d-none d-md-block">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th className="fw-semibold">MEMBER</th>
                <th className="fw-semibold">MEMBERSHIP PLAN</th>
                <th className="fw-semibold">PLAN END DATE</th>
                <th className="fw-semibold">REMINDER SENT</th>
                <th className="fw-semibold">REMINDER DATE</th>
                <th className="fw-semibold">FOLLOW UP NEEDED</th>
                <th className="fw-semibold text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {currentEntries.map((member) => {
                const daysUntilExpiration = getDaysUntilExpiration(member.plan_end_date);
                return (
                  <tr key={member.id}>
                    <td>
                      <div>
                        <strong>{member.member_name}</strong>
                        <div className="small text-muted">{member.member_id}</div>
                      </div>
                    </td>
                    <td>{member.membership_plan}</td>
                    <td>
                      <div className="d-flex flex-column">
                        <span>{formatDate(member.plan_end_date)}</span>
                        {getExpirationBadge(daysUntilExpiration)}
                      </div>
                    </td>
                    <td>
                      {member.reminder_sent ? (
                        <span className="badge rounded-pill bg-success-subtle text-success-emphasis px-3 py-1">
                          Yes
                        </span>
                      ) : (
                        <span className="badge rounded-pill bg-secondary-subtle text-secondary-emphasis px-3 py-1">
                          No
                        </span>
                      )}
                    </td>
                    <td>{formatDate(member.reminder_date)}</td>
                    <td>
                      {member.follow_up_needed ? (
                        <span className="badge rounded-pill bg-danger-subtle text-danger-emphasis px-3 py-1">
                          Yes
                        </span>
                      ) : (
                        <span className="badge rounded-pill bg-success-subtle text-success-emphasis px-3 py-1">
                          No
                        </span>
                      )}
                    </td>
                    <td className="text-center">
                      <button
                        className="btn btn-sm btn-outline-primary me-1"
                        title="Send Reminder"
                        onClick={() => handleSendReminder(member)}
                        disabled={member.reminder_sent}
                      >
                        <FaEnvelope size={14} />
                      </button>
                      <button
                        className="btn btn-sm"
                        title="Create Renewal Record"
                        onClick={() => handleCreateRenewal(member)}
                        style={{
                          backgroundColor: '#6EB2CC',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                        }}
                      >
                        <FaRedo size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Mobile Card View */}
      <div className="d-md-none">
        {currentEntries.length > 0 ? (
          currentEntries.map(member => (
            <MemberCard key={member.id} member={member} />
          ))
        ) : (
          <div className="text-center py-4">
            <p className="text-muted">No members found.</p>
          </div>
        )}
      </div>
      
      {/* Pagination */}
      <div className="row mt-3">
        <div className="col-12 col-md-5">
          <div className="d-flex align-items-center">
            <span>
              Showing {indexOfFirstEntry + 1} to {Math.min(indexOfLastEntry, filteredMembers.length)} of {filteredMembers.length} entries
            </span>
          </div>
        </div>
        <div className="col-12 col-md-7">
          <div className="d-flex justify-content-md-end justify-content-center mt-2 mt-md-0">
            <nav>
              <ul className="pagination mb-0">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={prevPage}>
                    Previous
                  </button>
                </li>
                <li className={`page-item ${currentPage === 1 ? 'active' : ''}`}>
                  <button className="page-link" onClick={() => paginate(1)}>
                    1
                  </button>
                </li>
                {totalPages > 1 && (
                  <li className={`page-item ${currentPage === 2 ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => paginate(2)}>
                      2
                    </button>
                  </li>
                )}
                {totalPages > 2 && (
                  <li className={`page-item ${currentPage === 3 ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => paginate(3)}>
                      3
                    </button>
                  </li>
                )}
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={nextPage}>
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
      
      {/* SEND REMINDER MODAL */}
      {isReminderModalOpen && (
        <div
          className="modal fade show"
          tabIndex="-1"
          style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={closeReminderModal}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Send Renewal Reminder</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeReminderModal}
                ></button>
              </div>
              <div className="modal-body text-center py-4">
                <div className="mb-3">
                  <FaEnvelope className="text-primary" size={50} />
                </div>
                <h5>Send Reminder to {selectedMember?.member_name}?</h5>
                <p className="text-muted">
                  This will send a renewal reminder to {selectedMember?.member_name} for their {selectedMember?.membership_plan} membership expiring on {selectedMember ? formatDate(selectedMember.plan_end_date) : ''}.<br />
                  The reminder will be sent to: <strong>{selectedMember?.contact_email}</strong>
                </p>
              </div>
              <div className="modal-footer border-0 justify-content-center pb-4">
                <button
                  type="button"
                  className="btn btn-outline-secondary px-4 w-100 w-sm-auto"
                  onClick={closeReminderModal}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary px-4 w-100 w-sm-auto"
                  onClick={confirmSendReminder}
                >
                  Send Reminder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* CREATE RENEWAL MODAL */}
      {isRenewalModalOpen && (
        <div
          className="modal fade show"
          tabIndex="-1"
          style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={closeRenewalModal}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Create Renewal Record</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeRenewalModal}
                ></button>
              </div>
              <div className="modal-body p-4">
                <div className="mb-4">
                  <h5 className="fw-bold">{selectedMember?.member_name}</h5>
                  <p className="text-muted mb-0">Member ID: {selectedMember?.member_id}</p>
                </div>
                <form>
                  {/* Current Membership Details */}
                  <div className="card mb-4 bg-light">
                    <div className="card-body">
                      <h6 className="fw-bold mb-3">Current Membership</h6>
                      <div className="row">
                        <div className="col-12 col-md-6 mb-2">
                          <p className="mb-1"><strong>Plan:</strong> {selectedMember?.membership_plan}</p>
                        </div>
                        <div className="col-12 col-md-6 mb-2">
                          <p className="mb-1"><strong>End Date:</strong> {selectedMember ? formatDate(selectedMember.plan_end_date) : ''}</p>
                        </div>
                        <div className="col-12 col-md-6 mb-2">
                          <p className="mb-1"><strong>Reminder Sent:</strong> {selectedMember?.reminder_sent ? 'Yes' : 'No'}</p>
                        </div>
                        <div className="col-12 col-md-6 mb-2">
                          <p className="mb-1"><strong>Follow Up Needed:</strong> {selectedMember?.follow_up_needed ? 'Yes' : 'No'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* New Membership Details */}
                  <h6 className="fw-bold mb-3">New Membership Details</h6>
                  
                  {/* Membership Plan */}
                  <div className="mb-3">
                    <label className="form-label">Membership Plan <span className="text-danger">*</span></label>
                    <select
                      className="form-select rounded-3"
                      defaultValue={selectedMember?.membership_plan || ''}
                    >
                      {membershipPlans.map(plan => (
                        <option key={plan} value={plan}>{plan}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Duration */}
                  <div className="mb-4">
                    <label className="form-label">Membership Duration <span className="text-danger">*</span></label>
                    <div className="d-flex flex-wrap gap-3">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="duration"
                          id="duration_1_month"
                          value="1_month"
                          defaultChecked
                        />
                        <label className="form-check-label" htmlFor="duration_1_month">
                          1 Month
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="duration"
                          id="duration_3_months"
                          value="3_months"
                        />
                        <label className="form-check-label" htmlFor="duration_3_months">
                          3 Months
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="duration"
                          id="duration_6_months"
                          value="6_months"
                        />
                        <label className="form-check-label" htmlFor="duration_6_months">
                          6 Months
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="duration"
                          id="duration_1_year"
                          value="1_year"
                        />
                        <label className="form-check-label" htmlFor="duration_1_year">
                          1 Year
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  {/* Buttons */}
                  <div className="d-flex flex-column flex-sm-row justify-content-end gap-2 mt-4">
                    <button
                      type="button"
                      className="btn btn-outline-secondary px-4 py-2 w-100 w-sm-auto"
                      onClick={closeRenewalModal}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn w-100 w-sm-auto"
                      style={{
                        backgroundColor: '#6EB2CC',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px 20px',
                        fontWeight: '500',
                      }}
                      onClick={confirmCreateRenewal}
                    >
                      Create Renewal Record
                    </button>
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

export default ReceptionistMembershipSignups;