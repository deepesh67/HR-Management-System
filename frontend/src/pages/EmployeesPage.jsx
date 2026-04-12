import { useState, useEffect } from 'react';
import api from '../services/api';
import { 
    Users, 
    UserPlus, 
    Mail, 
    Search, 
    Filter, 
    MoreVertical, 
    AlertCircle, 
    Loader2, 
    X, 
    Check,
    Calendar,
    Briefcase,
    Trash2
} from 'lucide-react';
import { getInitials } from '../utils/avatarHelper';

const EmployeesPage = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [dropdownOpenId, setDropdownOpenId] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'employee'
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const res = await api.get('/user/all');
            setEmployees(res.data);
        } catch (err) {
            setError('Failed to fetch employees. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = () => setDropdownOpenId(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const handleDeleteEmployee = async (id, e) => {
        e.stopPropagation();
        setDropdownOpenId(null);
        
        if (!window.confirm('Are you sure you want to permanently delete this employee? This action cannot be undone.')) return;

        try {
            await api.delete(`/user/${id}`);
            setEmployees(prev => prev.filter(emp => emp._id !== id));
            setSuccessMessage('Employee deleted successfully');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete employee');
            setTimeout(() => setError(''), 5000);
        }
    };

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAddEmployee = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            await api.post('/auth/register', formData);
            setIsModalOpen(false);
            setFormData({ name: '', email: '', password: '', role: 'employee' });
            fetchEmployees();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add employee');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredEmployees = employees.filter(emp => 
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Workforce Management</h1>
                    <p className="text-slate-500 mt-1">View and manage all members of your organization.</p>
                </div>

                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="btn-primary flex items-center justify-center space-x-2 px-6 py-3"
                >
                    <UserPlus size={20} />
                    <span>Add New Employee</span>
                </button>
            </header>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass p-6 rounded-2xl border-l-4 border-primary-500">
                    <div className="text-slate-500 text-xs font-black uppercase tracking-widest mb-2">Total Staff</div>
                    <div className="text-3xl font-black text-slate-900">{employees.length}</div>
                </div>
                <div className="glass p-6 rounded-2xl border-l-4 border-emerald-500">
                    <div className="text-slate-500 text-xs font-black uppercase tracking-widest mb-2">Active Roles</div>
                    <div className="text-3xl font-black text-slate-900">
                        {new Set(employees.map(e => e.role.toLowerCase())).size}
                    </div>
                </div>
                <div className="glass p-6 rounded-2xl border-l-4 border-indigo-500">
                    <div className="text-slate-500 text-xs font-black uppercase tracking-widest mb-2">New Since 2026</div>
                    <div className="text-3xl font-black text-slate-900">
                        {employees.filter(e => {
                            const joinDate = new Date(e.dateOfJoining || e.createdAt);
                            return joinDate >= new Date('2026-01-01');
                        }).length}
                    </div>
                </div>
            </div>

            {successMessage && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl flex items-center space-x-3 text-sm font-bold animate-in slide-in-from-top-2 duration-300">
                    <Check size={18} />
                    <span>{successMessage}</span>
                </div>
            )}

            <div className="glass rounded-3xl p-0 overflow-hidden shadow-2xl border border-white/40">
                <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                        <Users className="text-primary-600" size={24} />
                        <h2 className="text-xl font-bold text-slate-800">Employee Directory</h2>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search by name or email..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-2.5 text-sm w-full md:w-80 focus:ring-2 focus:ring-primary-500/20 transition-all outline-none"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32 space-y-4">
                            <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin"></div>
                            <p className="text-slate-400 font-medium">Syncing directory...</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-8 py-5">Employee</th>
                                    <th className="px-8 py-5">Status / Role</th>
                                    <th className="px-8 py-5">Joined Date</th>
                                    <th className="px-8 py-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredEmployees.map((emp) => (
                                    <tr key={emp._id} className="group hover:bg-primary-50/30 transition-all duration-300">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white font-bold border border-white shadow-sm transition-transform group-hover:scale-110">
                                                    {getInitials(emp.name)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{emp.name}</p>
                                                    <p className="text-xs text-slate-500 font-medium">{emp.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col space-y-1.5 font-bold">
                                                <span className={`inline-flex items-center text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-lg w-fit ${
                                                    emp.role === 'admin' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-primary-100 text-primary-700 border border-primary-200'
                                                }`}>
                                                    {emp.role}
                                                </span>
                                                <div className="flex items-center text-xs text-emerald-600 space-x-1 pl-0.5">
                                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                                    <span>Active</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center space-x-2 text-slate-600 font-bold text-sm">
                                                <Calendar size={14} className="text-slate-400" />
                                                <span>{new Date(emp.dateOfJoining).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                            </div>
                                        </td>
                                         <td className="px-8 py-6 text-right">
                                             <div className="relative inline-block text-left">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDropdownOpenId(dropdownOpenId === emp._id ? null : emp._id);
                                                    }}
                                                    className="p-2.5 text-slate-400 hover:bg-white hover:text-slate-900 rounded-xl transition-all border border-transparent hover:border-slate-100 hover:shadow-sm"
                                                >
                                                    <MoreVertical size={20} />
                                                </button>

                                                {dropdownOpenId === emp._id && (
                                                    <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 w-48 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-right">
                                                        <div className="p-1">
                                                            <button 
                                                                onClick={(e) => handleDeleteEmployee(emp._id, e)}
                                                                className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                                            >
                                                                <Trash2 size={16} />
                                                                <span>Delete Employee</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredEmployees.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="py-24 text-center">
                                            <div className="flex flex-col items-center space-y-3">
                                                <Search size={48} className="text-slate-200" />
                                                <p className="text-slate-400 font-bold">No employees found matching your search.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Add Employee Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => !submitting && setIsModalOpen(false)}></div>
                    <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-xl relative animate-in zoom-in-95 duration-300 shadow-2xl border border-white/40">
                        <div className="flex justify-between items-center mb-10">
                            <div className="flex items-center space-x-4">
                                <div className="p-3 bg-primary-100 text-primary-600 rounded-2xl">
                                    <UserPlus size={28} />
                                </div>
                                <h2 className="text-3xl font-black text-slate-900">New Staff Member</h2>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                                <X size={28} />
                            </button>
                        </div>

                        {error && (
                            <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-start space-x-3 text-sm font-bold">
                                <AlertCircle className="shrink-0" size={18} />
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleAddEmployee} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-black text-slate-700 ml-1 uppercase tracking-widest">Full Name</label>
                                <input 
                                    name="name"
                                    type="text" 
                                    required
                                    value={formData.name}
                                    onChange={handleFormChange}
                                    placeholder="Enter full name" 
                                    className="input-field"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-black text-slate-700 ml-1 uppercase tracking-widest">Email Address</label>
                                <input 
                                    name="email"
                                    type="email" 
                                    required
                                    value={formData.email}
                                    onChange={handleFormChange}
                                    placeholder="email@company.com" 
                                    className="input-field"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-black text-slate-700 ml-1 uppercase tracking-widest">System Role</label>
                                    <select 
                                        name="role"
                                        value={formData.role}
                                        onChange={handleFormChange}
                                        className="input-field appearance-none cursor-pointer"
                                    >
                                        <option value="employee">Employee</option>
                                        <option value="admin">System Admin</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-black text-slate-700 ml-1 uppercase tracking-widest">Access Key</label>
                                    <input 
                                        name="password"
                                        type="password" 
                                        required
                                        value={formData.password}
                                        onChange={handleFormChange}
                                        placeholder="••••••••" 
                                        className="input-field"
                                    />
                                </div>
                            </div>

                            <div className="pt-8">
                                <button 
                                    type="submit" 
                                    disabled={submitting}
                                    className="btn-primary w-full py-5 flex items-center justify-center space-x-3 text-lg"
                                >
                                    {submitting ? <Loader2 className="animate-spin" size={24} /> : (
                                        <>
                                            <Check size={24} />
                                            <span>Onboard Employee</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeesPage;
