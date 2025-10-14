import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import OrgLayout from './components/Auth/OrgLayout';
import OrgLogin from './components/Auth/OrgLogin';
import OrgRegister from './components/Auth/orgRegister';
import SidebarLayout from './components/SidebarLayout';
import OrganizationDashboard from './components/Organization/OrganizationDashboard';
import ClientManagement from './components/Organization/ClientManagement';

const OrgApp = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      const token = Cookies.get('orgtoken');
      const organization = Cookies.get('organization');

      if (token && organization) {
        try {
          const orgData = JSON.parse(organization);
          if (orgData?.id || orgData?._id || orgData?.slug) {
            setIsAuthenticated(true);
            setIsLoading(false);
            return;
          }
        } catch (_) {}
      }

      setIsLoading(false);
      setIsAuthenticated(false);
    };

    initializeAuth();
  }, []);

  const clearAuth = () => {
    Cookies.remove('orgtoken', { path: '/' });
    Cookies.remove('organization', { path: '/' });
    setIsAuthenticated(false);
    setIsLoading(false);
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/organization/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Routes>
        <Route element={<OrgLayout />}> 
          <Route 
            path="/login" 
            element={
              isAuthenticated ? 
                <Navigate to="/organization/dashboard" replace /> : 
                <OrgLogin onAuthSuccess={handleAuthSuccess} />
            } 
          />
          <Route 
            path="/register" 
            element={
              isAuthenticated ? 
                <Navigate to="/organization/dashboard" replace /> : 
                <OrgRegister onAuthSuccess={handleAuthSuccess} />
            } 
          />
        </Route>

        {isAuthenticated ? (
          <Route element={<SidebarLayout onLogout={handleLogout} userRole="organization" />}> 
            <Route path="/dashboard" element={<OrganizationDashboard />} />
            <Route path="/clients" element={<ClientManagement/>} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/organization/login" replace />} />
        )}
      </Routes>
    </div>
  );
};

export default OrgApp;


