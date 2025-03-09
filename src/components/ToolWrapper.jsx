import React from 'react';
import { findToolById } from '../data/tools';

// Lazy load tool components
const ImageResize = React.lazy(() => import('./tools/image/ImageResize'));
const ImageCompress = React.lazy(() => import('./tools/image/ImageCompress'));
const ImageCrop = React.lazy(() => import('./tools/image/ImageCrop'));
const ImageConvert = React.lazy(() => import('./tools/image/ImageConvert'));
const PdfToWord = React.lazy(() => import('./tools/conversion/PdfToWord'));
const WordToPdf = React.lazy(() => import('./tools/conversion/WordToPdf'));
const JpgToPdf = React.lazy(() => import('./tools/conversion/JpgToPdf'));
const PdfToJpg = React.lazy(() => import('./tools/conversion/PdfToJpg'));
const ExtractText = React.lazy(() => import('./tools/pdf/ExtractText'));

const ToolWrapper = ({ toolId, onBack }) => {
  const tool = findToolById(toolId);
  
  if (!tool) {
    return (
      <div className="text-center p-10">
        <h2 className="text-xl text-red-500">Tool not found</h2>
        <button 
          onClick={onBack}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          Go Back
        </button>
      </div>
    );
  }
  
  // Render the corresponding tool component based on the toolId
  const renderTool = () => {
    switch (toolId) {
      case 'resize_image':
        return <ImageResize />;
      case 'compress_image':
        return <ImageCompress />;
      case 'crop_image':
        return <ImageCrop />;
      case 'convert_image':
        return <ImageConvert />;
      case 'pdf_to_word':
        return <PdfToWord />;
      case 'word_to_pdf':
        return <WordToPdf />;
      case 'jpg_to_pdf':
        return <JpgToPdf />;
      case 'pdf_to_jpg':
        return <PdfToJpg />;
      case 'extract_text':
        return <ExtractText />;
      default:
        // If the tool component is not yet implemented, show a message
        return (
          <div className="text-center p-10">
            <h2 className="text-xl">This tool is coming soon!</h2>
            <p className="text-gray-500 mt-2">We're working hard to make this tool available.</p>
          </div>
        );
    }
  };
  
  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-10">
      <div className="container mx-auto">
        <div className="mb-6 flex items-center">
          <button 
            onClick={onBack}
            className="flex items-center text-blue-500 hover:text-blue-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Tools
          </button>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300">
                {tool.icon}
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{tool.title}</h1>
                <p className="text-gray-600 dark:text-gray-300">{tool.description}</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <React.Suspense fallback={
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
              </div>
            }>
              {renderTool()}
            </React.Suspense>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolWrapper; 