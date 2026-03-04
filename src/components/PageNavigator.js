// ============================================
// Page Navigator Component (Scroll Spy)
// ============================================

export function renderPageNavigator(sections) {
    // sections = [{ id: 'hero', label: 'Home' }, ...]
    return `
    <div class="page-nav" id="page-nav">
      ${sections.map(section => `
        <div class="page-nav__dot" data-target="${section.id}" data-label="${section.label}"></div>
      `).join('')}
    </div>
  `;
}

export function initPageNavigator() {
    const nav = document.getElementById('page-nav');
    const dots = document.querySelectorAll('.page-nav__dot');
    if (!nav || !dots.length) return;

    // Show nav after a slight delay
    setTimeout(() => {
        nav.classList.add('active');
    }, 500);

    // Scroll to section on click
    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            const targetId = dot.dataset.target;
            const target = document.getElementById(targetId);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Spy on scroll
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                dots.forEach(dot => {
                    dot.classList.toggle('active', dot.dataset.target === id);
                });
            }
        });
    }, { threshold: 0.5 }); // 50% visible

    dots.forEach(dot => {
        const id = dot.dataset.target;
        const target = document.getElementById(id);
        if (target) observer.observe(target);
    });
}
