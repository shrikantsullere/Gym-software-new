import React from 'react';
import AdminGlobalQRCode from './AdminGlobalQRCode';

/**
 * Admin QR Check-in Page
 * Admin generates QR code for their staff (members, receptionists, trainers) to scan
 * Admin themselves cannot check-in, only their staff can scan and check-in
 */
const QrCheckin = () => {
  return (
    <div className="container-fluid p-3">
      <AdminGlobalQRCode />
    </div>
  );
};

export default QrCheckin;