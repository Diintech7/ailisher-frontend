import React, { useEffect, useState } from "react";
import axios from "axios";
import { Badge } from "../UI/Badge";
import Cookies from "js-cookie";

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
    if (!text) return "N/A";
    return text.split("\n").map((line, lineIndex) => {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      const cleanedLineParts = parts.map((part, i) => {
        if (i === 0 && line.startsWith("* ")) {
          return part.replace(/^\*\s+/, "");
        }
        return part;
      });
      return (
        <p key={lineIndex} className={line.startsWith("* ") ? "ml-4" : ""}>
          {line.startsWith("* ") && "• "}
          {cleanedLineParts.map((part, partIndex) =>
            partIndex % 2 === 1 ? (
              <strong key={partIndex} className="text-blue-700">
                {part}
              </strong>
            ) : (
              part
            )
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
              <h2 className="text-2xl font-bold text-gray-900">
                Answer Details
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Question ID: {question._id}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                user ID: {answer.userId}
              </p>
            </div>
            <button
              className="text-gray-400 hover:text-gray-600 transition-colors"
              onClick={onClose}
              aria-label="Close"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
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
              <p className="text-gray-800">{question.question || "N/A"}</p>
            </div>
          </div>

          {/* Answer Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {/* <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="text-sm font-medium text-blue-600 mb-1">
                User ID
              </div>
              <div className="font-semibold text-gray-900">
                {user._id || answer.userId || "N/A"}
              </div>
            </div> */}
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="text-sm font-medium text-purple-600 mb-1">
                Evaluated On
              </div>
              <div className="font-semibold text-gray-900">
                {answer.evaluatedAt
                  ? new Date(answer.evaluatedAt).toLocaleString()
                  : "N/A"}
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="text-sm font-medium text-green-600 mb-1">
                Attempt
              </div>
              <div className="font-semibold text-gray-900">
                #{answer.attemptNumber}
              </div>
            </div>
            
            {/* <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <div className="text-sm font-medium text-yellow-600 mb-1">
                Difficulty
              </div>
              <div className="font-semibold text-gray-900">
                {question.metadata?.difficultyLevel || "N/A"}
              </div>
            </div> */}
            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
              <div className="text-sm font-medium text-indigo-600 mb-1">
                Estimated Time
              </div>
              <div className="font-semibold text-gray-900">
                {question.metadata?.estimatedTime || "N/A"} min
              </div>
            </div>
            {/* <div className="bg-pink-50 rounded-lg p-4 border border-pink-200">
              <div className="text-sm font-medium text-pink-600 mb-1">
                Max Marks
              </div>
              <div className="font-semibold text-gray-900">
                {question.metadata?.maximumMarks || "N/A"}
              </div>
            </div> */}
          </div>
          {/* Answer Images */}
          {answer.answerImages && answer.answerImages.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Answer Images
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {answer.answerImages.map((img, idx) => (
                  <div key={idx} className="group cursor-pointer">
                    <div className="bg-gray-100 rounded-lg p-4 border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
                      <img
                        src={img.imageUrl}
                        alt={`Answer ${idx + 1}`}
                        className="w-full h-48 object-contain rounded-lg shadow-sm transition-transform group-hover:scale-105"
                        onClick={() => handleImageClick(img.imageUrl)}
                        style={{ cursor: "zoom-in" }}
                      />
                      <div className="mt-3 text-center">
                        <p className="text-xs text-gray-500">
                          {img.uploadedAt
                            ? new Date(img.uploadedAt).toLocaleString()
                            : "N/A"}
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
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Extracted Text
              </h3>
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {answer.extractedTexts[0]
                      .split("\n")
                      .map((line, lineIndex) => {
                        const cleanedLine = line.replace(/^\*\s+|^-\s+/, "");
                        return (
                          <span key={lineIndex}>
                            {cleanedLine}
                            <br />
                          </span>
                        );
                      })}
                  </pre>
                </div>
              </div>
            </div>
          )}
          {/* Evaluation Results */}
          {answer.submissionStatus === "evaluated" && evaluation && (
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Evaluation Results
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                  <div className="text-sm font-medium text-green-600 mb-2">
                    Accuracy
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                    <div
                      className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${evaluation.relevancy || 0}%` }}
                    ></div>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {evaluation.relevancy || 0}%
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                  <div className="text-sm font-medium text-blue-600 mb-2">
                    Score
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {evaluation.score || 0} /{" "}
                    {question.metadata?.maximumMarks || 10}
                  </div>
                </div>
              </div>

              {/* Evaluation Details */}
              <div className="space-y-4">
                {evaluation.analysis.introduction && (
                  <div className="bg-pink-50 rounded-lg p-4 border border-pink-200">
                    <h4 className="text-sm font-medium text-pink-700 mb-2">
                      Introduction
                    </h4>
                    <ul className="space-y-1">
                      {evaluation.analysis.introduction.map(
                        (strength, index) => (
                          <li
                            key={index}
                            className="text-sm text-gray-800 flex items-start gap-2"
                          >
                            <span className="text-pink-500 mt-1">•</span>
                            <span>
                              {strength
                                .replace(/^\*\s+/, "")
                                .replace(/\*\*(.*?)\*\*/g, "$1")}
                            </span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}
                {evaluation.analysis.body && (
                  <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                    <h4 className="text-sm font-medium text-orange-700 mb-2">
                      Body
                    </h4>
                    <ul className="space-y-1">
                      {evaluation.analysis.body.map((strength, index) => (
                        <li
                          key={index}
                          className="text-sm text-gray-800 flex items-start gap-2"
                        >
                          <span className="text-orange-500 mt-1">•</span>
                          <span>
                            {strength
                              .replace(/^\*\s+/, "")
                              .replace(/\*\*(.*?)\*\*/g, "$1")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {evaluation.analysis.conclusion && (
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <h4 className="text-sm font-medium text-purple-700 mb-2">
                      Conclusions
                    </h4>
                    <ul className="space-y-1">
                      {evaluation.analysis.conclusion.map((strength, index) => (
                        <li
                          key={index}
                          className="text-sm text-gray-800 flex items-start gap-2"
                        >
                          <span className="text-purple-500 mt-1">•</span>
                          <span>
                            {strength
                              .replace(/^\*\s+/, "")
                              .replace(/\*\*(.*?)\*\*/g, "$1")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {evaluation.analysis.strengths &&
                  evaluation.analysis.strengths.length > 0 && (
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <h4 className="text-sm font-medium text-green-700 mb-2">
                        Strengths
                      </h4>
                      <ul className="space-y-1">
                        {evaluation.analysis.strengths.map(
                          (strength, index) => (
                            <li
                              key={index}
                              className="text-sm text-gray-800 flex items-start gap-2"
                            >
                              <span className="text-green-500 mt-1">•</span>
                              <span>
                                {strength
                                  .replace(/^\*\s+/, "")
                                  .replace(/\*\*(.*?)\*\*/g, "$1")}
                              </span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                {evaluation.analysis.weaknesses &&
                  evaluation.analysis.weaknesses.length > 0 && (
                    <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                      <h4 className="text-sm font-medium text-red-700 mb-2">
                        Areas for Improvement
                      </h4>
                      <ul className="space-y-1">
                        {evaluation.analysis.weaknesses.map(
                          (weakness, index) => (
                            <li
                              key={index}
                              className="text-sm text-gray-800 flex items-start gap-2"
                            >
                              <span className="text-red-500 mt-1">•</span>
                              <span>
                                {weakness
                                  .replace(/^\*\s+/, "")
                                  .replace(/\*\*(.*?)\*\*/g, "$1")}
                              </span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                {evaluation.analysis.suggestions &&
                  evaluation.analysis.suggestions.length > 0 && (
                    <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                      <h4 className="text-sm font-medium text-yellow-700 mb-2">
                        Suggestions
                      </h4>
                      <ul className="space-y-1">
                        {evaluation.analysis.suggestions.map(
                          (suggestion, index) => (
                            <li
                              key={index}
                              className="text-sm text-gray-800 flex items-start gap-2"
                            >
                              <span className="text-yellow-500 mt-1">•</span>
                              <span>
                                {suggestion
                                  .replace(/^\*\s+/, "")
                                  .replace(/\*\*(.*?)\*\*/g, "$1")}
                              </span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                {evaluation.analysis.feedback && (
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <h4 className="text-sm font-medium text-purple-700 mb-2">
                      Detailed Feedback
                    </h4>
                    <div className="text-sm text-gray-800">
                      {evaluation.analysis.feedback}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* annotated images */}
          {answer.annotations && answer.annotations.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Annotated Images
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {answer.annotations.map((annotations, idx) => (
                  <div key={idx} className="group cursor-pointer">
                    <div className="bg-gray-100 rounded-lg p-4 border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
                      <img
                        src={annotations.downloadUrl}
                        className="w-full h-48 object-contain rounded-lg shadow-sm transition-transform group-hover:scale-105"
                        onClick={() =>
                          handleImageClick(annotations.downloadUrl)
                        }
                        style={{ cursor: "zoom-in" }}
                      />
                      <div className="mt-3 text-center">
                        <p className="text-xs text-gray-500">
                          {annotations.uploadedAt
                            ? new Date(annotations.uploadedAt).toLocaleString()
                            : "N/A"}
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

export default function EvaluatedAnswers() {
  const [evaluatedAnswers, setEvaluatedAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [AnnotatedAnswer, setAnnotatedAnswer] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchEvaluatedManualAnswers = async (
    page = 1,
    search = "",
  ) => {
    setLoading(true);
    setError(null);
    try {
      const token = Cookies.get("evaluatortoken");
      const response = await axios.get(
        `https://test.ailisher.com/api/clients/CLI677117YN7N/mobile/userAnswers/crud/answers/evaluator/evaluated`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          params: {
            page,
            limit: 20,
            search: search || undefined,
          },
        }
      );
      if (response.data.success) {
        const sorted = [...response.data.data.answers].sort(
          (a, b) => new Date(b.evaluatedAt) - new Date(a.evaluatedAt)
        );
        console.log(response)
        setEvaluatedAnswers(sorted);
        setTotalPages(response.data.data.pagination.totalPages);
        setTotalCount(response.data.data.pagination.totalCount);
        setCurrentPage(response.data.data.pagination.currentPage);
      } else {
        setError(response.data.message || "Failed to fetch answers");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch answers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluatedManualAnswers(1);
  }, []);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    fetchEvaluatedManualAnswers(page);
  };

  const getStatusBadge = (status) => {
    let variant = "default";
    let text = status;
    if (status === "evaluated") variant = "info";
    return (
      <Badge variant={variant} className="capitalize">
        {text}
      </Badge>
    );
  };

  const AnswerCard = ({ answer }) => {
    const evaluation = answer.evaluation || {};
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 p-6 mb-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-start gap-3 mb-2">
              <div
                className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-green-500`}
              ></div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 leading-tight">
                  {answer.question?.question || "N/A"}
                </h3>
                <div className="flex grid-cols-2 gap-6">
                  <p className="text-xs text-gray-400 mt-1">
                    QID: {answer.question?._id}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    UID: {answer.userId}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Difficulty level:{" "}
                    {answer.question.metadata?.difficultyLevel}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(answer.submissionStatus)}
            <Badge variant="success" className="text-xs">
              Published
            </Badge>
            {answer.question?.evaluationType === "with annotation" &&
              answer.annotations &&
              answer.annotations.length > 0 && (
                <Badge variant="success" className="text-xs bg-green-500">
                  Annotated
                </Badge>
              )}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Evaluated
            </div>
            <div className="text-sm font-semibold text-gray-900">
              {answer.evaluatedAt
                ? new Date(answer.evaluatedAt).toLocaleString()
                : "N/A"}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Score
            </div>
            <div className="text-sm font-semibold text-gray-900">{`${
              evaluation.score || evaluation.marks || 0
            }/${answer.question.metadata?.maximumMarks || "N/A"}`}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Relevancy
            </div>
            <div className="text-sm font-semibold text-gray-900">{`${
              evaluation.relevancy || evaluation.accuracy || 0
            }%`}</div>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Remark
          </div>
          <div className="text-sm font-semibold text-gray-900">
            {evaluation.remark || "N/A"}
          </div>
        </div>
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg shadow-md hover:from-gray-600 hover:to-gray-700 transition-all duration-200 font-medium flex items-center justify-center gap-2"
            onClick={() => setSelectedAnswer(answer)}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            View Details
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full mb-6">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Evaluated Answers
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Review all answers that have been evaluated and published
          </p>
        </div>

        {/* Stats Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Published Evaluated Answers
              </h2>
              <p className="text-gray-600">
                All evaluated answers that are published
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-600">
                {totalCount}
              </div>
              <div className="text-sm text-gray-500">Total Published</div>
            </div>
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
            <svg
              className="w-12 h-12 text-red-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Error Loading Answers
            </h3>
            <p className="text-red-600">{error}</p>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {evaluatedAnswers.length === 0 ? (
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
                  <svg
                    className="w-16 h-16 text-gray-400 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No Published Answers
                  </h3>
                  <p className="text-gray-600">
                    No answers have been published yet.
                  </p>
                </div>
              ) : (
                evaluatedAnswers.map((answer) => (
                  <AnswerCard key={answer._id} answer={answer} />
                ))
              )}
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        <AnswerDetailsModal
          answer={selectedAnswer}
          open={!!selectedAnswer}
          onClose={() => setSelectedAnswer(null)}
        />
      </div>
    </div>
  );
}
