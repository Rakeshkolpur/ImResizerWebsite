const tf = require('@tensorflow/tfjs-node');

/**
 * Crops an image using TensorFlow.js
 * @param {string} inputPath - Path to the input image
 * @param {string} outputPath - Path to save the cropped image
 * @param {number} startX - X coordinate to start cropping (normalized 0-1)
 * @param {number} startY - Y coordinate to start cropping (normalized 0-1)
 * @param {number} cropWidth - Width of the crop (normalized 0-1)
 * @param {number} cropHeight - Height of the crop (normalized 0-1)
 */
const cropImage = async (inputPath, outputPath, startX, startY, cropWidth, cropHeight) => {
  try {
    const fs = require('fs');
    const imageBuffer = fs.readFileSync(inputPath);
    const imageTensor = tf.node.decodeImage(imageBuffer);
    
    // Get image dimensions
    const height = imageTensor.shape[0];
    const width = imageTensor.shape[1];
    
    // Calculate crop coordinates in pixels
    const startXPixel = Math.floor(startX * width);
    const startYPixel = Math.floor(startY * height);
    const cropWidthPixel = Math.floor(cropWidth * width);
    const cropHeightPixel = Math.floor(cropHeight * height);
    
    // Ensure crop dimensions don't exceed image boundaries
    const endXPixel = Math.min(startXPixel + cropWidthPixel, width);
    const endYPixel = Math.min(startYPixel + cropHeightPixel, height);
    
    // Perform the crop using slice
    const croppedTensor = tf.slice(
      imageTensor,
      [startYPixel, startXPixel, 0], // Start coordinates [y, x, channel]
      [endYPixel - startYPixel, endXPixel - startXPixel, 3] // Size [height, width, channels]
    );
    
    // Save the cropped image
    const croppedImageBuffer = await tf.node.encodeJpeg(croppedTensor);
    fs.writeFileSync(outputPath, croppedImageBuffer);
    
    console.log(`Image cropped successfully to ${outputPath}`);
    
    // Clean up tensors
    imageTensor.dispose();
    croppedTensor.dispose();
    
    return true;
  } catch (error) {
    console.error('Error cropping image:', error);
    return false;
  }
};

// Example usage
const inputImagePath = 'input.jpg';
const outputImagePath = 'cropped_output.jpg';

// Crop the middle 50% of the image
cropImage(inputImagePath, outputImagePath, 0.25, 0.25, 0.5, 0.5)
  .then(success => {
    if (success) {
      console.log('Cropping completed successfully');
    } else {
      console.log('Cropping failed');
    }
  });

module.exports = { cropImage }; 