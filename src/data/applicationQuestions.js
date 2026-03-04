// ============================================
// Application Questions — HackCI
// 7 sections (A–G) — finalized question set.
// ============================================

export const SECTIONS = [
    { id: 'A', title: 'Basic Info' },
    { id: 'B', title: 'Education & Background' },
    { id: 'C', title: 'Links' },
    { id: 'D', title: 'Motivation' },
    { id: 'E', title: 'Team' },
    { id: 'F', title: 'Logistics' },
    { id: 'G', title: 'Consent' },
];

export const CANADIAN_PROVINCES = [
    'Alberta',
    'British Columbia',
    'Manitoba',
    'New Brunswick',
    'Newfoundland and Labrador',
    'Northwest Territories',
    'Nova Scotia',
    'Nunavut',
    'Ontario',
    'Prince Edward Island',
    'Quebec',
    'Saskatchewan',
    'Yukon',
];

// Kept for admin dashboard track filter and TeamHub/AdminTeams roles
export const TRACKS = [
    'AI / Machine Learning',
    'Web Development',
    'Mobile Development',
    'Hardware / IoT',
    'Data Science',
    'Sustainability / CleanTech',
    'Health Tech',
    'FinTech',
    'Social Impact',
    'Open Innovation',
];

export const SKILLS_OPTIONS = [
    'Web (Frontend)',
    'Web (Backend)',
    'Mobile (iOS)',
    'Mobile (Android)',
    'AI / ML',
    'Data Science',
    'UI / UX Design',
    'Hardware / Embedded',
    'Pitch / Business',
    'Project Management',
    'Other',
];

/**
 * Full question set.
 * Each question has:
 *   id       — unique key for storing the answer
 *   section  — section letter (A–G)
 *   type     — text | email | tel | textarea | select | radio | checkbox | date | url
 *   question — displayed question text
 *   helper   — optional helper / hint text
 *   required — boolean
 *   options  — array of strings (for select / radio / checkbox)
 *   condition — { questionId, value } — only show if answer[questionId] === value
 *   placeholder — optional placeholder string
 */
export const questions = [
    // ─── SECTION A: Basic Info ─────────────────────────────────────────────
    {
        id: 'legal_first_name',
        section: 'A',
        type: 'text',
        question: 'Legal First Name',
        helper: 'As it appears on your government-issued ID.',
        required: true,
        placeholder: 'e.g. Alex',
    },
    {
        id: 'legal_last_name',
        section: 'A',
        type: 'text',
        question: 'Legal Last Name',
        required: true,
        placeholder: 'e.g. Johnson',
    },
    {
        id: 'preferred_name',
        section: 'A',
        type: 'text',
        question: 'Preferred Name',
        helper: "Optional — what we'll call you at the event.",
        required: false,
        placeholder: 'e.g. Alex (leave blank if same)',
    },
    {
        id: 'email',
        section: 'A',
        type: 'email',
        question: 'Email Address',
        helper: 'Pre-filled from your account. We\'ll use this to contact you.',
        required: true,
        placeholder: 'you@example.com',
    },
    {
        id: 'age_range',
        section: 'A',
        type: 'radio',
        question: 'Age Range',
        required: true,
        options: ['Under 18', '18–24', '25–34', '35+'],
    },
    {
        id: 'province',
        section: 'A',
        type: 'select',
        question: 'Province/Territory',
        required: true,
        options: CANADIAN_PROVINCES,
    },
    {
        id: 'city',
        section: 'A',
        type: 'text',
        question: 'City',
        required: true,
        placeholder: 'e.g. Toronto',
    },
    {
        id: 'can_attend',
        section: 'A',
        type: 'radio',
        question: 'Can attend in person?',
        helper: 'The event is primarily in-person. Online participation may be available.',
        required: true,
        options: ['Yes in person', 'Online only', 'Either', 'Not sure'],
    },

    // ─── SECTION B: Education & Background ──────────────────────────────────
    {
        id: 'is_student',
        section: 'B',
        type: 'radio',
        question: 'Student?',
        required: true,
        options: ['Yes', 'No'],
    },
    {
        id: 'school_name',
        section: 'B',
        type: 'text',
        question: 'School Name',
        required: false,
        condition: { questionId: 'is_student', value: 'Yes' },
        placeholder: 'e.g. University of Toronto',
    },
    {
        id: 'program',
        section: 'B',
        type: 'text',
        question: 'Program/Major',
        required: false,
        condition: { questionId: 'is_student', value: 'Yes' },
        placeholder: 'e.g. Computer Science',
    },
    {
        id: 'year_of_study',
        section: 'B',
        type: 'select',
        question: 'Year of Study',
        required: false,
        condition: { questionId: 'is_student', value: 'Yes' },
        options: ['1st', '2nd', '3rd', '4th', '5th+', 'Masters', 'PhD', 'Other'],
    },
    {
        id: 'hackathon_experience',
        section: 'B',
        type: 'radio',
        question: 'Hackathon Experience',
        required: true,
        options: ['First time', '1–2', '3–5', '6+'],
    },
    {
        id: 'skill_level',
        section: 'B',
        type: 'radio',
        question: 'Overall Skill Level',
        helper: 'Be honest — we welcome all skill levels!',
        required: true,
        options: ['Beginner', 'Intermediate', 'Advanced'],
    },

    // ─── SECTION C: Links ────────────────────────────────────────────────────
    {
        id: 'github',
        section: 'C',
        type: 'url',
        question: 'GitHub URL',
        required: true,
        placeholder: 'https://github.com/username',
    },
    {
        id: 'linkedin',
        section: 'C',
        type: 'url',
        question: 'LinkedIn URL',
        required: true,
        placeholder: 'https://linkedin.com/in/username',
    },

    // ─── SECTION D: Motivation ───────────────────────────────────────────────
    {
        id: 'why_attend',
        section: 'D',
        type: 'textarea',
        question: 'Why do you want to attend HackCI?',
        required: true,
        placeholder: 'I want to attend HackCI because…',
    },
    {
        id: 'win_for_you',
        section: 'D',
        type: 'textarea',
        question: 'What would make this weekend a "win" for you?',
        required: true,
        placeholder: 'A win for me would be…',
    },

    // ─── SECTION E: Team ─────────────────────────────────────────────────────
    {
        id: 'has_team',
        section: 'E',
        type: 'radio',
        question: 'Do you already have teammates?',
        required: true,
        options: ['Yes', 'No'],
    },
    {
        id: 'team_emails',
        section: 'E',
        type: 'textarea',
        question: 'Teammate Emails',
        helper: 'Optional — list one email per line. They should also apply individually.',
        required: false,
        condition: { questionId: 'has_team', value: 'Yes' },
        placeholder: 'teammate1@email.com\nteammate2@email.com',
    },
    {
        id: 'wants_team_match',
        section: 'E',
        type: 'radio',
        question: 'Want help finding a team?',
        helper: "We'll try to match you with people who have complementary skills.",
        required: true,
        condition: { questionId: 'has_team', value: 'No' },
        options: ['Yes', 'No'],
    },

    // ─── SECTION F: Logistics ─────────────────────────────────────────────────
    {
        id: 'dietary',
        section: 'F',
        type: 'select',
        question: 'Dietary Restrictions',
        required: true,
        options: ['None', 'Halal', 'Vegetarian', 'Vegan', 'Gluten-free', 'Kosher', 'Nut allergy', 'Other — I\'ll specify below'],
    },
    {
        id: 'accessibility',
        section: 'F',
        type: 'radio',
        question: 'Accessibility accommodations needed?',
        helper: 'We want everyone to participate comfortably.',
        required: true,
        options: ['Yes', 'No'],
    },
    {
        id: 'accessibility_details',
        section: 'F',
        type: 'textarea',
        question: 'Accessibility details',
        helper: "We'll do our best to accommodate you. This stays private.",
        required: true,
        condition: { questionId: 'accessibility', value: 'Yes' },
        placeholder: 'e.g. Wheelchair access, sign language interpreter, quiet space…',
    },
    {
        id: 'travel_support',
        section: 'F',
        type: 'radio',
        question: 'Travel support needed?',
        helper: 'Limited travel reimbursements may be available for out-of-city participants.',
        required: true,
        options: ['Yes', 'No'],
    },
    {
        id: 'emergency_contact_name',
        section: 'F',
        type: 'text',
        question: 'Emergency contact name',
        required: false,
        placeholder: 'Full name',
    },
    {
        id: 'emergency_contact_phone',
        section: 'F',
        type: 'tel',
        question: 'Emergency contact phone',
        required: false,
        placeholder: '+1 (416) 555-0123',
    },

    // ─── SECTION G: Consent ──────────────────────────────────────────────────
    {
        id: 'code_of_conduct',
        section: 'G',
        type: 'checkbox_single',
        question: 'Code of Conduct agreement',
        helper: 'Read the full Code of Conduct at cihacks.ca/code-of-conduct. This is required to participate.',
        required: true,
        options: ['I have read and agree to the Code of Conduct'],
    },
    {
        id: 'photo_consent',
        section: 'G',
        type: 'radio',
        question: 'Photo/video consent',
        helper: 'HackCI may take photos and videos during the event for promotional use.',
        required: true,
        options: ['Yes', 'No'],
    },
    {
        id: 'data_consent',
        section: 'G',
        type: 'checkbox_single',
        question: 'Data privacy consent',
        helper: 'We store your application data securely to operate the event. View our Privacy Policy.',
        required: true,
        options: ['I consent to HackCI storing my application data for event operations'],
    },
    {
        id: 'email_consent',
        section: 'G',
        type: 'checkbox_single',
        question: 'Email communications consent',
        helper: "We'll send you event updates, decisions, and important information.",
        required: true,
        options: ['I permit HackCI to contact me by email with event updates'],
    },
    {
        id: 'anything_else',
        section: 'G',
        type: 'textarea',
        question: 'Anything else you\'d like us to know?',
        helper: 'Optional — your chance to stand out or share anything relevant.',
        required: false,
        placeholder: 'Feel free to share anything that didn\'t fit elsewhere…',
    },
];

/**
 * Returns questions filtered by active conditions based on current answers.
 */
export function getActiveQuestions(answers = {}) {
    return questions.filter(q => {
        if (!q.condition) return true;
        return answers[q.condition.questionId] === q.condition.value;
    });
}

/**
 * Returns the section label for a given section id.
 */
export function getSectionTitle(sectionId) {
    return SECTIONS.find(s => s.id === sectionId)?.title || sectionId;
}

/**
 * Groups active questions by section.
 */
export function getQuestionsBySection(answers = {}) {
    const active = getActiveQuestions(answers);
    return SECTIONS.map(section => ({
        ...section,
        questions: active.filter(q => q.section === section.id),
    })).filter(s => s.questions.length > 0);
}
