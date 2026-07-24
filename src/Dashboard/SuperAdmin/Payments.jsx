import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  FaFileExport,
  FaChartLine,
  FaCheckCircle,
  FaExclamationTriangle,
  FaFilePdf,
  FaTrash,
  FaArrowRight,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import { BsEye } from "react-icons/bs";
import { FaEdit } from "react-icons/fa";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import axiosInstance from "../../Api/axiosInstance";
import BaseUrl from "../../Api/BaseUrl";

const tabs = ["All Payments", "Success", "Pending", "Failed"];

const transactions = [];

const Payments = () => {
  const [activeTab, setActiveTab] = useState("All Payments");
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [transactionsList, setTransactionsList] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [paymentSettings, setPaymentSettings] = useState({
    currency: "INR",
    autoRefund: true,
    notifications: true,
    paymentMethods: ["Credit Card", "PayPal", "Bank Transfer", "Digital Wallet"]
  });

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get("/purchases");
        if (response.data.success && Array.isArray(response.data.data)) {
          const mapped = response.data.data.map(item => {
            let methodText = "Online Gateway";
            if (item.paymentMethod) {
              methodText = `${item.paymentMethod} (${item.paymentDetails || 'N/A'})`;
            } else if (item.selectedPlan && item.selectedPlan.toLowerCase().includes("trial")) {
              methodText = "Free Onboarding";
            } else if (item.amount === 0 || !item.amount) {
              methodText = "Free Plan";
            }
            
            // Map statuses: approved -> Success, rejected -> Failed, pending -> Pending
            let statusText = "Pending";
            if (item.status.toLowerCase() === "approved") statusText = "Success";
            if (item.status.toLowerCase() === "rejected") statusText = "Failed";

            return {
              id: item.transactionId || `PAY-${new Date(item.purchaseDate).getFullYear()}${String(new Date(item.purchaseDate).getMonth()+1).padStart(2,'0')}${String(new Date(item.purchaseDate).getDate()).padStart(2,'0')}-${String(item.id).padStart(4,'0')}`,
              dbId: item.id,
              date: new Date(item.purchaseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              customer: item.companyName || item.adminName || "Unknown Admin",
              email: item.email || "N/A",
              phone: item.phone || "N/A",
              plan: item.selectedPlan || "SaaS Gym Management Plan",
              billingDuration: item.billingDuration || "Monthly",
              gstNumber: item.gstNumber || "N/A",
              method: { name: methodText },
              amount: `₹${parseFloat(item.amount || 0).toLocaleString('en-IN')}`,
              rawAmount: parseFloat(item.amount || 0),
              status: statusText,
              reason: item.status.toLowerCase() === "rejected" ? "Cancelled by Admin" : ""
            };
          });
          setTransactionsList(mapped);
        }
      } catch (error) {
        console.error("Failed to fetch purchases:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPurchases();
  }, []);

  // Edit form state
  const [editForm, setEditForm] = useState({
    id: "",
    date: "",
    customer: "",
    method: "",
    amount: "",
    status: "",
    reason: ""
  });

  const handleViewDetails = (txn) => {
    setSelectedTransaction(txn);
    setShowModal(true);
  };

  const handleEditClick = (txn) => {
    setSelectedTransaction(txn);
    setEditForm({
      id: txn.id,
      date: txn.date,
      customer: txn.customer,
      method: txn.method.name,
      amount: txn.amount,
      status: txn.status,
      reason: txn.reason || ""
    });
    setShowEditModal(true);
  };

  const handleDeleteClick = (txn) => {
    setTransactionToDelete(txn);
    setShowDeleteModal(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const updatedTransactions = transactionsList.map(txn => 
      txn.id === editForm.id 
        ? { ...txn, 
            customer: editForm.customer,
            method: { name: editForm.method },
            amount: editForm.amount,
            status: editForm.status,
            reason: editForm.reason
          }
        : txn
    );
    setTransactionsList(updatedTransactions);
    setShowEditModal(false);
    alert("Transaction updated successfully!");
  };

  const handleConfirmDelete = () => {
    setTransactionsList(transactionsList.filter(txn => txn.id !== transactionToDelete.id));
    setShowDeleteModal(false);
    setTransactionToDelete(null);
    alert("Transaction deleted successfully!");
  };

  const handleExportTransaction = (txn) => {
    alert(`Transaction ${txn.id} export requires html2canvas.`);
  };

  const handleExportAll = () => {
    if (transactionsList.length === 0) {
      alert("No data to export");
      return;
    }
    
    const exportData = transactionsList.map(txn => ({
      ID: txn.id,
      Date: txn.date,
      Customer: txn.customer,
      Method: txn.method.name,
      Amount: txn.amount,
      Status: txn.status
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payments");
    XLSX.writeFile(workbook, "Payments_Data.xlsx");
  };

  const handlePDFDownload = async () => {
    if (transactionsList.length === 0) {
      alert("No data to export");
      return;
    }
    
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF('landscape');

    doc.setFontSize(16);
    doc.text("Subscription Transactions List", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [['ID', 'Date', 'Customer', 'Method', 'Amount', 'Status']],
      body: transactionsList.map(txn => [
        txn.id,
        txn.date,
        txn.customer,
        txn.method.name,
        txn.amount,
        txn.status
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [40, 167, 69] }
    });

    doc.save("Payments_Data.pdf");
  };

  const handleSettingChange = (setting, value) => {
    setPaymentSettings({ ...paymentSettings, [setting]: value });
  };

  const filteredTransactions = transactionsList.filter(txn => {
    let matchesTab = true;
    if (activeTab === "Success") matchesTab = txn.status === "Success";
    else if (activeTab === "Pending") matchesTab = txn.status === "Pending";
    else if (activeTab === "Failed") matchesTab = txn.status === "Failed";
    
    const matchesSearch = searchTerm === "" ||
      txn.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.customer.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesTab && matchesSearch;
  });

  // Action buttons component for consistency - First Screenshot Style
  const ActionButtons1 = ({ txn }) => (
    <div className="d-flex gap-2">
      <button 
        className="action-btn arrow-btn" 
        onClick={() => alert("Forward action")}
        title="Forward"
      >
        <FaArrowRight size={14} />
      </button>
      <button 
        className="action-btn check-btn" 
        onClick={() => alert("Approve action")}
        title="Approve"
      >
        <FaCheck size={14} />
      </button>
      <button 
        className="action-btn trash-btn" 
        onClick={() => handleDeleteClick(txn)}
        title="Delete"
      >
        <FaTrash size={14} />
      </button>
    </div>
  );

  const handleDownloadSinglePDF = (txn) => {
    const url = `${BaseUrl}purchases/invoice/pdf/${txn.dbId}`;
    window.open(url, "_blank");
  };

  const handleDownloadSelectedPDFs = () => {
    if (selectedIds.length === 0) {
      alert("Please select at least one transaction to download invoices.");
      return;
    }
    const selectedTxns = transactionsList.filter(t => selectedIds.includes(t.id));
    selectedTxns.forEach((txn, index) => {
      setTimeout(() => {
        handleDownloadSinglePDF(txn);
      }, index * 400);
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredTransactions.map(t => t.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Action buttons component for consistency - Second Screenshot Style
  const ActionButtons2 = ({ txn }) => (
    <div className="d-flex gap-2">
      <button 
        className="action-btn pdf-btn" 
        onClick={() => handleDownloadSinglePDF(txn)}
        title="Download A4 Tax Invoice PDF"
      >
        <FaFilePdf size={14} />
      </button>
      <button 
        className="action-btn eye-btn" 
        onClick={() => handleViewDetails(txn)}
        title="View Details"
      >
        <BsEye size={14} />
      </button>
      <button 
        className="action-btn edit-btn" 
        onClick={() => handleEditClick(txn)}
        title="Edit Transaction"
      >
        <FaEdit size={14} />
      </button>
      <button 
        className="action-btn trash-btn" 
        onClick={() => handleDeleteClick(txn)}
        title="Delete Transaction"
      >
        <FaTrash size={14} />
      </button>
    </div>
  );

  const totalRevenue = transactionsList
    .filter(t => t.status === "Success")
    .reduce((sum, t) => sum + (t.rawAmount || 0), 0);

  const totalCount = transactionsList.length;
  const successCount = transactionsList.filter(t => t.status === "Success").length;
  const successRate = totalCount > 0 ? ((successCount / totalCount) * 100).toFixed(1) : "0.0";
  const failedCount = transactionsList.filter(t => t.status === "Failed").length;

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-2 p-sm-3 p-md-4">

      {/* HEADER */}
      <div className="row mb-3 mb-md-4 align-items-center">
        <div className="col-12 col-md-8 mb-3 mb-md-0">
          <h4 className="fw-bold fs-4 fs-md-3">Payments</h4>
          <p className="text-muted mb-0 fs-6">Manage all your payment transactions</p>
        </div>
        <div className="col-12 col-md-4 text-md-end d-flex justify-content-md-end gap-2 align-items-center flex-wrap">
          <div className="dropdown w-100 w-md-auto">
            <button
              className="btn btn-success dropdown-toggle text-white d-flex align-items-center justify-content-center w-100"
              type="button"
              id="exportPaymentsDropdown"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              style={{ backgroundColor: "#28a745", border: "none", borderRadius: "10px", fontWeight: 600, padding: "10px 20px", fontSize: "0.9rem" }}
            >
              <i className="bi bi-download me-2"></i>
              Export
            </button>
            <ul className="dropdown-menu shadow-sm" aria-labelledby="exportPaymentsDropdown" style={{ borderRadius: "8px", border: "none" }}>
              <li>
                <button className="dropdown-item d-flex align-items-center py-2" onClick={handleExportAll}>
                  <span style={{ color: "#28a745", marginRight: "10px", fontWeight: 600 }}>XLSX</span> Export to Excel
                </button>
              </li>
              <li>
                <button className="dropdown-item d-flex align-items-center py-2" onClick={handlePDFDownload}>
                  <span style={{ color: "#dc3545", marginRight: "10px", fontWeight: 600 }}>PDF</span> Export Table Summary
                </button>
              </li>
              <li>
                <button className="dropdown-item d-flex align-items-center py-2" onClick={handleDownloadSelectedPDFs}>
                  <span style={{ color: "#d90429", marginRight: "10px", fontWeight: 600 }}>A4</span> Download Selected Invoices ({selectedIds.length})
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* STATISTICS CARDS */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center gap-3 mb-2">
                <div className="icon-card bg-info text-white"><FaChartLine /></div>
                <h6 className="text-muted mb-0">Total Revenue</h6>
              </div>
              <h5 className="fw-bold">₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h5>
              <p className="text-success small mb-0">↑ from last month</p>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center gap-3 mb-2">
                <div className="icon-card bg-success text-white"><FaCheckCircle /></div>
                <h6 className="text-muted mb-0">Success Rate</h6>
              </div>
              <h5 className="fw-bold">{successRate}%</h5>
              <p className="text-success small mb-0">↑ from last month</p>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center gap-3 mb-2">
                <div className="icon-card bg-danger text-white"><FaExclamationTriangle /></div>
                <h6 className="text-muted mb-0">Failed Transactions</h6>
              </div>
              <h5 className="fw-bold text-danger">{failedCount}</h5>
              <p className="text-danger small mb-0">↓ from last month</p>
            </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="mb-3 overflow-auto">
        <ul className="nav nav-tabs flex-nowrap" style={{ minWidth: "max-content" }}>
          {tabs.map(tab => (
            <li className="nav-item" key={tab}>
              <button className={`nav-link ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>
                {tab}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* SEARCH BAR */}
      {["All Payments", "Success", "Pending", "Failed"].includes(activeTab) && (
        <div className="mb-3">
          <input
            type="text"
            className="form-control search-bar"
            placeholder="Search by transaction ID or customer name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      {/* DESKTOP TABLE VIEW - SECOND SCREENSHOT STYLE (WITH FUNCTIONALITY) */}
      {["All Payments", "Success", "Pending", "Failed"].includes(activeTab) && (
        <>
          {selectedIds.length > 0 && (
            <div className="alert alert-info d-flex align-items-center justify-content-between mb-3 shadow-sm py-2 px-3" style={{ borderRadius: "10px" }}>
              <div>
                <strong>{selectedIds.length}</strong> transaction(s) selected
              </div>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-sm btn-danger d-flex align-items-center"
                  onClick={handleDownloadSelectedPDFs}
                >
                  <FaFilePdf className="me-2" />
                  Download Selected A4 Invoices ({selectedIds.length})
                </button>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setSelectedIds([])}
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}
          <div className="table-responsive bg-white rounded shadow-sm p-3 d-none d-md-block" id="transaction-table">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={filteredTransactions.length > 0 && selectedIds.length === filteredTransactions.length}
                      onChange={handleSelectAll}
                      style={{ cursor: "pointer" }}
                    />
                  </th>
                  <th>ID</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Method</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredTransactions.map((txn, idx) => (
                  <tr key={idx}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(txn.id)}
                        onChange={() => handleSelectOne(txn.id)}
                        style={{ cursor: "pointer" }}
                      />
                    </td>
                    <td>{txn.id}</td>
                    <td>{txn.date}</td>
                    <td><strong>{txn.customer}</strong></td>
                  <td>{txn.method.name}</td>
                  <td>{txn.amount}</td>

                  <td>
                    {txn.status === "Success" && <span className="badge bg-success">Success</span>}
                    {txn.status === "Failed" && (
                      <>
                        <span className="badge bg-danger">Failed</span><br />
                        <small className="text-danger">{txn.reason}</small>
                      </>
                    )}
                    {txn.status === "Pending" && <span className="badge bg-warning text-dark">Pending</span>}
                  </td>

                  {/* FUNCTIONAL ACTION BUTTONS */}
                  <td>
                    <ActionButtons2 txn={txn} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}

      {/* MOBILE CARD VIEW */}
      {["All Payments", "Success", "Pending", "Failed"].includes(activeTab) && (
        <div className="d-md-none">
          {filteredTransactions.length === 0 ? (
            <div className="bg-white rounded shadow-sm p-4 text-center">
              <p className="text-muted">No transactions found</p>
            </div>
          ) : (
            filteredTransactions.map((txn, idx) => (
              <div key={idx} className="card shadow-sm mb-3">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <h6 className="card-title mb-1">{txn.id}</h6>
                      <p className="text-muted small mb-0">{txn.date}</p>
                    </div>
                    <div>
                      {txn.status === "Success" && <span className="badge bg-success">Success</span>}
                      {txn.status === "Failed" && <span className="badge bg-danger">Failed</span>}
                      {txn.status === "Pending" && <span className="badge bg-warning text-dark">Pending</span>}
                    </div>
                  </div>
                  
                  <div className="row g-2 mb-2">
                    <div className="col-6">
                      <small className="text-muted d-block">Customer</small>
                      <span className="fw-semibold">{txn.customer}</span>
                    </div>
                    <div className="col-6">
                      <small className="text-muted d-block">Amount</small>
                      <span className="fw-semibold">{txn.amount}</span>
                    </div>
                  </div>
                  
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <small className="text-muted d-block">Method</small>
                      <span>{txn.method.name}</span>
                    </div>
                    {txn.status === "Failed" && txn.reason && (
                      <div className="col-12">
                        <small className="text-muted d-block">Reason</small>
                        <span className="text-danger small">{txn.reason}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* FUNCTIONAL ACTION BUTTONS FOR MOBILE */}
                  <div className="d-flex justify-content-end gap-2">
                    <ActionButtons2 txn={txn} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* PAYMENT SETTINGS */}
      {activeTab === "Payment Settings" && (
        <div className="bg-white rounded shadow-sm p-4">
          <h5 className="mb-4">Payment Settings</h5>
          
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <div className="mb-3">
                <label className="form-label fw-semibold">Default Currency</label>
                <select 
                  className="form-select" 
                  value={paymentSettings.currency}
                  onChange={(e) => handleSettingChange('currency', e.target.value)}
                >
                  <option value="INR">INR - Indian Rupee</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="JPY">JPY - Japanese Yen</option>
                </select>
              </div>
            </div>
            
            <div className="col-12 col-md-6">
              <div className="mb-3">
                <label className="form-label fw-semibold">Payment Methods</label>
                <div className="d-flex flex-wrap gap-2">
                  {paymentSettings.paymentMethods.map((method, idx) => (
                    <span key={idx} className="badge bg-light text-dark p-2">
                      {method}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="col-12">
              <div className="form-check form-switch mb-3">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  id="autoRefund"
                  checked={paymentSettings.autoRefund}
                  onChange={(e) => handleSettingChange('autoRefund', e.target.checked)}
                />
                <label className="form-check-label" htmlFor="autoRefund">
                  Enable automatic refunds for failed transactions
                </label>
              </div>
              
              <div className="form-check form-switch">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  id="notifications"
                  checked={paymentSettings.notifications}
                  onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                />
                <label className="form-check-label" htmlFor="notifications">
                  Send email notifications for payment status changes
                </label>
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <button className="btn btn-custom">Save Settings</button>
          </div>
        </div>
      )}

      {/* VIEW DETAILS & INVOICE MODAL */}
      {showModal && selectedTransaction && (
        <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header py-3 bg-light">
                <div>
                  <h5 className="modal-title fw-bold text-dark mb-0">Transaction & Tax Invoice Details</h5>
                  <small className="text-muted">A4 Systematic Invoice Breakdown</small>
                </div>
                <button className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body py-4">
                {/* SECTION 1: CUSTOMER & GYM INFO */}
                <h6 className="fw-bold text-primary mb-2">Customer & Gym Information</h6>
                <div className="card border-0 bg-light mb-3">
                  <div className="card-body p-3">
                    <div className="row g-3">
                      <div className="col-12 col-md-4">
                        <label className="form-label text-muted small mb-0">Gym / Customer Name</label>
                        <p className="fw-bold mb-0">{selectedTransaction.customer}</p>
                      </div>
                      <div className="col-12 col-md-4">
                        <label className="form-label text-muted small mb-0">Email Address</label>
                        <p className="fw-bold mb-0">{selectedTransaction.email}</p>
                      </div>
                      <div className="col-12 col-md-4">
                        <label className="form-label text-muted small mb-0">Phone / Contact</label>
                        <p className="fw-bold mb-0">{selectedTransaction.phone}</p>
                      </div>
                      <div className="col-12 col-md-4">
                        <label className="form-label text-muted small mb-0">GSTIN</label>
                        <p className="fw-bold mb-0">{selectedTransaction.gstNumber}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: SUBSCRIPTION & PLAN INFO */}
                <h6 className="fw-bold text-primary mb-2">Subscription & Plan Details</h6>
                <div className="card border-0 bg-light mb-3">
                  <div className="card-body p-3">
                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <label className="form-label text-muted small mb-0">Selected Plan</label>
                        <p className="fw-bold mb-0">{selectedTransaction.plan}</p>
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label text-muted small mb-0">Billing Duration</label>
                        <p className="fw-bold mb-0">{selectedTransaction.billingDuration}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 3: PAYMENT & TRANSACTION INFO */}
                <h6 className="fw-bold text-primary mb-2">Payment Details</h6>
                <div className="card border-0 bg-light mb-2">
                  <div className="card-body p-3">
                    <div className="row g-3">
                      <div className="col-12 col-md-4">
                        <label className="form-label text-muted small mb-0">Transaction ID</label>
                        <p className="fw-bold mb-0">{selectedTransaction.id}</p>
                      </div>
                      <div className="col-12 col-md-4">
                        <label className="form-label text-muted small mb-0">Date</label>
                        <p className="fw-bold mb-0">{selectedTransaction.date}</p>
                      </div>
                      <div className="col-12 col-md-4">
                        <label className="form-label text-muted small mb-0">Payment Method</label>
                        <p className="fw-bold mb-0">{selectedTransaction.method.name}</p>
                      </div>
                      <div className="col-12 col-md-4">
                        <label className="form-label text-muted small mb-0">Total Amount</label>
                        <p className="fw-bold mb-0 text-success fs-5">{selectedTransaction.amount}</p>
                      </div>
                      <div className="col-12 col-md-4">
                        <label className="form-label text-muted small mb-0">Status</label>
                        <div>
                          {selectedTransaction.status === "Success" && <span className="badge bg-success">Success</span>}
                          {selectedTransaction.status === "Failed" && <span className="badge bg-danger">Failed</span>}
                          {selectedTransaction.status === "Pending" && <span className="badge bg-warning text-dark">Pending</span>}
                        </div>
                      </div>
                      {selectedTransaction.reason && (
                        <div className="col-12">
                          <label className="form-label text-muted small mb-0">Reason</label>
                          <p className="fw-bold mb-0 text-danger">{selectedTransaction.reason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer py-3 d-flex justify-content-between align-items-center">
                <button
                  className="btn btn-danger d-flex align-items-center fw-bold"
                  onClick={() => handleDownloadSinglePDF(selectedTransaction)}
                >
                  <FaFilePdf className="me-2" />
                  Download A4 Tax Invoice (PDF)
                </button>
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT TRANSACTION MODAL - COMPACT SIZE */}
      {showEditModal && selectedTransaction && (
        <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-compact">
            <div className="modal-content">
              <div className="modal-header py-2">
                <h5 className="modal-title">Edit Transaction</h5>
                <button className="btn-close" onClick={() => setShowEditModal(false)}></button>
              </div>
              <form onSubmit={handleEditSubmit}>
                <div className="modal-body py-3">
                  <div className="row g-2">
                    <div className="col-12">
                      <label className="form-label fw-semibold small">Transaction ID</label>
                      <input 
                        type="text" 
                        className="form-control form-control-sm" 
                        value={editForm.id} 
                        disabled
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold small">Customer Name</label>
                      <input 
                        type="text" 
                        className="form-control form-control-sm" 
                        value={editForm.customer} 
                        onChange={(e) => setEditForm({...editForm, customer: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold small">Payment Method</label>
                      <select 
                        className="form-select form-select-sm" 
                        value={editForm.method} 
                        onChange={(e) => setEditForm({...editForm, method: e.target.value})}
                        required
                      >
                        <option value="Credit Card">Credit Card</option>
                        <option value="PayPal">PayPal</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Digital Wallet">Digital Wallet</option>
                      </select>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold small">Amount</label>
                      <input 
                        type="text" 
                        className="form-control form-control-sm" 
                        value={editForm.amount} 
                        onChange={(e) => setEditForm({...editForm, amount: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold small">Status</label>
                      <select 
                        className="form-select form-select-sm" 
                        value={editForm.status} 
                        onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                        required
                      >
                        <option value="Success">Success</option>
                        <option value="Failed">Failed</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </div>
                    {editForm.status === "Failed" && (
                      <div className="col-12">
                        <label className="form-label fw-semibold small">Reason</label>
                        <input 
                          type="text" 
                          className="form-control form-control-sm" 
                          value={editForm.reason} 
                          onChange={(e) => setEditForm({...editForm, reason: e.target.value})}
                          placeholder="Enter reason for failure"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="modal-footer py-2">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowEditModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-custom btn-sm">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL - COMPACT SIZE */}
      {showDeleteModal && transactionToDelete && (
        <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-compact">
            <div className="modal-content">
              <div className="modal-header py-2">
                <h5 className="modal-title">Confirm Delete</h5>
                <button className="btn-close" onClick={() => setShowDeleteModal(false)}></button>
              </div>
              <div className="modal-body py-3">
                <div className="text-center py-2">
                  <div className="mb-2">
                    <FaTrash size={36} className="text-danger" />
                  </div>
                  <h6>Are you sure?</h6>
                  <p className="text-muted small">This action cannot be undone. This will permanently delete the transaction.</p>
                  <div className="alert alert-danger py-2">
                    <strong>Transaction ID:</strong> {transactionToDelete.id}<br />
                    <strong>Customer:</strong> {transactionToDelete.customer}<br />
                    <strong>Amount:</strong> {transactionToDelete.amount}
                  </div>
                </div>
              </div>
              <div className="modal-footer py-2">
                <button className="btn btn-secondary btn-sm" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                <button className="btn btn-danger btn-sm" onClick={handleConfirmDelete}>Delete Transaction</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .search-bar { 
          border-radius:10px; 
          padding:0.6rem 1rem; 
          border: 1px solid #e0e0e0;
        }
        
        .btn-custom { 
          background-color:#6EB2CC; 
          color:white; 
          border:none; 
          border-radius: 8px;
          transition: all 0.3s ease;
        }
        
        .btn-custom:hover {
          background-color:#5a9db5;
          transform: translateY(-1px);
        }
        
        .icon-card { 
          width:40px; 
          height:40px; 
          border-radius:8px; 
          display:flex; 
          align-items:center; 
          justify-content:center; 
          font-size: 18px;
        }

        /* SECOND SCREENSHOT STYLE ACTION BUTTONS */
        .action-btn {
          width: 38px;
          height: 38px;
          border-radius: 6px;
          border: 2px solid transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 3px 8px rgba(0,0,0,0.15);
        }
        
        .eye-btn {
          background: white;
          border-color: #c9c9c9;
          color: #333;
        }
        
        .eye-btn:hover {
          background: #f8f9fa;
          border-color: #a0a0a0;
        }
        
        .edit-btn {
          background: #e6f7ff;
          border-color: #86c9ef;
          color: #0077b6;
        }
        
        .edit-btn:hover {
          background: #d0ebff;
          border-color: #5ca9d9;
        }
        
        .pdf-btn {
          background: #fff0f0;
          border-color: #ffb3b3;
          color: #d90429;
        }
        
        .pdf-btn:hover {
          background: #ffe5e5;
          border-color: #ff4d4d;
        }

        .trash-btn {
          background: #ffe5e5;
          border-color: #ff4d4d;
          color: #d90429;
        }
        
        .trash-btn:hover {
          background: #ffcccc;
          border-color: #e63946;
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .action-btn {
            width: 35px;
            height: 35px;
          }
          
          .action-btn svg {
            font-size: 12px;
          }
        }

        /* Tab responsiveness */
        .nav-tabs .nav-link {
          white-space: nowrap;
          padding: 0.5rem 1rem;
        }

        /* Card hover effects */
        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.1);
          transition: all 0.3s ease;
        }

        /* Table hover effects */
        .table-hover tbody tr:hover {
          background-color: #f8f9fa;
        }

        /* Modal enhancements - COMPACT SIZE */
        .modal-compact {
          max-width: 500px;
        }
        
        @media (max-width: 576px) {
          .modal-compact {
            max-width: 95%;
            margin: 10px;
          }
        }

        .modal-content {
          border-radius: 12px;
          border: none;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }

        .modal-header {
          border-bottom: 1px solid #e9ecef;
          padding: 1rem 1.5rem;
        }

        .modal-body {
          padding: 1rem 1.5rem;
        }

        .modal-footer {
          border-top: 1px solid #e9ecef;
          padding: 1rem 1.5rem;
        }
      `}</style>

    </div>
  );
};

export default Payments;