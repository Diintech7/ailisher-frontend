import axios from "axios";
import React from "react";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Target,
  Award,
  FileText,
  Plus,
  Edit2,
  Trash2,
  Book,
  Upload,
  Search,
  MessageSquare,
} from "lucide-react";
import SubjectiveQuestionForm from "./components/forms/SubjectiveQuestionForm.jsx";
import AddAISWBModal from "./AddAISWBModal.jsx";

export default function QuestionBankSubjective() {
  const questionBankId = useParams().id;
  console.log(questionBankId);
  const navigate = useNavigate();
  const token = Cookies.get("usertoken");

  const [loading, setLoading] = useState(false);
  const [questionBank, setQuestionBank] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [activeView, setActiveView] = useState("questions");
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    question: "",
    detailedAnswer: "",
    modalAnswer: "",
    answerVideoUrls: [],
    metadata: {
      keywords: [],
      difficultyLevel: "level1",
      wordLimit: 100,
      estimatedTime: 5,
      maximumMarks: 10,
    },
    languageMode: "english",
    evaluationMode: "auto",
    evaluationType: "without annotation",
    evaluationGuideline: "",
  });

  const fetchQuestionBank = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:5000/api/questionbank/${questionBankId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setQuestionBank(response.data.data);
    } catch (error) {
      console.error("Error fetching question bank:", error);
      toast.error("Failed to load question bank details");
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:5000/api/questionbank/${questionBankId}/questions`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setQuestions(response.data.questions || []);
    } catch (error) {
      console.error("Error fetching questions:", error);
      toast.error("Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (questionBankId) {
      fetchQuestionBank();
      fetchQuestions();
    }
  }, [questionBankId]);

  const handleAddQuestion = async () => {
    try {
      const authToken = Cookies.get("usertoken");
      if (!authToken) {
        toast.error("Authentication required");
        return;
      }
      
      const payload = {
        question: formData.question,
        detailedAnswer: formData.detailedAnswer,
        modalAnswer: formData.modalAnswer,
        answerVideoUrls: formData.answerVideoUrls,
        metadata: formData.metadata,
        languageMode: formData.languageMode,
        evaluationMode: formData.evaluationMode,
        evaluationType: formData.evaluationType,
        evaluationGuideline: formData.evaluationGuideline,
        questionBankId: questionBankId,
      };

      const res = await axios.post(
        `http://localhost:5000/api/questionbank/${questionBankId}/questions`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (res.data.success) {
        toast.success("Question added successfully");
        setShowQuestionModal(false);
        setEditingQuestion(null);
        fetchQuestions();
      } else {
        toast.error(res.data.message || "Failed to add question");
      }
    } catch (error) {
      console.error("Error adding question:", error);
      toast.error("Failed to add question");
    }
  };

  if (loading && !questionBank) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading question bank...</p>
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
      
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/4 lg:w-1/5">
              <div className="bg-gradient-to-br from-indigo-50 to-blue-100 rounded-lg h-48 flex items-center justify-center overflow-hidden">
                {questionBank?.coverImageUrl ? (
                  <img
                    src={questionBank.coverImageUrl}
                    className="h-full w-full object-fill rounded-lg"
                    alt={questionBank.title}
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
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {questionBank?.title || "Question Bank"}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {questions.length} questions • Subjective Type
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-start flex-1">
                {questionBank && (
                  <div className="rounded-xl">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                      <div className="flex items-center space-x-6">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <BookOpen size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Category</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {questionBank.category || "General"}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-green-100 rounded-lg">
                          <Clock size={20} className="text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Questions</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {questions.length}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-purple-100 rounded-lg">
                          <Target size={20} className="text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Type</p>
                          <p className="text-lg font-semibold text-gray-900">Subjective</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-orange-100 rounded-lg">
                          <Award size={20} className="text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Status</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {questionBank.status || "Draft"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap gap-4 mt-6">
                <div className="inline-flex rounded-md border border-gray-300 overflow-hidden">
                  <button
                    onClick={() => setActiveView("questions")}
                    className={`px-4 py-2 text-sm ${
                      activeView === "questions"
                        ? "bg-gray-800 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Questions
                  </button>
                  <button
                    onClick={() => setActiveView("uploadPdf")}
                    className={`px-4 py-2 text-sm ${
                      activeView === "uploadPdf"
                        ? "bg-gray-800 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Upload PDF
                  </button>
                </div>

                <button
                  onClick={() => {
                    setEditingQuestion(null);
                    setFormData({
                      question: "",
                      detailedAnswer: "",
                      modalAnswer: "",
                      answerVideoUrls: [],
                      metadata: {
                        keywords: [],
                        difficultyLevel: "level1",
                        wordLimit: 100,
                        estimatedTime: 5,
                        maximumMarks: 10,
                      },
                      languageMode: "english",
                      evaluationMode: "auto",
                      evaluationType: "without annotation",
                      evaluationGuideline: "",
                    });
                    setShowQuestionModal(true);
                  }}
                  className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  <Plus size={16} className="mr-2" />
                  <span>Add Question</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {activeView === "questions" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Subjective Questions Management
                </h3>
                <p className="text-gray-600 mb-6">
                  Manage your subjective questions here. Add new questions or upload PDF files to extract questions.
                </p>
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center mx-auto"
                  onClick={() => {
                    setEditingQuestion(null);
                    setFormData({
                      question: "",
                      detailedAnswer: "",
                      modalAnswer: "",
                      answerVideoUrls: [],
                      metadata: {
                        keywords: [],
                        difficultyLevel: "level1",
                        wordLimit: 100,
                        estimatedTime: 5,
                        maximumMarks: 10,
                      },
                      languageMode: "english",
                      evaluationMode: "auto",
                      evaluationType: "without annotation",
                      evaluationGuideline: "",
                    });
                    setShowQuestionModal(true);
                  }}
                >
                  <Plus size={16} className="mr-2" />
                  Add Question
                </button>
              </div>
            </div>
          </div>
        )}

        {activeView === "uploadPdf" && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Upload size={32} className="text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Upload PDF to Extract Questions
                </h3>
                <p className="text-gray-600 mb-6">
                  Upload a PDF file containing subjective questions. The system will automatically extract and create questions.
                </p>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                  <Upload size={48} className="text-gray-400 mx-auto mb-4" />
                  <span className="text-lg font-medium text-gray-700 mb-2 block">
                    Click to select PDF file
                  </span>
                  <span className="text-sm text-gray-500">
                    or drag and drop
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Question Modal */}
        {showQuestionModal && (
          <AddAISWBModal
          isOpen={showQuestionModal}
          onClose={() => {
            setShowQuestionModal(false);
            setEditingQuestion(null);
          }}
          onAddQuestion={handleAddQuestion}
        //   onEditQuestion={handleEditQuestion}
          editingQuestion={editingQuestion}
        />
        )}
      </div>
    </>
  );
}
