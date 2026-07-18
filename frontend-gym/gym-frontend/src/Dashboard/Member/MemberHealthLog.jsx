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
      if (!user.id) return;
      
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

  const truncateText = (text, maxLength = 80) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4" style={{ color: "#2B3674", fontWeight: "bold" }}>
        My Health & BMI Log
      </h2>

      <div className="card shadow-sm border-0" style={{ borderRadius: "15px" }}>
        <div className="card-header bg-white border-0 pt-4 pb-0">
          <h5 style={{ fontWeight: "600", color: "#4318FF" }}>Health History</h5>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-4"><div className="spinner-border text-primary" /></div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle">
                <thead className="bg-light">
                  <tr>
                    <th>Date</th>
                    <th>Weight (kg)</th>
                    <th>Height (cm)</th>
                    <th>BMI</th>
                    <th>Status</th>
                    <th>Diet / Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length > 0 ? (
                    logs.map((log) => (
                      <tr key={log.id}>
                        <td>{new Date(log.recordedAt || log.createdAt || new Date()).toLocaleDateString()}</td>
                        <td>{log.weight || '-'}</td>
                        <td>{log.height || '-'}</td>
                        <td className="fw-bold">{log.bmi || '-'}</td>
                        <td>
                          {log.bmiStatus && (
                            <span className={`badge ${log.bmiStatus === 'Normal' ? 'bg-success' : log.bmiStatus === 'Underweight' ? 'bg-warning' : 'bg-danger'}`}>
                              {log.bmiStatus}
                            </span>
                          )}
                        </td>
                        <td style={{ maxWidth: "300px" }}>
                          {log.dietChart && (
                            <p className="mb-1 text-truncate" style={{ whiteSpace: "normal", display: "-webkit-box", WebkitLineClamp: "2", WebkitBoxOrient: "vertical", overflow: "hidden" }}>
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
                            style={{ color: "#4318FF" }}
                            onClick={() => openModal(log)}
                          >
                            View More <i className="bi bi-arrow-right"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="6" className="text-center py-3">No health logs found.</td></tr>
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
          <div className="modal-dialog modal-dialog-centered modal-xl">
            <div className="modal-content" style={{ borderRadius: "15px", border: "none" }}>
              <div className="modal-header border-bottom-0 pb-0">
                <h5 className="modal-title fw-bold" style={{ color: "#2B3674" }}>Health Record Details</h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <div className="modal-body pb-0">
                <div className="row mb-2">
                  <div className="col-md-2 col-4 mb-2">
                    <p className="text-muted mb-0 small text-uppercase fw-bold">Date</p>
                    <h6 className="fw-bold fs-6">{new Date(selectedLog.recordedAt || selectedLog.createdAt || new Date()).toLocaleDateString()}</h6>
                  </div>
                  <div className="col-md-2 col-4 mb-2">
                    <p className="text-muted mb-0 small text-uppercase fw-bold">Weight</p>
                    <h6 className="fw-bold fs-6">{selectedLog.weight || '-'} kg</h6>
                  </div>
                  <div className="col-md-2 col-4 mb-2">
                    <p className="text-muted mb-0 small text-uppercase fw-bold">Height</p>
                    <h6 className="fw-bold fs-6">{selectedLog.height || '-'} cm</h6>
                  </div>
                  <div className="col-md-2 col-4 mb-2">
                    <p className="text-muted mb-0 small text-uppercase fw-bold">BMI</p>
                    <h6 className="fw-bold fs-6">{selectedLog.bmi || '-'}</h6>
                  </div>
                  <div className="col-md-4 col-8 mb-2">
                    <p className="text-muted mb-0 small text-uppercase fw-bold">Status</p>
                    {selectedLog.bmiStatus ? (
                      <span className={`badge ${selectedLog.bmiStatus === 'Normal' ? 'bg-success' : selectedLog.bmiStatus === 'Underweight' ? 'bg-warning' : 'bg-danger'}`}>
                        {selectedLog.bmiStatus}
                      </span>
                    ) : '-'}
                  </div>
                </div>
                
                <div className="bg-light p-4 rounded-3">
                  <h6 className="fw-bold text-dark border-bottom pb-2 mb-3"><i className="bi bi-card-text me-2"></i>Diet & Notes</h6>
                  {selectedLog.dietChart ? (
                    <div className="mb-3">
                      <p className="mb-0" style={{ whiteSpace: "pre-wrap", lineHeight: "1.6" }}>{selectedLog.dietChart}</p>
                    </div>
                  ) : (
                    <p className="text-muted fst-italic">No diet plan logged.</p>
                  )}
                  
                  {selectedLog.notes && (
                    <div className="mt-3 pt-3 border-top">
                      <p className="text-muted mb-0 small"><strong className="text-dark">Trainer Notes:</strong> {selectedLog.notes}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer border-top-0">
                <button type="button" className="btn text-white px-4" style={{ backgroundColor: "#2B3674", borderRadius: "8px" }} onClick={closeModal}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberHealthLog;
