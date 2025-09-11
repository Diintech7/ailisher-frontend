// API request helper without authentication
export const apiRequest = async (url, options = {}) => {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  }

  const response = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api${url}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Request failed" }))
    throw new Error(errorData.message || `HTTP ${response.status}`)
  }

  return response.json()
}

// Helper function to get complete image URL
export const getCompleteImageUrl = (imageUrl) => {
  if (!imageUrl) return ""
  if (imageUrl.startsWith("http")) return imageUrl
  return `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/${imageUrl}`
}

// Record video view
export const handleVideoView = async (videoId) => {
  try {
    await apiRequest(`/video-assets/videos/${videoId}/view`, { method: "POST" })
  } catch (err) {
    console.error("Error recording video view:", err)
  }
}

// Record objective question answer
export const handleObjectiveAnswer = async (questionId, selectedAnswer) => {
  try {
    const data = await apiRequest(`/objective-assets/questions/${questionId}/answer`, {
      method: "POST",
      body: JSON.stringify({ selectedAnswer }),
    })

    return data
  } catch (err) {
    console.error("Error recording answer:", err)
    return null
  }
}