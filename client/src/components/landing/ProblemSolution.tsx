import { useState, useRef, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { useIntersectionObserver } from '@/lib/scroll-utils';

export function ProblemSolution() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useIntersectionObserver((isIntersecting) => {
    if (isIntersecting) {
      setIsVisible(true);
    }
  }, { threshold: 0.1 });

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const problems = [
    'Prescription system',
    'POS system',
    'Lab ordering system',
    'Excel inventory tracking',
    'Email for supplier orders',
    'Separate analytics tools',
  ];

  return (
    <section ref={sectionRef} className="py-20 bg-white">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className={`text-center mb-16 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Stop Juggling Multiple Systems
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Running an optical practice shouldn't mean managing a dozen disconnected tools
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left: Problems */}
          <div className={`space-y-4 transition-all duration-1000 delay-200 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
          }`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <X className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">The Old Way</h3>
            </div>

            {problems.map((problem, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-200"
              >
                <X className="h-5 w-5 text-red-600 flex-shrink-0" />
                <span className="text-gray-700">{problem}</span>
              </div>
            ))}

            <div className="pt-4 text-sm text-gray-600">
              <p className="font-medium mb-2">Results in:</p>
              <ul className="space-y-1 pl-4">
                <li>• Data entry across multiple platforms</li>
                <li>• Disconnected workflows</li>
                <li>• Higher costs and errors</li>
                <li>• Poor visibility into your business</li>
              </ul>
            </div>
          </div>

          {/* Right: Solution */}
          <div className={`relative transition-all duration-1000 delay-400 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
          }`}>
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">The ILS Way</h3>
              </div>

              <div className="p-8 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg border-2 border-blue-200 shadow-lg">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xl font-bold text-blue-900 mb-2">
                      One Platform. Everything Connected.
                    </h4>
                    <p className="text-gray-700">
                      Every aspect of your practice working together seamlessly
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 shadow">
                      <div className="text-sm font-semibold text-blue-900">POS</div>
                      <div className="text-xs text-gray-600">Sales & Inventory</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow">
                      <div className="text-sm font-semibold text-blue-900">Orders</div>
                      <div className="text-xs text-gray-600">Labs & Suppliers</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow">
                      <div className="text-sm font-semibold text-blue-900">Patients</div>
                      <div className="text-xs text-gray-600">Prescriptions</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow">
                      <div className="text-sm font-semibold text-blue-900">AI Insights</div>
                      <div className="text-xs text-gray-600">Real-time Analytics</div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-blue-200">
                    <p className="text-sm font-medium text-green-700 mb-2">Benefits:</p>
                    <ul className="space-y-1 text-sm text-gray-700">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        Enter data once, use everywhere
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        Streamlined workflows
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        Lower costs, fewer errors
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        Complete business visibility
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Connecting Arrow */}
            <div className="hidden md:block absolute -left-16 top-1/2 transform -translate-y-1/2">
              <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                <path
                  d="M5 30h40m0 0l-10-10m10 10l-10 10"
                  stroke="#2563eb"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 pt-12 border-t border-gray-200">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">80%</div>
            <div className="text-sm text-gray-600">Time Saved</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">90%</div>
            <div className="text-sm text-gray-600">Fewer Errors</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">50%</div>
            <div className="text-sm text-gray-600">Cost Reduction</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">100%</div>
            <div className="text-sm text-gray-600">Visibility</div>
          </div>
        </div>
      </div>
    </section>
  );
}
