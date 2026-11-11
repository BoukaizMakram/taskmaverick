'use client';
// A section's art at a state, for scripts/capture-sections.mjs (the sections of the website: lib/sections/index.mjs). The script calls window.__stage.show(stage, state) and takes what is
// drawn apart into the board's frames. Development only (app/section-stage). The classes are the ones the storyboard's stage has, so the art looks here as it will on the board.
// `live` (app/demo-ai/stage): the same page in a hidden frame of the AI demo call, which draws the art with the visitor's data (`show(stage, state, data)`, lib/sections/liveData.mjs) and
// takes it apart itself (`extract`, lib/sections/captureCore.mjs: components/demo-ai/liveCapture.js). It waits for what the art shows to be loaded (its pictures, the fonts) rather than a
// fixed fifth of a second.
import {useEffect, useState} from 'react';
import {flushSync} from 'react-dom';
import {extract} from '@/lib/sections/captureCore.mjs';
import LiveOversightStage from './LiveOversightStage';
import AuditingStage from './AuditingStage';
import MaintenanceStage from './MaintenanceStage';
import SupportStage from './SupportStage';
import ExpirationsStage from './ExpirationsStage';
import InventoryStage from './InventoryStage';
import ExceptionsStage from './ExceptionsStage';
import ReportingStage from './ReportingStage';
import PlanningStage from './PlanningStage';
import EfficiencyStage from './EfficiencyStage';
import CoachingStage from './CoachingStage';
import ReactiveStage from './ReactiveStage';
import TestingStage from './TestingStage';
import MonitoringStage from './MonitoringStage';
import CertificationStage from './CertificationStage';
import LearningStage from './LearningStage';
import BroadcastStage from './BroadcastStage';
import TrainingDataStage from './TrainingDataStage';
import RiskStage from './RiskStage';
import BreaksStage from './BreaksStage';
import PredictionStage from './PredictionStage';
import StandardizingStage from './StandardizingStage';
import FranchisingStage from './FranchisingStage';
import ConsultingStage from './ConsultingStage';
import AdaptationStage from './AdaptationStage';
import '../EfficiencyStoryDemo.css';
import '../ImprovedQualityDemo.css';
import '../ImprovedQualityV2Demo.css';
import '../LiveOversightDemo.css';
import '../CaptionBubbles.css';
import '../DemoHand.css';
import '../EfficiencyV2Demo.css';
import '../web/web.css';
import './sections.css';
import './sectionStyles';

const STAGES = {'live-oversight': LiveOversightStage, 'dynamic-auditing': AuditingStage, 'requesting-maintenance': MaintenanceStage, 'requesting-support': SupportStage, 'tracking-expirations': ExpirationsStage, 'replenishing-inventory': InventoryStage, 'exception-management': ExceptionsStage, 'reporting-ai': ReportingStage, 'precision-planning': PlanningStage, 'increased-efficiency': EfficiencyStage,
  'automated-coaching': CoachingStage, 'reactive-training': ReactiveStage, 'dynamic-testing': TestingStage, 'live-monitoring': MonitoringStage, 'automated-certification': CertificationStage, 'learning-efficiency': LearningStage, 'mass-broadcasting': BroadcastStage, 'training-data-ai': TrainingDataStage, 'risk-liability': RiskStage, 'meal-rest-breaks': BreaksStage, 'prediction-ai': PredictionStage, 'standardizing-enterprise': StandardizingStage, 'powering-franchising': FranchisingStage, 'innovating-consulting': ConsultingStage, 'content-adaptation': AdaptationStage};
const frame = () => new Promise(resolve => requestAnimationFrame(() => resolve()));
// (the pictures of the art, loaded: a picture that comes in later would move what is under it, and the boxes measured would be wrong)
const loaded = (root, ms = 2500) => Promise.race([Promise.all([...root.querySelectorAll('img')].filter(img => !img.complete).map(img => new Promise(done => { img.addEventListener('load', done, {once: true}); img.addEventListener('error', done, {once: true}); }))), new Promise(done => setTimeout(done, ms))]);

export default function SectionStage({live = false}) {
  const [job, setJob] = useState(null);
  useEffect(() => {
    if (!live) {
      window.__stage = {show: (stage, state) => new Promise(resolve => { setJob({stage, state}); requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 200))); })};
      return () => { delete window.__stage; };
    }
    const root = () => document.getElementById('sec-stage');
    window.__stage = {
      async show(stage, state, data) {
        flushSync(() => setJob({stage, state, data})); // (drawn, and its layout effects (the centering) run, before this returns)
        await document.fonts?.ready;
        await loaded(root());
        await frame(); await frame();
      },
      extract: targets => extract(targets, root()),
    };
    return () => { delete window.__stage; };
  }, [live]);
  const Stage = job && STAGES[job.stage];
  return <main style={{margin: 0, background: '#e9edf2', minHeight: '100vh'}}>
    <div className="es-player iq-player demo-text-scope" style={{width: 1600, height: 900, position: 'relative'}}>
      <div id="sec-stage" className="ad-stage iq-stage iq2-stage" style={{position: 'absolute', left: 0, top: 0, width: 1600, height: 900, overflow: 'hidden', '--iq-caption-size': '27px'}}>
        {Stage && (job.data ? <Stage state={job.state} data={job.data}/> : <Stage state={job.state}/>)}
      </div>
    </div>
  </main>;
}
