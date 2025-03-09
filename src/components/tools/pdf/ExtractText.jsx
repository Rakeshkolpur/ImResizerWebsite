import React, { useState, useRef, useEffect } from 'react';

// We'll use PDF.js for text extraction
// First, let's add a script to load PDF.js
const PdfJsScript = () => {
  useEffect(() => {
    // Check if PDF.js is already loaded
    if (window.pdfjsLib) return;

    // Create script element to load PDF.js
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
    script.async = true;
    script.onload = () => {
      // Set worker source after loading
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
    };
    document.body.appendChild(script);

    // Cleanup
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return null;
};

const ExtractText = () => {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [error, setError] = useState(null);
  const [extractionType, setExtractionType] = useState('all');
  const [pageRange, setPageRange] = useState('');
  const [totalPages, setTotalPages] = useState(0);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      handleFile(droppedFile);
    }
  };
  
  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      handleFile(selectedFile);
    }
  };
  
  const handleFile = (selectedFile) => {
    // Check if file is a PDF
    if (selectedFile.type !== 'application/pdf') {
      setError('Please select a PDF file');
      setFile(null);
      return;
    }
    
    setError(null);
    setFile(selectedFile);
    setExtractedText('');
    
    // Get total pages in the PDF
    getPageCount(selectedFile).then(count => {
      setTotalPages(count);
    }).catch(err => {
      console.error('Error getting page count:', err);
    });
  };
  
  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const getPageCount = async (pdfFile) => {
    if (!window.pdfjsLib) {
      throw new Error('PDF.js library not loaded');
    }
    
    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      return pdf.numPages;
    } catch (error) {
      console.error('Error loading PDF:', error);
      throw error;
    }
  };

  const extractTextFromPdf = async () => {
    if (!file || !window.pdfjsLib) return;
    
    setIsExtracting(true);
    setError(null);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let pagesToExtract = [];
      
      if (extractionType === 'all') {
        // Extract all pages
        pagesToExtract = Array.from({ length: pdf.numPages }, (_, i) => i + 1);
      } else if (extractionType === 'pages' && pageRange) {
        // Parse page range (e.g., "1-3, 5, 7-9")
        pagesToExtract = parsePageRange(pageRange, pdf.numPages);
      }
      
      if (pagesToExtract.length === 0) {
        throw new Error('No valid pages to extract');
      }
      
      let extractedContent = '';
      
      for (const pageNum of pagesToExtract) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        
        extractedContent += `--- Page ${pageNum} ---\n\n${pageText}\n\n`;
      }
      
      setExtractedText(extractedContent);
    } catch (error) {
      console.error('Error extracting text:', error);
      setError(`Failed to extract text: ${error.message}`);
    } finally {
      setIsExtracting(false);
    }
  };
  
  const parsePageRange = (rangeStr, maxPages) => {
    const pages = new Set();
    
    // Split by comma
    const ranges = rangeStr.split(',').map(r => r.trim());
    
    for (const range of ranges) {
      if (range.includes('-')) {
        // Handle range like "1-5"
        const [start, end] = range.split('-').map(Number);
        
        if (isNaN(start) || isNaN(end) || start < 1 || end > maxPages || start > end) {
          continue; // Skip invalid ranges
        }
        
        for (let i = start; i <= end; i++) {
          pages.add(i);
        }
      } else {
        // Handle single page like "7"
        const page = Number(range);
        
        if (!isNaN(page) && page >= 1 && page <= maxPages) {
          pages.add(page);
        }
      }
    }
    
    return Array.from(pages).sort((a, b) => a - b);
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(extractedText)
      .then(() => {
        alert('Text copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  };
  
  const downloadAsTextFile = () => {
    const element = document.createElement('a');
    const file = new Blob([extractedText], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${file.name ? file.name.replace('.pdf', '') : 'extracted'}_text.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(element.href);
  };

  return (
    <div className="flex flex-col space-y-8">
      {/* Load PDF.js */}
      <PdfJsScript />
      
      {/* Upload Area */}
      <div 
        className={`
          border-4 border-dashed rounded-2xl p-8 text-center transition-all duration-300
          ${isDragging 
            ? 'border-indigo-500 bg-indigo-50 animate-pulse scale-105' 
            : file 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'
          }
          cursor-pointer relative overflow-hidden hover-card group
        `}
        onClick={handleButtonClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-200 to-purple-200 opacity-0 group-hover:opacity-20 transition-opacity duration-500 rounded-xl"></div>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInput}
          accept=".pdf,application/pdf"
          className="hidden"
        />
        
        {file ? (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 mb-4 flex items-center justify-center">
              <svg className="w-16 h-16 text-red-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 18H17V16H7V18Z" fill="currentColor" />
                <path d="M17 14H7V12H17V14Z" fill="currentColor" />
                <path d="M7 10H11V8H7V10Z" fill="currentColor" />
                <path fillRule="evenodd" clipRule="evenodd" d="M6 2C4.34315 2 3 3.34315 3 5V19C3 20.6569 4.34315 22 6 22H18C19.6569 22 21 20.6569 21 19V9C21 5.13401 17.866 2 14 2H6ZM6 4H13V9H19V19C19 19.5523 18.5523 20 18 20H6C5.44772 20 5 19.5523 5 19V5C5 4.44772 5.44772 4 6 4ZM15 4.10002C16.6113 4.4271 17.9413 5.52906 18.584 7H15V4.10002Z" fill="currentColor" />
              </svg>
            </div>
            <p className="text-green-600 font-medium">
              {file.name}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
            {totalPages > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                {totalPages} {totalPages === 1 ? 'page' : 'pages'}
              </p>
            )}
            <button 
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handleButtonClick();
              }}
            >
              Change File
            </button>
          </div>
        ) : (
          <div className="py-6">
            <div className="mb-4 flex justify-center">
              <svg className="w-16 h-16 text-gray-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 18H17V16H7V18Z" fill="currentColor" />
                <path d="M17 14H7V12H17V14Z" fill="currentColor" />
                <path d="M7 10H11V8H7V10Z" fill="currentColor" />
                <path fillRule="evenodd" clipRule="evenodd" d="M6 2C4.34315 2 3 3.34315 3 5V19C3 20.6569 4.34315 22 6 22H18C19.6569 22 21 20.6569 21 19V9C21 5.13401 17.866 2 14 2H6ZM6 4H13V9H19V19C19 19.5523 18.5523 20 18 20H6C5.44772 20 5 19.5523 5 19V5C5 4.44772 5.44772 4 6 4ZM15 4.10002C16.6113 4.4271 17.9413 5.52906 18.584 7H15V4.10002Z" fill="currentColor" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-700">
              {isDragging ? 'Drop your PDF here!' : 'Drag & Drop your PDF here'}
            </h3>
            <p className="text-gray-500 mb-6">
              or click to browse your files
            </p>
            {error && (
              <p className="text-red-500 text-sm mb-4">{error}</p>
            )}
            <div className="text-sm text-gray-400">
              Supports PDF files up to 100MB
            </div>
          </div>
        )}
      </div>
      
      {/* Extraction Options */}
      {file && !extractedText && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 space-y-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Extraction Options</h2>
          
          <div className="space-y-4">
            <div>
              <label className="flex items-center cursor-pointer">
                <input 
                  type="radio" 
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 cursor-pointer" 
                  name="extraction-type" 
                  value="all" 
                  checked={extractionType === 'all'}
                  onChange={() => setExtractionType('all')}
                />
                <span className="ml-2 text-gray-700 dark:text-gray-300">Extract all text ({totalPages} {totalPages === 1 ? 'page' : 'pages'})</span>
              </label>
            </div>
            <div>
              <label className="flex items-center cursor-pointer">
                <input 
                  type="radio" 
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 cursor-pointer" 
                  name="extraction-type" 
                  value="pages" 
                  checked={extractionType === 'pages'}
                  onChange={() => setExtractionType('pages')}
                />
                <span className="ml-2 text-gray-700 dark:text-gray-300">Extract text from specific pages</span>
              </label>
              <input 
                type="text" 
                placeholder="e.g., 1-3, 5, 7-9" 
                className="mt-2 w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={extractionType !== 'pages'}
                value={pageRange}
                onChange={(e) => setPageRange(e.target.value)}
              />
            </div>
          </div>
          
          <button
            onClick={extractTextFromPdf}
            disabled={isExtracting || !file || (extractionType === 'pages' && !pageRange)}
            className={`
              w-full py-3 px-4 rounded-lg text-white font-medium transition-all cursor-pointer
              ${isExtracting || (extractionType === 'pages' && !pageRange)
                ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' 
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg'}
            `}
          >
            {isExtracting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Extracting Text...
              </span>
            ) : 'Extract Text'}
          </button>
        </div>
      )}
      
      {/* Extracted Text Results */}
      {extractedText && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Extracted Text</h2>
            <div className="flex space-x-2">
              <button 
                onClick={copyToClipboard}
                className="p-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                title="Copy to clipboard"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              </button>
              <button 
                onClick={downloadAsTextFile}
                className="p-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                title="Download as text file"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4 h-96 overflow-y-auto">
            <pre className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono text-sm">
              {extractedText}
            </pre>
          </div>
          
          <div className="flex justify-between">
            <button
              onClick={() => setExtractedText('')}
              className="py-2 px-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors cursor-pointer"
            >
              Back to Options
            </button>
            
            <button
              onClick={copyToClipboard}
              className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center shadow-md hover:shadow-lg cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              Copy to Clipboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExtractText; 