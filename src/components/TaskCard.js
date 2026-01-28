import React from 'react';
import { useTimer } from '../hooks/useTimer';
import { useAuth } from '../contexts/AuthContext';

const TaskCard = ({ task, timeEntries, profiles, onClockIn, onClockOut, onClick }) => {
    const { user } = useAuth();

    // Find user's active entry for this task
    const userActiveEntry = timeEntries.find(
        entry => entry.task_id === task.id && entry.user_id === user.id && !entry.end_time
    );

    // Count active users
    const activeUsers = timeEntries.filter(
        entry => entry.task_id === task.id && !entry.end_time
    ).length;

    // Get timer display
    const timerDisplay = useTimer(userActiveEntry?.start_time);

    // Get creator profile
    const creatorProfile = profiles.find(p => p.id === task.created_by);

    const isOpen = task.status === 'open';

    const handleCardClick = () => {
        if (!isOpen && onClick) {
            onClick(task);
        }
    };

    return (
        <div
            onClick={handleCardClick}
            className={`card transition-all duration-200 ${isOpen
                    ? 'border-2 border-primary-500 hover:shadow-lg'
                    : 'border-2 border-gray-300 hover:shadow-lg cursor-pointer'
                }`}
        >
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{task.title}</h3>
                    {task.description && (
                        <p className="text-gray-600 text-sm">{task.description}</p>
                    )}
                </div>
                <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${isOpen
                            ? 'bg-primary-100 text-primary-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                >
                    {isOpen ? 'Open' : 'Closed'}
                </span>
            </div>

            <div className="text-sm text-gray-600 mb-4">
                <p>Created by: {creatorProfile?.email || 'Unknown'}</p>
                {activeUsers > 0 && isOpen && (
                    <p className="mt-1 text-primary-600 font-medium">
                        {activeUsers} {activeUsers === 1 ? 'user' : 'users'} active
                    </p>
                )}
            </div>

            {userActiveEntry && (
                <div className="mb-4 p-3 bg-primary-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Your active session:</p>
                    <p className="text-2xl font-bold text-primary-700 font-mono">{timerDisplay}</p>
                </div>
            )}

            {isOpen && (
                <div className="flex gap-2">
                    {userActiveEntry ? (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onClockOut(task, userActiveEntry);
                            }}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
                        >
                            Clock Out
                        </button>
                    ) : (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onClockIn(task);
                            }}
                            className="flex-1 btn-primary"
                        >
                            Clock In
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default TaskCard;
