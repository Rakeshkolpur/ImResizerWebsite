import React, { useState, useEffect } from 'react';
import styles from './Navigation.module.css';

const Navigation = ({ darkMode, toggleDarkMode, onToolSelect }) => {
  const [activeTab, setActiveTab] = useState('imresize');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrollDirection, setScrollDirection] = useState('down');

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIsMenuOpen(false);
    setShowDropdown(null);

    // Pass the selected tool to the App component
    if (onToolSelect) {
      // Special handling for category headers
      if (tab === 'all-tools') {
        onToolSelect('category-all-tools');
      } else if (tab === 'pdf-tools') {
        onToolSelect('category-pdf-tools');
      } else if (tab === 'imresize') {
        onToolSelect('category-image-tools');
      } else if (tab === 'converter') {
        onToolSelect('category-converters');
      } else {
        onToolSelect(tab);
      }
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

  // Handle scroll event for sticky navbar
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Determine if we've scrolled more than 50px
      if (currentScrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
      
      // Determine scroll direction
      if (currentScrollY > lastScrollY) {
        setScrollDirection('down');
      } else {
        setScrollDirection('up');
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

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
    <a href="#" onClick={(e) => { e.preventDefault(); handleTabChange('pdf-compressor'); }} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-gray-700 cursor-pointer">PDF Compressor</a>
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
      case 'pdf-tools':
        return (
          <div className="absolute top-full left-0 mt-1 w-60 bg-white dark:bg-gray-800 shadow-lg rounded-lg py-2 z-10">
            <a href="#" onClick={(e) => { e.preventDefault(); handleTabChange('extract_text'); }} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-gray-700 cursor-pointer">Extract Text</a>
            <a href="#" onClick={(e) => { e.preventDefault(); handleTabChange('pdf-compressor'); }} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-gray-700 cursor-pointer">PDF Compressor</a>
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

  // Navbar classes based on scroll state
  const navbarClasses = `
    ${scrolled ? styles.navbarScrolled : ''} 
    ${scrollDirection === 'up' ? styles.navbarSticky : ''}
    ${darkMode && scrolled ? styles.dark : ''}
    border-b border-gray-200 dark:border-gray-700 transition-all duration-300
    ${!scrolled ? 'bg-white dark:bg-gray-800' : ''}
  `;

  return (
    <nav className={navbarClasses}>
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
                className={`${styles.navItem} ${scrollDirection === 'up' ? styles.navItemHover : ''} px-3 py-2 rounded-md text-sm font-medium cursor-pointer ${
                  !activeTab
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-gray-700 hover:text-purple-600 dark:text-gray-200 dark:hover:text-purple-400'
                }`}
              >
                Home
              </button>

              <div 
                className={`relative ${styles.navItem} ${scrollDirection === 'up' ? styles.navItemHover : ''}`} 
                onMouseEnter={() => handleMouseEnter('all-tools')} 
                onMouseLeave={handleMouseLeave}
              >
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
                {showDropdown === 'all-tools' && (
                  <div className={styles.fadeIn}>
                    {getDropdownContent('all-tools')}
                  </div>
                )}
              </div>

              <div 
                className={`relative ${styles.navItem} ${scrollDirection === 'up' ? styles.navItemHover : ''}`} 
                onMouseEnter={() => handleMouseEnter('imresize')} 
                onMouseLeave={handleMouseLeave}
              >
                <button
                  onClick={() => handleTabChange('imresize')}
                  className={`px-3 py-2 rounded-md text-sm font-medium cursor-pointer ${
                    activeTab === 'imresize'
                      ? 'text-purple-600 dark:text-purple-400'
                      : 'text-gray-700 hover:text-purple-600 dark:text-gray-200 dark:hover:text-purple-400'
                  }`}
                >
                  Image Tools
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showDropdown === 'imresize' && (
                  <div className={styles.fadeIn}>
                    {getDropdownContent('imresize')}
                  </div>
                )}
              </div>

              <div 
                className={`relative ${styles.navItem} ${scrollDirection === 'up' ? styles.navItemHover : ''}`} 
                onMouseEnter={() => handleMouseEnter('pdf-tools')} 
                onMouseLeave={handleMouseLeave}
              >
                <button
                  onClick={() => handleTabChange('pdf-tools')}
                  className={`px-3 py-2 rounded-md text-sm font-medium cursor-pointer ${
                    activeTab === 'pdf-tools'
                      ? 'text-purple-600 dark:text-purple-400'
                      : 'text-gray-700 hover:text-purple-600 dark:text-gray-200 dark:hover:text-purple-400'
                  }`}
                >
                  PDF Tools
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showDropdown === 'pdf-tools' && (
                  <div className={styles.fadeIn}>
                    <div className="absolute top-full left-0 mt-1 w-60 bg-white dark:bg-gray-800 shadow-lg rounded-lg py-2 z-10">
                      <a href="#" onClick={(e) => { e.preventDefault(); handleTabChange('extract_text'); }} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-gray-700 cursor-pointer">Extract Text</a>
                      <a href="#" onClick={(e) => { e.preventDefault(); handleTabChange('pdf-compressor'); }} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-gray-700 cursor-pointer">PDF Compressor</a>
                    </div>
                  </div>
                )}
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
            </div>
          </div>

          {/* Dark mode toggle and mobile menu button */}
          <div className="flex items-center">
            {/* Dark mode toggle button */}
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white focus:outline-none ${styles.navItem} ${scrollDirection === 'up' ? styles.navItemHover : ''}`}
            >
              {darkMode ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>

            {/* Mobile menu button */}
            <div className="md:hidden ml-4">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
              >
                <svg className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <svg className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`${isMenuOpen ? styles.scaleIn : 'hidden'} md:hidden bg-white dark:bg-gray-800 pt-2 pb-3 space-y-1 border-t border-gray-200 dark:border-gray-700`}>
          <button 
            onClick={() => handleTabChange('home')}
            className={`w-full block px-3 py-2 rounded-md text-base font-medium text-left cursor-pointer ${
              !activeTab 
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200' 
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Home
          </button>
          <button 
            onClick={() => handleTabChange('imresize')}
            className={`w-full block px-3 py-2 rounded-md text-base font-medium text-left cursor-pointer ${
              activeTab === 'imresize' 
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200' 
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Image Tools
          </button>
          <button 
            onClick={() => handleTabChange('pdf-tools')}
            className={`w-full block px-3 py-2 rounded-md text-base font-medium text-left cursor-pointer ${
              activeTab === 'pdf-tools' 
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200' 
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            PDF Tools
          </button>
          <button 
            onClick={() => handleTabChange('converter')}
            className={`w-full block px-3 py-2 rounded-md text-base font-medium text-left cursor-pointer ${
              activeTab === 'converter' 
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200' 
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Converters
          </button>
          <button 
            onClick={() => handleTabChange('all-tools')}
            className={`w-full block px-3 py-2 rounded-md text-base font-medium text-left cursor-pointer ${
              activeTab === 'all-tools' 
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200' 
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            All Tools
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 




