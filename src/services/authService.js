import User from '../models/userModel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import AppError from '../utils/AppError.js';

const login = async ({ username, password }) => {
  const user = await User.findOne({ where: { username } });

  if (!user) {
    throw new AppError('Username atau password salah.', 401);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError('Username atau password salah.', 401);
  }

  const jti = crypto.randomUUID();

  const token = jwt.sign(
    { jti, id: user.id, role: user.role, nama: user.nama, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );

  return {
    token,
    user: {
      id: user.id,
      nama: user.nama,
      role: user.role
    }
  };
};

export default {
  login
};

