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
      'Tap “Download 1-Page Recruiting Profile (PDF)”, then choose “Save as PDF” in the print window.',
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
  'admin-site': {
    title: 'Site & contacts',
    tips: [
      'Edit Ever’s name, school, jersey, GPA, courses, contacts and social links. Every public page and the footer use these.',
      'Phone numbers format themselves as (999) 999-9999. Emails must look like name@example.com.',
      'Press Save changes to publish. “Reset to placeholders” discards what you saved in this tab.',
    ],
  },
  'admin-softball': {
    title: 'Softball editor',
    tips: [
      'Choose positions from the checklist and bats/throws from the list.',
      'Metrics: edit the value, unit and the month and year it was verified. Keep the Pop Time box if the summary uses {popTime}.',
      'For video, paste the embed address (https://…) from YouTube, Vimeo or Hudl.',
      'Use Add and Delete on events, coaches, clips and links. Save changes publishes everything on this tab.',
    ],
  },
  'admin-basketball': {
    title: 'Basketball editor',
    tips: [
      'Pick a primary position and an optional secondary position.',
      'Update the four metric boxes and their verified month and year.',
      'Add game film with embed addresses, then add events, coaches and links. Save changes publishes the tab.',
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
