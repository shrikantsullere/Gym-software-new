import React, { useEffect, useRef, useState } from "react";
import {
  RiUserLine,
  RiCalendarCheckLine,
  RiTeamLine,
  RiUserAddLine,
  RiCalendarLine,
  RiStoreLine,
} from "react-icons/ri";
import "bootstrap/dist/css/bootstrap.min.css";
import * as echarts from "echarts";
import axiosInstance from "../../Api/axiosInstance";
import GetAdminId from "../../Api/GetAdminId";
import AnnouncementBanner from "../../Components/AnnouncementBanner";

// Note: RiMoneyDollarCircleLine is not in your imports — using RiStoreLine as fallback or remove if unused.
// Since you're not using payment icon in visible cards, and to avoid error, we'll avoid referencing it.
// If needed, import it from react-icons/ri.

const AdminDashboard = () => {
  const adminId = GetAdminId();
  const memberGrowthChartRef = useRef(null);
  const revenueChartRef = useRef(null);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartInitialized, setChartInitialized] = useState(false);

  const user = JSON.parse(localStorage.getItem("user")) || {};
  const branchDisplayName = user.branchName || "Main Branch";

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!adminId) {
        setError("Admin ID not found. Please log in again.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axiosInstance.get(
          `auth/admindashboard/${adminId}?branchId=${user.branchId || ""}`
        );

        if (response.data.success && response.data.data) {
          setDashboardData(response.data.data);
          setError(null);
        } else {
          setError("Failed to load dashboard data");
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [adminId]);

  // Initialize charts
  useEffect(() => {
    if (!dashboardData) return;

    let memberChart, revenueChart;

    if (memberGrowthChartRef.current) {
      memberChart = echarts.init(memberGrowthChartRef.current);
    }
    if (revenueChartRef.current) {
      revenueChart = echarts.init(revenueChartRef.current);
    }
    
    setChartInitialized(true);

    const handleResize = () => {
      if (memberChart) memberChart.resize();
      if (revenueChart) revenueChart.resize();
    };
    
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (memberChart) memberChart.dispose();
      if (revenueChart) revenueChart.dispose();
      setChartInitialized(false);
    };
  }, [dashboardData]);

  // Update chart when data changes
  useEffect(() => {
    if (!chartInitialized || !dashboardData) return;

    if (memberGrowthChartRef.current) {
      const memberChart = echarts.getInstanceByDom(memberGrowthChartRef.current);
      if (memberChart) {
        const memberGrowthData = generateMemberGrowthData(dashboardData);
        const memberGrowthOption = {
          animation: false,
          grid: { top: 20, right: 20, bottom: 40, left: 40 },
          xAxis: {
            type: "category",
            data: memberGrowthData.months,
            axisLine: { show: true, lineStyle: { color: "#E5E7EB" } },
            axisTick: { show: true, lineStyle: { color: "#E5E7EB" } },
            axisLabel: { color: "#6B7280", fontSize: 12 },
          },
          yAxis: {
            type: "value",
            axisLine: { show: true, lineStyle: { color: "#E5E7EB" } },
            axisTick: { show: true, lineStyle: { color: "#E5E7EB" } },
            axisLabel: { color: "#6B7280", fontSize: 12 },
            splitLine: { lineStyle: { color: "#F3F4F6" } },
          },
          series: [
            {
              data: memberGrowthData.values,
              type: "line",
              smooth: true,
              lineStyle: { color: "#2f6a87", width: 3 },
              itemStyle: { color: "#2f6a87" },
              areaStyle: {
                color: {
                  type: "linear",
                  x: 0, y: 0, x2: 0, y2: 1,
                  colorStops: [
                    { offset: 0, color: "rgba(47, 106, 135, 0.3)" },
                    { offset: 1, color: "rgba(47, 106, 135, 0.05)" },
                  ],
                },
              },
              showSymbol: true,
              symbolSize: 6,
            },
          ],
          tooltip: {
            trigger: "axis",
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderColor: "#E5E7EB",
            textStyle: { color: "#1F2937" },
            formatter: (params) => {
              return `${params[0].name}<br/>Members: ${params[0].value}`;
            },
          },
        };
        memberChart.setOption(memberGrowthOption);
      }
    }

    if (revenueChartRef.current) {
      const revenueChart = echarts.getInstanceByDom(revenueChartRef.current);
      if (revenueChart) {
        const revenueData = generateRevenueData(dashboardData);
        const revenueOption = {
          animation: false,
          grid: { top: 20, right: 20, bottom: 40, left: 50 },
          xAxis: {
            type: "category",
            data: revenueData.months,
            axisLine: { show: true, lineStyle: { color: "#E5E7EB" } },
            axisTick: { show: true, lineStyle: { color: "#E5E7EB" } },
            axisLabel: { color: "#6B7280", fontSize: 12 },
          },
          yAxis: {
            type: "value",
            axisLine: { show: true, lineStyle: { color: "#E5E7EB" } },
            axisTick: { show: true, lineStyle: { color: "#E5E7EB" } },
            axisLabel: { 
              color: "#6B7280", 
              fontSize: 12,
              formatter: (value) => {
                if (value >= 1000) {
                  return '₹' + (value / 1000) + 'k';
                }
                return '₹' + value;
              }
            },
            splitLine: { lineStyle: { color: "#F3F4F6" } },
          },
          series: [
            {
              data: revenueData.values,
              type: "bar",
              barWidth: "40%",
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: "#10b981" },
                  { offset: 1, color: "#34d399" }
                ]),
                borderRadius: [4, 4, 0, 0]
              },
            },
          ],
          tooltip: {
            trigger: "axis",
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderColor: "#E5E7EB",
            textStyle: { color: "#1F2937" },
            formatter: (params) => {
              return `${params[0].name}<br/>Revenue: ₹${params[0].value}`;
            },
          },
        };
        revenueChart.setOption(revenueOption);
      }
    }
  }, [chartInitialized, dashboardData]);

  const generateMemberGrowthData = (data) => {
    if (!data || !data.memberGrowth || data.memberGrowth.length === 0) {
      return {
        months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        values: [0, 0, 0, 0, 0, 0],
      };
    }

    const months = data.memberGrowth.map((item) => item.month);
    const values = data.memberGrowth.map((item) => item.count);

    while (months.length < 6) {
      months.push(`Month ${months.length + 1}`);
      values.push(0);
    }

    return { months, values };
  };

  const generateRevenueData = (data) => {
    if (!data || !data.revenueGrowth || data.revenueGrowth.length === 0) {
      return {
        months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        values: [0, 0, 0, 0, 0, 0],
      };
    }

    const months = data.revenueGrowth.map((item) => item.month);
    const values = data.revenueGrowth.map((item) => item.totalRevenue || 0);

    while (months.length < 6) {
      months.push(`Month ${months.length + 1}`);
      values.push(0);
    }

    return { months, values };
  };

  const formatTime = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";

    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  // Removed reference to RiMoneyDollarCircleLine since it's not imported
  const getActivityIcon = (type) => {
    switch (type) {
      case "member":
        return <RiUserAddLine className="text-success" />;
      case "payment":
        return <RiStoreLine className="text-primary" />; // fallback icon
      case "booking":
      case "class_booking":
        return <RiCalendarLine className="text-warning" />;
      case "staff":
        return <RiUserLine className="text-info" />;
      default:
        return <RiCalendarCheckLine className="text-secondary" />;
    }
  };

  const getActivityIconBg = (type) => {
    switch (type) {
      case "member":
        return "bg-success bg-opacity-10";
      case "payment":
        return "bg-primary bg-opacity-10";
      case "booking":
      case "class_booking":
        return "bg-warning bg-opacity-10";
      case "staff":
        return "bg-info bg-opacity-10";
      default:
        return "bg-secondary bg-opacity-10";
    }
  };

  // ✅ FIXED: Safely handle null/undefined activity text
  const parseActivityText = (activityText) => {
    if (!activityText || typeof activityText !== "string") {
      return {
        title: "Unknown Activity",
        description: "",
      };
    }

    const parts = activityText.split(": ", 2); // Limit to 2 parts for safety
    if (parts.length > 1) {
      return {
        title: parts[0],
        description: parts[1],
      };
    }
    return {
      title: activityText,
      description: "",
    };
  };

  const handleViewAllActivities = () => {
    setShowAllActivities(!showAllActivities);
  };

  if (loading) {
    return (
      <div className="w-100 min-vh-100 p-0 d-flex justify-content-center align-items-center">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-100 min-vh-100 p-0 d-flex justify-content-center align-items-center">
        <div className="text-center">
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
          <button
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-100 min-vh-100 p-0">
      <div className="p-4">
        <div className="mb-4 d-flex justify-content-between align-items-center flex-wrap">
          <div>
            <h1 className="fw-bold">Dashboard Overview</h1>
            <p className="text-muted">
              Welcome back! Here's what's happening at your gym today.
            </p>
          </div>
          <div className="mt-2 mt-md-0">
            <h4>
              Branch Name:{" "}
              <span className="badge bg-primary">{branchDisplayName}</span>
            </h4>
          </div>
        </div>

        {/* Announcement Banner */}
        <AnnouncementBanner />

        {/* Stats Cards */}
        <div className="row g-3 mb-4">
          {/* Total Members */}
          <div className="col-6 col-md-4 col-lg">
            <div className="card shadow-sm h-100" data-testid="total-members-card">
              <div className="card-body d-flex justify-content-between align-items-start">
                <div>
                  <div className="d-flex align-items-center mb-3">
                    <div className="bg-primary bg-opacity-10 p-2 rounded me-2">
                      <RiUserLine className="text-primary fs-4" />
                    </div>
                  </div>
                  <h3 className="h2 fw-bold mb-1" data-testid="total-members-value">
                    {dashboardData?.totalMembers || 0}
                  </h3>
                  <p className="text-muted small mb-0">Total Members</p>
                </div>
              </div>
            </div>
          </div>

          {/* Total Staff */}
          <div className="col-6 col-md-4 col-lg">
            <div className="card shadow-sm h-100" data-testid="total-staff-card">
              <div className="card-body d-flex justify-content-between align-items-start">
                <div>
                  <div className="d-flex align-items-center mb-3">
                    <div className="bg-info bg-opacity-10 p-2 rounded me-2">
                      <RiTeamLine className="text-info fs-4" />
                    </div>
                  </div>
                  <h3 className="h2 fw-bold mb-1" data-testid="total-staff-value">
                    {dashboardData?.totalStaff || 0}
                  </h3>
                  <p className="text-muted small mb-0">Total Staff</p>
                </div>
              </div>
            </div>
          </div>

          {/* Today's Member Check-ins */}
          <div className="col-6 col-md-4 col-lg">
            <div className="card shadow-sm h-100" data-testid="today-member-checkins-card">
              <div className="card-body d-flex justify-content-between align-items-start">
                <div>
                  <div className="d-flex align-items-center mb-3">
                    <div className="bg-success bg-opacity-10 p-2 rounded me-2">
                      <RiCalendarCheckLine className="text-success fs-4" />
                    </div>
                  </div>
                  <h3 className="h2 fw-bold mb-1" data-testid="today-member-checkins-value">
                    {dashboardData?.todaysMemberCheckins || 0}
                  </h3>
                  <p className="text-muted small mb-0">Today's Member Check-ins</p>
                </div>
              </div>
            </div>
          </div>

          {/* Today's Staff Check-ins */}
          <div className="col-6 col-md-4 col-lg">
            <div className="card shadow-sm h-100" data-testid="today-staff-checkins-card">
              <div className="card-body d-flex justify-content-between align-items-start">
                <div>
                  <div className="d-flex align-items-center mb-3">
                    <div className="bg-warning bg-opacity-10 p-2 rounded me-2">
                      <RiUserLine className="text-warning fs-4" />
                    </div>
                  </div>
                  <h3 className="h2 fw-bold mb-1" data-testid="today-staff-checkins-value">
                    {dashboardData?.todaysStaffCheckins || 0}
                  </h3>
                  <p className="text-muted small mb-0">Today's Staff Check-ins</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Financial & Profitability Overview (Month-by-Month) */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-md-4">
            <div className="card shadow-sm border-0 h-100" style={{ borderLeft: "4px solid #10b981" }}>
              <div className="card-body">
                <span className="text-muted small fw-semibold text-uppercase">Total Monthly Revenue</span>
                <h3 className="fw-bold text-success mt-1 mb-0">
                  ₹{(dashboardData?.monthlyRevenue || dashboardData?.totalRevenue || 0).toLocaleString()}
                </h3>
                <small className="text-muted">Membership fees &amp; plan purchases</small>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="card shadow-sm border-0 h-100" style={{ borderLeft: "4px solid #ef4444" }}>
              <div className="card-body">
                <span className="text-muted small fw-semibold text-uppercase">Total Monthly Expenses</span>
                <h3 className="fw-bold text-danger mt-1 mb-0">
                  ₹{(dashboardData?.monthlyExpenses || dashboardData?.totalExpenses || 0).toLocaleString()}
                </h3>
                <small className="text-muted">Auto Salaries + Rent, Utilities &amp; Misc</small>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="card shadow-sm border-0 h-100" style={{ borderLeft: "4px solid #6366f1" }}>
              <div className="card-body">
                <span className="text-muted small fw-semibold text-uppercase">Net Profit (Rev - Exp)</span>
                <h3
                  className={`fw-bold mt-1 mb-0 ${
                    (dashboardData?.monthlyProfit || 0) >= 0 ? "text-primary" : "text-danger"
                  }`}
                >
                  ₹{(
                    dashboardData?.monthlyProfit ??
                    (dashboardData?.monthlyRevenue || 0) - (dashboardData?.monthlyExpenses || 0)
                  ).toLocaleString()}
                </h3>
                <small className="text-muted">Month-by-Month Net Profitability</small>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="row g-3 mb-4">
          {/* Member Growth Chart */}
          <div className="col-12 col-lg-6">
            <div className="card shadow-sm h-100" data-testid="member-growth-chart">
              <div className="card-header bg-white border-0 pt-4 pb-0">
                <h3 className="h5 fw-semibold">Member Growth</h3>
              </div>
              <div className="card-body">
                <div ref={memberGrowthChartRef} style={{ height: "300px", width: "100%" }}></div>
              </div>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="col-12 col-lg-6">
            <div className="card shadow-sm h-100" data-testid="revenue-growth-chart">
              <div className="card-header bg-white border-0 pt-4 pb-0">
                <h3 className="h5 fw-semibold">Revenue (Last 6 Months)</h3>
              </div>
              <div className="card-body">
                <div ref={revenueChartRef} style={{ height: "300px", width: "100%" }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Lower Section: Recent Activities & Recent Payments */}
        <div className="row g-3">
          {/* Recent Activities */}
          <div className="col-12 col-lg-6">
            <div className="card shadow-sm h-100" data-testid="recent-activities-section">
              <div className="card-header bg-white border-0 pt-4 pb-0">
                <h3 className="h5 fw-semibold">Recent Activities</h3>
              </div>
              <div className="card-body">
                <div className="d-flex flex-column gap-3">
                  {dashboardData?.recentActivities &&
                    dashboardData.recentActivities.map((activity, index) => {
                      const { title, description } = parseActivityText(activity.activity);
                      return (
                        <div
                          key={index}
                          className="d-flex align-items-start p-3 border rounded"
                        >
                          <div
                            className={`${getActivityIconBg(activity.type)} p-2 rounded-circle me-3`}
                          >
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-grow-1">
                            <p className="fw-medium mb-0">{title}</p>
                            {description && (
                              <p className="text-muted small mb-0">{description}</p>
                            )}
                          </div>
                          <span className="text-muted small">
                            {formatTime(activity.time)}
                          </span>
                        </div>
                      );
                    })}
                  {(!dashboardData?.recentActivities || dashboardData.recentActivities.length === 0) && (
                    <p className="text-muted text-center py-3">No recent activities.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Payments Table */}
          <div className="col-12 col-lg-6">
            <div className="card shadow-sm h-100" data-testid="recent-payments-section">
              <div className="card-header bg-white border-0 pt-4 pb-0">
                <h3 className="h5 fw-semibold">Recent Payments</h3>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Invoice</th>
                        <th>Member</th>
                        <th>Amount</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData?.recentPayments && dashboardData.recentPayments.length > 0 ? (
                        dashboardData.recentPayments.map((payment) => (
                          <tr key={payment.id}>
                            <td>
                              <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25">
                                {payment.invoiceNo}
                              </span>
                            </td>
                            <td>
                              <span className="fw-medium">{payment.memberName}</span>
                            </td>
                            <td>
                              <span className="text-success fw-bold">₹{payment.amount}</span>
                            </td>
                            <td>
                              <span className="text-muted small">
                                {new Date(payment.date).toLocaleDateString('en-GB')}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center text-muted py-4">
                            No recent payments found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;