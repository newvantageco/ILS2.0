import { ArrowLeft, Cookie, Shield, Settings, BarChart3 } from 'lucide-react';
import { Link } from 'wouter';

export default function CookiePolicy() {
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
            <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
              <Cookie className="h-8 w-8 text-amber-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Cookie Policy</h1>
            <p className="text-gray-500">Last updated: {lastUpdated}</p>
          </div>

          {/* Cookie Summary */}
          <div className="grid md:grid-cols-3 gap-4 mb-10">
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-green-900">Essential</h3>
              <p className="text-sm text-green-700">Always active</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <Settings className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-blue-900">Functional</h3>
              <p className="text-sm text-blue-700">Your preferences</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 text-center">
              <BarChart3 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold text-purple-900">Analytics</h3>
              <p className="text-sm text-purple-700">Optional</p>
            </div>
          </div>

          {/* Policy Content */}
          <div className="prose prose-gray max-w-none">
            <h2>1. What Are Cookies?</h2>
            <p>
              Cookies are small text files stored on your device when you visit a website. They help 
              the website remember your preferences and improve your experience. Some cookies are 
              essential for the website to function properly, while others help us understand how 
              you use the site.
            </p>

            <h2>2. How We Use Cookies</h2>
            <p>
              ILS uses cookies to provide a secure, functional service. We minimize cookie use and 
              do not use cookies for advertising or tracking across websites.
            </p>

            <h2>3. Types of Cookies We Use</h2>
            
            <h3>3.1 Essential Cookies (Required)</h3>
            <p>
              These cookies are necessary for the Service to function. They cannot be disabled.
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left">Cookie Name</th>
                    <th className="px-4 py-2 text-left">Purpose</th>
                    <th className="px-4 py-2 text-left">Expiry</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-2 font-mono text-sm">connect.sid</td>
                    <td className="px-4 py-2">Session identification</td>
                    <td className="px-4 py-2">30 days</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-4 py-2 font-mono text-sm">csrf-token</td>
                    <td className="px-4 py-2">CSRF protection</td>
                    <td className="px-4 py-2">Session</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-mono text-sm">auth-token</td>
                    <td className="px-4 py-2">Authentication state</td>
                    <td className="px-4 py-2">7 days</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3>3.2 Functional Cookies (Preferences)</h3>
            <p>
              These cookies remember your preferences and settings.
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left">Cookie Name</th>
                    <th className="px-4 py-2 text-left">Purpose</th>
                    <th className="px-4 py-2 text-left">Expiry</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-2 font-mono text-sm">theme</td>
                    <td className="px-4 py-2">Light/dark mode preference</td>
                    <td className="px-4 py-2">1 year</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-4 py-2 font-mono text-sm">sidebar-state</td>
                    <td className="px-4 py-2">Navigation sidebar preference</td>
                    <td className="px-4 py-2">1 year</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-mono text-sm">locale</td>
                    <td className="px-4 py-2">Language preference</td>
                    <td className="px-4 py-2">1 year</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3>3.3 Analytics Cookies (Optional)</h3>
            <p>
              These cookies help us understand how the Service is used. They are only set with 
              your consent.
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left">Cookie Name</th>
                    <th className="px-4 py-2 text-left">Purpose</th>
                    <th className="px-4 py-2 text-left">Expiry</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-2 font-mono text-sm">_ph_*</td>
                    <td className="px-4 py-2">PostHog analytics (if enabled)</td>
                    <td className="px-4 py-2">1 year</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-600">
              * Analytics are only enabled if you consent and your practice administrator 
              enables them.
            </p>

            <h2>4. Third-Party Cookies</h2>
            <p>
              We use the following third-party services that may set cookies:
            </p>
            <ul>
              <li><strong>Stripe:</strong> Payment processing (PCI-compliant)</li>
            </ul>
            <p>
              We do not use social media tracking cookies or advertising cookies.
            </p>

            <h2>5. Managing Cookies</h2>
            <h3>5.1 Browser Settings</h3>
            <p>
              You can control cookies through your browser settings. Most browsers allow you to:
            </p>
            <ul>
              <li>View what cookies are stored</li>
              <li>Delete specific or all cookies</li>
              <li>Block cookies from certain sites</li>
              <li>Block all third-party cookies</li>
              <li>Clear all cookies when you close the browser</li>
            </ul>
            <p>
              Note: Blocking essential cookies will prevent you from using the Service.
            </p>

            <h3>5.2 Cookie Consent</h3>
            <p>
              When you first visit our site, you'll see a cookie consent banner. You can:
            </p>
            <ul>
              <li>Accept all cookies</li>
              <li>Accept only essential cookies</li>
              <li>Customise your preferences</li>
            </ul>
            <p>
              You can change your preferences at any time in your account settings.
            </p>

            <h2>6. Do Not Track</h2>
            <p>
              We respect the "Do Not Track" browser setting. When enabled, we disable analytics 
              cookies automatically.
            </p>

            <h2>7. Updates to This Policy</h2>
            <p>
              We may update this Cookie Policy from time to time. Changes will be posted on this 
              page with an updated revision date.
            </p>

            <h2>8. Contact Us</h2>
            <p>
              If you have questions about our use of cookies, contact us at:
            </p>
            <div className="bg-gray-50 rounded-lg p-4 not-prose">
              <p className="text-gray-600">
                Email: privacy@integratedlens.com
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
            <Link href="/gdpr"><a className="hover:text-white">GDPR</a></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
