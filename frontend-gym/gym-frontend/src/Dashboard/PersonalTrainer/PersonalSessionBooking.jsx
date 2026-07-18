import React, { useState, useEffect } from "react";
import {
  FaCheck,
  FaTimes,
  FaEdit,
  FaTrash,
  FaSearch,
  FaFilter,
  FaUser,
  FaPlus,
  FaEye,
} from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import axiosInstance from "../../Api/axiosInstance";
import BaseUrl from "../../Api/BaseUrl";

const PersonalSessionBooking = () => {
  const [sessions, setSessions] = useState([]);
  const [branches, setBranches] = useState([]);
  const [trainers, setTrainers] = useState([]);

  const [statusFilter, setStatusFilter] = useState("All");
  const [branchFilter, setBranchFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddSessionModal, setShowAddSessionModal] = useState(false);
  const [showViewSessionModal, setShowViewSessionModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getUserFromStorage = () => {
    try {
      const userStr = localStorage.getItem("user");
      return userStr ? JSON.parse(userStr) : null;
    } catch (err) {
      console.error("Error parsing user from localStorage:", err);
      return null;
    }
  };

  const user = getUserFromStorage();
  const memberId = user?.id || null;
  const branchId = user?.branchId || null;
  const name = user?.fullName || null;
  const staffId = user?.staffId || null;
  const adminId = user?.adminId || null;

  const customColor = "#6EB2CC";

  useEffect(() => {
    fetchBranches();
    // fetchTrainers();
    fetchSessions(); // Added direct fetchSessions() call
  }, [adminId]);

  // ✅ FIXED: Fetch sessions from /sessions/ and use res.data.data
  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`sessions/${adminId}/${memberId}`); // ✅ Correct endpoint
      if (res.data.success && Array.isArray(res.data.data)) {
        // ✅ API already includes trainerName — no enrichment needed
        setSessions(res.data.data);
      } else {
        setError("Failed to load sessions");
        setSessions([]);
      }
    } catch (err) {
      console.error("Error fetching sessions:", err);
      setError("Unable to load sessions");
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  // FIX: Fetch Branches with correct URL
  const fetchBranches = async () => {
    try {
      const res = await axiosInstance.get(`branches/by-admin/${adminId}`);
      let branchList = [];
      if (res.data.success) {
        if (res.data.branches && Array.isArray(res.data.branches)) {
          branchList = res.data.branches;
        }
      }
      setBranches(branchList);
    } catch (err) {
      console.error("Error fetching branches:", err);
      setBranches([]);
    }
  };

  // Added fetchTrainers function to get trainers from API
  // const fetchTrainers = async () => {
  //     try {
  //         const res = await axiosInstance.get(`class/trainers/personal-general`);
  //         let trainerList = [];
  //         if (res.data.success && res.data.trainers) {
  //             trainerList = res.data.trainers;
  //         }
  //         setTrainers(trainerList);
  //     } catch (err) {
  //         console.error('Error fetching trainers:', err);
  //         setTrainers([]);
  //     }
  // };

  // Re-fetch sessions when trainers load to get trainer names
  useEffect(() => {
    if (trainers.length > 0 && adminId) {
      fetchSessions();
    }
  }, [trainers]);

  const filteredSessions = sessions.filter((session) => {
    const matchesStatus =
      statusFilter === "All" || session.status === statusFilter;
    const matchesBranch =
      branchFilter === "All" || session.branchName === branchFilter;
    const matchesSearch =
      !searchQuery ||
      session.sessionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (session.trainerName || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    return matchesStatus && matchesBranch && matchesSearch;
  });

  const formatDate = (isoStr) => (isoStr ? isoStr.split("T")[0] : "");
  const formatTimeDisplay = (time24) => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHour = hours % 12 || 12;
    return `${displayHour}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  // Helper function to get the correct status badge class
  const getStatusBadgeClass = (status) => {
    if (!status) return "";

    // Handle both "Complete" and "Completed" as the same status
    const normalizedStatus = status.toLowerCase();

    if (normalizedStatus === "complete" || normalizedStatus === "completed") {
      return "bg-success";
    } else if (
      normalizedStatus === "cancelled" ||
      normalizedStatus === "canceled"
    ) {
      return "bg-danger";
    } else if (normalizedStatus === "upcoming") {
      return ""; // Will use custom color
    }

    return "bg-secondary"; // Default for any other status
  };

  // Helper function to check if status is "Upcoming"
  const isUpcomingStatus = (status) => {
    if (!status) return false;
    return status.toLowerCase() === "upcoming";
  };

  const handleViewSession = (session) => {
    setSelectedSession(session);
    setShowViewSessionModal(true);
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await axiosInstance.put(`${BaseUrl}sessions/status/${id}`, {
        status: newStatus,
      });
      if (res.data.success) {
        setSessions(
          sessions.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
        );
        if (selectedSession && selectedSession.id === id) {
          setSelectedSession({ ...selectedSession, status: newStatus });
        }
      } else {
        alert("Failed to update status");
      }
    } catch (err) {
      console.error("Status update error:", err);
      alert("Error updating session status");
    }
  };

  const handleDeleteSession = async () => {
    if (!selectedSession) return;
    setLoading(true);
    try {
      const res = await axiosInstance.delete(
        `${BaseUrl}sessions/delete/${selectedSession.id}`
      );
      if (res.data.success) {
        setSessions(sessions.filter((s) => s.id !== selectedSession.id));
        setShowDeleteModal(false);
        setShowViewSessionModal(false);
        setSelectedSession(null);
        alert("✅ Session deleted!");
      } else {
        setError("Failed to delete session");
      }
    } catch (err) {
      console.error("Delete error:", err);
      setError(err.response?.data?.message || "Failed to delete session");
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (session) => {
    setSelectedSession(session);
    setShowDeleteModal(true);
  };

  const uniqueBranchNames = [
    ...new Set(sessions.map((s) => s.branchName).filter(Boolean)),
  ];

  const timeOptions = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const h = hour.toString().padStart(2, "0");
      const m = minute.toString().padStart(2, "0");
      timeOptions.push(`${h}:${m}`);
    }
  }

  const SessionCard = ({ session }) => (
    <div className="card mb-3 shadow-sm">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <h5 className="card-title mb-0">{session.sessionName}</h5>
          <span
            className={`badge ${getStatusBadgeClass(session.status)}`}
            style={
              isUpcomingStatus(session.status)
                ? { backgroundColor: customColor }
                : {}
            }
          >
            {session.status}
          </span>
        </div>
        <div className="row mb-2">
          <div className="col-6">
            <p className="mb-1">
              <FaUser className="me-1" style={{ color: customColor }} />{" "}
              {session.trainerName || "—"}
            </p>
            <p className="mb-1">
              <strong>Date:</strong> {formatDate(session.date)}
            </p>
          </div>
          <div className="col-6">
            <p className="mb-1">
              <strong>Time:</strong> {formatTimeDisplay(session.time)}
            </p>
            <p className="mb-1">
              <strong>Duration:</strong> {session.duration} min
            </p>
          </div>
        </div>
        <div className="d-flex justify-content-between align-items-center mb-2">
          {/* Commented out branch field */}
          {/* <span className="badge bg-light text-dark">{session.branchName || '—'}</span> */}
          <div className="btn-group btn-group-sm" role="group">
            <button
              className="btn"
              style={{ borderColor: customColor, color: customColor }}
              title="View"
              onClick={() => handleViewSession(session)}
            >
              <FaEye />
            </button>
            <button
              className="btn btn-outline-danger"
              title="Delete"
              onClick={() => openDeleteModal(session)}
            >
              <FaTrash />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container-fluid px-3 px-md-4 py-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">Session Bookings</h2>
      </div>

      <div className="card shadow-sm">
        <div className="card-header bg-light">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-4 col-lg-3">
              <div className="input-group">
                <span className="input-group-text">
                  <FaSearch />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search sessions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="col-6 col-md-3 col-lg-2">
              <div className="input-group">
                <span className="input-group-text">
                  <FaFilter />
                </span>
                <select
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">All Statuses</option>
                  <option value="Upcoming">Upcoming</option>
                  <option value="Complete">Complete</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="card-body p-0">
          {loading && sessions.length === 0 ? (
            <div className="text-center py-5">
              <div
                className="spinner-border text-primary"
                role="status"
                style={{ color: customColor }}
              >
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Loading sessions...</p>
            </div>
          ) : filteredSessions.length > 0 ? (
            <>
              <div className="d-none d-md-block">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Session Name</th>
                        <th>Trainer</th>
                        <th>Date & Time</th>
                        {/* Commented out branch column */}
                        {/* <th>Branch</th> */}
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSessions.map((s) => (
                        <tr key={s.id}>
                          <td>{s.sessionName}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <FaUser
                                className="me-2"
                                style={{ color: customColor }}
                              />
                              <span>{s.trainerName || "—"}</span>
                            </div>
                          </td>
                          <td>
                            <div>{formatDate(s.date)}</div>
                            <div className="text-muted small">
                              {formatTimeDisplay(s.time)}
                            </div>
                          </td>
                          <td>
                            <span
                              className={`badge ${getStatusBadgeClass(
                                s.status
                              )}`}
                              style={
                                isUpcomingStatus(s.status)
                                  ? { backgroundColor: customColor }
                                  : {}
                              }
                            >
                              {s.status}
                            </span>
                          </td>
                          <td>
                            <div className="btn-group" role="group">
                              <button
                                className="btn btn-sm"
                                style={{
                                  borderColor: customColor,
                                  color: customColor,
                                }}
                                title="View"
                                onClick={() => handleViewSession(s)}
                              >
                                <FaEye />
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                title="Delete"
                                onClick={() => openDeleteModal(s)}
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="d-md-none p-3">
                {filteredSessions.map((s) => (
                  <SessionCard key={s.id} session={s} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <p>No sessions found</p>
            </div>
          )}
        </div>
      </div>

      {/* View Session Modal */}
      {showViewSessionModal && selectedSession && (
        <>
          <div
            className="modal fade show d-block"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content">
                <div
                  className="modal-header"
                  style={{ backgroundColor: customColor, color: "white" }}
                >
                  <h5 className="modal-title">{selectedSession.sessionName}</h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowViewSessionModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <h6 className="text-muted">Session Information</h6>
                    <div className="row g-2">
                      <div className="col-12 col-md-6">
                        <p>
                          <strong>Trainer:</strong>{" "}
                          {selectedSession.trainerName || "—"}
                        </p>
                      </div>
                      <div className="col-12 col-md-6">
                        <p>
                          <strong>Date:</strong>{" "}
                          {formatDate(selectedSession.date)}
                        </p>
                      </div>
                      <div className="col-12 col-md-6">
                        <p>
                          <strong>Time:</strong>{" "}
                          {formatTimeDisplay(selectedSession.time)}
                        </p>
                      </div>
                      <div className="col-12 col-md-6">
                        <p>
                          <strong>Duration:</strong> {selectedSession.duration}{" "}
                          minutes
                        </p>
                      </div>
                      {/* Commented out branch field */}
                      {/* <div className="col-12 col-md-6">
                        <p><strong>Branch:</strong> {selectedSession.branchName || '—'}</p>
                      </div> */}
                      <div className="col-12 col-md-6">
                        <p>
                          <strong>Status:</strong>{" "}
                          <span
                            className={`badge ${getStatusBadgeClass(
                              selectedSession.status
                            )}`}
                            style={
                              isUpcomingStatus(selectedSession.status)
                                ? { backgroundColor: customColor }
                                : {}
                            }
                          >
                            {selectedSession.status}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <h6 className="text-muted">Description</h6>
                    <p>{selectedSession.description || "—"}</p>
                  </div>
                </div>
                <div className="modal-footer">
                  <div className="d-flex flex-wrap gap-2 w-100">
                    {selectedSession.status === "Upcoming" && (
                      <>
                        <button
                          className="btn btn-success flex-fill flex-md-grow-0"
                          onClick={() =>
                            handleStatusChange(selectedSession.id, "Complete")
                          }
                        >
                          <FaCheck className="me-1" /> Complete
                        </button>
                        <button
                          className="btn btn-danger flex-fill flex-md-grow-0"
                          onClick={() =>
                            handleStatusChange(selectedSession.id, "Cancelled")
                          }
                        >
                          <FaTimes className="me-1" /> Cancel
                        </button>
                      </>
                    )}
                    <button
                      className="btn btn-outline-danger flex-fill flex-md-grow-0"
                      onClick={() => openDeleteModal(selectedSession)}
                    >
                      <FaTrash className="me-1" /> Delete
                    </button>
                    <button
                      className="btn btn-secondary flex-fill flex-md-grow-0"
                      onClick={() => setShowViewSessionModal(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}

      {/* Delete Confirmation */}
      {showDeleteModal && selectedSession && (
        <>
          <div
            className="modal fade show d-block"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div
                  className="modal-header"
                  style={{ backgroundColor: customColor, color: "white" }}
                >
                  <h5 className="modal-title">Delete Session</h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowDeleteModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <p>Are you sure you want to delete this session?</p>
                  <div className="alert alert-light">
                    <div className="row g-2">
                      <div className="col-12">
                        <strong>Session:</strong> {selectedSession.sessionName}
                      </div>
                      <div className="col-12">
                        <strong>Trainer:</strong> {selectedSession.trainerName}
                      </div>
                      {/* Commented out branch field */}
                      {/* <div className="col-12"><strong>Branch:</strong> {selectedSession.branchName}</div> */}
                      <div className="col-12">
                        <strong>Date & Time:</strong>{" "}
                        {formatDate(selectedSession.date)} at{" "}
                        {formatTimeDisplay(selectedSession.time)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowDeleteModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={handleDeleteSession}
                    disabled={loading}
                  >
                    {loading ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}
    </div>
  );
};

export default PersonalSessionBooking;
