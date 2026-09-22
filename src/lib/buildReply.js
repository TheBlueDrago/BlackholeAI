// The website and game designers ask the AI to explain what it's doing: a short
// intro, then the code, then a "What I did" summary. These helpers split that reply
// into the code (which drives the preview) and the explanation (shown in chat).

export const EXPLAIN_NOTE = `EXPLAIN YOUR WORK: before the code, write one or two short, friendly sentences saying what you're about to build or change and how (e.g. "Sure — I'll add a pricing section with three plans and a monthly/yearly toggle."). After the code, write "What I did:" followed by 2-5 short bullet points ("- ...") describing the actual changes. Keep the explanation in plain text, outside the code.`;

function tidy(text) {
  return String(text || "")
    .replace(/```[a-z]*\s*```/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Full-document reply: the HTML is the fenced block (or bare document) that holds
// <!DOCTYPE html>/<html>; everything around it is the explanation.
export function splitBuildReply(text) {
  const t = String(text || "");
  const fenceRe = /```(?:html)?[ \t]*\r?\n?([\s\S]*?)```/gi;
  let m;
  while ((m = fenceRe.exec(t))) {
    if (/<!doctype html|<html[\s>]/i.test(m[1])) {
      return { html: m[1].trim(), note: tidy(t.slice(0, m.index) + "\n\n" + t.slice(m.index + m[0].length)) };
    }
  }
  const start = t.search(/<!doctype html|<html[\s>]/i);
  if (start >= 0) {
    const endM = /<\/html>/i.exec(t.slice(start));
    const end = endM ? start + endM.index + endM[0].length : t.length;
    return { html: t.slice(start, end).trim(), note: tidy(t.slice(0, start) + "\n\n" + t.slice(end)) };
  }
  return { html: "", note: t.trim() };
}

// Edit-block reply (see htmlEdits.js): the explanation is whatever isn't an edit block.
export function editReplyNote(text) {
  return tidy(String(text || "").replace(/<<<FIND\r?\n[\s\S]*?\r?\n===\r?\n[\s\S]*?\r?\n>>>/g, "").replace(/```[a-z]*/gi, ""));
}

// The explanation a cut-off reply managed to get out before the code started.
export function introBeforeCode(text) {
  const t = String(text || "");
  const i = t.search(/```|<<<FIND|<!doctype html|<html[\s>]/i);
  return tidy(i >= 0 ? t.slice(0, i) : t);
}
