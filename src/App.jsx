import React, { useState, useEffect } from 'react';
import './App.css';
import Navigation from './components/Navigation';
import HomePage from './components/HomePage';
import ToolWrapper from './components/ToolWrapper';
import Footer from './components/Footer';
import PDFCompressor from './components/tools/pdf/PDFCompressor';

const App = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [selectedTool, setSelectedTool] = useState(null);

  // Check for user dark mode preference and saved preference
  useEffect(() => {
    // Check for saved preference in localStorage
    const savedDarkMode = localStorage.getItem('darkMode');
    
    if (savedDarkMode !== null) {
      // Use saved preference
      setDarkMode(savedDarkMode === 'true');
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      // Use system preference if no saved preference
      setDarkMode(true);
    }
  }, []);

  // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Save preference to localStorage
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleToolSelect = (toolId) => {
    if (toolId === 'home') {
      setSelectedTool(null);
    } else {
      setSelectedTool(toolId);
    }
    // Scroll to top when changing tools
    window.scrollTo(0, 0);
  };

  const handleBackToHome = () => {
    setSelectedTool(null);
    // Scroll to top when going back to home
    window.scrollTo(0, 0);
  };

  // Render the selected tool or home page
  const renderContent = () => {
    if (!selectedTool) {
      return <HomePage onToolSelect={handleToolSelect} />;
    }

    // Handle category views
    if (selectedTool.startsWith('category-')) {
      const category = selectedTool.replace('category-', '');
      return <HomePage category={category} onToolSelect={handleToolSelect} />;
    }

    // Add the PDFCompressor tool
    if (selectedTool === 'pdf-compressor') {
      return <PDFCompressor />;
    }

    return <ToolWrapper toolId={selectedTool} onBack={handleBackToHome} />;
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Navigation 
        darkMode={darkMode} 
        toggleDarkMode={toggleDarkMode} 
        selectedTool={selectedTool}
        onToolSelect={handleToolSelect}
      />
      <main className="flex-grow container mx-auto px-4 py-8">
        {renderContent()}
      </main>
      <Footer />
    </div>
  );
};

export default App;