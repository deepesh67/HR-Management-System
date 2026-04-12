import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import GlobalSearch from './GlobalSearch';
import {
    Menu, Bell, User as UserIcon,
    LogOut, CheckCheck, Trash2,
    Calendar, CheckCircle2, UserPlus, XCircle, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../utils/avatarHelper';
import api from '../services/api';

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);

    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const profileRef = useRef(null);
    const notifRef = useRef(null);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    // Fetch Notifications
    const fetchNotifications = async () => {
        if (!user) return;
        try {
            const { data } = await api.get('/notifications');
            setNotifications(data);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Optional: Poll every 60 seconds
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [user]);

    // Click Outside Handlers
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setIsNotificationOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    // Notification Actions
    const handleNotificationClick = async (notif) => {
        if (!notif.isRead) {
            try {
                await api.put(`/notifications/read/${notif._id}`);
                setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
            } catch (error) {
                console.error(error);
            }
        }
        setIsNotificationOpen(false);
        if (notif.link) navigate(notif.link);
    };

    const markAllAsRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error(error);
        }
    };

    const clearNotifications = async () => {
        try {
            await api.delete('/notifications/clear');
            setNotifications([]);
        } catch (error) {
            console.error(error);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'LEAVE_SUBMITTED': return <Calendar size={18} className="text-blue-500" />;
            case 'LEAVE_APPROVED': return <CheckCircle2 size={18} className="text-emerald-500" />;
            case 'LEAVE_REJECTED': return <XCircle size={18} className="text-red-500" />;
            case 'NEW_EMPLOYEE': return <UserPlus size={18} className="text-purple-500" />;
            default: return <AlertCircle size={18} className="text-slate-500" />;
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Sidebar */}
            <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col lg:pl-72 min-w-0 transition-all duration-300">
                {/* Top header */}
                <header className="h-20 bg-white/60 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-30 px-6 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={toggleSidebar}
                            className="p-2.5 bg-slate-100 text-slate-600 rounded-xl lg:hidden hover:bg-slate-200 transition-colors"
                        >
                            <Menu size={24} />
                        </button>

                        {/* <GlobalSearch /> */}
                    </div>

                    <div className="flex items-center space-x-3 md:space-x-5">
                        {/* Notification Bell Dropdown */}
                        <div className="relative" ref={notifRef}>
                            <button
                                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                                className={`p-2.5 rounded-xl transition-all relative ${isNotificationOpen ? 'bg-primary-50 text-primary-600' : 'text-slate-500 hover:bg-slate-100'}`}
                            >
                                <Bell size={22} className={unreadCount > 0 ? 'animate-pulse' : ''} />
                                {unreadCount > 0 && (
                                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                                )}
                            </button>

                            {isNotificationOpen && (
                                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden z-50 animate-in slide-in-from-top-2 fade-in duration-200">
                                    <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                                        <div>
                                            <h3 className="font-bold text-slate-800">Notifications</h3>
                                            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mt-0.5">
                                                You have {unreadCount} unread
                                            </p>
                                        </div>
                                        <div className="flex space-x-1">
                                            <button
                                                onClick={markAllAsRead}
                                                title="Mark all as read"
                                                className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                            >
                                                <CheckCheck size={16} />
                                            </button>
                                            <button
                                                onClick={clearNotifications}
                                                title="Clear all"
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                                        {notifications.length === 0 ? (
                                            <div className="p-8 text-center bg-white flex flex-col items-center">
                                                <Bell size={32} className="text-slate-200 mb-3" />
                                                <p className="text-sm font-bold text-slate-400">All caught up!</p>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-slate-50">
                                                {notifications.map(notif => (
                                                    <div
                                                        key={notif._id}
                                                        onClick={() => handleNotificationClick(notif)}
                                                        className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer flex items-start space-x-4 ${!notif.isRead ? 'bg-primary-50/30' : ''}`}
                                                    >
                                                        <div className={`p-2 rounded-xl mt-1 ${!notif.isRead ? 'bg-white shadow-sm' : 'bg-slate-100'}`}>
                                                            {getNotificationIcon(notif.type)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-sm ${!notif.isRead ? 'font-bold text-slate-800' : 'text-slate-600 font-medium'}`}>
                                                                {notif.message}
                                                            </p>
                                                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1.5">
                                                                {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        </div>
                                                        {!notif.isRead && (
                                                            <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-2"></div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Profile Dropdown */}
                        <div className="relative" ref={profileRef}>
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className={`flex items-center space-x-3 p-1.5 pr-4 rounded-full border transition-all ${isProfileOpen ? 'bg-primary-50 border-primary-100 ring-2 ring-primary-500/20' : 'bg-white border-slate-100 hover:border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20'
                                    }`}
                            >
                                <div className="w-9 h-9 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold shadow-sm shadow-primary-500/30">
                                    {getInitials(user?.name)}
                                </div>
                                <div className="hidden sm:block text-left relative top-px">
                                    <p className="text-xs font-black text-slate-800 leading-none mb-1 shadow-sm-text">
                                        {user?.name || 'User'}
                                    </p>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-primary-600 leading-none">
                                        {user?.role || 'Guest'}
                                    </p>
                                </div>
                            </button>

                            {isProfileOpen && (
                                <div className="absolute right-0 mt-3 w-64 bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden z-50 animate-in slide-in-from-top-2 fade-in duration-200">
                                    <div className="p-5 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
                                        <p className="font-bold text-slate-900">{user?.name}</p>
                                        <p className="text-xs font-medium text-slate-500 mt-0.5 truncate">{user?.email}</p>
                                    </div>
                                    <div className="p-2">
                                        <button
                                            onClick={() => { setIsProfileOpen(false); navigate('/profile'); }}
                                            className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-bold text-slate-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors"
                                        >
                                            <UserIcon size={18} />
                                            <span>My Profile</span>
                                        </button>
                                    </div>
                                    <div className="p-2 border-t border-slate-100">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                        >
                                            <LogOut size={18} />
                                            <span>Secure Logout</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="flex-1 px-4 lg:px-10 py-6 lg:py-8 max-w-7xl mx-auto w-full">
                    <Outlet />
                </main>

                <footer className="py-8 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest border-t border-slate-100 mx-10">
                    &copy; {new Date().getFullYear()} Mini HR System &bull; Production Stable
                </footer>
            </div>
        </div>
    );
};

export default Layout;
