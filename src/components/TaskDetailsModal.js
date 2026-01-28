import React from 'react';
import { format } from 'date-fns';

const TaskDetailsModal = ({ task, timeEntries, profiles, onClose }) => {
    if (!task) return null;

    // Calculate duration for each entry
    const calculateDuration = (startTime, endTime) => {
        if (!endTime) return 'Active';

        const start = new Date(startTime);
        const end = new Date(endTime);
        const diffMs = end - start;
        const diffSecs = Math.floor(diffMs / 1000);

        const hours = Math.floor(diffSecs / 3600);
        const minutes = Math.floor((diffSecs % 3600) / 60);
        const seconds = diffSecs % 60;

        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    // Calculate total time
    const totalSeconds = timeEntries.reduce((acc, entry) => {
        if (!entry.end_time) return acc;
        const start = new Date(entry.start_time);
        const end = new Date(entry.end_time);
        return acc + Math.floor((end - start) / 1000);
    }, 0);

    const totalHours = Math.floor(totalSeconds / 3600);
    const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
    const totalSecs = totalSeconds % 60;
    const totalFormatted = `${String(totalHours).padStart(2, '0')}:${String(totalMinutes).padStart(2, '0')}:${String(totalSecs).padStart(2, '0')}`;

    const creatorProfile = profiles.find(p => p.id === task.created_by);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{task.title}</h2>
                            {task.description && (
                                <p className="text-gray-600 mt-2">{task.description}</p>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="mt-4 space-y-2 text-sm">
                        <p className="text-gray-600">
                            <span className="font-medium">Created by:</span> {creatorProfile?.email || 'Unknown'}
                        </p>
                        <p className="text-gray-600">
                            <span className="font-medium">Created at:</span> {format(new Date(task.created_at), 'PPpp')}
                        </p>
                        {task.closed_at && (
                            <p className="text-gray-600">
                                <span className="font-medium">Closed at:</span> {format(new Date(task.closed_at), 'PPpp')}
                            </p>
                        )}
                    </div>
                </div>

                <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Time Entries</h3>

                    {timeEntries.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No time entries for this task</p>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                User
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Start Time
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                End Time
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Duration
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {timeEntries.map((entry) => {
                                            const userProfile = profiles.find(p => p.id === entry.user_id);
                                            return (
                                                <tr key={entry.id}>
                                                    <td className="px-4 py-3 text-sm text-gray-900">
                                                        {userProfile?.email || 'Unknown'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">
                                                        {format(new Date(entry.start_time), 'PPp')}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">
                                                        {entry.end_time ? format(new Date(entry.end_time), 'PPp') : 'Active'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                        {calculateDuration(entry.start_time, entry.end_time)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-6 pt-4 border-t border-gray-200">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-bold text-gray-900">Total Time:</span>
                                    <span className="text-2xl font-bold text-primary-600">{totalFormatted}</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="p-6 border-t border-gray-200 bg-gray-50">
                    <button onClick={onClose} className="btn-secondary w-full">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TaskDetailsModal;
