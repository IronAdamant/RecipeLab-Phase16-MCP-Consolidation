'use strict';

// seasonRules — map seasons to tag affinities. Pure data + lookup helpers.

const RULES = {
  winter: { tags: ['comfort', 'soup', 'roast', 'stew'], avoidTags: ['salad', 'cold'] },
  spring: { tags: ['fresh', 'salad', 'asparagus', 'pea'],   avoidTags: ['heavy'] },
  summer: { tags: ['grill', 'salad', 'cold', 'fruit'],     avoidTags: ['stew', 'roast'] },
  fall:   { tags: ['squash', 'apple', 'roast', 'spice'],    avoidTags: ['cold'] }
};

const SEASONS = Object.freeze(['winter', 'spring', 'summer', 'fall']);

function getRules(season) {
  if (!RULES[season]) return { tags: [], avoidTags: [] };
  return { tags: RULES[season].tags.slice(), avoidTags: RULES[season].avoidTags.slice() };
}

function isSeason(name) {
  return SEASONS.indexOf(name) >= 0;
}

function listSeasons() {
  return SEASONS.slice();
}

function tagAffinity(season, tag) {
  const r = RULES[season];
  if (!r) return 0;
  if (r.avoidTags.indexOf(tag) >= 0) return -1;
  if (r.tags.indexOf(tag) >= 0) return 1;
  return 0;
}

module.exports = { RULES, SEASONS, getRules, isSeason, listSeasons, tagAffinity };
