// ============================================
// CSV Export Utility — Admin Dashboard
// Builds flat rows, converts to RFC-4180 CSV, downloads, and tracks exports.
// ============================================
import { supabase } from './supabase.js';
import { questions } from '../data/applicationQuestions.js';

export const PII_FIELDS = new Set([
    'email',
    'phone',
    'emergency_contact_name',
    'emergency_contact_phone',
]);

/**
 * Build flat row objects for CSV export.
 * @param {Object[]} apps — Application objects with answers, profile, review
 * @param {{ excludePii?: boolean }} opts
 * @returns {Object[]}
 */
export function buildRows(apps, { excludePii = false } = {}) {
    if (!apps.length) return [];
    const omitPii = excludePii ? PII_FIELDS : new Set();

    const questionCols = questions
        .filter(q => !omitPii.has(q.id))
        .map(q => ({ id: q.id, label: q.question }));

    const baseHeaders = [
        'applicant_id',
        'full_name',
        ...(omitPii.has('email') ? [] : ['email']),
        'submitted_at',
        'current_status',
        'location_city',
        'location_province',
        'track_interest',
    ];
    const questionHeaders = questionCols.map(q => q.label);
    const reviewHeaders = ['decision', 'score', 'tags', 'internal_notes', 'reviewed_at'];
    const allHeaders = [...baseHeaders, ...questionHeaders, ...reviewHeaders];

    return apps.map(app => {
        const profile = app.profile || {};
        const answers = app.answers || {};
        const review = app.review || {};

        const firstName = answers.legal_first_name || profile.first_name || '';
        const lastName = answers.legal_last_name || profile.last_name || '';
        const preferredName = answers.preferred_name ? ` (${answers.preferred_name})` : '';
        const fullName = `${firstName} ${lastName}${preferredName}`.trim() || '—';
        const email = profile.email || '';
        const submittedAt = app.submitted_at
            ? new Date(app.submitted_at).toISOString()
            : '';
        const status = app.status || '';
        const city = answers.city || '';
        const province = answers.province || '';
        const tracks = Array.isArray(answers.tracks) ? answers.tracks : [];
        const trackInterest = tracks.join('; ');

        const row = {};
        row['applicant_id'] = app.id || '';
        row['full_name'] = fullName;
        if (!omitPii.has('email')) row['email'] = email;
        row['submitted_at'] = submittedAt;
        row['current_status'] = status;
        row['location_city'] = city;
        row['location_province'] = province;
        row['track_interest'] = trackInterest;

        for (const { id, label } of questionCols) {
            const val = answers[id];
            row[label] = Array.isArray(val) ? val.join('; ') : (val != null && val !== '' ? String(val) : '');
        }

        row['decision'] = review.decision || '';
        row['score'] = review.score != null ? String(review.score) : '';
        row['tags'] = Array.isArray(review.tags) ? review.tags.join('; ') : '';
        row['internal_notes'] = review.notes || '';
        row['reviewed_at'] = (review.updated_at || review.created_at)
            ? new Date(review.updated_at || review.created_at).toISOString()
            : '';

        const ordered = {};
        for (const h of allHeaders) {
            ordered[h] = row[h] ?? '';
        }
        return ordered;
    });
}

/**
 * Convert array of flat objects to RFC-4180 CSV string.
 * @param {Object[]} rows
 * @returns {string}
 */
export function toCsv(rows) {
    if (!rows.length) return '';
    const headers = Object.keys(rows[0]);
    const escape = (val) => {
        const s = String(val ?? '');
        if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
            return '"' + s.replace(/"/g, '""') + '"';
        }
        return s;
    };
    const headerLine = headers.map(escape).join(',');
    const dataLines = rows.map(r => headers.map(h => escape(r[h])).join(','));
    return [headerLine, ...dataLines].join('\r\n');
}

/**
 * Trigger browser download of CSV file.
 * @param {string} csvString
 * @param {string} filename
 */
export function downloadCsv(csvString, filename) {
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * Mark applications as exported in the database. Batches of 100.
 * @param {string[]} appIds
 * @returns {Promise<void>}
 */
export async function trackExported(appIds) {
    if (!appIds.length) return;
    const BATCH_SIZE = 100;
    const ts = new Date().toISOString();
    for (let i = 0; i < appIds.length; i += BATCH_SIZE) {
        const batch = appIds.slice(i, i + BATCH_SIZE);
        const { error } = await supabase
            .from('applications')
            .update({ exported_at: ts })
            .in('id', batch);
        if (error) throw error;
    }
}
