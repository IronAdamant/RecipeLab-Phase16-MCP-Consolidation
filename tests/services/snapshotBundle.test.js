'use strict';

const { describe, test, assert } = require('../testRunner');
const orchestrator = require('../../src/services/snapshotBundle/bundleOrchestrator');
const schema = require('../../src/services/snapshotBundle/bundleSchema');
const compressor = require('../../src/services/snapshotBundle/bundleCompressor');
const encoder = require('../../src/services/snapshotBundle/bundleEncoder');
const manifest = require('../../src/services/snapshotBundle/bundleManifest');
const writer = require('../../src/services/snapshotBundle/bundleWriter');

const SAMPLE_ENTRIES = [
  {
    id: 'r1',
    name: 'Tomato Soup',
    ingredients: [{ name: 'tomato', quantity: 500, unit: 'g' }],
    instructions: ['Blend', 'Heat'],
    tags: ['soup'],
    metadata: { author: 'test' }
  },
  {
    id: 'r2',
    name: 'Salad',
    ingredients: [{ name: 'lettuce', quantity: 200, unit: 'g' }],
    instructions: ['Wash', 'Chop'],
    tags: ['salad'],
    metadata: { author: 'test' }
  }
];

describe('snapshotBundle.schema', () => {
  test('validateEntry passes for valid entry', () => {
    assert.strictEqual(schema.validateEntry(SAMPLE_ENTRIES[0]).ok, true);
  });

  test('validateEntry fails for missing fields', () => {
    assert.strictEqual(schema.validateEntry({ id: 'x' }).ok, false);
  });
});

describe('snapshotBundle.compressor', () => {
  test('compresses runs of repeated characters', () => {
    const compressed = compressor.compressText('aaaaaa');
    assert.ok(compressed.length < 6);
  });

  test('decompress reverses compress', () => {
    const original = 'hello world aaaaaa bbbbbbbbbb ccc';
    assert.strictEqual(compressor.decompressText(compressor.compressText(original)), original);
  });
});

describe('snapshotBundle.encoder', () => {
  test('base64 roundtrip', () => {
    const original = 'hello world';
    assert.strictEqual(encoder.decodeFromBase64(encoder.encodeToBase64(original)), original);
  });
});

describe('snapshotBundle.manifest', () => {
  test('builds manifest with all chunks checksummed', () => {
    const { manifest: m, packet } = manifest.manifestFromEntries(SAMPLE_ENTRIES);
    assert.strictEqual(m.entryCount, 2);
    assert.strictEqual(m.chunkChecksums.length, packet.chunks.length);
  });

  test('entryIds match input', () => {
    const { manifest: m } = manifest.manifestFromEntries(SAMPLE_ENTRIES);
    assert.deepStrictEqual(m.entryIds, ['r1', 'r2']);
  });
});

describe('snapshotBundle.writer', () => {
  test('writeToBuffer produces magic header', () => {
    const buffer = writer.writeToBuffer(SAMPLE_ENTRIES);
    assert.strictEqual(buffer.header.magic, 'RLBUNDLE');
  });

  test('serialize/parse roundtrip', () => {
    const buffer = writer.writeToBuffer(SAMPLE_ENTRIES);
    const serialized = writer.serializeBuffer(buffer);
    const parsed = writer.parseBuffer(serialized);
    assert.strictEqual(parsed.manifest.entryCount, 2);
  });
});

describe('snapshotBundle.orchestrator', () => {
  test('createBundle returns verified bundle', () => {
    const result = orchestrator.createBundle(SAMPLE_ENTRIES);
    assert.strictEqual(result.verification.ok, true);
    assert.strictEqual(result.buffer.manifest.entryCount, 2);
  });

  test('loadBundle parses and verifies', () => {
    const created = orchestrator.createBundle(SAMPLE_ENTRIES);
    const loaded = orchestrator.loadBundle(created.serialized);
    assert.strictEqual(loaded.entries.length, 2);
    assert.strictEqual(loaded.entries[0].id, 'r1');
    assert.strictEqual(loaded.entries[1].id, 'r2');
  });

  test('roundTrip preserves all entry data', () => {
    const { loaded } = orchestrator.roundTrip(SAMPLE_ENTRIES);
    assert.deepStrictEqual(loaded.entries[0].ingredients, SAMPLE_ENTRIES[0].ingredients);
    assert.deepStrictEqual(loaded.entries[1].instructions, SAMPLE_ENTRIES[1].instructions);
  });

  test('loadBundle rejects invalid serialized input', () => {
    assert.throws(() => orchestrator.loadBundle('not a json'));
  });
});
