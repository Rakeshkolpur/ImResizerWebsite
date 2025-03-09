const tf = require('@tensorflow/tfjs-node');

const resizeImage = async (inputPath, outputPath, targetWidth, targetHeight) => {
  const fs = require('fs');
  const imageBuffer = fs.readFileSync(inputPath);
  const imageTensor = tf.node.decodeImage(imageBuffer);

  const resizedImageTensor = tf.image.resizeBilinear(imageTensor, [targetHeight, targetWidth]);

  const resizedImageBuffer = await tf.node.encodeJpeg(resizedImageTensor);
  fs.writeFileSync(outputPath, resizedImageBuffer);

  console.log(`Image resized successfully to ${outputPath}`);
};

// Example usage
const inputImagePath = 'input.jpg';
const outputImagePath = 'output.jpg';
const targetWidth = 300;
const targetHeight = 200;

resizeImage(inputImagePath, outputImagePath, targetWidth, targetHeight);

// Crop the middle 50% of the image
cropImage('input.jpg', 'cropped_output.jpg', 0.25, 0.25, 0.5, 0.5)