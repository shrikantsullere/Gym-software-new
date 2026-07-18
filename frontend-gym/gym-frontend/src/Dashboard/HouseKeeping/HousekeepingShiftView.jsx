import React, { useEffect, useState } from 'react';
import axiosInstance from '../../Api/axiosInstance';

const HousekeepingShiftView = () => {
  const [shift, setShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper to get user from localStorage
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
  const staffId = user?.staffId; // Make sure this exists in your user object

  useEffect(() => {
    const fetchShift = async () => {
      // if (!shiftId) {
      //   setError('No shift ID found in user data.');
      //   setLoading(false);
      //   return;
      // }

      try {
        const res = await axiosInstance.get(`shift/bystaff/${staffId}`);
        console.log('API RESPONSE ===>', res.data);

        // Assuming response is { success: true, data: { ...single shift... } }
        if (res.data?.success && res.data?.data) {
          setShift(res.data.data);
        } else {
          setError('Unexpected API response format.');
          setShift(null);
        }
      } catch (err) {
        console.error('Error fetching shift:', err);
        setError('Failed to load shift data.');
        setShift(null);
      } finally {
        setLoading(false);
      }
    };

    fetchShift();
  }, [staffId]);

  const getShiftColor = (type) => {
    if (!type) return 'secondary';
    const normalized = type.toLowerCase();
    if (normalized.includes('morning')) return 'warning';
    if (normalized.includes('evening')) return 'info';
    if (normalized.includes('night')) return 'primary';
    return 'secondary';
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'danger';
      default: return 'secondary';
    }
  };

  // Format ISO date like "2025-12-11T18:30:00.000Z" to "11/12/2025"
  const formatDate = (isoString) => {
    if (!isoString) return '—';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '—'; // invalid date
    return date.toLocaleDateString('en-GB');
  };

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <h2 className="mb-4">Shift Management</h2>
        <p>Loading shift details...</p>
      </div>
    );
  }
  
// ✅ Only render table if shift is not null/undefined
if (!shift) {
  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4">Shift Management</h2>
      <p className="text-muted">No shift assigned.</p>
    </div>
  );
}
  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4">Shift Management</h2>
      <div className="table-responsive mb-4">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Date</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Shift Type</th>
              {/* <th>Branch ID</th> */}
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr key={shift.id}>
              <td>{formatDate(shift.shiftDate) || '—'}</td>
              <td>{shift.startTime || '—'}</td>
              <td>{shift.endTime || '—'}</td>
              <td>
                <span className={`badge bg-${getShiftColor(shift.shiftType)}`}>
                  {shift.shiftType || '—'}
                </span>
              </td>
              {/* <td>{shift.branchId || '—'}</td> */}
              <td>
                <span className={`badge bg-${getStatusClass(shift.status)}`}>
                  {shift.status || 'Unknown'}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HousekeepingShiftView;