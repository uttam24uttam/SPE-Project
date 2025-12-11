import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doctorAPI, appointmentAPI } from '../api/client';
import './DoctorDashboard.css';

function DoctorDashboard() {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [message, setMessage] = useState('');
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            const response = await appointmentAPI.getDoctorAppointments();
            setAppointments(response.data);
        } catch (error) {
            console.error('Failed to fetch appointments:', error);
        }
    };

    const handleAddSlot = async (e) => {
        e.preventDefault();
        setMessage('');
        setLoading(true);

        try {
            await doctorAPI.addTimeSlot(user.id, { date, time });
            setMessage('Time slot added successfully!');
            setDate('');
            setTime('');
            fetchAppointments();
        } catch (error) {
            setMessage(error.response?.data?.message || 'Failed to add slot');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    return (
        <div className="dashboard-container">
            <nav className="navbar">
                <h1>Doctor Dashboard</h1>
                <div className="user-info">
                    <span>{user?.name}</span>
                    <button onClick={handleLogout}>Logout</button>
                </div>
            </nav>

            <div className="dashboard-content">
                <div className="add-slot-section">
                    <h2>Add Availability</h2>
                    {message && (
                        <div
                            className={`message ${message.includes('successfully') ? 'success' : 'error'
                                }`}
                        >
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleAddSlot}>
                        <div className="form-group">
                            <label>Date:</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Time:</label>
                            <input
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                required
                            />
                        </div>

                        <button type="submit" disabled={loading}>
                            {loading ? 'Adding...' : 'Add Time Slot'}
                        </button>
                    </form>
                </div>

                <div className="appointments-section">
                    <h2>My Appointments</h2>
                    {appointments.length === 0 ? (
                        <p className="no-data">No appointments yet</p>
                    ) : (
                        <div className="appointments-grid">
                            {appointments.map((appointment) => (
                                <div key={appointment._id} className="appointment-card">
                                    <div className="appointment-info">
                                        <p>
                                            <strong>Patient:</strong> {appointment.patientId.name}
                                        </p>
                                        <p>
                                            <strong>Email:</strong> {appointment.patientId.email}
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
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default DoctorDashboard;
