import { useState, useCallback } from 'react';

/**
 * Custom hook for managing undo and redo functionality
 */
const useUndoRedo = () => {
  // Stacks for undo and redo operations
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  /**
   * Add an action to the undo stack
   * @param {Object} action - The action to add
   */
  const addAction = useCallback((action) => {
    setUndoStack(prev => [...prev, action]);
    setRedoStack([]); // Clear redo stack when new action is added
  }, []);

  /**
   * Undo the last action
   * @returns {Object|null} The undone action or null if no action to undo
   */
  const undo = useCallback(() => {
    if (undoStack.length === 0) return null;

    // Get the last action from undo stack
    const action = undoStack[undoStack.length - 1];
    
    // Remove the action from undo stack
    setUndoStack(prev => prev.slice(0, prev.length - 1));
    
    // Add the action to redo stack
    setRedoStack(prev => [...prev, action]);
    
    return action;
  }, [undoStack]);

  /**
   * Redo the last undone action
   * @returns {Object|null} The redone action or null if no action to redo
   */
  const redo = useCallback(() => {
    if (redoStack.length === 0) return null;

    // Get the last action from redo stack
    const action = redoStack[redoStack.length - 1];
    
    // Remove the action from redo stack
    setRedoStack(prev => prev.slice(0, prev.length - 1));
    
    // Add the action to undo stack
    setUndoStack(prev => [...prev, action]);
    
    return action;
  }, [redoStack]);

  /**
   * Clear both undo and redo stacks
   */
  const clearHistory = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
  }, []);

  return {
    undoStack,
    redoStack,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    addAction,
    undo,
    redo,
    clearHistory
  };
};

export default useUndoRedo; 