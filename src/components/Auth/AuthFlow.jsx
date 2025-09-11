import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import LoginPage from './LoginPage';
import RegistrationPage from './RegistrationPage';
import RoleSelectionPage from './RoleSelectionPage';
import ClientRegistrationForm from './ClientRegistrationForm';

const AuthFlow = ({ onAuthSuccess }) => {
  const [currentStep, setCurrentStep] = useState('role-selection'); // 'role-selection', 'login', 'register', 'client-register'
  const [selectedRole, setSelectedRole] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRoleSelection = (role) => {
    setSelectedRole(role);
    setCurrentStep('login');
  };

  const handleLogin = async (email, password) => {
    setIsLoading(true);
    setError('');
    
    try {
      console.log('Attempting login with:', { email, role: selectedRole });
      
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      console.log('Login response:', data);
      
      if (data.success) {
        // Store token and user data
        Cookies.set('usertoken', data.token, { expires: 7 });
        Cookies.set('user', JSON.stringify({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role
        }), { expires: 7 });
        
        onAuthSuccess(data.user.role);
        navigate('/dashboard');
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
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name, 
          email, 
          password,
          role: selectedRole 
        }),
      });
      
      const data = await response.json();
      console.log('Registration response:', data);
      
      if (data.success) {
        // Store token and user data
        Cookies.set('usertoken', data.token, { expires: 7 });
        Cookies.set('user', JSON.stringify({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: selectedRole
        }), { expires: 7 });
        
          onAuthSuccess(selectedRole);
          setCurrentStep('login')        
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

  const handleClientRegister = async (clientData) => {
    setIsLoading(true);
    setError('');

    try {
      // const token = Cookies.get('usertoken');
      // if (!token) {
      //   throw new Error('Authentication required. Please login again.');
      // }

      // console.log('Submitting client registration with token:', token);

      const response = await fetch('http://localhost:5000/api/auth/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          businessName: clientData.businessName,
          businessOwnerName: clientData.businessOwnerName,
          email: clientData.email,
          businessNumber: clientData.businessNumber,
          businessGSTNumber: clientData.businessGSTNumber,
          businessPANNumber: clientData.businessPANNumber,
          businessMobileNumber: clientData.businessMobileNumber,
          businessCategory: clientData.businessCategory,
          businessAddress: clientData.businessAddress,
          city: clientData.city,
          pinCode: clientData.pinCode,
          businessLogo: clientData.businessLogo,
          businessWebsite: clientData.businessWebsite,
          businessYoutubeChannel: clientData.businessYoutubeChannel,
          turnOverRange: clientData.turnOverRange
        }),
      });

      const data = await response.json();
      console.log('Client registration response:', data);

      if (data.success) {
        // Store token and user data
        Cookies.set('usertoken', data.token, { expires: 7 });
        Cookies.set('user', JSON.stringify({
          id: data.client.id,
          name: data.client.name,
          email: data.client.email,
          role: 'client',
          businessName: data.client.businessName,
          businessOwnerName: data.client.businessOwnerName,
          userId: data.client.userId
        }), { expires: 7 });
        
        // Show success message and redirect to dashboard
        alert('Registration successful!');
        onAuthSuccess('client');
        setCurrentStep('login')
        // navigate('/dashboard')
      } else {
        throw new Error(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Client registration error:', error);
      setError(error.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const switchToLogin = () => {
    setCurrentStep('login');
  };

  const switchToRegister = () => {
    if (selectedRole === 'client') {
      setCurrentStep('client-register');
    } else {
      setCurrentStep('register');
    }
  };

  const goBackToRoleSelection = () => {
    setCurrentStep('role-selection');
    setSelectedRole(null);
  };

  const renderContent = () => {
    switch (currentStep) {
      case 'role-selection':
        return (
          <RoleSelectionPage 
            onRoleSelect={handleRoleSelection}
            isLoading={isLoading}
          />
        );
      case 'login':
        return (
          <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight text-gray-700 mb-4">
                Sign in as {selectedRole}
              </h2>
            </div>
            {error && (
              <div className="bg-red-50 text-red-800 p-4 rounded-md">
                {error}
              </div>
            )}
            <LoginPage onLogin={handleLogin} isLoading={isLoading} />
            <div className="flex flex-col items-center space-y-4">
              <button
                type="button"
                onClick={switchToRegister}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Don't have an account? Sign up
              </button>
              <button
                type="button"
                onClick={goBackToRoleSelection}
                className="text-gray-600 hover:text-gray-800 font-medium"
              >
                Change Role
              </button>
            </div>
          </div>
        );
      case 'register':
        return (
          <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight text-gray-700 mb-4">
                Create {selectedRole} account
              </h2>
            </div>
            {error && (
              <div className="bg-red-50 text-red-800 p-4 rounded-md">
                {error}
              </div>
            )}
            <RegistrationPage onRegister={handleRegister} isLoading={isLoading} />
            <div className="flex flex-col items-center space-y-4">
              <button
                type="button"
                onClick={switchToLogin}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Already have an account? Sign in
              </button>
              <button
                type="button"
                onClick={goBackToRoleSelection}
                className="text-gray-600 hover:text-gray-800 font-medium"
              >
                Change Role
              </button>
            </div>
          </div>
        );
      case 'client-register':
        return (
          <div className="w-full max-w-5xl mx-auto flex justify-center bg-white rounded-lg shadow-md">
            <ClientRegistrationForm
              onRegister={handleClientRegister}
              isLoading={isLoading}
              onBack={switchToLogin}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      {renderContent()}
    </div>
  );
};

export default AuthFlow;