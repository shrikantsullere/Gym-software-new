import React, { useState } from 'react';
import {
  Calendar, Clock, Person, Search, Plus, Check, X, Download,
  Eye, Pencil, Trash, CheckCircle, XCircle, List, Grid
} from 'react-bootstrap-icons';
import CustomTimePicker from '../../Components/CustomTimePicker';

const StaffManagement = () => {
  const [activeTab, setActiveTab] = useState('roster');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'calendar'
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);

  // Sample data
  const staffMembers = [
    { id: 1, name: "John Doe", role: "Trainer", branch: "Main Branch" },
    { id: 2, name: "Jane Smith", role: "Receptionist", branch: "Downtown Branch" },
    { id: 3, name: "Mike Johnson", role: "Manager", branch: "Main Branch" },
    { id: 4, name: "Sarah Wilson", role: "Cleaner", branch: "West Branch" },
    { id: 5, name: "David Brown", role: "Trainer", branch: "Downtown Branch" }
  ];

  const branches = ["Main Branch", "Downtown Branch", "West Branch"];

  const shifts = [
    {
      id: 1,
      staffId: 1,
      date: "2023-10-15",
      startTime: "09:00",
      endTime: "17:00",
      type: "Morning",
      branch: "Main Branch",
      status: "Approved"
    },
    {
      id: 2,
      staffId: 2,
      date: "2023-10-15",
      startTime: "12:00",
      endTime: "20:00",
      type: "Evening",
      branch: "Downtown Branch",
      status: "Pending"
    },
    {
      id: 3,
      staffId: 3,
      date: "2023-10-16",
      startTime: "14:00",
      endTime: "22:00",
      type: "Evening",
      branch: "Main Branch",
      status: "Approved"
    },
    {
      id: 4,
      staffId: 4,
      date: "2023-10-16",
      startTime: "22:00",
      endTime: "06:00",
      type: "Night",
      branch: "West Branch",
      status: "Rejected"
    },
    {
      id: 5,
      staffId: 5,
      date: "2023-10-17",
      startTime: "06:00",
      endTime: "14:00",
      type: "Morning",
      branch: "Downtown Branch",
      status: "Pending"
    }
  ];

  const attendanceData = [
    { id: 1, staffId: 1, date: "2023-10-15", status: "Present" },
    { id: 2, staffId: 2, date: "2023-10-15", status: "Late" },
    { id: 3, staffId: 3, date: "2023-10-15", status: "Present" },
    { id: 4, staffId: 4, date: "2023-10-15", status: "Absent" },
    { id: 5, staffId: 5, date: "2023-10-15", status: "On Leave" },
    { id: 6, staffId: 1, date: "2023-10-16", status: "Present" },
    { id: 7, staffId: 2, date: "2023-10-16", status: "Present" },
    { id: 8, staffId: 3, date: "2023-10-16", status: "Late" },
    { id: 9, staffId: 4, date: "2023-10-16", status: "Present" },
    { id: 10, staffId: 5, date: "2023-10-16", status: "Absent" }
  ];

  const [shiftForm, setShiftForm] = useState({
    staffIds: [],
    date: '',
    startTime: '',
    endTime: '',
    type: 'Morning',
    branch: ''
  });

  const [attendanceDate, setAttendanceDate] = useState('2023-10-15');
  const [attendanceStatus, setAttendanceStatus] = useState({});

  // Handle form changes
  const handleShiftFormChange = (e) => {
    const { name, value } = e.target;
    setShiftForm({ ...shiftForm, [name]: value });
  };

  const handleStaffSelection = (e) => {
    const options = e.target.options;
    const selectedIds = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedIds.push(parseInt(options[i].value));
      }
    }
    setShiftForm({ ...shiftForm, staffIds: selectedIds });
  };

  // Get staff name by ID
  const getStaffName = (id) => {
    const staff = staffMembers.find(s => s.id === id);
    return staff ? staff.name : 'Unknown';
  };

  // Get shift color by type
  const getShiftColor = (type) => {
    switch (type) {
      case 'Morning': return 'warning';
      case 'Evening': return 'info';
      case 'Night': return 'primary';
      default: return 'secondary';
    }
  };

  // Get status badge class
  const getStatusClass = (status) => {
    switch (status) {
      case 'Approved': return 'success';
      case 'Pending': return 'warning';
      case 'Rejected': return 'danger';
      default: return 'secondary';
    }
  };

  // Render Duty Roster tab
  const renderDutyRoster = () => {
    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3>Duty Roster</h3>
          <div>
            <button 
              className={`btn btn-outline-secondary me-2 ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
            >
              <List size={18} className="me-1" /> Table View
            </button>
            <button 
              className={`btn btn-outline-secondary me-2 ${viewMode === 'calendar' ? 'active' : ''}`}
              onClick={() => setViewMode('calendar')}
            >
              <Calendar size={18} className="me-1" /> Calendar View
            </button>
            <button 
              className="btn btn-outline-light" style={{ backgroundColor: '#2f6a87', color: '#fff' }}
              onClick={() => setShowShiftModal(true)}
            >
              <Plus size={18} className="me-1" /> Create Shift
            </button>
          </div>
        </div>

        {viewMode === 'table' ? renderShiftTable() : renderCalendarView()}

        <div className="mt-4">
          <h4>Shift Approval</h4>
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Staff Name</th>
                  <th>Shift Date & Time</th>
                  <th>Branch</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {shifts.map(shift => (
                  <tr key={shift.id}>
                    <td>{getStaffName(shift.staffId)}</td>
                    <td>{shift.date} {shift.startTime} - {shift.endTime}</td>
                    <td>{shift.branch}</td>
                    <td>
                      <span className={`badge bg-${getStatusClass(shift.status)}`}>
                        {shift.status}
                      </span>
                    </td>
                    <td>
                      {shift.status === 'Pending' && (
                        <div className="btn-group">
                          <button 
                            className="btn btn-sm btn-success"
                            onClick={() => handleApproveShift(shift.id)}
                          >
                            <Check size={14} />
                          </button>
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => handleRejectShift(shift.id)}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Render Shift Table view
  const renderShiftTable = () => {
    return (
      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Staff Name</th>
              <th>Date</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Shift Type</th>
              <th>Branch</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {shifts.map(shift => (
              <tr key={shift.id}>
                <td>{getStaffName(shift.staffId)}</td>
                <td>{shift.date}</td>
                <td>{shift.startTime}</td>
                <td>{shift.endTime}</td>
                <td>
                  <span className={`badge bg-${getShiftColor(shift.type)}`}>
                    {shift.type}
                  </span>
                </td>
                <td>{shift.branch}</td>
                <td>
                  <span className={`badge bg-${getStatusClass(shift.status)}`}>
                    {shift.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Render Calendar view
  const renderCalendarView = () => {
    // Simplified calendar view for demonstration
    return (
      <div className="card">
        <div className="card-body">
          <h5 className="card-title">October 2023</h5>
          <div className="d-flex justify-content-between">
            <button className="btn btn-sm btn-outline-primary">Previous</button>
            <button className="btn btn-sm btn-outline-primary">Next</button>
          </div>
          <div className="mt-3">
            <div className="row">
              {[15, 16, 17, 18, 19, 20, 21].map(day => (
                <div key={day} className="col-md-3 mb-3">
                  <div className="card">
                    <div className="card-header">
                      <strong>October {day}</strong>
                    </div>
                    <div className="card-body">
                      {shifts.filter(s => s.date === `2023-10-${day}`).map(shift => (
                        <div 
                          key={shift.id} 
                          className={`p-2 mb-2 bg-${getShiftColor(shift.type)} bg-opacity-25 rounded`}
                        >
                          <div><strong>{getStaffName(shift.staffId)}</strong></div>
                          <div>{shift.startTime} - {shift.endTime}</div>
                          <div>
                            <span className={`badge bg-${getShiftColor(shift.type)}`}>
                              {shift.type}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Attendance Monitor tab
  const renderAttendanceMonitor = () => {
    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3>Attendance Monitor</h3>
          <div>
            <button className="btn btn-outline-secondary me-2">
              <Download size={18} className="me-1" /> Export
            </button>
            <button className="btn btn-primary">
              <Plus size={18} className="me-1" /> Mark Attendance
            </button>
          </div>
        </div>

        <div className="row mb-4">
          <div className="col-md-6">
            <label className="form-label">Select Date</label>
            <input 
              type="date" 
              className="form-control" 
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Search Staff</label>
            <div className="input-group">
              <span className="input-group-text">
                <Search size={18} />
              </span>
              <input type="text" className="form-control" placeholder="Search by name or role" />
            </div>
          </div>
        </div>

        <div className="card mb-4">
          <div className="card-header">
            <h5 className="card-title mb-0">Daily Attendance - {attendanceDate}</h5>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Staff Name</th>
                    <th>Role</th>
                    <th>Branch</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staffMembers.map(staff => {
                    const attendance = attendanceData.find(a => 
                      a.staffId === staff.id && a.date === attendanceDate
                    );
                    const status = attendance ? attendance.status : 'Not Marked';
                    
                    return (
                      <tr key={staff.id}>
                        <td>{staff.name}</td>
                        <td>{staff.role}</td>
                        <td>{staff.branch}</td>
                        <td>
                          <span className={`badge bg-${getAttendanceColor(status)}`}>
                            {status}
                          </span>
                        </td>
                        <td>
                          <select 
                            className="form-select form-select-sm"
                            onChange={(e) => handleAttendanceChange(staff.id, e.target.value)}
                          >
                            <option value="">Change Status</option>
                            <option value="Present">Present</option>
                            <option value="Late">Late</option>
                            <option value="Absent">Absent</option>
                            <option value="On Leave">On Leave</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h5 className="card-title mb-0">Monthly Attendance Report</h5>
          </div>
          <div className="card-body">
            <div className="row mb-4">
              <div className="col-md-4">
                <label className="form-label">Staff Member</label>
                <select className="form-select">
                  <option value="">All Staff</option>
                  {staffMembers.map(staff => (
                    <option key={staff.id} value={staff.id}>{staff.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Month</label>
                <select className="form-select">
                  <option value="10">October 2023</option>
                  <option value="9">September 2023</option>
                  <option value="8">August 2023</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Branch</label>
                <select className="form-select">
                  <option value="">All Branches</option>
                  {branches.map(branch => (
                    <option key={branch} value={branch}>{branch}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th>Staff Name</th>
                    <th>Present</th>
                    <th>Late</th>
                    <th>Absent</th>
                    <th>On Leave</th>
                    <th>Attendance %</th>
                  </tr>
                </thead>
                <tbody>
                  {staffMembers.map(staff => {
                    const staffAttendance = attendanceData.filter(a => a.staffId === staff.id);
                    const presentCount = staffAttendance.filter(a => a.status === 'Present').length;
                    const lateCount = staffAttendance.filter(a => a.status === 'Late').length;
                    const absentCount = staffAttendance.filter(a => a.status === 'Absent').length;
                    const leaveCount = staffAttendance.filter(a => a.status === 'On Leave').length;
                    const totalDays = staffAttendance.length;
                    const attendancePercent = totalDays > 0 ? Math.round((presentCount + lateCount/2) / totalDays * 100) : 0;
                    
                    return (
                      <tr key={staff.id}>
                        <td>{staff.name}</td>
                        <td>{presentCount}</td>
                        <td>{lateCount}</td>
                        <td>{absentCount}</td>
                        <td>{leaveCount}</td>
                        <td>
                          <div className="progress" style={{ height: '20px' }}>
                            <div 
                              className={`progress-bar ${attendancePercent >= 90 ? 'bg-success' : attendancePercent >= 70 ? 'bg-warning' : 'bg-danger'}`}
                              style={{ width: `${attendancePercent}%` }}
                            >
                              {attendancePercent}%
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Get attendance color by status
  const getAttendanceColor = (status) => {
    switch (status) {
      case 'Present': return 'success';
      case 'Late': return 'warning';
      case 'Absent': return 'danger';
      case 'On Leave': return 'info';
      default: return 'secondary';
    }
  };

  // Handle attendance change
  const handleAttendanceChange = (staffId, status) => {
    console.log(`Marking staff ${staffId} as ${status} on ${attendanceDate}`);
    // In a real app, you would update the state or make an API call here
  };

  // Handle shift approval
  const handleApproveShift = (shiftId) => {
    console.log(`Approving shift ${shiftId}`);
    // In a real app, you would update the state or make an API call here
  };

  // Handle shift rejection
  const handleRejectShift = (shiftId) => {
    console.log(`Rejecting shift ${shiftId}`);
    // In a real app, you would update the state or make an API call here
  };

  // Render Create Shift Modal
  const renderShiftModal = () => {
    if (!showShiftModal) return null;

    return (
      <div className="modal show d-block" tabIndex="-1">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Create New Shift</h5>
              <button 
                type="button" 
                className="btn-close"
                onClick={() => setShowShiftModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <form>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Select Staff</label>
                    <select 
                      multiple 
                      className="form-select"
                      onChange={handleStaffSelection}
                      size="5"
                    >
                      {staffMembers.map(staff => (
                        <option key={staff.id} value={staff.id}>
                          {staff.name} ({staff.role}) - {staff.branch}
                        </option>
                      ))}
                    </select>
                    <div className="form-text">Hold Ctrl to select multiple staff members</div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Branch</label>
                    <select 
                      className="form-select"
                      name="branch"
                      value={shiftForm.branch}
                      onChange={handleShiftFormChange}
                    >
                      <option value="">Select Branch</option>
                      {branches.map(branch => (
                        <option key={branch} value={branch}>{branch}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-4">
                    <label className="form-label">Date</label>
                    <input 
                      type="date" 
                      className="form-control"
                      name="date"
                      value={shiftForm.date}
                      onChange={handleShiftFormChange}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Start Time</label>
                    <CustomTimePicker
                      className="form-control"
                      name="startTime"
                      value={shiftForm.startTime}
                      onChange={handleShiftFormChange}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">End Time</label>
                    <CustomTimePicker
                      className="form-control"
                      name="endTime"
                      value={shiftForm.endTime}
                      onChange={handleShiftFormChange}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Shift Type</label>
                  <select 
                    className="form-select"
                    name="type"
                    value={shiftForm.type}
                    onChange={handleShiftFormChange}
                  >
                    <option value="Morning">Morning Shift</option>
                    <option value="Evening">Evening Shift</option>
                    <option value="Night">Night Shift</option>
                    <option value="Custom">Custom Shift</option>
                  </select>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowShiftModal(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-outline-light" style={{ backgroundColor: '#2f6a87', color: '#fff' }} 
                onClick={() => {
                  console.log("Creating shift:", shiftForm);
                  setShowShiftModal(false);
                }}
              >
                Create Shift
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4">Staff Management</h2>
      
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'roster' ? 'active' : ''}`}
            onClick={() => setActiveTab('roster')}
          >
            <Calendar className="me-1" /> Duty Roster
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendance')}
          >
            <CheckCircle className="me-1" /> Attendance Monitor
          </button>
        </li>
      </ul>

      {activeTab === 'roster' ? renderDutyRoster() : renderAttendanceMonitor()}
      
      {renderShiftModal()}
      
      {showShiftModal && <div className="modal-backdrop show"></div>}
    </div>
  );
};

export default StaffManagement;
