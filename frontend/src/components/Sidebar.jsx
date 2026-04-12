import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LogOut,
    LayoutDashboard,
    Calendar,
    ClipboardCheck,
    ShieldCheck,
    X,
    User,
    Users
} from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        {
            name: 'Dashboard',
            path: '/',
            icon: <LayoutDashboard size={22} />,
            role: 'all'
        },
        {
            name: 'Leave Management',
            path: '/leave',
            icon: <Calendar size={22} />,
            role: 'all'
        },
        {
            name: 'My Attendance',
            path: '/attendance',
            icon: <ClipboardCheck size={22} />,
            role: 'all'
        }
    ];

    const activeClass = "bg-primary-600/10 text-primary-400 border-r-4 border-primary-500 shadow-[inset_-4px_0_0_0_#3b82f6]";
    const inactiveClass = "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100 transition-all duration-300";

    return (
        <>
            {/* Backdrop for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
                    onClick={toggleSidebar}
                ></div>
            )}

            <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#0f172a] transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col border-r border-slate-800 shadow-2xl`}>
                {/* Logo & Close Button */}
                <div className="p-8 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg ring-4 ring-primary-500/10">
                            HR
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-black tracking-tight text-white leading-none">Mini HR </span>
                            <span className="text-[10px] font-bold text-primary-500 uppercase tracking-widest mt-1">System</span>
                        </div>
                    </div>
                    <button onClick={toggleSidebar} className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto custom-scrollbar">
                    <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4"></p>

                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => window.innerWidth < 1024 && toggleSidebar()}
                            className={({ isActive }) => `flex items-center space-x-3 px-4 py-3.5 rounded-xl font-bold text-sm ${isActive ? activeClass : inactiveClass}`}
                        >
                            <span className="shrink-0">{item.icon}</span>
                            <span>{item.name}</span>
                        </NavLink>
                    ))}

                    {user?.role === 'admin' && (
                        <div className="mt-8 pt-6 border-t border-slate-800">
                            <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Administration</p>

                            <NavLink
                                to="/employees"
                                onClick={() => window.innerWidth < 1024 && toggleSidebar()}
                                className={({ isActive }) => `flex items-center space-x-3 px-4 py-3.5 rounded-xl font-bold text-sm mb-4 ${isActive ? activeClass : inactiveClass}`}
                            >
                                <Users size={22} className="shrink-0" />
                                <span>Employee Management</span>
                            </NavLink>

                            <div className="bg-primary-900/20 border border-primary-500/20 rounded-2xl p-4 mb-2">
                                <div className="flex items-center space-x-2 text-primary-400 mb-2">
                                    <ShieldCheck size={18} />
                                    <span className="text-xs font-black uppercase">Admin Mode Active</span>
                                </div>
                                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                                    You have full control over employee records and system audits.
                                </p>
                            </div>
                        </div>
                    )}
                </nav>

                {/* User Profile & Logout */}
                <div className="p-6 mt-auto border-t border-slate-800 bg-slate-900/50">
                    <div className="flex items-center space-x-3 mb-6 px-2">
                        <div className="w-11 h-11 bg-primary-600/20 border border-primary-500/30 rounded-xl flex items-center justify-center text-primary-400 shadow-inner">
                            <User size={24} />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-white truncate">{user?.name}</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{user?.role}</span>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-xl font-bold text-sm transition-all duration-300 group shadow-lg shadow-red-500/5 hover:shadow-red-500/20"
                    >
                        <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
43