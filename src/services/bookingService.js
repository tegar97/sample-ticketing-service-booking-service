const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const axios = require('axios');
const { validate: isUUID } = require('uuid');

const bookingService = {
    async createBooking(user_id, event_id, quantity) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const eventServiceUrl = process.env.EVENT_SERVICE_URL || 'http://localhost:8002';
            const eventResponse = await axios.get(`${eventServiceUrl}/api/v1/events/${event_id}`);
            const event = eventResponse.data.event;

            if (!event) {
                throw new Error('Event not found');
            }

            if (event.available_tickets < quantity) {
                throw new Error('Not enough tickets available');
            }

            const total_amount = event.price * quantity;
            const booking_id = uuidv4();

            const insertBookingQuery = `
                INSERT INTO bookings (id, user_id, event_id, quantity, total_amount, status)
                VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6)
                RETURNING *
            `;

            const result = await client.query(insertBookingQuery, [
                booking_id, user_id, event_id, quantity, total_amount, 'pending'
            ]);

            await axios.put(`${eventServiceUrl}/api/v1/events/${event_id}/tickets`, {
                quantity: -quantity
            });

            await client.query('COMMIT');

            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    async getUserBookings(user_id) {
        const query = `
            SELECT b.*, e.title as event_title, e.venue, e.event_date
            FROM bookings b
            JOIN events e ON b.event_id = e.id
            WHERE b.user_id = $1::uuid
            ORDER BY b.created_at DESC
        `;

        const result = await pool.query(query, [user_id]);
        return result.rows;
    },

    async getBookingById(booking_id, user_id) {
        const query = `
            SELECT b.*, e.title as event_title, e.venue, e.event_date
            FROM bookings b
            JOIN events e ON b.event_id = e.id
            WHERE b.id = $1::uuid AND b.user_id = $2::uuid
        `;

        const result = await pool.query(query, [booking_id, user_id]);

        if (result.rows.length === 0) {
            throw new Error('Booking not found');
        }

        return result.rows[0];
    },

    async confirmBooking(booking_id, user_id) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');
            console.log(booking_id);
            console.log(user_id);

            if (!isUUID(user_id)) {
                throw new Error('Invalid user_id format');
            }


            if (!isUUID(booking_id)) {
                throw new Error('Invalid booking_id format');
            }
            const booking = await this.getBookingById(booking_id, user_id);

            //  log
            console.log(booking);

            if (booking.status !== 'pending') {
                throw new Error('Booking is not in pending status');
            }

            const updateQuery = `
                UPDATE bookings 
                SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP
                WHERE id = $1::uuid AND user_id = $2::uuid
                RETURNING *
            `;

            console.log("trigger")

            console.log(updateQuery);

            const result = await client.query(updateQuery, [booking_id, user_id]);

            const ticketingServiceUrl = process.env.TICKETING_SERVICE_URL || 'http://localhost:8004';
            await axios.post(`${ticketingServiceUrl}/api/v1/tickets/generate`, {
                booking_id: booking_id,
                event_id: booking.event_id,
                user_id: user_id,
                quantity: booking.quantity
            });

            await client.query('COMMIT');

            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    async cancelBooking(booking_id, user_id) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const booking = await this.getBookingById(booking_id, user_id);

            if (booking.status === 'cancelled') {
                throw new Error('Booking is already cancelled');
            }

            const updateQuery = `
                UPDATE bookings 
                SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
                WHERE id = $1::uuid AND user_id = $2::uuid
            `;

            await client.query(updateQuery, [booking_id, user_id]);

            if (booking.status === 'pending') {
                const eventServiceUrl = process.env.EVENT_SERVICE_URL || 'http://localhost:8002';
                await axios.put(`${eventServiceUrl}/api/v1/events/${booking.event_id}/tickets`, {
                    quantity: booking.quantity
                });
            }

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
};

module.exports = bookingService; 
