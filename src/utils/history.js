export function pushHistory(row, action, detail = "") {
  const h = [...(row.history || []), { t: new Date().toISOString(), action, detail }];
  return h.slice(-20);
}
