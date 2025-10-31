import Review from '../models/review.js';
import Movie from '../models/movie.js';
import Booking from '../models/booking.js';
import mongoose from 'mongoose';

// Helper function to recalculate a movie's average rating
const updateMovieRating = async (movieId) => {
  const stats = await Review.aggregate([
    { $match: { movie_id: new mongoose.Types.ObjectId(movieId), status: 'approved' } },
    {
      $group: {
        _id: '$movie_id',
        average_rating: { $avg: '$rating' },
        review_count: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await Movie.findByIdAndUpdate(movieId, {
      average_rating: stats[0].average_rating,
      review_count: stats[0].review_count
    });
  } else {
    // If no reviews are left, reset the rating
    await Movie.findByIdAndUpdate(movieId, {
      average_rating: 0,
      review_count: 0
    });
  }
};

/**
 * @desc    Create a new review
 * @route   POST /api/reviews
 * @access  Private (Customer)
 */
export const createReview = async (req, res, next) => {
  try {
    const { movie_id, rating, comment } = req.body;
    const user_id = req.user._id;

    // 1. Check if user has a confirmed booking for this movie
    const hasBooked = await Booking.exists({
      user_id,
      status: 'confirmed',
      'showtime_id.movie_id': movie_id // This requires populating showtime's movie
    });

    // A simpler check if you don't want to populate deeply:
    const bookings = await Booking.find({ user_id, status: 'confirmed' }).populate({
        path: 'showtime_id',
        select: 'movie_id'
    });
    const hasWatchedMovie = bookings.some(b => b.showtime_id.movie_id.toString() === movie_id);

    if (!hasWatchedMovie) {
      return res.status(403).json({ message: "Bạn cần đặt vé và xem phim này trước khi đánh giá." });
    }

    // 2. Check if user has already reviewed this movie
    const existingReview = await Review.findOne({ movie_id, user_id });
    if (existingReview) {
      return res.status(400).json({ message: "Bạn đã đánh giá bộ phim này rồi." });
    }

    // 3. Create new review
    const review = await Review.create({
      movie_id,
      user_id,
      rating,
      comment
    });

    // 4. Update movie's average rating
    await updateMovieRating(movie_id);

    res.status(201).json({ message: "Đánh giá của bạn đã được ghi nhận. Cảm ơn bạn!", data: review });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get reviews for a movie
 * @route   GET /api/reviews/movie/:movieId
 * @access  Public
 */
export const getReviewsByMovie = async (req, res, next) => {
  try {
    const { movieId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [reviews, totalCount] = await Promise.all([
      Review.find({ movie_id: movieId, status: 'approved' })
        .populate('user_id', 'full_name')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limitNum),
      Review.countDocuments({ movie_id: movieId, status: 'approved' })
    ]);

    res.status(200).json({
      message: "Lấy danh sách đánh giá thành công",
      data: reviews,
      page: pageNum,
      limit: limitNum,
      totalCount
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a review
 * @route   PUT /api/reviews/:reviewId
 * @access  Private (Owner of review)
 */
export const updateReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const user_id = req.user._id;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ message: "Không tìm thấy đánh giá." });
    }

    if (review.user_id.toString() !== user_id.toString()) {
      return res.status(403).json({ message: "Bạn không có quyền chỉnh sửa đánh giá này." });
    }

    review.rating = rating || review.rating;
    review.comment = comment || review.comment;
    await review.save();

    await updateMovieRating(review.movie_id);

    res.status(200).json({ message: "Cập nhật đánh giá thành công.", data: review });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a review
 * @route   DELETE /api/reviews/:reviewId
 * @access  Private (Owner or Admin)
 */
export const deleteReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const user = req.user;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ message: "Không tìm thấy đánh giá." });
    }

    // Allow owner or admin to delete
    if (review.user_id.toString() !== user._id.toString() && user.role !== 'admin') {
      return res.status(403).json({ message: "Bạn không có quyền xóa đánh giá này." });
    }

    await review.deleteOne();
    await updateMovieRating(review.movie_id);

    res.status(200).json({ message: "Xóa đánh giá thành công." });
  } catch (error) {
    next(error);
  }
};