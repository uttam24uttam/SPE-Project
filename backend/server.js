const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const winston = require('winston');
const net = require('net');
const Transport = require('winston-transport');
require('dotenv').config();


class LogstashTCPTransport extends Transport {
    constructor(opts) {
        super(opts);
        this.host = opts.host || 'logstash';
        this.port = opts.port || 5000;
        this.client = null;
        this.connect();
    }

    connect() {
        this.client = new net.Socket();
        this.client.connect(this.port, this.host, () => {
            console.log(`[Logger] Connected to Logstash at ${this.host}:${this.port}`);
        });

        // Prevent app crash on connection error
        this.client.on('error', (err) => {
            console.error(`[Logger] Logstash connection error: ${err.message}. Retrying...`);
            this.client.destroy();
            this.client = null;
            // Retry after 5 seconds
            setTimeout(() => this.connect(), 5000);
        });

        this.client.on('close', () => {
            this.client = null;
        });
    }

    log(info, callback) {
        setImmediate(() => {
            this.emit('logged', info);
        });

        if (this.client && !this.client.destroyed) {

            const logEntry = JSON.stringify(info) + '\n';
            this.client.write(logEntry, (err) => {
                if (err) console.error('[Logger] Write error:', err.message);
            });
        }

        callback();
    }
}

// LOGGER SETUP 
const logger = winston.createLogger({
    level: 'info',
    defaultMeta: { service: 'doctor-appointment-backend' },
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),

        new LogstashTCPTransport({
            host: 'logstash',
            port: 5000
        })
    ],
});


const app = express();

// Middleware
app.use(cors());
app.use(express.json());


// This logs every request automatically
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info({
            message: 'Incoming Request',
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`
        });
    });
    next();
});


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