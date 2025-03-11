import React, { useState, useRef, useEffect, Component } from 'react';
import { fabric } from 'fabric-pure-browser';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';
import { FaEdit, FaImage, FaSignature, FaDrawPolygon, FaHighlighter, 
  FaFont, FaEraser, FaPenNib, FaRegComment, FaPaperclip, FaSave, 
  FaUpload, FaUndo, FaRedo, FaSearch, FaArrowsAlt, FaStamp } from 'react-icons/fa';
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
    color: '#000000'
  });
  const [drawingOptions, setDrawingOptions] = useState({
    color: '#000000',
    width: 2,
    opacity: 1
  });
  
  // Available fonts
  const availableFonts = [
    { name: 'Helvetica', value: 'Helvetica' },
    { name: 'Times Roman', value: 'Times-Roman' },
    { name: 'Courier', value: 'Courier' }
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
  
  // Initialize fabric canvas
  useEffect(() => {
    // Only initialize when the canvas element is available and we have a PDF loaded
    if (overlayCanvasRef.current && !fabricCanvas.current && pdfPageImages.length > 0) {
      try {
        // Create a new Fabric.js canvas
        const canvas = new fabric.Canvas(overlayCanvasRef.current, {
          isDrawingMode: false,
          selection: true,
          width: pdfPageImages[currentPage - 1]?.width || 800,
          height: pdfPageImages[currentPage - 1]?.height || 600
        });
        
        // Store the canvas in the ref
        fabricCanvas.current = canvas;
        
        // Set up event listeners
        canvas.on('object:modified', handleObjectModified);
        canvas.on('path:created', handlePathCreated);
        
        // Initialize drawing brush - only if the canvas is properly initialized
        if (canvas.freeDrawingBrush) {
          canvas.freeDrawingBrush.color = drawingOptions.color;
          canvas.freeDrawingBrush.width = drawingOptions.width;
        }
        
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
      
      console.log("Worker source:", pdfjsLib.GlobalWorkerOptions.workerSrc);
      
      // Read the file - create separate copies for PDF.js and pdf-lib
      const fileData = await file.arrayBuffer();
      
      // Create a copy of the ArrayBuffer for PDF.js
      const pdfJsBuffer = new Uint8Array(fileData.slice(0));
      
      // Create a copy of the ArrayBuffer for pdf-lib
      const pdfLibBuffer = new Uint8Array(fileData.slice(0));
      
      // Load the PDF with PDF.js
      try {
        const loadingTask = pdfjsLib.getDocument({
          data: pdfJsBuffer,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
          cMapPacked: true,
          standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/standard_fonts/'
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
        
        // Create PDF document with pdf-lib for later saving
        try {
          const pdfDoc = await PDFDocument.load(pdfLibBuffer);
          setPdfFile(pdfDoc);
          setPdfName(file.name);
          
          // Render the first page
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
  
  // Update the renderPage function to use Fabric.js
  const renderPage = async (pdf, pageNumber) => {
    try {
      if (!pdf) {
        console.error("No PDF document available");
        return;
      }
      
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: scale });
      
      // Get the canvas element
      const canvas = canvasRef.current;
      if (!canvas) {
        console.error("Canvas element not found");
        return;
      }
      
      // Set canvas dimensions to match the viewport
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      // Prepare canvas for rendering
      const context = canvas.getContext('2d');
      if (!context) {
        console.error("Could not get canvas context");
        return;
      }
      
      console.log(`Rendering page ${pageNumber} with scale ${scale}`);
      
      // Render the page
      try {
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;
        
        console.log(`Page ${pageNumber} rendered successfully`);
        
        // Store the rendered page image to prevent it from disappearing
        const pageImage = canvas.toDataURL('image/png');
        setPdfPageImages(prev => {
          const newImages = [...prev];
          newImages[pageNumber - 1] = {
            url: pageImage,
            width: viewport.width,
            height: viewport.height
          };
          return newImages;
        });
        
        // Set up the overlay canvas for annotations
        const overlay = overlayCanvasRef.current;
        if (overlay) {
          overlay.width = viewport.width;
          overlay.height = viewport.height;
        }
        
        // Store the rendered page
        setRenderedPage(pageNumber);
      } catch (renderError) {
        console.error("Error rendering page:", renderError);
        setError(`Failed to render page ${pageNumber}: ${renderError.message}`);
      }
    } catch (pageError) {
      console.error("Error getting page:", pageError);
      setError(`Failed to get page ${pageNumber}: ${pageError.message}`);
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
    
    const context = canvas.getContext('2d');
    const pageIndex = currentPage - 1;
    
    if (pageIndex < 0 || pageIndex >= pdfPageImages.length) {
      console.error('Invalid page index:', pageIndex);
      return;
    }
    
    // Create an image from the stored data URL
    const img = new Image();
    img.onload = () => {
      // Calculate dimensions
      const originalWidth = img.width;
      const originalHeight = img.height;
      
      // Apply scale
      const scaledWidth = originalWidth * scale;
      const scaledHeight = originalHeight * scale;
      
      // Set canvas dimensions
      canvas.width = scaledWidth;
      canvas.height = scaledHeight;
      
      // Clear canvas
      context.clearRect(0, 0, canvas.width, canvas.height);
      
      // Save context state for rotation
      context.save();
      
      // Apply rotation if needed
      if (rotation !== 0) {
        context.translate(scaledWidth / 2, scaledHeight / 2);
        context.rotate((rotation * Math.PI) / 180);
        context.translate(-scaledWidth / 2, -scaledHeight / 2);
      }
      
      // Draw the image
      context.drawImage(img, 0, 0, scaledWidth, scaledHeight);
      
      // Restore context state
      context.restore();
      
      // Draw any annotations
      renderAnnotations(context);
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
    if (!pdfDoc) {
      setError("Please open a PDF file first.");
      return;
    }
    
    setActiveToolMode(toolId);
    
    if (fabricCanvas.current) {
      // Update Fabric.js canvas mode
      switch (toolId) {
        case 'draw':
          fabricCanvas.current.isDrawingMode = true;
          if (fabricCanvas.current.freeDrawingBrush) {
            fabricCanvas.current.freeDrawingBrush.color = drawingOptions.color;
            fabricCanvas.current.freeDrawingBrush.width = drawingOptions.width;
          }
          break;
        case 'text':
          fabricCanvas.current.isDrawingMode = false;
          // Don't call addTextBox here, let the user click where they want to add text
          break;
        case 'shape':
          fabricCanvas.current.isDrawingMode = false;
          break;
        case 'image':
          fabricCanvas.current.isDrawingMode = false;
          break;
        default:
          fabricCanvas.current.isDrawingMode = false;
      }
      
      // Render the canvas
      fabricCanvas.current.renderAll();
    }
  };
  
  // Add text box to canvas
  const addTextBox = (x = 100, y = 100) => {
    if (!fabricCanvas.current) {
      console.error("Fabric canvas not initialized");
      return;
    }
    
    const text = new fabric.IText('Edit this text', {
      left: x,
      top: y,
      fontFamily: textOptions.font,
      fontSize: textOptions.size,
      fill: textOptions.color,
      editable: true
    });
    
    fabricCanvas.current.add(text);
    fabricCanvas.current.setActiveObject(text);
    fabricCanvas.current.renderAll();
    addToUndoStack();
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
  
  // Add shape
  const addShape = (type) => {
    let shape;
    
    switch (type) {
      case 'rect':
        shape = new fabric.Rect({
          left: 50,
          top: 50,
          width: 100,
          height: 100,
          fill: 'transparent',
          stroke: drawingOptions.color,
          strokeWidth: drawingOptions.width
        });
        break;
      case 'circle':
        shape = new fabric.Circle({
          left: 50,
          top: 50,
          radius: 50,
          fill: 'transparent',
          stroke: drawingOptions.color,
          strokeWidth: drawingOptions.width
        });
        break;
      case 'arrow':
        // Create custom arrow shape
        const points = [0, 0, 100, 0, 95, -5, 100, 0, 95, 5];
        shape = new fabric.Polyline(points, {
          left: 50,
          top: 50,
          stroke: drawingOptions.color,
          strokeWidth: drawingOptions.width,
          fill: 'transparent',
          originX: 'left',
          originY: 'center'
        });
        break;
    }
    
    if (shape) {
      fabricCanvas.current.add(shape);
      fabricCanvas.current.setActiveObject(shape);
      addToUndoStack();
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
      const json = fabricCanvas.current.toJSON();
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
          0x20, 0x39, 0x20, 0x54, 0x66, 0x0A, 0x31, 0x20, 0x30, 0x20, 0x30, 0x20,
          0x31, 0x20, 0x31, 0x20, 0x32, 0x20, 0x54, 0x6D, 0x0A, 0x28, 0x29, 0x54,
          0x6A, 0x0A, 0x45, 0x54, 0x0A, 0x65, 0x6E, 0x64, 0x73, 0x74, 0x72, 0x65,
          0x61, 0x6D, 0x0A, 0x65, 0x6E, 0x64, 0x6F, 0x62, 0x6A, 0x0A, 0x78, 0x72,
          0x65, 0x66, 0x0A, 0x30, 0x20, 0x35, 0x0A, 0x30, 0x30, 0x30, 0x30, 0x30,
          0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x36, 0x35, 0x35, 0x33, 0x35, 0x20,
          0x66, 0x0A, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x31, 0x38,
          0x20, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x6E, 0x0A, 0x30, 0x30, 0x30,
          0x30, 0x30, 0x30, 0x30, 0x30, 0x37, 0x37, 0x20, 0x30, 0x30, 0x30, 0x30,
          0x30, 0x20, 0x6E, 0x0A, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x31,
          0x37, 0x38, 0x20, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x6E, 0x0A, 0x30,
          0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x33, 0x30, 0x38, 0x20, 0x30, 0x30,
          0x30, 0x30, 0x30, 0x20, 0x6E, 0x0A, 0x74, 0x72, 0x61, 0x69, 0x6C, 0x65,
          0x72, 0x0A, 0x3C, 0x3C, 0x2F, 0x53, 0x69, 0x7A, 0x65, 0x20, 0x35, 0x2F,
          0x52, 0x6F, 0x6F, 0x74, 0x20, 0x31, 0x20, 0x30, 0x20, 0x52, 0x3E, 0x3E, 0x0A,
          0x73, 0x74, 0x61, 0x72, 0x74, 0x78, 0x72, 0x65, 0x66, 0x0A, 0x34, 0x30, 0x36,
          0x0A, 0x25, 0x25, 0x45, 0x4F, 0x46
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

  // Handle canvas click
  const handleCanvasClick = (e) => {
    if (!pdfDoc || !fabricCanvas.current) {
      return;
    }
    
    if (activeToolMode === 'text') {
      try {
        // Get click position relative to the canvas
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Add text at click position
        addTextBox(x, y);
      } catch (error) {
        console.error("Error adding text:", error);
      }
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
                onClick={() => setScale(prev => Math.max(0.5, prev - 0.1))}
                className={styles.toolButton}
                title="Zoom Out"
              >
                -
              </button>
              <span className="text-white">{Math.round(scale * 100)}%</span>
              <button
                onClick={() => setScale(prev => Math.min(2, prev + 0.1))}
                className={styles.toolButton}
                title="Zoom In"
              >
                +
              </button>
            </div>
          </div>
        </div>
        
        {/* Main editor area */}
        <div className={styles.mainContent}>
          {/* Tools sidebar */}
          <div className={styles.sidebar}>
            {/* Tool-specific options */}
            {activeToolMode === 'text' && (
              <div className={styles.sidebarSection}>
                <h3 className={styles.sidebarTitle}>Text Options</h3>
                <select
                  value={textOptions.font}
                  onChange={(e) => setTextOptions({...textOptions, font: e.target.value})}
                  className={styles.select}
                >
                  {availableFonts.map(font => (
                    <option key={font.value} value={font.value}>{font.name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={textOptions.size}
                  onChange={(e) => setTextOptions({...textOptions, size: parseInt(e.target.value)})}
                  className={styles.input}
                  min="8"
                  max="72"
                />
                <input
                  type="color"
                  value={textOptions.color}
                  onChange={(e) => setTextOptions({...textOptions, color: e.target.value})}
                  className={styles.input}
                />
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
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => addShape('rect')} className={styles.button}>Rectangle</button>
                  <button onClick={() => addShape('circle')} className={styles.button}>Circle</button>
                  <button onClick={() => addShape('arrow')} className={styles.button}>Arrow</button>
                </div>
              </div>
            )}
            
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
          
          {/* Canvas area */}
          <div className={styles.canvasContainer} ref={containerRef}>
            <div 
              className={styles.canvasWrapper}
              onClick={handleCanvasClick}
            >
              {/* PDF Rendering Canvas */}
              <canvas 
                ref={canvasRef} 
                className={styles.pdfCanvas} 
              />
              
              {/* If we have a rendered page image, display it as a fallback */}
              {pdfPageImages[currentPage - 1]?.url && (
                <div 
                  className={styles.pdfImageFallback}
                  style={{
                    backgroundImage: `url(${pdfPageImages[currentPage - 1].url})`,
                    width: pdfPageImages[currentPage - 1].width,
                    height: pdfPageImages[currentPage - 1].height,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    zIndex: 1
                  }}
                />
              )}
              
              {/* Overlay Canvas for Fabric.js */}
              <canvas 
                ref={overlayCanvasRef} 
                className={styles.overlayCanvas}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  zIndex: 2,
                  pointerEvents: 'auto'
                }}
              />
            </div>
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