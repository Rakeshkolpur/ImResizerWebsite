// Main Components
import OriginalPDFEditor from './PDFEditor';
import RefactoredPDFEditor from './PDFEditor/index';
import PDFEditorWrapper from './PDFEditorWrapper';

// Components
import PDFViewer from './components/PDFViewer';
import Toolbar from './components/Toolbar';
import TextEditor from './components/TextEditor';
import PageNavigation from './components/PageNavigation';
import LayerManager from './components/LayerManager';
import SettingsPanel from './components/SettingsPanel';
import ErrorBoundary from './components/ErrorBoundary';

// Hooks
import usePdfDocument from './hooks/usePdfDocument';
import useFabricCanvas from './hooks/useFabricCanvas';
import useTextEditor from './hooks/useTextEditor';
import useLayerManager from './hooks/useLayerManager';
import useUndoRedo from './hooks/useUndoRedo';
import useSettings from './hooks/useSettings';

// Utilities
import { FileProcessor } from './PDFEditor/FileProcessor';
import { ShapeManager } from './PDFEditor/ShapeManager';
import { ToolModeManager } from './PDFEditor/ToolModeManager';
import { EventHandlers } from './PDFEditor/EventHandlers';

// Export components
export {
  // Main components
  OriginalPDFEditor,
  RefactoredPDFEditor,
  PDFEditorWrapper,
  
  // Components
  PDFViewer,
  Toolbar,
  TextEditor,
  PageNavigation,
  LayerManager,
  SettingsPanel,
  ErrorBoundary,
  
  // Hooks
  usePdfDocument,
  useFabricCanvas,
  useTextEditor,
  useLayerManager,
  useUndoRedo,
  useSettings,
  
  // Utilities
  FileProcessor,
  ShapeManager,
  ToolModeManager,
  EventHandlers
};

// Default export - use the wrapper with the original version by default
export default PDFEditorWrapper; 