import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
    theater_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Theater",
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        default: "active"
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const Room = mongoose.model("Room", roomSchema);

export default Room;


