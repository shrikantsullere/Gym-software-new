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
const AdminGlobalQRCode = () => {
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  // Get user data
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const branchId = userData.branchId || userData.id || 1;
  const branchName = userData.branchName || userData.fullName || 'Gym Branch';
  const adminId = userData.id; // Admin's own ID
  
  // Generate global QR code value as a public web link
  const qrValue = useMemo(() => {
    // Always use live domain so printed QR works everywhere
    const baseUrl = "https://gymsoftware.space";
    return `${baseUrl}/public-attendance?adminId=${adminId}&branchId=${branchId}`;
  }, [adminId, branchId]);

  // Generate new QR code function (no longer needs to generate nonce, just placeholder)
  const generateNewQRCode = () => {
    setSuccess('QR code is now static and does not need to be regenerated!');
    setTimeout(() => setSuccess(null), 3000);
  };

  // Optional function if save was used elsewhere, left empty to avoid errors
  const saveQRCode = async () => {
    setSuccess('QR code is now static!');
    setTimeout(() => setSuccess(null), 3000);
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
            <p><strong>Status:</strong> Static QR Code</p>
            <p>Members can scan this QR code to check in</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

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
            Static Link
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
                {qrValue ? (
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
                <p className="text-muted mb-3">
                  <small>Static QR Code</small>
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
                  <h6 className="mb-1">2. Scanning & Attendance</h6>
                  <p className="mb-0 text-muted small">
                    Members or Staff can scan this QR code using their default phone camera. It will open a secure web link where they can enter their registered Phone Number and mark their check-in/out.
                  </p>
                </div>
                <div className="list-group-item">
                  <h6 className="mb-1">3. Static Link</h6>
                  <p className="mb-0 text-muted small">
                    This QR code is static. You can print it once and paste it anywhere in the gym.
                  </p>
                </div>
                <div className="list-group-item">
                  <h6 className="mb-1">4. Secure Connectivity</h6>
                  <p className="mb-0 text-muted small">
                    All check-ins performed via this QR code are securely recorded and will instantly reflect in your Attendance Reports.
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
                      <td><strong>Status:</strong></td>
                      <td>
                        <Badge bg="success">Active (Static)</Badge>
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