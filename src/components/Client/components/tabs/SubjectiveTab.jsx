"use client"
import { Plus, ArrowLeft, FileQuestion, Edit, Trash2 } from "lucide-react"

const SubjectiveTab = ({
  selectedViewSet,
  setSelectedViewSet,
  questionSets,
  activeLevelTab,
  setActiveLevelTab,
  setShowCreateSetModal,
  setCurrentSet,
  setEditingQuestion,
  setShowSubjectiveModal,
  setDeletingQuestion,
  setShowDeleteConfirmation,
  handleViewAllQuestions,
}) => {
  // Group question sets by level for better organization
  const groupedQuestionSets = {
    L1: questionSets.filter(set => set.level === 'L1'),
    L2: questionSets.filter(set => set.level === 'L2'),
    L3: questionSets.filter(set => set.level === 'L3')
  }

  if (selectedViewSet) {
    // Show selected set's questions directly
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-medium text-lg flex items-center">
              <button
                onClick={() => setSelectedViewSet(null)}
                className="mb-3 text-indigo-600 hover:text-indigo-800 flex items-center"
              >
                <ArrowLeft size={16} className="mr-1" />
                <span>Back to Sets</span>
              </button>
            </h3>
            <h3 className="font-medium text-lg flex items-center">
              <span>Questions in "{selectedViewSet.name}"</span>
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {selectedViewSet.level === "L1"
                ? "Beginner Level"
                : selectedViewSet.level === "L2"
                  ? "Intermediate Level"
                  : "Advanced Level"}{" "}
              • {selectedViewSet.questions?.length || 0} {(selectedViewSet.questions?.length || 0) === 1 ? "Question" : "Questions"}
            </p>
          </div>
          <button
            onClick={() => {
              setCurrentSet(selectedViewSet)
              setEditingQuestion(null)
              setShowSubjectiveModal(true)
            }}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            <Plus size={18} className="mr-2" />
            <span>Add Questions</span>
          </button>
        </div>

        {!selectedViewSet.questions || selectedViewSet.questions.length === 0 ? (
          <div className="bg-gray-50 text-center py-12 rounded-md border border-gray-200">
            <div className="text-gray-400 mb-4">
              <FileQuestion size={48} className="mx-auto" />
            </div>
            <p className="text-gray-700 font-medium mb-3">No questions in this set yet</p>
            <p className="text-gray-600 mb-6">
              Start adding questions to build your{" "}
              {selectedViewSet.level === "L1"
                ? "beginner"
                : selectedViewSet.level === "L2"
                  ? "intermediate"
                  : "advanced"}{" "}
              question set.
            </p>
            <button
              onClick={() => {
                setCurrentSet(selectedViewSet)
                setEditingQuestion(null)
                setShowSubjectiveModal(true)
              }}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              <Plus size={18} className="mr-2" />
              <span>Add First Question</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {selectedViewSet.questions.map((question, qIndex) => (
              <div
                key={question._id}
                className="rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200"
              >
                {/* Question Header */}
                <div
                  className={`bg-gradient-to-r p-4 ${
                    selectedViewSet.level === "L1"
                      ? "from-green-50 to-blue-50"
                      : selectedViewSet.level === "L2"
                        ? "from-blue-50 to-indigo-50"
                        : "from-indigo-50 to-purple-50"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <p
                      className={`font-medium text-lg ${
                        selectedViewSet.level === "L1"
                          ? "text-green-800"
                          : selectedViewSet.level === "L2"
                            ? "text-blue-800"
                            : "text-indigo-800"
                      }`}
                    >
                      {qIndex + 1}. {question.question}
                    </p>
                    <div className="flex items-center">
                      <button
                        onClick={() => {
                          // Set up editing for this question
                          setEditingQuestion(question)
                          setCurrentSet(selectedViewSet)
                          setShowSubjectiveModal(true)
                        }}
                        className="text-white hover:text-indigo-100 flex items-center text-sm mr-3 bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded"
                        title="Edit question"
                      >
                        <Edit size={16} className="mr-1" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => {
                          setDeletingQuestion(question)
                          setShowDeleteConfirmation(true)
                        }}
                        className="text-white hover:text-red-100 flex items-center text-sm bg-red-600 hover:bg-red-700 px-2 py-1 rounded"
                        title="Delete question"
                      >
                        <Trash2 size={16} className="mr-1" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Question Content */}
                <div className="bg-white p-4">
                  {/* Answer section */}
                  {question.answer && (
                    <div className="mb-4">
                      <div className="flex items-center mb-2">
                        <div
                          className={`h-5 w-5 rounded-full mr-2 flex items-center justify-center ${
                            selectedViewSet.level === "L1"
                              ? "bg-green-600"
                              : selectedViewSet.level === "L2"
                                ? "bg-blue-600"
                                : "bg-indigo-600"
                          }`}
                        >
                          <span className="text-white text-xs font-bold">A</span>
                        </div>
                        <p
                          className={`text-sm font-medium ${
                            selectedViewSet.level === "L1"
                              ? "text-green-800"
                              : selectedViewSet.level === "L2"
                                ? "text-blue-800"
                                : "text-indigo-800"
                          }`}
                        >
                          Answer
                        </p>
                      </div>
                      <div
                        className={`bg-opacity-50 p-4 rounded-r-md whitespace-pre-wrap text-gray-800 ${
                          selectedViewSet.level === "L1"
                            ? "bg-green-50 border-l-4 border-green-500"
                            : selectedViewSet.level === "L2"
                              ? "bg-blue-50 border-l-4 border-blue-500"
                              : "bg-purple-50 border-l-4 border-purple-500"
                        }`}
                      >
                        {question.answer}
                      </div>
                    </div>
                  )}

                  {/* Keywords section */}
                  {question.keywords && question.keywords.trim() && (
                    <div className="mb-2">
                      <div className="flex items-center mb-2">
                        <div
                          className={`h-5 w-5 rounded-full mr-2 flex items-center justify-center ${
                            selectedViewSet.level === "L1"
                              ? "bg-emerald-600"
                              : selectedViewSet.level === "L2"
                                ? "bg-cyan-600"
                                : "bg-violet-600"
                          }`}
                        >
                          <span className="text-white text-xs font-bold">K</span>
                        </div>
                        <p
                          className={`text-sm font-medium ${
                            selectedViewSet.level === "L1"
                              ? "text-emerald-800"
                              : selectedViewSet.level === "L2"
                                ? "text-cyan-800"
                                : "text-violet-800"
                          }`}
                        >
                          Keywords
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {question.keywords.split(",").map(
                          (keyword, i) =>
                            keyword.trim() && (
                              <span
                                key={i}
                                className={`text-white text-xs px-3 py-1.5 rounded-full font-medium ${
                                  selectedViewSet.level === "L1"
                                    ? "bg-gradient-to-r from-green-500 to-emerald-500"
                                    : selectedViewSet.level === "L2"
                                      ? "bg-gradient-to-r from-blue-500 to-cyan-500"
                                      : "bg-gradient-to-r from-indigo-500 to-violet-500"
                                }`}
                              >
                                {keyword.trim()}
                              </span>
                            ),
                        )}
                      </div>
                    </div>
                  )}

                  {/* Date */}
                  <div className="text-xs text-gray-500 mt-2">
                    Added on {new Date(question.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-medium text-lg">Subjective Questions</h3>
      </div>

      {/* Level tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex">
          <button
            className={`py-3 px-6 font-medium text-sm ${
              activeLevelTab === "L1"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setActiveLevelTab("L1")}
          >
            L1 - Beginner
          </button>
          <button
            className={`py-3 px-6 font-medium text-sm ${
              activeLevelTab === "L2"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setActiveLevelTab("L2")}
          >
            L2 - Intermediate
          </button>
          <button
            className={`py-3 px-6 font-medium text-sm ${
              activeLevelTab === "L3"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setActiveLevelTab("L3")}
          >
            L3 - Advanced
          </button>
        </div>
      </div>

      {/* Create Set button */}
      <div className="mb-6">
        <button
          onClick={() => setShowCreateSetModal(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          <Plus size={18} className="mr-2" />
          <span>
            Create {activeLevelTab === "L1" ? "Beginner" : activeLevelTab === "L2" ? "Intermediate" : "Advanced"} Set
          </span>
        </button>
      </div>

      {/* Display question sets for current level */}
      {groupedQuestionSets[activeLevelTab].length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-gray-400 mb-3">
            <FileQuestion size={48} className="mx-auto" />
          </div>
          <h4 className="font-medium text-gray-800 mb-2">No question sets yet</h4>
          <p className="text-gray-600 mb-4">
            Create your first{" "}
            {activeLevelTab === "L1" ? "beginner" : activeLevelTab === "L2" ? "intermediate" : "advanced"} question set
            to get started.
          </p>
          <button
            onClick={() => setShowCreateSetModal(true)}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            <Plus size={18} className="mr-2" />
            <span>Create Set</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groupedQuestionSets[activeLevelTab].map((set) => (
            <div
              key={set._id}
              className="border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200"
              onClick={() => handleViewAllQuestions(set)}
            >
              <div
                className={`p-4 ${
                  activeLevelTab === "L1"
                    ? "bg-gradient-to-r from-green-50 to-blue-50 border-b border-green-100"
                    : activeLevelTab === "L2"
                      ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100"
                      : "bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100"
                }`}
              >
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-gray-800">{set.name}</h4>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      activeLevelTab === "L1"
                        ? "bg-green-100 text-green-800"
                        : activeLevelTab === "L2"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-purple-100 text-purple-800"
                    }`}
                  >
                    {activeLevelTab === "L1" ? "Beginner" : activeLevelTab === "L2" ? "Intermediate" : "Advanced"}
                  </span>
                </div>
                {set.description && <p className="text-gray-600 text-sm mt-2">{set.description}</p>}
              </div>
              <div className="p-4 bg-white">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    {set.questions?.length || 0} {(set.questions?.length || 0) === 1 ? "Question" : "Questions"}
                  </span>
                  <span className="text-xs text-gray-500">Created {new Date(set.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-center mt-3">
                  <button
                    className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm"
                    onClick={(e) => {
                      e.stopPropagation() // Prevent the card's onClick from firing
                      handleViewAllQuestions(set)
                    }}
                  >
                    <FileQuestion size={14} className="mr-1" />
                    <span>View Questions</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

export default SubjectiveTab