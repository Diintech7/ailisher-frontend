import { useState } from 'react';
import { Routes, Route, useNavigate, Link } from 'react-router-dom';
import SuperAdminLoginForm from './SuperAdminLoginForm';

const SuperAdminAuthLayout = ({ onLogin }) => {
  const [authMode, setAuthMode] = useState('login');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-purple-800">Super Admin Portal</h1>
          <p className="text-gray-600 mt-2">Restricted access for system administrators</p>
        </div>

        <Routes>
          <Route path="/login" element={
            <SuperAdminLoginForm 
              onLogin={onLogin} 
            />
          } />
        </Routes>

        <div className="mt-6 border-t border-gray-200 pt-4">
          <div className="mt-6 text-center">
            <Link to="/auth" className="text-gray-500 hover:text-gray-700">
              Return to main login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminAuthLayout; 