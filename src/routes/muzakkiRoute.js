import express from 'express';
import muzakkiController from '../controllers/muzakkiController.js';
import validate from '../middlewares/validateMiddleware.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import roleMiddleware from '../middlewares/roleMiddleware.js';
import {
  idParamSchema,
  createMuzakkiSchema,
  updateMuzakkiSchema,
  updateStatusSchema,
  queryMuzakkiSchema,
  queryRiwayatSchema
} from '../validations/muzakkiValidation.js';

const router = express.Router();

router.use(authMiddleware);

// --- Shared roles ---
const allRoles = roleMiddleware(['keuangan', 'pendistribusian', 'penerimaan', 'pelayanan', 'superadmin']);
const adminOnly = roleMiddleware(['superadmin', 'pelayanan']);

// GET list
router.get('/',
  allRoles,
  validate(queryMuzakkiSchema, 'query'),
  muzakkiController.getAll
);

// GET detail
router.get('/:id',
  allRoles,
  validate(idParamSchema, 'params'),
  muzakkiController.getById
);

// GET riwayat penerimaan
router.get('/:id/riwayat',
  allRoles,
  validate(idParamSchema, 'params'),
  validate(queryRiwayatSchema, 'query'),
  muzakkiController.getRiwayat
);

// POST create
router.post('/',
  allRoles,
  validate(createMuzakkiSchema, 'body'),
  muzakkiController.create
);

// PUT update
router.put('/:id',
  allRoles,
  validate(idParamSchema, 'params'),
  validate(updateMuzakkiSchema, 'body'),
  muzakkiController.update
);

// PUT update status
router.put('/:id/status',
  allRoles,
  validate(idParamSchema, 'params'),
  validate(updateStatusSchema, 'body'),
  muzakkiController.updateStatus
);

// DELETE (superadmin only)
router.delete('/:id',
  adminOnly,
  validate(idParamSchema, 'params'),
  muzakkiController.destroy
);

export default router;
