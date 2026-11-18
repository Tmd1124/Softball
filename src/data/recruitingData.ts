// Built-in defaults. The live values are stored in the database and edited at /admin/;
// these show until a section is saved there, or if the API is unreachable.

export interface Metric {
  key: string
  label: string
  value: string
  unit?: string
  verified: string
}

export interface VideoItem {
  title: string
  blurb: string
  length: string
  embedUrl: string
  videoUrl?: string
}

export interface ScheduleEvent {
  date: string
  event: string
  location: string
  team: string
  info: string
  infoUrl?: string
}

export const TEAM_TYPES = ['High School', 'Travel / AAU'] as const

export interface TeamItem {
  year: string
  name: string
  type: string
  coach: string
  owner: string
  phone: string
  email: string
  social?: string
  stats: StatItem[]
}

export interface TrainerItem {
  name: string
  phone: string
  email: string
}

export interface LinkItem {
  label: string
  url: string
}

export interface StatItem {
  label: string
  value: string
  note: string
}

export interface AwardItem {
  title: string
  year: string
}

export interface SportData {
  label: string
  photo: string
  photoFocus: number
  positions: string
  handedness?: string
  teams: TeamItem[]
  trainers: TrainerItem[]
  metrics: Metric[]
  featured: VideoItem
  clipsTitle: string
  clips: VideoItem[]
  summary: string
  scheduleTitle: string
  scheduleColumns: { event: string; info: string }
  schedule: ScheduleEvent[]
  links: LinkItem[]
  awards: AwardItem[]
}

export const defaults = {
  siteUrl: 'https://everharris.com',

  athlete: {
    name: 'Ever Harris',
    classYear: 2031,
    school: 'Creekview High School',
    location: 'Canton, GA',
    height: '5’6”',
    jersey: '[XX]',
    weight: '',
  },

  academics: {
    gpa: '[X.XX]',
    courses: '[Honors/Advanced Courses]',
    classRank: '',
    sat: '',
    act: '',
    ncaaId: '',
  },

  contact: {
    email: 'recruiting@everharris.com',
    phone: '(000) 000-0000',
    parent: { name: '[Parent/Guardian Name]', email: 'parent@everharris.com', phone: '(000) 000-0000' },
    social: {
      x: { handle: '@[handle]', url: 'https://x.com/' },
      instagram: { handle: '@[handle]', url: 'https://www.instagram.com/' },
    },
  },

  softball: {
    label: 'Softball',
    photo: '/img/hero-softball.svg',
    photoFocus: 20,
    positions: 'Catcher / First Base',
    handedness: 'Bats: R / Throws: R',
    teams: [
      { year: '2026', name: '[Travel Team Name & Age Division]', type: 'Travel / AAU', coach: '[Coach Name]', owner: '[Owner Name]', phone: '(000) 000-0000', email: 'coach@example.com', stats: [] },
    ],
    trainers: [{ name: '[Personal Trainer Name]', phone: '(000) 000-0000', email: 'trainer@example.com' }],
    metrics: [
      { key: 'popTime', label: 'Pop Time', value: '[X.XX]', unit: 'sec', verified: 'Month/Year' },
      { key: 'overhandVelo', label: 'Overhand Velo', value: '[XX]', unit: 'mph', verified: 'Month/Year' },
      { key: 'exitVelo', label: 'Exit Velocity', value: '[XX]', unit: 'mph', verified: 'Month/Year' },
      { key: 'homeToFirst', label: 'Home-to-1st', value: '[X.XX]', unit: 'sec', verified: 'Month/Year' },
    ],
    featured: {
      title: '2026–2027 Fall/Spring Game & Skills Highlight Reel',
      blurb: 'Game and skills highlights',
      length: '2:00–2:30',
      embedUrl: '',
    },
    clipsTitle: 'Raw Skill & Training Clips',
    clips: [
      {
        title: 'Defensive Mechanics',
        blurb: 'Catching Pop Times, Blocking & Transfers',
        length: '30–45 sec raw video',
        embedUrl: '',
      },
      {
        title: 'Offensive Cage Work',
        blurb: 'Tee/Front-Toss Exit Velo & Oppo Power',
        length: '30–45 sec raw video',
        embedUrl: '',
      },
      {
        title: 'In-Game At-Bats',
        blurb: 'Full At-Bats vs. Top Velocity Pitching',
        length: '60 sec unedited game footage',
        embedUrl: '',
      },
    ],
    summary:
      'High-motor, vocal backstop and corner infielder known for defensive durability, quick transfer mechanics, and disciplined gap-to-gap power. Controls the running game behind the plate with a {popTime} pop time and brings relentless daily preparation—logging structured strength, mobility, and cage work year-round. Comfortable hitting in the middle of the order and competing against top national travel competition.',
    scheduleTitle: 'Upcoming Tournament & Showcase Schedule',
    scheduleColumns: { event: 'Event / Showcase', info: 'Pool / Field Info' },
    schedule: [
      { date: '[Mon DD, YYYY]', event: '[Showcase Name]', location: '[City, ST]', team: '[Travel Team]', info: '[Pool / Field]' },
      { date: '[Mon DD, YYYY]', event: '[Tournament Name]', location: '[City, ST]', team: '[Travel Team]', info: '[Pool / Field]' },
      { date: '[Mon DD, YYYY]', event: '[College Camp / Showcase]', location: '[City, ST]', team: '[Travel Team]', info: '[Pool / Field]' },
    ],
    links: [
      { label: 'FieldLevel', url: 'https://fieldlevel.com' },
      { label: 'SportsRecruits', url: 'https://sportsrecruits.com' },
      { label: 'X / Twitter', url: 'https://x.com/' },
    ],
    awards: [],
  } satisfies SportData,

  basketball: {
    label: 'Basketball',
    photo: '/img/hero-basketball.svg',
    photoFocus: 20,
    positions: '[Primary Position / Secondary Position, e.g., Point Guard / Shooting Guard]',
    teams: [
      { year: '2026', name: '[AAU/Club Team Name & Circuit]', type: 'Travel / AAU', coach: '[Coach Name]', owner: '[Owner Name]', phone: '(000) 000-0000', email: 'coach@example.com', stats: [] },
    ],
    trainers: [{ name: '[Personal Trainer Name]', phone: '(000) 000-0000', email: 'trainer@example.com' }],
    metrics: [
      { key: 'wingspan', label: 'Wingspan', value: '[X\'XX"]', verified: 'Month/Year' },
      { key: 'standingReach', label: 'Standing Reach', value: '[X\'XX"]', verified: 'Month/Year' },
      { key: 'approachVertical', label: 'Approach Vertical', value: '[XX.X"]', verified: 'Month/Year' },
      { key: 'sprint', label: '3/4 Court Sprint', value: '[X.XX]', unit: 'sec', verified: 'Month/Year' },
    ],
    featured: {
      title: '2026–2027 Season & AAU Circuit Highlight Reel',
      blurb: 'Season and AAU circuit highlights',
      length: '2:00–2:30',
      embedUrl: '',
    },
    clipsTitle: 'Skill & Game Breakdown',
    clips: [
      {
        title: 'Perimeter Shooting',
        blurb: 'Game & Game-Speed Spot-Up / Off-Dribble 3PT Clips',
        length: '45 sec',
        embedUrl: '',
      },
      {
        title: 'On-Ball Defense & Rebounding',
        blurb: 'Lateral Quickness, Closeouts & Boxing Out',
        length: '45 sec',
        embedUrl: '',
      },
      {
        title: 'Full Possession Cutups',
        blurb: 'Half-Court Execution & Ball Handling Under Pressure',
        length: '60 sec',
        embedUrl: '',
      },
    ],
    summary:
      'Tough, high-IQ two-way guard who impacts the game through relentless on-ball defense, court vision, and shot-making. Brings multi-sport physicality and lateral agility to the perimeter, consistently guarding opposing primary ball-handlers while pushing tempo in transition. Dedicated to daily skill development, ball-handling mastery, and strength conditioning.',
    scheduleTitle: 'Upcoming AAU & High School Schedule',
    scheduleColumns: { event: 'Event / Exposure Tournament', info: 'Court / Live Stream Link' },
    schedule: [
      { date: '[Mon DD, YYYY]', event: '[Exposure Tournament]', location: '[City, ST]', team: '[AAU Team]', info: '[Court #]' },
      { date: '[Mon DD, YYYY]', event: '[Circuit Event]', location: '[City, ST]', team: '[AAU Team]', info: '[Live Stream Link]', infoUrl: '' },
      { date: '[Mon DD, YYYY]', event: '[High School Game vs. Opponent]', location: 'Creekview HS, Canton, GA', team: 'Creekview High School', info: '[Court / Stream]' },
    ],
    links: [
      { label: 'Hudl', url: 'https://www.hudl.com' },
      { label: 'NCSA', url: 'https://www.ncsasports.org' },
      { label: 'X / Twitter', url: 'https://x.com/' },
    ],
    awards: [],
  } satisfies SportData,
}

export type SportId = string

export interface SportConfig {
  id: string
  label: string
  accent: string
  positionStyle: 'multi' | 'pair'
  positionLabel: string
  handedness: boolean
  positions: string[]
  metrics: { key: string; label: string; unit: string }[]
  visible: boolean
  order: number
  navStyle: 'text' | 'emoji' | 'image'
  navImage: 'auto' | 'custom'
  emoji: string
  cardImage: string
}

export const builtInSports: SportConfig[] = [
  {
    id: 'softball',
    label: 'Softball',
    accent: '#cde62b',
    positionStyle: 'multi',
    positionLabel: 'Positions',
    handedness: true,
    positions: ['Pitcher', 'Catcher', 'First Base', 'Second Base', 'Third Base', 'Shortstop', 'Left Field', 'Center Field', 'Right Field', 'Designated Player', 'Utility'],
    metrics: [],
    visible: true,
    order: 1,
    navStyle: 'text',
    navImage: 'auto',
    emoji: '🥎',
    cardImage: '',
  },
  {
    id: 'basketball',
    label: 'Basketball',
    accent: '#f97316',
    positionStyle: 'pair',
    positionLabel: 'Positions',
    handedness: false,
    positions: ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center', 'Combo Guard', 'Wing', 'Forward'],
    metrics: [],
    visible: true,
    order: 2,
    navStyle: 'text',
    navImage: 'auto',
    emoji: '🏀',
    cardImage: '',
  },
]

export interface SiteData {
  siteUrl: string
  athlete: { name: string; classYear: number; school: string; location: string; height: string; jersey: string; weight: string }
  academics: { gpa: string; courses: string; classRank: string; sat: string; act: string; ncaaId: string }
  contact: {
    email: string
    phone: string
    parent: { name: string; email: string; phone: string }
    social: { x: { handle: string; url: string }; instagram: { handle: string; url: string } }
  }
}

export type RecruitingData = SiteData & { sportList: SportConfig[]; sports: Record<string, SportData> }

export const defaultSite: SiteData = {
  siteUrl: defaults.siteUrl,
  athlete: defaults.athlete,
  academics: defaults.academics,
  contact: defaults.contact,
}
export function defaultSport(cfg: SportConfig): SportData {
  const legacy = (defaults as Record<string, unknown>)[cfg.id] as SportData | undefined
  if (legacy) return legacy
  const n = cfg.label
  return {
    label: n,
    photo: '',
    photoFocus: 20,
    positions: `[Choose ${cfg.positionLabel.toLowerCase()}]`,
    teams: [{ year: '2026', name: `[${n} Team Name]`, type: 'Travel / AAU', coach: '[Coach Name]', owner: '[Owner Name]', phone: '(000) 000-0000', email: 'coach@example.com', stats: [] }],
    trainers: [{ name: '[Personal Trainer Name]', phone: '(000) 000-0000', email: 'trainer@example.com' }],
    metrics: cfg.metrics.map((m) => ({ key: m.key, label: m.label, value: '[X]', unit: m.unit, verified: 'Month/Year' })),
    featured: { title: `${n} Highlight Reel`, blurb: `${n} highlights`, length: '', embedUrl: '' },
    clipsTitle: 'Skill Clips',
    clips: [
      { title: 'Skill Clip 1', blurb: '[What this clip shows]', length: '', embedUrl: '' },
      { title: 'Skill Clip 2', blurb: '[What this clip shows]', length: '', embedUrl: '' },
    ],
    summary: `[Write two or three sentences about Ever as a ${n.toLowerCase()} athlete: strengths, work ethic and goals.]`,
    scheduleTitle: `Upcoming ${n} Schedule`,
    scheduleColumns: { event: 'Event', info: 'Details' },
    schedule: [{ date: '[Mon DD, YYYY]', event: '[Event Name]', location: '[City, ST]', team: '[Team]', info: '[Details]' }],
    links: [],
    awards: [],
  }
}
