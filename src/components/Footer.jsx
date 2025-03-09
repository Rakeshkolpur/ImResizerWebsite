import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-8">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">ImageResizer Pro</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              The most advanced online image resizing tool with features for all your image editing needs.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Features</h3>
            <ul className="text-gray-600 dark:text-gray-300 text-sm space-y-2">
              <li><a href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Image Resizing</a></li>
              <li><a href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Format Conversion</a></li>
              <li><a href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Image Compression</a></li>
              <li><a href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">PDF Tools</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Resources</h3>
            <ul className="text-gray-600 dark:text-gray-300 text-sm space-y-2">
              <li><a href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">User Guide</a></li>
              <li><a href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">API Documentation</a></li>
              <li><a href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">FAQ</a></li>
              <li><a href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Support</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Connect</h3>
            <ul className="text-gray-600 dark:text-gray-300 text-sm space-y-2">
              <li><a href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Twitter</a></li>
              <li><a href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Facebook</a></li>
              <li><a href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Instagram</a></li>
              <li><a href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">GitHub</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            &copy; {new Date().getFullYear()} ImageResizer Pro. All rights reserved.
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors text-sm">Privacy Policy</a>
            <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors text-sm">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 