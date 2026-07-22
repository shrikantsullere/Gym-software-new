import React from 'react';
import UniversalQRAttendance from '../../Components/UniversalQRAttendance';

/**
 * GeneralQrCheckin - General Trainer QR Code Check-in Component
 * 
 * Uses the UniversalQRAttendance component which:
 * - Scans the admin's global QR code
 * - Works for all user roles
 * - Provides check-in/checkout functionality
 * - Displays attendance history
 */
const GeneralQrCheckin = () => {
  return <UniversalQRAttendance />;
};

export default GeneralQrCheckin;
