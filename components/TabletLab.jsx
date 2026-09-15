'use client';
import { useState } from 'react';
import AnimatedMissions from '@/components/AnimatedMissions';
import SoftwarePreview from '@/components/SoftwarePreview';

export default function TabletLab() {
  const [interactive, setInteractive] = useState(true);
  return <div className="ov-lab">{interactive ? <SoftwarePreview onAnimationTools={() => setInteractive(false)}/> : <AnimatedMissions/>}<button type="button" className="ov-btn" onClick={() => setInteractive(v => !v)}>{interactive ? 'Scripted animation' : 'Interactive mode'}</button></div>;
}
