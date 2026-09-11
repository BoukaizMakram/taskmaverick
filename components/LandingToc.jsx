'use client';

// Landing-page outline navigation, mirroring the industry reel:
//   • Desktop (>900px): a right-hand sidebar (.ireel-toc) of sections.
//   • Mobile (<=900px): a pinned selector (.ireel-bar) opening a full-page menu.
// Every section shows a 2-item PREVIEW by default; the section the user clicks
// expands fully (the others fall back to their 2-item preview).
// Each item maps, in order, to a reel chapter — clicking one scrolls the reel
// to that chapter (Placeholder A → chapter 1, B → chapter 2, …).

import { useEffect, useMemo, useRef, useState } from 'react';

import { useT } from '@/lib/i18n/LanguageProvider';
import { useEdit, EditText } from '@/components/InlineEdit';

const TOC_W_COOKIE = 'lpTocW';
const TOC_W_MIN = 240;
const TOC_W_MAX = 560;

function readCookie(name) {
  const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : null;
}
function writeCookie(name, value) {
  const exp = new Date();
  exp.setTime(exp.getTime() + 365 * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${exp.toUTCString()};path=/;samesite=lax`;
}

// Drag the sidebar's left edge to resize it. Writes --lp-toc-w on the .lp-page
// element (inline, so it wins over the stylesheet default) — the sidebar width
// and the reel's reserved padding both read that variable — and persists the
// chosen width in a cookie so it's restored on the next visit.
function startTocResize(e) {
  e.preventDefault();
  const page = e.currentTarget.closest('.lp-page') || document.querySelector('.lp-page');
  if (!page) return;
  let w = null;
  const onMove = (ev) => {
    w = Math.min(TOC_W_MAX, Math.max(TOC_W_MIN, window.innerWidth - ev.clientX));
    page.style.setProperty('--lp-toc-w', `${w}px`);
  };
  const onUp = () => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    document.body.style.userSelect = '';
    if (w != null) writeCookie(TOC_W_COOKIE, String(Math.round(w)));
  };
  document.body.style.userSelect = 'none';
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
}

// Restore the saved sidebar width from the cookie on mount.
function useRestoreTocWidth() {
  useEffect(() => {
    const saved = parseInt(readCookie(TOC_W_COOKIE), 10);
    if (!Number.isFinite(saved)) return;
    const w = Math.min(TOC_W_MAX, Math.max(TOC_W_MIN, saved));
    const page = document.querySelector('.lp-page');
    if (page) page.style.setProperty('--lp-toc-w', `${w}px`);
  }, []);
}

// Press "h" to hide / show the right-hand outline sidebar (a class on <html>
// hides it and reclaims its reserved space). Ignored while typing/editing.
function useHideTocShortcut() {
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target.closest?.('input, textarea, select, [contenteditable]')) return;
      if (e.key === 'h' || e.key === 'H') {
        document.documentElement.classList.toggle('hide-toc');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

export default function LandingToc({ outline = [], chapters = [], activeId, onNavigate }) {
  const t = useT();
  const edit = useEdit();
  useHideTocShortcut();
  useRestoreTocWidth();
  // Multiple sections can be open at once (a Set of ids). Scrolling the reel
  // opens the section in view without collapsing the others.
  const [openIds, setOpenIds] = useState(() => new Set()); // everything collapsed on load
  const [menuOpen, setMenuOpen] = useState(false);
  const listRef = useRef(null);
  const groupRefs = useRef({});
  const PREVIEW = 3; // "main" subsections always shown; the rest expand on open

  // Flatten the outline and map each item, in order, to a reel chapter. `_idx`
  // keeps the ORIGINAL outline index and `_k` the item's original index (both
  // needed for edit paths / keys after we float the active item up).
  const sections = useMemo(() => {
    let g = 0;
    return outline.map((sec, idx) => ({
      ...sec,
      _idx: idx,
      items: (sec.items || []).map((title, k) => {
        const chapter = chapters[g] || null;
        g += 1;
        return { title, chapterId: chapter ? chapter.id : null, _k: k };
      }),
    }));
  }, [outline, chapters]);

  const toggle = (id) =>
    setOpenIds((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // The mobile selector shows the active "Section - Subsection" (the section
  // that holds the active chapter, and that chapter's item).
  const activeSection =
    sections.find((s) => s.items.some((it) => it.chapterId === activeId)) || sections[0];
  const activeItem =
    activeSection?.items.find((it) => it.chapterId === activeId) || activeSection?.items[0];
  // Home mode: the active chapter isn't in any section (we're on the Home /
  // Philosophy page). The mobile selector then lists every section name instead
  // of a single "Section - Subsection".
  const isHome = !sections.some((s) => s.items.some((it) => it.chapterId === activeId));

  // The section that actually contains the active chapter — NO fallback, so it's
  // null on Home (activeId isn't in any section).
  const activeSectionReal = sections.find((s) =>
    s.items.some((it) => it.chapterId === activeId)
  );

  // Scrolling the reel into a section auto-opens it (without collapsing the
  // others). Safe on first load: we land on Home, so nothing is active and this
  // is a no-op until the reader scrolls down into a section.
  useEffect(() => {
    const id = activeSectionReal?.id;
    if (id == null) return;
    setOpenIds((cur) => (cur.has(id) ? cur : new Set(cur).add(id)));
  }, [activeSectionReal?.id]);

  // Clicking an item: open its section (leave others open), keep the selection
  // on it, and jump the reel to its chapter.
  const pickItem = (sectionId, chapterId) => {
    if (chapterId == null) return;
    setOpenIds((cur) => (cur.has(sectionId) ? cur : new Set(cur).add(sectionId)));
    setMenuOpen(false);
    onNavigate?.(chapterId);
  };

  // One sidebar item row (edit mode = double-click editable label). `k` is the
  // item's ORIGINAL index in the section (kept correct across preview/rest);
  // it also drives the A./B./C. letter marker.
  const renderItem = (it, k, i, sec) => (
    <li className="ireel-toc-item-li" key={k}>
      {edit ? (
        <EditText
          as="span"
          className={`ireel-toc-item${it.chapterId === activeId ? ' is-active' : ''}`}
          path={['outline', i, 'items', k]}
          value={it.title}
          onActivate={() => pickItem(sec.id, it.chapterId)}
        />
      ) : (
        <button
          type="button"
          className={`ireel-toc-item${it.chapterId === activeId ? ' is-active' : ''}`}
          disabled={it.chapterId == null}
          onClick={() => pickItem(sec.id, it.chapterId)}
        >
          <span className="lp-mark">{k + 1}.</span>
          {t(it.title)}
        </button>
      )}
    </li>
  );

  return (
    <>
      {/* Desktop: right-hand sidebar */}
      <nav className="ireel-toc lp-toc lp-opt-2" aria-label={t('On this page')}>
        <div
          className="lp-toc-resizer"
          role="separator"
          aria-orientation="vertical"
          aria-label={t('Resize sidebar')}
          onPointerDown={startTocResize}
        />
        <div className="ireel-toc-list" ref={listRef}>
          {sections.map((sec) => {
            const i = sec._idx;
            const full = openIds.has(sec.id);
            // Collapsed: rotate so the selected item leads the 3-item preview and
            // the following items wrap after it (4 selected → 4,5,6). Expanded:
            // natural order (the full tree).
            let items = sec.items;
            if (!full) {
              const ai = items.findIndex((it) => it.chapterId === activeId);
              if (ai > 0) items = [...items.slice(ai), ...items.slice(0, ai)];
            }
            return (
              <div
                className={`ireel-toc-group${full ? ' is-open' : ''}`}
                key={sec.id}
                ref={(el) => {
                  groupRefs.current[sec.id] = el;
                }}
              >
                {/* In edit mode the header/items keep the SAME look and single-click
                    behaviour; double-click edits the label in place. The leading
                    ▶ toggle is only shown in option 2 (see .lp-opt-2 CSS). */}
                {edit ? (
                  <div className="ireel-toc-sec">
                    <span
                      className="lp-tree-toggle"
                      onClick={() => toggle(sec.id)}
                      aria-hidden="true"
                    >
                      <svg className={`lp-tree-chev${full ? ' is-open' : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                    </span>
                    <EditText
                      as="span"
                      className="ireel-toc-name"
                      path={['outline', i, 'name']}
                      value={sec.name}
                      onActivate={() => toggle(sec.id)}
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    className="ireel-toc-sec"
                    aria-expanded={full}
                    onClick={() => toggle(sec.id)}
                  >
                    <span className="lp-tree-toggle" aria-hidden="true">
                      <svg className={`lp-tree-chev${full ? ' is-open' : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                    </span>
                    <span className="ireel-toc-name">{t(sec.name)}</span>
                  </button>
                )}
                {/* 3-item preview (rotated to lead with the selected item when
                    collapsed); the rest collapse/expand under it when open. */}
                {items.length > 0 && (
                  <div className={`lp-items${full ? ' is-open' : ''}`}>
                    <ul className="ireel-toc-items">
                      {items.slice(0, PREVIEW).map((it) => renderItem(it, it._k, i, sec))}
                    </ul>
                    {items.length > PREVIEW && (
                      <div className="lp-rest">
                        <ul className="ireel-toc-items">
                          {items.slice(PREVIEW).map((it) => renderItem(it, it._k, i, sec))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* Mobile: pinned selector, mirroring the industry reel's selector. */}
      <div className="ireel-bar lp-bar">
        <div className={`stage-chapters${menuOpen ? ' is-open' : ''}`}>
          <button
            type="button"
            className="stage-chapters-select"
            aria-haspopup="listbox"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {isHome ? (
              // Home: list every section name; these slide down into the menu
              // (and the bar empties) when it opens.
              <span className="sc-home-list">
                {sections.map((s, idx) => (
                  <span className="sc-home-sec" key={s.id}>
                    {t(s.name)}
                    {idx < sections.length - 1 ? <span className="sc-sep"> - </span> : null}
                  </span>
                ))}
              </span>
            ) : (
              <>
                <span className="sc-sec">{t(activeSection?.name || '')}</span>
                {activeItem ? (
                  <>
                    <span className="sc-sep"> - </span>
                    <span className="sc-sub">{t(activeItem.title)}</span>
                  </>
                ) : null}
              </>
            )}
          </button>
          <span className={`stage-chapters-chev${menuOpen ? ' is-open' : ''}`} aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </span>
        </div>
      </div>
      {/* Kept mounted (toggling .is-open) so it animates both open AND closed. */}
      <div
        className={`ch-menu ireel-menu lp-menu${menuOpen ? ' is-open' : ''}`}
        role="listbox"
        aria-label={t('On this page')}
        aria-hidden={!menuOpen}
      >
        {sections.map((sec, i) => {
            const full = openIds.has(sec.id);
            return (
              <div className={`ch-menu-group${full ? ' is-open' : ''}`} key={sec.id}>
                <button
                  type="button"
                  aria-expanded={full}
                  className="ch-menu-item"
                  onClick={() => toggle(sec.id)}
                >
                  <span className="lp-tree-toggle" aria-hidden="true">
                    <svg className={`lp-tree-chev${full ? ' is-open' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                  </span>
                  <span className="ch-menu-title">{t(sec.name)}</span>
                </button>
                {sec.items.length > 0 && (
                  <div className={`lp-items${full ? ' is-open' : ''}`}>
                    <ul className="ch-menu-subs">
                      {sec.items.map((it, k) => (
                        <li className="ch-menu-sub-li" key={k}>
                          <button
                            type="button"
                            className={`ch-menu-sub${it.chapterId === activeId ? ' is-active' : ''}`}
                            disabled={it.chapterId == null}
                            onClick={() => pickItem(sec.id, it.chapterId)}
                          >
                            <span className="lp-mark">{k + 1}.</span>
                            <span className="ch-menu-sub-text">{t(it.title)}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </>
  );
}
