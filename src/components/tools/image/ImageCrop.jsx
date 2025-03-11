import React, { useState, useRef, useEffect } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
// We need to import the cropImage function from our backend utility
// Note: For client-side usage, we'll implement a browser-friendly version

const ImageCrop = () => {
  const [image, setImage] = useState(null);
  const [crop, setCrop] = useState({ 
    unit: 'px', 
    width: 0, 
    height: 0,
    x: 0,
    y: 0
  });
  const [aspectRatio, setAspectRatio] = useState(null); // null = free form
  const [completedCrop, setCompletedCrop] = useState(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [originalImageDimensions, setOriginalImageDimensions] = useState({ width: 0, height: 0 });
  const [debugInfo, setDebugInfo] = useState("");
  const [isAdjustingManually, setIsAdjustingManually] = useState(false);
  
  // For free transform
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const [dragStartCoords, setDragStartCoords] = useState({ x: 0, y: 0 });
  const [resizeDirection, setResizeDirection] = useState(null);
  const [initialCrop, setInitialCrop] = useState(null);
  
  // Add a new state for showing crop dimensions overlay
  const [showDimensionsOverlay, setShowDimensionsOverlay] = useState(true);
  
  const imgRef = useRef(null);
  const fileInputRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const imageContainerRef = useRef(null);

  // Update crop when dimensions or position change from manual input
  useEffect(() => {
    if (image && isAdjustingManually) {
      setCrop(prev => ({
        ...prev,
        width: dimensions.width,
        height: dimensions.height,
        x: position.x,
        y: position.y
      }));
    }
  }, [dimensions, position, image, isAdjustingManually]);

  // Update dimensions and position when crop changes via drag
  useEffect(() => {
    if (crop && !isAdjustingManually) {
      setDimensions({
        width: Math.round(crop.width),
        height: Math.round(crop.height)
      });
      setPosition({
        x: Math.round(crop.x),
        y: Math.round(crop.y)
      });
    }
  }, [crop, isAdjustingManually]);

  // Effect to generate preview when crop changes
  useEffect(() => {
    if (!completedCrop || !imgRef.current || !previewCanvasRef.current) {
      return;
    }

    const image = imgRef.current;
    const canvas = previewCanvasRef.current;
    const crop = completedCrop;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const ctx = canvas.getContext('2d');

    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;

    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY
    );
  }, [completedCrop]);

  // Add event listeners for mouse events to enable free transform
  // Fix: Remove dependencies that cause infinite re-renders
  useEffect(() => {
    const handleMouseDownWrapper = (e) => {
      if (imageContainerRef.current && imageContainerRef.current.contains(e.target)) {
        handleMouseDown(e);
      }
    };
    
    const handleMouseMoveWrapper = (e) => {
      if (isDraggingCrop) {
        handleMouseMove(e);
      }
    };
    
    const handleMouseUpWrapper = () => {
      if (isDraggingCrop) {
        handleMouseUp();
      }
    };
    
    if (image) {
      window.addEventListener('mousedown', handleMouseDownWrapper);
      window.addEventListener('mousemove', handleMouseMoveWrapper);
      window.addEventListener('mouseup', handleMouseUpWrapper);
    }
    
    return () => {
      window.removeEventListener('mousedown', handleMouseDownWrapper);
      window.removeEventListener('mousemove', handleMouseMoveWrapper);
      window.removeEventListener('mouseup', handleMouseUpWrapper);
    };
  }, [image, isDraggingCrop]);

  const handleAspectRatioChange = (e) => {
    const value = e.target.value;
    let newAspectRatio = null;
    
    switch(value) {
      case '1:1':
        newAspectRatio = 1;
        break;
      case '16:9':
        newAspectRatio = 16/9;
        break;
      case '4:3':
        newAspectRatio = 4/3;
        break;
      case '3:2':
        newAspectRatio = 3/2;
        break;
      case '2:3':
        newAspectRatio = 2/3;
        break;
      case '2:1':
        newAspectRatio = 2;
        break;
      case 'free':
      default:
        newAspectRatio = null;
    }
    
    setAspectRatio(newAspectRatio);
    setIsAdjustingManually(true);
    
    if (newAspectRatio && image && imgRef.current) {
      try {
        // When changing aspect ratio, maintain the width and adjust height
        // Also ensure the crop box stays within the image bounds
        const img = imgRef.current;
        const maxWidth = img.width;
        const maxHeight = img.height;
        
        // Get current center point of crop
        const centerX = position.x + (dimensions.width / 2);
        const centerY = position.y + (dimensions.height / 2);
        
        // Calculate new dimensions based on aspect ratio
        let newWidth = dimensions.width;
        let newHeight = Math.round(newWidth / newAspectRatio);
        
        // If new height exceeds image bounds, adjust width instead
        if (newHeight > maxHeight) {
          newHeight = maxHeight;
          newWidth = Math.round(newHeight * newAspectRatio);
        }
        
        // Ensure width doesn't exceed image bounds either
        if (newWidth > maxWidth) {
          newWidth = maxWidth;
          newHeight = Math.round(newWidth / newAspectRatio);
        }
        
        // Calculate new position to keep crop centered
        const newX = Math.max(0, Math.min(maxWidth - newWidth, Math.round(centerX - (newWidth / 2))));
        const newY = Math.max(0, Math.min(maxHeight - newHeight, Math.round(centerY - (newHeight / 2))));
        
        // Update dimensions and position
        setDimensions({
          width: newWidth,
          height: newHeight
        });
        setPosition({
          x: newX,
          y: newY
        });
        
        // Update crop area display
        setCrop({
          unit: 'px',
          width: newWidth,
          height: newHeight,
          x: newX,
          y: newY
        });
        
        // Update completed crop for preview
        setCompletedCrop({
          unit: 'px',
          width: newWidth,
          height: newHeight,
          x: newX,
          y: newY
        });
        
        setDebugInfo(prev => `${prev}\nAspect ratio changed to ${value}: ${newWidth}x${newHeight} at (${newX},${newY})`);
      } catch (err) {
        setDebugInfo(prev => `${prev}\nError applying aspect ratio: ${err.message}`);
      }
    }
    
    setTimeout(() => setIsAdjustingManually(false), 50);
  };

  const handleDimensionChange = (dimension, value) => {
    setIsAdjustingManually(true);
    const numValue = parseInt(value, 10) || 0;
    
    if (dimension === 'width') {
      if (aspectRatio) {
        setDimensions({
          width: numValue,
          height: Math.round(numValue / aspectRatio)
        });
      } else {
        setDimensions(prev => ({ ...prev, width: numValue }));
      }
    } else {
      if (aspectRatio) {
        setDimensions({
          width: Math.round(numValue * aspectRatio),
          height: numValue
        });
      } else {
        setDimensions(prev => ({ ...prev, height: numValue }));
      }
    }
    setTimeout(() => setIsAdjustingManually(false), 50);
  };

  const handlePositionChange = (axis, value) => {
    setIsAdjustingManually(true);
    const numValue = parseInt(value, 10) || 0;
    setPosition(prev => ({ ...prev, [axis]: numValue }));
    setTimeout(() => setIsAdjustingManually(false), 50);
  };

  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFile(file);
    }
  };

  const handleFile = (file) => {
    // Check if file is an image
    if (!file.type.match('image.*')) {
      setError('Please select an image file');
      return;
    }
    
    setError(null);
    
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      // Reset states
      setCroppedImageUrl(null);
      
      // Log debug info
      setDebugInfo(`Loading image: ${file.name} (${file.type}, ${file.size} bytes)`);
      
      // Create a temp image to get natural dimensions
      const img = new Image();
      img.onload = () => {
        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;
        
        setOriginalImageDimensions({
          width: imgWidth,
          height: imgHeight
        });
        
        // Calculate initial crop dimensions - 80% of the image or max 800px
        const initialWidth = Math.min(Math.round(imgWidth * 0.8), 800);
        const initialHeight = aspectRatio 
          ? Math.round(initialWidth / aspectRatio) 
          : Math.min(Math.round(imgHeight * 0.8), 800);
        
        // Center the crop area
        const initialX = Math.round((imgWidth - initialWidth) / 2);
        const initialY = Math.round((imgHeight - initialHeight) / 2);
        
        // Set dimensions and position (this will update crop via effect)
        setCrop({
          unit: 'px',
          width: initialWidth,
          height: initialHeight,
          x: initialX,
          y: initialY
        });
        
        setDimensions({ width: initialWidth, height: initialHeight });
        setPosition({ x: initialX, y: initialY });
        
        // Set completed crop to ensure crop button is enabled
        setCompletedCrop({
          width: initialWidth,
          height: initialHeight,
          x: initialX,
          y: initialY,
          unit: 'px'
        });
        
        setDebugInfo(prev => `${prev}\nImage dimensions: ${imgWidth}x${imgHeight}`);
        setDebugInfo(prev => `${prev}\nInitial crop: ${initialWidth}x${initialHeight} at (${initialX},${initialY})`);
      };
      img.src = reader.result;
      
      setImage(reader.result);
    });
    reader.readAsDataURL(file);
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
  
  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const generateCrop = () => {
    if (!imgRef.current || !completedCrop) {
      setDebugInfo(prev => `${prev}\nFailed to crop: imgRef or completedCrop is missing`);
      return;
    }

    setIsProcessing(true);
    
    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const crop = completedCrop;
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;
    
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY
    );
    
    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (!blob) {
        setError('Canvas is empty');
        setIsProcessing(false);
        return;
      }
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(blob);
      setCroppedImageUrl(previewUrl);
      setIsProcessing(false);
      setDebugInfo(prev => `${prev}\nCrop successful: ${canvas.width}x${canvas.height}`);
    }, 'image/jpeg', 0.95);
  };
  
  const downloadCroppedImage = () => {
    if (!croppedImageUrl) return;
    
    const link = document.createElement('a');
    link.download = 'cropped-image.jpg';
    link.href = croppedImageUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const resetCrop = () => {
    if (image && imgRef.current) {
      // Reset to original crop area (80% of image size)
      const img = imgRef.current;
      const width = Math.min(Math.round(img.naturalWidth * 0.8), 800);
      const height = aspectRatio 
        ? Math.round(width / aspectRatio) 
        : Math.min(Math.round(img.naturalHeight * 0.8), 800);
        
      // Center the crop area
      const x = Math.round((img.naturalWidth - width) / 2);
      const y = Math.round((img.naturalHeight - height) / 2);
      
      setIsAdjustingManually(true);
      setDimensions({ width, height });
      setPosition({ x, y });
      setTimeout(() => setIsAdjustingManually(false), 50);
    }
  };
  
  const aspectRatioOptions = [
    { value: 'free', label: 'Free Form' },
    { value: '1:1', label: '1:1 (Square)' },
    { value: '16:9', label: '16:9 (Landscape)' },
    { value: '4:3', label: '4:3 (Standard)' },
    { value: '3:2', label: '3:2 (Classic)' },
    { value: '2:3', label: '2:3 (Portrait)' }
  ];

  const handleMouseDown = (e) => {
    if (!image || !imgRef.current) return;
    
    try {
      // Get mouse position relative to the image
      const rect = imgRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Check if we're on the crop area
      const cropLeft = position.x;
      const cropRight = position.x + dimensions.width;
      const cropTop = position.y;
      const cropBottom = position.y + dimensions.height;
      
      // Define border size for resize handles
      const handleSize = 10; // pixels
      
      // Store initial crop state
      setInitialCrop({
        dimensions: { ...dimensions },
        position: { ...position }
      });
      
      // Check if mouse is on a resize handle
      const isOnLeftEdge = Math.abs(mouseX - cropLeft) <= handleSize;
      const isOnRightEdge = Math.abs(mouseX - cropRight) <= handleSize;
      const isOnTopEdge = Math.abs(mouseY - cropTop) <= handleSize;
      const isOnBottomEdge = Math.abs(mouseY - cropBottom) <= handleSize;
      
      // Determine resize direction based on which edge(s) the mouse is on
      if (isOnLeftEdge && isOnTopEdge) {
        setResizeDirection('nw');
        setIsDraggingCrop(true);
      } else if (isOnRightEdge && isOnTopEdge) {
        setResizeDirection('ne');
        setIsDraggingCrop(true);
      } else if (isOnLeftEdge && isOnBottomEdge) {
        setResizeDirection('sw');
        setIsDraggingCrop(true);
      } else if (isOnRightEdge && isOnBottomEdge) {
        setResizeDirection('se');
        setIsDraggingCrop(true);
      } else if (isOnLeftEdge) {
        setResizeDirection('w');
        setIsDraggingCrop(true);
      } else if (isOnRightEdge) {
        setResizeDirection('e');
        setIsDraggingCrop(true);
      } else if (isOnTopEdge) {
        setResizeDirection('n');
        setIsDraggingCrop(true);
      } else if (isOnBottomEdge) {
        setResizeDirection('s');
        setIsDraggingCrop(true);
      } else if (mouseX >= cropLeft && mouseX <= cropRight && mouseY >= cropTop && mouseY <= cropBottom) {
        // Inside crop area - move the entire crop box
        setResizeDirection('move');
        setIsDraggingCrop(true);
      } else {
        // Outside crop area - start a new crop (optional)
        // For now, we'll do nothing
        return;
      }
      
      setDragStartCoords({ x: mouseX, y: mouseY });
      setIsAdjustingManually(true);
    } catch (err) {
      setDebugInfo(prev => `${prev}\nError in mouseDown: ${err.message}`);
      setIsDraggingCrop(false);
    }
  };

  // Enhance the handleMouseMove function to update dimensions and position in real-time
  const handleMouseMove = (e) => {
    if (!isDraggingCrop || !imgRef.current || !initialCrop) return;
    
    e.preventDefault();
    
    try {
      // Get mouse position relative to the image
      const rect = imgRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Calculate the delta from the drag start position
      const deltaX = mouseX - dragStartCoords.x;
      const deltaY = mouseY - dragStartCoords.y;
      
      // Get the initial crop values
      const { dimensions: initDim, position: initPos } = initialCrop;
      
      // Create new crop values based on resize direction
      let newWidth = initDim.width;
      let newHeight = initDim.height;
      let newX = initPos.x;
      let newY = initPos.y;
      
      // Handle different resize directions
      if (resizeDirection) {
        // Resizing from edges
        if (resizeDirection.includes('e')) {
          // East (right) edge
          newWidth = Math.max(10, initDim.width + deltaX);
        }
        if (resizeDirection.includes('w')) {
          // West (left) edge
          newWidth = Math.max(10, initDim.width - deltaX);
          newX = initPos.x + deltaX;
        }
        if (resizeDirection.includes('s')) {
          // South (bottom) edge
          newHeight = Math.max(10, initDim.height + deltaY);
        }
        if (resizeDirection.includes('n')) {
          // North (top) edge
          newHeight = Math.max(10, initDim.height - deltaY);
          newY = initPos.y + deltaY;
        }
        
        // Maintain aspect ratio if needed
        if (aspectRatio && resizeDirection !== 'move') {
          // If resizing from a corner, prioritize the width
          if (resizeDirection.includes('e') || resizeDirection.includes('w')) {
            newHeight = newWidth / aspectRatio;
            // Adjust Y position if resizing from top
            if (resizeDirection.includes('n')) {
              newY = initPos.y + initDim.height - newHeight;
            }
          } else {
            newWidth = newHeight * aspectRatio;
            // Adjust X position if resizing from left
            if (resizeDirection.includes('w')) {
              newX = initPos.x + initDim.width - newWidth;
            }
          }
        }
      } else {
        // Moving the entire crop area
        newX = initPos.x + deltaX;
        newY = initPos.y + deltaY;
      }
      
      // Ensure crop stays within image bounds
      const imgWidth = imgRef.current.width;
      const imgHeight = imgRef.current.height;
      
      // Constrain X position
      if (newX < 0) newX = 0;
      if (newX + newWidth > imgWidth) {
        if (resizeDirection && resizeDirection.includes('e')) {
          newWidth = imgWidth - newX;
          if (aspectRatio) newHeight = newWidth / aspectRatio;
        } else {
          newX = imgWidth - newWidth;
        }
      }
      
      // Constrain Y position
      if (newY < 0) newY = 0;
      if (newY + newHeight > imgHeight) {
        if (resizeDirection && resizeDirection.includes('s')) {
          newHeight = imgHeight - newY;
          if (aspectRatio) newWidth = newHeight * aspectRatio;
        } else {
          newY = imgHeight - newHeight;
        }
      }
      
      // Round values for cleaner UI
      newWidth = Math.round(newWidth);
      newHeight = Math.round(newHeight);
      newX = Math.round(newX);
      newY = Math.round(newY);
      
      // Update state with new values
      setIsAdjustingManually(true);
      setDimensions({ width: newWidth, height: newHeight });
      setPosition({ x: newX, y: newY });
      
      // Update crop state for ReactCrop
      setCrop({
        unit: 'px',
        width: newWidth,
        height: newHeight,
        x: newX,
        y: newY
      });
      
      // Set completed crop for preview generation
      setCompletedCrop({
        unit: 'px',
        width: newWidth,
        height: newHeight,
        x: newX,
        y: newY
      });
      
      // Reset manual adjustment flag after a short delay
      clearTimeout(window.adjustTimeout);
      window.adjustTimeout = setTimeout(() => setIsAdjustingManually(false), 50);
      
    } catch (err) {
      console.error('Error in handleMouseMove:', err);
      setDebugInfo(`Error in handleMouseMove: ${err.message}`);
    }
  };

  const handleMouseUp = () => {
    if (isDraggingCrop) {
      setIsDraggingCrop(false);
      setResizeDirection(null);
      setInitialCrop(null);
      setTimeout(() => setIsAdjustingManually(false), 50);
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Tool navbar */}
      <div className="bg-gray-900 p-4 flex space-x-4 rounded-t-xl">
        <button className="px-4 py-2 flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 rounded-md text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
          <span>Resize</span>
        </button>
        <button className="px-4 py-2 flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 rounded-md text-white border-b-2 border-purple-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 4a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V5a1 1 0 00-1-1H5zm9 2a1 1 0 00-1-1H7a1 1 0 00-1 1v6a1 1 0 001 1h6a1 1 0 001-1V6z" clipRule="evenodd" />
          </svg>
          <span>Crop</span>
        </button>
        <button className="px-4 py-2 flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 rounded-md text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
          </svg>
          <span>Flip & Rotate</span>
        </button>
      </div>
      
      {/* Upload Area */}
      {!image && (
        <div 
          className={`
            border-4 border-dashed rounded-2xl p-8 text-center transition-all duration-300
            ${isDragging 
              ? 'border-purple-500 bg-purple-50 animate-pulse scale-105' 
              : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50'
            }
            cursor-pointer relative overflow-hidden hover-card group
          `}
          onClick={handleButtonClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-200 to-pink-200 opacity-0 group-hover:opacity-20 transition-opacity duration-500 rounded-xl"></div>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={onSelectFile}
            accept="image/*"
            className="hidden"
          />
          
          <div className="py-6">
            <div className="mb-4 flex justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-16 w-16 ${isDragging ? 'text-purple-600' : 'text-gray-400'} transition-colors duration-300`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className={`text-xl font-semibold mb-2 ${isDragging ? 'text-purple-600' : 'text-gray-700'} transition-colors duration-300`}>
              {isDragging ? 'Drop your image here!' : 'Drag & Drop your image here'}
            </h3>
            <p className="text-gray-500 mb-6">
              or click to browse your files
            </p>
            {error && (
              <p className="text-red-500 text-sm mb-4">{error}</p>
            )}
            <div className="text-sm text-gray-400">
              Supports JPG, PNG, GIF, WebP
            </div>
          </div>
        </div>
      )}
      
      {/* Cropping Area */}
      {image && !croppedImageUrl && (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left sidebar with controls */}
          <div className="w-full lg:w-1/4 bg-gray-900 rounded-xl shadow-md p-6 space-y-8">
            <div>
              <h3 className="text-xl font-semibold mb-4 text-white">Crop Rectangle</h3>
              
              {/* Width and Height inputs */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Width</label>
                  <input 
                    type="number"
                    value={dimensions.width}
                    onChange={(e) => handleDimensionChange('width', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Height</label>
                  <input 
                    type="number"
                    value={dimensions.height}
                    onChange={(e) => handleDimensionChange('height', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white"
                  />
                </div>
              </div>
              
              {/* Aspect Ratio selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1">Aspect Ratio</label>
                <select 
                  value={aspectRatio ? 
                    aspectRatioOptions.find(option => Math.abs(aspectRatio - eval(option.value.replace(':', '/'))) < 0.01)?.value || 'free' : 
                    'free'
                  }
                  onChange={handleAspectRatioChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white"
                >
                  {aspectRatioOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-4 text-white">Crop Position</h3>
              
              {/* X and Y position inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Position (X)</label>
                  <input 
                    type="number"
                    value={position.x}
                    onChange={(e) => handlePositionChange('x', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Position (Y)</label>
                  <input 
                    type="number"
                    value={position.y}
                    onChange={(e) => handlePositionChange('y', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white"
                  />
                </div>
              </div>
            </div>
            
            {/* Show dimensions overlay toggle */}
            <div className="mb-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showDimensions"
                  checked={showDimensionsOverlay}
                  onChange={() => setShowDimensionsOverlay(!showDimensionsOverlay)}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="showDimensions" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Show dimensions overlay
                </label>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex flex-col space-y-3">
              <button
                onClick={generateCrop}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Crop
              </button>
              <button
                onClick={resetCrop}
                className="w-full py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={() => {
                  setImage(null);
                  setCrop({ unit: 'px', width: 0, height: 0, x: 0, y: 0 });
                  setCompletedCrop(null);
                }}
                className="w-full py-3 bg-red-700 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Cancel
              </button>
            </div>
            
            {/* Debug information */}
            {debugInfo && (
              <div className="mt-4 p-2 bg-gray-800 rounded-md text-xs text-gray-300 font-mono whitespace-pre-wrap">
                {debugInfo}
              </div>
            )}
          </div>
          
          {/* Right main content with image and cropping */}
          <div className="w-full lg:w-3/4 bg-gray-900 rounded-xl shadow-md p-6">
            {image ? (
              <div className="bg-gray-800 rounded-lg p-4 flex justify-center items-center" 
                style={{ minHeight: '400px' }}
                ref={imageContainerRef}
              >
                {/* Replace the existing ReactCrop component with this wrapper */}
                <div className="relative">
                  <ReactCrop
                    src={image}
                    crop={crop}
                    onChange={(newCrop) => setCrop(newCrop)}
                    onComplete={(c) => setCompletedCrop(c)}
                    ruleOfThirds
                    circularCrop={false}
                    keepSelection
                    aspect={aspectRatio}
                  >
                    <img
                      ref={imgRef}
                      alt="Crop me"
                      src={image}
                      style={{ maxHeight: '70vh' }}
                    />
                  </ReactCrop>
                  
                  {/* Dimensions overlay */}
                  {showDimensionsOverlay && crop.width > 0 && (
                    <div 
                      className="absolute bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded pointer-events-none"
                      style={{ 
                        left: crop.x + 5,
                        top: crop.y + 5,
                        zIndex: 100
                      }}
                    >
                      {Math.round(crop.width)} × {Math.round(crop.height)} px
                      <br />
                      X: {Math.round(crop.x)}, Y: {Math.round(crop.y)}
                    </div>
                  )}
                  
                  {/* Crop controls toolbar */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-2 flex justify-center space-x-4">
                    <button 
                      onClick={resetCrop}
                      className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
                      title="Reset crop"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    <button 
                      onClick={() => {
                        // Toggle aspect ratio between free and 1:1
                        setAspectRatio(aspectRatio ? null : 1);
                      }}
                      className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                        aspectRatio ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-800 hover:bg-gray-700'
                      }`}
                      title={aspectRatio ? 'Free aspect ratio' : 'Lock aspect ratio (1:1)'}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    <button 
                      onClick={() => setShowDimensionsOverlay(!showDimensionsOverlay)}
                      className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                        showDimensionsOverlay ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-800 hover:bg-gray-700'
                      }`}
                      title={showDimensionsOverlay ? 'Hide dimensions' : 'Show dimensions'}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    </button>
                    
                    <button 
                      onClick={generateCrop}
                      className="flex items-center justify-center w-10 h-10 rounded-full bg-green-600 hover:bg-green-500 transition-colors"
                      title="Apply crop"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-center items-center h-96 bg-gray-800 rounded-lg">
                <p className="text-gray-400">No image selected</p>
              </div>
            )}
          </div>
          
          {/* Preview Canvas - Hidden, used for processing */}
          <canvas
            ref={previewCanvasRef}
            className="hidden"
          />
        </div>
      )}
      
      {/* Result Area */}
      {croppedImageUrl && (
        <div className="flex flex-col space-y-6">
          <div className="bg-gray-900 rounded-xl shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4 text-white">Cropped Image</h3>
            
            <div className="flex justify-center mb-6 bg-gray-800 p-4 rounded-lg">
              <img
                src={croppedImageUrl}
                alt="Cropped"
                className="max-w-full max-h-[500px] object-contain"
              />
            </div>
            
            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={downloadCroppedImage}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span>Download Image</span>
              </button>
              <button
                onClick={() => {
                  // Go back to cropping
                  setCroppedImageUrl(null);
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Adjust Crop
              </button>
              <button
                onClick={() => {
                  // Start over
                  setImage(null);
                  setCrop({ unit: 'px', width: 0, height: 0, x: 0, y: 0 });
                  setCompletedCrop(null);
                  setCroppedImageUrl(null);
                }}
                className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Crop New Image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageCrop;
