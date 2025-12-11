const express = require('express');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

// Book appointment (Patient only)
router.post(
    '/book',
    authMiddleware,
    roleMiddleware('patient'),
    async (req, res) => {
        try {
            const { doctorId, timeSlotId, date, time } = req.body;

            if (!doctorId || !timeSlotId || !date || !time) {
                return res
                    .status(400)
                    .json({ message: 'All fields are required' });
            }

            const doctor = await Doctor.findById(doctorId);
            if (!doctor) {
                return res.status(404).json({ message: 'Doctor not found' });
            }

            const slot = doctor.timeSlots.id(timeSlotId);
            if (!slot) {
                return res.status(404).json({ message: 'Slot not found' });
            }

            if (slot.isBooked) {
                return res.status(400).json({ message: 'Slot is already booked' });
            }

            slot.isBooked = true;
            await doctor.save();

            const appointment = new Appointment({
                doctorId,
                patientId: req.user.userId,
                timeSlotId,
                date,
                time,
            });

            await appointment.save();

            res.status(201).json({
                message: 'Appointment booked successfully',
                appointment,
            });
        } catch (error) {
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }
);

// Get patient appointments
router.get(
    '/patient/my-appointments',
    authMiddleware,
    roleMiddleware('patient'),
    async (req, res) => {
        try {
            const appointments = await Appointment.find({
                patientId: req.user.userId,
            })
                .populate('doctorId', 'name specialization')
                .sort({ date: -1 });

            res.json(appointments);
        } catch (error) {
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }
);

// Get doctor appointments
router.get(
    '/doctor/my-appointments',
    authMiddleware,
    roleMiddleware('doctor'),
    async (req, res) => {
        try {
            const appointments = await Appointment.find({
                doctorId: req.user.userId,
            })
                .populate('patientId', 'name email')
                .sort({ date: -1 });

            res.json(appointments);
        } catch (error) {
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }
);

// Cancel appointment
router.put(
    '/:id/cancel',
    authMiddleware,
    async (req, res) => {
        try {
            const appointment = await Appointment.findById(req.params.id);

            if (!appointment) {
                return res.status(404).json({ message: 'Appointment not found' });
            }

            if (
                appointment.patientId.toString() !== req.user.userId &&
                appointment.doctorId.toString() !== req.user.userId
            ) {
                return res.status(403).json({ message: 'Unauthorized' });
            }

            const doctor = await Doctor.findById(appointment.doctorId);
            const slot = doctor.timeSlots.id(appointment.timeSlotId);

            if (slot) {
                slot.isBooked = false;
                await doctor.save();
            }

            appointment.status = 'cancelled';
            await appointment.save();

            res.json({
                message: 'Appointment cancelled successfully',
                appointment,
            });
        } catch (error) {
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }
);

module.exports = router;
