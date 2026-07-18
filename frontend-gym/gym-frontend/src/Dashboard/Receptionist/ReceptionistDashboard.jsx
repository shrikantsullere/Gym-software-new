import React, { useState, useEffect } from "react";
import {
  RiMoneyDollarCircleLine,
  RiUserAddLine,
  RiMegaphoneLine,
  RiCalendarCheckLine,
} from "react-icons/ri";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Pie } from "react-chartjs-2";
import "bootstrap/dist/css/bootstrap.min.css";
import axiosInstance from "../../Api/axiosInstance";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const SalesDashboard = () => {
  const [currentDate, setCurrentDate] = useState("");
  const [padLeft, setPadLeft] = useState(0); // px
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const branchId = userData.branchId || 1;
  const adminId = userData.adminId || 90;

  const [dashboardData, setDashboardData] = useState({
    summary: {
      totalRevenue: 0,
      newRegistrations: 0,
      activeLeads: 0,
      pendingRenewals: 0,
    },
    recentTransactions: [],
    todayFollowUps: [],
    revenueVsExpenseData: {
      labels: [],
      datasets: [
        {
          label: "Income (₹)",
          data: [],
          backgroundColor: "rgba(16, 185, 129, 0.8)", // green
        },
        {
          label: "Expenses (₹)",
          data: [],
          backgroundColor: "rgba(239, 68, 68, 0.8)", // red
        },
      ],
    },
    leadConversionData: {
      labels: ["New", "Contacted", "Converted", "Lost"],
      datasets: [
        {
          data: [0, 0, 0, 0],
          backgroundColor: [
            "rgba(59, 130, 246, 0.8)", // blue
            "rgba(245, 158, 11, 0.8)", // orange
            "rgba(16, 185, 129, 0.8)", // green
            "rgba(239, 68, 68, 0.8)", // red
          ],
        },
      ],
    },
  });

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      };
      setCurrentDate(now.toLocaleDateString("en-US", options));
    };
    updateDateTime();
    const t = setInterval(updateDateTime, 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handle = () => setPadLeft(window.innerWidth >= 768 ? 25 : 0);
    handle();
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axiosInstance.get(
          `dashboard/sales-dashboard?adminId=${adminId}&branchId=${branchId}`
        );

        if (response.data && response.data.success) {
          const data = response.data.dashboard;

          // 1. Process Revenue vs Expenses
          const incomeRows = data.profitAndLoss?.income || [];
          const expenseRows = data.profitAndLoss?.expenses || [];
          
          // Merge months uniquely
          const monthsSet = new Set([
            ...incomeRows.map((i) => `${i.month} ${i.year}`),
            ...expenseRows.map((e) => `${e.month} ${e.year}`)
          ]);
          const sortedMonths = Array.from(monthsSet); // Optionally sort by date logic here
          
          const incomeDataPoints = sortedMonths.map(m => {
            const found = incomeRows.find(i => `${i.month} ${i.year}` === m);
            return found ? found.total : 0;
          });
          const expenseDataPoints = sortedMonths.map(m => {
            const found = expenseRows.find(e => `${e.month} ${e.year}` === m);
            return found ? found.total : 0;
          });

          // 2. Process Lead Conversion
          const conversionRows = data.leadConversion || [];
          const labels = [];
          const counts = [];
          conversionRows.forEach(row => {
             labels.push(row.status || 'Unknown');
             counts.push(row.count || 0);
          });

          setDashboardData({
            summary: {
              totalRevenue: data.summary.totalRevenue || 0,
              newRegistrations: data.summary.newRegistrations || 0,
              activeLeads: data.summary.activeLeads || 0,
              pendingRenewals: data.summary.pendingRenewals || 0,
            },
            recentTransactions: data.recentTransactions || [],
            todayFollowUps: data.todayFollowUps || [],
            revenueVsExpenseData: {
              labels: sortedMonths.length ? sortedMonths : ["No Data"],
              datasets: [
                {
                  label: "Income (₹)",
                  data: incomeDataPoints.length ? incomeDataPoints : [0],
                  backgroundColor: "rgba(16, 185, 129, 0.8)",
                },
                {
                  label: "Expenses (₹)",
                  data: expenseDataPoints.length ? expenseDataPoints : [0],
                  backgroundColor: "rgba(239, 68, 68, 0.8)",
                },
              ],
            },
            leadConversionData: {
              labels: labels.length ? labels : ["No Data"],
              datasets: [
                {
                  data: counts.length ? counts : [1],
                  backgroundColor: [
                    "rgba(59, 130, 246, 0.8)",
                    "rgba(245, 158, 11, 0.8)",
                    "rgba(16, 185, 129, 0.8)",
                    "rgba(239, 68, 68, 0.8)",
                    "rgba(139, 92, 246, 0.8)",
                  ],
                },
              ],
            },
          });
        } else {
          throw new Error("Invalid response format");
        }
      } catch (err) {
        const errorMessage = err.response
          ? `Server responded with ${err.response.status}: ${
              err.response.data.message || err.response.statusText
            }`
          : err.message;
        setError(errorMessage);
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [adminId, branchId]);

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      tooltip: {
        backgroundColor: "rgba(255,255,255,0.9)",
        titleColor: "#1f2937",
        bodyColor: "#1f2937",
        borderColor: "#e5e7eb",
        borderWidth: 1,
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: "#f3f4f6" } },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "right" },
    },
  };

  return (
    <div className="d-flex flex-column min-vh-100 bg-light overflow-hidden">
      <main style={{ paddingLeft: padLeft }}>
        <div className="container-fluid px-2 px-md-2 py-3 py-md-4">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-3 mb-md-4">
                <h2 className="fw-bold mb-1">Sales Department Dashboard</h2>
                <p className="text-muted mb-0">
                  Track your revenue, leads, and conversions seamlessly.
                </p>
              </div>

              {/* Stats Cards */}
              <div className="row g-3 mb-3 mb-md-4">
                <div className="col-12 col-md-6 col-lg-3 d-flex">
                  <div className="card border-0 shadow-sm h-100 w-100">
                    <div className="card-body d-flex justify-content-between align-items-center">
                      <div>
                        <p className="text-muted small mb-1">Revenue (This Month)</p>
                        <p className="fw-bold mb-1 text-success" style={{ fontSize: "1.75rem" }}>
                          ₹{dashboardData.summary.totalRevenue.toLocaleString()}
                        </p>
                      </div>
                      <div className="d-flex align-items-center justify-content-center rounded-2" style={{ backgroundColor: "rgba(16, 185, 129, 0.2)", width: "3rem", height: "3rem" }}>
                        <RiMoneyDollarCircleLine className="text-success" style={{ fontSize: "1.5rem" }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-md-6 col-lg-3 d-flex">
                  <div className="card border-0 shadow-sm h-100 w-100">
                    <div className="card-body d-flex justify-content-between align-items-center">
                      <div>
                        <p className="text-muted small mb-1">New Registrations</p>
                        <p className="fw-bold mb-1 text-primary" style={{ fontSize: "1.75rem" }}>
                          {dashboardData.summary.newRegistrations}
                        </p>
                        <p className="text-muted small mb-0">This Week</p>
                      </div>
                      <div className="d-flex align-items-center justify-content-center rounded-2" style={{ backgroundColor: "rgba(59, 130, 246, 0.2)", width: "3rem", height: "3rem" }}>
                        <RiUserAddLine className="text-primary" style={{ fontSize: "1.5rem" }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-md-6 col-lg-3 d-flex">
                  <div className="card border-0 shadow-sm h-100 w-100">
                    <div className="card-body d-flex justify-content-between align-items-center">
                      <div>
                        <p className="text-muted small mb-1">Active Leads</p>
                        <p className="fw-bold mb-1 text-warning" style={{ fontSize: "1.75rem" }}>
                          {dashboardData.summary.activeLeads}
                        </p>
                        <p className="text-muted small mb-0">Pipeline Inquiries</p>
                      </div>
                      <div className="d-flex align-items-center justify-content-center rounded-2" style={{ backgroundColor: "rgba(245, 158, 11, 0.2)", width: "3rem", height: "3rem" }}>
                        <RiMegaphoneLine className="text-warning" style={{ fontSize: "1.5rem" }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-md-6 col-lg-3 d-flex">
                  <div className="card border-0 shadow-sm h-100 w-100">
                    <div className="card-body d-flex justify-content-between align-items-center">
                      <div>
                        <p className="text-muted small mb-1">Pending Renewals</p>
                        <p className="fw-bold mb-1 text-danger" style={{ fontSize: "1.75rem" }}>
                          {dashboardData.summary.pendingRenewals}
                        </p>
                        <p className="text-muted small mb-0">Next 7 Days</p>
                      </div>
                      <div className="d-flex align-items-center justify-content-center rounded-2" style={{ backgroundColor: "rgba(239, 68, 68, 0.2)", width: "3rem", height: "3rem" }}>
                        <RiCalendarCheckLine className="text-danger" style={{ fontSize: "1.5rem" }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="row g-3 mb-3 mb-md-4">
                <div className="col-12 col-lg-8 d-flex">
                  <div className="card border-0 shadow-sm w-100">
                    <div className="card-body">
                      <h5 className="fw-bold mb-3">Revenue vs Expenses (Last 6 Months)</h5>
                      <div className="w-100" style={{ position: "relative", height: "300px" }}>
                        <Bar data={dashboardData.revenueVsExpenseData} options={barOptions} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-lg-4 d-flex">
                  <div className="card border-0 shadow-sm w-100">
                    <div className="card-body">
                      <h5 className="fw-bold mb-3">Lead Conversion Status</h5>
                      <div className="w-100" style={{ position: "relative", height: "300px" }}>
                        <Pie data={dashboardData.leadConversionData} options={pieOptions} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Tables */}
              <div className="row g-3">
                {/* Recent Transactions */}
                <div className="col-12 col-lg-7">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-header bg-white border-0 pt-4 pb-0">
                      <h5 className="fw-bold">Recent Transactions</h5>
                    </div>
                    <div className="card-body">
                      <div className="table-responsive">
                        <table className="table table-hover align-middle">
                          <thead className="table-light">
                            <tr>
                              <th>Invoice</th>
                              <th>Member</th>
                              <th>Plan</th>
                              <th>Amount</th>
                              <th>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dashboardData.recentTransactions.length > 0 ? (
                              dashboardData.recentTransactions.map((tx) => (
                                <tr key={tx.id}>
                                  <td><span className="badge bg-light text-dark border">{tx.invoiceNo}</span></td>
                                  <td className="fw-medium">{tx.memberName}</td>
                                  <td className="text-muted">{tx.planName}</td>
                                  <td className="text-success fw-bold">₹{tx.amount}</td>
                                  <td className="text-muted small">{new Date(tx.paymentDate).toLocaleDateString()}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="5" className="text-center py-3 text-muted">No recent transactions.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Today's Follow Ups */}
                <div className="col-12 col-lg-5">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-header bg-white border-0 pt-4 pb-0">
                      <h5 className="fw-bold">Today's Follow-ups</h5>
                    </div>
                    <div className="card-body">
                      <div className="d-flex flex-column gap-3">
                        {dashboardData.todayFollowUps.length > 0 ? (
                          dashboardData.todayFollowUps.map((lead) => (
                            <div key={lead.id} className="d-flex align-items-start p-3 border rounded">
                              <div className="flex-grow-1">
                                <p className="fw-bold mb-1">{lead.fullName}</p>
                                <p className="text-muted small mb-0">{lead.phone}</p>
                              </div>
                              <span className="badge bg-warning text-dark">{lead.status}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4">
                            <RiCalendarCheckLine className="text-muted" style={{ fontSize: "2rem" }} />
                            <p className="text-muted mt-2">No follow-ups scheduled for today.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default SalesDashboard;