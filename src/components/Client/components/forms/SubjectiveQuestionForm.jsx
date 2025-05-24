"use client"

import { useState, useEffect, memo } from "react"
import { X } from "lucide-react"

// Isolated form component using memo to prevent re-renders
const SubjectiveQuestionForm = memo(
  ({ initialData, onRemove, canRemove, index, onQuestionChange, fixedDifficulty }) => {
    const [formData, setFormData] = useState({
      question: initialData.question || "",
      answer: initialData.answer || "",
      keywords: initialData.keywords || "",
      difficulty: fixedDifficulty || initialData.difficulty || "L1",
    })

    useEffect(() => {
      setFormData({
        question: initialData.question || "",
        answer: initialData.answer || "",
        keywords: initialData.keywords || "",
        difficulty: fixedDifficulty || initialData.difficulty || "L1",
      })
    }, [initialData, fixedDifficulty])

    const handleChange = (field, value) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }))
    }

    const handleBlur = () => {
      if (onQuestionChange) {
        onQuestionChange(index, formData)
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
          <label className="block text-gray-700 text-sm font-medium mb-2">Answer</label>
          <textarea
            value={formData.answer}
            onChange={(e) => handleChange("answer", e.target.value)}
            onBlur={handleBlur}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 h-32"
            placeholder="Enter the answer..."
          />
        </div>

        <div className="mb-3">
          <label className="block text-gray-700 text-sm font-medium mb-2">Keywords (comma-separated)</label>
          <input
            type="text"
            value={formData.keywords}
            onChange={(e) => handleChange("keywords", e.target.value)}
            onBlur={handleBlur}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="keyword1, keyword2, keyword3"
          />
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
  },
)

export default SubjectiveQuestionForm
