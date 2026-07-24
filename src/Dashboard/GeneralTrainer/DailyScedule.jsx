import React, { useState } from "react";
import { Table, Button, Form, Modal, Badge, Row, Col } from "react-bootstrap";
import { FaEye, FaTrash } from "react-icons/fa";

const DailyClassSchedule = () => {
  const [search, setSearch] = useState("");
  const [viewClass, setViewClass] = useState(null);
  
  // Trainers List (id → name mapping)
  const trainers = [
    { id: "T001", name: "Amit Verma" },
    { id: "T002", name: "Sneha Kapoor" },
    { id: "T003", name: "Ravi Sharma" },
  ];
  
  const [filters, setFilters] = useState({
    className: "",
    time: "",
  });
  
  const [classes, setClasses] = useState([
    {
      class_schedule_id: "C001",
      trainer_id: "T001",
      class_name: "Morning Yoga",
      start_time: "07:00",
      end_time: "08:00",
      room_name: "Room A",
      capacity: 20,
      booked_seats: 15,
      status: "Scheduled",
    },
    {
      class_schedule_id: "C002",
      trainer_id: "T002",
      class_name: "Evening Zumba",
      start_time: "18:00",
      end_time: "19:00",
      room_name: "Room B",
      capacity: 25,
      booked_seats: 25,
      status: "Completed",
    },
    {
      class_schedule_id: "C003",
      trainer_id: "T003",
      class_name: "HIIT Training",
      start_time: "10:00",
      end_time: "11:00",
      room_name: "Hall C",
      capacity: 30,
      booked_seats: 10,
      status: "Scheduled",
    },
    {
      class_schedule_id: "C004",
      trainer_id: "T001",
      class_name: "Spinning Class",
      start_time: "17:00",
      end_time: "18:00",
      room_name: "Studio D",
      capacity: 15,
      booked_seats: 12,
      status: "Scheduled",
    },
    {
      class_schedule_id: "C005",
      trainer_id: "T002",
      class_name: "Group Yoga",
      start_time: "19:00",
      end_time: "20:00",
      room_name: "Room A",
      capacity: 20,
      booked_seats: 18,
      status: "Scheduled",
    },
  ]);
  
  // Get trainer name from ID
  const getTrainerName = (id) =>
    trainers.find((t) => t.id === id)?.name || id;
  
  // delete class
  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this class?")) {
      setClasses(classes.filter((c) => c.class_schedule_id !== id));
    }
  };
  
  // apply filters
  const filteredClasses = classes.filter((c) => {
    const className = c.class_name.toLowerCase();
    const time = `${c.start_time}-${c.end_time}`;
    
    return (
      (filters.className ? className.includes(filters.className.toLowerCase()) : true) &&
      (filters.time ? time.includes(filters.time) : true) &&
      (search ? className.includes(search.toLowerCase()) : true)
    );
  });
  
  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="mb-2 fw-bold">Today's Class Schedule</h2>
      <p className="text-muted mb-4">
        View today's fitness classes with timings and availability
      </p>
      
      {/* Filters */}
      <Row className="mb-3 g-2">
        <Col md={6}>
          <Form.Control
            type="text"
            placeholder="Filter by Class Name"
            value={filters.className}
            onChange={(e) =>
              setFilters({ ...filters, className: e.target.value })
            }
          />
        </Col>
      
      <Col md={3} >
              <Button variant="outline-secondary me-2 ms-5">Filter</Button>
              <Button variant="outline-secondary">Export</Button>
            </Col>
        <Col md={3}>
          {/* Empty column to maintain layout */}
        </Col>
      </Row>
      
      {/* Table */}
      <Table bordered hover responsive className="align-middle">
        <thead style={{ backgroundColor: "#f8f9fa" }}>
          <tr>
            <th>Class Name</th>
            <th>Time</th>
            <th>Room/Location</th>
            <th>Booked/Capacity</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredClasses.map((cls) => {
            const remaining = cls.capacity - cls.booked_seats;
            return (
              <tr key={cls.class_schedule_id}>
                <td className="fw-semibold">{cls.class_name}</td>
                <td>
                  <span className="badge bg-primary me-1">{cls.start_time}</span>
                  <span>to</span>
                  <span className="badge bg-primary ms-1">{cls.end_time}</span>
                </td>
                <td>{cls.room_name || "--"}</td>
                <td>
                  <div className="d-flex align-items-center">
                    <span className="me-2">{cls.booked_seats}/{cls.capacity}</span>
                    <div className="progress flex-grow-1" style={{ height: '10px' }}>
                      <div 
                        className={`progress-bar ${remaining > 5 ? 'bg-success' : remaining > 0 ? 'bg-warning' : 'bg-danger'}`}
                        role="progressbar"
                        style={{ width: `${(cls.booked_seats / cls.capacity) * 100}%` }}
                        aria-valuenow={cls.booked_seats}
                        aria-valuemin={0}
                        aria-valuemax={cls.capacity}
                      ></div>
                    </div>
                  </div>
                </td>
                <td>
                  {cls.status === "Scheduled" && (
                    <Badge bg="success">Scheduled</Badge>
                  )}
                  {cls.status === "Completed" && (
                    <Badge bg="secondary">Completed</Badge>
                  )}
                  {cls.status === "Canceled" && (
                    <Badge bg="danger">Canceled</Badge>
                  )}
                </td>
                <td>
                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-dark"
                      size="sm"
                      onClick={() => setViewClass(cls)}
                    >
                      <FaEye />
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDelete(cls.class_schedule_id)}
                    >
                      <FaTrash />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
      
      {/* View Modal */}
      <Modal show={!!viewClass} onHide={() => setViewClass(null)} centered size="md">
        <Modal.Header closeButton>
          <Modal.Title>Class Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {viewClass && (
            <div>
              <p><strong>Class Name:</strong> {viewClass.class_name}</p>
              <p><strong>Trainer:</strong> {getTrainerName(viewClass.trainer_id)}</p>
              <p><strong>Time:</strong> {viewClass.start_time} - {viewClass.end_time}</p>
              <p><stron>Room:</stron> {viewClass.room_name || "--"}</p>
              <p><strong>Capacity:</strong> {viewClass.capacity}</p>
              <p><strong>Booked Seats:</strong> {viewClass.booked_seats}</p>
              <p><strong>Remaining Seats:</strong> {viewClass.capacity - viewClass.booked_seats}</p>
              <p>
                <strong>Status:</strong>{" "}
                <Badge
                  bg={
                    viewClass.status === "Scheduled"
                      ? "success"
                      : viewClass.status === "Completed"
                      ? "secondary"
                      : "danger"
                  }
                >
                  {viewClass.status}
                </Badge>
              </p>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default DailyClassSchedule;