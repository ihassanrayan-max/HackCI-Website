// ============================================
// Timeline Component
// ============================================

export function renderTimeline(items) {
  return `
    <div class="timeline" id="timeline-container">
      <div class="timeline__line">
        <div class="timeline__progress-line" id="timeline-progress"></div>
      </div>
      ${items.map((item, i) => `
        <div class="timeline__item timeline__item--${i % 2 === 0 ? 'left' : 'right'}">
          <div class="timeline__dot">
            <div class="timeline__dot-inner"></div>
          </div>
          <div class="timeline__content card">
            <span class="timeline__date">${item.date}</span>
            <h4 class="timeline__title">${item.title}</h4>
            <p class="timeline__desc">${item.description}</p>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

export function initTimeline() {
  const timeline = document.getElementById('timeline-container');
  const progressLine = document.getElementById('timeline-progress');
  const items = document.querySelectorAll('.timeline__item');

  if (!timeline || !progressLine) return;

  // Scroll-driven line and focus
  const updateTimeline = () => {
    const rect = timeline.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    // Calculate progress based on how much of the timeline is scrolled
    // Start filling when top of timeline hits center of screen
    const startOffset = viewportHeight * 0.5;
    const endOffset = viewportHeight * 0.5;

    const totalHeight = rect.height;
    const scrolled = (viewportHeight - rect.top) - startOffset;

    let percentage = (scrolled / (totalHeight - endOffset + startOffset)) * 100;
    percentage = Math.max(0, Math.min(100, percentage));

    progressLine.style.height = `${percentage}%`;

    // Reveal items
    items.forEach(item => {
      const itemRect = item.getBoundingClientRect();
      // Item is focused when it's around the center of the viewport
      const itemCenter = itemRect.top + itemRect.height / 2;
      const threshold = viewportHeight * 0.65; // Slightly below center looks better for scrolling down

      if (itemRect.top < threshold) {
        item.classList.add('timeline__item--visible');
      } else {
        item.classList.remove('timeline__item--visible');
      }
    });
  };

  window.addEventListener('scroll', updateTimeline);
  updateTimeline(); // Init
}
