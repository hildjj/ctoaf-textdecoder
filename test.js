'use strict'

const assert = require('assert')

const TextDecoder = require('./')
const td = new TextDecoder('utf8', {fatal: true, ignoreBOM: true})

assert.equal(td.decode(Buffer.from('E282AC', 'hex')), '€')
assert.throws(() => td.decode(Buffer.from('E1A0C0', 'hex')))
