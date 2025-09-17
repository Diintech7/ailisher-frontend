"use client"
import { useState, useRef, useEffect, useCallback } from "react"
import { toast } from "react-toastify"
import axios from "axios"

const api = axios.create({
  baseURL: "https://test.ailisher.com/api",
  headers: {
    "Content-Type": "application/json",
  },
})

let fabricLoaderPromise = null

// Add these components at the top (after imports, before AnnotateAnswer)
function ExtractedTextBox({ extractedTexts }) {
  const [expanded, setExpanded] = useState(false);
  if (!extractedTexts || extractedTexts.length === 0) return null;
  const text = extractedTexts[0];
  const isLong = text.length > 250;

  return (
    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mt-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-semibold text-blue-700">Extracted Text</span>
        {isLong && (
          <button
            className="text-xs text-blue-600 hover:underline focus:outline-none"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? 'Read less' : 'Read more'}
          </button>
        )}
      </div>
      <div className="text-xs text-blue-900 whitespace-pre-wrap">
        {isLong && !expanded ? text.slice(0, 250) + '...' : text}
      </div>
    </div>
  );
}

function ModalAnswerBox({ modalAnswer }) {
  const [expanded, setExpanded] = useState(false);
  if (!modalAnswer) return null;
  const isLong = modalAnswer.length > 250;
  return (
    <div className="bg-purple-50 p-3 rounded-lg border border-purple-200 mt-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-semibold text-purple-700">Modal Answer</span>
        {isLong && (
          <button
            className="text-xs text-purple-600 hover:underline focus:outline-none"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? 'Read less' : 'Read more'}
          </button>
        )}
      </div>
      <div className="text-xs text-purple-900 whitespace-pre-wrap">
        {isLong && !expanded ? modalAnswer.slice(0, 250) + '...' : modalAnswer}
      </div>
    </div>
  );
}

const AnnotateAnswer = ({ submission, onClose, onSave }) => {
  
  const [activeTool, setActiveTool] = useState("pen")
  const [penColor, setPenColor] = useState("#FF0000")
  const [penSize, setPenSize] = useState(2)
  const [zoom, setZoom] = useState(1)
  const [isImageLoading, setIsImageLoading] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [annotations, setAnnotations] = useState({})
  const [isDragging, setIsDragging] = useState(false)
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 })
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [annotatedImages, setAnnotatedImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [imagePreviews, setImagePreviews] = useState([])
  const [selectedImage, setSelectedImage] = useState(null)
  const [isFabricLoaded, setIsFabricLoaded] = useState(!!window.fabric && !!window.fabric.Canvas)
  const [isFabricLoading, setIsFabricLoading] = useState(false)
  const [isComponentMounted, setIsComponentMounted] = useState(true)
  const [showCommentDropdown, setShowCommentDropdown] = useState(false)
  const [pageAnnotations, setPageAnnotations] = useState({})
  const [canvasReady, setCanvasReady] = useState(false)
  const canvasReadyRef = useRef(false)
  // Add state for annotated image previews
  const [annotatedImagePreviews, setAnnotatedImagePreviews] = useState([])
  // Add state for full image view
  const [openPreviewIndex, setOpenPreviewIndex] = useState(null)
  const [isZoomed, setIsZoomed] = useState(false)
  // [A] Add state for edit loading
  const [editLoading, setEditLoading] = useState(false);
  const [modalAnswer, setModalAnswer] = useState(null);
  // Add language toggle state
  const [showHindiEvaluation, setShowHindiEvaluation] = useState(false);

  // Add local state for editable evaluation fields in the review modal
  const [editEvaluation, setEditEvaluation] = useState({
    introduction: submission.evaluation?.analysis?.introduction?.join('\n') || '',
    body: submission.evaluation?.analysis?.body?.join('\n') || '',
    conclusion: submission.evaluation?.analysis?.conclusion?.join('\n') || '',
    strengths: submission.evaluation?.analysis?.strengths?.join('\n') || '',
    weaknesses: submission.evaluation?.analysis?.weaknesses?.join('\n') || '',
    suggestions: submission.evaluation?.analysis?.suggestions?.join('\n') || '',
    feedback: submission.evaluation?.analysis?.feedback || '',
    remark: submission.evaluation?.remark || '',
    score: submission.evaluation?.score || '',
    relevancy: submission.evaluation?.relevancy || ''
  });

  // Add state for Hindi evaluation editing
  const [editHindiEvaluation, setEditHindiEvaluation] = useState({
    introduction: submission.hindiEvaluation?.analysis?.introduction?.join('\n') || '',
    body: submission.hindiEvaluation?.analysis?.body?.join('\n') || '',
    conclusion: submission.hindiEvaluation?.analysis?.conclusion?.join('\n') || '',
    strengths: submission.hindiEvaluation?.analysis?.strengths?.join('\n') || '',
    weaknesses: submission.hindiEvaluation?.analysis?.weaknesses?.join('\n') || '',
    suggestions: submission.hindiEvaluation?.analysis?.suggestions?.join('\n') || '',
    feedback: submission.hindiEvaluation?.analysis?.feedback || '',
    remark: submission.hindiEvaluation?.remark || '',
    score: submission.hindiEvaluation?.score || '',
    relevancy: submission.hindiEvaluation?.relevancy || ''
  });

  // Helper function to get current evaluation data based on language toggle
  const getCurrentEvaluation = () => {
    if (showHindiEvaluation && submission.hindiEvaluation) {
      return submission.hindiEvaluation;
    }
    return submission.evaluation;
  };

  // Helper function to handle Hindi evaluation field changes
  const handleHindiEvalFieldChange = (field, value) => {
    setEditHindiEvaluation(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const predefinedComments = [
    "Excellent work! ✓",
    "Good job! 👍",
    "Well done!",
    "Perfect! ⭐",
    "Great explanation!",
    "Correct approach ✓",
    "Nice work!",
    "Outstanding! 🌟",
    "Keep it up!",
    "Brilliant! 💡",
    "Needs improvement",
    "Try again",
    "Check this",
    "Review concept",
    "Incomplete",
    "Wrong approach",
    "Missing steps",
    "Unclear explanation",
    "Revise this topic",
    "Practice more",
  ]

  const canvasRef = useRef(null)
  const fabricCanvasRef = useRef(null)
  const backgroundImageRef = useRef(null)
  const allowedRectRef = useRef(null)
  const borderRectRef = useRef(null)
  const historyRef = useRef([])
  // Reference image support
  const referenceImageFabricRef = useRef(null)
  const referenceImageInputRef = useRef(null)
  const historyIndexRef = useRef(-1)
  const containerRef = useRef(null)
  const tempElementsRef = useRef([])
  const initializationLockRef = useRef(false)
  const imageLoadingRef = useRef(false)
  const currentImageRef = useRef(null)
  const currentImageIndexRef = useRef(0)
  const isChangingImageRef = useRef(false)

  // Component mount tracking
  useEffect(() => {
    console.log("submission",submission)
    setIsComponentMounted(true)
    console.log("[AnswerAnnotation] Component mounted")
    return () => {
      console.log("[AnswerAnnotation] Component unmounting")
      setIsComponentMounted(false)
      // Cancel any pending image loads
      if (currentImageRef.current) {
        currentImageRef.current.onload = null
        currentImageRef.current.onerror = null
        currentImageRef.current = null
      }
      // Complete cleanup on unmount
      if (fabricCanvasRef.current) {
        try {
          fabricCanvasRef.current.dispose()
          fabricCanvasRef.current = null
          console.log("[AnswerAnnotation] Canvas disposed on unmount")
        } catch (error) {
          console.warn("Error disposing canvas on unmount:", error)
        }
      }
      cleanupTempElements()
    }
  }, [])

  // Cleanup function for temporary elements
  const cleanupTempElements = useCallback(() => {
    if (tempElementsRef.current) {
      tempElementsRef.current.forEach((element) => {
        try {
          if (element && element.parentNode) {
            element.parentNode.removeChild(element)
          }
        } catch (error) {
          console.warn("Error removing temp element:", error)
        }
      })
      tempElementsRef.current = []
    }
  }, [])

  // Load Fabric.js
  useEffect(() => {
    let isMounted = true
    if (window.fabric && window.fabric.Canvas) {
      setIsFabricLoaded(true)
      setIsFabricLoading(false)
      return
    }

    if (!fabricLoaderPromise) {
      setIsFabricLoading(true)
      fabricLoaderPromise = new Promise((resolve, reject) => {
        const script = document.createElement("script")
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js"
        script.async = true
        script.onload = () => {
          if (isMounted) {
            setIsFabricLoaded(true)
            setIsFabricLoading(false)
          }
          resolve()
        }
        script.onerror = (error) => {
          if (isMounted) {
            setIsFabricLoading(false)
          }
          reject(error)
        }
        document.head.appendChild(script)
      })
    } else {
      setIsFabricLoading(true)
      fabricLoaderPromise.then(() => {
        if (isMounted) {
          setIsFabricLoaded(true)
          setIsFabricLoading(false)
        }
      })
    }

    return () => {
      isMounted = false
    }
  }, [])

  // Initialize canvas when everything is ready
  useEffect(() => {
    const initializeCanvas = async () => {
      // Prevent multiple initializations
      if (
        initializationLockRef.current ||
        !isFabricLoaded ||
        !window.fabric ||
        !canvasRef.current ||
        !isComponentMounted ||
        imageLoadingRef.current ||
        isChangingImageRef.current
      ) {
        console.log("Canvas initialization skipped:", {
          locked: initializationLockRef.current,
          fabricLoaded: isFabricLoaded,
          hasFabric: !!window.fabric,
          hasCanvas: !!canvasRef.current,
          mounted: isComponentMounted,
          imageLoading: imageLoadingRef.current,
          changingImage: isChangingImageRef.current,
        })
        return
      }

      initializationLockRef.current = true
      setCanvasReady(false)

      try {
        setIsImageLoading(true)
        console.log("Creating Fabric.js canvas...")

        // Clean up existing canvas if any
        if (fabricCanvasRef.current) {
          try {
            fabricCanvasRef.current.dispose()
            fabricCanvasRef.current = null
            console.log("Previous canvas disposed")
          } catch (error) {
            console.warn("Error disposing existing canvas:", error)
          }
        }

        // Wait for cleanup
        await new Promise((resolve) => setTimeout(resolve, 200))

        if (!isComponentMounted) {
          console.log("Component unmounted during initialization")
          return
        }

        // Get the container dimensions
        const container = canvasRef.current.parentElement
        const containerWidth = container.clientWidth
        const containerHeight = container.clientHeight

        console.log("Container dimensions:", {
          width: containerWidth,
          height: containerHeight,
        })

        if (containerWidth <= 0 || containerHeight <= 0) {
          console.error("Invalid container dimensions")
          return
        }

        // Set canvas dimensions
        canvasRef.current.width = containerWidth
        canvasRef.current.height = containerHeight

        // Create canvas with container dimensions
        const fabricCanvas = new window.fabric.Canvas(canvasRef.current, {
          width: containerWidth,
          height: containerHeight,
          backgroundColor: "#ffffff",
          selection: false,
          preserveObjectStacking: true,
          stopContextMenu: true,
        })

        fabricCanvasRef.current = fabricCanvas
        console.log("Fabric canvas created successfully")

        // Add history tracking
        fabricCanvas.on("object:added", () => {
          if (isComponentMounted && canvasReadyRef.current) {
            saveToHistory()
          }
        })

        fabricCanvas.on("object:modified", () => {
          if (isComponentMounted && canvasReadyRef.current) {
            saveToHistory()
          }
        })

        fabricCanvas.on("object:removed", () => {
          if (isComponentMounted && canvasReadyRef.current) {
            saveToHistory()
          }
        })

        // Freehand path creation (pen tool)
        fabricCanvas.on("path:created", () => {
          if (isComponentMounted && canvasReadyRef.current) {
            saveToHistory()
          }
        })

        // Add zoom and pan functionality - EXACTLY like original
        fabricCanvas.on("mouse:wheel", (opt) => {
          var delta = opt.e.deltaY
          var zoom = fabricCanvas.getZoom()
          zoom *= 0.999 ** delta
          if (zoom > 20) zoom = 20
          if (zoom < 0.01) zoom = 0.01
          fabricCanvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom)
          setZoom(zoom)
          opt.e.preventDefault()
          opt.e.stopPropagation()
        })

        fabricCanvas.on("mouse:down", (opt) => {
          var evt = opt.e
          if (evt.altKey === true) {
            setIsDragging(true)
            fabricCanvas.selection = false
            setLastPos({ x: evt.clientX, y: evt.clientY })
          }
          // Block creating elements outside the right panel area
          if (allowedRectRef.current && activeTool !== 'select' && activeTool !== 'clear') {
            const p = fabricCanvas.getPointer(opt.e)
            const b = allowedRectRef.current
            if (p.x < b.left || p.x > b.left + b.width || p.y < b.top || p.y > b.top + b.height) {
              opt.e.preventDefault()
              opt.e.stopPropagation()
              return
            }
          }
        })

        fabricCanvas.on("mouse:move", (opt) => {
          if (isDragging) {
            var e = opt.e
            var vpt = fabricCanvas.viewportTransform
            vpt[4] += e.clientX - lastPos.x
            vpt[5] += e.clientY - lastPos.y
            fabricCanvas.requestRenderAll()
            setLastPos({ x: e.clientX, y: e.clientY })
          }
        })

        fabricCanvas.on("mouse:up", (opt) => {
          setIsDragging(false)
          fabricCanvas.selection = true
        })

        // Set initial ref value
        currentImageIndexRef.current = currentImageIndex

        // Load initial image
        if (submission.answerImages && submission.answerImages.length > 0) {
          await loadImageWithAnnotations(submission.answerImages[currentImageIndex].imageUrl, currentImageIndex)
        }

        setCanvasReady(true)
        setIsImageLoading(false)
        console.log("Canvas initialization completed successfully")
        // Seed initial history so first annotation can be undone
        setTimeout(() => {
          try { saveToHistory() } catch (e) { console.warn('Initial history seed failed', e) }
        }, 0)
      } catch (error) {
        console.error("Error initializing canvas:", error)
        if (isComponentMounted) {
          toast.error("Failed to initialize drawing tools")
          setIsImageLoading(false)
        }
      } finally {
        initializationLockRef.current = false
      }
    }

    if (isFabricLoaded && canvasRef.current && isComponentMounted) {
      // Delay initialization to ensure DOM is ready
      const timeoutId = setTimeout(initializeCanvas, 300)
      return () => clearTimeout(timeoutId)
    }

    return () => {
      console.log("Cleaning up canvas...")
      if (fabricCanvasRef.current) {
        try {
          fabricCanvasRef.current.dispose()
          fabricCanvasRef.current = null
        } catch (error) {
          console.error("Error disposing canvas:", error)
        }
      }
    }
  }, [isFabricLoaded, isComponentMounted, submission.answerImages, isDragging, lastPos])

  // Debug: Monitor pageAnnotations changes
  useEffect(() => {
    console.log("pageAnnotations state updated:", pageAnnotations)
  }, [pageAnnotations])

  // Keep a live ref of canvasReady for event handlers
  useEffect(() => {
    canvasReadyRef.current = canvasReady
  }, [canvasReady])

  // Load image into canvas
  const loadImage = useCallback(
    async (imageUrl) => {
      if (!fabricCanvasRef.current || !isComponentMounted || imageLoadingRef.current) {
        console.log("Image loading skipped - canvas not ready or already loading")
        return
      }

      imageLoadingRef.current = true

      try {
        console.log("Starting image load from URL:", imageUrl)

        // Cancel previous image load if any
        if (currentImageRef.current) {
          currentImageRef.current.onload = null
          currentImageRef.current.onerror = null
          currentImageRef.current = null
        }

        const img = new Image()
        currentImageRef.current = img
        img.crossOrigin = "anonymous"

        await new Promise((resolve, reject) => {
          img.onload = () => {
            console.log("Image loaded successfully:", {
              url: imageUrl,
              width: img.width,
              height: img.height,
            })
            resolve(img)
          }
          img.onerror = (error) => {
            console.error("Error loading image:", error)
            reject(error)
          }
          img.src = imageUrl
        })

        if (!isComponentMounted || !fabricCanvasRef.current || currentImageRef.current !== img) {
          console.log("Image load cancelled - component unmounted or new load started")
          return
        }

        const canvas = fabricCanvasRef.current
        const containerWidth = canvas.width
        const containerHeight = canvas.height

        // Calculate scaling to fit the container while maintaining aspect ratio
        const scaleX = containerWidth / img.width
        const scaleY = containerHeight / img.height
        const scale = Math.min(scaleX, scaleY)

        console.log("Calculated scaling:", {
          scaleX,
          scaleY,
          finalScale: scale,
        })

        // Create fabric image
        const centeredLeft = (containerWidth - img.width * scale) / 2
        const shiftedLeft = Math.max(0, centeredLeft - 250)
        const fabricImage = new window.fabric.Image(img, {
          scaleX: scale,
          scaleY: scale,
          left: shiftedLeft,
          top: (containerHeight - img.height * scale) / 2,
          selectable: false,
          evented: false,
        })

        console.log("Fabric image created:", {
          scaleX: fabricImage.scaleX,
          scaleY: fabricImage.scaleY,
          left: fabricImage.left,
          top: fabricImage.top,
          width: img.width * scale,
          height: img.height * scale,
        })

        backgroundImageRef.current = fabricImage

        // Compute RIGHT-SIDE annotation panel aligned to image
        const imgLeft = fabricImage.left
        const imgTop = fabricImage.top
        const imgW = img.width * fabricImage.scaleX
        const imgH = img.height * fabricImage.scaleY
        const panelExportWidth = 700 // final published panel width in pixels
        const panelCanvasGap = Math.max(4, Math.floor(8 * fabricImage.scaleX))
        const panelCanvasWidth = panelExportWidth * fabricImage.scaleX

        allowedRectRef.current = {
          left: imgLeft + imgW + panelCanvasGap,
          top: imgTop,
          width: panelCanvasWidth,
          height: imgH,
        }

        // Remove old border if any
        if (borderRectRef.current && canvas.getObjects().includes(borderRectRef.current)) {
          canvas.remove(borderRectRef.current)
          borderRectRef.current = null
        }

        // Add visible border rectangle that encloses IMAGE + PANEL (attached look)
        const border = new window.fabric.Rect({
          left: imgLeft,
          top: imgTop,
          width: imgW + allowedRectRef.current.width,
          height: imgH,
          fill: 'rgba(255,255,255,0.0)',
          stroke: '#2563eb',
          strokeDashArray: [6, 3],
          strokeWidth: 2,
          selectable: false,
          evented: false,
        })
        borderRectRef.current = border

        canvas.clear()
        canvas.add(fabricImage)
        // Add combined border (fixed, non-selectable, non-movable)
        border.hasControls = false
        border.hasBorders = false
        border.lockMovementX = true
        border.lockMovementY = true
        border.selectable = false
        border.evented = false
        canvas.add(border)
        // Do NOT clip canvas; restrict drawing via pointer checks only
        canvas.clipPath = null
        canvas.sendToBack(fabricImage)

        // Load saved annotations for this image if they exist
        if (pageAnnotations[currentImageIndex]) {
          console.log("Loading saved annotations for image", currentImageIndex)
          try {
            await new Promise((resolve) => {
              canvas.loadFromJSON(pageAnnotations[currentImageIndex], () => {
                // Make sure background image is not selectable after loading annotations
                const objects = canvas.getObjects()
                objects.forEach((obj) => {
                  if (obj.type === "image") {
                    obj.selectable = false
                    obj.evented = false
                    canvas.sendToBack(obj)
                  }
                })
                canvas.renderAll()
                console.log("Annotations loaded and rendered successfully")
                resolve()
              })
            })
          } catch (error) {
            console.warn("Error loading annotations:", error)
            canvas.renderAll()
          }
        } else {
          canvas.renderAll()
          console.log("No saved annotations for this image")
        }

        console.log("Canvas rendered with image and annotations")
        currentImageRef.current = null
      } catch (error) {
        console.error("Error in image loading process:", error)
        if (isComponentMounted) {
          toast.error("Failed to load image")
        }
        currentImageRef.current = null
      } finally {
        imageLoadingRef.current = false
      }
    },
    [isComponentMounted, pageAnnotations, currentImageIndex, canvasReady],
  )

  // Add a per-comment placement control in AI Analysis list
  const addAnalysisCommentToCanvas = useCallback((comment, position) => {
    if (!fabricCanvasRef.current || !window.fabric || !canvasReady) return
    try {
      const canvas = fabricCanvasRef.current
      const b = allowedRectRef.current || { left: 0, top: 0, width: canvas.width, height: canvas.height }
      const x = b.left + Math.max(2, Math.floor(b.width * 0.04))
      let y = b.top + Math.max(10, Math.floor(b.height * 0.06))
      if (position === 'top') y = b.top + Math.max(20, b.height * 0.08)
      if (position === 'middle') y = b.top + Math.floor(b.height * 0.45)
      if (position === 'bottom') y = b.top + b.height - Math.max(30, b.height * 0.1)

      const fontSize = Math.max(14, Math.floor(Math.min(b.width, b.height) * 0.028))
      const commentText = new window.fabric.Textbox(String(comment), {
        left: x,
        top: y,
        width: Math.max(20, b.width - Math.max(2, Math.floor(b.width * 0.04)) - 6),
        fontFamily: 'Kalam, cursive',
        fill: penColor,
        fontSize,
        fontWeight: '400',
        angle: 0,
        selectable: true,
        evented: true,
        textAlign: 'left',
      })
      // No inline delete control; use keyboard Delete/Backspace
      canvas.add(commentText)
      canvas.setActiveObject(commentText)
      canvas.renderAll()
      saveToHistory()
      toast.success('Comment added to image')
    } catch (e) {
      console.error('Error adding analysis comment:', e)
      toast.error('Failed to add comment')
    }
  }, [canvasReady, penColor])

  // Load image with annotations for specific index
  const loadImageWithAnnotations = useCallback(
    async (imageUrl, targetIndex) => {
      if (!fabricCanvasRef.current || !isComponentMounted || imageLoadingRef.current) {
        console.log("Image loading skipped - canvas not ready or already loading")
        return
      }

      imageLoadingRef.current = true

      try {
        console.log("Starting image load from URL:", imageUrl, "for index:", targetIndex)

        // Cancel previous image load if any
        if (currentImageRef.current) {
          currentImageRef.current.onload = null
          currentImageRef.current.onerror = null
          currentImageRef.current = null
        }

        const img = new Image()
        currentImageRef.current = img
        img.crossOrigin = "anonymous"

        await new Promise((resolve, reject) => {
          img.onload = () => {
            console.log("Image loaded successfully:", {
              url: imageUrl,
              width: img.width,
              height: img.height,
            })
            resolve(img)
          }
          img.onerror = (error) => {
            console.error("Error loading image:", error)
            reject(error)
          }
          img.src = imageUrl
        })

        if (!isComponentMounted || !fabricCanvasRef.current || currentImageRef.current !== img) {
          console.log("Image load cancelled - component unmounted or new load started")
          return
        }

        const canvas = fabricCanvasRef.current
        const containerWidth = canvas.width
        const containerHeight = canvas.height

        // Calculate scaling to fit the container while maintaining aspect ratio
        const scaleX = containerWidth / img.width
        const scaleY = containerHeight / img.height
        const scale = Math.min(scaleX, scaleY)

        console.log("Calculated scaling:", {
          scaleX,
          scaleY,
          finalScale: scale,
        })

        // Create fabric image
        const centeredLeft2 = (containerWidth - img.width * scale) / 2
        const shiftedLeft2 = Math.max(0, centeredLeft2 - 250)
        const fabricImage = new window.fabric.Image(img, {
          scaleX: scale,
          scaleY: scale,
          left: shiftedLeft2,
          top: (containerHeight - img.height * scale) / 2,
          selectable: false,
          evented: false,
        })

        console.log("Fabric image created:", {
          scaleX: fabricImage.scaleX,
          scaleY: fabricImage.scaleY,
          left: fabricImage.left,
          top: fabricImage.top,
          width: img.width * scale,
          height: img.height * scale,
        })

        backgroundImageRef.current = fabricImage

        // Compute RIGHT-SIDE annotation panel aligned to image
        const imgLeft = fabricImage.left
        const imgTop = fabricImage.top
        const imgW = img.width * fabricImage.scaleX
        const imgH = img.height * fabricImage.scaleY
        const panelExportWidth = 700
        const panelCanvasGap = Math.max(4, Math.floor(8 * fabricImage.scaleX))
        const panelCanvasWidth = panelExportWidth * fabricImage.scaleX

        allowedRectRef.current = {
          left: imgLeft + imgW + panelCanvasGap,
          top: imgTop,
          width: panelCanvasWidth,
          height: imgH,
        }

        // Remove old border if any
        if (borderRectRef.current && canvas.getObjects().includes(borderRectRef.current)) {
          canvas.remove(borderRectRef.current)
          borderRectRef.current = null
        }

        // Add visible border rectangle that encloses IMAGE + PANEL (attached look)
        const border = new window.fabric.Rect({
          left: imgLeft,
          top: imgTop,
          width: imgW + allowedRectRef.current.width,
          height: imgH,
          fill: 'rgba(255,255,255,0.0)',
          stroke: '#2563eb',
          strokeDashArray: [6, 3],
          strokeWidth: 2,
          selectable: false,
          evented: false,
        })
        borderRectRef.current = border

        canvas.clear()
        canvas.add(fabricImage)
        border.hasControls = false
        border.hasBorders = false
        border.lockMovementX = true
        border.lockMovementY = true
        border.selectable = false
        border.evented = false
        canvas.add(border)
        // No clipPath; rely on pointer bounds checks
        canvas.clipPath = null
        canvas.sendToBack(fabricImage)

        // Load saved annotations for the target index if they exist
        console.log("Checking for annotations at index", targetIndex, ":", pageAnnotations[targetIndex])
        if (pageAnnotations[targetIndex]) {
          console.log("Loading saved annotations for image", targetIndex)
          try {
            await new Promise((resolve) => {
              canvas.loadFromJSON(pageAnnotations[targetIndex], () => {
                // Make sure background image is not selectable after loading annotations
                const objects = canvas.getObjects()
                objects.forEach((obj) => {
                  if (obj.type === "image") {
                    obj.selectable = false
                    obj.evented = false
                    canvas.sendToBack(obj)
                  }
                })
                canvas.renderAll()
                console.log("Annotations loaded and rendered successfully for index", targetIndex)
                resolve()
              })
            })
          } catch (error) {
            console.warn("Error loading annotations:", error)
            canvas.renderAll()
          }
        } else {
          canvas.renderAll()
          console.log("No saved annotations for image", targetIndex)
        }

        console.log("Canvas rendered with image and annotations for index", targetIndex)
        currentImageRef.current = null
      } catch (error) {
        console.error("Error in image loading process:", error)
        if (isComponentMounted) {
          toast.error("Failed to load image")
        }
        currentImageRef.current = null
      } finally {
        imageLoadingRef.current = false
      }
    },
    [isComponentMounted, pageAnnotations, canvasReady],
  )

  // History management functions
  const saveToHistory = useCallback(() => {
    if (fabricCanvasRef.current && isComponentMounted && canvasReady) {
      try {
        const json = fabricCanvasRef.current.toJSON()
        historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1)
        historyRef.current.push(json)
        historyIndexRef.current = historyRef.current.length - 1
        updateUndoRedoState()

        // Save annotations for current image using ref
        const currentIndex = currentImageIndexRef.current
        setPageAnnotations((prev) => {
          const updated = {
            ...prev,
            [currentIndex]: json,
          }
          console.log("Annotations auto-saved for image", currentIndex)
          return updated
        })
      } catch (error) {
        console.warn("Error saving to history:", error)
      }
    }
  }, [isComponentMounted, canvasReady])

  const updateUndoRedoState = useCallback(() => {
    setCanUndo(historyIndexRef.current > 0)
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1)
  }, [])

  // Save annotations for a specific image index
  const saveAnnotationsForIndex = useCallback(
    (index) => {
      if (fabricCanvasRef.current && isComponentMounted && canvasReady) {
        try {
          const json = fabricCanvasRef.current.toJSON()
          setPageAnnotations((prev) => {
            const updated = {
              ...prev,
              [index]: json,
            }
            console.log("Annotations saved for image", index)
            return updated
          })
        } catch (error) {
          console.warn("Error saving annotations for index", index, ":", error)
        }
      }
    },
    [isComponentMounted, canvasReady],
  )

  // Handle image change with proper cleanup
  const handleImageChange = useCallback(
    async (index) => {
      if (!isComponentMounted || index === currentImageIndex || imageLoadingRef.current) {
        console.log("Image change skipped:", {
          mounted: isComponentMounted,
          sameIndex: index === currentImageIndex,
          loading: imageLoadingRef.current,
        })
        return
      }

      try {
        console.log("Changing from image", currentImageIndex, "to image", index)
        console.log("Current pageAnnotations state:", pageAnnotations)
        setCanvasReady(false)
        isChangingImageRef.current = true

        // Save current annotations before switching
        if (fabricCanvasRef.current && fabricCanvasRef.current.getObjects && canvasReady) {
          saveAnnotationsForIndex(currentImageIndex)
        }

        // Update the ref immediately
        currentImageIndexRef.current = index
        setIsImageLoading(true)

        // Clear existing canvas
        if (fabricCanvasRef.current) {
          try {
            fabricCanvasRef.current.dispose()
            fabricCanvasRef.current = null
            console.log("Canvas disposed for image change")
          } catch (error) {
            console.warn("Error disposing canvas:", error)
          }
        }

        // Wait for cleanup
        await new Promise((resolve) => setTimeout(resolve, 300))

        if (!isComponentMounted) {
          console.log("Component unmounted during image change")
          return
        }

        // Reset history
        historyRef.current = []
        historyIndexRef.current = -1
        setCanUndo(false)
        setCanRedo(false)

        // Reinitialize canvas with new image
        if (canvasRef.current && window.fabric) {
          const container = canvasRef.current.parentElement
          const containerWidth = container.clientWidth
          const containerHeight = container.clientHeight

          // Set canvas dimensions
          canvasRef.current.width = containerWidth
          canvasRef.current.height = containerHeight

          const fabricCanvas = new window.fabric.Canvas(canvasRef.current, {
            width: containerWidth,
            height: containerHeight,
            backgroundColor: "#ffffff",
            selection: false,
            preserveObjectStacking: true,
            stopContextMenu: true,
          })

          fabricCanvasRef.current = fabricCanvas
          console.log("New canvas created for image", index)

          // Re-add event listeners
          fabricCanvas.on("object:added", () => {
            if (isComponentMounted && canvasReadyRef.current) saveToHistory()
          })

          fabricCanvas.on("object:modified", () => {
            if (isComponentMounted && canvasReadyRef.current) saveToHistory()
          })

          fabricCanvas.on("object:removed", () => {
            if (isComponentMounted && canvasReadyRef.current) saveToHistory()
          })

          fabricCanvas.on("path:created", () => {
            if (isComponentMounted && canvasReadyRef.current) saveToHistory()
          })

          // Add zoom and pan - EXACTLY like original
          fabricCanvas.on("mouse:wheel", (opt) => {
            var delta = opt.e.deltaY
            var zoom = fabricCanvas.getZoom()
            zoom *= 0.999 ** delta
            if (zoom > 20) zoom = 20
            if (zoom < 0.01) zoom = 0.01
            fabricCanvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom)
            setZoom(zoom)
            opt.e.preventDefault()
            opt.e.stopPropagation()
          })

          fabricCanvas.on("mouse:down", (opt) => {
            var evt = opt.e
            if (evt.altKey === true) {
              setIsDragging(true)
              fabricCanvas.selection = false
              setLastPos({ x: evt.clientX, y: evt.clientY })
            }
          })

          fabricCanvas.on("mouse:move", (opt) => {
            if (isDragging) {
              var e = opt.e
              var vpt = fabricCanvas.viewportTransform
              vpt[4] += e.clientX - lastPos.x
              vpt[5] += e.clientY - lastPos.y
              fabricCanvas.requestRenderAll()
              setLastPos({ x: e.clientX, y: e.clientY })
            }
          })

          fabricCanvas.on("mouse:up", (opt) => {
            setIsDragging(false)
            fabricCanvas.selection = true
          })

          // Load new image with annotations - pass the target index directly
          if (submission.answerImages && submission.answerImages[index]) {
            await loadImageWithAnnotations(submission.answerImages[index].imageUrl, index)
          }

          setCanvasReady(true)
          // Seed initial history after switching page
          setTimeout(() => {
            try { saveToHistory() } catch (e) { console.warn('Initial history seed failed', e) }
          }, 0)
        }

        // Update current image index after everything is set up
        setCurrentImageIndex(index)
        currentImageIndexRef.current = index
        setIsImageLoading(false)
        isChangingImageRef.current = false
        console.log("Image change completed successfully")
      } catch (error) {
        console.error("Error in handleImageChange:", error)
        if (isComponentMounted) {
          toast.error("Error displaying page")
          setIsImageLoading(false)
        }
        isChangingImageRef.current = false
      }
    },
    [
      currentImageIndex,
      submission.answerImages,
      isComponentMounted,
      canvasReady,
      saveToHistory,
      saveAnnotationsForIndex,
      isDragging,
      lastPos,
    ],
  )

  // Update canvas when tool changes
  useEffect(() => {
    if (!fabricCanvasRef.current || !window.fabric || !canvasReady) {
      console.log("Canvas or Fabric.js not ready for tool changes")
      return
    }

    const canvas = fabricCanvasRef.current

    try {
      // Remove all existing event listeners
      canvas.off("mouse:down")
      canvas.off("mouse:move")
      canvas.off("mouse:up")

      // Reset drawing mode and selection
      canvas.isDrawingMode = false
      canvas.freeDrawingBrush = null
      canvas.selection = false
      canvas.discardActiveObject()

      // Set cursor based on selected tool
      switch (activeTool) {
        case "pen":
          canvas.defaultCursor = "crosshair"
          canvas.isDrawingMode = true
          const brush = new window.fabric.PencilBrush(canvas)
          brush.color = penColor
          brush.width = penSize
          canvas.freeDrawingBrush = brush
          canvas.selection = false
          break

        // case "rectangle":
        //   canvas.defaultCursor = "crosshair"
        //   canvas.isDrawingMode = false
        //   canvas.selection = false
        //   let startPoint
        //   let currentRect
        //   let isDrawing = false
        //
        //   canvas.on("mouse:down", (o) => {
        //     if (o.e.button === 0) {
        //       isDrawing = true
        //       const pointer = canvas.getPointer(o.e)
        //       startPoint = { x: pointer.x, y: pointer.y }
        //       currentRect = new window.fabric.Rect({
        //         left: startPoint.x,
        //         top: startPoint.y,
        //         width: 0,
        //         height: 0,
        //         fill: "transparent",
        //         stroke: penColor,
        //         strokeWidth: penSize,
        //         selectable: false,
        //         evented: false,
        //       })
        //       canvas.add(currentRect)
        //       o.e.preventDefault()
        //       o.e.stopPropagation()
        //     }
        //   })
        //
        //   canvas.on("mouse:move", (o) => {
        //     if (!isDrawing || !currentRect) return
        //     const pointer = canvas.getPointer(o.e)
        //     if (allowedRectRef.current) {
        //       const b = allowedRectRef.current
        //       if (pointer.x < b.left || pointer.x > b.left + b.width || pointer.y < b.top || pointer.y > b.top + b.height) {
        //         return
        //       }
        //     }
        //     const width = pointer.x - startPoint.x
        //     const height = pointer.y - startPoint.y
        //     currentRect.set({
        //       width: Math.abs(width),
        //       height: Math.abs(height),
        //       left: width > 0 ? startPoint.x : pointer.x,
        //       top: height > 0 ? startPoint.y : pointer.y,
        //     })
        //     canvas.renderAll()
        //     o.e.preventDefault()
        //     o.e.stopPropagation()
        //   })
        //
        //   canvas.on("mouse:up", (o) => {
        //     if (isDrawing) {
        //       isDrawing = false
        //       currentRect = null
        //       o.e.preventDefault()
        //       o.e.stopPropagation()
        //     }
        //   })
        //   break

        // case "circle":
        //   canvas.defaultCursor = "crosshair"
        //   canvas.isDrawingMode = false
        //   canvas.selection = false
        //   let startPointCircle
        //   let currentCircle
        //   let isDrawingCircle = false
        //
        //   canvas.on("mouse:down", (o) => {
        //     if (o.e.button === 0) {
        //       isDrawingCircle = true
        //       const pointer = canvas.getPointer(o.e)
        //       startPointCircle = { x: pointer.x, y: pointer.y }
        //       currentCircle = new window.fabric.Circle({
        //         left: startPointCircle.x,
        //         top: startPointCircle.y,
        //         radius: 0,
        //         fill: "transparent",
        //         stroke: penColor,
        //         strokeWidth: penSize,
        //         selectable: false,
        //         evented: false,
        //       })
        //       canvas.add(currentCircle)
        //       o.e.preventDefault()
        //       o.e.stopPropagation()
        //     }
        //   })
        //
        //   canvas.on("mouse:move", (o) => {
        //     if (!isDrawingCircle || !currentCircle) return
        //     const pointer = canvas.getPointer(o.e)
        //     if (allowedRectRef.current) {
        //       const b = allowedRectRef.current
        //       if (pointer.x < b.left || pointer.x > b.left + b.width || pointer.y < b.top || pointer.y > b.top + b.height) {
        //         return
        //       }
        //     }
        //     const radius = Math.sqrt(
        //       Math.pow(pointer.x - startPointCircle.x, 2) + Math.pow(pointer.y - startPointCircle.y, 2),
        //     )
        //     currentCircle.set({
        //       radius: radius,
        //     })
        //     canvas.renderAll()
        //     o.e.preventDefault()
        //     o.e.stopPropagation()
        //   })
        //
        //   canvas.on("mouse:up", (o) => {
        //     if (isDrawingCircle) {
        //       isDrawingCircle = false
        //       currentCircle = null
        //       o.e.preventDefault()
        //       o.e.stopPropagation()
        //     }
        //   })
        //   break

        case "text":
          canvas.defaultCursor = "text"
          canvas.isDrawingMode = false
          canvas.selection = false
          break

        case "comment":
          canvas.defaultCursor = "pointer"
          canvas.isDrawingMode = false
          canvas.selection = false
          break

        case "select":
          canvas.defaultCursor = "default"
          canvas.isDrawingMode = false
          canvas.selection = true
          canvas.forEachObject((obj) => {
            if (obj !== backgroundImageRef.current) {
              obj.selectable = true
              obj.evented = true
            }
          })
          break

        case "clear":
          canvas.defaultCursor = "default"
          canvas.isDrawingMode = false
          canvas.selection = false
          break
      }

      canvas.renderAll()
      console.log("Tool applied successfully:", activeTool)
    } catch (error) {
      console.error("Error rendering canvas:", error)
    }
  }, [activeTool, penColor, penSize, canvasReady])

  // Keyboard delete for removing selected objects (avoid deleting while editing text)
  useEffect(() => {
    const handleKey = (e) => {
      if (!fabricCanvasRef.current || !canvasReady) return
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const active = fabricCanvasRef.current.getActiveObject()
        // If editing a text-like object, let Fabric handle character deletion
        if (active && (active.isEditing || active.type === 'i-text' && active.isEditing)) {
          return
        }
        if (active && active !== backgroundImageRef.current && active !== borderRectRef.current) {
          fabricCanvasRef.current.remove(active)
          fabricCanvasRef.current.discardActiveObject()
          fabricCanvasRef.current.requestRenderAll()
          saveToHistory()
          e.preventDefault()
        }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [canvasReady, saveToHistory])

  const handleToolSelect = useCallback(
    (tool) => {
      if (!canvasReady) {
        console.log("Canvas not ready for tool selection")
        return
      }

      setActiveTool(tool)

      if (!fabricCanvasRef.current || !window.fabric) return

      try {
        switch (tool) {
          case "pen":
            fabricCanvasRef.current.isDrawingMode = true
            const brush = new window.fabric.PencilBrush(fabricCanvasRef.current)
            brush.color = penColor
            brush.width = penSize
            fabricCanvasRef.current.freeDrawingBrush = brush
            break

          case "rectangle":
            fabricCanvasRef.current.isDrawingMode = false
            break

          case "circle":
            fabricCanvasRef.current.isDrawingMode = false
            break

          case "text":
            fabricCanvasRef.current.isDrawingMode = false
            {
              const canvas = fabricCanvasRef.current
              const b = allowedRectRef.current || { left: 0, top: 0, width: canvas.width, height: canvas.height }
              const fontSize = Math.max(14, Math.floor(Math.min(b.width, b.height) * 0.028))
            const text = new window.fabric.IText("Double click to edit", {
                left: b.left + Math.max(20, Math.floor(b.width * 0.1)),
                top: b.top + Math.max(20, Math.floor(b.height * 0.15)),
              fontFamily: "Kalam, cursive",
              fill: penColor,
                fontSize,
              fontWeight: "400",
              fontStyle: "normal",
              underline: false,
              linethrough: false,
              textAlign: "left",
              charSpacing: 1,
              lineHeight: 1.2,
              angle: Math.random() * 4 - 2,
              shadow: {
                color: "rgba(0,0,0,0.1)",
                blur: 1,
                offsetX: 1,
                offsetY: 1,
              },
            })
            fabricCanvasRef.current.add(text)
            fabricCanvasRef.current.setActiveObject(text)
              saveToHistory()
            }
            break

          case "comment":
            fabricCanvasRef.current.isDrawingMode = false
            setShowCommentDropdown(true)
            break

          case "select":
            fabricCanvasRef.current.isDrawingMode = false
            fabricCanvasRef.current.selection = true
            fabricCanvasRef.current.forEachObject((obj) => {
              if (obj !== backgroundImageRef.current) {
                obj.selectable = true
                obj.evented = true
              }
            })
            break

          case "clear":
            fabricCanvasRef.current.getObjects().forEach((obj) => {
              if (obj !== backgroundImageRef.current && obj !== borderRectRef.current) {
                fabricCanvasRef.current.remove(obj)
              }
            })
            if (borderRectRef.current && !fabricCanvasRef.current.getObjects().includes(borderRectRef.current)) {
              fabricCanvasRef.current.add(borderRectRef.current)
            }
            if (backgroundImageRef.current && !fabricCanvasRef.current.getObjects().includes(backgroundImageRef.current)) {
              fabricCanvasRef.current.add(backgroundImageRef.current)
              fabricCanvasRef.current.sendToBack(backgroundImageRef.current)
            }
            fabricCanvasRef.current.renderAll()
            saveToHistory()
            break
        }
      } catch (error) {
        console.error("Error applying tool:", error)
        toast.error("Failed to apply tool")
      }
    },
    [penColor, penSize, canvasReady],
  )

  // Handle comment selection and placement
  const handleCommentSelect = useCallback(
    (comment) => {
      if (!fabricCanvasRef.current || !window.fabric || !canvasReady) {
        return
      }

      try {
        const canvas = fabricCanvasRef.current
        const b = allowedRectRef.current || { left: 0, top: 0, width: canvas.width, height: canvas.height }
        const fontSize = Math.max(14, Math.floor(Math.min(b.width, b.height) * 0.028))
        const commentText = new window.fabric.Textbox(String(comment), {
          left: b.left + 4,
          top: b.top + Math.max(20, Math.floor(b.height * 0.2)),
          width: Math.max(20, b.width - 8),
          fontFamily: "Kalam, cursive",
          fill: penColor,
          fontSize,
          fontWeight: "400",
          textAlign: 'justify',
          lineHeight: 1.25,
          selectable: true,
          evented: true,
        })

        fabricCanvasRef.current.add(commentText)
        fabricCanvasRef.current.setActiveObject(commentText)
        fabricCanvasRef.current.renderAll()
        saveToHistory()
        // No inline delete control; use keyboard Delete/Backspace

        setShowCommentDropdown(false)
        toast.success("Comment added! You can move and edit it.")
      } catch (error) {
        console.error("Error adding comment:", error)
        toast.error("Failed to add comment")
      }
    },
    [penColor, canvasReady],
  )

  // Helper function to add line breaks to text
  const addLineBreaks = (text, maxChars = 35) => {
    if (!text || text.length <= maxChars) return text
    
    const words = text.split(' ')
    const lines = []
    let currentLine = ''
    
    words.forEach(word => {
      if ((currentLine + word).length <= maxChars) {
        currentLine += (currentLine ? ' ' : '') + word
      } else {
        if (currentLine) lines.push(currentLine)
        currentLine = word
      }
    })
    
    if (currentLine) lines.push(currentLine)
    return lines.join('\n')
  }

  // Removed inline cross delete control (use Delete/Backspace instead)

  // Auto Annotate: place a few editable marks and comments automatically
  const handleAutoAnnotate = useCallback(() => {
    if (!fabricCanvasRef.current || !window.fabric || !canvasReady) return

    try {
      const canvas = fabricCanvasRef.current
      // allowedRectRef now represents the right-side panel; compute image bounds from background image
      const panel = allowedRectRef.current
      const bg = backgroundImageRef.current
      if (!panel || !bg) return
      const imgBounds = {
        left: bg.left,
        top: bg.top,
        width: bg.width * bg.scaleX,
        height: bg.height * bg.scaleY,
      }
      const left = imgBounds.left
      const top = imgBounds.top
      const width = imgBounds.width
      const height = imgBounds.height

      const safeX = (ratio) => Math.max(left + 6, Math.min(left + width - 6, Math.floor(left + width * ratio)))
      const safeY = (ratio) => Math.max(top + 6, Math.min(top + height - 6, Math.floor(top + height * ratio)))

      // Helper: create a hand-drawn looking green check mark using a path
      const addHandDrawnTick = (cx, cy, size) => {
        const jitter = (n, amt) => n + (Math.random() - 0.5) * amt
        const s = size
        // A more organic tick using slight cubic curves and wobble
        const p = [
          ['M', jitter(cx - s * 0.45, s * 0.08), jitter(cy + s * 0.05, s * 0.08)],
          ['Q', jitter(cx - s * 0.2, s * 0.06), jitter(cy + s * 0.25, s * 0.06), jitter(cx - s * 0.05, s * 0.06), jitter(cy + s * 0.35, s * 0.06)],
          ['Q', jitter(cx + s * 0.05, s * 0.06), jitter(cy + s * 0.45, s * 0.06), jitter(cx + s * 0.55, s * 0.08), jitter(cy - s * 0.15, s * 0.08)],
        ]
        const path = new window.fabric.Path(p, {
          stroke: '#dc2626',
          fill: '',
          // refined thin pen-like stroke for red ticks
          strokeWidth: Math.max(1.1, Math.floor(size * 0.065)),
          strokeLineCap: 'round',
          strokeLineJoin: 'round',
          selectable: true,
          evented: true,
          angle: (Math.random() - 0.5) * 3,
          shadow: { color: 'rgba(0,0,0,0.06)', blur: 0.8, offsetX: 0.4, offsetY: 0.4 },
        })
        canvas.add(path)
      }

      // Add a few hand-drawn ticks at plausible positions
      const tickCenters = [
        { x: safeX(0.20), y: safeY(0.20) },
        { x: safeX(0.52), y: safeY(0.42) },
        { x: safeX(0.78), y: safeY(0.72) },
      ]
      tickCenters.forEach((pos, idx) => {
        const base = Math.max(26, Math.floor(Math.min(width, height) * 0.15))
        const size = base + (idx % 2 === 0 ? 2 : -1)
        addHandDrawnTick(pos.x, pos.y, size)
      })

      // Prefer Hindi evaluation (if available) for auto-annotation, regardless of UI toggle
      let autoEval = getCurrentEvaluation()
      if (
        submission.hindiEvaluation && (
          (Array.isArray(submission.hindiEvaluation.comments) && submission.hindiEvaluation.comments.length > 0) ||
          submission.hindiEvaluation.analysis
        )
      ) {
        autoEval = submission.hindiEvaluation
      }

      // Place AI Evaluation comments from Analysis into the RIGHT PANEL (stacked top-to-bottom)
      const evaluationComments = Array.isArray(autoEval?.comments)
        ? autoEval.comments
        : []

      if (evaluationComments.length > 0) {
        // Panel metrics
        const panelLeft = panel.left
        const panelTop = panel.top
        const panelWidth = panel.width
        const panelHeight = panel.height

        // Add a score heading at the top of the panel
        const scoreText = typeof autoEval?.score === 'number'
          ? `Score: ${autoEval.score}/${submission.question?.metadata?.maximumMarks ?? 'N/A'}`
          : `Score: ${autoEval?.score || 'Not evaluated'}`
        const headerFont = Math.max(20, Math.floor(Math.min(panelWidth, panelHeight) * 0.06))
        const header = new window.fabric.IText(scoreText, {
          left: panelLeft + 12,
          top: panelTop + 10,
          fontFamily: 'Kalam, cursive',
          fill: '#16a34a',
          fontSize: headerFont,
          fontWeight: '700',
          selectable: true,
          evented: true,
        })
        canvas.add(header)

        // Comments stacked below the heading
        const fontSize = Math.max(14, Math.floor(Math.min(panelWidth, panelHeight) * 0.032))
        const lineHeight = fontSize * 1.35
        const minGap = Math.max(10, Math.floor(Math.min(panelWidth, panelHeight) * 0.02))
        let currentY = panelTop + 10 + headerFont + minGap
        evaluationComments.slice(0, 12).forEach((comment) => {
          const commentText = new window.fabric.Textbox(String(comment), {
            left: panelLeft + 4,
            top: currentY,
            width: Math.max(20, panelWidth - 8),
            fontFamily: 'Kalam, cursive',
            fill: penColor,
            fontSize,
            fontWeight: '400',
            textAlign: 'left',
            lineHeight: 1.25,
            selectable: true,
            evented: true,
          })
          commentText.set({ shadow: { color: 'rgba(0,0,0,0.06)', blur: 1, offsetX: 1, offsetY: 1 } })
          canvas.add(commentText)
          // measure height after rendering
          const measured = commentText.getScaledHeight ? commentText.getScaledHeight() : (commentText.height || (fontSize * 1.25))
          currentY += measured + minGap
        })
      }

      canvas.renderAll()
      // Save to history for undo/redo
      saveToHistory()
      toast.success("Auto annotations added. You can move/edit them.")
    } catch (error) {
      console.error("Error during auto annotate:", error)
      toast.error("Failed to auto annotate")
    }
  }, [canvasReady, penColor, submission])

  const handleColorChange = useCallback(
    (color) => {
      setPenColor(color)
      if (!canvasReady) return

      const canvas = fabricCanvasRef.current
      if (!canvas) return

      // Update active object color if in select mode
      if (activeTool === "select") {
        const activeObject = canvas.getActiveObject()
        if (activeObject) {
          if (activeObject.type === "i-text") {
            activeObject.set("fill", color)
          } else {
            activeObject.set("stroke", color)
          }
          canvas.renderAll()
        }
      }

      // Update brush color
      if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = color
      }
    },
    [activeTool, canvasReady],
  )

  const handleBrushSizeChange = useCallback(
    (size) => {
      setPenSize(size)
      if (!canvasReady) return

      const canvas = fabricCanvasRef.current
      if (!canvas) return

      // Update active object stroke width if in select mode
      if (activeTool === "select") {
        const activeObject = canvas.getActiveObject()
        if (activeObject && activeObject.type !== "i-text") {
          activeObject.set("strokeWidth", size)
          canvas.renderAll()
        }
      }

      // Update brush size
      if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.width = size
      }
    },
    [activeTool, canvasReady],
  )

  // Upload and place a reference image inside the annotation panel
  const handleReferenceImageUpload = useCallback(async (file) => {
    if (!fabricCanvasRef.current || !allowedRectRef.current || !file) return
    try {
      const reader = new FileReader()
      const dataUrl = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      await new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = dataUrl
      }).then((img) => {
        const canvas = fabricCanvasRef.current
        const panel = allowedRectRef.current

        // Remove previous reference image if any
        if (referenceImageFabricRef.current && canvas.contains(referenceImageFabricRef.current)) {
          canvas.remove(referenceImageFabricRef.current)
          referenceImageFabricRef.current = null
        }

        const panelMaxWidth = Math.max(50, panel.width - 20)
        const panelMaxHeight = Math.max(50, panel.height / 3)
        const scale = Math.min(panelMaxWidth / img.width, panelMaxHeight / img.height, 1)

        const fabricImg = new window.fabric.Image(img, {
          left: panel.left + 10,
          top: panel.top + 10,
          scaleX: scale,
          scaleY: scale,
          hasControls: true,
          hasBorders: true,
          selectable: true,
          evented: true,
          cornerStyle: 'circle',
          transparentCorners: false,
          isReferenceImage: true,
        })

        // Constrain movement to the panel area
        fabricImg.on('moving', () => {
          const b = allowedRectRef.current
          const w = fabricImg.width * fabricImg.scaleX
          const h = fabricImg.height * fabricImg.scaleY
          fabricImg.left = Math.min(Math.max(fabricImg.left, b.left + 2), b.left + b.width - w - 2)
          fabricImg.top = Math.min(Math.max(fabricImg.top, b.top + 2), b.top + b.height - h - 2)
        })

        referenceImageFabricRef.current = fabricImg
        canvas.add(fabricImg)
        canvas.setActiveObject(fabricImg)
        canvas.renderAll()
        saveToHistory()
        toast.success('Reference image added')
      })
    } catch (e) {
      console.error('Failed to add reference image', e)
      toast.error('Failed to add reference image')
    } finally {
      if (referenceImageInputRef.current) {
        referenceImageInputRef.current.value = ''
      }
    }
  }, [canvasReady])

  const handleRemoveReferenceImage = useCallback(() => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return
    if (referenceImageFabricRef.current && canvas.contains(referenceImageFabricRef.current)) {
      canvas.remove(referenceImageFabricRef.current)
      referenceImageFabricRef.current = null
      canvas.renderAll()
      saveToHistory()
      toast.success('Reference image removed')
    } else {
      toast.info('No reference image to remove')
    }
  }, [])

  // Add zoom controls handler
  const handleZoom = useCallback(
    (direction) => {
      if (!fabricCanvasRef.current || !isComponentMounted || !canvasReady) return

      const canvas = fabricCanvasRef.current
      try {
        const currentZoom = canvas.getZoom()
        let newZoom

        if (direction === "in") {
          newZoom = Math.min(currentZoom * 1.1, 20)
        } else if (direction === "out") {
          newZoom = Math.max(currentZoom / 1.1, 0.1)
        } else {
          newZoom = 1
        }

        canvas.zoomToPoint({ x: canvas.width / 2, y: canvas.height / 2 }, newZoom)
        setZoom(newZoom)
      } catch (error) {
        console.error("Error during zoom:", error)
      }
    },
    [isComponentMounted, canvasReady],
  )

  // Improved utility to scale and position annotation objects for original image size
  function scaleAnnotationObjects(objects, scale, offsetX, offsetY) {
    return objects.map((obj) => {
      const newObj = { ...obj }

      // Position
      if (typeof newObj.left === "number") newObj.left = (newObj.left - offsetX) / scale
      if (typeof newObj.top === "number") newObj.top = (newObj.top - offsetY) / scale

      // Size
      if (typeof newObj.width === "number") newObj.width = newObj.width / scale
      if (typeof newObj.height === "number") newObj.height = newObj.height / scale
      if (typeof newObj.radius === "number") newObj.radius = newObj.radius / scale

      // Font
      if (typeof newObj.fontSize === "number") newObj.fontSize = newObj.fontSize / scale

      // Stroke
      if (typeof newObj.strokeWidth === "number") newObj.strokeWidth = newObj.strokeWidth / scale

      // Scale factors
      if (typeof newObj.scaleX === "number") newObj.scaleX = newObj.scaleX
      if (typeof newObj.scaleY === "number") newObj.scaleY = newObj.scaleY

      // Path (for pen/free drawing)
      if (Array.isArray(newObj.path)) {
        newObj.path = newObj.path.map((cmd) => {
          // cmd is [command, ...args], e.g. ['M', x, y] or ['Q', x1, y1, x, y]
          return cmd.map((v, i) => {
            if (i === 0) return v // command letter
            if (typeof v === "number") {
              // For path, x/y are in container coordinates, so scale and offset
              // We can't know if it's x or y, but both need the same transform
              // So we must assume all numbers after the command are coordinates
              // (This is true for fabric.js path data)
              // For more complex paths, this may need refinement
              return (v - (i % 2 === 1 ? offsetX : offsetY)) / scale
            }
            return v
          })
        })
      }

      // Points (for polyline, polygon, etc.)
      if (Array.isArray(newObj.points)) {
        newObj.points = newObj.points.map((pt) => ({
          x: (pt.x - offsetX) / scale,
          y: (pt.y - offsetY) / scale,
        }))
      }

      return newObj
    })
  }

  // Update generateAnnotatedImagePreviews to return array of data URLs
  const generateAnnotatedImagePreviews = async () => {
    if (!fabricCanvasRef.current || !isComponentMounted) return []

    const currentJson = fabricCanvasRef.current.toJSON()
    const allAnnotations = {
      ...pageAnnotations,
      [currentImageIndexRef.current]: currentJson,
    }

    const previews = []

    for (let i = 0; i < submission.answerImages.length; i++) {
      const imageData = submission.answerImages[i]
      const annotations = allAnnotations[i]

      const img = await new Promise((resolve, reject) => {
        const image = new window.Image()
        image.crossOrigin = "anonymous"
        image.onload = () => resolve(image)
        image.onerror = reject
        image.src = imageData.imageUrl
      })

      const panelExportWidth = 700
      const tempCanvas = document.createElement("canvas")
      tempCanvas.width = img.width + panelExportWidth
      tempCanvas.height = img.height

      const tempFabricCanvas = new window.fabric.Canvas(tempCanvas, {
        width: tempCanvas.width,
        height: tempCanvas.height,
        backgroundColor: "#ffffff",
      })

      const fabricImage = new window.fabric.Image(img, {
        left: 0,
        top: 0,
        scaleX: 1,
        scaleY: 1,
        selectable: false,
        evented: false,
      })

      tempFabricCanvas.add(fabricImage)
      tempFabricCanvas.sendToBack(fabricImage)
      tempFabricCanvas.renderAll()

      // Draw right-side panel background and combined border for preview
      const panelRectPrev = new window.fabric.Rect({
        left: img.width,
        top: 0,
        width: panelExportWidth,
        height: img.height,
        fill: '#ffffff',
        selectable: false,
        evented: false,
      })
      tempFabricCanvas.add(panelRectPrev)
      // Note: Do not draw the combined border in exports

      if (annotations && annotations.objects) {
        const container = fabricCanvasRef.current.getElement().parentElement
        const containerWidth = container.clientWidth
        const containerHeight = container.clientHeight

        const scaleX = containerWidth / img.width
        const scaleY = containerHeight / img.height
        const scale = Math.min(scaleX, scaleY)

        // Recompute the exact on-screen positions used during drawing
        const centeredLeft = (containerWidth - img.width * scale) / 2
        const imageLeftOnCanvas = Math.max(0, centeredLeft - 250)
        const imageTopOnCanvas = (containerHeight - img.height * scale) / 2
        const panelCanvasGap = Math.max(4, Math.floor(8 * scale))
        const panelLeftOnCanvas = imageLeftOnCanvas + img.width * scale + panelCanvasGap
        const panelTopOnCanvas = imageTopOnCanvas

        // Include all objects; we'll split by region. Only include non-image objects on the left image region,
        // and include both non-image and image objects (reference images) on the right panel region.
        const allObjects = annotations.objects
        const imageRegionObjs = allObjects.filter((obj) => (obj.left ?? 0) < panelLeftOnCanvas - 1 && obj.type !== 'image')
        const panelRegionObjs = allObjects.filter((obj) => (obj.left ?? 0) >= panelLeftOnCanvas - 1)

        // Place image-region objects without horizontal shift (they belong on the left image)
        const imageScaled = scaleAnnotationObjects(imageRegionObjs, scale, imageLeftOnCanvas, imageTopOnCanvas)
        if (imageScaled.length > 0) {
          await new Promise((resolve) => {
            window.fabric.util.enlivenObjects(
              imageScaled,
              (enlivened) => {
                enlivened.forEach((obj) => tempFabricCanvas.add(obj))
                tempFabricCanvas.renderAll()
                resolve()
              },
              null,
            )
          })
        }

        // Place panel-region objects and shift into the export panel area (to the right of original image)
        const panelScaled = scaleAnnotationObjects(panelRegionObjs, scale, panelLeftOnCanvas, panelTopOnCanvas)
        if (panelScaled.length > 0) {
          await new Promise((resolve) => {
            window.fabric.util.enlivenObjects(
              panelScaled,
              (enlivened) => {
                enlivened.forEach((obj) => {
                  obj.left = (obj.left || 0) + img.width
                  tempFabricCanvas.add(obj)
                })
                tempFabricCanvas.renderAll()
                resolve()
              },
              null,
            )
          })
        }
      }

      const dataUrl = tempCanvas.toDataURL("image/png")
      previews.push(dataUrl)
      tempFabricCanvas.dispose()
    }

    return previews
  }

  // Update getAnnotatedImages to use original image size and scaling
  const getAnnotatedImages = async () => {
    console.log("=== getAnnotatedImages called ===")
    console.log("[getAnnotatedImages] Initial checks:", {
      fabricCanvasRef: !!fabricCanvasRef.current,
      isComponentMounted,
      submissionAnswerImages: submission.answerImages?.length || 0,
    })

    if (!fabricCanvasRef.current || !isComponentMounted) {
      console.error("[getAnnotatedImages] Canvas not ready or component not mounted")
      toast.error("Canvas not ready")
      return null
    }

    if (!submission.answerImages || submission.answerImages.length === 0) {
      console.error("[getAnnotatedImages] No answer images found")
      toast.error("No answer images found")
      return null
    }

    try {
      console.log("[getAnnotatedImages] Step 1: Setting uploading state...")
      setUploadingImages(true)

      console.log("[getAnnotatedImages] Step 2: Getting current canvas JSON...")
      // Save current annotations first using ref
      const currentJson = fabricCanvasRef.current.toJSON()
      console.log("[getAnnotatedImages] Current canvas JSON:", currentJson)

      const allAnnotations = {
        ...pageAnnotations,
        [currentImageIndexRef.current]: currentJson,
      }

      console.log("[getAnnotatedImages] Step 3: Processing annotations for", submission.answerImages.length, "images")
      console.log("[getAnnotatedImages] All annotations:", allAnnotations)

      const annotatedResults = []

      for (let i = 0; i < submission.answerImages.length; i++) {
        console.log(`[getAnnotatedImages] Step 4.${i + 1}: Processing image ${i}...`)
        const imageData = submission.answerImages[i]
        const annotations = allAnnotations[i]

        console.log(`[getAnnotatedImages] Image ${i} data:`, {
          imageUrl: imageData?.imageUrl,
          hasImageData: !!imageData,
          hasAnnotations: !!annotations,
          annotationObjects: annotations?.objects?.length || 0,
        })

        if (!imageData || !imageData.imageUrl) {
          console.warn(`[getAnnotatedImages] Skipping image ${i} - no valid image data`)
          continue
        }

        try {
          // 1. Load original image to get its size
          const img = await new Promise((resolve, reject) => {
            const image = new window.Image()
            image.crossOrigin = "anonymous"
            image.onload = () => resolve(image)
            image.onerror = reject
            image.src = imageData.imageUrl
          })

          // 2. Create temp canvas at image width + panel width
          const panelExportWidth = 700
          const tempCanvas = document.createElement("canvas")
          tempCanvas.width = img.width + panelExportWidth
          tempCanvas.height = img.height

          const tempFabricCanvas = new window.fabric.Canvas(tempCanvas, {
            width: tempCanvas.width,
            height: tempCanvas.height,
            backgroundColor: "#ffffff",
          })

          // 3. Add original image as background
          const fabricImage = new window.fabric.Image(img, {
            left: 0,
            top: 0,
            scaleX: 1,
            scaleY: 1,
            selectable: false,
            evented: false,
          })

          tempFabricCanvas.add(fabricImage)
          tempFabricCanvas.sendToBack(fabricImage)
          tempFabricCanvas.renderAll()

          // 4. Draw right-side panel background and combined border
          const panelRect = new window.fabric.Rect({
            left: img.width,
            top: 0,
            width: panelExportWidth,
            height: img.height,
            fill: '#ffffff',
            selectable: false,
            evented: false,
          })
          tempFabricCanvas.add(panelRect)
          // Note: Do not draw the combined border in exports

          // 5. Add annotation objects, scaled into the right panel area
          if (annotations && annotations.objects) {
            const container = fabricCanvasRef.current.getElement().parentElement
            const containerWidth = container.clientWidth
            const containerHeight = container.clientHeight

            const scaleX = containerWidth / img.width
            const scaleY = containerHeight / img.height
            const scale = Math.min(scaleX, scaleY)

            // Match the on-screen positions during drawing
            const centeredLeft = (containerWidth - img.width * scale) / 2
            const imageLeftOnCanvas = Math.max(0, centeredLeft - 250)
            const imageTopOnCanvas = (containerHeight - img.height * scale) / 2
            const panelCanvasGap = Math.max(4, Math.floor(8 * scale))
            const panelLeftOnCanvas = imageLeftOnCanvas + img.width * scale + panelCanvasGap
            const panelTopOnCanvas = imageTopOnCanvas

            // Include all objects; split by region. Only include non-image objects on the left image region,
            // and include both non-image and image objects (reference images) on the right panel region.
            const allObjectsPub = annotations.objects
            const imageRegionObjs = allObjectsPub.filter((obj) => (obj.left ?? 0) < panelLeftOnCanvas - 1 && obj.type !== 'image')
            const panelRegionObjs = allObjectsPub.filter((obj) => (obj.left ?? 0) >= panelLeftOnCanvas - 1)

            const imageScaled = scaleAnnotationObjects(imageRegionObjs, scale, imageLeftOnCanvas, imageTopOnCanvas)
            if (imageScaled.length > 0) {
              await new Promise((resolve) => {
                window.fabric.util.enlivenObjects(
                  imageScaled,
                  (enlivened) => {
                    enlivened.forEach((obj) => tempFabricCanvas.add(obj))
                    tempFabricCanvas.renderAll()
                    resolve()
                  },
                  null,
                )
              })
            }

            const panelScaled = scaleAnnotationObjects(panelRegionObjs, scale, panelLeftOnCanvas, panelTopOnCanvas)
            if (panelScaled.length > 0) {
              await new Promise((resolve) => {
                window.fabric.util.enlivenObjects(
                  panelScaled,
                  (enlivened) => {
                    enlivened.forEach((obj) => {
                      obj.left = (obj.left || 0) + img.width
                      tempFabricCanvas.add(obj)
                    })
                    tempFabricCanvas.renderAll()
                    resolve()
                  },
                  null,
                )
              })
            }
          }

          // 6. Export and upload
          await new Promise((resolve) => {
            tempCanvas.toBlob(
              async (blob) => {
                try {
                  if (blob) {
                    console.log(`[getAnnotatedImages] Blob created for image ${i}:`, {
                      size: blob.size,
                      type: blob.type,
                    })

                    const file = new File([blob], `annotated-image-${i + 1}.png`, {
                      type: "image/png",
                    })

                    console.log(`[getAnnotatedImages] File created for image ${i}:`, file)
                    console.log(`[getAnnotatedImages] Uploading file for image ${i}...`)

                    const s3Key = await handleImageUpload(file, i)

                    annotatedResults.push({
                      originalIndex: i,
                      s3Key: s3Key,
                      fileName: `annotated-image-${i + 1}.png`,
                    })

                    console.log(
                      `[getAnnotatedImages] Successfully processed and uploaded image ${i} with S3 key:`,
                      s3Key,
                    )
                  } else {
                    console.error(`[getAnnotatedImages] Failed to create blob for image ${i}`)
                  }

                  tempFabricCanvas.dispose()
                  resolve()
                } catch (uploadError) {
                  console.error(`[getAnnotatedImages] Error uploading image ${i}:`, uploadError)
                  tempFabricCanvas.dispose()
                  resolve()
                }
              },
              "image/png",
              0.9,
            )
          })
        } catch (imageError) {
          console.error(`[getAnnotatedImages] Error processing image ${i}:`, imageError)
        }
      }

      console.log("[getAnnotatedImages] Step 5: Annotation processing completed. Results:", annotatedResults)
      setUploadingImages(false)
      return annotatedResults
    } catch (error) {
      console.error("[getAnnotatedImages] Error getting annotated images:", error)
      console.error("[getAnnotatedImages] Error stack:", error.stack)
      setUploadingImages(false)
      toast.error("Failed to process annotations")
      return null
    }
  }

  // 1. On modal open: only generate previews, no S3 upload
  const handleOpenPublishModal = async () => {
    try {
      setLoading(true)
      console.log("[PublishWithAnnotation] Opening modal: generating annotated image previews (no S3 upload)...")
      const previews = await generateAnnotatedImagePreviews()
      setImagePreviews(previews)
      setIsReviewModalOpen(true)
      setLoading(false)
      console.log("[PublishWithAnnotation] Preview modal opened. Previews generated.")
    } catch (error) {
      setLoading(false)
      console.error("[PublishWithAnnotation] Error during preview generation:", error)
      toast.error(error.message || "Failed to generate annotation previews")
    }
  }

  // 2. On Publish: export, upload to S3, then call publish API
  const handlePublish = async () => {
    setLoading(true)
    try {
      // 0) Save latest evaluation edits (English/Hindi as per toggle) before publishing
      const maxMarks = submission.question?.metadata?.maximumMarks || submission.questionId?.metadata?.maximumMarks || 100
      const stateEval = showHindiEvaluation ? editHindiEvaluation : editEvaluation
      if (Number(stateEval.score) > maxMarks) {
        toast.error(`Marks cannot be greater than maximum marks (${maxMarks})`)
        setLoading(false)
        return
      }
      try {
        const url = `https://test.ailisher.com/api/clients/CLI677117YN7N/mobile/userAnswers/questions/${submission.questionId?._id || submission.question?._id}/answers/${submission._id}/evaluation-update`
        const feedbackValue = (typeof stateEval.feedback === 'string' && stateEval.feedback.trim() !== '')
          ? stateEval.feedback
          : undefined
        const payload = {
          analysis: {
            introduction: String(stateEval.introduction || '').split('\n').filter(Boolean),
            body: String(stateEval.body || '').split('\n').filter(Boolean),
            conclusion: String(stateEval.conclusion || '').split('\n').filter(Boolean),
            strengths: String(stateEval.strengths || '').split('\n').filter(Boolean),
            weaknesses: String(stateEval.weaknesses || '').split('\n').filter(Boolean),
            suggestions: String(stateEval.suggestions || '').split('\n').filter(Boolean),
            ...(feedbackValue !== undefined ? { feedback: feedbackValue } : {})
          },
          marks: Number(stateEval.score || 0),
          accuracy: Number(stateEval.relevancy || 0),
          remark: stateEval.remark || ''
        }
        const authHeaders = {}
        try {
          const Cookies = (await import('js-cookie')).default
          const token = Cookies.get('usertoken')
          if (token) authHeaders.Authorization = `Bearer ${token}`
        } catch (_) {}
        const saveRes = await axios.put(url, payload, { headers: authHeaders })
        if (!saveRes?.data?.success) {
          toast.error(saveRes?.data?.message || 'Failed to update evaluation before publish')
          setLoading(false)
          return
        }
      } catch (err) {
        console.error('[PublishWithAnnotation] Evaluation save failed before publish:', { status: err?.response?.status, data: err?.response?.data })
        toast.error(err?.response?.data?.message || err?.message || 'Failed to update evaluation before publish')
        setLoading(false)
        return
      }

      console.log("[PublishWithAnnotation] Exporting annotated images and uploading to S3...")
      // Export annotated images again (to ensure up-to-date)
      const annotatedResults = await getAnnotatedImages()
      if (!annotatedResults) {
        setLoading(false)
        toast.error("Failed to export annotated images.")
        return
      }

      const s3Keys = []
      for (let i = 0; i < annotatedResults.length; i++) {
        const result = annotatedResults[i]
        if (result && result.s3Key) {
          s3Keys.push({ s3Key: result.s3Key })
          console.log(`[PublishWithAnnotation] Image ${i} uploaded to S3. S3 Key:`, result.s3Key)
        }
      }

      if (s3Keys.length === 0) {
        setLoading(false)
        toast.error("No annotated images uploaded to S3.")
        return
      }

      // Call publish API
      const publishEndpoint = "/evaluator-reviews/publishwithannotation"
      const publishPayloads = s3Keys.map((image) => ({
        answerId: submission._id,
        annotatedImageKey: image.s3Key,
      }))

      console.log("[PublishWithAnnotation] About to call publish API:", publishEndpoint)
      console.log("[PublishWithAnnotation] Payloads:", publishPayloads)

      // Include auth header
      let authConfig = {}
      try {
        const Cookies = (await import('js-cookie')).default
        const token = Cookies.get('usertoken')
        if (token) authConfig = { headers: { Authorization: `Bearer ${token}` } }
      } catch (_) {}

      // Publish sequentially to avoid optimistic concurrency conflicts on the same answer document
      for (const payload of publishPayloads) {
        try {
          const res = await api.post(publishEndpoint, payload, authConfig)
          console.log("[PublishWithAnnotation] Publish API response for payload:", payload, res.data)
        } catch (err) {
          const msg = err?.response?.data?.error || err?.response?.data?.message || ''
          const isVersionConflict = typeof msg === 'string' && msg.includes('No matching document found')
          if (isVersionConflict) {
            // Retry once after small delay
            await new Promise(r => setTimeout(r, 400))
            const retryRes = await api.post(publishEndpoint, payload, authConfig)
            console.log("[PublishWithAnnotation] Retry publish response:", payload, retryRes.data)
          } else {
            throw err
          }
        }
      }

      toast.success("Annotations published successfully!")
      setIsReviewModalOpen(false)
      if (onSave) onSave()
      onClose()
    } catch (error) {
      console.error("[PublishWithAnnotation] Error during publish:", { status: error?.response?.status, data: error?.response?.data, error })
      toast.error(error?.response?.data?.message || error.message || "Failed to publish annotations.")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      // Save current annotations before saving
      if (fabricCanvasRef.current && fabricCanvasRef.current.getObjects && canvasReady) {
        saveAnnotationsForIndex(currentImageIndex)
      }
      // Simple save functionality
      if (onSave) {
        onSave({ annotations: pageAnnotations })
      }
      toast.success("Annotations saved successfully!")
    } catch (error) {
      console.error("Error saving:", error)
      toast.error("Failed to save annotations")
    }
  }

  // Separate function for closing the modal
  const handleClose = useCallback(() => {
    setIsComponentMounted(false)

    if (fabricCanvasRef.current) {
      try {
        fabricCanvasRef.current.dispose()
        console.log("[AnswerAnnotation] Fabric canvas disposed on close")
      } catch (error) {
        console.warn("Error disposing canvas:", error)
      }
      fabricCanvasRef.current = null
    }

    cleanupTempElements()
    onClose()
  }, [cleanupTempElements, onClose])

  const handleCloseReviewModal = () => {
    setIsReviewModalOpen(false)
  }

  // Create preview URL for image
  const createImagePreview = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        resolve(reader.result)
      }
      reader.readAsDataURL(file)
    })
  }

  // Handle image upload
  const handleImageUpload = async (file, imgIndex) => {
    console.log(`[handleImageUpload] === Starting image upload for image ${imgIndex} ===`)
    console.log(`[handleImageUpload] File details:`, {
      name: file.name,
      size: file.size,
      type: file.type,
    })

    try {
      console.log(`[handleImageUpload] Step 1: Preparing upload payload...`)
      // Get presigned URL for upload
      const uploadPayload = {
        fileName: file.name,
        contentType: file.type,
        clientId: submission.clientId || "CLI677117YN7N",
        answerId: submission._id,
      }
      console.log(`[handleImageUpload] Upload payload:`, uploadPayload)

      console.log(`[handleImageUpload] Step 2: Requesting presigned URL...`)
      const uploadUrlResponse = await api.post("/review/annotated-image-upload-url", uploadPayload)
      console.log(`[handleImageUpload] Upload URL Response:`, uploadUrlResponse.data)

      if (!uploadUrlResponse.data.success) {
        console.error(`[handleImageUpload] Server returned error:`, uploadUrlResponse.data)
        throw new Error(uploadUrlResponse.data.message || "Failed to get upload URL")
      }

      const uploadUrl = uploadUrlResponse.data.data.uploadUrl
      const key = uploadUrlResponse.data.data.key
      console.log(`[handleImageUpload] Extracted uploadUrl:`, uploadUrl)
      console.log(`[handleImageUpload] Extracted key:`, key)

      if (!uploadUrl || typeof uploadUrl !== "string") {
        console.error(`[handleImageUpload] Invalid upload URL:`, uploadUrl)
        throw new Error("Invalid upload URL received from server")
      }

      console.log(`[handleImageUpload] Step 3: Uploading file to S3...`)
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      })

      console.log(`[handleImageUpload] S3 upload response:`, {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        ok: uploadResponse.ok,
      })

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text()
        console.error(`[handleImageUpload] S3 Upload Error:`, {
          status: uploadResponse.status,
          statusText: uploadResponse.statusText,
          errorText,
        })
        throw new Error(`Failed to upload image to S3: ${errorText}`)
      }

      console.log(`[handleImageUpload] Step 4: Successfully uploaded to S3. Key:`, key)

      console.log(`[handleImageUpload] Step 5: Updating annotated images state...`)
      setAnnotatedImages((prev) => {
        const newImages = Array.isArray(prev) ? [...prev] : []
        newImages.push({ s3Key: key })
        console.log(`[handleImageUpload] Updated annotated images state:`, newImages)
        return newImages
      })

      console.log(`[handleImageUpload] === Upload completed successfully for image ${imgIndex} ===`)
      return key
    } catch (error) {
      console.error(`[handleImageUpload] === Error uploading image ${imgIndex}:`, error)
      console.error(`[handleImageUpload] Error stack:`, error.stack)

      if (error.response) {
        console.error(`[handleImageUpload] Error response data:`, error.response.data)
        console.error(`[handleImageUpload] Error response status:`, error.response.status)
        console.error(`[handleImageUpload] Error response headers:`, error.response.headers)
      }

      throw error
    }
  }

  // Handle file selection
  const handleFileSelect = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    try {
      setUploadingImages(true)
      // Create preview immediately when file is selected
      const preview = await createImagePreview(file)
      setSelectedImage(preview)

      // Upload image and get S3 key
      const s3Key = await handleImageUpload(file, currentImageIndex)

      // After successful upload, add to previews array
      setImagePreviews((prev) => {
        const newPreviews = Array.isArray(prev) ? [...prev] : []
        newPreviews.push(preview)
        return newPreviews
      })

      // Clear the selected image after successful upload
      setSelectedImage(null)
      toast.success("Image uploaded successfully")
    } catch (error) {
      console.error("Error in handleFileSelect:", error)
      setSelectedImage(null)
      let errorMessage = "Failed to upload image"
      if (error.response) {
        errorMessage = error.response.data.message || `Server error: ${error.response.status}`
      } else if (error.request) {
        errorMessage = "No response from server. Please check if the server is running."
      } else {
        errorMessage = error.message
      }
      toast.error(errorMessage)
    } finally {
      setUploadingImages(false)
    }
  }

  // Remove image
  const handleRemoveImage = (index) => {
    setAnnotatedImages((prev) => {
      const newImages = Array.isArray(prev) ? [...prev] : []
      newImages.splice(index, 1)
      return newImages
    })
    setImagePreviews((prev) => {
      const newPreviews = Array.isArray(prev) ? [...prev] : []
      newPreviews.splice(index, 1)
      return newPreviews
    })
  }

  const handleUndo = () => {
    if (!fabricCanvasRef.current || !canUndo) return

    try {
      if (historyIndexRef.current > 0) {
        historyIndexRef.current--
        const historyState = historyRef.current[historyIndexRef.current]
        fabricCanvasRef.current.loadFromJSON(historyState, () => {
          // Ensure border and background are present after load
          if (borderRectRef.current && !fabricCanvasRef.current.getObjects().includes(borderRectRef.current)) {
            fabricCanvasRef.current.add(borderRectRef.current)
          }
          if (backgroundImageRef.current && !fabricCanvasRef.current.getObjects().includes(backgroundImageRef.current)) {
            fabricCanvasRef.current.add(backgroundImageRef.current)
            fabricCanvasRef.current.sendToBack(backgroundImageRef.current)
          }
          fabricCanvasRef.current.renderAll()
          updateUndoRedoState()
        })
      }
    } catch (error) {
      console.error("Error during undo:", error)
    }
  }

  const handleRedo = () => {
    if (!fabricCanvasRef.current || !canRedo) return

    try {
      if (historyIndexRef.current < historyRef.current.length - 1) {
        historyIndexRef.current++
        const historyState = historyRef.current[historyIndexRef.current]
        fabricCanvasRef.current.loadFromJSON(historyState, () => {
          // Ensure border and background are present after load
          if (borderRectRef.current && !fabricCanvasRef.current.getObjects().includes(borderRectRef.current)) {
            fabricCanvasRef.current.add(borderRectRef.current)
          }
          if (backgroundImageRef.current && !fabricCanvasRef.current.getObjects().includes(backgroundImageRef.current)) {
            fabricCanvasRef.current.add(backgroundImageRef.current)
            fabricCanvasRef.current.sendToBack(backgroundImageRef.current)
          }
          fabricCanvasRef.current.renderAll()
          updateUndoRedoState()
        })
      }
    } catch (error) {
      console.error("Error during redo:", error)
    }
  }

  // Handler for input changes
  const handleEvalFieldChange = (field, value) => {
    setEditEvaluation(prev => ({ ...prev, [field]: value }));
  };

  // Update handleEditEvaluation to use local state
  const handleEditEvaluation = async () => {
    setEditLoading(true);
    const maxMarks = submission.question?.metadata?.maximumMarks || submission.questionId?.metadata?.maximumMarks || 100;
    if (Number(editEvaluation.score) > maxMarks) {
      toast.error(`Marks cannot be greater than maximum marks (${maxMarks})`);
      setEditLoading(false);
      return;
    }
    try {
      // Use local or production endpoint as needed
      const url = `https://test.ailisher.com/api/clients/CLI677117YN7N/mobile/userAnswers/questions/${submission.questionId?._id || submission.question?._id}/answers/${submission._id}/evaluation-update`;
      // Ensure feedback is a string or omitted if empty/null/undefined
      const feedbackValue = (typeof editEvaluation.feedback === 'string' && editEvaluation.feedback.trim() !== '') 
        ? editEvaluation.feedback 
        : undefined;
      const payload = {
        analysis: {
          introduction: editEvaluation.introduction.split('\n').filter(Boolean),
          body: editEvaluation.body.split('\n').filter(Boolean),
          conclusion: editEvaluation.conclusion.split('\n').filter(Boolean),
          strengths: editEvaluation.strengths.split('\n').filter(Boolean),
          weaknesses: editEvaluation.weaknesses.split('\n').filter(Boolean),
          suggestions: editEvaluation.suggestions.split('\n').filter(Boolean),
          ...(feedbackValue !== undefined ? { feedback: feedbackValue } : {})
        },
        marks: Number(editEvaluation.score),
        accuracy: Number(editEvaluation.relevancy),
        remark: editEvaluation.remark
      };
      const response  = await axios.put(url, payload);
      if(response.data.success)
      toast.success('Evaluation updated successfully!');
      else
      {
      toast.error(response.data.message)
      }
    } catch (error) {
      console.error('Error updating evaluation:', error);
      toast.error(error.message);
    } finally {
      setEditLoading(false);
    }
  };

  useEffect(() => {
    const fetchModalAnswer = async () => {
      if (!submission?.question?._id) return;
      try {
        const res = await axios.get(
          `https://test.ailisher.com/api/aiswb/questions/${submission.question._id}`
        );
        if (res.data && res.data.data && res.data.data.modalAnswer) {
          setModalAnswer(res.data.data.modalAnswer);
        } else {
          setModalAnswer("No model answer available.");
        }
      } catch (err) {
        setModalAnswer("Could not fetch model answer.");
      }
    };
    fetchModalAnswer();
  }, [submission?.question?._id]);

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Load Google Fonts for handwriting style */}
      <link href="https://fonts.googleapis.com/css2?family=Kalam:wght@300;400;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Annotate Answer</h2>
          <p className="text-sm text-gray-300">
            {submission.user?.name || "Anonymous"} - {new Date(submission.evaluatedAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex space-x-4">
         
          <button 
            onClick={handleOpenPublishModal} 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            disabled={!isComponentMounted}
          >
            Submit
          </button>
          <button 
            onClick={handleClose} 
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
{/* Left Side - Analysis */}
          <div className="w-1/3 border-r border-gray-200 overflow-y-auto p-6">
          <h1 className="text-2xl font-bold text-blue-700 mb-4 tracking-tight flex items-center gap-2">
            <svg className="w-7 h-7 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            AI Analysis
          </h1>
          <div className="space-y-6">
            {/* Question Section */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Question</h3>
              <p className="text-sm text-gray-800 mb-3">{submission.question?.question || 'N/A'}</p>
              <div className="text-xs text-gray-600">
                <div>QID: {submission.question?._id}</div>
                <div>UID: {submission.userId}</div>
                <div>Difficulty: {submission.question.metadata?.difficultyLevel || 'N/A'}</div>
                <div>Max Marks: {submission.question.metadata?.maximumMarks || 'N/A'}</div>
              </div>
            </div>

            {/* Language Toggle Button */}
            {submission.hindiEvaluation && Object.keys(submission.hindiEvaluation).length > 0 && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-700">Evaluation Language:</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowHindiEvaluation(false)}
                      className={`px-3 py-1 text-xs rounded-md transition-colors ${
                        !showHindiEvaluation 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white text-blue-600 border border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      English
                    </button>
                    <button
                      onClick={() => setShowHindiEvaluation(true)}
                      className={`px-3 py-1 text-xs rounded-md transition-colors ${
                        showHindiEvaluation 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white text-blue-600 border border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      हिंदी
                    </button>
                  </div>
                </div>
              </div>
            )}


            {/* Performance Metrics */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="space-y-4">
              <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-green-700">Score:</span>
                  <span className="text-lg font-bold text-green-900">
                    {typeof getCurrentEvaluation().score === 'number' ? `${getCurrentEvaluation().score}/${submission.question.metadata?.maximumMarks || 'N/A'}` : getCurrentEvaluation().score || 'Not evaluated'}
                  </span>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-green-700">Relevancy:</span>
                    <span className="text-lg font-bold text-green-900">
                      {typeof getCurrentEvaluation().relevancy === 'number' ? `${getCurrentEvaluation().relevancy}%` : getCurrentEvaluation().relevancy || 'Not evaluated'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-500 ease-out"
                      style={{ 
                        width: typeof getCurrentEvaluation().relevancy === 'number' ? `${getCurrentEvaluation().relevancy}%` : '0%',
                        minWidth: '4px'
                      }}
                    ></div>
                  </div>
                </div>
               
              </div>
            </div>
            {/* Extracted Text Box */}
                {submission.extractedTexts && submission.extractedTexts.length > 0 && (
                  <ExtractedTextBox extractedTexts={submission.extractedTexts} />
                )}
                {/* Modal Answer Box */}
                {modalAnswer && (
                  <ModalAnswerBox modalAnswer={modalAnswer} />
                )}
            {/* Evaluation Remark */}
            {getCurrentEvaluation().remark && getCurrentEvaluation().remark !== 'No remark provided' && (
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <h4 className="text-sm font-medium text-orange-700 mb-2">Evaluation Remark</h4>
                <p className="text-sm text-orange-800">{getCurrentEvaluation().remark}</p>
              </div>
            )}

            {/* Evaluation Comments */}
            {getCurrentEvaluation().comments && getCurrentEvaluation().comments.length > 0 && (
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                <h4 className="text-sm font-medium text-indigo-700 mb-2">Evaluation Comments</h4>
                <ul className="space-y-2">
                  {getCurrentEvaluation().comments.map((comment, index) => (
                    <li key={index} className="flex items-start gap-2 justify-between">
                      <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span className="text-sm text-indigo-800">{comment}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => addAnalysisCommentToCanvas(comment, 'top')}
                          className="px-2 py-1 text-xs bg-white text-indigo-700 border border-indigo-200 rounded hover:bg-indigo-50"
                          title="Add to top"
                        >Top</button>
                        <button
                          onClick={() => addAnalysisCommentToCanvas(comment, 'middle')}
                          className="px-2 py-1 text-xs bg-white text-indigo-700 border border-indigo-200 rounded hover:bg-indigo-50"
                          title="Add to middle"
                        >Middle</button>
                        <button
                          onClick={() => addAnalysisCommentToCanvas(comment, 'bottom')}
                          className="px-2 py-1 text-xs bg-white text-indigo-700 border border-indigo-200 rounded hover:bg-indigo-50"
                          title="Add to bottom"
                        >Bottom</button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Analysis Details */}
            {getCurrentEvaluation().analysis && (
              (getCurrentEvaluation().analysis.introduction|| 
                getCurrentEvaluation().analysis.body|| 
                getCurrentEvaluation().analysis.conclusion) && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Analysis Details</h4>
                  <div className="space-y-3">
                    {getCurrentEvaluation().analysis.introduction && (
                      <div className="bg-pink-50 rounded-lg p-3 border border-pink-200">
                        <h5 className="text-xs font-semibold text-pink-800 mb-1">Introduction</h5>
                        <ul className="space-y-1">
                          {getCurrentEvaluation().analysis.introduction.map((item, index) => (
                            <li key={index} className="text-xs text-pink-700">• {item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {getCurrentEvaluation().analysis.body && (
                      <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                        <h5 className="text-xs font-semibold text-orange-800 mb-1">Body</h5>
                        <ul className="space-y-1">
                          {getCurrentEvaluation().analysis.body.map((item, index) => (
                            <li key={index} className="text-xs text-orange-700">• {item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {getCurrentEvaluation().analysis.conclusion && (
                      <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                        <h5 className="text-xs font-semibold text-purple-800 mb-1">Conclusion</h5>
                        <ul className="space-y-1">
                          {getCurrentEvaluation().analysis.conclusion.map((item, index) => (
                            <li key={index} className="text-xs text-purple-700">• {item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}

            {/* Strengths */}
            {getCurrentEvaluation().analysis?.strengths && getCurrentEvaluation().analysis.strengths.length > 0 && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="text-sm font-medium text-green-700 mb-2">Strengths</h4>
                <ul className="space-y-2">
                  {getCurrentEvaluation().analysis.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-green-800">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Weaknesses */}
            {getCurrentEvaluation().analysis?.weaknesses && getCurrentEvaluation().analysis.weaknesses.length > 0 && (
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h4 className="text-sm font-medium text-red-700 mb-2">Areas for Improvement</h4>
                <ul className="space-y-2">
                  {getCurrentEvaluation().analysis.weaknesses.map((weakness, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="text-sm text-red-800">{weakness}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggestions */}
            {getCurrentEvaluation().analysis?.suggestions && getCurrentEvaluation().analysis.suggestions.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="text-sm font-medium text-blue-700 mb-2">Suggestions</h4>
                <ul className="space-y-2">
                  {getCurrentEvaluation().analysis.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-blue-800">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Evaluation Feedback */}
            {getCurrentEvaluation().analysis?.feedback && getCurrentEvaluation().analysis.feedback.length > 0 && (
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h4 className="text-sm font-medium text-purple-700 mb-2">Detailed Feedback</h4>
                <p className="text-sm text-purple-800 whitespace-pre-wrap">{getCurrentEvaluation().analysis.feedback}</p>
              </div>
            )}

            {/* Text Answer */}
            {submission.textAnswer && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Text Answer</h4>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{submission.textAnswer}</p>
              </div>
            )}

            {/* Submission Info */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Submission Info</h4>
              <div className="space-y-2 text-xs text-gray-600">
                <div>Submitted: {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : 'N/A'}</div>
                <div>Evaluated: {submission.evaluatedAt ? new Date(submission.evaluatedAt).toLocaleString() : 'N/A'}</div>
                <div>Status: {submission.submissionStatus || 'N/A'}</div>
                <div>Publish Status: {submission.publishStatus || 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Image Annotation */}
        <div className="w-2/3 flex flex-col">
          {/* Toolbar */}
          <div className="bg-gray-100 p-4 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleAutoAnnotate}
                disabled={isFabricLoading || !isFabricLoaded || !canvasReady}
                className={`px-3 py-2 rounded border ${
                  isFabricLoading || !isFabricLoaded || !canvasReady
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed border-gray-200"
                    : "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600"
                }`}
                title="Auto Annotate"
              >
                Auto Annotate
              </button>
              {/* Reference Image Controls */}
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  accept="image/*"
                  ref={referenceImageInputRef}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files && e.target.files[0]
                    if (file) handleReferenceImageUpload(file)
                  }}
                />
                {/* <button
                  onClick={() => referenceImageInputRef.current && referenceImageInputRef.current.click()}
                  disabled={isFabricLoading || !isFabricLoaded || !canvasReady}
                  className={`px-3 py-2 rounded border ${
                    isFabricLoading || !isFabricLoaded || !canvasReady
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed border-gray-200"
                      : "bg-white text-gray-700 hover:bg-gray-100 border-gray-300"
                  }`}
                  title="Upload Reference Image"
                >
                  Reference Image
                </button> */}
                <button
                  onClick={handleRemoveReferenceImage}
                  disabled={isFabricLoading || !isFabricLoaded || !canvasReady}
                  className={`px-3 py-2 rounded border ${
                    isFabricLoading || !isFabricLoaded || !canvasReady
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed border-gray-200"
                      : "bg-white text-red-600 hover:bg-red-50 border-red-300"
                  }`}
                  title="Remove Reference Image"
                >
                  Remove
                </button>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleToolSelect("pen")}
                  disabled={isFabricLoading || !isFabricLoaded || !canvasReady}
                  className={`p-2 rounded ${
                    isFabricLoading || !isFabricLoaded || !canvasReady
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : activeTool === "pen"
                        ? "bg-blue-500 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                  title="Pen"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                </button>

                <button
                  onClick={() => handleToolSelect("text")}
                  disabled={isFabricLoading || !isFabricLoaded || !canvasReady}
                  className={`p-2 rounded ${
                    isFabricLoading || !isFabricLoaded || !canvasReady
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : activeTool === "text"
                        ? "bg-blue-500 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                  title="Text"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>

                {/* Comment Tool Button */}
                <div className="relative">
                  <button
                    onClick={() => handleToolSelect("comment")}
                    disabled={isFabricLoading || !isFabricLoaded || !canvasReady}
                    className={`p-2 rounded ${
                      activeTool === "comment"
                        ? "bg-blue-500 text-white"
                        : isFabricLoading || !isFabricLoaded || !canvasReady
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                          : "bg-white text-gray-700 hover:bg-gray-100"
                    }`}
                    title="Comment"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </button>

                  {/* Comment Dropdown */}
                  {showCommentDropdown && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                      <div className="p-3 border-b border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700">Select a Comment</h4>
                      </div>
                      <div className="p-2">
                        {predefinedComments.map((comment, index) => (
                          <button
                            key={index}
                            onClick={() => handleCommentSelect(comment)}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-150"
                            style={{ fontFamily: "Kalam, cursive" }}
                          >
                            {comment}
                          </button>
                        ))}
                      </div>
                      <div className="p-2 border-t border-gray-200">
                        <button
                          onClick={() => setShowCommentDropdown(false)}
                          className="w-full px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-md"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/*
                <button
                  onClick={() => handleToolSelect("circle")}
                  disabled={isFabricLoading || !isFabricLoaded || !canvasReady}
                  className={`p-2 rounded ${
                    isFabricLoading || !isFabricLoaded || !canvasReady
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : activeTool === "circle"
                        ? "bg-blue-500 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                  title="Circle"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 12m-9 0a9 9 0 1118 0a9 9 0 01-18 0z"
                    />
                  </svg>
                </button>
                */}

                {/*
                <button
                  onClick={() => handleToolSelect("rectangle")}
                  disabled={isFabricLoading || !isFabricLoaded || !canvasReady}
                  className={`p-2 rounded ${
                    isFabricLoading || !isFabricLoaded || !canvasReady
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : activeTool === "rectangle"
                        ? "bg-blue-500 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                  title="Rectangle"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 10h16M4 14h16M4 18h16"
                    />
                  </svg>
                </button>
                */}

                <button
                  onClick={() => handleToolSelect("select")}
                  disabled={isFabricLoading || !isFabricLoaded || !canvasReady}
                  className={`p-2 rounded ${
                    isFabricLoading || !isFabricLoaded || !canvasReady
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : activeTool === "select"
                        ? "bg-blue-500 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                  title="Select"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                    />
                  </svg>
                </button>

                <button
                  onClick={() => handleToolSelect("clear")}
                  disabled={isFabricLoading || !isFabricLoaded || !canvasReady}
                  className={`p-2 rounded ${
                    isFabricLoading || !isFabricLoaded || !canvasReady
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-white text-red-600 hover:bg-red-50"
                  }`}
                  title="Clear All"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>

              {/* Undo/Redo Buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={handleUndo}
                  disabled={!canUndo || isFabricLoading || !isFabricLoaded || !isComponentMounted || !canvasReady}
                  className={`p-2 rounded ${
                    !canUndo || isFabricLoading || !isFabricLoaded || !isComponentMounted || !canvasReady
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                  title="Undo"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                    />
                  </svg>
                </button>
                <button
                  onClick={handleRedo}
                  disabled={!canRedo || isFabricLoading || !isFabricLoaded || !isComponentMounted || !canvasReady}
                  className={`p-2 rounded ${
                    !canRedo || isFabricLoading || !isFabricLoaded || !isComponentMounted || !canvasReady
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                  title="Redo"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 10H11a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"
                    />
                  </svg>
                </button>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleZoom("out")}
                  disabled={isFabricLoading || !isFabricLoaded || !canvasReady}
                  className={`p-2 rounded ${
                    isFabricLoading || !isFabricLoaded || !canvasReady
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                  title="Zoom Out"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <span className="text-sm text-gray-700">{Math.round(zoom * 100)}%</span>
                <button
                  onClick={() => handleZoom("in")}
                  disabled={isFabricLoading || !isFabricLoaded || !canvasReady}
                  className={`p-2 rounded ${
                    isFabricLoading || !isFabricLoaded || !canvasReady
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                  title="Zoom In"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                <button
                  onClick={() => handleZoom("reset")}
                  disabled={isFabricLoading || !isFabricLoaded || !canvasReady}
                  className={`p-2 rounded ${
                    isFabricLoading || !isFabricLoaded || !canvasReady
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                  title="Reset Zoom"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
                    />
                  </svg>
                </button>
              </div>

              {/* Color and Size Controls */}
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={penColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  disabled={isFabricLoading || !isFabricLoaded || !isComponentMounted || !canvasReady}
                  className={`w-8 h-8 rounded ${
                    isFabricLoading || !isFabricLoaded || !isComponentMounted || !canvasReady
                      ? "cursor-not-allowed opacity-50"
                      : "cursor-pointer"
                  }`}
                  title="Color"
                />
                <div className="flex items-center space-x-1">
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={penSize}
                    onChange={(e) => handleBrushSizeChange(Number.parseInt(e.target.value))}
                    disabled={isFabricLoading || !isFabricLoaded || !isComponentMounted || !canvasReady}
                    className={`w-24 ${
                      isFabricLoading || !isFabricLoaded || !isComponentMounted || !canvasReady
                        ? "cursor-not-allowed opacity-50"
                        : ""
                    }`}
                    title="Brush Size"
                  />
                  <span className="text-xs text-gray-500 w-6 text-right">{penSize}px</span>
                </div>
              </div>
            </div>
          </div>

          {/* Canvas Container */}
          <div className="flex-1 relative bg-gray-100 overflow-hidden" ref={containerRef}>
            {/* Fabric.js Loading State */}
            {isFabricLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 z-20">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading drawing tools...</p>
                </div>
              </div>
            )}

            {/* Image Loading State */}
            {isImageLoading && !isFabricLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 z-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            )}

            {/* Canvas Ready Indicator */}
            {!canvasReady && !isImageLoading && !isFabricLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 z-10">
                <div className="text-center">
                  <div className="animate-pulse h-12 w-12 bg-gray-300 rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600">Preparing canvas...</p>
                </div>
              </div>
            )}

            <canvas
              ref={canvasRef}
              className="w-full h-full"
              style={{
                cursor:
                  activeTool === "pen"
                    ? "crosshair"
                    : activeTool === "text"
                      ? "text"
                      : activeTool === "comment"
                        ? "pointer"
                        : activeTool === "select"
                          ? "default"
                          : "crosshair",
              }}
            />
          </div>

          {/* Image Thumbnails */}
          {submission.answerImages && submission.answerImages.length > 1 && (
            <div className="bg-gray-100 p-4 border-t border-gray-200">
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {submission.answerImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => handleImageChange(index)}
                    disabled={isImageLoading || imageLoadingRef.current}
                    className={`flex-shrink-0 w-20 h-20 rounded border-2 ${
                      currentImageIndex === index ? "border-blue-500" : "border-gray-300"
                    } ${isImageLoading || imageLoadingRef.current ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <img
                      src={image.imageUrl || "/placeholder.svg"}
                      alt={`Answer ${index + 1}`}
                      className="w-full h-full object-cover rounded"
                      crossOrigin="anonymous"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-[800px] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Publish with AI Evaluation</h3>
              <button 
                onClick={handleCloseReviewModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Language Toggle for Review Modal */}
              {submission.hindiEvaluation && Object.keys(submission.hindiEvaluation).length > 0 && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-700">Edit Language:</span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setShowHindiEvaluation(false)}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${
                          !showHindiEvaluation 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-white text-blue-600 border border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        English
                      </button>
                      <button
                        onClick={() => setShowHindiEvaluation(true)}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${
                          showHindiEvaluation 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-white text-blue-600 border border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        हिंदी
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Evaluation (Editable) */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-lg font-medium text-gray-800 mb-4">
                  AI Evaluation (Editable) - {showHindiEvaluation ? 'हिंदी' : 'English'}
                </h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Accuracy (%)</label>
                      <input 
                        type="number" 
                        value={showHindiEvaluation ? editHindiEvaluation.relevancy : editEvaluation.relevancy} 
                        onChange={e => showHindiEvaluation ? handleHindiEvalFieldChange('relevancy', e.target.value) : handleEvalFieldChange('relevancy', e.target.value)} 
                        className="w-full border rounded px-3 py-2 text-base" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Marks</label>
                      <input 
                        type="number" 
                        value={showHindiEvaluation ? editHindiEvaluation.score : editEvaluation.score} 
                        onChange={e => showHindiEvaluation ? handleHindiEvalFieldChange('score', e.target.value) : handleEvalFieldChange('score', e.target.value)} 
                        className="w-full border rounded px-3 py-2 text-base" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Remark</label>
                    <input 
                      type="text" 
                      value={showHindiEvaluation ? editHindiEvaluation.remark : editEvaluation.remark} 
                      onChange={e => showHindiEvaluation ? handleHindiEvalFieldChange('remark', e.target.value) : handleEvalFieldChange('remark', e.target.value)} 
                      className="w-full border rounded px-3 py-2 text-base" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Introduction</label>
                    <textarea 
                      value={showHindiEvaluation ? editHindiEvaluation.introduction : editEvaluation.introduction} 
                      onChange={e => showHindiEvaluation ? handleHindiEvalFieldChange('introduction', e.target.value) : handleEvalFieldChange('introduction', e.target.value)} 
                      className="w-full border rounded px-3 py-2 text-base" 
                      rows={4} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
                    <textarea 
                      value={showHindiEvaluation ? editHindiEvaluation.body : editEvaluation.body} 
                      onChange={e => showHindiEvaluation ? handleHindiEvalFieldChange('body', e.target.value) : handleEvalFieldChange('body', e.target.value)} 
                      className="w-full border rounded px-3 py-2 text-base" 
                      rows={4} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Conclusion</label>
                    <textarea 
                      value={showHindiEvaluation ? editHindiEvaluation.conclusion : editEvaluation.conclusion} 
                      onChange={e => showHindiEvaluation ? handleHindiEvalFieldChange('conclusion', e.target.value) : handleEvalFieldChange('conclusion', e.target.value)} 
                      className="w-full border rounded px-3 py-2 text-base" 
                      rows={4} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Strengths (one per line)</label>
                    <textarea 
                      value={showHindiEvaluation ? editHindiEvaluation.strengths : editEvaluation.strengths} 
                      onChange={e => showHindiEvaluation ? handleHindiEvalFieldChange('strengths', e.target.value) : handleEvalFieldChange('strengths', e.target.value)} 
                      className="w-full border rounded px-3 py-2 text-base" 
                      rows={4} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Weaknesses (one per line)</label>
                    <textarea 
                      value={showHindiEvaluation ? editHindiEvaluation.weaknesses : editEvaluation.weaknesses} 
                      onChange={e => showHindiEvaluation ? handleHindiEvalFieldChange('weaknesses', e.target.value) : handleEvalFieldChange('weaknesses', e.target.value)} 
                      className="w-full border rounded px-3 py-2 text-base" 
                      rows={4} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Suggestions (one per line)</label>
                    <textarea 
                      value={showHindiEvaluation ? editHindiEvaluation.suggestions : editEvaluation.suggestions} 
                      onChange={e => showHindiEvaluation ? handleHindiEvalFieldChange('suggestions', e.target.value) : handleEvalFieldChange('suggestions', e.target.value)} 
                      className="w-full border rounded px-3 py-2 text-base" 
                      rows={4} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Feedback</label>
                    <textarea 
                      value={showHindiEvaluation ? editHindiEvaluation.feedback : editEvaluation.feedback} 
                      onChange={e => showHindiEvaluation ? handleHindiEvalFieldChange('feedback', e.target.value) : handleEvalFieldChange('feedback', e.target.value)} 
                      className="w-full border rounded px-3 py-2 text-base" 
                      rows={5} 
                    />
                  </div>
                </div>
              </div>

              {/* Annotated Images Preview */}
              {imagePreviews.length > 0 && (
                <div>
                  <h4 className="text-lg font-medium text-gray-800 mb-2">Your Annotations</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <button
                        type="button"
                        key={index}
                        onClick={() => { setOpenPreviewIndex(index); setIsZoomed(false); }}
                        className="relative focus:outline-none"
                        title="Click to preview"
                      >
                        <img
                          src={preview}
                          alt={`Annotated ${index + 1}`}
                          className="w-full h-44 object-cover rounded-lg shadow-md border cursor-zoom-in"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end pt-4 border-t mt-6">
                <button
                  onClick={handleCloseReviewModal}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 mr-2"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePublish}
                  disabled={loading || uploadingImages}
                  className={`px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${
                    (loading || uploadingImages) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? 'Publishing...' : 'Publish'}
                </button>
                {/* <button
                  onClick={handleEditEvaluation}
                  disabled={editLoading}
                  className={`px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 mr-2 ${editLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {editLoading ? 'Updating...' : 'Edit Evaluation'}
                </button> */}
              </div>
            </div>
          </div>
        </div>
      )}

      {openPreviewIndex !== null && (
        <div
          className="fixed inset-0 z-[999] bg-black bg-opacity-80 flex items-center justify-center"
          onClick={() => setOpenPreviewIndex(null)}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <img
              src={(imagePreviews && imagePreviews[openPreviewIndex]) || annotatedImagePreviews[openPreviewIndex] || "/placeholder.svg"}
              alt={`Full Annotated Preview ${openPreviewIndex + 1}`}
              onClick={() => setIsZoomed((z) => !z)}
              className={`rounded shadow-lg border-2 border-white transition-transform duration-200 ${isZoomed ? 'max-w-none max-h-none scale-125 cursor-zoom-out' : 'max-w-[90vw] max-h-[80vh] cursor-zoom-in'}`}
              style={isZoomed ? { width: 'auto', height: 'auto' } : {}}
            />
            <button
              onClick={() => setOpenPreviewIndex(null)}
              className="absolute top-2 right-2 bg-white bg-opacity-80 rounded-full p-2 hover:bg-opacity-100 transition"
              aria-label="Close full image preview"
            >
              <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AnnotateAnswer
