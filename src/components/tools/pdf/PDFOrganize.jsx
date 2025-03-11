import React, { useState, useRef, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  FaUpload,
  FaDownload,
  FaTrashAlt,
  FaFilePdf,
  FaArrowsAlt,
  FaSave,
  FaUndo,
  FaRedo,
  FaCopy,
  FaPlus,
  FaExpand,
  FaCompress,
  FaSort,
  FaEye,
  FaCheck,
  FaList,
  FaThLarge as FaGrid
} from 'react-icons/fa';

const PDFOrganize = () => {
  // State for PDF documents and pages
  const [pdfFiles, setPdfFiles] = useState([]);
  const [pages, setPages] = useState([]);
  const [selectedPages, setSelectedPages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [previewScale, setPreviewScale] = useState(1);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [pdfJSLoaded, setPdfJSLoaded] = useState(false);
  const [activeId, setActiveId] = useState(null);
  
  // Refs
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);
  
  // Load PDF.js
  useEffect(() => {
    const loadPdfJS = async () => {
      try {
        // Use a CDN version of PDF.js that's known to work
        const pdfjsLib = window.pdfjsLib;
        if (!pdfjsLib) {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
          script.onload = () => {
            window.pdfjsLib = window.pdfjsLib;
            // Set worker source
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
            console.log('PDF.js loaded successfully');
            setPdfJSLoaded(true);
          };
          script.onerror = (error) => {
            console.error('Error loading PDF.js:', error);
            setError('Failed to load PDF viewer. Please try again.');
          };
          document.body.appendChild(script);
        } else {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
          setPdfJSLoaded(true);
          console.log('PDF.js already loaded');
        }
      } catch (error) {
        console.error('Error in loadPdfJS:', error);
        setError('Failed to initialize PDF viewer: ' + error.message);
      }
    };
    
    loadPdfJS();
  }, []);
  
  // Handle file selection
  const handleFileSelect = async (event) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('File selection event:', event);
      
      // Get files from event (either from input or drop)
      let files;
      if (event.dataTransfer && event.dataTransfer.files) {
        // Drag and drop
        files = event.dataTransfer.files;
        console.log('Files from drag and drop:', files);
      } else if (event.target && event.target.files) {
        // File input
        files = event.target.files;
        console.log('Files from file input:', files);
      } else {
        console.error('No files found in event:', event);
        setError('No files selected');
        setIsLoading(false);
        return;
      }
      
      if (!files || files.length === 0) {
        console.error('No files selected');
        setError('No files selected');
        setIsLoading(false);
        return;
      }
      
      // Process each PDF file
      const newPages = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Check if file is a PDF
        if (file.type !== 'application/pdf') {
          console.error(`File "${file.name}" is not a PDF`);
          setError(`File "${file.name}" is not a PDF`);
          continue;
        }
        
        console.log(`Processing PDF file: ${file.name}`);
        
        // Read file as ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        
        // Load PDF document
        console.log('Loading PDF document...');
        const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        console.log('PDF document loaded:', pdf);
        
        const pageCount = pdf.numPages;
        console.log(`PDF has ${pageCount} pages`);
        
        // Generate previews for each page
        for (let i = 0; i < pageCount; i++) {
          try {
            console.log(`Rendering page ${i + 1}...`);
            const page = await pdf.getPage(i + 1);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            
            // Set white background
            context.fillStyle = 'white';
            context.fillRect(0, 0, canvas.width, canvas.height);
            
            // Render PDF page
            await page.render({
              canvasContext: context,
              viewport,
              background: 'white'
            }).promise;
            
            const pageId = `${file.name}-${i}`;
            console.log(`Page ${i + 1} rendered, creating preview...`);
            
            newPages.push({
              id: pageId,
              pageNumber: i + 1,
              fileName: file.name,
              preview: canvas.toDataURL('image/jpeg', 0.8),
              rotation: 0,
              selected: false,
              originalFile: file,
              width: viewport.width,
              height: viewport.height
            });
            
            console.log(`Page ${i + 1} added to pages array`);
          } catch (pageError) {
            console.error(`Error rendering page ${i + 1}:`, pageError);
          }
        }
      }
      
      if (newPages.length > 0) {
        // Save current state to undo stack
        setUndoStack(prev => [...prev, pages]);
        setRedoStack([]);
        
        // Update pages
        setPages(prevPages => [...prevPages, ...newPages]);
        setPdfFiles(prev => [...prev, ...Array.from(files)]);
        
        console.log('All pages processed, total pages:', pages.length + newPages.length);
      } else {
        setError('No valid pages found in the selected files');
      }
    } catch (error) {
      console.error('Error processing files:', error);
      setError(`Error processing files: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      setPages((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        
        // Save current state to undo stack
        setUndoStack(prev => [...prev, items]);
        setRedoStack([]);
        
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };
  
  // Handle page selection
  const togglePageSelection = (pageId) => {
    console.log('Toggling selection for page:', pageId);
    // Save current state to undo stack
    setUndoStack(prev => [...prev, pages]);
    setRedoStack([]);
    
    // Update pages
    setPages(prevPages => 
      prevPages.map(page => 
        page.id === pageId 
          ? { ...page, selected: !page.selected } 
          : page
      )
    );
  };
  
  // Handle page rotation
  const rotatePage = (pageId, direction) => {
    setPages(prev => prev.map(page => 
      page.id === pageId
        ? { 
            ...page, 
            rotation: (page.rotation + (direction === 'right' ? 90 : -90)) % 360 
          }
        : page
    ));
    
    // Save current state to undo stack
    setUndoStack(prev => [...prev, pages]);
    setRedoStack([]);
  };
  
  // Handle page deletion
  const deletePages = (pageIds) => {
    console.log('Deleting pages:', pageIds);
    if (!pageIds || pageIds.length === 0) {
      // If no pageIds provided, delete all selected pages
      const selectedPageIds = pages.filter(page => page.selected).map(page => page.id);
      if (selectedPageIds.length === 0) {
        console.log('No pages selected for deletion');
        return;
      }
      pageIds = selectedPageIds;
    }
    
    // If pageIds is a single string, convert to array
    if (typeof pageIds === 'string') {
      pageIds = [pageIds];
    }
    
    console.log('Deleting pages with IDs:', pageIds);
    
    // Save current state to undo stack
    setUndoStack(prev => [...prev, pages]);
    setRedoStack([]);
    
    // Remove pages
    setPages(prevPages => prevPages.filter(page => !pageIds.includes(page.id)));
  };
  
  // Handle undo/redo
  const undo = () => {
    if (undoStack.length === 0) return;
    
    const previousState = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, pages]);
    setPages(previousState);
    setUndoStack(prev => prev.slice(0, -1));
  };
  
  const redo = () => {
    if (redoStack.length === 0) return;
    
    const nextState = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, pages]);
    setPages(nextState);
    setRedoStack(prev => prev.slice(0, -1));
  };
  
  // Save organized PDF
  const savePDF = async () => {
    if (pages.length === 0) return;
    
    try {
      setIsLoading(true);
      
      // Create new PDF document
      const newPdf = await PDFDocument.create();
      
      // Copy pages from original PDFs
      for (const page of pages) {
        const sourceBuffer = await page.originalFile.arrayBuffer();
        const sourcePdf = await PDFDocument.load(sourceBuffer);
        const [copiedPage] = await newPdf.copyPages(sourcePdf, [page.pageNumber - 1]);
        
        // Apply rotation if needed
        if (page.rotation !== 0) {
          copiedPage.setRotation(page.rotation);
        }
        
        newPdf.addPage(copiedPage);
      }
      
      // Save and download
      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'organized_document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (err) {
      setError('Failed to save PDF: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-6 bg-gray-50 dark:bg-gray-800 p-6 rounded-xl min-h-screen">
      {/* Hidden file input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept=".pdf" 
        multiple 
        onChange={handleFileSelect} 
      />
      
      {/* Header */}
      <div className="bg-gray-900 p-4 flex items-center space-x-4 rounded-t-xl">
        <div className="bg-purple-600 p-2 rounded-md">
          <FaSort className="text-white text-xl" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Organize PDF</h2>
          <p className="text-gray-300 text-sm">Arrange and reorder PDF pages with drag and drop</p>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 relative p-4 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : pages.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className={`
              ${viewMode === 'grid' 
                ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4' 
                : 'flex flex-col'
              }
            `}>
              <SortableContext items={pages.map(page => page.id)} strategy={rectSortingStrategy}>
                {pages.map((page, index) => (
                  <SortablePage
                    key={page.id}
                    page={page}
                    index={index}
                    viewMode={viewMode}
                    previewScale={previewScale}
                    onToggleSelection={togglePageSelection}
                    onRotate={rotatePage}
                    onDelete={deletePages}
                  />
                ))}
              </SortableContext>
            </div>
            <DragOverlay>
              {activeId ? (
                <div className="opacity-50 w-40 h-56 bg-gray-100 rounded-lg shadow-xl">
                  <img 
                    src={pages.find(page => page.id === activeId)?.preview} 
                    alt="Dragging page"
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
          <div 
            className="flex flex-col items-center justify-center h-full border-2 border-dashed border-gray-300 rounded-lg p-8"
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => {
              setIsDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFileSelect(e);
            }}
            style={{
              backgroundColor: isDragging ? 'rgba(99, 102, 241, 0.1)' : '',
              borderColor: isDragging ? 'rgb(99, 102, 241)' : ''
            }}
          >
            <FaFilePdf className={`text-6xl mb-4 ${isDragging ? 'text-blue-500' : 'text-gray-400'} transition-colors`} />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {isDragging ? 'Drop PDF files here' : 'No PDF files added'}
            </h3>
            <p className="text-gray-500 mb-4">
              {isDragging ? 'Release to upload' : 'Drag & drop PDF files or click below to upload'}
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
            >
              <FaUpload className="mr-2" /> Upload PDF
            </button>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="bg-gray-100 p-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
          >
            <FaPlus className="mr-2" /> Add PDF
          </button>
          
          <button
            onClick={() => deletePages()}
            disabled={!pages.some(page => page.selected)}
            className={`
              px-4 py-2 rounded-lg transition-colors flex items-center
              ${pages.some(page => page.selected)
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
            `}
          >
            <FaTrashAlt className="mr-2" /> Delete Selected
          </button>
          
          <button
            onClick={savePDF}
            disabled={pages.length === 0}
            className={`
              px-4 py-2 rounded-lg transition-colors flex items-center
              ${pages.length > 0
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
            `}
          >
            <FaSave className="mr-2" /> Save PDF
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 p-2 rounded-lg transition-colors"
            title={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
          >
            {viewMode === 'grid' ? <FaList /> : <FaGrid />}
          </button>
          
          <div className="flex items-center bg-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setPreviewScale(Math.max(0.5, previewScale - 0.1))}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 p-2 transition-colors"
              title="Zoom out"
            >
              <FaCompress />
            </button>
            <button
              onClick={() => setPreviewScale(Math.min(1.5, previewScale + 0.1))}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 p-2 transition-colors"
              title="Zoom in"
            >
              <FaExpand />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sortable page component
const SortablePage = ({ page, index, viewMode, previewScale, onToggleSelection, onRotate, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: page.id,
    transition: {
      duration: 150,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)'
    }
  });

  const style = transform ? {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1
  } : {
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1
  };

  const handleToggleSelection = (e) => {
    e.stopPropagation();
    console.log('Toggle selection clicked for page:', page.id);
    onToggleSelection(page.id);
  };

  const handleRotateLeft = (e) => {
    e.stopPropagation();
    console.log('Rotate left clicked for page:', page.id);
    onRotate(page.id, 'left');
  };

  const handleRotateRight = (e) => {
    e.stopPropagation();
    console.log('Rotate right clicked for page:', page.id);
    onRotate(page.id, 'right');
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    console.log('Delete clicked for page:', page.id);
    onDelete(page.id);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${
        viewMode === 'grid' 
          ? 'w-full aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow'
          : 'w-full h-32 bg-gray-100 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow mb-4 flex'
      } ${page.selected ? 'ring-2 ring-blue-500' : ''}`}
      onClick={handleToggleSelection}
    >
      {/* Page number */}
      <div className="absolute top-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded-md z-10">
        {page.pageNumber}
      </div>
      
      {/* Selection indicator */}
      <div className="absolute top-2 left-2 z-10">
        <div 
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
            page.selected 
              ? 'bg-blue-500 border-blue-500' 
              : 'bg-white border-gray-400'
          }`}
          onClick={handleToggleSelection}
        >
          {page.selected && <FaCheck className="text-white text-xs" />}
        </div>
      </div>
      
      {/* Preview */}
      <div
        className="absolute inset-0 flex items-center justify-center bg-white"
        style={{
          transform: `scale(${previewScale}) rotate(${page.rotation}deg)`,
          transition: 'transform 0.3s ease'
        }}
      >
        <img
          src={page.preview}
          alt={`Page ${page.pageNumber}`}
          className="w-full h-full object-contain"
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            backgroundColor: 'white'
          }}
        />
      </div>
      
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute bottom-2 left-2 w-8 h-8 bg-gray-800 bg-opacity-50 rounded-lg flex items-center justify-center text-white hover:bg-opacity-70 transition-colors cursor-grab z-10"
      >
        <FaArrowsAlt />
      </div>
      
      {/* Actions */}
      <div className="absolute bottom-2 right-2 flex space-x-2 z-10">
        <button
          onClick={handleRotateLeft}
          className="w-8 h-8 bg-gray-800 bg-opacity-50 rounded-lg flex items-center justify-center text-white hover:bg-opacity-70 transition-colors"
        >
          <FaUndo />
        </button>
        <button
          onClick={handleRotateRight}
          className="w-8 h-8 bg-gray-800 bg-opacity-50 rounded-lg flex items-center justify-center text-white hover:bg-opacity-70 transition-colors"
        >
          <FaRedo />
        </button>
        <button
          onClick={handleDelete}
          className="w-8 h-8 bg-gray-800 bg-opacity-50 rounded-lg flex items-center justify-center text-white hover:bg-opacity-70 transition-colors"
        >
          <FaTrashAlt />
        </button>
      </div>
    </div>
  );
};

export default PDFOrganize; 