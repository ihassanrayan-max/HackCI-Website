import { icons } from '../../assets/icons.js';

export function renderPrivacyPolicy() {
    return `
    <div class="legal-page">
      <section class="page-hero">
        <div class="container">
          <a href="#/" class="legal-back-link">
            ${icons.arrowRight} Back to Home
          </a>
          <span class="badge">${icons.sparkles} Legal</span>
          <h1 class="page-hero__title">Privacy Policy</h1>
          <p class="page-hero__subtitle">
            How HackCI collects, uses, and protects your personal information.
          </p>
        </div>
      </section>

      <section class="section">
        <div class="container container--narrow">
          <p class="legal-meta">Last updated: February 19, 2025</p>

          <div class="legal-content">
            <h3>1. Introduction</h3>
            <p>HackCI ("we," "our," or "us") is a 48-hour hackathon hosted by CI Tech at Ontario Tech University. This Privacy Policy describes how we collect, use, store, and protect personal information when you use our website (cihacks.ca), register for the event, submit an application, or participate in HackCI activities. By using our services, you agree to this policy.</p>

            <h3>2. Information We Collect</h3>
            <p>We collect information you provide directly to us:</p>
            <ul>
              <li><strong>Account & identity:</strong> Email address, legal first name, last name, preferred name (when you sign up or sign in via email or Google OAuth).</li>
              <li><strong>Application:</strong> Age range, province/territory, city, attendance preference, student status, school name, program/major, year of study, hackathon experience, skill level, GitHub and LinkedIn URLs, motivation essays, team information, dietary restrictions, accessibility needs, travel support, emergency contact details, and consent acknowledgements.</li>
              <li><strong>Profile:</strong> Optional profile picture (avatar), phone number, Discord, Instagram, WhatsApp, and other contact details you choose to share. Some of this is visible only to your teammates.</li>
              <li><strong>Technical:</strong> IP address, browser type, and usage data may be collected indirectly by our hosting and analytics providers.</li>
            </ul>

            <h3>3. How We Use Your Information</h3>
            <p>We use your information to:</p>
            <ul>
              <li>Run and manage the hackathon (registration, judging, team formation, prizes).</li>
              <li>Communicate with you about the event (confirmations, updates, decisions, logistics).</li>
              <li>Facilitate team matching and collaboration (e.g., showing limited profile info to teammates).</li>
              <li>Provide support (accessibility accommodations, dietary needs, travel assistance).</li>
              <li>Improve our website and services.</li>
              <li>Comply with legal obligations and enforce our policies (including the Code of Conduct).</li>
            </ul>

            <h3>4. Data Sharing</h3>
            <p>We do not sell your personal data. We may share information:</p>
            <ul>
              <li><strong>Teammates:</strong> If you join or are accepted to a team, other team members may see your name, school, program, year, experience, and any contact details you choose to share (e.g., GitHub, LinkedIn, Discord, WhatsApp). You can opt to show as "Anonymous" to teammates in your profile settings.</li>
              <li><strong>Sponsors & partners:</strong> We may share aggregated, non-personally identifiable statistics (e.g., "40% of attendees are from computer science") with sponsors. We do not share individual contact details with sponsors unless you explicitly consent.</li>
              <li><strong>Service providers:</strong> Our website uses Supabase for authentication and database hosting. Data is stored in the cloud and may be processed in Canada or other regions where our providers operate.</li>
              <li><strong>Legal requirements:</strong> We may disclose information when required by law, court order, or to protect our rights and safety.</li>
            </ul>

            <h3>5. Data Security</h3>
            <p>We take reasonable measures to protect your information, including encryption in transit (HTTPS), access controls, and secure authentication. Our database and hosting are managed by Supabase, which follows industry security practices. No system is completely secure; we encourage you to use a strong password and keep your account credentials private.</p>

            <h3>6. Data Retention</h3>
            <p>We retain your data for as long as needed to operate the hackathon, respond to inquiries, and fulfil legal obligations. Application and profile data may be kept for future event planning and alumni communications unless you request deletion. You can contact us to request access, correction, or deletion of your personal information.</p>

            <h3>7. Your Rights</h3>
            <p>Depending on your location, you may have the right to access, correct, delete, or restrict processing of your data. To exercise these rights or withdraw consent for certain uses, contact us at the email below. You may also have the right to lodge a complaint with a supervisory authority.</p>

            <h3>8. Cookies & Tracking</h3>
            <p>Our website may use cookies and similar technologies for essential functionality (e.g., session management). We do not use third-party advertising or profiling cookies. You can disable cookies in your browser settings, though some features may not work.</p>

            <h3>9. Minors</h3>
            <p>HackCI is open to participants under 18 with appropriate consent. If you are under 13, please ensure a parent or guardian assists with registration and consents to this policy.</p>

            <h3>10. Changes</h3>
            <p>We may update this Privacy Policy from time to time. The "Last updated" date at the top reflects the most recent version. Continued use of our services after changes constitutes acceptance of the updated policy.</p>

            <h3>11. Contact Us</h3>
            <p>If you have questions about this Privacy Policy or wish to exercise your rights, contact us at <a href="mailto:hello@cihacks.com">hello@cihacks.com</a>.</p>

            <div class="legal-footer">
              <p>HackCI — Build the Future. Presented by CI Tech at Ontario Tech University.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}
