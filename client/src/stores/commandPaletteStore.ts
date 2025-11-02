/**
 * Command Palette Global Store
 * 
 * Manages the open/closed state of the command palette globally.
 * This allows any component to trigger the command palette programmatically.
 * 
 * Using a simple event-driven approach instead of a full state management library.
 */

import * as React from "react";

type CommandPaletteListener = (isOpen: boolean) => void;

class CommandPaletteManager {
  private listeners: Set<CommandPaletteListener> = new Set();
  private _isOpen = false;

  get isOpen() {
    return this._isOpen;
  }

  subscribe(listener: CommandPaletteListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this._isOpen));
  }

  open() {
    if (!this._isOpen) {
      this._isOpen = true;
      this.notify();
    }
  }

  close() {
    if (this._isOpen) {
      this._isOpen = false;
      this.notify();
    }
  }

  toggle() {
    this._isOpen = !this._isOpen;
    this.notify();
  }
}

export const commandPaletteManager = new CommandPaletteManager();

// React hook for components
export function useCommandPaletteState() {
  const [isOpen, setIsOpen] = React.useState(commandPaletteManager.isOpen);

  React.useEffect(() => {
    return commandPaletteManager.subscribe(setIsOpen);
  }, []);

  return {
    isOpen,
    open: () => commandPaletteManager.open(),
    close: () => commandPaletteManager.close(),
    toggle: () => commandPaletteManager.toggle(),
  };
}
