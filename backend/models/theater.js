import mongoose from "mongoose";

const theaterSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        default: "active"
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const Theater = mongoose.model("Theater", theaterSchema);

export default Theater;


