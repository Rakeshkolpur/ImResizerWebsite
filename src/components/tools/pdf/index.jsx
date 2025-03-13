/**
 * ==========================================================================
 * PDF EDITOR COMPONENT - MAIN ENTRY POINT
 * ==========================================================================
 * 
 * This file serves as the main entry point for the PDF Editor component.
 * It provides a wrapper that allows toggling between:
 * 
 * 1. The ORIGINAL monolithic implementation (~4,000 lines)
 * 2. The REFACTORED modular implementation (multiple files, each <500 lines)
 * 
 * ==========================================================================
 * USAGE:
 * ==========================================================================
 * 
 * // Import the default wrapper (recommended)
 * import PDFEditorWrapper from 'src/components/tools/pdf';
 * 
 * function MyComponent() {
 *   // Use refactored version by default
 *   return <PDFEditorWrapper />;
 *   
 *   // OR specify which version to use
 *   return <PDFEditorWrapper useRefactored={true} />; // New version
 *   return <PDFEditorWrapper useRefactored={false} />; // Original version
 * }
 * 
 * // Alternatively, import a specific version directly
 * import { PDFEditor, OriginalPDFEditor } from 'src/components/tools/pdf';
 * 
 * function MyComponent() {
 *   // Use new refactored version
 *   return <PDFEditor />;
 *   
 *   // OR use original version
 *   return <OriginalPDFEditor />;
 * }
 * 
 * ==========================================================================
 * URL PARAMETERS:
 * ==========================================================================
 * 
 * You can also toggle between versions using URL parameters:
 * 
 * - ?pdf_editor_version=refactored → Use the refactored version
 * - ?pdf_editor_version=original → Use the original version
 * 
 * This is useful for testing and comparing the two implementations.
 * ==========================================================================
 */

import React, { useState, useEffect } from 'react';
import PDFEditor from './components/PDFEditor';
import OriginalPDFEditor from './PDFEditor';

/**
 * PDFEditorWrapper component
 * Provides a wrapper around the PDFEditor component with
 * the ability to toggle between the original and refactored versions
 */
const PDFEditorWrapper = ({ useRefactored = true }) => {
  const [useRefactoredVersion, setUseRefactoredVersion] = useState(useRefactored);
  
  // Check for URL parameter to force a specific version
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const forceVersion = urlParams.get('pdf_editor_version');
      
      if (forceVersion === 'original') {
        setUseRefactoredVersion(false);
      } else if (forceVersion === 'refactored') {
        setUseRefactoredVersion(true);
      }
    }
  }, []);
  
  return (
    <>
      {useRefactoredVersion ? (
        <PDFEditor />
      ) : (
        <OriginalPDFEditor />
      )}
    </>
  );
};

// Export both versions and the wrapper
export { PDFEditor, OriginalPDFEditor };
export default PDFEditorWrapper; 