import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Pricing from './pages/Pricing';


import ResumeAnalyzer from './pages/dashboard/ResumeAnalyzer';
import MockInterviews from './pages/dashboard/MockInterviews';
import Companies from './pages/dashboard/Companies';
import Admin from './pages/dashboard/Admin';

import { Toaster } from 'react-hot-toast';

import { AuthContext } from './context/AuthContext';
import { useContext } from 'react';

// Layout for public pages that need the top Navbar
const PublicLayout = () => (
  <>
    <Navbar />
    <Outlet />
  </>
);

const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useContext(AuthContext);
  if (isLoading) return <div className="h-screen w-screen flex items-center justify-center bg-zinc-950 text-white">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};



function App() {


  return (
    <Router>
      <div className="app">
        <Toaster 
          position="top-right" 
          toastOptions={{
            style: {
              background: '#1e293b', // zinc-800
              color: '#fff',
              border: '1px solid #334155', // zinc-700
              borderRadius: '1rem',
            },
            success: {
              iconTheme: { primary: '#06b6d4', secondary: '#fff' } // cyan-500
            }
          }} 
        />
        <Routes>
          {/* Public Routes with Navbar */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/pricing" element={<Pricing />} />
            
            {/* Protected Feature Routes */}
            <Route path="/resume" element={<ProtectedRoute><ResumeAnalyzer /></ProtectedRoute>} />
            <Route path="/companies" element={<ProtectedRoute><Companies /></ProtectedRoute>} />
            <Route path="/interviews" element={<ProtectedRoute><MockInterviews /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />

          </Route>
          
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
