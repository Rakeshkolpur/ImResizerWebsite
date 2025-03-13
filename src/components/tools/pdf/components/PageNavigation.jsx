import React from 'react';
import PropTypes from 'prop-types';
import { 
  FaChevronLeft, 
  FaChevronRight, 
  FaSearchMinus, 
  FaSearchPlus, 
  FaExpand, 
  FaBars 
} from 'react-icons/fa';

/**
 * PageNavigation component for navigating between PDF pages and zoom controls
 */
const PageNavigation = ({
  currentPage,
  pageCount,
  onPageChange,
  onZoomIn,
  onZoomOut,
  onFitToWidth,
  scale,
  onToggleSidebar
}) => {
  // Handler for direct page input
  const handlePageInputChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1 && value <= pageCount) {
      onPageChange(value);
    }
  };
  
  return (
    <div 
      className="page-navigation"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px',
        backgroundColor: '#f8f9fa',
        borderTop: '1px solid #ddd',
        flexWrap: 'wrap',
        gap: '10px'
      }}
    >
      {/* Previous/Next buttons and page info */}
      <div className="page-controls" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          title="Previous Page"
          style={{
            padding: '8px',
            backgroundColor: 'transparent',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: currentPage > 1 ? 'pointer' : 'not-allowed',
            opacity: currentPage > 1 ? 1 : 0.5
          }}
        >
          <FaChevronLeft />
        </button>
        
        <div className="page-info" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span>Page</span>
          <input
            type="number"
            min="1"
            max={pageCount}
            value={currentPage}
            onChange={handlePageInputChange}
            style={{
              width: '40px',
              padding: '4px',
              textAlign: 'center',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
          <span>of {pageCount || 1}</span>
        </div>
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= pageCount}
          title="Next Page"
          style={{
            padding: '8px',
            backgroundColor: 'transparent',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: currentPage < pageCount ? 'pointer' : 'not-allowed',
            opacity: currentPage < pageCount ? 1 : 0.5
          }}
        >
          <FaChevronRight />
        </button>
      </div>
      
      {/* Zoom controls */}
      <div className="zoom-controls" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={onZoomOut}
          disabled={scale <= 0.5}
          title="Zoom Out"
          style={{
            padding: '8px',
            backgroundColor: 'transparent',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: scale > 0.5 ? 'pointer' : 'not-allowed',
            opacity: scale > 0.5 ? 1 : 0.5
          }}
        >
          <FaSearchMinus />
        </button>
        
        <span style={{ minWidth: '60px', textAlign: 'center' }}>
          {Math.round(scale * 100)}%
        </span>
        
        <button
          onClick={onZoomIn}
          disabled={scale >= 5}
          title="Zoom In"
          style={{
            padding: '8px',
            backgroundColor: 'transparent',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: scale < 5 ? 'pointer' : 'not-allowed',
            opacity: scale < 5 ? 1 : 0.5
          }}
        >
          <FaSearchPlus />
        </button>
        
        <button
          onClick={onFitToWidth}
          title="Fit to Width"
          style={{
            padding: '8px',
            backgroundColor: 'transparent',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          <FaExpand />
        </button>
      </div>
      
      {/* Sidebar toggle */}
      {onToggleSidebar && (
        <button
          onClick={onToggleSidebar}
          title="Toggle Sidebar"
          style={{
            padding: '8px',
            backgroundColor: 'transparent',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
            marginLeft: 'auto'
          }}
        >
          <FaBars />
        </button>
      )}
    </div>
  );
};

PageNavigation.propTypes = {
  currentPage: PropTypes.number.isRequired,
  pageCount: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onZoomIn: PropTypes.func.isRequired,
  onZoomOut: PropTypes.func.isRequired,
  onFitToWidth: PropTypes.func.isRequired,
  scale: PropTypes.number.isRequired,
  onToggleSidebar: PropTypes.func
};

export default React.memo(PageNavigation); 