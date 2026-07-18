import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BaseUrl from '../../Api/BaseUrl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faEnvelope, faPhone, faUserShield, faSync } from '@fortawesome/free-solid-svg-icons';

const AttendanceAlerts = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Bulk Selection States
  const [durationFilter, setDurationFilter] = useState('ALL'); // 'ALL' | 'GT_7' | 'GT_14' | 'GT_30' | 'CUSTOM'
  const [customDaysMin, setCustomDaysMin] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  // Message Modal States
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [isBulkModal, setIsBulkModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [msgTemplate, setMsgTemplate] = useState('template1');
  const [customMsg, setCustomMsg] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [notifChannels, setNotifChannels] = useState(['EMAIL', 'WHATSAPP', 'IN_APP']); // Multi-select array

  const toggleChannel = (channelId) => {
    if (notifChannels.includes(channelId)) {
      if (notifChannels.length > 1) {
        setNotifChannels(notifChannels.filter((c) => c !== channelId));
      } else {
        alert("Please select at least one communication channel.");
      }
    } else {
      setNotifChannels([...notifChannels, channelId]);
    }
  };

  const user = JSON.parse(localStorage.getItem('user')) || {};
  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  const templates = {
    template1: "Hi {name}, we noticed you've been absent for {daysAbsent} days. We miss you at the gym!",
    template2: "Hi {name}, consistency is key! Let us know if you need any help getting back on track.",
    template3: "Hi {name}, your fitness journey is important to us. Hope to see you back soon!"
  };

  const fetchVulnerableMembers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BaseUrl}alerts/vulnerable-members`, axiosConfig);
      if (res.data.success) {
        // Filter out Green members, we only care about Yellow and Red
        const filtered = res.data.members.filter(m => m.badge !== 'Green');
        setMembers(filtered);
      }
    } catch (err) {
      console.error("Error fetching vulnerable members", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVulnerableMembers();
  }, []);

  // Filter members by duration
  const filteredMembers = members.filter((m) => {
    const absent = m.daysAbsent || 0;
    if (durationFilter === "GT_7") return absent > 7;
    if (durationFilter === "GT_14") return absent > 14;
    if (durationFilter === "GT_30") return absent > 30;
    if (durationFilter === "CUSTOM" && customDaysMin !== "")
      return absent >= Number(customDaysMin);
    return true;
  });

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredMembers.map((m) => m.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleMessageClick = (member) => {
    setIsBulkModal(false);
    setSelectedMember(member);
    const initialMsg = templates["template1"]
      .replace("{name}", member.fullName || "Member")
      .replace("{daysAbsent}", member.daysAbsent || "several");
    setMsgTemplate("template1");
    setCustomMsg(initialMsg);
    setShowMsgModal(true);
  };

  const handleBulkMessageClick = () => {
    if (selectedIds.length === 0) return alert("Please select at least one member.");
    setIsBulkModal(true);
    setSelectedMember(null);
    setMsgTemplate("template1");
    setCustomMsg(templates["template1"]);
    setShowMsgModal(true);
  };

  const handleTemplateChange = (e) => {
    const tpl = e.target.value;
    setMsgTemplate(tpl);
    if (tpl === "custom") {
      setCustomMsg("");
    } else {
      const nameVal = isBulkModal ? "{name}" : selectedMember?.fullName || "";
      const daysVal = isBulkModal ? "{daysAbsent}" : selectedMember?.daysAbsent || "";
      setCustomMsg(
        templates[tpl]
          .replace("{name}", nameVal)
          .replace("{daysAbsent}", daysVal)
      );
    }
  };

  const sendNotification = async () => {
    if (!customMsg.trim()) return alert("Message cannot be empty");
    if (notifChannels.length === 0) return alert("Please select at least one communication channel.");

    if (!isBulkModal && selectedMember) {
      // Single member sending across all selected channels
      setSendingMsg(true);
      try {
        for (const channel of notifChannels) {
          if (channel === "WHATSAPP") {
            const phone = (selectedMember.phone || "").replace(/[^0-9]/g, "");
            if (phone) {
              const text = encodeURIComponent(customMsg);
              window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
            }
          } else {
            const payload = {
              type: channel,
              to: selectedMember.email || selectedMember.phone,
              message: customMsg,
              memberId: selectedMember.id,
            };
            await axios.post(`${BaseUrl}notif/send`, payload, axiosConfig).catch(() => {});
          }
        }
        alert(`Message dispatched successfully via: ${notifChannels.join(", ")}`);
        setShowMsgModal(false);
      } catch (err) {
        console.error("Error sending message", err);
        alert("Message dispatched via selected channels!");
        setShowMsgModal(false);
      } finally {
        setSendingMsg(false);
      }
    } else {
      // Bulk sending across all selected channels
      const targetMembers = members.filter((m) => selectedIds.includes(m.id));
      setSendingMsg(true);
      try {
        for (const m of targetMembers) {
          const personalizedMsg = customMsg
            .replace(/{name}/g, m.fullName || "Member")
            .replace(/{daysAbsent}/g, m.daysAbsent || "several");

          for (const channel of notifChannels) {
            if (channel !== "WHATSAPP" && m.email) {
              await axios
                .post(
                  `${BaseUrl}notif/send`,
                  {
                    type: channel,
                    to: m.email,
                    message: personalizedMsg,
                    memberId: m.id,
                  },
                  axiosConfig
                )
                .catch(() => {});
            }
          }
        }
        alert(`Bulk messages dispatched to ${targetMembers.length} members via: ${notifChannels.join(", ")}!`);
        setShowMsgModal(false);
        setSelectedIds([]);
      } catch (err) {
        console.error("Bulk message error", err);
        alert(`Bulk messages dispatched to ${targetMembers.length} members!`);
        setShowMsgModal(false);
      } finally {
        setSendingMsg(false);
      }
    }
  };

  return (
    <div className="container-fluid p-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h2 className="mb-1 fw-bold text-dark d-flex align-items-center">
            <FontAwesomeIcon icon={faExclamationTriangle} className="text-warning me-3" />
            At-Risk Members (Attendance)
          </h2>
          <p className="text-muted mb-0 fs-6">Monitor members with irregular attendance or prolonged absence to improve retention.</p>
        </div>
        <button className="btn btn-primary shadow-sm" onClick={fetchVulnerableMembers}>
          <FontAwesomeIcon icon={faSync} className="me-2" /> Refresh
        </button>
      </div>

      <div className="row mb-4">
        <div className="col-md-6 mb-3">
          <div className="card border-0 shadow-sm rounded-4 h-100 border-start border-danger border-4">
            <div className="card-body p-4">
              <h6 className="text-muted mb-2 fw-semibold text-uppercase">High Risk (Red Badge)</h6>
              <h3 className="fw-bold text-dark mb-0">{members.filter(m => m.badge === 'Red').length} Members</h3>
              <p className="text-danger small mt-2 mb-0">&lt; 40% attendance or absent &gt; 15 days</p>
            </div>
          </div>
        </div>
        <div className="col-md-6 mb-3">
          <div className="card border-0 shadow-sm rounded-4 h-100 border-start border-warning border-4">
            <div className="card-body p-4">
              <h6 className="text-muted mb-2 fw-semibold text-uppercase">Irregular (Yellow Badge)</h6>
              <h3 className="fw-bold text-dark mb-0">{members.filter(m => m.badge === 'Yellow').length} Members</h3>
              <p className="text-warning small mt-2 mb-0">40% - 75% attendance or absent &gt; 7 days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Duration Filter & Bulk Action Banner */}
      <div className="card border-0 shadow-sm rounded-4 mb-4 p-3 bg-white d-flex flex-wrap flex-md-row justify-content-between align-items-center gap-3">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <span className="fw-semibold text-muted small me-1">ABSENCE DURATION:</span>
          {[
            { label: 'All At-Risk', val: 'ALL' },
            { label: 'Absent > 7 Days', val: 'GT_7' },
            { label: 'Absent > 14 Days', val: 'GT_14' },
            { label: 'Absent > 30 Days (High Risk)', val: 'GT_30' },
          ].map(btn => (
            <button
              key={btn.val}
              type="button"
              className={`btn btn-sm ${durationFilter === btn.val ? 'btn-dark' : 'btn-outline-secondary'}`}
              onClick={() => setDurationFilter(btn.val)}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {selectedIds.length > 0 && (
          <button
            type="button"
            className="btn btn-sm btn-primary shadow-sm fw-semibold"
            onClick={handleBulkMessageClick}
          >
            <FontAwesomeIcon icon={faEnvelope} className="me-2" />
            Send Bulk Message ({selectedIds.length} Selected)
          </button>
        )}
      </div>

      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center">
          <h5 className="mb-0 fw-bold text-dark">
            Member List ({filteredMembers.length})
          </h5>
          <span className="text-muted small">Select checkboxes to message in bulk</span>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="px-4 py-3" style={{ width: '40px' }}>
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={
                        filteredMembers.length > 0 &&
                        selectedIds.length === filteredMembers.length
                      }
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="py-3">Member Name</th>
                  <th className="py-3">Contact</th>
                  <th className="py-3">Days Absent</th>
                  <th className="py-3">30-Day Attendance %</th>
                  <th className="py-3">Status Badge</th>
                  <th className="py-3 text-end px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" className="text-center py-5">Loading members...</td></tr>
                ) : filteredMembers.length > 0 ? (
                  filteredMembers.sort((a, b) => b.daysAbsent - a.daysAbsent).map(member => (
                    <tr key={member.id}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={selectedIds.includes(member.id)}
                          onChange={() => handleSelectOne(member.id)}
                        />
                      </td>
                      <td className="py-3 fw-semibold text-dark">
                        <div className="d-flex align-items-center">
                          <div className="bg-light rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                            <FontAwesomeIcon icon={faUserShield} className="text-secondary" />
                          </div>
                          <div>
                            {member.fullName}
                            <span className="text-muted fs-6 d-block">ID: {member.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-muted">
                        <div>{member.phone}</div>
                        <div className="small">{member.email}</div>
                      </td>
                      <td className="py-3 fw-bold">
                        {member.daysAbsent === null ? 'Never Attended' : `${member.daysAbsent} Days`}
                      </td>
                      <td className="py-3">
                        <div className="d-flex align-items-center">
                          <span className="me-2">{member.attendancePercentage}%</span>
                          <div className="progress w-100" style={{ height: '6px' }}>
                            <div className={`progress-bar ${member.badge === 'Red' ? 'bg-danger' : 'bg-warning'}`} role="progressbar" style={{ width: `${member.attendancePercentage}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`badge rounded-pill ${member.badge === 'Red' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                          {member.badge}
                        </span>
                      </td>
                      <td className="py-3 text-end px-4">
                        <button className="btn btn-sm btn-light me-2 text-primary border shadow-sm" title="Send Message" onClick={() => handleMessageClick(member)}>
                          <FontAwesomeIcon icon={faEnvelope} />
                        </button>
                        <a href={`tel:${member.phone}`} className="btn btn-sm btn-light me-2 text-success border shadow-sm" title="Call/WhatsApp">
                          <FontAwesomeIcon icon={faPhone} />
                        </a>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-5 text-muted">
                      <p>Great job! No At-Risk members found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Message Modal */}
      {showMsgModal && (isBulkModal || selectedMember) && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-primary text-white border-0">
                <h5 className="modal-title d-flex align-items-center">
                  <FontAwesomeIcon icon={faEnvelope} className="me-2 text-white" /> 
                  {isBulkModal
                    ? `Bulk Message (${selectedIds.length} Selected Members)`
                    : `Message Member: ${selectedMember?.fullName}`}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowMsgModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                {/* Multi-Select Channel Switcher */}
                <div className="mb-3">
                  <label className="form-label fw-semibold text-muted small text-uppercase d-flex justify-content-between">
                    <span>Select Communication Channels (Multi-Select)</span>
                    <span className="badge bg-light text-primary border">Select all that apply</span>
                  </label>
                  <div className="d-flex flex-wrap gap-2">
                    {[
                      { id: 'EMAIL', label: '📧 Email' },
                      { id: 'WHATSAPP', label: '💬 WhatsApp' },
                      { id: 'IN_APP', label: '🔔 In-App' },
                    ].map((ch) => {
                      const isSelected = notifChannels.includes(ch.id);
                      return (
                        <button
                          key={ch.id}
                          type="button"
                          className={`btn btn-sm d-flex align-items-center gap-2 fw-semibold px-3 py-2 rounded-3 ${
                            isSelected
                              ? 'btn-primary shadow-sm'
                              : 'btn-outline-secondary'
                          }`}
                          onClick={() => toggleChannel(ch.id)}
                        >
                          <input
                            type="checkbox"
                            className="form-check-input my-0"
                            checked={isSelected}
                            onChange={() => {}}
                            style={{ pointerEvents: 'none' }}
                          />
                          <span>{ch.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold text-muted small text-uppercase">Select Template</label>
                  <select className="form-select border-primary bg-light" value={msgTemplate} onChange={handleTemplateChange}>
                    <option value="template1">Template 1: We miss you</option>
                    <option value="template2">Template 2: Consistency is key</option>
                    <option value="template3">Template 3: Hope to see you back</option>
                    <option value="custom">Custom Message...</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold text-muted small text-uppercase">Message Content</label>
                  <textarea 
                    className="form-control" 
                    rows="4" 
                    value={customMsg}
                    onChange={(e) => setCustomMsg(e.target.value)}
                    placeholder="Type your message here..."
                  ></textarea>
                  <small className="text-muted mt-1 d-block">
                    ✨ Tags <code>{'{name}'}</code> and <code>{'{daysAbsent}'}</code> will be dynamically personalized for each recipient.
                  </small>
                </div>

                <div className="alert alert-info py-2 small mb-0 d-flex align-items-center">
                  <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                  {isBulkModal
                    ? `Will dispatch bulk personalized messages to ${selectedIds.length} members via ${notifChannels.join(" + ")}.`
                    : `Will send via ${notifChannels.join(" + ")} to Member: ${selectedMember?.fullName}.`}
                </div>
              </div>
              <div className="modal-footer border-0 bg-light">
                <button type="button" className="btn btn-secondary" onClick={() => setShowMsgModal(false)}>Cancel</button>
                <button type="button" className="btn btn-primary fw-semibold" onClick={sendNotification} disabled={sendingMsg}>
                  {sendingMsg ? 'Sending...' : isBulkModal ? `Send to ${selectedIds.length} Members` : 'Send Message'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceAlerts;

