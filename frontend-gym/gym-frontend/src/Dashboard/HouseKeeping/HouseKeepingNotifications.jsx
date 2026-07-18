import React, { useState, useEffect } from 'react';
import { 
  FaBroom, 
  FaExclamationTriangle, 
  FaBell, 
  FaCheckCircle, 
  FaFilter,
  FaSearch,
  FaTimes,
  FaClock
} from 'react-icons/fa';
import { 
  Button, 
  Card, 
  Row, 
  Col, 
  Badge, 
  ListGroup,
  InputGroup,
  FormControl,
  Modal,
  Form
} from 'react-bootstrap';

// Mock data for notifications
const initialNotifications = [
  // Special cleaning requests
  { 
    id: 1, 
    type: 'cleaning-request', 
    title: 'Deep Cleaning Request', 
    message: 'Guest in Room 305 has requested deep cleaning service for tomorrow.', 
    timestamp: '2023-06-01T09:30:00',
    read: false,
    priority: 'normal'
  },
  { 
    id: 2, 
    type: 'cleaning-request', 
    title: 'Stain Removal', 
    message: 'Carpet stain in Room 212 needs special attention and cleaning.', 
    timestamp: '2023-06-01T11:15:00',
    read: false,
    priority: 'normal'
  },
  { 
    id: 3, 
    type: 'cleaning-request', 
    title: 'Allergy Precaution', 
    message: 'Guest in Suite 101 has severe dust allergies. Please use hypoallergenic products.', 
    timestamp: '2023-05-31T14:20:00',
    read: true,
    priority: 'high'
  },
  
  // Urgent alerts
  { 
    id: 4, 
    type: 'urgent-alert', 
    title: 'Water Leak in Room 405', 
    message: 'Water leak reported in bathroom of Room 405. Immediate attention required.', 
    timestamp: '2023-06-01T08:45:00',
    read: false,
    priority: 'critical'
  },
  { 
    id: 5, 
    type: 'urgent-alert', 
    title: 'Broken Window in Lobby', 
    message: 'Window near the main entrance is broken. Please secure the area for safety.', 
    timestamp: '2023-06-01T07:30:00',
    read: false,
    priority: 'high'
  },
  { 
    id: 6, 
    type: 'urgent-alert', 
    title: 'Power Outage in West Wing', 
    message: 'Power outage reported in the west wing. Maintenance team has been notified.', 
    timestamp: '2023-05-31T16:45:00',
    read: true,
    priority: 'high'
  },
  { 
    id: 7, 
    type: 'urgent-alert', 
    title: 'Fire Alarm Test', 
    message: 'Scheduled fire alarm test tomorrow at 10:00 AM. Please inform all staff.', 
    timestamp: '2023-05-30T13:20:00',
    read: true,
    priority: 'normal'
  }
];

const HouseKeepingNotifications = () => {
  // State management
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState('all'); // 'all', 'cleaning-request', 'urgent-alert'
  const [priorityFilter, setPriorityFilter] = useState('all'); // 'all', 'normal', 'high', 'critical'
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Calculate unread notifications count
  useEffect(() => {
    const count = notifications.filter(n => !n.read).length;
    setUnreadCount(count);
  }, [notifications]);

  // Filter notifications based on selected filters and search term
  const filteredNotifications = notifications.filter(notification => {
    const matchesType = filter === 'all' || notification.type === filter;
    const matchesPriority = priorityFilter === 'all' || notification.priority === priorityFilter;
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesPriority && matchesSearch;
  });

  // Mark notification as read
  const markAsRead = (notificationId) => {
    setNotifications(notifications.map(notification => 
      notification.id === notificationId ? { ...notification, read: true } : notification
    ));
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({ ...notification, read: true })));
  };

  // Show notification details
  const showNotificationDetails = (notification) => {
    setSelectedNotification(notification);
    setShowDetailsModal(true);
    
    // Mark as read when viewed
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  // Get priority badge
  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'critical':
        return <Badge bg="danger">Critical</Badge>;
      case 'high':
        return <Badge bg="warning">High</Badge>;
      case 'normal':
        return <Badge bg="info">Normal</Badge>;
      default:
        return <Badge bg="secondary">Normal</Badge>;
    }
  };

  // Get notification icon
  const getNotificationIcon = (type) => {
    return type === 'cleaning-request' 
      ? <FaBroom style={{ color: '#6EB2CC' }} /> 
      : <FaExclamationTriangle className="text-warning" />;
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);
    
    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
  };

  // Get notification statistics
  const getNotificationStats = () => {
    const cleaningRequests = notifications.filter(n => n.type === 'cleaning-request');
    const urgentAlerts = notifications.filter(n => n.type === 'urgent-alert');
    const unreadNotifications = notifications.filter(n => !n.read);
    const criticalNotifications = notifications.filter(n => n.priority === 'critical');
    
    return {
      total: notifications.length,
      cleaning: cleaningRequests.length,
      urgent: urgentAlerts.length,
      unread: unreadNotifications.length,
      critical: criticalNotifications.length
    };
  };

  const stats = getNotificationStats();

  return (
    <div className="housekeeping-notifications-container">
      {/* Custom styles for blue color replacement */}
      <style>
        {`
          .btn-primary {
            background-color: #6EB2CC !important;
            border-color: #6EB2CC !important;
          }
          .btn-outline-primary {
            color: #6EB2CC !important;
            border-color: #6EB2CC !important;
          }
          .btn-outline-primary:hover {
            background-color: #6EB2CC !important;
            color: white !important;
          }
          .text-primary {
            color: #6EB2CC !important;
          }
          .badge.bg-primary {
            background-color: #6EB2CC !important;
          }
          .housekeeping-notifications-container .fa-bell {
            color: #6EB2CC !important;
          }
        `}
      </style>

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          <div className="position-relative me-3">
            <FaBell size={24} style={{ color: '#6EB2CC' }} />
            {unreadCount > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <h2 className="mb-0">Notifications</h2>
            <p className="text-muted">Special cleaning requests and urgent alerts</p>
          </div>
        </div>
        <div>
          {unreadCount > 0 && (
            <Button variant="outline-primary" onClick={markAllAsRead} className="me-2">
              <FaCheckCircle className="me-2" /> Mark All as Read
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3} sm={6}>
          <Card className="mb-3">
            <Card.Body className="d-flex align-items-center">
              <div className="me-3">
                <FaBell size={30} style={{ color: '#6EB2CC' }} />
              </div>
              <div>
                <h5>Total</h5>
                <h3>{stats.total}</h3>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="mb-3">
            <Card.Body className="d-flex align-items-center">
              <div className="me-3">
                <FaBroom size={30} className="text-info" />
              </div>
              <div>
                <h5>Cleaning Requests</h5>
                <h3>{stats.cleaning}</h3>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="mb-3">
            <Card.Body className="d-flex align-items-center">
              <div className="me-3">
                <FaExclamationTriangle size={30} className="text-warning" />
              </div>
              <div>
                <h5>Urgent Alerts</h5>
                <h3>{stats.urgent}</h3>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="mb-3">
            <Card.Body className="d-flex align-items-center">
              <div className="me-3">
                <FaTimes size={30} className="text-danger" />
              </div>
              <div>
                <h5>Unread</h5>
                <h3>{stats.unread}</h3>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Search and Filters */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={6}>
              <InputGroup>
                <FormControl 
                  placeholder="Search notifications..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button variant="outline-secondary">
                  <FaSearch />
                </Button>
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="cleaning-request">Cleaning Requests</option>
                <option value="urgent-alert">Urgent Alerts</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Select 
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="all">All Priorities</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Notifications List */}
      <Card>
        <Card.Body>
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-5">
              <FaBell size={48} className="text-muted mb-3" />
              <h4>No notifications found</h4>
              <p className="text-muted">Try changing your filters or check back later.</p>
            </div>
          ) : (
            <ListGroup variant="flush">
              {filteredNotifications.map(notification => (
                <ListGroup.Item 
                  key={notification.id} 
                  className={`d-flex align-items-start p-3 ${!notification.read ? 'bg-light' : ''}`}
                  onClick={() => showNotificationDetails(notification)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="me-3 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-start">
                      <h6 className={`mb-1 ${!notification.read ? 'fw-bold' : ''}`}>
                        {notification.title}
                      </h6>
                      <div className="d-flex align-items-center">
                        {getPriorityBadge(notification.priority)}
                        {!notification.read && (
                          <span className="ms-2 badge bg-primary">New</span>
                        )}
                      </div>
                    </div>
                    <p className="mb-1 text-muted">{notification.message}</p>
                    <div className="d-flex align-items-center text-muted small">
                      <FaClock className="me-1" />
                      {formatTimestamp(notification.timestamp)}
                    </div>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Card.Body>
      </Card>

      {/* Notification Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center">
            {selectedNotification && getNotificationIcon(selectedNotification.type)}
            <span className="ms-2">{selectedNotification?.title}</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedNotification && (
            <div>
              <div className="d-flex justify-content-between mb-3">
                <div>
                  {getPriorityBadge(selectedNotification.priority)}
                  <span className="ms-2 badge bg-secondary">
                    {selectedNotification.type === 'cleaning-request' ? 'Cleaning Request' : 'Urgent Alert'}
                  </span>
                </div>
                <div className="text-muted small">
                  <FaClock className="me-1" />
                  {new Date(selectedNotification.timestamp).toLocaleString()}
                </div>
              </div>
              
              <Card className="mb-3">
                <Card.Body>
                  <p className="mb-0">{selectedNotification.message}</p>
                </Card.Body>
              </Card>
              
              <div className="d-flex justify-content-between mt-4">
                <Button variant="outline-secondary" onClick={() => setShowDetailsModal(false)}>
                  Close
                </Button>
                {!selectedNotification.read && (
                  <Button variant="primary" onClick={() => markAsRead(selectedNotification.id)}>
                    Mark as Read
                  </Button>
                )}
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default HouseKeepingNotifications;