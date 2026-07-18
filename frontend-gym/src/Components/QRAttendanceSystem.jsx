import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Alert, Spinner, Badge, Form, InputGroup } from 'react-bootstrap';
import { FaQrcode, FaSearch, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import QRScanner from './QRScanner';
import axiosInstance from '../Api/axiosInstance';
import { format } from 'date-fns';

/**
 * QR Attendance System Component
 * For receptionists/staff to scan member QR codes and mark attendance
 */
const QRAttendanceSystem = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, completed

  // Get user data
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const branchId = userData.branchId || 1;

  // Fetch today's attendance
  useEffect(() => {
    fetchTodayAttendance();
  }, []);

  const fetchTodayAttendance = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const response = await axiosInstance.get('memberattendence/today', {
        params: {
          branchId: branchId,
          startDate: today.toISOString(),
          endDate: tomorrow.toISOString()
        }
      });

      if (response.data.success) {
        setAttendance(response.data.attendance || []);
      } else {
        setAttendance([]);
      }
    } catch (err) {
      // If endpoint doesn't exist, try alternative
      try {
        const altResponse = await axiosInstance.get('memberattendence');
        if (altResponse.data.success) {
          // Filter for today's records
          const today = new Date().toDateString();
          const todayAttendance = (altResponse.data.attendance || []).filter(record => {
            const recordDate = new Date(record.checkIn).toDateString();
            return recordDate === today;
          });
          setAttendance(todayAttendance);
        }
      } catch (altErr) {
        setError('Unable to fetch attendance data');
        setAttendance([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQRScanSuccess = async (qrData) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Validate member ID from QR code
      const memberId = qrData.member_id;
      if (!memberId) {
        setError('Invalid QR code: Member ID not found');
        return;
      }

      // Check if member is already checked in (active session)
      const activeSession = attendance.find(
        record => record.memberId === memberId && !record.checkOut
      );

      if (activeSession) {
        // Member is already checked in, offer checkout
        const checkout = window.confirm(
          `Member ${qrData.member_name || memberId} is already checked in. Do you want to check them out?`
        );
        
        if (checkout) {
          await handleCheckout(activeSession.id);
        }
        return;
      }

      // Perform check-in
      const response = await axiosInstance.post('memberattendence/checkin', {
        memberId: memberId,
        branchId: branchId,
        mode: 'QR Code',
        notes: `Scanned QR Code - Nonce: ${qrData.nonce}`
      });

      if (response.data.success) {
        setSuccess(`✅ ${qrData.member_name || `Member ${memberId}`} checked in successfully!`);
        // Refresh attendance list
        await fetchTodayAttendance();
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.data.message || 'Check-in failed');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error processing check-in';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (attendanceId) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await axiosInstance.post(`memberattendence/checkout/${attendanceId}`, {
        branchId: branchId
      });

      if (response.data.success) {
        setSuccess('✅ Check-out successful!');
        await fetchTodayAttendance();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.data.message || 'Check-out failed');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error during check-out';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Filter attendance based on search and status
  const filteredAttendance = attendance.filter(record => {
    const matchesSearch = 
      !searchTerm ||
      (record.memberId && record.memberId.toString().includes(searchTerm)) ||
      (record.fullName && record.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = 
      filterStatus === 'all' ||
      (filterStatus === 'active' && !record.checkOut) ||
      (filterStatus === 'completed' && record.checkOut);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container-fluid p-3">
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <FaQrcode className="me-2" />
            QR Code Attendance System
          </h5>
          <Button
            variant="light"
            onClick={() => setShowScanner(true)}
            disabled={loading}
          >
            <FaQrcode className="me-2" />
            Scan QR Code
          </Button>
        </Card.Header>
        <Card.Body>
          {/* Success/Error Messages */}
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

          {/* Filters */}
          <div className="row mb-3">
            <div className="col-md-6">
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search by member ID or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </div>
            <div className="col-md-6">
              <Form.Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active (Checked In)</option>
                <option value="completed">Completed (Checked Out)</option>
              </Form.Select>
            </div>
          </div>

          {/* Attendance Table */}
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
          ) : (
            <div className="table-responsive">
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Member ID</th>
                    <th>Name</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Mode</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendance.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center text-muted py-4">
                        No attendance records found
                      </td>
                    </tr>
                  ) : (
                    filteredAttendance.map((record) => (
                      <tr key={record.id}>
                        <td>{record.memberId}</td>
                        <td>{record.fullName || `Member ${record.memberId}`}</td>
                        <td>
                          {record.checkIn 
                            ? format(new Date(record.checkIn), 'MMM dd, yyyy HH:mm:ss')
                            : '-'}
                        </td>
                        <td>
                          {record.checkOut 
                            ? format(new Date(record.checkOut), 'MMM dd, yyyy HH:mm:ss')
                            : <span className="text-muted">Still in gym</span>}
                        </td>
                        <td>
                          <Badge bg="info">{record.mode || 'Manual'}</Badge>
                        </td>
                        <td>
                          {record.checkOut ? (
                            <Badge bg="success">
                              <FaCheckCircle className="me-1" />
                              Completed
                            </Badge>
                          ) : (
                            <Badge bg="warning">
                              <FaTimesCircle className="me-1" />
                              Active
                            </Badge>
                          )}
                        </td>
                        <td>
                          {!record.checkOut && (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleCheckout(record.id)}
                              disabled={loading}
                            >
                              Check Out
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          )}

          {/* Summary */}
          {attendance.length > 0 && (
            <div className="mt-3 d-flex justify-content-between">
              <div>
                <strong>Total Records:</strong> {attendance.length}
              </div>
              <div>
                <strong>Active:</strong> {attendance.filter(r => !r.checkOut).length} | 
                <strong> Completed:</strong> {attendance.filter(r => r.checkOut).length}
              </div>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* QR Scanner Modal */}
      <QRScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScanSuccess={handleQRScanSuccess}
        title="Scan Member QR Code for Check-in"
      />
    </div>
  );
};

export default QRAttendanceSystem;

