import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  movie_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie',
    required: true,
    index: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved' // Tự động duyệt
  }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Đảm bảo một người dùng chỉ có thể đánh giá một bộ phim một lần
reviewSchema.index({ movie_id: 1, user_id: 1 }, { unique: true });

const Review = mongoose.model("Review", reviewSchema);

export default Review;