import payos from "../utils/payos.js";
// Giả sử bạn có model Order để quản lý đơn hàng
// import Order from "../models/order.js"; 

export const createPaymentLink = async (req, res, next) => {
  try {
    // Trong thực tế, bạn sẽ lấy thông tin đơn hàng từ req.body hoặc từ DB
    // Ví dụ: const order = await Order.findById(req.body.orderId);
    const orderCode = parseInt(String(Date.now()).slice(-6)); // Tạo mã đơn hàng ngẫu nhiên

    const paymentData = {
      orderCode: orderCode,
      amount: 2000, // Số tiền thanh toán
      description: `Thanh toan ve xem phim #${orderCode}`,
      returnUrl: `${process.env.FRONTEND_URL}/payment-success`, // URL trả về khi thanh toán thành công
      cancelUrl: `${process.env.FRONTEND_URL}/payment-failed`, // URL trả về khi hủy thanh toán
    };

    const paymentLink = await payos.createPaymentLink(paymentData);

    // Lưu thông tin đơn hàng và paymentLinkId vào DB của bạn ở đây
    // Ví dụ: await Order.create({ ...orderInfo, paymentLinkId: paymentLink.paymentLinkId });

    res.status(200).json({
      message: "Tạo link thanh toán thành công",
      data: paymentLink,
    });
  } catch (error) {
    console.error("Error creating payment link:", error);
    next(error);
  }
};

export const handlePayosWebhook = async (req, res, next) => {
  const webhookData = req.body;
  try {
    // Xác thực dữ liệu từ webhook
    const verifiedData = payos.verifyPaymentWebhookData(webhookData);

    // `verifiedData` sẽ chứa các thông tin như:
    // { orderCode, amount, description, paymentLinkId, status, transactionDateTime, ... }

    if (verifiedData.code === "00") {
      console.log(`Payment for order ${verifiedData.orderCode} was successful.`);
      // Tìm đơn hàng trong DB với verifiedData.orderCode
      // const order = await Order.findOne({ orderCode: verifiedData.orderCode });
      // if (order) {
      //   order.status = 'PAID';
      //   await order.save();
      //   // Gửi email xác nhận, tạo vé, etc.
      // }
    } else {
      console.log(`Payment for order ${verifiedData.orderCode} failed or was cancelled.`);
      // Cập nhật trạng thái thất bại cho đơn hàng
      // const order = await Order.findOne({ orderCode: verifiedData.orderCode });
      // if (order) {
      //   order.status = 'FAILED';
      //   await order.save();
      // }
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
