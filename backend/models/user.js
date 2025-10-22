import mongoose from "mongoose";



const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: function() {
            // Mật khẩu không bắt buộc nếu người dùng đăng ký qua Google (hoặc các mạng xã hội khác)
            return !this.googleId;
        }
    },
    full_name: {
        type: String,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    date_of_birth: {
        type: Date
    },
    role: {
        type: String,
        enum: ["admin", "customer", "LV1", "LV2"],
        default: "customer"
    },
    status: {
        type: String,
        enum: ["active", "locked", "suspended"],
        default: "active"
    },
    reset_token: {
        type: String
    },
    reset_token_expires: {
        type: Date
    },
    otp_code: {
        type: String
    },
    otp_expires: {
        type: Date
    },
    otp_attempts: {
        type: Number,
        default: 0
    },
    googleId: {
        type: String
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const User = mongoose.model("User", userSchema);

export default User;