'use strict';

function formatConflict(conflict) {
  const path = conflict.path || '<root>';
  const oursRepr = JSON.stringify(conflict.ours);
  const theirsRepr = JSON.stringify(conflict.theirs);
  return [
    `<<<<<<< OURS at ${path}`,
    oursRepr,
    '=======',
    theirsRepr,
    `>>>>>>> THEIRS at ${path}`
  ].join('\n');
}

function formatAll(conflicts) {
  if (!Array.isArray(conflicts)) {
    throw new Error('deltaMarkerFormatter: conflicts must be an array');
  }
  return conflicts.map(formatConflict).join('\n\n');
}

function summarizeConflicts(conflicts) {
  if (!Array.isArray(conflicts)) return { total: 0, byKind: {} };
  const byKind = {};
  for (const c of conflicts) {
    const key = `${c.ours.kind}/${c.theirs.kind}`;
    byKind[key] = (byKind[key] || 0) + 1;
  }
  return { total: conflicts.length, byKind };
}

module.exports = { formatConflict, formatAll, summarizeConflicts };
