import Booking from '../models/booking.js';
import BookingSeat from '../models/bookingSeat.js';
import Showtime from '../models/showtime.js';
import Seat from '../models/seat.js';
import User from '../models/user.js';
import mongoose from 'mongoose';
import { formatForAPI } from '../utils/timezone.js';

// Create a new booking
export const createBooking = async (req, res) => {
    const { showtime_id, seat_ids, payment_method } = req.body;
    const user_id = req.user._id?.toString();

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const showtime = await Showtime.findById(showtime_id).session(session);
        if (!showtime) {
            throw new Error('Không tìm thấy suất chiếu');
        }

        const seats = await Seat.find({ _id: { $in: seat_ids }, room_id: showtime.room_id }).session(session);
        if (seats.length !== seat_ids.length) {
            throw new Error('Một hoặc nhiều ghế không hợp lệ đối với phòng của suất chiếu này');
        }

        // Kiểm tra ghế đã được đặt cho suất chiếu hay chưa
        const existingBookings = await Booking.find({ showtime_id, status: { $in: ['confirmed', 'pending'] } }).session(session);
        const existingBookingIds = existingBookings.map(b => b._id);
        const bookedSeats = await BookingSeat.find({ booking_id: { $in: existingBookingIds }, seat_id: { $in: seat_ids } }).session(session);

        if (bookedSeats.length > 0) {
            const bookedSeatIds = bookedSeats.map(bs => bs.seat_id.toString());
            const alreadyBooked = seat_ids.filter(id => bookedSeatIds.includes(id));
            throw new Error(`Ghế đã được đặt: ${alreadyBooked.join(', ')}`);
        }

        let totalPrice = 0;
        seats.forEach((seat) => {
            // seat.base_price is Decimal128; convert safely
            const priceNumber = typeof seat.base_price?.toString === 'function'
                ? parseFloat(seat.base_price.toString())
                : Number(seat.base_price);
            totalPrice += Number.isFinite(priceNumber) ? priceNumber : 0;
        });

        const newBooking = new Booking({
            user_id,
            showtime_id,
            total_price: totalPrice,
            payment_method,
            status: 'pending',
            payment_status: payment_method === 'cash' ? 'success' : 'pending'
        });

        const savedBooking = await newBooking.save({ session });

        const bookingSeats = seat_ids.map(seat_id => ({
            booking_id: savedBooking._id,
            seat_id: seat_id
        }));

        await BookingSeat.insertMany(bookingSeats, { session });

        await session.commitTransaction();
        res.status(201).json({ message: "Tạo đặt vé thành công", booking: savedBooking });
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ message: "Tạo đặt vé thất bại", error: error.message });
    } finally {
        session.endSession();
    }
};

// Get booking history for a user
export const getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user_id: req.user.id })
            .populate({
                path: 'showtime_id',
                populate: [
                    { path: 'movie_id' },
                    { 
                        path: 'room_id',
                        populate: {
                            path: 'theater_id'
                        }
                    }
                ]
            })
            .sort({ created_at: -1 });

        if (!bookings) {
            return res.status(404).json({ message: "Không tìm thấy đặt vé nào cho người dùng này" });
        }

        const formattedBookings = bookings.map(booking => {
            const bookingObj = booking.toObject();
            if (bookingObj.created_at) {
                bookingObj.created_at = formatForAPI(bookingObj.created_at);
            }
            if (bookingObj.updated_at) {
                bookingObj.updated_at = formatForAPI(bookingObj.updated_at);
            }
            if (bookingObj.showtime_id && bookingObj.showtime_id.start_time) {
                bookingObj.showtime_id.start_time = formatForAPI(bookingObj.showtime_id.start_time);
            }
            if (bookingObj.showtime_id && bookingObj.showtime_id.end_time) {
                bookingObj.showtime_id.end_time = formatForAPI(bookingObj.showtime_id.end_time);
            }
            return bookingObj;
        });

        res.status(200).json(formattedBookings);
    } catch (error) {
        res.status(500).json({ message: "Lấy danh sách đặt vé thất bại", error: error.message });
    }
};

// Create a new offline booking
export const createOfflineBooking = async (req, res) => {
    const { showtime_id, seat_ids, payment_method, phone } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const user = await User.findOne({ phone }).session(session);
        if (!user) {
            throw new Error('Không tìm thấy người dùng với số điện thoại này');
        }
        const user_id = user._id.toString();

        const showtime = await Showtime.findById(showtime_id).session(session);
        if (!showtime) {
            throw new Error('Không tìm thấy suất chiếu');
        }

        const seats = await Seat.find({ _id: { $in: seat_ids }, room_id: showtime.room_id }).session(session);
        if (seats.length !== seat_ids.length) {
            throw new Error('Một hoặc nhiều ghế không hợp lệ đối với phòng của suất chiếu này');
        }

        // Kiểm tra ghế đã được đặt cho suất chiếu hay chưa
        const existingBookings = await Booking.find({ showtime_id, status: { $in: ['confirmed', 'pending'] } }).session(session);
        const existingBookingIds = existingBookings.map(b => b._id);
        const bookedSeats = await BookingSeat.find({ booking_id: { $in: existingBookingIds }, seat_id: { $in: seat_ids } }).session(session);

        if (bookedSeats.length > 0) {
            const bookedSeatIds = bookedSeats.map(bs => bs.seat_id.toString());
            const alreadyBooked = seat_ids.filter(id => bookedSeatIds.includes(id));
            throw new Error(`Ghế đã được đặt: ${alreadyBooked.join(', ')}`);
        }

        let totalPrice = 0;
        seats.forEach((seat) => {
            const priceNumber = typeof seat.base_price?.toString === 'function'
                ? parseFloat(seat.base_price.toString())
                : Number(seat.base_price);
            totalPrice += Number.isFinite(priceNumber) ? priceNumber : 0;
        });

        const newBooking = new Booking({
            user_id,
            showtime_id,
            total_price: totalPrice,
            payment_method,
            status: 'pending',
            payment_status: payment_method === 'cash' ? 'success' : 'pending',
        });

        const savedBooking = await newBooking.save({ session });

        const bookingSeats = seat_ids.map(seat_id => ({
            booking_id: savedBooking._id,
            seat_id: seat_id
        }));

        await BookingSeat.insertMany(bookingSeats, { session });

        await session.commitTransaction();
        res.status(201).json({ message: "Tạo đặt vé thành công", booking: savedBooking });
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ message: "Tạo đặt vé thất bại", error: error.message });
    } finally {
        session.endSession();
    }
};

// Get details of a specific booking
export const getBookingDetails = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate({
                path: 'showtime_id',
                populate: [
                    { path: 'movie_id' },
                    { 
                        path: 'room_id',
                        populate: {
                            path: 'theater_id'
                        }
                    }
                ]
            })
            .populate('user_id', 'username email');

        if (!booking) {
            return res.status(404).json({ message: "Không tìm thấy đặt vé" });
        }

        // Kiểm tra quyền xem đặt vé
        if (booking.user_id._id.toString() !== req.user._id.toString() && req.user.role === 'customer') {
             return res.status(403).json({ message: "Bạn không có quyền xem đặt vé này" });
        }

        const bookingSeats = await BookingSeat.find({ booking_id: req.params.id }).populate('seat_id');

        const bookingObj = booking.toObject();
        if (bookingObj.created_at) {
            bookingObj.created_at = formatForAPI(bookingObj.created_at);
        }
        if (bookingObj.updated_at) {
            bookingObj.updated_at = formatForAPI(bookingObj.updated_at);
        }
        if (bookingObj.showtime_id && bookingObj.showtime_id.start_time) {
            bookingObj.showtime_id.start_time = formatForAPI(bookingObj.showtime_id.start_time);
        }
        if (bookingObj.showtime_id && bookingObj.showtime_id.end_time) {
            bookingObj.showtime_id.end_time = formatForAPI(bookingObj.showtime_id.end_time);
        }

        res.status(200).json({ booking: bookingObj, seats: bookingSeats });
    } catch (error) {
        res.status(500).json({ message: "Lấy chi tiết đặt vé thất bại", error: error.message });
    }
};

// Cancel a booking
export const cancelBooking = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const booking = await Booking.findById(req.params.id).session(session);
        if (!booking) {
            throw new Error("Không tìm thấy đặt vé");
        }

        // Sửa lại: Cho phép cả admin hủy vé
        if (booking.user_id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            throw new Error("Bạn không có quyền hủy đặt vé này");
        }

        if (booking.status === 'cancelled') {
            throw new Error("Đặt vé đã được hủy trước đó");
        }

        // Lấy danh sách seat_id từ BookingSeat để cập nhật lại Showtime
        const bookingSeats = await BookingSeat.find({ booking_id: booking._id }).session(session);
        const seatIdsToRelease = bookingSeats.map(bs => bs.seat_id);

        booking.status = 'cancelled';
        await booking.save({ session });


        // Xóa các ghế đã hủy khỏi mảng booked_seats của Showtime
        if (seatIdsToRelease.length > 0) {
            await Showtime.updateOne(
                { _id: booking.showtime_id },
                { $pull: { booked_seats: { $in: seatIdsToRelease } } },
                { session }
            );
        }


        await session.commitTransaction();
        res.status(200).json({ message: "Hủy đặt vé thành công", booking });
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ message: "Hủy đặt vé thất bại", error: error.message });
    } finally {
        session.endSession();
    }
};

/**
 * @desc    Get all bookings (for Admin)
 * @route   GET /api/bookings
 * @access  Private/Admin
 */
export const getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({}) // Lấy tất cả
            .populate('user_id', 'username email')
            .populate({
                path: 'showtime_id',
                populate: { path: 'movie_id room_id' }
            })
            .sort({ created_at: -1 });

        res.status(200).json({ bookings });
    } catch (error) {
        res.status(500).json({ message: "Lấy danh sách đặt vé thất bại", error: error.message });
    }
};

/**
 * @desc    Update booking status (e.g., after payment)
 * @route   PATCH /api/bookings/:id/status
 * @access  Private/Admin
 */
export const updateBookingStatus = async (req, res) => {
    const { status, payment_status } = req.body;
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        // Các trạng thái hợp lệ
        const allowedStatus = ['pending', 'confirmed', 'cancelled', 'failed'];
        if (status && !allowedStatus.includes(status)) {
            throw new Error(`Trạng thái '${status}' không hợp lệ.`);
        }

        const booking = await Booking.findById(req.params.id).session(session);
        if (!booking) {
            throw new Error("Không tìm thấy đặt vé");
        }

        booking.status = status || booking.status;
        booking.payment_status = payment_status || booking.payment_status;

        // Nếu trạng thái bị hủy hoặc thất bại, giải phóng ghế
        if (status === 'cancelled' || status === 'failed') {
            const bookingSeats = await BookingSeat.find({ booking_id: booking._id }).session(session);
            const seatIdsToRelease = bookingSeats.map(bs => bs.seat_id);

            if (seatIdsToRelease.length > 0) {
                await Showtime.updateOne(
                    { _id: booking.showtime_id },
                    { $pull: { booked_seats: { $in: seatIdsToRelease } } },
                    { session }
                );
            }
        }

        const updatedBooking = await booking.save({ session });
        await session.commitTransaction();
        res.status(200).json({ message: "Cập nhật trạng thái đặt vé thành công", booking: updatedBooking });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ message: "Cập nhật trạng thái thất bại", error: error.message });
    } finally {
        session.endSession();
    }
};

/**
 * @desc    Get all bookings for a specific user (Admin only)
 * @route   GET /api/bookings/user/:userId
 * @access  Private/Admin
 */
export const getBookingsByUserId = async (req, res) => {
    try {
        const bookings = await Booking.find({ user_id: req.params.userId })
            .populate({
                path: 'showtime_id',
                populate: [
                    { path: 'movie_id' },
                    { 
                        path: 'room_id',
                        populate: {
                            path: 'theater_id'
                        }
                    }
                ]
            })
            .populate('user_id', 'username email')
            .sort({ created_at: -1 });

        if (!bookings || bookings.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy đặt vé nào cho người dùng này" });
        }

        const formattedBookings = bookings.map(booking => {
            const bookingObj = booking.toObject();
            if (bookingObj.created_at) {
                bookingObj.created_at = formatForAPI(bookingObj.created_at);
            }
            if (bookingObj.updated_at) {
                bookingObj.updated_at = formatForAPI(bookingObj.updated_at);
            }
            if (bookingObj.showtime_id && bookingObj.showtime_id.start_time) {
                bookingObj.showtime_id.start_time = formatForAPI(bookingObj.showtime_id.start_time);
            }
            if (bookingObj.showtime_id && bookingObj.showtime_id.end_time) {
                bookingObj.showtime_id.end_time = formatForAPI(bookingObj.showtime_id.end_time);
            }
            return bookingObj;
        });

        res.status(200).json(formattedBookings);
    } catch (error) {
        res.status(500).json({ message: "Lấy danh sách đặt vé thất bại", error: error.message });
    }
};