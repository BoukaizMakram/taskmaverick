'use client';

// ---------------------------------------------------------------------------
// Tablet "Missions" board — an HTML/CSS recreation of the Figma tablet design
// (Assets for website animation). Built at a fixed 1174×837 coordinate space
// (inside .tbl-tablet) and fluidly scaled to its container, so it's ready to
// animate later (cards, timers, tab counts, etc.) without any video.
// ---------------------------------------------------------------------------

import MissionChip from '@/components/MissionChip';

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const IconPlus = () => (
  <svg viewBox="0 0 18 18" aria-hidden="true"><path d="M9 3.5v11M3.5 9h11" {...stroke} /></svg>
);
const IconMenu = () => (
  <svg viewBox="0 0 18 18" aria-hidden="true"><path d="M3.5 5.5h11M3.5 9h11M3.5 12.5h11" {...stroke} /></svg>
);
const IconBack = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M15 10H5.5M9.5 5.5 5 10l4.5 4.5" {...stroke} /></svg>
);
const IconExpand = () => (
  <svg viewBox="0 0 18 18" aria-hidden="true">
    <path d="M7 3H4a1 1 0 0 0-1 1v3M11 3h3a1 1 0 0 1 1 1v3M7 15H4a1 1 0 0 1-1-1v-3M11 15h3a1 1 0 0 1 1-1v-3" {...stroke} strokeWidth={1.5} />
  </svg>
);

const TABS = ['Open - 2', 'Claimed - 1', 'Closed - 0'];

export default function TabletMissions() {
  return (
    <div className="tbl-fit">
      <div className="tbl-tablet">
        <div className="tbl-screen">
          {/* header */}
          <header className="tbl-header">
            <button type="button" className="tbl-iconbtn tbl-back" aria-label="Back"><IconBack /></button>
            <span className="tbl-dept">Department 1</span>
            <div className="tbl-header-actions">
              <button type="button" className="tbl-iconbtn" aria-label="Add"><IconPlus /></button>
              <button type="button" className="tbl-iconbtn" aria-label="Menu"><IconMenu /></button>
            </div>
          </header>

          <div className="tbl-content">
            {/* status tabs */}
            <div className="tbl-tabs">
              {TABS.map((t) => (
                <div className="tbl-tab" key={t}>
                  <span>{t}</span>
                  <IconExpand />
                </div>
              ))}
            </div>

            {/* board: Open | Claimed | Closed */}
            <div className="tbl-board">
              <div className="tbl-col">
                <MissionChip
                  kind="Checklist"
                  title="Air Conditioning Cleaning"
                  who="Global - Organization"
                  date="01/02/19"
                  time="10:30 AM"
                  pillTime="00:15:00"
                  pillClass="chip--green"
                />
              </div>

              <div className="tbl-col">
                <MissionChip
                  kind="Media"
                  title="Sanitize Surfaces"
                  who="Anna F. - Staff"
                  date="01/02/19"
                  time="10:30 AM"
                  showExec
                  execTime="00:22:13"
                  pillTime="00:15:00"
                  pillClass="chip--red"
                />
                <MissionChip
                  kind="Media"
                  title="Scents Policy"
                  who="Manager"
                  date="01/02/19"
                  time="10:30 AM"
                  showExec
                  execTime="00:22:13"
                  pillTime="00:15:00"
                  pillClass="chip--red"
                />
              </div>

              <div className="tbl-col" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
