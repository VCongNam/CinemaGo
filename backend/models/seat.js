import mongoose from "mongoose";

const seatSchema = new mongoose.Schema({
    room_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room",
        required: true
    },
    seat_number: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ["normal", "vip"],
        default: "normal"
    },
    base_price: {
        type: mongoose.Schema.Types.Decimal128,
        required: true
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

seatSchema.index({ room_id: 1, seat_number: 1 }, { unique: true });

const Seat = mongoose.model("Seat", seatSchema);

export default Seat;


