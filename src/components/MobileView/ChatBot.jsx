"use client"

import { useState } from "react"
import { MessageCircle, X, Send } from "lucide-react"

const ChatBot = ({ chatOpen, setChatOpen }) => {
  const [chatFullScreen, setChatFullScreen] = useState(false)
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! How can I help you with these learning materials?", sender: "bot" },
  ])
  const [newMessage, setNewMessage] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [startY, setStartY] = useState(0)

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    // Add user message
    const userMessage = { id: Date.now(), text: newMessage, sender: "user" }
    setMessages([...messages, userMessage])
    setNewMessage("")

    // Simulate bot response after 1 second
    setTimeout(() => {
      const botMessage = {
        id: Date.now() + 1,
        text: "I'm a demo bot. In the future, this will be connected to a real API for interactive assistance.",
        sender: "bot",
      }
      setMessages((prev) => [...prev, botMessage])
    }, 1000)
  }

  const handleDragStart = (e) => {
    setIsDragging(true)
    setStartY(e.touches[0].clientY)
  }

  const handleDragMove = (e) => {
    if (!isDragging) return

    const currentY = e.touches[0].clientY
    const difference = startY - currentY

    // If dragged up significantly, make it fullscreen
    if (difference > 100 && !chatFullScreen) {
      setChatFullScreen(true)
      setIsDragging(false)
    }
    // If dragged down significantly while in fullscreen, make it half screen
    else if (difference < -100 && chatFullScreen) {
      setChatFullScreen(false)
      setIsDragging(false)
    }
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  return (
    <>
      {/* Chat Bot Icon */}
      <button
        onClick={() => setChatOpen(true)}
        className={`fixed bottom-6 right-6 h-16 w-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg flex items-center justify-center transition-all hover:shadow-xl hover:transform hover:scale-110 ${chatOpen ? "hidden" : ""}`}
      >
        <MessageCircle size={28} />
      </button>

      {/* Chat Interface */}
      {chatOpen && (
        <div
          className={`fixed ${chatFullScreen ? "top-0 bottom-0" : "bottom-0 h-1/2"} right-0 left-0 bg-white shadow-lg transition-all duration-300 z-50 flex flex-col`}
          style={{ borderTopLeftRadius: "1rem", borderTopRightRadius: "1rem" }}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
        >
          {/* Chat Header */}
          <div
            className="px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white flex justify-between items-center"
            style={{ borderTopLeftRadius: "1rem", borderTopRightRadius: "1rem" }}
          >
            <div className="flex items-center">
              <span className="font-medium text-lg">Learning Assistant</span>
            </div>
            <div className="flex items-center">
              <button onClick={() => setChatOpen(false)} className="ml-2 p-1 rounded-full hover:bg-pink-400 transition">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Drag handle */}
          <div className="flex justify-center py-1 bg-indigo-50">
            <div className="w-16 h-1 bg-gray-300 rounded"></div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-auto p-4 space-y-4 bg-gradient-to-b from-purple-50 to-indigo-50">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`rounded-2xl px-4 py-3 max-w-[75%] shadow-sm ${message.sender === "user" ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white" : "bg-white text-gray-800 border border-purple-100"}`}
                >
                  {message.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-purple-200 bg-white">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Type your message..."
                className="flex-1 border border-purple-300 rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
              />
              <button
                onClick={handleSendMessage}
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full p-3 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 hover:transform hover:scale-105"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ChatBot
