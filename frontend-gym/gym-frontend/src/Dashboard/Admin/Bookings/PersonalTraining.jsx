import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import axiosInstance from '../../../Api/axiosInstance';
import GetAdminId from '../../../Api/GetAdminId';

const PersonalTraining = () => {
  const adminId = GetAdminId();
  const [trainingData, setTrainingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileViewModalOpen, setIsMobileViewModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const customColor = "#6EB2CC";

  // Fetch data from API when component mounts
  useEffect(() => {
    fetchTrainingData();
  }, []);

  const fetchTrainingData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axiosInstance.get(`booking/getptDetailsByAdminId/${adminId}`);
      
      if (response.data && response.data.success) {
        // Check if data exists and has items
        if (response.data.data && response.data.data.length > 0) {
          // Transform API data to match our component's expected format
          const transformedData = response.data.data.map(item => ({
            id: item.id,
            memberId: item.memberId,
            trainerId: item.trainerId,
            sessionId: item.sessionId,
            classId: item.classId,
            date: item.date ? new Date(item.date).toLocaleDateString() : 'N/A',
            startTime: item.startTime || 'N/A',
            endTime: item.endTime || 'N/A',
            time: item.startTime && item.endTime ? `${item.startTime} - ${item.endTime}` : 'N/A',
            bookingType: item.bookingType || 'N/A',
            bookingStatus: item.bookingStatus || 'N/A',
            paymentStatus: item.paymentStatus || 'N/A',
            notes: item.notes || 'N/A',
            branchId: item.branchId,
            createdAt: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A',
            updatedAt: item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'N/A',
            memberName: item.memberName || 'Member', // Use memberName from API response
            trainerName: item.trainerName || 'Trainer', // Use trainerName from API response
            sessionName: item.sessionName || 'N/A',
            // Adding additional fields that might be needed for UI
            type: item.sessionName || item.notes || 'Personal Training',
            price: 'N/A', // Price is not provided in API response
            memberEmail: 'N/A', // Email is not provided in API response
            memberPhone: 'N/A', // Phone is not provided in API response
            memberJoinDate: 'N/A', // Join date is not provided in API response
            totalMembers: 1 // Default to 1 as it's not provided in API response
          }));
          
          setTrainingData(transformedData);
        } else {
          // No data found case
          setTrainingData([]);
        }
      } else {
        throw new Error('Failed to fetch training data');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching data');
      console.error('Error fetching training data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleShow = (booking) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const handleMobileShow = (booking) => {
    setSelectedBooking(booking);
    setIsMobileViewModalOpen(true);
  };

  const handleDelete = async (id, memberName) => {
    if (window.confirm(`Are you sure you want to delete booking for ${memberName}?`)) {
      try {
        // Make API call to delete the booking
        const response = await axiosInstance.delete(`booking/deleteunified/${id}`);
        
        if (response.data && response.data.success) {
          // Update local state to remove the deleted booking
          const updatedData = trainingData.filter(item => item.id !== id);
          setTrainingData(updatedData);
          alert(`Booking for ${memberName} has been deleted`);
          
          // Close modal if it's open and the deleted booking was selected
          if (selectedBooking && selectedBooking.id === id) {
            setIsModalOpen(false);
            setIsMobileViewModalOpen(false);
            setSelectedBooking(null);
          }
        } else {
          throw new Error(response.data.message || 'Failed to delete booking');
        }
      } catch (err) {
        console.error('Error deleting booking:', err);
        alert(`Error deleting booking: ${err.message || 'Unknown error'}`);
      }
    }
  };

  const handleBookingStatusClick = (index) => {
    const newData = [...trainingData];
    const currentStatus = newData[index].bookingStatus;
    
    if (currentStatus === "Booked") {
      newData[index].bookingStatus = "Confirmed";
    } else if (currentStatus === "Confirmed") {
      newData[index].bookingStatus = "Cancelled";
    } else if (currentStatus === "Cancelled") {
      newData[index].bookingStatus = "Booked";
    }
    
    setTrainingData(newData);
    
    // In a real app, you would make an API call to update status
    // For now, we're just updating the local state
  };

  const getBadgeColor = (status) => {
    switch (status) {
      case "Confirmed":
      case "Completed":
        return "bg-success";
      case "Cancelled":
        return "bg-danger";
      default:
        return "bg-primary";
    }
  };

  const totalMembersCount = trainingData.reduce((total, booking) => total + (booking.totalMembers || 1), 0);

  const MobileBookingCard = ({ booking, index }) => (
    <div className="card mb-3 shadow-sm" style={{ borderRadius: '12px' }}>
      <div className="card-body p-3">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <h6 className="mb-1 fw-bold" style={{ fontSize: '1rem' }}>{booking.memberName}</h6>
            <div className="d-flex gap-1 flex-wrap">
              <span className="badge bg-primary text-dark" style={{ fontSize: '0.7rem' }}>
                {booking.type || 'N/A'}
              </span>
              <span className="badge bg-light text-dark" style={{ fontSize: '0.7rem' }}>
                {booking.totalMembers || 1} {booking.totalMembers > 1 ? 'Members' : 'Member'}
              </span>
            </div>
          </div>
          <div className="d-flex gap-1">
            <button
              className={`badge ${getBadgeColor(booking.bookingStatus)} border-0 bg-opacity-75`}
              onClick={() => handleBookingStatusClick(index)}
              style={{ cursor: 'pointer' }}
            >
              {booking.bookingStatus}
            </button>
          </div>
        </div>
        
        <div className="row g-2 mb-2">
          <div className="col-6">
            <small className="text-muted d-block">Trainer</small>
            <span style={{ fontSize: '0.85rem' }}>{booking.trainerName}</span>
          </div>
          <div className="col-6">
            <small className="text-muted d-block">Date</small>
            <span style={{ fontSize: '0.85rem' }}>{booking.date}</span>
          </div>
          <div className="col-6">
            <small className="text-muted d-block">Time</small>
            <span style={{ fontSize: '0.85rem' }}>{booking.time}</span>
          </div>
          <div className="col-6">
            <small className="text-muted d-block">Price</small>
            <span style={{ fontSize: '0.85rem' }}>{booking.price}</span>
          </div>
        </div>
        
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <small className="text-muted">Payment:</small>
            <span className={`badge ${booking.paymentStatus === 'Paid' ? 'bg-success' : 'bg-warning'} ms-1`}>
              {booking.paymentStatus}
            </span>
          </div>
          <div className="d-flex gap-1">
            <button
              className="btn btn-sm"
              onClick={() => handleMobileShow(booking)}
              style={{ 
                fontSize: '0.75rem', 
                padding: '0.25rem 0.5rem',
                color: customColor,
                background: 'none',
                border: 'none'
              }}
            >
              <i className="bi bi-eye"></i>
            </button>
            <button
              className="btn btn-sm"
              onClick={() => handleDelete(booking.id, booking.memberName)}
              style={{ 
                fontSize: '0.75rem', 
                padding: '0.25rem 0.5rem',
                color: '#dc3545',
                background: 'none',
                border: 'none'
              }}
            >
              <i className="bi bi-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Function to fetch a specific booking by ID
  const fetchBookingById = async (id) => {
    try {
      // In a real app, you would have an endpoint to fetch a specific booking
      // For now, we'll just find it in our local state
      const booking = trainingData.find(item => item.id === parseInt(id));
      if (booking) {
        setSelectedBooking(booking);
        setIsModalOpen(true);
      } else {
        alert(`No booking found with ID: ${id}`);
      }
    } catch (err) {
      console.error('Error fetching booking by ID:', err);
      alert('An error occurred while fetching the booking');
    }
  };

  return (
    <div className="container-fluid p-2 p-md-4">
      <div className="d-flex justify-content-between align-items-center mb-3 mb-md-4">
        <div>
          <h2 className="fw-bold mb-1" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.2rem)' }}>Personal Training Details</h2>
          <p className="text-muted mb-0">In Member Dashboard</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <div className="text-center">
            <h4 className="mb-0 fw-bold" style={{ color: customColor }}>{totalMembersCount}</h4>
            <small className="d-block text-muted">Total Members</small>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading personal training data...</p>
        </div>
      )}

      {/* Search by ID */}
      {!loading && !error && (
        <div className="row mb-3">
          <div className="col-md-6">
            <div className="input-group">
              <span className="input-group-text">Search by ID</span>
              <input
                type="number"
                className="form-control"
                placeholder="Enter booking ID"
                id="bookingIdSearch"
              />
              <button 
                className="btn btn-outline-primary" 
                type="button" 
                onClick={() => {
                  const id = document.getElementById('bookingIdSearch').value;
                  if (id) {
                    fetchBookingById(id);
                  } else {
                    alert('Please enter a booking ID');
                  }
                }}
              >
                <i className="bi bi-search"></i> Search
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Desktop view */}
      {!loading && !error && (
        <div className="d-none d-md-block">
          <div className="table-responsive">
            <table className="table table-bordered table-hover">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Member Name</th>
                  <th>Trainer</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Price</th>
                  <th>Payment Status</th>
                  <th>Booking Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {trainingData.map((data, index) => (
                  <tr key={data.id}>
                    <td>{data.id}</td>
                    <td>{data.memberName}</td>
                    <td>{data.trainerName}</td>
                    <td>{data.type}</td>
                    <td>{data.date}</td>
                    <td>{data.time}</td>
                    <td>{data.price}</td>
                    <td>
                      <span className={`badge ${data.paymentStatus === 'Paid' ? 'bg-success' : 'bg-warning'}`}>
                        {data.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <button 
                        className={`badge ${getBadgeColor(data.bookingStatus)} border-0 bg-opacity-75`}
                        onClick={() => handleBookingStatusClick(index)}
                        style={{ cursor: 'pointer' }}
                      >
                        {data.bookingStatus}
                      </button>
                    </td>
                    <td>
                      <div className="btn-group" role="group">
                        <button 
                          className="btn btn-sm" 
                          title="Show"
                          onClick={() => handleShow(data)}
                          style={{ 
                            color: customColor,
                            background: 'none',
                            border: 'none'
                          }}
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        <button 
                          className="btn btn-sm" 
                          title="Delete"
                          onClick={() => handleDelete(data.id, data.memberName)}
                          style={{ 
                            color: '#dc3545',
                            background: 'none',
                            border: 'none'
                          }}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mobile view */}
      {!loading && !error && (
        <div className="d-md-none">
          {trainingData.map((booking, index) => (
            <MobileBookingCard key={booking.id} booking={booking} index={index} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && trainingData.length === 0 && (
        <div className="text-center py-5">
          <i className="bi bi-calendar-x" style={{ fontSize: '3rem', color: customColor }}></i>
          <h5 className="mt-3">No personal training bookings found</h5>
          <p className="text-muted">There are no bookings to display at this time</p>
        </div>
      )}

      {/* Desktop modal */}
      {isModalOpen && (
        <div
          className="modal fade show"
          tabIndex="-1"
          style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header" style={{ backgroundColor: customColor, color: 'white' }}>
                <h5 className="modal-title fw-bold">Personal Training Booking Details</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setIsModalOpen(false)}
                ></button>
              </div>
              <div className="modal-body">
                {selectedBooking ? (
                  <div className="row g-3">
                    <div className="col-md-6">
                      <strong>Booking ID:</strong> {selectedBooking.id}
                    </div>
                    <div className="col-md-6">
                      <strong>Member ID:</strong> {selectedBooking.memberId || 'N/A'}
                    </div>
                    <div className="col-md-6">
                      <strong>Trainer ID:</strong> {selectedBooking.trainerId || 'N/A'}
                    </div>
                    <div className="col-md-6">
                      <strong>Session ID:</strong> {selectedBooking.sessionId || 'N/A'}
                    </div>
                    <div className="col-md-6">
                      <strong>Class ID:</strong> {selectedBooking.classId || 'N/A'}
                    </div>
                    <div className="col-md-6">
                      <strong>Branch ID:</strong> {selectedBooking.branchId || 'N/A'}
                    </div>
                    <div className="col-md-6">
                      <strong>Member Name:</strong> {selectedBooking.memberName}
                    </div>
                    <div className="col-md-6">
                      <strong>Trainer Name:</strong> {selectedBooking.trainerName}
                    </div>
                    <div className="col-md-6">
                      <strong>Session Name:</strong> {selectedBooking.sessionName}
                    </div>
                    <div className="col-md-6">
                      <strong>Booking Type:</strong> {selectedBooking.bookingType}
                    </div>
                    <div className="col-md-6">
                      <strong>Date:</strong> {selectedBooking.date}
                    </div>
                    <div className="col-md-6">
                      <strong>Time:</strong> {selectedBooking.time}
                    </div>
                    <div className="col-md-6">
                      <strong>Price:</strong> {selectedBooking.price}
                    </div>
                    <div className="col-md-6">
                      <strong>Payment Status:</strong> {selectedBooking.paymentStatus}
                    </div>
                    <div className="col-md-6">
                      <strong>Booking Status:</strong> {selectedBooking.bookingStatus}
                    </div>
                    <div className="col-12">
                      <strong>Notes:</strong> {selectedBooking.notes}
                    </div>
                    <div className="col-md-6">
                      <strong>Created At:</strong> {selectedBooking.createdAt}
                    </div>
                    <div className="col-md-6">
                      <strong>Updated At:</strong> {selectedBooking.updatedAt}
                    </div>
                  </div>
                ) : (
                  <p>No booking selected.</p>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile modal */}
      {isMobileViewModalOpen && (
        <div
          className="modal fade show"
          tabIndex="-1"
          style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setIsMobileViewModalOpen(false)}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            style={{ margin: '0.5rem', maxWidth: '95%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header" style={{ backgroundColor: customColor, color: 'white' }}>
                <h5 className="modal-title fw-bold">Booking Details</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setIsMobileViewModalOpen(false)}
                ></button>
              </div>
              <div className="modal-body p-3">
                {selectedBooking ? (
                  <div className="card">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="mb-0 fw-bold">{selectedBooking.memberName}</h6>
                        <span className={`badge ${getBadgeColor(selectedBooking.bookingStatus)}`}>
                          {selectedBooking.bookingStatus}
                        </span>
                      </div>
                      
                      <div className="row g-2">
                        <div className="col-6">
                          <small className="text-muted d-block">Booking ID</small>
                          <div>{selectedBooking.id}</div>
                        </div>
                        <div className="col-6">
                          <small className="text-muted d-block">Trainer Name</small>
                          <div>{selectedBooking.trainerName}</div>
                        </div>
                        <div className="col-6">
                          <small className="text-muted d-block">Session Name</small>
                          <div>{selectedBooking.sessionName || 'N/A'}</div>
                        </div>
                        <div className="col-6">
                          <small className="text-muted d-block">Date</small>
                          <div>{selectedBooking.date}</div>
                        </div>
                        <div className="col-6">
                          <small className="text-muted d-block">Time</small>
                          <div>{selectedBooking.time}</div>
                        </div>
                        <div className="col-6">
                          <small className="text-muted d-block">Payment</small>
                          <div>
                            <span className={`badge ${selectedBooking.paymentStatus === 'Paid' ? 'bg-success' : 'bg-warning'}`}>
                              {selectedBooking.paymentStatus}
                            </span>
                          </div>
                        </div>
                        <div className="col-12">
                          <small className="text-muted d-block">Notes</small>
                          <div>{selectedBooking.notes}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p>No booking selected.</p>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary w-100"
                  onClick={() => setIsMobileViewModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalTraining;