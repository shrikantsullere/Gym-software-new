import { pool } from "../../config/db.js";

// ➤ Create Session
// export const createSessionService = async (data) => {
//   const { sessionName, trainerId, branchId, date, time, duration, description, status } = data;

//   const [result] = await pool.query(
//     `INSERT INTO session 
//      (sessionName, trainerId, branchId, date, time, duration, description, status)
//      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
//     [sessionName, Number(trainerId), Number(branchId), new Date(date), time, Number(duration), description, status || "Upcoming"]
//   );

//   const sessionId = result.insertId;
//   const [session] = await pool.query(`SELECT * FROM session WHERE id = ?`, [sessionId]);
//   return session[0];
// };
export const createSessionService = async (data) => {
  const {
    sessionName,
    trainerId,
    adminId,      // ✅ REQUIRED
    date,
    time,
    duration,
    description,
    status,
    capacity
  } = data;

  if (!adminId) {
    throw { status: 400, message: "adminId is required" };
  }

  

  const [result] = await pool.query(
    `INSERT INTO session 
     (sessionName, trainerId, adminId, date, time, duration, description, status, capacity)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      sessionName,
      Number(trainerId),
      Number(adminId),
      date,
      time,
      Number(duration),
      description || null,
      status || "Upcoming",
      capacity ? Number(capacity) : 20
    ]
  );
  

  const sessionId = result.insertId;

  const [session] = await pool.query(
    `SELECT * FROM session WHERE id = ?`,
    [sessionId]
  );

  return session[0];
};
export const listSessionsService = async ({ adminId, trainerId, search }) => {
  if (!adminId && !trainerId) {
    throw {
      status: 400,
      message: "adminId or trainerId is required",
    };
  }

  let conditions = [];
  let values = [];

  if (adminId) {
    conditions.push("s.adminId = ?");
    values.push(adminId);
  }

  if (trainerId) {
    conditions.push("s.trainerId = ?");
    values.push(trainerId);
  }

  // 🔍 Search
  conditions.push("s.sessionName LIKE ?");
  values.push(`%${search || ""}%`);

  const whereClause = conditions.join(" AND ");

  const [rows] = await pool.query(
    `
    SELECT 
      s.*,
      t.id AS trainerId,
      t.fullName AS trainerName,
      (SELECT COUNT(*) FROM unified_bookings ub WHERE ub.sessionId = s.id AND ub.bookingStatus != 'Cancelled') AS joinedCount
    FROM session s
    LEFT JOIN user t ON s.trainerId = t.id
    WHERE ${whereClause}
    ORDER BY 
      FIELD(s.status, 'Upcoming', 'Ongoing', 'Completed') ASC,
      s.date ASC,
      s.time ASC
    `,
    values
  );

  return rows;
};


// ➤ Update complete session
export const updateSessionService = async (sessionId, data) => {
  const { sessionName, trainerId, branchId, date, time, duration, description, status, capacity } = data;

  await pool.query(
    `UPDATE session 
     SET sessionName = ?, trainerId = ?, branchId = ?, date = ?, time = ?, duration = ?, description = ?, status = ?, capacity = ?
     WHERE id = ?`,
    [sessionName, Number(trainerId), Number(branchId), new Date(date), time, Number(duration), description, status, capacity ? Number(capacity) : 20, sessionId]
  );

  const [updated] = await pool.query(`SELECT * FROM session WHERE id = ?`, [sessionId]);
  return updated[0];
};

// ➤ Update only status
export const updateSessionStatusService = async (sessionId, status) => {
  await pool.query(`UPDATE session SET status = ? WHERE id = ?`, [status, sessionId]);
  const [updated] = await pool.query(`SELECT * FROM session WHERE id = ?`, [sessionId]);
  return updated[0];
};

// ➤ Delete session
export const deleteSessionService = async (sessionId) => {
  await pool.query(`DELETE FROM pt_bookings WHERE sessionId = ?`, [sessionId]);
  await pool.query(`DELETE FROM unified_bookings WHERE sessionId = ?`, [sessionId]);
  await pool.query(`DELETE FROM session WHERE id = ?`, [sessionId]);
  return true;
};

// ➤ Get Sessions for Member
export const getMemberSessionsService = async (memberId) => {
  // First get the member's adminId
  const [memberRows] = await pool.query(`SELECT adminId FROM member WHERE id = ?`, [memberId]);
  if (!memberRows.length) throw { status: 404, message: "Member not found" };
  const adminId = memberRows[0].adminId;

  // List upcoming sessions for this admin, and compute joined count and isJoined boolean
  const [sessions] = await pool.query(
    `SELECT 
      s.*,
      t.fullName AS trainerName,
      (SELECT COUNT(*) FROM unified_bookings ub WHERE ub.sessionId = s.id AND ub.bookingStatus != 'Cancelled') AS joinedCount,
      (SELECT COUNT(*) > 0 FROM unified_bookings ub2 WHERE ub2.sessionId = s.id AND ub2.memberId = ? AND ub2.bookingStatus != 'Cancelled') AS isJoined
     FROM session s
     LEFT JOIN user t ON s.trainerId = t.id
     WHERE s.adminId = ? AND s.status = 'Upcoming'
     ORDER BY s.date ASC, s.time ASC`,
    [memberId, adminId]
  );

  return sessions;
};

// ➤ Join Session (Member)
export const joinSessionService = async (memberId, sessionId) => {
  // Check session exists and get capacity
  const [sessionRows] = await pool.query(`SELECT * FROM session WHERE id = ?`, [sessionId]);
  if (!sessionRows.length) throw { status: 404, message: "Session not found" };
  const session = sessionRows[0];

  // Check if already joined
  const [existing] = await pool.query(
    `SELECT id FROM unified_bookings WHERE sessionId = ? AND memberId = ? AND bookingStatus != 'Cancelled'`,
    [sessionId, memberId]
  );
  if (existing.length > 0) throw { status: 400, message: "You have already joined this session" };

  // Check capacity
  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS count FROM unified_bookings WHERE sessionId = ? AND bookingStatus != 'Cancelled'`,
    [sessionId]
  );
  const currentCount = countRows[0].count;
  if (currentCount >= (session.capacity || 20)) {
    throw { status: 400, message: "Session is full" };
  }

  // Join the session
  await pool.query(
    `INSERT INTO unified_bookings 
     (memberId, trainerId, sessionId, date, startTime, endTime, bookingType, bookingStatus, paymentStatus, branchId)
     VALUES (?, ?, ?, ?, ?, ?, 'GROUP', 'Booked', 'Pending', ?)`,
    [memberId, session.trainerId, sessionId, session.date, session.time, null, session.branchId || null]
  );

  return { message: "Successfully joined session" };
};

// ➤ Get members joined in a session
export const getSessionMembersService = async (sessionId) => {
  const [members] = await pool.query(
    `SELECT 
      m.id, m.fullName, m.phone, m.email, ub.bookingStatus, ub.createdAt
     FROM unified_bookings ub
     JOIN member m ON ub.memberId = m.id
     WHERE ub.sessionId = ? AND ub.bookingStatus != 'Cancelled'
     ORDER BY ub.createdAt DESC`,
    [sessionId]
  );
  return members;
};

