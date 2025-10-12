import mongoose from "mongoose";
import Movie from "../models/movie.js";
import Showtime from "../models/showtime.js";
import { toVietnamTime, getCurrentVietnamTime, formatVietnamTime, getDayRangeVietnam } from '../utils/timezone.js';

const isValidObjectId = (id) => typeof id === "string" && id.match(/^[0-9a-fA-F]{24}$/);

export const validateCreateShowtime = async (req, res, next) => {
  try {
    const { movie_id, room_id, date, time, status } = req.body;
    const errors = [];

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

    if (!movie_id || !isValidObjectId(movie_id)) {
      errors.push({ field: "movie_id", message: "movie_id bắt buộc và phải là ObjectId hợp lệ" });
    }
    if (!room_id || !isValidObjectId(room_id)) {
      errors.push({ field: "room_id", message: "room_id bắt buộc và phải là ObjectId hợp lệ" });
    }
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      errors.push({ field: "date", message: "date là bắt buộc và phải có định dạng YYYY-MM-DD" });
    }
    if (!time || !/^\d{2}:\d{2}$/.test(time)) {
      errors.push({ field: "time", message: "time là bắt buộc và phải có định dạng HH:MM" });
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: "Dữ liệu không hợp lệ", errors });
    }

    // Combine date and time to create start_time
    // The input is Vietnam time, so we append the Vietnam timezone offset (+07:00)
    const startTimeString = `${date}T${time}:00.000+07:00`;
    const vietnamStartTime = new Date(startTimeString);

    if (isNaN(vietnamStartTime.getTime())) {
      return res.status(400).json({ message: "Date hoặc time không hợp lệ" });
    }

    // Get current time for validation
    const currentVietnamTime = getCurrentVietnamTime();

    // Check if start_time is in the past (allow at least 1 hour in advance)
    const oneHourFromNow = new Date(currentVietnamTime.getTime() + 60 * 60 * 1000);
    if (vietnamStartTime < oneHourFromNow) {
      return res.status(400).json({ 
        message: "Thời gian bắt đầu phải ít nhất 1 giờ từ bây giờ" 
      });
    }

    // Compute end_time from movie.duration (minutes)
    const movie = await Movie.findById(movie_id).select("duration");
    if (!movie) {
      return res.status(404).json({ message: "Không tìm thấy phim" });
    }
    const minutes = Number(movie.duration);
    if (!Number.isFinite(minutes) || minutes <= 0) {
      return res.status(400).json({ message: "Thời lượng phim không hợp lệ" });
    }
    const normalizedEnd = new Date(vietnamStartTime.getTime() + minutes * 60 * 1000);

    req.body.start_time = vietnamStartTime;
    req.body.end_time = normalizedEnd;

    next();
  } catch (err) {
    next(err);
  }
};

export const validateUpdateShowtime = async (req, res, next) => {
  try {
    const { movie_id, room_id, date, time, status } = req.body;
    const errors = [];

    if (movie_id !== undefined && !isValidObjectId(movie_id)) {
      errors.push({ field: "movie_id", message: "movie_id phải là ObjectId hợp lệ" });
    }
    if (room_id !== undefined && !isValidObjectId(room_id)) {
      errors.push({ field: "room_id", message: "room_id phải là ObjectId hợp lệ" });
    }
    if (date !== undefined && (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date))) {
      errors.push({ field: "date", message: "date phải có định dạng YYYY-MM-DD" });
    }
    if (time !== undefined && (!time || !/^\d{2}:\d{2}$/.test(time))) {
      errors.push({ field: "time", message: "time phải có định dạng HH:MM" });
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

    if (date && time) {
      const startTimeString = `${date}T${time}:00.000+07:00`;
      const vietnamStartTime = new Date(startTimeString);

      if (isNaN(vietnamStartTime.getTime())) {
        return res.status(400).json({ message: "Date hoặc time không hợp lệ" });
      }

      const currentVietnamTime = getCurrentVietnamTime();

      const oneHourFromNow = new Date(currentVietnamTime.getTime() + 60 * 60 * 1000);
      if (vietnamStartTime < oneHourFromNow) {
        return res.status(400).json({ 
          message: "Thời gian bắt đầu phải ít nhất 1 giờ từ bây giờ" 
        });
      }

      // Use the movie_id from the request, or fall back to the existing one if not provided
      const targetMovieId = movie_id || (await Showtime.findById(req.params.id).select("movie_id")).movie_id;
      const movie = await Movie.findById(targetMovieId).select("duration");
      if (!movie) {
        return res.status(404).json({ message: "Không tìm thấy phim" });
      }
      const minutes = Number(movie.duration);
      if (!Number.isFinite(minutes) || minutes <= 0) {
        return res.status(400).json({ message: "Thời lượng phim không hợp lệ" });
      }
      const normalizedEnd = new Date(vietnamStartTime.getTime() + minutes * 60 * 1000);

      req.body.start_time = vietnamStartTime;
      req.body.end_time = normalizedEnd;
    }

    next();
  } catch (err) {
    next(err);
  }
};
