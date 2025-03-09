import React from 'react';

const ImageConvert = () => {
  return (
    <div className="p-6 text-center">
      <div className="py-12 rounded-xl bg-blue-50 dark:bg-blue-900 dark:bg-opacity-10">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-blue-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Image Format Converter</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
          This tool is coming soon. It will allow you to convert images between different formats (JPG, PNG, WebP, etc.).
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          We're working hard to make this tool available soon!
        </p>
      </div>
    </div>
  );
};

export default ImageConvert; 