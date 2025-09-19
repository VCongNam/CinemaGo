import mongoose from "mongoose";

const movieSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    duration: {
        type: Number,
        required: true
    },
    genre: {
        type: String,
        trim: true
    },
    release_date: {
        type: Date
    },
    trailer_url: {
        type: String,
        trim: true
    },
    poster_url: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        default: "active"
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const Movie = mongoose.model("Movie", movieSchema);

export default Movie;


