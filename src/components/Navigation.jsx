import React, { useState, useEffect } from 'react';

const Navigation = ({ darkMode, toggleDarkMode, onToolSelect }) => {
  const [activeTab, setActiveTab] = useState('imresize');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(null);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIsMenuOpen(false);
    setShowDropdown(null);
    
    // Pass the selected tool to the App component
    if (onToolSelect) {
      onToolSelect(tab);
    }
  };

  // Handle dropdown display on hover
  const handleMouseEnter = (tab) => {
    setShowDropdown(tab);
  };

  const handleMouseLeave = () => {
    setShowDropdown(null);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowDropdown(null);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Get dropdown content based on tab
  const getDropdownContent = (tab) => {
    switch(tab) {
      case 'all-tools':
        return (
          <div className="absolute top-full left-1/2 -translate-x-1/2  mt-1 w-60   lg:w-[500px] lg:flex lg:justify-center bg-white dark:bg-gray-800 shadow-lg rounded-lg py-2 z-10">
  <div className="w-full lg:w-auto px-4 py-2 text-sm font-medium lg:bg-gray-800 text-gray-500 dark:text-gray-400">
    Image Tools
    <a href="#" onClick={(e) => { e.preventDefault(); handleTabChange('resize_image'); }} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-gray-700 cursor-pointer">Image Resize</a>
    <a href="#" onClick={(e) => { e.preventDefault(); handleTabChange('compress_image'); }} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-gray-700 cursor-pointer">Image Compress</a>
    <a href="#" onClick={(e) => { e.preventDefault(); handleTabChange('crop_image'); }} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-gray-700 cursor-pointer">Image Crop</a>
    <a href="#" onClick={(e) => { e.preventDefault(); handleTabChange('convert_image'); }} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-gray-700 cursor-pointer">Image Convert</a>
  </div>

  <div className="w-full lg:w-auto px-4 py-2 text-sm font-medium lg:bg-gray-800 text-gray-500 dark:text-gray-400 border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-gray-700">
    PDF Tools
    <a href="#" onClick={(e) => { e.preventDefault(); handleTabChange('extract_text'); }} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-gray-700 cursor-pointer">Extract Text</a>
  </div>

  <div className="w-full lg:w-auto px-4 py-2 text-sm font-medium lg:bg-gray-800 text-gray-500 dark:text-gray-400 border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-gray-700">
    Converters
    <a href="#" onClick={(e) => { e.preventDefault(); handleTabChange('pdf_to_word'); }} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-gray-700 cursor-pointer">PDF to Word</a>
    <a href="#" onClick={(e) => { e.preventDefault(); handleTabChange('word_to_pdf'); }} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-gray-700 cursor-pointer">Word to PDF</a>
  </div>
</div>
        );
      case 'imresize':
        return (
          <div className="absolute top-full left-0 mt-1 w-60 bg-white dark:bg-gray-800 shadow-lg rounded-lg py-2 z-10">
            <a href="#" onClick={(e) => { e.preventDefault(); handleTabChange('resize_image'); }} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-gray-700 cursor-pointer">Resize Image</a>
            <a href="#" onClick={(e) => { e.preventDefault(); handleTabChange('compress_image'); }} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-gray-700 cursor-pointer">Compress Image</a>
            <a href="#" onClick={(e) => { e.preventDefault(); handleTabChange('crop_image'); }} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-gray-700 cursor-pointer">Crop Image</a>
            <a href="#" onClick={(e) => { e.preventDefault(); handleTabChange('convert_image'); }} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-gray-700 cursor-pointer">Convert Image Format</a>
          </div>
        );
      case 'converter':
        return (
          <div className="absolute top-full left-0 mt-1 w-60 bg-white dark:bg-gray-800 shadow-lg rounded-lg py-2 z-10">
            <a href="#" onClick={(e) => { e.preventDefault(); handleTabChange('pdf_to_word'); }} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-gray-700 cursor-pointer">PDF to Word</a>
            <a href="#" onClick={(e) => { e.preventDefault(); handleTabChange('word_to_pdf'); }} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-gray-700 cursor-pointer">Word to PDF</a>
            <a href="#" onClick={(e) => { e.preventDefault(); handleTabChange('jpg_to_pdf'); }} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-gray-700 cursor-pointer">JPG to PDF</a>
            <a href="#" onClick={(e) => { e.preventDefault(); handleTabChange('pdf_to_jpg'); }} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-gray-700 cursor-pointer">PDF to JPG</a>
            <a href="#" onClick={(e) => { e.preventDefault(); handleTabChange('extract_text'); }} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-gray-700 cursor-pointer">Extract Text from PDF</a>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0 cursor-pointer" onClick={() => handleTabChange('home')}>
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4 text-xl font-bold text-gray-800 dark:text-white cursor-pointer" onClick={() => handleTabChange('home')}>
              ImageResizer Pro
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex">
            <div className="ml-10 flex items-center space-x-4">
              <button 
                onClick={() => handleTabChange('home')}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-purple-600 dark:text-gray-200 dark:hover:text-purple-400 cursor-pointer"
              >
                Home
              </button>
              
              <div className="relative" onMouseEnter={() => handleMouseEnter('all-tools')} onMouseLeave={handleMouseLeave}>
                <button 
                  onClick={() => handleTabChange('all-tools')}
                  className={`px-3 py-2 rounded-md text-sm font-medium cursor-pointer ${
                    activeTab === 'all-tools' 
                      ? 'text-purple-600 dark:text-purple-400' 
                      : 'text-gray-700 hover:text-purple-600 dark:text-gray-200 dark:hover:text-purple-400'
                  }`}
                >
                  All Tools
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showDropdown === 'all-tools' && getDropdownContent('all-tools')}
              </div>
              
              <div className="relative" onMouseEnter={() => handleMouseEnter('imresize')} onMouseLeave={handleMouseLeave}>
                <button 
                  onClick={() => handleTabChange('imresize')}
                  className={`px-3 py-2 rounded-md text-sm font-medium cursor-pointer ${
                    activeTab === 'imresize' 
                      ? 'text-purple-600 dark:text-purple-400' 
                      : 'text-gray-700 hover:text-purple-600 dark:text-gray-200 dark:hover:text-purple-400'
                  }`}
                >
                  ImResize
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showDropdown === 'imresize' && getDropdownContent('imresize')}
              </div>
              
              <div className="relative" onMouseEnter={() => handleMouseEnter('converter')} onMouseLeave={handleMouseLeave}>
                <button 
                  onClick={() => handleTabChange('converter')}
                  className={`px-3 py-2 rounded-md text-sm font-medium cursor-pointer ${
                    activeTab === 'converter' 
                      ? 'text-purple-600 dark:text-purple-400' 
                      : 'text-gray-700 hover:text-purple-600 dark:text-gray-200 dark:hover:text-purple-400'
                  }`}
                >
                  Converter
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showDropdown === 'converter' && getDropdownContent('converter')}
              </div>
              
              <button 
                onClick={() => handleTabChange('about')}
                className={`px-3 py-2 rounded-md text-sm font-medium cursor-pointer ${
                  activeTab === 'about' 
                    ? 'text-purple-600 dark:text-purple-400' 
                    : 'text-gray-700 hover:text-purple-600 dark:text-gray-200 dark:hover:text-purple-400'
                }`}
              >
                About
              </button>
            </div>
          </div>

          {/* Dark Mode Toggle */}
          <div className="flex items-center">
            <button 
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>

            {/* Mobile menu button */}
            <div className="ml-4 md:hidden">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="bg-gray-100 dark:bg-gray-700 inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none cursor-pointer"
              >
                <svg className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <svg className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden`}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <button 
              onClick={() => handleTabChange('home')}
              className="w-full block px-3 py-2 rounded-md text-base font-medium text-left text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 cursor-pointer"
            >
              Home
            </button>
            <button 
              onClick={() => handleTabChange('all-tools')}
              className={`w-full block px-3 py-2 rounded-md text-base font-medium text-left  cursor-pointer ${
                activeTab === 'all-tools' 
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200' 
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              All Tools
            </button>
            <button 
              onClick={() => handleTabChange('imresize')}
              className={`w-full block px-3 py-2 rounded-md text-base font-medium text-left cursor-pointer ${
                activeTab === 'imresize' 
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200' 
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              ImResize
            </button>
            <button 
              onClick={() => handleTabChange('converter')}
              className={`w-full block px-3 py-2 rounded-md text-base font-medium text-left cursor-pointer ${
                activeTab === 'converter' 
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200' 
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Converter
            </button>
            <button 
              onClick={() => handleTabChange('about')}
              className={`w-full block px-3 py-2 rounded-md text-base font-medium text-left cursor-pointer ${
                activeTab === 'about' 
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200' 
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              About
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 




