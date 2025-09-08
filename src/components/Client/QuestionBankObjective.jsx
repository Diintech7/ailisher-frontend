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
  CheckCircle,
  Plus,
  Edit2,
  Trash2,
  Book,
  Database,
  Edit,
  Upload,
  Download,
  Filter,
  Search,
  Eye,
  EyeOff,
  BarChart3,
  Users,
  Calendar,
  Star,
  AlertCircle,
  CheckSquare,
  Square,
} from "lucide-react";
import ObjectiveQuestionForm from "./components/forms/ObjectiveQuestionForm.jsx";
import TextFromImage from "./QuestionBankTextExtract.jsx";
import MarkdownQuestionForm from "./MarkdownQuestionForm.jsx";
import { API_BASE_URL } from "../../config.js";
import QuestionBankText from "./QuestionBankTextExtract.jsx";

export default function QuestionBankObjective() {
  const questionBankId = useParams().id;
  const navigate = useNavigate();
  const token = Cookies.get("usertoken");

  const [loading, setLoading] = useState(false);
  const [questionBank, setQuestionBank] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [activeLevel, setActiveLevel] = useState("L1");
  const [showUploadView, setShowUploadView] = useState(false);
  const [showMarkdownForm, setShowMarkdownForm] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showPdfUpload, setShowPdfUpload] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [bulkActions, setBulkActions] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);

  const [formData, setFormData] = useState({
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    difficulty: "L1",
    estimatedTime: 1,
    positiveMarks: 1,
    negativeMarks: 0,
    solution: {
      type: "text",
      text: "",
      video: { url: "", title: "", description: "", duration: 0 },
      image: { url: "", caption: "" },
    },
  });

  const fetchQuestionBank = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/api/questionbank/${questionBankId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setQuestionBank(response.data.data);
      console.log(response.data.data);
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
      // This would need to be updated based on your actual API structure
      console.log(questionBankId);
      const response = await axios.get(
        `${API_BASE_URL}/api/questionbank/${questionBankId}/questions`,
        {
          headers: { Authorization: `Bearer ${token}` },
          // params: {
          //   difficulty: filterDifficulty !== "all" ? filterDifficulty : undefined,
          //   search: searchTerm || undefined,
          //   sortBy,
          //   sortOrder,
          // },
        }
      );
      console.log(response.data.questions);
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
  }, [questionBankId, filterDifficulty, searchTerm, sortBy, sortOrder]);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "L1":
      case "level1":
        return "bg-green-100 text-green-800";
      case "L2":
      case "level2":
        return "bg-yellow-100 text-yellow-800";
      case "L3":
      case "level3":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDifficultyLabel = (difficulty) => {
    switch (difficulty) {
      case "L1":
      case "level1":
        return "Beginner";
      case "L2":
      case "level2":
        return "Intermediate";
      case "L3":
      case "level3":
        return "Advanced";
      default:
        return difficulty;
    }
  };

  const questionsByLevel = questions.reduce((acc, question) => {
    const level = question.difficulty || "L1";
    if (!acc[level]) {
      acc[level] = [];
    }
    acc[level].push(question);
    return acc;
  }, {});

  const getLevelQuestions = (level) => {
    return questionsByLevel[level] || [];
  };

 
  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;

    try {
      const authToken = Cookies.get("usertoken");
      if (!authToken) {
        toast.error("Authentication required");
        return;
      }

      const res = await axios.delete(
        `${API_BASE_URL}/api/questionbank/${questionId}/question`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      if (res.data.success) {
        toast.success("Question deleted successfully");
        fetchQuestions();
      } else {
        toast.error(res.data.message || "Failed to delete question");
      }
    } catch (error) {
      console.error("Error deleting question:", error);
      toast.error("Failed to delete question");
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedQuestions.length} questions?`)) return;

    try {
      const authToken = Cookies.get("usertoken");
      if (!authToken) {
        toast.error("Authentication required");
        return;
      }

      console.log("Bulk delete request:", {
        url: `${API_BASE_URL}/api/questionbank/${questionBankId}/questions/bulk`,
        questionIds: selectedQuestions,
        questionBankId
      });

      const res = await axios({
        method: 'DELETE',
        url: `${API_BASE_URL}/api/questionbank/${questionBankId}/questions/bulk`,
        headers: { 
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: { questionIds: selectedQuestions }
      });

      console.log("Bulk delete response:", res.data);

      if (res.data.success) {
        toast.success(`${res.data.deletedCount || selectedQuestions.length} questions deleted successfully`);
        setSelectedQuestions([]);
        setBulkActions(false);
        fetchQuestions();
      } else {
        toast.error(res.data.message || "Failed to delete questions");
      }
    } catch (error) {
      console.error("Error bulk deleting questions:", error);
      console.error("Error response:", error.response?.data);
      toast.error(error.response?.data?.message || "Failed to delete questions");
    }
  };

  const toggleQuestionSelection = (questionId) => {
    setSelectedQuestions(prev =>
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const toggleAllQuestions = () => {
    const currentLevelQuestions = getLevelQuestions(activeLevel);
    const allSelected = currentLevelQuestions.every(q => selectedQuestions.includes(q._id));
    
    if (allSelected) {
      setSelectedQuestions(prev => prev.filter(id => !currentLevelQuestions.some(q => q._id === id)));
    } else {
      const newSelected = [...selectedQuestions];
      currentLevelQuestions.forEach(q => {
        if (!newSelected.includes(q._id)) {
          newSelected.push(q._id);
        }
      });
      setSelectedQuestions(newSelected);
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
              <div className="bg-gradient-to-br from-indigo-50 to-blue-100 rounded-lg h-40 flex items-center justify-center overflow-hidden">
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
                <div className="flex items-center gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {questionBank?.title || "Question Bank"}
                    </h1>
                    <p className="text-gray-600 mt-1">
                      {questions.length} questions • Objective Type
                    </p>
                  </div>
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
                          <p className="text-lg font-semibold text-gray-900">Objective</p>
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
            </div>
          </div>
        </div>

        {/* Main Content - Show Questions View, Upload View, or Markdown Form View */}
        {!showUploadView && !showMarkdownForm ? (
          // Questions View
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Filters and Search */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-4">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-1 flex-col sm:flex-row gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
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
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                    className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    {sortOrder === "asc" ? "↑" : "↓"}
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => setShowUploadView(true)}
                    className="px-4 py-2 text-sm bg-black text-white rounded-md shadow-md hover:bg-gray-800 transition-colors"
                  >
                    Upload PDF
                  </button>

                  {/* New Markdown Form Button */}
                                     <button
                     onClick={() => {
                       setEditingQuestion(null);
                       setShowMarkdownForm(true);
                     }}
                     className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
                   >
                     <Plus size={16} className="mr-2" />
                     Add Question
                   </button>

                </div>
              </div>
            </div>

            {/* Questions by Difficulty Level */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="border-b border-gray-200">
                <div className="flex">
                  {["L1", "L2", "L3"].map((level) => (
                    <button
                      key={level}
                      onClick={() => setActiveLevel(level)}
                      className={`flex-1 py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                        activeLevel === level
                          ? "border-blue-500 text-blue-600 bg-blue-50"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {level === "L1"
                        ? "Beginner"
                        : level === "L2"
                        ? "Intermediate"
                        : "Advanced"}
                      <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                        {getLevelQuestions(level).length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Questions Content */}
              <div className="p-6">
                {getLevelQuestions(activeLevel).length === 0 ? (
                  <div className="text-center py-12 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                      <FileText size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Questions Available
                    </h3>
                    <p className="text-gray-600 mb-6">
                      There are no questions for the{" "}
                      {activeLevel === "L1"
                        ? "Beginner"
                        : activeLevel === "L2"
                        ? "Intermediate"
                        : "Advanced"}{" "}
                      level yet.
                    </p>
                    <button
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
                                             onClick={() => {
                         setEditingQuestion(null);
                         setShowMarkdownForm(true);
                       }}
                    >
                      <Plus size={16} className="mr-2" />
                      Add Question
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Bulk Selection Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={toggleAllQuestions}
                          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
                        >
                          {getLevelQuestions(activeLevel).every(q => selectedQuestions.includes(q._id)) ? (
                            <CheckSquare size={16} className="text-blue-600" />
                          ) : (
                            <Square size={16} />
                          )}
                          Select All
                        </button>
                      </div>
                      {selectedQuestions.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {selectedQuestions.length} selected
                    </span>
                    <button
                      onClick={handleBulkDelete}
                      className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                    >
                      Delete Selected
                    </button>
                  </div>
                )}
                    </div>

                    {/* Questions List */}
                    {getLevelQuestions(activeLevel).map((question, index) => (
                      <div
                        key={question._id}
                        className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start space-x-4">
                          {/* Selection Checkbox */}
                          <div className="flex-shrink-0 pt-1">
                            <input
                              type="checkbox"
                              checked={selectedQuestions.includes(question._id)}
                              onChange={() => toggleQuestionSelection(question._id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </div>

                          {/* Question Number */}
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-semibold text-blue-600">
                                {index + 1}
                              </span>
                            </div>
                          </div>

                          {/* Question Content */}
                          <div className="flex-1 space-y-4">
                            {/* Question Header */}
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                  {question.question}
                                </h3>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                                    {getDifficultyLabel(question.difficulty)}
                                  </span>
                                  <span>Time: {question.estimatedTime || 1}m</span>
                                  <span>Marks: +{question.positiveMarks || 1}</span>
                                  {question.negativeMarks > 0 && (
                                    <span className="text-red-600">-{question.negativeMarks}</span>
                                  )}
                                </div>
                              </div>
                              
                              {/* Action Buttons */}
                              <div className="flex items-center space-x-2">
                                <button
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                  title="Edit Question"
                                                                     onClick={() => {
                                     setEditingQuestion(question);
                                     setFormData({
                                       question: question.question,
                                       options: question.options || ["", "", "", ""],
                                       correctAnswer: question.correctAnswer ?? 0,
                                       difficulty: question.difficulty || "L1",
                                       estimatedTime: question.estimatedTime ?? 1,
                                       positiveMarks: question.positiveMarks ?? 1,
                                       negativeMarks: question.negativeMarks ?? 0,
                                       solution: question.solution || {
                                         type: "text",
                                         text: "",
                                         video: { url: "", title: "", description: "", duration: 0 },
                                         image: { url: "", caption: "" },
                                       },
                                     });
                                     setShowMarkdownForm(true);
                                   }}
                                >
                                  <Edit2 size={18} />
                                </button>
                                <button
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                  title="Delete Question"
                                  onClick={() => handleDeleteQuestion(question._id)}
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </div>

                            {/* Options */}
                            {question.options && question.options.length > 0 && (
                              <div className="space-y-3">
                                <div className="flex items-center space-x-2 mb-3">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                    Options:
                                  </p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {question.options.map((option, optIndex) => (
                                    <div
                                      key={optIndex}
                                      className="p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
                                    >
                                      <div className="flex items-center space-x-3">
                                        <span
                                          className={`text-sm font-bold px-2 py-1 rounded-full ${
                                            optIndex === question.correctAnswer
                                              ? "bg-green-600 text-white"
                                              : "bg-gray-100 text-gray-500"
                                          }`}
                                        >
                                          {String.fromCharCode(65 + optIndex)}
                                        </span>
                                        <span
                                          className={`font-medium ${
                                            optIndex === question.correctAnswer
                                              ? "text-green-900"
                                              : "text-gray-900"
                                          }`}
                                        >
                                          {option}
                                        </span>
                                        {optIndex === question.correctAnswer && (
                                          <CheckCircle size={20} className="text-green-600 ml-auto" />
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Solution Preview */}
                            {question.solution && (
                              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Solution:</h4>
                                {question.solution.type === "text" && question.solution.text && (
                                  <p className="text-sm text-gray-600">{question.solution.text}</p>
                                )}
                                {question.solution.type === "video" && question.solution.video?.url && (
                                  <div className="flex items-center space-x-2 text-sm text-blue-600">
                                    <span>📹</span>
                                    <span>{question.solution.video.title || "Video Solution"}</span>
                                  </div>
                                )}
                                {question.solution.type === "image" && question.solution.image?.url && (
                                  <div className="flex items-center space-x-2 text-sm text-blue-600">
                                    <span>🖼️</span>
                                    <span>{question.solution.image.caption || "Image Solution"}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

        ) : showUploadView ? (
          <div className="flex justify-center h-full">
            <QuestionBankText
              onBack={() => {
                setShowUploadView(false);
                fetchQuestions();
                }}
              questionBankId={questionBankId}
            />
          </div>
        ) : (
          <div className="flex justify-center h-full">
            <MarkdownQuestionForm
              onBack={() => setShowMarkdownForm(false)}
              questionBankId={questionBankId}
              editingQuestion={editingQuestion}
              onQuestionsSaved={() => {
                setShowMarkdownForm(false);
                setEditingQuestion(null);
                fetchQuestions();
              }}
            />
          </div>
        )}


      </div>
    </>
  );
}
