import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../UI/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../UI/Tabs';
import { Badge } from '../UI/Badge';
import { 
  Clock, 
  CheckCircle, 
  FileCheck, 
  User, 
  Calendar,
  Eye,
  MessageSquare,
  Star,
  X,
  Download,
  Image as ImageIcon,
  FileText,
  Smartphone,
  Globe,
  Timer
} from 'lucide-react';
import Cookies from 'js-cookie';
import AnswerAnnotation from '../Client/QuestionSubmissions/AnswerAnnotation'

export default function EvaluatorReview() {
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingReviews, setPendingReviews] = useState([]);
  const [acceptedReviews, setAcceptedReviews] = useState([]);
  const [completedReviews, setCompletedReviews] = useState([]);
  const [SelectedAnswer, setSelectedAnswer] = useState(null)
  const [loading, setLoading] = useState({
    pending: false,
    accepted: false,
    completed: false
  });
  const [error, setError] = useState({
    pending: null,
    accepted: null,
    completed: null
  });
  const [pagination, setPagination] = useState({
    pending: { currentPage: 1, totalPages: 1, totalReviews: 0 },
    accepted: { currentPage: 1, totalPages: 1, totalReviews: 0 },
    completed: { currentPage: 1, totalPages: 1, totalReviews: 0 }
  });

  // Modal state
  const [selectedReview, setSelectedReview] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const API_BASE_URL = 'http://localhost:5000';

  const fetchReviews = async (type, page = 1) => {
    setLoading(prev => ({ ...prev, [type]: true }));
    setError(prev => ({ ...prev, [type]: null }));

    try {
      // Try different possible cookie names
      const token = Cookies.get('evaluatortoken');
      console.log(`Fetching ${type} reviews with token:`, token);
      console.log(`API URL: ${API_BASE_URL}/api/evaluator-reviews/${type}-reviews`);
      
      const response = await axios.get(`${API_BASE_URL}/api/evaluator-reviews/${type}-reviews`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          page,
          limit: 10
        }
      });

      console.log(`${type} reviews response:`, response.data);

      if (response.data.success) {
        const { reviews, pagination: paginationData } = response.data.data;
        console.log(`${type} reviews data:`, reviews);
        console.log(`${type} pagination data:`, paginationData);
        
        switch (type) {
          case 'pending':
            setPendingReviews(reviews);
            break;
          case 'accepted':
            setAcceptedReviews(reviews);
            break;
          case 'completed':
            setCompletedReviews(reviews);
            break;
        }

        setPagination(prev => ({
          ...prev,
          [type]: paginationData
        }));
      } else {
        console.error(`${type} reviews API returned success: false`, response.data);
        setError(prev => ({
          ...prev,
          [type]: response.data.message || `API returned success: false for ${type} reviews`
        }));
      }
    } catch (err) {
      console.error(`Error fetching ${type} reviews:`, err);
      console.error(`Error response:`, err.response?.data);
      setError(prev => ({
        ...prev,
        [type]: err.response?.data?.message || `Failed to fetch ${type} reviews: ${err.message}`
      }));
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const acceptReview = async (requestId) => {
    try {
      const token = Cookies.get('evaluatortoken');
      const response = await axios.post(
        `${API_BASE_URL}/api/evaluator-reviews/${requestId}/accept`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      // Optionally, show a success message here
      console.log(response)
      // Refetch reviews to update UI
      fetchReviews('pending');
      fetchReviews('accepted');
    } catch (error) {
      console.error('Error accepting review:', error);
      // Optionally, show an error message here
    }
  };

  const handleViewDetails = (review) => {
    setSelectedReview(review);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedReview(null);
  };

  useEffect(() => {
    console.log(`Active tab changed to: ${activeTab}`);
    fetchReviews(activeTab);
  }, [activeTab]);

  const handleTabChange = (value) => {
    console.log(`Tab change requested from ${activeTab} to ${value}`);
    setActiveTab(value);
  };

  const handlePageChange = (type, page) => {
    fetchReviews(type, page);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      review_pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Pending' },
      review_accepted: { color: 'bg-pink-100 text-pink-800', icon: FileCheck, text: 'Accepted' },
      review_completed: { color: 'bg-green-100 text-green-800', icon: FileCheck, text: 'Completed' }
    };

    const config = statusConfig[status] || statusConfig.review_pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon size={12} />
        {config.text}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (seconds) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Utility to mask mobile number
  const maskMobile = (mobile) => {
    if (!mobile || typeof mobile !== 'string') return 'N/A';
    if (mobile.length <= 5) return mobile;
    return mobile.slice(0, 5) + 'x'.repeat(mobile.length - 5);
  };

  const ReviewCard = ({ review, type }) => {
    const hasExpertReview = review.feedback?.expertReview;
    
    return (
      <Card className="mb-4 hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                <User size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-sm">
                  {review.userId?.name || (review.userId?.mobile ? maskMobile(review.userId.mobile) : 'Unknown User')}
                </h3>
                {/* <p className="text-xs text-gray-500">{review.userId?.mobile}</p> */}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(review.reviewStatus)}
              {hasExpertReview && (
                <Badge className="bg-purple-100 text-purple-800 flex items-center gap-1">
                  <Star size={12} />
                  {hasExpertReview.score}/100
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-sm mb-1">Question</h4>
              <p className="text-sm text-gray-600 line-clamp-2">
                {review.questionId?._id || 'Question not available'}
              </p>
              <p className="text-sm text-gray-600 line-clamp-2">
                {review.questionId?.question || 'Question not available'}
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar size={12} />
                {formatDate(review.submittedAt)}
              </div>
              <div>Attempt: {review.attemptNumber}</div>
              {review.setId && (
                <div>Set: {review.setId.name}</div>
              )}
            </div>

            {review.requestnote && (
              <div className="bg-blue-50 p-2 rounded-md">
                <p className="text-xs text-blue-700">
                  <strong>Request Note:</strong> {review.requestnote}
                </p>
              </div>
            )}

            {hasExpertReview && (
              <div className="bg-green-50 p-3 rounded-md">
                <h5 className="font-medium text-sm mb-2 flex items-center gap-1">
                  <MessageSquare size={14} />
                  Expert Review
                </h5>
                <p className="text-sm text-gray-700 mb-2">{hasExpertReview.remarks}</p>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800">
                    Score: {hasExpertReview.score}/100
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {formatDate(hasExpertReview.reviewedAt)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button 
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-1"
                onClick={() => handleViewDetails(review)}
              >
                <Eye size={14} />
                View Details
              </button>
              {type === 'pending' && (
                <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1"
                onClick={()=>acceptReview(review.requestId)}>
                  <CheckCircle size={14} />
                  Accept Review
                </button>
              )}
              {type === 'accepted' && (
                <button className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-1"
                onClick={()=>setSelectedAnswer(review)}>
                  <MessageSquare size={14} />
                  Annotate Answer
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Detailed Review Modal Component
  const ReviewDetailsModal = ({ review, isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-xl font-semibold">Review Details</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X size={20} />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6">
            {review && (
              <div className="space-y-6">
                {/* User Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <User size={16} />
                    User Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-medium">{review.userId?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Mobile</p>
                      <p className="font-medium">{review.userId?.mobile ? maskMobile(review.userId.mobile) : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Attempt Number</p>
                      <p className="font-medium">{review.attemptNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Submitted At</p>
                      <p className="font-medium">{formatDate(review.submittedAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Question Information */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <FileText size={16} />
                    Question Details
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Question</p>
                      <p className="text-gray-800">{review.questionId?.question || 'Question not available'}</p>
                    </div>
                    {review.questionId?.metadata && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Difficulty Level</p>
                          <p className="font-medium">{review.questionId.metadata.difficultyLevel || 'N/A'}</p>
                        </div>
                        {review.setId && (
                          <div>
                            <p className="text-sm text-gray-600">Set</p>
                            <p className="font-medium">{review.setId.name}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-gray-600">Question ID</p>
                          <p className="font-medium">{review.questionId?._id}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Text Answer */}
                {review.textAnswer && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <FileText size={16} />
                      Text Answer
                    </h3>
                    <p className="text-gray-800 whitespace-pre-wrap">{review.textAnswer}</p>
                  </div>
                )}

                {/* Answer Images */}
                {review.answerImages && review.answerImages.length > 0 && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <ImageIcon size={16} />
                      Answer Images ({review.answerImages.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {review.answerImages.map((image, index) => (
                        <div key={index} className="border rounded-lg overflow-hidden">
                          <img
                            src={image.imageUrl}
                            alt={`Answer ${index + 1}`}
                            className="w-full h-48 object-cover"
                            onError={(e) => {
                              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NzM4NyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+';
                            }}
                          />
                          <div className="p-3">
                            <p className="text-sm text-gray-600 mb-1">
                              {image.originalName || `Image ${index + 1}`}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(image.uploadedAt)}
                            </p>
                            <a
                              href={image.imageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-2"
                            >
                              <Download size={12} />
                              View Full Size
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                {review.metadata && (
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Smartphone size={16} />
                      Submission Metadata
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Timer size={12} />
                          Time Spent
                        </p>
                        <p className="font-medium">{formatTime(review.metadata.timeSpent)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Globe size={12} />
                          Source Type
                        </p>
                        <p className="font-medium capitalize">{review.metadata.sourceType || 'N/A'}</p>
                      </div>
                      {review.metadata.deviceInfo && (
                        <div className="md:col-span-2">
                          <p className="text-sm text-gray-600">Device Info</p>
                          <p className="font-medium text-sm">{review.metadata.deviceInfo}</p>
                        </div>
                      )}
                      {review.metadata.appVersion && (
                        <div>
                          <p className="text-sm text-gray-600">App Version</p>
                          <p className="font-medium">{review.metadata.appVersion}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Request Note */}
                {review.requestnote && (
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <MessageSquare size={16} />
                      Request Note
                    </h3>
                    <p className="text-gray-800">{review.requestnote}</p>
                  </div>
                )}

                {/* Evaluation Data */}
                {review.evaluation && (
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Star size={16} />
                      Evaluation Data
                    </h3>
                    <div className="space-y-4">
                      {review.evaluation.accuracy !== undefined && (
                        <div>
                          <p className="text-sm text-gray-600">Accuracy</p>
                          <p className="font-medium">{review.evaluation.accuracy}%</p>
                        </div>
                      )}
                      {review.evaluation.marks !== undefined && (
                        <div>
                          <p className="text-sm text-gray-600">Marks</p>
                          <p className="font-medium">{review.evaluation.marks}</p>
                        </div>
                      )}
                      {review.evaluation.extractedText && (
                        <div>
                          <p className="text-sm text-gray-600">Extracted Text</p>
                          <p className="font-medium text-sm">{review.evaluation.extractedText}</p>
                        </div>
                      )}
                      {review.evaluation.feedback && (
                        <div>
                          <p className="text-sm text-gray-600">Feedback</p>
                          <p className="font-medium text-sm">{review.evaluation.feedback}</p>
                        </div>
                      )}
                      {review.evaluation.strengths && review.evaluation.strengths.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-600">Strengths</p>
                          <ul className="list-disc list-inside text-sm">
                            {review.evaluation.strengths.map((strength, index) => (
                              <li key={index}>{strength}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {review.evaluation.weaknesses && review.evaluation.weaknesses.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-600">Weaknesses</p>
                          <ul className="list-disc list-inside text-sm">
                            {review.evaluation.weaknesses.map((weakness, index) => (
                              <li key={index}>{weakness}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {review.evaluation.suggestions && review.evaluation.suggestions.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-600">Suggestions</p>
                          <ul className="list-disc list-inside text-sm">
                            {review.evaluation.suggestions.map((suggestion, index) => (
                              <li key={index}>{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Expert Review */}
                {review.feedback?.expertReview && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Star size={16} />
                      Expert Review
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Score</p>
                          <p className="font-medium text-lg">{review.feedback.expertReview.score}/100</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Reviewed At</p>
                          <p className="font-medium">{formatDate(review.feedback.expertReview.reviewedAt)}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Remarks</p>
                        <p className="font-medium">{review.feedback.expertReview.remarks}</p>
                      </div>
                      {review.feedback.expertReview.annotatedImages && review.feedback.expertReview.annotatedImages.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Annotated Images</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {review.feedback.expertReview.annotatedImages.map((image, index) => (
                              <div key={index} className="border rounded-lg overflow-hidden">
                                <img
                                  src={image.downloadUrl}
                                  alt={`Annotated ${index + 1}`}
                                  className="w-full h-48 object-cover"
                                />
                                <div className="p-3">
                                  <p className="text-xs text-gray-500">
                                    {formatDate(image.uploadedAt)}
                                  </p>
                                </div>
                                <a
                              href={image.downloadUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="pl-3 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-2"
                            >
                              <Download size={12} />
                              View Full Size
                            </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end p-6 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const Pagination = ({ type, paginationData }) => {
    const { currentPage, totalPages, totalReviews } = paginationData;
    
    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-between items-center mt-4">
        <p className="text-sm text-gray-600">
          Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalReviews)} of {totalReviews} reviews
        </p>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={currentPage === 1}
            onClick={() => handlePageChange(type, currentPage - 1)}
          >
            Previous
          </button>
          <span className="flex items-center px-3 text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(type, currentPage + 1)}
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  const ReviewsList = ({ reviews, type, loading: isLoading, error: errorMessage }) => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (errorMessage) {
      return (
        <div className="text-center py-8">
          <p className="text-red-600 mb-2">{errorMessage}</p>
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            onClick={() => fetchReviews(type)}
          >
            Retry
          </button>
        </div>
      );
    }

    if (reviews.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">No {type} reviews found</p>
        </div>
      );
    }

    return (
      <div>
        {reviews.map((review) => (
          <ReviewCard key={review._id} review={review} type={type} />
        ))}
        <Pagination type={type} paginationData={pagination[type]} />
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Review Management</h1>
        <p className="text-gray-600">Manage and review submitted answers</p>
      </div>

      <div className="w-full">
        {/* Custom Tab Navigation */}
        <div className="flex space-x-2 p-1 rounded-lg bg-gray-100 mb-6">
          <button
            onClick={() => handleTabChange('pending')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'pending' 
                ? 'bg-purple-600 text-white' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            <Clock size={16} />
            Pending ({pagination.pending.totalReviews})
          </button>
          <button
            onClick={() => handleTabChange('accepted')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'accepted' 
                ? 'bg-purple-600 text-white' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            <CheckCircle size={16} />
            Accepted ({pagination.accepted.totalReviews})
          </button>
          <button
            onClick={() => handleTabChange('completed')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'completed' 
                ? 'bg-purple-600 text-white' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            <FileCheck size={16} />
            Completed ({pagination.completed.totalReviews})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'pending' && (
          <div className="mt-6">
            <ReviewsList
              reviews={pendingReviews}
              type="pending"
              loading={loading.pending}
              error={error.pending}
            />
          </div>
        )}

        {activeTab === 'accepted' && (
          <div className="mt-6">
            <ReviewsList
              reviews={acceptedReviews}
              type="accepted"
              loading={loading.accepted}
              error={error.accepted}
            />
          </div>
        )}

        {activeTab === 'completed' && (
          <div className="mt-6">
            <ReviewsList
              reviews={completedReviews}
              type="completed"
              loading={loading.completed}
              error={error.completed}
            />
          </div>
        )}
      </div>

      {/* Detailed Review Modal */}
      {selectedReview && (
        <ReviewDetailsModal
          review={selectedReview}
          isOpen={isModalOpen}
          onClose={closeModal}
        />
      )}

      {
        SelectedAnswer && (
        <AnswerAnnotation
        submission={SelectedAnswer}
        onClose={()=>setSelectedAnswer(null)}
        />
        )
      }
    </div>
  );
}
