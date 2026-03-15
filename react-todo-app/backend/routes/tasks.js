module.exports = (pool) => {
    const express = require('express');
    const router = express.Router();

    // GET all tasks
    router.get('/', async (req, res) => {
        try {
            console.log('📥 GET /api/tasks - Fetching all tasks');
            const result = await pool.query(
                'SELECT * FROM tasks ORDER BY created_at DESC'
            );
            console.log(`✅ Found ${result.rows.length} tasks`);
            res.json(result.rows);
        } catch (error) {
            console.error('❌ Error fetching tasks:', error);
            res.status(500).json({ 
                error: 'Failed to fetch tasks',
                details: error.message 
            });
        }
    });

    // GET single task by ID
    router.get('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            console.log(`📥 GET /api/tasks/${id} - Fetching task`);
            
            const result = await pool.query(
                'SELECT * FROM tasks WHERE id = $1',
                [id]
            );
            
            if (result.rows.length === 0) {
                console.log(`❌ Task ${id} not found`);
                return res.status(404).json({ error: 'Task not found' });
            }
            
            console.log(`✅ Task ${id} found`);
            res.json(result.rows[0]);
        } catch (error) {
            console.error(`❌ Error fetching task ${req.params.id}:`, error);
            res.status(500).json({ 
                error: 'Failed to fetch task',
                details: error.message 
            });
        }
    });

    // CREATE a new task
    router.post('/', async (req, res) => {
        try {
            console.log('📥 POST /api/tasks - Creating new task');
            console.log('Request body:', req.body);
            
            const { title, description } = req.body;
            
            // Validation
            if (!title) {
                console.log('❌ Validation failed: Title is required');
                return res.status(400).json({ error: 'Title is required' });
            }

            if (typeof title !== 'string') {
                console.log('❌ Validation failed: Title must be a string');
                return res.status(400).json({ error: 'Title must be a string' });
            }

            if (title.trim().length === 0) {
                console.log('❌ Validation failed: Title cannot be empty');
                return res.status(400).json({ error: 'Title cannot be empty' });
            }

            if (title.length > 255) {
                console.log('❌ Validation failed: Title too long');
                return res.status(400).json({ error: 'Title must be less than 255 characters' });
            }

            console.log('Executing query with:', { title, description: description || null });

            const result = await pool.query(
                'INSERT INTO tasks (title, description) VALUES ($1, $2) RETURNING *',
                [title, description || null]
            );
            
            console.log('✅ Task created successfully:', result.rows[0]);
            res.status(201).json(result.rows[0]);
        } catch (error) {
            console.error('❌ Error creating task:', error);
            
            // Handle specific PostgreSQL errors
            if (error.code === '23502') { // NOT NULL violation
                return res.status(400).json({ error: 'Title is required' });
            }
            if (error.code === '42P01') { // undefined_table
                return res.status(500).json({ error: 'Database table not found. Server is initializing...' });
            }
            if (error.code === 'ECONNREFUSED') {
                return res.status(500).json({ error: 'Database connection failed' });
            }
            
            res.status(500).json({ 
                error: 'Failed to create task',
                details: error.message 
            });
        }
    });

    // UPDATE a task
    router.put('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            console.log(`📥 PUT /api/tasks/${id} - Updating task`);
            console.log('Request body:', req.body);
            
            const { title, description, completed } = req.body;
            
            // Check if task exists first
            const checkExists = await pool.query(
                'SELECT id FROM tasks WHERE id = $1',
                [id]
            );
            
            if (checkExists.rows.length === 0) {
                console.log(`❌ Task ${id} not found`);
                return res.status(404).json({ error: 'Task not found' });
            }
            
            // Build dynamic update query using COALESCE like the working example
            const query = `
                UPDATE tasks 
                SET 
                    title = COALESCE($1, title),
                    description = COALESCE($2, description),
                    completed = COALESCE($3, completed),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $4 
                RETURNING *
            `;

            console.log('Update query with values:', { title, description, completed, id });

            const result = await pool.query(query, [title, description, completed, id]);
            
            console.log(`✅ Task ${id} updated successfully:`, result.rows[0]);
            res.json(result.rows[0]);
        } catch (error) {
            console.error(`❌ Error updating task ${req.params.id}:`, error);
            res.status(500).json({ 
                error: 'Failed to update task',
                details: error.message 
            });
        }
    });

    // DELETE a task
    router.delete('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            console.log(`📥 DELETE /api/tasks/${id} - Deleting task`);
            
            const result = await pool.query(
                'DELETE FROM tasks WHERE id = $1 RETURNING *',
                [id]
            );
            
            if (result.rows.length === 0) {
                console.log(`❌ Task ${id} not found`);
                return res.status(404).json({ error: 'Task not found' });
            }
            
            console.log(`✅ Task ${id} deleted successfully`);
            res.json({ 
                message: 'Task deleted successfully',
                deletedTask: result.rows[0]
            });
        } catch (error) {
            console.error(`❌ Error deleting task ${req.params.id}:`, error);
            res.status(500).json({ 
                error: 'Failed to delete task',
                details: error.message 
            });
        }
    });

    // DELETE all completed tasks
    router.delete('/completed/all', async (req, res) => {
        try {
            console.log('📥 DELETE /api/tasks/completed/all - Deleting all completed tasks');
            
            const result = await pool.query(
                'DELETE FROM tasks WHERE completed = true RETURNING *'
            );
            
            console.log(`✅ Deleted ${result.rowCount} completed tasks`);
            res.json({ 
                message: 'Completed tasks deleted successfully',
                deletedCount: result.rowCount,
                deletedTasks: result.rows
            });
        } catch (error) {
            console.error('❌ Error deleting completed tasks:', error);
            res.status(500).json({ 
                error: 'Failed to delete completed tasks',
                details: error.message 
            });
        }
    });

    return router;
};