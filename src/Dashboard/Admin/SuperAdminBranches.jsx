// SuperAdminBranches.jsx — Fetches /branches/{userId} dynamically
import React, { useState, useEffect } from "react";
import { FaEye, FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import axiosInstance from "../../Api/axiosInstance";

const BUTTON_COLOR = "#6EB2CC";

const mapStatusToApi = (status) => (status === "Active" ? "ACTIVE" : "INACTIVE");
const mapStatusFromApi = (status) => (status?.toLowerCase() === "active" ? "Active" : "Inactive");

const BranchForm = ({ initial = {}, onSave, onCancel, isLoading }) => {
  const [form, setForm] = useState({
    name: initial.name || "",
    address: initial.address || "",
    phone: initial.phone || "",
    status: mapStatusFromApi(initial.status),
  });

  useEffect(() => {
    setForm({
      name: initial.name || "",
      address: initial.address || "",
      phone: initial.phone || "",
      status: mapStatusFromApi(initial.status),
    });
  }, [initial]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert("Branch name is required");
      return;
    }
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label className="form-label">Branch name</label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          className="form-control"
          disabled={isLoading}
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Address</label>
        <input
          name="address"
          value={form.address}
          onChange={handleChange}
          className="form-control"
          disabled={isLoading}
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Phone</label>
        <input
          name="phone"
          value={form.phone}
          onChange={handleChange}
          className="form-control"
          disabled={isLoading}
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Status</label>
        <select
          name="status"
          value={form.status}
          onChange={handleChange}
          className="form-select"
          disabled={isLoading}
        >
          <option>Active</option>
          <option>Inactive</option>
        </select>
      </div>
      <div className="d-flex justify-content-end gap-2">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn text-white"
          style={{ background: BUTTON_COLOR }}
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
};

const SuperAdminBranches = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState("add");
  const [saving, setSaving] = useState(false);

  // Fetch branches for the current user
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      alert("User not logged in. Redirecting...");
      setLoading(false);
      return;
    }

    const fetchUserBranches = async () => {
      try {
        const role = localStorage.getItem("userRole")?.toUpperCase();
        const response = (role === "ADMIN") 
          ? await axiosInstance.get(`/branches/by-admin/${userId}`)
          : await axiosInstance.get(`/branches`);
        let branchesData = Array.isArray(response.data)
          ? response.data
          : response.data?.branches || response.data?.branch
            ? Array.isArray(response.data.branches)
              ? response.data.branches
              : [response.data.branch]
            : [];

        const normalized = branchesData.map((branch) => ({
          ...branch,
          status: mapStatusFromApi(branch.status),
        }));

        setBranches(normalized);
      } catch (error) {
        console.error("Failed to fetch user branches:", error);
        alert("Failed to load your branches.");
        setBranches([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserBranches();
  }, []);

  const openAdd = () => {
    setMode("add");
    setSelected(null);
    setIsModalOpen(true);
  };

  const openEdit = (branch) => {
    setMode("edit");
    setSelected(branch);
    setIsModalOpen(true);
  };

  const openView = (branch) => {
    setMode("view");
    setSelected(branch);
    setIsModalOpen(true);
  };

  // ✅ FULL DELETE WITH API CALL
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this branch?")) return;

    try {
      await axiosInstance.delete(`/branches/${id}`);
      setBranches((prev) => prev.filter((b) => b.id !== id));
      alert("Branch deleted successfully!");
    } catch (error) {
      console.error("Delete branch error:", error);
      const msg = error?.response?.data?.message || "Failed to delete branch.";
      alert(msg);
    }
  };

// ✅ FULL UPDATE (PUT) WITH API CALL — userId = adminId
const handleSave = async (form) => {
  const userIdStr = localStorage.getItem("userId");
  if (!userIdStr) {
    alert("User not logged in. Please log in again.");
    return;
  }

  const userId = parseInt(userIdStr, 10);
  if (isNaN(userId)) {
    alert("Invalid user ID. Please log in again.");
    return;
  }

  if (mode === "add") {
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      address: form.address.trim() || null,
      phone: form.phone.trim(),
      status: mapStatusToApi(form.status),
      userId: userId,        // 👈 this is also your adminId
      adminId: userId,       // 👈 send same value as adminId
    };

    try {
      const response = await axiosInstance.post("/branches/create", payload);
      const newBranch = {
        ...response.data.branch,
        status: mapStatusFromApi(response.data.branch.status),
      };
      setBranches((prev) => [newBranch, ...prev]);
      alert("Branch created successfully!");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Create branch error:", error);
      const msg = error?.response?.data?.message || "Failed to create branch.";
      alert(msg);
    } finally {
      setSaving(false);
    }
  } else if (mode === "edit" && selected?.id) {
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      address: form.address.trim() || null,
      phone: form.phone.trim(),
      status: mapStatusToApi(form.status),
      adminId: userId, // 👈 again, use userId as adminId
    };

    try {
      const response = await axiosInstance.put(`/branches/${selected.id}`, payload);
      const updatedBranch = {
        ...response.data.branch,
        status: mapStatusFromApi(response.data.branch.status),
      };
      setBranches((prev) =>
        prev.map((b) => (b.id === selected.id ? updatedBranch : b))
      );
      alert("Branch updated successfully!");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Update branch error:", error);
      const msg = error?.response?.data?.message || "Failed to update branch.";
      alert(msg);
    } finally {
      setSaving(false);
    }
  }
};

  const filtered = branches.filter((b) => {
    const q = query.toLowerCase();
    return (
      (b.name?.toLowerCase().includes(q)) ||
      (b.address?.toLowerCase().includes(q)) ||
      (b.phone?.toLowerCase().includes(q))
    );
  });

  return (
    <div className="container-fluid mt-4 px-3 px-md-4">
      {/* TOP SECTION */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
        <div>
          <h4 className="mb-1">Your Branches</h4>
          <small className="text-muted">Manage branches under your account</small>
        </div>
        <div className="d-flex flex-column flex-sm-row gap-2 w-100 w-md-auto">
          <div className="input-group flex-grow-1">
            <input
              className="form-control"
              placeholder="Search branches..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button
            className="btn text-white d-inline-flex align-items-center justify-content-center gap-2 px-4 py-2 shadow-sm"
            style={{
              background: BUTTON_COLOR,
              borderRadius: "6px",
              border: "none",
              fontWeight: "500",
              minWidth: "140px",
            }}
            onClick={openAdd}
            disabled={loading}
          >
            <FaPlus size={14} />
            <span>Add Branch</span>
          </button>
        </div>
      </div>

      {/* LOADING */}
      {loading ? (
        <div className="text-center py-4">Loading your branches...</div>
      ) : (
        <>
          {/* DESKTOP */}
          <div className="card shadow-sm d-none d-md-block">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Name</th>
                      <th>Address</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length > 0 ? (
                      filtered.map((b) => (
                        <tr key={b.id}>
                          <td>{b.name}</td>
                          <td>{b.address || "—"}</td>
                          <td>{b.phone}</td>
                          <td>
                            <span
                              className={`badge ${
                                b.status === "Active" ? "bg-success" : "bg-secondary"
                              }`}
                            >
                              {b.status}
                            </span>
                          </td>
                          <td className="text-end">
                            <div className="btn-group" role="group">
                              <button
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => openView(b)}
                              >
                                <FaEye />
                              </button>
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => openEdit(b)}
                              >
                                <FaEdit />
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(b.id)}
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center py-4">
                          No branches found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* MOBILE */}
          <div className="d-md-none">
            {filtered.length > 0 ? (
              filtered.map((b) => (
                <div className="card shadow-sm mb-3" key={b.id}>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h5 className="card-title mb-0">{b.name}</h5>
                      <span
                        className={`badge ${
                          b.status === "Active" ? "bg-success" : "bg-secondary"
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>
                    <p>
                      <strong>Address:</strong> {b.address || "—"}
                    </p>
                    <p>
                      <strong>Phone:</strong> {b.phone}
                    </p>
                    <div className="d-flex justify-content-end gap-2 mt-3">
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => openView(b)}
                      >
                        <FaEye />
                      </button>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => openEdit(b)}
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(b.id)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center mt-3">No branches found</p>
            )}
          </div>
        </>
      )}

      {/* MODAL */}
      {isModalOpen && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {mode === "add"
                    ? "Add Branch"
                    : mode === "edit"
                    ? "Edit Branch"
                    : "Branch Details"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsModalOpen(false)}
                ></button>
              </div>
              <div className="modal-body">
                {mode === "view" ? (
                  <div>
                    <h5>{selected?.name}</h5>
                    <p>
                      <strong>Address:</strong> {selected?.address || "—"}
                    </p>
                    <p>
                      <strong>Phone:</strong> {selected?.phone}
                    </p>
                    <p>
                      <strong>Status:</strong> {selected?.status}
                    </p>
                  </div>
                ) : (
                  <BranchForm
                    initial={selected || {}} 
                    onSave={handleSave}
                    onCancel={() => setIsModalOpen(false)}
                    isLoading={saving}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default SuperAdminBranches;