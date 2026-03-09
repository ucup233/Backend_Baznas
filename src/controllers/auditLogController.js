import auditLogService from '../services/auditLogService.js';

const getLogs = async (req, res, next) => {
  try {
    const logs = await auditLogService.getLogs(req.query);
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};

export default {
  getLogs
};
