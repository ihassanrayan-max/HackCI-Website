import { icons } from '../assets/icons.js';
import './NotFound.css';

export function renderNotFound() {
    return `
    <div class="not-found-page">
      <div class="container container--narrow">
        <div class="not-found-content">
          <div class="not-found__icon">404</div>
          <h1 class="not-found__title">Page Not Found</h1>
          <p class="not-found__text">
            Oops! The page you're looking for doesn't exist or has been moved.
          </p>
          <a href="#/" class="btn btn--primary btn--lg">
            ${icons.arrowLeft} Back to Home
          </a>
        </div>
      </div>
    </div>
  `;
}

export function initNotFound() {
    // Optional: could add some fun animation or logging here
}
