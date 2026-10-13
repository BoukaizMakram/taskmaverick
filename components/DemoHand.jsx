'use client';
// The big yellow pointing hand of the demos (see lib/demoHand.mjs and
// components/demoHandDom.js): a stage-level layer the demo moves each frame.
// The art is public/demo-hand.png (the 3D pointing hand, cropped to its outline).
// With it, the marks: the thick yellow rounded rectangles drawn around what a
// chapter only shows (no hand points at that).
export default function DemoHand({handRef,rippleRef,marksRef}){
 return <>
  {marksRef&&[0,1,2].map(i=><span key={i} ref={el=>{marksRef.current[i]=el;}} className="iq2-mark" aria-hidden="true"/>)}
  <span ref={rippleRef} className="dh-ripple" aria-hidden="true"/>
  <div ref={handRef} className="dh-hand" aria-hidden="true"><img src="/demo-hand.png" alt="" draggable="false"/></div>
 </>;
}
