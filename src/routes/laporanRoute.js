import express from 'express';
import laporanController from '../controllers/laporanController.js';
import mustahiqController from '../controllers/mustahiqController.js';
import muzakkiController from '../controllers/muzakkiController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import roleMiddleware from '../middlewares/roleMiddleware.js';
import validate from '../middlewares/validateMiddleware.js';
import { queryExportSchema as mustahiqExportSchema } from '../validations/mustahiqValidation.js';
import { queryExportSchema as muzakkiExportSchema } from '../validations/muzakkiValidation.js';

const router = express.Router();

router.use(authMiddleware);

// --- Data Mentah (Excel) ---
router.get('/penerimaan/export',
  roleMiddleware(['keuangan', 'pendistribusian', 'penerimaan', 'superadmin']),
  laporanController.exportPenerimaan
);

router.get('/distribusi/export',
  roleMiddleware(['keuangan', 'pendistribusian', 'penerimaan', 'superadmin']),
  laporanController.exportDistribusi
);

router.get('/mustahiq/export',
  roleMiddleware(['pelayanan', 'penerimaan', 'superadmin']),
  validate(mustahiqExportSchema, 'query'),
  mustahiqController.exportExcel
);

router.get('/muzakki/export',
  roleMiddleware(['keuangan', 'pendistribusian', 'penerimaan', 'superadmin']),
  validate(muzakkiExportSchema, 'query'),
  muzakkiController.exportExcel
);

// --- Laporan Keuangan (JSON & Export) ---
router.get('/arus-kas',
  roleMiddleware(['keuangan', 'pendistribusian', 'penerimaan', 'superadmin']),
  laporanController.getArusKas
);

router.get('/arus-kas/export',
  roleMiddleware(['keuangan', 'pendistribusian', 'penerimaan', 'superadmin']),
  laporanController.exportArusKasPdf
);

router.get('/neraca',
  roleMiddleware(['keuangan', 'pendistribusian', 'penerimaan', 'superadmin']),
  laporanController.getNeraca
);

router.get('/neraca/export',
  roleMiddleware(['keuangan', 'pendistribusian', 'penerimaan', 'superadmin']),
  laporanController.exportNeracaPdf
);

router.get('/rekap-tahunan/export',
  roleMiddleware(['keuangan', 'pendistribusian', 'penerimaan', 'superadmin']),
  laporanController.exportRekapTahunanPdf
);

router.get('/distribusi-by-program',
  roleMiddleware(['keuangan', 'pendistribusian', 'penerimaan', 'superadmin']),
  laporanController.getDistribusiByProgram
);

router.get('/distribusi-by-asnaf',
  roleMiddleware(['keuangan', 'pendistribusian', 'penerimaan', 'superadmin']),
  laporanController.getDistribusiByAsnaf
);

router.get('/distribusi-harian',
  roleMiddleware(['keuangan', 'pendistribusian', 'penerimaan', 'superadmin']),
  laporanController.getDistribusiHarian
);

router.get('/perubahan-dana',
  roleMiddleware(['keuangan', 'pendistribusian', 'penerimaan', 'superadmin']),
  laporanController.getPerubahanDana
);

router.get('/perubahan-dana/export',
  roleMiddleware(['keuangan', 'pendistribusian', 'penerimaan', 'superadmin']),
  laporanController.exportPerubahanDanaPdf
);

router.get('/kas-masuk-harian',
  roleMiddleware(['keuangan', 'pendistribusian', 'penerimaan', 'superadmin']),
  laporanController.getKasMasukHarian
);

export default router;
