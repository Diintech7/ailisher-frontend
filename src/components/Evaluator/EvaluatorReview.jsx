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
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(null);

  const API_BASE_URL = 'https://aipbbackend-yxnh.onrender.com';

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
                  {hasExpertReview.score}/ {review.questionId?.metadata?.maximumMarks}
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
               {/* Show review timing info based on type */}
          {type === 'pending' && review.reviewRequestedAt && (
            <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
              <Clock size={12} />  {formatDate(review.reviewRequestedAt)}
            </div>
          )}
          {type === 'accepted' && review.reviewAssignedAt && (
            <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
              <Clock size={12} /> {formatDate(review.reviewAssignedAt)}
            </div>
          )}
          {type === 'completed' && review.reviewCompletedAt && (
            <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
              <Clock size={12} /> {formatDate(review.reviewCompletedAt)}
            </div>
          )}
              {/* <div className="flex items-center gap-1">
                <Calendar size={12} />
                {formatDate(review.submittedAt)}
              </div> */}
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
                    Score: {hasExpertReview.score}/ {review.questionId?.metadata?.maximumMarks}
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
    console.log(review)
    

    const handleImageClick = (imgUrl) => {
      setActiveImage(imgUrl);
      setImageModalOpen(true);
    };
  
    const closeImageModal = () => {
      setImageModalOpen(false);
      setActiveImage(null);
    };

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

                {/* Answer Images (answerImages)
                {review.answerImages && review.answerImages.length > 0 && (
                  <div className="bg-pink-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <ImageIcon size={16} />
                      Uploaded Answer Images ({review.answerImages.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {review.answerImages.map((img, idx) => (
                        <div key={idx} className="border rounded-lg overflow-hidden">
                          <img
                            src={img.imageUrl}
                            alt={img.originalName || `Answer Image ${idx + 1}`}
                            className="w-full h-48 object-cover"
                            onClick={() => handleImageClick(img.imageUrl)}
                            style={{ cursor: "zoom-in" }}
                          />
                          <div className="p-3">
                            <p className="text-sm text-gray-600 mb-1">
                              {img.originalName || `Image ${idx + 1}`}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(img.uploadedAt)}
                            </p>
                           
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )} */}
                {/* Answer Images (answerImages) */}
                {review.annotations && review.annotations.length > 0 && (
                  <div className="bg-pink-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <ImageIcon size={16} />
                      Annotated Answer Images ({review.annotations.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {review.annotations.map((img, idx) => (
                        <div key={idx} className="border rounded-lg overflow-hidden">
                          <img
                            src={img.downloadUrl}
                            alt={img.originalName || `Answer Image ${idx + 1}`}
                            className="w-full h-48 object-cover"
                            onClick={() => handleImageClick(img.downloadUrl)}
                            style={{ cursor: "zoom-in" }}
                          />
                          <div className="p-3">
                            <p className="text-sm text-gray-600 mb-1">
                              {img.originalName || `Image ${idx + 1}`}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(img.uploadedAt)}
                            </p>
                           
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expert Review Section */}
                {review.feedback && review.feedback.expertReview && (
  <div className="bg-yellow-50 p-4 rounded-lg">
    <h3 className="font-semibold mb-3 flex items-center gap-2">
      <Star size={16} />
      Expert Review
    </h3>
    <div className="space-y-2">
      {review.feedback.expertReview.result && (
        <div><strong>Result:</strong> {review.feedback.expertReview.result}</div>
      )}
      {review.feedback.expertReview.score !== undefined && (
        <div><strong>Score:</strong> {review.feedback.expertReview.score}</div>
      )}
      {review.feedback.expertReview.remarks && (
        <div><strong>Remarks:</strong> {review.feedback.expertReview.remarks}</div>
      )}
    </div>
    {/* Expert Annotated Images */}
    {review.feedback.expertReview.annotatedImages && review.feedback.expertReview.annotatedImages.length > 0 && (
      <div className="mt-4">
        <h4 className="font-semibold mb-2">Expert Annotated Images ({review.feedback.expertReview.annotatedImages.length})</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {review.feedback.expertReview.annotatedImages.map((img, idx) => (
            <div key={idx} className="border rounded-lg overflow-hidden">
              <img
                src={img.downloadUrl}
                alt={`Expert Annotated Image ${idx + 1}`}
                className="w-full h-48 object-cover"
                onClick={() => handleImageClick(img.downloadUrl)}
                style={{ cursor: "zoom-in" }}
              />
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
)}

                {/* Evaluation Analysis */}
                {review.evaluation && review.evaluation.analysis && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Star size={16} />
                      Evaluation Analysis
                    </h3>
                    <div>
                      <p><strong>Introduction:</strong> {Array.isArray(review.evaluation.analysis.introduction) ? review.evaluation.analysis.introduction.join(', ') : (review.evaluation.analysis.introduction || 'N/A')}</p>
                      <p><strong>Body:</strong> {Array.isArray(review.evaluation.analysis.body) ? review.evaluation.analysis.body.join(', ') : (review.evaluation.analysis.body || 'N/A')}</p>
                      <p><strong>Conclusion:</strong> {Array.isArray(review.evaluation.analysis.conclusion) ? review.evaluation.analysis.conclusion.join(', ') : (review.evaluation.analysis.conclusion || 'N/A')}</p>
                      <p><strong>Strengths:</strong></p>
                      <ul>
                        {review.evaluation.analysis.strengths?.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                      <p><strong>Weaknesses:</strong></p>
                      <ul>
                        {review.evaluation.analysis.weaknesses?.map((w, i) => <li key={i}>{w}</li>)}
                      </ul>
                      <p><strong>Suggestions:</strong></p>
                      <ul>
                        {review.evaluation.analysis.suggestions?.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                      <p><strong>Feedback:</strong> {Array.isArray(review.evaluation.analysis.feedback) ? review.evaluation.analysis.feedback.join(', ') : (review.evaluation.analysis.feedback || 'N/A')}</p>
                    </div>
                  </div>
                )}

                {/* Evaluation Comments */}
                {review.evaluation && review.evaluation.comments && review.evaluation.comments.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <MessageSquare size={16} />
                      Evaluation Comments
                    </h3>
                    <ul>
                      {review.evaluation.comments.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                )}

                {/* Evaluation General Fields */}
                {review.evaluation && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Star size={16} />
                      Evaluation Summary
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {review.evaluation.relevancy !== undefined && (
                        <div><strong>Relevancy:</strong> {review.evaluation.relevancy}</div>
                      )}
                      {review.evaluation.score !== undefined && (
                        <div><strong>Score:</strong> {review.evaluation.score}</div>
                      )}
                      {review.evaluation.remark && (
                        <div className="md:col-span-2"><strong>Remark:</strong> {review.evaluation.remark}</div>
                      )}
                      {/* {review.evaluation.feedbackStatus !== undefined && (
                        <div><strong>Feedback Status:</strong> {review.evaluation.feedbackStatus ? 'Yes' : 'No'}</div>
                      )} */}
                      {/* {review.evaluation.userFeedback && (
                        <div className="md:col-span-2">
                          <strong>User Feedback:</strong> {review.evaluation.userFeedback.message || 'N/A'}
                          {review.evaluation.userFeedback.submittedAt && (
                            <span> (Submitted: {formatDate(review.evaluation.userFeedback.submittedAt)})</span>
                          )}
                        </div>
                      )} */}
                    </div>
                  </div>
                )}

                {/* Feedback Suggestions */}
                {review.feedback && review.feedback.suggestions && review.feedback.suggestions.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <MessageSquare size={16} />
                      Feedback Suggestions
                    </h3>
                    <ul>
                      {review.feedback.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}

                {/* Feedback User Feedback Review
                {review.feedback && review.feedback.userFeedbackReview && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <MessageSquare size={16} />
                      User Feedback Review
                    </h3>
                    <p><strong>Message:</strong> {review.feedback.userFeedbackReview.message || 'N/A'}</p>
                    <p><strong>Submitted At:</strong> {review.feedback.userFeedbackReview.submittedAt ? formatDate(review.feedback.userFeedbackReview.submittedAt) : 'N/A'}</p>
                  </div>
                )} */}
                
                
                 {/* Image Lightbox */}
      {imageModalOpen && activeImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
          onClick={closeImageModal}
        >
          <img
            src={activeImage}
            alt="Large Answer"
            className="max-w-4xl max-h-[90vh] rounded-lg border-4 border-white shadow-2xl"
            style={{ objectFit: "contain" }}
          />
          <button
            className="absolute top-8 right-8 text-white text-3xl font-bold bg-black bg-opacity-40 rounded-full w-12 h-12 flex items-center justify-center hover:bg-opacity-70 transition-all"
            onClick={closeImageModal}
            aria-label="Close"
          >
            ×
          </button>
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
