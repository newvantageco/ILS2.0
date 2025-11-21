/**
 * Next-Generation Features Showcase
 * Highlights the 5 transformational features that set ILS apart
 */

import { 
  Sparkles, 
  Brain, 
  Video, 
  TrendingUp, 
  CreditCard,
  Glasses,
  CheckCircle,
  ArrowRight 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export function NextGenFeatures() {
  const features = [
    {
      icon: Brain,
      title: 'AI Clinical Documentation',
      badge: '60% Time Savings',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      description: 'Auto-generates SOAP notes, diagnosis suggestions, and ICD-10 coding from your exam data',
      benefits: [
        'Complete notes in 30 seconds',
        'UK optometry standards compliant',
        'Differential diagnosis AI',
        'Speech-to-text ready'
      ],
      stat: '£30k/year value'
    },
    {
      icon: Glasses,
      title: 'AR Virtual Try-On',
      badge: '94% Conversion Boost',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      description: 'Real-time face tracking lets patients try frames virtually with HD 3D rendering',
      benefits: [
        'Browser-based (no app needed)',
        'Photo capture & social sharing',
        'AI size recommendations',
        'Works on any device'
      ],
      stat: '£60k/year value'
    },
    {
      icon: TrendingUp,
      title: 'Predictive Analytics',
      badge: '30% No-Show Reduction',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      description: 'ML-powered predictions for patient risks, no-shows, revenue forecasts, and inventory',
      benefits: [
        'Patient risk stratification',
        'No-show prevention alerts',
        'Revenue forecasting',
        'Auto inventory reordering'
      ],
      stat: '£50k/year value'
    },
    {
      icon: Video,
      title: 'Telehealth Platform',
      badge: 'New Revenue Stream',
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      description: 'HD video consultations with digital consent, waiting rooms, and clinical workflows',
      benefits: [
        'Virtual consultations',
        'Digital consent & e-signatures',
        'Waiting room workflows',
        'Remote visual acuity testing'
      ],
      stat: '£100k/year value'
    },
    {
      icon: CreditCard,
      title: 'Revenue Cycle Management',
      badge: '35% Fewer Denials',
      color: 'from-indigo-500 to-purple-500',
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      description: 'Automated billing with real-time eligibility, claim scrubbing, and denial management',
      benefits: [
        'Real-time insurance verification',
        'AI-powered auto-coding',
        'Claim scrubbing & validation',
        'Automated ERA processing'
      ],
      stat: '£89k/year value'
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-white via-gray-50 to-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-gray-100/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
      
      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 text-sm font-semibold border-0">
            <Sparkles className="h-4 w-4 mr-2" />
            Next-Generation Platform
          </Badge>
          
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Five Game-Changing Technologies.
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              One Platform.
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-4">
            While competitors offer basic practice management, we're delivering the future of optical care.
          </p>
          
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>£329,000 combined annual value</span>
          </div>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-2xl transition-all duration-300 border-2 hover:border-blue-200 group">
                <CardContent className="p-6">
                  {/* Icon & Badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <feature.icon className="h-7 w-7 text-white" />
                    </div>
                    <Badge variant="outline" className="text-xs font-semibold">
                      {feature.badge}
                    </Badge>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-4">
                    {feature.description}
                  </p>

                  {/* Benefits List */}
                  <ul className="space-y-2 mb-4">
                    {feature.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Value Stat */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-900">
                        Annual Value:
                      </span>
                      <span className={`text-lg font-bold bg-gradient-to-r ${feature.color} bg-clip-text text-transparent`}>
                        {feature.stat}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center"
        >
          <Card className="max-w-4xl mx-auto bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 border-0 shadow-2xl">
            <CardContent className="p-8 md:p-12 text-white">
              <h3 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Lead the Industry?
              </h3>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Join 500+ practices already using next-generation technology to deliver better care and grow faster.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg"
                  variant="secondary"
                  className="text-lg px-8 py-7 bg-white text-blue-600 hover:bg-gray-100 font-semibold group"
                >
                  Start Free 30-Day Trial
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                
                <Button 
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 py-7 border-2 border-white text-white hover:bg-white/10 font-semibold"
                >
                  Watch 5-Minute Demo
                </Button>
              </div>

              <p className="text-sm text-white/70 mt-6">
                No credit card required • Setup in 5 minutes • Cancel anytime
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Industry First Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="text-center mt-12"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 border-2 border-blue-200">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-semibold text-gray-900">
              Industry First: Only optical platform with all 5 features
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
