'use client';

// Inline editing for the landing page. Wrap the landing in <EditProvider> (used
// only on /admin) and the bound text/icon/video controls become editable in
// place: double-click text to edit, click an icon to cycle it, click the frame
// badge to upload a cover video. A floating <SaveBar> persists to the local API.

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { DEFAULT_LANDING, BADGE_ICONS } from '@/lib/landingDefaults';
import { BadgeIcon } from '@/components/HeroVideo';

const clone = (o) => JSON.parse(JSON.stringify(o));

function setByPath(obj, path, value) {
  let node = obj;
  for (let i = 0; i < path.length - 1; i += 1) {
    if (node[path[i]] == null) node[path[i]] = typeof path[i + 1] === 'number' ? [] : {};
    node = node[path[i]];
  }
  node[path[path.length - 1]] = value;
  return obj;
}

const EditContext = createContext(null);
export const useEdit = () => useContext(EditContext);

export function EditProvider({ children }) {
  const [content, setContent] = useState(DEFAULT_LANDING);
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetch('/api/landing-content')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setContent(d))
      .catch(() => {});
  }, []);

  const patch = useCallback((path, value) => {
    setContent((cur) => setByPath(clone(cur), path, value));
  }, []);

  const save = useCallback(async () => {
    setStatus('Saving…');
    try {
      const res = await fetch('/api/landing-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      });
      if (!res.ok) throw new Error(await res.text());
      setStatus('Saved ✓');
    } catch (err) {
      setStatus('Error: ' + err.message);
    }
  }, [content]);

  const uploadVideo = useCallback(async (path, file) => {
    if (!file) return;
    setStatus('Uploading…');
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await fetch('/api/landing-upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'upload failed');
      patch(path, data.url);
      setStatus('Uploaded — click Save');
    } catch (err) {
      setStatus('Error: ' + err.message);
    }
  }, [patch]);

  return (
    <EditContext.Provider value={{ editing: true, content, patch, save, uploadVideo, status }}>
      {children}
    </EditContext.Provider>
  );
}

// Double-click-to-edit text bound to a content path. Outside edit mode it just
// renders the value.
export function EditText({ value, path, as = 'span', className = '', multiline = false, onActivate }) {
  const ctx = useEdit();
  const ref = useRef(null);
  const busy = useRef(false);
  const clickTimer = useRef(null);
  const Tag = as;

  // Keep the DOM text in sync with the value, but never while the user is typing.
  useEffect(() => {
    if (ref.current && !busy.current && ref.current.innerText !== (value ?? '')) {
      ref.current.innerText = value ?? '';
    }
  }, [value]);

  if (!ctx?.editing) return <Tag className={className}>{value}</Tag>;

  return (
    <Tag
      ref={ref}
      className={`${className} edit-text`}
      title="Double-click to edit"
      suppressContentEditableWarning
      onClick={() => {
        if (!onActivate || busy.current || clickTimer.current) return;
        // Wait briefly to tell a single click (activate) from a double (edit).
        clickTimer.current = setTimeout(() => {
          clickTimer.current = null;
          onActivate();
        }, 220);
      }}
      onDoubleClick={(e) => {
        if (clickTimer.current) {
          clearTimeout(clickTimer.current);
          clickTimer.current = null;
        }
        busy.current = true;
        e.currentTarget.contentEditable = 'true';
        e.currentTarget.focus();
      }}
      onBlur={(e) => {
        busy.current = false;
        e.currentTarget.contentEditable = 'false';
        ctx.patch(path, e.currentTarget.innerText.replace(/ /g, ' '));
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !multiline) {
          e.preventDefault();
          e.currentTarget.blur();
        } else if (e.key === 'Escape') {
          e.currentTarget.innerText = value ?? '';
          e.currentTarget.blur();
        }
      }}
    />
  );
}

// Click-to-cycle badge icon. Outside edit mode it renders the icon plainly.
export function EditIcon({ name, path }) {
  const ctx = useEdit();
  if (!ctx?.editing) return <BadgeIcon name={name} />;
  return (
    <button
      type="button"
      className="edit-icon"
      title="Click to change icon"
      onClick={() => {
        const i = BADGE_ICONS.indexOf(name);
        ctx.patch(path, BADGE_ICONS[(i + 1) % BADGE_ICONS.length]);
      }}
    >
      <BadgeIcon name={name} />
    </button>
  );
}

// Cover-video upload affordance shown on the frame in edit mode.
export function EditVideoButton({ path }) {
  const ctx = useEdit();
  const input = useRef(null);
  if (!ctx?.editing) return null;
  return (
    <>
      <button
        type="button"
        className="edit-video-btn"
        title="Upload cover video"
        onClick={() => input.current?.click()}
      >
        ⬆ Video
      </button>
      <input
        ref={input}
        type="file"
        accept="video/*"
        hidden
        onChange={(e) => ctx.uploadVideo(path, e.target.files?.[0])}
      />
    </>
  );
}

export function SaveBar() {
  const ctx = useEdit();
  if (!ctx?.editing) return null;
  return (
    <div className="edit-savebar">
      <span className="edit-savebar-title">Editing landing</span>
      <span className="edit-savebar-status">{ctx.status}</span>
      <a className="edit-savebar-btn" href="/" target="_blank" rel="noreferrer">Open ↗</a>
      <button type="button" className="edit-savebar-btn edit-savebar-btn--primary" onClick={ctx.save}>
        Save
      </button>
    </div>
  );
}
