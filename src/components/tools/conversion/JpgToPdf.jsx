import React, { useState, useRef, useEffect } from 'react';

const JpgToPdf = () => {
  const [images, setImages] = useState([]);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pageSize, setPageSize] = useState('a4');
  const [orientation, setOrientation] = useState('portrait');
  const [margin, setMargin] = useState(10);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const fileInputRef = useRef(null);
  const imagesSectionRef = useRef(null);
  const settingsSectionRef = useRef(null);

  // Load necessary libraries
  useEffect(() => {
    // Load both jsPDF and html2canvas for better image handling
    const loadLibraries = async () => {
      setLoading(true);
      
      try {
        // Load jsPDF
        if (!window.jspdf) {
          const jsPdfScript = document.createElement('script');
          jsPdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
          jsPdfScript.async = true;
          document.body.appendChild(jsPdfScript);
          
          // Wait for script to load
          await new Promise((resolve, reject) => {
            jsPdfScript.onload = resolve;
            jsPdfScript.onerror = () => reject(new Error('Failed to load jsPDF library'));
          });
          
          console.log('jsPDF loaded successfully');
        }
      } catch (err) {
        console.error('Error loading libraries:', err);
        setError(`Failed to load necessary libraries: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    loadLibraries();
    
    // Cleanup
    return () => {
      const scripts = document.querySelectorAll('script[src*="jspdf"]');
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

  const onSelectFiles = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files) => {
    // Reset states
    setPdfUrl(null);
    setError(null);

    // Filter out non-image files
    const imageFiles = files.filter(file => file.type.match('image.*'));
    
    if (imageFiles.length === 0) {
      setError('Please select at least one image file (JPG, PNG, etc.)');
      return;
    }

    // Process each image file
    const newImages = imageFiles.map(file => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      preview: URL.createObjectURL(file),
      loading: true,
      dimensions: { width: 0, height: 0 }
    }));

    // Add to the list of images
    setImages(prev => [...prev, ...newImages]);

    // Load image dimensions
    newImages.forEach((image, index) => {
      const img = new Image();
      img.onload = () => {
        setImages(prev => {
          const updated = [...prev];
          const targetIndex = prev.findIndex(i => i.preview === image.preview);
          if (targetIndex !== -1) {
            updated[targetIndex] = {
              ...updated[targetIndex],
              dimensions: { width: img.naturalWidth, height: img.naturalHeight },
              loading: false
            };
          }
          return updated;
        });
      };
      img.src = image.preview;
    });
    
    // Scroll to the images section after a short delay to ensure the component has rendered
    setTimeout(() => {
      if (imagesSectionRef.current) {
        imagesSectionRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 300);
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
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const removeImage = (index) => {
    setImages(prev => {
      const updated = [...prev];
      // Revoke object URL to avoid memory leaks
      if (updated[index].preview) {
        URL.revokeObjectURL(updated[index].preview);
      }
      updated.splice(index, 1);
      return updated;
    });
    setPdfUrl(null); // Reset PDF as images changed
  };

  const reorderImages = (startIndex, endIndex) => {
    setImages(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
    setPdfUrl(null); // Reset PDF as image order changed
  };

  const moveImageUp = (index) => {
    if (index > 0) {
      reorderImages(index, index - 1);
    }
  };

  const moveImageDown = (index) => {
    if (index < images.length - 1) {
      reorderImages(index, index + 1);
    }
  };

  const generatePDF = async () => {
    if (images.length === 0) {
      setError('Please add at least one image');
      return;
    }

    if (!window.jspdf) {
      setError('PDF generation library not loaded yet. Please try again.');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setPdfUrl(null);
    
    try {
      // Create new jsPDF instance
      const { jsPDF } = window.jspdf;
      
      // Initialize PDF with proper orientation and page size
      const doc = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: pageSize
      });

      // Get page dimensions
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Apply margins to content area
      const contentWidth = pageWidth - (2 * margin);
      const contentHeight = pageHeight - (2 * margin);
      
      console.log(`PDF dimensions: ${pageWidth}x${pageHeight}mm, margins: ${margin}mm, content area: ${contentWidth}x${contentHeight}mm`);
      console.log(`Orientation: ${orientation}, Page size: ${pageSize}`);

      // Pre-load all images as base64 data to ensure proper rendering
      const imagePromises = images.map(async (image, index) => {
        return new Promise((resolve, reject) => {
          try {
            // Create a temporary canvas to ensure image data is properly formatted
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Create an image element to load the image data
            const img = new Image();
            img.crossOrigin = 'Anonymous'; // Handle cross-origin issues
            
            img.onload = () => {
              // Set canvas dimensions to match the image
              canvas.width = img.width;
              canvas.height = img.height;
              
              // Draw the image onto the canvas
              ctx.drawImage(img, 0, 0, img.width, img.height);
              
              // Get the image data as a base64 string
              try {
                // Use the appropriate format (JPEG for JPG files, PNG for others)
                const imageFormat = image.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
                const quality = image.type === 'image/jpeg' ? 0.95 : 1.0;
                const dataUrl = canvas.toDataURL(imageFormat, quality);
                
                console.log(`Image ${index+1} converted to DataURL (${dataUrl.substring(0, 50)}...)`);
                
                // Resolve with the processed image data and dimensions
                resolve({
                  index,
                  dataUrl,
                  width: img.width,
                  height: img.height,
                  originalName: image.name
                });
              } catch (err) {
                console.error(`Error converting image ${index} to data URL:`, err);
                reject(err);
              }
            };
            
            img.onerror = (err) => {
              console.error(`Error loading image ${index}:`, err);
              reject(new Error(`Failed to load image: ${image.name}`));
            };
            
            // Set source to the preview URL
            img.src = image.preview;
            
            // Update progress
            setProgress(Math.round(((index + 0.5) / images.length) * 50)); // First 50% is for image loading
          } catch (err) {
            console.error(`Error processing image ${index}:`, err);
            reject(err);
          }
        });
      });
      
      try {
        // Wait for all images to be processed
        const processedImages = await Promise.all(imagePromises);
        console.log(`Successfully processed ${processedImages.length} images`);
        
        // Add each image to the PDF
        for (let i = 0; i < processedImages.length; i++) {
          const processedImage = processedImages[i];
          
          // Add new page for all images except the first one
          if (i > 0) {
            doc.addPage(pageSize, orientation);
          }
          
          // Calculate image dimensions to fit in PDF while maintaining aspect ratio
          const imgRatio = processedImage.width / processedImage.height;
          let imgWidth, imgHeight;
          
          // Calculate available content area ratio
          const contentRatio = contentWidth / contentHeight;
          
          if (imgRatio > contentRatio) {
            // Image is wider than the content area (relative to heights)
            imgWidth = contentWidth;
            imgHeight = imgWidth / imgRatio;
          } else {
            // Image is taller than the content area (relative to widths)
            imgHeight = contentHeight;
            imgWidth = imgHeight * imgRatio;
          }
          
          // Center the image on the page
          const x = margin + (contentWidth - imgWidth) / 2;
          const y = margin + (contentHeight - imgHeight) / 2;
          
          console.log(`Adding image ${i+1} to PDF: placing at (${x},${y})mm, size: ${imgWidth}x${imgHeight}mm`);
          
          try {
            // Add image to PDF using the data URL directly
            doc.addImage(
              processedImage.dataUrl,
              processedImage.dataUrl.includes('data:image/jpeg') ? 'JPEG' : 'PNG',
              x,
              y,
              imgWidth,
              imgHeight
            );
            
            console.log(`Successfully added image ${i+1} to PDF`);
          } catch (err) {
            console.error(`Error adding image ${i+1} to PDF:`, err);
            setError(`Error adding image ${processedImage.originalName} to PDF: ${err.message}`);
          }
          
          // Update progress (remaining 50% is for PDF generation)
          setProgress(50 + Math.round(((i + 1) / processedImages.length) * 50));
        }
        
        // Generate PDF data as blob with forced binary mode
        console.log('Generating final PDF...');
        const pdfBlob = doc.output('blob');
        console.log('PDF blob created:', pdfBlob);
        
        // Create URL for the blob
        const pdfUrl = URL.createObjectURL(pdfBlob);
        console.log('PDF URL created:', pdfUrl);
        setPdfUrl(pdfUrl);
        
        console.log('PDF generation completed successfully');
      } catch (err) {
        console.error('Error processing images:', err);
        setError(`Error processing images: ${err.message}`);
      }
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError(`Failed to generate PDF: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setProgress(100);
    }
  };

  const downloadPDF = () => {
    if (!pdfUrl) {
      setError('No PDF available to download');
      return;
    }
    
    try {
      // Create a filename with date/time to avoid duplicates
      const filename = `images_to_pdf_${new Date().toISOString().replace(/[:.]/g, '-')}.pdf`;
      
      console.log(`Downloading PDF as ${filename}`);
      
      // Option 1: Use fetch to ensure the PDF is valid
      fetch(pdfUrl)
        .then(response => response.blob())
        .then(blob => {
          // Create a new blob URL from the fetched blob to ensure it's fresh
          const blobUrl = URL.createObjectURL(blob);
          
          // Create a temporary link element
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = filename;
          link.target = '_blank';
          
          // Append to document, click, and remove
          document.body.appendChild(link);
          link.click();
          
          // Small delay before removing the link and revoking the blob URL
          setTimeout(() => {
            if (document.body.contains(link)) {
              document.body.removeChild(link);
            }
            URL.revokeObjectURL(blobUrl); // Clean up the temporary blob URL
          }, 100);
        })
        .catch(err => {
          console.error('Error downloading PDF via fetch:', err);
          // Fall back to the direct method
          window.open(pdfUrl, '_blank');
        });
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setError(`Failed to download PDF: ${err.message}`);
      
      // Fallback: Open in new tab
      window.open(pdfUrl, '_blank');
    }
  };

  const clearAll = () => {
    // Clean up object URLs to prevent memory leaks
    images.forEach(image => {
      if (image.preview) {
        URL.revokeObjectURL(image.preview);
      }
    });
    setImages([]);
    setPdfUrl(null);
    setError(null);
  };

  const pageSizeOptions = [
    { value: 'a4', label: 'A4 (210 × 297 mm)' },
    { value: 'a3', label: 'A3 (297 × 420 mm)' },
    { value: 'a5', label: 'A5 (148 × 210 mm)' },
    { value: 'letter', label: 'Letter (215.9 × 279.4 mm)' },
    { value: 'legal', label: 'Legal (215.9 × 355.6 mm)' }
  ];

  return (
    <div className="flex flex-col space-y-4">
      {/* Tool navbar */}
      <div className="bg-gray-900 p-4 flex space-x-4 rounded-t-xl">
        <button className="px-4 py-2 flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 rounded-md text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          <span>JPG to PDF</span>
        </button>
      </div>
      
      {/* Main content area */}
      <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-b-xl">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
            Convert Images to PDF
          </h1>
          
          {/* Upload Area - Show if no PDF is generated yet */}
          {!pdfUrl && (
            <div 
              className={`
                border-4 border-dashed rounded-2xl p-8 text-center transition-all duration-300 mb-8
                ${isDragging 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-10 animate-pulse scale-105' 
                  : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50 dark:border-gray-600 dark:hover:border-blue-400 dark:hover:bg-gray-700'
                }
                cursor-pointer relative overflow-hidden group
              `}
              onClick={handleButtonClick}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-900 dark:to-purple-900 opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-xl"></div>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={onSelectFiles}
                accept="image/*"
                multiple
                className="hidden"
              />
              
              <div className="py-6">
                <div className="mb-4 flex justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-16 w-16 ${isDragging ? 'text-blue-600' : 'text-gray-400'} transition-colors duration-300`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className={`text-xl font-semibold mb-2 ${isDragging ? 'text-blue-600' : 'text-gray-700'} dark:text-white transition-colors duration-300`}>
                  {isDragging ? 'Drop your images here!' : 'Drag & Drop your images here'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  or click to browse your files
                </p>
                {error && (
                  <p className="text-red-500 text-sm mb-4">{error}</p>
                )}
                <div className="text-sm text-gray-400 dark:text-gray-500">
                  Supports JPG, PNG, GIF, WebP
                </div>
              </div>
            </div>
          )}

          {/* Image list */}
          {images.length > 0 && (
            <div className="mb-8" ref={imagesSectionRef}>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center justify-between">
                <span>Selected Images ({images.length})</span>
                <button 
                  onClick={clearAll}
                  className="text-sm px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 dark:bg-red-900 dark:bg-opacity-30 dark:text-red-400 dark:hover:bg-opacity-50 transition-colors"
                >
                  Clear All
                </button>
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div 
                    key={index} 
                    className="relative bg-white dark:bg-gray-700 rounded-lg shadow-md overflow-hidden group"
                  >
                    <div className="aspect-w-4 aspect-h-3 bg-gray-100 dark:bg-gray-800">
                      {image.loading ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                      ) : (
                        <img 
                          src={image.preview} 
                          alt={image.name}
                          className="object-contain w-full h-full"
                        />
                      )}
                    </div>
                    
                    <div className="p-3">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate" title={image.name}>
                        {image.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {(image.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button 
                        onClick={() => removeImage(index)}
                        className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        title="Remove image"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => moveImageUp(index)}
                        disabled={index === 0}
                        className={`p-1 ${index === 0 ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded-full`}
                        title="Move up"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => moveImageDown(index)}
                        disabled={index === images.length - 1}
                        className={`p-1 ${index === images.length - 1 ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded-full`}
                        title="Move down"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Settings panel */}
          {images.length > 0 && (
            <div className="mb-8 bg-white dark:bg-gray-700 rounded-xl shadow-md p-6" ref={settingsSectionRef}>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                PDF Settings
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Page Size
                  </label>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(e.target.value)}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Page Orientation
                  </label>
                  <div className="flex gap-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        value="portrait"
                        checked={orientation === 'portrait'}
                        onChange={() => setOrientation('portrait')}
                        className="form-radio h-4 w-4 text-blue-600"
                      />
                      <span className="ml-2 text-gray-700 dark:text-gray-300">Portrait</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        value="landscape"
                        checked={orientation === 'landscape'}
                        onChange={() => setOrientation('landscape')}
                        className="form-radio h-4 w-4 text-blue-600"
                      />
                      <span className="ml-2 text-gray-700 dark:text-gray-300">Landscape</span>
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Portrait is vertical, landscape is horizontal
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Margin (mm)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={margin}
                    onChange={(e) => setMargin(Number(e.target.value))}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Space between image and page edge (in millimeters)
                  </p>
                </div>
              </div>
              
              <div className="mt-6">
                <button
                  onClick={generatePDF}
                  disabled={isProcessing || loading || images.length === 0}
                  className={`w-full py-3 rounded-lg text-white text-center font-medium flex items-center justify-center space-x-2
                    ${isProcessing || loading || images.length === 0 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                    } transition-colors`}
                >
                  {isProcessing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Processing... {progress}%</span>
                    </>
                  ) : loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Loading PDF Generator...</span>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V8z" />
                      </svg>
                      <span>Generate PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* PDF Preview with clearer download option */}
          {pdfUrl && (
            <div className="mb-8 bg-white dark:bg-gray-700 rounded-xl shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center justify-between">
                <span>PDF Preview</span>
                <span className="text-sm font-normal text-green-600">Ready to download!</span>
              </h2>
              
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-6">
                <div className="aspect-w-8 aspect-h-11 md:w-2/3 mx-auto">
                  <iframe 
                    src={pdfUrl} 
                    className="w-full h-full border-0 rounded-md shadow-lg"
                    title="PDF Preview"
                  ></iframe>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4 justify-center">
                <button
                  onClick={downloadPDF}
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
                  onClick={clearAll}
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
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">1. Upload Images</h3>
                <p className="text-gray-600 dark:text-gray-400">Upload one or multiple images that you want to convert to a PDF document.</p>
              </div>
              <div className="flex flex-col items-center text-center p-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">2. Adjust Settings</h3>
                <p className="text-gray-600 dark:text-gray-400">Choose page size, orientation, and arrange your images in the desired order.</p>
              </div>
              <div className="flex flex-col items-center text-center p-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">3. Download PDF</h3>
                <p className="text-gray-600 dark:text-gray-400">Generate your PDF and download it to your device. All processing happens locally.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JpgToPdf;