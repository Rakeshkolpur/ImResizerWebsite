import React from 'react';

const ToolCard = ({ icon, title, description, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-1 hover-card"
    >
      <div className="p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300">
              {icon}
            </div>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ToolsGrid = ({ title, tools, onToolSelect }) => {
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-blue-500 dark:text-blue-400 mb-6">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <ToolCard
              key={tool.id}
              icon={tool.icon}
              title={tool.title}
              description={tool.description}
              onClick={() => onToolSelect(tool.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ToolsGrid; 