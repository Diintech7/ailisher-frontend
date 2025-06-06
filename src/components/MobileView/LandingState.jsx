const LoadingState = () => {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-b from-purple-50 to-indigo-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-600 mb-4"></div>
        <p className="text-purple-700 font-medium">Loading amazing content...</p>
      </div>
    )
  }
  
  export default LoadingState
  