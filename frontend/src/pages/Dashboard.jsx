import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
    Calendar, 
    CheckCircle, 
    XCircle, 
    Clock, 
    User,
    TrendingUp,
    AlertCircle
} from 'lucide-react';

const Dashboard = () => {
    const { user, refreshProfile } = useAuth();
    const [stats, setStats] = useState({
        totalLeaves: 0,
        pendingLeaves: 0,
        recentAttendance: []
    });
    
    // We only want to show the full-screen loading spinner on the absolute first mount
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Using a ref to track background fetching state to prevent overlap
    const isFetching = useRef(false);

    const fetchDashboardData = useCallback(async (isSilentRefresh = false) => {
        // Prevent concurrent or overlapping refetches
        if (isFetching.current) return;
        
        try {
            isFetching.current = true;
            if (!isSilentRefresh) setLoading(true);
            setError(null);

            const [leaveRes, attendanceRes] = await Promise.all([
                api.get('/leave/my'),
                api.get('/attendance/my')
            ]);
            
            const pending = leaveRes.data.filter(l => l.status === 'Pending').length;
            
            setStats({
                totalLeaves: leaveRes.data.length,
                pendingLeaves: pending,
                recentAttendance: attendanceRes.data.slice(0, 5)
            });
            
            // This updates user data globally (which might create a new object reference in context)
            if (refreshProfile) {
                await refreshProfile();
            }
        } catch (err) {
            console.error('Error fetching dashboard data', err);
            setError('Failed to sync dashboard data. Ensure your connection is stable.');
        } finally {
            isFetching.current = false;
            setLoading(false); // Only set to false, never back to true unless it was an explicit non-silent fetch
        }
    }, [refreshProfile]);

    // Use a ref to always hold the latest fetch function, avoiding scope staleness 
    // without triggering useEffect dependency loops.
    const fetchLatestData = useRef(fetchDashboardData);
    useEffect(() => {
        fetchLatestData.current = fetchDashboardData;
    }, [fetchDashboardData]);

    useEffect(() => {
        // 1. Initial Load: Run strictly once on mount. 
        // We do NOT include 'user' or 'fetchDashboardData' as dependencies here to prevent infinite loops.
        fetchLatestData.current(false);

        // 2. Window Focus Event: Debounced to prevent rapid consecutive firing
        let focusTimeout;
        const handleFocus = () => {
            clearTimeout(focusTimeout);
            // 500ms debounce buffer against aggressive tab switching
            focusTimeout = setTimeout(() => {
                fetchLatestData.current(true); 
            }, 500); 
        };

        window.addEventListener('focus', handleFocus);
        
        // 3. Cleanup: Strip listener to avoid memory leaks
        return () => {
            window.removeEventListener('focus', handleFocus);
            clearTimeout(focusTimeout);
        };
    }, []); 

    if (loading) return (
        <div className="flex flex-col justify-center items-center h-[70vh] space-y-5 animate-pulse">
            <div className="w-16 h-16 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin"></div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Loading Workspace...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Welcome, {user?.name || 'Employee'}</h1>
                    <p className="text-slate-500 mt-1">Here's what's happening today at the office.</p>
                </div>
            </header>

            {/* Error UI Handling - Soft banner that doesn't break layout */}
            {error && (
                <div className="bg-red-50 text-red-700 px-5 py-4 rounded-2xl flex items-center justify-between border border-red-100 animate-in slide-in-from-top-2">
                    <div className="flex items-center space-x-3">
                        <AlertCircle size={20} className="text-red-500" />
                        <span className="font-semibold text-sm">{error}</span>
                    </div>
                    <button 
                        onClick={() => fetchLatestData.current(true)}
                        className="text-xs font-bold uppercase tracking-wider hover:text-red-900"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Leave Balance" 
                    value={user?.leaveBalance ?? 0} 
                    icon={<Calendar className="text-blue-600" />} 
                    color="bg-blue-50"
                    suffix="Days Remaining"
                />
                <StatCard 
                    title="Pending Requests" 
                    value={stats.pendingLeaves} 
                    icon={<Clock className="text-amber-600" />} 
                    color="bg-amber-50"
                    suffix="Awaiting Review"
                />
                <StatCard 
                    title="History" 
                    value={stats.totalLeaves} 
                    icon={<TrendingUp className="text-emerald-600" />} 
                    color="bg-emerald-50"
                    suffix="Total Applications"
                />
                <StatCard 
                    title="Role" 
                    value={user?.role || 'Employee'} 
                    icon={<User className="text-purple-600" />} 
                    color="bg-purple-50"
                    className="capitalize"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Attendance */}
                <div className="lg:col-span-2 glass rounded-3xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-800">Recent Attendance</h2>
                        <div className="flex space-x-3 items-center">
                            {isFetching.current && <Clock size={16} className="text-primary-400 animate-spin" />}
                            <button 
                                className="text-sm text-primary-600 font-bold hover:underline"
                                onClick={() => fetchLatestData.current(true)}
                                disabled={isFetching.current}
                            >
                                Sync Now
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                    <th className="pb-4">Date</th>
                                    <th className="pb-4">Status</th>
                                    <th className="pb-4">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {stats.recentAttendance.map((log) => (
                                    <tr key={log._id} className="last:border-0 group hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 text-slate-700 font-bold">
                                            {new Date(log.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </td>
                                        <td className="py-4">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                                log.status === 'Present' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                                            }`}>
                                                {log.status === 'Present' ? <CheckCircle size={14} className="mr-1" /> : <XCircle size={14} className="mr-1" />}
                                                {log.status}
                                            </span>
                                        </td>
                                        <td className="py-4 text-slate-500 font-medium text-sm">
                                            {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                    </tr>
                                ))}
                                {stats.recentAttendance.length === 0 && (
                                    <tr>
                                        <td colSpan="3" className="py-10 text-center text-slate-400 italic font-medium">No attendance records found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Profile Card */}
                <div className="glass rounded-3xl p-8 flex flex-col items-center text-center">
                    <div className="w-28 h-28 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 mb-5 ring-8 ring-primary-50">
                        <span className="text-4xl font-black">{user?.name?.charAt(0) || '?'}</span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-800">{user?.name || 'Employee'}</h3>
                    <p className="text-slate-500 mb-8 font-medium">{user?.email || 'No email provided'}</p>
                    
                    <div className="w-full space-y-5 pt-6 border-t border-slate-100">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400 font-semibold uppercase tracking-wider">Joined Date</span>
                            <span className="font-bold text-slate-700">
                                {user?.dateOfJoining ? new Date(user.dateOfJoining).toLocaleDateString() : 'N/A'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400 font-semibold uppercase tracking-wider">Employee ID</span>
                            <span className="font-bold text-slate-700">#{user?._id?.slice(-6).toUpperCase() || '000000'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon, color, className = "", suffix = "" }) => (
    <div className={`glass p-6 rounded-3xl flex flex-col hover:-translate-y-1 transition-transform duration-300 ${className}`}>
        <div className={`p-4 rounded-2xl w-fit mb-5 ${color}`}>
            {icon}
        </div>
        <span className="text-4xl font-black text-slate-900 mb-1">
            {value}
        </span>
        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">{title}</h4>
        {suffix && <p className="text-xs font-semibold text-slate-400 mt-auto">{suffix}</p>}
    </div>
);

export default Dashboard;
