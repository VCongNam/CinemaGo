import Showtime from "../models/showtime.js";
import Movie from "../models/movie.js";
import Room from "../models/room.js";
import Booking from "../models/booking.js";
import BookingSeat from "../models/bookingSeat.js";
import { formatForAPI, formatVietnamTime, getDayRangeVietnam } from "../utils/timezone.js";

// Helper: check overlap for a room between [start,end)
const hasOverlap = async ({ roomId, startTime, endTime, excludeId = null }) => {
  const query = {
    room_id: roomId,
    status: "active", // Only check against active showtimes
    // overlap condition: existing.start < newEnd AND existing.end > newStart
    start_time: { $lt: endTime },
    end_time: { $gt: startTime }
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  const count = await Showtime.countDocuments(query);
  return count > 0;
};

export const listShowtimes = async (req, res, next) => {
  try {
    // Support both POST (body) and GET (query) filters
    const source = req.method === 'GET' ? (req.query || {}) : (req.body || {});
    const { room_id, movie_id, theater_id, date } = source;
    const filter = {};

    // Theater filter expands to rooms unless a specific room_id is provided
    if (theater_id && !room_id) {
      const rooms = await Room.find({ theater_id }).select("_id");
      const roomIds = rooms.map(r => r._id);
      if (roomIds.length === 0) {
        return res.json({ success: true, data: [] });
      }
      filter.room_id = { $in: roomIds };
    }

    if (room_id) filter.room_id = room_id;
    if (movie_id) filter.movie_id = movie_id;
    if (date) {
      const d = new Date(date);
      const dayRange = getDayRangeVietnam(d);
      filter.start_time = { $gte: new Date(dayRange.startOfDay), $lt: new Date(dayRange.endOfDay) };
    }

    const items = await Showtime.find(filter)
      .populate("movie_id", "title duration poster_url status")
      .populate("room_id", "name theater_id status")
      .sort({ start_time: 1 });
    
    // Format dates to Vietnam timezone
    const formattedItems = items.map(item => {
      const itemObj = item.toObject();
      if (itemObj.start_time) {
        itemObj.start_time = formatForAPI(itemObj.start_time);
      }
      if (itemObj.end_time) {
        itemObj.end_time = formatForAPI(itemObj.end_time);
      }
      if (itemObj.created_at) {
        itemObj.created_at = formatForAPI(itemObj.created_at);
      }
      if (itemObj.updated_at) {
        itemObj.updated_at = formatForAPI(itemObj.updated_at);
      }
      return itemObj;
    });
    
    res.json({ success: true, data: formattedItems });
  } catch (err) {
    next(err);
  }
};

// GET /api/showtimes/theater/:theaterId/movie/:movieId
export const getShowtimesByTheaterAndMovie = async (req, res, next) => {
  try {
    const { theaterId, movieId } = req.params;
    const { date } = req.query || {};

    const rooms = await Room.find({ theater_id: theaterId }).select("_id");
    const roomIds = rooms.map(r => r._id);
    if (roomIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const filter = { room_id: { $in: roomIds }, movie_id: movieId };
    if (date) {
      const d = new Date(date);
      const dayRange = getDayRangeVietnam(d);
      filter.start_time = { $gte: new Date(dayRange.startOfDay), $lt: new Date(dayRange.endOfDay) };
    }

    const items = await Showtime.find(filter)
      .populate("movie_id", "title duration poster_url status")
      .populate("room_id", "name theater_id status")
      .sort({ start_time: 1 });

    const formatted = items.map(item => {
      const obj = item.toObject();
      if (obj.start_time) obj.start_time = formatForAPI(obj.start_time);
      if (obj.end_time) obj.end_time = formatForAPI(obj.end_time);
      if (obj.created_at) obj.created_at = formatForAPI(obj.created_at);
      if (obj.updated_at) obj.updated_at = formatForAPI(obj.updated_at);
      return obj;
    });

    res.json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
};

// GET /api/showtimes/theater/:theaterId/room/:roomId/movie/:movieId
export const getShowtimesByTheaterRoomAndMovie = async (req, res, next) => {
  try {
    const { theaterId, roomId, movieId } = req.params;
    const { date } = req.query || {};

    // Optional: ensure room belongs to theater
    const room = await Room.findOne({ _id: roomId, theater_id: theaterId }).select("_id theater_id");
    if (!room) {
      return res.json({ success: true, data: [] });
    }

    const filter = { room_id: roomId, movie_id: movieId };
    if (date) {
      const d = new Date(date);
      const dayRange = getDayRangeVietnam(d);
      filter.start_time = { $gte: new Date(dayRange.startOfDay), $lt: new Date(dayRange.endOfDay) };
    }

    const items = await Showtime.find(filter)
      .populate("movie_id", "title duration poster_url status")
      .populate("room_id", "name theater_id status")
      .sort({ start_time: 1 });

    const formatted = items.map(item => {
      const obj = item.toObject();
      if (obj.start_time) obj.start_time = formatForAPI(obj.start_time);
      if (obj.end_time) obj.end_time = formatForAPI(obj.end_time);
      if (obj.created_at) obj.created_at = formatForAPI(obj.created_at);
      if (obj.updated_at) obj.updated_at = formatForAPI(obj.updated_at);
      return obj;
    });

    res.json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
};

export const getShowtimeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const st = await Showtime.findById(id)
      .populate("movie_id", "title duration poster_url status")
      .populate("room_id", "name theater_id status");
    if (!st) return res.status(404).json({ message: "Không tìm thấy suất chiếu" });
    
    // Format dates to Vietnam timezone
    const stObj = st.toObject();
    if (stObj.start_time) {
      stObj.start_time = formatForAPI(stObj.start_time);
    }
    if (stObj.end_time) {
      stObj.end_time = formatForAPI(stObj.end_time);
    }
    if (stObj.created_at) {
      stObj.created_at = formatForAPI(stObj.created_at);
    }
    if (stObj.updated_at) {
      stObj.updated_at = formatForAPI(stObj.updated_at);
    }
    
    res.json({ success: true, data: stObj });
  } catch (err) {
    next(err);
  }
};

export const createShowtime = async (req, res, next) => {
  try {
    const { movie_id, room_id, start_time, end_time, status } = req.body;

    // Optional: ensure movie exists and active
    const movie = await Movie.findById(movie_id).select("status");
    if (!movie) return res.status(404).json({ message: "Không tìm thấy phim" });
    if (movie.status !== "active") return res.status(400).json({ message: "Phim không ở trạng thái active" });

    const overlap = await hasOverlap({ roomId: room_id, startTime: start_time, endTime: end_time });
    if (overlap) {
      return res.status(409).json({ message: "Trùng lịch: Phòng đã có suất chiếu trong khung giờ này" });
    }

    const created = await Showtime.create({ movie_id, room_id, start_time, end_time, status });
    const populated = await Showtime.findById(created._id)
      .populate("movie_id", "title duration poster_url status")
      .populate("room_id", "name theater_id status");
    
    // Format dates to Vietnam timezone
    const populatedObj = populated.toObject();
    if (populatedObj.start_time) {
      populatedObj.start_time = formatForAPI(populatedObj.start_time);
    }
    if (populatedObj.end_time) {
      populatedObj.end_time = formatForAPI(populatedObj.end_time);
    }
    if (populatedObj.created_at) {
      populatedObj.created_at = formatForAPI(populatedObj.created_at);
    }
    if (populatedObj.updated_at) {
      populatedObj.updated_at = formatForAPI(populatedObj.updated_at);
    }
    
    res.status(201).json({ success: true, data: populatedObj });
  } catch (err) {
    next(err);
  }
};

export const updateShowtime = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await Showtime.findById(id);
    if (!existing) return res.status(404).json({ message: "Không tìm thấy suất chiếu" });

    const update = { ...req.body };

    // If movie_id changes, we can optionally verify movie active
    if (update.movie_id) {
      const m = await Movie.findById(update.movie_id).select("status");
      if (!m) return res.status(404).json({ message: "Không tìm thấy phim" });
      if (m.status !== "active") return res.status(400).json({ message: "Phim không ở trạng thái active" });
    }

    const nextRoom = update.room_id || existing.room_id;
    const nextStart = update.start_time ? update.start_time : existing.start_time;
    const nextEnd = update.end_time ? update.end_time : existing.end_time;

    // overlap check excluding current id
    const overlap = await hasOverlap({ roomId: nextRoom, startTime: nextStart, endTime: nextEnd, excludeId: id });
    if (overlap) {
      return res.status(409).json({ message: "Trùng lịch: Phòng đã có suất chiếu trong khung giờ này" });
    }

    existing.set(update);
    await existing.save();
    const populated = await existing
      .populate("movie_id", "title duration poster_url status")
      .populate("room_id", "name theater_id status");
    
    // Format dates to Vietnam timezone
    const populatedObj = populated.toObject();
    if (populatedObj.start_time) {
      populatedObj.start_time = formatForAPI(populatedObj.start_time);
    }
    if (populatedObj.end_time) {
      populatedObj.end_time = formatForAPI(populatedObj.end_time);
    }
    if (populatedObj.created_at) {
      populatedObj.created_at = formatForAPI(populatedObj.created_at);
    }
    if (populatedObj.updated_at) {
      populatedObj.updated_at = formatForAPI(populatedObj.updated_at);
    }
    
    res.json({ success: true, data: populatedObj });
  } catch (err) {
    next(err);
  }
};

export const deleteShowtime = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await Showtime.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Không tìm thấy suất chiếu" });
    res.json({ success: true, message: "Xóa suất chiếu thành công" });
  } catch (err) {
    next(err);
  }
};

export const updateShowtimeStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || typeof status !== "string") {
      return res.status(400).json({ message: "status là bắt buộc và phải là chuỗi" });
    }
    const normalizedStatus = status.trim().toLowerCase();
    if (!["active", "inactive"].includes(normalizedStatus)) {
      return res.status(400).json({ message: "status phải là 'active' hoặc 'inactive'" });
    }

    // If activating, check for conflicts with other active showtimes
    if (normalizedStatus === "active") {
      const showtimeToActivate = await Showtime.findById(id);
      if (!showtimeToActivate) {
        return res.status(404).json({ message: "Không tìm thấy suất chiếu" });
      }

      const overlap = await hasOverlap({
        roomId: showtimeToActivate.room_id,
        startTime: showtimeToActivate.start_time,
        endTime: showtimeToActivate.end_time,
        excludeId: id
      });

      if (overlap) {
        return res.status(409).json({
          message: "Không thể kích hoạt suất chiếu. Lịch chiếu bị trùng với một suất chiếu khác đang hoạt động."
        });
      }
    }

    const updated = await Showtime.findByIdAndUpdate(
      id,
      { status: normalizedStatus },
      { new: true }
    )
      .populate("movie_id", "title duration poster_url status")
      .populate("room_id", "name theater_id status");
    if (!updated) return res.status(404).json({ message: "Không tìm thấy suất chiếu" });
    
    // Format dates to Vietnam timezone
    const updatedObj = updated.toObject();
    if (updatedObj.start_time) {
      updatedObj.start_time = formatForAPI(updatedObj.start_time);
    }
    if (updatedObj.end_time) {
      updatedObj.end_time = formatForAPI(updatedObj.end_time);
    }
    if (updatedObj.created_at) {
      updatedObj.created_at = formatForAPI(updatedObj.created_at);
    }
    if (updatedObj.updated_at) {
      updatedObj.updated_at = formatForAPI(updatedObj.updated_at);
    }
    
    res.json({ success: true, data: updatedObj });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Lấy danh sách các ghế đã được đặt của một suất chiếu
 * @route   GET /api/showtimes/:id/booked-seats
 * @access  Public
 */
export const getBookedSeatsForShowtime = async (req, res, next) => {
    try {
        const { id: showtimeId } = req.params;

        // 1. Find the showtime to make sure it exists
        const showtime = await Showtime.findById(showtimeId);
        if (!showtime) {
            return res.status(404).json({ message: 'Không tìm thấy suất chiếu.' });
        }

        // 2. Find all 'pending' or 'confirmed' bookings for this showtime
        const activeBookings = await Booking.find({
            showtime_id: showtimeId,
            status: { $in: ['pending', 'confirmed'] }
        }).select('_id');

        if (activeBookings.length === 0) {
            return res.status(200).json({
                showtime_id: showtimeId,
                booked_seats: []
            });
        }

        const bookingIds = activeBookings.map(b => b._id);

        // 3. Find all seat IDs associated with these active bookings
        const bookingSeats = await BookingSeat.find({
            booking_id: { $in: bookingIds }
        }).select('seat_id');

        const bookedSeatIds = bookingSeats.map(bs => bs.seat_id);

        res.status(200).json({
            showtime_id: showtimeId,
            booked_seats: bookedSeatIds
        });

    } catch (error) {
        next(error);
    }
};