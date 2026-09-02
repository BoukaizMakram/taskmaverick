// ---------------------------------------------------------------------------
// Single source of truth for the landing page reel (Website Plan A · Operations).
// Each chapter = one reel page: a title, a headline (heroTitle), and two badges.
// Media is optional (cover image / video / coded scene); with none, the chapter
// shows its headline on a poster. Content is also editable locally via /admin.
// ---------------------------------------------------------------------------

export const VIDEO_SRC = '';

export const VIDEO_POSTER = '';

export const CHAPTERS = [
  {
    id: 1,
    title: 'Automated Guidance',
    heroTitle: 'Teams Take Initiatives On Their Own\nNo Need For A Manager To Constantly Remind Them',
    badges: [
      { icon: 'clock', title: 'Timely Engagement', sub: 'Work Missions Are Performed On Time' },
      { icon: 'chart', title: 'Effective Displays', sub: 'Visual Cues Inform Teams And Optimize Engagement' },
    ],
  },
  {
    id: 2,
    title: 'Workload Optimization',
    heroTitle: 'Work Missions Are Automatically Assigned\nBased On Business Rhythm And Staff Availability',
    badges: [
      { icon: 'chart', title: 'Planning Dashboards', sub: 'Work Is Automatically Assigned Over Time Intervals' },
      { icon: 'users', title: 'Optimized Distribution', sub: 'Teams Are Never Overloaded With Work Or Underutilized' },
    ],
  },
  {
    id: 3,
    title: 'Recognition & Reward',
    heroTitle: 'The Best Performers Are Easily\nIdentified, Recognized And Rewarded',
    badges: [
      { icon: 'users', title: 'Contribution Tracking', sub: "Performers' Names Are Stamped On Their Completed Missions" },
      { icon: 'clock', title: 'Efficiency Tracking', sub: "Each Person's Execution Duration Is Measured Per Mission" },
    ],
  },
  {
    id: 4,
    title: 'Motivating Efficiency',
    heroTitle: 'Team Productivity Is Systematically Boosted\nTo Reduce Downtime And Improve Work Efficiency',
    badges: [
      { icon: 'clock', title: 'Visual Cues', sub: 'Mission Timers Change In Color As They Age To Create A Sense Of Urgency' },
      { icon: 'star', title: 'Clever Gamification', sub: 'Reward Points Can Be Added To Work Missions To Boost Team Motivation' },
    ],
  },
  {
    id: 5,
    title: 'Ensuring Quality',
    heroTitle: 'Micro-Trainings Are Injected Into Processes\nTo Re-Educate Teams In Relation To Their Actions',
    badges: [
      { icon: 'graduation', title: 'Micro-Lessons', sub: 'They Can Be Imbedded Into Work Missions To Remind Teams About Execution Standards' },
      { icon: 'star', title: 'Mission Ratings', sub: 'Completed Missions Can Be Rated To Crowdsource Quality Reviews' },
    ],
  },
  {
    id: 6,
    title: 'Verifying Outcomes',
    heroTitle: 'Photo Or Video Proof Can Be Added To Missions\nTo Demonstrate Adherence To Standards',
    badges: [
      { icon: 'camera', title: 'Visual Evidence', sub: 'It Can Be Easily Retrieved By Person, By Mission, Or By Checkpoint' },
      { icon: 'camera', title: 'Visual Tour', sub: 'In Gallery View, Photos And Videos Provide Evidence Of Past Executions' },
    ],
  },
  {
    id: 7,
    title: 'Live Monitoring',
    heroTitle: 'Live Dashboards Provide Remote Visibility\nInto Every Aspect Of Business Operations',
    badges: [
      { icon: 'users', title: 'People Working', sub: 'See Who Worked And For How Long, And Who Is Currently Working' },
      { icon: 'check', title: 'Actions Taken', sub: 'See What Is Due, What Is Being Done, And What Was Completed' },
    ],
  },
  {
    id: 8,
    title: 'Audits & Inventory',
    heroTitle: 'Team Training Or Follow-Up Actions Can Be\nAutomatically Assigned Based On Audit Results',
    badges: [
      { icon: 'check', title: 'Data Collection', sub: 'Steps Are Followed To Verify Standards Or Document Conditions' },
      { icon: 'shield', title: 'Assured Resolutions', sub: 'Follow-Up Actions Or Trainings Can Be Tracked Until Completed' },
    ],
  },
  {
    id: 9,
    title: 'Maintenance & Requests',
    heroTitle: 'Maintenance And Other Requests Are\nEasily Made And Tracked Until Resolution',
    badges: [
      { icon: 'camera', title: 'Select Or Scan', sub: 'Requests Can Be Made In Simple And Efficient Ways' },
      { icon: 'clock', title: 'Tracking Progress', sub: 'Response Times Can Be Tracked On Mobile Or Web Until Resolution' },
    ],
  },
  {
    id: 10,
    title: 'Process Automation',
    heroTitle: 'A Process Flow Can Be Dependent On Completing\nOne Action Or Several Prior Actions',
    badges: [
      { icon: 'compass', title: 'Action Triggers', sub: 'An Action Can Be Instantly Triggered By A Prior Action, Or Delayed' },
      { icon: 'compass', title: 'Process Flow', sub: 'It Can Include Team And Individual Actions, Trainings, And Surveys' },
    ],
  },
  {
    id: 11,
    title: 'Managing by Exception',
    heroTitle: 'Managers Are Automatically Flagged\nAbout Deviations From Established Standards',
    badges: [
      { icon: 'shield', title: 'Data Alerts', sub: 'They Can Be Triggered By Responses In Checklists Or Surveys' },
      { icon: 'shield', title: 'Execution Alerts', sub: 'They Can Be Triggered By Performance Delays, Short Executions, Or Low Ratings' },
    ],
  },
  {
    id: 12,
    title: 'Reporting & AI',
    heroTitle: 'An Unparalleled Level Of Data Is Collected\nWithout Disrupting People While They Work',
    badges: [
      { icon: 'book', title: 'Unprecedented Detail', sub: 'Reports Can Be Indexed To The Evidence Collected Within A Single Checkpoint' },
      { icon: 'chart', title: 'AI Power', sub: 'Extensive Data Is Fed Into AI Models To Optimize Training And Operation' },
    ],
  },
];

export function formatDuration(minutes) {
  return `${minutes} min`;
}
