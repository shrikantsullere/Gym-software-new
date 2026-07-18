import React, { useState, useEffect, useRef } from "react";
import { FaEye, FaEdit, FaTrashAlt, FaUser } from "react-icons/fa";
import axiosInstance from "../../Api/axiosInstance";
import ImageCropper from "../../Components/ImageCropper";
// 🔽 New imports for export
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const SuperAdminAdmin = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [modalType, setModalType] = useState("add");
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [selectedAdminMembers, setSelectedAdminMembers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(true);

  // 🔁 FETCH ADMINS
  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const response = await axiosInstance.get("/auth/admins");
        if (response.data.success && Array.isArray(response.data.admins)) {
          setAdmins(response.data.admins);
        } else {
          setAdmins([]);
        }
      } catch (error) {
        console.error("Failed to fetch admins:", error);
        setAdmins([]);
        alert("Failed to load admin list.");
      } finally {
        setLoading(false);
      }
    };
    fetchAdmins();
  }, []);

  // 🔁 FETCH PLANS
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await axiosInstance.get("/plans");
        if (response.data.success && Array.isArray(response.data.plans)) {
          setPlans(response.data.plans);
        } else {
          setPlans([]);
        }
      } catch (error) {
        console.error("Failed to fetch plans:", error);
        setPlans([]);
        alert("Failed to load plans.");
      } finally {
        setLoadingPlans(false);
      }
    };
    fetchPlans();
  }, []);

  // 🔁 FETCH BRANCHES
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await axiosInstance.get("/branches");
        if (response.data.success && Array.isArray(response.data.branches)) {
          setBranches(response.data.branches);
        } else {
          setBranches([]);
        }
      } catch (error) {
        console.error("Failed to fetch branches:", error);
        setBranches([]);
        alert("Failed to load branches.");
      } finally {
        setLoadingBranches(false);
      }
    };
    fetchBranches();
  }, []);

  const getBranchNameById = (branchId) => {
    if (!branchId) return "Not Assigned";
    const branch = branches.find((b) => b.id === branchId);
    return branch ? branch.name : "Unknown Branch";
  };

  const handleAddNew = () => {
    setModalType("add");
    setSelectedAdmin(null);
    setIsModalOpen(true);
  };

  const handleView = (admin) => {
    setModalType("view");
    setSelectedAdmin(admin);
    setIsModalOpen(true);
  };

  const handleEdit = (admin) => {
    setModalType("edit");
    setSelectedAdmin(admin);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (admin) => {
    setSelectedAdmin(admin);
    setIsDeleteModalOpen(true);
  };

  // 🔹 NEW: Fetch members and open modal
  const handleViewMembers = async (admin) => {
    setSelectedAdmin(admin);
    setLoadingMembers(true);
    setIsMemberModalOpen(true);
    try {
      const response = await axiosInstance.get(`/members/admin/${admin.id}`);
      if (response.data.success && Array.isArray(response.data.data)) {
        setSelectedAdminMembers(response.data.data);
      } else {
        setSelectedAdminMembers([]);
      }
    } catch (error) {
      console.error("Failed to fetch members:", error);
      alert("Failed to load members.");
      setSelectedAdminMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  // 🔹 EXPORT TO EXCEL
  const exportMembersToExcel = () => {
    if (!selectedAdminMembers.length) return;

    const worksheetData = selectedAdminMembers.map(member => ({
      'Name': member.fullName,
      'Phone': member.phone,
      'Email': member.email,
      'Gender': member.gender,
      'Plan ID': member.planId || '—',
      'Interested In': member.interestedIn || '—',
      'Join Date': member.joinDate ? new Date(member.joinDate).toLocaleDateString() : '—',
      'Status': member.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Members");
    XLSX.writeFile(workbook, `Members_of_${selectedAdmin?.fullName || 'Admin'}.xlsx`);
  };

  // 🔹 EXPORT TO PDF
const exportMembersToPDF = async () => {
  if (!selectedAdminMembers.length) return;

  // Dynamically import autoTable only when needed
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF();

  // ✅ Manually attach autoTable to this doc instance
  autoTable(doc, {
    startY: 30,
    head: [['Name', 'Phone', 'Email', 'Gender', 'Plan ID', 'Interested In', 'Join Date', 'Status']],
    body: selectedAdminMembers.map(member => [
      member.fullName,
      member.phone || '—',
      member.email || '—',
      member.gender || '—',
      member.planId || '—',
      member.interestedIn || '—',
      member.joinDate ? new Date(member.joinDate).toLocaleDateString() : '—',
      member.status || '—',
    ]),
    theme: 'grid',
    headStyles: { fillColor: [110, 178, 204] }, // #6EB2CC
    styles: { fontSize: 9, cellPadding: 3 },
  });

  const title = `Members of ${selectedAdmin?.fullName || 'Admin'}`;
  doc.setFontSize(16);
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.text(title, pageWidth / 2, 20, { align: 'center' });

  doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
};

  // 🔹 EXPORT ADMINS TO EXCEL
  const exportAdminsToExcel = () => {
    if (!admins.length) return;

    const worksheetData = admins.map(admin => ({
      'Admin Name': admin.fullName,
      'Email': admin.email,
      'Subscription': admin.subscriptionPlan || '—',
      'Expiry Date': admin.licenseExpiryDate ? new Date(admin.licenseExpiryDate).toLocaleDateString() : 'Not Set',
      'Gym Name': admin.gymName || '—',
      'GST Number': admin.gstNumber || '—',
      'Tax Rate': `${admin.tax || '18'}%`,
      'Contact': admin.phone || '—',
      'Status': admin.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Gym Owners");
    XLSX.writeFile(workbook, "Gym_Owners_List.xlsx");
  };

  // 🔹 EXPORT ADMINS TO PDF
  const exportAdminsToPDF = async () => {
    if (!admins.length) return;

    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF('landscape');

    // Add Title
    doc.setFontSize(16);
    doc.text("Gym Owners (Admin) Management List", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [['Admin Name', 'Email', 'Subscription', 'Expiry Date', 'Gym Name', 'GST', 'Tax', 'Contact', 'Status']],
      body: admins.map(admin => [
        admin.fullName,
        admin.email,
        admin.subscriptionPlan || '—',
        admin.licenseExpiryDate ? new Date(admin.licenseExpiryDate).toLocaleDateString() : 'Not Set',
        admin.gymName || '—',
        admin.gstNumber || '—',
        `${admin.tax || '18'}%`,
        admin.phone || '—',
        admin.status
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [40, 167, 69] }
    });

    doc.save("Gym_Owners_List.pdf");
  };

  const confirmDelete = async () => {
    if (selectedAdmin) {
      try {
        const response = await axiosInstance.delete(
          `/auth/user/${selectedAdmin.id}`
        );
        if (response.data.success) {
          setAdmins(admins.filter((admin) => admin.id !== selectedAdmin.id));
          alert(`Admin "${selectedAdmin.fullName}" has been deleted successfully.`);
        } else {
          throw new Error("Failed to delete admin");
        }
      } catch (error) {
        console.error("Error deleting admin:", error);
        alert("Failed to delete admin. Please try again.");
      } finally {
        setIsDeleteModalOpen(false);
        setSelectedAdmin(null);
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAdmin(null);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedAdmin(null);
  };

  const closeMemberModal = () => {
    setIsMemberModalOpen(false);
    setSelectedAdmin(null);
    setSelectedAdminMembers([]);
  };

  useEffect(() => {
    document.body.style.overflow = isModalOpen || isDeleteModalOpen || isMemberModalOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isModalOpen, isDeleteModalOpen, isMemberModalOpen]);

  const getStatusBadge = (status) => {
    const normalized = (status || "inactive").toLowerCase();
    return (
      <span
        className="badge rounded-pill px-2 py-1 d-inline-block"
        style={{
          backgroundColor: normalized === "active" ? "#D1F4E1" : "#F8D7DA",
          color: normalized === "active" ? "#157347" : "#B02A37",
          fontWeight: "500",
          fontSize: "0.75rem",
        }}
      >
        {normalized === "active" ? "Active" : "Inactive"}
      </span>
    );
  };

  // ✅ Subscription Plan Badge (Basic / Growth / Premium / Trial)
  const getSubscriptionBadge = (plan, isTrial) => {
    if (isTrial || (plan && plan.toLowerCase().includes("trial"))) {
      return (
        <span className="badge rounded-pill px-2 py-1" style={{ backgroundColor: "#E2F0D9", color: "#385723", fontWeight: "600", fontSize: "0.73rem" }}>
          7-Day Trial
        </span>
      );
    }
    const p = (plan || "Basic").toLowerCase();
    const colors = {
      basic: { bg: "#E8F4FD", color: "#0969DA", label: "Basic" },
      growth: { bg: "#FFF3CD", color: "#856404", label: "Growth" },
      premium: { bg: "#D1F4E1", color: "#157347", label: "Premium" },
    };
    const style = colors[p] || colors.basic;
    return (
      <span className="badge rounded-pill px-2 py-1" style={{ backgroundColor: style.bg, color: style.color, fontWeight: "600", fontSize: "0.73rem" }}>
        {style.label}
      </span>
    );
  };

  // ✅ Expiry Date Badge — shows days remaining or expired
  const getExpiryBadge = (expiryDate) => {
    if (!expiryDate) return <span className="text-muted" style={{ fontSize: "0.78rem" }}>Not Set</span>;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    const dateStr = expiry.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    if (diffDays < 0) {
      return (
        <span>
          <span className="badge rounded-pill px-2 py-1" style={{ backgroundColor: "#F8D7DA", color: "#B02A37", fontSize: "0.73rem" }}>Expired</span>
          <br/><small className="text-muted" style={{ fontSize: "0.7rem" }}>{dateStr}</small>
        </span>
      );
    } else if (diffDays <= 7) {
      return (
        <span>
          <span className="badge rounded-pill px-2 py-1" style={{ backgroundColor: "#FFF3CD", color: "#856404", fontSize: "0.73rem" }}>⚠ {diffDays}d left</span>
          <br/><small className="text-muted" style={{ fontSize: "0.7rem" }}>{dateStr}</small>
        </span>
      );
    } else {
      return (
        <span>
          <span className="badge rounded-pill px-2 py-1" style={{ backgroundColor: "#D1F4E1", color: "#157347", fontSize: "0.73rem" }}>Active</span>
          <br/><small className="text-muted" style={{ fontSize: "0.7rem" }}>{dateStr}</small>
        </span>
      );
    }
  };

  const getModalTitle = () => {
    switch (modalType) {
      case "add": return "Add New Admin";
      case "edit": return "Edit Admin";
      case "view": return "Admin Details";
      default: return "Admin Management";
    }
  };

  const handleFormSubmit = async (payload, profileImageFile) => {
    try {
      const formData = new FormData();

      formData.append("fullName", payload.fullName);
      formData.append("email", payload.email);
      formData.append("phone", payload.phone);
      formData.append("roleId", 2);
      formData.append("branchId", payload.branchId || "");
      formData.append("gymName", payload.gymName);
      formData.append("address", payload.address);
      formData.append("planName", payload.planName);
      formData.append("price", payload.planPrice);
      formData.append("duration", payload.planDuration);
      formData.append("description", payload.planDescription);
      formData.append("status", payload.status.toLowerCase());
      formData.append("gstNumber", payload.gstNumber || "");
      formData.append("gymAddress", payload.gymAddress || "");
      formData.append("tax", payload.tax || "18");
      formData.append("subscriptionPlan", payload.subscriptionPlan || "Basic");
      formData.append("licenseExpiryDate", payload.licenseExpiryDate || "");


      if (modalType === "add") {
        formData.append("password", payload.password);
      }

      if (profileImageFile) {
        formData.append("profileImage", profileImageFile);
      }

      let response;
      if (modalType === "add") {
        response = await axiosInstance.post("/auth/register", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else if (modalType === "edit" && selectedAdmin) {
        response = await axiosInstance.put(`/auth/user/${selectedAdmin.id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      if (response?.data?.success) {
        if (modalType === "add") {
          setAdmins([...admins, response.data.user]);
          alert("New admin added successfully!");
        } else {
          const updatedAdmins = admins.map((admin) =>
            admin.id === selectedAdmin.id ? response.data.user : admin
          );
          setAdmins(updatedAdmins);
          alert("Admin updated successfully!");
        }
        closeModal();
      } else {
        throw new Error("Operation failed");
      }
    } catch (error) {
      console.error("Error saving admin:", error);
      alert(`Failed to ${modalType === "add" ? "add" : "update"} admin.`);
    }
  };

  return (
    <div className="container-fluid p-2 p-sm-3 p-md-4">
      {/* HEADER */}
      <div className="row mb-3 mb-md-4 align-items-center">
        <div className="col-12 col-md-8 mb-3 mb-md-0">
          <h2 className="fw-bold fs-4 fs-md-3">Admin Management</h2>
          <p className="text-muted fs-6">Manage all gym admins and their profile details.</p>
        </div>
        <div className="col-12 col-md-4 text-md-end d-flex justify-content-md-end gap-2 align-items-center flex-wrap">
          <div className="dropdown w-100 w-md-auto">
            <button
              className="btn btn-success dropdown-toggle text-white d-flex align-items-center justify-content-center w-100"
              type="button"
              id="exportAdminsDropdown"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              style={{ backgroundColor: "#28a745", border: "none", borderRadius: "10px", fontWeight: 600, padding: "10px 20px", fontSize: "0.9rem" }}
            >
              <i className="bi bi-download me-2"></i>
              Export
            </button>
            <ul className="dropdown-menu shadow-sm" aria-labelledby="exportAdminsDropdown" style={{ borderRadius: "8px", border: "none" }}>
              <li>
                <button className="dropdown-item d-flex align-items-center py-2" onClick={exportAdminsToExcel}>
                  <span style={{ color: "#28a745", marginRight: "10px", fontWeight: 600 }}>XLSX</span> Export to Excel
                </button>
              </li>
              <li>
                <button className="dropdown-item d-flex align-items-center py-2" onClick={exportAdminsToPDF}>
                  <span style={{ color: "#dc3545", marginRight: "10px", fontWeight: 600 }}>PDF</span> Export to PDF
                </button>
              </li>
            </ul>
          </div>
          <button
            className="btn w-100 w-md-auto"
            style={{
              backgroundColor: "#6EB2CC",
              color: "#fff",
              borderRadius: "10px",
              padding: "10px 20px",
              fontWeight: "600",
              fontSize: "0.9rem",
            }}
            onClick={handleAddNew}
            disabled={loading}
          >
            + Add New Admin
          </button>
        </div>
      </div>

      {/* LOADING */}
      {loading ? (
        <div className="text-center py-4">Loading admins...</div>
      ) : (
        <div className="card border-0 shadow-sm" style={{ borderRadius: "16px", background: "#ffffff" }}>
          <div className="card-body p-0">
            {/* DESKTOP TABLE */}
            <div className="table-responsive d-none d-md-block">
              <table className="table align-middle mb-0" style={{ tableLayout: "fixed", width: "100%" }}>
                <colgroup>
                  <col style={{ width: "55px" }} />   {/* PROFILE */}
                  <col style={{ width: "160px" }} />  {/* ADMIN NAME */}
                  <col style={{ width: "110px" }} />  {/* SUBSCRIPTION */}
                  <col style={{ width: "120px" }} />  {/* EXPIRY DATE */}
                  <col style={{ width: "120px" }} />  {/* GYM NAME */}
                  <col style={{ width: "130px" }} />  {/* GST NUMBER */}
                  <col style={{ width: "70px" }} />   {/* TAX */}
                  <col style={{ width: "120px" }} />  {/* CONTACT */}
                  <col style={{ width: "80px" }} />   {/* STATUS */}
                  <col style={{ width: "130px" }} />  {/* ACTIONS */}
                </colgroup>
                <thead style={{ background: "#F8F9FB" }}>
                  <tr>
                    <th className="py-3" style={{ whiteSpace: "nowrap", fontSize: "0.75rem", color: "#6B7280", fontWeight: "600", letterSpacing: "0.04em" }}>PROFILE</th>
                    <th className="py-3" style={{ whiteSpace: "nowrap", fontSize: "0.75rem", color: "#6B7280", fontWeight: "600", letterSpacing: "0.04em" }}>ADMIN NAME</th>
                    <th className="py-3" style={{ whiteSpace: "nowrap", fontSize: "0.75rem", color: "#6B7280", fontWeight: "600", letterSpacing: "0.04em" }}>SUBSCRIPTION</th>
                    <th className="py-3" style={{ whiteSpace: "nowrap", fontSize: "0.75rem", color: "#6B7280", fontWeight: "600", letterSpacing: "0.04em" }}>EXPIRY DATE</th>
                    <th className="py-3" style={{ whiteSpace: "nowrap", fontSize: "0.75rem", color: "#6B7280", fontWeight: "600", letterSpacing: "0.04em" }}>GYM NAME</th>
                    <th className="py-3" style={{ whiteSpace: "nowrap", fontSize: "0.75rem", color: "#6B7280", fontWeight: "600", letterSpacing: "0.04em" }}>GST NUMBER</th>
                    <th className="py-3" style={{ whiteSpace: "nowrap", fontSize: "0.75rem", color: "#6B7280", fontWeight: "600", letterSpacing: "0.04em" }}>TAX</th>
                    <th className="py-3" style={{ whiteSpace: "nowrap", fontSize: "0.75rem", color: "#6B7280", fontWeight: "600", letterSpacing: "0.04em" }}>CONTACT</th>
                    <th className="py-3" style={{ whiteSpace: "nowrap", fontSize: "0.75rem", color: "#6B7280", fontWeight: "600", letterSpacing: "0.04em" }}>STATUS</th>
                    <th className="py-3 text-center" style={{ whiteSpace: "nowrap", fontSize: "0.75rem", color: "#6B7280", fontWeight: "600", letterSpacing: "0.04em" }}>ACTIONS</th>
                  </tr>
                </thead>

                <tbody>
                  {admins.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="text-center text-muted py-4">
                        No admins found
                      </td>
                    </tr>
                  ) : (
                    admins.map((admin) => (
                      <tr
                        key={admin.id}
                        style={{ transition: "0.3s ease" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#F1FBFF")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <td className="text-center">
                          <div
                            className="rounded-circle overflow-hidden mx-auto"
                            style={{ width: "40px", height: "40px", border: "1px solid #eee" }}
                          >
                            {admin.profileImage ? (
                              <img
                                src={admin.profileImage.trim()}
                                alt="Profile"
                                className="w-100 h-100 object-fit-cover"
                                onError={(e) => {
                                  e.target.src = '/assets/images/default-avatar.png';
                                }}
                              />
                            ) : (
                              <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-light">
                                <span className="text-muted" style={{ fontSize: '0.65rem' }}>?</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ fontSize: "0.855rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          <strong style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{admin.fullName}</strong>
                          <small className="text-muted" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{admin.email}</small>
                        </td>
                        <td style={{ fontSize: "0.855rem" }}>{getSubscriptionBadge(admin.subscriptionPlan, admin.isTrial)}</td>
                        <td style={{ fontSize: "0.855rem" }}>{getExpiryBadge(admin.licenseExpiryDate)}</td>
                        <td style={{ fontSize: "0.855rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{admin.gymName || "—"}</td>
                        <td style={{ fontSize: "0.78rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}><span className="text-muted">{admin.gstNumber || "—"}</span></td>
                        <td style={{ fontSize: "0.855rem" }}><span className="badge bg-info text-dark">{admin.tax || "18"}%</span></td>
                        <td style={{ fontSize: "0.855rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{admin.phone || "—"}</td>
                        <td style={{ fontSize: "0.855rem" }}>{getStatusBadge(admin.status)}</td>
                        <td className="text-center">
                          <div className="d-flex justify-content-center gap-1">
                            <button className="btn btn-sm btn-outline-secondary" onClick={() => handleView(admin)} title="View">
                              <FaEye size={13} />
                            </button>
                            <button className="btn btn-sm btn-outline-primary" onClick={() => handleEdit(admin)} title="Edit">
                              <FaEdit size={13} />
                            </button>
                            <button className="btn btn-sm btn-outline-info" onClick={() => handleViewMembers(admin)} title="Members">
                              <FaUser size={13} />
                            </button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteClick(admin)} title="Delete">
                              <FaTrashAlt size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* MOBILE VIEW */}
            <div className="d-md-none p-3">
              {admins.length === 0 ? (
                <div className="text-center text-muted py-4">No admins found</div>
              ) : (
                admins.map((admin) => (
                  <div key={admin.id} className="card mb-3 shadow-sm" style={{ borderRadius: "12px" }}>
                    <div className="card-body p-3">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h5 className="card-title mb-0 fw-bold">{admin.fullName}</h5>
                        {getStatusBadge(admin.status)}
                      </div>
                      <div className="row g-2 mb-2">
                        <div className="col-6">
                          <small className="text-muted d-block">Gym</small>
                          <span>{admin.gymName || "-"}</span>
                        </div>
                        <div className="col-6">
                          <small className="text-muted d-block">Subscription</small>
                          {getSubscriptionBadge(admin.subscriptionPlan, admin.isTrial)}
                        </div>
                        <div className="col-12 mt-1">
                          <small className="text-muted d-block">Expiry</small>
                          {getExpiryBadge(admin.licenseExpiryDate)}
                        </div>
                      </div>
                      <div className="mb-2">
                        <small className="text-muted d-block">Address</small>
                        <span>{admin.address || "-"}</span>
                      </div>
                      <div className="row g-2 mb-2">
                        <div className="col-6">
                          <small className="text-muted d-block">GST Number</small>
                          <span>{admin.gstNumber || "-"}</span>
                        </div>
                        <div className="col-6">
                          <small className="text-muted d-block">Tax Rate</small>
                          <span className="badge bg-info text-dark">{admin.tax || "18"}%</span>
                        </div>
                      </div>
                      <div className="mb-2">
                        <small className="text-muted d-block">Phone</small>
                        <span>{admin.phone || "-"}</span>
                      </div>
                      <div className="d-flex justify-content-end gap-2">
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => handleView(admin)}>
                          <FaEye size={14} />
                        </button>
                        <button className="btn btn-sm btn-outline-primary" onClick={() => handleEdit(admin)}>
                          <FaEdit size={14} />
                        </button>
                        <button className="btn btn-sm btn-outline-info" onClick={() => handleViewMembers(admin)}>
                          <FaUser size={14} />
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteClick(admin)}>
                          <FaTrashAlt size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {isModalOpen && (
        <ModalWrapper title={getModalTitle()} onClose={closeModal}>
          <AdminForm
            mode={modalType}
            admin={selectedAdmin}
            onCancel={closeModal}
            onSubmit={handleFormSubmit}
            plans={plans}
            loadingPlans={loadingPlans}
            branches={branches}
            loadingBranches={loadingBranches}
          />
        </ModalWrapper>
      )}

      {isDeleteModalOpen && (
        <ModalWrapper title="Confirm Deletion" onClose={closeDeleteModal}>
          <div className="text-center py-4">
            <h5>Are you sure?</h5>
            <p className="text-muted">
              This will permanently delete <strong>{selectedAdmin?.fullName}</strong>.
            </p>
            <div className="d-flex justify-content-center gap-3 mt-4">
              <button className="btn btn-outline-secondary px-4" onClick={closeDeleteModal}>
                Cancel
              </button>
              <button className="btn btn-danger px-4" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </ModalWrapper>
      )}

      {/* 🔹 MEMBERS MODAL */}
      {isMemberModalOpen && (
        <ModalWrapper title={`Members of ${selectedAdmin?.fullName || "Admin"}`} onClose={closeMemberModal}>
          <div className="py-2" style={{ maxHeight: "70vh", maxWidth: "900px", overflowX: "hidden" }}>
            {loadingMembers ? (
              <div className="text-center py-4">Loading members...</div>
            ) : selectedAdminMembers.length === 0 ? (
              <div className="text-center text-muted py-4">No members found</div>
            ) : (
              <div className="row g-3">
                {selectedAdminMembers.map((member) => (
                  <div key={member.id} className="col-12">
                    <div className="d-flex align-items-start p-3 border rounded-3 bg-light">
                      <div
                        className="rounded-circle overflow-hidden flex-shrink-0 me-3"
                        style={{ width: "48px", height: "48px", border: "1px solid #ddd" }}
                      >
                        {member.profileImage ? (
                          <img
                            src={member.profileImage.trim()}
                            alt="Member"
                            className="w-100 h-100 object-fit-cover"
                            onError={(e) => {
                              e.target.src = '/assets/images/default-avatar.png';
                            }}
                          />
                        ) : (
                          <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-secondary text-white">
                            <span className="fw-bold" style={{ fontSize: '0.7rem' }}>
                              {member.fullName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-start">
                          <h6 className="mb-1 fw-bold">{member.fullName}</h6>
                          {getStatusBadge(member.status)}
                        </div>
                        <p className="mb-1 text-muted" style={{ fontSize: '0.875rem' }}>
                          {member.phone} • {member.email}
                        </p>
                        <div className="d-flex flex-wrap gap-2 mt-1">
                          {member.planId && (
                            <span className="badge bg-light text-dark border">Plan ID: {member.planId}</span>
                          )}
                          <span className="badge bg-light text-dark border">
                            Joined: {new Date(member.joinDate).toLocaleDateString()}
                          </span>
                          <span className="badge bg-light text-dark border">{member.gender}</span>
                          {member.interestedIn && (
                            <span className="badge bg-light text-dark border">{member.interestedIn}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* 🔽 Export Buttons */}
          <div className="d-flex justify-content-between align-items-center mt-3 px-3">
            <div>
              <button
                className="btn btn-sm btn-success me-2"
                onClick={exportMembersToExcel}
                disabled={loadingMembers || selectedAdminMembers.length === 0}
              >
                Download Excel
              </button>
              <button
                className="btn btn-sm btn-danger"
                onClick={exportMembersToPDF}
                disabled={loadingMembers || selectedAdminMembers.length === 0}
              >
                Download PDF
              </button>
            </div>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={closeMemberModal}
            >
              Close
            </button>
          </div>
        </ModalWrapper>
      )}
    </div>
  );
};

/* ------------------------- MODAL WRAPPER ------------------------- */
const ModalWrapper = ({ title, children, onClose }) => (
  <div
    className="modal fade show"
    style={{ display: "block", background: "rgba(0,0,0,0.5)" }}
    onClick={onClose}
  >
    <div
      className="modal-dialog modal-dialog-centered modal-md"
      style={{ maxWidth: "600px" }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="modal-content p-0" style={{ borderRadius: "14px" }}>
        <div className="modal-header border-0 py-2 px-3">
          <h5 className="modal-title fw-bold fs-5">{title}</h5>
          <button type="button" className="btn-close" onClick={onClose}></button>
        </div>
        <div className="modal-body p-3">{children}</div>
      </div>
    </div>
  </div>
);

/* --------------------------- ADMIN FORM -------------------------- */
const AdminForm = ({ mode, admin, onCancel, onSubmit, plans, loadingPlans, branches, loadingBranches }) => {
  const isView = mode === "view";
  const isAdd = mode === "add";
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    fullName: admin?.fullName || "",
    gymName: admin?.gymName || "",
    address: admin?.address || "",
    phone: admin?.phone || "",
    email: admin?.email || "",
    password: "",
    status: admin?.status || "active",
    selectedPlanId: "",
    planName: admin?.planName || "",
    planPrice: admin?.price || "",
    planDuration: admin?.duration || "",
    planDescription: admin?.description || "",
    branchId: admin?.branchId || "",
    gstNumber: admin?.gstNumber || "",
    gymAddress: admin?.gymAddress || "",
    tax: admin?.tax || "18",
    subscriptionPlan: admin?.subscriptionPlan || "Basic",
    licenseExpiryDate: admin?.licenseExpiryDate
      ? new Date(admin.licenseExpiryDate).toISOString().split("T")[0]
      : "",
  });

  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profilePreview, setProfilePreview] = useState(admin?.profileImage || null);

  const [showCropper, setShowCropper] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState(null);

  useEffect(() => {
    if (admin && plans.length > 0 && admin.planName) {
      const matchedPlan = plans.find(
        (p) => p.name === admin.planName && p.price.toString() === (admin.price || "").toString()
      );
      if (matchedPlan) {
        setFormData((prev) => ({ ...prev, selectedPlanId: matchedPlan.id }));
      }
    }
    if (admin?.profileImage) {
      setProfilePreview(admin.profileImage);
    } else {
      setProfilePreview(null);
    }
  }, [admin, plans]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlanChange = (planId) => {
    const selectedPlan = plans.find((p) => p.id == planId);
    if (selectedPlan) {
      setFormData((prev) => ({
        ...prev,
        selectedPlanId: planId,
        planName: selectedPlan.name,
        planPrice: selectedPlan.price.toString(),
        planDuration: selectedPlan.duration,
        planDescription: selectedPlan.description || `Plan for ${selectedPlan.duration} @ ₹${selectedPlan.price}`,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        selectedPlanId: "",
        planName: "",
        planPrice: "",
        planDuration: "",
        planDescription: "",
      }));
    }
  };

  const handleStatusToggle = () => {
    setFormData((prev) => ({
      ...prev,
      status: prev.status === "active" ? "inactive" : "active",
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please upload an image file.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setTempImageSrc(reader.result);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedImage) => {
    const file = new File([croppedImage.blob], "profile.jpg", { type: "image/jpeg" });
    setProfileImageFile(file);
    setProfilePreview(croppedImage.url);
    setShowCropper(false);
    setTempImageSrc(null);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setTempImageSrc(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isView) return onCancel();
    onSubmit(formData, profileImageFile);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Profile Image */}
      <div className="mb-4 text-center">
        <h6 className="fw-bold mb-2 text-primary">Profile Picture</h6>
        <div
          className="mx-auto rounded-circle overflow-hidden mb-2"
          style={{ width: "100px", height: "100px", border: "2px solid #eee" }}
        >
          {profilePreview ? (
            <img
              src={profilePreview}
              alt="Profile"
              className="w-100 h-100 object-fit-cover"
            />
          ) : (
            <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-light">
              <span className="text-muted">No Image</span>
            </div>
          )}
        </div>
        {!isView && (
          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageChange}
              className="form-control form-control-sm"
            />
            <small className="text-muted">Allowed: JPG, PNG (Max 5MB)</small>
          </div>
        )}
      </div>

      {/* Personal Info */}
      <div className="mb-4">
        <h6 className="fw-bold mb-3 text-primary">Personal Information</h6>
        <div className="row g-2 mb-3">
          <div className="col-12">
            <label className="form-label fs-6">Full Name *</label>
            <input
              name="fullName"
              className="form-control form-control-sm"
              value={formData.fullName}
              onChange={handleInputChange}
              readOnly={isView}
              required
            />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label fs-6">Gym Name *</label>
            <input
              name="gymName"
              className="form-control form-control-sm"
              value={formData.gymName}
              onChange={handleInputChange}
              readOnly={isView}
              required
            />
          </div>

          <div className="col-12 col-md-6">
            <label className="form-label fs-6">Phone *</label>
            <input
              name="phone"
              className="form-control form-control-sm"
              value={formData.phone}
              onChange={handleInputChange}
              readOnly={isView}
              required
            />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label fs-6">Email *</label>
            <input
              name="email"
              type="email"
              className="form-control form-control-sm"
              value={formData.email}
              onChange={handleInputChange}
              readOnly={isView}
              required
            />
          </div>
          <div className="col-12">
            <label className="form-label fs-6">Address *</label>
            <input
              name="address"
              className="form-control form-control-sm"
              value={formData.address}
              onChange={handleInputChange}
              readOnly={isView}
              required
            />
          </div>
        </div>
      </div>

      {/* Gym Information */}
      <div className="mb-4">
        <h6 className="fw-bold mb-3 text-primary">Gym Information</h6>
        <div className="row g-2 mb-3">
          <div className="col-12">
            <label className="form-label fs-6">Gym Address *</label>
            <textarea
              name="gymAddress"
              className="form-control form-control-sm"
              rows="2"
              value={formData.gymAddress}
              onChange={handleInputChange}
              readOnly={isView}
              required
            ></textarea>
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label fs-6">GST Number</label>
            <input
              name="gstNumber"
              className="form-control form-control-sm"
              value={formData.gstNumber}
              onChange={handleInputChange}
              readOnly={isView}
              placeholder="e.g. 29ABCDE1234F1Z5"
            />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label fs-6">Tax Rate *</label>
            <select
              name="tax"
              className="form-select form-select-sm"
              value={formData.tax}
              onChange={handleInputChange}
              disabled={isView}
              required
            >
              <option value="18">18%</option>
              <option value="5">5%</option>
              <option value="12">12%</option>
              <option value="28">28%</option>
            </select>
          </div>
        </div>
      </div>

      {/* Login Info */}
      {isAdd && (
        <div className="mb-4">
          <h6 className="fw-bold mb-3 text-primary">Login Information</h6>
          <div className="row g-2 mb-3">
            <div className="col-12">
              <label className="form-label fs-6">Password *</label>
              <input
                name="password"
                type="password"
                className="form-control form-control-sm"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
        </div>
      )}

      {/* Plan Info */}
      <div className="mb-4">
        <h6 className="fw-bold mb-3 text-primary">Plan Information</h6>
        <div className="row g-2 mb-3">
          <div className="col-12">
            <label className="form-label fs-6">Select Plan</label>
            {loadingPlans ? (
              <div className="form-control form-control-sm" disabled>
                Loading plans...
              </div>
            ) : (
              <select
                className="form-select form-select-sm"
                value={formData.selectedPlanId}
                onChange={(e) => handlePlanChange(e.target.value)}
                disabled={isView}
              >
                <option value="">-- Choose Plan --</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} (₹{plan.price}, {plan.duration})
                  </option>
                ))}
              </select>
            )}
          </div>

          {formData.selectedPlanId && (
            <>
              <div className="col-12 col-md-6">
                <label className="form-label fs-6">Price</label>
                <input
                  className="form-control form-control-sm"
                  value={formData.planPrice}
                  readOnly
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label fs-6">Duration</label>
                <input
                  className="form-control form-control-sm"
                  value={formData.planDuration}
                  readOnly
                />
              </div>
              <div className="col-12">
                <label className="form-label fs-6">Description</label>
                <textarea
                  name="planDescription"
                  className="form-control form-control-sm"
                  rows="2"
                  value={formData.planDescription}
                  onChange={handleInputChange}
                  readOnly={isView}
                ></textarea>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Subscription & Expiry */}
      <div className="mb-4">
        <h6 className="fw-bold mb-3 text-primary">Subscription Settings</h6>
        <div className="row g-2">
          <div className="col-12 col-md-6">
            <label className="form-label fs-6">Subscription Plan *</label>
            <select
              name="subscriptionPlan"
              className="form-select form-select-sm"
              value={formData.subscriptionPlan}
              onChange={handleInputChange}
              disabled={isView}
              required
            >
              <option value="Basic">🔵 Basic</option>
              <option value="Growth">🟡 Growth</option>
              <option value="Premium">🟢 Premium</option>
            </select>
            <small className="text-muted">Select the SaaS tier for this gym owner.</small>
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label fs-6">License Expiry Date *</label>
            <input
              type="date"
              name="licenseExpiryDate"
              className="form-control form-control-sm"
              value={formData.licenseExpiryDate}
              onChange={handleInputChange}
              readOnly={isView}
              required
              min={new Date().toISOString().split("T")[0]}
            />
            <small className="text-muted">Date when the subscription will expire.</small>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="d-flex align-items-center mb-3">
        <label className="form-label me-3 mb-0 fs-6">Status</label>
        <div className="form-check form-switch">
          <input
            type="checkbox"
            className="form-check-input"
            checked={formData.status === "active"}
            onChange={handleStatusToggle}
            disabled={isView}
          />
          <span className="ms-2">{formData.status === "active" ? "Active" : "Inactive"}</span>
        </div>
      </div>

      {/* Buttons */}
      <div className="d-flex justify-content-end gap-2">
        <button type="button" className="btn btn-outline-secondary btn-sm px-3" onClick={onCancel}>
          Close
        </button>
        {!isView && (
          <button
            type="submit"
            className="btn btn-sm px-3"
            style={{ background: "#6EB2CC", color: "#fff" }}
          >
            {mode === "add" ? "Save Admin" : "Update Admin"}
          </button>
        )}
      </div>
      {showCropper && tempImageSrc && (
        <ImageCropper
          image={tempImageSrc}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </form>
  );
};

export default SuperAdminAdmin;