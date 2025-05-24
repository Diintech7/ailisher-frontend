"use client"

const ErrorState = ({ error, handleBackClick }) => {
  return (
    <div className="container mx-auto px-4 py-8 bg-gradient-to-b from-purple-50 to-indigo-50 min-h-screen">
      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 shadow-lg">
        <h3 className="font-medium text-red-800 text-lg mb-2">Oops! Something went wrong</h3>
        <p className="text-red-700">{error}</p>
        <button
          onClick={handleBackClick}
          className="mt-4 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full hover:shadow-lg transition-all duration-200"
        >
          Go Back
        </button>
      </div>
    </div>
  )
}

export default ErrorState
