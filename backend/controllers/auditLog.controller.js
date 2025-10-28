import AuditLog from '../models/auditLog.js';

// Lấy danh sách tất cả audit logs (chỉ admin)
export const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, sort = { updated_at: -1 } } = req.body;

    const pageNum = parseInt(page);
    const limit = parseInt(pageSize);
    const skip = (pageNum - 1) * limit;

    const [logs, totalCount] = await Promise.all([
      AuditLog.find()
        .populate('user_id', 'username email') // Lấy thông tin user
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments()
    ]);

    res.status(200).json({
      message: "Lấy danh sách audit log thành công",
      page: pageNum,
      pageSize: limit,
      totalCount,
      list: logs
    });
  } catch (error) {
    next(error);
  }
};
