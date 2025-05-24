"use client"

const TabNavigation = ({ activeTab, setActiveTab }) => {
  return (
    <div className="flex overflow-x-auto pb-2 border-b border-purple-200 bg-white rounded-t-xl shadow-md p-1">
      <button
        className={`py-2 px-4 md:py-3 md:px-6 font-medium text-xs md:text-sm whitespace-nowrap rounded-lg transition-all duration-200 ${
          activeTab === "summary"
            ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md transform scale-105"
            : "text-gray-600 hover:text-purple-800 hover:bg-purple-50"
        }`}
        onClick={() => setActiveTab("summary")}
      >
        Summary
      </button>
      <button
        className={`py-2 px-4 md:py-3 md:px-6 font-medium text-xs md:text-sm whitespace-nowrap rounded-lg transition-all duration-200 ${
          activeTab === "objective"
            ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md transform scale-105"
            : "text-gray-600 hover:text-purple-800 hover:bg-purple-50"
        }`}
        onClick={() => setActiveTab("objective")}
      >
        Objective
      </button>
      <button
        className={`py-2 px-4 md:py-3 md:px-6 font-medium text-xs md:text-sm whitespace-nowrap rounded-lg transition-all duration-200 ${
          activeTab === "subjective"
            ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md transform scale-105"
            : "text-gray-600 hover:text-purple-800 hover:bg-purple-50"
        }`}
        onClick={() => setActiveTab("subjective")}
      >
        Subjective
      </button>
      <button
        className={`py-2 px-4 md:py-3 md:px-6 font-medium text-xs md:text-sm whitespace-nowrap rounded-lg transition-all duration-200 ${
          activeTab === "videos"
            ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md transform scale-105"
            : "text-gray-600 hover:text-purple-800 hover:bg-purple-50"
        }`}
        onClick={() => setActiveTab("videos")}
      >
        Videos
      </button>
      <button
        className={`py-2 px-4 md:py-3 md:px-6 font-medium text-xs md:text-sm whitespace-nowrap rounded-lg transition-all duration-200 ${
          activeTab === "pyqs"
            ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md transform scale-105"
            : "text-gray-600 hover:text-purple-800 hover:bg-purple-50"
        }`}
        onClick={() => setActiveTab("pyqs")}
      >
        PYQ's
      </button>
    </div>
  )
}

export default TabNavigation
