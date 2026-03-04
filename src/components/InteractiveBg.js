// ============================================
// Aurora Interactive Background
// ============================================

export function renderInteractiveBg() {
    return `<canvas id="hero-canvas" class="interactive-bg"></canvas>`;
}

export function initInteractiveBg() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width, height;
    let mouse = { x: 0, y: 0 };

    // Aurora Blobs
    const blobs = [
        { x: 0, y: 0, r: 0, vx: 0.5, vy: 0.5, color: 'rgba(30, 144, 255, 0.4)' }, // Blue
        { x: 0, y: 0, r: 0, vx: -0.5, vy: 0.3, color: 'rgba(138, 43, 226, 0.3)' }, // Purple
        { x: 0, y: 0, r: 0, vx: 0.3, vy: -0.5, color: 'rgba(0, 255, 255, 0.2)' }   // Cyan
    ];

    // Constellation Particles
    const particles = [];
    const particleCount = 60; // Adjust for density
    const connectionDistance = 120;

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.5; // Slow movement
            this.vy = (Math.random() - 0.5) * 0.5;
            this.size = Math.random() * 2 + 1;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            // Bounce
            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;

            // Mouse interaction
            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 150) {
                // Gentle push/pull or just highlight
                // Let's connect strongly to mouse
            }
        }

        draw() {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;

        // Reset blobs
        blobs[0].x = width * 0.2; blobs[0].y = height * 0.3; blobs[0].r = width * 0.4;
        blobs[1].x = width * 0.8; blobs[1].y = height * 0.7; blobs[1].r = width * 0.5;
        blobs[2].x = width * 0.5; blobs[2].y = height * 0.5; blobs[2].r = width * 0.3;

        // Reset particles
        particles.length = 0;
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);

        // 1. Draw Aurora (Background Layer)
        ctx.globalCompositeOperation = 'screen';
        blobs.forEach(blob => {
            blob.x += blob.vx;
            blob.y += blob.vy;

            if (blob.x < -blob.r || blob.x > width + blob.r) blob.vx *= -1;
            if (blob.y < -blob.r || blob.y > height + blob.r) blob.vy *= -1;

            // Mouse interaction (Aurora specific)
            const dx = mouse.x - blob.x;
            const dy = mouse.y - blob.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 300) {
                blob.x -= dx * 0.005;
                blob.y -= dy * 0.005;
            }

            const gradient = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.r);
            gradient.addColorStop(0, blob.color);
            gradient.addColorStop(1, 'rgba(0,0,0,0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(blob.x, blob.y, blob.r, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalCompositeOperation = 'source-over';

        // 2. Draw Constellation (Foreground Layer)
        particles.forEach(p => {
            p.update();
            p.draw();
        });

        // Connections
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;

        // Connect particles
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const p1 = particles[i];
                const p2 = particles[j];
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < connectionDistance) {
                    ctx.globalAlpha = 1 - dist / connectionDistance;
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                }
            }
        }

        // Connect to mouse
        particles.forEach(p => {
            const dx = mouse.x - p.x;
            const dy = mouse.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150) {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(mouse.x, mouse.y);
                ctx.stroke();
            }
        });

        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    resize();
    animate();
}
