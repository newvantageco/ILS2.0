import { useState } from 'react';
import { Menu, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { smoothScrollTo } from '@/lib/scroll-utils';

export function Header() {
  const [, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavClick = (sectionId: string) => {
    setIsMobileMenuOpen(false);
    smoothScrollTo(sectionId);
  };

  const handleLogin = () => {
    setIsMobileMenuOpen(false);
    setLocation('/login');
  };

  const handleSignup = () => {
    setIsMobileMenuOpen(false);
    setLocation('/signup');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => smoothScrollTo('hero')}>
            <Sparkles className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">ILS</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <button
              onClick={() => handleNavClick('features')}
              className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => handleNavClick('pricing')}
              className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
            >
              Pricing
            </button>
            <button
              onClick={() => handleNavClick('ai')}
              className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
            >
              AI Platform
            </button>
            <button
              onClick={() => handleNavClick('marketplace')}
              className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
            >
              Marketplace
            </button>
            <button
              onClick={() => handleNavClick('faq')}
              className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
            >
              Help
            </button>
          </nav>

          {/* Desktop CTA Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={handleLogin}
              className="text-gray-700"
            >
              Log In
            </Button>
            <Button
              onClick={handleSignup}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Get Started Free
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-gray-600 hover:text-blue-600 transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          style={{ top: '64px' }}
        />
      )}

      {/* Mobile Menu Panel */}
      <div
        className={`
          fixed top-16 right-0 h-[calc(100vh-64px)] w-4/5 max-w-sm
          bg-white shadow-xl lg:hidden
          transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <nav className="flex flex-col p-6 space-y-6">
          {/* Navigation Links */}
          <button
            onClick={() => handleNavClick('features')}
            className="text-left text-lg text-gray-700 hover:text-blue-600 font-medium transition-colors py-2"
          >
            Features
          </button>
          <button
            onClick={() => handleNavClick('pricing')}
            className="text-left text-lg text-gray-700 hover:text-blue-600 font-medium transition-colors py-2"
          >
            Pricing
          </button>
          <button
            onClick={() => handleNavClick('ai')}
            className="text-left text-lg text-gray-700 hover:text-blue-600 font-medium transition-colors py-2"
          >
            AI Platform
          </button>
          <button
            onClick={() => handleNavClick('marketplace')}
            className="text-left text-lg text-gray-700 hover:text-blue-600 font-medium transition-colors py-2"
          >
            Marketplace
          </button>
          <button
            onClick={() => handleNavClick('faq')}
            className="text-left text-lg text-gray-700 hover:text-blue-600 font-medium transition-colors py-2"
          >
            Help
          </button>

          {/* Divider */}
          <div className="border-t border-gray-200" />

          {/* CTA Buttons */}
          <Button
            variant="outline"
            onClick={handleLogin}
            className="w-full justify-center text-base py-6"
          >
            Log In
          </Button>
          <Button
            onClick={handleSignup}
            className="w-full justify-center text-base py-6 bg-blue-600 hover:bg-blue-700"
          >
            Get Started Free
          </Button>
        </nav>
      </div>
    </header>
  );
}
