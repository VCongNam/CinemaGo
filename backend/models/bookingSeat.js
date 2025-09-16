import mongoose from "mongoose";

const bookingSeatSchema = new mongoose.Schema({
    booking_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
        required: true
    },
    seat_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Seat",
        required: true
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

bookingSeatSchema.index({ booking_id: 1, seat_id: 1 }, { unique: true });

const BookingSeat = mongoose.model("BookingSeat", bookingSeatSchema);

export default BookingSeat;


