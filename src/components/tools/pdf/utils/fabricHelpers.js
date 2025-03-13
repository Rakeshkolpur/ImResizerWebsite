import { fabric } from 'fabric';

/**
 * Find a Fabric object by ID
 * @param {Object} canvas - Fabric.js canvas
 * @param {string} id - Object ID
 * @returns {Object|null} - Found object or null
 */
export const findObjectById = (canvas, id) => {
  if (!canvas) return null;
  
  const objects = canvas.getObjects();
  return objects.find(obj => obj.id === id) || null;
};

/**
 * Add a text object to the canvas
 * @param {Object} canvas - Fabric.js canvas
 * @param {Object} options - Text options
 * @returns {Object|null} - Created text object or null
 */
export const addTextObject = (canvas, options) => {
  if (!canvas) return null;
  
  try {
    const defaultOptions = {
      left: 100,
      top: 100,
      fontFamily: 'Helvetica',
      fontSize: 16,
      fill: '#000000',
      padding: 5,
      cornerSize: 8,
      transparentCorners: false,
      centeredScaling: true,
      editingBorderColor: '#00AEFF',
      cursorWidth: 2,
      cursorColor: '#000000',
      cursorDuration: 600,
      editable: true,
      selectable: true,
      hasControls: true,
      hasBorders: true,
      id: `text-${Date.now()}`
    };
    
    const textOptions = { ...defaultOptions, ...options };
    const text = new fabric.IText(options.text || 'Text', textOptions);
    
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    
    return text;
  } catch (error) {
    console.error("Error adding text object:", error);
    return null;
  }
};

/**
 * Add a shape to the canvas
 * @param {Object} canvas - Fabric.js canvas
 * @param {string} shapeType - Shape type ('rect', 'circle', 'triangle', etc.)
 * @param {Object} options - Shape options
 * @returns {Object|null} - Created shape object or null
 */
export const addShapeObject = (canvas, shapeType, options = {}) => {
  if (!canvas) return null;
  
  try {
    const defaultOptions = {
      left: 100,
      top: 100,
      width: 100,
      height: 100,
      fill: 'transparent',
      stroke: '#000000',
      strokeWidth: 2,
      cornerSize: 8,
      transparentCorners: false,
      centeredScaling: true,
      selectable: true,
      hasControls: true,
      hasBorders: true,
      id: `shape-${Date.now()}`
    };
    
    const shapeOptions = { ...defaultOptions, ...options };
    let shape;
    
    switch (shapeType.toLowerCase()) {
      case 'rect':
        shape = new fabric.Rect(shapeOptions);
        break;
      case 'circle':
        shape = new fabric.Circle({
          ...shapeOptions,
          radius: (shapeOptions.width || 50) / 2
        });
        break;
      case 'triangle':
        shape = new fabric.Triangle(shapeOptions);
        break;
      case 'line':
        shape = new fabric.Line([
          shapeOptions.left, 
          shapeOptions.top, 
          shapeOptions.left + (shapeOptions.width || 100), 
          shapeOptions.top
        ], {
          ...shapeOptions,
          stroke: shapeOptions.stroke || '#000000',
          strokeWidth: shapeOptions.strokeWidth || 2
        });
        break;
      case 'ellipse':
        shape = new fabric.Ellipse({
          ...shapeOptions,
          rx: (shapeOptions.width || 100) / 2,
          ry: (shapeOptions.height || 50) / 2
        });
        break;
      default:
        console.error(`Unknown shape type: ${shapeType}`);
        return null;
    }
    
    canvas.add(shape);
    canvas.setActiveObject(shape);
    canvas.renderAll();
    
    return shape;
  } catch (error) {
    console.error(`Error adding ${shapeType} shape:`, error);
    return null;
  }
};

/**
 * Add an image to the canvas
 * @param {Object} canvas - Fabric.js canvas
 * @param {string|File} source - Image source (URL or File)
 * @param {Object} options - Image options
 * @returns {Promise<Object|null>} - Created image object or null
 */
export const addImageObject = async (canvas, source, options = {}) => {
  if (!canvas) return null;
  
  try {
    let imgUrl;
    
    if (typeof source === 'string') {
      // Source is a URL
      imgUrl = source;
    } else if (source instanceof File) {
      // Source is a File object
      imgUrl = URL.createObjectURL(source);
    } else {
      console.error("Invalid image source:", source);
      return null;
    }
    
    return new Promise((resolve, reject) => {
      fabric.Image.fromURL(imgUrl, img => {
        if (!img) {
          reject(new Error("Failed to load image"));
          return;
        }
        
        const defaultOptions = {
          left: 100,
          top: 100,
          cornerSize: 8,
          transparentCorners: false,
          centeredScaling: true,
          selectable: true,
          hasControls: true,
          hasBorders: true,
          id: `image-${Date.now()}`
        };
        
        const imageOptions = { ...defaultOptions, ...options };
        
        img.set(imageOptions);
        
        // Scale image if needed
        if (options.maxWidth || options.maxHeight) {
          const maxWidth = options.maxWidth || Infinity;
          const maxHeight = options.maxHeight || Infinity;
          
          const scale = Math.min(
            maxWidth / img.width,
            maxHeight / img.height,
            1 // Don't scale up small images
          );
          
          img.scale(scale);
        }
        
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        
        resolve(img);
      }, err => {
        console.error("Error loading image:", err);
        reject(err);
      });
    });
  } catch (error) {
    console.error("Error adding image object:", error);
    return null;
  }
};

/**
 * Duplicate a Fabric object
 * @param {Object} canvas - Fabric.js canvas
 * @param {Object} obj - Object to duplicate
 * @returns {Object|null} - Duplicated object or null
 */
export const duplicateObject = (canvas, obj) => {
  if (!canvas || !obj) return null;
  
  try {
    // Clone object
    obj.clone(clone => {
      // Modify properties of the cloned object
      clone.set({
        left: obj.left + 10,
        top: obj.top + 10,
        id: `${obj.id?.split('-')[0] || 'object'}-${Date.now()}`
      });
      
      // Add to canvas
      canvas.add(clone);
      canvas.setActiveObject(clone);
      canvas.renderAll();
    });
    
    return true;
  } catch (error) {
    console.error("Error duplicating object:", error);
    return null;
  }
};

/**
 * Delete selected objects from the canvas
 * @param {Object} canvas - Fabric.js canvas
 * @returns {boolean} - Success
 */
export const deleteSelectedObjects = (canvas) => {
  if (!canvas) return false;
  
  try {
    const activeObject = canvas.getActiveObject();
    
    if (!activeObject) return false;
    
    if (activeObject.type === 'activeSelection') {
      // Multiple objects selected
      activeObject.forEachObject(obj => {
        canvas.remove(obj);
      });
      
      canvas.discardActiveObject();
    } else {
      // Single object selected
      canvas.remove(activeObject);
    }
    
    canvas.renderAll();
    
    return true;
  } catch (error) {
    console.error("Error deleting selected objects:", error);
    return false;
  }
};

/**
 * Bring selected objects to front
 * @param {Object} canvas - Fabric.js canvas
 * @returns {boolean} - Success
 */
export const bringToFront = (canvas) => {
  if (!canvas) return false;
  
  try {
    const activeObject = canvas.getActiveObject();
    if (!activeObject) return false;
    
    canvas.bringToFront(activeObject);
    canvas.renderAll();
    
    return true;
  } catch (error) {
    console.error("Error bringing objects to front:", error);
    return false;
  }
};

/**
 * Send selected objects to back
 * @param {Object} canvas - Fabric.js canvas
 * @returns {boolean} - Success
 */
export const sendToBack = (canvas) => {
  if (!canvas) return false;
  
  try {
    const activeObject = canvas.getActiveObject();
    if (!activeObject) return false;
    
    canvas.sendToBack(activeObject);
    canvas.renderAll();
    
    return true;
  } catch (error) {
    console.error("Error sending objects to back:", error);
    return false;
  }
};

export default {
  findObjectById,
  addTextObject,
  addShapeObject,
  addImageObject,
  duplicateObject,
  deleteSelectedObjects,
  bringToFront,
  sendToBack
}; 