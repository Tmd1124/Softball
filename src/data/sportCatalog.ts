// Common college sports that offer athletic scholarships. Picking one in Admin > Sports fills in the
// form; everything can still be changed before the sport is added. The first four measurables are
// ticked by default; the rest are offered as extras.

export interface CatalogSport {
  name: string
  accent: string
  label: string
  style: 'multi' | 'pair'
  handedness: boolean
  positions: string[]
  metrics: [label: string, unit: string][]
}

const G = '#22c55e'
const O = '#f97316'
const B = '#3b82f6'
const R = '#ef4444'
const P = '#a855f7'
const Y = '#eab308'
const T = '#14b8a6'
const K = '#ec4899'

const LIST: CatalogSport[] = [
  {
    name: 'Baseball',
    accent: R,
    label: 'Positions',
    style: 'multi',
    handedness: true,
    positions: ['Pitcher', 'Catcher', 'First Base', 'Second Base', 'Third Base', 'Shortstop', 'Left Field', 'Center Field', 'Right Field', 'Designated Hitter', 'Utility'],
    metrics: [['Fastball velocity', 'mph'], ['Exit velocity', 'mph'], ['60-yard dash', 'sec'], ['Pop time', 'sec'], ['Infield velocity', 'mph'], ['Home-to-1st', 'sec'], ['Vertical jump', 'in']],
  },
  {
    name: 'Basketball',
    accent: O,
    label: 'Positions',
    style: 'pair',
    handedness: false,
    positions: ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center', 'Combo Guard', 'Wing', 'Forward'],
    metrics: [['Wingspan', ''], ['Standing reach', ''], ['Approach vertical', 'in'], ['3/4 court sprint', 'sec'], ['Lane agility', 'sec'], ['Standing vertical', 'in']],
  },
  {
    name: 'Bowling',
    accent: P,
    label: 'Events',
    style: 'multi',
    handedness: true,
    positions: ['Singles', 'Doubles', 'Team'],
    metrics: [['Average score', ''], ['High game', ''], ['High series', ''], ['Strike percentage', '%'], ['Spare conversion', '%']],
  },
  {
    name: 'Cross Country',
    accent: G,
    label: 'Events',
    style: 'multi',
    handedness: false,
    positions: ['5K', '6K', '8K', '10K'],
    metrics: [['5K time', 'min'], ['Mile time', 'min'], ['3200m time', 'min'], ['1600m time', 'min'], ['800m time', 'min']],
  },
  {
    name: 'Fencing',
    accent: T,
    label: 'Weapons',
    style: 'multi',
    handedness: true,
    positions: ['Foil', 'Épée', 'Sabre'],
    metrics: [['Rating', ''], ['Tournament wins', ''], ['Bout win rate', '%'], ['National ranking', '']],
  },
  {
    name: 'Field Hockey',
    accent: G,
    label: 'Positions',
    style: 'multi',
    handedness: false,
    positions: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'],
    metrics: [['Sprint time', 'sec'], ['Mile time', 'min'], ['Goals', ''], ['Assists', ''], ['Shot speed', 'mph'], ['Vertical jump', 'in']],
  },
  {
    name: 'Football',
    accent: Y,
    label: 'Positions',
    style: 'multi',
    handedness: false,
    positions: ['Quarterback', 'Running Back', 'Fullback', 'Wide Receiver', 'Tight End', 'Offensive Line', 'Defensive Line', 'Linebacker', 'Cornerback', 'Safety', 'Kicker', 'Punter', 'Long Snapper'],
    metrics: [['40-yard dash', 'sec'], ['Vertical jump', 'in'], ['Bench press', 'lb'], ['Squat', 'lb'], ['Broad jump', 'in'], ['Pro agility', 'sec'], ['3-cone drill', 'sec']],
  },
  {
    name: 'Golf',
    accent: G,
    label: 'Roles',
    style: 'multi',
    handedness: true,
    positions: ['Individual golfer', 'Team golfer'],
    metrics: [['Scoring average', ''], ['Best round', ''], ['Handicap index', ''], ['Driving distance', 'yd'], ['Greens in regulation', '%']],
  },
  {
    name: 'Gymnastics',
    accent: K,
    label: 'Events',
    style: 'multi',
    handedness: false,
    positions: ['Vault', 'Uneven Bars', 'Balance Beam', 'Floor Exercise', 'All-Around'],
    metrics: [['All-around score', ''], ['Vault score', ''], ['Bars score', ''], ['Beam score', ''], ['Floor score', '']],
  },
  {
    name: 'Ice Hockey',
    accent: B,
    label: 'Positions',
    style: 'multi',
    handedness: true,
    positions: ['Center', 'Left Wing', 'Right Wing', 'Defenseman', 'Goalie'],
    metrics: [['Sprint time', 'sec'], ['Goals', ''], ['Assists', ''], ['Shot speed', 'mph'], ['Vertical jump', 'in']],
  },
  {
    name: 'Lacrosse',
    accent: P,
    label: 'Positions',
    style: 'multi',
    handedness: false,
    positions: ['Attack', 'Midfield', 'Defense', 'Goalie', 'Face-Off Specialist', 'Long-Stick Midfielder'],
    metrics: [['Goals', ''], ['Ground balls', ''], ['Sprint time', 'sec'], ['Shot speed', 'mph'], ['Mile time', 'min']],
  },
  {
    name: 'Rowing',
    accent: B,
    label: 'Seats',
    style: 'multi',
    handedness: false,
    positions: ['Coxswain', 'Port', 'Starboard', 'Sculler'],
    metrics: [['2K erg time', 'min'], ['6K erg time', 'min'], ['Watts', 'W'], ['Split time', 'sec'], ['Height', '']],
  },
  {
    name: 'Sand Volleyball',
    accent: Y,
    label: 'Positions',
    style: 'pair',
    handedness: false,
    positions: ['Blocker', 'Defender'],
    metrics: [['Approach jump', 'in'], ['Block touch', 'in'], ['Serve speed', 'mph'], ['Standing reach', '']],
  },
  {
    name: 'Soccer',
    accent: G,
    label: 'Positions',
    style: 'multi',
    handedness: false,
    positions: ['Goalkeeper', 'Center Back', 'Fullback', 'Defensive Midfielder', 'Central Midfielder', 'Attacking Midfielder', 'Winger', 'Forward'],
    metrics: [['40-yard dash', 'sec'], ['Mile time', 'min'], ['Vertical jump', 'in'], ['Goals', ''], ['Beep test level', ''], ['Shot speed', 'mph']],
  },
  {
    name: 'Softball',
    accent: Y,
    label: 'Positions',
    style: 'multi',
    handedness: true,
    positions: ['Pitcher', 'Catcher', 'First Base', 'Second Base', 'Third Base', 'Shortstop', 'Left Field', 'Center Field', 'Right Field', 'Designated Player', 'Utility'],
    metrics: [['Pop time', 'sec'], ['Overhand velocity', 'mph'], ['Exit velocity', 'mph'], ['Home-to-1st', 'sec'], ['60-yard dash', 'sec'], ['Pitch velocity', 'mph'], ['Vertical jump', 'in']],
  },
  {
    name: 'Swimming & Diving',
    accent: T,
    label: 'Events',
    style: 'multi',
    handedness: false,
    positions: ['Freestyle', 'Backstroke', 'Breaststroke', 'Butterfly', 'Individual Medley', '1-Meter Diving', '3-Meter Diving', 'Platform Diving'],
    metrics: [['50 free', 'sec'], ['100 free', 'sec'], ['200 free', 'sec'], ['100 fly', 'sec'], ['100 back', 'sec'], ['100 breast', 'sec'], ['200 IM', 'sec']],
  },
  {
    name: 'Tennis',
    accent: Y,
    label: 'Events',
    style: 'multi',
    handedness: true,
    positions: ['Singles', 'Doubles'],
    metrics: [['UTR rating', ''], ['Ranking', ''], ['Serve speed', 'mph'], ['Win-loss record', ''], ['Sprint time', 'sec']],
  },
  {
    name: 'Track & Field',
    accent: B,
    label: 'Events',
    style: 'multi',
    handedness: false,
    positions: ['100m', '200m', '400m', '800m', '1500m', '3000m', '5000m', '100m / 110m Hurdles', '300m / 400m Hurdles', '4x100m Relay', '4x400m Relay', 'Long Jump', 'Triple Jump', 'High Jump', 'Pole Vault', 'Shot Put', 'Discus', 'Javelin', 'Hammer Throw', 'Heptathlon'],
    metrics: [['100m time', 'sec'], ['400m time', 'sec'], ['Long jump', 'ft'], ['Vertical jump', 'in'], ['200m time', 'sec'], ['800m time', 'min'], ['High jump', 'ft']],
  },
  {
    name: 'Volleyball',
    accent: P,
    label: 'Positions',
    style: 'multi',
    handedness: false,
    positions: ['Outside Hitter', 'Opposite Hitter', 'Middle Blocker', 'Setter', 'Libero', 'Defensive Specialist'],
    metrics: [['Approach jump', 'in'], ['Block touch', 'in'], ['Standing reach', ''], ['Serve speed', 'mph'], ['Spike speed', 'mph'], ['10-yard dash', 'sec']],
  },
  {
    name: 'Water Polo',
    accent: B,
    label: 'Positions',
    style: 'multi',
    handedness: true,
    positions: ['Goalkeeper', 'Center', 'Driver', 'Wing', 'Point'],
    metrics: [['200m swim', 'min'], ['Goals', ''], ['Steals', ''], ['50m swim', 'sec'], ['Shot speed', 'mph']],
  },
  {
    name: 'Wrestling',
    accent: R,
    label: 'Weight classes',
    style: 'multi',
    handedness: false,
    positions: ['101 lb', '109 lb', '116 lb', '123 lb', '125 lb', '130 lb', '133 lb', '136 lb', '141 lb', '143 lb', '149 lb', '155 lb', '157 lb', '165 lb', '170 lb', '174 lb', '184 lb', '191 lb', '197 lb', '285 lb'],
    metrics: [['Record', ''], ['State finish', ''], ['Takedowns', ''], ['Pins', ''], ['Bench press', 'lb']],
  },
]

export const CATALOG: CatalogSport[] = [...LIST].sort((a, b) => a.name.localeCompare(b.name))

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30)
    .replace(/-+$/, '')

export function measurableSuggestions(id: string, own: { label: string; unit: string }[]): { label: string; unit: string }[] {
  const known = CATALOG.find((c) => slugify(c.name) === id)?.metrics.map(([label, unit]) => ({ label, unit })) ?? []
  const seen = new Set<string>()
  return [...own, ...known].filter((m) => {
    const k = m.label.toLowerCase()
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}
