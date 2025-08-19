import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import AdminLoginPage from './components/Auth/AdminLoginPage';
import AdminRegistrationPage from './components/Auth/AdminRegistrationPage';
import SidebarLayout from './components/SidebarLayout';
import AdminDashboard from './components/Admin/AdminDashboard';
import DatastorePage from './components/DatastorePage';
import ClientsManagement from './components/Admin/ClientsManagement';
import User from './components/Admin/User';
import EvaluatorsManagement from './components/Admin/EvaluatorsManagement';
import AiServiceManager from './components/Admin/AiServiceManager';
import Configuration from './components/Admin/Configuration';
import CreditAccount from './components/Admin/CreditAccount';
import CreditAccountDetail from './components/Admin/CreditAccountDetail';
// import UserManagement from './components/Admin/UserManagement';
// import AiAgentsManagement from './components/Admin/AiAgentsManagement';
// import ConversationsManagement from './components/Admin/ConversationsManagement';
// import TicketsManagement from './components/Admin/TicketsManagement';
// import PaymentsManagement from './components/Admin/PaymentsManagement';
// import TipsManagement from './components/Admin/TipsManagement';
const AdminApp = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      const adminToken = Cookies.get('admintoken');
      const adminUser = Cookies.get('adminUser');
      
      if (adminToken && adminUser) {
        try {
          const userData = JSON.parse(adminUser);
          if (userData.role === 'admin') {
            setIsAuthenticated(true);
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error('Error parsing admin user data:', error);
          clearAuth();
          return;
        }
      }
      
      setIsLoading(false);
      setIsAuthenticated(false);
    };
    
    initializeAuth();
  }, []);

  const clearAuth = () => {
    Cookies.remove('admintoken', { path: '/' });
    Cookies.remove('adminUser', { path: '/' });
    setIsAuthenticated(false);
    setIsLoading(false);
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    console.log("Admin authentication successful");
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/admin/login');
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
        <Route 
          path="/login" 
          element={
            isAuthenticated ? 
              <Navigate to="/admin/dashboard" replace /> : 
              <AdminLoginPage onAuthSuccess={handleAuthSuccess} />
          } 
        />
        <Route 
          path="/register" 
          element={
            isAuthenticated ? 
              <Navigate to="/admin/dashboard" replace /> : 
              <AdminRegistrationPage onAuthSuccess={handleAuthSuccess} />
          } 
        />
        
        {isAuthenticated ? (
          <Route element={<SidebarLayout onLogout={handleLogout} userRole="admin" />}>
            <Route path="/dashboard" element={<AdminDashboard />} />
            <Route path="/datastore" element={<DatastorePage />} />
            <Route path="/clients" element={<ClientsManagement />} />
            <Route path="/users" element={<User/>} />
            <Route path="/evaluators" element={<EvaluatorsManagement />} />
            <Route path="/services" element={<AiServiceManager />} />
            <Route path="/credit-account" element={<CreditAccount/>} />
            <Route path="/credit-account/:accountId" element={<CreditAccountDetail/>} />
            <Route path="/configuration/:clientId" element={<Configuration />} />

            {/* <Route path="/users" element={<UserManagement />} />
            <Route path="/ai-agents" element={<AiAgentsManagement />} />
            <Route path="/conversations" element={<ConversationsManagement />} />
            <Route path="/tickets" element={<TicketsManagement />} />
            <Route path="/payments" element={<PaymentsManagement />} />
            <Route path="/tips" element={<TipsManagement />} /> */}
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/admin/login" replace />} />
        )}
      </Routes>
    </div>
  );
};

export default AdminApp;