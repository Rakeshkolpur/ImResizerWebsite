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
// This is the most reliable way to load the worker in Vite
const PDFJS_VERSION = '3.11.174';
const PDFJS_WORKER_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;

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
  // State for PDF document
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfName, setPdfName] = useState('');
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [renderedPage, setRenderedPage] = useState(null);
  const [pdfPageImages, setPdfPageImages] = useState([]);
  
  // State for UI
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [activeToolMode, setActiveToolMode] = useState('cursor');
  
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
  const [layers, setLayers] = useState([]);
  const [activeLayerIndex, setActiveLayerIndex] = useState(0);
  const [showLayers, setShowLayers] = useState(false);

  // Add state for shape drawing
  const [isDrawingShape, setIsDrawingShape] = useState(false);
  const [currentShapeType, setCurrentShapeType] = useState(null);
  const [drawStartPoint, setDrawStartPoint] = useState({ x: 0, y: 0 });
  const [tempShapeObj, setTempShapeObj] = useState(null);

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
    setLayers(prev => {
      const newLayers = [...prev];
      newLayers[index].visible = !newLayers[index].visible;
      
      // Update fabric objects visibility
      if (fabricCanvas.current) {
        newLayers[index].objects.forEach(objId => {
          const obj = fabricCanvas.current.getObjects().find(o => o.id === objId);
          if (obj) {
            obj.visible = newLayers[index].visible;
          }
        });
        fabricCanvas.current.renderAll();
      }
      
      return newLayers;
    });
  };

  // Function to toggle layer lock
  const toggleLayerLock = (index) => {
    setLayers(prev => {
      const newLayers = [...prev];
      newLayers[index].locked = !newLayers[index].locked;
      
      // Update fabric objects selectable property
      if (fabricCanvas.current) {
        newLayers[index].objects.forEach(objId => {
          const obj = fabricCanvas.current.getObjects().find(o => o.id === objId);
          if (obj) {
            obj.selectable = !newLayers[index].locked;
            obj.evented = !newLayers[index].locked;
          }
        });
        fabricCanvas.current.renderAll();
      }
      
      return newLayers;
    });
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
        canvas.wrapperEl.style.transform = 'none';
        canvas.wrapperEl.style.transformOrigin = '0 0';
        canvas.wrapperEl.classList.add(styles.fabricWrapper);
      }
      
      // Fix lower canvas
      if (canvas.lowerCanvasEl) {
        canvas.lowerCanvasEl.style.position = 'absolute';
        canvas.lowerCanvasEl.style.top = '0';
        canvas.lowerCanvasEl.style.left = '0';
        canvas.lowerCanvasEl.style.transform = 'none';
        canvas.lowerCanvasEl.style.transformOrigin = '0 0';
      }
      
      // Fix upper canvas
      if (canvas.upperCanvasEl) {
        canvas.upperCanvasEl.style.position = 'absolute';
        canvas.upperCanvasEl.style.top = '0';
        canvas.upperCanvasEl.style.left = '0';
        canvas.upperCanvasEl.style.transform = 'none';
        canvas.upperCanvasEl.style.transformOrigin = '0 0';
      }
      
      // Ensure any additional divs don't interfere with layout
      const parentNode = canvas.wrapperEl?.parentNode;
      if (parentNode) {
        const childNodes = parentNode.childNodes;
        for (let i = 0; i < childNodes.length; i++) {
          const child = childNodes[i];
          if (child.nodeType === 1 && child !== canvas.wrapperEl && child !== canvasRef.current) {
            // Check if this is an extra div created by Fabric.js
            if (child.classList.contains('canvas-container') || 
                child.style.position === 'relative' || 
                child.style.width === canvas.width + 'px') {
              
              // Remove any transform or scaling
              child.style.transform = 'none';
              child.style.transformOrigin = '0 0';
              child.style.position = 'absolute';
              child.style.top = '0';
              child.style.left = '0';
              child.style.width = '100%';
              child.style.height = '100%';
            }
          }
        }
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
        // Create a new Fabric.js canvas with options to control container behavior
        const canvas = new fabric.Canvas(overlayCanvasRef.current, {
          isDrawingMode: false,
          selection: true,
          width: pdfPageImages[currentPage - 1]?.width || 800,
          height: pdfPageImages[currentPage - 1]?.height || 600,
          preserveObjectStacking: true,
          stopContextMenu: true,
          fireRightClick: true,
          // Prevent Fabric.js from modifying the canvas container style
          enableRetinaScaling: false,
          renderOnAddRemove: true,
          controlsAboveOverlay: true
        });
        
        // Store the canvas in the ref
        fabricCanvas.current = canvas;
        
        // Clean up any extra styling that Fabric.js may have applied to containers
        cleanupFabricContainer(canvas);
        
        // Apply cleanup after a small delay to ensure all Fabric.js initialization is complete
        setTimeout(() => {
          cleanupFabricContainer(canvas);
        }, 100);
        
        // Set up event listeners
        canvas.on('object:modified', handleObjectModified);
        canvas.on('path:created', handlePathCreated);
        canvas.on('selection:created', (e) => {
          // When a text object is selected, update the text options
          if (e.selected && e.selected[0] && e.selected[0].type === 'i-text') {
            const selectedText = e.selected[0];
            setTextOptions({
              font: selectedText.fontFamily,
              size: selectedText.fontSize,
              color: selectedText.fill,
              backgroundColor: selectedText.backgroundColor,
              fontWeight: selectedText.fontWeight || 'normal',
              fontStyle: selectedText.fontStyle || 'normal'
            });
          }
        });
        
        // Initialize drawing brush - only if the canvas is properly initialized
        if (canvas.freeDrawingBrush) {
          canvas.freeDrawingBrush.color = drawingOptions.color;
          canvas.freeDrawingBrush.width = drawingOptions.width;
        }
        
        // Set up keyboard shortcuts
        document.addEventListener('keydown', (e) => {
          // Delete key to remove selected objects
          if (e.key === 'Delete' && canvas.getActiveObject()) {
            if (canvas.getActiveObjects().length > 0) {
              addToUndoStack();
              canvas.getActiveObjects().forEach(obj => {
                canvas.remove(obj);
              });
              canvas.discardActiveObject();
              canvas.renderAll();
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
        });
        
        console.log("Fabric.js canvas initialized");
      } catch (error) {
        console.error("Error initializing Fabric.js canvas:", error);
      }
    }
    
    // Cleanup function
    return () => {
      if (fabricCanvas.current) {
        try {
          // Safely dispose of the fabric canvas
          const canvas = fabricCanvas.current;
          canvas.off(); // Remove all event listeners
          canvas.dispose();
          fabricCanvas.current = null;
        } catch (error) {
          console.error("Error disposing fabric canvas:", error);
        }
      }
    };
  }, [pdfPageImages, currentPage, drawingOptions.color, drawingOptions.width]);
  
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
      
      // Always start with scale=1.0 (actual size) when loading a new PDF
      // This ensures we see the document at its exact size initially
      setScale(1.0);
      console.log("Loading PDF at actual size (scale=1.0)");
      
      console.log("Worker source:", pdfjsLib.GlobalWorkerOptions.workerSrc);
      
      // Read the file - create separate copies for PDF.js and pdf-lib
      const fileData = await file.arrayBuffer();
      
      // Create a copy of the ArrayBuffer for PDF.js
      const pdfJsBuffer = new Uint8Array(fileData.slice(0));
      
      // Create a copy of the ArrayBuffer for pdf-lib
      const pdfLibBuffer = new Uint8Array(fileData.slice(0));
      
      // Load the PDF with PDF.js
      try {
        // Use high-quality rendering options
        const loadingTask = pdfjsLib.getDocument({
          data: pdfJsBuffer,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
          cMapPacked: true,
          standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/standard_fonts/',
          disableFontFace: false, // Enable font rendering
          nativeImageDecoderSupport: 'display', // Use native image decoder for better quality
          isEvalSupported: true,
          useSystemFonts: true, // Use system fonts for better rendering
          useWorkerFetch: true,
          rangeChunkSize: 65536, // Larger chunk size for better performance
          maxImageSize: -1, // No limit on image size
          isOffscreenCanvasSupported: true
        });
        
        // Add an error handler to the loading task
        loadingTask.onProgress = (progress) => {
          console.log(`Loading PDF: ${progress.loaded}/${progress.total}`);
        };
        
        const pdf = await loadingTask.promise;
        console.log("PDF loaded successfully:", pdf);
        setPdfDoc(pdf);
        setPageCount(pdf.numPages);
        setCurrentPage(1);
        
        // Clear previous page images when loading a new PDF
        setPdfPageImages([]);
        
        // Create PDF document with pdf-lib for later saving
        try {
          const pdfDoc = await PDFDocument.load(pdfLibBuffer);
          setPdfFile(pdfDoc);
          setPdfName(file.name);
          
          // Render the first page at actual size (scale=1.0)
          await renderPage(pdf, 1);
          
          setIsLoading(false);
        } catch (pdfLibError) {
          console.error("Error loading PDF with pdf-lib:", pdfLibError);
          setError(`Failed to prepare PDF for editing: ${pdfLibError.message}`);
          setIsLoading(false);
        }
      } catch (pdfError) {
        console.error("Error loading PDF with PDF.js:", pdfError);
        setError(`Failed to load PDF: ${pdfError.message}. Please try a different file.`);
        setIsLoading(false);
        
        // Show a user-friendly error dialog
        alert(`Failed to load PDF: ${pdfError.message}. Please try a different file or check if the file is corrupted.`);
      }
    } catch (error) {
      console.error("Error loading PDF:", error);
      setError(`Failed to load PDF: ${error.message}`);
      setIsLoading(false);
      
      // Show a user-friendly error dialog
      alert(`Failed to load PDF. Please try again or check if the file is valid.`);
    }
  };
  
  // Update the renderPage function to display at actual size by default
  const renderPage = async (pdf, pageNumber) => {
    try {
      if (!pdf) {
        console.error("No PDF document available");
        return;
      }
      
      const page = await pdf.getPage(pageNumber);
      
      // Get the original page size from the PDF
      const originalViewport = page.getViewport({ scale: 1 });
      const pageWidth = originalViewport.width;
      const pageHeight = originalViewport.height;
      
      // Check if this is likely an A4 document (A4 is approximately 595 x 842 points at 72dpi)
      const isA4 = Math.abs(pageWidth - 595) < 30 && Math.abs(pageHeight - 842) < 30;
      
      // Instead of automatically scaling to container, use actual size (1.0 scale)
      // We'll only apply user-defined scale if it exists
      const initialScale = scale || 1.0; // Use 1.0 scale by default for initial render
      
      // Create viewport with actual size scale
      const viewport = page.getViewport({ scale: initialScale });
      
      // Get the canvas element
      const canvas = canvasRef.current;
      if (!canvas) {
        console.error("Canvas element not found");
        return;
      }
      
      // Get device pixel ratio - use a higher value for better quality
      // Use at least 2x for better quality, but cap at 3x to avoid performance issues
      const pixelRatio = Math.min(Math.max(window.devicePixelRatio || 1, 2), 3);
      
      // Set canvas dimensions with pixel ratio for high DPI displays
      canvas.width = viewport.width * pixelRatio;
      canvas.height = viewport.height * pixelRatio;
      
      // Set display size
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      
      // Prepare canvas for rendering with high quality settings
      const context = canvas.getContext('2d', { alpha: false, willReadFrequently: true });
      if (!context) {
        console.error("Could not get canvas context");
        return;
      }
      
      // Scale context to account for the pixel ratio
      context.scale(pixelRatio, pixelRatio);
      
      // Disable image smoothing for sharper text
      context.imageSmoothingEnabled = false;
      context.imageSmoothingQuality = 'high';
      
      console.log(`Rendering page ${pageNumber} with scale ${initialScale} and pixel ratio ${pixelRatio}`);
      
      // Render the page with high quality
      try {
        // Use a higher quality rendering approach
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          enableWebGL: true,
          renderInteractiveForms: true,
          intent: 'print',  // Use 'print' for highest quality
          canvasFactory: {
            create: function(width, height) {
              const canvas = document.createElement('canvas');
              canvas.width = width;
              canvas.height = height;
              return canvas;
            },
            reset: function(canvasAndContext, width, height) {
              canvasAndContext[0].width = width;
              canvasAndContext[0].height = height;
              return canvasAndContext;
            },
            destroy: function(canvasAndContext) {
              // No need to do anything here
            }
          },
          background: 'rgba(255, 255, 255, 1)'  // White background for better quality
        };
        
        await page.render(renderContext).promise;
        
        // Apply sharpening filter for better text clarity
        applySharpening(context, viewport.width, viewport.height);
        
        console.log(`Page ${pageNumber} rendered successfully`);
        
        // Store the rendered page image to prevent it from disappearing
        // Use higher quality PNG encoding
        const pageImage = canvas.toDataURL('image/png', 1.0);
        setPdfPageImages(prev => {
          const newImages = [...prev];
          newImages[pageNumber - 1] = {
            url: pageImage,
            width: viewport.width,
            height: viewport.height,
            originalWidth: pageWidth,
            originalHeight: pageHeight,
            isA4: isA4
          };
          return newImages;
        });
        
        // Set up the overlay canvas for annotations
        const overlay = overlayCanvasRef.current;
        if (overlay) {
          overlay.width = viewport.width;
          overlay.height = viewport.height;
          
          // Reinitialize Fabric canvas with new dimensions
          if (fabricCanvas.current) {
            fabricCanvas.current.setDimensions({
              width: viewport.width,
              height: viewport.height
            });
          }
        }
        
        // Store the rendered page
        setRenderedPage(pageNumber);
        
        // Auto-fit to width only if it's the first page being loaded
        if (pageNumber === 1 && !scale) {
          // Delay to ensure the canvas is ready
          setTimeout(() => {
            fitToWidth();
          }, 100);
        }
      } catch (renderError) {
        console.error("Error rendering page:", renderError);
        setError(`Failed to render page ${pageNumber}: ${renderError.message}`);
      }
    } catch (pageError) {
      console.error("Error getting page:", pageError);
      setError(`Failed to get page ${pageNumber}: ${pageError.message}`);
    }
  };
  
  // Add a function to apply sharpening filter for better text clarity
  const applySharpening = (context, width, height) => {
    try {
      // Get image data
      const imageData = context.getImageData(0, 0, width, height);
      const data = imageData.data;
      const sharpeningFactor = 0.3; // Adjust this value for more/less sharpening
      
      // Apply unsharp mask filter
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = (y * width + x) * 4;
          
          // For each color channel (R, G, B)
          for (let c = 0; c < 3; c++) {
            const current = data[idx + c];
            const neighbors = [
              data[idx - width * 4 + c], // top
              data[idx + width * 4 + c], // bottom
              data[idx - 4 + c],         // left
              data[idx + 4 + c]          // right
            ];
            
            // Calculate average of neighbors
            const avg = neighbors.reduce((sum, val) => sum + val, 0) / 4;
            
            // Apply sharpening
            const diff = current - avg;
            data[idx + c] = Math.min(255, Math.max(0, current + diff * sharpeningFactor));
          }
        }
      }
      
      // Put the modified image data back
      context.putImageData(imageData, 0, 0);
    } catch (error) {
      console.error("Error applying sharpening:", error);
      // Continue without sharpening if there's an error
    }
  };
  
  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && (file.type === 'application/pdf')) {
      loadPDF(file);
    } else {
      setError('Please select a valid PDF file.');
    }
  };
  
  // Handle file drop
  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Get the dropped file
    const file = event.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      loadPDF(file);
    } else {
      setError('Please drop a valid PDF file.');
    }
  };
  
  // Add resize event listener
  useEffect(() => {
    const handleResize = () => {
      if (pdfDoc && currentPage <= pdfPageImages.length) {
        // Add a small delay to avoid excessive redraws during resizing
        setTimeout(() => {
          renderCurrentPage();
        }, 100);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [pdfDoc, currentPage, pdfPageImages, scale, rotation]);
  
  // Render the current page on canvas
  useEffect(() => {
    if (canvasRef.current && pdfPageImages.length > 0 && currentPage <= pdfPageImages.length) {
      renderCurrentPage();
    }
  }, [currentPage, pdfPageImages, scale, rotation]);
  
  // Render the current page
  const renderCurrentPage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d', { alpha: false, willReadFrequently: true });
    if (!context) {
      console.error("Could not get canvas context");
      return;
    }
    
    const pageIndex = currentPage - 1;
    
    if (pageIndex < 0 || pageIndex >= pdfPageImages.length) {
      console.error('Invalid page index:', pageIndex);
      return;
    }
    
    // Create an image from the stored data URL
    const img = new Image();
    img.onload = () => {
      try {
        // Safety check to ensure component is still mounted
        if (!canvasRef.current || !containerRef.current) {
          console.log("Component unmounted, aborting render");
          return;
        }
        
        // Get page information
        const pageInfo = pdfPageImages[pageIndex];
        const originalWidth = pageInfo.originalWidth || img.width;
        const originalHeight = pageInfo.originalHeight || img.height;
        
        // Use actual size (1.0 scale) as the base, then apply user-defined scale
        // No automatic container-based scaling
        const userScale = scale || 1.0; // Default to 1.0 if scale is null
        
        // Calculate final dimensions
        const scaledWidth = originalWidth * userScale;
        const scaledHeight = originalHeight * userScale;
        
        // Get device pixel ratio for high-resolution displays
        // Use at least 2x for better quality, but cap at 3x to avoid performance issues
        const pixelRatio = Math.min(Math.max(window.devicePixelRatio || 1, 2), 3);
        
        // Set canvas dimensions for high-quality rendering
        canvas.width = scaledWidth * pixelRatio;
        canvas.height = scaledHeight * pixelRatio;
        
        // Set display size
        canvas.style.width = `${scaledWidth}px`;
        canvas.style.height = `${scaledHeight}px`;
        
        // Clear canvas
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Apply scaling for high DPI
        context.scale(pixelRatio, pixelRatio);
        
        // Disable image smoothing for sharper text
        context.imageSmoothingEnabled = false;
        context.imageSmoothingQuality = 'high';
        
        // Save context state for rotation
        context.save();
        
        // Apply rotation if needed
        if (rotation !== 0) {
          context.translate(scaledWidth / 2, scaledHeight / 2);
          context.rotate((rotation * Math.PI) / 180);
          context.translate(-scaledWidth / 2, -scaledHeight / 2);
        }
        
        // Draw the image with high quality
        context.drawImage(img, 0, 0, scaledWidth, scaledHeight);
        
        // Apply sharpening for better text clarity if zoomed in
        if (userScale > 1.2) {
          applySharpening(context, scaledWidth, scaledHeight);
        }
        
        // Restore context state
        context.restore();
        
        // Set up overlay canvas dimensions - ensure exact match with PDF canvas
        if (overlayCanvasRef.current) {
          overlayCanvasRef.current.width = scaledWidth;
          overlayCanvasRef.current.height = scaledHeight;
          
          // Update Fabric canvas dimensions
          if (fabricCanvas.current) {
            fabricCanvas.current.setDimensions({
              width: scaledWidth,
              height: scaledHeight
            });
            
            // Make sure the fabric canvas is correctly positioned
            cleanupFabricContainer(fabricCanvas.current);
            
            // Render the fabric canvas to apply changes
            fabricCanvas.current.renderAll();
          }
        }
        
        // Draw any annotations
        if (typeof renderAnnotations === 'function') {
          renderAnnotations(context);
        }
        
        // Ensure the PDF is visible from the top by scrolling to top
        if (containerRef.current) {
          containerRef.current.scrollTop = 0;
        }
        
        // Only center horizontally if zoomed in
        if (userScale > 1.0 && containerRef.current) {
          const container = containerRef.current;
          const containerWidth = container.clientWidth;
          
          // Center horizontally but keep at top vertically
          if (scaledWidth > containerWidth) {
            setTimeout(() => {
              container.scrollLeft = (scaledWidth - containerWidth) / 2;
            }, 50);
          }
        }
      } catch (error) {
        console.error("Error rendering page:", error);
        setError(`Failed to render page: ${error.message}`);
      }
    };
    
    img.onerror = (error) => {
      console.error("Error loading image:", error);
      setError("Failed to load PDF page image");
    };
    
    img.src = pdfPageImages[pageIndex].url;
  };
  
  // Render annotations on the canvas
  const renderAnnotations = (context) => {
    if (!context) {
      console.error("Canvas context is not available");
      return;
    }
    
    try {
      // Clear any previous annotations
      context.save();
      
      // Render annotations based on their type
      annotations.forEach(annotation => {
        switch (annotation.type) {
          case 'highlight':
            context.fillStyle = `rgba(255, 255, 0, 0.3)`;
            context.fillRect(
              annotation.x,
              annotation.y,
              annotation.width,
              annotation.height
            );
            break;
          case 'underline':
            context.strokeStyle = 'blue';
            context.lineWidth = 1;
            context.beginPath();
            context.moveTo(annotation.x, annotation.y + annotation.height);
            context.lineTo(annotation.x + annotation.width, annotation.y + annotation.height);
            context.stroke();
            break;
          default:
            break;
        }
      });
      
      context.restore();
    } catch (error) {
      console.error("Error rendering annotations:", error);
    }
  };
  
  // Handle tool selection
  const handleToolSelect = (toolId) => {
    console.log(`Tool selected: ${toolId}`);
    
    // Deactivate previous tool mode
    if (fabricCanvas.current) {
      fabricCanvas.current.isDrawingMode = false;
      
      // Disable objects selection when switching to drawing mode
      if (toolId === 'draw' || toolId === 'highlight') {
        fabricCanvas.current.selection = false;
        fabricCanvas.current.forEachObject(obj => {
          obj.selectable = false;
          obj.evented = false;
        });
      } else {
        fabricCanvas.current.selection = true;
        fabricCanvas.current.forEachObject(obj => {
          obj.selectable = true;
          obj.evented = true;
        });
      }
      
      // Set drawing mode
      if (toolId === 'draw') {
        fabricCanvas.current.isDrawingMode = true;
        fabricCanvas.current.freeDrawingBrush.color = drawingOptions.color;
        fabricCanvas.current.freeDrawingBrush.width = drawingOptions.width;
      }
      
      // Set up eraser
      if (toolId === 'erase' && fabricCanvas.current) {
        // Enable selection to select objects for deletion
        fabricCanvas.current.selection = true;
        fabricCanvas.current.forEachObject(obj => {
          obj.selectable = true;
        });
      }
      
      // Set up text tool
      if (toolId === 'text') {
        // Enable clicking on canvas to add text
        fabricCanvas.current.defaultCursor = 'text';
        fabricCanvas.current.selection = true;
      } else {
        fabricCanvas.current.defaultCursor = 'default';
      }
    }
    
    setActiveToolMode(toolId);
  };
  
  // Add function to apply current drawing options to selected object
  const applyStylesToSelected = () => {
    if (!fabricCanvas.current) return;
    
    const activeObject = fabricCanvas.current.getActiveObject();
    if (!activeObject) return;
    
    // Start with the current drawing options
    const styleUpdates = {
      stroke: drawingOptions.color,
      strokeWidth: drawingOptions.width,
      opacity: drawingOptions.opacity
    };
    
    // Only set fill if enabled - this is the part we're improving
    if (drawingOptions.fillEnabled) {
      styleUpdates.fill = drawingOptions.fill;
    } else {
      // If fill is disabled, set transparent fill for all shapes
      styleUpdates.fill = 'transparent';
    }
    
    // Apply styles based on object type
    if (activeObject.type === 'i-text') {
      // For text objects, handle fill and stroke differently
      styleUpdates.fill = drawingOptions.color; // Text color
      
      // Set background color if fill is enabled
      if (drawingOptions.fillEnabled) {
        styleUpdates.backgroundColor = drawingOptions.fill;
      } else {
        styleUpdates.backgroundColor = null;
      }
    }
    
    console.log("Applying styles to object:", activeObject.type, styleUpdates);
    
    // Apply styles to group objects
    if (activeObject.type === 'activeSelection') {
      // Apply styles to all objects in the group
      activeObject.forEachObject(obj => {
        const objStyles = {...styleUpdates};
        
        // Adjust for text objects in the group
        if (obj.type === 'i-text') {
          objStyles.fill = styleUpdates.stroke; // Text color
          if (drawingOptions.fillEnabled) {
            objStyles.backgroundColor = styleUpdates.fill;
          } else {
            objStyles.backgroundColor = null;
          }
        }
        
        obj.set(objStyles);
      });
    } else {
      // Apply to single object
      activeObject.set(styleUpdates);
    }
    
    // Update the canvas
    fabricCanvas.current.renderAll();
    addToUndoStack();
  };
  
  // Enhanced addTextBox function that creates a better editable text object
  const addTextBox = (x = 100, y = 100) => {
    if (!fabricCanvas.current) return;
    
    try {
      console.log("Adding text at", x, y);
      
      // Create a text box with default text
      const text = new fabric.IText('Edit this text', {
        left: x,
        top: y,
        fontFamily: textOptions.font,
        fontSize: textOptions.size,
        fill: textOptions.color,
        backgroundColor: drawingOptions.fillEnabled ? drawingOptions.fill : null,
        padding: 5,
        cornerSize: 8,
        transparentCorners: false,
        cornerColor: '#0069d9',
        borderColor: '#0069d9',
        editingBorderColor: '#0069d9',
        cursorColor: '#333',
        cursorWidth: 2,
        selectionColor: 'rgba(0, 105, 217, 0.3)',
        lockScalingFlip: true,
        centeredScaling: true,
        id: `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        visible: layers[activeLayerIndex]?.visible ?? true,
        selectable: !(layers[activeLayerIndex]?.locked ?? false),
        evented: !(layers[activeLayerIndex]?.locked ?? false)
      });
      
      // Enter editing mode immediately
      fabricCanvas.current.add(text);
      fabricCanvas.current.setActiveObject(text);
      text.enterEditing();
      
      // Position cursor at end of text
      text.selectAll();
      
      // Update canvas
      fabricCanvas.current.renderAll();
      
      // Add the object ID to the active layer
      setLayers(prev => {
        const newLayers = [...prev];
        if (newLayers[activeLayerIndex]) {
          newLayers[activeLayerIndex].objects.push(text.id);
        }
        return newLayers;
      });
      
      // Save state for undo
      addToUndoStack();
      
      console.log("Text box added successfully");
    } catch (error) {
      console.error("Error adding text box:", error);
    }
  };
  
  // Add image
  const addImage = async (file) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        fabric.Image.fromURL(e.target.result, (img) => {
          // Scale image to fit within canvas
          const scale = Math.min(
            (fabricCanvas.current.width / 2) / img.width,
            (fabricCanvas.current.height / 2) / img.height
          );
          
          img.scale(scale);
          img.set({
            left: 50,
            top: 50
          });
          
          fabricCanvas.current.add(img);
          fabricCanvas.current.setActiveObject(img);
          addToUndoStack();
        });
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error adding image:', err);
      setError('Failed to add image. Please try again.');
    }
  };
  
  // Function to start shape drawing mode
  const startShapeDrawing = (type) => {
    setCurrentShapeType(type);
    setIsDrawingShape(true);
    
    // Set cursor to crosshair to indicate drawing mode
    if (fabricCanvas.current) {
      fabricCanvas.current.defaultCursor = 'crosshair';
      fabricCanvas.current.selection = false;
      
      // Disable selection of existing objects during drawing
      fabricCanvas.current.forEachObject(obj => {
        obj.selectable = false;
        obj.evented = false;
      });
    }
    
    console.log(`Starting shape drawing mode: ${type}`);
  };

  // Function to handle canvas mouse down for shape drawing
  const handleCanvasMouseDown = (e) => {
    if (!isDrawingShape || !fabricCanvas.current) return;
    
    // Get pointer coordinates
    const pointer = fabricCanvas.current.getPointer(e.e);
    setDrawStartPoint({ x: pointer.x, y: pointer.y });
    
    // Create initial shape based on type
    let shape;
    const commonProps = {
      left: pointer.x,
      top: pointer.y,
      width: 0,
      height: 0,
      fill: drawingOptions.fillEnabled ? drawingOptions.fill : 'transparent',
      stroke: drawingOptions.color,
      strokeWidth: drawingOptions.width,
      opacity: drawingOptions.opacity,
      strokeUniform: true,
      transparentCorners: false,
      cornerColor: '#0069d9',
      cornerSize: 8,
      cornerStyle: 'circle',
      borderColor: '#0069d9'
    };
    
    switch (currentShapeType) {
      case 'rect':
      case 'square':
        shape = new fabric.Rect({
          ...commonProps,
          originX: 'left',
          originY: 'top'
        });
        break;
      case 'circle':
        shape = new fabric.Circle({
          ...commonProps,
          left: pointer.x,
          top: pointer.y,
          radius: 1, // Start with a tiny radius
          originX: 'center',
          originY: 'center'
        });
        break;
      case 'ellipse':
        shape = new fabric.Ellipse({
          ...commonProps,
          left: pointer.x,
          top: pointer.y,
          rx: 1, // Start with tiny radii
          ry: 1,
          originX: 'center',
          originY: 'center'
        });
        break;
      case 'triangle':
        shape = new fabric.Triangle({
          ...commonProps,
          originX: 'left',
          originY: 'top'
        });
        break;
      case 'line':
        shape = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
          stroke: drawingOptions.color,
          strokeWidth: drawingOptions.width,
          opacity: drawingOptions.opacity,
          fill: drawingOptions.fillEnabled ? drawingOptions.fill : 'transparent'
        });
        break;
      default:
        return; // Exit if shape type is not supported for drawing
    }
    
    fabricCanvas.current.add(shape);
    fabricCanvas.current.renderAll();
    setTempShapeObj(shape);
  };

  // Function to handle canvas mouse move for shape drawing
  const handleCanvasMouseMove = (e) => {
    if (!isDrawingShape || !tempShapeObj || !fabricCanvas.current) return;
    
    const pointer = fabricCanvas.current.getPointer(e.e);
    
    // Calculate width and height
    let width = Math.abs(pointer.x - drawStartPoint.x);
    let height = Math.abs(pointer.y - drawStartPoint.y);
    
    // Calculate left and top positions if the shape grows in negative direction
    let left = drawStartPoint.x;
    let top = drawStartPoint.y;
    
    if (pointer.x < drawStartPoint.x) {
      left = pointer.x;
    }
    
    if (pointer.y < drawStartPoint.y) {
      top = pointer.y;
    }
    
    // Enforce square aspect ratio if needed
    if (currentShapeType === 'square') {
      const size = Math.max(width, height);
      width = size;
      height = size;
      
      // Adjust left/top for square to maintain the corner where the drag started
      if (pointer.x < drawStartPoint.x) {
        left = drawStartPoint.x - size;
      }
      
      if (pointer.y < drawStartPoint.y) {
        top = drawStartPoint.y - size;
      }
    }
    
    // Update shape based on type
    switch (currentShapeType) {
      case 'rect':
      case 'square':
      case 'triangle':
        tempShapeObj.set({
          width: width,
          height: height,
          left: left,
          top: top
        });
        break;
      case 'circle':
        // For circle, calculate radius based on the distance from center
        const dx = pointer.x - drawStartPoint.x;
        const dy = pointer.y - drawStartPoint.y;
        const radius = Math.sqrt(dx * dx + dy * dy) / 2;
        
        tempShapeObj.set({
          radius: radius
        });
        break;
      case 'ellipse':
        // For ellipse, set rx and ry based on the width and height
        tempShapeObj.set({
          rx: width / 2,
          ry: height / 2
        });
        break;
      case 'line':
        // For line, update end point
        tempShapeObj.set({
          x2: pointer.x,
          y2: pointer.y
        });
        break;
    }
    
    fabricCanvas.current.renderAll();
  };

  // Function to handle canvas mouse up for shape drawing
  const handleCanvasMouseUp = () => {
    if (!isDrawingShape || !tempShapeObj || !fabricCanvas.current) return;
    
    // Finish the shape and assign an ID
    tempShapeObj.id = `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    tempShapeObj.visible = layers[activeLayerIndex]?.visible ?? true;
    tempShapeObj.selectable = !(layers[activeLayerIndex]?.locked ?? false);
    tempShapeObj.evented = !(layers[activeLayerIndex]?.locked ?? false);
    
    // Add the shape to the current layer
    setLayers(prev => {
      const newLayers = [...prev];
      if (newLayers[activeLayerIndex]) {
        newLayers[activeLayerIndex].objects.push(tempShapeObj.id);
      }
      return newLayers;
    });
    
    // Activate the shape for further editing
    fabricCanvas.current.setActiveObject(tempShapeObj);
    
    // Reset drawing state
    setTempShapeObj(null);
    setIsDrawingShape(false);
    
    // Reset cursor and enable selection
    fabricCanvas.current.defaultCursor = 'default';
    fabricCanvas.current.selection = true;
    
    // Re-enable selection of objects
    fabricCanvas.current.forEachObject(obj => {
      if (!layers.some(layer => layer.locked && layer.objects.includes(obj.id))) {
        obj.selectable = true;
        obj.evented = true;
      }
    });
    
    // Add to undo stack
    addToUndoStack();
  };

  // Add event listeners to fabric canvas for shape drawing
  useEffect(() => {
    if (fabricCanvas.current && isDrawingShape) {
      fabricCanvas.current.on('mouse:down', handleCanvasMouseDown);
      fabricCanvas.current.on('mouse:move', handleCanvasMouseMove);
      fabricCanvas.current.on('mouse:up', handleCanvasMouseUp);
    }
    
    return () => {
      if (fabricCanvas.current) {
        fabricCanvas.current.off('mouse:down', handleCanvasMouseDown);
        fabricCanvas.current.off('mouse:move', handleCanvasMouseMove);
        fabricCanvas.current.off('mouse:up', handleCanvasMouseUp);
      }
    };
  }, [isDrawingShape, tempShapeObj, drawStartPoint, currentShapeType, fabricCanvas.current]);

  // Modified addShape function to start drawing mode instead of creating fixed shapes
  const addShape = (type) => {
    if (type === 'star' || type === 'heart' || type === 'arrow') {
      // For complex shapes, keep the old behavior of adding predefined shapes
      let shape;
      
      // Default props for all shapes
      const commonProps = {
        left: 50,
        top: 50,
        fill: drawingOptions.fillEnabled ? drawingOptions.fill : 'transparent',
        stroke: drawingOptions.color,
        strokeWidth: drawingOptions.width,
        opacity: drawingOptions.opacity,
        strokeUniform: true,
        transparentCorners: false,
        cornerColor: '#0069d9',
        cornerSize: 8,
        cornerStyle: 'circle',
        borderColor: '#0069d9',
        id: `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        visible: layers[activeLayerIndex]?.visible ?? true,
        selectable: !(layers[activeLayerIndex]?.locked ?? false),
        evented: !(layers[activeLayerIndex]?.locked ?? false)
      };
      
      if (type === 'star') {
        // Create a star shape
        const starPoints = [];
        const spikes = 5;
        const outerRadius = 50;
        const innerRadius = 25;
        
        for (let i = 0; i < spikes * 2; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const angle = (Math.PI / spikes) * i;
          const x = radius * Math.cos(angle);
          const y = radius * Math.sin(angle);
          starPoints.push({ x, y });
        }
        
        shape = new fabric.Polygon(starPoints, {
          ...commonProps
        });
      } else if (type === 'heart') {
        // Create a heart shape path
        const heartPath = 'M 10,30 A 20,20 0,0,1 50,30 A 20,20 0,0,1 90,30 Q 90,60 50,90 Q 10,60 10,30 z';
        shape = new fabric.Path(heartPath, {
          ...commonProps,
          scaleX: 0.5,
          scaleY: 0.5
        });
      } else if (type === 'arrow') {
        // Create custom arrow shape
        const points = [0, 0, 100, 0, 95, -5, 100, 0, 95, 5];
        shape = new fabric.Polyline(points, {
          ...commonProps,
          originX: 'left',
          originY: 'center'
        });
      }
      
      if (shape) {
        console.log(`Adding ${type} shape with fill:`, commonProps.fill);
        
        fabricCanvas.current.add(shape);
        fabricCanvas.current.setActiveObject(shape);
        
        // Add the object ID to the active layer
        setLayers(prev => {
          const newLayers = [...prev];
          if (newLayers[activeLayerIndex]) {
            newLayers[activeLayerIndex].objects.push(shape.id);
          }
          return newLayers;
        });
        
        addToUndoStack();
      }
    } else {
      // For basic shapes, use the new drawing mode
      startShapeDrawing(type);
    }
  };
  
  // Handle object modification
  const handleObjectModified = () => {
    addToUndoStack();
  };
  
  // Handle path creation (drawing)
  const handlePathCreated = () => {
    addToUndoStack();
  };
  
  // Add to undo stack
  const addToUndoStack = () => {
    if (!fabricCanvas.current) {
      return;
    }
    
    try {
      // Assign unique IDs to objects if they don't have one
      fabricCanvas.current.getObjects().forEach(obj => {
        if (!obj.id) {
          obj.id = `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
      });
      
      // Update the active layer's objects list
      setLayers(prev => {
        const newLayers = [...prev];
        if (newLayers[activeLayerIndex]) {
          // Get all objects on the canvas
          const objects = fabricCanvas.current.getObjects();
          
          // Filter objects not already in other layers
          const otherLayerObjects = newLayers
            .filter((_, i) => i !== activeLayerIndex)
            .flatMap(layer => layer.objects);
          
          // Update active layer with new objects
          newLayers[activeLayerIndex].objects = objects
            .filter(obj => !otherLayerObjects.includes(obj.id))
            .map(obj => obj.id);
        }
        return newLayers;
      });
      
      const json = fabricCanvas.current.toJSON(['id']);
      setUndoStack(prev => [...prev, json]);
      setRedoStack([]);
    } catch (error) {
      console.error("Error adding to undo stack:", error);
    }
  };
  
  // Handle undo
  const handleUndo = () => {
    if (!fabricCanvas.current || undoStack.length === 0) {
      return;
    }
    
    try {
      const prevState = undoStack[undoStack.length - 1];
      const currentState = fabricCanvas.current.toJSON();
      
      setRedoStack(prev => [...prev, currentState]);
      setUndoStack(prev => prev.slice(0, -1));
      
      fabricCanvas.current.loadFromJSON(prevState, () => {
        fabricCanvas.current.renderAll();
      });
    } catch (error) {
      console.error("Error during undo:", error);
    }
  };
  
  // Handle redo
  const handleRedo = () => {
    if (!fabricCanvas.current || redoStack.length === 0) {
      return;
    }
    
    try {
      const nextState = redoStack[redoStack.length - 1];
      const currentState = fabricCanvas.current.toJSON();
      
      setUndoStack(prev => [...prev, currentState]);
      setRedoStack(prev => prev.slice(0, -1));
      
      fabricCanvas.current.loadFromJSON(nextState, () => {
        fabricCanvas.current.renderAll();
      });
    } catch (error) {
      console.error("Error during redo:", error);
    }
  };
  
  // Save PDF with annotations
  const savePDF = async () => {
    try {
      if (!pdfFile) {
        console.error("No PDF file to save");
        setError("No PDF file to save. Please open a PDF first.");
        return;
      }
      
      setIsLoading(true);
      
      // Create a new canvas to merge PDF and annotations
      const mergeCanvas = document.createElement('canvas');
      mergeCanvas.width = canvasRef.current.width;
      mergeCanvas.height = canvasRef.current.height;
      const mergeContext = mergeCanvas.getContext('2d');
      
      // Draw the PDF page
      mergeContext.drawImage(canvasRef.current, 0, 0);
      
      // Draw the annotations from Fabric.js canvas
      if (fabricCanvas.current) {
        // Get the data URL from the Fabric.js canvas
        const fabricDataUrl = fabricCanvas.current.toDataURL({
          format: 'png',
          quality: 1
        });
        
        // Create an image from the data URL
        const fabricImage = new Image();
        fabricImage.src = fabricDataUrl;
        
        // Wait for the image to load
        await new Promise((resolve) => {
          fabricImage.onload = resolve;
        });
        
        // Draw the annotations on top of the PDF
        mergeContext.drawImage(fabricImage, 0, 0);
      }
      
      // Convert the merged canvas to a data URL
      const mergedDataUrl = mergeCanvas.toDataURL('image/png');
      
      // Create a download link
      const link = document.createElement('a');
      link.href = mergedDataUrl;
      link.download = pdfName.replace('.pdf', '_edited.png');
      
      // Trigger the download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error saving PDF:", error);
      setError(`Failed to save PDF: ${error.message}`);
      setIsLoading(false);
    }
  };
  
  // Extract text using OCR
  const extractText = async () => {
    if (!ocrWorker.current) {
      try {
        setIsLoading(true);
        // Initialize OCR worker if not already initialized
        const worker = await createWorker('eng', 1, {
          logger: m => {
            if (m && typeof m.progress === 'number') {
              console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
            }
          }
        });
        
        ocrWorker.current = worker;
        console.log("OCR worker initialized on demand");
      } catch (error) {
        console.error("Failed to initialize OCR worker:", error);
        setIsLoading(false);
        alert("OCR functionality could not be initialized. Please try again later.");
        return;
      }
    }
    
    try {
      setIsLoading(true);
      
      const canvas = canvasRef.current;
      if (!canvas) {
        throw new Error("Canvas not available");
      }
      
      // Convert canvas to blob to avoid cloning issues
      const blob = await new Promise(resolve => {
        canvas.toBlob(blob => resolve(blob), 'image/png');
      });
      
      if (!blob) {
        throw new Error("Failed to convert canvas to image");
      }
      
      // Use Tesseract.js v3.0.3 API
      const { data } = await ocrWorker.current.recognize(blob);
      
      // Add extracted text as editable text objects
      const lines = data.text.split('\n');
      lines.forEach((line, i) => {
        if (line.trim()) {
          const text = new fabric.IText(line, {
            left: 50,
            top: 50 + (i * 20),
            fontFamily: textOptions.font,
            fontSize: textOptions.size,
            fill: textOptions.color,
            editable: true
          });
          fabricCanvas.current.add(text);
        }
      });
      
      fabricCanvas.current.renderAll();
      setIsLoading(false);
      
    } catch (error) {
      console.error("Error extracting text:", error);
      setError(`Failed to extract text: ${error.message}`);
      setIsLoading(false);
      alert("Failed to extract text. Please try again.");
    }
  };

  // Add new function to handle text highlighting
  const addHighlight = (x, y, width, height) => {
    const highlight = new fabric.Rect({
      left: x,
      top: y,
      width: width,
      height: height,
      fill: highlightColor,
      opacity: 0.3,
      selectable: true
    });
    
    fabricCanvas.current.add(highlight);
    fabricCanvas.current.setActiveObject(highlight);
    addToUndoStack();
  };

  // Add new function to handle stamps
  const addStamp = (type) => {
    let stamp;
    const stampSize = 100;
    
    switch (type) {
      case 'approved':
        stamp = new fabric.Text('APPROVED', {
          left: 50,
          top: 50,
          fontSize: 40,
          fill: 'red',
          fontFamily: 'Arial',
          angle: -30
        });
        break;
      case 'draft':
        stamp = new fabric.Text('DRAFT', {
          left: 50,
          top: 50,
          fontSize: 40,
          fill: 'gray',
          fontFamily: 'Arial',
          angle: -30
        });
        break;
      case 'confidential':
        stamp = new fabric.Text('CONFIDENTIAL', {
          left: 50,
          top: 50,
          fontSize: 40,
          fill: 'red',
          fontFamily: 'Arial',
          angle: -30
        });
        break;
    }
    
    if (stamp) {
      fabricCanvas.current.add(stamp);
      fabricCanvas.current.setActiveObject(stamp);
      addToUndoStack();
    }
  };

  // Add new function to handle watermarks
  const addWatermark = (text) => {
    const canvas = fabricCanvas.current;
    const watermark = new fabric.Text(text, {
      left: canvas.width / 2,
      top: canvas.height / 2,
      fontSize: 60,
      fill: 'rgba(200, 200, 200, 0.3)',
      fontFamily: 'Arial',
      angle: -45,
      originX: 'center',
      originY: 'center',
      selectable: true
    });
    
    canvas.add(watermark);
    canvas.setActiveObject(watermark);
    addToUndoStack();
  };

  // Add this function after the component declaration
  useEffect(() => {
    // Check if the PDF.js worker is loaded correctly
    const checkWorker = async () => {
      try {
        console.log("Checking PDF.js worker...");
        console.log("Worker source:", pdfjsLib.GlobalWorkerOptions.workerSrc);
        
        // Create a minimal valid PDF for testing
        const minimalPdf = new Uint8Array([
          0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x37, 0x0A, 0x31, 0x20, 0x30,
          0x20, 0x6F, 0x62, 0x6A, 0x0A, 0x3C, 0x3C, 0x2F, 0x54, 0x79, 0x70, 0x65,
          0x2F, 0x43, 0x61, 0x74, 0x61, 0x6C, 0x6F, 0x67, 0x2F, 0x50, 0x61, 0x67,
          0x65, 0x73, 0x20, 0x32, 0x20, 0x30, 0x20, 0x52, 0x3E, 0x3E, 0x0A, 0x65,
          0x6E, 0x64, 0x6F, 0x62, 0x6A, 0x0A, 0x32, 0x20, 0x30, 0x20, 0x6F, 0x62,
          0x6A, 0x0A, 0x3C, 0x3C, 0x2F, 0x54, 0x79, 0x70, 0x65, 0x2F, 0x50, 0x61,
          0x67, 0x65, 0x73, 0x2F, 0x4B, 0x69, 0x64, 0x73, 0x5B, 0x33, 0x20, 0x30,
          0x20, 0x52, 0x5D, 0x2F, 0x43, 0x6F, 0x75, 0x6E, 0x74, 0x20, 0x31, 0x3E,
          0x3E, 0x0A, 0x65, 0x6E, 0x64, 0x6F, 0x62, 0x6A, 0x0A, 0x33, 0x20, 0x30,
          0x20, 0x6F, 0x62, 0x6A, 0x0A, 0x3C, 0x3C, 0x2F, 0x54, 0x79, 0x70, 0x65,
          0x2F, 0x50, 0x61, 0x67, 0x65, 0x2F, 0x50, 0x61, 0x72, 0x65, 0x6E, 0x74,
          0x20, 0x32, 0x20, 0x30, 0x20, 0x52, 0x2F, 0x4D, 0x65, 0x64, 0x69, 0x61,
          0x42, 0x6F, 0x78, 0x5B, 0x30, 0x20, 0x30, 0x20, 0x33, 0x20, 0x33, 0x5D,
          0x2F, 0x43, 0x6F, 0x6E, 0x74, 0x65, 0x6E, 0x74, 0x73, 0x20, 0x34, 0x20,
          0x30, 0x20, 0x52, 0x3E, 0x3E, 0x0A, 0x65, 0x6E, 0x64, 0x6F, 0x62, 0x6A,
          0x0A, 0x34, 0x20, 0x30, 0x20, 0x6F, 0x62, 0x6A, 0x0A, 0x3C, 0x3C, 0x2F,
          0x4C, 0x65, 0x6E, 0x67, 0x74, 0x68, 0x20, 0x31, 0x30, 0x3E, 0x3E, 0x73,
          0x74, 0x72, 0x65, 0x61, 0x6D, 0x0A, 0x42, 0x54, 0x0A, 0x2F, 0x46, 0x31,
          0x20, 0x39, 0x20, 0x54, 0x66, 0x0A, 0x31, 0x20, 0x30, 0x20, 0x30, 0x20, 0x31,
          0x20, 0x31, 0x20, 0x32, 0x20, 0x54, 0x6D, 0x0A, 0x28, 0x29, 0x54, 0x6A,
          0x0A, 0x45, 0x54, 0x0A, 0x65, 0x6E, 0x64, 0x73, 0x74, 0x72, 0x65, 0x61,
          0x6D, 0x0A, 0x65, 0x6E, 0x64, 0x6F, 0x62, 0x6A, 0x0A, 0x78, 0x72, 0x65,
          0x66, 0x0A, 0x30, 0x20, 0x35, 0x0A, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30,
          0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x36, 0x35, 0x35, 0x33, 0x35, 0x20,
          0x66, 0x0A, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x31, 0x38,
          0x20, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x6E, 0x0A, 0x30, 0x30, 0x30,
          0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x37, 0x37, 0x20, 0x30, 0x30, 0x30,
          0x30, 0x30, 0x30, 0x20, 0x6E, 0x0A, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30,
          0x30, 0x31, 0x37, 0x38, 0x20, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30,
          0x33, 0x30, 0x38, 0x20, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x6E, 0x0A,
          0x74, 0x72, 0x61, 0x69, 0x6C, 0x65, 0x72, 0x0A, 0x3C, 0x3C, 0x2F, 0x53,
          0x69, 0x7A, 0x65, 0x20, 0x35, 0x2F, 0x52, 0x6F, 0x6F, 0x74, 0x20, 0x31,
          0x20, 0x30, 0x20, 0x52, 0x3E, 0x3E, 0x0A, 0x73, 0x74, 0x61, 0x72, 0x74,
          0x78, 0x72, 0x65, 0x66, 0x0A, 0x34, 0x30, 0x36, 0x0A, 0x25, 0x25, 0x45,
          0x4F, 0x46
        ]);
        
        // Try to create a simple document to test the worker
        try {
          const loadingTask = pdfjsLib.getDocument({
            data: minimalPdf,
            cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/cmaps/`,
            cMapPacked: true,
            standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/standard_fonts/`
          });
          
          const testDoc = await loadingTask.promise;
          console.log("Worker test successful:", testDoc);
          return true;
        } catch (testError) {
          console.error("Worker test failed:", testError);
          setError(`PDF.js worker failed to load: ${testError.message}. Try refreshing the page.`);
          return false;
        }
      } catch (error) {
        console.error("Worker initialization failed:", error);
        setError(`PDF.js worker initialization failed: ${error.message}. Try refreshing the page.`);
        return false;
      }
    };
    
    checkWorker().then(result => {
      if (!result) {
        setIsLoading(false);
      }
    });
  }, []);

  // Add this before the return statement
  // Tool options configuration
  const toolOptions = [
    { id: 'cursor', icon: <FaArrowsAlt /> },
    { id: 'text', icon: <FaFont /> },
    { id: 'draw', icon: <FaPenNib /> },
    { id: 'shape', icon: <FaDrawPolygon /> },
    { id: 'highlight', icon: <FaHighlighter /> },
    { id: 'image', icon: <FaImage /> },
    { id: 'stamp', icon: <FaStamp /> },
    { id: 'erase', icon: <FaEraser /> }
  ];

  // Update handleCanvasClick to properly handle text insertion
  const handleCanvasClick = (e) => {
    // Skip if in shape drawing mode
    if (isDrawingShape) return;
    
    // Handle adding text on click when in text mode
    if (activeToolMode === 'text' && fabricCanvas.current) {
      // Get click coordinates relative to canvas
      const canvas = fabricCanvas.current.upperCanvasEl;
      const rect = canvas.getBoundingClientRect();
      
      // Calculate position, accounting for scroll
      const x = e.clientX - rect.left + canvas.parentElement.scrollLeft;
      const y = e.clientY - rect.top + canvas.parentElement.scrollTop;
      
      // Add text at click position
      console.log("Adding text at", x, y);
      addTextBox(x, y);
    }
  };

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setSidebarVisible(prev => !prev);
  };

  // Add zoom control functions
  const zoomIn = () => {
    setScale(prev => {
      const newScale = Math.min(5, prev + 0.25); // Cap at 5x zoom
      return newScale;
    });
  };
  
  const zoomOut = () => {
    setScale(prev => {
      const newScale = Math.max(0.5, prev - 0.25); // Minimum 0.5x zoom
      return newScale;
    });
  };
  
  // Optimize the fitToWidth function to make it faster and more reliable
  const fitToWidth = () => {
    try {
      if (!containerRef.current || pdfPageImages.length === 0) {
        console.log("Cannot fit to width: container or page images not available");
        return;
      }
      
      setIsLoading(true);
      
      // Use setTimeout to allow the loading indicator to appear
      setTimeout(() => {
        try {
          // Get available container width with minimal padding
          const containerWidth = containerRef.current.clientWidth - 20; // 10px padding on each side
          const pageIndex = currentPage - 1;
          
          if (pageIndex < 0 || pageIndex >= pdfPageImages.length) {
            console.error("Invalid page index for fit to width");
            setIsLoading(false);
            return;
          }
          
          const pageInfo = pdfPageImages[pageIndex];
          
          // Get the original width of the PDF page
          const pageWidth = pageInfo.originalWidth;
          
          if (!pageWidth) {
            console.error("Cannot determine page width for fit to width");
            setIsLoading(false);
            return;
          }
          
          // Calculate the exact scale needed to fit the PDF to the container width
          // This is a direct 1:1 calculation with no additional scaling factors
          const exactScale = containerWidth / pageWidth;
          
          // Log the scale we're applying for debugging
          console.log(`Fit to width: container=${containerWidth}px, page=${pageWidth}px, scale=${exactScale}`);
          
          // Apply the new scale
          setScale(exactScale);
          
          // Ensure we scroll to the top after scaling
          if (containerRef.current) {
            setTimeout(() => {
              containerRef.current.scrollTop = 0;
            }, 50);
          }
          
          setIsLoading(false);
        } catch (error) {
          console.error("Error in fitToWidth:", error);
          setIsLoading(false);
        }
      }, 10);
    } catch (error) {
      console.error("Error in fitToWidth:", error);
      setIsLoading(false);
    }
  };

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
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage <= 1}
                className={styles.button}
              >
                Previous
              </button>
              <span className="text-white">
                Page {currentPage} of {pageCount}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(pageCount, prev + 1))}
                disabled={currentPage >= pageCount}
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
                        onChange={(e) => setDrawingOptions({...drawingOptions, color: e.target.value})}
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
                              setDrawingOptions({
                                ...drawingOptions,
                                fillEnabled: isEnabled,
                                fill: isEnabled ? drawingOptions.fill : 'transparent'
                              });
                            }}
                          />
                          <span className={styles.slider}></span>
                        </label>
                      </div>
                      <input
                        type="color"
                        value={drawingOptions.fill === 'transparent' ? '#ffffff' : drawingOptions.fill}
                        onChange={(e) => setDrawingOptions({
                          ...drawingOptions,
                          fill: drawingOptions.fillEnabled ? e.target.value : 'transparent'
                        })}
                        disabled={!drawingOptions.fillEnabled}
                        className={styles.colorInput}
                      />
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
                    onClick={() => addShape('rect')} 
                    className={`${styles.shapeButton} ${currentShapeType === 'rect' && isDrawingShape ? styles.activeShape : ''}`}
                    title="Rectangle"
                    disabled={isDrawingShape}
                  >
                    <FaRegSquare />
                  </button>
                  <button 
                    onClick={() => addShape('square')} 
                    className={`${styles.shapeButton} ${currentShapeType === 'square' && isDrawingShape ? styles.activeShape : ''}`}
                    title="Square"
                    disabled={isDrawingShape}
                  >
                    <FaSquare />
                  </button>
                  <button 
                    onClick={() => addShape('circle')} 
                    className={`${styles.shapeButton} ${currentShapeType === 'circle' && isDrawingShape ? styles.activeShape : ''}`}
                    title="Circle"
                    disabled={isDrawingShape}
                  >
                    <FaRegCircle />
                  </button>
                  <button 
                    onClick={() => addShape('ellipse')} 
                    className={`${styles.shapeButton} ${currentShapeType === 'ellipse' && isDrawingShape ? styles.activeShape : ''}`}
                    title="Ellipse"
                    disabled={isDrawingShape}
                  >
                    <FaCircle />
                  </button>
                  <button 
                    onClick={() => addShape('triangle')} 
                    className={`${styles.shapeButton} ${currentShapeType === 'triangle' && isDrawingShape ? styles.activeShape : ''}`}
                    title="Triangle"
                    disabled={isDrawingShape}
                  >
                    <div className={styles.triangleIcon}></div>
                  </button>
                  <button 
                    onClick={() => addShape('arrow')} 
                    className={`${styles.shapeButton} ${currentShapeType === 'arrow' && isDrawingShape ? styles.activeShape : ''}`}
                    title="Arrow"
                    disabled={isDrawingShape}
                  >
                    <FaLongArrowAltRight />
                  </button>
                  <button 
                    onClick={() => addShape('line')} 
                    className={`${styles.shapeButton} ${currentShapeType === 'line' && isDrawingShape ? styles.activeShape : ''}`}
                    title="Line"
                    disabled={isDrawingShape}
                  >
                    <div className={styles.lineIcon}></div>
                  </button>
                  <button 
                    onClick={() => addShape('star')} 
                    className={`${styles.shapeButton} ${currentShapeType === 'star' && isDrawingShape ? styles.activeShape : ''}`}
                    title="Star"
                    disabled={isDrawingShape}
                  >
                    <FaRegStar />
                  </button>
                  <button 
                    onClick={() => addShape('heart')} 
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
                onClick={handleCanvasClick}
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