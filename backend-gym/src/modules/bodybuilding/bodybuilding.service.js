import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const logBodybuildingMetrics = async (memberId, data) => {
  const newLog = await prisma.member_bodybuilding_logs.create({
    data: {
      memberId: parseInt(memberId),
      weight_kg: data.weight_kg ? parseFloat(data.weight_kg) : null,
      chest_cm: data.chest_cm ? parseFloat(data.chest_cm) : null,
      shoulders_cm: data.shoulders_cm ? parseFloat(data.shoulders_cm) : null,
      left_arm_cm: data.left_arm_cm ? parseFloat(data.left_arm_cm) : null,
      right_arm_cm: data.right_arm_cm ? parseFloat(data.right_arm_cm) : null,
      left_forearm_cm: data.left_forearm_cm ? parseFloat(data.left_forearm_cm) : null,
      right_forearm_cm: data.right_forearm_cm ? parseFloat(data.right_forearm_cm) : null,
      waist_cm: data.waist_cm ? parseFloat(data.waist_cm) : null,
      thighs_cm: data.thighs_cm ? parseFloat(data.thighs_cm) : null,
      calves_cm: data.calves_cm ? parseFloat(data.calves_cm) : null,
      front_photo_url: data.front_photo_url || null,
      back_photo_url: data.back_photo_url || null,
      side_photo_url: data.side_photo_url || null,
      notes: data.notes || null,
    }
  });
  return newLog;
};

export const getBodybuildingLogs = async (memberId) => {
  return await prisma.member_bodybuilding_logs.findMany({
    where: { memberId: parseInt(memberId) },
    orderBy: { log_date: 'desc' }
  });
};
