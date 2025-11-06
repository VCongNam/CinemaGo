# Hướng dẫn sửa lỗi PayOS Import

## 🚨 Lỗi: `PayOS is not a constructor`

### Nguyên nhân:
- Cách import PayOS package không đúng
- Phiên bản PayOS package có thể không tương thích
- Cấu hình module ES6

### 🔧 Các bước sửa lỗi:

#### Bước 1: Cập nhật PayOS package
```bash
cd backend
npm uninstall @payos/node
npm install @payos/node@latest
```

#### Bước 2: Kiểm tra file payos.js
Đảm bảo file `backend/utils/payos.js` có nội dung:
```javascript
import { PayOS } from "@payos/node";
import dotenv from "dotenv";

dotenv.config();

const payos = new PayOS(
  process.env.PAYOS_CLIENT_ID,
  process.env.PAYOS_API_KEY,
  process.env.PAYOS_CHECKSUM_KEY
);

export default payos;
```

#### Bước 3: Test PayOS import
Chạy file test:
```bash
node backend/test-payos.js
```

#### Bước 4: Nếu vẫn lỗi, thử cách import khác
Thay đổi `backend/utils/payos.js`:
```javascript
import * as PayOSModule from "@payos/node";
import dotenv from "dotenv";

dotenv.config();

// Try different import methods
const PayOS = PayOSModule.PayOS || PayOSModule.default || PayOSModule;

const payos = new PayOS(
  process.env.PAYOS_CLIENT_ID,
  process.env.PAYOS_API_KEY,
  process.env.PAYOS_CHECKSUM_KEY
);

export default payos;
```

#### Bước 5: Nếu vẫn lỗi, thử CommonJS
Thay đổi `backend/utils/payos.js`:
```javascript
const { PayOS } = require("@payos/node");
const dotenv = require("dotenv");

dotenv.config();

const payos = new PayOS(
  process.env.PAYOS_CLIENT_ID,
  process.env.PAYOS_API_KEY,
  process.env.PAYOS_CHECKSUM_KEY
);

module.exports = payos;
```

Và thay đổi `package.json`:
```json
{
  "type": "commonjs"
}
```

### 🧪 Test sau khi sửa:

1. **Test import:**
```bash
node backend/test-payos.js
```

2. **Test server:**
```bash
npm run dev
```

3. **Test API:**
```bash
# Test tạo payment link
curl -X POST http://localhost:5000/api/payments/create-payment-link \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"bookingId": "YOUR_BOOKING_ID"}'
```

### 📋 Checklist:

- [ ] PayOS package được cài đặt đúng phiên bản
- [ ] Import statement đúng syntax
- [ ] File .env có đầy đủ biến PayOS
- [ ] Server khởi động không lỗi
- [ ] Test API thành công

### 🆘 Nếu vẫn lỗi:

1. **Kiểm tra phiên bản Node.js:**
```bash
node --version
```
PayOS yêu cầu Node.js >= 14

2. **Clear cache:**
```bash
rm -rf node_modules package-lock.json
npm install
```

3. **Kiểm tra package.json:**
```json
{
  "type": "module"
}
```

4. **Thử phiên bản PayOS khác:**
```bash
npm install @payos/node@1.0.0
```

### 📞 Hỗ trợ:
Nếu vẫn gặp vấn đề, hãy:
1. Chạy `node backend/test-payos.js` và gửi output
2. Gửi error message đầy đủ
3. Gửi phiên bản Node.js và npm
