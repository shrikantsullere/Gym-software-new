import React, { useState, useEffect } from "react";
import axiosInstance from "../../Api/axiosInstance";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEdit, faTrash, faPlus } from "@fortawesome/free-solid-svg-icons";
import { getCurrentStaffId } from "../../utils/staffUtils";

const TrainerHealthLog = () => {
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState("");
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editLogId, setEditLogId] = useState(null);
  
  const [viewLog, setViewLog] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const [formData, setFormData] = useState({
    weight: "",
    height: "",
    notes: "",
    dietChart: ""
  });

  const isPersonalTrainer = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const role = (user.roleName || "").toLowerCase().replace(/\s+/g, "");
    return Number(user.roleId) === 5 || role === 'personaltrainer';
  };

  const fetchMembers = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      
      let response;
      // If the user is a Personal Trainer, fetch only assigned members
      if (isPersonalTrainer()) {
        const staffId = getCurrentStaffId(user);
        response = await axiosInstance.get(`members/trainer/${staffId}`);
      } else {
        // General Trainers, Admins, etc. see ALL members
        const adminId = user.adminId || 90;
        response = await axiosInstance.get(`members/admin/${adminId}`);
      }
      
      if (response.data && response.data.success) {
        setMembers(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
    }
  };

  const fetchLogs = async (memberId = "") => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const adminId = user.adminId || 90;
      
      let endpoint;
      if (memberId) {
        // Show logs for a specific selected member
        endpoint = `health/member/${memberId}`;
      } else if (isPersonalTrainer()) {
        // Personal trainer: show logs for all their assigned members
        const staffId = getCurrentStaffId(user);
        endpoint = `health/trainer/${staffId}`;
      } else {
        // Admin / General trainer: show all logs
        endpoint = `health/all/${adminId}`;
      }
      
      const response = await axiosInstance.get(endpoint);
      if (response.data && response.data.logs) {
        setLogs(response.data.logs);
      }
    } catch (error) {
      console.error("Error fetching health logs:", error);
      // Fallback to admin endpoint on error
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const adminId = user.adminId || 90;
        const fallback = await axiosInstance.get(`health/all/${adminId}`);
        if (fallback.data && fallback.data.logs) setLogs(fallback.data.logs);
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
    fetchLogs(); // Fetch all logs initially
  }, []);

  const handleMemberChange = (e) => {
    const id = e.target.value;
    setSelectedMember(id);
    fetchLogs(id);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openAddModal = () => {
    if (!selectedMember) {
      alert("Please select a member first from the dropdown.");
      return;
    }
    setFormData({ weight: "", height: "", notes: "", dietChart: "" });
    setIsEditMode(false);
    setShowModal(true);
  };

  const openEditModal = (log) => {
    setFormData({
      weight: log.weight || "",
      height: log.height || "",
      notes: log.notes || "",
      dietChart: log.dietChart || ""
    });
    setEditLogId(log.id);
    setIsEditMode(true);
    setShowModal(true);
  };

  const openViewModal = (log) => {
    setViewLog(log);
    setShowViewModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this health record?")) {
      try {
        await axiosInstance.delete(`health/${id}`);
        fetchLogs(selectedMember);
      } catch (error) {
        console.error("Error deleting log:", error);
        alert("Failed to delete log.");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEditMode && !selectedMember) {
      alert("Please select a member first from the dropdown.");
      return;
    }
    
    try {
      setSubmitLoading(true);
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      
      if (isEditMode) {
        await axiosInstance.put(`health/${editLogId}`, formData);
        alert("Health log updated successfully!");
      } else {
        await axiosInstance.post("health", {
          memberId: selectedMember,
          trainerId: user.id || null,
          ...formData
        });
        alert("Health log added successfully!");
      }
      
      setShowModal(false);
      fetchLogs(selectedMember);
    } catch (error) {
      console.error("Error saving health log:", error);
      alert("Failed to save health log.");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 style={{ color: "#2B3674", fontWeight: "bold", margin: 0 }}>
          Health & BMI Management
        </h2>
      </div>

      <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: "15px" }}>
        <div className="card-header bg-white border-0 pt-4 pb-0 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div className="d-flex flex-column flex-sm-row align-items-sm-center w-100 flex-grow-1 me-md-3">
            <label className="form-label me-sm-3 fw-bold text-nowrap mb-2 mb-sm-0" style={{ color: "#4318FF" }}>Select Member:</label>
            <select className="form-select w-100" style={{maxWidth: '400px'}} value={selectedMember} onChange={handleMemberChange}>
              <option value="">-- Choose a member to view or add logs --</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.fullName} ({m.phone})</option>
              ))}
            </select>
          </div>
          <button 
            className="btn btn-primary flex-shrink-0 align-self-start align-self-md-auto" 
            style={{ background: "#4318FF", border: "none", borderRadius: "10px" }}
            onClick={openAddModal}
            disabled={!selectedMember}
          >
            <FontAwesomeIcon icon={faPlus} className="me-2" /> Add Health Record
          </button>
        </div>
        
        <div className="card-body mt-3">
          {loading ? (
            <div className="text-center py-4"><div className="spinner-border text-primary" /></div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle table-hover">
                <thead className="bg-light">
                  <tr>
                    <th>Date</th>
                    <th>Member Name</th>
                    <th>Weight</th>
                    <th>Height</th>
                    <th>BMI</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length > 0 ? (
                    logs.map((log) => (
                      <tr key={log.id}>
                        <td>{new Date(log.recordedAt || log.createdAt).toLocaleDateString()}</td>
                        <td className="fw-bold">{log.fullName || "Unknown"} <br/><small className="text-muted">{log.phone || ""}</small></td>
                        <td>{log.weight} kg</td>
                        <td>{log.height} cm</td>
                        <td className="fw-bold">{log.bmi}</td>
                        <td>
                          {log.bmiStatus || log.status ? (
                            <span className={`badge ${['Normal'].includes(log.bmiStatus || log.status) ? 'bg-success' : ['Underweight'].includes(log.bmiStatus || log.status) ? 'bg-warning' : 'bg-danger'}`}>
                              {log.bmiStatus || log.status}
                            </span>
                          ) : '-'}
                        </td>
                        <td>
                          <button className="btn btn-sm btn-outline-info me-2" onClick={() => openViewModal(log)} title="View Details">
                            <FontAwesomeIcon icon={faEye} />
                          </button>
                          <button className="btn btn-sm btn-outline-primary me-2" onClick={() => openEditModal(log)} title="Edit Record">
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(log.id)} title="Delete Record">
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="6" className="text-center py-4 text-muted">No logs available for this member. Click 'Add Health Record' to create one.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow" style={{ borderRadius: "15px" }}>
              <div className="modal-header border-0">
                <h5 className="modal-title fw-bold" style={{ color: "#2B3674" }}>
                  {isEditMode ? "Edit Health Record" : "Add New Health Record"}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Weight (kg)</label>
                      <input type="number" step="0.1" className="form-control" name="weight" value={formData.weight} onChange={handleChange} required />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Height (cm)</label>
                      <input type="number" step="0.1" className="form-control" name="height" value={formData.height} onChange={handleChange} required />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Diet Chart / Plan</label>
                    <textarea className="form-control" name="dietChart" rows="3" placeholder="Enter diet instructions..." value={formData.dietChart} onChange={handleChange}></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Notes (Optional)</label>
                    <textarea className="form-control" name="notes" rows="2" value={formData.notes} onChange={handleChange}></textarea>
                  </div>
                  <div className="d-flex justify-content-end mt-4">
                    <button type="button" className="btn btn-light me-2" onClick={() => setShowModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary px-4" style={{ background: "#4318FF", border: "none" }} disabled={submitLoading}>
                      {submitLoading ? "Saving..." : (isEditMode ? "Update Record" : "Save Record")}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewLog && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow" style={{ borderRadius: "15px" }}>
              <div className="modal-header border-0 pb-2">
                <h5 className="modal-title fw-bold" style={{ color: "#2B3674" }}>Health Record Details</h5>
                <button type="button" className="btn-close" onClick={() => setShowViewModal(false)}></button>
              </div>
              <div className="modal-body" style={{ maxHeight: "65vh", overflowY: "auto" }}>
                <div className="row mb-3">
                  <div className="col-6"><span className="text-muted">Date:</span> <br/> <strong>{new Date(viewLog.recordedAt || viewLog.createdAt).toLocaleDateString()}</strong></div>
                  <div className="col-6"><span className="text-muted">Status:</span> <br/> <strong>{viewLog.bmiStatus || viewLog.status || '-'}</strong></div>
                </div>
                <div className="row mb-3">
                  <div className="col-4"><span className="text-muted">Weight:</span> <br/> <strong>{viewLog.weight} kg</strong></div>
                  <div className="col-4"><span className="text-muted">Height:</span> <br/> <strong>{viewLog.height} cm</strong></div>
                  <div className="col-4"><span className="text-muted">BMI:</span> <br/> <strong>{viewLog.bmi}</strong></div>
                </div>
                <div className="mb-3">
                  <span className="text-muted">Diet Chart:</span>
                  <div className="p-3 bg-light rounded mt-1" style={{ whiteSpace: "pre-wrap" }}>
                    {viewLog.dietChart || "No diet chart provided."}
                  </div>
                </div>
                <div className="mb-2">
                  <span className="text-muted">Notes:</span>
                  <div className="p-3 bg-light rounded mt-1" style={{ whiteSpace: "pre-wrap" }}>
                    {viewLog.notes || "No additional notes."}
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0">
                <button type="button" className="btn btn-secondary w-100" onClick={() => setShowViewModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainerHealthLog;
