import React, { useMemo, useState, useEffect } from "react";
import {
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  Tooltip,
} from "recharts";
import { FaDownload, FaCalendarAlt, FaFilter, FaUserCog } from "react-icons/fa";
import axiosInstance from "../../../Api/axiosInstance";
import GetAdminId from "../../../Api/GetAdminId";

// Super Admin → Reports → Attendance (Role-Based Only)
export default function AttendanceReport() {
  // -------------------- STEP 1: ROLE SELECTION --------------------
  const adminId = GetAdminId();
  const [selectedRole, setSelectedRole] = useState("staff"); // "" | "staff" | "member" | "staff-attendance"
  const roles = [
    { value: "", label: "Select Role..." },
    {
      value: "staff",
      label: "Staff (Receptionist, PT, Housekeeping)",
    },
    { value: "member", label: "Member" },
  ];

  // -------------------- STEP 2: DATE FILTERS --------------------
  const [dateFrom, setDateFrom] = useState("2025-01-01");
  const [dateTo, setDateTo] = useState("2025-01-15");

  // -------------------- API STATE --------------------
  const [apiData, setApiData] = useState(null);
  const [memberApiData, setMemberApiData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // -------------------- FETCH API DATA --------------------
  useEffect(() => {
    if (selectedRole === "staff" && dateFrom && dateTo) {
      setLoading(true);
      setError(null);

      // Use axios to fetch staff attendance data from API
      axiosInstance
        .get(
          `staff-attendance/report?adminId=${adminId}&from=${dateFrom}&to=${dateTo}`
        )
        .then((response) => {
          setApiData(response.data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching staff attendance data:", err);
          setError("Failed to fetch staff attendance data. Please try again later.");
          setLoading(false);
        });
    } else if (selectedRole === "member") {
      setLoading(true);
      setError(null);

      // Use axios to fetch member attendance data from API
      axiosInstance
        .get(
          `reports/attendance/${adminId}`
        )
        .then((response) => {
          setMemberApiData(response.data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching member attendance data:", err);
          setError("Failed to fetch member attendance data. Please try again later.");
          setLoading(false);
        });
    }
  }, [selectedRole, dateFrom, dateTo, adminId]);

  // -------------------- MOCK DATA --------------------

  // 👇 STAFF ATTENDANCE — WITHOUT BRANCH
  const staffRows = useMemo(() => {
    // If API data is available, use it; otherwise fall back to mock data
    if (apiData && apiData.table) {
      return apiData.table.map((item) => ({
        name: item.name,
        role: item.role,
        shift: item.shift,
        scheduled: item.scheduledHrs,
        present: item.presentHrs,
      }));
    }

    // Fallback to mock data
    return [
      {
        name: "A. Singh",
        role: "Personal Trainer",
        shift: "Straight",
        scheduled: 48,
        present: 46,
      },
      {
        name: "R. Khan",
        role: "Trainer",
        shift: "Straight",
        scheduled: 48,
        present: 44,
      },
      {
        name: "M. Patel",
        role: "Receptionist",
        shift: "Break",
        scheduled: 40,
        present: 40,
      },
      {
        name: "I. Desai",
        role: "Housekeeping",
        shift: "Weekend",
        scheduled: 16,
        present: 14,
      },
      {
        name: "S. Gupta",
        role: "Manager",
        shift: "Straight",
        scheduled: 48,
        present: 38,
      },
      {
        name: "T. Roy",
        role: "Receptionist",
        shift: "Straight",
        scheduled: 48,
        present: 48,
      },
      {
        name: "P. Mehta",
        role: "Personal Trainer",
        shift: "Weekend",
        scheduled: 16,
        present: 12,
      },
    ];
  }, [apiData]);

  // 👇 MEMBER ATTENDANCE — WITHOUT BRANCH
  const memberRows = useMemo(() => {
    // If API data is available, use it; otherwise fall back to mock data
    if (memberApiData && memberApiData.members) {
      return memberApiData.members.map((item) => ({
        name: item.fullName,
        checkins: item.checkins,
        noshows: parseInt(item.noShows),
        avgSession: parseInt(item.avgSessionTime) || 0,
      }));
    }

    // Fallback to mock data
    return [
      { name: "K. Sharma", checkins: 4, noshows: 1, avgSession: 55 },
      { name: "S. Rao", checkins: 3, noshows: 0, avgSession: 48 },
      { name: "P. Gupta", checkins: 5, noshows: 0, avgSession: 62 },
      { name: "N. Joshi", checkins: 2, noshows: 2, avgSession: 41 },
      { name: "A. Dey", checkins: 1, noshows: 0, avgSession: 37 },
      { name: "L. Kumar", checkins: 6, noshows: 0, avgSession: 70 },
      { name: "V. Singh", checkins: 0, noshows: 4, avgSession: 0 },
    ];
  }, [memberApiData]);

  // 👇 HEATMAP DATA — Use API data if available
  const heatDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const heatHours = [
    "06",
    "07",
    "08",
    "09",
    "10",
    "11",
    "12",
    "13",
    "14",
    "15",
    "16",
    "17",
  ];
  const heatmap = useMemo(() => {
    // If API data is available, use it
    if (selectedRole === "member" && memberApiData && memberApiData.heatmap) {
      // Convert API heatmap format to our component format
      const apiHeatmap = memberApiData.heatmap;
      
      // Create a map of dates to day of week and hour
      const dateMap = {};
      apiHeatmap.forEach(entry => {
        const date = new Date(entry.date);
        const dayOfWeek = heatDays[date.getDay() === 0 ? 6 : date.getDay() - 1]; // Adjust for Monday as first day
        const hour = date.getHours().toString().padStart(2, '0');
        
        if (!dateMap[dayOfWeek]) {
          dateMap[dayOfWeek] = {};
        }
        
        if (!dateMap[dayOfWeek][hour]) {
          dateMap[dayOfWeek][hour] = 0;
        }
        
        dateMap[dayOfWeek][hour] += entry.checkins;
      });
      
      // Convert to our heatmap format
      return heatDays.map(day => {
        return heatHours.map(hour => {
          return dateMap[day] && dateMap[day][hour] ? dateMap[day][hour] : 0;
        });
      });
    } else if (apiData && apiData.heatmap) {
      // Convert API heatmap format to our component format
      const apiHeatmap = apiData.heatmap;
      const result = heatDays.map((day) => {
        // For each day, create an array of 12 hours
        return heatHours.map((hour) => {
          // Check if we have data for this day
          const dayData = apiHeatmap[day];
          if (dayData) {
            // For simplicity, we'll use the first date's value for all hours
            // In a real implementation, you might want to map specific hours
            const dateKey = Object.keys(dayData)[0];
            return dateKey ? dayData[dateKey] : 0;
          }
          return 0;
        });
      });
      return result;
    }

    // Fallback to mock data
    const seed = 37;
    let x = seed;
    const rnd = () => (x = (x * 9301 + 49297) % 233280) / 233280;
    return heatDays.map(() => heatHours.map(() => Math.floor(rnd() * 40)));
  }, [apiData, memberApiData, selectedRole]);

  // -------------------- FILTERED DATA --------------------
  const isStaff = selectedRole === "staff" || selectedRole === "staff-attendance";
  const isMember = selectedRole === "member";

  const staffFiltered = useMemo(() => {
    if (!isStaff) return [];
    return staffRows;
  }, [staffRows, isStaff]);

  const memberFiltered = useMemo(() => {
    if (!isMember) return [];
    return memberRows;
  }, [memberRows, isMember]);

  // -------------------- GAUGE COMPLIANCE --------------------
  const staffCompliancePct = useMemo(() => {
    if (!isStaff) return 0;

    // If API data is available, use the overall compliance value
    if (apiData && apiData.overallCompliance !== undefined) {
      return apiData.overallCompliance;
    }

    // Otherwise calculate from filtered data
    const totalScheduled = staffFiltered.reduce(
      (sum, r) => sum + r.scheduled,
      0
    );
    const totalPresent = staffFiltered.reduce((sum, r) => sum + r.present, 0);
    return totalScheduled
      ? Math.round((totalPresent / totalScheduled) * 100)
      : 0;
  }, [staffFiltered, isStaff, apiData]);

  // -------------------- EXPORT CSV --------------------
  const exportCSV = (type) => {
    if (!selectedRole) return alert("Please select a role first!");

    if (type === "staff") {
      const header = [
        "Name",
        "Role",
        "Shift",
        "Scheduled Hrs",
        "Present Hrs",
        "OT",
        "Compliance %",
      ];
      const rows = staffFiltered.map((r) => [
        r.name,
        r.role,
        r.shift || "-",
        r.scheduled,
        r.present,
        Math.max(0, r.present - r.scheduled),
        pct(r.present, r.scheduled),
      ]);
      downloadCSV(
        [header, ...rows],
        `attendance_staff_${dateFrom}_${dateTo}.csv`
      );
    } else if (type === "member") {
      const header = ["Name", "Check-ins", "No-shows", "Avg Session (min)"];
      const rows = memberFiltered.map((r) => [
        r.name,
        r.checkins,
        r.noshows,
        r.avgSession,
      ]);
      downloadCSV(
        [header, ...rows],
        `attendance_member_${dateFrom}_${dateTo}.csv`
      );
    }
  };

  return (
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">Attendance Report</h2>
          <p className="text-muted mb-0">
            Track staff and member attendance by role.
          </p>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-secondary"
            onClick={() => alert("Schedule email report feature coming soon!")}
            disabled={!selectedRole}
          >
            Schedule
          </button>
        </div>
      </div>

      {/* STEP 1: ROLE SELECTION (MANDATORY) */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-center">
            <div className="col-12 col-md-6">
              <label className="form-label">
                <FaUserCog className="me-2" /> Select Role
              </label>
              <select
                className="form-select"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            {!selectedRole && (
              <div className="col-12">
                <div className="alert alert-warning">
                  <strong>Please select a role to view attendance data.</strong>
                  <br />
                  Choose between <strong>Staff</strong> or <strong>Member</strong>.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* STEP 2: DATE RANGE (Always visible after role select) */}
      {selectedRole && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="row g-3 align-items-end">
              <div className="col-6 col-md-3">
                <label className="form-label">
                  <FaCalendarAlt className="me-2" /> From
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="form-control"
                />
              </div>
              <div className="col-6 col-md-3">
                <label className="form-label">
                  <FaCalendarAlt className="me-2" /> To
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="form-control"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: CHARTS & TABLES — ONLY IF ROLE SELECTED */}
      {selectedRole && (
        <>
          {/* Loading State */}
          {loading && (
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3">Fetching attendance data...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body">
                <div className="alert alert-danger">{error}</div>
              </div>
            </div>
          )}

          {/* Data Display (only when not loading) */}
          {!loading && !error && (
            <>
              {/* Charts Row */}
              <div className="row g-3 mb-4">
                {/* Heatmap */}
                <div className="col-12 col-lg-8">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-header bg-white border-0 fw-semibold">
                      {selectedRole === "staff" ||
                      selectedRole === "staff-attendance"
                        ? "Staff Check-in Pattern"
                        : "Member Check-ins Heatmap"}
                    </div>
                    <div className="card-body">
                      <div className="d-flex gap-3">
                        {/* Y labels */}
                        <div
                          className="d-flex flex-column justify-content-between py-2"
                          style={{ height: 260 }}
                        >
                          {heatDays.map((d) => (
                            <div
                              key={d}
                              className="text-muted small"
                              style={{ height: 260 / 7 - 2 }}
                            >
                              {d}
                            </div>
                          ))}
                        </div>
                        {/* Grid */}
                        <div className="flex-grow-1">
                          <div
                            className="d-grid"
                            style={{
                              gridTemplateColumns: `repeat(${heatHours.length}, 1fr)`,
                              gap: 4,
                            }}
                          >
                            {heatDays.map((_, r) =>
                              heatHours.map((_, c) => (
                                <div
                                  key={`${r}-${c}`}
                                  title={`${heatmap[r][c]} check-ins`}
                                  style={{
                                    height: 28,
                                    borderRadius: 6,
                                    backgroundColor: `rgba(13,110,253, ${Math.max(
                                      0.08,
                                      heatmap[r][c] / 40
                                    )})`,
                                  }}
                                />
                              ))
                            )}
                          </div>
                          <div className="d-flex justify-content-between mt-2 text-muted small">
                            {heatHours.map((h) => (
                              <span key={h}>{h}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="text-muted small mt-2">
                        Darker = more check-ins
                      </div>
                    </div>
                  </div>
                </div>

                {/* Compliance Gauge (Only for Staff) */}
                {(selectedRole === "staff" ||
                  selectedRole === "staff-attendance") && (
                  <div className="col-12 col-lg-4">
                    <div className="card border-0 shadow-sm h-100">
                      <div className="card-header bg-white border-0 fw-semibold">
                        Staff Compliance
                      </div>
                      <div
                        className="card-body d-flex align-items-center justify-content-center"
                        style={{ height: 280 }}
                      >
                        <div style={{ width: '100%', maxWidth: 240, height: 240 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart
                              innerRadius="70%"
                              outerRadius="100%"
                              startAngle={180}
                              endAngle={0}
                              data={[
                                {
                                  name: "Compliance",
                                  value: staffCompliancePct,
                                  fill:
                                    staffCompliancePct >= 90
                                      ? "#198754"
                                      : staffCompliancePct >= 75
                                      ? "#0d6efd"
                                      : "#dc3545",
                                },
                              ]}
                              cy="100%"
                              cx="50%"
                            >
                              <PolarAngleAxis
                                type="number"
                                domain={[0, 100]}
                                tick={false}
                              />
                              <RadialBar
                                minAngle={15}
                                background
                                dataKey="value"
                                cornerRadius={10}
                              />
                              <Tooltip formatter={(v) => `${v}%`} wrapperStyle={{ zIndex: 1000, fontSize: '12px' }} />
                            </RadialBarChart>
                          </ResponsiveContainer>
                        </div>
                        <div
                          className="position-absolute text-center"
                          style={{ marginTop: 0 }}
                        >
                          <div className="fw-bold" style={{ fontSize: 24 }}>
                            {staffCompliancePct}%
                          </div>
                          <div className="text-muted small">Present ÷ Scheduled</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* For Members — Show Avg Session as Gauge */}
                {selectedRole === "member" && (
                  <div className="col-12 col-lg-4">
                    <div className="card border-0 shadow-sm h-100">
                      <div className="card-header bg-white border-0 fw-semibold">
                        Avg Session Duration
                      </div>
                      <div
                        className="card-body d-flex flex-column align-items-center justify-content-center"
                        style={{ height: 300 }}
                      >
                        <div className="text-center">
                          <div className="fw-bold" style={{ fontSize: 36 }}>
                            {memberFiltered.length > 0
                              ? Math.round(
                                  memberFiltered.reduce(
                                    (sum, r) => sum + r.avgSession,
                                    0
                                  ) / memberFiltered.length
                                )
                              : 0}
                            min
                          </div>
                          <div className="text-muted">
                            Average session time across members
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tables Row */}
              <div className="row g-3">
                {/* Staff Table */}
                {(selectedRole === "staff" ||
                  selectedRole === "staff-attendance") && (
                  <div className="col-12 col-xl-12">
                    <div className="card border-0 shadow-sm h-100">
                      <div className="card-header bg-white border-0 d-flex align-items-center justify-content-between">
                        <div className="fw-semibold">Staff Attendance</div>
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => exportCSV("staff")}
                          disabled={staffFiltered.length === 0}
                        >
                          <FaDownload className="me-2" /> Export
                        </button>
                      </div>
                      <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                          <thead className="bg-light">
                            <tr>
                              <th>Name</th>
                              <th>Role</th>
                              <th>Shift</th>
                              <th>Scheduled Hrs</th>
                              <th>Present Hrs</th>
                              <th>OT</th>
                              <th>Compliance%</th>
                            </tr>
                          </thead>
                          <tbody>
                            {staffFiltered.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={7}
                                  className="text-center py-5 text-muted"
                                >
                                  No staff data found.
                                </td>
                              </tr>
                            ) : (
                              staffFiltered.map((r, i) => (
                                <tr key={i}>
                                  <td>{r.name}</td>
                                  <td>{r.role}</td>
                                  <td>{r.shift || "-"}</td>
                                  <td>{r.scheduled}</td>
                                  <td>{r.present}</td>
                                  <td>
                                    {Math.max(0, r.present - r.scheduled)}
                                  </td>
                                  <td>{pct(r.present, r.scheduled)}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Member Table */}
                {selectedRole === "member" && (
                  <div className="col-12 col-xl-12">
                    <div className="card border-0 shadow-sm h-100">
                      <div className="card-header bg-white border-0 d-flex align-items-center justify-content-between">
                        <div className="fw-semibold">Member Attendance</div>
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => exportCSV("member")}
                          disabled={memberFiltered.length === 0}
                        >
                          <FaDownload className="me-2" /> Export
                        </button>
                      </div>
                      <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                          <thead className="bg-light">
                            <tr>
                              <th>Name</th>
                              <th>Check-ins</th>
                              <th>No-shows</th>
                              <th>Avg Session</th>
                            </tr>
                          </thead>
                          <tbody>
                            {memberFiltered.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={4}
                                  className="text-center py-5 text-muted"
                                >
                                  No member data found.
                                </td>
                              </tr>
                            ) : (
                              memberFiltered.map((r, i) => (
                                <tr key={i}>
                                  <td>{r.name}</td>
                                  <td>{r.checkins}</td>
                                  <td>{r.noshows}</td>
                                  <td>{r.avgSession} min</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* Empty State Before Role Selection */}
      {!selectedRole && (
        <div className="text-center py-5">
          <div className="text-muted">
            <FaUserCog size={48} className="mb-3" />
            <h5>Select Role to View Attendance</h5>
            <p className="lead">
              Choose <strong>Staff</strong> to see
              trainer/reception/housekeeping attendance
              <br />
              or <strong>Member</strong> to see check-in patterns and no-shows
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- helpers ----------
function pct(present, scheduled) {
  if (!scheduled) return "0%";
  return Math.round((present / scheduled) * 100) + "%";
}

function downloadCSV(rows, filename) {
  const csv = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}