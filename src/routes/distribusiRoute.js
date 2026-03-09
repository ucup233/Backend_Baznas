import express from 'express';
import distribusiController from '../controllers/distribusiController.js';
import validate from '../middlewares/validateMiddleware.js';
import {
  createDistribusiSchema,
  updateDistribusiSchema,
  queryDistribusiSchema
} from '../validations/distribusiValidation.js';
import { idParamSchema } from '../validations/shared.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import roleMiddleware from '../middlewares/roleMiddleware.js';

const router = express.Router();

// Semua route butuh login
router.use(authMiddleware);

router.get('/',
  roleMiddleware(['keuangan', 'pendistribusian', 'penerimaan', 'superadmin', 'pelayanan']),
  validate(queryDistribusiSchema, 'query'),
  distribusiController.getAll
);

router.get('/stats',
  roleMiddleware(['keuangan', 'pendistribusian', 'penerimaan', 'superadmin', 'pelayanan']),
  distribusiController.getStats
);

router.get('/rekap/harian',
  roleMiddleware(['keuangan', 'pendistribusian', 'penerimaan', 'superadmin', 'pelayanan']),
  distribusiController.rekapHarian
);

router.get('/rekap/bulanan',
  roleMiddleware(['keuangan', 'pendistribusian', 'penerimaan', 'superadmin', 'pelayanan']),
  distribusiController.rekapBulanan
);

router.get('/rekap/tahunan',
  roleMiddleware(['keuangan', 'pendistribusian', 'penerimaan', 'superadmin', 'pelayanan']),
  distribusiController.rekapTahunan
);

router.get('/:id',
  roleMiddleware(['keuangan', 'pendistribusian', 'penerimaan', 'superadmin', 'pelayanan']),
  validate(idParamSchema, 'params'),
  distribusiController.getById
);

router.get('/:id/cetak',
  roleMiddleware(['keuangan', 'pendistribusian', 'penerimaan', 'superadmin', 'pelayanan']),
  validate(idParamSchema, 'params'),
  distribusiController.cetakBuktiPenyaluran
);

router.get('/:id/daily-seq',
  roleMiddleware(['keuangan', 'pendistribusian', 'penerimaan', 'superadmin', 'pelayanan']),
  validate(idParamSchema, 'params'),
  distribusiController.dailySeq
);

router.post('/',
  roleMiddleware(['superadmin', 'pendistribusian', 'pelayanan']),
  validate(createDistribusiSchema),
  distribusiController.create
);

router.put('/:id',
  roleMiddleware(['superadmin']),
  validate(idParamSchema, 'params'),
  validate(updateDistribusiSchema),
  distribusiController.update
);

router.delete('/:id',
  roleMiddleware(['superadmin']),
  validate(idParamSchema, 'params'),
  distribusiController.destroy
);

export default router;
