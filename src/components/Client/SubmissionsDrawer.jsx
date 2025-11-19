import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../../config';
import {
  Loader2,
  ArrowLeft,
  Image as ImageIcon,
  Sparkles,
  UserCheck,
  CheckCircle2,
  Clock,
  Star,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  FileText,
  Award,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
} from 'lucide-react';

const SUBMISSION_TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'ai_evaluated', label: 'AI Evaluated' },
  { key: 'expert_evaluation', label: 'Expert Evaluation' },
  { key: 'completed', label: 'Completed' },
];

const formatDateTime = (value) => {
  if (!value) return 'N/A';
  try {
    return new Date(value).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
};

const SubmissionsPage = () => {
  const { questionId } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [activeTab, setActiveTab] = useState('pending');
  const [tabTotals, setTabTotals] = useState({
    pending: 0,
    ai_evaluated: 0,
    expert_evaluation: 0,
    completed: 0,
  });
  useEffect(() => {
    if (questionId) {
      fetchQuestion();
      fetchSubmissions(activeTab);
      fetchAllTabTotals();
    }
  }, [questionId]);

  useEffect(() => {
    if (questionId && activeTab) {
      fetchSubmissions(activeTab);
    }
  }, [activeTab]);

  const fetchQuestion = async () => {
    if (!questionId) return;

    try {
      const token = Cookies.get('usertoken');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(
        `${API_BASE_URL}/api/myquestion/questions/${questionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setQuestion(data.data);
      }
    } catch (err) {
      console.error('Fetch question error:', err);
    }
  };

  const fetchAllTabTotals = async () => {
    await Promise.all(
      SUBMISSION_TABS.map((tab) =>
        fetchSubmissions(tab.key, { onlyTotal: true, suppressLoading: true })
      )
    );
  };

  const fetchSubmissions = async (status = null, options = {}) => {
    const { onlyTotal = false, suppressLoading = false } = options;
    if (!questionId) return;

    if (!suppressLoading) {
      setLoading(true);
    }
    setError(null);

    try {
      const token = Cookies.get('usertoken');
      if (!token) {
        throw new Error('Authentication required');
      }

      // Map tab key to evaluationStatus
      const statusMap = {
        'pending': 'pending',
        'ai_evaluated': 'ai_evaluated',
        'expert_evaluation': 'expert_evaluated',
        'completed': 'completed'
      };

      const currentTab = status || activeTab;
      const evaluationStatus = status ? statusMap[status] || status : statusMap[activeTab] || 'pending';

      const url = new URL(
        `${API_BASE_URL}/api/myquestion/questions/${questionId}/answers`
      );
      url.searchParams.set('status', evaluationStatus);

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('Fetched submissions:', data.data.answers);

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch submissions');
      }

      if (!onlyTotal) {
        setSubmissions(data.data?.answers || []);
      }
      setTabTotals(prev => ({
        ...prev,
        [currentTab]: data.data?.total || 0,
      }));
    } catch (err) {
      console.error('Fetch submissions error:', err);
      if (!onlyTotal) {
        setError(err.message || 'Failed to load submissions');
        toast.error(err.message || 'Failed to load submissions');
      }
    } finally {
      if (!suppressLoading) {
        setLoading(false);
      }
    }
  };

  const handleAIEvaluate = async (submissionId) => {
    try {
      const token = Cookies.get('usertoken');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      setActionLoading((prev) => ({ ...prev, [`evaluate-${submissionId}`]: true }));

      const response = await fetch(
        `${API_BASE_URL}/api/userAnswers/${submissionId}/evaluate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Evaluation failed');
      }

      toast.success('AI evaluation completed successfully');
      fetchSubmissions(activeTab);
    } catch (err) {
      console.error('AI evaluation error:', err);
      toast.error(err.message || 'Failed to run AI evaluation');
    } finally {
      setActionLoading((prev) => ({ ...prev, [`evaluate-${submissionId}`]: false }));
    }
  };

  const handleSendToExpert = async (submissionId) => {
    try {
      const token = Cookies.get('usertoken');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      setActionLoading((prev) => ({ ...prev, [`expert-${submissionId}`]: true }));

      const response = await fetch(
        `${API_BASE_URL}/api/myquestion/questions/${submissionId}/send-to-expert`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to send to expert review');
      }

      toast.success('Submission sent to expert review');
      fetchSubmissions(activeTab);
    } catch (err) {
      console.error('Send to expert error:', err);
      toast.error(err.message || 'Failed to send to expert review');
    } finally {
      setActionLoading((prev) => ({ ...prev, [`expert-${submissionId}`]: false }));
    }
  };

  // Submissions are already filtered by the backend based on evaluationStatus
  // So we can use them directly
  const filteredSubmissions = submissions || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/my-question')}
            className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-gray-900">Submissions</h1>
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">
              {question?.question || 'Loading question...'}
            </p>
          </div>
        </div>
      </div>

        {/* Submission Tabs */}
      <div className="border-b border-gray-200 bg-white px-6 py-3">
        <div className="flex flex-wrap gap-2">
          {SUBMISSION_TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label} ({tabTotals[tab.key] ?? 0})
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              {error}
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 text-center text-gray-500">
              <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-sm font-medium">No submissions in this category</p>
              <p className="mt-2 text-xs">Submissions will appear here once available.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSubmissions.map((submission, index) => (
                <div
                  key={submission._id || index}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-3">
                        <h3 className="text-sm font-semibold text-gray-900">
                          Submission #{index + 1}
                        </h3>
                      </div>
                      {submission.submittedAt && (
                        <p className="text-xs text-gray-500">
                          Submitted on {formatDateTime(submission.submittedAt)}
                        </p>
                      )}
                      {submission.evaluatedAt && (
                        <p className="text-xs text-gray-500">
                          Evaluated on {formatDateTime(submission.evaluatedAt)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Answer Images */}
                  <div className="mb-4">
                    <div className="mb-2 text-xs font-medium text-gray-700">Answer Images:</div>
                    {Array.isArray(submission.answerImages) &&
                    submission.answerImages.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {submission.answerImages.map((image, imgIndex) => (
                          <div
                            key={image._id || imgIndex}
                            className="relative overflow-hidden rounded border border-gray-200"
                          >
                            <img
                              src={image.imageUrl}
                              alt={image.originalName || `Answer ${imgIndex + 1}`}
                              className="h-32 w-32 object-cover"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src =
                                  'https://via.placeholder.com/128?text=Image';
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center text-xs text-gray-500">
                        <ImageIcon className="mr-1 h-3 w-3" />
                        No images uploaded.
                      </div>
                    )}
                  </div>

     
                  {/* AI Evaluation Results */}
                  {activeTab !== 'pending' && submission.evaluation && (
                    <div className="mb-4 rounded-lg border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50 p-5 shadow-sm">
                      <div className="mb-4 flex items-center gap-2 border-b border-purple-200 pb-3">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                        <h4 className="text-base font-semibold text-purple-900">AI Evaluation Results</h4>
                        {submission.evaluatedAt && (
                          <span className="ml-auto text-xs text-purple-600">
                            {formatDateTime(submission.evaluatedAt)}
                          </span>
                        )}
                      </div>

                      {/* Score Section */}
                      {submission.evaluation.score !== undefined && (
                        <div className="mb-4 rounded-lg bg-white p-4 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Award className="h-5 w-5 text-purple-600" />
                              <span className="text-sm font-semibold text-gray-700">Overall Score</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-3xl font-bold text-purple-700">
                                {submission.evaluation.score}
                              </span>
                              {submission.evaluation.relevancy !== undefined && (
                                <span className="text-xs text-gray-500">
                                  / {submission.evaluation.relevancy || 100}
                                </span>
                              )}
                            </div>
                          </div>
                          {submission.evaluation.relevancy !== undefined && (
                            <div className="mt-3">
                              <div className="mb-1 flex items-center justify-between text-xs">
                                <span className="text-gray-600">Relevancy</span>
                                <span className="font-medium text-gray-700">{submission.evaluation.relevancy}%</span>
                              </div>
                              <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                                <div
                                  className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all"
                                  style={{ width: `${submission.evaluation.relevancy}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Remark */}
                      {submission.evaluation.remark && (
                        <div className="mb-4 rounded-lg bg-white p-4 shadow-sm">
                          <div className="mb-2 flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-purple-600" />
                            <span className="text-sm font-semibold text-gray-700">Overall Remark</span>
                          </div>
                          <p className="text-sm leading-relaxed text-gray-700">
                            {submission.evaluation.remark}
                          </p>
                        </div>
                      )}

                      {/* Analysis Section */}
                      {submission.evaluation.analysis && (
                        <div className="mb-4 space-y-3">
                          {/* Strengths */}
                          {submission.evaluation.analysis.strengths && 
                           Array.isArray(submission.evaluation.analysis.strengths) && 
                           submission.evaluation.analysis.strengths.length > 0 && (
                            <div className="rounded-lg bg-green-50 p-4 border border-green-200">
                              <div className="mb-3 flex items-center gap-2">
                                <ThumbsUp className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-semibold text-green-900">Strengths</span>
                              </div>
                              <ul className="space-y-2">
                                {submission.evaluation.analysis.strengths.map((strength, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-sm text-green-800">
                                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                                    <span>{strength}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Weaknesses */}
                          {submission.evaluation.analysis.weaknesses && 
                           Array.isArray(submission.evaluation.analysis.weaknesses) && 
                           submission.evaluation.analysis.weaknesses.length > 0 && (
                            <div className="rounded-lg bg-amber-50 p-4 border border-amber-200">
                              <div className="mb-3 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-amber-600" />
                                <span className="text-sm font-semibold text-amber-900">Areas for Improvement</span>
                              </div>
                              <ul className="space-y-2">
                                {submission.evaluation.analysis.weaknesses.map((weakness, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-sm text-amber-800">
                                    <TrendingDown className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                                    <span>{weakness}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Suggestions */}
                          {submission.evaluation.analysis.suggestions && 
                           Array.isArray(submission.evaluation.analysis.suggestions) && 
                           submission.evaluation.analysis.suggestions.length > 0 && (
                            <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
                              <div className="mb-3 flex items-center gap-2">
                                <Lightbulb className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-semibold text-blue-900">Suggestions</span>
                              </div>
                              <ul className="space-y-2">
                                {submission.evaluation.analysis.suggestions.map((suggestion, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-sm text-blue-800">
                                    <Star className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
                                    <span>{suggestion}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Detailed Analysis Sections */}
                          {submission.evaluation.analysis.introduction && 
                           Array.isArray(submission.evaluation.analysis.introduction) && 
                           submission.evaluation.analysis.introduction.length > 0 && (
                            <div className="rounded-lg bg-white p-4 border border-gray-200">
                              <div className="mb-2 text-sm font-semibold text-gray-700">Introduction Analysis</div>
                              <ul className="space-y-1">
                                {submission.evaluation.analysis.introduction.map((item, idx) => (
                                  <li key={idx} className="text-sm text-gray-600">• {item}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {submission.evaluation.analysis.body && 
                           Array.isArray(submission.evaluation.analysis.body) && 
                           submission.evaluation.analysis.body.length > 0 && (
                            <div className="rounded-lg bg-white p-4 border border-gray-200">
                              <div className="mb-2 text-sm font-semibold text-gray-700">Body Analysis</div>
                              <ul className="space-y-1">
                                {submission.evaluation.analysis.body.map((item, idx) => (
                                  <li key={idx} className="text-sm text-gray-600">• {item}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {submission.evaluation.analysis.conclusion && 
                           Array.isArray(submission.evaluation.analysis.conclusion) && 
                           submission.evaluation.analysis.conclusion.length > 0 && (
                            <div className="rounded-lg bg-white p-4 border border-gray-200">
                              <div className="mb-2 text-sm font-semibold text-gray-700">Conclusion Analysis</div>
                              <ul className="space-y-1">
                                {submission.evaluation.analysis.conclusion.map((item, idx) => (
                                  <li key={idx} className="text-sm text-gray-600">• {item}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Comments */}
                      {submission.evaluation.comments && (
                        <div className="mb-4 rounded-lg bg-white p-4 shadow-sm">
                          <div className="mb-2 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-purple-600" />
                            <span className="text-sm font-semibold text-gray-700">Detailed Comments</span>
                          </div>
                          {Array.isArray(submission.evaluation.comments) ? (
                            <ul className="space-y-2">
                              {submission.evaluation.comments.map((comment, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-purple-500" />
                                  <span>{comment}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-gray-700">{submission.evaluation.comments}</p>
                          )}
                        </div>
                      )}

                      {/* Feedback */}
                      {submission.evaluation.feedback && (
                        <div className="rounded-lg bg-white p-4 shadow-sm">
                          <div className="mb-2 flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-purple-600" />
                            <span className="text-sm font-semibold text-gray-700">Feedback</span>
                          </div>
                          {Array.isArray(submission.evaluation.feedback) ? (
                            <ul className="space-y-2">
                              {submission.evaluation.feedback.map((fb, idx) => (
                                <li key={idx} className="text-sm text-gray-700">• {fb}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-gray-700">{submission.evaluation.feedback}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}


                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 border-t border-gray-200 pt-3">
                    {activeTab === 'pending' && (
                      <button
                        onClick={() => handleAIEvaluate(submission._id)}
                        disabled={actionLoading[`evaluate-${submission._id}`]}
                        className="inline-flex items-center gap-2 rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {actionLoading[`evaluate-${submission._id}`] ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Evaluating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3 w-3" />
                            AI Evaluate
                          </>
                        )}
                      </button>
                    )}

                    {activeTab === 'ai_evaluated' && (
                      <button
                        onClick={() => handleSendToExpert(submission._id)}
                        disabled={actionLoading[`expert-${submission._id}`]}
                        className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {actionLoading[`expert-${submission._id}`] ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-3 w-3" />
                            Send to Expert
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
  );
};

export default SubmissionsPage;

