"use client"

import { useState, useRef, useEffect } from "react"
import { toast } from "react-toastify"
import axios from 'axios'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'https://aipbbackend.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

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

  const canvasRef = useRef(null)
  const fabricCanvasRef = useRef(null)
  const backgroundImageRef = useRef(null)
  const historyRef = useRef([])
  const historyIndexRef = useRef(-1)
  const containerRef = useRef(null)

  // Load Fabric.js
  useEffect(() => {
    const loadFabric = async () => {
      try {
        // Try loading from CDN first
        const script = document.createElement("script")
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js"
        script.async = true

        await new Promise((resolve, reject) => {
          script.onload = () => {
            console.log("Fabric.js loaded from CDN:", {
              hasFabric: !!window.fabric,
              fabricVersion: window.fabric?.version,
            })
            resolve()
          }

          script.onerror = (error) => {
            console.error("Error loading Fabric.js from CDN:", error)
            reject(new Error("Failed to load Fabric.js from CDN"))
          }

          document.head.appendChild(script)
        })
      } catch (error) {
        console.error("Error loading Fabric.js:", error)
        toast.error("Failed to load drawing tools")
      }
    }

    // Only load if not already loaded
    if (!window.fabric) {
      console.log("Loading Fabric.js...")
      loadFabric()
    } else {
      console.log("Fabric.js already loaded:", {
        hasFabric: !!window.fabric,
        fabricVersion: window.fabric.version,
      })
    }

    // Cleanup function
    return () => {
      if (window.fabric) {
        console.log("Cleaning up Fabric.js...")
        // Don't delete window.fabric as it might be needed by other components
      }
    }
  }, [])

  // Initialize canvas when component mounts
  useEffect(() => {
    const initializeCanvas = () => {
      if (!canvasRef.current || !window.fabric) return

      try {
        // Clean up existing canvas if it exists
        if (fabricCanvasRef.current) {
          fabricCanvasRef.current.dispose()
        }

        // Get the container dimensions
        const container = canvasRef.current.parentElement
        const containerWidth = container.clientWidth
        const containerHeight = container.clientHeight

        console.log("Container dimensions:", {
          width: containerWidth,
          height: containerHeight,
        })

        // Create canvas with container dimensions
        const fabricCanvas = new window.fabric.Canvas(canvasRef.current, {
          width: containerWidth,
          height: containerHeight,
          backgroundColor: "#ffffff",
          selection: false, // Disable selection by default
          preserveObjectStacking: true,
          stopContextMenu: true, // Prevent context menu
        })

        fabricCanvasRef.current = fabricCanvas

        // Add history tracking
        fabricCanvas.on("object:added", () => {
          saveToHistory()
        })

        fabricCanvas.on("object:modified", () => {
          saveToHistory()
        })

        fabricCanvas.on("object:removed", () => {
          saveToHistory()
        })

        // Add zoom and pan functionality
        fabricCanvas.on("mouse:wheel", (opt) => {
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
          if (opt.e.button === 1 || (opt.e.button === 0 && opt.e.altKey)) {
            setIsDragging(true)
            setLastPos({ x: opt.e.clientX, y: opt.e.clientY })
            fabricCanvas.selection = false
            fabricCanvas.discardActiveObject()
            fabricCanvas.requestRenderAll()
          }
        })

        fabricCanvas.on("mouse:move", (opt) => {
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
          setIsDragging(false)
        })

        // Load initial image if available
        if (submission.answerImages && submission.answerImages.length > 0) {
          loadImage(submission.answerImages[currentImageIndex].imageUrl)
        }
      } catch (error) {
        console.error("Error initializing canvas:", error)
        toast.error("Failed to initialize drawing tools")
      }
    }

    // Initialize with a small delay to ensure DOM is ready
    const timeoutId = setTimeout(initializeCanvas, 100)

    return () => {
      clearTimeout(timeoutId)
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose()
        fabricCanvasRef.current = null
      }
    }
  }, [])

  // Load image into canvas
  const loadImage = (imageUrl) => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    setIsImageLoading(true)
    console.log("Loading image with URL:", imageUrl)

    try {
      // Clear existing content
      canvas.clear()

      // Create a new image element
      const img = new Image()
      img.crossOrigin = "anonymous"

      img.onload = () => {
        if (!canvas) return

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

          canvas.add(fabricImage)
          canvas.sendToBack(fabricImage)
          canvas.renderAll()
          console.log("Canvas rendered with image")

          // Restore annotations for this image if they exist
          if (annotations[currentImageIndex]) {
            setTimeout(() => {
              if (canvas) {
                canvas.loadFromJSON(annotations[currentImageIndex], () => {
                  // Make sure background image is not selectable
                  const bgImage = canvas.getObjects().find((obj) => obj.type === "image")
                  if (bgImage) {
                    bgImage.selectable = false
                    bgImage.evented = false
                  }
                  canvas.renderAll()
                })
              }
            }, 100)
          }

          setIsImageLoading(false)
        } catch (error) {
          console.error("Error creating fabric image:", error)
          toast.error("Failed to create image")
          setIsImageLoading(false)
        }
      }

      img.onerror = (error) => {
        console.error("Error loading image:", error)
        toast.error("Failed to load image")
        setIsImageLoading(false)
      }

      img.src = imageUrl
    } catch (error) {
      console.error("Error in loadImage:", error)
      toast.error("Failed to load image")
      setIsImageLoading(false)
    }
  }

  // Update canvas when image changes
  useEffect(() => {
    const loadNewImage = async () => {
      if (!submission.answerImages || !submission.answerImages[currentImageIndex]) return

      try {
        setIsImageLoading(true)

        // Clean up existing canvas
        if (fabricCanvasRef.current) {
          fabricCanvasRef.current.dispose()
          fabricCanvasRef.current = null
        }

        // Reinitialize canvas
        const container = canvasRef.current?.parentElement
        if (!container) return

        const containerWidth = container.clientWidth
        const containerHeight = container.clientHeight

        const fabricCanvas = new window.fabric.Canvas(canvasRef.current, {
          width: containerWidth,
          height: containerHeight,
          backgroundColor: "#ffffff",
          selection: false,
          preserveObjectStacking: true,
          stopContextMenu: true,
        })

        fabricCanvasRef.current = fabricCanvas

        // Add history tracking
        fabricCanvas.on("object:added", () => {
          saveToHistory()
        })

        fabricCanvas.on("object:modified", () => {
          saveToHistory()
        })

        fabricCanvas.on("object:removed", () => {
          saveToHistory()
        })

        // Add zoom and pan functionality
        fabricCanvas.on("mouse:wheel", (opt) => {
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
          if (opt.e.button === 1 || (opt.e.button === 0 && opt.e.altKey)) {
            setIsDragging(true)
            setLastPos({ x: opt.e.clientX, y: opt.e.clientY })
            fabricCanvas.selection = false
            fabricCanvas.discardActiveObject()
            fabricCanvas.requestRenderAll()
          }
        })

        fabricCanvas.on("mouse:move", (opt) => {
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
          setIsDragging(false)
        })

        // Load the new image
        await loadImage(submission.answerImages[currentImageIndex].imageUrl)

        // Restore annotations if they exist
        if (annotations[currentImageIndex]) {
          fabricCanvas.loadFromJSON(annotations[currentImageIndex], () => {
            // Make sure background image is not selectable
            const bgImage = fabricCanvas.getObjects().find((obj) => obj.type === "image")
            if (bgImage) {
              bgImage.selectable = false
              bgImage.evented = false
            }
            fabricCanvas.renderAll()
          })
        }

        // Restore zoom level
        fabricCanvas.setZoom(zoom)
        fabricCanvas.requestRenderAll()
      } catch (error) {
        console.error("Error loading new image:", error)
        toast.error("Failed to load image")
      } finally {
        setIsImageLoading(false)
      }
    }

    loadNewImage()
  }, [currentImageIndex])

  // Update canvas when tool changes
  useEffect(() => {
    if (fabricCanvasRef.current) {
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
    }
  }, [activeTool, penColor, penSize])

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
    setActiveTool(tool)

    if (fabricCanvasRef.current) {
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
    if (fabricCanvasRef.current) {
      const json = fabricCanvasRef.current.toJSON()
      setAnnotations((prev) => ({
        ...prev,
        [currentImageIndex]: json,
      }))
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
    if (!fabricCanvasRef.current) {
      toast.error("Canvas not initialized")
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

        try {
          if (!submission.answerImages || !submission.answerImages[index]) {
            console.error(`Image not found for index ${index}`)
            return
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
            img.onload = () => {
              console.log("Image loaded successfully:", {
                width: img.width,
                height: img.height,
                index
              })
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
          document.body.appendChild(tempCanvasElement)
          
          // Initialize Fabric.js canvas with proper configuration
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
                      // Convert object to data URL with high quality
                      const objDataUrl = obj.toDataURL({
                        format: 'png',
                        quality: 1,
                        multiplier: 1,
                        enableRetinaScaling: true
                      })

                      const objImg = new Image()
                      await new Promise((resolve, reject) => {
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
                  
                  // Convert data URL to Blob
                  const response = await fetch(annotatedImageUrl);
                  const blob = await response.blob();
                  
                  // Upload to S3
                  const uploadUrlResponse = await api.post(
                    '/review/annotated-image-upload-url',
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

                  // Add to annotated images array with s3Key
                  setAnnotatedImages(prev => {
                    const newImages = Array.isArray(prev) ? [...prev] : [];
                    newImages.push({ s3Key: key });
                    return newImages;
                  });

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
          toast.error(`Failed to process image ${parseInt(index) + 1}`)
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
            } catch (error) {
              console.error("Error removing canvas element:", error)
            }
          }
        }
      })

      // Wait for all processing to complete
      await Promise.all(processPromises)

      return updatedAnnotations
    } catch (error) {
      console.error("Error getting annotated images:", error)
      toast.error(error.message || "Failed to get annotated images")
      return null
    }
  }

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

  const handleCompleteReview = async () => {
    try {
      if (!fabricCanvasRef.current) {
        toast.error("Canvas not initialized");
        return;
      }

      // Get the canvas data URL
      const dataUrl = fabricCanvasRef.current.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 1,
        enableRetinaScaling: true
      });

      // Convert data URL to Blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      // Get presigned URL for upload
      const uploadUrlResponse = await api.post(
        '/review/annotated-image-upload-url',
        {
          fileName: `annotated_${currentImageIndex}.png`,
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

      // Add to annotated images array
      setAnnotatedImages(prev => {
        const newImages = Array.isArray(prev) ? [...prev] : [];
        newImages.push({ s3Key: key });
        return newImages;
      });

      // Create preview for the uploaded image
      setImagePreviews(prev => {
        const newPreviews = Array.isArray(prev) ? [...prev] : [];
        newPreviews.push(dataUrl);
        return newPreviews;
      });

      // Open review modal
      setIsReviewModalOpen(true);
    } catch (error) {
      console.error('Error in handleCompleteReview:', error);
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

  // Separate function for closing the modal
  const handleClose = () => {
    onClose()
  }

  // Add zoom controls handler
  const handleZoom = (direction) => {
    if (!fabricCanvasRef.current) return

    const canvas = fabricCanvasRef.current
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
  }

  // Update zoom controls in the toolbar
  const renderZoomControls = () => (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => handleZoom('out')}
        className="p-2 rounded bg-white text-gray-700 hover:bg-gray-100"
        title="Zoom Out"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      </button>
      <span className="text-sm text-gray-700">{Math.round(zoom * 100)}%</span>
      <button
        onClick={() => handleZoom('in')}
        className="p-2 rounded bg-white text-gray-700 hover:bg-gray-100"
        title="Zoom In"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
      <button
        onClick={() => handleZoom('reset')}
        className="p-2 rounded bg-white text-gray-700 hover:bg-gray-100"
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

  // Handle review submission
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    
    if (!reviewData.review_result || !reviewData.expert_score || !reviewData.expert_remarks) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (annotatedImages.length === 0) {
      toast.error('Please upload at least one annotated image');
      return;
    }

    try {
      setLoading(true);
      console.log("submission by sapna", submission)

      // First, fetch the review request ID using the submission ID
      const reviewRequestResponse = await api.get(`/review/by-submission/${submission._id}`);
      console.log("Review request response:", reviewRequestResponse.data);
      
      if (!reviewRequestResponse.data.success) {
        throw new Error(reviewRequestResponse.data.message || 'Failed to fetch review request');
      }

      const requestId = reviewRequestResponse.data.data.requestId;
      console.log("Request ID:", requestId);
      console.log("Review data:", reviewData);
      console.log("Annotated images:", annotatedImages);

      // Check if answer is in correct status
      if (submission.reviewStatus !== 'review_accepted') {
        throw new Error('Answer is not in the correct status for review submission. Current status: ' + submission.reviewStatus);
      }

      // Now submit the review with the fetched request ID
      const response = await api.post(
        `/review/${requestId}/submit`,
        {
          ...reviewData,
          annotated_images: annotatedImages
        }
      );
      console.log("Submit response:", response.data);

      if (response.data.success) {
        toast.success('Review submitted successfully');
        if (onSave) {
          onSave(response.data.data);
        }
        handleCloseReviewModal();
      } else {
        throw new Error(response.data.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      let errorMessage = 'Failed to submit review';
      
      if (error.response) {
        errorMessage = error.response.data.message || `Server error: ${error.response.status}`;
        
        if (error.response.data.message?.includes('not in correct status')) {
          errorMessage = 'This review has already been submitted or is not in the correct state. Please refresh the page.';
        }
      } else if (error.request) {
        errorMessage = 'No response from server. Please check if the server is running.';
      } else {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
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
          <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
            Save Annotations
          </button>
          <button 
            onClick={handleCompleteReview} 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Complete Review
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
                  style={{ width: `${submission.evaluation.accuracy}%` }}
                ></div>
              </div>
              <p className="text-lg font-semibold text-gray-800 mt-1">{submission.evaluation.accuracy}%</p>
            </div>

            {/* Strengths */}
            {submission.evaluation.strengths?.length > 0 && (
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
            {submission.evaluation.weaknesses?.length > 0 && (
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
            {submission.evaluation.suggestions?.length > 0 && (
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
                {submission.evaluation.marks} / {submission.evaluation.totalMarks || 10}
              </p>
            </div>

            {/* Feedback */}
            {submission.evaluation.feedback && (
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
                  className={`p-2 rounded ${
                    activeTool === "pen" ? "bg-blue-500 text-white" : "bg-white text-gray-700"
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
                  className={`p-2 rounded ${
                    activeTool === "text" ? "bg-blue-500 text-white" : "bg-white text-gray-700"
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
                  className={`p-2 rounded ${
                    activeTool === "circle" ? "bg-blue-500 text-white" : "bg-white text-gray-700"
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
                  className={`p-2 rounded ${
                    activeTool === "rectangle" ? "bg-blue-500 text-white" : "bg-white text-gray-700"
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
                  className={`p-2 rounded ${
                    activeTool === "select" ? "bg-blue-500 text-white" : "bg-white text-gray-700"
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
                  className="p-2 rounded bg-white text-red-600 hover:bg-red-50"
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
                  disabled={!canUndo}
                  className={`p-2 rounded ${
                    canUndo
                      ? "bg-white text-gray-700 hover:bg-gray-100"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
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
                  disabled={!canRedo}
                  className={`p-2 rounded ${
                    canRedo
                      ? "bg-white text-gray-700 hover:bg-gray-100"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
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
                  className="w-8 h-8 rounded cursor-pointer"
                  title="Color"
                />
                <div className="flex items-center space-x-1">
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={penSize}
                    onChange={(e) => handleBrushSizeChange(Number.parseInt(e.target.value))}
                    className="w-24"
                    title="Brush Size"
                  />
                  <span className="text-xs text-gray-500 w-6 text-right">{penSize}px</span>
                </div>
              </div>
            </div>
          </div>

          {/* Canvas Container */}
          <div className="flex-1 relative bg-gray-100 overflow-hidden" ref={containerRef}>
            {isImageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 z-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
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
              <h3 className="text-xl font-semibold">Complete Review</h3>
              <button 
                onClick={handleCloseReviewModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-6">
              {/* Review Result */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review Result
                </label>
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
                  Score (0-100)
                </label>
                <input
                  type="number"
                  name="expert_score"
                  value={reviewData.expert_score}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Expert Remarks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Remarks
                </label>
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
                  <label className="block text-sm font-medium text-gray-700">
                    Annotated Images
                  </label>
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
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                      }`}
                    >
                      {uploadingImages ? 'Uploading...' : 'Upload Image'}
                    </label>
                  </div>
                </div>

                {/* Selected Image Preview */}
                {selectedImage && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-2">Selected Image Preview:</p>
                    <div className="relative w-full max-w-md">
                      <img
                        src={selectedImage}
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
                            src={preview}
                            alt={`Uploaded ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg shadow-md"
                          />
                          <button
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
                    (loading || uploadingImages) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? 'Submitting...' : 'Submit Review'}
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
