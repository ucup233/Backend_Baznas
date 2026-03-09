import express from 'express';
import dashboardController from '../controllers/dashboardController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import roleMiddleware from '../middlewares/roleMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', 
  roleMiddleware(['pelayanan', 'keuangan', 'pendistribusian', 'penerimaan', 'superadmin']), 
  dashboardController.getDashboardInfo
);

export default router;
