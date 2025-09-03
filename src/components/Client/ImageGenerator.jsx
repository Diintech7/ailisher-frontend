import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'  
import Cookies from 'js-cookie';
import { Download, GalleryThumbnailsIcon, Plus, Trash2 } from 'lucide-react';

export default function ImageGenerator() {
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('realistic')
  const [aspectRatio, setAspectRatio] = useState('9:16')
  const [seed, setSeed] = useState('5')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [generatedImages, setGeneratedImages] = useState([]) // {id, url, prompt, style, aspectRatio, seed, createdAt}
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [modalPreviewUrl, setModalPreviewUrl] = useState('')
  
  // New state variables for enhanced functionality
  const [savedImages, setSavedImages] = useState([])
  const [loadingSavedImages, setLoadingSavedImages] = useState(false)
  const [showSavedImages, setShowSavedImages] = useState(false)
  
  // Text overlay states
  const [overlayText, setOverlayText] = useState('')
  const [overlayFontSize, setOverlayFontSize] = useState(52)
  const [overlayColor, setOverlayColor] = useState('#ffffff')
  const [overlayBgColor, setOverlayBgColor] = useState('#000000')
  const [overlayNoBackground, setOverlayNoBackground] = useState(false)
  const [isApplyingOverlay, setIsApplyingOverlay] = useState(false)
  const [currentImageKey, setCurrentImageKey] = useState('')
  const [lastOverlayBase64, setLastOverlayBase64] = useState('')

  // Three dots menu state
  const [openMenuId, setOpenMenuId] = useState(null)
  const toggleMenu = (id) => setOpenMenuId(prev => prev === id ? null : id)

  // Lightbox preview
  const [lightboxUrl, setLightboxUrl] = useState('')

  const axiosConfig = {
    baseURL: 'https://test.ailisher.com',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Cookies.get('usertoken')}`
    },  
  }

  // Load saved images on component mount
  useEffect(() => {
    fetchSavedImages();
  }, []);

  const handleGenerate = async () => {
    if (!prompt) {
      setError('Please enter a prompt')
      return
    }
    setError('')
    setLoading(true)
    try {
      const { data } = await axios.post('/api/image-generator/generate-image', {
        prompt,
        style,
        aspect_ratio: aspectRatio,
        seed
      }, axiosConfig)
      
      if (data?.success && data?.image) {
        const dataUrl = `data:image/png;base64,${data.image}`
        setModalPreviewUrl(dataUrl)
        setLastOverlayBase64('')
        const item = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          url: dataUrl,
          prompt,
          style,
          aspectRatio,
          seed,
          createdAt: new Date().toISOString(),
        }
        setGeneratedImages((prev) => [item, ...prev])
      } else {
        setError('Failed to generate image')
      }
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to generate image')
    } finally {
      setLoading(false)
    }
  }

  // Enhanced save function that saves to both R2 and database
  const handleSaveToR2 = async (imageData) => {
    try {
      setSaving(true)
      setSaveError('')

      const base64ToSave = lastOverlayBase64
        ? lastOverlayBase64
        : (imageData.url.includes(',') ? imageData.url.split(',')[1] : imageData.url)
      
      const { data } = await axios.post('/api/image-generator/save-image', {
        imageBase64: base64ToSave,
        prompt: imageData.prompt,
        style: imageData.style,
        aspectRatio: imageData.aspectRatio,
        seed: imageData.seed,
        tags: [], // optional tags
        isPublic: false, // optional public/private
        contentType: 'image/png'
      }, axiosConfig)
      
      if (data?.success) {
        toast.success('Image saved successfully!')
        // Add to saved images list
        setSavedImages(prev => [data.data, ...prev])
        // Store the image key for any subsequent operations
        setCurrentImageKey(data.data.key)
        // Clear overlay memory after successful save
        setLastOverlayBase64('')
        return data
      }
      setSaveError('Failed to save image')
    } catch (e) {
      setSaveError(e?.response?.data?.error || e.message || 'Failed to save image')
    } finally {
      setSaving(false)
    }
  }

  // Function to fetch user's saved images
  const fetchSavedImages = async () => {
    try {
      setLoadingSavedImages(true)
      const { data } = await axios.get('/api/image-generator/my-images', axiosConfig)
      if (data?.success) {
        setSavedImages(data.data.images)
      }
    } catch (e) {
      console.error('Failed to fetch saved images:', e)
    } finally {
      setLoadingSavedImages(false)
    }
  }

  // Function to delete saved image
  const handleDeleteSavedImage = async (imageId) => {
    try {
      const { data } = await axios.delete(`/api/image-generator/images/${imageId}`, axiosConfig)
      if (data?.success) {
        toast.success('Image deleted successfully!')
        setSavedImages(prev => prev.filter(img => img._id !== imageId))
      }
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Failed to delete image')
    }
  }

  const confirmAndDeleteSaved = async (imageId) => {
    if (window.confirm('Delete this image? This action cannot be undone.')) {
      await handleDeleteSavedImage(imageId)
      setOpenMenuId(null)
    }
  }

  // Function to apply text overlay (works on preview; server expects imageBase64)
  const applyTextOverlay = async () => {
    if (!modalPreviewUrl || !overlayText.trim()) {
      toast.error('Generate an image and enter overlay text')
      return
    }

    try {
      setIsApplyingOverlay(true)
      const base64 = modalPreviewUrl.includes(',') ? modalPreviewUrl.split(',')[1] : modalPreviewUrl
      const { data } = await axios.post('/api/image-generator/overlay-text', {
        imageBase64: base64,
        text: overlayText,
        fontsize: overlayFontSize,
        color: overlayColor,
        bgColor: overlayNoBackground ? '#000000' : overlayBgColor,
        bgOpacity: overlayNoBackground ? 0 : 0.8
      }, axiosConfig)

      if (data?.success && data?.image) {
        const overlaidDataUrl = `data:image/png;base64,${data.image}`
        setModalPreviewUrl(overlaidDataUrl)   // update preview
        setLastOverlayBase64(data.image)      // remember for saving
        toast.success('Overlay applied')
      } else {
        toast.error('Failed to apply text overlay')
      }
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Failed to apply text overlay')
    } finally {
      setIsApplyingOverlay(false)
    }
  }

  const handleDownload = (url) => {
    if (!url) return
    const link = document.createElement('a')
    link.href = url
    link.download = `generated-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  const handleCopyToClipboard = async (url) => {
    if (!url) return
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([new window.ClipboardItem({ [blob.type]: blob })])
      } else {
        window.open(url, '_blank')
      }
    } catch (e) {
      setError('Failed to copy image to clipboard')
    }
  }

  const renderCreateModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-7xl mx-4 max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Create Generated Image</h3>
          <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        {/* Preview on top with aspect ratio selector on the side */}
        <div className="w-full border rounded bg-gray-50 flex items-stretch justify-center mb-4 relative">
          {/* Preview media */}
          <div className="flex-1 flex items-center justify-center p-2">
            {modalPreviewUrl ? (
              <img
                src={modalPreviewUrl}
                alt="Preview"
                onClick={() => setLightboxUrl(modalPreviewUrl)}
                className="w-full max-h-[50vh] object-contain rounded cursor-zoom-in"
              />
            ) : (
              <div className="w-full h-[240px] flex flex-col items-center justify-center text-gray-400 text-sm gap-2">
                <GalleryThumbnailsIcon className="w-10 h-10" />
                <span>Preview will appear here after generation</span>
              </div>
            )}
          </div>

          {/* Aspect ratio panel */}
          <div className="w-32 border-l bg-white/80 backdrop-blur px-3 py-3 rounded-r flex-shrink-0">
            <p className="text-xs font-medium text-gray-700 mb-2">Aspect Ratio</p>
            <div className="space-y-2">
              {['1:1','16:9','9:16','4:3'].map(r => (
                <label key={r} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="aspectRatio"
                    value={r}
                    checked={aspectRatio === r}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    className="accent-purple-600"
                  />
                  <span className="text-xs text-gray-700">{r}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Prompt row: 3-row textarea with embedded Generate button */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Prompt</label>
          <div className="relative">
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full px-3 py-2 pr-28 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              placeholder="What will you imagine?"
            />
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt}
              className="absolute top-2 right-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating' : 'Generate'}
            </button>
          </div>
        </div>

        {/* Save button appears when we have a preview */}
        {modalPreviewUrl && (
          <div className="flex items-center justify-end mb-4">
            <button
              onClick={async () => {
                const imageData = { url: modalPreviewUrl, prompt, style, aspectRatio, seed }
                const res = await handleSaveToR2(imageData)
                if (res?.success) toast.success('Image saved successfully!')
              }}
              disabled={saving}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Image'}
            </button>
          </div>
        )}

        {/* Text Overlay Section */}
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 mb-4">
          <h4 className="text-lg font-semibold mb-3">Text Overlay Options</h4>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Overlay Text:</label>
              <input
                type="text"
                value={overlayText}
                onChange={(e) => setOverlayText(e.target.value)}
                placeholder="Title, subject, etc. (supports Hindi/English)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Font Size:</label>
                <input
                  type="number"
                  value={overlayFontSize}
                  min="10"
                  max="128"
                  onChange={(e) => setOverlayFontSize(parseInt(e.target.value || '52', 10))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text sm font-medium text-gray-700 mb-1">Text Color:</label>
                <input
                  type="color"
                  value={overlayColor}
                  onChange={(e) => setOverlayColor(e.target.value)}
                  className="w-full h-10 px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Background Color:</label>
                <input
                  type="color"
                  value={overlayBgColor}
                  onChange={(e) => { setOverlayBgColor(e.target.value); if (overlayNoBackground) setOverlayNoBackground(false); }}
                  disabled={overlayNoBackground}
                  className={`w-full h-10 px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${overlayNoBackground ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
              </div>
              <div className="flex items-center">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={overlayNoBackground}
                    onChange={(e) => setOverlayNoBackground(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">No background box (transparent)</span>
                </label>
              </div>
            </div>
            {overlayText.trim() && (
              <button
                type="button"
                onClick={applyTextOverlay}
                disabled={isApplyingOverlay}
                className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors duration-200 disabled:opacity-50"
              >
                {isApplyingOverlay ? 'Applying...' : 'Apply Text Overlay'}
              </button>
            )}
          </div>
        </div>

        {/* Inline tip */}
        <p className="text-xs text-gray-500">Generated images will appear in the preview above.</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="flex items-center space-x-4 p-4">
          <button
            onClick={() => navigate('/tools')}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Back to Tools
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Image Generator</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Create Image</span>
          </button>
        </div>

        {/* Saved Images Section */}
          <div className="mb-8">
            {loadingSavedImages ? (
              <div className="text-center py-8">Loading saved images...</div>
            ) : savedImages.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedImages.map((image) => (
                  <div key={image._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="relative">
                      <img 
                        src={image.generatedImageUrl} 
                        alt={image.prompt}
                        onClick={() => setLightboxUrl(image.generatedImageUrl)}
                        className="w-full h-64 object-cover cursor-zoom-in"
                      />
                      <button
                        onClick={() => toggleMenu(image._id)}
                        className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-2 shadow"
                        aria-label="More options"
                      >
                        ⋯
                      </button>
                      {openMenuId === image._id && (
                        <div className="absolute right-2 top-10 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                          <button
                            onClick={() => { handleDownload(image.generatedImageUrl); setOpenMenuId(null) }}
                            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download</span>
                          </button>
                          <button
                            onClick={() => { if (window.confirm('Delete this image?')) { handleDeleteSavedImage(image._id) } setOpenMenuId(null) }}
                            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="font-semibold text-sm mb-1 truncate" title={image.prompt}>{image.prompt}</p>
                      <p className="text-xs text-gray-500 mb-3">{image.style} • {image.aspectRatio} • seed {image.seed}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-white rounded-lg border">
                <p className="text-gray-500">No saved images yet. Generate and save some images!</p>
              </div>
            )}
          </div>

        {/* Generated Images Section */}
        <div>
          <h3 className="text-xl font-bold mb-4">Recently Generated Images</h3>
          {generatedImages.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg border">
              <p className="text-gray-600">No images yet. Click "Create Image" to generate one.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {generatedImages.map((img) => (
                <div key={img.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="relative">
                    <img src={img.url} alt={img.prompt} onClick={() => setLightboxUrl(img.url)} className="w-full h-64 object-cover cursor-zoom-in" />
                    <button
                      onClick={() => toggleMenu(img.id)}
                      className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-2 shadow"
                      aria-label="More options"
                    >
                      ⋯
                    </button>
                    {openMenuId === img.id && (
                      <div className="absolute right-2 top-10 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                        <button
                          onClick={() => { handleDownload(img.url); setOpenMenuId(null) }}
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download</span>
                        </button>
                        <button
                          onClick={() => { setGeneratedImages(prev => prev.filter(i => i.id !== img.id)); setOpenMenuId(null) }}
                          className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-semibold text-sm mb-1 truncate" title={img.prompt}>{img.prompt}</p>
                    <p className="text-xs text-gray-500 mb-3">{img.style} • {img.aspectRatio} • seed {img.seed}</p>
                    <div className="mt-2">
                      <button
                        onClick={async () => {
                          const imageData = {
                            url: img.url,
                            prompt: img.prompt,
                            style: img.style,
                            aspectRatio: img.aspectRatio,
                            seed: img.seed
                          }
                          const res = await handleSaveToR2(imageData)
                          if (res?.success) {
                            toast.success('Image saved successfully!')
                          }
                        }}
                        disabled={saving}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-sm disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save to Database'}
                      </button>
                      {saveError && <p className="text-xs text-red-600 mt-1">{saveError}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreateModal && renderCreateModal()}

      {/* Lightbox Modal */}
      {lightboxUrl && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setLightboxUrl('')}>
          <img src={lightboxUrl} alt="Full preview" className="max-w-[90vw] max-h-[90vh] object-contain" />
        </div>
      )}
    </div>
  )
}
