import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

export function FAQ() {
  const [, setLocation] = useLocation();

  const faqs = [
    {
      question: 'Is the Free ECP Plan really free forever?',
      answer: 'Yes! Our Free ECP Plan is completely free for single-user practices with no time limit. You get unlimited POS transactions, digital prescriptions, order management, and basic reports. No credit card required, no hidden fees. Upgrade to the Full Experience when you need multi-user access, AI features, or advanced analytics.',
    },
    {
      question: 'How long does it take to get started?',
      answer: 'Most users are up and running in 10-15 minutes. Create your account, set up your company profile, and you can start processing transactions immediately. If you want to import existing data, we provide simple CSV templates and our support team can help you migrate.',
    },
    {
      question: 'Can I import my existing data?',
      answer: 'Absolutely! We support importing products, inventory, customers, and prescriptions via CSV files. Our team can also help with data migration from common systems like Specsavers, Essilor, or custom solutions. Contact us for migration assistance.',
    },
    {
      question: 'What AI capabilities are included?',
      answer: 'Our AI assistant (available in the Full Experience plan) provides natural language insights, proactive alerts, demand forecasting, and smart recommendations. Ask questions like "Which frames are selling best?" or "What products are low in stock?" and get instant answers. It learns from your data to provide increasingly valuable insights.',
    },
    {
      question: 'Is my data secure and compliant?',
      answer: 'Security is our top priority. All data is encrypted at rest and in transit using 256-bit SSL. We\'re GDPR compliant, ISO 27001 certified, and hosted on secure UK-based servers. Daily backups ensure your data is always safe. You maintain full ownership and can export your data anytime.',
    },
    {
      question: 'How do I connect with labs and suppliers?',
      answer: 'Browse our marketplace to discover and connect with verified labs and suppliers. Send connection requests, and once approved, you can place orders directly through the platform. Labs see your orders in real-time, and you can track production status. It\'s like having a private B2B network for the optical industry.',
    },
    {
      question: 'What support do you offer?',
      answer: 'Free plan users get email support with responses within 24 hours. Full Experience customers receive priority email and phone support, plus a dedicated account manager. We also provide comprehensive documentation, video tutorials, and regular webinars.',
    },
    {
      question: 'Can I cancel or change plans anytime?',
      answer: 'Yes! There are no long-term contracts. You can upgrade, downgrade, or cancel your Full Experience plan anytime. If you cancel, you can continue using the Free ECP Plan indefinitely, or export all your data. We believe in earning your business every month.',
    },
    {
      question: 'What if I\'m a lab or supplier?',
      answer: 'Labs and suppliers have custom pricing based on your business size and needs. Contact our sales team for a personalized quote. You\'ll get features like production tracking, B2B marketplace access, automated order processing, and analytics tools tailored to your operations.',
    },
    {
      question: 'Do you integrate with other systems?',
      answer: 'Yes! We offer API access for custom integrations, and we\'re building native integrations with popular optical software. Contact us about specific integration needs—we\'re always adding new connections based on customer demand.',
    },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600">
            Everything you need to know about ILS
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="bg-white border-2 border-gray-100 rounded-lg px-6 hover:border-blue-200 transition-colors"
            >
              <AccordionTrigger className="text-left font-semibold text-gray-900 hover:text-blue-600 py-6">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-700 leading-relaxed pb-6">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Still have questions CTA */}
        <div className="mt-16 text-center bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Still have questions?
          </h3>
          <p className="text-gray-600 mb-6">
            Our team is here to help. Book a demo or reach out directly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="outline"
              onClick={() => setLocation('/contact')}
              className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              Contact Support
            </Button>
            <Button
              size="lg"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Book a Demo
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
