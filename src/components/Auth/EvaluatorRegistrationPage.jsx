import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Cookies from 'js-cookie';

const EvaluatorRegistrationPage = ({ onAuthSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    currentcity: '',
    subjectMatterExpert: '',
    instituteworkedwith: '',
    examFocus: '',
    experience: '',
    // grade: '1st grade',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validatePasswords = () => {
    if (formData.password !== formData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return false;
    }
    
    if (formData.password.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return false;
    }
    
    setPasswordError('');
    return true;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePasswords()) {
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('https://aipbbackend-c5ed.onrender.com/api/evaluators/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      console.log('Registration response data:', data);
      if (data.success) {
        // Store token and evaluator data in cookies
        const userData = {
          id: data.evaluator.id,
          name: data.evaluator.name,
          email: data.evaluator.email,
          role: 'evaluator'
        };
        console.log('Setting evaluator user data:', userData);
        Cookies.set('evaluatortoken', data.token, { expires: 7 });
        Cookies.set('evaluatorUser', JSON.stringify(userData), { expires: 7 });
        
        // Notify parent component of success
        onAuthSuccess();
      } else {
        setError(data.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Evaluator registration error:', error);
      setError('An error occurred during registration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-6xl p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
            Evaluator Registration
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Create a new evaluator account
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-800 p-4 rounded-md">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                required
                minLength={2}
                maxLength={50}
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                type="email"
                name="email"
                id="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                placeholder="evaluator@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                name="password"
                id="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                placeholder="••••••••"
              />
              <p className="mt-1 text-xs text-gray-500">
                Password must be at least 8 characters long
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                id="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                placeholder="••••••••"
              />
              {passwordError && (
                <p className="mt-1 text-xs text-red-600">{passwordError}</p>
              )}
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                type="tel"
                name="phoneNumber"
                id="phoneNumber"
                required
                pattern="[0-9]{10}"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                placeholder="1234567890"
              />
            </div>

            <div>
              <label htmlFor="currentcity" className="block text-sm font-medium text-gray-700">
                Current City
              </label>
              <input
                type="text"
                name="currentcity"
                id="currentcity"
                value={formData.currentcity}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                placeholder="Your current city"
              />
            </div>

            <div>
              <label htmlFor="subjectMatterExpert" className="block text-sm font-medium text-gray-700">
                Subject Matter Expert
              </label>
              <input
                type="text"
                name="subjectMatterExpert"
                id="subjectMatterExpert"
                required
                minLength={2}
                maxLength={100}
                value={formData.subjectMatterExpert}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                placeholder="Your expertise area"
              />
            </div>

            <div>
              <label htmlFor="instituteworkedwith" className="block text-sm font-medium text-gray-700">
                Institute Worked With
              </label>
              <input
                type="text"
                name="instituteworkedwith"
                id="instituteworkedwith"
                value={formData.instituteworkedwith}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                placeholder="Previous institutes"
              />
            </div>

            <div>
              <label htmlFor="examFocus" className="block text-sm font-medium text-gray-700">
                Exam Focus
              </label>
              <input
                type="text"
                name="examFocus"
                id="examFocus"
                required
                minLength={2}
                maxLength={100}
                value={formData.examFocus}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                placeholder="Your exam focus areas"
              />
            </div>

            <div>
              <label htmlFor="experience" className="block text-sm font-medium text-gray-700">
                Years of Experience
              </label>
              <input
                type="number"
                name="experience"
                id="experience"
                required
                min={0}
                max={50}
                value={formData.experience}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                placeholder="Years of experience"
              />
            </div>

            {/* <div>
              <label htmlFor="grade" className="block text-sm font-medium text-gray-700">
                Grade
              </label>
              <select
                name="grade"
                id="grade"
                required
                value={formData.grade}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
              >
                <option value="1st grade">1st Grade</option>
                <option value="2nd grade">2nd Grade</option>
                <option value="3rd grade">3rd Grade</option>
              </select>
            </div> */}
          </div>

          <div className="flex items-center">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
              I agree to the <a href="#" className="text-red-600 hover:text-red-500">Terms of Service</a> and <a href="#" className="text-red-600 hover:text-red-500">Privacy Policy</a>
            </label>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-400"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </span>
              ) : (
                'Register'
              )}
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <Link
            to="/evaluator/login"
            className="text-red-600 hover:text-red-800 font-medium"
          >
            Already have an evaluator account? Sign in
          </Link>
        </div>

        <div className="border-t border-gray-200 pt-4 mt-4">
          <Link to="/" className="text-gray-600 hover:text-gray-800 font-medium">
            Back to main site
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EvaluatorRegistrationPage;
