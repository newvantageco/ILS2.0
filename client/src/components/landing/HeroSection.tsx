import { ArrowRight, CheckCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { useState, useEffect } from 'react';

export function HeroSection() {
  const [, setLocation] = useLocation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    setIsVisible(true);
  }, []);

  const handleFreeSignup = () => {
    setLocation('/signup');
  };

  const handleBookDemo = () => {
    // Scroll to contact or open demo booking
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  return (
    <section className="relative bg-gradient-to-b from-blue-50 to-white py-20 md:py-32 overflow-hidden pt-32 md:pt-40">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Column: Text Content */}
          <div className={`text-center md:text-left transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <Sparkles className="h-4 w-4" />
              <span>AI-Powered Platform</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              The All-in-One Platform for{' '}
              <span className="text-blue-600 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Modern Eyecare
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
              Unify your practice, lab, and suppliers. From exam to lens order to POS.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start mb-8">
              <Button
                size="lg"
                onClick={handleFreeSignup}
                className="text-lg px-8 py-6 bg-blue-600 hover:bg-blue-700"
              >
                Start Free ECP Plan
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                onClick={handleBookDemo}
                className="text-lg px-8 py-6 border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                Book a Demo
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Setup in under 5 minutes</span>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Join 50+ optical practices</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Image/Screenshot */}
          <div className={`relative transition-all duration-1000 delay-300 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
          }`}>
            <div className="relative rounded-lg shadow-2xl overflow-hidden border border-gray-200">
              {/* Placeholder for product screenshot */}
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 aspect-[4/3] flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="bg-white rounded-lg shadow-lg p-8 mb-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-3 w-3 rounded-full bg-red-500"></div>
                      <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      <div className="mt-6 grid grid-cols-3 gap-4">
                        <div className="h-20 bg-blue-100 rounded"></div>
                        <div className="h-20 bg-green-100 rounded"></div>
                        <div className="h-20 bg-purple-100 rounded"></div>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 font-medium">
                    Unified Dashboard • AI Assistant • Real-time Insights
                  </p>
                </div>
              </div>
            </div>

            {/* Floating Stats Cards */}
            <div className="absolute -bottom-6 -left-6 bg-white rounded-lg shadow-lg p-4 border border-gray-100">
              <div className="text-2xl font-bold text-blue-600">50+</div>
              <div className="text-sm text-gray-600">Active Practices</div>
            </div>
            
            <div className="absolute -top-6 -right-6 bg-white rounded-lg shadow-lg p-4 border border-gray-100">
              <div className="text-2xl font-bold text-green-600">99.9%</div>
              <div className="text-sm text-gray-600">Uptime</div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 -z-10 opacity-10">
        <svg width="404" height="404" fill="none" viewBox="0 0 404 404">
          <defs>
            <pattern id="grid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="2" fill="currentColor" className="text-blue-600" />
            </pattern>
          </defs>
          <rect width="404" height="404" fill="url(#grid)" />
        </svg>
      </div>
    </section>
  );
}
