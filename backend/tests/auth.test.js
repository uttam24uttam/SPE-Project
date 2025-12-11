const request = require('supertest');
const app = require('../server');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

describe('Authentication Routes', () => {
    beforeEach(async () => {
        // Clear collections before each test
        await Doctor.deleteMany({});
        await Patient.deleteMany({});
    });

    describe('Doctor Registration', () => {
        it('should register a doctor', async () => {
            const res = await request(app)
                .post('/api/auth/doctor/register')
                .send({
                    name: 'Dr. John',
                    email: 'john@example.com',
                    password: 'password123',
                    specialization: 'Cardiology',
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.token).toBeDefined();
            expect(res.body.user.role).toBe('doctor');
        });

        it('should not register doctor without required fields', async () => {
            const res = await request(app)
                .post('/api/auth/doctor/register')
                .send({
                    name: 'Dr. John',
                    email: 'john@example.com',
                });

            expect(res.statusCode).toBe(400);
        });
    });

    describe('Patient Registration', () => {
        it('should register a patient', async () => {
            const res = await request(app)
                .post('/api/auth/patient/register')
                .send({
                    name: 'John Patient',
                    email: 'patient@example.com',
                    password: 'password123',
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.token).toBeDefined();
            expect(res.body.user.role).toBe('patient');
        });
    });

    describe('Doctor Login', () => {
        beforeEach(async () => {
            await request(app)
                .post('/api/auth/doctor/register')
                .send({
                    name: 'Dr. John',
                    email: 'john@example.com',
                    password: 'password123',
                    specialization: 'Cardiology',
                });
        });

        it('should login a doctor', async () => {
            const res = await request(app)
                .post('/api/auth/doctor/login')
                .send({
                    email: 'john@example.com',
                    password: 'password123',
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.token).toBeDefined();
        });

        it('should fail with incorrect password', async () => {
            const res = await request(app)
                .post('/api/auth/doctor/login')
                .send({
                    email: 'john@example.com',
                    password: 'wrongpassword',
                });

            expect(res.statusCode).toBe(401);
        });
    });
});
