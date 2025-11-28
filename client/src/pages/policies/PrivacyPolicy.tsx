import { ArrowLeft, Shield, Lock, Eye, Database, UserCheck, Globe, Mail } from 'lucide-react';
import { Link } from 'wouter';

export default function PrivacyPolicy() {
  const lastUpdated = "28 November 2025";
  
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
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
            <p className="text-gray-500">Last updated: {lastUpdated}</p>
          </div>

          {/* Quick Summary */}
          <div className="bg-blue-50 rounded-xl p-6 mb-10">
            <h2 className="text-lg font-semibold text-blue-900 mb-3">Quick Summary</h2>
            <ul className="space-y-2 text-blue-800">
              <li className="flex items-start gap-2">
                <Lock className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>Your data is encrypted in transit and at rest</span>
              </li>
              <li className="flex items-start gap-2">
                <Eye className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>We never sell your personal information</span>
              </li>
              <li className="flex items-start gap-2">
                <Database className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>Patient data is stored securely in UK/EU data centres</span>
              </li>
              <li className="flex items-start gap-2">
                <UserCheck className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>You control your data - request access or deletion anytime</span>
              </li>
            </ul>
          </div>

          {/* Policy Content */}
          <div className="prose prose-gray max-w-none">
            <h2>1. Introduction</h2>
            <p>
              Integrated Lens System ("ILS", "we", "our", or "us") is committed to protecting your privacy 
              and the privacy of your patients. This Privacy Policy explains how we collect, use, disclose, 
              and safeguard your information when you use our optical practice management platform.
            </p>
            <p>
              We are registered with the Information Commissioner's Office (ICO) and comply with the 
              UK General Data Protection Regulation (UK GDPR), the Data Protection Act 2018, and the 
              NHS Data Security and Protection Toolkit (DSPT) requirements.
            </p>

            <h2>2. Information We Collect</h2>
            
            <h3>2.1 Practice Information</h3>
            <ul>
              <li>Practice name, address, and contact details</li>
              <li>GOC registration numbers</li>
              <li>NHS ODS codes (where applicable)</li>
              <li>Billing and payment information</li>
            </ul>

            <h3>2.2 Staff Information</h3>
            <ul>
              <li>Names, email addresses, and phone numbers</li>
              <li>Professional registration numbers (GOC, GPhC)</li>
              <li>Role and access permissions</li>
              <li>Login credentials (passwords are hashed)</li>
            </ul>

            <h3>2.3 Patient Information (Processed on Your Behalf)</h3>
            <ul>
              <li>Name, date of birth, address, contact details</li>
              <li>NHS number</li>
              <li>Clinical records (prescriptions, examination results, images)</li>
              <li>Medical history relevant to eye care</li>
              <li>Appointment and dispensing records</li>
            </ul>

            <h3>2.4 Technical Information</h3>
            <ul>
              <li>IP addresses and device information</li>
              <li>Browser type and version</li>
              <li>Usage patterns and feature interactions</li>
              <li>Error logs for troubleshooting</li>
            </ul>

            <h2>3. How We Use Your Information</h2>
            <p>We process your information for the following purposes:</p>
            <ul>
              <li><strong>Service Delivery:</strong> To provide and maintain the ILS platform</li>
              <li><strong>Account Management:</strong> To manage your subscription and billing</li>
              <li><strong>Support:</strong> To respond to your enquiries and provide technical support</li>
              <li><strong>Security:</strong> To protect against unauthorised access and maintain audit trails</li>
              <li><strong>Improvements:</strong> To analyse usage patterns and improve our service</li>
              <li><strong>Legal Compliance:</strong> To comply with applicable laws and regulations</li>
              <li><strong>NHS Integration:</strong> To facilitate NHS claims and referrals (where authorised)</li>
            </ul>

            <h2>4. Legal Basis for Processing</h2>
            <p>We process personal data under the following legal bases:</p>
            <ul>
              <li><strong>Contract:</strong> Processing necessary to provide our services to you</li>
              <li><strong>Legal Obligation:</strong> Processing required by law (e.g., GOC record retention)</li>
              <li><strong>Legitimate Interests:</strong> Processing for service improvement and security</li>
              <li><strong>Consent:</strong> Where you have given specific consent (e.g., marketing emails)</li>
            </ul>
            <p>
              For patient data, your practice remains the Data Controller. We act as a Data Processor 
              under a Data Processing Agreement.
            </p>

            <h2>5. Data Sharing</h2>
            <p>We may share your information with:</p>
            <ul>
              <li><strong>NHS Services:</strong> For claims, referrals, and PDS lookups (with your authorisation)</li>
              <li><strong>Payment Processors:</strong> Stripe processes payments under their own privacy policy</li>
              <li><strong>Cloud Providers:</strong> Railway (hosting) and PostgreSQL providers (data storage)</li>
              <li><strong>Professional Bodies:</strong> Where required by regulation</li>
            </ul>
            <p>We never sell your personal information to third parties.</p>

            <h2>6. Data Security</h2>
            <p>We implement robust security measures including:</p>
            <ul>
              <li>TLS 1.3 encryption for all data in transit</li>
              <li>AES-256 encryption for data at rest</li>
              <li>Multi-factor authentication support</li>
              <li>Role-based access control (RBAC)</li>
              <li>Regular security audits and penetration testing</li>
              <li>24/7 monitoring and intrusion detection</li>
              <li>Automatic session timeouts</li>
              <li>Comprehensive audit logging</li>
            </ul>

            <h2>7. Data Retention</h2>
            <p>We retain data according to the following schedule:</p>
            <ul>
              <li><strong>Clinical Records:</strong> 10 years from last appointment (GOC requirement)</li>
              <li><strong>Child Records:</strong> Until 25th birthday or 10 years, whichever is longer</li>
              <li><strong>NHS Audit Logs:</strong> 8 years (NHS requirement)</li>
              <li><strong>Financial Records:</strong> 7 years (HMRC requirement)</li>
              <li><strong>Account Data:</strong> Duration of contract plus 2 years</li>
            </ul>

            <h2>8. Your Rights</h2>
            <p>Under UK GDPR, you have the right to:</p>
            <ul>
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Rectification:</strong> Correct inaccurate personal data</li>
              <li><strong>Erasure:</strong> Request deletion of your data (subject to legal retention)</li>
              <li><strong>Portability:</strong> Receive your data in a machine-readable format</li>
              <li><strong>Objection:</strong> Object to certain types of processing</li>
              <li><strong>Restriction:</strong> Request restricted processing in certain circumstances</li>
            </ul>
            <p>To exercise these rights, contact us at privacy@integratedlens.com</p>

            <h2>9. International Transfers</h2>
            <p>
              Your data is stored in UK/EU data centres. If any processing occurs outside the UK/EU, 
              we ensure appropriate safeguards are in place (e.g., Standard Contractual Clauses).
            </p>

            <h2>10. Cookies</h2>
            <p>
              We use essential cookies for authentication and security. See our{' '}
              <Link href="/cookies"><a className="text-blue-600 hover:underline">Cookie Policy</a></Link>{' '}
              for details.
            </p>

            <h2>11. Children's Privacy</h2>
            <p>
              Patient records may include children's data, which is processed under the authority of 
              the parent/guardian and the treating optometrist. We apply additional safeguards to 
              children's data.
            </p>

            <h2>12. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant 
              changes via email or in-app notification. Continued use of the service after changes 
              constitutes acceptance.
            </p>

            <h2>13. Contact Us</h2>
            <div className="bg-gray-50 rounded-lg p-6 not-prose">
              <p className="font-semibold mb-4">Data Protection Officer</p>
              <div className="space-y-2 text-gray-600">
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  privacy@integratedlens.com
                </p>
                <p className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Integrated Lens System Ltd<br />
                  123 Optical Street<br />
                  London, EC1A 1BB<br />
                  United Kingdom
                </p>
              </div>
              <p className="mt-4 text-sm text-gray-500">
                You also have the right to lodge a complaint with the Information Commissioner's Office 
                (ICO) at <a href="https://ico.org.uk" className="text-blue-600 hover:underline">ico.org.uk</a>
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
            <Link href="/terms"><a className="hover:text-white">Terms</a></Link>
            <Link href="/cookies"><a className="hover:text-white">Cookies</a></Link>
            <Link href="/gdpr"><a className="hover:text-white">GDPR</a></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
