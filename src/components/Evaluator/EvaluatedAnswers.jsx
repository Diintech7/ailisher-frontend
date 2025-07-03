import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Badge } from '../UI/Badge';
import AnnotateAnswer from './AnnotateAnswer';

// AnswerDetailsModal component
const AnswerDetailsModal = ({ answer, open, onClose }) => {
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(null);
  
  if (!open || !answer) return null;
  
  const evaluation = answer.evaluation || {};
  const feedback = answer.feedback || {};
  const metadata = answer.metadata || {};
  const question = answer.question || {};
  const user = answer.user || {};
  
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
          {/* Evaluation Results */}
          {answer.submissionStatus === 'evaluated' && evaluation && (
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Evaluation Results</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                  <div className="text-sm font-medium text-green-600 mb-2">Accuracy</div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-500" 
                      style={{ width: `${evaluation.accuracy || 0}%` }}
                    ></div>
                  </div>
                  <div className="text-2xl font-bold text-green-600">{evaluation.accuracy || 0}%</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                  <div className="text-sm font-medium text-blue-600 mb-2">Marks Awarded</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {evaluation.marks || 0} / {evaluation.totalMarks || question.metadata?.maximumMarks || 10}
                  </div>
                </div>
              </div>
              
              {/* Evaluation Details */}
              <div className="space-y-4">
                {evaluation.strengths && evaluation.strengths.length > 0 && (
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <h4 className="text-sm font-medium text-green-700 mb-2">Strengths</h4>
                    <ul className="space-y-1">
                      {evaluation.strengths.map((strength, index) => (
                        <li key={index} className="text-sm text-gray-800 flex items-start gap-2">
                          <span className="text-green-500 mt-1">•</span>
                          <span>{strength.replace(/^\*\s+/, '').replace(/\*\*(.*?)\*\*/g, '$1')}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {evaluation.weaknesses && evaluation.weaknesses.length > 0 && (
                  <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <h4 className="text-sm font-medium text-red-700 mb-2">Areas for Improvement</h4>
                    <ul className="space-y-1">
                      {evaluation.weaknesses.map((weakness, index) => (
                        <li key={index} className="text-sm text-gray-800 flex items-start gap-2">
                          <span className="text-red-500 mt-1">•</span>
                          <span>{weakness.replace(/^\*\s+/, '').replace(/\*\*(.*?)\*\*/g, '$1')}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {evaluation.suggestions && evaluation.suggestions.length > 0 && (
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <h4 className="text-sm font-medium text-yellow-700 mb-2">Suggestions</h4>
                    <ul className="space-y-1">
                      {evaluation.suggestions.map((suggestion, index) => (
                        <li key={index} className="text-sm text-gray-800 flex items-start gap-2">
                          <span className="text-yellow-500 mt-1">•</span>
                          <span>{suggestion.replace(/^\*\s+/, '').replace(/\*\*(.*?)\*\*/g, '$1')}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {evaluation.feedback && (
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <h4 className="text-sm font-medium text-purple-700 mb-2">Detailed Feedback</h4>
                    <div className="text-sm text-gray-800">
                      {renderFeedback(evaluation.feedback)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* annotated images */}
          {answer.annotations && answer.annotations.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Annotated Images</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {answer.annotations.map((annotations, idx) => (
                  <div key={idx} className="group cursor-pointer">
                    <div className="bg-gray-100 rounded-lg p-4 border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
                      <img
                        src={annotations.downloadUrl}
                        className="w-full h-48 object-contain rounded-lg shadow-sm transition-transform group-hover:scale-105"
                        onClick={() => handleImageClick(annotations.downloadUrl)}
                        style={{ cursor: 'zoom-in' }}
                      />
                      <div className="mt-3 text-center">
                        <p className="text-xs text-gray-500">
                          {annotations.uploadedAt ? new Date(annotations.uploadedAt).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
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

export default function EvaluatedAnswers() {
  const [evaluatedAnswers, setEvaluatedAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [evaluatedSubTab, setEvaluatedSubTab] = useState('not_published');
  const [AnnotatedAnswer, setAnnotatedAnswer] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  
    const fetchEvaluatedManualAnswers = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get('http://localhost:5000/api/clients/CLI677117YN7N/mobile/userAnswers/crud/answers', {
          params: {
            evaluationMode: 'manual',
            submissionStatus: 'evaluated',
          },
        });
        if (response.data.success) {
          setEvaluatedAnswers(response.data.data.answers);
        } else {
          setError(response.data.message || 'Failed to fetch answers');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch answers');
      } finally {
        setLoading(false);
      }
    };
  
   useEffect(()=>{
   fetchEvaluatedManualAnswers();
   },[]);

  const publishanswer = async (id)=>{
    try {
      const response = await axios.put(`http://localhost:5000/api/clients/CLI677117YN7N/mobile/userAnswers/crud/answers/${id}/publish`)
      console.log(response);
      fetchEvaluatedManualAnswers();
    } 
    catch (error) {
      console.log(error)
    }
  }

  const publishedAnswers = evaluatedAnswers.filter(ans => ans.publishStatus === "published");
  const notPublishedAnswers = evaluatedAnswers.filter(ans => ans.publishStatus === "not_published");

  const getStatusBadge = (status) => {
    let variant = 'default';
    let text = status;
    if (status === 'evaluated') variant = 'info';
    return <Badge variant={variant} className="capitalize">{text}</Badge>;
  };

  const AnswerCard = ({ answer, publishType }) => (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 p-6 mb-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-start gap-3 mb-2">
            <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
              publishType === 'with annotation' ? 'bg-green-500' : 
              publishType === 'without annotation' ? 'bg-yellow-500' : 
              'bg-blue-500'
            }`}></div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 leading-tight">
                {answer.question?.question || 'N/A'}
              </h3>
              <p className="text-xs text-gray-400 mt-1">ID: {answer.question?._id}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(answer.submissionStatus)}
          {publishType === 'with annotation' && (
            <Badge variant="success" className="text-xs">With Annotation</Badge>
          )}
          {publishType ? (
            publishType === 'without annotation' && (
              <Badge variant="warning" className="text-xs">No Annotation</Badge>
            )
          ) : (
            answer.publishStatus === "not_published" && <Badge variant="warning" className="text-xs">No Annotation</Badge>
          )}
          {/* Annotated badge for published answers with annotation */}
          {answer.publishStatus === 'published' && answer.question?.evaluationType === 'with annotation' && answer.annotations && answer.annotations.length > 0 && (
            <Badge variant="success" className="text-xs bg-green-500">Annotated</Badge>
          )}
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">User</div>
          <div className="text-sm font-semibold text-gray-900">{answer.userId || 'N/A'}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Attempt</div>
          <div className="text-sm font-semibold text-gray-900">#{answer.attemptNumber}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Score</div>
          <div className="text-sm font-semibold text-gray-900">
            {answer.evaluation?.marks || 0}/{answer.question.metadata?.maximumMarks || 'N/A'}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Accuracy</div>
          <div className="text-sm font-semibold text-gray-900">{answer.evaluation?.accuracy || 0}%</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Evaluated</div>
          <div className="text-sm font-semibold text-gray-900">
            {answer.evaluatedAt ? new Date(answer.evaluatedAt).toLocaleDateString() : 'N/A'}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Status</div>
          <div className="text-sm font-semibold text-gray-900">
            {answer.publishStatus}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg shadow-md hover:from-gray-600 hover:to-gray-700 transition-all duration-200 font-medium flex items-center justify-center gap-2"
          onClick={() => setSelectedAnswer(answer)}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          View Details
        </button>
        {publishType === 'with annotation' && (
          <button
            className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow-md hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium flex items-center justify-center gap-2"
            onClick={() => {setAnnotatedAnswer(answer)}}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Publish with Annotation
          </button>
        )}
        {publishType?(
          publishType === 'without annotation' && (
            <button
              className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg shadow-md hover:from-yellow-600 hover:to-yellow-700 transition-all duration-200 font-medium flex items-center justify-center gap-2"
              onClick={() => {publishanswer(answer._id)}}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Publish without Annotation
            </button>
          )
        ):(answer.publishStatus ==="not_published" && (
          <button
          className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg shadow-md hover:from-yellow-600 hover:to-yellow-700 transition-all duration-200 font-medium flex items-center justify-center gap-2"
          onClick={() => {publishanswer(answer._id)}}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Publish without Annotation
        </button>
        )
        )
        }
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Evaluated Answers
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Review and manage answers that have been evaluated and are ready for publishing
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Total Evaluated</h3>
                <p className="text-gray-600">All evaluated answers</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">{evaluatedAnswers.length}</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Not Published</h3>
                <p className="text-gray-600">Ready for publishing</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-yellow-600">{notPublishedAnswers.length}</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Published</h3>
                <p className="text-gray-600">Already published</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">{publishedAnswers.length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-2 mb-8">
          <div className="flex">
            <button
              className={`flex-1 px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                evaluatedSubTab === 'not_published'
                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              onClick={() => setEvaluatedSubTab('not_published')}
            >
              Not Published ({notPublishedAnswers.length})
            </button>
            <button
              className={`flex-1 px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                evaluatedSubTab === 'published'
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              onClick={() => setEvaluatedSubTab('published')}
            >
              Published ({publishedAnswers.length})
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading evaluated answers...</p>
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
        ) : (
          <div className="space-y-6">
            {evaluatedSubTab === 'published' ? (
              publishedAnswers.length === 0 ? (
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Published Answers</h3>
                  <p className="text-gray-600">No answers have been published yet.</p>
                </div>
              ) : (
                publishedAnswers.map((answer) => (
                  <AnswerCard key={answer._id} answer={answer} />
                ))
              )
            ) : (
              notPublishedAnswers.length === 0 ? (
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Unpublished Answers</h3>
                  <p className="text-gray-600">All evaluated answers have been published!</p>
                </div>
              ) : (
                notPublishedAnswers.map((answer) => (
                  <AnswerCard
                    key={answer._id}
                    answer={answer}
                    publishType={answer.question.evaluationType}
                  />
                ))
              )
            )}
          </div>
        )}

        {/* Modals */}
        {AnnotatedAnswer && (
          <AnnotateAnswer
            submission={AnnotatedAnswer}
            onClose={() => setAnnotatedAnswer(null)}
          />
        )}
        <AnswerDetailsModal answer={selectedAnswer} open={!!selectedAnswer} onClose={() => setSelectedAnswer(null)} />
      </div>
    </div>
  );
} 