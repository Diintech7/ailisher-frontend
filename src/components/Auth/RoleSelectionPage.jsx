import React from 'react';
import { X, Upload, Loader2, Check } from 'lucide-react';

const RoleSelectionPage = ({ onRoleSelect, isLoading }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f3f6f9]">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md">
        {/* Logo Section */}
        <div className="flex justify-center mb-6">
          <img 
            src="/logo.png" 
            alt="Ailisher Logo" 
            className="h-16 w-auto"
            onError={(e) => {
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
        
        <h1 className="text-3xl font-bold text-center mb-2 text-[#112130]">Ailisher</h1>
        <h2 className="text-xl font-semibold text-center mb-8 text-[#112130]">Select Your Role</h2>
        
        <div className="space-y-4">
          <button
            onClick={() => onRoleSelect('client')}
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
            onClick={() => onRoleSelect('user')}
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