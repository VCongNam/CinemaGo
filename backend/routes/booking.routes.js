import express from 'express';
import { createBooking, getMyBookings, getBookingDetails, cancelBooking } from '../controllers/booking.controller.js';
import { verifyToken } from '../middlewares/auth.js';
import { validateCreateBooking, validateBookingId } from '../middlewares/bookingValidation.js';

const router = express.Router();

// @route   POST api/bookings
// @desc    Create a new booking
// @access  Private
router.post('/', verifyToken, validateCreateBooking, createBooking);

// @route   GET api/bookings/my-bookings
// @desc    Get all bookings for the logged-in user
// @access  Private
router.get('/my-bookings', verifyToken, getMyBookings);

// @route   GET api/bookings/:id
// @desc    Get a single booking by ID
// @access  Private
router.get('/:id', verifyToken, validateBookingId, getBookingDetails);

// @route   PUT api/bookings/:id/cancel
// @desc    Cancel a booking
// @access  Private
router.put('/:id/cancel', verifyToken, validateBookingId, cancelBooking);

export default router;
