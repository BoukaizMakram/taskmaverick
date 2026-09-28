// Live Oversight demo data: the Overview board (Team Board · Running and
// History), today's Storage Room Check with its proofs and measurements, and
// the Data Board report. People, units and missions follow the Overview
// replica (/running); everything is industry-neutral.

// The storage area over the report's week (09/22 – 09/28/2026), one photo a
// day. Public domain / CC0 (free for commercial use, no attribution required),
// found via Openverse and self-hosted by scripts/fetch-proof-images.mjs.
export const STORAGE_PHOTOS=[
 {name:'storage-day-1',date:'09/22/2026',alt:'Storage area: tall pallet racking aisle',url:'https://live.staticflickr.com/65535/54083173704_98953e3aa8_b.jpg',license:'pdm',creator:'USDAgov',source:'https://www.flickr.com/photos/41284017@N08/54083173704'},
 {name:'storage-day-2',date:'09/23/2026',alt:'Storage area: stacked pallets of goods',url:'https://live.staticflickr.com/65535/54081963337_0865eee420_b.jpg',license:'pdm',creator:'USDAgov',source:'https://www.flickr.com/photos/41284017@N08/54081963337'},
 {name:'storage-day-3',date:'09/24/2026',alt:'Storage area: racking with pallets',url:'https://live.staticflickr.com/65535/54082844741_d8361a721c_b.jpg',license:'pdm',creator:'USDAgov',source:'https://www.flickr.com/photos/41284017@N08/54082844741'},
 {name:'storage-day-4',date:'09/25/2026',alt:'Storage area: pallet moved along the aisle',url:'https://live.staticflickr.com/65535/51722994469_06504e7570_b.jpg',license:'pdm',creator:'USDAgov',source:'https://www.flickr.com/photos/41284017@N08/51722994469'},
 {name:'storage-day-5',date:'09/26/2026',alt:'Storage area: racking filled with boxes',url:'https://images.rawpixel.com/editor_1024/czNmcy1wcml2YXRlL3Jhd3BpeGVsX2ltYWdlcy93ZWJzaXRlX2NvbnRlbnQvbHIvZnJsb2dpc3RpY3NfODUyOTM3LWltYWdlLWt5Y2dmZGM0LmpwZw.jpg',license:'cc0',creator:'',source:'https://www.rawpixel.com/image/6057556/free-public-domain-cc0-photo'},
 {name:'storage-day-6',date:'09/27/2026',alt:'Storage area: receiving floor',url:'https://live.staticflickr.com/65535/51968043190_321ed7060b_b.jpg',license:'pdm',creator:'GlacierNPS',source:'https://www.flickr.com/photos/43288043@N04/51968043190'},
 {name:'storage-day-7',date:'09/28/2026',alt:'Storage area: boxes staged in the aisle',url:'https://live.staticflickr.com/65535/51723214455_3ace44ceeb_b.jpg',license:'pdm',creator:'USDAgov',source:'https://www.flickr.com/photos/41284017@N08/51723214455'},
];
// Today's other angles of the storage room (shown in the photo viewer).
export const STORAGE_TODAY=[
 {name:'storage-today-2',alt:'Storage room today: pallet jack in the aisle',url:'https://live.staticflickr.com/65535/51721529442_4ede2d8f0b_b.jpg',license:'pdm',creator:'USDAgov',source:'https://www.flickr.com/photos/41284017@N08/51721529442'},
 {name:'storage-today-3',alt:'Storage room today: the loading door',url:'https://live.staticflickr.com/65535/51721526592_8759e42267_b.jpg',license:'pdm',creator:'USDAgov',source:'https://www.flickr.com/photos/41284017@N08/51721526592'},
 {name:'storage-today-4',alt:'Storage room today: labeled shelves',url:'https://live.staticflickr.com/65535/54081966352_ccd33a83e5_b.jpg',license:'pdm',creator:'USDAgov',source:'https://www.flickr.com/photos/41284017@N08/54081966352'},
];
export const storageSrc=name=>`/demo-quality/proofs/${name}.jpg`;

// ---- Overview · Team Board · Running (Group by: Unit) ----------------------
// Ages are seconds at the start of the film; open/claimed timers tick in real
// time from there. Colors follow the Overview's rule (red > 30 min, orange >
// 10 min, else green), chosen so no pill changes color during the film.
const R=(name,state,patch={})=>({name,state,ref:'',type:'Task',open:0,claimed:0,by:'',closed:'',triggered:'',...patch});
export const RUNNING=[
 {unit:'Main Location',teams:[
  {team:'Operations',rows:[
   R('Check work area','Open',{open:190,triggered:'09/28/2026, 10:09 AM',type:'Checklist'}),
   R('Review daily tasks','Open',{open:340,triggered:'09/28/2026, 10:06 AM'}),
   R('Check supplies','Claimed',{open:725,claimed:260,by:'James Miller',triggered:'09/28/2026, 09:55 AM',ref:'Shared Supplies',type:'Checklist'}),
   R('Receive deliveries','Closed',{open:372,claimed:1120,by:'James Miller',triggered:'09/28/2026, 09:20 AM',closed:'09/28/2026, 09:45 AM'}),
  ]},
  {team:'Support',rows:[
   R('Restock break room','Open',{open:1590,triggered:'09/28/2026, 09:46 AM'}),
   R('Update task list','Claimed',{open:560,claimed:130,by:'Emily Carter',triggered:'09/28/2026, 10:01 AM'}),
   R('Report an issue','Open',{open:2835,triggered:'09/28/2026, 09:25 AM'}),
  ]},
 ]},
 // West Location: one long Operations list, newest first. 4 open missions
 // (timers running, green), 4 claimed (green, running), then the completed
 // ones: gray durations, claimed times orange, the last one red. Values keep
 // every pill its color for the whole film.
 {unit:'West Location',anchor:true,teams:[
  {team:'Operations',rows:[
   R('Check equipment','Open',{open:190,triggered:'09/28/2026, 10:07 AM'}),
   R('Review daily tasks','Open',{open:260,triggered:'09/28/2026, 10:06 AM'}),
   R('Check work area','Open',{open:335,triggered:'09/28/2026, 10:05 AM',type:'Checklist'}),
   R('Prepare for handoff','Open',{open:410,triggered:'09/28/2026, 10:03 AM'}),
   R('Tidy work area','Claimed',{open:215,claimed:95,by:'Michael Davis',triggered:'09/28/2026, 10:00 AM',type:'Checklist'}),
   R('Clean customer area','Claimed',{open:340,claimed:170,by:'Sarah Wilson',triggered:'09/28/2026, 09:58 AM'}),
   R('Update task list','Claimed',{open:150,claimed:245,by:'James Miller',triggered:'09/28/2026, 09:56 AM'}),
   R('Restock supplies','Claimed',{open:420,claimed:310,by:'Emily Carter',triggered:'09/28/2026, 09:54 AM',type:'Checklist'}),
   R('Storage Room Check','Closed',{id:'storage',open:270,claimed:708,by:'Emily Carter',triggered:'09/28/2026, 09:35 AM',closed:'09/28/2026, 09:51 AM',type:'Checklist',ref:'Storage Room'}),
   R('Confirm task completion','Closed',{open:160,claimed:655,by:'Sarah Wilson',triggered:'09/28/2026, 09:30 AM',closed:'09/28/2026, 09:44 AM'}),
   R('Organize shared files','Closed',{open:355,claimed:820,by:'James Miller',triggered:'09/28/2026, 09:14 AM',closed:'09/28/2026, 09:34 AM'}),
   R('Complete opening check','Closed',{open:300,claimed:2150,by:'Michael Davis',triggered:'09/28/2026, 07:55 AM',closed:'09/28/2026, 08:36 AM',type:'Checklist'}),
  ]},
 ]},
];

// ---- Today's Storage Room Check (the detail panel, Response tab) -------------
// One card per checkpoint: the question, its type, and the response (with its
// photo or video proofs). The three number cards are the collected data.
export const DETAIL={
 name:'Storage Room Check',chips:['Operations','West Location','L002 - West Location'],performer:'Emily Carter',
 checkpoints:['Is the storage room organized?','Is the loading door working properly?'],
 responses:[
  {key:'photo',question:'Is the storage room organized?',type:'Yes or No',value:'Yes',proof:{kind:'photo',count:4}},
  {key:'video',question:'Is the loading door working properly?',type:'Yes or No',value:'Yes',proof:{kind:'video',count:1}},
  {key:'height',question:'Height (cm)',type:'Number',value:'178'},
  {key:'width',question:'Width (cm)',type:'Number',value:'120'},
  {key:'length',question:'Length (cm)',type:'Number',value:'101'},
 ],
 photos:[{name:'storage-day-7',file:'Photo 9/28/2026 at 9:47:12 AM.jpg'},{name:'storage-today-2',file:'Photo 9/28/2026 at 9:47:31 AM.jpg'},{name:'storage-today-3',file:'Photo 9/28/2026 at 9:47:58 AM.jpg'},{name:'storage-today-4',file:'Photo 9/28/2026 at 9:48:20 AM.jpg'}],
 video:{file:'Video 9/28/2026 at 9:49:30 AM.mp4'},
};

// ---- Overview · Team Board · History (09/22 – 09/28/2026) --------------------
const PEOPLE=['Emily Carter','James Miller','Michael Davis','Sarah Wilson'];
const H=(name,day,i,patch={})=>({name,unit:'West Location',team:'Operations',state:'Closed',ref:'',type:'Checklist',opened:`09/${String(21+day).padStart(2,'0')}/2026, 09:${String(30+i).padStart(2,'0')} AM`,closed:`09/${String(21+day).padStart(2,'0')}/2026, 09:${String(46+i).padStart(2,'0')} AM`,by:PEOPLE[(day+i)%4],open:180+day*23+i*11,claimed:540+day*37+i*19,...patch});
export const HISTORY=[
 ...Array.from({length:7},(_,d)=>H('Storage Room Check',d+1,0,{ref:'Storage Room',photo:STORAGE_PHOTOS[d].name,day:d})),
 ...[1,3,5].map((d,i)=>H('Check supplies',d,2+i,{unit:'Main Location',ref:'Shared Supplies'})),
 ...[2,4,6].map((d,i)=>H('Tidy work area',d,3+i)),
];
// The Overview's History view, grouped by unit (then team).
export function historyByUnit(){
 const groups=new Map();
 for(const row of HISTORY){if(!groups.has(row.unit))groups.set(row.unit,[]);groups.get(row.unit).push(row);}
 return [...groups].map(([label,rows])=>({label,children:[{label:rows[0].team,rows}]}));
}

// ---- Usage Report (chapters 16-20) -----------------------------------------------
// One response per run and proof checkpoint (the report's filter: Proof = Photo
// or Video), grouped on demand by unit, mission, person or checkpoint.
const POSITIONS_OF={'Emily Carter':['Staff','Operations','+1'],'James Miller':['Lead','Operations','+2'],'Michael Davis':['Staff','Support','+1'],'Sarah Wilson':['Staff','Administration','+1']};
const SUPPLY_PHOTOS=['storage-containers','storage-shelves','storage-racking'];
export const RESPONSES=HISTORY.flatMap(row=>{
 const base={mission:row.name,unit:row.unit,type:row.type,person:row.by,positions:POSITIONS_OF[row.by],response:'Yes',date:row.closed};
 if(row.name==='Storage Room Check'){
  const photo=STORAGE_PHOTOS[row.day];
  // the last day's photo is where the evolution tour stops
  return [{...base,checkpoint:DETAIL.checkpoints[0],media:{kind:'photo',name:photo.name,alt:photo.alt},anchor:row.day===STORAGE_PHOTOS.length-1},{...base,checkpoint:DETAIL.checkpoints[1],media:{kind:'video'}}];
 }
 if(row.name==='Check supplies')return [{...base,checkpoint:'Take a photo of the supply shelf',media:{kind:'photo',name:SUPPLY_PHOTOS[HISTORY.filter(r=>r.name==='Check supplies').indexOf(row)]}}];
 return [];// no photo or video proof
});
const LEVELS={Unit:['unit','mission','checkpoint'],Mission:['mission','checkpoint'],Person:['person','mission','checkpoint'],Checkpoint:['checkpoint']};
export function reportTree(by){
 const build=(items,levels)=>{
  if(!levels.length)return [...items].sort((a,b)=>a.date.localeCompare(b.date)).map(r=>({leaf:true,...r}));
  const [key,...rest]=levels,groups=new Map();
  for(const r of items){if(!groups.has(r[key]))groups.set(r[key],[]);groups.get(r[key]).push(r);}
  return [...groups].map(([label,rows])=>({label,kind:key,type:key==='mission'?rows[0].type:'',children:build(rows,rest)}));
 };
 return build(RESPONSES,LEVELS[by]);
}
// The report's Group by menu (the product's menu, plus Person and Checkpoint).
export const REPORT_GROUPS=['Unit','Mission','Person','Checkpoint','Team','Status'];

// ---- Data Board (the report) -------------------------------------------------
export const REPORT={
 title:'Data Board',range:'09/22/2026 – 09/28/2026',hours:'12 AM - 12 AM',
 risk:[
  {label:'Personal Missions Posted',pct:'100%',count:'71',dot:'blue',items:[['Closed','87.3%','62','blue'],['Training Overdue','7%','05','red'],['Other Overdue','21.1%','15','red']]},
  {label:'Tickets Posted',pct:'100%',count:'76',dot:'green',items:[['Closed','71.1%','54','blue'],['Overdue','27.6%','21','red'],['Short Execution','56.6%','43','orange']]},
 ],
 unit:{code:'WL',name:'West Location'},
 mission:{total:'1617',stats:[['Closed','1512','1617','93.5%','green',true],['Running','98','1617','6.1%','red'],['Canceled','7','1617','0.4%','red'],['References','217','1617','13.4%','red'],['Short Execution','378','1617','23.4%','red'],['Overdue','220','1617','13.6%','red']]},
 ticket:{total:'76',stats:[['Closed','54','76','71.1%','blue'],['Running','22','76','28.9%','orange'],['Canceled','0','76','0%','red']]},
 summary:{total:'Total Closed: 1512 of 1617 / 93.5%',team:'1450 of 1546 / 93.8%',personal:'62 of 71 / 87.3%'},
 // Unit › team › person › missions; one mission expanded to its checkpoint table.
 unitRow:{label:'West Location',count:1,posted:71,closed:62,pct:87.32},
 teamRow:{label:'Operations',count:4,posted:71,closed:62,pct:87.32},
 person:{label:'Emily Carter',count:9,posted:32,closed:28,pct:87.5,position:'WL Staff'},
 missions:[
  ['Storage Room Check',7,7,'Checklist','Operations',true],
  ['Check work area',4,4,'Checklist','Operations'],['Receive deliveries',3,3,'Task','Operations'],
  ['Update task list',5,4,'Task','Administration'],['Tidy work area',3,3,'Checklist','Operations'],
  ['Check supplies',4,3,'Checklist','Operations'],['Report an issue',2,1,'Task','Support'],
 ],
 // STATEMENT · DIVIDER · RESPONSE · QUESTION TYPE · RESPONDED AT · TICKET TITLE · TICKET STATUS · TICKET BY
 statements:[
  {key:'height',text:'Height (cm)',divider:'Pallet Stack',responses:[['176','09/24/2026, 09:47 AM'],['212','09/26/2026, 09:49 AM','Pallet Stack Too High','Open','System'],['178','09/28/2026, 09:50 AM']]},
  {key:'width',text:'Width (cm)',divider:'-',responses:[['120','09/24/2026, 09:47 AM'],['121','09/26/2026, 09:49 AM'],['120','09/28/2026, 09:50 AM']]},
  {key:'length',text:'Length (cm)',divider:'-',responses:[['135','09/24/2026, 09:47 AM','Pallet Stack Too Long','Resolved','System'],['100','09/26/2026, 09:49 AM'],['101','09/28/2026, 09:50 AM']]},
 ],
 others:[['James Miller',11,39,33,84.6],['Michael Davis',8,36,27,75],['Sarah Wilson',6,28,14,50]],
};
