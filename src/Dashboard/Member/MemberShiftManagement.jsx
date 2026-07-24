import React, { useState, useEffect } from 'react';
import BaseUrl from '../../Api/BaseUrl';
import GetAdminId from '../../Api/GetAdminId';

const MemberShiftManagement = () => {
  const [shift, setShift] = useState(null); // Single shift object
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getUserFromStorage = () => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (err) {
      console.error('Error parsing user from localStorage:', err);
      return null;
    }
  };

  const user = getUserFromStorage();
  const staffId = user?.staffId || user?.id; // Try staffId first, fallback to id

  console.log("Staff ID:", staffId);

  useEffect(() => {
    const fetchShift = async () => {
      if (!staffId) {
        setError('Staff ID not found in user data');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`${BaseUrl}shift/bystaff/${staffId}`);
        const data = await response.json();

        if (data.success && data.data) {
          // API returns a single shift object under `data`
          setShift(data.data);
        } else {
          setShift(null); // No shift assigned
        }
      } catch (err) {
        console.error('Error fetching shift:', err);
        setError('Failed to load shift data');
      } finally {
        setLoading(false);
      }
    };

    fetchShift();
  }, [staffId]);

  const getShiftColor = (type) => {
    switch (type) {
      case 'Morning Shift':
      case 'Morning': return 'warning';
      case 'Evening Shift':
      case 'Evening': return 'info';
      case 'Night Shift':
      case 'Night': return 'primary';
      case 'Custom': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'danger';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading your shift...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4">Shift Management</h2>
      <h3>Duty Roster</h3>

      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Staff ID</th>
              <th>Date</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Shift Type</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {shift ? (
              <tr key={shift.id}>
                <td>{shift.staffIds}</td>
                <td>{formatDate(shift.shiftDate)}</td>
                <td>{shift.startTime}</td>
                <td>{shift.endTime}</td>
                <td>
                  <span className={`badge bg-${getShiftColor(shift.shiftType)}`}>
                    {shift.shiftType || 'Custom'}
                  </span>
                </td>
                <td>
                  <span className={`badge bg-${getStatusClass(shift.status)}`}>
                    {shift.status || 'Unknown'}
                  </span>
                </td>
              </tr>
            ) : (
              <tr>
                <td colSpan="6" className="text-center text-muted">
                  No shift assigned
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MemberShiftManagement;