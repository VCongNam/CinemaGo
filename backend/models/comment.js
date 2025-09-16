import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    movie_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Movie",
        required: true
    },
    content: {
        type: String,
        trim: true
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },
    status: {
        type: String,
        default: "active"
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// 1 user only one comment+rating per movie
commentSchema.index({ user_id: 1, movie_id: 1 }, { unique: true });

const Comment = mongoose.model("Comment", commentSchema);

export default Comment;


