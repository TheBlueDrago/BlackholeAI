// Published games are edited from multiple, independently-mounted places (the Settings
// overlay sits on top of GamesFront without remounting it), so a delete/hide there wouldn't
// otherwise be reflected until the games page is fully left and re-entered. This tiny event
// bus lets any mutation site announce the change and any listener (e.g. GamesFront) refetch.
const EVENT = "blackhole:games-changed";

export function notifyGamesChanged() {
  window.dispatchEvent(new Event(EVENT));
}

export function onGamesChanged(handler) {
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
