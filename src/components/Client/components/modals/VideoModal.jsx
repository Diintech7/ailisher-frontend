"use client"

import { useState, useEffect } from "react"
import { X, Upload, Link } from "lucide-react"
import axios from "axios"
import Cookies from "js-cookie"
import { toast } from "react-toastify"

const VideoModal = ({
  showVideoModal,
  setShowVideoModal,
  videoData,
  setVideoData,
  videos,
  setVideos,
  itemType,
  itemId,
  isWorkbook,
  bookId,
  workbookId,
  chapterId,
  topicId,
  subtopicId,
}) => {
  const [localVideoData, setLocalVideoData] = useState({
    title: "",
    file: null,
    youtubeUrl: "",
    description: "",
  })
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [videoType, setVideoType] = useState("file") // "file" or "youtube"

  // Initialize local state when modal opens
  useEffect(() => {
    if (showVideoModal) {
      setLocalVideoData({
        title: videoData.title || "",
        file: null,
        youtubeUrl: videoData.youtubeUrl || "",
        description: videoData.description || "",
      })
      setUploadProgress(0)
      setIsUploading(false)
      setVideoType("file")
    }
  }, [showVideoModal, videoData])

  const handleFileChange = (e) => {
    setLocalVideoData({
      ...localVideoData,
      file: e.target.files[0],
    })
  }

  // Extract YouTube video ID from URL
  const extractYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }

  // Get YouTube video info using oEmbed API (no API key required)
  const getYouTubeVideoInfo = async (url) => {
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
      const response = await fetch(oembedUrl)
      
      if (!response.ok) {
        throw new Error('Invalid YouTube URL')
      }
      
      const data = await response.json()
      const videoId = extractYouTubeId(url)
      
      return {
        title: data.title,
        thumbnailUrl: data.thumbnail_url,
        duration: 0, // YouTube oEmbed doesn't provide duration
        videoId: videoId,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        originalUrl: url
      }
    } catch (error) {
      throw new Error('Failed to fetch YouTube video information')
    }
  }

  const uploadToCloudinary = async () => {
    if (!localVideoData.file) {
      toast.error("Please select a video file")
      return null
    }

    const formData = new FormData()
    formData.append("file", localVideoData.file)
    formData.append("upload_preset", "post_blog") // Replace with your upload preset
    formData.append("resource_type", "video")

    try {
      setIsUploading(true)
      setUploadProgress(0)

      const response = await axios.post(
        "https://api.cloudinary.com/v1_1/dsbuzlxpw/video/upload", // Replace with your cloud name
        formData,
        {
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setUploadProgress(progress)
          },
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      )

      return {
        url: response.data.secure_url,
        publicId: response.data.public_id,
        duration: response.data.duration || 0,
        fileSize: response.data.bytes || 0,
        format: response.data.format || '',
        thumbnailUrl: response.data.secure_url.replace(/\.[^/.]+$/, ".jpg")
      }
    } catch (error) {
      console.error("Error uploading to Cloudinary:", error)
      toast.error("Failed to upload video")
      return null
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!localVideoData.title.trim()) {
      toast.error("Title is required")
      return
    }

    let videoInfo = null

    if (videoType === "file") {
      // Upload file to Cloudinary
      videoInfo = await uploadToCloudinary()
      if (!videoInfo) return
    } else if (videoType === "youtube") {
      // Process YouTube URL
      if (!localVideoData.youtubeUrl.trim()) {
        toast.error("YouTube URL is required")
        return
      }

      try {
        setIsUploading(true)
        videoInfo = await getYouTubeVideoInfo(localVideoData.youtubeUrl)
        
        // If title is empty, use YouTube video title
        if (!localVideoData.title.trim()) {
          setLocalVideoData(prev => ({ ...prev, title: videoInfo.title }))
        }
      } catch (error) {
        toast.error(error.message || "Invalid YouTube URL")
        setIsUploading(false)
        return
      }
    }

    try {
      const token = Cookies.get("usertoken")
      
      // Use the new video assets endpoint
      const endpoint = `https://aipbbackend-yxnh.onrender.com/api/video-assets/${itemType}/${itemId}/videos?isWorkbook=${isWorkbook}`

      const requestData = {
        title: localVideoData.title,
        description: localVideoData.description,
        videoType: videoType,
      }

      if (videoType === "file") {
        requestData.url = videoInfo.url
        requestData.duration = videoInfo.duration
        requestData.fileSize = videoInfo.fileSize
        requestData.format = videoInfo.format
        requestData.thumbnailUrl = videoInfo.thumbnailUrl
        requestData.cloudinaryPublicId = videoInfo.publicId
      } else if (videoType === "youtube") {
        requestData.url = videoInfo.originalUrl
        requestData.youtubeVideoId = videoInfo.videoId
        requestData.embedUrl = videoInfo.embedUrl
        requestData.thumbnailUrl = videoInfo.thumbnailUrl
        requestData.duration = videoInfo.duration
      }

      const response = await axios.post(endpoint, requestData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // Add to local state - handle both possible response structures
      const newVideo = response.data.video || {
        _id: response.data._id,
        title: localVideoData.title,
        url: videoType === "file" ? videoInfo.url : videoInfo.originalUrl,
        description: localVideoData.description,
        duration: videoInfo.duration,
        fileSize: videoInfo.fileSize || 0,
        format: videoInfo.format || '',
        videoType: videoType,
        youtubeVideoId: videoInfo.videoId || null,
        embedUrl: videoInfo.embedUrl || null,
        thumbnailUrl: videoInfo.thumbnailUrl || null,
        createdAt: new Date().toISOString(),
      }

      setVideos([...videos, newVideo])
      setVideoData({
        title: "",
        url: "",
        description: "",
      })
      setShowVideoModal(false)
      toast.success("Video added successfully")
    } catch (error) {
      console.error("Error saving video:", error)
      toast.error(error.response?.data?.message || "Failed to save video details")
    } finally {
      setIsUploading(false)
    }
  }

  if (!showVideoModal) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Add Video</h2>
          <button onClick={() => setShowVideoModal(false)} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Video Type Selection */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">Video Source</label>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setVideoType("file")}
                className={`flex items-center px-4 py-2 rounded-md border ${
                  videoType === "file"
                    ? "bg-indigo-100 border-indigo-300 text-indigo-700"
                    : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Upload size={16} className="mr-2" />
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setVideoType("youtube")}
                className={`flex items-center px-4 py-2 rounded-md border ${
                  videoType === "youtube"
                    ? "bg-red-100 border-red-300 text-red-700"
                    : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Link size={16} className="mr-2" />
                YouTube URL
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">Video Title</label>
            <input
              type="text"
              value={localVideoData.title}
              onChange={(e) => setLocalVideoData({ ...localVideoData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter video title..."
              required
            />
          </div>

          {videoType === "file" ? (
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">Video File</label>
              <input
                type="file"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                accept="video/*"
                required
              />
              {localVideoData.file && (
                <p className="text-xs text-gray-500 mt-1">
                  Selected: {localVideoData.file.name} ({(localVideoData.file.size / (1024 * 1024)).toFixed(2)} MB)
                </p>
              )}
              {isUploading && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Uploading: {uploadProgress}%</p>
                </div>
              )}
            </div>
          ) : (
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">YouTube URL</label>
              <input
                type="url"
                value={localVideoData.youtubeUrl}
                onChange={(e) => setLocalVideoData({ ...localVideoData, youtubeUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="https://www.youtube.com/watch?v=..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Paste a YouTube video URL (supports youtube.com and youtu.be links)
              </p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">Description (Optional)</label>
            <textarea
              value={localVideoData.description}
              onChange={(e) => setLocalVideoData({ ...localVideoData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 h-20 resize-none"
              placeholder="Enter a brief description..."
              maxLength={1000}
            />
            <p className="text-xs text-gray-400 mt-1">
              {localVideoData.description.length}/1000 characters
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowVideoModal(false)}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50"
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isUploading}
            >
              {isUploading ? 
                (videoType === "file" ? `Uploading... ${uploadProgress}%` : "Processing...") : 
                "Add Video"
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default VideoModal