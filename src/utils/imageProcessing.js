/**
 * Utility functions for image processing
 */

/**
 * Apply bicubic interpolation for high-quality image resizing
 * @param {HTMLImageElement} img - The source image element
 * @param {number} width - Target width in pixels
 * @param {number} height - Target height in pixels
 * @returns {HTMLCanvasElement} - Canvas with the resized image using bicubic interpolation
 */
export const bicubicInterpolation = (img, width, height) => {
  // For very large images or small scaling factors, use a progressive approach
  // to avoid excessive computation
  const MAX_DIMENSION = 2000; // Maximum dimension to process at once
  const isLargeImage = img.width > MAX_DIMENSION || img.height > MAX_DIMENSION;
  const isSmallScaleFactor = width < img.width * 0.3 || height < img.height * 0.3;
  
  // For large downscaling, use a progressive approach
  if (isLargeImage && isSmallScaleFactor) {
    console.log('Using progressive bicubic interpolation for large image');
    return progressiveBicubicInterpolation(img, width, height);
  }
  
  // Create a temporary canvas for the source image
  const sourceCanvas = document.createElement('canvas');
  const sourceCtx = sourceCanvas.getContext('2d');
  sourceCanvas.width = img.width;
  sourceCanvas.height = img.height;
  sourceCtx.drawImage(img, 0, 0);
  
  // Get the source image data
  const sourceData = sourceCtx.getImageData(0, 0, img.width, img.height).data;
  
  // Create the destination canvas
  const destCanvas = document.createElement('canvas');
  const destCtx = destCanvas.getContext('2d');
  destCanvas.width = width;
  destCanvas.height = height;
  
  // Create an ImageData object for the destination
  const destImageData = destCtx.createImageData(width, height);
  const destData = destImageData.data;
  
  // Calculate scaling factors
  const scaleX = img.width / width;
  const scaleY = img.height / height;
  
  // Helper function to get pixel value from source (with bounds checking)
  const getPixel = (x, y, channel) => {
    if (x < 0) x = 0;
    if (y < 0) y = 0;
    if (x >= img.width) x = img.width - 1;
    if (y >= img.height) y = img.height - 1;
    
    const index = (y * img.width + x) * 4 + channel;
    return sourceData[index];
  };
  
  // Bicubic interpolation kernel function
  const cubic = (t) => {
    const absT = Math.abs(t);
    if (absT <= 1) {
      return (1.5 * absT - 2.5) * absT * absT + 1;
    } else if (absT < 2) {
      return ((-0.5 * absT + 2.5) * absT - 4) * absT + 2;
    }
    return 0;
  };
  
  // Process each pixel in the destination image
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Calculate the corresponding position in the source image
      const srcX = x * scaleX;
      const srcY = y * scaleY;
      
      // Get the integer part and fractional part
      const srcX_int = Math.floor(srcX);
      const srcY_int = Math.floor(srcY);
      const dx = srcX - srcX_int;
      const dy = srcY - srcY_int;
      
      // Calculate the destination pixel index
      const destIndex = (y * width + x) * 4;
      
      // Process each color channel (R, G, B, A)
      for (let channel = 0; channel < 4; channel++) {
        let sum = 0;
        let weightSum = 0;
        
        // Sample 16 surrounding pixels (4x4 grid)
        for (let ky = -1; ky <= 2; ky++) {
          for (let kx = -1; kx <= 2; kx++) {
            const sampleX = srcX_int + kx;
            const sampleY = srcY_int + ky;
            
            // Calculate the weight using the bicubic kernel
            const weight = cubic(kx - dx) * cubic(ky - dy);
            
            // Get the pixel value and add it to the weighted sum
            const pixel = getPixel(sampleX, sampleY, channel);
            sum += pixel * weight;
            weightSum += weight;
          }
        }
        
        // Normalize and set the result
        destData[destIndex + channel] = Math.round(sum / weightSum);
      }
    }
  }
  
  // Put the processed image data on the destination canvas
  destCtx.putImageData(destImageData, 0, 0);
  
  return destCanvas;
};

/**
 * Progressive bicubic interpolation for large images
 * Resizes in multiple steps to improve performance
 * @param {HTMLImageElement} img - The source image element
 * @param {number} targetWidth - Final target width
 * @param {number} targetHeight - Final target height
 * @returns {HTMLCanvasElement} - Canvas with the resized image
 */
const progressiveBicubicInterpolation = (img, targetWidth, targetHeight) => {
  // Calculate the number of steps needed
  const steps = Math.ceil(Math.log2(Math.max(
    img.width / targetWidth,
    img.height / targetHeight
  )));
  
  // Limit to a reasonable number of steps
  const actualSteps = Math.min(steps, 3);
  
  // Create initial canvas with the source image
  let currentCanvas = document.createElement('canvas');
  let currentCtx = currentCanvas.getContext('2d');
  currentCanvas.width = img.width;
  currentCanvas.height = img.height;
  currentCtx.drawImage(img, 0, 0);
  
  // If only one step is needed, perform direct bicubic interpolation
  if (actualSteps <= 1) {
    return bicubicInterpolation(img, targetWidth, targetHeight);
  }
  
  // Calculate intermediate dimensions for each step
  for (let step = 0; step < actualSteps; step++) {
    const progress = (step + 1) / actualSteps;
    const stepWidth = Math.round(img.width * (1 - progress) + targetWidth * progress);
    const stepHeight = Math.round(img.height * (1 - progress) + targetHeight * progress);
    
    // Create a temporary image from the current canvas
    const tempImg = new Image();
    tempImg.width = currentCanvas.width;
    tempImg.height = currentCanvas.height;
    
    // Use a synchronous approach for intermediate steps
    const dataURL = currentCanvas.toDataURL('image/png');
    tempImg.src = dataURL;
    
    // For the last step, use full bicubic interpolation
    if (step === actualSteps - 1) {
      return bicubicInterpolation(tempImg, targetWidth, targetHeight);
    }
    
    // For intermediate steps, use a simpler approach
    const nextCanvas = document.createElement('canvas');
    const nextCtx = nextCanvas.getContext('2d');
    nextCanvas.width = stepWidth;
    nextCanvas.height = stepHeight;
    
    // Use a high-quality bilinear interpolation for intermediate steps
    nextCtx.imageSmoothingEnabled = true;
    nextCtx.imageSmoothingQuality = 'high';
    nextCtx.drawImage(tempImg, 0, 0, stepWidth, stepHeight);
    
    // Update current canvas for the next step
    currentCanvas = nextCanvas;
    currentCtx = nextCtx;
  }
  
  return currentCanvas;
};

/**
 * Resize an image to specific dimensions
 * @param {File} imageFile - The original image file
 * @param {Object} options - Resizing options
 * @param {number} options.width - Target width in pixels
 * @param {number} options.height - Target height in pixels
 * @param {string} options.format - Output format (png, jpg, webp, etc)
 * @param {number} options.quality - Output quality (1-100)
 * @param {string} options.algorithm - Resizing algorithm ('bilinear' or 'bicubic')
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
        let canvas;
        
        // Use bicubic interpolation if specified
        if (options.algorithm === 'bicubic') {
          canvas = bicubicInterpolation(img, options.width, options.height);
        } else {
          // Default to bilinear interpolation (browser default)
          canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Set the canvas dimensions to the target size
          canvas.width = options.width;
          canvas.height = options.height;
          
          // Draw the image on the canvas with the new dimensions
          ctx.drawImage(img, 0, 0, options.width, options.height);
        }
        
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
 * @param {string} options.algorithm - Resizing algorithm ('bilinear' or 'bicubic')
 * @returns {Promise<Blob>} - A promise that resolves with the resized image blob
 */
export const resizeToTargetSize = async (imageFile, options) => {
  // The target size in bytes
  const targetSizeBytes = options.targetSize * 1024;
  const isReduceMode = options.mode !== 'increase';
  
  // Format considerations - suggest JPEG for better compression
  const format = options.format || 'jpeg';
  const isLossyFormat = ['jpeg', 'jpg', 'webp'].includes(format.toLowerCase());
  
  console.log(`Target size: ${options.targetSize}KB (${targetSizeBytes} bytes)`);
  console.log(`Using format: ${format}, Lossy: ${isLossyFormat}`);

  // Use different strategies for reducing vs increasing file size
  if (isReduceMode) {
    // If the original file is already smaller than the target, just resize it
    if (imageFile.size <= targetSizeBytes) {
      console.log(`Original file (${imageFile.size} bytes) is already smaller than target (${targetSizeBytes} bytes)`);
      return resizeImage(imageFile, {
        width: options.width,
        height: options.height,
        format: format,
        quality: 95, // Use high quality since we don't need to reduce size
        algorithm: options.algorithm
      });
    }
    
    // For non-lossy formats like PNG, we need to reduce dimensions more aggressively
    if (!isLossyFormat) {
      console.log('Using dimension reduction for non-lossy format');
      return resizeDimensionsForTargetSize(imageFile, options, targetSizeBytes);
    }
    
    // For lossy formats, we can use quality adjustment
    console.log('Using quality adjustment for lossy format');
    
    // Start with quality 90 for reduction
    let minQuality = 5;
    let maxQuality = 100;
    let currentQuality = 90;
    let currentBlob = null;
    let bestBlob = null;
    let bestQualityDiff = Infinity;
    let attempts = 0;
    const maxAttempts = 12; // Increased max attempts for better precision
    
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
          format: format,
          quality: currentQuality,
          algorithm: options.algorithm
        });
        
        // Calculate how far we are from the target size
        const sizeDiff = Math.abs(currentBlob.size - targetSizeBytes);
        const percentDiff = (sizeDiff / targetSizeBytes) * 100;
        
        console.log(`Attempt ${attempts}: Quality ${currentQuality}, Size: ${currentBlob.size} bytes, Diff: ${percentDiff.toFixed(2)}%`);
        
        // If this is the closest we've come to the target size, save it
        if (sizeDiff < bestQualityDiff) {
          bestQualityDiff = sizeDiff;
          bestBlob = currentBlob;
        }
        
        // Check if we're close enough to the target size (within 3%)
        if (sizeDiff < targetSizeBytes * 0.03) {
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
    // try dimension adjustment as a last resort
    if (bestBlob && Math.abs(bestBlob.size - targetSizeBytes) > targetSizeBytes * 0.1) {
      console.log('Quality adjustment not sufficient, trying dimension adjustment');
      return resizeDimensionsForTargetSize(imageFile, options, targetSizeBytes);
    }
    
    // Return the best approximation we found
    console.log(`Returning best approximation after ${attempts} attempts`);
    return bestBlob || currentBlob;
  } else {
    // For increasing file size, we use a different approach
    // First, resize to the desired dimensions with high quality
    let baseBlob = await resizeImage(imageFile, {
      width: options.width,
      height: options.height,
      format: format,
      quality: 100, // Start with maximum quality
      algorithm: options.algorithm
    });
    
    // If the base size is already larger than the target, we're done
    if (baseBlob.size >= targetSizeBytes) {
      console.log(`Base size (${baseBlob.size} bytes) is already larger than target (${targetSizeBytes} bytes)`);
      return baseBlob;
    }
    
    console.log(`Need to increase size from ${baseBlob.size} to ${targetSizeBytes} bytes`);
    
    // To increase file size, we can add metadata or duplicate the image at a higher resolution
    try {
      const img = await blobToImage(baseBlob);
      const canvas = document.createElement('canvas');
      // Make a canvas larger than needed to add size
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
                const combinedBlob = new Blob([blob, padding], { type: `image/${format}` });
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
        }, `image/${format}`, 1.0); // Maximum quality
      });
    } catch (error) {
      console.error("Error while increasing file size:", error);
      // If there's an error, return the best we've got
      return baseBlob;
    }
  }
};

/**
 * Resize image dimensions to achieve a target file size
 * @param {File} imageFile - The original image file
 * @param {Object} options - Resizing options
 * @param {number} targetSizeBytes - Target size in bytes
 * @returns {Promise<Blob>} - A promise that resolves with the resized image blob
 */
const resizeDimensionsForTargetSize = async (imageFile, options, targetSizeBytes) => {
  // Get original dimensions
  const originalDimensions = await getImageDimensions(imageFile);
  const aspectRatio = originalDimensions.width / originalDimensions.height;
  
  // Start with the requested dimensions
  let width = options.width || originalDimensions.width;
  let height = options.height || originalDimensions.height;
  
  // Calculate initial scale factor based on original vs target size
  let scaleFactor = Math.sqrt(targetSizeBytes / imageFile.size);
  
  // Limit scale factor to reasonable bounds
  scaleFactor = Math.max(0.1, Math.min(scaleFactor, 1.0));
  
  // Apply scale factor to dimensions
  width = Math.round(width * scaleFactor);
  height = Math.round(height * scaleFactor);
  
  // Ensure minimum dimensions
  width = Math.max(width, 50);
  height = Math.max(height, 50);
  
  console.log(`Trying dimensions: ${width}x${height} (scale factor: ${scaleFactor})`);
  
  // Resize with the new dimensions
  let resizedBlob = await resizeImage(imageFile, {
    width: width,
    height: height,
    format: options.format,
    quality: 90, // Use high quality
    algorithm: options.algorithm
  });
  
  // If we're still too large, try reducing quality
  if (resizedBlob.size > targetSizeBytes) {
    console.log(`Still too large (${resizedBlob.size} bytes), reducing quality`);
    
    // Try with lower quality
    for (let quality = 80; quality >= 30; quality -= 10) {
      resizedBlob = await resizeImage(imageFile, {
        width: width,
        height: height,
        format: options.format,
        quality: quality,
        algorithm: options.algorithm
      });
      
      console.log(`Quality ${quality}: ${resizedBlob.size} bytes`);
      
      if (resizedBlob.size <= targetSizeBytes * 1.1) {
        break;
      }
    }
  }
  
  return resizedBlob;
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
 * @param {string} algorithm - Resizing algorithm ('bilinear' or 'bicubic')
 * @returns {Promise<Blob>} - A promise that resolves with the converted image blob
 */
export const convertImageFormat = (imageFile, format, quality = 90, algorithm = 'bicubic') => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const img = new Image();
      
      img.onload = () => {
        let canvas;
        
        // Use bicubic interpolation if specified
        if (algorithm === 'bicubic') {
          canvas = bicubicInterpolation(img, img.width, img.height);
        } else {
          // Default to bilinear interpolation (browser default)
          canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0, img.width, img.height);
        }
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert image format'));
          }
        }, `image/${format}`, quality / 100);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image for format conversion'));
      };
      
      img.src = event.target.result;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file for format conversion'));
    };
    
    reader.readAsDataURL(imageFile);
  });
};

/**
 * Compress an image by reducing its quality
 * @param {File} imageFile - The original image file
 * @param {number} quality - Output quality (1-100)
 * @param {string} algorithm - Resizing algorithm ('bilinear' or 'bicubic')
 * @returns {Promise<Blob>} - A promise that resolves with the compressed image blob
 */
export const compressImage = (imageFile, quality = 75, algorithm = 'bicubic') => {
  const format = imageFile.type.split('/')[1] || 'jpeg';
  return convertImageFormat(imageFile, format, quality, algorithm);
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