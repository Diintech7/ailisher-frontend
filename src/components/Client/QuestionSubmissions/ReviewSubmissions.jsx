import React, { useState, useEffect } from 'react';
import { userAnswerService } from '../../../services/userAnswerService';
import { toast } from 'react-toastify';
import AnswerAnnotation from './AnswerAnnotation';
import axios from 'axios';

const ReviewSubmissions = ({ questionId }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedImage, setSelectedImage] = useState(null);
  const [expandedSubmissions, setExpandedSubmissions] = useState({});
  const [activeTab, setActiveTab] = useState('review_pending');
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  useEffect(() => {
    if (questionId) {
      fetchSubmissions();
    }
  }, [questionId, page, activeTab]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'review_pending') {
        // Use new API for pending reviews
        const response = await userAnswerService.getPendingReviews();
        
        if (response.success) {
          // Filter reviews for the current question
          const filteredReviews = response.data.requests.filter(
            review => review.questionId._id === questionId
          );
          
          // Transform the data to match the expected format
          const transformedReviews = filteredReviews.map(review => ({
            _id: review._id,
            user: review.userId,
            question: review.questionId,
            evaluation: review.answerId.evaluation,
            answerImages: review.answerId.answerImages,
            annotations: review.answerId.annotations,
            submittedAt: review.answerId.submittedAt,
            reviewStatus: review.requestStatus,
            notes: review.notes,
            priority: review.priority,
            evaluatedAt: review.requestedAt
          }));
          
          setSubmissions(transformedReviews);
          setTotalPages(Math.ceil(filteredReviews.length / 10));
          
          const initialExpandedState = {};
          transformedReviews.forEach(sub => {
            initialExpandedState[sub._id] = false;
          });
          setExpandedSubmissions(initialExpandedState);
        } else {
          setError(response.message);
        }
      } else {
        // Use existing API for other tabs
        const response = await userAnswerService.getQuestionAnswers(questionId, {
          page,
          submissionStatus: 'evaluated',
          publishStatus: 'published',
          reviewStatus: activeTab,
          limit: 10,
          questionId: questionId
        });
        
        if (response.success) {
          const filteredSubmissions = response.data.answers.filter(submission => 
            submission.question?._id === questionId &&
            submission.submissionStatus === 'evaluated' &&
            submission.publishStatus === 'published' &&
            submission.reviewStatus === activeTab
          );
          
          setSubmissions(filteredSubmissions);
          setTotalPages(Math.ceil(response.data.pagination.totalPages));
          const initialExpandedState = {};
          filteredSubmissions.forEach(sub => {
            initialExpandedState[sub._id] = false;
          });
          setExpandedSubmissions(initialExpandedState);
        } else {
          setError(response.message);
        }
      }
    } catch (error) {
      setError(error.message);
      toast.error('Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewStatusUpdate = async (answerId, newStatus, reason) => {
    try {
      if (activeTab === 'review_pending') {
        // Make API call with POST method and log response
        const response = await axios.post(`https://aipbbackend-yxnh.onrender.com/api/review/${answerId}/accept`);
        console.log('Review accept response:', response.data);
        
        if (response.data.success) {
          toast.success('Review accepted successfully');
          fetchSubmissions(); // Refresh the list
        } else {
          throw new Error(response.data.message || 'Failed to accept review');
        }
      } else {
        // Existing logic for other tabs
        const existingSubmissions = JSON.parse(localStorage.getItem(`review_submissions_${questionId}`) || '[]');
        
        const updatedSubmissions = existingSubmissions.map(sub => {
          if (sub._id === answerId) {
            return {
              ...sub,
              reviewStatus: newStatus,
              reviewAcceptedAt: new Date().toISOString()
            };
          }
          return sub;
        });

        if (!existingSubmissions.find(sub => sub._id === answerId)) {
          const submissionToUpdate = submissions.find(sub => sub._id === answerId);
          if (submissionToUpdate) {
            updatedSubmissions.push({
              ...submissionToUpdate,
              reviewStatus: newStatus,
              reviewAcceptedAt: new Date().toISOString()
            });
          }
        }

        localStorage.setItem(`review_submissions_${questionId}`, JSON.stringify(updatedSubmissions));
        
        toast.success('Review accepted successfully');
        fetchSubmissions();
      }
    } catch (error) {
      console.error('Error updating review status:', error);
      toast.error(error.message || 'Failed to update review status');
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

  const toggleExpand = (submissionId) => {
    setExpandedSubmissions(prevState => ({
      ...prevState,
      [submissionId]: !prevState[submissionId]
    }));
  };

  // Image Modal Component
  const ImageModal = ({ image, onClose }) => {
    if (!image) return null;

    // Handle both regular answer images and annotated images
    const imageUrl = image.downloadUrl || image.imageUrl;

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
            src={imageUrl}
            alt="Full size"
            className="w-full h-auto max-h-[80vh] object-contain"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/800x600?text=Image+Not+Found';
            }}
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
      {/* Sub Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('review_pending')}
            className={`${
              activeTab === 'review_pending'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Pending Review
          </button>
          <button
            onClick={() => setActiveTab('review_accepted')}
            className={`${
              activeTab === 'review_accepted'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Accepted
          </button>
          <button
            onClick={() => setActiveTab('review_completed')}
            className={`${
              activeTab === 'review_completed'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Completed
          </button>
        </nav>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}

      {submissions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No {activeTab.replace('_', ' ')} submissions for this question</p>
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
                  Evaluated on {formatDateTime(submission.evaluatedAt)}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                  {submission.reviewStatus}
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
                {/* Answer Images - Show annotated images for completed reviews, regular images for others */}
                {activeTab === 'review_completed' && submission.feedback?.expertReview?.annotatedImages && submission.feedback.expertReview.annotatedImages.length > 0 ? (
                  <div className="bg-gray-100 p-4 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Annotated Images:</h4>
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                      {submission.feedback.expertReview.annotatedImages.map((image, index) => (
                        <div 
                          key={index} 
                          className="relative cursor-pointer group aspect-w-4 aspect-h-3 rounded-lg overflow-hidden bg-white border border-gray-200"
                          onClick={() => setSelectedImage(image)}
                        >
                          <img
                            src={image.downloadUrl}
                            alt={`Annotated image ${index + 1}`}
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
                ) : submission.annotations && submission.annotations.length > 0 && (
                  <div className="bg-gray-100 p-4 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Submitted Images:</h4>
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                      {submission.annotations.map((image, index) => (
                        <div 
                          key={index} 
                          className="relative cursor-pointer group aspect-w-4 aspect-h-3 rounded-lg overflow-hidden bg-white border border-gray-200"
                          onClick={() => setSelectedImage(image)}
                        >
                          <img
                            src={image.downloadUrl}
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

                {/* Extracted Text - Only show for non-completed reviews */}
                {activeTab !== 'review_completed' && submission.extractedTexts && submission.extractedTexts.length > 0 && (
                  <div className="bg-blue-100 p-4 rounded-lg border border-blue-200">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">Extracted Text from Answer Images:</h4>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                        {submission.extractedTexts[0].split('\n').map((line, lineIndex) => {
                          const cleanedLine = line.replace(/^\*\s+|^-\s+/, '');
                          return <span key={lineIndex}>{cleanedLine}<br/></span>;
                        })}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Expert Review Details - Only show for completed reviews */}
                {activeTab === 'review_completed' && submission.feedback?.expertReview && (
                  <div className="bg-purple-100 p-4 rounded-lg border border-purple-200">
                    <h4 className="text-sm font-medium text-purple-800 mb-2">Expert Review:</h4>
                    <div className="bg-white rounded-lg p-4 space-y-4 border border-gray-200">

                      {/* Score */}
                      <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                        <h5 className="text-sm font-medium text-green-700">Score:</h5>
                        <p className="text-2xl font-bold text-green-800 mt-1">{submission.feedback.expertReview.score} / 10</p>
                      </div>

                      {/* Remarks */}
                      {submission.feedback.expertReview.remarks && (
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                          <h5 className="text-sm font-medium text-blue-700">Remarks:</h5>
                          <p className="text-sm text-gray-800 mt-1">{submission.feedback.expertReview.remarks}</p>
                        </div>
                      )}

                      {/* Result */}
                      {submission.feedback.expertReview.result && (
                        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                          <h5 className="text-sm font-medium text-yellow-700">Result:</h5>
                          <p className="text-sm text-gray-800 mt-1">{submission.feedback.expertReview.result}</p>
                        </div>
                      )}

                      {/* Reviewed At */}
                      {submission.feedback.expertReview.reviewedAt && (
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                          <h5 className="text-sm font-medium text-gray-700">Reviewed At:</h5>
                          <p className="text-sm text-gray-800 mt-1">{formatDateTime(submission.feedback.expertReview.reviewedAt)}</p>
                        </div>
                      )}

                    </div>
                  </div>
                )}

                {/* Analysis Details - Only show for non-completed reviews */}
                {activeTab !== 'review_completed' && submission.evaluation && (
                  <div className="bg-purple-100 p-4 rounded-lg border border-purple-200">
                    <h4 className="text-sm font-medium text-purple-800 mb-2">Analysis:</h4>
                    <div className="bg-white rounded-lg p-4 space-y-4 border border-gray-200">

                      {/* User Reason for Review Request */}
                      {submission.notes && (
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                          <h5 className="text-sm font-medium text-blue-700">User Reason for Review Request:</h5>
                          <p className="text-sm text-gray-800 mt-1">{submission.notes}</p>
                        </div>
                      )}

                      {/* Priority */}
                      {submission.priority && (
                        <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                          <h5 className="text-sm font-medium text-green-700">Priority:</h5>
                          <p className="text-sm text-gray-800 mt-1 capitalize">{submission.priority}</p>
                        </div>
                      )}

                      {/* Accuracy */}
                      <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                        <h5 className="text-sm font-medium text-purple-700">Accuracy:</h5>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-1">
                          <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${submission.evaluation.accuracy}%` }}></div>
                        </div>
                        <p className="text-lg font-semibold text-gray-800 mt-1">{submission.evaluation.accuracy}%</p>
                      </div>

                      {/* Strengths */}
                      {submission.evaluation.strengths && submission.evaluation.strengths.length > 0 && (
                        <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                          <h5 className="text-sm font-medium text-green-700">Strengths:</h5>
                          <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
                            {submission.evaluation.strengths.map((strength, index) => (
                              <li key={index}>
                                {strength.replace(/^\*\s+/, '').replace(/\*\*(.*?)\*\*/g, '$1')}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Weaknesses */}
                      {submission.evaluation.weaknesses && submission.evaluation.weaknesses.length > 0 && (
                        <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                          <h5 className="text-sm font-medium text-red-700">Areas for Improvement:</h5>
                          <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
                            {submission.evaluation.weaknesses.map((weakness, index) => (
                              <li key={index}>
                                {weakness.replace(/^\*\s+/, '').replace(/\*\*(.*?)\*\*/g, '$1')}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Suggestions */}
                      {submission.evaluation.suggestions && submission.evaluation.suggestions.length > 0 && (
                        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                          <h5 className="text-sm font-medium text-yellow-700">Suggestions:</h5>
                          <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
                            {submission.evaluation.suggestions.map((suggestion, index) => (
                              <li key={index}>
                                {suggestion.replace(/^\*\s+/, '').replace(/\*\*(.*?)\*\*/g, '$1')}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                    </div>
                  </div>
                )}

                {/* Marks Awarded - Only show for non-completed reviews */}
                {activeTab !== 'review_completed' && submission.evaluation?.marks !== undefined && (
                  <div className="bg-green-100 p-4 rounded-lg border border-green-200">
                    <h5 className="text-sm font-medium text-green-800 mb-2">Marks Awarded</h5>
                    <p className="text-2xl font-bold text-green-800">{submission.evaluation.marks} / {submission.question.metadata?.maximumMarks}</p>
                  </div>
                )}

                {/* Feedback - Only show for non-completed reviews */}
                {activeTab !== 'review_completed' && submission.evaluation?.feedback && (
                  <div className="bg-blue-100 p-4 rounded-lg border border-blue-200">
                    <h5 className="text-sm font-medium text-blue-800 mb-2">Feedback</h5>
                    <div className="text-sm text-gray-800 whitespace-pre-wrap">
                      {submission.evaluation.feedback.split('\n').map((line, lineIndex) => {
                        const parts = line.split(/\*\*(.*?)\*\*/g);
                        const cleanedLineParts = parts.map((part, i) => {
                          if (i === 0 && line.startsWith('* ')) {
                            return part.replace(/^\*\s+/, '');
                          }
                          return part;
                        });

                        return (
                          <p key={lineIndex} className={line.startsWith('* ') ? 'ml-4' : ''}>
                            {line.startsWith('* ') && '• '}
                            {cleanedLineParts.map((part, partIndex) => {
                              if (partIndex % 2 === 1) {
                                return <strong key={partIndex} className="text-blue-700">{part}</strong>;
                              } else {
                                return part;
                              }
                            })}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Accept Review Button - Only show in review_pending tab */}
                {activeTab === 'review_pending' && (
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => handleReviewStatusUpdate(submission._id, 'review_accepted', 'Review accepted')}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                      Accept Review
                    </button>
                  </div>
                )}

                {/* Annotate Answer Button - Only show in review_accepted tab */}
                {activeTab === 'review_accepted' && (
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => setSelectedSubmission(submission)}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center space-x-2"
                    >
                      <svg 
                        className="w-5 h-5" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" 
                        />
                      </svg>
                      <span>Annotate Answer</span>
                    </button>
                  </div>
                )}
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

      {/* Annotation Modal */}
      {selectedSubmission && (
        <AnswerAnnotation
          submission={selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
        />
      )}
    </div>
  );
};

export default ReviewSubmissions; 