import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FaPlus, FaTrash, FaEye, FaEyeSlash, FaLock, FaLockOpen, FaPen, FaChevronDown, FaChevronRight } from 'react-icons/fa';

/**
 * Layer Manager component for the PDF Editor
 * Manages layers for organizing objects in the PDF editor canvas
 */
const LayerManager = ({
  layers,
  activeLayerId,
  onAddLayer,
  onDeleteLayer,
  onToggleVisibility,
  onToggleLock,
  onRenameLayer,
  onSetActiveLayer
}) => {
  const [expandedLayers, setExpandedLayers] = useState({});
  const [editingLayerName, setEditingLayerName] = useState(null);
  const [newLayerName, setNewLayerName] = useState('');
  
  // Toggle layer expansion
  const toggleLayerExpand = (layerId) => {
    setExpandedLayers(prev => ({
      ...prev,
      [layerId]: !prev[layerId]
    }));
  };
  
  // Start editing layer name
  const startEditingName = (layerId, currentName) => {
    setEditingLayerName(layerId);
    setNewLayerName(currentName);
  };
  
  // Finish editing layer name
  const finishEditingName = () => {
    if (editingLayerName && newLayerName.trim() !== '') {
      onRenameLayer(editingLayerName, newLayerName);
    }
    setEditingLayerName(null);
    setNewLayerName('');
  };
  
  // Handle layer name input change
  const handleNameChange = (e) => {
    setNewLayerName(e.target.value);
  };
  
  // Handle key press for layer name input
  const handleNameKeyPress = (e) => {
    if (e.key === 'Enter') {
      finishEditingName();
    } else if (e.key === 'Escape') {
      setEditingLayerName(null);
      setNewLayerName('');
    }
  };
  
  return (
    <div className="layer-manager" style={{
      width: '250px',
      borderRight: '1px solid #ccc',
      backgroundColor: '#f7f7f7',
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 15px',
        borderBottom: '1px solid #ccc',
        backgroundColor: '#e0e0e0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0 }}>Layers</h3>
        <button
          onClick={() => onAddLayer()}
          title="Add Layer"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          <FaPlus />
        </button>
      </div>
      
      {/* Layers List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '5px'
      }}>
        {layers.length === 0 ? (
          <div style={{ padding: '15px', textAlign: 'center', color: '#666' }}>
            No layers yet. Add a new layer to get started.
          </div>
        ) : (
          layers.map(layer => (
            <div
              key={layer.id}
              style={{
                padding: '8px 10px',
                marginBottom: '3px',
                borderRadius: '4px',
                backgroundColor: activeLayerId === layer.id ? '#e3f2fd' : 'transparent',
                cursor: 'pointer',
                border: '1px solid ' + (activeLayerId === layer.id ? '#bbdefb' : 'transparent')
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    flex: 1,
                    overflow: 'hidden'
                  }}
                  onClick={() => onSetActiveLayer(layer.id)}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLayerExpand(layer.id);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '3px',
                      marginRight: '5px',
                      fontSize: '12px'
                    }}
                  >
                    {expandedLayers[layer.id] ? <FaChevronDown /> : <FaChevronRight />}
                  </button>
                  
                  {editingLayerName === layer.id ? (
                    <input
                      type="text"
                      value={newLayerName}
                      onChange={handleNameChange}
                      onBlur={finishEditingName}
                      onKeyDown={handleNameKeyPress}
                      autoFocus
                      style={{
                        flex: 1,
                        fontSize: '14px',
                        border: '1px solid #ccc',
                        padding: '2px 5px',
                        borderRadius: '3px'
                      }}
                    />
                  ) : (
                    <span style={{ 
                      flex: 1, 
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      opacity: layer.visible ? 1 : 0.5
                    }}>
                      {layer.name}
                    </span>
                  )}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <button
                    onClick={() => onToggleVisibility(layer.id)}
                    title={layer.visible ? 'Hide Layer' : 'Show Layer'}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '3px',
                      marginLeft: '2px'
                    }}
                  >
                    {layer.visible ? <FaEye /> : <FaEyeSlash />}
                  </button>
                  
                  <button
                    onClick={() => onToggleLock(layer.id)}
                    title={layer.locked ? 'Unlock Layer' : 'Lock Layer'}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '3px',
                      marginLeft: '2px'
                    }}
                  >
                    {layer.locked ? <FaLock /> : <FaLockOpen />}
                  </button>
                  
                  <button
                    onClick={() => startEditingName(layer.id, layer.name)}
                    title="Rename Layer"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '3px',
                      marginLeft: '2px'
                    }}
                  >
                    <FaPen />
                  </button>
                  
                  <button
                    onClick={() => onDeleteLayer(layer.id)}
                    title="Delete Layer"
                    disabled={layer.id === 'default'}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: layer.id === 'default' ? 'not-allowed' : 'pointer',
                      padding: '3px',
                      marginLeft: '2px',
                      opacity: layer.id === 'default' ? 0.3 : 1
                    }}
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
              
              {/* Layer objects list - shown when expanded */}
              {expandedLayers[layer.id] && layer.objects.length > 0 && (
                <div style={{
                  marginTop: '5px',
                  marginLeft: '20px',
                  fontSize: '12px'
                }}>
                  {layer.objects.map(objId => (
                    <div key={objId} style={{
                      padding: '3px 5px',
                      borderRadius: '3px',
                      marginBottom: '2px',
                      backgroundColor: '#f0f0f0'
                    }}>
                      Object ID: {objId.slice(0, 8)}...
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      {/* Footer with info */}
      <div style={{
        padding: '10px',
        borderTop: '1px solid #ccc',
        fontSize: '12px',
        color: '#666',
        textAlign: 'center'
      }}>
        {layers.length} layer{layers.length !== 1 ? 's' : ''} • 
        {layers.reduce((count, layer) => count + layer.objects.length, 0)} object{layers.reduce((count, layer) => count + layer.objects.length, 0) !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

LayerManager.propTypes = {
  layers: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    visible: PropTypes.bool.isRequired,
    locked: PropTypes.bool.isRequired,
    objects: PropTypes.arrayOf(PropTypes.string).isRequired
  })).isRequired,
  activeLayerId: PropTypes.string.isRequired,
  onAddLayer: PropTypes.func.isRequired,
  onDeleteLayer: PropTypes.func.isRequired,
  onToggleVisibility: PropTypes.func.isRequired,
  onToggleLock: PropTypes.func.isRequired,
  onRenameLayer: PropTypes.func.isRequired,
  onSetActiveLayer: PropTypes.func.isRequired
};

export default LayerManager; 