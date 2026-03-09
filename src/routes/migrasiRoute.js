import express from 'express';
import multer from 'multer';
import migrasiController from '../controllers/migrasiController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import roleMiddleware from '../middlewares/roleMiddleware.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authMiddleware);

// 53. GET Template
router.get('/template/:jenis', migrasiController.getTemplate);

// 54. POST Preview
router.post('/preview', 
  upload.single('file'), 
  migrasiController.preview
);

// 55. POST Import
router.post('/import', 
  upload.single('file'), 
  migrasiController.doImport
);

// 56. GET Log
router.get('/log', 
  roleMiddleware(['superadmin']), 
  migrasiController.getLogs
);

export default router;
