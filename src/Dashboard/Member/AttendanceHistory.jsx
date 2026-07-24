import React, { useState } from 'react';
import { FaEye } from 'react-icons/fa';

const AttendanceHistory = () => {
  // Sample data for attendance history
  const [attendanceRecords, setAttendanceRecords] = useState([
    {
      attendance_id: 1,
      class_schedule_id: "CS001",
      member_id: "M001",
      checkin_time: "2025-04-05T09:00:00",
      checkout_time: "2025-04-05T10:30:00",
      status: "Present",
      mode: "QR",
      class_type: "Group Class"
    },
    {
      attendance_id: 2,
      class_schedule_id: "PT002",
      member_id: "M002",
      checkin_time: "2025-04-05T11:15:00",
      checkout_time: "2025-04-05T12:15:00",
      status: "Late",
      mode: "Manual",
      class_type: "PT"
    },
    {
      attendance_id: 3,
      class_schedule_id: "CS003",
      member_id: "M003",
      checkin_time: "2025-04-05T14:00:00",
      checkout_time: null,
      status: "No-show",
      mode: "QR",
      class_type: "Group Class"
    },
    {
      attendance_id: 4,
      class_schedule_id: "PT004",
      member_id: "M004",
      checkin_time: "2025-04-05T16:45:00",
      checkout_time: "2025-04-05T17:45:00",
      status: "Present",
      mode: "QR",
      class_type: "PT"
    },
    {
      attendance_id: 5,
      class_schedule_id: "CS005",
      member_id: "M005",
      checkin_time: "2025-04-05T18:30:00",
      checkout_time: "2025-04-05T19:30:00",
      status: "Present",
      mode: "Manual",
      class_type: "Group Class"
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const handleView = (record) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
  };

  // Prevent background scroll when modal is open
  React.useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "—";
    const date = new Date(dateTimeString);
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Present': return 'bg-success';
      case 'Absent': return 'bg-danger';
      case 'Late': return 'bg-warning';
      case 'No-show': return 'bg-secondary';
      default: return 'bg-light';
    }
  };

  return (
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="row mb-4 align-items-center">
        <div className="col-12">
          <h2 className="fw-bold">Attendance History</h2>
          <p className="text-muted mb-0">View attendance records for all classes and sessions.</p>
        </div>
      </div>

      {/* Search */}
      <div className="row mb-4">
        <div className="col-12 col-md-6">
          <div className="input-group">
            <span className="input-group-text bg-light border">
              <i className="fas fa-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control border"
              placeholder="Search by member ID or class ID..."
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card shadow-sm border-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th className="fw-semibold">ATTENDANCE ID</th>
                <th className="fw-semibold">CLASS ID</th>
                <th className="fw-semibold">MEMBER ID</th>
                <th className="fw-semibold">CHECK-IN</th>
                <th className="fw-semibold">CHECK-OUT</th>
                <th className="fw-semibold">STATUS</th>
                <th className="fw-semibold">MODE</th>
                <th className="fw-semibold">CLASS TYPE</th>
                <th className="fw-semibold text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {attendanceRecords.map((record) => (
                <tr key={record.attendance_id}>
                  <td>{record.attendance_id}</td>
                  <td>{record.class_schedule_id}</td>
                  <td>{record.member_id}</td>
                  <td>{formatDateTime(record.checkin_time)}</td>
                  <td>{formatDateTime(record.checkout_time)}</td>
                  <td>
                    <span className={`badge ${getStatusBadgeClass(record.status)}`}>
                      {record.status}
                    </span>
                  </td>
                  <td>{record.mode}</td>
                  <td>{record.class_type}</td>
                  <td className="text-center">
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      title="View Details"
                      onClick={() => handleView(record)}
                    >
                      <FaEye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW MODAL */}
      {isModalOpen && selectedRecord && (
        <div
          className="modal fade show"
          tabIndex="-1"
          style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={closeModal}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Attendance Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeModal}
                ></button>
              </div>
              <div className="modal-body p-4">
                <div className="row mb-3">
                  <div className="col-6">
                    <p className="text-muted mb-1">Attendance ID</p>
                    <p className="fw-bold">{selectedRecord.attendance_id}</p>
                  </div>
                  <div className="col-6">
                    <p className="text-muted mb-1">Class Schedule ID</p>
                    <p className="fw-bold">{selectedRecord.class_schedule_id}</p>
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-6">
                    <p className="text-muted mb-1">Member ID</p>
                    <p className="fw-bold">{selectedRecord.member_id}</p>
                  </div>
                  <div className="col-6">
                    <p className="text-muted mb-1">Class Type</p>
                    <p className="fw-bold">{selectedRecord.class_type}</p>
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-6">
                    <p className="text-muted mb-1">Check-in Time</p>
                    <p className="fw-bold">{formatDateTime(selectedRecord.checkin_time)}</p>
                  </div>
                  <div className="col-6">
                    <p className="text-muted mb-1">Check-out Time</p>
                    <p className="fw-bold">{formatDateTime(selectedRecord.checkout_time)}</p>
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-6">
                    <p className="text-muted mb-1">Status</p>
                    <span className={`badge ${getStatusBadgeClass(selectedRecord.status)}`}>
                      {selectedRecord.status}
                    </span>
                  </div>
                  <div className="col-6">
                    <p className="text-muted mb-1">Check-in Mode</p>
                    <p className="fw-bold">{selectedRecord.mode}</p>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal}
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

export default AttendanceHistory;