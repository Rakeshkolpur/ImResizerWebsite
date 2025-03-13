import { useState, useCallback, useEffect } from 'react';

/**
 * Default settings for the PDF editor
 */
const defaultSettings = {
  // Canvas settings
  snapToGrid: false,
  gridSize: 10,
  showRulers: false,
  
  // Drawing settings
  brushSize: 2,
  brushColor: '#000000',
  highlightColor: 'rgba(255, 255, 0, 0.4)',
  
  // Text settings
  defaultFontFamily: 'Arial',
  defaultFontSize: 20,
  defaultTextColor: '#000000',
  
  // Shape settings
  defaultShapeFill: 'transparent',
  defaultShapeStroke: '#000000',
  defaultShapeStrokeWidth: 2,
  
  // Theme settings
  darkMode: false,
  
  // Performance settings
  enableGPU: true,
  useHighQualityRendering: true,
  
  // Auto-save settings
  autoSaveEnabled: true,
  autoSaveInterval: 60000, // 1 minute
  
  // User interface settings
  showTooltips: true,
  interfaceScale: 1.0
};

/**
 * Custom hook for managing settings in the PDF editor
 * @param {Object} initialSettings - Initial settings to override defaults
 * @returns {Object} - Settings state and methods
 */
const useSettings = (initialSettings = {}) => {
  // Initialize settings with defaults and overrides
  const [settings, setSettings] = useState({
    ...defaultSettings,
    ...initialSettings
  });
  
  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('pdfEditorSettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(prevSettings => ({
          ...prevSettings,
          ...parsedSettings
        }));
      }
    } catch (error) {
      console.error('Error loading settings from localStorage:', error);
    }
  }, []);
  
  // Save settings to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('pdfEditorSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings to localStorage:', error);
    }
  }, [settings]);
  
  /**
   * Update a specific setting
   * @param {string} key - The setting key to update
   * @param {any} value - The new value for the setting
   */
  const updateSetting = useCallback((key, value) => {
    if (Object.prototype.hasOwnProperty.call(settings, key)) {
      setSettings(prevSettings => ({
        ...prevSettings,
        [key]: value
      }));
    } else {
      console.warn(`Attempted to update unknown setting: ${key}`);
    }
  }, [settings]);
  
  /**
   * Update multiple settings at once
   * @param {Object} updates - Object with key-value pairs to update
   */
  const updateSettings = useCallback((updates) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      ...updates
    }));
  }, []);
  
  /**
   * Reset settings to defaults
   */
  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
  }, []);
  
  /**
   * Export settings to JSON
   * @returns {string} - JSON string of settings
   */
  const exportSettings = useCallback(() => {
    try {
      return JSON.stringify(settings, null, 2);
    } catch (error) {
      console.error('Error exporting settings:', error);
      return '{}';
    }
  }, [settings]);
  
  /**
   * Import settings from JSON
   * @param {string} json - JSON string of settings
   * @returns {boolean} - Whether the import was successful
   */
  const importSettings = useCallback((json) => {
    try {
      const parsedSettings = JSON.parse(json);
      setSettings(prevSettings => ({
        ...prevSettings,
        ...parsedSettings
      }));
      return true;
    } catch (error) {
      console.error('Error importing settings:', error);
      return false;
    }
  }, []);
  
  return {
    settings,
    updateSetting,
    updateSettings,
    resetSettings,
    exportSettings,
    importSettings
  };
};

export default useSettings; 