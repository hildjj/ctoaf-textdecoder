'use strict';

const assert = require('assert');
const TxtD = require('./');
const Polyfill = require('./polyfill.js');

const invalid = [
  'E1A0C0', // Expected 3 bytes, truncated
  '61FF61', // Too many bytes for FF
  '61AC', // AC is continuation, unexpected at start
  'EF61', // EF truncated, should be two bytes
  'E2E282AC', // First E2 truncated, should be three bytes before second E2
  'F8', // Too many bytes requested
  'FF', // Too many bytes requested
  'C080', // Should have been 0x00
  'E08080', // Should have been 0x00
  'F080A080', // Should have been 0x00
  'E08280', // Should have been 0xc280
  'EDA080', // Surrogate
  'EDBE80', // Surrogate
  'EDA080EDB080', // Surrogate pair
  'BF', // Last continuation byte
  '80BF', // Two continuation bytes
  'C020', // Truncated
  'C0AF', // Overlong
  'E080AF', // Overlong
  'F08080AF', // Overlong
  'F8808080AF', // Overlong
  'FC80808080AF', // Overlong
  'C1BF', // Overlong
];

function test(TD) {
  assert.throws(() => new TD('foo'));

  const td = new TD('utf8', {fatal: true, ignoreBOM: true});
  assert.equal(td.decode(Buffer.from('E282AC', 'hex')), '€');
  assert.equal(td.decode(Buffer.from('EFBBBFE282AC', 'hex')), '\ufeff€');
  assert.throws(() => td.decode('foo'));
  for (const inv of invalid) {
    assert.throws(() => td.decode(Buffer.from(inv, 'hex')), inv);
  }

  const buf = Buffer.from('FFFFE282AC61FFFF', 'hex');
  // Slice uses begin/end, not length.
  // Make sure we're truncated so that we can reason about slices.
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  // Uint16Array uses byte offset, then count of 16-bit words.
  const u = new Uint16Array(ab, 2, 2);
  assert.equal(td.decode(u), '€a');

  const td2 = new TD('utf8', {fatal: true, ignoreBOM: false});
  assert.equal(td2.decode(Buffer.from('EFBBBFE282AC', 'hex')), '€');
  assert.equal(td2.decode(Buffer.from('666F6FE282', 'hex'), {stream: true}), 'foo');
  assert.equal(td2.decode(Buffer.from('AC', 'hex'), {stream: true}), '€');
  assert.equal(td2.decode(Buffer.from('666F6FE2', 'hex'), {stream: true}), 'foo');
  assert.equal(td2.decode(Buffer.from('82AC', 'hex'), {stream: true}), '€');
  assert.equal(td2.decode(Buffer.from('666F6FE282ACE2', 'hex'), {stream: true}), 'foo€');
  assert.equal(td2.decode(Buffer.from('82', 'hex'), {stream: true}), '');
  assert.equal(td2.decode(Buffer.from('AC', 'hex'), {stream: true}), '€');

  for (const inv of invalid) {
    assert.throws(() => td2.decode(Buffer.from(inv, 'hex'), {stream: true}), inv);
  }

  assert.throws(() => td2.decode(Buffer.from('FF', 'hex')));
  assert.throws(() => td2.decode(Buffer.from('AC', 'hex')));
  assert.throws(() => td2.decode(Buffer.from('EF61', 'hex')));
  assert.throws(() => td2.decode(Buffer.from('E282', 'hex')));

  const td3 = new TD();
  assert.equal(td3.decode(Buffer.from('EFBBBFE282AC', 'hex')), '€');
  assert.equal(td3.decode(Buffer.from('61FF61', 'hex')), 'a\ufffda');
  assert.equal(td3.decode(Buffer.from('61AC', 'hex')), 'a\ufffd');
  assert.equal(td3.decode(Buffer.from('EF61', 'hex')), '\ufffda');
  assert.equal(td3.decode(Buffer.from('E2E282AC', 'hex')), '\ufffd€');
  assert.equal(td3.decode(Buffer.from('E282', 'hex')), '\ufffd');
  assert.equal(td3.decode(ab), '\ufffd\ufffd€a\ufffd\ufffd');

  for (const inv of invalid) {
    assert.doesNotThrow(() => td3.decode(Buffer.from(inv, 'hex')), inv);
  }
}

// Test the selected version.  Uninteresting if we're using the native
// version, except to ensure we've created the same interface with the
// polyfill.
test(TxtD);

assert(Polyfill);
test(Polyfill);
