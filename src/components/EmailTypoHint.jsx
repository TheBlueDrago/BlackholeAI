import React, { useState } from "react";
import { emailSuggestion } from "@/lib/emailTypo";

export const HINT_ID = "email-suggestion";

// "Did you mean …@gmail.com?" under an email field (src/lib/emailTypo.js), once the field is
// left rather than while typing. Spread `fieldProps` on the email input. Where a wrong address
// means an email that never arrives (sign-up code, reset link), call pauseForTypo() first
// when submitting: the first time, it shows the hint and returns true instead of going on.
export function useEmailTypo(email) {
  const [left, setLeft] = useState(false);
  const [asked, setAsked] = useState("");
  const fix = emailSuggestion(email);
  const suggestion = left || asked === email ? fix : "";
  return {
    suggestion,
    pauseForTypo: () => {
      if (!fix || asked === email) return false;
      setAsked(email);
      return true;
    },
    fieldProps: {
      onFocus: () => setLeft(false),
      onBlur: () => setLeft(true),
      "aria-describedby": suggestion ? HINT_ID : undefined,
    },
  };
}

export default function EmailTypoHint({ suggestion, onPick, className = "text-sm text-muted-foreground", linkClassName = "text-foreground" }) {
  if (!suggestion) return null;
  return (
    <p id={HINT_ID} role="status" className={className}>
      Did you mean{" "}
      <button type="button" onClick={() => onPick(suggestion)} className={`font-medium underline underline-offset-2 ${linkClassName}`}>
        {suggestion}
      </button>
      ?
    </p>
  );
}
