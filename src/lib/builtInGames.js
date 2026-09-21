import { VECK_SHOOTER_META, VECK_SHOOTER_HTML } from "./veckShooterGame";
import { PULSE_JUMP_META, PULSE_JUMP_HTML } from "./pulseJumpGame";

// Games shipped directly in the app bundle. They list and play without touching
// the Base44 backend (PublishedGame entity, publish-game/get-game-html functions),
// so they keep working even when those integrations are unavailable or over quota.
export const BUILT_IN_GAMES = [
  { ...VECK_SHOOTER_META, html: VECK_SHOOTER_HTML },
  { ...PULSE_JUMP_META, html: PULSE_JUMP_HTML },
];

export function findBuiltInGame(name) {
  return BUILT_IN_GAMES.find((g) => g.name === name) || null;
}

// Shaped like PublishedGame rows so they can be merged straight into game lists.
export function builtInGameEntities() {
  return BUILT_IN_GAMES.map((g) => ({
    id: "builtin-" + g.name,
    name: g.name,
    title: g.title,
    genre: g.genre,
    plays: 0,
    hidden: false,
    builtIn: true,
  }));
}
