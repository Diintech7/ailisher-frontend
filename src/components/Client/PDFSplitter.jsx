import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, FileText, Loader, Maximize2, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { toast } from 'react-toastify';
// Import necessary modules for PDF handling
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import IndexPreview from './IndexPreview';
import ManualIndexCreator from './ManualIndexCreator';

// Set up the worker for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const PagePreviewModal = ({ isOpen, onClose, currentPage, totalPages, pageUrl, onNext, onPrev, onMarkAsIndex, isMarkedAsIndex }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-4xl p-6 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Page {currentPage} of {totalPages}</h3>
          <div className="flex items-center gap-2">
            <button 
              onClick={onMarkAsIndex}
              className={`px-3 py-2 rounded-md flex items-center gap-1 ${isMarkedAsIndex ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
            >
              {isMarkedAsIndex ? (
                <>
                  <Check size={16} />
                  <span>Marked as Index</span>
                </>
              ) : (
                <span>Mark as Index</span>
              )}
            </button>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-200"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div className="relative flex-grow flex items-center justify-center min-h-[60vh]">
          <img 
            src={pageUrl} 
            alt={`PDF Page ${currentPage}`} 
            className="max-h-[60vh] max-w-full object-contain"
          />
          
          {currentPage > 1 && (
            <button 
              onClick={onPrev}
              className="absolute left-0 p-3 bg-white rounded-full shadow-md hover:bg-gray-100"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          
          {currentPage < totalPages && (
            <button 
              onClick={onNext}
              className="absolute right-0 p-3 bg-white rounded-full shadow-md hover:bg-gray-100"
            >
              <ArrowRight size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const MarkedIndexPageItem = ({ page, onRemove }) => {
  return (
    <div className="relative bg-blue-50 border border-blue-200 rounded-lg overflow-hidden">
      <div className="h-40 flex items-center justify-center overflow-hidden">
        {page.imageUrl ? (
          <img 
            src={page.imageUrl} 
            alt={`Page ${page.number}`} 
            className="h-full w-full object-contain"
          />
        ) : (
          <FileText size={32} className="text-gray-400" />
        )}
      </div>
      <div className="py-2 px-3 text-center bg-white border-t border-blue-200">
        <p className="text-sm text-gray-700">Page {page.number}</p>
      </div>
      <button 
        onClick={() => onRemove(page.id)}
        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
};

const PDFSplitter = ({ isOpen, onClose, bookId }) => {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pdfPages, setPdfPages] = useState([]);
  const [selectedIndexPages, setSelectedIndexPages] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewPage, setPreviewPage] = useState(null);
  const [showIndexPreview, setShowIndexPreview] = useState(false);
  const [extractedIndexData, setExtractedIndexData] = useState(null);
  const [isExtractingIndex, setIsExtractingIndex] = useState(false);
  const [showManualIndexCreator, setShowManualIndexCreator] = useState(false);
  const fileInputRef = useRef(null);

  // Function to extract text from a PDF page
  const extractTextFromPage = async (pdf, pageNumber) => {
    try {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      return textContent.items.map(item => item.str).join(' ');
    } catch (error) {
      console.error(`Error extracting text from page ${pageNumber}:`, error);
      return '';
    }
  };

  // Function to render a PDF page as an image 
  const renderPageAsImage = async (pdf, pageNumber) => {
    try {
      const page = await pdf.getPage(pageNumber);
      const scale = 1.5;
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      await page.render(renderContext).promise;
      
      return {
        id: pageNumber,
        number: pageNumber,
        imageUrl: canvas.toDataURL('image/jpeg', 0.8)
      };
    } catch (error) {
      console.error('Error rendering page:', error);
      return {
        id: pageNumber,
        number: pageNumber,
        imageUrl: null,
        error: true
      };
    }
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setIsLoading(true);
      
      try {
        // Load the PDF document
        const arrayBuffer = await selectedFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        const numPages = pdf.numPages;
        
        // Create an array of page rendering promises
        const pagePromises = [];
        for (let i = 1; i <= numPages; i++) {
          pagePromises.push(renderPageAsImage(pdf, i));
        }
        
        // Render all pages
        const pageImages = await Promise.all(pagePromises);
        setPdfPages(pageImages);
      } catch (error) {
        console.error('Error processing PDF:', error);
        toast.error('Error processing the PDF. Please try another file.');
        setFile(null);
      } finally {
        setIsLoading(false);
      }
    } else {
      toast.error('Please select a valid PDF file');
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      setIsLoading(true);
      
      try {
        // Load the PDF document
        const arrayBuffer = await droppedFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        const numPages = pdf.numPages;
        
        // Create an array of page rendering promises
        const pagePromises = [];
        for (let i = 1; i <= numPages; i++) {
          pagePromises.push(renderPageAsImage(pdf, i));
        }
        
        // Render all pages
        const pageImages = await Promise.all(pagePromises);
        setPdfPages(pageImages);
      } catch (error) {
        console.error('Error processing PDF:', error);
        toast.error('Error processing the PDF. Please try another file.');
        setFile(null);
      } finally {
        setIsLoading(false);
      }
    } else {
      toast.error('Please drop a valid PDF file');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleCancel = () => {
    setFile(null);
    setPdfPages([]);
    setSelectedIndexPages([]);
    setIsLoading(false);
    setShowPreview(false);
    setPreviewPage(null);
    setShowIndexPreview(false);
    setExtractedIndexData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  const toggleIndexPage = (pageId) => {
    setSelectedIndexPages(prev => 
      prev.includes(pageId) 
        ? prev.filter(id => id !== pageId) 
        : [...prev, pageId]
    );
  };

  const removeIndexPage = (pageId) => {
    setSelectedIndexPages(prev => prev.filter(id => id !== pageId));
  };

  const openPagePreview = (page) => {
    setPreviewPage(page);
    setShowPreview(true);
  };

  const closePagePreview = () => {
    setShowPreview(false);
  };

  const handleNextPage = () => {
    if (previewPage && previewPage.number < pdfPages.length) {
      const nextPage = pdfPages.find(page => page.number === previewPage.number + 1);
      if (nextPage) {
        setPreviewPage(nextPage);
      }
    }
  };

  const handlePrevPage = () => {
    if (previewPage && previewPage.number > 1) {
      const prevPage = pdfPages.find(page => page.number === previewPage.number - 1);
      if (prevPage) {
        setPreviewPage(prevPage);
      }
    }
  };

  const handleMarkAsIndex = () => {
    if (previewPage) {
      toggleIndexPage(previewPage.id);
    }
  };

  const handleUpdateIndex = (updatedIndexData) => {
    setExtractedIndexData(updatedIndexData);
  };

  // Extract index using Gemini API
  const handleExtractAndSplit = async () => {
    if (selectedIndexPages.length === 0) {
      toast.warning("Please select at least one index page to extract from");
      return;
    }

    setIsExtractingIndex(true);
    
    try {
      // Get PDF text from selected index pages
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      
      // Sort the selected index pages and extract text from each
      const sortedIndexPages = [...selectedIndexPages].sort((a, b) => a - b);
      const extractPromises = sortedIndexPages.map(pageId => extractTextFromPage(pdf, pageId));
      const pageTexts = await Promise.all(extractPromises);
      
      // Combine all text from index pages
      const textContent = pageTexts.join(' ');
      
      console.log("Sending text to Gemini for index extraction...");
      
      // Use the Gemini API key
      const geminiApiKey = 'AIzaSyCCWtRX--NYoiootIlwWgg28s7n2VCfzDo';
      const modelName = 'gemini-2.0-flash';
      
      console.log("Using Gemini API with model:", modelName);
      
      // Prepare the API call to Gemini
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts:[{
              text: `Extract the chapter and topic information from this table of contents:
              
              ${textContent}
              
              Extract both chapter-level and topic-level information in the following JSON format:
              [
                {
                  "chapterNum": "1", 
                  "title": "CHAPTER TITLE", 
                  "startPage": 9, 
                  "endPage": 15,
                  "topics": [
                    {"title": "Topic 1", "startPage": 9, "endPage": 11},
                    {"title": "Topic 2", "startPage": 12, "endPage": 15}
                  ]
                },
                {
                  "chapterNum": "2", 
                  "title": "ANOTHER CHAPTER", 
                  "startPage": 16, 
                  "endPage": 39,
                  "topics": [
                    {"title": "Topic 1", "startPage": 16, "endPage": 25},
                    {"title": "Topic 2", "startPage": 26, "endPage": 39}
                  ]
                }
              ]
              
              If a chapter doesn't have topics, include an empty "topics" array. Ensure all chapters are included in numerical order.
              For topics, ensure the page ranges are within the chapter's page range.
              If you cannot determine the subtopics, still return the chapter-level information.
              Return ONLY the JSON array with no additional text.`
            }]
          }]
        })
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Received response from Gemini:", data);
      
      // Extract the JSON from Gemini's response
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!textResponse) {
        throw new Error("No text in the response from Gemini");
      }
      
      // Parse the JSON (remove any non-JSON text that might be in the response)
      let jsonStart = textResponse.indexOf('[');
      let jsonEnd = textResponse.lastIndexOf(']') + 1;
      
      if (jsonStart === -1 || jsonEnd === 0) {
        throw new Error("Could not find JSON in Gemini response");
      }
      
      const jsonText = textResponse.substring(jsonStart, jsonEnd);
      const indexData = JSON.parse(jsonText);
      console.log("Parsed index data:", indexData);
      
      setExtractedIndexData(indexData);
      setShowIndexPreview(true);
    } catch (error) {
      console.error("Error extracting index:", error);
      toast.error("Failed to extract index information. Please try again.");
    } finally {
      setIsExtractingIndex(false);
    }
  };

  // Simulating PDF split based on extracted index
  const handleSplitPDF = async (indexData) => {
    // In a real implementation, we would use pdf-lib to split the PDF
    return new Promise((resolve) => {
      setTimeout(() => {
        // Create results with both chapter and topic level splits
        const results = indexData.map((chapter, index) => {
          // Process chapter-level split
          const chapterResult = {
            id: index,
            title: chapter.chapterNum ? `${chapter.chapterNum}. ${chapter.title}` : chapter.title,
            startPage: chapter.startPage,
            endPage: chapter.endPage,
            // In a real implementation, this would be a blob URL for the split PDF
            url: `#chapter-${index + 1}`,
            topics: [] 
          };

          // Process topic-level splits if they exist
          if (chapter.topics && chapter.topics.length > 0) {
            chapterResult.topics = chapter.topics.map((topic, topicIndex) => ({
              id: topicIndex,
              title: topic.title,
              startPage: topic.startPage,
              endPage: topic.endPage,
              // In a real implementation, this would be a blob URL for the split PDF
              url: `#topic-${index + 1}-${topicIndex + 1}`
            }));
          }
          
          return chapterResult;
        });
        
        resolve(results);
      }, 1500);
    });
  };

  const handleManualSplit = () => {
    setShowManualIndexCreator(true);
  };

  const handleManualSplitComplete = (indexData) => {
    setExtractedIndexData(indexData);
    setShowManualIndexCreator(false);
    setShowIndexPreview(true);
  };

  // Get marked index pages for display
  const markedIndexPagesData = selectedIndexPages
    .map(id => pdfPages.find(page => page.id === id))
    .filter(Boolean)
    .sort((a, b) => a.number - b.number);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl p-6">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-800">PDF Splitter</h2>
          <p className="text-gray-600">Split PDF documents based on index pages</p>
        </div>

        {/* Initial Upload UI */}
        {!file && (
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-12 flex flex-col items-center justify-center"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <div className="bg-gray-100 p-4 rounded-full mb-6">
              <Upload size={40} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-700 mb-2">Click to upload or drag & drop</h3>
            <p className="text-gray-500 mb-6">Upload a PDF file</p>
            <input
              type="file"
              ref={fileInputRef}
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current.click()}
              className="bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 transition-colors"
            >
              Split PDF
            </button>
          </div>
        )}

        {/* Loading State */}
        {file && isLoading && (
          <div className="py-12 flex flex-col items-center justify-center">
            <div className="mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
            </div>
            <p className="text-lg text-gray-700">Loading PDF pages, please wait...</p>
          </div>
        )}

        {/* Extraction Loading State */}
        {isExtractingIndex && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[70]">
            <div className="bg-white rounded-xl p-8 flex flex-col items-center">
              <div className="mb-6">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
              </div>
              <p className="text-lg text-gray-700">Extracting index information...</p>
              <p className="text-sm text-gray-500 mt-2">This may take a moment.</p>
            </div>
          </div>
        )}

        {/* PDF Pages View */}
        {file && !isLoading && pdfPages.length > 0 && !showIndexPreview && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">PDF Pages</h3>
                <p className="text-sm text-gray-600">You can mark index pages or directly use Manual Split</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleManualSplit}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
                  disabled={isExtractingIndex}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 0L11.828 15.1a2 2 0 01-.707.707l-4.2 1.4a2 2 0 01-2.422-2.422l1.4-4.2a2 2 0 01.707-.707L15.414 1.414z" />
                  </svg>
                  Manual Split
                </button>
                <button 
                  onClick={handleExtractAndSplit}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  disabled={isExtractingIndex || selectedIndexPages.length === 0}
                >
                  {selectedIndexPages.length === 0 ? 'Mark Pages First' : 'Extract & Split by Index'}
                </button>
              </div>
            </div>

            {/* Marked Index Pages Section */}
            {selectedIndexPages.length > 0 && (
              <div className="mb-8">
                <h4 className="text-lg font-medium text-gray-800 mb-4">Marked Index Pages</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {markedIndexPagesData.map(page => (
                    <MarkedIndexPageItem 
                      key={`marked-${page.id}`} 
                      page={page} 
                      onRemove={removeIndexPage} 
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All Pages Section */}
            <h4 className="text-lg font-medium text-gray-800 mb-4">All Pages <span className="text-sm font-normal text-gray-500">(Click on a page to mark as index, or use the magnifier to preview)</span></h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6 max-h-[60vh] overflow-y-auto p-2">
              {pdfPages.map(page => (
                <div 
                  key={page.id}
                  className={`border rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition group ${
                    selectedIndexPages.includes(page.id) ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-200'
                  }`}
                  onClick={() => toggleIndexPage(page.id)}
                >
                  <div className="relative bg-gray-100 h-40 flex items-center justify-center overflow-hidden">
                    {page.imageUrl ? (
                      <>
                        <img 
                          src={page.imageUrl} 
                          alt={`Page ${page.number}`} 
                          className="h-full w-full object-contain"
                        />
                        <div 
                          className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            openPagePreview(page);
                          }}
                        >
                          <button className="bg-white p-2 rounded-full shadow-lg">
                            <Maximize2 size={16} />
                          </button>
                        </div>
                      </>
                    ) : (
                      <FileText size={32} className="text-gray-400" />
                    )}
                    
                    {selectedIndexPages.includes(page.id) && (
                      <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                        <span className="text-xs font-medium">✓</span>
                      </div>
                    )}
                  </div>
                  <div className="py-2 px-3 text-center bg-white">
                    <p className="text-sm text-gray-700">Page {page.number}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manual Index Creator */}
        {showManualIndexCreator && (
          <ManualIndexCreator
            isOpen={showManualIndexCreator}
            onClose={() => setShowManualIndexCreator(false)}
            pdfPages={pdfPages}
            selectedIndexPages={selectedIndexPages}
            onSplitComplete={handleManualSplitComplete}
            pdfFile={file}
          />
        )}

        {/* Index Preview */}
        {showIndexPreview && (
          <IndexPreview 
            isOpen={showIndexPreview}
            onClose={() => setShowIndexPreview(false)}
            indexData={extractedIndexData}
            onUpdateIndex={handleUpdateIndex}
            onSplitPDF={handleSplitPDF}
            pdfFile={file}
            markedPageData={markedIndexPagesData}
            bookId={bookId}
          />
        )}

        {/* Page Preview Modal */}
        <PagePreviewModal 
          isOpen={showPreview}
          onClose={closePagePreview}
          currentPage={previewPage?.number || 1}
          totalPages={pdfPages.length}
          pageUrl={previewPage?.imageUrl || ''}
          onNext={handleNextPage}
          onPrev={handlePrevPage}
          onMarkAsIndex={handleMarkAsIndex}
          isMarkedAsIndex={previewPage ? selectedIndexPages.includes(previewPage.id) : false}
        />
      </div>
    </div>
  );
};

export default PDFSplitter; 