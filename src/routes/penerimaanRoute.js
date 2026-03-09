import express from 'express';
import penerimaanController from '../controllers/penerimaanController.js';
import validate from '../middlewares/validateMiddleware.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import roleMiddleware from '../middlewares/roleMiddleware.js';
import {
  idParamSchema,
  createPenerimaanSchema,
  updatePenerimaanSchema,
  queryPenerimaanSchema,
  queryRekapHarianSchema,
  queryRekapBulananSchema,
  queryRekapTahunanSchema
} from '../validations/penerimaanValidation.js';

const router = express.Router();

router.use(authMiddleware);

const allRoles = roleMiddleware(['keuangan', 'pendistribusian', 'penerimaan', 'superadmin']);
const adminOnly = roleMiddleware(['superadmin', 'penerimaan']);

// --- Rekap routes (harus sebelum /:id agar tidak di-match sebagai params) ---
router.get('/rekap/harian',
  allRoles,
  validate(queryRekapHarianSchema, 'query'),
  penerimaanController.rekapHarian
);

router.get('/rekap/bulanan',
  allRoles,
  validate(queryRekapBulananSchema, 'query'),
  penerimaanController.rekapBulanan
);

router.get('/rekap/tahunan',
  allRoles,
  validate(queryRekapTahunanSchema, 'query'),
  penerimaanController.rekapTahunan
);

// --- CRUD routes ---
router.get('/',
  allRoles,
  validate(queryPenerimaanSchema, 'query'),
  penerimaanController.getAll
);

router.get('/:id',
  allRoles,
  validate(idParamSchema, 'params'),
  penerimaanController.getById
);

// Cetak bukti setor PDF
router.get('/:id/cetak',
  allRoles,
  validate(idParamSchema, 'params'),
  penerimaanController.cetakBuktiSetor
);

// Daily sequence (urutan transaksi hari itu)
router.get('/:id/daily-seq',
  allRoles,
  validate(idParamSchema, 'params'),
  penerimaanController.dailySeq
);

router.post('/',
  adminOnly,
  validate(createPenerimaanSchema, 'body'),
  penerimaanController.create
);

router.put('/:id',
  adminOnly,
  validate(idParamSchema, 'params'),
  validate(updatePenerimaanSchema, 'body'),
  penerimaanController.update
);

router.delete('/:id',
  adminOnly,
  validate(idParamSchema, 'params'),
  penerimaanController.destroy
);

export default router;
