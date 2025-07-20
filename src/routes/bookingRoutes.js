const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/bookings', authMiddleware, bookingController.createBooking);
router.get('/bookings', authMiddleware, bookingController.getUserBookings);
router.get('/bookings/:id', authMiddleware, bookingController.getBookingById);
router.put('/bookings/:id/confirm', authMiddleware, bookingController.confirmBooking);
router.delete('/bookings/:id', authMiddleware, bookingController.cancelBooking);

module.exports = router; 