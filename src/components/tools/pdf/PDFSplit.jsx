import React, { useState, useRef, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { 
  FaUpload,
  FaDownload,
  FaTrashAlt,
  FaFilePdf,
  FaCut,
  FaSave,
  FaChevronLeft,
  FaChevronRight,
  FaCopy,
  FaLayerGroup,
  FaFile
} from 'react-icons/fa';

const PDFSplit = () => {
  // State for PDF document and pages
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfName, setPdfName] = useState('');
  const [pageCount, setPageCount] = useState(0);
  const [previewPages, setPreviewPages] = useState([]);
  const [selectedPages, setSelectedPages] = useState([]);
  const [splitMode, setSplitMode] = useState('range'); // 'range', 'extract', 'custom'
  const [rangeStart, setRangeStart] = useState(1);
  const [rangeEnd, setRangeEnd] = useState(1);
  const [customRanges, setCustomRanges] = useState(['']);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [splitResults, setSplitResults] = useState([]);
  const [currentPreviewPage, setCurrentPreviewPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [splitAnimation, setSplitAnimation] = useState(false);
  
  // Refs
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  
  // Load PDF.js library
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
          setError('Failed to load PDF viewer');
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
      setIsLoading(true);
      setError(null);
      setPdfFile(null); // Reset current PDF
      setPreviewPages([]); // Reset previews
      
      // Validate PDF file
      if (!file.type || (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf'))) {
        throw new Error('Please select a valid PDF file');
      }
      
      // Read the PDF file
      const arrayBuffer = await file.arrayBuffer();
      
      // Validate PDF structure
      try {
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pages = pdfDoc.getPageCount();
        
        if (pages === 0) {
          throw new Error('The PDF file appears to be empty');
        }
        
        // Generate previews
        const previews = await generatePreviews(arrayBuffer, pages);
        
        // Update state
        setPdfFile(file);
        setPdfName(file.name);
        setPageCount(pages);
        setPreviewPages(previews);
        setRangeEnd(pages);
        setSelectedPages([]);
        setSplitResults([]);
        
      } catch (err) {
        throw new Error('Invalid or corrupted PDF file. Please try another file.');
      }
      
    } catch (err) {
      setError(err.message);
      // Reset states on error
      setPdfFile(null);
      setPreviewPages([]);
      setPageCount(0);
    } finally {
      setIsLoading(false);
    }
    
    // Reset file input
    if (event.target) {
      event.target.value = null;
    }
  };
  
  // Generate page previews
  const generatePreviews = async (arrayBuffer, pages) => {
    if (!window.pdfjsLib) {
      throw new Error('PDF viewer is not loaded yet. Please try again.');
    }
    
    const previews = [];
    try {
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      for (let i = 1; i <= Math.min(pages, 20); i++) { // Limit to first 20 pages for performance
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;
        
        previews.push(canvas.toDataURL());
      }
    } catch (err) {
      console.error('Error generating previews:', err);
      throw new Error('Failed to generate PDF previews');
    }
    
    return previews;
  };
  
  // Handle page selection
  const togglePageSelection = (pageNum) => {
    setSelectedPages(prev => {
      if (prev.includes(pageNum)) {
        return prev.filter(p => p !== pageNum);
      } else {
        return [...prev, pageNum].sort((a, b) => a - b);
      }
    });
  };
  
  // Handle split mode change
  const handleSplitModeChange = (mode) => {
    setSplitMode(mode);
    setSelectedPages([]);
    setCustomRanges(['']);
    setSplitResults([]);
  };
  
  // Add custom range
  const addCustomRange = () => {
    setCustomRanges(prev => [...prev, '']);
  };
  
  // Update custom range
  const updateCustomRange = (index, value) => {
    setCustomRanges(prev => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };
  
  // Remove custom range
  const removeCustomRange = (index) => {
    setCustomRanges(prev => prev.filter((_, i) => i !== index));
  };
  
  // Split PDF
  const splitPDF = async () => {
    if (!pdfFile) return;
    
    try {
      setIsProcessing(true);
      setError(null);
      setSplitAnimation(true);
      
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const results = [];
      
      switch (splitMode) {
        case 'range':
          // Split by range
          const rangePdf = await PDFDocument.create();
          const rangePages = await rangePdf.copyPages(pdfDoc, 
            Array.from({ length: rangeEnd - rangeStart + 1 }, (_, i) => i + rangeStart - 1)
          );
          rangePages.forEach(page => rangePdf.addPage(page));
          results.push({
            name: `${pdfName.replace('.pdf', '')}_${rangeStart}-${rangeEnd}.pdf`,
            data: await rangePdf.save()
          });
          break;
          
        case 'extract':
          // Extract each page
          for (let i = 0; i < pageCount; i++) {
            const singlePdf = await PDFDocument.create();
            const [page] = await singlePdf.copyPages(pdfDoc, [i]);
            singlePdf.addPage(page);
            results.push({
              name: `${pdfName.replace('.pdf', '')}_page${i + 1}.pdf`,
              data: await singlePdf.save()
            });
          }
          break;
          
        case 'custom':
          // Split by custom ranges
          for (const range of customRanges) {
            if (!range.trim()) continue;
            
            const [start, end] = range.split('-').map(Number);
            if (isNaN(start) || isNaN(end)) continue;
            
            const customPdf = await PDFDocument.create();
            const customPages = await customPdf.copyPages(pdfDoc,
              Array.from({ length: end - start + 1 }, (_, i) => i + start - 1)
            );
            customPages.forEach(page => customPdf.addPage(page));
            results.push({
              name: `${pdfName.replace('.pdf', '')}_${start}-${end}.pdf`,
              data: await customPdf.save()
            });
          }
          break;
      }
      
      setSplitResults(results);
      
      // Animate completion
      setTimeout(() => {
        setSplitAnimation(false);
      }, 1000);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Download split PDF
  const downloadSplitPDF = (result) => {
    const blob = new Blob([result.data], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = result.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  // Download all split PDFs as ZIP
  const downloadAllPDFs = async () => {
    try {
      setIsProcessing(true);
      
      const zip = new JSZip();
      splitResults.forEach(result => {
        zip.file(result.name, result.data);
      });
      
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${pdfName.replace('.pdf', '')}_split.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (err) {
      setError('Failed to create ZIP file');
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="flex flex-col space-y-6 bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
      {/* Header */}
      <div className="bg-gray-900 p-4 flex items-center space-x-4 rounded-t-xl">
        <div className="bg-purple-600 p-2 rounded-md">
          <FaCut className="text-white text-xl" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Split PDF</h2>
          <p className="text-gray-300 text-sm">Split PDF into multiple documents or extract pages</p>
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
          
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300 ${
              isDragging
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
            onClick={() => fileInputRef.current.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files[0];
              if (file) {
                fileInputRef.current.files = e.dataTransfer.files;
                handleFileSelect({ target: { files: [file] } });
              }
            }}
          >
            <FaUpload className={`mx-auto text-4xl mb-4 transition-transform duration-300 ${
              isDragging ? 'text-purple-500 transform scale-110' : 'text-gray-400 dark:text-gray-500'
            }`} />
            
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              {pdfFile ? 'Replace PDF file' : 'Upload PDF file'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Drag and drop your PDF here, or click to browse
            </p>
            
            {pdfFile && (
              <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                <FaFilePdf className="text-red-500" />
                <span className="font-medium">{pdfName}</span>
                <span className="text-gray-400">({pageCount} pages)</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Split options */}
        {pdfFile && (
          <div className="p-6 border-b border-gray-200 dark:border-gray-600">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => handleSplitModeChange('range')}
                className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                  splitMode === 'range'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="flex items-center justify-center mb-2">
                  <FaFile className={`text-2xl ${
                    splitMode === 'range' ? 'text-purple-500' : 'text-gray-400'
                  }`} />
                </div>
                <h3 className="font-medium text-gray-800 dark:text-white mb-1">Split by Range</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Extract specific page ranges</p>
              </button>
              
              <button
                onClick={() => handleSplitModeChange('extract')}
                className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                  splitMode === 'extract'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="flex items-center justify-center mb-2">
                  <FaLayerGroup className={`text-2xl ${
                    splitMode === 'extract' ? 'text-purple-500' : 'text-gray-400'
                  }`} />
                </div>
                <h3 className="font-medium text-gray-800 dark:text-white mb-1">Extract All Pages</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Split into individual pages</p>
              </button>
              
              <button
                onClick={() => handleSplitModeChange('custom')}
                className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                  splitMode === 'custom'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="flex items-center justify-center mb-2">
                  <FaCopy className={`text-2xl ${
                    splitMode === 'custom' ? 'text-purple-500' : 'text-gray-400'
                  }`} />
                </div>
                <h3 className="font-medium text-gray-800 dark:text-white mb-1">Custom Ranges</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Define multiple ranges</p>
              </button>
            </div>
            
            {/* Split mode specific options */}
            <div className="mt-6">
              {splitMode === 'range' && (
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      From Page
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={pageCount}
                      value={rangeStart}
                      onChange={(e) => setRangeStart(Math.min(parseInt(e.target.value) || 1, rangeEnd))}
                      className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      To Page
                    </label>
                    <input
                      type="number"
                      min={rangeStart}
                      max={pageCount}
                      value={rangeEnd}
                      onChange={(e) => setRangeEnd(Math.max(parseInt(e.target.value) || 1, rangeStart))}
                      className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>
              )}
              
              {splitMode === 'custom' && (
                <div className="space-y-3">
                  {customRanges.map((range, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="e.g., 1-3"
                        value={range}
                        onChange={(e) => updateCustomRange(index, e.target.value)}
                        className="flex-1 px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      />
                      <button
                        onClick={() => removeCustomRange(index)}
                        className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-md"
                      >
                        <FaTrashAlt />
                      </button>
                    </div>
                  ))}
                  
                  <button
                    onClick={addCustomRange}
                    className="text-purple-500 hover:text-purple-600 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
                  >
                    + Add Another Range
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Preview */}
        {pdfFile && previewPages.length > 0 && (
          <div className="p-6 border-b border-gray-200 dark:border-gray-600">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
              PDF Preview
            </h3>
            
            <div className="relative">
              <div className="flex justify-center mb-4">
                <img
                  src={previewPages[currentPreviewPage - 1]}
                  alt={`Page ${currentPreviewPage}`}
                  className="max-h-[500px] object-contain rounded-lg shadow-lg"
                />
              </div>
              
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => setCurrentPreviewPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPreviewPage === 1}
                  className={`p-2 rounded-full ${
                    currentPreviewPage === 1
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-purple-500 hover:bg-purple-100 dark:hover:bg-purple-900/20'
                  }`}
                >
                  <FaChevronLeft className="text-xl" />
                </button>
                
                <span className="text-gray-600 dark:text-gray-300">
                  Page {currentPreviewPage} of {pageCount}
                </span>
                
                <button
                  onClick={() => setCurrentPreviewPage(prev => Math.min(pageCount, prev + 1))}
                  disabled={currentPreviewPage === pageCount}
                  className={`p-2 rounded-full ${
                    currentPreviewPage === pageCount
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-purple-500 hover:bg-purple-100 dark:hover:bg-purple-900/20'
                  }`}
                >
                  <FaChevronRight className="text-xl" />
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Split action */}
        {pdfFile && (
          <div className="p-6">
            <button
              onClick={splitPDF}
              disabled={isProcessing}
              className={`w-full py-3 px-4 rounded-md flex items-center justify-center space-x-2 transition-all duration-300 ${
                isProcessing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 transform hover:-translate-y-1'
              } text-white`}
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <FaCut className={`transition-transform duration-500 ${
                    splitAnimation ? 'transform translate-x-2' : ''
                  }`} />
                  <span>Split PDF</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
      
      {/* Split results */}
      {splitResults.length > 0 && (
        <div className="bg-white dark:bg-gray-700 rounded-xl shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-800 dark:text-white">
                Split Results
              </h3>
              
              <button
                onClick={downloadAllPDFs}
                className="flex items-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors"
              >
                <FaDownload />
                <span>Download All</span>
              </button>
            </div>
            
            <div className="space-y-3">
              {splitResults.map((result, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <FaFilePdf className="text-red-500 text-xl" />
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {result.name}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => downloadSplitPDF(result)}
                    className="p-2 text-purple-500 hover:bg-purple-100 dark:hover:bg-purple-900/20 rounded-md transition-colors"
                  >
                    <FaDownload />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-800 dark:text-red-400">
          <h3 className="font-medium mb-1">Error</h3>
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      {/* Features section */}
      <div className="bg-white dark:bg-gray-700 rounded-xl shadow-md overflow-hidden p-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">
          PDF Split Features
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4">
              <FaFile className="text-xl" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
              Split by Range
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Extract specific page ranges from your PDF document
            </p>
          </div>
          
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4">
              <FaLayerGroup className="text-xl" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
              Extract Pages
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Split your PDF into individual pages automatically
            </p>
          </div>
          
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4">
              <FaCopy className="text-xl" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
              Custom Ranges
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Define multiple custom ranges to split your PDF exactly how you want
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFSplit; 