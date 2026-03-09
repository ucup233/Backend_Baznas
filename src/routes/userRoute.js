import express from 'express';
import userController from '../controllers/userController.js';
import validate from '../middlewares/validateMiddleware.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import roleMiddleware from '../middlewares/roleMiddleware.js';
import {
  createUserSchema,
  updateUserSchema,
  queryUserSchema,
  idParamSchema
} from '../validations/userValidation.js';

const router = express.Router();

// Semua route user wajib terautentikasi dan berstatus superadmin
router.use(authMiddleware);
router.use(roleMiddleware(['superadmin']));

router.get('/', validate(queryUserSchema, 'query'), userController.getAll);
router.get('/:id', validate(idParamSchema, 'params'), userController.getById);
router.post('/', validate(createUserSchema, 'body'), userController.create);
router.put('/:id', validate(idParamSchema, 'params'), validate(updateUserSchema, 'body'), userController.update);
router.delete('/:id', validate(idParamSchema, 'params'), userController.destroy);

export default router;
