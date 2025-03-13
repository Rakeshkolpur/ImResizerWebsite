import React, { useState, useRef, useEffect } from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import PDFViewer from '../components/PDFViewer';
import Toolbar from '../components/Toolbar';
import PageNavigation from '../components/PageNavigation';
import TextEditor from '../components/TextEditor';
import SettingsPanel from '../components/SettingsPanel';
import LayerManager from '../components/LayerManager';

// Import custom hooks
import usePdfDocument from '../hooks/usePdfDocument';
import useFabricCanvas from '../hooks/useFabricCanvas';
import useTextEditor from '../hooks/useTextEditor';
import useLayerManager from '../hooks/useLayerManager';
import useUndoRedo from '../hooks/useUndoRedo';
import useSettings from '../hooks/useSettings';

// Import utilities
import { FileProcessor } from './FileProcessor';
import { ShapeManager } from './ShapeManager';
import { ToolModeManager } from './ToolModeManager';
import { EventHandlers } from './EventHandlers';

/**
 * PDFEditor component - Main component that coordinates all PDF editing functionality
 */
const PDFEditor = () => {
  // Canvas and file references
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);
  
  // Tool and UI state
  const [activeToolMode, setActiveToolMode] = useState('cursor');
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [settingsPanelVisible, setSettingsPanelVisible] = useState(false);
  
  // Text editor state
  const [textEditorVisible, setTextEditorVisible] = useState(false);
  const [textEditorPosition, setTextEditorPosition] = useState({ left: 0, top: 0 });
  
  // Use custom hooks
  const {
    settings,
    updateSettings,
    resetSettings
  } = useSettings();
  
  const {
    document,
    pageCount,
    currentPage,
    scale,
    rotation,
    pdfPageImages,
    isLoading,
    error,
    goToPage,
    nextPage,
    prevPage,
    changeScale,
    zoomIn,
    zoomOut,
    rotatePage
  } = usePdfDocument(null, { initialScale: 1.0, initialRotation: 0 });
  
  const {
    canvas,
    canvasRef: fabricCanvasRef,
    isInitialized,
    selectedObjects,
    addObject,
    removeSelectedObjects,
    setDrawingModeEnabled,
    clearCanvas,
    findObjectById,
    toJSON,
    loadFromJSON
  } = useFabricCanvas({
    selection: true,
    preserveObjectStacking: true
  }, settings);
  
  const {
    isEditing,
    currentTextObject,
    textProperties,
    startEditing,
    stopEditing,
    createTextObject,
    applyFormatting
  } = useTextEditor(canvas, settings);
  
  const {
    layers,
    activeLayerId,
    addLayer,
    deleteLayer,
    toggleLayerVisibility,
    toggleLayerLock,
    renameLayer,
    setActiveLayerId
  } = useLayerManager();
  
  const {
    undoStack,
    redoStack,
    addToUndoStack,
    handleUndo,
    handleRedo
  } = useUndoRedo(fabricCanvasRef);
  
  // File processor instance
  const fileProcessor = new FileProcessor({
    canvas,
    addToUndoStack,
    setPdfPageImages
  });
  
  // Shape manager instance
  const shapeManager = new ShapeManager({
    canvas,
    addToUndoStack
  });
  
  // Tool mode manager
  const toolModeManager = new ToolModeManager({
    canvas,
    setDrawingModeEnabled,
    setActiveToolMode
  });
  
  // Event handlers
  const eventHandlers = new EventHandlers({
    canvas,
    addToUndoStack,
    createTextObject,
    setTextEditorVisible,
    setTextEditorPosition
  });
  
  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      fileProcessor.loadPDF(file);
    }
  };
  
  // Handle tool selection
  const handleToolSelect = (toolId) => {
    toolModeManager.setToolMode(toolId);
  };
  
  // Handle canvas click for text insertion
  const handleCanvasClick = (event) => {
    if (activeToolMode === 'text') {
      const boundingRect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - boundingRect.left;
      const y = event.clientY - boundingRect.top;
      
      createTextObject('Text', {
        left: x,
        top: y
      });
    }
  };
  
  // Handle PDF save
  const handleSavePDF = () => {
    fileProcessor.savePDF();
  };
  
  // Toggle settings panel
  const toggleSettingsPanel = () => {
    setSettingsPanelVisible(prev => !prev);
  };
  
  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarVisible(prev => !prev);
  };
  
  // Apply text formatting from text editor
  const handleApplyTextFormatting = (properties) => {
    applyFormatting(properties);
  };
  
  // Reset canvas when current page changes
  useEffect(() => {
    if (canvas && isInitialized) {
      // We could load the canvas state for this page if we have it
      // For now, just clear the canvas
      clearCanvas();
    }
  }, [currentPage, canvas, isInitialized, clearCanvas]);
  
  // Fit to width function
  const handleFitToWidth = () => {
    if (canvasRef.current && pdfPageImages[currentPage - 1]) {
      const containerWidth = containerRef.current?.clientWidth || window.innerWidth;
      const pageWidth = pdfPageImages[currentPage - 1].width;
      const newScale = (containerWidth - 60) / pageWidth; // 60px for padding
      changeScale(newScale);
    }
  };
  
  return (
    <ErrorBoundary>
      <div className="pdf-editor" ref={containerRef} style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        {/* Toolbar */}
        <Toolbar
          activeToolMode={activeToolMode}
          onToolSelect={handleToolSelect}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onSave={handleSavePDF}
          onUpload={() => fileInputRef.current?.click()}
          onSettings={toggleSettingsPanel}
          undoStack={undoStack}
          redoStack={redoStack}
        />
        
        {/* Main content area */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Sidebar - conditionally rendered */}
          {sidebarVisible && (
            <LayerManager
              layers={layers}
              activeLayerId={activeLayerId}
              onAddLayer={addLayer}
              onDeleteLayer={deleteLayer}
              onToggleVisibility={toggleLayerVisibility}
              onToggleLock={toggleLayerLock}
              onRenameLayer={renameLayer}
              onSetActiveLayer={setActiveLayerId}
            />
          )}
          
          {/* Main editor area */}
          <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
            <PDFViewer
              canvasRef={canvasRef}
              overlayCanvasRef={overlayCanvasRef}
              pdfPageImages={pdfPageImages}
              currentPage={currentPage}
              scale={scale}
              rotation={rotation}
              isLoading={isLoading}
              error={error}
              onCanvasClick={handleCanvasClick}
            />
            
            {/* Text Editor Popup - conditionally rendered */}
            {textEditorVisible && currentTextObject && (
              <TextEditor
                visible={textEditorVisible}
                position={textEditorPosition}
                textObj={currentTextObject}
                onClose={() => setTextEditorVisible(false)}
                onApplyFormatting={handleApplyTextFormatting}
                availableFonts={[
                  { label: 'Arial', value: 'Arial' },
                  { label: 'Times New Roman', value: 'Times New Roman' },
                  { label: 'Courier New', value: 'Courier New' },
                  { label: 'Georgia', value: 'Georgia' },
                  { label: 'Verdana', value: 'Verdana' }
                ]}
                textProperties={textProperties}
              />
            )}
          </div>
          
          {/* Settings Panel - conditionally rendered */}
          {settingsPanelVisible && (
            <SettingsPanel
              visible={settingsPanelVisible}
              onClose={() => setSettingsPanelVisible(false)}
              settings={settings}
              onUpdateSettings={updateSettings}
              onResetToDefaults={resetSettings}
            />
          )}
        </div>
        
        {/* Navigation controls */}
        <PageNavigation
          currentPage={currentPage}
          pageCount={pageCount}
          onPageChange={goToPage}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onFitToWidth={handleFitToWidth}
          scale={scale}
          onToggleSidebar={toggleSidebar}
        />
        
        {/* Hidden file input for uploading PDFs */}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileUpload}
          accept=".pdf"
        />
      </div>
    </ErrorBoundary>
  );
};

export default PDFEditor; 