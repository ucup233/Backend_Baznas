import auditLogService from '../services/auditLogService.js';

export const registerAuditHooks = (model, tableName) => {
  model.addHook('afterCreate', async (instance, options) => {
    if (tableName === 'audit_log') return;
    
    const userId = options.userId || null;
    const ipAddress = options.ipAddress || null;
    
    await auditLogService.logAction(
      userId, 
      tableName, 
      'INSERT', 
      null, 
      instance.toJSON(), 
      ipAddress
    );
  });

  model.addHook('afterUpdate', async (instance, options) => {
    if (tableName === 'audit_log') return;

    const userId = options.userId || null;
    const ipAddress = options.ipAddress || null;

    const oldData = instance._previousDataValues;
    const newData = instance.toJSON();

    await auditLogService.logAction(
      userId, 
      tableName, 
      'UPDATE', 
      oldData, 
      newData, 
      ipAddress
    );
  });

  model.addHook('afterDestroy', async (instance, options) => {
    if (tableName === 'audit_log') return;

    const userId = options.userId || null;
    const ipAddress = options.ipAddress || null;

    await auditLogService.logAction(
      userId, 
      tableName, 
      'DELETE', 
      instance.toJSON(), 
      null, 
      ipAddress
    );
  });
};
