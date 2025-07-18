"use client"

import { useState, useEffect, useRef } from "react"
import { X, QrCode, FileText, Loader2, AlertTriangle, Download, Eye, CheckSquare, Square } from "lucide-react"
import Cookies from "js-cookie"
import { pdfjs, Document, Page } from "react-pdf"
import "react-pdf/dist/esm/Page/AnnotationLayer.css"
import "react-pdf/dist/esm/Page/TextLayer.css"
import jsPDF from "jspdf"
import { getDocument } from "pdfjs-dist"
import { Dialog } from "../UI/Dialog"

// For react-pdf@9.x, set workerSrc like this:
pdfjs.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/pdf.worker.mjs`

const PrintBookModal = ({ isOpen, onClose, bookId, chapters = [], bookTitle }) => {
  // Multi-chapter selection
  const [selectedChapterIds, setSelectedChapterIds] = useState([])
  const [allPdfs, setAllPdfs] = useState({}) // {chapterId: [pdfs]}
  const [pdfsLoading, setPdfsLoading] = useState(false)
  const [pdfsError, setPdfsError] = useState(null)

  // QR code data for each chapter
  const [qrCodeDataMap, setQrCodeDataMap] = useState({}) // {chapterId: qrData}
  const [qrLoading, setQrLoading] = useState({}) // {chapterId: boolean}
  const [qrError, setQrError] = useState({}) // {chapterId: error}

  const [showQRCodeOverlay, setShowQRCodeOverlay] = useState(false)
  const [expandedPdfId, setExpandedPdfId] = useState(null)
  const [pdfNumPages, setPdfNumPages] = useState({}) // {pdfId: numPages}
  const [selectedPage, setSelectedPage] = useState({}) // {pdfId: pageNumber}
  const [activePdf, setActivePdf] = useState(null) // for main preview

  // Store overlay position/size per page across all chapters
  const [qrOverlayMap, setQrOverlayMap] = useState({}) // key: `${chapterId}_${pdfId}_${page}` => {x, y, size}
  const [qrOverlay, setQrOverlay] = useState({ x: 50, y: 50, size: 120, dragging: false, offsetX: 0, offsetY: 0 })
  const pdfPreviewRef = useRef(null)

  // Track which page the QR overlay is for
  const [qrOverlayPage, setQrOverlayPage] = useState(null) // {chapterId, pdfId, page}

  // Add state for resizing
  const [qrResizing, setQrResizing] = useState(false)
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, size: 0 })

  // Add state for QR overlay focus
  const [qrOverlayFocused, setQrOverlayFocused] = useState(false)
  const hiddenCanvasRef = useRef(null)
  const [downloading, setDownloading] = useState(false)
  const [mergingPdfs, setMergingPdfs] = useState(false)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)

  // Add merge progress state
  const [mergeProgress, setMergeProgress] = useState({ current: 0, total: 0, status: "" })

  // Optimized settings for better layout and quality
  const previewWidth = 450
  const modalPreviewWidth = 400
  const thumbnailWidth = 80
  const canvasScale = 2.0

  // Load PDFs when selected chapters change
  useEffect(() => {
    if (selectedChapterIds.length === 0) {
      setAllPdfs({})
      setExpandedPdfId(null)
      setSelectedPage({})
      setActivePdf(null)
      setShowQRCodeOverlay(false)
      return
    }
    fetchAllPdfs(selectedChapterIds)
  }, [selectedChapterIds])

  // Handle chapter selection
  const handleChapterToggle = (chapterId) => {
    setSelectedChapterIds((prev) => {
      if (prev.includes(chapterId)) {
        return prev.filter((id) => id !== chapterId)
      } else {
        return [...prev, chapterId]
      }
    })
  }

  // Select all chapters
  const handleSelectAllChapters = () => {
    if (selectedChapterIds.length === chapters.length) {
      setSelectedChapterIds([])
    } else {
      setSelectedChapterIds(chapters.map((ch) => ch._id))
    }
  }

  const fetchAllPdfs = async (chapterIds) => {
    setPdfsLoading(true)
    setPdfsError(null)
    setAllPdfs({})

    try {
      const token = Cookies.get("usertoken")
      if (!token) {
        setPdfsError("Authentication required")
        setPdfsLoading(false)
        return
      }

      const pdfPromises = chapterIds.map(async (chapterId) => {
        const endpoint = `http://localhost:5000/api/datastores/chapter/${chapterId}`
        const response = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await response.json()
        if (data.success) {
          const pdfItems = (data.items || []).filter((item) => item.fileType === "application/pdf")
          return { chapterId, pdfs: pdfItems }
        }
        return { chapterId, pdfs: [] }
      })

      const results = await Promise.all(pdfPromises)
      const newAllPdfs = {}
      results.forEach(({ chapterId, pdfs }) => {
        newAllPdfs[chapterId] = pdfs
      })
      setAllPdfs(newAllPdfs)
    } catch (error) {
      setPdfsError("Failed to connect to the server")
    } finally {
      setPdfsLoading(false)
    }
  }

  const fetchQRCode = async (chapterId) => {
    setQrLoading((prev) => ({ ...prev, [chapterId]: true }))
    setQrError((prev) => ({ ...prev, [chapterId]: null }))

    try {
      const token = Cookies.get("usertoken")
      if (!token) {
        setQrError((prev) => ({ ...prev, [chapterId]: "Authentication required" }))
        return
      }

      const endpoint = `http://localhost:5000/api/qrcode/books/${bookId}/chapters/${chapterId}`
      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.success) {
        setQrCodeDataMap((prev) => ({ ...prev, [chapterId]: data }))
      } else {
        setQrError((prev) => ({ ...prev, [chapterId]: data.message || "Failed to fetch QR code" }))
      }
    } catch (error) {
      setQrError((prev) => ({ ...prev, [chapterId]: "Failed to connect to the server" }))
    } finally {
      setQrLoading((prev) => ({ ...prev, [chapterId]: false }))
    }
  }

  // When a PDF card is clicked, expand/collapse its thumbnails
  const handlePdfClick = (pdf, chapterId) => {
    const pdfKey = `${chapterId}_${pdf._id}`
    if (expandedPdfId === pdfKey) {
      setExpandedPdfId(null)
      setActivePdf(null)
      setQrOverlayPage(null)
      setShowQRCodeOverlay(false)
    } else {
      setExpandedPdfId(pdfKey)
      setSelectedPage((prev) => ({ ...prev, [pdf._id]: 1 }))
      setActivePdf({ pdf, page: 1, chapterId })

      // Show QR overlay if it was previously placed for this page
      const key = `${chapterId}_${pdf._id}_1`
      if (qrOverlayMap[key]) {
        setQrOverlay({
          x: qrOverlayMap[key].x,
          y: qrOverlayMap[key].y,
          size: qrOverlayMap[key].size,
          dragging: false,
          offsetX: 0,
          offsetY: 0,
        })
        setShowQRCodeOverlay(true)
        setQrOverlayPage({ chapterId, pdfId: pdf._id, page: 1 })
      } else {
        setShowQRCodeOverlay(false)
        setQrOverlayPage(null)
      }
    }
  }

  // When a page thumbnail is clicked, show it in the main preview
  const handlePageThumbClick = (pdf, pageNum, chapterId) => {
    setSelectedPage((prev) => ({ ...prev, [pdf._id]: pageNum }))
    setActivePdf({ pdf, page: pageNum, chapterId })

    // Show QR overlay if it was previously placed for this page
    const key = `${chapterId}_${pdf._id}_${pageNum}`
    if (qrOverlayMap[key]) {
      setQrOverlay({
        x: qrOverlayMap[key].x,
        y: qrOverlayMap[key].y,
        size: qrOverlayMap[key].size,
        dragging: false,
        offsetX: 0,
        offsetY: 0,
      })
      setShowQRCodeOverlay(true)
      setQrOverlayPage({ chapterId, pdfId: pdf._id, page: pageNum })
    } else {
      setShowQRCodeOverlay(false)
      setQrOverlayPage(null)
    }
  }

  // When QR icon is clicked, show overlay only for the current page
  const handleQrIconClick = (chapterId) => {
    if (!activePdf || activePdf.chapterId !== chapterId) return

    // Fetch QR code if not already loaded
    if (!qrCodeDataMap[chapterId]) {
      fetchQRCode(chapterId)
    }

    const key = `${chapterId}_${activePdf.pdf._id}_${activePdf.page}`
    if (showQRCodeOverlay && qrOverlayPage && qrOverlayPage.chapterId === chapterId) {
      setShowQRCodeOverlay(false)
      setQrOverlayPage(null)
    } else {
      // Restore overlay position/size if exists
      const saved = qrOverlayMap[key]
      setQrOverlay({
        x: saved?.x ?? 50,
        y: saved?.y ?? 50,
        size: saved?.size ?? 120,
        dragging: false,
        offsetX: 0,
        offsetY: 0,
      })
      setShowQRCodeOverlay(true)
      setQrOverlayPage({ chapterId, pdfId: activePdf.pdf._id, page: activePdf.page })
    }
  }

  // QR overlay drag logic
  const handleQrMouseDown = (e) => {
    e.preventDefault()
    setQrOverlay((prev) => ({ ...prev, dragging: true, offsetX: e.clientX - prev.x, offsetY: e.clientY - prev.y }))
  }

  // Save overlay position/size when dragging ends
  useEffect(() => {
    const handleMouseUp = () => {
      setQrOverlay((prev) => {
        if (prev.dragging && qrOverlayPage) {
          const key = `${qrOverlayPage.chapterId}_${qrOverlayPage.pdfId}_${qrOverlayPage.page}`
          setQrOverlayMap((map) => ({ ...map, [key]: { x: prev.x, y: prev.y, size: prev.size } }))
        }
        return { ...prev, dragging: false }
      })
    }
    const handleMouseMove = (e) => {
      setQrOverlay((prev) => {
        if (!prev.dragging) return prev
        const newX = e.clientX - prev.offsetX
        const newY = e.clientY - prev.offsetY
        return { ...prev, x: newX, y: newY }
      })
    }
    if (qrOverlay.dragging) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [qrOverlay.dragging, qrOverlayPage])

  // Add resize handle mouse events
  const handleResizeMouseDown = (e) => {
    e.stopPropagation()
    e.preventDefault()
    setQrResizing(true)
    setResizeStart({ x: e.clientX, y: e.clientY, size: qrOverlay.size })
  }

  useEffect(() => {
    if (!qrResizing) return
    const handleMouseMove = (e) => {
      const delta = Math.max(e.clientX - resizeStart.x, e.clientY - resizeStart.y)
      const newSize = Math.max(60, resizeStart.size + delta)
      setQrOverlay((prev) => {
        if (qrOverlayPage) {
          const key = `${qrOverlayPage.chapterId}_${qrOverlayPage.pdfId}_${qrOverlayPage.page}`
          setQrOverlayMap((map) => ({ ...map, [key]: { x: prev.x, y: prev.y, size: newSize } }))
        }
        return { ...prev, size: newSize }
      })
    }
    const handleMouseUp = () => {
      setQrResizing(false)
    }
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [qrResizing, resizeStart, qrOverlayPage])

  // When QR overlay is clicked, set focus
  const handleQrOverlayClick = (e) => {
    e.stopPropagation()
    setQrOverlayFocused(true)
  }

  // When clicking anywhere else, remove focus
  useEffect(() => {
    if (!showQRCodeOverlay) return
    const handleClick = (e) => {
      setQrOverlayFocused(false)
    }
    window.addEventListener("mousedown", handleClick)
    return () => window.removeEventListener("mousedown", handleClick)
  }, [showQRCodeOverlay])

  function onDocumentLoadSuccess(pdfId, { numPages }) {
    setPdfNumPages((prev) => ({ ...prev, [pdfId]: numPages }))
  }

  // Single PDF download function
  const handleDownloadPdf = async () => {
    if (!activePdf) {
      alert("Please select a PDF first!")
      return
    }

    if (!hiddenCanvasRef.current) {
      alert("Canvas not ready. Please try again.")
      return
    }

    setDownloading(true)

    try {
      console.log("Starting single PDF download process...")
      const { pdf, chapterId } = activePdf
      const qrCodeData = qrCodeDataMap[chapterId]

      const outputPdf = await generatePdfWithQR(pdf, chapterId, qrCodeData)

      // Generate filename
      const fileName = `${pdf.title || pdf.name || "document"}_with_QR.pdf`
      outputPdf.save(fileName)

      alert("PDF downloaded successfully!")
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert(`Failed to generate PDF: ${error.message}`)
    } finally {
      setDownloading(false)
    }
  }

  // Fixed Merge all PDFs function - properly processes each page
  const handleMergeAllPdfs = async () => {
    if (selectedChapterIds.length === 0) {
      alert("Please select at least one chapter!")
      return
    }

    if (!hiddenCanvasRef.current) {
      alert("Canvas not ready. Please try again.")
      return
    }

    setMergingPdfs(true)
    setMergeProgress({ current: 0, total: 0, status: "Initializing..." })

    try {
      console.log("Starting merge all PDFs process...")

      // Calculate total pages to process
      let totalPages = 0
      const processingQueue = []

      for (const chapterId of selectedChapterIds) {
        const chapterPdfs = allPdfs[chapterId] || []
        const qrCodeData = qrCodeDataMap[chapterId]

        for (const pdf of chapterPdfs) {
          // Load PDF to get page count
          const loadingTask = getDocument(pdf.url)
          const pdfDoc = await loadingTask.promise
          const numPages = pdfDoc.numPages
          totalPages += numPages

          processingQueue.push({
            pdf,
            chapterId,
            qrCodeData,
            pdfDoc,
            numPages,
          })
        }
      }

      setMergeProgress({ current: 0, total: totalPages, status: "Processing pages..." })

      let mergedPdf = null
      let processedPages = 0
      const canvas = hiddenCanvasRef.current
      const ctx = canvas.getContext("2d")

      // Process each PDF in the queue
      for (const { pdf, chapterId, qrCodeData, pdfDoc, numPages } of processingQueue) {
        console.log(`Processing PDF: ${pdf.title || pdf.name} (${numPages} pages)`)

        // Process each page of the current PDF
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          setMergeProgress({
            current: processedPages + 1,
            total: totalPages,
            status: `Processing ${pdf.title || pdf.name} - Page ${pageNum}/${numPages}`,
          })

          // Get the page
          const page = await pdfDoc.getPage(pageNum)
          const viewport = page.getViewport({ scale: canvasScale })

          // Set canvas dimensions
          canvas.width = viewport.width
          canvas.height = viewport.height

          // Clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height)

          // Render PDF page to canvas
          await page.render({
            canvasContext: ctx,
            viewport: viewport,
          }).promise

          // Check if this page has a QR code overlay
          const qrKey = `${chapterId}_${pdf._id}_${pageNum}`
          const qrOverlayData = qrOverlayMap[qrKey]

          if (qrOverlayData && qrCodeData?.qrCodeDataURL) {
            console.log(`Adding QR code to page ${pageNum} of ${pdf.title || pdf.name}`)

            // Get the original page dimensions (scale 1)
            const originalViewport = page.getViewport({ scale: 1 })

            // Calculate how react-pdf renders the page at previewWidth
            const previewScale = previewWidth / originalViewport.width
            const actualPreviewHeight = originalViewport.height * previewScale

            // Calculate scaling factors from preview to canvas
            const scaleX = canvas.width / previewWidth
            const scaleY = canvas.height / actualPreviewHeight

            // Calculate exact QR position and size for the canvas
            const qrX = qrOverlayData.x * scaleX
            const qrY = qrOverlayData.y * scaleY
            const qrWidth = qrOverlayData.size * scaleX
            const qrHeight = qrOverlayData.size * scaleY

            // Create QR image
            const qrImg = new Image()
            qrImg.crossOrigin = "anonymous"

            await new Promise((resolve, reject) => {
              qrImg.onload = () => {
                // Draw white background for QR with small padding
                const padding = 4
                ctx.fillStyle = "white"
                ctx.fillRect(qrX - padding, qrY - padding, qrWidth + padding * 2, qrHeight + padding * 2)

                // Draw QR code at exact position and size
                ctx.drawImage(qrImg, qrX, qrY, qrWidth, qrHeight)
                resolve()
              }
              qrImg.onerror = reject
              qrImg.src = qrCodeData.qrCodeDataURL
            })
          }

          // Convert canvas to image data
          const imgData = canvas.toDataURL("image/jpeg", 0.95)

          // Create merged PDF or add page to existing one
          if (!mergedPdf) {
            // First page - create new PDF
            mergedPdf = new jsPDF({
              unit: "px",
              format: [canvas.width, canvas.height],
            })
            mergedPdf.addImage(imgData, "JPEG", 0, 0, canvas.width, canvas.height)
          } else {
            // Add new page to existing PDF
            mergedPdf.addPage([canvas.width, canvas.height])
            mergedPdf.addImage(imgData, "JPEG", 0, 0, canvas.width, canvas.height)
          }

          processedPages++
        }
      }

      if (mergedPdf) {
        setMergeProgress({
          current: totalPages,
          total: totalPages,
          status: "Finalizing PDF...",
        })

        // Generate filename with book title and timestamp
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-")
        const fileName = `${bookTitle || "Book"}_All_Chapters_with_QR_${timestamp}.pdf`

        mergedPdf.save(fileName)
        alert(`Successfully merged ${totalPages} pages from ${selectedChapterIds.length} chapters!`)
      } else {
        alert("No PDFs found to merge!")
      }
    } catch (error) {
      console.error("Error merging PDFs:", error)
      alert(`Failed to merge PDFs: ${error.message}`)
    } finally {
      setMergingPdfs(false)
      setMergeProgress({ current: 0, total: 0, status: "" })
    }
  }

  // Helper function to generate PDF with QR codes
  const generatePdfWithQR = async (pdf, chapterId, qrCodeData, shouldSave = true) => {
    const pdfUrl = pdf.url
    const pdfId = pdf._id

    // Load the PDF document
    const loadingTask = getDocument(pdfUrl)
    const pdfDoc = await loadingTask.promise
    const numPages = pdfDoc.numPages

    let outputPdf = null
    const canvas = hiddenCanvasRef.current
    const ctx = canvas.getContext("2d")

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      // Get the page
      const page = await pdfDoc.getPage(pageNum)
      const viewport = page.getViewport({ scale: canvasScale })

      // Set canvas dimensions
      canvas.width = viewport.width
      canvas.height = viewport.height

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Render PDF page to canvas
      await page.render({
        canvasContext: ctx,
        viewport: viewport,
      }).promise

      // Check if this page has a QR code overlay
      const qrKey = `${chapterId}_${pdfId}_${pageNum}`
      const qrOverlayData = qrOverlayMap[qrKey]

      if (qrOverlayData && qrCodeData?.qrCodeDataURL) {
        // Get the original page dimensions (scale 1)
        const originalViewport = page.getViewport({ scale: 1 })

        // Calculate how react-pdf renders the page at previewWidth
        const previewScale = previewWidth / originalViewport.width
        const actualPreviewHeight = originalViewport.height * previewScale

        // Calculate scaling factors from preview to canvas
        const scaleX = canvas.width / previewWidth
        const scaleY = canvas.height / actualPreviewHeight

        // Calculate exact QR position and size for the canvas
        const qrX = qrOverlayData.x * scaleX
        const qrY = qrOverlayData.y * scaleY
        const qrWidth = qrOverlayData.size * scaleX
        const qrHeight = qrOverlayData.size * scaleY

        // Create QR image
        const qrImg = new Image()
        qrImg.crossOrigin = "anonymous"

        await new Promise((resolve, reject) => {
          qrImg.onload = () => {
            // Draw white background for QR with small padding
            const padding = 4
            ctx.fillStyle = "white"
            ctx.fillRect(qrX - padding, qrY - padding, qrWidth + padding * 2, qrHeight + padding * 2)

            // Draw QR code at exact position and size
            ctx.drawImage(qrImg, qrX, qrY, qrWidth, qrHeight)
            resolve()
          }
          qrImg.onerror = reject
          qrImg.src = qrCodeData.qrCodeDataURL
        })
      }

      // Convert canvas to image data
      const imgData = canvas.toDataURL("image/jpeg", 0.95)

      // Create or add to PDF
      if (pageNum === 1) {
        outputPdf = new jsPDF({
          unit: "px",
          format: [canvas.width, canvas.height],
        })
        outputPdf.addImage(imgData, "JPEG", 0, 0, canvas.width, canvas.height)
      } else {
        outputPdf.addPage([canvas.width, canvas.height])
        outputPdf.addImage(imgData, "JPEG", 0, 0, canvas.width, canvas.height)
      }
    }

    return outputPdf
  }

  // Preview function - shows modal with preview
  const handlePreviewPdf = () => {
    if (!activePdf) {
      alert("Please select a PDF first!")
      return
    }
    setPreviewModalOpen(true)
  }

  // Get total QR count
  const getTotalQRCount = () => {
    return Object.keys(qrOverlayMap).length
  }

  // Get total PDF count
  const getTotalPdfCount = () => {
    return selectedChapterIds.reduce((total, chapterId) => {
      return total + (allPdfs[chapterId]?.length || 0)
    }, 0)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-stretch bg-black bg-opacity-60">
      <div className="relative bg-white w-full h-full flex rounded-none shadow-2xl">
        {/* Left: Chapter List with Multi-Selection */}
        <div className="w-1/4 min-w-[220px] border-r border-gray-200 bg-gray-50 p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Chapters</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200">
              <X size={22} />
            </button>
          </div>

          {/* Select All Button */}
          <div className="mb-4">
            <button
              onClick={handleSelectAllChapters}
              className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              {selectedChapterIds.length === chapters.length ? <CheckSquare size={16} /> : <Square size={16} />}
              {selectedChapterIds.length === chapters.length ? "Deselect All" : "Select All"}
            </button>
            <p className="text-xs text-gray-500 mt-1">
              {selectedChapterIds.length} of {chapters.length} chapters selected
            </p>
          </div>

          <ul className="space-y-2">
            {chapters.map((chapter) => (
              <li key={chapter._id} className="flex items-center justify-between group">
                <div className="flex items-center flex-1">
                  <button onClick={() => handleChapterToggle(chapter._id)} className="mr-3 p-1">
                    {selectedChapterIds.includes(chapter._id) ? (
                      <CheckSquare size={18} className="text-indigo-600" />
                    ) : (
                      <Square size={18} className="text-gray-400" />
                    )}
                  </button>
                  <button
                    className={`flex-1 text-left px-3 py-2 rounded-md transition-colors ${selectedChapterIds.includes(chapter._id) ? "bg-indigo-100 text-indigo-700 font-semibold" : "hover:bg-gray-200 text-gray-800"}`}
                    onClick={() => handleChapterToggle(chapter._id)}
                  >
                    {chapter.title}
                  </button>
                </div>
                <button
                  className={`ml-2 p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-full transition-colors ${showQRCodeOverlay && qrOverlayPage && activePdf && qrOverlayPage.chapterId === chapter._id ? "bg-amber-100" : ""}`}
                  title="Show QR Code"
                  onClick={() => handleQrIconClick(chapter._id)}
                  disabled={!selectedChapterIds.includes(chapter._id)}
                >
                  <QrCode size={18} />
                </button>
              </li>
            ))}
          </ul>

          {/* Summary Stats */}
          {selectedChapterIds.length > 0 && (
            <div className="mt-6 p-3 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">Summary</h3>
              <p className="text-xs text-blue-600">
                • {selectedChapterIds.length} chapters selected
                <br />• {getTotalPdfCount()} total PDFs
                <br />• {getTotalQRCount()} QR codes placed
              </p>
            </div>
          )}
        </div>

        {/* Middle: PDF sidebar */}
        <div className="w-46 max-w-46 border-r border-gray-200 bg-white p-4 overflow-y-auto flex flex-col gap-2">
          {pdfsLoading ? (
            <div className="flex items-center text-gray-500">
              <Loader2 className="animate-spin mr-2" /> Loading PDFs...
            </div>
          ) : pdfsError ? (
            <div className="flex items-center text-red-500">
              <AlertTriangle className="mr-2" /> {pdfsError}
            </div>
          ) : selectedChapterIds.length === 0 ? (
            <div className="text-gray-500 text-center">
              <FileText size={32} className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Select chapters to view PDFs</p>
            </div>
          ) : (
            selectedChapterIds.map((chapterId) => {
              const chapter = chapters.find((ch) => ch._id === chapterId)
              const chapterPdfs = allPdfs[chapterId] || []

              return (
                <div key={chapterId} className="mb-4">
                  <h3 className="text-xs font-semibold text-gray-600 mb-2 px-2">
                    {chapter?.title} ({chapterPdfs.length} PDFs)
                  </h3>
                  {chapterPdfs.map((pdf) => (
                    <div key={`${chapterId}_${pdf._id}`} className="mb-2">
                      <div
                        className={`flex flex-col items-center p-2 rounded cursor-pointer transition-colors ${expandedPdfId === `${chapterId}_${pdf._id}` ? "bg-indigo-50" : "hover:bg-gray-100"}`}
                        onClick={() => handlePdfClick(pdf, chapterId)}
                      >
                        <FileText size={32} className="text-red-500 mb-1" />
                        <div
                          className="text-xs text-center text-gray-800 truncate w-full"
                          title={pdf.title || pdf.name}
                        >
                          {pdf.title || pdf.name}
                        </div>
                        <div className="text-[10px] text-indigo-600 mt-1">Click to view pages</div>
                      </div>
                      {/* Show thumbnails below this PDF if expanded */}
                      {expandedPdfId === `${chapterId}_${pdf._id}` && (
                        <div className="mt-2 flex flex-col gap-1 overflow-y-auto max-h-[50vh] border-t pt-2">
                          <Document
                            file={pdf.url}
                            onLoadSuccess={(info) => onDocumentLoadSuccess(pdf._id, info)}
                            loading={
                              <div className="text-gray-500 flex items-center">
                                <Loader2 className="animate-spin mr-2" />
                                Loading PDF...
                              </div>
                            }
                            error={
                              <div className="text-red-500 flex items-center">
                                <AlertTriangle className="mr-2" />
                                Failed to load PDF.
                              </div>
                            }
                          >
                            {Array.from(new Array(pdfNumPages[pdf._id] || 0), (el, index) => (
                              <div
                                key={`thumb_${index + 1}`}
                                className={`border rounded shadow-sm overflow-hidden mb-1 cursor-pointer relative ${selectedPage[pdf._id] === index + 1 ? "ring-2 ring-indigo-500" : ""}`}
                                onClick={() => handlePageThumbClick(pdf, index + 1, chapterId)}
                              >
                                <Page
                                  pageNumber={index + 1}
                                  width={thumbnailWidth}
                                  renderTextLayer={false}
                                  renderAnnotationLayer={false}
                                />
                                <div className="text-[10px] text-center text-gray-600 py-0.5">{index + 1}</div>
                                {/* Show QR indicator on thumbnail if QR is placed */}
                                {qrOverlayMap[`${chapterId}_${pdf._id}_${index + 1}`] && (
                                  <div className="absolute top-1 right-1 bg-amber-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px]">
                                    QR
                                  </div>
                                )}
                              </div>
                            ))}
                          </Document>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            })
          )}
        </div>

        {/* Right: Main preview area with proper sizing */}
        <div className="flex-1 flex flex-col bg-gray-50 h-full">
          {/* Fixed Header with Buttons */}
          <div className="bg-white border-b border-gray-200 p-3 flex justify-between items-center flex-shrink-0">
            <div className="text-sm font-semibold text-gray-800 truncate">
              {activePdf ? `${activePdf.pdf.title || activePdf.pdf.name} - Page ${activePdf.page}` : "PDF Preview"}
            </div>
            <div className="flex gap-2">
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded shadow text-sm font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handlePreviewPdf}
                disabled={!activePdf}
              >
                <Eye size={14} />
                Preview
              </button>
              <button
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded shadow text-sm font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleDownloadPdf}
                disabled={!activePdf || downloading}
              >
                {downloading ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
                Download PDF
              </button>
              <button
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded shadow text-sm font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleMergeAllPdfs}
                disabled={selectedChapterIds.length === 0 || mergingPdfs}
              >
                {mergingPdfs ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
                Merge All PDFs
              </button>
            </div>
          </div>

          {/* Progress indicator for merge operation */}
          {mergingPdfs && (
            <div className="bg-blue-50 border-b border-blue-200 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-800">Merging PDFs...</span>
                <span className="text-sm text-blue-600">
                  {mergeProgress.current} / {mergeProgress.total} pages
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: mergeProgress.total > 0 ? `${(mergeProgress.current / mergeProgress.total) * 100}%` : "0%",
                  }}
                ></div>
              </div>
              <p className="text-xs text-blue-600 mt-1">{mergeProgress.status}</p>
            </div>
          )}

          {/* PDF Preview Content Area - Properly sized */}
          <div className="flex-1 flex items-center justify-center p-4 overflow-auto" ref={pdfPreviewRef}>
            {/* Hidden canvas for PDF generation */}
            <canvas ref={hiddenCanvasRef} style={{ display: "none" }} />

            {activePdf ? (
              <div className="relative bg-white shadow-lg rounded-lg overflow-hidden max-w-full max-h-full">
                <Document
                  file={activePdf.pdf.url}
                  loading={
                    <div className="flex items-center justify-center p-8 text-gray-500">
                      <Loader2 className="animate-spin mr-2" />
                      Loading PDF...
                    </div>
                  }
                  error={
                    <div className="flex items-center justify-center p-8 text-red-500">
                      <AlertTriangle className="mr-2" />
                      Failed to load PDF.
                    </div>
                  }
                >
                  <Page pageNumber={activePdf.page} width={previewWidth} />
                </Document>

                {/* QR Code Overlay */}
                {showQRCodeOverlay &&
                  qrOverlayPage &&
                  activePdf &&
                  qrOverlayPage.chapterId === activePdf.chapterId &&
                  qrOverlayPage.pdfId === activePdf.pdf._id &&
                  qrOverlayPage.page === activePdf.page && (
                    <>
                      {qrLoading[activePdf.chapterId] ? (
                        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded shadow-lg z-50">
                          <Loader2 className="animate-spin mr-2" /> Loading QR code...
                        </div>
                      ) : qrError[activePdf.chapterId] ? (
                        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded shadow-lg z-50 text-red-500">
                          <AlertTriangle className="mr-2" /> {qrError[activePdf.chapterId]}
                        </div>
                      ) : qrCodeDataMap[activePdf.chapterId]?.qrCodeDataURL ? (
                        <div
                          className="absolute z-50 flex flex-col items-center"
                          style={{ left: qrOverlay.x, top: qrOverlay.y, width: qrOverlay.size, height: qrOverlay.size }}
                          onMouseDown={handleQrMouseDown}
                          onClick={handleQrOverlayClick}
                        >
                          {/* Show border, close, resize only if focused */}
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              border: qrOverlayFocused ? "2px solid #FFD600" : "2px solid transparent",
                              borderRadius: 8,
                              position: "relative",
                              background: "white",
                              boxSizing: "border-box",
                              userSelect: "none",
                            }}
                          >
                            {/* Close (X) button at top-right */}
                            {qrOverlayFocused && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setShowQRCodeOverlay(false)
                                  setQrOverlayPage(null)
                                  setQrOverlayFocused(false)
                                  // Remove from overlay map
                                  if (qrOverlayPage) {
                                    const key = `${qrOverlayPage.chapterId}_${qrOverlayPage.pdfId}_${qrOverlayPage.page}`
                                    setQrOverlayMap((map) => {
                                      const newMap = { ...map }
                                      delete newMap[key]
                                      return newMap
                                    })
                                  }
                                }}
                                style={{
                                  position: "absolute",
                                  top: 2,
                                  right: 2,
                                  background: "#FFD600",
                                  border: "none",
                                  borderRadius: "50%",
                                  width: 20,
                                  height: 20,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  cursor: "pointer",
                                  zIndex: 2,
                                }}
                                title="Remove QR"
                              >
                                <X size={12} />
                              </button>
                            )}
                            {/* QR image */}
                            <img
                              src={qrCodeDataMap[activePdf.chapterId]?.qrCodeDataURL || "/placeholder.svg"}
                              alt="Chapter QR Code"
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "contain",
                                pointerEvents: "none",
                                borderRadius: 6,
                              }}
                            />
                            {/* Resize handle at bottom-right corner */}
                            {qrOverlayFocused && (
                              <div
                                onMouseDown={handleResizeMouseDown}
                                style={{
                                  position: "absolute",
                                  right: -6,
                                  bottom: -6,
                                  width: 16,
                                  height: 16,
                                  background: "#FFD600",
                                  borderRadius: 4,
                                  border: "2px solid #fff",
                                  cursor: "nwse-resize",
                                  zIndex: 2,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                                }}
                                title="Resize QR"
                              >
                                <svg width="8" height="8" viewBox="0 0 10 10">
                                  <polyline points="0,10 10,0" stroke="#333" strokeWidth="2" fill="none" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </>
                  )}
              </div>
            ) : (
              <div className="text-gray-400 text-center">
                <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-lg">Select chapters and PDFs to preview</p>
                <p className="text-sm text-gray-500 mt-2">Choose chapters from the sidebar to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewModalOpen && (
        <Dialog isOpen={previewModalOpen} onClose={() => setPreviewModalOpen(false)}>
          <div className="flex flex-col items-center p-6 max-h-[80vh] overflow-y-auto" style={{ minWidth: 600 }}>
            <div className="flex items-center justify-between w-full mb-4">
              <h2 className="text-xl font-bold">PDF Preview with QR Codes</h2>
              <button onClick={() => setPreviewModalOpen(false)} className="p-2 rounded-full hover:bg-gray-200">
                <X size={20} />
              </button>
            </div>

            {/* Summary of QR placements */}
            <div className="w-full mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>QR Code Summary:</strong> {getTotalQRCount()} QR code(s) placed across{" "}
                {pdfNumPages[activePdf?.pdf._id] || 0} page(s)
              </p>
              <p className="text-xs text-blue-600 mt-1">Exact positioning maintained in final output</p>
            </div>

            {activePdf && (
              <div className="w-full">
                <Document
                  file={activePdf.pdf.url}
                  loading={
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="animate-spin mr-2" />
                      Loading PDF...
                    </div>
                  }
                  error={
                    <div className="flex items-center justify-center p-8 text-red-500">
                      <AlertTriangle className="mr-2" />
                      Failed to load PDF.
                    </div>
                  }
                >
                  {Array.from(new Array(pdfNumPages[activePdf.pdf._id] || 0), (el, index) => {
                    const pageNum = index + 1
                    const qrKey = `${activePdf.chapterId}_${activePdf.pdf._id}_${pageNum}`
                    const qrOverlayData = qrOverlayMap[qrKey]
                    const qrCodeData = qrCodeDataMap[activePdf.chapterId]

                    return (
                      <div key={pageNum} className="relative mb-6 border rounded-lg overflow-hidden shadow-sm">
                        {/* Page number and QR indicator */}
                        <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm z-20">
                          Page {pageNum}
                          {qrOverlayData && <span className="ml-2 bg-amber-500 px-1 rounded text-xs">QR</span>}
                        </div>

                        <Page pageNumber={pageNum} width={modalPreviewWidth} />

                        {/* Overlay QR if present */}
                        {qrOverlayData && qrCodeData?.qrCodeDataURL && (
                          <img
                            src={qrCodeData.qrCodeDataURL || "/placeholder.svg"}
                            alt="QR Code"
                            style={{
                              position: "absolute",
                              left: (qrOverlayData.x / previewWidth) * modalPreviewWidth,
                              top: (qrOverlayData.y / previewWidth) * modalPreviewWidth,
                              width: (qrOverlayData.size / previewWidth) * modalPreviewWidth,
                              height: (qrOverlayData.size / previewWidth) * modalPreviewWidth,
                              pointerEvents: "none",
                              zIndex: 10,
                              background: "white",
                              borderRadius: 4,
                              border: "1px solid #ddd",
                            }}
                          />
                        )}
                      </div>
                    )
                  })}
                </Document>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded shadow text-sm font-semibold"
                onClick={() => setPreviewModalOpen(false)}
              >
                Close Preview
              </button>
              <button
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded shadow text-sm font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => {
                  setPreviewModalOpen(false)
                  handleDownloadPdf()
                }}
                disabled={downloading}
              >
                {downloading ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                Download This PDF
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  )
}

export default PrintBookModal