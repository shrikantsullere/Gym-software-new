import React, { useState, useEffect } from 'react';
import axiosInstance from '../../Api/axiosInstance';

const PersonsalTrainerShiftManagement = () => {
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

  useEffect(() => {
    const fetchShifts = async () => {
      if (!staffId) {
        setError('Staff ID not found in user data');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axiosInstance.get(`shift/bystaff/${staffId}`);
        const data = response.data;

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
        <div className="text-center my-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading your shift roster...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4">Shift Management</h2>
      <h4 className="mb-3 text-secondary">Duty Roster</h4>

      {error ? (
        <div className="alert alert-danger mb-4">{error}</div>
      ) : null}

      <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="px-4 py-3">Shift ID</th>
                  <th className="py-3">Date</th>
                  <th className="py-3">Start Time</th>
                  <th className="py-3">End Time</th>
                  <th className="py-3">Shift Type</th>
                  <th className="px-4 py-3 text-end">Status</th>
                </tr>
              </thead>
              <tbody>
                {shifts.length > 0 ? (
                  shifts.map((shift) => (
                    <tr key={shift.id}>
                      <td className="px-4 py-3 fw-bold">{shift.id}</td>
                      <td className="py-3">{formatDate(shift.shiftDate)}</td>
                      <td className="py-3">{shift.startTime}</td>
                      <td className="py-3">{shift.endTime}</td>
                      <td className="py-3">
                        <span className={`badge bg-${getShiftColor(shift.shiftType)} px-3 py-2 rounded-pill`}>
                          {shift.shiftType || 'Custom'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-end">
                        <span className={`badge bg-${getStatusClass(shift.status)} px-3 py-2 rounded-pill`}>
                          {shift.status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-5">
                      <h5>No shifts assigned</h5>
                      <small>Shifts assigned by your admin will appear here.</small>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonsalTrainerShiftManagement;