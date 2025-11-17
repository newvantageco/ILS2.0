import { useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  description: string;
  action: () => void;
  global?: boolean; // If true, works on all pages
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

/**
 * Hook for managing keyboard shortcuts
 * 
 * Supports both global shortcuts (work everywhere) and page-specific shortcuts
 * 
 * @example
 * useKeyboardShortcuts({
 *   shortcuts: [
 *     { key: 'n', metaKey: true, description: 'New patient', action: () => navigate('/patients/new'), global: true },
 *     { key: 's', ctrlKey: true, description: 'Save', action: handleSave }
 *   ]
 * });
 */
export function useKeyboardShortcuts({ shortcuts, enabled = true }: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in input fields (except global ones)
      const target = event.target as HTMLElement;
      const isInputField = 
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable;

      for (const shortcut of shortcuts) {
        // Skip non-global shortcuts when in input fields
        if (isInputField && !shortcut.global) continue;

        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = shortcut.ctrlKey === undefined || shortcut.ctrlKey === event.ctrlKey;
        const metaMatches = shortcut.metaKey === undefined || shortcut.metaKey === event.metaKey;
        const shiftMatches = shortcut.shiftKey === undefined || shortcut.shiftKey === event.shiftKey;
        const altMatches = shortcut.altKey === undefined || shortcut.altKey === event.altKey;

        if (keyMatches && ctrlMatches && metaMatches && shiftMatches && altMatches) {
          event.preventDefault();
          event.stopPropagation();
          shortcut.action();
          break;
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);
}

/**
 * Format keyboard shortcut for display
 * 
 * @example
 * formatShortcut({ key: 'n', metaKey: true }) => '⌘N' (on Mac) or 'Ctrl+N' (on Windows)
 */
export function formatShortcut(shortcut: Pick<KeyboardShortcut, 'key' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey'>): string {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const parts: string[] = [];

  if (shortcut.ctrlKey) parts.push(isMac ? '⌃' : 'Ctrl');
  if (shortcut.altKey) parts.push(isMac ? '⌥' : 'Alt');
  if (shortcut.shiftKey) parts.push(isMac ? '⇧' : 'Shift');
  if (shortcut.metaKey) parts.push(isMac ? '⌘' : 'Ctrl');
  
  parts.push(shortcut.key.toUpperCase());

  return isMac ? parts.join('') : parts.join('+');
}

/**
 * Get modifier key based on platform
 */
export function getModifierKey(): { key: 'metaKey' | 'ctrlKey', symbol: string } {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  return isMac 
    ? { key: 'metaKey', symbol: '⌘' }
    : { key: 'ctrlKey', symbol: 'Ctrl' };
}
