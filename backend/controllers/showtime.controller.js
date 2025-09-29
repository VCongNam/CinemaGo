import Showtime from "../models/showtime.js";
import Movie from "../models/movie.js";

// Helper: check overlap for a room between [start,end)
const hasOverlap = async ({ roomId, startTime, endTime, excludeId = null }) => {
  const query = {
    room_id: roomId,
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
    const { room_id, movie_id, date } = req.body || {};
    const filter = {};
    if (room_id) filter.room_id = room_id;
    if (movie_id) filter.movie_id = movie_id;
    if (date) {
      const d = new Date(date);
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
      filter.start_time = { $gte: startOfDay, $lt: endOfDay };
    }

    const items = await Showtime.find(filter)
      .populate("movie_id", "title duration poster_url status")
      .populate("room_id", "name theater_id status")
      .sort({ start_time: 1 });
    res.json({ success: true, data: items });
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
    res.json({ success: true, data: st });
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

    const overlap = await hasOverlap({ roomId: room_id, startTime: new Date(start_time), endTime: new Date(end_time) });
    if (overlap) {
      return res.status(409).json({ message: "Trùng lịch: Phòng đã có suất chiếu trong khung giờ này" });
    }

    const created = await Showtime.create({ movie_id, room_id, start_time, end_time, status });
    const populated = await created
      .populate("movie_id", "title duration poster_url status")
      .populate("room_id", "name theater_id status");
    res.status(201).json({ success: true, data: populated });
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
    const nextStart = update.start_time ? new Date(update.start_time) : existing.start_time;
    const nextEnd = update.end_time ? new Date(update.end_time) : existing.end_time;

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
    res.json({ success: true, data: populated });
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
    const updated = await Showtime.findByIdAndUpdate(
      id,
      { status: normalizedStatus },
      { new: true }
    )
      .populate("movie_id", "title duration poster_url status")
      .populate("room_id", "name theater_id status");
    if (!updated) return res.status(404).json({ message: "Không tìm thấy suất chiếu" });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};


