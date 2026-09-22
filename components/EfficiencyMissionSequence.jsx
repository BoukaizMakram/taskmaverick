'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import PhoneShell from './PhoneShell';
import MissionChip from './MissionChip';
import { SCENE } from '@/lib/demoNarration.mjs';

export const PHONE_START = SCENE['urgency-title'].start;
export const REWARD_START = SCENE['gamification-points'].start;
export const RETURN_START = SCENE['recognition-stamped'].start;
export const SETTLED_AT = RETURN_START + 1.65;
const clamp = p => Math.max(0, Math.min(1, p));
const ease = p => { p = clamp(p); return p*p*p*(10+p*(-15+6*p)); };
const mix = (a,b,p) => a+(b-a)*p;
const fmt = s => [Math.floor(s/3600),Math.floor(s/60)%60,Math.floor(s)%60].map(n=>String(n).padStart(2,'0')).join(':');

// One persistent set of cards travels from phone to presentation to tablet.
export default function EfficiencyMissionSequence({time, state, tablet, stage}) {
  const shell = useRef(null), cards = useRef([]);
  const active = time >= PHONE_START && time < SETTLED_AT;
  const orangeAt = SCENE['urgency-colors'].start + .25;
  const redAt = SCENE['urgency-priority'].start + .15;
  const orange = ease((time-orangeAt)/.95), red = ease((time-redAt)/.95);
  const scene = Object.values(SCENE).find(s=>time>=s.start&&time<s.end);
  const ids = ['new-sink','team-updates','sig','prep'];
  const missions = ids.map(id=>state.missions.find(m=>m.id===id));
  const returning = time >= RETURN_START;
  const reward = time >= REWARD_START;
  useEffect(()=>{
    const host=stage.current;
    if(!host) return;
    const resize=()=>host.style.setProperty('--ef-caption-size',`${18*1600/host.getBoundingClientRect().width}px`);
    resize();
    const observer=new ResizeObserver(resize);
    observer.observe(host.parentElement);
    window.addEventListener('resize',resize);
    document.addEventListener('fullscreenchange',resize);
    return ()=>{
      observer.disconnect();
      window.removeEventListener('resize',resize);
      document.removeEventListener('fullscreenchange',resize);
    };
  },[stage]);
  useLayoutEffect(()=>{
    const nodes=['sig','prep'].map(id=>tablet.current?.querySelector(`[data-mission-id="${id}"]`));
    nodes.forEach(node=>{if(node) node.style.visibility=returning&&active?'hidden':'';});
    return ()=>nodes.forEach(node=>{if(node) node.style.visibility='';});
  },[returning,active,tablet]);
  // Parent layout effects seek the tablet first, so destination measurements
  // reflect the current frame even when the playback slider jumps.
  useEffect(()=>{
    const targets = ['sig','prep'].map(id=>tablet.current?.querySelector(`[data-mission-id="${id}"]`));
    targets.forEach(node=>{ if(node) node.style.visibility = time>=RETURN_START&&time<SETTLED_AT?'hidden':''; });
    if(!shell.current || !stage.current) return;
    const intro = ease((time-PHONE_START)/1.15);
    const release = ease((time-REWARD_START)/1.05);
    gsap.set(shell.current,{opacity:active?intro*(1-release):0,scale:mix(.82,1,intro),y:mix(35,0,intro)-release*35});
    const stageRect=stage.current.getBoundingClientRect(), unit=stageRect.width/1600;
    const rows = [orange+red,1+orange+red,mix(2,0,orange)+red,mix(3,0,red)];
    cards.current.forEach((node,i)=>{
      if(!node) return;
      const phonePose={x:573,y:185+rows[i]*139,w:454,h:125};
      const focusPose={x:390,y:i===3?200:440,w:820,h:190};
      const lift=(i===2?Math.sin(orange*Math.PI):i===3?Math.sin(red*Math.PI):0);
      let pose={...phonePose,x:phonePose.x+lift*22};
      let alpha=active?intro:0;
      if(i<2) alpha*=1-release;
      else {
        pose={x:mix(pose.x,focusPose.x,release),y:mix(pose.y,focusPose.y,release),w:mix(pose.w,focusPose.w,release),h:mix(pose.h,focusPose.h,release)};
        const target=targets[i===2?0:1];
        if(returning&&target){
          const r=target.getBoundingClientRect();
          const dock=ease((time-RETURN_START-.35)/1.3);
          pose={x:mix(focusPose.x,(r.left-stageRect.left)/unit,dock),y:mix(focusPose.y,(r.top-stageRect.top)/unit,dock),w:mix(focusPose.w,r.width/unit,dock),h:mix(focusPose.h,r.height/unit,dock)};
        }
      }
      gsap.set(node,{x:pose.x,y:pose.y,width:pose.w,height:pose.h,autoAlpha:alpha,zIndex:i===3?15:i===2?14:12});
      const points=node.querySelector('.chip-points');
      const popAt=i===3?SCENE['gamification-extra'].start:REWARD_START+.8;
      const pop=ease((time-popAt)/.35)*(1-ease((time-RETURN_START)/.3));
      gsap.set(points,{scale:1+pop*1.3,transformOrigin:'center',x:pop*75,y:-pop*35});
    });
  },[time,state,tablet,stage,active,orange,red,returning]);
  return <>
    <div ref={shell} className="ef-phone" aria-hidden={!active||reward}>
      <div className="ph-fit"><PhoneShell title="Personal Board" tabs={[{label:'Open - 4',active:true},{label:'Claimed - 0'},{label:'Closed - 0'}]}/></div>
      {!reward&&active&&<p className="ef-phone-caption">{scene?.display}</p>}
    </div>
    {missions.map((m,i)=>m&&<div key={m.id} ref={node=>{cards.current[i]=node;}} className="ef-travel-card" aria-hidden={!active||(reward&&i<2)} style={{'--mission-color':returning?'#686f76':i===3&&time>=redAt?'#c52c36':i===2&&time>=orangeAt?'#bf4b00':'#007a33'}}>
      <MissionChip kind={m.type} title={m.title} points={m.points} date={m.date} time={m.time} pillTime={fmt((i===3?3300:i===2?1500:180)+Math.max(0,Math.min(time,RETURN_START)-PHONE_START))} pillClass={returning?'chip--gray':'chip--green'}/>
    </div>)}
    {active&&reward&&!returning&&<p className="ef-reward-caption">{scene?.display}</p>}
  </>;
}

