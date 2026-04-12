import { useState, useEffect } from 'react';
import api from '../services/api';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { 
    Calendar, 
    Send, 
    Trash2, 
    AlertCircle, 
    CheckCircle2, 
    Clock, 
    Filter,
    ArrowRight,
    MapPin,
    Briefcase,
    CalendarDays,
    Pencil,
    X,
    Search,
    Loader2
} from 'lucide-react';

const LeavePage = () => {
    const [leaves, setLeaves] = useState([]);
    const [formData, setFormData] = useState({
        leaveType: 'Paid',
        startDate: null,
        endDate: null,
        reason: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [editingLeaveId, setEditingLeaveId] = useState(null);

    // Debug logs as requested by user
    useEffect(() => {
        console.log('Search Term Updated (Employee):', searchTerm);
    }, [searchTerm]);

    useEffect(() => {
        fetchLeaves();
    }, []);

    const fetchLeaves = async () => {
        try {
            const { data } = await api.get('/leave/my');
            setLeaves(data);
        } catch (err) {
            console.error('Failed to fetch leaves', err);
        }
    };

    const handleApply = async (e) => {
        if (e) e.preventDefault();
        
        if (!formData.startDate || !formData.endDate) {
            return setMessage({ type: 'error', text: 'Please select both start and end dates.' });
        }

        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            const payload = {
                ...formData,
                startDate: formData.startDate.toISOString(),
                endDate: formData.endDate.toISOString()
            };

            if (editingLeaveId) {
                await api.put(`/leave/update/${editingLeaveId}`, payload);
                setMessage({ type: 'success', text: 'Leave application updated successfully!' });
            } else {
                await api.post('/leave/apply', payload);
                setMessage({ type: 'success', text: 'Leave application submitted successfully!' });
            }
            
            setFormData({ leaveType: 'Paid', startDate: null, endDate: null, reason: '' });
            setEditingLeaveId(null);
            fetchLeaves();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to process leave application' });
        } finally {
            setLoading(false);
            // Clear success message after 5 seconds
            setTimeout(() => setMessage({ type: '', text: '' }), 5000);
        }
    };

    const handleEdit = (leave) => {
        setEditingLeaveId(leave._id);
        setFormData({
            leaveType: leave.leaveType,
            startDate: new Date(leave.startDate),
            endDate: new Date(leave.endDate),
            reason: leave.reason || ''
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingLeaveId(null);
        setFormData({ leaveType: 'Paid', startDate: null, endDate: null, reason: '' });
        setMessage({ type: '', text: '' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this pending leave?')) return;
        try {
            await api.delete(`/leave/delete/${id}`);
            fetchLeaves();
        } catch (err) {
            alert('Failed to cancel leave');
        }
    };
    const filteredData = leaves.filter((leave) => {
        const search = searchTerm.toLowerCase().trim();
        if (!search) return true;

        return (
            (leave.leaveType || '').toLowerCase().includes(search) ||
            (leave.status || '').toLowerCase().includes(search) ||
            (leave.reason || '').toLowerCase().includes(search) ||
            new Date(leave.startDate).toLocaleDateString().toLowerCase().includes(search) ||
            new Date(leave.endDate).toLocaleDateString().toLowerCase().includes(search) ||
            new Date(leave.appliedDate).toLocaleDateString().toLowerCase().includes(search)
        );
    });

    useEffect(() => {
        console.log('Filtered Data (Employee):', filteredData);
    }, [searchTerm, leaves]);
    // Custom Input for DatePicker to match our theme and include the icon
    const CustomDateInput = ({ value, onClick, placeholder }) => (
        <div className="relative group w-full" onClick={onClick}>
            <CalendarDays size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-primary-500 transition-colors z-10 pointer-events-none" />
            <input
                readOnly
                value={value}
                placeholder={placeholder || 'dd-mm-yyyy'}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-primary-500/10 outline-none transition-all cursor-pointer group-hover:border-primary-200"
            />
        </div>
    );

    return (
        <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Leave Management</h1>
                    <p className="text-slate-500 mt-2 font-medium">Coordinate your time off and monitor application status.</p>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6 lg:gap-8 items-start">
                
                {/* Apply Form Card */}
                <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/40">
                    <div className="flex items-center space-x-4 mb-10">
                        <div className={`p-3 rounded-2xl ${editingLeaveId ? 'bg-amber-100 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                            {editingLeaveId ? <Pencil size={24} /> : <Send size={24} />}
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                            {editingLeaveId ? 'Edit Application' : 'Apply for Leave'}
                        </h2>
                    </div>

                    {message.text && (
                        <div className={`mb-8 p-5 rounded-2xl flex items-center space-x-3 text-sm font-bold border animate-in slide-in-from-top-4 duration-300 ${
                            message.type === 'success' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                : 'bg-red-50 text-red-700 border-red-100'
                        }`}>
                            {message.type === 'success' ? <CheckCircle2 size={20} className="shrink-0" /> : <AlertCircle size={20} className="shrink-0" />}
                            <span>{message.text}</span>
                        </div>
                    )}

                    <form onSubmit={handleApply} className="space-y-8 flex-1">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Leave Category</label>
                            <div className="relative">
                                <Filter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                <select 
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-10 py-4 text-sm font-bold text-slate-800 appearance-none focus:bg-white focus:ring-4 focus:ring-primary-500/10 outline-none transition-all cursor-pointer"
                                    value={formData.leaveType}
                                    onChange={(e) => setFormData({...formData, leaveType: e.target.value})}
                                >
                                    <option value="Paid">Paid Vacation</option>
                                    <option value="Sick">Sick / Medical</option>
                                    <option value="Casual">Casual / Personal</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <ArrowRight size={14} className="rotate-90" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 text-left">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-left block">Start Date</label>
                                <DatePicker
                                    selected={formData.startDate}
                                    onChange={(date) => setFormData({...formData, startDate: date})}
                                    dateFormat="dd-MM-yyyy"
                                    placeholderText="dd-mm-yyyy"
                                    customInput={<CustomDateInput placeholder="Start Date" />}
                                    minDate={new Date()}
                                />
                            </div>
                            <div className="space-y-2 text-left">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-left block">End Date</label>
                                <DatePicker
                                    selected={formData.endDate}
                                    onChange={(date) => setFormData({...formData, endDate: date})}
                                    dateFormat="dd-MM-yyyy"
                                    placeholderText="dd-mm-yyyy"
                                    customInput={<CustomDateInput placeholder="End Date" />}
                                    minDate={formData.startDate || new Date()}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reason for Leave</label>
                            <textarea 
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-primary-500/10 outline-none transition-all h-32 resize-none"
                                placeholder="Explain why you're taking this time off..."
                                value={formData.reason}
                                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className={`w-full rounded-[1.25rem] py-5 font-black text-sm active:scale-[0.98] transition-all shadow-xl flex items-center justify-center space-x-3 mt-auto ${
                                editingLeaveId 
                                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20' 
                                : 'bg-primary-600 hover:bg-primary-700 text-white shadow-primary-500/20'
                            } disabled:opacity-50`}
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    <span>{editingLeaveId ? 'Update Changes' : 'Submit Application'}</span>
                                    {editingLeaveId ? <CheckCircle2 size={20} /> : <ArrowRight size={20} />}
                                </>
                            )}
                        </button>

                        {editingLeaveId && (
                            <button 
                                type="button" 
                                onClick={cancelEdit}
                                className="w-full py-3 text-slate-400 font-bold hover:text-red-500 transition-colors flex items-center justify-center space-x-2"
                            >
                                <X size={14} />
                                <span>Cancel Editing</span>
                            </button>
                        )}
                    </form>
                </div>

                {/* History Card with Internal Scroll */}
                <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col lg:max-h-[820px] overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 shrink-0 gap-4">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                                <Clock size={24} />
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Application History</h2>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <div className="relative group flex-1 sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={16} />
                                <input 
                                    type="text"
                                    placeholder="Search history..."
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-2 text-xs font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-primary-500/10 outline-none transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <button 
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center space-x-2 bg-slate-50 px-4 py-2 rounded-xl text-slate-500 font-bold text-xs ring-1 ring-slate-100 whitespace-nowrap">
                                <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                                <span>{filteredData.length} Records</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                        {filteredData.map((leave, idx) => (
                            <div 
                                key={leave._id} 
                                className="group p-6 border border-slate-50 rounded-3xl hover:border-primary-100 hover:bg-primary-50/20 transition-all duration-300"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-start space-x-5">
                                        <div className={`p-4 rounded-2xl shrink-0 ${
                                            leave.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' :
                                            leave.status === 'Rejected' ? 'bg-red-50 text-red-600' :
                                            'bg-amber-50 text-amber-600'
                                        }`}>
                                            <CalendarDays size={24} />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center flex-wrap gap-2">
                                                <h3 className="font-black text-lg text-slate-900 leading-tight">{leave.leaveType} Leave</h3>
                                                <span className={`text-[9px] uppercase font-black px-3 py-1 rounded-full ${
                                                    leave.status === 'Approved' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' :
                                                    leave.status === 'Rejected' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' :
                                                    'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                                                }`}>
                                                    {leave.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-500 font-bold flex items-center flex-wrap gap-y-1">
                                                <span className="text-slate-800">{new Date(leave.startDate).toLocaleDateString('en-GB').split('/').join('-')}</span>
                                                <ArrowRight size={12} className="mx-2 text-slate-300" />
                                                <span className="text-slate-800">{new Date(leave.endDate).toLocaleDateString('en-GB').split('/').join('-')}</span>
                                                <span className="mx-3 w-1 h-1 bg-slate-300 rounded-full" />
                                                <span className="text-primary-600 bg-primary-50 px-2 py-0.5 rounded-lg">{leave.totalDays} Workdays</span>
                                            </p>
                                            {leave.reason && (
                                                <div className="mt-3 py-2 px-3 bg-slate-50 border-l-2 border-slate-200 rounded-r-lg">
                                                    <p className="text-[11px] text-slate-500 font-bold italic leading-relaxed">"{leave.reason}"</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-50">
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Applied Date</p>
                                            <p className="text-xs font-black text-slate-700">{new Date(leave.appliedDate).toLocaleDateString()}</p>
                                        </div>
                                        
                                        {leave.status === 'Pending' && (
                                            <div className="flex items-center space-x-1">
                                                {new Date(leave.startDate) >= new Date().setHours(0,0,0,0) && (
                                                    <button 
                                                        onClick={() => handleEdit(leave)}
                                                        className="p-3 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-2xl transition-all active:scale-90"
                                                        title="Edit Request"
                                                    >
                                                        <Pencil size={20} />
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => handleDelete(leave._id)}
                                                    className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all active:scale-90"
                                                    title="Cancel Request"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {filteredData.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-24 text-center">
                                <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6 text-slate-200">
                                    {searchTerm ? <Search size={40} /> : <Calendar size={40} />}
                                </div>
                                <h3 className="text-lg font-black text-slate-800">
                                    {searchTerm ? 'No matching records found' : 'No applications yet'}
                                </h3>
                                <p className="text-sm text-slate-400 mt-2 max-w-xs font-medium">
                                    {searchTerm 
                                        ? 'Try adjusting your search terms to find what you are looking for.' 
                                        : 'Your leave history will appear here once you submit your first application.'}
                                </p>
                                {searchTerm && (
                                    <button 
                                        onClick={() => setSearchTerm('')}
                                        className="mt-6 text-primary-600 font-bold hover:underline"
                                    >
                                        Clear search
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <style jsx="true">{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
                .react-datepicker-wrapper {
                    width: 100%;
                }
                .react-datepicker {
                    border: none;
                    border-radius: 1.5rem;
                    box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.15);
                    font-family: inherit;
                    overflow: hidden;
                }
                .react-datepicker__header {
                    background: #f8fafc;
                    border-bottom: 1px solid #f1f5f9;
                    padding-top: 1.5rem;
                }
                .react-datepicker__day--selected {
                    background-color: #2563eb !important;
                    border-radius: 0.5rem;
                }
                .react-datepicker__day:hover {
                    border-radius: 0.5rem;
                }
            `}</style>
        </div>
    );
};



export default LeavePage;
