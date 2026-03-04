import './LoadingSpinner.css';

export function renderLoadingSpinner() {
    return `
    <div class="loading-overlay" id="loading-overlay">
      <div class="loading-spinner">
        <svg viewBox="0 0 50 50" class="loading-spinner__svg">
          <circle cx="25" cy="25" r="20" fill="none" stroke-width="4"></circle>
        </svg>
      </div>
    </div>
  `;
}

export function showLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.add('loading-overlay--active');
    }
}

export function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.remove('loading-overlay--active');
    }
}
