'use client';

import { useState } from 'react';
import { IconMenu } from './PhoneShell';

const leaders = [['Angel Rios',5220],['Julian De la Torre',3305],['Nelson Posada',2960],['Freddy Espain',1685],['Guillermo Hernandez',860],['Joseph Pinhas',80],['Mae Stamm',20]];
function Periods() {
  const [period, setPeriod] = useState('1W');
  return <div className="th-periods">{['1W','4W','12W','52W','All'].map(value => <button key={value} aria-pressed={period === value} onClick={() => setPeriod(value)}>{value}</button>)}</div>;
}
function Row({ icon, label, locked, onClick }) {
  const content = <><span className={`th-icon th-icon--${icon}`}><img src={`/board-icons/${icon === 'profile' ? 'profile-green' : icon}.svg`} alt=""/></span><b>{label}</b>{locked && <img className="th-lock" src="/board-icons/lock.svg" alt="Locked"/>}<span className="th-chevron">›</span></>;
  return onClick ? <button className="th-row" onClick={onClick}>{content}</button> : <div className="th-row">{content}</div>;
}
export default function TabletHome({ onNavigate, onBoard, onMenu }) {
  return <section className="th-home" aria-label="L001-Sweet Beverly dashboard">
    <header className="th-header"><img src="/logo.svg" alt="Taskmaverick"/><button className="ph-iconbtn" aria-label="Home menu" onClick={onMenu}><IconMenu/></button></header>
    <div className="th-content">
      <section className="th-unit"><h1>L001-Sweet Beverly</h1><p>sweetbeverly</p><div className="th-rows">
        <Row icon="team" label="Team Boards" onClick={() => onNavigate('unit')}/>
        <Row icon="ticket" label="Ticket Boards" locked/>
        <Row icon="units" label="Organization" locked/>
        <Row icon="profile" label="My Board" locked onClick={() => onBoard('personal')}/>
      </div></section>
      <section className="th-performance"><div className="th-performance-heading"><h2>Performance</h2><select aria-label="Performance team" defaultValue="All Teams"><option>All Teams</option></select></div><Periods/>
        <div className="th-stat th-stat--objectivity"><div>Objectivity<small>Avg. Objectivity</small></div><b>0.0</b></div>
        <div className="th-stat th-stat--quality"><div>Work Quality<small>Avg. Rating</small></div><b>0.0</b></div>
        <div className="th-stat th-stat--closed"><div>Total Closed<small>Missions</small></div><b>1871</b></div>
        <div className="th-stat th-stat--points"><div>Points Earned By Unit<small>Points</small></div><b>14130</b></div>
      </section>
      <section className="th-leaderboard"><div className="th-leaderboard-heading"><h2>Leaderboard</h2><Periods/></div><table><thead><tr>{['Person','Points ↓','Missions/Hour','Ratings/Hour','Points/Hour','Work Quality','Objectivity Rating'].map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>{leaders.map(([name, points], index) => <tr key={name}><th scope="row">{index + 1}. {name}</th><td>{points}</td>{Array.from({length:5}, (_, i) => <td key={i}>0</td>)}</tr>)}</tbody></table></section>
    </div>
  </section>;
}
