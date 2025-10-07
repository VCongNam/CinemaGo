import Booking from '../models/booking.js';
import BookingSeat from '../models/bookingSeat.js';
import Showtime from '../models/showtime.js';
import Seat from '../models/seat.js';
import mongoose from 'mongoose';

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
            status: 'pending', // Or 'confirmed' if payment is immediate
            payment_status: 'pending'
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
                populate: {
                    path: 'movie_id room_id',
                    populate: {
                        path: 'theater_id'
                    }
                }
            })
            .sort({ created_at: -1 });

        if (!bookings) {
            return res.status(404).json({ message: "Không tìm thấy đặt vé nào cho người dùng này" });
        }

        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ message: "Lấy danh sách đặt vé thất bại", error: error.message });
    }
};

// Get details of a specific booking
export const getBookingDetails = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate({
                path: 'showtime_id',
                populate: {
                    path: 'movie_id room_id',
                    populate: {
                        path: 'theater_id'
                    }
                }
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

        res.status(200).json({ booking, seats: bookingSeats });
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
        booking.payment_status = 'refunded'; // Cân nhắc thêm trạng thái hoàn tiền
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
