import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

/**
 * Custom hook for managing layers in the PDF editor
 * @returns {Object} - Layer state and methods
 */
const useLayerManager = () => {
  // Layer structure:
  // {
  //   id: string (unique identifier),
  //   name: string (display name),
  //   visible: boolean (visibility toggle),
  //   locked: boolean (prevent editing),
  //   objects: Array<string> (IDs of objects in the layer)
  // }
  
  const [layers, setLayers] = useState([
    {
      id: 'default',
      name: 'Default Layer',
      visible: true,
      locked: false,
      objects: []
    }
  ]);
  
  const [activeLayerId, setActiveLayerId] = useState('default');
  
  /**
   * Add a new layer
   * @param {string} name - Name of the new layer
   * @returns {string} - ID of the new layer
   */
  const addLayer = useCallback((name = 'New Layer') => {
    const id = uuidv4();
    
    setLayers(prevLayers => [
      ...prevLayers,
      {
        id,
        name,
        visible: true,
        locked: false,
        objects: []
      }
    ]);
    
    // Set the new layer as active
    setActiveLayerId(id);
    
    return id;
  }, []);
  
  /**
   * Delete a layer
   * @param {string} layerId - ID of the layer to delete
   * @returns {boolean} - Whether the deletion was successful
   */
  const deleteLayer = useCallback((layerId) => {
    // Don't delete if there's only one layer
    if (layers.length <= 1) {
      return false;
    }
    
    // Don't delete the default layer
    if (layerId === 'default') {
      return false;
    }
    
    setLayers(prevLayers => {
      const newLayers = prevLayers.filter(layer => layer.id !== layerId);
      
      // If the active layer is being deleted, set the first layer as active
      if (layerId === activeLayerId) {
        setActiveLayerId(newLayers[0].id);
      }
      
      return newLayers;
    });
    
    return true;
  }, [layers, activeLayerId]);
  
  /**
   * Toggle layer visibility
   * @param {string} layerId - ID of the layer to toggle
   * @returns {boolean} - New visibility state
   */
  const toggleLayerVisibility = useCallback((layerId) => {
    let newVisibility = false;
    
    setLayers(prevLayers => {
      return prevLayers.map(layer => {
        if (layer.id === layerId) {
          newVisibility = !layer.visible;
          return {
            ...layer,
            visible: newVisibility
          };
        }
        return layer;
      });
    });
    
    return newVisibility;
  }, []);
  
  /**
   * Toggle layer lock
   * @param {string} layerId - ID of the layer to toggle
   * @returns {boolean} - New lock state
   */
  const toggleLayerLock = useCallback((layerId) => {
    let newLockState = false;
    
    setLayers(prevLayers => {
      return prevLayers.map(layer => {
        if (layer.id === layerId) {
          newLockState = !layer.locked;
          return {
            ...layer,
            locked: newLockState
          };
        }
        return layer;
      });
    });
    
    return newLockState;
  }, []);
  
  /**
   * Rename a layer
   * @param {string} layerId - ID of the layer to rename
   * @param {string} newName - New name for the layer
   * @returns {boolean} - Whether the renaming was successful
   */
  const renameLayer = useCallback((layerId, newName) => {
    if (!newName || newName.trim() === '') {
      return false;
    }
    
    setLayers(prevLayers => {
      return prevLayers.map(layer => {
        if (layer.id === layerId) {
          return {
            ...layer,
            name: newName.trim()
          };
        }
        return layer;
      });
    });
    
    return true;
  }, []);
  
  /**
   * Add an object to a layer
   * @param {string} layerId - ID of the layer
   * @param {string} objectId - ID of the object to add
   * @returns {boolean} - Whether the addition was successful
   */
  const addObjectToLayer = useCallback((layerId, objectId) => {
    let success = false;
    
    setLayers(prevLayers => {
      return prevLayers.map(layer => {
        if (layer.id === layerId) {
          // Check if the object is already in this layer
          if (!layer.objects.includes(objectId)) {
            success = true;
            return {
              ...layer,
              objects: [...layer.objects, objectId]
            };
          }
        }
        return layer;
      });
    });
    
    return success;
  }, []);
  
  /**
   * Remove an object from a layer
   * @param {string} layerId - ID of the layer
   * @param {string} objectId - ID of the object to remove
   * @returns {boolean} - Whether the removal was successful
   */
  const removeObjectFromLayer = useCallback((layerId, objectId) => {
    let success = false;
    
    setLayers(prevLayers => {
      return prevLayers.map(layer => {
        if (layer.id === layerId) {
          success = true;
          return {
            ...layer,
            objects: layer.objects.filter(id => id !== objectId)
          };
        }
        return layer;
      });
    });
    
    return success;
  }, []);
  
  /**
   * Move an object to another layer
   * @param {string} objectId - ID of the object to move
   * @param {string} sourceLayerId - ID of the source layer
   * @param {string} targetLayerId - ID of the target layer
   * @returns {boolean} - Whether the move was successful
   */
  const moveObjectToLayer = useCallback((objectId, sourceLayerId, targetLayerId) => {
    if (sourceLayerId === targetLayerId) {
      return false;
    }
    
    // Remove from source layer
    const removed = removeObjectFromLayer(sourceLayerId, objectId);
    
    if (!removed) {
      return false;
    }
    
    // Add to target layer
    return addObjectToLayer(targetLayerId, objectId);
  }, [removeObjectFromLayer, addObjectToLayer]);
  
  /**
   * Get the active layer
   * @returns {Object|null} - The active layer object or null
   */
  const getActiveLayer = useCallback(() => {
    return layers.find(layer => layer.id === activeLayerId) || null;
  }, [layers, activeLayerId]);
  
  /**
   * Check if a layer is visible
   * @param {string} layerId - ID of the layer to check
   * @returns {boolean} - Whether the layer is visible
   */
  const isLayerVisible = useCallback((layerId) => {
    const layer = layers.find(layer => layer.id === layerId);
    return layer ? layer.visible : false;
  }, [layers]);
  
  /**
   * Check if a layer is locked
   * @param {string} layerId - ID of the layer to check
   * @returns {boolean} - Whether the layer is locked
   */
  const isLayerLocked = useCallback((layerId) => {
    const layer = layers.find(layer => layer.id === layerId);
    return layer ? layer.locked : false;
  }, [layers]);
  
  /**
   * Get all visible layers
   * @returns {Array} - Array of visible layer objects
   */
  const getVisibleLayers = useCallback(() => {
    return layers.filter(layer => layer.visible);
  }, [layers]);
  
  /**
   * Get all unlocked layers
   * @returns {Array} - Array of unlocked layer objects
   */
  const getUnlockedLayers = useCallback(() => {
    return layers.filter(layer => !layer.locked);
  }, [layers]);
  
  /**
   * Find which layer an object belongs to
   * @param {string} objectId - ID of the object
   * @returns {string|null} - ID of the layer or null
   */
  const findObjectLayer = useCallback((objectId) => {
    for (const layer of layers) {
      if (layer.objects.includes(objectId)) {
        return layer.id;
      }
    }
    return null;
  }, [layers]);
  
  return {
    layers,
    activeLayerId,
    setActiveLayerId,
    addLayer,
    deleteLayer,
    toggleLayerVisibility,
    toggleLayerLock,
    renameLayer,
    addObjectToLayer,
    removeObjectFromLayer,
    moveObjectToLayer,
    getActiveLayer,
    isLayerVisible,
    isLayerLocked,
    getVisibleLayers,
    getUnlockedLayers,
    findObjectLayer
  };
};

export default useLayerManager; 