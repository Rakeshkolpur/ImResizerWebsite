import React, { useState, useRef } from 'react';

const PdfToWord = () => {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [convertedFile, setConvertedFile] = useState(null);
  const [error, setError] = useState(null);
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
    setConvertedFile(null);
  };
  
  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const convertPdfToWord = () => {
    if (!file) return;
    
    setIsConverting(true);
    
    // In a real application, this would be an API call to a server that does the conversion
    // For this demo, we'll simulate a conversion with a timeout
    setTimeout(() => {
      setIsConverting(false);
      // For demonstration, just create a mock Word file
      const mockWordFile = new Blob(['Converted content'], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      setConvertedFile({
        blob: mockWordFile,
        name: file.name.replace('.pdf', '.docx')
      });
    }, 2000);
  };
  
  const downloadFile = () => {
    if (!convertedFile) return;
    
    const url = URL.createObjectURL(convertedFile.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = convertedFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col space-y-8">
      {/* Upload Area */}
      <div 
        className={`
          border-4 border-dashed rounded-2xl p-8 text-center transition-all duration-300
          ${isDragging 
            ? 'border-blue-500 bg-blue-50 animate-pulse scale-105' 
            : file 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
          }
          cursor-pointer relative overflow-hidden hover-card group
        `}
        onClick={handleButtonClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-200 to-indigo-200 opacity-0 group-hover:opacity-20 transition-opacity duration-500 rounded-xl"></div>
        
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
            <button 
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
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
      
      {/* Conversion Options */}
      {file && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 space-y-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Conversion Options</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                Output Format
              </label>
              <select className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="docx">Word Document (.docx)</option>
                <option value="doc">Word 97-2003 (.doc)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                Layout Accuracy
              </label>
              <select className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="high">High (slower conversion)</option>
                <option value="medium">Medium (balanced)</option>
                <option value="low">Low (faster conversion)</option>
              </select>
            </div>
          </div>
          
          <button
            onClick={convertPdfToWord}
            disabled={isConverting || !file}
            className={`
              w-full py-3 px-4 rounded-lg text-white font-medium transition-all
              ${isConverting 
                ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg'}
            `}
          >
            {isConverting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Converting...
              </span>
            ) : 'Convert PDF to Word'}
          </button>
        </div>
      )}
      
      {/* Download Section */}
      {convertedFile && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-600 dark:text-green-300 mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Conversion Complete!</h2>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6 flex items-center">
            <svg className="w-10 h-10 text-blue-500 mr-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 18H17V16H7V18Z" fill="currentColor" />
              <path d="M17 14H7V12H17V14Z" fill="currentColor" />
              <path d="M7 10H11V8H7V10Z" fill="currentColor" />
              <path fillRule="evenodd" clipRule="evenodd" d="M6 2C4.34315 2 3 3.34315 3 5V19C3 20.6569 4.34315 22 6 22H18C19.6569 22 21 20.6569 21 19V9C21 5.13401 17.866 2 14 2H6ZM6 4H13V9H19V19C19 19.5523 18.5523 20 18 20H6C5.44772 20 5 19.5523 5 19V5C5 4.44772 5.44772 4 6 4ZM15 4.10002C16.6113 4.4271 17.9413 5.52906 18.584 7H15V4.10002Z" fill="currentColor" />
            </svg>
            <div>
              <p className="font-medium text-gray-800 dark:text-white">{convertedFile.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Word Document</p>
            </div>
          </div>
          
          <button
            onClick={downloadFile}
            className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center shadow-md hover:shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Word Document
          </button>
        </div>
      )}
    </div>
  );
};

export default PdfToWord; 