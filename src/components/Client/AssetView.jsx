"use client"

import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Book, FileText, List, BookOpen, Plus } from "lucide-react"
import Cookies from "js-cookie"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import axios from "axios"
import IsolatedSubjectiveModal from "./components/modals/IsolatedSubjectiveModal"
import IsolatedObjectiveModal from "./components/modals/IsolatedObjectiveModal"
import SummaryModal from "./components/modals/SummaryModal"
import VideoModal from "./components/modals/VideoModal"
import PYQModal from "./components/modals/PYQModal"
import DeleteConfirmationModal from "./components/modals/DeleteConfirmationModal"
import CreateSetModal from "./components/modals/CreateSetModal"
import CreateObjectiveSetModal from "./components/modals/CreateObjectiveSetModal"
import SummaryTab from "./components/tabs/SummaryTab"
import VideosTab from "./components/tabs/VideosTab"
import PYQsTab from "./components/tabs/PYQsTab"
import SubjectiveTab from "./components/tabs/SubjectiveTab"
import ObjectiveTab from "./components/tabs/ObjectiveTab"
import GenerateAssetsModal from "./components/modals/GenerateAssetsModal"

const AssetView = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [item, setItem] = useState(null)
  const [activeTab, setActiveTab] = useState("summary")
  const [imageError, setImageError] = useState(false)

  // Modal states
  const [showSummaryModal, setShowSummaryModal] = useState(false)
  const [showObjectiveModal, setShowObjectiveModal] = useState(false)
  const [showSubjectiveModal, setShowSubjectiveModal] = useState(false)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [showPYQModal, setShowPYQModal] = useState(false)

  // Question set related states
  const [showCreateSetModal, setShowCreateSetModal] = useState(false)
  const [activeLevelTab, setActiveLevelTab] = useState("L1") // L1, L2, L3

  // Objective question set states
  const [currentObjectiveSet, setCurrentObjectiveSet] = useState(null)
  const [selectedObjectiveSet, setSelectedObjectiveSet] = useState(null)
  const [activeObjectiveLevelTab, setActiveObjectiveLevelTab] = useState("L1") // L1, L2, L3
  const [showCreateObjectiveSetModal, setShowCreateObjectiveSetModal] = useState(false)
  const [newObjectiveSetData, setNewObjectiveSetData] = useState({
    name: "",
    description: "",
    level: "L1",
  })

  const [currentSet, setCurrentSet] = useState(null)
  const [newSetData, setNewSetData] = useState({
    name: "",
    description: "",
    level: "L1",
  })

  // Add state for question editing and deletion
  const [editingQuestion, setEditingQuestion] = useState(null)
  const [deletingQuestion, setDeletingQuestion] = useState(null)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)

  // States for objective question editing and deletion
  const [editingObjectiveQuestion, setEditingObjectiveQuestion] = useState(null)
  const [deletingObjectiveQuestion, setDeletingObjectiveQuestion] = useState(null)

  // Form data states
  const [summaryData, setSummaryData] = useState({ content: "" })
  const [objectiveData, setObjectiveData] = useState({
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    difficulty: "medium",
  })
  const [subjectiveData, setSubjectiveData] = useState({
    questions: [
      {
        question: "",
        answer: "",
        keywords: "",
        difficulty: "medium",
      },
    ],
  })
  const [videoData, setVideoData] = useState({
    title: "",
    url: "",
    description: "",
  })
  const [pyqData, setPYQData] = useState({
    year: new Date().getFullYear().toString(),
    question: "",
    answer: "",
    difficulty: "medium",
    source: "",
  })

  // Content data states
  const [summaries, setSummaries] = useState([])
  const [objectiveSets, setObjectiveSets] = useState([])
  const [subjectiveSets, setSubjectiveSets] = useState([])
  const [videos, setVideos] = useState([])
  const [pyqs, setPYQs] = useState([])

  // Add a state for currently selected set to view questions
  const [selectedViewSet, setSelectedViewSet] = useState(null)

  const [showGenerateAssetsModal, setShowGenerateAssetsModal] = useState(false)
  const { bookId, workbookId, chapterId, topicId, subtopicId } = useParams()
  const navigate = useNavigate()

  // Determine item type and context
  const location = window.location.pathname
  const isWorkbook = location.includes("/ai-workbook/")
  const effectiveBookId = isWorkbook ? workbookId : bookId

  let itemType = "book"
  let itemId = effectiveBookId
  if (subtopicId) {
    itemType = "subtopic"
    itemId = subtopicId
  } else if (topicId) {
    itemType = "topic"
    itemId = topicId
  } else if (chapterId) {
    itemType = "chapter"
    itemId = chapterId
  }

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const token = Cookies.get("usertoken")
        if (!token) {
          navigate("/login")
          return
        }

        // Use the new endpoints for videos, PYQs, subjective questions, and objective questions
        const videosEndpoint = `http://localhost:5000/api/video-assets/${itemType}/${itemId}/videos?isWorkbook=${isWorkbook}`
        const pyqsEndpoint = `http://localhost:5000/api/pyq-assets/${itemType}/${itemId}/pyqs?isWorkbook=${isWorkbook}`
        const subjectiveEndpoint = `http://localhost:5000/api/subjective-assets/${itemType}/${itemId}/question-sets?isWorkbook=${isWorkbook}`
        const objectiveEndpoint = `http://localhost:5000/api/objective-assets/${itemType}/${itemId}/question-sets?isWorkbook=${isWorkbook}`

        // Determine endpoint based on item type for summaries
        let baseEndpoint = ""
        if (itemType === "book") {
          baseEndpoint = isWorkbook
            ? `http://localhost:5000/api/workbooks/${workbookId}`
            : `http://localhost:5000/api/assets/${bookId}`
        } else if (itemType === "chapter") {
          baseEndpoint = isWorkbook
            ? `http://localhost:5000/api/workbooks/${workbookId}/chapters/${chapterId}`
            : `http://localhost:5000/api/assets/${bookId}/chapters/${chapterId}`
        } else if (itemType === "topic") {
          baseEndpoint = isWorkbook
            ? `http://localhost:5000/api/workbooks/${workbookId}/chapters/${chapterId}/topics/${topicId}`
            : `http://localhost:5000/api/assets/${bookId}/chapters/${chapterId}/topics/${topicId}`
        } else if (itemType === "subtopic") {
          baseEndpoint = isWorkbook
            ? `http://localhost:5000/api/workbooks/${workbookId}/chapters/${chapterId}/topics/${topicId}/subtopics/${subtopicId}`
            : `http://localhost:5000/api/assets/${bookId}/chapters/${chapterId}/topics/${topicId}/subtopics/${subtopicId}`
        }

        // Fetch all assets in parallel
        const [summariesRes, objectiveRes, subjectiveRes, videosRes, pyqsRes] = await Promise.all([
          axios.get(`${baseEndpoint}/summaries`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(objectiveEndpoint, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(subjectiveEndpoint, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(videosEndpoint, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(pyqsEndpoint, { headers: { Authorization: `Bearer ${token}` } }),
        ])

        setSummaries(summariesRes.data)
        setObjectiveSets(objectiveRes.data.questionSets || objectiveRes.data)
        setSubjectiveSets(subjectiveRes.data.questionSets || subjectiveRes.data)
        setVideos(videosRes.data.videos || videosRes.data)
        setPYQs(pyqsRes.data.pyqs || pyqsRes.data)
      } catch (error) {
        console.error("Error fetching assets:", error)
        toast.error("Failed to load assets")
      }
    }

    fetchAssets()
  }, [bookId, workbookId, chapterId, topicId, subtopicId, itemType, itemId, isWorkbook, navigate])

  useEffect(() => {
    const fetchItemDetails = async () => {
      setLoading(true)
      try {
        const token = Cookies.get("usertoken")
        if (!token) {
          setError("Authentication required")
          navigate("/login")
          return
        }

        // Determine endpoint based on item type and context
        let endpoint

        if (itemType === "book") {
          endpoint = isWorkbook
            ? `http://localhost:5000/api/assets/${workbookId}`
            : `http://localhost:5000/api/assets/${bookId}`
        } else if (itemType === "chapter") {
          endpoint = isWorkbook
            ? `http://localhost:5000/api/assets/${workbookId}/chapters/${chapterId}`
            : `http://localhost:5000/api/assets/${bookId}/chapters/${chapterId}`
        } else if (itemType === "topic") {
          endpoint = isWorkbook
            ? `http://localhost:5000/api/assets/${workbookId}/chapters/${chapterId}/topics/${topicId}`
            : `http://localhost:5000/api/assets/${bookId}/chapters/${chapterId}/topics/${topicId}`
        } else if (itemType === "subtopic") {
          endpoint = isWorkbook
            ? `http://localhost:5000/api/assets/${workbookId}/chapters/${chapterId}/topics/${topicId}/subtopics/${subtopicId}`
            : `http://localhost:5000/api/assets/${bookId}/chapters/${chapterId}/topics/${topicId}/subtopics/${subtopicId}`
        }

        const response = await fetch(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch ${itemType} details`)
        }

        const data = await response.json()

        if (data.success) {
          // Extract the item based on type
          if (itemType === "book") {
            setItem(data.book || data.workbook)
          } else if (itemType === "chapter") {
            setItem(data.chapter)
          } else if (itemType === "topic") {
            setItem(data.topic)
          } else if (itemType === "subtopic") {
            setItem(data.subtopic)
          }
        } else {
          throw new Error(data.message || `Failed to fetch ${itemType} details`)
        }
      } catch (error) {
        console.error(`Error fetching ${itemType} details:`, error)
        setError(error.message || "Failed to connect to the server")
      } finally {
        setLoading(false)
      }
    }

    fetchItemDetails()
  }, [bookId, workbookId, chapterId, topicId, subtopicId, navigate, itemType, isWorkbook])

  const handleBackClick = () => {
    // Navigate back based on item type and context
    if (itemType === "book") {
      isWorkbook ? navigate(`/ai-workbook/${workbookId}`) : navigate(`/ai-books/${bookId}`)
    } else if (itemType === "chapter") {
      isWorkbook
        ? navigate(`/ai-workbook/${workbookId}/chapters/${chapterId}`)
        : navigate(`/ai-books/${bookId}/chapters/${chapterId}`)
    } else if (itemType === "topic") {
      isWorkbook
        ? navigate(`/ai-workbook/${workbookId}/chapters/${chapterId}/topics/${topicId}`)
        : navigate(`/ai-books/${bookId}/chapters/${chapterId}/topics/${topicId}`)
    } else if (itemType === "subtopic") {
      isWorkbook
        ? navigate(`/ai-workbook/${workbookId}/chapters/${chapterId}/topics/${topicId}/subtopics/${subtopicId}`)
        : navigate(`/ai-books/${bookId}/chapters/${chapterId}/topics/${topicId}/subtopics/${subtopicId}`)
    }
  }

  const getCompleteImageUrl = (imageUrl) => {
    if (!imageUrl) return null

    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      return imageUrl
    }

    return `http://localhost:5000/${imageUrl}`
  }

  const handleImageError = () => {
    setImageError(true)
  }

  // Handle questions submitted from isolated modal
  const handleIsolatedSubjectiveSubmit = async (questions, currentSet) => {
    if (!currentSet) {
      toast.error("No question set selected")
      return
    }

    try {
      // Refetch the updated question sets after successful submission
      const token = Cookies.get("usertoken")
      const subjectiveEndpoint = `http://localhost:5000/api/subjective-assets/${itemType}/${itemId}/question-sets?isWorkbook=${isWorkbook}`
      
      const response = await axios.get(subjectiveEndpoint, { 
        headers: { Authorization: `Bearer ${token}` } 
      })
      
      setSubjectiveSets(response.data.questionSets || response.data)
      
      // If we're currently viewing a set, update it as well
      if (selectedViewSet && selectedViewSet._id === currentSet._id) {
        const updatedSet = (response.data.questionSets || response.data).find(set => set._id === currentSet._id)
        if (updatedSet) {
          setSelectedViewSet(updatedSet)
        }
      }
    } catch (error) {
      console.error("Error refreshing question sets:", error)
    }
  }

  // Handle questions submitted from isolated objective modal
  const handleIsolatedObjectiveSubmit = async (questions, currentSet) => {
    if (!currentSet) {
      toast.error("No question set selected")
      return
    }

    try {
      // Refetch the updated question sets after successful submission
      const token = Cookies.get("usertoken")
      const objectiveEndpoint = `http://localhost:5000/api/objective-assets/${itemType}/${itemId}/question-sets?isWorkbook=${isWorkbook}`
      
      const response = await axios.get(objectiveEndpoint, { 
        headers: { Authorization: `Bearer ${token}` } 
      })
      
      setObjectiveSets(response.data.questionSets || response.data)
      
      // If we're currently viewing a set, update it as well
      if (selectedObjectiveSet && selectedObjectiveSet._id === currentSet._id) {
        const updatedSet = (response.data.questionSets || response.data).find(set => set._id === currentSet._id)
        if (updatedSet) {
          setSelectedObjectiveSet(updatedSet)
        }
      }
    } catch (error) {
      console.error("Error refreshing objective question sets:", error)
    }
  }

  // Handle delete question
  const handleDeleteQuestion = async () => {
    if (!deletingQuestion) return

    try {
      const token = Cookies.get("usertoken")
      const endpoint = `http://localhost:5000/api/subjective-assets/questions/${deletingQuestion._id}`

      await axios.delete(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      })

      // Refetch the question sets to update the UI
      const subjectiveEndpoint = `http://localhost:5000/api/subjective-assets/${itemType}/${itemId}/question-sets?isWorkbook=${isWorkbook}`
      const response = await axios.get(subjectiveEndpoint, { 
        headers: { Authorization: `Bearer ${token}` } 
      })
      
      setSubjectiveSets(response.data.questionSets || response.data)
      
      // Update the selected view set if it's currently being viewed
      if (selectedViewSet) {
        const updatedSet = (response.data.questionSets || response.data).find(set => set._id === selectedViewSet._id)
        if (updatedSet) {
          setSelectedViewSet(updatedSet)
        }
      }

      toast.success("Question deleted successfully")
    } catch (error) {
      console.error("Error deleting question:", error)
      toast.error("Failed to delete question")
    } finally {
      setDeletingQuestion(null)
      setShowDeleteConfirmation(false)
    }
  }

  // Function to handle viewing all questions in a set
  const handleViewAllQuestions = (set) => {
    setSelectedViewSet(set)
  }

  // Function to handle viewing all objective questions in a set
  const handleViewAllObjectiveQuestions = (set) => {
    setSelectedObjectiveSet(set)
  }

  // Handle delete objective question
  const handleDeleteObjectiveQuestion = async () => {
    if (!deletingObjectiveQuestion) return

    try {
      const token = Cookies.get("usertoken")
      const endpoint = `http://localhost:5000/api/objective-assets/questions/${deletingObjectiveQuestion._id}`

      await axios.delete(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      })

      // Refetch the question sets to update the UI
      const objectiveEndpoint = `http://localhost:5000/api/objective-assets/${itemType}/${itemId}/question-sets?isWorkbook=${isWorkbook}`
      const response = await axios.get(objectiveEndpoint, { 
        headers: { Authorization: `Bearer ${token}` } 
      })
      
      setObjectiveSets(response.data.questionSets || response.data)
      
      // Update the selected objective set if it's currently being viewed
      if (selectedObjectiveSet) {
        const updatedSet = (response.data.questionSets || response.data).find(set => set._id === selectedObjectiveSet._id)
        if (updatedSet) {
          setSelectedObjectiveSet(updatedSet)
        }
      }

      toast.success("Objective question deleted successfully")
    } catch (error) {
      console.error("Error deleting objective question:", error)
      toast.error("Failed to delete objective question")
    } finally {
      setDeletingObjectiveQuestion(null)
      setShowDeleteConfirmation(false)
    }
  }

  // Handle video deletion
  const handleDeleteVideo = async (videoId) => {
    try {
      const token = Cookies.get("usertoken")
      const endpoint = `http://localhost:5000/api/video-assets/videos/${videoId}`

      await axios.delete(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      })

      // Update state to remove the deleted video
      setVideos((prev) => prev.filter((video) => video._id !== videoId))
      toast.success("Video deleted successfully")
    } catch (error) {
      console.error("Error deleting video:", error)
      toast.error("Failed to delete video")
    }
  }

  // Handle PYQ deletion
  const handleDeletePYQ = async (pyqId) => {
    try {
      const token = Cookies.get("usertoken")
      const endpoint = `http://localhost:5000/api/pyq-assets/pyqs/${pyqId}`

      await axios.delete(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      })

      // Update state to remove the deleted PYQ
      setPYQs((prev) => prev.filter((pyq) => pyq._id !== pyqId))
      toast.success("PYQ deleted successfully")
    } catch (error) {
      console.error("Error deleting PYQ:", error)
      toast.error("Failed to delete PYQ")
    }
  }

  const renderTabContent = () => {
    // Return content for each tab
    switch (activeTab) {
      case "summary":
        return <SummaryTab summaries={summaries} setShowSummaryModal={setShowSummaryModal} />

      case "videos":
        return <VideosTab videos={videos} setShowVideoModal={setShowVideoModal} onDeleteVideo={handleDeleteVideo} />

      case "pyqs":
        return <PYQsTab pyqs={pyqs} setShowPYQModal={setShowPYQModal} onDeletePYQ={handleDeletePYQ} />

      case "subjective":
        return (
          <SubjectiveTab
            selectedViewSet={selectedViewSet}
            setSelectedViewSet={setSelectedViewSet}
            questionSets={subjectiveSets}
            activeLevelTab={activeLevelTab}
            setActiveLevelTab={setActiveLevelTab}
            setShowCreateSetModal={setShowCreateSetModal}
            setCurrentSet={setCurrentSet}
            setEditingQuestion={setEditingQuestion}
            setShowSubjectiveModal={setShowSubjectiveModal}
            setDeletingQuestion={setDeletingQuestion}
            setShowDeleteConfirmation={setShowDeleteConfirmation}
            handleViewAllQuestions={handleViewAllQuestions}
          />
        )

      case "objective":
        return (
          <ObjectiveTab
            selectedObjectiveSet={selectedObjectiveSet}
            setSelectedObjectiveSet={setSelectedObjectiveSet}
            objectiveQuestionSets={objectiveSets}
            activeObjectiveLevelTab={activeObjectiveLevelTab}
            setActiveObjectiveLevelTab={setActiveObjectiveLevelTab}
            setShowCreateObjectiveSetModal={setShowCreateObjectiveSetModal}
            setCurrentObjectiveSet={setCurrentObjectiveSet}
            setEditingObjectiveQuestion={setEditingObjectiveQuestion}
            setShowObjectiveModal={setShowObjectiveModal}
            setDeletingObjectiveQuestion={setDeletingObjectiveQuestion}
            setShowDeleteConfirmation={setShowDeleteConfirmation}
            handleViewAllObjectiveQuestions={handleViewAllObjectiveQuestions}
          />
        )

      // Add other tabs as needed
      default:
        return null
    }
  }

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
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-medium text-red-800">Error</h3>
          <p className="text-red-700">{error}</p>
          <button onClick={handleBackClick} className="mt-3 text-red-600 hover:text-red-800 flex items-center">
            <ArrowLeft size={16} className="mr-1" />
            <span>Go back</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handleBackClick}
          className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          <ArrowLeft size={18} className="mr-1" />
          <span>
            Back to{" "}
            {itemType === "book"
              ? "Book"
              : itemType === "chapter"
                ? "Chapter"
                : itemType === "topic"
                  ? "Topic"
                  : "Sub-Topic"}
          </span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Only show image for books */}
          {itemType === "book" && (
            <div className="md:w-1/4 lg:w-1/5">
              <div className="bg-gradient-to-br from-indigo-50 to-blue-100 rounded-lg h-48 flex items-center justify-center overflow-hidden">
                {item?.coverImage && !imageError ? (
                  <img
                    src={getCompleteImageUrl(item.coverImage) || "/placeholder.svg"}
                    alt={item.title}
                    className="h-full w-full object-cover rounded-lg"
                    onError={handleImageError}
                  />
                ) : (
                  <div className="text-center">
                    <Book size={64} className="mx-auto text-indigo-400" />
                  </div>
                )}
              </div>
            </div>
          )}

          <div className={itemType === "book" ? "md:w-3/4 lg:w-4/5" : "w-full"}>
            <div className="mb-4">
              <div className="flex flex-col items-start">
                <div className="mb-2 px-3 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 rounded-md flex items-center">
                  {itemType === "book" ? (
                    <>
                      <Book size={18} className="mr-2" /> Book Assets
                    </>
                  ) : itemType === "chapter" ? (
                    <>
                      <FileText size={18} className="mr-2" /> Chapter Assets
                    </>
                  ) : itemType === "topic" ? (
                    <>
                      <List size={18} className="mr-2" /> Topic Assets
                    </>
                  ) : (
                    <>
                      <BookOpen size={18} className="mr-2" /> Sub-Topic Assets
                    </>
                  )}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">{item?.title}</h1>
                </div>
              </div>
              <p className="text-gray-700 mt-2">{item?.description || "No description available"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex border-b border-gray-200">
          <button
            className={`py-3 px-6 font-medium text-sm ${activeTab === "summary" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-gray-600 hover:text-gray-800"}`}
            onClick={() => setActiveTab("summary")}
          >
            Summary
          </button>
          <button
            className={`py-3 px-6 font-medium text-sm ${activeTab === "objective" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-gray-600 hover:text-gray-800"}`}
            onClick={() => setActiveTab("objective")}
          >
            Objective
          </button>
          <button
            className={`py-3 px-6 font-medium text-sm ${activeTab === "subjective" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-gray-600 hover:text-gray-800"}`}
            onClick={() => setActiveTab("subjective")}
          >
            Subjective
          </button>
          <button
            className={`py-3 px-6 font-medium text-sm ${activeTab === "videos" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-gray-600 hover:text-gray-800"}`}
            onClick={() => setActiveTab("videos")}
          >
            Videos
          </button>
          <button
            className={`py-3 px-6 font-medium text-sm ${activeTab === "pyqs" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-gray-600 hover:text-gray-800"}`}
            onClick={() => setActiveTab("pyqs")}
          >
            PYQ's
          </button>

          <div className="flex-1"></div>
          <button
            onClick={() => setShowGenerateAssetsModal(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors ml-4"
          >
            <Plus size={18} className="mr-2" />
            Generate Assets
          </button>
        </div>

        <div className="mt-6">{renderTabContent()}</div>
      </div>

      {/* Modals */}
      <SummaryModal
        showSummaryModal={showSummaryModal}
        setShowSummaryModal={setShowSummaryModal}
        summaryData={summaryData}
        setSummaryData={setSummaryData}
        summaries={summaries}
        setSummaries={setSummaries}
        itemType={itemType}
        isWorkbook={isWorkbook}
        bookId={bookId}
        workbookId={workbookId}
        chapterId={chapterId}
        topicId={topicId}
        subtopicId={subtopicId}
      />

      <IsolatedObjectiveModal
        isOpen={showObjectiveModal}
        onClose={() => {
          setShowObjectiveModal(false)
          setEditingObjectiveQuestion(null)
        }}
        onSubmit={handleIsolatedObjectiveSubmit}
        initialQuestion={editingObjectiveQuestion}
        currentSet={currentObjectiveSet}
      />

      <IsolatedSubjectiveModal
        isOpen={showSubjectiveModal}
        onClose={() => {
          setShowSubjectiveModal(false)
          setEditingQuestion(null)
        }}
        onSubmit={handleIsolatedSubjectiveSubmit}
        initialQuestion={editingQuestion}
        currentSet={currentSet}
      />

      <VideoModal
        showVideoModal={showVideoModal}
        setShowVideoModal={setShowVideoModal}
        videoData={videoData}
        setVideoData={setVideoData}
        videos={videos}
        setVideos={setVideos}
        itemType={itemType}
        itemId={itemId}
        isWorkbook={isWorkbook}
        bookId={bookId}
        workbookId={workbookId}
        chapterId={chapterId}
        topicId={topicId}
        subtopicId={subtopicId}
      />

      <PYQModal
        showPYQModal={showPYQModal}
        setShowPYQModal={setShowPYQModal}
        pyqData={pyqData}
        setPYQData={setPYQData}
        pyqs={pyqs}
        setPYQs={setPYQs}
        itemType={itemType}
        itemId={itemId}
        isWorkbook={isWorkbook}
        bookId={bookId}
        workbookId={workbookId}
        chapterId={chapterId}
        topicId={topicId}
        subtopicId={subtopicId}
      />

      <DeleteConfirmationModal
        showDeleteConfirmation={showDeleteConfirmation}
        setShowDeleteConfirmation={setShowDeleteConfirmation}
        deletingQuestion={deletingQuestion}
        setDeletingQuestion={setDeletingQuestion}
        deletingObjectiveQuestion={deletingObjectiveQuestion}
        setDeletingObjectiveQuestion={setDeletingObjectiveQuestion}
        handleDeleteQuestion={handleDeleteQuestion}
        handleDeleteObjectiveQuestion={handleDeleteObjectiveQuestion}
      />

      <CreateSetModal
        showCreateSetModal={showCreateSetModal}
        setShowCreateSetModal={setShowCreateSetModal}
        activeLevelTab={activeLevelTab}
        subjectiveSets={subjectiveSets}
        setSubjectiveSets={setSubjectiveSets}
        itemType={itemType}
        isWorkbook={isWorkbook}
        bookId={bookId}
        workbookId={workbookId}
        chapterId={chapterId}
        topicId={topicId}
        subtopicId={subtopicId}
      />

      <CreateObjectiveSetModal
        showCreateObjectiveSetModal={showCreateObjectiveSetModal}
        setShowCreateObjectiveSetModal={setShowCreateObjectiveSetModal}
        activeObjectiveLevelTab={activeObjectiveLevelTab}
        objectiveSets={objectiveSets}
        setObjectiveSets={setObjectiveSets}
        itemType={itemType}
        isWorkbook={isWorkbook}
        bookId={bookId}
        workbookId={workbookId}
        chapterId={chapterId}
        topicId={topicId}
        subtopicId={subtopicId}
      />

      <GenerateAssetsModal
        isOpen={showGenerateAssetsModal}
        onClose={() => setShowGenerateAssetsModal(false)}
        itemType={itemType}
        itemId={itemId}
        isWorkbook={isWorkbook}
        bookId={bookId}
        workbookId={workbookId}
        chapterId={chapterId}
        topicId={topicId}
        subtopicId={subtopicId}
        item={item}
      />
    </div>
  )
}

export default AssetView
