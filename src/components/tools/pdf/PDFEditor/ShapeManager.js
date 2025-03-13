import { fabric } from 'fabric';

/**
 * ShapeManager class for handling all shape-related operations in the PDF editor
 * Responsible for creating, manipulating, and managing shapes on the canvas
 */
export class ShapeManager {
  constructor({ canvas, addToUndoStack }) {
    this.canvas = canvas;
    this.addToUndoStack = addToUndoStack;
    
    this.isDrawingShape = false;
    this.currentShapeType = null;
    this.drawStartPoint = null;
    this.tempShapeObj = null;
    
    // Default shape options
    this.shapeOptions = {
      fill: 'transparent',
      stroke: '#ff0000',
      strokeWidth: 2,
      opacity: 1,
      selectable: true,
      hasControls: true,
      hasBorders: true
    };
  }
  
  /**
   * Set the shape type to be drawn
   * @param {string} shapeType - The type of shape to draw ('rect', 'circle', 'line', 'arrow', etc.)
   */
  setShapeType(shapeType) {
    this.currentShapeType = shapeType;
  }
  
  /**
   * Set the options for shapes
   * @param {Object} options - Shape options (fill, stroke, strokeWidth, etc.)
   */
  setShapeOptions(options) {
    this.shapeOptions = { ...this.shapeOptions, ...options };
  }
  
  /**
   * Start drawing a shape
   * @param {Object} pointer - The pointer position { x, y }
   */
  startDrawingShape(pointer) {
    if (!this.canvas || !this.currentShapeType) return;
    
    this.isDrawingShape = true;
    this.drawStartPoint = pointer;
    
    // Create a temporary shape based on the current shape type
    let tempShape;
    
    switch (this.currentShapeType) {
      case 'rect':
        tempShape = new fabric.Rect({
          ...this.shapeOptions,
          left: pointer.x,
          top: pointer.y,
          width: 0,
          height: 0
        });
        break;
        
      case 'circle':
        tempShape = new fabric.Circle({
          ...this.shapeOptions,
          left: pointer.x,
          top: pointer.y,
          radius: 0
        });
        break;
        
      case 'line':
        tempShape = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
          ...this.shapeOptions
        });
        break;
        
      case 'arrow':
        // Arrow is a custom shape made of a line and a triangle
        const points = [pointer.x, pointer.y, pointer.x, pointer.y];
        tempShape = this.createArrow(points, this.shapeOptions);
        break;
        
      default:
        break;
    }
    
    if (tempShape) {
      this.tempShapeObj = tempShape;
      this.canvas.add(tempShape);
      this.canvas.renderAll();
    }
  }
  
  /**
   * Update the shape while drawing
   * @param {Object} pointer - The current pointer position { x, y }
   */
  updateDrawingShape(pointer) {
    if (!this.isDrawingShape || !this.tempShapeObj || !this.drawStartPoint) return;
    
    const startX = this.drawStartPoint.x;
    const startY = this.drawStartPoint.y;
    const width = pointer.x - startX;
    const height = pointer.y - startY;
    
    // Update the shape based on the current shape type
    switch (this.currentShapeType) {
      case 'rect':
        // For rectangle, update width and height
        this.tempShapeObj.set({
          width: Math.abs(width),
          height: Math.abs(height),
          left: width > 0 ? startX : pointer.x,
          top: height > 0 ? startY : pointer.y
        });
        break;
        
      case 'circle':
        // For circle, update radius
        const radius = Math.sqrt(width * width + height * height) / 2;
        this.tempShapeObj.set({
          radius: radius,
          left: startX - radius + width / 2,
          top: startY - radius + height / 2
        });
        break;
        
      case 'line':
        // For line, update end point
        this.tempShapeObj.set({
          x2: pointer.x,
          y2: pointer.y
        });
        break;
        
      case 'arrow':
        // For arrow, update the line and arrowhead
        this.canvas.remove(this.tempShapeObj);
        const points = [startX, startY, pointer.x, pointer.y];
        this.tempShapeObj = this.createArrow(points, this.shapeOptions);
        this.canvas.add(this.tempShapeObj);
        break;
        
      default:
        break;
    }
    
    this.canvas.renderAll();
  }
  
  /**
   * Finish drawing the shape
   */
  finishDrawingShape() {
    if (!this.isDrawingShape || !this.tempShapeObj) return;
    
    // Finalize the shape
    this.tempShapeObj.setCoords();
    
    // Add the action to the undo stack
    this.addToUndoStack({
      type: 'add',
      object: this.tempShapeObj
    });
    
    // Reset drawing state
    this.isDrawingShape = false;
    this.drawStartPoint = null;
    this.tempShapeObj = null;
    
    // Render the canvas
    this.canvas.renderAll();
  }
  
  /**
   * Cancel drawing the shape
   */
  cancelDrawingShape() {
    if (!this.isDrawingShape || !this.tempShapeObj) return;
    
    // Remove the temporary shape
    this.canvas.remove(this.tempShapeObj);
    
    // Reset drawing state
    this.isDrawingShape = false;
    this.drawStartPoint = null;
    this.tempShapeObj = null;
    
    // Render the canvas
    this.canvas.renderAll();
  }
  
  /**
   * Create an arrow shape
   * @param {Array} points - The points of the arrow [x1, y1, x2, y2]
   * @param {Object} options - Shape options
   * @returns {fabric.Group} - The arrow shape as a fabric.js group
   */
  createArrow(points, options) {
    const [x1, y1, x2, y2] = points;
    
    // Create the line
    const line = new fabric.Line(points, {
      ...options,
      selectable: false
    });
    
    // Calculate the angle of the line
    const angle = Math.atan2(y2 - y1, x2 - x1);
    
    // Create the arrowhead
    const headLength = 15;
    const headWidth = 10;
    
    // Calculate the points for the arrowhead
    const arrowPoints = [
      { x: 0, y: 0 },
      { x: -headLength, y: headWidth / 2 },
      { x: -headLength, y: -headWidth / 2 }
    ];
    
    // Create the arrowhead polygon
    const arrowHead = new fabric.Polygon(arrowPoints, {
      ...options,
      fill: options.stroke,
      left: x2,
      top: y2,
      angle: angle * (180 / Math.PI),
      selectable: false
    });
    
    // Create a group for the arrow
    const arrow = new fabric.Group([line, arrowHead], {
      left: Math.min(x1, x2),
      top: Math.min(y1, y2),
      selectable: true,
      hasControls: true,
      hasBorders: true
    });
    
    return arrow;
  }
  
  /**
   * Add a pre-defined shape to the canvas
   * @param {string} shapeType - The type of shape to add
   * @param {Object} options - Shape options and position
   */
  addShape(shapeType, options = {}) {
    if (!this.canvas) return;
    
    const shapeOptions = { ...this.shapeOptions, ...options };
    
    let shape;
    
    // Create a shape based on the shape type
    switch (shapeType) {
      case 'rect':
        shape = new fabric.Rect({
          ...shapeOptions,
          width: options.width || 100,
          height: options.height || 50
        });
        break;
        
      case 'circle':
        shape = new fabric.Circle({
          ...shapeOptions,
          radius: options.radius || 50
        });
        break;
        
      case 'triangle':
        shape = new fabric.Triangle({
          ...shapeOptions,
          width: options.width || 100,
          height: options.height || 100
        });
        break;
        
      case 'line':
        const x1 = options.x1 || options.left || 0;
        const y1 = options.y1 || options.top || 0;
        const x2 = options.x2 || x1 + 100;
        const y2 = options.y2 || y1;
        
        shape = new fabric.Line([x1, y1, x2, y2], {
          ...shapeOptions
        });
        break;
        
      case 'arrow':
        const startX = options.x1 || options.left || 0;
        const startY = options.y1 || options.top || 0;
        const endX = options.x2 || startX + 100;
        const endY = options.y2 || startY;
        
        shape = this.createArrow([startX, startY, endX, endY], shapeOptions);
        break;
        
      default:
        break;
    }
    
    if (shape) {
      // Add the shape to the canvas
      this.canvas.add(shape);
      
      // Add the action to the undo stack
      this.addToUndoStack({
        type: 'add',
        object: shape
      });
      
      // Render the canvas
      this.canvas.renderAll();
      
      return shape;
    }
    
    return null;
  }
}

export default ShapeManager; 