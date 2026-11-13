'use client';
// The Remotion compositions of the boards that have a cut (lib/remotion/cuts.mjs): board -> component. The Player gives it the layout of the variation that plays (`layout`, an input prop); Increased
// Efficiency's layout 'storyboard' is a cut of its own (the look `remotion-storyboard`: the cut redone from the board All storyboards, components/remotion/EfficiencyRedo.jsx), and so is
// 'straight' (the look `remotion-straight`, Variation 7: that film with the user's comments of 2026-11-11 in it; the same component, which gives the plan its layout).
import EfficiencyCut from './EfficiencyCut';
import EfficiencyRedo from './EfficiencyRedo';
import QualityCut from './QualityCut';
import OversightCut from './OversightCut';
import AuditingCut from './AuditingCut';
import PlanningCut from './PlanningCut';
import MaintenanceCut from './MaintenanceCut';

function IncreasedEfficiency(props) {
  return props.layout === 'storyboard' || props.layout === 'straight' ? <EfficiencyRedo {...props}/> : <EfficiencyCut {...props}/>;
}

export const CUT_COMPONENTS = {'increased-efficiency-v3': IncreasedEfficiency, 'improved-quality-v2': QualityCut, 'live-oversight-v2': OversightCut, 'dynamic-auditing-v2': AuditingCut, 'precision-planning-v2': PlanningCut, 'requesting-maintenance-v2': MaintenanceCut}; // (Live Oversight's: the user, 2026-11-11; Dynamic Auditing's and Precision Planning's: 2026-11-12)
