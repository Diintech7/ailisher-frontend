"use client"
import { Plus, Trash2, Edit, Calendar, Tag, Award } from "lucide-react"
import { useState } from "react"

const PYQsTab = ({ pyqs, setShowPYQModal, onDeletePYQ }) => {
  const [deletingPYQ, setDeletingPYQ] = useState(null)

  const handleDeleteClick = (pyq) => {
    setDeletingPYQ(pyq)
  }

  const confirmDelete = async () => {
    if (deletingPYQ && onDeletePYQ) {
      await onDeletePYQ(deletingPYQ._id)
      setDeletingPYQ(null)
    }
  }

  const cancelDelete = () => {
    setDeletingPYQ(null)
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "hard":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <h3 className="font-medium text-lg">Previous Year Questions</h3>
          <span className="ml-2 bg-indigo-100 text-indigo-800 text-xs font-medium px-2 py-1 rounded-full">
            {pyqs.length}
          </span>
        </div>
        <button
          onClick={() => setShowPYQModal(true)}
          className="flex items-center px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm"
        >
          <Plus size={16} className="mr-1" />
          <span>Add PYQ</span>
        </button>
      </div>

      {pyqs.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Award size={32} className="text-gray-400" />
          </div>
          <p className="text-gray-600 mb-2">No previous year questions available yet</p>
          <p className="text-sm text-gray-500">Add your first PYQ to get started!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pyqs.map((pyq, index) => (
            <div key={pyq._id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="bg-amber-100 text-amber-800 text-xs font-medium px-2 py-1 rounded-md flex items-center">
                    <Calendar size={12} className="mr-1" />
                    {pyq.year}
                  </div>
                  {pyq.source && (
                    <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-md flex items-center">
                      <Tag size={12} className="mr-1" />
                      {pyq.source}
                    </div>
                  )}
                  <div className={`text-xs font-medium px-2 py-1 rounded-md flex items-center ${getDifficultyColor(pyq.difficulty)}`}>
                    <Award size={12} className="mr-1" />
                    {pyq.difficulty}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeleteClick(pyq)}
                    className="text-red-500 hover:text-red-700 transition-colors p-1 rounded-md hover:bg-red-50"
                    title="Delete PYQ"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className="mb-3">
                <p className="font-medium text-gray-800 mb-2">
                  <span className="text-indigo-600 font-semibold">Q{index + 1}.</span> {pyq.question}
                </p>
              </div>
              
              {pyq.answer && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Edit size={14} className="mr-1" />
                    Answer:
                  </p>
                  <div className="bg-white p-3 rounded-md border border-gray-200 shadow-sm">
                    <p className="text-gray-800 whitespace-pre-wrap">{pyq.answer}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-200">
                <span>Added on {new Date(pyq.createdAt).toLocaleDateString()}</span>
                {pyq.updatedAt && pyq.updatedAt !== pyq.createdAt && (
                  <span>Updated on {new Date(pyq.updatedAt).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingPYQ && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center mb-4">
              <div className="bg-red-100 p-2 rounded-full mr-3">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Delete PYQ</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-3">
                Are you sure you want to delete this Previous Year Question?
              </p>
              <div className="bg-gray-50 p-3 rounded-md border-l-4 border-red-400">
                <p className="text-sm text-gray-700 font-medium">
                  {deletingPYQ.question.substring(0, 100)}{deletingPYQ.question.length > 100 ? '...' : ''}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
                    {deletingPYQ.year}
                  </span>
                  {deletingPYQ.source && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {deletingPYQ.source}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-red-600 mt-2">
                This action cannot be undone.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete PYQ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PYQsTab