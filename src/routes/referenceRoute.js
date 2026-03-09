
import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import roleMiddleware from '../middlewares/roleMiddleware.js';
import { resolveResource, guardReadOnly, validateRefBody } from '../middlewares/refMiddleware.js';
import {
  getAll,
  getById,
  create,
  update,
  softDelete
} from '../controllers/referenceController.js';

const router = express.Router();

router.use(authMiddleware);
router.use('/:resource',     resolveResource, guardReadOnly);
router.use('/:resource/:id', resolveResource, guardReadOnly);

router.get('/:resource',     getAll);
router.get('/:resource/:id', getById);

const adminOnly = roleMiddleware(['superadmin', 'pelayanan']);
router.post  ('/:resource',     adminOnly, validateRefBody, create);
router.put   ('/:resource/:id', adminOnly, validateRefBody, update);
router.delete('/:resource/:id', adminOnly, softDelete);

export default router;
