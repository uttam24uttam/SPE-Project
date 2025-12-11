const express = require('express');
const Doctor = require('../models/Doctor');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all doctors
router.get('/', async (req, res) => {
    try {
        const doctors = await Doctor.find().select('-password');
        res.json(doctors);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get doctor by ID with available slots
router.get('/:id', async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id).select('-password');
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }
        res.json(doctor);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Add time slot (Doctor only)
router.post(
    '/:id/add-slot',
    authMiddleware,
    roleMiddleware('doctor'),
    async (req, res) => {
        try {
            const { date, time } = req.body;

            if (!date || !time) {
                return res.status(400).json({ message: 'Date and time are required' });
            }

            if (req.user.userId !== req.params.id) {
                return res.status(403).json({ message: 'Unauthorized' });
            }

            const doctor = await Doctor.findById(req.params.id);
            if (!doctor) {
                return res.status(404).json({ message: 'Doctor not found' });
            }

            doctor.timeSlots.push({ date: new Date(date), time, isBooked: false });
            await doctor.save();

            res.json({ message: 'Time slot added successfully', doctor });
        } catch (error) {
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }
);

// Get doctor's time slots
router.get('/:id/slots', async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id);
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        const availableSlots = doctor.timeSlots.filter(slot => !slot.isBooked);
        res.json(availableSlots);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
