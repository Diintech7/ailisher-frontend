"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import axios from "axios"
import Cookies from "js-cookie"
import { toast } from "react-toastify"

const CreateObjectiveSetModal = ({
  showCreateObjectiveSetModal,
  setShowCreateObjectiveSetModal,
  activeObjectiveLevelTab,
  objectiveSets,
  setObjectiveSets,
  itemType,
  isWorkbook,
  bookId,
  workbookId,
  chapterId,
  topicId,
  subtopicId,
}) => {
  const [localSetData, setLocalSetData] = useState({
    name: "",
    description: "",
    level: activeObjectiveLevelTab,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Determine the correct item ID based on context
  const getItemId = () => {
    if (subtopicId) return subtopicId
    if (topicId) return topicId
    if (chapterId) return chapterId
    return isWorkbook ? workbookId : bookId
  }

  useEffect(() => {
    if (showCreateObjectiveSetModal) {
      setLocalSetData({
        name: "",
        description: "",
        level: activeObjectiveLevelTab,
      })
    }
  }, [showCreateObjectiveSetModal, activeObjectiveLevelTab])

  const handleCreateSet = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    if (!localSetData.name.trim()) {
      toast.error("Set name is required")
      setIsSubmitting(false)
      return
    }

    try {
      const token = Cookies.get("usertoken")
      const itemId = getItemId()
      
      // Use the new objective assets endpoint
      const endpoint = `https://aipbbackend.onrender.com/api/objective-assets/${itemType}/${itemId}/question-sets?isWorkbook=${isWorkbook}`

      const response = await axios.post(
        endpoint,
        {
          name: localSetData.name,
          description: localSetData.description,
          level: localSetData.level,
          type: "objective",
        },
        { headers: { Authorization: `Bearer ${token}` } },
      )

      // Update state with the new set from backend
      if (Array.isArray(objectiveSets)) {
        setObjectiveSets([...objectiveSets, response.data.questionSet])
      } else {
        // If objectiveSets is not an array, initialize it as one
        setObjectiveSets([response.data.questionSet])
      }
      
      setShowCreateObjectiveSetModal(false)
      toast.success("Objective question set created successfully")
    } catch (error) {
      console.error("Error creating objective question set:", error)
      toast.error(error.response?.data?.message || "Failed to create objective question set")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!showCreateObjectiveSetModal) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            Create{" "}
            {localSetData.level === "L1" ? "Beginner" : localSetData.level === "L2" ? "Intermediate" : "Advanced"}{" "}
            Objective Set
          </h2>
          <button onClick={() => setShowCreateObjectiveSetModal(false)} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleCreateSet}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">Set Name</label>
            <input
              type="text"
              value={localSetData.name}
              onChange={(e) => setLocalSetData({ ...localSetData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter set name..."
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">Description (Optional)</label>
            <textarea
              value={localSetData.description}
              onChange={(e) => setLocalSetData({ ...localSetData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24"
              placeholder="Enter set description..."
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">Level (Fixed)</label>
            <div className="px-3 py-2 border border-gray-200 bg-gray-50 rounded-md text-gray-700">
              {localSetData.level === "L1"
                ? "L1 - Beginner"
                : localSetData.level === "L2"
                  ? "L2 - Intermediate"
                  : "L3 - Advanced"}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Level is determined by the section you're creating this set in.
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowCreateObjectiveSetModal(false)}
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
                  <span className="mr-2">Creating...</span>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"></div>
                </>
              ) : (
                "Create Set"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateObjectiveSetModal