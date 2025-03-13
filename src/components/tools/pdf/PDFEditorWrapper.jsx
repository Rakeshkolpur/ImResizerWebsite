import React, { useState } from 'react';
import PropTypes from 'prop-types';

// Import both versions of the PDF Editor
import OriginalPDFEditor from './PDFEditor';
import NewPDFEditor from './PDFEditor/index';

/**
 * PDFEditorWrapper component that can switch between original and refactored versions
 * Provides a UI toggle for developers to test both implementations
 */
const PDFEditorWrapper = ({ useNewVersion = false, ...props }) => {
  const [showNewVersion, setShowNewVersion] = useState(useNewVersion);
  
  // Determine which version to render
  const Editor = showNewVersion ? NewPDFEditor : OriginalPDFEditor;
  
  return (
    <div className="pdf-editor-wrapper" style={{ position: 'relative', height: '100%' }}>
      {/* Version toggle - only visible in development */}
      {process.env.NODE_ENV === 'development' && (
        <div 
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            padding: '5px 10px',
            borderRadius: '4px',
            color: 'white',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>Editor Version:</span>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showNewVersion}
              onChange={() => setShowNewVersion(!showNewVersion)}
              style={{ marginRight: '5px' }}
            />
            {showNewVersion ? 'Refactored' : 'Original'}
          </label>
        </div>
      )}
      
      {/* Render the selected PDF Editor version */}
      <Editor {...props} />
    </div>
  );
};

PDFEditorWrapper.propTypes = {
  useNewVersion: PropTypes.bool
};

export default PDFEditorWrapper; 