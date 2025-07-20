const express = require('express');
const cors = require('cors');
require('dotenv').config();

const bookingRoutes = require('./routes/bookingRoutes');
const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 8003;

app.use(cors());
app.use(express.json());

app.use('/api/v1', bookingRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'Booking service is running' });
});

app.listen(PORT, () => {
    console.log(`Booking service running on port ${PORT}`);
}); 