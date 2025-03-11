import React, { useState, useEffect, useRef } from 'react';
import { 
  resizeImage, 
  resizeToTargetSize, 
  getImageDimensions, 
  calculateFileSize 
} from '../../../utils/imageProcessing';

const ImageResize = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  const [resizedImages, setResizedImages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState(null);
  const [pasteEnabled, setPasteEnabled] = useState(false);
  const [resizeError, setResizeError] = useState(null);
  const fileInputRef = useRef(null);

  const [resizeSettings, setResizeSettings] = useState({
    mode: 'reduce', // 'reduce' or 'increase'
    width: 800,
    height: 600,
    keepAspectRatio: true,
    targetSize: null,
    format: 'png',
    quality: 90,
    algorithm: 'bicubic' // Default to bicubic interpolation
  });

  // Size presets in KB
  const reducePresets = [10, 20, 30, 40, 50, 60, 80, 100, 150, 200];
  const increasePresets = [300, 400, 500, 600, 700, 800, 900, 1000];
  
  // KB size with text label
  const getKbSizeLabel = (kb) => {
    if (kb >= 1000) {
      return `${(kb / 1000).toFixed(1)} MB`;
    }
    return `${kb} KB`;
  };

  useEffect(() => {
    if (selectedImage) {
      getImageDimensions(selectedImage)
        .then(dimensions => {
          setOriginalDimensions(dimensions);
          // Update resize settings to match the image dimensions initially
          setResizeSettings(prev => ({
            ...prev,
            width: dimensions.width,
            height: dimensions.height
          }));
        })
        .catch(error => {
          console.error('Error getting image dimensions:', error);
        });
    }
  }, [selectedImage]);

  useEffect(() => {
    // Enable paste from clipboard
    const handlePaste = (e) => {
      if (e.clipboardData && e.clipboardData.items) {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            handleFile(blob);
            break;
          }
        }
      }
    };

    if (pasteEnabled) {
      document.addEventListener('paste', handlePaste);
    }

    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [pasteEnabled]);

  // Clean up object URLs when component unmounts or when new images are processed
  useEffect(() => {
    return () => {
      resizedImages.forEach(image => {
        if (image.url) {
          URL.revokeObjectURL(image.url);
        }
      });
    };
  }, [resizedImages]);

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
  
  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFile(file);
    }
  };
  
  const handleFile = (file) => {
    // Check if file is an image
    if (!file.type.match('image.*')) {
      alert('Please select an image file');
      return;
    }
    
    setSelectedImage(file);
    // Reset resized images when new image is uploaded
    setResizedImages([]);
    setSelectedImageId(null);
    setResizeError(null);
  };
  
  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleModeChange = (mode) => {
    setResizeSettings({
      ...resizeSettings,
      mode
    });
  };

  const handleWidthChange = (e) => {
    const newWidth = parseInt(e.target.value, 10) || 0;
    
    if (resizeSettings.keepAspectRatio && originalDimensions.width > 0) {
      const ratio = originalDimensions.width / originalDimensions.height;
      const newHeight = Math.round(newWidth / ratio);
      
      setResizeSettings({
        ...resizeSettings,
        width: newWidth,
        height: newHeight
      });
    } else {
      setResizeSettings({
        ...resizeSettings,
        width: newWidth
      });
    }
  };
  
  const handleHeightChange = (e) => {
    const newHeight = parseInt(e.target.value, 10) || 0;
    
    if (resizeSettings.keepAspectRatio && originalDimensions.height > 0) {
      const ratio = originalDimensions.width / originalDimensions.height;
      const newWidth = Math.round(newHeight * ratio);
      
      setResizeSettings({
        ...resizeSettings,
        width: newWidth,
        height: newHeight
      });
    } else {
      setResizeSettings({
        ...resizeSettings,
        height: newHeight
      });
    }
  };
  
  const handleAspectRatioToggle = () => {
    setResizeSettings({
      ...resizeSettings,
      keepAspectRatio: !resizeSettings.keepAspectRatio
    });
  };
  
  const handleTargetSizeChange = (e) => {
    const targetSize = parseInt(e.target.value, 10) || null;
    setResizeSettings({
      ...resizeSettings,
      targetSize
    });
  };

  const handleSizePresetClick = (size) => {
    setResizeSettings({
      ...resizeSettings,
      targetSize: size
    });
  };
  
  const handleFormatChange = (e) => {
    setResizeSettings({
      ...resizeSettings,
      format: e.target.value
    });
  };
  
  const handleQualityChange = (e) => {
    setResizeSettings({
      ...resizeSettings,
      quality: parseInt(e.target.value, 10)
    });
  };

  const handleAlgorithmChange = (algorithm) => {
    setResizeSettings({
      ...resizeSettings,
      algorithm
    });
  };

  const handleResizeImage = async () => {
    if (!selectedImage) return;
    
    setIsProcessing(true);
    setResizedImages([]);
    setResizeError(null);
    
    try {
      let resizedBlob;
      
      // Check if we're using target size
      if (resizeSettings.targetSize) {
        // Provide format recommendation for better file size targeting
        const isLossyFormat = ['jpg', 'jpeg', 'webp'].includes(resizeSettings.format);
        if (!isLossyFormat && resizeSettings.mode === 'reduce') {
          console.log('Using non-lossy format with target size. Consider using JPEG or WebP for better results.');
          setResizeError('Tip: For better file size control, consider using JPEG or WebP format instead of PNG.');
        }
        
        // Use the improved resizeToTargetSize with mode
        resizedBlob = await resizeToTargetSize(selectedImage, {
          width: resizeSettings.width,
          height: resizeSettings.height,
          format: resizeSettings.format,
          targetSize: resizeSettings.targetSize,
          quality: resizeSettings.quality,
          mode: resizeSettings.mode,
          algorithm: resizeSettings.algorithm
        });
      } else {
        // Just resize by dimensions
        resizedBlob = await resizeImage(selectedImage, {
          width: resizeSettings.width,
          height: resizeSettings.height,
          format: resizeSettings.format,
          quality: resizeSettings.quality,
          algorithm: resizeSettings.algorithm
        });
      }
      
      // Get dimensions of the resized image
      const img = await createImageBitmap(resizedBlob);
      const actualWidth = img.width;
      const actualHeight = img.height;
      
      // Calculate actual file size
      const actualSize = resizedBlob.size / 1024; // KB
      const targetSize = resizeSettings.targetSize;
      
      // Check if the actual size is significantly different from the target size
      if (targetSize && Math.abs(actualSize - targetSize) > targetSize * 0.1) {
        console.log(`Target size: ${targetSize}KB, Actual size: ${actualSize.toFixed(1)}KB`);
        setResizeError(`Note: The actual file size (${actualSize.toFixed(1)}KB) differs from the target (${targetSize}KB). This is normal due to image content and format limitations.`);
      }
      
      // Generate a unique ID for this resized image
      const id = Date.now().toString();
      
      // Add the resized image to the list
      setResizedImages([{
        id,
        blob: resizedBlob,
        url: URL.createObjectURL(resizedBlob),
        width: actualWidth,
        height: actualHeight,
        size: actualSize,
        format: resizeSettings.format
      }]);
      
      // Select the new image
      setSelectedImageId(id);
      
    } catch (error) {
      console.error('Error resizing image:', error);
      setResizeError(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = () => {
    if (!selectedImageId) return;
    
    const selectedImage = resizedImages.find(img => img.id === selectedImageId);
    if (!selectedImage) return;
    
    // Create a download link
    const url = URL.createObjectURL(selectedImage.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `resized-image-${selectedImage.width}x${selectedImage.height}.${resizeSettings.format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Add a function to reset the state and allow selecting another image
  const handleChooseAnotherImage = () => {
    // Clear the selected image
    setSelectedImage(null);
    // Clear resized images
    setResizedImages([]);
    // Clear any errors
    setResizeError(null);
    // Reset selected image ID
    setSelectedImageId(null);
    
    // Optionally trigger the file input
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 100);
  };

  return (
    <div className="flex flex-col space-y-8">
      {/* Upload Area */}
      {!selectedImage && (
        <div 
          className={`
            border-4 border-dashed rounded-2xl p-8 text-center transition-all duration-300
            ${isDragging 
              ? 'border-purple-500 bg-purple-50 animate-glow scale-105' 
              : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50'
            }
            cursor-pointer relative overflow-hidden hover-card group
          `}
          onClick={handleButtonClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onMouseEnter={() => setPasteEnabled(true)}
          onMouseLeave={() => setPasteEnabled(false)}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-200 to-pink-200 opacity-0 group-hover:opacity-20 transition-opacity duration-500 rounded-xl"></div>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInput}
            accept="image/*"
            className="hidden"
          />
          
          <div className="py-10">
            <div className="mb-4 flex justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-16 w-16 ${isDragging ? 'text-purple-600' : 'text-gray-400'} transition-colors duration-300`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className={`text-xl font-semibold mb-2 ${isDragging ? 'text-purple-600' : 'text-gray-700'} transition-colors duration-300`}>
              {isDragging ? 'Drop your image here!' : 'Drag & Drop your image here'}
            </h3>
            <p className="text-gray-500 mb-2">
              or click to browse your files
            </p>
            <p className="text-gray-500 mb-6">
              or paste image from clipboard (Ctrl+V)
            </p>
            <div className="text-sm text-gray-400">
              Supports JPG, PNG, GIF, WebP, SVG, HEIC
            </div>
          </div>
        </div>
      )}
      
      {/* Image Processing Area */}
      {selectedImage && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left side - Original Image & Options */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover-card">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Original Image</h2>
              
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Original Image</h3>
                <button
                  onClick={handleChooseAnotherImage}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center"
                >
                  Choose Another Image
                </button>
              </div>
              
              <div className="relative w-full max-h-64 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <img
                  src={URL.createObjectURL(selectedImage)}
                  alt="Original"
                  className="max-w-full max-h-64 object-contain"
                />
              </div>
              
              <div className="mt-3 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Size: {(selectedImage.size / 1024).toFixed(1)} KB
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Dimensions: {originalDimensions.width} × {originalDimensions.height} px
                </p>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover-card">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Resize Options</h2>
              
              {/* Mode Selection */}
              <div className="mb-6">
                <div className="flex space-x-4">
                  <button 
                    onClick={() => handleModeChange('reduce')}
                    className={`flex-1 py-2 px-4 rounded-lg transition-colors cursor-pointer ${
                      resizeSettings.mode === 'reduce' 
                        ? 'bg-purple-500 text-white' 
                        : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                    }`}
                  >
                    Reduce Size
                  </button>
                  <button 
                    onClick={() => handleModeChange('increase')}
                    className={`flex-1 py-2 px-4 rounded-lg transition-colors cursor-pointer ${
                      resizeSettings.mode === 'increase' 
                        ? 'bg-purple-500 text-white' 
                        : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                    }`}
                  >
                    Increase Size
                  </button>
                </div>
              </div>
              
              {/* Algorithm Selection */}
              <div className="mb-6">
                <div className="flex space-x-4">
                  <button
                    className={`px-4 py-2 rounded-md ${
                      resizeSettings.algorithm === 'bilinear'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white'
                    }`}
                    onClick={() => handleAlgorithmChange('bilinear')}
                  >
                    Bilinear (Faster)
                  </button>
                  <button
                    className={`px-4 py-2 rounded-md ${
                      resizeSettings.algorithm === 'bicubic'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white'
                    }`}
                    onClick={() => handleAlgorithmChange('bicubic')}
                  >
                    Bicubic (Higher Quality)
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Bicubic interpolation provides better quality, especially for photos and detailed images.
                </p>
              </div>
              
              {/* Dimensions */}
              <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center mb-4">
                  <div className="w-full sm:w-1/2 mb-4 sm:mb-0 sm:mr-2">
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-1" htmlFor="width">
                      Width (px)
                    </label>
                    <input
                      type="number"
                      id="width"
                      value={resizeSettings.width}
                      onChange={handleWidthChange}
                      min="1"
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div className="w-full sm:w-1/2 sm:ml-2">
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-1" htmlFor="height">
                      Height (px)
                    </label>
                    <input
                      type="number"
                      id="height"
                      value={resizeSettings.height}
                      onChange={handleHeightChange}
                      min="1"
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="flex items-center">
                  <button
                    type="button"
                    className={`
                      relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer 
                      transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500
                      ${resizeSettings.keepAspectRatio ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700'}
                    `}
                    onClick={handleAspectRatioToggle}
                  >
                    <span
                      className={`
                        pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 
                        transition ease-in-out duration-200 
                        ${resizeSettings.keepAspectRatio ? 'translate-x-5' : 'translate-x-0'}
                      `}
                    />
                  </button>
                  <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                    Maintain aspect ratio
                  </span>
                </div>
              </div>
              
              {/* Format selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Output Format
                </label>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={resizeSettings.format}
                    onChange={handleFormatChange}
                    className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="jpeg">JPEG (best for photos, smaller size)</option>
                    <option value="png">PNG (best for graphics, larger size)</option>
                    <option value="webp">WebP (best overall compression)</option>
                  </select>
                </div>
                {resizeSettings.targetSize && resizeSettings.format === 'png' && (
                  <p className="text-xs text-amber-600 mt-1">
                    PNG is lossless and may not achieve exact target file sizes. Consider JPEG or WebP for better size control.
                  </p>
                )}
              </div>
              
              {/* Target size selection */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Target File Size {resizeSettings.targetSize ? `(${resizeSettings.targetSize} KB)` : ''}
                  </label>
                  {resizeSettings.targetSize && (
                    <button
                      onClick={() => setResizeSettings({...resizeSettings, targetSize: null})}
                      className="text-xs text-blue-500 hover:text-blue-700"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <input
                  type="range"
                  min="10"
                  max={resizeSettings.mode === 'reduce' ? '200' : '1000'}
                  step="10"
                  value={resizeSettings.targetSize || '100'}
                  onChange={handleTargetSizeChange}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>Small</span>
                  <span>Medium</span>
                  <span>Large</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {(resizeSettings.mode === 'reduce' ? reducePresets : increasePresets).map(size => (
                    <button
                      key={size}
                      onClick={() => handleSizePresetClick(size)}
                      className={`px-2 py-1 text-xs rounded-md ${
                        resizeSettings.targetSize === size
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {getKbSizeLabel(size)}
                    </button>
                  ))}
                </div>
                {resizeSettings.targetSize && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span className="font-medium">Note:</span> Actual file size may vary based on image content and format.
                    {resizeSettings.format === 'jpeg' || resizeSettings.format === 'webp' 
                      ? ' Lossy formats like JPEG and WebP provide better file size control.'
                      : ' PNG is lossless and may result in larger files.'}
                  </p>
                )}
              </div>
              
              {/* Format & Quality */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-1" htmlFor="quality">
                    Quality: {resizeSettings.quality}%
                  </label>
                  <input
                    type="range"
                    id="quality"
                    min="1"
                    max="100"
                    value={resizeSettings.quality}
                    onChange={handleQualityChange}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
              
              <button
                type="button"
                onClick={handleResizeImage}
                disabled={isProcessing}
                className={`
                  w-full py-3 px-4 rounded-lg text-white font-medium transition-all button-hover-effect cursor-pointer
                  ${isProcessing 
                    ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-md hover:shadow-lg'
                  }
                `}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : 'Resize Image'}
              </button>
            </div>
          </div>
          
          {/* Right side - Processed Image & Download */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover-card">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Resized Image</h2>
              
              {isProcessing ? (
                <div className="flex flex-col items-center justify-center p-10 h-64 border-2 border-gray-200 dark:border-gray-700 border-dashed rounded-xl">
                  <div className="animate-pulse flex flex-col items-center">
                    <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-r from-purple-300 to-pink-300 animate-glow"></div>
                    <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
                    <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-600 rounded"></div>
                  </div>
                </div>
              ) : resizedImages.length > 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Resized Image</h3>
                  
                  {resizeError && (
                    <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 text-amber-700 dark:text-amber-400">
                      <p>{resizeError}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Image preview */}
                    <div className="flex flex-col items-center">
                      <div className="relative w-full h-64 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden mb-4">
                        <img 
                          src={resizedImages[0].url} 
                          alt="Resized" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <button
                        onClick={downloadImage}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download Image
                      </button>
                    </div>
                    
                    {/* Image details */}
                    <div className="flex flex-col">
                      <h4 className="text-md font-medium mb-3 text-gray-700 dark:text-gray-300">Image Details</h4>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                          <span className="text-gray-600 dark:text-gray-400">Dimensions</span>
                          <span className="font-medium text-gray-800 dark:text-gray-200">
                            {resizedImages[0].width} × {resizedImages[0].height} px
                          </span>
                        </div>
                        
                        <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                          <span className="text-gray-600 dark:text-gray-400">File Size</span>
                          <span className="font-medium text-gray-800 dark:text-gray-200">
                            {resizedImages[0].size.toFixed(1)} KB
                          </span>
                        </div>
                        
                        <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                          <span className="text-gray-600 dark:text-gray-400">Format</span>
                          <span className="font-medium text-gray-800 dark:text-gray-200 uppercase">
                            {resizedImages[0].format}
                          </span>
                        </div>
                        
                        <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                          <span className="text-gray-600 dark:text-gray-400">Algorithm</span>
                          <span className="font-medium text-gray-800 dark:text-gray-200">
                            {resizeSettings.algorithm === 'bicubic' ? 'Bicubic (High Quality)' : 'Bilinear (Standard)'}
                          </span>
                        </div>
                        
                        {resizeSettings.targetSize && (
                          <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                            <span className="text-gray-600 dark:text-gray-400">Target Size</span>
                            <div className="flex items-center">
                              <span className="font-medium text-gray-800 dark:text-gray-200">
                                {resizeSettings.targetSize} KB
                              </span>
                              {Math.abs(resizedImages[0].size - resizeSettings.targetSize) > resizeSettings.targetSize * 0.1 ? (
                                <span className="ml-2 px-2 py-0.5 text-xs bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 rounded-full">
                                  {resizedImages[0].size > resizeSettings.targetSize ? 'Larger' : 'Smaller'}
                                </span>
                              ) : (
                                <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                                  Achieved
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex justify-between py-2">
                          <span className="text-gray-600 dark:text-gray-400">Original Size</span>
                          <span className="font-medium text-gray-800 dark:text-gray-200">
                            {(selectedImage.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                        
                        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <h5 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Size Comparison</h5>
                          <div className="relative h-6 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 rounded-full"
                              style={{ 
                                width: `${Math.min(100, (resizedImages[0].size / (selectedImage.size / 1024)) * 100)}%` 
                              }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs mt-1">
                            <span className="text-gray-500 dark:text-gray-400">
                              {Math.round((1 - (resizedImages[0].size / (selectedImage.size / 1024))) * 100)}% smaller
                            </span>
                            <span className="text-gray-500 dark:text-gray-400">
                              {Math.round((resizedImages[0].size / (selectedImage.size / 1024)) * 100)}% of original
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-10 h-64 border-2 border-gray-200 dark:border-gray-700 border-dashed rounded-xl">
                  <svg
                    className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400 text-center">
                    Click "Resize Image" to process your image
                  </p>
                </div>
              )}
            </div>
            
            {/* Download Button */}
            {resizedImages.length > 0 && selectedImageId && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover-card">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Download</h2>
                
                <button
                  onClick={downloadImage}
                  className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center shadow-md hover:shadow-lg button-hover-effect cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Resized Image
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageResize; 