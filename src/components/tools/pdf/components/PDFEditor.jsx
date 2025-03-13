import React, { useState, useRef, useCallback, useEffect } from 'react';
import { fabric } from 'fabric-pure-browser';
import styles from '../PDFEditor.module.css';

// Import custom hooks
import usePdfDocument from '../hooks/usePdfDocument';
import useFabricCanvas from '../hooks/useFabricCanvas';
import useUndoRedo from '../hooks/useUndoRedo';

// Import components
import ErrorBoundary from './ErrorBoundary';
import Toolbar from './Toolbar';
import PageNavigation from './PageNavigation';
import TextEditor from './TextEditor';
import LayerManager from './LayerManager';
import SettingsPanel from './SettingsPanel';

// Import constants
import { TOOL_MODES } from '../utils/constants';

/**
 * PDFEditor component that orchestrates PDF viewing and editing
 */
const PDFEditor = () => {
  // Get PDF document functionality from hook
  const {
    pdfDoc,
    pdfFile,
    pdfName,
    pageCount,
    currentPage,
    pdfPageImages,
    isLoading,
    error,
    scale,
    rotation,
    loadPDF,
    changePage,
    getCurrentPageData,
    exportPDF,
    zoom,
    rotate,
    setError
  } = usePdfDocument();

  // Get canvas functionality from hook
  const {
    canvasRef,
    fabricCanvas,
    selectedObject,
    initCanvas,
    addImage,
    addText,
    addShape,
    setDrawingMode,
    removeSelectedObject
  } = useFabricCanvas();

  // Get undo/redo functionality from hook
  const {
    undoStack,
    redoStack,
    canUndo,
    canRedo,
    addAction,
    undo,
    redo,
    clearHistory
  } = useUndoRedo();

  // State for tool mode
  const [activeToolMode, setActiveToolMode] = useState(TOOL_MODES.CURSOR);
  
  // State for text editor
  const [textEditorVisible, setTextEditorVisible] = useState(false);
  const [textOptions, setTextOptions] = useState({
    font: 'Arial',
    size: 24,
    color: '#000000',
    backgroundColor: null,
    fontWeight: 'normal',
    fontStyle: 'normal'
  });
  
  // Drawing options
  const [drawingOptions, setDrawingOptions] = useState({
    color: '#000000',
    size: 2
  });
  
  // State for sidebar visibility
  const [sidebarVisible, setSidebarVisible] = useState(false);
  
  // State for settings panel
  const [settingsPanelVisible, setSettingsPanelVisible] = useState(false);
  
  // State for layer manager
  const [layerManagerVisible, setLayerManagerVisible] = useState(false);
  
  // File input reference
  const fileInputRef = useRef(null);

  // Canvas dimensions
  const [canvasDimensions, setCanvasDimensions] = useState({
    width: 0,
    height: 0
  });

  // Handler for file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      loadPDF(file);
    } else {
      setError('Please select a valid PDF file.');
    }
  };

  // Handler for triggering file input click
  const handleUpload = () => {
    fileInputRef.current.click();
  };

  // Handle tool selection
  const handleToolSelect = (toolMode) => {
    console.log('Tool selected:', toolMode);
    
    // Clear any active editing
    if (fabricCanvas.current) {
      fabricCanvas.current.discardActiveObject();
      fabricCanvas.current.renderAll();
    }
    
    // Update active tool mode state
    setActiveToolMode(toolMode);
    
    // Clean up previous tool listeners
    if (fabricCanvas.current) {
      fabricCanvas.current.off('mouse:down', handleCanvasClickForText);
      fabricCanvas.current.isDrawingMode = false;
    }
    
    // Setup listeners for the new tool
    if (toolMode === TOOL_MODES.TEXT) {
      console.log('Setting up text tool event handlers');
      if (fabricCanvas.current) {
        fabricCanvas.current.on('mouse:down', handleCanvasClickForText);
      }
    } else if (toolMode === TOOL_MODES.DRAW) {
      console.log('Setting up draw tool');
      if (fabricCanvas.current) {
        fabricCanvas.current.isDrawingMode = true;
        // Set drawing properties
        fabricCanvas.current.freeDrawingBrush.color = drawingOptions.color;
        fabricCanvas.current.freeDrawingBrush.width = drawingOptions.size;
      }
    }
  };

  // Handle canvas click for text placement
  const handleCanvasClickForText = (event) => {
    if (activeToolMode !== TOOL_MODES.TEXT || !fabricCanvas.current) return;
    
    // Get click position
    const pointer = fabricCanvas.current.getPointer(event.e);
    console.log('Creating text at position:', pointer.x, pointer.y);
    
    // Create text at click position with default text
    const defaultText = 'Edit this text';
    
    // Make text more visible with better defaults
    const text = addText(defaultText, {
      left: pointer.x,
      top: pointer.y,
      fontFamily: textOptions.font || 'Arial',
      fontSize: textOptions.size || 24,
      fill: textOptions.color || '#000000',
      backgroundColor: 'rgba(255, 255, 255, 0.01)', // Very slight background for visibility
      fontWeight: textOptions.fontWeight || 'normal',
      fontStyle: textOptions.fontStyle || 'normal',
      originX: 'left', // Change from center to left for better positioning
      originY: 'top'   // Change from center to top for better positioning
    });
    
    // Show text editor for immediate editing
    if (text) {
      console.log('Text object created:', text);
      
      // Force canvas to render before editing
      fabricCanvas.current.renderAll();
      
      // Select the text for editing
      fabricCanvas.current.setActiveObject(text);
      
      // Enter editing mode
      text.enterEditing();
      text.selectAll();
      
      // Force canvas to render after editing
      fabricCanvas.current.renderAll();
      
      // Add to undo stack
      addAction({
        type: 'add',
        object: text
      });
    } else {
      console.error('Failed to create text object');
    }
  };

  // Handler for saving the document
  const handleSave = async () => {
    if (!pdfDoc) {
      setError('No PDF document to save.');
      return;
    }
    
    try {
      const modifiedPdf = await exportPDF();
      if (modifiedPdf) {
        // Create a download link
        const downloadUrl = URL.createObjectURL(modifiedPdf);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = pdfName.replace('.pdf', '_edited.pdf');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
      }
    } catch (err) {
      setError(`Failed to save PDF: ${err.message}`);
    }
  };

  // Handler for downloading the document
  const handleDownload = async () => {
    if (!pdfDoc) {
      setError('No PDF document to download.');
      return;
    }
    
    try {
      const modifiedPdf = await exportPDF();
      if (modifiedPdf) {
        // Create a download link
        const downloadUrl = URL.createObjectURL(modifiedPdf);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = pdfName.replace('.pdf', '_edited.pdf');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
      }
    } catch (err) {
      setError(`Failed to download PDF: ${err.message}`);
    }
  };

  // Current page data
  const currentPageData = getCurrentPageData();

  // Create Fabric.js canvas
  const initializeCanvas = useCallback(() => {
    if (!canvasRef.current || !currentPageData || !fabric) return;
    
    // Clean up any existing canvas
    if (fabricCanvas.current) {
      fabricCanvas.current.dispose();
    }
    
    const canvasWidth = currentPageData.width * scale;
    const canvasHeight = currentPageData.height * scale;
    
    console.log('Initializing canvas with dimensions:', canvasWidth, canvasHeight);
    
    // Create new fabric canvas
    fabricCanvas.current = new fabric.Canvas(canvasRef.current, {
      width: canvasWidth,
      height: canvasHeight,
      selection: true,
      preserveObjectStacking: true
    });
    
    console.log('Canvas initialized:', {
      width: fabricCanvas.current.width,
      height: fabricCanvas.current.height,
      element: fabricCanvas.current.getElement()
    });
    
    // Get image data
    let imageUrl = currentPageData.dataUrl || currentPageData.url;
    
    if (imageUrl) {
      // Set the PDF page as background
      fabric.Image.fromURL(imageUrl, (img) => {
        // Scale image to fit canvas
        img.scaleToWidth(canvasWidth);
        img.scaleToHeight(canvasHeight);
        
        fabricCanvas.current.setBackgroundImage(
          img, 
          fabricCanvas.current.renderAll.bind(fabricCanvas.current),
          {
            scaleX: 1,
            scaleY: 1,
            originX: 'left',
            originY: 'top'
          }
        );
        
        console.log('Background image set');
      });
    }
    
    // Add a visible border to the canvas for debugging
    fabricCanvas.current.setWidth(canvasWidth);
    fabricCanvas.current.setHeight(canvasHeight);
    
    // Attach event listeners
    if (activeToolMode === TOOL_MODES.TEXT) {
      console.log('Attaching text event listener');
      fabricCanvas.current.on('mouse:down', handleCanvasClickForText);
    }
    
    // Attach object selection handler
    fabricCanvas.current.on('selection:created', handleObjectSelected);
    fabricCanvas.current.on('selection:updated', handleObjectSelected);
    fabricCanvas.current.on('selection:cleared', handleSelectionCleared);
    
    // Reset the object history
    clearHistory();
    
    // Set canvas dimensions in state
    setCanvasDimensions({
      width: canvasWidth,
      height: canvasHeight
    });
  }, [currentPageData, scale, activeToolMode, clearHistory]);

  // Add effect to handle text editor visibility based on selected object
  useEffect(() => {
    // Show text editor when a text object is selected
    if (selectedObject && selectedObject.type === 'i-text') {
      console.log('Text object active, showing text editor');
      setTextEditorVisible(true);
    } else {
      // Only hide if there's no text object selected
      setTextEditorVisible(false);
    }
  }, [selectedObject]);

  // Initialize canvas when page data changes
  useEffect(() => {
    if (currentPageData) {
      initializeCanvas();
    }
    
    // Cleanup function
    return () => {
      if (fabricCanvas.current) {
        // Remove all event listeners
        fabricCanvas.current.off('mouse:down', handleCanvasClickForText);
        fabricCanvas.current.off('selection:created', handleObjectSelected);
        fabricCanvas.current.off('selection:updated', handleObjectSelected);
        fabricCanvas.current.off('selection:cleared', handleSelectionCleared);
        fabricCanvas.current.dispose();
      }
    };
  }, [currentPageData, scale, rotation, initializeCanvas]);

  // Re-attach event listeners when tool mode changes
  useEffect(() => {
    if (fabricCanvas.current) {
      // Remove existing listener first
      fabricCanvas.current.off('mouse:down', handleCanvasClickForText);
      
      // Add listener for text tool
      if (activeToolMode === TOOL_MODES.TEXT) {
        console.log('Setting up text tool mode event listener');
        fabricCanvas.current.off('mouse:down', handleCanvasClickForText);
        fabricCanvas.current.on('mouse:down', handleCanvasClickForText);
      }
    }
    
    return () => {
      if (fabricCanvas.current) {
        fabricCanvas.current.off('mouse:down', handleCanvasClickForText);
      }
    };
  }, [activeToolMode, handleCanvasClickForText]);

  // Handle object selection
  const handleObjectSelected = (e) => {
    const obj = e.selected ? e.selected[0] : e.target;
    console.log('Object selected:', obj);
    setSelectedObject(obj);
    
    // Check if this is a text object and show text editor
    if (obj && obj.type === 'i-text') {
      console.log('Text object selected, showing text editor');
      setTextEditorVisible(true);
    } else {
      setTextEditorVisible(false);
    }
  };

  // Handle selection cleared
  const handleSelectionCleared = () => {
    console.log('Selection cleared');
    setSelectedObject(null);
    setTextEditorVisible(false);
  };

  return (
    <ErrorBoundary>
      <div className={styles.pdfEditor}>
        {/* Toolbar */}
        <Toolbar
          activeToolMode={activeToolMode}
          onToolSelect={handleToolSelect}
          onUndo={undo}
          onRedo={redo}
          onSave={handleSave}
          onUpload={handleUpload}
          onDownload={handleDownload}
          onSettings={() => setSettingsPanelVisible(!settingsPanelVisible)}
          undoStack={undoStack}
          redoStack={redoStack}
        />
        
        <div className={styles.editorContent}>
          {/* Sidebar */}
          {sidebarVisible && (
            <div className={styles.sidebar}>
              {/* Layer Manager */}
              {layerManagerVisible && (
                <LayerManager />
              )}
            </div>
          )}
          
          <div className={styles.viewerContainer}>
            {/* Page Navigation */}
            <PageNavigation
              currentPage={currentPage}
              pageCount={pageCount}
              onPageChange={changePage}
              onZoomIn={() => zoom(scale + 0.1)}
              onZoomOut={() => zoom(Math.max(0.1, scale - 0.1))}
              onFitToWidth={() => {/* TODO: Implement fit to width */}}
              scale={scale}
              onToggleSidebar={() => setSidebarVisible(!sidebarVisible)}
            />
            
            <div className={styles.canvasContainer}>
              {!pdfDoc ? (
                <div className={styles.dropArea} onClick={handleUpload}>
                  <div className={styles.dropAreaContent}>
                    <p>Drop a PDF file here or click to upload</p>
                  </div>
                </div>
              ) : (
                <div className={styles.canvasWrapper}>
                  {/* PDF Rendering Canvas */}
                  <canvas 
                    ref={canvasRef} 
                    className={styles.pdfCanvas} 
                  />
                </div>
              )}
            </div>
          </div>
          
          {/* Settings Panel */}
          {settingsPanelVisible && (
            <SettingsPanel
              onClose={() => setSettingsPanelVisible(false)}
            />
          )}
          
          {/* Text Editor */}
          <TextEditor
            selectedObject={selectedObject}
            fabricCanvas={fabricCanvas}
            isVisible={textEditorVisible}
          />
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