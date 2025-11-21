import { Header } from './Header';
import { HeroSection } from './HeroSection';
import { NextGenFeatures } from './NextGenFeatures';
import { ProblemSolution } from './ProblemSolution';
import { FeatureShowcase } from './FeatureShowcase';
import { AISpotlight } from './AISpotlight';
import { PricingSection } from './PricingSection';
import { HowItWorks } from './HowItWorks';
import { Testimonials } from './Testimonials';
import { FAQ } from './FAQ';
import { FinalCTA } from './FinalCTA';
import { Footer } from './Footer';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header with Navigation */}
      <Header />

      {/* Hero Section */}
      <div id="hero" style={{ scrollMarginTop: '64px' }}>
        <HeroSection />
      </div>

      {/* Next-Generation Features - NEW! */}
      <div id="next-gen" style={{ scrollMarginTop: '64px' }}>
        <NextGenFeatures />
      </div>

      {/* Problem/Solution Section */}
      <div id="features" style={{ scrollMarginTop: '64px' }}>
        <ProblemSolution />
      </div>

      {/* Feature Showcase */}
      <FeatureShowcase />

      {/* AI Spotlight */}
      <div id="ai" style={{ scrollMarginTop: '64px' }}>
        <AISpotlight />
      </div>

      {/* How It Works */}
      <HowItWorks />

      {/* Testimonials & Social Proof */}
      <Testimonials />

      {/* Pricing */}
      <div id="pricing" style={{ scrollMarginTop: '64px' }}>
        <PricingSection />
      </div>

      {/* FAQ */}
      <div id="faq" style={{ scrollMarginTop: '64px' }}>
        <FAQ />
      </div>

      {/* Marketplace Section for Navigation */}
      <div id="marketplace" style={{ scrollMarginTop: '64px' }}>
        {/* This can link to the How It Works or a dedicated marketplace section */}
      </div>

      {/* Final CTA */}
      <FinalCTA />

      {/* Footer */}
      <Footer />
    </div>
  );
}
