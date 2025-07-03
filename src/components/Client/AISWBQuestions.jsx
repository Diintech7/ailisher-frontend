import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, ChevronRight, Eye, X, QrCode, Download, FileText, Upload } from 'lucide-react';
import { toast } from 'react-toastify';
import AddAISWBModal from './AddAISWBModal';
import GeminiModal from '../GeminiModal';
import ImageUploadModal from './ImageUploadModal';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';

const AISWBQuestions = ({ topicId, selectedSet, onBack }) => {
  const [questions, setQuestions] = useState([]);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [showQuestionDetails, setShowQuestionDetails] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showGeminiModal, setShowGeminiModal] = useState(false);
  const [geminiModalType, setGeminiModalType] = useState(null);
  const [qrFormat, setQrFormat] = useState('json');
  const [qrSize, setQrSize] = useState(300);
  const [includeAnswers, setIncludeAnswers] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (selectedSet && selectedSet.id) {
      console.log('Selected set changed:', selectedSet);
      refreshQuestions();
    } else {
      setQuestions([]);
    }
  }, [selectedSet]);

  const refreshQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = Cookies.get('usertoken');
      if (!token) {
        setError('Authentication required');
        return;
      }

      console.log('Fetching questions for set:', selectedSet.id);
      
      // First, get the question IDs from the set
      const questionIds = selectedSet.questions || [];
      console.log('Question IDs in set:', questionIds);

      if (questionIds.length === 0) {
        setQuestions([]);
        setLoading(false);
        return;
      }

      // Fetch each question's details
      const questionsPromises = questionIds.map(async (questionId) => {
        try {
          const response = await fetch(`http://localhost:5000/api/aiswb/questions/${questionId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const data = await response.json();
          console.log(`Question ${questionId} response:`, data);
          
          // Check if we have valid question data
          if (data.success && data.data && typeof data.data === 'object') {
            return data.data;
          }
          return null;
        } catch (error) {
          console.error(`Error fetching question ${questionId}:`, error);
          return null;
        }
      });

      const questionsData = await Promise.all(questionsPromises);
      console.log('Raw questions data:', questionsData);
      
      // Filter out null values and ensure we have valid question objects
      const validQuestions = questionsData.filter(q => 
        q !== null && 
        typeof q === 'object' && 
        q.metadata && 
        typeof q.metadata === 'object'
      );
      
      console.log('Valid questions:', validQuestions);
      
      if (validQuestions.length > 0) {
        // Format the questions data before setting state
        const formattedQuestions = validQuestions.map(q => {
          // Ensure all required fields exist
          const metadata = q.metadata || {};
          const qualityParameters = metadata.qualityParameters || {
            intro: false,
            body: {
              enabled: false,
              features: false,
              examples: false,
              facts: false,
              diagram: false
            },
            conclusion: false,
            customParams: []
          };

          return {
            ...q,
            metadata: {
              keywords: Array.isArray(metadata.keywords) 
                ? metadata.keywords 
                : (typeof metadata.keywords === 'string' 
                  ? metadata.keywords.split(',').map(k => k.trim()).filter(k => k)
                  : []),
              difficultyLevel: metadata.difficultyLevel || 'level1',
              wordLimit: metadata.wordLimit || 0,
              estimatedTime: metadata.estimatedTime || 0,
              maximumMarks: metadata.maximumMarks || 0,
              qualityParameters: {
                intro: qualityParameters.intro || false,
                body: {
                  enabled: qualityParameters.body?.enabled || false,
                  features: qualityParameters.body?.features || false,
                  examples: qualityParameters.body?.examples || false,
                  facts: qualityParameters.body?.facts || false,
                  diagram: qualityParameters.body?.diagram || false
                },
                conclusion: qualityParameters.conclusion || false,
                customParams: qualityParameters.customParams || []
              }
            }
          };
        });
        
        console.log('Formatted questions:', formattedQuestions);
        setQuestions(formattedQuestions);
      } else {
        console.log('No valid questions found');
        setQuestions([]);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      setError('Failed to connect to the server');
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async (newQuestion) => {
    try {
      console.log('Question being sent from frontend:', newQuestion);
      const token = Cookies.get('usertoken');
      if (!token) {
        toast.error('Authentication required');
        return false;
      }

      console.log('Adding question with data:', newQuestion);
      console.log('API endpoint:', `http://localhost:5000/api/aiswb/topic/${topicId}/sets/${selectedSet.id}/questions`);

      const response = await fetch(`http://localhost:5000/api/aiswb/topic/${topicId}/sets/${selectedSet.id}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newQuestion)
      });

      console.log('API Response status:', response.status);
      const data = await response.json();
      console.log('API Response data:', data);
      
      if (data.success) {
        // Refresh questions after successful addition
        await refreshQuestions();
        return true;
      } else {
        console.error('API Error:', data.message || 'Failed to add question');
        
        // Handle specific error messages
        let errorMessage = data.message || 'Failed to add question';
        
        if (data.message && data.message.includes('YouTube')) {
          errorMessage = 'Invalid YouTube URL format. Please check your video URLs.';
        } else if (data.message && data.message.includes('validation')) {
          errorMessage = 'Please check all required fields and ensure valid data.';
        } else if (data.message && data.message.includes('duplicate')) {
          errorMessage = 'This question already exists.';
        } else if (response.status === 400) {
          errorMessage = 'Invalid data provided. Please check your input.';
        } else if (response.status === 401) {
          errorMessage = 'Authentication failed. Please login again.';
        } else if (response.status === 403) {
          errorMessage = 'You do not have permission to add questions.';
        } else if (response.status === 404) {
          errorMessage = 'Topic or set not found.';
        } else if (response.status === 500) {
          errorMessage = 'Server error occurred. Please try again later.';
        }
        
        toast.error(errorMessage);
        return false;
      }
    } catch (error) {
      console.error('Error adding question:', error);
      
      // Handle network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        toast.error('Network error. Please check your internet connection.');
      } else if (error.message.includes('Failed to fetch')) {
        toast.error('Unable to connect to server. Please try again later.');
      } else {
        toast.error('Failed to connect to the server');
      }
      return false;
    }
  };

  const handleEditQuestion = async (editedQuestion) => {
    try {
      const token = Cookies.get('usertoken');
      if (!token) {
        toast.error('Authentication required');
        return false;
      }

      console.log('Sending update request for question:', editedQuestion.id);
      console.log('Update request data:', editedQuestion);

      const response = await fetch(`http://localhost:5000/api/aiswb/questions/${editedQuestion.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ question: editedQuestion })
      });

      console.log('Update API Response status:', response.status);
      console.log('Update API Response headers:', Object.fromEntries(response.headers.entries()));

      const data = await response.json();
      console.log('Update API Response data:', data);
      console.log('Update API Response success:', data.success);
      console.log('Update API Response message:', data.message);
      
      if (data.success) {
        console.log('Question updated successfully!');
        // Refresh questions after successful edit
        await refreshQuestions();
        return true;
      } else {
        console.error('Update API Error:', data.message || 'Failed to update question');
        console.error('Update API Error details:', data);
        toast.error(data.message || 'Failed to update question');
        return false;
      }
    } catch (error) {
      console.error('Error updating question:', error);
      console.error('Update error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      toast.error('Failed to connect to the server');
      return false;
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        const token = Cookies.get('usertoken');
        if (!token) {
          toast.error('Authentication required');
          return;
        }

        const response = await fetch(`http://localhost:5000/api/aiswb/topic/${topicId}/sets/${selectedSet.id}/questions/${questionId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();
        
        if (data.success) {
          // Refresh questions after successful deletion
          await refreshQuestions();
          toast.success('Question deleted successfully');
        } else {
          toast.error(data.message || 'Failed to delete question');
        }
      } catch (error) {
        console.error('Error deleting question:', error);
        toast.error('Failed to connect to the server');
      }
    }
  };

  const handleViewQuestion = (question) => {
    setSelectedQuestion(question);
    setShowQuestionDetails(true);
  };

  const handleEditClick = (question) => {
    setEditingQuestion(question);
    setShowAddQuestionModal(true);
  };

  const handleQRCodeClick = async (question) => {
    setSelectedQuestion(question);
    setShowQRModal(true);
    await fetchQRCode(question, qrFormat, qrSize, includeAnswers);
  };

  const generateFallbackQRCode = (question, format = qrFormat, size = qrSize, includeAns = includeAnswers) => {
    try {
      // Create a data object with essential question information
      const questionData = {
        id: question.id,
        question: question.question.substring(0, 100), // Limit length for URL
        difficulty: question.metadata.difficultyLevel,
        marks: question.metadata.maximumMarks,
        type: 'aiswb-question',
        timestamp: new Date().toISOString()
      };
      
      // If includeAnswers is true, add answer data
      if (includeAns && question.detailedAnswer) {
        questionData.answer = question.detailedAnswer.substring(0, 100) + '...';
      }
      
      // Create content based on format
      let qrContent;
      let qrText;
      
      if (format === 'text') {
        qrText = `AISWB Question: ${question.question.substring(0, 50)}... (ID: ${question.id})`;
        qrContent = qrText;
      } else if (format === 'url') {
        qrText = `http://localhost:5000/view/questions/${question.id}`;
        qrContent = qrText;
      } else {
        // Default to JSON
        qrText = JSON.stringify(questionData);
        qrContent = qrText;
      }
      
      // Use QRServer API as a fallback to generate QR code
      const qrCodeURL = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(qrContent)}`;
      
      console.log(`Generated fallback QR code (${format}) with size ${size}px`);
      
      // Set QR code data with the fallback URL
      setQrCodeData({
        qrCodeDataURL: qrCodeURL,
        success: true,
        isFallback: true,
        questionData: questionData,
        format: format,
        size: size,
        dataSize: qrContent.length,
        metadata: {
          question: question.question,
          difficultyLevel: question.metadata.difficultyLevel,
          languageMode: question.languageMode || 'english'
        }
      });
      
      // Show warning that this is a fallback QR code
      toast.warning('Using fallback QR code generator. Some features may be limited.');
      
      return true;
    } catch (error) {
      console.error('Error generating fallback QR code:', error);
      return false;
    }
  };

  const fetchQRCode = async (question, format = qrFormat, size = qrSize, includeAns = includeAnswers) => {
    setLoading(true);
    setError(null);
    try {
      const token = Cookies.get('usertoken');
      if (!token) {
        setError('Authentication required');
        return;
      }
      
      // Use the correct API endpoint with query parameters
      const queryParams = new URLSearchParams({
        format,
        size,
        includeAnswers: includeAns
      }).toString();
      
      // Correct API endpoint based on documentation
      const response = await fetch(`http://localhost:5000/api/aiswb/qr/questions/${question.id}/qrcode?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      // Check if response is OK before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text();
        console.error('QR Code API error response:', errorText);
        
        // Try fallback if server fails
        if (generateFallbackQRCode(question, format, size, includeAns)) {
          setLoading(false);
          return;
        }
        
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Check the structure of the response and adapt accordingly
        if (data.data && data.data.qrCode) {
          setQrCodeData({
            qrCodeDataURL: data.data.qrCode,
            success: true,
            format: data.data.format,
            size: data.data.size,
            dataSize: data.data.dataSize,
            metadata: data.data.metadata || {}
          });
        } else {
          // Try fallback if response is missing QR code data
          if (generateFallbackQRCode(question, format, size, includeAns)) {
            return;
          }
          throw new Error('QR code data not found in response');
        }
      } else {
        // Try fallback if server reports failure
        if (generateFallbackQRCode(question, format, size, includeAns)) {
          return;
        }
        setError(data.message || 'Failed to generate QR code');
      }
    } catch (error) {
      console.error('Error fetching QR code:', error);
      
      // If all else fails, try the fallback
      if (!generateFallbackQRCode(question, format, size, includeAns)) {
        setError('Failed to generate QR code. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!qrCodeData?.qrCodeDataURL) return;
    
    try {
      // For fallback QR codes or direct image URLs
      const downloadQRCode = async () => {
        try {
          // Fetch the image as a blob
          const response = await fetch(qrCodeData.qrCodeDataURL);
          const blob = await response.blob();
          
          // Create object URL from blob
          const blobUrl = URL.createObjectURL(blob);
          
          // Create download link
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = `question-${selectedQuestion.id}-qrcode.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Clean up the blob URL
          setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
          
          toast.success('QR code downloaded successfully!');
        } catch (error) {
          console.error('Error downloading QR code:', error);
          toast.error('Failed to download QR code. Please try again.');
        }
      };
      
      downloadQRCode();
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast.error('Failed to download QR code. Please try again.');
    }
  };

  const handleSubmissionsClick = (question) => {
    navigate(`/aiswb/${topicId}/sets/${selectedSet.id}/questions/${question.id}`, {
      state: {
        question: question,
        set: selectedSet
      }
    });
  };

  const handleGenerateAnswer = (type) => {
    setGeminiModalType(type);
    setShowGeminiModal(true);
  };

  const handleGeminiResponse = (response) => {
    if (editingQuestion) {
      const updatedQuestion = {
        ...editingQuestion,
        [geminiModalType === 'detailed' ? 'detailedAnswer' : 'modalAnswer']: response
      };
      handleEditQuestion(updatedQuestion);
    }
  };

  const handleEvaluationModeChange = async (questionId, currentMode) => {
    try {
      const token = Cookies.get('usertoken');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      if (!questionId) {
        toast.error('Question ID is required');
        return;
      }

      const newMode = currentMode === 'manual' ? 'auto' : 'manual';
      
      // Find the question in the current state
      const question = questions.find(q => q.id === questionId);
      if (!question) {
        toast.error('Question not found');
        return;
      }

      // Prepare the request body with all required fields
      const requestBody = {
        question: {
          question: question.question,
          detailedAnswer: question.detailedAnswer,
          modalAnswer: question.modalAnswer,
          evaluationMode: newMode,
          languageMode: question.languageMode,
          metadata: {
            difficultyLevel: question.metadata.difficultyLevel,
            wordLimit: question.metadata.wordLimit,
            estimatedTime: question.metadata.estimatedTime,
            maximumMarks: question.metadata.maximumMarks,
            keywords: question.metadata.keywords,
            qualityParameters: question.metadata.qualityParameters
          }
        }
      };

      // Log the request details
      console.log('Updating evaluation mode:', {
        questionId,
        currentMode,
        newMode,
        requestBody
      });

      const response = await fetch(`http://localhost:5000/api/aiswb/questions/${questionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      // Log the response status
      console.log('Response status:', response.status);

      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.success) {
        // Update the local state
        setQuestions(prevQuestions => 
          prevQuestions.map(q => 
            q.id === questionId 
              ? { ...q, evaluationMode: newMode }
              : q
          )
        );
        toast.success(`Evaluation mode changed to ${newMode}`);
      } else {
        console.error('API Error:', data);
        toast.error(data.message || 'Failed to update evaluation mode');
      }
    } catch (error) {
      console.error('Error updating evaluation mode:', error);
      toast.error('Failed to update evaluation mode');
    }
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
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-medium">Error</h3>
        <p className="text-red-700">{error}</p>
        <button 
          onClick={refreshQuestions}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="flex items-center bg-green-600 px-4 py-2 text-white rounded-md hover:bg-red-700 transition-colors mr-4"
          >
            <ChevronRight size={20} className="transform rotate-180" />
            <span>Back to Sets</span>
          </button>
          <h2 className="text-2xl font-semibold text-gray-800">{selectedSet.name}</h2>
        </div>
        <button
          onClick={() => {
            setEditingQuestion(null);
            setShowAddQuestionModal(true);
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} className="mr-2" />
          <span>Add Question</span>
        </button>
      </div>

      {questions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No questions added yet</p>
          <button
            onClick={() => {
              setEditingQuestion(null);
              setShowAddQuestionModal(true);
            }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Add Your First Question
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((question) => (
            <div
              key={question.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-grow">
                <h3 className="text-lg font-medium text-gray-800">{question.question}</h3>
                <div className="flex items-center mt-2 space-x-4">
                  <span className="text-sm text-gray-600">
                    Difficulty: {question.metadata.difficultyLevel}
                  </span>
                  <span className="text-sm text-gray-600">
                    Word Limit: {question.metadata.wordLimit}
                  </span>
                  <span className="text-sm text-gray-600">
                    Marks: {question.metadata.maximumMarks}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Evaluation:</span>
                    <button
                      onClick={() => {
                        console.log('Question data:', question); // Log the question data
                        handleEvaluationModeChange(question._id || question.id, question.evaluationMode);
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                        question.evaluationMode === 'auto' ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          question.evaluationMode === 'auto' ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className="text-sm font-medium text-gray-700">
                      {question.evaluationMode === 'auto' ? 'Auto' : 'Manual'}
                  </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleViewQuestion(question)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  title="View Details"
                >
                  <Eye size={18} />
                </button>
                <button
                  onClick={() => handleEditClick(question)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  title="Edit Question"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleQRCodeClick(question)}
                  className="p-2 text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
                  title="Generate QR Code"
                >
                  <QrCode size={18} />
                </button>
                <button
                  onClick={() => handleDeleteQuestion(question.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  title="Delete Question"
                >
                  <Trash2 size={18} />
                </button>
                <button
                  onClick={() => handleSubmissionsClick(question)}
                  className="p-2 text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
                  title="View Submissions"
                >
                  <FileText size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddQuestionModal && (
        <AddAISWBModal
          isOpen={showAddQuestionModal}
          onClose={() => {
            setShowAddQuestionModal(false);
            setEditingQuestion(null);
          }}
          onAddQuestion={handleAddQuestion}
          onEditQuestion={handleEditQuestion}
          editingQuestion={editingQuestion}
          onGenerateAnswer={handleGenerateAnswer}
        />
      )}

      {showQuestionDetails && selectedQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Question Details</h3>
              <button
                onClick={() => setShowQuestionDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Question Section */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h4 className="text-lg font-semibold text-blue-800 mb-2">Question</h4>
                <p className="text-gray-800">{selectedQuestion.question}</p>
              </div>

              {/* Metadata Section */}
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <h4 className="text-lg font-semibold text-purple-800 mb-3">Question Metadata</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-purple-700">Difficulty Level</p>
                    <p className="text-gray-800">{selectedQuestion.metadata.difficultyLevel}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-700">Word Limit</p>
                    <p className="text-gray-800">{selectedQuestion.metadata.wordLimit}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-700">Estimated Time</p>
                    <p className="text-gray-800">{selectedQuestion.metadata.estimatedTime} minutes</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-700">Maximum Marks</p>
                    <p className="text-gray-800">{selectedQuestion.metadata.maximumMarks}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-700">Language Mode</p>
                    <p className="text-gray-800">
                      {selectedQuestion.languageMode === 'english' ? 'English' : 
                       selectedQuestion.languageMode === 'hindi' ? 'Hindi' : 
                       'Both (English & Hindi)'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-700">Keywords</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {Array.isArray(selectedQuestion.metadata.keywords) ? (
                        selectedQuestion.metadata.keywords.map((keyword, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                          >
                            {keyword}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-800">No keywords specified</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quality Parameters */}
                <div className="mt-4">
                  <p className="text-sm font-medium text-purple-700 mb-2">Quality Parameters</p>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className={`w-3 h-3 rounded-full mr-2 ${selectedQuestion.metadata.qualityParameters.intro ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                      <span className="text-gray-800">Introduction</span>
                    </div>
                    <div className="flex items-center">
                      <span className={`w-3 h-3 rounded-full mr-2 ${selectedQuestion.metadata.qualityParameters.body.enabled ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                      <span className="text-gray-800">Body</span>
                      {selectedQuestion.metadata.qualityParameters.body.enabled && (
                        <div className="ml-6 space-y-1">
                          <div className="flex items-center">
                            <span className={`w-2 h-2 rounded-full mr-2 ${selectedQuestion.metadata.qualityParameters.body.features ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                            <span className="text-gray-800">Features</span>
                          </div>
                          <div className="flex items-center">
                            <span className={`w-2 h-2 rounded-full mr-2 ${selectedQuestion.metadata.qualityParameters.body.examples ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                            <span className="text-gray-800">Examples</span>
                          </div>
                          <div className="flex items-center">
                            <span className={`w-2 h-2 rounded-full mr-2 ${selectedQuestion.metadata.qualityParameters.body.facts ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                            <span className="text-gray-800">Facts</span>
                          </div>
                          <div className="flex items-center">
                            <span className={`w-2 h-2 rounded-full mr-2 ${selectedQuestion.metadata.qualityParameters.body.diagram ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                            <span className="text-gray-800">Diagram</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center">
                      <span className={`w-3 h-3 rounded-full mr-2 ${selectedQuestion.metadata.qualityParameters.conclusion ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                      <span className="text-gray-800">Conclusion</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Answer Section */}
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                <h4 className="text-lg font-semibold text-indigo-800 mb-2">Detailed Answer</h4>
                <div 
                  className="prose max-w-none bg-white p-4 rounded-lg"
                  dangerouslySetInnerHTML={{ 
                    __html: selectedQuestion.detailedAnswer.includes('<') 
                      ? selectedQuestion.detailedAnswer 
                      : selectedQuestion.detailedAnswer.replace(/\n/g, '<br/>')
                  }}
                />
              </div>

              {/* Answer Video URLs */}
              {selectedQuestion.answerVideoUrls && selectedQuestion.answerVideoUrls.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <h4 className="text-lg font-semibold text-blue-800 mb-2">Answer Video URLs</h4>
                  <div className="space-y-2">
                    {selectedQuestion.answerVideoUrls.map((url, index) => (
                      <div key={index} className="bg-white p-4 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600 font-medium">Video {index + 1}:</span>
                          <a 
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline flex-1"
                          >
                            {url}
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Evaluation Mode Section */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <h4 className="text-lg font-semibold text-green-800 mb-2">Evaluation Mode</h4>
                <div className="bg-white p-4 rounded-lg">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedQuestion.evaluationMode === 'auto' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedQuestion.evaluationMode === 'auto' ? 'Automatic' : 'Manual'}
                  </span>
                </div>
              </div>

              {/* Modal Answer Section */}
              {selectedQuestion.modalAnswer && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <h4 className="text-lg font-semibold text-green-800 mb-2">Modal Answer</h4>
                  <div 
                    className="prose max-w-none bg-white p-4 rounded-lg"
                    dangerouslySetInnerHTML={{ 
                      __html: selectedQuestion.modalAnswer.includes('<') 
                        ? selectedQuestion.modalAnswer 
                        : selectedQuestion.modalAnswer.replace(/\n/g, '<br/>')
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showQRModal && selectedQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800">QR Code</h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex flex-col items-center">
              {loading ? (
                <div className="bg-gray-100 rounded-lg h-64 w-64 flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600 mb-3"></div>
                  <p className="text-gray-600">Generating QR code...</p>
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 w-full text-center">
                  <div className="text-red-500 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <p className="text-red-600 font-medium mb-3">QR Code Generation Failed</p>
                  <p className="text-red-600 mb-4 text-sm">{error}</p>
                  <p className="text-gray-600 text-sm mb-4">This might be due to server issues or network connectivity problems.</p>
                  <button 
                    onClick={() => fetchQRCode(selectedQuestion, qrFormat, qrSize, includeAnswers)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              ) : qrCodeData?.qrCodeDataURL ? (
                <div className="border border-gray-200 p-4 rounded-lg shadow-sm">
                  <img 
                    src={qrCodeData.qrCodeDataURL} 
                    alt="Question QR Code" 
                    className="h-64 w-64 object-contain"
                  />
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 w-full text-center">
                  <p className="text-yellow-700 mb-4">No QR code data available. Please try generating again.</p>
                  <button 
                    onClick={() => fetchQRCode(selectedQuestion, qrFormat, qrSize, includeAnswers)}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
                  >
                    Generate QR Code
                  </button>
                </div>
              )}
              
              {qrCodeData?.qrCodeDataURL && (
                <button
                  onClick={handleDownload}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center"
                >
                  <Download size={16} className="mr-2" />
                  Download QR Code
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showGeminiModal && editingQuestion && (
        <GeminiModal
          isOpen={showGeminiModal}
          onClose={() => setShowGeminiModal(false)}
          onResponse={handleGeminiResponse}
          title={geminiModalType === 'detailed' ? 'Generate Detailed Answer' : 'Generate Modal Answer'}
          question={editingQuestion.question}
          detailedAnswer={editingQuestion.detailedAnswer}
          metadata={editingQuestion.metadata}
          qualityParams={editingQuestion.metadata.qualityParameters}
        />
      )}

      
    </div>
  );
};

export default AISWBQuestions; 
