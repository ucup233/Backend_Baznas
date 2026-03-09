import userService from '../services/userService.js';

const getAll = async (req, res, next) => {
  try {
    const data = await userService.getAllUsers(req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const data = await userService.getUserById(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const data = await userService.createUser(req.body);
    res.status(201).json({ success: true, data, message: 'User berhasil dibuat.' });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const data = await userService.updateUser(req.params.id, req.body);
    res.status(200).json({ success: true, data, message: 'User berhasil diperbarui.' });
  } catch (error) {
    next(error);
  }
};

const destroy = async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id);
    res.status(200).json({ success: true, message: 'User berhasil dihapus.' });
  } catch (error) {
    next(error);
  }
};

export default {
  getAll,
  getById,
  create,
  update,
  destroy
};
