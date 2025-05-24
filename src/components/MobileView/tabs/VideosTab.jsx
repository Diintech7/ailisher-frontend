import { Video, Play } from "lucide-react"
import { useState } from "react"
import { handleVideoView } from "../utilss/api.jsx"

const VideosTab = ({ videos }) => {
  const [playingVideo, setPlayingVideo] = useState(null)

  // Function to get YouTube thumbnail URL
  const getYouTubeThumbnail = (video) => {
    // Use the thumbnail from backend if available
    if (video.thumbnailUrl) {
      return video.thumbnailUrl
    }
    
    // Extract YouTube video ID from various YouTube URL formats
    const extractYouTubeId = (url) => {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
      const match = url.match(regExp)
      return (match && match[2].length === 11) ? match[2] : null
    }
    
    // If it's a YouTube video, generate thumbnail URL
    if (video.videoType === 'youtube' || video.url.includes('youtube.com') || video.url.includes('youtu.be')) {
      const videoId = video.youtubeVideoId || extractYouTubeId(video.url)
      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
      }
    }
    
    return null
  }

  // Function to get YouTube embed URL
  const getYouTubeEmbedUrl = (video) => {
    if (video.embedUrl) {
      return video.embedUrl
    }
    
    const extractYouTubeId = (url) => {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
      const match = url.match(regExp)
      return (match && match[2].length === 11) ? match[2] : null
    }
    
    if (video.videoType === 'youtube' || video.url.includes('youtube.com') || video.url.includes('youtu.be')) {
      const videoId = video.youtubeVideoId || extractYouTubeId(video.url)
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1`
      }
    }
    
    return video.url
  }

  // Handle video play
  const handlePlayVideo = (video) => {
    setPlayingVideo(video._id)
    handleVideoView(video._id)
  }

  // Check if video is YouTube
  const isYouTubeVideo = (video) => {
    return video.videoType === 'youtube' || 
           video.url.includes('youtube.com') || 
           video.url.includes('youtu.be') ||
           video.youtubeVideoId
  }

  return (
    <div className="p-4 md:p-6 bg-white rounded-lg shadow-lg border border-purple-100">
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <h3 className="font-medium text-md md:text-lg text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
          Videos
        </h3>
      </div>

      {videos.length === 0 ? (
        <div className="bg-purple-50 text-center py-8 md:py-12 rounded-xl border border-purple-100 shadow-inner">
          <div className="text-purple-400 mb-3 md:mb-4">
            <Video size={48} className="mx-auto" />
          </div>
          <p className="text-purple-700 font-medium mb-2 md:mb-3">No videos available yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {videos.map((video) => {
            const isYouTube = isYouTubeVideo(video)
            const thumbnailUrl = getYouTubeThumbnail(video)
            const isPlaying = playingVideo === video._id

            return (
              <div
                key={video._id}
                className="border border-purple-200 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="aspect-w-16 aspect-h-9 bg-gray-50 relative">
                  {isPlaying ? (
                    // Show iframe when playing
                    <iframe
                      src={getYouTubeEmbedUrl(video)}
                      title={video.title}
                      className="w-full h-full"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  ) : (
                    // Show thumbnail with play button when not playing
                    <div 
                      className="relative w-full h-full cursor-pointer group"
                      onClick={() => handlePlayVideo(video)}
                    >
                      {isYouTube && thumbnailUrl ? (
                        <>
                          <img
                            src={thumbnailUrl}
                            alt={video.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback to a different thumbnail quality if maxres fails
                              if (e.target.src.includes('maxresdefault')) {
                                e.target.src = e.target.src.replace('maxresdefault', 'hqdefault')
                              }
                            }}
                          />
                          {/* Play button overlay */}
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 group-hover:bg-opacity-40 transition-all duration-300">
                            <div className="bg-red-600 hover:bg-red-700 rounded-full p-4 transform group-hover:scale-110 transition-all duration-300 shadow-lg">
                              <Play size={32} className="text-white ml-1" fill="currentColor" />
                            </div>
                          </div>
                          {/* YouTube badge */}
                          <div className="absolute top-3 right-3 bg-red-600 text-white px-2 py-1 rounded text-xs font-medium">
                            YouTube
                          </div>
                        </>
                      ) : (
                        // For non-YouTube videos or when thumbnail is not available
                        <div className="w-full h-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                          <div className="text-center">
                            <Video size={48} className="text-purple-400 mx-auto mb-2" />
                            <p className="text-purple-600 font-medium">Click to play</p>
                          </div>
                          {/* Play button overlay */}
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 group-hover:bg-opacity-40 transition-all duration-300">
                            <div className="bg-purple-600 hover:bg-purple-700 rounded-full p-4 transform group-hover:scale-110 transition-all duration-300 shadow-lg">
                              <Play size={32} className="text-white ml-1" fill="currentColor" />
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Duration badge if available */}
                      {video.duration && video.duration > 0 && (
                        <div className="absolute bottom-3 right-3 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                          {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="p-5 bg-gradient-to-br from-purple-50 to-indigo-50">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-lg text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 flex-1 mr-2">
                      {video.title}
                    </h4>
                    {isYouTube && (
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <Video size={12} className="mr-1" />
                          YouTube
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {video.description && (
                    <p className="text-gray-600 mb-3 text-sm leading-relaxed">{video.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs">
                    <p className="text-purple-600 font-medium">
                      Added on {new Date(video.createdAt).toLocaleDateString()}
                    </p>
                    
                    {video.viewCount > 0 && (
                      <p className="text-gray-500">
                        {video.viewCount} view{video.viewCount !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                  
                  {/* Tags if available */}
                  {video.tags && video.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {video.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-block bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                      {video.tags.length > 3 && (
                        <span className="text-purple-600 text-xs">
                          +{video.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default VideosTab