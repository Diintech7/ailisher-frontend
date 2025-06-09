import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

const RoleSelectionPage = ({ onAuthSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const selectRole = async (role) => {
    setIsLoading(true);
    setError('');
    
    try {
      const userCookie = Cookies.get('user');
      const token = Cookies.get('usertoken');
      
      if (!userCookie || !token) {
        throw new Error('User data not found. Please login again.');
      }
      
      const userData = JSON.parse(userCookie);
      
      // Make API call to update user role
      const response = await fetch('https://aipbbackend.onrender.com/api/auth/update-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update user cookie with new role
        Cookies.set('user', JSON.stringify({
          ...userData,
          role
        }), { expires: 7 });
        
        // Update auth state and redirect
        onAuthSuccess(role);
        navigate('/dashboard');
      } else {
        setError(data.message || 'Failed to set role. Please try again.');
      }
    } catch (error) {
      console.error('Role selection error:', error);
      setError(error.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f3f6f9]">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md">
        {/* Logo Section */}
        <div className="flex justify-center mb-6">
          <img 
            src="/logo.png" 
            alt="AILisher Logo" 
            className="h-16 w-auto"
            onError={(e) => {
              // Fallback if logo fails to load
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
          <div className="hidden">
            <div className="w-16 h-16 bg-[#112130] rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-2xl">AI</span>
            </div>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-center mb-2 text-[#112130]">AILisher</h1>
        <h2 className="text-xl font-semibold text-center mb-8 text-[#112130]">Select Your Role</h2>
        
        {error && (
          <div className="mb-6 bg-red-50 text-red-800 p-4 rounded-md">
            {error}
          </div>
        )}
        
        <div className="space-y-4">
          <button
            onClick={() => selectRole('client')}
            disabled={isLoading}
            className="w-full p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-[#f0f4f8] transition-colors disabled:opacity-50"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-[#112130] rounded-full flex items-center justify-center text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A9.001 9.001 0 0010.995 3.998C5.61 3.998 1.244 8.362 1.244 13.747c0 5.385 4.366 9.75 9.75 9.75 1.558 0 3.03-.368 4.338-1.016" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 13a3 3 0 100-6 3 3 0 000 6z" />
                </svg>
              </div>
              <div className="ml-4 text-left">
                <h3 className="text-xl font-semibold text-[#112130]">Client</h3>
                <p className="text-gray-600">Create and manage AI books, agents, and user access</p>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => selectRole('user')}
            disabled={isLoading}
            className="w-full p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-[#f0f4f8] transition-colors disabled:opacity-50"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-[#112130] rounded-full flex items-center justify-center text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div className="ml-4 text-left">
                <h3 className="text-xl font-semibold text-[#112130]">User</h3>
                <p className="text-gray-600">Access AI books, take tests, and attend lectures</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionPage;