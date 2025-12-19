
/* FILE: apps/web/src/storage/changes.ts */
type Listener = () => void;

let listeners: Listener[] = [];
let dirty = false;

export function markDirty() {
  dirty = true;
  for (const l of listeners) l();
}

export function consumeDirty(): boolean {
  const was = dirty;
  dirty = false;
  return was;
}

export function subscribeChanges(listener: Listener) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((x) => x !== listener);
  };
}
