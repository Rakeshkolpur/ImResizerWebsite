import React, { useState, useRef, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import { FaFileUpload, FaDownload, FaTrash, FaFileAlt, FaCheck, FaTimes, FaArrowLeft, FaArrowRight } from 'react-icons/fa';

/**
 * PDF Delete Pages component
 * Allows users to remove specific pages from a PDF document
 */
const PDFDeletePages = () => {
  // State for PDF document and processing
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfName, setPdfName] = useState('');
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageImages, setPageImages] = useState([]);
  const [selectedPages, setSelectedPages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isModified, setIsModified] = useState(false);
  const [modifiedPdfUrl, setModifiedPdfUrl] = useState(null);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'single'
  
  // Refs
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  
  // Clean up URLs when component unmounts
  useEffect(() => {
    return () => {
      if (modifiedPdfUrl) {
        URL.revokeObjectURL(modifiedPdfUrl);
      }
    };
  }, [modifiedPdfUrl]);
  
  // Load PDF.js library
  useEffect(() => {
    const loadPdfJS = async () => {
      if (!window.pdfjsLib) {
        try {
          // Loading PDF.js from CDN
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.7.107/pdf.min.js';
          script.async = true;
          document.body.appendChild(script);
          
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
          });
          
          // Set worker source
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.7.107/pdf.worker.min.js';
          
          console.log('PDF.js loaded successfully');
        } catch (err) {
          console.error('Failed to load PDF.js', err);
          setError('Failed to load PDF viewer. Please refresh the page.');
        }
      }
    };
    
    loadPdfJS();
  }, []);
  
  // Handle file selection
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      try {
        setIsProcessing(true);
        setError(null);
        
        // Reset state
        setSelectedPages([]);
        setPageImages([]);
        setCurrentPage(1);
        setIsModified(false);
        
        // Clean up previous URL
        if (modifiedPdfUrl) {
          URL.revokeObjectURL(modifiedPdfUrl);
          setModifiedPdfUrl(null);
        }
        
        setPdfFile(file);
        setPdfName(file.name);
        
        // Load the PDF
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        setPdfDoc(pdfDoc);
        
        const pageCount = pdfDoc.getPageCount();
        setPageCount(pageCount);
        
        // Render page thumbnails using PDF.js
        if (window.pdfjsLib) {
          await renderPageThumbnails(arrayBuffer);
        }
        
        setIsProcessing(false);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError(`Failed to load PDF: ${err.message}`);
        setIsProcessing(false);
      }
    } else {
      setError('Please select a valid PDF file.');
    }
  };
  
  // Handle file drop
  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    const file = event.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      // Create a new file input event
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      
      const fileInputEl = fileInputRef.current;
      fileInputEl.files = dataTransfer.files;
      
      // Trigger the file select handler
      handleFileSelect({ target: { files: dataTransfer.files } });
    } else {
      setError('Please drop a valid PDF file.');
    }
  };
  
  // Render page thumbnails
  const renderPageThumbnails = async (arrayBuffer) => {
    try {
      const loadingTask = window.pdfjsLib.getDocument(arrayBuffer);
      const pdf = await loadingTask.promise;
      
      const pageCount = pdf.numPages;
      const thumbnails = [];
      
      for (let i = 1; i <= pageCount; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.5 });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;
        
        thumbnails.push(canvas.toDataURL());
      }
      
      setPageImages(thumbnails);
    } catch (err) {
      console.error('Error rendering thumbnails:', err);
      setError('Failed to render PDF thumbnails.');
    }
  };
  
  // Toggle page selection
  const togglePageSelection = (pageIndex) => {
    setSelectedPages(prevSelected => {
      if (prevSelected.includes(pageIndex)) {
        return prevSelected.filter(p => p !== pageIndex);
      } else {
        return [...prevSelected, pageIndex];
      }
    });
  };
  
  // Select all pages
  const selectAllPages = () => {
    const allPages = Array.from({ length: pageCount }, (_, i) => i);
    setSelectedPages(allPages);
  };
  
  // Deselect all pages
  const deselectAllPages = () => {
    setSelectedPages([]);
  };
  
  // Delete selected pages
  const deleteSelectedPages = async () => {
    if (selectedPages.length === 0) {
      setError('Please select at least one page to delete.');
      return;
    }
    
    if (selectedPages.length === pageCount) {
      setError('Cannot delete all pages. At least one page must remain.');
      return;
    }
    
    try {
      setIsProcessing(true);
      setError(null);
      
      // Create a new PDF document
      const modifiedPdfDoc = await PDFDocument.create();
      
      // Get indices of pages to keep
      const pagesToKeep = Array.from({ length: pageCount }, (_, i) => i)
        .filter(pageIndex => !selectedPages.includes(pageIndex));
      
      // Copy pages from the original document to the new one
      const copiedPages = await modifiedPdfDoc.copyPages(pdfDoc, pagesToKeep);
      copiedPages.forEach(page => modifiedPdfDoc.addPage(page));
      
      // Save the modified PDF
      const modifiedPdfBytes = await modifiedPdfDoc.save();
      
      // Create a blob from the modified PDF
      const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
      
      // Create a URL for the blob
      const url = URL.createObjectURL(blob);
      
      // Update state
      setModifiedPdfUrl(url);
      setIsModified(true);
      setSelectedPages([]);
      
      // Load the modified PDF for preview
      const modifiedArrayBuffer = await blob.arrayBuffer();
      const newPdfDoc = await PDFDocument.load(modifiedArrayBuffer);
      setPdfDoc(newPdfDoc);
      
      const newPageCount = newPdfDoc.getPageCount();
      setPageCount(newPageCount);
      setCurrentPage(1);
      
      // Render new thumbnails
      await renderPageThumbnails(modifiedArrayBuffer);
      
      setIsProcessing(false);
    } catch (err) {
      console.error('Error deleting pages:', err);
      setError(`Failed to delete pages: ${err.message}`);
      setIsProcessing(false);
    }
  };
  
  // Download modified PDF
  const downloadModifiedPDF = () => {
    if (!modifiedPdfUrl) {
      setError('No modified PDF available for download.');
      return;
    }
    
    const link = document.createElement('a');
    link.href = modifiedPdfUrl;
    
    // Create a new filename
    const filenameParts = pdfName.split('.');
    const extension = filenameParts.pop();
    const filenameWithoutExtension = filenameParts.join('.');
    const newFilename = `${filenameWithoutExtension}_modified.${extension}`;
    
    link.download = newFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Reset state
  const resetState = () => {
    setPdfFile(null);
    setPdfName('');
    setPdfDoc(null);
    setPageCount(0);
    setCurrentPage(1);
    setPageImages([]);
    setSelectedPages([]);
    setIsModified(false);
    setError(null);
    
    // Clean up URL
    if (modifiedPdfUrl) {
      URL.revokeObjectURL(modifiedPdfUrl);
      setModifiedPdfUrl(null);
    }
  };
  
  // Navigate to previous page in single view mode
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prevPage => prevPage - 1);
    }
  };
  
  // Navigate to next page in single view mode
  const goToNextPage = () => {
    if (currentPage < pageCount) {
      setCurrentPage(prevPage => prevPage + 1);
    }
  };
  
  // Toggle view mode between grid and single
  const toggleViewMode = () => {
    setViewMode(prevMode => prevMode === 'grid' ? 'single' : 'grid');
  };
  
  return (
    <div className="flex flex-col space-y-6 bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
      {/* Header */}
      <div className="bg-gray-900 p-4 flex items-center space-x-4 rounded-t-xl">
        <div className="bg-red-600 p-2 rounded-md">
          <FaTrash className="text-white text-xl" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Delete PDF Pages</h2>
          <p className="text-gray-300 text-sm">Remove specific pages from your PDF document</p>
        </div>
      </div>
      
      {/* Main content */}
      <div className="bg-white dark:bg-gray-700 rounded-xl shadow-md overflow-hidden">
        {/* File upload area */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-600">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="application/pdf"
            className="hidden"
          />
          
          {!pdfFile ? (
            <div 
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
              onClick={() => fileInputRef.current.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <FaFileUpload className="mx-auto text-gray-400 dark:text-gray-500 text-4xl mb-4" />
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                Upload your PDF file
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Drag and drop your file here, or click to browse
              </p>
              <button
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current.click();
                }}
              >
                Select PDF File
              </button>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center space-x-4 mb-4 md:mb-0">
                <div className="bg-red-100 dark:bg-red-900 p-3 rounded-md">
                  <FaFileAlt className="text-red-600 dark:text-red-400 text-xl" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800 dark:text-white">{pdfName}</h3>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-4">
                    <span>{pageCount} {pageCount === 1 ? 'page' : 'pages'}</span>
                    {isModified && (
                      <>
                        <span>•</span>
                        <span className="text-green-600 dark:text-green-400">Modified</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                {isModified && (
                  <button
                    onClick={downloadModifiedPDF}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center space-x-1 transition-colors"
                  >
                    <FaDownload className="text-sm" />
                    <span>Download</span>
                  </button>
                )}
                
                <button
                  onClick={resetState}
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-md flex items-center space-x-1 transition-colors"
                >
                  <FaTrash className="text-sm" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* PDF preview and page selection */}
        {pdfFile && pageImages.length > 0 && (
          <div className="p-6">
            {/* Controls */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4">
                <button
                  onClick={toggleViewMode}
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-md transition-colors"
                >
                  {viewMode === 'grid' ? 'Single Page View' : 'Grid View'}
                </button>
                
                {viewMode === 'single' && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={goToPreviousPage}
                      disabled={currentPage <= 1}
                      className={`p-1 rounded ${
                        currentPage <= 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <FaArrowLeft />
                    </button>
                    
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Page {currentPage} of {pageCount}
                    </span>
                    
                    <button
                      onClick={goToNextPage}
                      disabled={currentPage >= pageCount}
                      className={`p-1 rounded ${
                        currentPage >= pageCount ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <FaArrowRight />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={selectAllPages}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm"
                >
                  Select All
                </button>
                
                <button
                  onClick={deselectAllPages}
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-md transition-colors text-sm"
                >
                  Deselect All
                </button>
                
                <button
                  onClick={deleteSelectedPages}
                  disabled={selectedPages.length === 0 || selectedPages.length === pageCount || isProcessing}
                  className={`px-3 py-1 ${
                    selectedPages.length === 0 || selectedPages.length === pageCount || isProcessing
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700'
                  } text-white rounded-md transition-colors text-sm flex items-center space-x-1`}
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <FaTrash className="text-xs" />
                      <span>Delete Selected ({selectedPages.length})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* Page preview */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {pageImages.map((imageData, index) => (
                  <div
                    key={index}
                    className={`relative border rounded-md overflow-hidden cursor-pointer transition-all ${
                      selectedPages.includes(index)
                        ? 'border-red-600 shadow-md'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                    onClick={() => togglePageSelection(index)}
                  >
                    <img
                      src={imageData}
                      alt={`Page ${index + 1}`}
                      className="w-full h-auto"
                    />
                    
                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                      {selectedPages.includes(index) && (
                        <div className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center">
                          <FaCheck className="text-xs" />
                        </div>
                      )}
                      
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs py-1 text-center">
                        Page {index + 1}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="relative border rounded-md overflow-hidden max-w-xl">
                  <img
                    src={pageImages[currentPage - 1]}
                    alt={`Page ${currentPage}`}
                    className="w-full h-auto"
                  />
                  
                  <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                    {selectedPages.includes(currentPage - 1) && (
                      <div className="absolute top-4 right-4 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center">
                        <FaCheck className="text-sm" />
                      </div>
                    )}
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePageSelection(currentPage - 1);
                      }}
                      className={`absolute bottom-4 right-4 ${
                        selectedPages.includes(currentPage - 1)
                          ? 'bg-red-600 hover:bg-red-700'
                          : 'bg-blue-600 hover:bg-blue-700'
                      } text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors`}
                    >
                      {selectedPages.includes(currentPage - 1) ? (
                        <FaTimes className="text-sm" />
                      ) : (
                        <FaCheck className="text-sm" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Features section */}
      <div className="bg-white dark:bg-gray-700 rounded-xl shadow-md overflow-hidden p-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">
          PDF Page Deletion Features
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Selective Deletion</h3>
            <p className="text-gray-600 dark:text-gray-400">Select and remove specific pages from your PDF document with precision.</p>
          </div>
          
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Visual Preview</h3>
            <p className="text-gray-600 dark:text-gray-400">See thumbnail previews of all pages to easily identify which ones to remove.</p>
          </div>
          
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Secure Processing</h3>
            <p className="text-gray-600 dark:text-gray-400">All processing happens locally on your device, ensuring complete privacy.</p>
          </div>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-800 dark:text-red-400">
          <h3 className="font-medium mb-1">Error</h3>
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};

export default PDFDeletePages; 