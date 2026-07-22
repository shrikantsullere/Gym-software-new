import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaClock, FaUser, FaCalendarAlt, FaRupeeSign } from 'react-icons/fa';
import axiosInstance from '../../Api/axiosInstance';

const ClassSchedule = () => {
  const [groupClasses, setGroupClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState(null);

  const getUserFromStorage = () => {
    try {
      const userStr = localStorage.getItem('user');
      const userData = userStr ? JSON.parse(userStr) : null;
      console.log('User data from localStorage:', userData); // Debug log
      return userData;
    } catch (err) {
      console.error('Error parsing user from localStorage:', err);
      return null;
    }
  };

  const user = getUserFromStorage();
  const memberId = user?.memberId || user?.id || null;
  const adminId = user?.adminId || null;
  const id = user?.id || null;

  // Fetch classes (includes isBooked)
  useEffect(() => {
    const fetchClasses = async () => {
      if (!memberId) {
        setError('User not logged in.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axiosInstance.get(`class/classes/member/${memberId}?adminId=${adminId}`);

        if (response.data.success && Array.isArray(response.data.data)) {
          const transformedClasses = response.data.data.map(classItem => {
            // Parse time range from "13:23 - 15:23" format
            const [startTime, endTime] = classItem.time ? classItem.time.split(' - ') : ['', ''];

            return {
              id: classItem.id,
              bookingId: classItem.bookingId,
              name: classItem.className,
              trainer_name: classItem.trainer,
              date: classItem.date.split('T')[0], // Extract date part
              start_time: startTime,
              end_time: endTime,
              day: classItem.day,
              branch: 'Main Branch', // Default branch
              status: classItem.status,
              capacity: classItem.capacity,
              booked_seats: classItem.membersCount,
              isBooked: classItem.isBooked,
              scheduleId: classItem.id,
              bookedMember: classItem.bookedMember
            };
          });

          setGroupClasses(transformedClasses);
          setError(null);
        } else {
          setError('Failed to fetch classes');
        }
      } catch (err) {
        console.error('Error fetching classes:', err);
        setError('Failed to load classes. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [memberId]);

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const openBookingModal = (cls) => {
    setSelectedClass(cls);
    setIsModalOpen(true);
    setBookingError(null);
  };

  const closeBookingModal = () => {
    setIsModalOpen(false);
    setSelectedClass(null);
    setBookingError(null);
  };

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  const handleConfirmBooking = async () => {
    if (!id || !selectedClass) {
      alert('User not logged in or class not selected.');
      return;
    }

    setBookingLoading(true);
    setBookingError(null);

    try {
      const payload = {
        memberId: id,
        scheduleId: selectedClass.scheduleId || selectedClass.id
      };

      // Only add adminId if it exists
      if (adminId) {
        payload.adminId = adminId;
      }

      console.log('Booking payload:', payload); // Debug log

      const response = await axiosInstance.post('class/book', payload);

      if (response.data.success) {
        alert(`✅ Successfully booked ${selectedClass.name}!`);

        // ✅ Update UI: mark as booked and increment booked seats
        setGroupClasses(prev =>
          prev.map(cls =>
            cls.id === selectedClass.id ? {
              ...cls,
              isBooked: true,
              booked_seats: cls.booked_seats + 1,
              bookingId: response.data.bookingId || cls.bookingId,
              bookedMember: {
                id: id,
                name: user?.fullName || 'Current User',
                email: user?.email || '',
                phone: user?.phone || ''
              }
            } : cls
          )
        );

        closeBookingModal();
      } else {
        throw new Error(response.data.message || 'Booking failed');
      }
    } catch (err) {

    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-2">
        <div className="row mb-3">
          <div className="col-12 text-center text-md-start">
            <h1 className="fw-bold">Class Schedule</h1>
            <p className="text-muted mb-0">View and book available classes</p>
          </div>
        </div>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading classes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2">
      <div className="row mb-3">
        <div className="col-12 text-center text-md-start">
          <h1 className="fw-bold">Class Schedule</h1>
          <p className="text-muted mb-0">View and book available classes</p>
        </div>
      </div>

      <div className="row g-4">
        {groupClasses.map(cls => {
          const isFull = cls.booked_seats >= cls.capacity;
          const isActive = cls.status === 'Active';
          const isBooked = cls.isBooked;

          let buttonText = 'Book Now';
          let buttonDisabled = false;
          let buttonStyle = '#2f6a87';
          let badgeText = 'Available';
          let badgeStyle = 'bg-success';

          if (isBooked) {
            buttonText = 'View Booking';
            buttonStyle = '#2f6e34ff';
            badgeText = 'Booked';
            badgeStyle = 'bg-primary';
          } else if (isFull) {
            buttonText = 'Class Full';
            buttonDisabled = true;
            buttonStyle = '#6c757d';
            badgeText = 'Full';
            badgeStyle = 'bg-danger';
          } else if (!isActive) {
            buttonText = 'Inactive';
            buttonDisabled = true;
            buttonStyle = '#6c757d';
            badgeText = 'Inactive';
            badgeStyle = 'bg-secondary';
          }

          return (
            <div key={`${cls.id}-${cls.bookingId}`} className="col-12 col-md-6 col-lg-4">
              <div className="card shadow-sm border-0" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                <div
                  className="p-4"
                  style={{
                    color: '#2f6a87',
                    minHeight: '60px'
                  }}
                >
                  <h5 className="mb-0 fw-bold">{cls.name}</h5>
                  <small className="text-muted">{cls.branch}</small>
                  <div className="mt-2">
                    <span className={`badge ${badgeStyle}`}>{badgeText}</span>
                    <span className="badge bg-light text-dark ms-2">{cls.booked_seats}/{cls.capacity}</span>
                  </div>
                </div>
                <div className="card-body p-4">
                  <div className="d-flex align-items-center mb-3">
                    <FaClock size={16} className="me-2 text-primary" />
                    <small>{formatTime(cls.start_time)} - {formatTime(cls.end_time)}</small>
                  </div>
                  <div className="d-flex align-items-center mb-3">
                    <FaUser size={16} className="me-2 text-primary" />
                    <small>{cls.trainer_name}</small>
                  </div>
                  <div className="d-flex align-items-center mb-3">
                    <FaCalendarAlt size={16} className="me-2 text-primary" />
                    <small>{cls.day}</small>
                  </div>

                  <div className="mt-4">
                    <button
                      className="btn w-100 py-2 fw-medium"
                      style={{
                        backgroundColor: buttonStyle,
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        transition: 'all 0.2s ease'
                      }}
                      disabled={buttonDisabled}
                      onClick={() => openBookingModal(cls)}
                    >
                      {buttonText}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* BOOKING MODAL */}
      {isModalOpen && selectedClass && (
        <div
          className="modal fade show"
          tabIndex="-1"
          style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={closeBookingModal}
        >
          <div
            className="modal-dialog modal-dialog-centered modal-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content" style={{ borderRadius: '16px' }}>
              <div className="modal-header border-0 pb-0">
                <h3 className="modal-title fw-bold">Booking Details</h3>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeBookingModal}
                ></button>
              </div>
              <div className="modal-body p-4">
                <div className="card border-0 shadow-sm mb-4">
                  <div
                    className="card-header p-4 text-white"
                    style={{
                      background: '#2f6e34ff',
                      borderRadius: '12px 12px 0 0'
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h4 className="mb-2 fw-bold">{selectedClass.name}</h4>
                        <div className="d-flex align-items-center mb-2">
                          <FaCalendarAlt size={16} className="me-2" />
                          <small>{formatDate(selectedClass.date)} ({selectedClass.day})</small>
                        </div>
                        <div className="d-flex align-items-center mb-2">
                          <FaClock size={16} className="me-2" />
                          <small>{formatTime(selectedClass.start_time)} - {formatTime(selectedClass.end_time)}</small>
                        </div>
                        <div className="d-flex align-items-center">
                          <FaUser size={16} className="me-2" />
                          <small>{selectedClass.trainer_name}</small>
                        </div>
                      </div>
                      <div className="text-end">
                        {selectedClass.isBooked ? (
                          <span className="badge bg-light text-success fw-bold">✓ BOOKED</span>
                        ) : (
                          <span className="badge bg-light text-primary fw-bold">AVAILABLE</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="card-body p-4">
                    <h5 className="fw-bold mb-3">{selectedClass.isBooked ? 'Booking Information' : 'Class Information'}</h5>
                    <div className="row g-4 mb-4">
                      <div className="col-md-6">
                        <div className="d-flex align-items-center">
                          <div className="bg-light rounded-circle p-2 me-3">
                            <FaUser size={16} className="text-primary" />
                          </div>
                          <div>
                            <div className="fw-medium">Trainer</div>
                            <div>{selectedClass.trainer_name}</div>
                          </div>
                        </div>
                      </div>
                      {selectedClass.isBooked && selectedClass.bookingId && (
                        <div className="col-md-6">
                          <div className="d-flex align-items-center">
                            <div className="bg-light rounded-circle p-2 me-3">
                              <span className="text-primary">🆔</span>
                            </div>
                            <div>
                              <div className="fw-medium">Booking ID</div>
                              <div>#{selectedClass.bookingId}</div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="col-md-6">
                        <div className="d-flex align-items-center">
                          <div className="bg-light rounded-circle p-2 me-3">
                            <FaClock size={16} className="text-primary" />
                          </div>
                          <div>
                            <div className="fw-medium">Duration</div>
                            <div>
                              {selectedClass.start_time && selectedClass.end_time ?
                                Math.round((new Date(`2024-01-01T${selectedClass.end_time}:00`) - new Date(`2024-01-01T${selectedClass.start_time}:00`)) / 60000) + ' minutes'
                                : 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="d-flex align-items-center">
                          <div className="bg-light rounded-circle p-2 me-3">
                            <span className="text-primary">📍</span>
                          </div>
                          <div>
                            <div className="fw-medium">Branch</div>
                            <div>{selectedClass.branch}</div>
                          </div>
                        </div>
                      </div>
                      {!selectedClass.isBooked && (
                        <div className="col-md-6">
                          <div className="d-flex align-items-center">
                            <div className="bg-light rounded-circle p-2 me-3">
                              <span className="text-primary">👥</span>
                            </div>
                            <div>
                              <div className="fw-medium">Availability</div>
                              <div>{selectedClass.booked_seats}/{selectedClass.capacity} seats filled</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="text-center">
                      {selectedClass.isBooked ? (
                        <button
                          className="btn btn-lg px-5 py-3 fw-bold"
                          style={{
                            backgroundColor: '#6c757d',
                            color: 'white',
                            borderRadius: '8px',
                            border: 'none',
                            fontSize: '1.1rem'
                          }}
                          onClick={closeBookingModal}
                        >
                          Close
                        </button>
                      ) : (
                        <div className="d-flex gap-3 justify-content-center">
                          <button
                            className="btn btn-outline-secondary btn-lg px-4 py-3 fw-bold"
                            style={{
                              borderRadius: '8px',
                              fontSize: '1.1rem'
                            }}
                            onClick={closeBookingModal}
                          >
                            Cancel
                          </button>
                          <button
                            className="btn btn-lg px-5 py-3 fw-bold"
                            style={{
                              backgroundColor: '#2f6a87',
                              color: 'white',
                              borderRadius: '8px',
                              border: 'none',
                              fontSize: '1.1rem'
                            }}
                            onClick={handleConfirmBooking}
                            disabled={bookingLoading || selectedClass.booked_seats >= selectedClass.capacity}
                          >
                            {bookingLoading ? 'Booking...' : 'Confirm Booking'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassSchedule;