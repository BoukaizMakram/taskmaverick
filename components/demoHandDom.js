import './DemoHand.css';

// Draws the hand (lib/demoHand.mjs) for the pose handPose() gave: flying from
// its last spot to its target, tilting as it goes, pressing down on the click
// with a ripple where it lands. `pointOf(key)` gives the stage point to click
// on (or null). Returns where the bubble's tail comes from: the point clicked,
// following the clicks (not the hand, which fades out and flies back in), or
// null when there is nothing to point at.
export const HAND_TIP={x:32,y:2};// the fingertip in the hand's 84x104px box
const EDGE={x:1760,y:1040};// where the hand comes in from: past the stage's bottom right
const mix=(a,b,p)=>a+(b-a)*p;
const ease=p=>1-(1-Math.max(0,Math.min(1,p)))**3;

// A target that has gone (the Add photo button once the photo is in) is where
// the hand last saw it: the hand stays put while the screen changes under it.
const seen=new WeakMap();
export function drawHand({hand,ripple,pose,pointOf}){
  const hide=()=>{if(hand)hand.style.opacity=0;if(ripple)ripple.style.opacity=0;return null;};
  if(!hand||!pose)return hide();
  if(!seen.has(hand))seen.set(hand,{});
  const memo=seen.get(hand),look=(key,kind)=>{const point=pointOf(key,kind),id=key+'|'+kind;if(point)memo[id]=point;return point??memo[id]??null;};
  const to=look(pose.to,pose.kind);
  if(!to)return hide();
  const from=pose.from==='edge'?EDGE:look(pose.from,pose.fromKind)??EDGE;
  // the bubble's tail comes from the right edge of what is pointed at (never over
  // its text), following the stops rather than the hand
  const tailTo=look(pose.to,'tail')??to,tailBefore=pose.after?look(pose.after,'tail')??tailTo:tailTo;
  const p=pose.p,far=Math.hypot(to.x-from.x,to.y-from.y),lift=far>300?Math.sin(Math.PI*p)*Math.min(70,far*0.14):0;// only a long flight arcs
  const x=mix(from.x,to.x,p),y=mix(from.y,to.y,p)-lift+pose.swipe;
  // pressed while it clicks or swipes; a nudge when it only points
  const since=pose.since,pressed=pose.down?Math.min(1,since/0.05):0;
  const nudge=pose.kind==='point'&&since>=0?Math.sin(Math.PI*Math.max(0,Math.min(1,since/0.4)))*0.1:0;
  const release=pose.kind==='click'&&!pose.down&&since>=0.18?Math.max(0,1-(since-0.18)/0.12):0;
  const scale=1-0.14*Math.max(pressed,release)+nudge,tilt=pose.from==='edge'?mix(-12,0,p):0;// it tilts only coming in from outside
  hand.style.transform=`translate(${x-HAND_TIP.x}px,${y-HAND_TIP.y}px) rotate(${tilt}deg) scale(${scale})`;
  hand.style.opacity=pose.opacity;
  // the ripple where a click landed
  if(pose.kind==='click'&&since>=0&&since<0.55){
    const r=ease(since/0.55),size=mix(14,150,r);
    ripple.style.transform=`translate(${to.x-size/2}px,${to.y-size/2}px)`;
    ripple.style.width=ripple.style.height=`${size}px`;
    ripple.style.opacity=(1-r)*pose.opacity;
  }else ripple.style.opacity=0;
  return {x:mix(tailBefore.x,tailTo.x,p),y:mix(tailBefore.y,tailTo.y,p)};
}
