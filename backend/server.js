const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const isTest = process.env.NODE_ENV === 'test';
const mongoUri = process.env.MONGODB_URI || (isTest ? 'mongodb://localhost:27017/testdb' : undefined);
if (!mongoUri) {
    throw new Error('MONGODB_URI is not set');
}
mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/doctors', require('./routes/doctors'));
app.use('/api/appointments', require('./routes/appointments'));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'Backend is running' });
});


const PORT = process.env.PORT || 5000;
if (!isTest) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
