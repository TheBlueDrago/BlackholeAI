import React from "react";

// The Nebulux AI logo (a nebula), used in headers, the chat and loading spinners.
export default function BlackholeIcon({ className = "" }) {
  return <img src="/logo.png" alt="" aria-hidden="true" draggable="false" className={`rounded-[22%] object-cover select-none ${className}`} />;
}
