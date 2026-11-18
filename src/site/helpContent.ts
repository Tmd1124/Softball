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
      'Dates are MM/DD/YYYY with the start time underneath. Tap Map under a location to open it in Google Maps.',
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
  'admin-sport': {
    title: 'Sport profile',
    tips: [
      'Step through Bio & metrics, Teams & coaches, Film, Summary & honors, Schedule and Links & QR. Next and Back buttons are at the bottom of each step.',
      'Each card opens minimized. Tap a table row or a card’s header to open it, then use Edit to change it. Save changes publishes it.',
      'Upload a photo of Ever under Bio and choose her positions or events. Under Verified metrics, type each measurable’s value and verified month in the quick-entry rows. Use Edit all to fill every row at once, or a row’s own Edit, Save and Remove. Saving there publishes right away.',
      'For film, paste a YouTube link (recommended), or upload a short clip. Tap the ? beside a prompt for the reasons.',
      'The live preview shows the printed profile with your unsaved edits. A hidden sport can be previewed here but stays off the public site until you turn on Show on the website in Admin → Sports.',
    ],
  },
  'admin-sports': {
    title: 'Sports',
    tips: [
      'To add a sport: press Add a sport, pick it from the list of common college sports (or choose Other), tick the positions or events to offer, and press Add sport. The name, color and the lists of positions and measurables fill in for you, but nothing is ticked until you tick it. It starts hidden.',
      'Use the sport’s new button at the top of the screen to fill in its photo, measurables, teams, film and schedule.',
      'When it is ready, press Show on the website. It then appears in the menu, home page, PDF list and search.',
      'To take a sport off the website, press Hide from the website. Nothing is deleted and you can show it again any time.',
      'Each sport’s button in the top menu can show its name, an emoji or a small round picture. Change it with the Menu button switch on its row (Text, Emoji or Image), or choose the picture under Edit settings. To remove a sport for good, press Delete… on its row. You are asked to confirm, and everything about that sport is erased from the website and database. This cannot be undone.',
      'Use the ↑ and ↓ buttons to change the order sports appear in the menu.',
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
