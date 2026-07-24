import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Alert, Button, Spinner, Modal } from 'react-bootstrap';
import axiosInstance from '../Api/axiosInstance';

/**
 * QRScanner Component - For staff/receptionists to scan member QR codes
 * @param {Function} onScanSuccess - Callback when QR code is successfully scanned
 * @param {boolean} isOpen - Whether scanner modal is open
 * @param {Function} onClose - Callback to close scanner
 * @param {string} title - Modal title
 */
const QRScanner = ({ onScanSuccess, isOpen, onClose, title = "Scan Member QR Code" }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const html5QrCodeRef = useRef(null);
  const scannerContainerRef = useRef(null);
  const lastScannedQRRef = useRef(null);

  useEffect(() => {
    if (isOpen && !isScanning) {
      startScanner();
    } else if (!isOpen && isScanning) {
      stopScanner();
    }

    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, [isOpen]);

  const startScanner = async () => {
    try {
      setError(null);
      setIsScanning(true);
      
      const html5QrCode = new Html5Qrcode("qr-scanner-container");
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" }, // Use back camera on mobile
        {
          fps: 10,
          qrbox: { width: 300, height: 300 },
          aspectRatio: 1.0
        },
        async (decodedText) => {
          // Prevent duplicate scans
          const now = Date.now();
          if (lastScannedQRRef.current && 
              lastScannedQRRef.current.text === decodedText && 
              (now - lastScannedQRRef.current.timestamp) < 3000) {
            return;
          }

          lastScannedQRRef.current = { text: decodedText, timestamp: now };
          
          // Process the scanned QR code
          await processScannedQR(decodedText);
        },
        (errorMessage) => {
          // Ignore scanning errors (they're frequent during scanning)
        }
      );
    } catch (err) {
      console.error('Error starting scanner:', err);
      setError('Failed to start camera. Please check permissions.');
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    try {
      if (html5QrCodeRef.current) {
        await html5QrCodeRef.current.stop();
        await html5QrCodeRef.current.clear();
        html5QrCodeRef.current = null;
      }
      setIsScanning(false);
      setError(null);
    } catch (err) {
      console.error('Error stopping scanner:', err);
    }
  };

  const processScannedQR = async (decodedText) => {
    if (processing) return;
    
    setProcessing(true);
    setError(null);

    try {
      // Parse QR code data
      const qrData = JSON.parse(decodedText);
      
      // Validate QR code structure
      if (qrData.purpose !== 'gym_checkin') {
        setError('Invalid QR code. Please scan a valid gym check-in QR code.');
        setProcessing(false);
        return;
      }

      // Check if QR code is expired
      if (qrData.expires_at) {
        const expiresAt = new Date(qrData.expires_at);
        const now = new Date();
        if (now > expiresAt) {
          setError('QR code has expired. Please ask the member to generate a new one.');
          setProcessing(false);
          return;
        }
      }

      // Call the success callback with QR data
      if (onScanSuccess) {
        await onScanSuccess(qrData);
        // Stop scanner after successful scan
        await stopScanner();
        if (onClose) onClose();
      }
      
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Invalid QR code format. Please try again.');
      } else {
        setError(`Error processing QR code: ${err.message}`);
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = async () => {
    await stopScanner();
    if (onClose) onClose();
  };

  return (
    <Modal show={isOpen} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" className="mb-3" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        <div className="text-center">
          <div id="qr-scanner-container" ref={scannerContainerRef} style={{ width: '100%', minHeight: '400px' }}></div>
          
          {processing && (
            <div className="mt-3">
              <Spinner animation="border" size="sm" className="me-2" />
              <span>Processing QR code...</span>
            </div>
          )}
          
          <p className="text-muted mt-3">
            Point your camera at the member's QR code
          </p>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default QRScanner;

