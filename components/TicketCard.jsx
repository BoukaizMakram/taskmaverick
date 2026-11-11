'use client';

// ---------------------------------------------------------------------------
// TicketCard — the alert ticket as the product draws it (the user, 2026-10-16: "create this UI for
// ticket ... make sure all tickets are like this, all alert tickets"):
//   Title (bold)                                              [timer pill]
//   [A] 1 Response Triggered This Ticket
//   - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
//   The response that raised it
//   [building] Location 1 - Department A
//   - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
//   (who, once claimed)                                07-20-26 12:09 PM
// On its own (the ticket popping out of what raised it: `alert`) it has a red-pink border with a soft glow; on a ticket board (the user, 2026-10-16: "the red outline only shows up when the ticket is not in the
// ticket board, like on the normal background") it is a plain card, like the team board's. Claimed and closed tickets add the execution
// timer before the pill and who answered it. Same sizes as the mission chip (a ~340 px card in the 1080
// tablet board; fonts in --ref-u), the same part classes (chip-title, chip-exec, chip-pill, chip-who) so
// the videos can point at them. The ticket board is the team board with this card and a red title (the
// department) instead of the black one (components/InteractiveMissionBoard.jsx `demoState.ticketBoard`).
// ---------------------------------------------------------------------------

import { forwardRef } from 'react';
import './TicketCard.css';

const Building = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="tk-building" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5.5 20.5V4.5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16M15.5 9.5h2a1 1 0 0 1 1 1v10M3.5 20.5h17"/>
    <path d="M8.5 7h1.6M11.9 7h1.6M8.5 10.5h1.6M11.9 10.5h1.6M8.5 14h1.6M11.9 14h1.6M17 13.5h.01M17 16.5h.01"/>
  </svg>
);

const TicketCard = forwardRef(function TicketCard(
  {
    className = '',
    style,
    title,
    responses = 1,
    response,
    location,
    date,
    time,
    pillTime = '00:00:00',
    pillClass = 'chip--green',
    execTime,
    showExec = false,
    who,
    avatar,
    alert = false,
  },
  ref
) {
  return (
    <article ref={ref} className={`chip chip--ticket${alert ? ' chip--alert' : ''} ${pillClass} ${className}`} style={style}>
      <div className="tk-top">
        <h3 className="chip-title tk-title">{title}</h3>
        <div className="chip-timers">
          {showExec ? <span className="chip-exec">{execTime}</span> : null}
          <span className="chip-pill">{pillTime}</span>
        </div>
      </div>
      <p className="tk-count"><i className="tk-badge" aria-hidden="true">A</i><span>{responses} {responses === 1 ? 'Response' : 'Responses'} Triggered This Ticket</span></p>
      <div className="tk-rule" />
      <p className="tk-response">{response}</p>
      <p className="tk-location"><Building />{location}</p>
      <div className="tk-rule" />
      <div className="tk-bottom">
        {avatar ? <img className="chip-performer-avatar" src={avatar} alt={who || 'Ticket responder'} /> : who ? <span className="chip-who">{who}</span> : <span />}
        <span className="chip-when"><span className="chip-date">{date}</span><span className="chip-time">{time}</span></span>
      </div>
    </article>
  );
});

export default TicketCard;
