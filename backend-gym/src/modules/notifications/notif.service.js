import { pool } from "../../config/db.js"; // make sure it's a mysql2/promise pool
import nodemailer from "nodemailer";
import { dispatchNotification } from "../../utils/notificationDispatcher.js";

/**
 * Send notification using MySQL pool
 * @param {Object} params
 * @param {"EMAIL"|"WHATSAPP"|"SMS"} params.type
 * @param {string} params.to
 * @param {string} params.message
 * @param {number} [params.memberId]
 */
export const sendNotificationService = async ({ type, to, message, memberId }) => {
  // Log notification with PENDING status
  const [logResult] = await pool.query(
    `INSERT INTO notificationLog (type, \`to\`, message, memberId, status)
     VALUES (?, ?, ?, ?, ?)`,
    [type, to, message, memberId || null, "PENDING"]
  );
  const logId = logResult.insertId;

  try {
    if (type === "EMAIL") {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });

      await transporter.sendMail({
        from: process.env.MAIL_FROM,
        to,
        subject: "Gym Notification",
        text: message,
      });

      // Update log as SENT
      await pool.query(
        `UPDATE notificationLog SET status = ? WHERE id = ?`,
        ["SENT", logId]
      );
    }

    // WHATSAPP / SMS placeholders
    // if (type === "WHATSAPP") { ... }
    // if (type === "SMS") { ... }

    return { id: logId, type, to, message, memberId, status: "SENT" };
  } catch (err) {
    // Update log as FAILED
    await pool.query(
      `UPDATE notificationLog SET status = ?, error = ? WHERE id = ?`,
      ["FAILED", err.message, logId]
    );
    throw new Error("Notification sending failed: " + err.message);
  }
};

export const getUserNotificationsService = async (userId) => {
  const [rows] = await pool.query(
    `SELECT * FROM notificationlog 
     WHERE \`to\` = ? AND type = 'IN-APP' AND status = 'UNREAD'
     ORDER BY createdAt DESC LIMIT 20`,
    [userId.toString()]
  );
  return rows;
};

export const markAsReadService = async (id) => {
  await pool.query(
    `UPDATE notificationlog SET status = 'READ' WHERE id = ?`,
    [id]
  );
  return true;
};

// --- Broadcast Services for Super Admin ---

export const broadcastAnnouncementService = async ({
  subject,
  message,
  channels,
  targetRoles,
  sentBy,
  imageUrl
}) => {
  // 1. Fetch target users who are active and match target roles
  const [users] = await pool.query(
    `SELECT id, fullName, email, phone 
     FROM user 
     WHERE roleId IN (?) AND status = 'Active'`,
    [targetRoles]
  );

  console.log(`📣 Broadcasting announcement to ${users.length} target users...`);

  // 2. Save announcement to history table
  await pool.query(
    `INSERT INTO announcement (subject, message, channels, targetRoles, sentBy, imageUrl) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      subject,
      message,
      JSON.stringify(channels),
      JSON.stringify(targetRoles),
      sentBy || null,
      imageUrl || null
    ]
  );

  let successCount = 0;
  let failCount = 0;

  // 3. Dispatch notifications asynchronously for each target user
  for (const user of users) {
    try {
      dispatchNotification({
        category: "announcement",
        toEmail: user.email,
        toPhone: user.phone,
        toUserId: user.id,
        subject,
        message: imageUrl ? `${message}\n\n📎 Attachment: ${imageUrl}` : message,
        customChannels: channels
      }).catch(err => console.error(`❌ Async dispatch error for user ${user.id}:`, err.message));
      
      successCount++;
    } catch (err) {
      console.error(`❌ Failed to initiate broadcast for user ${user.id}:`, err.message);
      failCount++;
    }
  }

  return {
    totalTargeted: users.length,
    successCount,
    failCount
  };
};

export const getBroadcastHistoryService = async () => {
  const [rows] = await pool.query(
    `SELECT a.*, u.fullName AS senderName 
     FROM announcement a
     LEFT JOIN user u ON u.id = a.sentBy
     ORDER BY a.id DESC`
  );
  
  return rows.map(r => ({
    ...r,
    channels: JSON.parse(r.channels),
    targetRoles: JSON.parse(r.targetRoles)
  }));
};

// --- Broadcast Services for Admin ---

export const adminBroadcastAnnouncementService = async ({
  subject,
  message,
  channels,
  targetAudience, // ["MEMBERS", "STAFF"]
  sentBy,
  branchId,
  adminId,
  imageUrl
}) => {
  let targetUsers = [];

  if (targetAudience.includes("MEMBERS")) {
    const query = `SELECT id, userId, fullName, email, phone FROM member WHERE status = 'Active' AND adminId = ?`;
    const params = [adminId];

    const [members] = await pool.query(query, params);
    // map to standard user structure, mapping id to userId so notification target is correct
    targetUsers = [...targetUsers, ...members.map(m => ({ ...m, id: m.userId, role: "MEMBER" }))];
  }

  if (targetAudience.includes("STAFF")) {
    const query = `SELECT id, fullName, email, phone FROM user WHERE status = 'Active' AND adminId = ? AND roleId NOT IN (1, 2, 9)`;
    const params = [adminId];

    const [staff] = await pool.query(query, params);
    targetUsers = [...targetUsers, ...staff.map(s => ({ ...s, role: "STAFF" }))];
  }

  console.log(`📣 Broadcasting admin announcement to ${targetUsers.length} users in branch ${branchId || 'All'}...`);

  // Save announcement to history
  await pool.query(
    `INSERT INTO announcement (subject, message, channels, targetRoles, sentBy, branchId, adminId, imageUrl) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      subject,
      message,
      JSON.stringify(channels),
      JSON.stringify(targetAudience),
      sentBy || null,
      branchId || null,
      adminId,
      imageUrl || null
    ]
  );

  let successCount = 0;
  let failCount = 0;

  for (const user of targetUsers) {
    try {
      dispatchNotification({
        category: "announcement",
        toEmail: user.email,
        toPhone: user.phone,
        toUserId: user.id,
        subject,
        message: imageUrl ? `${message}\n\n📎 Attachment: ${imageUrl}` : message,
        customChannels: channels
      }).catch(err => console.error(`❌ Async dispatch error:`, err.message));
      
      successCount++;
    } catch (err) {
      failCount++;
    }
  }

  return { totalTargeted: targetUsers.length, successCount, failCount };
};

export const getAdminBroadcastHistoryService = async (adminId) => {
  const [rows] = await pool.query(
    `SELECT a.*, u.fullName AS senderName 
     FROM announcement a
     LEFT JOIN user u ON u.id = a.sentBy
     WHERE a.adminId = ?
     ORDER BY a.id DESC`,
    [adminId]
  );
  
  return rows.map(r => {
    let parsedRoles = [];
    try {
      parsedRoles = r.targetRoles ? JSON.parse(r.targetRoles) : [];
    } catch (e) {
      parsedRoles = [];
    }
    return {
      ...r,
      channels: JSON.parse(r.channels),
      targetRoles: parsedRoles
    };
  });
};

export const getUserAnnouncementsService = async (adminId, branchId, roleGroup) => {
  let query = "";
  let params = [];
  
  if (roleGroup === 'ADMIN') {
    // Admins see their own announcements AND system-wide superadmin announcements
    query = `
       SELECT a.*, u.fullName AS senderName 
       FROM announcement a
       LEFT JOIN user u ON u.id = a.sentBy
       WHERE a.adminId = ? OR (a.adminId IS NULL AND a.sentBy IN (SELECT id FROM user WHERE roleId = 1))
       ORDER BY a.createdAt DESC
    `;
    params = [adminId];
  } else {
    // Members and staff see only their own gym's announcements
    query = `
       SELECT a.*, u.fullName AS senderName 
       FROM announcement a
       LEFT JOIN user u ON u.id = a.sentBy
       WHERE a.adminId = ?
       ORDER BY a.createdAt DESC
    `;
    params = [adminId];
  }

  const [rows] = await pool.query(query, params);
  
  const announcements = rows.map(r => {
    let parsedRoles = [];
    try {
      parsedRoles = r.targetRoles ? JSON.parse(r.targetRoles) : [];
    } catch (e) {
      parsedRoles = [];
    }
    return {
      ...r,
      channels: JSON.parse(r.channels),
      targetRoles: parsedRoles
    };
  });

  if (roleGroup === 'ADMIN') {
    // Filter to own announcements OR superadmin announcements targeting Admins (roleId 2)
    return announcements.filter(a => a.adminId === adminId || a.targetRoles.includes(2) || a.targetRoles.includes("2"));
  } else {
    // Filter to roleGroup (MEMBERS or STAFF)
    return announcements.filter(a => a.targetRoles.includes(roleGroup));
  }
};

// ─────────────────────────────────────────────────────────
// Personal Notification: Admin → Individual Member
// ─────────────────────────────────────────────────────────
export const sendPersonalNotificationService = async ({ memberId, memberUserId, category, message, sentBy }) => {
  // 1. Save to notificationlog (this is what the Bell Icon reads)
  const notifMessage = `[${category}] ${message}`;
  
  // Get member info for email/whatsapp (optional future use)
  const [memberRows] = await pool.query(
    `SELECT id, fullName, email, phone FROM member WHERE id = ?`, 
    [memberId]
  );

  if (!memberRows.length) {
    throw new Error("Member not found");
  }

  // 2. Insert into notificationlog for Bell Icon
  await pool.query(
    `INSERT INTO notificationlog (type, \`to\`, message, memberId, status, createdAt)
     VALUES (?, ?, ?, ?, ?, NOW())`,
    ["APP_PUSH", memberRows[0].email || "member", notifMessage, memberId, "SENT"]
  );

  // 3. Also log in personal_notifications table for history
  await pool.query(
    `INSERT INTO personal_notification (memberId, category, message, sentBy, createdAt)
     VALUES (?, ?, ?, ?, NOW())`,
    [memberId, category, message, sentBy]
  );

  return {
    success: true,
    memberName: memberRows[0].fullName,
    category,
    message
  };
};

export const getPersonalNotifHistoryService = async (adminId) => {
  const [rows] = await pool.query(
    `SELECT pn.*, m.fullName AS memberName
     FROM personal_notification pn
     LEFT JOIN member m ON m.id = pn.memberId
     WHERE pn.sentBy IN (SELECT id FROM user WHERE adminId = ? OR id = ?)
     ORDER BY pn.createdAt DESC
     LIMIT 50`,
    [adminId, adminId]
  );
  return rows;
};
export const deleteAnnouncementService = async (id, adminId) => {
  if (adminId) {
    const [existing] = await pool.query(
      "SELECT id FROM announcement WHERE id = ? AND adminId = ?",
      [id, adminId]
    );
    if (!existing.length) {
      throw { status: 403, message: "Unauthorized to delete this announcement or announcement not found." };
    }
  }

  await pool.query("DELETE FROM announcement WHERE id = ?", [id]);
  return true;
};
