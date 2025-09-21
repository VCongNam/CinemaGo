import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from parent directory
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

// Tạo transporter cho email
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Gửi email OTP
export const sendOTPEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'OTP Reset mật khẩu - CinemaGo',
      //chưa có logo
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 650px; margin: 0 auto; background: #f4f6fb; border-radius: 14px; box-shadow: 0 4px 24px rgba(0,0,0,0.07); padding: 0 0 32px 0;">
          <div style="background: linear-gradient(90deg, #007bff 0%, #00c6ff 100%); border-radius: 14px 14px 0 0; padding: 32px 0 24px 0; text-align: center;">
            <img src="https://placehold.co/600x400?text=CinemaGo" alt="CinemaGo Logo" style="width: 64px; height: 64px; margin-bottom: 12px;" />
            <h1 style="color: #fff; font-size: 2.1rem; margin: 0;">CinemaGo</h1>
            <p style="color: #e3f2fd; font-size: 1.1rem; margin: 8px 0 0 0;">Nền tảng đặt vé xem phim hiện đại</p>
          </div>
          <div style="padding: 32px 32px 24px 32px; background: #fff; border-radius: 0 0 14px 14px;">
            <h2 style="color: #222; text-align: center; font-size: 1.5rem; margin-bottom: 18px;">Yêu cầu đặt lại mật khẩu</h2>
            <p style="font-size: 16px; color: #444; margin-bottom: 18px; text-align: center;">
              Xin chào,<br>
              Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản CinemaGo của bạn. Để tiếp tục, vui lòng sử dụng mã OTP bên dưới để xác thực yêu cầu của bạn.
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <span style="font-size: 40px; font-weight: bold; color: #007bff; letter-spacing: 10px; background: #e3f2fd; padding: 20px 40px; border-radius: 12px; display: inline-block; box-shadow: 0 2px 8px rgba(0,123,255,0.08);">
                ${otp}
              </span>
            </div>
            <p style="font-size: 15px; color: #666; text-align: center; margin-bottom: 18px;">
              <strong>Lưu ý:</strong> Mã OTP này chỉ có hiệu lực trong vòng <span style="color: #007bff;">5 phút</span> kể từ khi nhận được email này.<br>
              Vui lòng không chia sẻ mã này với bất kỳ ai vì lý do bảo mật.
            </p>
            <div style="background: #f8f9fa; border-radius: 8px; padding: 18px 20px; margin: 24px 0;">
              <ul style="color: #888; font-size: 14px; margin: 0 0 0 18px; padding: 0;">
                <li>Hãy đảm bảo bạn là người thực hiện yêu cầu này.</li>
                <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này hoặc liên hệ với bộ phận hỗ trợ của chúng tôi.</li>
                <li>Để bảo vệ tài khoản, không cung cấp mã OTP cho bất kỳ ai.</li>
              </ul>
            </div>
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://cinemago.vn" style="display: inline-block; background: linear-gradient(90deg, #007bff 0%, #00c6ff 100%); color: #fff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 12px 32px; border-radius: 6px; margin-bottom: 12px; box-shadow: 0 2px 8px rgba(0,123,255,0.10);">
                Truy cập CinemaGo
              </a>
            </div>
          </div>
          <div style="text-align: center; margin-top: 24px; padding-bottom: 12px;">
            <p style="font-size: 13px; color: #aaa; margin: 0;">
              Nếu bạn cần hỗ trợ, vui lòng liên hệ <a href="mailto:support@cinemago.vn" style="color: #007bff; text-decoration: underline;">support@cinemago.vn</a>
            </p>
            <p style="font-size: 12px; color: #bbb; margin: 8px 0 0 0;">
              © 2025 CinemaGo. All rights reserved.<br>
              Ứng dụng đặt vé xem phim hàng đầu Việt Nam.
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${email}`);
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Không thể gửi email OTP');
  }
};

// Test kết nối email
export const testEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log('Email server connection verified');
    return true;
  } catch (error) {
    console.error('Email server connection failed:', error);
    return false;
  }
};
