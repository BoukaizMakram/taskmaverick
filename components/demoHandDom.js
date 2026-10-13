import {MARK, markOpacity} from '@/lib/demoHand.mjs';
import './DemoHand.css';

// Draws the hand (lib/demoHand.mjs) for the pose handPose() gave: flying from
// its last spot to its target, tilting as it goes, pressing down on the click
// with a ripple where it lands. `pointOf(key)` gives the stage point to click
// on (or null). Returns where the bubble's tail comes from: the point clicked,
// following the clicks (not the hand, which fades out and flies back in), or
// null when there is nothing to point at (tailPoint gives it without drawing).
// `home`: where the hand comes out of the bubble (words-first chapters, pose.from
// 'bubble'): the point of the bubble's outline its tail leaves from.
export const HAND_TIP={x:16,y:1};// the fingertip in the hand's 42x52px box
const EDGE={x:1760,y:1040};// where the hand comes in from: past the stage's bottom right
const mix=(a,b,p)=>a+(b-a)*p;
const ease=p=>1-(1-Math.max(0,Math.min(1,p)))**3;

// Marks what a chapter only shows (marksOf in lib/demoHand.mjs): a thick yellow rounded
// rectangle around each thing, following it. `els`: the mark elements (DemoHand);
// `rectOf(key)`: its box in stage px; `e`: seconds into the chapter; `remaining`:
// seconds until the chapter ends (the marks leave with it).
export function drawMarks({els,list,e,rectOf,remaining=Infinity}){
  (els??[]).forEach((el,i)=>{
    if(!el)return;
    const mark=list[i],opacity=mark?markOpacity(mark,e)*Math.max(0,Math.min(1,remaining/0.28)):0,r=opacity>0?rectOf(mark.target):null;
    if(!r||r.w<1||r.h<1){el.style.opacity=0;return;}
    const [px,py]=MARK.pad;
    Object.assign(el.style,{transform:`translate(${r.x-px}px,${r.y-py}px)`,width:`${r.w+2*px}px`,height:`${r.h+2*py}px`,opacity});
  });
}

// A target that has gone (the Add photo button once the photo is in) is where
// the hand last saw it: the hand stays put while the screen changes under it.
const seen=new WeakMap();
const lookFor=(hand,pointOf)=>{
  if(!seen.has(hand))seen.set(hand,{});
  const memo=seen.get(hand);
  return (key,kind)=>{const point=pointOf(key,kind),id=key+'|'+kind;if(point)memo[id]=point;return point??memo[id]??null;};
};
// Where the bubble's tail points: the right edge of what the hand is on (never over
// its text), following the stops rather than the hand.
export function tailPoint({hand,pose,pointOf}){
  if(!hand||!pose)return null;
  const look=lookFor(hand,pointOf),to=look(pose.to,pose.kind);
  if(!to)return null;
  const tailTo=look(pose.to,'tail')??to,tailBefore=pose.after?look(pose.after,'tail')??tailTo:tailTo;
  return {x:mix(tailBefore.x,tailTo.x,pose.p),y:mix(tailBefore.y,tailTo.y,pose.p)};
}
export function drawHand({hand,ripple,pose,pointOf,home=null}){
  const hide=()=>{if(hand)hand.style.opacity=0;if(ripple)ripple.style.opacity=0;return null;};
  if(!hand||!pose)return hide();
  const look=lookFor(hand,pointOf);
  const to=look(pose.to,pose.kind);
  if(!to)return hide();
  const outside=pose.from==='edge'||(pose.from==='bubble'&&!home);
  const from=outside?EDGE:pose.from==='bubble'?home:look(pose.from,pose.fromKind)??EDGE;
  // only a long flight arcs (out of the bubble it goes straight, on the tail's tip)
  const p=pose.p,far=Math.hypot(to.x-from.x,to.y-from.y),lift=far>300&&pose.from!=='bubble'?Math.sin(Math.PI*p)*Math.min(70,far*0.14):0;
  const x=mix(from.x,to.x,p),y=mix(from.y+(pose.fromSwipe??0),to.y,p)-lift+pose.swipe;// (it sets off from where it was: up where a swipe left it)
  // pressed while it clicks or swipes; when it only points it stays still
  // (no press, no nudge: nothing is clicked)
  const since=pose.since,pressed=pose.down?Math.min(1,since/0.05):0;
  const release=pose.kind==='click'&&!pose.down&&since>=0.18?Math.max(0,1-(since-0.18)/0.12):0;
  const scale=1-0.14*Math.max(pressed,release),tilt=outside?mix(-12,0,p):0;// it tilts only coming in from outside
  hand.style.transform=`translate(${x-HAND_TIP.x}px,${y-HAND_TIP.y}px) rotate(${tilt}deg) scale(${scale})`;
  hand.style.opacity=pose.opacity;
  // the ripple where a click landed
  if(pose.kind==='click'&&since>=0&&since<0.55){
    const r=ease(since/0.55),size=mix(14,150,r);
    ripple.style.transform=`translate(${to.x-size/2}px,${to.y-size/2}px)`;
    ripple.style.width=ripple.style.height=`${size}px`;
    ripple.style.opacity=(1-r)*pose.opacity;
  }else ripple.style.opacity=0;
  return tailPoint({hand,pose,pointOf});
}
