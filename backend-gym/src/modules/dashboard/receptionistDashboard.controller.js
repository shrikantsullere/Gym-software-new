import { receptionistDashboardService } from "./receptionistDashboard.service.js";

export const getReceptionistDashboard = async (req, res, next) => {
  try {
    const adminId = Number(req.query.adminId);
    const branchId = Number(req.query.branchId) || 1;

    if (!adminId) {
      return res.status(400).json({ success: false, message: "adminId is required" });
    }

    const data = await receptionistDashboardService(adminId, branchId);

    return res.status(200).json({
      success: true,
      receptionistDashboard: data,
    });
  } catch (err) {
    next(err);
  }
};
