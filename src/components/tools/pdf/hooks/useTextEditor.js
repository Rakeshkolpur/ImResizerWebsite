import { useState, useCallback, useEffect } from 'react';
import { fabric } from 'fabric';

/**
 * Custom hook for managing text editing in the PDF editor
 * @param {fabric.Canvas} canvas - The Fabric.js canvas instance
 * @param {Object} settings - User settings for text editing
 * @returns {Object} - Text editing state and methods
 */
const useTextEditor = (canvas, settings = {}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentTextObject, setCurrentTextObject] = useState(null);
  const [textProperties, setTextProperties] = useState({
    fontFamily: 'Arial',
    fontSize: 20,
    fontWeight: 'normal',
    fontStyle: 'normal',
    underline: false,
    textAlign: 'left',
    fill: '#000000',
    backgroundColor: 'transparent'
  });
  
  // Default font families
  const defaultFonts = [
    { label: 'Arial', value: 'Arial' },
    { label: 'Times New Roman', value: 'Times New Roman' },
    { label: 'Courier New', value: 'Courier New' },
    { label: 'Georgia', value: 'Georgia' },
    { label: 'Verdana', value: 'Verdana' },
    { label: 'Helvetica', value: 'Helvetica' }
  ];
  
  // Initialize text properties from settings
  useEffect(() => {
    if (settings) {
      setTextProperties(prev => ({
        ...prev,
        fontFamily: settings.defaultFontFamily || prev.fontFamily,
        fontSize: settings.defaultFontSize || prev.fontSize,
        fill: settings.defaultTextColor || prev.fill
      }));
    }
  }, [settings]);
  
  /**
   * Update text properties from a text object
   * @param {fabric.Object} textObj - Text object to get properties from
   */
  const updateTextPropertiesFromObject = useCallback((textObj) => {
    if (!textObj) return;
    
    setTextProperties({
      fontFamily: textObj.fontFamily || 'Arial',
      fontSize: textObj.fontSize || 20,
      fontWeight: textObj.fontWeight || 'normal',
      fontStyle: textObj.fontStyle || 'normal',
      underline: textObj.underline || false,
      textAlign: textObj.textAlign || 'left',
      fill: textObj.fill || '#000000',
      backgroundColor: textObj.backgroundColor || 'transparent'
    });
  }, []);
  
  /**
   * Start editing a text object
   * @param {fabric.Object} textObj - Text object to edit
   */
  const startEditing = useCallback((textObj) => {
    if (!textObj || !canvas) return;
    
    setCurrentTextObject(textObj);
    updateTextPropertiesFromObject(textObj);
    setIsEditing(true);
    
    // Set the object as the active object on the canvas
    canvas.setActiveObject(textObj);
    canvas.renderAll();
  }, [canvas, updateTextPropertiesFromObject]);
  
  /**
   * Stop editing the current text object
   */
  const stopEditing = useCallback(() => {
    setCurrentTextObject(null);
    setIsEditing(false);
    
    // Refresh the canvas
    if (canvas) {
      canvas.renderAll();
    }
  }, [canvas]);
  
  /**
   * Create a new text object on the canvas
   * @param {string} text - Initial text content
   * @param {Object} options - Additional options for the text object
   * @returns {fabric.IText} - The created text object
   */
  const createTextObject = useCallback((text = 'Text', options = {}) => {
    if (!canvas) return null;
    
    // Create a new IText object with current text properties
    const textObj = new fabric.IText(text, {
      fontFamily: textProperties.fontFamily,
      fontSize: textProperties.fontSize,
      fontWeight: textProperties.fontWeight,
      fontStyle: textProperties.fontStyle,
      underline: textProperties.underline,
      textAlign: textProperties.textAlign,
      fill: textProperties.fill,
      backgroundColor: textProperties.backgroundColor,
      left: options.left || 100,
      top: options.top || 100,
      padding: 5,
      cornerSize: 8,
      transparentCorners: false,
      ...options
    });
    
    // Add the text object to the canvas
    canvas.add(textObj);
    canvas.setActiveObject(textObj);
    canvas.renderAll();
    
    // Set the current text object
    setCurrentTextObject(textObj);
    
    return textObj;
  }, [canvas, textProperties]);
  
  /**
   * Apply formatting to the current text object
   * @param {Object} properties - Text properties to apply
   */
  const applyFormatting = useCallback((properties) => {
    if (!currentTextObject || !canvas) return;
    
    // Update the text object with new properties
    currentTextObject.set(properties);
    
    // Update text properties state
    setTextProperties(prev => ({
      ...prev,
      ...properties
    }));
    
    // Refresh the canvas
    canvas.renderAll();
  }, [canvas, currentTextObject]);
  
  /**
   * Toggle a boolean text property (bold, italic, underline)
   * @param {string} property - Property name to toggle
   */
  const toggleTextProperty = useCallback((property) => {
    if (!currentTextObject || !canvas) return;
    
    let propertyToSet;
    let propertyValue;
    
    switch (property) {
      case 'bold':
        propertyToSet = 'fontWeight';
        propertyValue = textProperties.fontWeight === 'bold' ? 'normal' : 'bold';
        break;
        
      case 'italic':
        propertyToSet = 'fontStyle';
        propertyValue = textProperties.fontStyle === 'italic' ? 'normal' : 'italic';
        break;
        
      case 'underline':
        propertyToSet = 'underline';
        propertyValue = !textProperties.underline;
        break;
        
      default:
        return;
    }
    
    // Update the text object
    currentTextObject.set({ [propertyToSet]: propertyValue });
    
    // Update text properties state
    setTextProperties(prev => ({
      ...prev,
      [propertyToSet]: propertyValue
    }));
    
    // Refresh the canvas
    canvas.renderAll();
  }, [canvas, currentTextObject, textProperties]);
  
  /**
   * Set the text alignment
   * @param {string} alignment - Alignment value ('left', 'center', 'right', 'justify')
   */
  const setTextAlignment = useCallback((alignment) => {
    if (!currentTextObject || !canvas) return;
    
    // Update the text object
    currentTextObject.set({ textAlign: alignment });
    
    // Update text properties state
    setTextProperties(prev => ({
      ...prev,
      textAlign: alignment
    }));
    
    // Refresh the canvas
    canvas.renderAll();
  }, [canvas, currentTextObject]);
  
  /**
   * Set the font family
   * @param {string} fontFamily - Font family name
   */
  const setFontFamily = useCallback((fontFamily) => {
    if (!currentTextObject || !canvas) return;
    
    // Update the text object
    currentTextObject.set({ fontFamily });
    
    // Update text properties state
    setTextProperties(prev => ({
      ...prev,
      fontFamily
    }));
    
    // Refresh the canvas
    canvas.renderAll();
  }, [canvas, currentTextObject]);
  
  /**
   * Set the font size
   * @param {number} fontSize - Font size in pixels
   */
  const setFontSize = useCallback((fontSize) => {
    if (!currentTextObject || !canvas) return;
    
    // Update the text object
    currentTextObject.set({ fontSize });
    
    // Update text properties state
    setTextProperties(prev => ({
      ...prev,
      fontSize
    }));
    
    // Refresh the canvas
    canvas.renderAll();
  }, [canvas, currentTextObject]);
  
  /**
   * Set the text color
   * @param {string} color - Text color (CSS color value)
   */
  const setTextColor = useCallback((color) => {
    if (!currentTextObject || !canvas) return;
    
    // Update the text object
    currentTextObject.set({ fill: color });
    
    // Update text properties state
    setTextProperties(prev => ({
      ...prev,
      fill: color
    }));
    
    // Refresh the canvas
    canvas.renderAll();
  }, [canvas, currentTextObject]);
  
  /**
   * Set the background color
   * @param {string} color - Background color (CSS color value)
   */
  const setBackgroundColor = useCallback((color) => {
    if (!currentTextObject || !canvas) return;
    
    // Update the text object
    currentTextObject.set({ backgroundColor: color });
    
    // Update text properties state
    setTextProperties(prev => ({
      ...prev,
      backgroundColor: color
    }));
    
    // Refresh the canvas
    canvas.renderAll();
  }, [canvas, currentTextObject]);
  
  return {
    isEditing,
    currentTextObject,
    textProperties,
    defaultFonts,
    startEditing,
    stopEditing,
    createTextObject,
    applyFormatting,
    toggleTextProperty,
    setTextAlignment,
    setFontFamily,
    setFontSize,
    setTextColor,
    setBackgroundColor
  };
};

export default useTextEditor;
