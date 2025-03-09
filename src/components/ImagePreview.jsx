import React, { useState } from 'react';

const ImagePreview = ({ originalImage, resizedImages, isProcessing, originalDimensions }) => {
  const [activeTab, setActiveTab] = useState('original');
  
  const getFileSize = (file) => {
    return (file.size / 1024).toFixed(2);
  };
  
  // Get file dimensions from an image file
  const getImageDimensions = (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.src = URL.createObjectURL(file);
    });
  };
  
  return (
    <div className="bg-white rounded-xl shadow-md p-6 h-full hover-card">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Image Preview</h2>
      
      {isProcessing ? (
        <div className="flex flex-col items-center justify-center p-10 h-64 border-2 border-gray-200 border-dashed rounded-xl">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-r from-purple-300 to-pink-300 animate-glow"></div>
            <div className="h-4 w-1/2 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 w-1/3 bg-gray-200 rounded"></div>
          </div>
        </div>
      ) : originalImage ? (
        <div>
          <div className="mb-4 border-b border-gray-200">
            <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
              <li className="mr-2">
                <button
                  className={`inline-block p-4 rounded-t-lg ${
                    activeTab === 'original'
                      ? 'border-b-2 border-purple-600 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-600 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('original')}
                >
                  Original
                </button>
              </li>
              {resizedImages.length > 0 && resizedImages.map((image) => (
                <li className="mr-2" key={image.id}>
                  <button
                    className={`inline-block p-4 rounded-t-lg ${
                      activeTab === `resized-${image.id}`
                        ? 'border-b-2 border-purple-600 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-600 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab(`resized-${image.id}`)}
                  >
                    Resized {image.id}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="preview-container">
            {activeTab === 'original' ? (
              <div className="flex flex-col items-center">
                <div className="relative w-full max-h-64 mb-4 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center image-container">
                  <img
                    src={URL.createObjectURL(originalImage)}
                    alt="Original"
                    className="max-w-full max-h-64 object-contain"
                  />
                </div>
                <div className="w-full text-center">
                  <h3 className="text-lg font-medium text-gray-800">Original Image</h3>
                  <p className="text-sm text-gray-500">
                    Size: {getFileSize(originalImage)} KB
                  </p>
                  <p className="text-sm text-gray-500">
                    Dimensions: {originalDimensions.width} × {originalDimensions.height} px
                  </p>
                </div>
              </div>
            ) : (
              resizedImages.map((image) => {
                if (activeTab === `resized-${image.id}`) {
                  return (
                    <div key={image.id} className="flex flex-col items-center">
                      <div className="relative w-full max-h-64 mb-4 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center image-container">
                        <img
                          src={image.url}
                          alt={`Resized ${image.id}`}
                          className="max-w-full max-h-64 object-contain"
                        />
                      </div>
                      <div className="w-full text-center">
                        <h3 className="text-lg font-medium text-gray-800">Resized Image {image.id}</h3>
                        <p className="text-sm text-gray-500">
                          Size: {image.size}
                        </p>
                        <p className="text-sm text-gray-500">
                          Dimensions: {image.width} × {image.height} px
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              })
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-10 h-64 border-2 border-gray-200 border-dashed rounded-xl">
          <svg
            className="w-16 h-16 text-gray-300 mb-4"
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
          <p className="text-gray-500 text-center">
            Upload an image to see the preview here
          </p>
        </div>
      )}
    </div>
  );
};

export default ImagePreview; 