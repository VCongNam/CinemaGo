import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/user.js";

export const configurePassport = () => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/auth/google/callback", // Phải khớp với route và cấu hình trên Google Cloud Console
        scope: ["profile", "email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error("Không thể lấy email từ Google."), null);
          }

          // 1. Tìm người dùng bằng googleId
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            return done(null, user); // Người dùng đã tồn tại, trả về user
          }

          // 2. Nếu không có, tìm bằng email để liên kết tài khoản
          user = await User.findOne({ email });
          if (user) {
            user.googleId = profile.id; // Liên kết googleId
            await user.save();
            return done(null, user);
          }

          // 3. Nếu không tìm thấy, tạo người dùng mới
          const newUser = await User.create({
            googleId: profile.id,
            email: email,
            full_name: profile.displayName,
            username: email, // Hoặc tạo username ngẫu nhiên/duy nhất
            role: "customer", // Mặc định là khách hàng
          });
          return done(null, newUser);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
};