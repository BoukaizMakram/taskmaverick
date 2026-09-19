'use client';
import { useEffect, useState } from 'react';

function Glyph({ name }) {
  const paths = {
    home: 'M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z',
    missions: 'M12 5v14M5 12h14', activity: 'M7 2v5M17 2v5M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2',
    profile: 'M16 21c-4 2-13 0-13-3 0-6 16-6 16 0M16 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
    bell: 'M5 18h14M7 17V9a5 5 0 0 1 8-4M17 9v8M10 21h4M19 3v5',
    menu: 'M5 6h14M5 12h14M5 18h14', back: 'M19 12H5m6-6-6 6 6 6', close: 'm5 5 14 14M5 19 19 5',
    logout: 'M9 3a9 9 0 0 0 0 18M9 12h13m-5-5 5 5-5 5', chevron: 'm9 4 8 8-8 8',
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{name === 'missions' && <circle cx="12" cy="12" r="10"/>}<path d={paths[name] || paths.profile}/></svg>;
}
const catalog = [['Baked Cake Donuts','Task'],['Ice Bags Fill','Checklist'],['Resampling','Task'],['Area Sweep','Task'],['zxzx','Task','Draft'],['Soda Tower Deep Cleaning','Checklist'],['Test Global','Test'],['Test Person Type','Test'],['Test New Features','Checklist'],['Floor Cleaning 1','Task'],['Entry Way Vents','Checklist'],['Drains Check','Checklist'],['Coffee Machine Check','Checklist'],['Restroom Check','Checklist']];
const units = ['Makram Location', "Makram’s Location", 'TM Training & Onboarding'];
const ticketUnits = ['M001 - Makram Location', "M002 - Makram’s Location", 'T002 - TM Training & Onboarding', 'T002 - TM Training & Onboarding - OMC Inc', 'T002 - TM Training & Onboarding - OMC Inc - First Floor'];
export default function PersonalDashboard({ device, onBoard, onNavigate, getCounts }) {
  const [page, setPage] = useState('home');
  const [menu, setMenu] = useState(false);
  const [panel, setPanel] = useState(null);
  const [period, setPeriod] = useState('1W');
  const [tab, setTab] = useState(0);
  const [query, setQuery] = useState('');
  const [ticket, setTicket] = useState(ticketUnits[0]);
  useEffect(() => {
    const dismiss = event => { if (event.key === 'Escape') { setPanel(null); setMenu(false); } };
    window.addEventListener('keydown', dismiss);
    return () => window.removeEventListener('keydown', dismiss);
  }, []);
  const mobile = device === 'phone';
  const go = name => { setPage(name); setTab(0); setMenu(false); };
  const tabs = labels => <div className="pd-tabs">{labels.map((label,i) => <button key={label} aria-pressed={tab === i} onClick={() => setTab(i)}>{label}</button>)}</div>;
  const iconButton = (name, label, action) => <button className="pd-circle" aria-label={label} onClick={action}><Glyph name={name}/></button>;
  const actions = <div className="pd-actions">{iconButton('bell','Notifications',() => setPanel('Notifications'))}{iconButton(menu ? 'close' : 'menu','Home menu',() => setMenu(!menu))}{!mobile && <button className="pd-avatar" aria-label="Profile" onClick={() => setPanel('Profile')}>MB</button>}</div>;
  const tile = (icon,title,count,sub,action) => <button className={`pd-tile pd-tile--${icon}`} onClick={action}><img src={`/board-icons/${icon}.svg`} alt=""/><span className="pd-tile-label"><b>{title}</b>{sub && <small>{sub}</small>}</span><strong>{count}</strong><Glyph name="chevron"/></button>;
  return <section className={`pd-shell pd-shell--${device}`} aria-label="Personal dashboard">
    {!mobile && <header className="pd-header"><img src="/logo.svg" alt="Taskmaverick"/>{actions}</header>}
    <div className="pd-layout">
      {(page === 'home' || page === 'missions' || !mobile) && <nav className="pd-nav" aria-label="Main navigation">{['home','missions','activity','profile'].map(name => <button key={name} aria-current={page === name ? 'page' : undefined} onClick={() => name === 'profile' || name === 'activity' ? setPanel(name === 'profile' ? 'Profile' : 'Activity') : go(name)}>{name === 'home' && page === 'home' && !mobile ? <img src="/board-icons/home.svg" alt=""/> : <Glyph name={name}/>}<span>{name[0].toUpperCase()+name.slice(1)}</span></button>)}{!mobile && <button className="pd-logout" aria-label="Log out" onClick={() => setPanel('Log Out')}><Glyph name="logout"/></button>}</nav>}
      <main className={`pd-main pd-main--${page}`}>
        {page === 'home' ? <div className="pd-home-grid"><section className="pd-home-card"><div className="pd-name"><h1>Makram Boukaiz</h1>{mobile && actions}</div>{!mobile && <p className="pd-personal-label">Personal Board</p>}<p className="pd-company">TM Training</p><div className="pd-tiles">
          {tile('profile-green','My Board',String(getCounts('personal').slice(0,2).reduce((a,b)=>a+b,0)).padStart(2,'0'),'Personal Assignments',() => onBoard('personal'))}
          {tile('course','My Courses','00','Knowledge Center',() => go('courses'))}
          {tile('units','My Teams','05',null,() => go('units'))}
          {tile('ticket','Tickets','00',null,() => go('tickets'))}
        </div></section><section className="pd-performance"><h2>{mobile ? 'My Performance' : 'Performance'}</h2><div className="pd-periods">{['1W','4W','12W','52W','All'].map(p => <button key={p} aria-pressed={period === p} onClick={() => setPeriod(p)}>{p}</button>)}</div><div className="pd-stats">{[['Objectivity','Avg. Objectivity','0.0'],['Work Quality','Avg. Rating','0.0'],['Total Closed','Missions',getCounts('personal')[2]]].map(([label,sub,value],i) => <div key={label} className={`pd-stat pd-stat--${i}`}><span>{label}<small>{sub}</small></span><b>{value}</b></div>)}</div></section></div> : <>
          <div className="pd-page-title">{page !== 'missions' && iconButton('back','Back to home',() => go('home'))}<h2>{({courses:'Course',units:'Units',tickets:'Ticket Boards',ticket:ticket+' Tickets',missions:'Missions'})[page]}</h2></div>
          {page === 'courses' && tabs(['Pending','In Progress','Completed'])}
          {page === 'units' && <><div className="pd-list-heading">Units <span>Teams</span></div>{units.map((name,i) => <button className="pd-unit-row" key={name} onClick={() => onNavigate('unit')}><u>{name}</u><span>♧ &nbsp;{['01','02','01'][i]}</span></button>)}</>}
          {page === 'tickets' && <>{tabs(['Unit-5','Organization-2'])}{(tab === 0 ? ticketUnits : ticketUnits.slice(2,4)).map(name => <button className="pd-unit-row" key={name} onClick={() => {setTicket(name);go('ticket');}}><u>{name}</u><span>▤ &nbsp;00</span></button>)}</>}
          {page === 'ticket' && tabs(['Open - 0','Claimed - 0','Closed - 0'])}
          {page === 'missions' && <><div className="pd-search"><input aria-label="Search missions" placeholder="Search" value={query} onChange={event => setQuery(event.target.value)}/><select aria-label="Sort missions"><option>Last Updated</option><option>Title</option></select></div><div className="pd-catalog"><div className="pd-catalog-head"><span>Title</span><span>Type</span><span>Source</span><span>Status</span><span>Last Update</span></div>{catalog.filter(row => row[0].toLowerCase().includes(query.toLowerCase())).map(([title,type,status='Published'],i) => <div className="pd-catalog-row" key={title}><span className="pd-catalog-title"><small>{i+1}.</small>{title}</span><span className="pd-catalog-type">{type}</span><span className="pd-source">▦</span><span>{status}</span><span className="pd-date">09-14-26</span></div>)}</div></>}
        </>}
      </main>
    </div>
    {menu && <><button className="pd-shade" aria-label="Dismiss home menu" onClick={() => setMenu(false)}/><div className="pd-menu">{[['team-book','Knowledge Base'],['logout','Log Out']].map(([icon,label]) => <button key={label} onClick={() => {setMenu(false);setPanel(label);}}><img src={`/board-icons/${icon}.svg`} alt=""/>{label}</button>)}</div></>}
    {panel && <><button className="pd-shade" aria-label="Dismiss panel" onClick={() => setPanel(null)}/><aside className="pd-panel" aria-label={panel}><header>{iconButton('back','Back to dashboard',() => setPanel(null))}<h2>{panel}</h2></header><div className="pd-panel-content">{panel === 'Notifications' ? 'No Notifications' : panel === 'Profile' ? 'Makram Boukaiz' : panel === 'Activity' ? 'No Activity' : panel === 'Knowledge Base' ? 'No Articles' : <button onClick={() => {setPanel(null);go('home');}}>Return to Home</button>}</div></aside></>}
  </section>;
}

