// The rows of the missions in a state on a board's table (`data-ov-state` on each row: components/OverviewScene.jsx), from their left edge to the right of the column `to`, as far as the
// rows' list shows them: what an outline 'rows:<state>:<column>' goes round (the CEO, 2026-10-20: "highlighting rows instead of columns"). Used by the page's centering (`useCenter`,
// components/sections/parts.jsx) and the video's big board (`remeasureMarks`, components/storyboardPlayerDom.js); the capture's `extract` measures it the same way (it has to be self-contained).
// -> {left, top, right, bottom} in client px, or null.
export function rowsRect(root, state, to) {
  const th = root.querySelector(`th[data-iq-col="${to}"]`), area = th?.closest('.ow-table-scroll')?.querySelector('.iq-ow-rows');
  if (!th || !area) return null;
  const A = area.getBoundingClientRect(), rows = [...area.querySelectorAll(`tr[data-ov-state="${state}"]`)].filter(tr => { const q = tr.getBoundingClientRect(); return q.bottom > A.top + 1 && q.top < A.bottom - 1; });
  const rs = rows.map(tr => tr.getBoundingClientRect()), name = rows.map(tr => (tr.querySelector('.ow-number') ?? tr).getBoundingClientRect().left); // (from the mission's number: the tree's lines before it are not the mission, and the outline stays inside a board shown edge to edge)
  return rs.length ? {left: Math.min(...name), top:Math.max(A.top, Math.min(...rs.map(q => q.top))), right: th.getBoundingClientRect().right, bottom: Math.min(A.bottom, Math.max(...rs.map(q => q.bottom)))} : null;
}
