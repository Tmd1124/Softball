export interface HelpTopic {
  title: string
  tips: string[]
}

export const HELP: Record<string, HelpTopic> = {
  home: {
    title: 'Coach’s snapshot',
    tips: [
      'The top card shows Ever’s school, teams, positions, height and academics at a glance.',
      'Use Softball, Basketball or Schedule below it to jump to full metrics, film and events.',
      'Tap Softball or Basketball Recruiting Profile (PDF) for that sport’s own one-page sheet, then choose “Save as PDF” in the print window.',
      'Ask a question in the Ask tab here and print the answer for your staff.',
    ],
  },
  sport: {
    title: 'Recruiting page',
    tips: [
      'The four boxes under the bio are Ever’s measurables. Each one shows the month and year it was verified.',
      'Film plays right on the page. Tap a video to watch it, or use full screen.',
      'The Player Profile summarizes Ever’s strengths. The schedule lists where to see Ever play.',
      'Tap a phone number to call or an email to write to a coach. “Download 1-Page PDF” opens a printable sheet.',
    ],
  },
  teams: {
    title: 'Teams & coaches',
    tips: [
      'Every team Ever has played for, newest year first. The newest year in each sport is highlighted as Current.',
      'Tap a phone number to call, an email to write, or Social to open the team’s page.',
      'Tap Team PDF on any team to print or save a one-page sheet with that team’s stats.',
    ],
  },
  schedule: {
    title: 'Schedule',
    tips: [
      'Softball and basketball events are listed separately, earliest first as entered by Ever’s family.',
      'On a phone each event is a card. On a larger screen it is a table.',
      'Linked text in the last column opens a pool, court or live stream page.',
    ],
  },
  workouts: {
    title: 'Workouts',
    tips: [
      'Pick Off-Season or In-Season, then a day. Tap a set circle when you finish a set and enter your weight.',
      'Use “Watch Form Video & Log Sets” for the demo and the three-phase breakdown.',
      'The rest timer starts after each set. The Mobility tab has a guided timer. History shows past sessions.',
      'Changes save automatically. If you are offline they are saved on this device and sent later.',
    ],
  },
  reset: {
    title: 'Password reset',
    tips: [
      'Open this page from the link in your reset email. The link works once and expires after 30 minutes.',
      'Without a link, enter your email and we will send one.',
      'Choose a password with at least 8 characters.',
    ],
  },
  'admin-login': {
    title: 'Admin sign-in',
    tips: ['Sign in with your admin account to edit the public pages and manage users.', 'Accounts without the Admin badge cannot open this area.'],
  },
  'admin-overview': {
    title: 'Recruiting profiles overview',
    tips: [
      'Each card shows how much of that profile is filled in. Anything still showing a placeholder is listed, and each item links straight to its step.',
      'Press Continue to work through an area step by step, or open a step from the list.',
      'Printable profile opens the one-page sheet for that sport, ready to print or save as PDF.',
    ],
  },
  'admin-site': {
    title: 'Athlete & contacts',
    tips: [
      'Work left to right through Athlete, Academics and Contacts. The numbers on each step show how many fields still need real values; a check means it is done.',
      'Name, school, jersey, GPA and contacts feed every public page, the footer and both printed profiles.',
      'Phone numbers format themselves as (999) 999-9999. Emails must look like name@example.com.',
      'Weight, class rank, SAT, ACT and NCAA ID are optional and appear only once filled in.',
      'The live preview shows the printed profile with your unsaved edits. Press Save changes to publish; Reset area discards what was saved.',
    ],
  },
  'admin-softball': {
    title: 'Softball profile',
    tips: [
      'Step through Bio & metrics, Teams & coaches, Film, Summary & honors, Schedule and Links & QR. Next and Back buttons are at the bottom of each step.',
      'Upload a photo of Ever under Bio. It appears on the sport page and in the printed profile header. Choose positions from the checklist and bats/throws from the list. Edit each metric’s value, unit and verified month and year.',
      'For film, paste the embed address (https://…) from YouTube, Vimeo or Hudl.',
      'Summary & honors holds optional awards. Season stats are entered per team under Teams & coaches; the newest team’s stats show on the page and profile.',
      'The live preview updates as you type. Save changes publishes to the public page and printable profile.',
    ],
  },
  'admin-basketball': {
    title: 'Basketball profile',
    tips: [
      'Step through Bio & metrics, Teams & coaches, Film, Summary & honors, Schedule and Links & QR.',
      'Pick a primary and optional secondary position, then update the four metric boxes and their verified dates.',
      'Add awards under Summary & honors, and per-team stats under Teams & coaches. They show only after you add rows.',
      'The live preview shows the printed profile with your unsaved edits. Save changes publishes it.',
    ],
  },
  'admin-users': {
    title: 'Users',
    tips: [
      'The list shows every account with its role badge. Admin accounts can edit this site and manage users; Sports accounts can only log workouts.',
      'Select a user to change their name, phone, email or role, reset their password, deactivate them, or remove them.',
      'Use Add user to create an account. They choose their own password at first sign-in.',
      'Deactivate blocks sign-in and keeps history. Remove deletes the user and their workouts for good.',
      'You cannot demote, deactivate or remove yourself, or the last active admin.',
    ],
  },
}
