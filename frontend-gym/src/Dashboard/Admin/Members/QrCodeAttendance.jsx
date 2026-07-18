import React from 'react';
import QRAttendanceSystem from '../../../Components/QRAttendanceSystem';
import CustomTimePicker from '../../../Components/CustomTimePicker';

const QRCodeAttendance = () => {
  return <QRAttendanceSystem />;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [modalType, setModalType] = useState('view'); // Only 'view' and 'edit' now
  const [selectedRecord, setSelectedRecord] = useState(null);
  
  // Sample data - only QR-scanned records
  const [records, setRecords] = useState([
    {
      id: 1,
      date: "2025-04-05",
      member_name: "Alex Johnson",
      checkin_time: "06:15",
      checkout_time: "07:45",
  
      status: "Present"
    },
    {
      id: 2,
      date: "2025-04-05",
      member_name: "Braidy Con",
      checkin_time: "09:30",
      checkout_time: "10:45",


      status: "Late"
    },
    {
      id: 3,
      date: "2025-04-05",
      member_name: "Sarah Kim",
      checkin_time: null,
      checkout_time: null,

      status: "Absent"
    },
    {
      id: 4,
      date: "2025-04-04",
      member_name: "Michael Brown",
      checkin_time: "05:55",
      checkout_time: "07:30",

      status: "Present"
    }
  ]);

  const handleView = (record) => {
    setSelectedRecord(record);
    setModalType('view');
    setIsModalOpen(true);
  };

  const handleEdit = (record) => {
    setSelectedRecord(record);
    setModalType('edit');
    setIsModalOpen(true);
  };

  const handleDeleteClick = (record) => {
    setSelectedRecord(record);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedRecord) {
      setRecords(prev => prev.filter(r => r.id !== selectedRecord.id));
      alert('Attendance record deleted successfully!');
    }
    closeDeleteModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedRecord(null);
  };

  const getStatusBadge = (status) => {
    const badgeClasses = {
      Present: "bg-success-subtle text-success-emphasis",
      Late: "bg-warning-subtle text-warning-emphasis",
      Absent: "bg-danger-subtle text-danger-emphasis"
    };
    return (
      <span className={`badge rounded-pill ${badgeClasses[status] || 'bg-secondary'} px-3 py-1`}>
        {status}
      </span>
    );
  };

  const getModalTitle = () => {
    return modalType === 'edit' ? 'Edit Attendance Record' : 'Attendance Record Details';
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const RecordViewContent = ({ record }) => {
    if (!record) return null;
    
    const getStatusIcon = (status) => {
      switch (status) {
        case 'Present':
          return <FaCheckCircle className="text-success fs-4 fs-md-5" />;
        case 'Late':
          return <FaExclamationTriangle className="text-warning fs-4 fs-md-5" />;
        case 'Absent':
          return <FaTimesCircle className="text-danger fs-4 fs-md-5" />;
        default:
          return <FaExclamationTriangle className="text-secondary fs-4 fs-md-5" />;
      }
    };
    
    const getStatusDescription = (status) => {
      switch (status) {
        case 'Present':
          return 'Member attended on time';
        case 'Late':
          return 'Member arrived late';
        case 'Absent':
          return 'Member did not attend';
        default:
          return 'Status unknown';
      }
    };
    
    return (
      <div className="record-view-content">
        {/* Header Section */}
        <div className="text-center mb-4 pb-3 border-bottom">
          <h3 className="mb-1">{record.member_name}</h3>
          <p className="text-muted mb-2">Attendance Record</p>
          <div className="mt-2 d-flex justify-content-center align-items-center">
            {getStatusIcon(record.status)}
            <span className="ms-2">{getStatusBadge(record.status)}</span>
          </div>
        </div>
        
        {/* Record Details */}
        <div className="row g-3 mb-4">
          <div className="col-md-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body d-flex align-items-center">
                <div className="rounded-circle bg-light p-3 me-3">
                  <FaCalendarAlt className="text-primary fs-4 fs-md-5" />
                </div>
                <div>
                  <h6 className="mb-1">Date</h6>
                  <p className="mb-0 fw-bold">{formatDate(record.date)}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body d-flex align-items-center">
                <div className="rounded-circle bg-light p-3 me-3">
                  <FaUser className="text-info fs-4 fs-md-5" />
                </div>
                <div>
                  <h6 className="mb-1">Member</h6>
                  <p className="mb-0 fw-bold">{record.member_name}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Check-in/Check-out Times */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <h5 className="card-title d-flex align-items-center mb-3">
              <FaClock className="text-primary me-2 fs-4 fs-md-5" /> Attendance Times
            </h5>
            <div className="row g-3">
              <div className="col-md-6">
                <div className="p-3 bg-light rounded">
                  <h6 className="mb-1">Check-in Time</h6>
                  <p className="mb-0 fs-5 fs-md-4 fw-bold">
                    {record.checkin_time || <span className="text-muted">No check-in recorded</span>}
                  </p>
                </div>
              </div>
              <div className="col-md-6">
                <div className="p-3 bg-light rounded">
                  <h6 className="mb-1">Check-out Time</h6>
                  <p className="mb-0 fs-5 fs-md-4 fw-bold">
                    {record.checkout_time || <span className="text-muted">No check-out recorded</span>}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
  
        {/* Status Information */}
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <h5 className="card-title d-flex align-items-center mb-3">
              {getStatusIcon(record.status)}
              Status Information
            </h5>
            <div className="d-flex align-items-center">
              {getStatusBadge(record.status)}
              <span className="ms-3">
                {getStatusDescription(record.status)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="">
      {/* Header — NO "Manual Entry" Button! */}
      <div className="row mb-4 align-items-center">
        <div className="col-12 col-lg-8">
          <h2 className="fw-bold">QR Code Attendance Records</h2>
          <p className="text-muted mb-0">Track member attendance via QR scan only.</p>
        </div>
        {/* ✅ REMOVED: Manual Entry Button */}
      </div>
      
      {/* Search & Actions */}
      <div className="row mb-4 g-3">
        <div className="col-12 col-md-6 col-lg-5">
          <div className="input-group">
            <span className="input-group-text bg-light border">
              <i className="fas fa-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control border"
              placeholder="Search by member name..."
            />
          </div>
        </div>
        <div className="col-6 col-md-3 col-lg-2">
          <button className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center">
            <i className="fas fa-filter me-1"></i> Filter
          </button>
        </div>
        <div className="col-6 col-md-3 col-lg-2">
          <button className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center">
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
                <th className="fw-semibold">DATE</th>
                <th className="fw-semibold">MEMBER NAME</th>
                <th className="fw-semibold d-none d-md-table-cell">CHECK-IN</th>
                <th className="fw-semibold d-none d-md-table-cell">CHECK-OUT</th>
         
      
                <th className="fw-semibold">STATUS</th>
                <th className="fw-semibold text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  <td>{formatDate(record.date)}</td>
                  <td><strong>{record.member_name}</strong></td>
                  <td className="d-none d-md-table-cell">{record.checkin_time || <span className="text-muted">—</span>}</td>
                  <td className="d-none d-md-table-cell">{record.checkout_time || <span className="text-muted">—</span>}</td>
           
             
                  <td>{getStatusBadge(record.status)}</td>
                  <td className="text-center">
                    <div className="d-flex justify-content-center flex-nowrap" style={{ gap: '4px' }}>
                      <button
                        className="btn btn-sm btn-outline-secondary action-btn"
                        title="View"
                        onClick={() => handleView(record)}
                        style={{ width: '32px', height: '32px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <FaEye className="fs-6" />
                      </button>
                      <button
                        className="btn btn-sm btn-outline-primary action-btn"
                        title="Edit"
                        onClick={() => handleEdit(record)}
                        style={{ width: '32px', height: '32px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <FaEdit className="fs-6" />
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger action-btn"
                        title="Delete"
                        onClick={() => handleDeleteClick(record)}
                        style={{ width: '32px', height: '32px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <FaTrashAlt className="fs-6" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* MAIN MODAL (View/Edit Only) */}
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
                {modalType === 'view' ? (
                  <RecordViewContent record={selectedRecord} />
                ) : (
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const updatedRecord = {
                      ...selectedRecord,
                      date: e.target.date.value,
                      member_name: e.target.member_name.value,
                      checkin_time: e.target.checkin_time.value || null,
                      checkout_time: e.target.checkout_time.value || null,
       
        
                      status: e.target.status.value
                    };
                    setRecords(prev =>
                      prev.map(r => r.id === selectedRecord.id ? updatedRecord : r)
                    );
                    alert('Attendance record updated successfully!');
                    closeModal();
                  }}>
                    {/* Date & Member — Editable but must match existing records */}
                    <div className="row mb-3 g-3">
                      <div className="col-12 col-md-6">
                        <label className="form-label">Date <span className="text-danger">*</span></label>
                        <input
                          type="date"
                          className="form-control rounded-3"
                          defaultValue={selectedRecord?.date || new Date().toISOString().split('T')[0]}
                          required
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label">Member Name <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control rounded-3"
                          defaultValue={selectedRecord?.member_name || ''}
                          required
                        />
                      </div>
                    </div>
                    
                    {/* Check-in / Check-out */}
                    <div className="row mb-3 g-3">
                      <div className="col-12 col-md-6">
                        <label className="form-label">Check-in Time</label>
                        <CustomTimePicker
                          className="form-control rounded-3"
                          defaultValue={selectedRecord?.checkin_time || ''}
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label">Check-out Time</label>
                        <CustomTimePicker
                          className="form-control rounded-3"
                          defaultValue={selectedRecord?.checkout_time || ''}
                        />
                      </div>
                    </div>
                    
             
                    
                    {/* Status */}
                    <div className="mb-4">
                      <label className="form-label">Status <span className="text-danger">*</span></label>
                      <select
                        className="form-select rounded-3"
                        defaultValue={selectedRecord?.status || 'Present'}
                        required
                      >
                        <option value="Present">Present</option>
                        <option value="Late">Late</option>
                        <option value="Absent">Absent</option>
                      </select>
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
                      <button
                        type="submit"
                        className="btn d-flex align-items-center justify-content-center"
                        style={{
                          backgroundColor: '#6EB2CC',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '10px 20px',
                          fontWeight: '500',
                        }}
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                )}
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
                  <i className="fas fa-exclamation-triangle fs-1"></i>
                </div>
                <h5>Are you sure?</h5>
                <p className="text-muted">
                  This will permanently delete the attendance record for <strong>{selectedRecord?.member_name}</strong> on <strong>{selectedRecord ? formatDate(selectedRecord.date) : ''}</strong>.<br />
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
      
      <style jsx>{`
        .action-btn {
          width: 36px;
          height: 36px;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        @media (max-width: 768px) {
          .action-btn {
            width: 32px;
            height: 32px;
          }
        }
      `}</style>
    </div>
  );
};

export default QRCodeAttendance;