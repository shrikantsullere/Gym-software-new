import React, { useState, useEffect } from 'react';
import { 
  FaCalendarAlt, 
  FaExchangeAlt, 
  FaCheckCircle, 
  FaBell, 
  FaUserAlt, 
  FaUserShield,
  FaSearch,
  FaFilter,
  FaPlus,
  FaClock,
  FaMapMarkerAlt,
  FaIdBadge,
  FaHistory,
  FaChartBar,
  FaTh,
  FaList,
  FaChevronLeft,
  FaChevronRight,
  FaEdit,
  FaSave,
  FaTimes,
  FaCheck,
  FaExclamationTriangle,
  FaBan
} from 'react-icons/fa';
import { 
  Button, 
  Card, 
  Row, 
  Col, 
  Form, 
  Badge, 
  Modal, 
  Tabs, 
  Tab, 
  Table,
  Alert,
  InputGroup,
  FormControl,
  Dropdown,
  DropdownButton
} from 'react-bootstrap';

// Custom styles to override Bootstrap colors
const customStyles = {
  primaryColor: '#6EB2CC',
  primaryColorHover: '#5ca8c4',
  primaryColorLight: '#a0d1e3',
  primaryColorDark: '#4a8fa8',
};

// Mock data for demonstration
const mockStaff = [
  { id: 1, name: "Rajesh Kumar", role: "Senior Staff", department: "Operations" },
  { id: 2, name: "Priya Sharma", role: "Staff", department: "Operations" },
  { id: 3, name: "Amit Patel", role: "Staff", department: "Operations" },
  { id: 4, name: "Sunita Reddy", role: "Senior Staff", department: "Operations" },
  { id: 5, name: "Vikram Singh", role: "Staff", department: "Operations" },
];

const mockShifts = [
  { 
    id: 1, 
    staffId: 1, 
    date: "2023-06-01", 
    startTime: "09:00", 
    endTime: "17:00", 
    location: "Main Branch", 
    role: "Supervisor", 
    confirmed: true,
    status: "confirmed"
  },
  { 
    id: 2, 
    staffId: 2, 
    date: "2023-06-01", 
    startTime: "09:00", 
    endTime: "17:00", 
    location: "Main Branch", 
    role: "Staff", 
    confirmed: false,
    status: "pending"
  },
  { 
    id: 3, 
    staffId: 3, 
    date: "2023-06-02", 
    startTime: "10:00", 
    endTime: "18:00", 
    location: "North Branch", 
    role: "Staff", 
    confirmed: true,
    status: "confirmed"
  },
  { 
    id: 4, 
    staffId: 4, 
    date: "2023-06-03", 
    startTime: "08:00", 
    endTime: "16:00", 
    location: "South Branch", 
    role: "Supervisor", 
    confirmed: true,
    status: "confirmed"
  },
  { 
    id: 5, 
    staffId: 5, 
    date: "2023-06-04", 
    startTime: "12:00", 
    endTime: "20:00", 
    location: "Main Branch", 
    role: "Staff", 
    confirmed: false,
    status: "pending"
  },
];

const mockSwapRequests = [
  {
    id: 1,
    requesterId: 2,
    requesterName: "Priya Sharma",
    targetId: 3,
    targetName: "Amit Patel",
    shiftId: 2,
    date: "2023-06-01",
    reason: "Personal commitment",
    status: "pending",
    createdAt: "2023-05-28T10:30:00"
  },
  {
    id: 2,
    requesterId: 5,
    requesterName: "Vikram Singh",
    targetId: 1,
    targetName: "Rajesh Kumar",
    shiftId: 5,
    date: "2023-06-04",
    reason: "",
    status: "approved",
    createdAt: "2023-05-27T14:15:00"
  }
];

const mockNotifications = [
  {
    id: 1,
    type: "shift_reminder",
    message: "Your shift starts in 3 hours at Main Branch",
    timestamp: "2023-06-01T06:00:00",
    read: false
  },
  {
    id: 2,
    type: "swap_approved",
    message: "Your shift swap request with Amit Patel has been approved",
    timestamp: "2023-05-29T11:45:00",
    read: true
  }
];

const DutyRoster = () => {
  // State management
  const [user, setUser] = useState({ id: 1, name: "Rajesh Kumar", role: "manager" }); // Can be 'staff' or 'manager'
  const [shifts, setShifts] = useState(mockShifts);
  const [swapRequests, setSwapRequests] = useState(mockSwapRequests);
  const [notifications, setNotifications] = useState(mockNotifications);
  const [staffList, setStaffList] = useState(mockStaff);
  // Removed viewType state and set default to list
  const [calendarView, setCalendarView] = useState('week'); // 'day', 'week', or 'month'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [swapForm, setSwapForm] = useState({ targetStaffId: '', reason: '' });
  const [activeTab, setActiveTab] = useState('myShifts');
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'confirmed', 'pending', 'completed', 'cancelled'
  const [searchQuery, setSearchQuery] = useState('');
  const [newStatus, setNewStatus] = useState('');

  // Initialize
  useEffect(() => {
    // Count unread notifications
    const unreadCount = notifications.filter(n => !n.read).length;
    setUnreadNotifications(unreadCount);
  }, [notifications]);

  // Filter shifts based on user and status
  const getMyShifts = () => {
    let filteredShifts = shifts;
    
    // Filter by user role
    if (user.role !== 'manager') {
      filteredShifts = filteredShifts.filter(shift => shift.staffId === user.id);
    }
    
    // Filter by status
    if (statusFilter !== 'all') {
      filteredShifts = filteredShifts.filter(shift => shift.status === statusFilter);
    }
    
    // Filter by search query
    if (searchQuery) {
      filteredShifts = filteredShifts.filter(shift => 
        shift.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shift.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.role === 'manager' && staffList.find(s => s.id === shift.staffId)?.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    return filteredShifts;
  };

  // Filter swap requests based on user
  const getRelevantSwapRequests = () => {
    if (user.role === 'manager') {
      return swapRequests;
    }
    return swapRequests.filter(req => req.requesterId === user.id || req.targetId === user.id);
  };

  // Handle shift confirmation
  const handleConfirmShift = (shiftId) => {
    setShifts(shifts.map(shift => 
      shift.id === shiftId ? { ...shift, confirmed: true, status: 'confirmed' } : shift
    ));
    setShowConfirmModal(false);
    
    // Add notification
    const newNotification = {
      id: notifications.length + 1,
      type: "shift_confirmed",
      message: "You have confirmed your shift",
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications([newNotification, ...notifications]);
  };

  // Handle status change
  const handleStatusChange = (shiftId, newStatus) => {
    // Show confirmation modal for certain status changes
    if (newStatus === 'cancelled' || newStatus === 'no-show') {
      setSelectedShift(shifts.find(s => s.id === shiftId));
      setNewStatus(newStatus);
      setShowStatusModal(true);
    } else {
      // Directly update for other status changes
      updateShiftStatus(shiftId, newStatus);
    }
  };

  // Update shift status
  const updateShiftStatus = (shiftId, newStatus) => {
    setShifts(shifts.map(shift => 
      shift.id === shiftId ? { 
        ...shift, 
        status: newStatus,
        confirmed: newStatus === 'confirmed' 
      } : shift
    ));
    
    // Add notification
    const shift = shifts.find(s => s.id === shiftId);
    const staff = staffList.find(s => s.id === shift.staffId);
    
    let message = '';
    switch (newStatus) {
      case 'confirmed':
        message = `Shift for ${staff.name} on ${formatDate(shift.date)} has been confirmed`;
        break;
      case 'completed':
        message = `Shift for ${staff.name} on ${formatDate(shift.date)} has been marked as completed`;
        break;
      case 'cancelled':
        message = `Shift for ${staff.name} on ${formatDate(shift.date)} has been cancelled`;
        break;
      case 'no-show':
        message = `${staff.name} was a no-show for shift on ${formatDate(shift.date)}`;
        break;
      default:
        message = `Status updated for ${staff.name}'s shift`;
    }
    
    const newNotification = {
      id: notifications.length + 1,
      type: "status_updated",
      message: message,
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications([newNotification, ...notifications]);
  };

  // Handle swap request submission
  const handleSwapRequest = () => {
    if (!swapForm.targetStaffId) return;
    
    const targetStaff = staffList.find(s => s.id === parseInt(swapForm.targetStaffId));
    const newRequest = {
      id: swapRequests.length + 1,
      requesterId: user.id,
      requesterName: user.name,
      targetId: parseInt(swapForm.targetStaffId),
      targetName: targetStaff.name,
      shiftId: selectedShift.id,
      date: selectedShift.date,
      reason: swapForm.reason,
      status: "pending",
      createdAt: new Date().toISOString()
    };
    
    setSwapRequests([...swapRequests, newRequest]);
    setShowSwapModal(false);
    setSwapForm({ targetStaffId: '', reason: '' });
    
    // Add notification for manager
    const newNotification = {
      id: notifications.length + 1,
      type: "swap_requested",
      message: `${user.name} has requested a shift swap with ${targetStaff.name}`,
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications([newNotification, ...notifications]);
  };

  // Handle swap request approval/rejection
  const handleSwapAction = (requestId, action) => {
    const updatedRequests = swapRequests.map(req => 
      req.id === requestId ? { ...req, status: action } : req
    );
    setSwapRequests(updatedRequests);
    
    const request = swapRequests.find(req => req.id === requestId);
    
    // Add notification
    const newNotification = {
      id: notifications.length + 1,
      type: `swap_${action}`,
      message: `Your shift swap request with ${request.targetName} has been ${action}`,
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications([newNotification, ...notifications]);
  };

  // Mark notification as read
  const markNotificationAsRead = (id) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get status badge with appropriate color
  const getStatusBadge = (status) => {
    const statusConfig = {
      'confirmed': { bg: 'success', icon: <FaCheckCircle /> },
      'pending': { bg: 'warning', icon: <FaExclamationTriangle /> },
      'completed': { bg: 'info', icon: <FaCheckCircle /> },
      'cancelled': { bg: 'danger', icon: <FaBan /> }, // Red color for cancelled
      'no-show': { bg: 'dark', icon: <FaTimes /> }
    };
    
    const config = statusConfig[status] || statusConfig['pending'];
    
    return (
      <Badge bg={config.bg} className="d-flex align-items-center">
        {config.icon} <span className="ms-1">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
      </Badge>
    );
  };

  // Render list view
  const renderListView = () => {
    const myShifts = getMyShifts();
    
    return (
      <div className="list-view">
        {/* Mobile View */}
        <div className="d-md-none">
          {myShifts.map(shift => {
            const staff = staffList.find(s => s.id === shift.staffId);
            const isUpcoming = new Date(shift.date) > new Date();
            const isMyShift = shift.staffId === user.id;
            
            return (
              <Card key={shift.id} className="mb-3">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <Card.Title className="mb-1">{formatDate(shift.date)}</Card.Title>
                      <Card.Subtitle className="mb-2 text-muted">
                        <FaClock className="me-1" /> {shift.startTime} - {shift.endTime}
                      </Card.Subtitle>
                    </div>
                    {getStatusBadge(shift.status)}
                  </div>
                  
                  <div className="mb-2">
                    <FaMapMarkerAlt className="me-2" /> {shift.location}
                  </div>
                  
                  <div className="mb-3">
                    <FaIdBadge className="me-2" /> {shift.role}
                  </div>
                  
                  {isMyShift && (
                    <div className="d-flex flex-column">
                      {!shift.confirmed && (
                        <Button 
                          size="sm" 
                          variant="success" 
                          className="mb-2"
                          onClick={() => {
                            setSelectedShift(shift);
                            setShowConfirmModal(true);
                          }}
                        >
                          Confirm
                        </Button>
                      )}
                      <div className="d-flex mb-2">
                        <Button 
                          size="sm" 
                          variant="primary"
                          className="flex-grow-1 me-2"
                          style={{ 
                            backgroundColor: customStyles.primaryColor,
                            borderColor: customStyles.primaryColor
                          }}
                          onClick={() => {
                            setSelectedShift(shift);
                            setShowSwapModal(true);
                          }}
                        >
                          <FaExchangeAlt /> Swap
                        </Button>
                        
                        {/* Status dropdown for mobile */}
                        <DropdownButton 
                          variant="outline-secondary" 
                          size="sm" 
                          title="Status"
                        >
                          <Dropdown.Item onClick={() => handleStatusChange(shift.id, 'confirmed')}>
                            <FaCheckCircle className="me-1 text-success" /> Confirmed
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => handleStatusChange(shift.id, 'completed')}>
                            <FaCheckCircle className="me-1 text-info" /> Completed
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => handleStatusChange(shift.id, 'cancelled')}>
                            <FaBan className="me-1 text-danger" /> Cancelled
                          </Dropdown.Item>
                        </DropdownButton>
                      </div>
                    </div>
                  )}
                  
                  {/* Manager status change options for mobile */}
                  {user.role === 'manager' && !isMyShift && (
                    <div className="d-flex">
                      <DropdownButton 
                        variant="outline-secondary" 
                        size="sm" 
                        title="Change Status"
                        className="flex-grow-1"
                      >
                        <Dropdown.Item onClick={() => handleStatusChange(shift.id, 'confirmed')}>
                          <FaCheckCircle className="me-1 text-success" /> Confirmed
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => handleStatusChange(shift.id, 'completed')}>
                          <FaCheckCircle className="me-1 text-info" /> Completed
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => handleStatusChange(shift.id, 'cancelled')}>
                          <FaBan className="me-1 text-danger" /> Cancelled
                        </Dropdown.Item>
                      </DropdownButton>
                    </div>
                  )}
                </Card.Body>
              </Card>
            );
          })}
        </div>
        
        {/* Desktop View */}
        <div className="d-none d-md-block">
          <Card>
            <Card.Body>
              <div className="table-responsive">
                <Table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Staff</th>
                      <th>Time</th>
                      <th>Location</th>
                      <th>Role</th>
                      <th>Status</th>
                      {user.role === 'staff' && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {myShifts.map(shift => {
                      const staff = staffList.find(s => s.id === shift.staffId);
                      const isUpcoming = new Date(shift.date) > new Date();
                      
                      return (
                        <tr 
                          key={shift.id} 
                          style={{ backgroundColor: isUpcoming ? customStyles.primaryColorLight : '' }}
                        >
                          <td>{formatDate(shift.date)}</td>
                          <td>{staff.name}</td>
                          <td>{shift.startTime} - {shift.endTime}</td>
                          <td>{shift.location}</td>
                          <td>{shift.role}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              {getStatusBadge(shift.status)}
                              {user.role === 'manager' && (
                                <DropdownButton 
                                  variant="outline-secondary" 
                                  size="sm" 
                                  className="ms-2"
                                  title="Change Status"
                                >
                                  <Dropdown.Item onClick={() => handleStatusChange(shift.id, 'confirmed')}>
                                    <FaCheckCircle className="me-1 text-success" /> Confirmed
                                  </Dropdown.Item>
                                  <Dropdown.Item onClick={() => handleStatusChange(shift.id, 'completed')}>
                                    <FaCheckCircle className="me-1 text-info" /> Completed
                                  </Dropdown.Item>
                                  <Dropdown.Item onClick={() => handleStatusChange(shift.id, 'cancelled')}>
                                    <FaBan className="me-1 text-danger" /> Cancelled
                                  </Dropdown.Item>
                                  {/* No-Show option removed */}
                                </DropdownButton>
                              )}
                            </div>
                          </td>
                          {user.role === 'staff' && (
                            <td>
                              <div className="d-flex flex-column flex-md-row">
                                {!shift.confirmed && (
                                  <Button 
                                    size="sm" 
                                    variant="success" 
                                    className="me-md-1 mb-1 mb-md-0"
                                    onClick={() => {
                                      setSelectedShift(shift);
                                      setShowConfirmModal(true);
                                    }}
                                  >
                                    Confirm
                                  </Button>
                                )}
                                <Button 
                                  size="sm" 
                                  variant="primary"
                                  style={{ 
                                    backgroundColor: customStyles.primaryColor,
                                    borderColor: customStyles.primaryColor
                                  }}
                                  onClick={() => {
                                    setSelectedShift(shift);
                                    setShowSwapModal(true);
                                  }}
                                >
                                  <FaExchangeAlt className="me-1" /> Swap
                                </Button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
    );
  };

  // Render swap requests
  // const renderSwapRequests = () => {
  //   const relevantRequests = getRelevantSwapRequests();
    
  //   return (
  //     <Card>
  //       <Card.Body>
  //         <h5 className="mb-3">Shift Swap Requests</h5>
  //         {relevantRequests.length === 0 ? (
  //           <p>No swap requests found.</p>
  //         ) : (
  //           <div className="table-responsive">
  //             <Table>
  //               <thead>
  //                 <tr>
  //                   <th>Requester</th>
  //                   <th>Target</th>
  //                   <th>Date</th>
  //                   <th>Reason</th>
  //                   <th>Status</th>
  //                   <th>Date Requested</th>
  //                   {user.role === 'manager' && <th>Actions</th>}
  //                 </tr>
  //               </thead>
  //               <tbody>
  //                 {relevantRequests.map(request => (
  //                   <tr key={request.id}>
  //                     <td>{request.requesterName}</td>
  //                     <td>{request.targetName}</td>
  //                     <td>{formatDate(request.date)}</td>
  //                     <td>{request.reason || '-'}</td>
  //                     <td>
  //                       <Badge bg={
  //                         request.status === 'pending' ? 'warning' : 
  //                         request.status === 'approved' ? 'success' : 'danger'
  //                       }>
  //                         {request.status}
  //                       </Badge>
  //                     </td>
  //                     <td>{formatDate(request.createdAt)}</td>
  //                     {user.role === 'manager' && request.status === 'pending' && (
  //                       <td>
  //                         <div className="d-flex flex-column flex-md-row">
  //                           <Button 
  //                             size="sm" 
  //                             variant="success" 
  //                             className="me-md-1 mb-1 mb-md-0"
  //                             onClick={() => handleSwapAction(request.id, 'approved')}
  //                           >
  //                             Approve
  //                           </Button>
  //                           <Button 
  //                             size="sm" 
  //                             variant="danger"
  //                             onClick={() => handleSwapAction(request.id, 'rejected')}
  //                           >
  //                             Reject
  //                           </Button>
  //                         </div>
  //                       </td>
  //                     )}
  //                   </tr>
  //                 ))}
  //               </tbody>
  //             </Table>
  //           </div>
  //         )}
  //       </Card.Body>
  //     </Card>
  //   );
  // };

  // Render notifications
  // const renderNotifications = () => {
  //   return (
  //     <Card>
  //       <Card.Body>
  //         <h5 className="mb-3">Notifications</h5>
  //         {notifications.length === 0 ? (
  //           <p>No notifications found.</p>
  //         ) : (
  //           <div className="notification-list">
  //             {notifications.map(notification => (
  //               <div 
  //                 key={notification.id} 
  //                 className={`p-3 mb-2 rounded ${notification.read ? 'bg-light' : 'text-white'}`}
  //                 style={{ backgroundColor: !notification.read ? customStyles.primaryColor : '' }}
  //                 onClick={() => markNotificationAsRead(notification.id)}
  //               >
  //                 <div className="d-flex justify-content-between align-items-start">
  //                   <div>{notification.message}</div>
  //                   {!notification.read && <span className="badge bg-danger ms-2">New</span>}
  //                 </div>
  //                 <div className="small mt-2">
  //                   {new Date(notification.timestamp).toLocaleString()}
  //                 </div>
  //               </div>
  //             ))}
  //           </div>
  //         )}
  //       </Card.Body>
  //     </Card>
  //   );
  // };

  // Render reports (manager only)
  // const renderReports = () => {
  //   if (user.role !== 'manager') return null;
    
  //   return (
  //     <Card>
  //       <Card.Body>
  //         <h5 className="mb-3">Reports</h5>
  //         <Row>
  //           <Col md={6} className="mb-3 mb-md-0">
  //             <Card>
  //               <Card.Body>
  //                 <Card.Title>Shift Confirmation Rate</Card.Title>
  //                 <div className="d-flex align-items-center">
  //                   <div className="me-3">
  //                     <FaChartBar size={40} style={{ color: customStyles.primaryColor }} />
  //                   </div>
  //                   <div>
  //                     <h3>80%</h3>
  //                     <p className="text-muted mb-0">4 out of 5 shifts confirmed</p>
  //                   </div>
  //                 </div>
  //               </Card.Body>
  //             </Card>
  //           </Col>
  //           <Col md={6}>
  //             <Card>
  //               <Card.Body>
  //                 <Card.Title>Pending Swap Requests</Card.Title>
  //                 <div className="d-flex align-items-center">
  //                   <div className="me-3">
  //                     <FaHistory size={40} className="text-warning" />
  //                   </div>
  //                   <div>
  //                     <h3>1</h3>
  //                     <p className="text-muted mb-0">Awaiting approval</p>
  //                   </div>
  //                 </div>
  //               </Card.Body>
  //             </Card>
  //           </Col>
  //         </Row>
          
  //         <Card className="mt-4">
  //           <Card.Body>
  //             <Card.Title>Staff Attendance vs Roster</Card.Title>
  //             <div className="table-responsive">
  //               <Table>
  //                 <thead>
  //                   <tr>
  //                     <th>Staff Name</th>
  //                     <th>Total Shifts</th>
  //                     <th>Confirmed</th>
  //                     <th>Completed</th>
  //                     <th>Cancelled</th>
  //                     <th>No-Show</th>
  //                     <th>Attendance Rate</th>
  //                   </tr>
  //                 </thead>
  //                 <tbody>
  //                   {staffList.map(staff => {
  //                     const staffShifts = shifts.filter(s => s.staffId === staff.id);
  //                     const confirmedShifts = staffShifts.filter(s => s.status === 'confirmed');
  //                     const completedShifts = staffShifts.filter(s => s.status === 'completed');
  //                     const cancelledShifts = staffShifts.filter(s => s.status === 'cancelled');
  //                     const noShowShifts = staffShifts.filter(s => s.status === 'no-show');
  //                     const attendanceRate = staffShifts.length > 0 
  //                       ? Math.round((confirmedShifts.length / staffShifts.length) * 100) 
  //                       : 0;
                      
  //                     return (
  //                       <tr key={staff.id}>
  //                         <td>{staff.name}</td>
  //                         <td>{staffShifts.length}</td>
  //                         <td>{confirmedShifts.length}</td>
  //                         <td>{completedShifts.length}</td>
  //                         <td>{cancelledShifts.length}</td>
  //                         <td>{noShowShifts.length}</td>
  //                         <td>
  //                           <div className="d-flex align-items-center">
  //                             <div className="progress me-2" style={{ width: '100px' }}>
  //                               <div 
  //                                 className="progress-bar" 
  //                                 role="progressbar" 
  //                                 style={{ 
  //                                   width: `${attendanceRate}%`,
  //                                   backgroundColor: customStyles.primaryColor
  //                                 }}
  //                                 aria-valuenow={attendanceRate} 
  //                                 aria-valuemin={0} 
  //                                 aria-valuemax={100}
  //                               ></div>
  //                             </div>
  //                             {attendanceRate}%
  //                           </div>
  //                         </td>
  //                       </tr>
  //                     );
  //                   })}
  //                 </tbody>
  //               </Table>
  //             </div>
  //           </Card.Body>
  //         </Card>
  //       </Card.Body>
  //     </Card>
  //   );
  // };

  // Render shift assignment (manager only)
  // const renderShiftAssignment = () => {
  //   if (user.role !== 'manager') return null;
    
  //   return (
  //     <Card>
  //       <Card.Body>
  //         <h5 className="mb-3">Assign Shifts</h5>
  //         <Row className="mb-3">
  //           <Col md={4} className="mb-3 mb-md-0">
  //             <Form.Group>
  //               <Form.Label>Select Staff</Form.Label>
  //               <Form.Select>
  //                 <option value="">Choose staff member</option>
  //                 {staffList.map(staff => (
  //                   <option key={staff.id} value={staff.id}>{staff.name}</option>
  //                 ))}
  //               </Form.Select>
  //             </Form.Group>
  //           </Col>
  //           <Col md={4} className="mb-3 mb-md-0">
  //             <Form.Group>
  //               <Form.Label>Date</Form.Label>
  //               <Form.Control type="date" />
  //             </Form.Group>
  //           </Col>
  //           <Col md={4}>
  //             <Form.Group>
  //               <Form.Label>Time</Form.Label>
  //               <Row>
  //                 <Col>
  //                   <Form.Control type="time" placeholder="Start" />
  //                 </Col>
  //                 <Col>
  //                   <Form.Control type="time" placeholder="End" />
  //                 </Col>
  //               </Row>
  //             </Form.Group>
  //           </Col>
  //         </Row>
  //         <Row className="mb-3">
  //           <Col md={6} className="mb-3 mb-md-0">
  //             <Form.Group>
  //               <Form.Label>Location</Form.Label>
  //               <Form.Select>
  //                 <option>Main Branch</option>
  //                 <option>North Branch</option>
  //                 <option>South Branch</option>
  //                 <option>East Branch</option>
  //                 <option>West Branch</option>
  //               </Form.Select>
  //             </Form.Group>
  //           </Col>
  //           <Col md={6}>
  //             <Form.Group>
  //               <Form.Label>Role</Form.Label>
  //               <Form.Select>
  //                 <option>Staff</option>
  //                 <option>Senior Staff</option>
  //                 <option>Supervisor</option>
  //                 <option>Manager</option>
  //               </Form.Select>
  //             </Form.Group>
  //           </Col>
  //         </Row>
  //         <Button 
  //           variant="primary"
  //           style={{ 
  //             backgroundColor: customStyles.primaryColor,
  //             borderColor: customStyles.primaryColor
  //           }}
  //         >
  //           <FaPlus className="me-2" /> Assign Shift
  //         </Button>
  //       </Card.Body>
  //     </Card>
  //   );
  // };

  // Render status filter
  const renderStatusFilter = () => {
    return (
      <div className="d-flex align-items-center mb-3">
        <span className="me-2">Filter by Status:</span>
        <div className="btn-group" role="group">
          <Button 
            variant={statusFilter === 'all' ? 'primary' : 'outline-primary'}
            onClick={() => setStatusFilter('all')}
            style={{ 
              backgroundColor: statusFilter === 'all' ? customStyles.primaryColor : 'transparent',
              borderColor: customStyles.primaryColor,
              color: statusFilter === 'all' ? 'white' : customStyles.primaryColor
            }}
          >
            All
          </Button>
          <Button 
            variant={statusFilter === 'confirmed' ? 'primary' : 'outline-primary'}
            onClick={() => setStatusFilter('confirmed')}
            style={{ 
              backgroundColor: statusFilter === 'confirmed' ? customStyles.primaryColor : 'transparent',
              borderColor: customStyles.primaryColor,
              color: statusFilter === 'confirmed' ? 'white' : customStyles.primaryColor
            }}
          >
            Confirmed
          </Button>
          <Button 
            variant={statusFilter === 'pending' ? 'primary' : 'outline-primary'}
            onClick={() => setStatusFilter('pending')}
            style={{ 
              backgroundColor: statusFilter === 'pending' ? customStyles.primaryColor : 'transparent',
              borderColor: customStyles.primaryColor,
              color: statusFilter === 'pending' ? 'white' : customStyles.primaryColor
            }}
          >
            Pending
          </Button>
          <Button 
            variant={statusFilter === 'completed' ? 'primary' : 'outline-primary'}
            onClick={() => setStatusFilter('completed')}
            style={{ 
              backgroundColor: statusFilter === 'completed' ? customStyles.primaryColor : 'transparent',
              borderColor: customStyles.primaryColor,
              color: statusFilter === 'completed' ? 'white' : customStyles.primaryColor
            }}
          >
            Completed
          </Button>
          <Button 
            variant={statusFilter === 'cancelled' ? 'primary' : 'outline-primary'}
            onClick={() => setStatusFilter('cancelled')}
            style={{ 
              backgroundColor: statusFilter === 'cancelled' ? customStyles.primaryColor : 'transparent',
              borderColor: customStyles.primaryColor,
              color: statusFilter === 'cancelled' ? 'white' : customStyles.primaryColor
            }}
          >
            Cancelled
          </Button>
          {/* Removed No-Show filter button as requested */}
        </div>
      </div>
    );
  };

  return (
    <div className="duty-roster-container">
      {/* Header - Mobile View */}
      <div className="d-md-none">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h2 className="mb-0">Duty Roster</h2>
            <p className="text-muted mb-0">Manage staff shifts</p>
          </div>
          <div className="position-relative">
            <Button 
              variant="outline-primary" 
              onClick={() => setActiveTab('notifications')}
              style={{ 
                borderColor: customStyles.primaryColor,
                color: customStyles.primaryColor
              }}
            >
              <FaBell />
              {unreadNotifications > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  {unreadNotifications}
                </span>
              )}
            </Button>
          </div>
        </div>
        
        <div className="d-flex align-items-center mb-4">
          <div className="me-2">
            {user.role === 'manager' ? <FaUserShield size={20} /> : <FaUserAlt size={20} />}
          </div>
          <div>
            <div className="fw-bold">{user.name}</div>
            <div className="small text-capitalize">{user.role}</div>
          </div>
        </div>
      </div>
      
      {/* Header - Desktop View */}
      <div className="d-none d-md-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-0">Duty Roster Management</h2>
          <p className="text-muted">Manage staff shifts and schedules</p>
        </div>
        <div className="d-flex align-items-center">
          <div className="position-relative me-3">
            <Button 
              variant="outline-primary" 
              onClick={() => setActiveTab('notifications')}
              style={{ 
                borderColor: customStyles.primaryColor,
                color: customStyles.primaryColor
              }}
            >
              <FaBell />
              {unreadNotifications > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  {unreadNotifications}
                </span>
              )}
            </Button>
          </div>
          <div className="d-flex align-items-center">
            <div className="me-2">
              {user.role === 'manager' ? <FaUserShield size={20} /> : <FaUserAlt size={20} />}
            </div>
            <div>
              <div className="fw-bold">{user.name}</div>
              <div className="small text-capitalize">{user.role}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* View Toggle - Mobile View */}
      <div className="d-md-none d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex">
          {/* Removed calendar view toggle buttons */}
          <Button 
            variant="primary" 
            disabled
            style={{ 
              backgroundColor: customStyles.primaryColor,
              borderColor: customStyles.primaryColor
            }}
          >
            <FaList className="me-1" /> List View
          </Button>
        </div>
        <DropdownButton variant="outline-secondary" title="Filter">
          <Dropdown.Item>All Shifts</Dropdown.Item>
          <Dropdown.Item>Upcoming Shifts</Dropdown.Item>
          <Dropdown.Item>My Shifts Only</Dropdown.Item>
          <Dropdown.Item>Unconfirmed Shifts</Dropdown.Item>
        </DropdownButton>
      </div>
      
      {/* View Toggle - Desktop View */}
      <div className="d-none d-md-flex justify-content-between align-items-center mb-3">
        <div className="d-flex">
          {/* Removed calendar view toggle buttons */}
          <Button 
            variant="primary" 
            disabled
            style={{ 
              backgroundColor: customStyles.primaryColor,
              borderColor: customStyles.primaryColor
            }}
          >
            <FaList className="me-1" /> List View
          </Button>
        </div>
        <div className="d-flex">
          <InputGroup className="me-2" style={{ width: '250px' }}>
            <FormControl 
              placeholder="Search shifts..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button variant="outline-secondary">
              <FaSearch />
            </Button>
          </InputGroup>
          <DropdownButton variant="outline-secondary" title="Filter">
            <Dropdown.Item>All Shifts</Dropdown.Item>
            <Dropdown.Item>Upcoming Shifts</Dropdown.Item>
            <Dropdown.Item>My Shifts Only</Dropdown.Item>
            <Dropdown.Item>Unconfirmed Shifts</Dropdown.Item>
          </DropdownButton>
        </div>
      </div>
      
      {/* Main Content */}
      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4">
        <Tab eventKey="myShifts" title="My Shifts">
          {renderStatusFilter()}
          {/* Removed calendar view conditional rendering */}
          {renderListView()}
        </Tab>
        
        {/* {user.role === 'manager' && (
          <Tab eventKey="assignShifts" title="Assign Shifts">
            {renderShiftAssignment()}
          </Tab>
        )} */}
        
        {/* <Tab eventKey="swapRequests" title="Swap Requests">
          {renderSwapRequests()}
        </Tab>
        
        <Tab eventKey="notifications" title="Notifications">
          {renderNotifications()}
        </Tab> */}
        
        {/* {user.role === 'manager' && (
          <Tab eventKey="reports" title="Reports">
            {renderReports()}
          </Tab>
        )} */}
      </Tabs>
      
      {/* Swap Request Modal */}
      {/* <Modal show={showSwapModal} onHide={() => setShowSwapModal(false)} centered scrollable>
        <Modal.Header closeButton>
          <Modal.Title>Request Shift Swap</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedShift && (
            <div>
              <p>You are requesting to swap your shift on <strong>{formatDate(selectedShift.date)}</strong> from <strong>{selectedShift.startTime}</strong> to <strong>{selectedShift.endTime}</strong> at <strong>{selectedShift.location}</strong>.</p>
              
              <Form.Group className="mb-3">
                <Form.Label>Select Staff to Swap With</Form.Label>
                <Form.Select 
                  value={swapForm.targetStaffId} 
                  onChange={(e) => setSwapForm({...swapForm, targetStaffId: e.target.value})}
                >
                  <option value="">Choose staff member</option>
                  {staffList
                    .filter(s => s.id !== user.id)
                    .map(staff => (
                      <option key={staff.id} value={staff.id}>{staff.name}</option>
                    ))
                  }
                </Form.Select>
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Reason (Optional)</Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={3} 
                  value={swapForm.reason} 
                  onChange={(e) => setSwapForm({...swapForm, reason: e.target.value})}
                />
              </Form.Group>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSwapModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary"
            style={{ 
              backgroundColor: customStyles.primaryColor,
              borderColor: customStyles.primaryColor
            }}
            onClick={handleSwapRequest}
          >
            Submit Request
          </Button>
        </Modal.Footer>
      </Modal> */}
      
      {/* Confirm Shift Modal */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered scrollable>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Shift Availability</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedShift && (
            <div>
              <p>Are you sure you want to confirm your availability for following shift?</p>
              <div className="p-3 bg-light rounded">
                <p className="mb-1"><strong>Date:</strong> {formatDate(selectedShift.date)}</p>
                <p className="mb-1"><strong>Time:</strong> {selectedShift.startTime} - {selectedShift.endTime}</p>
                <p className="mb-1"><strong>Location:</strong> {selectedShift.location}</p>
                <p className="mb-0"><strong>Role:</strong> {selectedShift.role}</p>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="success"
            onClick={() => handleConfirmShift(selectedShift.id)}
          >
            Confirm Availability
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Status Change Confirmation Modal */}
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)} centered scrollable>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Status Change</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedShift && (
            <div>
              <p>Are you sure you want to change status of this shift to <strong>{newStatus}</strong>?</p>
              <div className="p-3 bg-light rounded">
                <p className="mb-1"><strong>Date:</strong> {formatDate(selectedShift.date)}</p>
                <p className="mb-1"><strong>Time:</strong> {selectedShift.startTime} - {selectedShift.endTime}</p>
                <p className="mb-1"><strong>Location:</strong> {selectedShift.location}</p>
                <p className="mb-0"><strong>Current Status:</strong> {getStatusBadge(selectedShift.status)}</p>
              </div>
              <p className="mt-3">This action cannot be undone.</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary"
            style={{ 
              backgroundColor: customStyles.primaryColor,
              borderColor: customStyles.primaryColor
            }}
            onClick={() => {
              updateShiftStatus(selectedShift.id, newStatus);
              setShowStatusModal(false);
            }}
          >
            Change Status
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DutyRoster;