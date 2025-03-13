/**
 * ToolModeManager class for handling tool mode selection and configuration
 * Manages the active tool mode and related settings for the PDF editor
 */
export class ToolModeManager {
  constructor({ canvas, setDrawingModeEnabled, setActiveToolMode }) {
    this.canvas = canvas;
    this.setDrawingModeEnabled = setDrawingModeEnabled;
    this.setActiveToolMode = setActiveToolMode;
    
    // Available tool modes
    this.toolModes = {
      cursor: {
        id: 'cursor',
        drawingMode: false,
        cursorStyle: 'default',
        selectable: true
      },
      text: {
        id: 'text',
        drawingMode: false,
        cursorStyle: 'text',
        selectable: false
      },
      draw: {
        id: 'draw',
        drawingMode: true,
        cursorStyle: 'crosshair',
        selectable: false
      },
      shape: {
        id: 'shape',
        drawingMode: false,
        cursorStyle: 'crosshair',
        selectable: false
      },
      image: {
        id: 'image',
        drawingMode: false,
        cursorStyle: 'default',
        selectable: false
      },
      highlight: {
        id: 'highlight',
        drawingMode: true,
        cursorStyle: 'crosshair',
        selectable: false
      },
      stamp: {
        id: 'stamp',
        drawingMode: false,
        cursorStyle: 'default',
        selectable: false
      },
      eraser: {
        id: 'eraser',
        drawingMode: false,
        cursorStyle: 'not-allowed',
        selectable: true
      },
      comment: {
        id: 'comment',
        drawingMode: false,
        cursorStyle: 'default',
        selectable: false
      },
      signature: {
        id: 'signature',
        drawingMode: false,
        cursorStyle: 'default',
        selectable: false
      }
    };
    
    // Current active tool mode
    this.activeToolMode = 'cursor';
    
    // Drawing options for brush
    this.drawingOptions = {
      color: '#000000',
      width: 2,
      decayRate: 0.2
    };
    
    // Initialize the canvas selection mode
    if (this.canvas) {
      this.canvas.selection = true;
    }
  }
  
  /**
   * Set the active tool mode
   * @param {string} toolId - The ID of the tool to activate
   */
  setToolMode(toolId) {
    // If the tool mode doesn't exist, return
    if (!this.toolModes[toolId]) {
      console.warn(`Tool mode "${toolId}" not found`);
      return;
    }
    
    // Get the tool mode config
    const toolMode = this.toolModes[toolId];
    
    // Update active tool mode
    this.activeToolMode = toolId;
    
    // Update the external state
    this.setActiveToolMode(toolId);
    
    // If canvas exists, update canvas settings
    if (this.canvas) {
      // Set drawing mode
      this.setDrawingModeEnabled(toolMode.drawingMode);
      
      // Set selection mode
      this.canvas.selection = toolMode.selectable;
      
      // Set selectable property for all objects
      this.canvas.getObjects().forEach(obj => {
        obj.selectable = toolMode.selectable;
        obj.setCoords();
      });
      
      // Set cursor style
      this.canvas.defaultCursor = toolMode.cursorStyle;
      
      // Configure tool-specific settings
      this.configureToolSettings(toolId);
      
      // Render the canvas
      this.canvas.renderAll();
    }
    
    return toolId;
  }
  
  /**
   * Configure tool-specific settings
   * @param {string} toolId - The ID of the tool
   */
  configureToolSettings(toolId) {
    if (!this.canvas) return;
    
    // Configure settings based on the tool
    switch (toolId) {
      case 'draw':
        // Set free drawing brush
        this.canvas.freeDrawingBrush.color = this.drawingOptions.color;
        this.canvas.freeDrawingBrush.width = this.drawingOptions.width;
        this.canvas.freeDrawingBrush.decayWidth = this.drawingOptions.decayRate > 0;
        this.canvas.freeDrawingBrush.decayRate = this.drawingOptions.decayRate;
        break;
        
      case 'highlight':
        // Set highlight brush (wider, semi-transparent)
        this.canvas.freeDrawingBrush.color = 'rgba(255, 255, 0, 0.4)';
        this.canvas.freeDrawingBrush.width = 20;
        this.canvas.freeDrawingBrush.decayWidth = false;
        break;
        
      case 'eraser':
        // Set eraser mode
        this.configureEraserMode();
        break;
        
      default:
        break;
    }
  }
  
  /**
   * Set the drawing options
   * @param {Object} options - Drawing options (color, width, decayRate)
   */
  setDrawingOptions(options) {
    this.drawingOptions = { ...this.drawingOptions, ...options };
    
    // If draw mode is active, update the brush
    if (this.activeToolMode === 'draw' && this.canvas) {
      this.canvas.freeDrawingBrush.color = this.drawingOptions.color;
      this.canvas.freeDrawingBrush.width = this.drawingOptions.width;
      this.canvas.freeDrawingBrush.decayWidth = this.drawingOptions.decayRate > 0;
      this.canvas.freeDrawingBrush.decayRate = this.drawingOptions.decayRate;
    }
  }
  
  /**
   * Configure eraser mode
   */
  configureEraserMode() {
    // Set cursor style
    this.canvas.hoverCursor = 'not-allowed';
    
    // Make objects selectable for deletion
    this.canvas.getObjects().forEach(obj => {
      obj.selectable = true;
      
      // Store original stroke and fill
      obj._originalStroke = obj.stroke;
      obj._originalFill = obj.fill;
      
      // Add a border to show it's deletable
      obj.set({
        borderColor: 'red',
        cornerColor: 'red'
      });
    });
  }
  
  /**
   * Reset to default tool mode (cursor)
   */
  resetToolMode() {
    this.setToolMode('cursor');
  }
  
  /**
   * Get the current active tool mode
   * @returns {string} - The ID of the current active tool mode
   */
  getActiveToolMode() {
    return this.activeToolMode;
  }
  
  /**
   * Check if a tool is active
   * @param {string} toolId - The ID of the tool to check
   * @returns {boolean} - True if the tool is active
   */
  isToolActive(toolId) {
    return this.activeToolMode === toolId;
  }
}

export default ToolModeManager; 