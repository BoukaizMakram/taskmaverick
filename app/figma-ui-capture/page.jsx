import { notFound } from 'next/navigation';
import PhoneMissions from '@/components/PhoneMissions';
import TabletMissions from '@/components/TabletMissions';
import OverviewBoard from '@/components/OverviewBoard';
import OpenedMissionPhone from '@/components/OpenedMission';
import { OPENED_MISSIONS } from '@/lib/openedMissions';

export default function CapturePage() {
  if (process.env.NODE_ENV === 'production') notFound();
  const start = [
    ['Freddy Espain','00:16:29','orange','00:12:51','red','00:29:20'],
    ['Lisa Chang','00:22:40','red','00:10:51','green','00:33:31'],
    ['Freddy Espain','00:04:01','green','00:06:09','green','00:10:11'],
    ['Amy Sanchez','00:05:40','green','00:12:43','green','00:10:11'],
    ['George Davis','00:01:13','green','00:13:31','green','00:14:54'],
    ['Lisa Chang','00:16:29','orange','00:12:51','red','00:39:20'],
    ['Freddy Espain','00:05:29','green','00:30:51','red','00:36:20'],
    ['Amy Sanchez','00:01:30','green','00:12:20','orange','00:13:50'],
  ];
  const rows = start.map(([by,o,ot,c,ct,d])=>({mission:'Checklist',by,open:{disp:o,tone:ot},claimed:{disp:c,tone:ct},duration:{disp:d,tone:'gray'}}));
  const title = {fontFamily:'var(--font-inter)',fontSize:26,fontWeight:600,color:'#182434',margin:'0 0 28px'};
  return <>
    <script src="https://mcp.figma.com/mcp/html-to-design/capture.js" async />
    <main id="website-ui-assets" style={{width:1800,padding:64,background:'#eef1f5',display:'flex',flexDirection:'column',gap:80}}>
      <h1 style={{...title,fontSize:40}}>Website UI — animation assets</h1>
      <div style={{display:'flex',gap:64,alignItems:'flex-start'}}>
        <section style={{width:430,flexShrink:0}}><h2 style={title}>Mobile · Personal Board</h2><PhoneMissions /></section>
        <section style={{width:1174,flexShrink:0}}><h2 style={title}>Team Board · Missions</h2><TabletMissions /></section>
      </div>
      <div style={{display:'flex',gap:100,alignItems:'flex-start'}}>
        <section style={{width:900,flexShrink:0}}><h2 style={title}>Overview Board</h2><OverviewBoard rows={rows}/></section>
        <section style={{width:550}}><h2 style={title}>Timers · aging states</h2>
          <div style={{display:'flex',flexDirection:'column',gap:40}}>
            {[['Green','#007a33','00:04:01'],['Orange','#bd4b00','00:16:29'],['Red','#bd1f59','00:22:40'],['Closed','#686f76','00:29:20']].map(([name,color,time])=><div key={name} style={{display:'flex',alignItems:'center',gap:40,fontFamily:'var(--font-poppins)'}}><span style={{width:100,fontSize:20}}>{name}</span><span className="chip-pill" style={{background:color,transform:'scale(2)',transformOrigin:'left center'}}>{time}</span></div>)}
          </div>
        </section>
      </div>
      <section><h2 style={title}>Mission Details · Task / Checklist / Media / Survey / Test / Audit</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3, 440px)',gap:'60px 90px'}}>
          {OPENED_MISSIONS.map(m=><figure key={m.id} style={{margin:0}}><h3 style={{...title,fontSize:22}}>{m.type}</h3><OpenedMissionPhone mission={{...m,initialState:'claimed'}}/></figure>)}
        </div>
      </section>
    </main>
  </>;
}
