import React, { useState, useEffect } from "react";
import axiosInstance from "../../Api/axiosInstance";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faBullhorn, 
  faPaperPlane, 
  faHistory, 
  faEnvelope, 
  faComments as faCommentsSolid, 
  faBell, 
  faUsers, 
  faUserTie, 
  faInfoCircle,
  faTrash
} from "@fortawesome/free-solid-svg-icons";

const Announcements = () => {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  
  // Channels selection
  const [emailChannel, setEmailChannel] = useState(true);
  const [whatsappChannel, setWhatsappChannel] = useState(true);
  const [appPushChannel, setAppPushChannel] = useState(true);
  
  // Target roles selection
  const [targetOwner, setTargetOwner] = useState(true); // Role 2 (Admin)
  const [targetSubadmin, setTargetSubadmin] = useState(false); // Role 9 (Subadmin)
  const [image, setImage] = useState(null);

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  const fetchHistory = async () => {
    try {
      const res = await axiosInstance.get("notif/broadcast/history");
      if (res.data?.success) {
        setHistory(res.data.history || []);
      }
    } catch (err) {
      console.error("Failed to load broadcast history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) return;
    try {
      const res = await axiosInstance.delete(`/notif/announcement/${id}`);
      if (res.data?.success) {
        fetchHistory();
      }
    } catch (err) {
      console.error("Failed to delete announcement:", err);
      alert(err.response?.data?.message || "Failed to delete announcement.");
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    
    // Construct channels array
    const channels = [];
    if (emailChannel) channels.push("EMAIL");
    if (whatsappChannel) channels.push("WHATSAPP");
    if (appPushChannel) channels.push("APP_PUSH");

    // Construct target roles
    const targetRoles = [];
    if (targetOwner) targetRoles.push(2);
    if (targetSubadmin) targetRoles.push(9);

    if (channels.length === 0) {
      setStatusMsg({ type: "danger", text: "Please select at least one delivery channel!" });
      return;
    }

    if (targetRoles.length === 0) {
      setStatusMsg({ type: "danger", text: "Please select at least one target audience!" });
      return;
    }

    setLoading(true);
    setStatusMsg({ type: "", text: "" });

    try {
      const formData = new FormData();
      formData.append("subject", subject);
      formData.append("message", message);
      formData.append("channels", JSON.stringify(channels));
      formData.append("targetRoles", JSON.stringify(targetRoles));
      if (image) formData.append("image", image);

      const res = await axiosInstance.post("notif/broadcast", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (res.data?.success) {
        setStatusMsg({ 
          type: "success", 
          text: `Success! Notice broadcasted to ${res.data.result?.totalTargeted || 0} user(s) successfully.` 
        });
        setSubject("");
        setMessage("");
        setImage(null);
        // Reset file input element manually
        const fileInput = document.getElementById("image");
        if (fileInput) fileInput.value = "";
        // Reload history
        fetchHistory();
      } else {
        setStatusMsg({ type: "danger", text: res.data?.message || "Failed to send notice." });
      }
    } catch (err) {
      console.error(err);
      setStatusMsg({ 
        type: "danger", 
        text: err.response?.data?.message || "Error occurred during broadcast. Please try again." 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid py-4" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Title Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex align-items-center gap-3">
            <div className="p-3 rounded-circle text-white d-flex align-items-center justify-content-center shadow" 
                 style={{ backgroundColor: "#6EB2CC", width: "60px", height: "60px" }}>
              <FontAwesomeIcon icon={faBullhorn} size="lg" />
            </div>
            <div>
              <h2 className="fw-bold mb-0" style={{ color: "#2d3748" }}>Super Admin Broadcast</h2>
              <p className="text-muted mb-0">Send notices, updates, or offers system-wide to all gym owners and sub-admins instantly.</p>
            </div>
          </div>
        </div>
      </div>

      {statusMsg.text && (
        <div className={`alert alert-${statusMsg.type} alert-dismissible fade show shadow-sm border-0`} role="alert" style={{ borderRadius: "10px" }}>
          <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
          {statusMsg.text}
          <button type="button" className="btn-close" onClick={() => setStatusMsg({ type: "", text: "" })}></button>
        </div>
      )}

      <div className="row g-4">
        {/* Left: Compose Form */}
        <div className="col-12 col-xl-5">
          <div className="card border-0 shadow-sm p-4 bg-white" style={{ borderRadius: "15px" }}>
            <h4 className="fw-bold mb-4" style={{ color: "#2d3748" }}>
              <FontAwesomeIcon icon={faPaperPlane} className="me-2" style={{ color: "#6EB2CC" }} />
              Draft Announcement
            </h4>

            <form onSubmit={handleBroadcast}>
              {/* Target Audience */}
              <div className="mb-4">
                <label className="form-label fw-bold d-block text-secondary mb-2">Target Audience</label>
                <div className="d-flex gap-3 flex-wrap">
                  <div className="form-check form-check-inline p-3 border rounded shadow-sm flex-grow-1" 
                       style={{ minWidth: "160px", backgroundColor: "#f8fafc", borderColor: targetOwner ? "#6EB2CC" : "#e2e8f0" }}>
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      id="roleOwner" 
                      checked={targetOwner} 
                      onChange={(e) => setTargetOwner(e.target.checked)}
                      style={{ cursor: "pointer" }}
                    />
                    <label className="form-check-label fw-semibold text-secondary" htmlFor="roleOwner" style={{ cursor: "pointer" }}>
                      <FontAwesomeIcon icon={faUserTie} className="me-2 text-primary" />
                      Gym Owners
                    </label>
                  </div>
                  <div className="form-check form-check-inline p-3 border rounded shadow-sm flex-grow-1" 
                       style={{ minWidth: "160px", backgroundColor: "#f8fafc", borderColor: targetSubadmin ? "#6EB2CC" : "#e2e8f0" }}>
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      id="roleSubadmin" 
                      checked={targetSubadmin} 
                      onChange={(e) => setTargetSubadmin(e.target.checked)}
                      style={{ cursor: "pointer" }}
                    />
                    <label className="form-check-label fw-semibold text-secondary" htmlFor="roleSubadmin" style={{ cursor: "pointer" }}>
                      <FontAwesomeIcon icon={faUsers} className="me-2 text-info" />
                      Sub-Admins
                    </label>
                  </div>
                </div>
              </div>

              {/* Delivery Channels */}
              <div className="mb-4">
                <label className="form-label fw-bold d-block text-secondary mb-2">Delivery Channels</label>
                <div className="d-flex gap-2 flex-column">
                  <div className="form-check form-switch p-2 ps-5 border rounded bg-light">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      role="switch" 
                      id="chanEmail" 
                      checked={emailChannel} 
                      onChange={(e) => setEmailChannel(e.target.checked)}
                    />
                    <label className="form-check-label fw-semibold" htmlFor="chanEmail">
                      <FontAwesomeIcon icon={faEnvelope} className="me-2 text-warning" />
                      Email Broadcast
                    </label>
                  </div>

                  <div className="form-check form-switch p-2 ps-5 border rounded bg-light">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      role="switch" 
                      id="chanWhatsApp" 
                      checked={whatsappChannel} 
                      onChange={(e) => setWhatsappChannel(e.target.checked)}
                    />
                    <label className="form-check-label fw-semibold" htmlFor="chanWhatsApp">
                      <FontAwesomeIcon icon={faCommentsSolid} className="me-2 text-success" />
                      WhatsApp Notification
                    </label>
                  </div>

                  <div className="form-check form-switch p-2 ps-5 border rounded bg-light">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      role="switch" 
                      id="chanApp" 
                      checked={appPushChannel} 
                      onChange={(e) => setAppPushChannel(e.target.checked)}
                    />
                    <label className="form-check-label fw-semibold" htmlFor="chanApp">
                      <FontAwesomeIcon icon={faBell} className="me-2 text-primary" />
                      In-App Dashboard Notification
                    </label>
                  </div>
                </div>
              </div>

              {/* Subject */}
              <div className="mb-3">
                <label htmlFor="subject" className="form-label fw-bold text-secondary">Announcement Subject</label>
                <input 
                  type="text" 
                  className="form-control form-control-lg border-2 shadow-sm" 
                  id="subject" 
                  placeholder="e.g. Software Update v2.5 / Special Diwali Offer" 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required 
                  style={{ borderRadius: "8px" }}
                />
              </div>

              {/* Message */}
              <div className="mb-4">
                <label htmlFor="message" className="form-label fw-bold text-secondary">Message Content</label>
                <textarea 
                  className="form-control border-2 shadow-sm" 
                  id="message" 
                  rows="6" 
                  placeholder="Write notice details, updates, or offers here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  style={{ borderRadius: "8px", resize: "none" }}
                ></textarea>
              </div>

              {/* Attach Image / PDF */}
              <div className="mb-4">
                <label htmlFor="image" className="form-label fw-bold text-secondary">Attach Image / PDF (Optional)</label>
                <input 
                  type="file" 
                  className="form-control shadow-sm" 
                  id="image" 
                  accept="image/*,application/pdf"
                  onChange={e => setImage(e.target.files[0])} 
                  style={{ borderRadius: "8px" }} 
                />
              </div>

              {/* Action Button */}
              <button 
                type="submit" 
                className="btn btn-lg w-100 text-white shadow" 
                disabled={loading}
                style={{ 
                  backgroundColor: "#6EB2CC", 
                  borderRadius: "8px", 
                  fontWeight: "600",
                  transition: "all 0.2s ease" 
                }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Broadcasting to target users...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faPaperPlane} className="me-2" />
                    Broadcast Notice System-Wide
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right: Broadcast History */}
        <div className="col-12 col-xl-7">
          <div className="card border-0 shadow-sm p-4 bg-white" style={{ borderRadius: "15px", minHeight: "600px" }}>
            <h4 className="fw-bold mb-4" style={{ color: "#2d3748" }}>
              <FontAwesomeIcon icon={faHistory} className="me-2" style={{ color: "#6EB2CC" }} />
              Broadcast History
            </h4>

            {historyLoading ? (
              <div className="d-flex flex-column align-items-center justify-content-center py-5" style={{ height: "400px" }}>
                <div className="spinner-border text-info mb-3" role="status" style={{ width: "3rem", height: "3rem" }}></div>
                <p className="text-muted fw-semibold">Loading broadcast history logs...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="d-flex flex-column align-items-center justify-content-center text-center py-5" style={{ height: "400px" }}>
                <div className="p-4 rounded-circle mb-3 bg-light text-muted">
                  <FontAwesomeIcon icon={faBullhorn} size="3x" />
                </div>
                <h5 className="fw-bold text-secondary">No Broadcasts Sent Yet</h5>
                <p className="text-muted max-w-sm">Draft your first system-wide announcement using the panel on the left.</p>
              </div>
            ) : (
              <div className="table-responsive" style={{ maxHeight: "500px", overflowY: "auto", overflowX: "auto", position: "relative" }}>
                <table className="table table-hover align-middle" style={{ minWidth: "750px", tableLayout: "fixed", width: "100%" }}>
                  <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
                    <tr>
                      <th style={{ width: "140px", backgroundColor: "#f8fafc", color: "#4a5568", fontWeight: "600", borderBottom: "2px solid #e2e8f0" }}>Date & Time</th>
                      <th style={{ width: "230px", backgroundColor: "#f8fafc", color: "#4a5568", fontWeight: "600", borderBottom: "2px solid #e2e8f0" }}>Subject</th>
                      <th style={{ width: "110px", backgroundColor: "#f8fafc", color: "#4a5568", fontWeight: "600", borderBottom: "2px solid #e2e8f0" }}>Audience</th>
                      <th style={{ width: "160px", backgroundColor: "#f8fafc", color: "#4a5568", fontWeight: "600", borderBottom: "2px solid #e2e8f0" }}>Channels</th>
                      <th style={{ width: "110px", backgroundColor: "#f8fafc", color: "#4a5568", fontWeight: "600", borderBottom: "2px solid #e2e8f0" }}>Sender</th>
                      <th style={{ width: "80px", backgroundColor: "#f8fafc", color: "#4a5568", fontWeight: "600", borderBottom: "2px solid #e2e8f0", textAlign: "right" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((ann) => (
                      <tr key={ann.id}>
                        <td style={{ fontSize: "12px", whiteSpace: "nowrap" }}>
                          {new Date(ann.createdAt).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </td>
                        <td style={{ wordBreak: "break-word", whiteSpace: "normal" }}>
                          <div className="fw-bold text-dark" style={{ wordBreak: "break-word" }}>{ann.subject}</div>
                          <small className="text-muted d-block" style={{ fontSize: "11px", wordBreak: "break-word" }}>
                            {ann.message.length > 80 ? ann.message.slice(0, 80) + "..." : ann.message}
                          </small>
                          {ann.imageUrl && (
                            <a href={ann.imageUrl} target="_blank" rel="noreferrer" className="badge bg-info text-decoration-none mt-1 d-inline-block" style={{ fontSize: "9px" }}>
                              📎 View Attachment
                            </a>
                          )}
                        </td>
                        <td>
                          {ann.targetRoles.map((roleId, idx) => (
                            <span 
                              key={idx} 
                              className={`badge rounded-pill me-1 bg-${roleId === 2 ? 'primary' : 'info'}`} 
                              style={{ fontSize: "10px" }}
                            >
                              {roleId === 2 ? "Owners" : "Subadmins"}
                            </span>
                          ))}
                        </td>
                        <td>
                          <div className="d-flex gap-1 flex-wrap">
                            {ann.channels.map((chan, idx) => (
                              <span 
                                key={idx} 
                                className="badge bg-secondary rounded-pill" 
                                style={{ fontSize: "9px" }}
                              >
                                {chan === "EMAIL" && "Email"}
                                {chan === "WHATSAPP" && "WhatsApp"}
                                {chan === "APP_PUSH" && "In-App"}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td style={{ fontSize: "12px" }}>
                          {ann.senderName || "Superadmin"}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button 
                            className="btn btn-link text-danger p-1" 
                            onClick={() => handleDelete(ann.id)} 
                            title="Delete Broadcast"
                            style={{ fontSize: "14px" }}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
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
    </div>
  );
};

export default Announcements;
