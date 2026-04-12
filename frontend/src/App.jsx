import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LeavePage from './pages/LeavePage';
import AttendancePage from './pages/AttendancePage';
import AdminDashboard from './pages/AdminDashboard';
import EmployeesPage from './pages/EmployeesPage';
import ProfilePage from './pages/ProfilePage';


const AppRoutes = () => {
    const { user } = useAuth();

    return (
        <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
            <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
            
            <Route element={<Layout />}>
                <Route element={<ProtectedRoute />}>
                    <Route path="/" element={user?.role === 'admin' ? <AdminDashboard /> : <Dashboard />} />
                    <Route path="/leave" element={<LeavePage />} />
                    <Route path="/attendance" element={<AttendancePage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/employees" element={user?.role === 'admin' ? <EmployeesPage /> : <Navigate to="/" />} />
                </Route>
            </Route>
            
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
};

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <AppRoutes />
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
