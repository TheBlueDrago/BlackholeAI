import React from "react";

const LIMIT = 5 * 1024 * 1024; // publish-site/publish-game refuse pages over 5 MB

// Shown in the publish window: how big the page is (attached images add most of it),
// with a warning before it reaches the publish limit.
export default function PageSize({ html }) {
  if (!html) return null;
  const bytes = new Blob([html]).size;
  if (bytes < 1024 * 1024) return null;
  const mb = (bytes / 1024 / 1024).toFixed(1);
  const over = bytes > LIMIT;
  const near = bytes > LIMIT * 0.8;
  return (
    <p className={`text-xs mt-3 ${over ? "text-red-400" : near ? "text-amber-300" : "text-slate-500"}`}>
      Page size: {mb} MB of 5 MB.
      {over ? " Too big to publish — remove some images or ask the AI to use fewer." : near ? " Close to the limit — each extra image adds to it." : ""}
    </p>
  );
}
