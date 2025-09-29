import mongoose from "mongoose";
import Movie from "../models/movie.js";

const isValidObjectId = (id) => typeof id === "string" && id.match(/^[0-9a-fA-F]{24}$/);

export const validateCreateShowtime = async (req, res, next) => {
  try {
    const { movie_id, room_id, start_time, end_time, status } = req.body;
    // Validate and normalize status if provided
    if (status !== undefined) {
      if (typeof status !== "string") {
        errors.push({ field: "status", message: "status phải là chuỗi" });
      } else {
        const normalizedStatus = status.trim().toLowerCase();
        if (!["active", "inactive"].includes(normalizedStatus)) {
          errors.push({ field: "status", message: "status phải là 'active' hoặc 'inactive'" });
        } else {
          req.body.status = normalizedStatus;
        }
      }
    }
    const errors = [];

    if (!movie_id || !isValidObjectId(movie_id)) {
      errors.push({ field: "movie_id", message: "movie_id bắt buộc và phải là ObjectId hợp lệ" });
    }
    if (!room_id || !isValidObjectId(room_id)) {
      errors.push({ field: "room_id", message: "room_id bắt buộc và phải là ObjectId hợp lệ" });
    }
    if (!start_time) {
      errors.push({ field: "start_time", message: "start_time là bắt buộc" });
    } else if (isNaN(Date.parse(start_time))) {
      errors.push({ field: "start_time", message: "start_time phải là ngày hợp lệ" });
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: "Dữ liệu không hợp lệ", errors });
    }

    // Normalize times
    const normalizedStart = new Date(start_time);

    // If end_time not provided, compute from movie.duration (minutes)
    let normalizedEnd = null;
    if (end_time !== undefined && end_time !== null && String(end_time).trim() !== "") {
      if (isNaN(Date.parse(end_time))) {
        return res.status(400).json({ message: "end_time phải là ngày hợp lệ" });
      }
      normalizedEnd = new Date(end_time);
    } else {
      // fetch movie duration
      const movie = await Movie.findById(movie_id).select("duration");
      if (!movie) {
        return res.status(404).json({ message: "Không tìm thấy phim" });
      }
      const minutes = Number(movie.duration);
      if (!Number.isFinite(minutes) || minutes <= 0) {
        return res.status(400).json({ message: "Thời lượng phim không hợp lệ" });
      }
      normalizedEnd = new Date(normalizedStart.getTime() + minutes * 60 * 1000);
    }

    if (normalizedEnd <= normalizedStart) {
      return res.status(400).json({ message: "end_time phải lớn hơn start_time" });
    }

    req.body.start_time = normalizedStart;
    req.body.end_time = normalizedEnd;

    next();
  } catch (err) {
    next(err);
  }
};

export const validateUpdateShowtime = async (req, res, next) => {
  try {
    const { movie_id, room_id, start_time, end_time, status } = req.body;
    const errors = [];

    if (movie_id !== undefined && !isValidObjectId(movie_id)) {
      errors.push({ field: "movie_id", message: "movie_id phải là ObjectId hợp lệ" });
    }
    if (room_id !== undefined && !isValidObjectId(room_id)) {
      errors.push({ field: "room_id", message: "room_id phải là ObjectId hợp lệ" });
    }
    let normalizedStart = undefined;
    let normalizedEnd = undefined;
    if (start_time !== undefined) {
      if (isNaN(Date.parse(start_time))) {
        errors.push({ field: "start_time", message: "start_time phải là ngày hợp lệ" });
      } else {
        normalizedStart = new Date(start_time);
      }
    }
    if (end_time !== undefined) {
      if (isNaN(Date.parse(end_time))) {
        errors.push({ field: "end_time", message: "end_time phải là ngày hợp lệ" });
      } else {
        normalizedEnd = new Date(end_time);
      }
    }
    if (status !== undefined) {
      if (typeof status !== "string") {
        errors.push({ field: "status", message: "status phải là chuỗi" });
      } else {
        const normalizedStatus = status.trim().toLowerCase();
        if (!["active", "inactive"].includes(normalizedStatus)) {
          errors.push({ field: "status", message: "status phải là 'active' hoặc 'inactive'" });
        } else {
          req.body.status = normalizedStatus;
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: "Dữ liệu không hợp lệ", errors });
    }

    if (normalizedStart && normalizedEnd && normalizedEnd <= normalizedStart) {
      return res.status(400).json({ message: "end_time phải lớn hơn start_time" });
    }

    if (normalizedStart) req.body.start_time = normalizedStart;
    if (normalizedEnd) req.body.end_time = normalizedEnd;

    next();
  } catch (err) {
    next(err);
  }
};


