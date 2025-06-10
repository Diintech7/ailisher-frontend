import React, { useState, useEffect } from 'react';
import { userAnswerService } from '../../../services/userAnswerService';
import { toast } from 'react-toastify';
import ManualEvaluationModal from './ManualEvaluationModal';

const SubmittedSubmissions = ({ questionId, question }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedImage, setSelectedImage] = useState(null);
  const [expandedSubmissions, setExpandedSubmissions] = useState({});
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);

  useEffect(() => {
    if (questionId) {
      fetchSubmissions();
    }
  }, [questionId, page]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await userAnswerService.getQuestionAnswers(questionId, {
        page,
        submissionStatus: 'submitted',
        limit: 10,
        questionId: questionId
      });
      
      if (response.success) {
        // Filter submissions that are in submitted status for this question
        const filteredSubmissions = response.data.answers.filter(submission => 
          submission.submissionStatus === 'submitted' && 
          submission.question?._id === questionId
        );
        
        setSubmissions(filteredSubmissions);
        setTotalPages(Math.ceil(response.data.pagination.totalPages));
        // Initialize expanded state for new submissions (default to collapsed)
        const initialExpandedState = {};
        filteredSubmissions.forEach(sub => {
          initialExpandedState[sub._id] = false;
        });
        setExpandedSubmissions(initialExpandedState);
      } else {
        setError(response.message);
      }
    } catch (error) {
      setError(error.message);
      toast.error('Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async (submission) => {
    setSelectedSubmission(submission);
    setShowEvaluationModal(true);
  };

  const handleEvaluationComplete = (evaluationData) => {
    // Update the submission in the list with the new evaluation data
    setSubmissions(prevSubmissions => 
      prevSubmissions.map(sub => 
        sub._id === selectedSubmission._id 
          ? { ...sub, evaluation: evaluationData, submissionStatus: 'evaluated' }
          : sub
      )
    );
  };

  const handleReject = async (answerId) => {
    try {
      const response = await userAnswerService.updateMainStatus(answerId, 'rejected', 'Rejected by reviewer');
      if (response.success) {
        toast.success('Answer rejected successfully');
        fetchSubmissions(); // Refresh the list
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error('Failed to reject answer');
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

   // Toggle expand/collapse for a submission
   const toggleExpand = (submissionId) => {
    setExpandedSubmissions(prevState => ({
      ...prevState,
      [submissionId]: !prevState[submissionId]
    }));
  };

  // Image Modal Component
  const ImageModal = ({ image, onClose }) => {
    if (!image) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
        <div className="relative max-w-4xl w-full">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={image.imageUrl}
            alt="Full size"
            className="w-full h-auto max-h-[80vh] object-contain"
          />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  if (!questionId) {
    return <div className="text-red-600">Question ID is required</div>;
  }

  return (
    <div className="space-y-6">
      {/* Image Modal */}
      {selectedImage && (
        <ImageModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}

      {/* Evaluation Modal */}
      {showEvaluationModal && selectedSubmission && (
        <ManualEvaluationModal
          submission={selectedSubmission}
          question={question}
          onClose={() => {
            setShowEvaluationModal(false);
            setSelectedSubmission(null);
          }}
          onEvaluationComplete={handleEvaluationComplete}
        />
      )}

      {submissions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No submitted answers found for this question</p>
        </div>
      ) : (
        submissions.map((submission) => (
          <div key={submission._id} className="bg-white shadow rounded-lg overflow-hidden">
            
            {/* Basic Info - Always Visible */}
            <div 
              className="p-6 flex justify-between items-center cursor-pointer"
              onClick={() => toggleExpand(submission._id)}
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {submission.user?.name || 'Anonymous'}
                </h3>
                <p className="text-sm text-gray-500">
                  Submitted on {formatDateTime(submission.submittedAt)}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                  Submitted
                </span>
                 {/* Expand/Collapse Icon */}
                <svg 
                  className={`w-5 h-5 text-gray-500 transform transition-transform ${
                    expandedSubmissions[submission._id] ? 'rotate-180' : 'rotate-0'
                  }`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Collapsible Details */}
            {expandedSubmissions[submission._id] && (
              <div className="p-6 pt-0 space-y-4 border-t border-gray-200">

                {/* Answer Images */}
                {submission.answerImages && submission.answerImages.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Submitted Images:</h4>
                    {/* Reduced image thumbnail size */}
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                      {submission.answerImages.map((image, index) => (
                        <div 
                          key={index} 
                          className="relative cursor-pointer group aspect-w-4 aspect-h-3 rounded-lg overflow-hidden bg-white border border-gray-200"
                          onClick={() => setSelectedImage(image)}
                        >
                          <img
                            src={image.imageUrl}
                            alt={`Answer image ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/150x100?text=Image+Not+Found';
                            }}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity flex items-center justify-center">
                            <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m4-3H6" />
                            </svg>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Text Answer if available */}
                {submission.textAnswer && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-700 mb-2">Text Answer:</h4>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <p className="text-gray-800 whitespace-pre-wrap">{submission.textAnswer}</p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-6 flex justify-end space-x-4">
                  <button
                    onClick={() => handleEvaluate(submission)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Evaluate
                  </button>
                  <button
                    onClick={() => handleReject(submission._id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}

          </div>
        ))
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded-md disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border rounded-md disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default SubmittedSubmissions; 