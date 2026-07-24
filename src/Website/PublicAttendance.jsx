import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { FaCalendarCheck } from 'react-icons/fa';
import axiosInstance from '../Api/axiosInstance';

const PublicAttendance = () => {
  const [searchParams] = useSearchParams();
  const adminId = searchParams.get('adminId');
  const branchId = searchParams.get('branchId');

  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('Member');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleAttendance = async (actionType) => {
    if (!phone || phone.length < 10) {
      setMessage({ type: 'danger', text: 'Please enter a valid phone number.' });
      return;
    }
    
    if (!adminId) {
      setMessage({ type: 'danger', text: 'Invalid QR Code. Admin ID missing.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Endpoint depends on role and action
      const endpoint = `attendance/public/${role.toLowerCase()}/${actionType}`;
      
      const response = await axiosInstance.post(endpoint, {
        phone,
        adminId,
        branchId
      });

      if (response.data.success) {
        setMessage({ 
          type: 'success', 
          text: `Successfully ${actionType === 'checkin' ? 'Checked In' : 'Checked Out'}!` 
        });
        setPhone(''); // Reset phone
      } else {
        setMessage({ type: 'danger', text: response.data.message || 'Action failed.' });
      }
    } catch (error) {
      console.error("Attendance Error:", error);
      setMessage({ 
        type: 'danger', 
        text: error.response?.data?.message || 'Something went wrong. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', backgroundColor: '#f4f7f6' }}>
      <Card className="shadow-lg border-0 rounded-4" style={{ maxWidth: '400px', width: '100%' }}>
        <div className="text-center p-4 rounded-top-4" style={{ backgroundColor: '#2f6a87', color: 'white' }}>
          <FaCalendarCheck size={40} className="mb-2" />
          <h4 className="fw-bold mb-0">Gym Check-in</h4>
          <p className="mb-0 small text-white-50">Mark your attendance instantly</p>
        </div>
        
        <Card.Body className="p-4">
          {message.text && (
            <Alert variant={message.type} className="text-center py-2">
              {message.text}
            </Alert>
          )}

          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold text-secondary">I am a</Form.Label>
              <div className="d-flex gap-3">
                <Form.Check 
                  type="radio"
                  label="Member"
                  name="roleGroup"
                  checked={role === 'Member'}
                  onChange={() => setRole('Member')}
                  id="roleMember"
                />
                <Form.Check 
                  type="radio"
                  label="Staff"
                  name="roleGroup"
                  checked={role === 'Staff'}
                  onChange={() => setRole('Staff')}
                  id="roleStaff"
                />
              </div>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="fw-bold text-secondary">Phone Number</Form.Label>
              <Form.Control
                type="tel"
                placeholder="Enter 10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
                className="py-2"
                style={{ fontSize: '1.1rem' }}
              />
            </Form.Group>

            <div className="d-flex gap-2">
              <Button 
                variant="primary" 
                className="w-50 py-2 fw-bold"
                style={{ backgroundColor: '#2f6a87', border: 'none' }}
                onClick={() => handleAttendance('checkin')}
                disabled={loading}
              >
                {loading ? <Spinner size="sm" /> : 'Check In'}
              </Button>
              <Button 
                variant="outline-secondary" 
                className="w-50 py-2 fw-bold"
                onClick={() => handleAttendance('checkout')}
                disabled={loading}
              >
                Check Out
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default PublicAttendance;
