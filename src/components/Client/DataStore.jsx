"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  Upload,
  FileText,
  ArrowLeft,
  Trash2,
  AlertTriangle,
  ImageIcon,
  Video,
  Link,
  FileType,
  Globe,
  Youtube,
  MessageCircle,
  Database,
  Loader2,
  CheckCircle,
  XCircle,
  Send,
  X,
  RefreshCw,
  Grid3X3,
  List,
  Calendar,
  ExternalLink,
  Clock,
  RotateCcw,
  HardDrive,
  FileIcon,
  Zap,
  RulerIcon,
} from "lucide-react"
import Cookies from "js-cookie"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import AIGuidelinesModal from './AIGuidelinesModal';


const DataStore = ({ type }) => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [activeFilter, setActiveFilter] = useState("all")
  const [filteredItems, setFilteredItems] = useState([])
  const [viewMode, setViewMode] = useState("list") // Default to list view
  const [embeddingDetails, setEmbeddingDetails] = useState({})

  const [embeddingStatus, setEmbeddingStatus] = useState({})
  const [embeddingLoading, setEmbeddingLoading] = useState({})
  const [reEmbeddingLoading, setReEmbeddingLoading] = useState({})
  const [showChatModal, setShowChatModal] = useState(false)
  const [currentChatItem, setCurrentChatItem] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [chatHealth, setChatHealth] = useState({})
  const [uploadType, setUploadType] = useState("file")
  const [activeTab, setActiveTab] = useState('datastore');

  // --- AI Guidelines State ---
  const [aiGuidelines, setAIGuidelines] = useState(null)
  const [aiGuidelinesLoading, setAIGuidelinesLoading] = useState(false)
  const [showAIGuidelinesModal, setShowAIGuidelinesModal] = useState(false)
  const [aiGuidelinesForm, setAIGuidelinesForm] = useState({ message: '', prompt: '', FAQs: [{ question: '' }] })
  const [aiGuidelinesSaving, setAIGuidelinesSaving] = useState(false)

  const titleRef = useRef(null)
  const descriptionRef = useRef(null)
  const urlRef = useRef(null)
  const fileInputRef = useRef(null)
  const [selectedFiles, setSelectedFiles] = useState([])
  const chatEndRef = useRef(null)
  const chatInputRef = useRef(null)

  const { bookId, chapterId, topicId, subtopicId } = useParams()
  const navigate = useNavigate()

  const filters = [
    { id: "all", label: "All", icon: FileType },
    { id: "image", label: "Images", icon: ImageIcon },
    { id: "video", label: "Videos", icon: Video },
    { id: "pdf", label: "PDFs", icon: FileText },
    { id: "url", label: "URLs", icon: Link },
    { id: "website", label: "Websites", icon: Globe },
    { id: "youtube", label: "YouTube", icon: Youtube },
    { id: "text", label: "Text", icon: FileText },
    { id: "aiGuidelines", label: "AI Guidelines", icon: RulerIcon },

  ]

  const getApiEndpoint = () => {
    if (type === "book" && bookId) {
      return `https://test.ailisher.com/api/datastores/book/${bookId}`
    } else if (type === "chapter" && bookId && chapterId) {
      return `https://test.ailisher.com/api/datastores/chapter/${chapterId}`
    } else if (type === "topic" && bookId && chapterId && topicId) {
      return `https://test.ailisher.com/api/datastores/topic/${topicId}`
    } else if (type === "subtopic" && bookId && chapterId && topicId && subtopicId) {
      return `https://test.ailisher.com/api/datastores/subtopic/${subtopicId}`
    }
    return null
  }

  const updateEmbeddingStatusInDB = async (itemId, isEmbedded, embeddingCount = 0) => {
    try {
      const token = Cookies.get("usertoken")
      if (!token) return

      const response = await fetch(`https://test.ailisher.com/api/datastores/update-embedding-status/${itemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          isEmbedded,
          embeddingCount,
          embeddedAt: isEmbedded ? new Date().toISOString() : null,
        }),
      })

      const data = await response.json()
      if (!data.success) {
        console.error("Failed to update embedding status in DB:", data.message)
      }
    } catch (error) {
      console.error("Error updating embedding status in DB:", error)
    }
  }

  const fetchItems = async () => {
    setLoading(true)
    const endpoint = getApiEndpoint()

    if (!endpoint) {
      setError("Invalid parameters")
      setLoading(false)
      return
    }

    try {
      const token = Cookies.get("usertoken")
      if (!token) {
        setError("Authentication required")
        navigate("/login")
        return
      }

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (data.success) {
        const sortedItems = (data.items || []).sort((a, b) => {
          const dateA = new Date(a.createdAt || a.uploadedAt || 0)
          const dateB = new Date(b.createdAt || b.uploadedAt || 0)
          return dateA - dateB
        })

        setItems(sortedItems)
        setFilteredItems(sortedItems)

        const initialEmbeddingStatus = {}
        const initialChatHealth = {}

        sortedItems.forEach((item) => {
          if (item.fileType === "application/pdf" || item.type === "pdf") {
            initialEmbeddingStatus[item._id] = {
              hasEmbeddings: item.isEmbedded || false,
              embeddingCount: item.embeddingCount || 0,
            }
            initialChatHealth[item._id] = {
              chatAvailable: item.isEmbedded || false,
            }
          }
        })

        setEmbeddingStatus(initialEmbeddingStatus)
        setChatHealth(initialChatHealth)

        const embeddedPdfItems = sortedItems.filter(
          (item) => (item.fileType === "application/pdf" || item.type === "pdf") && item.isEmbedded,
        )
        if (embeddedPdfItems.length > 0) {
          checkEmbeddingStatusForItems(embeddedPdfItems)
        }
      } else {
        setError(data.message || "Failed to fetch items")
      }
    } catch (error) {
      console.error("Error fetching items:", error)
      setError("Failed to connect to the server")
    } finally {
      setLoading(false)
    }
  }

  const checkEmbeddingStatusForItems = async (pdfItems) => {
    const token = Cookies.get("usertoken")

    const statusPromises = pdfItems.map(async (item) => {
      try {
        const response = await fetch(`https://test.ailisher.com/api/enhanced-pdf-embedding/check-embeddings/${item._id}`, {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        })
        const data = await response.json()

        let healthData = { success: false, status: { chatAvailable: false } }
        try {
          const healthResponse = await fetch(`https://test.ailisher.com/api/enhanced-pdf-chat/chat-health/${item._id}`, {
            headers: {
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          })
          healthData = await healthResponse.json()
        } catch (healthError) {
          // Use embedding status as fallback
        }

        return {
          itemId: item._id,
          hasEmbeddings: data.hasEmbeddings,
          embeddingCount: data.embeddingCount,
          chatAvailable: healthData.success ? healthData.status.chatAvailable : data.hasEmbeddings,
        }
      } catch (error) {
        return {
          itemId: item._id,
          hasEmbeddings: false,
          embeddingCount: 0,
          chatAvailable: false,
        }
      }
    })

    const results = await Promise.all(statusPromises)
    const statusMap = {}
    const healthMap = {}

    results.forEach((result) => {
      statusMap[result.itemId] = {
        hasEmbeddings: result.hasEmbeddings,
        embeddingCount: result.embeddingCount,
      }
      healthMap[result.itemId] = {
        chatAvailable: result.chatAvailable,
      }
    })

    setEmbeddingStatus(statusMap)
    setChatHealth(healthMap)
  }

  const refreshEmbeddingStatus = async (itemId) => {
    const token = Cookies.get("usertoken")

    try {
      const response = await fetch(`https://test.ailisher.com/api/enhanced-pdf-embedding/check-embeddings/${itemId}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })
      const data = await response.json()

      let healthData = { success: false, status: { chatAvailable: false } }
      try {
        const healthResponse = await fetch(`https://test.ailisher.com/api/enhanced-pdf-chat/chat-health/${itemId}`, {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        })
        healthData = await healthResponse.json()
      } catch (healthError) {
        // Use embedding status as fallback
      }

      setEmbeddingStatus((prev) => ({
        ...prev,
        [itemId]: {
          hasEmbeddings: data.hasEmbeddings,
          embeddingCount: data.embeddingCount,
        },
      }))

      setChatHealth((prev) => ({
        ...prev,
        [itemId]: {
          chatAvailable: healthData.success ? healthData.status.chatAvailable : data.hasEmbeddings,
        },
      }))

      return data.hasEmbeddings
    } catch (error) {
      return false
    }
  }

  const fetchAIGuidelines = async () => {
    if (type !== 'book' || !bookId) return
    setAIGuidelinesLoading(true)
    try {
      const token = Cookies.get('usertoken')
      const response = await fetch(`https://test.ailisher.com/api/aiguidelines/${bookId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (response.ok) {
        const data = await response.json()
        setAIGuidelines(data)
      } else {
        setAIGuidelines(null)
      }
    } catch (err) {
      setAIGuidelines(null)
    } finally {
      setAIGuidelinesLoading(false)
    }
  }

  const saveAIGuidelines = async () => {
    if (type !== 'book' || !bookId) return
    setAIGuidelinesSaving(true)
    try {
      const token = Cookies.get('usertoken')
      console.log(aiGuidelinesForm)
      const response = await fetch(`https://test.ailisher.com/api/aiguidelines/${bookId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: aiGuidelinesForm.message,
          prompt: aiGuidelinesForm.prompt,
          FAQs: aiGuidelinesForm.FAQs
            .filter(faq => faq.question.trim())
            .map(faq => ({ question: faq.question })), // <-- Only send question
        }),
      })
      if (response.ok) {
        const data = await response.json()
        setAIGuidelines(data) // Update the guidelines directly with response data
        setShowAIGuidelinesModal(false)
        toast.success('AI Guidelines saved!')
        // DO NOT call fetchAIGuidelines() here - this was causing the re-render issue
      } else {
        toast.error('Failed to save AI Guidelines')
      }
    } catch (err) {
      toast.error('Error saving AI Guidelines')
    } finally {
      setAIGuidelinesSaving(false)
    }
  }

useEffect(() => {
  if (type === 'book' && bookId) {
    fetchAIGuidelines()
  }
}, [bookId, type]) // Only depend on bookId and type

  useEffect(() => {
    fetchItems()
  }, [bookId, chapterId, topicId, subtopicId])

  useEffect(() => {
    if (activeFilter === "all") {
      setFilteredItems(items)
      return
    }

    let filtered
    switch (activeFilter) {
      case "image":
        filtered = items.filter((item) => item.fileType?.startsWith("image/"))
        break
      case "video":
        filtered = items.filter((item) => item.fileType?.startsWith("video/"))
        break
      case "pdf":
        filtered = items.filter((item) => item.fileType === "application/pdf" || item.type === "pdf")
        break
      case "url":
        filtered = items.filter((item) => item.itemType === "url")
        break
      case "website":
        filtered = items.filter((item) => item.itemType === "website")
        break
      case "youtube":
        filtered = items.filter((item) => item.itemType === "youtube")
        break
      case "text":
        filtered = items.filter((item) => item.itemType === "text")
        break
      default:
        filtered = items
    }

    setFilteredItems(filtered)
  }, [activeFilter, items])

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [chatMessages])

  useEffect(() => {
    if (showChatModal && chatInputRef.current) {
      setTimeout(() => {
        chatInputRef.current.focus()
      }, 100)
    }
  }, [showChatModal])

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    setSelectedFiles(files)

    if (files.length > 0 && titleRef.current && !titleRef.current.value) {
      titleRef.current.value = files[0].name
    }
  }

  const resetForm = () => {
    if (titleRef.current) titleRef.current.value = ""
    if (descriptionRef.current) descriptionRef.current.value = ""
    if (urlRef.current) urlRef.current.value = ""
    setSelectedFiles([])
    setUploadType("file")
    setShowUploadModal(false)

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const title = titleRef.current?.value || ""
    const description = descriptionRef.current?.value || ""
    const url = urlRef.current?.value || ""

    if (uploadType === "file" && selectedFiles.length === 0) {
      toast.error("Please select at least one file")
      return
    }

    if (uploadType !== "file" && !url) {
      toast.error("URL is required")
      return
    }

    if (!title) {
      toast.error("Title is required")
      return
    }

    setUploading(true)

    try {
      const token = Cookies.get("usertoken")
      if (!token) {
        toast.error("Authentication required")
        return
      }

      const endpoint = getApiEndpoint()

      if (!endpoint) {
        toast.error("Invalid parameters")
        return
      }

      let uploadedItems = []

      if (uploadType === "file") {
        const uploadPromises = selectedFiles.map(async (file) => {
          const formData = new FormData()
          formData.append("file", file)
          formData.append("upload_preset", "post_blog")

          const cloudinaryResponse = await fetch(`https://api.cloudinary.com/v1_1/dsbuzlxpw/upload`, {
            method: "POST",
            body: formData,
          })

          const cloudinaryData = await cloudinaryResponse.json()
          return {
            name: title || file.name,
            description: description,
            url: cloudinaryData.secure_url,
            fileType: file.type,
            itemType: getItemTypeFromFile(file),
          }
        })

        uploadedItems = await Promise.all(uploadPromises)
      } else {
        uploadedItems = [
          {
            name: title,
            description: description,
            url: url,
            fileType: "url/link",
            itemType: uploadType,
          },
        ]
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: uploadedItems,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Item(s) added successfully!")
        fetchItems()
        resetForm()
      } else {
        toast.error(data.message || "Failed to save items")
      }
    } catch (error) {
      console.error("Error uploading items:", error)
      toast.error("An error occurred while uploading")
    } finally {
      setUploading(false)
    }
  }

  const getItemTypeFromFile = (file) => {
    const fileType = file.type
    if (fileType.startsWith("image/")) return "image"
    if (fileType.startsWith("video/")) return "video"
    if (fileType === "application/pdf") return "pdf"
    return "file"
  }

  const getItemIcon = (item) => {
    if (item.fileType?.startsWith("image/")) {
      return <ImageIcon size={32} className="text-blue-500" />
    }
    if (item.fileType?.startsWith("video/")) {
      return <Video size={32} className="text-purple-500" />
    }
    if (item.fileType === "application/pdf" || item.type === "pdf") {
      return <FileText size={32} className="text-red-500" />
    }
    if (item.itemType === "url") {
      return <Link size={32} className="text-green-500" />
    }
    if (item.itemType === "website") {
      return <Globe size={32} className="text-indigo-500" />
    }
    if (item.itemType === "youtube") {
      return <Youtube size={32} className="text-red-600" />
    }
    if (item.itemType === "text") {
      return <FileText size={32} className="text-gray-600" />
    }
    return <FileText size={32} className="text-gray-400" />
  }

  const getSmallItemIcon = (item) => {
    if (item.fileType?.startsWith("image/")) {
      return <ImageIcon size={20} className="text-blue-500" />
    }
    if (item.fileType?.startsWith("video/")) {
      return <Video size={20} className="text-purple-500" />
    }
    if (item.fileType === "application/pdf" || item.type === "pdf") {
      return <FileText size={20} className="text-red-500" />
    }
    if (item.itemType === "url") {
      return <Link size={20} className="text-green-500" />
    }
    if (item.itemType === "website") {
      return <Globe size={20} className="text-indigo-500" />
    }
    if (item.itemType === "youtube") {
      return <Youtube size={20} className="text-red-600" />
    }
    if (item.itemType === "text") {
      return <FileText size={20} className="text-gray-600" />
    }
    return <FileText size={20} className="text-gray-400" />
  }

  const handleCreateEmbeddings = async (itemId, forceReEmbed = false) => {
    const token = Cookies.get("usertoken")
    if (!token) {
      toast.error("Authentication required")
      return
    }

    if (forceReEmbed) {
      setReEmbeddingLoading((prev) => ({ ...prev, [itemId]: true }))
    } else {
      setEmbeddingLoading((prev) => ({ ...prev, [itemId]: true }))
    }

    try {
      const response = await fetch(`https://test.ailisher.com/api/enhanced-pdf-embedding/create-embeddings/${itemId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          forceReEmbed: forceReEmbed,
        }),
      })

      const data = await response.json()

      if (data.success) {
        const message = forceReEmbed
          ? "Embeddings re-created successfully!"
          : data.alreadyExists
            ? "Embeddings already exist"
            : "Embeddings created successfully!"

        toast.success(message)

        const embeddingCount = data.result?.embeddingCount || data.embeddingCount || 0
        const resultData = data.result || {}

        setEmbeddingStatus((prev) => ({
          ...prev,
          [itemId]: {
            hasEmbeddings: true,
            embeddingCount: embeddingCount,
          },
        }))

        setEmbeddingDetails((prev) => ({
          ...prev,
          [itemId]: {
            timing: resultData.timing || {},
            embeddingCount: embeddingCount,
            modelUsed: resultData.modelUsed || "N/A",
            tokensUsed: resultData.tokensUsed || 0,
            vectorSize: resultData.vectorSize || "N/A",
            fileSizeMB: resultData.fileSizeMB || "N/A",
            totalPages: resultData.totalPages || 0,
            collectionName: resultData.collectionName || "N/A",
          },
        }))

        setChatHealth((prev) => ({
          ...prev,
          [itemId]: {
            chatAvailable: true,
          },
        }))

        await updateEmbeddingStatusInDB(itemId, true, embeddingCount)

        setItems((prevItems) =>
          prevItems.map((item) =>
            item._id === itemId ? { ...item, isEmbedded: true, embeddingCount: embeddingCount } : item,
          ),
        )

        setTimeout(() => refreshEmbeddingStatus(itemId), 1000)
      } else {
        toast.error(data.message || "Failed to create embeddings")
      }
    } catch (error) {
      console.error("Error creating embeddings:", error)
      toast.error("An error occurred while creating embeddings")
    } finally {
      if (forceReEmbed) {
        setReEmbeddingLoading((prev) => ({ ...prev, [itemId]: false }))
      } else {
        setEmbeddingLoading((prev) => ({ ...prev, [itemId]: false }))
      }
    }
  }

  const handleChatWithPDF = async (item) => {
    const status = embeddingStatus[item._id]
    const health = chatHealth[item._id]

    if (!status?.hasEmbeddings && !health?.chatAvailable) {
      const hasEmbeddings = await refreshEmbeddingStatus(item._id)
      if (!hasEmbeddings) {
        toast.error("Please create embeddings first before chatting")
        return
      }
    }

    setCurrentChatItem(item)
    setChatMessages([])
    setShowChatModal(true)
    setChatInput("")

    const welcomeMessage = {
      id: Date.now(),
      type: "ai",
      content: `Ready to answer questions about "${item.name}". Ask me anything!`,
      confidence: 100,
      sources: 1,
      timestamp: new Date(),
    }
    setChatMessages([welcomeMessage])
  }

  const handleSendClick = async () => {
    if (!chatInput.trim() || !currentChatItem || chatLoading) return

    const token = Cookies.get("usertoken")

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: chatInput.trim(),
      timestamp: new Date(),
    }

    setChatMessages((prev) => [...prev, userMessage])
    const messageToSend = chatInput.trim()
    setChatInput("")
    setChatLoading(true)

    const chatStartTime = Date.now()

    try {
      let response
      if (currentChatItem._id === "knowledge-base") {
        response = await fetch(`https://test.ailisher.com/api/enhanced-pdf-chat/chat-book-knowledge-base/${bookId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({
            question: messageToSend,
          }),
        })
      } else {
        response = await fetch(`https://test.ailisher.com/api/enhanced-pdf-chat/chat/${currentChatItem._id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({
            question: messageToSend,
          }),
        })
      }

      const data = await response.json()
      const chatEndTime = Date.now()
      const totalChatTime = chatEndTime - chatStartTime

      if (data.success) {
        const aiMessage = {
          id: Date.now() + 1,
          type: "ai",
          content: data.answer,
          confidence: data.confidence,
          sources: data.sources,
          method: data.method,
          timing: data.timing,
          totalChatTime: totalChatTime,
          modelUsed: data.modelUsed,
          tokensUsed: data.tokensUsed,
          timestamp: new Date(),
        }

        setChatMessages((prev) => [...prev, aiMessage])
      } else {
        if (data.needsEmbedding) {
          const errorMessage = {
            id: Date.now() + 1,
            type: "error",
            content: "Embeddings not found. Please create embeddings first.",
            timestamp: new Date(),
          }
          setChatMessages((prev) => [...prev, errorMessage])
        } else {
          const errorMessage = {
            id: Date.now() + 1,
            type: "error",
            content: data.message || "Failed to get response",
            timestamp: new Date(),
          }
          setChatMessages((prev) => [...prev, errorMessage])
        }
      }
    } catch (error) {
      console.error("Error sending chat message:", error)
      const errorMessage = {
        id: Date.now() + 1,
        type: "error",
        content: "An error occurred while sending your message. Please try again.",
        timestamp: new Date(),
      }

      setChatMessages((prev) => [...prev, errorMessage])
    } finally {
      setChatLoading(false)
      if (chatInputRef.current) {
        chatInputRef.current.focus()
      }
    }
  }

  const handleChatKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendClick()
    }
  }

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return

    try {
      const token = Cookies.get("usertoken")
      if (!token) {
        toast.error("Authentication required")
        return
      }

      const endpoint = `${getApiEndpoint()}/${itemId}`

      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Item deleted successfully!")
        setItems(items.filter((item) => item._id !== itemId))
      } else {
        toast.error(data.message || "Failed to delete item")
      }
    } catch (error) {
      console.error("Error deleting item:", error)
      toast.error("An error occurred while deleting the item")
    }
  }

  const handleBackClick = () => {
    if (type === "book") {
      navigate(`/ai-books/${bookId}`)
    } else if (type === "chapter") {
      navigate(`/ai-books/${bookId}/chapters/${chapterId}`)
    } else if (type === "topic") {
      navigate(`/ai-books/${bookId}/chapters/${chapterId}/topics/${topicId}`)
    } else if (type === "subtopic") {
      navigate(`/ai-books/${bookId}/chapters/${chapterId}/topics/${topicId}/subtopics/${subtopicId}`)
    } else {
      navigate("/ai-books")
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const ChatModal = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl h-3/4 flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <div className="flex items-center">
            <FileText className="text-red-500 mr-2" size={20} />
            <h2 className="text-lg font-semibold text-gray-800">Chat with {currentChatItem?.name || "PDF"}</h2>
            {currentChatItem?._id !== "knowledge-base" && (
              <button
                onClick={() => refreshEmbeddingStatus(currentChatItem._id)}
                className="ml-2 text-gray-500 hover:text-gray-700"
                title="Refresh chat status"
              >
                <RefreshCw size={16} />
              </button>
            )}
          </div>
          <button onClick={() => setShowChatModal(false)} className="text-gray-500 hover:text-gray-800">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatMessages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <MessageCircle size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Start a conversation!</p>
              <p className="text-sm">Ask questions and get ultra-fast, concise answers.</p>
            </div>
          ) : (
            chatMessages.map((message) => (
              <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-3xl p-3 rounded-lg ${
                    message.type === "user"
                      ? "bg-indigo-600 text-white"
                      : message.type === "error"
                        ? "bg-red-100 text-red-800 border border-red-200"
                        : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  {message.confidence && (
                    <div className="text-xs mt-2 opacity-75 space-y-1">
                      <div className="flex items-center space-x-2">
                        <span>Confidence: {message.confidence}%</span>
                        <span>•</span>
                        <span>Sources: {message.sources}</span>
                        {message.modelUsed && (
                          <>
                            <span>•</span>
                            <span>Model: {message.modelUsed}</span>
                          </>
                        )}
                      </div>
                      {message.timing && (
                        <div className="flex items-center space-x-2">
                          <Clock size={12} className="mr-1" />
                          <span>Total: {message.timing.totalResponse}</span>
                          <span>•</span>
                          <span>AI: {message.timing.generation}</span>
                          <span>•</span>
                          <span>Retrieval: {message.timing.retrieval}</span>
                          {message.tokensUsed && (
                            <>
                              <span>•</span>
                              <span>Tokens: {message.tokensUsed}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="text-xs mt-1 opacity-75">{message.timestamp.toLocaleTimeString()}</div>
                </div>
              </div>
            ))
          )}
          {chatLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-800 p-3 rounded-lg flex items-center">
                <Zap className="animate-pulse mr-2 text-yellow-500" size={16} />
                <span>Generating ultra-fast response...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <input
              ref={chatInputRef}
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={handleChatKeyPress}
              placeholder={`Ask a question about ${currentChatItem?._id === "knowledge-base" ? "the knowledge base" : "this PDF"}...`}
              className="flex-1 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={chatLoading}
              autoFocus
            />
            <button
              onClick={handleSendClick}
              disabled={chatLoading || !chatInput.trim()}
              className="px-4 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const UploadModal = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Add New Item</h2>
          <button onClick={() => setShowUploadModal(false)} className="text-gray-500 hover:text-gray-800">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Item Type</label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setUploadType("file")}
                className={`p-3 border rounded-md flex flex-col items-center ${uploadType === "file" ? "border-indigo-500 bg-indigo-50" : "border-gray-200"}`}
              >
                <Upload size={24} className="mb-1" />
                <span>File</span>
              </button>
              <button
                type="button"
                onClick={() => setUploadType("url")}
                className={`p-3 border rounded-md flex flex-col items-center ${uploadType === "url" ? "border-indigo-500 bg-indigo-50" : "border-gray-200"}`}
              >
                <Link size={24} className="mb-1" />
                <span>URL</span>
              </button>
              <button
                type="button"
                onClick={() => setUploadType("youtube")}
                className={`p-3 border rounded-md flex flex-col items-center ${uploadType === "youtube" ? "border-indigo-500 bg-indigo-50" : "border-gray-200"}`}
              >
                <Youtube size={24} className="mb-1" />
                <span>YouTube</span>
              </button>
              <button
                type="button"
                onClick={() => setUploadType("website")}
                className={`p-3 border rounded-md flex flex-col items-center ${uploadType === "website" ? "border-indigo-500 bg-indigo-50" : "border-gray-200"}`}
              >
                <Globe size={24} className="mb-1" />
                <span>Website</span>
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Title*</label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-md"
              ref={titleRef}
              placeholder="Enter title"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Description</label>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-md"
              ref={descriptionRef}
              placeholder="Enter description"
              rows="3"
            />
          </div>

          {uploadType === "file" ? (
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">File Upload*</label>
              <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                <input
                  type="file"
                  id="fileUpload"
                  className="hidden"
                  ref={fileInputRef}
                  multiple
                  onChange={handleFileSelect}
                />
                <label htmlFor="fileUpload" className="cursor-pointer">
                  <Upload size={36} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600">Click to browse or drag and drop files here</p>
                </label>
                {selectedFiles.length > 0 && (
                  <div className="mt-3 text-sm text-gray-600">{selectedFiles.length} file(s) selected</div>
                )}
              </div>
            </div>
          ) : (
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                {uploadType === "youtube" ? "YouTube URL*" : uploadType === "website" ? "Website URL*" : "URL*"}
              </label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-md"
                ref={urlRef}
                placeholder={`Enter ${uploadType} URL`}
                required
              />
            </div>
          )}

          <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={() => setShowUploadModal(false)}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md mr-2 hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2"></div>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload size={16} className="mr-2" />
                  <span>Upload</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  const ListItem = ({ item }) => {
    const isPDF = item.fileType === "application/pdf" || item.type === "pdf"
    const embeddingInfo = embeddingStatus[item._id]
    const healthInfo = chatHealth[item._id]
    const isEmbeddingLoading = embeddingLoading[item._id]
    const isReEmbeddingLoading = reEmbeddingLoading[item._id]
    const chatAvailable = embeddingInfo?.hasEmbeddings || healthInfo?.chatAvailable
    const details = embeddingDetails[item._id]

    return (
      <div className="border-b border-gray-200 py-4">
        <div className="flex items-start">
          <div className="mr-4 mt-1">{getSmallItemIcon(item)}</div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-gray-800">{item.name}</h3>
                <div className="mt-2 flex items-center space-x-2">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center"
                  >
                    <ExternalLink size={14} className="mr-1" />
                    <span>Open</span>
                  </a>
                  {item.description && <p className="text-sm text-gray-500 mt-1">{item.description}</p>}
                  <div className="flex items-center mt-2 text-xs text-gray-500">
                    <Calendar size={12} className="mr-1" />
                    <span>{formatDate(item.createdAt || item.uploadedAt)}</span>
                    {item.itemType && <span className="ml-2 capitalize">{item.itemType}</span>}
                  </div>
                </div>
              </div>
              <button onClick={() => handleDeleteItem(item._id)} className="text-red-500 hover:text-red-700 ml-2">
                <Trash2 size={18} />
              </button>
            </div>

            {isPDF && embeddingInfo && (
              <div className="mt-3 flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleCreateEmbeddings(item._id)}
                    disabled={isEmbeddingLoading}
                    className={`flex items-center px-3 py-1 text-xs rounded-md transition-colors ${
                      embeddingInfo?.hasEmbeddings
                        ? "bg-green-100 text-green-700 border border-green-200"
                        : "bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200"
                    }`}
                  >
                    {isEmbeddingLoading ? (
                      <Loader2 className="animate-spin mr-1" size={12} />
                    ) : (
                      <Database size={12} className="mr-1" />
                    )}
                    <span>{embeddingInfo?.hasEmbeddings ? "Embedded" : "Create Embeddings"}</span>
                  </button>

                  {embeddingInfo?.hasEmbeddings && (
                    <button
                      onClick={() => handleCreateEmbeddings(item._id, true)}
                      disabled={isReEmbeddingLoading}
                      className="flex items-center px-3 py-1 text-xs rounded-md transition-colors bg-orange-100 text-orange-700 border border-orange-200 hover:bg-orange-200"
                    >
                      {isReEmbeddingLoading ? (
                        <Loader2 className="animate-spin mr-1" size={12} />
                      ) : (
                        <RotateCcw size={12} className="mr-1" />
                      )}
                      <span>Re-embed</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleChatWithPDF(item)}
                    disabled={!chatAvailable}
                    className={`flex items-center px-3 py-1 text-xs rounded-md transition-colors ${
                      chatAvailable
                        ? "bg-indigo-100 text-indigo-700 border border-indigo-200 hover:bg-indigo-200"
                        : "bg-gray-100 text-gray-400 border border-gray-200"
                    }`}
                  >
                    <MessageCircle size={12} className="mr-1" />
                    <span>Chat</span>
                  </button>
                </div>

                {embeddingInfo?.hasEmbeddings && details && (
                  <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center">
                        <HardDrive size={12} className="mr-1" />
                        <span>
                          Size: <span className="font-medium">{details.fileSizeMB}MB</span>
                        </span>
                      </div>
                      <div className="flex items-center">
                        <FileIcon size={12} className="mr-1" />
                        <span>
                          Pages: <span className="font-medium">{details.totalPages}</span>
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Database size={12} className="mr-1" />
                        <span>
                          Chunks: <span className="font-medium">{details.embeddingCount}</span>
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Zap size={12} className="mr-1" />
                        <span>
                          Model: <span className="font-medium">{details.modelUsed}</span>
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Clock size={12} className="mr-1" />
                        <span>
                          Tokens: <span className="font-medium">{details.tokensUsed}</span>
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span>
                          Vector: <span className="font-medium">{details.vectorSize}D</span>
                        </span>
                      </div>
                    </div>
                    {details.timing && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <div className="grid grid-cols-3 gap-2">
                          <span>
                            Embedding: <span className="font-medium">{details.timing.embedding}</span>
                          </span>
                          <span>
                            Processing: <span className="font-medium">{details.timing.processing}</span>
                          </span>
                          <span>
                            Total: <span className="font-medium">{details.timing.total}</span>
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-gray-400">Collection: {details.collectionName}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }
// Add a new function to handle opening the AI Guidelines modal
const handleOpenAIGuidelinesModal = () => {
  // Set form data when opening the modal
  if (aiGuidelines) {
    setAIGuidelinesForm({
      message: aiGuidelines.message || '',
      prompt: aiGuidelines.prompt || '',
      FAQs: aiGuidelines.FAQs && aiGuidelines.FAQs.length > 0 
        ? aiGuidelines.FAQs.map(faq => ({ question: faq.question || '', _id: faq._id }))
        : [{ question: '', _id: Math.random().toString(36).substr(2, 9) }]
    })
  } else {
    // Reset to default for new guidelines
    setAIGuidelinesForm({
      message: '',
      prompt: '',
      FAQs: [{ question: '', _id: Math.random().toString(36).substr(2, 9) }]
    })
  }
  setShowAIGuidelinesModal(true)
}
  // --- AI Guidelines Modal ---
  const AIGuidelinesView = () => (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <RulerIcon size={28} className="text-orange-500 mr-2" />
        AI Guidelines
      </h1>
      {aiGuidelinesLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-b-4 border-orange-500"></div>
        </div>
      ) : aiGuidelines ? (
        <div className="space-y-6">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
            <div className="flex items-center mb-2">
              <FileText size={20} className="text-indigo-500 mr-2" />
              <span className="font-semibold text-gray-700">Message</span>
            </div>
            <div className="text-gray-800 whitespace-pre-line">{aiGuidelines.message || <span className="text-gray-400">No message</span>}</div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
            <div className="flex items-center mb-2">
              <Zap size={20} className="text-purple-500 mr-2" />
              <span className="font-semibold text-gray-700">Prompt</span>
            </div>
            <div className="text-gray-800 whitespace-pre-line">{aiGuidelines.prompt || <span className="text-gray-400">No prompt</span>}</div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
            <div className="flex items-center mb-2">
              <List size={20} className="text-green-500 mr-2" />
              <span className="font-semibold text-gray-700">FAQs</span>
            </div>
            <ul className="list-disc pl-6">
              {Array.isArray(aiGuidelines.FAQs) && aiGuidelines.FAQs.length > 0 ? (
                aiGuidelines.FAQs.map((faq, idx) => (
                  <li key={faq._id || idx} className="mb-1 text-gray-700">{faq.question}</li>
                ))
              ) : (
                <li className="text-gray-400">No FAQs</li>
              )}
            </ul>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-500">
          <RulerIcon size={32} className="mx-auto mb-2 text-orange-300" />
          No AI Guidelines found for this book.
        </div>
      )}
    </div>
  )



  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertTriangle className="text-red-500 mr-3 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-medium text-red-800">Error</h3>
            <p className="text-red-700">{error}</p>
            <button onClick={handleBackClick} className="mt-3 text-red-600 hover:text-red-800 flex items-center">
              <ArrowLeft size={16} className="mr-1" />
              <span>Go back</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // --- Main Render: inject AI Guidelines view for filter ---
  return (
    <div className="container mx-auto px-4 py-8">
      <ToastContainer position="top-right" autoClose={3000} />

      {showUploadModal && <UploadModal />}
      {showChatModal && <ChatModal />}
      {showAIGuidelinesModal && (
        <AIGuidelinesModal
          aiGuidelines={aiGuidelines}
          aiGuidelinesForm={aiGuidelinesForm}
          setAIGuidelinesForm={setAIGuidelinesForm}
          aiGuidelinesSaving={aiGuidelinesSaving}
          setShowAIGuidelinesModal={setShowAIGuidelinesModal}
          saveAIGuidelines={saveAIGuidelines}
        />
      )}
      {/* Tab Navigation */}
      <div className="mb-6 flex border-b border-gray-200">
        <button
          className={`px-4 py-2 -mb-px border-b-2 ${activeTab === "datastore" ? "border-indigo-600 text-indigo-700 font-semibold" : "border-transparent text-gray-500"}`}
          onClick={() => setActiveTab("datastore")}
        >
          Data Store
        </button>
      </div>
      {/* Tab Content */}
      {activeTab === "datastore" && (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            {type === "book" ? "Book" : type === "chapter" ? "Chapter" : type === "topic" ? "Topic" : "Sub-Topic"} Data Store
          </h1>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-8">
            <p className="text-gray-600">
              Upload and manage files related to this{" "}
              {type === "book" ? "book" : type === "chapter" ? "chapter" : type === "topic" ? "topic" : "sub-topic"}.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setShowUploadModal(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center"
              >
                <Upload size={18} className="mr-2" />
                <span>Add New Item</span>
              </button>
              <button
                onClick={() => {
                  setCurrentChatItem({ name: "Knowledge Base", _id: "knowledge-base" })
                  setChatMessages([
                    {
                      id: Date.now(),
                      type: "ai",
                      content: "Ready to search across all your documents. What would you like to know?",
                      confidence: 100,
                      sources: 0,
                      timestamp: new Date(),
                    },
                  ])
                  setShowChatModal(true)
                  setChatInput("")
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center"
              >
                <MessageCircle size={18} className="mr-2" />
                <span>Chat with Knowledge Base</span>
              </button>
              <button
               onClick={handleOpenAIGuidelinesModal}
                className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors flex items-center"
              >
                <RulerIcon size={18} className="mr-2" />
                <span>{aiGuidelines ? 'Edit' : 'Add'} AI Guidelines</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="overflow-x-auto flex-1">
              <div className="flex space-x-2 pb-2">
                {filters.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={`flex items-center px-3 py-2 rounded-md text-sm whitespace-nowrap ${
                      activeFilter === filter.id
                        ? "bg-indigo-100 text-indigo-700 font-medium"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <filter.icon size={16} className="mr-2" />
                    <span>{filter.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">View:</span>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md ${viewMode === "grid" ? "bg-indigo-100 text-indigo-700" : "text-gray-500 hover:bg-gray-100"}`}
                title="Grid view"
              >
                <Grid3X3 size={18} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md ${viewMode === "list" ? "bg-indigo-100 text-indigo-700" : "text-gray-500 hover:bg-gray-100"}`}
                title="List view"
              >
                <List size={18} />
              </button>
            </div>
          </div>

          {/* Content area: show guidelines or file list/grid */}
          {activeFilter === 'aiGuidelines' ? (
            <AIGuidelinesView />
          ) : (
            filteredItems.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                <FileText size={48} className="mx-auto text-gray-400 mb-3" />
                <h3 className="text-lg font-medium text-gray-700">No items found</h3>
                <p className="text-gray-500 mt-1">
                  {activeFilter !== "all"
                    ? `No ${activeFilter} items available. Try a different filter or add new items.`
                    : "Upload files to get started"}
                </p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map((item) => {
                  const isPDF = item.fileType === "application/pdf" || item.type === "pdf"
                  const embeddingInfo = embeddingStatus[item._id]
                  const healthInfo = chatHealth[item._id]
                  const isEmbeddingLoading = embeddingLoading[item._id]
                  const isReEmbeddingLoading = reEmbeddingLoading[item._id]
                  const chatAvailable = embeddingInfo?.hasEmbeddings || healthInfo?.chatAvailable

                  return (
                    <div key={item._id} className="border border-gray-200 rounded-lg overflow-hidden flex flex-col">
                      <div className="p-4 border-b border-gray-100">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 pr-2">
                            <h3 className="font-medium text-gray-800 mb-1 line-clamp-1">{item.name}</h3>
                            {item.description && <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>}
                            {isPDF && embeddingInfo && (
                              <div className="flex items-center mt-2 text-xs">
                                {embeddingInfo.hasEmbeddings ? (
                                  <div className="flex items-center text-green-600">
                                    <CheckCircle size={12} className="mr-1" />
                                    <span>{embeddingInfo.embeddingCount} embeddings</span>
                                    {chatAvailable && <span className="ml-2 text-blue-600">• Chat Ready</span>}
                                  </div>
                                ) : (
                                  <div className="flex items-center text-gray-500">
                                    <XCircle size={12} className="mr-1" />
                                    <span>No embeddings</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteItem(item._id)}
                            className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>

                      <div className="flex-1 p-4 flex items-center justify-center bg-gray-50">
                        {item.fileType?.startsWith("image/") ? (
                          <div className="h-36 w-full overflow-hidden">
                            <img
                              src={item.url || "/placeholder.svg"}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : item.itemType === "youtube" ? (
                          <div className="relative w-full pt-[56.25%]">
                            <iframe
                              className="absolute top-0 left-0 w-full h-full"
                              src={item.url.replace("watch?v=", "embed/")}
                              title={item.name}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            ></iframe>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-4">
                            {getItemIcon(item)}
                            <span className="text-sm text-gray-500 mt-2">
                              {item.itemType || item.fileType?.split("/")[1] || "File"}
                            </span>
                          </div>
                        )}
                      </div>

                      {isPDF && (
                        <div className="p-3 bg-gray-50 border-t border-gray-100">
                          <div className="flex space-x-2 mb-2">
                            <button
                              onClick={() => handleCreateEmbeddings(item._id)}
                              disabled={isEmbeddingLoading}
                              className={`flex-1 flex items-center justify-center px-3 py-2 text-sm rounded-md transition-colors ${
                                embeddingInfo?.hasEmbeddings
                                  ? "bg-green-100 text-green-700 border border-green-200"
                                  : "bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200"
                              }`}
                            >
                              {isEmbeddingLoading ? (
                                <Loader2 className="animate-spin mr-1" size={14} />
                              ) : (
                                <Database size={14} className="mr-1" />
                              )}
                              <span>{embeddingInfo?.hasEmbeddings ? "Embedded" : "Embedding"}</span>
                            </button>

                            <button
                              onClick={() => handleChatWithPDF(item)}
                              className={`flex-1 flex items-center justify-center px-3 py-2 text-sm rounded-md transition-colors ${
                                chatAvailable
                                  ? "bg-indigo-100 text-indigo-700 border border-indigo-200 hover:bg-indigo-200"
                                  : "bg-gray-100 text-gray-400 border border-gray-200"
                              }`}
                            >
                              <MessageCircle size={14} className="mr-1" />
                              <span>Chat</span>
                            </button>
                          </div>

                          {embeddingInfo?.hasEmbeddings && (
                            <button
                              onClick={() => handleCreateEmbeddings(item._id, true)}
                              disabled={isReEmbeddingLoading}
                              className="w-full flex items-center justify-center px-3 py-2 text-sm rounded-md transition-colors bg-orange-100 text-orange-700 border border-orange-200 hover:bg-orange-200"
                            >
                              {isReEmbeddingLoading ? (
                                <Loader2 className="animate-spin mr-1" size={14} />
                              ) : (
                                <RotateCcw size={14} className="mr-1" />
                              )}
                              <span>Re-embed</span>
                            </button>
                          )}
                        </div>
                      )}

                      {!isPDF && (
                        <div className="p-3 bg-gray-50 border-t border-gray-100 mt-auto">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center justify-center"
                          >
                            <span>Open</span>
                          </a>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200">
                {filteredItems.map((item) => (
                  <ListItem key={item._id} item={item} />
                ))}
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}

export default DataStore
