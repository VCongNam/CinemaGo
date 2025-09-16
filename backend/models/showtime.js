import mongoose from "mongoose";

const showtimeSchema = new mongoose.Schema({
    movie_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Movie",
        required: true
    },
    room_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room",
        required: true
    },
    start_time: {
        type: Date,
        required: true
    },
    end_time: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        default: "active"
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const Showtime = mongoose.model("Showtime", showtimeSchema);

export default Showtime;


