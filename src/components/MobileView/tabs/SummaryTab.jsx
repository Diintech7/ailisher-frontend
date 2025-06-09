const SummaryTab = ({ summaries }) => {
    return (
      <div className="p-4 md:p-6 bg-white rounded-lg shadow-lg border border-purple-100 animate-fadeIn">
        {summaries.length === 0 ? (
          <p className="text-gray-600 text-center py-8 bg-purple-50 rounded-lg border border-purple-100">
            No summary content available yet.
          </p>
        ) : (
          <div className="space-y-4">
            {summaries.map((summary) => (
              <div
                key={summary._id}
                className="p-5 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <p className="text-gray-800 whitespace-pre-wrap">{summary.content}</p>
                <p className="text-xs text-purple-600 mt-3 font-medium">
                  Added on {new Date(summary.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
  
  export default SummaryTab
  