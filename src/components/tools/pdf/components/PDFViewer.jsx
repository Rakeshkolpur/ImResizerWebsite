import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import usePdfDocument from '../hooks/usePdfDocument';

/**
 * PDFViewer component for displaying and editing PDFs
 */
const PDFViewer = ({
  canvasRef,
  overlayCanvasRef,
  pdfPageImages,
  currentPage,
  scale,
  rotation,
  isLoading,
  error,
  onCanvasClick
}) => {
  // Ref for the canvas wrapper (for positioning)
  const wrapperRef = useRef(null);
  
  // If there's an error, show error message
  if (error) {
    return (
      <div className="pdf-error" style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
        <h3>Error</h3>
        <p>{error}</p>
      </div>
    );
  }
  
  // Get current page data
  const currentPageData = pdfPageImages[currentPage - 1];
  
  return (
    <div 
      className="pdf-viewer-container"
      style={{
        position: 'relative',
        overflow: 'auto',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        backgroundColor: '#f0f0f0',
        padding: '20px',
        boxSizing: 'border-box'
      }}
    >
      {isLoading && (
        <div className="loading-overlay" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          zIndex: 100
        }}>
          <div className="spinner" style={{
            border: '4px solid rgba(0, 0, 0, 0.1)',
            borderLeft: '4px solid #000',
            borderRadius: '50%',
            width: '30px',
            height: '30px',
            animation: 'spin 1s linear infinite'
          }}></div>
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
      
      <div 
        ref={wrapperRef}
        className="canvas-wrapper"
        style={{
          position: 'relative',
          transform: `rotate(${rotation}deg)`,
          margin: '0 auto',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
          transition: 'transform 0.3s ease-in-out'
        }}
        onClick={onCanvasClick}
      >
        {/* Base canvas for PDF rendering */}
        <canvas
          ref={canvasRef}
          className="pdf-canvas"
          style={{
            display: 'block',
            width: currentPageData ? `${currentPageData.width * scale}px` : '800px',
            height: currentPageData ? `${currentPageData.height * scale}px` : '600px'
          }}
        />
        
        {/* Overlay canvas for annotations */}
        <canvas
          ref={overlayCanvasRef}
          className="annotation-canvas"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'auto'
          }}
        />
      </div>
      
      {!currentPageData && !isLoading && (
        <div className="no-pdf-message" style={{ 
          padding: '20px',
          textAlign: 'center',
          marginTop: '20px',
          backgroundColor: 'white',
          border: '1px solid #ddd',
          borderRadius: '4px'
        }}>
          <h3>No PDF Loaded</h3>
          <p>Please select a PDF file to view and edit.</p>
        </div>
      )}
    </div>
  );
};

PDFViewer.propTypes = {
  canvasRef: PropTypes.object.isRequired,
  overlayCanvasRef: PropTypes.object.isRequired,
  pdfPageImages: PropTypes.array.isRequired,
  currentPage: PropTypes.number.isRequired,
  scale: PropTypes.number.isRequired,
  rotation: PropTypes.number.isRequired,
  isLoading: PropTypes.bool.isRequired,
  error: PropTypes.string,
  onCanvasClick: PropTypes.func
};

PDFViewer.defaultProps = {
  error: null,
  onCanvasClick: () => {}
};

export default React.memo(PDFViewer); 