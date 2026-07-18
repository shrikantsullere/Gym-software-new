// import React, { useEffect, useMemo, useState } from "react";
// import { QRCodeCanvas } from "qrcode.react";
// import { format } from "date-fns";
// import { Button, Spinner, Alert, Badge } from "react-bootstrap";
// import BaseUrl from "../../Api/BaseUrl";

// const HouseKeepingQrCheckin = ({ member_id, member_name }) => {
//   const CODE_TTL = 60; // seconds
//   const [qrNonce, setQrNonce] = useState(generateNonce(10));
//   const [secondsLeft, setSecondsLeft] = useState(CODE_TTL);
//   const [issuedAt, setIssuedAt] = useState(new Date());
//   const [history, setHistory] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [checkinSuccess, setCheckinSuccess] = useState(null);
//   const [historyLoading, setHistoryLoading] = useState(false);

//   // const BASE_WEB_URL = "https://gym-latest-new.netlify.app/login";

//   // const qrValue = useMemo(() => {
//   //   return `${BASE_WEB_URL}`;
//   // }, [qrNonce]);

//   // Get user data from localStorage
//   const userData = JSON.parse(localStorage.getItem('user') || '{}');
//   const memberId = userData.id;
//   const branchId = userData.branchId || 1;

//   // Generate QR code value
//   const qrValue = useMemo(() => {
//     return JSON.stringify({
//       purpose: "gym_checkin",
//       member_id: member_id,
//       member_name: member_name,
//       issued_at: issuedAt.toISOString(),
//       nonce: qrNonce,
//       expires_at: new Date(issuedAt.getTime() + CODE_TTL * 1000).toISOString()
//     });
//   }, [qrNonce, member_id, member_name, issuedAt]);

//   // Format dates for display
//   const formattedIssueDate = format(issuedAt, "MMM dd, yyyy HH:mm:ss");
//   const formattedExpiryDate = format(new Date(issuedAt.getTime() + CODE_TTL * 1000), "MMM dd, yyyy HH:mm:ss");

//   // Countdown timer
//   useEffect(() => {
//     const timer = setInterval(() => {
//       setSecondsLeft((s) => {
//         if (s <= 1) {
//           setQrNonce(generateNonce(10));
//           setIssuedAt(new Date());
//           return CODE_TTL;
//         }
//         return s - 1;
//       });
//     }, 1000);
//     return () => clearInterval(timer);
//   }, [qrNonce]);


//   useEffect(() => {
//     fetchCheckinHistory();
//   }, [memberId, branchId]);


//   const handleCheckIn = async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       const response = await fetch(`${BaseUrl}memberattendence/checkin`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           memberId: memberId,
//           branchId: branchId,
//           mode: 'Manual',
//           notes: 'QR Code Check-in'
//         })
//       });

//       const data = await response.json();

//       if (data.success) {
//         setCheckinSuccess('Check-in successful!');
//         // Refresh the history after successful check-in
//         fetchCheckinHistory();
//       } else {
//         setError(data.message || 'Check-in failed');
//       }
//     } catch (err) {
//       setError(`Error during check-in: ${err.message}`);
//     } finally {
//       setLoading(false);
//       // Clear success message after 3 seconds
//       setTimeout(() => setCheckinSuccess(null), 3000);
//     }
//   };

//   // Function to fetch check-in history
//   const fetchCheckinHistory = async () => {
//     try {
//       setHistoryLoading(true);

//       // Build query URL
//       const url = `${BaseUrl}memberattendence/${memberId}`;

//       const response = await fetch(url, {
//         method: 'GET',
//         headers: {
//           'Content-Type': 'application/json',
//         }
//       });

//       const data = await response.json();

//       console.log('API Response:', data);
//       console.log('Member ID from localStorage:', memberId);

//       if (data.success && data.attendance) {
//         const allHistory = data.attendance;

//         const transformedHistory = allHistory.map(entry => ({
//           id: entry.id,
//           checkIn: new Date(entry.checkIn),
//           checkOut: entry.checkOut ? new Date(entry.checkOut) : null,
//           mode: entry.mode,
//           status: entry.status,
//           notes: entry.notes,
//           computedStatus: entry.computedStatus,
//           memberId: entry.memberId,
//           branchId: entry.branchId
//         }));

//         setHistory(transformedHistory);
//       } else {
//         setHistory([]);
//       }
//     } catch (err) {
//       console.error('Error fetching check-in history:', err);
//       setHistory([]);
//     } finally {
//       setHistoryLoading(false);
//     }
//   };


//   const getStatusBadge = (computedStatus) => {
//     switch (computedStatus) {
//       case 'Active':
//         return <Badge bg="warning">Active</Badge>;
//       case 'Completed':
//         return <Badge bg="success">Completed</Badge>;
//       default:
//         return <Badge bg="secondary">Unknown</Badge>;
//     }
//   };

//   // Format countdown text
//   const countdownText = `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`;

//   return (
//     <div className="card border-0 shadow-sm">
//       <div className="card-body">
//         <div className="d-flex align-items-center mb-4">
//           <div className="bg-primary bg-opacity-10 p-3 rounded-circle me-3">
//             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-qr-code text-primary" viewBox="0 0 16 16">
//               <path d="M2 2h2v2H2V2Zm4 0h2v2H6V2Zm4 0h2v2h-2V2Zm4 0h2v2h-2V2Zm2 4h2v2h-2V6Zm0 4h2v2h-2v-2Zm0 4h2v2h-2v-2ZM2 6h2v2H2V6Zm0 4h2v2H2v-2Zm0 4h2v2H2v-2Zm4-8h2v2H6V6Zm0 4h2v2H6v-2Zm0 4h2v2H6v-2Zm4-8h2v2h-2V6Zm0 4h2v2h-2v-2Zm0 4h2v2h-2v-2Z" />
//             </svg>
//           </div>
//           <div>
//             <h5 className="fw-bold mb-0">Gym Check-in QR Code</h5>
//             <p className="text-muted mb-0">Show this QR code at the reception</p>
//           </div>
//         </div>

//         <div className="text-center mb-3">
//           <div className="d-inline-block p-3 bg-white rounded-3 border shadow-sm">
//             <QRCodeCanvas value={qrValue} size={200} level="M" />
//           </div>
//         </div>


//         <div className="text-center mb-3">
//           <div className="d-flex justify-content-center align-items-center mb-2">
//             <div className="me-2">
//               <small className="text-muted">Valid until:</small>
//               <div className="fw-medium">{formattedExpiryDate}</div>
//             </div>
//             <div className="ms-2">
//               <div className="badge bg-primary fs-6">{countdownText}</div>
//             </div>
//           </div>
//         </div>

//         {/* Check-in button */}
//         <div className="text-center mb-4">
//           <Button
//             variant="primary"
//             onClick={handleCheckIn}
//             disabled={loading}
//             className="px-4"
//           >
//             {loading ? (
//               <>
//                 <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
//                 <span className="ms-2">Checking in...</span>
//               </>
//             ) : (
//               "Manual Check-in"
//             )}
//           </Button>
//         </div>

//         {/* Success message */}
//         {checkinSuccess && (
//           <Alert variant="success" className="mb-3">
//             {checkinSuccess}
//           </Alert>
//         )}

//         {/* Error message */}
//         {error && (
//           <Alert variant="danger" className="mb-3">
//             {error}
//           </Alert>
//         )}


//         {/* History Table */}
//         <div className="mt-4">
//           <h6 className="fw-bold mb-3">Today's Check-in History</h6>
//           {historyLoading ? (
//             <div className="text-center py-3">
//               <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
//               <span className="ms-2">Loading history...</span>
//             </div>
//           ) : (
//             <div className="table-responsive">
//               <table className="table table-sm">
//                 <thead>
//                   <tr>
//                     <th>Attendance ID</th>
//                     <th>Member ID</th>
//                     <th>Check In</th>
//                     <th>Check Out</th>
//                     <th>Mode</th>
//                     <th>Notes</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {history.length === 0 ? (
//                     <tr>
//                       <td colSpan="5" className="text-center text-muted">No check-in history for today</td>
//                     </tr>
//                   ) : (
//                     history.map((entry) => (
//                       <tr key={entry.id}>
//                         <td>{entry.id}</td>
//                         <td>{entry.memberId}</td>
//                         <td>{format(entry.checkIn, 'MMM dd, yyyy HH:mm:ss')}</td>
//                         <td>
//                           {entry.checkOut
//                             ? format(entry.checkOut, 'MMM dd, yyyy HH:mm:ss')
//                             : <span className="text-muted">Still in gym</span>}
//                         </td>
//                         <td>
//                           <Badge bg="info">{entry.mode}</Badge>
//                         </td>
//                         <td>
//                           <Badge bg="info">{entry.notes}</Badge>
//                         </td>
//                       </tr>
//                     ))
//                   )}
//                 </tbody>
//               </table>

//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default HouseKeepingQrCheckin;


import React from 'react';
import UniversalQRAttendance from '../../Components/UniversalQRAttendance';

/**
 * HouseKeepingQrCheckin - Housekeeping QR Code Check-in Component
 * 
 * Uses the UniversalQRAttendance component which:
 * - Scans the admin's global QR code
 * - Works for all user roles
 * - Provides check-in/checkout functionality
 * - Displays attendance history
 */
const HouseKeepingQrCheckin = () => {
  return <UniversalQRAttendance />;
};

export default HouseKeepingQrCheckin;