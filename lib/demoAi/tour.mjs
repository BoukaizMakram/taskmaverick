// ---------------------------------------------------------------------------
// /demo-ai guided tour — the same walkthrough as the recorded sales demo, in
// the same order, as a fixed script: what Mav says, with the exact screen
// actions ([[commands]], see lib/demoAi/prompt.mjs) where they happen. Played
// step by step (DemoAI); the visitor can interrupt at any time — Gemini
// answers, then the tour resumes where it stopped.
// Chapters that replay a flow start with [[stage restore <mission>]] so they
// work even if that mission was used earlier in the call.
// ---------------------------------------------------------------------------

export const TOUR = [
  { id: 'philosophy', title: 'Bottom-Up Leadership', steps: [
    "[[stage devices]] Before we start, let me share the idea behind Taskmaverick. Bottom-up leadership is far more effective, and far more efficient, than top-down micromanagement.",
    "You see it every day on the road. People drive multi-ton vehicles in a very complex environment, and they get to work safely, because they follow a system of signals and lights.",
    "Yet at work, people forget to do A, skip B and omit C. It's not a question of intelligence or education. Put two hundred MBAs at an intersection without lights, and you get a mess.",
    "Business needed a system too. So we built the equivalent of traffic signals and lights for business. Our slogan says it: powering business by empowering people.",
  ] },
  { id: 'shared', title: 'Shared Devices & Live Timers', steps: [
    "Taskmaverick runs on the web, on iPhone and Android, on phones and on tablets. [[tablet board Team A]] On the right is a shared tablet. One tablet for the front of the house, one in the kitchen, or one at a nurse station, is enough.",
    "Tasks, checklists and surveys, we call them missions, pop up on the tablet under the Open column, [[tablet point Open]] each with a live timer. [[tablet point timer]] Timers can turn from green to orange to red as they age.",
    "Anyone who is available grabs a mission with their personal code. It moves to Claimed, [[tablet point Claimed]] and when they finish, it moves to Closed. [[tablet point Closed]] That's how a whole team works together from one device.",
  ] },
  { id: 'factory', title: 'A Factory, Live', steps: [
    "Now let me take you to a factory. [[tablet board QC Line Inspections]] This is the quality control team. You see what is open, who is working on what, and for how long.",
    "When you open the Closed column, [[tablet expand closed]] it becomes a scoreboard: the names of the people, their execution time, and how long each mission aged. We account for who is doing what.",
    "[[tablet collapse]] Let me open one inspection. [[tablet open L3 - Chunk Line Inspection]] Every checkpoint is guided, in any language. One tap on the blue button, and it's in Spanish. [[tablet translate]]",
    "[[tablet translate]] This checkpoint passed, and here is the photo proof. [[tablet click photo]] It's taken live, at this exact date and time, down to the second. It can't be reused, and it's searchable by person and by checkpoint. [[tablet back]]",
    "They also enter dimensions, weights and counts. Look at Chunk Topper Units: [[tablet point Chunk Topper Units]] it's out of range, so the software flags it immediately, and corrections happen on the factory floor while the work is happening. [[tablet back]]",
  ] },
  { id: 'oversight', title: 'Live Dashboard & Media Proofs', steps: [
    "As a manager, you have a live dashboard. [[stage web]] [[web overview board=Team Board; view=Running]] You can go to any department and see every action and every person, better than if you were there in person.",
    "You can also travel back in time [[web overview board=Team Board; view=History]] and see everything that was done, and when.",
    "[[stage devices]] And on the tablet, there's Media Proofs, our Instagram mode. [[tablet proofs]] Every inspection: who did it, when it was closed, how long it took. We collect this data without disrupting people; we guide them while collecting it. [[tablet back]]",
  ] },
  { id: 'reports', title: 'Reports Down To The Checkpoint', steps: [
    "The reporting is extensive. [[stage web]] [[web report name=Productivity; group=Unit]] This is a report by department. The quality control department is at ninety-five percent execution.",
    "I can break it down by line, QC Line Inspections, and then by person. [[web click Maria Jose S]] These are Maria Jose's executions.",
    "And I can open one inspection [[web click L3 - Chunk Line Inspection]] and see every checkpoint, every answer, and the evidence that was collected. Visibility, down to the checkpoint.",
  ] },
  { id: 'kitchen', title: 'A Restaurant Kitchen', steps: [
    "I like to show a simple restaurant, because if they can do it, anybody can. [[stage devices]] [[tablet board Kitchen]] Here the kitchen board is reminding Angel to take his 10-Min Break AM, as the labor law requires. [[tablet point 10-Min Break AM]]",
    "And here they took the Kitchen Temp. [[tablet open Kitchen Temp]] When I open it, I see the instructions and the red alert. And like before, it's in Spanish with one tap. [[tablet translate]]",
    "[[tablet translate]] Every fridge reading comes with its photo. [[tablet click photo]] We're not just collecting data; we verify it. And when people take a picture of their work, they do a better job. [[tablet back]] [[tablet back]]",
  ] },
  { id: 'sync', title: 'Phone And Tablet, In Sync', steps: [
    "Now a quick simulation of how the system guides people. [[stage restore Brew Coffee]] [[tablet board Team A]] [[phone board Team A]] The phone is in my hand, and the tablet is shared by the team.",
    "Say I brew coffee. I tap Brew Coffee. [[phone open Brew Coffee]] It gives me the instructions and the alerts, so even if I'm new, I know what to do. And I earn points.",
    "I claim it with my code. [[phone claim]] [[phone back]] And look at the tablet: Brew Coffee is under Claimed, with my name. [[tablet point Brew Coffee]]",
    "Because the tablet is shared, I can finish it there, with my code. [[tablet open Brew Coffee]] [[tablet close]] Start on one device, finish on another. Nobody has to wonder what was done and what remains.",
  ] },
  { id: 'guided', title: 'Training In The Checklist, Automatic Tickets', steps: [
    "Now something more advanced. [[stage restore Fry Dispenser Cleaning]] [[tablet board Maintenance Tickets]] I'll do a sensitive task, the Fry Dispenser Cleaning. [[phone open Fry Dispenser Cleaning]] [[phone claim]]",
    "It's such a sensitive piece of equipment that a training is injected right into the checklist. [[phone point training]] If I'm not competent, it makes sure I become competent before I continue. If I know it, I can skip to the quiz, but if I fail the quiz, it sends me back to the training. [[phone lesson]]",
    "Then it guides me, like a GPS. I removed and emptied the hopper, [[phone answer 2 Yes]] and the rack. [[phone answer 3 Yes]] Is the fry dispenser working properly? No. [[phone answer 4 No]]",
    "Now it asks me to diagnose it and send a video. [[phone capture]] I close the mission, [[phone close]] and look at the tablet: a Maintenance Alert, instantly. [[tablet point Maintenance Alert]]",
    "The vendor or the manager opens it, [[tablet open Maintenance Alert]] sees the answer and the evidence collected on site, and claims it, so we know it's being handled. [[tablet claim]]",
  ] },
  { id: 'knowledge', title: 'Knowledge At Your Fingertips', steps: [
    "We believe training and working should always go together, so the knowledge base is at your fingertips. [[phone knowledge]] If a nurse meets a complex bed and wants to know how the exit alarm works, she pulls it up on the fly. [[phone click Bed Exit Alarm]]",
    "It's like the road: you don't memorize every sign in advance, you see the right sign where you drive. Training should be reminded in the context of the work. [[phone back]] [[phone back]]",
  ] },
  { id: 'requests', title: 'On-Demand Requests', steps: [
    "Instead of picking up the phone to ask another department for something, there's the plus button. [[phone request Spill Clean-Up Needed]] Pick a request, and it opens in the right department, with who answered it and how long it took.",
  ] },
  { id: 'history', title: 'Timer Colors, History & Gallery', steps: [
    "[[stage web]] [[web overview board=Team Board; view=History]] In History, you see every request and mission, who answered, and how many closed on green versus orange. For each mission, you set how long green lasts and when it turns red, so sensitive missions get prioritized automatically.",
    "[[web report name=Usage; gallery=yes]] And in Gallery View, people show off their work, like a vlog. They feel recognized, and you don't need to micromanage. You just guide them.",
  ] },
  { id: 'training', title: 'Training On The Personal Board', steps: [
    "Now, training. [[stage devices]] [[phone board Personal Board]] On my personal board, there's media to train me, surveys, and tests.",
    "Training doesn't have to be a video. It can be text, and if you don't like reading, you listen to it like a podcast. [[phone open Punctuality]] [[phone claim]] [[phone click Audio]]",
    "If my English isn't strong, one tap translates it to Spanish. [[phone translate]] I can read it or hear it, and the quiz is in Spanish too. [[phone translate]] [[phone back]] [[phone lesson]] [[phone close]]",
    "And it's all recorded: what I learned, how long it took, and the answers I gave. It works like a written notice.",
  ] },
  { id: 'planning', title: 'Planning The Business', steps: [
    "Everything is planned. [[stage web]] [[web overview board=Team Board; view=Timeline]] Here is the plan for every hour, team by team. A mission can repeat every three hours, between eight thirty and five forty-five.",
    "And the training too. [[web overview board=Personal Board; view=History]] This is the training history, person by person, a few seconds a day. That level of specificity isn't possible in a traditional LMS, because here training is injected into the work.",
  ] },
  { id: 'reactive', title: 'Reactive Training', steps: [
    "Training can also be reactive. An audit fails on cleanliness, and everybody gets the cleanliness training. You clock in late, and you get the punctuality lesson. [[stage restore HR Competency]] [[stage devices]] [[phone board Personal Board]] [[phone open HR Competency]] [[phone claim]]",
    "In this test, I'll answer the discrimination question wrong, [[phone answer 1 wrong]] the gift policy wrong, [[phone answer 2 wrong]] and the break policy right. [[phone answer 3 right]] [[phone close]]",
    "I failed, so the trainings I missed were assigned to me automatically. [[phone point assigned]] You fill knowledge gaps and put people to work faster, without long trainings. [[phone back]]",
    "We also do target range training: no video, just, which outfit follows the dress code? [[phone open Office Attire]] Answer wrong, and it sends you back until it sticks. [[phone back]]",
  ] },
  { id: 'risk', title: 'Risk Detection', steps: [
    "Next, risk. Instead of wondering whether you have a problem, you automate a survey, say once a month. [[stage restore Discrimination Survey]] [[tablet board Human Resources Tickets]] [[phone board Personal Board]] [[phone open Discrimination Survey]] [[phone claim]]",
    "Because it's a sensitive subject, there's a training first. [[phone lesson]] Have you been discriminated against? Let's say yes. [[phone answer 2 Yes]] [[phone answer 3 No]] [[phone close]]",
    "And on the Human Resources Tickets board, a Discrimination Alert, instantly. [[tablet point Discrimination Alert]] Same mechanism as before: someone takes it and resolves it.",
  ] },
  { id: 'library', title: 'Knowledge Library & Marketplace', steps: [
    "Organizations need a place to store what they learn, so tomorrow's people don't make yesterday's mistakes. [[stage web]] [[web library]] This is the library: folders of missions, checklists, surveys and trainings. Knowledge that is ready to deploy.",
    "For consultants and franchisors, there's the marketplace. [[web marketplace]] You publish your standards once, every location imports them, [[web catalog QSR]] and when you edit them here, they're updated for everybody.",
  ] },
  { id: 'automation', title: 'Automated Processes', steps: [
    "We also build automated processes. [[web process Econocore]] Based on how you answer, it goes to this branch or to that branch. A training can trigger a task, a task a training, a survey a checklist. Anything can be planned.",
  ] },
  { id: 'builder', title: 'Build It Yourself', steps: [
    "We configure everything for you, but you can also do it yourself. [[web create Checklist]] This is the title, [[web type field=title; text=Guest Area Sanitize]] and you see it live on the phone preview, exactly how your staff will see it.",
    "Editing an existing mission is just as simple. [[web edit Lobby Restroom Clean]] And each mission has its settings: alert tickets if it stays open too long, automatic prioritization, and the timer colors, green, orange and red.",
  ] },
  { id: 'pricing', title: 'Pricing & Service', steps: [
    "[[stage all]] Finally, the investment. A team board is sixty dollars a month per team, with unlimited people on the team. Personal boards, for training, surveys and tests, are three dollars per person per month.",
    "And we are a service powered by software. We configure everything for you, at no cost, from your own checklists and trainings, and we support you continuously. That's the tour. What would you like to see again, or shall we book a call with the team?",
  ] },
];

// Every word must be a "yes / go on" word (accents and Arabic vowels ignored).
const YES = new Set(`yes yeah yep yup sure ok okay alright continue go on ahead keep going next proceed please do lets let's carry sounds good of course the tour with it
  si claro continua sigue sigamos adelante dale vale por favor bueno perfecto el recorrido
  oui vas y vas-y allez continuez continue d'accord s'il te plait vous
  نعم اكمل أكمل تابع استمر حسنا أجل اجل يلا من فضلك لو سمحت طيب`.split(/\s+/));
const AGREE = /^(yes|yeah|yep|yup|sure|ok|okay|alright|continue|go|keep|next|proceed|carry|lets|let's|please|si|claro|continua|sigue|sigamos|adelante|dale|vale|oui|vas|vas-y|allez|continuez|d'accord|نعم|اكمل|أكمل|تابع|استمر|حسنا|أجل|اجل|يلا|طيب)$/;
const plain = text => String(text).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f\u064b-\u0652]/g, '').normalize('NFC');
export function isContinue(text) {
  const words = plain(text).replace(/[.!?¡¿,،؟:;"]/g, ' ').split(/\s+/).filter(Boolean);
  return words.length > 0 && words.length <= 6 && words.every(w => YES.has(w)) && words.some(w => AGREE.test(w));
}
export const continueLine = text => {
  const t = plain(text);
  if (/[\u0600-\u06ff]/.test(t)) return 'رَائِعٌ، لِنُكْمِلْ.';
  if (/\b(si|claro|continua|sigue|sigamos|adelante|dale|vale|bueno)\b/.test(t)) return 'Perfecto, sigamos.';
  if (/\b(oui|vas|allez|continuez|d'accord)\b/.test(t)) return 'Parfait, on continue.';
  return "Great, let's continue.";
};

// What the AI needs to know about the tour when the visitor interrupts it.
export function tourContext(tour) {
  if (!tour || tour.status === 'idle') return '';
  const n = TOUR.length;
  const current = TOUR[tour.chapter];
  const chapters = TOUR.map((c, i) => `${i + 1}. ${c.title}`).join('; ');
  const where = tour.status === 'done' ? 'The guided tour is finished.'
    : `The guided tour is ${tour.status === 'playing' ? 'playing' : 'PAUSED because the visitor spoke'} at chapter ${tour.chapter + 1} of ${n}: "${current?.title}".`;
  return `GUIDED TOUR: ${where} Chapters: ${chapters}.
- Answer the visitor's question or comment first (briefly, you may show things on screen).
- While the tour is paused, END every answer by asking whether to continue the tour (in their language), e.g. "Shall I continue the tour?" — except in a reply where you use [[stage industry …]]: its screen update comes next, so don't ask then.
- When they agree (yes, continue, go on, sure…), your ENTIRE reply is a transition of a few words plus [[tour continue]], e.g. "Great, let's continue. [[tour continue]]". NEVER narrate, summarize or demo the next part of the tour yourself — the tour script does that.
- If they ask for a specific topic that is a chapter, you can jump: [[tour chapter 8]]. If they want to stop the tour and just talk, use [[tour stop]]; to start it again from the beginning, [[tour start]].`;
}
