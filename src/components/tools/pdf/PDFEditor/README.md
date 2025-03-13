# PDF Editor Component

This directory contains the refactored PDF Editor implementation, split into smaller, more maintainable components. The original monolithic `PDFEditor.jsx` file (over 4,000 lines) has been split into multiple smaller files, each with a specific responsibility.

## File Structure

- `index.jsx` - Main PDFEditor component that orchestrates all the other components
- `FileProcessor.js` - Handles loading, processing, and saving PDF files
- `ShapeManager.js` - Manages shape creation and manipulation
- `ToolModeManager.js` - Manages tool selection and configuration
- `EventHandlers.js` - Handles canvas events (mouse, keyboard, etc.)

## How It Works

The `index.jsx` file serves as the main entry point and coordinates all the functionality by:

1. Importing and using various custom hooks:
   - `usePdfDocument` - PDF document loading and page navigation
   - `useFabricCanvas` - Fabric.js canvas management
   - `useTextEditor` - Text editing capabilities
   - `useLayerManager` - Layer management
   - `useUndoRedo` - Undo/redo functionality
   - `useSettings` - User settings management

2. Utilizing utility classes:
   - `FileProcessor` - PDF file operations
   - `ShapeManager` - Shape management
   - `ToolModeManager` - Tool mode switching
   - `EventHandlers` - Event handling

3. Rendering components:
   - `Toolbar` - Tool selection and actions
   - `PDFViewer` - PDF rendering
   - `TextEditor` - Text editing popup
   - `PageNavigation` - Page navigation controls
   - `LayerManager` - Layer management UI
   - `SettingsPanel` - Settings configuration UI

## Usage

```jsx
import { PDFEditor } from '../components/tools/pdf';

function App() {
  return (
    <div className="app">
      <PDFEditor />
    </div>
  );
}
```

## Integration with PDF.js and Fabric.js

The editor uses:
- [PDF.js](https://mozilla.github.io/pdf.js/) for PDF rendering
- [Fabric.js](http://fabricjs.com/) for canvas manipulation

These libraries enable:
- Rendering PDFs on canvas
- Adding annotations, shapes, and text
- Interactive editing of annotations
- Saving annotations back to the PDF

## Dependencies

Make sure these dependencies are installed:

```
npm install pdf-lib pdfjs-dist fabric react-icons uuid
```

## Extending

To add new features:

1. For new tools:
   - Add the tool to `ToolModeManager.js`
   - Add UI for the tool in `Toolbar.jsx`
   - Implement tool behavior in the appropriate utility class

2. For new settings:
   - Add setting defaults in `useSettings.js`
   - Add UI for the setting in `SettingsPanel.jsx`
   - Use the setting in the appropriate components

## Performance Considerations

- The PDF rendering is done on a separate canvas from annotations
- Large PDFs are loaded page by page to improve performance
- Canvas objects are managed through layers for better organization
- Undo/redo operations use object references instead of full canvas serialization 