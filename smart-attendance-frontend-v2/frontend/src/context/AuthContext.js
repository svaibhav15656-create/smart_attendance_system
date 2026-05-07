import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [faculty, setFaculty] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const stored = localStorage.getItem('faculty');
    if (token && stored) {
      setFaculty(JSON.parse(stored));
      // Verify token is still valid
      API.get('/auth/me')
        .then(res => setFaculty(res.data))
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (faculty_id, password) => {
    const res = await API.post('/auth/login', { faculty_id, password });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('faculty', JSON.stringify(res.data.faculty));
    setFaculty(res.data.faculty);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('faculty');
    setFaculty(null);
  };

  return (
    <AuthContext.Provider value={{ faculty, login, logout, loading, setFaculty }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
