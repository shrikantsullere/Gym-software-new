import React, { useState, useEffect } from 'react';
import BaseUrl from '../../Api/BaseUrl';
import GetAdminId from '../../Api/GetAdminId';

const GeneralTrainerShiftManagement = () => {
  const [shifts, setShifts] = useState([]);
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
  const staffId = user?.staffId || user?.id;

  console.log("Staff ID:", staffId);

  useEffect(() => {
    const fetchShifts = async () => {
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
          const list = Array.isArray(data.data) ? data.data : [data.data];
          setShifts(list);
        } else {
          setShifts([]);
        }
      } catch (err) {
        console.error('Error fetching shifts:', err);
        setError('Failed to load shift data');
      } finally {
        setLoading(false);
      }
    };

    fetchShifts();
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
      case 'completed': return 'success';
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

  if (error) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4">Shift Management</h2>
      {/* <h3>Duty Roster</h3> */}

      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Shift ID</th>
              <th>Date</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Shift Type</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {shifts.length > 0 ? (
              shifts.map((shiftItem) => (
                <tr key={shiftItem.id}>
                  <td>{shiftItem.id}</td>
                  <td>{formatDate(shiftItem.shiftDate)}</td>
                  <td>{shiftItem.startTime}</td>
                  <td>{shiftItem.endTime}</td>
                  <td>
                    <span className={`badge bg-${getShiftColor(shiftItem.shiftType)}`}>
                      {shiftItem.shiftType || 'Custom'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge bg-${getStatusClass(shiftItem.status)}`}>
                      {shiftItem.status || 'Pending'}
                    </span>
                  </td>
                </tr>
              ))
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

export default GeneralTrainerShiftManagement;