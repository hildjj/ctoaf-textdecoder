'use strict'

const assert = require('assert')

const TxtD = require('./')

function test(TD) {
  const td = new TD('utf8', {fatal: true, ignoreBOM: true})
  assert.equal(td.decode(Buffer.from('E282AC', 'hex')), '€')
  assert.equal(td.decode(Buffer.from('EFBBBFE282AC', 'hex')), '\ufeff€')
  assert.throws(() => td.decode(Buffer.from('E1A0C0', 'hex')))

  const td2 = new TD('utf8', {fatal: true, ignoreBOM: false})
  assert.equal(td2.decode(Buffer.from('EFBBBFE282AC', 'hex')), '€')
  assert.equal(td2.decode(Buffer.from('666F6FE282', 'hex'), {stream: true}), 'foo')
  assert.equal(td2.decode(Buffer.from('AC', 'hex'), {stream: true}), '€')
  assert.equal(td2.decode(Buffer.from('666F6FE2', 'hex'), {stream: true}), 'foo')
  assert.equal(td2.decode(Buffer.from('82AC', 'hex'), {stream: true}), '€')
  assert.equal(td2.decode(Buffer.from('666F6FE282ACE2', 'hex'), {stream: true}), 'foo€')
  assert.equal(td2.decode(Buffer.from('82', 'hex'), {stream: true}), '')
  assert.equal(td2.decode(Buffer.from('AC', 'hex'), {stream: true}), '€')

  // This should throw, but we can't detect trailing invalid encoding in
  // stream mode. See: https://github.com/hildjj/ctoaf-textdecoder/issues/4
  // assert.throws(
  //   () => td2.decode(Buffer.from('E1A0C0', 'hex'), {stream: true})
  // )

  const td3 = new TD()
  assert.equal(td3.decode(Buffer.from('EFBBBFE282AC', 'hex')), '€')
}

// Test the selected version.  Uninteresting if we're using the native version.
test(TxtD)

if ((typeof TextDecoder !== 'undefined') &&
    (typeof Symbol === 'function') &&
    (typeof Symbol.for === 'function')) {
  // Test the polyfill version explicitly
  assert.equal(TxtD, TextDecoder)
  const Polyfill = TxtD[Symbol.for('@cto.af/textdecoder/polyfill')]
  assert(Polyfill)
  test(Polyfill)
}
