const bookingService = require('../services/bookingService');

const bookingController = {
    async createBooking(req, res) {
        try {
            const { event_id, quantity } = req.body;
            const user_id = req.user.id;

            if (!event_id || !quantity) {
                return res.status(400).json({ error: 'Event ID and quantity are required' });
            }

            const booking = await bookingService.createBooking(user_id, event_id, quantity);
            res.status(201).json({ booking });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    async getUserBookings(req, res) {
        try {
            const user_id = req.user.id;
            const bookings = await bookingService.getUserBookings(user_id);
            res.json({ bookings });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getBookingById(req, res) {
        try {
            const { id } = req.params;
            const user_id = req.user.id;
            
            const booking = await bookingService.getBookingById(id, user_id);
            res.json({ booking });
        } catch (error) {
            res.status(404).json({ error: error.message });
        }
    },

    async confirmBooking(req, res) {
        try {
            const { id } = req.params;
            const user_id = req.user.id;
            
            const booking = await bookingService.confirmBooking(id, user_id);
            res.json({ booking });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    async cancelBooking(req, res) {
        try {
            const { id } = req.params;
            const user_id = req.user.id;
            
            await bookingService.cancelBooking(id, user_id);
            res.json({ message: 'Booking cancelled successfully' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
};

module.exports = bookingController; 