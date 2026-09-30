'use client';
// The big yellow pointing hand of the demos (see lib/demoHand.mjs and
// components/demoHandDom.js): a stage-level layer the demo moves each frame.
// The art is public/demo-hand.png (the 3D pointing hand, cropped to its outline).
export default function DemoHand({handRef,rippleRef}){
 return <>
  <span ref={rippleRef} className="dh-ripple" aria-hidden="true"/>
  <div ref={handRef} className="dh-hand" aria-hidden="true"><img src="/demo-hand.png" alt="" draggable="false"/></div>
 </>;
}
