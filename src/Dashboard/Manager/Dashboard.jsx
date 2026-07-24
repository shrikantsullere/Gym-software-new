import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Container,
  Button,
  Modal,
  Form
} from 'react-bootstrap';
import {
  PeopleFill,
  CheckCircleFill,
  CashStack,
  CalendarFill,
  PersonWorkspace,
  ClockHistory,
  PersonPlus
} from 'react-bootstrap-icons';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

const Dashboard = () => {
  // Mock Data
  const totalMembers = 1247;
  const activeMemberships = 983;
  const revenueToday = 4280;
  const upcomingClasses = 14;
  const staffOnDuty = 8;
  const avgSessionDuration = "62 min";
  
  // Chart Data
  const membershipData = [
    { month: 'Jan', members: 85 },
    { month: 'Feb', members: 102 },
    { month: 'Mar', members: 98 },
    { month: 'Apr', members: 110 },
    { month: 'May', members: 125 },
    { month: 'Jun', members: 140 }
  ];
  
  const revenueData = [
    { day: 'Mon', revenue: 1200 },
    { day: 'Tue', revenue: 1800 },
    { day: 'Wed', revenue: 1500 },
    { day: 'Thu', revenue: 2000 },
    { day: 'Fri', revenue: 2400 },
    { day: 'Sat', revenue: 3800 },
    { day: 'Sun', revenue: 4280 }
  ];
  
  // State for modal
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    phone: '',
    membershipType: 'basic',
    joinDate: new Date().toISOString().split('T')[0]
  });
  
  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    return (
      <div className="bg-white border rounded shadow-sm p-3" style={{ fontSize: '0.875rem' }}>
        <p className="mb-1 fw-bold" style={{ color: '#2F6A87' }}>{label}</p>
        {payload.map((entry, idx) => (
          <p key={idx} className="mb-1" style={{ color: entry.color }}>
            {entry.name}: <strong>{entry.value}{entry.dataKey === 'revenue' ? '$' : ''}</strong>
          </p>
        ))}
      </div>
    );
  };
  
  // Icon color mapping
  const iconColors = {
    primary: '#6EB2CC',
    success: '#28a745',
    info: '#2F6A87',
    warning: '#6EB2CC',
    danger: '#dc3545',
    teal: '#6EB2CC'
  };
  
  const iconBgColors = {
    primary: 'rgba(110, 178, 204, 0.15)',
    success: 'rgba(40, 167, 69, 0.1)',
    info: 'rgba(47, 106, 135, 0.15)',
    warning: 'rgba(110, 178, 204, 0.15)',
    danger: 'rgba(220, 53, 69, 0.1)',
    teal: 'rgba(110, 178, 204, 0.15)'
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMember({
      ...newMember,
      [name]: value
    });
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send the data to your backend
    console.log('New member data:', newMember);
    
    // Close the modal and reset form
    setShowMemberModal(false);
    setNewMember({
      name: '',
      email: '',
      phone: '',
      membershipType: 'basic',
      joinDate: new Date().toISOString().split('T')[0]
    });
    
    // Show success message (you could use a toast notification here)
    alert('New member added successfully!');
  };
  
  // Function to open modal
  const openMemberModal = () => {
    console.log('Opening modal...');
    setShowMemberModal(true);
  };
  
  // Function to close modal
  const closeMemberModal = () => {
    console.log('Closing modal...');
    setShowMemberModal(false);
  };
  
  return (
    <div className="bg-light min-vh-100 py-4">
      <Container fluid="xl">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
          <h2 className="fw-bold mb-0" style={{ color: '#2F6A87' }}>
            Fitness Dashboard
          </h2>
          <Button 
            variant="primary" 
            onClick={() => setShowMemberModal(true)}
            style={{ backgroundColor: '#2F6A87', borderColor: '#2F6A87' }}
            className="w-100 w-md-auto"
          >
            <PersonPlus className="me-2" /> Add New Member
          </Button>
        </div>
        
        {/* Stat Cards — 2 Rows of 3 */}
        <Row className="g-4 mb-4">
          {[
            { title: 'Total Members', value: totalMembers.toLocaleString(), icon: PeopleFill, color: 'primary' },
            { title: 'Active Memberships', value: activeMemberships, icon: CheckCircleFill, color: 'success' },
            { title: 'Revenue Today', value: `$${revenueToday.toLocaleString()}`, icon: CashStack, color: 'info' },
            { title: 'Upcoming Classes', value: upcomingClasses, icon: CalendarFill, color: 'warning' },
            { title: 'Staff on Duty', value: staffOnDuty, icon: PersonWorkspace, color: 'danger' },
            { title: 'Avg. Session Duration', value: avgSessionDuration, icon: ClockHistory, color: 'teal' }
          ].map((stat, idx) => (
            <Col sm={6} md={4} xl={4} key={idx}>
              <Card 
                className="border-0 shadow-sm h-100 rounded-4 overflow-hidden"
                style={{ 
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)',
                  transition: 'all 0.3s ease',
                  minHeight: '140px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Card.Body className="d-flex align-items-center">
                  <div 
                    className="rounded-3 p-3 me-3 d-flex align-items-center justify-content-center"
                    style={{ 
                      backgroundColor: iconBgColors[stat.color],
                      width: '60px',
                      height: '60px'
                    }}
                  >
                    <stat.icon size={28} color={iconColors[stat.color]} />
                  </div>
                  <div>
                    <h4 className="mb-1 fw-bold" style={{ color: '#2F6A87' }}>
                      {stat.value}
                    </h4>
                    <p className="mb-0 text-muted small" style={{ fontSize: '0.875rem' }}>
                      {stat.title}
                    </p>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
        
        {/* Charts Row 1 */}
        <Row className="g-4 mb-4">
          {/* Membership Trends - LineChart */}
          <Col lg={6}>
            <Card className="border-0 shadow-sm h-100 rounded-4">
              <Card.Header 
                className="bg-white border-0 pb-0"
                style={{ borderBottom: '2px solid #6EB2CC' }}
              >
                <h5 className="fw-bold m-0" style={{ color: '#2F6A87' }}>Membership Trends</h5>
              </Card.Header>
              <Card.Body style={{ height: '280px', padding: '8px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={membershipData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" stroke="#6c757d" tick={{ fontSize: 11 }} minTickGap={15} />
                    <YAxis 
                      stroke="#6c757d" 
                      tick={{ fontSize: 11 }} 
                      width={40}
                      tickFormatter={(value) => {
                        if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                        return value;
                      }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    <Line
                      type="monotone"
                      dataKey="members"
                      stroke="#2F6A87"
                      strokeWidth={3}
                      dot={{ fill: '#6EB2CC', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 8 }}
                      name="New Memberships"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>
          {/* Revenue Trends - BarChart */}
          <Col lg={6}>
            <Card className="border-0 shadow-sm h-100 rounded-4">
              <Card.Header 
                className="bg-white border-0 pb-0"
                style={{ borderBottom: '2px solid #2F6A87' }}
              >
                <h5 className="fw-bold m-0" style={{ color: '#2F6A87' }}>Revenue Trends</h5>
              </Card.Header>
              <Card.Body style={{ height: '280px', padding: '8px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" stroke="#6c757d" tick={{ fontSize: 11 }} minTickGap={15} />
                    <YAxis 
                      stroke="#6c757d" 
                      tick={{ fontSize: 11 }} 
                      width={45}
                      tickFormatter={(value) => {
                        if (value >= 100000) return `${(value / 100000).toFixed(1)}L`;
                        if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                        return value;
                      }}
                    />
                    <Tooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 1000 }} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar
                      dataKey="revenue"
                      fill="#2F6A87"
                      radius={[6, 6, 0, 0]}
                      name="Daily Revenue"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
      
      {/* Add New Member Modal */}
      <Modal 
        show={showMemberModal} 
        onHide={closeMemberModal}
        backdrop="static"
        keyboard={false}
        centered
        size="lg"
        className="member-modal"
      >
        <Modal.Header closeButton style={{ backgroundColor: '#2F6A87', color: 'white' }}>
          <Modal.Title>Add New Member</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="formName">
                  <Form.Label>Full Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter full name"
                    name="name"
                    value={newMember.name}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="formEmail">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Enter email"
                    name="email"
                    value={newMember.email}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="formPhone">
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control
                    type="tel"
                    placeholder="Enter phone number"
                    name="phone"
                    value={newMember.phone}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="formMembership">
                  <Form.Label>Membership Type</Form.Label>
                  <Form.Select
                    name="membershipType"
                    value={newMember.membershipType}
                    onChange={handleInputChange}
                  >
                    <option value="basic">Basic</option>
                    <option value="premium">Premium</option>
                    <option value="vip">VIP</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Row className="mb-4">
              <Col md={6}>
                <Form.Group controlId="formJoinDate">
                  <Form.Label>Join Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="joinDate"
                    value={newMember.joinDate}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <div className="d-flex justify-content-end">
              <Button 
                variant="secondary" 
                className="me-2"
                onClick={closeMemberModal}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                style={{ backgroundColor: '#2F6A87', borderColor: '#2F6A87' }}
              >
                Add Member
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
      
      {/* Debug info - reduced z-index to avoid covering modal */}
      <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1000 }}>
        <div className="bg-white border rounded p-2 shadow-sm">
          <small>Modal state: {showMemberModal ? 'Open' : 'Closed'}</small>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;