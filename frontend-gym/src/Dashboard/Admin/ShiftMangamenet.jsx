import React, { useState, useEffect } from 'react';
import {
  Calendar, Plus, Check, X
} from 'react-bootstrap-icons';
import axiosInstance from '../../Api/axiosInstance';
import GetAdminId from '../../Api/GetAdminId';
import CustomTimePicker from '../../Components/CustomTimePicker';

const ShiftManagement = () => {
  const adminId = GetAdminId();
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [staffMembers, setStaffMembers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [staffSearch, setStaffSearch] = useState("");
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState('');

  const filteredStaff = staffMembers.filter(staff => {
    // roleId 8 = housekeeping — exclude from shift creation dropdown
    if (staff.roleId === 8) return false;
    const role = (staff.roleName || staff.role || '').toLowerCase();
    if (role.includes('housekeeping')) return false;
    const name = staff.fullName || staff.name || staff.userName || staff.email || '';
    return name.toLowerCase().includes(staffSearch.toLowerCase());
  });

  // Fetch data from APIs
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch staff data based on admin ID
        const staffResponse = await axiosInstance.get(`staff/admin/${adminId}`);
        const staffData = staffResponse.data;

        // Fetch branches data
        const branchesResponse = await axiosInstance.get(`branches/by-admin/${adminId}`);
        const branchesData = branchesResponse.data;

        // Fetch shifts data
        const shiftsResponse = await axiosInstance.get(`shift/all/${adminId}`);
        const shiftsData = shiftsResponse.data;

        if (staffData && staffData.success) {
          setStaffMembers(staffData.staff || staffData.data || []);
        } else {
          setStaffMembers([]);
        }

        if (branchesData && branchesData.success) {
          setBranches(branchesData.branches || branchesData.data || []);
        }

        if (shiftsData && shiftsData.success) {
          setShifts(shiftsData.data || shiftsData.shifts || []);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching shift data:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    if (adminId) fetchData();
  }, [adminId]);

  const [shiftForm, setShiftForm] = useState({
    staffIds: [],
    fromDate: '',
    toDate: '',
    startTime: '',
    endTime: '',
    shiftType: 'Morning Shift',
    description: ''
  });

  // FIXED: Updated getStaffName to handle array of staff IDs
  const getStaffName = (ids) => {
    if (!ids) return 'Not Assigned';

    if (typeof ids === 'string') {
      try {
        ids = JSON.parse(ids);
      } catch(e) {
        ids = parseInt(ids);
      }
    }

    if (typeof ids === 'number') {
      const staff = staffMembers.find(s => (s.staffId || s.id) === ids);
      return staff ? (staff.fullName || staff.name || staff.userName || 'Unknown') : 'Unknown';
    }

    if (Array.isArray(ids)) {
      const names = ids.map(id => {
        const staff = staffMembers.find(s => (s.staffId || s.id) === id);
        return staff ? (staff.fullName || staff.name || staff.userName || 'Unknown') : 'Unknown';
      });
      return names.join(', ');
    }

    return 'Unknown';
  };

  const getBranchName = (id) => {
    const branch = branches.find(b => b.id === id);
    return branch ? branch.name : 'Unknown';
  };

  const getShiftColor = (type) => {
    switch (type) {
      case 'Morning Shift':
      case 'Morning': return 'warning';
      case 'Evening Shift':
      case 'Evening': return 'info';
      case 'Night Shift':
      case 'Night': return 'primary';
      default: return 'secondary';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Approved': return 'success';
      case 'Pending': return 'warning';
      case 'Rejected': return 'danger';
      default: return 'secondary';
    }
  };

  const handleShiftFormChange = (e) => {
    const { name, value } = e.target;
    setShiftForm({ ...shiftForm, [name]: value });
  };

  const handleStaffCheckboxChange = (staffId, isChecked) => {
    const numericId = parseInt(staffId);
    setShiftForm(prev => {
      if (isChecked) {
        return { ...prev, staffIds: [...prev.staffIds, numericId] };
      } else {
        return { ...prev, staffIds: prev.staffIds.filter(id => id !== numericId) };
      }
    });
  };

  const handleCreateShift = async () => {
    try {
      if (!shiftForm.staffIds || !shiftForm.staffIds.length || !shiftForm.fromDate || !shiftForm.toDate ||
        !shiftForm.startTime || !shiftForm.endTime || !shiftForm.shiftType) {
        alert('Please fill all required fields');
        return;
      }

      const start = new Date(shiftForm.fromDate);
      const end = new Date(shiftForm.toDate);

      if (end < start) {
        alert('To Date must be greater than or equal to From Date');
        return;
      }

      // Generate array of dates
      const dateList = [];
      let current = new Date(start);
      while (current <= end) {
        dateList.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
      }

      // Call API sequentially for each date
      for (const d of dateList) {
        await axiosInstance.post('shift/create', {
          staffIds: shiftForm.staffIds,
          shiftDate: d,
          startTime: shiftForm.startTime,
          endTime: shiftForm.endTime,
          shiftType: shiftForm.shiftType,
          description: shiftForm.description
        });
      }

      const shiftsResponse = await axiosInstance.get(`shift/all/${adminId}`);
      const shiftsData = shiftsResponse.data;

      if (shiftsData.success) {
        setShifts(shiftsData.data || shiftsData.shifts || []);
      }

      setShiftForm({
        staffIds: [],
        fromDate: '',
        toDate: '',
        startTime: '',
        endTime: '',
        shiftType: 'Morning Shift',
        description: ''
      });
      setShowShiftModal(false);
      alert('Shifts created successfully for the selected date range!');
    } catch (err) {
      console.error('Error creating shift:', err);
      alert('Error creating shift: ' + (err.response?.data?.message || err.message));
    }
  };

  // FIXED: Added staffIds to the payload when approving a shift
  const handleApproveShift = async (shiftId) => {
    try {
      const shift = shifts.find(s => s.id === shiftId);

      const response = await axiosInstance.put(`shift/status/${shiftId}`, {
        status: 'Approved',
        staffIds: shift ? shift.staffIds : []
      });

      const data = response.data;

      if (data.success) {
        setShifts(shifts.map(shift =>
          shift.id === shiftId ? { ...shift, status: 'Approved' } : shift
        ));
        alert('Shift approved successfully');
      } else {
        throw new Error(data.message || 'Failed to approve shift');
      }
    } catch (err) {
      console.error('Error approving shift:', err);
      alert('Error approving shift: ' + (err.response?.data?.message || err.message));
    }
  };

  // FIXED: Added staffIds to the payload when rejecting a shift
  const handleRejectShift = async (shiftId) => {
    try {
      const shift = shifts.find(s => s.id === shiftId);

      const response = await axiosInstance.put(`shift/status/${shiftId}`, {
        status: 'Rejected',
        staffIds: shift ? shift.staffIds : []
      });

      const data = response.data;

      if (data.success) {
        setShifts(shifts.map(shift =>
          shift.id === shiftId ? { ...shift, status: 'Rejected' } : shift
        ));
        alert('Shift rejected successfully');
      } else {
        throw new Error(data.message || 'Failed to reject shift');
      }
    } catch (err) {
      console.error('Error rejecting shift:', err);
      alert('Error rejecting shift: ' + (err.response?.data?.message || err.message));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toISOString().split('T')[0];
    } catch (error) {
      return dateString;
    }
  };

  const renderShiftModal = () => {
    if (!showShiftModal) return null;

    return (
      <>
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
                      <label className="form-label">Staff</label>
                      <select
                        className="form-select"
                        value={shiftForm.staffIds[0] || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setShiftForm({
                            ...shiftForm,
                            staffIds: val ? [parseInt(val)] : []
                          });
                        }}
                      >
                        <option value="">-- Select Staff --</option>
                        {staffMembers.map(staff => {
                          const sId = staff.staffId || staff.id;
                          const sName = staff.fullName || staff.name || staff.userName || staff.email || `Staff #${sId}`;
                          const sRole = staff.roleName ? ` (${staff.roleName})` : '';
                          return (
                            <option key={sId} value={sId}>
                              {sName}{sRole}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="col-md-3">
                      <label className="form-label">From Date</label>
                      <input
                        type="date"
                        className="form-control"
                        name="fromDate"
                        value={shiftForm.fromDate}
                        onChange={handleShiftFormChange}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">To Date</label>
                      <input
                        type="date"
                        className="form-control"
                        name="toDate"
                        value={shiftForm.toDate}
                        onChange={handleShiftFormChange}
                      />
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Start Time</label>
                      <CustomTimePicker
                        className="form-control"
                        name="startTime"
                        value={shiftForm.startTime}
                        onChange={handleShiftFormChange}
                      />
                    </div>
                    <div className="col-md-6">
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
                      name="shiftType"
                      value={shiftForm.shiftType}
                      onChange={handleShiftFormChange}
                    >
                      <option value="Morning Shift">Morning Shift</option>
                      <option value="Evening Shift">Evening Shift</option>
                      <option value="Night Shift">Night Shift</option>
                      <option value="Custom">Custom Shift</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      name="description"
                      value={shiftForm.description}
                      onChange={handleShiftFormChange}
                      rows="3"
                    ></textarea>
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowShiftModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-outline-light"
                  style={{ backgroundColor: '#2f6a87', color: '#fff' }}
                  onClick={handleCreateShift}
                >
                  Create Shift
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-backdrop show"></div>
      </>
    );
  };

  if (loading) {
    return <div className="container-fluid py-4">Loading...</div>;
  }

  const filteredShifts = shifts?.filter(shift => {
    // 1. Staff Filter
    if (selectedStaffFilter) {
      const staffIdToFind = parseInt(selectedStaffFilter);
      let ids = shift.staffIds;
      if (typeof ids === 'string') {
        try {
          ids = JSON.parse(ids);
        } catch (e) {
          if (ids.includes(',')) {
            ids = ids.split(',').map(num => parseInt(num));
          } else {
            ids = parseInt(ids);
          }
        }
      }
      
      if (Array.isArray(ids)) {
        if (!ids.includes(staffIdToFind)) return false;
      } else {
        if (parseInt(ids) !== staffIdToFind) return false;
      }
    }

    // 2. Date Filter
    if (!shift.shiftDate) return true;
    const formattedShiftDate = formatDate(shift.shiftDate);
    if (fromDate && formattedShiftDate < fromDate) return false;
    if (toDate && formattedShiftDate > toDate) return false;
    return true;
  });

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Shift Management</h2>
        <button
          className="btn btn-outline-light"
          style={{ backgroundColor: '#2f6a87', color: '#fff' }}
          onClick={() => setShowShiftModal(true)}
        >
          <Plus size={18} className="me-1" /> Create Shift
        </button>
      </div>

      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="mb-0">Duty Roster</h3>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-2">
          {/* Staff Filter Dropdown */}
          <div className="input-group input-group-sm shadow-sm" style={{ width: '220px' }}>
            <span className="input-group-text bg-white text-muted">Staff</span>
            <select
              className="form-select"
              value={selectedStaffFilter}
              onChange={(e) => setSelectedStaffFilter(e.target.value)}
            >
              <option value="">All Staff</option>
              {staffMembers.map(staff => {
                const sId = staff.staffId || staff.id;
                const sName = staff.fullName || staff.name || staff.userName || staff.email || `Staff #${sId}`;
                const sRole = staff.roleName ? ` (${staff.roleName})` : '';
                return (
                  <option key={sId} value={sId}>
                    {sName}{sRole}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="input-group input-group-sm shadow-sm" style={{ width: '200px' }}>
            <span className="input-group-text bg-white text-muted">From</span>
            <input
              type="date"
              className="form-control"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className="input-group input-group-sm shadow-sm" style={{ width: '200px' }}>
            <span className="input-group-text bg-white text-muted">To</span>
            <input
              type="date"
              className="form-control"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          {(fromDate || toDate || selectedStaffFilter) && (
            <button 
              className="btn btn-sm btn-secondary" 
              type="button"
              onClick={() => {
                setFromDate('');
                setToDate('');
                setSelectedStaffFilter('');
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="table-responsive mb-4">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Staff Name</th>
              <th>Date</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Shift Type</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredShifts?.map(shift => (
              <tr key={shift.id}>
                <td>
                  {getStaffName(shift.staffIds)}
                </td>
                <td>{formatDate(shift.shiftDate)}</td>
                <td>{shift.startTime}</td>
                <td>{shift.endTime}</td>
                <td>
                  <span className={`badge bg-${getShiftColor(shift.shiftType)}`}>
                    {shift.shiftType || 'Not Specified'}
                  </span>
                </td>

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

      <div>
        <h4>Shift Approval</h4>
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Staff Name</th>
                <th>Shift Date & Time</th>
                {/* <th>Branch</th> */}
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {shifts?.filter(shift => shift.status === 'Pending')
                .map(shift => (
                  <tr key={shift.id}>
                    <td>
                      {getStaffName(shift.staffIds)}
                    </td>
                    <td>{formatDate(shift.shiftDate)} {shift.startTime} - {shift.endTime}</td>
                    {/* <td>{getBranchName(shift.branchId)}</td> */}
                    <td>
                      <span className={`badge bg-${getStatusClass(shift.status)}`}>
                        {shift.status}
                      </span>
                    </td>
                    <td>
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
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {renderShiftModal()}
    </div>
  );
};

export default ShiftManagement;