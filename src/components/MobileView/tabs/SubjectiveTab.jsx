"use client"
import { ArrowLeft, FileQuestion } from "lucide-react"

const SubjectiveTab = ({
  subjectiveQuestionSets,
  activeLevelTab,
  setActiveLevelTab,
  selectedSubjectiveSet,
  setSelectedViewSet,
}) => {
  return (
    <div className="p-4 md:p-6 bg-white rounded-lg shadow border border-gray-100">
      {selectedSubjectiveSet ? (
        <div>
          <div className="flex flex-wrap justify-between items-center mb-4 md:mb-6">
            <div>
              <h3 className="font-medium text-md md:text-lg flex items-center">
                <button
                  onClick={() => setSelectedViewSet(null)}
                  className="mb-2 md:mb-3 text-indigo-600 hover:text-indigo-800 flex items-center"
                >
                  <ArrowLeft size={16} className="mr-1" />
                  <span>Back to Sets</span>
                </button>
              </h3>
              <h3 className="font-medium text-md md:text-lg">
                <span>Questions in "{selectedSubjectiveSet.name}"</span>
              </h3>
              <p className="text-xs md:text-sm text-gray-600 mt-1">
                {selectedSubjectiveSet.level === "L1"
                  ? "Beginner Level"
                  : selectedSubjectiveSet.level === "L2"
                    ? "Intermediate Level"
                    : "Advanced Level"}
                • {selectedSubjectiveSet.questions?.length || 0}{" "}
                {(selectedSubjectiveSet.questions?.length || 0) === 1 ? "Question" : "Questions"}
              </p>
            </div>
          </div>

          {!selectedSubjectiveSet.questions || selectedSubjectiveSet.questions.length === 0 ? (
            <div className="bg-gray-50 text-center py-8 md:py-12 rounded-md border border-gray-200">
              <div className="text-gray-400 mb-3 md:mb-4">
                <FileQuestion size={36} className="mx-auto" />
              </div>
              <p className="text-gray-700 font-medium mb-2 md:mb-3">No questions in this set</p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedSubjectiveSet.questions.map((question, qIndex) => (
                <div key={question._id} className="rounded-lg border border-gray-200 overflow-hidden">
                  <div
                    className={`bg-gradient-to-r p-3 md:p-4 ${
                      selectedSubjectiveSet.level === "L1"
                        ? "from-green-50 to-blue-50"
                        : selectedSubjectiveSet.level === "L2"
                          ? "from-blue-50 to-indigo-50"
                          : "from-indigo-50 to-purple-50"
                    }`}
                  >
                    <div>
                      <p
                        className={`font-medium text-md md:text-lg ${
                          selectedSubjectiveSet.level === "L1"
                            ? "text-green-800"
                            : selectedSubjectiveSet.level === "L2"
                              ? "text-blue-800"
                              : "text-indigo-800"
                        }`}
                      >
                        {qIndex + 1}. {question.question}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-3 md:p-4">
                    <div>
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Answer:</h4>
                        <p className="text-gray-700 whitespace-pre-wrap">{question.answer}</p>
                      </div>

                      {question.keywords && (
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Keywords:</h4>
                          <div className="flex flex-wrap gap-1">
                            {question.keywords.split(",").map((keyword, i) => (
                              <span key={i} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                                {keyword.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-gray-500 mt-2">
                      Added on {new Date(question.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <h3 className="font-medium text-md md:text-lg">Subjective Questions</h3>
          </div>

          <div className="mb-4 md:mb-6 border-b border-purple-200">
            <div className="flex flex-wrap">
              <button
                className={`py-2 px-3 md:py-3 md:px-6 font-medium text-xs md:text-sm rounded-t-lg ${activeLevelTab === "L1" ? "bg-gradient-to-r from-green-500 to-teal-500 text-white" : "text-gray-600 hover:text-purple-800 hover:bg-purple-50"}`}
                onClick={() => setActiveLevelTab("L1")}
              >
                L1 - Beginner
              </button>
              <button
                className={`py-2 px-3 md:py-3 md:px-6 font-medium text-xs md:text-sm rounded-t-lg ${activeLevelTab === "L2" ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white" : "text-gray-600 hover:text-purple-800 hover:bg-purple-50"}`}
                onClick={() => setActiveLevelTab("L2")}
              >
                L2 - Intermediate
              </button>
              <button
                className={`py-2 px-3 md:py-3 md:px-6 font-medium text-xs md:text-sm rounded-t-lg ${activeLevelTab === "L3" ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" : "text-gray-600 hover:text-purple-800 hover:bg-purple-50"}`}
                onClick={() => setActiveLevelTab("L3")}
              >
                L3 - Advanced
              </button>
            </div>
          </div>

          <div>
            {subjectiveQuestionSets[activeLevelTab].length === 0 ? (
              <div className="bg-purple-50 text-center py-8 md:py-12 rounded-xl border border-purple-100 shadow-inner">
                <div className="text-purple-400 mb-3 md:mb-4">
                  <FileQuestion size={48} className="mx-auto" />
                </div>
                <p className="text-purple-700 font-medium mb-2 md:mb-3">No question sets available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subjectiveQuestionSets[activeLevelTab].map((set) => (
                  <div
                    key={set._id}
                    className="border border-purple-200 rounded-xl p-5 bg-white hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                    onClick={() => setSelectedViewSet(set)}
                  >
                    <h4 className="font-medium text-md md:text-lg mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                      {set.name}
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">{set.description || "No description available"}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium px-3 py-1 bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 rounded-full shadow-sm">
                        {set.questions?.length || 0} {set.questions?.length === 1 ? "Question" : "Questions"}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedViewSet(set)
                        }}
                        className="text-xs md:text-sm text-white bg-gradient-to-r from-purple-500 to-indigo-500 px-3 py-1 rounded-full hover:shadow-md transition-all duration-200"
                      >
                        View Questions
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default SubjectiveTab
