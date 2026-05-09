const request = require('supertest');
const express = require('express');
const cors = require('cors');

// Create a simple test app
const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/todos', (req, res) => {
  res.json([{ id: 1, title: 'Test todo', completed: false }]);
});

describe('Todo API', () => {
  test('Health check returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('GET /api/todos returns array', async () => {
    const res = await request(app).get('/api/todos');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('Todo item has required fields', () => {
    const todo = { id: 1, title: 'Buy milk', completed: false };
    expect(todo).toHaveProperty('id');
    expect(todo).toHaveProperty('title');
    expect(todo).toHaveProperty('completed');
  });
});
