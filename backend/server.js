// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// require('dotenv').config();


// // Logstash TCP logger setup
// const net = require('net');
// function logToLogstash(logObj) {
//     try {
//         const client = net.createConnection({ host: process.env.LOGSTASH_HOST || 'logstash', port: 5000 }, () => {
//             client.write(JSON.stringify(logObj) + '\n');
//             client.end();
//         });
//         client.on('error', (err) => {
//             console.error('Logstash connection error:', err);
//         });
//     } catch (err) {
//         console.error('Logstash connection error (catch):', err);
//     }
// }

// const app = express();

// // Middleware
// app.use(cors());
// app.use(express.json());

// // MongoDB Connection
// const isTest = process.env.NODE_ENV === 'test';
// const mongoUri = process.env.MONGODB_URI || (isTest ? 'mongodb://localhost:27017/testdb' : undefined);
// if (!mongoUri) {
//     throw new Error('MONGODB_URI is not set');
// }
// mongoose.connect(mongoUri, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
// })
//     .then(() => {
//         console.log('MongoDB connected');
//         logToLogstash({ level: 'info', message: 'MongoDB connected', timestamp: new Date().toISOString() });
//     })
//     .catch(err => {
//         console.log('MongoDB connection error:', err);
//         logToLogstash({ level: 'error', message: 'MongoDB connection error', error: err.message, timestamp: new Date().toISOString() });
//     });

// // Routes
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/doctors', require('./routes/doctors'));
// app.use('/api/appointments', require('./routes/appointments'));

// // Health check endpoint
// app.get('/health', (req, res) => {
//     res.json({ status: 'Backend is running' });
// });


// const PORT = process.env.PORT || 5000;
// if (!isTest) {
//     app.listen(PORT, () => {
//         console.log(`Server running on port ${PORT}`);
//         logToLogstash({ level: 'info', message: `Server running on port ${PORT}`, timestamp: new Date().toISOString() });
//     });
// }

// module.exports = app;




const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const winston = require('winston');
const { LogstashTransport } = require('winston-logstash-transport');
require('dotenv').config();

// --- FIXED LOGGER SETUP ---
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    defaultMeta: { service: 'doctor-appointment-backend' },
    transports: [
        new winston.transports.Console(), // Shows logs in "kubectl logs"
        new LogstashTransport({
            host: 'logstash.doctor-appointment.svc.cluster.local', // Safe full address
            port: 5000
        })
    ],
});
// --------------------------

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const isTest = process.env.NODE_ENV === 'test';
const mongoUri = process.env.MONGODB_URI || (isTest ? 'mongodb://localhost:27017/testdb' : undefined);

if (!mongoUri) {
    logger.error('MONGODB_URI is not set');
    throw new Error('MONGODB_URI is not set');
}

mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => {
        logger.info('MongoDB connected');
    })
    .catch(err => {
        logger.error(`MongoDB connection error: ${err.message}`);
    });

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
        logger.info(`Server running on port ${PORT}`);
    });
}

module.exports = app;