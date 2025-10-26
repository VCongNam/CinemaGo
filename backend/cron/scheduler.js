import cron from 'node-cron';
import mongoose from 'mongoose';
import Booking from '../models/booking.js';
import Showtime from '../models/showtime.js';
import BookingSeat from '../models/bookingSeat.js';

// Chạy tác vụ mỗi phút
cron.schedule('*/1 * * * *', async () => {
    console.log('Running a job every minute to clean up expired bookings');

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000); // 10 phút trước

        // Tìm các booking 'pending' đã quá 10 phút
        const expiredBookings = await Booking.find({
            status: 'pending',
            created_at: { $lte: tenMinutesAgo }
        }).session(session);

        if (expiredBookings.length === 0) {
            // console.log('No expired bookings to clean up.');
            await session.commitTransaction();
            return;
        }

        console.log(`Found ${expiredBookings.length} expired bookings to process.`);

        for (const booking of expiredBookings) {
            console.log(`Processing expired booking ID: ${booking._id}`);

            // Lấy danh sách seat_id từ BookingSeat để cập nhật lại Showtime
            const bookingSeats = await BookingSeat.find({ booking_id: booking._id }).session(session);
            const seatIdsToRelease = bookingSeats.map(bs => bs.seat_id);

            // Cập nhật trạng thái booking
            booking.status = 'cancelled'; // Hoặc ''
            booking.payment_status = 'failed';
            await booking.save({ session });

            // Xóa các ghế đã hủy khỏi mảng booked_seats của Showtime
            if (seatIdsToRelease.length > 0) {
                await Showtime.updateOne(
                    { _id: booking.showtime_id },
                    { $pull: { booked_seats: { $in: seatIdsToRelease } } },
                    { session }
                );
                console.log(`Released ${seatIdsToRelease.length} seats for showtime ID: ${booking.showtime_id}`);
            }
        }

        await session.commitTransaction();
        console.log('Successfully processed expired bookings.');

    } catch (error) {
        await session.abortTransaction();
        console.error('Error during expired bookings cleanup:', error);
    } finally {
        session.endSession();
    }
});
