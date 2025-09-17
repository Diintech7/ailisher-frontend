import axios from "axios";
import React from "react";
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { useEffect } from "react";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Target,
  Award,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  Users,
  Calendar,
  Plus,
  Eye,
  EyeOff,
  QrCode,
  Download,
  Edit2,
  Trash2,
  Book,
  Search,
} from "lucide-react";
import AddAISWBModal from "./AddAISWBModal";

export default function SubjectiveTestDetail() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const token = Cookies.get("usertoken");

  const [loading, setLoading] = useState(false);
  const [testDetails, setTestDetails] = useState(null);
  const [testInfo, setTestInfo] = useState(null);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showQuestionDetails, setShowQuestionDetails] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [qrSize, setQrSize] = useState(300);
  const [loadingQR, setLoadingQR] = useState(false);
  const [qrError, setQrError] = useState(null);

  const fetchTestDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `https://test.ailisher.com/api/subjectivetest-questions/${testId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setTestDetails(response.data.questions);

      const testResponse = await axios.get(
        `https://test.ailisher.com/api/subjectivetests/${testId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setTestInfo(testResponse.data.test);
      console.log(testResponse.data.test);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewQuestion = (question) => {
    setSelectedQuestion(question);
    setShowQuestionDetails(true);
  };

  const generateFallbackQRCode = (question, size = qrSize) => {
    try {
      const qId = question.id || question._id;
      const preview = String(question.question || "").substring(0, 100);
      const payload = {
        id: qId,
        preview,
        type: "subjective-test-question",
        testId,
        timestamp: new Date().toISOString(),
      };
      const qrContent = JSON.stringify(payload);
      const qrCodeURL = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(qrContent)}`;
      setQrCodeData({ qrCodeDataURL: qrCodeURL, success: true, size, dataSize: qrContent.length });
      return true;
    } catch (e) {
      console.error("Error generating fallback QR code:", e);
      return false;
    }
  };

  const handleGenerateQR = async (question) => {
    setSelectedQuestion(question);
    setShowQRModal(true);
    setLoadingQR(true);
    setQrError(null);
    try {
      // Use fallback generator for subjective questions
      generateFallbackQRCode(question, qrSize);
    } catch (e) {
      setQrError("Failed to generate QR code");
    } finally {
      setLoadingQR(false);
    }
  };

  const handleDownloadQR = async () => {
    if (!qrCodeData?.qrCodeDataURL || !selectedQuestion) return;
    try {
      const response = await fetch(qrCodeData.qrCodeDataURL);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `subjective-question-${selectedQuestion.id || selectedQuestion._id}-qrcode.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (e) {
      console.error("Error downloading QR code:", e);
    }
  };

  useEffect(() => {
    fetchTestDetails();
  }, [testId]);

  // CRUD handlers
  const handleAddSubjectiveQuestion = async (newQuestion) => {
    try {
      const authToken = Cookies.get("usertoken");
      if (!authToken) {
        toast.error("Authentication required");
        return false;
      }
      const res = await fetch(
        `https://test.ailisher.com/api/subjectivetest-questions/${testId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ question: newQuestion }),
        }
      );
      const data = await res.json();
      if (data.success) {
        await fetchTestDetails();
        return true;
      }
      toast.error(data.message || "Failed to add question");
      return false;
    } catch (e) {
      console.error("Add subjective question error:", e);
      toast.error("Failed to connect to the server");
      return false;
    }
  };

  const handleEditSubjectiveQuestion = async (editedQuestion) => {
    try {
      const authToken = Cookies.get("usertoken");
      if (!authToken) {
        toast.error("Authentication required");
        return false;
      }
      const questionId = editedQuestion.id || editedQuestion._id;
      const { id, _id, ...questionBody } = editedQuestion;
      const res = await fetch(
        `https://test.ailisher.com/api/subjectivetest-questions/${questionId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ question: questionBody }),
        }
      );
      const data = await res.json();
      if (data.success) {
        await fetchTestDetails();
        return true;
      }
      toast.error(data.message || "Failed to update question");
      return false;
    } catch (e) {
      console.error("Edit subjective question error:", e);
      toast.error("Failed to connect to the server");
      return false;
    }
  };

  const handleDeleteSubjectiveQuestion = async (questionId) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    try {
      const authToken = Cookies.get("usertoken");
      if (!authToken) {
        toast.error("Authentication required");
        return;
      }
      const res = await fetch(
        `https://test.ailisher.com/api/subjectivetest-questions/${questionId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      const data = await res.json();
      if (data.success) {
        await fetchTestDetails();
        toast.success("Question deleted successfully");
      } else {
        toast.error(data.message || "Failed to delete question");
      }
    } catch (e) {
      console.error("Delete subjective question error:", e);
      toast.error("Failed to connect to the server");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading test details...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-2">
      <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors flex gap-4 justify-center items-center"
        >
          <ArrowLeft size={20} className="text-gray-600" />
          Back
      </button>
      </div>
      <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/4 lg:w-1/5">
              <div className="bg-gradient-to-br from-indigo-50 to-blue-100 rounded-lg h-40 flex items-center justify-center overflow-hidden">
                {testInfo ? (
                  <img
                    src={testInfo.imageUrl}
                    className="h-full w-full object-fill rounded-lg"
                  />
                ) : (
                  <div className="text-center">
                    <Book size={64} className="mx-auto text-indigo-400" />
                  </div>
                )}
              </div>
            </div>
            <div className="md:w-3/4 lg:w-4/5">
              <div className="flex flex-col sm:flex-row justify-start items-start sm:items-center mb-4">
                <h1 className="text-3xl font-bold text-gray-800"></h1>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {testInfo?.name || "Subjective Test"}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {
                      testInfo?.questions?.length || 0
                    }
                    questions • Subjective Type
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-start flex-1">
                {testInfo && (
                  <div className="rounded-xl">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 ">
                      <div className="flex items-center space-x-6">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <BookOpen size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            Category
                          </p>
                          <p className="text-lg font-semibold text-gray-900">
                            {testInfo.category || "General"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-green-100 rounded-lg">
                          <Clock size={20} className="text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            Estimated Time
                          </p>
                          <p className="text-lg font-semibold text-gray-900">
                            {testInfo.Estimated_time || "Not specified"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-purple-100 rounded-lg">
                          <Target size={20} className="text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            Questions
                          </p>
                          <p className="text-lg font-semibold text-gray-900">
                             {testInfo?.questions?.length || 0}                            
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-orange-100 rounded-lg">
                          <Award size={20} className="text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            Type
                          </p>
                          <p className="text-lg font-semibold text-gray-900">
                            Subjective
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
          {/* Filters and Search */}
        <div className="w-full mx-auto ">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-1 flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Search questions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="createdAt">Date Created</option>
                  <option value="difficulty">Difficulty</option>
                  <option value="question">Question Text</option>
                </select>

                <button
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                  className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
              onClick={() => {
                setEditingQuestion(null);
                setShowAddQuestionModal(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus size={16} className="mr-2" />
              Add Question
                </button>
              </div>
            </div>
          </div>
        </div>
      {/* Questions List (modeled like AISWBQuestions) */}
      {Array.isArray(testDetails) && testDetails.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="space-y-4">
              {(testDetails
                ?.filter((q) => {
                  if (!searchTerm) return true;
                  const t = searchTerm.toLowerCase();
                  const text = String(q?.question || "").toLowerCase();
                  return text.includes(t);
                }) || [])
                .map((question, index) => (
                  <div
                    key={question.id || question._id || index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-grow">
                      <h3 className="text-lg font-medium text-gray-800">{question.question}</h3>
                      <div className="flex items-center mt-2 space-x-4 text-sm text-gray-600">
                        <span>
                          Difficulty: {question?.metadata?.difficultyLevel || question?.difficulty || "level1"}
                        </span>
                        {question?.metadata?.maximumMarks != null && (
                          <span>Marks: {question.metadata.maximumMarks}</span>
                        )}
                        {question?.metadata?.estimatedTime != null && (
                          <span>Time: {question.metadata.estimatedTime}m</span>
                        )}
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
                        onClick={() => handleGenerateQR(question)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
                        title="Generate QR Code"
                      >
                        <QrCode size={18} />
                      </button>
                      <button
                        onClick={() => {
                          setEditingQuestion(question);
                          setShowAddQuestionModal(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                        title="Edit Question"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteSubjectiveQuestion(question.id || question._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="Delete Question"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!testDetails || testDetails.length === 0) && !loading && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <FileText size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Questions Found</h3>
            <p className="text-gray-600 mb-6">This test doesn't have any questions yet.</p>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft size={16} className="mr-2" />
              Go Back
            </button>
          </div>
        </div>
      )}

      {showAddQuestionModal && (
        <AddAISWBModal
          isOpen={showAddQuestionModal}
          onClose={() => {
            setShowAddQuestionModal(false);
            setEditingQuestion(null);
          }}
          onAddQuestion={handleAddSubjectiveQuestion}
          onEditQuestion={handleEditSubjectiveQuestion}
          editingQuestion={editingQuestion}
        />
      )}

      {showQuestionDetails && selectedQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Question Details</h3>
              <button
                onClick={() => setShowQuestionDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h4 className="text-lg font-semibold text-blue-800 mb-2">Question</h4>
                <p className="text-gray-800">{selectedQuestion.question}</p>
              </div>
              {selectedQuestion?.metadata && (
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                  <h4 className="text-lg font-semibold text-purple-800 mb-3">Metadata</h4>
                  <div className="grid grid-cols-2 gap-4 text-gray-800">
                    <div>
                      <p className="text-sm font-medium text-purple-700">Difficulty</p>
                      <p>{selectedQuestion.metadata.difficultyLevel || selectedQuestion.difficulty || "level1"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-700">Estimated Time</p>
                      <p>{selectedQuestion.metadata.estimatedTime ?? "-"} minutes</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-700">Maximum Marks</p>
                      <p>{selectedQuestion.metadata.maximumMarks ?? "-"}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showQRModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800">QR Code</h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-col items-center">
              {loadingQR ? (
                <div className="bg-gray-100 rounded-lg h-64 w-64 flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600 mb-3"></div>
                  <p className="text-gray-600">Generating QR code...</p>
                </div>
              ) : qrError ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 w-full text-center">
                  <p className="text-red-600 font-medium mb-3">QR Code Generation Failed</p>
                  <p className="text-red-600 mb-4 text-sm">{qrError}</p>
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
                </div>
              )}

              {qrCodeData?.qrCodeDataURL && (
                <button
                  onClick={handleDownloadQR}
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
    </div>
    </>
  );
}


