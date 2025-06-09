"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"

const DeleteConfirmationModal = ({
  showDeleteConfirmation,
  setShowDeleteConfirmation,
  deletingQuestion,
  setDeletingQuestion,
  deletingObjectiveQuestion,
  setDeletingObjectiveQuestion,
  handleDeleteQuestion,
  handleDeleteObjectiveQuestion,
}) => {
  // Use component-level state to prevent the state from being recreated with every render
  const [isLoading, setIsLoading] = useState(false)

  if (!showDeleteConfirmation) return null

  const handleDeleteWithLoading = () => {
    setIsLoading(true)

    // Check if we're deleting a subjective or objective question
    if (deletingQuestion) {
      handleDeleteQuestion()
    } else if (deletingObjectiveQuestion) {
      handleDeleteObjectiveQuestion()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Delete Question</h2>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete this question? This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => {
              setDeletingQuestion(null)
              setDeletingObjectiveQuestion(null)
              setShowDeleteConfirmation(false)
            }}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteWithLoading}
            disabled={isLoading}
            className={`px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            {isLoading ? (
              <>
                <span className="mr-2">Deleting...</span>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </>
            ) : (
              <>
                <Trash2 size={16} className="mr-2" />
                Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteConfirmationModal
