import React, { useState } from 'react';
import toast from 'react-hot-toast';

const CloseTaskModal = ({ task, activeEntries, onClose, onCloseTask, onKeepOpen }) => {
    const [loading, setLoading] = useState(false);

    const handleCloseTask = async () => {
        // Check if there are other active entries
        const otherActiveEntries = activeEntries.filter(entry => entry.task_id === task.id);

        if (otherActiveEntries.length > 1) {
            toast.error('Cannot close task: other users have active sessions');
            return;
        }

        setLoading(true);
        try {
            await onCloseTask();
            onClose();
        } catch (error) {
            toast.error(error.message || 'Failed to close task');
        } finally {
            setLoading(false);
        }
    };

    const handleKeepOpen = async () => {
        setLoading(true);
        try {
            await onKeepOpen();
            onClose();
        } catch (error) {
            toast.error(error.message || 'Failed to clock out');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Clock Out</h2>
                    <p className="text-gray-600 mb-6">
                        What would you like to do with this task?
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={handleCloseTask}
                            disabled={loading}
                            className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 font-medium disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : 'Close Task'}
                        </button>

                        <button
                            onClick={handleKeepOpen}
                            disabled={loading}
                            className="w-full px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium disabled:opacity-50"
                        >
                            Keep Task Open
                        </button>

                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="w-full px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors duration-200 font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CloseTaskModal;
