import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaLock, FaUser, FaSignInAlt, FaShieldAlt } from 'react-icons/fa';
import { API_BASE_URL } from '../../config';

const SuperAdminLoginForm = ({ onLogin}) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = 'api/superadmin/login';
      
      console.log('Attempting super admin login with:', {
        email: formData.email
      });

      const response = await axios.post(`${API_BASE_URL}/${endpoint}`, formData);
      
      console.log('Server response:', response);
      
      if (!response.data.success && !response.data.token) {
        throw new Error(response.data.message || 'Login failed');
      }

      // Store super admin token
      localStorage.setItem('superadmintoken', response.data.token);

      // Store super admin data
      const superAdminData = {
        role: 'superadmin',
        name: response.data.superadmin?.name || response.data.name,
        email: response.data.superadmin?.email || response.data.email
      };
      localStorage.setItem('superAdminData', JSON.stringify(superAdminData));

      // Call onLogin with structured data
      onLogin({
        token: response.data.token,
        userType: 'superadmin',
        name: superAdminData.name,
        email: superAdminData.email
      });
      
      // Navigate to dashboard after successful login
      navigate('/superadmin/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Invalid super admin credentials. Please try again.';
      setError(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6 text-center">Super Admin Login</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className=" text-gray-700 text-sm font-bold mb-2 flex items-center">
            <FaUser className="mr-2" /> Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="superadmin@example.com"
          />
        </div>
        
        <div className="mb-6">
          <label className=" text-gray-700 text-sm font-bold mb-2 flex items-center">
            <FaLock className="mr-2" /> Password
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="flex items-center justify-center">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline w-full transition-colors"
          >
            {loading ? (
              <span className="inline-flex items-center">
                <svg className="animate-spin mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logging in...
              </span>
            ) : (
              <span className="inline-flex items-center">
                <FaShieldAlt className="mr-2" />
                Super Admin Login
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SuperAdminLoginForm; 