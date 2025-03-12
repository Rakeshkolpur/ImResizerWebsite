import React from 'react';

// Tool Icons
const ImageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const CompressIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
  </svg>
);

const PdfIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const DeleteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const MergeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
  </svg>
);

const SplitIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
  </svg>
);

const CropIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
  </svg>
);

const SignIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

const ConvertIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
);

const ExtractIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const AlternateIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
  </svg>
);

const OrganizeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
);

// Define groups and tools
export const toolGroups = [
  {
    id: 'most_popular',
    title: 'MOST POPULAR',
    tools: [
      {
        id: 'pdf_editor',
        title: 'PDF Editor',
        description: 'Edit PDF files for free. Fill & sign PDF. Add text, links, images and shapes. Edit existing PDF text. Annotate PDF.',
        icon: <PdfIcon />,
        category: 'pdf',
        component: 'PDFEditor'
      },
      {
        id: 'compress',
        title: 'Compress',
        description: 'Reduce the size of your PDF document',
        icon: <CompressIcon />,
        category: 'pdf'
      },
      {
        id: 'delete_pages',
        title: 'Delete Pages',
        description: 'Remove pages from a PDF document',
        icon: <DeleteIcon />,
        category: 'pdf'
      },
      {
        id: 'merge',
        title: 'Merge',
        description: 'Combine multiple PDFs and images into one',
        icon: <MergeIcon />,
        category: 'pdf'
      },
      {
        id: 'split',
        title: 'Split',
        description: 'Split specific page ranges or extract every page into a separate document',
        icon: <SplitIcon />,
        category: 'pdf'
      },
      {
        id: 'crop',
        title: 'Crop',
        description: 'Trim PDF margins, change PDF page size',
        icon: <CropIcon />,
        category: 'pdf'
      },
      {
        id: 'fill_sign',
        title: 'Fill & Sign',
        description: 'Add signature to PDF. Fill out PDF forms',
        icon: <SignIcon />,
        category: 'pdf'
      },
      {
        id: 'pdf_to_word',
        title: 'PDF To Word',
        description: 'Convert from PDF to DOC online',
        icon: <ConvertIcon />,
        category: 'conversion'
      },
      {
        id: 'extract_pages',
        title: 'Extract Pages',
        description: 'Get a new document containing only the desired pages',
        icon: <ExtractIcon />,
        category: 'pdf'
      },
      {
        id: 'organize',
        title: 'Organize',
        description: 'Arrange and reorder PDF pages with drag and drop',
        icon: <OrganizeIcon />,
        category: 'pdf'
      },
      {
        id: 'pdf-compressor',
        title: 'PDF Compressor',
        description: 'Reduce the size of your PDF files with precise control over compression settings',
        icon: <CompressIcon />,
        category: 'pdf',
        component: 'PDFCompressor'
      },
    ]
  },
  {
    id: 'merge',
    title: 'MERGE',
    tools: [
      {
        id: 'alternate_mix',
        title: 'Alternate & Mix',
        description: 'Mixes pages from 2 or more documents, alternating between them',
        icon: <AlternateIcon />,
        category: 'pdf'
      },
      {
        id: 'merge_pdf',
        title: 'Merge',
        description: 'Combine multiple PDFs and images into one',
        icon: <MergeIcon />,
        category: 'pdf'
      },
      {
        id: 'organize',
        title: 'Organize',
        description: 'Arrange and reorder PDF pages',
        icon: <OrganizeIcon />,
        category: 'pdf'
      }
    ]
  },
  {
    id: 'image_tools',
    title: 'IMAGE TOOLS',
    tools: [
      {
        id: 'resize_image',
        title: 'Resize Image',
        description: 'Change image dimensions in pixels, percentage, or by setting width and height',
        icon: <ImageIcon />,
        category: 'image'
      },
      {
        id: 'compress_image',
        title: 'Compress Image',
        description: 'Reduce image file size while maintaining quality',
        icon: <CompressIcon />,
        category: 'image'
      },
      {
        id: 'crop_image',
        title: 'Crop Image',
        description: 'Crop and resize image to desired dimensions',
        icon: <CropIcon />,
        category: 'image'
      },
      {
        id: 'convert_image',
        title: 'Convert Image',
        description: 'Convert images between formats (JPG, PNG, WebP, etc.)',
        icon: <ConvertIcon />,
        category: 'image'
      },
      {
        id: 'image_to_pdf',
        title: 'Image to PDF',
        description: 'Convert images to PDF documents',
        icon: <PdfIcon />,
        category: 'conversion'
      }
    ]
  },
  {
    id: 'converters',
    title: 'CONVERTERS',
    tools: [
      {
        id: 'pdf_to_word',
        title: 'PDF to Word',
        description: 'Convert PDF documents to editable Word files',
        icon: <ConvertIcon />,
        category: 'conversion'
      },
      {
        id: 'word_to_pdf',
        title: 'Word to PDF',
        description: 'Convert Word documents to PDF format',
        icon: <ConvertIcon />,
        category: 'conversion'
      },
      {
        id: 'jpg_to_pdf',
        title: 'JPG to PDF',
        description: 'Convert JPG images to PDF documents',
        icon: <ConvertIcon />,
        category: 'conversion'
      },
      {
        id: 'pdf_to_jpg',
        title: 'PDF to JPG',
        description: 'Convert PDF pages to JPG images',
        icon: <ConvertIcon />,
        category: 'conversion'
      },
      {
        id: 'extract_text',
        title: 'Extract Text',
        description: 'Extract text content from PDF documents',
        icon: <ExtractIcon />,
        category: 'pdf'
      }
    ]
  }
];

// Lookup function to find a tool by ID
export const findToolById = (toolId) => {
  for (const group of toolGroups) {
    const tool = group.tools.find(t => t.id === toolId);
    if (tool) return tool;
  }
  return null;
};

// Get all tools in a flat array
export const getAllTools = () => {
  return toolGroups.flatMap(group => group.tools);
}; 