import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import SuperAdminAuthLayout from './components/Auth/SuperAdminAuthLayout';
import SuperAdminDashboard from './components/Superadmin/SuperAdminDashboard';

const Superadmin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      const superAdminToken = localStorage.getItem('superadmintoken');
      const superAdminData = localStorage.getItem('superAdminData');
      
      if (superAdminToken && superAdminData) {
        try {
          const parsedSuperAdminData = JSON.parse(superAdminData);
          if (parsedSuperAdminData.role === 'superadmin') {
            setIsAuthenticated(true);
            // Update super admin user data if needed
            localStorage.setItem('superAdminData', JSON.stringify({
              ...parsedSuperAdminData,
              name: parsedSuperAdminData.name
            }));
          } else {
            throw new Error('Invalid role');
          }
        } catch (error) {
          console.error('Error validating super admin token:', error);
          clearAuth();
        }
      } else {
        setIsAuthenticated(false);
      }
      
      setIsLoading(false);
    };
    
    initializeAuth();
  }, []);

  const clearAuth = () => {
    localStorage.removeItem('superadmintoken');
    localStorage.removeItem('superAdminData');
    setIsAuthenticated(false);
    setIsLoading(false);
  };

  const handleAuthSuccess = (superAdminData) => {
    // Store super admin token and user data
    localStorage.setItem('superadmintoken', superAdminData.token);
    localStorage.setItem('superAdminData', JSON.stringify({
      role: superAdminData.role,
      name: superAdminData.name,
      email: superAdminData.email
    }));
    
    setIsAuthenticated(true);
    console.log("Super Admin authentication successful");
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/superadmin');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div>
      <Routes>
        <Route path='/' element={<SuperAdminAuthLayout onLogin={handleAuthSuccess}/>}/>
        {
          isAuthenticated ?
          (
            <Route path='/dashboard' element={<SuperAdminDashboard onLogout={handleLogout}/>}/>
          )
          :
          (
            <Route path='*' element={<SuperAdminAuthLayout onLogin={handleAuthSuccess}/>}/>
          )
        }
      </Routes>
    </div>
  );
};

export default Superadmin;
