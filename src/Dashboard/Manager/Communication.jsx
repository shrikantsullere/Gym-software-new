import React, { useState } from 'react';

// import 'bootstrap-icons/font/bootstrap-icons.css';

const CommunicationUI = () => {
  const [activeTab, setActiveTab] = useState('sms');
  const [showPreview, setShowPreview] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  // Sample data
  const members = [
    { id: 1, name: 'John Doe', phone: '+1234567890', email: 'john@example.com', status: 'Active' },
    { id: 2, name: 'Jane Smith', phone: '+0987654321', email: 'jane@example.com', status: 'Active' },
    { id: 3, name: 'Robert Johnson', phone: '+1122334455', email: 'robert@example.com', status: 'Expired' },
  ];

  const groups = [
    { id: 1, name: 'All Active Members' },
    { id: 2, name: 'Expired Members' },
    { id: 3, name: 'Staff' },
  ];

  const smsTemplates = [
    { id: 1, name: 'Payment Reminder', content: 'Hello {name}, your payment is due on {date}.' },
    { id: 2, name: 'Class Schedule', content: 'Your class is scheduled for {time} on {date}.' },
    { id: 3, name: 'Birthday Wish', content: 'Happy birthday {name}! We wish you a wonderful day!' },
  ];

  const emailTemplates = [
    { id: 1, name: 'Welcome Mail', subject: 'Welcome to Our Service', content: 'Hello {name}, welcome to our service...' },
    { id: 2, name: 'Renewal Reminder', subject: 'Renewal Reminder', content: 'Hello {name}, your subscription is about to expire...' },
    { id: 3, name: 'Newsletter', subject: 'Monthly Newsletter', content: 'Check out our latest updates...' },
  ];

  const smsHistory = [
    { id: 1, memberName: 'John Doe', phone: '+1234567890', status: 'Delivered', time: '2023-05-15 14:30' },
    { id: 2, memberName: 'Jane Smith', phone: '+0987654321', status: 'Sent', time: '2023-05-15 14:32' },
    { id: 3, memberName: 'Robert Johnson', phone: '+1122334455', status: 'Failed', time: '2023-05-15 14:35' },
  ];

  const emailHistory = [
    { id: 1, memberName: 'John Doe', email: 'john@example.com', subject: 'Payment Reminder', status: 'Sent', date: '2023-05-15' },
    { id: 2, memberName: 'Jane Smith', email: 'jane@example.com', subject: 'Newsletter', status: 'Opened', date: '2023-05-14' },
    { id: 3, memberName: 'Robert Johnson', email: 'robert@example.com', subject: 'Renewal Notice', status: 'Failed', date: '2023-05-13' },
  ];

  const [smsForm, setSmsForm] = useState({
    recipientType: 'individual',
    selectedMembers: [],
    selectedGroups: [],
    phone: '',
    message: '',
    template: ''
  });

  const [emailForm, setEmailForm] = useState({
    recipientType: 'individual',
    selectedMembers: [],
    selectedGroups: [],
    email: '',
    subject: '',
    message: '',
    template: '',
    attachments: []
  });

  const handleSmsSubmit = (e) => {
    e.preventDefault();
    setShowPreview(true);
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    setEmailPreview(true);
  };

  const handleSendSms = () => {
    // Implementation for sending SMS
    setShowPreview(false);
    alert('SMS sent successfully!');
  };

  const handleSendEmail = () => {
    // Implementation for sending email
    setEmailPreview(false);
    alert('Email sent successfully!');
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setEmailForm({ ...emailForm, attachments: files });
  };

  return (
    <div className="container-fluid py-4">
      <h1 className="h2 mb-4">Communication Center</h1>
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className="nav-link"
            style={
              activeTab === 'sms'
                ? { backgroundColor: '#2f6a87', color: '#fff', borderColor: '#2f6a87' }
                : {}
            }
            onClick={() => setActiveTab('sms')}
          >
            <i className="bi bi-chat-dots me-2"></i>Send SMS
          </button>
        </li>
        <li className="nav-item">
          <button
            className="nav-link"
            style={
              activeTab === 'email'
                ? { backgroundColor: '#2f6a87', color: '#fff', borderColor: '#2f6a87' }
                : {}
            }
            onClick={() => setActiveTab('email')}
          >
            <i className="bi bi-envelope me-2"></i>Send Email
          </button>
        </li>
        <li className="nav-item">
          <button
            className="nav-link"
            style={
              activeTab === 'history'
                ? { backgroundColor: '#2f6a87', color: '#fff', borderColor: '#2f6a87' }
                : {}
            }
            onClick={() => setActiveTab('history')}
          >
            <i className="bi bi-clock-history me-2"></i>History
          </button>
        </li>
        <li className="nav-item">
          <button
            className="nav-link"
            style={
              activeTab === 'templates'
                ? { backgroundColor: '#2f6a87', color: '#fff', borderColor: '#2f6a87' }
                : {}
            }
            onClick={() => setActiveTab('templates')}
          >
            <i className="bi bi-file-earmark-text me-2"></i>Templates
          </button>
        </li>
      </ul>

    {activeTab === 'sms' && (
  <div className="row">
    {/* Left Card: Send SMS */}
    <div className="col-lg-6">
      <div className="card">
        <div
          className="card-header"
          style={{ backgroundColor: '#2f6a87', color: '#fff' }}
        >
          <h5 className="card-title mb-0">
            <i className="bi bi-chat-dots me-2"></i>Send SMS
          </h5>
        </div>
        <div className="card-body">
          <form onSubmit={handleSmsSubmit}>
            {/* Recipient Type */}
            <div className="mb-3">
              <label className="form-label">Recipient Type</label>
              <select
                className="form-select"
                value={smsForm.recipientType}
                onChange={(e) =>
                  setSmsForm({ ...smsForm, recipientType: e.target.value })
                }
              >
                <option value="individual">Individual Member</option>
                <option value="multiple">Multiple Members</option>
                <option value="groups">Groups</option>
              </select>
            </div>

            {/* Individual Member */}
            {smsForm.recipientType === 'individual' && (
              <div className="mb-3">
                <label className="form-label">Select Member</label>
                <select className="form-select">
                  <option value="">Search by name or ID</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.phone})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Multiple Members */}
            {smsForm.recipientType === 'multiple' && (
              <div className="mb-3">
                <label className="form-label">Select Members</label>
                <div
                  className="border rounded p-2"
                  style={{ maxHeight: '200px', overflowY: 'auto' }}
                >
                  {members.map((member) => (
                    <div key={member.id} className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`member-${member.id}`}
                      />
                      <label
                        className="form-check-label"
                        htmlFor={`member-${member.id}`}
                      >
                        {member.name} ({member.phone})
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Groups */}
            {smsForm.recipientType === 'groups' && (
              <div className="mb-3">
                <label className="form-label">Select Group</label>
                <select className="form-select">
                  <option value="">Select a group</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Phone Number */}
            <div className="mb-3">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter phone number"
                value={smsForm.phone}
                onChange={(e) =>
                  setSmsForm({ ...smsForm, phone: e.target.value })
                }
              />
            </div>

            {/* Message */}
            <div className="mb-3">
              <label className="form-label">Message</label>
              <textarea
                className="form-control"
                rows="5"
                placeholder="Type your message here (160 characters max)"
                value={smsForm.message}
                onChange={(e) =>
                  setSmsForm({ ...smsForm, message: e.target.value })
                }
                maxLength="160"
              ></textarea>
              <div className="form-text text-end">
                {smsForm.message.length}/160 characters
              </div>
            </div>

            {/* Template */}
            <div className="mb-3">
              <label className="form-label">Template</label>
              <select
                className="form-select"
                value={smsForm.template}
                onChange={(e) => {
                  const selectedTemplate = smsTemplates.find(
                    (t) => t.id === parseInt(e.target.value)
                  );
                  if (selectedTemplate) {
                    setSmsForm({
                      ...smsForm,
                      template: e.target.value,
                      message: selectedTemplate.content,
                    });
                  }
                }}
              >
                <option value="">Select a template</option>
                {smsTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Buttons */}
            <div className="d-flex justify-content-between">
              <button type="button" className="btn btn-outline-secondary">
                <i className="bi bi-upload me-2"></i>Bulk Upload
              </button>
              <button type="submit" className="btn btn-btn-outline-light" style={{ backgroundColor: '#2f6a87', color: '#fff' }}>
                <i className="bi bi-send me-2"></i>Preview & Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    {/* Right Card: Recent SMS History */}
    <div className="col-lg-6">
      <div className="card">
        <div
          className="card-header"
          style={{ backgroundColor: '#2f6a87', color: '#fff' }}
        >
          <h5 className="card-title mb-0">
            <i className="bi bi-clock-history me-2"></i>Recent SMS History
          </h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {smsHistory.map((item) => (
                  <tr key={item.id}>
                    <td>{item.memberName}</td>
                    <td>{item.phone}</td>
                    <td>
                      <span
                        className={`badge ${
                          item.status === 'Delivered'
                            ? 'bg-success'
                            : item.status === 'Sent'
                            ? 'bg-primary'
                            : 'bg-danger'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td>{item.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="d-flex justify-content-end">
            <button className="btn btn-outline-primary btn-sm">
              <i className="bi bi-download me-1"></i> Export
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
)}
      {activeTab === 'email' && (
        <div className="row">
          <div className="col-lg-8">
            <div className="card">
              <div className="card-header   text-white" style={{ backgroundColor: '#2f6a87', color: '#fff' }}>
                <h5 className="card-title mb-0">
                  <i className="bi bi-envelope me-2"></i>Send Email
                </h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleEmailSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Recipient Type</label>
                    <select
                      className="form-select"
                      value={emailForm.recipientType}
                      onChange={(e) => setEmailForm({ ...emailForm, recipientType: e.target.value })}
                    >
                      <option value="individual">Individual Member</option>
                      <option value="multiple">Multiple Members</option>
                      <option value="groups">Groups</option>
                    </select>
                  </div>

                  {emailForm.recipientType === 'individual' && (
                    <div className="mb-3">
                      <label className="form-label">Select Member</label>
                      <select className="form-select">
                        <option value="">Search by name or ID</option>
                        {members.map(member => (
                          <option key={member.id} value={member.id}>
                            {member.name} ({member.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {emailForm.recipientType === 'multiple' && (
                    <div className="mb-3">
                      <label className="form-label">Select Members</label>
                      <div className="border rounded p-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {members.map(member => (
                          <div key={member.id} className="form-check">
                            <input className="form-check-input" type="checkbox" id={`email-member-${member.id}`} />
                            <label className="form-check-label" htmlFor={`email-member-${member.id}`}>
                              {member.name} ({member.email})
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {emailForm.recipientType === 'groups' && (
                    <div className="mb-3">
                      <label className="form-label">Select Group</label>
                      <select className="form-select">
                        <option value="">Select a group</option>
                        {groups.map(group => (
                          <option key={group.id} value={group.id}>{group.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="Enter email address"
                      value={emailForm.email}
                      onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Subject</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter subject line"
                      value={emailForm.subject}
                      onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Message Body</label>
                    <div className="border rounded p-2 bg-light">
                      <div className="d-flex border-bottom pb-2 mb-2">
                        <button type="button" className="btn btn-sm btn-outline-secondary me-1">
                          <i className="bi bi-type-bold"></i>
                        </button>
                        <button type="button" className="btn btn-sm btn-outline-secondary me-1">
                          <i className="bi bi-type-italic"></i>
                        </button>
                        <button type="button" className="btn btn-sm btn-outline-secondary me-1">
                          <i className="bi bi-list-ul"></i>
                        </button>
                        <button type="button" className="btn btn-sm btn-outline-secondary me-1">
                          <i className="bi bi-list-ol"></i>
                        </button>
                        <button type="button" className="btn btn-sm btn-outline-secondary me-1">
                          <i className="bi bi-link"></i>
                        </button>
                        <button type="button" className="btn btn-sm btn-outline-secondary">
                          <i className="bi bi-image"></i>
                        </button>
                      </div>
                      <textarea
                        className="form-control"
                        rows="8"
                        placeholder="Type your email content here"
                        value={emailForm.message}
                        onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                      ></textarea>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Attachments</label>
                    <input
                      type="file"
                      className="form-control"
                      multiple
                      onChange={handleFileUpload}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Template</label>
                    <select
                      className="form-select"
                      value={emailForm.template}
                      onChange={(e) => {
                        const selectedTemplate = emailTemplates.find(t => t.id === parseInt(e.target.value));
                        if (selectedTemplate) {
                          setEmailForm({
                            ...emailForm,
                            template: e.target.value,
                            subject: selectedTemplate.subject,
                            message: selectedTemplate.content
                          });
                        }
                      }}
                    >
                      <option value="">Select a template</option>
                      {emailTemplates.map(template => (
                        <option key={template.id} value={template.id}>{template.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="d-flex justify-content-between">
                    <div>
                      <button type="button" className="btn btn-outline-secondary me-2">
                        <i className="bi bi-upload me-2"></i>Bulk Upload
                      </button>
                      <button type="button" className="btn btn-outline-primary">
                        <i className="bi bi-save me-2"></i>Save Draft
                      </button>
                    </div>
                    <button type="submit" className="btn btn-btn-outline-light" style={{ backgroundColor: '#2f6a87', color: '#fff' }} >
                      <i className="bi bi-send me-2"></i>Preview & Send
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card">
              <div className="card-header bg-info text-white">
                <h5 className="card-title mb-0">
                  <i className="bi bi-graph-up me-2"></i>Email Analytics
                </h5>
              </div>
              <div className="card-body">
                <div className="text-center mb-4">
                  <div className="display-4 fw-bold">68%</div>
                  <div className="text-muted">Open Rate</div>
                </div>
                <div className="text-center mb-4">
                  <div className="display-4 fw-bold">24%</div>
                  <div className="text-muted">Click Rate</div>
                </div>
                <div className="progress mb-2">
                  <div className="progress-bar bg-success" style={{ width: '68%' }}></div>
                </div>
                <div className="progress">
                  <div className="progress-bar bg-info" style={{ width: '24%' }}></div>
                </div>
              </div>
            </div>

            <div className="card mt-4">
              <div className="card-header bg-secondary text-white">
                <h5 className="card-title mb-0">
                  <i className="bi bi-clock-history me-2"></i>Recent Emails
                </h5>
              </div>
              <div className="card-body">
                {emailHistory.slice(0, 3).map(item => (
                  <div key={item.id} className="border-bottom pb-2 mb-2">
                    <div className="d-flex justify-content-between">
                      <strong>{item.memberName}</strong>
                      <span className={`badge ${item.status === 'Opened' ? 'bg-success' :
                          item.status === 'Sent' ? 'bg-primary' : 'bg-danger'
                        }`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="text-truncate small">{item.subject}</div>
                    <div className="small text-muted">{item.date}</div>
                  </div>
                ))}
                <div className="text-center mt-2">
                  <button className="btn btn-sm btn-outline-primary">View All</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="card">
          <div className="card-header bg-secondary text-white">
            <h5 className="card-title mb-0">
              <i className="bi bi-clock-history me-2"></i>Communication History
            </h5>
          </div>
          <div className="card-body">
            <div className="row mb-4">
              <div className="col-md-3">
                <select className="form-select">
                  <option>All Types</option>
                  <option>SMS</option>
                  <option>Email</option>
                </select>
              </div>
              <div className="col-md-3">
                <input type="date" className="form-control" />
              </div>
              <div className="col-md-3">
                <select className="form-select">
                  <option>All Statuses</option>
                  <option>Sent</option>
                  <option>Delivered</option>
                  <option>Failed</option>
                </select>
              </div>
              <div className="col-md-3">
                <button className="  btn btn-outline-light w-100" style={{ backgroundColor: '#2f6a87', color: '#fff' }}>
                  <i className="bi bi-search me-2"></i>Filter
                </button>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Recipient</th>
                    <th>Content</th>
                    <th>Status</th>
                    <th>Date/Time</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {smsHistory.map(item => (
                    <tr key={`sms-${item.id}`}>
                      <td><span className="badge bg-info">SMS</span></td>
                      <td>{item.memberName}<br /><small>{item.phone}</small></td>
                      <td className="text-truncate" style={{ maxWidth: '200px' }}>Sample SMS message content</td>
                      <td>
                        <span className={`badge ${item.status === 'Delivered' ? 'bg-success' :
                            item.status === 'Sent' ? 'bg-primary' : 'bg-danger'
                          }`}>
                          {item.status}
                        </span>
                      </td>
                      <td>{item.time}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary">
                          <i className="bi bi-eye"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {emailHistory.map(item => (
                    <tr key={`email-${item.id}`}>
                      <td><span className="badge bg-warning text-dark">Email</span></td>
                      <td>{item.memberName}<br /><small>{item.email}</small></td>
                      <td className="text-truncate" style={{ maxWidth: '200px' }}>{item.subject}</td>
                      <td>
                        <span className={`badge ${item.status === 'Opened' ? 'bg-success' :
                            item.status === 'Sent' ? 'bg-primary' : 'bg-danger'
                          }`}>
                          {item.status}
                        </span>
                      </td>
                      <td>{item.date}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary me-1">
                          <i className="bi bi-eye"></i>
                        </button>
                        <button className="btn btn-sm btn-outline-success">
                          <i className="bi bi-send"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="d-flex justify-content-between align-items-center mt-3">
              <div>Showing 1 to 6 of 100 entries</div>
              <nav>
                <ul className="pagination mb-0">
                  <li className="page-item disabled"><a className="page-link" href="#">Previous</a></li>
                  <li className="page-item active"><a className="page-link" href="#">1</a></li>
                  <li className="page-item"><a className="page-link" href="#">2</a></li>
                  <li className="page-item"><a className="page-link" href="#">3</a></li>
                  <li className="page-item"><a className="page-link" href="#">Next</a></li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="row">
          <div className="col-md-6">
            <div className="card">
              <div className="card-header bg-info text-white">
                <h5 className="card-title mb-0">
                  <i className="bi bi-chat-dots me-2"></i>SMS Templates
                </h5>
              </div>
              <div className="card-body">
                <div className="d-flex justify-content-between mb-3">
                  <input type="text" className="form-control w-75" placeholder="Search templates..." />
                  <button className="btn btn-btn-outline-light" style={{ backgroundColor: '#2f6a87', color: '#fff' }}>
                    <i className="bi bi-plus-circle me-2"></i>New Template
                  </button>
                </div>

                <div className="list-group">
                  {smsTemplates.map(template => (
                    <div key={template.id} className="list-group-item list-group-item-action">
                      <div className="d-flex w-100 justify-content-between">
                        <h6 className="mb-1">{template.name}</h6>
                        <div>
                          <button className="btn btn-sm btn-outline-primary me-1">
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button className="btn btn-sm btn-outline-danger">
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>
                      <p className="mb-1 text-muted small">{template.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card">
              <div className="card-header bg-warning text-dark">
                <h5 className="card-title mb-0">
                  <i className="bi bi-envelope me-2"></i>Email Templates
                </h5>
              </div>
              <div className="card-body">
                <div className="d-flex justify-content-between mb-3">
                  <input type="text" className="form-control w-75" placeholder="Search templates..." />
                  <button className="btn btn-btn-outline-light" style={{ backgroundColor: '#2f6a87', color: '#fff' }}>
                    <i className="bi bi-plus-circle me-2"></i>New Template
                  </button>
                </div>

                <div className="list-group">
                  {emailTemplates.map(template => (
                    <div key={template.id} className="list-group-item list-group-item-action">
                      <div className="d-flex w-100 justify-content-between">
                        <h6 className="mb-1">{template.name}</h6>
                        <div>
                          <button className="btn btn-sm btn-outline-primary me-1">
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button className="btn btn-sm btn-outline-danger">
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>
                      <p className="mb-1"><strong>{template.subject}</strong></p>
                      <p className="mb-1 text-muted small">{template.content.substring(0, 100)}...</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SMS Preview Modal */}
      {showPreview && (
        <div className="modal fade show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Preview SMS</h5>
                <button type="button" className="btn-close" onClick={() => setShowPreview(false)}></button>
              </div>
              <div className="modal-body">
                <div className="border rounded p-3 bg-light">
                  <p>{smsForm.message}</p>
                  <div className="text-end text-muted small">{smsForm.message.length}/160 characters</div>
                </div>
                <div className="mt-3">
                  <h6>Recipients:</h6>
                  <ul className="list-group">
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                      John Doe
                      <span className="badge bg-primary rounded-pill">+1234567890</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                      Jane Smith
                      <span className="badge bg-primary rounded-pill">+0987654321</span>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPreview(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleSendSms}>
                  <i className="bi bi-send me-2"></i>Send SMS
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Preview Modal */}
      {showEmailPreview && (
        <div className="modal fade show d-block" tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Preview Email</h5>
                <button type="button" className="btn-close" onClick={() => setEmailPreview(false)}></button>
              </div>
              <div className="modal-body">
                <div className="border rounded p-3 bg-light">
                  <h5>{emailForm.subject}</h5>
                  <hr />
                  <div dangerouslySetInnerHTML={{ __html: emailForm.message.replace(/\n/g, '<br/>') }} />
                  {emailForm.attachments.length > 0 && (
                    <>
                      <hr />
                      <h6>Attachments:</h6>
                      <ul>
                        {emailForm.attachments.map((file, index) => (
                          <li key={index}>{file.name}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
                <div className="mt-3">
                  <h6>Recipients:</h6>
                  <ul className="list-group">
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                      John Doe
                      <span className="badge bg-primary rounded-pill">john@example.com</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                      Jane Smith
                      <span className="badge bg-primary rounded-pill">jane@example.com</span>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEmailPreview(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleSendEmail}>
                  <i className="bi bi-send me-2"></i>Send Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPreview && <div className="modal-backdrop fade show"></div>}
      {showEmailPreview && <div className="modal-backdrop fade show"></div>}
    </div>
  );
};

export default CommunicationUI;
