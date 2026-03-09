import User from '../models/userModel.js';
import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import AppError from '../utils/AppError.js';

const getAllUsers = async (query) => {
  const { role, page = 1, limit = 10, search } = query;
  const offset = (page - 1) * limit;

  const where = {};
  if (role) where.role = role;
  if (search) {
    where[Op.or] = [
      { username: { [Op.like]: `%${search}%` } },
      { nama: { [Op.like]: `%${search}%` } }
    ];
  }

  const { rows, count } = await User.findAndCountAll({
    where,
    limit: Number(limit),
    offset: Number(offset),
    attributes: { exclude: ['password'] }
  });

  return {
    users: rows,
    total: count,
    page: Number(page),
    totalPages: Math.ceil(count / limit)
  };
};

const getUserById = async (id) => {
  const user = await User.findByPk(id, { attributes: { exclude: ['password'] } });
  if (!user) throw new AppError('User tidak ditemukan.', 404);
  return user;
};

const createUser = async (userData) => {
  const { username, password, nama, role } = userData;

  const existing = await User.findOne({ where: { username } });
  if (existing) throw new AppError('Username sudah digunakan.', 409);

  const hashedPassword = await bcrypt.hash(password, 12);

  const newUser = await User.create({ username, password: hashedPassword, nama, role });

  return { id: newUser.id, username, nama, role };
};

const updateUser = async (id, updateData) => {
  const user = await User.findByPk(id);
  if (!user) throw new AppError('User tidak ditemukan.', 404);

  if (updateData.username && updateData.username !== user.username) {
    const conflict = await User.findOne({ where: { username: updateData.username } });
    if (conflict) throw new AppError('Username sudah digunakan.', 409);
  }

  if (updateData.password) {
    updateData.password = await bcrypt.hash(updateData.password, 12);
  }

  await user.update(updateData);
  return { id: user.id, username: user.username, nama: user.nama, role: user.role };
};

const deleteUser = async (id) => {
  const user = await User.findByPk(id);
  if (!user) throw new AppError('User tidak ditemukan.', 404);
  await user.destroy();
};

export default {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
