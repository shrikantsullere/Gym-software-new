import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../Api/axiosInstance';
import { FaDownload, FaCalendarAlt, FaClock, FaUser, FaPhone } from 'react-icons/fa';
import { useSocket } from '../../../Context/SocketContext';

const BookingDetailsList = ({ type }) => {
  const [activeTab, setActiveTab] = useState(type || 'classes');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBookings = async (type) => {
    try {
      setLoading(true);
      setError(null);
      
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      if (!user) throw new Error("User not found");
      
      const role = user.roleName || user.role || '';
      const isAdminOrSuper = role === 'Admin' || role === 'Superadmin' || role.toUpperCase() === 'ADMIN' || role.toUpperCase() === 'SUPERADMIN';
      
      const adminId = isAdminOrSuper ? user.id : user.adminId;
      const isTrainer = !isAdminOrSuper;
      
      let endpoint = `booking/admin-details/${adminId}`;
      if (isTrainer) {
        endpoint += `/${user.id}`;
      }
      
      const response = await axiosInstance.get(`${endpoint}?type=${type}`);
      console.log("FETCH BOOKINGS RESPONSE:", response.data);
      if (response.data.success) {
        setBookings(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch bookings');
      }
    } catch (err) {
      console.error("FETCH BOOKINGS ERROR:", err);
      setError('Error loading booking details.');
    } finally {
      setLoading(false);
    }
  };

  const socket = useSocket();

  useEffect(() => {
    fetchBookings(activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (!socket) return;
    
    const handleRefresh = () => {
      console.log("Socket event received in BookingDetailsList, refreshing bookings...");
      fetchBookings(activeTab);
    };

    socket.on("bookingCreated", handleRefresh);
    socket.on("bookingUpdated", handleRefresh);
    socket.on("bookingCancelled", handleRefresh);

    return () => {
      socket.off("bookingCreated", handleRefresh);
      socket.off("bookingUpdated", handleRefresh);
      socket.off("bookingCancelled", handleRefresh);
    };
  }, [socket, activeTab]);

  const exportToCSV = () => {
    if (bookings.length === 0) return;
    
    const headers = ['Name', 'Phone', 'Email', activeTab === 'classes' ? 'Class Name' : 'Session Name', 'Date', 'Start Time', 'End Time', 'Status', 'Booking Date'];
    
    const csvRows = [];
    csvRows.push(headers.join(','));
    
    for (const row of bookings) {
      const values = [
        `"${row.memberName || ''}"`,
        `"${row.memberPhone || ''}"`,
        `"${row.memberEmail || ''}"`,
        `"${activeTab === 'classes' ? row.class_name || '' : row.sessionName || ''}"`,
        `"${new Date(row.date).toLocaleDateString()}"`,
        `"${row.startTime || ''}"`,
        `"${row.endTime || ''}"`,
        `"${row.bookingStatus || ''}"`,
        `"${new Date(row.createdAt).toLocaleDateString()}"`
      ];
      csvRows.push(values.join(','));
    }
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `${activeTab}_bookings_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="mt-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h4 className="fw-bold mb-0 text-dark">Booking Details</h4>
          <p className="text-muted mb-0">Manage and view all members joined for classes and sessions</p>
        </div>
        <button 
          className="btn btn-primary d-flex align-items-center gap-2"
          onClick={exportToCSV}
          disabled={bookings.length === 0}
          style={{ backgroundColor: '#2f6a87', border: 'none', borderRadius: '8px', height: '40px' }}
        >
          <FaDownload /> Export CSV
        </button>
      </div>

      {!type && (
        <div className="d-flex gap-3 mb-4">
          <button 
            className="btn px-4 py-2 fw-medium"
            onClick={() => setActiveTab('classes')}
            style={
              activeTab === 'classes' 
                ? { backgroundColor: '#2f6a87', color: 'white', borderRadius: '8px', border: 'none' } 
                : { backgroundColor: 'white', color: '#2f6a87', borderRadius: '8px', border: '1px solid #dee2e6' }
            }
          >
            Class Bookings
          </button>
          <button 
            className="btn px-4 py-2 fw-medium"
            onClick={() => setActiveTab('sessions')}
            style={
              activeTab === 'sessions' 
                ? { backgroundColor: '#2f6a87', color: 'white', borderRadius: '8px', border: 'none' } 
                : { backgroundColor: 'white', color: '#2f6a87', borderRadius: '8px', border: '1px solid #dee2e6' }
            }
          >
            Session Bookings
          </button>
        </div>
      )}

      <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-5 text-danger">{error}</div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-5 text-muted">
              No bookings found for {activeTab}.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="py-3 px-4 border-bottom-0 text-muted fw-semibold">MEMBER INFO</th>
                    <th className="py-3 border-bottom-0 text-muted fw-semibold">{activeTab === 'classes' ? 'CLASS' : 'SESSION'}</th>
                    <th className="py-3 border-bottom-0 text-muted fw-semibold">SCHEDULE</th>
                    <th className="py-3 border-bottom-0 text-muted fw-semibold">STATUS</th>
                    <th className="py-3 border-bottom-0 text-muted fw-semibold">BOOKED ON</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id}>
                      <td className="px-4 py-3">
                        <div className="d-flex align-items-center">
                          <div className="bg-light rounded-circle p-2 me-3 text-primary d-flex justify-content-center align-items-center" style={{ width: '40px', height: '40px' }}>
                            <FaUser />
                          </div>
                          <div>
                            <h6 className="mb-0 fw-bold">{booking.memberName}</h6>
                            <small className="text-muted d-flex align-items-center gap-1">
                              <FaPhone size={10} /> {booking.memberPhone}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="fw-medium text-dark">
                          {activeTab === 'classes' ? booking.class_name : booking.sessionName}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="d-flex flex-column">
                          <span className="d-flex align-items-center gap-1 text-dark" style={{ fontSize: '0.9rem' }}>
                            <FaCalendarAlt size={12} className="text-muted" /> {new Date(booking.date).toLocaleDateString()}
                          </span>
                          <span className="d-flex align-items-center gap-1 text-muted" style={{ fontSize: '0.85rem' }}>
                            <FaClock size={12} /> {booking.startTime} - {booking.endTime}
                          </span>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`badge ${booking.bookingStatus === 'Booked' ? 'bg-success' : booking.bookingStatus === 'Cancelled' ? 'bg-danger' : 'bg-primary'}`}>
                          {booking.bookingStatus}
                        </span>
                      </td>
                      <td className="py-3 text-muted" style={{ fontSize: '0.9rem' }}>
                        {new Date(booking.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingDetailsList;
