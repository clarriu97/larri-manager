import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import TaskForm from './TaskForm';
import TaskCard from './TaskCard';
import CloseTaskModal from './CloseTaskModal';
import TaskDetailsModal from './TaskDetailsModal';
import toast from 'react-hot-toast';

const Dashboard = () => {
    const { user, signOut } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [timeEntries, setTimeEntries] = useState([]);
    const [profiles, setProfiles] = useState([]);
    const [activeTab, setActiveTab] = useState('open');
    const [loading, setLoading] = useState(true);
    const [closeModalData, setCloseModalData] = useState(null);
    const [detailsModalTask, setDetailsModalTask] = useState(null);

    // Fetch initial data and setup real-time subscriptions
    useEffect(() => {
        fetchData();

        // Subscribe to tasks changes
        const tasksSubscription = supabase
            .channel('tasks_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
                console.log('Task change:', payload);
                if (payload.eventType === 'INSERT') {
                    setTasks(prev => [payload.new, ...prev]);
                } else if (payload.eventType === 'UPDATE') {
                    setTasks(prev => prev.map(t => t.id === payload.new.id ? payload.new : t));
                } else if (payload.eventType === 'DELETE') {
                    setTasks(prev => prev.filter(t => t.id !== payload.old.id));
                }
            })
            .subscribe();

        // Subscribe to time_entries changes
        const entriesSubscription = supabase
            .channel('time_entries_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'time_entries' }, (payload) => {
                console.log('Time entry change:', payload);
                if (payload.eventType === 'INSERT') {
                    setTimeEntries(prev => [payload.new, ...prev]);
                } else if (payload.eventType === 'UPDATE') {
                    setTimeEntries(prev => prev.map(e => e.id === payload.new.id ? payload.new : e));
                } else if (payload.eventType === 'DELETE') {
                    setTimeEntries(prev => prev.filter(e => e.id !== payload.old.id));
                }
            })
            .subscribe();

        // Cleanup subscriptions on unmount
        return () => {
            supabase.removeChannel(tasksSubscription);
            supabase.removeChannel(entriesSubscription);
        };
    }, []);

    const fetchData = async () => {
        try {
            // Fetch tasks
            const { data: tasksData, error: tasksError } = await supabase
                .from('tasks')
                .select('*')
                .order('created_at', { ascending: false });

            if (tasksError) throw tasksError;
            setTasks(tasksData || []);

            // Fetch time entries
            const { data: entriesData, error: entriesError } = await supabase
                .from('time_entries')
                .select('*')
                .order('start_time', { ascending: false });

            if (entriesError) throw entriesError;
            setTimeEntries(entriesData || []);

            // Fetch profiles
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('*');

            if (profilesError) throw profilesError;
            setProfiles(profilesData || []);
        } catch (error) {
            toast.error('Failed to load data');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTask = async ({ title, description }) => {
        const { error } = await supabase
            .from('tasks')
            .insert([{
                title,
                description,
                created_by: user.id,
                status: 'open'
            }]);

        if (error) throw error;
    };

    const handleClockIn = async (task) => {
        // Check if ANY user has an active entry for this task (task exclusivity)
        const anyActiveEntry = timeEntries.find(
            e => e.task_id === task.id && !e.end_time
        );

        if (anyActiveEntry) {
            // Check if it's the current user
            if (anyActiveEntry.user_id === user.id) {
                toast.error('You already have an active session for this task');
            } else {
                // Another user is working on this task
                const otherUser = profiles.find(p => p.id === anyActiveEntry.user_id);
                toast.error(`This task is currently being worked on by ${otherUser?.email || 'another user'}`);
            }
            return;
        }

        const { error } = await supabase
            .from('time_entries')
            .insert([{
                task_id: task.id,
                user_id: user.id,
                start_time: new Date().toISOString()
            }]);

        if (error) {
            toast.error('Failed to clock in');
            console.error(error);
        } else {
            toast.success('Clocked in successfully!');
        }
    };

    const handleClockOut = (task, entry) => {
        setCloseModalData({ task, entry });
    };

    const handleCloseTask = async () => {
        if (!closeModalData) return;

        const { task, entry } = closeModalData;

        try {
            // End the time entry first
            const { error: entryError } = await supabase
                .from('time_entries')
                .update({ end_time: new Date().toISOString() })
                .eq('id', entry.id);

            if (entryError) throw entryError;

            // Close the task
            const { error: taskError } = await supabase
                .from('tasks')
                .update({
                    status: 'closed',
                    closed_at: new Date().toISOString()
                })
                .eq('id', task.id);

            if (taskError) throw taskError;

            toast.success('Task closed successfully!');
            setCloseModalData(null); // Close the modal
        } catch (error) {
            toast.error('Failed to close task');
            console.error(error);
        }
    };

    const handleKeepOpen = async () => {
        if (!closeModalData) return;

        const { entry } = closeModalData;

        try {
            // Just end the time entry
            const { error } = await supabase
                .from('time_entries')
                .update({ end_time: new Date().toISOString() })
                .eq('id', entry.id);

            if (error) throw error;

            toast.success('Clocked out successfully!');
            setCloseModalData(null); // Close the modal
        } catch (error) {
            toast.error('Failed to clock out');
            console.error(error);
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut();
            toast.success('Signed out successfully');
        } catch (error) {
            toast.error('Failed to sign out');
        }
    };

    const openTasks = tasks.filter(t => t.status === 'open');
    const closedTasks = tasks.filter(t => t.status === 'closed');

    const getTaskTimeEntries = (taskId) => {
        return timeEntries.filter(e => e.task_id === taskId);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Time Tracker</h1>
                            <p className="text-sm text-gray-600 mt-1">{user?.email}</p>
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <TaskForm onTaskCreated={handleCreateTask} />

                {/* Tabs */}
                <div className="mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            <button
                                onClick={() => setActiveTab('open')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'open'
                                    ? 'border-primary-500 text-primary-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Open Tasks ({openTasks.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('closed')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'closed'
                                    ? 'border-primary-500 text-primary-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Closed Tasks ({closedTasks.length})
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Task List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeTab === 'open' ? (
                        openTasks.length === 0 ? (
                            <div className="col-span-full text-center py-12">
                                <p className="text-gray-500">No open tasks. Create one to get started!</p>
                            </div>
                        ) : (
                            openTasks.map(task => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    timeEntries={timeEntries}
                                    profiles={profiles}
                                    onClockIn={handleClockIn}
                                    onClockOut={handleClockOut}
                                />
                            ))
                        )
                    ) : (
                        closedTasks.length === 0 ? (
                            <div className="col-span-full text-center py-12">
                                <p className="text-gray-500">No closed tasks yet.</p>
                            </div>
                        ) : (
                            closedTasks.map(task => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    timeEntries={timeEntries}
                                    profiles={profiles}
                                    onClick={setDetailsModalTask}
                                />
                            ))
                        )
                    )}
                </div>
            </main>

            {/* Modals */}
            {closeModalData && (
                <CloseTaskModal
                    task={closeModalData.task}
                    onClose={() => setCloseModalData(null)}
                    onCloseTask={handleCloseTask}
                    onKeepOpen={handleKeepOpen}
                />
            )}

            {detailsModalTask && (
                <TaskDetailsModal
                    task={detailsModalTask}
                    timeEntries={getTaskTimeEntries(detailsModalTask.id)}
                    profiles={profiles}
                    onClose={() => setDetailsModalTask(null)}
                />
            )}
        </div>
    );
};

export default Dashboard;
