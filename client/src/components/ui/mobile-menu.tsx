import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';

interface MobileMenuProps {
  className?: string;
}

export function MobileMenu({ className }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const menuItems = [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'AI Assistant', href: '#ai' },
    { label: 'Marketplace', href: '/marketplace' },
    { label: 'Help', href: '/help' },
  ];

  return (
    <div className={cn('lg:hidden', className)}>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMenu}
        className="relative z-50"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={toggleMenu}
        />
      )}

      {/* Menu Panel */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-4/5 max-w-sm bg-white shadow-xl z-40 transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="p-6 space-y-6">
          {/* Logo */}
          <div className="border-b pb-4">
            <h2 className="text-xl font-bold text-gray-900">ILS</h2>
            <p className="text-sm text-gray-600">Integrated Lens System</p>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <a
                  className="block px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  onClick={toggleMenu}
                >
                  {item.label}
                </a>
              </Link>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="pt-4 border-t space-y-3">
            <Link href="/login">
              <Button
                variant="outline"
                className="w-full"
                onClick={toggleMenu}
              >
                Log In
              </Button>
            </Link>
            <Link href="/signup">
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={toggleMenu}
              >
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
