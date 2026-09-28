'use client';

// ---------------------------------------------------------------------------
// MissionChip — the shared mission card, styled like the phone "Personal Board"
// card so the tablet and phone missions match.
// Layout: [logo · kind · points]  ...  [execution timer · aging pill]
//         Title
//         performer                                     date   time
//         (+) Rate                  — closed missions that can be rated (rate);
//         (AF⁵) (BR⁴)               — once rated, one badge per rater (ratings)
// A timer older than a day shows a day badge (days) before the pill.
// The execution timer only shows when claimed (showExec). The pill color is the
// aging state (chip--green default, chip--red, or an inline color from GSAP).
// Sizes are tuned for a ~350px-wide card; scales with the board around it.
// ---------------------------------------------------------------------------

import { forwardRef } from 'react';

const MissionChip = forwardRef(function MissionChip(
  {
    className = '',
    style,
    kind = 'Checklist',
    points = 25,
    title,
    reference,
    who,
    avatar,
    date,
    time,
    execTime = '00:00:00',
    showExec = false,
    pillTime = '00:15:00',
    pillClass = 'chip--green',
    rate = false,
    ratings = [],
    days = 0,
  },
  ref
) {
  return (
    <article ref={ref} className={`chip ${pillClass} ${className}`} style={style}>
      <div className="chip-top">
        <div className="chip-id">
          <img className="chip-logo" src="/mission-logo.png" alt="" aria-hidden="true" />
          <span className="chip-kind">{kind}</span>
          {points != null && <span className="chip-points">{points}</span>}
        </div>
        <div className="chip-timers">
          {showExec ? <span className="chip-exec">{execTime}</span> : null}
          {days > 0 ? <span className="chip-days">{days}d</span> : null}
          <span className="chip-pill">{pillTime}</span>
        </div>
      </div>

      <h3 className="chip-title">{title}</h3>
      {reference && <div className="chip-reference">Ref: <strong>{reference}</strong></div>}

      <div className="chip-bottom">
        {avatar ? <img className="chip-performer-avatar" src={avatar} alt={who || 'Mission performer'} /> : who ? <span className="chip-who">{who}</span> : null}
        <span className="chip-when">
          <span className="chip-date">{date}</span>
          <span className="chip-time">{time}</span>
        </span>
      </div>
      {rate && (ratings.length
        ? <div className="chip-rate chip-ratings">{ratings.map(r => <span className="chip-rating" key={r.initials} aria-label={`${r.name || r.initials}: ${r.score} out of 5`} style={{ opacity: r.pop ?? 1, transform: `scale(${.6 + .4 * (r.pop ?? 1)})` }}>{r.initials}<sup>{r.score}</sup></span>)}</div>
        : <div className="chip-rate"><span className="chip-rate-plus" aria-hidden="true">+</span>Rate</div>)}
    </article>
  );
});

export default MissionChip;
