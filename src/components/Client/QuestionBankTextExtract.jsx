import React, { useState, useRef, useEffect } from 'react';
import { API_BASE_URL, MAX_FILE_SIZE, ALLOWED_FILE_TYPES, FILE_TYPE_LABELS } from '../../config';
import { ArrowLeft, Save } from 'lucide-react';
import Cookies from "js-cookie";
import { toast } from "react-toastify";

const TextFromImage = ({ onBack, questionBankId, onQuestionsSaved }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [cleanedText, setCleanedText] = useState('');
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanError, setCleanError] = useState('');

  const [parsedQuestions, setParsedQuestions] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fileInfo, setFileInfo] = useState(null);
  const [includeMarginalia, setIncludeMarginalia] = useState(false);
  const [includeMetadata, setIncludeMetadata] = useState(false);
  const [cleanedRequested, setCleanedRequested] = useState(false);
  const [streamingStatus, setStreamingStatus] = useState('');
  const [currentChunk, setCurrentChunk] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [newQuestionsCount, setNewQuestionsCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);
  const eventSourceRef = useRef(null);

  // Cleanup EventSource on component unmount
  useEffect(() => {
    return () => {
      closeEventSource();
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && onBack) {
        onBack();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onBack]);

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setError('Please select a valid file (JPEG, PNG, GIF, BMP images or PDF documents)');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setError('');
    setSuccess('');
    setExtractedText('');
    setCleanedText('');
    setCleanError('');
    setCleanedRequested(false);
    setFileInfo(null);
    setParsedQuestions([]);
    setStreamingStatus('');
    setCurrentChunk(0);
    setTotalChunks(0);
    setNewQuestionsCount(0);

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleDragOver = (event) => { event.preventDefault(); };
  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      const fakeEvent = { target: { files: [file] } };
      handleFileSelect(fakeEvent);
    }
  };

  // Close any existing EventSource
  const closeEventSource = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  };

  // Call backend to clean extracted text with streaming
  const fetchCleanedTextStream = async (rawText) => {
    if (!rawText || !rawText.trim()) return;
    if (isCleaning) return; // prevent parallel calls
    
    setIsCleaning(true);
    setCleanError('');
    setCleanedRequested(true);
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

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              switch (data.type) {
                case 'status':
                  setStreamingStatus(data.message);
                  setTotalChunks(data.totalChunks);
                  break;
                  
                case 'chunk_start':
                  setCurrentChunk(data.chunkNumber);
                  setStreamingStatus(data.message);
                  break;
                  
                case 'chunk_complete':
                  setCurrentChunk(data.chunkNumber);
                  setStreamingStatus(data.message);
                  
                  // Add new questions to the existing array
                  if (data.questions && data.questions.length > 0) {
                    setNewQuestionsCount(data.questions.length);
                    setParsedQuestions(prev => {
                      const newQuestions = data.questions.map((q, idx) => ({
                        ...q,
                        questionNumber: prev.length + idx + 1,
                        isNew: true // Mark as new for animation
                      }));
                      return [...prev, ...newQuestions];
                    });
                    
                    // Remove "new" flag after animation
                    setTimeout(() => {
                      setParsedQuestions(prev => 
                        prev.map(q => ({ ...q, isNew: false }))
                      );
                    }, 2000);
                  }
                  
                  // Update cleaned text
                  if (data.cleanedText) {
                    setCleanedText(prev => prev + (prev ? '\n\n--- Next Section ---\n\n' : '') + data.cleanedText);
                  }
                  break;
                  
                case 'chunk_error':
                  setStreamingStatus(`Error: ${data.message}`);
                  if (data.isRateLimit) {
                    setCleanError(`Rate limit reached! The OpenRouter API has usage limits. Please wait 1-2 minutes and try again with a smaller text or fewer questions.`);
                    setIsCleaning(false);
                    return;
                  } else {
                    setCleanError(`Chunk ${data.chunkNumber} failed: ${data.error}`);
                  }
                  break;
                  
                case 'complete':
                  setStreamingStatus(data.message);
                  setSuccess(`Successfully processed ${data.totalQuestions} questions from ${data.totalChunks} chunks!`);
                  setIsCleaning(false);
                  return;
                  
                case 'error':
                  setCleanError(data.message);
                  setIsCleaning(false);
                  return;
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError);
            }
          }
        }
      }
    } catch (e) {
      console.error('Failed to clean text with streaming:', e);
      setCleanError('Failed to clean text. Check server/OpenRouter API key.');
      setIsCleaning(false);
    }
  };

  // Legacy function for backward compatibility (non-streaming)
  const fetchCleanedText = async (rawText) => {
    if (!rawText || !rawText.trim()) return;
    if (isCleaning) return; // prevent parallel calls
    setIsCleaning(true);
    setCleanError('');
    setCleanedRequested(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/api/questionbank/clean-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extractedText: rawText })
      });
      const data = await resp.json();
      if (resp.status === 429) {
        setCleanedText('');
        setCleanError('Rate limit reached. Please wait ~60 seconds and click Clean Text again.');
        return;
      }
      if (data.success) {
        setCleanedText(data.data.cleanedText || '');
        // Also set the parsed questions if available
        if (data.data.questions && Array.isArray(data.data.questions)) {
          setParsedQuestions(data.data.questions);
        }
        // Show chunk processing info
        if (data.data.chunksProcessed && data.data.chunksProcessed > 1) {
          setSuccess(`Successfully processed ${data.data.chunksProcessed} chunks and generated ${data.data.questionCount} questions!`);
        }
        // Show warning if response was truncated
        if (data.data.isTruncated) {
          setCleanError('Warning: Response was truncated. Some questions may be missing. Try with a smaller text or contact support.');
        }
      } else {
        setCleanedText('');
        setCleanError(data.message || 'Failed to clean text');
      }
    } catch (e) {
      console.error('Failed to clean text:', e);
      setCleanedText('');
      setCleanError('Failed to clean text. Check server/OpenRouter API key.');
    } finally {
      setIsCleaning(false);
    }
  };

  // Extract text from file then clean it
  const extractText = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');
    setCleanedText('');
    setCleanError('');
    setCleanedRequested(false);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('include_marginalia', includeMarginalia.toString());
      formData.append('include_metadata_in_markdown', includeMetadata.toString());

      const response = await fetch(`${API_BASE_URL}/api/questionbank/extract-text`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        const raw = data.data.extractedText || '';
        setExtractedText(raw);
        setFileInfo({
          fileName: data.data.originalFileName,
          fileSize: data.data.fileSize,
          fileType: data.data.fileType,
          confidence: data.data.confidence,
          metadata: data.data.metadata,
          warnings: data.data.warnings,
          extractionError: data.data.extractionError
        });
        setSuccess('Text extracted successfully!');
        // Auto-clean immediately after successful extraction with streaming
        if (raw && raw.trim()) {
          fetchCleanedTextStream(raw);
        }
      } else {
        setError(data.message || 'Failed to extract text');
      }
    } catch (err) {
      console.error('Error extracting text:', err);
      setError('Failed to connect to the server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearAll = () => {
    closeEventSource(); // Close any streaming connection
    setSelectedFile(null);
    setPreviewUrl(null);
    setExtractedText('');
    setCleanedText('');
    setCleanError('');
    setError('');
    setSuccess('');
    setFileInfo(null);
    setCleanedRequested(false);
    setParsedQuestions([]);
    setStreamingStatus('');
    setCurrentChunk(0);
    setTotalChunks(0);
    setNewQuestionsCount(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const copyToClipboard = () => {
    if (extractedText) {
      navigator.clipboard.writeText(extractedText);
      setSuccess('Text copied to clipboard!');
      setTimeout(() => setSuccess(''), 2000);
    }
  };

  const copyCleanedToClipboard = () => {
    if (cleanedText) {
      navigator.clipboard.writeText(cleanedText);
      setSuccess('Cleaned text copied!');
      setTimeout(() => setSuccess(''), 2000);
    }
  };

  const downloadText = () => {
    if (extractedText) {
      const blob = new Blob([extractedText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `extracted_text_${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const downloadCleaned = () => {
    if (cleanedText) {
      const blob = new Blob([cleanedText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cleaned_text_${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const getFileTypeDisplay = (fileType) => FILE_TYPE_LABELS[fileType] || fileType;

  // Save all parsed questions to database
  const saveQuestionsToDatabase = async () => {
    if (!parsedQuestions || parsedQuestions.length === 0) {
      toast.error('No questions to save');
      return;
    }

    if (!questionBankId) {
      toast.error('Question bank ID is required');
      return;
    }

    // setIsSaving(true);
    try {
      const authToken = Cookies.get("usertoken");
      if (!authToken) {
        toast.error("Authentication required");
        return;
      }

      // Transform parsed questions to match the expected format
      const questionsToSave = parsedQuestions.map((question, index) => ({
        question: question.questionText,
        options: question.options || [],
        correctOption: question.correctAnswer ?? 0,
        difficulty: question.difficulty || "L1",
        estimatedTime: question.estimatedTime ?? 1,
        positiveMarks: question.positiveMarks ?? 1,
        negativeMarks: question.negativeMarks ?? 0.33,
        solution: {
          type: "text",
          text: question.solution || question.explanation || "",
          video: { url: "", title: "", description: "", duration: 0 },
          image: { url: "", caption: "" },
        },
        questionBankId: questionBankId,
      }));

      // Save questions one by one
      let savedCount = 0;
      let failedCount = 0;

      for (const questionData of questionsToSave) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/questionbank/${questionBankId}/question`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify(questionData),
          });

          const result = await response.json();
          if (result.success) {
            savedCount++;
          } else {
            failedCount++;
            console.error('Failed to save question:', result.message);
          }
        } catch (error) {
          failedCount++;
          console.error('Error saving question:', error);
        }
      }

      if (savedCount > 0) {
        toast.success(`Successfully saved ${savedCount} questions${failedCount > 0 ? ` (${failedCount} failed)` : ''}`);
        // Clear parsed questions after successful save
        setParsedQuestions([]);
        // Call callback to refresh questions list
        if (onQuestionsSaved) {
          onQuestionsSaved();
        }
        // Call onBack to return to questions view
        if (onBack) {
          onBack();
        }
      } else {
        toast.error('Failed to save any questions');
      }
    } catch (error) {
      console.error('Error saving questions:', error);
      toast.error('Failed to save questions to database');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen w-full">
      {/* Sticky Navigation Header */}
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

      <div className="w-full mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Upload File</h2>
              <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${selectedFile ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'}`} onDragOver={handleDragOver} onDrop={handleDrop}>
                {previewUrl ? (
                  <div className="space-y-4">
                    <img src={previewUrl} alt="Preview" className="max-w-full h-48 object-contain mx-auto rounded-lg shadow-md" />
                    <p className="text-sm text-gray-600">{selectedFile?.name}</p>
                  </div>
                ) : selectedFile ? (
                  <div className="space-y-4">
                    <div className="text-6xl text-gray-400">{selectedFile.type === 'application/pdf' ? '📄' : '📷'}</div>
                    <div>
                      <p className="text-sm text-gray-600">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">{getFileTypeDisplay(selectedFile.type)}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-6xl text-gray-400">📁</div>
    <div>
                      <p className="text-lg font-medium text-gray-700 mb-2">Drop your file here</p>
                      <p className="text-sm text-gray-500 mb-4">or click to browse files</p>
                      <p className="text-xs text-gray-400">Supports: JPEG, PNG, GIF, BMP, PDF (Max: 10MB)</p>
                    </div>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={handleFileSelect} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Choose File</button>
              </div>

              {/* {selectedFile && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-800 mb-3">Extraction Options</h3>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input type="checkbox" checked={includeMarginalia} onChange={(e) => setIncludeMarginalia(e.target.checked)} className="mr-2 rounded" />
                      <span className="text-sm text-gray-700">Include marginalia and layout info</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" checked={includeMetadata} onChange={(e) => setIncludeMetadata(e.target.checked)} className="mr-2 rounded" />
                      <span className="text-sm text-gray-700">Include metadata in markdown</span>
                    </label>
                    <p className="text-xs text-gray-500">Uncheck both for clean text extraction only</p>
                  </div>
                </div>
              )} */}

              <div className="flex gap-3 mt-6">
                <button onClick={extractText} disabled={!selectedFile || isLoading} className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${!selectedFile || isLoading ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}>
                  {isLoading ? (<div className="flex items-center justify-center"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>Extracting...</div>) : ('Extract Text')}
                </button>
                <button onClick={clearAll} className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">Clear</button>
              </div>
            </div>

            {fileInfo && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">File Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-600">File Name:</span><span className="font-medium">{fileInfo.fileName}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">File Type:</span><span className="font-medium">{getFileTypeDisplay(fileInfo.fileType)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">File Size:</span><span className="font-medium">{(fileInfo.fileSize / 1024).toFixed(1)} KB</span></div>
                  {fileInfo.confidence && (<div className="flex justify-between"><span className="text-gray-600">Confidence:</span><span className="font-medium">{(fileInfo.confidence * 100).toFixed(1)}%</span></div>)}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* Parsed Questions as Cards */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-gray-800">Question Cards</h2>
                <div className="flex gap-2">
                  {extractedText && !isCleaning && (
                    <button onClick={() => fetchCleanedTextStream(extractedText)} className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors font-medium">
                      Clean Text
                    </button>
                  )}
                  {isCleaning && (
                    <span className="text-sm text-gray-500 flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
                      {streamingStatus || 'Processing chunks...'}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Streaming Progress */}
              {isCleaning && totalChunks > 0 && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-800">Processing Progress</span>
                    <span className="text-sm text-blue-600">{currentChunk}/{totalChunks} chunks</span>
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
              
              {/* New Questions Notification */}
              {newQuestionsCount > 0 && isCleaning && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg animate-pulse">
                  <div className="flex items-center">
                    <span className="text-green-500 mr-2">✨</span>
                    <span className="text-sm text-green-700 font-medium">
                      {newQuestionsCount} new question{newQuestionsCount !== 1 ? 's' : ''} added from chunk {currentChunk}!
                    </span>
                  </div>
                </div>
              )}
              
              {cleanError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-red-500 mr-2">⚠️</span>
                    <span className="text-sm text-red-700">{cleanError}</span>
                  </div>
                </div>
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
                            {isCleaning ? 'Processing chunks...' : `Successfully parsed ${parsedQuestions.length} question${parsedQuestions.length !== 1 ? 's' : ''} from the extracted text`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            {parsedQuestions.length}
                          </div>
                          <div className="text-xs text-gray-500">
                            {isCleaning ? 'Live Updates' : 'Questions'}
                          </div>
                        </div>
                        {!isCleaning && parsedQuestions.length > 0 && (
                          <div className="flex gap-2">
                            <button
                              onClick={saveQuestionsToDatabase}
                              disabled={isSaving}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                                isSaving 
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                  : 'bg-green-600 text-white hover:bg-green-700 shadow-sm'
                              }`}
                            >
                              {isSaving ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save size={16} />
                                  Save All Questions
                                </>
                              )}
                            </button>
                            {/* {onBack && (
                              <button
                                onClick={() => {
                                  if (parsedQuestions.length > 0) {
                                    // If there are questions, save them first, then go back
                                    saveQuestionsToDatabase();
                                  } else {
                                    // If no questions, just go back
                                    onBack();
                                  }
                                }}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                              >
                                <ArrowLeft size={16} />
                                {parsedQuestions.length > 0 ? 'Save & Go Back' : 'Go Back'}
                              </button>
                            )} */}
                          </div>
                        )}
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
                                                   <div className="flex items-center justify-between">
                           <div className="flex items-center">
                             <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-600 text-white text-sm font-semibold mr-3">
                               {idx + 1}
                             </span>
                             <h3 className="text-lg font-semibold text-gray-800 leading-relaxed">
                               {question.questionText}
                             </h3>
                           </div>
                           <div className="flex items-center gap-2">
                             {typeof question.correctAnswer === 'number' && (
                               <span className="text-xs text-green-600 font-semibold bg-green-100 px-2 py-1 rounded-full border border-green-200">
                                 Answer: {String.fromCharCode(65 + question.correctAnswer)}
                               </span>
                             )}
                             <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full border">
                               Question {idx + 1}
                             </span>
                           </div>
                         </div>
                        </div>
                        
                        {/* Options */}
                        <div className="p-6">
                          {Array.isArray(question.options) && question.options.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="text-sm font-medium text-gray-700 mb-3">Select the correct answer:</h4>
                              {question.options.map((option, optionIndex) => {
                                const optionLetter = String.fromCharCode(65 + optionIndex); // A, B, C, D
                                const isCorrect = typeof question.correctAnswer === 'number' && question.correctAnswer === optionIndex;
                                
                                                               return (
                                 <div 
                                   key={optionIndex} 
                                   className={`flex items-center p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer hover:bg-gray-50 ${
                                     isCorrect 
                                       ? 'border-green-300 bg-green-50' 
                                       : 'border-gray-200 hover:border-gray-300'
                                   }`}
                                 >
                                   <div className={`flex items-center justify-center w-6 h-6 rounded-full text-sm font-semibold mr-3 ${
                                     isCorrect 
                                       ? 'bg-green-600 text-white' 
                                       : 'bg-gray-200 text-gray-700'
                                   }`}>
                                     {optionLetter}
                                   </div>
                                   <span className={`text-gray-800 ${
                                     isCorrect ? 'font-semibold text-green-800' : ''
                                   }`}>
                                     {option}
                                   </span>
                                   {isCorrect && (
                                     <span className="ml-auto text-xs text-green-600 font-medium bg-green-100 px-2 py-1 rounded-full">
                                       ✓ Correct
                                     </span>
                                   )}
                                 </div>
                               );
                              })}
                            </div>
                          )}
                          
                                                   {/* Solution/Explanation (if available) */}
                         {(question.solution || question.explanation) && (
                           <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                             <div className="flex items-center mb-2">
                               <span className="text-blue-600 mr-2">💡</span>
                               <span className="text-sm font-semibold text-blue-800">
                                 {question.explanation ? 'Explanation' : 'Solution'}
                               </span>
                             </div>
                             <p className="text-sm text-blue-700 leading-relaxed">
                               {question.explanation || question.solution}
                             </p>
                           </div>
                         )}
                        </div>
                        
                        {/* Card Footer */}
                        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 rounded-b-xl">
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Options: {question.options?.length || 0}</span>
                            <span>ID: Q{String(idx + 1).padStart(3, '0')}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <div className="text-4xl text-gray-400 mb-2">🧩</div>
                  <p className="text-gray-500">Question cards will appear here after cleaning text</p>
                </div>
              )}
            </div>

            {error && (<div className="bg-red-50 border border-red-200 rounded-lg p-4"><div className="flex items-center"><div className="text-red-500 mr-2">⚠️</div><p className="text-red-700">{error}</p></div></div>)}
            {success && (<div className="bg-green-50 border border-green-200 rounded-lg p-4"><div className="flex items-center"><div className="text-green-500 mr-2">✅</div><p className="text-green-700">{success}</p></div></div>)}

            {fileInfo?.warnings && fileInfo.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"><h4 className="font-medium text-yellow-800 mb-2">Warnings:</h4><ul className="text-sm text-yellow-700 space-y-1">{fileInfo.warnings.map((warning, index) => (<li key={index}>• {warning}</li>))}</ul></div>
            )}

            {fileInfo?.extractionError && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4"><h4 className="font-medium text-orange-800 mb-2">Extraction Error:</h4><p className="text-sm text-orange-700">{fileInfo.extractionError}</p></div>
            )}
          </div>
        </div>

        <div className="text-center mt-12 text-gray-500"><p>Powered by Landing AI • Built with React & Tailwind CSS</p></div>
      </div>

      {/* Floating Action Button for Quick Navigation */}
      {onBack && (
        <div className="fixed bottom-6 right-6 z-20">
          <div className="flex flex-col gap-3">
            {parsedQuestions.length > 0 && (
              <button
                onClick={saveQuestionsToDatabase}
                disabled={isSaving}
                className={`flex items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-all duration-200 ${
                  isSaving 
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                    : 'bg-green-600 text-white hover:bg-green-700 hover:scale-105'
                }`}
                title="Save Questions"
              >
                {isSaving ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Save size={20} />
                )}
              </button>
            )}
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 hover:scale-105 transition-all duration-200"
              title="Back to Questions"
            >
              <ArrowLeft size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TextFromImage;
