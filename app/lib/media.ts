/**
 * Subscribes to a media query's `change` events and returns an unsubscribe function.
 * Safari < 14 only has the legacy addListener/removeListener on MediaQueryList.
 */
export function subscribeMedia(list: MediaQueryList, callback: () => void): () => void {
  if (list.addEventListener) {
    list.addEventListener('change', callback);
    return () => list.removeEventListener('change', callback);
  }
  list.addListener(callback);
  return () => list.removeListener(callback);
}
