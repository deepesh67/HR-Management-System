import { useState, useEffect } from 'react';
import api from '../services/api';
import { 
    CheckCircle2, 
    XCircle, 
    Calendar, 
    User, 
    Clock, 
    ShieldCheck, 
    Search, 
    MoreVertical,
    Check,
    X,
    Filter,
    AlertCircle,
    Users,
    Trash2
} from 'lucide-react';

const AdminDashboard = () => {
    const [leaves, setLeaves] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('leaves'); // 'leaves' or 'attendance'
    const [filter, setFilter] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Action tracking states
    const [processingId, setProcessingId] = useState(null);
    const [actionMessage, setActionMessage] = useState(null);
    const [attendanceFilters, setAttendanceFilters] = useState({
        date: ''
    });

    useEffect(() => {
        console.log('Search Term Updated:', searchTerm);
    }, [searchTerm]);

    useEffect(() => {
        fetchAdminData();
    }, [activeTab, attendanceFilters]); // Refetch when tab or filters change

    const fetchAdminData = async () => {
        // Only set loading on manual triggers or tab changes to avoid flickering
        if (!leaves.length || activeTab === 'attendance') setLoading(true);
        try {
            const leavePromise = api.get('/leave/all');
            
            // Build attendance query (search is now handled on frontend for real-time responsiveness)
            let attendanceUrl = '/attendance/all';
            if (attendanceFilters.date) attendanceUrl += `?date=${attendanceFilters.date}`;
            
            const attendancePromise = api.get(attendanceUrl);

            const [leaveRes, attendanceRes] = await Promise.all([
                leavePromise,
                attendancePromise
            ]);
            
            setLeaves(leaveRes.data);
            setAttendance(attendanceRes.data);
        } catch (err) {
            console.error('Failed to fetch admin data', err);
            setActionMessage({ type: 'error', text: 'Failed to sync data from the server.' });
        } finally {
            setLoading(false);
        }
    };

    const handleLeaveStatus = async (id, status) => {
        if (processingId) return; // Prevent concurrent actions
        
        setProcessingId(id);
        setActionMessage(null);
        
        try {
            // Update leave in backend
            await api.put(`/leave/approve/${id}`, { status });
            
            // Optimistic UI update so we don't need a full refetch to see the tick
            setLeaves(prev => prev.map(leave => 
                leave._id === id ? { ...leave, status } : leave
            ));
            
            setFilter(status);
            
            setActionMessage({ type: 'success', text: `Leave request safely ${status.toLowerCase()}.` });
            
            // Still sync in background to assure data consistency
            fetchAdminData();
        } catch (err) {
            console.error('Approval failed:', err);
            setActionMessage({ 
                type: 'error', 
                text: err.response?.data?.message || `Failed to mark leave as ${status}.` 
            });
        } finally {
            setProcessingId(null);
            
            // Auto-clear success message after 3 seconds
            setTimeout(() => setActionMessage(null), 3000);
        }
    };

    const handleDeleteLeave = async (id) => {
        if (!window.confirm('Are you sure you want to permanently delete this leave record? This action cannot be undone.')) return;
        
        setProcessingId(id);
        setActionMessage(null);

        try {
            await api.delete(`/leave/${id}`);
            
            // Optimistically update UI
            setLeaves(prev => prev.filter(leave => leave._id !== id));
            
            setActionMessage({ type: 'success', text: 'Leave record permanently deleted.' });
        } catch (err) {
            console.error('Delete failed:', err);
            setActionMessage({ 
                type: 'error', 
                text: err.response?.data?.message || 'Failed to delete leave record.' 
            });
        } finally {
            setProcessingId(null);
            setTimeout(() => setActionMessage(null), 3000);
        }
    };

    const filteredLeaves = leaves.filter((leave) => {
        const matchesStatus = filter === 'ALL' || leave.status === filter;
        const search = searchTerm.toLowerCase().trim();
        
        const matchesSearch = !search || 
            (leave.userId?.name || '').toLowerCase().includes(search) ||
            (leave.userId?.email || '').toLowerCase().includes(search) ||
            (leave.leaveType || '').toLowerCase().includes(search) ||
            (leave.status || '').toLowerCase().includes(search) ||
            new Date(leave.startDate).toLocaleDateString().toLowerCase().includes(search) ||
            new Date(leave.endDate).toLocaleDateString().toLowerCase().includes(search);

        return matchesStatus && matchesSearch;
    });

    const filteredAttendance = attendance.filter((log) => {
        const search = searchTerm.toLowerCase().trim();
        return !search || 
            (log.userId?.name || '').toLowerCase().includes(search) ||
            (log.userId?.email || '').toLowerCase().includes(search) ||
            (log.status || '').toLowerCase().includes(search) ||
            new Date(log.date).toLocaleDateString().toLowerCase().includes(search);
    });

    // Debug logs as requested by user
    useEffect(() => {
        if (activeTab === 'leaves') console.log('Filtered Leaves:', filteredLeaves);
        if (activeTab === 'attendance') console.log('Filtered Attendance:', filteredAttendance);
    }, [searchTerm, leaves, attendance, activeTab, filter]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center space-x-2 text-primary-600 mb-1">
                        <ShieldCheck size={20} />
                        <span className="text-sm font-bold uppercase tracking-[0.2em]">Restricted Access</span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">Admin Control Panel</h1>
                    <p className="text-slate-500 mt-1">Oversee employee presence and manage leave applications.</p>
                </div>

                <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
                    <button 
                        onClick={() => setActiveTab('leaves')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                            activeTab === 'leaves' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                        Leaves
                    </button>
                    <button 
                        onClick={() => setActiveTab('attendance')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                            activeTab === 'attendance' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                        Attendance
                    </button>
                </div>
            </header>

            {/* In-app Toast / Notification Banner */}
            {actionMessage && (
                <div className={`p-4 rounded-xl flex items-center justify-between space-x-3 border animate-in slide-in-from-top-2 ${
                    actionMessage.type === 'error' 
                        ? 'bg-red-50 text-red-700 border-red-100' 
                        : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                }`}>
                    <div className="flex items-center space-x-3">
                        {actionMessage.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                        <span className="font-semibold text-sm">{actionMessage.text}</span>
                    </div>
                    <button onClick={() => setActionMessage(null)} className="hover:opacity-60 transition-opacity">
                        <X size={16}/>
                    </button>
                </div>
            )}

            {/* Dashboard Stats */}
            {!loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatsCard 
                        title="Active Personnel" 
                        value={new Set([
                            ...leaves.filter(l => l.userId).map(l => l.userId._id || l.userId),
                            ...attendance.filter(a => a.userId).map(a => a.userId._id || a.userId)
                        ]).size} 
                        icon={<Users className="text-blue-600" />} 
                        color="bg-blue-50"
                    />
                    <StatsCard 
                        title="Pending Requests" 
                        value={leaves.filter(l => l.status === 'Pending').length} 
                        icon={<Clock className="text-amber-600" />} 
                        color="bg-amber-50"
                    />
                    <StatsCard 
                        title="Approved Leaves" 
                        value={leaves.filter(l => l.status === 'Approved').length} 
                        icon={<CheckCircle2 className="text-emerald-600" />} 
                        color="bg-emerald-50"
                    />
                    <StatsCard 
                        title="Present Today" 
                        value={attendance.filter(a => {
                            const today = new Date().toDateString();
                            return new Date(a.date).toDateString() === today && a.status === 'Present';
                        }).length} 
                        icon={<Calendar className="text-purple-600" />} 
                        color="bg-purple-50"
                    />
                </div>
            )}

            <div className="glass rounded-3xl p-8 min-h-[500px]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center space-x-4">
                        <h2 className="text-2xl font-bold text-slate-800 capitalize">Manage {activeTab}</h2>
                        <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-xs font-black">
                            {activeTab === 'leaves' ? filteredLeaves.length : attendance.length} Records
                        </span>
                    </div>
                    
                    <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                        {activeTab === 'leaves' && (
                            <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                                {['ALL', 'Pending', 'Approved', 'Rejected'].map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                            filter === f 
                                                ? 'bg-white text-primary-600 shadow-sm' 
                                                : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        )}
                        {activeTab === 'attendance' && (
                            <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 items-center">
                                <span className="px-3 text-[10px] font-black uppercase text-slate-400">Date</span>
                                <input 
                                    type="date" 
                                    value={attendanceFilters.date}
                                    onChange={(e) => setAttendanceFilters({...attendanceFilters, date: e.target.value})}
                                    className="bg-white border-none rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm focus:ring-1 focus:ring-primary-500"
                                />
                                {attendanceFilters.date && (
                                    <button 
                                        onClick={() => setAttendanceFilters({...attendanceFilters, date: ''})}
                                        className="p-1.5 text-slate-400 hover:text-red-500"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        )}

                        <div className="relative w-full md:w-auto">
                            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                            <input 
                                type="text" 
                                placeholder={activeTab === 'leaves' ? 'Search leaves by name, type or status...' : 'Search attendance by name, email or status...'} 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-10 py-2 text-sm focus:ring-2 focus:ring-primary-500 w-full md:w-64 lg:w-80"
                            />
                            {searchTerm && (
                                <button 
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-2.5 text-slate-300 hover:text-slate-500 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-4">
                        <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin"></div>
                        <p className="text-slate-400 font-medium">Syncing data from server...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        {activeTab === 'leaves' ? (
                            filteredLeaves.length > 0 ? (
                                <table className="w-full">
                                <thead>
                                    <tr className="text-left text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                        <th className="pb-5 pl-4">Employee</th>
                                        <th className="pb-5">Type / Date</th>
                                        <th className="pb-5">Total Days</th>
                                        <th className="pb-5">Status</th>
                                        <th className="pb-5 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredLeaves.map((leave) => (
                                        <tr key={leave._id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="py-5 pl-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold">
                                                        {leave.userId?.name?.charAt(0) || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800">{leave.userId?.name || 'Unknown User'}</p>
                                                        <p className="text-xs text-slate-500">{leave.userId?.email || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5">
                                                <p className="text-sm font-bold text-slate-700">{leave.leaveType} Leave</p>
                                                <p className="text-xs text-slate-400 mt-1">
                                                    {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                                                </p>
                                            </td>
                                            <td className="py-5">
                                                <span className="font-bold text-slate-900">{leave.totalDays}</span>
                                                <span className="text-slate-400 text-xs ml-1">days</span>
                                            </td>
                                            <td className="py-5">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                    leave.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                                                    leave.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                    'bg-amber-100 text-amber-700'
                                                }`}>
                                                    {leave.status}
                                                </span>
                                            </td>
                                            <td className="py-5">
                                                <div className="flex items-center justify-center space-x-2">
                                                    {leave.status === 'Pending' ? (
                                                        <>
                                                            <button 
                                                                onClick={() => handleLeaveStatus(leave._id, 'Approved')}
                                                                disabled={processingId !== null}
                                                                className={`p-2 rounded-lg transition-all ${
                                                                    processingId === leave._id ? 'bg-emerald-100 text-emerald-400 cursor-wait' :
                                                                    processingId !== null ? 'bg-emerald-50 text-emerald-200 cursor-not-allowed' :
                                                                    'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'
                                                                }`}
                                                                title="Approve"
                                                            >
                                                                {processingId === leave._id ? <Clock size={16} className="animate-spin" /> : <Check size={16} />}
                                                            </button>
                                                            <button 
                                                                onClick={() => handleLeaveStatus(leave._id, 'Rejected')}
                                                                disabled={processingId !== null}
                                                                className={`p-2 rounded-lg transition-all ${
                                                                    processingId === leave._id ? 'bg-red-100 text-red-400 cursor-wait' :
                                                                    processingId !== null ? 'bg-red-50 text-red-200 cursor-not-allowed' :
                                                                    'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white'
                                                                }`}
                                                                title="Reject"
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <div className="flex items-center space-x-2">
                                                            {leave.status === 'Approved' ? (
                                                                <CheckCircle2 size={18} className="text-emerald-400" />
                                                            ) : (
                                                                <XCircle size={18} className="text-red-400" />
                                                            )}
                                                        </div>
                                                    )}
                                                    
                                                    <button 
                                                        onClick={() => handleDeleteLeave(leave._id)}
                                                        disabled={processingId !== null}
                                                        className={`p-2 rounded-lg transition-all ${
                                                            processingId === leave._id ? 'bg-slate-100 text-slate-400 cursor-wait' :
                                                            processingId !== null ? 'bg-slate-50 text-slate-200 cursor-not-allowed' :
                                                            'bg-slate-50 text-slate-400 hover:bg-red-600 hover:text-white'
                                                        }`}
                                                        title="Delete Record"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : leaves.length > 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-slate-50/30 rounded-3xl border-2 border-dashed border-slate-100">
                                <Search size={48} className="text-slate-200 mb-4" />
                                <h3 className="text-lg font-bold text-slate-800">No matching records found</h3>
                                <p className="text-slate-400 mt-1">Try adjusting your search or filters to find what you're looking for.</p>
                                <button 
                                    onClick={() => { setLeaveSearchTerm(''); setFilter('ALL'); }}
                                    className="mt-6 text-primary-600 font-bold hover:underline"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20">
                                <div className="p-4 bg-slate-50 rounded-2xl mb-4"><Clock size={32} className="text-slate-300" /></div>
                                <h3 className="text-lg font-bold text-slate-800">No leave applications found</h3>
                                <p className="text-slate-400">Applications will appear here once employees submit them.</p>
                             </div>
                        )
                    ) : (
                        filteredAttendance.length > 0 ? (
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                        <th className="pb-5 pl-4">Employee</th>
                                        <th className="pb-5">Date</th>
                                        <th className="pb-5">Status</th>
                                        <th className="pb-5">Logged At</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredAttendance.map((log) => (
                                        <tr key={log._id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="py-5 pl-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold">
                                                        {log.userId?.name?.charAt(0) || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800">{log.userId?.name || 'Unknown User'}</p>
                                                        <p className="text-xs text-slate-400 capitalize">{log.userId?.role || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5 font-bold text-slate-700">
                                                {new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </td>
                                            <td className="py-5">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                                    log.status === 'Present' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                                                }`}>
                                                    {log.status === 'Present' ? <Check size={12} className="mr-1" /> : <X size={12} className="mr-1" />}
                                                    {log.status}
                                                </span>
                                            </td>
                                            <td className="py-5 text-slate-400 text-sm">
                                                {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : attendance.length > 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-slate-50/30 rounded-3xl border-2 border-dashed border-slate-100">
                                <Search size={48} className="text-slate-200 mb-4" />
                                <h3 className="text-lg font-bold text-slate-800">No matching attendance records</h3>
                                <p className="text-slate-400 mt-1">Try adjusting your search or date filters.</p>
                                <button 
                                    onClick={() => { setSearchTerm(''); setAttendanceFilters({ date: '' }); }}
                                    className="mt-6 text-primary-600 font-bold hover:underline"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20">
                                <div className="p-4 bg-slate-50 rounded-2xl mb-4"><Calendar size={32} className="text-slate-300" /></div>
                                <h3 className="text-lg font-bold text-slate-800">No attendance records found</h3>
                                <p className="text-slate-400">Records will appear once employees mark their attendance.</p>
                            </div>
                        )
                    )}
                    </div>
                )}
            </div>
        </div>
    );
};

const StatsCard = ({ title, value, icon, color }) => (
    <div className="glass p-6 rounded-3xl flex flex-col hover:-translate-y-1 transition-transform duration-300">
        <div className={`p-4 rounded-2xl w-fit mb-5 ${color}`}>
            {icon}
        </div>
        <span className="text-4xl font-black text-slate-900 mb-1">
            {value}
        </span>
        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">{title}</h4>
    </div>
);

export default AdminDashboard;
