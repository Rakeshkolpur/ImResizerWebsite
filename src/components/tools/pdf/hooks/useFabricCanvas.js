import { useState, useRef, useEffect } from 'react';
import { fabric } from 'fabric-pure-browser';

/**
 * Custom hook for managing Fabric.js canvas operations
 */
const useFabricCanvas = () => {
  // Canvas reference
  const canvasRef = useRef(null);
  
  // Fabric canvas reference
  const fabricCanvas = useRef(null);
  
  // State for canvas dimensions
  const [canvasDimensions, setCanvasDimensions] = useState({
    width: 0,
    height: 0
  });
  
  // State for selected object
  const [selectedObject, setSelectedObject] = useState(null);
  
  // Initialize canvas
  const initCanvas = (canvasElement, width, height) => {
    if (!canvasElement) return;
    
    // Dispose of existing canvas if any
    if (fabricCanvas.current) {
      fabricCanvas.current.dispose();
    }
    
    // Create new Fabric canvas
    const canvas = new fabric.Canvas(canvasElement, {
      width,
      height,
      selection: true,
      preserveObjectStacking: true
    });
    
    // Set canvas reference
    fabricCanvas.current = canvas;
    
    // Update dimensions
    setCanvasDimensions({
      width,
      height
    });
    
    // Set up selection event handlers
    canvas.on('selection:created', (e) => {
      setSelectedObject(e.selected.length === 1 ? e.selected[0] : e.selected);
    });
    
    canvas.on('selection:updated', (e) => {
      setSelectedObject(e.selected.length === 1 ? e.selected[0] : e.selected);
    });
    
    canvas.on('selection:cleared', () => {
      setSelectedObject(null);
    });
    
    return canvas;
  };
  
  // Resize canvas
  const resizeCanvas = (width, height) => {
    if (!fabricCanvas.current) return;
    
    fabricCanvas.current.setWidth(width);
    fabricCanvas.current.setHeight(height);
    fabricCanvas.current.calcOffset();
    fabricCanvas.current.renderAll();
    
    setCanvasDimensions({
      width,
      height
    });
  };
  
  // Add an object to canvas
  const addObject = (object) => {
    if (!fabricCanvas.current) return;
    
    fabricCanvas.current.add(object);
    fabricCanvas.current.renderAll();
    
    return object;
  };
  
  // Remove selected object
  const removeSelectedObject = () => {
    if (!fabricCanvas.current || !selectedObject) return;
    
    if (Array.isArray(selectedObject)) {
      selectedObject.forEach(obj => {
        fabricCanvas.current.remove(obj);
      });
    } else {
      fabricCanvas.current.remove(selectedObject);
    }
    
    fabricCanvas.current.discardActiveObject();
    fabricCanvas.current.renderAll();
    setSelectedObject(null);
  };
  
  // Clear all objects
  const clearCanvas = () => {
    if (!fabricCanvas.current) return;
    
    fabricCanvas.current.clear();
    setSelectedObject(null);
  };
  
  // Add image to canvas
  const addImage = (imageUrl, options = {}) => {
    if (!fabricCanvas.current) return Promise.reject('Canvas not initialized');
    
    return new Promise((resolve, reject) => {
      fabric.Image.fromURL(imageUrl, (img) => {
        // Apply options
        img.set({
          ...options,
          originX: 'center',
          originY: 'center',
          left: options.left || canvasDimensions.width / 2,
          top: options.top || canvasDimensions.height / 2
        });
        
        // Add to canvas
        fabricCanvas.current.add(img);
        fabricCanvas.current.setActiveObject(img);
        fabricCanvas.current.renderAll();
        
        setSelectedObject(img);
        resolve(img);
      }, (err) => {
        reject(err);
      });
    });
  };
  
  // Add text to canvas
  const addText = (text, options = {}) => {
    if (!fabricCanvas.current) {
      console.error('Canvas not initialized when adding text');
      return null;
    }
    
    // Generate a unique ID for this text object
    const id = 'text_' + Math.random().toString(36).substring(2, 15);
    
    // Default to center of canvas if no position provided
    const left = options.left !== undefined ? options.left : canvasDimensions.width / 2;
    const top = options.top !== undefined ? options.top : canvasDimensions.height / 2;
    
    console.log('Creating text object with ID:', id);
    console.log('Text position:', left, top);
    console.log('Text content:', text);
    console.log('Text styling:', {
      fontFamily: options.fontFamily || 'Arial',
      fontSize: options.fontSize || 24,
      fill: options.fill || '#000000'
    });
    
    // Create the text object with updated properties
    const textObject = new fabric.IText(text, {
      left,
      top,
      fontFamily: options.fontFamily || 'Arial',
      fontSize: options.fontSize || 24,
      fill: options.fill || '#000000',
      backgroundColor: options.backgroundColor || null,
      fontWeight: options.fontWeight || 'normal',
      fontStyle: options.fontStyle || 'normal',
      originX: options.originX || 'left',
      originY: options.originY || 'top',
      id,
      editable: true,
      selectable: true,
      hasControls: true,
      hasBorders: true,
      transparentCorners: false,
      cornerColor: '#0066cc',
      padding: 5
    });
    
    // Add the text to the canvas
    fabricCanvas.current.add(textObject);
    fabricCanvas.current.setActiveObject(textObject);
    
    // Force render to ensure visibility
    fabricCanvas.current.renderAll();
    
    console.log('Text object added to canvas:', textObject);
    
    // Update selected object
    setSelectedObject(textObject);
    
    return textObject;
  };
  
  // Add shape to canvas
  const addShape = (type, options = {}) => {
    if (!fabricCanvas.current) return null;
    
    let shapeObject;
    
    switch (type) {
      case 'rectangle':
        shapeObject = new fabric.Rect({
          left: options.left || canvasDimensions.width / 2,
          top: options.top || canvasDimensions.height / 2,
          width: options.width || 100,
          height: options.height || 50,
          fill: options.fill || 'transparent',
          stroke: options.stroke || '#000000',
          strokeWidth: options.strokeWidth || 2,
          opacity: options.opacity || 1,
          originX: 'center',
          originY: 'center'
        });
        break;
      
      case 'circle':
        shapeObject = new fabric.Circle({
          left: options.left || canvasDimensions.width / 2,
          top: options.top || canvasDimensions.height / 2,
          radius: options.radius || 50,
          fill: options.fill || 'transparent',
          stroke: options.stroke || '#000000',
          strokeWidth: options.strokeWidth || 2,
          opacity: options.opacity || 1,
          originX: 'center',
          originY: 'center'
        });
        break;
      
      case 'line':
        shapeObject = new fabric.Line([
          options.x1 || 0,
          options.y1 || 0,
          options.x2 || 100,
          options.y2 || 100
        ], {
          left: options.left || canvasDimensions.width / 2,
          top: options.top || canvasDimensions.height / 2,
          stroke: options.stroke || '#000000',
          strokeWidth: options.strokeWidth || 2,
          opacity: options.opacity || 1,
          originX: 'center',
          originY: 'center'
        });
        break;
      
      default:
        return null;
    }
    
    fabricCanvas.current.add(shapeObject);
    fabricCanvas.current.setActiveObject(shapeObject);
    fabricCanvas.current.renderAll();
    
    setSelectedObject(shapeObject);
    return shapeObject;
  };
  
  // Set drawing mode
  const setDrawingMode = (enabled, options = {}) => {
    if (!fabricCanvas.current) return;
    
    fabricCanvas.current.isDrawingMode = enabled;
    
    if (enabled) {
      fabricCanvas.current.freeDrawingBrush.color = options.color || '#000000';
      fabricCanvas.current.freeDrawingBrush.width = options.width || 2;
      fabricCanvas.current.freeDrawingBrush.opacity = options.opacity || 1;
    }
  };
  
  // Get canvas data URL
  const getCanvasDataURL = (format = 'png', quality = 1) => {
    if (!fabricCanvas.current) return null;
    
    return fabricCanvas.current.toDataURL({
      format,
      quality
    });
  };
  
  // Load objects from JSON
  const loadFromJSON = (json) => {
    if (!fabricCanvas.current) return;
    
    try {
      fabricCanvas.current.loadFromJSON(json, () => {
        fabricCanvas.current.renderAll();
      });
    } catch (err) {
      console.error('Error loading canvas from JSON:', err);
    }
  };
  
  // Get canvas JSON
  const getCanvasJSON = () => {
    if (!fabricCanvas.current) return null;
    
    return fabricCanvas.current.toJSON();
  };
  
  // Clean up
  useEffect(() => {
    return () => {
      if (fabricCanvas.current) {
        fabricCanvas.current.dispose();
      }
    };
  }, []);
  
  return {
    canvasRef,
    fabricCanvas,
    canvasDimensions,
    selectedObject,
    initCanvas,
    resizeCanvas,
    addObject,
    removeSelectedObject,
    clearCanvas,
    addImage,
    addText,
    addShape,
    setDrawingMode,
    getCanvasDataURL,
    loadFromJSON,
    getCanvasJSON
  };
};

export default useFabricCanvas;
