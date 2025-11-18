import { Link } from 'react-router-dom';
import { SEO, getBreadcrumbSchema } from '../components/SEO';
import { useEffect } from 'react';
import { trackPageView } from '../components/GoogleAnalytics';

export function TermsOfServicePage() {
  const sectionSpacing = 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12';
  const lastUpdated = 'November 11, 2025';

  useEffect(() => {
    trackPageView('/terms');
  }, []);

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Terms of Service', url: '/terms' },
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <SEO
        title="Terms of Service - APIVault"
        description="APIVault Terms of Service. Read our service terms, acceptable use policy, and user agreements."
        url="/terms"
        keywords="terms of service, user agreement, service terms, legal"
        structuredData={breadcrumbSchema}
      />
      <div className={sectionSpacing}>
        <div className="mb-8">
          <Link to="/" className="text-emerald-400 hover:text-emerald-300 text-sm mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">Terms of Service</h1>
          <p className="text-gray-400">Last updated: {lastUpdated}</p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8">
          <section className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-300 leading-relaxed">
              By accessing or using APIVault ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use the Service. These Terms constitute a legally binding agreement between you and APIVault.
            </p>
          </section>

          <section className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4">2. Description of Service</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              APIVault is a secrets management platform that allows you to:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2 text-gray-300">
              <li>Securely store and manage API keys, credentials, and sensitive data</li>
              <li>Organize secrets by projects and environments</li>
              <li>Access secrets via web dashboard, CLI, or API</li>
              <li>Share secrets with team members with granular access controls</li>
              <li>Track access and changes through audit logs</li>
            </ul>
            <p className="text-gray-300 mt-4 leading-relaxed">
              We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time with or without notice.
            </p>
          </section>

          <section className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4">3. Account Registration and Eligibility</h2>
            <div className="space-y-4 text-gray-300">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">3.1 Eligibility</h3>
                <p>You must be at least 18 years old to use the Service. By using the Service, you represent and warrant that you meet this age requirement.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">3.2 Account Creation</h3>
                <p>To use the Service, you must create an account by providing accurate, current, and complete information. You are responsible for maintaining the security of your account credentials.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">3.3 Account Responsibilities</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>You are responsible for all activities that occur under your account</li>
                  <li>You must notify us immediately of any unauthorized access</li>
                  <li>You may not share your account credentials with others</li>
                  <li>You are responsible for ensuring compliance with these Terms by any users you authorize</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4">4. Pricing and Billing Terms</h2>
            <div className="space-y-4 text-gray-300">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">4.1 Subscription Plans</h3>
                <p>We offer various subscription plans with different features and pricing. Pricing information is available on our website and may be updated from time to time.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">4.2 Billing</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Subscriptions are billed in advance on a monthly or annual basis</li>
                  <li>Payment is required at the time of subscription or renewal</li>
                  <li>We use third-party payment processors (e.g., Stripe) to handle transactions</li>
                  <li>All prices are in USD unless otherwise stated</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">4.3 Renewals and Cancellations</h3>
                <p>Subscriptions automatically renew unless canceled before the renewal date. You may cancel your subscription at any time through your account settings. Cancellations take effect at the end of your current billing period.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">4.4 Refunds</h3>
                <p>Refund terms are governed by our separate <Link to="/refund" className="text-emerald-400 hover:text-emerald-300">Refund Policy</Link>. We offer a 30-day money-back guarantee for new subscriptions.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">4.5 Price Changes</h3>
                <p>We reserve the right to change our pricing at any time. Price changes will be communicated in advance and will apply to subsequent billing cycles. Existing subscriptions will not be affected until renewal.</p>
              </div>
            </div>
          </section>

          <section className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4">5. Acceptable Use Policy</h2>
            <p className="text-gray-300 leading-relaxed mb-4">You agree not to use the Service in any way that:</p>
            <div className="space-y-4 text-gray-300">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">5.1 Prohibited Activities</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Violates any applicable law, regulation, or legal obligation</li>
                  <li>Infringes upon intellectual property rights of others</li>
                  <li>Contains malware, viruses, or other harmful code</li>
                  <li>Attempts to gain unauthorized access to the Service or other accounts</li>
                  <li>Interferes with or disrupts the Service or servers</li>
                  <li>Uses automated systems (bots, scrapers) to access the Service without permission</li>
                  <li>Resells or redistributes the Service without authorization</li>
                  <li>Uses the Service for any illegal or fraudulent purpose</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">5.2 Content Restrictions</h3>
                <p>You may not store content that:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Violates laws or regulations</li>
                  <li>Infringes intellectual property rights</li>
                  <li>Contains personal information of others without consent</li>
                  <li>Is defamatory, harassing, or harmful</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">5.3 Consequences of Violation</h3>
                <p>Violation of the Acceptable Use Policy may result in immediate suspension or termination of your account, without refund, and may lead to legal action.</p>
              </div>
            </div>
          </section>

          <section className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4">6. Intellectual Property Ownership</h2>
            <div className="space-y-4 text-gray-300">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">6.1 Service Ownership</h3>
                <p>The Service, including all software, designs, text, graphics, logos, and other content, is owned by APIVault or its licensors and is protected by copyright, trademark, and other intellectual property laws.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">6.2 Your Content</h3>
                <p>You retain all ownership rights to the secrets and data you store in the Service. By using the Service, you grant us a limited license to store, process, and transmit your content solely for the purpose of providing the Service.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">6.3 Feedback</h3>
                <p>Any feedback, suggestions, or ideas you provide about the Service may be used by us without obligation or compensation to you.</p>
              </div>
            </div>
          </section>

          <section className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4">7. Data Security and Encryption</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              We implement industry-standard security measures, including end-to-end encryption for your secrets. However:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2 text-gray-300">
              <li>You are responsible for maintaining the confidentiality of your account credentials</li>
              <li>We cannot decrypt your secrets - only you (and authorized team members) can access them</li>
              <li>We are not liable for any loss or unauthorized access resulting from your failure to secure your account</li>
              <li>You should regularly back up your secrets using our export functionality</li>
            </ul>
          </section>

          <section className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4">8. Limitation of Liability</h2>
            <div className="space-y-4 text-gray-300">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">8.1 Liability Cap</h3>
                <p>To the maximum extent permitted by law, our total liability for any claims arising from or related to the Service shall not exceed the amount you paid to us in the 12 months preceding the claim, or $100, whichever is greater.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">8.2 Exclusion of Damages</h3>
                <p>We are not liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or business opportunities, even if we have been advised of the possibility of such damages.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">8.3 Service Availability</h3>
                <p>We do not guarantee that the Service will be available 100% of the time. We are not liable for any damages resulting from Service interruptions, downtime, or unavailability.</p>
              </div>
            </div>
          </section>

          <section className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4">9. Indemnification</h2>
            <p className="text-gray-300 leading-relaxed">
              You agree to indemnify, defend, and hold harmless APIVault and its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses (including reasonable attorneys' fees) arising out of or in any way connected with:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2 text-gray-300 mt-4">
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any rights of another party</li>
              <li>Content you store or transmit through the Service</li>
            </ul>
          </section>

          <section className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4">10. Service Modifications and Discontinuation</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              We reserve the right to:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2 text-gray-300">
              <li>Modify, update, or discontinue any feature of the Service at any time</li>
              <li>Change pricing with advance notice</li>
              <li>Suspend or terminate the Service with 30 days' notice</li>
              <li>Implement new features or remove existing features</li>
            </ul>
            <p className="text-gray-300 mt-4">We will provide reasonable notice for material changes that may affect your use of the Service.</p>
          </section>

          <section className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4">11. Termination</h2>
            <div className="space-y-4 text-gray-300">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">11.1 Termination by You</h3>
                <p>You may terminate your account at any time through your account settings or by contacting us. Termination will take effect at the end of your current billing period, and you will not be charged for subsequent periods.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">11.2 Termination by Us</h3>
                <p>We may suspend or terminate your account immediately if:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>You violate these Terms or our Acceptable Use Policy</li>
                  <li>You fail to pay subscription fees when due</li>
                  <li>You engage in fraudulent or illegal activity</li>
                  <li>Required by law or court order</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">11.3 Effect of Termination</h3>
                <p>Upon termination:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Your access to the Service will be revoked</li>
                  <li>Your data will be retained for 30 days, during which you can export it</li>
                  <li>After 30 days, your data may be permanently deleted</li>
                  <li>You remain liable for any outstanding fees</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4">12. GDPR, CCPA, and UK GDPR Compliance</h2>
            <div className="space-y-4 text-gray-300">
              <p>We comply with applicable data protection laws, including:</p>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">12.1 General Data Protection Regulation (GDPR)</h3>
                <p>For users in the European Economic Area (EEA), we process personal data in accordance with GDPR requirements. See our <Link to="/privacy" className="text-emerald-400 hover:text-emerald-300">Privacy Policy</Link> for details on your rights and our data practices.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">12.2 California Consumer Privacy Act (CCPA)</h3>
                <p>For California residents, we provide transparency about data collection and honor CCPA rights. We do not sell personal information.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">12.3 UK GDPR</h3>
                <p>We comply with UK GDPR requirements for users in the United Kingdom.</p>
              </div>
            </div>
          </section>

          <section className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4">13. Warranties and Disclaimers</h2>
            <div className="space-y-4 text-gray-300">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">13.1 No Warranties</h3>
                <p>The Service is provided "as is" and "as available" without warranties of any kind, either express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">13.2 Service Availability</h3>
                <p>We do not warrant that the Service will be uninterrupted, secure, error-free, or free from viruses or other harmful components.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">13.3 Your Responsibilities</h3>
                <p>You are responsible for:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Backing up your data</li>
                  <li>Ensuring compliance with applicable laws when using the Service</li>
                  <li>Maintaining the security of your account</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4">14. Third-Party Services</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              The Service may integrate with or link to third-party services. We are not responsible for:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2 text-gray-300">
              <li>The availability, accuracy, or reliability of third-party services</li>
              <li>Any transactions between you and third parties</li>
              <li>Any damages or losses resulting from your use of third-party services</li>
            </ul>
            <p className="text-gray-300 mt-4">Your use of third-party services is subject to their respective terms and policies.</p>
          </section>

          <section className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4">15. Dispute Resolution and Arbitration</h2>
            <div className="space-y-4 text-gray-300">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">15.1 Informal Resolution</h3>
                <p>Before initiating formal dispute resolution, you agree to contact us at <a href="mailto:support@apivault.it.com" className="text-emerald-400 hover:text-emerald-300">support@apivault.it.com</a> to attempt to resolve the dispute informally.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">15.2 Arbitration Agreement</h3>
                <p>If informal resolution is unsuccessful, any disputes arising from or relating to these Terms or the Service shall be resolved through binding arbitration administered by the American Arbitration Association (AAA) under its Commercial Arbitration Rules, except as provided below.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">15.3 Exceptions to Arbitration</h3>
                <p>The following disputes are not subject to arbitration:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Small claims court actions</li>
                  <li>Intellectual property disputes (which may be brought in court)</li>
                  <li>Enforcement of arbitration awards</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">15.4 Class Action Waiver</h3>
                <p>You agree not to participate in class actions, consolidated actions, or representative proceedings in connection with any dispute. Disputes must be resolved on an individual basis.</p>
              </div>
            </div>
          </section>

          <section className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4">16. Governing Law and Jurisdiction</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions. For disputes not subject to arbitration, you agree to submit to the exclusive jurisdiction of the courts located in the United States.
            </p>
            <p className="text-gray-300">
              If any provision of these Terms is found to be unenforceable, the remaining provisions shall remain in full force and effect.
            </p>
          </section>

          <section className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4">17. Force Majeure</h2>
            <p className="text-gray-300 leading-relaxed">
              We are not liable for any failure or delay in performance under these Terms resulting from circumstances beyond our reasonable control, including but not limited to acts of God, natural disasters, war, terrorism, labor disputes, internet failures, or government actions.
            </p>
          </section>

          <section className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4">18. Entire Agreement</h2>
            <p className="text-gray-300 leading-relaxed">
              These Terms, together with our Privacy Policy and Refund Policy, constitute the entire agreement between you and APIVault regarding the Service and supersede all prior agreements and understandings, whether written or oral.
            </p>
          </section>

          <section className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4">19. Changes to Terms</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              We may update these Terms from time to time. We will notify you of material changes by:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2 text-gray-300">
              <li>Posting the updated Terms on this page</li>
              <li>Sending an email to your registered email address</li>
              <li>Displaying a notice in the Service</li>
            </ul>
            <p className="text-gray-300 mt-4">
              Your continued use of the Service after changes become effective constitutes acceptance of the updated Terms. If you do not agree to the changes, you must stop using the Service and terminate your account.
            </p>
          </section>

          <section className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4">20. Contact Information</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              If you have any questions about these Terms, please contact us:
            </p>
            <div className="space-y-2 text-gray-300">
              <p><strong>Email:</strong> <a href="mailto:support@apivault.it.com" className="text-emerald-400 hover:text-emerald-300">support@apivault.it.com</a></p>
              <p><strong>Website:</strong> <a href="https://apivault.it.com" className="text-emerald-400 hover:text-emerald-300">apivault.it.com</a></p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

