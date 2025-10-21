import payos from "../utils/payos.js";
import Booking from "../models/booking.js";
import BookingSeat from "../models/bookingSeat.js";

export const createPaymentLink = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    
    if (!bookingId) {
      return res.status(400).json({
        message: "Booking ID là bắt buộc"
      });
    }

    // Lấy thông tin booking từ database
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        message: "Không tìm thấy booking"
      });
    }

    // Kiểm tra quyền truy cập
    if (booking.user_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Bạn không có quyền thanh toán cho booking này"
      });
    }

    // Kiểm tra trạng thái booking
    if (booking.status !== 'pending') {
      return res.status(400).json({
        message: "Booking không ở trạng thái pending"
      });
    }

    // Tạo orderCode từ booking ID
    const orderCode = parseInt(booking._id.toString().slice(-6), 16);

    // Chuyển đổi total_price từ Decimal128 sang number
    const amount = Math.round(parseFloat(booking.total_price.toString()));

    // PayOS limits description length to 25 characters. Ensure we respect that
    // to avoid API error code 20 (description too long).
    const rawDescription = `Thanh toán vé xem phim - Booking #${bookingId}`;
    const MAX_DESC_LENGTH = 25;
    const description = rawDescription.length > MAX_DESC_LENGTH
      ? rawDescription.slice(0, MAX_DESC_LENGTH - 1) + '…'
      : rawDescription;

    const paymentData = {
      orderCode: orderCode,
      amount: amount,
      description,
      returnUrl: `${process.env.FRONTEND_URL}/payment-success?bookingId=${bookingId}`,
      cancelUrl: `${process.env.FRONTEND_URL}/payment-failed?bookingId=${bookingId}`,
    };

    // Thêm kiểm tra để đảm bảo các biến môi trường PayOS đã được cấu hình
    if (!process.env.PAYOS_CLIENT_ID || !process.env.PAYOS_API_KEY || !process.env.PAYOS_CHECKSUM_KEY) {
      throw new Error("PayOS environment variables are not configured correctly.");
    }

    // Thêm một bước kiểm tra cuối cùng trước khi gọi hàm
    if (typeof payos.createPaymentLink !== 'function') {
      throw new TypeError("payos.createPaymentLink is not a function. Check SDK initialization in 'utils/payos.js'.");
    }

    let paymentLink;
    try {
      paymentLink = await payos.createPaymentLink(paymentData);
    } catch (err) {
      // PayOS sometimes returns HTTP 200 with an error object (e.g., code '20').
      // Normalize that into a 400 for the client with a human message.
      const apiErr = err && err.code ? err : (err && err.error) ? err.error : null;
      if (apiErr && (apiErr.code === '20' || apiErr.code === 20)) {
        console.error('PayOS rejected payment creation because description is too long or invalid:', apiErr);
        return res.status(400).json({ message: 'Tạo link thanh toán thất bại: mô tả quá dài hoặc không hợp lệ.' });
      }
      // Re-throw any other errors to be handled by error middleware.
      throw err;
    }

    // Cập nhật booking với order_code và payment_link_id
    await Booking.findByIdAndUpdate(bookingId, {
      order_code: orderCode,
      payment_link_id: paymentLink.paymentLinkId
    });

    res.status(200).json({
      message: "Tạo link thanh toán thành công",
      data: {
        paymentLink: paymentLink.checkoutUrl,
        paymentLinkId: paymentLink.paymentLinkId,
        orderCode: orderCode,
        amount: amount
      },
    });
  } catch (error) {
    console.error("Error creating payment link:", error.message);
    // Thêm log chi tiết hơn cho lỗi TypeError
    if (error instanceof TypeError) {
      console.error("This is likely an issue with the PayOS SDK initialization in 'utils/payos.js'. Please verify the import and constructor call.");
    }
    next(error);
  }
};

export const handlePayosWebhook = async (req, res, next) => {
  const webhookData = req.body;
  try {
    // Xác thực dữ liệu từ webhook
    // Thêm kiểm tra để đảm bảo checksum key đã được cấu hình
    if (!process.env.PAYOS_CHECKSUM_KEY) {
      throw new Error("PayOS CHECKSUM_KEY is not configured.");
    }

    const verifiedData = payos.verifyPaymentWebhookData(webhookData);

    console.log("Webhook received:", verifiedData);

    // Tìm booking với order_code tương ứng
    const booking = await Booking.findOne({ order_code: verifiedData.orderCode });
    
    if (!booking) {
      console.log(`Booking not found for order code: ${verifiedData.orderCode}`);
      return res.status(200).json({
        success: true,
        message: "Webhook received but booking not found",
      });
    }

    // Tránh xử lý lại webhook đã xử lý
    if (booking.status === 'confirmed' || booking.status === 'cancelled') {
      console.log(`Webhook for order ${verifiedData.orderCode} already processed. Status: ${booking.status}`);
      return res.status(200).json({ success: true, message: "Webhook already processed" });
    }

    switch (verifiedData.code) {
      case "00": // Thanh toán thành công
        console.log(`Payment for order ${verifiedData.orderCode} was successful.`);
        booking.payment_status = 'success';
        booking.status = 'confirmed';
        booking.paid_amount = verifiedData.amount;
        await booking.save();
        // TODO: Gửi email xác nhận cho khách hàng
        // TODO: Tạo vé điện tử
        break;

      case "24": // Bị hủy
      case "07": // Thất bại
      default: // Các trường hợp thất bại khác
        console.log(`Payment for order ${verifiedData.orderCode} failed or was cancelled. Code: ${verifiedData.code}`);
        
        // Chỉ cập nhật nếu booking đang ở trạng thái pending
        if (booking.status === 'pending') {
          booking.payment_status = 'failed';
          booking.status = 'cancelled';
          await booking.save();

          // Giải phóng ghế đã đặt
          const bookingSeats = await BookingSeat.find({ booking_id: booking._id });
          const seatIdsToRelease = bookingSeats.map(bs => bs.seat_id);

          if (seatIdsToRelease.length > 0) {
            // Logic giải phóng ghế ở đây (ví dụ: cập nhật trạng thái ghế)
            console.log(`Releasing seats for cancelled booking ${booking._id}:`, seatIdsToRelease);
            // await Seat.updateMany({ _id: { $in: seatIdsToRelease } }, { $set: { status: 'available' } });
          }
        }
        // TODO: Gửi email thông báo thất bại
        break;
    }

    // Phản hồi 200 OK để PayOS biết bạn đã nhận được webhook
    return res.status(200).json({
      success: true,
      message: "Webhook received successfully",
    });
  } catch (error) {
    console.error("Webhook verification failed:", error);
    // Nếu xác thực thất bại, không xử lý và trả lỗi
    return res.status(400).json({
      success: false,
      message: "Webhook verification failed",
    });
  }
};

export const checkPaymentStatus = async (req, res, next) => {
  try {
    const { paymentLinkId } = req.params;
    if (!paymentLinkId) {
      return res.status(400).json({ message: "Cần cung cấp paymentLinkId." });
    }

    // Gọi API của PayOS để lấy thông tin đơn hàng
    const paymentInfo = await payos.getPaymentLinkInformation(paymentLinkId);

    if (!paymentInfo) {
      return res.status(404).json({ message: "Không tìm thấy thông tin thanh toán." });
    }

    res.status(200).json({ message: "Lấy thông tin thành công", data: paymentInfo });
  } catch (error) {
    console.error("Error checking payment status:", error);
    next(error);
  }
};

// Kiểm tra trạng thái thanh toán theo booking ID
export const checkBookingPaymentStatus = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    
    if (!bookingId) {
      return res.status(400).json({ message: "Cần cung cấp bookingId." });
    }

    // Tìm booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy booking." });
    }

    // Kiểm tra quyền truy cập
    if (booking.user_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Bạn không có quyền xem booking này." });
    }

    // Nếu có payment_link_id, kiểm tra trạng thái từ PayOS
    let paymentInfo = null;
    if (booking.payment_link_id) {
      try {
        paymentInfo = await payos.getPaymentLinkInformation(booking.payment_link_id);
      } catch (error) {
        console.error("Error getting payment info from PayOS:", error);
      }
    }

    res.status(200).json({
      message: "Lấy thông tin thành công",
      data: {
        booking: {
          _id: booking._id,
          status: booking.status,
          payment_status: booking.payment_status,
          payment_method: booking.payment_method,
          total_price: booking.total_price,
          paid_amount: booking.paid_amount,
          order_code: booking.order_code,
          payment_link_id: booking.payment_link_id
        },
        paymentInfo: paymentInfo
      }
    });
  } catch (error) {
    console.error("Error checking booking payment status:", error);
    next(error);
  }
};
