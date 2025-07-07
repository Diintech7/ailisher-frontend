import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ManualEvaluationModal from '../Client/QuestionSubmissions/ManualEvaluationModal';
import { Badge } from '../UI/Badge';
import Cookies from 'js-cookie';


export default function PendingAnswers() {
  const [pendingAnswers, setPendingAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [Answer, setAnswer] = useState(null);
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeImages, setActiveImages] = useState([]);
  const [acceptingAnswer, setAcceptingAnswer] = useState(null);

  const fetchPendingAnswers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:5000/api/clients/CLI677117YN7N/mobile/userAnswers/crud/answers', {
        params: {
          evaluationMode: 'manual',
          submissionStatus: 'submitted',
        },
      });
      if (response.data.success) {
        setPendingAnswers(response.data.data.answers);
      } else {
        setError(response.data.message || 'Failed to fetch pending answers');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch pending answers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingAnswers();
  }, []);

  const handleEvaluationComplete = async (updatedAnswer) => {
    // Optimistically update UI
    setPendingAnswers(prev => prev.filter(ans => ans._id !== updatedAnswer._id));
    fetchPendingAnswers();
  };

  const handleAcceptAnswer = async (answerId) => {
    setAcceptingAnswer(answerId);
    try {
      const token = Cookies.get('evaluatortoken'); // Assuming you store evaluator token
      console.log(token)
      const response = await axios.put(
        `http://localhost:5000/api/clients/CLI677117YN7N/mobile/userAnswers/crud/answers/${answerId}/accept`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        // Remove the accepted answer from the list
        setPendingAnswers(prev => prev.filter(ans => ans._id !== answerId));
        // You can show a success message here
        alert('Answer accepted successfully!');
      } else {
        alert(response.data.message || 'Failed to accept answer');
      }
    } catch (error) {
      console.error('Error accepting answer:', error);
      alert(error.response?.data?.message || 'Failed to accept answer');
    } finally {
      setAcceptingAnswer(null);
    }
  };

  const getStatusBadge = (status) => {
    let variant = 'default';
    let text = status;
    if (status === 'submitted') variant = 'info';
    return <Badge variant={variant} className="capitalize">{text}</Badge>;
  };

  const AnswerCard = ({ answer }) => (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 p-6 mb-6">
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Image on the left */}
        {answer.answerImages && answer.answerImages.length > 0 && (
          <div className="flex mb-4 md:mb-0 md:mr-6 flex-col items-center h-full justify-center min-h-[160px]">
            <img
              src={answer.answerImages[0].imageUrl}
              alt="Answer"
              className="w-32 max-h-full object-contain rounded-lg border cursor-zoom-in"
              style={{ height: '100%' }}
              onClick={() => {
                setActiveImages(answer.answerImages);
                setActiveImageIndex(0);
                setImageModalOpen(true);
              }}
            />
            {answer.answerImages.length > 1 && (
              <div className="text-xs text-gray-500 mt-1">
                +{answer.answerImages.length - 1} more image{answer.answerImages.length > 2 ? 's' : ''}
              </div>
            )}
          </div>
        )}
        {/* Details on the right */}
        <div className="flex-1 w-full">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-start gap-3 mb-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 leading-tight">
                    {answer.question?.question || 'N/A'}
                  </h3>
                  <div className='flex grid-cols-2 gap-6'>
                  <p className="text-xs text-gray-400 mt-1">QID: {answer.question?._id}</p>
                  <p className="text-xs text-gray-400 mt-1">UID: {answer.userId}</p>
                  <p className="text-xs text-gray-400 mt-1">Difficulty level: {answer.question.metadata.difficultyLevel}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(answer.submissionStatus)}
            </div>
          </div>
          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            
            
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Submitted</div>
              <div className="text-sm font-semibold text-gray-900">
                {answer.submittedAt ? new Date(answer.submittedAt).toLocaleString() : 'N/A'}
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Score</div>
              <div className="text-sm font-semibold text-gray-900">{`${answer.evaluation.score}/${answer.question.metadata?.maximumMarks}` || 'N/A'}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Relevancy</div>
              <div className="text-sm font-semibold text-gray-900">{`${answer.evaluation.relevancy}%`|| 'N/A'}</div>
            </div>
            
          </div>
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Remark</div>
              <div className="text-sm font-semibold text-gray-900">{answer.evaluation.remark|| 'N/A'}</div>
            </div>
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg shadow-md hover:from-gray-600 hover:to-gray-700 transition-all duration-200 font-medium flex items-center justify-center gap-2"
              onClick={() => setAnswer(answer)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Details
            </button>
            <button
              className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-md hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => handleAcceptAnswer(answer._id)}
              disabled={acceptingAnswer === answer._id}
            >
              {acceptingAnswer === answer._id ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Accepting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Accept
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Manual Evaluation Queue
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Review and accept submitted answers that require manual assessment
          </p>
        </div>

        {/* Stats Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Pending Evaluations</h2>
              <p className="text-gray-600">Answers waiting for manual review</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">{pendingAnswers.length}</div>
              <div className="text-sm text-gray-500">Total Pending</div>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading pending answers...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Answers</h3>
            <p className="text-red-600">{error}</p>
          </div>
        ) : pendingAnswers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Pending Evaluations</h3>
            <p className="text-gray-600">All manual evaluations have been completed!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pendingAnswers.map((answer) => (
              <AnswerCard key={answer._id} answer={answer} />
            ))}
          </div>
        )}

        {/* Modals */}
        {evalModalOpen && selectedAnswer && (
          <ManualEvaluationModal 
            submission={selectedAnswer} 
            onClose={() => {
              setSelectedAnswer(null); 
              setEvalModalOpen(false);
            }}
            onEvaluationComplete={handleEvaluationComplete}
          />
        )}
        <AnswerDetailsModal answer={Answer} open={!!Answer} onClose={() => setAnswer(null)} />
      </div>
      {/* Image Lightbox Modal */}
      {imageModalOpen && (
        <ImageLightbox
          images={activeImages}
          currentIndex={activeImageIndex}
          onClose={() => setImageModalOpen(false)}
          onPrev={() => setActiveImageIndex(idx => Math.max(0, idx - 1))}
          onNext={() => setActiveImageIndex(idx => Math.min(activeImages.length - 1, idx + 1))}
        />
      )}
    </div>
  );
}

const AnswerDetailsModal = ({ answer, open, onClose }) => {
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(null);
  
  if (!open || !answer) return null;
  
  const evaluation = answer.evaluation || {};
  const feedback = answer.feedback || {};
  const metadata = answer.metadata || {};
  const question = answer.question || {};
  const user = answer.user || {};
  
  // Get evaluation details
  const relevancy = evaluation.relevancy || 'Not evaluated';
  const score = evaluation.score || 'Not evaluated';
  const remark = evaluation.remark || 'No remark provided';
  const comments = evaluation.comments || [];
  const analysis = evaluation.analysis || {};
  const strengths = analysis.strengths || [];
  const weaknesses = analysis.weaknesses || [];
  const suggestions = analysis.suggestions || [];
  const evaluationFeedback = analysis.feedback || 'No feedback provided';
  
  const handleImageClick = (imgUrl) => {
    setActiveImage(imgUrl);
    setImageModalOpen(true);
  };
  
  const closeImageModal = () => {
    setImageModalOpen(false);
    setActiveImage(null);
  };
  
  const renderFeedback = (text) => {
    if (!text) return 'N/A';
    return text.split('\n').map((line, lineIndex) => {
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
          {cleanedLineParts.map((part, partIndex) =>
            partIndex % 2 === 1 ? <strong key={partIndex} className="text-blue-700">{part}</strong> : part
          )}
        </p>
      );
    });
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-y-auto max-h-[90vh] relative">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Answer Details</h2>
              <p className="text-sm text-gray-500 mt-1">Question ID: {question._id}</p>
            </div>
            <button
              className="text-gray-400 hover:text-gray-600 transition-colors"
              onClick={onClose}
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Question Section */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Question</h3>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-gray-800">{question.question || 'N/A'}</p>
            </div>
          </div>

          {/* Answer Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="text-sm font-medium text-blue-600 mb-1">User ID</div>
              <div className="font-semibold text-gray-900">{user._id || answer.userId || 'N/A'}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="text-sm font-medium text-green-600 mb-1">Attempt</div>
              <div className="font-semibold text-gray-900">#{answer.attemptNumber}</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="text-sm font-medium text-purple-600 mb-1">Submitted</div>
              <div className="font-semibold text-gray-900">
                {answer.submittedAt ? new Date(answer.submittedAt).toLocaleString() : 'N/A'}
              </div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <div className="text-sm font-medium text-yellow-600 mb-1">Difficulty</div>
              <div className="font-semibold text-gray-900">{question.metadata?.difficultyLevel || 'N/A'}</div>
            </div>
            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
              <div className="text-sm font-medium text-indigo-600 mb-1">Time</div>
              <div className="font-semibold text-gray-900">{question.metadata?.estimatedTime || 'N/A'} min</div>
            </div>
            <div className="bg-pink-50 rounded-lg p-4 border border-pink-200">
              <div className="text-sm font-medium text-pink-600 mb-1">Max Marks</div>
              <div className="font-semibold text-gray-900">{question.metadata?.maximumMarks || 'N/A'}</div>
            </div>
          </div>

          {/* Answer Images */}
          {answer.answerImages && answer.answerImages.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Answer Images</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {answer.answerImages.map((img, idx) => (
                  <div key={idx} className="group cursor-pointer">
                    <div className="bg-gray-100 rounded-lg p-4 border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
                      <img
                        src={img.imageUrl}
                        alt={`Answer ${idx + 1}`}
                        className="w-full h-48 object-contain rounded-lg shadow-sm transition-transform group-hover:scale-105"
                        onClick={() => handleImageClick(img.imageUrl)}
                        style={{ cursor: 'zoom-in' }}
                      />
                      <div className="mt-3 text-center">
                        <p className="text-sm font-medium text-gray-700">{img.originalName}</p>
                        <p className="text-xs text-gray-500">
                          {img.uploadedAt ? new Date(img.uploadedAt).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Extracted Text */}
          {answer.extractedTexts && answer.extractedTexts.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Extracted Text</h3>
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {answer.extractedTexts[0].split('\n').map((line, lineIndex) => {
                      const cleanedLine = line.replace(/^\*\s+|^-\s+/, '');
                      return <span key={lineIndex}>{cleanedLine}<br/></span>;
                    })}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Evaluation Details */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Evaluation Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                  <div className="text-sm font-medium text-green-600 mb-2">Accuracy</div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-500" 
                      style={{ width: `${evaluation.relevancy || 0}%` }}
                    ></div>
                  </div>
                  <div className="text-2xl font-bold text-green-600">{evaluation.relevancy || 0}%</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                  <div className="text-sm font-medium text-blue-600 mb-2">Score</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {evaluation.score || 0} / {question.metadata?.maximumMarks || 10}
                  </div>
                </div>
              </div>
          </div>

          {/* Evaluation Remark */}
          {remark && remark !== 'No remark provided' && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-orange-800 mb-3">Evaluation Remark</h4>
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <p className="text-orange-800">{remark}</p>
              </div>
            </div>
          )}

          {/* Evaluation Comments */}
          {comments.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-indigo-800 mb-3">Evaluation Comments</h4>
              <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                <ul className="space-y-2">
                  {comments.map((comment, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span className="text-indigo-800">{comment}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Analysis Details */}
          { analysis.introduction && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-pink-800 mb-3">Introduction</h4>
              <div className="bg-pink-50 rounded-lg p-4 border border-pink-200">
                <ul className="space-y-1">
                  {analysis.introduction.map((item, idx) => (
                    <li key={idx} className="text-sm text-gray-800 flex items-start gap-2">
                      <span className="text-pink-500 mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          {analysis.body && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-orange-800 mb-3">Body</h4>
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <ul className="space-y-1">
                  {analysis.body.map((item, idx) => (
                    <li key={idx} className="text-sm text-gray-800 flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          {analysis.conclusion  && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-purple-800 mb-3">Conclusion</h4>
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <ul className="space-y-1">
                  {analysis.conclusion.map((item, idx) => (
                    <li key={idx} className="text-sm text-gray-800 flex items-start gap-2">
                      <span className="text-purple-500 mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Strengths */}
          {strengths.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-green-800 mb-3">Strengths</h4>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <ul className="space-y-2">
                  {strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-green-800">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Weaknesses */}
          {weaknesses.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-red-800 mb-3">Areas for Improvement</h4>
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <ul className="space-y-2">
                  {weaknesses.map((weakness, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="text-red-800">{weakness}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-blue-800 mb-3">Suggestions</h4>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <ul className="space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-blue-800">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Evaluation Feedback */}
          {evaluationFeedback && evaluationFeedback !== 'No feedback provided' && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-purple-800 mb-3">Detailed Feedback</h4>
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <p className="text-purple-800 whitespace-pre-wrap">{evaluationFeedback}</p>
              </div>
            </div>
          )}

          {/* Text Answer */}
          {answer.textAnswer && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Text Answer</h4>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-gray-800 whitespace-pre-wrap">{answer.textAnswer}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Lightbox */}
      {imageModalOpen && activeImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90" onClick={closeImageModal}>
          <img
            src={activeImage}
            alt="Large Answer"
            className="max-w-4xl max-h-[90vh] rounded-lg border-4 border-white shadow-2xl"
            style={{ objectFit: 'contain' }}
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
  );
};

const ImageLightbox = ({ images, currentIndex, onClose, onPrev, onNext }) => {
  if (!images || images.length === 0) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
      <button
        className="absolute top-8 right-8 text-white text-3xl font-bold bg-black bg-opacity-40 rounded-full w-12 h-12 flex items-center justify-center hover:bg-opacity-70 transition-all"
        onClick={onClose}
        aria-label="Close"
      >
        ×
      </button>
      <button
        className="absolute left-8 text-white text-3xl font-bold bg-black bg-opacity-40 rounded-full w-12 h-12 flex items-center justify-center hover:bg-opacity-70 transition-all"
        onClick={onPrev}
        aria-label="Previous"
        disabled={currentIndex === 0}
        style={{ opacity: currentIndex === 0 ? 0.3 : 1 }}
      >
        ‹
      </button>
      <img
        src={images[currentIndex].imageUrl}
        alt="Large Answer"
        className="max-w-4xl max-h-[90vh] rounded-lg border-4 border-white shadow-2xl"
        style={{ objectFit: 'contain' }}
      />
      <button
        className="absolute right-8 text-white text-3xl font-bold bg-black bg-opacity-40 rounded-full w-12 h-12 flex items-center justify-center hover:bg-opacity-70 transition-all"
        onClick={onNext}
        aria-label="Next"
        disabled={currentIndex === images.length - 1}
        style={{ top: '50%', transform: 'translateY(-50%)', opacity: currentIndex === images.length - 1 ? 0.3 : 1 }}
      >
        ›
      </button>
    </div>
  );
}; 