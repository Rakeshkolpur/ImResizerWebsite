import React from 'react';

const Header = () => {
  return (
    <header className="bg-white shadow">
      <div className="container mx-auto py-4 px-6 flex justify-between items-center">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-gray-800">ImageResizer Pro</span>
        </div>
        <nav>
          <ul className="flex space-x-6">
            <li>
              <a href="#" className="text-gray-700 hover:text-purple-600 transition-colors">Home</a>
            </li>
            <li>
              <a href="#" className="text-gray-700 hover:text-purple-600 transition-colors">Features</a>
            </li>
            <li>
              <a href="#" className="text-gray-700 hover:text-purple-600 transition-colors">About</a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header; 