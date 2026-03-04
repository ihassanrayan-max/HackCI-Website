// ============================================
// Footer Component
// ============================================
import { icons } from '../assets/icons.js';

export function renderFooter() {
    return `
    <footer class="footer">
      <div class="container">
        <div class="footer__grid">
          <!-- Brand -->
          <div class="footer__brand">
            <div class="footer__logo">
              <svg width="32" height="32" viewBox="0 0 32 32">
                <defs>
                  <linearGradient id="logo-footer" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#1e90ff"/>
                    <stop offset="100%" style="stop-color:#3ba0ff"/>
                  </linearGradient>
                </defs>
                <circle cx="16" cy="16" r="14" fill="url(#logo-footer)"/>
                <text x="16" y="21" text-anchor="middle" fill="white" font-family="Inter,sans-serif" font-weight="800" font-size="12">CI</text>
              </svg>
              <span>HackCI</span>
            </div>
            <p class="footer__tagline">A 48-hour hackathon experience.</p>
            <div class="footer__socials">
              <a href="#" class="footer__social-link" aria-label="GitHub">${icons.github}</a>
              <a href="#" class="footer__social-link" aria-label="Discord">${icons.discord}</a>
              <a href="#" class="footer__social-link" aria-label="Twitter">${icons.twitter}</a>
              <a href="#" class="footer__social-link" aria-label="LinkedIn">${icons.linkedin}</a>
              <a href="#" class="footer__social-link" aria-label="Instagram">${icons.instagram}</a>
            </div>
          </div>

          <!-- Links -->
          <div class="footer__links-group">
            <h4 class="footer__heading">Quick Links</h4>
            <ul class="footer__links">
              <li><a href="#/">Home</a></li>
              <li><a href="#/about">About</a></li>
              <li><a href="#/faq">FAQ</a></li>
            </ul>
          </div>

          <div class="footer__links-group">
            <h4 class="footer__heading">Resources</h4>
            <ul class="footer__links">
              <li><a href="#/code-of-conduct">Code of Conduct</a></li>
              <li><a href="#/privacy">Privacy Policy</a></li>
              <li><a href="#">Sponsorship</a></li>
              <li><a href="mailto:hello@cihacks.com">Contact Us</a></li>
            </ul>
          </div>

          <div class="footer__links-group">
            <h4 class="footer__heading">Get Involved</h4>
            <ul class="footer__links">
              <li><a href="#/signup">Register</a></li>
              <li><a href="#">Become a Mentor</a></li>
              <li><a href="#">Become a Sponsor</a></li>
              <li><a href="#">Volunteer</a></li>
            </ul>
          </div>
        </div>

        <div class="footer__bottom">
          <p>&copy; 2024 HackCI. All rights reserved.</p>
          <div class="footer__bottom-links">
            <a href="#/code-of-conduct">Code of Conduct</a>
            <a href="#/privacy">Privacy Policy</a>
            <a href="#">Sponsors</a>
            <a href="mailto:hello@cihacks.com">Contact Us</a>
          </div>
        </div>
      </div>
    </footer>
  `;
}
