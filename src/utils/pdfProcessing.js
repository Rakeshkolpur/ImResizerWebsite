import { PDFDocument } from 'pdf-lib';

/**
 * Compresses a PDF file with the specified options
 * @param {ArrayBuffer} pdfBuffer - The PDF file buffer
 * @param {Object} options - Compression options
 * @param {number} options.quality - Quality level (0-1)
 * @param {number} options.imageQuality - Image quality level (0-1)
 * @param {boolean} options.compressImages - Whether to compress embedded images
 * @param {boolean} options.removeMetadata - Whether to remove metadata
 * @returns {Promise<Uint8Array>} - Compressed PDF as Uint8Array
 */
export const compressPDF = async (pdfBuffer, options = {}) => {
  const {
    quality = 0.8,
    imageQuality = 0.7,
    compressImages = true,
    removeMetadata = true,
  } = options;
  
  try {
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    
    // Remove metadata if specified
    if (removeMetadata) {
      pdfDoc.setTitle('');
      pdfDoc.setAuthor('');
      pdfDoc.setSubject('');
      pdfDoc.setKeywords([]);
      pdfDoc.setProducer('PDF Compressor');
      pdfDoc.setCreator('PDF Compressor');
    }
    
    // Save with compression options
    const compressedBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 100,
    });
    
    return compressedBytes;
  } catch (error) {
    console.error('Error compressing PDF:', error);
    throw new Error('Failed to compress PDF');
  }
};

/**
 * Compresses a PDF to a target file size
 * @param {ArrayBuffer} pdfBuffer - The PDF file buffer
 * @param {number} targetSizeKB - Target size in KB
 * @returns {Promise<Uint8Array>} - Compressed PDF as Uint8Array
 */
export const compressPDFToTargetSize = async (pdfBuffer, targetSizeKB) => {
  // Start with a high quality
  let quality = 0.9;
  let imageQuality = 0.8;
  let compressedBytes;
  let currentSize = pdfBuffer.byteLength / 1024; // Convert to KB
  
  // If target size is larger than original, just return the original
  if (targetSizeKB >= currentSize) {
    return new Uint8Array(pdfBuffer);
  }
  
  // Try to compress with decreasing quality until target size is reached
  while (quality >= 0.1) {
    compressedBytes = await compressPDF(pdfBuffer, {
      quality,
      imageQuality,
      compressImages: true,
      removeMetadata: true,
    });
    
    currentSize = compressedBytes.byteLength / 1024;
    
    if (currentSize <= targetSizeKB) {
      break;
    }
    
    // Reduce quality for next iteration
    quality -= 0.1;
    imageQuality -= 0.1;
  }
  
  return compressedBytes;
};

/**
 * Gets the page count of a PDF
 * @param {ArrayBuffer} pdfBuffer - The PDF file buffer
 * @returns {Promise<number>} - Number of pages
 */
export const getPDFPageCount = async (pdfBuffer) => {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    return pdfDoc.getPageCount();
  } catch (error) {
    console.error('Error getting PDF page count:', error);
    throw new Error('Failed to get PDF page count');
  }
};

/**
 * Calculates the file size in KB
 * @param {File|Blob|ArrayBuffer} file - The file to calculate size for
 * @returns {number} - File size in KB
 */
export const calculateFileSize = (file) => {
  if (file instanceof File || file instanceof Blob) {
    return file.size / 1024;
  } else if (file instanceof ArrayBuffer) {
    return file.byteLength / 1024;
  } else if (file instanceof Uint8Array) {
    return file.byteLength / 1024;
  }
  return 0;
};

/**
 * Formats a file size with appropriate units
 * @param {number} sizeInKB - Size in KB
 * @returns {string} - Formatted size string
 */
export const formatFileSize = (sizeInKB) => {
  if (sizeInKB < 1) {
    return `${Math.round(sizeInKB * 1024)} B`;
  } else if (sizeInKB < 1024) {
    return `${Math.round(sizeInKB)} KB`;
  } else {
    return `${(sizeInKB / 1024).toFixed(2)} MB`;
  }
}; 