import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import { API_BASE_URL } from "../../config";
import {
  Loader2,
  Users,
  FileText,
  BookOpen,
  Eye,
  Image as ImageIcon,
  Clock,
  CheckCircle2,
  XCircle,
  Pencil,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import FormatMyQuestionModal from "./FormatMyQuestionModal";

const TABS = [
  { key: "pending", label: "Pending Formatting", status: "pending" },
  { key: "formatted", label: "Formatted", status: "formatted" },
  { key: "rejected", label: "Rejected", status: "rejected" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "subject-asc", label: "Subject A → Z" },
  { value: "subject-desc", label: "Subject Z → A" },
  { value: "marks-high", label: "Highest marks" },
  { value: "marks-low", label: "Lowest marks" },
];

const QUESTIONS_PER_PAGE = 100;

const formatDateTime = (value) => {
  if (!value) return "N/A";
  try {
    return new Date(value).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
};

const getCreatorDisplay = (createdBy) => {
  if (!createdBy) return "Unknown";
  if (createdBy.name) return createdBy.name;
  if (createdBy.mobile) return createdBy.mobile;
  return "Unknown";
};

const MyQuestion = () => {
  const navigate = useNavigate();
  const [activeTabKey, setActiveTabKey] = useState(TABS[0].key);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [answersForEvaluation, setAnswersForEvaluation] = useState([]);
  const [actionLoading, setActionLoading] = useState({});
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [questionSubmissions, setQuestionSubmissions] = useState({}); // questionId -> submissions array
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [sortOption, setSortOption] = useState(SORT_OPTIONS[0].value);
  const [expandedQuestionId, setExpandedQuestionId] = useState(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(null);

  const activeTab = useMemo(
    () => TABS.find((tab) => tab.key === activeTabKey),
    [activeTabKey]
  );

  const handleImageClick = (imgUrl) => {
    setActiveImage(imgUrl);
    setImageModalOpen(true);
  };

  const closeImageModal = () => {
    setImageModalOpen(false);
    setActiveImage(null);
  };

  const displayedQuestions = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    const fromDate = dateRange.from
      ? new Date(dateRange.from).setHours(0, 0, 0, 0)
      : null;
    const toDate = dateRange.to
      ? new Date(dateRange.to).setHours(23, 59, 59, 999)
      : null;

    let data = [...questions];

    if (normalizedSearch) {
      data = data.filter((question) => {
        const subject = question.subject?.toLowerCase() || "";
        const exam = question.exam?.toLowerCase() || "";
        const paper = question.paper?.toLowerCase() || "";
        const prompt = question.question?.toLowerCase() || "";
        return [subject, exam, paper, prompt].some((value) =>
          value.includes(normalizedSearch)
        );
      });
    }

    if (fromDate) {
      data = data.filter((question) => {
        const created = question.createdAt
          ? new Date(question.createdAt).getTime()
          : null;
        return created ? created >= fromDate : true;
      });
    }

    if (toDate) {
      data = data.filter((question) => {
        const created = question.createdAt
          ? new Date(question.createdAt).getTime()
          : null;
        return created ? created <= toDate : true;
      });
    }

    data.sort((a, b) => {
      const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      const subjectA = (a.subject || "").toLowerCase();
      const subjectB = (b.subject || "").toLowerCase();
      const marksA = Number(a.maximumMarks) || 0;
      const marksB = Number(b.maximumMarks) || 0;

      switch (sortOption) {
        case "oldest":
          return createdA - createdB;
        case "subject-asc":
          return subjectA.localeCompare(subjectB);
        case "subject-desc":
          return subjectB.localeCompare(subjectA);
        case "marks-high":
          return marksB - marksA;
        case "marks-low":
          return marksA - marksB;
        case "newest":
        default:
          return createdB - createdA;
      }
    });

    return data;
  }, [questions, searchQuery, dateRange, sortOption]);

  useEffect(() => {
    if (!activeTab) return;
    setQuestions([]);
    setError(null);

    if (!activeTab.status) {
      // Tabs without backend mapping yet
      return;
    }

    const controller = new AbortController();

    const loadQuestions = async () => {
      setLoading(true);
      try {
        const token = Cookies.get("usertoken");
        if (!token) {
          throw new Error("Authentication required");
        }

        const url = new URL(`${API_BASE_URL}/api/myquestion/questions/pending`);
        url.searchParams.set("page", "1");
        url.searchParams.set("limit", String(QUESTIONS_PER_PAGE));
        url.searchParams.set("status", activeTab.status);

        const response = await fetch(url.toString(), {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to fetch questions");
        }

        const fetchedQuestions = data.data?.questions || [];
        setQuestions(fetchedQuestions);

        // Auto-load submissions for the first 3 questions
        fetchedQuestions.slice(0, 3).forEach((q) => {
          fetchSubmissionsForQuestion(q.id);
        });
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("MyQuestion fetch error:", err);
        setError(err.message || "Failed to load questions");
        toast.error(err.message || "Failed to load questions");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadQuestions();

    return () => controller.abort();
  }, [activeTab, refreshCounter]);

  useEffect(() => {
    setExpandedQuestionId(null);
  }, [activeTabKey]);

  const reloadActiveTab = () => setRefreshCounter((prev) => prev + 1);

  const handleFiltersReset = () => {
    setSearchQuery("");
    setDateRange({ from: "", to: "" });
    setSortOption(SORT_OPTIONS[0].value);
    setExpandedQuestionId(null);
  };

  const handleToggleSubmissions = (questionId) => {
    const isExpanding = expandedQuestionId !== questionId;
    setExpandedQuestionId(isExpanding ? questionId : null);
    if (isExpanding && !questionSubmissions[questionId]) {
      fetchSubmissionsForQuestion(questionId);
    }
  };

  const handleFormatSubmit = async (updatedQuestion) => {
    try {
      const token = Cookies.get("usertoken");
      if (!token) {
        toast.error("Authentication required");
        return false;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/myquestion/questions/${updatedQuestion.id}/format`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedQuestion),
        }
      );
      const data = await response.json();
      if (response.ok && data.success) {
        toast.success("Question formatted successfully!");
        return true;
      }
      const detailMsg = data?.error?.details
        ? Array.isArray(data.error.details)
          ? data.error.details.map((d) => d.msg || d).join(", ")
          : data.error.details
        : "";
      toast.error(
        `${data.message || "Failed to format question"}${
          detailMsg ? `: ${detailMsg}` : ""
        }`
      );
      return false;
    } catch (error) {
      console.error("Error formatting question:", error);
      toast.error("Failed to format question");
      return false;
    }
  };

  const fetchQuestionDetails = async (questionId) => {
    const token = Cookies.get("usertoken");
    if (!token) {
      throw new Error("Authentication required");
    }
    const response = await fetch(
      `${API_BASE_URL}/api/myquestion/questions/${questionId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to fetch question details");
    }
    return data.data;
  };

  const fetchAnswersForEvaluation = async (questionId) => {
    const token = Cookies.get("usertoken");
    const response = await fetch(
      `${API_BASE_URL}/api/myquestion/questions/${questionId}/answers?status=pending`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const data = await response.json();
    if (response.ok && data.success) {
      const answers = data.data.answers || [];
      // Set answers for details modal
      setAnswersForEvaluation(answers);
      return answers;
    } else {
      console.error("Failed to fetch answers:", data.message);
      return [];
    }
  };

  const fetchSubmissionsForQuestion = async (questionId) => {
    try {
      const token = Cookies.get("usertoken");
      if (!token) return;

      // Fetch all submissions by getting all statuses
      const statuses = [
        "pending",
        "ai_evaluated",
        "expert_evaluated",
        "completed",
      ];
      const allSubmissions = [];

      for (const status of statuses) {
        try {
          const response = await fetch(
            `${API_BASE_URL}/api/myquestion/questions/${questionId}/answers?status=${status}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const data = await response.json();
          if (response.ok && data.success) {
            const answers = data.data.answers || [];
            allSubmissions.push(...answers);
          }
        } catch (err) {
          console.error(`Error fetching ${status} submissions:`, err);
        }
      }

      setQuestionSubmissions((prev) => ({
        ...prev,
        [questionId]: allSubmissions,
      }));
    } catch (error) {
      console.error("Error fetching submissions:", error);
    }
  };

  const handleViewClick = async (question) => {
    try {
      // Fetch full question details to show all formatted information
      const token = Cookies.get("usertoken");
      const response = await fetch(
        `${API_BASE_URL}/api/myquestion/questions/${question.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setSelectedQuestion(data.data);
        // Always fetch answers to show in details modal (regardless of status)
        fetchAnswersForEvaluation(question.id);
        setShowDetailsModal(true);
      } else {
        toast.error("Failed to fetch question details");
      }
    } catch (error) {
      console.error("Error fetching question:", error);
      toast.error("Failed to fetch question details");
    }
  };

  const handleFormatClick = async (questionId) => {
    try {
      setActionLoading((prev) => ({ ...prev, [`format-${questionId}`]: true }));
      const details = await fetchQuestionDetails(questionId);
      setSelectedQuestion(details);
      setShowFormatModal(true);
    } catch (err) {
      console.error("Format question error:", err);
      toast.error(err.message || "Failed to open format form");
    } finally {
      setActionLoading((prev) => ({
        ...prev,
        [`format-${questionId}`]: false,
      }));
    }
  };

  const handleUpdateClick = async (questionId) => {
    try {
      setActionLoading((prev) => ({ ...prev, [`update-${questionId}`]: true }));
      const details = await fetchQuestionDetails(questionId);
      setSelectedQuestion(details);
      setShowUpdateModal(true);
    } catch (err) {
      console.error("Update question error:", err);
      toast.error(err.message || "Failed to open update form");
    } finally {
      setActionLoading((prev) => ({
        ...prev,
        [`update-${questionId}`]: false,
      }));
    }
  };

  const handleRejectQuestion = async (questionId) => {
    try {
      const token = Cookies.get("usertoken");
      if (!token) {
        toast.error("Authentication required");
        return false;
      }
      setActionLoading((prev) => ({ ...prev, [`reject-${questionId}`]: true }));
      const response = await fetch(
        `${API_BASE_URL}/api/myquestion/questions/${questionId}/reject`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      if (response.ok && data.success) {
        toast.success("Question rejected successfully!");
        reloadActiveTab();
        return true;
      } else {
        toast.error(data.message || "Failed to reject question");
        reloadActiveTab();
        return false;
      }
    } catch (err) {
      console.error("Reject question error:", err);
      toast.error(err.message || "Failed to reject question");
      return false;
    } finally {
      setActionLoading((prev) => ({
        ...prev,
        [`reject-${questionId}`]: false,
      }));
    }
  };

  const handleUpdateQuestion = async (updatedQuestion) => {
    try {
      const token = Cookies.get("usertoken");
      if (!token) {
        toast.error("Authentication required");
        return false;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/myquestion/questions/${updatedQuestion.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedQuestion),
        }
      );
      const data = await response.json();
      if (response.ok && data.success) {
        toast.success("Question updated successfully!");
        return true;
      }
      const detailMsg = data?.error?.details
        ? Array.isArray(data.error.details)
          ? data.error.details.map((d) => d.msg || d).join(", ")
          : data.error.details
        : "";
      toast.error(
        `${data.message || "Failed to update question"}${
          detailMsg ? `: ${detailMsg}` : ""
        }`
      );
      return false;
    } catch (error) {
      console.error("Error updating question:", error);
      toast.error("Failed to update question");
      return false;
    }
  };

  const handleFormatModalClose = () => {
    setShowFormatModal(false);
    setSelectedQuestion(null);
  };

  const handleFormatSuccess = () => {
    setShowFormatModal(false);
    setSelectedQuestion(null);
    setActiveTabKey("formatted");
    reloadActiveTab();
  };

  const handleViewSubmissions = (question) => {
    navigate(`/my-question/${question.id}/submissions`);
  };

  const renderQuestions = () => {
    if (!activeTab?.status) {
      return (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
          This tab will be available soon.
        </div>
      );
    }

    if (loading) {
      return (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      );
    }

    if (!displayedQuestions.length) {
      return (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center text-gray-500">
          No questions found for this tab.
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {displayedQuestions.map((question) => {
          const submissions = questionSubmissions[question.id];
          const submissionCount = submissions?.length || 0;
          const isExpanded = expandedQuestionId === question.id;

          return (
            <div
              key={question.id}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
                <div className="flex-1">
                  <div className="mb-3 flex items-center text-xs uppercase tracking-wide text-blue-600">
                    <FileText className="mr-2 h-4 w-4" />
                    Question Overview
                  </div>
                  {/* Question Title */}
                  <h3 className="text-base font-semibold text-gray-900">
                    {question.question || "Untitled question"}
                  </h3>

                  {/* User Created Info */}
                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                    <Users className="h-3 w-3" />
                    {getCreatorDisplay(question.createdBy)}
                    <span className="mx-1">•</span>
                    Created on {formatDateTime(question.createdAt)}
                  </div>

                  {/* Question Metadata in a Single Row */}
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 gap-2 text-xs">
                    <div className="p-2 rounded-md bg-blue-50">
                      <span className="text-blue-600 font-semibold">
                        Subject
                      </span>
                      <br />
                      <span className="text-blue-900 text-[13px]">
                        {question.subject || "N/A"}
                      </span>
                    </div>

                    <div className="p-2 rounded-md bg-purple-50">
                      <span className="text-purple-600 font-semibold">
                        Exam
                      </span>
                      <br />
                      <span className="text-purple-900 text-[13px]">
                        {question.exam || "N/A"}
                      </span>
                    </div>

                    <div className="p-2 rounded-md bg-indigo-50">
                      <span className="text-indigo-600 font-semibold">
                        Paper
                      </span>
                      <br />
                      <span className="text-indigo-900 text-[13px]">
                        {question.paper || "N/A"}
                      </span>
                    </div>

                    <div className="p-2 rounded-md bg-green-50">
                      <span className="text-green-600 font-semibold">
                        Word Limit
                      </span>
                      <br />
                      <span className="text-green-900 text-[13px]">
                        {question.wordLimit || "N/A"}
                      </span>
                    </div>

                    <div className="p-2 rounded-md bg-amber-50">
                      <span className="text-amber-600 font-semibold">
                        Max Marks
                      </span>
                      <br />
                      <span className="text-amber-900 text-[13px]">
                        {question.maximumMarks || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                {activeTab.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleViewClick(question)}
                      className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                    >
                      <Eye className="h-4 w-4" />
                      View Detail
                    </button>

                    <button
                      onClick={() => handleFormatClick(question.id)}
                      disabled={actionLoading[`format-${question.id}`]}
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {actionLoading[`format-${question.id}`] ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Opening...
                        </span>
                      ) : (
                        "Format Question"
                      )}
                    </button>
                  </>
                )}

                {activeTab.status === "formatted" && (
                  <>
                    <button
                      onClick={() => handleViewClick(question)}
                      className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                    >
                      <Eye className="h-4 w-4" />
                      View Detail
                    </button>

                    <button
                      onClick={() => handleUpdateClick(question.id)}
                      disabled={actionLoading[`update-${question.id}`]}
                      className="rounded-md bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {actionLoading[`update-${question.id}`] ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Updating...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Pencil className="h-4 w-4" />
                          Update
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => handleViewSubmissions(question)}
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Manage Submissions
                    </button>
                  </>
                )}

                {activeTab.status === "rejected" && (
                  <>
                    <button
                      onClick={() => handleViewClick(question)}
                      className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                    >
                      <Eye className="h-4 w-4" />
                      View Detail
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleToggleSubmissions(question.id)}
                  className="inline-flex justify-end items-center gap-2 rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:border-blue-200 hover:text-blue-600"
                >
                  {/* <FileText className="h-4 w-4" /> */}
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
                    {submissionCount}
                  </span>
                </button>
              </div>

              {/* Submissions Section */}
              {isExpanded && (
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-gray-600" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        Submissions
                      </h3>
                      {submissionCount > 0 && (
                        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                          {submissionCount}
                        </span>
                      )}
                    </div>
                  </div>

                  {submissions ? (
                    submissions.length > 0 ? (
                      <div className="space-y-4">
                        {submissions.slice(0, 3).map((submission, idx) => {
                          const images = submission.answerImages || [];
                          const hasImages =
                            Array.isArray(images) && images.length > 0;

                          const getStatusConfig = (status) => {
                            switch (status) {
                              case "pending":
                                return {
                                  bg: "bg-yellow-50",
                                  text: "text-yellow-700",
                                  border: "border-yellow-200",
                                  icon: Clock,
                                };
                              case "ai_evaluated":
                                return {
                                  bg: "bg-purple-50",
                                  text: "text-purple-700",
                                  border: "border-purple-200",
                                  icon: CheckCircle2,
                                };
                              case "expert_evaluated":
                                return {
                                  bg: "bg-blue-50",
                                  text: "text-blue-700",
                                  border: "border-blue-200",
                                  icon: CheckCircle2,
                                };
                              case "completed":
                                return {
                                  bg: "bg-green-50",
                                  text: "text-green-700",
                                  border: "border-green-200",
                                  icon: CheckCircle2,
                                };
                              default:
                                return {
                                  bg: "bg-gray-50",
                                  text: "text-gray-700",
                                  border: "border-gray-200",
                                  icon: Clock,
                                };
                            }
                          };

                          const statusConfig = submission.evaluationStatus
                            ? getStatusConfig(submission.evaluationStatus)
                            : null;
                          const StatusIcon = statusConfig?.icon || Clock;

                          return (
                            <div
                              key={submission._id || idx}
                              className="rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow"
                            >
                              <div className="p-4">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                                      <span className="text-sm font-semibold text-gray-700">
                                        #{idx + 1}
                                      </span>
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <h4 className="text-sm font-semibold text-gray-900">
                                          Submission {idx + 1}
                                        </h4>
                                        {submission.evaluationStatus &&
                                          statusConfig && (
                                            <span
                                              className={`inline-flex items-center gap-1 rounded-full border ${statusConfig.border} ${statusConfig.bg} px-2.5 py-0.5 text-xs font-medium ${statusConfig.text}`}
                                            >
                                              <StatusIcon className="h-3 w-3" />
                                              {submission.evaluationStatus
                                                .replace(/_/g, " ")
                                                .replace(/\b\w/g, (l) =>
                                                  l.toUpperCase()
                                                )}
                                            </span>
                                          )}
                                      </div>
                                      {submission.submittedAt && (
                                        <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                                          <Clock className="h-3 w-3" />
                                          Submitted{" "}
                                          {formatDateTime(
                                            submission.submittedAt
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  {hasImages && (
                                    <div className="flex items-center gap-1 rounded-md bg-gray-100 px-2.5 py-1.5">
                                      <ImageIcon className="h-4 w-4 text-gray-600" />
                                      <span className="text-xs font-medium text-gray-700">
                                        {images.length}{" "}
                                        {images.length === 1
                                          ? "Image"
                                          : "Images"}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Answer Images Gallery */}
                                {hasImages ? (
                                  <div className="mt-4">
                                    <div className="mb-2 flex items-center gap-2">
                                      <ImageIcon className="h-4 w-4 text-gray-400" />
                                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                                        Answer Images
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                                      {images.map((image, imgIndex) => {
                                        const imageUrl =
                                          image?.imageUrl ||
                                          image?.url ||
                                          image?.secure_url ||
                                          image?.path ||
                                          (typeof image === "string"
                                            ? image
                                            : null);

                                        if (
                                          !imageUrl ||
                                          typeof imageUrl !== "string"
                                        ) {
                                          return (
                                            <div
                                              key={imgIndex}
                                              className="group relative aspect-square overflow-hidden rounded-lg border-2 border-red-200 bg-red-50"
                                            >
                                              <div className="flex h-full flex-col items-center justify-center p-2">
                                                <XCircle className="h-6 w-6 text-red-400" />
                                                <span className="mt-1 text-[10px] font-medium text-red-600">
                                                  Invalid
                                                </span>
                                              </div>
                                            </div>
                                          );
                                        }

                                        return (
                                          <div
                                            key={image._id || imgIndex}
                                            className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-50 cursor-zoom-in"
                                            onClick={() =>
                                              handleImageClick(imageUrl)
                                            }
                                            role="button"
                                            tabIndex={0}
                                          >
                                            <img
                                              src={imageUrl}
                                              alt={
                                                image?.originalName ||
                                                image?.originalname ||
                                                `Submission ${
                                                  idx + 1
                                                } - Image ${imgIndex + 1}`
                                              }
                                              className="h-full w-full object-contain transition-transform group-hover:scale-105 pointer-events-none"
                                              onError={(e) => {
                                                e.target.style.display = "none";
                                                const errorDiv =
                                                  e.target.nextElementSibling;
                                                if (errorDiv) {
                                                  errorDiv.classList.remove(
                                                    "hidden"
                                                  );
                                                }
                                              }}
                                            />
                                            <div className="hidden absolute inset-0 flex items-center justify-center bg-red-50 border-2 border-red-200 rounded-lg pointer-events-none">
                                              <div className="text-center">
                                                <XCircle className="mx-auto h-6 w-6 text-red-400" />
                                                <span className="mt-1 block text-[10px] font-medium text-red-600">
                                                  Failed to load
                                                </span>
                                              </div>
                                            </div>
                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-lg pointer-events-none" />
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="mt-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
                                    <ImageIcon className="mx-auto h-8 w-8 text-gray-400" />
                                    <p className="mt-2 text-sm font-medium text-gray-500">
                                      No images uploaded
                                    </p>
                                    <p className="mt-1 text-xs text-gray-400">
                                      This submission doesn't contain any answer
                                      images
                                    </p>
                                  </div>
                                )}

                                {/* Evaluation Info (if available) */}
                                {submission.evaluation && (
                                  <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                                      <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                        Evaluation
                                      </span>
                                    </div>
                                    {submission.evaluation.score !==
                                      undefined && (
                                      <div className="text-sm text-gray-700">
                                        <span className="font-medium">
                                          Score:
                                        </span>{" "}
                                        {submission.evaluation.score}
                                      </div>
                                    )}
                                    {submission.evaluation.remark && (
                                      <div className="mt-1 text-xs text-gray-600 line-clamp-2">
                                        {submission.evaluation.remark}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {submissionCount > 3 && (
                          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-center">
                            <p className="text-sm font-medium text-gray-700">
                              +{submissionCount - 3} more submission
                              {submissionCount - 3 !== 1 ? "s" : ""}
                            </p>
                            <button
                              onClick={() => handleViewSubmissions(question)}
                              className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-700"
                            >
                              View all submissions →
                            </button>
                          </div>
                        )}

                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
                        <FileText className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-sm font-semibold text-gray-900">
                          No Submissions
                        </h3>
                        <p className="mt-2 text-sm text-gray-500">
                          This question hasn't received any submissions yet.
                        </p>
                      </div>
                    )
                  ) : (
                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
                      <FileText className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-4 text-sm font-semibold text-gray-900">
                        No Submissions
                      </h3>
                      <p className="mt-2 text-sm text-gray-500">
                        Submissions will appear here once students submit their
                        answers.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">My Questions</h1>
        <p className="mt-1 text-sm text-gray-500">
          Monitor question status and track submissions across the formatting
          and evaluation workflow.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        {TABS.map((tab) => {
          const isActive = tab.key === activeTabKey;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTabKey(tab.key)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label className="text-xs font-medium uppercase text-gray-500">
              Search (exam, paper, subject)
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. UPSC GS Paper 1"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-1 gap-4">
            <div className="flex-1">
              <label className="text-xs font-medium uppercase text-gray-500">
                From Date
              </label>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, from: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium uppercase text-gray-500">
                To Date
              </label>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, to: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="w-full lg:w-56">
            <label className="text-xs font-medium uppercase text-gray-500">
              Sort By
            </label>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500">
          <div>
            Showing{" "}
            <span className="font-semibold text-gray-900">
              {displayedQuestions.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gray-900">
              {questions.length}
            </span>{" "}
            questions
          </div>
          <button
            onClick={handleFiltersReset}
            className="text-xs font-semibold uppercase tracking-wide text-blue-600 hover:text-blue-700"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {renderQuestions()}



      {showFormatModal && selectedQuestion && (
        <FormatMyQuestionModal
          isOpen={showFormatModal}
          onClose={handleFormatModalClose}
          onQuestions={reloadActiveTab}
          onEditQuestion={async (payload) => {
            const ok = await handleFormatSubmit(payload);
            if (ok) {
              handleFormatSuccess();
            }
            return ok;
          }}
          editingQuestion={selectedQuestion}
          scrollToSection={null}
          onGenerateAnswer={() => {}}
        />
      )}

      {showUpdateModal && selectedQuestion && (
        <FormatMyQuestionModal
          isOpen={showUpdateModal}
          onClose={() => setShowUpdateModal(false)}
          onQuestions={reloadActiveTab}
          onEditQuestion={(payload) => handleUpdateQuestion(payload)}
          editingQuestion={selectedQuestion}
          scrollToSection={null}
          onGenerateAnswer={() => {}}
        />
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">
                Question Details
              </h2>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedQuestion(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {/* Basic Question Info */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Question
                  </h3>
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {selectedQuestion.question}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Subject
                    </h3>
                    <p className="text-gray-900">{selectedQuestion.subject}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Exam
                    </h3>
                    <p className="text-gray-900">{selectedQuestion.exam}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Word Limit
                    </h3>
                    <p className="text-gray-900">
                      {selectedQuestion.wordLimit}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Maximum Marks
                    </h3>
                    <p className="text-gray-900">
                      {selectedQuestion.maximumMarks}
                    </p>
                  </div>
                </div>

                {/* Formatted Question Details - Show when status is 'formatted' */}
                {selectedQuestion.status === "formatted" && (
                  <>
                    {selectedQuestion.detailedAnswer && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">
                          Detailed Answer
                        </h3>
                        <div className="bg-gray-50 p-4 rounded-md">
                          <p className="text-gray-900 whitespace-pre-wrap">
                            {selectedQuestion.detailedAnswer}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedQuestion.modalAnswer && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">
                          Modal Answer
                        </h3>
                        <div className="bg-gray-50 p-4 rounded-md">
                          <p className="text-gray-900 whitespace-pre-wrap">
                            {selectedQuestion.modalAnswer}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedQuestion.answerVideoUrls &&
                      selectedQuestion.answerVideoUrls.length > 0 && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-2">
                            Answer Video URLs
                          </h3>
                          <div className="space-y-2">
                            {selectedQuestion.answerVideoUrls.map(
                              (url, index) => (
                                <a
                                  key={index}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline block"
                                >
                                  {url}
                                </a>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {selectedQuestion.metadata && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">
                          Metadata
                        </h3>
                        <div className="bg-gray-50 p-4 rounded-md space-y-3">
                          {selectedQuestion.metadata.keywords &&
                            selectedQuestion.metadata.keywords.length > 0 && (
                              <div>
                                <h4 className="text-xs font-medium text-gray-600 mb-1">
                                  Keywords
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {selectedQuestion.metadata.keywords.map(
                                    (keyword, idx) => (
                                      <span
                                        key={idx}
                                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                                      >
                                        {keyword}
                                      </span>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                          {selectedQuestion.metadata.difficultyLevel && (
                            <div>
                              <h4 className="text-xs font-medium text-gray-600 mb-1">
                                Difficulty Level
                              </h4>
                              <p className="text-gray-900">
                                {selectedQuestion.metadata.difficultyLevel}
                              </p>
                            </div>
                          )}
                          {selectedQuestion.metadata.estimatedTime && (
                            <div>
                              <h4 className="text-xs font-medium text-gray-600 mb-1">
                                Estimated Time
                              </h4>
                              <p className="text-gray-900">
                                {selectedQuestion.metadata.estimatedTime}{" "}
                                minutes
                              </p>
                            </div>
                          )}
                          {selectedQuestion.metadata.qualityParameters && (
                            <div>
                              <h4 className="text-xs font-medium text-gray-600 mb-1">
                                Quality Parameters
                              </h4>
                              <div className="text-sm text-gray-900">
                                <pre className="whitespace-pre-wrap font-sans">
                                  {JSON.stringify(
                                    selectedQuestion.metadata.qualityParameters,
                                    null,
                                    2
                                  )}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {selectedQuestion.languageMode && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">
                          Language Mode
                        </h3>
                        <p className="text-gray-900 capitalize">
                          {selectedQuestion.languageMode}
                        </p>
                      </div>
                    )}

                    {selectedQuestion.evaluationMode && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">
                          Evaluation Mode
                        </h3>
                        <p className="text-gray-900 capitalize">
                          {selectedQuestion.evaluationMode}
                        </p>
                      </div>
                    )}

                    {selectedQuestion.evaluationType && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">
                          Evaluation Type
                        </h3>
                        <p className="text-gray-900">
                          {selectedQuestion.evaluationType}
                        </p>
                      </div>
                    )}

                    {selectedQuestion.evaluationGuideline && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">
                          Evaluation Guideline
                        </h3>
                        <div className="bg-gray-50 p-4 rounded-md">
                          <p className="text-gray-900 whitespace-pre-wrap">
                            {selectedQuestion.evaluationGuideline}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedQuestion.formattedAt && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">
                          Formatted At
                        </h3>
                        <p className="text-gray-900">
                          {formatDateTime(selectedQuestion.formattedAt)}
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Answer Images - Show if available */}
                {answersForEvaluation.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                      Submitted Answers ({answersForEvaluation.length})
                    </h3>
                    <div className="space-y-3">
                      {answersForEvaluation.map((answer, index) => {
                        const images = answer.answerImages || [];
                        const hasImages =
                          Array.isArray(images) && images.length > 0;

                        return (
                          <div
                            key={answer._id || index}
                            className="border border-gray-200 rounded-md p-3"
                          >
                            <div className="text-xs text-gray-500 mb-2">
                              Answer {index + 1}
                              {hasImages &&
                                ` (${images.length} image${
                                  images.length > 1 ? "s" : ""
                                })`}
                            </div>
                            {hasImages ? (
                              <div className="flex flex-wrap gap-2">
                                {images.map((image, imgIndex) => {
                                  console.log(
                                    `Rendering image ${imgIndex}:`,
                                    image
                                  );
                                  console.log("Image type:", typeof image);
                                  console.log(
                                    "Image keys:",
                                    Object.keys(image || {})
                                  );

                                  // Try multiple possible URL fields
                                  const imageUrl =
                                    image?.imageUrl ||
                                    image?.url ||
                                    image?.secure_url ||
                                    image?.path ||
                                    (typeof image === "string" ? image : null);

                                  console.log(
                                    "Resolved imageUrl:",
                                    imageUrl,
                                    "Type:",
                                    typeof imageUrl
                                  );

                                  if (
                                    !imageUrl ||
                                    typeof imageUrl !== "string"
                                  ) {
                                    console.warn(
                                      "Image missing valid URL:",
                                      image
                                    );
                                    return (
                                      <div
                                        key={imgIndex}
                                        className="w-32 h-32 border-2 border-red-300 rounded-md flex flex-col items-center justify-center bg-red-50 p-2"
                                      >
                                        <span className="text-xs text-red-600 text-center font-bold mb-1">
                                          Invalid URL
                                        </span>
                                        <pre className="text-[8px] text-gray-600 overflow-auto max-h-full">
                                          {JSON.stringify(image, null, 2)}
                                        </pre>
                                      </div>
                                    );
                                  }

                                  return (
                                    <div
                                      key={image._id || imgIndex}
                                      className="relative border-2 border-blue-300 bg-gray-100"
                                    >
                                      <img
                                        src={imageUrl}
                                        alt={
                                          image?.originalName ||
                                          image?.originalname ||
                                          `Answer ${index + 1} - Image ${
                                            imgIndex + 1
                                          }`
                                        }
                                        className="w-32 h-32 object-contain rounded-md border-2 border-gray-300 cursor-pointer hover:opacity-80 bg-white"
                                        style={{
                                          minWidth: "128px",
                                          minHeight: "128px",
                                          cursor: "zoom-in"
                                        }}
                                        onClick={() =>
                                          handleImageClick(imageUrl)
                                        }
                                        onError={(e) => {
                                          console.error(
                                            "Image failed to load:",
                                            imageUrl
                                          );
                                          console.error("Image object:", image);
                                          e.target.style.display = "none";
                                          const errorDiv =
                                            e.target.nextElementSibling;
                                          if (errorDiv) {
                                            errorDiv.classList.remove("hidden");
                                          }
                                        }}
                                        onLoad={() => {
                                          console.log(
                                            "Image loaded successfully:",
                                            imageUrl
                                          );
                                        }}
                                      />
                                      <div className="hidden absolute inset-0 bg-red-50 border-2 border-red-300 rounded-md flex items-center justify-center">
                                        <span className="text-xs text-red-600 font-bold">
                                          Failed to load
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500 italic">
                                No images uploaded for this answer
                                {answer.answerImages &&
                                  !Array.isArray(answer.answerImages) && (
                                    <span className="text-xs text-red-500 ml-2">
                                      (Invalid format:{" "}
                                      {typeof answer.answerImages})
                                    </span>
                                  )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => handleRejectQuestion(selectedQuestion.id)}
                  className="inline-flex mr-0 items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  <XCircle className="h-4 w-4" />
                  Reject Question
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
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
  );
};

export default MyQuestion;
