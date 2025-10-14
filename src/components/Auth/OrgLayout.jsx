import React from 'react';
import { Outlet, Link } from 'react-router-dom';

const OrgLayout = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
        <div className="hidden md:flex flex-col justify-center p-8 bg-white rounded-xl shadow-sm">
          <div className="flex items-center space-x-3">
            <img src="/logo.png" alt="Ailisher" className="w-10 h-10" />
            <span className="text-2xl font-bold text-gray-800">Ailisher Organizations</span>
          </div>
          <p className="mt-4 text-gray-600">
            Manage your organization, members, and clients from a single dashboard.
          </p>
          <div className="mt-6 text-sm text-gray-500">
            <p>
              Need help? <a href="#" className="text-blue-600 hover:text-blue-800">Contact support</a>
            </p>
          </div>
          <div className="mt-6">
            <Link to="/" className="text-gray-600 hover:text-gray-800 font-medium">Back to main site</Link>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 md:p-10">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default OrgLayout;


