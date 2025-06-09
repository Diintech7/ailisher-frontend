import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  Canvas,
  FabricImage,
  IText,
  PencilBrush,
  Circle,
  Rect
} from 'fabric';

const AnswerAnnotation = ({ submission, onClose }) => {
  const [activeTool, setActiveTool] = useState('pen');
  const [penColor, setPenColor] = useState('#FF0000');
  const [penSize, setPenSize] = useState(2);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const backgroundImageRef = useRef(null);
  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);
  const isDrawingRef = useRef(false);
  const startPointRef = useRef(null);

  // Initialize fabric canvas
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = new Canvas(canvasRef.current, {
        isDrawingMode: true,
        width: canvasRef.current.parentElement.clientWidth,
        height: canvasRef.current.parentElement.clientHeight,
        backgroundColor: '#f0f0f0' // Light gray background to make canvas visible
      });

      // Track changes for undo/redo
      canvas.on('object:added', () => {
        redoStackRef.current = [];
        setCanRedo(false);
        setCanUndo(true);
      });

      // Handle object selection for color changes
      canvas.on('selection:created', (e) => {
        if (e.target && e.target.type === 'i-text') {
          setPenColor(e.target.fill);
        }
      });

      // Handle mouse events for shapes
      canvas.on('mouse:down', (o) => {
        if (activeTool === 'circle' || activeTool === 'rectangle') {
          isDrawingRef.current = true;
          const pointer = canvas.getPointer(o.e);
          startPointRef.current = { x: pointer.x, y: pointer.y };
        }
      });

      canvas.on('mouse:move', (o) => {
        if (!isDrawingRef.current) return;
        
        const pointer = canvas.getPointer(o.e);
        const start = startPointRef.current;
        
        if (activeTool === 'circle') {
          const radius = Math.sqrt(
            Math.pow(pointer.x - start.x, 2) + Math.pow(pointer.y - start.y, 2)
          ) / 2;
          
          const circle = new Circle({
            left: start.x - radius,
            top: start.y - radius,
            radius: radius,
            fill: 'transparent',
            stroke: penColor,
            strokeWidth: penSize
          });
          
          canvas.remove(canvas.getObjects().find(obj => obj.isTemporary));
          circle.isTemporary = true;
          canvas.add(circle);
        } else if (activeTool === 'rectangle') {
          const rect = new Rect({
            left: Math.min(start.x, pointer.x),
            top: Math.min(start.y, pointer.y),
            width: Math.abs(pointer.x - start.x),
            height: Math.abs(pointer.y - start.y),
            fill: 'transparent',
            stroke: penColor,
            strokeWidth: penSize
          });
          
          canvas.remove(canvas.getObjects().find(obj => obj.isTemporary));
          rect.isTemporary = true;
          canvas.add(rect);
        }
        
        canvas.renderAll();
      });

      canvas.on('mouse:up', () => {
        if (isDrawingRef.current) {
          isDrawingRef.current = false;
          const tempObject = canvas.getObjects().find(obj => obj.isTemporary);
          if (tempObject) {
            tempObject.isTemporary = false;
            canvas.renderAll();
          }
        }
      });

      fabricCanvasRef.current = canvas;

      // Load initial image
      if (submission.answerImages && submission.answerImages.length > 0) {
        loadImage(submission.answerImages[currentImageIndex].imageUrl);
      }

      return () => {
        canvas.dispose();
      };
    }
  }, [activeTool, penColor, penSize]);

  const loadImage = (imageUrl) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    setIsImageLoading(true);

    // Clear existing content
    canvas.clear();
    
    // Load new image
    FabricImage.fromURL(imageUrl, (img) => {
      // Calculate scale to fit canvas while maintaining aspect ratio
      const scale = Math.min(
        (canvas.width - 40) / img.width,  // Leave 20px padding on each side
        (canvas.height - 40) / img.height
      );
      
      img.scale(scale);
      
      // Center the image
      img.set({
        left: (canvas.width - img.width * scale) / 2,
        top: (canvas.height - img.height * scale) / 2,
        selectable: false,
        evented: false
      });

      // Store reference to background image
      backgroundImageRef.current = img;
      
      canvas.add(img);
      canvas.renderAll();
      
      // Reset undo/redo stacks
      undoStackRef.current = [];
      redoStackRef.current = [];
      setCanUndo(false);
      setCanRedo(false);
      setIsImageLoading(false);
    }, { crossOrigin: 'anonymous' }); // Add crossOrigin option
  };

  const saveState = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const objects = canvas.getObjects();
    // Don't save the background image in the undo stack
    const annotations = objects.filter(obj => obj !== backgroundImageRef.current);
    undoStackRef.current.push(annotations);
  };

  const handleUndo = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !canUndo) return;

    const objects = canvas.getObjects();
    const annotations = objects.filter(obj => obj !== backgroundImageRef.current);
    
    if (annotations.length > 0) {
      // Save current state to redo stack
      redoStackRef.current.push(annotations);
      setCanRedo(true);

      // Remove the last annotation
      canvas.remove(annotations[annotations.length - 1]);
      
      // Update undo state
      setCanUndo(annotations.length > 1);
    }
  };

  const handleRedo = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !canRedo) return;

    const redoState = redoStackRef.current.pop();
    if (redoState && redoState.length > 0) {
      // Add back the last annotation
      const lastAnnotation = redoState[redoState.length - 1];
      canvas.add(lastAnnotation);
      canvas.renderAll();

      // Update states
      setCanUndo(true);
      setCanRedo(redoStackRef.current.length > 0);
    }
  };

  const handleToolChange = (tool) => {
    setActiveTool(tool);
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    
    switch (tool) {
      case 'pen':
        canvas.isDrawingMode = true;
        const brush = new PencilBrush(canvas);
        brush.color = penColor;
        brush.width = penSize;
        canvas.freeDrawingBrush = brush;
        break;
      case 'text':
      case 'circle':
      case 'rectangle':
        canvas.isDrawingMode = false;
        break;
      case 'select':
        canvas.isDrawingMode = false;
        break;
      default:
        break;
    }
  };

  const handleColorChange = (color) => {
    setPenColor(color);
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      if (activeObject.type === 'i-text') {
        activeObject.set('fill', color);
      } else {
        activeObject.set('stroke', color);
      }
      canvas.renderAll();
    }
  };

  const handleAddText = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const text = new IText('Double click to edit', {
      left: 100,
      top: 100,
      fontFamily: 'Arial',
      fill: penColor,
      fontSize: 20
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    setCanUndo(true);
  };

  const handleImageChange = (index) => {
    if (index >= 0 && index < submission.answerImages.length) {
      setCurrentImageIndex(index);
      loadImage(submission.answerImages[index].imageUrl);
    }
  };

  const handleSave = () => {
    // TODO: Implement save functionality
    toast.success('Annotations saved successfully');
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Annotate Answer</h2>
          <p className="text-sm text-gray-300">
            {submission.user?.name || 'Anonymous'} - {new Date(submission.evaluatedAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Save Annotations
          </button>
          <button
            onClick={onClose}
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
            {/* Accuracy */}
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
              <h3 className="text-sm font-medium text-purple-700 mb-2">Accuracy</h3>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-purple-600 h-2.5 rounded-full" 
                  style={{ width: `${submission.evaluation.accuracy}%` }}
                ></div>
              </div>
              <p className="text-lg font-semibold text-gray-800 mt-1">
                {submission.evaluation.accuracy}%
              </p>
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
                <p className="text-sm text-gray-800 whitespace-pre-wrap">
                  {submission.evaluation.feedback}
                </p>
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
                  onClick={() => handleToolChange('pen')}
                  className={`p-2 rounded ${
                    activeTool === 'pen' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleToolChange('text')}
                  className={`p-2 rounded ${
                    activeTool === 'text' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleToolChange('circle')}
                  className={`p-2 rounded ${
                    activeTool === 'circle' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12m-9 0a9 9 0 1118 0a9 9 0 01-18 0z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleToolChange('rectangle')}
                  className={`p-2 rounded ${
                    activeTool === 'rectangle' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
                <button
                  onClick={() => handleToolChange('select')}
                  className={`p-2 rounded ${
                    activeTool === 'select' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                </button>
              </div>

              {/* Undo/Redo Buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={handleUndo}
                  disabled={!canUndo}
                  className={`p-2 rounded ${
                    canUndo ? 'bg-white text-gray-700 hover:bg-gray-100' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                </button>
                <button
                  onClick={handleRedo}
                  disabled={!canRedo}
                  className={`p-2 rounded ${
                    canRedo ? 'bg-white text-gray-700 hover:bg-gray-100' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={penColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer"
                />
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={penSize}
                  onChange={(e) => setPenSize(parseInt(e.target.value))}
                  className="w-24"
                />
              </div>

              {activeTool === 'text' && (
                <button
                  onClick={handleAddText}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Add Text
                </button>
              )}
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 relative bg-gray-100">
            {isImageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 z-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            )}
            <canvas ref={canvasRef} className="absolute inset-0" />
          </div>

          {/* Image Thumbnails */}
          {submission.answerImages && submission.answerImages.length > 1 && (
            <div className="bg-gray-100 p-4 border-t border-gray-200">
              <div className="flex space-x-2 overflow-x-auto">
                {submission.answerImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => handleImageChange(index)}
                    className={`w-20 h-20 rounded border-2 ${
                      currentImageIndex === index ? 'border-blue-500' : 'border-gray-300'
                    }`}
                  >
                    <img
                      src={image.imageUrl}
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
    </div>
  );
};

export default AnswerAnnotation; 