import { jsPDF } from 'jspdf';
import { fabric } from 'fabric';

/**
 * Convert data URL to Blob
 * @param {string} dataURL - Data URL to convert
 * @returns {Blob} - Converted Blob
 */
export const dataURLtoBlob = (dataURL) => {
  const parts = dataURL.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);
  
  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }
  
  return new Blob([uInt8Array], { type: contentType });
};

/**
 * Save PDF with annotations
 * @param {Array} pdfPageImages - Array of page image data
 * @param {Array} fabricCanvases - Array of Fabric.js canvases for each page
 * @param {string} fileName - Output file name
 * @returns {Promise<Blob>} - Promise that resolves with the saved PDF blob
 */
export const savePDF = async (pdfPageImages, fabricCanvases, fileName = 'edited-document.pdf') => {
  try {
    // Check if we have pages to save
    if (!pdfPageImages || pdfPageImages.length === 0) {
      throw new Error("No PDF pages to save");
    }
    
    // Create a new PDF document
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt'
    });
    
    // Process each page
    for (let i = 0; i < pdfPageImages.length; i++) {
      const pageData = pdfPageImages[i];
      
      if (!pageData || !pageData.dataURL) {
        console.warn(`Skipping page ${i + 1} - no page data`);
        continue;
      }
      
      // Add a new page for pages after the first
      if (i > 0) {
        pdf.addPage([pageData.width, pageData.height]);
      } else {
        // Set the page size for the first page
        pdf.setPage(1);
      }
      
      // Add the background image (original PDF)
      pdf.addImage(
        pageData.dataURL,
        'PNG',
        0,
        0,
        pageData.width,
        pageData.height
      );
      
      // Add annotations if we have a canvas for this page
      if (fabricCanvases && fabricCanvases[i]) {
        const canvas = fabricCanvases[i];
        
        // Get canvas as data URL
        const canvasDataURL = canvas.toDataURL({
          format: 'png',
          multiplier: 1,
          withoutTransform: true,
          enableRetinaScaling: true
        });
        
        // Add canvas content as an image overlay
        pdf.addImage(
          canvasDataURL,
          'PNG',
          0,
          0,
          pageData.width,
          pageData.height
        );
      }
    }
    
    // Save the PDF
    const pdfBlob = pdf.output('blob');
    
    return pdfBlob;
  } catch (error) {
    console.error("Error saving PDF:", error);
    throw error;
  }
};

/**
 * Download a blob as a file
 * @param {Blob} blob - Blob to download
 * @param {string} fileName - File name
 */
export const downloadBlob = (blob, fileName) => {
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    
    // Clean up
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    console.error("Error downloading file:", error);
    throw error;
  }
};

/**
 * Convert canvas objects to a PNG image
 * @param {Object} canvas - Fabric.js canvas
 * @param {Object} options - Export options
 * @returns {string} - Data URL of the exported image
 */
export const exportCanvasAsPNG = (canvas, options = {}) => {
  if (!canvas) return null;
  
  try {
    const defaultOptions = {
      format: 'png',
      quality: 1,
      multiplier: window.devicePixelRatio || 1,
      enableRetinaScaling: true
    };
    
    const exportOptions = { ...defaultOptions, ...options };
    
    return canvas.toDataURL(exportOptions);
  } catch (error) {
    console.error("Error exporting canvas as PNG:", error);
    return null;
  }
};

/**
 * Extract text from a PDF page
 * @param {Object} pdfPage - PDF.js page object
 * @returns {Promise<string>} - Extracted text
 */
export const extractTextFromPage = async (pdfPage) => {
  if (!pdfPage) return '';
  
  try {
    const textContent = await pdfPage.getTextContent();
    let text = '';
    
    textContent.items.forEach(item => {
      text += item.str + ' ';
    });
    
    return text.trim();
  } catch (error) {
    console.error("Error extracting text from page:", error);
    return '';
  }
};

export default {
  dataURLtoBlob,
  savePDF,
  downloadBlob,
  exportCanvasAsPNG,
  extractTextFromPage
}; 