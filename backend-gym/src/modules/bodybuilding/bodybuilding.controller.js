import * as BodybuildingService from './bodybuilding.service.js';

export const createLog = async (req, res) => {
  try {
    const { memberId } = req.params;
    if (!memberId) {
      return res.status(400).json({ status: false, message: 'memberId is required' });
    }

    const newLog = await BodybuildingService.logBodybuildingMetrics(memberId, req.body);
    res.status(201).json({ status: true, message: 'Bodybuilding log added successfully', data: newLog });
  } catch (error) {
    console.error("Error creating bodybuilding log:", error);
    res.status(500).json({ status: false, message: 'Internal Server Error', error: error.message });
  }
};

export const getLogs = async (req, res) => {
  try {
    const { memberId } = req.params;
    if (!memberId) {
      return res.status(400).json({ status: false, message: 'memberId is required' });
    }

    const logs = await BodybuildingService.getBodybuildingLogs(memberId);
    res.status(200).json({ status: true, message: 'Logs fetched successfully', data: logs });
  } catch (error) {
    console.error("Error fetching bodybuilding logs:", error);
    res.status(500).json({ status: false, message: 'Internal Server Error', error: error.message });
  }
};
