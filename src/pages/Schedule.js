// ============================================
// Schedule Page
// ============================================
import { icons } from '../assets/icons.js';
import { scheduleData, categoryColors } from '../data/schedule.js';

import { Modal } from '../components/Modal.js';

export function renderSchedule() {
  const days = Object.keys(scheduleData);

  return `
    <div class="schedule-page">
      <section class="page-hero">
        <div class="container">
          <span class="badge">${icons.calendar} 3-Day Event</span>
          <h1 class="page-hero__title">Event Schedule</h1>
          <p class="page-hero__subtitle">
            Plan your hackathon experience. Here's what's happening across all three days.
          </p>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <!-- Filter Tabs -->
          <div class="schedule-tabs" id="schedule-tabs">
            ${days.map((day, i) => `
              <button class="schedule-tab ${i === 0 ? 'schedule-tab--active' : ''}" data-day="${i}">
                ${day}
              </button>
            `).join('')}
          </div>

          <!-- Category Filter -->
          <div class="schedule-filters">
            <button class="schedule-filter schedule-filter--active" data-cat="all">All</button>
            ${Object.entries(categoryColors).map(([key, val]) => `
              <button class="schedule-filter" data-cat="${key}">${val.label}</button>
            `).join('')}
          </div>

          <!-- Schedule Content -->
          <div class="schedule-content" id="schedule-content">
            ${days.map((day, i) => `
              <div class="schedule-day ${i === 0 ? 'schedule-day--active' : ''}" data-day-index="${i}">
                ${scheduleData[day].map(item => `
                  <!-- Added click handler and data attributes for modal -->
                  <div class="schedule-item interactive-item" 
                       data-category="${item.category}"
                       data-title="${item.title}"
                       data-time="${item.time}"
                       data-location="${item.location}"
                       data-desc="Join us for ${item.title}. This session covers key topics and provides networking opportunities."
                  >
                    <div class="schedule-item__time">
                      ${icons.clock}
                      <span>${item.time}</span>
                    </div>
                    <div class="schedule-item__content card">
                      <div class="schedule-item__header">
                        <h3 class="schedule-item__title">${item.title}</h3>
                        <span class="badge ${categoryColors[item.category].class}">${categoryColors[item.category].label}</span>
                      </div>
                      <div class="schedule-item__meta">
                        ${icons.mapPin}
                        <span>${item.location}</span>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    </div>
  `;
}

export function initSchedule() {
  // Day tab switching
  const tabs = document.querySelectorAll('.schedule-tab');
  const dayPanels = document.querySelectorAll('.schedule-day');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const dayIndex = tab.dataset.day;
      tabs.forEach(t => t.classList.remove('schedule-tab--active'));
      tab.classList.add('schedule-tab--active');
      dayPanels.forEach(panel => {
        panel.classList.toggle('schedule-day--active', panel.dataset.dayIndex === dayIndex);
      });
    });
  });

  // Category filtering
  const filters = document.querySelectorAll('.schedule-filter');
  filters.forEach(filter => {
    filter.addEventListener('click', () => {
      const cat = filter.dataset.cat;
      filters.forEach(f => f.classList.remove('schedule-filter--active'));
      filter.classList.add('schedule-filter--active');

      document.querySelectorAll('.schedule-item').forEach(item => {
        if (cat === 'all' || item.dataset.category === cat) {
          item.style.display = '';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });

  // Modal Interaction
  const items = document.querySelectorAll('.schedule-item');
  items.forEach(item => {
    item.addEventListener('click', () => {
      const data = item.dataset;
      // Construct modal content
      const content = `
                <div class="modal__header">
                    <h2 class="modal__title">${data.title}</h2>
                    <button class="modal__close">
                        ${icons.close}
                    </button>
                </div>
                <div class="modal__body">
                    <div class="modal__meta">
                        <div class="modal__meta-item">
                            ${icons.clock} ${data.time}
                        </div>
                        <div class="modal__meta-item">
                            ${icons.mapPin} ${data.location}
                        </div>
                        <div class="modal__meta-item">
                             <span class="badge badge--sm">${data.category}</span>
                        </div>
                    </div>
                    <div class="modal__desc">
                        <p>${data.desc}</p>
                        <p>Detailed information about the session would go here. For the Hackathon, this includes requirements, speaker bios, and resource links.</p>
                    </div>
                    <div class="modal__actions">
                        <button class="btn btn--outline" onclick="alert('Added to your calendar!')">
                            ${icons.calendar} Add to Calendar
                        </button>
                        <button class="btn btn--primary" data-modal-close>
                            Close
                        </button>
                    </div>
                </div>
            `;
      Modal.open(content);
    });
  });
}
