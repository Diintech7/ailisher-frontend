"use client"
import { useState, useRef, useEffect, useCallback } from "react"
import { toast } from "react-toastify"
import axios from "axios"

const api = axios.create({
  baseURL: "https://aipbbackend-c5ed.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
})

let fabricLoaderPromise = null

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
  // Add state for annotated image previews
  const [annotatedImagePreviews, setAnnotatedImagePreviews] = useState([])
  // Add state for full image view
  const [openPreviewIndex, setOpenPreviewIndex] = useState(null)

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
  const historyRef = useRef([])
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
        if (submission.answerImages && submission.answerImages.length > 0) {
          await loadImageWithAnnotations(submission.answerImages[currentImageIndex].imageUrl, currentImageIndex)
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
          if (submission.answerImages && submission.answerImages[index]) {
            await loadImageWithAnnotations(submission.answerImages[index].imageUrl, index)
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
    [penColor, penSize, canvasReady],
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

      const tempCanvas = document.createElement("canvas")
      tempCanvas.width = img.width
      tempCanvas.height = img.height

      const tempFabricCanvas = new window.fabric.Canvas(tempCanvas, {
        width: img.width,
        height: img.height,
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

      if (annotations && annotations.objects) {
        const container = fabricCanvasRef.current.getElement().parentElement
        const containerWidth = container.clientWidth
        const containerHeight = container.clientHeight

        const scaleX = containerWidth / img.width
        const scaleY = containerHeight / img.height
        const scale = Math.min(scaleX, scaleY)

        const offsetX = (containerWidth - img.width * scale) / 2
        const offsetY = (containerHeight - img.height * scale) / 2

        const annotationObjects = annotations.objects.filter((obj) => obj.type !== "image")
        const scaledObjects = scaleAnnotationObjects(annotationObjects, scale, offsetX, offsetY)

        if (scaledObjects.length > 0) {
          await new Promise((resolve) => {
            window.fabric.util.enlivenObjects(
              scaledObjects,
              (enlivenedObjects) => {
                enlivenedObjects.forEach((obj) => tempFabricCanvas.add(obj))
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

          // 4. Add annotation objects, scaled to original image size
          if (annotations && annotations.objects) {
            // Calculate scale and offset used in the annotation canvas
            const container = fabricCanvasRef.current.getElement().parentElement
            const containerWidth = container.clientWidth
            const containerHeight = container.clientHeight

            const scaleX = containerWidth / img.width
            const scaleY = containerHeight / img.height
            const scale = Math.min(scaleX, scaleY)

            const offsetX = (containerWidth - img.width * scale) / 2
            const offsetY = (containerHeight - img.height * scale) / 2

            const annotationObjects = annotations.objects.filter((obj) => obj.type !== "image")
            const scaledObjects = scaleAnnotationObjects(annotationObjects, scale, offsetX, offsetY)

            if (scaledObjects.length > 0) {
              await new Promise((resolve) => {
                window.fabric.util.enlivenObjects(
                  scaledObjects,
                  (enlivenedObjects) => {
                    enlivenedObjects.forEach((obj) => tempFabricCanvas.add(obj))
                    tempFabricCanvas.renderAll()
                    resolve()
                  },
                  null,
                )
              })
            }
          }

          // 5. Export and upload
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

      const publishPromises = publishPayloads.map((payload) =>
        api.post(publishEndpoint, payload).then((res) => {
          console.log("[PublishWithAnnotation] Publish API response for payload:", payload, res.data)
          return res
        }),
      )

      await Promise.all(publishPromises)

      toast.success("Annotations published successfully!")
      setIsReviewModalOpen(false)
      if (onSave) onSave()
      onClose()
    } catch (error) {
      console.error("[PublishWithAnnotation] Error during publish:", error)
      toast.error(error.message || "Failed to publish annotations.")
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
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            disabled={!isComponentMounted || !canvasReady}
          >
            Save Annotations
          </button>
          <button
            onClick={handleOpenPublishModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            disabled={!isComponentMounted || !canvasReady}
          >
            Publish With Annotation
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
          <div className="space-y-6">
            {/* Accuracy */}
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
              <h3 className="text-sm font-medium text-purple-700 mb-2">Accuracy</h3>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-purple-600 h-2.5 rounded-full"
                  style={{ width: `${submission.evaluation?.accuracy || 0}%` }}
                ></div>
              </div>
              <p className="text-lg font-semibold text-gray-800 mt-1">{submission.evaluation?.accuracy || 0}%</p>
            </div>

            {/* Strengths */}
            {submission.evaluation?.strengths?.length > 0 && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <h3 className="text-sm font-medium text-green-700 mb-2">Strengths</h3>
                <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
                  {submission.evaluation.strengths.map((strength, index) => (
                    <li key={index}>{strength}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Weaknesses */}
            {submission.evaluation?.weaknesses?.length > 0 && (
              <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                <h3 className="text-sm font-medium text-red-700 mb-2">Areas for Improvement</h3>
                <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
                  {submission.evaluation.weaknesses.map((weakness, index) => (
                    <li key={index}>{weakness}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggestions */}
            {submission.evaluation?.suggestions?.length > 0 && (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                <h3 className="text-sm font-medium text-yellow-700 mb-2">Suggestions</h3>
                <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
                  {submission.evaluation.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Marks */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h3 className="text-sm font-medium text-blue-700 mb-2">Marks Awarded</h3>
              <p className="text-2xl font-bold text-blue-800">
                {submission.evaluation?.marks || 0} /{" "}
                {submission.evaluation?.totalMarks || submission.questionId?.metadata?.maximumMarks || 0}
              </p>
            </div>

            {/* Feedback */}
            {submission.evaluation?.feedback && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Feedback</h3>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{submission.evaluation.feedback}</p>
              </div>
            )}
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
              <button onClick={handleCloseReviewModal} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* AI Evaluation Details */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-lg font-medium text-gray-800 mb-4">AI Evaluation Summary</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Accuracy:</span>
                    <span className="text-sm font-bold text-purple-700">{submission.evaluation?.accuracy || 0}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Marks:</span>
                    <span className="text-sm font-bold text-blue-700">
                      {submission.evaluation?.marks || 0} /{" "}
                      {submission.questionId?.metadata?.maximumMarks || submission.evaluation?.totalMarks || 0}
                    </span>
                  </div>
                  {submission.evaluation?.strengths?.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-green-700 mb-1">Strengths</h5>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {submission.evaluation.strengths.map((strength, index) => (
                          <li key={index}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {submission.evaluation?.weaknesses?.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-red-700 mb-1">Areas for Improvement</h5>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {submission.evaluation.weaknesses.map((weakness, index) => (
                          <li key={index}>{weakness}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Annotated Images Preview */}
              {imagePreviews.length > 0 && (
                <div>
                  <h4 className="text-lg font-medium text-gray-800 mb-2">Your Annotations</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview || "/placeholder.svg"}
                          alt={`Annotated ${index + 1}`}
                          className="w-full h-40 object-cover rounded-lg shadow-md border"
                        />
                      </div>
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
                    loading || uploadingImages ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {loading ? "Publishing..." : "Publish"}
                </button>
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
              src={annotatedImagePreviews[openPreviewIndex] || "/placeholder.svg"}
              alt={`Full Annotated Preview ${openPreviewIndex + 1}`}
              className="max-w-[90vw] max-h-[80vh] rounded shadow-lg border-2 border-white"
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
