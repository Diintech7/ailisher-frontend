"use client"
import { useState } from "react"
import { ArrowLeft, FileQuestion } from "lucide-react"
import { toast } from "react-toastify"
import { handleObjectiveAnswer, apiRequest } from "../utilss/api.jsx"

const ObjectiveTab = ({
  objectiveQuestionSets,
  activeObjectiveLevelTab,
  setActiveObjectiveLevelTab,
  selectedObjectiveSet,
  setSelectedObjectiveSet,
}) => {
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  
  // Enhanced debug logging
  console.log('ObjectiveTab - objectiveQuestionSets:', objectiveQuestionSets)
  console.log('ObjectiveTab - activeObjectiveLevelTab:', activeObjectiveLevelTab)
  console.log('ObjectiveTab - current level sets:', objectiveQuestionSets[activeObjectiveLevelTab])
  
  // ADD THESE DEBUG LOGS:
  console.log('ObjectiveTab - selectedObjectiveSet:', selectedObjectiveSet)
  if (selectedObjectiveSet) {
    console.log('ObjectiveTab - selectedObjectiveSet.questions:', selectedObjectiveSet.questions)
    console.log('ObjectiveTab - selectedObjectiveSet keys:', Object.keys(selectedObjectiveSet))
    console.log('ObjectiveTab - selectedObjectiveSet structure:', JSON.stringify(selectedObjectiveSet, null, 2))
  }

  const handleSetSelection = async (set) => {
    try {
      setLoadingQuestions(true)
      
      // Check if questions are already loaded and properly structured
      if (set.questions && Array.isArray(set.questions) && set.questions.length > 0) {
        // Check if questions are populated objects or just IDs
        const firstQuestion = set.questions[0]
        if (typeof firstQuestion === 'object' && firstQuestion.question) {
          // Questions are already populated
          setSelectedObjectiveSet(set)
          setLoadingQuestions(false)
          return
        }
      }

      // Fetch questions for this specific set
      console.log('Fetching questions for set:', set._id)
      
      // Try multiple API endpoints to get questions
      let response
      let questions = []
      
      try {
        // First try the specific question set endpoint
        response = await apiRequest(`/objective-assets/question-sets/${set._id}/questions`)
        questions = response.questions || response || []
        console.log('Questions from question-sets endpoint:', questions)
      } catch (error) {
        console.log('Question-sets endpoint failed, trying alternative:', error)
        
        // If that fails, try getting questions directly by question set ID
        try {
          response = await apiRequest(`/objective-assets/questions?questionSet=${set._id}`)
          questions = response.questions || response || []
          console.log('Questions from questions endpoint:', questions)
        } catch (error2) {
          console.log('Alternative endpoint also failed:', error2)
          
          // Last resort: try getting all objective questions and filter
          try {
            response = await apiRequest(`/objective-assets/questions`)
            const allQuestions = response.questions || response || []
            questions = allQuestions.filter(q => 
              q.questionSet === set._id || 
              (q.questionSet && q.questionSet._id === set._id)
            )
            console.log('Questions from filtered all questions:', questions)
          } catch (error3) {
            console.error('All endpoints failed:', error3)
            throw error3
          }
        }
      }
      
      // Update the set with the fetched questions
      const updatedSet = {
        ...set,
        questions: questions
      }
      
      console.log('Final questions array:', questions)
      console.log('Updated set:', updatedSet)
      setSelectedObjectiveSet(updatedSet)
      
    } catch (error) {
      console.error('Error fetching questions:', error)
      toast.error("Failed to load questions for this set")
      
      // Still set the selected set even if questions failed to load
      // This will show the "No questions" message
      setSelectedObjectiveSet({
        ...set,
        questions: []
      })
    } finally {
      setLoadingQuestions(false)
    }
  }

  const handleAnswerSubmit = async (questionId, selectedAnswer) => {
    try {
      const data = await handleObjectiveAnswer(questionId, selectedAnswer)

      if (data) {
        toast.success(data.isCorrect ? "Correct answer!" : "Incorrect answer", {
          position: "top-center",
          autoClose: 2000,
        })
      } else {
        toast.error("Failed to record answer")
      }
    } catch (err) {
      console.error('Error submitting answer:', err)
      toast.error("Failed to record answer")
    }
  }

  // Safe access to question sets
  const currentLevelSets = objectiveQuestionSets && objectiveQuestionSets[activeObjectiveLevelTab] 
    ? objectiveQuestionSets[activeObjectiveLevelTab] 
    : []

  return (
    <div className="p-4 md:p-6 bg-white rounded-lg shadow border border-gray-100">
      {selectedObjectiveSet ? (
        <div>
          <div className="flex flex-wrap justify-between items-center mb-4 md:mb-6">
            <div>
              <h3 className="font-medium text-md md:text-lg flex items-center">
                <button
                  onClick={() => setSelectedObjectiveSet(null)}
                  className="mb-2 md:mb-3 text-indigo-600 hover:text-indigo-800 flex items-center"
                >
                  <ArrowLeft size={16} className="mr-1" />
                  <span>Back to Sets</span>
                </button>
              </h3>
              <h3 className="font-medium text-md md:text-lg">
                <span>Questions in "{selectedObjectiveSet.name}"</span>
              </h3>
              <p className="text-xs md:text-sm text-gray-600 mt-1">
                {selectedObjectiveSet.level === "L1"
                  ? "Beginner Level"
                  : selectedObjectiveSet.level === "L2"
                    ? "Intermediate Level"
                    : "Advanced Level"}
                • {selectedObjectiveSet.questions?.length || 0}{" "}
                {(selectedObjectiveSet.questions?.length || 0) === 1 ? "Question" : "Questions"}
                {selectedObjectiveSet.totalQuestions && selectedObjectiveSet.totalQuestions !== (selectedObjectiveSet.questions?.length || 0) && (
                  <span className="text-gray-500"> (Total: {selectedObjectiveSet.totalQuestions})</span>
                )}
              </p>
            </div>
          </div>

          {loadingQuestions ? (
            <div className="bg-gray-50 text-center py-8 md:py-12 rounded-md border border-gray-200">
              <div className="text-gray-400 mb-3 md:mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              </div>
              <p className="text-gray-700 font-medium mb-2 md:mb-3">Loading questions...</p>
              <p className="text-gray-500 text-sm">Please wait while we fetch the questions for this set.</p>
            </div>
          ) : !selectedObjectiveSet.questions || selectedObjectiveSet.questions.length === 0 ? (
            <div className="bg-gray-50 text-center py-8 md:py-12 rounded-md border border-gray-200">
              <div className="text-gray-400 mb-3 md:mb-4">
                <FileQuestion size={36} className="mx-auto" />
              </div>
              <p className="text-gray-700 font-medium mb-2 md:mb-3">No questions in this set</p>
              <p className="text-gray-500 text-sm">
                {selectedObjectiveSet.totalQuestions > 0 
                  ? "Questions could not be loaded. Please try again later." 
                  : "This set appears to be empty."}
              </p>
              {selectedObjectiveSet.totalQuestions > 0 && (
                <button
                  onClick={() => handleSetSelection(selectedObjectiveSet)}
                  className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Retry Loading Questions
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {selectedObjectiveSet.questions.map((question, qIndex) => {
                // Handle both populated question objects and ID references
                const questionData = typeof question === 'object' ? question : null
                
                if (!questionData || !questionData.question) {
                  return (
                    <div key={qIndex} className="rounded-lg border border-red-200 bg-red-50 p-4">
                      <p className="text-red-600">Question data not available (ID: {question})</p>
                    </div>
                  )
                }

                return (
                  <div key={questionData._id || qIndex} className="rounded-lg border border-gray-200 overflow-hidden">
                    <div
                      className={`bg-gradient-to-r p-3 md:p-4 ${
                        selectedObjectiveSet.level === "L1"
                          ? "from-green-50 to-blue-50"
                          : selectedObjectiveSet.level === "L2"
                            ? "from-blue-50 to-indigo-50"
                            : "from-indigo-50 to-purple-50"
                      }`}
                    >
                      <div>
                        <p
                          className={`font-medium text-md md:text-lg ${
                            selectedObjectiveSet.level === "L1"
                              ? "text-green-800"
                              : selectedObjectiveSet.level === "L2"
                                ? "text-blue-800"
                                : "text-indigo-800"
                          }`}
                        >
                          {qIndex + 1}. {questionData.question}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white p-3 md:p-4">
                      <div className="mb-3 space-y-2">
                        {questionData.options && Array.isArray(questionData.options) ?
                          questionData.options.map((option, optIndex) => (
                            <div
                              key={optIndex}
                              className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                              onClick={() => handleAnswerSubmit(questionData._id, optIndex)}
                            >
                              <span
                                className={`inline-flex items-center justify-center h-6 w-6 rounded-full mr-2 ${
                                  optIndex === questionData.correctAnswer
                                    ? "bg-green-600 text-white"
                                    : "bg-gray-200 text-gray-700"
                                }`}
                              >
                                {String.fromCharCode(65 + optIndex)}
                              </span>
                              <span
                                className={`${optIndex === questionData.correctAnswer ? "font-medium text-green-700" : "text-gray-700"}`}
                              >
                                {option}
                              </span>
                            </div>
                          )) : (
                            <p className="text-red-500 text-sm">No options available for this question</p>
                          )}
                      </div>

                      <div className="text-xs text-gray-500 mt-2">
                        Added on {questionData.createdAt ? new Date(questionData.createdAt).toLocaleDateString() : 'Unknown date'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <h3 className="font-medium text-md md:text-lg">Objective Questions</h3>
          </div>

          <div className="mb-4 md:mb-6 border-b border-purple-200">
            <div className="flex flex-wrap">
              <button
                className={`py-2 px-3 md:py-3 md:px-6 font-medium text-xs md:text-sm rounded-t-lg ${activeObjectiveLevelTab === "L1" ? "bg-gradient-to-r from-green-500 to-teal-500 text-white" : "text-gray-600 hover:text-purple-800 hover:bg-purple-50"}`}
                onClick={() => setActiveObjectiveLevelTab("L1")}
              >
                L1 - Beginner ({objectiveQuestionSets?.L1?.length || 0})
              </button>
              <button
                className={`py-2 px-3 md:py-3 md:px-6 font-medium text-xs md:text-sm rounded-t-lg ${activeObjectiveLevelTab === "L2" ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white" : "text-gray-600 hover:text-purple-800 hover:bg-purple-50"}`}
                onClick={() => setActiveObjectiveLevelTab("L2")}
              >
                L2 - Intermediate ({objectiveQuestionSets?.L2?.length || 0})
              </button>
              <button
                className={`py-2 px-3 md:py-3 md:px-6 font-medium text-xs md:text-sm rounded-t-lg ${activeObjectiveLevelTab === "L3" ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" : "text-gray-600 hover:text-purple-800 hover:bg-purple-50"}`}
                onClick={() => setActiveObjectiveLevelTab("L3")}
              >
                L3 - Advanced ({objectiveQuestionSets?.L3?.length || 0})
              </button>
            </div>
          </div>

          <div>
            {currentLevelSets.length === 0 ? (
              <div className="bg-purple-50 text-center py-8 md:py-12 rounded-xl border border-purple-100 shadow-inner">
                <div className="text-purple-400 mb-3 md:mb-4">
                  <FileQuestion size={48} className="mx-auto" />
                </div>
                <p className="text-purple-700 font-medium mb-2 md:mb-3">No question sets available</p>
                <p className="text-purple-600 text-sm">
                  No {activeObjectiveLevelTab === "L1" ? "beginner" : activeObjectiveLevelTab === "L2" ? "intermediate" : "advanced"} level question sets found.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentLevelSets.map((set) => (
                  <div
                    key={set._id}
                    className="border border-purple-200 rounded-xl p-5 bg-white hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                    onClick={() => handleSetSelection(set)}
                  >
                    <h4 className="font-medium text-md md:text-lg mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                      {set.name}
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">{set.description || "No description available"}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium px-3 py-1 bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 rounded-full shadow-sm">
                        {set.questions?.length || set.totalQuestions || 0} {((set.questions?.length || set.totalQuestions || 0) === 1) ? "Question" : "Questions"}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSetSelection(set)
                        }}
                        className="text-xs md:text-sm text-white bg-gradient-to-r from-purple-500 to-indigo-500 px-3 py-1 rounded-full hover:shadow-md transition-all duration-200"
                        disabled={loadingQuestions}
                      >
                        {loadingQuestions ? "Loading..." : "View Questions"}
                      </button>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Level: {set.level === "L1" ? "Beginner" : set.level === "L2" ? "Intermediate" : "Advanced"}
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

export default ObjectiveTab