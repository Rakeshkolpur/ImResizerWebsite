import React, { useState, useRef } from 'react';

const ImageUploader = ({ onImageUpload, selectedImage }) => {
  const [isDragging, setIsDragging] = useState(false);
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
    
    onImageUpload(file);
  };
  
  const handleButtonClick = () => {
    fileInputRef.current.click();
  };
  
  return (
    <div className="w-full">
      <div 
        className={`
          border-4 border-dashed rounded-2xl p-8 text-center transition-all duration-300
          ${isDragging 
            ? 'border-purple-500 bg-purple-50 animate-glow scale-105' 
            : selectedImage 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50'
          }
          cursor-pointer relative overflow-hidden hover-card group
        `}
        onClick={handleButtonClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Animated background effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-200 to-pink-200 opacity-0 group-hover:opacity-20 transition-opacity duration-500 rounded-xl"></div>
        
        {/* Glowing border animation */}
        <div className={`absolute inset-0 rounded-xl ${isDragging ? 'animate-pulse' : ''} ${selectedImage ? 'shadow-inner' : ''}`}></div>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInput}
          accept="image/*"
          className="hidden"
        />
        
        {selectedImage ? (
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 mb-4 relative image-container">
              <img 
                src={URL.createObjectURL(selectedImage)} 
                alt="Selected" 
                className="w-full h-full object-cover rounded-xl shadow-md" 
              />
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-checkmark">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <p className="text-green-600 font-medium">
              {selectedImage.name}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {(selectedImage.size / 1024).toFixed(2)} KB
            </p>
            <button 
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md hover:shadow-lg button-hover-effect"
              onClick={(e) => {
                e.stopPropagation();
                handleButtonClick();
              }}
            >
              Change Image
            </button>
          </div>
        ) : (
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
            <div className="text-sm text-gray-400">
              Supports JPG, PNG, GIF, WebP, SVG, HEIC
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader; 