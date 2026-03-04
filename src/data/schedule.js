export const scheduleData = {
    'Day 1 — Friday': [
        { time: '5:00 PM – 6:00 PM', title: 'Registration & Team Formation', location: 'Campus', category: 'hacking' },
        { time: '6:00 PM – 6:30 PM', title: 'Opening Ceremony', location: 'Main Stage', category: 'ceremony' },
        { time: '6:30 PM – 8:00 PM', title: 'TMC Session & Dinner', location: 'Campus', category: 'meals' },
        { time: '9:00 PM – Midnight', title: 'Networking Event (Sponsors & Students)', location: 'Campus', category: 'hacking' },
        { time: 'Late night', title: 'Late-night snacks', location: 'Campus', category: 'meals' },
    ],
    'Day 2 — Saturday': [
        { time: '8:00 AM – 9:00 AM', title: 'Breakfast', location: 'Campus', category: 'meals' },
        { time: '9:00 AM – 9:30 AM', title: 'Optional Physical Activity', location: 'Campus', category: 'ceremony' },
        { time: '9:30 AM – 12:30 PM', title: 'Hacking Session #1', location: 'Campus', category: 'hacking' },
        { time: '12:30 PM – 1:30 PM', title: 'Lunch', location: 'Campus', category: 'meals' },
        { time: '1:30 PM – 3:00 PM', title: 'Workshops / Mentor Hours', location: 'Campus', category: 'workshop' },
        { time: '3:00 PM – 6:00 PM', title: 'Hacking Session #2', location: 'Campus', category: 'hacking' },
        { time: '6:00 PM – 7:30 PM', title: 'Dinner', location: 'Campus', category: 'meals' },
        { time: '7:30 PM – 11:30 PM', title: 'Hacking Session #3', location: 'Campus', category: 'hacking' },
        { time: '11:30 PM', title: 'Late-night snacks', location: 'Campus', category: 'meals' },
    ],
    'Day 3 — Sunday': [
        { time: '9:00 AM – 10:00 AM', title: 'Breakfast', location: 'Campus', category: 'meals' },
        { time: '10:00 AM', title: 'Project Deadline', location: 'Campus', category: 'hacking' },
        { time: '11:00 AM – 1:00 PM', title: 'Live Presentations & Judging', location: 'Main Stage', category: 'ceremony' },
        { time: '1:00 PM – 3:00 PM', title: 'Lunch & Networking Event', location: 'Campus', category: 'meals' },
        { time: '3:00 PM', title: 'Closing Ceremony', location: 'Main Stage', category: 'ceremony' },
    ],
};

export const categoryColors = {
    ceremony: { label: 'Ceremony', class: 'badge--accent' },
    meals: { label: 'Meals', class: 'badge--success' },
    workshop: { label: 'Workshop', class: 'badge--warning' },
    hacking: { label: 'Hacking', class: 'badge--error' },
};
