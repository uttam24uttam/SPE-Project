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



// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const winston = require('winston');
// const net = require('net'); // Native Node module for TCP
// const Transport = require('winston-transport');
// require('dotenv').config();

// // --- 1. DEFINE CUSTOM LOGSTASH TRANSPORT (Robust & Simple) ---
// class LogstashTCPTransport extends Transport {
//     constructor(opts) {
//         super(opts);
//         this.host = opts.host || 'logstash';
//         this.port = opts.port || 5000;
//         this.client = null;
//         this.connect();
//     }

//     connect() {
//         this.client = new net.Socket();
//         this.client.connect(this.port, this.host, () => {
//             console.log(`[Logger] Connected to Logstash at ${this.host}:${this.port}`);
//         });

//         // Prevent app crash on connection error
//         this.client.on('error', (err) => {
//             console.error(`[Logger] Logstash connection error: ${err.message}. Retrying...`);
//             this.client.destroy();
//             this.client = null;
//             // Retry after 5 seconds
//             setTimeout(() => this.connect(), 5000);
//         });

//         this.client.on('close', () => {
//             this.client = null;
//         });
//     }

//     log(info, callback) {
//         setImmediate(() => {
//             this.emit('logged', info);
//         });

//         if (this.client && !this.client.destroyed) {
//             // Logstash 'json_lines' codec needs a newline at the end
//             const logEntry = JSON.stringify(info) + '\n';
//             this.client.write(logEntry, (err) => {
//                 if (err) console.error('[Logger] Write error:', err.message);
//             });
//         }

//         callback();
//     }
// }

// // --- 2. LOGGER SETUP ---
// const logger = winston.createLogger({
//     level: 'info',
//     defaultMeta: { service: 'doctor-appointment-backend' },
//     format: winston.format.combine(
//         winston.format.timestamp(),
//         winston.format.json()
//     ),
//     transports: [
//         new winston.transports.Console(),
//         // Use our new reliable custom transport
//         new LogstashTCPTransport({
//             host: 'logstash', // Short name works best in K8s
//             port: 5000
//         })
//     ],
// });
// // --------------------------

// const app = express();

// // Middleware
// app.use(cors());
// app.use(express.json());

// // MongoDB Connection
// const isTest = process.env.NODE_ENV === 'test';
// const mongoUri = process.env.MONGODB_URI || (isTest ? 'mongodb://localhost:27017/testdb' : undefined);

// if (!mongoUri) {
//     logger.error('MONGODB_URI is not set');
//     throw new Error('MONGODB_URI is not set');
// }

// mongoose.connect(mongoUri, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
// })
//     .then(() => {
//         logger.info('MongoDB connected');
//     })
//     .catch(err => {
//         logger.error(`MongoDB connection error: ${err.message}`);
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
//         logger.info(`Server running on port ${PORT}`);
//     });
// }

// module.exports = app;




const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const winston = require('winston');
const net = require('net'); // Native Node module for TCP
const Transport = require('winston-transport');
require('dotenv').config();

// --- 1. DEFINE CUSTOM LOGSTASH TRANSPORT (Robust & Simple) ---
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
            // Logstash 'json_lines' codec needs a newline at the end
            const logEntry = JSON.stringify(info) + '\n';
            this.client.write(logEntry, (err) => {
                if (err) console.error('[Logger] Write error:', err.message);
            });
        }

        callback();
    }
}

// --- 2. LOGGER SETUP ---
const logger = winston.createLogger({
    level: 'info',
    defaultMeta: { service: 'doctor-appointment-backend' },
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(), // Shows logs in "kubectl logs"
        // Use our new reliable custom transport
        new LogstashTCPTransport({
            host: 'logstash', // Short name works best in K8s
            port: 5000
        })
    ],
});
// --------------------------

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// --- 3. REQUEST LOGGING MIDDLEWARE (ADD THIS) ---
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
// ------------------------------------------------

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