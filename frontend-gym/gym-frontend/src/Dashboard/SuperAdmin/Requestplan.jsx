import React, { useState, useEffect } from "react";
import { FaCheck, FaTimes, FaChevronDown, FaChevronUp } from "react-icons/fa";
import axiosInstance from "../../Api/axiosInstance"; // ✅ Adjust path if needed
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const RequestedPlans = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [expandedRows, setExpandedRows] = useState([]);
  const [updatingStatus, setUpdatingStatus] = useState({}); // Track which rows are being updated
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [selectedRequestIndex, setSelectedRequestIndex] = useState(null);
  const [onboardPassword, setOnboardPassword] = useState("");
  const [onboardError, setOnboardError] = useState("");

  // 🔹 EXPORT REQUESTED PLANS TO EXCEL
  const exportRequestsToExcel = () => {
    if (!purchases.length) return;

    const worksheetData = purchases.map(req => ({
      'Gym / Admin': req.admin,
      'Contact': req.phone,
      'Email': req.email,
      'Plan': req.plan,
      'Amount': `₹${req.amount}`,
      'Billing': req.billing,
      'Requested On': req.purchaseDate,
      'Start Date': req.startDate,
      'Expiry Date': req.expiryDate,
      'Status': req.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Requested Plans");
    XLSX.writeFile(workbook, "Requested_Plans_List.xlsx");
  };

  // 🔹 EXPORT REQUESTED PLANS TO PDF
  const exportRequestsToPDF = async () => {
    if (!purchases.length) return;

    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF('landscape');

    // Add Title
    doc.setFontSize(16);
    doc.text("Requested Plans List", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [['Gym / Admin', 'Contact', 'Email', 'Plan', 'Amount', 'Billing', 'Requested On', 'Start Date', 'Expiry Date', 'Status']],
      body: purchases.map(req => [
        req.admin,
        req.phone,
        req.email,
        req.plan,
        `₹${req.amount}`,
        req.billing,
        req.purchaseDate,
        req.startDate,
        req.expiryDate,
        req.status
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [40, 167, 69] }
    });

    doc.save("Requested_Plans_List.pdf");
  };

  // 🔁 Fetch real data from /purchases
  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const response = await axiosInstance.get("/purchases");
        if (response.data.success && Array.isArray(response.data.data)) {
          // Normalize data to match UI structure
          const normalized = response.data.data.map(item => {
            // Parse start date from DB
            const startD = item.startDate ? new Date(item.startDate) : null;
            
            // Calculate expiry date based on billingDuration / selectedPlan
            let expiryD = null;
            if (startD) {
              let durationDays = 30; // default Monthly
              if (item.selectedPlan && item.selectedPlan.toLowerCase().includes("trial")) {
                durationDays = 7;
              } else if (item.billingDuration && item.billingDuration.toLowerCase().includes("year")) {
                durationDays = 365;
              }
              expiryD = new Date(startD);
              expiryD.setDate(expiryD.getDate() + durationDays);
            }

            return {
              id: item.id,
              admin: item.adminName || item.companyName, 
              company: item.companyName,
              branch: item.branchName || "N/A",
              phone: item.phone || "N/A",
              email: item.email,
              plan: item.selectedPlan,
              amount: item.amount || 0,
              billing: item.billingDuration,
              purchaseDate: new Date(item.purchaseDate).toLocaleDateString('en-GB'),
              startDate: startD ? startD.toLocaleDateString('en-GB') : "N/A",
              expiryDate: expiryD ? expiryD.toLocaleDateString('en-GB') : "N/A",
              status: item.status.charAt(0).toUpperCase() + item.status.slice(1) // "pending" → "Pending"
            };
          });
          setPurchases(normalized);
        } else {
          setPurchases([]);
        }
      } catch (error) {
        console.error("Failed to fetch purchases:", error);
        setPurchases([]);
        alert("Failed to load purchase requests.");
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();
  }, []);

  // ✅ Update status with API call
  const updateStatus = async (index, newStatus) => {
    const purchaseId = purchases[index].id;

    // Set loading state for this specific row
    setUpdatingStatus(prev => ({ ...prev, [purchaseId]: true }));
    
    try {
      // Make the API call to update status
      const response = await axiosInstance.put(`/purchases/purchase/status/${purchaseId}`, {
        status: newStatus.toLowerCase()
      });
      
      if (response.data.success) {
        // Update local state on success
        const updated = [...purchases];
        updated[index].status = newStatus;
        setPurchases(updated);
      } else {
        alert("Failed to update status. Please try again.");
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update status. Please try again.");
    } finally {
      // Clear loading state for this row
      setUpdatingStatus(prev => {
        const newState = { ...prev };
        delete newState[purchaseId];
        return newState;
      });
    }
  };

  const toggleRowExpansion = (index) => {
    setExpandedRows(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const getStatusColor = (status) => {
    switch(status.toLowerCase()) {
      case "pending": return { bg: "#ffe9b3", color: "#8a5d00" };
      case "approved": return { bg: "#2ecc71", color: "white" };
      case "rejected": return { bg: "#ff6e6e", color: "white" };
      default: return { bg: "#f0f0f0", color: "#333" };
    }
  };

  const getPlanColor = (plan) => {
    return plan.toLowerCase().includes("gold") || plan.toLowerCase().includes("professional")
      ? { bg: "#ffd200", color: "#111" }
      : { bg: "#b6e6ef", color: "#083d44" };
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading purchase requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* HEADER */}
      <div className="container-fluid p-3 p-md-4">
        <div className="row align-items-center mb-4 g-3">
          <div className="col-12 col-md-8">
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-circle bg-dark d-flex align-items-center justify-content-center text-white" 
                   style={{ width: "40px", height: "40px", fontSize: "18px", fontWeight: "600" }}>
                📘
              </div>
              <h2 className="mb-0 fw-bold fs-4 fs-md-3">Requested Plans</h2>
            </div>
          </div>
          <div className="col-12 col-md-4 text-md-end d-flex justify-content-md-end gap-2 align-items-center">
            <div className="dropdown w-100 w-md-auto">
              <button
                className="btn btn-success dropdown-toggle text-white d-flex align-items-center justify-content-center w-100"
                type="button"
                id="exportRequestsDropdown"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                style={{ backgroundColor: "#28a745", border: "none", borderRadius: "10px", fontWeight: 600, padding: "10px 20px", fontSize: "0.9rem" }}
              >
                <i className="bi bi-download me-2"></i>
                Export
              </button>
              <ul className="dropdown-menu shadow-sm" aria-labelledby="exportRequestsDropdown" style={{ borderRadius: "8px", border: "none" }}>
                <li>
                  <button className="dropdown-item d-flex align-items-center py-2" onClick={exportRequestsToExcel}>
                    <span style={{ color: "#28a745", marginRight: "10px", fontWeight: 600 }}>XLSX</span> Export to Excel
                  </button>
                </li>
                <li>
                  <button className="dropdown-item d-flex align-items-center py-2" onClick={exportRequestsToPDF}>
                    <span style={{ color: "#dc3545", marginRight: "10px", fontWeight: 600 }}>PDF</span> Export to PDF
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* DESKTOP TABLE VIEW */}
        <div className="d-none d-lg-block">
          <div className="card border-0 shadow-sm">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="py-3 px-3 border-0">Gym / Admin</th>
                    <th className="py-3 px-3 border-0">Contact</th>
                    <th className="py-3 px-3 border-0">Plan</th>
                    <th className="py-3 px-3 border-0">Requested On</th>
                    <th className="py-3 px-3 border-0">Start Date</th>
                    <th className="py-3 px-3 border-0">Expiry Date</th>
                    <th className="py-3 px-3 border-0">Status</th>
                    <th className="py-3 px-3 border-0 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-4 text-muted">No purchase requests found</td>
                    </tr>
                  ) : (
                    purchases.map((item, index) => (
                      <tr 
                        key={item.id} 
                        className="border-bottom"
                        onMouseEnter={() => setHoverIndex(index)}
                        onMouseLeave={() => setHoverIndex(null)}
                        style={{ 
                          backgroundColor: hoverIndex === index ? "#f5faff" : "transparent",
                          transition: "all 0.3s ease"
                        }}
                      >
                        <td className="py-3 px-3">
                          <div className="fw-semibold">{item.admin}</div>
                          <div className="text-muted small" style={{fontSize: "11px"}}>{item.company} - {item.branch}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-muted small">{item.email}</div>
                          <div className="text-muted small">{item.phone}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span 
                            className="badge rounded-pill px-3 py-2"
                            style={{ 
                              backgroundColor: getPlanColor(item.plan).bg,
                              color: getPlanColor(item.plan).color,
                              fontSize: "13px",
                              fontWeight: "600"
                            }}
                          >
                            {item.plan}
                          </span>
                          <div className="text-muted small mt-1" style={{fontSize: "11px"}}>
                            {item.billing} • <strong className="text-primary">₹{item.amount}</strong>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-muted small">{item.purchaseDate}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="fw-semibold text-success small">{item.startDate}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="fw-semibold text-danger small">{item.expiryDate}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span 
                            className="badge rounded-pill px-3 py-2"
                            style={{ 
                              backgroundColor: getStatusColor(item.status).bg,
                              color: getStatusColor(item.status).color,
                              fontSize: "13px",
                              fontWeight: "600"
                            }}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="d-flex gap-2 justify-content-center">
                            {item.status.toLowerCase() === "pending" ? (
                              <>
                                <button
                                  className="btn btn-sm btn-success rounded-pill px-3 d-flex align-items-center gap-1"
                                  style={{ 
                                    fontSize: "12px",
                                    transition: "all 0.3s ease",
                                    transform: hoverIndex === index ? "translateY(-2px)" : "translateY(0)"
                                  }}
                                  onClick={() => updateStatus(index, "Approved")}
                                  disabled={updatingStatus[item.id]}
                                >
                                  {updatingStatus[item.id] ? (
                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                  ) : (
                                    <FaCheck size={12} />
                                  )}
                                  Approve
                                </button>
                                <button
                                  className="btn btn-sm btn-danger rounded-pill px-3 d-flex align-items-center gap-1"
                                  style={{ 
                                    fontSize: "12px",
                                    transition: "all 0.3s ease",
                                    transform: hoverIndex === index ? "translateY(-2px)" : "translateY(0)"
                                  }}
                                  onClick={() => updateStatus(index, "Rejected")}
                                  disabled={updatingStatus[item.id]}
                                >
                                  {updatingStatus[item.id] ? (
                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                  ) : (
                                    <FaTimes size={12} />
                                  )}
                                  Reject
                                </button>
                              </>
                            ) : (
                              <span className="text-muted" style={{ fontSize: "12px" }}>Processed</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* TABLET VIEW */}
        <div className="d-none d-md-block d-lg-none">
          <div className="card border-0 shadow-sm">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="py-3 px-2 border-0">Gym</th>
                    <th className="py-3 px-2 border-0">Plan</th>
                    <th className="py-3 px-2 border-0">Status</th>
                    <th className="py-3 px-2 border-0 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-4 text-muted">No requests</td>
                    </tr>
                  ) : (
                    purchases.map((item, index) => (
                      <tr 
                        key={item.id} 
                        className="border-bottom"
                        onMouseEnter={() => setHoverIndex(index)}
                        onMouseLeave={() => setHoverIndex(null)}
                        style={{ 
                          backgroundColor: hoverIndex === index ? "#f5faff" : "transparent",
                          transition: "all 0.3s ease"
                        }}
                      >
                        <td className="py-3 px-2">
                          <div className="fw-semibold">{item.admin}</div>
                          <div className="text-muted small">{item.email}</div>
                          <div className="text-muted small">{item.phone}</div>
                        </td>
                        <td className="py-3 px-2">
                          <span 
                            className="badge rounded-pill px-2 py-1"
                            style={{ 
                              backgroundColor: getPlanColor(item.plan).bg,
                              color: getPlanColor(item.plan).color,
                              fontSize: "12px",
                              fontWeight: "600"
                            }}
                          >
                            {item.plan}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <span 
                            className="badge rounded-pill px-2 py-1"
                            style={{ 
                              backgroundColor: getStatusColor(item.status).bg,
                              color: getStatusColor(item.status).color,
                              fontSize: "12px",
                              fontWeight: "600"
                            }}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <div className="d-flex gap-1 justify-content-center flex-wrap">
                            {item.status.toLowerCase() === "pending" ? (
                              <>
                                <button
                                  className="btn btn-sm btn-success rounded-pill px-2 py-1"
                                  style={{ fontSize: "11px" }}
                                  onClick={() => updateStatus(index, "Approved")}
                                  disabled={updatingStatus[item.id]}
                                >
                                  {updatingStatus[item.id] ? (
                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                  ) : (
                                    <FaCheck size={10} />
                                  )}
                                </button>
                                <button
                                  className="btn btn-sm btn-danger rounded-pill px-2 py-1"
                                  style={{ fontSize: "11px" }}
                                  onClick={() => updateStatus(index, "Rejected")}
                                  disabled={updatingStatus[item.id]}
                                >
                                  {updatingStatus[item.id] ? (
                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                  ) : (
                                    <FaTimes size={10} />
                                  )}
                                </button>
                              </>
                            ) : (
                              <span className="text-muted" style={{ fontSize: "11px" }}>Processed</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* MOBILE CARD VIEW */}
        <div className="d-lg-none">
          {purchases.length === 0 ? (
            <div className="text-center py-5 text-muted">No purchase requests found</div>
          ) : (
            purchases.map((item, index) => (
              <div key={item.id} className="card border-0 shadow-sm mb-3">
                <div className="card-body p-3">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h6 className="mb-1 fw-bold">{item.admin}</h6>
                      <p className="text-muted small mb-0">{item.email}</p>
                    </div>
                    <button
                      className="btn btn-sm btn-light rounded-circle p-2"
                      onClick={() => toggleRowExpansion(index)}
                      style={{ border: "none" }}
                    >
                      {expandedRows.includes(index) ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                    </button>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <small className="text-muted d-block">Plan</small>
                      <span 
                        className="badge rounded-pill px-2 py-1 mt-1 d-inline-block"
                        style={{ 
                          backgroundColor: getPlanColor(item.plan).bg,
                          color: getPlanColor(item.plan).color,
                          fontSize: "12px",
                          fontWeight: "600"
                        }}
                      >
                        {item.plan}
                      </span>
                    </div>
                    <div className="col-6">
                      <small className="text-muted d-block">Status</small>
                      <span 
                        className="badge rounded-pill px-2 py-1 mt-1 d-inline-block"
                        style={{ 
                          backgroundColor: getStatusColor(item.status).bg,
                          color: getStatusColor(item.status).color,
                          fontSize: "12px",
                          fontWeight: "600"
                        }}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>

                  {expandedRows.includes(index) && (
                    <div className="border-top pt-3">
                      <div className="row g-2 mb-3">
                        <div className="col-6">
                          <small className="text-muted d-block">Billing</small>
                          <span className="fw-semibold">{item.billing}</span>
                        </div>
                        <div className="col-6">
                          <small className="text-muted d-block">Requested On</small>
                          <span className="fw-semibold">{item.purchaseDate}</span>
                        </div>
                        <div className="col-6">
                          <small className="text-muted d-block">Start Date</small>
                          <span className="fw-semibold text-success">{item.startDate}</span>
                        </div>
                        <div className="col-6">
                          <small className="text-muted d-block">Expiry Date</small>
                          <span className="fw-semibold text-danger">{item.expiryDate}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {item.status.toLowerCase() === "pending" ? (
                    <div className="d-flex gap-2 mt-3">
                      <button
                        className="btn btn-success rounded-pill flex-fill py-2 d-flex align-items-center justify-content-center gap-1"
                        style={{ fontSize: "13px" }}
                        onClick={() => updateStatus(index, "Approved")}
                        disabled={updatingStatus[item.id]}
                      >
                        {updatingStatus[item.id] ? (
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        ) : (
                          <FaCheck size={12} />
                        )}
                        Approve
                      </button>
                      <button
                        className="btn btn-danger rounded-pill flex-fill py-2 d-flex align-items-center justify-content-center gap-1"
                        style={{ fontSize: "13px" }}
                        onClick={() => updateStatus(index, "Rejected")}
                        disabled={updatingStatus[item.id]}
                      >
                        {updatingStatus[item.id] ? (
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        ) : (
                          <FaTimes size={12} />
                        )}
                        Reject
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3 text-center">
                      <span className="text-muted small">Processed</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestedPlans;