import { useEffect } from "react";

// The browser tab (and what screen readers announce on arrival): "Sign in · Blackhole AI".
export default function usePageTitle(title) {
  useEffect(() => {
    if (!title) return undefined;
    document.title = `${title} · Blackhole AI`;
    return () => {
      document.title = "Blackhole AI";
    };
  }, [title]);
}

// Titles for the signed-in pages under /chat (and a few next to it).
const APP_TITLES = [
  [/^\/chat\/?$/, "Chat"],
  [/^\/chat\/code/, "Blackhole Code"],
  [/^\/chat\/designer/, "Website Designer"],
  [/^\/chat\/game-designer/, "Game Designer"],
  [/^\/chat\/games/, "Games"],
  [/^\/chat\/game\//, "Game"],
  [/^\/chat\/browser/, "Blackhole Browser"],
  [/^\/chat\/(shop|plans)/, "Shop"],
  [/^\/chat\/monitor/, "Monitor"],
  [/^\/chat\/promos/, "Promo codes"],
  [/^\/chat\/settings/, "Settings"],
];
export const appTitleFor = (pathname) => (APP_TITLES.find(([re]) => re.test(pathname)) || [])[1] || "";
