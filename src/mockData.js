export const TOURNAMENTS = [
    { id: 1, name: 'The Bloodweiser Cup', status: 'In Progress', format: 'Round Robin', created: '2025. 12. 15.' },
    { id: 2, name: 'Chaos League Season XII', status: 'Recruiting', format: 'Swiss', created: '2026. 01. 01.' },
    { id: 3, name: 'Old World Open', status: 'Completed', format: 'Round Robin', created: '2025. 10. 01.' },
];

export const TEAMS = [
    // Bloodweiser Cup Teams
    { id: 'tg', tournamentId: 1, name: 'THE GOUGED EYE', race: 'Orc', coach: 'Varag Ghoulchewer', treasury: '150,000 gold', color: '#1b4332', icon: 'TG' },
    { id: 'rr', tournamentId: 1, name: 'REIKLAND REAVERS', race: 'Human', coach: 'Griff Oberwald', treasury: '120,000 gold', color: '#1e3a8a', icon: 'RR' },

    // Chaos League Teams
    { id: 'cas', tournamentId: 2, name: 'CHAOS ALL-STARS', race: 'Chaos Chosen', coach: 'Lewdgrip Whiparm', treasury: '75,000 gold', color: '#991b1b', icon: 'CA' },
    { id: 'dc', tournamentId: 2, name: 'DARKSIDE COWBOYS', race: 'Dark Elf', coach: 'Jeremiah Kool', treasury: '180,000 gold', color: '#581c87', icon: 'DC' },

    // Old World Open Teams
    { id: 'cod', tournamentId: 3, name: 'CHAMPIONS OF DEATH', race: 'Undead', coach: 'Count Luthor von Drakenborg', treasury: '90,000 gold', color: '#334155', icon: 'CO' },
    { id: 'gb', tournamentId: 3, name: 'GRUDGEBEARERS', race: 'Dwarf', coach: 'Grim Ironjaw', treasury: '200,000 gold', color: '#92400e', icon: 'G' },
];

export const PLAYERS = {
    tg: [
        { id: 1, name: 'Gorbag', position: 'Black Orc', ma: 4, st: 4, ag: '4+', pa: '5+', av: '10+', skills: ['Block', 'Grab'], spp: 12, cost: '80,000 gold' },
        { id: 2, name: 'Morglum', position: 'Black Orc', ma: 4, st: 4, ag: '4+', pa: '5+', av: '10+', skills: ['Block'], spp: 6, cost: '80,000 gold' },
        { id: 3, name: 'Varag Ghoulchewer', position: 'Blitzer', ma: 6, st: 4, ag: '3+', pa: '4+', av: '10+', skills: ['Block', 'Mighty Blow'], spp: 42, cost: '140,000 gold' },
        { id: 5, name: 'Grukk', position: 'Blitzer', ma: 6, st: 3, ag: '3+', pa: '4+', av: '10+', skills: ['Block'], spp: 18, cost: '90,000 gold' },
        { id: 6, name: 'Ugrot', position: 'Lineman', ma: 5, st: 3, ag: '4+', pa: '5+', av: '10+', skills: [], spp: 2, cost: '50,000 gold' },
        { id: 7, name: 'Zog', position: 'Lineman', ma: 5, st: 3, ag: '4+', pa: '5+', av: '10+', skills: [], spp: 0, cost: '50,000 gold' },
    ],
    rr: [
        { id: 10, name: 'Griff Oberwald', position: 'Blitzer', ma: 8, st: 4, ag: '2+', pa: '3+', av: '9+', skills: ['Block', 'Dodge', 'Fend'], spp: 56, cost: '280,000 gold' },
        { id: 11, name: 'Jacob von Altdorf', position: 'Blitzer', ma: 7, st: 3, ag: '3+', pa: '4+', av: '9+', skills: ['Block'], spp: 8, cost: '85,000 gold' },
    ],
    cas: [
        { id: 20, name: 'Krell', position: 'Chaos Warrior', ma: 5, st: 4, ag: '3+', pa: '5+', av: '10+', skills: ['Block', 'Mighty Blow'], spp: 24, cost: '100,000 gold' },
    ]
};

export const MATCHES = [
    // Tournament 1: Bloodweiser Cup (1 Played, 2 Upcoming)
    { id: 101, tournamentId: 1, teamA: 'tg', teamB: 'rr', scoreA: 2, scoreB: 1, date: 'Played: Jan 15', time: 'Final', status: 'played', round: 1 },
    { id: 102, tournamentId: 1, teamA: 'rr', teamB: 'tg', date: 'Sunday, Feb 1', time: '09:00 PM', status: 'upcoming', round: 2 },

    // Tournament 2: Chaos League (1 Played)
    { id: 201, tournamentId: 2, teamA: 'cas', teamB: 'dc', scoreA: 3, scoreB: 0, date: 'Played: Jan 20', time: 'Final', status: 'played', round: 1 },

    // Tournament 3: Old World Open (2 Played)
    { id: 301, tournamentId: 3, teamA: 'cod', teamB: 'gb', scoreA: 2, scoreB: 2, date: 'Played: Jan 25', time: 'Final', status: 'played', round: 1 },
    { id: 302, tournamentId: 3, teamA: 'gb', teamB: 'cod', scoreA: 1, scoreB: 3, date: 'Played: Jan 28', time: 'Final', status: 'played', round: 2 },
];
