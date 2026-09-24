import React from "react";

// A form field people never see (it's off-screen and skipped by the keyboard and screen
// readers), but spam bots fill in every field they find. The server quietly drops anything
// that arrives with it filled (cloudflare-lib/honeypot.js).
export default function Honeypot({ value, onChange }) {
  return (
    <div aria-hidden="true" className="absolute -left-[10000px] top-auto w-px h-px overflow-hidden">
      <label>
        Website
        <input type="text" name="website" tabIndex={-1} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} />
      </label>
    </div>
  );
}
