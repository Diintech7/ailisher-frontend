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
  Edit2,
  Trash2,
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

  const fetchTestDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `https://aipbbackend-c5ed.onrender.com/api/subjectivetest-questions/${testId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setTestDetails(response.data.questions);

      const testResponse = await axios.get(
        `https://aipbbackend-c5ed.onrender.com/api/subjectivetests/${testId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setTestInfo(testResponse.data.test);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
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
        `https://aipbbackend-c5ed.onrender.com/api/subjectivetest-questions/${testId}`,
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
        `https://aipbbackend-c5ed.onrender.com/api/subjectivetest-questions/${questionId}`,
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
        `https://aipbbackend-c5ed.onrender.com/api/subjectivetest-questions/${questionId}`,
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 mb-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {testInfo?.name || `Subjective Test`}
                </h1>
                <p className="text-gray-600 mt-1">
                  {testDetails?.length || 0} questions • Subjective Type
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end">
              {testInfo && (
                <div className=" rounded-xl ">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <BookOpen size={20} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Category</p>
                        <p className="text-lg font-semibold text-gray-900">{testInfo.category || "General"}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <Clock size={20} className="text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Estimated Time</p>
                        <p className="text-lg font-semibold text-gray-900">{testInfo.Estimated_time || "Not specified"}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <Target size={20} className="text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Questions</p>
                        <p className="text-lg font-semibold text-gray-900">{testDetails?.length || 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-orange-100 rounded-lg">
                        <Award size={20} className="text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Type</p>
                        <p className="text-lg font-semibold text-gray-900">Subjective</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Questions Section */}
      <div className="max-w-7xl ">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Questions ({testDetails?.length || 0})</h2>
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

          <div className="divide-y divide-gray-200">
            {testDetails?.map((question, index) => (
              <div key={question._id} className="p-6">
                <div className="flex items-start space-x-4">
                  {/* Question Number */}
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-600">{index + 1}</span>
                    </div>
                  </div>

                  {/* Question Content */}
                  <div className="flex-1 space-y-4">
                    {/* Question Text */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">{question.question}</h3>
                      <div className="flex items-center space-x-2">
                        <button
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                          onClick={() => {
                            const normalized = {
                              ...question,
                              id: question._id || question.id,
                              metadata:
                                question.metadata || {
                                  keywords: [],
                                  difficultyLevel: "level1",
                                  wordLimit: 0,
                                  estimatedTime: 0,
                                  maximumMarks: 0,
                                  qualityParameters: {
                                    intro: false,
                                    body: {
                                      enabled: false,
                                      features: false,
                                      examples: false,
                                      facts: false,
                                      diagram: false,
                                    },
                                    conclusion: false,
                                    customParams: [],
                                  },
                                },
                              answerVideoUrls: question.answerVideoUrls || [],
                            };
                            setEditingQuestion(normalized);
                            setShowAddQuestionModal(true);
                          }}
                          title="Edit Question"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                          onClick={() => handleDeleteSubjectiveQuestion(question._id || question.id)}
                          title="Delete Question"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Detailed Answer */}
                    {(question.detailedAnswer || question.answer) && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <p className="text-sm font-semibold text-blue-800 uppercase tracking-wide">Detailed Answer:</p>
                        </div>
                        <p className="text-blue-900 text-lg leading-relaxed">{question.detailedAnswer || question.answer}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

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
    </div>
  );
}


