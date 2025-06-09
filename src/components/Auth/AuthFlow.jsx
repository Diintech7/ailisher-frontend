import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import LoginPage from './LoginPage';
import RegistrationPage from './RegistrationPage';

const AuthFlow = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (email, password) => {
    setIsLoading(true);
    setError('');
    
    try {
      // Make API call to your backend
      const response = await fetch('https://aipbbackend.onrender.com/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Store token and user data in cookies
        Cookies.set('usertoken', data.token, { expires: 7 });
        Cookies.set('user', JSON.stringify({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role || 'user' // Default to user if role is not specified
        }), { expires: 7 });
        
        // Redirect based on role
        if (data.user.role === 'client' || data.user.role === 'user') {
          onAuthSuccess(data.user.role);
          navigate('/dashboard');
        } else {
          // If role is not set, redirect to role selection
          navigate('/role-selection');
        }
      } else {
        setError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (name, email, password) => {
    setIsLoading(true);
    setError('');
    
    try {
      // Make API call to your backend
      const response = await fetch('https://aipbbackend.onrender.com/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Store token and user data in cookies
        Cookies.set('usertoken', data.token, { expires: 7 });
        Cookies.set('user', JSON.stringify({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email
        }), { expires: 7 });
        
        // Redirect to role selection
        navigate('/role-selection');
      } else {
        setError(data.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('An error occurred during registration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
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
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-2xl">AI</span>
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">
            AILisher
          </h1>
          <h2 className="text-2xl font-bold tracking-tight text-gray-700 mb-4">
            {isLogin ? 'Sign in to your account' : 'Create a new account'}
          </h2>
          <p className="text-sm text-gray-600">
            {isLogin 
              ? 'Enter your credentials to access your account' 
              : 'Fill in the details to create your account'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-800 p-4 rounded-md">
            {error}
          </div>
        )}

        {isLogin ? (
          <LoginPage onLogin={handleLogin} isLoading={isLoading} />
        ) : (
          <RegistrationPage onRegister={handleRegister} isLoading={isLoading} />
        )}

        <div className="text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            {isLogin 
              ? "Don't have an account? Sign up" 
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthFlow;