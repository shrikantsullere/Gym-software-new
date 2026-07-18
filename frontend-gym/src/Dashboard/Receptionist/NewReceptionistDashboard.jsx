import React, { useState, useEffect } from "react";
import {
  FaUserCheck,
  FaUserPlus,
  FaRupeeSign,
  FaClock,
  FaExclamationTriangle,
  FaCalendarAlt,
} from "react-icons/fa";
import axiosInstance from "../../Api/axiosInstance";
import AnnouncementBanner from "../../Components/AnnouncementBanner";

const NewReceptionistDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();
  const adminId = user?.adminId;
  const branchId = user?.branchId || 1;
  const name = user?.fullName || "Receptionist";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(
          `receptionist-dashboard?adminId=${adminId}&branchId=${branchId}`
        );
        if (res.data?.success) {
          setData(res.data.receptionistDashboard);
        }
      } catch (err) {
        console.error("Error fetching receptionist dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    if (adminId) fetchData();
    else setLoading(false);
  }, [adminId, branchId]);

  const s = data?.summary;

  const statCards = [
    {
      label: "Today's Check-ins",
      value: s?.todayCheckins ?? 0,
      icon: <FaUserCheck size={22} />,
      color: "#2f6a87",
      bg: "#e8f4f8",
    },
    {
      label: "New Registrations",
      value: s?.newRegistrations ?? 0,
      icon: <FaUserPlus size={22} />,
      color: "#16a34a",
      bg: "#dcfce7",
    },
    {
      label: "Today's Revenue",
      value: `₹${Number(s?.todayRevenue ?? 0).toLocaleString("en-IN")}`,
      icon: <FaRupeeSign size={22} />,
      color: "#9333ea",
      bg: "#f3e8ff",
    },
    {
      label: "Pending Payments",
      value: s?.pendingPaymentsCount ?? 0,
      icon: <FaClock size={22} />,
      color: "#d97706",
      bg: "#fef3c7",
    },
    {
      label: "Expiring Plans (7 days)",
      value: s?.expiringPlansCount ?? 0,
      icon: <FaCalendarAlt size={22} />,
      color: "#dc2626",
      bg: "#fee2e2",
    },
  ];

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "60vh" }}
      >
        <div className="spinner-border" style={{ color: "#2f6a87" }} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4 px-3 px-md-4" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      {/* Header */}
      <div className="mb-4">
        <h2 className="fw-bold mb-1" style={{ color: "#1e293b" }}>
          Welcome, {name}! 👋
        </h2>
        <p className="text-muted mb-0">
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long", year: "numeric", month: "long", day: "numeric",
          })}
        </p>
      </div>

      {/* Announcement Banner */}
      <AnnouncementBanner />

      {/* Stat Cards */}
      <div className="row g-3 mb-4">
        {statCards.map((card, i) => (
          <div className="col-6 col-md-4 col-lg-2" key={i} style={{ minWidth: "180px" }}>
            <div
              className="card border-0 h-100 shadow-sm"
              style={{ borderRadius: "12px", transition: "transform .2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-4px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              <div className="card-body p-3">
                <div
                  className="d-flex align-items-center justify-content-center mb-2"
                  style={{
                    width: 44, height: 44, borderRadius: "10px",
                    backgroundColor: card.bg, color: card.color,
                  }}
                >
                  {card.icon}
                </div>
                <div className="fw-bold fs-4" style={{ color: card.color }}>
                  {card.value}
                </div>
                <div className="text-muted small">{card.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-3">
        {/* Recent Check-ins */}
        <div className="col-12 col-lg-7">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "14px" }}>
            <div className="card-header bg-white border-0 py-3 px-4">
              <h5 className="fw-bold mb-0" style={{ color: "#1e293b" }}>
                🏃 Today's Check-ins
              </h5>
            </div>
            <div className="card-body p-0">
              {data?.recentCheckins?.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead style={{ backgroundColor: "#f1f5f9" }}>
                      <tr>
                        <th className="ps-4 py-2 fw-semibold text-muted small border-0">Member</th>
                        <th className="py-2 fw-semibold text-muted small border-0">Phone</th>
                        <th className="py-2 fw-semibold text-muted small border-0">Check-in</th>
                        <th className="py-2 fw-semibold text-muted small border-0">Check-out</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentCheckins.map((row, i) => (
                        <tr key={i}>
                          <td className="ps-4 py-2 fw-medium">{row.name}</td>
                          <td className="py-2 text-muted small">{row.phone || "—"}</td>
                          <td className="py-2 small">
                            {new Date(row.checkIn).toLocaleTimeString("en-IN", {
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </td>
                          <td className="py-2 small">
                            {row.checkOut ? (
                              new Date(row.checkOut).toLocaleTimeString("en-IN", {
                                hour: "2-digit", minute: "2-digit",
                              })
                            ) : (
                              <span className="badge text-bg-success">Still in</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 text-center text-muted">No check-ins yet today.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="col-12 col-lg-5">
          {/* Renewals Due */}
          <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: "14px" }}>
            <div className="card-header bg-white border-0 py-3 px-4">
              <h5 className="fw-bold mb-0" style={{ color: "#1e293b" }}>
                ⏰ Plans Expiring Soon
              </h5>
            </div>
            <div className="card-body p-0">
              {data?.renewalsList?.length > 0 ? (
                <ul className="list-group list-group-flush">
                  {data.renewalsList.map((m, i) => (
                    <li key={i} className="list-group-item d-flex justify-content-between align-items-center px-4 py-2">
                      <div>
                        <div className="fw-medium">{m.name}</div>
                        <div className="text-muted small">{m.phone || "—"}</div>
                      </div>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: m.daysLeft <= 2 ? "#fee2e2" : "#fef3c7",
                          color: m.daysLeft <= 2 ? "#dc2626" : "#d97706",
                          fontSize: "12px",
                          padding: "5px 10px",
                          borderRadius: "8px",
                        }}
                      >
                        {m.daysLeft === 0 ? "Expires Today" : `${m.daysLeft}d left`}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-3 text-center text-muted small">
                  No renewals due in next 7 days.
                </div>
              )}
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="card border-0 shadow-sm" style={{ borderRadius: "14px" }}>
            <div className="card-header bg-white border-0 py-3 px-4">
              <h5 className="fw-bold mb-0" style={{ color: "#1e293b" }}>
                <FaExclamationTriangle className="text-warning me-2" />
                Inventory Alerts
              </h5>
            </div>
            <div className="card-body p-0">
              {data?.lowStockItems?.length > 0 ? (
                <ul className="list-group list-group-flush">
                  {data.lowStockItems.map((item, i) => (
                    <li key={i} className="list-group-item d-flex justify-content-between align-items-center px-4 py-2">
                      <div>
                        <div className="fw-medium">{item.name}</div>
                        <div className="text-muted small">{item.category || "General"}</div>
                      </div>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: item.currentStock === 0 ? "#fee2e2" : "#fef3c7",
                          color: item.currentStock === 0 ? "#dc2626" : "#d97706",
                          fontSize: "12px",
                          padding: "5px 10px",
                          borderRadius: "8px",
                        }}
                      >
                        {item.currentStock === 0 ? "Out of Stock" : `${item.currentStock} left`}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-3 text-center text-muted small">
                  ✅ All stock levels are healthy.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewReceptionistDashboard;
