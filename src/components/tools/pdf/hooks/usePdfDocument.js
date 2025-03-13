import { useState, useRef, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFJS_WORKER_URL } from '../utils/constants';

// Initialize PDF.js globally
if (typeof window !== 'undefined') {
  window.pdfjsLib = pdfjsLib;
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
}

/**
 * Custom hook for PDF document operations
 */
const usePdfDocument = () => {
  // State for PDF document
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfName, setPdfName] = useState('');
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfPageImages, setPdfPageImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);

  // Create refs for values that need to be accessed in async functions
  const scaleRef = useRef(1.0);
  const rotationRef = useRef(0);
  
  // Keep the refs in sync with the state
  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);
  
  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

  /**
   * Load a PDF document from a file
   * @param {File} file - The PDF file to load
   */
  const loadPDF = async (file) => {
    if (!file) {
      setError('No file selected');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Reset any existing rendering tasks
      if (window._pdfRenderingTask) {
        window._pdfRenderingTask.cancel();
        window._pdfRenderingTask = null;
      }
      
      // Reset state
      setPdfDoc(null);
      setPdfPageImages([]);
      setCurrentPage(1);
      setScale(1.0);
      setRotation(0);
      
      // Read the file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Create a copy to prevent issues with detached ArrayBuffer
      const arrayBufferCopy = arrayBuffer.slice(0);
      
      // Load the PDF document
      const loadingTask = pdfjsLib.getDocument(arrayBufferCopy);
      
      // Track progress
      loadingTask.onProgress = (progressData) => {
        if (progressData.total > 0) {
          const percent = (progressData.loaded / progressData.total) * 100;
          console.log(`Loading PDF: ${percent.toFixed(2)}%`);
        }
      };
      
      const pdfDocument = await loadingTask.promise;
      
      // Store the PDF document in state
      setPdfDoc(pdfDocument);
      setPdfFile(file);
      setPdfName(file.name);
      setPageCount(pdfDocument.numPages);
      
      // Generate page images
      const images = [];
      for (let i = 1; i <= pdfDocument.numPages; i++) {
        const page = await pdfDocument.getPage(i);
        const viewport = page.getViewport({ scale: 1.0, rotation: 0 });
        
        // Create a canvas to render the page
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        // Set canvas dimensions to match viewport
        const pixelRatio = window.devicePixelRatio || 1;
        canvas.width = viewport.width * pixelRatio;
        canvas.height = viewport.height * pixelRatio;
        
        // Scale context to match pixel ratio
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        
        // Render the page to canvas
        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };
        
        await page.render(renderContext).promise;
        
        // Get the image data URL
        const dataUrl = canvas.toDataURL('image/png');
        
        // Add to images array
        images.push({
          pageNumber: i,
          dataUrl,
          width: viewport.width,
          height: viewport.height
        });
      }
      
      // Set page images
      setPdfPageImages(images);
      
      // Create a URL for the PDF
      const pdfURL = URL.createObjectURL(file);
      setPdfUrl(pdfURL);
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error loading PDF:', err);
      setError(`Failed to load PDF: ${err.message}`);
      setIsLoading(false);
    }
  };

  /**
   * Change to a specific page
   * @param {number} pageNumber - The page number to change to
   */
  const changePage = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > pageCount) {
      console.warn(`Invalid page number: ${pageNumber}`);
      return;
    }
    
    setCurrentPage(pageNumber);
  };

  /**
   * Get the current page data
   */
  const getCurrentPageData = () => {
    if (!pdfPageImages.length || currentPage < 1 || currentPage > pdfPageImages.length) {
      return null;
    }
    
    return pdfPageImages[currentPage - 1];
  };

  /**
   * Export the PDF with any modifications
   */
  const exportPDF = async () => {
    if (!pdfDoc) {
      setError('No PDF document loaded');
      return null;
    }
    
    try {
      // Create a new PDF document from the original
      const pdfBytes = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes);
      
      // TODO: Apply annotations and edits to the PDF
      
      // Save the modified PDF
      const modifiedPdfBytes = await pdfDoc.save();
      
      // Create a Blob from the modified PDF
      return new Blob([modifiedPdfBytes], { type: 'application/pdf' });
    } catch (err) {
      console.error('Error exporting PDF:', err);
      setError(`Failed to export PDF: ${err.message}`);
      return null;
    }
  };

  /**
   * Zoom the PDF
   * @param {number} newScale - The new scale value
   */
  const zoom = (newScale) => {
    setScale(newScale);
  };

  /**
   * Rotate the PDF
   * @param {number} angle - The angle to rotate by (in degrees)
   */
  const rotate = (angle) => {
    const newRotation = (rotation + angle) % 360;
    setRotation(newRotation);
  };

  return {
    pdfDoc,
    pdfFile,
    pdfName,
    pdfUrl,
    pageCount,
    currentPage,
    pdfPageImages,
    isLoading,
    error,
    scale,
    rotation,
    loadPDF,
    changePage,
    getCurrentPageData,
    exportPDF,
    zoom,
    rotate,
    setError
  };
};

export default usePdfDocument; 