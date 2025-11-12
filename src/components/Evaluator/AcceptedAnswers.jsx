import React, { useEffect, useState } from "react";
import axios from "axios";
import ManualEvaluationModal from "../Client/QuestionSubmissions/ManualEvaluationModal";
import { Badge } from "../UI/Badge";
import Cookies from "js-cookie";
import AnnotateAnswer from "./AnnotateAnswer";

export default function AcceptedAnswers() {
  const [acceptedAnswers, setAcceptedAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [Answer, setAnswer] = useState(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeImages, setActiveImages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [AnnotatedAnswer, setAnnotatedAnswer] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [evalModalOpen, setEvalModalOpen] = useState(false);

  const fetchAcceptedAnswers = async (
    page = 1,
    search = "",
    publishStatus = ""
  ) => {
    setLoading(true);
    setError(null);
    try {
      const token = Cookies.get("evaluatortoken");
      const response = await axios.get(
        "https://test.ailisher.com/api/answerapis/answers/evaluator/accepted",
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
        setAcceptedAnswers(response.data.data.answers);
        setTotalPages(response.data.data.pagination.totalPages);
        setTotalCount(response.data.data.pagination.totalCount);
        setCurrentPage(response.data.data.pagination.currentPage);
        console.log(response.data)
      } else {
        setError(response.data.message || "Failed to fetch accepted answers");
      }
    } catch (err) {
      console.error("Error fetching accepted answers:", err);
      setError(
        err.response?.data?.message || "Failed to fetch accepted answers"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAcceptedAnswers();
  }, []);

  const handleSearch = () => {
    fetchAcceptedAnswers(1, searchTerm);
  };

  const handlePageChange = (page) => {
    fetchAcceptedAnswers(page, searchTerm);
  };

  const handleEvaluationComplete = async (updatedAnswer) => {
    // Refresh the list to show updated evaluation
    fetchAcceptedAnswers(currentPage, searchTerm);
  };

  const getStatusBadge = (status) => {
    let variant = "default";
    let text = status;
    if (status === "accepted") variant = "success";
    return (
      <Badge variant={variant} className="capitalize">
        {text}
      </Badge>
    );
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
              style={{ height: "100%" }}
              onClick={() => {
                setActiveImages(answer.answerImages);
                setActiveImageIndex(0);
                setImageModalOpen(true);
              }}
            />
            {answer.answerImages.length > 1 && (
              <div className="text-xs text-gray-500 mt-1">
                +{answer.answerImages.length - 1} more image
                {answer.answerImages.length > 2 ? "s" : ""}
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
                      {answer.question.metadata.difficultyLevel}
                    </p>
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
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Accepted
              </div>
              <div className="text-sm font-semibold text-gray-900">
                {answer.acceptedAt
                  ? new Date(answer.acceptedAt).toLocaleString()
                  : "N/A"}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Score
              </div>
              <div className="text-sm font-semibold text-gray-900">
                {`${answer.evaluation.score}/${answer.question.metadata?.maximumMarks}` ||
                  "N/A"}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Relevancy
              </div>
              <div className="text-sm font-semibold text-gray-900">
                {`${answer.evaluation.relevancy}%` || "N/A"}
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Remark
            </div>
            <div className="text-sm font-semibold text-gray-900">
              {answer.evaluation.remark || "N/A"}
            </div>
          </div>
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg shadow-md hover:from-gray-600 hover:to-gray-700 transition-all duration-200 font-medium flex items-center justify-center gap-2"
              onClick={() => setAnswer(answer)}
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
            <button
              className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow-md hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium flex items-center justify-center gap-2"
              onClick={() => {
                setAnnotatedAnswer(answer);
              }}
            >
              Evaluate
            </button>
          </div>
        </div>
      </div>
    </div>
  );

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
            Accepted Answers
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Review all answers that you have accepted and evaluated
          </p>
        </div>

        {/* Stats Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Your Accepted Answers
              </h2>
              <p className="text-gray-600">
                Answers you have reviewed and accepted
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-600">
                {totalCount}
              </div>
              <div className="text-sm text-gray-500">Total Accepted</div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by question, user name, or answer text..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <div className="flex">
              <button
                onClick={handleSearch}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading accepted answers...</p>
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
        ) : acceptedAnswers.length === 0 ? (
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
              No Accepted Answers
            </h3>
            <p className="text-gray-600">
              You haven't accepted any answers yet.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {acceptedAnswers.map((answer) => (
                <AnswerCard key={answer._id} answer={answer} />
              ))}
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
        {/* Modals */}
        {AnnotatedAnswer && (
          <AnnotateAnswer
            submission={AnnotatedAnswer}
            onSave={handleEvaluationComplete}
            onClose={() => setAnnotatedAnswer(null)}
          />
        )}
        <AnswerDetailsModal
          answer={Answer}
          open={!!Answer}
          onClose={() => setAnswer(null)}
        />
      </div>
      {/* Image Lightbox Modal */}
      {imageModalOpen && (
        <ImageLightbox
          images={activeImages}
          currentIndex={activeImageIndex}
          onClose={() => setImageModalOpen(false)}
          onPrev={() => setActiveImageIndex((idx) => Math.max(0, idx - 1))}
          onNext={() =>
            setActiveImageIndex((idx) =>
              Math.min(activeImages.length - 1, idx + 1)
            )
          }
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
  const relevancy =
    evaluation.relevancy || evaluation.accuracy || "Not evaluated";
  const score = evaluation.score || evaluation.marks || "Not evaluated";
  const remark = evaluation.remark || "No remark provided";
  const comments = evaluation.comments || [];
  const analysis = evaluation.analysis || {};
  const strengths = analysis.strengths || evaluation.strengths || [];
  const weaknesses = analysis.weaknesses || evaluation.weaknesses || [];
  const suggestions = analysis.suggestions || evaluation.suggestions || [];
  const evaluationFeedback =
    analysis.feedback || evaluation.feedback || "No feedback provided";

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
                Accepted Answer Details
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Question ID: {question._id}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                User ID: {answer.userId}
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
              <div className="text-sm font-medium text-blue-600 mb-1">User</div>
              <div className="font-semibold text-gray-900">
                {user.name || answer.userId || "N/A"}
              </div>
              {user.email && (
                <div className="text-xs text-gray-500 mt-1">{user.email}</div>
              )}
            </div> */}
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="text-sm font-medium text-purple-600 mb-1">
                Accepted On
              </div>
              <div className="font-semibold text-gray-900">
                {answer.acceptedAt
                  ? new Date(answer.acceptedAt).toLocaleString()
                  : "N/A"}
              </div>
            </div>
            {/* <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="text-sm font-medium text-purple-600 mb-1">
                Submitted
              </div>
              <div className="font-semibold text-gray-900">
                {answer.submittedAt
                  ? new Date(answer.submittedAt).toLocaleString()
                  : "N/A"}
              </div>
            </div> */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="text-sm font-medium text-green-600 mb-1">
                Attempt
              </div>
              <div className="font-semibold text-gray-900">
                #{answer.attemptNumber}
              </div>
            </div>
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
                        <p className="text-sm font-medium text-gray-700">
                          {img.originalName}
                        </p>
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

          {/* Evaluation Details */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Evaluation Details
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
          </div>

          {/* Evaluation Remark */}
          {remark && remark !== "No remark provided" && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-orange-800 mb-3">
                Evaluation Remark
              </h4>
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <p className="text-orange-800">{remark}</p>
              </div>
            </div>
          )}

          {/* Evaluation Comments */}
          {comments.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-indigo-800 mb-3">
                Evaluation Comments
              </h4>
              <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                <ul className="space-y-2">
                  {comments.map((comment, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <svg
                        className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      <span className="text-indigo-800">{comment}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Analysis Details */}
          {analysis.introduction && (
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
          {analysis.conclusion && (
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
              <h4 className="text-lg font-semibold text-green-800 mb-3">
                Strengths
              </h4>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <ul className="space-y-2">
                  {strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <svg
                        className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
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
              <h4 className="text-lg font-semibold text-red-800 mb-3">
                Areas for Improvement
              </h4>
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <ul className="space-y-2">
                  {weaknesses.map((weakness, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <svg
                        className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0"
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
              <h4 className="text-lg font-semibold text-blue-800 mb-3">
                Suggestions
              </h4>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <ul className="space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <svg
                        className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-blue-800">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Evaluation Feedback */}
          {evaluationFeedback &&
            evaluationFeedback !== "No feedback provided" && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-purple-800 mb-3">
                  Detailed Feedback
                </h4>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <p className="text-purple-800 whitespace-pre-wrap">
                    {evaluationFeedback}
                  </p>
                </div>
              </div>
            )}

          {/* Text Answer */}
          {answer.textAnswer && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">
                Text Answer
              </h4>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-gray-800 whitespace-pre-wrap">
                  {answer.textAnswer}
                </p>
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
        style={{ objectFit: "contain" }}
      />
      <button
        className="absolute right-8 text-white text-3xl font-bold bg-black bg-opacity-40 rounded-full w-12 h-12 flex items-center justify-center hover:bg-opacity-70 transition-all"
        onClick={onNext}
        aria-label="Next"
        disabled={currentIndex === images.length - 1}
        style={{
          top: "50%",
          transform: "translateY(-50%)",
          opacity: currentIndex === images.length - 1 ? 0.3 : 1,
        }}
      >
        ›
      </button>
    </div>
  );
};
