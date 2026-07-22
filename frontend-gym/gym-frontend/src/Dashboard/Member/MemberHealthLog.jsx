import React, { useState, useEffect } from "react";
import axiosInstance from "../../Api/axiosInstance";

const MemberHealthLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (!user.id && !user.memberId) return;
      
      const actualMemberId = user.memberId || user.id;
      const response = await axiosInstance.get(`health/member/${actualMemberId}`);
      if (response.data && response.data.logs) {
        setLogs(response.data.logs);
      }
    } catch (error) {
      console.error("Error fetching health logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const openModal = (log) => {
    setSelectedLog(log);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedLog(null);
    setShowModal(false);
  };

  const getStatusBadgeClass = (status) => {
    if (!status) return 'bg-secondary';
    const s = status.toLowerCase();
    if (s === 'normal') return 'bg-success';
    if (s === 'underweight') return 'bg-info text-dark';
    if (s === 'overweight') return 'bg-warning text-dark';
    if (s === 'obese') return 'bg-danger';
    return 'bg-secondary';
  };

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <h2 className="mb-4" style={{ color: "#2f6a87", fontWeight: "bold" }}>
        My Health & BMI Log
      </h2>

      <div className="card shadow-sm border-0" style={{ borderRadius: "15px" }}>
        <div className="card-header bg-white border-0 pt-4 pb-0 d-flex justify-content-between align-items-center">
          <h5 style={{ fontWeight: "600", color: "#2f6a87" }}>Health & Assessment History</h5>
          <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill fw-bold" style={{ fontSize: '12px' }}>
            {logs.length} Log{logs.length !== 1 ? 's' : ''} Recorded
          </span>
        </div>

        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status" />
              <div className="mt-2 text-muted fw-semibold">Loading health logs...</div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 text-nowrap">
                <thead className="table-light">
                  <tr style={{ fontSize: '13px' }}>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3">Weight (kg)</th>
                    <th className="py-3">Height (cm)</th>
                    <th className="py-3">BMI</th>
                    <th className="py-3">Status</th>
                    <th className="py-3">Diet / Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length > 0 ? (
                    logs.map((log) => (
                      <tr key={log.id}>
                        <td className="px-3 py-3 fw-semibold text-dark">
                          {new Date(log.recordedAt || log.createdAt || new Date()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="py-3 fw-bold text-dark">{log.weight ? `${log.weight} kg` : '-'}</td>
                        <td className="py-3 text-muted">{log.height ? `${log.height} cm` : '-'}</td>
                        <td className="py-3 fw-bold text-primary">{log.bmi || '-'}</td>
                        <td className="py-3">
                          {log.bmiStatus ? (
                            <span className={`badge px-3 py-2 rounded-pill fw-bold ${getStatusBadgeClass(log.bmiStatus)}`} style={{ fontSize: '11px' }}>
                              {log.bmiStatus}
                            </span>
                          ) : '-'}
                        </td>
                        <td style={{ maxWidth: "320px" }}>
                          {log.dietChart && (
                            <p className="mb-1 text-truncate small" style={{ whiteSpace: "normal", display: "-webkit-box", WebkitLineClamp: "2", WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                              <strong>Diet:</strong> {log.dietChart}
                            </p>
                          )}
                          {log.notes && (
                            <p className="mb-1 text-muted small text-truncate" style={{ whiteSpace: "normal", display: "-webkit-box", WebkitLineClamp: "1", WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                              {log.notes}
                            </p>
                          )}
                          <button 
                            className="btn btn-link btn-sm p-0 text-decoration-none fw-bold" 
                            style={{ color: "#2f6a87", fontSize: '12px' }}
                            onClick={() => openModal(log)}
                          >
                            View More Details →
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="6" className="text-center py-5 text-muted">No health logs found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal for Full Details */}
      {showModal && selectedLog && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content" style={{ borderRadius: "15px", border: "none" }}>
              <div className="modal-header border-bottom-0 pb-0">
                <h5 className="modal-title fw-bold" style={{ color: "#2f6a87" }}>Health Record Details</h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <div className="modal-body">
                <div className="row mb-3 g-2 bg-light p-3 rounded-3 text-center">
                  <div className="col-4 col-md-3">
                    <p className="text-muted mb-0 small text-uppercase fw-bold">Date</p>
                    <h6 className="fw-bold fs-6 text-dark mb-0">{new Date(selectedLog.recordedAt || selectedLog.createdAt || new Date()).toLocaleDateString()}</h6>
                  </div>
                  <div className="col-4 col-md-3">
                    <p className="text-muted mb-0 small text-uppercase fw-bold">Weight</p>
                    <h6 className="fw-bold fs-6 text-dark mb-0">{selectedLog.weight || '-'} kg</h6>
                  </div>
                  <div className="col-4 col-md-3">
                    <p className="text-muted mb-0 small text-uppercase fw-bold">Height</p>
                    <h6 className="fw-bold fs-6 text-dark mb-0">{selectedLog.height || '-'} cm</h6>
                  </div>
                  <div className="col-6 col-md-3 mt-2 mt-md-0">
                    <p className="text-muted mb-0 small text-uppercase fw-bold">BMI & Status</p>
                    <h6 className="fw-bold fs-6 text-dark mb-0">
                      {selectedLog.bmi || '-'} {' '}
                      {selectedLog.bmiStatus && (
                        <span className={`badge ${getStatusBadgeClass(selectedLog.bmiStatus)}`} style={{ fontSize: '10px' }}>
                          {selectedLog.bmiStatus}
                        </span>
                      )}
                    </h6>
                  </div>
                </div>
                
                <div className="p-3 border rounded-3">
                  <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">Diet & Notes</h6>
                  {selectedLog.dietChart ? (
                    <div className="mb-3">
                      <p className="mb-0 text-dark" style={{ whiteSpace: "pre-wrap", lineHeight: "1.6", fontSize: '14px' }}>{selectedLog.dietChart}</p>
                    </div>
                  ) : (
                    <p className="text-muted fst-italic mb-2">No custom diet chart attached.</p>
                  )}
                  
                  {selectedLog.notes && (
                    <div className="mt-3 pt-3 border-top">
                      <p className="text-muted mb-0 small"><strong className="text-dark">Trainer Notes / Goal:</strong> {selectedLog.notes}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer border-top-0">
                <button type="button" className="btn text-white px-4 rounded-pill" style={{ backgroundColor: "#2f6a87" }} onClick={closeModal}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberHealthLog;
