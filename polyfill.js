'use strict';

const REPLACEMENT = '\ufffd';
const BYTES = [
  // 0b00_000 - 0b01_111: ASCII
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,

  // 0b10_000 - 0b10_111: Continuation
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,

  // 0b110_00 - 0b110_11: Two bytes
  1,
  1,
  1,
  1,

  // 0b1110_0 - 0b1110_1: Three bytes
  2,
  2,

  // 0b11110: Four bytes
  3,

  // 0b11111: Invalid
  -2,
];

const ERR_MSG = '[ERR_ENCODING_INVALID_ENCODED_DATA]: ' +
'The encoded data was not valid for encoding utf-8';

function utf8Decode(buf, fatal, state) {
  if (!state) {
    state = {cur: 0, left: 0};
  }
  let res = '';
  for (const b of buf) {
    const bytes = BYTES[b >> 3];
    switch (bytes) {
      case -2:
        // Top 5 bits all set
        state.cur = 0;
        state.left = 0;
        if (fatal) {
          const err = new TypeError(ERR_MSG);
          err.code = 'ERR_ENCODING_INVALID_ENCODED_DATA';
          err.errno = 12;
          throw err;
        } else {
          res += REPLACEMENT;
        }
        break;
      case -1:
        state.left--;
        if (state.left < 0) {
          // Too many continuation bytes
          state.cur = 0;
          state.left = 0;
          if (fatal) {
            const err = new TypeError(ERR_MSG);
            err.code = 'ERR_ENCODING_INVALID_ENCODED_DATA';
            err.errno = 12;
            throw err;
          } else {
            res += REPLACEMENT;
          }
        } else {
          state.cur = (state.cur << 6) | (b & 0x3f);
          if (state.left === 0) {
            res += String.fromCodePoint(state.cur);
            state.cur = 0;
          }
        }
        break;
      case 0: // One ASCII7 byte
        if ((state.cur !== 0) || (state.left !== 0)) {
          // Not enough continuation bytes
          state.cur = 0;
          state.left = 0;
          if (fatal) {
            const err = new TypeError(ERR_MSG);
            err.code = 'ERR_ENCODING_INVALID_ENCODED_DATA';
            err.errno = 12;
            throw err;
          } else {
            res += REPLACEMENT;
          }
        }
        res += String.fromCharCode(b);
        break;
      default:
        if ((state.cur !== 0) || (state.left !== 0)) {
          // Not enough continuation bytes
          state.cur = 0;
          state.left = 0;
          if (fatal) {
            const err = new TypeError(ERR_MSG);
            err.code = 'ERR_ENCODING_INVALID_ENCODED_DATA';
            err.errno = 12;
            throw err;
          } else {
            res += REPLACEMENT;
          }
        }
        state.left = bytes;
        state.cur = b & (0xff >> (bytes + 2));
        break;
    }
  }
  return [res, state];
}

class TextDecoderPolyfill {
  constructor(utfLabel, options) {
    this.utfLabel = (utfLabel || 'utf-8').toLowerCase();
    if ((this.utfLabel !== 'utf-8') && (this.utfLabel !== 'utf8')) {
      const err = new RangeError('The "' + utfLabel + '" encoding is not supported');
      err.code = 'ERR_ENCODING_NOT_SUPPORTED';
      throw err;
    }
    options = options || {};
    this.fatal = Boolean(options.fatal);
    this.ignoreBOM = Boolean(options.ignoreBOM);
    this.state = null;
  }

  decode(input, options) {
    if (!(input instanceof Uint8Array)) {
      if (input instanceof ArrayBuffer) {
        input = new Uint8Array(input);
      } else if (ArrayBuffer.isView(input)) {
        input = new Uint8Array(
          input.buffer,
          input.byteOffset,
          input.byteLength
        );
      } else {
        const typ = typeof input;
        const err = new TypeError('The "input" argument must be an instance of ArrayBuffer or ArrayBufferView. Received type ' + typ);
        err.code = 'ERR_INVALID_ARG_TYPE';
        throw err;
      }
    }
    const str_state = utf8Decode(input, this.fatal, this.state);
    let str = str_state[0];
    const state = str_state[1];
    if (options && options.stream) {
      this.state = state;
    } else {
      this.state = null;
      if (state.left !== 0) {
        // Truncated
        if (this.fatal) {
          const err = new TypeError(ERR_MSG);
          err.code = 'ERR_ENCODING_INVALID_ENCODED_DATA';
          err.errno = 11;
          throw err;
        } else {
          str += REPLACEMENT;
        }
      }
    }

    if (!this.ignoreBOM) {
      // U+FEFF: BYTE ORDER MARK
      if (str.codePointAt(0) === 0xFEFF) {
        return str.slice(1);
      }
    }
    return str;
  }
}

module.exports = TextDecoderPolyfill;
