/**
 * ==========================================================================
 * ORIGINAL MONOLITHIC PDF EDITOR COMPONENT (DEPRECATED)
 * ==========================================================================
 * 
 * ⚠️ IMPORTANT: This is the original large PDFEditor component (~4,000 lines).
 * It has been REFACTORED into smaller components (see below), but is kept for:
 * 
 * 1. BACKWARD COMPATIBILITY: Existing code still works
 * 2. GRADUAL MIGRATION: Allows for transition period
 * 3. COMPARISON TESTING: Can compare old vs. new versions
 * 
 * ==========================================================================
 * HOW TO USE THE REFACTORED VERSION INSTEAD:
 * ==========================================================================
 * 
 * Instead of:
 *   import PDFEditor from 'src/components/tools/pdf/PDFEditor';
 * 
 * Use:
 *   import PDFEditorWrapper from 'src/components/tools/pdf';
 *   // OR
 *   import { PDFEditor as NewPDFEditor } from 'src/components/tools/pdf';
 * 
 * ==========================================================================
 * REFACTORED STRUCTURE OVERVIEW:
 * ==========================================================================
 * 
 * The functionality of this file has been split into:
 * 
 * 1. COMPONENTS (Each under 500 lines):
 *    - PDFEditor.jsx (main orchestration component)
 *    - ErrorBoundary.jsx
 *    - LayerManager.jsx
 *    - PageNavigation.jsx
 *    - SettingsPanel.jsx
 *    - TextEditor.jsx
 *    - Toolbar.jsx
 * 
 * 2. HOOKS (Reusable logic):
 *    - usePdfDocument.js - PDF loading & rendering
 *    - useFabricCanvas.js - Canvas operations
 *    - useUndoRedo.js - History management
 * 
 * 3. UTILITIES:
 *    - constants.js - Shared constants and defaults
 * 
 * See README.md for complete documentation.
 * ==========================================================================
 */

import React, { useState, useRef, useEffect, Component } from 'react';
import { fabric } from 'fabric-pure-browser';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';
import { FaEdit, FaImage, FaSignature, FaDrawPolygon, FaHighlighter, 
  FaFont, FaEraser, FaPenNib, FaRegComment, FaPaperclip, FaSave, 
  FaUpload, FaUndo, FaRedo, FaSearch, FaArrowsAlt, FaStamp,
  FaSquare, FaCircle, FaLongArrowAltRight, FaStar, FaRegStar, FaMapMarker,
  FaPlus, FaHeart, FaClone, FaRegSquare, FaRegCircle, FaPalette, FaFill } from 'react-icons/fa';
import styles from './PDFEditor.module.css';

// Set the worker source to a CDN-hosted file
const PDFJS_VERSION = '3.11.174';
const PDFJS_WORKER_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;
const PDFJS_LIB_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`;

// Initialize PDF.js globally
if (typeof window !== 'undefined') {
  window.pdfjsLib = pdfjsLib;
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
}

// Error Boundary Component
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error("PDF Editor Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-red-700 mb-4">Something went wrong</h2>
          <p className="mb-4 text-red-600">
            {this.state.error && this.state.error.toString()}
          </p>
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => this.setState({ hasError: false })}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Advanced PDF Editor component with rich editing capabilities
 * Features:
 * - Text editing
 * - Image insertion
 * - Shape drawing
 * - Annotations
 * - Form filling
 * - Signatures
 * - Page management
 */
const PDFEditor = () => {
  // State declarations
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfName, setPdfName] = useState('');
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [renderedPage, setRenderedPage] = useState(null);
  const [pdfPageImages, setPdfPageImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [activeToolMode, setActiveToolMode] = useState('cursor');
  
  // Create refs for values that need to be accessed in async functions
  // This ensures we always have access to the latest value
  const scaleRef = useRef(1.0);
  const rotationRef = useRef(0);
  
  // Keep the ref in sync with the state
  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);
  
  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);
  
  // State for editing
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [textOptions, setTextOptions] = useState({
    font: 'Helvetica',
    size: 16,
    color: '#000000',
    backgroundColor: null,
    fontWeight: 'normal',
    fontStyle: 'normal'
  });
  const [drawingOptions, setDrawingOptions] = useState({
    color: '#000000',
    width: 2,
    opacity: 1,
    fill: 'transparent', // Add fill property
    fillEnabled: false // Add property to toggle fill
  });
  
  // Available fonts
  const availableFonts = [
    { name: 'Helvetica', value: 'Helvetica' },
    { name: 'Times Roman', value: 'Times-Roman' },
    { name: 'Courier', value: 'Courier' },
    { name: 'Arial', value: 'Arial' },
    { name: 'Verdana', value: 'Verdana' },
    { name: 'Georgia', value: 'Georgia' }
  ];
  
  // Refs
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const fabricCanvas = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const ocrWorker = useRef(null);
  const resizeTimeoutRef = useRef(null);
  const renderingLockRef = useRef(false); // Add a lock to prevent concurrent render operations
  const renderTaskRef = useRef(null); // Store render task reference directly in a ref
  const canvasWrapperRef = useRef(null);
  
  // State for editor tools and modes
  const [textContent, setTextContent] = useState('');
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const [selectedFont, setSelectedFont] = useState('Helvetica');
  const [fontSize, setFontSize] = useState(12);
  const [fontColor, setFontColor] = useState('#000000');
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPath, setDrawingPath] = useState([]);
  const [annotations, setAnnotations] = useState([]);
  
  // Add color options for drawing
  const [drawingColor, setDrawingColor] = useState('#000000'); // Default to black
  
  // Add state for highlighting
  const [highlightColor, setHighlightColor] = useState('#ffff00'); // Default to yellow
  const [isHighlighting, setIsHighlighting] = useState(false);
  const [highlightStart, setHighlightStart] = useState({ x: 0, y: 0 });
  const [highlightEnd, setHighlightEnd] = useState({ x: 0, y: 0 });
  
  // Add state for image insertion
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 200, height: 200 });
  const [isPlacingImage, setIsPlacingImage] = useState(false);
  const imageInputRef = useRef(null);
  
  // Add state for signature
  const [signatureMode, setSignatureMode] = useState('draw'); // 'draw', 'upload', or 'type'
  const [signatureData, setSignatureData] = useState(null);
  const [signatureText, setSignatureText] = useState('');
  const [signatureFont, setSignatureFont] = useState('cursive');
  const [signatureColor, setSignatureColor] = useState('#000000');
  const [isDrawingSignature, setIsDrawingSignature] = useState(false);
  const [signaturePath, setSignaturePath] = useState([]);
  const signatureCanvasRef = useRef(null);
  const signatureFileRef = useRef(null);
  
  // Add state for eraser
  const [eraserSize, setEraserSize] = useState(20);
  const [isErasing, setIsErasing] = useState(false);
  
  // Add state for sidebar visibility
  const [sidebarVisible, setSidebarVisible] = useState(true);
  
  // Add state for layers
  const [layers, setLayers] = useState([{
    id: 'default-layer',
    name: 'Default Layer',
    visible: true,
    locked: false,
    objects: []
  }]);
  const [activeLayerIndex, setActiveLayerIndex] = useState(0);
  const [showLayers, setShowLayers] = useState(false);

  // Add state for shape drawing
  const [isDrawingShape, setIsDrawingShape] = useState(false);
  const [currentShapeType, setCurrentShapeType] = useState(null);
  const [drawStartPoint, setDrawStartPoint] = useState({ x: 0, y: 0 });
  const [tempShapeObj, setTempShapeObj] = useState(null);

  // Add state for selected object
  const [selectedObject, setSelectedObject] = useState(null);

  // State for text editor popup
  const [textEditorVisible, setTextEditorVisible] = useState(false);
  const [textEditorPosition, setTextEditorPosition] = useState({ x: 0, y: 0 });
  const [currentEditingText, setCurrentEditingText] = useState(null);
  
  // Function to show the text editor popup
  const showTextEditor = (textObj, position) => {
    try {
      if (!textObj) return;
      
      console.log("Showing text editor for object:", textObj.id);
      
      // Store the text object reference
      setCurrentEditingText(textObj);
      
      // Calculate position for the editor - position it near but not over the text
      const editorX = position ? position.x : textObj.left;
      const editorY = position ? position.y - 120 : textObj.top - 120;
      
      // Make sure it's within the viewport
      setTextEditorPosition({
        x: Math.max(10, editorX),
        y: Math.max(50, editorY)
      });
      
      // Show the editor
      setTextEditorVisible(true);
      
      // Select all text in the object
      if (textObj.isEditing) {
        textObj.selectAll();
      }
    } catch (error) {
      console.error("Error showing text editor:", error);
    }
  };
  
  // Function to apply text formatting changes
  const applyTextFormatting = (property, value) => {
    try {
      if (!currentEditingText || !fabricCanvas.current) return;
      
      console.log(`Applying ${property}: ${value} to text`);
      
      // Update the object property
      switch (property) {
        case 'fontFamily':
          currentEditingText.set('fontFamily', value);
          break;
        case 'fontSize':
          currentEditingText.set('fontSize', parseInt(value, 10));
          break;
        case 'fill': // text color
          currentEditingText.set('fill', value);
          break;
        case 'backgroundColor':
          currentEditingText.set('backgroundColor', value === 'transparent' ? '' : value);
          break;
        case 'fontWeight':
          currentEditingText.set('fontWeight', value);
          break;
        case 'fontStyle':
          currentEditingText.set('fontStyle', value);
          break;
        case 'textAlign':
          currentEditingText.set('textAlign', value);
          break;
        case 'underline':
          currentEditingText.set('underline', value);
          break;
        default:
          console.warn(`Unknown property: ${property}`);
          return;
      }
      
      // Update the text options state
      setTextOptions(prev => ({
        ...prev,
        [property === 'fill' ? 'color' : property]: value
      }));
      
      // Render the changes
      fabricCanvas.current.renderAll();
      
      // Add to undo stack
      addToUndoStack();
    } catch (error) {
      console.error(`Error applying ${property}:`, error);
    }
  };
  
  // Function to close the text editor
  const closeTextEditor = () => {
    setTextEditorVisible(false);
    setCurrentEditingText(null);
  };

  // Initialize PDF.js library
  useEffect(() => {
    const loadPdfJS = async () => {
      try {
        if (!window.pdfjsLib) {
          console.log('Initializing PDF.js...');
          
          // First ensure the worker URL is set
          pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
          
          // Make pdfjsLib available globally
          window.pdfjsLib = pdfjsLib;
        }
      } catch (error) {
        console.error("Error initializing PDF.js:", error);
        setError('Failed to initialize PDF viewer. Please refresh the page and try again.');
      }
    };
    
    loadPdfJS();
    
    // Cleanup on unmount
    return () => {
      // Dispose of any fabric canvas
      if (fabricCanvas.current) {
        fabricCanvas.current.dispose();
        fabricCanvas.current = null;
      }
    };
  }, []);

  // Initialize with a default layer
  useEffect(() => {
    if (pdfDoc && layers.length === 0) {
      setLayers([
        { name: 'Layer 1', visible: true, locked: false, objects: [] }
      ]);
    }
  }, [pdfDoc]);

  // Function to add a new layer
  const addLayer = () => {
    setLayers(prev => [
      ...prev,
      { 
        name: `Layer ${prev.length + 1}`, 
        visible: true, 
        locked: false,
        objects: []
      }
    ]);
    // Set the new layer as active
    setActiveLayerIndex(layers.length);
  };

  // Function to delete a layer
  const deleteLayer = (index) => {
    if (layers.length <= 1) {
      // Don't allow deleting the last layer
      return;
    }

    // Remove all objects from the layer
    const layerToDelete = layers[index];
    if (fabricCanvas.current && layerToDelete.objects.length > 0) {
      layerToDelete.objects.forEach(objId => {
        const objToRemove = fabricCanvas.current.getObjects().find(o => o.id === objId);
        if (objToRemove) {
          fabricCanvas.current.remove(objToRemove);
        }
      });
    }

    // Remove the layer from state
    setLayers(prev => prev.filter((_, i) => i !== index));
    
    // Adjust active layer index if needed
    if (activeLayerIndex >= index) {
      setActiveLayerIndex(Math.max(0, activeLayerIndex - 1));
    }
  };

  // Function to toggle layer visibility
  const toggleLayerVisibility = (index) => {
    if (index < 0 || index >= layers.length) {
      console.error("Invalid layer index:", index);
      return;
    }
    
    try {
    setLayers(prev => {
      const newLayers = [...prev];
      newLayers[index].visible = !newLayers[index].visible;
      
        // Update fabric objects visibility - safely
      if (fabricCanvas.current) {
          // Check if the objects array exists for this layer
          const layerObjects = newLayers[index].objects || [];
          
          // Get all canvas objects
          const canvasObjects = fabricCanvas.current.getObjects();
          
          // For each canvas object, check if it belongs to this layer
          canvasObjects.forEach(obj => {
            if (obj && obj.id && layerObjects.includes(obj.id)) {
            obj.visible = newLayers[index].visible;
          }
        });
          
        fabricCanvas.current.renderAll();
      }
      
      return newLayers;
    });
    } catch (error) {
      console.error("Error toggling layer visibility:", error);
    }
  };

  // Function to toggle layer lock
  const toggleLayerLock = (index) => {
    if (index < 0 || index >= layers.length) {
      console.error("Invalid layer index:", index);
      return;
    }
    
    try {
    setLayers(prev => {
      const newLayers = [...prev];
      newLayers[index].locked = !newLayers[index].locked;
      
        // Update fabric objects selectable property - safely
      if (fabricCanvas.current) {
          // Check if the objects array exists for this layer
          const layerObjects = newLayers[index].objects || [];
          
          // Get all canvas objects
          const canvasObjects = fabricCanvas.current.getObjects();
          
          // For each canvas object, check if it belongs to this layer
          canvasObjects.forEach(obj => {
            if (obj && obj.id && layerObjects.includes(obj.id)) {
            obj.selectable = !newLayers[index].locked;
            obj.evented = !newLayers[index].locked;
          }
        });
          
          // If some locked objects were selected, deselect them
          if (newLayers[index].locked) {
            const activeObjects = fabricCanvas.current.getActiveObjects();
            let shouldClearSelection = false;
            
            activeObjects.forEach(obj => {
              if (obj && obj.id && layerObjects.includes(obj.id)) {
                shouldClearSelection = true;
              }
            });
            
            if (shouldClearSelection) {
              fabricCanvas.current.discardActiveObject();
            }
          }
          
        fabricCanvas.current.renderAll();
      }
      
      return newLayers;
    });
    } catch (error) {
      console.error("Error toggling layer lock:", error);
    }
  };

  // Function to rename a layer
  const renameLayer = (index, newName) => {
    setLayers(prev => {
      const newLayers = [...prev];
      newLayers[index].name = newName;
      return newLayers;
    });
  };
  
  // Helper function to clean up Fabric.js canvas container
  const cleanupFabricContainer = (canvas) => {
    if (!canvas) return;
    
    try {
      // Fix wrapper element styling
      if (canvas.wrapperEl) {
        canvas.wrapperEl.style.position = 'absolute';
        canvas.wrapperEl.style.width = '100%';
        canvas.wrapperEl.style.height = '100%';
        canvas.wrapperEl.style.top = '0';
        canvas.wrapperEl.style.left = '0';
        canvas.wrapperEl.style.transform = '';
        canvas.wrapperEl.style.transformOrigin = '';
        canvas.wrapperEl.classList.add(styles.fabricWrapper);
      }
      
      // Fix lower canvas
      if (canvas.lowerCanvasEl) {
        canvas.lowerCanvasEl.style.position = 'absolute';
        canvas.lowerCanvasEl.style.top = '0';
        canvas.lowerCanvasEl.style.left = '0';
        canvas.lowerCanvasEl.style.transform = '';
        canvas.lowerCanvasEl.style.transformOrigin = '';
      }
      
      // Fix upper canvas
      if (canvas.upperCanvasEl) {
        canvas.upperCanvasEl.style.position = 'absolute';
        canvas.upperCanvasEl.style.top = '0';
        canvas.upperCanvasEl.style.left = '0';
        canvas.upperCanvasEl.style.transform = '';
        canvas.upperCanvasEl.style.transformOrigin = '';
      }
      
      // Remove any additional container divs that Fabric.js might have created
      const parentNode = canvas.wrapperEl?.parentNode;
      if (parentNode) {
        Array.from(parentNode.children).forEach(child => {
          if (child !== canvas.wrapperEl && child !== canvasRef.current) {
            parentNode.removeChild(child);
          }
        });
      }
      
      // Force a re-render of the canvas
      canvas.renderAll();
      
    } catch (error) {
      console.error("Error cleaning up Fabric.js container:", error);
    }
  };
  
  // Initialize fabric canvas
  useEffect(() => {
    // Only initialize when the canvas element is available and we have a PDF loaded
    if (overlayCanvasRef.current && !fabricCanvas.current && pdfPageImages.length > 0) {
      try {
        console.log("Initializing Fabric.js canvas...");
        
        // Safety check - verify fabric is available
        if (typeof fabric === 'undefined') {
          throw new Error("Fabric library is not available");
        }
        
        // Additional safety check - verify required fabric components exist
        if (!fabric.Canvas || typeof fabric.Canvas !== 'function') {
          throw new Error("Fabric.Canvas is not a valid constructor");
        }
        
        // Create the Fabric canvas with proper configuration
        const canvas = new fabric.Canvas(overlayCanvasRef.current, {
          isDrawingMode: false,
          selection: true,
          width: pdfPageImages[currentPage - 1]?.width || 800,
          height: pdfPageImages[currentPage - 1]?.height || 600,
          preserveObjectStacking: true,
          stopContextMenu: true,
          fireRightClick: true,
          enableRetinaScaling: true, // Enable for high DPI displays
          renderOnAddRemove: true,
          controlsAboveOverlay: true,
          backgroundColor: 'rgba(0,0,0,0)', // Make canvas background transparent
          stateful: false // Try disabling stateful to prevent save() methods from being called
        });
        
        // Verify the canvas was created properly
        if (!canvas || typeof canvas.add !== 'function' || typeof canvas.renderAll !== 'function') {
          throw new Error("Fabric canvas was not initialized correctly");
        }
        
        // Store the canvas reference after validation
        fabricCanvas.current = canvas;
        
        // Add a custom class to the canvas container to make it easier to find
        try {
          // The canvas container is the parent element of the lower canvas
          const canvasContainer = canvas.lowerCanvasEl.parentNode;
          if (canvasContainer) {
            canvasContainer.classList.add('pdf-editor-canvas-container');
            console.log("Added custom class to canvas container for easier selection");
          }
        } catch (classError) {
          console.error("Could not add class to canvas container:", classError);
        }
        
        // Safe render method for the canvas
        const safeRender = (canvasObj) => {
          try {
            if (canvasObj && typeof canvasObj.renderAll === 'function') {
              canvasObj.renderAll();
            }
          } catch (renderError) {
            console.error("Error in safe render:", renderError);
          }
        };
        
        // Override the renderAll method with our safe version
        const originalRenderAll = canvas.renderAll;
        canvas.renderAll = function() {
          try {
            return originalRenderAll.apply(this, arguments);
          } catch (error) {
            console.error("Error in renderAll, using fallback:", error);
            // Try to render without calling save()
            try {
              canvas.requestRenderAll();
            } catch (fallbackError) {
              console.error("Fallback render also failed:", fallbackError);
            }
          }
        };
        
        // Clean up canvas container
        cleanupFabricContainer(canvas);
        
        // Set up event listeners - with try/catch for each to prevent cascading failures
        try {
          canvas.on('object:modified', (e) => {
            try {
              handleObjectModified(e);
            } catch (error) {
              console.error("Error in object:modified handler:", error);
            }
          });
        } catch (error) {
          console.error("Failed to set up object:modified listener:", error);
        }
        
        try {
          canvas.on('path:created', (e) => {
            try {
              handlePathCreated(e);
            } catch (error) {
              console.error("Error in path:created handler:", error);
            }
          });
        } catch (error) {
          console.error("Failed to set up path:created listener:", error);
        }
        
        try {
          canvas.on('mouse:down', (e) => {
            try {
              // This is critical for handling all mouse interactions properly
              // Only process clicks when not in drawing mode and not already selecting an object
              if (!canvas.isDrawingMode && !canvas.getActiveObject() && !isDrawingShape) {
                handleCanvasClick(e);
              }
            } catch (error) {
              console.error("Error in mouse:down handler:", error);
            }
          });
        } catch (error) {
          console.error("Failed to set up mouse:down listener:", error);
        }
        
        try {
        canvas.on('selection:created', (e) => {
            try {
          // When a text object is selected, update the text options
          if (e.selected && e.selected[0] && e.selected[0].type === 'i-text') {
            const selectedText = e.selected[0];
            setTextOptions({
                  font: selectedText.fontFamily || 'Helvetica',
                  size: selectedText.fontSize || 16,
                  color: selectedText.fill || '#000000',
              backgroundColor: selectedText.backgroundColor,
              fontWeight: selectedText.fontWeight || 'normal',
              fontStyle: selectedText.fontStyle || 'normal'
            });
              } else if (e.selected && e.selected[0]) {
                // For other object types, update the drawing options if they have the right properties
                const obj = e.selected[0];
                const newOptions = { ...drawingOptions };
                
                if (obj.stroke) newOptions.color = obj.stroke;
                if (obj.strokeWidth) newOptions.width = obj.strokeWidth;
                if (obj.opacity) newOptions.opacity = obj.opacity;
                if (obj.fill && obj.fill !== 'transparent') {
                  newOptions.fill = obj.fill;
                  newOptions.fillEnabled = true;
                }
                
                setDrawingOptions(newOptions);
                setSelectedObject(obj);
              }
            } catch (error) {
              console.error("Error in selection:created handler:", error);
            }
          });
        } catch (error) {
          console.error("Failed to set up selection:created listener:", error);
        }
        
        try {
          canvas.on('selection:cleared', () => {
            try {
              setSelectedObject(null);
            } catch (error) {
              console.error("Error in selection:cleared handler:", error);
            }
          });
        } catch (error) {
          console.error("Failed to set up selection:cleared listener:", error);
        }
        
        // Special handler for text tool - capture clicks directly on the canvas element
        const addTextToolClickHandler = () => {
          if (canvas.upperCanvasEl) {
            const textHandler = (mouseEvent) => {
              try {
                // Only process if the text tool is active and no object is selected
                if (activeToolMode === 'text' && !canvas.getActiveObject()) {
                  // Log the native event for debugging
                  console.log("Text tool direct click detected:", 
                             mouseEvent.clientX, mouseEvent.clientY);
                  
                  // Get click position with bounds checking
                  const rect = canvas.upperCanvasEl.getBoundingClientRect();
                  
                  // Verify we have valid coordinates
                  if (!rect || typeof mouseEvent.clientX !== 'number' || typeof mouseEvent.clientY !== 'number') {
                    console.error("Invalid coordinates or canvas rectangle");
                    return;
                  }
                  
                  // Calculate position relative to canvas
                  const x = mouseEvent.clientX - rect.left;
                  const y = mouseEvent.clientY - rect.top;
                  
                  // Make sure coordinates are valid numbers
                  if (isNaN(x) || isNaN(y)) {
                    console.error("Got NaN coordinates:", x, y);
                    return;
                  }
                  
                  // Create synthetic fabric event with explicit pointer property
                  const fabricEvent = {
                    e: mouseEvent,
                    target: null,
                    pointer: { x, y },
                    clientX: mouseEvent.clientX,
                    clientY: mouseEvent.clientY
                  };
                  
                  // Process the click for text tool
                  console.log("Direct text tool click at", x, y);
                  handleCanvasClick(fabricEvent);
                }
              } catch (textClickError) {
                console.error("Error handling text tool click:", textClickError);
              }
            };
            
            // Add the click handler with capture phase to handle it early
            canvas.upperCanvasEl.addEventListener('click', textHandler, true);
            
            // Return cleanup function
            return () => {
              try {
                if (canvas.upperCanvasEl) {
                  canvas.upperCanvasEl.removeEventListener('click', textHandler, true);
                }
              } catch (error) {
                console.error("Error removing text click handler:", error);
              }
            };
          }
          return () => {}; // Empty cleanup if handler wasn't added
        };
        
        // Add the text tool handler
        const textHandlerCleanup = addTextToolClickHandler();
        
        // Set up keyboard shortcuts
        const keyDownHandler = (e) => {
          try {
          // Delete key to remove selected objects
          if (e.key === 'Delete' && canvas.getActiveObject()) {
            if (canvas.getActiveObjects().length > 0) {
              addToUndoStack();
              canvas.getActiveObjects().forEach(obj => {
                  try {
                canvas.remove(obj);
                  } catch (removeError) {
                    console.error("Error removing object:", removeError);
                  }
              });
              canvas.discardActiveObject();
                safeRender(canvas);
            }
          }
          
          // Ctrl+Z for undo
          if (e.ctrlKey && e.key === 'z') {
            e.preventDefault();
            handleUndo();
          }
          
          // Ctrl+Y for redo
          if (e.ctrlKey && e.key === 'y') {
            e.preventDefault();
            handleRedo();
          }
          } catch (keyError) {
            console.error("Error in keyboard handler:", keyError);
          }
        };
        
        // Add the keyboard event listener
        document.addEventListener('keydown', keyDownHandler);
        
        // Switch to cursor mode by default
        try {
          // Check if there was a previously selected tool in sessionStorage
          let initialTool = 'cursor';
          try {
            const savedTool = sessionStorage.getItem('pdfEditorActiveTool');
            if (savedTool) {
              console.log("Restoring previously selected tool:", savedTool);
              initialTool = savedTool;
            }
          } catch (storageError) {
            console.error("Error reading saved tool:", storageError);
          }
          
          // Apply the selected tool - using the current value from state as backup
          const toolToApply = initialTool || activeToolMode || 'cursor';
          handleToolSelect(toolToApply);
        } catch (error) {
          console.error("Error setting initial tool mode:", error);
          // If setting the saved tool fails, just set basic cursor properties
          try {
            setActiveToolMode('cursor');
            canvas.isDrawingMode = false;
            canvas.selection = true;
            canvas.defaultCursor = 'default';
            canvas.hoverCursor = 'default';
            safeRender(canvas);
          } catch (fallbackError) {
            console.error("Error in fallback tool initialization:", fallbackError);
          }
        }
        
        console.log("Fabric.js canvas initialized successfully");
        
        // Return combined cleanup function
        return () => {
          // Remove keyboard event listener
          document.removeEventListener('keydown', keyDownHandler);
          
          // Call text handler cleanup
          try {
            textHandlerCleanup();
          } catch (error) {
            console.error("Error in text handler cleanup:", error);
          }
          
          // Clean up the canvas - SAFELY without using fabric.dispose()
          if (fabricCanvas.current) {
            try {
              // Remove all event listeners
              try {
                fabricCanvas.current.off();
              } catch (error) {
                console.error("Error removing canvas event listeners:", error);
              }
              
              // Remove all objects from the canvas
              try {
                fabricCanvas.current.clear();
              } catch (error) {
                console.error("Error clearing canvas objects:", error);
              }
              
              // Remove canvas elements from DOM - manually instead of using dispose()
              try {
                const wrapperEl = fabricCanvas.current.wrapperEl;
                if (wrapperEl && wrapperEl.parentNode) {
                  // Save reference to parent node before removing wrapper
                  const parentNode = wrapperEl.parentNode;
                  
                  // Remove wrapper from DOM directly - avoid style manipulations
                  parentNode.removeChild(wrapperEl);
                }
              } catch (error) {
                console.error("Error removing canvas from DOM:", error);
              }
              
              // Clear the reference
              fabricCanvas.current = null;
            } catch (error) {
              console.error("Error cleaning up fabric canvas:", error);
            }
          }
        };
      } catch (error) {
        console.error("Error initializing Fabric.js canvas:", error);
        setError(`Failed to initialize drawing canvas: ${error.message}. Please refresh the page.`);
      }
    }
    
    // Default cleanup function - used if we never fully initialized
    return () => {
      if (fabricCanvas.current) {
        try {
          // SAFE manual cleanup - WITHOUT using dispose()
          
          // Remove event listeners
          try {
            fabricCanvas.current.off();
          } catch (error) {
            console.error("Error removing canvas event listeners:", error);
          }
          
          // Clear all objects
          try {
            fabricCanvas.current.clear();
          } catch (error) {
            console.error("Error clearing canvas objects:", error);
          }
          
          // Manually remove from DOM
          try {
            const wrapperEl = fabricCanvas.current.wrapperEl;
            if (wrapperEl && wrapperEl.parentNode) {
              wrapperEl.parentNode.removeChild(wrapperEl);
            }
          } catch (error) {
            console.error("Error removing canvas from DOM:", error);
          }
          
          // Reset reference
          fabricCanvas.current = null;
        } catch (error) {
          console.error("Error in canvas cleanup:", error);
        }
      }
    };
  }, [pdfPageImages, currentPage, drawingOptions.color, drawingOptions.width, activeToolMode]);
  
  // Initialize OCR worker
  useEffect(() => {
    const initOCR = async () => {
      try {
        if (!ocrWorker.current) {
          // Use Tesseract.js v3.0.3 API
          const worker = await createWorker('eng', 1, {
            logger: m => {
              if (m && typeof m.progress === 'number') {
                console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
              }
            }
          });
          
          ocrWorker.current = worker;
          console.log("OCR worker initialized successfully");
        }
      } catch (error) {
        console.error("Error initializing OCR worker:", error);
        // Continue without OCR functionality
      }
    };
    
    // Only initialize if needed
    if (activeToolMode === 'text' && !ocrWorker.current) {
      initOCR();
    }
    
    return () => {
      if (ocrWorker.current) {
        try {
          ocrWorker.current.terminate();
        } catch (error) {
          console.error("Error terminating OCR worker:", error);
        }
      }
    };
  }, [activeToolMode]);
  
  // Load PDF.js library
  useEffect(() => {
    const loadPdfJS = async () => {
      try {
        // Log the PDF.js version to help with debugging
        console.log(`Using PDF.js version: ${pdfjsLib.version}`);
        console.log(`Using hardcoded PDF.js version: ${PDFJS_VERSION}`);
        console.log(`Worker source: ${pdfjsLib.GlobalWorkerOptions.workerSrc}`);
        
        // Verify that the worker URL contains the correct version
        if (!pdfjsLib.GlobalWorkerOptions.workerSrc.includes(PDFJS_VERSION)) {
          console.warn(`Worker URL doesn't match PDF.js version. Setting correct worker URL.`);
          pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
          console.log(`Updated worker source: ${pdfjsLib.GlobalWorkerOptions.workerSrc}`);
        }
        
        // Add a fallback mechanism in case the CDN worker fails
        window.addEventListener('error', (event) => {
          if (event.filename && event.filename.includes('pdf.worker')) {
            console.warn('PDF.js worker failed to load from CDN, using fallback');
            // Try to use a different CDN or local worker
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.js`;
          }
        }, { once: true });
      } catch (error) {
        console.error("Error loading PDF.js:", error);
      }
    };
    
    loadPdfJS();
  }, []);
  
  const loadPDF = async (file) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Cancel any ongoing render operations
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
          renderTaskRef.current = null;
        } catch (error) {
          console.error("Error cancelling render during PDF load:", error);
        }
      }
      
      // Release the rendering lock
      renderingLockRef.current = false;
      
      // Always start with scale=1.0 when loading a new PDF
      const initialScale = 1.0;
      const initialRotation = 0;
      
      // Update both state and refs
      setScale(initialScale);
      setRotation(initialRotation);
      scaleRef.current = initialScale;
      rotationRef.current = initialRotation;
      
      console.log("Initializing PDF with scale:", initialScale, "rotation:", initialRotation);
      
      // Read the file and create copies to prevent detached ArrayBuffer issues
      const fileDataBuffer = await file.arrayBuffer();
      
      // Create separate copies for each use to prevent detached ArrayBuffer issues
      // Using slice(0) to create a copy of the buffer - this is CRITICAL to prevent detachment
      const pdfJsBuffer = new Uint8Array(fileDataBuffer.slice(0)).buffer;
      const pdfLibBuffer = new Uint8Array(fileDataBuffer.slice(0)).buffer;
      
      // Load the PDF with PDF.js
      try {
        const loadingTask = pdfjsLib.getDocument({
          data: pdfJsBuffer,
          cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/cmaps/`,
          cMapPacked: true,
          standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/standard_fonts/`,
        });

        // Track loading progress
        loadingTask.onProgress = (progress) => {
          if (progress.total > 0) {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            console.log(`Loading PDF: ${percent}%`);
          }
        };
        
        const pdf = await loadingTask.promise;
        console.log("PDF loaded successfully:", pdf);
        
        // Update state
        setPdfDoc(pdf);
        setPageCount(pdf.numPages);
        setCurrentPage(1);
        setPdfPageImages([]);
        
        // Reset all editing state
        cleanupFabricCanvas();
        
        // Create initial layer if needed
        setLayers([{
          id: 'default-layer',
          name: 'Default Layer',
          visible: true,
          locked: false,
          objects: []
        }]);
        setActiveLayerIndex(0);
        
        // Create PDF document with pdf-lib for later saving - do this in parallel
        const pdfLibPromise = PDFDocument.load(pdfLibBuffer)
          .then(pdfDoc => {
          setPdfFile(pdfDoc);
          setPdfName(file.name);
          })
          .catch(pdfLibError => {
            console.error("Error loading PDF with pdf-lib:", pdfLibError);
            // Non-critical error, we can still proceed with viewing
            console.log("PDF editing capabilities may be limited");
          });
        
        // Wait a moment before rendering to ensure state updates are applied
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Render the first page - don't wait for pdf-lib to finish
          await renderPage(pdf, 1);
          
        // Log completion
        console.log("PDF loaded and first page rendered");
        
        // Now wait for pdf-lib to finish
        await pdfLibPromise;
        
    } catch (error) {
      console.error("Error loading PDF:", error);
        setError(`Failed to load PDF: ${error.message}. Please try a different file.`);
      }
    } catch (error) {
      console.error("Error reading file:", error);
      setError(`Failed to read file: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Critical fix for the render operation error
  const renderPage = async (pdf, pageNumber) => {
    // If we're already rendering, don't start another render
    if (renderingLockRef.current === true) {
      console.log("Render operation already in progress, skipping...");
      return;
    }
    
    // Set the rendering lock
    renderingLockRef.current = true;
    
    try {
      // Validate input
      if (!pdf) {
        console.error("No PDF document available");
        renderingLockRef.current = false;
        return;
      }
      
      // Set loading state
      setIsLoading(true);
      
      console.log(`Starting render of page ${pageNumber}...`);
      
      // First, properly cancel any ongoing render task
      if (renderTaskRef.current) {
        try {
          console.log("Cancelling previous render task...");
          renderTaskRef.current.cancel();
          renderTaskRef.current = null;
        } catch (error) {
          console.error("Error cancelling previous render task:", error);
        }
      }
      
      // Clean up any old fabric canvas
      cleanupFabricCanvas();
      
      // Wait for a moment to ensure previous operations are fully aborted
      await new Promise(resolve => setTimeout(resolve, 100));

      // Get the page
      const page = await pdf.getPage(pageNumber);
      
      // Use the ref values which are always available
      const currentScale = scaleRef.current;
      const currentRotation = rotationRef.current;
      
      console.log(`Page ${pageNumber} retrieved. Rendering with scale=${currentScale}, rotation=${currentRotation}`);
      
      // Create viewport
      const viewport = page.getViewport({ 
        scale: currentScale,
        rotation: currentRotation 
      });
      
      // Get canvas and validate
      const canvas = canvasRef.current;
      if (!canvas) {
        console.error("Canvas element not found");
        renderingLockRef.current = false;
        setIsLoading(false);
        return;
      }

      // Set canvas dimensions
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Get rendering context - keep this simple
      const context = canvas.getContext('2d', { alpha: false });
      if (!context) {
        console.error("Could not get canvas context");
        renderingLockRef.current = false;
        setIsLoading(false);
        return;
      }
      
      // Clear canvas and set white background
      context.fillStyle = '#FFFFFF';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Create render task with minimal options
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
        background: 'white'
      };
      
      try {
        // Create a new render task
        const renderTask = page.render(renderContext);
        
        // Store it in our ref for potential future cancellation
        renderTaskRef.current = renderTask;
        
        // Wait for rendering to complete
        await renderTask.promise;
        
        console.log(`Page ${pageNumber} rendered successfully`);
        
        // Only continue if we're still mounted
        if (!canvasRef.current) {
          console.log("Component unmounted during render, aborting post-render steps");
          return;
        }
        
        // Store the rendered image
        try {
      const pageImage = canvas.toDataURL('image/png', 1.0);
      setPdfPageImages(prev => {
        const newImages = [...prev];
        newImages[pageNumber - 1] = {
          url: pageImage,
              dataUrl: pageImage, // Add this for compatibility with renderCurrentPage
          width: viewport.width,
              height: viewport.height,
              originalWidth: viewport.width,
              originalHeight: viewport.height
        };
        return newImages;
      });
        } catch (imgError) {
          console.error("Error capturing rendered page image:", imgError);
        }

        // Initialize Fabric canvas - only do this after PDF rendering is fully complete
      if (overlayCanvasRef.current) {
          try {
            // Only create a new fabric canvas if we don't have one
            if (!fabricCanvas.current) {
        const fabricCanvasOptions = {
          isDrawingMode: false,
          width: viewport.width,
          height: viewport.height,
          selection: true,
          preserveObjectStacking: true,
          backgroundColor: null
        };

              fabricCanvas.current = new fabric.Canvas(overlayCanvasRef.current, fabricCanvasOptions);
              
              // Restore objects if needed
              if (layers && 
                  layers.length > 0 && 
                  activeLayerIndex >= 0 && 
                  activeLayerIndex < layers.length && 
                  layers[activeLayerIndex]?.objects?.length > 0) {
                
                layers[activeLayerIndex].objects.forEach(obj => {
                  try {
                    fabricCanvas.current.add(obj);
                  } catch (objError) {
                    console.error("Error adding object to fabric canvas:", objError);
                  }
                });
              }
            }
          } catch (fabricError) {
            console.error("Error initializing fabric canvas:", fabricError);
          }
        }
        
        // Clear the render task ref now that we're done
        renderTaskRef.current = null;
        
      } catch (renderError) {
        console.error(`Error rendering page ${pageNumber}:`, renderError);
        setError(`Failed to render page ${pageNumber}: ${renderError.message}`);
      }
      
    } catch (pageError) {
      console.error(`General error in renderPage:`, pageError);
      setError(`Failed to process page: ${pageError.message}`);
    } finally {
      // Always release the rendering lock and clear loading state
      renderingLockRef.current = false;
      setIsLoading(false);
      
      console.log(`Render operation for page ${pageNumber} completed`);
    }
  };

  // Add a proper cleanup function for fabric canvas
  const cleanupFabricCanvas = () => {
      if (fabricCanvas.current) {
      try {
        // Save objects if needed
        if (layers && activeLayerIndex >= 0 && activeLayerIndex < layers.length) {
          const objects = fabricCanvas.current.getObjects();
          setLayers(prevLayers => {
            const newLayers = [...prevLayers];
            if (newLayers[activeLayerIndex]) {
              newLayers[activeLayerIndex].objects = objects;
            }
            return newLayers;
          });
        }
        
        // Remove all event handlers
        fabricCanvas.current.off();
        
        // Clear all objects
        fabricCanvas.current.clear();
        
        // Dispose the canvas
        fabricCanvas.current.dispose();
        
        // Clear the reference
        fabricCanvas.current = null;
        
        console.log("Fabric canvas cleaned up successfully");
      } catch (error) {
        console.error("Error during fabric canvas cleanup:", error);
      }
    }
  };

  // Add component cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up everything when component unmounts
      cleanupFabricCanvas();
      
      // Clean up any other resources
      if (ocrWorker.current) {
        ocrWorker.current.terminate();
        ocrWorker.current = null;
      }
    };
  }, []);

  // Update useEffect for page changes to use renderTaskRef
  useEffect(() => {
    let isMounted = true;

    const loadAndRenderPage = async () => {
      // Only proceed if the PDF document is loaded and the requested page is valid
      if (!pdfDoc || currentPage > pageCount || !isMounted) {
        return;
      }
      
      try {
        // Don't set loading state here as renderPage will handle it
          await renderPage(pdfDoc, currentPage);
        } catch (error) {
          console.error("Error rendering page:", error);
          if (isMounted) {
            setError(`Failed to render page ${currentPage}: ${error.message}`);
        }
      }
    };

    loadAndRenderPage();

    // Cleanup function to prevent state updates after unmount
    // and cancel any ongoing rendering operation
    return () => {
      isMounted = false;
      
      // Cancel any ongoing render task
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
          renderTaskRef.current = null;
        } catch (error) {
          console.error("Error cancelling render task in cleanup:", error);
        }
      }
      
      // Release the rendering lock
      renderingLockRef.current = false;
    };
  }, [currentPage, pdfDoc, pageCount]);
  
  // Update the handlePageChange function
  const handlePageChange = async (newPage) => {
    if (newPage < 1 || newPage > pageCount || isLoading) {
      return;
    }
    
    // Don't attempt to change page if we're already rendering
    if (renderingLockRef.current) {
      console.log("Page change requested while rendering, ignoring");
      return;
    }
    
    try {
      // Cancel any ongoing rendering
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
          renderTaskRef.current = null;
        } catch (error) {
          console.error("Error cancelling render during page change:", error);
        }
      }
      
      // Release rendering lock in case it was set
      renderingLockRef.current = false;
      
      // Set the new page number FIRST
      setCurrentPage(newPage);
      
      // The page change effect will handle the actual rendering
      console.log(`Changing to page ${newPage}`);
    } catch (error) {
      console.error("Error changing page:", error);
      setError(`Failed to change to page ${newPage}: ${error.message}`);
    }
  };

  const handleFileSelect = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      // Check if file is a PDF
      if (file.type !== 'application/pdf') {
        setError('Please select a PDF file.');
        return;
      }

      console.log("Selected file:", file.name, "Size:", (file.size / 1024 / 1024).toFixed(2), "MB");

      // Clear previous state
      setError(null);
      
      // Cancel any ongoing rendering
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
          renderTaskRef.current = null;
        } catch (error) {
          console.error("Error cancelling render task:", error);
        }
      }
      
      // Release the rendering lock
      renderingLockRef.current = false;
      
      // Clean up fabric canvas
      cleanupFabricCanvas();
      
      // Reset PDF state
      setPdfDoc(null);
      setPdfFile(null);
      setPdfName('');
      setPdfUrl(null);
      setPageCount(0);
      setCurrentPage(1);
      setPdfPageImages([]);
      
      // Reset view state
      setScale(1.0);
      setRotation(0);
      scaleRef.current = 1.0;
      rotationRef.current = 0;
      
      // Reset UI state
      setActiveToolMode('cursor');
      setUndoStack([]);
      setRedoStack([]);
      
      // Initialize empty layers
      setLayers([{
        id: 'default-layer',
        name: 'Default Layer',
        visible: true,
        locked: false,
        objects: []
      }]);
      setActiveLayerIndex(0);

      // Load the new PDF
      await loadPDF(file);

    } catch (error) {
      console.error("Error selecting file:", error);
      setError(`Failed to load file: ${error.message}`);
    } finally {
      // Clear the file input so the same file can be selected again
      if (event.target) event.target.value = '';
    }
  };

  // Update renderCurrentPage to respect rendering lock and improve quality
  const renderCurrentPage = () => {
    console.log("Triggering renderCurrentPage due to dependency change");
    
    // Additional validation of page data
    if (!Array.isArray(pdfPageImages) || pdfPageImages.length === 0) {
      console.error("No PDF page images available");
      return;
    }
    
    // Skip if we don't have page images, are out of bounds, or the rendering lock is active
    if (currentPage <= 0 || currentPage > pdfPageImages.length) {
      console.error("Invalid page number:", currentPage, "of", pdfPageImages.length);
      return;
    }
    
    // Get the current page's image data
    const pageImage = pdfPageImages[currentPage - 1];
    if (!pageImage) {
      console.error("No image data for page", currentPage);
      return;
    }
    
    // Compatibility fix: support both url and dataUrl property names
    const imageUrl = pageImage.dataUrl || pageImage.url;
    if (!imageUrl) {
      console.error("No image data URL available for current page");
          return;
        }
        
    // No need to proceed if there's no canvas reference
    if (!canvasRef.current) {
      console.error("Canvas reference is not available");
      return;
    }
    
    // Get scale from ref for latest value
    const currentScale = scaleRef.current || 1.0;
    console.log("Current scale from ref:", currentScale);
    
    // Create image to calculate dimensions
    const img = new Image();
    
    // Set up handlers for the image loading
    img.onload = () => {
      try {
        // Check if component is still mounted before proceeding
        if (!canvasRef.current) {
          console.log("Component unmounted during image load, aborting render");
          return;
        }
        
        // Get the 2D context for drawing
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) {
          console.error("Failed to get 2D context");
          return;
        }
        
        // Calculate the dimensions for the canvas with the current scale factor
        // Use device pixel ratio for higher quality
        const dpr = window.devicePixelRatio || 1;
        const scaledWidth = img.width * currentScale;
        const scaledHeight = img.height * currentScale;
        
        // Set the displayed size (CSS dimensions)
        canvasRef.current.style.width = `${scaledWidth}px`;
        canvasRef.current.style.height = `${scaledHeight}px`;
        
        // Set the actual dimensions for high DPI (canvas buffer size)
        canvasRef.current.width = scaledWidth * dpr;
        canvasRef.current.height = scaledHeight * dpr;
        
        // Clear any previous content
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        
        // Scale for high DPI display
        ctx.scale(dpr, dpr);
        
        // Apply rotation if needed
        if (rotation !== 0) {
          // Move to center, rotate, then translate back
          ctx.translate(scaledWidth / 2, scaledHeight / 2);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.translate(-scaledWidth / 2, -scaledHeight / 2);
        }
        
        // Draw the image at the scaled dimensions
        ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);
        
        // Also update the overlay canvas size for annotations if it exists
        if (overlayCanvasRef.current) {
          try {
            // Update fabric canvas dimensions
            if (fabricCanvas.current) {
              // Update the wrapper size first
              if (fabricCanvas.current.wrapperEl) {
                fabricCanvas.current.wrapperEl.style.width = `${scaledWidth}px`;
                fabricCanvas.current.wrapperEl.style.height = `${scaledHeight}px`;
              }
              
              // Update the canvas itself - this should trigger proper resizing of all elements
              fabricCanvas.current.setWidth(scaledWidth);
              fabricCanvas.current.setHeight(scaledHeight);
              
              // Calculate zoom factor relative to original PDF size
              const zoomFactor = currentScale;
              
              // Apply zoom to all objects
              try {
                const objects = fabricCanvas.current.getObjects();
                objects.forEach(obj => {
                  // The objects are already placed relative to current scale, 
                  // so we don't need to transform them if the scale hasn't changed
                  // The scaling is handled by setWidth/setHeight above
                });
                
                // Center content if zooming in (optional feature)
                if (currentScale > 1.2) {
                  fabricCanvas.current.viewportTransform[4] = (fabricCanvas.current.width - img.width * currentScale) / 2;
                  fabricCanvas.current.viewportTransform[5] = (fabricCanvas.current.height - img.height * currentScale) / 2;
                } else {
                  // Reset transform for normal view
                  fabricCanvas.current.viewportTransform[4] = 0;
                  fabricCanvas.current.viewportTransform[5] = 0;
                }
                
                // Safe render with fallback
                try {
            fabricCanvas.current.renderAll();
                } catch (renderError) {
                  console.error("Error in renderAll during resize:", renderError);
                  try {
                    fabricCanvas.current.requestRenderAll();
                  } catch (secondError) {
                    console.error("Fallback render also failed:", secondError);
                  }
                }
              } catch (objectError) {
                console.error("Error updating canvas objects:", objectError);
              }
            } else {
              console.warn("Fabric canvas not available for size update");
            }
          } catch (overlayError) {
            console.error("Error updating overlay canvas:", overlayError);
            // If we have a critical error with the fabric canvas, 
            // recreate it to avoid persistent issues
            if (fabricCanvas.current) {
              try {
                // Reset rendering lock if it got stuck
                if (renderingLockRef.current) {
                  renderingLockRef.current = false;
                }
                
                // Try to reinitialize the fabric canvas if it's in a bad state
                fabricCanvas.current = null;
                
                // The canvas will be recreated on next render cycle through the useEffect
              } catch (resetError) {
                console.error("Error resetting canvas state:", resetError);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error rendering current page:", error);
        setError(`Rendering error: ${error.message}. Try refreshing the page.`);
      }
    };
    
    // Error handler for the image
    img.onerror = (error) => {
      console.error("Error loading page image:", error);
      setError("Failed to load page image. Try refreshing the page.");
    };
    
    // Start loading the image
    img.src = imageUrl;
  };

  // Function to save the edited PDF
  const savePDF = async () => {
    if (!pdfFile || !pdfDoc) {
      setError("No PDF loaded to save");
      return;
    }
    
    try {
      setIsLoading(true);
      console.log("Starting PDF save process...");

      // Create a copy of the PDF document to avoid modifying the original
      const pdfBytes = await pdfFile.save();
      const newPdfDoc = await PDFDocument.load(pdfBytes.buffer);
      
      // Get all fabric objects from all visible layers
      const allObjects = [];
      if (fabricCanvas.current) {
        const visibleLayers = layers.filter(layer => layer.visible);
        
        // Collect objects from visible layers
        visibleLayers.forEach(layer => {
          if (layer.objects && layer.objects.length) {
            const layerObjects = fabricCanvas.current.getObjects().filter(obj => 
              layer.objects.includes(obj.id)
            );
            allObjects.push(...layerObjects);
          }
        });
      }

      // Handle each page separately
      for (let i = 0; i < newPdfDoc.getPageCount(); i++) {
        const pageIndex = i;
        const page = newPdfDoc.getPage(pageIndex);
        
        // Only process the current page for now
        // In a full implementation, you'd need to track objects per page
        if (pageIndex === currentPage - 1) {
          // Get page dimensions
          const { width, height } = page.getSize();
          
          if (pdfPageImages[pageIndex] && fabricCanvas.current) {
            // Create a temporary canvas to draw the fabric objects
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            
            // Set canvas dimensions to match the PDF page
            tempCanvas.width = width;
            tempCanvas.height = height;
            
            // Draw the fabric objects
            const fabricObjects = fabricCanvas.current.toJSON();
            
            // For now, we're just embedding the entire canvas as an image
            // A more sophisticated approach would convert vector objects to PDF annotations
            if (fabricCanvas.current.getObjects().length > 0) {
              const fabricImage = fabricCanvas.current.toDataURL({
                format: 'png',
                quality: 1.0,
                multiplier: 2
              });
              
              // Convert data URL to Uint8Array
              const base64Data = fabricImage.split(',')[1];
              const binaryData = atob(base64Data);
              const data = new Uint8Array(binaryData.length);
              for (let i = 0; i < binaryData.length; i++) {
                data[i] = binaryData.charCodeAt(i);
              }
              
              // Embed the image in the PDF
              const pngImage = await newPdfDoc.embedPng(data);
              page.drawImage(pngImage, {
                x: 0,
                y: 0,
                width: width,
                height: height,
                opacity: 0.99 // Slightly transparent to avoid completely hiding text
              });
            }
          }
        }
      }

      // Save the PDF and offer it for download
      const modifiedPdfBytes = await newPdfDoc.save();
      
      // Create a blob from the PDF bytes
      const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
      
      // Create a download link
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      
      // Generate a filename
      const originalName = pdfName || 'document.pdf';
      const nameWithoutExt = originalName.replace(/\.pdf$/i, '');
      link.download = `${nameWithoutExt}_edited.pdf`;
      
      // Trigger the download
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      
      console.log("PDF saved successfully");
    } catch (error) {
      console.error("Error saving PDF:", error);
      setError(`Failed to save PDF: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Update the effect for handling renderCurrentPage
  useEffect(() => {
    // Use a timeout to ensure state is updated before rendering
    const renderTimer = setTimeout(() => {
      // Only run if we have page images and we're not currently rendering
      if (canvasRef.current && pdfPageImages.length > 0 && 
          currentPage <= pdfPageImages.length && !renderingLockRef.current) {
        console.log("Triggering renderCurrentPage due to dependency change");
        renderCurrentPage();
      }
    }, 50); // Short delay to let any state updates finish

    return () => {
      clearTimeout(renderTimer);
    };
  }, [currentPage, pdfPageImages, scale, rotation]); // Removed activeToolMode from dependencies

  // Add a dedicated effect for text tool clicks on the canvas wrapper
  useEffect(() => {
    // Only add this handler when the text tool is active and we have both refs available
    if (!canvasWrapperRef.current || activeToolMode !== 'text' || !fabricCanvas.current) {
      return;
    }
    
    console.log("Setting up additional text tool click handler on canvas wrapper");
    
    const handleCanvasWrapperClick = (e) => {
      try {
        // Don't process clicks on fabric canvas elements - let those be handled by Fabric.js
        if (e.target && (
          e.target.tagName === 'CANVAS' || 
          (e.target.className && typeof e.target.className === 'string' && 
           (e.target.className.includes('canvas') || e.target.className.includes('fabric')))
        )) {
          return;
        }
        
        console.log("Canvas wrapper click detected for text tool");
        
        // Calculate position relative to canvas
        const canvasEl = fabricCanvas.current.upperCanvasEl;
        if (!canvasEl) {
          return;
        }
        
        const rect = canvasEl.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Only proceed if we have valid coordinates
        if (isNaN(x) || isNaN(y)) {
          console.error("Invalid coordinates in wrapper click:", x, y);
          return;
        }
        
        // Create synthetic fabric event
        const fabricEvent = {
          e: e,
          target: null,
          pointer: { x, y },
          clientX: e.clientX,
          clientY: e.clientY
        };
        
        // Call the canvas click handler
        console.log("Forwarding text click to handleCanvasClick:", x, y);
        handleCanvasClick(fabricEvent);
      } catch (error) {
        console.error("Error in canvasWrapper click handler:", error);
      }
    };
    
    // Add the click handler - use capture phase to get it early
    canvasWrapperRef.current.addEventListener('click', handleCanvasWrapperClick, true);
    
    // Clean up function
    return () => {
      if (canvasWrapperRef.current) {
        canvasWrapperRef.current.removeEventListener('click', handleCanvasWrapperClick, true);
      }
    };
  }, [activeToolMode, fabricCanvas.current]);

  // Function to examine DOM structure and find the text editing element more reliably
  const findAndFocusTextareaElement = (newText, fabricCanvasObj) => {
    console.log("Finding and focusing text editing element");
    
    // Wait a moment for the DOM to update
    setTimeout(() => {
      try {
        // Log the entire document structure related to the canvas
        console.log("Fabric canvas element:", fabricCanvasObj?.lowerCanvasEl?.parentNode);
        
        // Try to directly access the canvas wrappers in the DOM
        const canvasWrappers = document.querySelectorAll('.canvas-container, .pdf-editor-canvas-container');
        console.log(`Found ${canvasWrappers.length} canvas containers:`, 
                   Array.from(canvasWrappers).map(w => ({
                     className: w.className,
                     children: w.children.length
                   }))
                  );
        
        // Try to find textareas directly
        const allTextareas = document.querySelectorAll('textarea');
        console.log(`Found ${allTextareas.length} textareas:`, 
                   Array.from(allTextareas).map(t => ({
                     classes: t.className,
                     id: t.id,
                     parent: t.parentNode?.className || 'unknown'
                   }))
                  );
        
        // First try: get the textarea from Fabric.js directly
        if (newText && (newText.hiddenTextarea || newText._hiddenTextarea)) {
          console.log("Found textarea directly on Fabric.js IText object");
          const textarea = newText.hiddenTextarea || newText._hiddenTextarea;
          textarea.focus();
          return true;
        }
        
        // Second try: locate any textarea and focus it
        if (allTextareas.length > 0) {
          console.log("Focusing the first available textarea");
          allTextareas[0].focus();
          return true;
        }
        
        // Last resort: if newText has the enterEditing method, try calling it again
        if (newText && typeof newText.enterEditing === 'function') {
          console.log("Trying to re-enter editing mode");
          newText.enterEditing();
          if (fabricCanvasObj) {
            fabricCanvasObj.renderAll();
          }
          
          // One last attempt - create a hidden textarea ourselves
          if (!newText.hiddenTextarea && !newText._hiddenTextarea) {
            try {
              console.log("Creating a new hidden textarea as last resort");
              // Create a hidden textarea
              const textarea = document.createElement('textarea');
              textarea.style.position = 'absolute';
              textarea.style.opacity = '0';
              textarea.style.width = '0px';
              textarea.style.height = '0px';
              textarea.className = 'fabric-text-editing-fallback';
              
              // Add to the document
              document.body.appendChild(textarea);
              
              // Attach to text object
              newText._hiddenTextarea = textarea;
              
              // Focus it
              textarea.focus();
              
              // Setup auto cleanup
              setTimeout(() => {
                if (document.body.contains(textarea) && 
                    (!newText.isEditing || !fabricCanvasObj.contains(newText))) {
                  document.body.removeChild(textarea);
                }
              }, 5000); // Clean up after 5 seconds if not used
              
              console.log("Created fallback textarea");
              return true;
            } catch (createError) {
              console.error("Error creating fallback textarea:", createError);
            }
          }
          
          return true;
        }
        
        // Try to find textarea in our custom canvas container
        if (canvasWrappers.length > 0) {
          // Try to find a textarea within any of our canvas wrappers
          for (const wrapper of canvasWrappers) {
            const textareaInWrapper = wrapper.querySelector('textarea');
            if (textareaInWrapper) {
              console.log("Found textarea in canvas wrapper:", wrapper.className);
              textareaInWrapper.focus();
              return true;
            }
          }
        }
        
        return false;
      } catch (error) {
        console.error("Error in findAndFocusTextareaElement:", error);
        return false;
      }
    }, 100); // Slightly longer timeout
  };

  // Helper function to enhance text objects with better editing properties
  const enhanceTextObject = (textObj) => {
    if (!textObj) return;
    
    try {
      // Set basic properties
      textObj.selectable = true;
      textObj.editable = true;
      textObj.hasControls = true;
      textObj.hasBorders = true;
      
      // Set editing appearance
      textObj.editingBorderColor = '#00AEFF';
      textObj.cursorWidth = 2;
      textObj.cursorColor = '#000000';
      textObj.cursorDuration = 600;
      
      // Initialize dimensions if needed
      if (typeof textObj.initDimensions === 'function') {
        textObj.initDimensions();
      }
      
      console.log("Text object enhanced with better editing properties");
    } catch (error) {
      console.error("Error enhancing text object:", error);
    }
  };

  // Add a dedicated effect for text tool keyboard events
  useEffect(() => {
    // Only add keyboard handler when text tool is active
    if (activeToolMode !== 'text') {
      return;
    }
    
    console.log("Setting up dedicated text tool keyboard handler");
    
    // Handler for keyboard events
    const handleKeyDown = (e) => {
      try {
        // Only handle if a text object is being edited
        const activeObject = fabricCanvas.current?.getActiveObject();
        if (activeObject && activeObject.type === 'i-text' && activeObject.isEditing) {
          console.log("Text object is in editing mode, keyboard event handled normally");
          return; // Let Fabric.js handle the event
        }
        
        // If no text is being edited but we're in text mode and a printable key was pressed,
        // create a new text object at the center of the canvas
        if (fabricCanvas.current && 
            e.key.length === 1 && // Printable character
            !e.ctrlKey && !e.altKey && !e.metaKey) {
          
          console.log("Creating new text from keyboard input:", e.key);
          
          // Calculate center position
          const canvasWidth = fabricCanvas.current.width;
          const canvasHeight = fabricCanvas.current.height;
          const centerX = canvasWidth / 2;
          const centerY = canvasHeight / 2;
          
          // Create a new IText with the pressed key
          const newText = new fabric.IText(e.key, {
            left: centerX,
            top: centerY,
            fontFamily: textOptions.font || 'Helvetica',
            fontSize: textOptions.size || 18,
            fill: textOptions.color || '#000000',
            backgroundColor: textOptions.backgroundColor,
            fontWeight: textOptions.fontWeight || 'normal',
            fontStyle: textOptions.fontStyle || 'normal',
        padding: 5,
        cornerSize: 8,
        transparentCorners: false,
        centeredScaling: true,
            editable: true,
            selectable: true,
            hasControls: true,
            hasBorders: true,
            id: `text-${Date.now()}`,
            editingBorderColor: '#00AEFF',  // Highlight color during editing
            cursorWidth: 2,                 // Wider cursor for better visibility
            cursorColor: '#000000',         // Black cursor
            cursorDuration: 600             // Cursor blink rate in ms
          });
          
          // Initialize dimensions to ensure proper rendering
          if (typeof newText.initDimensions === 'function') {
            newText.initDimensions();
          }
          
          // Add to canvas
          fabricCanvas.current.add(newText);
          fabricCanvas.current.setActiveObject(newText);
          
          // Enhance the text object with better editing properties
          enhanceTextObject(newText);
          
          // Enter editing mode
          newText.enterEditing();
      fabricCanvas.current.renderAll();
          console.log("Rendered new text from keyboard input");
          
          // Use our new function to find and focus the textarea
          findAndFocusTextareaElement(newText, fabricCanvas.current);
          
          // Add to undo stack and active layer
      addToUndoStack();
          addObjectToActiveLayer(newText.id);
      
          // Prevent default to avoid double input
          e.preventDefault();
        }
    } catch (error) {
        console.error("Error in text tool keyboard handler:", error);
      }
    };
    
    // Add event listener
    document.addEventListener('keydown', handleKeyDown);
    
    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeToolMode, textOptions]);

  // Handle tool selection
  const handleToolSelect = (toolId) => {
    try {
      console.log(`Selecting tool: ${toolId}`);
      
      // First update the state
      setActiveToolMode(toolId);
      
      // Store the selected tool in session storage for persistence
      try {
        sessionStorage.setItem('pdfEditorActiveTool', toolId);
      } catch (storageError) {
        console.error("Error storing tool selection:", storageError);
      }
      
      // If canvas isn't initialized, just update the state and return
      if (!fabricCanvas.current) {
        console.warn("Fabric canvas not initialized yet, only updating tool state");
        return;
      }
      
      // Disable drawing mode first - this is important to prevent brush issues
      try {
        fabricCanvas.current.isDrawingMode = false;
      } catch (error) {
        console.error("Error disabling drawing mode:", error);
      }
      
      // Turn off erasing mode
      setIsErasing(false);
      
      // Set basic cursor and selection options
      try {
        fabricCanvas.current.selection = true;
        fabricCanvas.current.defaultCursor = 'default';
        fabricCanvas.current.hoverCursor = 'default';
      } catch (error) {
        console.error("Error setting basic canvas options:", error);
      }
      
      // Configure specific tool options
      switch (toolId) {
        case 'cursor':
          // Default cursor mode is already set above
          break;
          
        case 'text':
          // Text mode
          fabricCanvas.current.defaultCursor = 'text';
          fabricCanvas.current.hoverCursor = 'text';
          
          // Configure canvas specifically for text editing
          try {
            // Make sure objects are selectable and clickable
            fabricCanvas.current.selection = true;
            
            // Make sure any existing IText objects are properly configured for editing
            const textObjects = fabricCanvas.current.getObjects('i-text');
            if (textObjects && textObjects.length > 0) {
              textObjects.forEach(textObj => {
                if (textObj) {
                  enhanceTextObject(textObj);
                }
              });
            }
            
            console.log("Text tool mode configured successfully");
            
            // Force a render to update the cursor and object states
            fabricCanvas.current.renderAll();
          } catch (textToolError) {
            console.error("Error configuring text tool:", textToolError);
          }
          break;
          
        case 'draw':
          try {
            // Check if fabric library is available
            if (typeof fabric === 'undefined') {
              console.error("Fabric library is not available");
              setError("Drawing tools are not available");
              return;
            }
            
            // Create a new drawing brush to avoid save() issues
            if (fabric.PencilBrush) {
              // First try to release any existing brush
              if (fabricCanvas.current.freeDrawingBrush) {
                try {
                  // Safely detach the old brush without calling save()
                  fabricCanvas.current.freeDrawingBrush = null;
                } catch (brushError) {
                  console.error("Error clearing old brush:", brushError);
                }
              }
              
              // Create a new brush
              try {
                fabricCanvas.current.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas.current);
                
                // Set brush properties
                fabricCanvas.current.freeDrawingBrush.color = drawingOptions.color || '#000000';
                fabricCanvas.current.freeDrawingBrush.width = drawingOptions.width || 2;
                fabricCanvas.current.freeDrawingBrush.opacity = drawingOptions.opacity || 1.0;
                
                // Enable drawing mode last
                fabricCanvas.current.isDrawingMode = true;
                console.log("Drawing brush created and enabled");
              } catch (newBrushError) {
                console.error("Error creating drawing brush:", newBrushError);
                setError("Could not initialize drawing tool");
              }
            } else {
              console.error("Fabric.js PencilBrush not available");
              setError("Drawing tools are not available");
            }
          } catch (error) {
            console.error("Error setting up drawing tool:", error);
            setError("Could not initialize drawing tool");
          }
        break;
          
        case 'highlight':
          try {
            // Check if fabric library is available
            if (typeof fabric === 'undefined') {
              console.error("Fabric library is not available");
              setError("Highlighting tools are not available");
              return;
            }
            
            // Create a new highlight brush to avoid save() issues
            if (fabric.PencilBrush) {
              // First try to release any existing brush
              if (fabricCanvas.current.freeDrawingBrush) {
                try {
                  // Safely detach the old brush without calling save()
                  fabricCanvas.current.freeDrawingBrush = null;
                } catch (brushError) {
                  console.error("Error clearing old brush:", brushError);
                }
              }
              
              // Create a new brush
              try {
                fabricCanvas.current.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas.current);
                
                // Set brush properties for highlighting
                fabricCanvas.current.freeDrawingBrush.color = highlightColor || '#FFFF00';
                fabricCanvas.current.freeDrawingBrush.width = 20;
                fabricCanvas.current.freeDrawingBrush.opacity = 0.4;
                
                // Enable drawing mode last
                fabricCanvas.current.isDrawingMode = true;
                console.log("Highlight brush created and enabled");
              } catch (newBrushError) {
                console.error("Error creating highlight brush:", newBrushError);
                setError("Could not initialize highlight tool");
              }
            } else {
              console.error("Fabric.js PencilBrush not available");
              setError("Highlighting tools are not available");
            }
          } catch (error) {
            console.error("Error setting up highlight tool:", error);
            setError("Could not initialize highlight tool");
          }
        break;
          
        case 'shape':
          fabricCanvas.current.defaultCursor = 'crosshair';
          fabricCanvas.current.hoverCursor = 'crosshair';
        break;
          
        case 'eraser':
          fabricCanvas.current.defaultCursor = 'crosshair';
          fabricCanvas.current.hoverCursor = 'crosshair';
          setIsErasing(true);
        break;
          
      default:
          // For any other tool, just use default settings
          break;
      }
      
      // Safe rendering with multiple fallbacks - but don't use renderAll that might call save()
      try {
        if (fabricCanvas.current) {
          // Avoid using renderAll() which might call save() internally
          try {
            // First try requestRenderAll which is safer
            if (typeof fabricCanvas.current.requestRenderAll === 'function') {
              fabricCanvas.current.requestRenderAll();
            } else if (typeof fabricCanvas.current.renderAll === 'function') {
              // Fall back to regular renderAll if we must
    fabricCanvas.current.renderAll();
            }
          } catch (renderError) {
            console.error("Error rendering canvas:", renderError);
            // If all render methods fail, try to force a redraw by changing a property
            try {
              const oldCursor = fabricCanvas.current.defaultCursor;
              fabricCanvas.current.defaultCursor = oldCursor;
            } catch (fallbackError) {
              console.error("All render attempts failed:", fallbackError);
            }
          }
        }
      } catch (error) {
        console.error("Error in safe rendering:", error);
      }
      
    } catch (error) {
      console.error("Tool selection error:", error);
      setError(`Tool selection failed: ${error.message || "Unknown error"}`);
      
      // Reset to a safe state
      setActiveToolMode('cursor');
    }
  };

  // Handle zoom in
  const zoomIn = () => {
    if (scale >= 5) return; // Maximum zoom level
    
    const newScale = Math.min(scale + 0.25, 5);
    setScale(newScale);
    scaleRef.current = newScale;
  };

  // Handle zoom out
  const zoomOut = () => {
    if (scale <= 0.5) return; // Minimum zoom level
    
    const newScale = Math.max(scale - 0.25, 0.5);
    setScale(newScale);
    scaleRef.current = newScale;
  };

  // Fit PDF to container width
  const fitToWidth = () => {
    if (!canvasRef.current || !containerRef.current || !pdfPageImages[currentPage - 1]) return;
    
    const containerWidth = containerRef.current.clientWidth - 40; // Add padding
    const pageWidth = pdfPageImages[currentPage - 1].originalWidth;
    
    const newScale = containerWidth / pageWidth;
    setScale(newScale);
    scaleRef.current = newScale;
  };

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  // Handle click on canvas
  const handleCanvasClick = (e) => {
    // First check if the fabric canvas exists
    if (!fabricCanvas.current) {
      console.log("Canvas not initialized yet");
      return;
    }
    
    try {
      // Safe console log of the event to help debug
      console.log("Canvas clicked at", e.pointer ? `(${e.pointer.x}, ${e.pointer.y})` : 
                 (e.e ? `(${e.e.clientX}, ${e.e.clientY})` : "(unknown)"), 
                 "tool:", activeToolMode);
      
      // Check if the event has the necessary data
      if (!e) {
        console.log("Empty event object");
        return;
      }
      
      // Handle the text tool specifically
      if (activeToolMode === 'text') {
        // Get the pointer position using multiple fallback strategies
        let pointerX = null;
        let pointerY = null;
        
        // Method 1: Direct pointer property
        if (e.pointer && typeof e.pointer.x === 'number' && typeof e.pointer.y === 'number') {
          pointerX = e.pointer.x;
          pointerY = e.pointer.y;
          console.log("Using direct pointer property:", pointerX, pointerY);
        } 
        // Method 2: Use fabric's getPointer
        else if (e.e && fabricCanvas.current) {
          try {
            const pointer = fabricCanvas.current.getPointer(e.e);
            if (pointer && typeof pointer.x === 'number' && typeof pointer.y === 'number') {
              pointerX = pointer.x;
              pointerY = pointer.y;
              console.log("Using fabric getPointer:", pointerX, pointerY);
            }
          } catch (pointerError) {
            console.error("Error using fabric's getPointer:", pointerError);
          }
        }
        
        // Method 3: Calculate from client coordinates
        if ((pointerX === null || pointerY === null || isNaN(pointerX) || isNaN(pointerY)) && e.e) {
          try {
            const canvasEl = fabricCanvas.current.upperCanvasEl;
            if (canvasEl) {
              const rect = canvasEl.getBoundingClientRect();
              if (e.e.clientX && e.e.clientY) {
                pointerX = e.e.clientX - rect.left;
                pointerY = e.e.clientY - rect.top;
                console.log("Using client coordinates:", pointerX, pointerY);
              }
            }
          } catch (clientCoordError) {
            console.error("Error calculating from client coordinates:", clientCoordError);
          }
        }
        
        // Method 4: Last resort - try direct clientX/Y properties
        if ((pointerX === null || pointerY === null || isNaN(pointerX) || isNaN(pointerY)) && e.clientX && e.clientY) {
          try {
            const canvasEl = fabricCanvas.current.upperCanvasEl;
            if (canvasEl) {
              const rect = canvasEl.getBoundingClientRect();
              pointerX = e.clientX - rect.left;
              pointerY = e.clientY - rect.top;
              console.log("Using direct clientX/Y:", pointerX, pointerY);
            }
          } catch (directClientError) {
            console.error("Error using direct clientX/Y:", directClientError);
          }
        }
        
        // If all methods failed, use sensible defaults in the middle of the canvas
        if (pointerX === null || pointerY === null || isNaN(pointerX) || isNaN(pointerY)) {
          console.error("All coordinate calculation methods failed, using default position");
          if (fabricCanvas.current) {
            pointerX = fabricCanvas.current.width / 2;
            pointerY = fabricCanvas.current.height / 2;
          } else {
            // Fallback to arbitrary values if all else fails
            pointerX = 100;
            pointerY = 100;
          }
        }
        
        // Final verification that we have usable coordinates
        if (isNaN(pointerX) || isNaN(pointerY)) {
          console.error("Still got NaN coordinates after all fallbacks, cannot create text");
          return;
        }
        
        // Check if we're clicking on an existing object
        let isClickOnObject = false;
        try {
          // Try to find a target at the click position
          if (e.target || (fabricCanvas.current.findTarget && fabricCanvas.current.findTarget(e))) {
            isClickOnObject = true;
          }
        } catch (targetError) {
          console.error("Error finding target:", targetError);
          // Continue with text creation
        }
        
        // Only create new text if we're not clicking on an existing object
        if (!isClickOnObject) {
          console.log("Creating new text at", pointerX, pointerY);
          
          // Create a new text object with default text
          const defaultText = 'Click to edit text';
          
          try {
            // Create a new text object with default text
            const newText = new fabric.IText(defaultText, {
              left: pointerX,
              top: pointerY,
              fontFamily: textOptions.font || 'Helvetica',
              fontSize: textOptions.size || 16,
              fill: textOptions.color || '#000000',
              backgroundColor: textOptions.backgroundColor,
              fontWeight: textOptions.fontWeight || 'normal',
              fontStyle: textOptions.fontStyle || 'normal',
              padding: 5,
              cornerSize: 8,
              transparentCorners: false,
              centeredScaling: true,
              lockUniScaling: false,
              editable: true,  // Explicitly make it editable
              selectable: true, // Ensure it's selectable
              hasControls: true, // Give it resize controls
              hasBorders: true, // Show borders when selected
              editingBorderColor: '#00AEFF', // Highlight color when editing
              cursorWidth: 2, // Make cursor more visible
              cursorColor: '#000000', // Black cursor
              cursorDuration: 600, // Blink rate in ms
              fontSize: textOptions.size || 18, // Slightly larger default size for better visibility
              id: `text-${Date.now()}`
            });
            
            // Ensure it's properly set up for editing
            if (typeof newText.initDimensions === 'function') {
              newText.initDimensions();
            }
            
            // Add to canvas
            fabricCanvas.current.add(newText);
            fabricCanvas.current.setActiveObject(newText);
            
            // Enhance the text object with better editing properties
            enhanceTextObject(newText);
            
            // Render immediately to show the text
            try {
    fabricCanvas.current.renderAll();
              console.log("Initial render completed, text object added to canvas");
            } catch (renderError) {
              console.error("Error rendering after adding text:", renderError);
              // Try alternative render methods
              try {
                fabricCanvas.current.requestRenderAll();
              } catch (altRenderError) {
                console.error("Alternative render also failed:", altRenderError);
              }
            }
            
            // Make sure the text object is properly configured for editing
            newText.isEditing = false; // Reset edit state to allow clean enterEditing
            
            // Enter editing mode after a longer delay (allows the UI to update fully)
            console.log("Scheduling text edit mode activation in 300ms");
            setTimeout(() => {
              try {
                if (newText && fabricCanvas.current) {
                  console.log("Activating text edit mode now");
                  
                  // Make sure this text object is the active object
                  fabricCanvas.current.setActiveObject(newText);
                  
                  // Enter editing mode
                  newText.enterEditing();
                  
                  // Select all text for easy replacement
                  newText.selectAll();
                  
                  // Use our improved function to find and focus the textarea
                  findAndFocusTextareaElement(newText, fabricCanvas.current);
                  
                  // Show the text editor popup
                  showTextEditor(newText, { x: pointerX, y: pointerY });
                  
                  // Try to render again after entering edit mode
                  try {
                    fabricCanvas.current.renderAll();
                    console.log("Text editing mode activated successfully");
                  } catch (editRenderError) {
                    console.error("Error rendering in edit mode:", editRenderError);
                  }
                } else {
                  console.error("Text object or canvas no longer available for editing");
                }
              } catch (editError) {
                console.error("Error entering text edit mode:", editError);
              }
            }, 300); // Increased timeout for better reliability
            
            // Add a second attempt as backup in case the first one fails
            setTimeout(() => {
              try {
                if (newText && fabricCanvas.current && !newText.isEditing) {
                  console.log("Trying text edit mode activation again (backup)");
                  fabricCanvas.current.setActiveObject(newText);
                  newText.enterEditing();
                  fabricCanvas.current.renderAll();
                }
              } catch (retryError) {
                console.error("Error in retry edit activation:", retryError);
              }
            }, 600); // Even longer timeout for the backup attempt
    
    // Add to undo stack
    addToUndoStack();
            
            // Add object to active layer
            addObjectToActiveLayer(newText.id);
            
            return; // Exit after adding text
          } catch (textCreationError) {
            console.error("Error creating text object:", textCreationError);
          }
        }
      }
      
      // Handle other tools (if text tool handler didn't already return)
      // Regular pointer behavior for other tools...
      let pointer;
      try {
        pointer = fabricCanvas.current.getPointer(e);
      } catch (pointerError) {
        console.error("Error getting pointer position:", pointerError);
        
        // Fallback: calculate position manually
        const canvasEl = fabricCanvas.current.upperCanvasEl;
        if (!canvasEl) {
          console.error("Canvas element not available");
          return;
        }
        
        const rect = canvasEl.getBoundingClientRect();
        pointer = {
          x: e.e.clientX - rect.left,
          y: e.e.clientY - rect.top
        };
      }
      
      // If we still don't have a valid pointer, exit
      if (!pointer || typeof pointer.x !== 'number' || typeof pointer.y !== 'number') {
        console.error("Could not determine pointer position");
        return;
      }
      
      // Check if we already have a selected object
      let isClickOnObject = false;
      try {
        // Only run findTarget if we're not already in drawing shape mode
        if (!isDrawingShape) {
          const target = fabricCanvas.current.findTarget(e);
          isClickOnObject = !!target;
        }
      } catch (targetError) {
        console.error("Error finding target:", targetError);
        isClickOnObject = false;
      }
      
      // Handle remaining tools
      switch (activeToolMode) {
        case 'shape':
          // Handled by separate shape drawing functions
          break;
          
        case 'stamp':
          // Add a stamp at the clicked location
          addStampAt(pointer.x, pointer.y, 'approved');
          break;
          
        case 'signature':
          // Add a signature placeholder at the clicked location
          addSignatureAt(pointer.x, pointer.y);
          break;
          
        default:
          break;
      }
    } catch (error) {
      console.error("Error handling canvas click:", error);
    }
  };
  
  // Helper function to add a stamp at a specific location
  const addStampAt = (x, y, stampType = 'approved') => {
    if (!fabricCanvas.current) return;
    
    try {
      // Define stamp properties based on type
      let stampProps = {
        text: 'STAMP',
        fontFamily: 'Arial',
        fontSize: 40,
        fill: '#FF0000',
        originX: 'center',
        originY: 'center',
        left: x,
        top: y,
        angle: -30,
        opacity: 0.7,
        id: `stamp-${Date.now()}`
      };
      
      // Customize based on stamp type
      switch (stampType) {
        case 'approved':
          stampProps.text = 'APPROVED';
          stampProps.fill = '#008800';
          break;
        case 'draft':
          stampProps.text = 'DRAFT';
          stampProps.fill = '#0000FF';
          break;
        case 'confidential':
          stampProps.text = 'CONFIDENTIAL';
          stampProps.fill = '#FF0000';
          stampProps.fontSize = 30;
          break;
        default:
          stampProps.text = stampType.toUpperCase();
      }
      
      // Create the stamp as IText for easy editing
      const stamp = new fabric.IText(stampProps.text, stampProps);
      
      // Add to canvas
      fabricCanvas.current.add(stamp);
      fabricCanvas.current.setActiveObject(stamp);
      fabricCanvas.current.renderAll();
      
      // Add to undo stack
      addToUndoStack();
      
      // Add object to active layer
      addObjectToActiveLayer(stamp.id);
    } catch (error) {
      console.error("Error adding stamp:", error);
    }
  };
  
  // Helper function to add a signature at a specific location
  const addSignatureAt = (x, y) => {
    if (!fabricCanvas.current) return;
    
    try {
      // Create a signature placeholder
      const signature = new fabric.IText('Your Signature', {
        left: x,
        top: y,
        fontFamily: 'Brush Script MT',
        fontSize: 30,
        fill: '#000099',
        originX: 'center',
        originY: 'center',
        angle: 0,
        opacity: 0.9,
        id: `signature-${Date.now()}`
      });
      
      // Add to canvas
      fabricCanvas.current.add(signature);
      fabricCanvas.current.setActiveObject(signature);
      fabricCanvas.current.renderAll();
      
      // Add to undo stack
      addToUndoStack();
      
      // Add object to active layer
      addObjectToActiveLayer(signature.id);
    } catch (error) {
      console.error("Error adding signature:", error);
    }
  };

  // Add object to active layer
  const addObjectToActiveLayer = (objectId) => {
    if (activeLayerIndex < 0 || activeLayerIndex >= layers.length) return;
    
        setLayers(prev => {
          const newLayers = [...prev];
      if (!newLayers[activeLayerIndex].objects) {
        newLayers[activeLayerIndex].objects = [];
          }
      
      newLayers[activeLayerIndex].objects.push(objectId);
          return newLayers;
        });
  };

  // Handle object modified
  const handleObjectModified = (e) => {
    addToUndoStack();
  };
  
  // Handle path created (when drawing)
  const handlePathCreated = (e) => {
    // Add unique ID to the path
    const pathId = `path-${Date.now()}`;
    e.path.set('id', pathId);
    
    // Add to undo stack
    addToUndoStack();
    
    // Add object to active layer
    addObjectToActiveLayer(pathId);
  };
  
  // Add to undo stack
  const addToUndoStack = () => {
    if (!fabricCanvas.current) return;
    
    try {
      // Get the current canvas state
      const canvasJson = fabricCanvas.current.toJSON(['id']);
      
      // Add to undo stack
      setUndoStack(prev => [...prev, canvasJson]);
      
      // Clear redo stack when a new change is made
      setRedoStack([]);
    } catch (error) {
      console.error("Error adding to undo stack:", error);
    }
  };
  
  // Handle undo
  const handleUndo = () => {
    if (undoStack.length === 0 || !fabricCanvas.current) return;
    
    try {
      // Get the current canvas state for redo
      const currentState = fabricCanvas.current.toJSON(['id']);
      
      // Add current state to redo stack
      setRedoStack(prev => [...prev, currentState]);
      
      // Get the last state from undo stack
      const newStack = [...undoStack];
      const lastState = newStack.pop();
      setUndoStack(newStack);
      
      // Load the state
      if (lastState) {
        fabricCanvas.current.loadFromJSON(lastState, () => {
        fabricCanvas.current.renderAll();
      });
      }
    } catch (error) {
      console.error("Error during undo:", error);
    }
  };
  
  // Handle redo
  const handleRedo = () => {
    if (redoStack.length === 0 || !fabricCanvas.current) return;
    
    try {
      // Get the current canvas state for undo
      const currentState = fabricCanvas.current.toJSON(['id']);
      
      // Add current state to undo stack
      setUndoStack(prev => [...prev, currentState]);
      
      // Get the last state from redo stack
      const newStack = [...redoStack];
      const nextState = newStack.pop();
      setRedoStack(newStack);
      
      // Load the state
      if (nextState) {
      fabricCanvas.current.loadFromJSON(nextState, () => {
        fabricCanvas.current.renderAll();
      });
      }
    } catch (error) {
      console.error("Error during redo:", error);
    }
  };
  
  // Add shape to canvas
  const addShape = (shapeType) => {
    if (!fabricCanvas.current) return;
    
    // Set drawing mode and shape type
    setIsDrawingShape(true);
    setCurrentShapeType(shapeType);
    
    // Change cursor and disable selection during drawing
    fabricCanvas.current.defaultCursor = 'crosshair';
    fabricCanvas.current.selection = false;
    
    // Make objects non-selectable during drawing
    fabricCanvas.current.forEachObject(obj => {
      obj.selectable = false;
      obj.evented = false;
    });
    
    // Set up mouse event handlers for drawing
    fabricCanvas.current.on('mouse:down', startDrawingShape);
    fabricCanvas.current.on('mouse:move', drawingShapeUpdate);
    fabricCanvas.current.on('mouse:up', finishDrawingShape);
  };

  // Start drawing a shape
  const startDrawingShape = (e) => {
    if (!isDrawingShape || !fabricCanvas.current) return;
    
    const pointer = fabricCanvas.current.getPointer(e.e);
    setDrawStartPoint({ x: pointer.x, y: pointer.y });
    
    let shape;
    switch (currentShapeType) {
      case 'rect':
      case 'square':
        shape = new fabric.Rect({
          left: pointer.x,
          top: pointer.y,
          width: 0,
          height: 0,
          fill: drawingOptions.fillEnabled ? drawingOptions.fill : 'transparent',
          stroke: drawingOptions.color,
          strokeWidth: drawingOptions.width,
          opacity: drawingOptions.opacity,
          id: `shape-${Date.now()}`
        });
        break;
      case 'circle':
      case 'ellipse':
        shape = new fabric.Ellipse({
          left: pointer.x,
          top: pointer.y,
          rx: 0,
          ry: 0,
          fill: drawingOptions.fillEnabled ? drawingOptions.fill : 'transparent',
          stroke: drawingOptions.color,
          strokeWidth: drawingOptions.width,
          opacity: drawingOptions.opacity,
          id: `shape-${Date.now()}`
        });
        break;
      case 'triangle':
        shape = new fabric.Triangle({
          left: pointer.x,
          top: pointer.y,
          width: 0,
          height: 0,
          fill: drawingOptions.fillEnabled ? drawingOptions.fill : 'transparent',
          stroke: drawingOptions.color,
          strokeWidth: drawingOptions.width,
          opacity: drawingOptions.opacity,
          id: `shape-${Date.now()}`
        });
        break;
      case 'line':
        shape = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
          stroke: drawingOptions.color,
          strokeWidth: drawingOptions.width,
          opacity: drawingOptions.opacity,
          id: `shape-${Date.now()}`
        });
        break;
      default:
        return;
      }
    
    if (shape) {
      fabricCanvas.current.add(shape);
      setTempShapeObj(shape);
    }
  };

  // Update shape while drawing
  const drawingShapeUpdate = (e) => {
    if (!isDrawingShape || !tempShapeObj || !fabricCanvas.current) return;
    
    const pointer = fabricCanvas.current.getPointer(e.e);
    const startPoint = drawStartPoint;
    
    let width = Math.abs(pointer.x - startPoint.x);
    let height = Math.abs(pointer.y - startPoint.y);
    
    if (currentShapeType === 'square' || currentShapeType === 'circle') {
      // For square/circle, make width and height equal
      const size = Math.max(width, height);
      width = size;
      height = size;
    }
    
    let left = startPoint.x;
    let top = startPoint.y;
    
    // Adjust position if drawing from right to left or bottom to top
    if (pointer.x < startPoint.x) {
      left = pointer.x;
      if (currentShapeType === 'square' || currentShapeType === 'circle') {
        left = startPoint.x - width;
      }
    }
    
    if (pointer.y < startPoint.y) {
      top = pointer.y;
      if (currentShapeType === 'square' || currentShapeType === 'circle') {
        top = startPoint.y - height;
      }
    }
    
    switch (tempShapeObj.type) {
      case 'rect':
        tempShapeObj.set({
          left: left,
          top: top,
      width: width,
          height: height
        });
        break;
      case 'ellipse':
        tempShapeObj.set({
          left: left,
          top: top,
          rx: width / 2,
          ry: height / 2
        });
        break;
      case 'triangle':
        tempShapeObj.set({
          left: left,
          top: top,
          width: width,
          height: height
        });
        break;
      case 'line':
        tempShapeObj.set({
          x2: pointer.x,
          y2: pointer.y
        });
        break;
    }
    
    fabricCanvas.current.renderAll();
  };

  // Finish drawing a shape
  const finishDrawingShape = (e) => {
    if (!isDrawingShape || !fabricCanvas.current) return;
    
    // Remove event listeners
    fabricCanvas.current.off('mouse:down', startDrawingShape);
    fabricCanvas.current.off('mouse:move', drawingShapeUpdate);
    fabricCanvas.current.off('mouse:up', finishDrawingShape);
    
    // Reset drawing state
    setIsDrawingShape(false);
    
    // Restore cursor and selection
    fabricCanvas.current.defaultCursor = 'default';
    fabricCanvas.current.selection = true;
    
    // Make objects selectable again
    fabricCanvas.current.forEachObject(obj => {
      if (!layers.some(layer => layer.locked && layer.objects.includes(obj.id))) {
        obj.selectable = true;
        obj.evented = true;
      }
    });
    
    if (tempShapeObj) {
      // Finalize the shape
      fabricCanvas.current.setActiveObject(tempShapeObj);
      
      // Add to undo stack
    addToUndoStack();
      
      // Add object to active layer
      addObjectToActiveLayer(tempShapeObj.id);
      
      // Reset the temporary object reference
      setTempShapeObj(null);
    }
    
    fabricCanvas.current.renderAll();
  };

  // Apply current drawing styles to selected object
  const applyStylesToSelected = () => {
    if (!fabricCanvas.current) return;
    
    const activeObject = fabricCanvas.current.getActiveObject();
    if (!activeObject) return;
    
    try {
      // Apply styles based on object type
      if (activeObject.type === 'path') {
        // For freehand drawing paths
        activeObject.set({
          stroke: drawingOptions.color,
          strokeWidth: drawingOptions.width,
          opacity: drawingOptions.opacity
        });
      } else {
        // For shapes and other objects
        activeObject.set({
          stroke: drawingOptions.color,
          strokeWidth: drawingOptions.width,
          opacity: drawingOptions.opacity
        });
        
        // Apply fill if enabled
        if (drawingOptions.fillEnabled) {
          activeObject.set({
            fill: drawingOptions.fill
          });
        }
      }
      
      fabricCanvas.current.renderAll();
      addToUndoStack();
      } catch (error) {
      console.error("Error applying styles:", error);
    }
  };

  // Define tool options
  const toolOptions = [
    { id: 'cursor', icon: <FaArrowsAlt /> },
    { id: 'text', icon: <FaFont /> },
    { id: 'draw', icon: <FaPenNib /> },
    { id: 'shape', icon: <FaDrawPolygon /> },
    { id: 'image', icon: <FaImage /> },
    { id: 'highlight', icon: <FaHighlighter /> },
    { id: 'stamp', icon: <FaStamp /> },
    { id: 'eraser', icon: <FaEraser /> },
    { id: 'comment', icon: <FaRegComment /> },
    { id: 'signature', icon: <FaSignature /> }
  ];

  // Handle shape button click - this is the handler for the shape buttons in the toolbar
  const handleShapeButtonClick = (shapeType) => {
    // First switch to shape tool if not already in shape mode
    if (activeToolMode !== 'shape') {
      handleToolSelect('shape');
    }
    
    // Wait a short time to ensure the tool selection has taken effect
    setTimeout(() => {
      if (fabricCanvas.current) {
        try {
          // Call the addShape function to start drawing the selected shape
          addShape(shapeType);
        } catch (error) {
          console.error(`Error starting shape drawing for ${shapeType}:`, error);
          
          // Show error to user
          setError(`Could not start drawing shape: ${error.message}`);
        }
      } else {
        console.error("Fabric canvas not initialized - cannot add shape");
        setError("Canvas not ready. Please try again after the PDF loads completely.");
      }
    }, 50);
  };

  // Add a document-level click handler as a last resort for text editing
  useEffect(() => {
    if (activeToolMode !== 'text' || !fabricCanvas.current) {
      return;
    }

    console.log("Adding document-level click handler for text tool");
    
    const handleDocumentClick = (e) => {
      // Skip if the click is inside a fabric canvas element
      if (e.target && (
        e.target.tagName === 'CANVAS' || 
        (e.target.className && 
         typeof e.target.className === 'string' && 
         e.target.className.includes('fabric'))
      )) {
        return;
      }
      
      // Skip if the click is in the toolbar or sidebar
      if (e.target.closest('.toolbar') || e.target.closest('.sidebar')) {
        return;
      }
      
      // Get the canvas position
      const canvasElement = fabricCanvas.current.upperCanvasEl;
      const rect = canvasElement.getBoundingClientRect();
      
      // Check if click is inside the canvas area
      if (e.clientX >= rect.left && e.clientX <= rect.right &&
          e.clientY >= rect.top && e.clientY <= rect.bottom) {
        
        console.log("Document click in canvas area - creating text");
        
        // Calculate position relative to canvas
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        try {
          // Create text with default text
          const newText = new fabric.IText('Type something', {
            left: x,
            top: y,
            fontFamily: textOptions.font || 'Helvetica',
            fontSize: textOptions.size || 18,
            fill: textOptions.color || '#000000',
            backgroundColor: textOptions.backgroundColor,
            fontWeight: textOptions.fontWeight || 'normal',
            fontStyle: textOptions.fontStyle || 'normal',
            editingBorderColor: '#00AEFF',
            cursorWidth: 2,
            cursorColor: '#000000',
            cursorDuration: 600,
            padding: 5,
            cornerSize: 8,
            transparentCorners: false,
            centeredScaling: true,
            editable: true,
            selectable: true,
            hasControls: true,
            hasBorders: true,
            id: `text-${Date.now()}`
          });
          
          // Add to canvas
          fabricCanvas.current.add(newText);
          fabricCanvas.current.setActiveObject(newText);
          
          // Enhance it
          enhanceTextObject(newText);
          
          // Enter edit mode
          newText.enterEditing();
          fabricCanvas.current.renderAll();
          
          // Focus text area
          findAndFocusTextareaElement(newText, fabricCanvas.current);
          
          // Add to undo stack and layer
          addToUndoStack();
          addObjectToActiveLayer(newText.id);
          
          // Prevent default to avoid double handling
          e.preventDefault();
        } catch (error) {
          console.error("Error creating text from document click:", error);
        }
      }
    };
    
    // Add listener with capture phase to get it early
    document.addEventListener('click', handleDocumentClick, true);
    
    // Cleanup
    return () => {
      document.removeEventListener('click', handleDocumentClick, true);
    };
  }, [activeToolMode, fabricCanvas.current, textOptions]);

  // Detect clicks on canvas objects for text editing
  useEffect(() => {
    if (!fabricCanvas.current) return;
    
    const handleObjectSelected = (e) => {
      try {
        if (!e.selected || !e.selected[0]) return;
        
        const selectedObj = e.selected[0];
        
        // Only handle text objects
        if (selectedObj.type === 'i-text' || selectedObj.type === 'textbox') {
          console.log("Text object selected:", selectedObj.id);
          
          // Update text options to match the selected object
          setTextOptions({
            font: selectedObj.fontFamily || 'Helvetica',
            size: selectedObj.fontSize || 16,
            color: selectedObj.fill || '#000000',
            backgroundColor: selectedObj.backgroundColor || 'transparent',
            fontWeight: selectedObj.fontWeight || 'normal',
            fontStyle: selectedObj.fontStyle || 'normal'
          });
          
          // If we're in text mode, show the editor
          if (activeToolMode === 'text') {
            showTextEditor(selectedObj);
          }
        }
      } catch (error) {
        console.error("Error handling object selection:", error);
      }
    };
    
    // Add the object selection listener
    fabricCanvas.current.on('selection:created', handleObjectSelected);
    fabricCanvas.current.on('selection:updated', handleObjectSelected);
    
    // Cleanup
    return () => {
      if (fabricCanvas.current) {
        fabricCanvas.current.off('selection:created', handleObjectSelected);
        fabricCanvas.current.off('selection:updated', handleObjectSelected);
      }
    };
  }, [activeToolMode, fabricCanvas.current]);

  // Wrap the return JSX with the ErrorBoundary
  return (
    <ErrorBoundary>
      <div className={styles.container}>
        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.toolbarContent}>
            {/* File operations */}
            <div className={styles.toolGroup}>
              <button
                onClick={() => fileInputRef.current.click()}
                className={styles.button}
              >
                <FaUpload className="mr-2" />
                Open PDF
              </button>
              <button
                onClick={savePDF}
                disabled={!pdfDoc}
                className={styles.button}
              >
                <FaSave className="mr-2" />
                Save
              </button>
            </div>
            
            {/* Tool selection */}
            <div className={styles.toolGroup}>
              {toolOptions.map(tool => (
                <button
                  key={tool.id}
                  onClick={() => handleToolSelect(tool.id)}
                  className={`${styles.toolButton} ${activeToolMode === tool.id ? styles.active : ''}`}
                  title={tool.id}
                >
                  {tool.icon}
                </button>
              ))}
            </div>
            
            {/* Undo/Redo */}
            <div className={styles.toolGroup}>
              <button
                onClick={handleUndo}
                disabled={undoStack.length === 0}
                className={styles.toolButton}
                title="Undo"
              >
                <FaUndo />
              </button>
              <button
                onClick={handleRedo}
                disabled={redoStack.length === 0}
                className={styles.toolButton}
                title="Redo"
              >
                <FaRedo />
              </button>
            </div>
            
            {/* Page navigation */}
            <div className={styles.toolGroup}>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1 || isLoading}
                className={styles.button}
              >
                Previous
              </button>
              <span className={styles.pageInfo}>
                Page {currentPage} of {pageCount}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= pageCount || isLoading}
                className={styles.button}
              >
                Next
              </button>
            </div>
            
            {/* Zoom controls */}
            <div className={styles.toolGroup}>
              <button
                onClick={zoomOut}
                className={styles.toolButton}
                title="Zoom Out"
                disabled={scale <= 0.5}
              >
                -
              </button>
              <span className="text-white">{Math.round(scale * 100)}%</span>
              <button
                onClick={zoomIn}
                className={styles.toolButton}
                title="Zoom In"
                disabled={scale >= 5}
              >
                +
              </button>
              <button
                onClick={fitToWidth}
                className={styles.toolButton}
                title="Fit to Width"
              >
                ↔
              </button>
              
              {/* Add sidebar toggle button */}
              <button
                onClick={toggleSidebar}
                className={styles.toolButton}
                title={sidebarVisible ? "Hide Sidebar" : "Show Sidebar"}
              >
                {sidebarVisible ? "◀" : "▶"}
              </button>
            </div>
          </div>
        </div>
        
        {/* Main editor area */}
        <div className={styles.mainContent}>
          {/* Tools sidebar - make it collapsible */}
          <div className={`${styles.sidebar} ${sidebarVisible ? styles.sidebarVisible : styles.sidebarHidden}`}>
            {/* Tool-specific options */}
            {activeToolMode === 'text' && (
              <div className={styles.sidebarSection}>
                <h3 className={styles.sidebarTitle}>Text Options</h3>
                <div className={styles.controlGroup}>
                  <label htmlFor="font-family" className={styles.label}>Font</label>
                  <select
                    id="font-family"
                    value={textOptions.font}
                    onChange={(e) => {
                      setTextOptions({...textOptions, font: e.target.value});
                      
                      // Update selected text object if any
                      if (fabricCanvas.current && fabricCanvas.current.getActiveObject() && 
                          fabricCanvas.current.getActiveObject().type === 'i-text') {
                        fabricCanvas.current.getActiveObject().set('fontFamily', e.target.value);
                        fabricCanvas.current.renderAll();
                      }
                    }}
                    className={styles.select}
                  >
                    {availableFonts.map(font => (
                      <option key={font.value} value={font.value}>{font.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className={styles.controlGroup}>
                  <label htmlFor="font-size" className={styles.label}>Size</label>
                  <input
                    id="font-size"
                    type="number"
                    value={textOptions.size}
                    onChange={(e) => {
                      const newSize = parseInt(e.target.value);
                      setTextOptions({...textOptions, size: newSize});
                      
                      // Update selected text object if any
                      if (fabricCanvas.current && fabricCanvas.current.getActiveObject() && 
                          fabricCanvas.current.getActiveObject().type === 'i-text') {
                        fabricCanvas.current.getActiveObject().set('fontSize', newSize);
                        fabricCanvas.current.renderAll();
                      }
                    }}
                    className={styles.input}
                    min="8"
                    max="72"
                  />
                </div>
                
                <div className={styles.controlGroup}>
                  <label htmlFor="text-color" className={styles.label}>Text Color</label>
                  <input
                    id="text-color"
                    type="color"
                    value={textOptions.color}
                    onChange={(e) => {
                      setTextOptions({...textOptions, color: e.target.value});
                      
                      // Update selected text object if any
                      if (fabricCanvas.current && fabricCanvas.current.getActiveObject() && 
                          fabricCanvas.current.getActiveObject().type === 'i-text') {
                        fabricCanvas.current.getActiveObject().set('fill', e.target.value);
                        fabricCanvas.current.renderAll();
                      }
                    }}
                    className={styles.colorInput}
                  />
                </div>
                
                <div className={styles.controlGroup}>
                  <label htmlFor="background-color" className={styles.label}>Background</label>
                  <div className={styles.colorInputWrapper}>
                    <input
                      id="background-color"
                      type="color"
                      value={textOptions.backgroundColor || '#ffffff'}
                      onChange={(e) => {
                        const newColor = e.target.value;
                        setTextOptions({...textOptions, backgroundColor: newColor});
                        
                        // Update selected text object if any
                        if (fabricCanvas.current && fabricCanvas.current.getActiveObject() && 
                            fabricCanvas.current.getActiveObject().type === 'i-text') {
                          fabricCanvas.current.getActiveObject().set('backgroundColor', newColor);
                          fabricCanvas.current.renderAll();
                        }
                      }}
                      className={styles.colorInput}
                    />
                    <button
                      onClick={() => {
                        setTextOptions({...textOptions, backgroundColor: null});
                        
                        // Update selected text object if any
                        if (fabricCanvas.current && fabricCanvas.current.getActiveObject() && 
                            fabricCanvas.current.getActiveObject().type === 'i-text') {
                          fabricCanvas.current.getActiveObject().set('backgroundColor', null);
                          fabricCanvas.current.renderAll();
                        }
                      }}
                      className={styles.smallButton}
                      title="Remove background"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                
                <div className={styles.controlGroup}>
                  <button
                    onClick={() => {
                      if (fabricCanvas.current && fabricCanvas.current.getActiveObject() && 
                          fabricCanvas.current.getActiveObject().type === 'i-text') {
                        // Bold toggle
                        const text = fabricCanvas.current.getActiveObject();
                        const currentWeight = text.get('fontWeight') === 'bold' ? 'normal' : 'bold';
                        text.set('fontWeight', currentWeight);
                        fabricCanvas.current.renderAll();
                      }
                    }}
                    className={styles.button}
                  >
                    Bold
                  </button>
                  
                  <button
                    onClick={() => {
                      if (fabricCanvas.current && fabricCanvas.current.getActiveObject() && 
                          fabricCanvas.current.getActiveObject().type === 'i-text') {
                        // Italic toggle
                        const text = fabricCanvas.current.getActiveObject();
                        const currentStyle = text.get('fontStyle') === 'italic' ? 'normal' : 'italic';
                        text.set('fontStyle', currentStyle);
                        fabricCanvas.current.renderAll();
                      }
                    }}
                    className={styles.button}
                  >
                    Italic
                  </button>
                </div>
              </div>
            )}
            
            {activeToolMode === 'draw' && (
              <div className={styles.sidebarSection}>
                <h3 className={styles.sidebarTitle}>Drawing Options</h3>
                <input
                  type="color"
                  value={drawingOptions.color}
                  onChange={(e) => setDrawingOptions({...drawingOptions, color: e.target.value})}
                  className={styles.input}
                />
                <input
                  type="range"
                  value={drawingOptions.width}
                  onChange={(e) => setDrawingOptions({...drawingOptions, width: parseInt(e.target.value)})}
                  min="1"
                  max="20"
                  className={styles.input}
                />
                <input
                  type="range"
                  value={drawingOptions.opacity}
                  onChange={(e) => setDrawingOptions({...drawingOptions, opacity: parseFloat(e.target.value)})}
                  min="0"
                  max="1"
                  step="0.1"
                  className={styles.input}
                />
              </div>
            )}
            
            {activeToolMode === 'shape' && (
              <div className={styles.sidebarSection}>
                <h3 className={styles.sidebarTitle}>Shapes</h3>
                
                {/* Drawing mode indicator */}
                {isDrawingShape && (
                  <div className={styles.drawingModeIndicator}>
                    <div className={styles.pulsingDot}></div>
                    <span>Drawing Mode: {currentShapeType}</span>
                    <button 
                      className={styles.cancelButton}
                      onClick={() => {
                        setIsDrawingShape(false);
                        if (tempShapeObj && fabricCanvas.current) {
                          fabricCanvas.current.remove(tempShapeObj);
                          fabricCanvas.current.renderAll();
                        }
                        setTempShapeObj(null);
                        
                        // Reset cursor and enable selection
                        if (fabricCanvas.current) {
                          fabricCanvas.current.defaultCursor = 'default';
                          fabricCanvas.current.selection = true;
                          fabricCanvas.current.forEachObject(obj => {
                            if (!layers.some(layer => layer.locked && layer.objects.includes(obj.id))) {
                              obj.selectable = true;
                              obj.evented = true;
                            }
                          });
                        }
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
                
                {!isDrawingShape && (
                  <div className={styles.drawingInstructions}>
                    <p>Select a shape, then click and drag on the PDF to draw it.</p>
                  </div>
                )}
                
                {/* Fill color picker */}
                <div className={styles.colorOptions}>
                  <div className={styles.controlGroup}>
                    <label className={styles.label}>
                      <span className={styles.controlLabel}>Stroke Color</span>
                      <input
                        type="color"
                        value={drawingOptions.color}
                        onChange={(e) => {
                          const newColor = e.target.value;
                          setDrawingOptions({...drawingOptions, color: newColor});
                          // Update selected object if exists
                          if (selectedObject && fabricCanvas.current) {
                            selectedObject.set('stroke', newColor);
                            fabricCanvas.current.renderAll();
                            addToUndoStack();
                          }
                        }}
                        className={styles.colorInput}
                      />
                    </label>
                  </div>
                  
                  <div className={styles.controlGroup}>
                    <label className={styles.label}>
                      <div className={styles.controlLabelWithToggle}>
                        <span>Fill Color</span>
                        <label className={styles.switch}>
                          <input
                            type="checkbox"
                            checked={drawingOptions.fillEnabled}
                            onChange={(e) => {
                              const isEnabled = e.target.checked;
                              const newFill = isEnabled ? drawingOptions.fill : 'transparent';
                              setDrawingOptions({
                                ...drawingOptions,
                                fillEnabled: isEnabled,
                                fill: newFill
                              });
                              // Update selected object if exists
                              if (selectedObject && fabricCanvas.current) {
                                selectedObject.set('fill', newFill);
                                fabricCanvas.current.renderAll();
                                addToUndoStack();
                              }
                            }}
                          />
                          <span className={styles.slider}></span>
                        </label>
                      </div>
                      {drawingOptions.fillEnabled && (
                        <input
                          type="color"
                          value={drawingOptions.fill === 'transparent' ? '#000000' : drawingOptions.fill}
                          onChange={(e) => {
                            const newFill = e.target.value;
                            setDrawingOptions({...drawingOptions, fill: newFill});
                            // Update selected object if exists
                            if (selectedObject && fabricCanvas.current) {
                              selectedObject.set('fill', newFill);
                              fabricCanvas.current.renderAll();
                              addToUndoStack();
                            }
                          }}
                          className={styles.colorInput}
                        />
                      )}
                    </label>
                  </div>
                  
                  <div className={styles.controlGroup}>
                    <label className={styles.label}>
                      <span className={styles.controlLabel}>Stroke Width</span>
                      <input
                        type="range"
                        value={drawingOptions.width}
                        onChange={(e) => setDrawingOptions({...drawingOptions, width: parseInt(e.target.value)})}
                        min="1"
                        max="20"
                        className={styles.rangeInput}
                      />
                      <span className={styles.valueDisplay}>{drawingOptions.width}px</span>
                    </label>
                  </div>
                  
                  <div className={styles.controlGroup}>
                    <label className={styles.label}>
                      <span className={styles.controlLabel}>Opacity</span>
                      <input
                        type="range"
                        value={drawingOptions.opacity}
                        onChange={(e) => setDrawingOptions({...drawingOptions, opacity: parseFloat(e.target.value)})}
                        min="0.1"
                        max="1"
                        step="0.1"
                        className={styles.rangeInput}
                      />
                      <span className={styles.valueDisplay}>{Math.round(drawingOptions.opacity * 100)}%</span>
                    </label>
                  </div>
                </div>
                
                {/* Shape selection icons */}
                <div className={styles.shapeGrid}>
                  <button 
                    onClick={() => handleShapeButtonClick('rect')} 
                    className={`${styles.shapeButton} ${currentShapeType === 'rect' && isDrawingShape ? styles.activeShape : ''}`}
                    title="Rectangle"
                    disabled={isDrawingShape}
                  >
                    <FaRegSquare />
                  </button>
                  <button 
                    onClick={() => handleShapeButtonClick('square')} 
                    className={`${styles.shapeButton} ${currentShapeType === 'square' && isDrawingShape ? styles.activeShape : ''}`}
                    title="Square"
                    disabled={isDrawingShape}
                  >
                    <FaSquare />
                  </button>
                  <button 
                    onClick={() => handleShapeButtonClick('circle')} 
                    className={`${styles.shapeButton} ${currentShapeType === 'circle' && isDrawingShape ? styles.activeShape : ''}`}
                    title="Circle"
                    disabled={isDrawingShape}
                  >
                    <FaRegCircle />
                  </button>
                  <button 
                    onClick={() => handleShapeButtonClick('ellipse')} 
                    className={`${styles.shapeButton} ${currentShapeType === 'ellipse' && isDrawingShape ? styles.activeShape : ''}`}
                    title="Ellipse"
                    disabled={isDrawingShape}
                  >
                    <FaCircle />
                  </button>
                  <button 
                    onClick={() => handleShapeButtonClick('triangle')} 
                    className={`${styles.shapeButton} ${currentShapeType === 'triangle' && isDrawingShape ? styles.activeShape : ''}`}
                    title="Triangle"
                    disabled={isDrawingShape}
                  >
                    <div className={styles.triangleIcon}></div>
                  </button>
                  <button 
                    onClick={() => handleShapeButtonClick('arrow')} 
                    className={`${styles.shapeButton} ${currentShapeType === 'arrow' && isDrawingShape ? styles.activeShape : ''}`}
                    title="Arrow"
                    disabled={isDrawingShape}
                  >
                    <FaLongArrowAltRight />
                  </button>
                  <button 
                    onClick={() => handleShapeButtonClick('line')} 
                    className={`${styles.shapeButton} ${currentShapeType === 'line' && isDrawingShape ? styles.activeShape : ''}`}
                    title="Line"
                    disabled={isDrawingShape}
                  >
                    <div className={styles.lineIcon}></div>
                  </button>
                  <button 
                    onClick={() => handleShapeButtonClick('star')} 
                    className={`${styles.shapeButton} ${currentShapeType === 'star' && isDrawingShape ? styles.activeShape : ''}`}
                    title="Star"
                    disabled={isDrawingShape}
                  >
                    <FaRegStar />
                  </button>
                  <button 
                    onClick={() => handleShapeButtonClick('heart')} 
                    className={`${styles.shapeButton} ${currentShapeType === 'heart' && isDrawingShape ? styles.activeShape : ''}`}
                    title="Heart"
                    disabled={isDrawingShape}
                  >
                    <FaHeart />
                  </button>
                </div>
                
                {/* Apply styles to selected shape */}
                <div className={styles.applyContainer}>
                  <button 
                    onClick={applyStylesToSelected}
                    className={styles.applyButton}
                    disabled={isDrawingShape}
                  >
                    <FaPalette className={styles.buttonIcon} />
                    <span>Apply Style</span>
                  </button>
                  
                  <button 
                    onClick={() => {
                      const activeObject = fabricCanvas.current.getActiveObject();
                      if (activeObject) {
                        // Create a clone of the selected object
                        activeObject.clone((cloned) => {
                          cloned.set({
                            left: activeObject.left + 20,
                            top: activeObject.top + 20
                          });
                          fabricCanvas.current.add(cloned);
                          fabricCanvas.current.setActiveObject(cloned);
                          fabricCanvas.current.renderAll();
                          addToUndoStack();
                        });
                      }
                    }}
                    className={styles.applyButton}
                  >
                    <FaClone className={styles.buttonIcon} />
                    <span>Duplicate</span>
                  </button>
                </div>
              </div>
            )}
            
            {/* Layers Panel */}
            <div className={styles.sidebarSection}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sidebarTitle}>Layers</h3>
                <button
                  onClick={() => setShowLayers(!showLayers)}
                  className={styles.toggleButton}
                >
                  {showLayers ? '▼' : '►'}
                </button>
              </div>
              
              {showLayers && (
                <div className={styles.layersPanel}>
                  <div className={styles.layerControls}>
                    <button
                      onClick={addLayer}
                      className={styles.layerButton}
                      title="Add Layer"
                    >
                      <FaPlus size={12} />
                    </button>
                  </div>
                  
                  <div className={styles.layersList}>
                    {layers.map((layer, index) => (
                      <div
                        key={`layer-${index}`}
                        className={`${styles.layerItem} ${index === activeLayerIndex ? styles.activeLayer : ''}`}
                        onClick={() => setActiveLayerIndex(index)}
                      >
                        <div className={styles.layerVisibility}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLayerVisibility(index);
                            }}
                            className={styles.layerToggle}
                            title={layer.visible ? "Hide Layer" : "Show Layer"}
                          >
                            {layer.visible ? '👁️' : '👁️‍🗨️'}
                          </button>
                        </div>
                        
                        <div className={styles.layerName}>
                          <input
                            type="text"
                            value={layer.name}
                            onChange={(e) => renameLayer(index, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className={styles.layerNameInput}
                          />
                        </div>
                        
                        <div className={styles.layerActions}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLayerLock(index);
                            }}
                            className={styles.layerActionButton}
                            title={layer.locked ? "Unlock Layer" : "Lock Layer"}
                          >
                            {layer.locked ? '🔒' : '🔓'}
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteLayer(index);
                            }}
                            className={styles.layerActionButton}
                            title="Delete Layer"
                            disabled={layers.length <= 1}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {activeToolMode === 'stamp' && (
              <div className={styles.sidebarSection}>
                <h3 className={styles.sidebarTitle}>Stamps</h3>
                <div className="grid grid-cols-1 gap-2">
                  <button onClick={() => addStamp('approved')} className={styles.button}>Approved</button>
                  <button onClick={() => addStamp('draft')} className={styles.button}>Draft</button>
                  <button onClick={() => addStamp('confidential')} className={styles.button}>Confidential</button>
                </div>
              </div>
            )}
          </div>
          
          {/* Canvas area - give it more space */}
          <div className={styles.canvasContainer} ref={containerRef}>
            {!pdfDoc && (
              <div className="text-center p-10 bg-white rounded-lg shadow-lg max-w-lg mx-auto">
                <h3 className="text-2xl font-bold mb-4">Upload a PDF to Edit</h3>
                <p className="mb-6 text-gray-600">
                  Use the "Open PDF" button to upload a document and start editing.
                </p>
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FaUpload className="inline-block mr-2" />
                  Choose a PDF
                </button>
              </div>
            )}
            
            {pdfDoc && (
              <div 
                className={styles.canvasWrapper}
                ref={canvasWrapperRef}
                onClick={(e) => {
                  // Don't handle clicks if fabric is in drawing mode
                  if (fabricCanvas.current && fabricCanvas.current.isDrawingMode) {
                    return;
                  }
                  
                  // Only handle clicks directly on the canvas wrapper
                  // or explicit clicks for the text tool
                  if ((e.target.tagName.toLowerCase() === 'div' || activeToolMode === 'text') && 
                      fabricCanvas.current) {
                    // Get the canvas element
                    const canvasEl = fabricCanvas.current.upperCanvasEl;
                    if (!canvasEl) return;
                    
                    // Get canvas position
                    const rect = canvasEl.getBoundingClientRect();
                    
                    // Calculate position relative to canvas
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    console.log(`Canvas clicked at (${x}, ${y}), tool: ${activeToolMode}`);
                    
                    // Create a synthetic event similar to what fabric provides
                    const fabricEvent = {
                      e: e,
                      target: null,
                      pointer: { x, y }
                    };
                    
                    // Call the canvas click handler with this event
                    handleCanvasClick(fabricEvent);
                  }
                }}
              >
                {/* PDF Rendering Canvas */}
                <canvas 
                  ref={canvasRef} 
                  className={styles.pdfCanvas} 
                />
                
                {/* Overlay Canvas for Fabric.js */}
                <canvas 
                  ref={overlayCanvasRef} 
                  className={styles.overlayCanvas}
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".pdf"
          className="hidden"
        />
        
        {/* Loading overlay */}
        {isLoading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.loadingContent}>
              <div className={styles.spinner} />
              <p>Loading...</p>
            </div>
          </div>
        )}
        
        {/* Error modal */}
        {error && (
          <div className={styles.errorModal}>
            <div className={styles.errorContent}>
              <h3 className={styles.errorTitle}>Error</h3>
              <p className={styles.errorMessage}>{error}</p>
              <button
                onClick={() => setError(null)}
                className={styles.errorButton}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default PDFEditor;