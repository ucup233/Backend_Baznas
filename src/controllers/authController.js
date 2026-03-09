import authService from '../services/authService.js';
import tokenBlacklist from '../utils/tokenBlacklist.js';

const login = async (req, res, next) => {
  try {
    const data = await authService.login(req.body);
    res.status(200).json({
      success: true,
      data: data,
      message: 'Login berhasil.'
    });
  } catch (error) {
    next(error);
  }
};

const logout = (req, res) => {
  // req.user sudah di-attach oleh authMiddleware, berisi { jti, id, exp, ... }
  if (req.user?.jti && req.user?.exp) {
    tokenBlacklist.addToBlacklist(req.user.jti, req.user.exp);
  }

  res.status(200).json({
    success: true,
    message: 'Logout berhasil. Token telah diinvalidasi.'
  });
};

const me = async (req, res) => {
  res.status(200).json({
    success: true,
    data: req.user
  });
};

export default {
  login,
  logout,
  me
};
