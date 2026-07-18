import React, { useState, useEffect } from "react";
import { Form, Button, Table, Modal, Row, Col, Card, Spinner, Alert } from "react-bootstrap";
import { FaEye, FaTrash, FaTimesCircle } from "react-icons/fa";
import axiosInstance from '../../Api/axiosInstance';
import { House } from "react-bootstrap-icons";

const MemberAttendance = () => {
  const [search, setSearch] = useState("");
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewMember, setViewMember] = useState(null);
  const [dateFilter, setDateFilter] = useState(""); // New date filter
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get user data from localStorage
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const memberId = userData.id;
  const branchId = userData.branchId || 1;

  // Fetch attendance data
  useEffect(() => {
    fetchAttendanceData();
  }, [memberId, branchId]);

  // Function to format date consistently
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    // Get the date in YYYY-MM-DD format in local timezone
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).split('/').reverse().join('-');
  };

  // Function to format date for display in UI
  const formatDateForUI = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Function to fetch attendance data
  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Using API endpoint for member attendance
      const response = await axiosInstance.get(`memberattendence/${memberId}`);
      const data = response.data;

      if (data.success && data.attendance) {
        // Transform API response to match expected format
        const transformedAttendance = data.attendance.map(entry => ({
          attendance_id: entry.id,
          member_id: entry.memberId,
          name: entry.fullName || `Member ID: ${entry.memberId}`,
          status: entry.status || 'Present', // Using status directly from API
          checkin_time: entry.checkIn ? new Date(entry.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "",
          checkout_time: entry.checkOut ? new Date(entry.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "",
          checkin_date: entry.checkIn ? formatDateForDisplay(entry.checkIn) : "", // Using our new date formatting function
          checkin_date_ui: entry.checkIn ? formatDateForUI(entry.checkIn) : "", // For UI display
          mode: entry.mode,
          notes: entry.notes,
          computedStatus: entry.status, // Using status directly from API
          checkedOut: entry.checkOut ? true : false // Add checkedOut status
        }));

        setAttendance(transformedAttendance);
      } else {
        // If there's no data or an error, set empty array
        setAttendance([]);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error fetching data';
      setError(errorMessage);
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  // Delete member via API
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      try {
        // Show loading state for specific member
        setAttendance(attendance.map(member =>
          member.attendance_id === id
            ? { ...member, deleting: true }
            : member
        ));

        const response = await fetch(`${BaseUrl}memberattendence/delete/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        const data = await response.json();

        if (data.success) {
          // Refresh attendance data after successful deletion
          fetchAttendanceData();
          alert('Record deleted successfully!');
        } else {
          alert(data.message || 'Delete failed');
          // Remove loading state
          setAttendance(attendance.map(member =>
            member.attendance_id === id
              ? { ...member, deleting: false }
              : member
          ));
        }
      } catch (err) {
        console.error('Error during deletion:', err);
        alert(`Error during deletion: ${err.message}`);
        // Remove loading state
        setAttendance(attendance.map(member =>
          member.attendance_id === id
            ? { ...member, deleting: false }
            : member
        ));
      }
    }
  };

  // Check out member via API
  const handleCheckout = async (id) => {
    try {
      // Show loading state for specific member
      setAttendance(attendance.map(member =>
        member.attendance_id === id
          ? { ...member, checkingOut: true }
          : member
      ));

      // Try PUT first (correct method), fallback to POST if needed
      let response;
      try {
        response = await axiosInstance.put(`memberattendence/checkout/${id}`, {
          memberId: memberId,
          branchId: branchId
        });
      } catch (putErr) {
        // If PUT fails, try POST (some backends use POST)
        response = await axiosInstance.post(`memberattendence/checkout/${id}`, {
          memberId: memberId,
          branchId: branchId
        });
      }

      const data = response.data;

      if (data.success) {
        // Update the specific member to show checked out status
        setAttendance(attendance.map(member =>
          member.attendance_id === id
            ? {
              ...member,
              checkingOut: false,
              checkedOut: true,
              checkout_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
            : member
        ));
        alert('Check-out successful!');
      } else {
        alert(data.message || 'Check-out failed');
        // Remove loading state
        setAttendance(attendance.map(member =>
          member.attendance_id === id
            ? { ...member, checkingOut: false }
            : member
        ));
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error during check-out';
      alert(errorMessage);
      // Remove loading state
      setAttendance(attendance.map(member =>
        member.attendance_id === id
          ? { ...member, checkingOut: false }
          : member
      ));
    }
  };

  // Filtered attendance with date filter
  const filteredAttendance = attendance.filter((m) => {
    // If no date filter is set, return all records
    if (!dateFilter) return true;
    
    // Filter by date - compare in YYYY-MM-DD format
    return m.checkin_date === dateFilter;
  });

  return (
    <div className="p-3 p-md-4 bg-white rounded shadow">
      <h2 className="mb-2 mb-md-3 fw-bold">Attendance Management</h2>
      <p className="text-muted mb-3 mb-md-4">
        Manage and track attendance records for gym members.
      </p>

      {/* Error message */}
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : (
        <>
          {/* Date Filter Row */}
          <Row className="mb-4 g-2 g-md-3">
            <Col xs={12} sm={6} md={4}>
              <Form.Control
                type="date"
                placeholder="Filter by date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </Col>
          </Row>

          {/* Desktop Table View */}
          <div className="table-responsive d-none d-md-block">
            <Table bordered hover responsive className="align-middle">
              <thead style={{ backgroundColor: "#f8f9fa" }}>
                <tr>
                  <th>Member ID</th>
                  <th>Date</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th>Mode</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendance.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center text-muted">No attendance records found</td>
                  </tr>
                ) : (
                  filteredAttendance.map((member) => (
                    <tr key={member.attendance_id}>
                      <td>{member.member_id}</td>
                      <td>{member.checkin_date_ui || "--"}</td>
                      <td>{member.checkin_time || "--"}</td>
                      <td>{member.checkout_time || "--"}</td>
                      <td>
                        <Form.Select
                          size="sm"
                          value={member.mode || ""}
                          onChange={(e) => {
                            setAttendance(attendance.map(m =>
                              m.attendance_id === member.attendance_id
                                ? { ...m, mode: e.target.value }
                                : m
                            ));
                          }}
                        >
                          <option value="">-------Select-------</option>
                          <option value="QR">QR</option>
                          <option value="Manual">Manual</option>
                          <option value="App">App</option>
                        </Form.Select>
                      </td>
                      <td>
                        <Form.Control
                          type="text"
                          size="sm"
                          value={member.notes || ""}
                          onChange={(e) => {
                            setAttendance(attendance.map(m =>
                              m.attendance_id === member.attendance_id
                                ? { ...m, notes: e.target.value }
                                : m
                            ));
                          }}
                        />
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button
                            variant="outline-dark"
                            size="sm"
                            onClick={() => {
                              setViewMember(member);
                              setShowViewModal(true);
                            }}
                          >
                            <FaEye />
                          </Button>
                          {/* Checkout button - show only if not checked out */}
                          {!member.checkedOut ? (
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => handleCheckout(member.attendance_id)}
                              disabled={member.checkingOut}
                            >
                              {member.checkingOut ? (
                                <>
                                  <Spinner as="span" animation="border" size="sm" />
                                  <span className="ms-1">Checking out...</span>
                                </>
                              ) : (
                                <>
                                  <FaTimesCircle />
                                  <span className="ms-1">Check-out</span>
                                </>
                              )}
                            </Button>
                          ) : (
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              disabled
                            >
                              <span className="ms-1">Checked Out</span>
                            </Button>
                          )}
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(member.attendance_id)}
                            disabled={member.deleting}
                          >
                            {member.deleting ? (
                              <Spinner as="span" animation="border" size="sm" />
                            ) : (
                              <FaTrash />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="d-md-none">
            {filteredAttendance.length === 0 ? (
              <div className="text-center py-5 text-muted">No attendance records found</div>
            ) : (
              filteredAttendance.map((member) => (
                <Card key={member.attendance_id} className="mb-3">
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{member.name}</strong>
                      <div className="text-muted small">ID: {member.member_id}</div>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    <Row className="mb-2">
                      <Col xs={6}>
                        <small className="text-muted">Date:</small>
                        <div>{member.checkin_date_ui || "--"}</div>
                      </Col>
                      <Col xs={6}>
                        <small className="text-muted">Check-in:</small>
                        <div>{member.checkin_time || "--"}</div>
                      </Col>
                    </Row>
                    <Row className="mb-2">
                      <Col xs={6}>
                        <small className="text-muted">Check-out:</small>
                        <div>{member.checkout_time || "--"}</div>
                      </Col>
                    </Row>

                    <Row className="mb-2">
                      <Col xs={12}>
                        <small className="text-muted">Mode:</small>
                        <Form.Select
                          size="sm"
                          value={member.mode || ""}
                          onChange={(e) => {
                            setAttendance(attendance.map(m =>
                              m.attendance_id === member.attendance_id
                                ? { ...m, mode: e.target.value }
                                : m
                            ));
                          }}
                          className="mt-1"
                        >
                          <option value="">--Select--</option>
                          <option value="QR">QR</option>
                          <option value="Manual">Manual</option>
                          <option value="App">App</option>
                        </Form.Select>
                      </Col>
                    </Row>

                    <Row className="mb-2">
                      <Col xs={12}>
                        <small className="text-muted">Notes:</small>
                        <Form.Control
                          type="text"
                          size="sm"
                          value={member.notes || ""}
                          onChange={(e) => {
                            setAttendance(attendance.map(m =>
                              m.attendance_id === member.attendance_id
                                ? { ...m, notes: e.target.value }
                                : m
                            ));
                          }}
                          className="mt-1"
                        />
                      </Col>
                    </Row>

                    <div className="d-flex gap-2 mt-3">
                      <Button
                        variant="outline-dark"
                        size="sm"
                        onClick={() => {
                          setViewMember(member);
                          setShowViewModal(true);
                        }}
                      >
                        <FaEye />
                      </Button>
                      {/* Checkout button - show only if not checked out */}
                      {!member.checkedOut ? (
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => handleCheckout(member.attendance_id)}
                          disabled={member.checkingOut}
                        >
                          {member.checkingOut ? (
                            <>
                              <Spinner as="span" animation="border" size="sm" />
                              <span className="ms-1">Checking out...</span>
                            </>
                          ) : (
                            <>
                              <FaTimesCircle />
                                  <span className="ms-1">Check-out</span>
                                </>
                              )}
                        </Button>
                      ) : (
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          disabled
                        >
                          <span className="ms-1">Checked Out</span>
                        </Button>
                      )}
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(member.attendance_id)}
                        disabled={member.deleting}
                      >
                        {member.deleting ? (
                          <Spinner as="span" animation="border" size="sm" />
                        ) : (
                          <FaTrash />
                        )}
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              ))
            )}
          </div>
        </>
      )}

      {/* View Modal */}
      <Modal
        show={showViewModal}
        onHide={() => setShowViewModal(false)}
        centered
        size="md"
      >
        <Modal.Header closeButton>
          <Modal.Title>Attendance Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {viewMember && (
            <>
              <p><b>Member ID:</b> {viewMember.member_id}</p>
              <p><b>Name:</b> {viewMember.name}</p>
              <p><b>Date:</b> {viewMember.checkin_date_ui || "--"}</p>
              <p><b>Check-in:</b> {viewMember.checkin_time || "--"}</p>
              <p><b>Check-out:</b> {viewMember.checkout_time || "--"}</p>
              <p><b>Mode:</b> {viewMember.mode || "--"}</p>
              <p><b>Notes:</b> {viewMember.notes || "--"}</p>
            </>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default MemberAttendance;