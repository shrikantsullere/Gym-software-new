import React, { useState, useEffect } from 'react';
import axiosInstance from '../../Api/axiosInstance';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCogs, faEnvelope, faClock, faSave, faEdit, faCheckCircle, faPlus, faTrash, faRobot, faComments } from '@fortawesome/free-solid-svg-icons';
import { Modal, Button, Form } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

const AutomationSettings = () => {
  const [settings, setSettings] = useState({
    trialDurationDays: 7,
    gracePeriodDays: 3,
    enableEmailNotif: false,
    enableWhatsappNotif: false,
    lowCreditThreshold: 50,
    quarterlyDiscount: 5,
    yearlyDiscount: 15
  });
  const [templates, setTemplates] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  // Package Modal State
  const [showPkgModal, setShowPkgModal] = useState(false);
  const [editingPkg, setEditingPkg] = useState({ packageName: '', credits: 0, price: 0, isActive: true, packageType: 'WHATSAPP' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [settingsRes, templatesRes, pkgRes] = await Promise.all([
        axiosInstance.get('/v1/automation/settings'),
        axiosInstance.get('/v1/automation/templates'),
        axiosInstance.get('/v1/credits/packages')
      ]);
      
      if (settingsRes.data.success) {
        setSettings(settingsRes.data.settings);
      }
      if (templatesRes.data.success) {
        setTemplates(templatesRes.data.templates);
      }
      if (pkgRes.data.success) {
        setPackages(pkgRes.data.packages);
      }
    } catch (err) {
      console.error("Error fetching automation data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : Number(value)
    }));
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      await axiosInstance.put('/v1/automation/settings', settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving settings:", err);
      alert('Failed to save settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const openTemplateModal = (template) => {
    setEditingTemplate({ ...template });
    setShowModal(true);
  };

  const handleTemplateSave = async () => {
    try {
      await axiosInstance.put(`/v1/automation/templates/${editingTemplate.id}`, {
        subject: editingTemplate.subject,
        messageBody: editingTemplate.messageBody
      });
      setShowModal(false);
      fetchData(); // refresh templates
    } catch (err) {
      console.error("Error updating template:", err);
      alert('Failed to update template.');
    }
  };

  const insertVariable = (variable) => {
    if (editingTemplate) {
      setEditingTemplate({
        ...editingTemplate,
        messageBody: editingTemplate.messageBody + variable
      });
    }
  };

  const openPkgModal = (pkg = null, defaultType = 'WHATSAPP') => {
    if (pkg) {
      setEditingPkg({ ...pkg });
    } else {
      setEditingPkg({ packageName: '', credits: 0, price: 0, isActive: true, packageType: defaultType });
    }
    setShowPkgModal(true);
  };

  const savePkg = async () => {
    try {
      if (editingPkg.id) {
        await axiosInstance.put(`/v1/credits/packages/${editingPkg.id}`, editingPkg);
      } else {
        await axiosInstance.post('/v1/credits/packages', editingPkg);
      }
      setShowPkgModal(false);
      fetchData();
    } catch (err) {
      console.error("Error saving package:", err);
      alert('Failed to save package.');
    }
  };

  const deletePkg = async (id) => {
    if(!window.confirm("Are you sure?")) return;
    try {
      await axiosInstance.delete(`/v1/credits/packages/${id}`);
      fetchData();
    } catch (err) {
      alert("Failed to delete.");
    }
  };

  const togglePkgStatus = async (pkg) => {
    try {
      await axiosInstance.put(`/v1/credits/packages/${pkg.id}`, { ...pkg, isActive: !pkg.isActive });
      fetchData();
    } catch (err) {
      console.error("Error updating package status:", err);
    }
  };

  const whatsappPackages = packages.filter(p => p.packageType === 'WHATSAPP' || !p.packageType);
  const emailPackages = packages.filter(p => p.packageType === 'EMAIL');

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-3 p-md-4" style={{ backgroundColor: '#f4f7f6', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        .custom-slider {
          -webkit-appearance: none;
          width: 100%;
          height: 8px;
          border-radius: 5px;
          background: #e9ecef;
          outline: none;
        }
        .custom-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #0d6efd;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .custom-slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
        .ios-switch {
          width: 50px;
          height: 26px;
          background-color: #e9ecef;
          border-radius: 50px;
          position: relative;
          cursor: pointer;
          outline: none;
          border: none;
          appearance: none;
          transition: all 0.3s ease;
        }
        .ios-switch:checked {
          background-color: #198754;
        }
        .ios-switch::after {
          content: '';
          position: absolute;
          top: 3px;
          left: 3px;
          width: 20px;
          height: 20px;
          background-color: white;
          border-radius: 50%;
          transition: all 0.3s ease;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .ios-switch:checked::after {
          transform: translateX(24px);
        }
        .whatsapp-preview-container {
          background-image: url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png');
          background-color: #e5ddd5;
          border-radius: 12px;
          padding: 20px;
          min-height: 250px;
          border: 1px solid #d1d1d1;
          box-shadow: inset 0 0 10px rgba(0,0,0,0.05);
          position: relative;
        }
        .whatsapp-bubble {
          background-color: #dcf8c6;
          padding: 12px 16px;
          border-radius: 8px;
          border-top-right-radius: 0;
          display: inline-block;
          max-width: 90%;
          font-size: 14.5px;
          color: #111;
          white-space: pre-wrap;
          box-shadow: 0 1px 1px rgba(0,0,0,0.15);
          position: relative;
        }
        .whatsapp-bubble::after {
          content: '';
          position: absolute;
          top: 0;
          right: -8px;
          width: 0;
          height: 0;
          border-top: 10px solid #dcf8c6;
          border-right: 10px solid transparent;
        }
        .pricing-card {
          background: #fff;
          border: 1px solid #eaeaea;
          border-radius: 16px;
          padding: 24px;
          transition: all 0.3s ease;
          text-align: center;
          position: relative;
        }
        .pricing-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.06);
          border-color: #198754;
        }
        .credits-badge {
          background: #e8f5e9;
          color: #198754;
          padding: 6px 16px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 13px;
          display: inline-block;
          margin-bottom: 15px;
        }
        .var-chip {
          cursor: pointer;
          transition: all 0.2s;
        }
        .var-chip:hover {
          background-color: #e2e3e5;
          transform: scale(1.05);
        }
        .timeline-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 15px 0;
          position: relative;
        }
        .timeline-container::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 5%;
          right: 5%;
          height: 3px;
          background: #e9ecef;
          z-index: 1;
        }
        .timeline-step {
          background: #fff;
          border: 2px solid #0d6efd;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          color: #0d6efd;
          font-weight: bold;
          font-size: 12px;
          box-shadow: 0 0 0 4px #fff;
        }
        .timeline-step.active {
          background: #0d6efd;
          color: #fff;
        }
        .timeline-step.danger {
          border-color: #dc3545;
          color: #dc3545;
        }
      `}</style>

      <div className="mb-4">
        <h2 className="text-dark fw-bold mb-1">
          <FontAwesomeIcon icon={faRobot} className="me-2 text-primary" /> Automation & Global Settings
        </h2>
        <p className="text-muted">Manage system rules, message templates, and WhatsApp credit tiers for Gym Owners.</p>
      </div>

      <div className="row g-4 mb-4">
        {/* Global Rules Panel */}
        <div className="col-lg-5">
          <div className="card shadow-sm border-0 rounded-4 h-100">
            <div className="card-header bg-white border-bottom p-4">
              <h5 className="mb-0 fw-bold"><FontAwesomeIcon icon={faCogs} className="me-2 text-secondary" /> System Rules</h5>
            </div>
            <div className="card-body p-4">
              
              {/* Visual Timeline */}
              <div className="mb-4 d-none d-sm-block">
                <div className="timeline-container">
                  <div className="text-center position-relative z-2">
                    <div className="timeline-step active mx-auto">1</div>
                    <small className="d-block mt-2 fw-semibold" style={{fontSize: '11px'}}>Register</small>
                  </div>
                  <div className="text-center position-relative z-2">
                    <div className="timeline-step active mx-auto">{settings.trialDurationDays}</div>
                    <small className="d-block mt-2 fw-semibold text-primary" style={{fontSize: '11px'}}>Trial Ends</small>
                  </div>
                  <div className="text-center position-relative z-2">
                    <div className="timeline-step danger mx-auto">{settings.gracePeriodDays}</div>
                    <small className="d-block mt-2 fw-semibold text-danger" style={{fontSize: '11px'}}>Lockout</small>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="form-label fw-bold mb-0">Free Trial Duration</label>
                  <span className="badge bg-primary rounded-pill px-3 py-2">{settings.trialDurationDays} Days</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="30" step="1"
                  className="custom-slider mb-2" 
                  name="trialDurationDays" 
                  value={settings.trialDurationDays} 
                  onChange={handleSettingsChange} 
                />
                <small className="text-muted">Days a new Gym Owner uses the software for free.</small>
              </div>
              
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="form-label fw-bold mb-0">Grace Period (Post Expiry)</label>
                  <span className="badge bg-warning text-dark rounded-pill px-3 py-2">{settings.gracePeriodDays} Days</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="15" step="1"
                  className="custom-slider mb-2" 
                  name="gracePeriodDays" 
                  value={settings.gracePeriodDays} 
                  onChange={handleSettingsChange} 
                />
                <small className="text-muted">Days after trial/plan expiry before lockout.</small>
              </div>

              <div className="mb-4">
                <label className="form-label fw-bold text-danger">Low WhatsApp Credit Threshold</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0"><FontAwesomeIcon icon={faEnvelope} className="text-muted"/></span>
                  <input 
                    type="number" 
                    className="form-control border-start-0" 
                    name="lowCreditThreshold" 
                    value={settings.lowCreditThreshold || 50} 
                    onChange={handleSettingsChange} 
                  />
                </div>
                <small className="text-muted">Alert threshold for low message credits.</small>
              </div>

              <div className="row mb-4">
                <div className="col-6">
                  <label className="form-label fw-bold text-primary">Quarterly Discount (%)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    name="quarterlyDiscount" 
                    value={settings.quarterlyDiscount ?? 5} 
                    onChange={handleSettingsChange}
                    min="0"
                    max="100"
                    step="0.1"
                  />
                  <small className="text-muted">Applied to 3-month plans.</small>
                </div>
                <div className="col-6">
                  <label className="form-label fw-bold text-success">Annually Discount (%)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    name="yearlyDiscount" 
                    value={settings.yearlyDiscount ?? 15} 
                    onChange={handleSettingsChange}
                    min="0"
                    max="100"
                    step="0.1"
                  />
                  <small className="text-muted">Applied to 12-month plans.</small>
                </div>
              </div>

              <hr className="my-4 text-muted" />

              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <div className="fw-bold">Email Notifications</div>
                  <small className="text-muted">System-wide automated emails</small>
                </div>
                <input 
                  type="checkbox" 
                  className="ios-switch"
                  name="enableEmailNotif" 
                  checked={settings.enableEmailNotif} 
                  onChange={handleSettingsChange} 
                />
              </div>

              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <div className="fw-bold">WhatsApp Notifications</div>
                  <small className="text-muted">System-wide WhatsApp alerts</small>
                </div>
                <input 
                  type="checkbox" 
                  className="ios-switch"
                  name="enableWhatsappNotif" 
                  checked={settings.enableWhatsappNotif} 
                  onChange={handleSettingsChange} 
                />
              </div>

              <button 
                className={`btn w-100 fw-bold shadow-sm py-2 ${savedSuccess ? 'btn-success' : 'btn-primary'}`} 
                onClick={saveSettings}
                disabled={savingSettings}
                style={{ transition: 'all 0.3s ease' }}
              >
                {savingSettings ? (
                  <span className="spinner-border spinner-border-sm" />
                ) : savedSuccess ? (
                  <><FontAwesomeIcon icon={faCheckCircle} className="me-2" /> Saved!</>
                ) : (
                  <><FontAwesomeIcon icon={faSave} className="me-2" /> Save Global Rules</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Templates Panel */}
        <div className="col-lg-7">
          <div className="card shadow-sm border-0 rounded-4 h-100">
            <div className="card-header bg-white border-bottom p-4">
              <h5 className="mb-0 fw-bold"><FontAwesomeIcon icon={faEnvelope} className="me-2 text-primary" /> Message Templates</h5>
            </div>
            <div className="card-body p-0">
              <div className="list-group list-group-flush">
                {templates.map(t => (
                  <div key={t.id} className="list-group-item p-4 border-bottom hover-bg-light" style={{transition: 'background 0.2s'}}>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <div className="fw-bold fs-5 text-dark mb-1">{t.templateType.replace(/_/g, ' ')}</div>
                        <div className="text-muted small"><strong>Subject:</strong> {t.subject}</div>
                      </div>
                      <button className="btn btn-sm btn-light border shadow-sm rounded-pill px-3" onClick={() => openTemplateModal(t)}>
                        <FontAwesomeIcon icon={faEdit} className="me-2 text-primary" /> Edit
                      </button>
                    </div>
                    <div className="mt-3 bg-light p-3 rounded text-muted small" style={{ whiteSpace: 'pre-wrap', borderLeft: '3px solid #0d6efd' }}>
                      {t.messageBody.length > 150 ? t.messageBody.substring(0, 150) + '...' : t.messageBody}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Packages Section */}
      <div className="card shadow-sm border-0 rounded-4 mb-4">
        <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-0 fw-bold">WhatsApp Credit Packages</h5>
            <small className="text-muted">Pricing tiers for Gym Owners to top-up their messaging limits</small>
          </div>
          <button className="btn btn-success shadow-sm fw-bold rounded-pill px-4" onClick={() => openPkgModal(null, 'WHATSAPP')}>
            <FontAwesomeIcon icon={faPlus} className="me-2" /> Add Package
          </button>
        </div>
        <div className="card-body p-4 bg-light">
          <div className="row g-4">
            {whatsappPackages.length === 0 ? (
              <div className="col-12 text-center text-muted py-5">
                No WhatsApp credit packages created yet.
              </div>
            ) : whatsappPackages.map(p => (
              <div className="col-md-6 col-lg-3" key={p.id}>
                <div className="pricing-card">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="fw-bold text-muted text-uppercase" style={{fontSize: '12px', letterSpacing: '1px'}}>{p.packageName}</span>
                    <div className="form-check form-switch m-0 p-0 d-flex align-items-center">
                      <input 
                        className="ios-switch m-0" 
                        style={{width: '36px', height: '20px', cursor: 'pointer'}} 
                        type="checkbox" 
                        checked={p.isActive} 
                        onChange={() => togglePkgStatus(p)} 
                      />
                    </div>
                  </div>
                  <div className="credits-badge" style={{ backgroundColor: '#e8f5e9', color: '#198754' }}>
                    <FontAwesomeIcon icon={faComments} className="me-1" /> {p.credits.toLocaleString()} Credits
                  </div>
                  <div className="price">₹{p.price}</div>
                  
                  <div className="d-flex gap-2 mt-4">
                    <button className="btn btn-outline-primary flex-fill rounded-pill" onClick={() => openPkgModal(p)}>Edit</button>
                    <button className="btn btn-outline-danger rounded-pill px-3" onClick={() => deletePkg(p.id)}><FontAwesomeIcon icon={faTrash} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Email Packages Section */}
      <div className="card shadow-sm border-0 rounded-4 mb-4">
        <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-0 fw-bold">Email Credit Packages</h5>
            <small className="text-muted">Pricing tiers for Gym Owners to top-up their email limits</small>
          </div>
          <button className="btn btn-success shadow-sm fw-bold rounded-pill px-4" onClick={() => openPkgModal(null, 'EMAIL')}>
            <FontAwesomeIcon icon={faPlus} className="me-2" /> Add Package
          </button>
        </div>
        <div className="card-body p-4 bg-light">
          <div className="row g-4">
            {emailPackages.length === 0 ? (
              <div className="col-12 text-center text-muted py-5">
                No Email credit packages created yet.
              </div>
            ) : emailPackages.map(p => (
              <div className="col-md-6 col-lg-3" key={p.id}>
                <div className="pricing-card">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="fw-bold text-muted text-uppercase" style={{fontSize: '12px', letterSpacing: '1px'}}>{p.packageName}</span>
                    <div className="form-check form-switch m-0 p-0 d-flex align-items-center">
                      <input 
                        className="ios-switch m-0" 
                        style={{width: '36px', height: '20px', cursor: 'pointer'}} 
                        type="checkbox" 
                        checked={p.isActive} 
                        onChange={() => togglePkgStatus(p)} 
                      />
                    </div>
                  </div>
                  <div className="credits-badge" style={{ backgroundColor: '#e3f2fd', color: '#0d6efd' }}>
                    <FontAwesomeIcon icon={faEnvelope} className="me-1" /> {p.credits.toLocaleString()} Emails
                  </div>
                  <div className="price">₹{p.price}</div>
                  
                  <div className="d-flex gap-2 mt-4">
                    <button className="btn btn-outline-primary flex-fill rounded-pill" onClick={() => openPkgModal(p)}>Edit</button>
                    <button className="btn btn-outline-danger rounded-pill px-3" onClick={() => deletePkg(p.id)}><FontAwesomeIcon icon={faTrash} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Template Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="xl" centered>
        <Modal.Header closeButton className="border-bottom-0 pb-0">
          <Modal.Title className="fw-bold fs-4">Edit Template</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2">
          {editingTemplate && (
            <div className="row g-4">
              <div className="col-lg-6">
                <Form>
                  <div className="mb-4">
                    <Form.Label className="fw-bold text-muted small text-uppercase">Subject</Form.Label>
                    <Form.Control 
                      type="text" 
                      className="form-control-lg bg-light"
                      value={editingTemplate.subject} 
                      onChange={e => setEditingTemplate({...editingTemplate, subject: e.target.value})} 
                    />
                  </div>
                  
                  <div className="mb-2">
                    <Form.Label className="fw-bold text-muted small text-uppercase">Dynamic Variables</Form.Label>
                    <div className="d-flex flex-wrap gap-2 mb-2">
                      <span className="badge bg-light text-dark border var-chip py-2 px-3" onClick={() => insertVariable('{GymName}')}>{'{GymName}'}</span>
                      <span className="badge bg-light text-dark border var-chip py-2 px-3" onClick={() => insertVariable('{OwnerName}')}>{'{OwnerName}'}</span>
                      <span className="badge bg-light text-dark border var-chip py-2 px-3" onClick={() => insertVariable('{Days}')}>{'{Days}'}</span>
                      <span className="badge bg-light text-dark border var-chip py-2 px-3" onClick={() => insertVariable('{Date}')}>{'{Date}'}</span>
                      <span className="badge bg-light text-dark border var-chip py-2 px-3" onClick={() => insertVariable('{PlanName}')}>{'{PlanName}'}</span>
                    </div>
                    <small className="text-muted" style={{fontSize: '11px'}}>Click a variable to insert it into the message body.</small>
                  </div>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold text-muted small text-uppercase mt-2">Message Body</Form.Label>
                    <Form.Control 
                      as="textarea" 
                      rows={8} 
                      className="form-control"
                      value={editingTemplate.messageBody} 
                      onChange={e => setEditingTemplate({...editingTemplate, messageBody: e.target.value})} 
                    />
                  </Form.Group>
                </Form>
              </div>
              <div className="col-lg-6">
                <div className="mb-2 fw-bold text-muted small text-uppercase">WhatsApp Live Preview</div>
                <div className="whatsapp-preview-container d-flex flex-column justify-content-start align-items-start p-4">
                   <div className="whatsapp-bubble shadow-sm">
                      {editingTemplate.messageBody || "Type your message to see a preview..."}
                      <div className="text-end mt-1 text-muted" style={{fontSize: '10px'}}>{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                   </div>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-top-0 pt-0">
          <Button variant="light" className="rounded-pill px-4" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" className="rounded-pill px-4 fw-bold shadow-sm" onClick={handleTemplateSave}>
            <FontAwesomeIcon icon={faCheckCircle} className="me-2"/> Save Template
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Package Edit Modal */}
      <Modal show={showPkgModal} onHide={() => setShowPkgModal(false)} centered>
        <Modal.Header closeButton className="border-bottom-0 pb-0">
          <Modal.Title className="fw-bold"><FontAwesomeIcon icon={faCogs} className="me-2 text-success" /> {editingPkg.id ? 'Edit' : 'Create'} Package</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-4">
              <Form.Label className="fw-bold text-muted small text-uppercase">Package Name</Form.Label>
              <Form.Control type="text" className="form-control-lg bg-light" placeholder="e.g. Starter Pack" value={editingPkg.packageName} onChange={e => setEditingPkg({...editingPkg, packageName: e.target.value})} />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="fw-bold text-muted small text-uppercase">Package Type</Form.Label>
              <Form.Select className="form-control bg-light" value={editingPkg.packageType || 'WHATSAPP'} onChange={e => setEditingPkg({...editingPkg, packageType: e.target.value})}>
                <option value="WHATSAPP">WhatsApp Credit Package</option>
                <option value="EMAIL">Email Credit Package</option>
              </Form.Select>
            </Form.Group>
            
            <div className="row g-3 mb-4">
              <div className="col-6">
                <Form.Label className="fw-bold text-muted small text-uppercase">Credits</Form.Label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0"><FontAwesomeIcon icon={faEnvelope} className="text-success"/></span>
                  <Form.Control type="number" className="border-start-0" value={editingPkg.credits} onChange={e => setEditingPkg({...editingPkg, credits: Number(e.target.value)})} />
                </div>
              </div>
              <div className="col-6">
                <Form.Label className="fw-bold text-muted small text-uppercase">Price (₹)</Form.Label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 fw-bold">₹</span>
                  <Form.Control type="number" className="border-start-0" value={editingPkg.price} onChange={e => setEditingPkg({...editingPkg, price: Number(e.target.value)})} />
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center mb-3 bg-light p-3 rounded-3 border">
              <label className="fw-bold mb-0">Active Status</label>
              <input className="ios-switch m-0" type="checkbox" checked={editingPkg.isActive} onChange={e => setEditingPkg({...editingPkg, isActive: e.target.checked})} />
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-top-0 pt-0">
          <Button variant="light" className="rounded-pill px-4" onClick={() => setShowPkgModal(false)}>Cancel</Button>
          <Button variant="success" className="rounded-pill px-4 fw-bold shadow-sm" onClick={savePkg}>
            <FontAwesomeIcon icon={faCheckCircle} className="me-2"/> {editingPkg.id ? 'Save Changes' : 'Create Package'}
          </Button>
        </Modal.Footer>
      </Modal>

    </div>
  );
};

export default AutomationSettings;
