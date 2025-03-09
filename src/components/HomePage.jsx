import React from 'react';
import ToolsGrid from './ToolsGrid';
import { toolGroups } from '../data/tools';

const HomePage = ({ onToolSelect }) => {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="container mx-auto py-10">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            Your Complete Solution for Images and PDFs
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Resize, convert, and edit your files with our easy-to-use tools
          </p>
        </div>
        
        {/* Display tools by category */}
        {toolGroups.map((group) => (
          <ToolsGrid 
            key={group.id}
            title={group.title}
            tools={group.tools}
            onToolSelect={onToolSelect}
          />
        ))}
      </div>
    </div>
  );
};

export default HomePage; 