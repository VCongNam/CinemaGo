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
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; text-align: center;">Reset mật khẩu CinemaGo</h2>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="font-size: 16px; color: #666; margin-bottom: 20px;">
              Bạn đã yêu cầu reset mật khẩu cho tài khoản CinemaGo.
            </p>
            <p style="font-size: 16px; color: #666; margin-bottom: 10px;">
              Mã OTP của bạn là:
            </p>
            <div style="text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px; background-color: #e3f2fd; padding: 15px 25px; border-radius: 8px; display: inline-block;">
                ${otp}
              </span>
            </div>
            <p style="font-size: 14px; color: #999; text-align: center;">
              Mã này sẽ hết hạn sau 5 phút.
            </p>
          </div>
          <div style="text-align: center; margin-top: 30px;">
            <p style="font-size: 12px; color: #999;">
              Nếu bạn không yêu cầu reset mật khẩu, hãy bỏ qua email này.
            </p>
            <p style="font-size: 12px; color: #999;">
              © 2025 CinemaGo. All rights reserved.
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
