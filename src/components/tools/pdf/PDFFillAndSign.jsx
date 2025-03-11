import React, { useState, useRef, useEffect } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { 
  FaPen, 
  FaFont, 
  FaSignature, 
  FaCheck, 
  FaUpload,
  FaDownload,
  FaUndo,
  FaRedo,
  FaTrash,
  FaMagic,
  FaImage,
  FaStamp,
  FaCalendar,
  FaPalette,
  FaMousePointer,
  FaDrawPolygon
} from 'react-icons/fa';

const PDFFillAndSign = () => {
  // State for PDF document and pages
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfName, setPdfName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  
  // Drawing and editing states
  const [tool, setTool] = useState('cursor'); // cursor, text, draw, signature, image, date
  const [color, setColor] = useState('#000000');
  const [fontSize, setFontSize] = useState(16);
  const [lineWidth, setLineWidth] = useState(2);
  const [isDrawing, setIsDrawing] = useState(false);
  const [elements, setElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  
  // Signature states
  const [signatures, setSignatures] = useState([]);
  const [currentSignature, setCurrentSignature] = useState(null);
  const [isDrawingSignature, setIsDrawingSignature] = useState(false);
  
  // Form field states
  const [formFields, setFormFields] = useState([]);
  const [selectedField, setSelectedField] = useState(null);
  
  // Canvas refs
  const canvasRef = useRef(null);
  const signatureCanvasRef = useRef(null);
  
  // Load PDF.js
  useEffect(() => {
    const loadPdfJS = async () => {
      if (!window.pdfjsLib) {
        try {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.7.107/pdf.min.js';
          script.async = true;
          document.body.appendChild(script);
          
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
          });
          
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.7.107/pdf.worker.min.js';
        } catch (err) {
          console.error('Failed to load PDF.js:', err);
        }
      }
    };
    
    loadPdfJS();
  }, []);
  
  // Handle file selection
  const handleFileSelect = async (event) => {
    const file = event.target?.files?.[0];
    if (!file) return;
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPageCount();
      
      setPdfFile(file);
      setPdfName(file.name);
      setTotalPages(pages);
      setCurrentPage(1);
      setElements([]);
      setUndoStack([]);
      setRedoStack([]);
      
      // Load and detect form fields
      const formFields = await detectFormFields(arrayBuffer);
      setFormFields(formFields);
      
      // Render first page
      renderPage(1, arrayBuffer);
      
    } catch (err) {
      console.error('Error loading PDF:', err);
    }
  };
  
  // Detect form fields in PDF
  const detectFormFields = async (arrayBuffer) => {
    try {
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const page = await pdf.getPage(1);
      const annotations = await page.getAnnotations();
      
      return annotations
        .filter(annot => annot.subtype === 'Widget')
        .map(field => ({
          id: field.id,
          type: field.fieldType,
          name: field.fieldName,
          value: field.fieldValue,
          rect: field.rect,
          page: 1
        }));
    } catch (err) {
      console.error('Error detecting form fields:', err);
      return [];
    }
  };
  
  // Initialize signature canvas
  useEffect(() => {
    if (signatureCanvasRef.current) {
      const canvas = signatureCanvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Set canvas size
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      
      // Set drawing style
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, [isDrawingSignature]);

  // Render elements on canvas
  const renderElements = (context) => {
    elements.forEach(element => {
      switch (element.type) {
        case 'text':
          context.font = `${element.fontSize}px ${element.font}`;
          context.fillStyle = element.color;
          context.fillText(element.text, element.x, element.y);
          break;
        case 'path':
          if (element.points.length < 2) return;
          context.beginPath();
          context.strokeStyle = element.color;
          context.lineWidth = element.lineWidth;
          context.moveTo(element.points[0].x, element.points[0].y);
          element.points.slice(1).forEach(point => {
            context.lineTo(point.x, point.y);
          });
          context.stroke();
          break;
        case 'signature':
          if (element.image) {
            const img = new Image();
            img.src = element.image;
            img.onload = () => {
              context.drawImage(img, element.x, element.y, element.width, element.height);
            };
          }
          break;
      }
    });
  };

  // Handle page change
  useEffect(() => {
    if (pdfFile) {
      const loadPage = async () => {
        try {
          const arrayBuffer = await pdfFile.arrayBuffer();
          await renderPage(currentPage, arrayBuffer);
        } catch (err) {
          console.error('Error loading page:', err);
        }
      };
      loadPage();
    }
  }, [currentPage, scale, rotation]);

  // Handle signature drawing
  const [signaturePoints, setSignaturePoints] = useState([]);

  const startSignatureDraw = (e) => {
    const canvas = signatureCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawingSignature(true);
    setSignaturePoints([{ x, y }]);
  };

  const drawSignature = (e) => {
    if (!isDrawingSignature) return;
    
    const canvas = signatureCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setSignaturePoints(prev => {
      const newPoints = [...prev, { x, y }];
      
      // Draw the signature
      ctx.beginPath();
      ctx.moveTo(prev[prev.length - 1].x, prev[prev.length - 1].y);
      ctx.lineTo(x, y);
      ctx.stroke();
      
      return newPoints;
    });
  };

  const endSignatureDraw = () => {
    setIsDrawingSignature(false);
  };

  // Update renderPage function
  const renderPage = async (pageNum, buffer) => {
    if (!canvasRef.current) return;
    
    try {
      const pdf = await window.pdfjsLib.getDocument({ data: buffer }).promise;
      const page = await pdf.getPage(pageNum);
      
      // Calculate scale to fit the canvas width while maintaining aspect ratio
      const viewport = page.getViewport({ scale: 1, rotation });
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      // Set canvas size to match viewport
      const containerWidth = canvas.parentElement.offsetWidth;
      const desiredWidth = containerWidth - 40; // Add some padding
      const scaleFactor = desiredWidth / viewport.width;
      const scaledViewport = page.getViewport({ scale: scaleFactor * scale, rotation });
      
      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;
      
      // Render PDF page
      await page.render({
        canvasContext: context,
        viewport: scaledViewport
      }).promise;
      
      // Render elements on top
      renderElements(context);
      
    } catch (err) {
      console.error('Error rendering page:', err);
    }
  };
  
  // Handle drawing
  const startDrawing = (e) => {
    if (tool !== 'draw') return;
    
    const { offsetX, offsetY } = e.nativeEvent;
    setIsDrawing(true);
    
    const newElement = {
      type: 'path',
      points: [{ x: offsetX, y: offsetY }],
      color,
      lineWidth
    };
    
    setElements(prev => [...prev, newElement]);
    setUndoStack(prev => [...prev, elements]);
    setRedoStack([]);
  };
  
  const draw = (e) => {
    if (!isDrawing || tool !== 'draw') return;
    
    const { offsetX, offsetY } = e.nativeEvent;
    
    setElements(prev => {
      const lastElement = prev[prev.length - 1];
      const newPoints = [...lastElement.points, { x: offsetX, y: offsetY }];
      return [
        ...prev.slice(0, -1),
        { ...lastElement, points: newPoints }
      ];
    });
  };
  
  const stopDrawing = () => {
    setIsDrawing(false);
  };
  
  // Handle text addition
  const addText = (e) => {
    if (tool !== 'text') return;
    
    const { offsetX, offsetY } = e.nativeEvent;
    const text = window.prompt('Enter text:');
    
    if (text) {
      const newElement = {
        type: 'text',
        x: offsetX,
        y: offsetY,
        text,
        color,
        fontSize,
        font: 'Arial'
      };
      
      setElements(prev => [...prev, newElement]);
      setUndoStack(prev => [...prev, elements]);
      setRedoStack([]);
    }
  };
  
  // Handle signature
  const startSignature = () => {
    setIsDrawingSignature(true);
  };
  
  const addSignature = (signature) => {
    if (!signature) return;
    
    setSignatures(prev => [...prev, signature]);
    setCurrentSignature(signature);
    setTool('cursor');
    setIsDrawingSignature(false);
  };
  
  // Handle undo/redo
  const undo = () => {
    if (undoStack.length === 0) return;
    
    const previousElements = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, elements]);
    setElements(previousElements);
    setUndoStack(prev => prev.slice(0, -1));
  };
  
  const redo = () => {
    if (redoStack.length === 0) return;
    
    const nextElements = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, elements]);
    setElements(nextElements);
    setRedoStack(prev => prev.slice(0, -1));
  };
  
  // Save PDF with annotations
  const savePDF = async () => {
    if (!pdfFile) return;
    
    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      const page = pages[currentPage - 1];
      
      // Add elements to PDF
      for (const element of elements) {
        switch (element.type) {
          case 'text':
            page.drawText(element.text, {
              x: element.x,
              y: page.getHeight() - element.y,
              size: element.fontSize,
              color: rgb(0, 0, 0)
            });
            break;
          case 'path':
            // Convert path to PDF drawing
            break;
          case 'signature':
            // Add signature image
            break;
        }
      }
      
      const modifiedPdf = await pdfDoc.save();
      const blob = new Blob([modifiedPdf], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `signed_${pdfName}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error('Error saving PDF:', err);
    }
  };

  return (
    <div className="flex flex-col space-y-6 bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
      {/* Header */}
      <div className="bg-gray-900 p-4 flex items-center space-x-4 rounded-t-xl">
        <div className="bg-purple-600 p-2 rounded-md">
          <FaPen className="text-white text-xl" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Fill & Sign PDF</h2>
          <p className="text-gray-300 text-sm">Add text, signatures, and fill forms in your PDF</p>
        </div>
      </div>

      {/* Main content */}
      <div className="bg-white dark:bg-gray-700 rounded-xl shadow-md overflow-hidden">
        {/* File upload */}
        {!pdfFile && (
          <div className="p-8 text-center">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
              id="pdf-upload"
            />
            <label
              htmlFor="pdf-upload"
              className="cursor-pointer inline-flex flex-col items-center"
            >
              <FaUpload className="text-4xl text-gray-400 mb-4" />
              <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
                Upload PDF to Fill & Sign
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Click to browse or drag and drop
              </span>
            </label>
          </div>
        )}

        {/* Editor */}
        {pdfFile && (
          <div className="flex flex-col md:flex-row">
            {/* Toolbar */}
            <div className="w-full md:w-64 p-4 border-b md:border-r border-gray-200 dark:border-gray-600">
              <div className="space-y-4">
                {/* Tools */}
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => setTool('cursor')}
                    className={`p-2 rounded-lg flex flex-col items-center ${
                      tool === 'cursor' ? 'bg-purple-100 text-purple-600' : 'text-gray-600'
                    }`}
                  >
                    <FaMousePointer className="text-xl" />
                    <span className="text-xs mt-1">Select</span>
                  </button>
                  <button
                    onClick={() => setTool('text')}
                    className={`p-2 rounded-lg flex flex-col items-center ${
                      tool === 'text' ? 'bg-purple-100 text-purple-600' : 'text-gray-600'
                    }`}
                  >
                    <FaFont className="text-xl" />
                    <span className="text-xs mt-1">Text</span>
                  </button>
                  <button
                    onClick={() => setTool('draw')}
                    className={`p-2 rounded-lg flex flex-col items-center ${
                      tool === 'draw' ? 'bg-purple-100 text-purple-600' : 'text-gray-600'
                    }`}
                  >
                    <FaPen className="text-xl" />
                    <span className="text-xs mt-1">Draw</span>
                  </button>
                  <button
                    onClick={startSignature}
                    className={`p-2 rounded-lg flex flex-col items-center ${
                      tool === 'signature' ? 'bg-purple-100 text-purple-600' : 'text-gray-600'
                    }`}
                  >
                    <FaSignature className="text-xl" />
                    <span className="text-xs mt-1">Sign</span>
                  </button>
                </div>

                {/* Style controls */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Color
                    </label>
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-full h-8 rounded cursor-pointer"
                    />
                  </div>
                  
                  {tool === 'text' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Font Size
                      </label>
                      <input
                        type="range"
                        min="8"
                        max="72"
                        value={fontSize}
                        onChange={(e) => setFontSize(parseInt(e.target.value))}
                        className="w-full"
                      />
                      <span className="text-sm text-gray-500">{fontSize}px</span>
                    </div>
                  )}
                  
                  {tool === 'draw' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Line Width
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={lineWidth}
                        onChange={(e) => setLineWidth(parseInt(e.target.value))}
                        className="w-full"
                      />
                      <span className="text-sm text-gray-500">{lineWidth}px</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={undo}
                    disabled={undoStack.length === 0}
                    className="flex-1 py-2 px-3 rounded-lg bg-gray-100 text-gray-700 disabled:opacity-50"
                  >
                    <FaUndo className="inline-block mr-1" /> Undo
                  </button>
                  <button
                    onClick={redo}
                    disabled={redoStack.length === 0}
                    className="flex-1 py-2 px-3 rounded-lg bg-gray-100 text-gray-700 disabled:opacity-50"
                  >
                    <FaRedo className="inline-block mr-1" /> Redo
                  </button>
                </div>

                {/* Save button */}
                <button
                  onClick={savePDF}
                  className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <FaDownload className="inline-block mr-2" />
                  Save PDF
                </button>
              </div>
            </div>

            {/* Canvas area */}
            <div className="flex-1 p-4">
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onClick={addText}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg"
                />
                
                {/* Page navigation */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg px-4 py-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="text-gray-600 dark:text-gray-400 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="text-gray-600 dark:text-gray-400 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Signature dialog */}
      {isDrawingSignature && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-96">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Draw Your Signature
            </h3>
            <canvas
              ref={signatureCanvasRef}
              onMouseDown={startSignatureDraw}
              onMouseMove={drawSignature}
              onMouseUp={endSignatureDraw}
              onMouseLeave={endSignatureDraw}
              className="border border-gray-200 dark:border-gray-600 rounded-lg w-full h-32 mb-4 cursor-crosshair"
            />
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  const canvas = signatureCanvasRef.current;
                  const ctx = canvas.getContext('2d');
                  ctx.clearRect(0, 0, canvas.width, canvas.height);
                  setSignaturePoints([]);
                }}
                className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear
              </button>
              <button
                onClick={() => {
                  const canvas = signatureCanvasRef.current;
                  if (signaturePoints.length > 0) {
                    const signature = canvas.toDataURL();
                    addSignature(signature);
                  }
                }}
                className="flex-1 py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFFillAndSign; 