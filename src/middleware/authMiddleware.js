const axios = require('axios');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'Authorization token required' });
        }

        const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:8001';
        const response = await axios.get(`${authServiceUrl}/api/v1/validate?token=${token}`);
        
        if (response.data.valid) {
            req.user = response.data.user;
            next();
        } else {
            return res.status(401).json({ error: 'Invalid token' });
        }
    } catch (error) {
        return res.status(401).json({ error: 'Authentication failed' });
    }
};

module.exports = authMiddleware; 