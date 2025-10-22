# Hướng dẫn Test PayOS Backend Integration với Postman

## 1. Chuẩn bị

### 1.1 Thiết lập Environment trong Postman
Tạo environment mới với các biến:
```
baseUrl: http://localhost:5000
token: (sẽ lấy từ login)
bookingId: (sẽ lấy từ tạo booking)
paymentLinkId: (sẽ lấy từ tạo payment link)
orderCode: (sẽ lấy từ tạo payment link)
```

### 1.2 Cấu hình Headers mặc định
Trong Postman Settings, thêm default headers:
```
Content-Type: application/json
```

## 2. Test Flow hoàn chỉnh

### Bước 1: Đăng nhập để lấy token

**POST** `{{baseUrl}}/login`

**Body (raw JSON):**
```json
{
  "email": "your_email@example.com",
  "password": "your_password"
}
```

**Response:** Copy `token` từ response và set vào environment variable `token`

---

### Bước 2: Tạo booking (để test payment)

**POST** `{{baseUrl}}/api/bookings`

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "showtime_id": "65f8a1b2c3d4e5f6a7b8c9d0",
  "seat_ids": ["65f8a1b2c3d4e5f6a7b8c9d1", "65f8a1b2c3d4e5f6a7b8c9d2"],
  "payment_method": "online"
}
```

**Response:** Copy `booking._id` và set vào environment variable `bookingId`

---

### Bước 3: Tạo Payment Link với PayOS

**POST** `{{baseUrl}}/api/payments/create-payment-link`

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "bookingId": "{{bookingId}}"
}
```

**Response mẫu:**
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

**Lưu ý:** Copy `paymentLinkId` và set vào environment variable `paymentLinkId`

---

### Bước 4: Kiểm tra trạng thái booking sau khi tạo payment link

**GET** `{{baseUrl}}/api/bookings/{{bookingId}}`

**Headers:**
```
Authorization: Bearer {{token}}
```

**Kiểm tra:** Booking sẽ có thêm `order_code` và `payment_link_id`

---

### Bước 4.1: Kiểm tra danh sách booking của user

**GET** `{{baseUrl}}/api/bookings/my-bookings`

**Headers:**
```
Authorization: Bearer {{token}}
```

**Kiểm tra:** Booking mới xuất hiện trong danh sách với trạng thái `pending`

---

### Bước 5: Kiểm tra trạng thái thanh toán

**GET** `{{baseUrl}}/api/payments/booking/{{bookingId}}/status`

**Headers:**
```
Authorization: Bearer {{token}}
```

**Response mẫu:**
```json
{
  "message": "Lấy thông tin thành công",
  "data": {
    "booking": {
      "_id": "65f8a1b2c3d4e5f6a7b8c9d0",
      "status": "pending",
      "payment_status": "pending",
      "payment_method": "online",
      "total_price": "240000",
      "paid_amount": "0",
      "order_code": 123456,
      "payment_link_id": "1234567890"
    },
    "paymentInfo": null
  }
}
```

---

### Bước 6: Test kiểm tra payment link trực tiếp từ PayOS

**GET** `{{baseUrl}}/api/payments/check/{{paymentLinkId}}`

**Response mẫu:**
```json
{
  "message": "Lấy thông tin thành công",
  "data": {
    "id": "1234567890",
    "orderCode": 123456,
    "amount": 240000,
    "description": "Thanh toán vé xem phim - Booking #65f8a1b2c3d4e5f6a7b8c9d0",
    "status": "PENDING",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### Bước 7: Test tất cả booking (Admin only)

**GET** `{{baseUrl}}/api/bookings`

**Headers:**
```
Authorization: Bearer {{token}}
```

**Lưu ý:** Chỉ admin mới có quyền truy cập endpoint này

---

## 3. Test Webhook (Simulation)

### Bước 8: Simulate Webhook từ PayOS

**POST** `{{baseUrl}}/api/payments/webhook`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON) - Payment Success:**
```json
{
  "code": "00",
  "desc": "success",
  "data": {
    "orderCode": 123456,
    "amount": 240000,
    "description": "Thanh toán vé xem phim - Booking #65f8a1b2c3d4e5f6a7b8c9d0",
    "accountNumber": "1234567890",
    "reference": "PAYOS_REF_123456",
    "transactionDateTime": "2024-01-15T10:35:00Z",
    "currency": "VND",
    "paymentLinkId": "1234567890",
    "code": "00",
    "desc": "success",
    "counterAccountBankId": "970422",
    "counterAccountBankName": "Ngân hàng TMCP Kỹ thương Việt Nam",
    "counterAccountName": "NGUYEN VAN A",
    "counterAccountNumber": "1234567890",
    "virtualAccountName": null,
    "virtualAccountNumber": null
  },
  "signature": "mock_signature_for_testing"
}
```

**Body (raw JSON) - Payment Failed:**
```json
{
  "code": "07",
  "desc": "failed",
  "data": {
    "orderCode": 123456,
    "amount": 240000,
    "description": "Thanh toán vé xem phim - Booking #65f8a1b2c3d4e5f6a7b8c9d0",
    "paymentLinkId": "1234567890",
    "code": "07",
    "desc": "failed",
    "transactionDateTime": "2024-01-15T10:35:00Z"
  },
  "signature": "mock_signature_for_testing"
}
```

---

### Bước 9: Kiểm tra booking sau webhook

**GET** `{{baseUrl}}/api/bookings/{{bookingId}}`

**Headers:**
```
Authorization: Bearer {{token}}
```

**Kiểm tra:** 
- Nếu webhook success: `payment_status` = "success", `status` = "confirmed"
- Nếu webhook failed: `payment_status` = "failed", `status` = "cancelled"

---

### Bước 10: Test cập nhật booking status (Admin only)

**PATCH** `{{baseUrl}}/api/bookings/{{bookingId}}/status`

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body:**
```json
{
  "status": "confirmed",
  "payment_status": "success"
}
```

**Lưu ý:** Chỉ admin mới có quyền cập nhật trạng thái booking

---

## 4. Test Error Cases

### Test 4.1: Tạo payment link với booking không tồn tại

**POST** `{{baseUrl}}/api/payments/create-payment-link`

**Body:**
```json
{
  "bookingId": "invalid_booking_id"
}
```

**Expected Response:**
```json
{
  "message": "Không tìm thấy booking"
}
```

### Test 4.2: Tạo payment link không có bookingId

**POST** `{{baseUrl}}/api/payments/create-payment-link`

**Body:**
```json
{}
```

**Expected Response:**
```json
{
  "message": "Booking ID là bắt buộc"
}
```

### Test 4.3: Test với booking đã thanh toán

**POST** `{{baseUrl}}/api/payments/create-payment-link`

**Body:**
```json
{
  "bookingId": "{{bookingId}}"
}
```

**Expected Response:** (nếu booking đã confirmed)
```json
{
  "message": "Booking không ở trạng thái pending"
}
```

---

## 5. Backend API Endpoints Summary

### Authentication Endpoints
- `POST /login` - Đăng nhập user
- `POST /register` - Đăng ký user mới
- `POST /admin/login` - Đăng nhập admin

### Booking Endpoints
- `POST /api/bookings` - Tạo booking mới
- `GET /api/bookings/my-bookings` - Lấy danh sách booking của user
- `GET /api/bookings/:id` - Lấy chi tiết booking
- `GET /api/bookings` - Lấy tất cả booking (Admin only)
- `PATCH /api/bookings/:id/status` - Cập nhật trạng thái booking (Admin only)
- `DELETE /api/bookings/:id` - Hủy booking

### Payment Endpoints
- `POST /api/payments/create-payment-link` - Tạo payment link với PayOS
- `POST /api/payments/webhook` - Webhook từ PayOS
- `GET /api/payments/check/:paymentLinkId` - Kiểm tra trạng thái payment link
- `GET /api/payments/booking/:bookingId/status` - Kiểm tra trạng thái payment theo booking

### Admin Endpoints
- `GET /api/bookings` - Quản lý tất cả booking
- `PATCH /api/bookings/:id/status` - Cập nhật trạng thái booking
- `GET /api/bookings/user/:userId` - Lấy booking theo user ID

---

## 6. Backend Testing Tips

1. **Sử dụng Environment Variables** để dễ dàng switch giữa các môi trường
2. **Test theo thứ tự** từ Bước 1 đến Bước 10
3. **Lưu responses** để debug khi có lỗi
4. **Test cả success và failure cases**
5. **Kiểm tra database** sau mỗi bước để đảm bảo data được cập nhật đúng
6. **Test với cả user và admin roles** để đảm bảo authorization hoạt động đúng

## 7. Troubleshooting

- **401 Unauthorized**: Kiểm tra token có hợp lệ không
- **403 Forbidden**: Kiểm tra quyền truy cập (user vs admin)
- **404 Not Found**: Kiểm tra URL và booking ID
- **500 Internal Server Error**: Kiểm tra logs server và biến môi trường PayOS
- **Webhook không hoạt động**: Kiểm tra PAYOS_CHECKSUM_KEY

## 8. Database Verification

Sau khi test, kiểm tra database để đảm bảo:
- Booking được tạo với đúng thông tin
- Payment link được lưu với `order_code` và `payment_link_id`
- Webhook cập nhật đúng `payment_status` và `status`
- Booking seats được tạo và liên kết đúng
