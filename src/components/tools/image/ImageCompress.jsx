import React, { useState, useEffect, useRef } from 'react';
import { 
  compressImage, 
  getImageDimensions, 
  calculateFileSize,
  resizeToTargetSize
} from '../../../utils/imageProcessing';

const ImageCompress = () => {
  // State
  const [selectedImage, setSelectedImage] = useState(null);
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  const [compressedImages, setCompressedImages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState(null);
  const [pasteEnabled, setPasteEnabled] = useState(false);
  const [compressError, setCompressError] = useState(null);
  const fileInputRef = useRef(null);

  // Compression settings
  const [compressionSettings, setCompressionSettings] = useState({
    quality: 80, // Default quality (1-100)
    format: 'jpeg', // Default format
    algorithm: 'bicubic', // Default algorithm
    preserveMetadata: false, // Whether to preserve metadata
    maxWidth: null, // Optional max width constraint
    maxHeight: null, // Optional max height constraint
    targetSize: null, // Target file size in KB
  });

  // Quality presets
  const qualityPresets = [30, 40, 50, 60, 70, 80, 90, 95];
  
  // Size presets in KB
  const sizePresets = [10, 20, 50, 100, 200, 500, 1000];
  
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
      compressedImages.forEach(image => {
        if (image.url) {
          URL.revokeObjectURL(image.url);
        }
      });
    };
  }, [compressedImages]);

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
      setCompressError('Please select an image file');
      return;
    }
    
    setSelectedImage(file);
    // Reset compressed images when new image is uploaded
    setCompressedImages([]);
    setSelectedImageId(null);
    setCompressError(null);
  };
  
  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleQualityChange = (e) => {
    setCompressionSettings({
      ...compressionSettings,
      quality: parseInt(e.target.value, 10)
    });
  };
  
  const handleQualityPresetClick = (quality) => {
    setCompressionSettings({
      ...compressionSettings,
      quality
    });
  };
  
  const handleFormatChange = (e) => {
    setCompressionSettings({
      ...compressionSettings,
      format: e.target.value
    });
  };
  
  const handleAlgorithmChange = (algorithm) => {
    setCompressionSettings({
      ...compressionSettings,
      algorithm
    });
  };

  const handlePreserveMetadataToggle = () => {
    setCompressionSettings({
      ...compressionSettings,
      preserveMetadata: !compressionSettings.preserveMetadata
    });
  };

  const handleMaxWidthChange = (e) => {
    const value = e.target.value === '' ? null : parseInt(e.target.value, 10);
    setCompressionSettings({
      ...compressionSettings,
      maxWidth: value
    });
  };

  const handleMaxHeightChange = (e) => {
    const value = e.target.value === '' ? null : parseInt(e.target.value, 10);
    setCompressionSettings({
      ...compressionSettings,
      maxHeight: value
    });
  };

  const handleTargetSizeChange = (e) => {
    const targetSize = parseInt(e.target.value, 10) || null;
    setCompressionSettings({
      ...compressionSettings,
      targetSize
    });
  };
  
  const handleSizePresetClick = (size) => {
    setCompressionSettings({
      ...compressionSettings,
      targetSize: size
    });
  };

  const handleCompressImage = async () => {
    if (!selectedImage) return;
    
    setIsProcessing(true);
    setCompressedImages([]);
    setCompressError(null);
    
    try {
      let compressedBlob;
      
      // Check if we're using target size
      if (compressionSettings.targetSize) {
        // Use the resizeToTargetSize function for target size compression
        compressedBlob = await resizeToTargetSize(selectedImage, {
          width: originalDimensions.width,
          height: originalDimensions.height,
          format: compressionSettings.format,
          targetSize: compressionSettings.targetSize,
          quality: compressionSettings.quality,
          mode: 'reduce', // Always reduce for compression
          algorithm: compressionSettings.algorithm
        });
      } else {
        // Use standard compression with quality setting
        compressedBlob = await compressImage(selectedImage, 
          compressionSettings.quality, 
          compressionSettings.algorithm
        );
      }
      
      // Get dimensions of the compressed image
      const img = await createImageBitmap(compressedBlob);
      const actualWidth = img.width;
      const actualHeight = img.height;
      
      // Calculate actual file size
      const actualSize = compressedBlob.size / 1024; // KB
      const originalSize = selectedImage.size / 1024; // KB
      const compressionRatio = originalSize / actualSize;
      const percentReduction = ((originalSize - actualSize) / originalSize) * 100;
      
      // Generate a unique ID for this compressed image
      const id = Date.now().toString();
      
      // Add the compressed image to the list
      setCompressedImages([{
        id,
        blob: compressedBlob,
        url: URL.createObjectURL(compressedBlob),
        width: actualWidth,
        height: actualHeight,
        size: actualSize,
        originalSize: originalSize,
        compressionRatio: compressionRatio,
        percentReduction: percentReduction,
        format: compressionSettings.format,
        quality: compressionSettings.quality,
        targetSize: compressionSettings.targetSize
      }]);
      
      // Select the new image
      setSelectedImageId(id);
      
      // Check if the actual size is significantly different from the target size
      if (compressionSettings.targetSize && Math.abs(actualSize - compressionSettings.targetSize) > compressionSettings.targetSize * 0.1) {
        console.log(`Target size: ${compressionSettings.targetSize}KB, Actual size: ${actualSize.toFixed(1)}KB`);
        setCompressError(`Note: The actual file size (${actualSize.toFixed(1)}KB) differs from the target (${compressionSettings.targetSize}KB). This is normal due to image content and format limitations.`);
      }
      
    } catch (error) {
      console.error('Error compressing image:', error);
      setCompressError(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = () => {
    if (compressedImages.length === 0 || !selectedImageId) return;
    
    const selectedImage = compressedImages.find(img => img.id === selectedImageId);
    if (!selectedImage) return;
    
    const url = selectedImage.url;
    const link = document.createElement('a');
    link.href = url;
    link.download = `compressed_image.${compressionSettings.format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleChooseAnotherImage = () => {
    // Clear the selected image
    setSelectedImage(null);
    // Clear compressed images
    setCompressedImages([]);
    // Clear any errors
    setCompressError(null);
    // Reset selected image ID
    setSelectedImageId(null);
    
    // Optionally trigger the file input
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 100);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Image Compression</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Reduce image file size while maintaining quality using advanced compression algorithms.
        </p>
      </div>
      
      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Upload and settings */}
        <div className="lg:col-span-1 space-y-6">
          {/* Upload section */}
          {!selectedImage ? (
            <div 
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-2 border-dashed ${
                isDragging 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-300 dark:border-gray-600'
              } transition-colors duration-200`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleButtonClick}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileInput} 
              />
              
              <div className="flex flex-col items-center justify-center py-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isDragging ? 'Drop image here' : 'Upload an image to compress'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center">
                  {isDragging 
                    ? 'Release to upload' 
                    : 'Drag & drop an image here, or click to browse'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Supports JPG, PNG, WebP, and GIF
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Original Image</h3>
                <button
                  onClick={handleChooseAnotherImage}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center"
                >
                  Choose Another Image
                </button>
              </div>
              
              <div className="relative w-full h-48 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden mb-4">
                <img
                  src={URL.createObjectURL(selectedImage)}
                  alt="Original"
                  className="w-full h-full object-contain"
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
          )}
          
          {/* Compression settings */}
          {selectedImage && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Compression Settings</h3>
              
              {/* Format selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Output Format
                </label>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={compressionSettings.format}
                    onChange={handleFormatChange}
                    className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="jpeg">JPEG (best for photos, smaller size)</option>
                    <option value="png">PNG (best for graphics, larger size)</option>
                    <option value="webp">WebP (best overall compression)</option>
                  </select>
                </div>
              </div>
              
              {/* Quality slider */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Quality: {compressionSettings.quality}%
                  </label>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  step="1"
                  value={compressionSettings.quality}
                  onChange={handleQualityChange}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>Low Quality</span>
                  <span>High Quality</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {qualityPresets.map(quality => (
                    <button
                      key={quality}
                      onClick={() => handleQualityPresetClick(quality)}
                      className={`px-2 py-1 text-xs rounded-md ${
                        compressionSettings.quality === quality
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {quality}%
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Lower quality = smaller file size, higher quality = better image
                </p>
              </div>
              
              {/* Algorithm selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Compression Algorithm</label>
                <div className="flex space-x-2">
                  <button
                    className={`px-4 py-2 rounded-md ${
                      compressionSettings.algorithm === 'bilinear'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white'
                    }`}
                    onClick={() => handleAlgorithmChange('bilinear')}
                  >
                    Bilinear (Faster)
                  </button>
                  <button
                    className={`px-4 py-2 rounded-md ${
                      compressionSettings.algorithm === 'bicubic'
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
              
              {/* Target size selection */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Target File Size {compressionSettings.targetSize ? `(${compressionSettings.targetSize} KB)` : ''}
                  </label>
                  {compressionSettings.targetSize && (
                    <button
                      onClick={() => setCompressionSettings({...compressionSettings, targetSize: null})}
                      className="text-xs text-blue-500 hover:text-blue-700"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <input
                  type="range"
                  min="10"
                  max="1000"
                  step="10"
                  value={compressionSettings.targetSize || '100'}
                  onChange={handleTargetSizeChange}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>Small</span>
                  <span>Medium</span>
                  <span>Large</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {sizePresets.map(size => (
                    <button
                      key={size}
                      onClick={() => handleSizePresetClick(size)}
                      className={`px-2 py-1 text-xs rounded-md ${
                        compressionSettings.targetSize === size
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {getKbSizeLabel(size)}
                    </button>
                  ))}
                </div>
                {compressionSettings.targetSize && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span className="font-medium">Note:</span> Actual file size may vary based on image content and format.
                    {compressionSettings.format === 'jpeg' || compressionSettings.format === 'webp' 
                      ? ' Lossy formats like JPEG and WebP provide better file size control.'
                      : ' PNG is lossless and may result in larger files.'}
                  </p>
                )}
              </div>
              
              {/* Compress button */}
              <button
                onClick={handleCompressImage}
                disabled={isProcessing}
                className={`w-full py-3 rounded-lg text-white font-medium transition-colors ${
                  isProcessing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Compressing...
                  </span>
                ) : (
                  'Compress Image'
                )}
              </button>
            </div>
          )}
        </div>
        
        {/* Right column - Results */}
        <div className="lg:col-span-2">
          {/* Results section */}
          {compressedImages.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Compressed Image</h3>
              
              {compressError && (
                <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 text-amber-700 dark:text-amber-400">
                  <p>{compressError}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Image preview */}
                <div className="flex flex-col items-center">
                  <div className="relative w-full h-64 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden mb-4">
                    <img 
                      src={compressedImages[0].url} 
                      alt="Compressed" 
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
                  <h4 className="text-md font-medium mb-3 text-gray-700 dark:text-gray-300">Compression Results</h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Dimensions</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {compressedImages[0].width} × {compressedImages[0].height} px
                      </span>
                    </div>
                    
                    <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">File Size</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {compressedImages[0].size.toFixed(1)} KB
                      </span>
                    </div>
                    
                    <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Format</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200 uppercase">
                        {compressedImages[0].format}
                      </span>
                    </div>
                    
                    <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Quality</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {compressedImages[0].quality}%
                      </span>
                    </div>
                    
                    <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Algorithm</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {compressionSettings.algorithm === 'bicubic' ? 'Bicubic (High Quality)' : 'Bilinear (Standard)'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600 dark:text-gray-400">Original Size</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {compressedImages[0].originalSize.toFixed(1)} KB
                      </span>
                    </div>
                    
                    {compressedImages[0].targetSize && (
                      <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-gray-600 dark:text-gray-400">Target Size</span>
                        <div className="flex items-center">
                          <span className="font-medium text-gray-800 dark:text-gray-200">
                            {compressedImages[0].targetSize} KB
                          </span>
                          {Math.abs(compressedImages[0].size - compressedImages[0].targetSize) > compressedImages[0].targetSize * 0.1 ? (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 rounded-full">
                              {compressedImages[0].size > compressedImages[0].targetSize ? 'Larger' : 'Smaller'}
                            </span>
                          ) : (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                              Achieved
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <h5 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Compression Results</h5>
                      <div className="relative h-6 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 rounded-full"
                          style={{ 
                            width: `${Math.min(100, 100 - compressedImages[0].percentReduction)}%` 
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span className="text-gray-500 dark:text-gray-400">
                          {compressedImages[0].percentReduction.toFixed(1)}% smaller
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {(100 - compressedImages[0].percentReduction).toFixed(1)}% of original
                        </span>
                      </div>
                      
                      <div className="mt-3 text-center">
                        <span className="inline-block px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-sm font-medium">
                          {compressedImages[0].compressionRatio.toFixed(1)}x compression ratio
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Tips section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Compression Tips</h3>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 h-6 w-6 text-blue-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Choose the right format</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Use JPEG for photos, PNG for graphics with transparency, and WebP for best overall compression.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 h-6 w-6 text-blue-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Adjust quality settings</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Lower quality settings result in smaller file sizes but may introduce artifacts. 70-80% is often a good balance.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 h-6 w-6 text-blue-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Use bicubic algorithm</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    The bicubic algorithm provides better quality results, especially for photos and detailed images.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCompress; 