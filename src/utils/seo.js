/**
 * seo.js
 * Utility to update document title and meta tags dynamically
 */

const baseTitle = 'HackCI';
const baseDesc = 'A 48-hour hackathon at Ontario Tech University. Join 150–250 students from multiple universities; overnight stay on campus.';

export function updateSEO(title, description = baseDesc) {
    // Update Title
    document.title = title ? `${title} — ${baseTitle}` : baseTitle;

    // Update Meta Description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
        metaDesc.setAttribute('content', description);
    }

    // Update OG:Title
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
        ogTitle.setAttribute('content', document.title);
    }

    // Update OG:Description
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) {
        ogDesc.setAttribute('content', description);
    }
}
