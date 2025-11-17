import { useKeyboardShortcuts, getModifierKey } from '@/hooks/useKeyboardShortcuts';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Keyboard } from 'lucide-react';

/**
 * Global Keyboard Shortcuts Component
 * 
 * Implements application-wide keyboard shortcuts for quick navigation
 * and common actions. Automatically adjusts for Mac (Cmd) vs Windows (Ctrl).
 */
export function GlobalKeyboardShortcuts() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [showHelp, setShowHelp] = useState(false);
  const modKey = getModifierKey();

  // Define global shortcuts based on user role
  const shortcuts = [
    // Command Palette - Universal
    {
      key: 'k',
      [modKey.key]: true,
      description: 'Open command palette',
      action: () => {
        // TODO: Open command palette when implemented
        console.log('Command palette - Coming soon!');
      },
      global: true,
    },
    
    // Help - Universal
    {
      key: '/',
      [modKey.key]: true,
      description: 'Show keyboard shortcuts',
      action: () => setShowHelp(true),
      global: true,
    },

    // Settings - Universal
    {
      key: ',',
      [modKey.key]: true,
      description: 'Open settings',
      action: () => setLocation('/settings'),
      global: true,
    },

    // ECP-specific shortcuts
    ...(user?.role === 'ecp' ? [
      {
        key: 'n',
        [modKey.key]: true,
        description: 'New patient',
        action: () => setLocation('/ecp/patients?new=true'),
        global: true,
      },
      {
        key: 'e',
        [modKey.key]: true,
        description: 'New examination',
        action: () => setLocation('/ecp/examinations'),
        global: true,
      },
      {
        key: 'o',
        [modKey.key]: true,
        description: 'New order',
        action: () => setLocation('/ecp/new-order'),
        global: true,
      },
      {
        key: 'p',
        [modKey.key]: true,
        description: 'Point of sale',
        action: () => setLocation('/ecp/pos'),
        global: true,
      },
      {
        key: 'd',
        [modKey.key]: true,
        description: 'Dashboard',
        action: () => setLocation('/ecp/dashboard'),
        global: true,
      },
    ] : []),

    // Lab Tech shortcuts
    ...(user?.role === 'lab_tech' ? [
      {
        key: 'q',
        [modKey.key]: true,
        description: 'Order queue',
        action: () => setLocation('/lab/queue'),
        global: true,
      },
      {
        key: 'd',
        [modKey.key]: true,
        description: 'Dashboard',
        action: () => setLocation('/lab/dashboard'),
        global: true,
      },
    ] : []),

    // Admin shortcuts
    ...(user?.role === 'admin' || user?.role === 'platform_admin' ? [
      {
        key: 'u',
        [modKey.key]: true,
        description: 'Users',
        action: () => setLocation(user.role === 'platform_admin' ? '/platform-admin/users' : '/admin/users'),
        global: true,
      },
      {
        key: 'd',
        [modKey.key]: true,
        description: 'Dashboard',
        action: () => setLocation(user.role === 'platform_admin' ? '/platform-admin/dashboard' : '/admin/dashboard'),
        global: true,
      },
    ] : []),
  ];

  useKeyboardShortcuts({
    shortcuts,
    enabled: true,
  });

  // Keyboard shortcuts help modal
  return (
    <Dialog open={showHelp} onOpenChange={setShowHelp}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Speed up your workflow with these keyboard shortcuts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Global Shortcuts */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Global Shortcuts</h3>
            <div className="space-y-2">
              <ShortcutRow 
                keys={`${modKey.symbol}K`} 
                description="Open command palette" 
                badge="Coming Soon" 
              />
              <ShortcutRow 
                keys={`${modKey.symbol}/`} 
                description="Show keyboard shortcuts" 
              />
              <ShortcutRow 
                keys={`${modKey.symbol},`} 
                description="Open settings" 
              />
              <ShortcutRow 
                keys={`${modKey.symbol}D`} 
                description="Go to dashboard" 
              />
            </div>
          </div>

          {/* Role-specific shortcuts */}
          {user?.role === 'ecp' && (
            <div>
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">ECP Shortcuts</h3>
              <div className="space-y-2">
                <ShortcutRow keys={`${modKey.symbol}N`} description="New patient" />
                <ShortcutRow keys={`${modKey.symbol}E`} description="New examination" />
                <ShortcutRow keys={`${modKey.symbol}O`} description="New order" />
                <ShortcutRow keys={`${modKey.symbol}P`} description="Point of sale" />
              </div>
            </div>
          )}

          {user?.role === 'lab_tech' && (
            <div>
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Lab Shortcuts</h3>
              <div className="space-y-2">
                <ShortcutRow keys={`${modKey.symbol}Q`} description="Order queue" />
              </div>
            </div>
          )}

          {(user?.role === 'admin' || user?.role === 'platform_admin') && (
            <div>
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Admin Shortcuts</h3>
              <div className="space-y-2">
                <ShortcutRow keys={`${modKey.symbol}U`} description="User management" />
              </div>
            </div>
          )}

          {/* General Tips */}
          <div className="pt-4 border-t">
            <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Tips</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Shortcuts work from anywhere in the app</li>
              <li>• Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">{modKey.symbol}/</kbd> anytime to see this help</li>
              <li>• More shortcuts coming soon (page-specific actions)</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ShortcutRow({ keys, description, badge }: { keys: string; description: string; badge?: string }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50">
      <span className="text-sm">{description}</span>
      <div className="flex items-center gap-2">
        {badge && <Badge variant="secondary" className="text-xs">{badge}</Badge>}
        <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono font-medium">
          {keys}
        </kbd>
      </div>
    </div>
  );
}
