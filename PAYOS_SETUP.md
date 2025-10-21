# Hướng dẫn cấu hình PayOS cho CinemaGo

## 1. Tạo tài khoản PayOS

1. Truy cập [PayOS Dashboard](https://my.payos.vn/)
2. Đăng ký tài khoản PayOS
3. Xác thực tài khoản theo hướng dẫn

## 2. Lấy thông tin API

Sau khi đăng nhập vào PayOS Dashboard:

1. Vào **Settings** > **API Keys**
2. Copy các thông tin sau:
   - `PAYOS_CLIENT_ID`
   - `PAYOS_API_KEY` 
   - `PAYOS_CHECKSUM_KEY`

## 3. Cấu hình biến môi trường

Tạo file `.env` ở thư mục gốc của dự án với nội dung:

```env
# Database
MONGO_URI=mongodb://localhost:27017/cinemago

# JWT
JWT_SECRET=your_jwt_secret_here
ACCESS_TOKEN_EXPIRES=1h

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Frontend URL
FRONTEND_URL=http://localhost:3000

# PayOS Configuration
PAYOS_CLIENT_ID=your_payos_client_id
PAYOS_API_KEY=your_payos_api_key
PAYOS_CHECKSUM_KEY=your_payos_checksum_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## 4. Cấu hình Webhook

1. Trong PayOS Dashboard, vào **Settings** > **Webhooks**
2. Thêm webhook URL: `https://yourdomain.com/api/payments/webhook`
3. Chọn các events: `payment.success`, `payment.failed`, `payment.cancelled`

**Lưu ý:** 
- Thay `yourdomain.com` bằng domain thực tế của bạn
- Để test local, có thể sử dụng ngrok để tạo public URL

## 5. Test PayOS Integration

### 5.1 Test tạo payment link

```bash
POST /api/payments/create-payment-link
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
  "bookingId": "<booking_id>"
}
```

### 5.2 Test webhook

PayOS sẽ gửi webhook đến endpoint `/api/payments/webhook` khi có sự kiện thanh toán.

### 5.3 Test kiểm tra trạng thái

```bash
GET /api/payments/booking/<booking_id>/status
Authorization: Bearer <your_jwt_token>
```

## 6. Flow thanh toán hoàn chỉnh

1. **Tạo booking**: User tạo booking với `payment_method: "online"`
2. **Tạo payment link**: Gọi API tạo link thanh toán PayOS
3. **Redirect**: Chuyển hướng user đến trang thanh toán PayOS
4. **Thanh toán**: User thanh toán trên PayOS
5. **Webhook**: PayOS gửi webhook về server
6. **Cập nhật**: Server cập nhật trạng thái booking
7. **Redirect**: PayOS chuyển hướng user về success/failed page

## 7. Troubleshooting

### Lỗi thường gặp:

1. **Webhook không nhận được**: Kiểm tra URL webhook và firewall
2. **Payment link không tạo được**: Kiểm tra API keys
3. **Webhook verification failed**: Kiểm tra PAYOS_CHECKSUM_KEY

### Debug:

- Kiểm tra logs trong console để xem chi tiết lỗi
- Sử dụng PayOS Dashboard để xem trạng thái giao dịch
- Test với số tiền nhỏ trước khi deploy production

## 8. Production Deployment

1. Cập nhật `FRONTEND_URL` thành domain production
2. Cập nhật webhook URL thành domain production
3. Đảm bảo HTTPS được cấu hình đúng
4. Test kỹ trước khi go-live
