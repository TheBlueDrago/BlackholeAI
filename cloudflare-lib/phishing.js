// Checked by publish() in published.js before a site or game goes live: refuses pages
// whose forms send passwords or card numbers to another website (the classic phishing
// page). No imports, so published.js can use it without a circular import.

// Finds a <form> that collects a password or card number and submits it to another
// website. Returns a short description of what was found, or "" if the page is fine.
// Forms that post to this page, a relative path, or a blackhole-ai-tech.com address
// are allowed (sites built here can't receive form posts anyway).
export function findCredentialForm(html) {
  const text = String(html || "");
  const forms = text.match(/<form\b[^>]*>[\s\S]*?(<\/form>|$)/gi) || [];
  for (const form of forms) {
    const open = form.match(/<form\b[^>]*>/i)[0];
    const action = (open.match(/\baction\s*=\s*["']?([^"'\s>]+)/i) || [])[1] || "";
    const sensitive =
      /<input\b[^>]*\btype\s*=\s*["']?password\b/i.test(form)
        ? "password"
        : /\b(autocomplete|name|id)\s*=\s*["']?(cc-number|cc-csc|cardnumber|card[-_]?number|cvv|cvc|card[-_]?cvc)\b/i.test(form)
          ? "card number"
          : "";
    if (sensitive && isExternal(action)) return `a form that sends a ${sensitive} to ${hostOf(action)}`;
  }
  return "";
}

function isExternal(action) {
  if (!/^(https?:)?\/\//i.test(action)) return false;
  const host = hostOf(action);
  return !(host === "blackhole-ai-tech.com" || host.endsWith(".blackhole-ai-tech.com") || host.endsWith("nebuluxai.pages.dev"));
}

function hostOf(url) {
  try {
    return new URL(url, "https://x.invalid").hostname.toLowerCase();
  } catch {
    return "another website";
  }
}
