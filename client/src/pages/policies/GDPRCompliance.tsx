import { ArrowLeft, Shield, Users, Database, Key, FileCheck, Globe, Download } from 'lucide-react';
import { Link } from 'wouter';

export default function GDPRCompliance() {
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
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <Shield className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">GDPR Compliance</h1>
            <p className="text-gray-500">Last updated: {lastUpdated}</p>
          </div>

          {/* GDPR Principles */}
          <div className="grid md:grid-cols-2 gap-4 mb-10">
            <div className="bg-blue-50 rounded-xl p-4">
              <Users className="h-6 w-6 text-blue-600 mb-2" />
              <h3 className="font-semibold text-blue-900">Your Rights</h3>
              <p className="text-sm text-blue-700">Access, correct, delete, and export your data</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <Database className="h-6 w-6 text-green-600 mb-2" />
              <h3 className="font-semibold text-green-900">UK Data Storage</h3>
              <p className="text-sm text-green-700">Your data stays in UK/EU data centres</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4">
              <Key className="h-6 w-6 text-purple-600 mb-2" />
              <h3 className="font-semibold text-purple-900">Encryption</h3>
              <p className="text-sm text-purple-700">AES-256 at rest, TLS 1.3 in transit</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-4">
              <FileCheck className="h-6 w-6 text-amber-600 mb-2" />
              <h3 className="font-semibold text-amber-900">Accountability</h3>
              <p className="text-sm text-amber-700">Full audit trails and compliance records</p>
            </div>
          </div>

          {/* Policy Content */}
          <div className="prose prose-gray max-w-none">
            <h2>Our Commitment to GDPR</h2>
            <p>
              Integrated Lens System is fully committed to compliance with the UK General Data 
              Protection Regulation (UK GDPR) and the Data Protection Act 2018. We have implemented 
              comprehensive measures to protect personal data and uphold data subject rights.
            </p>

            <h2>1. Data Controller vs Data Processor</h2>
            <h3>Your Practice (Data Controller)</h3>
            <p>
              As an optical practice using ILS, you are the <strong>Data Controller</strong> for 
              patient data. This means you:
            </p>
            <ul>
              <li>Determine the purposes and means of processing patient data</li>
              <li>Are responsible for lawful basis and patient consent</li>
              <li>Must respond to patient data subject requests</li>
              <li>Are responsible for data breach notifications to the ICO</li>
            </ul>

            <h3>ILS (Data Processor)</h3>
            <p>
              ILS acts as a <strong>Data Processor</strong> on your behalf. We:
            </p>
            <ul>
              <li>Process data only according to your instructions</li>
              <li>Implement appropriate technical and organisational measures</li>
              <li>Assist you in responding to data subject requests</li>
              <li>Notify you of any data breaches without undue delay</li>
            </ul>

            <h2>2. Lawful Basis for Processing</h2>
            <p>
              Personal data is processed under the following lawful bases:
            </p>
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left">Data Type</th>
                  <th className="px-4 py-2 text-left">Lawful Basis</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2">Account data</td>
                  <td className="px-4 py-2">Contract performance</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-4 py-2">Patient clinical records</td>
                  <td className="px-4 py-2">Legal obligation (GOC), Legitimate interests (healthcare)</td>
                </tr>
                <tr>
                  <td className="px-4 py-2">Payment information</td>
                  <td className="px-4 py-2">Contract performance</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-4 py-2">Marketing communications</td>
                  <td className="px-4 py-2">Consent</td>
                </tr>
                <tr>
                  <td className="px-4 py-2">Security logs</td>
                  <td className="px-4 py-2">Legitimate interests (security)</td>
                </tr>
              </tbody>
            </table>

            <h2>3. Data Subject Rights</h2>
            <p>
              Under UK GDPR, individuals have the following rights:
            </p>

            <h3>Right of Access (Article 15)</h3>
            <p>
              You can request a copy of all personal data we hold about you. We will respond 
              within 30 days.
            </p>

            <h3>Right to Rectification (Article 16)</h3>
            <p>
              You can request correction of inaccurate personal data. Most data can be corrected 
              directly in the platform.
            </p>

            <h3>Right to Erasure (Article 17)</h3>
            <p>
              You can request deletion of your personal data, subject to legal retention requirements 
              (e.g., GOC 10-year clinical record retention).
            </p>

            <h3>Right to Data Portability (Article 20)</h3>
            <p>
              You can export your data in machine-readable format (JSON, CSV) at any time from the 
              platform settings.
            </p>

            <h3>Right to Object (Article 21)</h3>
            <p>
              You can object to processing based on legitimate interests. We will cease processing 
              unless we have compelling grounds.
            </p>

            <h3>Right to Restrict Processing (Article 18)</h3>
            <p>
              You can request restricted processing while we verify accuracy or assess objections.
            </p>

            <h2>4. How to Exercise Your Rights</h2>
            <div className="bg-blue-50 rounded-lg p-6 not-prose mb-6">
              <h4 className="font-semibold text-blue-900 mb-3">Submit a Data Subject Request</h4>
              <p className="text-blue-800 mb-4">
                You can exercise your rights by:
              </p>
              <ul className="space-y-2 text-blue-800">
                <li className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Using the data export feature in your account settings
                </li>
                <li className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Emailing privacy@integratedlens.com
                </li>
              </ul>
              <p className="text-sm text-blue-700 mt-4">
                We will verify your identity before processing any request. Response time: 30 days 
                (may be extended by 60 days for complex requests).
              </p>
            </div>

            <h2>5. Data Processing Agreement</h2>
            <p>
              When you sign up for ILS, you enter into a Data Processing Agreement (DPA) that 
              governs how we process data on your behalf. The DPA covers:
            </p>
            <ul>
              <li>Subject matter and duration of processing</li>
              <li>Nature and purpose of processing</li>
              <li>Types of personal data processed</li>
              <li>Categories of data subjects</li>
              <li>Your obligations and rights as controller</li>
              <li>Our obligations as processor</li>
              <li>Sub-processor arrangements</li>
              <li>Data breach notification procedures</li>
            </ul>
            <p>
              <a href="/docs/dpa" className="text-blue-600 hover:underline">
                Download our Data Processing Agreement template
              </a>
            </p>

            <h2>6. Sub-Processors</h2>
            <p>
              We use the following sub-processors to provide the Service:
            </p>
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left">Sub-Processor</th>
                  <th className="px-4 py-2 text-left">Purpose</th>
                  <th className="px-4 py-2 text-left">Location</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2">Railway</td>
                  <td className="px-4 py-2">Cloud hosting</td>
                  <td className="px-4 py-2">EU/UK</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-4 py-2">PostgreSQL (Railway)</td>
                  <td className="px-4 py-2">Database</td>
                  <td className="px-4 py-2">EU/UK</td>
                </tr>
                <tr>
                  <td className="px-4 py-2">Stripe</td>
                  <td className="px-4 py-2">Payment processing</td>
                  <td className="px-4 py-2">EU/UK</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-4 py-2">Resend</td>
                  <td className="px-4 py-2">Email delivery</td>
                  <td className="px-4 py-2">EU</td>
                </tr>
              </tbody>
            </table>
            <p className="text-sm text-gray-600">
              We will notify you of any changes to sub-processors with 30 days' notice.
            </p>

            <h2>7. International Transfers</h2>
            <p>
              Your data is stored and processed in UK/EU data centres. If any processing occurs 
              outside the UK/EU (e.g., support staff location), we ensure:
            </p>
            <ul>
              <li>Adequacy decision by the UK government, or</li>
              <li>Standard Contractual Clauses (SCCs), or</li>
              <li>Other appropriate safeguards under UK GDPR</li>
            </ul>

            <h2>8. Data Security Measures</h2>
            <p>
              We implement comprehensive security measures including:
            </p>
            <ul>
              <li><strong>Encryption:</strong> TLS 1.3 in transit, AES-256 at rest</li>
              <li><strong>Access Control:</strong> Role-based access with least privilege</li>
              <li><strong>Authentication:</strong> Strong passwords, MFA support</li>
              <li><strong>Monitoring:</strong> 24/7 security monitoring and intrusion detection</li>
              <li><strong>Auditing:</strong> Comprehensive audit logs retained for 8 years</li>
              <li><strong>Testing:</strong> Regular penetration testing and vulnerability scans</li>
              <li><strong>Training:</strong> Staff data protection training</li>
            </ul>

            <h2>9. Data Breach Procedures</h2>
            <p>
              In the event of a personal data breach, we will:
            </p>
            <ol>
              <li>Notify you (as Data Controller) without undue delay, and within 24 hours</li>
              <li>Provide details of the breach, affected data, and remediation steps</li>
              <li>Assist you in notifying the ICO (within 72 hours) if required</li>
              <li>Assist you in notifying affected individuals if required</li>
            </ol>

            <h2>10. Data Protection Officer</h2>
            <p>
              For any GDPR-related queries, contact our Data Protection Officer:
            </p>
            <div className="bg-gray-50 rounded-lg p-6 not-prose">
              <p className="font-semibold mb-2">Data Protection Officer</p>
              <p className="text-gray-600">
                Email: dpo@integratedlens.com<br />
                Address: 123 Optical Street, London, EC1A 1BB
              </p>
            </div>

            <h2>11. Supervisory Authority</h2>
            <p>
              You have the right to lodge a complaint with the UK supervisory authority:
            </p>
            <div className="bg-gray-50 rounded-lg p-6 not-prose">
              <p className="font-semibold mb-2">Information Commissioner's Office (ICO)</p>
              <p className="text-gray-600">
                Website: <a href="https://ico.org.uk" className="text-blue-600 hover:underline">ico.org.uk</a><br />
                Helpline: 0303 123 1113
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
            <Link href="/terms"><a className="hover:text-white">Terms</a></Link>
            <Link href="/cookies"><a className="hover:text-white">Cookies</a></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
