// ============================================
// Modal Component
// ============================================
import { icons } from '../assets/icons.js';

let modalOverlay = null;

export function renderModalContainer() {
    return `
    <div class="modal-overlay" id="global-modal-overlay">
      <div class="modal" id="global-modal-content">
        <!-- Content injected here -->
      </div>
    </div>
  `;
}

export const Modal = {
    init() {
        if (modalOverlay) return; // Already inited or just checking

        // We assume renderModalContainer is injected in main.js or index.html
        // But since we are vanilla, let's look for it or create it.
        modalOverlay = document.getElementById('global-modal-overlay');

        if (!modalOverlay) {
            // Append to body if not present (should be done in main layout really)
            const div = document.createElement('div');
            div.innerHTML = renderModalContainer();
            document.body.appendChild(div.firstElementChild);
            modalOverlay = document.getElementById('global-modal-overlay');
        }

        // Close on overlay click
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                Modal.close();
            }
        });

        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
                Modal.close();
            }
        });
    },

    open(contentHTML) {
        this.init(); // Ensure it exists
        const modalContent = document.getElementById('global-modal-content');

        // Add close button if not in content (helper)
        const closeBtnHTML = `
            <button class="modal__close" onclick="document.getElementById('global-modal-overlay').classList.remove('active')">
                ${icons.close || 'X'}
            </button>
        `;

        // We can structure the content or just dump HTML
        // Let's assume we pass full innerHTML or we wrapper it
        modalContent.innerHTML = contentHTML;

        // Re-attach close listeners inside
        // Select all elements that should close the modal
        const closeTriggerElements = modalContent.querySelectorAll('.modal__close, [data-modal-close]');
        closeTriggerElements.forEach(el => {
            el.addEventListener('click', () => Modal.close());
        });

        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    close() {
        if (modalOverlay) {
            modalOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
};
