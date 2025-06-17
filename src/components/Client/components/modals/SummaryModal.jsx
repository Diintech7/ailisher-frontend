"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import axios from "axios"
import Cookies from "js-cookie"
import { toast } from "react-toastify"

const SummaryModal = ({
  showSummaryModal,
  setShowSummaryModal,
  summaryData,
  setSummaryData,
  summaries,
  setSummaries,
  itemType,
  isWorkbook,
  bookId,
  workbookId,
  chapterId,
  topicId,
  subtopicId,
}) => {
  const [localSummaryContent, setLocalSummaryContent] = useState(summaryData.content || "")

  // Initialize local state when modal opens
  useEffect(() => {
    if (showSummaryModal) {
      setLocalSummaryContent(summaryData.content || "")
    }
  }, [showSummaryModal, summaryData.content])

  if (!showSummaryModal) return null

  const handleSummarySubmit = async (e) => {
    e.preventDefault()
    if (!localSummaryContent.trim()) {
      toast.error("Summary content is required")
      return
    }

    try {
      const token = Cookies.get("usertoken")
      let endpoint = ""

      // Determine endpoint based on item type
      if (itemType === "book") {
        endpoint = isWorkbook
          ? `https://aipbbackend-c5ed.onrender.com/api/assets/${workbookId}/summaries`
          : `https://aipbbackend-c5ed.onrender.com/api/assets/${bookId}/summaries`
      } else if (itemType === "chapter") {
        endpoint = isWorkbook
          ? `https://aipbbackend-c5ed.onrender.com/api/assets/${workbookId}/chapters/${chapterId}/summaries`
          : `https://aipbbackend-c5ed.onrender.com/api/assets/${bookId}/chapters/${chapterId}/summaries`
      } else if (itemType === "topic") {
        endpoint = isWorkbook
          ? `https://aipbbackend-c5ed.onrender.com/api/assets/${workbookId}/chapters/${chapterId}/topics/${topicId}/summaries`
          : `https://aipbbackend-c5ed.onrender.com/api/assets/${bookId}/chapters/${chapterId}/topics/${topicId}/summaries`
      } else if (itemType === "subtopic") {
        endpoint = isWorkbook
          ? `https://aipbbackend-c5ed.onrender.com/api/assets/${workbookId}/chapters/${chapterId}/topics/${topicId}/subtopics/${subtopicId}/summaries`
          : `https://aipbbackend-c5ed.onrender.com/api/assets/${bookId}/chapters/${chapterId}/topics/${topicId}/subtopics/${subtopicId}/summaries`
      }

      const response = await axios.post(
        endpoint,
        { content: localSummaryContent },
        { headers: { Authorization: `Bearer ${token}` } },
      )

      setSummaries([...summaries, response.data])
      setLocalSummaryContent("")
      setShowSummaryModal(false)
      toast.success("Summary added successfully")
    } catch (error) {
      console.error("Error adding summary:", error)
      toast.error("Failed to add summary")
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Add Summary</h2>
          <button onClick={() => setShowSummaryModal(false)} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSummarySubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">Summary Content</label>
            <textarea
              value={localSummaryContent}
              onChange={(e) => setLocalSummaryContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 h-48"
              placeholder="Enter a comprehensive summary..."
              required
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowSummaryModal(false)}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Add Summary
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SummaryModal
