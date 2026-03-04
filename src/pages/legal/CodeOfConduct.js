import { icons } from '../../assets/icons.js';

export function renderCodeOfConduct() {
    return `
    <div class="legal-page">
      <section class="page-hero">
        <div class="container">
          <a href="#/" class="legal-back-link">
            ${icons.arrowRight} Back to Home
          </a>
          <span class="badge">${icons.sparkles} Community</span>
          <h1 class="page-hero__title">Code of Conduct</h1>
          <p class="page-hero__subtitle">
            HackCI is dedicated to providing a harassment-free experience for everyone.
          </p>
        </div>
      </section>

      <section class="section">
        <div class="container container--narrow">
          <p class="legal-meta">All participants, sponsors, speakers, mentors, and staff must follow this code.</p>

          <div class="legal-content">
            <h3>Our Standard</h3>
            <p>We do not tolerate harassment of participants in any form. Sexual language and imagery are not appropriate for any hackathon venue, including hacks, talks, workshops, parties, social media, and other online media. Harassment includes, but is not limited to: offensive comments related to gender, gender identity, sexual orientation, disability, physical appearance, body size, race, ethnicity, religion, or technology choices; deliberate intimidation; stalking; following; harassing photography or recording; sustained disruption of talks or other events; inappropriate physical contact; and unwelcome sexual attention.</p>

            <h3>Expected Behavior</h3>
            <p>All participants are expected to:</p>
            <ul>
              <li>Be respectful and inclusive toward everyone, regardless of background or experience level.</li>
              <li>Respect the privacy and personal space of others.</li>
              <li>Collaborate openly and share knowledge in a constructive way.</li>
              <li>Accept constructive criticism and focus on what is best for the community.</li>
              <li>Use welcoming and inclusive language.</li>
              <li>Report any harassing or unacceptable behavior to organizers immediately.</li>
            </ul>

            <h3>Unacceptable Behavior</h3>
            <p>The following behaviors are unacceptable:</p>
            <ul>
              <li>Harassment, discrimination, or intimidation of any kind.</li>
              <li>Violence, threats, or incitement of violence.</li>
              <li>Possession of weapons or dangerous items at the venue.</li>
              <li>Alcohol or substance abuse during event hours (where prohibited).</li>
              <li>Disruption of the event or interference with others' participation.</li>
              <li>Sharing or displaying sexually explicit or violent material.</li>
            </ul>

            <h3>Consequences</h3>
            <p>Participants who violate this Code of Conduct may be sanctioned or expelled from the hackathon without refund (if applicable) at the sole discretion of the HackCI organizers. Sanctions may include a verbal warning, a written warning, removal from specific activities, expulsion from the event, or a ban from future HackCI events. Serious violations may be reported to the appropriate authorities.</p>

            <h3>Reporting</h3>
            <p>If you are being harassed, notice that someone else is being harassed, or have any other concerns, please contact a member of the HackCI staff immediately. Staff can be identified by event badges or by contacting us at <a href="mailto:hello@cihacks.com">hello@cihacks.com</a>. All reports will be treated confidentially. We will investigate promptly and take appropriate action. We are here to help.</p>

            <h3>Scope</h3>
            <p>This Code of Conduct applies to all HackCI spaces, including the website, registration and application portal, Discord or other communication channels, the physical event venue, and any related activities. By participating in HackCI, you agree to abide by this code.</p>

            <div class="legal-footer">
              <p>HackCI — Build the Future. Presented by CI Tech at Ontario Tech University.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}
