import React, { useState, useEffect } from 'react';
import {
  Calendar, Plus, Check, X
} from 'react-bootstrap-icons';
import BaseUrl from '../../Api/BaseUrl';
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




  const filteredStaff = staffMembers.filter(staff =>
    staff.fullName.toLowerCase().includes(staffSearch.toLowerCase())
  );

  // Fetch data from APIs
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch staff data based on admin ID
        const staffResponse = await fetch(`${BaseUrl}staff/admin/${adminId}`);
        const staffData = await staffResponse.json();

        // Fetch branches data
        const branchesResponse = await fetch(`${BaseUrl}branches/by-admin/${adminId}`);
        const branchesData = await branchesResponse.json();

        // Fetch shifts data
        const shiftsResponse = await fetch(`${BaseUrl}shift/all/${adminId}`);
        const shiftsData = await shiftsResponse.json();

        if (staffData.success) {
          setStaffMembers(staffData.staff);
        } else {
          throw new Error('Failed to fetch data');
        }

        if (branchesData.success) {
          setBranches(branchesData.branches);
        } else {
          throw new Error('Failed to fetch branches data');
        }

        if (shiftsData.success) {
          setShifts(shiftsData.data || []);
        } else {
          throw new Error('Failed to fetch shifts data');
        }

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [BaseUrl, adminId]);

  const [shiftForm, setShiftForm] = useState({
    staffIds: [],
    shiftDate: '',
    startTime: '',
    endTime: '',
    shiftType: 'Morning Shift',
    description: ''
  });

  // FIXED: Updated getStaffName to handle array of staff IDs
  const getStaffName = (ids) => {
    if (!ids) return 'Not Assigned';

    // Handle case where ids is a string
    if (typeof ids === 'string') {
      ids = parseInt(ids);
    }

    // Handle case where ids is a single number
    if (typeof ids === 'number') {
      const staff = staffMembers.find(s => s.staffId === ids);
      return staff ? staff.fullName : 'Unknown';
    }

    // Handle case where ids is an array
    if (Array.isArray(ids)) {
      const names = ids.map(id => {
        const staff = staffMembers.find(s => s.staffId === id);
        return staff ? staff.fullName : 'Unknown';
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
    setShiftForm(prev => {
      if (isChecked) {
        // Add staffId to array
        return { ...prev, staffIds: [...prev.staffIds, parseInt(staffId)] };
      } else {
        // Remove staffId from array
        return { ...prev, staffIds: prev.staffIds.filter(id => id !== parseInt(staffId)) };
      }
    });
  };

  const handleCreateShift = async () => {
    try {
      console.log(shiftForm)
      if (!shiftForm.staffIds || !shiftForm.staffIds.length || !shiftForm.shiftDate ||
        !shiftForm.startTime || !shiftForm.endTime || !shiftForm.shiftType) {
        alert('Please fill all required fields');
        return;
      }

      const response = await fetch(`${BaseUrl}shift/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shiftForm)
      });

      const data = await response.json();

      if (data.success) {
        const shiftsResponse = await fetch(`${BaseUrl}shift/all/${adminId}`);
        const shiftsData = await shiftsResponse.json();

        if (shiftsData.success) {
          setShifts(shiftsData.data || []);
        }

        setShiftForm({
          staffIds: [],
          shiftDate: '',
          startTime: '',
          endTime: '',
          shiftType: 'Morning Shift',
          description: ''
        });
        setShowShiftModal(false);
        alert('Shift created successfully');
      } else {
        throw new Error(data.message || 'Failed to create shift');
      }
    } catch (err) {
      console.error('Error creating shift:', err);
      alert('Error creating shift: ' + err.message);
    }
  };

  // FIXED: Added staffIds to the payload when approving a shift
  const handleApproveShift = async (shiftId) => {
    try {
      // Find the shift to get the staff IDs
      const shift = shifts.find(s => s.id === shiftId);

      const response = await fetch(`${BaseUrl}shift/status/${shiftId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'Approved',
          staffIds: shift.staffIds // Add staff IDs to the payload
        })
      });

      const data = await response.json();

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
      alert('Error approving shift: ' + err.message);
    }
  };

  // FIXED: Added staffIds to the payload when rejecting a shift
  const handleRejectShift = async (shiftId) => {
    try {
      // Find the shift to get the staff IDs
      const shift = shifts.find(s => s.id === shiftId);

      const response = await fetch(`${BaseUrl}shift/status/${shiftId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'Rejected',
          staffIds: shift.staffIds // Add staff IDs to the payload
        })
      });

      const data = await response.json();

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
      alert('Error rejecting shift: ' + err.message);
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

                      <div className="border rounded p-2">

                        {/* 🔍 Search Bar */}
                        <input
                          type="text"
                          className="form-control mb-2"
                          placeholder="Search staff..."
                          value={staffSearch}
                          onChange={(e) => setStaffSearch(e.target.value)}
                        />

                        {/* 📜 Scrollable Area */}
                        <div
                          style={{
                            maxHeight: "100px",
                            overflowY: "auto",
                            overflowX: "auto",
                            whiteSpace: "nowrap"
                          }}
                        >
                          {filteredStaff.length > 0 ? (
                            filteredStaff.map(staff => (
                              <div
                                className="form-check"
                                key={staff.staffId}
                                style={{ minWidth: "250px" }} // 👈 horizontal scroll ke liye
                              >
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id={`staff-${staff.staffId}`}
                                  checked={shiftForm.staffIds.includes(staff.staffId)}
                                  onChange={(e) =>
                                    handleStaffCheckboxChange(staff.staffId, e.target.checked)
                                  }
                                />
                                <label
                                  className="form-check-label"
                                  htmlFor={`staff-${staff.staffId}`}
                                >
                                  {staff.fullName}
                                </label>
                              </div>
                            ))
                          ) : (
                            <p className="text-muted mb-0">No staff members found</p>
                          )}
                        </div>

                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Date</label>
                      <input
                        type="date"
                        className="form-control"
                        name="shiftDate"
                        value={shiftForm.shiftDate}
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

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4">Shift Management</h2>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Duty Roster</h3>
        <button
          className="btn btn-outline-light"
          style={{ backgroundColor: '#2f6a87', color: '#fff' }}
          onClick={() => setShowShiftModal(true)}
        >
          <Plus size={18} className="me-1" /> Create Shift
        </button>
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
            {shifts?.map(shift => (
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