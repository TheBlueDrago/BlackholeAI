// Edit-block protocol: for existing sites the AI returns only the changed parts, which is far
// faster than re-emitting the whole document and lets large requests finish within the time limit.

export const EDIT_NOTE = `EDIT MODE: the website already exists (see "Current website HTML"). Do NOT output the whole document.
Instead output one or more edit blocks, each replacing an exact snippet of the current HTML:
<<<FIND
(exact text copied verbatim from the current HTML — unique, 1-15 lines)
===
(the replacement text)
>>>
To add new content, FIND a nearby anchor (e.g. a closing tag) and include it again in the replacement plus the new content. Copy FIND text exactly (whitespace included). Output only edit blocks — no explanation, no markdown fences. Make as many edits as the request needs; large multi-section changes are fine.`;

const BLOCK_RE = /<<<FIND\r?\n([\s\S]*?)\r?\n===\r?\n([\s\S]*?)\r?\n>>>/g;

export function hasEditBlocks(text) {
  return /<<<FIND\r?\n[\s\S]*?\r?\n===\r?\n[\s\S]*?\r?\n>>>/.test(text || "");
}

// Returns { html, failed } — failed lists FIND snippets that weren't found in the document.
export function applyEdits(html, text) {
  let out = html;
  const failed = [];
  let m;
  BLOCK_RE.lastIndex = 0;
  while ((m = BLOCK_RE.exec(text))) {
    const find = m[1];
    const replace = m[2];
    if (out.includes(find)) {
      out = out.replace(find, () => replace);
    } else if (out.includes(find.trim())) {
      out = out.replace(find.trim(), () => replace);
    } else {
      failed.push(find);
    }
  }
  return { html: out, failed };
}