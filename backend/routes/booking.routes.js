import express from 'express';
import { 
    createBooking, 
    getMyBookings, 
    getBookingDetails, 
    cancelBooking,
    getAllBookings,
    updateBookingStatus,
    getBookingsByUserId,
    createOfflineBooking
} from '../controllers/booking.controller.js';
import { verifyToken, requireAdmin, requireStaff } from '../middlewares/auth.js';
import { 
    validateCreateBooking, 
    validateOfflineBooking,
    validateBookingId,
    validateUpdateStatus,
    validateUserId
} from '../middlewares/bookingValidation.js';

const router = express.Router();

// @route   GET api/bookings
// @desc    Get all bookings (Admin only)
// @access  Private/Admin
router.get('/', verifyToken, requireAdmin, getAllBookings);

// @route   POST api/bookings
// @desc    Create a new booking
// @access  Private
router.post('/', verifyToken, validateCreateBooking, createBooking);

// @route   POST api/bookings/offline
// @desc    Create a new offline booking
// @access  Private/Staff
router.post('/offline', verifyToken, requireStaff, validateOfflineBooking, createOfflineBooking);

// @route   GET api/bookings/my-bookings
// @desc    Get all bookings for the logged-in user
// @access  Private
router.get('/my-bookings', verifyToken, getMyBookings);

// @route   GET api/bookings/user/:userId
// @desc    Get all bookings for a specific user (Admin only)
// @access  Private/Admin
router.get('/user/:userId', verifyToken, requireAdmin, validateUserId, getBookingsByUserId);

// @route   GET api/bookings/:id
// @desc    Get a single booking by ID
// @access  Private
router.get('/:id', verifyToken, validateBookingId, getBookingDetails);

// @route   PUT api/bookings/:id/cancel
// @desc    Cancel a booking
// @access  Private
router.put('/:id/cancel', verifyToken, validateBookingId, cancelBooking);

// @route   PATCH api/bookings/:id/status
// @desc    Update booking status (Admin only)
// @access  Private/Admin
router.patch('/:id/status', verifyToken, requireAdmin, validateUpdateStatus, updateBookingStatus);

export default router;
