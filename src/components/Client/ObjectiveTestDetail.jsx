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
  Plus,
  Edit2,
  Trash2,
  Book,
  Database,
  Edit,
  Search,
} from "lucide-react";
import ObjectiveQuestionForm from "./components/forms/ObjectiveQuestionForm.jsx";
import { API_BASE_URL } from "../../config.js";

export default function ObjectiveTestDetail() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const token = Cookies.get("usertoken");

  const [loading, setLoading] = useState(false);
  const [testDetails, setTestDetails] = useState(null);
  const [testInfo, setTestInfo] = useState(null);
  const [activeLevel, setActiveLevel] = useState("L1");
  const [activeView, setActiveView] = useState("questions");
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showAddQuestionFromQB, setShowAddQuestionFromQB] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [scoreboardLoading, setScoreboardLoading] = useState(false);
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [scoreboard, setScoreboard] = useState({ summary: null, rows: [] });
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [questionBank, setQuestionBank] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [qbSummaries, setQbSummaries] = useState({});
  const [qbRequestCounts, setQbRequestCounts] = useState({});
  const [selectedBankId, setSelectedBankId] = useState(null);
  const [selectedBankIds, setSelectedBankIds] = useState([]);
  const [bankToAdd, setBankToAdd] = useState("");
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

  const fetchTestDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/api/objectivetest-questions/${testId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setTestDetails(response.data.questions);
      console.log(response.data.questions);

      const testResponse = await axios.get(
        `${API_BASE_URL}/api/objectivetests/${testId}`,
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

  const fetchQuestionBank = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/questionbank`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const banks = res?.data?.data || [];
      const objectiveBanks = banks.filter((b) => b.type === "Objective");
      setQuestionBank(objectiveBanks);
      // Removed auto-selecting the first bank; user must choose explicitly
      const initCounts = {};
      for (const b of banks) {
        initCounts[b._id] = {};
      }
      setQbRequestCounts((prev) => ({ ...initCounts, ...prev }));
      Promise.all(
        banks.map(async (b) => {
          try {
            const s = await axios.get(
              `${API_BASE_URL}/api/questionbank/${b._id}/summary`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            return { id: b._id, summary: s?.data?.data };
          } catch (e) {
            console.error("Failed to load summary for bank", b._id, e);
            return { id: b._id, summary: null };
          }
        })
      ).then((summaries) => {
        const map = {};
        summaries.forEach(({ id, summary }) => {
          map[id] = summary;
        });
        setQbSummaries(map);
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleCountChange = (bankId, subject, difficulty, value) => {
    const raw = Math.max(0, parseInt(value || 0));
    const summary = qbSummaries?.[bankId];
    const bySD = summary?.bySubjectDifficulty || [];
    const levelInfo = bySD.find(
      (x) => x.subject === subject && x.difficulty === difficulty
    );
    const availableForLevel = levelInfo?.total || 0;
    const clamped = Math.min(raw, availableForLevel);
    setQbRequestCounts((prev) => ({
      ...prev,
      [bankId]: {
        ...(prev[bankId] || {}),
        [subject]: {
          ...((prev[bankId] || {})[subject] || {}),
          [difficulty]: clamped,
        },
      },
    }));
  };

  const generateFromQB = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const tasks = [];

      // Build tasks and validate per-subject totals
      const banksForTasks = questionBank.filter((b) => selectedBankIds.includes(b._id));
      for (const bank of banksForTasks) {
        const summary = qbSummaries?.[bank._id];
        const subjects = summary?.subjects || [];
        for (const s of subjects) {
          const reqForSubject = qbRequestCounts?.[bank._id]?.[s.subject] || {};
          const sumForSubject = ["L1", "L2", "L3"].reduce(
            (acc, lvl) => acc + (parseInt(reqForSubject?.[lvl] || 0) || 0),
            0
          );
          if (sumForSubject > s.total) {
            toast.error(
              `Requested ${sumForSubject} exceeds available ${s.total} for ${s.subject} in ${bank.title}`
            );
            return;
          }
          ["L1", "L2", "L3"].forEach((lvl) => {
            const count = parseInt(reqForSubject?.[lvl] || 0) || 0;
            if (count > 0) {
              tasks.push({
                bankId: bank._id,
                subject: s.subject,
                difficulty: lvl,
                limit: Math.min(count, s.total),
              });
            }
          });
        }
      }

      if (tasks.length === 0) {
        toast.error("No selection to generate");
        return;
      }

      setLoading(true);
      const results = await Promise.all(
        tasks.map(async (t) => {
          const params = {
            subject: t.subject,
            difficulty: t.difficulty,
            limit: t.limit,
          };
          const listRes = await axios.get(
            `${API_BASE_URL}/api/questionbank/${t.bankId}/questions`,
            { headers, params }
          );
          const qs = listRes?.data?.questions || [];
          return qs.map((q) => q._id);
        })
      );
      const questionIds = Array.from(new Set(results.flat()));
      if (questionIds.length === 0) {
        toast.error("No questions found for the selection");
        return;
      }

      const addRes = await axios.post(
        `${API_BASE_URL}/api/objectivetests/${testId}/questions`,
        { questionIds },
        { headers }
      );
      if (addRes?.data?.success) {
        toast.success(`${questionIds.length} question(s) added`);
        await fetchTestDetails();
        setShowAddQuestionFromQB(false);
        setShowScoreboard(false);
        setShowQuestionModal(false);
      } else {
        toast.error(addRes?.data?.message || "Failed to add questions");
        setShowAddQuestionFromQB(false);
        setShowScoreboard(false);
        setShowQuestionModal(false);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate questions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestDetails();
  }, [testId]);

  useEffect(() => {
    if (showAddQuestionFromQB) {
      fetchQuestionBank();
    }
  }, [showAddQuestionFromQB]);

  const openScoreboard = async () => {
    try {
      setScoreboardLoading(true);
      setShowScoreboard(true);
      const res = await axios.get(
        `${API_BASE_URL}/api/objectivetests/${testId}/scoreboard/first-attempt`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const { data, summary } = res.data || {};
      setScoreboard({
        summary: summary || null,
        rows: Array.isArray(data) ? data : [],
      });
    } catch (err) {
      toast.error("Failed to load scoreboard");
      setScoreboard({ summary: null, rows: [] });
    } finally {
      setScoreboardLoading(false);
    }
  };

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

  const questionsByLevel = testDetails
    ? testDetails.reduce((acc, question) => {
        const level = question.difficulty || "L1";
        if (!acc[level]) {
          acc[level] = [];
        }
        acc[level].push(question);
        return acc;
      }, {})
    : {};

  const getLevelQuestions = (level) => {
    return questionsByLevel[level] || [];
  };

  // Objective question CRUD
  const handleAddObjectiveQuestion = async () => {
    try {
      const authToken = Cookies.get("usertoken");
      if (!authToken) {
        toast.error("Authentication required");
        return;
      }
      const payload = {
        question: formData.question,
        options: formData.options,
        correctOption: formData.correctAnswer,
        difficulty: formData.difficulty || activeLevel,
        estimatedTime: formData.estimatedTime,
        positiveMarks: formData.positiveMarks,
        negativeMarks: formData.negativeMarks,
        solution: formData.solution,
      };
      const res = await fetch(
        `https://test.ailisher.com/api/objectivetest-questions/${testId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (data.success) {
        toast.success("Question added");
        setShowQuestionModal(false);
        setEditingQuestion(null);
        await fetchTestDetails();
      } else {
        toast.error(data.message || "Failed to add question");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to connect to the server");
    }
  };

  const handleUpdateObjectiveQuestion = async () => {
    try {
      const authToken = Cookies.get("usertoken");
      if (!authToken) {
        toast.error("Authentication required");
        return;
      }
      const questionId = editingQuestion?._id || editingQuestion?.id;
      if (!questionId) {
        toast.error("Missing question id");
        return;
      }
      const payload = {
        question: formData.question,
        options: formData.options,
        correctOption: formData.correctAnswer,
        difficulty: formData.difficulty,
        estimatedTime: formData.estimatedTime,
        positiveMarks: formData.positiveMarks,
        negativeMarks: formData.negativeMarks,
        solution: formData.solution,
      };
      const res = await fetch(
        `https://test.ailisher.com/api/objectivetest-questions/${questionId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (data.success) {
        toast.success("Question updated");
        setShowQuestionModal(false);
        setEditingQuestion(null);
        await fetchTestDetails();
      } else {
        toast.error(data.message || "Failed to update question");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to connect to the server");
    }
  };

  const handleDeleteObjectiveQuestion = async (questionId) => {
    if (!window.confirm("Are you sure you want to delete this question?"))
      return;
    try {
      const authToken = Cookies.get("usertoken");
      if (!authToken) {
        toast.error("Authentication required");
        return;
      }
      const res = await fetch(
        `https://test.ailisher.com/api/objectivetest-questions/${questionId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      const data = await res.json();
      if (data.success) {
        toast.success("Question deleted");
        await fetchTestDetails();
      } else {
        toast.error(data.message || "Failed to delete question");
      }
    } catch (e) {
      console.error(e);
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
      <div className="min-h-screen bg-gray-50">
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
                    {testInfo?.name || "Objective Test"}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {Object.values(questionsByLevel).reduce(
                      (t, q) => t + q.length,
                      0
                    )}{" "}
                    questions • Objective Type
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
                            {Object.values(questionsByLevel).reduce(
                              (t, q) => t + q.length,
                              0
                            )}
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
                            Objective
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

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filters and Search */}
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
                    setShowScoreboard(true);
                    openScoreboard();
                    setShowAddQuestionFromQB(false);
                  }}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-md shadow-md hover:bg-green-800 transition-colors"
                >
                  Scoreboard
                </button>

                <button
                  onClick={() => {
                    setShowAddQuestionFromQB(true);
                    setShowScoreboard(false);
                    setShowQuestionModal(false);
                  }}
                  className="px-4 py-2 text-sm bg-black text-white rounded-md shadow-md hover:bg-gray-800 transition-colors"
                >
                  Add Question From QB
                </button>

                <button
                  onClick={() => {
                    setEditingQuestion(null);
                    setShowQuestionModal(true);
                  }}
                  className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  <Plus size={16} className="mr-2" />
                  Add Question
                </button>
              </div>
            </div>
          </div>
          {!showAddQuestionFromQB && !showScoreboard ? (
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

              {/* Content for Active Level */}
              <div className="p-6">
                {getLevelQuestions(activeLevel).length === 0 ? (
                  <div className="text-center py-12 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                      <FileText size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Questions Available
                    </h3>
                    <button
                      className="bg-blue-600 text-white px-4 py-2 my-4 rounded-md hover:bg-blue-700 transition-colors flex items-center"
                      onClick={() => {
                        setEditingQuestion(null);
                        setFormData({
                          question: "",
                          options: ["", "", "", ""],
                          correctAnswer: 0,
                          difficulty: activeLevel,
                          estimatedTime: 1,
                          positiveMarks: 1,
                          negativeMarks: 0,
                          solution: {
                            type: "text",
                            text: "",
                            video: {
                              url: "",
                              title: "",
                              description: "",
                              duration: 0,
                            },
                            image: { url: "", caption: "" },
                          },
                        });
                        setShowQuestionModal(true);
                      }}
                    >
                      <Plus size={16} className="mr-2" />
                      Add Question
                    </button>
                    <p className="text-gray-600 mb-6">
                      There are no questions for the{" "}
                      {activeLevel === "L1"
                        ? "Beginner"
                        : activeLevel === "L2"
                        ? "Intermediate"
                        : "Advanced"}{" "}
                      level yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {getLevelQuestions(activeLevel).map((question, index) => (
                      <div
                        key={question._id}
                        className="border border-gray-200 rounded-lg p-6"
                      >
                        <div className="flex items-start space-x-4">
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
                            {/* Question Text */}
                            <div>
                              <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {question.question}
                              </h3>
                              <div className="flex items-center space-x-2">
                                <button
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                  title="Edit Question"
                                  onClick={() => {
                                    setEditingQuestion(question);
                                    setFormData({
                                      question: question.question,
                                      options: question.options || [
                                        "",
                                        "",
                                        "",
                                        "",
                                      ],
                                      correctAnswer:
                                        question.correctAnswer ?? 0,
                                      difficulty: question.difficulty || "L1",
                                      estimatedTime:
                                        question.estimatedTime ?? 1,
                                      positiveMarks:
                                        question.positiveMarks ?? 1,
                                      negativeMarks:
                                        question.negativeMarks ?? 0,
                                      solution: question.solution || {
                                        type: "text",
                                        text: "",
                                        video: {
                                          url: "",
                                          title: "",
                                          description: "",
                                          duration: 0,
                                        },
                                        image: { url: "", caption: "" },
                                      },
                                    });
                                    setShowQuestionModal(true);
                                  }}
                                >
                                  <Edit2 size={18} />
                                </button>
                                <button
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                  title="Delete Question"
                                  onClick={() =>
                                    handleDeleteObjectiveQuestion(
                                      question._id || question.id
                                    )
                                  }
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </div>

                            {/* Options */}
                            {question.options &&
                              question.options.length > 0 && (
                                <div className="space-y-3">
                                  <div className="flex items-center space-x-2 mb-3">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                      Options:
                                    </p>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {question.options.map(
                                      (option, optIndex) => (
                                        <div
                                          key={optIndex}
                                          className="p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
                                        >
                                          <div className="flex items-center space-x-3">
                                            <span
                                              className={`text-sm font-bold px-2 py-1 rounded-full ${
                                                optIndex ===
                                                question.correctAnswer
                                                  ? "bg-green-600 text-white"
                                                  : "bg-gray-100 text-gray-500"
                                              }`}
                                            >
                                              {String.fromCharCode(
                                                65 + optIndex
                                              )}
                                            </span>
                                            <span
                                              className={`font-medium ${
                                                optIndex ===
                                                question.correctAnswer
                                                  ? "text-green-900"
                                                  : "text-gray-900"
                                              }`}
                                            >
                                              {option}
                                            </span>
                                            {optIndex ===
                                              question.correctAnswer && (
                                              <CheckCircle
                                                size={20}
                                                className="text-green-600 ml-auto"
                                              />
                                            )}
                                          </div>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-end">
                      <button
                        className="bg-blue-600 text-white px-4 py-2 mb-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
                        onClick={() => {
                          setEditingQuestion(null);
                          setFormData({
                            question: "",
                            options: ["", "", "", ""],
                            correctAnswer: 0,
                            difficulty: activeLevel,
                            estimatedTime: 1,
                            positiveMarks: 1,
                            negativeMarks: 0,
                            solution: {
                              type: "text",
                              text: "",
                              video: {
                                url: "",
                                title: "",
                                description: "",
                                duration: 0,
                              },
                              image: { url: "", caption: "" },
                            },
                          });
                          setShowQuestionModal(true);
                        }}
                      >
                        <Plus size={16} className="mr-2" />
                        Add Question
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : showAddQuestionFromQB ? (
            <div>
              <div className="top-0 z-10 bg-white border-b border-gray-200 shadow-sm mb-6">
                <div className="w-full mx-auto py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => {
                          setShowAddQuestionFromQB(false);
                          setShowScoreboard(false);
                          setShowQuestionModal(false);
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <ArrowLeft size={20} />
                        Back to Questions
                      </button>
                      <div className="text-gray-400">|</div>
                      <span className="text-sm text-gray-500">
                        Add Question From QB
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-4">
                      <span className="text-xs text-gray-400 bg-gray-50 px-4 py-1 rounded border">
                        Press ESC to go back
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-full">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-4">
                  <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold mb-4">
                    Add Question From QB
                  </h3>
                  <div className="flex items-center gap-3 mb-3">
                      <select
                        value={bankToAdd}
                        onChange={(e) => setBankToAdd(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="">Select question bank</option>
                        {questionBank
                          .filter((b) => !selectedBankIds.includes(b._id))
                          .map((b) => (
                            <option key={b._id} value={b._id}>{b.title}</option>
                          ))}
                      </select>
                      <button
                        className="px-3 py-2 bg-black text-white rounded-md disabled:opacity-50"
                        onClick={() => {
                          if (!bankToAdd) return;
                          setSelectedBankIds((prev) => Array.from(new Set([...prev, bankToAdd])));
                          setSelectedBankId(bankToAdd);
                          setBankToAdd("");
                        }}
                        disabled={!bankToAdd}
                      >Add Question Bank</button>
                    </div>
                    </div>
                  {/* Full-width bank selector row */}
                  <div className="mb-5">
                    
                    {questionBank?.length === 0 ? (
                      <div className="text-sm text-gray-500">
                        No question banks
                      </div>
                    ) : (
                      <div className="flex gap-4 overflow-x-auto pb-2">
                        {questionBank.filter((b) => selectedBankIds.includes(b._id)).map((bank) => {
                          const summary = qbSummaries[bank._id];
                          const total = summary?.totalQuestions || 0;
                          const isSelected = selectedBankId === bank._id;
                          return (
                            <button
                              type="button"
                              key={bank._id}
                              onClick={() => setSelectedBankId(bank._id)}
                              className={`min-w-[280px] text-left rounded-xl border ${
                                isSelected
                                  ? "border-indigo-500 ring-2 ring-indigo-200"
                                  : "border-gray-200"
                              } hover:border-gray-300 transition overflow-hidden bg-white shadow-sm`}
                            >
                              <div className="flex">
                                <div className="w-24 h-full bg-gray-100 flex-shrink-0 overflow-hidden">
                                  {bank.coverImageUrl ? (
                                    <img
                                      src={bank.coverImageUrl}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                      No Image
                                    </div>
                                  )}
                                </div>
                                <div className="p-3 flex-1">
                                  <div className="flex items-center justify-between">
                                    <div className="font-semibold text-gray-900 line-clamp-1">
                                      {bank.title}
                                    </div>
                                    <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                      {bank.type || "Objective"}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500 line-clamp-2 mt-1">
                                    {bank.description}
                                  </div>
                                  <div className="text-[11px] text-gray-400 mt-1">
                                    {bank.category}
                                    {bank.subcategory
                                      ? ` · ${bank.subcategory}`
                                      : ""}
                                  </div>
                                  <div className="mt-2 text-xs text-gray-700">
                                    Total: {" "}
                                    <span className="font-medium">{total}</span>
                                  </div>
                                  <div className="mt-2">
                                    <button
                                      type="button"
                                      className="text-xs px-2 py-1 border rounded text-red-600 border-red-200 hover:bg-red-50"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedBankIds((prev) => prev.filter((id) => id !== bank._id));
                                        if (selectedBankId === bank._id) {
                                          const remaining = selectedBankIds.filter((id) => id !== bank._id);
                                          setSelectedBankId(remaining[0] || null);
                                        }
                                      }}
                                    >Remove</button>
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {/* Full-width selected bank details */}
                  <div>
                    {!selectedBankId ? (
                      <div className="h-full min-h-[280px] flex items-center justify-center text-gray-500 text-sm bg-gray-50 rounded-lg border border-dashed">
                        Select a question bank to configure
                      </div>
                    ) : (
                      (() => {
                        const bank = questionBank.find(
                          (b) => b._id === selectedBankId
                        );
                        const summary = qbSummaries[selectedBankId];
                        const subjects = summary?.subjects || ["Other"];
                        const total = summary?.totalQuestions || 0;
                        return (
                          <div className="space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="w-14 h-14 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                                {bank?.coverImageUrl ? (
                                  <img
                                    src={bank.coverImageUrl}
                                    className="w-full h-full object-cover"
                                  />
                                ) : null}
                              </div>
                              <div>
                                <div className="text-lg font-semibold text-gray-900">
                                  {bank?.title}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Total Questions: {total}
                                </div>
                              </div>
                            </div>
                            {subjects.length === 0 ? (
                              <div className="text-sm text-gray-500">
                                No subjects available.
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 gap-4">
                                {subjects.map((s) => {
                                  const current =
                                    qbRequestCounts?.[selectedBankId]?.[
                                      s.subject
                                    ] || {};
                                  const bySD =
                                    qbSummaries?.[selectedBankId]
                                      ?.bySubjectDifficulty || [];
                                  return (
                                    <div
                                      key={`${selectedBankId}-${s.subject}`}
                                      className="border rounded-lg"
                                    >
                                      <div className="px-4 py-2 bg-gray-50 border-b flex items-center justify-between">
                                        <div className="text-sm font-medium text-gray-800">
                                          {s.subject}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          Total: {s.total || 0}
                                        </div>
                                      </div>
                                      <div className="p-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                          {["L1", "L2", "L3"].map((lvl) => {
                                            const levelInfo = bySD.find(
                                              (x) =>
                                                x.subject === s.subject &&
                                                x.difficulty === lvl
                                            );
                                            const available =
                                              levelInfo?.total || 0;
                                            return (
                                              <div
                                                key={`${selectedBankId}-${s.subject}-${lvl}`}
                                                className="border rounded-md p-3"
                                              >
                                                <div className="text-xs text-gray-600 mb-2">
                                                  Difficulty:{" "}
                                                  <span className="font-medium">
                                                    {lvl}
                                                  </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                  <input
                                                    type="number"
                                                    min={0}
                                                    max={available}
                                                    value={
                                                      qbRequestCounts?.[
                                                        selectedBankId
                                                      ]?.[s.subject]?.[lvl] || 0
                                                    }
                                                    onChange={(e) =>
                                                      handleCountChange(
                                                        selectedBankId,
                                                        s.subject,
                                                        lvl,
                                                        e.target.value
                                                      )
                                                    }
                                                    className="w-full px-3 py-2 border rounded-md"
                                                    disabled={available === 0}
                                                  />
                                                  <span className="text-[11px] text-gray-500">
                                                    Available {available}
                                                  </span>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })()
                    )}
                  </div>
                </div>
              </div>
              {/* Bottom sticky action bar */}
              <div className="w-full pb-10">
                <div className="sticky bottom-4">
                  <div className="bg-white border border-gray-200 shadow-lg rounded-xl p-4 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Configure counts per subject and level, then generate
                      questions into the test.
                    </div>
                    <button
                      className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md shadow-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={generateFromQB}
                      disabled={(() => {
                        // disable when nothing selected
                        let total = 0;
                        for (const bank of questionBank) {
                          const map = qbRequestCounts?.[bank._id] || {};
                          for (const subj of Object.keys(map)) {
                            total += ["L1", "L2", "L3"].reduce(
                              (acc, lvl) =>
                                acc + (parseInt(map[subj]?.[lvl] || 0) || 0),
                              0
                            );
                          }
                        }
                        return total === 0;
                      })()}
                    >
                      Generate
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full">
              <div className="top-0 z-10 bg-white border-b border-gray-200 shadow-sm mb-6">
                <div className="w-full mx-auto py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => {
                          setShowAddQuestionFromQB(false);
                          setShowScoreboard(false);
                          setShowQuestionModal(false);
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <ArrowLeft size={20} />
                        Back to Questions
                      </button>
                      <div className="text-gray-400">|</div>
                      <span className="text-sm text-gray-500">
                        Add Question From QB
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-4">
                      <span className="text-xs text-gray-400 bg-gray-50 px-4 py-1 rounded border">
                        Press ESC to go back
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-4">
                    First Attempt Scoreboard
                  </h3>
                  {scoreboardLoading ? (
                    <div className="py-16 text-center">Loading...</div>
                  ) : (
                    <>
                      {scoreboard.summary && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border shadow-sm">
                            <div className="text-xs text-yellow-700">
                              Top Score
                            </div>
                            <div className="text-2xl font-semibold text-yellow-900">
                              {scoreboard.summary.topScore}
                            </div>
                          </div>
                          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border shadow-sm">
                            <div className="text-xs text-blue-700">
                              Average Score
                            </div>
                            <div className="text-2xl font-semibold text-blue-900">
                              {scoreboard.summary.averageScore}
                            </div>
                          </div>
                          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border shadow-sm">
                            <div className="text-xs text-green-700">
                              Total Users Appeared
                            </div>
                            <div className="text-2xl font-semibold text-green-900">
                              {scoreboard.summary.totalUsersAppeared}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="overflow-auto">
                        <table className="min-w-full border rounded-lg overflow-hidden">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="text-left px-3 py-2 border">
                                Rank
                              </th>
                              <th className="text-left px-3 py-2 border">
                                User
                              </th>
                              <th className="text-left px-3 py-2 border">
                                Marks
                              </th>
                              <th className="text-left px-3 py-2 border">
                                Completion Time
                              </th>
                              <th className="text-left px-3 py-2 border">
                                Submitted At
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {scoreboard.rows.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="text-center py-6">
                                  No data
                                </td>
                              </tr>
                            ) : (
                              scoreboard.rows.map((row) => (
                                <tr
                                  key={`${row.userId}-${row.rank}`}
                                  className="odd:bg-white even:bg-gray-50"
                                >
                                  <td className="px-3 py-2 border font-semibold">
                                    {row.rank}
                                  </td>
                                  <td className="px-3 py-2 border">
                                    {row.user?.name ||
                                      row.user?.email ||
                                      row.user?.mobile ||
                                      String(row.userId).slice(-6)}
                                  </td>
                                  <td className="px-3 py-2 border">
                                    {row.totalMarksEarned}
                                  </td>
                                  <td className="px-3 py-2 border">
                                    {row.completionTime || "-"}
                                  </td>
                                  <td className="px-3 py-2 border">
                                    {row.submittedAt
                                      ? new Date(
                                          row.submittedAt
                                        ).toLocaleString()
                                      : "-"}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add/Edit Question Modal */}
        {showQuestionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingQuestion
                    ? "Edit Objective Question"
                    : "Add Objective Question"}
                </h3>
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => {
                    setShowQuestionModal(false);
                    setEditingQuestion(null);
                  }}
                >
                  ✕
                </button>
              </div>
              <ObjectiveQuestionForm
                initialData={formData}
                index={0}
                canRemove={false}
                onQuestionChange={(_, updated) =>
                  setFormData((prev) => ({ ...prev, ...updated }))
                }
                fixedDifficulty={formData.difficulty}
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Estimated Time (mins)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.estimatedTime}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        estimatedTime: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Positive Marks
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.1"
                    value={formData.positiveMarks}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        positiveMarks: Number(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Negative Marks
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.1"
                    value={formData.negativeMarks}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        negativeMarks: Number(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm text-gray-700 mb-1">
                  Solution Type
                </label>
                <select
                  value={formData.solution?.type || "text"}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      solution: { ...prev.solution, type: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="text">Text</option>
                  <option value="video">Video</option>
                  <option value="image">Image</option>
                </select>

                {formData.solution?.type === "text" && (
                  <div className="mt-2">
                    <label className="block text-sm text-gray-700 mb-1">
                      Solution Text
                    </label>
                    <textarea
                      rows={3}
                      value={formData.solution?.text || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          solution: { ...prev.solution, text: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                )}

                {formData.solution?.type === "video" && (
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Video URL
                      </label>
                      <input
                        type="url"
                        value={formData.solution?.video?.url || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            solution: {
                              ...prev.solution,
                              video: {
                                ...prev.solution.video,
                                url: e.target.value,
                              },
                            },
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={formData.solution?.video?.title || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            solution: {
                              ...prev.solution,
                              video: {
                                ...prev.solution.video,
                                title: e.target.value,
                              },
                            },
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        rows={2}
                        value={formData.solution?.video?.description || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            solution: {
                              ...prev.solution,
                              video: {
                                ...prev.solution.video,
                                description: e.target.value,
                              },
                            },
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Duration (sec)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={formData.solution?.video?.duration || 0}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            solution: {
                              ...prev.solution,
                              video: {
                                ...prev.solution.video,
                                duration: parseInt(e.target.value) || 0,
                              },
                            },
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                )}

                {formData.solution?.type === "image" && (
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Image URL
                      </label>
                      <input
                        type="url"
                        value={formData.solution?.image?.url || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            solution: {
                              ...prev.solution,
                              image: {
                                ...prev.solution.image,
                                url: e.target.value,
                              },
                            },
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Caption
                      </label>
                      <input
                        type="text"
                        value={formData.solution?.image?.caption || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            solution: {
                              ...prev.solution,
                              image: {
                                ...prev.solution.image,
                                caption: e.target.value,
                              },
                            },
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  onClick={() => {
                    setShowQuestionModal(false);
                    setEditingQuestion(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  onClick={() =>
                    editingQuestion
                      ? handleUpdateObjectiveQuestion()
                      : handleAddObjectiveQuestion()
                  }
                >
                  {editingQuestion ? "Update" : "Add"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
