"use client"
import { Plus } from "lucide-react"

const SummaryTab = ({ summaries, setShowSummaryModal }) => {
  return (
    <div className="p-6 bg-white rounded-lg shadow border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-medium text-lg">Summary</h3>
        <button
          onClick={() => setShowSummaryModal(true)}
          className="flex items-center px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors text-sm"
        >
          <Plus size={16} className="mr-1" />
          <span>Add Summary</span>
        </button>
      </div>

      {summaries.length === 0 ? (
        <p className="text-gray-600">No summary content available yet. Add your first summary!</p>
      ) : (
        <div className="space-y-4">
          {summaries.map((summary) => (
            <div key={summary.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-800 whitespace-pre-wrap">{summary.content}</p>
              <p className="text-xs text-gray-500 mt-2">Added on {new Date(summary.createdAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SummaryTab
