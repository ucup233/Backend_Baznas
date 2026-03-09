import express from 'express';
import authController from '../controllers/authController.js';
import validate from '../middlewares/validateMiddleware.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import { loginUserSchema } from '../validations/userValidation.js';

const router = express.Router();

router.post('/login', validate(loginUserSchema), authController.login);
router.post('/logout', authMiddleware, authController.logout);
router.get('/me', authMiddleware, authController.me);

export default router;
