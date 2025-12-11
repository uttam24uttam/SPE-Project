import axios from 'axios';

// Use relative path so nginx proxy handles it
const API_URL = '/api';

const api = axios.create({
    baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const authAPI = {
    doctorRegister: (data) => api.post('/auth/doctor/register', data),
    doctorLogin: (data) => api.post('/auth/doctor/login', data),
    patientRegister: (data) => api.post('/auth/patient/register', data),
    patientLogin: (data) => api.post('/auth/patient/login', data),
};

export const doctorAPI = {
    getAllDoctors: () => api.get('/doctors'),
    getDoctorById: (id) => api.get(`/doctors/${id}`),
    addTimeSlot: (doctorId, data) =>
        api.post(`/doctors/${doctorId}/add-slot`, data),
    getTimeSlots: (doctorId) => api.get(`/doctors/${doctorId}/slots`),
};

export const appointmentAPI = {
    bookAppointment: (data) => api.post('/appointments/book', data),
    getPatientAppointments: () => api.get('/appointments/patient/my-appointments'),
    getDoctorAppointments: () => api.get('/appointments/doctor/my-appointments'),
    cancelAppointment: (appointmentId) =>
        api.put(`/appointments/${appointmentId}/cancel`),
};

export default api;
