// PDF.js constants
export const PDFJS_VERSION = '3.11.174';
export const PDFJS_WORKER_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;
export const PDFJS_LIB_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`;

// Tool modes
export const TOOL_MODES = {
  CURSOR: 'cursor',
  TEXT: 'text',
  DRAW: 'draw',
  SHAPE: 'shape',
  IMAGE: 'image',
  HIGHLIGHT: 'highlight',
  STAMP: 'stamp',
  ERASER: 'eraser',
  COMMENT: 'comment',
  SIGNATURE: 'signature'
};

// Available fonts
export const AVAILABLE_FONTS = [
  'Helvetica',
  'Times Roman',
  'Courier',
  'Arial',
  'Verdana',
  'Georgia',
  'Tahoma',
  'Comic Sans MS',
  'Impact',
  'Trebuchet MS'
];

// Available font sizes
export const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72];

// Available shape types
export const SHAPE_TYPES = {
  RECTANGLE: 'rectangle',
  CIRCLE: 'circle',
  LINE: 'line',
  ARROW: 'arrow',
  TRIANGLE: 'triangle',
  STAR: 'star',
  HEART: 'heart',
  POLYGON: 'polygon'
};

// Default text options
export const DEFAULT_TEXT_OPTIONS = {
  font: 'Helvetica',
  size: 16,
  color: '#000000',
  backgroundColor: null,
  fontWeight: 'normal',
  fontStyle: 'normal'
};

// Default drawing options
export const DEFAULT_DRAWING_OPTIONS = {
  color: '#000000',
  width: 2,
  opacity: 1,
  shadow: null
};

// Default shape options
export const DEFAULT_SHAPE_OPTIONS = {
  fill: 'transparent',
  stroke: '#000000',
  strokeWidth: 2,
  opacity: 1
};

// Default highlight options
export const DEFAULT_HIGHLIGHT_OPTIONS = {
  color: '#ffff00',
  opacity: 0.5,
  width: 15
};

// Default stamp options
export const DEFAULT_STAMP_OPTIONS = {
  type: 'approved',
  color: '#ff0000',
  opacity: 1,
  size: 100
};

// Default eraser options
export const DEFAULT_ERASER_OPTIONS = {
  size: 20
};

// Available stamps
export const STAMPS = [
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'draft', label: 'Draft' },
  { id: 'final', label: 'Final' },
  { id: 'confidential', label: 'Confidential' },
  { id: 'forReview', label: 'For Review' },
  { id: 'asIs', label: 'As Is' },
  { id: 'completed', label: 'Completed' },
  { id: 'void', label: 'Void' },
  { id: 'expired', label: 'Expired' }
]; 