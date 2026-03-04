// ============================================
// Countdown Timer Component
// ============================================

export function renderCountdown() {
    // Set target date to a future date (placeholder)
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 14);
    targetDate.setHours(9, 0, 0, 0);

    return `
    <div class="countdown" id="countdown" data-target="${targetDate.toISOString()}">
      <div class="countdown__label">HACKING BEGINS IN</div>
      <div class="countdown__grid">
        <div class="countdown__unit">
          <div class="countdown__value" id="countdown-days">00</div>
          <div class="countdown__text">Days</div>
        </div>
        <div class="countdown__separator">:</div>
        <div class="countdown__unit">
          <div class="countdown__value" id="countdown-hours">00</div>
          <div class="countdown__text">Hours</div>
        </div>
        <div class="countdown__separator">:</div>
        <div class="countdown__unit">
          <div class="countdown__value" id="countdown-mins">00</div>
          <div class="countdown__text">Mins</div>
        </div>
        <div class="countdown__separator">:</div>
        <div class="countdown__unit">
          <div class="countdown__value" id="countdown-secs">00</div>
          <div class="countdown__text">Secs</div>
        </div>
      </div>
    </div>
  `;
}

export function initCountdown() {
    const el = document.getElementById('countdown');
    if (!el) return;

    const target = new Date(el.dataset.target).getTime();

    function update() {
        const now = Date.now();
        const diff = Math.max(0, target - now);

        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);

        const daysEl = document.getElementById('countdown-days');
        const hoursEl = document.getElementById('countdown-hours');
        const minsEl = document.getElementById('countdown-mins');
        const secsEl = document.getElementById('countdown-secs');

        if (daysEl) daysEl.textContent = String(d).padStart(2, '0');
        if (hoursEl) hoursEl.textContent = String(h).padStart(2, '0');
        if (minsEl) minsEl.textContent = String(m).padStart(2, '0');
        if (secsEl) {
            // Add flip animation
            if (secsEl.textContent !== String(s).padStart(2, '0')) {
                secsEl.classList.add('countdown__value--flip');
                setTimeout(() => secsEl.classList.remove('countdown__value--flip'), 300);
            }
            secsEl.textContent = String(s).padStart(2, '0');
        }
    }

    update();
    setInterval(update, 1000);
}
