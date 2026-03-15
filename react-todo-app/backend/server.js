const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection pool
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'todo_db',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

// Initialize database tables
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
        
        // Check if table is empty and insert sample data if needed
        const result = await pool.query('SELECT COUNT(*) FROM tasks');
        if (parseInt(result.rows[0].count) === 0) {
            await pool.query(`
                INSERT INTO tasks (title, description, completed) VALUES
                ('Complete project setup', 'Set up the project structure and dependencies', true),
                ('Create backend API', 'Implement CRUD operations with PostgreSQL', false),
                ('Build frontend UI', 'Create React components for todo list', false),
                ('Test application', 'Test all functionality thoroughly', false)
            `);
            console.log('✅ Sample data inserted');
        }
    } catch (err) {
        console.error('❌ Failed to initialize database:', err.message);
    }
};

// Test database connection
pool.connect(async (err, client, release) => {
    if (err) {
        console.error('❌ Database connection error:', err.message);
        console.error('Please check:');
        console.error('1. PostgreSQL is running (brew services start postgresql)');
        console.error('2. Database credentials in .env are correct');
        console.error('3. Database "todo_db" exists');
        return;
    }
    console.log('✅ Connected to PostgreSQL database');
    release();
    
    // Initialize tables after successful connection
    await initDB();
});

// Import routes
const taskRoutes = require('./routes/tasks');

// Use routes
app.use('/api/tasks', taskRoutes(pool));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        message: 'Server is running',
        database: 'Connected to PostgreSQL',
        timestamp: new Date().toISOString(),
        port: process.env.PORT || 5001
    });
});

// Test endpoint to verify POST is working
app.post('/test', (req, res) => {
    console.log('📥 Test POST received:', req.body);
    res.json({ 
        message: 'Test endpoint working', 
        received: req.body,
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err.stack);
    res.status(500).json({ 
        error: 'Internal server error',
        message: err.message 
    });
});

// 404 handler
app.use((req, res) => {
    console.log('❌ 404 - Route not found:', req.method, req.url);
    res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`\n🚀 Server starting...`);
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 API URL: http://localhost:${PORT}`);
    console.log(`\n📝 Available endpoints:`);
    console.log(`   GET    http://localhost:${PORT}/health`);
    console.log(`   POST   http://localhost:${PORT}/test`);
    console.log(`   GET    http://localhost:${PORT}/api/tasks`);
    console.log(`   GET    http://localhost:${PORT}/api/tasks/:id`);
    console.log(`   POST   http://localhost:${PORT}/api/tasks`);
    console.log(`   PUT    http://localhost:${PORT}/api/tasks/:id`);
    console.log(`   DELETE http://localhost:${PORT}/api/tasks/:id`);
    console.log(`   DELETE http://localhost:${PORT}/api/tasks/completed/all\n`);
});

module.exports = { app, pool };