import { useState, useRef, useEffect } from 'react';
import { Bell, Shield, MousePointer, MessageCircle, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const differentiators = [
  {
    icon: Bell,
    title: 'Works While You Sleep',
    subtitle: 'Automated Recall and Follow-up',
    description:
      'Most systems wait for you to generate a recall list. ILS monitors patient timelines automatically and triggers recall workflows without manual intervention.',
    comparison: {
      legacy: 'Run monthly reports, export lists, send manually',
      ils: 'System detects overdue checkups and initiates contact automatically',
    },
    color: 'blue',
  },
  {
    icon: Shield,
    title: 'Your Clinical Safety Net',
    subtitle: 'Real-Time Clinical Decision Support',
    description:
      'Built-in clinical rules flag potential issues before they become problems. Diabetic eye exam reminders, contraindication alerts, and protocol compliance checks run continuously.',
    comparison: {
      legacy: 'Rely on memory or paper checklists',
      ils: 'System surfaces clinical alerts during patient encounters',
    },
    color: 'green',
  },
  {
    icon: MousePointer,
    title: 'Designed for Real Workflows',
    subtitle: 'One-Click Actions, Zero Friction',
    description:
      'Healthcare software is notoriously slow. ILS uses optimistic updates and smart defaults to eliminate click fatigue and keep your day moving.',
    comparison: {
      legacy: '8+ clicks to complete common tasks',
      ils: 'Single-click actions with live status updates',
    },
    color: 'purple',
  },
  {
    icon: MessageCircle,
    title: 'Meet Patients Where They Are',
    subtitle: 'Omni-Channel Engagement',
    description:
      'Patients ignore emails but read WhatsApp instantly. ILS supports multiple channels so your messages actually get seen and acted upon.',
    comparison: {
      legacy: 'Post, email, or expensive SMS only',
      ils: 'WhatsApp, SMS, email from one conversation thread',
    },
    color: 'orange',
  },
  {
    icon: Zap,
    title: 'Live Waiting Room View',
    subtitle: 'Real-Time Schedule Intelligence',
    description:
      'See who is checked in, running late, or ready for their next stage. No more calling out to reception or refreshing static lists.',
    comparison: {
      legacy: 'Static appointment list, manual status updates',
      ils: 'Live dashboard updates as patients move through your practice',
    },
    color: 'pink',
  },
];

const colorClasses: Record<string, { bg: string; icon: string; border: string; badge: string }> = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
  },
  green: {
    bg: 'bg-green-50',
    icon: 'text-green-600',
    border: 'border-green-200',
    badge: 'bg-green-100 text-green-700',
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'text-purple-600',
    border: 'border-purple-200',
    badge: 'bg-purple-100 text-purple-700',
  },
  orange: {
    bg: 'bg-orange-50',
    icon: 'text-orange-600',
    border: 'border-orange-200',
    badge: 'bg-orange-100 text-orange-700',
  },
  pink: {
    bg: 'bg-pink-50',
    icon: 'text-pink-600',
    border: 'border-pink-200',
    badge: 'bg-pink-100 text-pink-700',
  },
};

export function WhyDifferent() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

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

  return (
    <section ref={sectionRef} className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div
          className={`text-center mb-16 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">
            Beyond Practice Management
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Not a Filing Cabinet. A Real-Time Operating System.
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Most practice software stores data. ILS actively works alongside you, automating the
            routine so you can focus on patient care.
          </p>
        </div>

        {/* Differentiator Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {differentiators.slice(0, 3).map((item, index) => {
            const colors = colorClasses[item.color];
            const Icon = item.icon;
            return (
              <Card
                key={index}
                className={`border-2 ${colors.border} transition-all duration-700 hover:shadow-lg ${
                  isVisible
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${200 + index * 100}ms` }}
              >
                <CardContent className="p-6">
                  <div
                    className={`h-12 w-12 rounded-xl ${colors.bg} flex items-center justify-center mb-4`}
                  >
                    <Icon className={`h-6 w-6 ${colors.icon}`} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{item.title}</h3>
                  <p className={`text-xs font-medium ${colors.icon} mb-3`}>{item.subtitle}</p>
                  <p className="text-sm text-gray-600 mb-4">{item.description}</p>

                  {/* Comparison */}
                  <div className="space-y-2 pt-4 border-t border-gray-100">
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-medium text-gray-400 uppercase w-16 flex-shrink-0 pt-0.5">
                        Before
                      </span>
                      <span className="text-xs text-gray-500 line-through">
                        {item.comparison.legacy}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className={`text-xs font-medium uppercase w-16 flex-shrink-0 pt-0.5 ${colors.icon}`}>
                        With ILS
                      </span>
                      <span className="text-xs text-gray-700 font-medium">
                        {item.comparison.ils}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bottom row - 2 cards centered */}
        <div className="grid md:grid-cols-2 gap-6 mt-6 max-w-4xl mx-auto">
          {differentiators.slice(3).map((item, index) => {
            const colors = colorClasses[item.color];
            const Icon = item.icon;
            return (
              <Card
                key={index + 3}
                className={`border-2 ${colors.border} transition-all duration-700 hover:shadow-lg ${
                  isVisible
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${500 + index * 100}ms` }}
              >
                <CardContent className="p-6">
                  <div
                    className={`h-12 w-12 rounded-xl ${colors.bg} flex items-center justify-center mb-4`}
                  >
                    <Icon className={`h-6 w-6 ${colors.icon}`} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{item.title}</h3>
                  <p className={`text-xs font-medium ${colors.icon} mb-3`}>{item.subtitle}</p>
                  <p className="text-sm text-gray-600 mb-4">{item.description}</p>

                  {/* Comparison */}
                  <div className="space-y-2 pt-4 border-t border-gray-100">
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-medium text-gray-400 uppercase w-16 flex-shrink-0 pt-0.5">
                        Before
                      </span>
                      <span className="text-xs text-gray-500 line-through">
                        {item.comparison.legacy}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className={`text-xs font-medium uppercase w-16 flex-shrink-0 pt-0.5 ${colors.icon}`}>
                        With ILS
                      </span>
                      <span className="text-xs text-gray-700 font-medium">
                        {item.comparison.ils}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
