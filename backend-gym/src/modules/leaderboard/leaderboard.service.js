import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getLeaderboardByGoal = async (branchId, fitnessGoal, limit = 50) => {
  // We need to get the LATEST assessment for each member in the branch
  // that matches the fitness goal, sorted by final_leaderboard_score.
  // Using a raw query for high-performance ranking based on the architecture doc.

  const query = `
    SELECT 
      m.id as memberId,
      m.fullName,
      m.phone,
      u.profileImage as avatar,
      m.branchId,
      a.final_leaderboard_score,
      a.assessment_date,
      a.demographic_multiplier
    FROM member_assessments a
    JOIN member m ON a.memberId = m.id
    LEFT JOIN user u ON m.userId = u.id
    WHERE a.fitness_goal = ? 
      AND m.branchId = ?
      AND a.is_baseline = false
      AND a.id IN (
        SELECT MAX(id) 
        FROM member_assessments 
        GROUP BY memberId
      )
    ORDER BY a.final_leaderboard_score DESC
    LIMIT ?;
  `;

  // Prisma raw query
  const results = await prisma.$queryRawUnsafe(query, fitnessGoal, parseInt(branchId), parseInt(limit));
  
  return results.map((row, index) => ({
    rank: index + 1,
    memberId: row.memberId,
    fullName: row.fullName,
    avatar: row.avatar || null,
    score: row.final_leaderboard_score ? Number(row.final_leaderboard_score) : 0,
    multiplier: row.demographic_multiplier ? Number(row.demographic_multiplier) : 1,
    date: row.assessment_date
  }));
};
