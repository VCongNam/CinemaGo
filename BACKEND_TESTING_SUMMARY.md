# CinemaGo PayOS Backend Testing Summary

## 📁 Files đã tạo cho Backend Testing

### 1. **POSTMAN_TESTING_GUIDE.md**
- Hướng dẫn chi tiết test PayOS Backend integration
- 10 bước test hoàn chỉnh từ login đến webhook
- Error handling và troubleshooting
- Backend API endpoints summary

### 2. **CinemaGo_PayOS_Testing.postman_collection.json**
- Collection Postman đầy đủ cho Backend testing
- Auto-save variables (token, bookingId, paymentLinkId)
- Test scripts để extract data từ responses
- Bao gồm cả user và admin endpoints

### 3. **CinemaGo_Environment.postman_environment.json**
- Environment template cho Postman
- Các biến cần thiết: baseUrl, token, bookingId, paymentLinkId, orderCode

### 4. **QUICK_TEST_STEPS.md**
- Hướng dẫn test nhanh 7 bước
- Setup trong 5 phút
- Backend testing tips
- Troubleshooting nhanh

### 5. **PAYOS_SETUP.md**
- Hướng dẫn cấu hình PayOS từ đầu
- Biến môi trường cần thiết
- Webhook configuration
- Production deployment guide

### 6. **PAYOS_FIX_GUIDE.md**
- Hướng dẫn sửa lỗi PayOS import
- Các cách import PayOS package
- Troubleshooting chi tiết

---

## 🚀 Backend API Endpoints đã test

### Authentication
- `POST /login` - User login
- `POST /register` - User registration
- `POST /admin/login` - Admin login

### Booking Management
- `POST /api/bookings` - Create booking
- `GET /api/bookings/my-bookings` - Get user bookings
- `GET /api/bookings/:id` - Get booking details
- `GET /api/bookings` - Get all bookings (Admin)
- `PATCH /api/bookings/:id/status` - Update booking status (Admin)
- `DELETE /api/bookings/:id` - Cancel booking

### Payment Integration
- `POST /api/payments/create-payment-link` - Create PayOS payment link
- `POST /api/payments/webhook` - PayOS webhook handler
- `GET /api/payments/check/:paymentLinkId` - Check payment link status
- `GET /api/payments/booking/:bookingId/status` - Check booking payment status

---

## 🧪 Test Scenarios đã cover

### ✅ Happy Path
1. User login → Create booking → Create payment link → Webhook success
2. Admin login → Get all bookings → Update booking status

### ✅ Error Handling
1. Invalid booking ID
2. Missing parameters
3. Unauthorized access
4. Invalid payment data

### ✅ Webhook Scenarios
1. Payment success (code: "00")
2. Payment failed (code: "07")
3. Payment cancelled (code: "24")

### ✅ Authorization Testing
1. User permissions (own bookings only)
2. Admin permissions (all bookings)
3. Role-based access control

---

## 🔧 Backend Configuration

### Environment Variables cần thiết
```env
# PayOS Configuration
PAYOS_CLIENT_ID=your_client_id
PAYOS_API_KEY=your_api_key
PAYOS_CHECKSUM_KEY=your_checksum_key
FRONTEND_URL=http://localhost:3000

# Database
MONGO_URI=mongodb://localhost:27017/cinemago

# JWT
JWT_SECRET=your_jwt_secret
```

### Database Schema
- **Booking**: order_code, payment_link_id, payment_status, status
- **BookingSeat**: Liên kết booking với seats
- **User**: Authentication và authorization

---

## 📊 Expected Results

### Payment Link Creation
```json
{
  "message": "Tạo link thanh toán thành công",
  "data": {
    "paymentLink": "https://pay.payos.vn/web/...",
    "paymentLinkId": "1234567890",
    "orderCode": 123456,
    "amount": 240000
  }
}
```

### Webhook Success Response
```json
{
  "success": true,
  "message": "Webhook received successfully"
}
```

### Booking sau webhook
```json
{
  "booking": {
    "status": "confirmed",
    "payment_status": "success",
    "order_code": 123456,
    "payment_link_id": "1234567890"
  }
}
```

---

## 🎯 Next Steps

1. **Setup PayOS Account**: Tạo tài khoản PayOS và lấy API keys
2. **Configure Environment**: Cập nhật file .env với PayOS credentials
3. **Test Backend**: Sử dụng Postman collection để test toàn bộ flow
4. **Verify Database**: Kiểm tra data được lưu đúng trong MongoDB
5. **Production Deploy**: Cấu hình webhook URL và deploy production

---

## 🆘 Support

Nếu gặp vấn đề:
1. Kiểm tra `PAYOS_FIX_GUIDE.md` cho lỗi import
2. Kiểm tra `POSTMAN_TESTING_GUIDE.md` cho test flow
3. Kiểm tra logs server để debug
4. Verify biến môi trường PayOS
