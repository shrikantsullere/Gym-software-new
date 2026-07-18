import React, { useEffect, useMemo, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { format } from "date-fns";
import { Card, Button, Alert, Badge } from "react-bootstrap";
import { FaQrcode, FaDownload, FaPrint, FaSync } from "react-icons/fa";
import axiosInstance from '../../Api/axiosInstance';

/**
 * AdminGlobalQRCode - Admin creates and manages the global gym QR code
 * This QR code is displayed at the gym entrance for members to scan
 */
// Helper function to generate random nonce (moved to top for use in useState)
function generateNonce(len = 16) {
  const alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => alpha[n % alpha.length]).join("");
}

const AdminGlobalQRCode = () => {
  const CODE_TTL = 15; // 15 seconds - QR code valid for 15 seconds
  const [qrNonce, setQrNonce] = useState(() => generateNonce(16));
  const [secondsLeft, setSecondsLeft] = useState(CODE_TTL);
  const [issuedAt, setIssuedAt] = useState(new Date());
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  // Get user data
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const branchId = userData.branchId || userData.id || 1;
  const branchName = userData.branchName || userData.fullName || 'Gym Branch';
  const adminId = userData.id; // Admin's own ID
  
  // Generate global QR code value - Admin's QR code for their staff to scan
  const qrValue = useMemo(() => {
    const qrData = {
      purpose: "gym_checkin_global",
      adminId: adminId, // Admin ID - required for staff validation
      adminName: userData.fullName || 'Admin',
      branchId: branchId, // Keep for reference but validation is based on adminId
      branchName: branchName,
      issued_at: issuedAt.toISOString(),
      nonce: qrNonce,
      expires_at: new Date(issuedAt.getTime() + CODE_TTL * 1000).toISOString()
    };
    return JSON.stringify(qrData);
  }, [qrNonce, adminId, branchId, branchName, issuedAt, userData.fullName]);

  // Format dates for display
  const formattedIssueDate = format(issuedAt, "MMM dd, yyyy HH:mm:ss");
  const formattedExpiryDate = format(new Date(issuedAt.getTime() + CODE_TTL * 1000), "MMM dd, yyyy HH:mm:ss");

  // Generate new QR code function (must be defined before useEffect)
  const generateNewQRCode = () => {
    setQrNonce(generateNonce(16));
    setIssuedAt(new Date());
    setSecondsLeft(CODE_TTL);
    setSuccess('New QR code generated successfully!');
    setTimeout(() => setSuccess(null), 3000);
  };

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          generateNewQRCode();
          return CODE_TTL;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [qrNonce]);

  // Ensure QR code is valid on mount
  useEffect(() => {
    if (!qrNonce || qrNonce.length < 10) {
      setQrNonce(generateNonce(16));
      setIssuedAt(new Date());
      setSecondsLeft(CODE_TTL);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save QR code to backend (optional - for tracking)
  const saveQRCode = async () => {
    try {
      setLoading(true);
      setError(null);

      // Optionally save QR code info to backend
      // This allows tracking which QR codes were generated
      const response = await axiosInstance.post('qrcode/generate', {
        branchId: branchId,
        nonce: qrNonce,
        issuedAt: issuedAt.toISOString(),
        expiresAt: new Date(issuedAt.getTime() + CODE_TTL * 1000).toISOString()
      });

      if (response.data.success) {
        setSuccess('QR code saved successfully!');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      // If endpoint doesn't exist, that's okay - QR code still works
      // Silently fail - endpoint is optional
    } finally {
      setLoading(false);
    }
  };

  // Download QR code as image
  const downloadQRCode = () => {
    const canvas = document.getElementById('qr-code-canvas');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `gym-qr-code-${branchId}-${Date.now()}.png`;
      link.href = url;
      link.click();
    }
  };

  // Print QR code
  const printQRCode = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Gym QR Code - ${branchName}</title>
          <style>
            body { 
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              justify-content: center; 
              height: 100vh; 
              font-family: Arial, sans-serif;
            }
            h1 { margin-bottom: 20px; }
            .qr-code { margin: 20px 0; }
            .info { margin-top: 20px; text-align: center; }
          </style>
        </head>
        <body>
          <h1>${branchName} - Check-in QR Code</h1>
          <div class="qr-code">
            <img src="${document.getElementById('qr-code-canvas')?.toDataURL('image/png')}" alt="QR Code" style="width: 400px; height: 400px;" />
          </div>
          <div class="info">
            <p><strong>Valid until:</strong> ${formattedExpiryDate}</p>
            <p>Members can scan this QR code to check in</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Format countdown text
  const countdownText = `${String(Math.floor(secondsLeft / 3600)).padStart(2, "0")}:${String(Math.floor((secondsLeft % 3600) / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`;

  return (
    <div className="container-fluid p-4">
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-0">
              <FaQrcode className="me-2" />
              Global Gym Check-in QR Code
            </h5>
            <small className="text-white-50">Display this QR code at the gym entrance</small>
          </div>
          <Badge bg="light" text="dark" className="fs-6 px-3 py-2">
            {countdownText}
          </Badge>
        </Card.Header>
        <Card.Body>
          {success && (
            <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <div className="row">
            {/* QR Code Display */}
            <div className="col-md-6 text-center mb-4">
              <div className="bg-white p-4 rounded-3 border shadow-sm d-inline-block">
                {qrValue && qrValue.length > 50 ? (
                  <QRCodeCanvas 
                    id="qr-code-canvas"
                    value={qrValue} 
                    size={300} 
                    level="M"
                    includeMargin={true}
                  />
                ) : (
                  <div style={{ width: '300px', height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="spinner-border text-primary mb-3" role="status">
                      <span className="visually-hidden">Generating QR Code...</span>
                    </div>
                    <p className="text-muted">Generating QR Code...</p>
                  </div>
                )}
              </div>
              
              <div className="mt-3">
                <h6 className="fw-bold">{branchName}</h6>
                <p className="text-muted mb-2">
                  <small>Issued: {formattedIssueDate}</small>
                </p>
                <p className="text-muted mb-3">
                  <small>Expires: {formattedExpiryDate}</small>
                </p>
                
                <div className="d-flex gap-2 justify-content-center flex-wrap">
                  <Button 
                    variant="primary" 
                    onClick={generateNewQRCode}
                    disabled={loading}
                  >
                    <FaSync className="me-2" />
                    Generate New Code
                  </Button>
                  <Button 
                    variant="outline-success" 
                    onClick={downloadQRCode}
                  >
                    <FaDownload className="me-2" />
                    Download
                  </Button>
                  <Button 
                    variant="outline-info" 
                    onClick={printQRCode}
                  >
                    <FaPrint className="me-2" />
                    Print
                  </Button>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="col-md-6">
              <h6 className="fw-bold mb-3">Instructions</h6>
              <div className="list-group">
                <div className="list-group-item">
                  <h6 className="mb-1">1. Display QR Code</h6>
                  <p className="mb-0 text-muted small">
                    Print or display this QR code at the gym entrance/reception area
                  </p>
                </div>
                <div className="list-group-item">
                  <h6 className="mb-1">2. Staff Scanning</h6>
                  <p className="mb-0 text-muted small">
                    Your staff (Members, Receptionists, General Trainers, Personal Trainers) will scan this QR code using their mobile app to check in
                  </p>
                </div>
                <div className="list-group-item">
                  <h6 className="mb-1">3. Admin Cannot Check-in</h6>
                  <p className="mb-0 text-muted small">
                    <strong>Note:</strong> Admin cannot check-in themselves. Only staff members assigned to you can scan and check-in.
                  </p>
                </div>
                <div className="list-group-item">
                  <h6 className="mb-1">4. Auto Refresh</h6>
                  <p className="mb-0 text-muted small">
                    QR code automatically refreshes every 15 seconds for security. You can also manually generate a new code.
                  </p>
                </div>
                <div className="list-group-item">
                  <h6 className="mb-1">5. Security</h6>
                  <p className="mb-0 text-muted small">
                    Each QR code contains your Admin ID. Only staff assigned to you can successfully check-in using this QR code.
                  </p>
                </div>
              </div>

              <div className="mt-4 p-3 bg-light rounded">
                <h6 className="fw-bold mb-2">QR Code Details</h6>
                <table className="table table-sm table-borderless mb-0">
                  <tbody>
                    <tr>
                      <td><strong>Branch ID:</strong></td>
                      <td>{branchId}</td>
                    </tr>
                    <tr>
                      <td><strong>Branch Name:</strong></td>
                      <td>{branchName}</td>
                    </tr>
                    <tr>
                      <td><strong>Nonce:</strong></td>
                      <td><code className="small">{qrNonce}</code></td>
                    </tr>
                    <tr>
                      <td><strong>Status:</strong></td>
                      <td>
                        <Badge bg={secondsLeft > 5 ? "success" : "warning"}>
                          {secondsLeft > 5 ? "Active" : "Expiring Soon"}
                        </Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default AdminGlobalQRCode;