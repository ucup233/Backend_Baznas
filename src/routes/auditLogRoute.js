import express from 'express';
import auditLogController from '../controllers/auditLogController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import roleMiddleware from '../middlewares/roleMiddleware.js';

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware(['superadmin']));

router.get('/', auditLogController.getLogs);

export default router;
