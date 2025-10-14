import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { API_BASE_URL } from '../../config';

const OrgLogin = ({ onAuthSuccess }) => {
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/organizations/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authEmail, authPassword })
      });

      const data = await response.json();

      if (response.ok && data.success && data.token) {
        Cookies.set('orgtoken', data.token, { expires: 7 });
        Cookies.set('organization', JSON.stringify(data.organization), { expires: 7 });
        if (onAuthSuccess) onAuthSuccess();
        navigate('/organization/dashboard');
      } else {
        setError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Organization Login</h1>
          <p className="mt-2 text-sm text-gray-600">Sign in to access your organization dashboard</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-800 p-4 rounded-md">{error}</div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="org@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <Link to="/organization/register" className="text-blue-600 hover:text-blue-800 font-medium">
            Don't have an organization account? Register
          </Link>
        </div>

        <div className="border-t border-gray-200 pt-4 mt-4">
          <Link to="/" className="text-gray-600 hover:text-gray-800 font-medium">Back to main site</Link>
        </div>
      </div>
    </div>
  );
};

export default OrgLogin;


