const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// ✅ CORS (works for local + deployed frontend)
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Database connection pool
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    ssl: process.env.DB_SSL === 'true'
        ? { rejectUnauthorized: false }
        : false,
});

// ✅ Initialize database tables
const initDB = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS tasks (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                completed BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('✅ Database initialized - tasks table ready');

        // Insert sample data if empty
        const result = await pool.query('SELECT COUNT(*) FROM tasks');

        if (parseInt(result.rows[0].count) === 0) {
            await pool.query(`
                INSERT INTO tasks (title, description, completed) VALUES
                ('Complete project setup', 'Set up the project structure', true),
                ('Create backend API', 'Implement CRUD operations', false),
                ('Build frontend UI', 'Create React components', false),
                ('Test application', 'Test all functionality', false)
            `);
            console.log('✅ Sample data inserted');
        }

    } catch (err) {
        console.error('❌ DB Init Error:', err.message);
    }
};

// ✅ Connect to DB safely
(async () => {
    try {
        await pool.query('SELECT 1');
        console.log('✅ Connected to PostgreSQL');

        await initDB();
    } catch (err) {
        console.error('❌ Database connection error:', err.message);
    }
})();

// ✅ Routes
const taskRoutes = require('./routes/tasks');
app.use('/api/tasks', taskRoutes(pool));

// ✅ Health check
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// ✅ Test endpoint
app.post('/test', (req, res) => {
    res.json({
        message: 'Test successful',
        data: req.body
    });
});

// ✅ Error handler
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err.stack);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

// ✅ 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// ✅ Start server (IMPORTANT: use 5000)
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = { app, pool };