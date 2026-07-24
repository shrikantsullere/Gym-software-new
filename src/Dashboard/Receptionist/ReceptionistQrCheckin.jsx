import React from 'react';
import UniversalQRAttendance from '../../Components/UniversalQRAttendance';

/**
 * ReceptionistQrCheckin - Receptionist QR Code Check-in Component
 * 
 * Uses the UniversalQRAttendance component which:
 * - Scans the admin's global QR code
 * - Works for all user roles
 * - Provides check-in/checkout functionality
 * - Displays attendance history
 */
const ReceptionistQrCheckin = () => {
  return <UniversalQRAttendance />;
};

export default ReceptionistQrCheckin;