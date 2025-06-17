import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, Bot, User, Trash2, InfoIcon, Download, Copy } from 'lucide-react';
import Cookies from 'js-cookie';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ChatApplication = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [contextTitle, setContextTitle] = useState('');
  const [contextType, setContextType] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const type = queryParams.get('type');
  const title = queryParams.get('title');
  const chapterId = queryParams.get('chapterId');
  const topicId = queryParams.get('topicId');
  const subtopicId = queryParams.get('subtopicId');

  useEffect(() => {
    if (type && title) {
      setContextType(type);
      setContextTitle(title);
      
      // Add welcome message based on context type
      const welcomeMessage = {
        id: Date.now(),
        sender: 'bot',
        text: getWelcomeMessage(type, title),
        timestamp: new Date().toISOString()
      };
      
      setMessages([welcomeMessage]);
    }
  }, [type, title]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getWelcomeMessage = (type, title) => {
    switch(type) {
      case 'book':
        return `Hello! How can I help you with the book "${title}"?`;
      case 'chapter':
        return `Hello! How can I help you with the chapter "${title}"?`;
      case 'topic':
        return `Hello! How can I help you with the topic "${title}"?`;
      case 'subtopic':
        return `Hello! How can I help you with the sub-topic "${title}"?`;
      default:
        return `Hello! How can I help you today?`;
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleBackClick = () => {
    if (type === 'book') {
      navigate(`/ai-books/${id}`);
    } else if (type === 'chapter') {
      navigate(`/ai-books/${id}/chapters/${chapterId}`);
    } else if (type === 'topic') {
      navigate(`/ai-books/${id}/chapters/${chapterId}/topics/${topicId}`);
    } else if (type === 'subtopic') {
      navigate(`/ai-books/${id}/chapters/${chapterId}/topics/${topicId}/subtopics/${subtopicId}`);
    } else {
      navigate('/ai-books');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) return;
    
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: inputMessage,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);
    
    try {
      const token = Cookies.get('usertoken');
      if (!token) {
        toast.error('Authentication required');
        navigate('/login');
        return;
      }
      
      setIsLoading(true);
      
      // Mock the AI response for now - in a real app, this would be an API call
      // to your backend which would then connect to an AI service
      setTimeout(() => {
        const response = generateMockResponse(inputMessage, type, contextTitle);
        
        const botMessage = {
          id: Date.now() + 1,
          sender: 'bot',
          text: response,
          timestamp: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
        setIsLoading(false);
      }, 1000);
      
      // In a real implementation, you would use fetch like this:
      /*
      const response = await fetch(`https://aipbbackend-c5ed.onrender.com/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: inputMessage,
          contextType: type,
          bookId: id,
          chapterId: chapterId,
          topicId: topicId,
          subtopicId: subtopicId,
          contextTitle: title
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        const botMessage = {
          id: Date.now() + 1,
          sender: 'bot',
          text: data.message,
          timestamp: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, botMessage]);
      } else {
        toast.error(data.message || 'Failed to get response');
      }
      */
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('An error occurred while sending your message');
      setIsTyping(false);
    } finally {
      setIsLoading(false);
      messageInputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const generateMockResponse = (message, type, title) => {
    // This is just a mock response generator for demonstration
    const lowercaseMessage = message.toLowerCase();
    
    if (type === 'book') {
      if (lowercaseMessage.includes('summary') || lowercaseMessage.includes('about')) {
        return `"${title}" is a comprehensive guide covering various topics. The book is structured into chapters, each focusing on specific concepts. You can explore individual chapters for more detailed information.`;
      }
      
      if (lowercaseMessage.includes('chapter') || lowercaseMessage.includes('content')) {
        return `This book contains multiple chapters on different topics. You can navigate to specific chapters from the book detail page to learn more about each topic.`;
      }
      
      return `I'm here to help you with information about "${title}". You can ask about specific chapters, topics, or any questions related to the content.`;
    } else if (type === 'chapter') {
      // Chapter-specific responses
      if (lowercaseMessage.includes('summary') || lowercaseMessage.includes('about')) {
        return `The chapter "${title}" covers key concepts related to this specific topic. It contains multiple subtopics and explanations to help you understand the material better.`;
      }
      
      if (lowercaseMessage.includes('topic') || lowercaseMessage.includes('concept')) {
        return `This chapter discusses several important topics. You can view detailed information about each topic by navigating to them from the chapter detail page.`;
      }
      
      return `I'm here to help you with information about the chapter "${title}". Feel free to ask specific questions about the topics covered in this chapter.`;
    } else if (type === 'topic') {
      // Topic-specific responses
      if (lowercaseMessage.includes('summary') || lowercaseMessage.includes('about')) {
        return `The topic "${title}" explores important concepts and provides detailed explanations. It may contain multiple sub-topics that break down complex ideas into manageable sections.`;
      }
      
      if (lowercaseMessage.includes('subtopic') || lowercaseMessage.includes('detail')) {
        return `This topic contains various sub-topics that provide in-depth information. You can navigate to individual sub-topics from the topic detail page.`;
      }
      
      if (lowercaseMessage.includes('example') || lowercaseMessage.includes('illustration')) {
        return `The topic "${title}" includes practical examples to help illustrate key concepts. These examples demonstrate how to apply theoretical knowledge in real-world scenarios.`;
      }
      
      return `I'm here to help you understand the topic "${title}". Feel free to ask about specific concepts, examples, or any other aspects of this topic you'd like to explore.`;
    } else if (type === 'subtopic') {
      // Sub-topic specific responses
      if (lowercaseMessage.includes('summary') || lowercaseMessage.includes('about')) {
        return `The sub-topic "${title}" provides detailed information about a specific aspect of the parent topic. It contains focused content that elaborates on key concepts.`;
      }
      
      if (lowercaseMessage.includes('example') || lowercaseMessage.includes('illustration')) {
        return `The sub-topic "${title}" includes specific examples that help clarify the concepts being discussed. These examples are designed to make the content more accessible and practical.`;
      }
      
      if (lowercaseMessage.includes('relation') || lowercaseMessage.includes('parent') || lowercaseMessage.includes('topic')) {
        return `This sub-topic is part of a larger topic structure. It focuses specifically on "${title}" while the parent topic provides a broader context for this information.`;
      }
      
      if (lowercaseMessage.includes('detail') || lowercaseMessage.includes('depth')) {
        return `The sub-topic "${title}" goes into greater depth on specific aspects of the parent topic. It provides more detailed explanations and examples to enhance understanding.`;
      }
      
      return `I'm here to help you understand the sub-topic "${title}". Feel free to ask specific questions about the concepts, examples, or any other aspects of this sub-topic you'd like to explore.`;
    }
    
    // Default response
    return `I'm here to help you with information about "${title}". Please let me know what specific information you're looking for.`;
  };

  const handleClearChat = () => {
    const welcomeMessage = {
      id: Date.now(),
      sender: 'bot',
      text: getWelcomeMessage(contextType, contextTitle),
      timestamp: new Date().toISOString()
    };
    
    setMessages([welcomeMessage]);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const copyMessageToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success('Copied to clipboard'))
      .catch(() => toast.error('Failed to copy text'));
  };

  const getHeaderTitle = () => {
    switch(contextType) {
      case 'book':
        return `Chat with book: ${contextTitle}`;
      case 'chapter':
        return `Chat with chapter: ${contextTitle}`;
      case 'topic':
        return `Chat with topic: ${contextTitle}`;
      case 'subtopic':
        return `Chat with sub-topic: ${contextTitle}`;
      default:
        return 'Chat';
    }
  };

  const getInfoPanelContent = () => {
    switch(contextType) {
      case 'book':
        return `This AI assistant can help you understand and navigate the book "${contextTitle}". You can ask questions about chapters, topics, and content.`;
      case 'chapter':
        return `This AI assistant can help you understand the chapter "${contextTitle}". You can ask questions about specific topics and concepts covered.`;
      case 'topic':
        return `This AI assistant can help you understand the topic "${contextTitle}". You can ask questions about concepts, examples, and related sub-topics.`;
      case 'subtopic':
        return `This AI assistant can help you understand the sub-topic "${contextTitle}". You can ask questions about specific details, examples, and how it relates to the parent topic.`;
      default:
        return `This AI assistant can help answer your questions about AI books.`;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between container mx-auto">
          <div className="flex items-center">
            <button
              onClick={handleBackClick}
              className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-semibold text-gray-800">
              {getHeaderTitle()}
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
              title="Information"
            >
              <InfoIcon size={20} />
            </button>
            <button
              onClick={handleClearChat}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
              title="Clear chat"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Info panel */}
      {showInfo && (
        <div className="bg-blue-50 border-b border-blue-200 p-4">
          <div className="container mx-auto">
            <div className="flex items-start">
              <InfoIcon size={20} className="text-blue-500 mr-2 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-blue-800">About this chat</h3>
                <p className="text-blue-700 text-sm">
                  {getInfoPanelContent()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Messages area */}
      <div className="flex-grow overflow-y-auto p-4 container mx-auto">
        <div className="max-w-3xl mx-auto">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex mb-4 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`flex max-w-[80%] ${message.sender === 'user' 
                  ? 'flex-row-reverse items-end' 
                  : 'items-start'}`}
              >
                <div 
                  className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mr-2 ${
                    message.sender === 'user' 
                      ? 'bg-indigo-100 ml-2' 
                      : 'bg-green-100'
                  }`}
                >
                  {message.sender === 'user' 
                    ? <User size={16} className="text-indigo-600" />
                    : <Bot size={16} className="text-green-600" />
                  }
                </div>
                <div 
                  className={`relative group rounded-lg py-2 px-4 ${
                    message.sender === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-800'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.text}</p>
                  <div className="text-xs mt-1 opacity-70">
                    {formatTimestamp(message.timestamp)}
                  </div>
                  
                  {/* Copy button - only show on hover */}
                  <button
                    onClick={() => copyMessageToClipboard(message.text)}
                    className={`absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${
                      message.sender === 'user'
                        ? 'hover:bg-indigo-700 text-indigo-100'
                        : 'hover:bg-gray-100 text-gray-500'
                    }`}
                    title="Copy to clipboard"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex mb-4 justify-start">
              <div className="flex items-start">
                <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mr-2 bg-green-100">
                  <Bot size={16} className="text-green-600" />
                </div>
                <div className="bg-white border border-gray-200 text-gray-800 rounded-lg py-2 px-4">
                  <div className="flex space-x-1">
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Input area */}
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="container mx-auto">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="flex items-end">
              <div className="flex-grow">
                <textarea
                  ref={messageInputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  rows="2"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 mt-1 ml-1">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className={`ml-2 px-4 py-2 rounded-lg flex items-center justify-center ${
                  isLoading || !inputMessage.trim()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {isLoading ? (
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  <Send size={18} />
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatApplication;