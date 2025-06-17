import React, { useState, useEffect, useRef } from 'react';

const QRQuestionPage = () => {
  const [questionId, setQuestionId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientId, setClientId] = useState('');
  
  const [step, setStep] = useState('loading'); // loading, auth, question, submit
  const [question, setQuestion] = useState(null);
  const [clientInfo, setClientInfo] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegisteredUser, setIsRegisteredUser] = useState(false);

  // Answer submission states
  const [selectedImages, setSelectedImages] = useState([]);
  const [textAnswer, setTextAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submissionResult, setSubmissionResult] = useState(null);
  const fileInputRef = useRef(null);

  const API_BASE = 'https://aipbbackend.onrender.com/api';

  // Simple cookie utility
  const setCookie = (name, value, days) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;secure;samesite=strict`;
  };

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  };

  // NEW: Function to fetch client info early
  const fetchClientInfo = async (clientId) => {
    try {
      // Option 1: Use the existing check-user endpoint (recommended)
      const response = await fetch(`${API_BASE}/mobile-qr-auth/clients/${clientId}/qr/check-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobile: '0000000000' }), // Dummy mobile to get client info
      });

      const data = await response.json();
      
      if (data.success && data.data.clientInfo) {
        setClientInfo(data.data.clientInfo);
        return data.data.clientInfo;
      }
      
      // Option 2: If you have a dedicated client info endpoint, use this instead:
      // const response = await fetch(`${API_BASE}/clients/${clientId}/info`);
      // const data = await response.json();
      // if (data.success) {
      //   setClientInfo(data.data);
      //   return data.data;
      // }
      
      return null;
    } catch (error) {
      console.error('Error fetching client info:', error);
      return null;
    }
  };

  useEffect(() => {
    const initializePage = async () => {
      // Get URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const urlQuestionId = window.location.pathname.split('/').pop();
      const urlClientName = urlParams.get('client');
      const urlClientId = urlParams.get('clientId');
      
      // Set the state values and get the actual values to use
      let currentQuestionId = '';
      let currentClientId = '';
      
      if (urlQuestionId) {
        setQuestionId(urlQuestionId);
        currentQuestionId = urlQuestionId;
      }
      if (urlClientName) setClientName(urlClientName);
      if (urlClientId) {
        setClientId(urlClientId);
        currentClientId = urlClientId;
        
        // Fetch client info immediately when we have clientId
        await fetchClientInfo(urlClientId);
      }
      
      // Now check auth and load question with the actual values
      if (currentQuestionId) {
        await checkAuthAndLoadQuestion(currentQuestionId);
      } else {
        setError('Question ID not found');
        setStep('auth');
      }
    };

    initializePage();
  }, []);
  

  const checkAuthAndLoadQuestion = async (qId) => {
    try {
      const token = getCookie('qr_auth_token');
      console.log('Question ID:', qId);
      
      if (token && qId) {
        // Check if already authenticated
        const response = await fetch(`${API_BASE}/aiswb/qr/questions/${qId}/view`, {
            headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setQuestion(data.data);
          setClientInfo(data.data.clientInfo);
          setStep('question');
          return;
        }
      }
      
      // Need authentication
      setStep('auth');
    } catch (error) {
      console.error('Auth check error:', error);
      setStep('auth');
    }
  };

  const checkUserRegistration = async (mobileNumber) => {
    try {
      const response = await fetch(`${API_BASE}/mobile-qr-auth/clients/${clientId}/qr/check-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobile: mobileNumber }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Update client info if not already set
        if (data.data.clientInfo && !clientInfo) {
          setClientInfo(data.data.clientInfo);
        }
        
        setIsRegisteredUser(data.data.isRegistered);
        
        if (data.data.isRegistered && data.data.userProfile) {
          setUserInfo(data.data.userProfile);
          setName(data.data.userProfile.name || '');
        }
        
        return data.data;
      }
      
      return null;
    } catch (error) {
      console.error('User check error:', error);
      return null;
    }
  };

  const sendOTP = async () => {
    if (!mobile || mobile.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // First check if user is registered
      await checkUserRegistration(mobile);

      const response = await fetch(`${API_BASE}/mobile-qr-auth/clients/${clientId}/qr/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobile }),
      });

      const data = await response.json();
      
      if (data.success) {
        setOtpSent(true);
        setError('');
        
        // Update client and user info from response
        if (data.data.clientInfo) {
          setClientInfo(data.data.clientInfo);
        }
        
        if (data.data.userInfo) {
          setIsRegisteredUser(data.data.userInfo.isRegistered);
          if (data.data.userInfo.isRegistered) {
            setUserInfo({
              name: data.data.userInfo.name,
              profilePicture: data.data.userInfo.profilePicture,
              mobile: mobile
            });
            setName(data.data.userInfo.name || '');
          }
        }
      } else {
        console.error('OTP send error:', data);
        setError(data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Network error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    // Only require name for new users
    if (!isRegisteredUser && (!name || name.length < 2)) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const requestBody = { 
        mobile, 
        otp
      };

      // Only include name for new users or if name field is filled
      if (!isRegisteredUser || name.trim()) {
        requestBody.name = name;
      }

      const response = await fetch(`${API_BASE}/mobile-qr-auth/clients/${clientId}/qr/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      
      if (data.success) {
        // Save token in cookies
        setCookie('qr_auth_token', data.data.authToken, 30);
        
        // Update user and client info
        setUserInfo({
          name: data.data.user.name,
          profilePicture: data.data.user.profilePicture,
          mobile: data.data.user.mobile
        });
        
        if (data.data.clientInfo) {
          setClientInfo(data.data.clientInfo);
        }
        
        // Load question with the current questionId
        await loadQuestion(data.data.authToken, questionId);
      } else {
        console.error('OTP verification error:', data);
        setError(data.message || data.error?.details || 'Invalid OTP');
      }
    } catch (error) {
      console.error('Network error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadQuestion = async (token, qId = questionId) => {
    try {
      if (!qId) {
        setError('Question ID not available');
        return;
      }

      const response = await fetch(`${API_BASE}/aiswb/qr/questions/${qId}/view`, {
        headers: {
          'Authorization': `Bearer ${token || getCookie('qr_auth_token')}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setQuestion(data.data);
        if (data.data.clientInfo) {
          setClientInfo(data.data.clientInfo);
        }
        setStep('question');
      } else {
        console.error('Question load error:', data);
        setError('Failed to load question');
      }
    } catch (error) {
      console.error('Question load error:', error);
      setError('Failed to load question');
    }
  };

  // Image handling functions
  const handleImageSelect = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf';
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
      return isValidType && isValidSize;
    });

    if (validFiles.length !== files.length) {
      setSubmitError('Some files were rejected. Only image files and PDFs under 5MB are allowed.');
      setTimeout(() => setSubmitError(''), 5000);
    }

    if (selectedImages.length + validFiles.length > 10) {
      setSubmitError('Maximum 10 files allowed');
      return;
    }

    const newImages = validFiles.map(file => ({
      file,
      id: Date.now() + Math.random(),
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      name: file.name,
      size: file.size
    }));

    setSelectedImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (imageId) => {
    setSelectedImages(prev => {
      const imageToRemove = prev.find(img => img.id === imageId);
      if (imageToRemove && imageToRemove.preview) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return prev.filter(img => img.id !== imageId);
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const submitAnswer = async () => {
    if (selectedImages.length === 0 && (!textAnswer || textAnswer.trim() === '')) {
      setSubmitError('Please provide either images or text answer');
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);

    try {
      const token = getCookie('qr_auth_token');
      const formData = new FormData();

      // Add images to form data
      selectedImages.forEach((image, index) => {
        formData.append('images', image.file);
      });

      // Add text answer if provided
      if (textAnswer && textAnswer.trim()) {
        formData.append('textAnswer', textAnswer.trim());
      }

      // Add metadata
      formData.append('sourceType', 'qr_scan');
      formData.append('timeSpent', Math.floor(Date.now() / 1000));
      formData.append('deviceInfo', navigator.userAgent);
      formData.append('appVersion', 'web-qr-1.0');

      const response = await fetch(`${API_BASE}/clients/${clientId}/mobile/userAnswers/questions/${questionId}/answers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setSubmitSuccess(true);
        setSubmissionResult(data.data);
        setStep('submit');
      } else {
        if (response.status === 555) {
          setSubmitError('Maximum submission limit reached. You have already submitted 5 attempts for this question.');
        } else {
          setSubmitError(data.message || 'Failed to submit answer');
        }
      }
    } catch (error) {
      console.error('Submit error:', error);
      setSubmitError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (step === 'auth') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
          {/* Client Info - Now shows logo immediately when available */}
          <div className="text-center mb-8">
            {clientInfo?.clientLogo && (
              <img 
                src={clientInfo.clientLogo} 
                alt={clientInfo.clientName || clientName}
                className="w-16 h-16 mx-auto mb-4 rounded-full object-cover border-2 border-gray-200"
              />
            )}
            <h1 className="text-2xl font-bold text-gray-800">
              {clientInfo?.clientName || clientName}
            </h1>
            {clientInfo?.city && (
              <p className="text-gray-500 text-sm">{clientInfo.city}</p>
            )}
            <p className="text-gray-600 mt-2">Please authenticate to access the question</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {!otpSent ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                  placeholder="Enter 10-digit mobile number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <button
                onClick={sendOTP}
                disabled={loading || mobile.length !== 10}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Show user info if registered */}
              {isRegisteredUser && userInfo && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-3">
                    {userInfo.profilePicture ? (
                      <img 
                        src={userInfo.profilePicture} 
                        alt={userInfo.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="text-green-600 font-semibold text-lg">
                          {userInfo.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-green-800">Welcome back!</p>
                      <p className="text-green-700 text-sm">{userInfo.name}</p>
                      <p className="text-green-600 text-xs">{userInfo.mobile}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Name field - only show for new users */}
              {!isRegisteredUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OTP sent to {mobile}
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit OTP"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <button
                onClick={verifyOTP}
                disabled={loading || otp.length !== 6 || (!isRegisteredUser && !name)}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>
              
              <button
                onClick={() => {
                  setOtpSent(false);
                  setOtp('');
                  setError('');
                  setIsRegisteredUser(false);
                  setUserInfo(null);
                  setName('');
                }}
                className="w-full text-blue-600 hover:text-blue-800"
              >
                Change Mobile Number
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Rest of the component remains the same...
  if (step === 'submit' && submitSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Success Message */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Answer Submitted Successfully!</h2>
              <p className="text-gray-600 mb-6">
                {question?.evaluationMode === 'manual'
                  ? 'Your answer has been submitted and will be evaluated manually.'
                  : 'Your answer has been submitted and evaluated successfully.'}
              </p>
              
              {submissionResult && (
                <div className="bg-gray-50 rounded-lg p-6 text-left">
                  <h3 className="font-semibold text-gray-800 mb-4">Submission Details:</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Answer ID:</span>
                      <span className="font-mono">{submissionResult.answerId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Attempt Number:</span>
                      <span>{submissionResult.attemptNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Images Uploaded:</span>
                      <span>{submissionResult.imagesCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Remaining Attempts:</span>
                      <span>{submissionResult.remainingAttempts}</span>
                    </div>
                    {submissionResult.evaluation && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Marks Awarded:</span>
                          <span className="font-semibold text-green-600">
                            {submissionResult.evaluation.marks}/{submissionResult.question.maximumMarks}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Accuracy:</span>
                          <span className="font-semibold text-blue-600">
                            {submissionResult.evaluation.accuracy}%
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
              
              <div className="mt-6 space-y-3">
                {!submissionResult?.isFinalAttempt && submissionResult?.remainingAttempts > 0 && (
                  <button
                    onClick={() => {
                      setStep('question');
                      setSelectedImages([]);
                      setTextAnswer('');
                      setSubmitSuccess(false);
                      setSubmissionResult(null);
                    }}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                  >
                    Submit Another Attempt ({submissionResult.remainingAttempts} left)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'question' && question) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header with Client and User Info */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {clientInfo?.clientLogo && (
                  <img 
                    src={clientInfo.clientLogo} 
                    alt={clientInfo.clientName || clientName}
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                  />
                )}
                <div>
                  <h1 className="text-xl font-bold text-gray-800">{clientInfo?.clientName || clientName}</h1>
                  <p className="text-gray-600 text-sm">Question ID: {questionId}</p>
                </div>
              </div>
              
              {/* User Info */}
              {userInfo && (
                <div className="flex items-center space-x-3">
                  {userInfo.profilePicture ? (
                    <img 
                      src={userInfo.profilePicture} 
                      alt={userInfo.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-blue-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">
                        {userInfo.name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-800">{userInfo.name || 'User'}</p>
                    <p className="text-xs text-gray-500">{userInfo.mobile}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-4 flex justify-between items-center">
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                Difficulty: {question.metadata?.difficultyLevel}
              </div>
              <p className="text-sm text-gray-600">
                Max Marks: {question.metadata?.maximumMarks}
              </p>
            </div>
          </div>

          {/* Question */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
            <div className="prose max-w-none">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Question</h2>
              <div 
                className="text-gray-700 leading-relaxed text-lg"
                dangerouslySetInnerHTML={{ __html: question.question }}
              />
            </div>

            {/* Metadata */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {question.metadata?.estimatedTime && (
                  <div>
                    <span className="font-medium text-gray-600">Time:</span>
                    <span className="ml-2">{question.metadata.estimatedTime} minutes</span>
                  </div>
                )}
                {question.metadata?.wordLimit && (
                  <div>
                    <span className="font-medium text-gray-600">Word Limit:</span>
                    <span className="ml-2">{question.metadata.wordLimit} words</span>
                  </div>
                )}
                {question.languageMode && (
                  <div>
                    <span className="font-medium text-gray-600">Language:</span>
                    <span className="ml-2">{question.languageMode}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Answer Submission */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Submit Your Answer</h3>
            
            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                {submitError}
              </div>
            )}

            {/* Image Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Answer Images
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <div className="space-y-2">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="text-gray-600">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="font-medium text-blue-600 hover:text-blue-500"
                    >
                      Click to upload
                    </button>
                    <span> or drag and drop</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Images and PDFs up to 5MB each (Max 10 files)
                  </p>
                </div>
              </div>
            </div>

            {/* Selected Images */}
            {selectedImages.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Selected Files ({selectedImages.length}/10)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedImages.map((image) => (
                    <div key={image.id} className="relative border border-gray-200 rounded-lg p-3">
                      {image.preview ? (
                        <img
                          src={image.preview}
                          alt={image.name}
                          className="w-full h-32 object-cover rounded-lg mb-2"
                        />
                      ) : (
                        <div className="w-full h-32 bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                          <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      )}
                      <div className="text-xs">
                        <p className="font-medium text-gray-800 truncate">{image.name}</p>
                        <p className="text-gray-500">{formatFileSize(image.size)}</p>
                      </div>
                      <button
                        onClick={() => removeImage(image.id)}
                        className="absolute top-1 right-1 bg-red-100 hover:bg-red-200 text-red-600 rounded-full p-1 text-xs"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}


            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={submitAnswer}
                disabled={submitting || (selectedImages.length === 0 && (!textAnswer || textAnswer.trim() === ''))}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </div>
                ) : (
                  'Submit Answer'
                )}
              </button>
            </div>

            {/* Help Text */}
            <div className="mt-4 text-sm text-gray-600">
              <p>• You can submit up to 5 attempts for this question</p>
              <p>• Either upload images of your answer or provide text answer (or both)</p>
              <p>• Supported formats: JPG, PNG, WebP, PDF (max 5MB each)</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-red-600 text-xl mb-4">Question not found</div>
        <p className="text-gray-600">The requested question could not be loaded.</p>
      </div>
    </div>
  );
};

export default QRQuestionPage;