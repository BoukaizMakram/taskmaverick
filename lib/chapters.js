// ---------------------------------------------------------------------------
// Single source of truth for the landing page.
//
// 1. Drop your video file into /public/videos and set VIDEO_SRC below
//    (e.g. '/videos/overview.mp4'). Leave it '' to show the placeholder.
// 2. Edit the chapters list: title, minutes, and start (seconds into the
//    video) so the list can later seek the player.
// ---------------------------------------------------------------------------

export const VIDEO_SRC = '';

export const VIDEO_POSTER = '';

export const CHAPTERS = [
  {
    id: 1,
    title: 'Automating Management',
    minutes: 5,
    start: 0,
    // Static cover image for this chapter's media frame (takes precedence over
    // the animation scene / video below). The play button on the cover plays
    // `src`; if `src` is empty the button is hidden.
    cover: '/Images/Frame%209119.png',
    src: '/videos/Demo%20Automating%20management.mp4',
    // This chapter plays a code-driven animation scene (see the SCENES registry
    // in HeroVideo) instead of a video.
    scene: 'posted-missions',
    // On the mobile reel this first page shows the hero headline + trust badges.
    heroTitle: 'Teams Are Automatically Guided To Take Actions\nSimilar To How Drivers Are Guided By Signals And Lights',
  },
  {
    id: 2,
    title: 'Preserving Knowledge',
    minutes: 4,
    start: 300,
    heroTitle: 'Acquired Knowledge Is Seamlessly Stored\nAnd Systematically Passed To Everyone',
    badges: [
      { icon: 'book', title: 'Knowledge Preservation', sub: 'Acquired Knowledge And Experience Are Systematically Stored In The Organization Library' },
      { icon: 'users', title: 'Knowledge Sharing', sub: 'Knowledge Is Converted Into Workflow And Training Missions And Automatically Assigned To People' },
      { icon: 'chart', title: 'Positive Evolution', sub: 'Lessons And Experiences Are Shared To Prevent Past Mistakes From Repeating In The Future' },
      { icon: 'shield', title: 'Work Stability', sub: 'Key Information Is Systematically Preserved And Spread, Without Reliance On Tribal Knowledge' },
    ],
  },
  {
    id: 3,
    title: 'Increasing Efficiency',
    minutes: 4,
    start: 540,
    heroTitle: 'Constant Engagement Motivates Teams\nTo Increase Productivity',
    badges: [
      { icon: 'clock', title: 'Execution Timers', sub: 'Missions Display Timers Which Change In Color As They Age To Communicate A Sense Of Urgency' },
      { icon: 'star', title: 'Reward Points', sub: 'Reward Points Can Be Added To Missions To Increase Team Motivation With Clever Gamification' },
      { icon: 'users', title: 'Individual Recognition', sub: "Performers' Names Are Displayed On Their Completed Missions To Keep Score And Improve Performance" },
      { icon: 'check', title: 'Work Continuity', sub: 'Everyone Is Constantly Informed And Engaged To Minimize Downtime Between Tasks' },
    ],
  },
  {
    id: 4,
    title: 'Improving Quality',
    minutes: 5,
    start: 780,
    heroTitle: 'In-Mission Guidance Ensures\nThat Brand Standards Are Constantly Maintained',
    badges: [
      { icon: 'compass', title: 'In-Mission Guidance', sub: 'In-Mission Instructions And Alerts Refresh About Performance And Safety Standards' },
      { icon: 'graduation', title: 'Relevant Micro-Training', sub: 'Micro-Trainings Can Be Injected Into Missions To Ensure Competency Prior To Performing Critical Work' },
      { icon: 'camera', title: 'Visual Proof', sub: 'Photos Or Videos Can Be Incorporated Into Checkpoints To Document Execution Quality' },
      { icon: 'shield', title: 'Personal Accountability', sub: 'Quality Control Can Be Crowdsourced Through Self-Ratings And Peer-Ratings' },
    ],
  },
  {
    id: 5,
    title: 'Automating Audits',
    minutes: 4,
    start: 1080,
    heroTitle: 'Routine Audits Can No Longer\nBe Ignored Or Forgotten',
    badges: [
      { icon: 'clock', title: 'Timely Actions', sub: 'Routine Audits Are Automatically Assigned' },
      { icon: 'compass', title: 'Precision Execution', sub: 'Auditors Are Guided Through Steps To Ensure That No Detail Is Omitted Or Forgotten' },
      { icon: 'camera', title: 'Evidence Collection', sub: 'Photos Or Videos Can Be Taken Within Audits And Retrieved By Mission, By Person, Or By Checkpoint' },
      { icon: 'shield', title: 'Automated Alerts', sub: 'Alert Tickets Are Automatically Triggered When Issues Are Identified, Or Delays Occur' },
    ],
  },
  {
    id: 6,
    title: 'Requesting Support',
    minutes: 3,
    start: 1320,
    heroTitle: 'Maintenance Or Other Requests\nShould Not Be Done From Stand-Alone Systems',
    badges: [
      { icon: 'star', title: 'Press Button', sub: 'Teams Press And Select To Make Requests From Any Department Or Team' },
      { icon: 'camera', title: 'Scan QR Code', sub: 'Customers, Vendors And Outsiders Scan A QR Code To Make Requests Of Your Team' },
      { icon: 'clock', title: 'Response Tracking', sub: 'Response Time And Execution Duration Are Tracked Until A Resolution Is Confirmed' },
      { icon: 'shield', title: 'Clear Accountability', sub: 'It Is Clear Who Requested And When, And Who Responded And When, And Duration Until Resolved' },
    ],
  },
  {
    id: 7,
    title: 'Live Monitoring',
    minutes: 5,
    start: 1500,
    heroTitle: 'Live Dashboards Provide Constant Visibility\nInto Every Aspect Of Business',
    badges: [
      { icon: 'check', title: 'Actions Taken', sub: 'Every Action Taken Can Be Tracked Live Until Completed' },
      { icon: 'users', title: 'People Working', sub: 'See Live Who Is Actually Working And Who Is Idle' },
      { icon: 'clock', title: 'Execution Timers', sub: 'Aging Timers Measure Team Initiatives While Performance Timers Measure Execution Efficiency' },
      { icon: 'chart', title: 'Data Feeds', sub: 'Checklist And Audit Responses Can Be Fed Into Boards To Flag Deviation From Norms' },
    ],
  },
  {
    id: 8,
    title: 'Training & Coaching',
    minutes: 6,
    start: 1800,
    heroTitle: 'Training Is Converted Into Micro-Lessons\nAnd Assigned Without Disrupting Work',
    badges: [
      { icon: 'graduation', title: 'Planned Training', sub: 'Micro-Training Can Be Automatically Assigned, And Critical Lessons Can Be Repeated For Emphasis' },
      { icon: 'compass', title: 'Reactive Training', sub: 'Training Can Be Automatically Assigned In Reaction To Behavior, Testing Results, Or Findings In Audits' },
      { icon: 'book', title: 'Ready Knowledge', sub: 'Training Can Be Instantly Accessed In A Knowledge Base, Or Incorporated Into Audits And Checklists' },
      { icon: 'shield', title: 'Certification Tracking', sub: 'Tasks And Trainings Can Be Automatically Assigned To Renew Certificates Prior To Their Expiration' },
    ],
  },
  {
    id: 9,
    title: 'Risk & Liability',
    minutes: 4,
    start: 2160,
    cover: '/Images/Risk.jpg',
    heroTitle: 'Training Is Converted Into Micro-Lessons\nAnd Assigned Without Disrupting Work',
    badges: [
      { icon: 'graduation', title: 'Planned Training', sub: 'Micro-Training Can Be Automatically Assigned, And Critical Lessons Can Be Repeated For Emphasis' },
      { icon: 'compass', title: 'Reactive Training', sub: 'Training Can Be Automatically Assigned In Reaction To Behavior, Testing Results, Or Findings In Audits' },
      { icon: 'book', title: 'Ready Knowledge', sub: 'Training Information Can Be Accessed While People Work, Or Incorporated Into Audits And Checklists' },
      { icon: 'shield', title: 'Certification Tracking', sub: 'Tasks And Trainings Can Be Automatically Re-Assigned To Renew Certificates Prior To Their Expiration' },
    ],
  },
  {
    id: 10,
    title: 'Franchising',
    minutes: 4,
    start: 2400,
    heroTitle: 'Automation Makes A Franchise Easier To Operate\nAnd More Appealing To Own',
    badges: [
      { icon: 'chart', title: 'Easy Standardization', sub: 'Franchisors Update Operating Plans By Editing In The Marketplace Which Instantly Updates All Franchisees' },
      { icon: 'check', title: 'Effective Auditing', sub: 'Safety And Brand Audits Can Be Automated, And Deviations From Standards Can Trigger Alert Tickets' },
      { icon: 'camera', title: 'Remote Monitoring', sub: 'Any Activity Can Be Remotely Monitored And Visual Evidence Can Be Examined To Uphold Standards' },
      { icon: 'compass', title: 'Jurisdictional Adaptation', sub: "Content Is Automatically Adapted To Local Laws, Based On Each Location's State, County And City" },
    ],
  },
  {
    id: 11,
    title: 'Consulting',
    minutes: 4,
    start: 2640,
    heroTitle: 'Automation Converts Consulting From Limited Pay\nTo A Recurring Revenue Model',
    badges: [
      { icon: 'compass', title: 'Dynamic Planning', sub: 'Replace Static Plans With Effective Automation That Can Be Quickly And Easily Adopted By Clients' },
      { icon: 'clock', title: 'Constant Adjustments', sub: 'Maintain Remote Visibility Into Plan Executions And Make Adjustments On The Fly When Needed' },
      { icon: 'chart', title: 'Demonstrable Value', sub: 'Easily Measure And Report On Any Activity To Demonstrate Value And Justify Contract Extensions' },
      { icon: 'users', title: 'Client Tracking', sub: 'Increase Your Consulting Revenue By Revisiting Past Clients With Automated Plans To Improve Results' },
    ],
  },
  {
    id: 12,
    title: 'Reporting & AI',
    minutes: 3,
    start: 2880,
    heroTitle: 'An Unparalleled Level Of Detail\nIs Collected To Support AI Optimization',
    badges: [
      { icon: 'clock', title: 'Missions', sub: 'The Aging And Execution Durations Of Every Workflow And Training Mission Is Tracked' },
      { icon: 'users', title: 'People', sub: 'The Contribution And Actions Of Each Person Are Measured And Recognized' },
      { icon: 'book', title: 'Information', sub: 'All Data Collected And Visual Evidence Taken During Executions Are Indexed And Stored' },
      { icon: 'star', title: 'Frictionless', sub: 'Extensive Detail Is Collected Without Disrupting Teams, But Rather While Improving Their Performance' },
    ],
  },
];

export function formatDuration(minutes) {
  return `${minutes} min`;
}
