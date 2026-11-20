# The Open

**An open window onto Solana coins.**

[![Live site](https://img.shields.io/badge/live-theopen.fun-c592ff?style=flat-square)](https://theopen.fun)
![Chain](https://img.shields.io/badge/chain-Solana-8f41f5?style=flat-square)

**Contract address:** `CA_PLACEHOLDER` (not stated yet)

## Overview

The Open is a single-page coin board for Solana. It shows what is moving on the network right now, pins our own token to the top of the board once its contract address is stated, and stays quiet whenever a fact has not been confirmed.

## Features

- Live market board and ticker fed by public DexScreener endpoints, refreshed every 60 seconds and paused while the tab is hidden
- Own-token row pinned at position one, driven by DexScreener and pump.fun fetched in parallel
- Contract-address bar that is inert until an address is stated, then click-to-copy
- Social icons that render inert until a URL is stated
- Spring-physics reveals, hero parallax, spotlight hover, count-up values, and a full `prefers-reduced-motion` fallback

## Links

- Site: https://theopen.fun
- X: not stated yet
- GitHub: not stated yet

## Develop

```bash
npm install
npm run build     # writes dist/
npm run serve     # serves dist/ on http://localhost:5173
npm test          # builds both register branches and runs the gate harness
```

State lives in one file, `src/register.json`. To publish a fact, change its record from `absent` to `stated` and rebuild.

## License

MIT
