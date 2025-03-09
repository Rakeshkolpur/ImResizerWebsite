import React from 'react';

const ImageCompress = () => {
  return (
    <div className="p-6 text-center">
      <div className="py-12 rounded-xl bg-purple-50 dark:bg-purple-900 dark:bg-opacity-10">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-purple-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Image Compression Tool</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
          This tool is coming soon. It will allow you to compress images while maintaining quality.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          We're working hard to make this tool available soon!
        </p>
      </div>
    </div>
  );
};

export default ImageCompress; 