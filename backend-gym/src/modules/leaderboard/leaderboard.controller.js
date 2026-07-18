import { getLeaderboardByGoal } from './leaderboard.service.js';

export const getLeaderboard = async (req, res) => {
  try {
    const { branchId, goal } = req.query;
    
    if (!branchId) {
      return res.status(400).json({ status: false, message: "branchId is required" });
    }
    
    const validGoals = ['fat_loss', 'maintenance', 'muscle_gain'];
    if (!goal || !validGoals.includes(goal)) {
      return res.status(400).json({ status: false, message: `goal must be one of: ${validGoals.join(', ')}` });
    }

    const leaderboard = await getLeaderboardByGoal(branchId, goal, 50);
    
    res.status(200).json({
      status: true,
      message: "Leaderboard fetched successfully",
      data: leaderboard
    });
  } catch (error) {
    console.error("Leaderboard Error:", error);
    res.status(500).json({ status: false, message: "Internal Server Error", error: error.message });
  }
};
