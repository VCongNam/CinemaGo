import express from 'express';
import { getAuditLogs } from '../controllers/auditLog.controller.js';
import { verifyToken, requireAdmin } from '../middlewares/auth.js';

const router = express.Router();

// Định nghĩa route để lấy audit logs, chỉ Admin mới có quyền truy cập
// Sử dụng POST để có thể truyền các tùy chọn phân trang và sắp xếp trong body
router.post('/', verifyToken, requireAdmin, getAuditLogs);

export default router;
