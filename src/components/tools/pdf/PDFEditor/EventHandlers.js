/**
 * EventHandlers class for handling various events in the PDF editor
 * Manages mouse, keyboard, and other interactions
 */
export class EventHandlers {
  constructor({ canvas, addToUndoStack, createTextObject, setTextEditorVisible, setTextEditorPosition }) {
    this.canvas = canvas;
    this.addToUndoStack = addToUndoStack;
    this.createTextObject = createTextObject;
    this.setTextEditorVisible = setTextEditorVisible;
    this.setTextEditorPosition = setTextEditorPosition;
    
    // Bind event handlers to maintain 'this' context
    this.handleObjectModified = this.handleObjectModified.bind(this);
    this.handleObjectAdded = this.handleObjectAdded.bind(this);
    this.handleObjectRemoved = this.handleObjectRemoved.bind(this);
    this.handleSelectionCreated = this.handleSelectionCreated.bind(this);
    this.handleSelectionCleared = this.handleSelectionCleared.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleDoubleClick = this.handleDoubleClick.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    
    // Initialize event listeners
    this.initEventListeners();
  }
  
  /**
   * Initialize event listeners for the canvas
   */
  initEventListeners() {
    if (!this.canvas) return;
    
    // Add canvas event listeners
    this.canvas.on('object:modified', this.handleObjectModified);
    this.canvas.on('object:added', this.handleObjectAdded);
    this.canvas.on('object:removed', this.handleObjectRemoved);
    this.canvas.on('selection:created', this.handleSelectionCreated);
    this.canvas.on('selection:cleared', this.handleSelectionCleared);
    this.canvas.on('mouse:down', this.handleMouseDown);
    this.canvas.on('mouse:move', this.handleMouseMove);
    this.canvas.on('mouse:up', this.handleMouseUp);
    
    // Add window event listeners
    window.addEventListener('keydown', this.handleKeyDown);
    
    // Add double click handler to canvas element
    if (this.canvas.wrapperEl) {
      this.canvas.wrapperEl.addEventListener('dblclick', this.handleDoubleClick);
    }
  }
  
  /**
   * Remove all event listeners
   */
  removeEventListeners() {
    if (!this.canvas) return;
    
    // Remove canvas event listeners
    this.canvas.off('object:modified', this.handleObjectModified);
    this.canvas.off('object:added', this.handleObjectAdded);
    this.canvas.off('object:removed', this.handleObjectRemoved);
    this.canvas.off('selection:created', this.handleSelectionCreated);
    this.canvas.off('selection:cleared', this.handleSelectionCleared);
    this.canvas.off('mouse:down', this.handleMouseDown);
    this.canvas.off('mouse:move', this.handleMouseMove);
    this.canvas.off('mouse:up', this.handleMouseUp);
    
    // Remove window event listeners
    window.removeEventListener('keydown', this.handleKeyDown);
    
    // Remove double click handler from canvas element
    if (this.canvas.wrapperEl) {
      this.canvas.wrapperEl.removeEventListener('dblclick', this.handleDoubleClick);
    }
  }
  
  /**
   * Handle object modified event
   * @param {Object} e - Event object
   */
  handleObjectModified(e) {
    const target = e.target;
    if (!target) return;
    
    // Add to undo stack
    this.addToUndoStack({
      type: 'modify',
      object: target,
      state: target.toJSON()
    });
  }
  
  /**
   * Handle object added event
   * @param {Object} e - Event object
   */
  handleObjectAdded(e) {
    const target = e.target;
    if (!target) return;
    
    // Skip if the object is being created programmatically
    if (target._skipHistory) {
      delete target._skipHistory;
      return;
    }
    
    // Add to undo stack
    this.addToUndoStack({
      type: 'add',
      object: target
    });
  }
  
  /**
   * Handle object removed event
   * @param {Object} e - Event object
   */
  handleObjectRemoved(e) {
    const target = e.target;
    if (!target) return;
    
    // Skip if the object is being removed programmatically
    if (target._skipHistory) {
      delete target._skipHistory;
      return;
    }
    
    // Add to undo stack
    this.addToUndoStack({
      type: 'remove',
      object: target,
      state: target.toJSON()
    });
  }
  
  /**
   * Handle selection created event
   * @param {Object} e - Event object
   */
  handleSelectionCreated(e) {
    const selection = e.selected;
    if (!selection || selection.length === 0) return;
    
    // Do something with the selection if needed
  }
  
  /**
   * Handle selection cleared event
   * @param {Object} e - Event object
   */
  handleSelectionCleared(e) {
    // Handle selection cleared if needed
  }
  
  /**
   * Handle mouse down event
   * @param {Object} e - Event object
   */
  handleMouseDown(e) {
    // Handle mouse down events
    // Often used for starting drawing operations
  }
  
  /**
   * Handle mouse move event
   * @param {Object} e - Event object
   */
  handleMouseMove(e) {
    // Handle mouse move events
    // Often used for updating drawing operations
  }
  
  /**
   * Handle mouse up event
   * @param {Object} e - Event object
   */
  handleMouseUp(e) {
    // Handle mouse up events
    // Often used for completing drawing operations
  }
  
  /**
   * Handle double click event
   * @param {Object} e - Event object
   */
  handleDoubleClick(e) {
    // Get the canvas mouse position
    const canvasEl = this.canvas.getElement();
    const pointer = this.canvas.getPointer(e);
    
    // Find if there's a text object at the click position
    const clickedObject = this.canvas.findTarget(e, false);
    
    if (clickedObject && clickedObject.type === 'text' || clickedObject?.type === 'textbox') {
      // Text object clicked, open text editor
      this.showTextEditor(clickedObject, e);
    } else {
      // No text object, create a new one at the click position
      const newText = this.createTextObject('Text', {
        left: pointer.x,
        top: pointer.y
      });
      
      // Set the object as active
      this.canvas.setActiveObject(newText);
      
      // Show text editor for the new text
      this.showTextEditor(newText, e);
    }
  }
  
  /**
   * Handle key down event
   * @param {Object} e - Event object
   */
  handleKeyDown(e) {
    // Handle keyboard shortcuts
    if (!this.canvas) return;
    
    // Check if the active element is not an input or textarea
    const activeElement = document.activeElement;
    const isEditingText = activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA';
    
    if (isEditingText) return;
    
    // Get the active object
    const activeObject = this.canvas.getActiveObject();
    
    // Handle different key presses
    switch (e.key) {
      case 'Delete':
      case 'Backspace':
        // Delete selected objects
        if (activeObject) {
          if (activeObject.type === 'activeSelection') {
            // Group of objects
            const objects = activeObject.getObjects();
            activeObject.destroy();
            objects.forEach(obj => {
              this.canvas.remove(obj);
            });
          } else {
            // Single object
            this.canvas.remove(activeObject);
          }
          this.canvas.discardActiveObject();
          this.canvas.renderAll();
          e.preventDefault();
        }
        break;
        
      case 'Escape':
        // Cancel selection
        this.canvas.discardActiveObject();
        this.canvas.renderAll();
        e.preventDefault();
        break;
        
      case 'z':
        // Undo
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
          // Handle undo
          e.preventDefault();
        }
        break;
        
      case 'y':
      case 'Z':
        // Redo
        if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.shiftKey)) {
          // Handle redo
          e.preventDefault();
        }
        break;
        
      case 'a':
        // Select all
        if (e.ctrlKey || e.metaKey) {
          const objects = this.canvas.getObjects();
          if (objects.length > 0) {
            const selection = new fabric.ActiveSelection(objects, {
              canvas: this.canvas
            });
            this.canvas.setActiveObject(selection);
            this.canvas.renderAll();
          }
          e.preventDefault();
        }
        break;
        
      default:
        break;
    }
  }
  
  /**
   * Show text editor for a text object
   * @param {Object} textObj - Text object
   * @param {Object} e - Event object
   */
  showTextEditor(textObj, e) {
    if (!textObj || !this.canvas) return;
    
    // Calculate the position of the text editor
    let left, top;
    
    if (e) {
      // Use the event position
      const boundingRect = this.canvas.wrapperEl.getBoundingClientRect();
      left = e.clientX - boundingRect.left;
      top = e.clientY - boundingRect.top;
    } else {
      // Use the object position
      const boundingRect = textObj.getBoundingRect();
      left = boundingRect.left + boundingRect.width / 2;
      top = boundingRect.top + boundingRect.height / 2;
    }
    
    // Ensure the text editor is visible within the viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate bounds to keep the editor in view
    const editorWidth = 400; // Estimated width
    const editorHeight = 300; // Estimated height
    
    if (left + editorWidth > viewportWidth) {
      left = viewportWidth - editorWidth - 20;
    }
    
    if (top + editorHeight > viewportHeight) {
      top = viewportHeight - editorHeight - 20;
    }
    
    // Set the position of the text editor
    this.setTextEditorPosition({ left, top });
    
    // Show the text editor
    this.setTextEditorVisible(true);
  }
  
  /**
   * Dispose the event handlers
   */
  dispose() {
    this.removeEventListeners();
  }
}

export default EventHandlers; 