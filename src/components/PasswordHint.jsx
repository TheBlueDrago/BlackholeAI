import React from "react";
import { Check, AlertCircle } from "lucide-react";
import { MIN_PASSWORD, passwordProblem, passwordStrength } from "@/lib/passwordCheck";

// The line under a new-password field: the rule before anything's typed, then what's wrong
// with it, or how strong it is.
export default function PasswordHint({ id, password, email }) {
  const problem = password ? passwordProblem(password, email) : "";
  let body;
  if (!password) body = <span className="text-muted-foreground">At least {MIN_PASSWORD} characters. A few random words together is easy to remember and hard to guess.</span>;
  else if (problem) {
    body = (
      <span className="flex items-start gap-1.5 text-amber-400">
        <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" /> {problem}
      </span>
    );
  } else {
    const strong = passwordStrength(password) === "strong";
    body = (
      <span className="flex items-start gap-1.5 text-emerald-400">
        <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" /> {strong ? "Strong password." : "Good. Longer is even safer."}
      </span>
    );
  }
  return (
    <p id={id} className="text-xs" aria-live="polite">
      {body}
    </p>
  );
}
