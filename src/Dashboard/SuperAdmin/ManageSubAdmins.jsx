import React, { useState, useEffect } from "react";
import axiosInstance from "../../Api/axiosInstance";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaUserShield, FaEdit, FaTrash, FaCheck, FaEye, FaEyeSlash } from "react-icons/fa";

const ManageSubAdmins = () => {
  const [subadmins, setSubadmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    fullName: "",
    email: "",
    phone: "",
    password: "",
    profileImage: null,
    permissions: []
  });
  const [visiblePasswords, setVisiblePasswords] = useState({});

  const availableModules = [
    "Dashboard",
    "Leads / Inquiries",
    "Gym Owners",
    "Request Plan",
    "Plans & Pricing",
    "Payments",
    "Announcements",
    "Trial & Automation",
    "Setting"
  ];

  useEffect(() => {
    fetchSubadmins();
  }, []);

  const fetchSubadmins = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/subadmins");
      if (res.data.success) {
        setSubadmins(res.data.data);
      }
    } catch (error) {
      toast.error("Failed to fetch sub-admins");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (module) => {
    setFormData((prev) => {
      const perms = prev.permissions.includes(module)
        ? prev.permissions.filter((p) => p !== module)
        : [...prev.permissions, module];
      return { ...prev, permissions: perms };
    });
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, profileImage: e.target.files[0] }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || (!formData.id && !formData.password)) {
      return toast.warning("Please fill all required fields");
    }

    try {
      const formPayload = new FormData();
      formPayload.append("fullName", formData.fullName);
      formPayload.append("email", formData.email);
      formPayload.append("phone", formData.phone);
      if (formData.password) {
        formPayload.append("password", formData.password);
      }
      formPayload.append("permissions", JSON.stringify(formData.permissions));
      if (formData.profileImage) {
        formPayload.append("profileImage", formData.profileImage);
      }

      if (formData.id) {
        const res = await axiosInstance.put(`/subadmins/${formData.id}`, formPayload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (res.data.success) toast.success("Sub-Admin updated successfully");
      } else {
        const res = await axiosInstance.post("/subadmins", formPayload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (res.data.success) toast.success("Sub-Admin created successfully");
      }
      setShowModal(false);
      fetchSubadmins();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error saving Sub-Admin");
    }
  };

  const handleEdit = (sub) => {
    let perms = [];
    try {
      perms = typeof sub.permissions === 'string' ? JSON.parse(sub.permissions) : sub.permissions;
    } catch(e) {}
    
    setFormData({
      id: sub.id,
      fullName: sub.fullName,
      email: sub.email,
      phone: sub.phone || "",
      password: "",
      profileImage: null,
      permissions: Array.isArray(perms) ? perms : []
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this Sub-Admin?")) {
      try {
        await axiosInstance.delete(`/subadmins/${id}`);
        toast.success("Sub-Admin deleted");
        fetchSubadmins();
      } catch (error) {
        toast.error("Error deleting Sub-Admin");
      }
    }
  };

  const togglePasswordVisibility = (id) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: "#f4f7f6", minHeight: "100vh" }}>
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold mb-1" style={{ color: "#2c3e50" }}>Manage Sub-Admins</h3>
          <p className="text-muted mb-0">Create assistants and manage their access permissions.</p>
        </div>
        <button 
          className="btn btn-primary rounded-pill px-4 py-2"
          style={{ width: "fit-content" }}
          onClick={() => {
            setFormData({ id: null, fullName: "", email: "", phone: "", password: "", profileImage: null, permissions: [] });
            setShowModal(true);
          }}
        >
          + Add Sub-Admin
        </button>
      </div>

      <div className="card shadow-sm border-0 rounded-4">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
            </div>
          ) : subadmins.length === 0 ? (
            <div className="text-center py-5 text-muted">No Sub-Admins found.</div>
          ) : (
            <div className="table-responsive px-3">
              <table className="table table-hover align-middle mb-0 mt-3">
                <thead className="bg-light rounded-3">
                  <tr>
                    <th className="py-3 px-4 text-muted small fw-semibold">Name</th>
                    <th className="py-3 px-4 text-muted small fw-semibold">Email</th>
                    <th className="py-3 px-4 text-muted small fw-semibold">Phone</th>
                    <th className="py-3 px-4 text-muted small fw-semibold">Password</th>
                    <th className="py-3 px-4 text-muted small fw-semibold">Permissions</th>
                    <th className="py-3 px-4 text-end text-muted small fw-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subadmins.map((sub) => {
                    let perms = [];
                    try {
                      perms = typeof sub.permissions === 'string' ? JSON.parse(sub.permissions) : sub.permissions;
                    } catch(e) {}

                    return (
                      <tr key={sub.id} className="border-bottom">
                        <td className="py-3 px-4 fw-semibold text-dark">
                          <FaUserShield className="text-primary me-2" />
                          {sub.fullName}
                        </td>
                        <td className="py-3 px-4 text-muted">{sub.email}</td>
                        <td className="py-3 px-4 text-muted">{sub.phone || "-"}</td>
                        <td className="py-3 px-4 text-dark font-monospace small">
                          <div className="d-flex align-items-center gap-2">
                            {visiblePasswords[sub.id] ? (sub.visiblePassword || "Not Set") : "••••••••"}
                            <button 
                              className="btn btn-link text-muted p-0 border-0" 
                              onClick={() => togglePasswordVisibility(sub.id)}
                              title={visiblePasswords[sub.id] ? "Hide Password" : "Show Password"}
                            >
                              {visiblePasswords[sub.id] ? <FaEyeSlash /> : <FaEye />}
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="d-flex flex-wrap gap-1">
                            {Array.isArray(perms) && perms.map((p, idx) => (
                              <span key={idx} className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill px-2 py-1">
                                {p}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="d-flex justify-content-md-end gap-2 text-nowrap">
                            <button className="btn btn-sm btn-light text-primary rounded-circle" onClick={() => handleEdit(sub)} title="Edit">
                              <FaEdit />
                            </button>
                            <button className="btn btn-sm btn-light text-danger rounded-circle" onClick={() => handleDelete(sub.id)} title="Delete">
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-bottom-0 pb-0">
                <h5 className="modal-title fw-bold">{formData.id ? "Edit" : "Add"} Sub-Admin</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body pt-3">
                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-muted">Full Name</label>
                    <input type="text" className="form-control border-1 rounded-3" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-muted">Email Address</label>
                    <input type="email" className="form-control border-1 rounded-3" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required autoComplete="new-password" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-muted">Phone Number</label>
                    <input type="text" className="form-control border-1 rounded-3" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                  </div>
                  <div className="mb-4">
                    <label className="form-label fw-semibold small text-muted">Password {formData.id && <span className="fw-normal text-secondary">(Leave blank to keep current)</span>}</label>
                    <input type="password" className="form-control border-1 rounded-3" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required={!formData.id} autoComplete="new-password" />
                  </div>
                  <div className="mb-4">
                    <label className="form-label fw-semibold small text-muted">Profile Image</label>
                    <input type="file" className="form-control border-1 rounded-3" accept="image/*" onChange={handleFileChange} />
                  </div>

                  <h6 className="fw-bold text-dark mb-3">Module Permissions</h6>
                  <div className="row g-2">
                    {availableModules.map((module) => (
                      <div className="col-6" key={module}>
                        <div 
                          className={`card border-1 rounded-3 cursor-pointer p-2 ${formData.permissions.includes(module) ? 'border-primary bg-primary bg-opacity-10' : ''}`}
                          style={{ cursor: "pointer", transition: "all 0.2s" }}
                          onClick={() => handleCheckboxChange(module)}
                        >
                          <div className="d-flex align-items-center gap-2">
                            <div className={`rounded-circle d-flex align-items-center justify-content-center ${formData.permissions.includes(module) ? 'bg-primary text-white' : 'bg-light text-muted border'}`} style={{ width: "20px", height: "20px", fontSize: "10px" }}>
                              {formData.permissions.includes(module) && <FaCheck />}
                            </div>
                            <span className={`small fw-semibold ${formData.permissions.includes(module) ? 'text-primary' : 'text-muted'}`}>{module}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="modal-footer border-top-0 pt-0">
                  <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary rounded-pill px-4">Save Sub-Admin</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageSubAdmins;
