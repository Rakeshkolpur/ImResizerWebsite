import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import styles from '../PDFEditor.module.css';
import { AVAILABLE_FONTS, FONT_SIZES } from '../utils/constants';

/**
 * TextEditor component for editing text properties
 */
const TextEditor = ({ 
  selectedObject, 
  fabricCanvas, 
  isVisible = false 
}) => {
  const [options, setOptions] = useState({
    font: 'Arial',
    size: 24,
    color: '#000000',
    backgroundColor: '',
    fontWeight: 'normal',
    fontStyle: 'normal'
  });

  // Update editor options when selected text changes
  useEffect(() => {
    if (selectedObject && selectedObject.type === 'i-text') {
      setOptions({
        font: selectedObject.fontFamily || 'Arial',
        size: selectedObject.fontSize || 24,
        color: selectedObject.fill || '#000000',
        backgroundColor: selectedObject.backgroundColor || '',
        fontWeight: selectedObject.fontWeight || 'normal',
        fontStyle: selectedObject.fontStyle || 'normal'
      });
      console.log('Updated text editor with selected object properties:', selectedObject);
    }
  }, [selectedObject]);

  // Apply changes to the selected text object
  const applyChangeToSelectedText = (property, value) => {
    if (!selectedObject || !fabricCanvas || !fabricCanvas.current) {
      console.error('Cannot apply text change: Missing object or canvas');
      return;
    }

    // Map editor property names to fabric.js property names
    const propertyMap = {
      font: 'fontFamily',
      size: 'fontSize',
      color: 'fill',
      backgroundColor: 'backgroundColor',
      fontWeight: 'fontWeight',
      fontStyle: 'fontStyle'
    };

    const fabricProperty = propertyMap[property];
    if (!fabricProperty) {
      console.error(`Unknown property: ${property}`);
      return;
    }

    // Apply the change
    selectedObject.set(fabricProperty, value);
    
    // Render the canvas to show changes
    fabricCanvas.current.renderAll();
    
    console.log(`Applied ${fabricProperty}=${value} to text object:`, selectedObject);
  };

  // Handle font family change
  const handleFontFamilyChange = (e) => {
    const newValue = e.target.value;
    setOptions({
      ...options,
      font: newValue
    });
    applyChangeToSelectedText('font', newValue);
  };

  // Handle font size change
  const handleFontSizeChange = (e) => {
    const newValue = parseInt(e.target.value, 10);
    setOptions({
      ...options,
      size: newValue
    });
    applyChangeToSelectedText('size', newValue);
  };

  // Handle color change
  const handleColorChange = (e) => {
    const newValue = e.target.value;
    setOptions({
      ...options,
      color: newValue
    });
    applyChangeToSelectedText('color', newValue);
  };

  // Handle background color change
  const handleBackgroundColorChange = (e) => {
    const newValue = e.target.value;
    setOptions({
      ...options,
      backgroundColor: newValue
    });
    applyChangeToSelectedText('backgroundColor', newValue);
  };

  // Handle clearing background color
  const handleClearBackgroundColor = () => {
    setOptions({
      ...options,
      backgroundColor: null
    });
    applyChangeToSelectedText('backgroundColor', null);
  };

  // Handle font weight toggle
  const handleBoldToggle = () => {
    const newValue = options.fontWeight === 'bold' ? 'normal' : 'bold';
    setOptions({
      ...options,
      fontWeight: newValue
    });
    applyChangeToSelectedText('fontWeight', newValue);
  };

  // Handle font style toggle
  const handleItalicToggle = () => {
    const newValue = options.fontStyle === 'italic' ? 'normal' : 'italic';
    setOptions({
      ...options,
      fontStyle: newValue
    });
    applyChangeToSelectedText('fontStyle', newValue);
  };

  // If not visible or no text selected, don't render
  if (!isVisible || !selectedObject || selectedObject.type !== 'i-text') {
    console.log('TextEditor not rendering:', { isVisible, hasSelectedObject: !!selectedObject });
    return null;
  }
  
  console.log('TextEditor rendering with:', { 
    selectedObject: selectedObject.id,
    type: selectedObject.type,
    fontFamily: selectedObject.fontFamily,
    fontSize: selectedObject.fontSize
  });

  return (
    <div className={styles.textEditor}>
      <div className={styles.textEditorHeader}>
        <h3>Text Properties</h3>
        <button 
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
      </div>
      
      <div className={styles.textEditorContent}>
        {/* Font Family */}
        <div className={styles.controlGroup}>
          <label htmlFor="font-family" className={styles.label}>Font</label>
          <select
            id="font-family"
            value={options.font}
            onChange={handleFontFamilyChange}
            className={styles.select}
          >
            {AVAILABLE_FONTS.map(font => (
              <option key={font} value={font}>{font}</option>
            ))}
          </select>
        </div>
        
        {/* Font Size */}
        <div className={styles.controlGroup}>
          <label htmlFor="font-size" className={styles.label}>Size</label>
          <select
            id="font-size"
            value={options.size}
            onChange={handleFontSizeChange}
            className={styles.select}
          >
            {FONT_SIZES.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
        
        {/* Text Color */}
        <div className={styles.controlGroup}>
          <label htmlFor="text-color" className={styles.label}>Text Color</label>
          <input
            id="text-color"
            type="color"
            value={options.color}
            onChange={handleColorChange}
            className={styles.colorInput}
          />
        </div>
        
        {/* Background Color */}
        <div className={styles.controlGroup}>
          <label htmlFor="background-color" className={styles.label}>Background</label>
          <div className={styles.colorInputWrapper}>
            <input
              id="background-color"
              type="color"
              value={options.backgroundColor || '#ffffff'}
              onChange={handleBackgroundColorChange}
              className={styles.colorInput}
            />
            <button
              onClick={handleClearBackgroundColor}
              className={styles.smallButton}
              title="Remove background"
            >
              Clear
            </button>
          </div>
        </div>
        
        {/* Font Styles */}
        <div className={styles.controlGroup}>
          <label className={styles.label}>Style</label>
          <div className={styles.buttonGroup}>
            <button
              onClick={handleBoldToggle}
              className={`${styles.styleButton} ${options.fontWeight === 'bold' ? styles.active : ''}`}
              title="Bold"
            >
              B
            </button>
            <button
              onClick={handleItalicToggle}
              className={`${styles.styleButton} ${options.fontStyle === 'italic' ? styles.active : ''}`}
              title="Italic"
            >
              I
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

TextEditor.propTypes = {
  /** Text formatting options */
  options: PropTypes.shape({
    font: PropTypes.string.isRequired,
    size: PropTypes.number.isRequired,
    color: PropTypes.string.isRequired,
    backgroundColor: PropTypes.string,
    fontWeight: PropTypes.oneOf(['normal', 'bold']).isRequired,
    fontStyle: PropTypes.oneOf(['normal', 'italic']).isRequired
  }).isRequired,
  /** Callback for option changes */
  onOptionsChange: PropTypes.func.isRequired,
  /** Callback for closing the editor */
  onClose: PropTypes.func.isRequired,
  /** Currently selected object */
  selectedObject: PropTypes.object,
  /** Reference to the fabric canvas */
  fabricCanvas: PropTypes.object
};

export default TextEditor; 