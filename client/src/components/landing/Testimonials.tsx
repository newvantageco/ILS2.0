import { useState, useRef, useEffect } from 'react';
import { Star, Quote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function Testimonials() {
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

  const testimonials = [
    {
      quote: "ILS has transformed how we run our practice. Everything from appointments to lens orders is now in one place. We've saved over 15 hours per week.",
      author: "Dr. Sarah Mitchell",
      role: "Optometrist",
      practice: "Vision Care Opticians, London",
      rating: 5,
      avatar: "SM",
    },
    {
      quote: "The direct connection to ECPs has streamlined our production workflow. We've reduced errors by 80% and our turnaround time is now 30% faster.",
      author: "James Chen",
      role: "Lab Manager",
      practice: "Premium Lens Laboratory, Manchester",
      rating: 5,
      avatar: "JC",
    },
    {
      quote: "Being on ILS has opened up new wholesale opportunities. The automated ordering system has made B2B sales effortless. Revenue is up 40%.",
      author: "Emma Thompson",
      role: "Sales Director",
      practice: "UK Optical Supplies Ltd.",
      rating: 5,
      avatar: "ET",
    },
  ];

  const stats = [
    { value: '50+', label: 'Active Practices' },
    { value: '15K+', label: 'Orders Processed' },
    { value: '99.9%', label: 'Uptime' },
    { value: '4.9/5', label: 'Customer Rating' },
  ];

  return (
    <section ref={sectionRef} className="py-20 bg-white">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className={`text-center mb-16 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Trusted by Leading Eye Care Professionals
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join practices, labs, and suppliers who are already transforming their operations
          </p>
        </div>

        {/* Stats bar */}
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-8 mb-16 transition-all duration-1000 delay-200 ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}>
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Testimonials grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={index} 
              className={`border-2 border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-1000 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              style={{ transitionDelay: `${400 + index * 150}ms` }}
            >
              <CardContent className="p-8">
                {/* Quote icon */}
                <Quote className="h-10 w-10 text-blue-200 mb-4" />

                {/* Rating stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-gray-700 mb-6 leading-relaxed">
                  "{testimonial.quote}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {testimonial.author}
                    </div>
                    <div className="text-sm text-gray-600">
                      {testimonial.role}
                    </div>
                    <div className="text-sm text-gray-500">
                      {testimonial.practice}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trust badges */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8">
          <h3 className="text-xl font-bold text-center text-gray-900 mb-6">
            Certified & Secure
          </h3>
          <div className="flex flex-wrap justify-center items-center gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center mb-2 mx-auto shadow">
                <span className="text-2xl font-bold text-blue-600">ISO</span>
              </div>
              <p className="text-sm text-gray-600">ISO 27001</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center mb-2 mx-auto shadow">
                <span className="text-2xl font-bold text-green-600">✓</span>
              </div>
              <p className="text-sm text-gray-600">GDPR Compliant</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center mb-2 mx-auto shadow">
                <span className="text-2xl font-bold text-purple-600">🔒</span>
              </div>
              <p className="text-sm text-gray-600">256-bit SSL</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center mb-2 mx-auto shadow">
                <span className="text-2xl font-bold text-red-600">☁️</span>
              </div>
              <p className="text-sm text-gray-600">Cloud Backup</p>
            </div>
          </div>
        </div>

        {/* Customer logos placeholder */}
        <div className="mt-16">
          <p className="text-center text-sm text-gray-500 mb-8">
            Trusted by practices across the UK
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-60">
            <div className="text-2xl font-bold text-gray-400">VisionCare</div>
            <div className="text-2xl font-bold text-gray-400">OptiLens</div>
            <div className="text-2xl font-bold text-gray-400">ClearView</div>
            <div className="text-2xl font-bold text-gray-400">LensLab UK</div>
            <div className="text-2xl font-bold text-gray-400">Optical Plus</div>
          </div>
        </div>
      </div>
    </section>
  );
}
