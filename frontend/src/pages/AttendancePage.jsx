import { useState, useEffect } from 'react';
import api from '../services/api';
import { 
    Clock, 
    CheckCircle, 
    XCircle, 
    Calendar, 
    Search,
    UserCheck,
    AlertCircle,
    Loader2
} from 'lucide-react';

const AttendancePage = () => {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(false);
    const [marking, setMarking] = useState(false);
    const [error, setError] = useState('');
    const [stats, setStats] = useState({ present: 0, absent: 0 });
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchAttendance();
    }, []);

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/attendance/my');
            setAttendance(data);
            
            const present = data.filter(a => a.status === 'Present').length;
            setStats({
                present,
                absent: data.length - present
            });
        } catch (err) {
            console.error('Failed to fetch attendance', err);
        } finally {
            setLoading(false);
        }
    };

    const handleMark = async (status = 'Present') => {
        setMarking(true);
        setError('');
        try {
            await api.post('/attendance/mark', { status });
            fetchAttendance();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to mark attendance');
        } finally {
            setMarking(false);
        }
    };

    const isTodayMarked = attendance.some(a => {
        const today = new Date().toDateString();
        const recordDate = new Date(a.date).toDateString();
        return today === recordDate;
    });

    const filteredAttendance = attendance.filter(log => {
        if (!searchQuery.trim()) return true;
        
        const q = searchQuery.toLowerCase().trim();
        const dateObj = new Date(log.date);
        
        const shortMonthDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toLowerCase();
        const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const status = log.status.toLowerCase();
        const time = new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase();
        
        return shortMonthDate.includes(q) || 
               dayOfWeek.includes(q) || 
               status.includes(q) || 
               time.includes(q);
    });

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Attendance Tracker</h1>
                    <p className="text-slate-500 mt-1">Keep track of your daily presence and work hours.</p>
                </div>

                <div className="glass p-2 rounded-2xl flex items-center space-x-4">
                    <div className="px-6 py-2 text-center">
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Present</p>
                        <p className="text-xl font-bold text-emerald-600">{stats.present}</p>
                    </div>
                    <div className="w-px h-8 bg-slate-200"></div>
                    <div className="px-6 py-2 text-center">
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Absent</p>
                        <p className="text-xl font-bold text-red-600">{stats.absent}</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {/* Mark Card */}
                <div className="glass rounded-3xl p-10 flex flex-col items-center text-center">
                    <div className="w-32 h-32 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 mb-8 border-8 border-primary-50 relative">
                        <UserCheck size={64} />
                        {isTodayMarked && (
                            <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-full border-4 border-white">
                                <CheckCircle size={24} />
                            </div>
                        )}
                    </div>

                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Daily Check-in</h2>
                    <p className="text-slate-500 mb-8 max-w-[200px]">
                        {isTodayMarked 
                          ? "You've already marked your attendance for today." 
                          : "Remember to mark your attendance every working day."}
                    </p>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl flex items-center space-x-2 text-xs border border-red-100">
                            <AlertCircle size={14} className="shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {!isTodayMarked ? (
                        <div className="w-full space-y-4">
                            <button 
                                onClick={() => handleMark('Present')}
                                disabled={marking}
                                className="btn-primary w-full py-4 flex items-center justify-center space-x-3 text-lg"
                            >
                                {marking ? <Loader2 className="animate-spin" size={24} /> : (
                                    <>
                                        <CheckCircle size={24} />
                                        <span>Mark Present</span>
                                    </>
                                )}
                            </button>
                            <button 
                                onClick={() => handleMark('Absent')}
                                disabled={marking}
                                className="w-full py-3 text-slate-400 hover:text-red-500 font-semibold transition-colors"
                            >
                                Mark as Absent
                            </button>
                        </div>
                    ) : (
                        <div className="w-full py-4 px-6 bg-emerald-50 text-emerald-700 rounded-2xl font-bold border border-emerald-100">
                            Attendance Saved
                        </div>
                    )}
                    
                    <p className="mt-8 text-xs text-slate-400 flex items-center">
                        <Clock size={12} className="mr-1" />
                        Today: {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>

                {/* Logs List */}
                <div className="md:col-span-2 glass rounded-3xl p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold text-slate-800">Attendance History</h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search logs..." 
                                className="bg-slate-50 border-none rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary-400 w-48 md:w-64"
                            />
                        </div>
                    </div>

                    <div className="overflow-hidden">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="text-left text-xs font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                                    <th className="pb-4 font-black">Date</th>
                                    <th className="pb-4 font-black">Status</th>
                                    <th className="pb-4 font-black">Clock-in Time</th>
                                    <th className="pb-4 font-black">Accuracy</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredAttendance.map((log) => (
                                    <tr key={log._id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="py-5">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-slate-100 rounded-xl flex flex-col items-center justify-center text-[10px] font-bold text-slate-500">
                                                    <span>{new Date(log.date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</span>
                                                    <span className="text-sm text-slate-900 leading-none">{new Date(log.date).getDate()}</span>
                                                </div>
                                                <span className="font-bold text-slate-700">{new Date(log.date).toLocaleDateString('en-US', { weekday: 'long' })}</span>
                                            </div>
                                        </td>
                                        <td className="py-5">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                                                log.status === 'Present' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'
                                            }`}>
                                                {log.status}
                                            </span>
                                        </td>
                                        <td className="py-5 text-sm text-slate-500 font-medium">
                                            {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="py-5">
                                            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${log.status === 'Present' ? 'bg-emerald-400 w-[100%]' : 'bg-slate-200 w-0'}`}></div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {attendance.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan="4" className="py-20 text-center text-slate-400 italic">No attendance records found.</td>
                                    </tr>
                                )}
                                {attendance.length > 0 && filteredAttendance.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="py-20 text-center text-slate-400 italic">
                                            No records found matching "{searchQuery}".
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttendancePage;
