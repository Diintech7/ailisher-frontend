"use client"

import { useState, useEffect } from "react"
import { MessageSquare, Database, Loader2, CheckCircle, AlertCircle, History } from "lucide-react"
import { toast } from "react-toastify"
import Cookies from "js-cookie"

const PDFActions = ({ item, onEmbeddingComplete }) => {
  const [embeddingStatus, setEmbeddingStatus] = useState("idle") // idle, loading, success, error
  const [chatLoading, setChatLoading] = useState(false)
  const [showChatModal, setShowChatModal] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState("")
  const [chatHistory, setChatHistory] = useState([])

  // Debug log to check if component is rendering
  console.log("PDFActions rendering for item:", item)

  // Check embedding status on component mount
  useEffect(() => {
    if (item && (item.type === "pdf" || item.fileType === "application/pdf")) {
      console.log("Checking embedding status for PDF:", item)
      checkEmbeddingStatus()
    }
  }, [item]) // Updated to use the entire item object as dependency

  // Check embedding status
  const checkEmbeddingStatus = async () => {
    try {
      const token = Cookies.get("usertoken")
      const response = await fetch(`http://localhost:5000/api/pdf-processing/check-embeddings/${item._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()
      console.log("Embedding status response:", data)

      if (data.success) {
        if (data.hasEmbeddings) {
          setEmbeddingStatus("success")
        } else {
          setEmbeddingStatus("idle")
        }
      }
    } catch (error) {
      console.error("Error checking embeddings:", error)
    }
  }

  // Load chat history
  const loadChatHistory = async () => {
    try {
      const token = Cookies.get("usertoken")
      const response = await fetch(`http://localhost:5000/api/pdf-processing/chat-history/${item._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()
      if (data.success) {
        setChatHistory(data.chatHistory || [])

        // Convert chat history to chat messages format
        const historyMessages = []
        data.chatHistory.forEach((chat) => {
          historyMessages.push({
            type: "user",
            message: chat.question,
            timestamp: chat.timestamp,
          })
          historyMessages.push({
            type: "assistant",
            message: chat.answer,
            confidence: chat.confidence,
            sources: chat.sources,
            timestamp: chat.timestamp,
          })
        })

        setChatMessages([
          {
            type: "system",
            message: `Ready to chat with "${item.title || item.name}". Ask me anything about this document!`,
          },
          ...historyMessages,
        ])
      }
    } catch (error) {
      console.error("Error loading chat history:", error)
    }
  }

  // Create embeddings for the PDF
  const handleCreateEmbeddings = async () => {
    setEmbeddingStatus("loading")

    try {
      const token = Cookies.get("usertoken")
      const response = await fetch(`http://localhost:5000/api/pdf-processing/create-embeddings/${item._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (data.success) {
        setEmbeddingStatus("success")
        toast.success(data.skipProcessing ? "Embeddings already exist!" : "Embeddings created successfully!")
        if (onEmbeddingComplete) {
          onEmbeddingComplete(item._id)
        }
      } else {
        setEmbeddingStatus("error")
        toast.error(data.message || "Failed to create embeddings")
      }
    } catch (error) {
      setEmbeddingStatus("error")
      toast.error("Error creating embeddings: " + error.message)
    }
  }

  // Start chat with PDF
  const handleStartChat = async () => {
    // First check if embeddings exist
    if (embeddingStatus !== "success") {
      toast.error("Please create embeddings first before chatting with this PDF")
      return
    }

    setShowChatModal(true)
    await loadChatHistory()
  }

  // Send question to PDF
  const handleSendQuestion = async () => {
    if (!currentQuestion.trim()) return

    const question = currentQuestion.trim()
    setCurrentQuestion("")
    setChatLoading(true)

    // Add user message to chat
    setChatMessages((prev) => [
      ...prev,
      {
        type: "user",
        message: question,
        timestamp: new Date(),
      },
    ])

    try {
      const token = Cookies.get("usertoken")
      const response = await fetch(`http://localhost:5000/api/pdf-processing/chat/${item._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question }),
      })

      const data = await response.json()

      if (data.success) {
        setChatMessages((prev) => [
          ...prev,
          {
            type: "assistant",
            message: data.answer,
            confidence: data.confidence,
            sources: data.sources,
            timestamp: new Date(),
          },
        ])
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            type: "error",
            message: data.message || "Failed to get response",
            timestamp: new Date(),
          },
        ])
      }
    } catch (error) {
      setChatMessages((prev) => [
        ...prev,
        {
          type: "error",
          message: "Error: " + error.message,
          timestamp: new Date(),
        },
      ])
    }
  }

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString()
  }

  // Chat Modal Component
  const ChatModal = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl h-3/4 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Chat with {item.title || item.name}</h2>
            {chatHistory.length > 0 && (
              <p className="text-sm text-gray-500 flex items-center mt-1">
                <History size={14} className="mr-1" />
                {chatHistory.length} previous conversations
              </p>
            )}
          </div>
          <button onClick={() => setShowChatModal(false)} className="text-gray-500 hover:text-gray-800 text-2xl">
            &times;
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto mb-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
          {chatMessages.map((msg, index) => (
            <div key={index} className={`mb-4 ${msg.type === "user" ? "text-right" : "text-left"}`}>
              <div
                className={`inline-block max-w-3xl p-3 rounded-lg ${
                  msg.type === "user"
                    ? "bg-blue-500 text-white"
                    : msg.type === "error"
                      ? "bg-red-100 text-red-800"
                      : msg.type === "system"
                        ? "bg-gray-200 text-gray-700"
                        : "bg-white text-gray-800 border"
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.message}</div>
                {msg.confidence && (
                  <div className="text-xs mt-2 opacity-75">
                    Confidence: {msg.confidence}% | Sources: {msg.sources}
                  </div>
                )}
                {msg.timestamp && msg.type !== "system" && (
                  <div className="text-xs mt-1 opacity-60">{formatTimestamp(msg.timestamp)}</div>
                )}
              </div>
            </div>
          ))}
          {chatLoading && (
            <div className="text-left mb-4">
              <div className="inline-block bg-white text-gray-800 border p-3 rounded-lg">
                <Loader2 className="animate-spin inline mr-2" size={16} />
                Thinking...
              </div>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={currentQuestion}
            onChange={(e) => setCurrentQuestion(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && !chatLoading && handleSendQuestion()}
            placeholder="Ask a question about this PDF..."
            className="flex-1 p-3 border border-gray-300 rounded-md"
            disabled={chatLoading}
          />
          <button
            onClick={handleSendQuestion}
            disabled={chatLoading || !currentQuestion.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {chatLoading ? <Loader2 className="animate-spin" size={16} /> : "Send"}
          </button>
        </div>
      </div>
    </div>
  )

  // Check if this item is a PDF
  const isPDF = item && (item.type === "pdf" || item.fileType === "application/pdf")

  console.log("Is PDF check:", isPDF, "item.type:", item?.type, "item.fileType:", item?.fileType)

  if (!isPDF) {
    console.log("Not a PDF, not rendering PDFActions")
    return null
  }

  console.log("Rendering PDF actions with status:", embeddingStatus)

  return (
    <>
      <div className="flex gap-2 mt-2">
        {/* Embedding Button */}
        <button
          onClick={handleCreateEmbeddings}
          disabled={embeddingStatus === "loading"}
          className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            embeddingStatus === "success"
              ? "bg-green-100 text-green-700 cursor-default"
              : embeddingStatus === "error"
                ? "bg-red-100 text-red-700 hover:bg-red-200"
                : embeddingStatus === "loading"
                  ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                  : "bg-purple-100 text-purple-700 hover:bg-purple-200"
          }`}
        >
          {embeddingStatus === "loading" ? (
            <Loader2 className="animate-spin mr-2" size={16} />
          ) : embeddingStatus === "success" ? (
            <CheckCircle className="mr-2" size={16} />
          ) : embeddingStatus === "error" ? (
            <AlertCircle className="mr-2" size={16} />
          ) : (
            <Database className="mr-2" size={16} />
          )}
          {embeddingStatus === "loading"
            ? "Processing..."
            : embeddingStatus === "success"
              ? "Embedded"
              : embeddingStatus === "error"
                ? "Retry Embedding"
                : "Create Embeddings"}
        </button>

        {/* Chat Button */}
        <button
          onClick={handleStartChat}
          disabled={embeddingStatus !== "success"}
          className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            embeddingStatus === "success"
              ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          <MessageSquare className="mr-2" size={16} />
          Chat
          {chatHistory.length > 0 && (
            <span className="ml-1 bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">{chatHistory.length}</span>
          )}
        </button>
      </div>

      {/* Chat Modal */}
      {showChatModal && <ChatModal />}
    </>
  )
}

export default PDFActions
