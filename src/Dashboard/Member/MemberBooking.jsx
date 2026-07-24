import React, { useState, useEffect, useRef } from 'react';
import { FaEye, FaEdit, FaTrashAlt, FaPlus, FaClock } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import CustomTimePicker from '../../Components/CustomTimePicker';

const MemberBooking = () => {
  // Mock data for trainers
  const trainers = [
    { id: 1, name: 'John Smith', specialty: 'Strength Training' },
    { id: 2, name: 'Sarah Johnson', specialty: 'Yoga & Pilates' },
    { id: 3, name: 'Mike Williams', specialty: 'Cardio & HIIT' },
    { id: 4, name: 'Emily Davis', specialty: 'Weight Loss' },
  ];
  
  // State for personal training bookings
  const [ptBookings, setPtBookings] = useState([
    {
      session_id: 101,
      trainer_id: 1,
      member_id: 1,
      session_date: '2023-06-20',
      start_time: '10:00',
      end_time: '11:00',
      session_price: 5000,
      payment_status: 'Paid',
      booking_status: 'Booked'
    },
    {
      session_id: 102,
      trainer_id: 3,
      member_id: 1,
      session_date: '2023-06-22',
      start_time: '14:00',
      end_time: '15:00',
      session_price: 5000,
      payment_status: 'Pending',
      booking_status: 'Booked'
    }
  ]);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add', 'edit', 'view'
  const [selectedBooking, setSelectedBooking] = useState(null);
  
  // Form state for PT booking
  const [ptFormData, setPtFormData] = useState({
    trainer_id: '',
    session_date: '',
    start_time: '',
    end_time: '',
    session_price: 5000,
    payment_status: 'Pending',
    booking_status: 'Booked'
  });
  
  // Refs for time inputs
  const startTimeRef = useRef(null);
  const endTimeRef = useRef(null);
  
  // Enhanced time picker opener
  const openTimePicker = (ref) => {
    if (ref.current) {
      // For browsers that support showPicker()
      if (typeof ref.current.showPicker === 'function') {
        ref.current.showPicker();
      } else {
        // Fallback for browsers that don't support showPicker()
        ref.current.focus();
        // Try to trigger the picker by simulating a click
        setTimeout(() => {
          try {
            ref.current.click();
          } catch (e) {
            console.log('Could not open time picker:', e);
          }
        }, 0);
      }
    }
  };
  
  // Open modal for adding new booking
  const handleAddNew = () => {
    setModalType('add');
    setSelectedBooking(null);
    setPtFormData({
      trainer_id: '',
      session_date: '',
      start_time: '',
      end_time: '',
      session_price: 5000,
      payment_status: 'Pending',
      booking_status: 'Booked'
    });
    setIsModalOpen(true);
  };
  
  // Open modal for viewing booking
  const handleView = (booking) => {
    setModalType('view');
    setSelectedBooking(booking);
    setPtFormData({ ...booking });
    setIsModalOpen(true);
  };
  
  // Open modal for editing booking
  const handleEdit = (booking) => {
    setModalType('edit');
    setSelectedBooking(booking);
    setPtFormData({ ...booking });
    setIsModalOpen(true);
  };
  
  // Open delete confirmation modal
  const handleDeleteClick = (booking) => {
    setSelectedBooking(booking);
    setIsDeleteModalOpen(true);
  };
  
  // Confirm delete booking
  const confirmDelete = () => {
    if (selectedBooking) {
      setPtBookings(prev => prev.filter(b => b.session_id !== selectedBooking.session_id));
      alert(`Booking has been deleted.`);
    }
    setIsDeleteModalOpen(false);
    setSelectedBooking(null);
  };
  
  // Close modals
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedBooking(null);
  };
  
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedBooking(null);
  };
  
  // Handle form input changes for PT
  const handlePtChange = (e) => {
    const { name, value } = e.target;
    setPtFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Submit form (add or edit)
  const handleSubmit = () => {
    if (modalType === 'add') {
      const newBooking = {
        session_id: ptBookings.length > 0 ? Math.max(...ptBookings.map(b => b.session_id)) + 1 : 1,
        trainer_id: parseInt(ptFormData.trainer_id),
        member_id: 1, // Assuming current member ID is 1
        session_date: ptFormData.session_date,
        start_time: ptFormData.start_time,
        end_time: ptFormData.end_time,
        session_price: parseInt(ptFormData.session_price),
        payment_status: ptFormData.payment_status,
        booking_status: ptFormData.booking_status
      };
      setPtBookings([...ptBookings, newBooking]);
      alert('Personal training session booked successfully!');
    } else if (modalType === 'edit' && selectedBooking) {
      const updatedBooking = {
        ...selectedBooking,
        trainer_id: parseInt(ptFormData.trainer_id),
        session_date: ptFormData.session_date,
        start_time: ptFormData.start_time,
        end_time: ptFormData.end_time,
        session_price: parseInt(ptFormData.session_price),
        payment_status: ptFormData.payment_status,
        booking_status: ptFormData.booking_status
      };
      setPtBookings(prev => 
        prev.map(b => b.session_id === selectedBooking.session_id ? updatedBooking : b)
      );
      alert('Personal training session updated successfully!');
    }
    
    closeModal();
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Format price for display
  const formatPrice = (price) => {
    return `$${(price / 100).toFixed(2)}`;
  };
  
  // Prevent background scroll when modals are open
  useEffect(() => {
    if (isModalOpen || isDeleteModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen, isDeleteModalOpen]);
  
  return (
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="row mb-4 align-items-center">
        <div className="col-12 col-lg-8">
          <h2 className="fw-bold">Personal Training Bookings</h2>
          <p className="text-muted mb-0">Manage your personal training sessions with our expert trainers.</p>
        </div>
        <div className="col-12 col-lg-4 text-lg-end mt-3 mt-lg-0">
          <button
            className="btn d-flex align-items-center justify-content-center"
            style={{
              backgroundColor: '#6EB2CC',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              fontSize: '1rem',
              fontWeight: '500',
              transition: 'all 0.2s ease',
            }}
            onClick={handleAddNew}
          >
            <FaPlus className="me-2" /> Book New Session
          </button>
        </div>
      </div>
      
      {/* Personal Training Bookings Table */}
      <div className="card shadow-sm border-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th className="fw-semibold">TRAINER</th>
                <th className="fw-semibold">DATE</th>
                <th className="fw-semibold">TIME</th>
                <th className="fw-semibold">PRICE</th>
                <th className="fw-semibold">PAYMENT STATUS</th>
                <th className="fw-semibold">BOOKING STATUS</th>
                <th className="fw-semibold text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {ptBookings
                .filter(booking => booking.booking_status !== 'Canceled')
                .map(booking => {
                  const trainer = trainers.find(t => t.id === booking.trainer_id);
                  return (
                    <tr key={booking.session_id}>
                      <td>
                        <div>
                          <strong>{trainer ? trainer.name : 'Unknown'}</strong>
                          {trainer && <div className="text-muted small">{trainer.specialty}</div>}
                        </div>
                      </td>
                      <td>{formatDate(booking.session_date)}</td>
                      <td>{booking.start_time} - {booking.end_time}</td>
                      <td>{formatPrice(booking.session_price)}</td>
                      <td>
                        <span className={`badge ${booking.payment_status === 'Paid' ? 'bg-success' : 'bg-warning'}`}>
                          {booking.payment_status}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${booking.booking_status === 'Booked' ? 'bg-primary' : 'bg-info'}`}>
                          {booking.booking_status}
                        </span>
                      </td>
                      <td className="text-center">
                        <button
                          className="btn btn-sm btn-outline-secondary me-1"
                          title="View"
                          onClick={() => handleView(booking)}
                        >
                          <FaEye size={14} />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-primary me-1"
                          title="Edit"
                          onClick={() => handleEdit(booking)}
                        >
                          <FaEdit size={14} />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          title="Delete"
                          onClick={() => handleDeleteClick(booking)}
                        >
                          <FaTrashAlt size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              {ptBookings.filter(b => b.booking_status !== 'Canceled').length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-4">No upcoming sessions</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* MAIN MODAL (Add/Edit/View) */}
      {isModalOpen && (
        <div
          className="modal fade show"
          tabIndex="-1"
          style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={closeModal}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">
                  {modalType === 'add' ? 'Book New Session' : 
                   modalType === 'edit' ? 'Edit Booking' : 'View Booking'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeModal}
                ></button>
              </div>
              <div className="modal-body p-4">
                <form>
                  <div className="row mb-3 g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label">Trainer <span className="text-danger">*</span></label>
                      <select
                        className="form-select rounded-3"
                        name="trainer_id"
                        value={ptFormData.trainer_id}
                        onChange={handlePtChange}
                        disabled={modalType === 'view'}
                        required
                      >
                        <option value="">Select a trainer</option>
                        {trainers.map(trainer => (
                          <option key={trainer.id} value={trainer.id}>
                            {trainer.name} - {trainer.specialty}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">Date <span className="text-danger">*</span></label>
                      <input
                        type="date"
                        className="form-control rounded-3"
                        name="session_date"
                        value={ptFormData.session_date}
                        onChange={handlePtChange}
                        disabled={modalType === 'view'}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="row mb-3 g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label">Start Time <span className="text-danger">*</span></label>
                      <CustomTimePicker
                        className="form-control rounded-3"
                        name="start_time"
                        value={ptFormData.start_time}
                        onChange={handlePtChange}
                        disabled={modalType === 'view'}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">End Time <span className="text-danger">*</span></label>
                      <CustomTimePicker
                        className="form-control rounded-3"
                        name="end_time"
                        value={ptFormData.end_time}
                        onChange={handlePtChange}
                        disabled={modalType === 'view'}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="row mb-3 g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label">Price (cents) <span className="text-danger">*</span></label>
                      <input
                        type="number"
                        className="form-control rounded-3"
                        name="session_price"
                        value={ptFormData.session_price}
                        onChange={handlePtChange}
                        min="0"
                        disabled={modalType === 'view'}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">Payment Status</label>
                      <select
                        className="form-select rounded-3"
                        name="payment_status"
                        value={ptFormData.payment_status}
                        onChange={handlePtChange}
                        disabled={modalType === 'view'}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                        <option value="Failed">Failed</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Booking Status</label>
                    <select
                      className="form-select rounded-3"
                      name="booking_status"
                      value={ptFormData.booking_status}
                      onChange={handlePtChange}
                      disabled={modalType === 'view'}
                    >
                      <option value="Booked">Booked</option>
                      <option value="Completed">Completed</option>
                      <option value="Canceled">Canceled</option>
                    </select>
                  </div>
                </form>
                
                {/* Buttons */}
                <div className="d-flex flex-column flex-sm-row justify-content-end gap-2 mt-4">
                  <button
                    type="button"
                    className="btn btn-outline-secondary px-4 py-2"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                  {modalType !== 'view' && (
                    <button
                      type="button"
                      className="btn"
                      style={{
                        backgroundColor: '#6EB2CC',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px 20px',
                        fontWeight: '500',
                      }}
                      onClick={handleSubmit}
                    >
                      {modalType === 'add' ? 'Book Now' : 'Update Booking'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && (
        <div
          className="modal fade show"
          tabIndex="-1"
          style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={closeDeleteModal}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Confirm Deletion</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeDeleteModal}
                ></button>
              </div>
              <div className="modal-body text-center py-4">
                <div className="display-6 text-danger mb-3">
                  <i className="fas fa-exclamation-triangle"></i>
                </div>
                <h5>Are you sure?</h5>
                <p className="text-muted">
                  This will permanently delete the booking.<br />
                  This action cannot be undone.
                </p>
              </div>
              <div className="modal-footer border-0 justify-content-center pb-4">
                <button
                  type="button"
                  className="btn btn-outline-secondary px-4"
                  onClick={closeDeleteModal}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger px-4"
                  onClick={confirmDelete}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberBooking;