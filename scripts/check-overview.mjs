import assert from 'node:assert/strict';
import { seedMissions, counters, changeMissions, occurrences, filterMissions, groupMissions, csvText, formatTimer } from '../lib/overviewModel.mjs';

const now = new Date('2026-09-21T12:00:00').getTime();
const rows = seedMissions(now);
const row = rows.find(row => row.state === 'Open');
const claimed = changeMissions(rows, [row.id], 'claim', now + 5000).find(item => item.id === row.id);
assert.equal(claimed.open, row.open + 5);
assert.equal(counters(claimed, now + 15000).open, row.open + 5);
assert.equal(counters(claimed, now + 15000).claimed, 10);
const closed = changeMissions([claimed], [row.id], 'close', now + 15000)[0];
assert.deepEqual(counters(closed, now + 60000), counters(closed, now + 15000));
assert.equal(changeMissions([closed], [row.id], 'claim', now + 20000)[0], closed);
assert.equal(changeMissions(rows, [row.id], 'boost', now)[1], rows[1]);
const bounced = changeMissions([claimed], [row.id], 'bounce', now + 10000)[0];
assert.equal(bounced.state, 'Open');
assert.equal(bounced.by, '');
assert.equal(counters(bounced, now + 12000).open, row.open + 7);
assert.equal(formatTimer(90061), '1d  01:01:01');

const checklist = filterMissions(rows, {board:'Personal Board',view:'Running',filters:{type:'Checklist'}});
assert.ok(checklist.length > 0);
assert.ok(checklist.every(row => row.type === 'Checklist' && row.board === 'Personal Board'));
const history = filterMissions(rows, {board:'Team Board',view:'History',from:'2026-09-21',to:'2026-09-21'});
assert.equal(history.length, 3);
assert.equal(filterMissions(rows, {board:'Team Board',view:'History',from:'2026-09-22',to:'2026-09-22'}).length, 0);
const grouped = groupMissions(checklist, 'Person', 'Personal Board');
assert.equal(grouped.reduce((sum,g) => sum+g.rows.length,0), checklist.length);
assert.equal(grouped.flatMap(g=>g.children.flatMap(c=>c.rows)).length, checklist.length);

const scheduled = {...row,schedule:{enabled:true,start:'2026-09-21',end:'2026-09-24',repeat:'Daily',every:2,time:'09:30',days:[]}};
assert.deepEqual(occurrences(scheduled,'2026-09-21',7).map(d=>d.getDate()), [21,23]);
assert.equal(occurrences({...scheduled,schedule:{...scheduled.schedule,enabled:false}},'2026-09-21',7).length,0);
assert.equal(occurrences({...scheduled,schedule:{...scheduled.schedule,end:'',repeat:'Monthly On Days',every:1,days:[31]}},'2026-10-01',61).length,1);
assert.equal(occurrences({...scheduled,schedule:{...scheduled.schedule,repeat:'Once'}},'2026-09-22',7).length,0);
assert.equal(csvText([{name:'=SUM(A1)',notes:'A "quoted", value'}],[{key:'name',label:'Name'},{key:'notes',label:'Notes'}],(row,key)=>row[key]), '"Name","Notes"\r\n"\'=SUM(A1)","A ""quoted"", value"');
console.log('Overview checks passed: lifecycle, frozen timers, filtering, history, grouping, recurrence, and CSV export.');
