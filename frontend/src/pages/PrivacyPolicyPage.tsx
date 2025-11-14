import { Link } from 'react-router-dom';

export function PrivacyPolicyPage() {
  const sectionSpacing = 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12';
  const lastUpdated = 'November 11, 2025';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <div className={sectionSpacing}>
        <div className="mb-8">
          <Link to="/" className="text-emerald-400 hover:text-emerald-300 text-sm mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-gray-400">Last updated: {lastUpdated}</p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8">
          <section className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
            <p className="text-gray-300 leading-relaxed">
              APIVault ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our secrets management platform (the "Service"). By using our Service, you agree to the collection and use of information in accordance with this policy.
            </p>
          </section>

          <section className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4">2. Information We Collect</h2>
            <div className="space-y-4 text-gray-300">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">2.1 Personal Information</h3>
                <p>We collect information that you provide directly to us, including:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Name and email address when you create an account</li>
                  <li>Profile information and preferences</li>
                  <li>Billing and payment information (processed securely through third-party providers)</li>
                  <li>Communication data when you contact us</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">2.2 Usage Information</h3>
                <p>We automatically collect certain information about your use of the Service:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>IP address and device information</li>
                  <li>Browser type and version</li>
                  <li>Usage patterns and feature interactions</li>
                  <li>Log files and timestamps</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">2.3 Secrets and Encrypted Data</h3>
                <p>All secrets stored through our Service are encrypted end-to-end. We cannot decrypt or access your secrets. Only you (and authorized team members you grant access to) can decrypt and view your secrets.</p>
              </div>
            </div>
          </section>

          <section className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-300 leading-relaxed mb-4">We use the collected information for the following purposes:</p>
            <ul className="list-disc list-inside ml-4 space-y-2 text-gray-300">
              <li>To provide, maintain, and improve our Service</li>
              <li>To process transactions and send related information</li>
              <li>To send technical notices, updates, and support messages</li>
              <li>To respond to your comments, questions, and requests</li>
              <li>To monitor and analyze usage patterns and trends</li>
              <li>To detect, prevent, and address technical issues and security threats</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4">4. Data Sharing and Disclosure</h2>
            <div className="space-y-4 text-gray-300">
              <p>We do not sell your personal information. We may share your information only in the following circumstances:</p>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">4.1 Service Providers</h3>
                <p>We may share information with third-party service providers who perform services on our behalf, such as:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Payment processing </li>
                  <li>Email delivery services</li>
                  <li>Cloud hosting and infrastructure providers</li>
                  <li>Analytics and monitoring services</li>
                </ul>
                <p className="mt-2">All service providers are contractually obligated to protect your information.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">4.2 Legal Requirements</h3>
                <p>We may disclose information if required by law or in response to valid requests by public authorities.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">4.3 Business Transfers</h3>
                <p>In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.</p>
              </div>
            </div>
          </section>

          <section className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4">5. Data Security</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              We implement industry-standard security measures to protect your information, including:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2 text-gray-300">
              <li>End-to-end encryption for all secrets (AES-256)</li>
              <li>Encrypted data transmission (TLS 1.3)</li>
              <li>Secure authentication and access controls</li>
              <li>Regular security audits and penetration testing</li>
              <li>Zero-knowledge architecture for secrets</li>
              <li>Secure key management practices</li>
            </ul>
            <p className="text-gray-300 mt-4 leading-relaxed">
              However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.
            </p>
          </section>

          <section className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4">6. Cookies and Tracking Technologies</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              We use cookies and similar tracking technologies to track activity on our Service and store certain information. Types of cookies we use:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2 text-gray-300">
              <li><strong>Essential Cookies:</strong> Required for the Service to function properly (authentication, session management)</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our Service (we use privacy-friendly analytics)</li>
              <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
            </ul>
            <p className="text-gray-300 mt-4 leading-relaxed">
              You can control cookies through your browser settings. However, disabling essential cookies may limit your ability to use the Service.
            </p>
          </section>

          <section className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4">7. Your Rights (GDPR & CCPA)</h2>
            <div className="space-y-4 text-gray-300">
              <p>Depending on your location, you have the following rights:</p>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">7.1 Right to Access</h3>
                <p>You can request a copy of the personal information we hold about you.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">7.2 Right to Rectification</h3>
                <p>You can request correction of inaccurate or incomplete information.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">7.3 Right to Erasure (Right to be Forgotten)</h3>
                <p>You can request deletion of your personal information, subject to certain legal exceptions.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">7.4 Right to Data Portability</h3>
                <p>You can request your data in a structured, machine-readable format.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">7.5 Right to Object</h3>
                <p>You can object to processing of your personal information for certain purposes.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">7.6 Right to Restrict Processing</h3>
                <p>You can request limitation of how we process your information.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">7.7 Right to Withdraw Consent</h3>
                <p>Where processing is based on consent, you can withdraw consent at any time.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">7.8 CCPA Rights (California Residents)</h3>
                <p>California residents have additional rights, including:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Right to know what personal information is collected</li>
                  <li>Right to delete personal information</li>
                  <li>Right to opt-out of sale of personal information (we do not sell your information)</li>
                  <li>Right to non-discrimination for exercising your rights</li>
                </ul>
              </div>
              <p className="mt-4">
                To exercise these rights, please contact us at <a href="mailto:privacy@apivault.it.com" className="text-emerald-400 hover:text-emerald-300">privacy@apivault.it.com</a>.
              </p>
            </div>
          </section>

          <section className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4">8. International Data Transfers</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Your information may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws that differ from those in your country.
            </p>
            <p className="text-gray-300 leading-relaxed">
              We ensure appropriate safeguards are in place, including:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2 text-gray-300 mt-2">
              <li>Standard Contractual Clauses (SCCs) approved by the European Commission</li>
              <li>Compliance with applicable data protection laws</li>
              <li>Regular assessments of data protection practices</li>
            </ul>
          </section>

          <section className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4">9. Data Retention</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              We retain your personal information only for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.
            </p>
            <div className="space-y-2 text-gray-300">
              <p><strong>Account Data:</strong> Retained while your account is active and for a reasonable period after account closure for legal and business purposes.</p>
              <p><strong>Secrets Data:</strong> Retained until you delete it. We maintain backup copies for up to 90 days after deletion for disaster recovery purposes.</p>
              <p><strong>Transaction Records:</strong> Retained for 7 years as required by tax and accounting laws.</p>
              <p><strong>Log Data:</strong> Retained for up to 90 days for security and troubleshooting purposes.</p>
            </div>
          </section>

          <section className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4">10. Children's Privacy</h2>
            <p className="text-gray-300 leading-relaxed">
              Our Service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you become aware that a child has provided us with personal information, please contact us immediately, and we will delete such information.
            </p>
          </section>

          <section className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4">11. Third-Party Links</h2>
            <p className="text-gray-300 leading-relaxed">
              Our Service may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to read the privacy policies of any third-party services you visit.
            </p>
          </section>

          <section className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4">12. Do Not Track Signals</h2>
            <p className="text-gray-300 leading-relaxed">
              Our Service does not currently respond to Do Not Track (DNT) signals. However, you can control tracking through your browser settings and our cookie preferences.
            </p>
          </section>

          <section className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4">13. Changes to This Privacy Policy</h2>
            <p className="text-gray-300 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last updated" date. We may also notify you via email or through the Service for significant changes.
            </p>
          </section>

          <section className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4">14. Data Controller Information</h2>
            <div className="space-y-2 text-gray-300">
              <p><strong>Controller:</strong> APIVault</p>
              <p><strong>Email:</strong> <a href="mailto:privacy@apivault.it.com" className="text-emerald-400 hover:text-emerald-300">privacy@apivault.it.com</a></p>
              <p><strong>Contact:</strong> For privacy-related inquiries, please contact our Data Protection Officer at the email above.</p>
            </div>
          </section>

          <section className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4">15. Supervisory Authority</h2>
            <p className="text-gray-300 leading-relaxed">
              If you are located in the European Economic Area (EEA) or UK, you have the right to lodge a complaint with your local data protection supervisory authority if you believe we have not addressed your concerns adequately.
            </p>
          </section>

          <section className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4">16. Contact Us</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="space-y-2 text-gray-300">
              <p><strong>Email:</strong> <a href="mailto:privacy@apivault.it.com" className="text-emerald-400 hover:text-emerald-300">privacy@apivault.it.com</a></p>
              <p><strong>Website:</strong> <a href="https://apivault.it.com" className="text-emerald-400 hover:text-emerald-300">apivault.it.com</a></p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

