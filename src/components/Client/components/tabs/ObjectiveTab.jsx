"use client"
import { Plus, ArrowLeft, FileQuestion, Edit, Trash2, Check } from "lucide-react"

const ObjectiveTab = ({
  selectedObjectiveSet,
  setSelectedObjectiveSet,
  objectiveQuestionSets,
  activeObjectiveLevelTab,
  setActiveObjectiveLevelTab,
  setShowCreateObjectiveSetModal,
  setCurrentObjectiveSet,
  setEditingObjectiveQuestion,
  setShowObjectiveModal,
  setDeletingObjectiveQuestion,
  setShowDeleteConfirmation,
  handleViewAllObjectiveQuestions,
}) => {
  // Add safety check for undefined objectiveQuestionSets
  if (!objectiveQuestionSets) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-600">Error: Question sets data is not available.</p>
      </div>
    )
  }

  // Group question sets by level
  const groupedSets = {
    L1: [],
    L2: [],
    L3: []
  }

  // If objectiveQuestionSets is an array, group them by level
  if (Array.isArray(objectiveQuestionSets)) {
    objectiveQuestionSets.forEach(set => {
      if (groupedSets[set.level]) {
        groupedSets[set.level].push(set)
      }
    })
  }

  if (selectedObjectiveSet) {
    // Show selected set's questions directly
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-medium text-lg flex items-center">
              <button
                onClick={() => setSelectedObjectiveSet(null)}
                className="mb-3 text-indigo-600 hover:text-indigo-800 flex items-center"
              >
                <ArrowLeft size={16} className="mr-1" />
                <span>Back to Sets</span>
              </button>
            </h3>
            <h3 className="font-medium text-lg flex items-center">
              <span>Questions in "{selectedObjectiveSet.name}"</span>
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {selectedObjectiveSet.level === "L1"
                ? "Beginner Level"
                : selectedObjectiveSet.level === "L2"
                  ? "Intermediate Level"
                  : "Advanced Level"}{" "}
              • {selectedObjectiveSet.questions?.length || 0}{" "}
              {(selectedObjectiveSet.questions?.length || 0) === 1 ? "Question" : "Questions"}
            </p>
          </div>
          <button
            onClick={() => {
              setCurrentObjectiveSet(selectedObjectiveSet)
              setEditingObjectiveQuestion(null)
              setShowObjectiveModal(true)
            }}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            <Plus size={18} className="mr-2" />
            <span>Add Questions</span>
          </button>
        </div>

        {(!selectedObjectiveSet.questions || selectedObjectiveSet.questions.length === 0) ? (
          <div className="bg-gray-50 text-center py-12 rounded-md border border-gray-200">
            <div className="text-gray-400 mb-4">
              <FileQuestion size={48} className="mx-auto" />
            </div>
            <p className="text-gray-700 font-medium mb-3">No questions in this set yet</p>
            <p className="text-gray-600 mb-6">
              Start adding questions to build your{" "}
              {selectedObjectiveSet.level === "L1"
                ? "beginner"
                : selectedObjectiveSet.level === "L2"
                  ? "intermediate"
                  : "advanced"}{" "}
              question set.
            </p>
            <button
              onClick={() => {
                setCurrentObjectiveSet(selectedObjectiveSet)
                setEditingObjectiveQuestion(null)
                setShowObjectiveModal(true)
              }}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              <Plus size={18} className="mr-2" />
              <span>Add First Question</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {selectedObjectiveSet.questions.map((question, qIndex) => (
              <div
                key={question._id || question.id}
                className="rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200"
              >
                {/* Question Header */}
                <div
                  className={`bg-gradient-to-r p-4 ${
                    selectedObjectiveSet.level === "L1"
                      ? "from-green-50 to-blue-50"
                      : selectedObjectiveSet.level === "L2"
                        ? "from-blue-50 to-indigo-50"
                        : "from-indigo-50 to-purple-50"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <p
                      className={`font-medium text-lg ${
                        selectedObjectiveSet.level === "L1"
                          ? "text-green-800"
                          : selectedObjectiveSet.level === "L2"
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
                          setEditingObjectiveQuestion(question)
                          setCurrentObjectiveSet(selectedObjectiveSet)
                          setShowObjectiveModal(true)
                        }}
                        className="text-white hover:text-indigo-100 flex items-center text-sm mr-3 bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded"
                        title="Edit question"
                      >
                        <Edit size={16} className="mr-1" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => {
                          setDeletingObjectiveQuestion(question)
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

                {/* Question Content - Options */}
                <div className="bg-white p-4">
                  <div className="mb-4 space-y-2">
                    {question.options?.map((option, optIndex) => (
                      <div key={optIndex} className="flex items-center">
                        <span
                          className={`inline-flex items-center justify-center h-6 w-6 rounded-full mr-2 text-xs ${
                            optIndex === question.correctAnswer
                              ? "bg-green-600 text-white"
                              : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {String.fromCharCode(65 + optIndex)}
                        </span>
                        <span
                          className={`${
                            optIndex === question.correctAnswer ? "font-medium text-green-700" : "text-gray-700"
                          }`}
                        >
                          {option}
                        </span>
                        {optIndex === question.correctAnswer && (
                          <span className="ml-2 text-green-600">
                            <Check size={16} />
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

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
        <h3 className="font-medium text-lg">Objective Questions</h3>
      </div>

      {/* Level tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex">
          <button
            className={`py-3 px-6 font-medium text-sm ${
              activeObjectiveLevelTab === "L1"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setActiveObjectiveLevelTab("L1")}
          >
            L1 - Beginner
          </button>
          <button
            className={`py-3 px-6 font-medium text-sm ${
              activeObjectiveLevelTab === "L2"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setActiveObjectiveLevelTab("L2")}
          >
            L2 - Intermediate
          </button>
          <button
            className={`py-3 px-6 font-medium text-sm ${
              activeObjectiveLevelTab === "L3"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setActiveObjectiveLevelTab("L3")}
          >
            L3 - Advanced
          </button>
        </div>
      </div>

      {/* Create Set button */}
      <div className="mb-6">
        <button
          onClick={() => {
            setShowCreateObjectiveSetModal(true)
          }}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          <Plus size={18} className="mr-2" />
          <span>
            Create{" "}
            {activeObjectiveLevelTab === "L1"
              ? "Beginner"
              : activeObjectiveLevelTab === "L2"
                ? "Intermediate"
                : "Advanced"}{" "}
            Set
          </span>
        </button>
      </div>

      {/* Display question sets for current level */}
      {groupedSets[activeObjectiveLevelTab].length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-gray-400 mb-3">
            <FileQuestion size={48} className="mx-auto" />
          </div>
          <h4 className="font-medium text-gray-800 mb-2">No question sets yet</h4>
          <p className="text-gray-600 mb-4">
            Create your first{" "}
            {activeObjectiveLevelTab === "L1"
              ? "beginner"
              : activeObjectiveLevelTab === "L2"
                ? "intermediate"
                : "advanced"}{" "}
            question set to get started.
          </p>
          <button
            onClick={() => {
              setShowCreateObjectiveSetModal(true)
            }}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            <Plus size={18} className="mr-2" />
            <span>Create Set</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groupedSets[activeObjectiveLevelTab].map((set) => (
            <div
              key={set._id || set.id}
              className="border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200"
              onClick={() => handleViewAllObjectiveQuestions(set)}
            >
              <div
                className={`p-4 ${
                  activeObjectiveLevelTab === "L1"
                    ? "bg-gradient-to-r from-green-50 to-blue-50 border-b border-green-100"
                    : activeObjectiveLevelTab === "L2"
                      ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100"
                      : "bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100"
                }`}
              >
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-gray-800">{set.name}</h4>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      activeObjectiveLevelTab === "L1"
                        ? "bg-green-100 text-green-800"
                        : activeObjectiveLevelTab === "L2"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-purple-100 text-purple-800"
                    }`}
                  >
                    {activeObjectiveLevelTab === "L1"
                      ? "Beginner"
                      : activeObjectiveLevelTab === "L2"
                        ? "Intermediate"
                        : "Advanced"}
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
                      handleViewAllObjectiveQuestions(set)
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

export default ObjectiveTab