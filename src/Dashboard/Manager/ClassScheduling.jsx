import React, { useState } from 'react';
import {
  Calendar,
  Person,
  People,
  Clock,
  GeoAlt,
  Pencil,
  X,
  CheckCircle,
  ClockHistory,
  Download,
  Bell,
  Search,
  Filter,
  Plus
} from 'react-bootstrap-icons';
import CustomTimePicker from '../../Components/CustomTimePicker';

const ClassScheduling = () => {
  // State management
  const [activeTab, setActiveTab] = useState('personal');
  const [calendarView, setCalendarView] = useState('week');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showConflictAlert, setShowConflictAlert] = useState(false);

  // Sample data
  const personalClasses = [
    { id: 1, member: 'John Doe', trainer: 'Sarah Wilson', date: '2023-06-15', time: '10:00 - 11:00', status: 'Scheduled' },
    { id: 2, member: 'Emma Smith', trainer: 'Mike Johnson', date: '2023-06-16', time: '14:00 - 15:00', status: 'Completed' },
    { id: 3, member: 'Alex Brown', trainer: 'Sarah Wilson', date: '2023-06-17', time: '11:30 - 12:30', status: 'Cancelled' }
  ];

  const groupClasses = [
    { id: 1, title: 'Yoga Basics', trainer: 'Lisa Chen', date: '2023-06-15', time: '09:00 - 10:00', capacity: 20, enrolled: 15, status: 'Upcoming' },
    { id: 2, title: 'Zumba Dance', trainer: 'Carlos Rodriguez', date: '2023-06-16', time: '18:00 - 19:00', capacity: 25, enrolled: 25, status: 'Full' },
    { id: 3, title: 'HIIT Training', trainer: 'James Wilson', date: '2023-06-17', time: '07:00 - 08:00', capacity: 15, enrolled: 10, status: 'Upcoming' }
  ];

  const trainers = ['Sarah Wilson', 'Mike Johnson', 'Lisa Chen', 'Carlos Rodriguez', 'James Wilson'];
  const members = ['John Doe', 'Emma Smith', 'Alex Brown', 'Michael Taylor', 'Sophia Williams'];
  const rooms = ['Yoga Studio', 'Main Hall', 'Cardio Room', 'Poolside'];

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <h1 className="h2 mb-4">Class Scheduling</h1>

          {/* Tabs for Personal/Group Classes */}
          <ul className="nav nav-tabs mb-4">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'personal' ? 'active' : ''}`}
                onClick={() => setActiveTab('personal')}
              >
                <Person className="me-2" /> Personal Classes
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'group' ? 'active' : ''}`}
                onClick={() => setActiveTab('group')}
              >
                <People className="me-2" /> Group Classes
              </button>
            </li>
          </ul>

          {/* Action Bar */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div className="d-flex">
              <div className="btn-group me-2">
                {/* Day Button */}
                <button
                  className={`btn btn-outline-primary ${calendarView === 'day' ? 'active' : ''}`}
                  onClick={() => setCalendarView('day')}
                  style={
                    calendarView === 'day'
                      ? {
                        backgroundColor: '#2f6a87',
                        color: '#fff',
                        borderColor: '#2f6a87',
                        transition: 'all 0.3s ease',
                      }
                      : {
                        transition: 'all 0.3s ease',
                      }
                  }
                  onMouseEnter={(e) => {
                    if (calendarView !== 'day') {
                      e.target.style.backgroundColor = '#2f6a87';
                      e.target.style.color = '#fff';
                      e.target.style.borderColor = '#2f6a87';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (calendarView !== 'day') {
                      e.target.style.backgroundColor = '';
                      e.target.style.color = '';
                      e.target.style.borderColor = '';
                    }
                  }}
                >
                  Day
                </button>

                {/* Week Button */}
                <button
                  className={`btn btn-outline-primary ${calendarView === 'week' ? 'active' : ''}`}
                  onClick={() => setCalendarView('week')}
                  style={
                    calendarView === 'week'
                      ? {
                        backgroundColor: '#2f6a87',
                        color: '#fff',
                        borderColor: '#2f6a87',
                        transition: 'all 0.3s ease',
                      }
                      : {
                        transition: 'all 0.3s ease',
                      }
                  }
                  onMouseEnter={(e) => {
                    if (calendarView !== 'week') {
                      e.target.style.backgroundColor = '#2f6a87';
                      e.target.style.color = '#fff';
                      e.target.style.borderColor = '#2f6a87';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (calendarView !== 'week') {
                      e.target.style.backgroundColor = '';
                      e.target.style.color = '';
                      e.target.style.borderColor = '';
                    }
                  }}
                >
                  Week
                </button>

                {/* Month Button */}
                <button
                  className={`btn btn-outline-primary ${calendarView === 'month' ? 'active' : ''}`}
                  onClick={() => setCalendarView('month')}
                  style={
                    calendarView === 'month'
                      ? {
                        backgroundColor: '#2f6a87',
                        color: '#fff',
                        borderColor: '#2f6a87',
                        transition: 'all 0.3s ease',
                      }
                      : {
                        transition: 'all 0.3s ease',
                      }
                  }
                  onMouseEnter={(e) => {
                    if (calendarView !== 'month') {
                      e.target.style.backgroundColor = '#2f6a87';
                      e.target.style.color = '#fff';
                      e.target.style.borderColor = '#2f6a87';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (calendarView !== 'month') {
                      e.target.style.backgroundColor = '';
                      e.target.style.color = '';
                      e.target.style.borderColor = '';
                    }
                  }}
                >
                  Month
                </button>
              </div>

              <div className="dropdown me-2">
                <button className="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                  <Filter className="me-1" /> Filter
                </button>
                <ul className="dropdown-menu">
                  <li><a className="dropdown-item" href="#">By Trainer</a></li>
                  <li><a className="dropdown-item" href="#">By Class Type</a></li>
                  <li><a className="dropdown-item" href="#">By Member</a></li>
                </ul>
              </div>

              <button className="btn btn-outline-success me-2">
                <Download className="me-1" /> Export
              </button>
            </div>

            <button
              className="btn btn-outline-light" style={{ backgroundColor: '#2f6a87', color: '#fff' }}
              onClick={() => setShowCreateForm(true)}
            >
              <Plus className="me-1" /> Create New Class
            </button>
          </div>

          {/* Conflict Alert */}
          {showConflictAlert && (
            <div className="alert alert-warning alert-dismissible fade show" role="alert">
              <strong>Conflict Detected!</strong> This trainer/member is already booked at the selected time.
              <button type="button" className="btn-close" onClick={() => setShowConflictAlert(false)}></button>
            </div>
          )}

          {/* Content based on active tab */}
          {activeTab === 'personal' ? (
            <div>
              {/* Personal Classes Table View */}
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Personal Classes</h5>
                  <div className="d-flex">
                    <div className="input-group me-2" style={{ width: '300px' }}>
                      <span className="input-group-text"><Search /></span>
                      <input type="text" className="form-control" placeholder="Search classes..." />
                    </div>
                  </div>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Member Name</th>
                          <th>Trainer</th>
                          <th>Date</th>
                          <th>Time</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {personalClasses.map(cls => (
                          <tr key={cls.id}>
                            <td>{cls.member}</td>
                            <td>{cls.trainer}</td>
                            <td>{cls.date}</td>
                            <td>{cls.time}</td>
                            <td>
                              <span className={`badge ${cls.status === 'Scheduled' ? 'bg-warning' :
                                cls.status === 'Completed' ? 'bg-success' : 'bg-danger'
                                }`}>
                                {cls.status}
                              </span>
                            </td>
                            <td>
                              <button className="btn btn-sm btn-outline-primary me-1">
                                <Pencil size={14} />
                              </button>
                              <button className="btn btn-sm btn-outline-danger">
                                <X size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Personal Classes Calendar View (simplified) */}
              <div className="card mt-4">
                <div className="card-header">
                  <h5 className="mb-0">Calendar View</h5>
                </div>
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-center bg-light rounded" style={{ height: '400px' }}>
                    <div className="text-center text-muted">
                      <Calendar size={48} className="mb-2" />
                      <p>Calendar visualization would appear here<br />with personal classes shown as events</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {/* Group Classes Card View */}
              <div className="row">
                {groupClasses.map(cls => (
                  <div key={cls.id} className="col-md-6 col-lg-4 mb-4">
                    <div className="card h-100">
                      <div className="card-header d-flex justify-content-between align-items-center">
                        <h6 className="mb-0">{cls.title}</h6>
                        <span className={`badge ${cls.status === 'Upcoming' ? 'bg-primary' : 'bg-secondary'
                          }`}>
                          {cls.status}
                        </span>
                      </div>
                      <div className="card-body">
                        <div className="mb-2"><strong>Trainer:</strong> {cls.trainer}</div>
                        <div className="mb-2"><strong>Time:</strong> {cls.date}, {cls.time}</div>
                        <div className="mb-3">
                          <strong>Enrollment:</strong> {cls.enrolled}/{cls.capacity}
                          <div className="progress mt-1" style={{ height: '8px' }}>
                            <div
                              className="progress-bar"
                              role="progressbar"
                              style={{ width: `${(cls.enrolled / cls.capacity) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="d-flex justify-content-between">
                          <button className="btn btn-sm btn-outline-primary">
                            View Details
                          </button>
                          <button className="btn btn-sm btn-outline-success" disabled={cls.status === 'Full'}>
                            {cls.status === 'Full' ? 'Class Full' : 'Register'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Group Classes List View (Admin) */}
              <div className="card mt-4">
                <div className="card-header">
                  <h5 className="mb-0">Group Classes List</h5>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Class Name</th>
                          <th>Trainer</th>
                          <th>Date/Time</th>
                          <th>Capacity</th>
                          <th>Enrolled</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupClasses.map(cls => (
                          <tr key={cls.id}>
                            <td>{cls.title}</td>
                            <td>{cls.trainer}</td>
                            <td>{cls.date}, {cls.time}</td>
                            <td>{cls.capacity}</td>
                            <td>{cls.enrolled}</td>
                            <td>
                              <span className={`badge ${cls.status === 'Upcoming' ? 'bg-primary' : 'bg-secondary'
                                }`}>
                                {cls.status}
                              </span>
                            </td>
                            <td>
                              <button className="btn btn-sm btn-outline-primary me-1">
                                <Pencil size={14} />
                              </button>
                              <button className="btn btn-sm btn-outline-danger">
                                <X size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Create Class Modal */}
          {showCreateForm && (
            <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="modal-dialog modal-lg">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">
                      {activeTab === 'personal' ? 'Create Personal Class' : 'Create Group Class'}
                    </h5>
                    <button type="button" className="btn-close" onClick={() => setShowCreateForm(false)}></button>
                  </div>
                  <div className="modal-body">
                    {activeTab === 'personal' ? (
                      <form>
                        <div className="row mb-3">
                          <div className="col-md-6">
                            <label className="form-label">Member</label>
                            <select className="form-select">
                              <option value="">Select Member</option>
                              {members.map(member => (
                                <option key={member} value={member}>{member}</option>
                              ))}
                            </select>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Trainer</label>
                            <select className="form-select">
                              <option value="">Select Trainer</option>
                              {trainers.map(trainer => (
                                <option key={trainer} value={trainer}>{trainer}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="row mb-3">
                          <div className="col-md-6">
                            <label className="form-label">Date</label>
                            <input type="date" className="form-control" />
                          </div>
                          <div className="col-md-3">
                            <label className="form-label">Start Time</label>
                            <CustomTimePicker className="form-control" />
                          </div>
                          <div className="col-md-3">
                            <label className="form-label">End Time</label>
                            <CustomTimePicker className="form-control" />
                          </div>
                        </div>

                        <div className="row mb-3">
                          <div className="col-md-6">
                            <label className="form-label">Duration</label>
                            <input type="text" className="form-control" disabled placeholder="Auto-calculated" />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Location</label>
                            <select className="form-select">
                              <option value="">Select Room</option>
                              {rooms.map(room => (
                                <option key={room} value={room}>{room}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="mb-3">
                          <label className="form-label">Notes/Remarks</label>
                          <textarea className="form-control" rows="3"></textarea>
                        </div>
                      </form>
                    ) : (
                      <form>
                        <div className="mb-3">
                          <label className="form-label">Class Title</label>
                          <input type="text" className="form-control" placeholder="e.g., Yoga, Zumba, HIIT" />
                        </div>

                        <div className="row mb-3">
                          <div className="col-md-6">
                            <label className="form-label">Trainer</label>
                            <select className="form-select">
                              <option value="">Select Trainer</option>
                              {trainers.map(trainer => (
                                <option key={trainer} value={trainer}>{trainer}</option>
                              ))}
                            </select>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Capacity</label>
                            <input type="number" className="form-control" min="1" />
                          </div>
                        </div>

                        <div className="row mb-3">
                          <div className="col-md-6">
                            <label className="form-label">Date</label>
                            <input type="date" className="form-control" />
                          </div>
                          <div className="col-md-3">
                            <label className="form-label">Start Time</label>
                            <CustomTimePicker className="form-control" />
                          </div>
                          <div className="col-md-3">
                            <label className="form-label">End Time</label>
                            <CustomTimePicker className="form-control" />
                          </div>
                        </div>

                        <div className="mb-3">
                          <label className="form-label">Recurrence</label>
                          <select className="form-select">
                            <option value="">No recurrence</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="custom">Custom</option>
                          </select>
                        </div>

                        <div className="mb-3">
                          <label className="form-label">Enrolled Members</label>
                          <select className="form-select" multiple>
                            {members.map(member => (
                              <option key={member} value={member}>{member}</option>
                            ))}
                          </select>
                          <div className="form-text">Hold Ctrl/Cmd to select multiple members</div>
                        </div>
                      </form>
                    )}
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowCreateForm(false)}>
                      Cancel
                    </button>
                    <button type="button" className="btn btn-outline-light" style={{ backgroundColor: '#2f6a87', color: '#fff' }}>
                      {activeTab === 'personal' ? 'Assign Class' : 'Create Class'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassScheduling;
