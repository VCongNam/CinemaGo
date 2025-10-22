import { Router } from "express";
import {
  createPaymentLink,
  handlePayosWebhook,
  checkPaymentStatus,
  checkBookingPaymentStatus,
} from "../controllers/payment.controller.js";
import { verifyToken } from "../middlewares/auth.js";

const router = Router();

// @route   POST /api/payments/create-payment-link
// @desc    Tạo link thanh toán cho một đơn đặt vé
// @access  Private (Cần đăng nhập)
router.post("/create-payment-link", verifyToken, createPaymentLink);

// @route   POST /api/payments/webhook
// @desc    Lắng nghe thông báo từ PayOS
// @access  Public
router.post("/webhook", handlePayosWebhook);

// @route   GET /api/payments/check/:paymentLinkId
// @desc    Kiểm tra trạng thái thanh toán thủ công (dành cho test)
// @access  Public
router.get("/check/:paymentLinkId", checkPaymentStatus);

// @route   GET /api/payments/booking/:bookingId/status
// @desc    Kiểm tra trạng thái thanh toán theo booking ID
// @access  Private (Cần đăng nhập)
router.get("/booking/:bookingId/status", verifyToken, checkBookingPaymentStatus);

export default router;