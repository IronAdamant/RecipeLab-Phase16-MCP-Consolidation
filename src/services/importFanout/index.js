'use strict';

const entrypoint = require('./fanoutEntrypoint');

module.exports = {
  scaleBatch: entrypoint.scaleBatch,
  analyzeBatch: entrypoint.analyzeBatch,
  scaleSingle: entrypoint.scaleSingle
};
