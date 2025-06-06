import { Award } from "lucide-react"

const PyqsTab = ({ pyqs }) => {
  return (
    <div className="p-4 md:p-6 bg-white rounded-lg shadow border border-gray-100">
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <h3 className="font-medium text-md md:text-lg">Previous Year Questions</h3>
      </div>

      {pyqs.length === 0 ? (
        <div className="bg-gray-50 text-center py-8 md:py-12 rounded-md border border-gray-200">
          <div className="text-gray-400 mb-3 md:mb-4">
            <Award size={36} className="mx-auto" />
          </div>
          <p className="text-gray-700 font-medium mb-2 md:mb-3">No previous year questions available yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pyqs.map((pyq) => (
            <div key={pyq._id} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 p-3 md:p-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-md md:text-lg text-indigo-700">
                    {pyq.source ? `${pyq.source} - ${pyq.year}` : pyq.year}
                  </h4>
                  {pyq.difficulty && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      pyq.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                      pyq.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {pyq.difficulty.charAt(0).toUpperCase() + pyq.difficulty.slice(1)}
                    </span>
                  )}
                </div>
              </div>
              <div className="p-3 md:p-4">
                <div className="mb-3">
                  <h5 className="font-medium text-sm md:text-md mb-1">Question:</h5>
                  <p className="text-gray-800">{pyq.question}</p>
                </div>

                {pyq.answer && (
                  <div className="mb-3">
                    <h5 className="font-medium text-sm md:text-md mb-1">Answer:</h5>
                    <p className="text-gray-800">{pyq.answer}</p>
                  </div>
                )}

                <p className="text-xs text-gray-500">Added on {new Date(pyq.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PyqsTab