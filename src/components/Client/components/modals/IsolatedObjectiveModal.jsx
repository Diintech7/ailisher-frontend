"use client"

import { useState, useEffect } from "react"
import { X, Plus } from "lucide-react"
import axios from "axios"
import Cookies from "js-cookie"
import { toast } from "react-toastify"
import ObjectiveQuestionForm from "../forms/ObjectiveQuestionForm"

const IsolatedObjectiveModal = ({ isOpen, onClose, onSubmit, initialQuestion = null, currentSet = null }) => {
  const [questions, setQuestions] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const getFixedDifficulty = () => {
    if (!currentSet) return "L1"
    return currentSet.level
  }

  useEffect(() => {
    if (isOpen) {
      if (initialQuestion) {
        setQuestions([
          {
            id: initialQuestion._id || `q-${Date.now()}`,
            question: initialQuestion.question || "",
            options: initialQuestion.options || ["", "", "", ""],
            correctAnswer: initialQuestion.correctAnswer !== undefined ? initialQuestion.correctAnswer : 0,
            difficulty: getFixedDifficulty(),
          },
        ])
      } else {
        setQuestions([
          {
            id: `q-${Date.now()}`,
            question: "",
            options: ["", "", "", ""],
            correctAnswer: 0,
            difficulty: getFixedDifficulty(),
          },
        ])
      }
    }
  }, [isOpen, initialQuestion])

  const handleQuestionChange = (index, data) => {
    setQuestions((prevQuestions) => {
      const newQuestions = [...prevQuestions]
      newQuestions[index] = {
        ...prevQuestions[index],
        ...data,
        id: prevQuestions[index].id,
        difficulty: getFixedDifficulty(),
      }
      return newQuestions
    })
  }

  const addQuestionForm = () => {
    setQuestions((prevQuestions) => [
      ...prevQuestions,
      {
        id: `q-${Date.now()}-${prevQuestions.length}`,
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
        difficulty: getFixedDifficulty(),
      },
    ])
  }

  const removeQuestionForm = (index) => {
    if (questions.length <= 1) return
    setQuestions((prevQuestions) => prevQuestions.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    const validQuestions = questions.filter((q) => {
      if (!q.question || q.question.trim() === "") return false
      const validOptions = q.options.filter((opt) => opt && opt.trim() !== "")
      return validOptions.length >= 2
    })

    if (validQuestions.length === 0) {
      toast.error("At least one valid question with two options is required")
      setIsSubmitting(false)
      return
    }

    const cleanedQuestions = validQuestions.map((q) => ({
      ...q,
      options: q.options.filter((opt) => opt && opt.trim() !== ""),
    }))

    try {
      const token = Cookies.get("usertoken")

      if (initialQuestion) {
        // Update existing question
        const response = await axios.put(
          `https://aipbbackend-yxnh.onrender.com/api/objective-assets/questions/${initialQuestion._id}`,
          {
            question: cleanedQuestions[0].question,
            options: cleanedQuestions[0].options,
            correctAnswer: cleanedQuestions[0].correctAnswer,
            difficulty: cleanedQuestions[0].difficulty,
          },
          { headers: { Authorization: `Bearer ${token}` } },
        )

        toast.success("Question updated successfully")
        onSubmit(response.data, currentSet)
      } else {
        // Create new questions
        const response = await axios.post(
          `https://aipbbackend-yxnh.onrender.com/api/objective-assets/question-sets/${currentSet._id}/questions`,
          {
            questions: cleanedQuestions.map((q) => ({
              question: q.question,
              options: q.options,
              correctAnswer: q.correctAnswer,
              difficulty: q.difficulty,
            })),
          },
          { headers: { Authorization: `Bearer ${token}` } },
        )

        toast.success(`${cleanedQuestions.length} question(s) added successfully`)
        onSubmit(response.data, currentSet)
      }

      onClose()
    } catch (error) {
      console.error("Error submitting questions:", error)
      toast.error(error.response?.data?.message || "Failed to submit questions")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {initialQuestion ? "Edit Question" : "Add Questions"}
              {currentSet && ` to "${currentSet.name}"`}
            </h2>
            {currentSet && (
              <p className="text-sm text-gray-600">
                Level:{" "}
                {currentSet.level === "L1" ? "Beginner" : currentSet.level === "L2" ? "Intermediate" : "Advanced"}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto">
          {questions.map((question, index) => (
            <ObjectiveQuestionForm
              key={question.id}
              initialData={question}
              canRemove={questions.length > 1}
              onRemove={() => removeQuestionForm(index)}
              index={index}
              onQuestionChange={handleQuestionChange}
              fixedDifficulty={getFixedDifficulty()}
            />
          ))}

          {!initialQuestion && (
            <div className="mb-4">
              <button
                type="button"
                onClick={addQuestionForm}
                className="w-full py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center"
              >
                <Plus size={18} className="mr-1" />
                <span>Add More Questions</span>
              </button>
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="mr-2">Submitting...</span>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </>
              ) : initialQuestion ? (
                "Update Question"
              ) : (
                "Add Questions"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default IsolatedObjectiveModal