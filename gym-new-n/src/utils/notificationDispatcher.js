import { pool } from "../config/db.js";
import nodemailer from "nodemailer";
import { sendWhatsAppMessage } from "./whatsappHelper.js";

/**
 * Get active channels for a notification category
 * @param {string} category - "welcome_note" | "invoice" | "templates"
 * @returns {Promise<string[]>} Array of enabled channels, e.g. ["EMAIL", "WHATSAPP"]
 */
export const getGlobalNotificationChannels = async (category) => {
  try {
    const keyName = category + "_channel";
    const [rows] = await pool.query(
      "SELECT value_data FROM global_settings WHERE key_name = ?",
      [keyName]
    );

    if (rows.length === 0) {
      return ["EMAIL"]; // fallback default
    }

    return JSON.parse(rows[0].value_data);
  } catch (err) {
    console.error("Error reading global notification settings for " + category + ":", err.message);
    return ["EMAIL"]; // fallback default on error
  }
};

/**
 * Smart Notification Dispatcher
 * Dispatches notifications to active channels set by the Super Admin
 */
export const dispatchNotification = async ({
  category,
  toEmail,
  toPhone,
  toUserId,
  memberId,
  subject = "Gym Alert",
  message,
  customChannels, // Support manual channels selection (e.g. for broadcasts)
  adminIdForCredits = null, // Optional: specifically pass the adminId to deduct credits from
}) => {
  if (!message) {
    console.warn("⚠️ Notification Dispatcher: Message is empty. Skipping dispatch.");
    return { success: false, reason: "Message is empty" };
  }

  const activeChannels = customChannels || await getGlobalNotificationChannels(category);
  console.log("📣 Dispatching '" + category + "' notification. Active channels:", activeChannels);

  const results = {
    category,
    channels: activeChannels,
    email: null,
    whatsapp: null,
    inApp: null,
  };

  // 1. Send Email Notification
  if (activeChannels.includes("EMAIL") && toEmail) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });

      await transporter.sendMail({
        from: process.env.MAIL_FROM || "no-reply@gym.com",
        to: toEmail,
        subject,
        text: message,
      });

      await pool.query(
        "INSERT INTO notificationLog (type, `to`, message, memberId, status) VALUES (?, ?, ?, ?, ?)",
        ["EMAIL", toEmail, message, memberId || null, "SENT"]
      );

      results.email = { success: true };
      console.log("✉️ Email notification sent to " + toEmail);
    } catch (err) {
      console.error("❌ Email notification failed for " + toEmail + ":", err.message);
      results.email = { success: false, error: err.message };
      try {
        await pool.query(
          "INSERT INTO notificationLog (type, `to`, message, memberId, status) VALUES (?, ?, ?, ?, ?)",
          ["EMAIL", toEmail, message, memberId || null, "FAILED"]
        );
      } catch (e) {
        console.error("Failed to log email failure to DB:", e.message);
      }
    }
  }

  // 2. Send WhatsApp Notification
  let fallbackToAppPush = false;

  if (activeChannels.includes("WHATSAPP") && toPhone) {
    try {
      // 2a. Determine the Admin ID to check credits
      let adminId = adminIdForCredits;
      if (!adminId && memberId) {
        const [memRows] = await pool.query("SELECT adminId FROM member WHERE id = ?", [memberId]);
        if (memRows.length > 0) adminId = memRows[0].adminId;
      }
      if (!adminId && toUserId) {
        const [uRows] = await pool.query("SELECT adminId, roleId, id FROM user WHERE id = ?", [toUserId]);
        if (uRows.length > 0) {
          adminId = uRows[0].roleId === 2 ? uRows[0].id : uRows[0].adminId;
        }
      }

      if (adminId) {
        // 2b. Check credits
        const [uRows] = await pool.query("SELECT whatsappCredits FROM user WHERE id = ?", [adminId]);
        let credits = uRows[0]?.whatsappCredits || 0;

        if (credits > 0) {
          const cleanPhone = toPhone.trim().replace("+", "");
          const isSent = await sendWhatsAppMessage(cleanPhone, message);

          if (isSent) {
            // Deduct credit
            await pool.query("UPDATE user SET whatsappCredits = whatsappCredits - 1 WHERE id = ?", [adminId]);
            credits -= 1;

            // Log to transactions
            await pool.query(
              "INSERT INTO whatsapp_credit_transactions (userId, creditsUsed, transactionType, description) VALUES (?, 1, 'USAGE', ?)",
              [adminId, "Sent WhatsApp to " + cleanPhone]
            );

            // Check Low Credit Threshold
            const [autoRows] = await pool.query("SELECT lowCreditThreshold FROM automation_settings LIMIT 1");
            const threshold = autoRows[0]?.lowCreditThreshold || 50;

            if (credits <= threshold) {
              await pool.query(
                "INSERT INTO notificationLog (type, `to`, message, status) VALUES (?, ?, ?, ?)",
                ["IN-APP", adminId.toString(), "⚠️ Low Credit Alert: You have only " + credits + " WhatsApp credits remaining. Please recharge soon.", "UNREAD"]
              );
            }
          }

          // Log in notificationlog table
          await pool.query(
            "INSERT INTO notificationLog (type, `to`, message, memberId, status) VALUES (?, ?, ?, ?, ?)",
            ["WHATSAPP", cleanPhone, message, memberId || null, isSent ? "SENT" : "FAILED"]
          );

          results.whatsapp = { success: isSent };
          console.log("💬 WhatsApp notification triggered to " + cleanPhone + " (Status: " + (isSent ? "Sent" : "Failed") + ")");
        } else {
          console.warn("⚠️ WhatsApp credits exhausted for Admin " + adminId + ". Falling back to App Push.");
          fallbackToAppPush = true;
          results.whatsapp = { success: false, reason: "Insufficient Credits" };
        }
      } else {
        console.warn("⚠️ Could not determine Admin ID for WhatsApp credit deduction. Skipping WhatsApp.");
      }
    } catch (err) {
      console.error("❌ WhatsApp notification failed for " + toPhone + ":", err.message);
      results.whatsapp = { success: false, error: err.message };
    }
  }

  // 3. Send In-App / App Push Notification
  if ((activeChannels.includes("APP_PUSH") || fallbackToAppPush) && toUserId) {
    try {
      await pool.query(
        "INSERT INTO notificationLog (type, `to`, message, memberId, status) VALUES (?, ?, ?, ?, ?)",
        ["IN-APP", toUserId.toString(), message, memberId || null, "UNREAD"]
      );

      results.inApp = { success: true };
      console.log("📱 App Push/In-App notification logged for User ID " + toUserId);
    } catch (err) {
      console.error("❌ App Push notification failed for User ID " + toUserId + ":", err.message);
      results.inApp = { success: false, error: err.message };
    }
  }

  return { success: true, results };
};
