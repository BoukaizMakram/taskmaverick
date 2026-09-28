// Local fixtures and behavior for the Overview replica. No live API calls.
export const BOARDS = ['Team Board', 'Personal Board', 'Unit Ticket Board', 'Organization Ticket Board', 'Process', 'Course', 'Certification'];
export const VIEWS = ['History', 'Running', 'Scheduled', 'Timeline'];
export const viewsForBoard = board => board === 'Certification' ? ['Overview'] : board === 'Process' ? ['History','Running','Deployed'] : board === 'Course' ? ['History','Running','Scheduled'] : board.includes('Ticket') ? ['History','Running'] : VIEWS;
export const defaultGroup = board => ['Personal Board','Course','Certification'].includes(board) ? 'Person' : board === 'Process' ? 'Process' : board === 'Organization Ticket Board' ? 'Group' : 'Unit';
export const TYPES = ['Task', 'Checklist', 'Survey', 'Media', 'Test', 'Audit'];
export const EMPTY_FILTER = { unit:'', team:'', role:'', position:'', tag:'', person:'', category:'', missionTag:'', type:'', name:'', status:'', course:'', process:'', ticketBoard:'', certificate:'' };
const columns = entries => entries.map(([key,label,width]) => ({key,label,width}));
export const COLUMNS = columns([
  ['name','Name',500], ['position','Position',200], ['ref','Reference',200], ['state','Activity',180],
  ['triggered','Triggered at',190], ['by','Claimed By',160], ['open','Open',140], ['claimed','Claimed',140],
  ['duration','Duration',150], ['closed','Closed At',190], ['type','Type',140], ['folder','Folder',180],
  ['process','Process',180], ['course','Course',180], ['next','Next Run',190],
]);
export const SCHEDULE_COLUMNS = columns([
  ['name','Name',500], ['position','Positions',200], ['type','Type',130], ['scheduleState','Status',130],
  ['start','Start',140], ['end','End',150], ['today','Today',110], ['week','Next 7 Days',130],
  ['month','Next 30 Days',130], ['quarter','Next 90 Days',130], ['year','Next 365 Days',140], ['folder','Folder',180],
]);
export function columnsForBoard(board,view) {
  if(board.includes('Ticket')) return [COLUMNS[0],...columns([['source','Source',200],['sourceType','Source Type',180],['triggeredBy','Triggered By',190]]),...COLUMNS.filter(c=>['state','triggered','by','open','claimed','duration','closed','type'].includes(c.key))];
  if(board==='Process') return columns([['name','Name',500],['ref','Reference',200],['destination','Destination Type',170],['unit','Unit',200],['team','Team',200],['person','Person',180],['ticketBoard','Ticket Board',170],['level','Level',100],['type','Type',150],['state','Activity',160]]);
  if(board==='Certification') return [COLUMNS[0],COLUMNS[3],{key:'grade',label:'Grade',width:130},...COLUMNS.filter(c=>['triggered','by','open','claimed','duration','closed'].includes(c.key))];
  if(board==='Course'&&view!=='Scheduled') return [...COLUMNS.filter(c=>['name','ref','state','triggered','open','claimed','duration','closed','type'].includes(c.key)),COLUMNS[1]];
  return (view==='Scheduled'?SCHEDULE_COLUMNS:COLUMNS).filter(c=>board==='Personal Board'||board==='Course'?c.key!=='by':c.key!=='position');
}
export function formatTimer(seconds) {
  const total = Math.max(0,Math.floor(seconds)), days = Math.floor(total/86400);
  return `${days ? `${days}d  ` : ''}${[Math.floor(total/3600)%24,Math.floor(total/60)%60,total%60].map(n=>String(n).padStart(2,'0')).join(':')}`;
}
export const dateLabel = value => value ? new Date(value).toLocaleString('en-US',{month:'2-digit',day:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '';
export const localDate = value => { const d = new Date(value); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
export const dateOnly = value => value ? new Date(`${value.slice(0,10)}T12:00:00`).toLocaleDateString('en-US') : '';
export function counters(row,now) {
  const elapsed = Math.max(0,Math.floor((now-row.clockAt)/1000));
  const open = row.open+(['Open','Not Resolved'].includes(row.state)?elapsed:0), claimed = row.claimed+(row.state==='Claimed'?elapsed:0);
  return {open,claimed,duration:open+claimed};
}
export function changeMissions(rows,ids,action,now,payload={}) {
  return rows.map(row=>{
    if (!ids.includes(row.id)) return row;
    const frozen = {...row,...counters(row,now),clockAt:now};
    switch(action) {
      case 'boost': return {...row,boosted:!row.boosted};
      case 'cancel': return ['Closed','Canceled'].includes(row.state)?row:{...frozen,state:'Canceled',closed:new Date(now).toISOString()};
      case 'bounce': return row.state!=='Claimed'?row:{...frozen,state:'Open',by:''};
      case 'assign': return {...row,board:'Personal Board',person:payload.person,by:row.state==='Claimed'?payload.person:row.by};
      case 'claim': return row.state!=='Open'?row:{...frozen,state:'Claimed',by:row.person||'James Miller'};
      case 'close': return row.state!=='Claimed'?row:{...frozen,state:'Closed',closed:new Date(now).toISOString()};
      case 'resolve': return {...frozen,state:'Closed',closed:new Date(now).toISOString(),by:'James Miller'};
      case 'schedule': return {...row,schedule:payload};
      case 'stop': return {...frozen,state:'Canceled',closed:new Date(now).toISOString(),schedule:{...row.schedule,enabled:false}};
      case 'content': return {...row,...payload};
      default: return row;
    }
  });
}
// Times a scheduled mission runs on a matching day: Once (its start time), a
// Time period (every N hours between start and end) or At Specific Times.
export function runTimes(s) {
  if(s.frequency==='At Specific Times') return (s.times||[]).length?s.times:[s.time];
  if(s.frequency!=='Time period') return [s.time];
  const toMin=t=>{const [h,m]=t.split(':').map(Number);return h*60+m;}, step=Math.max(15,Number(s.everyHours||1)*60), list=[];
  for(let m=toMin(s.time);m<=toMin(s.endTime||'23:59');m+=step) list.push(`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`);
  return list.slice(0,48);
}
export function occurrences(row,from,days=1) {
  const s=row.schedule; if(!s?.enabled) return [];
  const start=new Date(`${s.start}T00:00:00`), result=[];
  for(let i=0;i<days;i++) {
    const date=new Date(`${from}T00:00:00`); date.setDate(date.getDate()+i);
    if(date<start || (s.end && date>new Date(`${s.end}T23:59:59`))) continue;
    const diff=Math.round((date-start)/86400000), months=(date.getFullYear()-start.getFullYear())*12+date.getMonth()-start.getMonth(), every=Math.max(1,Number(s.every));
    const matches=s.repeat==='Once'?diff===0:s.repeat==='Daily'?diff%every===0:s.repeat==='Weekly'?diff%(7*every)===0:months%every===0&&s.days.includes(date.getDate());
    if(matches) for(const time of runTimes(s)) { const at=new Date(date); at.setHours(...time.split(':').map(Number),0,0); result.push(at); }
  }
  return result;
}
export function filterMissions(rows,{board,view,filters=EMPTY_FILTER,boosted=false,idle=false,search='',from='',to=''}) {
  return rows.filter(row=>{
    if(row.board!==board || (boosted&&!row.boosted)) return false;
    if(view==='History' && (!['Closed','Canceled'].includes(row.state)||(from&&localDate(row.closed)<from)||(to&&localDate(row.closed)>to))) return false;
    if(['Scheduled','Timeline','Deployed'].includes(view)&&!row.schedule?.enabled&&!idle) return false;
    if(board==='Certification'&&!idle&&row.closed&&((from&&localDate(row.closed)<from)||(to&&localDate(row.closed)>to))) return false;
    if(search&&![row.name,row.person,row.team,row.ref].join(' ').toLowerCase().includes(search.toLowerCase())) return false;
    return Object.entries(filters).every(([key,value])=>!value||(key==='name'?row.name.toLowerCase().includes(value.toLowerCase()):String(row[key==='status'?'state':key]||'')===value));
  });
}
export function groupMissions(rows,groupBy,board) {
  if(groupBy==='None') return [{key:'all',label:'',rows}];
  const key={Person:'person',Unit:'unit',Mission:'name',Status:'state',Team:'team',Type:'type',Process:'process',Group:'ticketBoard'}[groupBy], groups=new Map();
  rows.forEach(row=>{const label=row[key]||'Unassigned'; if(!groups.has(label)) groups.set(label,[]); groups.get(label).push(row);});
  return [...groups].map(([label,items])=>{
    const children=new Map();
    if(['Person','Unit'].includes(groupBy)) items.forEach(row=>{const child=board==='Course'?row.course:board==='Personal Board'?(row.unit==='Organization'?'Organization Missions':`${row.unit} - ${row.team}`):row.team;
      if(!children.has(child)) children.set(child,[]); children.get(child).push(row);});
    return {key:label,label,rows:items,children:[...children].map(([name,members])=>({key:`${label}/${name}`,label:name,rows:members}))};
  });
}
export function csvText(rows,cols,value) {
  const quote=value=>{let text=String(value??''); if(/^[=+@\-\t\r]/.test(text))text=`'${text}`;return `"${text.replaceAll('"','""')}"`;};
  return [cols.map(c=>c.label),...rows.map(row=>cols.map(c=>value(row,c.key)))].map(row=>row.map(quote).join(',')).join('\r\n');
}
export function seedMissions(now = Date.now()) {
  let id = 0;
  const today = localDate(now);
  const checklist = labels => labels.map(label => ({ label, done: false }));
  const make = (name, patch = {}) => {
    const row = {
      id: `mission-${++id}`, name, board: 'Personal Board', person: 'James Miller',
      position: 'Team Member', unit: 'Main Location', team: 'Operations', role: 'Team Member',
      tag: 'Daily Work', missionTag: 'Routine', category: 'General', ref: '', state: 'Open',
      by: '', type: 'Task', folder: 'Daily Tasks', process: '', course: '', boosted: false,
      closed: '', open: 300 + id * 90, claimed: 0, clockAt: now,
      description: 'Complete the task and confirm that everything is ready.', notes: '', checks: [],
      schedule: { enabled: true, start: today, end: '', repeat: 'Daily', every: 1, time: '09:00', days: [] },
      ...patch,
    };
    row.triggered = new Date(now - (row.open + row.claimed) * 1000).toISOString();
    return row;
  };
  const people = [
    ['James Miller', 'Operations'], ['Emily Carter', 'Support'],
    ['Michael Davis', 'Operations'], ['Sarah Wilson', 'Administration'],
  ];
  const rows = people.flatMap(([person, team], index) => [
    make('Review daily tasks', { person, team, boosted: index === 0,
      description: 'Review your task list and identify what needs to be done today.' }),
    make('Check supplies', { person, team, type: 'Checklist', ref: 'Shared Supplies',
      description: 'Check the shared supplies and note anything that needs to be replaced.',
      checks: checklist(['Check available supplies', 'List missing items', 'Confirm the area is organized']) }),
    make('Update task status', { person, team, state: index < 2 ? 'Claimed' : 'Open',
      by: index < 2 ? person : '', claimed: index < 2 ? 120 + index * 60 : 0,
      description: 'Update the status of your current work and note any delays.' }),
    make('Tidy work area', { person, team, type: 'Checklist',
      description: 'Put shared items away and leave your work area ready to use.',
      checks: checklist(['Put items in their place', 'Clear the work surface', 'Check that the area is ready']) }),
    make('Share a team update', { person, team,
      description: 'Write a short update on completed work and anything the team needs to know.' }),
  ]);
  const teamTasks = ['Check work area', 'Review daily tasks', 'Check supplies', 'Update task list',
    'Report an issue', 'Review team notes', 'Prepare for handoff', 'Organize shared files',
    'Confirm task completion', 'Complete end-of-day check'];
  teamTasks.forEach((name, index) => rows.push(make(name, {
    board: 'Team Board', person: '', unit: index < 4 ? 'Main Location' : 'West Location',
    team: index < 4 ? 'Operations' : 'Support', position: '',
    type: index % 3 === 0 ? 'Checklist' : 'Task', state: index > 6 ? 'Closed' : 'Open',
    closed: index > 6 ? new Date(now).toISOString() : '', by: index > 6 ? people[index % people.length][0] : '',
    open: 240 + index * 120, claimed: index > 6 ? 180 : 0, boosted: index === 0,
    checks: index % 3 === 0 ? checklist(['Review the area', 'Complete any needed tasks', 'Confirm everything is ready']) : [],
    schedule: index === 1 ? { enabled: true, start: today, end: '', repeat: 'Daily', every: 1, frequency: 'Time period', everyHours: 3, time: '08:30', endTime: '17:45', days: [] }
      : index === 5 ? { enabled: true, start: today, end: '', repeat: 'Daily', every: 1, frequency: 'At Specific Times', times: ['10:00', '14:00', '18:00'], time: '10:00', days: [] }
      : { enabled: true, start: today, end: '', repeat: 'Daily', every: 1, time: `${String(8 + index).padStart(2, '0')}:00`, days: [] },
  })));
  // What performers answered (History / Running → Response tab), with photo proof.
  const proof = name => `/demo-quality/proofs/${name}.jpg`;
  const answered = (statements, photos = []) => statements.map((statement, i) => ({ statement, type: 'Yes or No', response: 'Yes', photo: photos[i] ? proof(photos[i]) : '' }));
  rows.filter(row => row.board === 'Team Board' && row.state === 'Closed').forEach((row, i) => {
    row.responses = answered(['Did you check the work area?', 'Is the area clean and ready for the next shift?', 'Take a photo of the finished area.'], [null, i % 2 ? 'storage-shelves' : 'restroom-sinks', i % 2 ? 'storage-containers' : 'restroom-vanity']);
  });
  // Completed micro-trainings on the Personal Board (History): audio, image, quiz.
  people.forEach(([person, team], index) => {
    [['Punctuality', 44], ['Company Culture', 27]].forEach(([name, seconds], j) => {
      const closedAt = now - (index * 3 + j + 1) * 600000;
      const row = make(name, { person, team, type: 'Media', state: 'Closed', by: person, unit: 'Organization', open: 600 + index * 120, claimed: seconds, clockAt: now,
        closed: new Date(closedAt).toISOString(), folder: 'Training', tag: 'Training', category: 'HR',
        description: 'Please listen or read carefully. This lesson will repeat until you pass the Quiz.',
        content: { audio: name === 'Punctuality' ? 'You are an important member of our team. Your punctuality is important to the stability of the business. Please plan to arrive to work on time.' : 'We win as a team. Help a coworker who is behind, and speak up when something is not right.', seconds, image: proof(j ? 'storage-shelves' : 'restroom-vanity'), quiz: ['Arriving on time is only necessary when the store is busy. — False', 'Being ready to work at your start time is part of punctuality. — True'] },
        responses: [{ statement: 'Arriving on time is only necessary when the store is busy.', type: 'True or False', response: 'False' }, { statement: 'Being ready to work at your start time is part of punctuality.', type: 'True or False', response: 'True' }] });
      row.triggered = new Date(closedAt - (row.open + row.claimed) * 1000).toISOString();
      rows.push(row);
    });
  });
  const noSchedule = { enabled: false, start: today, end: '', repeat: 'Once', every: 1, time: '09:00', days: [] };
  rows.push(make('Supply request', { board: 'Unit Ticket Board', unit: 'Main Location', team: 'Support',
    ticketBoard: 'Location Requests', source: 'Check supplies', sourceType: 'Checklist',
    triggeredBy: 'Emily Carter', state: 'Not Resolved', open: 900, schedule: { ...noSchedule },
    description: 'Review the requested supplies and arrange a replacement.' }));
  rows.push(make('Help request', { board: 'Organization Ticket Board', unit: 'Organization', team: 'Support',
    ticketBoard: 'General Requests', source: 'Report an issue', sourceType: 'Task',
    triggeredBy: 'Michael Davis', open: 600, schedule: { ...noSchedule },
    description: 'Review the reported issue and help the team resolve it.' }));
  [
    ['Daily Setup', 'Check work area', 'Operations'],
    ['Team Handoff', 'Share a team update', 'Support'],
    ['Daily Wrap-Up', 'Confirm task completion', 'Administration'],
  ].forEach(([process, name, team]) => rows.push(make(name, {
    board: 'Process', process, team, person: '', destination: 'Team Board', level: '1.1',
    ticketBoard: '', type: 'Checklist', checks: checklist(['Review the task', 'Complete the work', 'Confirm the result']),
  })));
  ['Review team guidelines', 'Find shared resources', 'Practice updating a task', 'Complete the introduction'].forEach(name => rows.push(make(name, {
    board: 'Course', course: 'Getting Started', person: 'Sarah Wilson', team: 'Administration',
    type: 'Task', folder: 'Team Basics',
    description: 'Review this step and confirm that you understand what to do.',
  })));
  return rows;
}
