const express = require('express');
const cors = require('cors');
require('dotenv').config();

const bookingRoutes = require('./routes/bookingRoutes');
const db = require('./config/database');
const { runMigrations } = require('./config/migrationRunner');

const app = express();
const PORT = process.env.PORT || 8003;

app.use(cors());
app.use(express.json());

app.use('/api/v1', bookingRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Booking Service API' });
});

app.get('/health', (req, res) => {
    res.json({ status: 'Booking service is running' });
});

(async () => {
    try {
        await runMigrations();
        app.listen(PORT, () => {
            console.log(`Booking service running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
})();
