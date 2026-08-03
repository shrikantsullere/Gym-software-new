import React, { useState, useEffect } from "react";
import { Form, Button, Alert, Spinner, Badge } from "react-bootstrap";
import { FaCheck, FaExclamationTriangle } from "react-icons/fa";
import axiosInstance from "../../../Api/axiosInstance";

const IntegrationsSettings = () => {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState(null); // { type: "success" | "danger", text: "" }
  const [integrations, setIntegrations] = useState({
    paymentGatewayEnabled: false,
    emailEnabled: false,
    razorpayKeyId: "",
    razorpaySecret: "",
    brevoApiKey: "",
    brevoSenderEmail: "",
    brevoSenderName: "",
    isVerified: false,
    lastVerifiedAt: null,
    lastTestStatus: "",
    lastTestMessage: ""
  });

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("integrations");
      if (res.data?.success) {
        setIntegrations(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load integrations", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setIntegrations(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleUpdate = async (endpoint, payload) => {
    try {
      setUpdating(true);
      const res = await axiosInstance.put(`integrations/${endpoint}`, payload);
      if (res.data.success) {
        showMessage("success", res.data.message);
        fetchIntegrations(); // re-fetch to get masked fields back
      }
    } catch (err) {
      showMessage("danger", err.response?.data?.message || err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleTest = async (endpoint) => {
    try {
      setTesting(true);
      const res = await axiosInstance.post(`integrations/${endpoint}/test`);
      if (res.data.success) {
        showMessage("success", res.data.message);
        fetchIntegrations();
      }
    } catch (err) {
      showMessage("danger", err.response?.data?.message || err.message);
      fetchIntegrations();
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-5"><Spinner animation="border" /></div>;
  }

  return (
    <div className="border p-4 rounded shadow-sm bg-white">
      {message && (
        <Alert variant={message.type}>
          {message.type === "success" ? <FaCheck className="me-2" /> : <FaExclamationTriangle className="me-2" />}
          {message.text}
        </Alert>
      )}

      {/* RAZORPAY */}
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-1">
          <h5 className="fw-bold mb-0">Razorpay Payment Gateway</h5>
          <Form.Check 
            type="switch"
            id="paymentGatewayEnabled"
            name="paymentGatewayEnabled"
            label={integrations.paymentGatewayEnabled ? "Enabled" : "Disabled"}
            checked={integrations.paymentGatewayEnabled}
            onChange={handleChange}
          />
        </div>
        <p className="text-muted small">Configure your API keys to accept online payments from your members.</p>
      </div>
      
      <Form.Group className="mb-3">
        <Form.Label className="fw-bold">Razorpay Key ID</Form.Label>
        <Form.Control
          type="text"
          name="razorpayKeyId"
          value={integrations.razorpayKeyId || ""}
          onChange={handleChange}
          placeholder="rzp_live_..."
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label className="fw-bold">Razorpay Key Secret</Form.Label>
        <Form.Control
          type="password"
          name="razorpaySecret"
          value={integrations.razorpaySecret || ""}
          onChange={handleChange}
          placeholder="Enter Key Secret"
        />
      </Form.Group>
      <div className="d-flex gap-2 justify-content-end mb-4">
        <Button variant="outline-primary" onClick={() => handleTest("razorpay")} disabled={testing || updating}>
          Verify Connection
        </Button>
        <Button onClick={() => handleUpdate("razorpay", {
          razorpayKeyId: integrations.razorpayKeyId,
          razorpaySecret: integrations.razorpaySecret,
          paymentGatewayEnabled: integrations.paymentGatewayEnabled
        })} disabled={updating || testing}>
          Save Razorpay
        </Button>
      </div>

      <hr className="my-4" />

      {/* BREVO */}
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-1">
          <h5 className="fw-bold mb-0">Brevo Email Settings</h5>
          <Form.Check 
            type="switch"
            id="emailEnabled"
            name="emailEnabled"
            label={integrations.emailEnabled ? "Enabled" : "Disabled"}
            checked={integrations.emailEnabled}
            onChange={handleChange}
          />
        </div>
        <p className="text-muted small">Configure Brevo to send automated emails. No SMTP configuration required.</p>
      </div>

      <Form.Group className="mb-3">
        <Form.Label className="fw-bold">Brevo API Key</Form.Label>
        <Form.Control
          type="password"
          name="brevoApiKey"
          value={integrations.brevoApiKey || ""}
          onChange={handleChange}
          placeholder="xkeysib-..."
        />
      </Form.Group>

      <div className="row">
        <div className="col-md-6">
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">Sender Email</Form.Label>
            <Form.Control
              type="email"
              name="brevoSenderEmail"
              value={integrations.brevoSenderEmail || ""}
              onChange={handleChange}
              placeholder="admin@yourgym.com"
            />
          </Form.Group>
        </div>
        <div className="col-md-6">
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">Sender Name</Form.Label>
            <Form.Control
              type="text"
              name="brevoSenderName"
              value={integrations.brevoSenderName || ""}
              onChange={handleChange}
              placeholder="Gym Name"
            />
          </Form.Group>
        </div>
      </div>
      <div className="d-flex gap-2 justify-content-end mb-4">
        <Button variant="outline-primary" onClick={() => handleTest("brevo")} disabled={testing || updating}>
          Verify Connection
        </Button>
        <Button onClick={() => handleUpdate("brevo", {
          brevoApiKey: integrations.brevoApiKey,
          brevoSenderEmail: integrations.brevoSenderEmail,
          brevoSenderName: integrations.brevoSenderName,
          emailEnabled: integrations.emailEnabled
        })} disabled={updating || testing}>
          Save Brevo
        </Button>
      </div>

      {integrations.lastTestStatus && (
        <div className="mt-4 p-3 bg-light rounded">
          <h6 className="mb-2">Integration Health Status</h6>
          <div className="d-flex align-items-center gap-2">
            Status: {integrations.isVerified ? <Badge bg="success">Connected</Badge> : <Badge bg="danger">Disconnected</Badge>}
          </div>
          {integrations.lastTestMessage && <div className="text-danger small mt-1">Error: {integrations.lastTestMessage}</div>}
          <div className="text-muted small mt-1">Last Verified: {integrations.lastVerifiedAt ? new Date(integrations.lastVerifiedAt).toLocaleString() : 'Never'}</div>
        </div>
      )}
    </div>
  );
};

export default IntegrationsSettings;
