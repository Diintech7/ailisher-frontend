"use client"
import { useState, useRef, useEffect, useCallback } from "react"
import { toast } from "react-toastify"
import axios from "axios"

// Create axios instance with base configuration
const api = axios.create({
  baseURL: "https://test.ailisher.com/api",
  headers: {
    "Content-Type": "application/json",
  },
})

// Global Fabric.js loader promise
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

const AnswerAnnotation = ({ submission, onClose, onSave }) => {
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
  const [reviewData, setReviewData] = useState({
    review_result: "",
    expert_score: "",
    expert_remarks: "",
  })
  const [imagePreviews, setImagePreviews] = useState([])
  const [selectedImage, setSelectedImage] = useState(null)
  const [isFabricLoaded, setIsFabricLoaded] = useState(!!window.fabric && !!window.fabric.Canvas)
  const [isFabricLoading, setIsFabricLoading] = useState(false)
  const [isComponentMounted, setIsComponentMounted] = useState(true)
  const [canvasReady, setCanvasReady] = useState(false)
  const [modalAnswer, setModalAnswer] = useState(null);


  // --- [NEW] Comment tool states ---
  const [showCommentDropdown, setShowCommentDropdown] = useState(false)
  const [selectedComment, setSelectedComment] = useState("")

  // --- [NEW] Predefined comments with handwriting style ---
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
    "Review this",
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
  const historyRef = useRef([])
  const historyIndexRef = useRef(-1)
  const containerRef = useRef(null)
  const initializationLockRef = useRef(false)
  const imageLoadingRef = useRef(false)
  const currentImageRef = useRef(null)
  const currentImageIndexRef = useRef(0)
  const isChangingImageRef = useRef(false)

  // Add this after the useState declarations, before any useEffect or logic that uses answerImages
  const imagesToShow = submission.annotations?.length > 0
    ? submission.annotations.map(a => ({ imageUrl: a.downloadUrl }))
    : submission.answerImages || [];

  // History management functions (must be defined before use in useEffect)
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
        setAnnotations((prev) => {
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

  // Component mount/unmount tracking
  useEffect(() => {
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
          if (isComponentMounted && canvasReady) {
            saveToHistory()
          }
        })

        fabricCanvas.on("object:modified", () => {
          if (isComponentMounted && canvasReady) {
            saveToHistory()
          }
        })

        fabricCanvas.on("object:removed", () => {
          if (isComponentMounted && canvasReady) {
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
        if (imagesToShow && imagesToShow.length > 0) {
          await loadImageWithAnnotations(imagesToShow[currentImageIndex].imageUrl, currentImageIndex)
        }

        setCanvasReady(true)
        setIsImageLoading(false)
        console.log("Canvas initialization completed successfully")
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
  }, [isFabricLoaded, isComponentMounted, imagesToShow.map(img => img.imageUrl).join(",")]);

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
        const fabricImage = new window.fabric.Image(img, {
          scaleX: scale,
          scaleY: scale,
          left: (containerWidth - img.width * scale) / 2,
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

        canvas.clear()
        canvas.add(fabricImage)
        canvas.sendToBack(fabricImage)

        // Load saved annotations for the target index if they exist
        console.log("Checking for annotations at index", targetIndex, ":", annotations[targetIndex])
        if (annotations[targetIndex]) {
          console.log("Loading saved annotations for image", targetIndex)
          try {
            await new Promise((resolve) => {
              canvas.loadFromJSON(annotations[targetIndex], () => {
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
    [isComponentMounted, annotations, canvasReady],
  )

  // Save annotations for a specific image index
  const saveAnnotationsForIndex = useCallback(
    (index) => {
      if (fabricCanvasRef.current && isComponentMounted && canvasReady) {
        try {
          const json = fabricCanvasRef.current.toJSON()
          setAnnotations((prev) => {
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
        console.log("Current annotations state:", annotations)
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
            if (isComponentMounted && canvasReady) saveToHistory()
          })

          fabricCanvas.on("object:modified", () => {
            if (isComponentMounted && canvasReady) saveToHistory()
          })

          fabricCanvas.on("object:removed", () => {
            if (isComponentMounted && canvasReady) saveToHistory()
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
          if (imagesToShow && imagesToShow[index]) {
            await loadImageWithAnnotations(imagesToShow[index].imageUrl, index)
          }

          setCanvasReady(true)
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
          toast.error("Error switching image")
          setIsImageLoading(false)
        }
        isChangingImageRef.current = false
      }
    },
    [
      currentImageIndex,
      imagesToShow,
      isComponentMounted,
      canvasReady,
      saveToHistory,
      saveAnnotationsForIndex,
      annotations,
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

        case "rectangle":
          canvas.defaultCursor = "crosshair"
          canvas.isDrawingMode = false
          canvas.selection = false
          let startPoint
          let currentRect
          let isDrawing = false

          canvas.on("mouse:down", (o) => {
            if (o.e.button === 0) {
              isDrawing = true
              const pointer = canvas.getPointer(o.e)
              startPoint = { x: pointer.x, y: pointer.y }
              currentRect = new window.fabric.Rect({
                left: startPoint.x,
                top: startPoint.y,
                width: 0,
                height: 0,
                fill: "transparent",
                stroke: penColor,
                strokeWidth: penSize,
                selectable: false,
                evented: false,
              })
              canvas.add(currentRect)
              o.e.preventDefault()
              o.e.stopPropagation()
            }
          })

          canvas.on("mouse:move", (o) => {
            if (!isDrawing || !currentRect) return
            const pointer = canvas.getPointer(o.e)
            const width = pointer.x - startPoint.x
            const height = pointer.y - startPoint.y
            currentRect.set({
              width: Math.abs(width),
              height: Math.abs(height),
              left: width > 0 ? startPoint.x : pointer.x,
              top: height > 0 ? startPoint.y : pointer.y,
            })
            canvas.renderAll()
            o.e.preventDefault()
            o.e.stopPropagation()
          })

          canvas.on("mouse:up", (o) => {
            if (isDrawing) {
              isDrawing = false
              currentRect = null
              o.e.preventDefault()
              o.e.stopPropagation()
            }
          })
          break

        case "circle":
          canvas.defaultCursor = "crosshair"
          canvas.isDrawingMode = false
          canvas.selection = false
          let startPointCircle
          let currentCircle
          let isDrawingCircle = false

          canvas.on("mouse:down", (o) => {
            if (o.e.button === 0) {
              isDrawingCircle = true
              const pointer = canvas.getPointer(o.e)
              startPointCircle = { x: pointer.x, y: pointer.y }
              currentCircle = new window.fabric.Circle({
                left: startPointCircle.x,
                top: startPointCircle.y,
                radius: 0,
                fill: "transparent",
                stroke: penColor,
                strokeWidth: penSize,
                selectable: false,
                evented: false,
              })
              canvas.add(currentCircle)
              o.e.preventDefault()
              o.e.stopPropagation()
            }
          })

          canvas.on("mouse:move", (o) => {
            if (!isDrawingCircle || !currentCircle) return
            const pointer = canvas.getPointer(o.e)
            const radius = Math.sqrt(
              Math.pow(pointer.x - startPointCircle.x, 2) + Math.pow(pointer.y - startPointCircle.y, 2),
            )
            currentCircle.set({
              radius: radius,
            })
            canvas.renderAll()
            o.e.preventDefault()
            o.e.stopPropagation()
          })

          canvas.on("mouse:up", (o) => {
            if (isDrawingCircle) {
              isDrawingCircle = false
              currentCircle = null
              o.e.preventDefault()
              o.e.stopPropagation()
            }
          })
          break

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
          case "text":
            fabricCanvasRef.current.isDrawingMode = false
            const text = new window.fabric.IText("Double click to edit", {
              left: 100,
              top: 100,
              fontFamily: "Kalam, cursive",
              fill: penColor,
              fontSize: 20,
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
            break

          case "comment":
            fabricCanvasRef.current.isDrawingMode = false
            setShowCommentDropdown(true)
            break

          case "clear":
            fabricCanvasRef.current.clear()
            // Re-add the background image
            if (backgroundImageRef.current) {
              fabricCanvasRef.current.add(backgroundImageRef.current)
              fabricCanvasRef.current.sendToBack(backgroundImageRef.current)
              fabricCanvasRef.current.renderAll()
            }
            break
        }
      } catch (error) {
        console.error("Error applying tool:", error)
        toast.error("Failed to apply tool")
      }
    },
    [penColor, canvasReady],
  )

  // Handle comment selection and placement
  const handleCommentSelect = useCallback(
    (comment) => {
      if (!fabricCanvasRef.current || !window.fabric || !canvasReady) {
        return
      }

      try {
        const commentText = new window.fabric.IText(comment, {
          left: 100,
          top: 100,
          fontFamily: "Kalam, cursive",
          fill: penColor,
          fontSize: 18,
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

        fabricCanvasRef.current.add(commentText)
        fabricCanvasRef.current.setActiveObject(commentText)
        fabricCanvasRef.current.renderAll()

        setShowCommentDropdown(false)
        setSelectedComment("")
        toast.success("Comment added! You can move and edit it.")
      } catch (error) {
        console.error("Error adding comment:", error)
        toast.error("Failed to add comment")
      }
    },
    [penColor, canvasReady],
  )

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

  const handleUndo = () => {
    if (!fabricCanvasRef.current || !canUndo) return

    try {
      if (historyIndexRef.current > 0) {
        historyIndexRef.current--
        const historyState = historyRef.current[historyIndexRef.current]
        fabricCanvasRef.current.loadFromJSON(historyState, () => {
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
          fabricCanvasRef.current.renderAll()
          updateUndoRedoState()
        })
      }
    } catch (error) {
      console.error("Error during redo:", error)
    }
  }

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

  // Function to scale annotation objects for original image size
  function scaleAnnotationObjects(objects, scale, offsetX, offsetY) {
    return objects.map((obj) => {
      const newObj = { ...obj }

      // Position scaling
      if (typeof newObj.left === "number") newObj.left = (newObj.left - offsetX) / scale
      if (typeof newObj.top === "number") newObj.top = (newObj.top - offsetY) / scale

      // Size scaling
      if (typeof newObj.width === "number") newObj.width = newObj.width / scale
      if (typeof newObj.height === "number") newObj.height = newObj.height / scale
      if (typeof newObj.radius === "number") newObj.radius = newObj.radius / scale

      // Font size scaling
      if (typeof newObj.fontSize === "number") newObj.fontSize = newObj.fontSize / scale

      // Stroke width scaling
      if (typeof newObj.strokeWidth === "number") newObj.strokeWidth = newObj.strokeWidth / scale

      // Path scaling (for pen/free drawing)
      if (Array.isArray(newObj.path)) {
        newObj.path = newObj.path.map((cmd) => {
          return cmd.map((v, i) => {
            if (i === 0) return v // command letter
            if (typeof v === "number") {
              return (v - (i % 2 === 1 ? offsetX : offsetY)) / scale
            }
            return v
          })
        })
      }

      // Points scaling (for polyline, polygon, etc.)
      if (Array.isArray(newObj.points)) {
        newObj.points = newObj.points.map((pt) => ({
          x: (pt.x - offsetX) / scale,
          y: (pt.y - offsetY) / scale,
        }))
      }

      return newObj
    })
  }

  // Get annotated images - FIXED to use original image with annotations
  const getAnnotatedImages = async () => {
    console.log("=== getAnnotatedImages called ===")

    if (!fabricCanvasRef.current || !window.fabric || !isComponentMounted) {
      console.error("Canvas not initialized")
      toast.error("Canvas not ready")
      return null
    }

    if (!imagesToShow || imagesToShow.length === 0) {
      console.error("No answer images found")
      toast.error("No answer images found")
      return null
    }

    try {
      setUploadingImages(true)

      // Save current annotations first
      const currentJson = fabricCanvasRef.current.toJSON()
      const allAnnotations = {
        ...annotations,
        [currentImageIndexRef.current]: currentJson,
      }

      console.log("Processing annotations for", imagesToShow.length, "images")
      console.log("All annotations:", allAnnotations)

      const annotatedResults = []

      for (let i = 0; i < imagesToShow.length; i++) {
        console.log(`Processing image ${i}...`)
        const imageData = imagesToShow[i]
        const imageAnnotations = allAnnotations[i]

        if (!imageData || !imageData.imageUrl) {
          console.warn(`Skipping image ${i} - no valid image data`)
          continue
        }

        try {
          // 1. Load original image
          const img = await new Promise((resolve, reject) => {
            const image = new Image()
            image.crossOrigin = "anonymous"
            image.onload = () => resolve(image)
            image.onerror = reject
            image.src = imageData.imageUrl
          })

          console.log(`Original image ${i} loaded:`, { width: img.width, height: img.height })

          // 2. Create temp canvas at original image size
          const tempCanvas = document.createElement("canvas")
          tempCanvas.width = img.width
          tempCanvas.height = img.height

          const tempFabricCanvas = new window.fabric.Canvas(tempCanvas, {
            width: img.width,
            height: img.height,
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

          // 4. Add scaled annotations if they exist
          if (imageAnnotations && imageAnnotations.objects) {
            // Calculate the scale and offset used in the display canvas
            const container = fabricCanvasRef.current.getElement().parentElement
            const containerWidth = container.clientWidth
            const containerHeight = container.clientHeight

            const scaleX = containerWidth / img.width
            const scaleY = containerHeight / img.height
            const displayScale = Math.min(scaleX, scaleY)

            const offsetX = (containerWidth - img.width * displayScale) / 2
            const offsetY = (containerHeight - img.height * displayScale) / 2

            console.log(`Image ${i} scaling info:`, {
              containerWidth,
              containerHeight,
              imageWidth: img.width,
              imageHeight: img.height,
              displayScale,
              offsetX,
              offsetY,
            })

            // Filter out the background image and scale annotations
            const annotationObjects = imageAnnotations.objects.filter((obj) => obj.type !== "image")

            if (annotationObjects.length > 0) {
              const scaledObjects = scaleAnnotationObjects(annotationObjects, displayScale, offsetX, offsetY)

              console.log(`Image ${i} has ${scaledObjects.length} annotation objects`)

              // Add scaled annotations to temp canvas
              await new Promise((resolve) => {
                window.fabric.util.enlivenObjects(
                  scaledObjects,
                  (enlivenedObjects) => {
                    enlivenedObjects.forEach((obj) => {
                      tempFabricCanvas.add(obj)
                    })
                    tempFabricCanvas.renderAll()
                    console.log(`Image ${i} annotations rendered`)
                    resolve()
                  },
                  null,
                )
              })
            }
          }

          // 5. Convert to blob and upload
          await new Promise((resolve) => {
            tempCanvas.toBlob(
              async (blob) => {
                try {
                  if (blob) {
                    console.log(`Blob created for image ${i}:`, { size: blob.size, type: blob.type })

                    const file = new File([blob], `annotated-image-${i + 1}.png`, { type: "image/png" })

                    // Upload to S3
                    const uploadUrlResponse = await api.post("/review/annotated-image-upload-url", {
                      fileName: file.name,
                      contentType: file.type,
                      clientId: submission.clientId || "CLI677117YN7N",
                      answerId: submission._id,
                    })

                    if (!uploadUrlResponse.data.success) {
                      throw new Error("Failed to get upload URL")
                    }

                    const uploadUrl = uploadUrlResponse.data.data.uploadUrl
                    const key = uploadUrlResponse.data.data.key

                    const uploadResponse = await fetch(uploadUrl, {
                      method: "PUT",
                      body: file,
                      headers: { "Content-Type": file.type },
                    })

                    if (!uploadResponse.ok) {
                      throw new Error("Failed to upload to S3")
                    }

                    // Create preview URL
                    const previewUrl = tempCanvas.toDataURL("image/png")

                    annotatedResults.push({
                      originalIndex: i,
                      s3Key: key,
                      fileName: file.name,
                      previewUrl: previewUrl,
                    })

                    console.log(`Successfully processed and uploaded image ${i} with S3 key:`, key)
                  } else {
                    console.error(`Failed to create blob for image ${i}`)
                  }

                  tempFabricCanvas.dispose()
                  resolve()
                } catch (uploadError) {
                  console.error(`Error uploading image ${i}:`, uploadError)
                  tempFabricCanvas.dispose()
                  resolve()
                }
              },
              "image/png",
              0.9,
            )
          })
        } catch (imageError) {
          console.error(`Error processing image ${i}:`, imageError)
        }
      }

      console.log("Annotation processing completed. Results:", annotatedResults)
      setUploadingImages(false)
      return annotatedResults
    } catch (error) {
      console.error("Error getting annotated images:", error)
      setUploadingImages(false)
      toast.error("Failed to process annotations")
      return null
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
        onSave({ annotations: annotations })
      }
      toast.success("Annotations saved successfully!")
    } catch (error) {
      console.error("Error saving:", error)
      toast.error("Failed to save annotations")
    }
  }

  const handleCompleteReview = async () => {
    try {
      setLoading(true)
      console.log("Starting complete review process...")

      // Get annotated images with S3 upload
      const annotatedResults = await getAnnotatedImages()
      if (!annotatedResults || annotatedResults.length === 0) {
        setLoading(false)
        toast.error("Failed to process annotated images")
        return
      }

      // Prepare data for modal
      const s3Keys = annotatedResults.map((result) => ({ s3Key: result.s3Key }))
      const previews = annotatedResults.map((result) => result.previewUrl)

      setAnnotatedImages(s3Keys)
      setImagePreviews(previews)
      setIsReviewModalOpen(true)
      setLoading(false)

      console.log("Complete review modal opened with", s3Keys.length, "images")
    } catch (error) {
      setLoading(false)
      console.error("Error in handleCompleteReview:", error)
      toast.error("Failed to process review")
    }
  }

  const handleClose = () => {
    setIsComponentMounted(false)

    if (fabricCanvasRef.current) {
      try {
        fabricCanvasRef.current.dispose()
      } catch (error) {
        console.warn("Error disposing fabric canvas on close:", error)
      }
      fabricCanvasRef.current = null
    }

    onClose()
  }

  const handleCloseReviewModal = () => {
    setIsReviewModalOpen(false)
    setReviewData({
      review_result: "",
      expert_score: "",
      expert_remarks: "",
    })
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault()

    if (!reviewData.review_result || !reviewData.expert_score || !reviewData.expert_remarks) {
      toast.error("Please fill in all required fields")
      return
    }

    if (annotatedImages.length === 0) {
      toast.error("No annotated images found")
      return
    }

    try {
      setLoading(true)

      // Get review request ID
      const reviewRequestResponse = await api.get(`/review/by-submission/${submission._id}`)
      if (!reviewRequestResponse.data.success) {
        throw new Error("Failed to fetch review request")
      }

      const requestId = reviewRequestResponse.data.data.requestId

      if (submission.reviewStatus !== "review_accepted") {
        throw new Error("Answer is not in the correct status for review submission")
      }

      // Submit review with annotated images
      const response = await api.post(`/review/${requestId}/submit`, {
        ...reviewData,
        annotated_images: annotatedImages,
      })

      if (response.data.success) {
        toast.success("Review submitted successfully")
        if (onSave) {
          onSave(response.data.data)
        }
        handleCloseReviewModal()
        onClose()
      } else {
        throw new Error("Failed to submit review")
      }
    } catch (error) {
      console.error("Error submitting review:", error)
      toast.error(error.message || "Failed to submit review")
    } finally {
      setLoading(false)
    }
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
  const handleImageUpload = async (file) => {
    try {
      console.log("Starting image upload for file:", file.name)
      // Get presigned URL for upload
      const uploadUrlResponse = await api.post("/review/annotated-image-upload-url", {
        fileName: file.name,
        contentType: file.type,
        clientId: submission.clientId || "CLI677117YN7N",
        answerId: submission._id,
      })

      console.log("Upload URL Response:", uploadUrlResponse.data)

      if (!uploadUrlResponse.data.success) {
        throw new Error(uploadUrlResponse.data.message || "Failed to get upload URL")
      }

      const uploadUrl = uploadUrlResponse.data.data.uploadUrl
      const key = uploadUrlResponse.data.data.key

      console.log("Extracted uploadUrl:", uploadUrl)
      console.log("Extracted key:", key)

      if (!uploadUrl || typeof uploadUrl !== "string") {
        throw new Error("Invalid upload URL received from server")
      }

      // Upload to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      })

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text()
        console.error("S3 Upload Error:", {
          status: uploadResponse.status,
          statusText: uploadResponse.statusText,
          errorText,
        })
        throw new Error(`Failed to upload image to S3: ${errorText}`)
      }

      // Add to annotated images array
      setAnnotatedImages((prev) => {
        const newImages = Array.isArray(prev) ? [...prev] : []
        newImages.push({ s3Key: key })
        return newImages
      })

      return key
    } catch (error) {
      console.error("Error uploading image:", error)
      if (error.response) {
        console.error("Error response data:", error.response.data)
        console.error("Error response status:", error.response.status)
        console.error("Error response headers:", error.response.headers)
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
      const s3Key = await handleImageUpload(file)

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

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setReviewData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Debug: Monitor annotations changes
  useEffect(() => {
    console.log("annotations state updated:", annotations)
  }, [annotations])

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

  useEffect(()=>{
    console.log(submission)
  })

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Load Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Kalam:wght@300;400;700&display=swap" rel="stylesheet" />
      <link
        href="https://fonts.googleapis.com/css2?family=Playpen+Sans:wght@300..800&family=Swanky+and+Moo+Moo&display=swap"
        rel="stylesheet"
      />

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
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            disabled={!isComponentMounted || !canvasReady}
          >
            Save Annotations
          </button>
          <button
            onClick={handleCompleteReview}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            disabled={!isComponentMounted || !canvasReady || loading}
          >
            {loading ? "Processing..." : "Complete Review"}
          </button>
          <button onClick={handleClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
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
              <p className="text-sm text-gray-800 mb-3">{submission.questionId?.question || 'N/A'}</p>
              <div className="text-xs text-gray-600">
                <div>QID: {submission.questionId._id}</div>
                <div>UID: {submission.userId._id}</div>
                <div>Difficulty: {submission.questionId.metadata?.difficultyLevel || 'N/A'}</div>
                <div>Max Marks: {submission.questionId.metadata?.maximumMarks || 'N/A'}</div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="space-y-4">
              <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-green-700">Score:</span>
                  <span className="text-lg font-bold text-green-900">
                    {typeof submission.evaluation.score === 'number' ? `${submission.evaluation.score}/${submission.questionId.metadata?.maximumMarks || 'N/A'}` : submission.evaluation.score || 'Not evaluated'}
                  </span>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-green-700">Relevancy:</span>
                    <span className="text-lg font-bold text-green-900">
                      {typeof submission.evaluation.relevancy === 'number' ? `${submission.evaluation.relevancy}%` : submission.evaluation.relevancy || 'Not evaluated'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-500 ease-out"
                      style={{ 
                        width: typeof submission.evaluation.relevancy === 'number' ? `${submission.evaluation.relevancy}%` : '0%',
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
            {submission.evaluation.remark && submission.evaluation.remark !== 'No remark provided' && (
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <h4 className="text-sm font-medium text-orange-700 mb-2">Evaluation Remark</h4>
                <p className="text-sm text-orange-800">{submission.evaluation.remark}</p>
              </div>
            )}

            {/* Evaluation Comments */}
            {submission.evaluation.comments && submission.evaluation.comments.length > 0 && (
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                <h4 className="text-sm font-medium text-indigo-700 mb-2">Evaluation Comments</h4>
                <ul className="space-y-2">
                  {submission.evaluation.comments.map((comment, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span className="text-sm text-indigo-800">{comment}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Analysis Details */}
            {submission.evaluation.analysis && (
              (submission.evaluation.analysis.introduction|| 
                submission.evaluation.analysis.body|| 
                submission.evaluation.analysis.conclusio) && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Analysis Details</h4>
                  <div className="space-y-3">
                    {submission.evaluation.analysis.introduction && (
                      <div className="bg-pink-50 rounded-lg p-3 border border-pink-200">
                        <h5 className="text-xs font-semibold text-pink-800 mb-1">Introduction</h5>
                        <ul className="space-y-1">
                          {submission.evaluation.analysis.introduction.map((item, index) => (
                            <li key={index} className="text-xs text-pink-700">• {item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {submission.evaluation.analysis.body && (
                      <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                        <h5 className="text-xs font-semibold text-orange-800 mb-1">Body</h5>
                        <ul className="space-y-1">
                          {submission.evaluation.analysis.body.map((item, index) => (
                            <li key={index} className="text-xs text-orange-700">• {item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {submission.evaluation.analysis.conclusion && (
                      <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                        <h5 className="text-xs font-semibold text-purple-800 mb-1">Conclusion</h5>
                        <ul className="space-y-1">
                          {submission.evaluation.analysis.conclusion.map((item, index) => (
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
            {submission.evaluation.analysis.strengths && submission.evaluation.analysis.strengths.length > 0 && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="text-sm font-medium text-green-700 mb-2">Strengths</h4>
                <ul className="space-y-2">
                  {submission.evaluation.analysis.strengths.map((strength, index) => (
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
            {submission.evaluation.analysis.weaknesses && submission.evaluation.analysis.weaknesses.length > 0 && (
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h4 className="text-sm font-medium text-red-700 mb-2">Areas for Improvement</h4>
                <ul className="space-y-2">
                  {submission.evaluation.analysis.weaknesses.map((weakness, index) => (
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
            {submission.evaluation.analysis.suggestions && submission.evaluation.analysis.suggestions.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="text-sm font-medium text-blue-700 mb-2">Suggestions</h4>
                <ul className="space-y-2">
                  {submission.evaluation.analysis.suggestions.map((suggestion, index) => (
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
            {submission.evaluation.analysis.feedback && submission.evaluation.analysis.feedback.length > 0 && (
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h4 className="text-sm font-medium text-purple-700 mb-2">Detailed Feedback</h4>
                <p className="text-sm text-purple-800 whitespace-pre-wrap">{submission.evaluation.analysis.feedback}</p>
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
          {imagesToShow.length > 1 && (
            <div className="bg-gray-100 p-4 border-t border-gray-200">
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {imagesToShow.map((image, index) => (
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
              <h3 className="text-xl font-semibold">Complete Review</h3>
              <button onClick={handleCloseReviewModal} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-6">
              {/* Review Result */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Review Result</label>
                <input
                  type="text"
                  name="review_result"
                  value={reviewData.review_result}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Expert Score */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Score (0-{submission.questionId.metadata?.maximumMarks})
                </label>
                <input
                  type="number"
                  name="expert_score"
                  value={reviewData.expert_score}
                  onChange={handleInputChange}
                  min="0"
                  max={submission.questionId.metadata?.maximumMarks}
                  step="0.1"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Expert Remarks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
                <textarea
                  name="expert_remarks"
                  value={reviewData.expert_remarks}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Image Upload Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">Annotated Images</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="image-upload"
                      disabled={uploadingImages}
                    />
                    <label
                      htmlFor="image-upload"
                      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                        uploadingImages
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
                      }`}
                    >
                      {uploadingImages ? "Uploading..." : "Upload Image"}
                    </label>
                  </div>
                </div>

                {/* Selected Image Preview */}
                {selectedImage && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-2">Selected Image Preview:</p>
                    <div className="relative w-full max-w-md">
                      <img
                        src={selectedImage || "/placeholder.svg"}
                        alt="Selected"
                        className="w-full h-auto rounded-lg shadow-md"
                      />
                      {uploadingImages && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                          <div className="text-white">Uploading...</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Uploaded Images Preview */}
                {imagePreviews.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-2">Uploaded Images:</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative">
                          <img
                            src={preview || "/placeholder.svg"}
                            alt={`Uploaded ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg shadow-md"
                          />
                          <button
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading || uploadingImages}
                  className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${
                    loading || uploadingImages ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {loading ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AnswerAnnotation
