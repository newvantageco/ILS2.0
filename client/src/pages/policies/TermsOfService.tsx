import { ArrowLeft, FileText, CheckCircle, AlertTriangle, Scale } from 'lucide-react';
import { Link } from 'wouter';

export default function TermsOfService() {
  const lastUpdated = "28 November 2025";
  const effectiveDate = "28 November 2025";
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <Link href="/">
            <a className="inline-flex items-center text-blue-600 hover:text-blue-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </a>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          {/* Title */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
              <FileText className="h-8 w-8 text-indigo-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms of Service</h1>
            <p className="text-gray-500">Last updated: {lastUpdated}</p>
            <p className="text-gray-500">Effective: {effectiveDate}</p>
          </div>

          {/* Key Points */}
          <div className="bg-indigo-50 rounded-xl p-6 mb-10">
            <h2 className="text-lg font-semibold text-indigo-900 mb-3">Key Points</h2>
            <ul className="space-y-2 text-indigo-800">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>You retain full ownership of your practice and patient data</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>We provide 99.9% uptime SLA for paid plans</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>Cancel anytime with full data export</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>You are responsible for maintaining GOC/NHS compliance</span>
              </li>
            </ul>
          </div>

          {/* Policy Content */}
          <div className="prose prose-gray max-w-none">
            <h2>1. Agreement to Terms</h2>
            <p>
              These Terms of Service ("Terms") constitute a legally binding agreement between you 
              (whether personally or on behalf of an entity) ("you") and Integrated Lens System Ltd 
              ("ILS", "we", "our", or "us") concerning your access to and use of the ILS platform 
              and any related services.
            </p>
            <p>
              By accessing or using our Service, you agree to be bound by these Terms. If you disagree 
              with any part of the Terms, you may not access the Service.
            </p>

            <h2>2. Description of Service</h2>
            <p>
              ILS is a cloud-based optical practice management platform that provides:
            </p>
            <ul>
              <li>Patient record management and clinical workflows</li>
              <li>Appointment scheduling and diary management</li>
              <li>Prescription and dispensing management</li>
              <li>NHS integration (claims, vouchers, referrals)</li>
              <li>Laboratory order management</li>
              <li>Inventory and supplier management</li>
              <li>AI-powered clinical assistance</li>
              <li>Reporting and analytics</li>
            </ul>

            <h2>3. Eligibility</h2>
            <p>
              The Service is intended for use by registered optical practices in the United Kingdom. 
              To use the Service, you must:
            </p>
            <ul>
              <li>Be at least 18 years of age</li>
              <li>Have the authority to bind your practice to these Terms</li>
              <li>Be registered with the General Optical Council (GOC) where applicable</li>
              <li>Comply with all applicable laws and regulations</li>
            </ul>

            <h2>4. Account Registration</h2>
            <h3>4.1 Account Creation</h3>
            <p>
              You must provide accurate and complete information when creating an account. You are 
              responsible for maintaining the confidentiality of your account credentials and for 
              all activities that occur under your account.
            </p>
            
            <h3>4.2 User Accounts</h3>
            <p>
              Practice administrators may create accounts for staff members. Each user must have 
              their own account. Account sharing is prohibited and may result in termination.
            </p>

            <h2>5. Subscription and Payment</h2>
            <h3>5.1 Pricing</h3>
            <p>
              Current pricing is available on our website. We reserve the right to change pricing 
              with 30 days' notice. Price changes do not affect current subscription periods.
            </p>
            
            <h3>5.2 Payment Terms</h3>
            <ul>
              <li>Subscriptions are billed monthly or annually in advance</li>
              <li>Payments are processed securely via Stripe</li>
              <li>Failed payments may result in service suspension</li>
              <li>No refunds for partial months upon cancellation</li>
            </ul>
            
            <h3>5.3 Free Trial</h3>
            <p>
              We may offer a free trial period. At the end of the trial, you must subscribe to 
              continue using the Service. No payment information is required to start a trial.
            </p>

            <h2>6. Data Ownership and Responsibilities</h2>
            <h3>6.1 Your Data</h3>
            <p>
              You retain all rights to your data. We do not claim ownership of any patient records, 
              clinical data, or practice information you input into the Service.
            </p>
            
            <h3>6.2 Data Processing</h3>
            <p>
              For patient data, you are the Data Controller under UK GDPR. We act as a Data Processor 
              on your behalf under a Data Processing Agreement, which forms part of these Terms.
            </p>
            
            <h3>6.3 Your Responsibilities</h3>
            <ul>
              <li>Obtaining appropriate patient consent for data processing</li>
              <li>Ensuring data accuracy and completeness</li>
              <li>Maintaining compliance with GOC standards</li>
              <li>Managing user access appropriately</li>
              <li>Reporting any data breaches promptly</li>
            </ul>

            <h2>7. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to gain unauthorised access to any systems</li>
              <li>Upload malicious code or content</li>
              <li>Interfere with other users' access to the Service</li>
              <li>Use the Service to store or transmit infringing content</li>
              <li>Reverse engineer or attempt to extract source code</li>
              <li>Resell or redistribute the Service without authorisation</li>
              <li>Use automated systems to access the Service excessively</li>
            </ul>
            <p>
              For full details on acceptable use, please contact us at{" "}
              <a href="mailto:legal@integratedlenssystem.com" className="text-blue-600 hover:underline">legal@integratedlenssystem.com</a>.
            </p>

            <h2>8. NHS Integration</h2>
            <h3>8.1 NHS API Access</h3>
            <p>
              If you use NHS integrations (PDS, e-Referrals, PCSE claims), you must:
            </p>
            <ul>
              <li>Have a valid NHS ODS code</li>
              <li>Complete the DSPT to "Standards Met" level</li>
              <li>Comply with all NHS terms of use</li>
              <li>Ensure appropriate clinical governance</li>
            </ul>
            
            <h3>8.2 Claims Responsibility</h3>
            <p>
              You are solely responsible for the accuracy of NHS claims submitted through the Service. 
              We provide tools to assist, but final responsibility rests with the submitting practice.
            </p>

            <h2>9. Service Level Agreement</h2>
            <p>For paid subscriptions, we commit to:</p>
            <ul>
              <li><strong>Uptime:</strong> 99.9% availability (excluding planned maintenance)</li>
              <li><strong>Support:</strong> Response within 24 hours for standard issues</li>
              <li><strong>Critical Issues:</strong> Response within 4 hours for service-affecting issues</li>
              <li><strong>Data Backup:</strong> Daily automated backups with 30-day retention</li>
            </ul>
            <p>
              For full SLA details and service credits, please contact us at{" "}
              <a href="mailto:support@integratedlenssystem.com" className="text-blue-600 hover:underline">support@integratedlenssystem.com</a>.
            </p>

            <h2>10. Intellectual Property</h2>
            <p>
              The Service, including all software, designs, trademarks, and content, is owned by 
              ILS and protected by intellectual property laws. You are granted a limited, 
              non-exclusive, non-transferable licence to use the Service for your internal 
              business purposes.
            </p>

            <h2>11. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law:
            </p>
            <ul>
              <li>
                We are not liable for any indirect, incidental, special, consequential, or 
                punitive damages
              </li>
              <li>
                Our total liability shall not exceed the fees paid by you in the 12 months 
                preceding the claim
              </li>
              <li>
                We are not liable for clinical decisions made using information from the Service
              </li>
              <li>
                We are not responsible for third-party services (NHS, payment processors, etc.)
              </li>
            </ul>

            <h2>12. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless ILS and its officers, directors, employees, 
              and agents from any claims, damages, or expenses arising from:
            </p>
            <ul>
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any third-party rights</li>
              <li>Any patient claims related to your clinical practice</li>
            </ul>

            <h2>13. Termination</h2>
            <h3>13.1 By You</h3>
            <p>
              You may cancel your subscription at any time through the account settings. Cancellation 
              takes effect at the end of the current billing period.
            </p>
            
            <h3>13.2 By Us</h3>
            <p>
              We may suspend or terminate your account for:
            </p>
            <ul>
              <li>Breach of these Terms</li>
              <li>Non-payment</li>
              <li>Fraudulent or illegal activity</li>
              <li>Extended inactivity (12+ months)</li>
            </ul>
            
            <h3>13.3 Data Export</h3>
            <p>
              Upon termination, you may export your data within 30 days. After this period, 
              data will be deleted except where retention is required by law.
            </p>

            <h2>14. Changes to Terms</h2>
            <p>
              We may modify these Terms at any time. Material changes will be notified via email 
              at least 30 days before taking effect. Continued use of the Service after changes 
              constitutes acceptance.
            </p>

            <h2>15. Governing Law</h2>
            <p>
              These Terms are governed by the laws of England and Wales. Any disputes shall be 
              subject to the exclusive jurisdiction of the courts of England and Wales.
            </p>

            <h2>16. Contact</h2>
            <div className="bg-gray-50 rounded-lg p-6 not-prose">
              <p className="font-semibold mb-4">Legal Department</p>
              <p className="text-gray-600">
                Integrated Lens System Ltd<br />
                123 Optical Street<br />
                London, EC1A 1BB<br />
                United Kingdom
              </p>
              <p className="mt-4 text-gray-600">
                Email: legal@integratedlens.com
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="container mx-auto px-4 max-w-4xl text-center text-sm">
          <p>© {new Date().getFullYear()} Integrated Lens System. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-4">
            <Link href="/privacy"><a className="hover:text-white">Privacy</a></Link>
            <Link href="/cookies"><a className="hover:text-white">Cookies</a></Link>
            <Link href="/gdpr"><a className="hover:text-white">GDPR</a></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
