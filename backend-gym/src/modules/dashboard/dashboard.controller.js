import { pool } from "../../config/db.js";
import { dashboardService,superAdminDashboardService, superAdminCRMStatsService } from "./dashboard.service.js";

export const getDashboardData = async (req, res, next) => {
  try {
    const data = await dashboardService();
    res.json({ success: true, dashboard: data });
  } catch (err) {
    next(err);
  }
}




export const getSuperAdminDashboard = async (req, res, next) => {
  try {
    const branchId = req.query.branchId;
    const data = await superAdminDashboardService(branchId);
    res.json({
      success: true,
      message: "Dashboard loaded successfully",
      data
    });
  } catch (err) {
    next(err);
  }
};

// export const getReceptionistDashboard = async (req, res, next) => {
//   try {
//     const branchId = Number(req.query.branchId) || 1;

//     /* --------------------------------------------------------
//        1️⃣ WEEKLY ATTENDANCE TREND
//     -------------------------------------------------------- */
//     const [weekly] = await pool.query(
//       `
//       SELECT 
//           DAYNAME(checkIn) AS day,
//           COUNT(*) AS count,
//           DAYOFWEEK(checkIn) AS sortOrder
//       FROM memberattendance
//       WHERE DATE(checkIn) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
//         AND branchId = ?
//       GROUP BY day, sortOrder
//       ORDER BY sortOrder
//       `,
//       [branchId]
//     );

//     /* --------------------------------------------------------
//        2️⃣ TODAY SUMMARY
//     -------------------------------------------------------- */
//     const [[present]] = await pool.query(
//       `
//       SELECT COUNT(*) AS count 
//       FROM memberattendance 
//       WHERE DATE(checkIn) = CURDATE()
//         AND branchId = ?
//       `,
//       [branchId]
//     );

//     const [[active]] = await pool.query(
//       `
//       SELECT COUNT(*) AS count 
//       FROM memberattendance 
//       WHERE DATE(checkIn) = CURDATE()
//         AND checkOut IS NULL
//         AND branchId = ?
//       `,
//       [branchId]
//     );

//     const [[completed]] = await pool.query(
//       `
//       SELECT COUNT(*) AS count 
//       FROM memberattendance 
//       WHERE DATE(checkIn) = CURDATE()
//         AND checkOut IS NOT NULL
//         AND branchId = ?
//       `,
//       [branchId]
//     );

//     /* --------------------------------------------------------
//        3️⃣ TOTAL REVENUE
//     -------------------------------------------------------- */
//     const [[revenue]] = await pool.query(
//       `
//       SELECT SUM(amount) AS total
//       FROM payment
//       WHERE branchId = ?
//       `,
//       [branchId]
//     );

//     /* --------------------------------------------------------
//        4️⃣ RESPONSE
//     -------------------------------------------------------- */
//     res.json({
//       success: true,
//       dashboard: {
//         weeklyTrend: weekly,
//         summary: {
//           present: present.count,
//           active: active.count,
//           completed: completed.count,
//         },
//         revenue: {
//           total: revenue?.total || 0,
//         },
//       },
//     });

//   } catch (err) {
//     next(err);
//   }
// };

//  |||||||||||||||||||||||\

// export const getReceptionistDashboard = async (req, res, next) => {
//   try {
//     const branchId = Number(req.query.branchId) || 1;

//     // Weekly Trend
//     const [weekly] = await pool.query(
//       `
//       SELECT 
//           DAYNAME(checkIn) AS day,
//           COUNT(*) AS count,
//           DAYOFWEEK(checkIn) AS sortOrder
//       FROM memberattendance
//       WHERE DATE(checkIn) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
//         AND branchId = ?
//       GROUP BY day, sortOrder
//       ORDER BY sortOrder
//       `,
//       [branchId]
//     );

//     // Today Summary
//     const [[present]] = await pool.query(
//       `SELECT COUNT(*) AS count 
//        FROM memberattendance 
//        WHERE DATE(checkIn) = CURDATE()
//          AND branchId = ?`,
//       [branchId]
//     );

//     const [[active]] = await pool.query(
//       `SELECT COUNT(*) AS count 
//        FROM memberattendance 
//        WHERE DATE(checkIn) = CURDATE()
//          AND checkOut IS NULL
//          AND branchId = ?`,
//       [branchId]
//     );

//     const [[completed]] = await pool.query(
//       `SELECT COUNT(*) AS count 
//        FROM memberattendance 
//        WHERE DATE(checkIn) = CURDATE()
//          AND checkOut IS NOT NULL
//          AND branchId = ?`,
//       [branchId]
//     );

//     // REVENUE FIXED — NO branchId filter
//     const [[revenue]] = await pool.query(
//       `SELECT SUM(amount) AS total FROM payment`
//     );

//     res.json({
//       success: true,
//       dashboard: {
//         weeklyTrend: weekly,
//         summary: {
//           present: present.count,
//           active: active.count,
//           completed: completed.count,
//         },
//         revenue: {
//           total: revenue?.total || 0,
//         },
//       },
//     });

//   } catch (err) {
//     next(err);
//   }
// };

export const getSalesDashboard = async (req, res, next) => {
  try {
    const adminId = Number(req.query.adminId);
    const branchId = req.query.branchId ? Number(req.query.branchId) : null;

    if (!adminId) {
      return res.status(400).json({
        success: false,
        message: "adminId is required",
      });
    }

    const bIdFilter = branchId ? "AND branchId = ?" : "";
    const bIdParams = branchId ? [adminId, branchId] : [adminId];

    /* =========================
       1️⃣ TOTAL REVENUE (This Month)
    ========================= */
    const [[revenueThisMonth]] = await pool.query(
      `
      SELECT SUM(p.amount) AS total
      FROM payment p
      JOIN member m ON p.memberId = m.id
      WHERE m.adminId = ?
        ${branchId ? "AND m.branchId = ?" : ""}
        AND MONTH(p.paymentDate) = MONTH(CURDATE())
        AND YEAR(p.paymentDate) = YEAR(CURDATE())
      `,
      bIdParams
    );

    /* =========================
       2️⃣ NEW REGISTRATIONS (This Week)
    ========================= */
    const [[newRegistrations]] = await pool.query(
      `
      SELECT COUNT(*) AS count
      FROM member m
      WHERE m.adminId = ?
        ${bIdFilter}
        AND m.joinDate >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      `,
      bIdParams
    );

    /* =========================
       3️⃣ ACTIVE LEADS
    ========================= */
    const [[activeLeads]] = await pool.query(
      `
      SELECT COUNT(*) AS count
      FROM leads
      WHERE adminId = ?
        ${bIdFilter}
        AND status IN ('New', 'Contacted', 'Follow Up')
      `,
      bIdParams
    );

    /* =========================
       4️⃣ PENDING RENEWALS
    ========================= */
    const [[pendingRenewals]] = await pool.query(
      `
      SELECT COUNT(*) AS count
      FROM member_plan_assignment mpa
      JOIN member m ON mpa.memberId = m.id
      WHERE m.adminId = ?
        ${branchId ? "AND m.branchId = ?" : ""}
        AND mpa.membershipTo BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
        AND mpa.status = 'Active'
      `,
      bIdParams
    );

    /* =========================
       5️⃣ REVENUE VS EXPENSES (Last 6 Months)
    ========================= */
    // Income
    const [incomeData] = await pool.query(
      `
      SELECT 
        DATE_FORMAT(p.paymentDate, '%b') AS month,
        YEAR(p.paymentDate) AS year,
        SUM(p.amount) AS total
      FROM payment p
      JOIN member m ON p.memberId = m.id
      WHERE m.adminId = ?
        ${branchId ? "AND m.branchId = ?" : ""}
        AND p.paymentDate >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY year, month
      ORDER BY year, MONTH(p.paymentDate)
      `,
      bIdParams
    );

    // Expenses (Expense + Salary)
    const [expenseDataRaw] = await pool.query(
      `
      SELECT 
        DATE_FORMAT(e.date, '%b') AS month,
        YEAR(e.date) AS year,
        SUM(e.amount) AS total
      FROM expense e
      JOIN branch b ON e.branchId = b.id
      WHERE b.adminId = ?
        ${branchId ? "AND e.branchId = ?" : ""}
        AND e.date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY year, month
      `,
      bIdParams
    );
    
    // We can also fetch salaries but for simplicity and speed, let's just use expense table for now
    
    /* =========================
       6️⃣ LEAD CONVERSION
    ========================= */
    const [leadConversion] = await pool.query(
      `
      SELECT status, COUNT(*) AS count
      FROM leads
      WHERE adminId = ?
        ${bIdFilter}
      GROUP BY status
      `,
      bIdParams
    );

    /* =========================
       7️⃣ RECENT TRANSACTIONS
    ========================= */
    const [recentTransactions] = await pool.query(
      `
      SELECT 
        p.id,
        p.invoiceNo,
        p.amount,
        p.paymentDate,
        m.fullName AS memberName,
        pl.name AS planName
      FROM payment p
      JOIN member m ON p.memberId = m.id
      LEFT JOIN plan pl ON p.planId = pl.id
      WHERE m.adminId = ?
        ${branchId ? "AND m.branchId = ?" : ""}
      ORDER BY p.paymentDate DESC
      LIMIT 5
      `,
      bIdParams
    );

    /* =========================
       8️⃣ TODAY'S FOLLOW UPS (Leads)
    ========================= */
    const [todayFollowUps] = await pool.query(
      `
      SELECT id, fullName, phone, status, followUpDate
      FROM leads
      WHERE adminId = ?
        ${bIdFilter}
        AND DATE(followUpDate) = CURDATE()
      LIMIT 5
      `,
      bIdParams
    );

    res.json({
      success: true,
      dashboard: {
        summary: {
          totalRevenue: revenueThisMonth?.total || 0,
          newRegistrations: newRegistrations?.count || 0,
          activeLeads: activeLeads?.count || 0,
          pendingRenewals: pendingRenewals?.count || 0,
        },
        profitAndLoss: {
          income: incomeData,
          expenses: expenseDataRaw,
        },
        leadConversion: leadConversion,
        recentTransactions: recentTransactions,
        todayFollowUps: todayFollowUps,
      },
    });

  } catch (err) {
    next(err);
  }
};


/* -----------------------------------------------------
SELECT 
  dayname(d) AS day,
  COALESCE((
    SELECT COUNT(*)
    FROM memberattendance 
    WHERE DATE(checkIn) = d AND branchId = ?
  ), 0) AS count
FROM (
  SELECT CURDATE() AS d
  UNION SELECT DATE_SUB(CURDATE(), INTERVAL 1 DAY)
  UNION SELECT DATE_SUB(CURDATE(), INTERVAL 2 DAY)
  UNION SELECT DATE_SUB(CURDATE(), INTERVAL 3 DAY)
  UNION SELECT DATE_SUB(CURDATE(), INTERVAL 4 DAY)
  UNION SELECT DATE_SUB(CURDATE(), INTERVAL 5 DAY)
  UNION SELECT DATE_SUB(CURDATE(), INTERVAL 6 DAY)
) AS days
ORDER BY d;

*/

export const getSuperAdminCRMStats = async (req, res, next) => {
  try {
    const data = await superAdminCRMStatsService();
    res.json({
      success: true,
      message: "Super Admin CRM stats loaded successfully",
      data
    });
  } catch (err) {
    next(err);
  }
};
