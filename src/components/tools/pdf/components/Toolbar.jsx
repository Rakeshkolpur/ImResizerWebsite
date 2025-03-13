import React from 'react';
import PropTypes from 'prop-types';
import {
  FaArrowsAlt, FaFont, FaPenNib, FaDrawPolygon,
  FaImage, FaHighlighter, FaStamp, FaEraser,
  FaRegComment, FaSignature, FaUndo, FaRedo,
  FaSave, FaUpload, FaDownload, FaCog
} from 'react-icons/fa';

/**
 * Toolbar component for the PDF editor
 */
const Toolbar = ({
  activeToolMode,
  onToolSelect,
  onUndo,
  onRedo,
  onSave,
  onUpload,
  onDownload,
  undoStack,
  redoStack,
  onSettings
}) => {
  // Define tool options
  const toolOptions = [
    { id: 'cursor', icon: <FaArrowsAlt />, label: 'Select', tooltip: 'Select and move objects' },
    { id: 'text', icon: <FaFont />, label: 'Text', tooltip: 'Add text to the document' },
    { id: 'draw', icon: <FaPenNib />, label: 'Draw', tooltip: 'Free-hand drawing' },
    { id: 'shape', icon: <FaDrawPolygon />, label: 'Shape', tooltip: 'Add shapes' },
    { id: 'image', icon: <FaImage />, label: 'Image', tooltip: 'Insert image' },
    { id: 'highlight', icon: <FaHighlighter />, label: 'Highlight', tooltip: 'Highlight content' },
    { id: 'stamp', icon: <FaStamp />, label: 'Stamp', tooltip: 'Add stamp (Approved, Draft, etc.)' },
    { id: 'eraser', icon: <FaEraser />, label: 'Eraser', tooltip: 'Erase annotations' },
    { id: 'comment', icon: <FaRegComment />, label: 'Comment', tooltip: 'Add comments' },
    { id: 'signature', icon: <FaSignature />, label: 'Signature', tooltip: 'Add signature' }
  ];
  
  return (
    <div 
      className="pdf-editor-toolbar"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '8px',
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #ddd',
        flexWrap: 'wrap'
      }}
    >
      {/* Tool options */}
      <div className="tool-group" style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
        {toolOptions.map(tool => (
          <button
            key={tool.id}
            className={`tool-button ${activeToolMode === tool.id ? 'active' : ''}`}
            onClick={() => onToolSelect(tool.id)}
            title={tool.tooltip}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '8px',
              backgroundColor: activeToolMode === tool.id ? '#e0e0e0' : 'transparent',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              transition: 'background-color 0.2s'
            }}
          >
            <span style={{ fontSize: '16px', marginBottom: '4px' }}>{tool.icon}</span>
            <span>{tool.label}</span>
          </button>
        ))}
      </div>
      
      {/* Action buttons */}
      <div className="action-group" style={{ display: 'flex', gap: '5px', marginLeft: 'auto' }}>
        {/* Undo/Redo */}
        <button
          onClick={onUndo}
          disabled={!undoStack || undoStack.length === 0}
          title="Undo (Ctrl+Z)"
          style={{
            padding: '8px',
            backgroundColor: 'transparent',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: undoStack && undoStack.length > 0 ? 'pointer' : 'not-allowed',
            opacity: undoStack && undoStack.length > 0 ? 1 : 0.5
          }}
        >
          <FaUndo />
        </button>
        
        <button
          onClick={onRedo}
          disabled={!redoStack || redoStack.length === 0}
          title="Redo (Ctrl+Y)"
          style={{
            padding: '8px',
            backgroundColor: 'transparent',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: redoStack && redoStack.length > 0 ? 'pointer' : 'not-allowed',
            opacity: redoStack && redoStack.length > 0 ? 1 : 0.5
          }}
        >
          <FaRedo />
        </button>
        
        {/* Save/Upload/Download */}
        {onSave && (
          <button
            onClick={onSave}
            title="Save PDF"
            style={{
              padding: '8px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            <FaSave />
          </button>
        )}
        
        {onUpload && (
          <button
            onClick={onUpload}
            title="Upload PDF"
            style={{
              padding: '8px',
              backgroundColor: 'transparent',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            <FaUpload />
          </button>
        )}
        
        {onDownload && (
          <button
            onClick={onDownload}
            title="Download PDF"
            style={{
              padding: '8px',
              backgroundColor: 'transparent',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            <FaDownload />
          </button>
        )}
        
        {/* Settings */}
        {onSettings && (
          <button
            onClick={onSettings}
            title="Settings"
            style={{
              padding: '8px',
              backgroundColor: 'transparent',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            <FaCog />
          </button>
        )}
      </div>
    </div>
  );
};

Toolbar.propTypes = {
  activeToolMode: PropTypes.string.isRequired,
  onToolSelect: PropTypes.func.isRequired,
  onUndo: PropTypes.func.isRequired,
  onRedo: PropTypes.func.isRequired,
  onSave: PropTypes.func,
  onUpload: PropTypes.func,
  onDownload: PropTypes.func,
  undoStack: PropTypes.array,
  redoStack: PropTypes.array,
  onSettings: PropTypes.func
};

Toolbar.defaultProps = {
  undoStack: [],
  redoStack: []
};

export default React.memo(Toolbar); 