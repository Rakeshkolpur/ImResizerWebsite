import React from 'react';
import PropTypes from 'prop-types';
import styles from '../PDFEditor.module.css';

/**
 * SettingsPanel component for configuring PDF editor settings
 */
const SettingsPanel = ({ settings = {}, onSettingsChange, onClose }) => {
  // Default settings with fallbacks
  const currentSettings = {
    enableSnapping: settings.enableSnapping ?? true,
    snapThreshold: settings.snapThreshold ?? 10,
    showGrid: settings.showGrid ?? false,
    gridSize: settings.gridSize ?? 20,
    autosaveInterval: settings.autosaveInterval ?? 0, // 0 means disabled
    historyLimit: settings.historyLimit ?? 50,
    enableAutoCompress: settings.enableAutoCompress ?? true,
    defaultTextFont: settings.defaultTextFont ?? 'Helvetica',
    defaultTextSize: settings.defaultTextSize ?? 16,
    ...settings
  };

  // Handle checkbox change
  const handleCheckboxChange = (key) => {
    onSettingsChange({
      ...currentSettings,
      [key]: !currentSettings[key]
    });
  };

  // Handle number input change
  const handleNumberChange = (key, value) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      onSettingsChange({
        ...currentSettings,
        [key]: numValue
      });
    }
  };

  // Handle text input change
  const handleTextChange = (key, value) => {
    onSettingsChange({
      ...currentSettings,
      [key]: value
    });
  };

  return (
    <div className={styles.settingsPanel}>
      <div className={styles.settingsHeader}>
        <h3>Settings</h3>
        <button 
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
      </div>
      
      <div className={styles.settingsContent}>
        <div className={styles.settingsSection}>
          <h4 className={styles.settingsSectionTitle}>Canvas Settings</h4>
          
          {/* Grid Settings */}
          <div className={styles.settingItem}>
            <label className={styles.settingLabel}>
              <input
                type="checkbox"
                checked={currentSettings.showGrid}
                onChange={() => handleCheckboxChange('showGrid')}
                className={styles.checkbox}
              />
              Show Grid
            </label>
          </div>
          
          {currentSettings.showGrid && (
            <div className={styles.settingItem}>
              <label className={styles.settingLabel}>
                Grid Size:
                <input
                  type="number"
                  value={currentSettings.gridSize}
                  onChange={(e) => handleNumberChange('gridSize', e.target.value)}
                  min="5"
                  max="100"
                  className={styles.numberInput}
                />
              </label>
            </div>
          )}
          
          {/* Snapping Settings */}
          <div className={styles.settingItem}>
            <label className={styles.settingLabel}>
              <input
                type="checkbox"
                checked={currentSettings.enableSnapping}
                onChange={() => handleCheckboxChange('enableSnapping')}
                className={styles.checkbox}
              />
              Enable Snapping
            </label>
          </div>
          
          {currentSettings.enableSnapping && (
            <div className={styles.settingItem}>
              <label className={styles.settingLabel}>
                Snap Threshold:
                <input
                  type="number"
                  value={currentSettings.snapThreshold}
                  onChange={(e) => handleNumberChange('snapThreshold', e.target.value)}
                  min="1"
                  max="50"
                  className={styles.numberInput}
                />
              </label>
            </div>
          )}
        </div>
        
        <div className={styles.settingsSection}>
          <h4 className={styles.settingsSectionTitle}>Document Settings</h4>
          
          {/* Autosave Settings */}
          <div className={styles.settingItem}>
            <label className={styles.settingLabel}>
              Autosave Interval (seconds, 0 to disable):
              <input
                type="number"
                value={currentSettings.autosaveInterval}
                onChange={(e) => handleNumberChange('autosaveInterval', e.target.value)}
                min="0"
                max="3600"
                className={styles.numberInput}
              />
            </label>
          </div>
          
          {/* History Limit */}
          <div className={styles.settingItem}>
            <label className={styles.settingLabel}>
              History Limit:
              <input
                type="number"
                value={currentSettings.historyLimit}
                onChange={(e) => handleNumberChange('historyLimit', e.target.value)}
                min="10"
                max="200"
                className={styles.numberInput}
              />
            </label>
          </div>
          
          {/* Auto Compress */}
          <div className={styles.settingItem}>
            <label className={styles.settingLabel}>
              <input
                type="checkbox"
                checked={currentSettings.enableAutoCompress}
                onChange={() => handleCheckboxChange('enableAutoCompress')}
                className={styles.checkbox}
              />
              Compress Images on Insert
            </label>
          </div>
        </div>
        
        <div className={styles.settingsSection}>
          <h4 className={styles.settingsSectionTitle}>Default Styles</h4>
          
          {/* Default Text Font */}
          <div className={styles.settingItem}>
            <label className={styles.settingLabel}>
              Default Text Font:
              <select
                value={currentSettings.defaultTextFont}
                onChange={(e) => handleTextChange('defaultTextFont', e.target.value)}
                className={styles.select}
              >
                <option value="Helvetica">Helvetica</option>
                <option value="Times Roman">Times Roman</option>
                <option value="Courier">Courier</option>
                <option value="Arial">Arial</option>
                <option value="Verdana">Verdana</option>
              </select>
            </label>
          </div>
          
          {/* Default Text Size */}
          <div className={styles.settingItem}>
            <label className={styles.settingLabel}>
              Default Text Size:
              <input
                type="number"
                value={currentSettings.defaultTextSize}
                onChange={(e) => handleNumberChange('defaultTextSize', e.target.value)}
                min="8"
                max="72"
                className={styles.numberInput}
              />
            </label>
          </div>
        </div>
        
        <div className={styles.settingsActions}>
          <button 
            onClick={() => {
              // Reset to defaults
              onSettingsChange({
                enableSnapping: true,
                snapThreshold: 10,
                showGrid: false,
                gridSize: 20,
                autosaveInterval: 0,
                historyLimit: 50,
                enableAutoCompress: true,
                defaultTextFont: 'Helvetica',
                defaultTextSize: 16
              });
            }}
            className={styles.resetButton}
          >
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
};

SettingsPanel.propTypes = {
  /** Current settings object */
  settings: PropTypes.object,
  /** Callback for settings changes */
  onSettingsChange: PropTypes.func,
  /** Callback for closing the panel */
  onClose: PropTypes.func.isRequired
};

export default SettingsPanel; 