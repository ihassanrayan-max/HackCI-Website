/**
 * magnetic.js
 * Physics-based magnetic button effect
 */

export function initMagneticButtons() {
    const buttons = document.querySelectorAll('.btn-magnetic');

    buttons.forEach(btn => {
        btn.addEventListener('mousemove', handleMove);
        btn.addEventListener('mouseleave', handleLeave);
    });

    function handleMove(e) {
        const btn = e.currentTarget;
        const rect = btn.getBoundingClientRect();

        // Calculate mouse position relative to button center
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Distance from center
        const deltaX = e.clientX - centerX;
        const deltaY = e.clientY - centerY;

        // Magnetic pull strength (adjust for feel)
        // We want the button to move *towards* the cursor, so divide delta
        const pullX = deltaX * 0.4;
        const pullY = deltaY * 0.4;

        // Apply transform
        // Use translate3d for hardware accel
        btn.style.transform = `translate3d(${pullX}px, ${pullY}px, 0) scale(1.05)`;
    }

    function handleLeave(e) {
        const btn = e.currentTarget;
        // Elastic snap back
        // We can use CSS transition to handle the smooth return, 
        // provided we set it up correctly in CSS or here.
        // For physics-based feel, simple clearing often works if CSS transition is active.
        btn.style.transform = `translate3d(0, 0, 0) scale(1)`;
    }
}
