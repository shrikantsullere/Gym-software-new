import React, { useState, useEffect } from "react";
import axiosInstance from "../../Api/axiosInstance";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEdit, FaTrashAlt, FaUsers, FaUserCheck, FaPercent, FaCalendarAlt } from 'react-icons/fa';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { Download } from "lucide-react";

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const userRole = localStorage.getItem("userRole")?.toUpperCase();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [crmStats, setCrmStats] = useState(null);
  const [crmLoading, setCrmLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [superAdminFilter, setSuperAdminFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add');
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkData, setBulkData] = useState({ staffId: "", count: "" });
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    gender: "",
    source: "Walk-in",
    status: "New",
    followUpDate: "",
    notes: "",
    assignedToStaffId: ""
  });
  
  const navigate = useNavigate();

  const fetchCRMStats = async () => {
    if (userRole !== "SUPERADMIN" && userRole !== "SUBADMIN") return;
    try {
      setCrmLoading(true);
      const response = await axiosInstance.get("dashboard/crm-stats");
      if (response.data && response.data.success) {
        setCrmStats(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching CRM stats:", error);
    } finally {
      setCrmLoading(false);
    }
  };

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const adminId = user.adminId || user.id || localStorage.getItem("userId");
      const role = localStorage.getItem("userRole")?.toUpperCase();
      let response;

      if (role === "SUPERADMIN" || role === "SUBADMIN") {
        response = await axiosInstance.get(`leads/superadmin/all`);
        fetchCRMStats();
      } else if (role === "ADMIN" || role === "MANAGER") {
        response = await axiosInstance.get(`leads/admin/${adminId}`);
      } else {
        const staffId = user.id || localStorage.getItem("userId");
        response = await axiosInstance.get(`leads/staff/${staffId}`);
      }

      if (response.data && response.data.leads) {
        setLeads(response.data.leads);
      }
    } catch (error) {
      console.error("Error fetching leads:", error);
      alert("Failed to load leads. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatFollowUpDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const rawDate = dateString.split('T')[0]; // e.g. "2026-07-10"
      const parts = rawDate.split('-');
      if (parts.length === 3) {
        const [yyyy, mm, dd] = parts;
        return `${dd}/${mm}/${yyyy}`; // displays "10/07/2026"
      }
      return new Date(dateString).toLocaleDateString('en-IN');
    } catch (e) {
      return new Date(dateString).toLocaleDateString('en-IN');
    }
  };

  const fetchStaff = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const adminId = user.adminId || user.id || 1;
      const response = await axiosInstance.get(`/staff/admin/${adminId}`);
      if (response.data && response.data.success) {
        setStaffList(response.data.staff || []);
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchStaff();
  }, []);

  const handleBulkAllocate = () => {
    setBulkData({ staffId: "", count: "" });
    setShowBulkModal(true);
  };

  const submitBulkAllocate = async (e) => {
    e.preventDefault();
    if (!bulkData.staffId || !bulkData.count) {
      alert("Please select a staff member and enter the number of leads.");
      return;
    }
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const adminId = user.adminId || user.id || localStorage.getItem("userId");
      const payload = { adminId, staffId: bulkData.staffId, count: Number(bulkData.count) };
      const res = await axiosInstance.post("leads/bulk-allocate", payload);
      alert(res.data.message || "Leads allocated successfully");
      setShowBulkModal(false);
      fetchLeads();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Bulk allocation failed");
    }
  };

  const handleAddNew = () => {
    setModalType('add');
    setSelectedLeadId(null);
    setFormData({ fullName: "", phone: "", email: "", gender: "", source: "Walk-in", status: "New", followUpDate: "", notes: "", assignedToStaffId: "" });
    setShowModal(true);
  };

  const handleView = (lead) => {
    setModalType('view');
    setSelectedLeadId(lead.id);
    setFormData({
      fullName: lead.fullName || "",
      phone: lead.phone || "",
      email: lead.email || "",
      gender: lead.gender || "",
      source: lead.source || "Walk-in",
      status: lead.status || "New",
      followUpDate: lead.followUpDate ? lead.followUpDate.split('T')[0] : "",
      notes: lead.notes || "",
      assignedToStaffId: lead.assignedToStaffId || ""
    });
    setShowModal(true);
  };

  const handleEdit = (lead) => {
    setModalType('edit');
    setSelectedLeadId(lead.id);
    setFormData({
      fullName: lead.fullName || "",
      phone: lead.phone || "",
      email: lead.email || "",
      gender: lead.gender || "",
      source: lead.source || "Walk-in",
      status: lead.status || "New",
      followUpDate: lead.followUpDate ? lead.followUpDate.split('T')[0] : "",
      notes: lead.notes || "",
      assignedToStaffId: lead.assignedToStaffId || ""
    });
    setShowModal(true);
  };

  const handleDeleteClick = (lead) => {
    setSelectedLeadId(lead.id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await axiosInstance.delete(`leads/${selectedLeadId}`);
      alert("Lead deleted successfully!");
      setShowDeleteModal(false);
      fetchLeads();
    } catch (error) {
      console.error("Error deleting lead:", error);
      alert("Failed to delete lead.");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (modalType === 'view') {
      setShowModal(false);
      return;
    }
    
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const adminId = user.adminId || user.id || 1;
      
      const payload = {
        ...formData,
        adminId: adminId,
        branchId: user.branchId || null
      };
      
      if (modalType === 'add') {
        await axiosInstance.post("leads", payload);
        alert("Lead created successfully!");
      } else if (modalType === 'edit') {
        await axiosInstance.put(`leads/${selectedLeadId}`, payload);
        alert("Lead updated successfully!");
      }
      
      setShowModal(false);
      fetchLeads();
    } catch (error) {
      console.error("Error saving lead:", error);
      alert("Failed to save lead.");
    }
  };

  const handleConvertToMember = (lead) => {
    // Navigate to Member Management with pre-filled lead details
    if (userRole === "ADMIN" || userRole === "SUPERADMIN") {
      navigate("/admin/AdminMember", { state: { leadData: lead } });
    } else if (userRole === "SALES_AGENT") {
      navigate("/sales/walk-in-registration", { state: { leadData: lead } });
    } else {
      navigate("/receptionist/walk-in-registration", { state: { leadData: lead } });
    }
  };

  const displayLeads = leads.filter(lead => {
    if (superAdminFilter === "all") return true;
    if (superAdminFilter === "Converted") return lead.status === "Converted";
    if (superAdminFilter === "Schedule Demo") return lead.source === "Schedule Demo";
    return true;
  });

  const filteredLeads = leads.filter(lead => {
    if (statusFilter === "all") return lead.status !== "Converted";
    return lead.status?.toLowerCase() === statusFilter.toLowerCase();
  });

  const exportToExcel = () => {
    if (filteredLeads.length === 0) {
      alert("No data available to export.");
      return;
    }
    const exportData = filteredLeads.map((m) => ({
      "Lead Name": m.fullName || "N/A",
      Phone: m.phone,
      Email: m.email || "N/A",
      Source: m.source || "N/A",
      Status: m.status || "N/A",
      "Follow-up Date": m.followUpDate ? formatFollowUpDate(m.followUpDate) : "N/A",
      Notes: m.notes || "N/A",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Auto-fit columns
    const colWidths = Object.keys(exportData[0]).map(key => ({
      wch: Math.max(
        key.length,
        ...exportData.map(row => (row[key] ? row[key].toString().length : 0))
      ) + 2
    }));
    worksheet["!cols"] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
    XLSX.writeFile(workbook, "Leads_Data.xlsx");
  };

  const exportToPDF = () => {
    if (filteredLeads.length === 0) {
      alert("No data available to export.");
      return;
    }
    const doc = new jsPDF();
    doc.text("Leads / Inquiries Data", 14, 15);

    const tableColumn = ["Name", "Phone", "Email", "Source", "Status", "Follow-up"];
    const tableRows = [];

    filteredLeads.forEach((m) => {
      const rowData = [
        m.fullName || "N/A",
        m.phone,
        m.email || "N/A",
        m.source || "N/A",
        m.status || "N/A",
        m.followUpDate ? formatFollowUpDate(m.followUpDate) : "N/A",
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [110, 178, 204] },
    });
    doc.save("Leads_Data.pdf");
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h2 style={{ color: "#2B3674", fontWeight: "bold", margin: 0 }}>
          Leads / Inquiries Management
        </h2>
        <div className="d-flex gap-2 flex-wrap">
          <div className="dropdown">
            <button
              className="btn text-white dropdown-toggle"
              type="button"
              id="exportLeadsDropdown"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              style={{ backgroundColor: "#28a745", borderRadius: "10px", fontWeight: 600, padding: "8px 20px" }}
            >
              <Download size={18} className="me-2" />
              Export
            </button>
            <ul className="dropdown-menu shadow-sm" aria-labelledby="exportLeadsDropdown" style={{ borderRadius: "8px", border: "none" }}>
              <li>
                <button className="dropdown-item d-flex align-items-center py-2" onClick={exportToExcel}>
                  <span style={{ color: "#28a745", marginRight: "10px", fontWeight: 600 }}>XLSX</span> Export to Excel
                </button>
              </li>
              <li>
                <button className="dropdown-item d-flex align-items-center py-2" onClick={exportToPDF}>
                  <span style={{ color: "#dc3545", marginRight: "10px", fontWeight: 600 }}>PDF</span> Export to PDF
                </button>
              </li>
            </ul>
          </div>
          {(userRole !== "SUPERADMIN" && userRole !== "SUBADMIN") && (
            <>
              <button 
                className="btn btn-primary px-4 py-2" 
                style={{ background: "#4318FF", border: "none", borderRadius: "10px", fontWeight: "600" }}
                onClick={handleAddNew}
              >
                + Add New Lead
              </button>
              {userRole === "ADMIN" && (
                <button 
                  className="btn btn-secondary px-4 py-2" 
                  style={{ background: "#28a745", border: "none", borderRadius: "10px", fontWeight: "600" }}
                  onClick={handleBulkAllocate}
                >
                  Bulk Allocate Leads
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {(userRole === "SUPERADMIN" || userRole === "SUBADMIN") && crmStats && (
        <>
          {/* Stats Cards */}
          <div className="row g-3 mb-4">
            <div className="col-12 col-sm-6 col-xl-3">
              <div 
                className="card shadow-sm border-0 h-100" 
                style={{ 
                  borderRadius: "15px", 
                  background: "linear-gradient(135deg, #868CFF 0%, #4318FF 100%)", 
                  color: "white",
                  cursor: "pointer",
                  border: superAdminFilter === "all" ? "3px solid rgba(255, 255, 255, 0.9)" : "3px solid transparent",
                  transform: superAdminFilter === "all" ? "scale(1.02)" : "scale(1)",
                  transition: "all 0.2s"
                }}
                onClick={() => setStatusFilter("all") & setSuperAdminFilter("all")}
              >
                <div className="card-body d-flex align-items-center justify-content-between p-4">
                  <div>
                    <div className="small opacity-80 fw-semibold">Total Leads</div>
                    <div className="fs-2 fw-bold mt-2">{leads.length}</div>
                  </div>
                  <div className="bg-white bg-opacity-20 p-3 rounded-circle" style={{ width: "55px", height: "55px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <FaUsers size={24} />
                  </div>
                </div>
              </div>
            </div>
            <div className="col-12 col-sm-6 col-xl-3">
              <div 
                className="card shadow-sm border-0 h-100" 
                style={{ 
                  borderRadius: "15px", 
                  background: "linear-gradient(135deg, #05CD99 0%, #11998e 100%)", 
                  color: "white",
                  cursor: "pointer",
                  border: superAdminFilter === "Converted" ? "3px solid rgba(255, 255, 255, 0.9)" : "3px solid transparent",
                  transform: superAdminFilter === "Converted" ? "scale(1.02)" : "scale(1)",
                  transition: "all 0.2s"
                }}
                onClick={() => setSuperAdminFilter("Converted")}
              >
                <div className="card-body d-flex align-items-center justify-content-between p-4">
                  <div>
                    <div className="small opacity-80 fw-semibold">Converted Leads</div>
                    <div className="fs-2 fw-bold mt-2">{leads.filter(l => l.status === "Converted").length}</div>
                  </div>
                  <div className="bg-white bg-opacity-20 p-3 rounded-circle" style={{ width: "55px", height: "55px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <FaUserCheck size={24} />
                  </div>
                </div>
              </div>
            </div>
            <div className="col-12 col-sm-6 col-xl-3">
              <div 
                className="card shadow-sm border-0 h-100" 
                style={{ 
                  borderRadius: "15px", 
                  background: "linear-gradient(135deg, #3A7BD5 0%, #3A6073 100%)", 
                  color: "white",
                  cursor: "pointer",
                  border: superAdminFilter === "Schedule Demo" ? "3px solid rgba(255, 255, 255, 0.9)" : "3px solid transparent",
                  transform: superAdminFilter === "Schedule Demo" ? "scale(1.02)" : "scale(1)",
                  transition: "all 0.2s"
                }}
                onClick={() => setSuperAdminFilter("Schedule Demo")}
              >
                <div className="card-body d-flex align-items-center justify-content-between p-4">
                  <div>
                    <div className="small opacity-80 fw-semibold">Schedule Demo</div>
                    <div className="fs-2 fw-bold mt-2">{leads.filter(l => l.source === "Schedule Demo").length}</div>
                  </div>
                  <div className="bg-white bg-opacity-20 p-3 rounded-circle" style={{ width: "55px", height: "55px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <FaCalendarAlt size={22} />
                  </div>
                </div>
              </div>
            </div>
            <div className="col-12 col-sm-6 col-xl-3">
              <div 
                className="card shadow-sm border-0 h-100" 
                style={{ 
                  borderRadius: "15px", 
                  background: "linear-gradient(135deg, #FFB547 0%, #FF9F05 100%)", 
                  color: "white",
                  cursor: "default"
                }}
              >
                <div className="card-body d-flex align-items-center justify-content-between p-4">
                  <div>
                    <div className="small opacity-80 fw-semibold">Conversion Rate</div>
                    <div className="fs-2 fw-bold mt-2">
                      {leads.length > 0 
                        ? Number(((leads.filter(l => l.status === "Converted").length / leads.length) * 100).toFixed(2)) 
                        : 0}%
                    </div>
                  </div>
                  <div className="bg-white bg-opacity-20 p-3 rounded-circle" style={{ width: "55px", height: "55px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <FaPercent size={20} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="row g-3 mb-4">
            <div className="col-12">
              <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "15px" }}>
                <div className="card-header bg-white border-0 pt-4 fw-semibold" style={{ color: "#2B3674" }}>
                  Daily Leads & Conversions Trend
                </div>
                <div className="card-body" style={{ height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={crmStats.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4318FF" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#4318FF" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorConverted" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#05CD99" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#05CD99" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tickFormatter={(str) => str ? str.slice(5) : ''} tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} 
                        itemStyle={{ fontSize: '12px', fontWeight: '500', color: '#333' }} 
                        labelStyle={{ display: 'none' }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      <Area type="monotone" dataKey="totalLeads" stroke="#4318FF" fillOpacity={1} fill="url(#colorLeads)" name="Total Leads" />
                      <Area type="monotone" dataKey="convertedLeads" stroke="#05CD99" fillOpacity={1} fill="url(#colorConverted)" name="Converted Leads" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

        </>
      )}

      {/* SAAS Leads Table — Only for Super Admin (Landing Page Inquiries) */}
      {(userRole === "SUPERADMIN" || userRole === "SUBADMIN") && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card shadow-sm border-0" style={{ borderRadius: "15px" }}>
              <div className="card-header bg-white border-0 pt-4 pb-0 d-flex justify-content-between align-items-center">
                <div>
                  <h5 style={{ fontWeight: "700", color: "#2B3674", margin: 0 }}>
                    🏢 SaaS Leads — Landing Page Inquiries
                  </h5>
                  <small className="text-muted">Gym owners who showed interest via your website</small>
                </div>
                <span className="badge bg-primary rounded-pill" style={{ fontSize: '13px', padding: '6px 14px' }}>
                  {displayLeads.length} Total
                </span>
              </div>
              <div className="card-body">
                {loading ? (
                  <div className="text-center py-4"><div className="spinner-border text-primary" /></div>
                ) : displayLeads.length === 0 ? (
                  <div className="text-center py-5">
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
                    <p className="text-muted fw-semibold">No inquiries found matching this category.</p>
                  </div>
                ) : (
                  <div className="table-responsive" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                    <table className="table align-middle">
                      <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#f8fafc' }}>
                        <tr style={{ borderBottom: '2px solid #edf2f7' }}>
                          <th style={{ fontWeight: '700', color: '#4a5568', fontSize: '13px', padding: '12px 16px' }}>Client Contact Info</th>
                          <th style={{ fontWeight: '700', color: '#4a5568', fontSize: '13px', padding: '12px 16px' }}>Gym & Location</th>
                          <th style={{ fontWeight: '700', color: '#4a5568', fontSize: '13px', padding: '12px 16px' }}>Inquiry Details</th>
                          <th style={{ fontWeight: '700', color: '#4a5568', fontSize: '13px', padding: '12px 16px' }}>Status</th>
                          <th style={{ fontWeight: '700', color: '#4a5568', fontSize: '13px', padding: '12px 16px' }}>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayLeads.map((lead) => {
                          const parseNotes = (notes) => {
                            if (!notes) return { gym: '—', city: '—' };
                            const parts = notes.split('|');
                            let city = '—';
                            let gym = '—';
                            parts.forEach(p => {
                              if (p.includes('City:')) city = p.replace('City:', '').trim();
                              if (p.includes('Gym:')) gym = p.replace('Gym:', '').trim();
                            });
                            // Fallback in case format is raw
                            if (gym === '—' && city === '—') gym = notes;
                            return { gym, city };
                          };
                          const { gym, city } = parseNotes(lead.notes);

                          return (
                            <tr key={lead.id} style={{ background: '#fdfdfd', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                              <td style={{ padding: '14px 16px' }}>
                                <div className="fw-bold text-dark" style={{ fontSize: '14px' }}>{lead.fullName}</div>
                                <div style={{ fontSize: '12px', color: '#4b5563', margin: '2px 0' }}>✉ {lead.email || '—'}</div>
                                <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>📞 {lead.phone}</div>
                              </td>
                              <td style={{ padding: '14px 16px' }}>
                                <div className="fw-bold" style={{ fontSize: '13.5px', color: '#1e293b' }}>🏢 {gym}</div>
                                <div className="text-muted" style={{ fontSize: '12px', marginTop: '2px' }}>📍 {city}</div>
                              </td>
                              <td style={{ padding: '14px 16px' }}>
                                <div className="d-flex flex-column gap-1 align-items-start">
                                  <span className={`badge ${lead.source === 'Schedule Demo' ? 'bg-primary' : lead.source === 'Start Free Trial' ? 'bg-info text-dark' : 'bg-secondary'}`}
                                    style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '6px' }}>
                                    {lead.source || 'Landing Page'}
                                  </span>
                                  {lead.interestedPlan && (
                                    <span className="badge bg-success bg-opacity-10 text-success"
                                      style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '6px', fontWeight: '600' }}>
                                      Plan: {lead.interestedPlan}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td style={{ padding: '14px 16px' }}>
                                <span className={`badge ${lead.status === 'New' ? 'bg-info' : lead.status === 'Converted' ? 'bg-success' : lead.status === 'In Progress' ? 'bg-primary' : 'bg-warning'}`}
                                  style={{ fontSize: '11px', padding: '5px 10px', borderRadius: '6px' }}>
                                  {lead.status}
                                </span>
                              </td>
                              <td style={{ padding: '14px 16px', fontSize: '12.5px', color: '#6b7280', fontWeight: '500' }}>
                                {new Date(lead.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
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
          </div>
        </div>
      )}

      {/* Leads List (Hidden for Superadmin/Subadmin to enforce multi-tenant isolation) */}
      {(userRole !== "SUPERADMIN" && userRole !== "SUBADMIN") && (
        <div className="row">
          {/* Leads List */}
          <div className="col-12">
            <div className="card shadow-sm border-0" style={{ borderRadius: "15px" }}>
              <div className="card-header bg-white border-0 pt-4 pb-0">
                <h5 style={{ fontWeight: "600", color: "#2B3674" }}>Active Inquiries</h5>
              </div>
              <div className="card-body">
                {loading ? (
                  <div className="text-center py-4"><div className="spinner-border text-primary" /></div>
                ) : (
                  <div className="table-responsive">
                    <table className="table align-middle">
                      <thead className="bg-light">
                        <tr>
                          {(userRole === "SUPERADMIN" || userRole === "SUBADMIN") && <th>Gym Name</th>}
                          {(userRole === "SUPERADMIN" || userRole === "SUBADMIN") && <th>Branch Name</th>}
                          {(userRole === "SUPERADMIN" || userRole === "SUBADMIN") && <th>Admin Name</th>}
                          <th>Name</th>
                          <th>Phone</th>
                          <th>Email</th>
                          <th>Source</th>
                          <th>Notes</th>
                          <th>Status</th>
                          <th>Follow Up</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLeads.length > 0 ? (
                          filteredLeads.map((lead) => (
                            <tr key={lead.id}>
                              {(userRole === "SUPERADMIN" || userRole === "SUBADMIN") && <td>{lead.gymName || 'N/A'}</td>}
                              {(userRole === "SUPERADMIN" || userRole === "SUBADMIN") && <td>{lead.branchName || 'N/A'}</td>}
                              {(userRole === "SUPERADMIN" || userRole === "SUBADMIN") && <td>{lead.adminName || 'N/A'}</td>}
                              <td className="fw-bold">{lead.fullName}</td>
                              <td>{lead.phone}</td>
                              <td>{lead.email || 'N/A'}</td>
                              <td>
                                <span className="badge bg-secondary">{lead.source || 'N/A'}</span>
                              </td>
                              <td>
                                <small className="text-muted" style={{ maxWidth: "200px", display: "inline-block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={lead.notes}>
                                  {lead.notes || 'N/A'}
                                </small>
                              </td>
                              <td>
                                <span className={`badge ${lead.status === 'New' ? 'bg-info' : lead.status === 'Converted' ? 'bg-success' : 'bg-warning'}`}>
                                  {lead.status}
                                </span>
                              </td>
                              <td>{formatFollowUpDate(lead.followUpDate)}</td>
                              <td>
                                <div className="d-flex align-items-center flex-wrap" style={{ gap: '8px' }}>
                                  <button
                                    className="btn btn-sm btn-outline-secondary"
                                    title="View"
                                    onClick={() => handleView(lead)}
                                    style={{ width: '34px', height: '34px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px' }}
                                  >
                                    <FaEye size={16} />
                                  </button>
                                  {(userRole !== "SUPERADMIN" && userRole !== "SUBADMIN") && (
                                    <>
                                      <button
                                        className="btn btn-sm btn-outline-primary"
                                        title="Edit"
                                        onClick={() => handleEdit(lead)}
                                        style={{ width: '34px', height: '34px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px' }}
                                      >
                                        <FaEdit size={16} />
                                      </button>
                                      <button
                                        className="btn btn-sm btn-outline-danger"
                                        title="Delete"
                                        onClick={() => handleDeleteClick(lead)}
                                        style={{ width: '34px', height: '34px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px' }}
                                      >
                                        <FaTrashAlt size={16} />
                                      </button>
                                      {lead.status !== 'Converted' && (
                                        <>
                                          {(lead.assignedToStaffId && lead.assignedToStaffId !== 0) ? (
                                            <span 
                                              className="badge bg-secondary d-flex align-items-center px-3" 
                                              style={{ height: '34px', borderRadius: '6px', fontSize: '13px' }}
                                            >
                                              Assigned to {
                                                staffList.find(s => s.staffId === lead.assignedToStaffId)?.roleId === 10 ? "Sales" : 
                                                staffList.find(s => s.staffId === lead.assignedToStaffId)?.roleId === 7 ? "Receptionist" : "Staff"
                                              }
                                            </span>
                                          ) : (
                                            <button 
                                              className="btn btn-sm btn-success fw-bold px-3 py-1 text-white shadow-sm" 
                                              onClick={() => handleConvertToMember(lead)}
                                              style={{ height: '34px', borderRadius: '6px', border: 'none', background: '#198754' }}
                                            >
                                              Convert
                                            </button>
                                          )}
                                        </>
                                      )}
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan={(userRole === "SUPERADMIN" || userRole === "SUBADMIN") ? "11" : "8"} className="text-center py-3">No leads found matching filter.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bootstrap Modal for Add Form */}
      {showModal && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content" style={{ borderRadius: "15px", border: "none" }}>
                <div className="modal-header border-0 pb-0">
                  <h5 className="modal-title" style={{ fontWeight: "600", color: "#4318FF" }}>
                    {modalType === 'add' ? 'Add New Lead' : modalType === 'edit' ? 'Edit Lead' : 'Lead Details'}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <div className="modal-body pt-4">
                  <form onSubmit={handleSubmit}>
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label">Full Name</label>
                        <input type="text" className="form-control" name="fullName" value={formData.fullName} onChange={handleChange} required disabled={modalType === 'view'} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Phone Number</label>
                        <input type="tel" className="form-control" name="phone" value={formData.phone} onChange={handleChange} required disabled={modalType === 'view'} />
                      </div>
                    </div>
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label">Email (Optional)</label>
                        <input type="email" className="form-control" name="email" value={formData.email} onChange={handleChange} disabled={modalType === 'view'} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Gender</label>
                        <select className="form-select" name="gender" value={formData.gender || ""} onChange={handleChange} disabled={modalType === 'view'}>
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label">Source</label>
                        <select className="form-select" name="source" value={formData.source} onChange={handleChange} disabled={modalType === 'view'}>
                          <option value="Walk-in">Walk-in</option>
                          <option value="Website">Website</option>
                          <option value="Phone">Phone</option>
                          <option value="Referral">Referral</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Assign To Staff</label>
                        <select className="form-select" name="assignedToStaffId" value={formData.assignedToStaffId || ""} onChange={handleChange} disabled={modalType === 'view'}>
                          <option value="">Unassigned</option>
                          {staffList.map(staff => {
                             const roleName = 
                               staff.roleId === 5 ? "Personal Trainer" : 
                               staff.roleId === 6 ? "General Trainer" : 
                               staff.roleId === 7 ? "Receptionist" : 
                               staff.roleId === 8 ? "Housekeeping" : 
                               staff.roleId === 10 ? "Sales Agent" : 
                               staff.roleId === 3 ? "Trainer" : 
                               "Staff";
                             return (
                               <option key={staff.staffId} value={staff.staffId}>
                                 {staff.fullName} ({roleName})
                               </option>
                             );
                           })}
                        </select>
                      </div>
                    </div>
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label">Status</label>
                        <select className="form-select" name="status" value={formData.status} onChange={handleChange} disabled={modalType === 'view'}>
                          <option value="New">New</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Converted">Converted</option>
                          <option value="Dead">Dead</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Follow Up Date</label>
                        <input type="date" className="form-control" name="followUpDate" value={formData.followUpDate} onChange={handleChange} disabled={modalType === 'view'} />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Notes / Discussion</label>
                      <textarea className="form-control" name="notes" rows="3" value={formData.notes} onChange={handleChange} disabled={modalType === 'view'}></textarea>
                    </div>
                    
                    {modalType !== 'view' ? (
                      <button type="submit" className="btn btn-primary w-100 mt-2" style={{ background: "#4318FF", border: "none", borderRadius: "10px", padding: "10px" }}>
                        {modalType === 'add' ? 'Save Inquiry' : 'Update Inquiry'}
                      </button>
                    ) : (
                      <button type="button" className="btn btn-secondary w-100 mt-2" onClick={() => setShowModal(false)} style={{ borderRadius: "10px", padding: "10px" }}>
                        Close
                      </button>
                    )}
                  </form>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Bulk Allocate Modal */}
      {showBulkModal && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content" style={{ borderRadius: "15px", border: "none" }}>
                <div className="modal-header border-0 pb-0">
                  <h5 className="modal-title" style={{ fontWeight: "600", color: "#4318FF" }}>
                    Bulk Allocate Leads
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowBulkModal(false)}></button>
                </div>
                <div className="modal-body pt-4">
                  <form onSubmit={submitBulkAllocate}>
                    <div className="mb-3">
                      <label className="form-label">Select Staff</label>
                      <select 
                        className="form-select" 
                        value={bulkData.staffId} 
                        onChange={(e) => setBulkData({...bulkData, staffId: e.target.value})} 
                        required
                      >
                        <option value="">-- Choose Staff --</option>
                        {staffList
                          .filter(staff => staff.roleId === 7 || staff.roleId === 10 || staff.roleName?.toLowerCase() === 'receptionist' || staff.roleName?.toLowerCase() === 'sales')
                          .map(staff => {
                          const roleName = staff.roleId === 4 ? "Trainer" : staff.roleId === 5 ? "Receptionist" : staff.roleId === 6 ? "Housekeeping" : staff.roleId === 10 ? "Sales" : staff.roleId === 7 ? "Receptionist" : staff.roleId === 3 ? "Manager" : "Staff";
                          return (
                            <option key={staff.staffId} value={staff.staffId}>
                              {staff.fullName} ({roleName})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Number of Leads to Allocate</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        min="1" 
                        value={bulkData.count} 
                        onChange={(e) => setBulkData({...bulkData, count: e.target.value})} 
                        required 
                        placeholder="e.g. 5"
                      />
                      <small className="text-muted">Unassigned leads will be distributed automatically.</small>
                    </div>
                    <button type="submit" className="btn btn-primary w-100 mt-2" style={{ background: "#4318FF", border: "none", borderRadius: "10px", padding: "10px" }}>
                      Allocate Leads
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content" style={{ borderRadius: "15px", border: "none" }}>
                <div className="modal-header border-0 pb-0">
                  <h5 className="modal-title fw-bold text-danger">Confirm Delete</h5>
                  <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)}></button>
                </div>
                <div className="modal-body pt-4 text-center">
                  <p>Are you sure you want to delete this lead? This action cannot be undone.</p>
                  <div className="d-flex justify-content-center gap-3 mt-4">
                    <button type="button" className="btn btn-secondary px-4" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                    <button type="button" className="btn btn-danger px-4" onClick={confirmDelete}>Delete</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Leads;
