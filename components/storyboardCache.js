// What the storyboard keeps in this browser between visits (the user, 2026-10-22: "cache everything so it can make it super fast for
// me, it can use my local storage"): IndexedDB, as big as the browser lets it be (localStorage holds 5 MB in all, less than the boards'
// edits together). Every call resolves, never throws: without IndexedDB (a private window, cleared site data) it answers null and
// the page does what it did before, from the file.
//   boards: a board's edits as this browser last had them -> {rev, edits, pending} (pending: not yet in the file)
const NAME = 'storyboard', VERSION = 1, STORES = ['boards'];

let opening = null;
const open = () => (opening ??= new Promise(resolve => {
  try {
    const request = indexedDB.open(NAME, VERSION);
    request.onupgradeneeded = () => { for (const store of STORES) if (!request.result.objectStoreNames.contains(store)) request.result.createObjectStore(store); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = request.onblocked = () => resolve(null);
  } catch { resolve(null); }
}));
const run = (store, mode, work) => open().then(db => new Promise(resolve => {
  if (!db) { resolve(null); return; }
  try {
    const tx = db.transaction(store, mode), request = work(tx.objectStore(store));
    tx.oncomplete = () => resolve(request?.result ?? null);
    tx.onerror = tx.onabort = () => resolve(null);
  } catch { resolve(null); }
}));

export const cacheGet = (store, key) => run(store, 'readonly', s => s.get(key));
export const cachePut = (store, key, value) => run(store, 'readwrite', s => s.put(value, key));
