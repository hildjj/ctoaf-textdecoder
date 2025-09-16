# Simple TextDecoder polyfill

I needed this in two different projects, so I pulled it out.  All of the
existing TextDecoder polyfills try to do too much for what I needed.  The goal
here is to NOT require any Unicode tables, keeping this as small as possible.

This just finds the best TextDecoder instance it can, and mocks in an adequate
one for old or broken environments.

## Use

```js
const TextDecoder = require('@cto.af/textdecoder')
```

## API

See [MDN](https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder)

[![Tests](https://github.com/hildjj/ctoaf-textdecoder/actions/workflows/node.js.yml/badge.svg)](https://github.com/hildjj/ctoaf-textdecoder/actions/workflows/node.js.yml)
