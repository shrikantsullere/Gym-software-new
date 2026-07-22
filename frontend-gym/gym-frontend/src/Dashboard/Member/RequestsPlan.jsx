import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container, Row, Col, Card, Badge, Button,
  Spinner, Alert, Table, ButtonGroup, Form,
  Modal, InputGroup
} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import BaseUrl from '../../Api/BaseUrl';

const RequestPlan = () => {
  // State management
  const [bookingData, setBookingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [memberId, setMemberId] = useState('69'); // Initial value is 69, can be changed dynamically
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Modal state
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [newMemberId, setNewMemberId] = useState('');

  // Build API endpoint URL - based on dynamic memberId
  const getApiEndpoint = () => {
    return `${BaseUrl}booking/member/${memberId}`;
  };

  // Fetch data using Axios
  const fetchBookingData = async (id = memberId) => {
    setLoading(true);
    setError(null);
    
    try {
      const endpoint = `${BaseUrl}booking/member/${id}`;
      const response = await axios.get(endpoint);
      
      if (response.data.success) {
        setBookingData(response.data);
      } else {
        throw new Error('API returned incorrect data format');
      }
    } catch (err) {
      setError(`Failed to fetch data: ${err.message}`);
      console.error('API call error:', err);
      
      // Fallback mock data
      setBookingData({
        success: true,
        requests: [
          {
            id: 4,
            memberId: parseInt(id),
            classId: 1,
            branchId: 33,
            adminId: 68,
            status: "approved",
            createdAt: "2025-12-12T07:40:32.000Z",
            updatedAt: "2025-12-12T10:07:25.000Z",
            price: "50.00",
            upiId: null,
            className: "Yoga Morning Batch",
            adminName: "Pending"
          },
          {
            id: 5,
            memberId: parseInt(id),
            classId: 2,
            branchId: 33,
            adminId: 68,
            status: "pending",
            createdAt: "2025-12-11T09:20:15.000Z",
            updatedAt: "2025-12-11T09:20:15.000Z",
            price: "65.00",
            upiId: "user@upi",
            className: "Advanced Yoga",
            adminName: "John Doe"
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookingData();
  }, [refreshKey]);

  // Status badge component
  const StatusBadge = ({ status }) => {
    const variantMap = {
      'approved': 'success',
      'pending': 'warning',
      'rejected': 'danger'
    };
    
    const textMap = {
      'approved': 'Approved',
      'pending': 'Pending',
      'rejected': 'Rejected'
    };
    
    return (
      <Badge bg={variantMap[status] || 'secondary'} className="px-3 py-2">
        {textMap[status] || status}
      </Badge>
    );
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate statistics
  const calculateStats = () => {
    if (!bookingData?.requests) return {
      total: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
      totalAmount: 0
    };
    
    const requests = bookingData.requests;
    return {
      total: requests.length,
      approved: requests.filter(r => r.status === 'approved').length,
      pending: requests.filter(r => r.status === 'pending').length,
      rejected: requests.filter(r => r.status === 'rejected').length,
      totalAmount: requests.reduce((sum, r) => sum + parseFloat(r.price || 0), 0)
    };
  };

  const stats = calculateStats();

  // Handle changing member ID
  const handleChangeMember = () => {
    if (newMemberId.trim()) {
      setMemberId(newMemberId.trim());
      setRefreshKey(prev => prev + 1);
      setShowMemberModal(false);
      setNewMemberId('');
    }
  };

  return (
    <Container className="py-2">
      {/* Page title and member control */}
     
     <h2>Request Plan </h2>

      {/* Error alert */}
      {error && (
        <Row className="mb-4">
          <Col>
            <Alert variant="warning" onClose={() => setError(null)} dismissible>
              <Alert.Heading>Notice</Alert.Heading>
              <p>{error}</p>
              <p className="mb-0">Showing mock data. Actual API data will be displayed when connection is successful.</p>
            </Alert>
          </Col>
        </Row>
      )}

      {/* Statistics cards */}
      <Row className="mb-4 g-3">
        <Col md={3} sm={6}>
          <Card className="shadow-sm border-0 h-100">
            <Card.Body className="text-center">
              <h2 className="display-6 text-primary">{stats.total}</h2>
              <p className="text-muted mb-0">Total Bookings</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="shadow-sm border-0 h-100 bg-success bg-opacity-10">
            <Card.Body className="text-center">
              <h2 className="display-6 text-success">{stats.approved}</h2>
              <p className="text-muted mb-0">Approved</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="shadow-sm border-0 h-100 bg-warning bg-opacity-10">
            <Card.Body className="text-center">
              <h2 className="display-6 text-warning">{stats.pending}</h2>
              <p className="text-muted mb-0">Pending</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="shadow-sm border-0 h-100 bg-info bg-opacity-10">
            <Card.Body className="text-center">
              <h2 className="display-6 text-info">₹{stats.totalAmount.toFixed(2)}</h2>
              <p className="text-muted mb-0">Total Amount</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Bookings table */}
      <Row>
        <Col>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white border-0 pb-0">
              <div className="d-flex justify-content-between align-items-center">
                <Card.Title className="mb-0">
                  <i className="bi bi-table me-2"></i>
                  Booking Records (Member ID: {memberId})
                </Card.Title>
                <Badge bg="light" text="dark" className="fs-6">
                  {bookingData?.requests?.length || 0} Records
                </Badge>
              </div>
            </Card.Header>
            <Card.Body className="pt-0">
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" className="me-2" />
                  <span>Loading data for member {memberId}...</span>
                </div>
              ) : bookingData?.requests?.length > 0 ? (
                <div className="table-responsive">
                  <Table hover className="align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>#</th>
                        <th>Class Name</th>
                        <th>Status</th>
                        <th>Price</th>
                        <th>Created At</th>
                        <th>Updated At</th>
                        <th>Admin</th>
                        
                      </tr>
                    </thead>
                    <tbody>
                      {bookingData.requests.map((request, index) => (
                        <tr key={request.id}>
                          <td className="fw-bold">{index + 1}</td>
                          <td>
                            <div>
                              <strong>{request.className}</strong>
                              <div className="small text-muted">
                                ID: {request.classId} | Branch: {request.branchId}
                              </div>
                            </div>
                          </td>
                          <td>
                            <StatusBadge status={request.status} />
                          </td>
                          <td className="fw-bold text-primary">
                            ₹{parseFloat(request.price).toFixed(2)}
                          </td>
                          <td>
                            <div className="small">
                              {formatDate(request.createdAt)}
                            </div>
                          </td>
                          <td>
                            <div className="small">
                              {formatDate(request.updatedAt)}
                            </div>
                          </td>
                          <td>
                            {request.adminName || 'N/A'}
                            <div className="small text-muted">
                              ID: {request.adminId}
                            </div>
                          </td>
                        
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="table-light">
                        <td colSpan="3" className="text-end fw-bold">Total:</td>
                        <td className="fw-bold text-primary">₹{stats.totalAmount.toFixed(2)}</td>
                        <td colSpan="4"></td>
                      </tr>
                    </tfoot>
                  </Table>
                </div>
              ) : (
                <Alert variant="info" className="text-center py-4">
                  <i className="bi bi-info-circle display-6 mb-3 d-block"></i>
                  <h5>No Booking Records Found</h5>
                  <p>No booking records found for member</p>
                  <Button 
                    variant="outline-primary"
                    onClick={() => setRefreshKey(prev => prev + 1)}
                  >
                    Reload Data
                  </Button>
                </Alert>
              )}
            </Card.Body>
            <Card.Footer className="bg-white border-0 text-muted small">
              <div className="d-flex justify-content-between">
                <div>
                  <i className="bi bi-info-circle me-1"></i>
                  Last Updated: {new Date().toLocaleTimeString('en-US')}
                </div>
                <div>
                  Showing {bookingData?.requests?.length || 0} records
                </div>
              </div>
            </Card.Footer>
          </Card>
        </Col>
      </Row>

      {/* API Information */}
    
    </Container>
  );
};

export default RequestPlan;