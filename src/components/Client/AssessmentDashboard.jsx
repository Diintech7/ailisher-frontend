import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, AlertTriangle, XCircle, Image as ImageIcon, Wand2, X, ChevronDown, ChevronUp, Upload, Heart, Edit, Trash } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import Cookies from 'js-cookie';
import QRCodeGenerator from './QRCodeGenerator';
import ImageUploadModal from './ImageUploadModal';

const AssessmentDashboard = () => {
  const { topicId, setId, questionId } = useParams();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('submitted');
  const [question, setQuestion] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showGeminiModal, setShowGeminiModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showMetadata, setShowMetadata] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [userData, setUserData] = useState(null);
  const [evaluatedTab, setEvaluatedTab] = useState('notPublished');
  const [aiEvaluatedTab, setAiEvaluatedTab] = useState('private');
  const [showEvaluationModeModal, setShowEvaluationModeModal] = useState(false);
  const [evaluationMode, setEvaluationMode] = useState(() => {
    // Get evaluation mode from localStorage or default to manual
    return localStorage.getItem(`evaluation_mode_${questionId}`) || 'manual';
  });
  const navigate = useNavigate();
  const [isAutoEvaluating, setIsAutoEvaluating] = useState(false);
  const [evaluationProgress, setEvaluationProgress] = useState(0);
  const [editingEvaluation, setEditingEvaluation] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false
  });

  useEffect(() => {
    // Get user data from cookies
    const userCookie = Cookies.get('user');
    if (userCookie) {
      try {
        const parsedUserData = JSON.parse(userCookie);
        setUserData(parsedUserData);
      } catch (error) {
        console.error('Error parsing user data from cookie:', error);
      }
    }
    
    const fetchQuestionDetails = async () => {
      try {
        setLoading(true);
        // Get question data from navigation state
        if (location.state?.question) {
          setQuestion(location.state.question);
        } else {
          // If no state, fetch from API
          const token = Cookies.get('usertoken');
          if (!token) {
            setError('Authentication required');
          return;
        }
        
          const response = await fetch(`https://aipbbackend.onrender.com/api/aiswb/questions/${questionId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          const data = await response.json();
          if (data.success) {
            setQuestion(data.data);
          } else {
            setError('Failed to load question details');
          return;
        }
          }

        // Fetch real submissions
        await fetchSubmissions();
        
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to connect to the server');
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuestionDetails();
  }, [topicId, setId, questionId, location.state]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const token = Cookies.get('usertoken');
      if (!token) {
        setError('Authentication required');
        return;
      }

      // Map the activeTab to the correct API parameters
      let queryParams = new URLSearchParams({
        page: pagination.currentPage,
        limit: pagination.limit
      });

      let apiEndpoint = 'https://aipbbackend.onrender.com/api/clients/CLI677117YN7N/mobile/userAnswers/crud/answers';

      // Add the appropriate status parameter based on the active tab
      if (activeTab === 'submitted') {
        queryParams.append('submissionStatus', 'submitted');
      } else if (activeTab === 'evaluated') {
        queryParams.append('submissionStatus', 'evaluated');
        if (evaluatedTab === 'published') {
          queryParams.append('status', 'published');
        } else {
          queryParams.append('status', 'not_published');
        }
      } else if (activeTab === 'aiEvaluated') {
        // For AI Evaluated tab, use the evaluated endpoint with specific parameters
        apiEndpoint = 'https://aipbbackend.onrender.com/api/clients/CLI677117YN7N/mobile/userAnswers/crud/answers/evaluated';
        queryParams.append('evaluationMode', 'auto');
        
        if (aiEvaluatedTab === 'public') {
          queryParams.append('status', 'published');
        } else {
          queryParams.append('status', 'private');
        }
      } else if (activeTab === 'review') {
        queryParams.append('submissionStatus', 'reviewed');
      } else if (activeTab === 'rejected') {
        queryParams.append('submissionStatus', 'rejected');
      } else if (activeTab === 'popular') {
        queryParams.append('submissionStatus', 'evaluated');
        queryParams.append('status', 'published');
        queryParams.append('popularityStatus', 'popular');
      }

      console.log('Fetching submissions with params:', queryParams.toString());
      console.log('API Endpoint:', apiEndpoint);

      const response = await fetch(`${apiEndpoint}?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', data);

      if (data.success && Array.isArray(data.data.answers)) {
        // Process the answers data
        const processedData = data.data.answers.map(answer => ({
          id: answer._id,
          studentName: answer.user?.name || answer.userName || 'Anonymous',
          submittedAt: answer.submittedAt,
          status: answer.submissionStatus,
          answerImages: answer.answerImages?.map(img => img.imageUrl) || [],
          isPublished: answer.status === 'published',
          publishedAt: answer.evaluatedAt,
          marks: answer.evaluation?.marks || 0,
          feedback: answer.evaluation?.feedback || '',
          extractedTexts: answer.extractedTexts || [],
          geminiAnalysis: {
            accuracy: answer.evaluation?.accuracy || 0,
            strengths: answer.evaluation?.strengths || [],
            weaknesses: answer.evaluation?.weaknesses || [],
            suggestions: answer.evaluation?.suggestions || []
          },
          reviewStatus: answer.reviewStatus,
          popularityStatus: answer.popularityStatus,
          lastUpdated: answer.updatedAt,
          evaluation: answer.evaluation || null,
          metadata: answer.metadata || {},
          question: answer.question || null
        }));

        setSubmissions(processedData);
        
        // Update pagination state
        if (data.data.pagination) {
          setPagination({
            currentPage: data.data.pagination.currentPage,
            totalPages: data.data.pagination.totalPages,
            totalCount: data.data.pagination.totalCount,
            limit: data.data.pagination.limit,
            hasNextPage: data.data.pagination.hasNextPage,
            hasPrevPage: data.data.pagination.hasPrevPage
          });
        }
      } else {
        console.warn('No submissions found or invalid data format');
        setSubmissions([]);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setSubmissions([]);
      toast.error('Failed to fetch submissions: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Update useEffect to refetch when tab or pagination changes
  useEffect(() => {
    if (questionId) {
      fetchSubmissions();
    }
  }, [activeTab, evaluatedTab, aiEvaluatedTab, pagination.currentPage, questionId]);

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleEvaluate = async (submission) => {
    try {
      const token = Cookies.get('usertoken');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      // Generate evaluation prompt
      let prompt = `Evaluate the following answer for the given question:\n\n`;
      prompt += `QUESTION DETAILS:\n`;
      prompt += `Question: ${question.question}\n`;
      
      // Include metadata
      prompt += `\nQUESTION METADATA:\n`;
      Object.entries(question.metadata).forEach(([key, value]) => {
        if (key === 'qualityParameters') {
          prompt += `\nQUALITY PARAMETERS:\n`;
          if (typeof value === 'string') {
            try {
              const params = JSON.parse(value);
              Object.entries(params).forEach(([param, paramValue]) => {
                if (param === 'body' && typeof paramValue === 'object') {
                  prompt += `body:\n`;
                  Object.entries(paramValue).forEach(([bodyParam, bodyValue]) => {
                    prompt += `  - ${bodyParam}: ${bodyValue}\n`;
                  });
                } else if (param === 'customParams' && paramValue) {
                  prompt += `customParams:\n`;
                  Object.entries(paramValue).forEach(([customParam, customValue]) => {
                    prompt += `  - ${customParam}: ${customValue}\n`;
                  });
                } else {
                  prompt += `${param}: ${paramValue}\n`;
                }
              });
            } catch (e) {
              prompt += `${value}\n`;
            }
          }
        } else {
          prompt += `${key}: ${value}\n`;
        }
      });

      // Include reference answer if available
      if (question.detailedAnswer) {
        prompt += `\nREFERENCE ANSWER:\n${question.detailedAnswer}\n`;
      }

      // Call the evaluation API directly
      const response = await fetch(`https://aipbbackend.onrender.com/api/clients/CLI677117YN7N/mobile/userAnswers/answers/${submission.id}/evaluate-manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'mobileusertoken': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          evaluationPrompt: prompt,
          includeExtractedText: true,
          includeQuestionDetails: true,
          maxMarks: question.metadata.maximumMarks || 10
        })
      });

      const data = await response.json();
      console.log('Evaluation Response:', data);

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to evaluate answer');
      }

      // Update the submission with evaluation results
      const updatedSubmission = {
        ...submission,
        status: 'evaluated',
        isPublished: false,
        marks: data.data.evaluation.marks,
        feedback: data.data.evaluation.feedback,
        geminiAnalysis: {
          accuracy: data.data.evaluation.accuracy,
          strengths: data.data.evaluation.strengths,
          weaknesses: data.data.evaluation.weaknesses,
          suggestions: data.data.evaluation.suggestions
        },
        extractedTexts: data.data.extractedTexts || [],
        lastUpdated: new Date().toISOString(),
        evaluation: data.data.evaluation
      };

      // Update submissions list
      const updatedSubmissions = submissions.map(sub => 
        sub.id === submission.id ? updatedSubmission : sub
      );

      setSubmissions(updatedSubmissions);
      
      // Switch to evaluated tab with not_published section
      setActiveTab('evaluated');
      setEvaluatedTab('notPublished');
      
      toast.success('Evaluation completed! You can now edit or publish the evaluation.');
    } catch (error) {
      console.error('Error in evaluation:', error);
      toast.error('Evaluation failed: ' + error.message);
    }
  };

  const handleImageClick = (imageUrl, e) => {
    // Only show popup if the click wasn't on the delete button
    if (!e.target.closest('button')) {
    setSelectedImage(imageUrl);
    }
  };

  const closeImagePopup = () => {
    setSelectedImage(null);
  };

  const handleAddMoreImages = (submission) => {
    setSelectedSubmission(submission);
    setShowUploadModal(true);
  };

  const handleSubmissionComplete = (updatedSubmission) => {
    // Get existing submissions from localStorage
    const existingSubmissions = JSON.parse(localStorage.getItem(`submissions_${questionId}`) || '[]');
    
    // Update the submissions list with the new images
    const updatedSubmissions = existingSubmissions.map(sub => 
      sub.id === selectedSubmission.id 
        ? { 
            ...sub, 
            answerImages: [...sub.answerImages, ...updatedSubmission.answerImages]
          }
        : sub
    );
    
    // Save to localStorage first
    localStorage.setItem(`submissions_${questionId}`, JSON.stringify(updatedSubmissions));
    
    // Then update state
    setSubmissions(updatedSubmissions);
    
    // If in auto mode, automatically evaluate and publish
    if (evaluationMode === 'auto') {
      handleAutoEvaluation(updatedSubmission);
    }
    
    toast.success('Additional images uploaded successfully!');
  };

  const handleCreateNewSubmission = (newSubmission) => {
    // Generate a unique ID for the new submission
    const submissionId = `local_${Date.now()}`;
    
    // Create a new submission object
    const submission = {
      id: submissionId,
      studentName: userData?.name || 'Current User',
      submittedAt: new Date().toISOString(),
      status: 'submitted',
      answerImages: newSubmission.answerImages || []
    };
    
    // Get existing submissions from localStorage
    const existingSubmissions = JSON.parse(localStorage.getItem(`submissions_${questionId}`) || '[]');
    
    // Add the new submission to the list
    const updatedSubmissions = [...existingSubmissions, submission];
    
    // Save to localStorage first
    localStorage.setItem(`submissions_${questionId}`, JSON.stringify(updatedSubmissions));
    
    // Then update state
    setSubmissions(updatedSubmissions);
    
    // If in auto mode, automatically evaluate and publish
    if (evaluationMode === 'auto') {
      handleAutoEvaluation(submission);
    }
    
    toast.success('New submission created successfully!');
    
    // Switch to the submitted tab
    setActiveTab('submitted');
  };

  const handlePublishToStudent = (submission) => {
    // Update the submission status to published
    try {
      const token = Cookies.get('usertoken');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      fetch(`https://aipbbackend.onrender.com/api/clients/CLI677117YN7N/mobile/userAnswers/crud/answers/${submission.id}/publish`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // Update the local state
    const updatedSubmissions = submissions.map(sub => 
      sub.id === submission.id 
        ? { ...sub, isPublished: true, publishedAt: new Date().toISOString() }
        : sub
    );
    
    setSubmissions(updatedSubmissions);
          toast.success('Published to student successfully!');
        } else {
          toast.error(data.message || 'Failed to publish answer');
        }
      })
      .catch(error => {
        console.error('Error publishing answer:', error);
        toast.error('Failed to publish answer');
        
        // Fallback to local storage for backward compatibility
        const updatedSubmissions = submissions.map(sub => 
          sub.id === submission.id 
            ? { ...sub, isPublished: true, publishedAt: new Date().toISOString() }
            : sub
        );
        
        setSubmissions(updatedSubmissions);
    localStorage.setItem(`submissions_${questionId}`, JSON.stringify(updatedSubmissions));
        toast.success('Published to student successfully! (Local only)');
      });
    } catch (error) {
      console.error('Error publishing answer:', error);
      toast.error('Failed to publish answer');
      
      // Fallback to local storage for backward compatibility
      const updatedSubmissions = submissions.map(sub => 
        sub.id === submission.id 
          ? { ...sub, isPublished: true, publishedAt: new Date().toISOString() }
          : sub
      );
      
      setSubmissions(updatedSubmissions);
      localStorage.setItem(`submissions_${questionId}`, JSON.stringify(updatedSubmissions));
      toast.success('Published to student successfully! (Local only)');
    }
  };

  const handleDeleteImage = (submission, imageIndex) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      const updatedSubmissions = submissions.map(sub => {
        if (sub.id === submission.id) {
          const updatedImages = [...sub.answerImages];
          updatedImages.splice(imageIndex, 1);
          return { ...sub, answerImages: updatedImages };
        }
        return sub;
      }).filter(sub => {
        // Remove submission if it has no images left
        if (sub.id === submission.id && sub.answerImages.length === 0) {
          return false;
        }
        return true;
      });
      
      setSubmissions(updatedSubmissions);
      localStorage.setItem(`submissions_${questionId}`, JSON.stringify(updatedSubmissions));
      
      if (submission.answerImages.length === 1) {
        toast.success('Submission removed successfully!');
      } else {
        toast.success('Image deleted successfully!');
      }
    }
  };

  const handleEvaluationModeChange = (mode) => {
    setEvaluationMode(mode);
    localStorage.setItem(`evaluation_mode_${questionId}`, mode);
    toast.success(`Evaluation mode set to ${mode}`);
    setShowEvaluationModeModal(false);
  };

  const handleAutoEvaluation = async (submission) => {
    try {
      setIsAutoEvaluating(true);
      setEvaluationProgress(0);

      const token = Cookies.get('usertoken');
      if (!token) {
        throw new Error('Authentication required');
      }

      console.log('=== AUTO EVALUATION START ===');
      console.log('Submission:', submission);

      // Call backend API for auto-evaluation
      const response = await fetch(`https://aipbbackend.onrender.com/api/clients/CLI677117YN7N/mobile/userAnswers/answers/${submission.id}/evaluate-auto`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'mobileusertoken': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          evaluationPrompt: submission.evaluationPrompt,
          includeExtractedText: true,
          includeQuestionDetails: true,
          maxMarks: question.metadata.maximumMarks || 10
        })
      });

      const data = await response.json();
      console.log('Auto Evaluation Response:', data);

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to auto-evaluate answer');
      }

      // Update the submission with evaluation results
      const updatedSubmission = {
        ...submission,
        status: 'evaluated',
        isPublished: true,
        publishedAt: new Date().toISOString(),
        marks: data.data.evaluation.marks,
        feedback: data.data.evaluation.feedback,
        geminiAnalysis: {
          accuracy: data.data.evaluation.accuracy,
          strengths: data.data.evaluation.strengths,
          weaknesses: data.data.evaluation.weaknesses,
          suggestions: data.data.evaluation.suggestions
        },
        extractedTexts: data.data.extractedTexts || [],
        lastUpdated: new Date().toISOString(),
        evaluation: data.data.evaluation
      };

      // Update the submissions array
      const updatedSubmissions = submissions.map(sub => 
        sub.id === submission.id ? updatedSubmission : sub
      );

      // Update state
      setSubmissions(updatedSubmissions);
      
      // Switch to evaluated tab and show published submissions
      setActiveTab('evaluated');
      setEvaluatedTab('published');
      
      setIsAutoEvaluating(false);
      toast.success('Answer automatically evaluated and published!');
    } catch (error) {
      console.error('Error in auto-evaluation:', error);
      setIsAutoEvaluating(false);
      toast.error('Auto-evaluation failed: ' + error.message);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const EvaluationModeModal = ({ isOpen, onClose, currentMode }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Evaluation Mode</h3>
          <p className="text-gray-600 mb-4">
            Choose how answers for this question should be evaluated:
          </p>
          
          <div className="space-y-4">
            <button
              onClick={() => handleEvaluationModeChange('manual')}
              className={`w-full p-4 rounded-lg border-2 ${
                currentMode === 'manual'
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-indigo-300'
              }`}
            >
              <div className="flex items-center">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800">Manual Mode</h4>
                  <p className="text-sm text-gray-600">
                    Evaluate answers manually and publish when ready
                  </p>
                </div>
                {currentMode === 'manual' && (
                  <CheckCircle className="text-indigo-500" size={20} />
                )}
              </div>
            </button>

            <button
              onClick={() => handleEvaluationModeChange('auto')}
              className={`w-full p-4 rounded-lg border-2 ${
                currentMode === 'auto'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-green-300'
              }`}
            >
              <div className="flex items-center">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800">Auto Mode</h4>
                  <p className="text-sm text-gray-600">
                    Automatically evaluate and publish answers
                  </p>
                </div>
                {currentMode === 'auto' && (
                  <CheckCircle className="text-green-500" size={20} />
                )}
              </div>
            </button>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Add this new component for auto-evaluation progress
  const AutoEvaluationProgress = () => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Auto-Evaluating Answer</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Processing Images...</span>
                <span>{evaluationProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${evaluationProgress}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Extracting Text...</span>
                <span>{evaluationProgress >= 30 ? '100%' : '0%'}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: evaluationProgress >= 30 ? '100%' : '0%' }}
                ></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Analyzing Content...</span>
                <span>{evaluationProgress >= 60 ? '100%' : '0%'}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: evaluationProgress >= 60 ? '100%' : '0%' }}
                ></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Publishing Results...</span>
                <span>{evaluationProgress >= 90 ? '100%' : '0%'}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: evaluationProgress >= 90 ? '100%' : '0%' }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Add function to mark as popular
  const handleMarkAsPopular = async (submission) => {
    try {
      const token = Cookies.get('usertoken');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      // Only allow marking published answers as popular
      if (!submission.isPublished) {
        toast.error('Only published answers can be marked as popular');
        return;
      }

      const newPopularityStatus = submission.popularityStatus === 'popular' ? 'not_popular' : 'popular';
      
      console.log('Updating popularity status:', {
        submissionId: submission.id,
        currentStatus: submission.popularityStatus,
        newStatus: newPopularityStatus,
        currentEvaluation: submission.evaluation
      });

      // First update the popularity status
      const response = await fetch(`https://aipbbackend.onrender.com/api/clients/CLI677117YN7N/mobile/userAnswers/crud/answers/${submission.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          popularityStatus: newPopularityStatus,
          evaluation: {
            marks: submission.marks,
            feedback: submission.feedback,
            accuracy: submission.geminiAnalysis?.accuracy || 0,
            strengths: submission.geminiAnalysis?.strengths || [],
            weaknesses: submission.geminiAnalysis?.weaknesses || [],
            suggestions: submission.geminiAnalysis?.suggestions || []
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Popularity status update response:', data);
      
      if (data.success) {
        // After updating popularity status, fetch the complete answer details
        const detailsResponse = await fetch(`https://aipbbackend.onrender.com/api/clients/CLI677117YN7N/mobile/userAnswers/crud/answers/${submission.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!detailsResponse.ok) {
          throw new Error(`HTTP error! status: ${detailsResponse.status}`);
        }

        const detailsData = await detailsResponse.json();
        console.log('Answer details after popularity update:', detailsData);
        
        if (detailsData.success) {
          const updatedAnswer = detailsData.data.answer;
          
          // Update the local state with complete details
          const updatedSubmissions = submissions.map(sub => 
            sub.id === submission.id 
              ? {
                  ...sub,
                  popularityStatus: newPopularityStatus,
                  marks: updatedAnswer.evaluation?.marks || sub.marks,
                  feedback: updatedAnswer.evaluation?.feedback || sub.feedback,
                  geminiAnalysis: {
                    accuracy: updatedAnswer.evaluation?.accuracy || sub.geminiAnalysis?.accuracy || 0,
                    strengths: updatedAnswer.evaluation?.strengths || sub.geminiAnalysis?.strengths || [],
                    weaknesses: updatedAnswer.evaluation?.weaknesses || sub.geminiAnalysis?.weaknesses || [],
                    suggestions: updatedAnswer.evaluation?.suggestions || sub.geminiAnalysis?.suggestions || []
                  },
                  extractedTexts: updatedAnswer.extractedTexts || sub.extractedTexts || [],
                  lastUpdated: updatedAnswer.updatedAt || sub.lastUpdated
                }
              : sub
          );

          // If we're unmarking as popular, remove it from the current view if we're on the popular tab
          if (newPopularityStatus === 'not_popular' && activeTab === 'popular') {
            setSubmissions(updatedSubmissions.filter(sub => sub.id !== submission.id));
          } else {
            setSubmissions(updatedSubmissions);
          }
          
          toast.success(newPopularityStatus === 'popular' 
            ? 'Marked as popular answer' 
            : 'Removed from popular answers');
        } else {
          throw new Error(detailsData.message || 'Failed to fetch updated answer details');
        }
      } else {
        toast.error(data.message || 'Failed to update popularity status');
      }
    } catch (error) {
      console.error('Error updating popularity status:', error);
      toast.error('Failed to update popularity status: ' + error.message);
    }
  };
  
  // Add function to reject submission
  const handleRejectSubmission = async (submission) => {
    if (!window.confirm('Are you sure you want to reject this submission?')) {
      return;
    }
    
    try {
      const token = Cookies.get('usertoken');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(`https://aipbbackend.onrender.com/api/clients/CLI677117YN7N/mobile/userAnswers/crud/answers/${submission.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          submissionStatus: 'rejected'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Update the local state
        const updatedSubmissions = submissions.map(sub => 
          sub.id === submission.id 
            ? { ...sub, status: 'rejected' }
            : sub
        );
        
        setSubmissions(updatedSubmissions);
        toast.success('Submission rejected successfully');
      } else {
        toast.error(data.message || 'Failed to reject submission');
      }
    } catch (error) {
      console.error('Error rejecting submission:', error);
      toast.error('Failed to reject submission');
    }
  };

  // Add function to update evaluation
  const handleUpdateEvaluation = async (submissionId, evaluationData, shouldPublish = false) => {
    try {
      const token = Cookies.get('usertoken');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(`https://aipbbackend.onrender.com/api/clients/CLI677117YN7N/mobile/userAnswers/crud/answers/${submissionId}/evaluate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          evaluation: evaluationData,
          publish: shouldPublish
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Update the local state
        const updatedSubmissions = submissions.map(sub => 
          sub.id === submissionId 
            ? { 
                ...sub, 
                marks: evaluationData.marks,
                feedback: evaluationData.feedback,
                geminiAnalysis: {
                  accuracy: evaluationData.accuracy,
                  strengths: evaluationData.strengths,
                  weaknesses: evaluationData.weaknesses,
                  suggestions: evaluationData.suggestions
                },
                isPublished: shouldPublish,
                status: 'evaluated'
              }
            : sub
        );
        
        setSubmissions(updatedSubmissions);
        setEditingEvaluation(null);
        
        toast.success(shouldPublish 
          ? 'Evaluation updated and published successfully' 
          : 'Evaluation updated successfully');
      } else {
        toast.error(data.message || 'Failed to update evaluation');
      }
    } catch (error) {
      console.error('Error updating evaluation:', error);
      toast.error('Failed to update evaluation');
    }
  };
  
  // Add component for editing evaluation
  const EditEvaluationForm = ({ submission, onCancel, onSave, onPublish }) => {
    const [evaluation, setEvaluation] = useState({
      accuracy: submission.geminiAnalysis?.accuracy || 0,
      marks: submission.marks || 0,
      strengths: submission.geminiAnalysis?.strengths || [],
      weaknesses: submission.geminiAnalysis?.weaknesses || [],
      suggestions: submission.geminiAnalysis?.suggestions || [],
      feedback: submission.feedback || ''
    });
    
    const handleInputChange = (field, value) => {
      setEvaluation({
        ...evaluation,
        [field]: value
      });
    };
    
    const handleArrayItemChange = (field, index, value) => {
      const newArray = [...evaluation[field]];
      newArray[index] = value;
      setEvaluation({
        ...evaluation,
        [field]: newArray
      });
    };
    
    const handleAddArrayItem = (field) => {
      setEvaluation({
        ...evaluation,
        [field]: [...evaluation[field], '']
      });
    };
    
    const handleRemoveArrayItem = (field, index) => {
      const newArray = [...evaluation[field]];
      newArray.splice(index, 1);
      setEvaluation({
        ...evaluation,
        [field]: newArray
      });
    };
    
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Edit Evaluation</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Accuracy (0-100)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={evaluation.accuracy}
              onChange={(e) => handleInputChange('accuracy', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Marks
            </label>
            <input
              type="number"
              min="0"
              value={evaluation.marks}
              onChange={(e) => handleInputChange('marks', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Feedback
            </label>
            <textarea
              value={evaluation.feedback}
              onChange={(e) => handleInputChange('feedback', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows="3"
            />
          </div>
          
          {/* Strengths */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Strengths
              </label>
              <button
                type="button"
                onClick={() => handleAddArrayItem('strengths')}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                + Add
              </button>
            </div>
            {evaluation.strengths.map((item, index) => (
              <div key={index} className="flex items-center mb-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleArrayItemChange('strengths', index, e.target.value)}
                  className="flex-grow px-3 py-2 border border-gray-300 rounded-md"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveArrayItem('strengths', index)}
                  className="ml-2 text-red-600 hover:text-red-800"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
          
          {/* Weaknesses */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Weaknesses
              </label>
              <button
                type="button"
                onClick={() => handleAddArrayItem('weaknesses')}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                + Add
              </button>
            </div>
            {evaluation.weaknesses.map((item, index) => (
              <div key={index} className="flex items-center mb-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleArrayItemChange('weaknesses', index, e.target.value)}
                  className="flex-grow px-3 py-2 border border-gray-300 rounded-md"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveArrayItem('weaknesses', index)}
                  className="ml-2 text-red-600 hover:text-red-800"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
          
          {/* Suggestions */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Suggestions
              </label>
              <button
                type="button"
                onClick={() => handleAddArrayItem('suggestions')}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                + Add
              </button>
            </div>
            {evaluation.suggestions.map((item, index) => (
              <div key={index} className="flex items-center mb-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleArrayItemChange('suggestions', index, e.target.value)}
                  className="flex-grow px-3 py-2 border border-gray-300 rounded-md"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveArrayItem('suggestions', index)}
                  className="ml-2 text-red-600 hover:text-red-800"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onSave(evaluation)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => onPublish(evaluation)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Save & Publish
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Add pagination controls
  const PaginationControls = () => {
    return (
      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-gray-600">
          Showing {submissions.length} of {pagination.totalCount} results
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }));
              fetchSubmissions();
            }}
            disabled={!pagination.hasPrevPage}
            className={`px-3 py-1 rounded-md ${
              pagination.hasPrevPage
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            Previous
          </button>
          <span className="px-3 py-1 text-gray-600">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button
            onClick={() => {
              setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }));
              fetchSubmissions();
            }}
            disabled={!pagination.hasNextPage}
            className={`px-3 py-1 rounded-md ${
              pagination.hasNextPage
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error</h3>
          <p className="text-red-700">{error}</p>
          <button 
            onClick={handleBackClick}
            className="mt-4 text-indigo-600 hover:text-indigo-800 flex items-center"
          >
            <ArrowLeft size={16} className="mr-1" />
            <span>Go back</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="flex items-center mb-4">
        <button 
          onClick={handleBackClick}
          className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          <ArrowLeft size={18} className="mr-1" />
          <span>Back to Questions</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Assessment Dashboard</h1>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-xl font-semibold text-gray-800">Question</h2>
          </div>
          <p className="text-gray-800">{question?.question}</p>
          
          <div className="mt-4">
            <button
              onClick={() => setShowMetadata(!showMetadata)}
              className="w-full flex items-center justify-between p-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
            >
              <span className="text-indigo-700 font-medium">Question Metadata</span>
              {showMetadata ? <ChevronUp className="text-indigo-700" /> : <ChevronDown className="text-indigo-700" />}
            </button>

            {showMetadata && (
              <div className="mt-3 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(question?.metadata || {}).map(([key, value]) => {
                    if (value == null) return null;

                    const displayKey = key
                      .replace(/([A-Z])/g, ' $1')
                      .replace(/^./, str => str.toUpperCase())
                      .replace(/([a-z])([A-Z])/g, '$1 $2');

                    if (key === 'qualityParameters') {
                      return (
                        <div key={key} className="col-span-full">
                          <div className="bg-purple-50 p-4 rounded-lg">
                            <h3 className="text-purple-800 font-medium mb-3">Quality Parameters</h3>
                            <div className="space-y-3">
                              {Object.entries(value).map(([param, paramValue]) => {
                                if (param === 'body' && typeof paramValue === 'object') {
                                  return (
                                    <div key={param} className="bg-white p-3 rounded-lg border border-purple-100">
                                      <span className="text-purple-700 font-medium">Body Parameters:</span>
                                      <ul className="mt-2 space-y-1">
                                        {Object.entries(paramValue).forEach(([bodyParam, bodyValue]) => (
                                          <li key={bodyParam} className="text-purple-800 text-sm">
                                            • {bodyParam}: {bodyValue}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  );
                                } else if (param === 'customParams' && paramValue) {
                                  return (
                                    <div key={param} className="bg-white p-3 rounded-lg border border-purple-100">
                                      <span className="text-purple-700 font-medium">Custom Parameters:</span>
                                      <ul className="mt-2 space-y-1">
                                        {Object.entries(paramValue).forEach(([customParam, customValue]) => (
                                          <li key={customParam} className="text-purple-800 text-sm">
                                            • {customParam}: {customValue}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  );
                                } else {
                                  return (
                                    <div key={param} className="bg-white p-3 rounded-lg border border-purple-100">
                                      <span className="text-purple-800 text-sm">{param}: {paramValue}</span>
                                    </div>
                                  );
                                }
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    let displayValue = value;
                    if (typeof value === 'object') {
                      displayValue = JSON.stringify(value);
                    } else if (key === 'wordLimit') {
                      displayValue = `${value} words`;
                    } else if (key === 'maximumMarks') {
                      displayValue = `${value} marks`;
                    }

                    return (
                      <div key={key} className="bg-blue-50 p-3 rounded-lg">
                        <span className="text-blue-700 text-sm font-medium">{displayKey}</span>
                        <p className="text-blue-800 mt-1">{displayValue}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => handleTabChange('submitted')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'submitted'
                    ? 'border-b-2 border-indigo-500 text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <Clock size={16} className="mr-2" />
                  <span>Submitted</span>
                </div>
              </button>
              <button
                onClick={() => handleTabChange('evaluated')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'evaluated'
                    ? 'border-b-2 border-green-500 text-green-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <CheckCircle size={16} className="mr-2" />
                  <span>Evaluated</span>
                </div>
              </button>
              <button
                onClick={() => handleTabChange('aiEvaluated')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'aiEvaluated'
                    ? 'border-b-2 border-purple-500 text-purple-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <Wand2 size={16} className="mr-2" />
                  <span>AI Evaluated</span>
                </div>
              </button>
              <button
                onClick={() => handleTabChange('review')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'review'
                    ? 'border-b-2 border-yellow-500 text-yellow-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <AlertTriangle size={16} className="mr-2" />
                  <span>Review</span>
                </div>
              </button>
              <button
                onClick={() => handleTabChange('rejected')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'rejected'
                    ? 'border-b-2 border-red-500 text-red-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <XCircle size={16} className="mr-2" />
                  <span>Rejected</span>
                </div>
              </button>
              <button
                onClick={() => handleTabChange('popular')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'popular'
                    ? 'border-b-2 border-pink-500 text-pink-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  </svg>
                  <span>Popular</span>
                </div>
              </button>
            </nav>
          </div>
          
          {activeTab === 'evaluated' && (
            <div className="mt-4 border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setEvaluatedTab('notPublished')}
                  className={`py-2 px-4 text-sm font-medium ${
                    evaluatedTab === 'notPublished'
                      ? 'border-b-2 border-yellow-500 text-yellow-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Not Published
                </button>
                <button
                  onClick={() => setEvaluatedTab('published')}
                  className={`py-2 px-4 text-sm font-medium ${
                    evaluatedTab === 'published'
                      ? 'border-b-2 border-green-500 text-green-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Published
                </button>
              </nav>
            </div>
          )}

          {activeTab === 'aiEvaluated' && (
            <div className="mt-4 border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setAiEvaluatedTab('private')}
                  className={`py-2 px-4 text-sm font-medium ${
                    aiEvaluatedTab === 'private'
                      ? 'border-b-2 border-purple-500 text-purple-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Private
                </button>
                <button
                  onClick={() => setAiEvaluatedTab('public')}
                  className={`py-2 px-4 text-sm font-medium ${
                    aiEvaluatedTab === 'public'
                      ? 'border-b-2 border-purple-500 text-purple-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Public
                </button>
              </nav>
            </div>
          )}
        </div>
        
        <div>
          {submissions.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No {activeTab} submissions found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <div key={submission.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-medium text-gray-800">{submission.studentName}</h3>
                      <p className="text-sm text-gray-500">Submitted: {formatDate(submission.submittedAt)}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {activeTab === 'submitted' && (
                        <>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            Pending Evaluation
                          </span>
                          
                          <button
                            onClick={() => handleEvaluate(submission)}
                            className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm flex items-center"
                            title="Evaluate"
                          >
                            <Wand2 size={14} className="mr-1" />
                            <span>Evaluate</span>
                          </button>
                          
                          <button
                            onClick={() => handleRejectSubmission(submission)}
                            className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm flex items-center"
                            title="Reject"
                          >
                            <Trash size={14} className="mr-1" />
                            <span>Reject</span>
                          </button>
                        </>
                      )}
                      
                      {activeTab === 'evaluated' && (
                        <>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Evaluated
                        </span>
                          
                          {evaluatedTab === 'notPublished' && (
                            <button
                              onClick={() => setEditingEvaluation(submission)}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full"
                              title="Edit Evaluation"
                            >
                              <Edit size={16} />
                            </button>
                          )}
                        </>
                      )}
                      
                      {activeTab === 'review' && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                          Under Review
                        </span>
                      )}
                      
                      {activeTab === 'rejected' && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                          Rejected
                        </span>
                      )}
                      
                      {/* Heart button for marking as popular */}
                      {(activeTab === 'evaluated' && evaluatedTab === 'published') && (
                        <button
                          onClick={() => handleMarkAsPopular(submission)}
                          className={`p-2 ${
                            submission.popularityStatus === 'popular'
                              ? 'text-pink-600 hover:bg-pink-50'
                              : 'text-gray-400 hover:bg-gray-50'
                          } rounded-full transition-colors`}
                          title={submission.popularityStatus === 'popular' ? 'Remove from Popular' : 'Mark as Popular'}
                        >
                          <Heart size={16} fill={submission.popularityStatus === 'popular' ? 'currentColor' : 'none'} />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium text-gray-700">Student Answer Images</h4>
                    </div>
                    {/* Image Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {(submission.answerImages || []).map((imageUrl, index) => (
                        <div 
                          key={index} 
                          className="relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden group"
                        >
                          <div 
                            className="w-full h-full cursor-pointer"
                            onClick={(e) => handleImageClick(imageUrl, e)}
                        >
                          <img
                            src={imageUrl}
                            alt={`Answer image ${index + 1}`}
                              className="w-full h-full object-contain"
                          />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          </div>
                          {activeTab === 'submitted' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteImage(submission, index);
                              }}
                              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Add evaluation details section for popular tab */}
                  {(activeTab === 'popular' || (activeTab === 'evaluated' && evaluatedTab === 'published')) && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-green-50 p-4 rounded-lg">
                          <h4 className="text-sm font-medium text-green-700 mb-2">Marks Awarded</h4>
                          <p className="text-green-800 font-medium">{submission.marks} / {question.metadata.maximumMarks}</p>
                          </div>
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h4 className="text-sm font-medium text-blue-700 mb-2">Feedback</h4>
                          <p className="text-blue-800">{submission.feedback || 'No feedback provided'}</p>
                      </div>
                    </div>
                  
                  {submission.geminiAnalysis && (
                    <div className="bg-purple-50 p-4 rounded-lg mb-4">
                      <h4 className="text-sm font-medium text-purple-700 mb-2">Analysis</h4>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm font-medium text-purple-700">Accuracy:</span>
                          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                            <div
                              className="bg-purple-600 h-2.5 rounded-full"
                              style={{ width: `${submission.geminiAnalysis.accuracy || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-purple-700">{submission.geminiAnalysis.accuracy || 0}%</span>
                        </div>
                        
                        <div>
                          <span className="text-sm font-medium text-purple-700">Strengths:</span>
                          <ul className="list-disc list-inside text-sm text-purple-800 mt-1">
                            {(submission.geminiAnalysis.strengths || []).map((strength, index) => (
                              <li key={index}>{strength}</li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <span className="text-sm font-medium text-purple-700">Areas for Improvement:</span>
                          <ul className="list-disc list-inside text-sm text-purple-800 mt-1">
                            {(submission.geminiAnalysis.weaknesses || []).map((weakness, index) => (
                              <li key={index}>{weakness}</li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <span className="text-sm font-medium text-purple-700">Suggestions:</span>
                          <ul className="list-disc list-inside text-sm text-purple-800 mt-1">
                            {(submission.geminiAnalysis.suggestions || []).map((suggestion, index) => (
                              <li key={index}>{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                  
                      {submission.extractedTexts && submission.extractedTexts.length > 0 && (
                        <div className="bg-purple-50 p-4 rounded-lg mb-4">
                          <h4 className="text-sm font-medium text-purple-700 mb-2">Extracted Text from Answer Images</h4>
                          <div className="space-y-3">
                            {(submission.extractedTexts || []).map((text, index) => (
                              <div key={index} className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                                <h6 className="text-xs font-medium text-purple-700 mb-1">Image {index + 1}:</h6>
                                <p className="text-sm text-purple-900 whitespace-pre-wrap">{text}</p>
                      </div>
                            ))}
                      </div>
                    </div>
                      )}
                    </>
                  )}
                  
                  {/* Edit evaluation form */}
                  {editingEvaluation && editingEvaluation.id === submission.id && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <EditEvaluationForm 
                          submission={submission}
                          onCancel={() => setEditingEvaluation(null)}
                          onSave={(evaluationData) => handleUpdateEvaluation(submission.id, evaluationData)}
                          onPublish={(evaluationData) => handleUpdateEvaluation(submission.id, evaluationData, true)}
                        />
                          </div>
                        </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Image Popup */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={closeImagePopup}>
          <div className="relative max-w-4xl w-full max-h-[90vh] bg-white rounded-lg overflow-hidden" onClick={e => e.stopPropagation()}>
            <button
              onClick={closeImagePopup}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition-opacity z-10"
            >
              <X size={24} />
            </button>
            <div className="w-full h-full flex items-center justify-center p-4">
            <img
              src={selectedImage}
              alt="Full size answer"
                className="max-w-full max-h-[80vh] object-contain"
            />
            </div>
          </div>
        </div>
      )}

      <EvaluationModeModal
        isOpen={showEvaluationModeModal}
        onClose={() => setShowEvaluationModeModal(false)}
        currentMode={evaluationMode}
      />

      {/* Add the auto-evaluation progress modal */}
      {isAutoEvaluating && (
        <AutoEvaluationProgress />
      )}

      {/* Add the PaginationControls component to the UI */}
      {submissions.length > 0 && (
        <>
          <PaginationControls />
        </>
      )}
    </div>
  );
};

export default AssessmentDashboard; 