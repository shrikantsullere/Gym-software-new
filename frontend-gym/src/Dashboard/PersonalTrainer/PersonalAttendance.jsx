import React, { useState, useEffect } from "react";
import { Form, Button, Table, Modal, Row, Col, Card, Spinner, Alert } from "react-bootstrap";
import { FaEye, FaTrash, FaTimesCircle } from "react-icons/fa";
import BaseUrl from '../../Api/BaseUrl';
import * as XLSX from "xlsx";

const PersonalAttendance = () => {
  const [search, setSearch] = useState("");
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewMember, setViewMember] = useState(null);
  const [filters, setFilters] = useState({
    memberId: "",
    memberName: "",
  });
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get user data from localStorage
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const memberId = userData.id;
  const adminId = userData.adminId || userData.id;
  const branchId = userData.branchId || 1;

  // Fetch attendance data
  useEffect(() => {
    fetchAttendanceData();
  }, [adminId, memberId, branchId]);

  // Function to fetch attendance data
  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch attendance entries for this admin/branch
      const response = await fetch(`${BaseUrl}memberattendence/admin?adminId=${adminId}&category=all`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      
      if (data.success && data.attendance) {
        // Filter ONLY actual check-in entries (excluding synthetic absent rows)
        const actualEntries = data.attendance.filter(entry => 
          entry.checkIn && (!entry.id || !String(entry.id).startsWith('absent'))
        );

        const transformedAttendance = actualEntries.map(entry => {
          const checkInTime = entry.checkIn ? new Date(entry.checkIn) : null;
          const checkOutTime = entry.checkOut ? new Date(entry.checkOut) : null;
          let workHours = "--";

          if (checkInTime && checkOutTime) {
            const diffMs = checkOutTime - checkInTime;
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            workHours = `${diffHours}h ${diffMinutes}m`;
          }

          return {
            attendance_id: entry.id,
            member_id: entry.memberId || entry.staffId || "-",
            name: entry.name || entry.fullName || `ID: ${entry.memberId || entry.staffId}`,
            status: entry.status || (entry.checkOut ? 'Present' : 'Active'),
            checkin_time: entry.checkIn ? new Date(entry.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--",
            checkout_time: entry.checkOut ? new Date(entry.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--",
            workHours: workHours,
            mode: entry.mode || "Manual",
            notes: entry.notes || "Manual Check-in",
            computedStatus: entry.computedStatus || entry.status,
            checkedOut: entry.checkOut ? true : false
          };
        });
        
        setAttendance(transformedAttendance);
      } else {
        setAttendance([]);
      }
    } catch (err) {
      console.error('Error fetching attendance data:', err);
      setError(`Error fetching data: ${err.message}`);
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  // Delete attendance record via API
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      try {
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
          fetchAttendanceData();
          alert('Record deleted successfully!');
        } else {
          alert(data.message || 'Delete failed');
          setAttendance(attendance.map(member => 
            member.attendance_id === id 
              ? { ...member, deleting: false }
              : member
          ));
        }
      } catch (err) {
        console.error('Error during deletion:', err);
        alert(`Error during deletion: ${err.message}`);
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
      setAttendance(attendance.map(member => 
        member.attendance_id === id 
          ? { ...member, checkingOut: true }
          : member
      ));

      const response = await fetch(`${BaseUrl}memberattendence/checkout/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
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
        fetchAttendanceData();
      } else {
        alert(data.message || 'Check-out failed');
        setAttendance(attendance.map(member => 
          member.attendance_id === id 
            ? { ...member, checkingOut: false }
            : member
        ));
      }
    } catch (err) {
      console.error('Error during checkout:', err);
      alert(`Error during check-out: ${err.message}`);
      setAttendance(attendance.map(member => 
        member.attendance_id === id 
          ? { ...member, checkingOut: false }
          : member
      ));
    }
  };

  // Filtered attendance
  const filteredAttendance = attendance.filter((m) => {
    return (
      (filters.memberId
        ? m.member_id.toString().includes(filters.memberId)
        : true) &&
      (filters.memberName
        ? m.name.toLowerCase().includes(filters.memberName.toLowerCase())
        : true) &&
      (search ? m.name.toLowerCase().includes(search.toLowerCase()) : true)
    );
  });

  const handleExport = () => {
    if (filteredAttendance.length === 0) {
      alert("No data available to export.");
      return;
    }
    
    const exportData = filteredAttendance.map(item => ({
      "Attendance ID": item.attendance_id,
      "Check-In": item.checkin_time || "--",
      "Check-Out": item.checkout_time || "--",
      "Work Hours": item.workHours || "--",
      "Mode": item.mode || "Manual",
      "Notes": item.notes || ""
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

    XLSX.writeFile(workbook, `Attendance_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="p-3 p-md-4 bg-white rounded shadow">
      <h2 className="mb-2 mb-md-3 fw-bold">Attendance Management</h2>
      <p className="text-muted mb-3 mb-md-4">
        Manage and track attendance records for gym members.
      </p>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : (
        <>
          {/* Filters Row */}
          <Row className="mb-4 g-2 g-md-3">
            <Col xs={12} sm={6} md={5}>
              <Form.Control
                type="text"
                placeholder="Filter by Member ID"
                value={filters.memberId}
                onChange={(e) =>
                  setFilters({ ...filters, memberId: e.target.value })
                }
              />
            </Col>
            <Col xs={12} sm={6} md={5}>
              <Form.Control
                type="text"
                placeholder="Filter by Member Name"
                value={filters.memberName}
                onChange={(e) =>
                  setFilters({ ...filters, memberName: e.target.value })
                }
              />
            </Col>
            <Col xs={12} sm={12} md={2} className="d-flex justify-content-start justify-content-md-end">
              <Button variant="outline-secondary" onClick={handleExport} className="w-100 w-md-auto">Export</Button>
            </Col>
          </Row>

          {/* Desktop Table View */}
          <div className="table-responsive d-none d-md-block">
            <Table bordered hover responsive className="align-middle">
              <thead style={{ backgroundColor: "#f8f9fa" }}>
                <tr>
                  <th>Attendance ID</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th>Work Hours</th>
                  <th>Mode</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendance.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center text-muted py-4">No attendance records found</td>
                  </tr>
                ) : (
                  filteredAttendance.map((member) => (
                    <tr key={member.attendance_id}>
                      <td className="fw-semibold">{member.attendance_id}</td>
                      <td>{member.checkin_time || "--"}</td>
                      <td>{member.checkout_time || "--"}</td>
                      <td>{member.workHours || "--"}</td>
                      <td>
                        <Form.Select
                          size="sm"
                          value={member.mode || "Manual"}
                          onChange={(e) => {
                            setAttendance(attendance.map(m =>
                              m.attendance_id === member.attendance_id
                                ? { ...m, mode: e.target.value }
                                : m
                            ));
                          }}
                        >
                          <option value="Manual">Manual</option>
                          <option value="QR">QR</option>
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
                          placeholder="Notes"
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
                      <strong>Attendance ID: {member.attendance_id}</strong>
                      <div className="text-muted small">{member.name}</div>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    <Row className="mb-2">
                      <Col xs={6}>
                        <small className="text-muted">Check-in:</small>
                        <div>{member.checkin_time || "--"}</div>
                      </Col>
                      <Col xs={6}>
                        <small className="text-muted">Check-out:</small>
                        <div>{member.checkout_time || "--"}</div>
                      </Col>
                    </Row>

                    <Row className="mb-2">
                      <Col xs={12}>
                        <small className="text-muted">Work Hours:</small>
                        <div>{member.workHours || "--"}</div>
                      </Col>
                    </Row>
                    
                    <Row className="mb-2">
                      <Col xs={12}>
                        <small className="text-muted">Mode:</small>
                        <Form.Select
                          size="sm"
                          value={member.mode || "Manual"}
                          onChange={(e) => {
                            setAttendance(attendance.map(m =>
                              m.attendance_id === member.attendance_id
                                ? { ...m, mode: e.target.value }
                                : m
                            ));
                          }}
                          className="mt-1"
                        >
                          <option value="Manual">Manual</option>
                          <option value="QR">QR</option>
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

          {/* View Member Attendance Details Modal */}
          <Modal show={showViewModal} onHide={() => setShowViewModal(false)} centered>
            <Modal.Header closeButton>
              <Modal.Title>Attendance Details</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {viewMember && (
                <div>
                  <p><b>Attendance ID:</b> {viewMember.attendance_id}</p>
                  <p><b>Member / Staff Name:</b> {viewMember.name}</p>
                  <p><b>Check-in Time:</b> {viewMember.checkin_time || "--"}</p>
                  <p><b>Check-out Time:</b> {viewMember.checkout_time || "--"}</p>
                  <p><b>Work Hours:</b> {viewMember.workHours || "--"}</p>
                  <p><b>Mode:</b> {viewMember.mode || "Manual"}</p>
                  <p><b>Notes:</b> {viewMember.notes || "--"}</p>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowViewModal(false)}>
                Close
              </Button>
            </Modal.Footer>
          </Modal>
        </>
      )}
    </div>
  );
};

export default PersonalAttendance;