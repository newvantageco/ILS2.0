import { ArrowRight, CheckCircle, Sparkles, Play, Zap, Shield, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function HeroSection() {
  const [, setLocation] = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleFreeSignup = () => {
    setLocation('/email-signup');
  };

  const handleBookDemo = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const handlePlayVideo = () => {
    setVideoPlaying(true);
  };

  return (
    <section className="relative bg-gradient-to-br from-slate-50 via-blue-50/30 to-white py-16 md:py-24 overflow-hidden pt-28 md:pt-36">
      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="inline-flex mb-6"
            >
              <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 text-sm font-semibold border-0 shadow-lg">
                <Sparkles className="h-4 w-4 mr-2" />
                AI-Powered • HIPAA Compliant • Built for Scale
              </Badge>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-gray-900 mb-6 leading-[1.1] tracking-tight"
            >
              The World's Most Advanced{' '}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                AI-Powered Optical Platform
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0"
            >
              AI clinical documentation • AR virtual try-on • Predictive analytics • Telehealth • Automated billing. All in one platform.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10"
            >
              <Button
                size="lg"
                onClick={handleFreeSignup}
                className="text-lg px-8 py-7 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl font-semibold group"
              >
                Start Free 30-Day Trial
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                onClick={handleBookDemo}
                className="text-lg px-8 py-7 border-2 border-gray-300 hover:border-blue-600 font-semibold group"
              >
                <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Watch Demo
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm"
            >
              <div className="flex items-center justify-center lg:justify-start gap-2 p-3 rounded-lg bg-white/50 backdrop-blur-sm border border-gray-200/50">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                <span className="font-medium text-gray-700">No credit card required</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-2 p-3 rounded-lg bg-white/50 backdrop-blur-sm border border-gray-200/50">
                <Zap className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <span className="font-medium text-gray-700">Setup in 5 minutes</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-2 p-3 rounded-lg bg-white/50 backdrop-blur-sm border border-gray-200/50">
                <Award className="h-5 w-5 text-purple-600 flex-shrink-0" />
                <span className="font-medium text-gray-700">500+ practices trust us</span>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="relative"
          >
            <div className="relative rounded-2xl shadow-2xl overflow-hidden border border-gray-200 bg-white">
              <div className="relative group cursor-pointer" onClick={handlePlayVideo}>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 aspect-[16/10]">
                  <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-2">
                    <div className="flex gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-500"></div>
                      <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="flex-1 ml-4 bg-gray-100 rounded px-3 py-1 text-xs text-gray-600 font-mono">
                      ils2.com/dashboard
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-4 gap-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                          <div className="h-2 w-2/3 bg-gray-200 rounded mb-2"></div>
                          <div className="h-6 w-1/2 bg-blue-200 rounded"></div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 h-32">
                      <div className="h-3 w-1/4 bg-gray-200 rounded mb-3"></div>
                      <div className="flex items-end justify-between h-16 gap-2">
                        {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
                          <div
                            key={i}
                            className="flex-1 bg-gradient-to-t from-blue-500 to-purple-500 rounded-t"
                            style={{ height: `${height}%` }}
                          ></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-all flex items-center justify-center">
                  <div className="bg-white/95 backdrop-blur-sm rounded-full p-6 shadow-2xl group-hover:scale-110 transition-transform">
                    <Play className="h-12 w-12 text-blue-600 fill-blue-600" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
