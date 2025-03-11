import React, { useState, useRef, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import { FaFileUpload, FaDownload, FaTrash, FaFileAlt, FaFilePdf, FaFileImage, FaArrowUp, FaArrowDown, FaPlus, FaSort } from 'react-icons/fa';

/**
 * PDF Merge component
 * Allows users to combine multiple PDFs and images into a single PDF document
 */
const PDFMerge = () => {
  // State for files and processing
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mergedPdfUrl, setMergedPdfUrl] = useState(null);
  const [error, setError] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  
  // Refs
  const fileInputRef = useRef(null);
  
  // Clean up URLs when component unmounts
  useEffect(() => {
    return () => {
      if (mergedPdfUrl) {
        URL.revokeObjectURL(mergedPdfUrl);
      }
      
      // Clean up file preview URLs
      files.forEach(file => {
        if (file.previewUrl) {
          URL.revokeObjectURL(file.previewUrl);
        }
      });
    };
  }, [mergedPdfUrl, files]);
  
  // Handle file selection
  const handleFileSelect = async (event) => {
    const selectedFiles = Array.from(event.target.files);
    if (selectedFiles.length === 0) return;
    
    try {
      setError(null);
      
      // Process each file
      const newFiles = await Promise.all(
        selectedFiles.map(async (file) => {
          // Check if file is PDF or image
          if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
            // Create preview for the file
            const previewUrl = URL.createObjectURL(file);
            
            // Get page count for PDFs
            let pageCount = 1;
            if (file.type === 'application/pdf') {
              try {
                const arrayBuffer = await file.arrayBuffer();
                const pdfDoc = await PDFDocument.load(arrayBuffer);
                pageCount = pdfDoc.getPageCount();
              } catch (err) {
                console.error('Error getting PDF page count:', err);
                // Default to 1 page if there's an error
                pageCount = 1;
              }
            }
            
            return {
              id: Date.now() + Math.random().toString(36).substring(2, 9),
              file,
              name: file.name,
              type: file.type,
              size: file.size,
              pageCount,
              previewUrl
            };
          } else {
            // Skip unsupported files
            return null;
          }
        })
      );
      
      // Filter out null values (unsupported files)
      const validFiles = newFiles.filter(file => file !== null);
      
      if (validFiles.length === 0) {
        setError('No supported files selected. Please select PDF or image files.');
        return;
      }
      
      // Add new files to the list
      setFiles(prevFiles => [...prevFiles, ...validFiles]);
      
      // Reset merged PDF URL if it exists
      if (mergedPdfUrl) {
        URL.revokeObjectURL(mergedPdfUrl);
        setMergedPdfUrl(null);
      }
    } catch (err) {
      console.error('Error processing files:', err);
      setError(`Failed to process files: ${err.message}`);
    }
    
    // Reset file input
    event.target.value = null;
  };
  
  // Handle file drop
  const handleDrop = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    const droppedFiles = Array.from(event.dataTransfer.files);
    if (droppedFiles.length === 0) return;
    
    try {
      setError(null);
      
      // Process each file
      const newFiles = await Promise.all(
        droppedFiles.map(async (file) => {
          // Check if file is PDF or image
          if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
            // Create preview for the file
            const previewUrl = URL.createObjectURL(file);
            
            // Get page count for PDFs
            let pageCount = 1;
            if (file.type === 'application/pdf') {
              try {
                const arrayBuffer = await file.arrayBuffer();
                const pdfDoc = await PDFDocument.load(arrayBuffer);
                pageCount = pdfDoc.getPageCount();
              } catch (err) {
                console.error('Error getting PDF page count:', err);
                // Default to 1 page if there's an error
                pageCount = 1;
              }
            }
            
            return {
              id: Date.now() + Math.random().toString(36).substring(2, 9),
              file,
              name: file.name,
              type: file.type,
              size: file.size,
              pageCount,
              previewUrl
            };
          } else {
            // Skip unsupported files
            return null;
          }
        })
      );
      
      // Filter out null values (unsupported files)
      const validFiles = newFiles.filter(file => file !== null);
      
      if (validFiles.length === 0) {
        setError('No supported files dropped. Please drop PDF or image files.');
        return;
      }
      
      // Add new files to the list
      setFiles(prevFiles => [...prevFiles, ...validFiles]);
      
      // Reset merged PDF URL if it exists
      if (mergedPdfUrl) {
        URL.revokeObjectURL(mergedPdfUrl);
        setMergedPdfUrl(null);
      }
    } catch (err) {
      console.error('Error processing dropped files:', err);
      setError(`Failed to process dropped files: ${err.message}`);
    }
  };
  
  // Remove file from list
  const removeFile = (id) => {
    setFiles(prevFiles => {
      const updatedFiles = prevFiles.filter(file => file.id !== id);
      
      // If all files are removed, reset merged PDF URL
      if (updatedFiles.length === 0 && mergedPdfUrl) {
        URL.revokeObjectURL(mergedPdfUrl);
        setMergedPdfUrl(null);
      }
      
      return updatedFiles;
    });
  };
  
  // Clear all files
  const clearAllFiles = () => {
    // Clean up file preview URLs
    files.forEach(file => {
      if (file.previewUrl) {
        URL.revokeObjectURL(file.previewUrl);
      }
    });
    
    // Reset state
    setFiles([]);
    
    // Reset merged PDF URL if it exists
    if (mergedPdfUrl) {
      URL.revokeObjectURL(mergedPdfUrl);
      setMergedPdfUrl(null);
    }
  };
  
  // Move file up in the list
  const moveFileUp = (index) => {
    if (index <= 0) return;
    
    setFiles(prevFiles => {
      const newFiles = [...prevFiles];
      const temp = newFiles[index];
      newFiles[index] = newFiles[index - 1];
      newFiles[index - 1] = temp;
      return newFiles;
    });
    
    // Reset merged PDF URL if it exists
    if (mergedPdfUrl) {
      URL.revokeObjectURL(mergedPdfUrl);
      setMergedPdfUrl(null);
    }
  };
  
  // Move file down in the list
  const moveFileDown = (index) => {
    if (index >= files.length - 1) return;
    
    setFiles(prevFiles => {
      const newFiles = [...prevFiles];
      const temp = newFiles[index];
      newFiles[index] = newFiles[index + 1];
      newFiles[index + 1] = temp;
      return newFiles;
    });
    
    // Reset merged PDF URL if it exists
    if (mergedPdfUrl) {
      URL.revokeObjectURL(mergedPdfUrl);
      setMergedPdfUrl(null);
    }
  };
  
  // Handle drag start
  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };
  
  // Handle drag over
  const handleDragOver = (e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
  };
  
  // Handle drop for reordering
  const handleReorderDrop = (e) => {
    e.preventDefault();
    
    if (draggedIndex === null || dragOverIndex === null || draggedIndex === dragOverIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    
    setFiles(prevFiles => {
      const newFiles = [...prevFiles];
      const draggedFile = newFiles[draggedIndex];
      
      // Remove the dragged file
      newFiles.splice(draggedIndex, 1);
      
      // Insert it at the new position
      newFiles.splice(dragOverIndex, 0, draggedFile);
      
      return newFiles;
    });
    
    // Reset drag state
    setDraggedIndex(null);
    setDragOverIndex(null);
    
    // Reset merged PDF URL if it exists
    if (mergedPdfUrl) {
      URL.revokeObjectURL(mergedPdfUrl);
      setMergedPdfUrl(null);
    }
  };
  
  // Merge PDFs and images
  const mergePDFs = async () => {
    if (files.length === 0) {
      setError('Please add at least one file to merge.');
      return;
    }
    
    try {
      setIsProcessing(true);
      setError(null);
      
      // Create a new PDF document
      const mergedPdf = await PDFDocument.create();
      
      // Process each file
      for (const fileObj of files) {
        const { file, type } = fileObj;
        const arrayBuffer = await file.arrayBuffer();
        
        if (type === 'application/pdf') {
          // For PDF files, copy all pages
          const pdfDoc = await PDFDocument.load(arrayBuffer);
          const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
          pages.forEach(page => mergedPdf.addPage(page));
        } else if (type.startsWith('image/')) {
          // For images, create a new page and embed the image
          let image;
          
          if (type === 'image/jpeg' || type === 'image/jpg') {
            image = await mergedPdf.embedJpg(arrayBuffer);
          } else if (type === 'image/png') {
            image = await mergedPdf.embedPng(arrayBuffer);
          } else {
            // Skip unsupported image types
            continue;
          }
          
          // Calculate dimensions to fit the image on a page
          const { width, height } = image;
          const aspectRatio = width / height;
          
          // Create a new page with appropriate dimensions
          let page;
          if (aspectRatio > 1) {
            // Landscape orientation
            page = mergedPdf.addPage([842, 595]); // A4 landscape
          } else {
            // Portrait orientation
            page = mergedPdf.addPage([595, 842]); // A4 portrait
          }
          
          // Calculate dimensions to fit the image on the page with margins
          const pageWidth = page.getWidth();
          const pageHeight = page.getHeight();
          const margin = 50;
          
          const maxWidth = pageWidth - 2 * margin;
          const maxHeight = pageHeight - 2 * margin;
          
          let imgWidth, imgHeight;
          
          if (width / maxWidth > height / maxHeight) {
            // Width is the limiting factor
            imgWidth = maxWidth;
            imgHeight = imgWidth / aspectRatio;
          } else {
            // Height is the limiting factor
            imgHeight = maxHeight;
            imgWidth = imgHeight * aspectRatio;
          }
          
          // Calculate position to center the image on the page
          const x = (pageWidth - imgWidth) / 2;
          const y = (pageHeight - imgHeight) / 2;
          
          // Draw the image on the page
          page.drawImage(image, {
            x,
            y,
            width: imgWidth,
            height: imgHeight
          });
        }
      }
      
      // Save the merged PDF
      const mergedPdfBytes = await mergedPdf.save();
      
      // Create a blob from the merged PDF
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      
      // Create a URL for the blob
      const url = URL.createObjectURL(blob);
      
      // Update state
      setMergedPdfUrl(url);
      setIsProcessing(false);
    } catch (err) {
      console.error('Error merging files:', err);
      setError(`Failed to merge files: ${err.message}`);
      setIsProcessing(false);
    }
  };
  
  // Download merged PDF
  const downloadMergedPDF = () => {
    if (!mergedPdfUrl) {
      setError('No merged PDF available for download.');
      return;
    }
    
    const link = document.createElement('a');
    link.href = mergedPdfUrl;
    link.download = 'merged_document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Get total page count
  const getTotalPageCount = () => {
    return files.reduce((total, file) => total + file.pageCount, 0);
  };
  
  // Get file icon based on type
  const getFileIcon = (type) => {
    if (type === 'application/pdf') {
      return <FaFilePdf className="text-red-600 dark:text-red-400" />;
    } else if (type.startsWith('image/')) {
      return <FaFileImage className="text-blue-600 dark:text-blue-400" />;
    } else {
      return <FaFileAlt className="text-gray-600 dark:text-gray-400" />;
    }
  };
  
  return (
    <div className="flex flex-col space-y-6 bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
      {/* Header */}
      <div className="bg-gray-900 p-4 flex items-center space-x-4 rounded-t-xl">
        <div className="bg-red-600 p-2 rounded-md">
          <FaSort className="text-white text-xl" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Merge PDFs & Images</h2>
          <p className="text-gray-300 text-sm">Combine multiple PDFs and images into a single document</p>
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
            accept="application/pdf,image/jpeg,image/jpg,image/png"
            multiple
            className="hidden"
          />
          
          <div 
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
            onClick={() => fileInputRef.current.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <FaFileUpload className="mx-auto text-gray-400 dark:text-gray-500 text-4xl mb-4" />
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              Add files to merge
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Drag and drop PDF or image files here, or click to browse
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-2">
              <button
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current.click();
                }}
              >
                <FaPlus className="inline-block mr-2" />
                Add Files
              </button>
              
              {files.length > 0 && (
                <button
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-md transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearAllFiles();
                  }}
                >
                  <FaTrash className="inline-block mr-2" />
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* File list */}
        {files.length > 0 && (
          <div className="p-6 border-b border-gray-200 dark:border-gray-600">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-800 dark:text-white">
                Files to Merge ({files.length})
              </h3>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Total Pages: {getTotalPageCount()}
              </div>
            </div>
            
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={file.id}
                  className={`flex items-center p-3 rounded-lg border ${
                    dragOverIndex === index
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600'
                  }`}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={handleReorderDrop}
                  onDragEnd={() => {
                    setDraggedIndex(null);
                    setDragOverIndex(null);
                  }}
                >
                  <div className="flex-shrink-0 mr-3 text-xl">
                    {getFileIcon(file.type)}
                  </div>
                  
                  <div className="flex-grow min-w-0">
                    <div className="truncate font-medium text-gray-800 dark:text-white">
                      {file.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                      <span>{formatFileSize(file.size)}</span>
                      <span className="mx-1">•</span>
                      <span>{file.pageCount} {file.pageCount === 1 ? 'page' : 'pages'}</span>
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0 flex items-center space-x-2">
                    <button
                      onClick={() => moveFileUp(index)}
                      disabled={index === 0}
                      className={`p-1 rounded ${
                        index === 0
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                      title="Move Up"
                    >
                      <FaArrowUp />
                    </button>
                    
                    <button
                      onClick={() => moveFileDown(index)}
                      disabled={index === files.length - 1}
                      className={`p-1 rounded ${
                        index === files.length - 1
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                      title="Move Down"
                    >
                      <FaArrowDown />
                    </button>
                    
                    <button
                      onClick={() => removeFile(file.id)}
                      className="p-1 rounded text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20"
                      title="Remove"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Merge action */}
        <div className="p-6">
          {!mergedPdfUrl ? (
            <button
              onClick={mergePDFs}
              disabled={files.length === 0 || isProcessing}
              className={`w-full py-3 px-4 ${
                files.length === 0 || isProcessing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700'
              } text-white rounded-md flex items-center justify-center space-x-2 transition-colors`}
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Merging Files...</span>
                </>
              ) : (
                <>
                  <FaSort className="mr-2" />
                  <span>Merge Files</span>
                </>
              )}
            </button>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <h3 className="font-medium text-green-800 dark:text-green-400 mb-2">
                  Merge Complete!
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Your files have been successfully merged into a single PDF document.
                </p>
                
                <button
                  onClick={downloadMergedPDF}
                  className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center justify-center space-x-2 transition-colors"
                >
                  <FaDownload className="mr-2" />
                  <span>Download Merged PDF</span>
                </button>
              </div>
              
              <button
                onClick={() => {
                  // Reset merged PDF URL
                  if (mergedPdfUrl) {
                    URL.revokeObjectURL(mergedPdfUrl);
                    setMergedPdfUrl(null);
                  }
                }}
                className="w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-md transition-colors"
              >
                Merge Again
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Features section */}
      <div className="bg-white dark:bg-gray-700 rounded-xl shadow-md overflow-hidden p-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">
          PDF Merge Features
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Combine Multiple Files</h3>
            <p className="text-gray-600 dark:text-gray-400">Merge PDFs and images into a single document with customizable order.</p>
          </div>
          
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Image Support</h3>
            <p className="text-gray-600 dark:text-gray-400">Convert and include images (JPG, PNG) alongside your PDF documents.</p>
          </div>
          
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Drag & Reorder</h3>
            <p className="text-gray-600 dark:text-gray-400">Easily rearrange files with drag-and-drop to control the final document order.</p>
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

export default PDFMerge; 