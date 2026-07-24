import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Card, Button, Alert } from 'react-bootstrap';

/**
 * Simple test component to verify QR code rendering works
 */
const AdminQRCodeTest = () => {
  const [testValue, setTestValue] = useState('');

  useEffect(() => {
    // Generate a test QR code value
    const testData = JSON.stringify({
      purpose: "gym_checkin_global",
      branchId: 1,
      branchName: "Test Branch",
      issued_at: new Date().toISOString(),
      nonce: "test123",
      expires_at: new Date(Date.now() + 3600000).toISOString()
    });
    setTestValue(testData);
  }, []);

  return (
    <Card className="m-4">
      <Card.Header>QR Code Test</Card.Header>
      <Card.Body>
        {testValue ? (
          <>
            <QRCodeCanvas value={testValue} size={200} />
            <p className="mt-3">If you see a QR code above, the library is working correctly.</p>
            <Alert variant="info" className="mt-3">
              <strong>Test Value:</strong> {testValue.substring(0, 100)}...
            </Alert>
          </>
        ) : (
          <p>Loading test QR code...</p>
        )}
      </Card.Body>
    </Card>
  );
};

export default AdminQRCodeTest;

