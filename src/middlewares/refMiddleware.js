
import { refRegistry } from '../config/refRegistry.js';
import AppError from '../utils/AppError.js';

export const resolveResource = (req, res, next) => {
  const resource = req.params.resource;
  const config = refRegistry[resource];

  if (!config) {
    return next(new AppError(`Resource '${resource}' tidak ditemukan.`, 404));
  }

  req.refConfig = config;
  next();
};

export const guardReadOnly = (req, res, next) => {
  const MUTATING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (req.refConfig?.readOnly && MUTATING_METHODS.includes(req.method)) {
    return next(new AppError(`Resource '${req.params.resource}' bersifat read-only dan tidak dapat dimodifikasi.`, 403));
  }
  next();
};


export const validateRefBody = (req, res, next) => {
  const { refConfig } = req;

  const schema = req.method === 'POST'
    ? refConfig.createSchema
    : refConfig.updateSchema;

  if (!schema) return next();

  const result = schema.safeParse(req.body);

  if (!result.success) {
    const messages = result.error.issues.map(i => i.message).join(', ');
    return next(new AppError(messages, 422));
  }
  req.body = result.data;
  next();
};
