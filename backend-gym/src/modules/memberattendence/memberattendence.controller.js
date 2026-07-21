import { pool } from "../../config/db.js";

/* -----------------------------------------------------
   1️⃣  MEMBER/ADMIN CHECK-IN  (Manual + QR + Manual Times)
------------------------------------------------------ */
export const memberCheckIn = async (req, res, next) => {
  try {
    const { memberId, branchId, mode, notes, checkIn, userRole, qrAdminId, nonce, latitude, longitude, deviceId } = req.body;

    if (!memberId) {
      return res.status(400).json({
        success: false,
        message: "memberId required",
      });
    }

    // ✅ Check-in time (default = now)
    const finalCheckIn = checkIn ? new Date(checkIn) : new Date();
    if (isNaN(finalCheckIn.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid checkIn format. Use YYYY-MM-DD HH:mm:ss",
      });
    }

    // ❌ CheckOut always NULL at check-in
    const finalCheckOut = null;

    // Check if user is a member or admin
    let isMember = false;
    let isAdmin = false;
    let userBranchId = branchId;
    let memberAdminId = null;

    // ✅ QR code adminId is required
    if (!qrAdminId) {
      return res.status(400).json({
        success: false,
        message: "QR code adminId is required. Please scan a valid admin QR code.",
      });
    }

    // First, check if member exists
    const [memberRecords] = await pool.query(
      "SELECT * FROM member WHERE id = ?",
      [memberId]
    );

    if (memberRecords.length > 0) {
      isMember = true;
      memberAdminId = memberRecords[0].adminId;
      // Always use member's branchId from database (most reliable)
      userBranchId = memberRecords[0].branchId || branchId;
      
      // ✅ Validate adminId match - QR code's adminId must match member's adminId
      if (!memberAdminId) {
        return res.status(400).json({
          success: false,
          message: "Member adminId not found. Member must be added by an admin.",
        });
      }
      
      const qrAdminIdInt = parseInt(qrAdminId);
      const memberAdminIdInt = parseInt(memberAdminId);
      
      if (qrAdminIdInt !== memberAdminIdInt) {
        return res.status(400).json({
          success: false,
          message: "This QR code belongs to a different admin. You can only scan your admin's QR code.",
        });
      }
    } else {
      // Not a member, check if staff/user exists
      const [userRecords] = await pool.query(
        `SELECT u.*, r.name as roleName FROM user u 
         LEFT JOIN role r ON u.roleId = r.id 
         WHERE u.id = ?`,
        [memberId]
      );

      if (userRecords.length > 0) {
        const user = userRecords[0];
        const roleName = user.roleName?.toUpperCase() || '';
        
        // ❌ Block admin check-in - Admin cannot check-in themselves
        if (roleName === 'ADMIN' || roleName === 'SUPERADMIN') {
          return res.status(403).json({
            success: false,
            message: "Admin cannot check-in. Only staff (members, receptionists, trainers) can check-in using admin's QR code.",
          });
        }
        
        // For staff (receptionist, trainer, etc.), check their adminId
        // Staff members have adminId in user table
        let staffAdminId = user.adminId;
        
        // If adminId not in user table, check staff table
        if (!staffAdminId) {
          const [staffRecords] = await pool.query(
            "SELECT adminId FROM staff WHERE userId = ?",
            [memberId]
          );
          if (staffRecords.length > 0 && staffRecords[0].adminId) {
            staffAdminId = staffRecords[0].adminId;
          }
        }
        
        // ✅ Validate adminId match for staff
        if (!staffAdminId) {
          return res.status(400).json({
            success: false,
            message: "Staff adminId not found. Staff must be assigned to an admin.",
          });
        }
        
        const qrAdminIdInt = parseInt(qrAdminId);
        const staffAdminIdInt = parseInt(staffAdminId);
        
        if (qrAdminIdInt !== staffAdminIdInt) {
          return res.status(400).json({
            success: false,
            message: "This QR code belongs to a different admin. You can only scan your admin's QR code.",
          });
        }
        
        // Use user's branchId if not provided
        if (!userBranchId && user.branchId) {
          userBranchId = user.branchId;
        }
        // If still no branchId, use 1 as default
        if (!userBranchId) {
          userBranchId = 1;
        }
      } else {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
    }

    // 🔁 Prevent multiple open check-ins same day
    const [existing] = await pool.query(
      `
      SELECT id FROM memberattendance
      WHERE memberId = ?
        AND DATE(checkIn) = CURDATE()
        AND checkOut IS NULL
      `,
      [memberId]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: isMember ? "Member already checked in" : "Already checked in",
      });
    }

    // ✅ QR NONCE SECURITY CHECK
    if (mode === "QR" && nonce) {
      const [nonceCheck] = await pool.query(
        "SELECT * FROM used_qr_nonces WHERE nonce = ?",
        [nonce]
      );
      if (nonceCheck.length > 0) {
        return res.status(400).json({
          success: false,
          message: "This QR code has already been scanned. Please refresh your QR code.",
        });
      }
      
      // Save nonce to prevent reuse
      await pool.query(
        "INSERT INTO used_qr_nonces (nonce, createdAt) VALUES (?, NOW())",
        [nonce]
      );
    }

    // ✅ GPS LOCATION CHECK (if QR mode and branch has GPS set)
    if (mode === "QR" && latitude && longitude && userBranchId) {
      const [[branchData]] = await pool.query(
        "SELECT latitude, longitude, attendanceRadiusMeters FROM branch WHERE id = ?",
        [userBranchId]
      );

      if (branchData && branchData.latitude && branchData.longitude) {
        // Haversine formula to calculate distance in meters
        const R = 6371000; // Earth radius in meters
        const lat1 = parseFloat(branchData.latitude) * Math.PI / 180;
        const lat2 = parseFloat(latitude) * Math.PI / 180;
        const dLat = (parseFloat(latitude) - parseFloat(branchData.latitude)) * Math.PI / 180;
        const dLon = (parseFloat(longitude) - parseFloat(branchData.longitude)) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1) * Math.cos(lat2) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distanceMeters = R * c;
        const allowedRadius = branchData.attendanceRadiusMeters || 50;

        if (distanceMeters > allowedRadius) {
          return res.status(400).json({
            success: false,
            message: `❌ You are too far from the gym (${Math.round(distanceMeters)}m away). You must be within ${allowedRadius}m to mark attendance.`,
          });
        }
      }
    }

    // ✅ Get client IP address
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || null;

    // ✅ INSERT with GPS + Device data
    await pool.query(
      `
      INSERT INTO memberattendance
      (memberId, branchId, checkIn, checkOut, mode, status, notes, latitude, longitude, deviceId, ipAddress)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        memberId,
        userBranchId || null,
        finalCheckIn,
        finalCheckOut,
        mode || "QR",
        "In Gym",
        notes || null,
        latitude || null,
        longitude || null,
        deviceId || null,
        ipAddress || null,
      ]
    );

    res.json({
      success: true,
      message: isMember ? "Member checked in successfully" : "Checked in successfully",
    });
  } catch (err) {
    next(err);
  }
};


export const getAttendanceByMemberId = async (req, res, next) => {
  try {
    const memberId = req.params.memberId;

    if (!memberId) {
      return res.status(400).json({
        success: false,
        message: "memberId is required",
      });
    }

    // 📌 Fetch all attendance of this member or staff (latest first)
    const [rows] = await pool.query(
      `
      SELECT 
        id,
        memberId,
        staffId,
        branchId,
        checkIn,
        checkOut,
        createdAt,
        notes,
        status,
        mode
      FROM memberattendance
      WHERE memberId = ? 
         OR staffId = ? 
         OR memberId = (SELECT id FROM member WHERE userId = ? LIMIT 1)
         OR staffId = (SELECT id FROM staff WHERE userId = ? LIMIT 1)
      ORDER BY id DESC
      `,
      [memberId, memberId, memberId, memberId]
    );

    if (rows.length === 0) {
      return res.json({
        success: true,
        attendance: [],
      });
    }

    res.json({
      success: true,
      attendance: rows,
    });

  } catch (err) {
    next(err);
  }
};


/* -----------------------------------------------------
   2️⃣  MEMBER CHECK-OUT (Manual Checkout Time Supported)
------------------------------------------------------ */
export const memberCheckOut = async (req, res, next) => {
  try {
    const attendanceId = req.params.id; // /checkout/:id

    if (!attendanceId) {
      return res.status(400).json({
        success: false,
        message: "attendanceId is required in params",
      });
    }

    // 1️⃣ Check record exists
    const [existing] = await pool.query(
      `SELECT * FROM memberattendance WHERE id = ?`,
      [attendanceId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      });
    }

    const record = existing[0];

    // 2️⃣ Already checked out?
    if (record.checkOut !== null) {
      return res.status(400).json({
        success: false,
        message: "Member already checked out",
      });
    }

    // 3️⃣ Checkout time = now
    const finalCheckOut = new Date();

    // 4️⃣ Update checkout + status
    const [result] = await pool.query(
      `
      UPDATE memberattendance
      SET 
        checkOut = ?,
        status = 'Present'
      WHERE id = ?
      `,
      [finalCheckOut, attendanceId]
    );

    if (result.affectedRows === 0) {
      return res.status(500).json({
        success: false,
        message: "Checkout update failed",
      });
    }

    res.json({
      success: true,
      message: "Member checked out successfully",
      checkOut: finalCheckOut,
      status: "Present",
    });
  } catch (err) {
    next(err);
  }
};



/* -----------------------------------------------------
   3️⃣  DAILY ATTENDANCE LIST (Search + Filter + Status)
------------------------------------------------------ */
export const getDailyAttendance = async (req, res, next) => {
  try {
    const { date, search, branchId } = req.query;

    let sql = `
      SELECT 
        a.id,
        a.memberId,
        a.branchId,
        a.checkIn,
        a.checkOut,
        a.mode,
        a.status,
        a.notes,
        m.fullName,
        DATE(a.checkIn) AS attendanceDate
      FROM memberattendance a
      LEFT JOIN member m ON m.id = a.memberId
      WHERE 1=1
    `;

    const params = [];

    if (branchId) {
      sql += ` AND a.branchId = ?`;
      params.push(branchId);
    }

    if (date) {
      const mysqlDate = new Date(date).toISOString().slice(0, 10);
      sql += ` AND DATE(a.checkIn) = ?`;
      params.push(mysqlDate);
    }

    if (search) {
      sql += ` AND (m.fullName LIKE ? OR m.memberCode LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY a.checkIn DESC`;

    const [rows] = await pool.query(sql, params);

    const formatted = rows.map(r => ({
      ...r,
      computedStatus: r.checkOut ? "Completed" : "Active",
    }));

    res.json({
      success: true,
      attendance: formatted,
    });

  } catch (err) {
    next(err);
  }
};


/* -----------------------------------------------------
   4️⃣  ATTENDANCE DETAIL VIEW
------------------------------------------------------ */
export const attendanceDetail = async (req, res, next) => {
  try {
    const id = req.params.id;

    const [rows] = await pool.query(
      `
      SELECT 
        a.*, 
        m.fullName, 
        m.phone
      FROM memberattendance a
      LEFT JOIN member m ON a.memberId = m.id
      WHERE a.id = ?
      `,
      [id]
    );

    res.json({
      success: true,
      attendance: rows[0],
    });

  } catch (err) {
    next(err);
  }
};


/* -----------------------------------------------------
   5️⃣  TODAY SUMMARY (Dashboard Cards)
------------------------------------------------------ */
export const getTodaySummary = async (req, res, next) => {
  try {
    const [present] = await pool.query(
      `SELECT COUNT(*) AS count FROM memberattendance WHERE DATE(checkIn) = CURDATE()`
    );

    const [active] = await pool.query(
      `SELECT COUNT(*) AS count FROM memberattendance WHERE DATE(checkIn) = CURDATE() AND checkOut IS NULL`
    );

    const [completed] = await pool.query(
      `SELECT COUNT(*) AS count FROM memberattendance WHERE DATE(checkIn) = CURDATE() AND checkOut IS NOT NULL`
    );

    res.json({
      success: true,
      summary: {
        present: present[0].count,
        active: active[0].count,
        completed: completed[0].count,
      },
    });

  } catch (err) {
    next(err);
  }
};

export const deleteAttendance = async (req, res, next) => {
  try {
    const attendanceId = req.params.id;

    if (!attendanceId) {
      return res.status(400).json({
        success: false,
        message: "attendanceId is required",
      });
    }

    // Record exist karta hai?
    const [existing] = await pool.query(
      `SELECT id FROM memberattendance WHERE id = ?`,
      [attendanceId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      });
    }

    // Delete record
    const [result] = await pool.query(
      `DELETE FROM memberattendance WHERE id = ?`,
      [attendanceId]
    );

    if (result.affectedRows === 0) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete attendance",
      });
    }

    res.json({
      success: true,
      message: "Attendance deleted successfully",
    });

  } catch (err) {
    next(err);
  }
};
// export const getAttendanceByAdminId = async (req, res, next) => {
//   try {
//     const { adminId, date, search } = req.query;

//     if (!adminId) {
//       return res.status(400).json({
//         success: false,
//         message: "adminId is required",
//       });
//     }

//     let sql = `
//       SELECT
//         a.id,
//         DATE(a.checkIn) AS date,

//         /* NAME */
//         CASE
//           WHEN a.staffId IS NOT NULL THEN su.fullName
//           ELSE mu.fullName
//         END AS name,

//         /* ROLE */
//         CASE
//           WHEN a.staffId IS NOT NULL THEN sr.name
//           ELSE mr.name
//         END AS role,

//         a.checkIn,
//         a.checkOut,
//         a.mode,
//         sh.shiftType AS shift,
//         a.status

//       FROM memberattendance a

//       /* ===== STAFF ===== */
//       LEFT JOIN staff s ON s.id = a.staffId
//       LEFT JOIN user su ON su.id = s.userId
//       LEFT JOIN role sr ON sr.id = su.roleId

//       /* ===== MEMBER ===== */
//       LEFT JOIN member m ON m.userId= a.memberId
//       LEFT JOIN user mu ON mu.id = m.userId
//       LEFT JOIN role mr ON mr.id = mu.roleId

//       /* ===== SHIFT (STAFF ONLY) ===== */
//       LEFT JOIN shifts sh
//         ON sh.staffIds = a.staffId
//        AND DATE(sh.shiftDate) = DATE(a.checkIn)

//       /* ===== ADMIN FILTER (CORE LOGIC) ===== */
//       WHERE (
//         (a.staffId IS NOT NULL AND s.adminId = ?)
//         OR
//         (a.memberId IS NOT NULL AND m.adminId = ?)
//       )
//     `;

//     const params = [adminId, adminId];

//     if (date) {
//       sql += ` AND DATE(a.checkIn) = ?`;
//       params.push(date);
//     }

//     if (search) {
//       sql += `
//         AND (
//           su.fullName LIKE ?
//           OR mu.fullName LIKE ?
//         )
//       `;
//       params.push(`%${search}%`, `%${search}%`);
//     }

//     sql += ` ORDER BY a.checkIn DESC`;

//     const [rows] = await pool.query(sql, params);

//     res.json({
//       success: true,
//       attendance: rows,
//     });
//   } catch (err) {
//     next(err);
//   }
// }

// export const getAttendanceByAdminId = async (req, res, next) => {
//   try {
//     const { adminId } = req.query; // Only adminId is coming from the request

//     if (!adminId) {
//       return res.status(400).json({
//         success: false,
//         message: "adminId is required",
//       });
//     }

//     // SQL query to get attendance records based on adminId
//     let sql = `
//       SELECT
//         a.id,
//         DATE(a.checkIn) AS date,
//         mu.fullName AS name,  -- Member's full name
//         mr.name AS role,      -- Member's role from the role table
//         a.checkIn,
//         a.checkOut,
//         a.mode,
//         NULL AS shift,        -- No shift in this case, so null
//         a.status

//       FROM memberattendance a

//       /* ===== MEMBER JOIN ===== */
//       LEFT JOIN member m ON m.userId = a.memberId
//       LEFT JOIN user mu ON mu.id = m.userId
//       LEFT JOIN role mr ON mr.id = mu.roleId  -- Getting role name

//       /* ===== FILTER BASED ON adminId IN MEMBER TABLE ===== */
//       WHERE m.adminId = ?  -- Ensuring that the adminId in the member table matches
//     `;

//     const params = [adminId];  // Only passing adminId as a parameter

//     // Execute the query with parameters
//     const [rows] = await pool.query(sql, params);

//     res.json({
//       success: true,
//       attendance: rows, // Returning the attendance data
//     });
//   } catch (err) {
//     next(err);  // Handling errors
//   }
// };


export const getAttendanceByAdminId = async (req, res, next) => {
  try {
    const {
      adminId,
      date,
      startDate,
      endDate,
      branchId,
      role,
      status,
      staffId,
      search,
      category = "staff", // Default to 'staff' attendance
    } = req.query;

    if (!adminId) {
      return res.status(400).json({
        success: false,
        message: "adminId is required",
      });
    }

    // 1️⃣ Fetch active personnel filtered by category ('staff', 'member', 'all')
    let staffSql = "";
    let staffParams = [];

    if (category.toLowerCase() === "member") {
      staffSql = `
        SELECT DISTINCT
          u.id AS userId,
          IFNULL(m.id, u.id) AS staffId,
          u.fullName AS name,
          IFNULL(r.name, 'Member') AS role,
          u.branchId,
          b.name AS branchName
        FROM user u
        LEFT JOIN member m ON m.userId = u.id
        LEFT JOIN role r ON r.id = u.roleId
        LEFT JOIN branch b ON b.id = u.branchId
        WHERE (u.adminId = ? OR m.adminId = ?)
          AND u.roleId != 1
          AND (LOWER(IFNULL(r.name, '')) = 'member' OR EXISTS (SELECT 1 FROM member m2 WHERE m2.userId = u.id))
      `;
      staffParams = [adminId, adminId];
    } else if (category.toLowerCase() === "all") {
      staffSql = `
        SELECT DISTINCT
          u.id AS userId,
          COALESCE(s.id, m.id, u.id) AS staffId,
          u.fullName AS name,
          r.name AS role,
          u.branchId,
          b.name AS branchName
        FROM user u
        LEFT JOIN staff s ON s.userId = u.id
        LEFT JOIN member m ON m.userId = u.id
        LEFT JOIN role r ON r.id = u.roleId
        LEFT JOIN branch b ON b.id = u.branchId
        WHERE (u.adminId = ? OR s.adminId = ? OR m.adminId = ?)
          AND u.roleId != 1
      `;
      staffParams = [adminId, adminId, adminId];
    } else {
      // Default: 'staff' only (excludes gym members)
      staffSql = `
        SELECT DISTINCT
          u.id AS userId,
          IFNULL(s.id, u.id) AS staffId,
          u.fullName AS name,
          r.name AS role,
          u.branchId,
          b.name AS branchName
        FROM user u
        LEFT JOIN staff s ON s.userId = u.id
        LEFT JOIN role r ON r.id = u.roleId
        LEFT JOIN branch b ON b.id = u.branchId
        WHERE (u.adminId = ? OR s.adminId = ?)
          AND u.roleId != 1
          AND LOWER(IFNULL(r.name, '')) != 'member'
          AND NOT EXISTS (SELECT 1 FROM member m WHERE m.userId = u.id)
      `;
      staffParams = [adminId, adminId];
    }

    if (branchId && branchId !== "All") {
      staffSql += ` AND u.branchId = ?`;
      staffParams.push(branchId);
    }

    const [staffList] = await pool.query(staffSql, staffParams);

    // 2️⃣ Determine date list
    const dateList = [];
    const todayStr = new Date().toISOString().split("T")[0];

    if (date) {
      dateList.push(date.split("T")[0]);
    } else if (startDate && endDate) {
      let curr = new Date(startDate);
      const end = new Date(endDate);
      let count = 0;
      while (curr <= end && count < 62) {
        const dStr = curr.toISOString().split("T")[0];
        if (dStr <= todayStr) {
          dateList.push(dStr);
        }
        curr.setDate(curr.getDate() + 1);
        count++;
      }
      dateList.reverse(); // Most recent first
    } else {
      dateList.push(todayStr);
    }

    if (staffList.length === 0 || dateList.length === 0) {
      return res.json({ success: true, attendance: [] });
    }

    const targetIds = staffList.map((s) => s.staffId).filter(Boolean);
    const userIds = staffList.map((s) => s.userId).filter(Boolean);

    // 3️⃣ Fetch actual attendance events from event log table
    let attendanceRows = [];
    if (targetIds.length > 0) {
      if (category.toLowerCase() === "member") {
        [attendanceRows] = await pool.query(
          `
          SELECT 
            a.id,
            a.memberId,
            a.staffId,
            DATE_FORMAT(a.checkIn, '%Y-%m-%d') AS date,
            a.checkIn,
            a.checkOut,
            a.mode,
            a.status,
            a.notes
          FROM memberattendance a
          WHERE a.memberId IN (?)
            AND DATE(a.checkIn) IN (?)
          ORDER BY a.checkIn DESC
        `,
          [targetIds, dateList]
        );
      } else if (category.toLowerCase() === "all") {
        [attendanceRows] = await pool.query(
          `
          SELECT 
            a.id,
            a.memberId,
            a.staffId,
            DATE_FORMAT(a.checkIn, '%Y-%m-%d') AS date,
            a.checkIn,
            a.checkOut,
            a.mode,
            a.status,
            a.notes
          FROM memberattendance a
          WHERE (a.memberId IN (?) OR a.staffId IN (?))
            AND DATE(a.checkIn) IN (?)
          ORDER BY a.checkIn DESC
        `,
          [targetIds, targetIds, dateList]
        );
      } else {
        // staff
        [attendanceRows] = await pool.query(
          `
          SELECT 
            a.id,
            a.memberId,
            a.staffId,
            DATE_FORMAT(a.checkIn, '%Y-%m-%d') AS date,
            a.checkIn,
            a.checkOut,
            a.mode,
            a.status,
            a.notes
          FROM memberattendance a
          WHERE a.staffId IN (?)
            AND DATE(a.checkIn) IN (?)
          ORDER BY a.checkIn DESC
        `,
          [targetIds, dateList]
        );
      }
    }

    const attendanceMap = new Map();
    for (const row of attendanceRows) {
      const matchId = category.toLowerCase() === "member" ? row.memberId : (row.staffId || row.memberId);
      const key = `${matchId}_${row.date}`;
      if (!attendanceMap.has(key)) {
        attendanceMap.set(key, row);
      }
    }

    // 4️⃣ Derive status dynamically (LEFT JOIN business logic)
    const result = [];
    for (const dStr of dateList) {
      const dayOfWeek = new Date(dStr + "T00:00:00").getDay(); // 0 = Sunday
      for (const s of staffList) {
        const matchId = category.toLowerCase() === "member" ? s.staffId : (s.staffId || s.userId);
        const key = `${matchId}_${dStr}`;
        const att = attendanceMap.get(key);

        if (att) {
          let computedStatus = att.status || "Present";
          if (att.checkIn) {
            const checkInDate = new Date(att.checkIn);
            const hours = checkInDate.getHours();
            const minutes = checkInDate.getMinutes();
            // Configurable/default shift start 09:00 AM + 15m grace -> 09:15
            if (hours > 9 || (hours === 9 && minutes > 15)) {
              computedStatus = "Late";
            } else if (!att.checkOut) {
              computedStatus = "In Gym";
            } else {
              computedStatus = "Present";
            }
          }

          result.push({
            id: att.id,
            memberId: s.userId,
            staffId: s.staffId || s.userId,
            name: s.name || "Unknown",
            role: s.role || "Staff",
            branch: s.branchName || "Main Branch",
            date: dStr,
            checkIn: att.checkIn,
            checkOut: att.checkOut,
            mode: att.mode || "QR",
            status: computedStatus,
            notes: att.notes || "",
          });
        } else {
          let computedStatus = "Absent";
          if (dayOfWeek === 0) {
            computedStatus = "Weekly Off";
          }
          result.push({
            id: `absent-${s.userId}-${dStr}`,
            memberId: s.userId,
            staffId: s.staffId || s.userId,
            name: s.name || "Unknown",
            role: s.role || "Staff",
            branch: s.branchName || "Main Branch",
            date: dStr,
            checkIn: null,
            checkOut: null,
            mode: "-",
            status: computedStatus,
            notes: computedStatus === "Weekly Off" ? "Weekly Off Day" : "Absent",
          });
        }
      }
    }

    // 5️⃣ Apply optional query filters
    let finalResult = result;
    if (role && role !== "All") {
      finalResult = finalResult.filter(
        (r) => (r.role || "").toLowerCase() === role.toLowerCase()
      );
    }
    if (status && status !== "All") {
      finalResult = finalResult.filter(
        (r) => (r.status || "").toLowerCase() === status.toLowerCase()
      );
    }
    if (staffId && staffId !== "All") {
      finalResult = finalResult.filter(
        (r) =>
          String(r.staffId) === String(staffId) ||
          String(r.memberId) === String(staffId)
      );
    }
    if (search && search.trim() !== "") {
      const q = search.toLowerCase().trim();
      finalResult = finalResult.filter(
        (r) =>
          (r.name && r.name.toLowerCase().includes(q)) ||
          (r.role && r.role.toLowerCase().includes(q))
      );
    }

    res.json({
      success: true,
      attendance: finalResult,
    });
  } catch (err) {
    next(err);
  }
};
