import React, { useState, useEffect, useRef } from "react";
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
  faUser,
  faSearch,
  faCheckCircle,
  faTimesCircle,
  faRunning,
  faDumbbell,
  faCalendarAlt,
  faUtensils,
  faTrophy,
  faHeartbeat,
  faCreditCard,
  faChartLine,
  faTrash
} from "@fortawesome/free-solid-svg-icons";

// ── Category Config ──────────────────────────────────────────────────────────
const CATEGORIES = [
  { key: "Attendance Update",           icon: faCalendarAlt, color: "#3b82f6" },
  { key: "Body Transformation Progress",icon: faChartLine,   color: "#8b5cf6" },
  { key: "Payment Reminder",            icon: faCreditCard,  color: "#ef4444" },
  { key: "Diet Plan",                   icon: faUtensils,    color: "#f59e0b" },
  { key: "Exercise Routine",            icon: faDumbbell,    color: "#10b981" },
  { key: "Class Schedule",              icon: faRunning,     color: "#06b6d4" },
  { key: "Fitness Assessment",          icon: faHeartbeat,   color: "#ec4899" },
  { key: "Personal Achievement",        icon: faTrophy,      color: "#f97316" },
];

// ── Group Broadcast Tab ───────────────────────────────────────────────────────
const GroupBroadcastTab = () => {
  const [subject, setSubject]               = useState("");
  const [message, setMessage]               = useState("");
  const [image, setImage]                   = useState(null);
  const [emailChannel, setEmailChannel]     = useState(true);
  const [whatsappChannel, setWhatsappChannel] = useState(false);
  const [appPushChannel, setAppPushChannel] = useState(true);
  const [targetMembers, setTargetMembers]   = useState(true);
  const [targetStaff, setTargetStaff]       = useState(false);
  const [history, setHistory]               = useState([]);
  const [loading, setLoading]               = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [statusMsg, setStatusMsg]           = useState({ type: "", text: "" });

  const fetchHistory = async () => {
    try {
      const res = await axiosInstance.get("notif/admin/broadcast/history");
      if (res.data?.success) setHistory(res.data.history || []);
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

  useEffect(() => { fetchHistory(); }, []);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    const channels = [];
    if (appPushChannel)   channels.push("APP_PUSH");
    if (emailChannel)     channels.push("EMAIL");
    if (whatsappChannel)  channels.push("WHATSAPP");
    const targetAudience = [];
    if (targetMembers) targetAudience.push("MEMBERS");
    if (targetStaff)   targetAudience.push("STAFF");

    if (!channels.length) return setStatusMsg({ type: "danger", text: "Please select at least one delivery channel!" });
    if (!targetAudience.length) return setStatusMsg({ type: "danger", text: "Please select at least one target audience!" });

    setLoading(true);
    setStatusMsg({ type: "", text: "" });
    try {
      const formData = new FormData();
      formData.append("subject", subject);
      formData.append("message", message);
      formData.append("channels", JSON.stringify(channels));
      formData.append("targetAudience", JSON.stringify(targetAudience));
      if (image) formData.append("image", image);

      const res = await axiosInstance.post("notif/admin/broadcast", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (res.data?.success) {
        setStatusMsg({ type: "success", text: `Success! Broadcasted to ${res.data.result?.totalTargeted || 0} user(s).` });
        setSubject(""); setMessage(""); setImage(null);
        fetchHistory();
      } else {
        setStatusMsg({ type: "danger", text: res.data?.message || "Failed to send." });
      }
    } catch (err) {
      setStatusMsg({ type: "danger", text: err.response?.data?.message || "Error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="row g-4">
      {/* Left: Form */}
      <div className="col-12 col-xl-5">
        <div className="card border-0 shadow-sm p-4 bg-white" style={{ borderRadius: "15px" }}>
          <h5 className="fw-bold mb-4" style={{ color: "#2d3748" }}>
            <FontAwesomeIcon icon={faPaperPlane} className="me-2 text-success" />
            Draft Announcement
          </h5>

          {statusMsg.text && (
            <div className={`alert alert-${statusMsg.type} alert-dismissible border-0 shadow-sm`} role="alert" style={{ borderRadius: "8px" }}>
              <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
              {statusMsg.text}
              <button type="button" className="btn-close" onClick={() => setStatusMsg({ type: "", text: "" })} />
            </div>
          )}

          <form onSubmit={handleBroadcast}>
            {/* Target Audience */}
            <div className="mb-4">
              <label className="form-label fw-bold d-block text-secondary mb-2">Target Audience</label>
              <div className="d-flex gap-3 flex-wrap">
                {[
                  { id: "roleMembers", checked: targetMembers, onChange: setTargetMembers, icon: faUsers, color: "success", label: "All Members" },
                  { id: "roleStaff", checked: targetStaff, onChange: setTargetStaff, icon: faUserTie, color: "info", label: "All Staff" },
                ].map(({ id, checked, onChange, icon, color, label }) => (
                  <div key={id} className="form-check p-3 border rounded shadow-sm flex-grow-1"
                    style={{ minWidth: "140px", backgroundColor: "#f8fafc", borderColor: checked ? "#198754" : "#e2e8f0", cursor: "pointer" }}
                    onClick={() => onChange(!checked)}>
                    <input className="form-check-input" type="checkbox" id={id} checked={checked} readOnly style={{ cursor: "pointer" }} />
                    <label className="form-check-label fw-semibold text-secondary ms-1" htmlFor={id} style={{ cursor: "pointer" }}>
                      <FontAwesomeIcon icon={icon} className={`me-2 text-${color}`} />{label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Channels */}
            <div className="mb-4">
              <label className="form-label fw-bold d-block text-secondary mb-2">Delivery Channels</label>
              <div className="d-flex gap-2 flex-column">
                {[
                  { id: "chanApp", checked: appPushChannel, onChange: setAppPushChannel, icon: faBell, color: "text-primary", label: "In-App Dashboard Banner" },
                  { id: "chanEmail", checked: emailChannel, onChange: setEmailChannel, icon: faEnvelope, color: "text-warning", label: "Email Broadcast" },
                  { id: "chanWhatsApp", checked: whatsappChannel, onChange: setWhatsappChannel, icon: faCommentsSolid, color: "text-success", label: "WhatsApp Notification" },
                ].map(({ id, checked, onChange, icon, color, label }) => (
                  <div key={id} className="form-check form-switch p-2 ps-5 border rounded bg-light">
                    <input className="form-check-input" type="checkbox" role="switch" id={id} checked={checked} onChange={e => onChange(e.target.checked)} />
                    <label className="form-check-label fw-semibold" htmlFor={id}>
                      <FontAwesomeIcon icon={icon} className={`me-2 ${color}`} />{label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Subject */}
            <div className="mb-3">
              <label htmlFor="subject" className="form-label fw-bold text-secondary">Announcement Subject</label>
              <input type="text" className="form-control border-2 shadow-sm" id="subject"
                placeholder="e.g. Gym closed tomorrow / Christmas Offer"
                value={subject} onChange={e => setSubject(e.target.value)} required style={{ borderRadius: "8px" }} />
            </div>

            {/* Message */}
            <div className="mb-4">
              <label htmlFor="message" className="form-label fw-bold text-secondary">Message Content</label>
              <textarea className="form-control border-2 shadow-sm" id="message" rows="4"
                placeholder="Write notice details, updates, or offers here..."
                value={message} onChange={e => setMessage(e.target.value)} required style={{ borderRadius: "8px", resize: "none" }} />
            </div>

            {/* Optional Image */}
            <div className="mb-4">
              <label htmlFor="image" className="form-label fw-bold text-secondary">Attach Image / PDF (Optional)</label>
              <input type="file" className="form-control shadow-sm" id="image" accept="image/*,application/pdf"
                onChange={e => setImage(e.target.files[0])} style={{ borderRadius: "8px" }} />
            </div>

            <button type="submit" className="btn btn-lg w-100 text-white shadow"
              disabled={loading} style={{ backgroundColor: "#198754", borderRadius: "8px", fontWeight: "600" }}>
              {loading ? (
                <><span className="spinner-border spinner-border-sm me-2" role="status" />{" "}Broadcasting...</>
              ) : (
                <><FontAwesomeIcon icon={faPaperPlane} className="me-2" />Broadcast Announcement</>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Right: History */}
      <div className="col-12 col-xl-7">
        <div className="card border-0 shadow-sm p-4 bg-white" style={{ borderRadius: "15px", minHeight: "500px" }}>
          <h5 className="fw-bold mb-4" style={{ color: "#2d3748" }}>
            <FontAwesomeIcon icon={faHistory} className="me-2 text-success" />Broadcast History
          </h5>
          {historyLoading ? (
            <div className="d-flex align-items-center justify-content-center" style={{ height: "300px" }}>
              <div className="spinner-border text-success" role="status" style={{ width: "3rem", height: "3rem" }} />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <FontAwesomeIcon icon={faBullhorn} size="3x" className="mb-3" />
              <h6>No Broadcasts Sent Yet</h6>
              <p className="small">Draft your first announcement above.</p>
            </div>
          ) : (
            <div className="table-responsive" style={{ maxHeight: "450px", overflowY: "auto" }}>
              <table className="table table-hover align-middle">
                <thead className="bg-light">
                  <tr>
                    <th className="fw-semibold text-secondary small">Date</th>
                    <th className="fw-semibold text-secondary small">Subject</th>
                    <th className="fw-semibold text-secondary small">Audience</th>
                    <th className="fw-semibold text-secondary small">Channels</th>
                    <th className="fw-semibold text-secondary small text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(ann => (
                    <tr key={ann.id}>
                      <td style={{ fontSize: "11px", whiteSpace: "nowrap" }}>
                        {new Date(ann.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td>
                        <div className="fw-bold text-dark small">{ann.subject}</div>
                        <small className="text-muted d-block" style={{ fontSize: "10px" }}>
                          {ann.message?.length > 60 ? ann.message.slice(0, 60) + "..." : ann.message}
                        </small>
                        {ann.imageUrl && (
                          <a href={ann.imageUrl} target="_blank" rel="noreferrer" className="badge bg-info text-decoration-none mt-1 d-inline-block" style={{ fontSize: "9px" }}>
                            📎 View Attachment
                          </a>
                        )}
                      </td>
                      <td>
                        {ann.targetRoles?.map((role, i) => (
                          <span key={i} className={`badge rounded-pill me-1 bg-${role === "MEMBERS" ? "success" : "info"}`} style={{ fontSize: "9px" }}>{role}</span>
                        ))}
                      </td>
                      <td>
                        <div className="d-flex gap-1 flex-wrap">
                          {ann.channels?.map((ch, i) => (
                            <span key={i} className="badge bg-secondary rounded-pill" style={{ fontSize: "9px" }}>
                              {ch === "EMAIL" ? "Email" : ch === "WHATSAPP" ? "WhatsApp" : "In-App"}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="text-end">
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
  );
};

// ── Personal Message Tab ──────────────────────────────────────────────────────
const PersonalMessageTab = () => {
  const [searchQuery, setSearchQuery]       = useState("");
  const [searchResults, setSearchResults]   = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [message, setMessage]               = useState("");
  const [appPush, setAppPush]               = useState(true);
  const [whatsapp, setWhatsapp]             = useState(false);
  const [loading, setLoading]               = useState(false);
  const [searchLoading, setSearchLoading]   = useState(false);
  const [statusMsg, setStatusMsg]           = useState({ type: "", text: "" });
  const [showDropdown, setShowDropdown]     = useState(false);
  const [history, setHistory]               = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const searchRef                           = useRef();
  const debounceRef                         = useRef();

  // Live search with debounce
  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); setShowDropdown(false); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await axiosInstance.get(`/member/search?q=${encodeURIComponent(searchQuery)}&limit=8`);
        const members = res.data?.members || res.data?.data || [];
        setSearchResults(members);
        setShowDropdown(true);
      } catch (err) {
        console.error("Member search error:", err);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 350);
  }, [searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowDropdown(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchPersonalHistory = async () => {
    try {
      const res = await axiosInstance.get("/notif/personal/history");
      if (res.data?.success) setHistory(res.data.history || []);
    } catch { /* silently fail */ } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => { fetchPersonalHistory(); }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!selectedMember) return setStatusMsg({ type: "danger", text: "Please select a member!" });
    if (!selectedCategory) return setStatusMsg({ type: "danger", text: "Please select a notification category!" });
    if (!message.trim()) return setStatusMsg({ type: "danger", text: "Please write a message!" });

    setLoading(true);
    setStatusMsg({ type: "", text: "" });
    try {
      const res = await axiosInstance.post("/notif/personal", {
        memberId: selectedMember.id,
        category: selectedCategory,
        message,
        channels: [
          ...(appPush ? ["APP_PUSH"] : []),
          ...(whatsapp ? ["WHATSAPP"] : [])
        ]
      });
      if (res.data?.success) {
        setStatusMsg({ type: "success", text: `✅ Notification sent to ${selectedMember.fullName} successfully!` });
        setSelectedMember(null); setSearchQuery(""); setSelectedCategory(null); setMessage("");
        fetchPersonalHistory();
      } else {
        setStatusMsg({ type: "danger", text: res.data?.message || "Failed to send." });
      }
    } catch (err) {
      setStatusMsg({ type: "danger", text: err.response?.data?.message || "Error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="row g-4">
      {/* Left: Compose */}
      <div className="col-12 col-xl-5">
        <div className="card border-0 shadow-sm p-4 bg-white" style={{ borderRadius: "15px" }}>
          <h5 className="fw-bold mb-1" style={{ color: "#2d3748" }}>
            <FontAwesomeIcon icon={faUser} className="me-2 text-primary" />
            Send Personal Notification
          </h5>
          <p className="text-muted small mb-4">Send a personalized message to a specific member.</p>

          {statusMsg.text && (
            <div className={`alert alert-${statusMsg.type} alert-dismissible border-0 shadow-sm`} role="alert" style={{ borderRadius: "8px" }}>
              {statusMsg.text}
              <button type="button" className="btn-close" onClick={() => setStatusMsg({ type: "", text: "" })} />
            </div>
          )}

          <form onSubmit={handleSend}>
            {/* Step 1: Member Search */}
            <div className="mb-4">
              <label className="form-label fw-bold text-secondary">
                <span className="badge bg-primary rounded-circle me-2" style={{ fontSize: "11px" }}>1</span>
                Select Member
              </label>
              <div className="position-relative" ref={searchRef}>
                <div className="input-group shadow-sm">
                  <span className="input-group-text bg-white border-end-0">
                    {searchLoading
                      ? <span className="spinner-border spinner-border-sm text-primary" />
                      : <FontAwesomeIcon icon={faSearch} className="text-muted" />}
                  </span>
                  <input type="text" className="form-control border-start-0 ps-0"
                    placeholder="Type member name to search..."
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setSelectedMember(null); }}
                    style={{ borderRadius: "0 8px 8px 0" }}
                    autoComplete="off"
                  />
                </div>

                {/* Dropdown */}
                {showDropdown && (
                  <div className="position-absolute w-100 bg-white border rounded shadow-lg mt-1" style={{ zIndex: 1000, maxHeight: "220px", overflowY: "auto" }}>
                    {searchResults.length === 0 ? (
                      <div className="p-3 text-center text-muted small">No members found</div>
                    ) : searchResults.map(m => (
                      <div key={m.id} className="d-flex align-items-center gap-2 px-3 py-2 border-bottom"
                        style={{ cursor: "pointer", transition: "background 0.15s" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#f0f9ff"}
                        onMouseLeave={e => e.currentTarget.style.background = "white"}
                        onClick={() => { setSelectedMember(m); setSearchQuery(m.fullName); setShowDropdown(false); }}>
                        <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white fw-bold"
                          style={{ width: "34px", height: "34px", fontSize: "13px", flexShrink: 0 }}>
                          {m.fullName?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="fw-semibold small text-dark">{m.fullName}</div>
                          <div className="text-muted" style={{ fontSize: "11px" }}>{m.email || m.phone}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected badge */}
              {selectedMember && (
                <div className="mt-2 d-flex align-items-center gap-2 p-2 rounded border border-success bg-light">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-success" />
                  <span className="small fw-semibold">{selectedMember.fullName}</span>
                  <button type="button" className="btn btn-sm ms-auto p-0 text-muted"
                    onClick={() => { setSelectedMember(null); setSearchQuery(""); }}>
                    <FontAwesomeIcon icon={faTimesCircle} />
                  </button>
                </div>
              )}
            </div>

            {/* Step 2: Category */}
            <div className="mb-4">
              <label className="form-label fw-bold text-secondary">
                <span className="badge bg-primary rounded-circle me-2" style={{ fontSize: "11px" }}>2</span>
                Notification Category
              </label>
              <div className="row g-2">
                {CATEGORIES.map(cat => (
                  <div key={cat.key} className="col-6">
                    <div className={`p-2 rounded border d-flex align-items-center gap-2`}
                      style={{
                        cursor: "pointer",
                        borderColor: selectedCategory === cat.key ? cat.color : "#e2e8f0",
                        backgroundColor: selectedCategory === cat.key ? cat.color + "15" : "#f8fafc",
                        transition: "all 0.15s"
                      }}
                      onClick={() => setSelectedCategory(cat.key)}>
                      <FontAwesomeIcon icon={cat.icon} style={{ color: cat.color, fontSize: "14px", flexShrink: 0 }} />
                      <span style={{ fontSize: "11px", fontWeight: selectedCategory === cat.key ? "700" : "500", color: "#374151", lineHeight: 1.2 }}>
                        {cat.key}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 3: Message */}
            <div className="mb-4">
              <label className="form-label fw-bold text-secondary">
                <span className="badge bg-primary rounded-circle me-2" style={{ fontSize: "11px" }}>3</span>
                Personalized Message
              </label>
              <textarea className="form-control shadow-sm" rows="4"
                placeholder={selectedCategory
                  ? `Write your ${selectedCategory.toLowerCase()} message here...`
                  : "First select a category, then write your message here..."}
                value={message} onChange={e => setMessage(e.target.value)}
                style={{ borderRadius: "8px", resize: "none" }} />
            </div>

            {/* Delivery Channels */}
            <div className="mb-4">
              <label className="form-label fw-bold text-secondary small">Delivery Channels</label>
              <div className="d-flex gap-3 flex-wrap">
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" role="switch" id="pAppPush"
                    checked={appPush} onChange={e => setAppPush(e.target.checked)} />
                  <label className="form-check-label small fw-semibold" htmlFor="pAppPush">
                    <FontAwesomeIcon icon={faBell} className="me-1 text-primary" /> In-App
                  </label>
                </div>
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" role="switch" id="pWhatsapp"
                    checked={whatsapp} onChange={e => setWhatsapp(e.target.checked)} />
                  <label className="form-check-label small fw-semibold" htmlFor="pWhatsapp">
                    <FontAwesomeIcon icon={faCommentsSolid} className="me-1 text-success" /> WhatsApp
                    <span className="badge bg-warning text-dark ms-1" style={{ fontSize: "9px" }}>Coming Soon</span>
                  </label>
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-lg w-100 text-white shadow"
              disabled={loading} style={{ backgroundColor: "#2563eb", borderRadius: "8px", fontWeight: "600" }}>
              {loading ? (
                <><span className="spinner-border spinner-border-sm me-2" />Sending...</>
              ) : (
                <><FontAwesomeIcon icon={faPaperPlane} className="me-2" />Send Personal Notification</>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Right: History */}
      <div className="col-12 col-xl-7">
        <div className="card border-0 shadow-sm p-4 bg-white" style={{ borderRadius: "15px", minHeight: "500px" }}>
          <h5 className="fw-bold mb-4" style={{ color: "#2d3748" }}>
            <FontAwesomeIcon icon={faHistory} className="me-2 text-primary" />Personal Notification History
          </h5>
          {historyLoading ? (
            <div className="d-flex align-items-center justify-content-center" style={{ height: "300px" }}>
              <div className="spinner-border text-primary" role="status" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <FontAwesomeIcon icon={faUser} size="3x" className="mb-3 text-primary opacity-25" />
              <h6>No Personal Notifications Sent Yet</h6>
              <p className="small">Use the form to send your first personal notification.</p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3" style={{ maxHeight: "450px", overflowY: "auto" }}>
              {history.map(h => {
                const cat = CATEGORIES.find(c => c.key === h.category) || CATEGORIES[0];
                return (
                  <div key={h.id} className="d-flex gap-3 p-3 border rounded-3 bg-light align-items-start">
                    <div className="rounded-circle d-flex align-items-center justify-content-center text-white"
                      style={{ width: "38px", height: "38px", backgroundColor: cat.color, flexShrink: 0, fontSize: "14px" }}>
                      <FontAwesomeIcon icon={cat.icon} />
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <span className="fw-bold small text-dark">{h.memberName || `Member #${h.memberId}`}</span>
                          <span className="badge rounded-pill ms-2" style={{ backgroundColor: cat.color + "25", color: cat.color, fontSize: "9px" }}>
                            {h.category}
                          </span>
                        </div>
                        <small className="text-muted" style={{ fontSize: "10px", whiteSpace: "nowrap" }}>
                          {new Date(h.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </small>
                      </div>
                      <p className="mb-0 small text-secondary mt-1" style={{ lineHeight: "1.4" }}>
                        {h.message?.length > 100 ? h.message.slice(0, 100) + "..." : h.message}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main Component ───────────────────────────────────────────────────────────
const AdminAnnouncements = () => {
  const [activeTab, setActiveTab] = useState("group");

  const tabs = [
    { key: "group",    label: "Group Broadcast",    icon: faBullhorn, color: "#198754" },
    { key: "personal", label: "Personal Message",   icon: faUser,     color: "#2563eb" },
  ];

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <div className="p-3 rounded-circle text-white d-flex align-items-center justify-content-center shadow"
          style={{ backgroundColor: activeTab === "group" ? "#198754" : "#2563eb", width: "60px", height: "60px", transition: "background 0.3s" }}>
          <FontAwesomeIcon icon={activeTab === "group" ? faBullhorn : faUser} size="lg" />
        </div>
        <div>
          <h2 className="fw-bold mb-0" style={{ color: "#2d3748" }}>Announcements & Notifications</h2>
          <p className="text-muted mb-0">Broadcast to all members or send personalized messages.</p>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="d-flex gap-2 mb-4">
        {tabs.map(tab => (
          <button key={tab.key} type="button"
            className={`btn d-flex align-items-center gap-2 px-4 py-2 shadow-sm`}
            style={{
              borderRadius: "10px",
              fontWeight: "600",
              fontSize: "14px",
              backgroundColor: activeTab === tab.key ? tab.color : "white",
              color: activeTab === tab.key ? "white" : "#6b7280",
              border: `2px solid ${activeTab === tab.key ? tab.color : "#e5e7eb"}`,
              transition: "all 0.2s ease"
            }}
            onClick={() => setActiveTab(tab.key)}>
            <FontAwesomeIcon icon={tab.icon} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "group"    && <GroupBroadcastTab />}
      {activeTab === "personal" && <PersonalMessageTab />}
    </div>
  );
};

export default AdminAnnouncements;
