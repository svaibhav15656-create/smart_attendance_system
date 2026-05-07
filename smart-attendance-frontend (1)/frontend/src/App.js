import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MarkAttendance from './pages/MarkAttendance';
import MyHistory from './pages/MyHistory';
import FaceSetup from './pages/FaceSetup';
import AdminDashboard from './pages/AdminDashboard';
import AdminReport from './pages/AdminReport';
import './index.css';

const PrivateRoute = ({ children }) => {
  const { faculty, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner"></div><p>Loading...</p></div>;
  return faculty ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { faculty, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;
  if (!faculty) return <Navigate to="/login" />;
  if (!faculty.is_admin) return <Navigate to="/dashboard" />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { faculty, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;
  return faculty ? <Navigate to="/dashboard" /> : children;
};

function AppRoutes() {
  const { faculty } = useAuth();

  return (
    <>
      {faculty && <Navbar />}
      <Routes>
        <Route path="/" element={<Navigate to={faculty ? "/dashboard" : "/login"} />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/mark-attendance" element={<PrivateRoute><MarkAttendance /></PrivateRoute>} />
        <Route path="/my-history" element={<PrivateRoute><MyHistory /></PrivateRoute>} />
        <Route path="/face-setup" element={<PrivateRoute><FaceSetup /></PrivateRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/report" element={<AdminRoute><AdminReport /></AdminRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
