import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TodoList.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const TodoList = () => {
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState({ title: '', description: '' });
    const [editingTask, setEditingTask] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Fetch all tasks on component mount
    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/api/tasks`);
            setTasks(response.data);
            setError('');
        } catch (error) {
            console.error('Error fetching tasks:', error);
            setError('Failed to fetch tasks. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (editingTask) {
            setEditingTask({ ...editingTask, [name]: value });
        } else {
            setNewTask({ ...newTask, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newTask.title.trim()) {
            setError('Title is required');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/api/tasks`, newTask);
            setTasks([response.data, ...tasks]);
            setNewTask({ title: '', description: '' });
            setError('');
        } catch (error) {
            console.error('Error creating task:', error);
            setError('Failed to create task. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (id) => {
        if (!editingTask.title.trim()) {
            setError('Title is required');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.put(`${API_URL}/api/tasks/${id}`, editingTask);
            setTasks(tasks.map(task => task.id === id ? response.data : task));
            setEditingTask(null);
            setError('');
        } catch (error) {
            console.error('Error updating task:', error);
            setError('Failed to update task. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this task?')) {
            return;
        }

        setLoading(true);
        try {
            await axios.delete(`${API_URL}/api/tasks/${id}`);
            setTasks(tasks.filter(task => task.id !== id));
            setError('');
        } catch (error) {
            console.error('Error deleting task:', error);
            setError('Failed to delete task. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleComplete = async (task) => {
        setLoading(true);
        try {
            const response = await axios.put(`${API_URL}/api/tasks/${task.id}`, {
                completed: !task.completed
            });
            setTasks(tasks.map(t => t.id === task.id ? response.data : t));
            setError('');
        } catch (error) {
            console.error('Error toggling task:', error);
            setError('Failed to update task. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCompleted = async () => {
        if (!window.confirm('Are you sure you want to delete all completed tasks?')) {
            return;
        }

        setLoading(true);
        try {
            await axios.delete(`${API_URL}/api/tasks/completed/all`);
            setTasks(tasks.filter(task => !task.completed));
            setError('');
        } catch (error) {
            console.error('Error deleting completed tasks:', error);
            setError('Failed to delete completed tasks. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="todo-container">
            <h1>📝 {process.env.REACT_APP_APP_NAME || 'Todo List'}</h1>
            
            {error && <div className="error-message">{error}</div>}
            
            {/* Add new task form */}
            <form onSubmit={handleSubmit} className="add-task-form">
                <input
                    type="text"
                    name="title"
                    placeholder="Task title"
                    value={newTask.title}
                    onChange={handleInputChange}
                    disabled={loading}
                />
                <input
                    type="text"
                    name="description"
                    placeholder="Description (optional)"
                    value={newTask.description}
                    onChange={handleInputChange}
                    disabled={loading}
                />
                <button type="submit" disabled={loading}>
                    {loading ? 'Adding...' : 'Add Task'}
                </button>
            </form>

            {/* Delete completed button */}
            {tasks.some(task => task.completed) && (
                <button 
                    onClick={handleDeleteCompleted}
                    className="delete-completed-btn"
                    disabled={loading}
                >
                    Delete Completed Tasks
                </button>
            )}

            {/* Tasks list */}
            <div className="tasks-list">
                {loading && <div className="loading">Loading...</div>}
                
                {tasks.length === 0 && !loading ? (
                    <p className="no-tasks">No tasks yet. Add one above!</p>
                ) : (
                    tasks.map(task => (
                        <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                            {editingTask && editingTask.id === task.id ? (
                                // Edit mode
                                <div className="edit-form">
                                    <input
                                        type="text"
                                        name="title"
                                        value={editingTask.title}
                                        onChange={handleInputChange}
                                        disabled={loading}
                                    />
                                    <input
                                        type="text"
                                        name="description"
                                        value={editingTask.description || ''}
                                        onChange={handleInputChange}
                                        disabled={loading}
                                    />
                                    <div className="task-actions">
                                        <button 
                                            onClick={() => handleUpdate(task.id)}
                                            disabled={loading}
                                        >
                                            Save
                                        </button>
                                        <button 
                                            onClick={() => setEditingTask(null)}
                                            disabled={loading}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                // View mode
                                <>
                                    <div className="task-content">
                                        <input
                                            type="checkbox"
                                            checked={task.completed}
                                            onChange={() => handleToggleComplete(task)}
                                            disabled={loading}
                                        />
                                        <div className="task-details">
                                            <h3 className={task.completed ? 'completed-text' : ''}>
                                                {task.title}
                                            </h3>
                                            {task.description && (
                                                <p className="task-description">{task.description}</p>
                                            )}
                                            <small className="task-date">
                                                Created: {new Date(task.created_at).toLocaleDateString()}
                                            </small>
                                        </div>
                                    </div>
                                    <div className="task-actions">
                                        <button 
                                            onClick={() => setEditingTask(task)}
                                            disabled={loading}
                                        >
                                            Edit
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(task.id)}
                                            disabled={loading}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TodoList;