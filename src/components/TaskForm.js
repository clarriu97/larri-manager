import React, { useState } from 'react';
import toast from 'react-hot-toast';

const TaskForm = ({ onTaskCreated }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!title.trim()) {
            toast.error('Please enter a task title');
            return;
        }

        setLoading(true);
        try {
            await onTaskCreated({ title, description });
            setTitle('');
            setDescription('');
            toast.success('Task created successfully!');
        } catch (error) {
            toast.error(error.message || 'Failed to create task');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="card mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Task</h2>

            <div className="space-y-4">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                        Title
                    </label>
                    <input
                        id="title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="input-field"
                        placeholder="Enter task title"
                        disabled={loading}
                    />
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                        Description (optional)
                    </label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="input-field resize-none"
                        rows="3"
                        placeholder="Enter task description"
                        disabled={loading}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary"
                >
                    {loading ? 'Creating...' : 'Create Task'}
                </button>
            </div>
        </form>
    );
};

export default TaskForm;
