import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    showtime_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Showtime",
        required: true
    },
    total_price: {
        type: mongoose.Schema.Types.Decimal128,
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "confirmed", "cancelled"],
        default: "pending"
    },
    payment_method: {
        type: String,
        enum: ["online", "cash"],
        required: true
    },
    payment_status: {
        type: String,
        enum: ["pending", "success", "failed"],
        default: "pending"
    },
    paid_amount: {
        type: mongoose.Schema.Types.Decimal128,
        default: 0
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
