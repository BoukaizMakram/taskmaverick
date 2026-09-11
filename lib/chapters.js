// ---------------------------------------------------------------------------
// Single source of truth for the landing reel (Website Plan: Operations,
// Training, Risk, Knowledge). One chapter per subsection: a title, the video
// stage-CTA (heroTitle), and two badges. Generated from 2393.xlsx.
// ---------------------------------------------------------------------------

export const VIDEO_SRC = '';

export const VIDEO_POSTER = '';

// Intro reel page shown BEFORE Operations — Taskmaverick's underlying philosophy
// (a statement + two badges). Scrolling down from it lands on the first chapter
// (Operations → Automated Manager).
export const PHILOSOPHY = {
  id: 'philosophy',
  title: 'Philosophy',
  heroTitle: "Don't Blame Your Employees For Low Performance\nBlame Your System",
  badges: [
    { icon: 'compass', title: 'Bottom-Up Leadership', sub: 'Teams Perform Better When They Follow A System On Their Own' },
    { icon: 'check', title: 'Systems, Not Reminders', sub: 'Like Traffic Signals, Clear Cues Guide People To Act Correctly' },
  ],
};

export const CHAPTERS = [
  {
    id: 1,
    title: 'Automated Manager',
    heroTitle: 'Teams Are Automatically Guided To Take Initiatives\nNo Need For A Manager To Constantly Remind Them',
    scene: 'posted-missions',
    badges: [
      { icon: 'clock', title: 'Timely Actions', sub: 'Teams Cooperate To Perform Work Missions On Time Exactly When Due' },
      { icon: 'camera', title: 'Constant Guidance', sub: 'Visual Cues Are Clearly Displayed To Engage Teams And Optimize Performance' },
    ],
  },
  {
    id: 2,
    title: 'Workload Optimization',
    heroTitle: 'Work Missions Are Automatically Assigned Based On Business Rhythm And Staff Availability',
    badges: [
      { icon: 'clock', title: 'Planning Dashboards', sub: 'Work Is Automatically Assigned Over Time Intervals' },
      { icon: 'clock', title: 'Optimized Distribution', sub: 'Teams Are Never Overloaded With Work Or Underutilized' },
    ],
  },
  {
    id: 3,
    title: 'Reward & Recognition',
    heroTitle: 'The Best Performers Are Easily Identified, Recognized And Rewarded',
    badges: [
      { icon: 'users', title: 'Contribution Tracking', sub: 'Performers\' Names Are Stamped On Their Completed Missions' },
      { icon: 'clock', title: 'Efficiency Tracking', sub: 'Each Person\'s Execution Duration Is Measured Per Mission' },
    ],
  },
  {
    id: 4,
    title: 'Motivating Efficiency',
    heroTitle: 'Team Productivity Is Systematically Boosted To Reduce Downtime And Improve Work Efficiency',
    badges: [
      { icon: 'camera', title: 'Visual Cues', sub: 'Mission Timers Change In Color As They Age To Create A Sense Of Urgency' },
      { icon: 'star', title: 'Clever Gamification', sub: 'Reward Points Can Be Added To Work Missions To Boost Team Motivation' },
    ],
  },
  {
    id: 5,
    title: 'Ensuring Quality',
    heroTitle: 'Micro-Trainings Are Injected Into Processes To Re-Educate Teams In Relation To Their Actions',
    badges: [
      { icon: 'graduation', title: 'Micro-Lessons', sub: 'They can Be Imbedded Into Work Missions To Remind Teams About Execution Standards' },
      { icon: 'camera', title: 'Visual Evidence', sub: 'Photos And Videos Can Be Taken To Document Standards And Record Conditions' },
    ],
  },
  {
    id: 6,
    title: 'Personal Accountability',
    heroTitle: 'Ratings Can Be Used To Encourage Personal Accountability And Crowdsource Performance Reviews',
    badges: [
      { icon: 'users', title: 'Self Ratings', sub: 'Performers Reflect On The Quality Of Their Work By Rating Their Completed Missions' },
      { icon: 'users', title: 'Peer Ratings', sub: 'Everyone Can Be Engaged In Quality Control By Rating Each Other\'s Completed Work' },
    ],
  },
  {
    id: 7,
    title: 'Live Monitoring',
    heroTitle: 'Live Dashboards Provide Remote Visibility Into Every Aspect Of Business Operations',
    badges: [
      { icon: 'users', title: 'All People', sub: 'Track Live Who Completed What Missions, How long It Took Them TO Complete Each, And Who Is Currently Working' },
      { icon: 'compass', title: 'All Actions', sub: 'Track Live What Missions Are Due, What Missions Are Being Done, And What Missons Were Completed' },
    ],
  },
  {
    id: 8,
    title: 'Dynamic Auditing',
    heroTitle: 'When Audits Uncover Issues, Training Lessons Or Follow-Up Actions Are Automatically Assigned',
    badges: [
      { icon: 'graduation', title: 'Guided Steps', sub: 'Specific Guidance And Micro-Trainings Can Be Injected Within Audits To Ensure Precision Executions' },
      { icon: 'compass', title: 'Assured Resolutions', sub: 'When Audits Detect Issues, Follow-Up Actions Are Triggerred And Tracked Until Fully Resolved' },
    ],
  },
  {
    id: 9,
    title: 'Inventory Management',
    heroTitle: 'Inventory Checks And Par Levels Are Automated To Ensure Timely Replenishments',
    badges: [
      { icon: 'camera', title: 'Optimized Displays', sub: 'Products Are Automatically Requested And Confirmed As Replenished And Properly Displayed' },
      { icon: 'camera', title: 'Timely Replenishment', sub: 'Visual Evidence Proviodes Assurance That Standards Are Being Maintained' },
    ],
  },
  {
    id: 10,
    title: 'Maintenance & Requests',
    heroTitle: 'Maintenance And Other Requests Are Easily Made And Tracked Until Resolution',
    badges: [
      { icon: 'camera', title: 'Select Or Scan', sub: 'Requests Can Be Made Quickly And Efficiently By QR Scan Or Push-Button' },
      { icon: 'check', title: 'Tracking Progress', sub: 'There Is No Uncertainty As To Whether A Request Is Being Answered And Performed' },
    ],
  },
  {
    id: 11,
    title: 'Managing by Exception',
    heroTitle: 'Managers Are Automatically Flagged About Deviations From Established Standards',
    badges: [
      { icon: 'shield', title: 'Response Alerts', sub: 'They Can Be Triggerred By Data Entered Or Responses Made In Checklists Or Surveys' },
      { icon: 'shield', title: 'Execution Alerts', sub: 'They Can Be Triggerred By Performance Delays, Unreasonable Executions, Or Poor Ratings' },
    ],
  },
  {
    id: 12,
    title: 'Reporting  & AI',
    heroTitle: 'An Unparallelled Level Of Data Is Collected Without Disrupting People While They Work',
    badges: [
      { icon: 'camera', title: 'Unprecedented Detail', sub: 'Reports Can Be Indexed To The Evidence Collected Within A Single Checkpoint' },
      { icon: 'graduation', title: 'AI Power', sub: 'Extensive Data Is Fed Into AI Models To Optimize Training And Operation' },
    ],
  },
  {
    id: 13,
    title: 'Automated Coaching',
    heroTitle: 'Training In Micro-Lessons Is Modeled After How Sports Teams Are Coached While The Game Is On',
    badges: [
      { icon: 'graduation', title: 'Micro-Training', sub: 'Micro-Lessons Can Be In The Form Of Video, Audio, Or Text' },
      { icon: 'graduation', title: 'Instant Production', sub: 'Typing Or Pasting Text Instantly Converts It Into Audio Lessons' },
    ],
  },
  {
    id: 14,
    title: 'Assured Learning',
    heroTitle: 'Micro-Lessons Can Be Focused On A Single Message Making It Easy To Confirm Learning',
    badges: [
      { icon: 'graduation', title: 'Focused Messaging', sub: 'A Short Quiz Is Sufficient To Confirm Proper Learning' },
      { icon: 'graduation', title: 'Automated Repetition', sub: 'People Forget But Important Lessons Can Be Automatically Repeated For Emphasis' },
    ],
  },
  {
    id: 15,
    title: 'Dynamic Testing',
    heroTitle: 'An Individual\'s Training Can Be Automatically Customized Based On Their Specific Needs',
    badges: [
      { icon: 'graduation', title: 'Learning Efficiency', sub: 'Training Is Automatically Assigned Based On Test Results To Fill Knowledge Gaps' },
      { icon: 'clock', title: 'Happier Teams', sub: 'No Time Is Wasted On Studying What They Already Know' },
    ],
  },
  {
    id: 16,
    title: 'Adaptive Coaching',
    heroTitle: 'Micro-Lessons Can Target People In Reaction To Their Behavior, Or Based On Detected  Issues',
    badges: [
      { icon: 'clock', title: 'Timely Guidance', sub: 'The Correct Message Is Sent To Teams Exactly In The Context Of Their Specific Circumstances' },
      { icon: 'graduation', title: 'Frictionless Feedback', sub: 'Corrective Coaching Can Be Automatically Delivered Without The Inherent Tension In Interpersonal Feedback' },
    ],
  },
  {
    id: 17,
    title: 'Imbedded Guidance',
    heroTitle: 'Training And Working Are Not Performed In Separate Silos, But Rather Incorporated Together',
    badges: [
      { icon: 'graduation', title: 'Execution Precision', sub: 'Operational Instructions And Training Media Can Be Imbedded Into Work Processes' },
      { icon: 'book', title: 'Ready Knowledge', sub: 'Information Is Instantly Available To Teams While They Perform' },
    ],
  },
  {
    id: 18,
    title: 'Mass Broadcasting',
    heroTitle: 'Senders Are Assured That Important Messages Are Received And Understood By Recipients',
    badges: [
      { icon: 'shield', title: 'Critical Announcements', sub: 'Each Recipient\'s Full Understanding And Compliance Can Be Required By Senders' },
      { icon: 'check', title: 'Exception Flags', sub: 'Anyone Delayed In Confirming Receipt And Understanding Is Flagged For Follow-Up' },
    ],
  },
  {
    id: 19,
    title: 'Automating Certification',
    heroTitle: 'Certification Issuance And Tracking Can Be Automated To Ensure Ongoing Compliance',
    badges: [
      { icon: 'graduation', title: 'Internal Certificates', sub: 'They Can Mandate Training Lessons And Assign Certification Tasks' },
      { icon: 'graduation', title: 'External Certificates', sub: 'They Can Be Uploaded And Tracked, With Automated Reminders Prior To Expiration' },
    ],
  },
  {
    id: 20,
    title: 'Data & AI',
    heroTitle: 'Training Execution Is Carefully Measured To Optimize Strategy And Maximize Outcomes',
    badges: [
      { icon: 'graduation', title: 'Measurable Executions', sub: 'For Each Micro-Training, Its Aging And Execution Durations Are Measured Per Person' },
      { icon: 'graduation', title: 'AI Optimization', sub: 'Detailed Data Is Fed Into AI Models To Assess Individual Performance And To Improve Training Content' },
    ],
  },
  {
    id: 21,
    title: 'Risk & Liability',
    heroTitle: 'Business Stability Requires Early Detection Of HR Risks To Reduce Insurance And Legal Costs',
    badges: [
      { icon: 'shield', title: 'Automated Detection', sub: 'HR Risks Can Be Automatically Flagged On A Periodical Basis' },
      { icon: 'graduation', title: 'Guided Resolution', sub: 'Alert Tickets Include Micro-Trainings And Step-By-Step Processes To Ensure Proper Resolutions' },
    ],
  },
  {
    id: 22,
    title: 'Meal & Rest Breaks',
    heroTitle: 'Breaks Can Be Automatically Managed To Reduce Legal Risk And Optimize Operational Efficiency',
    badges: [
      { icon: 'camera', title: 'Visual Guidance', sub: 'Teams Take Their Breaks On Time And Accurately On Duration' },
      { icon: 'clock', title: 'Optimized Sequencing', sub: 'The Time And Number Of Simultaneous Breaks Can Be Limited By Team' },
    ],
  },
  {
    id: 23,
    title: 'Fraud Prevention',
    heroTitle: 'Proactive Measures Can Be Systematically Implemented To Reduce Risk And Uncertainty',
    badges: [
      { icon: 'shield', title: 'Reducing Claims', sub: 'Facts Are Documented And Records Maintained To Defend Against Wrongful Accusations' },
      { icon: 'shield', title: 'Effective Deterrence', sub: 'Automated Risk Detection Exposes Bad Actors And Deters Others From Committing HR Offenses' },
    ],
  },
  {
    id: 24,
    title: 'Prediction  & AI',
    heroTitle: 'Data Is Constantly Collected To Assess Operational Risks And To Develop Preventive Strategies',
    badges: [
      { icon: 'graduation', title: 'Full X-Ray', sub: 'Risk Factors Are Identified And Collected From All Missions: Checklists, Surveys, Tests, Tickets And Trainings' },
      { icon: 'shield', title: 'AI Optimization', sub: 'Data Is Fed Into AI Models To Identify Or To Predict Risk And To Reduce Exposure' },
    ],
  },
  {
    id: 25,
    title: 'Standardizing Enterprise',
    heroTitle: 'Business Methods Are Systematically Applied To Ensure Standardization Across Vast Enterprises',
    badges: [
      { icon: 'book', title: 'Knowledge Retention', sub: 'Everything Ever Learned Is Preserved And Spread In Actionable Missions' },
      { icon: 'book', title: 'Knowledge Transfer', sub: 'Past Knowledge And Experience Are Seamlessly Transferred To The Next Generation Of Employees' },
    ],
  },
  {
    id: 26,
    title: 'Powering Franchise',
    heroTitle: 'Automation Makes A Franchise Easier To Operate And More Appealing To Own',
    badges: [
      { icon: 'check', title: 'Automated Management', sub: 'Franchisees Will Appreciate A Franchise That Is Automated And Simplified' },
      { icon: 'shield', title: 'Better Investment', sub: 'Investing In A Systematic Business Reduces Operational Hassle And Capital Risk' },
    ],
  },
  {
    id: 27,
    title: 'Innovating Consulting',
    heroTitle: 'Automation Converts Consulting From Limited Pay To A Recurring Revenue Model',
    badges: [
      { icon: 'compass', title: 'Dynamic Plans', sub: 'Static Plans Are Replaced With Effective Automation That Can Be Quickly And Easily Adopted By Clients' },
      { icon: 'chart', title: 'Demonstrable Value', sub: 'Easily Measure and Report On Any Activity To Demonstrate Value And Justify Contract Extensions' },
    ],
  },
];

export function formatDuration(minutes) {
  return `${minutes} min`;
}
