import AuditLog from '../models/auditLog.js';

/**
 * Ghi lại một hành động vào audit log.
 * @param {string} userId - ID của người dùng thực hiện hành động.
 * @param {string} tableName - Tên của bảng (model) bị ảnh hưởng.
 * @param {string} recordId - ID của bản ghi bị ảnh hưởng.
 * @param {string} fieldName - Tên của trường bị thay đổi.
 * @param {any} oldValue - Giá trị cũ của trường.
 * @param {any} newValue - Giá trị mới của trường.
 */
export const logAction = async (userId, tableName, recordId, fieldName, oldValue, newValue) => {
  try {
    await AuditLog.create({
      user_id: userId,
      table_name: tableName,
      record_id: recordId,
      field_name: fieldName,
      old_value: JSON.stringify(oldValue),
      new_value: JSON.stringify(newValue),
    });
  } catch (error) {
    console.error('Lỗi khi ghi audit log:', error);
  }
};
