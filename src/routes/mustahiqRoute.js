import express from 'express';
import mustahiqController from '../controllers/mustahiqController.js';
import validate from '../middlewares/validateMiddleware.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import roleMiddleware from '../middlewares/roleMiddleware.js';
import {
  idParamSchema,
  createMustahiqSchema,
  updateMustahiqSchema,
  updateStatusSchema,
  queryMustahiqSchema,
  queryRiwayatSchema,
  queryExportSchema
} from '../validations/mustahiqValidation.js';

const router = express.Router();

// Semua route mustahiq wajib terautentikasi
router.use(authMiddleware);

// --- Shared roles ---
const allRoles = roleMiddleware(['pelayanan', 'keuangan', 'pendistribusian', 'penerimaan', 'superadmin']);
const writeRoles = roleMiddleware(['pelayanan', 'superadmin']);
const adminOnly = roleMiddleware(['superadmin']);

// --- Routes ---

// GET list (all roles)
router.get('/',
  allRoles,
  validate(queryMustahiqSchema, 'query'),
  mustahiqController.getAll
);

// GET detail (all roles)
router.get('/:id',
  allRoles,
  validate(idParamSchema, 'params'),
  mustahiqController.getById
);

// GET riwayat distribusi (all roles)
router.get('/:id/riwayat',
  allRoles,
  validate(idParamSchema, 'params'),
  validate(queryRiwayatSchema, 'query'),
  mustahiqController.getRiwayat
);

// POST create (pelayanan, superadmin)
router.post('/',
  writeRoles,
  validate(createMustahiqSchema, 'body'),
  mustahiqController.create
);

// PUT update (pelayanan, superadmin)
router.put('/:id',
  writeRoles,
  validate(idParamSchema, 'params'),
  validate(updateMustahiqSchema, 'body'),
  mustahiqController.update
);

// PUT update status (pelayanan, superadmin)
router.put('/:id/status',
  writeRoles,
  validate(idParamSchema, 'params'),
  validate(updateStatusSchema, 'body'),
  mustahiqController.updateStatus
);

// DELETE (superadmin only)
router.delete('/:id',
  adminOnly,
  validate(idParamSchema, 'params'),
  mustahiqController.destroy
);

export default router;
