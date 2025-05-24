import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X, Check } from 'lucide-react';
import { toast } from 'react-toastify';

const ManualIndexCreator = ({ 
  isOpen, 
  onClose, 
  pdfPages, 
  selectedIndexPages, 
  onSplitComplete, 
  pdfFile
}) => {
  const [chapters, setChapters] = useState([
    { 
      id: 1, 
      title: '', 
      startPage: 1, 
      endPage: 1, 
      topics: []
    }
  ]);
  const [previewPages, setPreviewPages] = useState([]);
  const [activeSelection, setActiveSelection] = useState(null);
  // activeSelection format: { type: 'chapter' | 'topic', id: number, field: 'startPage' | 'endPage', topicId?: number }

  // Initialize preview pages from all available pages
  useEffect(() => {
    if (pdfPages) {
      const pages = [...pdfPages].sort((a, b) => a.number - b.number);
      setPreviewPages(pages);
    }
  }, [pdfPages]);

  // Helper function to handle page click based on active selection
  const handlePageClick = (pageNumber) => {
    if (!activeSelection) return;

    const { type, id, field, topicId } = activeSelection;
    
    if (type === 'chapter') {
      // For chapter start page
      if (field === 'startPage') {
        // Get current chapter
        const chapter = chapters.find(c => c.id === id);
        if (!chapter) return;
        
        // If start page would be greater than end page, adjust end page automatically
        if (pageNumber > chapter.endPage) {
          updateChapter(id, 'endPage', pageNumber);
        }
        
        // Update start page
        updateChapter(id, 'startPage', pageNumber);
      } 
      // For chapter end page
      else if (field === 'endPage') {
        // Get current chapter
        const chapter = chapters.find(c => c.id === id);
        if (!chapter) return;
        
        // Make sure end page isn't less than start page
        if (pageNumber < chapter.startPage) {
          toast.warning("End page cannot be less than start page");
          return;
        }
        
        // Update end page
        updateChapter(id, 'endPage', pageNumber);
      }
    } 
    else if (type === 'topic') {
      // Get current chapter and topic
      const chapter = chapters.find(c => c.id === id);
      if (!chapter) return;
      
      const topic = chapter.topics.find(t => t.id === topicId);
      if (!topic) return;
      
      // For topic start page
      if (field === 'startPage') {
        // Cannot be less than chapter start page
        if (pageNumber < chapter.startPage) {
          toast.warning(`Topic start page cannot be less than chapter start page (${chapter.startPage})`);
          return;
        }
        
        // Cannot be greater than chapter end page
        if (pageNumber > chapter.endPage) {
          toast.warning(`Topic start page cannot be greater than chapter end page (${chapter.endPage})`);
          return;
        }
        
        // If start page would be greater than topic end page, adjust end page automatically
        if (pageNumber > topic.endPage) {
          updateTopic(id, topicId, 'endPage', pageNumber);
        }
        
        // Update start page
        updateTopic(id, topicId, 'startPage', pageNumber);
      } 
      // For topic end page
      else if (field === 'endPage') {
        // Cannot be less than topic start page
        if (pageNumber < topic.startPage) {
          toast.warning("End page cannot be less than start page");
          return;
        }
        
        // Cannot be greater than chapter end page
        if (pageNumber > chapter.endPage) {
          toast.warning(`Topic end page cannot be greater than chapter end page (${chapter.endPage})`);
          return;
        }
        
        // Update end page
        updateTopic(id, topicId, 'endPage', pageNumber);
      }
    }
    
    // Clear selection after setting
    setActiveSelection(null);
  };

  // Function to set active field for page selection
  const setPageSelectionActive = (type, id, field, topicId = null) => {
    setActiveSelection({ type, id, field, topicId });
  };

  const addChapter = () => {
    const lastChapter = chapters[chapters.length - 1];
    const newChapterId = chapters.length + 1;
    
    // Default new chapter to start at the end of the last chapter + 1
    const newStartPage = lastChapter ? lastChapter.endPage + 1 : 1;
    
    setChapters([
      ...chapters, 
      { 
        id: newChapterId, 
        title: '', 
        startPage: newStartPage, 
        endPage: newStartPage,
        topics: []
      }
    ]);
  };

  const removeChapter = (chapterId) => {
    if (chapters.length <= 1) {
      toast.warning("You must have at least one chapter");
      return;
    }
    setChapters(chapters.filter(chapter => chapter.id !== chapterId));
  };

  const addTopic = (chapterId) => {
    const updatedChapters = [...chapters];
    const chapterIndex = updatedChapters.findIndex(c => c.id === chapterId);
    
    if (chapterIndex === -1) return;
    
    const chapter = updatedChapters[chapterIndex];
    
    // Find the next available topic ID in this chapter
    const topicId = chapter.topics.length > 0 ? 
      Math.max(...chapter.topics.map(t => t.id)) + 1 : 1;
    
    updatedChapters[chapterIndex] = {
      ...chapter,
      topics: [
        ...chapter.topics,
        {
          id: topicId,
          title: '',
          startPage: chapter.startPage,
          endPage: chapter.endPage
        }
      ]
    };
    
    setChapters(updatedChapters);
  };

  const removeTopic = (chapterId, topicId) => {
    const updatedChapters = [...chapters];
    const chapterIndex = updatedChapters.findIndex(c => c.id === chapterId);
    
    if (chapterIndex === -1) return;
    
    updatedChapters[chapterIndex] = {
      ...updatedChapters[chapterIndex],
      topics: updatedChapters[chapterIndex].topics.filter(topic => topic.id !== topicId)
    };
    
    setChapters(updatedChapters);
  };

  const updateChapter = (chapterId, field, value) => {
    const updatedChapters = [...chapters];
    const chapterIndex = updatedChapters.findIndex(c => c.id === chapterId);
    
    if (chapterIndex === -1) return;
    
    // For page numbers, convert to integer
    if (field === 'startPage' || field === 'endPage') {
      value = parseInt(value) || 1;
    }
    
    updatedChapters[chapterIndex] = {
      ...updatedChapters[chapterIndex],
      [field]: value
    };
    
    setChapters(updatedChapters);
  };

  const updateTopic = (chapterId, topicId, field, value) => {
    const updatedChapters = [...chapters];
    const chapterIndex = updatedChapters.findIndex(c => c.id === chapterId);
    
    if (chapterIndex === -1) return;
    
    const topicIndex = updatedChapters[chapterIndex].topics.findIndex(t => t.id === topicId);
    
    if (topicIndex === -1) return;
    
    // For page numbers, convert to integer
    if (field === 'startPage' || field === 'endPage') {
      value = parseInt(value) || 1;
    }
    
    updatedChapters[chapterIndex].topics[topicIndex] = {
      ...updatedChapters[chapterIndex].topics[topicIndex],
      [field]: value
    };
    
    setChapters(updatedChapters);
  };

  const handleCreateIndex = () => {
    // Validate chapters before proceeding
    const validationErrors = [];
    
    // Check for empty titles
    chapters.forEach(chapter => {
      if (!chapter.title.trim()) {
        validationErrors.push(`Chapter ${chapter.id} must have a title`);
      }
      
      chapter.topics.forEach(topic => {
        if (!topic.title.trim()) {
          validationErrors.push(`Topic in Chapter ${chapter.id} must have a title`);
        }
      });
    });
    
    // Check for valid page ranges
    chapters.forEach(chapter => {
      if (chapter.startPage > chapter.endPage) {
        validationErrors.push(`Chapter ${chapter.id}: Start page cannot be greater than end page`);
      }
      
      chapter.topics.forEach(topic => {
        if (topic.startPage < chapter.startPage || topic.endPage > chapter.endPage) {
          validationErrors.push(`Topic in Chapter ${chapter.id} must be within chapter page range`);
        }
        
        if (topic.startPage > topic.endPage) {
          validationErrors.push(`Topic in Chapter ${chapter.id}: Start page cannot be greater than end page`);
        }
      });
    });
    
    // If validation fails, show errors and return
    if (validationErrors.length > 0) {
      validationErrors.forEach(error => toast.error(error));
      return;
    }
    
    // Format chapters for index preview
    const formattedIndex = chapters.map((chapter, index) => ({
      id: index,
      chapterNum: chapter.id.toString(),
      title: chapter.title,
      startPage: chapter.startPage,
      endPage: chapter.endPage,
      topics: chapter.topics.map((topic, topicIndex) => ({
        id: topicIndex,
        title: topic.title,
        startPage: topic.startPage,
        endPage: topic.endPage
      }))
    }));
    
    // Pass formatted index to parent component
    onSplitComplete(formattedIndex);
  };

  // Enhanced chapter display with page numbers in title section
  const getChapterTitle = (chapter) => {
    return `${chapter.title || "Untitled"} (Pages ${chapter.startPage}-${chapter.endPage})`;
  };

  // Enhanced topic display with page numbers in title section
  const getTopicTitle = (topic) => {
    return `${topic.title || "Untitled Topic"} (Pages ${topic.startPage}-${topic.endPage})`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Create Index Manually</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200"
          >
            <X size={24} />
          </button>
        </div>
        
        {activeSelection && (
          <div className="bg-blue-100 border-l-4 border-blue-500 rounded-md p-4 mb-4 flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-blue-500 rounded-full p-2 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-blue-700 font-medium">
                  Page selection mode active
                </p>
                <p className="text-blue-600 text-sm">
                  Click on a page to set {activeSelection.type === 'chapter' ? 'Chapter' : 'Topic'} {activeSelection.field === 'startPage' ? 'start' : 'end'} page
                </p>
              </div>
            </div>
            <button 
              onClick={() => setActiveSelection(null)} 
              className="bg-blue-200 hover:bg-blue-300 text-blue-800 rounded-full p-1"
            >
              <X size={20} />
            </button>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Index Structure</h3>
            <div className="grid grid-cols-1 gap-6 max-h-[60vh] overflow-y-auto pr-2">
              {chapters.map((chapter) => (
                <div key={chapter.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  {/* Chapter Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <span className="mr-2 bg-indigo-100 text-indigo-800 py-1 px-3 rounded-full font-medium">
                        Chapter {chapter.id}
                      </span>
                      <span className="text-gray-600 text-sm">
                        Pages {chapter.startPage}-{chapter.endPage}
                      </span>
                    </div>
                    <button
                      onClick={() => removeChapter(chapter.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  
                  {/* Chapter Details */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                    <div className="md:col-span-3">
                      <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 mb-1">
                          Chapter Title
                        </label>
                        <input
                          type="text"
                          value={chapter.title}
                          onChange={(e) => updateChapter(chapter.id, 'title', e.target.value)}
                          placeholder="Enter chapter title"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 mb-1">
                          Start Page
                        </label>
                        <div className="flex">
                          <input
                            type="number"
                            value={chapter.startPage}
                            onChange={(e) => updateChapter(chapter.id, 'startPage', e.target.value)}
                            min="1"
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                              activeSelection?.type === 'chapter' && 
                              activeSelection?.id === chapter.id && 
                              activeSelection?.field === 'startPage' 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-300'
                            }`}
                          />
                          <button 
                            onClick={() => setPageSelectionActive('chapter', chapter.id, 'startPage')}
                            className={`ml-1 p-2 rounded-md ${
                              activeSelection?.type === 'chapter' && 
                              activeSelection?.id === chapter.id && 
                              activeSelection?.field === 'startPage' 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                            }`}
                            title="Click to select from PDF pages"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 mb-1">
                          End Page
                        </label>
                        <div className="flex">
                          <input
                            type="number"
                            value={chapter.endPage}
                            onChange={(e) => updateChapter(chapter.id, 'endPage', e.target.value)}
                            min={chapter.startPage}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                              activeSelection?.type === 'chapter' && 
                              activeSelection?.id === chapter.id && 
                              activeSelection?.field === 'endPage' 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-300'
                            }`}
                          />
                          <button 
                            onClick={() => setPageSelectionActive('chapter', chapter.id, 'endPage')}
                            className={`ml-1 p-2 rounded-md ${
                              activeSelection?.type === 'chapter' && 
                              activeSelection?.id === chapter.id && 
                              activeSelection?.field === 'endPage' 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                            }`}
                            title="Click to select from PDF pages"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Topics Section */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-md font-medium text-gray-700">Topics</h4>
                      <button
                        onClick={() => addTopic(chapter.id)}
                        className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
                      >
                        <Plus size={16} className="mr-1" /> Add Topic
                      </button>
                    </div>
                    
                    {chapter.topics.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No topics added yet</p>
                    ) : (
                      <div className="space-y-3">
                        {chapter.topics.map((topic) => (
                          <div 
                            key={topic.id} 
                            className="grid grid-cols-1 md:grid-cols-5 gap-4 py-3 px-3 bg-gray-50 rounded-md"
                          >
                            <div className="md:col-span-3">
                              <div className="flex flex-col">
                                <label className="text-xs text-gray-600 mb-1">Topic Title</label>
                                <div className="flex items-center">
                                  <input
                                    type="text"
                                    value={topic.title}
                                    onChange={(e) => updateTopic(chapter.id, topic.id, 'title', e.target.value)}
                                    placeholder="Enter topic title"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  />
                                </div>
                                <div className="mt-1 text-xs text-gray-500">Pages {topic.startPage}-{topic.endPage}</div>
                              </div>
                            </div>
                            <div>
                              <div className="flex flex-col">
                                <label className="text-xs text-gray-600 mb-1">Start Page</label>
                                <div className="flex">
                                  <input
                                    type="number"
                                    value={topic.startPage}
                                    onChange={(e) => updateTopic(chapter.id, topic.id, 'startPage', e.target.value)}
                                    min={chapter.startPage}
                                    max={chapter.endPage}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                      activeSelection?.type === 'topic' && 
                                      activeSelection?.id === chapter.id && 
                                      activeSelection?.topicId === topic.id && 
                                      activeSelection?.field === 'startPage' 
                                        ? 'border-blue-500 bg-blue-50' 
                                        : 'border-gray-300'
                                    }`}
                                  />
                                  <button 
                                    onClick={() => setPageSelectionActive('topic', chapter.id, 'startPage', topic.id)}
                                    className={`ml-1 p-2 rounded-md ${
                                      activeSelection?.type === 'topic' && 
                                      activeSelection?.id === chapter.id && 
                                      activeSelection?.topicId === topic.id && 
                                      activeSelection?.field === 'startPage' 
                                        ? 'bg-blue-100 text-blue-700' 
                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                                    }`}
                                    title="Click to select from PDF pages"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex flex-col flex-grow">
                                <label className="text-xs text-gray-600 mb-1">End Page</label>
                                <div className="flex">
                                  <input
                                    type="number"
                                    value={topic.endPage}
                                    onChange={(e) => updateTopic(chapter.id, topic.id, 'endPage', e.target.value)}
                                    min={topic.startPage}
                                    max={chapter.endPage}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                      activeSelection?.type === 'topic' && 
                                      activeSelection?.id === chapter.id && 
                                      activeSelection?.topicId === topic.id && 
                                      activeSelection?.field === 'endPage' 
                                        ? 'border-blue-500 bg-blue-50' 
                                        : 'border-gray-300'
                                    }`}
                                  />
                                  <button 
                                    onClick={() => setPageSelectionActive('topic', chapter.id, 'endPage', topic.id)}
                                    className={`ml-1 p-2 rounded-md ${
                                      activeSelection?.type === 'topic' && 
                                      activeSelection?.id === chapter.id && 
                                      activeSelection?.topicId === topic.id && 
                                      activeSelection?.field === 'endPage' 
                                        ? 'bg-blue-100 text-blue-700' 
                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                                    }`}
                                    title="Click to select from PDF pages"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                              <button
                                onClick={() => removeTopic(chapter.id, topic.id)}
                                className="text-red-500 hover:text-red-700 p-2 mt-5"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <button
              onClick={addChapter}
              className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors"
            >
              <Plus size={16} className="mr-2" /> Add Chapter
            </button>
          </div>
          
          {/* PDF Preview */}
          <div>
            {previewPages.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">PDF Pages</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto p-2 border border-gray-200 rounded-lg bg-gray-50">
                  {previewPages.map((page) => (
                    <div 
                      key={page.id} 
                      className={`relative bg-white border rounded-lg overflow-hidden shadow-sm ${
                        activeSelection 
                          ? 'cursor-pointer transform transition-transform hover:scale-105 hover:border-blue-500 hover:shadow-md' 
                          : 'border-gray-300'
                      } transition`}
                      onClick={() => activeSelection && handlePageClick(page.number)}
                    >
                      <div className="h-36 flex items-center justify-center overflow-hidden relative">
                        {page.imageUrl ? (
                          <>
                            <img 
                              src={page.imageUrl} 
                              alt={`Page ${page.number}`} 
                              className="h-full w-full object-contain"
                            />
                            {activeSelection && (
                              <div className="absolute inset-0 hover:bg-blue-500 hover:bg-opacity-20 flex items-center justify-center transition-all">
                                <div className="opacity-0 hover:opacity-100 absolute inset-0 flex items-center justify-center transition-opacity">
                                  <div className="bg-blue-600 text-white px-3 py-1.5 rounded font-medium shadow-lg">
                                    {activeSelection.field === 'startPage' ? 'Set as start page' : 'Set as end page'}
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-gray-400">Page {page.number}</div>
                        )}
                      </div>
                      <div className={`py-2 px-2 text-center ${activeSelection ? 'bg-gray-50' : 'bg-white'} border-t border-gray-300`}>
                        <p className={`text-sm ${activeSelection ? 'font-medium text-blue-700' : 'font-medium text-gray-800'}`}>
                          Page {page.number}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateIndex}
            className="px-5 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center"
          >
            <Check size={18} className="mr-2" /> Create Index
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManualIndexCreator; 