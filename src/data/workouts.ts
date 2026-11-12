import library from './exercises.json'

export type Program = 'off' | 'in'
export type Category = 'strength' | 'mobility'

export interface ExerciseInfo {
  id: string
  name: string
  category: Category
  focus: string
  tempo: string
  cues: [string, string, string]
}

export interface WorkoutItem {
  id: string
  sets: number
  reps: string
  rest: 60 | 90
}

export interface WorkoutDay {
  id: string
  program: Program
  pill: string
  title: string
  items: WorkoutItem[]
}

export interface MobilityStep {
  id: string
  reps: string
  seconds: number
  sides: 1 | 2
  postGame?: boolean
}

const lib = library as unknown as Record<string, Omit<ExerciseInfo, 'id'>>

export function getExercise(id: string): ExerciseInfo {
  const e = lib[id]
  if (!e) throw new Error(`Unknown exercise id: ${id}`)
  return { id, ...e }
}

export interface TempoSegment {
  label: string
  seconds: number | null
}

export function parseTempo(tempo: string): TempoSegment[] {
  return tempo.split('|').map((s) => {
    const m = s.trim().match(/^(\d+)\s+(.+)$/)
    return m ? { seconds: Number(m[1]), label: m[2] } : { seconds: null, label: s.trim() }
  })
}

export function formatTempo(tempo: string): string {
  return parseTempo(tempo)
    .map((s) => (s.seconds === null ? s.label : `${s.seconds}s ${s.label}`))
    .join(' → ')
}

export const PROGRAM_LABEL: Record<Program, string> = {
  off: 'Off-Season',
  in: 'In-Season',
}

export const PROGRAM_SUBTITLE: Record<Program, string> = {
  off: '4-Day Split',
  in: '2-Day Maintenance',
}

export const days: WorkoutDay[] = [
  {
    id: 'off-1',
    program: 'off',
    pill: 'Day 1: Lower Strength',
    title: 'Lower Body Strength & Isometric Endurance',
    items: [
      { id: 'trap-bar-deadlift', sets: 4, reps: '5', rest: 90 },
      { id: 'tempo-goblet-squat', sets: 3, reps: '6', rest: 90 },
      { id: 'copenhagen-plank', sets: 3, reps: '20-30s/side', rest: 60 },
      { id: 'bulgarian-split-squat', sets: 3, reps: '8/leg', rest: 90 },
      { id: 'seated-calf-raise', sets: 3, reps: '15', rest: 60 },
    ],
  },
  {
    id: 'off-2',
    program: 'off',
    pill: 'Day 2: Upper & Arm Care',
    title: 'Upper Body Push/Pull & Arm Care',
    items: [
      { id: 'landmine-press', sets: 4, reps: '6/arm', rest: 90 },
      { id: 'chest-supported-db-row', sets: 4, reps: '8-10', rest: 90 },
      { id: 'half-kneeling-cable-pulldown', sets: 3, reps: '10/arm', rest: 60 },
      { id: 'face-pull-er', sets: 3, reps: '15', rest: 60 },
      { id: 'pallof-press', sets: 3, reps: '12/side', rest: 60 },
    ],
  },
  {
    id: 'off-3',
    program: 'off',
    pill: 'Day 3: Explosive Pop',
    title: 'Lower Body Explosiveness & Agility',
    items: [
      { id: 'box-jump-catcher-crouch', sets: 4, reps: '4', rest: 90 },
      { id: 'lateral-skater-bound', sets: 3, reps: '6/side', rest: 60 },
      { id: 'romanian-deadlift', sets: 3, reps: '8', rest: 90 },
      { id: 'heavy-sled-push', sets: 4, reps: '20 yds', rest: 90 },
      { id: 'banded-dead-bug', sets: 3, reps: '10/side', rest: 60 },
    ],
  },
  {
    id: 'off-4',
    program: 'off',
    pill: 'Day 4: Rotational Power',
    title: 'Rotational Power & Upper Endurance',
    items: [
      { id: 'med-ball-scoop-toss', sets: 4, reps: '5/side', rest: 60 },
      { id: 'push-up-plus', sets: 3, reps: '12', rest: 60 },
      { id: 'chin-up', sets: 3, reps: 'AMRAP', rest: 90 },
      { id: 'bottoms-up-kb-carry', sets: 3, reps: '30 yds/arm', rest: 60 },
      { id: 'band-ytw', sets: 2, reps: '10 each', rest: 60 },
    ],
  },
  {
    id: 'in-a',
    program: 'in',
    pill: 'Workout A: Early Week',
    title: 'Early Week: Power & Strength Maintenance',
    items: [
      { id: 'trap-bar-jump-shrug', sets: 3, reps: '4', rest: 90 },
      { id: 'goblet-squat-pause', sets: 3, reps: '5', rest: 60 },
      { id: 'half-kneeling-landmine-press', sets: 3, reps: '6/arm', rest: 60 },
      { id: 'inverted-row', sets: 3, reps: '10', rest: 60 },
      { id: 'side-plank-hip-abduction', sets: 2, reps: '20s/side', rest: 60 },
    ],
  },
  {
    id: 'in-b',
    program: 'in',
    pill: 'Workout B: Mid-Week',
    title: 'Mid-Week Recovery & Rotation',
    items: [
      { id: 'med-ball-side-slam', sets: 3, reps: '5/side', rest: 60 },
      { id: 'single-leg-rdl', sets: 3, reps: '6/leg', rest: 60 },
      { id: 'band-pull-apart-er', sets: 3, reps: '15 each', rest: 60 },
      { id: 'hip-switch-couch-stretch', sets: 2, reps: '45s/side', rest: 60 },
    ],
  },
]

export const mobilityRoutine: MobilityStep[] = [
  { id: 'mob-90-90-hip-transition', reps: '10 reps', seconds: 45, sides: 2 },
  { id: 'mob-ankle-rock', reps: '10/side', seconds: 45, sides: 2 },
  { id: 'mob-adductor-rock-back', reps: '10/side', seconds: 45, sides: 2 },
  { id: 'mob-open-book', reps: '8/side', seconds: 45, sides: 2 },
  { id: 'mob-sleeper-stretch', reps: '30s/side', seconds: 30, sides: 2, postGame: true },
]

export const phaseTitles: Record<Category, [string, string, string]> = {
  strength: ['Stance / Setup', 'Eccentric / Pause', 'Explosive Finish'],
  mobility: ['Start', 'Hold / Reach', 'Return'],
}
