const request = require('supertest');
const express = require('express');

describe('Health Check', () => {
    let app;
    beforeAll(() => {
        app = express();
        app.get('/health', (req, res) => {
            res.json({ status: 'Backend is running' });
        });
    });

    it('should return backend running status', async () => {
        const res = await request(app).get('/health');
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('status', 'Backend is running');
    });
});
