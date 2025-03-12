import React from 'react';
import ToolsGrid from './ToolsGrid';
import { toolGroups } from '../data/tools.jsx';

const HomePage = ({ category, onToolSelect }) => {
  // Filter tool groups based on the selected category
  const filteredToolGroups = () => {
    if (!category) {
      // Return all tool groups if no category is selected
      return toolGroups;
    }

    if (category === 'all-tools') {
      // Return all tool groups for "All Tools" category
      return toolGroups;
    }

    const categoryMap = {
      'image-tools': ['image'],
      'pdf-tools': ['pdf'],
      'converters': ['conversion']
    };

    const targetCategories = categoryMap[category] || [];
    
    // Filter tools that match the selected category
    return toolGroups.map(group => ({
      ...group,
      tools: group.tools.filter(tool => 
        targetCategories.includes(tool.category)
      )
    })).filter(group => group.tools.length > 0);
  };

  // Get the filtered tool groups
  const groupsToDisplay = filteredToolGroups();

  // Generate a heading based on the category
  const getCategoryHeading = () => {
    if (!category) {
      return (
        <>
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            Your Complete Solution for Images and PDFs
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Resize, convert, and edit your files with our easy-to-use tools
          </p>
        </>
      );
    }

    const headingMap = {
      'all-tools': {
        title: 'All Available Tools',
        description: 'Browse our complete collection of tools for all your needs'
      },
      'image-tools': {
        title: 'Image Tools',
        description: 'Resize, crop, compress, and convert your images with these powerful tools'
      },
      'pdf-tools': {
        title: 'PDF Tools',
        description: 'Edit, compress, merge, and convert your PDF documents'
      },
      'converters': {
        title: 'File Converters',
        description: 'Convert between different file formats with ease'
      }
    };

    const headingInfo = headingMap[category] || {
      title: 'Available Tools',
      description: 'Browse our collection of tools'
    };

    return (
      <>
        <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
          {headingInfo.title}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          {headingInfo.description}
        </p>
      </>
    );
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="container mx-auto py-10">
        <div className="text-center max-w-2xl mx-auto mb-10">
          {getCategoryHeading()}
        </div>
        
        {/* Display tools by category */}
        {groupsToDisplay.map((group) => (
          <ToolsGrid 
            key={group.id}
            title={group.title}
            tools={group.tools}
            onToolSelect={onToolSelect}
          />
        ))}

        {/* If no tools found for the category */}
        {groupsToDisplay.length === 0 && (
          <div className="text-center p-10">
            <h2 className="text-2xl text-gray-700 dark:text-gray-300">
              No tools found for this category.
            </h2>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage; 