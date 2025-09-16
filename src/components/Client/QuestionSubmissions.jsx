import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { FaArrowLeft, FaChevronDown, FaChevronUp } from 'react-icons/fa';

// Import tab components
import SubmittedSubmissions from './QuestionSubmissions/SubmittedSubmissions';
import EvaluatedSubmissions from './QuestionSubmissions/EvaluatedSubmissions';
import ReviewSubmissions from './QuestionSubmissions/ReviewSubmissions';
import RejectedSubmissions from './QuestionSubmissions/RejectedSubmissions';
import PopularSubmissions from './QuestionSubmissions/PopularSubmissions';

const QuestionSubmissions = () => {
  const { topicId, setId, questionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMetadataExpanded, setIsMetadataExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('submitted');
  const [pdfModal, setPdfModal] = useState({ open: false, url: null, name: '' });

  useEffect(() => {
    console.log('QuestionSubmissions mounted with params:', { topicId, setId, questionId });
    console.log('Location state:', location.state);

    const initializeQuestion = async () => {
      try {
        // First try to use the state passed through navigation
        if (location.state?.question) {
          console.log('Using question from navigation state:', location.state.question);
          setQuestion(location.state.question);
          setLoading(false);
          return;
        }

        // If no state, fetch from API
        await fetchQuestionDetails();
      } catch (error) {
        console.error('Error initializing question:', error);
        setError('Failed to load question details');
        setLoading(false);
      }
    };

    initializeQuestion();
  }, [topicId, setId, questionId, location.state]);

  const fetchQuestionDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Fetching question details for:', { topicId, setId, questionId });
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/questions/${questionId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      console.log('API Response:', response.data);
      
      if (response.data.success && response.data.question) {
        const questionData = response.data.question;
        console.log('Setting question data:', questionData);
        setQuestion(questionData);
      } else {
        throw new Error(response.data.message || 'Failed to fetch question details');
      }
    } catch (error) {
      console.error('Error fetching question details:', error);
      setError(error.message || 'Failed to fetch question details');
      toast.error(error.message || 'Failed to fetch question details');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'submitted':
        return <SubmittedSubmissions questionId={questionId} />;
      case 'evaluated':
        return <EvaluatedSubmissions questionId={questionId} />;
      case 'review':
        return <ReviewSubmissions questionId={questionId} />;
      case 'rejected':
        return <RejectedSubmissions questionId={questionId} />;
      case 'popular':
        return <PopularSubmissions questionId={questionId} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-red-600 mb-4">{error}</div>
            <button
              onClick={handleBack}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <FaArrowLeft className="mr-2" />
              Back to Questions
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-600 mb-4">No question data available</div>
            <button
              onClick={handleBack}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <FaArrowLeft className="mr-2" />
              Back to Questions
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <FaArrowLeft className="mr-2" />
            Back to Questions
          </button>
        </div>

        {/* Question Details Section */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Question Details
            </h1>

            <div className="space-y-6">
              {/* Question Content */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Question</h2>
                <div className="prose max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: question.content || question.question }} />
                </div>
              </div>

              {/* Question Metadata - Collapsible */}
              <div className="bg-white rounded-lg border border-gray-200">
                <button
                  onClick={() => setIsMetadataExpanded(!isMetadataExpanded)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50"
                >
                  <h2 className="text-lg font-semibold text-gray-900">Question Metadata</h2>
                  {isMetadataExpanded ? (
                    <FaChevronUp className="text-gray-500" />
                  ) : (
                    <FaChevronDown className="text-gray-500" />
                  )}
                </button>
                {isMetadataExpanded && (
                  <div className="px-6 pb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Difficulty Level</p>
                        <p className="font-medium">{question.metadata?.difficultyLevel || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Marks</p>
                        <p className="font-medium">{question.metadata?.marks || question.metadata?.maximumMarks || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Time Limit</p>
                        <p className="font-medium">{question.metadata?.timeLimit || question.metadata?.estimatedTime || 'N/A'} minutes</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Word Limit</p>
                        <p className="font-medium">{question.metadata?.wordLimit || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Language Mode</p>
                        <p className="font-medium">
                          {question.languageMode === 'english' ? 'English' : 
                           question.languageMode === 'hindi' ? 'Hindi' : 
                           'Both (English & Hindi)'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Model Answer PDFs */}
              {Array.isArray(question.modalAnswerPdfs) && question.modalAnswerPdfs.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Model Answer PDFs</h2>
                  <div className="space-y-2">
                    {question.modalAnswerPdfs.map((pdf, idx) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded border border-gray-200 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-700 font-medium">{pdf.fileName || `Document ${idx + 1}`}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {pdf.url ? (
                            <>
                              <a
                                href={pdf.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                              >
                                View
                              </a>
                              <button
                                onClick={() => setPdfModal({ open: true, url: pdf.url, name: pdf.fileName || `Document ${idx + 1}` })}
                                className="px-3 py-1 text-sm bg-gray-700 text-white rounded hover:bg-gray-800"
                              >
                                Preview
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-red-600">Unavailable</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {['submitted', 'evaluated', 'review', 'rejected', 'popular'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 text-sm font-medium ${
                    activeTab === tab
                      ? 'border-b-2 border-indigo-500 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {renderTabContent()}
        </div>
      </div>
    
    {pdfModal.open && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl h-[80vh] flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-800 truncate pr-4">{pdfModal.name}</h3>
            <button
              onClick={() => setPdfModal({ open: false, url: null, name: '' })}
              className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Close
            </button>
          </div>
          <div className="flex-1">
            {pdfModal.url ? (
              <iframe
                title="Model Answer PDF Preview"
                src={pdfModal.url}
                className="w-full h-full"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-gray-500">
                PDF not available
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    </div>
  );
};

export default QuestionSubmissions; 