import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import SidebarLayout from './components/SidebarLayout';
import EvaluatorLoginPage from './components/Auth/EvaluatorLoginPage';
import EvaluatorRegistrationPage from './components/Auth/EvaluatorRegistrationPage';
import EvaluatorDashboard from './components/Evaluator/EvaluatorDashboard';
import EvaluatorReview from './components/Evaluator/EvaluatorReview';
import EvaluatorProfile from './components/Evaluator/EvaluatorProfile';
import PendingAnswers from './components/Evaluator/PendingAnswers';
import EvaluatedAnswers from './components/Evaluator/EvaluatedAnswers';
import AcceptedAnswers from './components/Evaluator/AcceptedAnswers';
import CreditManagement from './components/Evaluator/CreditManagement';

const EvaluatorApp = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [disabledMessage, setDisabledMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      const evaluatorToken = Cookies.get('evaluatortoken');
      const evaluatorUser = Cookies.get('evaluatorUser');
      
      if (evaluatorToken && evaluatorUser) {
        try {
          const userData = JSON.parse(evaluatorUser);
          if (userData.role === 'evaluator') {
            // Fetch latest evaluator data from backend
            try {
              console.log("user",userData)
              const res = await fetch(`https://aipbbackend-c5ed.onrender.com/api/evaluators/${userData.id}`, {
                headers: {
                  'Authorization': `Bearer ${evaluatorToken}`,
                  'Content-Type': 'application/json'
                }
              });
              if (!res.ok) throw new Error('Failed to fetch evaluator data');
              const evaluator = await res.json();
              console.log(evaluator)
              if (!evaluator.evaluator.enabled || evaluator.evaluator.status === "NOT_VERIFIED") {
                clearAuth();
                setDisabledMessage('You are disabled by admin. Please contact support.');
                return;
              }
              setIsAuthenticated(true);
              setIsLoading(false);
              return;
            } catch (err) {
              clearAuth();
              // setDisabledMessage('Unable to verify your account status. Please login again.');
              return;
            }
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
    Cookies.remove('evaluatortoken', { path: '/' });
    Cookies.remove('evaluatorUser', { path: '/' });
    setIsAuthenticated(false);
    setIsLoading(false);
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    console.log("Evaluator authentication successful");
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/evaluator/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (disabledMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded shadow text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-700">{disabledMessage}</p>
        </div>
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
              <Navigate to="/evaluator/dashboard" replace /> : 
              <EvaluatorLoginPage onAuthSuccess={handleAuthSuccess} />
          } 
        />
        <Route 
          path="/register" 
          element={
            isAuthenticated ? 
              <Navigate to="/evaluator/dashboard" replace /> : 
              <EvaluatorRegistrationPage onAuthSuccess={handleAuthSuccess} />
          } 
        />
        
        {isAuthenticated ? (
          <Route element={<SidebarLayout onLogout={handleLogout} userRole="evaluator" />}>
            <Route path="/dashboard" element={<EvaluatorDashboard />} />
            <Route path="/review" element={<EvaluatorReview/>} />
            <Route path="/profile" element={<EvaluatorProfile/>} />
            <Route path="/pending" element={<PendingAnswers/>} />
            <Route path="/accepted" element={<AcceptedAnswers/>} />
            <Route path="/completed" element={<EvaluatedAnswers/>} />
            <Route path="/credit" element={<CreditManagement/>} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/evaluator/login" replace />} />
        )}
      </Routes>
    </div>
  );
};

export default EvaluatorApp;