import React, { useState } from "react";
import { Form, Button, Table, Row, Col, Modal } from "react-bootstrap";
import { FaTrash, FaEye } from "react-icons/fa";

const MemberInteraction = () => {
  const [feedbackList, setFeedbackList] = useState([
    {
      id: 1,
      member: "Rahul Sharma",
      date: "2025-09-08",
      type: "Suggestion",
      subject: "Add More Zumba Classes",
      message: "Evening batches are always full, please add more.",
    },
    {
      id: 2,
      member: "Sneha Patel",
      date: "2025-09-07",
      type: "Feedback",
      subject: "Great Trainers",
      message: "Trainers are very helpful and supportive!",
    },
    {
      id: 3,
      member: "Amit Verma",
      date: "2025-09-06",
      type: "Complaint",
      subject: "Broken Equipment",
      message: "Treadmill is not working properly in Gym.",
    },
    {
      id: 4,
      member: "Priya Singh",
      date: "2025-09-05",
      type: "Feedback",
      subject: "Clean Environment",
      message: "Gym is always neat and clean.",
    },
  ]);

  // filters ke liye state
  const [filters, setFilters] = useState({
    date: "",
    type: "",
    subject: "",
  });

  // Modal state for viewing details
  const [showModal, setShowModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  // Delete feedback
  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this feedback?")) {
      setFeedbackList(feedbackList.filter((fb) => fb.id !== id));
    }
  };

  // View feedback details
  const handleView = (feedback) => {
    setSelectedFeedback(feedback);
    setShowModal(true);
  };

  // filter logic
  const filteredFeedback = feedbackList.filter((fb) => {
    return (
      (filters.date ? fb.date === filters.date : true) &&
      (filters.type ? fb.type === filters.type : true) &&
      (filters.subject
        ? fb.subject.toLowerCase().includes(filters.subject.toLowerCase())
        : true)
    );
  });

  return (
    <div className="mx-2 mt-4">
      <h2 className="mb-4">Member Interaction (Feedback & Suggestions)</h2>

      {/* Filters */}
      <Row className="mb-3 g-2 align-items-center">
        <Col md={4}>
          <Form.Control
            type="date"
            value={filters.date}
            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
          />
        </Col>
        <Col md={4}>
          <Form.Select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          >
            <option value="">Filter by Type</option>
            <option value="Feedback">Feedback</option>
            <option value="Suggestion">Suggestion</option>
            <option value="Complaint">Complaint</option>
          </Form.Select>
        </Col>
        <Col md={3} >
          <Button variant="outline-secondary me-2 ms-5">Filter</Button>
          <Button variant="outline-secondary">Export</Button>
        </Col>
      </Row>

      {/* Feedback Table */}
      <Table bordered hover responsive>
        <thead className="table-white">
          <tr>
            <th>ID</th>
            <th>Member Name</th>
            <th>Date</th>
            <th>Type</th>
            <th>Subject</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredFeedback.map((fb) => (
            <tr key={fb.id}>
              <td>{fb.id}</td>
              <td>{fb.member}</td>
              <td>{fb.date}</td>
              <td>{fb.type}</td>
              <td>{fb.subject}</td>
              <td>
                <Button
                  size="sm"
                  variant="outline-primary"
                  className="me-2"
                  onClick={() => handleView(fb)}
                  title="View Details"
                >
                  <FaEye />
                </Button>
                <Button
                  size="sm"
                  variant="outline-danger"
                  onClick={() => handleDelete(fb.id)}
                  title="Delete"
                >
                  <FaTrash />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* View Details Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Feedback Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedFeedback && (
            <>
              <p><strong>ID:</strong> {selectedFeedback.id}</p>
              <p><strong>Member:</strong> {selectedFeedback.member}</p>
              <p><strong>Date:</strong> {selectedFeedback.date}</p>
              <p><strong>Type:</strong> {selectedFeedback.type}</p>
              <p><strong>Subject:</strong> {selectedFeedback.subject}</p>
              <p><strong>Message:</strong> {selectedFeedback.message}</p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MemberInteraction;