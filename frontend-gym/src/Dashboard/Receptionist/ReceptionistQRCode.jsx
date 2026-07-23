import React, { useState, useEffect } from "react";
import { Form, Button, Table, Modal, Row, Col, Card, Spinner, Alert } from "react-bootstrap";
import { FaEye, FaTrash, FaTimesCircle, FaDownload } from "react-icons/fa";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import axiosInstance from '../../Api/axiosInstance';

const ReceptionistQRCode = () => {
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
  const branchId = userData.branchId || 1;

  // Fetch attendance data
  useEffect(() => {
    fetchAttendanceData();
  }, [memberId, branchId]);

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
        const transformedAttendance = data.attendance.map(entry => {
          // Calculate work hours
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
            member_id: entry.memberId,
            name: entry.fullName || `Member ID: ${entry.memberId}`,
            status: entry.computedStatus === 'Active' ? 'Present' :
              entry.computedStatus === 'Completed' ? 'Present' : 'Absent',
            checkin_time: entry.checkIn ? new Date(entry.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "",
            checkout_time: entry.checkOut ? new Date(entry.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "",
            mode: entry.mode,
            notes: entry.notes,
            computedStatus: entry.computedStatus,
            checkedOut: entry.checkOut ? true : false,
            workHours: workHours
          };
        });

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

        const response = await axiosInstance.delete(`memberattendence/delete/${id}`);
        const data = response.data;

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
        const errorMessage = err.response?.data?.message || err.message || 'Error during deletion';
        alert(errorMessage);
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

      const response = await axiosInstance.put(`memberattendence/checkout/${id}`, {
        memberId: memberId,
        branchId: branchId
      });

      const data = response.data;

      if (data.success) {
        // Update specific member to show checked out status
        setAttendance(attendance.map(member => {
          if (member.attendance_id === id) {
            const checkoutNow = new Date();
            const checkoutTimeStr = checkoutNow.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            // Calculate work hours from checkin to now
            let workHours = '--';
            if (member.checkin_time) {
              // Parse the checkin_time string back to a comparable time today
              const [timePart, period] = member.checkin_time.split(' ');
              let [hours, minutes] = timePart.split(':').map(Number);
              if (period === 'PM' && hours !== 12) hours += 12;
              if (period === 'AM' && hours === 12) hours = 0;
              const checkInDate = new Date();
              checkInDate.setHours(hours, minutes, 0, 0);
              const diffMs = checkoutNow - checkInDate;
              if (diffMs > 0) {
                const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                workHours = `${diffHours}h ${diffMinutes}m`;
              }
            }

            return {
              ...member,
              checkingOut: false,
              checkedOut: true,
              checkout_time: checkoutTimeStr,
              workHours: workHours
            };
          }
          return member;
        }));
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

  const exportToExcel = () => {
    if (filteredAttendance.length === 0) {
      alert("No attendance records available to export.");
      return;
    }
    const dataToExport = filteredAttendance.map((m) => ({
      "Attendance ID": m.attendance_id,
      "Member ID": m.member_id,
      "Member Name": m.name,
      "Check-in": m.checkin_time || "—",
      "Check-out": m.checkout_time || "—",
      "Work Hours": m.workHours || "—",
      "Mode": m.mode || "—",
      "Notes": m.notes || "",
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Daily Attendance");
    XLSX.writeFile(workbook, `Daily_Attendance_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = () => {
    if (filteredAttendance.length === 0) {
      alert("No attendance records available to export.");
      return;
    }
    const doc = new jsPDF();
    doc.text("Daily Attendance Report", 14, 15);
    const tableColumn = ["ID", "Member Name", "Check-in", "Check-out", "Work Hours", "Mode", "Notes"];
    const tableRows = filteredAttendance.map((m) => [
      m.attendance_id,
      m.name,
      m.checkin_time || "—",
      m.checkout_time || "—",
      m.workHours || "—",
      m.mode || "—",
      m.notes || "",
    ]);
    autoTable(doc, {
      startY: 20,
      head: [tableColumn],
      body: tableRows,
    });
    doc.save(`Daily_Attendance_${new Date().toISOString().split('T')[0]}.pdf`);
  };

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
          {/* Filters Row */}
          <Row className="mb-4 g-2 g-md-3 align-items-center">
            <Col xs={12} sm={6} md={4}>
              <Form.Control
                type="text"
                placeholder="Filter by Member ID"
                value={filters.memberId}
                onChange={(e) =>
                  setFilters({ ...filters, memberId: e.target.value })
                }
              />
            </Col>
            <Col xs={12} sm={6} md={4}>
              <Form.Control
                type="text"
                placeholder="Filter by Member Name"
                value={filters.memberName}
                onChange={(e) =>
                  setFilters({ ...filters, memberName: e.target.value })
                }
              />
            </Col>
            <Col xs={12} sm={6} md={4} className="d-flex justify-content-start justify-content-md-end">
              {/* Export Data Dropdown */}
              <div className="dropdown">
                <button
                  className="btn btn-success fw-semibold dropdown-toggle d-flex align-items-center gap-2"
                  style={{ borderRadius: '8px', padding: '6px 14px', fontWeight: '500' }}
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <FaDownload /> Export Data
                </button>
                <ul className="dropdown-menu dropdown-menu-end shadow border-0">
                  <li>
                    <button className="dropdown-item d-flex align-items-center gap-2 text-success fw-medium" onClick={exportToExcel}>
                      <strong className="text-success">XLSX</strong> Export to Excel
                    </button>
                  </li>
                  <li>
                    <button className="dropdown-item d-flex align-items-center gap-2 text-danger fw-medium" onClick={exportToPDF}>
                      <strong className="text-danger">PDF</strong> Export to PDF
                    </button>
                  </li>
                </ul>
              </div>
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
                    <td colSpan="9" className="text-center text-muted">No attendance records found</td>
                  </tr>
                ) : (
                  filteredAttendance.map((member) => (
                    <tr key={member.attendance_id}>
                      <td>{member.attendance_id}</td>
                      <td>{member.checkin_time || "--"}</td>
                      <td>{member.checkout_time || "--"}</td>
                      <td>{member.workHours}</td>
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
                        <small className="text-muted">Check-in:</small>
                        <div>{member.checkin_time || "--"}</div>
                      </Col>
                      <Col xs={6}>
                        <small className="text-muted">Check-out:</small>
                        <div>{member.checkout_time || "--"}</div>
                      </Col>
                    </Row>

                    <Row className="mb-2">
                      <Col xs={6}>
                        <small className="text-muted">Work Hours:</small>
                        <div>{member.workHours}</div>
                      </Col>
                      <Col xs={6}>
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
              <p><b>Attendance ID:</b> {viewMember.attendance_id}</p>
              <p><b>Member ID:</b> {viewMember.member_id}</p>
              <p><b>Name:</b> {viewMember.name}</p>
              <p><b>Check-in:</b> {viewMember.checkin_time || "--"}</p>
              <p><b>Check-out:</b> {viewMember.checkout_time || "--"}</p>
              <p><b>Work Hours:</b> {viewMember.workHours || "--"}</p>
              <p><b>Mode:</b> {viewMember.mode || "--"}</p>
              <p><b>Notes:</b> {viewMember.notes || "--"}</p>
            </>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ReceptionistQRCode;