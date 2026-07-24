import React, { useState, useEffect } from "react";
import { Button, Table, Modal, Form, Badge, Spinner } from "react-bootstrap";
import { FaEdit, FaTrash, FaMapMarkerAlt, FaCrosshairs } from "react-icons/fa";
import axiosInstance from "../../../Api/axiosInstance";

const BranchManagement = () => {
    const [showModal, setShowModal] = useState(false);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [gpsLoading, setGpsLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const adminId = user.adminId || user.id;

    const emptyForm = {
        id: null,
        name: "",
        phone: "",
        address: "",
        attendanceRadiusMeters: 50,
        latitude: "",
        longitude: "",
        status: "ACTIVE",
    };

    const [formData, setFormData] = useState(emptyForm);
    const [modalType, setModalType] = useState("add");

    // Fetch branches from DB
    const fetchBranches = async () => {
        try {
            setLoading(true);
            const res = await axiosInstance.get(`/branch/${adminId}`);
            if (res.data.success) {
                setBranches(res.data.branches || res.data.data || []);
            }
        } catch (err) {
            console.error("Error fetching branches:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBranches();
    }, []);

    const handleShowModal = (type, branch = null) => {
        setModalType(type);
        if (type === "edit" && branch) {
            setFormData({
                id: branch.id,
                name: branch.name || "",
                phone: branch.phone || "",
                address: branch.address || "",
                attendanceRadiusMeters: branch.attendanceRadiusMeters || 50,
                latitude: branch.latitude || "",
                longitude: branch.longitude || "",
                status: branch.status || "ACTIVE",
            });
        } else {
            setFormData(emptyForm);
        }
        setShowModal(true);
    };

    // Auto-detect GPS location
    const detectMyLocation = () => {
        if (!navigator.geolocation) {
            alert("GPS not supported in this browser.");
            return;
        }
        setGpsLoading(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setFormData((prev) => ({
                    ...prev,
                    latitude: pos.coords.latitude.toFixed(8),
                    longitude: pos.coords.longitude.toFixed(8),
                }));
                setGpsLoading(false);
            },
            () => {
                alert("Could not get location. Please allow location access and try again.");
                setGpsLoading(false);
            },
            { timeout: 10000 }
        );
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const payload = {
                name: formData.name,
                phone: formData.phone,
                address: formData.address,
                attendanceRadiusMeters: parseInt(formData.attendanceRadiusMeters) || 50,
                latitude: formData.latitude ? parseFloat(formData.latitude) : null,
                longitude: formData.longitude ? parseFloat(formData.longitude) : null,
                status: formData.status,
                adminId: adminId,
            };

            if (modalType === "add") {
                await axiosInstance.post("/branch", payload);
                alert("Branch added successfully!");
            } else {
                await axiosInstance.put(`/branch/${formData.id}`, payload);
                alert("Branch updated successfully!");
            }
            setShowModal(false);
            fetchBranches();
        } catch (err) {
            console.error("Save error:", err);
            alert(err.response?.data?.message || "Failed to save branch.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this branch?")) {
            try {
                await axiosInstance.delete(`/branch/${id}`);
                fetchBranches();
                alert("Branch deleted successfully!");
            } catch (err) {
                alert(err.response?.data?.message || "Failed to delete branch.");
            }
        }
    };

    if (loading) return <div className="text-center py-5"><Spinner animation="border" /></div>;

    return (
        <div className="p-3">
            <h2 className="mb-4 mt-2">🏢 Branch Settings</h2>

            {user.role === "Superadmin" && (
                <div className="d-flex justify-content-end mb-3">
                    <Button
                        style={{ backgroundColor: "#2f6a87", borderColor: "#2f6a87" }}
                        onClick={() => handleShowModal("add")}
                    >
                        + Add New Branch
                    </Button>
                </div>
            )}

            <Table bordered hover responsive>
                <thead className="table-dark">
                    <tr>
                        <th>Branch Name</th>
                        <th>Phone</th>
                        <th>Address</th>
                        <th>GPS Set?</th>
                        <th>Radius (m)</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {branches.length === 0 ? (
                        <tr><td colSpan={7} className="text-center text-muted py-4">No branches found.</td></tr>
                    ) : (
                        branches.map((branch) => (
                            <tr key={branch.id}>
                                <td><strong>{branch.name}</strong></td>
                                <td>{branch.phone || "—"}</td>
                                <td>{branch.address || "—"}</td>
                                <td>
                                    {branch.latitude && branch.longitude ? (
                                        <Badge bg="success">✅ GPS Set</Badge>
                                    ) : (
                                        <Badge bg="warning" text="dark">❌ Not Set</Badge>
                                    )}
                                </td>
                                <td>{branch.attendanceRadiusMeters || 50}m</td>
                                <td>
                                    <Badge bg={branch.status === "ACTIVE" ? "success" : "secondary"}>
                                        {branch.status}
                                    </Badge>
                                </td>
                                <td>
                                    <div className="d-flex gap-2">
                                        <Button size="sm" variant="outline-primary" onClick={() => handleShowModal("edit", branch)}>
                                            <FaEdit />
                                        </Button>
                                        <Button size="sm" variant="outline-danger" onClick={() => handleDelete(branch.id)}>
                                            <FaTrash />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </Table>

            {/* Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{modalType === "add" ? "Add Branch" : "Edit Branch"}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-2">
                            <Form.Label>Branch Name *</Form.Label>
                            <Form.Control
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Andheri Branch"
                            />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Phone</Form.Label>
                            <Form.Control
                                type="text"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="e.g. 9999999999"
                            />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Address</Form.Label>
                            <Form.Control
                                type="text"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                placeholder="e.g. 123 Main St, Mumbai"
                            />
                        </Form.Group>

                        {/* GPS SECTION */}
                        <hr />
                        <div className="d-flex align-items-center mb-2">
                            <FaMapMarkerAlt className="text-danger me-2" />
                            <strong>GPS Location (for Attendance Security)</strong>
                        </div>
                        <div className="bg-light p-2 rounded mb-2 small text-muted">
                            📍 Set the gym's exact GPS location. Members will only be able to mark attendance if they are within the allowed radius.
                        </div>
                        <div className="d-flex gap-2 mb-2">
                            <Form.Control
                                type="text"
                                placeholder="Latitude (e.g. 19.07283)"
                                value={formData.latitude}
                                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                            />
                            <Form.Control
                                type="text"
                                placeholder="Longitude (e.g. 72.88261)"
                                value={formData.longitude}
                                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                            />
                        </div>
                        <Button
                            variant="outline-success"
                            size="sm"
                            className="mb-3 w-100"
                            onClick={detectMyLocation}
                            disabled={gpsLoading}
                        >
                            {gpsLoading ? (
                                <><Spinner size="sm" className="me-1" /> Detecting Location...</>
                            ) : (
                                <><FaCrosshairs className="me-1" /> Auto-Detect My Current Location</>
                            )}
                        </Button>

                        <Form.Group className="mb-2">
                            <Form.Label>Allowed Attendance Radius (meters)</Form.Label>
                            <Form.Control
                                type="number"
                                min={10}
                                max={500}
                                value={formData.attendanceRadiusMeters}
                                onChange={(e) => setFormData({ ...formData, attendanceRadiusMeters: e.target.value })}
                            />
                            <Form.Text className="text-muted">
                                Members must be within this many meters of the gym to scan QR. Default: 50m
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-2">
                            <Form.Label>Status</Form.Label>
                            <Form.Select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="ACTIVE">Active</option>
                                <option value="INACTIVE">Inactive</option>
                            </Form.Select>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                    <Button
                        style={{ backgroundColor: "#2f6a87", borderColor: "#2f6a87" }}
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? <Spinner size="sm" className="me-1" /> : null}
                        Save Branch
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default BranchManagement;
