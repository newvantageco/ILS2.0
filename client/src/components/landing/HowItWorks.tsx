import { UserPlus, Database, ShoppingCart, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

export function HowItWorks() {
  const [, setLocation] = useLocation();

  const steps = [
    {
      number: '1',
      icon: UserPlus,
      title: 'Sign Up Free',
      description: 'Create your account in minutes. No credit card required, no commitment.',
      details: [
        'Choose your role (ECP, Lab, or Supplier)',
        'Set up your company profile',
        'Invite your team members',
      ],
    },
    {
      number: '2',
      icon: Database,
      title: 'Add Your Data',
      description: 'Import your existing data or start fresh. We make it simple.',
      details: [
        'Import products and inventory',
        'Connect with partners',
        'Configure your preferences',
      ],
    },
    {
      number: '3',
      icon: ShoppingCart,
      title: 'Start Selling',
      description: 'Begin processing orders immediately. Everything you need in one place.',
      details: [
        'Process POS transactions',
        'Order from labs and suppliers',
        'Track orders in real-time',
      ],
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Get Started in 3 Simple Steps
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From signup to your first order in less than 15 minutes
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="relative">
                {/* Arrow between steps */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-24 left-full w-full">
                    <ArrowRight className="h-8 w-8 text-blue-300 mx-auto -ml-4" />
                  </div>
                )}

                {/* Step card */}
                <div className="bg-white rounded-lg p-8 shadow-lg hover:shadow-xl transition-all h-full border-2 border-gray-100 hover:border-blue-200">
                  {/* Step number badge */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex-shrink-0 w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold">
                      {step.number}
                    </div>
                    <div className="flex-shrink-0 w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                      <Icon className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {step.description}
                  </p>

                  {/* Details list */}
                  <ul className="space-y-3">
                    {step.details.map((detail, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                        </div>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Timeline visual */}
        <div className="relative max-w-4xl mx-auto mb-12">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-200 via-blue-400 to-green-400 transform -translate-y-1/2"></div>
          
          <div className="relative flex justify-between">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-2">
                0m
              </div>
              <p className="text-sm text-gray-600">Sign up</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-2">
                5m
              </div>
              <p className="text-sm text-gray-600">Data ready</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-2">
                15m
              </div>
              <p className="text-sm text-gray-600">First order</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button
            size="lg"
            className="text-lg py-6 px-8 bg-blue-600 hover:bg-blue-700"
            onClick={() => setLocation('/signup')}
          >
            Start Your Free Account Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-sm text-gray-600 mt-4">
            Join 50+ practices already using ILS • No credit card required
          </p>
        </div>
      </div>
    </section>
  );
}
