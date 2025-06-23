import React, { useState, useEffect } from 'react';
import { userAnswerService } from '../../../services/userAnswerService';
import { toast } from 'react-toastify';

const EvaluatedSubmissions = ({ questionId }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeSubTab, setActiveSubTab] = useState('not-published');
  const [selectedImage, setSelectedImage] = useState(null);
  const [expandedSubmissions, setExpandedSubmissions] = useState({}); // State to manage expanded/collapsed submissions

  useEffect(() => {
    if (questionId) {
      fetchSubmissions();
    }
  }, [questionId, page, activeSubTab]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await userAnswerService.getQuestionAnswers(questionId, {
        page,
        submissionStatus: 'evaluated',
        limit: 10,
        questionId: questionId
      });
      
      if (response.success) {
        console.log('Raw API Response:', response.data);
        
        // Filter submissions that are evaluated for this question
        const filteredSubmissions = response.data.answers.filter(submission => 
          submission.submissionStatus === 'evaluated' && 
          submission.question?._id === questionId
        );
        
        console.log('After initial filtering (evaluated and question match):', filteredSubmissions);

        // Further filter based on publishStatus and popularityStatus for the tabs
        const tabFilteredSubmissions = filteredSubmissions.filter(submission => {
          if (activeSubTab === 'published') {
            return submission.publishStatus === 'published';
          } else if (activeSubTab === 'popular') {
            const isPopular = submission.publishStatus === 'published' && submission.popularityStatus === 'popular';
            console.log('Checking popularity for submission:', {
              id: submission._id,
              name: submission.user?.name,
              publishStatus: submission.publishStatus,
              popularityStatus: submission.popularityStatus,
              isPopular: isPopular
            });
            return isPopular;
          } else {
            return submission.publishStatus === 'not_published';
          }
        });
        
        console.log('Final filtered submissions for tab:', activeSubTab, tabFilteredSubmissions);
        
        setSubmissions(tabFilteredSubmissions);
        setTotalPages(Math.ceil(response.data.pagination.totalPages));
        // Initialize expanded state for new submissions (default to collapsed)
        const initialExpandedState = {};
        tabFilteredSubmissions.forEach(sub => {
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

  const handlePublishStatusUpdate = async (answerId, newPublishStatus, reason) => {
    try {
      let response;
      if (newPublishStatus === 'published') {
        // Use the new publishAnswer function for publishing
        response = await userAnswerService.publishAnswer(answerId);
      } else {
        // Use the existing updateMainStatus for unpublishing
        response = await userAnswerService.updateMainStatus(answerId, {
          publishStatus: newPublishStatus,
          reason: reason
        });
      }
      
      if (response.success) {
        toast.success(`Submission ${newPublishStatus} successfully`);
        fetchSubmissions(); // Refresh the list
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error('Failed to update publish status');
    }
  };

  const handlePopularityToggle = async (submission, currentStatus) => {
    try {
      const newStatus = currentStatus === 'popular' ? 'not_popular' : 'popular';
      console.log('Toggling popularity for submission:', {
        id: submission._id,
        name: submission.user?.name,
        currentStatus: currentStatus,
        newStatus: newStatus
      });

      const response = await userAnswerService.updatePopularity(
        submission._id,
        newStatus,
        newStatus === 'popular' ? 'Marked as popular due to high engagement' : 'Removed from popular status',
        submission
      );
      
      console.log('Popularity update response:', response);
      
      if (response.success) {
        toast.success(`Answer ${newStatus === 'popular' ? 'marked as popular' : 'removed from popular'} successfully`);
        // Refresh both components if they're both mounted
        fetchSubmissions();
        if (window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('popularityUpdated'));
        }
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error('Popularity toggle error:', error);
      toast.error('Failed to update popularity status');
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

      {/* Sub-tabs */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="flex space-x-4">
          <button
            onClick={() => setActiveSubTab('not-published')}
            className={`px-3 py-2 text-sm font-medium ${
              activeSubTab === 'not-published'
                ? 'border-b-2 border-indigo-500 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Not Published
          </button>
          <button
            onClick={() => setActiveSubTab('published')}
            className={`px-3 py-2 text-sm font-medium ${
              activeSubTab === 'published'
                ? 'border-b-2 border-indigo-500 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Published
          </button>
        </nav>
      </div>

      {/* Submissions List */}
      <div className="space-y-6">
        {submissions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">
              No {activeSubTab === 'published' ? 'published' : 'not published'} evaluated submissions found
            </p>
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
                <div className="flex items-center space-x-4">
                  {/* Status Badge */}
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    submission.publishStatus === 'published' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {submission.publishStatus === 'published' ? 'Published' : 'Not Published'}
                  </span>
                  
                  {/* Popularity Toggle Button - Only show for published submissions */}
                  {submission.publishStatus === 'published' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent expanding/collapsing when clicking the heart
                        handlePopularityToggle(submission, submission.popularityStatus);
                      }}
                      className={`p-1 rounded-full transition-colors duration-200 ${
                        submission.popularityStatus === 'popular'
                          ? 'text-red-500 hover:text-red-600'
                          : 'text-gray-400 hover:text-red-500'
                      }`}
                      title={submission.popularityStatus === 'popular' ? 'Remove from popular' : 'Mark as popular'}
                    >
                      <svg
                        className="w-5 h-5"
                        fill={submission.popularityStatus === 'popular' ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                    </button>
                  )}
                  
                  {/* Published Date/Time (Conditionally displayed) */}
                  {activeSubTab === 'published' && submission.publishedAt && (
                    <span className="text-sm text-gray-500">
                      Published on {formatDateTime(submission.publishedAt)}
                    </span>
                  )}

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

              {/* Collapsible Analysis Details */}
              {expandedSubmissions[submission._id] && (
                <div className="p-6 pt-0 space-y-4 border-t border-gray-200">
                  {/* Answer Images */}
                  {submission.answerImages && submission.answerImages.length > 0 && (
                    <div className="bg-gray-100 p-4 rounded-lg border border-gray-200">
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

                  {/* Extracted Text */}
                  {submission.extractedTexts && submission.extractedTexts.length > 0 && (
                    <div className="bg-blue-100 p-4 rounded-lg border border-blue-200">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">Extracted Text from Answer Images:</h4>
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                          {/* Clean up common list markdown from extracted text */}
                          {submission.extractedTexts[0].split('\n').map((line, lineIndex) => {
                            // Remove leading markdown list markers (* or - followed by space)
                            const cleanedLine = line.replace(/^\*\s+|^-\s+/, '');
                            return <span key={lineIndex}>{cleanedLine}<br/></span>;
                          })}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Analysis Details */}
                  {submission.evaluation && (
                    <div className="bg-purple-100 p-4 rounded-lg border border-purple-200">
                      <h4 className="text-sm font-medium text-purple-800 mb-2">Analysis:</h4>
                      <div className="bg-white rounded-lg p-4 space-y-4 border border-gray-200">

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
                                  {/* Remove markdown from list items */}
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
                                  {/* Remove markdown from list items */}
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
                                  {/* Remove markdown from list items */}
                                  {suggestion.replace(/^\*\s+/, '').replace(/\*\*(.*?)\*\*/g, '$1')}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                      </div>
                    </div>
                  )}

                  {/* Marks Awarded */}
                  {submission.evaluation?.marks !== undefined && submission.evaluation !== undefined && (
                    <div className="bg-green-100 p-4 rounded-lg border border-green-200">
                      <h5 className="text-sm font-medium text-green-800 mb-2">Marks Awarded</h5>
                      <p className="text-2xl font-bold text-green-800">{submission.evaluation.marks} / {submission.question.metadata?.maximumMarks}</p>
                    </div>
                  )}

                  {/* Feedback */}
                  {submission.evaluation?.feedback && (
                    <div className="bg-blue-100 p-4 rounded-lg border border-blue-200">
                      <h5 className="text-sm font-medium text-blue-800 mb-2">Feedback</h5>
                      <div className="text-sm text-gray-800 whitespace-pre-wrap">
                        {/* Render feedback text with bold styling and clean markdown */}
                        {submission.evaluation.feedback.split('\n').map((line, lineIndex) => {
                          // Simple markdown parsing for bold (**text**)
                          const parts = line.split(/\*\*(.*?)\*\*/g);
                          // Remove leading list markdown only for display here, ul/li handles actual list structure
                          const cleanedLineParts = parts.map((part, i) => {
                            if (i === 0 && line.startsWith('* ')) {
                               return part.replace(/^\*\s+/, '');
                            }
                            return part;
                          });

                          return (
                            <p key={lineIndex} className={line.startsWith('* ') ? 'ml-4' : ''}>
                              {line.startsWith('* ') && '• '}{ // Add bullet for list items
                                cleanedLineParts.map((part, partIndex) => {
                                  if (partIndex % 2 === 1) {
                                    // Text inside ** ** - show in highlight color
                                    return <strong key={partIndex} className="text-blue-700">{part}</strong>;
                                  } else {
                                    // Normal text outside ** **
                                    return part;
                                  }
                                })
                              }
                            </p>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-6 flex justify-end space-x-4">
                    {activeSubTab === 'not-published' ? (
                      <button
                        onClick={() => handlePublishStatusUpdate(submission._id, 'published', 'Published after evaluation')}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                      >
                        Publish to Students
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePublishStatusUpdate(submission._id, 'not_published', 'Unpublished by reviewer')}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                      >
                        Unpublish
                      </button>
                    )}
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
    </div>
  );
};

export default EvaluatedSubmissions; 