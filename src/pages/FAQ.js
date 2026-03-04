// ============================================
// FAQ Page
// ============================================
import { icons } from '../assets/icons.js';
import { faqData } from '../data/faq.js';

export function renderFAQ() {
    return `
    <div class="faq-page">
      <section class="page-hero">
        <div class="container">
          <span class="badge">${icons.sparkles} Got Questions?</span>
          <h1 class="page-hero__title">Frequently Asked Questions</h1>
          <p class="page-hero__subtitle">
            Find answers to common questions about HackCI. Can't find what you're looking for? Reach out to us!
          </p>
        </div>
      </section>

      <section class="section">
        <div class="container container--narrow">
          <!-- Search -->
          <div class="faq-search">
            <div class="faq-search__input-wrap">
              ${icons.search}
              <input type="text" class="input faq-search__input" id="faq-search" placeholder="Search questions..." />
            </div>
          </div>

          <!-- FAQ Sections -->
          ${faqData.map(section => `
            <div class="faq-section" data-category="${section.category}">
              <h2 class="faq-section__title">${section.category}</h2>
              <div class="accordion">
                ${section.questions.map((item, i) => `
                  <div class="accordion__item" data-q="${item.q.toLowerCase()}">
                    <button class="accordion__trigger">
                      <span>${item.q}</span>
                      ${icons.chevronDown}
                    </button>
                    <div class="accordion__content">
                      <div class="accordion__body">${item.a}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}

          <!-- Contact CTA -->
          <div class="faq-contact glass-card">
            <h3>Still have questions?</h3>
            <p>We'd love to hear from you. Reach out and we'll get back to you ASAP.</p>
            <div class="faq-contact__actions">
              <a href="mailto:hello@cihacks.com" class="btn btn--primary">
                Email Us
              </a>
              <a href="#" class="btn btn--secondary">
                ${icons.discord} Join Discord
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

export function initFAQ() {
    // Accordion toggles
    document.querySelectorAll('.accordion__trigger').forEach(trigger => {
        trigger.addEventListener('click', () => {
            const item = trigger.parentElement;
            const isActive = item.classList.contains('active');

            // Close all others in same accordion
            item.closest('.accordion').querySelectorAll('.accordion__item').forEach(i => {
                i.classList.remove('active');
            });

            if (!isActive) {
                item.classList.add('active');
            }
        });
    });

    // Search
    const searchInput = document.getElementById('faq-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            document.querySelectorAll('.accordion__item').forEach(item => {
                const text = item.dataset.q || '';
                item.style.display = text.includes(query) ? '' : 'none';
            });
            // Hide empty sections
            document.querySelectorAll('.faq-section').forEach(section => {
                const visible = section.querySelectorAll('.accordion__item[style=""], .accordion__item:not([style])');
                section.style.display = visible.length > 0 ? '' : 'none';
            });
        });
    }
}
