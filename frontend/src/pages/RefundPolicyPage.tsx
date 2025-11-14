import { Link } from 'react-router-dom';

export function RefundPolicyPage() {
  const sectionSpacing = 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12';
  const lastUpdated = 'November 11, 2025';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <div className={sectionSpacing}>
        <div className="mb-8">
          <Link to="/" className="text-emerald-400 hover:text-emerald-300 text-sm mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">Refund Policy</h1>
          <p className="text-gray-400">Last updated: {lastUpdated}</p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8">
          <section className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
            <p className="text-gray-300 leading-relaxed">
              At APIVault, we want you to be completely satisfied with our Service. This Refund Policy outlines the terms and conditions under which refunds may be issued for our paid subscription plans. Please read this policy carefully before making a purchase.
            </p>
          </section>

          <section className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4">2. 30-Day Money-Back Guarantee</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              We offer a <strong className="text-white">30-day money-back guarantee</strong> for all new paid subscriptions. If you are not satisfied with our Service within the first 30 days of your initial subscription, you may request a full refund, no questions asked.
            </p>
            <div className="space-y-2 text-gray-300">
              <p><strong>Eligibility:</strong> This guarantee applies only to first-time subscriptions and the initial subscription period. It does not apply to renewals or subsequent billing cycles.</p>
              <p><strong>Timeframe:</strong> Refund requests must be submitted within 30 days of the initial subscription date.</p>
              <p><strong>Processing:</strong> Refunds will be processed within 5-10 business days of approval.</p>
            </div>
          </section>

          <section className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4">3. Refund Eligibility Criteria</h2>
            <div className="space-y-4 text-gray-300">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">3.1 Eligible for Refund</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>New subscriptions within the first 30 days</li>
                  <li>Service unavailability or significant technical issues preventing normal use</li>
                  <li>Billing errors or unauthorized charges</li>
                  <li>Duplicate charges</li>
                  <li>Failure to provide promised features (subject to our discretion)</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">3.2 Not Eligible for Refund</h3>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Subscriptions after the 30-day guarantee period</li>
                  <li>Renewals or subsequent billing cycles</li>
                  <li>Free tier subscriptions (no payment made)</li>
                  <li>Usage-based charges (API requests, overages) after services have been consumed</li>
                  <li>Violation of Terms of Service resulting in account termination</li>
                  <li>Requests made after account deletion or termination</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4">4. Pro-Rated Refund Calculations</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              For eligible refunds requested after the 30-day guarantee period (in exceptional circumstances), we may offer pro-rated refunds calculated as follows:
            </p>
            <div className="space-y-2 text-gray-300">
              <p><strong>Monthly Subscriptions:</strong> Refund = (Remaining days / Total days in billing period) × Subscription amount</p>
              <p><strong>Annual Subscriptions:</strong> Refund = (Remaining months / 12) × Annual subscription amount, minus any discounts applied</p>
              <p className="mt-4"><strong>Example:</strong> If you cancel an annual subscription after 3 months, you would receive a refund for 9 remaining months (75% of the annual fee).</p>
            </div>
          </section>

          <section className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4">5. Non-Refundable Circumstances</h2>
            <p className="text-gray-300 leading-relaxed mb-4">The following circumstances are non-refundable:</p>
            <ul className="list-disc list-inside ml-4 space-y-2 text-gray-300">
              <li><strong>Consumed Services:</strong> Any usage-based charges (API requests, storage, etc.) that have already been consumed</li>
              <li><strong>Third-Party Fees:</strong> Transaction fees charged by payment processors (e.g., Stripe fees)</li>
              <li><strong>Custom Integrations:</strong> Fees for custom development or integration work</li>
              <li><strong>Training or Consulting:</strong> Professional services that have been delivered</li>
              <li><strong>Violations:</strong> Accounts terminated for Terms of Service violations</li>
              <li><strong>Payment Method Issues:</strong> Refunds cannot be issued if the original payment method is no longer valid</li>
            </ul>
          </section>

          <section className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4">6. How to Request a Refund</h2>
            <div className="space-y-4 text-gray-300">
              <p>To request a refund, please follow these steps:</p>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Step 1: Submit a Request</h3>
                <p>Contact our support team via:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Email: <a href="mailto:support@apivault.it.com" className="text-emerald-400 hover:text-emerald-300">support@apivault.it.com</a></li>
                  <li>Include your account email and subscription details</li>
                  <li>Provide a reason for the refund request</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Step 2: Verification</h3>
                <p>We will verify your account and subscription details, which may take 1-2 business days.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Step 3: Review and Approval</h3>
                <p>Our team will review your request and notify you of the decision within 3-5 business days.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Step 4: Processing</h3>
                <p>If approved, the refund will be processed to your original payment method within 5-10 business days.</p>
              </div>
            </div>
          </section>

          <section className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4">7. Refund Processing Timeline</h2>
            <div className="space-y-2 text-gray-300">
              <p><strong>Request Submission:</strong> Immediate</p>
              <p><strong>Verification:</strong> 1-2 business days</p>
              <p><strong>Review and Decision:</strong> 3-5 business days</p>
              <p><strong>Refund Processing:</strong> 5-10 business days after approval</p>
              <p><strong>Total Timeline:</strong> Typically 10-17 business days from request to funds appearing in your account</p>
              <p className="mt-4 text-gray-400">Note: Processing times may vary depending on your payment method and financial institution.</p>
            </div>
          </section>

          <section className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4">8. Refund Method</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Refunds will be issued to the original payment method used for the purchase:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2 text-gray-300">
              <li><strong>Credit/Debit Cards:</strong> Refunded directly to the card used for payment</li>
              <li><strong>PayPal:</strong> Refunded to the PayPal account used for payment</li>
              <li><strong>Bank Transfer:</strong> Refunded to the bank account on file (may take longer)</li>
            </ul>
            <p className="text-gray-300 mt-4">
              If the original payment method is no longer available, please contact us to arrange an alternative refund method.
            </p>
          </section>

          <section className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4">9. Account Status After Refund</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Upon approval of a refund:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2 text-gray-300">
              <li>Your paid subscription will be downgraded to the Free tier immediately</li>
              <li>You will retain access to your account and data for 30 days after the refund</li>
              <li>After 30 days, your account may be archived or deleted in accordance with our data retention policy</li>
              <li>You can export your data before account deletion</li>
            </ul>
          </section>

          <section className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4">10. Cancellation vs. Refund</h2>
            <div className="space-y-4 text-gray-300">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Cancellation</h3>
                <p>Canceling your subscription stops future billing but does not automatically issue a refund. Cancellations are effective at the end of your current billing period.</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Refund Request</h3>
                <p>A refund request is a separate process that may result in immediate cancellation and reimbursement for unused portions of your subscription.</p>
              </div>
              <p className="mt-4">You can cancel your subscription at any time through your account settings. Refunds must be requested separately.</p>
            </div>
          </section>

          <section className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4">11. Tax and Compliance</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Refunds are subject to applicable tax laws and regulations:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2 text-gray-300">
              <li>Sales tax, VAT, or GST may not be refunded if already remitted to tax authorities</li>
              <li>We comply with local tax regulations in your jurisdiction</li>
              <li>Refund amounts may be adjusted based on applicable taxes</li>
              <li>You are responsible for any tax implications of receiving a refund</li>
            </ul>
          </section>

          <section className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4">12. Disputes and Chargebacks</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              If you are unsatisfied with our refund decision, please contact us to discuss your concerns before initiating a chargeback:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2 text-gray-300">
              <li>Chargebacks may result in account suspension or termination</li>
              <li>We will work with you to resolve disputes amicably</li>
              <li>Chargebacks are a last resort and should only be used if we are unresponsive</li>
            </ul>
          </section>

          <section className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4">13. Changes to This Refund Policy</h2>
            <p className="text-gray-300 leading-relaxed">
              We may update this Refund Policy from time to time. Changes will be effective immediately upon posting. Material changes will be communicated via email or through the Service. Your continued use of the Service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4">14. Contact Us</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              For refund requests or questions about this Refund Policy, please contact us:
            </p>
            <div className="space-y-2 text-gray-300">
              <p><strong>Email:</strong> <a href="mailto:support@apivault.it.com" className="text-emerald-400 hover:text-emerald-300">support@apivault.it.com</a></p>
              <p><strong>Subject Line:</strong> "Refund Request - [Your Account Email]"</p>
              <p><strong>Website:</strong> <a href="https://apivault.it.com" className="text-emerald-400 hover:text-emerald-300">apivault.it.com</a></p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

