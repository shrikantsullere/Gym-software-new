import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  FaDownload,
  FaCalendarAlt,
  FaFilter,
  FaUserCog,
  FaFilePdf,
} from "react-icons/fa";
import axiosInstance from "../../../Api/axiosInstance";
import GetAdminId from "../../../Api/GetAdminId";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function SalesReport() {
  const adminId = GetAdminId();
  
  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };
  
  const [selectedRole, setSelectedRole] = useState("member");
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const reportRef = useRef(null);
  const [staffList, setStaffList] = useState([]);

  // All roles with new report types
  const roles = [
    { value: "member", label: "Total Sales" },
    { value: "receptionist", label: "Receptionist" },
    { value: "personal_trainer", label: "Personal Trainer" },
    { value: "general_trainer", label: "General Trainer" },
    { value: "housekeeping", label: "Housekeeping" },
  ];

  const [dateFrom, setDateFrom] = useState(getTodayDate());
  const [dateTo, setDateTo] = useState(getTodayDate());
  const [bookingStatus, setBookingStatus] = useState("All");
  const statuses = ["All", "Booked", "Confirmed", "Cancelled", "Completed"];


  // Fetch staff list
  useEffect(() => {
    if (!adminId) return;
    const fetchStaff = async () => {
      try {
        const res = await axiosInstance.get(`/staff/admin/${adminId}`);
        if (res.data?.success) {
          setStaffList(res.data.staff);
        }
      } catch (error) {
        console.error("Error fetching staff", error);
      }
    };
    fetchStaff();
  }, [adminId]);

  const roleToIdMap = {
    personal_trainer: 5,
    general_trainer: 6,
    receptionist: 7,
    housekeeping: 8,
  };

  const getFilteredStaff = () => {
    if (!selectedRole || selectedRole === "member") return [];
    
    const expectedRoleId = roleToIdMap[selectedRole];
    if (expectedRoleId === undefined) return [];
    return staffList.filter(staff => staff.roleId === expectedRoleId);
  };

  const filteredStaff = getFilteredStaff();

  const isMember = selectedRole === "member";
  const isReceptionist = selectedRole === "receptionist";
  const isPersonalTrainer = selectedRole === "personal_trainer";
  const isGeneralTrainer = selectedRole === "general_trainer";
  const isHousekeeping = selectedRole === "housekeeping";
  const isTrainer = isPersonalTrainer || isGeneralTrainer;
  const isStaffRole = isReceptionist || isTrainer || isHousekeeping;

  // Fetch logic: staffId is optional for all roles now
  const fetchReport = async () => {
    if (!selectedRole || !adminId) {
      setApiData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let url = "";

      if (isMember) {
        url = `reports/members?adminId=${adminId}`;
      } else if (isPersonalTrainer) {
        if (selectedStaffId) {
          url = `reports/personal-trainer/staff/${adminId}/${selectedStaffId}?fromDate=${dateFrom}&toDate=${dateTo}`;
        } else {
          url = `reports/personal-trainer?adminId=${adminId}`;
        }
      } else if (isGeneralTrainer) {
        if (selectedStaffId) {
          url = `reports/general-trainer/staff/${adminId}/${selectedStaffId}?fromDate=${dateFrom}&toDate=${dateTo}`;
        } else {
          url = `reports/general-trainer?adminId=${adminId}`;
        }
      } else if (isHousekeeping) {
        if (selectedStaffId) {
          url = `reports/housekeeping/admin/${adminId}/staff/${selectedStaffId}?startDate=${dateFrom}&endDate=${dateTo}`;
        } else {
          url = `reports/housekeeping/admin/${adminId}?startDate=${dateFrom}&endDate=${dateTo}`;
        }
      } else if (isReceptionist) {
        // Receptionist has no per-staff API, only summary
        url = `reports/reception/${adminId}`;
        setSelectedStaffId(null); // reset
      } else {
        throw new Error("Unsupported role");
      }

      const response = await axiosInstance.get(url);

      if (response.data?.success) {
        setApiData(response.data);
      } else {
        throw new Error(response.data.message || "Failed to load report");
      }
    } catch (err) {
      setError(err.message);
      setApiData(null);
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedRole, selectedStaffId, dateFrom, dateTo]);

  // ===== DATA PROCESSING =====

  const kpis = useMemo(() => {
    const fallback = { totalBookings: 0, totalRevenue: 0, confirmed: 0, cancelled: 0, booked: 0, avgTicket: 0 };
    if (!apiData) return fallback;

    try {
      if (isHousekeeping) {
        const data = apiData.data;
        if (selectedStaffId) {
          // Individual staff response structure (by staff ID)
          return {
            totalBookings: data.taskMetrics?.total || 0,
            totalRevenue: 0,
            confirmed: data.taskMetrics?.completed || 0,
            cancelled: data.taskMetrics?.pending || 0,
            booked: data.taskMetrics?.inProgress || 0,
            avgTicket: 0,
          };
        } else {
          // Summary response structure (by admin ID)
          return {
            totalBookings: data.summary?.totalTasks || 0,
            confirmed: data.summary?.completedTasks || 0,
            cancelled: data.summary?.pendingTasks || 0,
            booked: data.summary?.inProgressTasks || 0,
            totalRevenue: 0,
            avgTicket: 0,
          };
        }
      }

      if (isReceptionist) {
        const summary = apiData.summary || {};
        return {
          totalBookings: summary.present || 0,
          totalRevenue: 0,
          confirmed: summary.active || 0,
          cancelled: 0,
          booked: summary.completed || 0,
          avgTicket: 0,
        };
      }

      // Member, Personal, General Trainers
      const stats = apiData.data?.stats || {};
      return {
        totalBookings: parseInt(stats.totalBookings) || 0,
        totalRevenue: parseFloat(stats.totalRevenue) || 0,
        confirmed: parseInt(stats.confirmed) || parseInt(stats.completed) || 0,
        cancelled: parseInt(stats.cancelled) || 0,
        booked: parseInt(stats.booked) || 0,
        avgTicket: parseFloat(stats.avgTicket) || 0,
      };
    } catch (e) {
      console.error("KPI error:", e);
    }
    return fallback;
  }, [apiData, selectedRole, selectedStaffId]);

  const byDay = useMemo(() => {
    if (!apiData) return [];

    try {
      if (isHousekeeping) {
        let records = [];
        if (selectedStaffId) {
          // Individual staff - recentAttendance is directly in data
          records = apiData.data?.recentAttendance || [];
        } else {
          // Summary - recentAttendance is inside staffDetails array
          records = (apiData.data?.staffDetails || []).flatMap(s => s.recentAttendance || []);
        }
        
        const map = new Map();
        records.forEach(r => {
          const d = new Date(r.checkIn).toLocaleDateString();
          map.set(d, (map.get(d) || 0) + 1);
        });
        return Array.from(map, ([date, count]) => ({ date, count }));
      }

      if (isReceptionist) {
        return (apiData.weeklyTrend || []).map(item => ({ date: item.day, count: item.count }));
      }

      return (apiData.data?.bookingsByDay || []).map(item => ({
        date: new Date(item.date).toLocaleDateString(),
        count: item.count,
      }));
    } catch (e) {
      console.error("byDay error:", e);
    }
    return [];
  }, [apiData, selectedRole, selectedStaffId]);

  const byStatus = useMemo(() => {
    if (!apiData) return [];

    try {
      if (isHousekeeping) {
        let metrics = {};
        if (selectedStaffId) {
          // Individual staff - taskMetrics is directly in data
          metrics = apiData.data?.taskMetrics || {};
        } else {
          // Summary - metrics are in summary object
          metrics = apiData.data?.summary || {};
        }
        
        return [
          { name: "Completed", value: metrics.completedTasks || metrics.completed || 0 },
          { name: "Pending", value: metrics.pendingTasks || metrics.pending || 0 },
          { name: "In Progress", value: metrics.inProgressTasks || metrics.inProgress || 0 },
        ].filter(x => x.value > 0);
      }

      if (isReceptionist) {
        const s = apiData.summary || {};
        return [
          { name: "Present", value: s.present || 0 },
          { name: "Active", value: s.active || 0 },
          { name: "Completed", value: s.completed || 0 },
        ].filter(x => x.value > 0);
      }

      return (apiData.data?.bookingStatus || [])
        .map(item => {
          const status = (item.bookingStatus || "Unknown").toString();
          return {
            name: status.charAt(0).toUpperCase() + status.slice(1),
            value: item.count || 0,
          };
        })
        .filter(x => x.value > 0);
    } catch (e) {
      console.error("byStatus error:", e);
    }
    return [];
  }, [apiData, selectedRole, selectedStaffId]);

  const tableRows = useMemo(() => {
    if (!apiData) return [];

    try {
      if (isHousekeeping) {
        let attendance = [];
        if (selectedStaffId) {
          // Individual staff - recentAttendance is directly in data
          attendance = apiData.data?.recentAttendance || [];
        } else {
          // Summary - recentAttendance is inside staffDetails array
          attendance = (apiData.data?.staffDetails || []).flatMap(s =>
            (s.recentAttendance || []).map(r => ({ ...r, staffName: s.staffName }))
          );
        }
        
        // Even if attendance is empty, show meaningful info
        if (attendance.length === 0) {
          if (selectedStaffId) {
            // Show individual staff info when no attendance records
            const staffInfo = apiData.data?.staffInfo;
            if (staffInfo) {
              return [{
                date: staffInfo.joinDate ? new Date(staffInfo.joinDate).toLocaleDateString() : "-",
                trainer: staffInfo.fullName || "Housekeeping",
                username: staffInfo.email || "-",
                type: "Staff Info",
                time: staffInfo.status || "Active",
                status: "No attendance records"
              }];
            }
          } else {
            // Show summary for each staff member from staffDetails
            return (apiData.data?.staffDetails || []).map(staff => ({
              date: "-",
              trainer: staff.staffName || "Housekeeping",
              username: staff.email || "-",
              type: "Staff Summary",
              time: `Tasks: ${staff.totalTasks || 0}`,
              status: staff.status || "Active"
            }));
          }
        }
        
        return attendance.map(r => ({
          date: new Date(r.checkIn).toLocaleDateString(),
          trainer: r.staffName || (apiData.data?.staffInfo?.fullName || "Housekeeping"),
          username: "-",
          type: "Attendance",
          time: r.checkOut ? `${new Date(r.checkIn).toLocaleTimeString()} - ${new Date(r.checkOut).toLocaleTimeString()}` : new Date(r.checkIn).toLocaleTimeString(),
          status: r.status || "N/A",
        }));
      }

      if (isReceptionist) {
        return (apiData.receptionists || []).map(item => ({
          date: "-",
          trainer: item.name,
          username: "-",
          type: "-",
          time: "-",
          status: `Check-ins: ${item.totalCheckins || 0}`,
        }));
      }

      return (apiData.data?.transactions || []).map((item, i) => ({
        date: item.date ? new Date(item.date).toLocaleDateString() : "-",
        trainer: item.trainer || "-",
        username: item.username || "-",
        type: item.type || "-",
        time: item.time || "-",
        status: item.status || "N/A",
      }));
    } catch (e) {
      console.error("tableRows error:", e);
    }
    return [];
  }, [apiData, selectedRole, selectedStaffId]);

  // ===== EXPORTS =====

  const exportCSV = () => {
    if (!apiData) return alert("No data to export.");
    const header = ["Date", "Trainer", "Username", "Type", "Time", "Status"];
    const rows = tableRows.map(r => [
      r.date,
      r.trainer,
      r.username,
      r.type,
      r.time,
      r.status,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," +
      [header, ...rows]
        .map(e => e.map(f => `"${String(f).replace(/"/g, '""')}"`).join(","))
        .join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `report_${selectedRole}_${dateFrom}_${dateTo}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = async () => {
    if (!apiData) return alert("No data to export.");
    setPdfGenerating(true);
    try {
      const buttons = document.querySelectorAll(".btn");
      buttons.forEach(btn => (btn.style.visibility = "hidden"));
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true });
      buttons.forEach(btn => (btn.style.visibility = "visible"));

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF("p", "mm", "a4");
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`report_${selectedRole}_${dateFrom}_${dateTo}.pdf`);
    } catch (err) {
      alert("PDF generation failed.");
      console.error(err);
    } finally {
      setPdfGenerating(false);
    }
  };

  const shouldShowReport = apiData && !loading && !error;

  return (
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">Sales Report</h2>
          <p className="text-muted mb-0">View summary or drill down to individual staff.</p>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-secondary"
            onClick={exportCSV}
            disabled={!shouldShowReport}
          >
            <FaDownload className="me-2" /> Export CSV
          </button>
          <button
            className="btn btn-outline-danger"
            onClick={exportPDF}
            disabled={!shouldShowReport || pdfGenerating}
          >
            <FaFilePdf className="me-2" /> {pdfGenerating ? "Generating..." : "Export PDF"}
          </button>
        </div>
      </div>

      {/* Role Selection */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-center">
            <div className="col-12 col-md-6">
              <label className="form-label"><FaUserCog className="me-2" /> Select Role</label>
              <select
                className="form-select"
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value);
                  setSelectedStaffId(null);
                }}
              >
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      {selectedRole && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="row g-3 align-items-end">
              <div className="col-6 col-md-3">
                <label className="form-label"><FaCalendarAlt className="me-2" /> From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="form-control"
                />
              </div>
              <div className="col-6 col-md-3">
                <label className="form-label"><FaCalendarAlt className="me-2" /> To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="form-control"
                />
              </div>

              {/* Staff filter for all staff roles */}
              {isStaffRole && (
                <div className="col-6 col-md-3">
                  <label className="form-label"><FaFilter className="me-2" /> Staff</label>
                  <select
                    className="form-select"
                    value={selectedStaffId || ""}
                    onChange={(e) => setSelectedStaffId(e.target.value || null)}
                    disabled={!filteredStaff.length}
                  >
                    <option value="">All / Summary</option>
                    {filteredStaff.map((staff) => (
                      <option key={staff.staffId} value={staff.staffId}>
                        {staff.fullName.trim()}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Status filter for trainers & member */}
              {(isTrainer || isMember) && (
                <div className="col-6 col-md-3">
                  <label className="form-label"><FaFilter className="me-2" /> Status</label>
                  <select
                    className="form-select"
                    value={bookingStatus}
                    onChange={(e) => setBookingStatus(e.target.value)}
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {/* {error && <div className="alert alert-danger">{error}</div>} */}

      {/* REPORT */}
      <div ref={reportRef}>
        {shouldShowReport ? (
          <>
            {/* KPIs */}
            <div className="row g-3 mb-4">
              <Widget title="Total Bookings" value={kpis.totalBookings} />
              <Widget
                title="Total Revenue"
                value={`₹ ${kpis.totalRevenue.toLocaleString("en-IN")}`}
              />
              {/* <Widget
                title="Avg Ticket"
                value={`₹ ${kpis.avgTicket.toLocaleString("en-IN")}`}
              /> */}
              <Widget title="Confirmed" value={kpis.confirmed} />
              <Widget title="Cancelled" value={kpis.cancelled} />
              <Widget title="Booked" value={kpis.booked} />
            </div>

            {/* Charts */}
            <div className="row g-3 mb-4">
              <div className="col-12 col-lg-7">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-header bg-white border-0 fw-semibold">
                    {isHousekeeping ? "Attendance by Day" : "Bookings by Day"}
                  </div>
                  <div className="card-body" style={{ height: 300, padding: '8px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={byDay} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                          itemStyle={{ fontSize: '12px', fontWeight: '500', color: '#333' }}
                          labelStyle={{ display: 'none' }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        <Line type="monotone" dataKey="count" stroke="#0d6efd" name="Count" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="col-12 col-lg-5">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-header bg-white border-0 fw-semibold">
                    {isHousekeeping ? "Task Status" : "Booking Status"}
                  </div>
                  <div className="card-body" style={{ height: 300, padding: '8px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={byStatus}
                          cx="50%"
                          cy="50%"
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={70}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          labelLine={{ strokeWidth: 1 }}
                        >
                          {byStatus.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={["#20c997", "#dc3545", "#ffc107", "#0d6efd"][index % 4]}
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                          itemStyle={{ fontSize: '12px', fontWeight: '500', color: '#333' }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0 fw-semibold">Transactions</div>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th>Date</th>
                      <th>Trainer</th>
                      <th>Username</th>
                      <th>Type</th>
                      <th>Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-5 text-muted">
                          No data available.
                        </td>
                      </tr>
                    ) : (
                      tableRows.map((r, i) => (
                        <tr key={i}>
                          <td>{r.date}</td>
                          <td>{r.trainer}</td>
                          <td>{r.username}</td>
                          <td>{r.type}</td>
                          <td>{r.time}</td>
                          <td>
                            <span
                              className={`badge ${["Confirmed", "Completed", "Present", "Active"].includes(r.status)
                                  ? "bg-success"
                                  : r.status === "Cancelled"
                                    ? "bg-danger"
                                    : "bg-primary"
                                }`}
                            >
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-5">
            <FaUserCog size={48} className="mb-3 text-muted" />
            <h5>Select a Role to Generate Report</h5>
          </div>
        )}
      </div>
    </div>
  );
}

function Widget({ title, value }) {
  return (
    <div className="col-6 col-lg-2">
      <div className="card border-0 shadow-sm h-100">
        <div className="card-body">
          <div className="text-muted small">{title}</div>
          <div className="fs-5 fw-semibold mt-1">{value}</div>
        </div>
      </div>
    </div>
  );
}