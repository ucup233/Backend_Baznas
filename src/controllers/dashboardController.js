import dashboardService from '../services/dashboardService.js';

const getDashboardInfo = async (req, res, next) => {
  try {
    const data = await dashboardService.getDashboardInfo(req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export default {
  getDashboardInfo
};
