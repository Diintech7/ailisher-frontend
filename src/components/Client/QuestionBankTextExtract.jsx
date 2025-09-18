import React, { useState, useRef, useEffect, useMemo } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import { API_BASE_URL } from '../../config'
import { ArrowLeft } from 'lucide-react'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Cookies from 'js-cookie'

// Configure PDF.js worker (no default export available from the worker module)
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()

const QuestionBankText = ({ onBack, questionBankId }) => {
  const [activeTab, setActiveTab] = useState('') // splitter | extract | generated
  const [selectedFile, setSelectedFile] = useState(null)
  const [showPdfSplitter, setShowPdfSplitter] = useState(false)
  const [extractedText, setExtractedText] = useState('')
  const [extractError, setExtractError] = useState('')
  const [isExtracting, setIsExtracting] = useState(false)
  
  // Clean text states
  const [isCleaning, setIsCleaning] = useState(false)
  const [cleanError, setCleanError] = useState('')
  const [parsedQuestions, setParsedQuestions] = useState([])
  const [streamingStatus, setStreamingStatus] = useState('')
  const [currentChunk, setCurrentChunk] = useState(0)
  const [totalChunks, setTotalChunks] = useState(0)
  const [newQuestionsCount, setNewQuestionsCount] = useState(0)
  const [success, setSuccess] = useState('')
  const [editError, setEditError] = useState('')
  const [editingIndex, setEditingIndex] = useState(null)
  const [editorMarkdown, setEditorMarkdown] = useState('')
  const [editFields, setEditFields] = useState({
    questionText: '',
    optionsText: '',
    correctLetter: '',
    difficulty: 'L1',
    subject: '',
    topicName: '',
    explanation: '',
    tagsText: ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const eventSourceRef = useRef(null)
  
  const fileInputRef = useRef(null)
  const [cleaningPage, setCleaningPage] = useState(null)

  // Memoized split of extracted text into pages using delimiters like "--- Page 1 ---"
  const extractedPages = useMemo(() => {
    if (!extractedText || typeof extractedText !== 'string') return []
    const pages = []
    const regex = /---\s*Page\s*(\d+)\s*---\s*/g
    let match
    let lastIndex = 0
    while ((match = regex.exec(extractedText)) !== null) {
      if (pages.length > 0) {
        pages[pages.length - 1].text = extractedText.slice(lastIndex, match.index).trim()
      }
      pages.push({ pageNumber: Number(match[1]), text: '' })
      lastIndex = regex.lastIndex
    }
    if (pages.length > 0) {
      pages[pages.length - 1].text = extractedText.slice(lastIndex).trim()
    }
    return pages.filter(p => p.text && p.text.length > 0)
  }, [extractedText])

  // Stream clean a single page and append results to existing parsedQuestions
  const fetchCleanedTextStreamAppend = async (rawText, sourceLabel = '', pageNumber = null) => {
    if (!rawText || !rawText.trim()) return;
    if (isCleaning) return; // prevent parallel calls

    setIsCleaning(true);
    setCleaningPage(pageNumber);
    setCleanError('');
    setStreamingStatus('');
    setCurrentChunk(0);
    setTotalChunks(0);

    // Close any existing connection
    closeEventSource();

    try {
      const response = await fetch(`${API_BASE_URL}/api/questionbank/clean-text-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extractedText: rawText })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              switch (data.type) {
                case 'status':
                  setStreamingStatus(data.message);
                  setTotalChunks(data.totalChunks || 0);
                  break;
                case 'chunk_start':
                  setCurrentChunk(data.chunkNumber || 0);
                  setStreamingStatus(data.message || 'Processing chunk...');
                  break;
                case 'chunk_complete':
                  if (data.questions && Array.isArray(data.questions)) {
                    setParsedQuestions(prev => {
                      const newQuestions = data.questions.map((q, idx) => ({
                        ...q,
                        questionNumber: prev.length + idx + 1,
                        isNew: true
                      }));
                      return [...prev, ...newQuestions];
                    });
                    setNewQuestionsCount(prev => prev + data.questions.length);
                    setTimeout(() => {
                      setParsedQuestions(prev => prev.map(q => ({ ...q, isNew: false })));
                    }, 2000);
                  }
                  setCurrentChunk(data.chunkNumber || 0);
                  setStreamingStatus(data.message || 'Chunk completed');
                  if ((data.chunkNumber || 0) >= (totalChunks || 0)) {
                    setTimeout(() => {
                      setIsCleaning(false);
                      setCleaningPage(null);
                      setStreamingStatus('');
                      setCurrentChunk(0);
                      setTotalChunks(0);
                    }, 500);
                  }
                  break;
                case 'complete':
                  setStreamingStatus('');
                  setSuccess(`Processed ${data.totalQuestions || ''} questions${sourceLabel ? ` from ${sourceLabel}` : ''}.`);
                  setIsCleaning(false);
                  setCleaningPage(null);
                  setCurrentChunk(0);
                  setTotalChunks(0);
                  setActiveTab('generated');
                  return;
                case 'chunk_error':
                  setStreamingStatus(`Error: ${data.message}`);
                  if (data.isRateLimit) {
                    setCleanError('Rate limit reached! Please wait and try again.');
                    setIsCleaning(false);
                    setCleaningPage(null);
                    return;
                  } else {
                    setCleanError(`Error: ${data.error}`);
                  }
                  break;
                case 'error':
                  setCleanError(data.message);
                  setIsCleaning(false);
                  setCleaningPage(null);
                  setStreamingStatus('');
                  setCurrentChunk(0);
                  setTotalChunks(0);
                  return;
              }
            } catch (parseError) {
              console.error('Error parsing SSE data (append):', parseError);
            }
          }
        }
      }
      setIsCleaning(false);
      setCleaningPage(null);
      setStreamingStatus('');
      setCurrentChunk(0);
      setTotalChunks(0);
    } catch (e) {
      console.error('Failed to clean text with streaming (append):', e);
      setCleanError('Failed to clean text. Check server/OpenRouter API key.');
      setIsCleaning(false);
      setCleaningPage(null);
      setStreamingStatus('');
      setCurrentChunk(0);
      setTotalChunks(0);
    }
  };

  // Cleanup EventSource on component unmount
  useEffect(() => {
    return () => {
      closeEventSource();
    };
  }, []);

  const closeEventSource = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  };

  // Convert question object to markdown for editing
  const questionToMarkdown = (q) => {
    const questionText = q?.questionText || q?.question || ''
    const options = Array.isArray(q?.options) ? q.options : []
    const correctLetter = typeof q?.correctAnswer === 'number' && q.correctAnswer >= 0
      ? String.fromCharCode(65 + q.correctAnswer)
      : ''
    const explanation = q?.explanation || ''
    const subject = q?.subject || ''
    const difficulty = q?.difficulty || ''
    const topicName = q?.topicName || ''
    const topicTags = Array.isArray(q?.topicTags) ? q.topicTags.join(', ') : ''

    const optionLines = options.map((opt, i) => `${String.fromCharCode(65 + i)}) ${opt}`)

    return [
      `Question: ${questionText}`,
      '',
      'Options:',
      ...optionLines,
      '',
      `Correct Answer: ${correctLetter}`,
      '',
      'Explanation:',
      explanation,
      '',
      subject ? `Subject: ${subject}` : 'Subject:',
      difficulty ? `Difficulty: ${difficulty}` : 'Difficulty:',
      topicName ? `Topic: ${topicName}` : 'Topic:',
      `Tags: ${topicTags}`
    ].join('\n')
  }

  // Parse markdown back into question object
  const markdownToQuestion = (md) => {
    if (!md || typeof md !== 'string') throw new Error('Empty markdown')
    const lines = md.split(/\r?\n/)

    let questionText = ''
    const options = []
    let correctLetter = ''
    let explanationLines = []
    let inOptions = false
    let inExplanation = false
    let subject = ''
    let difficulty = ''
    let topicName = ''
    let tags = ''

    for (const rawLine of lines) {
      const line = rawLine.trim()
      if (line.toLowerCase().startsWith('question:')) {
        questionText = line.slice('question:'.length).trim()
        inOptions = false
        inExplanation = false
        continue
      }
      if (/^options:?$/i.test(line)) {
        inOptions = true
        inExplanation = false
        continue
      }
      if (/^explanation:?$/i.test(line)) {
        inExplanation = true
        inOptions = false
        continue
      }
      if (line.toLowerCase().startsWith('correct answer:')) {
        correctLetter = line.slice('correct answer:'.length).trim().toUpperCase()
        continue
      }
      if (line.toLowerCase().startsWith('subject:')) {
        subject = line.slice('subject:'.length).trim()
        continue
      }
      if (line.toLowerCase().startsWith('difficulty:')) {
        difficulty = line.slice('difficulty:'.length).trim()
        continue
      }
      if (line.toLowerCase().startsWith('topic:')) {
        topicName = line.slice('topic:'.length).trim()
        continue
      }
      if (line.toLowerCase().startsWith('tags:')) {
        tags = line.slice('tags:'.length).trim()
        continue
      }

      if (inOptions) {
        const m = line.match(/^([A-Z])\)\s*(.*)$/)
        if (m) {
          const optText = m[2]?.trim() || ''
          if (optText) options.push(optText)
        }
        continue
      }
      if (inExplanation) {
        explanationLines.push(rawLine)
        continue
      }
    }

    if (!questionText) throw new Error('Question text is required')
    if (options.length === 0) throw new Error('At least one option is required')
    let correctAnswer = null
    if (correctLetter) {
      const idx = correctLetter.charCodeAt(0) - 65
      if (idx >= 0 && idx < options.length) correctAnswer = idx
    }

    return {
      questionText,
      options,
      correctAnswer: typeof correctAnswer === 'number' ? correctAnswer : undefined,
      explanation: explanationLines.join('\n').trim(),
      subject: subject || undefined,
      difficulty: difficulty || undefined,
      topicName: topicName || undefined,
      topicTags: tags ? tags.split(',').map(s => s.trim()).filter(Boolean) : undefined
    }
  }

  const startEdit = (index) => {
    setEditError('')
    setEditingIndex(index)
    const q = parsedQuestions[index] || {}
    setEditorMarkdown(questionToMarkdown(q))
    setEditFields({
      questionText: q?.questionText || q?.question || '',
      optionsText: Array.isArray(q?.options) ? q.options.join('\n') : '',
      correctLetter: typeof q?.correctAnswer === 'number' ? String.fromCharCode(65 + q.correctAnswer) : '',
      difficulty: q?.difficulty || 'L1',
      subject: q?.subject || '',
      topicName: q?.topicName || '',
      explanation: q?.explanation || q?.solution || '',
      tagsText: Array.isArray(q?.topicTags) ? q.topicTags.join(', ') : ''
    })
  }

  const cancelEdit = () => {
    setEditingIndex(null)
    setEditorMarkdown('')
    setEditError('')
    setEditFields({ questionText: '', optionsText: '', correctLetter: '', difficulty: 'L1', subject: '', topicName: '', explanation: '', tagsText: '' })
  }

  const saveEdit = () => {
    try {
      const options = (editFields.optionsText || '')
        .split(/\r?\n/)
        .map(s => s.trim())
        .filter(Boolean)
      if (!editFields.questionText.trim()) throw new Error('Question text is required')
      if (options.length === 0) throw new Error('Please add at least one option')
      const letter = (editFields.correctLetter || '').trim().toUpperCase()
      let idx = undefined
      if (letter) {
        if (!/^[A-Z]$/.test(letter)) throw new Error('Correct answer must be a single letter (A, B, C, ...)')
        idx = letter.charCodeAt(0) - 65
        if (idx < 0 || idx >= options.length) throw new Error('Correct answer letter exceeds options range')
      }

      const updated = {
        questionText: editFields.questionText.trim(),
        options,
        correctAnswer: idx === undefined ? undefined : idx,
        difficulty: editFields.difficulty || undefined,
        subject: editFields.subject || undefined,
        topicName: editFields.topicName || undefined,
        explanation: (editFields.explanation || '').trim() || undefined,
        topicTags: (editFields.tagsText || '')
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
          .slice(0, 10) || undefined
      }
      setParsedQuestions(prev => {
        const next = [...prev]
        const original = next[editingIndex] || {}
        next[editingIndex] = { ...original, ...updated, isNew: false }
        return next
      })
      cancelEdit()
    } catch (e) {
      setEditError(e?.message || 'Failed to save changes')
    }
  }

  // Save all parsed questions to database
  const saveQuestionsToDatabase = async () => {
    if (!parsedQuestions || parsedQuestions.length === 0) {
      toast.error('No questions to save')
      return
    }
    if (!questionBankId) {
      toast.error('Question bank ID is required')
      return
    }
    const authToken = Cookies.get('usertoken')
    if (!authToken) {
      toast.error('Authentication required')
      return
    }
    setIsSaving(true)
    toast.info('Saving questions...')
    try {
      console.log(parsedQuestions)
      const questionsToSave = parsedQuestions.map((q) => ({
        question: q.questionText || q.question,
        options: Array.isArray(q.options) ? q.options : [],
        correctOption: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
        difficulty: q.difficulty,
        estimatedTime: q.estimatedTime ?? 1,
        positiveMarks: q.positiveMarks ?? 1,
        negativeMarks: q.negativeMarks ?? 0.33,
        solution: {
          type: 'text',
          text: q.explanation || q.solution || '',
          video: { url: '', title: '', description: '', duration: 0 },
          image: { url: '', caption: '' }
        },
        questionBankId,
        subject: q.subject || '',
        topic: q.topicName || '',
        tags: q.topicTags || []
      }))

      let saved = 0
      for (const payload of questionsToSave) {
        try {
          const resp = await fetch(`${API_BASE_URL}/api/questionbank/${questionBankId}/question`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(payload)
          })
          const data = await resp.json()
          console.log('data', data)
          if (data?.success) saved += 1
        } catch (e) {
          // continue
        }
      }
      if (saved > 0) {
        toast.success(`Saved ${saved} question${saved === 1 ? '' : 's'}`)
      } else {
        toast.error('Failed to save questions')
      }
    } catch (e) {
      toast.error('Save failed')
    } finally {
      setIsSaving(false)
    }
  }

  const fetchCleanedTextStream = async (rawText) => {
    if (!rawText || !rawText.trim()) return;
    if (isCleaning) return; // prevent parallel calls
    
    setIsCleaning(true);
    setCleanError('');
    setParsedQuestions([]);
    setStreamingStatus('');
    setCurrentChunk(0);
    setTotalChunks(0);
    setNewQuestionsCount(0);
    
    // Close any existing connection
    closeEventSource();

    try {
      // Create EventSource for streaming
      const response = await fetch(`${API_BASE_URL}/api/questionbank/clean-text-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extractedText: rawText })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              switch (data.type) {
                case 'status':
                  setStreamingStatus(data.message);
                  setTotalChunks(data.totalChunks || 0);
                  break;
                  
                case 'chunk_start':
                  setCurrentChunk(data.chunkNumber || 0);
                  setStreamingStatus(data.message || 'Processing chunk...');
                  break;
                  
                case 'chunk_complete':
                  if (data.questions && Array.isArray(data.questions)) {
                    setParsedQuestions(prev => {
                      const newQuestions = data.questions.map((q, idx) => ({
                        ...q,
                        questionNumber: prev.length + idx + 1,
                        isNew: true
                      }));
                      return [...prev, ...newQuestions];
                    });
                    setNewQuestionsCount(prev => prev + data.questions.length);
                    
                    // Remove "new" flag after animation
                    setTimeout(() => {
                      setParsedQuestions(prev => 
                        prev.map(q => ({ ...q, isNew: false }))
                      );
                    }, 2000);
                  }
                  setCurrentChunk(data.chunkNumber || 0);
                  setStreamingStatus(data.message || 'Chunk completed');
                  // If this is the last chunk, clear the progress shortly after
                  if ((data.chunkNumber || 0) >= (totalChunks || 0)) {
                    setTimeout(() => {
                      setIsCleaning(false);
                      setStreamingStatus('');
                      setCurrentChunk(0);
                      setTotalChunks(0);
                    }, 500);
                  }
                  break;
                  
                case 'chunk_error':
                  setStreamingStatus(`Error: ${data.message}`);
                  if (data.isRateLimit) {
                    setCleanError(`Rate limit reached! The OpenRouter API has usage limits. Please wait 1-2 minutes and try again with a smaller text or fewer questions.`);
                    setIsCleaning(false);
                    return;
                  } else {
                    setCleanError(`Page ${data.chunkNumber} failed: ${data.error}`);
                  }
                  break;
                  
                case 'complete':
                  setStreamingStatus('');
                  setSuccess(`Successfully processed ${data.totalQuestions || parsedQuestions.length} questions from ${data.totalChunks || totalChunks} pages!`);
                  setIsCleaning(false);
                  setCurrentChunk(0);
                  setTotalChunks(0);
                  // Close the extract text section and show generated questions
                  setActiveTab('generated');
                  return;
                  
                case 'error':
                  setCleanError(data.message);
                  setIsCleaning(false);
                  setStreamingStatus('');
                  setCurrentChunk(0);
                  setTotalChunks(0);
                  return;
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError);
            }
          }
        }
      }
      // If the stream ends without an explicit 'complete' event, ensure cleanup
      setIsCleaning(false);
      setStreamingStatus('');
      setCurrentChunk(0);
      setTotalChunks(0);
    } catch (e) {
      console.error('Failed to clean text with streaming:', e);
      setCleanError('Failed to clean text. Check server/OpenRouter API key.');
      setIsCleaning(false);
      setStreamingStatus('');
      setCurrentChunk(0);
      setTotalChunks(0);
    }
  };

  const deleteQuestionAt = (idx) => {
    const q = parsedQuestions[idx];
    if (!q) return;
    if (!window.confirm('Do you want to delete this question?')) return;
    const updated = parsedQuestions.filter((_, i) => i !== idx);
    setParsedQuestions(updated);
    if (editingIndex === idx) setEditingIndex(null);
    toast.success('Question deleted');
  };

  const handleFileSelect = (event) => {
    const file = event.target.files && event.target.files[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file')
      return
    }
    setSelectedFile(file)
    setActiveTab('splitter')
    setShowPdfSplitter(true)
    toast.info('PDF loaded. Opening splitter...')
  }

  const handleDrop = (event) => {
    event.preventDefault()
    const file = event.dataTransfer.files && event.dataTransfer.files[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file')
      return
    }
    setSelectedFile(file)
    setActiveTab('splitter')
    setShowPdfSplitter(true)
    toast.info('PDF loaded. Opening splitter...')
  }

  const handleDragOver = (event) => { event.preventDefault() }

  // Clear all data
  const clearAll = () => {
    closeEventSource();
    setExtractedText('');
    setExtractError('');
    setCleanError('');
    setSuccess('');
    setParsedQuestions([]);
    setStreamingStatus('');
    setCurrentChunk(0);
    setTotalChunks(0);
    setNewQuestionsCount(0);
    setIsCleaning(false);
    setIsExtracting(false);
  };

  const ToolSection = () => {
    if (!activeTab) return null
    if (activeTab === 'splitter') {
      return null
    }
    if (activeTab === 'generated') {
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Question generated tools will appear here.</div>
        </div>
      )
    }
    // extract
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">Extract text tools will appear here.</div>
          {extractedText && !isCleaning && (
            <button 
              onClick={() => fetchCleanedTextStream(extractedText)} 
              className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Clean Text
            </button>
          )}
          {isCleaning && (
            <span className="text-sm text-gray-500 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
              {streamingStatus || 'Processing pages...'}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />
      {onBack && (
        <div className="top-0 z-10 bg-white border-b border-gray-200 shadow-sm mb-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={onBack}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <ArrowLeft size={20} />
                  Back to Questions
                </button>
                <div className="text-gray-400">|</div>
                <span className="text-sm text-gray-500">Text Extraction & Question Generation</span>
              </div>
              <div className="flex items-center gap-2">
                {parsedQuestions.length > 0 && (
                  <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                    {parsedQuestions.length} Questions Ready
                  </span>
                )}
               
                <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded border">
                  Press ESC to go back
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="w-full p-4">
        {/* Top action buttons */}
        <div className="flex items-center gap-3 w-full">
          <button
            onClick={() => {
              setActiveTab('splitter')
              if (!selectedFile) {
                alert('Please upload a PDF first')
                return
              }
              if (selectedFile && selectedFile.type === 'application/pdf') {
                setShowPdfSplitter(true)
              } else {
                alert('Please upload a valid PDF file')
              }
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${activeTab === 'splitter' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'}`}
          >
            Splitter
          </button>
          <button
            onClick={() => setActiveTab('extract')}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${activeTab === 'extract' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'}`}
          >
            Extracted Text
          </button>
          <button
            onClick={() => setActiveTab('generated')}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${activeTab === 'generated' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'}`}
          >
            Question Generated
          </button>
        </div>

        {/* Space for tools of each button */}
        <div className="mt-4 w-full">
          <ToolSection />
        </div>

        {/* Upload PDF section OR Inline Splitter (renders in the same place) */}
        {activeTab === 'extract' ? (
          <div className="mt-6 bg-white rounded-xl shadow p-6 w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Extracted Text</h2>
            </div>
            {isExtracting && (
              <div className="mb-3 text-sm text-purple-700">Extracting selected pages...</div>
            )}
            {extractError && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{extractError}</div>
            )}
            {cleanError && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{cleanError}</div>
            )}
            {success && (
              <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">{success}</div>
            )}
            
            {/* Global Streaming Progress - hidden for per-page cleaning */}
            {false && isCleaning && totalChunks > 0 && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-800">Processing Progress</span>
                  <span className="text-sm text-blue-600">{currentChunk}/{totalChunks} pages</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${(currentChunk / totalChunks) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-blue-600 mt-1">{streamingStatus}</p>
              </div>
            )}
            
            {extractedText ? (
              extractedPages.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {extractedPages.map((p) => (
                      <div key={p.pageNumber} className="bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="px-4 py-2 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-200 rounded-t-lg flex items-center justify-between">
                          <div className="text-sm font-semibold text-gray-800">Page {p.pageNumber}</div>
                          <div className="flex items-center gap-2">
                            {cleaningPage === p.pageNumber && (
                              <span className="text-xs text-gray-600 flex items-center">
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-600 mr-2"></div>
                                {streamingStatus || 'Cleaning...'}
                              </span>
                            )}
                            <button
                              onClick={() => fetchCleanedTextStreamAppend(p.text, `Page ${p.pageNumber}`, p.pageNumber)}
                              disabled={isCleaning}
                              className={`px-3 py-1.5 text-xs rounded font-medium ${isCleaning ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
                            >
                              {cleaningPage === p.pageNumber ? 'Cleaning...' : 'Clean Text'}
                            </button>
                          </div>
                        </div>
                        <div className="p-4 max-h-[40vh] overflow-auto">
                          <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">{p.text}</pre>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 max-h-[65vh] overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">{extractedText}</pre>
                </div>
              )
            ) : (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <div className="text-4xl text-gray-400 mb-2">📄</div>
                <p className="text-gray-600">No extracted text yet. Use Splitter to select pages and extract, then view here.</p>
              </div>
            )}
          </div>
        ) : activeTab === 'generated' ? (
          <div className="mt-6 bg-white rounded-xl shadow p-6 w-full">
            <div className='flex justify-between items-center'>
              <div className='flex justify-start'>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Generated Questions</h2>
              </div>
              <div className='flex items-center justify-end'>
            {parsedQuestions.length > 0 && (
                  <button
                    onClick={saveQuestionsToDatabase}
                    disabled={isSaving}
                    className={`px-4 py-2 mb-2 text-sm rounded-lg transition-colors font-medium ${isSaving ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
                  >
                    {isSaving ? 'Saving...' : 'Save to DB'}
                  </button>
                )}
                </div>
            </div>
            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">{success}</div>
            )}
            {editError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{editError}</div>
            )}
            {parsedQuestions && parsedQuestions.length > 0 ? (
              <div className="space-y-6">
                {/* Summary Card */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">📊</span>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          Questions Summary
                        </h3>
                        <p className="text-sm text-gray-600">
                          Successfully parsed {parsedQuestions.length} question{parsedQuestions.length !== 1 ? 's' : ''} from the extracted text
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {parsedQuestions.length}
                      </div>
                      <div className="text-xs text-gray-500">
                        Questions
                      </div>
                    </div>
                  </div>
                </div>
                {/* Questions Grid */}
                <div className="grid grid-cols-1 gap-6">
                  {parsedQuestions.map((question, idx) => (
                    <div 
                      key={idx} 
                      className={`bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-500 ${
                        question.isNew ? 'border-green-300 shadow-lg scale-105' : ''
                      }`}
                    >
                      {/* Question Header */}
                      <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-6 py-4 border-b border-gray-200 rounded-t-xl">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full p-2 bg-purple-600 text-white text-sm font-semibold mr-3">
                              {idx + 1}
                            </span>
                            <h3 className="text-lg font-semibold text-gray-800 leading-relaxed">
                              {question.questionText || question.question || 'No question text'}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap justify-end">
                            {question.subject && (
                              <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-1 rounded-full border border-purple-200">
                                {question.subject}
                              </span>
                            )}
                            {question.difficulty && (
                              <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${
                                question.difficulty === 'L1' ? 'text-green-700 bg-green-100 border-green-200' :
                                question.difficulty === 'L2' ? 'text-yellow-700 bg-yellow-100 border-yellow-200' :
                                'text-red-700 bg-red-100 border-red-200'
                              }`}>
                                {`Difficulty: ${question.difficulty}`}
                              </span>
                            )}
                            {typeof question.correctAnswer === 'number' && (
                              <span className="text-xs text-green-600 font-semibold bg-green-100 px-2 py-1 rounded-full border border-green-200">
                                Answer: {String.fromCharCode(65 + question.correctAnswer)}
                              </span>
                            )}
                            <button
                              onClick={() => startEdit(idx)}
                              className="text-xs px-2 py-1 rounded border border-gray-300 bg-white hover:bg-gray-100 text-gray-700"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteQuestionAt(idx)}
                              className="text-xs px-2 py-1 rounded border border-red-300 bg-red-50 hover:bg-red-100 text-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                      {/* Options / Edit form */}
                      <div className="p-6">
                        {editingIndex === idx ? (
                          <div className="space-y-4">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={saveEdit} className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700">Save</button>
                              <button onClick={cancelEdit} className="px-3 py-1.5 text-sm rounded bg-gray-200 hover:bg-gray-300">Cancel</button>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                              <textarea
                                className="w-full h-24 p-3 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                                value={editFields.questionText}
                                onChange={(e) => setEditFields(f => ({ ...f, questionText: e.target.value }))}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Options (one per line)</label>
                              <textarea
                                className="w-full h-32 p-3 border rounded text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-400"
                                value={editFields.optionsText}
                                onChange={(e) => setEditFields(f => ({ ...f, optionsText: e.target.value }))}
                              />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Correct Answer Letter</label>
                                <input
                                  type="text"
                                  placeholder="A, B, C ..."
                                  className="w-full p-2 border rounded text-sm uppercase"
                                  value={editFields.correctLetter}
                                  onChange={(e) => setEditFields(f => ({ ...f, correctLetter: e.target.value.toUpperCase().slice(0, 1) }))}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                                <select
                                  className="w-full p-2 border rounded text-sm"
                                  value={editFields.difficulty}
                                  onChange={(e) => setEditFields(f => ({ ...f, difficulty: e.target.value }))}
                                >
                                  <option value="L1">L1 (Easy)</option>
                                  <option value="L2">L2 (Medium)</option>
                                  <option value="L3">L3 (Hard)</option>
                                </select>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                <input
                                  type="text"
                                  className="w-full p-2 border rounded text-sm"
                                  value={editFields.subject}
                                  onChange={(e) => setEditFields(f => ({ ...f, subject: e.target.value }))}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                                <input
                                  type="text"
                                  className="w-full p-2 border rounded text-sm"
                                  value={editFields.topicName}
                                  onChange={(e) => setEditFields(f => ({ ...f, topicName: e.target.value }))}
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Explanation</label>
                              <textarea
                                className="w-full h-24 p-3 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                                value={editFields.explanation}
                                onChange={(e) => setEditFields(f => ({ ...f, explanation: e.target.value }))}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                              <input
                                type="text"
                                className="w-full p-2 border rounded text-sm"
                                value={editFields.tagsText}
                                onChange={(e) => setEditFields(f => ({ ...f, tagsText: e.target.value }))}
                              />
                            </div>
                            <div className="text-xs text-gray-500">
                              <span>Options: {(editFields.optionsText || '').split(/\r?\n/).filter(s => s.trim()).length}</span>
                              <span className="ml-4">ID: Q{String(idx + 1).padStart(3, '0')}</span>
                            </div>
                          </div>
                        ) : (
                          <>
                            {Array.isArray(question.options) && question.options.length > 0 && (
                              <div className="space-y-3">
                                <h4 className="text-sm font-medium text-gray-700 mb-3">Select the correct answer:</h4>
                                {question.options.map((option, optionIndex) => {
                                  const optionLetter = String.fromCharCode(65 + optionIndex)
                                  const isCorrect = typeof question.correctAnswer === 'number' && question.correctAnswer === optionIndex
                                  return (
                                    <div 
                                      key={optionIndex}
                                      className={`flex items-center p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer hover:bg-gray-50 ${isCorrect ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
                                    >
                                      <div className={`flex items-center justify-center w-6 h-6 rounded-full text-sm font-semibold mr-3 ${isCorrect ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                                        {optionLetter}
                                      </div>
                                      <span className={`text-gray-800 ${isCorrect ? 'font-semibold text-green-800' : ''}`}>
                                        {option}
                                      </span>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                            {question.explanation && (
                              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <h4 className="text-sm font-medium text-blue-800 mb-2">Explanation:</h4>
                                <p className="text-sm text-blue-700">{question.explanation}</p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      {/* Card Footer */}
                      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 rounded-b-xl">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Options: {question.options?.length || 0}</span>
                          <span>ID: Q{String(idx + 1).padStart(3, '0')}</span>
                        </div>
                        {(question.topicName || (Array.isArray(question.topicTags) && question.topicTags.length > 0)) && (
                          <div className="mt-2 flex items-start justify-between gap-3">
                            <div className="text-xs text-gray-700">
                              {question.topicName && (
                                <span className="mr-2"><span className="text-gray-500">Topic:</span> <span className="font-medium">{question.topicName}</span></span>
                              )}
                            </div>
                            {Array.isArray(question.topicTags) && question.topicTags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {question.topicTags.slice(0, 5).map((tag, tIdx) => (
                                  <span key={tIdx} className="text-[10px] text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200">{tag}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <div className="text-4xl text-gray-400 mb-2">🧩</div>
                <p className="text-gray-500">No questions generated yet. Use the "Clean Text" button in the Extract Text section to generate questions.</p>
              </div>
            )}
          </div>
        ) : showPdfSplitter && selectedFile?.type === 'application/pdf' ? (
          <div className="mt-6 w-full">
            <InlinePdfSplitter
              file={selectedFile}
              onClose={() => setShowPdfSplitter(false)}
              onPagesExtracted={(text) => { setExtractedText(text || ''); setExtractError(''); setIsExtracting(false) }}
              onExtractState={(state) => setIsExtracting(!!state)}
              onExtractError={(msg) => setExtractError(msg || '')}
            />
          </div>
        ) : (
          <div className="mt-6 bg-white rounded-xl shadow p-6 w-full">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload PDF</h2>
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors w-full ${selectedFile ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50'}`}
            >
              {selectedFile ? (
                <div className="space-y-2">
                  <div className="text-6xl">📄</div>
                  <div>
                    <p className="text-sm text-gray-700 font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-6xl text-gray-400">📁</div>
                  <p className="text-gray-700">Drop your PDF here</p>
                  <p className="text-sm text-gray-500">or click to browse</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileSelect}
              />
              <button
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                className={`mt-4 px-5 py-2 rounded-lg font-medium transition-colors ${selectedFile ? 'bg-gray-700 text-white hover:bg-gray-800' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
              >
                {selectedFile ? 'Change PDF' : 'Choose PDF'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default QuestionBankText

// Inline PDF Splitter modal (copied from PdfSplitter.jsx)
const InlinePdfSplitter = ({ file, onClose, includeMarginalia = false, includeMetadata = false, onPagesExtracted, onExtractState, onExtractError }) => {
  const [numPages, setNumPages] = useState(0)
  const [thumbnails, setThumbnails] = useState([])
  const [selectedPages, setSelectedPages] = useState(new Set())
  const [isRendering, setIsRendering] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [rangeInput, setRangeInput] = useState('')
  const [previewPageNumber, setPreviewPageNumber] = useState(null)
  const [previewDataUrl, setPreviewDataUrl] = useState('')
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const containerRef = useRef(null)

  const isPdf = useMemo(() => file && file.type === 'application/pdf', [file])

  useEffect(() => {
    let isCancelled = false
    const render = async () => {
      if (!file || !isPdf) return
      setIsRendering(true)
      try {
        const arrayBuffer = await file.arrayBuffer()
        const bytesCopy = new Uint8Array(arrayBuffer)
        const loadingTask = pdfjsLib.getDocument({ data: bytesCopy })
        const pdf = await loadingTask.promise
        if (isCancelled) return
        setNumPages(pdf.numPages)
        const thumbPromises = []
        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          thumbPromises.push((async () => {
            const page = await pdf.getPage(pageNumber)
            const desiredWidth = 140
            const viewport = page.getViewport({ scale: 1 })
            const scale = desiredWidth / viewport.width
            const scaledViewport = page.getViewport({ scale })
            const canvas = document.createElement('canvas')
            const context = canvas.getContext('2d')
            canvas.width = Math.ceil(scaledViewport.width)
            canvas.height = Math.ceil(scaledViewport.height)
            await page.render({ canvasContext: context, viewport: scaledViewport }).promise
            const dataUrl = canvas.toDataURL('image/png')
            return { pageNumber, dataUrl }
          })())
        }
        const results = await Promise.all(thumbPromises)
        if (!isCancelled) setThumbnails(results)
      } catch (err) {
        console.error('PDF render failed:', err)
      } finally {
        if (!isCancelled) setIsRendering(false)
      }
    }
    render()
    return () => { isCancelled = true }
  }, [file, isPdf])

  const toggleSelect = (pageNumber) => {
    setSelectedPages(prev => {
      const next = new Set(prev)
      if (next.has(pageNumber)) next.delete(pageNumber)
      else next.add(pageNumber)
      return next
    })
  }

  const openPreview = async (pageNumber) => {
    if (!file) return
    setIsPreviewing(true)
    setPreviewPageNumber(pageNumber)
    try {
      const freshArrayBuffer = await file.arrayBuffer()
      const freshBytes = new Uint8Array(freshArrayBuffer).slice()
      const pdf = await pdfjsLib.getDocument({ data: freshBytes }).promise
      const page = await pdf.getPage(pageNumber)
      const desiredWidth = 700
      const viewport = page.getViewport({ scale: 1 })
      const scale = desiredWidth / viewport.width
      const scaledViewport = page.getViewport({ scale })
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      canvas.width = Math.ceil(scaledViewport.width)
      canvas.height = Math.ceil(scaledViewport.height)
      await page.render({ canvasContext: context, viewport: scaledViewport }).promise
      setPreviewDataUrl(canvas.toDataURL('image/png'))
    } catch (err) {
      console.error('Preview render failed:', err)
    }
  }

  const closePreview = () => {
    setIsPreviewing(false)
    setPreviewPageNumber(null)
    setPreviewDataUrl('')
  }

  const selectAll = () => { setSelectedPages(new Set(thumbnails.map(t => t.pageNumber))) }
  const clearSelection = () => { setSelectedPages(new Set()) }
  const selectOdd = () => {
    if (!numPages) return
    const pages = new Set(Array.from({ length: numPages }, (_, i) => i + 1).filter(n => n % 2 === 1))
    setSelectedPages(pages)
  }
  const selectEven = () => {
    if (!numPages) return
    const pages = new Set(Array.from({ length: numPages }, (_, i) => i + 1).filter(n => n % 2 === 0))
    setSelectedPages(pages)
  }

  const exportSelected = async () => {
    if (!file || selectedPages.size === 0) return
    setIsExporting(true)
    try {
      const { PDFDocument } = await import('https://cdn.skypack.dev/pdf-lib')
      const sourceBytes = await file.arrayBuffer()
      const srcPdf = await PDFDocument.load(sourceBytes)
      const outPdf = await PDFDocument.create()
      const indices = Array.from(selectedPages).sort((a, b) => a - b).map(n => n - 1)
      const copied = await outPdf.copyPages(srcPdf, indices)
      copied.forEach(p => outPdf.addPage(p))
      const outBytes = await outPdf.save()
      const blob = new Blob([outBytes], { type: 'application/pdf' })
      return blob
    } catch (err) {
      console.error('Export failed:', err)
      alert('Failed to export selected pages. Check console for details.')
    } finally {
      setIsExporting(false)
    }
  }

  const extractSelectedText = async () => {
    if (!file || selectedPages.size === 0 || isSubmitting) return
    setIsSubmitting(true)
    if (typeof onExtractState === 'function') onExtractState(true)
    if (typeof onExtractError === 'function') onExtractError('')
    try {
      // Render each selected page to an image and upload one-by-one
      const pageNumbers = Array.from(selectedPages).sort((a, b) => a - b)
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise
      let combinedText = ''

      for (const pageNumber of pageNumbers) {
        const page = await pdf.getPage(pageNumber)
        const desiredWidth = 1200
        const viewport = page.getViewport({ scale: 1 })
        const scale = desiredWidth / viewport.width
        const scaledViewport = page.getViewport({ scale })
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        canvas.width = Math.ceil(scaledViewport.width)
        canvas.height = Math.ceil(scaledViewport.height)
        await page.render({ canvasContext: context, viewport: scaledViewport }).promise

        const blob = await new Promise((resolve, reject) => {
          canvas.toBlob((b) => b ? resolve(b) : reject(new Error('Canvas toBlob failed')), 'image/png')
        })
        const imageFile = new File([blob], `${(file.name || 'document').replace(/\.pdf$/i, '')}_page_${pageNumber}.png`, { type: 'image/png' })

        const formData = new FormData()
        formData.append('image', imageFile)
        formData.append('include_marginalia', String(includeMarginalia))
        formData.append('include_metadata_in_markdown', String(includeMetadata))

        const response = await fetch(`${API_BASE_URL}/api/questionbank/extract-text`, { method: 'POST', body: formData })
        const data = await response.json()
        if (!response.ok || !data?.success) {
          const message = data?.message || 'Failed to extract text'
          throw new Error(message)
        }
        const pageText = data?.data?.extractedText || ''
        combinedText += (combinedText ? `\n\n--- Page ${pageNumber} ---\n\n` : `--- Page ${pageNumber} ---\n\n`) + pageText
      }

      if (typeof onPagesExtracted === 'function') onPagesExtracted(combinedText)
    } catch (err) {
      console.error('Extract selected pages failed:', err)
      if (typeof onExtractError === 'function') onExtractError(err.message || 'Failed to extract text from selected pages')
    } finally {
      setIsSubmitting(false)
      if (typeof onExtractState === 'function') onExtractState(false)
    }
  }

  if (!file || !isPdf) return null

  return (
    <div className="bg-white rounded-xl shadow w-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-800">PDF Splitter</h3>
            <span className="text-xs text-gray-500">{file.name}</span>
            <span className="text-xs text-gray-500">Pages: {numPages || '-'}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={clearSelection} className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded">Clear</button>
            <button onClick={selectAll} className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded">Select All</button>
            <button onClick={selectOdd} className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded">Odd</button>
            <button onClick={selectEven} className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded">Even</button>
            <div className="hidden md:flex items-center gap-2 ml-2">
              <input value={rangeInput} onChange={(e) => setRangeInput(e.target.value)} placeholder="e.g., 3-10 or 5" className="px-2 py-1 text-sm border rounded w-32" />
              <button
                onClick={() => {
                  const trimmed = rangeInput.trim()
                  if (!trimmed) return
                  let start = 0
                  let end = 0
                  if (trimmed.includes('-')) {
                    const [a, b] = trimmed.split('-').map(s => parseInt(s.trim(), 10))
                    start = isNaN(a) ? 0 : a
                    end = isNaN(b) ? 0 : b
                  } else {
                    const single = parseInt(trimmed, 10)
                    start = single
                    end = single
                  }
                  if (!start || !end || start < 1 || end < 1 || !numPages) return
                  const low = Math.max(1, Math.min(start, end))
                  const high = Math.min(numPages, Math.max(start, end))
                  const pages = new Set(Array.from({ length: high - low + 1 }, (_, i) => low + i))
                  setSelectedPages(pages)
                }}
                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded"
              >
                Select Range
              </button>
            </div>
            <button onClick={extractSelectedText} disabled={isSubmitting || selectedPages.size === 0} className={`px-4 py-1.5 text-sm rounded text-white ${selectedPages.size === 0 || isSubmitting ? 'bg-green-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>{isSubmitting ? 'Extracting...' : `Extract Text (${selectedPages.size})`}</button>
            <button onClick={onClose} className="ml-2 px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-800 text-white rounded">Close</button>
          </div>
        </div>

        <div ref={containerRef} className="p-4">
          {isRendering && (<div className="text-center text-gray-600 py-12">Rendering pages...</div>)}
          {!isRendering && thumbnails.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {thumbnails.map(({ pageNumber, dataUrl }) => (
                <div key={pageNumber} className={`relative border rounded-lg overflow-hidden w-fit justify-self-start ${selectedPages.has(pageNumber) ? 'ring-2 ring-purple-500' : 'border-black-200'}`}>
                  <img src={dataUrl} alt={`Page ${pageNumber}`} className="block cursor-zoom-in w-24 sm:w-28 md:w-32 h-auto" onClick={() => openPreview(pageNumber)} />
                  <div className="absolute top-2 left-2 bg-white/90 rounded px-2 py-0.5 text-xs text-gray-700 border">{pageNumber}</div>
                  <label className="absolute bottom-2 left-2 bg-white/90 border rounded px-2 py-1 text-xs font-medium select-none cursor-pointer flex items-center gap-2">
                    <input type="checkbox" checked={selectedPages.has(pageNumber)} onChange={() => toggleSelect(pageNumber)} className="rounded" />
                    Select
                  </label>
                </div>
              ))}
            </div>
          )}
          {!isRendering && thumbnails.length === 0 && (
            <div className="text-center text-gray-600 py-12">No pages to display.</div>
          )}
        </div>
        {isPreviewing && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[60]" onClick={closePreview}>
            <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-3 border-b">
                <div className="text-sm text-gray-700">Preview • Page {previewPageNumber}</div>
                <button onClick={closePreview} className="px-3 py-1.5 text-sm bg-gray-700 text-white rounded hover:bg-gray-800">Close</button>
              </div>
              <div className="p-4 flex items-center justify-center">
                {previewDataUrl ? (
                  <img src={previewDataUrl} alt={`Page ${previewPageNumber}`} className="max-w-2xl w-full h-auto" />
                ) : (
                  <div className="text-gray-600 py-16">Loading preview...</div>
                )}
              </div>
            </div>
          </div>
        )}
    </div>
  )
}


