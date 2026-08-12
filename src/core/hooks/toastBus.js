const listeners = new Set();

export function subscribeToast(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitToast({ type, message }) {
  listeners.forEach((listener) => listener({ type, message }));
}
