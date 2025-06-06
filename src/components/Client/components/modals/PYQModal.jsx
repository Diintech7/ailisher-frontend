"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import axios from "axios"
import Cookies from "js-cookie"
import { toast } from "react-toastify"

const PYQModal = ({
  showPYQModal,
  setShowPYQModal,
  pyqData,
  setPYQData,
  pyqs,
  setPYQs,
  itemType,
  itemId,
  isWorkbook,
  bookId,
  workbookId,
  chapterId,
  topicId,
  subtopicId,
}) => {
  // Use local state for form fields to ensure smooth typing
  const [localPYQData, setLocalPYQData] = useState({
    year: new Date().getFullYear().toString(),
    question: "",
    answer: "",
    difficulty: "medium",
    source: "",
  })

  // Initialize local state when modal opens
  useEffect(() => {
    if (showPYQModal) {
      setLocalPYQData({
        year: pyqData.year || new Date().getFullYear().toString(),
        question: pyqData.question || "",
        answer: pyqData.answer || "",
        difficulty: pyqData.difficulty || "medium",
        source: pyqData.source || "",
      })
    }
  }, [showPYQModal, pyqData])

  const handlePYQSubmit = async (e) => {
    e.preventDefault()

    // Validate required fields
    if (!localPYQData.question.trim()) {
      toast.error("Question is required")
      return
    }

    if (!localPYQData.year.trim()) {
      toast.error("Year is required")
      return
    }

    try {
      const token = Cookies.get("usertoken")
      
      // Use the new PYQ assets endpoint
      const endpoint = `https://aipbbackend-c5ed.onrender.com/api/pyq-assets/${itemType}/${itemId}/pyqs?isWorkbook=${isWorkbook}`

      const response = await axios.post(
        endpoint,
        {
          year: localPYQData.year,
          question: localPYQData.question,
          answer: localPYQData.answer,
          difficulty: localPYQData.difficulty,
          source: localPYQData.source,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      )

      // Update local state with the new PYQ
      setPYQs([...pyqs, response.data.pyq])

      // Reset form data
      setPYQData({
        year: new Date().getFullYear().toString(),
        question: "",
        answer: "",
        difficulty: "medium",
        source: "",
      })

      // Close modal
      setShowPYQModal(false)
      toast.success("PYQ added successfully")
    } catch (error) {
      console.error("Error adding PYQ:", error)
      const errorMessage = error.response?.data?.message || "Failed to add PYQ"
      toast.error(errorMessage)
    }
  }

  if (!showPYQModal) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Add Previous Year Question</h2>
          <button onClick={() => setShowPYQModal(false)} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handlePYQSubmit}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Year*</label>
              <input
                type="number"
                value={localPYQData.year}
                onChange={(e) => setLocalPYQData({ ...localPYQData, year: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="2023"
                min="1900"
                max={new Date().getFullYear() + 1}
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Source/Exam (Optional)</label>
              <input
                type="text"
                value={localPYQData.source}
                onChange={(e) => setLocalPYQData({ ...localPYQData, source: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. JEE, NEET, etc."
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">Question*</label>
            <textarea
              value={localPYQData.question}
              onChange={(e) => setLocalPYQData({ ...localPYQData, question: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24"
              placeholder="Enter the question..."
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">Answer (Optional)</label>
            <textarea
              value={localPYQData.answer}
              onChange={(e) => setLocalPYQData({ ...localPYQData, answer: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24"
              placeholder="Enter the answer..."
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">Difficulty</label>
            <select
              value={localPYQData.difficulty}
              onChange={(e) => setLocalPYQData({ ...localPYQData, difficulty: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowPYQModal(false)}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Add Question
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PYQModal