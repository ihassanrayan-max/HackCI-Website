// ============================================
// About Page
// ============================================
import { icons } from '../assets/icons.js';

export function renderAbout() {
    return `
    <div class="about-page">
      <!-- Hero -->
      <section class="page-hero">
        <div class="container">
          <span class="badge">${icons.sparkles} Our Story</span>
          <h1 class="page-hero__title">About HackCI</h1>
          <p class="page-hero__subtitle">
            HackCI, presented by CI Tech, is a 48-hour hackathon taking place at Ontario Tech University near the end of March.
            The event is expected to host approximately 150–250 students from a variety of universities. Students are welcome to stay overnight on campus.
          </p>
        </div>
      </section>

      <!-- Mission -->
      <section class="section">
        <div class="container container--narrow">
          <div class="glass-card about-mission">
            <h2 class="about-mission__title">Our Mission</h2>
            <p class="about-mission__text">
              The goal of HackCI is to provide engaging activities for students with a passion for innovation.
              Students are welcome to join as solo hackers or in teams.
            </p>
            <p class="about-mission__text">
              HackCI maximizes student engagement by providing: Workshops, Guidance, Hacking sessions, and Networking sessions with companies.
            </p>
            <p class="about-mission__text">
              Students will have the opportunity to: Apply and develop technical skills; Tackle real-world problems; Network with companies such as Ontario Power Generation; Explore co-op opportunities; Build and deliver a project to judges.
            </p>
          </div>
        </div>
      </section>

      <!-- Schedule overview (high-level only) -->
      <section class="section section--alt">
        <div class="container">
          <div class="section__header">
            <h2 class="section__title">Event at a Glance</h2>
            <p class="section__subtitle">A high-level overview of the hackathon weekend. Accepted participants can view the full detailed schedule from their dashboard.</p>
          </div>
          <div class="grid grid--3 stagger">
            <div class="card">
              <h3 class="card__title">Friday</h3>
              <ul class="card__text">
                <li>Registration &amp; Team Formation</li>
                <li>Opening Ceremony</li>
                <li>TMC Session &amp; Dinner</li>
                <li>Networking Event</li>
              </ul>
            </div>
            <div class="card">
              <h3 class="card__title">Saturday</h3>
              <ul class="card__text">
                <li>Breakfast</li>
                <li>Optional Physical Activity</li>
                <li>Hacking Sessions</li>
                <li>Lunch</li>
                <li>Workshops</li>
                <li>Dinner</li>
              </ul>
            </div>
            <div class="card">
              <h3 class="card__title">Sunday</h3>
              <ul class="card__text">
                <li>Breakfast</li>
                <li>Project Deadline</li>
                <li>Live Presentations &amp; Judging</li>
                <li>Lunch &amp; Networking</li>
                <li>Closing Ceremony</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <!-- What to Expect -->
      <section class="section">
        <div class="container">
          <div class="section__header">
            <h2 class="section__title">What to Expect</h2>
            <p class="section__subtitle">Everything you need for an incredible hackathon experience.</p>
          </div>
          <div class="grid grid--3 stagger">
            <div class="card">
              <div class="card__icon">${icons.code}</div>
              <h3 class="card__title">Workshops & Talks</h3>
              <p class="card__text">Learn from industry experts through hands-on workshops on cutting-edge technologies, APIs, and development practices.</p>
            </div>
            <div class="card">
              <div class="card__icon">${icons.users}</div>
              <h3 class="card__title">Team Formation</h3>
              <p class="card__text">Don't have a team? No problem! Our team matching process helps you find the perfect collaborators based on skills and interests.</p>
            </div>
            <div class="card">
              <div class="card__icon">${icons.trophy}</div>
              <h3 class="card__title">Prizes & Awards</h3>
              <p class="card__text">Compete for prizes across multiple categories including Best Overall, Best Design, Most Innovative, and sponsor-specific tracks.</p>
            </div>
            <div class="card">
              <div class="card__icon">${icons.utensils}</div>
              <h3 class="card__title">Food & Drinks</h3>
              <p class="card__text">Stay fueled with complimentary meals, snacks, and beverages throughout the entire event. Dietary restrictions accommodated.</p>
            </div>
            <div class="card">
              <div class="card__icon">${icons.shield}</div>
              <h3 class="card__title">Safe & Inclusive</h3>
              <p class="card__text">We enforce a strict code of conduct to ensure everyone feels welcome and safe. Diversity and inclusion are core to our values.</p>
            </div>
            <div class="card">
              <div class="card__icon">${icons.globe}</div>
              <h3 class="card__title">Networking</h3>
              <p class="card__text">Connect with peers, mentors, and industry professionals. Build lasting relationships that extend far beyond the hackathon.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Team -->
      <section class="section">
        <div class="container">
          <div class="section__header">
            <h2 class="section__title">Meet the Team</h2>
            <p class="section__subtitle">The passionate organizers behind HackCI.</p>
          </div>
          <div class="grid grid--4 about-team stagger">
            ${['Sarah Chen|Lead Organizer', 'Marcus Rivera|Tech Director', 'Priya Patel|Sponsorship Lead', 'David Kim|Design Lead', 'Emma Wilson|Logistics', 'James Okafor|Marketing', 'Aisha Rahman|Mentorship', 'Tom Nguyen|Finance'].map(member => {
        const [name, role] = member.split('|');
        return `
                <div class="about-team__member card">
                  <div class="about-team__avatar">
                    ${icons.user}
                  </div>
                  <h4 class="about-team__name">${name}</h4>
                  <p class="about-team__role">${role}</p>
                </div>
              `;
    }).join('')}
          </div>
        </div>
      </section>

      <!-- Sponsors -->
      <section class="section section--alt">
        <div class="container">
          <div class="section__header">
            <h2 class="section__title">Our Sponsors</h2>
            <p class="section__subtitle">HackCI is made possible by the generous support of our sponsors.</p>
          </div>
          <div class="about-sponsors">
            <div class="about-sponsors__tier">
              <h3 class="about-sponsors__tier-title">Gold Sponsors</h3>
              <div class="about-sponsors__logos about-sponsors__logos--gold">
                <div class="about-sponsors__logo glass-card">Sponsor A</div>
                <div class="about-sponsors__logo glass-card">Sponsor B</div>
              </div>
            </div>
            <div class="about-sponsors__tier">
              <h3 class="about-sponsors__tier-title">Silver Sponsors</h3>
              <div class="about-sponsors__logos about-sponsors__logos--silver">
                <div class="about-sponsors__logo glass-card">Sponsor C</div>
                <div class="about-sponsors__logo glass-card">Sponsor D</div>
                <div class="about-sponsors__logo glass-card">Sponsor E</div>
              </div>
            </div>
            <div class="about-sponsors__tier">
              <h3 class="about-sponsors__tier-title">Community Partners</h3>
              <div class="about-sponsors__logos about-sponsors__logos--community">
                <div class="about-sponsors__logo glass-card">Partner F</div>
                <div class="about-sponsors__logo glass-card">Partner G</div>
                <div class="about-sponsors__logo glass-card">Partner H</div>
                <div class="about-sponsors__logo glass-card">Partner I</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

export function initAbout() {
    // Fade in animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in-up');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.about-page .card, .about-sponsors__logo').forEach(el => {
        observer.observe(el);
    });
}
