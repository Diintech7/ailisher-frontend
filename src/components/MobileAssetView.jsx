"use client"

import { useState, useEffect } from "react"
import { useNavigate, useParams, useLocation } from "react-router-dom"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

import Header from "./MobileView/Header.jsx"
import TabNavigation from "./MobileView/TabNavigation.jsx"
import TabContent from "./MobileView/TabContent.jsx"
import ChatBot from "./MobileView/ChatBot.jsx"
import LoadingState from "./MobileView/LandingState.jsx"
import ErrorState from "./MobileView/ErrorState.jsx"
import { apiRequest } from "./MobileView/utilss/api.jsx"

const MobileAssetView = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [item, setItem] = useState(null)
  const [activeTab, setActiveTab] = useState("summary")
  const [imageError, setImageError] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)

  // Data states
  const [summaries, setSummaries] = useState([])
  const [videos, setVideos] = useState([])
  const [pyqs, setPyqs] = useState([])

  // Questions
  const [objectiveQuestionSets, setObjectiveQuestionSets] = useState({
    L1: [], // Beginner sets
    L2: [], // Intermediate sets
    L3: [], // Advanced sets
  })
  const [subjectiveQuestionSets, setSubjectiveQuestionSets] = useState({
    L1: [], // Beginner sets
    L2: [], // Intermediate sets
    L3: [], // Advanced sets
  })

  const [activeObjectiveLevelTab, setActiveObjectiveLevelTab] = useState("L1")
  const [activeLevelTab, setActiveLevelTab] = useState("L1")
  const [selectedObjectiveSet, setSelectedObjectiveSet] = useState(null)
  const [selectedSubjectiveSet, setSelectedViewSet] = useState(null)

  // Get URL parameters from new routes
  const { bookId, workbookId, chapterId, topicId, subtopicId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const isWorkbook = location.pathname.includes("/workbooks/") || Boolean(workbookId)
  const effectiveBookId = isWorkbook ? workbookId : bookId

  // Determine item type based on available parameters
  const getItemType = () => {
    if (subtopicId) return "subtopic"
    if (topicId) return "topic"
    if (chapterId) return "chapter"
    return "book"
  }

  const itemType = getItemType()

  useEffect(() => {
    fetchItemDetails()
  }, [bookId, workbookId, chapterId, topicId, subtopicId])

  const fetchItemDetails = async () => {
    setLoading(true)
    setError(null)

    try {
      // Validate that we have a valid ID
      if (!effectiveBookId) {
        throw new Error("No valid book or workbook ID provided")
      }

      // Build the QR code data API URL based on item type
      let qrDataUrl = ""

      if (itemType === "book") {
        qrDataUrl = `/qrcode/book-data/${effectiveBookId}`
      } else if (itemType === "chapter" && chapterId) {
        qrDataUrl = `/qrcode/book-data/${effectiveBookId}/chapters/${chapterId}`
      } else if (itemType === "topic" && chapterId && topicId) {
        qrDataUrl = `/qrcode/book-data/${effectiveBookId}/chapters/${chapterId}/topics/${topicId}`
      } else if (itemType === "subtopic" && chapterId && topicId && subtopicId) {
        qrDataUrl = `/qrcode/book-data/${effectiveBookId}/chapters/${chapterId}/topics/${topicId}/subtopics/${subtopicId}`
      } else {
        throw new Error("Invalid URL parameters")
      }

      // Fetch item details from QR code data endpoint
      const data = await apiRequest(qrDataUrl)
      
      // Set item data based on item type
      if (itemType === "book") {
        setItem(data.book)
      } else if (itemType === "chapter") {
        setItem(data.chapter)
      } else if (itemType === "topic") {
        setItem(data.topic)
      } else if (itemType === "subtopic") {
        setItem(data.subtopic)
      }

      // Set asset data from the QR code response
      setSummaries(data.summaries || [])
      setVideos(data.videos || [])
      setPyqs(data.pyqs || [])
      
      // Set question sets
      const objSets = data.objectiveQuestionSets || { L1: [], L2: [], L3: [] }
      const subSets = data.subjectiveQuestionSets || { L1: [], L2: [], L3: [] }
      
      setObjectiveQuestionSets(objSets)
      setSubjectiveQuestionSets(subSets)

      setLoading(false)
    } catch (err) {
      console.error("Error fetching item details:", err)
      setError(`Error: ${err.message}`)
      setLoading(false)
    }
  }

  const getCurrentItemId = () => {
    if (itemType === "subtopic") return subtopicId
    if (itemType === "topic") return topicId
    if (itemType === "chapter") return chapterId
    return effectiveBookId
  }

  const handleBackClick = () => {
    navigate(-1)
  }

  if (loading) {
    return <LoadingState />
  }

  if (error) {
    return <ErrorState error={error} handleBackClick={handleBackClick} />
  }

  return (
    <div className="container mx-auto px-3 md:px-4 py-4 md:py-8 max-w-5xl bg-gradient-to-b from-purple-50 to-indigo-50 min-h-screen">
      <ToastContainer position="top-right" />

      {/* Header */}
      <Header item={item} itemType={itemType} imageError={imageError} setImageError={setImageError} />

      {/* Tabs */}
      <div className="mb-4 md:mb-6">
        <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="mt-4 md:mt-6">
          <TabContent
            activeTab={activeTab}
            summaries={summaries}
            videos={videos}
            pyqs={pyqs}
            objectiveQuestionSets={objectiveQuestionSets}
            subjectiveQuestionSets={subjectiveQuestionSets}
            activeObjectiveLevelTab={activeObjectiveLevelTab}
            setActiveObjectiveLevelTab={setActiveObjectiveLevelTab}
            activeLevelTab={activeLevelTab}
            setActiveLevelTab={setActiveLevelTab}
            selectedObjectiveSet={selectedObjectiveSet}
            setSelectedObjectiveSet={setSelectedObjectiveSet}
            selectedSubjectiveSet={selectedSubjectiveSet}
            setSelectedViewSet={setSelectedViewSet}
            itemType={itemType}
            getCurrentItemId={getCurrentItemId}
            isWorkbook={isWorkbook}
          />
        </div>
      </div>

      {/* Chat Bot */}
      <ChatBot chatOpen={chatOpen} setChatOpen={setChatOpen} />
    </div>
  )
}

export default MobileAssetView