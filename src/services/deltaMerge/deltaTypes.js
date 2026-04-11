'use strict';

const DeltaKind = Object.freeze({
  ADD: 'add',
  REMOVE: 'remove',
  REPLACE: 'replace',
  LIST_APPEND: 'list_append',
  LIST_REMOVE: 'list_remove'
});

function addOp(path, value) {
  return { kind: DeltaKind.ADD, path, value };
}
function removeOp(path, value) {
  return { kind: DeltaKind.REMOVE, path, value };
}
function replaceOp(path, before, after) {
  return { kind: DeltaKind.REPLACE, path, before, after };
}
function listAppendOp(path, value) {
  return { kind: DeltaKind.LIST_APPEND, path, value };
}
function listRemoveOp(path, value) {
  return { kind: DeltaKind.LIST_REMOVE, path, value };
}

function isDeltaOp(op) {
  return (
    op &&
    typeof op === 'object' &&
    typeof op.kind === 'string' &&
    typeof op.path === 'string' &&
    Object.values(DeltaKind).includes(op.kind)
  );
}

module.exports = {
  DeltaKind,
  addOp,
  removeOp,
  replaceOp,
  listAppendOp,
  listRemoveOp,
  isDeltaOp
};
