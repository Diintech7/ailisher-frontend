import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import Cookies from 'js-cookie';
import * as pdfjsLib from 'pdfjs-dist';
import { GlobalWorkerOptions } from 'pdfjs-dist';

// Set the worker source for pdfjs
if (typeof window !== 'undefined' && 'pdfjsWorker' in window) {
  GlobalWorkerOptions.workerSrc = window.pdfjsWorker;
} else {
  GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

const uploadToS3 = async (file, title) => {
  try {
    const token = Cookies.get('usertoken');
    if (!token) throw new Error('Authentication required');

    // Request presigned URL
    const presignRes = await fetch(`https://test.ailisher.com/api/datastores/upload-s3`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        fileName: file.name || `${title.replace(/[^\w\s-]/gi, '').replace(/\s+/g, '-')}.pdf`,
        contentType: file.type || 'application/pdf',
      }),
    });

    const presignData = await presignRes.json();
    if (!presignData.success) {
      throw new Error(presignData.message || 'Failed to get S3 upload URL');
    }

    // Upload to S3
    const putRes = await fetch(presignData.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type || 'application/pdf' },
    });
    if (!putRes.ok) throw new Error('Failed to upload file to S3');

    return { url: presignData.downloadUrl, s3Key: presignData.key };
  } catch (error) {
    console.error('S3 upload error:', {
      error: error.message,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });
    throw error;
  }
};

// Helper function to check if a PDF is encrypted
const isPdfEncrypted = async (arrayBuffer) => {
  try {
    // Try loading without the ignoreEncryption flag first
    await PDFDocument.load(arrayBuffer);
    return false; // If it loads without error, it's not encrypted
  } catch (error) {
    // If there's an encryption error, the PDF is encrypted
    if (error.message && error.message.includes('encrypted')) {
      return true;
    }
    // For other errors, it's not an encryption issue
    return false;
  }
};

// New function to validate PDF and recreate if corrupted
const validateAndRecoverPDF = async (arrayBuffer, startPage, endPage, title) => {
  console.log(`Validating and potentially recovering PDF: ${title}, pages ${startPage}-${endPage}`);
  
  // First try normal loading with pdf-lib
  try {
    const pdfDoc = await PDFDocument.load(arrayBuffer, {
      ignoreEncryption: true,
      updateMetadata: false,
      throwOnInvalidObject: false
    });
    
    // If we get here, the PDF loaded successfully with pdf-lib
    const pageCount = pdfDoc.getPageCount();
    
    if (startPage < 1 || endPage > pageCount) {
      throw new Error(`Invalid page range: ${startPage}-${endPage}. PDF has ${pageCount} pages.`);
    }
    
    // Try to copy pages directly first
    try {
      const newPdfDoc = await PDFDocument.create();
      
      // Convert to 0-based indices
      const zeroBasedStartPage = startPage - 1;
      const zeroBasedEndPage = endPage - 1;
      
      // Try bulk copy first
      const pageIndices = [];
      for (let i = zeroBasedStartPage; i <= zeroBasedEndPage; i++) {
        pageIndices.push(i);
      }
      
      const copiedPages = await newPdfDoc.copyPages(pdfDoc, pageIndices);
      copiedPages.forEach(page => newPdfDoc.addPage(page));
      
      // If we get here, the copy was successful
      console.log(`Successfully copied pages ${startPage}-${endPage} with pdf-lib direct method`);
      return await newPdfDoc.save();
    } catch (copyError) {
      console.error("PDF-lib copy error, will try pdfjs method:", copyError);
      // Fall through to pdfjs method
    }
  } catch (pdfLibError) {
    console.error("PDF-lib validation error, will try pdfjs method:", pdfLibError);
    // PDF is likely corrupted, continue to pdfjs approach
  }
  
  // If we're here, the PDF needs reconstruction via pdfjs and canvas
  toast.info(`Reconstructing ${title} using advanced recovery method. This may take a moment...`);
  
  try {
    // Load PDF with pdfjs
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    const totalPages = pdf.numPages;
    if (startPage < 1 || endPage > totalPages) {
      throw new Error(`Invalid page range: ${startPage}-${endPage}. PDF has ${totalPages} pages.`);
    }
    
    // Create a new PDF with pdf-lib
    const newPdfDoc = await PDFDocument.create();
    
    // Process each page in the range
    for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
      try {
        // Get the page
        const page = await pdf.getPage(pageNum);
        
        // Get original viewport dimensions
        const viewport = page.getViewport({ scale: 1.0 });
        const { width, height } = viewport;
        
        // Create a higher resolution viewport for better quality
        const scaledViewport = page.getViewport({ scale: 2.0 });
        
        // Create a canvas
        const canvas = document.createElement('canvas');
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;
        
        // Render to canvas with high quality settings
        const context = canvas.getContext('2d', { alpha: false });
        const renderContext = {
          canvasContext: context,
          viewport: scaledViewport,
          intent: 'print' // Use 'print' for higher quality
        };
        
        await page.render(renderContext).promise;
        
        // Convert to high-quality JPEG
        const imageData = canvas.toDataURL('image/jpeg', 1.0); // Max quality
        
        // Extract the base64 data
        const base64Data = imageData.split(',')[1];
        const imgBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        
        // Embed the image in the new PDF
        const embeddedImage = await newPdfDoc.embedJpg(imgBytes);
        
        // Add a new page with original dimensions
        const newPage = newPdfDoc.addPage([width, height]);
        
        // Draw the image to fill the page
        newPage.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: width,
          height: height
        });
        
        // Add a small page number reference
        const font = await newPdfDoc.embedFont(StandardFonts.Helvetica);
        newPage.drawText(`Page ${pageNum}`, {
          x: 5,
          y: 5,
          size: 6,
          font: font,
          color: rgb(0.6, 0.6, 0.6),
        });
        
        console.log(`Successfully reconstructed page ${pageNum} for ${title}`);
      } catch (pageError) {
        console.error(`Error processing page ${pageNum}:`, pageError);
        // Continue with next page even if one fails
      }
    }
    
    // Check if we successfully added pages
    if (newPdfDoc.getPageCount() === 0) {
      throw new Error('Failed to reconstruct any pages');
    }
    
    // Save the reconstructed PDF
    console.log(`Successfully reconstructed PDF with ${newPdfDoc.getPageCount()} pages`);
    return await newPdfDoc.save();
  } catch (pdfjsError) {
    console.error('PDF.js reconstruction failed:', pdfjsError);
    throw pdfjsError; // Let calling function handle it
  }
};

const IndexPreview = ({ 
  isOpen, 
  onClose, 
  indexData, 
  onUpdateIndex, 
  onSplitPDF, 
  pdfFile, 
  markedPageData,
  bookId
}) => {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingTopicIndex, setEditingTopicIndex] = useState({ chapter: null, topic: null });
  const [editedTitle, setEditedTitle] = useState('');
  const [editedStartPage, setEditedStartPage] = useState('');
  const [editedEndPage, setEditedEndPage] = useState('');
  const [expandedChapters, setExpandedChapters] = useState({});
  const [showSplitPDFs, setShowSplitPDFs] = useState(false);
  const [splitPDFs, setSplitPDFs] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [originalPdfArrayBuffer, setOriginalPdfArrayBuffer] = useState(null);
  const [isEditingIndexAfterSplit, setIsEditingIndexAfterSplit] = useState(false);
  const [isSavingToDatastore, setIsSavingToDatastore] = useState(false);

  // Initialize expanded state for all chapters
  useEffect(() => {
    if (indexData) {
      const expanded = {};
      indexData.forEach((chapter, index) => {
        expanded[index] = true; // Default to expanded
      });
      setExpandedChapters(expanded);
    }
  }, [indexData]);

  // Read the original PDF file when component mounts
  useEffect(() => {
    if (pdfFile) {
      const readFile = async () => {
        try {
          const buffer = await pdfFile.arrayBuffer();
          
          // Check if the PDF is encrypted
          const encrypted = await isPdfEncrypted(buffer);
          if (encrypted) {
            toast.warning('This PDF is encrypted/password-protected. We will try to process it, but some features may not work properly.');
          }
          
          setOriginalPdfArrayBuffer(buffer);
        } catch (error) {
          console.error('Error reading PDF file:', error);
          toast.error('Failed to read the PDF file.');
        }
      };
      readFile();
    }
  }, [pdfFile]);

  // Clean up blob URLs when component unmounts
  useEffect(() => {
    return () => {
      // Revoke any blob URLs when the component unmounts
      splitPDFs.forEach(item => {
        if (item.url && item.url.startsWith('blob:')) {
          URL.revokeObjectURL(item.url);
        }
      });
    };
  }, [splitPDFs]);
  
  // Exit early if modal is not open
  if (!isOpen) return null;

  const handleEditIndex = (index) => {
    const chapter = indexData[index];
    setEditingIndex(index);
    setEditedTitle(chapter.title);
    setEditedStartPage(chapter.startPage);
    setEditedEndPage(chapter.endPage);
    // Clear any topic editing state
    setEditingTopicIndex({ chapter: null, topic: null });
  };

  const handleSaveEdit = (index) => {
    if (editedTitle.trim() === '') {
      toast.error('Title cannot be empty');
      return;
    }
    
    // Validate page numbers
    const startPage = parseInt(editedStartPage);
    const endPage = parseInt(editedEndPage);
    
    if (isNaN(startPage) || isNaN(endPage)) {
      toast.error('Page numbers must be valid integers');
      return;
    }
    
    if (startPage > endPage) {
      toast.error('Start page cannot be greater than end page');
      return;
    }
    
    const updatedIndexData = [...indexData];
    updatedIndexData[index] = {
      ...updatedIndexData[index],
      title: editedTitle,
      startPage,
      endPage
    };
    
    // Also adjust topic page ranges if they're now outside the chapter range
    if (updatedIndexData[index].topics && updatedIndexData[index].topics.length > 0) {
      updatedIndexData[index].topics = updatedIndexData[index].topics.map(topic => {
        let newTopic = { ...topic };
        if (topic.startPage < startPage) newTopic.startPage = startPage;
        if (topic.endPage > endPage) newTopic.endPage = endPage;
        return newTopic;
      });
    }
    
    onUpdateIndex(updatedIndexData);
    setEditingIndex(null);
  };

  const handleEditTopic = (chapterIndex, topicIndex) => {
    const topic = indexData[chapterIndex].topics[topicIndex];
    setEditingTopicIndex({ chapter: chapterIndex, topic: topicIndex });
    setEditedTitle(topic.title);
    setEditedStartPage(topic.startPage);
    setEditedEndPage(topic.endPage);
    // Clear any chapter editing state
    setEditingIndex(null);
  };

  const handleSaveTopicEdit = (chapterIndex, topicIndex) => {
    if (editedTitle.trim() === '') {
      toast.error('Title cannot be empty');
      return;
    }
    
    // Validate page numbers
    const startPage = parseInt(editedStartPage);
    const endPage = parseInt(editedEndPage);
    const chapterStartPage = indexData[chapterIndex].startPage;
    const chapterEndPage = indexData[chapterIndex].endPage;
    
    if (isNaN(startPage) || isNaN(endPage)) {
      toast.error('Page numbers must be valid integers');
      return;
    }
    
    if (startPage > endPage) {
      toast.error('Start page cannot be greater than end page');
      return;
    }
    
    if (startPage < chapterStartPage || endPage > chapterEndPage) {
      toast.error(`Topic pages must be within chapter range (${chapterStartPage}-${chapterEndPage})`);
      return;
    }
    
    const updatedIndexData = [...indexData];
    updatedIndexData[chapterIndex].topics[topicIndex] = {
      ...updatedIndexData[chapterIndex].topics[topicIndex],
      title: editedTitle,
      startPage,
      endPage
    };
    
    onUpdateIndex(updatedIndexData);
    setEditingTopicIndex({ chapter: null, topic: null });
  };

  const handleToggleChapter = (index) => {
    setExpandedChapters(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleAddTopic = (chapterIndex) => {
    const chapter = indexData[chapterIndex];
    
    // Default new topic to start at chapter start and end at chapter end
    const newTopic = {
      title: "New Topic",
      startPage: chapter.startPage,
      endPage: chapter.endPage
    };
    
    const updatedIndexData = [...indexData];
    
    // Initialize topics array if it doesn't exist
    if (!updatedIndexData[chapterIndex].topics) {
      updatedIndexData[chapterIndex].topics = [];
    }
    
    updatedIndexData[chapterIndex].topics.push(newTopic);
    onUpdateIndex(updatedIndexData);
    
    // Immediately edit the new topic
    const newTopicIndex = updatedIndexData[chapterIndex].topics.length - 1;
    handleEditTopic(chapterIndex, newTopicIndex);
  };

  const handleRemoveTopic = (chapterIndex, topicIndex) => {
    const updatedIndexData = [...indexData];
    updatedIndexData[chapterIndex].topics.splice(topicIndex, 1);
    onUpdateIndex(updatedIndexData);
  };

  // Function to create a valid PDF document
  const createPDF = async (title, content) => {
    try {
      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();
      
      // Add a page to the document
      const page = pdfDoc.addPage();
      
      // Get the standard font
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      // Set up page dimensions
      const { width, height } = page.getSize();
      const margin = 50;
      
      // Add title
      page.drawText(title, {
        x: margin,
        y: height - margin,
        size: 24,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      
      // Add content
      page.drawText(content, {
        x: margin,
        y: height - margin - 40,
        size: 12,
        font: font,
        color: rgb(0, 0, 0),
        maxWidth: width - 2 * margin,
        lineHeight: 16,
      });
      
      // Serialize the PDF to bytes
      const pdfBytes = await pdfDoc.save();
      
      return pdfBytes;
    } catch (error) {
      console.error('Error creating PDF:', error);
      throw new Error('Failed to create PDF');
    }
  };

  // Helper function to handle PDFDict errors
  const handlePDFDictError = async (error, startPage, endPage, title) => {
    // Check if it's the specific PDFDict error we're looking for
    if (error.message && error.message.includes('Expected instance of PDFDict')) {
      console.log('Attempting PDFDict error recovery method...');
      
      try {
        // Try a much simpler approach first - just copy the buffer directly
        try {
          // Create a new PDF document with minimal processing
          const pdfDoc = await PDFDocument.load(originalPdfArrayBuffer, {
            ignoreEncryption: true,
            updateMetadata: false,
            throwOnInvalidObject: false  // Important: ignore invalid objects
          });
          
          // Get the pageCount
          const pageCount = pdfDoc.getPageCount();
          
          // Validate page range
          if (startPage > 0 && endPage <= pageCount) {
            // Create a new PDF document
            const newPdfDoc = await PDFDocument.create();
            
            // Convert from 1-indexed to 0-indexed
            const zeroBasedStartPage = startPage - 1;
            const zeroBasedEndPage = endPage - 1;

            // Try to copy all pages at once instead of one by one
            try {
              const pageIndices = [];
              for (let i = zeroBasedStartPage; i <= zeroBasedEndPage; i++) {
                pageIndices.push(i);
              }
              
              const copiedPages = await newPdfDoc.copyPages(pdfDoc, pageIndices);
              copiedPages.forEach(page => {
                newPdfDoc.addPage(page);
              });
              
              // Save and return if successful
              const pdfBytes = await newPdfDoc.save();
              return pdfBytes;
            } catch (bulkCopyError) {
              console.error('Bulk page copy failed:', bulkCopyError);
              // Continue to individual page copy attempt
            }
          }
        } catch (directCopyError) {
          console.error('Direct copy attempt failed:', directCopyError);
          // Continue to next recovery attempt
        }
        
        // If direct copy failed, try to use markedPageData if available
        if (markedPageData && markedPageData.length > 0) {
          console.log('Attempting image-based recovery using markedPageData...');
          
          // Filter pages in our range
          const relevantPages = markedPageData.filter(
            p => p.number >= startPage && p.number <= endPage && p.imageUrl
          );
          
          if (relevantPages.length > 0) {
            // Create a new PDF document
            const newPdfDoc = await PDFDocument.create();
            
            // Add all available page images
            for (const pageData of relevantPages) {
              try {
                // Create a new page
                const page = newPdfDoc.addPage();
                
                // Fetch and embed the image
                const img = await fetch(pageData.imageUrl);
                const imgBytes = await img.arrayBuffer();
                const embeddedImage = await newPdfDoc.embedJpg(imgBytes);
                
                // Get dimensions
                const imgWidth = embeddedImage.width;
                const imgHeight = embeddedImage.height;
                
                // Set page size
                page.setSize(imgWidth, imgHeight);
                
                // Draw the image
                page.drawImage(embeddedImage, {
                  x: 0,
                  y: 0,
                  width: imgWidth,
                  height: imgHeight,
                });
                
                // Add small page number reference at the bottom
                const font = await newPdfDoc.embedFont(StandardFonts.Helvetica);
                page.drawText(`Page ${pageData.number}`, {
                  x: 5,
                  y: 5,
                  size: 8,
                  font: font,
                  color: rgb(0.5, 0.5, 0.5),
                });
              } catch (imgError) {
                console.error(`Failed to add image for page ${pageData.number}:`, imgError);
              }
            }
            
            // If we successfully added any pages, return this PDF
            if (newPdfDoc.getPageCount() > 0) {
              console.log(`Recovered ${newPdfDoc.getPageCount()} pages using images`);
              const pdfBytes = await newPdfDoc.save();
              return pdfBytes;
            }
          }
        }
        
        // Only create a reconstruction notice as a last resort
        // Create a new PDF document
        const newPdfDoc = await PDFDocument.create();
        
        // Add an explanatory note at the beginning
        const page = newPdfDoc.addPage();
        const { width, height } = page.getSize();
        const font = await newPdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await newPdfDoc.embedFont(StandardFonts.HelveticaBold);

        page.drawText(`${title} - PDF Reconstruction`, {
          x: 50,
          y: height - 50,
          size: 18,
          font: boldFont,
          color: rgb(0, 0, 0),
        });

        page.drawText(`Original page range: ${startPage}-${endPage}`, {
          x: 50,
          y: height - 80,
          size: 12,
          font: font,
          color: rgb(0, 0, 0),
        });

        page.drawText(`This PDF was automatically reconstructed due to structural issues in the original PDF.`, {
          x: 50,
          y: height - 110,
          size: 12,
          font: font,
          color: rgb(0, 0, 0),
        });
        
        // Try to add pages as images if we have them
        let imageAdded = false;
        
        if (markedPageData && markedPageData.length > 0) {
          for (let i = startPage; i <= endPage; i++) {
            const pageData = markedPageData.find(p => p.number === i);
            
            if (pageData && pageData.imageUrl) {
              try {
                // Create a new page
                const imgPage = newPdfDoc.addPage();
                
                // Add page number reference
                imgPage.drawText(`Page ${i} from original document`, {
                  x: 50,
                  y: 20,
                  size: 8,
                  font: font,
                  color: rgb(0.5, 0.5, 0.5),
                });
                
                // Fetch and embed the image
                const img = await fetch(pageData.imageUrl);
                const imgBytes = await img.arrayBuffer();
                const embeddedImage = await newPdfDoc.embedJpg(imgBytes);
                
                // Get dimensions and resize page
                const imgWidth = embeddedImage.width;
                const imgHeight = embeddedImage.height;
                
                // Set page size with margins
                imgPage.setSize(imgWidth + 100, imgHeight + 100);
                
                // Draw centered image
                imgPage.drawImage(embeddedImage, {
                  x: 50,
                  y: 50,
                  width: imgWidth,
                  height: imgHeight,
                });
                
                imageAdded = true;
              } catch (imgError) {
                console.error(`Failed to add image for page ${i}:`, imgError);
              }
            }
          }
        }
        
        if (!imageAdded) {
          // Add an explanation if no images could be added
          const errorPage = newPdfDoc.addPage();
          errorPage.drawText("Unable to recover page content from the original PDF.", {
            x: 50,
            y: height - 150,
            size: 12, 
            font: font,
            color: rgb(0.8, 0, 0),
          });
          
          errorPage.drawText("This is usually caused by a corrupted PDF structure or incompatible formatting.", {
            x: 50,
            y: height - 180,
            size: 12,
            font: font,
            color: rgb(0, 0, 0),
          });
        }
        
        // Save the PDF
        const pdfBytes = await newPdfDoc.save();
        return pdfBytes;
      } catch (recoveryError) {
        console.error('Error in special PDFDict recovery method:', recoveryError);
        // Let the calling function fall back to other methods
        throw error;
      }
    } else {
      // Not the specific error we're handling here
      throw error;
    }
  };

  // Modify extractPagesFromPDF function to use the new validation and recovery
  const extractPagesFromPDF = async (startPage, endPage, title) => {
    try {
      if (!originalPdfArrayBuffer) {
        throw new Error('Original PDF not available');
      }
      
      // First, try using our advanced validation and recovery function
      try {
        const pdfBytes = await validateAndRecoverPDF(
          originalPdfArrayBuffer, 
          startPage, 
          endPage, 
          title
        );
        
        // If successful, return the recovered PDF
        return pdfBytes;
      } catch (validationError) {
        console.error(`Validation and recovery failed, trying fallback methods:`, validationError);
        // Continue with existing fallback methods
      }
      
      // Rest of the existing fallback methods...
      // First, try a more direct copy approach with less validation
      try {
        // Use a modified load that is more forgiving
        const pdfDoc = await PDFDocument.load(originalPdfArrayBuffer, { 
          ignoreEncryption: true,
          updateMetadata: false,
          throwOnInvalidObject: false // Ignore invalid objects
        });
        
        const pageCount = pdfDoc.getPageCount();
        
        // Validate page range
        if (startPage < 1 || endPage > pageCount) {
          throw new Error(`Invalid page range: ${startPage}-${endPage}. PDF has ${pageCount} pages.`);
        }
        
        // Create a new PDF document
        const newPdfDoc = await PDFDocument.create();
        
        // Convert from 1-indexed to 0-indexed
        const zeroBasedStartPage = startPage - 1;
        const zeroBasedEndPage = endPage - 1;
        
        // Try to copy all pages at once first - this often works better with some PDFs
        try {
          const pageIndices = [];
          for (let i = zeroBasedStartPage; i <= zeroBasedEndPage; i++) {
            pageIndices.push(i);
          }
          
          const copiedPages = await newPdfDoc.copyPages(pdfDoc, pageIndices);
          copiedPages.forEach(page => {
            newPdfDoc.addPage(page);
          });
          
          const pdfBytes = await newPdfDoc.save();
          return pdfBytes;
        } catch (bulkCopyError) {
          console.error('Bulk page copy failed, trying individual pages:', bulkCopyError);
          // If bulk copy fails, fall back to individual page copy
        }
        
        // Copy pages one by one to handle errors with individual pages
        let atLeastOnePageCopied = false;
        for (let i = zeroBasedStartPage; i <= zeroBasedEndPage; i++) {
          try {
            const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [i]);
            newPdfDoc.addPage(copiedPage);
            atLeastOnePageCopied = true;
          } catch (pageError) {
            console.error(`Error copying page ${i + 1}:`, pageError);
            
            // Check if it's our specific error type
            if (pageError.message && pageError.message.includes('Expected instance of PDFDict')) {
              try {
                // Try specific fix for this page, but don't return immediately
                // Just log that we're going to try another recovery method later
                console.log(`PDFDict error detected on page ${i+1}, will try recovery methods`);
              } catch (recoveryError) {
                // If recovery failed, continue with normal error flow
                console.log('Recovery method failed, continuing with standard methods.');
              }
            }
            
            // Continue with other pages if one fails
          }
        }
        
        if (atLeastOnePageCopied) {
          // Serialize the PDF to bytes
          const pdfBytes = await newPdfDoc.save();
          return pdfBytes;
        } else {
          throw new Error('Failed to copy any pages using Method 1');
        }
      } catch (firstAttemptError) {
        console.error('Error in first extraction attempt:', firstAttemptError);
        // Continue to more aggressive methods
      }
      
      // Always load the original PDF with ignoreEncryption option to handle encrypted PDFs
      const pdfDoc = await PDFDocument.load(originalPdfArrayBuffer, { 
        ignoreEncryption: true  // This allows encrypted PDFs to be loaded
      });
      const pageCount = pdfDoc.getPageCount();
      
      // Validate page range
      if (startPage < 1 || endPage > pageCount) {
        throw new Error(`Invalid page range: ${startPage}-${endPage}. PDF has ${pageCount} pages.`);
      }
      
      // Create a new PDF document
      const newPdfDoc = await PDFDocument.create();
      
      // Convert from 1-indexed to 0-indexed
      const zeroBasedStartPage = startPage - 1;
      const zeroBasedEndPage = endPage - 1;
      
      // Calculate pages to copy
      const pageIndices = [];
      for (let i = zeroBasedStartPage; i <= zeroBasedEndPage; i++) {
        pageIndices.push(i);
      }
      
      // Copy pages one by one to handle errors with individual pages
      let atLeastOnePageCopied = false;
      for (let i = zeroBasedStartPage; i <= zeroBasedEndPage; i++) {
        try {
          const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [i]);
          newPdfDoc.addPage(copiedPage);
          atLeastOnePageCopied = true;
        } catch (pageError) {
          console.error(`Error copying page ${i + 1}:`, pageError);
          
          // Check if it's our specific error type
          if (pageError.message && pageError.message.includes('Expected instance of PDFDict')) {
            try {
              // Try specific fix for this page
              const recoveredPdf = await handlePDFDictError(pageError, startPage, endPage, title);
              // If the recovery was successful, return early
              return recoveredPdf;
            } catch (recoveryError) {
              // If recovery failed, continue with normal error flow
              console.log('Recovery method failed, continuing with standard methods.');
            }
          }
          
          // Continue with other pages if one fails
        }
      }
      
      if (!atLeastOnePageCopied) {
        throw new Error('Failed to copy any pages using Method 1');
      }
      
      // Serialize the PDF to bytes
      const pdfBytes = await newPdfDoc.save();
      return pdfBytes;
      
    } catch (error) {
      // Check if it's our specific error type before trying other methods
      if (error.message && error.message.includes('Expected instance of PDFDict')) {
        try {
          // Try specific fix
          return await handlePDFDictError(error, startPage, endPage, title);
        } catch (recoveryError) {
          // If recovery failed, continue with normal error flow
          console.log('Recovery method failed, trying standard fallback methods.');
        }
      }
      
      console.error('Error extracting PDF pages (method 1):', error);
      
      // For any errors, try a second approach
      try {
        toast.warning('PDF structure issue detected. Trying alternative method...');
        
        // Create a new PDF document
        const newPdfDoc = await PDFDocument.create();
        
        // Try to handle PDFDict errors by parsing the PDF in a different way
        const pdfDoc = await PDFDocument.load(originalPdfArrayBuffer, { 
          ignoreEncryption: true,
          updateMetadata: false,
          throwOnInvalidObject: false, // Important: don't throw on invalid objects
          parseSpeed: PDFDocument.ParseSpeeds.Slow // Use slow parsing for more reliable results
        });
        
        // Calculate page indices (0-based in pdf-lib)
        const zeroBasedStartPage = startPage - 1;
        const zeroBasedEndPage = endPage - 1;
        
        // Try to copy all pages at once first
        try {
          const pageIndices = [];
          for (let i = zeroBasedStartPage; i <= zeroBasedEndPage; i++) {
            pageIndices.push(i);
          }
          
          const copiedPages = await newPdfDoc.copyPages(pdfDoc, pageIndices);
          copiedPages.forEach(page => {
            newPdfDoc.addPage(page);
          });
          
          const pdfBytes = await newPdfDoc.save();
          return pdfBytes;
        } catch (bulkCopyError) {
          console.error('Bulk page copy failed in method 2:', bulkCopyError);
          // Fall back to individual page copy
        }
        
        // Copy pages individually
        let atLeastOnePageCopied = false;
        for (let i = zeroBasedStartPage; i <= zeroBasedEndPage; i++) {
          try {
            // Try to extract just this page
            const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [i]);
            newPdfDoc.addPage(copiedPage);
            atLeastOnePageCopied = true;
          } catch (pageError) {
            console.error(`Method 2: Error copying page ${i + 1}:`, pageError);
            // Continue with other pages even if one fails
          }
        }
        
        if (!atLeastOnePageCopied) {
          throw new Error('Failed to copy any pages using Method 2');
        }
        
        // Save the PDF
        const pdfBytes = await newPdfDoc.save();
        return pdfBytes;
        
      } catch (secondError) {
        console.error('Error in second attempt to extract PDF pages:', secondError);
        
        // If the second method fails, try with a page-by-page approach using separate document instances
        try {
          toast.warning('Using emergency PDF extraction method. This may take longer...');
          
          // First, try to use the markedPageData if available - this is a more reliable approach
          if (markedPageData && markedPageData.length > 0) {
            // Filter pages in our range
            const relevantPages = markedPageData.filter(
              p => p.number >= startPage && p.number <= endPage && p.imageUrl
            );
            
            if (relevantPages.length > 0) {
              // Create a new PDF document
              const newPdfDoc = await PDFDocument.create();
              
              // Add all available page images
              for (const pageData of relevantPages) {
                try {
                  // Create a new page
                  const page = newPdfDoc.addPage();
                  
                  // Fetch and embed the image
                  const img = await fetch(pageData.imageUrl);
                  const imgBytes = await img.arrayBuffer();
                  const embeddedImage = await newPdfDoc.embedJpg(imgBytes);
                  
                  // Get dimensions
                  const imgWidth = embeddedImage.width;
                  const imgHeight = embeddedImage.height;
                  
                  // Set page size
                  page.setSize(imgWidth, imgHeight);
                  
                  // Draw the image
                  page.drawImage(embeddedImage, {
                    x: 0,
                    y: 0,
                    width: imgWidth,
                    height: imgHeight,
                  });
                  
                  // Add small page number reference at the bottom
                  const font = await newPdfDoc.embedFont(StandardFonts.Helvetica);
                  page.drawText(`Page ${pageData.number}`, {
                    x: 5,
                    y: 5,
                    size: 8,
                    font: font,
                    color: rgb(0.5, 0.5, 0.5),
                  });
                } catch (imgError) {
                  console.error(`Failed to add image for page ${pageData.number}:`, imgError);
                }
              }
              
              // If we successfully added any pages, return this PDF
              if (newPdfDoc.getPageCount() > 0) {
                console.log(`Recovered ${newPdfDoc.getPageCount()} pages using images`);
                const pdfBytes = await newPdfDoc.save();
                return pdfBytes;
              }
            }
          }
          
          // If image recovery failed, try our most aggressive method
          // Create a completely new PDF
          const newPdfDoc = await PDFDocument.create();
          
          // Calculate page range
          const zeroBasedStartPage = startPage - 1;
          const zeroBasedEndPage = endPage - 1;
          
          // Keep track of whether we successfully added any pages
          let pagesAdded = 0;
          
          // Try each page individually, creating a separate source document for each attempt
          for (let i = zeroBasedStartPage; i <= zeroBasedEndPage; i++) {
            try {
              // For each page, create a fresh document instance
              const sourcePdfDoc = await PDFDocument.load(originalPdfArrayBuffer, {
                ignoreEncryption: true,
                updateMetadata: false,
                throwOnInvalidObject: false,
                parseSpeed: PDFDocument.ParseSpeeds.Slow
              });
              
              try {
                if (i >= sourcePdfDoc.getPageCount()) {
                  continue; // Skip if page doesn't exist
                }
                
                // Use a proxy document as an intermediary
                const proxyDoc = await PDFDocument.create();
                const [proxyPage] = await proxyDoc.copyPages(sourcePdfDoc, [i]);
                proxyDoc.addPage(proxyPage);
                
                // Then copy from proxy to the final document
                const proxyBytes = await proxyDoc.save();
                const loadedProxy = await PDFDocument.load(proxyBytes);
                const [finalPage] = await newPdfDoc.copyPages(loadedProxy, [0]);
                newPdfDoc.addPage(finalPage);
                
                pagesAdded++;
              } catch (pageCopyError) {
                console.error(`Method 3: Failed to copy page ${i+1}:`, pageCopyError);
                
                // Try one last desperate attempt for this page - render to canvas and back to PDF
                try {
                  // If we have the pdfPages data available, use it to create a page from the image
                  if (markedPageData && markedPageData.length > 0) {
                    const pageData = markedPageData.find(p => p.number === (i + 1));
                    if (pageData && pageData.imageUrl) {
                      // Create a new page in our document with the same dimensions
                      const page = newPdfDoc.addPage();
                      
                      // Load the image
                      const img = await fetch(pageData.imageUrl);
                      const imgBytes = await img.arrayBuffer();
                      const embeddedImage = await newPdfDoc.embedJpg(imgBytes);
                      
                      // Get dimensions
                      const { width, height } = embeddedImage;
                      
                      // Resize page to match image
                      page.setSize(width, height);
                      
                      // Draw the image on the page
                      page.drawImage(embeddedImage, {
                        x: 0,
                        y: 0,
                        width: width,
                        height: height,
                      });
                      
                      pagesAdded++;
                    }
                  }
                } catch (imageError) {
                  console.error(`Failed to create page from image for page ${i+1}:`, imageError);
                }
              }
            } catch (pageError) {
              console.error(`Method 3: Failed to process page ${i+1}:`, pageError);
              // Continue to the next page
            }
          }
          
          if (pagesAdded === 0) {
            // If we couldn't add any pages, create a fallback PDF with error message
            toast.error(`Couldn't extract pages from the PDF. Creating a placeholder.`);
            return createPDF(
              title, 
              `This PDF section (pages ${startPage}-${endPage}) couldn't be extracted due to structural issues in the original PDF.\n\n` +
              `Error message: Expected instance of PDFDict, but got instance of undefined. This usually indicates the PDF has a corrupted structure.`
            );
          }
          
          // Save the PDF with whatever pages we were able to extract
          const pdfBytes = await newPdfDoc.save();
          return pdfBytes;
        } catch (thirdError) {
          console.error('All PDF extraction methods failed:', thirdError);
          // If absolutely all methods fail, create a placeholder PDF with detailed error information
          toast.error(`All extraction methods failed. Creating placeholder for ${title}.`);
          return createPDF(
            title, 
            `This PDF section (pages ${startPage}-${endPage}) couldn't be extracted due to structural issues in the original PDF.\n\n` +
            `Error details: ${error.message || 'Unknown error'}\n\n` +
            `Technical details: PDF structure may be corrupted or non-standard. The error indicates a missing reference in the PDF's internal structure.`
          );
        }
      }
    }
  };

  // New function to detect PDF corruption by checking if first page can be processed
  const detectPDFCorruption = async (arrayBuffer) => {
    console.log('Detecting if PDF is corrupted...');
    
    try {
      // Try loading with pdf-lib first
      const pdfDoc = await PDFDocument.load(arrayBuffer, {
        ignoreEncryption: true,
        updateMetadata: false,
        throwOnInvalidObject: false
      });
      
      // Try extracting the first page
      try {
        const newPdfDoc = await PDFDocument.create();
        const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [0]);
        newPdfDoc.addPage(copiedPage);
        
        // If we successfully copied the first page, the PDF is likely not corrupted
        await newPdfDoc.save();
        console.log('PDF is not corrupted - standard processing will be used');
        return { corrupted: false };
      } catch (copyError) {
        console.error('First page copy failed - PDF may be corrupted:', copyError);
        if (copyError.message && copyError.message.includes('Expected instance of PDFDict')) {
          return { corrupted: true, type: 'PDFDict' };
        }
        return { corrupted: true, type: 'unknown' };
      }
    } catch (loadError) {
      console.error('PDF loading failed - PDF is likely corrupted:', loadError);
      return { corrupted: true, type: loadError.message };
    }
  };

  // Function to process a PDF using canvas-based image reconstruction
  const processCorruptedPDF = async (arrayBuffer, startPage, endPage, title) => {
    console.log(`Processing corrupted PDF using image-based reconstruction: ${title}`);
    toast.info(`Using advanced recovery for ${title}. This may take a moment...`);
    
    try {
      // Load PDF with pdfjs
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      const totalPages = pdf.numPages;
      if (startPage < 1 || endPage > totalPages) {
        throw new Error(`Invalid page range: ${startPage}-${endPage}. PDF has ${totalPages} pages.`);
      }
      
      // Create a new PDF
      const newPdfDoc = await PDFDocument.create();
      
      // Show progress to user
      toast.info(`Reconstructing pages ${startPage}-${endPage}...`);
      
      // Process each page in the range
      for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
        try {
          // Get the page
          const page = await pdf.getPage(pageNum);
          
          // Get original viewport dimensions
          const viewport = page.getViewport({ scale: 1.0 });
          const { width, height } = viewport;
          
          // Create a higher resolution viewport for better quality
          const scaledViewport = page.getViewport({ scale: 2.0 });
          
          // Create a canvas
          const canvas = document.createElement('canvas');
          canvas.width = scaledViewport.width;
          canvas.height = scaledViewport.height;
          
          // Render to canvas with high quality settings
          const context = canvas.getContext('2d', { alpha: false });
          const renderContext = {
            canvasContext: context,
            viewport: scaledViewport,
            intent: 'print' // Use 'print' for higher quality
          };
          
          await page.render(renderContext).promise;
          
          // Convert to high-quality JPEG
          const imageData = canvas.toDataURL('image/jpeg', 1.0); // Max quality
          
          // Extract the base64 data
          const base64Data = imageData.split(',')[1];
          const imgBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
          
          // Embed the image in the new PDF
          const embeddedImage = await newPdfDoc.embedJpg(imgBytes);
          
          // Add a new page with original dimensions
          const newPage = newPdfDoc.addPage([width, height]);
          
          // Draw the image to fill the page
          newPage.drawImage(embeddedImage, {
            x: 0,
            y: 0,
            width: width,
            height: height
          });
        } catch (pageError) {
          console.error(`Error processing page ${pageNum}:`, pageError);
          // Continue with next page even if one fails
        }
      }
      
      // Check if we successfully added pages
      if (newPdfDoc.getPageCount() === 0) {
        throw new Error('Failed to reconstruct any pages');
      }
      
      // Save the reconstructed PDF
      console.log(`Successfully reconstructed PDF with ${newPdfDoc.getPageCount()} pages`);
      return await newPdfDoc.save();
    } catch (error) {
      console.error('Image-based reconstruction failed:', error);
      throw error;
    }
  };

  // Function to process normal (non-corrupted) PDF
  const processNormalPDF = async (arrayBuffer, startPage, endPage, title) => {
    console.log(`Processing normal PDF: ${title}, pages ${startPage}-${endPage}`);
    
    try {
      // Load the PDF
      const pdfDoc = await PDFDocument.load(arrayBuffer, { 
        ignoreEncryption: true,
        updateMetadata: false,
        throwOnInvalidObject: false
      });
      
      const pageCount = pdfDoc.getPageCount();
      
      // Validate page range
      if (startPage < 1 || endPage > pageCount) {
        throw new Error(`Invalid page range: ${startPage}-${endPage}. PDF has ${pageCount} pages.`);
      }
      
      // Create a new PDF document
      const newPdfDoc = await PDFDocument.create();
      
      // Convert from 1-indexed to 0-indexed
      const zeroBasedStartPage = startPage - 1;
      const zeroBasedEndPage = endPage - 1;
      
      // Collect page indices to copy
      const pageIndices = [];
      for (let i = zeroBasedStartPage; i <= zeroBasedEndPage; i++) {
        pageIndices.push(i);
      }
      
      // Try to copy all pages at once first (more efficient)
      try {
        const copiedPages = await newPdfDoc.copyPages(pdfDoc, pageIndices);
        copiedPages.forEach(page => newPdfDoc.addPage(page));
        return await newPdfDoc.save();
      } catch (bulkCopyError) {
        console.error('Bulk page copy failed, trying individual pages:', bulkCopyError);
        
        // If bulk copy fails, fall back to copying pages individually
        let atLeastOnePageCopied = false;
        
        for (let i = zeroBasedStartPage; i <= zeroBasedEndPage; i++) {
          try {
            const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [i]);
            newPdfDoc.addPage(copiedPage);
            atLeastOnePageCopied = true;
          } catch (pageError) {
            console.error(`Error copying page ${i + 1}:`, pageError);
            // Continue with other pages
          }
        }
        
        if (atLeastOnePageCopied) {
          return await newPdfDoc.save();
        } else {
          throw new Error('Failed to copy any pages');
        }
      }
    } catch (error) {
      console.error('Normal PDF processing failed:', error);
      throw error;
    }
  };

  // Replace the handleSplitPDF with an optimized version
  const handleSplitPDF = async () => {
    setIsProcessing(true);
    
    try {
      // Validate that we have the original PDF available
      if (!originalPdfArrayBuffer) {
        toast.error('Original PDF data is not available. Please try re-uploading the PDF.');
        setIsProcessing(false);
        return;
      }

      // First check if the PDF is encrypted and notify the user
      try {
        const isEncrypted = await isPdfEncrypted(originalPdfArrayBuffer);
        if (isEncrypted) {
          toast.info('This PDF is encrypted/password-protected. We will attempt to process it while maintaining the original content.');
        }
      } catch (err) {
        // If even checking encryption fails, warn the user but continue
        toast.warning('This PDF may have structural issues. We will try our best to process it.');
      }

      // Detect if the PDF is corrupted by checking the first page
      let isCorrupted = false;
      try {
        const corruptionCheck = await detectPDFCorruption(originalPdfArrayBuffer);
        isCorrupted = corruptionCheck.corrupted;
        
        if (isCorrupted) {
          toast.warning('PDF structure issues detected. Using advanced recovery method.');
        }
      } catch (detectionError) {
        console.error('Error during corruption detection:', detectionError);
        // Assume corrupted if detection fails
        isCorrupted = true;
      }

      // Call the actual splitting function from props
      const results = await onSplitPDF(indexData);
      
      // Create a flattened array of all splits (chapters and topics)
      const allSplits = [];
      
      // Track any errors that occur during processing
      let errorCount = 0;
      
      // Add chapter-level splits
      for (const chapter of results) {
        try {
          // Create actual PDF byte data
          let pdfBytes;
          
          try {
            // Use the appropriate processing method based on corruption detection
            if (isCorrupted) {
              pdfBytes = await processCorruptedPDF(
                originalPdfArrayBuffer, 
                chapter.startPage, 
                chapter.endPage, 
                chapter.title
              );
            } else {
              pdfBytes = await processNormalPDF(
                originalPdfArrayBuffer, 
                chapter.startPage, 
                chapter.endPage, 
                chapter.title
              );
            }
          } catch (processingError) {
            console.error(`Error processing chapter "${chapter.title}":`, processingError);
            
            // If the chosen method fails, try the other method as fallback
            try {
              toast.warning(`Trying alternative method for chapter "${chapter.title}"...`);
              
              if (isCorrupted) {
                // If corrupted method failed, try normal method
                pdfBytes = await processNormalPDF(
                  originalPdfArrayBuffer, 
                  chapter.startPage, 
                  chapter.endPage, 
                  chapter.title
                );
              } else {
                // If normal method failed, try corrupted method
                pdfBytes = await processCorruptedPDF(
                  originalPdfArrayBuffer, 
                  chapter.startPage, 
                  chapter.endPage, 
                  chapter.title
                );
              }
            } catch (fallbackError) {
              console.error(`Fallback also failed for chapter "${chapter.title}":`, fallbackError);
              // If both methods fail, create a placeholder PDF
              toast.error(`Failed to process chapter "${chapter.title}" after multiple attempts. Using placeholder.`);
              pdfBytes = await createPDF(
                chapter.title, 
                `This PDF section (pages ${chapter.startPage}-${chapter.endPage}) couldn't be extracted due to technical issues.`
              );
            }
          }
          
          // Create blob URL for download
          const blob = new Blob([pdfBytes], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          
          allSplits.push({
            id: `chapter-${chapter.id}`,
            title: chapter.title,
            startPage: chapter.startPage,
            endPage: chapter.endPage,
            url: url,
            isChapter: true
          });
          
          // Add topic-level splits if they exist
          if (chapter.topics && chapter.topics.length > 0) {
            for (const topic of chapter.topics) {
              try {
                // Create actual PDF byte data for topic
                let topicPdfBytes;
                
                try {
                  // Use the appropriate processing method based on corruption detection
                  if (isCorrupted) {
                    topicPdfBytes = await processCorruptedPDF(
                      originalPdfArrayBuffer, 
                      topic.startPage, 
                      topic.endPage, 
                      `${chapter.title} - ${topic.title}`
                    );
                  } else {
                    topicPdfBytes = await processNormalPDF(
                      originalPdfArrayBuffer, 
                      topic.startPage, 
                      topic.endPage, 
                      `${chapter.title} - ${topic.title}`
                    );
                  }
                } catch (processingError) {
                  console.error(`Error processing topic "${topic.title}":`, processingError);
                  
                  // If the chosen method fails, try the other method as fallback
                  try {
                    toast.warning(`Trying alternative method for topic "${topic.title}"...`);
                    
                    if (isCorrupted) {
                      // If corrupted method failed, try normal method
                      topicPdfBytes = await processNormalPDF(
                        originalPdfArrayBuffer, 
                        topic.startPage, 
                        topic.endPage, 
                        `${chapter.title} - ${topic.title}`
                      );
                    } else {
                      // If normal method failed, try corrupted method
                      topicPdfBytes = await processCorruptedPDF(
                        originalPdfArrayBuffer, 
                        topic.startPage, 
                        topic.endPage, 
                        `${chapter.title} - ${topic.title}`
                      );
                    }
                  } catch (fallbackError) {
                    console.error(`Fallback also failed for topic "${topic.title}":`, fallbackError);
                    // If both methods fail, create a placeholder PDF
                    toast.error(`Failed to process topic "${topic.title}" after multiple attempts. Using placeholder.`);
                    topicPdfBytes = await createPDF(
                      `${chapter.title} - ${topic.title}`, 
                      `This PDF section (pages ${topic.startPage}-${topic.endPage}) couldn't be extracted due to technical issues.`
                    );
                  }
                }
                
                // Create blob URL for download
                const topicBlob = new Blob([topicPdfBytes], { type: 'application/pdf' });
                const topicUrl = URL.createObjectURL(topicBlob);
                
                allSplits.push({
                  id: `topic-${chapter.id}-${topic.id}`,
                  title: `${chapter.title} - ${topic.title}`,
                  startPage: topic.startPage,
                  endPage: topic.endPage,
                  url: topicUrl,
                  isChapter: false,
                  parentChapter: chapter.title
                });
              } catch (topicError) {
                console.error(`Error processing topic "${topic.title}":`, topicError);
                toast.error(`Failed to process topic "${topic.title}". Skipping...`);
                errorCount++;
              }
            }
          }
        } catch (chapterError) {
          console.error(`Error processing chapter "${chapter.title}":`, chapterError);
          toast.error(`Failed to process chapter "${chapter.title}". Skipping...`);
          errorCount++;
        }
      }
      
      if (allSplits.length === 0) {
        toast.error('Failed to generate any PDF splits. Please try again with a different PDF.');
        setIsProcessing(false);
        return;
      }
      
      setSplitPDFs(allSplits);
      setShowSplitPDFs(true);
      
      if (errorCount > 0) {
        toast.warning(`PDF split completed with ${errorCount} errors. Some sections may be missing.`);
      } else if (isCorrupted) {
        toast.success('PDF split successfully using advanced recovery method!');
      } else {
        toast.success('PDF split successfully!');
      }
    } catch (error) {
      console.error('Error splitting PDF:', error);
      toast.error('Failed to split PDF: ' + (error.message || 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = (url, filename) => {
    try {
      // Create valid filename
      const sanitizedFilename = filename.replace(/[^\w\s-]/gi, '').replace(/\s+/g, '-') + '.pdf';
      
      // Download the file
      const link = document.createElement('a');
      link.href = url;
      link.download = sanitizedFilename;
      
      // Add to DOM, click, and remove
      document.body.appendChild(link);
      link.click();
      
      // Use a timeout to ensure the browser has time to start the download
      // before removing the link from the DOM
      setTimeout(() => {
        document.body.removeChild(link);
        
        // Note: We do NOT revoke the URL here as it's still needed
        // URL will be revoked when component unmounts or when switching to edit mode
      }, 100);
      
      toast.success(`Downloading ${filename}`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download the file. Please try again.');
    }
  };

  const handleEditIndexAfterSplit = () => {
    // Revoke existing blob URLs before switching back to edit mode
    splitPDFs.forEach(item => {
      if (item.url && item.url.startsWith('blob:')) {
        URL.revokeObjectURL(item.url);
      }
    });
    
    setShowSplitPDFs(false);
    setIsEditingIndexAfterSplit(true);
    toast.info('You can now edit the index structure. Click "Re-Split PDF" when done.');
  };

  const handleReSplitPDF = () => {
    // Show confirmation if needed
    handleSplitPDF();
  };

  // New function to save the split PDFs to the datastore
  const handleSaveToDatastore = async () => {
    if (!bookId) {
      toast.error('Book ID is required to save to datastore');
      return;
    }

    setIsSavingToDatastore(true);
    try {
      const token = Cookies.get('usertoken');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      // First upload all PDFs to S3 and get URLs
      const uploadPromises = splitPDFs.map(async (pdf) => {
        try {
          // Fetch the PDF blob
          const response = await fetch(pdf.url);
          const blob = await response.blob();
          
          // Create a file with proper name
          const file = new File([blob], `${pdf.title.replace(/[^\w\s-]/gi, '')}.pdf`, {
            type: 'application/pdf'
          });
          
          // Upload to S3 (presigned URL flow)
          const uploaded = await uploadToS3(file, pdf.title);
          return { ...pdf, s3Url: uploaded.url, s3Key: uploaded.s3Key };
        } catch (error) {
          console.error(`Error uploading ${pdf.title}:`, error);
          throw error;
        }
      });

      // Wait for all uploads to complete
      const uploadedPDFs = await Promise.all(uploadPromises);

      // Now save to backend
      const saveResponse = await fetch(`https://test.ailisher.com/api/books/${bookId}/save-split-pdfs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          splits: uploadedPDFs.map(pdf => ({
            title: pdf.title,
            startPage: pdf.startPage,
            endPage: pdf.endPage,
            url: pdf.s3Url,
            s3Key: pdf.s3Key,
            isChapter: pdf.isChapter,
            parentChapter: pdf.parentChapter
          }))
        })
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save to database');
      }

      const result = await saveResponse.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to save to database');
      }

      toast.success('Successfully saved to datastore!');
      
      // Close the modal after saving
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('Error saving to datastore:', error);
      toast.error(`Failed to save to datastore: ${error.message}`);
    } finally {
      setIsSavingToDatastore(false);
    }
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-3xl font-bold text-gray-800">
            {showSplitPDFs ? 'Split PDF Files' : 'Extracted Index'}
          </h2>
          <div className="flex gap-3">
            {showSplitPDFs ? (
              <>
                <button 
                  onClick={handleSaveToDatastore}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  disabled={isSavingToDatastore}
                >
                  {isSavingToDatastore ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  ) : (
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                        <path d="M2 20V10a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Z" />
                        <path d="M12 10v6" />
                        <path d="M12 2v4" />
                        <path d="M6 6l6-4 6 4" />
                      </svg>
                      Save to Datastore
                    </span>
                  )}
                </button>
                <button 
                  onClick={handleEditIndexAfterSplit}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                      <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                    </svg>
                    Edit Index
                  </span>
                </button>
                <button 
                  onClick={onClose}
                  className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                    Close
                  </span>
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={onClose}
                  className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                      <path d="m12 19-7-7 7-7"></path>
                      <path d="M19 12H5"></path>
                    </svg>
                    Back to Pages
                  </span>
                </button>
                <button 
                  onClick={isEditingIndexAfterSplit ? handleReSplitPDF : handleSplitPDF}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  ) : (
                    <span className="flex items-center">
                    {isEditingIndexAfterSplit ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                        <path d="M21.5 2v6h-6M21.5 15.5v6h-6"/>
                        <path d="M2.5 8V2h6M2.5 15.5v6h6"/>
                        <path d="M2 12h20M12 2v20"/>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    )}
                    {isEditingIndexAfterSplit ? 'Re-Split PDF' : 'Split PDF'}
                    </span>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {!showSplitPDFs ? (
          <div className="mb-8">
            <p className="text-gray-600 mb-4">
              {isEditingIndexAfterSplit 
                ? 'Edit the index structure to reorganize your PDF. Click "Re-Split PDF" when you\'re done.'
                : 'We\'ve extracted the index information from your marked pages. Review and edit if needed, then click "Split PDF" to process.'}
            </p>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              {indexData && indexData.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {indexData.map((chapter, chapterIndex) => (
                    <li key={`chapter-${chapterIndex}`} className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-grow">
                          <button 
                            onClick={() => handleToggleChapter(chapterIndex)}
                            className="p-1 rounded-md hover:bg-gray-200"
                          >
                            {expandedChapters[chapterIndex] ? (
                              <span className="font-bold">−</span>
                            ) : (
                              <span className="font-bold">+</span>
                            )}
                          </button>
                          
                          {editingIndex === chapterIndex ? (
                            <div className="flex items-center gap-2 flex-grow">
                              <input
                                type="text"
                                value={editedTitle}
                                onChange={(e) => setEditedTitle(e.target.value)}
                                className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Chapter title"
                                autoFocus
                              />
                              <div className="flex items-center">
                                <span className="text-gray-500 mx-2">Pages</span>
                                <input
                                  type="number"
                                  value={editedStartPage}
                                  onChange={(e) => setEditedStartPage(e.target.value)}
                                  className="w-16 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  min="1"
                                />
                                <span className="text-gray-500 mx-2">to</span>
                                <input
                                  type="number"
                                  value={editedEndPage}
                                  onChange={(e) => setEditedEndPage(e.target.value)}
                                  className="w-16 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  min={editedStartPage}
                                />
                              </div>
                              <button 
                                onClick={() => handleSaveEdit(chapterIndex)}
                                className="p-2 text-green-600 hover:text-green-800"
                                title="Save"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                  <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                  <polyline points="7 3 7 8 15 8"></polyline>
                                </svg>
                              </button>
                              <button 
                                onClick={() => setEditingIndex(null)}
                                className="p-2 text-red-600 hover:text-red-800"
                                title="Cancel"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="18" y1="6" x2="6" y2="18"></line>
                                  <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 flex-grow">
                              <span className="font-semibold">
                                {chapter.chapterNum && `${chapter.chapterNum}. `}{chapter.title}
                              </span>
                              <span className="text-gray-500 text-sm">
                                (Pages {chapter.startPage}-{chapter.endPage})
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {editingIndex !== chapterIndex && (
                          <div className="flex items-center">
                            <button 
                              onClick={() => handleAddTopic(chapterIndex)}
                              className="p-2 text-green-600 hover:text-green-800 mr-2"
                              title="Add Topic"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 5v14M5 12h14"></path>
                              </svg>
                            </button>
                            <button 
                              onClick={() => handleEditIndex(chapterIndex)}
                              className="p-2 text-blue-600 hover:text-blue-800"
                              title="Edit Chapter"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {expandedChapters[chapterIndex] && (
                        <ul className="mt-2 pl-8 divide-y divide-gray-100">
                          {chapter.topics && chapter.topics.length > 0 ? (
                            chapter.topics.map((topic, topicIndex) => (
                              <li key={`topic-${chapterIndex}-${topicIndex}`} className="py-2">
                                {editingTopicIndex.chapter === chapterIndex && 
                                 editingTopicIndex.topic === topicIndex ? (
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={editedTitle}
                                      onChange={(e) => setEditedTitle(e.target.value)}
                                      className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder="Topic title"
                                      autoFocus
                                    />
                                    <div className="flex items-center">
                                      <span className="text-gray-500 mx-2">Pages</span>
                                      <input
                                        type="number"
                                        value={editedStartPage}
                                        onChange={(e) => setEditedStartPage(e.target.value)}
                                        className="w-16 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        min={chapter.startPage}
                                        max={chapter.endPage}
                                      />
                                      <span className="text-gray-500 mx-2">to</span>
                                      <input
                                        type="number"
                                        value={editedEndPage}
                                        onChange={(e) => setEditedEndPage(e.target.value)}
                                        className="w-16 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        min={editedStartPage}
                                        max={chapter.endPage}
                                      />
                                    </div>
                                    <button 
                                      onClick={() => handleSaveTopicEdit(chapterIndex, topicIndex)}
                                      className="p-2 text-green-600 hover:text-green-800"
                                      title="Save"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                        <polyline points="7 3 7 8 15 8"></polyline>
                                      </svg>
                                    </button>
                                    <button 
                                      onClick={() => setEditingTopicIndex({ chapter: null, topic: null })}
                                      className="p-2 text-red-600 hover:text-red-800"
                                      title="Cancel"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                      </svg>
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span>• {topic.title}</span>
                                      <span className="text-gray-500 text-sm">
                                        (Pages {topic.startPage}-{topic.endPage})
                                      </span>
                                    </div>
                                    <div className="flex items-center">
                                      <button 
                                        onClick={() => handleEditTopic(chapterIndex, topicIndex)}
                                        className="p-2 text-blue-600 hover:text-blue-800"
                                        title="Edit Topic"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                                        </svg>
                                      </button>
                                      <button 
                                        onClick={() => handleRemoveTopic(chapterIndex, topicIndex)}
                                        className="p-2 text-red-600 hover:text-red-800"
                                        title="Remove Topic"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <line x1="18" y1="6" x2="6" y2="18"></line>
                                          <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </li>
                            ))
                          ) : (
                            <li className="py-2 text-gray-500 italic">No topics in this chapter. Click the + button to add one.</li>
                          )}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No index information extracted. Please try again with different pages.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Split PDF Files</h3>
            {isSavingToDatastore && (
              <div className="mb-4 p-4 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg">
                <div className="flex items-center">
                  <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full mr-3"></div>
                  <p>Saving to datastore... This may take a moment.</p>
                </div>
              </div>
            )}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <ul className="divide-y divide-gray-200">
                {splitPDFs.map((item, index) => (
                  <li key={`split-${index}`} className={`py-4 ${item.isChapter ? '' : 'pl-8 bg-gray-50'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className={`font-medium ${item.isChapter ? 'text-lg' : ''}`}>{item.title}</h4>
                        <p className="text-sm text-gray-500">Pages {item.startPage}-{item.endPage}</p>
                      </div>
                      <button 
                        onClick={() => handleDownload(item.url, item.title)}
                        className="flex items-center px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        <span className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                          Download
                        </span>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IndexPreview; 
