import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doctorAPI, appointmentAPI } from '../api/client';
import './PatientDashboard.css';

function PatientDashboard() {
    const [doctors, setDoctors] = useState([]);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [slots, setSlots] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        fetchDoctorsAndAppointments();
    }, []);

    useEffect(() => {
        if (selectedDoctor) {
            fetchSlots(selectedDoctor._id);
        }
    }, [selectedDoctor]);

    const fetchDoctorsAndAppointments = async () => {
        try {
            setLoading(true);
            const [doctorsRes, appointmentsRes] = await Promise.all([
                doctorAPI.getAllDoctors(),
                appointmentAPI.getPatientAppointments(),
            ]);
            setDoctors(doctorsRes.data);
            setAppointments(appointmentsRes.data);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSlots = async (doctorId) => {
        try {
            const response = await doctorAPI.getTimeSlots(doctorId);
            setSlots(response.data);
        } catch (error) {
            console.error('Failed to fetch slots:', error);
            setSlots([]);
        }
    };

    const handleBookSlot = async (slot) => {
        setMessage('');
        try {
            await appointmentAPI.bookAppointment({
                doctorId: selectedDoctor._id,
                timeSlotId: slot._id,
                date: slot.date,
                time: slot.time,
            });
            setMessage('Appointment booked successfully!');
            fetchDoctorsAndAppointments();
            setSelectedDoctor(null);
            setSlots([]);
        } catch (error) {
            setMessage(error.response?.data?.message || 'Failed to book appointment');
        }
    };

    const handleCancelAppointment = async (appointmentId) => {
        try {
            await appointmentAPI.cancelAppointment(appointmentId);
            setMessage('Appointment cancelled successfully!');
            fetchDoctorsAndAppointments();
        } catch (error) {
            setMessage('Failed to cancel appointment');
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    return (
        <div className="patient-dashboard-container">
            <nav className="navbar">
                <h1>Patient Dashboard</h1>
                <div className="user-info">
                    <span>{user?.name}</span>
                    <button onClick={handleLogout}>Logout</button>
                </div>
            </nav>

            <div className="dashboard-content">
                {message && (
                    <div
                        className={`message ${message.includes('successfully') ? 'success' : 'error'
                            }`}
                    >
                        {message}
                    </div>
                )}

                <div className="doctors-section">
                    <h2>Available Doctors</h2>
                    {loading ? (
                        <p className="loading">Loading doctors...</p>
                    ) : doctors.length === 0 ? (
                        <p className="no-data">No doctors available</p>
                    ) : (
                        <div className="doctors-grid">
                            {doctors.map((doctor) => (
                                <div
                                    key={doctor._id}
                                    className={`doctor-card ${selectedDoctor?._id === doctor._id ? 'selected' : ''
                                        }`}
                                    onClick={() =>
                                        setSelectedDoctor(
                                            selectedDoctor?._id === doctor._id ? null : doctor
                                        )
                                    }
                                >
                                    <h3>{doctor.name}</h3>
                                    <p className="specialization">{doctor.specialization}</p>
                                    <p className="email">{doctor.email}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {selectedDoctor && (
                    <div className="slots-section">
                        <h2>Available Slots for {selectedDoctor.name}</h2>
                        {slots.length === 0 ? (
                            <p className="no-data">No available slots</p>
                        ) : (
                            <div className="slots-grid">
                                {slots.map((slot) => (
                                    <div key={slot._id} className="slot-card">
                                        <p className="slot-date">
                                            {new Date(slot.date).toLocaleDateString()}
                                        </p>
                                        <p className="slot-time">{slot.time}</p>
                                        <button
                                            className="book-btn"
                                            onClick={() => handleBookSlot(slot)}
                                        >
                                            Book Appointment
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="my-appointments-section">
                    <h2>My Appointments</h2>
                    {appointments.length === 0 ? (
                        <p className="no-data">No appointments booked</p>
                    ) : (
                        <div className="appointments-grid">
                            {appointments.map((appointment) => (
                                <div key={appointment._id} className="appointment-card">
                                    <div className="appointment-info">
                                        <p>
                                            <strong>Doctor:</strong> {appointment.doctorId.name}
                                        </p>
                                        <p>
                                            <strong>Specialization:</strong>{' '}
                                            {appointment.doctorId.specialization}
                                        </p>
                                        <p>
                                            <strong>Date:</strong>{' '}
                                            {new Date(appointment.date).toLocaleDateString()}
                                        </p>
                                        <p>
                                            <strong>Time:</strong> {appointment.time}
                                        </p>
                                        <p>
                                            <strong>Status:</strong>{' '}
                                            <span className={`status ${appointment.status}`}>
                                                {appointment.status}
                                            </span>
                                        </p>
                                    </div>
                                    {appointment.status !== 'cancelled' && (
                                        <button
                                            className="cancel-btn"
                                            onClick={() =>
                                                handleCancelAppointment(appointment._id)
                                            }
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default PatientDashboard;
