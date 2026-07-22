import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaUsers, FaClock, FaMapMarkerAlt, FaUser, FaCheck, FaTimes, FaPlus, FaEdit, FaTrash, FaSearch, FaFilter, FaChevronLeft, FaChevronRight, FaEllipsisV } from 'react-icons/fa';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO, isBefore, isAfter } from 'date-fns';
import 'bootstrap/dist/css/bootstrap.min.css';
import CustomTimePicker from '../../Components/CustomTimePicker';

const PersonalTrainerGroupClasses = () => {
  // Mock data for demonstration
  const mockClasses = [
    {
      id: 1,
      name: "Morning Yoga",
      trainer: "Sarah Johnson",
      date: "2023-11-20",
      time: "7:00 AM",
      duration: 60,
      location: "Studio A",
      maxParticipants: 15,
      registeredParticipants: [
        { id: 1, name: "Mike Thompson", attended: false },
        { id: 2, name: "Emily Parker", attended: false },
        { id: 3, name: "David Wilson", attended: false },
        { id: 4, name: "Lisa Anderson", attended: false },
        { id: 5, name: "James Brown", attended: false }
      ],
      description: "Start your day with energizing yoga poses and breathing exercises.",
      status: "Upcoming"
    },
    {
      id: 2,
      name: "HIIT Bootcamp",
      trainer: "John Smith",
      date: "2023-11-20",
      time: "5:30 PM",
      duration: 45,
      location: "Gym Floor",
      maxParticipants: 20,
      registeredParticipants: [
        { id: 1, name: "Mike Thompson", attended: false },
        { id: 6, name: "Robert Johnson", attended: false },
        { id: 7, name: "Jennifer Lee", attended: false },
        { id: 8, name: "Michael Davis", attended: false },
        { id: 9, name: "Amanda Wilson", attended: false },
        { id: 10, name: "Chris Taylor", attended: false },
        { id: 11, name: "Jessica Martinez", attended: false },
        { id: 12, name: "Daniel Garcia", attended: false },
        { id: 13, name: "Sarah Rodriguez", attended: false },
        { id: 14, name: "Kevin Anderson", attended: false },
        { id: 15, name: "Michelle Thomas", attended: false },
        { id: 16, name: "Brian Jackson", attended: false },
        { id: 17, name: "Laura White", attended: false },
        { id: 18, name: "Jason Harris", attended: false },
        { id: 19, name: "Stephanie Clark", attended: false },
        { id: 20, name: "Ryan Lewis", attended: false }
      ],
      description: "High-intensity interval training to burn calories and build strength.",
      status: "Upcoming"
    },
    {
      id: 3,
      name: "Pilates Core",
      trainer: "Emily Parker",
      date: "2023-11-21",
      time: "9:00 AM",
      duration: 50,
      location: "Studio B",
      maxParticipants: 12,
      registeredParticipants: [
        { id: 2, name: "Emily Parker", attended: false },
        { id: 4, name: "Lisa Anderson", attended: false },
        { id: 6, name: "Robert Johnson", attended: false },
        { id: 8, name: "Michael Davis", attended: false },
        { id: 10, name: "Chris Taylor", attended: false },
        { id: 12, name: "Daniel Garcia", attended: false }
      ],
      description: "Strengthen your core and improve flexibility with targeted Pilates exercises.",
      status: "Upcoming"
    },
    {
      id: 4,
      name: "Spin Class",
      trainer: "David Wilson",
      date: "2023-11-15",
      time: "6:00 PM",
      duration: 60,
      location: "Studio C",
      maxParticipants: 18,
      registeredParticipants: [
        { id: 1, name: "Mike Thompson", attended: true },
        { id: 3, name: "David Wilson", attended: true },
        { id: 5, name: "James Brown", attended: true },
        { id: 7, name: "Jennifer Lee", attended: true },
        { id: 9, name: "Amanda Wilson", attended: true },
        { id: 11, name: "Jessica Martinez", attended: true },
        { id: 13, name: "Sarah Rodriguez", attended: true },
        { id: 15, name: "Michelle Thomas", attended: true },
        { id: 17, name: "Laura White", attended: true },
        { id: 19, name: "Stephanie Clark", attended: true }
      ],
      description: "High-energy cycling class with motivating music and varied intensity.",
      status: "Completed"
    },
    {
      id: 5,
      name: "Zumba Dance",
      trainer: "Lisa Anderson",
      date: "2023-11-14",
      time: "7:30 PM",
      duration: 55,
      location: "Studio A",
      maxParticipants: 25,
      registeredParticipants: [
        { id: 2, name: "Emily Parker", attended: true },
        { id: 4, name: "Lisa Anderson", attended: true },
        { id: 6, name: "Robert Johnson", attended: true },
        { id: 8, name: "Michael Davis", attended: true },
        { id: 10, name: "Chris Taylor", attended: true },
        { id: 12, name: "Daniel Garcia", attended: true },
        { id: 14, name: "Kevin Anderson", attended: true },
        { id: 16, name: "Brian Jackson", attended: true },
        { id: 18, name: "Jason Harris", attended: true },
        { id: 20, name: "Ryan Lewis", attended: true },
        { id: 21, name: "Nicole Walker", attended: true },
        { id: 22, name: "Tyler Hall", attended: true },
        { id: 23, name: "Megan Allen", attended: true },
        { id: 24, name: "Brandon Young", attended: true },
        { id: 25, name: "Samantha King", attended: true }
      ],
      description: "Fun and energetic dance fitness party with Latin-inspired moves.",
      status: "Completed"
    }
  ];
  // State management
  const [classes, setClasses] = useState(mockClasses);
  const [view, setView] = useState('upcoming'); // 'upcoming' or 'past'
  const [selectedClass, setSelectedClass] = useState(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userRole, setUserRole] = useState('trainer'); // 'trainer', 'admin', or 'member'
  const [newClass, setNewClass] = useState({
    name: '',
    trainer: '',
    date: '',
    time: '',
    duration: 60,
    location: 'Studio A',
    maxParticipants: 15,
    description: ''
  });
  
  // Custom color for all blue elements
  const customColor = '#6EB2CC';
  
  // Filter classes based on view and search
  const filteredClasses = classes.filter(cls => {
    const today = new Date();
    const classDate = parseISO(cls.date);
    
    // Filter by view (upcoming or past)
    const matchesView = view === 'upcoming' ? 
      isAfter(classDate, today) || isSameDay(classDate, today) : 
      isBefore(classDate, today);
    
    // Filter by search query
    const matchesSearch = searchQuery === '' || 
      cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.trainer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesView && matchesSearch;
  });
  // Handle class registration
  const handleRegister = (classId) => {
    const classToUpdate = classes.find(cls => cls.id === classId);
    
    if (classToUpdate.registeredParticipants.length >= classToUpdate.maxParticipants) {
      alert('This class is already full!');
      return;
    }
    
    // In a real app, this would be the logged-in user
    const newParticipant = {
      id: 26, // This would be the user's ID
      name: "Current User", // This would be the user's name
      attended: false
    };
    
    setClasses(classes.map(cls => 
      cls.id === classId 
        ? { ...cls, registeredParticipants: [...cls.registeredParticipants, newParticipant] } 
        : cls
    ));
    
    setShowRegisterModal(false);
    setSelectedClass(null);
  };
  // Handle class cancellation
  const handleCancelRegistration = (classId, participantId) => {
    setClasses(classes.map(cls => 
      cls.id === classId 
        ? { ...cls, registeredParticipants: cls.registeredParticipants.filter(p => p.id !== participantId) } 
        : cls
    ));
  };
  // Handle attendance marking
  const handleMarkAttendance = (classId, participantId, attended) => {
    setClasses(classes.map(cls => 
      cls.id === classId 
        ? { 
            ...cls, 
            registeredParticipants: cls.registeredParticipants.map(p => 
              p.id === participantId ? { ...p, attended } : p
            ) 
          } 
        : cls
    ));
  };
  // Handle adding a new class
  const handleAddClass = () => {
    if (newClass.name && newClass.trainer && newClass.date && newClass.time) {
      const newId = Math.max(...classes.map(c => c.id), 0) + 1;
      const classToAdd = {
        id: newId,
        name: newClass.name,
        trainer: newClass.trainer,
        date: newClass.date,
        time: newClass.time,
        duration: newClass.duration,
        location: newClass.location,
        maxParticipants: newClass.maxParticipants,
        registeredParticipants: [],
        description: newClass.description,
        status: "Upcoming"
      };
      
      setClasses([...classes, classToAdd]);
      setShowAddClassModal(false);
      setNewClass({
        name: '',
        trainer: '',
        date: '',
        time: '',
        duration: 60,
        location: 'Studio A',
        maxParticipants: 15,
        description: ''
      });
    }
  };
  // Handle deleting a class
  const handleDeleteClass = (classId) => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      setClasses(classes.filter(cls => cls.id !== classId));
      if (selectedClass && selectedClass.id === classId) {
        setSelectedClass(null);
      }
    }
  };
  // Open attendance modal
  const openAttendanceModal = (cls) => {
    setSelectedClass(cls);
    setShowAttendanceModal(true);
  };
  // Open register modal
  const openRegisterModal = (cls) => {
    setSelectedClass(cls);
    setShowRegisterModal(true);
  };
  // Render class list
  const renderClassList = () => (
    <div className="card shadow-sm">
      <div className="card-header bg-light">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
          <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center mb-3 mb-md-0 w-100">
            <div className="input-group me-md-2 mb-2 mb-md-0" style={{ maxWidth: '250px' }}>
              <span className="input-group-text"><FaSearch /></span>
              <input
                type="text"
                className="form-control"
                placeholder="Search classes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="btn-group w-md-auto" role="group">
              <button 
                className={`btn flex-fill ${view === 'upcoming' ? '' : 'btn-outline-primary'}`}
                style={{ 
                  backgroundColor: view === 'upcoming' ? customColor : '',
                  borderColor: customColor,
                  color: view === 'upcoming' ? 'white' : customColor
                }}
                onClick={() => setView('upcoming')}
              >
                Upcoming
              </button>
              <button 
                className={`btn flex-fill ${view === 'past' ? '' : 'btn-outline-primary'}`}
                style={{ 
                  backgroundColor: view === 'past' ? customColor : '',
                  borderColor: customColor,
                  color: view === 'past' ? 'white' : customColor,
                  width: '100px'
                }}
                onClick={() => setView('past')}
              >
                Past
              </button>
            </div>
          </div>
          {(userRole === 'trainer' || userRole === 'admin') && (
            <button 
              className="btn btn-sm mt-2 mt-md-0  w-md-auto" 
              style={{ backgroundColor: customColor, color: 'white', width: '150px' }}
              onClick={() => setShowAddClassModal(true)}
            >
              <FaPlus className="me-1" /> Add Class
            </button>
          )}
        </div>
      </div>
      <div className="card-body p-0">
        {filteredClasses.length > 0 ? (
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Class</th>
                  <th className="d-none d-sm-table-cell">Date & Time</th>
                  <th className="d-none d-md-table-cell">Trainer</th>
                  <th className="d-none d-md-table-cell">Location</th>
                  <th>Participants</th>
                  <th>Status</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClasses.map(cls => (
                  <tr key={cls.id} className="clickable-row" onClick={() => setSelectedClass(cls)}>
                    <td>
                      <div className="fw-bold">{cls.name}</div>
                      <div className="d-sm-none text-muted small">
                        {format(parseISO(cls.date), 'MMM d')} at {cls.time}
                      </div>
                      <div className="d-md-none text-muted small">
                        {cls.trainer} | {cls.location}
                      </div>
                    </td>
                    <td className="d-none d-sm-table-cell">
                      <div>{format(parseISO(cls.date), 'MMM d, yyyy')}</div>
                      <div className="text-muted small">{cls.time} ({cls.duration} min)</div>
                    </td>
                    <td className="d-none d-md-table-cell">{cls.trainer}</td>
                    <td className="d-none d-md-table-cell">{cls.location}</td>
                    <td>
                      <div className="d-flex align-items-center">
                        <FaUsers className="me-1" />
                        <span>{cls.registeredParticipants.length}/{cls.maxParticipants}</span>
                      </div>
                      <div className="progress mt-1" style={{ height: '5px' }}>
                        <div 
                          className="progress-bar" 
                          style={{ 
                            backgroundColor: customColor,
                            width: `${(cls.registeredParticipants.length / cls.maxParticipants) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={{
                        backgroundColor: 
                          cls.status === 'Completed' ? '#198754' : 
                          cls.status === 'Cancelled' ? '#dc3545' : 
                          customColor
                      }}>
                        {cls.status}
                      </span>
                    </td>
                    <td className="text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="d-flex justify-content-center">
                        {/* Dropdown for mobile */}
                        <div className="dropdown d-md-none">
                          <button 
                            className="btn btn-sm" 
                            type="button" 
                            data-bs-toggle="dropdown" 
                            aria-expanded="false"
                            style={{ color: customColor }}
                          >
                            <FaEllipsisV />
                          </button>
                          <ul className="dropdown-menu dropdown-menu-end">
                            {userRole === 'member' && cls.status === 'Upcoming' && (
                              <li>
                                <button 
                                  className="dropdown-item"
                                  onClick={() => openRegisterModal(cls)}
                                  disabled={cls.registeredParticipants.length >= cls.maxParticipants}
                                >
                                  <FaPlus className="me-2" /> Register
                                </button>
                              </li>
                            )}
                            {(userRole === 'trainer' || userRole === 'admin') && (
                              <>
                                {cls.status === 'Upcoming' && (
                                  <li>
                                    <button 
                                      className="dropdown-item"
                                      onClick={() => openRegisterModal(cls)}
                                    >
                                      <FaPlus className="me-2" /> Register Member
                                    </button>
                                  </li>
                                )}
                                <li>
                                  <button 
                                    className="dropdown-item"
                                    onClick={() => openAttendanceModal(cls)}
                                  >
                                    <FaUsers className="me-2" /> Attendance
                                  </button>
                                </li>
                                <li>
                                  <button 
                                    className="dropdown-item text-danger"
                                    onClick={() => handleDeleteClass(cls.id)}
                                  >
                                    <FaTrash className="me-2" /> Delete
                                  </button>
                                </li>
                              </>
                            )}
                          </ul>
                        </div>
                        
                        {/* Button group for desktop */}
                        <div className="btn-group d-none d-md-flex" role="group">
                          {userRole === 'member' && cls.status === 'Upcoming' && (
                            <button 
                              className="btn btn-sm"
                              style={{ 
                                borderColor: customColor,
                                color: customColor
                              }}
                              onClick={() => openRegisterModal(cls)}
                              disabled={cls.registeredParticipants.length >= cls.maxParticipants}
                            >
                              <FaPlus /> <span className="d-none d-lg-inline-block">Register</span>
                            </button>
                          )}
                          {(userRole === 'trainer' || userRole === 'admin') && (
                            <>
                              {cls.status === 'Upcoming' && (
                                <button 
                                  className="btn btn-sm"
                                  style={{ 
                                    borderColor: customColor,
                                    color: customColor
                                  }}
                                  onClick={() => openRegisterModal(cls)}
                                >
                                  <FaPlus /> <span className="d-none d-lg-inline-block">Register</span>
                                </button>
                              )}
                              <button 
                                className="btn btn-sm"
                                style={{ 
                                  borderColor: customColor,
                                  color: customColor
                                }}
                                onClick={() => openAttendanceModal(cls)}
                              >
                                <FaUsers /> <span className="d-none d-lg-inline-block">Attendance</span>
                              </button>
                              <button 
                                className="btn btn-sm btn-outline-danger" 
                                onClick={() => handleDeleteClass(cls.id)}
                              >
                                <FaTrash />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-4">
            <p>No classes found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
  // Render class details
  const renderClassDetails = () => {
    if (!selectedClass) return null;
    
    return (
      <div className="card shadow-sm mt-4">
        <div className="card-header bg-light">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Class Details</h5>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => setSelectedClass(null)}>
              Close
            </button>
          </div>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <h6 className="text-muted">Class Information</h6>
              <table className="table table-borderless">
                <tbody>
                  <tr>
                    <td style={{ width: '150px' }}>Name:</td>
                    <td><strong>{selectedClass.name}</strong></td>
                  </tr>
                  <tr>
                    <td>Date & Time:</td>
                    <td>
                      <strong>{format(parseISO(selectedClass.date), 'EEEE, MMMM d, yyyy')}</strong> at {selectedClass.time} ({selectedClass.duration} min)
                    </td>
                  </tr>
                  <tr>
                    <td>Trainer:</td>
                    <td>{selectedClass.trainer}</td>
                  </tr>
                  <tr>
                    <td>Location:</td>
                    <td>{selectedClass.location}</td>
                  </tr>
                  <tr>
                    <td>Participants:</td>
                    <td>
                      <div className="d-flex align-items-center">
                        <FaUsers className="me-1" />
                        <span>{selectedClass.registeredParticipants.length}/{selectedClass.maxParticipants}</span>
                      </div>
                      <div className="progress mt-1" style={{ height: '5px' }}>
                        <div 
                          className="progress-bar" 
                          style={{ 
                            backgroundColor: customColor,
                            width: `${(selectedClass.registeredParticipants.length / selectedClass.maxParticipants) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>Status:</td>
                    <td>
                      <span className="badge" style={{
                        backgroundColor: 
                          selectedClass.status === 'Completed' ? '#198754' : 
                          selectedClass.status === 'Cancelled' ? '#dc3545' : 
                          customColor
                      }}>
                        {selectedClass.status}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
              
              <h6 className="text-muted mt-3">Description</h6>
              <p>{selectedClass.description}</p>
            </div>
            <div className="col-md-6">
              <h6 className="text-muted">Registered Participants</h6>
              <div className="table-responsive" style={{ maxHeight: '300px' }}>
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Status</th>
                      {selectedClass.status === 'Upcoming' && userRole !== 'member' && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedClass.registeredParticipants.length > 0 ? (
                      selectedClass.registeredParticipants.map(participant => (
                        <tr key={participant.id}>
                          <td>{participant.name}</td>
                          <td>
                            {selectedClass.status === 'Completed' ? (
                              participant.attended ? (
                                <span className="badge" style={{ backgroundColor: '#198754' }}>Attended</span>
                              ) : (
                                <span className="badge" style={{ backgroundColor: '#dc3545' }}>Absent</span>
                              )
                            ) : (
                              <span className="badge" style={{ backgroundColor: '#6c757d' }}>Registered</span>
                            )}
                          </td>
                          {selectedClass.status === 'Upcoming' && userRole !== 'member' && (
                            <td>
                              <button 
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleCancelRegistration(selectedClass.id, participant.id)}
                              >
                                <FaTimes />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={selectedClass.status === 'Upcoming' && userRole !== 'member' ? 3 : 2} className="text-center">
                          No participants registered
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div className="d-flex flex-column flex-md-row justify-content-end mt-4 gap-2">
            {userRole === 'member' && selectedClass.status === 'Upcoming' && (
              <button 
                className="btn"
                style={{ backgroundColor: customColor, color: 'white' }}
                onClick={() => openRegisterModal(selectedClass)}
                disabled={selectedClass.registeredParticipants.length >= selectedClass.maxParticipants}
              >
                <FaPlus className="me-1" /> Register for Class
              </button>
            )}
            {(userRole === 'trainer' || userRole === 'admin') && (
              <>
                {selectedClass.status === 'Upcoming' && (
                  <button 
                    className="btn"
                    style={{ backgroundColor: customColor, color: 'white' }}
                    onClick={() => openRegisterModal(selectedClass)}
                  >
                    <FaPlus className="me-1" /> Register Member
                  </button>
                )}
                <button 
                  className="btn"
                  style={{ backgroundColor: customColor, color: 'white' }}
                  onClick={() => openAttendanceModal(selectedClass)}
                >
                  <FaUsers className="me-1" /> Manage Attendance
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };
  // Render attendance modal
  const renderAttendanceModal = () => {
    if (!selectedClass) return null;
    
    return (
      <div className={`modal ${showAttendanceModal ? 'show' : ''}`} 
           tabIndex="-1" 
           style={{ display: showAttendanceModal ? 'block' : 'none', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header text-white" style={{ backgroundColor: customColor }}>
              <h5 className="modal-title">Manage Attendance - {selectedClass.name}</h5>
              <button type="button" className="btn-close btn-close-white" onClick={() => setShowAttendanceModal(false)}></button>
            </div>
            <div className="modal-body">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3">
                <div>
                  <strong>{format(parseISO(selectedClass.date), 'EEEE, MMMM d, yyyy')}</strong> at {selectedClass.time}
                </div>
                <div>
                  <span className="badge" style={{ backgroundColor: '#6c757d' }}>
                    {selectedClass.registeredParticipants.filter(p => p.attended).length} of {selectedClass.registeredParticipants.length} attended
                  </span>
                </div>
              </div>
              
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Participant</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedClass.registeredParticipants.length > 0 ? (
                      selectedClass.registeredParticipants.map(participant => (
                        <tr key={participant.id}>
                          <td>{participant.name}</td>
                          <td>
                            {participant.attended ? (
                              <span className="badge" style={{ backgroundColor: '#198754' }}>Attended</span>
                            ) : (
                              <span className="badge" style={{ backgroundColor: '#dc3545' }}>Absent</span>
                            )}
                          </td>
                          <td>
                            <div className="btn-group" role="group">
                              <button 
                                className={`btn btn-sm ${participant.attended ? '' : 'btn-outline-success'}`}
                                style={{ 
                                  backgroundColor: participant.attended ? '#198754' : '',
                                  borderColor: '#198754',
                                  color: participant.attended ? 'white' : '#198754'
                                }}
                                onClick={() => handleMarkAttendance(selectedClass.id, participant.id, true)}
                              >
                                <FaCheck /> Present
                              </button>
                              <button 
                                className={`btn btn-sm ${!participant.attended ? '' : 'btn-outline-danger'}`}
                                style={{ 
                                  backgroundColor: !participant.attended ? '#dc3545' : '',
                                  borderColor: '#dc3545',
                                  color: !participant.attended ? 'white' : '#dc3545'
                                }}
                                onClick={() => handleMarkAttendance(selectedClass.id, participant.id, false)}
                              >
                                <FaTimes /> Absent
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="text-center">
                          No participants registered
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowAttendanceModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  // Render register modal
  const renderRegisterModal = () => {
    if (!selectedClass) return null;
    
    return (
      <div className={`modal ${showRegisterModal ? 'show' : ''}`} 
           tabIndex="-1" 
           style={{ display: showRegisterModal ? 'block' : 'none', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header text-white" style={{ backgroundColor: customColor }}>
              <h5 className="modal-title">Register for Class</h5>
              <button type="button" className="btn-close btn-close-white" onClick={() => setShowRegisterModal(false)}></button>
            </div>
            <div className="modal-body">
              <div className="card mb-3">
                <div className="card-body">
                  <h5 className="card-title">{selectedClass.name}</h5>
                  <p className="card-text">{selectedClass.description}</p>
                  <div className="d-flex flex-column flex-md-row justify-content-between">
                    <div className="mb-2 mb-md-0">
                      <FaCalendarAlt className="me-1" />
                      {format(parseISO(selectedClass.date), 'MMM d, yyyy')} at {selectedClass.time}
                    </div>
                    <div className="mb-2 mb-md-0">
                      <FaMapMarkerAlt className="me-1" />
                      {selectedClass.location}
                    </div>
                    <div>
                      <FaUser className="me-1" />
                      {selectedClass.trainer}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="alert alert-info">
                <FaUsers className="me-1" />
                {selectedClass.registeredParticipants.length} of {selectedClass.maxParticipants} spots filled
                <div className="progress mt-2" style={{ height: '10px' }}>
                  <div 
                    className="progress-bar" 
                    style={{ 
                      backgroundColor: customColor,
                      width: `${(selectedClass.registeredParticipants.length / selectedClass.maxParticipants) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
              
              {selectedClass.registeredParticipants.length >= selectedClass.maxParticipants ? (
                <div className="alert alert-warning">
                  This class is already full. You cannot register at this time.
                </div>
              ) : (
                <p>Are you sure you want to register for this class?</p>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowRegisterModal(false)}>
                Cancel
              </button>
              <button 
                type="button" 
                className="btn"
                style={{ backgroundColor: customColor, color: 'white' }}
                onClick={() => handleRegister(selectedClass.id)}
                disabled={selectedClass.registeredParticipants.length >= selectedClass.maxParticipants}
              >
                Register
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  // Render add class modal
  const renderAddClassModal = () => (
    <div className={`modal ${showAddClassModal ? 'show' : ''}`} 
         tabIndex="-1" 
         style={{ display: showAddClassModal ? 'block' : 'none', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header text-white" style={{ backgroundColor: customColor }}>
            <h5 className="modal-title">Add New Class</h5>
            <button type="button" className="btn-close btn-close-white" onClick={() => setShowAddClassModal(false)}></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label">Class Name</label>
              <input 
                type="text" 
                className="form-control" 
                value={newClass.name}
                onChange={(e) => setNewClass({...newClass, name: e.target.value})}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Trainer</label>
              <input 
                type="text" 
                className="form-control" 
                value={newClass.trainer}
                onChange={(e) => setNewClass({...newClass, trainer: e.target.value})}
              />
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Date</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={newClass.date}
                  onChange={(e) => setNewClass({...newClass, date: e.target.value})}
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Time</label>
                <CustomTimePicker 
                  className="form-control" 
                  name="time"
                  value={newClass.time}
                  onChange={(e) => setNewClass({...newClass, time: e.target.value})}
                />
              </div>
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Duration (minutes)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={newClass.duration}
                  onChange={(e) => setNewClass({...newClass, duration: parseInt(e.target.value) || 60})}
                  min="15"
                  max="180"
                  step="15"
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Max Participants</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={newClass.maxParticipants}
                  onChange={(e) => setNewClass({...newClass, maxParticipants: parseInt(e.target.value) || 15})}
                  min="1"
                  max="50"
                />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Location</label>
              <select 
                className="form-select" 
                value={newClass.location}
                onChange={(e) => setNewClass({...newClass, location: e.target.value})}
              >
                <option value="Studio A">Studio A</option>
                <option value="Studio B">Studio B</option>
                <option value="Studio C">Studio C</option>
                <option value="Gym Floor">Gym Floor</option>
                <option value="Pool">Pool</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Description</label>
              <textarea 
                className="form-control" 
                rows="3"
                value={newClass.description}
                onChange={(e) => setNewClass({...newClass, description: e.target.value})}
              ></textarea>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddClassModal(false)}>
              Cancel
            </button>
            <button 
              type="button" 
              className="btn"
              style={{ backgroundColor: customColor, color: 'white' }}
              onClick={handleAddClass}
            >
              Add Class
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  return (
    <div className="GroupClasses container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="h4 fw-bold">Group Classes</h2>
      </div>
      {renderClassList()}
      {selectedClass && renderClassDetails()}
      {renderAttendanceModal()}
      {renderRegisterModal()}
      {renderAddClassModal()}
    </div>
  );
};
export default PersonalTrainerGroupClasses;