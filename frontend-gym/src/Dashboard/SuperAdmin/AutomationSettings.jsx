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
          <FontAwesomeIcon icon={faEnvelope} className="me-2 text-primary" /> Message Templates
        </h2>
        <p className="text-muted">Manage system message templates for automated communications.</p>
      </div>

      <div className="row g-4 mb-4">
        {/* Templates Panel */}
        <div className="col-lg-12">
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



    </div>
  );
};

export default AutomationSettings;
