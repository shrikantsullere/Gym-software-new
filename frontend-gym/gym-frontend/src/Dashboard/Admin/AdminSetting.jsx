import React, { useState, useEffect } from "react";
import {
  Form,
  Button,
  Container,
  Image,
  Nav,
  Tab,
  Alert,
  Spinner,
  InputGroup,
} from "react-bootstrap";
import {
  FaBuilding,
  FaImage,
  FaGlobe,
  FaFileInvoice,
  FaCheck,
  FaExclamationTriangle,
  FaCopy,
  FaDownload,
  FaLock,
} from "react-icons/fa";
import CreatePlan from "./CreatePlan";
import BranchManagement from "./Settings/BranchManagement";
import { FaMapMarkerAlt } from "react-icons/fa";
import axiosInstance from "../../Api/axiosInstance";
import QRCode from "qrcode";

const AdminSetting = () => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [activeTab, setActiveTab] = useState("company");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [settingsId, setSettingsId] = useState(null);
  const [adminId, setAdminId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [adminDetails, setAdminDetails] = useState(null);

  const [formData, setFormData] = useState({
    companyLogo: null,
    companyDescription: "",
    companyWebsite: "",
    gymName: "",
    razorpayKeyId: "",
    razorpayKeySecret: "",
  });

  const [previewImages, setPreviewImages] = useState({
    companyLogo: "",
  });

  // Security Form State
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityError, setSecurityError] = useState("");
  const [securitySuccess, setSecuritySuccess] = useState("");
  const [securityFormData, setSecurityFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSecurityError("");
    setSecuritySuccess("");

    if (securityFormData.newPassword.length < 6) {
      setSecurityError("New password must be at least 6 characters long.");
      return;
    }

    if (securityFormData.newPassword !== securityFormData.confirmPassword) {
      setSecurityError("New password and confirm password do not match.");
      return;
    }

    setSecurityLoading(true);

    try {
      const response = await axiosInstance.put("auth/changepassword", {
        oldPassword: securityFormData.oldPassword,
        newPassword: securityFormData.newPassword,
        id: adminId
      });

      if (response.data.success) {
        setSecuritySuccess("Password updated successfully!");
        setSecurityFormData({
          oldPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
      } else {
        setSecurityError(response.data.message || "Failed to update password.");
      }
    } catch (err) {
      setSecurityError(err.response?.data?.message || "Failed to update password.");
    } finally {
      setSecurityLoading(false);
    }
  };

  // 🔹 Generate QR code
  useEffect(() => {
    const generatedUrl = formData.companyWebsite && adminId
      ? `https://gym-speed-fitness.netlify.app/${formData.companyWebsite}/${adminId}`
      : "";

    if (generatedUrl) {
      QRCode.toDataURL(generatedUrl, { margin: 1, width: 250 })
        .then((url) => setQrCodeUrl(url))
        .catch(console.error);
    } else {
      setQrCodeUrl("");
    }
  }, [formData.companyWebsite, adminId]);

  // 🔹 Fetch admin details and settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user?.id) throw new Error("Admin not found");

        setAdminId(user.id);
        setFetching(true);

        // Fetch admin details to get gym name
        try {
          const adminRes = await axiosInstance.get(`auth/user/${user.id}`);
          if (adminRes.data) {
            setAdminDetails(adminRes.data);
            setFormData(prev => ({
              ...prev,
              gymName: adminRes.data.user?.gymName || adminRes.data.gymName || "",
              razorpayKeyId: adminRes.data.user?.razorpayKeyId || "",
              razorpayKeySecret: adminRes.data.user?.razorpayKeySecret || ""
            }));
          }
        } catch (err) {
          console.log("Failed to fetch admin details");
        }

        // Fetch app settings
        const res = await axiosInstance.get(
          `adminSettings/app-settings/admin/${user.id}`
        );

        if (res.data?.data) {
          const s = res.data.data;
          setSettingsId(s.id);
          setFormData({
            companyDescription: s.description || "",
            companyWebsite: s.url || "",
            companyLogo: null,
          });
          setPreviewImages({ companyLogo: s.logo || "" });
        }
      } catch (err) {
        setError("Failed to load settings");
      } finally {
        setFetching(false);
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files?.[0]) {
      setFormData({ ...formData, [name]: files[0] });
      const reader = new FileReader();
      reader.onload = () =>
        setPreviewImages((p) => ({ ...p, [name]: reader.result }));
      reader.readAsDataURL(files[0]);
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const saveCompanyData = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Update admin profile with gym name & razorpay keys
      if (adminId) {
        try {
          await axiosInstance.put(`auth/user/${adminId}`, {
            gymName: formData.gymName,
            razorpayKeyId: formData.razorpayKeyId,
            razorpayKeySecret: formData.razorpayKeySecret
          });
        } catch (err) {
          console.log("Failed to update admin details");
        }
      }

      // Update app settings
      const data = new FormData();
      data.append("description", formData.companyDescription);
      data.append("url", formData.companyWebsite);
      data.append("adminId", adminId);

      if (formData.companyLogo) {
        data.append("logo", formData.companyLogo);
      }

      if (settingsId) {
        await axiosInstance.put(
          `adminSettings/app-settings/${settingsId}`,
          data
        );
        setSuccess("Settings updated successfully!");
      } else {
        const res = await axiosInstance.post(
          "adminSettings/app-settings",
          data
        );
        setSettingsId(res.data?.data?.id);
        setSuccess("Settings created successfully!");
      }

      // Refresh admin details
      if (adminId) {
        const adminRes = await axiosInstance.get(`auth/user/${adminId}`);
        if (adminRes.data) {
          setAdminDetails(adminRes.data);
        }
      }
    } catch (err) {
      setError("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Copy URL
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // 🔹 Download QR
  const downloadQR = () => {
    if (!qrCodeUrl) return;
    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = `gym-qr-${adminId || "admin"}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generatedUrl =
    formData.companyWebsite && adminId
      ? `https://gym-speed-fitness.netlify.app/${formData.companyWebsite}/${adminId}`
      : "";

  return (
    <div>
      <Container fluid className="p-4">
        <h3 className="fw-bold">Settings</h3>
        <p className="text-muted">Manage your website & plans</p>

        {success && (
          <Alert variant="success">
            <FaCheck className="me-2" />
            {success}
          </Alert>
        )}

        <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
          {/* Scrollable pill tabs for mobile */}
          <div className="bg-white p-1 rounded-4 shadow-sm mb-4 d-flex overflow-auto" style={{ gap: '4px', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
            <button
              className={`btn border-0 rounded-pill fw-semibold flex-shrink-0 ${activeTab === 'company' ? 'bg-primary text-white shadow-sm' : 'text-muted bg-transparent'}`}
              onClick={() => setActiveTab('company')}
              style={{ padding: 'clamp(6px, 2vw, 10px) clamp(12px, 3vw, 20px)', fontSize: 'clamp(12px, 2.5vw, 14px)', transition: 'all 0.3s' }}
            >
              <FaBuilding className="me-2" />Website Settings
            </button>
            <button
              className={`btn border-0 rounded-pill fw-semibold flex-shrink-0 ${activeTab === 'plans' ? 'bg-primary text-white shadow-sm' : 'text-muted bg-transparent'}`}
              onClick={() => setActiveTab('plans')}
              style={{ padding: 'clamp(6px, 2vw, 10px) clamp(12px, 3vw, 20px)', fontSize: 'clamp(12px, 2.5vw, 14px)', transition: 'all 0.3s' }}
            >
              <FaFileInvoice className="me-2" />Plans
            </button>

            <button
              className={`btn border-0 rounded-pill fw-semibold flex-shrink-0 ${activeTab === 'payment' ? 'bg-primary text-white shadow-sm' : 'text-muted bg-transparent'}`}
              onClick={() => setActiveTab('payment')}
              style={{ padding: 'clamp(6px, 2vw, 10px) clamp(12px, 3vw, 20px)', fontSize: 'clamp(12px, 2.5vw, 14px)', transition: 'all 0.3s' }}
            >
              <FaGlobe className="me-2" />Payment Gateway
            </button>

            <button
              className={`btn border-0 rounded-pill fw-semibold flex-shrink-0 ${activeTab === 'security' ? 'bg-primary text-white shadow-sm' : 'text-muted bg-transparent'}`}
              onClick={() => setActiveTab('security')}
              style={{ padding: 'clamp(6px, 2vw, 10px) clamp(12px, 3vw, 20px)', fontSize: 'clamp(12px, 2.5vw, 14px)', transition: 'all 0.3s' }}
            >
              <FaLock className="me-2" />Security
            </button>
          </div>

          <Tab.Content>
            {/* ================= COMPANY TAB ================= */}
            <Tab.Pane eventKey="company">
              <div className="border p-4 rounded shadow-sm">
                {fetching ? (
                  <div className="text-center py-5">
                    <Spinner />
                  </div>
                ) : (
                  <Form onSubmit={saveCompanyData}>
                    {/* GYM NAME EDIT FIELD */}
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-bold">Gym Name *</Form.Label>
                      <Form.Control
                        type="text"
                        name="gymName"
                        value={formData.gymName}
                        onChange={handleChange}
                        placeholder="Enter gym name"
                        required
                      />
                      <Form.Text className="text-muted">
                        This name will appear on invoices and receipts.
                      </Form.Text>
                    </Form.Group>
                    
                    {/* LOGO */}
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-bold">Company Logo</Form.Label>
                      <div className="d-flex align-items-center gap-3">
                        <Button as="label">
                          Upload
                          <Form.Control
                            type="file"
                            hidden
                            name="companyLogo"
                            onChange={handleChange}
                          />
                        </Button>
                        {previewImages.companyLogo && (
                          <Image
                            src={previewImages.companyLogo}
                            style={{ width: 80 }}
                          />
                        )}
                      </div>
                    </Form.Group>

                    {/* DESCRIPTION */}
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-bold">Description</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="companyDescription"
                        value={formData.companyDescription}
                        onChange={handleChange}
                      />
                    </Form.Group>

                    {/* URL SLUG */}
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-bold">Website Url</Form.Label>
                      <Form.Control
                        type="text"
                        name="companyWebsite"
                        placeholder="e.g., fitgym"
                        value={formData.companyWebsite}
                        onChange={handleChange}
                      />
                      <Form.Text className="text-muted">
                        Your public page will be:{" "}
                        <code>https://gym-speed-fitness.netlify.app/fitgym/{adminId}</code>
                      </Form.Text>
                    </Form.Group>

                    {/* QR CODE + URL BELOW */}
                    {generatedUrl && (
                      <Form.Group className="mb-4 text-center">
                        <Form.Label className="fw-bold d-block mb-3">Scan or Share Your Gym Page</Form.Label>

                        {/* QR Code */}
                        <div className="d-flex flex-column align-items-center">
                          {qrCodeUrl ? (
                            <img
                              src={qrCodeUrl}
                              alt="QR Code"
                              style={{ width: "180px", height: "180px", margin: "0 auto 16px" }}
                            />
                          ) : (
                            <div className="text-muted mb-3">Generating QR...</div>
                          )}

                          {/* Download Button */}
                          <Button
                            size="sm"
                            variant="outline-secondary"
                            className="mb-3 d-flex align-items-center gap-1"
                            onClick={downloadQR}
                            disabled={!qrCodeUrl}
                          >
                            <FaDownload /> Download QR
                          </Button>

                          {/* URL Display with Copy */}
                          <div className="d-flex align-items-center justify-content-center gap-2">
                            <code
                              style={{
                                fontSize: "0.875rem",
                                padding: "4px 8px",
                                borderRadius: "4px",
                                background: "#f8f9fa",
                                border: "1px solid #e9ecef",
                                maxWidth: "300px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {generatedUrl}
                            </code>
                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={() => copyToClipboard(generatedUrl)}
                              title="Copy link"
                            >
                              <FaCopy size={12} />
                            </Button>
                          </div>
                          {copied && (
                            <small className="text-success mt-2">✅ Copied!</small>
                          )}
                        </div>

                        <Form.Text className="text-muted mt-3">
                          Scan the QR or share the link so members can view your gym page.
                        </Form.Text>
                      </Form.Group>
                    )}

                    {/* SAVE */}
                    <div className="text-end">
                      <Button type="submit" disabled={loading}>
                        {loading ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </Form>
                )}
              </div>
            </Tab.Pane>

            {/* ================= PLANS TAB ================= */}
            <Tab.Pane eventKey="plans">
              <CreatePlan />
            </Tab.Pane>



            {/* ================= PAYMENT TAB ================= */}
            <Tab.Pane eventKey="payment">
              <div className="border p-4 rounded shadow-sm">
                <Form onSubmit={saveCompanyData}>
                  <div className="mb-4">
                    <h5 className="fw-bold mb-1">Razorpay Payment Gateway</h5>
                    <p className="text-muted small">Configure your API keys to accept online payments from your members.</p>
                  </div>
                  
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-bold">Razorpay Key ID</Form.Label>
                    <Form.Control
                      type="text"
                      name="razorpayKeyId"
                      value={formData.razorpayKeyId}
                      onChange={handleChange}
                      placeholder="rzp_live_..."
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="fw-bold">Razorpay Key Secret</Form.Label>
                    <Form.Control
                      type="password"
                      name="razorpayKeySecret"
                      value={formData.razorpayKeySecret}
                      onChange={handleChange}
                      placeholder="Enter Key Secret"
                    />
                    <Form.Text className="text-muted">
                      Your keys are stored securely. You can find these in your Razorpay Dashboard under Settings &rarr; API Keys.
                    </Form.Text>
                  </Form.Group>

                  <div className="text-end">
                    <Button type="submit" disabled={loading}>
                      {loading ? "Saving..." : "Save Payment Settings"}
                    </Button>
                  </div>
                </Form>
              </div>
            </Tab.Pane>

            {/* ================= SECURITY (CHANGE PASSWORD) TAB ================= */}
            <Tab.Pane eventKey="security">
              <div className="border p-4 rounded shadow-sm bg-white">
                <div className="mb-4">
                  <h5 className="fw-bold mb-1">Change Password</h5>
                  <p className="text-muted small">Update your account login password below.</p>
                </div>

                {securityError && (
                  <Alert variant="danger">
                    <FaExclamationTriangle className="me-2" />
                    {securityError}
                  </Alert>
                )}

                {securitySuccess && (
                  <Alert variant="success">
                    <FaCheck className="me-2" />
                    {securitySuccess}
                  </Alert>
                )}

                <Form onSubmit={handleChangePassword}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">Current Password *</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Enter current password"
                      value={securityFormData.oldPassword}
                      onChange={(e) => setSecurityFormData(prev => ({ ...prev, oldPassword: e.target.value }))}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">New Password *</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Enter new password (min 6 characters)"
                      value={securityFormData.newPassword}
                      onChange={(e) => setSecurityFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="fw-bold">Confirm New Password *</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Confirm new password"
                      value={securityFormData.confirmPassword}
                      onChange={(e) => setSecurityFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                    />
                  </Form.Group>

                  <div className="text-end">
                    <Button type="submit" disabled={securityLoading}>
                      {securityLoading ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Updating...
                        </>
                      ) : (
                        "Update Password"
                      )}
                    </Button>
                  </div>
                </Form>
              </div>
            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>
      </Container>
    </div>
  );
};

export default AdminSetting;