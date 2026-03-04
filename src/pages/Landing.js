// ============================================
// Landing Page
// ============================================
import { icons } from '../assets/icons.js';
import { renderCountdown, initCountdown } from '../components/CountdownTimer.js';
import { renderTimeline, initTimeline } from '../components/Timeline.js';
import { timelineItems, features, landingStats } from '../data/landing.js';
import { renderInteractiveBg, initInteractiveBg } from '../components/InteractiveBg.js';
import { renderPageNavigator, initPageNavigator } from '../components/PageNavigator.js'; // Import
import { renderSponsorCarousel } from '../components/SponsorCarousel.js'; // Import
import { initTilt } from '../utils/tilt.js';
import { initMagneticButtons } from '../utils/magnetic.js';

export function renderLanding() {
  const navSections = [
    { id: 'hero', label: 'Top' },
    { id: 'why-join', label: 'Why Join' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'experience', label: 'Experience' },
    { id: 'cta', label: 'Register' }
  ];

  return `
    <div class="landing">
      ${renderPageNavigator(navSections)}
      <!-- Hero Section -->
      <section class="hero" id="hero">
        <div class="hero__bg">
          <div class="hero__gradient"></div>
          ${renderInteractiveBg()}
        </div>
        <div class="container hero__content">
          <div class="hero__left animate-fade-in-up">
            <span class="badge hero__badge">
              ${icons.sparkles} Registrations Now Open
            </span>
            <h1 class="hero__title">
              Build the Future<br>
              at <span class="text-accent">HackCI</span> 2024
            </h1>
            <p class="hero__subtitle">
              A 48-hour hackathon at Ontario Tech University. Join 150–250 students
              from multiple universities; overnight stay on campus.
            </p>
            <div class="hero__actions">
              <a href="#/signup" class="btn btn--primary btn--lg btn-magnetic">
                ${icons.zap} Register Now
              </a>
              <a href="#/schedule" class="btn btn--secondary btn--lg btn-magnetic">
                ${icons.calendar} View Schedule
              </a>
            </div>
            <div class="hero__meta">
              <div class="hero__meta-item">
                ${icons.mapPin}
                <div>
                  <strong>Ontario Tech University</strong>
                  <span>Ontario • In-Person</span>
                </div>
              </div>
            </div>
          </div>
          <div class="hero__right animate-fade-in-up" style="animation-delay: 0.2s;">
            ${renderCountdown()}
          </div>
        </div>
      </section>

      <!-- Sponsor Carousel -->
      ${renderSponsorCarousel()}

      <!-- Stats Bar -->
      <section class="stats-bar">
        <div class="container">
          <div class="stats-bar__grid">
            ${landingStats.map((stat, i) => `
              <div class="stats-bar__item" data-tilt>
                <div class="tilt-glare"></div>
                <span class="stats-bar__number"${stat.target != null ? ` data-target="${stat.target}" data-prefix="${stat.prefix || ''}" data-suffix="${stat.suffix || ''}"` : ''}>${stat.target != null ? (stat.prefix || '') + '0' + (stat.suffix || '') : stat.number}</span>
                <span class="stats-bar__label">${stat.label}</span>
              </div>
              ${i < landingStats.length - 1 ? '<div class="stats-bar__divider"></div>' : ''}
            `).join('')}
          </div>
        </div>
      </section>

      <!-- Why Join Section -->
      <section class="section why-join" id="why-join">
        <div class="container">
          <div class="section__header">
            <h2 class="section__title">Why Join HackCI?</h2>
            <p class="section__subtitle">
              Experience the thrill of innovation with like-minded developers. We provide
              everything you need to build something amazing.
            </p>
          </div>
          <div class="grid grid--3 stagger">
            ${features.map(feature => `
              <div class="card" data-tilt>
                <div class="tilt-glare"></div>
                <div class="card__icon">${icons[feature.icon]}</div>
                <h3 class="card__title">${feature.title}</h3>
                <p class="card__text">${feature.text}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- Event Timeline -->
      <section class="section section--alt timeline-section" id="timeline">
        <div class="container">
          <div class="section__header">
            <h2 class="section__title">Event Timeline</h2>
            <p class="section__subtitle">
              Mark your calendars for these key dates.
            </p>
          </div>
          ${renderTimeline(timelineItems)}
        </div>
      </section>

      <!-- Experience Section -->
      <section class="section experience" id="experience">
        <div class="container">
          <div class="experience__grid">
            <div class="experience__content">
              <h2 class="section__title" style="text-align: left;">Experience the Energy</h2>
              <p class="experience__desc">
                Join a vibrant community of innovators. From coding sessions to
                networking breaks, every moment is an opportunity.
              </p>
              <div class="experience__features">
                <div class="experience__feature">
                  <div class="experience__feature-icon">${icons.globe}</div>
                  <div>
                    <h4>Networking</h4>
                    <p>Connect with fellow developers from around the world.</p>
                  </div>
                </div>
                <div class="experience__feature">
                  <div class="experience__feature-icon">${icons.zap}</div>
                  <div>
                    <h4>Innovation</h4>
                    <p>Build and ship real products in 48 hours.</p>
                  </div>
                </div>
                <div class="experience__feature">
                  <div class="experience__feature-icon">${icons.heart}</div>
                  <div>
                    <h4>Fun Activities</h4>
                    <p>Gaming, karaoke, midnight snacks, and more.</p>
                  </div>
                </div>
              </div>
            </div>
            <div class="experience__gallery stagger">
              <div class="experience__img experience__img--1 animate-in" data-tilt>
                <div class="tilt-glare"></div>
                <div class="experience__img-placeholder">
                  <span>${icons.code}</span>
                  <span>Hackathon Vibes</span>
                </div>
              </div>
              <div class="experience__img experience__img--2 animate-in" data-tilt>
                 <div class="tilt-glare"></div>
                <div class="experience__img-placeholder">
                  <span>${icons.users}</span>
                  <span>Team Collaboration</span>
                </div>
              </div>
              <div class="experience__img experience__img--3 animate-in" data-tilt>
                 <div class="tilt-glare"></div>
                <div class="experience__img-placeholder">
                  <span>${icons.trophy}</span>
                  <span>Winning Moments</span>
                </div>
              </div>
              <div class="experience__img experience__img--4 animate-in" data-tilt>
                 <div class="tilt-glare"></div>
                <div class="experience__img-placeholder">
                  <span>${icons.sparkles}</span>
                  <span>Demo Day</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="section cta" id="cta">
        <div class="container">
          <div class="cta__inner">
            <h2 class="cta__title">Ready to Build the Future?</h2>
            <p class="cta__subtitle">
              Spots are limited. Secure your place at the most anticipated
              hackathon of the year.
            </p>
            <div class="cta__actions">
              <a href="#/signup" class="btn btn--primary btn--lg btn-magnetic">
                Apply Now ${icons.arrowRight}
              </a>
              <a href="#" class="btn btn--outline btn--lg btn-magnetic">
                ${icons.discord} Join Discord
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

function initStatsCountUp() {
  const statsBar = document.querySelector('.stats-bar');
  if (!statsBar) return;

  const numbers = statsBar.querySelectorAll('.stats-bar__number[data-target]');
  if (!numbers.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      const items = entry.target.querySelectorAll('.stats-bar__number[data-target]');
      items.forEach((el) => {
        const target = parseInt(el.dataset.target, 10);
        const prefix = el.dataset.prefix || '';
        const suffix = el.dataset.suffix || '';
        const duration = 1500;
        const start = performance.now();

        function update(now) {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const easeOut = 1 - Math.pow(1 - progress, 3);
          const value = Math.round(target * easeOut);
          el.textContent = prefix + value + suffix;
          if (progress < 1) requestAnimationFrame(update);
          else el.textContent = prefix + target + suffix;
        }
        requestAnimationFrame(update);
      });
    });
  }, { threshold: 0.3 });

  observer.observe(statsBar);
}

export function initLanding() {
  initCountdown();
  initTimeline();
  initInteractiveBg();
  initTilt();
  initMagneticButtons();
  initPageNavigator();
  initStatsCountUp();

  // Intersection observer for fade-in animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Find if it's the stagger container directly or children
        if (entry.target.classList.contains('stagger')) {
          entry.target.querySelectorAll('.animate-in, .card, .experience__feature').forEach(el => {
            el.classList.add('animate-fade-in-up');
          });
        } else {
          entry.target.classList.add('animate-fade-in-up');
        }
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.stagger, .why-join .card, .experience__feature, .stats-bar__item').forEach(el => {
    observer.observe(el);
  });
}
