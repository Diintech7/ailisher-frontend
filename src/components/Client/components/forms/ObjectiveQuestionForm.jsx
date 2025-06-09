"use client"

import { useState, useEffect, memo } from "react"
import { X } from "lucide-react"

// Isolated form component for objective questions
const ObjectiveQuestionForm = memo(({ initialData, onRemove, canRemove, index, onQuestionChange, fixedDifficulty }) => {
  const [formData, setFormData] = useState({
    question: initialData.question || "",
    options: initialData.options || ["", "", "", ""],
    correctAnswer: initialData.correctAnswer !== undefined ? initialData.correctAnswer : 0,
    difficulty: fixedDifficulty || initialData.difficulty || "L1",
  })

  useEffect(() => {
    setFormData({
      question: initialData.question || "",
      options: initialData.options || ["", "", "", ""],
      correctAnswer: initialData.correctAnswer !== undefined ? initialData.correctAnswer : 0,
      difficulty: fixedDifficulty || initialData.difficulty || "L1",
    })
  }, [initialData, fixedDifficulty])

  const handleChange = (field, value) => {
    const newData = {
      ...formData,
      [field]: value,
    }
    setFormData(newData)
    if (onQuestionChange) {
      onQuestionChange(index, newData)
    }
  }

  const handleOptionChange = (optIndex, value) => {
    const newOptions = [...formData.options]
    newOptions[optIndex] = value
    const newData = {
      ...formData,
      options: newOptions,
    }
    setFormData(newData)
    if (onQuestionChange) {
      onQuestionChange(index, newData)
    }
  }

  const handleBlur = () => {
    if (onQuestionChange) {
      onQuestionChange(index, formData)
    }
  }

  const handleAddOption = () => {
    const newOptions = [...formData.options, ""]
    const newData = {
      ...formData,
      options: newOptions,
    }
    setFormData(newData)
    if (onQuestionChange) {
      onQuestionChange(index, newData)
    }
  }

  const handleRemoveOption = (optIndex) => {
    if (formData.options.length <= 2) return

    const newOptions = [...formData.options]
    newOptions.splice(optIndex, 1)

    let newCorrectAnswer = formData.correctAnswer
    if (newCorrectAnswer === optIndex) {
      newCorrectAnswer = 0 // Reset to first option if correct answer was removed
    } else if (newCorrectAnswer > optIndex) {
      newCorrectAnswer -= 1 // Adjust correct answer index if it was after the removed option
    }

    const newData = {
      ...formData,
      options: newOptions,
      correctAnswer: newCorrectAnswer,
    }
    setFormData(newData)
    if (onQuestionChange) {
      onQuestionChange(index, newData)
    }
  }

  const handleCorrectAnswerChange = (optIndex) => {
    const newData = {
      ...formData,
      correctAnswer: optIndex,
    }
    setFormData(newData)
    if (onQuestionChange) {
      onQuestionChange(index, newData)
    }
  }

  const getLevelDisplay = (level) => {
    switch (level) {
      case "L1":
        return "L1 - Beginner"
      case "L2":
        return "L2 - Intermediate"
      case "L3":
        return "L3 - Advanced"
      default:
        return level
    }
  }

  return (
    <div className="p-4 bg-gray-50 rounded-lg mb-4 border border-gray-200">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-md font-semibold text-gray-700">Question {index + 1}</h3>

        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-red-500 hover:text-red-700 flex items-center text-sm"
          >
            <X size={16} className="mr-1" />
            <span>Remove</span>
          </button>
        )}
      </div>

      <div className="mb-3">
        <label className="block text-gray-700 text-sm font-medium mb-2">Question</label>
        <textarea
          value={formData.question}
          onChange={(e) => handleChange("question", e.target.value)}
          onBlur={handleBlur}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24"
          placeholder="Enter your question..."
          required
        />
      </div>

      <div className="mb-3">
        <div className="flex justify-between items-center mb-2">
          <label className="block text-gray-700 text-sm font-medium">Options</label>
          <button
            type="button"
            onClick={handleAddOption}
            className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center"
          >
            <span className="mr-1">+</span>
            <span>Add Option</span>
          </button>
        </div>

        {formData.options.map((option, optIndex) => (
          <div key={optIndex} className="flex items-center mb-2">
            <div className="flex-grow flex items-center">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-200 mr-2 text-xs">
                {String.fromCharCode(65 + optIndex)}
              </span>
              <input
                type="text"
                value={option}
                onChange={(e) => handleOptionChange(optIndex, e.target.value)}
                onBlur={handleBlur}
                className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                required={optIndex < 2}
              />
            </div>

            <div className="ml-2 flex items-center">
              <input
                type="radio"
                name={`correctAnswer-${index}`}
                checked={formData.correctAnswer === optIndex}
                onChange={() => handleCorrectAnswerChange(optIndex)}
                className="mr-1"
              />

              {optIndex > 1 && formData.options.length > 2 && (
                <button
                  type="button"
                  onClick={() => handleRemoveOption(optIndex)}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
        <p className="text-xs text-gray-500 mt-1">Select the radio button next to the correct answer</p>
      </div>

      <div className="mb-2">
        <label className="block text-gray-700 text-sm font-medium mb-2">Level (Fixed)</label>
        <div className="px-3 py-2 border border-gray-200 bg-gray-50 rounded-md text-gray-700">
          {getLevelDisplay(fixedDifficulty)}
        </div>
        <p className="text-xs text-gray-500 mt-1">Level is determined by the set you're adding questions to.</p>
      </div>
    </div>
  )
})

export default ObjectiveQuestionForm