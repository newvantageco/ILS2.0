import { Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useLocation } from 'wouter';

export function PricingSection() {
  const [, setLocation] = useLocation();

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Start free and upgrade when you're ready for advanced features
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Free ECP Plan */}
          <Card className="relative border-2 border-gray-200 hover:border-blue-300 transition-all">
            <CardHeader className="text-center pb-8 pt-8">
              <div className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-2">
                For Eye Care Professionals
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">Free ECP Plan</h3>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-5xl font-bold text-gray-900">£0</span>
                <span className="text-gray-600">/month</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">Forever free for single users</p>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900">Unlimited POS</div>
                    <div className="text-sm text-gray-600">Process unlimited sales transactions</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900">Digital Prescriptions</div>
                    <div className="text-sm text-gray-600">Store and manage patient records</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900">Order Management</div>
                    <div className="text-sm text-gray-600">Order from labs and suppliers</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900">Basic Reports</div>
                    <div className="text-sm text-gray-600">Sales and inventory insights</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900">Single User</div>
                    <div className="text-sm text-gray-600">Perfect for solo practitioners</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900">Email Support</div>
                    <div className="text-sm text-gray-600">Get help when you need it</div>
                  </div>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full text-lg py-6 bg-blue-600 hover:bg-blue-700"
                onClick={() => setLocation('/signup')}
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              <p className="text-center text-sm text-gray-600">
                No credit card required • Setup in 5 minutes
              </p>
            </CardContent>
          </Card>

          {/* Full Experience */}
          <Card className="relative border-2 border-blue-600 shadow-xl">
            {/* Popular Badge */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </span>
            </div>

            <CardHeader className="text-center pb-8 pt-8 bg-gradient-to-br from-blue-50 to-purple-50">
              <div className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-2">
                For Growing Practices
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">Full Experience</h3>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-5xl font-bold text-gray-900">Custom</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">Pricing based on your needs</p>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-blue-900 text-center">
                  ✨ Everything in Free, PLUS:
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900">AI Assistant</div>
                    <div className="text-sm text-gray-600">Natural language insights & alerts</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900">Lab Workflows</div>
                    <div className="text-sm text-gray-600">Production tracking & QC</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900">Advanced Analytics</div>
                    <div className="text-sm text-gray-600">Demand forecasting & trends</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900">Multi-user Teams</div>
                    <div className="text-sm text-gray-600">Unlimited staff with role-based access</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900">Custom Integrations</div>
                    <div className="text-sm text-gray-600">API access & webhooks</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900">Priority Support</div>
                    <div className="text-sm text-gray-600">Phone, email, & dedicated account manager</div>
                  </div>
                </div>
              </div>

              <Button
                size="lg"
                variant="outline"
                className="w-full text-lg py-6 border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
                onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
              >
                Contact Sales
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              <p className="text-center text-sm text-gray-600">
                Custom pricing • Flexible terms • Volume discounts
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-4">
            <strong>Labs & Suppliers:</strong> Contact us for custom pricing tailored to your business
          </p>
          <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span>No long-term contracts</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span>Data export available</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span>UK-based support</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
