import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Nav, Card, Table, Button, Modal, Spinner } from 'react-bootstrap';
import { FaEye, FaCalendar, FaClock, FaUser, FaRupeeSign, FaEnvelope, FaPhone } from 'react-icons/fa';
import axiosInstance from '../../Api/axiosInstance';

const PersonalPlansBookings = () => {
  const [selectedPlanTab, setSelectedPlanTab] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [allPlans, setAllPlans] = useState([]);
  const [planCustomers, setPlanCustomers] = useState({});
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [error, setError] = useState(null);

  // Extract adminId once from localStorage
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
  const name = user?.fullName || null;
  const staffId = user?.staffId || null;
  const adminId = user?.adminId || null;

  console.log('Member ID:', memberId);
  console.log('Admin ID:', adminId);
  console.log('Branch ID:', branchId);

  // Fetch plans on mount
  useEffect(() => {
    if (!adminId) return;

    const fetchPlans = async () => {
      try {
        const response = await axiosInstance.get(`personal-trainer-dashboard/admin/${adminId}/plans`);
        if (response.data.success && Array.isArray(response.data.plans)) {
          setAllPlans(response.data.plans);
        } else {
          setAllPlans([]);
        }
      } catch (err) {
        console.error('Error fetching plans:', err);
        setAllPlans([]);
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchPlans();
  }, [adminId]);

  // Filter ONLY PERSONAL trainer plans
  const personalPlans = useMemo(() => {
    return allPlans.filter(plan => plan.trainerType === 'personal');
  }, [allPlans]);

  // Fetch customers when a plan is selected
  useEffect(() => {
    if (!selectedPlanTab || !adminId) return;

    setLoadingCustomers(true);
    const fetchCustomers = async () => {
      try {
        const response = await axiosInstance.get(
          `personal-trainer-dashboard/admin/${adminId}/plan/${selectedPlanTab}/customers`
        );
        
        if (response.data.success && response.data.data && Array.isArray(response.data.data.members)) {
          // Fixed mapping to match API response structure
          const mappedCustomers = response.data.data.members.map((cust) => ({
            id: cust.id,
            name: cust.fullName,
            purchaseDate: cust.membershipFrom
              ? new Date(cust.membershipFrom).toISOString().split('T')[0]
              : 'N/A',
            expiryDate: cust.membershipTo
              ? new Date(cust.membershipTo).toISOString().split('T')[0]
              : 'N/A',
            // Use sessionInfo from API response
            totalSessions: cust.sessionInfo?.totalSessions || 0,
            sessionsBooked: cust.sessionInfo?.usedSessions || 0,
            sessionsRemaining: cust.sessionInfo?.remainingSessions || 0,
            contact: cust.phone || 'N/A',
            email: cust.email || 'N/A',
            status: cust.status || 'Unknown',
            gender: cust.gender || 'N/A',
            address: cust.address || 'N/A',
            joinDate: cust.joinDate ? new Date(cust.joinDate).toISOString().split('T')[0] : 'N/A',
            paymentMode: cust.paymentMode || 'N/A',
            amountPaid: cust.amountPaid || 0,
          }));

          setPlanCustomers((prev) => ({
            ...prev,
            [selectedPlanTab]: mappedCustomers,
          }));
        } else {
          setPlanCustomers((prev) => ({ ...prev, [selectedPlanTab]: [] }));
        }
      } catch (err) {
        console.error('Error fetching customers:', err);
        setPlanCustomers((prev) => ({ ...prev, [selectedPlanTab]: [] }));
      } finally {
        setLoadingCustomers(false);
      }
    };

    fetchCustomers();
  }, [selectedPlanTab, adminId]);

  const getCustomersForPlan = (planId) => {
    return planCustomers[planId] || [];
  };

  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    setShowCustomerModal(true);
  };

  const getStatusIndicator = (status, sessionsRemaining, expiryDate) => {
    // Use the actual status from API first, then fall back to calculated status
    if (status && status !== 'Unknown') {
      if (status.toLowerCase() === 'active') {
        return <span className="badge bg-success">Active</span>;
      } else if (status.toLowerCase() === 'expired') {
        return <span className="badge bg-danger">Expired</span>;
      } else if (status.toLowerCase() === 'completed') {
        return <span className="badge bg-secondary">Completed</span>;
      } else {
        return <span className="badge bg-info">{status}</span>;
      }
    }
    
    // Fallback to calculated status if API status is not available
    if (sessionsRemaining === 0) {
      return <span className="badge bg-secondary">Sessions Completed</span>;
    }
    if (expiryDate === 'N/A') {
      return <span className="badge bg-warning">No Expiry</span>;
    }
    const today = new Date();
    const expiry = new Date(expiryDate);
    if (expiry < today) {
      return <span className="badge bg-danger">Expired</span>;
    }
    return <span className="badge bg-success">Active</span>;
  };

  const getStatusColor = (status, sessionsRemaining, expiryDate) => {
    // Use the actual status from API first, then fall back to calculated status
    if (status && status !== 'Unknown') {
      if (status.toLowerCase() === 'active') {
        return { bg: '#d4edda', color: '#155724', border: '#c3e6cb' };
      } else if (status.toLowerCase() === 'expired') {
        return { bg: '#f8d7da', color: '#721c24', border: '#f5c6cb' };
      } else if (status.toLowerCase() === 'completed') {
        return { bg: '#e2e3e5', color: '#383d41', border: '#d6d8db' };
      } else {
        return { bg: '#d1ecf1', color: '#0c5460', border: '#bee5eb' };
      }
    }
    
    // Fallback to calculated status if API status is not available
    if (sessionsRemaining === 0) {
      return { bg: '#e2e3e5', color: '#383d41', border: '#d6d8db' };
    }
    if (expiryDate === 'N/A') {
      return { bg: '#fff3cd', color: '#856404', border: '#ffeeba' };
    }
    const today = new Date();
    const expiry = new Date(expiryDate);
    if (expiry < today) {
      return { bg: '#f8d7da', color: '#721c24', border: '#f5c6cb' };
    }
    return { bg: '#d4edda', color: '#155724', border: '#c3e6cb' };
  };

  if (loadingPlans) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-50">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className="bg-light py-2">
      <Container fluid className="px-2 px-md-3">
        <h1
          className="fw-bold text-dark mb-5"
          style={{
            color: "#2f6a87",
            fontSize: "clamp(1.2rem, 4vw, 1.8rem)",
          }}
        >
          Personal Training Plans & Bookings
        </h1>

        {/* Plans Cards — ONLY PERSONAL */}
        <div className="mb-3">
          <Row className="g-2 g-md-4">
            {personalPlans.length === 0 ? (
              <Col>
                <div className="text-center py-4 text-muted">No personal training plans available.</div>
              </Col>
            ) : (
              personalPlans.map((plan) => (
                <Col xs={12} sm={6} md={4} lg={3} xl={3} key={plan.id}>
                  <Card
                    className="h-100 shadow-sm border-0"
                    style={{
                      borderRadius: '12px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: selectedPlanTab === plan.id ? '2px solid #2f6a87' : '1px solid #e9ecef',
                    }}
                    onClick={() => setSelectedPlanTab(plan.id)}
                    onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-5px)')}
                    onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                  >
                    <div style={{ height: '6px', backgroundColor: '#2f6a87', width: '100%' }}></div>
                    <Card.Body className="d-flex flex-column p-2 p-md-3">
                      <div className="text-center mb-2 mb-md-3">
                        <div
                          className="badge p-2"
                          style={{
                            backgroundColor: '#2f6a87',
                            color: 'white',
                            fontSize: '0.7rem',
                            borderRadius: '50px',
                          }}
                        >
                          PERSONAL TRAINING
                        </div>
                        <h5
                          className="fw-bold mb-1 mt-2"
                          style={{ color: '#2f6a87', fontSize: '1rem' }}
                        >
                          {plan.name}
                        </h5>
                      </div>
                      <ul className="list-unstyled mb-2 mb-md-3 flex-grow-1">
                        <li className="mb-2 d-flex align-items-center gap-2">
                          <div className="bg-light rounded-circle p-1" style={{ width: '32px', height: '32px' }}>
                            <FaClock size={12} className="text-muted" />
                          </div>
                          <div>
                            <div className="fw-bold" style={{ fontSize: '0.9rem' }}>{plan.sessions} Sessions</div>
                          </div>
                        </li>
                        <li className="mb-2 d-flex align-items-center gap-2">
                          <div className="bg-light rounded-circle p-1" style={{ width: '32px', height: '32px' }}>
                            <FaCalendar size={12} className="text-muted" />
                          </div>
                          <div>
                            <div className="fw-bold" style={{ fontSize: '0.9rem' }}>
                              Validity: {plan.validityDays || 'N/A'} Days
                            </div>
                          </div>
                        </li>
                        <li className="mb-2 d-flex align-items-center gap-2">
                          <div className="bg-light rounded-circle p-1" style={{ width: '32px', height: '32px' }}>
                            <FaUser size={12} className="text-muted" />
                          </div>
                          <div>
                            <div className="fw-bold" style={{ fontSize: '0.9rem' }}>
                              {getCustomersForPlan(plan.id).length} Customer
                              {getCustomersForPlan(plan.id).length !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </li>
                        <li className="mb-2 d-flex align-items-center gap-2">
                          <div className="bg-light rounded-circle p-1" style={{ width: '32px', height: '32px' }}>
                            <FaRupeeSign size={12} className="text-muted" />
                          </div>
                          <div>
                            <div className="fw-bold" style={{ fontSize: '0.9rem' }}>
                              Price: ₹{(plan.price || 0).toLocaleString()}
                            </div>
                          </div>
                        </li>
                      </ul>
                      <div className="text-center">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPlanTab(plan.id);
                          }}
                          style={{
                            borderColor: '#2f6a87',
                            color: '#2f6a87',
                            fontSize: '0.8rem',
                          }}
                          onMouseOver={(e) => {
                            e.target.style.backgroundColor = '#2f6a87';
                            e.target.style.color = 'white';
                          }}
                          onMouseOut={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                            e.target.style.color = '#2f6a87';
                          }}
                        >
                          View Customers
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))
            )}
          </Row>
        </div>

        {/* Customer Section */}
        {selectedPlanTab && (
          <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
            <Card.Header className="bg-white border-0 pb-0">
              <Nav variant="tabs" className="border-bottom">
                <Nav.Item>
                  <Nav.Link
                    className="fs-6 px-3 py-2 fw-bold"
                    style={{ color: '#2f6a87', borderColor: '#2f6a87' }}
                  >
                    {personalPlans.find((p) => p.id === selectedPlanTab)?.name} Customers
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </Card.Header>

            <Card.Body className="p-2 p-md-3">
              <div className="mb-3 p-2 p-md-3 bg-light rounded">
                <h5 className="fw-bold mb-2" style={{ color: '#2f6a87', fontSize: '1rem' }}>
                  {personalPlans.find((p) => p.id === selectedPlanTab)?.name}
                </h5>
                <div className="d-flex flex-wrap gap-3 text-muted" style={{ fontSize: '0.85rem' }}>
                  <div className="d-flex align-items-center gap-1">
                    <FaClock size={14} />
                    <span>{personalPlans.find((p) => p.id === selectedPlanTab)?.sessions} Total Sessions</span>
                  </div>
                  <div className="d-flex align-items-center gap-1">
                    <FaCalendar size={14} />
                    <span>
                      {personalPlans.find((p) => p.id === selectedPlanTab)?.validityDays || 'N/A'} Days Validity
                    </span>
                  </div>
                  <div className="d-flex align-items-center gap-1">
                    <FaUser size={14} />
                    <span>{getCustomersForPlan(selectedPlanTab).length} Customers</span>
                  </div>
                </div>
              </div>

              <div className="table-responsive">
                {loadingCustomers ? (
                  <div className="text-center py-3">
                    <Spinner animation="border" size="sm" variant="primary" />
                    <span className="ms-2">Loading customers...</span>
                  </div>
                ) : (
                  <Table hover responsive className="align-middle mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th className="py-2" style={{ backgroundColor: '#f8f9fa', color: '#2f6a87', fontSize: '0.85rem' }}>#</th>
                        <th className="py-2 d-none d-md-table-cell" style={{ backgroundColor: '#f8f9fa', color: '#2f6a87', fontSize: '0.85rem' }}>Customer Name</th>
                        <th className="py-2 d-none d-lg-table-cell" style={{ backgroundColor: '#f8f9fa', color: '#2f6a87', fontSize: '0.85rem' }}>Purchase Date</th>
                        <th className="py-2 d-none d-lg-table-cell" style={{ backgroundColor: '#f8f9fa', color: '#2f6a87', fontSize: '0.85rem' }}>Expiry Date</th>
                        <th className="py-2" style={{ backgroundColor: '#f8f9fa', color: '#2f6a87', fontSize: '0.85rem' }}>Sessions</th>
                        <th className="py-2" style={{ backgroundColor: '#f8f9fa', color: '#2f6a87', fontSize: '0.85rem' }}>Status</th>
                        <th className="py-2" style={{ backgroundColor: '#f8f9fa', color: '#2f6a87', fontSize: '0.85rem' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const customers = getCustomersForPlan(selectedPlanTab);
                        if (customers.length === 0) {
                          return (
                            <tr>
                              <td colSpan="7" className="text-center py-4">
                                <div className="text-muted">No customers have purchased this plan yet.</div>
                              </td>
                            </tr>
                          );
                        }

                        return customers.map((customer, index) => (
                          <tr
                            key={customer.id}
                            style={{ transition: 'background-color 0.2s ease' }}
                            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
                            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '')}
                          >
                            <td className="py-2 fw-bold">{index + 1}</td>
                            <td className="py-2 d-none d-md-table-cell">
                              <strong style={{ color: '#2f6a87', fontSize: '0.9rem' }}>{customer.name}</strong>
                            </td>
                            <td className="py-2 d-none d-lg-table-cell">
                              <div className="d-flex align-items-center gap-1">
                                <FaCalendar size={12} className="text-muted" />
                                <span style={{ fontSize: '0.85rem' }}>{customer.purchaseDate}</span>
                              </div>
                            </td>
                            <td className="py-2 d-none d-lg-table-cell">
                              <div className="d-flex align-items-center gap-1">
                                <FaCalendar size={12} className="text-muted" />
                                <span style={{ fontSize: '0.85rem' }}>{customer.expiryDate}</span>
                              </div>
                            </td>
                            <td className="py-2">
                              <div className="d-flex flex-column">
                                <span
                                  className="badge mb-1"
                                  style={{
                                    backgroundColor: '#2f6a87',
                                    color: 'white',
                                    fontSize: '0.75rem',
                                  }}
                                >
                                  Used: {customer.sessionsBooked}
                                </span>
                                <span className="badge bg-success" style={{ fontSize: '0.75rem' }}>
                                  Left: {customer.sessionsRemaining}
                                </span>
                              </div>
                            </td>
                            <td className="py-2">
                              {getStatusIndicator(customer.status, customer.sessionsRemaining, customer.expiryDate)}
                            </td>
                            <td className="py-2">
                              <Button
                                size="sm"
                                onClick={() => handleViewCustomer(customer)}
                                style={{
                                  backgroundColor: 'transparent',
                                  borderColor: 'transparent',
                                  color: '#2f6a87',
                                  padding: '4px 8px',
                                  borderRadius: '50%',
                                  width: '32px',
                                  height: '32px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                }}
                                onMouseOver={(e) => {
                                  e.target.style.backgroundColor = '#f0f7fa';
                                  e.target.style.color = '#2f6a87';
                                  e.target.style.transform = 'scale(1.1)';
                                  e.target.style.boxShadow = '0 4px 8px rgba(47, 106, 135, 0.2)';
                                }}
                                onMouseOut={(e) => {
                                  e.target.style.backgroundColor = 'transparent';
                                  e.target.style.color = '#2f6a87';
                                  e.target.style.transform = 'scale(1)';
                                  e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                                }}
                              >
                                <FaEye size={14} />
                              </Button>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </Table>
                )}
              </div>
            </Card.Body>
          </Card>
        )}

        {/* Customer Modal */}
        <Modal show={showCustomerModal} onHide={() => setShowCustomerModal(false)} centered size="lg">
          <Modal.Header closeButton style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #2f6a87' }}>
            <Modal.Title style={{ color: '#333', fontWeight: '600', fontSize: '1.2rem' }}>Customer Details</Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-2 p-md-4">
            {selectedCustomer && (
              <div className="p-2 p-md-4">
                <div className="row mb-3 mb-md-4">
                  <div className="col-md-8">
                    <h4 className="fw-bold mb-3" style={{ color: '#333', fontSize: '1.3rem' }}>
                      {selectedCustomer.name}
                    </h4>
                    <div className="d-flex flex-column gap-2 gap-md-3">
                      <div className="d-flex align-items-center gap-2 gap-md-3">
                        <div className="bg-light p-2 p-md-3 rounded" style={{ width: '40px', height: '40px' }}>
                          <FaEnvelope size={16} className="text-muted" />
                        </div>
                        <div>
                          <div className="text-muted small">Email</div>
                          <div className="fw-medium" style={{ fontSize: '0.9rem' }}>
                            {selectedCustomer.email}
                          </div>
                        </div>
                      </div>
                      <div className="d-flex align-items-center gap-2 gap-md-3">
                        <div className="bg-light p-2 p-md-3 rounded" style={{ width: '40px', height: '40px' }}>
                          <FaPhone size={16} className="text-muted" />
                        </div>
                        <div>
                          <div className="text-muted small">Phone</div>
                          <div className="fw-medium" style={{ fontSize: '0.9rem' }}>
                            {selectedCustomer.contact}
                          </div>
                        </div>
                      </div>
                      <div className="d-flex align-items-center gap-2 gap-md-3">
                        <div className="bg-light p-2 p-md-3 rounded" style={{ width: '40px', height: '40px' }}>
                          <FaUser size={16} className="text-muted" />
                        </div>
                        <div>
                          <div className="text-muted small">Gender</div>
                          <div className="fw-medium" style={{ fontSize: '0.9rem' }}>
                            {selectedCustomer.gender}
                          </div>
                        </div>
                      </div>
                      <div className="d-flex align-items-center gap-2 gap-md-3">
                        <div className="bg-light p-2 p-md-3 rounded" style={{ width: '40px', height: '40px' }}>
                          <FaCalendar size={16} className="text-muted" />
                        </div>
                        <div>
                          <div className="text-muted small">Join Date</div>
                          <div className="fw-medium" style={{ fontSize: '0.9rem' }}>
                            {selectedCustomer.joinDate}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4 text-center">
                    <div
                      className="p-3 p-md-4 rounded"
                      style={{
                        backgroundColor: getStatusColor(selectedCustomer.status, selectedCustomer.sessionsRemaining, selectedCustomer.expiryDate).bg,
                        color: getStatusColor(selectedCustomer.status, selectedCustomer.sessionsRemaining, selectedCustomer.expiryDate).color,
                        border: `2px solid ${getStatusColor(selectedCustomer.status, selectedCustomer.sessionsRemaining, selectedCustomer.expiryDate).border}`,
                      }}
                    >
                      <div className="fw-bold text-uppercase" style={{ fontSize: '0.9rem' }}>
                        {selectedCustomer.status || 'Unknown'}
                      </div>
                      <div className="small">Status</div>
                    </div>
                  </div>
                </div>

                <div className="row g-2 g-md-4 mb-3 mb-md-4">
                  <div className="col-md-6">
                    <div className="p-2 p-md-3 bg-light rounded">
                      <div className="d-flex align-items-center mb-2">
                        <FaCalendar className="me-2" style={{ color: '#2f6a87' }} />
                        <h6 className="mb-0 text-muted" style={{ fontSize: '0.9rem' }}>
                          Purchase Date
                        </h6>
                      </div>
                      <div className="fw-bold" style={{ fontSize: '1rem' }}>{selectedCustomer.purchaseDate}</div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="p-2 p-md-3 bg-light rounded">
                      <div className="d-flex align-items-center mb-2">
                        <FaCalendar className="me-2" style={{ color: '#dc3545' }} />
                        <h6 className="mb-0 text-muted" style={{ fontSize: '0.9rem' }}>
                          Expiry Date
                        </h6>
                      </div>
                      <div className="fw-bold" style={{ fontSize: '1rem' }}>{selectedCustomer.expiryDate}</div>
                    </div>
                  </div>
                </div>

                <div className="row g-2 g-md-4 mb-3 mb-md-4">
                  <div className="col-md-6">
                    <div className="p-2 p-md-3 bg-light rounded">
                      <div className="d-flex align-items-center mb-2">
                        <FaRupeeSign className="me-2" style={{ color: '#2f6a87' }} />
                        <h6 className="mb-0 text-muted" style={{ fontSize: '0.9rem' }}>
                          Payment Mode
                        </h6>
                      </div>
                      <div className="fw-bold" style={{ fontSize: '1rem' }}>{selectedCustomer.paymentMode}</div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="p-2 p-md-3 bg-light rounded">
                      <div className="d-flex align-items-center mb-2">
                        <FaRupeeSign className="me-2" style={{ color: '#dc3545' }} />
                        <h6 className="mb-0 text-muted" style={{ fontSize: '0.9rem' }}>
                          Amount Paid
                        </h6>
                      </div>
                      <div className="fw-bold" style={{ fontSize: '1rem' }}>₹{selectedCustomer.amountPaid.toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                <div className="p-3 p-md-4 bg-white rounded" style={{ border: '2px solid #2f6a87', borderRadius: '12px' }}>
                  <h5 className="fw-bold mb-3 mb-md-4" style={{ color: '#2f6a87', fontSize: '1.1rem' }}>
                    Training Sessions
                  </h5>
                  <div className="row g-2 g-md-3">
                    <div className="col-4">
                      <div className="text-center p-2 p-md-3 bg-light rounded">
                        <div className="fw-bold" style={{ fontSize: '1.3rem', color: '#2f6a87' }}>
                          {selectedCustomer.sessionsBooked}
                        </div>
                        <div className="text-muted" style={{ fontSize: '0.8rem' }}>Used</div>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="text-center p-2 p-md-3 bg-light rounded">
                        <div className="fw-bold" style={{ fontSize: '1.3rem', color: '#2f6a87' }}>
                          {selectedCustomer.sessionsRemaining}
                        </div>
                        <div className="text-muted" style={{ fontSize: '0.8rem' }}>Remaining</div>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="text-center p-2 p-md-3 bg-light rounded">
                        <div className="fw-bold" style={{ fontSize: '1.3rem', color: '#2f6a87' }}>
                          {selectedCustomer.totalSessions}
                        </div>
                        <div className="text-muted" style={{ fontSize: '0.8rem' }}>Total</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer style={{ borderTop: '1px solid #eee' }}>
            <Button
              variant="secondary"
              onClick={() => setShowCustomerModal(false)}
              style={{
                backgroundColor: '#6c757d',
                borderColor: '#6c757d',
                color: 'white',
                borderRadius: '50px',
                padding: '6px 20px',
                fontSize: '0.9rem',
              }}
              onMouseOver={(e) => (e.target.style.backgroundColor = '#5a6268')}
              onMouseOut={(e) => (e.target.style.backgroundColor = '#6c757d')}
            >
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
};

export default PersonalPlansBookings;