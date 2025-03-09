import React, { useState, useEffect } from 'react';

const ResizeOptions = ({ settings, setSettings, onResize, isProcessing, originalDimensions }) => {
  const [width, setWidth] = useState(settings.width);
  const [height, setHeight] = useState(settings.height);
  const [aspectRatio, setAspectRatio] = useState(settings.width / settings.height);
  
  // Update the local state when settings change
  useEffect(() => {
    setWidth(settings.width);
    setHeight(settings.height);
    if (settings.width > 0 && settings.height > 0) {
      setAspectRatio(settings.width / settings.height);
    }
  }, [settings.width, settings.height]);
  
  // Update local state when original dimensions change
  useEffect(() => {
    if (originalDimensions.width > 0 && originalDimensions.height > 0) {
      setAspectRatio(originalDimensions.width / originalDimensions.height);
    }
  }, [originalDimensions]);
  
  const handleWidthChange = (e) => {
    const newWidth = parseInt(e.target.value, 10) || 0;
    setWidth(newWidth);
    
    if (settings.keepAspectRatio) {
      const newHeight = Math.round(newWidth / aspectRatio);
      setHeight(newHeight);
      setSettings({
        ...settings,
        width: newWidth,
        height: newHeight
      });
    } else {
      setSettings({
        ...settings,
        width: newWidth
      });
    }
  };
  
  const handleHeightChange = (e) => {
    const newHeight = parseInt(e.target.value, 10) || 0;
    setHeight(newHeight);
    
    if (settings.keepAspectRatio) {
      const newWidth = Math.round(newHeight * aspectRatio);
      setWidth(newWidth);
      setSettings({
        ...settings,
        width: newWidth,
        height: newHeight
      });
    } else {
      setSettings({
        ...settings,
        height: newHeight
      });
    }
  };
  
  const handleAspectRatioToggle = () => {
    // If turning on aspect ratio, update aspect ratio to current dimensions
    if (!settings.keepAspectRatio) {
      setAspectRatio(width / height);
    }
    
    setSettings({
      ...settings,
      keepAspectRatio: !settings.keepAspectRatio
    });
  };
  
  const handleTargetSizeChange = (e) => {
    const targetSize = parseInt(e.target.value, 10) || null;
    setSettings({
      ...settings,
      targetSize
    });
  };
  
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
  
  const applyPreset = (preset) => {
    let newWidth, newHeight;
    
    switch(preset) {
      case 'instagram':
        newWidth = 1080;
        newHeight = 1080;
        break;
      case 'twitter':
        newWidth = 1200;
        newHeight = 675;
        break;
      case 'facebook':
        newWidth = 1200;
        newHeight = 630;
        break;
      case 'linkedin':
        newWidth = 1200;
        newHeight = 627;
        break;
      case 'hd':
        newWidth = 1920;
        newHeight = 1080;
        break;
      case 'original':
        newWidth = originalDimensions.width;
        newHeight = originalDimensions.height;
        break;
      default:
        return;
    }
    
    setWidth(newWidth);
    setHeight(newHeight);
    setAspectRatio(newWidth / newHeight);
    
    setSettings({
      ...settings,
      width: newWidth,
      height: newHeight,
      keepAspectRatio: true
    });
  };
  
  return (
    <div className="bg-white rounded-xl shadow-md p-6 hover-card">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Resize Options</h2>
      
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center mb-4">
          <div className="w-full sm:w-1/2 mb-4 sm:mb-0 sm:mr-2 float-label">
            <input
              type="number"
              id="width"
              value={width}
              onChange={handleWidthChange}
              min="1"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder=" "
            />
            <label className="block text-gray-700 text-sm font-medium" htmlFor="width">
              Width (px)
            </label>
          </div>
          <div className="w-full sm:w-1/2 sm:ml-2 float-label">
            <input
              type="number"
              id="height"
              value={height}
              onChange={handleHeightChange}
              min="1"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder=" "
            />
            <label className="block text-gray-700 text-sm font-medium" htmlFor="height">
              Height (px)
            </label>
          </div>
        </div>
        
        <div className="flex items-center">
          <button
            type="button"
            className={`
              relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer 
              transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500
              ${settings.keepAspectRatio ? 'bg-purple-600' : 'bg-gray-200'}
            `}
            onClick={handleAspectRatioToggle}
          >
            <span
              className={`
                pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 
                transition ease-in-out duration-200 
                ${settings.keepAspectRatio ? 'translate-x-5' : 'translate-x-0'}
              `}
            />
          </button>
          <span className="ml-3 text-sm text-gray-700">
            Maintain aspect ratio
          </span>
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Preset Sizes</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => applyPreset('original')}
            className="py-2 px-3 bg-white border border-gray-300 rounded-lg text-sm hover:bg-purple-50 hover:border-purple-300 transition-colors button-hover-effect"
          >
            Original Size
          </button>
          <button
            type="button"
            onClick={() => applyPreset('instagram')}
            className="py-2 px-3 bg-white border border-gray-300 rounded-lg text-sm hover:bg-purple-50 hover:border-purple-300 transition-colors button-hover-effect"
          >
            Instagram (1:1)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('twitter')}
            className="py-2 px-3 bg-white border border-gray-300 rounded-lg text-sm hover:bg-purple-50 hover:border-purple-300 transition-colors button-hover-effect"
          >
            Twitter
          </button>
          <button
            type="button"
            onClick={() => applyPreset('facebook')}
            className="py-2 px-3 bg-white border border-gray-300 rounded-lg text-sm hover:bg-purple-50 hover:border-purple-300 transition-colors button-hover-effect"
          >
            Facebook
          </button>
          <button
            type="button"
            onClick={() => applyPreset('linkedin')}
            className="py-2 px-3 bg-white border border-gray-300 rounded-lg text-sm hover:bg-purple-50 hover:border-purple-300 transition-colors button-hover-effect"
          >
            LinkedIn
          </button>
          <button
            type="button"
            onClick={() => applyPreset('hd')}
            className="py-2 px-3 bg-white border border-gray-300 rounded-lg text-sm hover:bg-purple-50 hover:border-purple-300 transition-colors button-hover-effect"
          >
            HD (1080p)
          </button>
        </div>
      </div>
      
      <div className="mb-6 float-label">
        <input
          type="number"
          id="targetSize"
          value={settings.targetSize || ''}
          onChange={handleTargetSizeChange}
          min="1"
          placeholder=" "
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
        <label className="block text-gray-700 text-sm font-medium" htmlFor="targetSize">
          Target File Size (KB) - optional
        </label>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="format">
            Format
          </label>
          <select
            id="format"
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
          <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="quality">
            Quality: {settings.quality}%
          </label>
          <input
            type="range"
            id="quality"
            min="1"
            max="100"
            value={settings.quality}
            onChange={handleQualityChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>
      
      <button
        type="button"
        onClick={onResize}
        disabled={isProcessing}
        className={`
          w-full py-3 px-4 rounded-lg text-white font-medium transition-all button-hover-effect
          ${isProcessing 
            ? 'bg-gray-400 cursor-not-allowed' 
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
  );
};

export default ResizeOptions; 