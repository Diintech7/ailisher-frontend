import React, { useState, useEffect } from 'react';
import { Edit2, Eye, Trash2, Clock, FileText, User, Search, Filter } from 'lucide-react';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';
import { API_BASE_URL } from '../../config';
import AddAISWBModal from './AddAISWBModal';
import GeminiModal from '../GeminiModal';
import FormatMyQuestionModal from './FormatMyQuestionModal';
import ManualEvaluationModal from './QuestionSubmissions/ManualEvaluationModal';

const PendingMyQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showGeminiModal, setShowGeminiModal] = useState(false);
  const [geminiModalType, setGeminiModalType] = useState(null);
  const [showEvaluateModal, setShowEvaluateModal] = useState(false);
  const [answersForEvaluation, setAnswersForEvaluation] = useState([]);
  const [currentEvaluationIndex, setCurrentEvaluationIndex] = useState(0);
  const [currentSubmission, setCurrentSubmission] = useState(null);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');

  useEffect(() => {
    fetchPendingQuestions();
  }, [page, filterStatus]);

  const fetchPendingQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = Cookies.get('usertoken');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        status: filterStatus
      });

      const response = await fetch(
        `${API_BASE_URL}/api/myquestion/questions/pending?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();

      if (data.success) {
        setQuestions(data.data.questions || []);
        setPagination(data.data.pagination || {
          currentPage: page,
          totalPages: 1,
          totalCount: 0,
          hasNextPage: false,
          hasPrevPage: false
        });
      } else {
        setError(data.message || 'Failed to fetch questions');
        toast.error(data.message || 'Failed to fetch questions');
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      setError('Failed to connect to the server');
      toast.error('Failed to fetch questions');
    } finally {
      setLoading(false);
    }
  };

  const handleFormatSubmit = async (updatedQuestion) => {
    try {
      const token = Cookies.get('usertoken');
      if (!token) {
        toast.error('Authentication required');
        return false;
      }
      // const {
      //   id,
      //   detailedAnswer,
      //   modalAnswer,
      //   metadata,
      //   languageMode,
      //   evaluationMode,
      //   evaluationType,
      //   evaluationGuideline,
      //   answerVideoUrls
      // } = updatedQuestion || {};
      
      // const body = {
      //   detailedAnswer,
      //   modalAnswer: modalAnswer || '',
      //   modalAnswerPdfKey: [], // PDFs handled elsewhere; send empty array by default
      //   answerVideoUrls: Array.isArray(answerVideoUrls) ? answerVideoUrls : (typeof answerVideoUrls === 'string' ? answerVideoUrls.split(',').map(u => u.trim()).filter(Boolean) : []),
      //   metadata,
      //   languageMode,
      //   evaluationMode,
      //   evaluationType,
      //   evaluationGuideline
      // };
      console.log("updatedQuestion", updatedQuestion)
      const response = await fetch(
        `${API_BASE_URL}/api/myquestion/questions/${updatedQuestion.id}/format`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatedQuestion)
        }
      );
      const data = await response.json();
      if (response.ok && data.success) {
        toast.success('Question formatted successfully!');
        return true;
      } else {
        const detailMsg = data?.error?.details
          ? (Array.isArray(data.error.details)
              ? data.error.details.map(d => d.msg || d).join(', ')
              : data.error.details)
          : '';
        console.error('Format validation error:', data);
        toast.error(`${data.message || 'Failed to format question'}${detailMsg ? `: ${detailMsg}` : ''}`);
        return false;
      }
    } catch (error) {
      console.error('Error formatting question:', error);
      toast.error('Failed to format question');
      return false;
    }
  };

  const handleGenerateAnswer = (type) => {
    setGeminiModalType(type);
    setShowGeminiModal(true);
  };

  const handleGeminiResponse = (response) => {
    if (selectedQuestion) {
      const updatedQuestion = {
        ...selectedQuestion,
        [geminiModalType === 'detailed' ? 'detailedAnswer' : 'modalAnswer']: response
      };
      handleFormatClick(updatedQuestion);
    }
  };

  const handleFormatClick = async (question) => {
    try {
      // Fetch full question details
      console.log(question)
      const token = Cookies.get('usertoken');
      const response = await fetch(
        `${API_BASE_URL}/api/myquestion/questions/${question.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();
      if (data.success) {
        setSelectedQuestion(data.data);
        setShowFormatModal(true);
      } else {
        toast.error('Failed to fetch question details');
      }
    } catch (error) {
      console.error('Error fetching question:', error);
      toast.error('Failed to fetch question details');
    }
  };

  const handleViewClick = async (question) => {
    try {
      // Fetch full question details to show all formatted information
      const token = Cookies.get('usertoken');
      const response = await fetch(
        `${API_BASE_URL}/api/myquestion/questions/${question.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();
      if (data.success) {
        setSelectedQuestion(data.data);
        // Always fetch answers to show in details modal (regardless of status)
        fetchAnswersForEvaluation(question.id);
        setShowDetailsModal(true);
      } else {
        toast.error('Failed to fetch question details');
      }
    } catch (error) {
      console.error('Error fetching question:', error);
      toast.error('Failed to fetch question details');
    }
  };

  const handleFormatSuccess = () => {
    setShowFormatModal(false);
    setSelectedQuestion(null);
    fetchPendingQuestions();
    toast.success('Question formatted successfully!');
  };

  const handleEvaluate = async (questionId) => {
    try {
      // First fetch the full question details
      const token = Cookies.get('usertoken');
      const questionResponse = await fetch(
        `${API_BASE_URL}/api/myquestion/questions/${questionId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      const questionData = await questionResponse.json();
      
      if (!questionData.success) {
        toast.error('Failed to fetch question details');
        return;
      }

      const question = questionData.data;

      // Then fetch answers
      const answersResponse = await fetch(
        `${API_BASE_URL}/api/myquestion/questions/${questionId}/answers`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );
      const answersData = await answersResponse.json();
      
      if (answersResponse.ok && answersData.success) {
        if (answersData.data.answers.length > 0) {
          const rawAnswers = answersData.data.answers;
          console.log('Raw answers from API:', rawAnswers);
          console.log('First answer structure:', rawAnswers[0]);
          console.log('First answer answerImages:', rawAnswers[0]?.answerImages);
          
          // Transform answers to match ManualEvaluationModal expected format
          const transformedAnswers = rawAnswers.map(answer => {
            const transformed = {
              _id: answer._id,
              question: question, // Attach full question object
              extractedTexts: answer.extractedTexts || [],
              answerImages: answer.answerImages || []
            };
            console.log('Transformed answer:', {
              id: transformed._id,
              hasImages: Array.isArray(transformed.answerImages),
              imageCount: transformed.answerImages?.length || 0
            });
            return transformed;
          });
          
          setAnswersForEvaluation(transformedAnswers);
          setCurrentEvaluationIndex(0);
          setCurrentSubmission(transformedAnswers[0]);
          setShowEvaluateModal(true);
        } else {
          toast.error('No answers found for evaluation');
        }
      } else {
        toast.error(answersData.message || 'Failed to fetch answers for evaluation');
      }
    } catch (error) {
      console.error('Error fetching answers for evaluation:', error);
      toast.error('Failed to fetch answers for evaluation');
    }
  };

  const fetchAnswersForEvaluation = async (questionId) => {
    const token = Cookies.get('usertoken');
    const response = await fetch(
      `${API_BASE_URL}/api/myquestion/questions/${questionId}/answers`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      }
    );  
    const data = await response.json();
    if (response.ok && data.success) {
      const answers = data.data.answers || [];
      console.log('Fetched answers:', answers);
      console.log('Answer images check:', answers.map(a => ({
        id: a._id,
        hasImages: Array.isArray(a.answerImages),
        imageCount: Array.isArray(a.answerImages) ? a.answerImages.length : 0,
        images: a.answerImages
      })));
      
      // Detailed logging for first answer's first image
      if (answers.length > 0 && answers[0].answerImages && answers[0].answerImages.length > 0) {
        console.log('First image object:', answers[0].answerImages[0]);
        console.log('First image object keys:', Object.keys(answers[0].answerImages[0] || {}));
        console.log('First image imageUrl:', answers[0].answerImages[0]?.imageUrl);
        console.log('First image full structure:', JSON.stringify(answers[0].answerImages[0], null, 2));
      }
      // Set answers for details modal
      setAnswersForEvaluation(answers);
    } else {
      console.error('Failed to fetch answers:', data.message);
    }
  };

  const filteredQuestions = questions.filter(q => {
    // Status is already filtered by the backend API
    // Only filter by search term on the frontend
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      q.question?.toLowerCase().includes(search) ||
      q.subject?.toLowerCase().includes(search) ||
      q.exam?.toLowerCase().includes(search)
    );
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      formatted: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      archived: 'bg-gray-100 text-gray-800'
    };
    return badges[status] || badges.pending;
  };

  if (loading && questions.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading questions...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">My Questions</h1>
        <p className="text-gray-600">Manage and format questions uploaded by users</p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-1 flex-col sm:flex-row gap-4 w-full">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search questions, subject, exam..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setPage(1);
                }}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">Pending Formatting</option>
                <option value="formatted">Formatted</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Questions List */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {filteredQuestions.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <FileText className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No questions found</h3>
          <p className="text-gray-600">
            {filterStatus === 'pending' 
              ? 'No questions are pending formatting at the moment.'
              : `No ${filterStatus} questions found.`}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Question
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject / Exam
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredQuestions.map((question) => (
                  <tr key={question.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 max-w-md truncate">
                        {question.question || 'No question text'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {question.wordLimit} words • {question.maximumMarks} marks
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{question.subject || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{question.exam || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User size={16} className="text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {question.createdBy?.name || question.createdBy?.mobile || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(question.status)}`}>
                        {question.status || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock size={14} className="mr-1" />
                        {formatDate(question.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewClick(question)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        {question.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleFormatClick(question)}
                              className="text-green-600 hover:text-green-900"
                              title="Format Question"
                            >
                              <Edit2 size={18} />
                            </button>
                          </>
                        )}
                        {question.status === 'formatted' && (
                          <button
                            onClick={() => handleEvaluate(question.id)}
                            className="text-purple-600 hover:text-purple-900 text-xs px-2 py-1 bg-purple-50 rounded"
                            title="Evaluate Question"
                          >
                            Evaluate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="text-sm text-gray-700">
                Showing {((pagination.currentPage - 1) * limit) + 1} to{' '}
                {Math.min(pagination.currentPage * limit, pagination.totalCount)} of{' '}
                {pagination.totalCount} questions
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrevPage}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={!pagination.hasNextPage}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Format Modal */}
      {showFormatModal && selectedQuestion && (
        <FormatMyQuestionModal
          isOpen={showFormatModal}
          onClose={() => {
            setShowFormatModal(false);
            setSelectedQuestion(null);
          }}
          onQuestions={fetchPendingQuestions}
          onEditQuestion={async (payload) => {
            const ok = await handleFormatSubmit(payload);
            if (ok) {
              handleFormatSuccess();
            }
            return ok;
          }}
          editingQuestion={selectedQuestion}
          scrollToSection={null}
          onGenerateAnswer={handleGenerateAnswer}
        />
      )}


{showGeminiModal && selectedQuestion && (
        <GeminiModal
          isOpen={showGeminiModal}
          onClose={() => setShowGeminiModal(false)}
          onResponse={handleGeminiResponse}
          title={geminiModalType === 'detailed' ? 'Generate Detailed Answer' : 'Generate Modal Answer'}
          question={selectedQuestion.question}
          detailedAnswer={selectedQuestion.detailedAnswer}
          metadata={selectedQuestion.metadata}
          qualityParams={selectedQuestion.metadata.qualityParameters}
        />
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Question Details</h2>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedQuestion(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {/* Basic Question Info */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Question</h3>
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedQuestion.question}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Subject</h3>
                    <p className="text-gray-900">{selectedQuestion.subject}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Exam</h3>
                    <p className="text-gray-900">{selectedQuestion.exam}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Word Limit</h3>
                    <p className="text-gray-900">{selectedQuestion.wordLimit}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Maximum Marks</h3>
                    <p className="text-gray-900">{selectedQuestion.maximumMarks}</p>
                  </div>
                </div>

                {/* Formatted Question Details - Show when status is 'formatted' */}
                {selectedQuestion.status === 'formatted' && (
                  <>
                    {selectedQuestion.detailedAnswer && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Detailed Answer</h3>
                        <div className="bg-gray-50 p-4 rounded-md">
                          <p className="text-gray-900 whitespace-pre-wrap">{selectedQuestion.detailedAnswer}</p>
                        </div>
                      </div>
                    )}

                    {selectedQuestion.modalAnswer && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Modal Answer</h3>
                        <div className="bg-gray-50 p-4 rounded-md">
                          <p className="text-gray-900 whitespace-pre-wrap">{selectedQuestion.modalAnswer}</p>
                        </div>
                      </div>
                    )}

                    {selectedQuestion.answerVideoUrls && selectedQuestion.answerVideoUrls.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Answer Video URLs</h3>
                        <div className="space-y-2">
                          {selectedQuestion.answerVideoUrls.map((url, index) => (
                            <a
                              key={index}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline block"
                            >
                              {url}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedQuestion.metadata && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Metadata</h3>
                        <div className="bg-gray-50 p-4 rounded-md space-y-3">
                          {selectedQuestion.metadata.keywords && selectedQuestion.metadata.keywords.length > 0 && (
                            <div>
                              <h4 className="text-xs font-medium text-gray-600 mb-1">Keywords</h4>
                              <div className="flex flex-wrap gap-2">
                                {selectedQuestion.metadata.keywords.map((keyword, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                    {keyword}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {selectedQuestion.metadata.difficultyLevel && (
                            <div>
                              <h4 className="text-xs font-medium text-gray-600 mb-1">Difficulty Level</h4>
                              <p className="text-gray-900">{selectedQuestion.metadata.difficultyLevel}</p>
                            </div>
                          )}
                          {selectedQuestion.metadata.estimatedTime && (
                            <div>
                              <h4 className="text-xs font-medium text-gray-600 mb-1">Estimated Time</h4>
                              <p className="text-gray-900">{selectedQuestion.metadata.estimatedTime} minutes</p>
                            </div>
                          )}
                          {selectedQuestion.metadata.qualityParameters && (
                            <div>
                              <h4 className="text-xs font-medium text-gray-600 mb-1">Quality Parameters</h4>
                              <div className="text-sm text-gray-900">
                                <pre className="whitespace-pre-wrap font-sans">
                                  {JSON.stringify(selectedQuestion.metadata.qualityParameters, null, 2)}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {selectedQuestion.languageMode && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Language Mode</h3>
                        <p className="text-gray-900 capitalize">{selectedQuestion.languageMode}</p>
                      </div>
                    )}

                    {selectedQuestion.evaluationMode && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Evaluation Mode</h3>
                        <p className="text-gray-900 capitalize">{selectedQuestion.evaluationMode}</p>
                      </div>
                    )}

                    {selectedQuestion.evaluationType && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Evaluation Type</h3>
                        <p className="text-gray-900">{selectedQuestion.evaluationType}</p>
                      </div>
                    )}

                    {selectedQuestion.evaluationGuideline && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Evaluation Guideline</h3>
                        <div className="bg-gray-50 p-4 rounded-md">
                          <p className="text-gray-900 whitespace-pre-wrap">{selectedQuestion.evaluationGuideline}</p>
                        </div>
                      </div>
                    )}

                    {selectedQuestion.formattedAt && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Formatted At</h3>
                        <p className="text-gray-900">{formatDate(selectedQuestion.formattedAt)}</p>
                      </div>
                    )}
                  </>
                )}

                {/* Answer Images - Show if available */}
                {answersForEvaluation.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Submitted Answers ({answersForEvaluation.length})</h3>
                    <div className="space-y-3">
                      {answersForEvaluation.map((answer, index) => {
                        const images = answer.answerImages || [];
                        const hasImages = Array.isArray(images) && images.length > 0;
                        
                        return (
                          <div key={answer._id || index} className="border border-gray-200 rounded-md p-3">
                            <div className="text-xs text-gray-500 mb-2">
                              Answer {index + 1} 
                              {hasImages && ` (${images.length} image${images.length > 1 ? 's' : ''})`}
                            </div>
                            {hasImages ? (
                              <div className="flex flex-wrap gap-2">
                                {images.map((image, imgIndex) => {
                                  console.log(`Rendering image ${imgIndex}:`, image);
                                  console.log('Image type:', typeof image);
                                  console.log('Image keys:', Object.keys(image || {}));
                                  
                                  // Try multiple possible URL fields
                                  const imageUrl = image?.imageUrl || image?.url || image?.secure_url || image?.path || (typeof image === 'string' ? image : null);
                                  
                                  console.log('Resolved imageUrl:', imageUrl, 'Type:', typeof imageUrl);
                                  
                                  if (!imageUrl || typeof imageUrl !== 'string') {
                                    console.warn('Image missing valid URL:', image);
                                    return (
                                      <div key={imgIndex} className="w-32 h-32 border-2 border-red-300 rounded-md flex flex-col items-center justify-center bg-red-50 p-2">
                                        <span className="text-xs text-red-600 text-center font-bold mb-1">Invalid URL</span>
                                        <pre className="text-[8px] text-gray-600 overflow-auto max-h-full">
                                          {JSON.stringify(image, null, 2)}
                                        </pre>
                                      </div>
                                    );
                                  }
                                  
                                  return (
                                    <div key={image._id || imgIndex} className="relative border-2 border-blue-300 bg-gray-100">
                                      <img
                                        src={imageUrl}
                                        alt={image?.originalName || image?.originalname || `Answer ${index + 1} - Image ${imgIndex + 1}`}
                                        className="w-32 h-32 object-contain rounded-md border-2 border-gray-300 cursor-pointer hover:opacity-80 bg-white"
                                        style={{ minWidth: '128px', minHeight: '128px' }}
                                        onClick={() => window.open(imageUrl, '_blank')}
                                        onError={(e) => {
                                          console.error('Image failed to load:', imageUrl);
                                          console.error('Image object:', image);
                                          e.target.style.display = 'none';
                                          const errorDiv = e.target.nextElementSibling;
                                          if (errorDiv) {
                                            errorDiv.classList.remove('hidden');
                                          }
                                        }}
                                        onLoad={() => {
                                          console.log('Image loaded successfully:', imageUrl);
                                        }}
                                      />
                                      <div className="hidden absolute inset-0 bg-red-50 border-2 border-red-300 rounded-md flex items-center justify-center">
                                        <span className="text-xs text-red-600 font-bold">Failed to load</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500 italic">
                                No images uploaded for this answer
                                {answer.answerImages && !Array.isArray(answer.answerImages) && (
                                  <span className="text-xs text-red-500 ml-2">
                                    (Invalid format: {typeof answer.answerImages})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingMyQuestions;
