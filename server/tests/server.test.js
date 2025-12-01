const request = require('supertest');
const app = require('../server'); // Import the app

// Mock pg
jest.mock('pg', () => {
    const mPool = {
        query: jest.fn(),
        connect: jest.fn(),
        on: jest.fn(),
        end: jest.fn(),
    };
    return { Pool: jest.fn(() => mPool) };
});

const { Pool } = require('pg');
const pool = new Pool();

// Mock Auth Middleware to bypass checks for testing
// We can mock the middleware functions if they are exported, 
// but since they are internal to server.js, we might need to mock jwt.verify
jest.mock('jsonwebtoken', () => ({
    verify: jest.fn((token, secret, cb) => cb(null, { role: 'admin', district_id: 1, mandal_id: 1, school_id: 1 })),
    sign: jest.fn(() => 'mock_token'),
}));

describe('Server Generic Entity API', () => {
    beforeEach(() => {
        pool.query.mockClear();
    });

    it('PUT /api/entities/:type/:id updates an entity', async () => {
        pool.query.mockResolvedValueOnce({ rows: [{ id: 1, name: 'Updated Name' }] });

        const res = await request(app)
            .put('/api/entities/students/1')
            .set('Authorization', 'Bearer mock_token')
            .send({ name: 'Updated Name' });

        expect(res.statusCode).toBe(200);
        expect(res.body.name).toBe('Updated Name');
        expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE students'), expect.anything());
    });

    it('DELETE /api/entities/:type/:id deletes an entity', async () => {
        pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

        const res = await request(app)
            .delete('/api/entities/students/1')
            .set('Authorization', 'Bearer mock_token');

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Deleted successfully');
        expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM students'), expect.anything());
    });
});
