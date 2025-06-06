
import { useState, useEffect } from "react"
import { X, FileText, Check, Loader2, Edit2 } from "lucide-react"
import { toast } from "react-toastify"
import { generateEducationalContent } from "../../../../utils/gemini"
import Cookies from "js-cookie"

const GenerateAssetsModal = ({ isOpen, onClose, itemType, itemId, isWorkbook, bookId, workbookId, chapterId, topicId, subtopicId, item }) => {
  const [loading, setLoading] = useState(false)
  const [availableData, setAvailableData] = useState([])
  const [selectedData, setSelectedData] = useState([])
  const [generatedContent, setGeneratedContent] = useState(null)
  const [dataSourceType, setDataSourceType] = useState(null) // 'with' or 'without'
  const [systemPrompt, setSystemPrompt] = useState("")
  const [isEditingPrompt, setIsEditingPrompt] = useState(false)
  const [config, setConfig] = useState({
    objective: {
      L1: { sets: 2, questionsPerSet: 5, setNames: ["Set 1", "Set 2"] },
      L2: { sets: 2, questionsPerSet: 5, setNames: ["Set 1", "Set 2"] },
      L3: { sets: 2, questionsPerSet: 5, setNames: ["Set 1", "Set 2"] }
    },
    subjective: {
      L1: { sets: 2, questionsPerSet: 5, setNames: ["Set 1", "Set 2"] },
      L2: { sets: 2, questionsPerSet: 5, setNames: ["Set 1", "Set 2"] },
      L3: { sets: 2, questionsPerSet: 5, setNames: ["Set 1", "Set 2"] }
    }
  })
  const [saveProgress, setSaveProgress] = useState({
    total: 0,
    current: 0,
    status: ''
  })

  useEffect(() => {
    if (isOpen) {
      fetchAvailableData()
      generateDefaultPrompt()
    }
  }, [isOpen, itemType, item])

  const getItemTitle = () => {
    if (itemType === "book") return "Book"
    if (itemType === "chapter") return "Chapter"
    if (itemType === "topic") return "Topic"
    return "Sub-Topic"
  }

  const generateDefaultPrompt = () => {
    const itemTitle = item?.title || getItemTitle().toLowerCase()
    const basePrompt = `Generate educational content for ${getItemTitle().toLowerCase()} "${itemTitle}". `
    const contextPrompt = `This content should be comprehensive and suitable for students. `
    setSystemPrompt(basePrompt + contextPrompt)
  }

  const fetchAvailableData = async () => {
    try {
      const token = Cookies.get('usertoken')
      if (!token) {
        toast.error("Authentication required")
        return
      }

      const baseUrl = process.env.REACT_APP_API_URL || 'https://aipbbackend-c5ed.onrender.com/api'
      let endpoint = ''
      
      if (itemType === 'book') {
        endpoint = `${baseUrl}/datastores/book/${itemId}`
      } else if (itemType === 'chapter') {
        endpoint = `${baseUrl}/datastores/chapter/${itemId}`
      } else if (itemType === 'topic') {
        endpoint = `${baseUrl}/datastores/topic/${itemId}`
      } else if (itemType === 'subtopic') {
        endpoint = `${baseUrl}/datastores/subtopic/${itemId}`
      }

      if (!endpoint) {
        toast.error("Invalid item type")
        return
      }

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.message || 'Failed to fetch data')
      }

      const data = await response.json()
      if (data.success) {
        setAvailableData(data.items || [])
      } else {
        throw new Error(data.message || 'Failed to fetch data')
      }
    } catch (error) {
      console.error("Error fetching available data:", error)
      toast.error(error.message || "Failed to fetch available data")
    }
  }

  const handleDataSelect = (dataId) => {
    setSelectedData(prev => {
      if (prev.includes(dataId)) {
        return prev.filter(id => id !== dataId)
      }
      return [...prev, dataId]
    })
  }

  const handleConfigChange = (type, level, field, value) => {
    setConfig(prev => {
      const newConfig = {
        ...prev,
        [type]: {
          ...prev[type],
          [level]: {
            ...prev[type][level],
            [field]: field === 'sets' ? parseInt(value) || 0 : value
          }
        }
      }

      // Update set names array when number of sets changes
      if (field === 'sets') {
        const numSets = parseInt(value) || 0
        const currentSetNames = newConfig[type][level].setNames || []
        const newSetNames = Array(numSets).fill('').map((_, index) => 
          currentSetNames[index] || `Set ${index + 1}`
        )
        newConfig[type][level].setNames = newSetNames
      }

      return newConfig
    })
  }

  const handleSetNameChange = (type, level, index, value) => {
    setConfig(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [level]: {
          ...prev[type][level],
          setNames: prev[type][level].setNames.map((name, i) => 
            i === index ? value : name
          )
        }
      }
    }))
  }

  const handleGenerate = async () => {
    if (dataSourceType === 'with' && selectedData.length === 0) {
      toast.error("Please select at least one data source")
      return
    }

    setLoading(true)
    try {
      // Get selected data details
      const selectedDataDetails = availableData.filter(data => selectedData.includes(data._id))
      
      const content = await generateEducationalContent(
        itemType,
        item?.title || getItemTitle().toLowerCase(),
        config,
        dataSourceType,
        selectedDataDetails // Pass the full data objects instead of just IDs
      )
      setGeneratedContent(content)
      toast.success("Content generated successfully")
    } catch (error) {
      console.error("Error generating content:", error)
      toast.error("Failed to generate content. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      const token = Cookies.get('usertoken')

      if (!generatedContent || !generatedContent.raw) {
        toast.error("No content to save")
        return
      }

      const content = generatedContent.raw
      const baseUrl = process.env.REACT_APP_API_URL || 'https://aipbbackend-c5ed.onrender.com/api'

      // Calculate total items to save
      let totalItems = 0
      if (content.summary) totalItems++
      if (content.objective) {
        Object.values(content.objective).forEach(level => {
          level.forEach(set => {
            totalItems += set.questions.length
          })
        })
      }
      if (content.subjective) {
        Object.values(content.subjective).forEach(level => {
          level.forEach(set => {
            totalItems += set.questions.length
          })
        })
      }

      setSaveProgress({
        total: totalItems,
        current: 0,
        status: 'Starting to save content...'
      })

      // Save summary
      if (content.summary) {
        try {
          setSaveProgress(prev => ({
            ...prev,
            status: 'Saving summary...'
          }))

          let endpoint = ''
          // Determine endpoint based on item type
          if (itemType === 'book') {
            endpoint = isWorkbook
              ? `${baseUrl}/assets/${workbookId}/summaries`
              : `${baseUrl}/assets/${bookId}/summaries`
          } else if (itemType === 'chapter') {
            endpoint = isWorkbook
              ? `${baseUrl}/assets/${workbookId}/chapters/${chapterId}/summaries`
              : `${baseUrl}/assets/${bookId}/chapters/${chapterId}/summaries`
          } else if (itemType === 'topic') {
            endpoint = isWorkbook
              ? `${baseUrl}/assets/${workbookId}/chapters/${chapterId}/topics/${topicId}/summaries`
              : `${baseUrl}/assets/${bookId}/chapters/${chapterId}/topics/${topicId}/summaries`
          } else if (itemType === 'subtopic') {
            endpoint = isWorkbook
              ? `${baseUrl}/assets/${workbookId}/chapters/${chapterId}/topics/${topicId}/subtopics/${subtopicId}/summaries`
              : `${baseUrl}/assets/${bookId}/chapters/${chapterId}/topics/${topicId}/subtopics/${subtopicId}/summaries`
          }

          const summaryResponse = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              content: content.summary,
              isWorkbook
            })
          })

          if (!summaryResponse.ok) {
            throw new Error(`Failed to save summary: ${summaryResponse.statusText}`)
          }

          const summaryData = await summaryResponse.json()
          if (!summaryData.success) {
            throw new Error(summaryData.message || 'Failed to save summary')
          }

          setSaveProgress(prev => ({
            ...prev,
            current: prev.current + 1,
            status: 'Summary saved successfully'
          }))
        } catch (error) {
          console.error('Error saving summary:', error)
          toast.error('Failed to save summary')
        }
      }

      // Save objective questions
      if (content.objective) {
        for (const level of ['L1', 'L2', 'L3']) {
          if (content.objective[level] && Array.isArray(content.objective[level])) {
            for (const set of content.objective[level]) {
              try {
                setSaveProgress(prev => ({
                  ...prev,
                  status: `Saving objective set ${set.setName} for level ${level}...`
                }))

                // First create the question set
                const setResponse = await fetch(`${baseUrl}/objective-assets/${itemType}/${itemId}/question-sets`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({
                    name: set.setName,
                    level,
                    type: 'objective',
                    isWorkbook
                  })
                })

                if (!setResponse.ok) {
                  throw new Error(`Failed to save objective set: ${setResponse.statusText}`)
                }

                const setData = await setResponse.json()
                if (!setData.success) {
                  throw new Error(setData.message || 'Failed to save objective set')
                }

                // Then add questions to the set
                if (set.questions && Array.isArray(set.questions)) {
                  const questionsToCreate = set.questions.map(q => ({
                    question: q.question,
                    options: q.options,
                    correctAnswer: q.correctAnswer,
                    difficulty: level
                  }))

                  const questionsResponse = await fetch(`${baseUrl}/objective-assets/question-sets/${setData.questionSet._id}/questions`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                      questions: questionsToCreate
                    })
                  })

                  if (!questionsResponse.ok) {
                    throw new Error(`Failed to save objective questions: ${questionsResponse.statusText}`)
                  }

                  const questionsData = await questionsResponse.json()
                  if (!questionsData.success) {
                    throw new Error(questionsData.message || 'Failed to save objective questions')
                  }

                  setSaveProgress(prev => ({
                    ...prev,
                    current: prev.current + questionsToCreate.length
                  }))
                }
              } catch (error) {
                console.error('Error saving objective questions:', error)
                toast.error(`Failed to save objective questions for level ${level}`)
              }
            }
          }
        }
      }

      // Save subjective questions
      if (content.subjective) {
        for (const level of ['L1', 'L2', 'L3']) {
          if (content.subjective[level] && Array.isArray(content.subjective[level])) {
            for (const set of content.subjective[level]) {
              try {
                setSaveProgress(prev => ({
                  ...prev,
                  status: `Saving subjective set ${set.setName} for level ${level}...`
                }))

                // First create the question set
                const setResponse = await fetch(`${baseUrl}/subjective-assets/${itemType}/${itemId}/question-sets`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({
                    name: set.setName,
                    level,
                    type: 'subjective',
                    isWorkbook
                  })
                })

                if (!setResponse.ok) {
                  throw new Error(`Failed to save subjective set: ${setResponse.statusText}`)
                }

                const setData = await setResponse.json()
                if (!setData.success) {
                  throw new Error(setData.message || 'Failed to save subjective set')
                }

                // Then add questions to the set
                if (set.questions && Array.isArray(set.questions)) {
                  const questionsToCreate = set.questions.map(q => ({
                    question: q.question,
                    answer: q.answer,
                    keywords: q.keywords || (q.keyPoints ? q.keyPoints.join(', ') : ''),
                    difficulty: level
                  }))

                  const questionsResponse = await fetch(`${baseUrl}/subjective-assets/question-sets/${setData.questionSet._id}/questions`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                      questions: questionsToCreate
                    })
                  })

                  if (!questionsResponse.ok) {
                    throw new Error(`Failed to save subjective questions: ${questionsResponse.statusText}`)
                  }

                  const questionsData = await questionsResponse.json()
                  if (!questionsData.success) {
                    throw new Error(questionsData.message || 'Failed to save subjective questions')
                  }

                  setSaveProgress(prev => ({
                    ...prev,
                    current: prev.current + questionsToCreate.length
                  }))
                }
              } catch (error) {
                console.error('Error saving subjective questions:', error)
                toast.error(`Failed to save subjective questions for level ${level}`)
              }
            }
          }
        }
      }

      setSaveProgress(prev => ({
        ...prev,
        status: 'All content saved successfully!'
      }))
      toast.success("Assets saved successfully")
      onClose()
    } catch (error) {
      console.error("Error saving content:", error)
      toast.error("Failed to save assets")
    } finally {
      setLoading(false)
      setSaveProgress({
        total: 0,
        current: 0,
        status: ''
      })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Generate Assets</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Data Source Selection */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Data Source</h3>
          <div className="flex space-x-4">
            <button
              className={`px-4 py-2 rounded-md ${
                dataSourceType === 'with'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setDataSourceType('with')}
            >
              Generate with Data
            </button>
            <button
              className={`px-4 py-2 rounded-md ${
                dataSourceType === 'without'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setDataSourceType('without')}
            >
              Generate without Data
            </button>
          </div>

          {dataSourceType === 'with' && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Select Data Sources</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableData.map((data) => (
                  <div
                    key={data._id}
                    className={`p-4 border rounded-lg cursor-pointer ${
                      selectedData.includes(data._id)
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300'
                    }`}
                    onClick={() => handleDataSelect(data._id)}
                  >
                    <div className="flex items-start">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 mt-1 ${
                        selectedData.includes(data._id)
                          ? 'border-indigo-500 bg-indigo-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedData.includes(data._id) && (
                          <Check size={14} className="text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium text-gray-800">{data.name}</h5>
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                            {data.fileType.split('/')[1]?.toUpperCase() || data.itemType}
                          </span>
                        </div>
                        {data.description && (
                          <p className="text-sm text-gray-600 mt-1">{data.description}</p>
                        )}
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <FileText size={14} className="mr-1" />
                          <span>{new Date(data.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {availableData.length === 0 && (
                  <div className="col-span-2 text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No data sources available</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* System Prompt */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-700">System Prompt</h3>
            <button
              onClick={() => setIsEditingPrompt(!isEditingPrompt)}
              className="text-indigo-600 hover:text-indigo-800 flex items-center"
            >
              <Edit2 size={18} className="mr-1" />
              {isEditingPrompt ? "Done Editing" : "Edit Prompt"}
            </button>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            {isEditingPrompt ? (
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="w-full h-32 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter system prompt..."
              />
            ) : (
              <p className="text-gray-800 whitespace-pre-wrap">{systemPrompt}</p>
            )}
          </div>
        </div>

        {/* Configuration */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Generation Configuration</h3>
          
          {/* Summary Section */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-800 mb-3">Summary</h4>
            <div className="p-4 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600">
                A comprehensive summary will be generated along with the questions.
              </p>
            </div>
          </div>

          {/* Objective Questions */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-800 mb-3">Objective Questions</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {["L1", "L2", "L3"].map(level => (
                <div key={level} className="p-4 border border-gray-200 rounded-lg">
                  <h5 className="font-medium text-gray-700 mb-3">
                    {level === "L1" ? "Beginner" : level === "L2" ? "Intermediate" : "Advanced"}
                  </h5>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Number of Sets</label>
                      <input
                        type="number"
                        min="0"
                        value={config.objective[level].sets}
                        onChange={(e) => handleConfigChange("objective", level, "sets", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Questions per Set</label>
                      <input
                        type="number"
                        min="0"
                        value={config.objective[level].questionsPerSet}
                        onChange={(e) => handleConfigChange("objective", level, "questionsPerSet", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Set Names</label>
                      <div className="space-y-2">
                        {config.objective[level].setNames.map((name, index) => (
                          <input
                            key={index}
                            type="text"
                            value={name}
                            onChange={(e) => handleSetNameChange("objective", level, index, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder={`Set ${index + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subjective Questions */}
          <div>
            <h4 className="font-medium text-gray-800 mb-3">Subjective Questions</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {["L1", "L2", "L3"].map(level => (
                <div key={level} className="p-4 border border-gray-200 rounded-lg">
                  <h5 className="font-medium text-gray-700 mb-3">
                    {level === "L1" ? "Beginner" : level === "L2" ? "Intermediate" : "Advanced"}
                  </h5>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Number of Sets</label>
                      <input
                        type="number"
                        min="0"
                        value={config.subjective[level].sets}
                        onChange={(e) => handleConfigChange("subjective", level, "sets", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Questions per Set</label>
                      <input
                        type="number"
                        min="0"
                        value={config.subjective[level].questionsPerSet}
                        onChange={(e) => handleConfigChange("subjective", level, "questionsPerSet", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Set Names</label>
                      <div className="space-y-2">
                        {config.subjective[level].setNames.map((name, index) => (
                          <input
                            key={index}
                            type="text"
                            value={name}
                            onChange={(e) => handleSetNameChange("subjective", level, index, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder={`Set ${index + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Preview Section */}
        {generatedContent && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Generated Content Preview</h3>
            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700">
                {generatedContent.formatted}
              </pre>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin mr-2" size={20} />
                Generating...
              </>
            ) : (
              <>
                <FileText className="mr-2" size={20} />
                Generate Content
              </>
            )}
          </button>
          {generatedContent && (
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={20} />
                  {saveProgress.total > 0 ? (
                    <span>
                      Saving... ({saveProgress.current}/{saveProgress.total})
                    </span>
                  ) : (
                    'Saving...'
                  )}
                </>
              ) : (
                <>
                  <Check className="mr-2" size={20} />
                  Save Content
                </>
              )}
            </button>
          )}
        </div>

        {/* Save Progress */}
        {loading && saveProgress.total > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">{saveProgress.status}</span>
              <span className="text-sm text-gray-600">
                {saveProgress.current}/{saveProgress.total}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(saveProgress.current / saveProgress.total) * 100}%`
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default GenerateAssetsModal 
