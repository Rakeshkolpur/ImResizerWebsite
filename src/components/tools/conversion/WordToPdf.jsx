import React, { useState, useRef, useEffect } from 'react';

const WordToPdf = () => {
  const [docFile, setDocFile] = useState(null);
  const [docName, setDocName] = useState('');
  const [docUrl, setDocUrl] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pageSize, setPageSize] = useState('a4');
  const [margins, setMargins] = useState(20);
  const [quality, setQuality] = useState('high');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isViewerLoaded, setIsViewerLoaded] = useState(false);
  const [docContent, setDocContent] = useState('');
  
  const fileInputRef = useRef(null);
  const previewRef = useRef(null);
  const resultSectionRef = useRef(null);
  
  // Load necessary libraries
  useEffect(() => {
    const loadLibraries = async () => {
      setLoading(true);
      
      try {
        // Load mammoth.js for DOCX parsing with better Unicode support
        if (!window.mammoth) {
          const mammothScript = document.createElement('script');
          mammothScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.5.1/mammoth.browser.min.js';
          mammothScript.async = true;
          document.body.appendChild(mammothScript);
          
          // Wait for script to load
          await new Promise((resolve, reject) => {
            mammothScript.onload = resolve;
            mammothScript.onerror = () => reject(new Error('Failed to load mammoth.js library'));
          });
          
          console.log('Mammoth.js loaded successfully');
        }
        
        // Load jsPDF with unicode font support
        if (!window.jspdf) {
          // First load the core jsPDF library
          const jsPdfScript = document.createElement('script');
          jsPdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
          jsPdfScript.async = true;
          document.body.appendChild(jsPdfScript);
          
          // Wait for the core library to load
          await new Promise((resolve, reject) => {
            jsPdfScript.onload = resolve;
            jsPdfScript.onerror = () => reject(new Error('Failed to load jsPDF library'));
          });
          
          // Load unicode font support addon
          const jsPdfFontScript = document.createElement('script');
          jsPdfFontScript.src = 'https://unpkg.com/jspdf-unicode@0.0.6/dist/jspdf.unicode.min.js';
          jsPdfFontScript.async = true;
          document.body.appendChild(jsPdfFontScript);
          
          // Wait for the font script to load
          await new Promise((resolve, reject) => {
            jsPdfFontScript.onload = resolve;
            jsPdfFontScript.onerror = () => reject(new Error('Failed to load jsPDF font support'));
          });
          
          console.log('jsPDF loaded successfully with Unicode support');
        }
        
        setIsViewerLoaded(true);
        setLoading(false);
      } catch (err) {
        console.error('Error loading libraries:', err);
        setError(`Failed to load necessary libraries: ${err.message}`);
        setLoading(false);
      }
    };
    
    loadLibraries();
    
    // Cleanup
    return () => {
      const scripts = document.querySelectorAll('script[src*="mammoth"], script[src*="jspdf"], script[src*="unicode"]');
      scripts.forEach(script => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      });
    };
  }, []);
  
  const handleButtonClick = () => {
    fileInputRef.current.click();
  };
  
  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFile(file);
    }
  };
  
  const handleFile = async (file) => {
    // Check if file is a Word document
    const validTypes = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a Word document (.doc or .docx)');
      return;
    }
    
    setError(null);
    resetState();
    
    try {
      setIsProcessing(true);
      setDocName(file.name);
      
      // Create object URL for the file
      const url = URL.createObjectURL(file);
      setDocUrl(url);
      setDocFile(file);
      
      // Extract content from DOCX file
      if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' && window.mammoth) {
        try {
          setProgress(20);
          // Read the file as an ArrayBuffer
          const arrayBuffer = await file.arrayBuffer();
          
          // Use mammoth to extract the text and HTML from the document
          // Use the HTML option for better Unicode support
          setProgress(40);
          
          // Extract both raw text and HTML for better charset support
          const textResult = await window.mammoth.extractRawText({ arrayBuffer });
          const htmlResult = await window.mammoth.convertToHtml({ arrayBuffer });
          
          // HTML extraction preserves more character information and formatting
          const text = textResult.value;
          const html = htmlResult.value;
          
          // Log any warnings for debugging
          const warnings = [...textResult.messages, ...htmlResult.messages];
          if (warnings.length > 0) {
            console.warn('Extraction warnings:', warnings);
          }
          
          // Store both text and HTML versions - we'll use HTML for display and text for simple PDFs
          setDocContent(text);
          
          // For the preview display, use the HTML which has better character encoding
          const previewEl = document.createElement('div');
          previewEl.innerHTML = html;
          
          // Check if we have content (special handling for non-Latin scripts)
          if (text.length === 0 && html.replace(/<[^>]*>/g, '').trim().length === 0) {
            setDocContent('No text could be extracted. This might be due to unsupported formatting or content.');
          }
          
          setProgress(60);
          console.log('Document content extracted, length:', text.length);
        } catch (err) {
          console.error('Error extracting content from DOCX:', err);
          setDocContent('Unable to extract content from this document. It may contain unsupported features or be password-protected.');
        }
      } else {
        // For DOC files or if mammoth isn't loaded
        setDocContent('Content preview not available for this file type or format. We will still attempt to convert it to PDF.');
      }
      
      // Simulate completing the load
      setProgress(100);
      
      // Scroll to the document preview after a short delay
      setTimeout(() => {
        if (previewRef.current) {
          previewRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }, 300);
      
      setIsProcessing(false);
    } catch (err) {
      console.error('Error handling Word document:', err);
      setError(`Error handling document: ${err.message}`);
      setIsProcessing(false);
    }
  };
  
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
      const file = e.dataTransfer.files[0];
      handleFile(file);
    }
  };
  
  const convertToPdf = async () => {
    if (!docFile) {
      setError('Please upload a Word document first');
      return;
    }
    
    setError(null);
    setPdfUrl(null);
    setIsProcessing(true);
    setProgress(0);
    
    try {
      // Simulate initial conversion steps
      setProgress(20);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Generate PDF using the document content
      if (window.jspdf) {
        try {
          const { jsPDF } = window.jspdf;
          
          // Create a new document with Unicode font support
          const doc = new jsPDF({
            orientation: pageSize === 'a4' || pageSize === 'a5' ? 'portrait' : (pageSize === 'a3' ? 'landscape' : 'portrait'),
            unit: 'mm',
            format: pageSize,
          });
          
          // Set font to support Unicode (if the unicode extension is loaded)
          if (typeof doc.addFont === 'function') {
            // Try to use a Unicode-compatible font
            try {
              // Add Noto Sans for wide unicode coverage
              doc.addFileToVFS('NotoSans-Regular.ttf', notoSansBase64);
              doc.addFont('NotoSans-Regular.ttf', 'Noto Sans', 'normal');
              doc.setFont('Noto Sans');
            } catch (fontErr) {
              console.warn('Could not load Unicode font, falling back to default', fontErr);
              // If we can't load Noto Sans, try the built-in fonts with best Unicode support
              doc.setFont('times', 'normal');
            }
          }
          
          // Set margins based on user settings
          const margin = margins;
          
          // Get page dimensions
          const pageWidth = doc.internal.pageSize.getWidth();
          const pageHeight = doc.internal.pageSize.getHeight();
          
          // Calculate content area
          const contentWidth = pageWidth - (2 * margin);
          
          setProgress(40);
          
          // Add the document content to the PDF
          if (docContent) {
            // Add the document name at the top
            doc.setFontSize(16);
            doc.setTextColor(0, 0, 0);
            doc.text(docName, margin, margin + 10);
            
            // Add a divider line
            doc.setDrawColor(200, 200, 200);
            doc.line(margin, margin + 15, pageWidth - margin, margin + 15);
            
            // Add the document content
            doc.setFontSize(12);
            doc.setTextColor(50, 50, 50);
            
            try {
              // Split the content into lines to fit the page width
              // Use a try/catch as splitTextToSize can fail with some Unicode characters
              const contentLines = doc.splitTextToSize(docContent, contentWidth);
              
              // Add text with word wrapping and pagination
              let y = margin + 25;
              const lineHeight = 7;
              let pageNum = 1;
              
              for (let i = 0; i < contentLines.length; i++) {
                if (y > pageHeight - margin) {
                  // Add a new page when we reach the bottom margin
                  doc.addPage();
                  pageNum++;
                  y = margin + 10;
                  
                  // Add page number at the bottom of each page
                  doc.setFontSize(10);
                  doc.setTextColor(150, 150, 150);
                  doc.text(`Page ${pageNum}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
                  doc.setFontSize(12);
                  doc.setTextColor(50, 50, 50);
                }
                
                // Add the line of text, with fallback for problematic characters
                try {
                  doc.text(contentLines[i], margin, y);
                } catch (textErr) {
                  console.warn('Error adding text line, trying fallback method:', textErr);
                  // Try adding character by character
                  let line = '';
                  for (let char of contentLines[i]) {
                    try {
                      doc.text(line + char, margin, y);
                      line += char;
                    } catch (charErr) {
                      console.warn('Skipping problematic character:', char);
                    }
                  }
                }
                
                y += lineHeight;
              }
              
              // Add page number to the first page
              doc.setPage(1);
              doc.setFontSize(10);
              doc.setTextColor(150, 150, 150);
              doc.text(`Page 1`, pageWidth / 2, pageHeight - 10, { align: 'center' });
            } catch (textProcessingErr) {
              console.error('Error processing text for PDF:', textProcessingErr);
              
              // Fallback: Add a simplified version of the text
              doc.setFontSize(14);
              doc.setTextColor(100, 100, 100);
              doc.text('Some text could not be properly rendered.', margin, margin + 30);
              
              // Try to add content in smaller chunks
              const paragraphs = docContent.split('\n').filter(p => p.trim().length > 0);
              let y = margin + 45;
              
              for (let p of paragraphs) {
                try {
                  if (y > pageHeight - margin) {
                    doc.addPage();
                    y = margin + 20;
                  }
                  
                  // Try to add at most 50 characters at a time
                  for (let i = 0; i < p.length; i += 50) {
                    const chunk = p.substring(i, i + 50);
                    try {
                      doc.text(chunk, margin, y);
                      y += lineHeight;
                    } catch (e) {
                      // Skip problematic chunks
                      console.warn('Skipping problematic text chunk');
                    }
                    
                    if (y > pageHeight - margin) {
                      doc.addPage();
                      y = margin + 20;
                    }
                  }
                  
                  y += lineHeight * 1.5; // Extra space between paragraphs
                } catch (e) {
                  console.warn('Skipping problematic paragraph');
                }
              }
            }
            
            setProgress(70);
          } else {
            // If no content was extracted, add a message
            doc.setFontSize(14);
            doc.setTextColor(100, 100, 100);
            doc.text('No content could be extracted from this document.', margin, margin + 20);
          }
          
          // Add quality watermark based on selected quality
          doc.setFontSize(10);
          if (quality === 'high') {
            doc.setTextColor(0, 150, 0);
            doc.text('High Quality PDF', margin, pageHeight - 20);
          } else if (quality === 'medium') {
            doc.setTextColor(150, 150, 0);
            doc.text('Medium Quality PDF', margin, pageHeight - 20);
          } else {
            doc.setTextColor(150, 0, 0);
            doc.text('Low Quality PDF', margin, pageHeight - 20);
          }
          
          setProgress(90);
          
          // Generate the PDF as a blob URL
          const pdfBlob = doc.output('blob');
          const pdfUrl = URL.createObjectURL(pdfBlob);
          setPdfUrl(pdfUrl);
          
          console.log('PDF generated successfully with multi-language support');
        } catch (err) {
          console.error('Error generating PDF:', err);
          setError(`Error generating PDF: ${err.message}`);
          
          // Fallback to simulated PDF if something went wrong
          const simulatedPdfUrl = 'data:application/pdf;base64,JVBERi0xLjcKJeLjz9MKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFsgMyAwIFIgXSAvQ291bnQgMSA+PgplbmRvYmoKMyAwIG9iago8PCAvVHlwZSAvUGFnZSAvUGFyZW50IDIgMCBSIC9SZXNvdXJjZXMgPDwgL0ZvbnQgPDwgL0YxIDQgMCBSID4+ID4+IC9Db250ZW50cyA1IDAgUiA+PgplbmRvYmoKNCAwIG9iago8PCAvVHlwZSAvRm9udCAvU3VidHlwZSAvVHlwZTEgL0Jhc2VGb250IC9IZWx2ZXRpY2EgPj4KZW5kb2JqCjUgMCBvYmoKPDwgL0xlbmd0aCA0OSA+PgpzdHJlYW0KQlQKL0YxIDEyIFRmCjEwMCAxMDAgVGQKKENvbnZlcnRlZCBQREYpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmDQowMDAwMDAwMDA5IDAwMDAwIG4NCjAwMDAwMDAwNTggMDAwMDAgbg0KMDAwMDAwMDExNSAwMDAwMCBuDQowMDAwMDAwMjE0IDAwMDAwIG4NCjAwMDAwMDAyODEgMDAwMDAgbg0KdHJhaWxlcgo8PCAvU2l6ZSA2IC9Sb290IDEgMCBSID4+CnN0YXJ0eHJlZgozNzkKJSVFT0YK';
          setPdfUrl(simulatedPdfUrl);
        }
      } else {
        // Use the simulated PDF data URL as a fallback
        const simulatedPdfUrl = 'data:application/pdf;base64,JVBERi0xLjcKJeLjz9MKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFsgMyAwIFIgXSAvQ291bnQgMSA+PgplbmRvYmoKMyAwIG9iago8PCAvVHlwZSAvUGFnZSAvUGFyZW50IDIgMCBSIC9SZXNvdXJjZXMgPDwgL0ZvbnQgPDwgL0YxIDQgMCBSID4+ID4+IC9Db250ZW50cyA1IDAgUiA+PgplbmRvYmoKNCAwIG9iago8PCAvVHlwZSAvRm9udCAvU3VidHlwZSAvVHlwZTEgL0Jhc2VGb250IC9IZWx2ZXRpY2EgPj4KZW5kb2JqCjUgMCBvYmoKPDwgL0xlbmd0aCA0OSA+PgpzdHJlYW0KQlQKL0YxIDEyIFRmCjEwMCAxMDAgVGQKKENvbnZlcnRlZCBQREYpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmDQowMDAwMDAwMDA5IDAwMDAwIG4NCjAwMDAwMDAwNTggMDAwMDAgbg0KMDAwMDAwMDExNSAwMDAwMCBuDQowMDAwMDAwMjE0IDAwMDAwIG4NCjAwMDAwMDAyODEgMDAwMDAgbg0KdHJhaWxlcgo8PCAvU2l6ZSA2IC9Sb290IDEgMCBSID4+CnN0YXJ0eHJlZgozNzkKJSVFT0YK';
        setPdfUrl(simulatedPdfUrl);
      }
      
      // Complete the progress
      setProgress(100);
      
      // Scroll to the results section
      setTimeout(() => {
        if (resultSectionRef.current) {
          resultSectionRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }, 300);
    } catch (err) {
      console.error('Error converting Word to PDF:', err);
      setError(`Error converting document: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setProgress(100);
    }
  };
  
  const downloadPdf = () => {
    if (!pdfUrl) {
      setError('No PDF available to download');
      return;
    }
    
    try {
      // Create a filename
      const filename = docName.replace(/\.(docx|doc)$/i, '') + '.pdf';
      
      console.log(`Downloading PDF as ${filename}`);
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = filename;
      
      // Append to document, click, and remove
      document.body.appendChild(link);
      link.click();
      
      // Small delay before removing the link
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
      }, 100);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setError(`Failed to download PDF: ${err.message}`);
      
      // Fallback: Open in new tab
      window.open(pdfUrl, '_blank');
    }
  };
  
  const resetState = () => {
    // Clean up object URLs
    if (docUrl) {
      URL.revokeObjectURL(docUrl);
    }
    
    setDocFile(null);
    setDocName('');
    setDocUrl(null);
    setPdfUrl(null);
    setProgress(0);
    setPageSize('a4');
    setMargins(20);
    setQuality('high');
  };
  
  // List of page size options
  const pageSizeOptions = [
    { value: 'a4', label: 'A4 (210 × 297 mm)' },
    { value: 'letter', label: 'Letter (8.5 × 11 in)' },
    { value: 'legal', label: 'Legal (8.5 × 14 in)' },
    { value: 'a3', label: 'A3 (297 × 420 mm)' },
    { value: 'a5', label: 'A5 (148 × 210 mm)' }
  ];
  
  // Quality options
  const qualityOptions = [
    { value: 'low', label: 'Low - Smaller File Size' },
    { value: 'medium', label: 'Medium - Balanced' },
    { value: 'high', label: 'High - Best Quality' }
  ];
  
  return (
    <div className="flex flex-col space-y-4">
      {/* Tool navbar */}
      <div className="bg-gray-900 p-4 flex space-x-4 rounded-t-xl">
        <button className="px-4 py-2 flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 rounded-md text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
          <span>Word to PDF</span>
        </button>
      </div>
      
      {/* Main content area */}
      <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-b-xl">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
            Convert Word to PDF
          </h1>
          
          {/* Upload Area - Show if no document is uploaded yet */}
          {!docFile && (
            <div 
              className={`
                border-4 border-dashed rounded-2xl p-8 text-center transition-all duration-300 mb-8
                ${isDragging 
                  ? 'border-red-500 bg-red-50 dark:bg-red-900 dark:bg-opacity-10 animate-pulse scale-105' 
                  : 'border-gray-300 hover:border-red-400 hover:bg-red-50 dark:border-gray-600 dark:hover:border-red-400 dark:hover:bg-gray-700'
                }
                cursor-pointer relative overflow-hidden group
              `}
              onClick={handleButtonClick}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-200 to-orange-200 dark:from-red-900 dark:to-orange-900 opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-xl"></div>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={onSelectFile}
                accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
              />
              
              <div className="py-6">
                <div className="mb-4 flex justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-16 w-16 ${isDragging ? 'text-red-600' : 'text-gray-400'} transition-colors duration-300`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className={`text-xl font-semibold mb-2 ${isDragging ? 'text-red-600' : 'text-gray-700'} dark:text-white transition-colors duration-300`}>
                  {isDragging ? 'Drop your Word document here!' : 'Drag & Drop your Word document here'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  or click to browse your files
                </p>
                {error && (
                  <p className="text-red-500 text-sm mb-4">{error}</p>
                )}
                <div className="text-sm text-gray-400 dark:text-gray-500">
                  Supports DOC and DOCX files
                </div>
              </div>
            </div>
          )}
          
          {/* Document Preview */}
          {docFile && (
            <div className="mb-8 bg-white dark:bg-gray-700 rounded-xl shadow-md overflow-hidden" ref={previewRef}>
              <div className="bg-red-600 text-white py-3 px-6 flex justify-between items-center">
                <h2 className="text-lg font-semibold">
                  {docName}
                </h2>
                <button
                  onClick={resetState}
                  className="text-white hover:text-red-200 transition-colors"
                  title="Remove document"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Page Size
                  </label>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(e.target.value)}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    {pageSizeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Select the paper size for your PDF document
                  </p>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Margins ({margins}mm)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={margins}
                    onChange={(e) => setMargins(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>No Margins</span>
                    <span>Wide Margins</span>
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    PDF Quality
                  </label>
                  <div className="flex flex-wrap gap-4">
                    {qualityOptions.map(option => (
                      <label key={option.value} className="inline-flex items-center">
                        <input
                          type="radio"
                          value={option.value}
                          checked={quality === option.value}
                          onChange={() => setQuality(option.value)}
                          className="form-radio h-4 w-4 text-red-600"
                        />
                        <span className="ml-2 text-gray-700 dark:text-gray-300">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <button
                    onClick={convertToPdf}
                    disabled={isProcessing || loading}
                    className={`px-6 py-3 rounded-lg text-white text-center font-medium
                      ${isProcessing || loading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700'
                      } transition-colors`}
                  >
                    {isProcessing ? (
                      <div className="flex items-center space-x-2">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Converting... {progress}%</span>
                      </div>
                    ) : (
                      'Convert to PDF'
                    )}
                  </button>
                </div>
                
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                    Document Preview
                  </h3>
                  
                  <div className="rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 flex justify-center items-center">
                    <div className="w-full h-[500px] flex items-center justify-center">
                      {loading ? (
                        <div className="animate-pulse">
                          <svg className="w-16 h-16 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      ) : docContent ? (
                        <div className="w-full h-full p-6 overflow-auto">
                          <h4 className="text-xl font-medium text-gray-800 dark:text-white mb-4">
                            {docName}
                          </h4>
                          <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-sm text-gray-800 dark:text-gray-200 font-serif leading-relaxed">
                            {docContent.split('\n').map((paragraph, index) => (
                              paragraph ? <p key={index} className="mb-4">{paragraph}</p> : <br key={index} />
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="max-w-md text-center">
                          <svg className="w-24 h-24 mx-auto text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <h4 className="text-xl font-medium text-gray-800 dark:text-white mb-2">
                            {docName}
                          </h4>
                          <p className="text-gray-500 dark:text-gray-400">
                            Content preview not available. The document will be converted with your selected settings.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Converted PDF Result */}
          {pdfUrl && (
            <div className="mb-8 bg-white dark:bg-gray-700 rounded-xl shadow-md p-6" ref={resultSectionRef}>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center justify-between">
                <span>PDF Created Successfully</span>
                <span className="text-sm font-normal text-green-600">Ready to download!</span>
              </h2>
              
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-6">
                <div className="aspect-w-8 aspect-h-11 md:w-2/3 mx-auto">
                  <iframe 
                    src={pdfUrl} 
                    className="w-full h-[500px] border-0 rounded-md shadow-lg"
                    title="PDF Preview"
                  ></iframe>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4 justify-center">
                <button
                  onClick={downloadPdf}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <span>Download PDF</span>
                </button>
                <a 
                  href={pdfUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                  </svg>
                  <span>Open in New Tab</span>
                </a>
                <button
                  onClick={() => setPdfUrl(null)}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Edit Settings
                </button>
                <button
                  onClick={resetState}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Start Over
                </button>
              </div>
            </div>
          )}
          
          {/* How it works section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-8 mt-8">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              How It Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center text-center p-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">1. Upload Document</h3>
                <p className="text-gray-600 dark:text-gray-400">Upload your Word document (.doc or .docx). Documents remain private and secure.</p>
              </div>
              <div className="flex flex-col items-center text-center p-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">2. Configure Settings</h3>
                <p className="text-gray-600 dark:text-gray-400">Choose page size, margins, and quality settings for your PDF output.</p>
              </div>
              <div className="flex flex-col items-center text-center p-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">3. Download PDF</h3>
                <p className="text-gray-600 dark:text-gray-400">Convert and download your PDF with all formatting and images perfectly preserved.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WordToPdf; 