import { Router } from "express";
import { verifyToken } from "../../middlewares/auth.js";
import { 
  sendNotification, 
  getUserNotifications, 
  markAsRead,
  broadcastAnnouncement,
  getBroadcastHistory,
  adminBroadcastAnnouncement,
  getAdminBroadcastHistory,
  getUserAnnouncements,
  sendPersonalNotification,
  getPersonalHistory,
  deleteAnnouncement
} from "./notif.controller.js";

const router = Router();

router.post(
  "/send",
  verifyToken(["Admin", "Superadmin", "Staff"]),
  sendNotification
);

router.get(
  "/user/:userId",
  getUserNotifications
);

router.put(
  "/read/:id",
  markAsRead
);

// --- Broadcast Routes for Super Admin ---
router.post(
  "/broadcast",
  verifyToken(["Superadmin", "Subadmin"]),
  broadcastAnnouncement
);

router.get(
  "/broadcast/history",
  verifyToken(["Superadmin", "Subadmin"]),
  getBroadcastHistory
);

// --- Broadcast Routes for Admin / Managers ---
router.post(
  "/admin/broadcast",
  verifyToken(["Admin", "Superadmin", "Manager"]),
  adminBroadcastAnnouncement
);

router.get(
  "/admin/broadcast/history",
  verifyToken(["Admin", "Superadmin", "Manager", "Receptionist", "Sales Agent", "Staff"]),
  getAdminBroadcastHistory
);

router.get(
  "/user-announcements",
  verifyToken(),
  getUserAnnouncements
);

// --- Personal Notification: Admin → Individual Member ---
router.post(
  "/personal",
  verifyToken(["Admin", "Superadmin", "Manager"]),
  sendPersonalNotification
);

router.get(
  "/personal/history",
  verifyToken(["Admin", "Superadmin", "Manager"]),
  getPersonalHistory
);

router.delete(
  "/announcement/:id",
  verifyToken(["Admin", "Superadmin", "Manager"]),
  deleteAnnouncement
);

export default router;
