import React, { useState } from 'react';

const ExportOptions = ({ resizedImages, settings, setSettings }) => {
  const [selectedImageId, setSelectedImageId] = useState(1);
  
  const handleFormatChange = (e) => {
    setSettings({
      ...settings,
      format: e.target.value
    });
  };
  
  const handleQualityChange = (e) => {
    setSettings({
      ...settings,
      quality: parseInt(e.target.value, 10)
    });
  };
  
  const handleImageSelection = (id) => {
    setSelectedImageId(id);
  };
  
  const selectedImage = resizedImages.find(img => img.id === selectedImageId);
  
  const downloadImage = () => {
    if (!selectedImage) return;
    
    // Create a download link
    const url = URL.createObjectURL(selectedImage.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `resized-image-${selectedImage.width}x${selectedImage.height}.${settings.format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  const downloadAllImages = () => {
    resizedImages.forEach((image, index) => {
      // Create a download link with a delay to avoid browser blocking multiple downloads
      setTimeout(() => {
        const url = URL.createObjectURL(image.blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `resized-image-${index+1}-${image.width}x${image.height}.${settings.format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, index * 500); // 500ms delay between downloads
    });
  };
  
  return (
    <div className="bg-white rounded-xl shadow-md p-6 hover-card">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Export Options</h2>
      
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Select an image to download</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {resizedImages.map((image) => (
            <div 
              key={image.id}
              onClick={() => handleImageSelection(image.id)}
              className={`
                border-2 rounded-lg p-3 cursor-pointer transition-all duration-200 hover-card
                ${selectedImageId === image.id 
                  ? 'border-purple-500 bg-purple-50 shadow-md' 
                  : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'}
              `}
            >
              <div className="relative w-full h-24 mb-2 rounded overflow-hidden bg-gray-50 flex items-center justify-center image-container">
                <img
                  src={image.url}
                  alt={`Resized ${image.id}`}
                  className="max-w-full max-h-24 object-contain"
                />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-800">
                  Resized {image.id}
                </p>
                <p className="text-xs text-gray-500">
                  {image.width} × {image.height} px • {image.size}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="exportFormat">
            Export Format
          </label>
          <select
            id="exportFormat"
            value={settings.format}
            onChange={handleFormatChange}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="png">PNG</option>
            <option value="jpeg">JPG</option>
            <option value="webp">WebP</option>
            <option value="gif">GIF</option>
          </select>
        </div>
        
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="exportQuality">
            Quality: {settings.quality}%
          </label>
          <input
            type="range"
            id="exportQuality"
            min="1"
            max="100"
            value={settings.quality}
            onChange={handleQualityChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={downloadImage}
          className="py-3 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 button-hover-effect"
        >
          <span className="flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Selected
          </span>
        </button>
        
        <button
          type="button"
          onClick={downloadAllImages}
          className="py-3 px-4 bg-white border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 button-hover-effect"
        >
          <span className="flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Download All
          </span>
        </button>
      </div>
    </div>
  );
};

export default ExportOptions; 