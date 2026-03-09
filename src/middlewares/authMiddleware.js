import jwt from 'jsonwebtoken';
import tokenBlacklist from '../utils/tokenBlacklist.js';
import User from '../models/userModel.js';

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token diperlukan.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Cek apakah token sudah di-logout (ada di blacklist)
    if (decoded.jti && tokenBlacklist.isBlacklisted(decoded.jti)) {
      return res.status(401).json({
        success: false,
        message: 'Token sudah tidak valid, silakan login ulang.'
      });
    }

    // Pastikan user masih ada di database (menghindari stale token setelah db:fresh)
    const userExists = await User.findByPk(decoded.id, { attributes: ['id'] });
    if (!userExists) {
      return res.status(401).json({
        success: false,
        message: 'Pengguna tidak ditemukan. Silakan login ulang.'
      });
    }

    req.user = decoded; // { jti, id, role, nama, username, iat, exp }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token sudah kadaluarsa, silakan login ulang.'
      });
    }
    return res.status(403).json({
      success: false,
      message: 'Token tidak valid.'
    });
  }
};

export default authMiddleware;

