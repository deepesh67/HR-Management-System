import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, FileText, Calendar, X, Loader2, ArrowRight } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const GlobalSearch = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState({ employees: [], leaves: [] });
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    
    // Base data for search
    const [allEmployees, setAllEmployees] = useState([]);
    const [allLeaves, setAllLeaves] = useState([]);
    
    const { user } = useAuth();
    const navigate = useNavigate();
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);

    // Fetch searchable data on mount or when admin status is confirmed
    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                // Fetch employees if admin
                if (user.role === 'admin') {
                    const empRes = await api.get('/user/all');
                    setAllEmployees(empRes.data);
                    
                    const leaveRes = await api.get('/leave/all');
                    setAllLeaves(leaveRes.data);
                } else {
                    // Regular users only search their own leaves
                    const leaveRes = await api.get('/leave/my');
                    setAllLeaves(leaveRes.data);
                    setAllEmployees([user]); // Can search themselves
                }
            } catch (error) {
                console.error('Global search data fetch failed:', error);
            }
        };
        fetchData();
    }, [user]);

    // Debounced filtering logic
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!query.trim()) {
                setResults({ employees: [], leaves: [] });
                return;
            }

            const searchStr = query.toLowerCase().trim();
            setIsLoading(true);

            // Filter Employees
            const filteredEmps = allEmployees.filter(emp => 
                emp.name?.toLowerCase().includes(searchStr) || 
                emp.email?.toLowerCase().includes(searchStr)
            ).slice(0, 5); // Limit to 5 results per category

            // Filter Leaves
            const filteredLeaves = allLeaves.filter(leave => {
                const leaveText = `
                    ${leave.leaveType}
                    ${leave.status}
                    ${leave.reason || ''}
                    ${new Date(leave.startDate).toLocaleDateString()}
                    ${new Date(leave.endDate).toLocaleDateString()}
                    ${user?.role === 'admin' ? leave.userId?.name || '' : ''}
                `.toLowerCase();
                return leaveText.includes(searchStr);
            }).slice(0, 5);

            setResults({ employees: filteredEmps, leaves: filteredLeaves });
            setIsLoading(false);
            setSelectedIndex(-1);
        }, 300);

        return () => clearTimeout(timer);
    }, [query, allEmployees, allLeaves, user?.role]);

    // Handle Clicks Outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const flattenedResults = [
        ...results.employees.map(e => ({ ...e, type: 'employee' })),
        ...results.leaves.map(l => ({ ...l, type: 'leave' }))
    ];

    const handleSelect = (item) => {
        setIsOpen(false);
        setQuery('');
        if (item.type === 'employee') {
            if (user?.role === 'admin') navigate('/employees');
            else navigate('/profile');
        } else {
            if (user?.role === 'admin') navigate('/'); // Admin Dashboard has leaves
            else navigate('/leave');
        }
    };

    const handleKeyDown = (e) => {
        if (!isOpen) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev < flattenedResults.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            handleSelect(flattenedResults[selectedIndex]);
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    return (
        <div className="relative w-full max-w-md hidden lg:block" ref={dropdownRef}>
            <div className={`relative flex items-center transition-all duration-300 ${isOpen ? 'ring-2 ring-primary-500/20' : ''}`}>
                <Search className={`absolute left-4 transition-colors duration-300 ${isOpen ? 'text-primary-500' : 'text-slate-400'}`} size={18} />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search employees, leaves, or status..."
                    className="w-full bg-slate-100/80 border-none rounded-2xl pl-12 pr-10 py-2.5 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:bg-white focus:ring-0 transition-all outline-none"
                />
                {query && (
                    <button 
                        onClick={() => { setQuery(''); setResults({ employees: [], leaves: [] }); }} 
                        className="absolute right-3 p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {/* Suggestions Dropdown */}
            {isOpen && (query.trim() || isLoading) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 max-h-[480px] flex flex-col">
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                        {isLoading ? (
                            <div className="flex items-center justify-center p-8 space-x-3">
                                <Loader2 size={20} className="animate-spin text-primary-500" />
                                <span className="text-sm font-medium text-slate-400 tracking-wide">Searching...</span>
                            </div>
                        ) : flattenedResults.length > 0 ? (
                            <div className="space-y-4 py-2">
                                {/* Employees Section */}
                                {results.employees.length > 0 && (
                                    <div>
                                        <div className="px-4 py-1 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                                            <span>Employees</span>
                                            <span className="bg-slate-50 px-2 py-0.5 rounded-md">{results.employees.length}</span>
                                        </div>
                                        {results.employees.map((emp, i) => {
                                            const globalIndex = i;
                                            return (
                                                <button
                                                    key={emp._id}
                                                    onClick={() => handleSelect({ ...emp, type: 'employee' })}
                                                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                                                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all group ${selectedIndex === globalIndex ? 'bg-primary-50 text-primary-700' : 'hover:bg-slate-50 text-slate-700'}`}
                                                >
                                                    <div className={`p-2 rounded-xl shrink-0 ${selectedIndex === globalIndex ? 'bg-white shadow-sm' : 'bg-slate-100'}`}>
                                                        <User size={18} />
                                                    </div>
                                                    <div className="flex-1 text-left min-w-0">
                                                        <p className="text-sm font-bold truncate">{emp.name}</p>
                                                        <p className="text-[10px] font-medium text-slate-400 truncate tracking-wide uppercase">{emp.email}</p>
                                                    </div>
                                                    <ArrowRight size={14} className={`opacity-0 group-hover:opacity-100 transition-all ${selectedIndex === globalIndex ? '-translate-x-1' : ''}`} />
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Leaves Section */}
                                {results.leaves.length > 0 && (
                                    <div>
                                        <div className="px-4 py-1 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                                            <span>Leave Applications</span>
                                            <span className="bg-slate-50 px-2 py-0.5 rounded-md">{results.leaves.length}</span>
                                        </div>
                                        {results.leaves.map((leave, i) => {
                                            const globalIndex = results.employees.length + i;
                                            return (
                                                <button
                                                    key={leave._id}
                                                    onClick={() => handleSelect({ ...leave, type: 'leave' })}
                                                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                                                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all group ${selectedIndex === globalIndex ? 'bg-primary-50 text-primary-700' : 'hover:bg-slate-50 text-slate-700'}`}
                                                >
                                                    <div className={`p-2 rounded-xl shrink-0 ${selectedIndex === globalIndex ? 'bg-white shadow-sm' : 'bg-slate-100'}`}>
                                                        <FileText size={18} />
                                                    </div>
                                                    <div className="flex-1 text-left min-w-0">
                                                        <div className="flex items-center space-x-2">
                                                            <p className="text-sm font-bold truncate">{leave.leaveType} Leave</p>
                                                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                                                                leave.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 
                                                                leave.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                                            }`}>
                                                                {leave.status}
                                                            </span>
                                                        </div>
                                                        <p className="text-[10px] font-medium text-slate-400 truncate flex items-center mt-1">
                                                            <Calendar size={10} className="mr-1" />
                                                            {new Date(leave.startDate).toLocaleDateString()}
                                                            {user?.role === 'admin' && ` • ${leave.userId?.name}`}
                                                        </p>
                                                    </div>
                                                    <ArrowRight size={14} className={`opacity-0 group-hover:opacity-100 transition-all ${selectedIndex === globalIndex ? '-translate-x-1' : ''}`} />
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-10 text-center flex flex-col items-center">
                                <div className="p-4 bg-slate-50 rounded-2xl mb-4">
                                    <Search size={32} className="text-slate-200" />
                                </div>
                                <h3 className="text-sm font-bold text-slate-800">No results found</h3>
                                <p className="text-xs text-slate-400 mt-1 max-w-[180px]">Try searching for something else like "Sick" or a name.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GlobalSearch;
