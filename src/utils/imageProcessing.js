/**
 * Utility functions for image processing
 */

/**
 * Resize an image to specific dimensions
 * @param {File} imageFile - The original image file
 * @param {Object} options - Resizing options
 * @param {number} options.width - Target width in pixels
 * @param {number} options.height - Target height in pixels
 * @param {string} options.format - Output format (png, jpg, webp, etc)
 * @param {number} options.quality - Output quality (1-100)
 * @returns {Promise<Blob>} - A promise that resolves with the resized image blob
 */
export const resizeImage = (imageFile, options) => {
  return new Promise((resolve, reject) => {
    // Create a FileReader to read the image
    const reader = new FileReader();
    
    reader.onload = (event) => {
      // Create an image element to load the image
      const img = new Image();
      
      img.onload = () => {
        // Create a canvas to draw the resized image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set the canvas dimensions to the target size
        canvas.width = options.width;
        canvas.height = options.height;
        
        // Draw the image on the canvas with the new dimensions
        ctx.drawImage(img, 0, 0, options.width, options.height);
        
        // Get the image quality
        const quality = options.quality / 100;
        
        // Convert the canvas to a blob of the specified format
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert canvas to blob'));
          }
        }, `image/${options.format}`, quality);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      // Set the source of the image to the FileReader result
      img.src = event.target.result;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    // Read the image file as a data URL
    reader.readAsDataURL(imageFile);
  });
};

/**
 * Resize an image to a target file size (either reduce or increase)
 * @param {File} imageFile - The original image file
 * @param {Object} options - Resizing options
 * @param {number} options.targetSize - Target size in KB
 * @param {number} options.width - Target width in pixels
 * @param {number} options.height - Target height in pixels
 * @param {string} options.format - Output format (png, jpg, webp, etc)
 * @param {string} options.mode - 'reduce' or 'increase'
 * @returns {Promise<Blob>} - A promise that resolves with the resized image blob
 */
export const resizeToTargetSize = async (imageFile, options) => {
  // The target size in bytes
  const targetSizeBytes = options.targetSize * 1024;
  const isReduceMode = options.mode !== 'increase';

  // Use different strategies for reducing vs increasing file size
  if (isReduceMode) {
    // Start with quality 90 for reduction
    let minQuality = 5;
    let maxQuality = 100;
    let currentQuality = 90;
    let currentBlob = null;
    let bestBlob = null;
    let bestQualityDiff = Infinity;
    let attempts = 0;
    const maxAttempts = 10; // Limit attempts to prevent infinite loops
    
    // If the original file is already smaller than the target, just resize it
    if (imageFile.size <= targetSizeBytes) {
      return resizeImage(imageFile, {
        width: options.width,
        height: options.height,
        format: options.format,
        quality: 95 // Use high quality since we don't need to reduce size
      });
    }
    
    // Binary search approach to find the right quality setting
    while (minQuality <= maxQuality && attempts < maxAttempts) {
      attempts++;
      
      // Try the current quality value
      currentQuality = Math.floor((minQuality + maxQuality) / 2);
      
      try {
        // Resize with the current quality
        currentBlob = await resizeImage(imageFile, {
          width: options.width || 800, // Default width if not specified
          height: options.height || 600, // Default height if not specified
          format: options.format,
          quality: currentQuality
        });
        
        // Calculate how far we are from the target size
        const sizeDiff = Math.abs(currentBlob.size - targetSizeBytes);
        
        // If this is the closest we've come to the target size, save it
        if (sizeDiff < bestQualityDiff) {
          bestQualityDiff = sizeDiff;
          bestBlob = currentBlob;
        }
        
        // Check if we're close enough to the target size (within 5%)
        if (sizeDiff < targetSizeBytes * 0.05) {
          console.log(`Found good quality (${currentQuality}) after ${attempts} attempts`);
          return currentBlob;
        }
        
        // Adjust the quality range based on the current blob size
        if (currentBlob.size > targetSizeBytes) {
          // Too big, reduce quality
          maxQuality = currentQuality - 1;
        } else {
          // Too small, increase quality
          minQuality = currentQuality + 1;
        }
      } catch (error) {
        console.error("Error during resize attempt:", error);
        // If an error occurs, try to work with what we have
        if (bestBlob) return bestBlob;
        throw error;
      }
    }
    
    // If we couldn't get exactly what we wanted after max attempts,
    // return the best approximation we found
    console.log(`Returning best approximation after ${attempts} attempts`);
    return bestBlob || currentBlob;
  } else {
    // For increasing file size, we use a different approach
    // First, resize to the desired dimensions with high quality
    let baseBlob = await resizeImage(imageFile, {
      width: options.width,
      height: options.height,
      format: options.format,
      quality: 100 // Start with maximum quality
    });
    
    // If the base size is already larger than the target, we're done
    if (baseBlob.size >= targetSizeBytes) {
      return baseBlob;
    }
    
    // To increase file size, we can add metadata or duplicate the image at a higher resolution
    // For this demo, let's create a larger canvas and draw our image multiple times
    try {
      const img = await blobToImage(baseBlob);
      const canvas = document.createElement('canvas');
      // Make a canvas 2x larger than needed to add size
      const scale = Math.max(1.5, Math.sqrt(targetSizeBytes / baseBlob.size));
      canvas.width = Math.floor(options.width * scale);
      canvas.height = Math.floor(options.height * scale);
      
      const ctx = canvas.getContext('2d');
      
      // Fill with a very subtle pattern to increase file size without being visible
      ctx.fillStyle = 'rgba(255,255,255,0.01)'; // Nearly invisible
      for (let i = 0; i < canvas.width; i += 10) {
        for (let j = 0; j < canvas.height; j += 10) {
          // Random transparency to create "noise" that compresses poorly
          ctx.globalAlpha = Math.random() * 0.01; // Very low alpha
          ctx.fillRect(i, j, 10, 10);
        }
      }
      
      // Draw the image on top of the noise
      ctx.globalAlpha = 1;
      ctx.drawImage(img, 0, 0, options.width, options.height);
      
      // Convert to blob with minimal compression
      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            // If the blob is still too small, add more noise
            if (blob.size < targetSizeBytes) {
              // Add padding data to reach the target size
              const paddingNeeded = targetSizeBytes - blob.size;
              if (paddingNeeded > 0) {
                // Create padding data (random bytes)
                const padding = new Uint8Array(paddingNeeded);
                for (let i = 0; i < paddingNeeded; i++) {
                  padding[i] = Math.floor(Math.random() * 256);
                }
                
                // Combine the blob with padding
                const combinedBlob = new Blob([blob, padding], { type: `image/${options.format}` });
                resolve(combinedBlob);
              } else {
                resolve(blob);
              }
            } else {
              resolve(blob);
            }
          } else {
            reject(new Error('Failed to convert canvas to blob'));
          }
        }, `image/${options.format}`, 1.0); // Maximum quality
      });
    } catch (error) {
      console.error("Error while increasing file size:", error);
      // If there's an error, return the best we've got
      return baseBlob;
    }
  }
};

/**
 * Helper function to convert a blob to an Image object
 * @param {Blob} blob - The image blob
 * @returns {Promise<HTMLImageElement>} - A promise that resolves with an image element
 */
const blobToImage = (blob) => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image from blob'));
    };
    img.src = url;
  });
};

/**
 * Convert an image to a different format
 * @param {File} imageFile - The original image file
 * @param {string} format - Target format (png, jpg, webp, etc)
 * @param {number} quality - Output quality (1-100)
 * @returns {Promise<Blob>} - A promise that resolves with the converted image blob
 */
export const convertImageFormat = (imageFile, format, quality = 90) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert image format'));
          }
        }, `image/${format}`, quality / 100);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = event.target.result;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(imageFile);
  });
};

/**
 * Compress an image to reduce file size
 * @param {File} imageFile - The original image file
 * @param {number} quality - Compression quality (1-100)
 * @returns {Promise<Blob>} - A promise that resolves with the compressed image blob
 */
export const compressImage = (imageFile, quality = 75) => {
  // Get the original format or default to jpeg for better compression
  const format = imageFile.type.split('/')[1] || 'jpeg';
  
  return convertImageFormat(imageFile, format, quality);
};

/**
 * Get the dimensions of an image
 * @param {File} imageFile - The image file
 * @returns {Promise<{width: number, height: number}>} - A promise that resolves with the image dimensions
 */
export const getImageDimensions = (imageFile) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const img = new Image();
      
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height
        });
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = event.target.result;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(imageFile);
  });
};

/**
 * Calculate the file size of an image in KB
 * @param {Blob} blob - The image blob
 * @returns {number} - The file size in KB
 */
export const calculateFileSize = (blob) => {
  return blob.size / 1024;
};

/**
 * Create a download link for an image blob
 * @param {Blob} blob - The image blob
 * @param {string} filename - The filename for the download
 */
export const downloadImage = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Batch process multiple images
 * @param {File[]} imageFiles - Array of image files
 * @param {Object} options - Processing options
 * @returns {Promise<Blob[]>} - A promise that resolves with an array of processed image blobs
 */
export const batchProcessImages = async (imageFiles, options) => {
  const results = [];
  
  for (const file of imageFiles) {
    try {
      let processedBlob;
      
      if (options.targetSize) {
        processedBlob = await resizeToTargetSize(file, options);
      } else {
        processedBlob = await resizeImage(file, options);
      }
      
      results.push(processedBlob);
    } catch (error) {
      console.error(`Error processing ${file.name}:`, error);
    }
  }
  
  return results;
}; 