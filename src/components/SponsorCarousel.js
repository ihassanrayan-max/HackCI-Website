// ============================================
// Sponsor Carousel Component
// ============================================
import { icons } from '../assets/icons.js';

// Dummy sponsor logos (using text/icons for now as no images provided)
const sponsors = [
    { name: 'Google', icon: icons.globe },
    { name: 'Microsoft', icon: icons.code },
    { name: 'Amazon', icon: icons.zap },
    { name: 'Meta', icon: icons.users },
    { name: 'Netflix', icon: icons.sparkles },
    { name: 'Spotify', icon: icons.heart },
    { name: 'Tesla', icon: icons.battery },
    { name: 'OpenAI', icon: icons.cpu },
    // Repeat for infinite feel
    { name: 'Google', icon: icons.globe },
    { name: 'Microsoft', icon: icons.code },
    { name: 'Amazon', icon: icons.zap },
    { name: 'Meta', icon: icons.users },
];

export function renderSponsorCarousel() {
    return `
    <section class="section sponsor-section">
      <div class="container">
        <h3 class="section__title--sm" style="text-align: center; margin-bottom: 2rem; opacity: 0.7;">
          Trusted by Industry Leaders
        </h3>
        <div class="sponsor-carousel">
          <div class="sponsor-track">
            ${sponsors.map(sponsor => `
              <div class="sponsor-item">
                <div class="sponsor-logo">
                  ${sponsor.icon}
                  <span>${sponsor.name}</span>
                </div>
              </div>
            `).join('')}
             ${sponsors.map(sponsor => `
              <div class="sponsor-item">
                <div class="sponsor-logo">
                  ${sponsor.icon}
                  <span>${sponsor.name}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </section>
  `;
}

// Add CSS for Marquee in a style block or separate file?
// Let's rely on global.css or components.css having it, or inject it here.
// I'll inject a small style tag for specifically this component to be self-contained in this step if needed,
// but better to put it in global styles. I will add it to src/styles/components.css
