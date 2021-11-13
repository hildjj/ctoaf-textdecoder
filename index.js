'use strict'

function add(t, v) {
  return t + v
}

class TextDecoderPolyfill {
  constructor(utfLabel, options) {
    this.utfLabel = utfLabel || 'utf-8'
    options = options || {}
    this.fatal = Boolean(options.fatal)
    this.ignoreBOM = Boolean(options.ignoreBOM)
    this.buffer = null
  }

  decode(buf, options) {
    // This isn't very good, but people should use more modern things
    // so they don't need it.
    const stream = Boolean(options && options.stream)
    if (stream && this.buffer) {
      buf = Buffer.concat([this.buffer, buf])
      this.buffer = null
    }
    let str = buf.toString(this.utfLabel)
    if (stream) {
      if (str.codePointAt(str.length - 1) === 0xFFFD) {
        // Truncated character at the end
        str = str.slice(0, -1)
        let start = buf.length - 1
        while ((start >= 0) && (buf[start] & 0x80)) {
          start--
        }
        this.buffer = buf.slice(start + 1)
      }
    }
    if (this.fatal) {
      for (const c of str) {
        // The default Buffer.prototype.toString() implementation uses
        // U+FFFD: REPLACEMENT CHARACTER
        // for any bad UTF encoding.
        if (c.codePointAt(0) === 0xFFFD) {
          const err = new TypeError(
            '[ERR_ENCODING_INVALID_ENCODED_DATA]: ' +
            'The encoded data was not valid for encoding ' + this.utfLabel
          )
          err.code = 'ERR_ENCODING_INVALID_ENCODED_DATA'
          err.errno = 12
          throw err
        }
      }
    }
    if (!this.ignoreBOM) {
      // U+FEFF: BYTE ORDER MARK
      if (str.codePointAt(0) === 0xFEFF) {
        return str.slice(1)
      }
    }
    return str
  }
}

const hasICU = (typeof Intl === 'object')
let TD = null

// Don't use built-in TextDecoder if in a node version without ICU support,
// since the whole reason we're doing this is to allow `fatal: true`.
// See: https://nodejs.org/api/util.html#util_new_textdecoder_encoding_options
if (hasICU) {
  // Note: using globalThis is WAY more complicated than is needed.
  if (typeof TextDecoder === 'function') {
    // This should be in most modern browsers, and node 11+
    TD = TextDecoder
  } else if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-undef
    TD = window.TextDecoder
  } else if (typeof self === 'undefined') {
    try {
      if (process &&
          process.versions &&
          process.versions.node &&
          process.versions.node.match(/^(?:8|10)\./)) {
        // Let's see if we can fake out the metro bundler.
        // The goal is to *not* try to inline the util package here.
        const rq = require
        const u = ['u', 't', 'i', 'l'].reduce(add, '')

        // Node 8.3 - 10
        // eslint-disable-next-line no-useless-call
        const util = rq.call(null, u)
        TD = util.TextDecoder
      }
    } catch (ignored) {
      // Module util couldn't be loaded.  Probably an old browser.
    }
  } else {
    // eslint-disable-next-line no-undef
    TD = self.TextDecoder
  }
}

if (typeof TD !== 'function') {
  TD = TextDecoderPolyfill
}

// Make polyfill testable on late-enough node versions
if ((typeof Symbol === 'function') && (typeof Symbol.for === 'function')) {
  TD[Symbol.for('@cto.af/textdecoder/polyfill')] = TextDecoderPolyfill
}
module.exports = TD
