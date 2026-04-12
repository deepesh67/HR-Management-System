import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
    User, Mail, Shield, Calendar, 
    Edit2, Key, CheckCircle2, AlertCircle, 
    Loader2, Camera, Phone, MapPin, 
    Briefcase, Building2, UserCircle, 
    Check, X, ShieldCheck, Info
} from 'lucide-react';
import { getInitials } from '../utils/avatarHelper';

const ProfilePage = () => {
    const { user, refreshProfile } = useAuth();
    const [actionLoading, setActionLoading] = useState(null); // 'profile', 'password'
    const [message, setMessage] = useState(null);
    
    // Form States
    const [isEditingPersonal, setIsEditingPersonal] = useState(false);
    const [personalData, setPersonalData] = useState({
        name: '',
        phoneNumber: '',
        department: '',
        jobTitle: '',
        workLocation: ''
    });

    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const fileInputRef = useRef(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    // Sync state with user context on mount or user change
    useEffect(() => {
        if (user) {
            setPersonalData({
                name: user.name || '',
                phoneNumber: user.phoneNumber || '',
                department: user.department || '',
                jobTitle: user.jobTitle || '',
                workLocation: user.workLocation || ''
            });
        }
    }, [user]);

    // Helpers
    const formatDate = (dateString) => {
        if (!dateString) return 'Not Available';
        const date = new Date(dateString);
        return isNaN(date.getTime()) 
            ? 'Invalid Date' 
            : date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    // Global input handler for Personal Details
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setPersonalData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleUpdateProfile = async (e) => {
        if (e) e.preventDefault();
        
        // Validation
        if (!personalData.name.trim()) {
            return setMessage({ type: 'error', text: 'Full Name is required' });
        }
        if (personalData.phoneNumber && !/^\+?[\d\s-]{10,}$/.test(personalData.phoneNumber)) {
            return setMessage({ type: 'error', text: 'Please enter a valid phone number' });
        }

        setActionLoading('profile');
        setMessage(null);
        try {
            const { data } = await api.put('/user/profile', personalData);
            // Refresh with the data returned from the server immediately
            await refreshProfile(); 
            setMessage({ type: 'success', text: 'Profile details updated successfully.' });
            setIsEditingPersonal(false);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Update failed' });
        } finally {
            setActionLoading(null);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) {
            return setMessage({ type: 'error', text: 'Passwords do not match' });
        }
        
        setActionLoading('password');
        setMessage(null);
        try {
            await api.put('/user/password', {
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword
            });
            setMessage({ type: 'success', text: 'Password changed securely.' });
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update password' });
        } finally {
            setActionLoading(null);
        }
    };

    const handleCancelEdit = () => {
        setIsEditingPersonal(false);
        // Reset local state to context user state
        if (user) {
            setPersonalData({
                name: user.name || '',
                phoneNumber: user.phoneNumber || '',
                department: user.department || '',
                jobTitle: user.jobTitle || '',
                workLocation: user.workLocation || ''
            });
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {message && (
                <div className={`fixed top-24 right-8 z-50 p-4 rounded-2xl flex items-center space-x-3 border shadow-2xl animate-in slide-in-from-right-4 slide-out-to-right-4 duration-300 ${
                    message.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                }`}>
                    {message.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                    <span className="font-bold text-sm pr-4">{message.text}</span>
                    <button onClick={() => setMessage(null)} className="hover:opacity-50 transition-opacity"><X size={16} /></button>
                </div>
            )}

            <div className="relative group bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden text-center md:text-left">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50/30 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                    <div className="relative">
                        <div className="w-40 h-40 rounded-[2.5rem] bg-gradient-to-br from-primary-600 to-indigo-700 shadow-2xl flex items-center justify-center border-4 border-white">
                            <span className="text-6xl font-black text-white tracking-tighter">
                                {getInitials(personalData.name || user?.name)}
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex-1">
                        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                            <h1 className="text-4xl font-black text-slate-900 leading-none">{user?.name}</h1>
                            <div className="flex items-center space-x-2">
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                    user?.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-primary-100 text-primary-700'
                                }`}>
                                    {user?.role}
                                </span>
                                {user?.role === 'admin' && (
                                    <div className="flex items-center space-x-1 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                                        <ShieldCheck size={12} />
                                        <span>Full Access</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-slate-500 font-bold text-sm">
                            <div className="flex items-center gap-3"><Mail size={18} className="text-primary-500" /><span>{user?.email}</span></div>
                            <div className="flex items-center gap-3"><Briefcase size={18} className="text-primary-500" /><span>{user?.jobTitle} &bull; {user?.department}</span></div>
                            <div className="flex items-center gap-3"><Calendar size={18} className="text-primary-500" /><span>Joined {formatDate(user?.dateOfJoining)}</span></div>
                            <div className="flex items-center gap-3 text-emerald-600"><Info size={18} /><span>Available Leave: {user?.leaveBalance || 0} Days</span></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center space-x-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><UserCircle size={24} /></div>
                                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Personal Details</h2>
                            </div>
                            {!isEditingPersonal ? (
                                <button onClick={() => setIsEditingPersonal(true)} className="flex items-center space-x-2 px-6 py-2.5 bg-slate-50 text-slate-600 hover:bg-slate-900 hover:text-white rounded-xl font-black text-xs transition-all">
                                    <Edit2 size={14} /><span>Edit Info</span>
                                </button>
                            ) : (
                                <div className="flex items-center space-x-2">
                                    <button onClick={handleUpdateProfile} disabled={actionLoading === 'profile'} className="p-2.5 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all">
                                        {actionLoading === 'profile' ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                                    </button>
                                    <button onClick={handleCancelEdit} className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:scale-105 transition-all">
                                        <X size={18} />
                                    </button>
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                <div className="relative">
                                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input type="text" name="name" disabled={!isEditingPersonal} value={personalData.name} onChange={handleInputChange} className={`w-full bg-slate-100 border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-bold transition-all ${!isEditingPersonal ? 'opacity-70 text-slate-500 cursor-not-allowed' : 'text-slate-800 focus:bg-white focus:ring-4 focus:ring-primary-500/20 outline-none'}`} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                                <div className="relative">
                                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input type="tel" name="phoneNumber" disabled={!isEditingPersonal} placeholder="+1-234-567-890" value={personalData.phoneNumber} onChange={handleInputChange} className={`w-full bg-slate-100 border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-bold transition-all ${!isEditingPersonal ? 'opacity-70 text-slate-500 cursor-not-allowed' : 'text-slate-800 focus:bg-white focus:ring-4 focus:ring-primary-500/20 outline-none'}`} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Department</label>
                                <div className="relative">
                                    <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input type="text" name="department" disabled={!isEditingPersonal} value={personalData.department} onChange={handleInputChange} className={`w-full bg-slate-100 border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-bold transition-all ${!isEditingPersonal ? 'opacity-70 text-slate-500 cursor-not-allowed' : 'text-slate-800 focus:bg-white focus:ring-4 focus:ring-primary-500/20 outline-none'}`} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Job Title</label>
                                <div className="relative">
                                    <Briefcase size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input type="text" name="jobTitle" disabled={!isEditingPersonal} value={personalData.jobTitle} onChange={handleInputChange} className={`w-full bg-slate-100 border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-bold transition-all ${!isEditingPersonal ? 'opacity-70 text-slate-500 cursor-not-allowed' : 'text-slate-800 focus:bg-white focus:ring-4 focus:ring-primary-500/20 outline-none'}`} />
                                </div>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Work Location</label>
                                <div className="relative">
                                    <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input type="text" name="workLocation" disabled={!isEditingPersonal} value={personalData.workLocation} onChange={handleInputChange} className={`w-full bg-slate-100 border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-bold transition-all ${!isEditingPersonal ? 'opacity-70 text-slate-500 cursor-not-allowed' : 'text-slate-800 focus:bg-white focus:ring-4 focus:ring-primary-500/20 outline-none'}`} />
                                </div>
                            </div>
                        </form>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative">
                        <div className="flex items-center space-x-4 mb-8">
                            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><Shield size={24} /></div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Security Access</h2>
                        </div>
                        <form onSubmit={handleChangePassword} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Password</label>
                                    <div className="relative">
                                        <Key size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input type="password" required value={passwords.currentPassword} onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-primary-500/20" />
                                    </div>
                                </div>
                                <div className="hidden md:block"></div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                                    <input type="password" required minLength="6" value={passwords.newPassword} onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-primary-500/20" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                                    <input type="password" required value={passwords.confirmPassword} onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-primary-500/20" />
                                </div>
                            </div>
                            <button type="submit" disabled={actionLoading === 'password'} className="w-full md:w-fit px-12 bg-slate-900 text-white rounded-2xl py-4 text-sm font-black hover:bg-slate-800 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center space-x-3">
                                {actionLoading === 'password' ? <Loader2 size={18} className="animate-spin" /> : <Shield size={18} />}
                                <span>Sign New Security Keys</span>
                            </button>
                        </form>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl text-white relative h-fit">
                        <div className="flex items-center space-x-3 mb-6">
                            <Info size={24} className="text-primary-400" />
                            <h3 className="text-xl font-black tracking-tight">Employment</h3>
                        </div>
                        <div className="mb-8 p-3 bg-white/5 border border-white/10 rounded-2xl">
                            <p className="text-[9px] font-black text-primary-400 uppercase tracking-widest flex items-center gap-2">
                                <ShieldCheck size={12} />Managed by HR
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold mt-1">Records are managed by HR and cannot be edited by employee.</p>
                        </div>
                        <div className="space-y-6">
                            {[
                                { label: 'Employee ID', value: user?.employeeId || 'ID#---' },
                                { label: 'Employment Type', value: user?.employmentType || 'Full-time' },
                                { label: 'Reporting Manager', value: user?.managerName || 'Dept Head' },
                                { label: 'Workspace', value: user?.workLocation || 'Standard Office' }
                            ].map((item, idx) => (
                                <div key={idx} className="group">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{item.label}</p>
                                    <p className="text-lg font-bold text-white transition-colors group-hover:text-primary-400">{item.value}</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-10 pt-8 border-t border-slate-800">
                            <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest leading-relaxed">Personnel records are maintained securely in accordance with company policy.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
