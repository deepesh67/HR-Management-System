import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = async () => {
            const storedUser = localStorage.getItem('user');
            const token = localStorage.getItem('token');
            if (storedUser && token) {
                // Set initial data from storage for fast load
                setUser(JSON.parse(storedUser));
                
                // Fetch fresh data from backend
                try {
                    const { data } = await api.get('/user/profile');
                    const updatedUser = { ...JSON.parse(storedUser), ...data };
                    setUser(updatedUser);
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                } catch (error) {
                    console.error('Failed to sync profile on load', error);
                }
            }
            setLoading(false);
        };
        initializeAuth();
    }, []);

    const login = async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', data.token); // Store token first for interceptors
        
        try {
            // Fetch complete profile details (phone, department, etc)
            const profileRes = await api.get('/user/profile');
            const fullUser = { ...data, ...profileRes.data };
            setUser(fullUser);
            localStorage.setItem('user', JSON.stringify(fullUser));
        } catch (error) {
            // Fallback
            setUser(data);
            localStorage.setItem('user', JSON.stringify(data));
        }
    };

    const register = async (userData) => {
        const { data } = await api.post('/auth/register', userData);
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
        localStorage.setItem('token', data.token);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    };

    const refreshProfile = async () => {
        try {
            const { data } = await api.get('/user/profile');
            const updatedUser = { ...user, ...data };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            return updatedUser;
        } catch (error) {
            console.error('Failed to refresh profile', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
