/**
 * tilt.js
 * Vanilla JS implementation of 3D tilt effect for elements
 */

export function initTilt() {
    const elements = document.querySelectorAll('[data-tilt]');

    elements.forEach(el => {
        el.addEventListener('mousemove', handleMove);
        el.addEventListener('mouseleave', handleLeave);
        el.addEventListener('mouseenter', handleEnter);
    });

    function handleMove(e) {
        const el = e.currentTarget;
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -10; // Max 10 deg rotation
        const rotateY = ((x - centerX) / centerX) * 10;

        el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

        // Update glare position if it exists
        updateGlare(el, x, y, rect.width, rect.height);
    }

    function handleLeave(e) {
        const el = e.currentTarget;
        el.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)`;
        resetGlare(el);
    }

    function handleEnter(e) {
        // Optional: Prepare transition removal for instant responsiveness
    }

    function updateGlare(el, x, y, w, h) {
        const glare = el.querySelector('.tilt-glare');
        if (glare) {
            const percentX = (x / w) * 100;
            const percentY = (y / h) * 100;
            glare.style.background = `radial-gradient(circle at ${percentX}% ${percentY}%, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 80%)`;
        }
    }

    function resetGlare(el) {
        const glare = el.querySelector('.tilt-glare');
        if (glare) {
            glare.style.background = `none`;
        }
    }
}

// Helper to add glare element
export function addGlare(el) {
    if (!el.querySelector('.tilt-glare')) {
        const glare = document.createElement('div');
        glare.classList.add('tilt-glare');
        // Styles should be in CSS
        el.appendChild(glare);
        el.style.position = 'relative'; // Ensure positioning context
        el.style.overflow = 'hidden'; // Clip glare
    }
}
