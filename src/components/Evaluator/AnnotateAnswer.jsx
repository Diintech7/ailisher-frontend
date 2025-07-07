"use client"

import { useState, useRef, useEffect } from "react"
import { toast } from "react-toastify"
import axios from 'axios'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Global Fabric.js loader promise
let fabricLoaderPromise = null;

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
  const [score, setScore] = useState('')
  const [expertRemarks, setExpertRemarks] = useState('')
  const [annotatedImages, setAnnotatedImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [reviewData, setReviewData] = useState({
    review_result: '',
    expert_score: '',
    expert_remarks: '',
  })
  const [imagePreviews, setImagePreviews] = useState([])
  const [selectedImage, setSelectedImage] = useState(null)
  const [isFabricLoaded, setIsFabricLoaded] = useState(!!window.fabric && !!window.fabric.Canvas)
  const [isFabricLoading, setIsFabricLoading] = useState(false)
  const [isComponentMounted, setIsComponentMounted] = useState(true)
  // --- [NEW] Canvas key for remounting ---
  const [canvasKey, setCanvasKey] = useState(0)

  const canvasRef = useRef(null)
  const fabricCanvasRef = useRef(null)
  const backgroundImageRef = useRef(null)
  const historyRef = useRef([])
  const historyIndexRef = useRef(-1)
  const containerRef = useRef(null)
  const tempElementsRef = useRef([])

  // Component mount/unmount tracking
  useEffect(() => {
    setIsComponentMounted(true)
    return () => {
      setIsComponentMounted(false)
    }
  }, [])

  // Cleanup function for temporary elements
  const cleanupTempElements = () => {
    if (tempElementsRef.current) {
      tempElementsRef.current.forEach(element => {
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
  }

  // Enhanced cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupTempElements()
      
      // Cleanup fabric canvas
      if (fabricCanvasRef.current) {
        try {
          fabricCanvasRef.current.dispose()
        } catch (error) {
          console.warn("Error disposing fabric canvas:", error)
        }
        fabricCanvasRef.current = null
      }
    }
  }, [])

  // Utility function to check if canvas is ready for operations
  const isCanvasReady = () => {
    if (!isComponentMounted) return false
    
    try {
      return (
        fabricCanvasRef.current &&
        window.fabric &&
        fabricCanvasRef.current.getContext &&
        fabricCanvasRef.current.getContext('2d') &&
        fabricCanvasRef.current.getContext('2d') !== null &&
        !isFabricLoading &&
        isFabricLoaded &&
        fabricCanvasRef.current.width > 0 &&
        fabricCanvasRef.current.height > 0
      )
    } catch (error) {
      console.warn("Error checking canvas readiness:", error)
      return false
    }
  }

  // Safe canvas operation wrapper
  const safeCanvasOperation = (operation, operationName = 'canvas operation') => {
    if (!isCanvasReady() || !isComponentMounted) {
      console.warn(`Canvas not ready for ${operationName}`);
      return false;
    }

    try {
      const result = operation();
      return result;
    } catch (error) {
      console.error(`Error in ${operationName}:`, error);
      return false;
    }
  }

  // Load Fabric.js
  useEffect(() => {
    let isMounted = true;
    if (window.fabric && window.fabric.Canvas) {
      setIsFabricLoaded(true);
      setIsFabricLoading(false);
      return;
    }
    if (!fabricLoaderPromise) {
      setIsFabricLoading(true);
      fabricLoaderPromise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js";
        script.async = true;
        script.onload = () => {
          if (isMounted) {
            setIsFabricLoaded(true);
            setIsFabricLoading(false);
          }
          resolve();
        };
        script.onerror = (error) => {
          if (isMounted) {
            setIsFabricLoading(false);
          }
          reject(error);
        };
        document.head.appendChild(script);
      });
    } else {
      setIsFabricLoading(true);
      fabricLoaderPromise.then(() => {
        if (isMounted) {
          setIsFabricLoaded(true);
          setIsFabricLoading(false);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, []);

  // Initialize canvas when Fabric.js is loaded and component mounts
  useEffect(() => {
    if (!isFabricLoaded || !canvasRef.current || !isComponentMounted) return;

    const initializeCanvas = async () => {
      if (!canvasRef.current || !window.fabric || !window.fabric.Canvas) {
        console.log("Canvas initialization skipped - Fabric.js not ready");
        return;
      }

      try {
        // Clean up existing canvas if it exists
        if (fabricCanvasRef.current) {
          try {
            fabricCanvasRef.current.dispose()
          } catch (disposeError) {
            console.warn("Error disposing existing canvas:", disposeError)
          }
          fabricCanvasRef.current = null
        }

        // Wait a bit to ensure proper cleanup
        await new Promise(resolve => setTimeout(resolve, 50))

        // Get the container dimensions
        const container = canvasRef.current.parentElement
        if (!container) {
          console.error("Container not found for canvas")
          return
        }

        const containerWidth = container.clientWidth
        const containerHeight = container.clientHeight

        console.log("Container dimensions:", {
          width: containerWidth,
          height: containerHeight,
        })

        // Ensure the canvas element is ready
        if (!canvasRef.current) {
          console.error("Canvas element not found");
          return;
        }

        // Ensure the canvas element has proper dimensions
        if (containerWidth <= 0 || containerHeight <= 0) {
          console.error("Container has invalid dimensions:", { containerWidth, containerHeight });
          return;
        }

        // Set canvas element dimensions
        canvasRef.current.width = containerWidth;
        canvasRef.current.height = containerHeight;

        // Test if we can get a context from the canvas element
        try {
          const testContext = canvasRef.current.getContext('2d');
          if (!testContext) {
            console.error("Cannot get 2D context from canvas element");
            return;
          }
        } catch (contextError) {
          console.error("Error getting canvas context:", contextError);
          return;
        }

        // Create new fabric canvas
        let fabricCanvas
        try {
          fabricCanvas = new window.fabric.Canvas(canvasRef.current, {
            width: containerWidth,
            height: containerHeight,
            backgroundColor: "#ffffff",
            selection: false,
            preserveObjectStacking: true,
            stopContextMenu: true,
          })
        } catch (canvasError) {
          console.error("Error creating fabric canvas:", canvasError)
          if (isComponentMounted) {
            toast.error("Failed to initialize canvas")
          }
          return
        }

        fabricCanvasRef.current = fabricCanvas

        // Wait for canvas to be fully initialized
        await new Promise(resolve => setTimeout(resolve, 100))

        // Add history tracking
        fabricCanvas.on("object:added", () => {
          if (isComponentMounted) {
            saveToHistory()
          }
        })

        fabricCanvas.on("object:modified", () => {
          if (isComponentMounted) {
            saveToHistory()
          }
        })

        fabricCanvas.on("object:removed", () => {
          if (isComponentMounted) {
            saveToHistory()
          }
        })

        // Add zoom and pan functionality
        fabricCanvas.on("mouse:wheel", (opt) => {
          if (!isComponentMounted) return
          const delta = opt.e.deltaY
          let zoom = fabricCanvas.getZoom()
          zoom *= 0.999 ** delta
          if (zoom > 20) zoom = 20
          if (zoom < 0.1) zoom = 0.1

          fabricCanvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom)
          setZoom(zoom)
          opt.e.preventDefault()
          opt.e.stopPropagation()
        })

        fabricCanvas.on("mouse:down", (opt) => {
          if (!isComponentMounted) return
          if (opt.e.button === 1 || (opt.e.button === 0 && opt.e.altKey)) {
            setIsDragging(true)
            setLastPos({ x: opt.e.clientX, y: opt.e.clientY })
            fabricCanvas.selection = false
            fabricCanvas.discardActiveObject()
            fabricCanvas.requestRenderAll()
          }
        })

        fabricCanvas.on("mouse:move", (opt) => {
          if (!isComponentMounted) return
          if (isDragging) {
            const e = opt.e
            const vpt = fabricCanvas.viewportTransform
            vpt[4] += e.clientX - lastPos.x
            vpt[5] += e.clientY - lastPos.y
            fabricCanvas.requestRenderAll()
            setLastPos({ x: e.clientX, y: e.clientY })
          }
        })

        fabricCanvas.on("mouse:up", () => {
          if (isComponentMounted) {
            setIsDragging(false)
          }
        })

        // Load initial image if available
        if (submission.answerImages && submission.answerImages.length > 0) {
          await loadImage(submission.answerImages[currentImageIndex].imageUrl)
        }
      } catch (error) {
        console.error("Error initializing canvas:", error)
        if (isComponentMounted) {
          toast.error("Failed to initialize drawing tools")
        }
      }
    }

    // Initialize with a small delay to ensure DOM is ready
    const timeoutId = setTimeout(initializeCanvas, 100)

    return () => {
      clearTimeout(timeoutId)
      if (fabricCanvasRef.current) {
        try {
          fabricCanvasRef.current.dispose()
        } catch (disposeError) {
          console.warn("Error disposing canvas in cleanup:", disposeError)
        }
        fabricCanvasRef.current = null
      }
    }
  }, [isFabricLoaded, submission.answerImages, currentImageIndex, isComponentMounted])

  // Load image into canvas
  const loadImage = (imageUrl) => {
    let isMounted = true;
    setIsImageLoading(true);
    const canvas = fabricCanvasRef.current;
    try {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        if (!isMounted) return;
        if (!canvasRef.current || !fabricCanvasRef.current) {
          console.log("Canvas refs not available after image load");
          setIsImageLoading(false);
          return;
        }

        try {
          console.log("Image loaded successfully:", {
            url: imageUrl,
            width: img.width,
            height: img.height
          })

          // Calculate scaling to fill the container while maintaining aspect ratio
          const containerWidth = canvas.width
          const containerHeight = canvas.height
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

          // Add image to canvas safely
          safeCanvasOperation(() => {
            canvas.add(fabricImage)
            canvas.sendToBack(fabricImage)
            canvas.renderAll()
            console.log("Canvas rendered with image")
          }, 'add image to canvas')

          // Restore annotations for this image if they exist
          if (annotations[currentImageIndex]) {
            setTimeout(() => {
              if (isCanvasReady() && isComponentMounted) {
                safeCanvasOperation(() => {
                  canvas.loadFromJSON(annotations[currentImageIndex], () => {
                    // Make sure background image is not selectable
                    const bgImage = canvas.getObjects().find((obj) => obj.type === "image")
                    if (bgImage) {
                      bgImage.selectable = false
                      bgImage.evented = false
                    }
                    canvas.renderAll()
                  })
                }, 'load annotations')
              }
            }, 100)
          }

          if (isComponentMounted) {
            setIsImageLoading(false)
          }
        } catch (error) {
          console.error("Error creating fabric image:", error)
          if (isComponentMounted) {
            toast.error("Failed to create image")
            setIsImageLoading(false)
          }
        }
      }

      img.onerror = () => {
        if (!isMounted) return;
        setIsImageLoading(false);
      };

      img.src = imageUrl
    } catch (error) {
      if (isMounted) setIsImageLoading(false);
    }
    return () => { isMounted = false; };
  };

  // Update canvas when image changes
  useEffect(() => {
    if (!isFabricLoaded || !submission.answerImages || !submission.answerImages[currentImageIndex] || !isComponentMounted) {
      return;
    }

    const loadNewImage = async () => {
      try {
        if (!isComponentMounted) return
        setIsImageLoading(true)

        // Clean up existing canvas properly
        if (fabricCanvasRef.current) {
          try {
            // Remove all event listeners first
            fabricCanvasRef.current.off("object:added")
            fabricCanvasRef.current.off("object:modified")
            fabricCanvasRef.current.off("object:removed")
            fabricCanvasRef.current.off("mouse:wheel")
            fabricCanvasRef.current.off("mouse:down")
            fabricCanvasRef.current.off("mouse:move")
            fabricCanvasRef.current.off("mouse:up")
            
            // Dispose the canvas
            fabricCanvasRef.current.dispose()
          } catch (disposeError) {
            console.warn("Error disposing canvas:", disposeError)
          }
          fabricCanvasRef.current = null
        }

        // Wait a bit to ensure proper cleanup
        await new Promise(resolve => setTimeout(resolve, 50))

        // Check if component is still mounted
        if (!isComponentMounted) return

        // Reinitialize canvas
        const container = canvasRef.current?.parentElement
        if (!container || !window.fabric || !window.fabric.Canvas) {
          console.log("Cannot reinitialize canvas - missing dependencies");
          return;
        }

        const containerWidth = container.clientWidth
        const containerHeight = container.clientHeight

        // Ensure the canvas element is ready
        if (!canvasRef.current) {
          console.error("Canvas element not found");
          return;
        }

        // Ensure the canvas element has proper dimensions
        if (containerWidth <= 0 || containerHeight <= 0) {
          console.error("Container has invalid dimensions:", { containerWidth, containerHeight });
          return;
        }

        // Set canvas element dimensions
        canvasRef.current.width = containerWidth;
        canvasRef.current.height = containerHeight;

        // Test if we can get a context from the canvas element
        try {
          const testContext = canvasRef.current.getContext('2d');
          if (!testContext) {
            console.error("Cannot get 2D context from canvas element");
            return;
          }
        } catch (contextError) {
          console.error("Error getting canvas context:", contextError);
          return;
        }

        // Create new fabric canvas
        let fabricCanvas
        try {
          fabricCanvas = new window.fabric.Canvas(canvasRef.current, {
            width: containerWidth,
            height: containerHeight,
            backgroundColor: "#ffffff",
            selection: false,
            preserveObjectStacking: true,
            stopContextMenu: true,
          })
        } catch (canvasError) {
          console.error("Error creating fabric canvas:", canvasError)
          if (isComponentMounted) {
            toast.error("Failed to initialize canvas")
          }
          return
        }

        fabricCanvasRef.current = fabricCanvas

        // Wait for canvas to be fully initialized
        await new Promise(resolve => setTimeout(resolve, 100))

        // Check if component is still mounted
        if (!isComponentMounted) return

        // Add history tracking
        fabricCanvas.on("object:added", () => {
          if (isComponentMounted) {
            saveToHistory()
          }
        })

        fabricCanvas.on("object:modified", () => {
          if (isComponentMounted) {
            saveToHistory()
          }
        })

        fabricCanvas.on("object:removed", () => {
          if (isComponentMounted) {
            saveToHistory()
          }
        })

        // Add zoom and pan functionality
        fabricCanvas.on("mouse:wheel", (opt) => {
          if (!isComponentMounted) return
          const delta = opt.e.deltaY
          let zoom = fabricCanvas.getZoom()
          zoom *= 0.999 ** delta
          if (zoom > 20) zoom = 20
          if (zoom < 0.1) zoom = 0.1

          fabricCanvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom)
          setZoom(zoom)
          opt.e.preventDefault()
          opt.e.stopPropagation()
        })

        fabricCanvas.on("mouse:down", (opt) => {
          if (!isComponentMounted) return
          if (opt.e.button === 1 || (opt.e.button === 0 && opt.e.altKey)) {
            setIsDragging(true)
            setLastPos({ x: opt.e.clientX, y: opt.e.clientY })
            fabricCanvas.selection = false
            fabricCanvas.discardActiveObject()
            fabricCanvas.requestRenderAll()
          }
        })

        fabricCanvas.on("mouse:move", (opt) => {
          if (!isComponentMounted) return
          if (isDragging) {
            const e = opt.e
            const vpt = fabricCanvas.viewportTransform
            vpt[4] += e.clientX - lastPos.x
            vpt[5] += e.clientY - lastPos.y
            fabricCanvas.requestRenderAll()
            setLastPos({ x: e.clientX, y: e.clientY })
          }
        })

        fabricCanvas.on("mouse:up", () => {
          if (isComponentMounted) {
            setIsDragging(false)
          }
        })

        // Load the new image
        await loadImage(submission.answerImages[currentImageIndex].imageUrl)

        // Check if component is still mounted
        if (!isComponentMounted) return

        // Restore annotations if they exist
        if (annotations[currentImageIndex]) {
          try {
            fabricCanvas.loadFromJSON(annotations[currentImageIndex], () => {
              if (!isComponentMounted) return
              // Make sure background image is not selectable
              const bgImage = fabricCanvas.getObjects().find((obj) => obj.type === "image")
              if (bgImage) {
                bgImage.selectable = false
                bgImage.evented = false
              }
              fabricCanvas.renderAll()
            })
          } catch (jsonError) {
            console.error("Error restoring annotations:", jsonError)
          }
        }

        // Restore zoom level safely
        try {
          // Wait a bit to ensure canvas is fully ready
          setTimeout(() => {
            if (isCanvasReady() && fabricCanvas.getContext && fabricCanvas.getContext('2d') && isComponentMounted) {
              try {
                fabricCanvas.setZoom(zoom)
                fabricCanvas.requestRenderAll()
              } catch (setZoomError) {
                console.warn("Error setting zoom:", setZoomError)
              }
            } else {
              console.warn("Canvas not ready for zoom restoration, skipping")
            }
          }, 200)
        } catch (zoomError) {
          console.warn("Error in zoom restoration:", zoomError)
        }
      } catch (error) {
        console.error("Error loading new image:", error)
        if (isComponentMounted) {
          toast.error("Failed to load image")
        }
      } finally {
        if (isComponentMounted) {
          setIsImageLoading(false)
        }
      }
    }

    loadNewImage()
  }, [currentImageIndex, isFabricLoaded, isComponentMounted])

  // Update canvas when tool changes
  useEffect(() => {
    if (!fabricCanvasRef.current || !window.fabric || !canvasRef.current) {
      console.log("Canvas or Fabric.js not ready for tool changes");
      return;
    }

    const canvas = fabricCanvasRef.current

    // Remove all existing event listeners
    canvas.off("mouse:down")
    canvas.off("mouse:move")
    canvas.off("mouse:up")

    // Reset drawing mode and selection
    canvas.isDrawingMode = false
    canvas.freeDrawingBrush = null
    canvas.selection = false
    canvas.discardActiveObject()
    canvas.requestRenderAll()

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
            // Only handle left click
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
            // Only handle left click
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

    try {
      canvas.renderAll()
    } catch (error) {
      console.error("Error rendering canvas:", error)
    }
  }, [activeTool, penColor, penSize, isFabricLoaded])

  // History management functions
  const saveToHistory = () => {
    if (fabricCanvasRef.current) {
      const json = fabricCanvasRef.current.toJSON()
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1)
      historyRef.current.push(json)
      historyIndexRef.current = historyRef.current.length - 1
      updateUndoRedoState()

      // Save annotations for current image
      setAnnotations((prev) => ({
        ...prev,
        [currentImageIndex]: json,
      }))
    }
  }

  const updateUndoRedoState = () => {
    setCanUndo(historyIndexRef.current > 0)
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1)
  }

  const handleUndo = () => {
    if (canUndo && fabricCanvasRef.current) {
      historyIndexRef.current--
      fabricCanvasRef.current.loadFromJSON(historyRef.current[historyIndexRef.current], () => {
        fabricCanvasRef.current.renderAll()
        updateUndoRedoState()
      })
    }
  }

  const handleRedo = () => {
    if (canRedo && fabricCanvasRef.current) {
      historyIndexRef.current++
      fabricCanvasRef.current.loadFromJSON(historyRef.current[historyIndexRef.current], () => {
        fabricCanvasRef.current.renderAll()
        updateUndoRedoState()
      })
    }
  }

  const handleToolSelect = (tool) => {
    if (!fabricCanvasRef.current || !window.fabric || !canvasRef.current) {
      console.log("Canvas or Fabric.js not ready for tool changes");
      return;
    }
    setActiveTool(tool);

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
            fontFamily: "Arial",
            fill: penColor,
            fontSize: 20,
            fontWeight: "400",
            fontStyle: "normal",
            underline: false,
            linethrough: false,
            textAlign: "left",
            charSpacing: 0,
            lineHeight: 1,
          })
          fabricCanvasRef.current.add(text)
          fabricCanvasRef.current.setActiveObject(text)
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
  }

  const handleColorChange = (color) => {
    setPenColor(color)

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
  }

  const handleBrushSizeChange = (size) => {
    setPenSize(size)

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
  }

  const handleImageChange = (index) => {
    try {
      // Save current annotations before changing image
      if (fabricCanvasRef.current && fabricCanvasRef.current.getObjects) {
        try {
          const json = fabricCanvasRef.current.toJSON()
          setAnnotations((prev) => ({
            ...prev,
            [currentImageIndex]: json,
          }))
        } catch (jsonError) {
          console.warn("Error saving annotations for current image:", jsonError)
        }
      }

      // Reset history for new image
      historyRef.current = []
      historyIndexRef.current = -1
      setCanUndo(false)
      setCanRedo(false)

      // Change image
      setCurrentImageIndex(index)
    } catch (error) {
      console.error("Error changing image:", error)
      toast.error("Failed to change image")
    }
  }

  const getAnnotatedImages = async () => {
    if (!fabricCanvasRef.current || !window.fabric || !isComponentMounted) {
      toast.error("Canvas or Fabric.js not initialized")
      return
    }

    try {
      // Save current annotations
      const json = fabricCanvasRef.current.toJSON()
      const updatedAnnotations = {
        ...annotations,
        [currentImageIndex]: json,
      }

      // Process all annotated images
      const processPromises = Object.keys(updatedAnnotations).map(async (index) => {
        let tempCanvasElement = null
        let tempFabricCanvas = null
        let previewUrl = null
        let s3Key = null

        try {
          if (!submission.answerImages || !submission.answerImages[index]) {
            console.error(`Image not found for index ${index}`)
            return { s3Key: null, previewUrl: null }
          }

          // Create a temporary canvas with exact image dimensions
          const tempCanvas = document.createElement('canvas')
          const tempCtx = tempCanvas.getContext('2d')

          if (!tempCtx) {
            throw new Error("Failed to get canvas context")
          }

          // Load the original image
          const img = new Image()
          img.crossOrigin = "anonymous"

          await new Promise((resolve, reject) => {
            if (!isComponentMounted) {
              reject(new Error("Component unmounted during image loading"))
              return
            }

            img.onload = () => {
              if (!isComponentMounted) {
                reject(new Error("Component unmounted after image load"))
                return
              }
              resolve()
            }
            img.onerror = (error) => {
              console.error("Error loading image:", error)
              reject(new Error(`Failed to load image for index ${index}`))
            }
            img.src = submission.answerImages[index].imageUrl
          })

          // Set canvas size to match original image dimensions
          tempCanvas.width = img.width
          tempCanvas.height = img.height

          // Draw the original image at full size
          tempCtx.drawImage(img, 0, 0, img.width, img.height)

          // Create a temporary fabric canvas for annotations
          tempCanvasElement = document.createElement('canvas')
          tempCanvasElement.width = img.width
          tempCanvasElement.height = img.height
          tempCanvasElement.style.position = 'absolute'
          tempCanvasElement.style.left = '-9999px'
          tempCanvasElement.style.top = '-9999px'
          tempCanvasElement.style.visibility = 'hidden'

          // Add to document and track for cleanup
          if (document.body && isComponentMounted) {
            document.body.appendChild(tempCanvasElement)
            tempElementsRef.current.push(tempCanvasElement)
          } else {
            throw new Error("Document body not available or component unmounted")
          }

          // Initialize Fabric.js canvas with proper configuration
          if (!window.fabric || !window.fabric.Canvas) {
            throw new Error("Fabric.js not available for temporary canvas creation")
          }

          tempFabricCanvas = new window.fabric.Canvas(tempCanvasElement, {
            width: img.width,
            height: img.height,
            renderOnAddRemove: false,
            selection: false,
            preserveObjectStacking: true
          })

          // Ensure canvas is initialized before loading JSON
          await new Promise(resolve => setTimeout(resolve, 0))

          // Load annotations
          await new Promise((resolve, reject) => {
            try {
              if (!updatedAnnotations[index]) {
                console.warn(`No annotations found for index ${index}`)
                resolve()
                return
              }

              // Create a new fabric image for the background
              const fabricImage = new window.fabric.Image(img, {
                left: 0,
                top: 0,
                width: img.width,
                height: img.height,
                selectable: false,
                evented: false
              })

              // Add the background image first
              tempFabricCanvas.add(fabricImage)
              tempFabricCanvas.renderAll()

              // Now load the annotations
              tempFabricCanvas.loadFromJSON(updatedAnnotations[index], async () => {
                try {
                  if (!isComponentMounted) {
                    resolve()
                    return
                  }

                  const bgImage = tempFabricCanvas.getObjects().find(obj => obj.type === 'image')
                  if (!bgImage) {
                    console.warn("No background image found in annotations")
                    resolve()
                    return
                  }

                  // Calculate scaling factors
                  const originalWidth = img.width
                  const originalHeight = img.height
                  const displayWidth = bgImage.width * bgImage.scaleX
                  const displayHeight = bgImage.height * bgImage.scaleY

                  const scaleX = originalWidth / displayWidth
                  const scaleY = originalHeight / displayHeight

                  // Draw annotations with exact positioning
                  const annotationObjects = tempFabricCanvas.getObjects().filter(obj => obj !== bgImage)
                  for (const obj of annotationObjects) {
                    try {
                      if (!isComponentMounted) break

                      // Convert object to data URL with high quality
                      const objDataUrl = obj.toDataURL({
                        format: 'png',
                        quality: 1,
                        multiplier: 1,
                        enableRetinaScaling: true
                      })

                      const objImg = new Image()
                      await new Promise((resolve, reject) => {
                        if (!isComponentMounted) {
                          reject(new Error("Component unmounted"))
                          return
                        }
                        objImg.onload = resolve
                        objImg.onerror = reject
                        objImg.src = objDataUrl
                      })

                      // Calculate exact position relative to background image
                      const objLeft = (obj.left - bgImage.left) * scaleX
                      const objTop = (obj.top - bgImage.top) * scaleY

                      // Calculate scaled dimensions
                      const scaledWidth = obj.width * obj.scaleX * scaleX
                      const scaledHeight = obj.height * obj.scaleY * scaleY

                      // Draw annotation at exact position with proper scaling
                      tempCtx.drawImage(
                        objImg,
                        objLeft,
                        objTop,
                        scaledWidth,
                        scaledHeight
                      )
                    } catch (objError) {
                      console.error("Error processing annotation object:", objError)
                    }
                  }

                  // Store the annotated image data URL
                  const annotatedImageUrl = tempCanvas.toDataURL('image/png', 1.0);
                  previewUrl = annotatedImageUrl;

                  // Convert data URL to Blob
                  const response = await fetch(annotatedImageUrl);
                  const blob = await response.blob();

                  // Upload to S3
                  const uploadUrlResponse = await api.post(
                    '/evaluator-reviews/annotated-image-upload-url',
                    {
                      fileName: `annotated_${index}.png`,
                      contentType: 'image/png',
                      clientId: submission.clientId || 'CLI677117YN7N',
                      answerId: submission._id
                    }
                  );

                  if (!uploadUrlResponse.data.success) {
                    throw new Error(uploadUrlResponse.data.message || 'Failed to get upload URL');
                  }

                  const uploadUrl = uploadUrlResponse.data.data.uploadUrl;
                  const key = uploadUrlResponse.data.data.key;

                  // Upload to S3
                  const uploadResponse = await fetch(uploadUrl, {
                    method: 'PUT',
                    body: blob,
                    headers: {
                      'Content-Type': 'image/png'
                    }
                  });

                  if (!uploadResponse.ok) {
                    throw new Error('Failed to upload annotated image to S3');
                  }

                  s3Key = key;

                  resolve()
                } catch (error) {
                  console.error("Error processing annotations:", error)
                  reject(error)
                }
              })
            } catch (error) {
              console.error("Error loading JSON:", error)
              reject(error)
            }
          })

        } catch (error) {
          console.error(`Error processing image ${index}:`, error)
          if (isComponentMounted) {
            toast.error(`Failed to process image ${parseInt(index) + 1}`)
          }
        } finally {
          // Cleanup
          if (tempFabricCanvas) {
            try {
              tempFabricCanvas.dispose()
            } catch (error) {
              console.error("Error disposing fabric canvas:", error)
            }
          }
          if (tempCanvasElement && tempCanvasElement.parentNode) {
            try {
              tempCanvasElement.parentNode.removeChild(tempCanvasElement)
              // Remove from tracking array
              tempElementsRef.current = tempElementsRef.current.filter(el => el !== tempCanvasElement)
            } catch (error) {
              console.error("Error removing canvas element:", error)
            }
          }
        }
        return { s3Key, previewUrl };
      })

      // Wait for all processing to complete
      const results = await Promise.all(processPromises)

      // Return an array of { s3Key, previewUrl }
      return results
    } catch (error) {
      console.error("Error getting annotated images:", error)
      if (isComponentMounted) {
        toast.error(error.message || "Failed to get annotated images")
      }
      return null
    }
  }

  const handleOpenPublishModal = async () => {
    try {
      // Process and upload all annotated images (not just the current one)
      setLoading(true);
      const annotatedResults = await getAnnotatedImages();
      if (!annotatedResults) {
        setLoading(false);
        return;
      }

      // Collect all S3 keys and previews from annotatedResults
      const s3Keys = [];
      const previews = [];
      for (let i = 0; i < annotatedResults.length; i++) {
        const result = annotatedResults[i];
        if (result && result.s3Key) {
          s3Keys.push({ s3Key: result.s3Key });
          previews.push(result.previewUrl);
        }
      }
      setAnnotatedImages(s3Keys);
      setImagePreviews(previews);
      setIsReviewModalOpen(true);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error('Error in handleOpenPublishModal:', error);
      let errorMessage = 'Failed to process review';
      if (error.response) {
        errorMessage = error.response.data.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'No response from server. Please check if the server is running.';
      } else {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    }
  };

  const handlePublish = async () => {
    if (annotatedImages.length === 0) {
        toast.error('No annotated images to publish.');
        return;
    }

    setLoading(true);
    try {
        const publishPromises = annotatedImages.map(image => 
            api.post('/evaluator-reviews/publishwithannotation', {
                answerId: submission._id,
                annotatedImageKey: image.s3Key,
            })
        );
        
        await Promise.all(publishPromises);
        
        toast.success('Annotations published successfully!');
        handleCloseReviewModal();
        if (onSave) {
            onSave(); 
        }
        onClose();
    } catch (error) {
        console.error('Error publishing annotations:', error);
        let errorMessage = 'Failed to publish annotations.';
        if (error.response) {
            errorMessage = error.response.data.message || `Server error: ${error.response.status}`;
        } else if (error.request) {
            errorMessage = 'No response from server. Please check your connection.';
        } else {
            errorMessage = error.message;
        }
        toast.error(errorMessage);
    } finally {
        setLoading(false);
    }
};

  const handleSave = async () => {
    const updatedAnnotations = await getAnnotatedImages()
    if (!updatedAnnotations) return

    // Download all annotated images
    Object.keys(updatedAnnotations).forEach((index) => {
      const link = document.createElement('a')
      link.download = `annotated_image_${parseInt(index) + 1}.png`
      link.href = updatedAnnotations[index].imageUrl
      link.click()
    })

    // Call the original onSave callback
      onSave({
        annotations: updatedAnnotations,
      })

    toast.success("Annotations saved and images downloaded successfully!")
  }

  // Separate function for closing the modal
  const handleClose = () => {
    // Set component as unmounted first
    setIsComponentMounted(false)
    
    // Cleanup fabric canvas
    if (fabricCanvasRef.current) {
      try {
        fabricCanvasRef.current.dispose()
        console.log('[AnswerAnnotation] Fabric canvas disposed on close');
      } catch (error) {
        console.warn("Error disposing fabric canvas on close:", error)
      }
      fabricCanvasRef.current = null
    }
    
    // Cleanup temporary elements
    cleanupTempElements()
    
    // Reset everything (including refs, state, DOM)
    resetAllRefsAndState();
    
    // Call the original onClose callback
    onClose()
  }

  // Add zoom controls handler
  const handleZoom = (direction) => {
    if (!isCanvasReady()) {
      console.log("Canvas not ready for zoom");
      return;
    }

    const canvas = fabricCanvasRef.current
    
    // Additional safety check for canvas context
    if (!canvas.getContext || !canvas.getContext('2d')) {
      console.warn("Canvas context not available for zoom");
      return;
    }

    try {
      const currentZoom = canvas.getZoom()
      let newZoom

      if (direction === 'in') {
        newZoom = Math.min(currentZoom * 1.1, 20)
      } else if (direction === 'out') {
        newZoom = Math.max(currentZoom / 1.1, 0.1)
      } else {
        newZoom = 1
      }

      canvas.zoomToPoint(
        { x: canvas.width / 2, y: canvas.height / 2 },
        newZoom
      )
      setZoom(newZoom)
    } catch (zoomError) {
      console.error("Error during zoom operation:", zoomError)
      toast.error("Failed to zoom")
    }
  }

  // Update zoom controls in the toolbar
  const renderZoomControls = () => (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => handleZoom('out')}
        disabled={isFabricLoading || !isFabricLoaded}
        className={`p-2 rounded ${
          isFabricLoading || !isFabricLoaded
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
        onClick={() => handleZoom('in')}
        disabled={isFabricLoading || !isFabricLoaded}
        className={`p-2 rounded ${
          isFabricLoading || !isFabricLoaded
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
        onClick={() => handleZoom('reset')}
        disabled={isFabricLoading || !isFabricLoaded}
        className={`p-2 rounded ${
          isFabricLoading || !isFabricLoaded
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
  )

  const handleCloseReviewModal = () => {
    setIsReviewModalOpen(false)
    setScore('')
    setExpertRemarks('')
  }

  // Create preview URL for image
  const createImagePreview = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result);
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle image upload
  const handleImageUpload = async (file) => {
    try {
      console.log('Starting image upload for file:', file.name);
      
      // Get presigned URL for upload
      const uploadUrlResponse = await api.post(
        '/review/annotated-image-upload-url',
        {
          fileName: file.name,
          contentType: file.type,
          clientId: submission.clientId || 'CLI677117YN7N',
          answerId: submission._id
        }
      );

      console.log('Upload URL Response:', uploadUrlResponse.data);

      if (!uploadUrlResponse.data.success) {
        throw new Error(uploadUrlResponse.data.message || 'Failed to get upload URL');
      }

      const uploadUrl = uploadUrlResponse.data.data.uploadUrl;
      const key = uploadUrlResponse.data.data.key;


      console.log('Extracted uploadUrl:', uploadUrl);
      console.log('Extracted key:', key);

      if (!uploadUrl || typeof uploadUrl !== 'string') {
        throw new Error('Invalid upload URL received from server');
      }

      // Upload to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('S3 Upload Error:', {
          status: uploadResponse.status,
          statusText: uploadResponse.statusText,
          errorText
        });
        throw new Error(`Failed to upload image to S3: ${errorText}`);
      }

      // Add to annotated images array
      setAnnotatedImages(prev => {
        const newImages = Array.isArray(prev) ? [...prev] : [];
        newImages.push({ s3Key: key });
        return newImages;
      });

      return key;
    } catch (error) {
      console.error('Error uploading image:', error);
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
      }
      throw error;
    }
  };

  // Handle file selection
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setUploadingImages(true);
      
      // Create preview immediately when file is selected
      const preview = await createImagePreview(file);
      setSelectedImage(preview);
      
      // Upload image and get S3 key
      const s3Key = await handleImageUpload(file);
      
      // After successful upload, add to previews array
      setImagePreviews(prev => {
        const newPreviews = Array.isArray(prev) ? [...prev] : [];
        newPreviews.push(preview);
        return newPreviews;
      });
      
      // Clear the selected image after successful upload
      setSelectedImage(null);
      
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error in handleFileSelect:', error);
      setSelectedImage(null);
      
      let errorMessage = 'Failed to upload image';
      
      if (error.response) {
        errorMessage = error.response.data.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'No response from server. Please check if the server is running.';
      } else {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setUploadingImages(false);
    }
  };

  // Remove image
  const handleRemoveImage = (index) => {
    setAnnotatedImages(prev => {
      const newImages = Array.isArray(prev) ? [...prev] : [];
      newImages.splice(index, 1);
      return newImages;
    });
    
    setImagePreviews(prev => {
      const newPreviews = Array.isArray(prev) ? [...prev] : [];
      newPreviews.splice(index, 1);
      return newPreviews;
    });
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setReviewData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // --- [A] Add a helper to reset all refs and state ---
  const resetAllRefsAndState = () => {
    // DO NOT remove canvas from DOM! Let React handle it.
    fabricCanvasRef.current = null;
    backgroundImageRef.current = null;
    historyRef.current = [];
    historyIndexRef.current = -1;
    tempElementsRef.current = [];
    setAnnotations({});
    setAnnotatedImages([]);
    setImagePreviews([]);
    setSelectedImage(null);
    setCurrentImageIndex(0);
    setZoom(1);
    setCanUndo(false);
    setCanRedo(false);
    setIsDragging(false);
    setLastPos({ x: 0, y: 0 });
    setIsReviewModalOpen(false);
    setScore('');
    setExpertRemarks('');
    setReviewData({
      review_result: '',
      expert_score: '',
      expert_remarks: '',
    });
    setIsComponentMounted(true);
    setIsFabricLoaded(!!window.fabric && !!window.fabric.Canvas);
    setIsFabricLoading(false);
    // [NEW] Increment canvasKey to force remount
    setCanvasKey(k => k + 1);
    console.log('[AnswerAnnotation] All refs and state reset, canvasKey incremented');
  };

  // --- [B] On modal open (when submission changes), reset everything ---
  useEffect(() => {
    resetAllRefsAndState();
    // If you want to force a new <canvas> element, you can do so here if needed
    // (React will re-render the canvas, so usually not needed)
    console.log('[AnswerAnnotation] Modal opened, state and refs reset');
  }, [submission]);

  // 1. Add state for edit loading
  const [editLoading, setEditLoading] = useState(false);

  // Add local state for editable evaluation fields in the review modal
  const [editEvaluation, setEditEvaluation] = useState({
    introduction: submission.evaluation.analysis?.introduction?.join('\n') || '',
    body: submission.evaluation.analysis?.body?.join('\n') || '',
    conclusion: submission.evaluation.analysis?.conclusion?.join('\n') || '',
    strengths: submission.evaluation.analysis?.strengths?.join('\n') || '',
    weaknesses: submission.evaluation.analysis?.weaknesses?.join('\n') || '',
    suggestions: submission.evaluation.analysis?.suggestions?.join('\n') || '',
    feedback: submission.evaluation.analysis?.feedback || '',
    remark: submission.evaluation.remark || '',
    score: submission.evaluation.score || '',
    relevancy: submission.evaluation.relevancy || ''
  });

  // Update local state on modal open (when submission changes)
  useEffect(() => {
    setEditEvaluation({
      introduction: submission.evaluation.analysis?.introduction?.join('\n') || '',
      body: submission.evaluation.analysis?.body?.join('\n') || '',
      conclusion: submission.evaluation.analysis?.conclusion?.join('\n') || '',
      strengths: submission.evaluation.analysis?.strengths?.join('\n') || '',
      weaknesses: submission.evaluation.analysis?.weaknesses?.join('\n') || '',
      suggestions: submission.evaluation.analysis?.suggestions?.join('\n') || '',
      feedback: submission.evaluation.analysis?.feedback || '',
      remark: submission.evaluation.remark || '',
      score: submission.evaluation.score || '',
      relevancy: submission.evaluation.relevancy || ''
    });
  }, [isReviewModalOpen, submission]);

  // Handler for input changes
  const handleEvalFieldChange = (field, value) => {
    setEditEvaluation(prev => ({ ...prev, [field]: value }));
  };

  // Update handleEditEvaluation to use local state
  const handleEditEvaluation = async () => {
    setEditLoading(true);
    try {
      console.log(submission)
      const url = `http://localhost:5000/api/clients/CLI677117YN7N/mobile/userAnswers/questions/${submission.question._id}/answers/${submission._id}/evaluation-update`;
      const payload = {
        analysis: {
          introduction: editEvaluation.introduction.split('\n').filter(Boolean),
          body: editEvaluation.body.split('\n').filter(Boolean),
          conclusion: editEvaluation.conclusion.split('\n').filter(Boolean),
          strengths: editEvaluation.strengths.split('\n').filter(Boolean),
          weaknesses: editEvaluation.weaknesses.split('\n').filter(Boolean),
          suggestions: editEvaluation.suggestions.split('\n').filter(Boolean),
          feedback: editEvaluation.feedback
        },
        marks: Number(editEvaluation.score),
        accuracy: Number(editEvaluation.relevancy),
        feedback: editEvaluation.remark
      };
      await axios.put(url, payload);
      toast.success('Evaluation updated successfully!');
    } catch (error) {
      console.error('Error updating evaluation:', error);
      toast.error('Failed to update evaluation.');
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
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
          <div className="space-y-6">
            {/* Question Section */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Question</h3>
              <p className="text-sm text-gray-800 mb-3">{submission.question?.question || 'N/A'}</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div>QID: {submission.question?._id}</div>
                <div>UID: {submission.userId}</div>
                <div>Difficulty: {submission.question.metadata?.difficultyLevel || 'N/A'}</div>
                <div>Max Marks: {submission.question.metadata?.maximumMarks || 'N/A'}</div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="space-y-4">
              <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-green-700">Score:</span>
                  <span className="text-lg font-bold text-green-900">
                    {typeof submission.evaluation.score === 'number' ? `${submission.evaluation.score}/${submission.question.metadata?.maximumMarks || 'N/A'}` : submission.evaluation.score || 'Not evaluated'}
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
                  disabled={isFabricLoading || !isFabricLoaded || !fabricCanvasRef.current || !canvasRef.current}
                  className={`p-2 rounded ${
                    isFabricLoading || !isFabricLoaded || !fabricCanvasRef.current || !canvasRef.current
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
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
                  disabled={isFabricLoading || !isFabricLoaded || !fabricCanvasRef.current || !canvasRef.current}
                  className={`p-2 rounded ${
                    isFabricLoading || !isFabricLoaded || !fabricCanvasRef.current || !canvasRef.current
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
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
                <button
                  onClick={() => handleToolSelect("circle")}
                  disabled={isFabricLoading || !isFabricLoaded || !fabricCanvasRef.current || !canvasRef.current}
                  className={`p-2 rounded ${
                    isFabricLoading || !isFabricLoaded || !fabricCanvasRef.current || !canvasRef.current
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
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
                  disabled={isFabricLoading || !isFabricLoaded || !fabricCanvasRef.current || !canvasRef.current}
                  className={`p-2 rounded ${
                    isFabricLoading || !isFabricLoaded || !fabricCanvasRef.current || !canvasRef.current
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
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
                  disabled={isFabricLoading || !isFabricLoaded || !fabricCanvasRef.current || !canvasRef.current}
                  className={`p-2 rounded ${
                    isFabricLoading || !isFabricLoaded || !fabricCanvasRef.current || !canvasRef.current
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
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
                  disabled={isFabricLoading || !isFabricLoaded || !fabricCanvasRef.current || !canvasRef.current}
                  className={`p-2 rounded ${
                    isFabricLoading || !isFabricLoaded || !fabricCanvasRef.current || !canvasRef.current
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
                  disabled={!canUndo || isFabricLoading || !isFabricLoaded || !isComponentMounted}
                  className={`p-2 rounded ${
                    !canUndo || isFabricLoading || !isFabricLoaded || !isComponentMounted
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
                  disabled={!canRedo || isFabricLoading || !isFabricLoaded || !isComponentMounted}
                  className={`p-2 rounded ${
                    !canRedo || isFabricLoading || !isFabricLoaded || !isComponentMounted
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

              {renderZoomControls()}

              {/* Color and Size Controls */}
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={penColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  disabled={isFabricLoading || !isFabricLoaded || !isComponentMounted}
                  className={`w-8 h-8 rounded ${
                    isFabricLoading || !isFabricLoaded || !isComponentMounted
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
                    disabled={isFabricLoading || !isFabricLoaded || !isComponentMounted}
                    className={`w-24 ${
                      isFabricLoading || !isFabricLoaded || !isComponentMounted
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
            
            <canvas
              key={canvasKey}
              ref={canvasRef}
              className="w-full h-full"
              style={{
                cursor:
                  activeTool === "pen"
                    ? "crosshair"
                    : activeTool === "text"
                      ? "text"
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
                    className={`flex-shrink-0 w-20 h-20 rounded border-2 ${
                      currentImageIndex === index ? "border-blue-500" : "border-gray-300"
                    }`}
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
              {/* AI Evaluation (Editable) */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-lg font-medium text-gray-800 mb-4">AI Evaluation (Editable)</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Accuracy (%)</label>
                      <input type="number" value={editEvaluation.relevancy} onChange={e => handleEvalFieldChange('relevancy', e.target.value)} className="w-full border rounded px-2 py-1 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Marks</label>
                      <input type="number" value={editEvaluation.score} onChange={e => handleEvalFieldChange('score', e.target.value)} className="w-full border rounded px-2 py-1 text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Remark</label>
                    <input type="text" value={editEvaluation.remark} onChange={e => handleEvalFieldChange('remark', e.target.value)} className="w-full border rounded px-2 py-1 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Introduction</label>
                    <textarea value={editEvaluation.introduction} onChange={e => handleEvalFieldChange('introduction', e.target.value)} className="w-full border rounded px-2 py-1 text-sm" rows={2} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Body</label>
                    <textarea value={editEvaluation.body} onChange={e => handleEvalFieldChange('body', e.target.value)} className="w-full border rounded px-2 py-1 text-sm" rows={2} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Conclusion</label>
                    <textarea value={editEvaluation.conclusion} onChange={e => handleEvalFieldChange('conclusion', e.target.value)} className="w-full border rounded px-2 py-1 text-sm" rows={2} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Strengths (one per line)</label>
                    <textarea value={editEvaluation.strengths} onChange={e => handleEvalFieldChange('strengths', e.target.value)} className="w-full border rounded px-2 py-1 text-sm" rows={2} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Weaknesses (one per line)</label>
                    <textarea value={editEvaluation.weaknesses} onChange={e => handleEvalFieldChange('weaknesses', e.target.value)} className="w-full border rounded px-2 py-1 text-sm" rows={2} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Suggestions (one per line)</label>
                    <textarea value={editEvaluation.suggestions} onChange={e => handleEvalFieldChange('suggestions', e.target.value)} className="w-full border rounded px-2 py-1 text-sm" rows={2} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Feedback</label>
                    <textarea value={editEvaluation.feedback} onChange={e => handleEvalFieldChange('feedback', e.target.value)} className="w-full border rounded px-2 py-1 text-sm" rows={2} />
                  </div>
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
                          src={preview}
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
                    (loading || uploadingImages) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? 'Publishing...' : 'Publish'}
                </button>
                <button
                  onClick={handleEditEvaluation}
                  disabled={editLoading}
                  className={`px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 mr-2 ${editLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {editLoading ? 'Updating...' : 'Edit Evaluation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AnnotateAnswer