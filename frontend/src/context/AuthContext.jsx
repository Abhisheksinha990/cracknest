import React, { createContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await api.get('/auth/me');
          setUser(response.data);
          setIsAuthenticated(true);
        } catch (e) {
          console.error(e);
          localStorage.removeItem('token');
        }
      }
      setIsLoading(false);
    };
    fetchUser();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      setUser(response.data.user);
      setIsAuthenticated(true);
      localStorage.setItem('token', response.data.token);
      toast.success(`Welcome back, ${response.data.user.name}!`);
      return { success: true, user: response.data.user };
    } catch (error) {
      const msg = error.response?.data?.detail || 'Login failed';
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  const register = async (name, email, password, role = 'USER') => {
    try {
      const response = await api.post('/auth/register', { name, email, password, role });
      setUser(response.data.user);
      setIsAuthenticated(true);
      localStorage.setItem('token', response.data.token);
      toast.success(`Account created, welcome ${name}!`);
      return { success: true, user: response.data.user };
    } catch (error) {
      const msg = error.response?.data?.detail || 'Registration failed';
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  const googleLogin = async (credential) => {
    try {
      const response = await api.post('/auth/google', { credential });
      setUser(response.data.user);
      setIsAuthenticated(true);
      localStorage.setItem('token', response.data.token);
      toast.success(`Welcome, ${response.data.user.name}!`);
      return { success: true, user: response.data.user };
    } catch (error) {
      const msg = error.response?.data?.detail || 'Google Login failed';
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
    toast.success('Logged out successfully');
    window.location.href = '/';
  };

  const upgradeToPro = async () => {
    try {
      const response = await api.post('/auth/upgrade');
      setUser(response.data.user);
      localStorage.setItem('token', response.data.token);
      toast.success('Successfully upgraded to Pro!');
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.detail || 'Upgrade failed';
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoading, 
      login,
      googleLogin,
      register, 
      logout,
      upgradeToPro
    }}>
      {children}
    </AuthContext.Provider>
  );
};
