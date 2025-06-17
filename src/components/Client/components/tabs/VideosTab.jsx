"use client"
import { Plus, Play, Trash2, Eye, Clock, HardDrive, Calendar, Youtube, Upload } from "lucide-react"
import { useState } from "react"
import axios from "axios"
import Cookies from "js-cookie"
import { toast } from "react-toastify"

const VideosTab = ({ videos, setShowVideoModal, onDeleteVideo }) => {
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [videoToDelete, setVideoToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Format duration from seconds to MM:SS
  const formatDuration = (seconds) => {
    if (!seconds) return '0:00'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Check if video is YouTube
  const isYouTubeVideo = (video) => {
    return video.videoType === 'youtube' || video.youtubeVideoId || 
           (video.url && (video.url.includes('youtube.com') || video.url.includes('youtu.be')))
  }

  // Get video thumbnail
  const getVideoThumbnail = (video) => {
    if (video.thumbnailUrl) {
      return video.thumbnailUrl
    }
    
    if (isYouTubeVideo(video) && video.youtubeVideoId) {
      return `https://img.youtube.com/vi/${video.youtubeVideoId}/maxresdefault.jpg`
    }
    
    return null
  }

  // Handle video view count increment
  const handleVideoView = async (videoId) => {
    try {
      const token = Cookies.get("usertoken")
      await axios.post(`https://aipbbackend.onrender.com/api/video-assets/videos/${videoId}/view`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
    } catch (error) {
      console.error("Error updating view count:", error)
      // Don't show error toast for view count as it's not critical
    }
  }

  // Handle delete confirmation
  const handleDeleteClick = (video) => {
    setVideoToDelete(video)
    setShowDeleteConfirm(true)
  }

  // Handle delete video
  const handleConfirmDelete = async () => {
    if (!videoToDelete) return

    setIsDeleting(true)
    try {
      await onDeleteVideo(videoToDelete._id)
      setShowDeleteConfirm(false)
      setVideoToDelete(null)
    } catch (error) {
      // Error is handled in parent component
    } finally {
      setIsDeleting(false)
    }
  }

  // Video player modal
  const VideoPlayerModal = ({ video, onClose }) => {
    if (!video) return null

    const isYT = isYouTubeVideo(video)

    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <h2 className="text-xl font-bold text-gray-800 mr-3">{video.title}</h2>
              {isYT ? (
                <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-700 rounded-md text-sm">
                  <Youtube size={14} className="mr-1" />
                  YouTube
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-sm">
                  <Upload size={14} className="mr-1" />
                  Uploaded
                </span>
              )}
            </div>
            <button 
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
          
          <div className="aspect-video mb-4">
            {isYT ? (
              <iframe
                src={video.embedUrl || `https://www.youtube.com/embed/${video.youtubeVideoId}`}
                title={video.title}
                className="w-full h-full rounded-lg"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onLoad={() => handleVideoView(video._id)}
              />
            ) : (
              <video 
                src={video.url} 
                controls 
                className="w-full h-full rounded-lg"
                onPlay={() => handleVideoView(video._id)}
              >
                Your browser does not support the video tag.
              </video>
            )}
          </div>
          
          {video.description && (
            <div className="mb-4">
              <h3 className="font-medium text-gray-800 mb-2">Description</h3>
              <p className="text-gray-700 text-sm">{video.description}</p>
            </div>
          )}
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
            {video.duration > 0 && (
              <div className="flex items-center">
                <Clock size={16} className="mr-1" />
                <span>{formatDuration(video.duration)}</span>
              </div>
            )}
            {video.fileSize > 0 && (
              <div className="flex items-center">
                <HardDrive size={16} className="mr-1" />
                <span>{formatFileSize(video.fileSize)}</span>
              </div>
            )}
            {video.viewCount > 0 && (
              <div className="flex items-center">
                <Eye size={16} className="mr-1" />
                <span>{video.viewCount} views</span>
              </div>
            )}
            <div className="flex items-center">
              <Calendar size={16} className="mr-1" />
              <span>{formatDate(video.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Delete confirmation modal
  const DeleteConfirmModal = () => {
    if (!showDeleteConfirm) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Delete Video</h2>
            <p className="text-gray-700">
              Are you sure you want to delete "{videoToDelete?.title}"? This action cannot be undone.
            </p>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowDeleteConfirm(false)
                setVideoToDelete(null)
              }}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="font-medium text-lg">Videos</h3>
          <p className="text-sm text-gray-600 mt-1">
            {videos.length} video{videos.length !== 1 ? 's' : ''} available
          </p>
        </div>
        <button
          onClick={() => setShowVideoModal(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          <Plus size={16} className="mr-2" />
          <span>Add Video</span>
        </button>
      </div>

      {videos.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Play size={32} className="text-gray-400" />
          </div>
          <p className="text-gray-600 mb-2">No videos available yet</p>
          <p className="text-sm text-gray-500">Add your first video to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => {
            const isYT = isYouTubeVideo(video)
            const thumbnailUrl = getVideoThumbnail(video)
            
            return (
              <div key={video._id} className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Video Thumbnail/Preview */}
                <div className="aspect-video bg-gradient-to-br from-indigo-100 to-purple-100 relative group">
                  {thumbnailUrl ? (
                    <img 
                      src={thumbnailUrl} 
                      alt={video.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'flex'
                      }}
                    />
                  ) : !isYT ? (
                    <video 
                      src={video.url} 
                      className="w-full h-full object-cover"
                      muted
                      preload="metadata"
                    />
                  ) : null}
                  
                  {/* Fallback display */}
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center" style={{ display: thumbnailUrl ? 'none' : 'flex' }}>
                    {isYT ? (
                      <Youtube size={48} className="text-red-500" />
                    ) : (
                      <Play size={48} className="text-indigo-500" />
                    )}
                  </div>
                  
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setSelectedVideo(video)
                        handleVideoView(video._id)
                      }}
                      className="bg-white bg-opacity-90 rounded-full p-3 hover:bg-opacity-100 transition-all"
                    >
                      <Play size={24} className="text-indigo-600 ml-1" />
                    </button>
                  </div>
                  
                  {/* Video type indicator */}
                  <div className="absolute top-2 left-2">
                    {isYT ? (
                      <span className="inline-flex items-center px-2 py-1 bg-red-600 text-white rounded text-xs">
                        <Youtube size={12} className="mr-1" />
                        YT
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 bg-blue-600 text-white rounded text-xs">
                        <Upload size={12} className="mr-1" />
                        UP
                      </span>
                    )}
                  </div>
                  
                  {/* Duration overlay */}
                  {video.duration > 0 && (
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                      {formatDuration(video.duration)}
                    </div>
                  )}
                </div>

                {/* Video Info */}
                <div className="p-4">
                  <h4 className="font-medium text-gray-800 mb-2 line-clamp-2 leading-tight">
                    {video.title}
                  </h4>
                  
                  {video.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {video.description}
                    </p>
                  )}

                  {/* Video Stats */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <div className="flex items-center space-x-3">
                      {video.viewCount > 0 && (
                        <span className="flex items-center">
                          <Eye size={12} className="mr-1" />
                          {video.viewCount}
                        </span>
                      )}
                      {!isYT && video.fileSize > 0 && (
                        <span className="flex items-center">
                          <HardDrive size={12} className="mr-1" />
                          {formatFileSize(video.fileSize)}
                        </span>
                      )}
                    </div>
                    <span>{formatDate(video.createdAt)}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => {
                        setSelectedVideo(video)
                        handleVideoView(video._id)
                      }}
                      className="flex items-center px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors text-sm font-medium"
                    >
                      <Play size={14} className="mr-1" />
                      Watch
                    </button>
                    
                    <button
                      onClick={() => handleDeleteClick(video)}
                      className="flex items-center px-3 py-1.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm"
                    >
                      <Trash2 size={14} className="mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Video Player Modal */}
      <VideoPlayerModal 
        video={selectedVideo} 
        onClose={() => setSelectedVideo(null)} 
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal />
    </div>
  )
}

export default VideosTab