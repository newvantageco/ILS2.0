import { ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

export function FinalCTA() {
  const [, setLocation] = useLocation();

  const benefits = [
    'Start with a free forever plan',
    'No credit card required',
    'Setup in just 5 minutes',
    'Cancel anytime, no strings attached',
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-300 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 max-w-5xl relative z-10">
        <div className="text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Eye Care Business?
          </h2>
          <p className="text-xl md:text-2xl text-blue-100 mb-4 max-w-3xl mx-auto">
            Join 50+ practices already saving time, reducing errors, and growing their business with ILS
          </p>
          <p className="text-lg text-blue-200 mb-12">
            Everything you need to run your practice, lab, or supply business—in one unified platform
          </p>

          {/* Benefits checklist */}
          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-12">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3 text-left">
                <CheckCircle className="h-6 w-6 text-green-300 flex-shrink-0" />
                <span className="text-lg">{benefit}</span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 text-lg py-6 px-8 shadow-xl"
              onClick={() => setLocation('/signup')}
            >
              Start Free ECP Plan
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white/10 text-lg py-6 px-8"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              Book a Demo
            </Button>
          </div>

          <p className="text-blue-200 text-sm">
            💳 No credit card required • 🚀 Get started in 5 minutes • ✅ Free forever for single users
          </p>
        </div>

        {/* Social proof strip */}
        <div className="mt-16 pt-12 border-t border-white/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold mb-1">50+</div>
              <div className="text-blue-200 text-sm">Active Practices</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">15K+</div>
              <div className="text-blue-200 text-sm">Orders Processed</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">80%</div>
              <div className="text-blue-200 text-sm">Time Saved</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">99.9%</div>
              <div className="text-blue-200 text-sm">Uptime</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
