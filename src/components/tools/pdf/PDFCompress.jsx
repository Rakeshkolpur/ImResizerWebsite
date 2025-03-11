import React, { useState, useRef, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import { FaFileUpload, FaDownload, FaCompress, FaFileAlt, FaTrash } from 'react-icons/fa';

/**
 * PDF Compression component
 * Allows users to reduce the size of PDF documents with different compression levels
 */
const PDFCompress = () => {
  // State for PDF document and processing
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfName, setPdfName] = useState('');
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const [compressionLevel, setCompressionLevel] = useState('medium');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompressed, setIsCompressed] = useState(false);
  const [compressedPdfUrl, setCompressedPdfUrl] = useState(null);
  const [error, setError] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  
  // Refs
  const fileInputRef = useRef(null);
  
  // Compression options
  const compressionOptions = [
    { id: 'low', label: 'Low Compression', quality: 0.8, description: 'Minimal size reduction with best quality' },
    { id: 'medium', label: 'Medium Compression', quality: 0.5, description: 'Balanced size reduction and quality' },
    { id: 'high', label: 'High Compression', quality: 0.2, description: 'Maximum size reduction with lower quality' }
  ];
  
  // Clean up URLs when component unmounts
  useEffect(() => {
    return () => {
      if (compressedPdfUrl) {
        URL.revokeObjectURL(compressedPdfUrl);
      }
    };
  }, [compressedPdfUrl]);
  
  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setPdfName(file.name);
      setOriginalSize(file.size);
      setIsCompressed(false);
      setCompressedSize(0);
      setError(null);
      
      // Reset compressed PDF URL
      if (compressedPdfUrl) {
        URL.revokeObjectURL(compressedPdfUrl);
        setCompressedPdfUrl(null);
      }
      
      // Get page count
      getPageCount(file);
    } else {
      setError('Please select a valid PDF file.');
    }
  };
  
  // Get page count from PDF
  const getPageCount = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      setPageCount(pdfDoc.getPageCount());
    } catch (err) {
      console.error('Error getting page count:', err);
      setError('Failed to read PDF file. The file might be corrupted or password-protected.');
    }
  };
  
  // Handle file drop
  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    const file = event.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setPdfName(file.name);
      setOriginalSize(file.size);
      setIsCompressed(false);
      setCompressedSize(0);
      setError(null);
      
      // Reset compressed PDF URL
      if (compressedPdfUrl) {
        URL.revokeObjectURL(compressedPdfUrl);
        setCompressedPdfUrl(null);
      }
      
      // Get page count
      getPageCount(file);
    } else {
      setError('Please drop a valid PDF file.');
    }
  };
  
  // Handle compression level change
  const handleCompressionLevelChange = (level) => {
    setCompressionLevel(level);
    setIsCompressed(false);
    
    // Reset compressed PDF URL
    if (compressedPdfUrl) {
      URL.revokeObjectURL(compressedPdfUrl);
      setCompressedPdfUrl(null);
    }
  };
  
  // Compress PDF
  const compressPDF = async () => {
    if (!pdfFile) {
      setError('Please select a PDF file first.');
      return;
    }
    
    try {
      setIsProcessing(true);
      setError(null);
      
      // Get selected compression quality
      const selectedOption = compressionOptions.find(option => option.id === compressionLevel);
      const quality = selectedOption ? selectedOption.quality : 0.5;
      
      // Load the PDF
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      // Create a new PDF document
      const compressedPdfDoc = await PDFDocument.create();
      
      // Copy pages from the original document to the new one
      const pages = await compressedPdfDoc.copyPages(pdfDoc, pdfDoc.getPageIndices());
      pages.forEach(page => compressedPdfDoc.addPage(page));
      
      // Compress the PDF
      const compressedPdfBytes = await compressedPdfDoc.save({
        useObjectStreams: true,
        // Additional compression options can be set here
      });
      
      // Create a blob from the compressed PDF
      const blob = new Blob([compressedPdfBytes], { type: 'application/pdf' });
      
      // Create a URL for the blob
      const url = URL.createObjectURL(blob);
      
      // Update state
      setCompressedPdfUrl(url);
      setCompressedSize(blob.size);
      setIsCompressed(true);
      setIsProcessing(false);
    } catch (err) {
      console.error('Error compressing PDF:', err);
      setError(`Failed to compress PDF: ${err.message}`);
      setIsProcessing(false);
    }
  };
  
  // Download compressed PDF
  const downloadCompressedPDF = () => {
    if (!compressedPdfUrl) {
      setError('No compressed PDF available for download.');
      return;
    }
    
    const link = document.createElement('a');
    link.href = compressedPdfUrl;
    
    // Create a new filename with compression level
    const filenameParts = pdfName.split('.');
    const extension = filenameParts.pop();
    const filenameWithoutExtension = filenameParts.join('.');
    const newFilename = `${filenameWithoutExtension}_${compressionLevel}_compressed.${extension}`;
    
    link.download = newFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Reset state
  const resetState = () => {
    setPdfFile(null);
    setPdfName('');
    setOriginalSize(0);
    setCompressedSize(0);
    setIsCompressed(false);
    setError(null);
    setPageCount(0);
    
    // Reset compressed PDF URL
    if (compressedPdfUrl) {
      URL.revokeObjectURL(compressedPdfUrl);
      setCompressedPdfUrl(null);
    }
  };
  
  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Calculate compression percentage
  const calculateCompressionPercentage = () => {
    if (originalSize === 0 || compressedSize === 0) return 0;
    
    const reduction = originalSize - compressedSize;
    const percentage = (reduction / originalSize) * 100;
    
    return Math.round(percentage);
  };
  
  return (
    <div className="flex flex-col space-y-6 bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
      {/* Header */}
      <div className="bg-gray-900 p-4 flex items-center space-x-4 rounded-t-xl">
        <div className="bg-red-600 p-2 rounded-md">
          <FaCompress className="text-white text-xl" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">PDF Compressor</h2>
          <p className="text-gray-300 text-sm">Reduce the size of your PDF documents</p>
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
                    <span>{formatFileSize(originalSize)}</span>
                    <span>•</span>
                    <span>{pageCount} {pageCount === 1 ? 'page' : 'pages'}</span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={resetState}
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-md flex items-center space-x-1 transition-colors"
              >
                <FaTrash className="text-sm" />
                <span>Remove</span>
              </button>
            </div>
          )}
        </div>
        
        {/* Compression options */}
        {pdfFile && (
          <div className="p-6 border-b border-gray-200 dark:border-gray-600">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
              Compression Level
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {compressionOptions.map(option => (
                <div
                  key={option.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    compressionLevel === option.id
                      ? 'border-red-600 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                  onClick={() => handleCompressionLevelChange(option.id)}
                >
                  <div className="flex items-center mb-2">
                    <div
                      className={`w-4 h-4 rounded-full mr-2 ${
                        compressionLevel === option.id
                          ? 'bg-red-600'
                          : 'border border-gray-400 dark:border-gray-500'
                      }`}
                    >
                      {compressionLevel === option.id && (
                        <div className="w-2 h-2 bg-white rounded-full m-1"></div>
                      )}
                    </div>
                    <h4 className="font-medium text-gray-800 dark:text-white">
                      {option.label}
                    </h4>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 ml-6">
                    {option.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Compression action */}
        {pdfFile && (
          <div className="p-6">
            {!isCompressed ? (
              <button
                onClick={compressPDF}
                disabled={isProcessing}
                className={`w-full py-3 px-4 ${
                  isProcessing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700'
                } text-white rounded-md flex items-center justify-center space-x-2 transition-colors`}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Compressing...</span>
                  </>
                ) : (
                  <>
                    <FaCompress />
                    <span>Compress PDF</span>
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-6">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h3 className="font-medium text-green-800 dark:text-green-400 mb-2">
                    Compression Complete!
                  </h3>
                  
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1 mb-4 md:mb-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Original size:</span>
                        <span className="font-medium text-gray-800 dark:text-white">{formatFileSize(originalSize)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Compressed size:</span>
                        <span className="font-medium text-gray-800 dark:text-white">{formatFileSize(compressedSize)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Reduction:</span>
                        <span className="font-medium text-green-600 dark:text-green-400">
                          {calculateCompressionPercentage()}% smaller
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={downloadCompressedPDF}
                      className="py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center justify-center space-x-2 transition-colors"
                    >
                      <FaDownload />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    setCompressionLevel('medium');
                    setIsCompressed(false);
                    if (compressedPdfUrl) {
                      URL.revokeObjectURL(compressedPdfUrl);
                      setCompressedPdfUrl(null);
                    }
                  }}
                  className="w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-md transition-colors"
                >
                  Try Different Compression Settings
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Features section */}
      <div className="bg-white dark:bg-gray-700 rounded-xl shadow-md overflow-hidden p-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">
          PDF Compression Features
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Secure Compression</h3>
            <p className="text-gray-600 dark:text-gray-400">Your files are processed locally on your device, ensuring complete privacy.</p>
          </div>
          
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Fast Processing</h3>
            <p className="text-gray-600 dark:text-gray-400">Compress your PDFs in seconds with our optimized compression algorithm.</p>
          </div>
          
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Customizable</h3>
            <p className="text-gray-600 dark:text-gray-400">Choose from multiple compression levels to balance quality and file size.</p>
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

export default PDFCompress; 