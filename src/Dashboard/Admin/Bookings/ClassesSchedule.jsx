import React, { useState, useRef, useEffect } from 'react';
import { FaEye, FaEdit, FaTrashAlt } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';

const ClassesSchedule = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add', 'edit', 'view'
  const [selectedClass, setSelectedClass] = useState(null);
  const fileInputRef = useRef(null);

  // Sample trainers for dropdown
  const trainers = [
    { id: 1, name: "John Smith" },
    { id: 2, name: "Mike Williams" },
    { id: 3, name: "Sarah Johnson" },
    { id: 4, name: "Robert Davis" }
  ];

  // Sample classes data
  const [classes, setClasses] = useState([
    {
      id: 101,
      class_name: "Strength Training",
      trainer_name: "John Smith",
      date: "2023-06-20",
      time: "10:00 - 11:00",
      schedule_day: "Tuesday",
      total_sheets: 15,
      status: "Active"
    },
    {
      id: 102,
      class_name: "Cardio & HIIT",
      trainer_name: "Mike Williams",
      date: "2023-06-22",
      time: "14:00 - 15:00",
      schedule_day: "Thursday",
      total_sheets: 20,
      status: "Active"
    },
    {
      id: 103,
      class_name: "Yoga Basics",
      trainer_name: "Sarah Johnson",
      date: "2023-06-24",
      time: "09:00 - 10:00",
      schedule_day: "Saturday",
      total_sheets: 12,
      status: "Active"
    },
    {
      id: 104,
      class_name: "Advanced Pilates",
      trainer_name: "Robert Davis",
      date: "2023-06-26",
      time: "18:00 - 19:00",
      schedule_day: "Monday",
      total_sheets: 10,
      status: "Inactive"
    }
  ]);

  const handleAddNew = () => {
    setModalType('add');
    setSelectedClass(null);
    setIsModalOpen(true);
  };

  const handleView = (gymClass) => {
    setModalType('view');
    setSelectedClass(gymClass);
    setIsModalOpen(true);
  };

  const handleEdit = (gymClass) => {
    setModalType('edit');
    setSelectedClass(gymClass);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (gymClass) => {
    setSelectedClass(gymClass);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedClass) {
      setClasses(prev => prev.filter(c => c.id !== selectedClass.id));
      alert(`Class "${selectedClass.class_name}" has been deleted.`);
    }
    setIsDeleteModalOpen(false);
    setSelectedClass(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedClass(null);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedClass(null);
  };

  // Prevent background scroll when modal is open
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

  const getStatusBadge = (status) => {
    const badgeClasses = {
      Active: "bg-success-subtle text-success-emphasis",
      Inactive: "bg-danger-subtle text-danger-emphasis"
    };
    return (
      <span className={`badge rounded-pill ${badgeClasses[status] || 'bg-secondary'} px-3 py-1`}>
        {status}
      </span>
    );
  };

  const getModalTitle = () => {
    switch (modalType) {
      case 'add': return 'Add New Class';
      case 'edit': return 'Edit Class';
      case 'view': return 'View Class Details';
      default: return 'Class Management';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getNextClassId = () => {
    const maxId = classes.length > 0 ? Math.max(...classes.map(c => parseInt(c.id))) : 0;
    return `CLASS${String(maxId + 1).padStart(3, '0')}`;
  };

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="row mb-4 align-items-center">
        <div className="col-12 col-lg-8">
          <h2 className="fw-bold">Gym Class Management</h2>
          <p className="text-muted mb-0">Manage all gym classes, schedules, and trainer assignments.</p>
        </div>
        <div className="col-12 col-lg-4 text-lg-end mt-3 mt-lg-0">
          <button
            className="btn"
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
            <i className="fas fa-plus me-2"></i> Add Class
          </button>
        </div>
      </div>

      {/* Search & Actions */}
      <div className="row mb-4 g-3">
        <div className="col-12 col-md-6 col-lg-5">
          <div className="input-group">
            <span className="input-group-text bg-light">
              <i className="fas fa-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control border"
              placeholder="Search classes by name or trainer..."
            />
          </div>
        </div>
        <div className="col-6 col-md-3 col-lg-2">
          <button className="btn btn-outline-secondary w-100">
            <i className="fas fa-filter me-1"></i> Filter
          </button>
        </div>
        <div className="col-6 col-md-3 col-lg-2">
          <button className="btn btn-outline-secondary w-100">
            <i className="fas fa-file-export me-1"></i> Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card shadow-sm border-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th className="fw-semibold">CLASS NAME</th>
                <th className="fw-semibold">TRAINER</th>
                <th className="fw-semibold">DATE</th>
                <th className="fw-semibold">TIME</th>
                <th className="fw-semibold">DAY</th>
                <th className="fw-semibold">SHEETS</th>
                <th className="fw-semibold">STATUS</th>
                <th className="fw-semibold text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((gymClass) => (
                <tr key={gymClass.id}>
                  <td>
                    <strong>{gymClass.class_name}</strong>
                  </td>
                  <td>{gymClass.trainer_name}</td>
                  <td>{formatDate(gymClass.date)}</td>
                  <td>{gymClass.time}</td>
                  <td>{gymClass.schedule_day}</td>
                  <td>{gymClass.total_sheets}</td>
                  <td>{getStatusBadge(gymClass.status)}</td>
                  <td className="text-center">
                    <div className="d-flex justify-content-center align-items-center gap-1" style={{ whiteSpace: 'nowrap' }}>
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        title="View"
                        onClick={(e) => { e.stopPropagation(); handleView(gymClass); }}
                      >
                        <FaEye size={14} />
                      </button>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        title="Edit"
                        onClick={(e) => { e.stopPropagation(); handleEdit(gymClass); }}
                      >
                        <FaEdit size={14} />
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        title="Delete"
                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(gymClass); }}
                      >
                        <FaTrashAlt size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
                <h5 className="modal-title fw-bold">{getModalTitle()}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeModal}
                ></button>
              </div>
              <div className="modal-body p-4">
                <form>
                  {/* SECTION 1: Class Information */}
                  <h6 className="fw-bold mb-3">Class Information</h6>
                  <div className="row mb-3 g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label">Class ID</label>
                      <input
                        type="text"
                        className="form-control rounded-3"
                        defaultValue={selectedClass?.id || (modalType === 'add' ? getNextClassId() : '')}
                        readOnly
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">Class Name <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control rounded-3"
                        placeholder="Enter class name"
                        defaultValue={selectedClass?.class_name || ''}
                        readOnly={modalType === 'view'}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">Trainer <span className="text-danger">*</span></label>
                      <select
                        className="form-select rounded-3"
                        defaultValue={selectedClass?.trainer_name || trainers[0].name}
                        disabled={modalType === 'view'}
                        required
                      >
                        {trainers.map(trainer => (
                          <option key={trainer.id} value={trainer.name}>{trainer.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">Schedule Day <span className="text-danger">*</span></label>
                      <select
                        className="form-select rounded-3"
                        defaultValue={selectedClass?.schedule_day || 'Monday'}
                        disabled={modalType === 'view'}
                        required
                      >
                        <option value="Monday">Monday</option>
                        <option value="Tuesday">Tuesday</option>
                        <option value="Wednesday">Wednesday</option>
                        <option value="Thursday">Thursday</option>
                        <option value="Friday">Friday</option>
                        <option value="Saturday">Saturday</option>
                        <option value="Sunday">Sunday</option>
                      </select>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">Date <span className="text-danger">*</span></label>
                      <input
                        type="date"
                        className="form-control rounded-3"
                        defaultValue={selectedClass?.date || new Date().toISOString().split('T')[0]}
                        readOnly={modalType === 'view'}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">Time <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control rounded-3"
                        placeholder="e.g., 10:00 - 11:00"
                        defaultValue={selectedClass?.time || ''}
                        readOnly={modalType === 'view'}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">Total Sheets <span className="text-danger">*</span></label>
                      <input
                        type="number"
                        className="form-control rounded-3"
                        placeholder="Enter number of sheets"
                        defaultValue={selectedClass?.total_sheets || ''}
                        readOnly={modalType === 'view'}
                        min="1"
                        required
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Status</label>
                      <select
                        className="form-select rounded-3"
                        defaultValue={selectedClass?.status || 'Active'}
                        disabled={modalType === 'view'}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

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
                        onClick={() => {
                          if (modalType === 'add') {
                            alert('New class added successfully!');
                          } else {
                            alert('Class updated successfully!');
                          }
                          closeModal();
                        }}
                      >
                        {modalType === 'add' ? 'Add Class' : 'Update Class'}
                      </button>
                    )}
                  </div>
                </form>
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
                  This will permanently delete <strong>{selectedClass?.class_name}</strong>.<br />
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

export default ClassesSchedule;