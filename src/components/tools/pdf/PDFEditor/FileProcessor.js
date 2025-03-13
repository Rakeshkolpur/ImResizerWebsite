import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

/**
 * FileProcessor class for handling PDF file operations
 * Responsible for loading, processing, and saving PDF files
 */
export class FileProcessor {
  constructor({ canvas, addToUndoStack, setPdfPageImages }) {
    this.canvas = canvas;
    this.addToUndoStack = addToUndoStack;
    this.setPdfPageImages = setPdfPageImages;
    
    this.pdfDoc = null;
    this.pdfFile = null;
    this.pdfName = '';
    this.arrayBuffer = null;
    this.pageCount = 0;
    this.currentPage = 1;
    this.isLoading = false;
    this.error = null;
    this.pdfPageImages = [];
    
    // Initialize PDF.js
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    
    // Ensure the worker URL matches the PDF.js version
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc.includes(pdfjsLib.version)) {
      console.warn(`Worker URL does not match PDF.js version. Using ${pdfjsLib.GlobalWorkerOptions.workerSrc} with PDF.js ${pdfjsLib.version}`);
    }
    
    // Handle errors with the PDF.js worker
    window.addEventListener('error', (event) => {
      if (event.message.includes('error loading PDF.js worker') || event.message.includes('Failed to load PDF.js worker')) {
        console.warn('Failed to load PDF.js worker from CDN. Using backup worker URL.');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
      }
    });
  }
  
  /**
   * Load a PDF file
   * @param {File} file - PDF file object
   */
  async loadPDF(file) {
    try {
      this.isLoading = true;
      this.error = null;
      this.pdfFile = file;
      this.pdfName = file.name;
      
      // Read the file as ArrayBuffer
      const reader = new FileReader();
      
      // Create a Promise to handle the file reading
      const fileReadPromise = new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
      });
      
      // Start reading the file
      reader.readAsArrayBuffer(file);
      
      // Wait for the file to be read
      const arrayBuffer = await fileReadPromise;
      
      // Create a copy of the ArrayBuffer to avoid issues with detached ArrayBuffers
      const arrayBufferCopy = arrayBuffer.slice(0);
      this.arrayBuffer = arrayBufferCopy;
      
      // Load the PDF document
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      
      // Track progress
      loadingTask.onProgress = (data) => {
        const percentLoaded = data.loaded / data.total * 100;
        console.log(`Loading PDF: ${Math.round(percentLoaded)}%`);
      };
      
      const pdfDocument = await loadingTask.promise;
      
      // Update state
      this.pdfDoc = pdfDocument;
      this.pageCount = pdfDocument.numPages;
      this.currentPage = 1;
      
      // Reset PDF page images
      const newPageImages = [];
      
      // Render all pages
      for (let i = 1; i <= this.pageCount; i++) {
        const page = await pdfDocument.getPage(i);
        const viewport = page.getViewport({ scale: 1.0 });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        // Set canvas size to match the page
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        // Render the page
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;
        
        // Store the rendered page image
        newPageImages.push({
          dataUrl: canvas.toDataURL('image/png'),
          width: viewport.width,
          height: viewport.height
        });
      }
      
      // Update PDF page images state
      this.pdfPageImages = newPageImages;
      this.setPdfPageImages(newPageImages);
      
      // Reset loading and error states
      this.isLoading = false;
      this.error = null;
      
      // Load PDF into pdf-lib for saving
      this.pdfLibDoc = await PDFDocument.load(this.arrayBuffer);
      
      return {
        success: true,
        pdfDocument,
        pageCount: this.pageCount,
        pageImages: newPageImages
      };
    } catch (error) {
      console.error('Error loading PDF:', error);
      this.error = error.message;
      this.isLoading = false;
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Save the current PDF with annotations
   */
  async savePDF() {
    try {
      if (!this.pdfLibDoc || !this.canvas) {
        throw new Error('No PDF document or canvas available');
      }
      
      // TODO: Add annotations to PDF
      // This would involve converting canvas objects to PDF annotations
      // For now, we'll just save the original PDF
      
      // Serialize the PDF
      const pdfBytes = await this.pdfLibDoc.save();
      
      // Create a Blob from the PDF bytes
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      
      // Create a download link
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `edited_${this.pdfName}`;
      
      // Trigger the download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return { success: true };
    } catch (error) {
      console.error('Error saving PDF:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default FileProcessor; 