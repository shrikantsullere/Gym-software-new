import { pool } from "../config/db.js";
import { getIO, emitToUser } from "../config/socket.js";

export const sendAppNotification = async (to, message) => {
  try {
    const [result] = await pool.query(
      `INSERT INTO notificationlog (type, \`to\`, message, status) VALUES ('IN-APP', ?, ?, 'UNREAD')`,
      [to.toString(), message]
    );
    
    const io = getIO();
    if (io) {
      const payload = {
        id: result.insertId,
        type: "IN-APP",
        message: message,
        createdAt: new Date().toISOString()
      };
      
      if (to === "all") {
        io.emit("new_notification", payload);
      } else {
        emitToUser(to, "new_notification", payload);
      }
    }
  } catch (err) {
    console.error("Failed to send app notification:", err);
  }
};
