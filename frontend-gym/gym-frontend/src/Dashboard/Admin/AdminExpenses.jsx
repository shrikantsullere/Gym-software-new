import React, { useState, useEffect } from "react";
import axios from "axios";
import BaseUrl from "../../Api/BaseUrl";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCoins,
  faPlus,
  faCalendarAlt,
  faChartLine,
  faWallet,
  faUserTie,
  faSync,
  faFilter,
} from "@fortawesome/free-solid-svg-icons";

const AdminExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  ); // YYYY-MM
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem("authToken") || localStorage.getItem("token");
  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  // Form state
  const [formData, setFormData] = useState({
    category: "Rent",
    description: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    paymentMode: "Bank Transfer",
  });

  const categories = [
    "Rent",
    "Electricity / Utility",
    "Marketing",
    "Equipment Maintenance",
    "Miscellaneous",
  ];

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [year, month] = selectedMonth.split("-");
      const startDate = `${year}-${month}-01`;
      const lastDay = new Date(year, Number(month), 0).getDate();
      const endDate = `${year}-${month}-${lastDay}`;

      const res = await axios.get(
        `${BaseUrl}expenses/branch/0?from=${startDate}&to=${endDate}`,
        { headers }
      );
      if (res.data?.success && Array.isArray(res.data.expenses)) {
        setExpenses(res.data.expenses);
      } else {
        setExpenses([]);
      }
    } catch (err) {
      console.error("Error fetching expenses:", err);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [selectedMonth]);

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    if (!formData.description || !formData.amount) {
      return alert("Please enter description and amount.");
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const payload = {
        branchId: user.branchId || 0,
        category: formData.category,
        description: formData.description,
        amount: Number(formData.amount),
        date: formData.date,
        paymentMode: formData.paymentMode,
      };

      const res = await axios.post(
        `${BaseUrl}expenses/create`,
        payload,
        { headers }
      );
      if (res.data?.success) {
        alert("Operating expense logged successfully!");
        setShowModal(false);
        setFormData({
          category: "Rent",
          description: "",
          amount: "",
          date: new Date().toISOString().slice(0, 10),
          paymentMode: "Bank Transfer",
        });
        await fetchExpenses();
      } else {
        alert("Failed to add expense: " + (res.data?.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Error adding expense:", err);
      alert(
        "Failed to save expense: " +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setSaving(false);
    }
  };

  // Calculate totals
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const autoSalaryTotal = expenses
    .filter((e) => e.source === "AUTO_SALARY" || e.category === "Staff Salary")
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const manualOperatingTotal = totalExpenses - autoSalaryTotal;

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case "Rent":
        return "bg-primary text-white";
      case "Electricity / Utility":
        return "bg-warning text-dark";
      case "Marketing":
        return "bg-info text-dark";
      case "Staff Salary":
        return "bg-dark text-white";
      case "Equipment Maintenance":
        return "bg-secondary text-white";
      default:
        return "bg-light text-dark border";
    }
  };

  return (
    <div className="container-fluid p-3 p-md-4" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold mb-1 text-dark d-flex align-items-center">
            <FontAwesomeIcon icon={faCoins} className="text-primary me-2" />
            Monthly Expenses &amp; Profit Tracker
          </h2>
          <p className="text-muted mb-0">
            Automatically tracks staff salaries and allows manual logging of rent, utilities, and operating costs.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <input
            type="month"
            className="form-control fw-semibold shadow-sm"
            style={{ width: "180px" }}
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
          <button
            className="btn btn-outline-secondary shadow-sm"
            onClick={fetchExpenses}
            title="Refresh"
          >
            <FontAwesomeIcon icon={faSync} />
          </button>
          <button
            className="btn btn-primary shadow-sm fw-semibold"
            onClick={() => setShowModal(true)}
          >
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            Add Operating Expense
          </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-3 h-100" style={{ borderLeft: "4px solid #ef4444" }}>
            <span className="text-muted small fw-semibold text-uppercase">TOTAL MONTHLY EXPENSES</span>
            <h2 className="fw-bold text-danger mt-1 mb-1">
              ₹{totalExpenses.toLocaleString()}
            </h2>
            <small className="text-muted">Combined Staff Salaries &amp; Operating Costs</small>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-3 h-100" style={{ borderLeft: "4px solid #3b82f6" }}>
            <span className="text-muted small fw-semibold text-uppercase">AUTO-SYNCED STAFF SALARY</span>
            <h2 className="fw-bold text-primary mt-1 mb-1">
              ₹{autoSalaryTotal.toLocaleString()}
            </h2>
            <small className="text-muted">Processed automatically via Staff Payroll</small>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-3 h-100" style={{ borderLeft: "4px solid #10b981" }}>
            <span className="text-muted small fw-semibold text-uppercase">MANUAL OPERATING EXPENSE</span>
            <h2 className="fw-bold text-success mt-1 mb-1">
              ₹{manualOperatingTotal.toLocaleString()}
            </h2>
            <small className="text-muted">Rent, Electricity, Marketing &amp; Misc</small>
          </div>
        </div>
      </div>

      {/* Expenses List Card */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center">
          <h5 className="mb-0 fw-bold text-dark">
            Expense Breakdown ({expenses.length} Entries)
          </h5>
          <span className="badge bg-light text-dark border px-3 py-2">
            Month: {selectedMonth}
          </span>
        </div>

        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="px-4 py-3">Expense Category</th>
                  <th className="py-3">Description / Title</th>
                  <th className="py-3">Source Type</th>
                  <th className="py-3">Payment Mode</th>
                  <th className="py-3">Date</th>
                  <th className="py-3 text-end px-4">Amount</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5">
                      Loading monthly expenses...
                    </td>
                  </tr>
                ) : expenses.length > 0 ? (
                  expenses.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td className="px-4 py-3">
                        <span
                          className={`badge rounded-pill px-3 py-2 ${getCategoryBadge(
                            item.category
                          )}`}
                        >
                          {item.category || "Miscellaneous"}
                        </span>
                      </td>
                      <td className="py-3 fw-semibold text-dark">
                        {item.description}
                      </td>
                      <td className="py-3">
                        {item.source === "AUTO_SALARY" ? (
                          <span className="badge bg-dark bg-opacity-10 text-dark border">
                            Automated Salary Sync
                          </span>
                        ) : (
                          <span className="badge bg-success bg-opacity-10 text-success border">
                            Manual Entry
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-muted">
                        {item.paymentMode || "Bank Transfer"}
                      </td>
                      <td className="py-3 text-muted">
                        {item.date ? String(item.date).slice(0, 10) : "N/A"}
                      </td>
                      <td className="py-3 text-end px-4 fw-bold text-danger">
                        ₹{Number(item.amount || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-5 text-muted">
                      No expenses recorded for {selectedMonth}. Click "+ Add Operating Expense" above to log rent, electricity, or marketing costs.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showModal && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-primary text-white border-0">
                <h5 className="modal-title">
                  <FontAwesomeIcon icon={faPlus} className="me-2" />
                  Log New Operating Expense
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <form onSubmit={handleCreateExpense}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-uppercase">
                      Expense Category
                    </label>
                    <select
                      className="form-select"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-uppercase">
                      Description / Title
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. July Gym Rent / Electricity Bill"
                      required
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                    />
                  </div>

                  <div className="row">
                    <div className="col-6 mb-3">
                      <label className="form-label fw-semibold small text-uppercase">
                        Amount (₹)
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="0.00"
                        required
                        min="1"
                        value={formData.amount}
                        onChange={(e) =>
                          setFormData({ ...formData, amount: e.target.value })
                        }
                      />
                    </div>

                    <div className="col-6 mb-3">
                      <label className="form-label fw-semibold small text-uppercase">
                        Payment Date
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        required
                        value={formData.date}
                        onChange={(e) =>
                          setFormData({ ...formData, date: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-uppercase">
                      Payment Mode
                    </label>
                    <select
                      className="form-select"
                      value={formData.paymentMode}
                      onChange={(e) =>
                        setFormData({ ...formData, paymentMode: e.target.value })
                      }
                    >
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="UPI / Online">UPI / Online</option>
                      <option value="Cash">Cash</option>
                      <option value="Card">Card / Cheque</option>
                    </select>
                  </div>
                </div>

                <div className="modal-footer border-0 bg-light">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary fw-semibold"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Expense"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminExpenses;
