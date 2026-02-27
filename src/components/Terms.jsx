import { Link, NavLink, Outlet } from 'react-router-dom'

export default function Terms() {
  return (
    <div className="terms-page">
      <div className="terms-content">
        <Link to="/" className="terms-back">
          ← Back
        </Link>

        <div className="terms-tabs">
          <NavLink
            to="/terms"
            end
            className={({ isActive }) =>
              `terms-tab ${isActive ? 'terms-tab-active' : ''}`
            }
          >
            Terms
          </NavLink>
          <NavLink
            to="/terms/privacy"
            className={({ isActive }) =>
              `terms-tab ${isActive ? 'terms-tab-active' : ''}`
            }
          >
            Privacy
          </NavLink>
        </div>

        <Outlet />
      </div>
    </div>
  )
}

function TermsContent() {
  return (
    <div className="terms-body">
      <h1 className="terms-title">Terms of Service</h1>
      <p className="terms-updated">Last updated: February 2025</p>

      <section>
        <h2>1. Acceptance</h2>
        <p>
          By using Dateful (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), you agree to these Terms of Service. If you do not agree, do not use our service.
        </p>
      </section>

      <section>
        <h2>2. Description of Service</h2>
        <p>
          Dateful is a date night planning assistant for couples. We help you discover and plan activities, and may send you personalized recommendations via SMS, email, or in-app messaging.
        </p>
      </section>

      <section>
        <h2>3. Account & Eligibility</h2>
        <p>
          You must be 18 or older to use Dateful. You are responsible for keeping your account credentials secure and for all activity under your account.
        </p>
      </section>

      <section>
        <h2>4. User Content</h2>
        <p>
          You retain ownership of content you provide. By submitting content, you grant us a license to use it to provide and improve our services.
        </p>
      </section>

      <section>
        <h2>5. Prohibited Use</h2>
        <p>
          You may not use Dateful for unlawful purposes, to harass others, or to abuse our systems. We may suspend or terminate accounts that violate these terms.
        </p>
      </section>

      <section>
        <h2>6. Disclaimer</h2>
        <p>
          Dateful is provided &quot;as is.&quot; We do not guarantee availability, accuracy, or suitability of recommendations. Use at your own discretion.
        </p>
      </section>

      <section>
        <h2>7. Changes</h2>
        <p>
          We may update these terms. Continued use after changes constitutes acceptance. Material changes will be communicated where appropriate.
        </p>
      </section>

      <section>
        <h2>8. Contact</h2>
        <p>
          Questions? Reach out at <a href="https://www.dateful.chat">www.dateful.chat</a> or the contact methods listed on our site.
        </p>
      </section>
    </div>
  )
}

function PrivacyContent() {
  return (
    <div className="terms-body">
      <h1 className="terms-title">Privacy Policy</h1>
      <p className="terms-updated">Last updated: February 2025</p>

      <section>
        <h2>1. Information We Collect</h2>
        <p>
          We collect information you provide directly: name, email, phone number, partner information, preferences (e.g., date frequency, budget, interests), and messages you send to our assistant.
        </p>
        <p>
          We also collect usage data (e.g., how you interact with the app) and technical data (e.g., IP address, device type) to operate and improve our services.
        </p>
      </section>

      <section>
        <h2>2. How We Use Your Information</h2>
        <p>
          We use your information to: provide personalized date recommendations, communicate with you (including via SMS and email), improve our service, send transactional and service-related messages, and comply with legal obligations.
        </p>
      </section>

      <section>
        <h2>3. SMS &amp; Twilio</h2>
        <p>
          We use Twilio to send SMS messages for account verification, date plans, and service updates. By providing your phone number, you consent to receive such messages.
        </p>
        <p>
          <strong>Message frequency:</strong> Varies based on your preferences. You may receive verification codes, date plans, confirmations, and occasional service updates.
        </p>
        <p>
          <strong>Message and data rates may apply.</strong> Carriers may charge for incoming and outgoing SMS.
        </p>
        <p>
          <strong>Opt-out:</strong> You can stop SMS at any time by replying STOP to any message. For help, reply HELP. After opting out, you may not receive important account or service notifications via SMS.
        </p>
        <p>
          Twilio processes messages on our behalf. See <a href="https://www.twilio.com/legal/privacy" target="_blank" rel="noopener noreferrer">Twilio&apos;s Privacy Policy</a> for how they handle data. We do not sell your phone number or SMS content to third parties for marketing.
        </p>
      </section>

      <section>
        <h2>4. Data Sharing</h2>
        <p>
          We share data with service providers (e.g., Twilio for SMS, Supabase for storage, hosting providers) as needed to operate Dateful. We require these providers to protect your data and use it only for the purposes we specify. We do not sell your personal information.
        </p>
      </section>

      <section>
        <h2>5. Data Security</h2>
        <p>
          We use industry-standard practices to protect your data. No method of transmission or storage is 100% secure; we encourage you to use strong passwords and keep your account secure.
        </p>
      </section>

      <section>
        <h2>6. Your Rights</h2>
        <p>
          Depending on your location, you may have rights to access, correct, delete, or export your data. Contact us to exercise these rights. You may also manage communication preferences in your account settings.
        </p>
      </section>

      <section>
        <h2>7. Children</h2>
        <p>
          Dateful is not intended for users under 18. We do not knowingly collect data from children. If you believe we have collected data from a minor, please contact us.
        </p>
      </section>

      <section>
        <h2>8. Changes</h2>
        <p>
          We may update this policy. Material changes will be communicated via email or in-app notice. Continued use after changes constitutes acceptance.
        </p>
      </section>

      <section>
        <h2>9. Contact</h2>
        <p>
          Privacy questions? Reach out at <a href="https://www.dateful.chat">www.dateful.chat</a> or the contact methods listed on our site.
        </p>
      </section>
    </div>
  )
}

export { TermsContent, PrivacyContent }
