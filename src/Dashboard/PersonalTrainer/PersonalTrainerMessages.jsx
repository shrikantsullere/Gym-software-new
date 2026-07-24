import React, { useState, useEffect, useRef } from 'react';
import { FaComments, FaBell, FaPaperPlane, FaSearch, FaUser, FaClock, FaCalendarAlt, FaMoneyBillWave, FaCheckDouble, FaCheck, FaEllipsisV, FaSmile, FaPaperclip } from 'react-icons/fa';
import { format, parseISO } from 'date-fns';
import 'bootstrap/dist/css/bootstrap.min.css';

const PersonalTrainerMessages = () => {
  // Mock data for demonstration
  const mockMembers = [
    { id: 1, name: "Sarah Johnson", avatar: "https://randomuser.me/api/portraits/women/1.jpg", lastSeen: "2023-11-15T10:30:00", unread: 2 },
    { id: 2, name: "Mike Thompson", avatar: "https://randomuser.me/api/portraits/men/1.jpg", lastSeen: "2023-11-15T09:15:00", unread: 0 },
    { id: 3, name: "Emily Parker", avatar: "https://randomuser.me/api/portraits/women/2.jpg", lastSeen: "2023-11-14T16:45:00", unread: 1 },
    { id: 4, name: "David Wilson", avatar: "https://randomuser.me/api/portraits/men/2.jpg", lastSeen: "2023-11-14T11:20:00", unread: 0 },
    { id: 5, name: "Lisa Anderson", avatar: "https://randomuser.me/api/portraits/women/3.jpg", lastSeen: "2023-11-13T14:30:00", unread: 3 }
  ];
  const mockMessages = [
    { id: 1, memberId: 1, text: "Hi, I have a question about my workout plan", timestamp: "2023-11-15T10:15:00", sender: "member", read: true },
    { id: 2, memberId: 1, text: "Sure, what would you like to know?", timestamp: "2023-11-15T10:20:00", sender: "trainer", read: true },
    { id: 3, memberId: 1, text: "I'm not sure about the number of sets for the bench press", timestamp: "2023-11-15T10:25:00", sender: "member", read: false },
    { id: 4, memberId: 2, text: "Can we reschedule tomorrow's session?", timestamp: "2023-11-15T09:10:00", sender: "member", read: true },
    { id: 5, memberId: 2, text: "Yes, what time works for you?", timestamp: "2023-11-15T09:15:00", sender: "trainer", read: true },
    { id: 6, memberId: 3, text: "I've been feeling some pain in my shoulder after the last workout", timestamp: "2023-11-14T16:40:00", sender: "member", read: false },
    { id: 7, memberId: 4, text: "Thanks for the diet plan, it's working great!", timestamp: "2023-11-14T11:15:00", sender: "member", read: true },
    { id: 8, memberId: 4, text: "You're welcome! Keep up the good work!", timestamp: "2023-11-14T11:20:00", sender: "trainer", read: true },
    { id: 9, memberId: 5, text: "Can you recommend some supplements for muscle gain?", timestamp: "2023-11-13T14:25:00", sender: "member", read: false },
    { id: 10, memberId: 5, text: "I'd be happy to discuss that in our next session", timestamp: "2023-11-13T14:30:00", sender: "trainer", read: false }
  ];
  const mockNotifications = [
    { id: 1, type: "booking", title: "New Session Booking", message: "Sarah Johnson booked a new session for Nov 20, 10:00 AM", timestamp: "2023-11-15T10:45:00", read: false },
    { id: 2, type: "reminder", title: "Class Reminder", message: "HIIT Class with Mike Thompson is scheduled for tomorrow at 5:30 PM", timestamp: "2023-11-15T09:30:00", read: false },
    { id: 3, type: "payment", title: "Payment Received", message: "Payment received from Emily Parker for monthly membership", timestamp: "2023-11-14T16:50:00", read: true },
    { id: 4, type: "salary", title: "Salary Update", message: "Your salary for October has been processed", timestamp: "2023-11-14T11:00:00", read: true },
    { id: 5, type: "reminder", title: "Class Reminder", message: "Yoga Class with Lisa Anderson is scheduled for tomorrow at 9:00 AM", timestamp: "2023-11-13T18:00:00", read: true },
    { id: 6, type: "booking", title: "New Session Booking", message: "David Wilson booked a new session for Nov 18, 11:00 AM", timestamp: "2023-11-13T15:30:00", read: true }
  ];
  
  // State management
  const [members, setMembers] = useState(mockMembers);
  const [messages, setMessages] = useState(mockMessages);
  const [notifications, setNotifications] = useState(mockNotifications);
  const [activeTab, setActiveTab] = useState('messages'); // 'messages' or 'notifications'
  const [selectedMember, setSelectedMember] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Custom color for all blue elements
  const customColor = '#6EB2CC';
  
  // Filter members based on search query
  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Filter unread messages
  const unreadMessages = messages.filter(message => !message.read && message.sender === 'member');
  
  // Filter unread notifications
  const unreadNotifications = notifications.filter(notification => !notification.read);
  
  // Get messages for selected member
  const getMessagesForMember = (memberId) => {
    return messages.filter(message => message.memberId === memberId);
  };
  
  // Send a new message
  const handleSendMessage = () => {
    if (newMessage.trim() === '' || !selectedMember) return;
    const newMessageObj = {
      id: messages.length + 1,
      memberId: selectedMember.id,
      text: newMessage,
      timestamp: new Date().toISOString(),
      sender: 'trainer',
      read: false
    };
    setMessages([...messages, newMessageObj]);
    setNewMessage('');
    // Mark all messages from this member as read
    setMessages(messages.map(msg => 
      msg.memberId === selectedMember.id && msg.sender === 'member' && !msg.read
        ? { ...msg, read: true }
        : msg
    ));
    // Update unread count for the member
    setMembers(members.map(member =>
      member.id === selectedMember.id
        ? { ...member, unread: 0 }
        : member
    ));
  };
  
  // Mark notification as read
  const markNotificationAsRead = (id) => {
    setNotifications(notifications.map(notification =>
      notification.id === id
        ? { ...notification, read: true }
        : notification
    ));
  };
  
  // Mark all notifications as read
  const markAllNotificationsAsRead = () => {
    setNotifications(notifications.map(notification => ({
      ...notification,
      read: true
    })));
  };
  
  // Auto-scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedMember]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Handle Enter key press in message input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Render member list
  const renderMemberList = () => (
    <div className="card shadow-sm h-100">
      <div className="card-header" style={{ backgroundColor: customColor, color: 'white' }}>
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Messages</h5>
          <div className="position-relative">
            <button 
              className="btn btn-light btn-sm position-relative" 
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <FaBell />
              {unreadNotifications.length > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  {unreadNotifications.length}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="position-absolute end-0 mt-2 p-0 shadow" style={{ width: '300px', zIndex: 1000, maxWidth: '90vw' }}>
                <div className="card">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">Notifications</h6>
                    {unreadNotifications.length > 0 && (
                      <button className="btn btn-sm btn-link" onClick={markAllNotificationsAsRead}>
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="card-body p-0">
                    {unreadNotifications.length > 0 ? (
                      unreadNotifications.map(notification => (
                        <div 
                          key={notification.id} 
                          className="p-3 border-bottom clickable-item"
                          onClick={() => markNotificationAsRead(notification.id)}
                        >
                          <div className="d-flex justify-content-between">
                            <div className="fw-bold">{notification.title}</div>
                            <small className="text-muted">
                              {format(parseISO(notification.timestamp), 'MMM d, h:mm a')}
                            </small>
                          </div>
                          <div className="text-truncate">{notification.message}</div>
                          <div className="mt-1">
                            {notification.type === 'booking' && <FaCalendarAlt className="me-1" style={{ color: customColor }} />}
                            {notification.type === 'reminder' && <FaClock className="text-warning me-1" />}
                            {notification.type === 'payment' && <FaMoneyBillWave className="text-success me-1" />}
                            {notification.type === 'salary' && <FaMoneyBillWave className="text-info me-1" />}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-muted">
                        No new notifications
                      </div>
                    )}
                  </div>
                  <div className="card-footer text-center">
                    <button className="btn btn-sm btn-link">View All Notifications</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="card-body p-0">
        <div className="p-3 border-bottom">
          <div className="input-group">
            <span className="input-group-text"><FaSearch /></span>
            <input
              type="text"
              className="form-control"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="list-group list-group-flush overflow-auto" style={{ maxHeight: 'calc(100% - 70px)' }}>
          {filteredMembers.map(member => (
            <div 
              key={member.id} 
              className={`list-group-item list-group-item-action d-flex align-items-center ${selectedMember?.id === member.id ? 'active' : ''}`}
              style={selectedMember?.id === member.id ? { backgroundColor: customColor, color: 'white', borderLeft: '4px solid ' + customColor } : {}}
              onClick={() => setSelectedMember(member)}
            >
              <div className="position-relative">
                <img 
                  src={member.avatar} 
                  alt={member.name} 
                  className="rounded-circle me-3" 
                  width="50" 
                  height="50"
                />
                <span className={`position-absolute bottom-0 end-0 border border-white rounded-circle bg-success p-1 ${member.unread === 0 ? 'd-none' : ''}`}></span>
              </div>
              <div className="flex-grow-1 min-w-0">
                <div className="d-flex justify-content-between">
                  <div className="fw-bold text-truncate">{member.name}</div>
                  <small className="text-nowrap ms-2">
                    {format(parseISO(member.lastSeen), 'MMM d')}
                  </small>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <div className="text-muted small text-truncate" style={{ maxWidth: '150px' }}>
                    {getMessagesForMember(member.id).length > 0 && 
                      getMessagesForMember(member.id)[getMessagesForMember(member.id).length - 1].text}
                  </div>
                  {member.unread > 0 && (
                    <span className="badge rounded-pill ms-2" style={{ backgroundColor: customColor }}>{member.unread}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  
  // Render chat interface
  const renderChatInterface = () => {
    if (!selectedMember) {
      return (
        <div className="card shadow-sm h-100 d-flex justify-content-center align-items-center">
          <div className="text-center text-muted p-4">
            <FaComments className="fs-1 mb-3" />
            <h5>Select a member to start chatting</h5>
          </div>
        </div>
      );
    }
    
    const memberMessages = getMessagesForMember(selectedMember.id);
    
    return (
      <div className="card shadow-sm h-100 d-flex flex-column">
        <div className="card-header d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <img 
              src={selectedMember.avatar} 
              alt={selectedMember.name} 
              className="rounded-circle me-3" 
              width="40" 
              height="40"
            />
            <div>
              <div className="fw-bold">{selectedMember.name}</div>
              <div className="small text-muted d-none d-md-block">
                Last seen {format(parseISO(selectedMember.lastSeen), 'MMM d, h:mm a')}
              </div>
            </div>
          </div>
          <div>
            <button className="btn btn-sm btn-light me-2">
              <FaEllipsisV />
            </button>
          </div>
        </div>
        <div className="card-body flex-grow-1 overflow-auto p-3">
          {memberMessages.length > 0 ? (
            <div className="d-flex flex-column">
              {memberMessages.map(message => (
                <div 
                  key={message.id} 
                  className={`mb-3 d-flex ${message.sender === 'trainer' ? 'justify-content-end' : 'justify-content-start'}`}
                >
                  <div 
                    className={`p-3 rounded-3 ${message.sender === 'trainer' ? '' : 'bg-light'}`}
                    style={message.sender === 'trainer' ? { backgroundColor: customColor, color: 'white' } : {}}
                  >
                    <div className="word-break">{message.text}</div>
                    <div className={`small mt-1 ${message.sender === 'trainer' ? 'text-white-50' : 'text-muted'}`}>
                      {format(parseISO(message.timestamp), 'h:mm a')}
                      {message.sender === 'trainer' && (
                        <span className="ms-2">
                          {message.read ? <FaCheckDouble /> : <FaCheck />}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="text-center text-muted my-5">
              <p>No messages yet. Start a conversation!</p>
            </div>
          )}
        </div>
        <div className="card-footer p-3">
          <div className="input-group">
            <button className="btn btn-light d-none d-sm-flex">
              <FaSmile />
            </button>
            <button className="btn btn-light d-none d-sm-flex">
              <FaPaperclip />
            </button>
            <textarea
              className="form-control"
              placeholder="Type a message..."
              rows="1"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              style={{ resize: 'none' }}
            ></textarea>
            <button 
              className="btn d-flex align-items-center" 
              style={{ backgroundColor: customColor, color: 'white' }}
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
            >
              <FaPaperPlane />
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // Render notifications tab
  const renderNotificationsTab = () => (
    <div className="card shadow-sm">
      <div className="card-header d-flex justify-content-between align-items-center" style={{ backgroundColor: customColor, color: 'white' }}>
        <h5 className="mb-0">Notifications</h5>
        {unreadNotifications.length > 0 && (
          <button className="btn btn-light btn-sm" onClick={markAllNotificationsAsRead}>
            Mark all as read
          </button>
        )}
      </div>
      <div className="card-body p-0">
        {notifications.length > 0 ? (
          <div className="list-group list-group-flush">
            {notifications.map(notification => (
              <div 
                key={notification.id} 
                className={`list-group-item list-group-item-action ${!notification.read ? 'bg-light' : ''}`}
                onClick={() => markNotificationAsRead(notification.id)}
              >
                <div className="d-flex justify-content-between">
                  <div className="fw-bold">{notification.title}</div>
                  <small className="text-muted text-nowrap">
                    {format(parseISO(notification.timestamp), 'MMM d, h:mm a')}
                  </small>
                </div>
                <div className="mt-1">{notification.message}</div>
                <div className="mt-2">
                  {notification.type === 'booking' && (
                    <span className="badge me-2" style={{ backgroundColor: customColor }}>
                      <FaCalendarAlt className="me-1" /> Booking
                    </span>
                  )}
                  {notification.type === 'reminder' && (
                    <span className="badge bg-warning me-2">
                      <FaClock className="me-1" /> Reminder
                    </span>
                  )}
                  {notification.type === 'payment' && (
                    <span className="badge bg-success me-2">
                      <FaMoneyBillWave className="me-1" /> Payment
                    </span>
                  )}
                  {notification.type === 'salary' && (
                    <span className="badge bg-info me-2">
                      <FaMoneyBillWave className="me-1" /> Salary
                    </span>
                  )}
                  {!notification.read && (
                    <span className="badge bg-danger">New</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-5 text-muted">
            <FaBell className="fs-1 mb-3" />
            <h5>No notifications</h5>
          </div>
        )}
      </div>
    </div>
  );
  
  return (
    <div className="PersonalTrainerMessages container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="h4 fw-bold">Messages & Notifications</h2>
      </div>
      <div className="mb-4">
        <ul className="nav nav-tabs flex-wrap">
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'messages' ? 'active' : ''}`}
              style={activeTab === 'messages' ? { color: customColor, borderBottom: `2px solid ${customColor}` } : {}}
              onClick={() => setActiveTab('messages')}
            >
              <FaComments className="me-1" /> Messages
              {unreadMessages.length > 0 && (
                <span className="badge bg-danger ms-1">{unreadMessages.length}</span>
              )}
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'notifications' ? 'active' : ''}`}
              style={activeTab === 'notifications' ? { color: customColor, borderBottom: `2px solid ${customColor}` } : {}}
              onClick={() => setActiveTab('notifications')}
            >
              <FaBell className="me-1" /> Notifications
              {unreadNotifications.length > 0 && (
                <span className="badge bg-danger ms-1">{unreadNotifications.length}</span>
              )}
            </button>
          </li>
        </ul>
      </div>
      {activeTab === 'messages' ? (
        <div className="row g-4" style={{ minHeight: '70vh' }}>
          <div className="col-12 col-md-4 col-lg-3">
            {renderMemberList()}
          </div>
          <div className="col-12 col-md-8 col-lg-9">
            {renderChatInterface()}
          </div>
        </div>
      ) : (
        renderNotificationsTab()
      )}
    </div>
  );
};

export default PersonalTrainerMessages;