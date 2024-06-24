'use strict';

function add(t, v) {
  return t + v;
}

const hasICU = (typeof Intl === 'object');
let TD = null;

// Don't use built-in TextDecoder if in a node version without ICU support,
// since the whole reason we're doing this is to allow `fatal: true`.
// See: https://nodejs.org/api/util.html#util_new_textdecoder_encoding_options
if (hasICU) {
  // Note: using globalThis is WAY more complicated than is needed.
  // eslint-disable-next-line n/no-unsupported-features/node-builtins
  if (typeof TextDecoder === 'function') {
    // This should be in most modern browsers, and node 11+
    // eslint-disable-next-line n/no-unsupported-features/node-builtins
    TD = TextDecoder;
  } else if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-undef
    TD = window.TextDecoder;
  } else if (typeof self === 'undefined') {
    try {
      if (process &&
          process.versions &&
          process.versions.node &&
          process.versions.node.match(/^(?:8|10)\./)) {
        // Let's see if we can fake out the metro bundler.
        // The goal is to *not* try to inline the util package here.
        const rq = require;
        const u = ['u', 't', 'i', 'l'].reduce(add, '');

        // Node 8.3 - 10
        // eslint-disable-next-line no-useless-call
        const util = rq.call(null, u);
        TD = util.TextDecoder;
      }
    } catch (ignored) {
      // Module util couldn't be loaded.  Probably an old browser.
    }
  } else {
    // eslint-disable-next-line no-undef
    TD = self.TextDecoder;
  }
}

if (typeof TD !== 'function') {
  TD = require('./polyfill.js');
}

module.exports = TD;
