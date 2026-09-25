// Form messages as a CSV file (opens in Excel, Numbers or Google Sheets): one row per message,
// one column per field label, newest first. A cell that starts like a formula gets a leading
// apostrophe, so a visitor can't slip a spreadsheet formula into the owner's file.
export function messagesCsv(messages, when = (at) => new Date(at).toLocaleString()) {
  const labels = [...new Set(messages.flatMap((m) => m.fields.map(([l]) => l)))];
  const cell = (v) => {
    let t = String(v ?? "");
    if (/^[=+\-@\t\r]/.test(t)) t = "'" + t;
    return /[",\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  const rows = messages.map((m) => [when(m.at), ...labels.map((l) => (m.fields.find(([k]) => k === l) || [])[1] || "")]);
  return [["Received", ...labels], ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
}
