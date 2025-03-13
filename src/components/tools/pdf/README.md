# PDF Editor Component

This is a refactored version of the PDF Editor component. The original monolithic component has been split into multiple smaller components, each with a specific responsibility, to improve maintainability and organization.

## Directory Structure

```
pdf/
├── components/           # UI components
│   ├── ErrorBoundary.jsx # Error handling component
│   ├── LayerManager.jsx  # Layer management UI
│   ├── PageNavigation.jsx # Page navigation controls
│   ├── PDFEditor.jsx     # Main editor component (orchestrator)
│   ├── SettingsPanel.jsx # Settings UI
│   ├── TextEditor.jsx    # Text editing UI
│   └── Toolbar.jsx       # Tools and actions toolbar
├── hooks/                # Custom React hooks
│   ├── useFabricCanvas.js # Canvas operations
│   ├── usePdfDocument.js  # PDF document handling
│   └── useUndoRedo.js     # History tracking
├── utils/                # Utility functions and constants
│   └── constants.js      # Shared constants
├── PDFEditor.jsx         # Original monolithic component (deprecated)
├── PDFEditor.module.css  # Styles for the PDF Editor
├── index.jsx             # Main export with version toggle
└── README.md             # This file
```

## Component Refactoring

The original `PDFEditor.jsx` was over 4,000 lines of code, which made it difficult to maintain and understand. The refactored version splits the functionality into:

1. **Smaller Components** - Each UI element is its own component
2. **Custom Hooks** - Reusable logic is separated into hooks
3. **Utility Functions** - Shared functions and constants are extracted

## Usage

You can use the refactored component in two ways:

### 1. Use the Wrapper (Recommended)

```jsx
import PDFEditorWrapper from 'components/tools/pdf';

function MyComponent() {
  return <PDFEditorWrapper useRefactored={true} />;
}
```

The wrapper allows you to toggle between the original and refactored versions. By default, it uses the refactored version.

### 2. Use the Specific Version

```jsx
import { PDFEditor } from 'components/tools/pdf';

function MyComponent() {
  return <PDFEditor />;
}
```

## Features

The PDF Editor includes the following features:

- View and navigate PDF documents
- Text annotation
- Drawing and shapes
- Image insertion
- Highlighting
- Stamps and signatures
- Layer management
- Undo/redo functionality
- Document saving and downloading

## Testing and Validation

To ensure the refactored version maintains all the functionality of the original, you can:

1. **Use URL Parameters** - Add `?pdf_editor_version=original` or `?pdf_editor_version=refactored` to toggle between versions
2. **Compare Features** - Verify that all features work the same in both versions

## Development Guidelines

When contributing to this component:

1. **Keep Components Small** - Aim for less than 500 lines per file
2. **Use Hooks for Logic** - Separate business logic from presentation
3. **Follow Component Patterns** - Each component should have a single responsibility
4. **Update Documentation** - Keep this README and component JSDoc comments up to date
5. **Add Tests** - Write tests for new functionality 