<div align="center">

<img src="build/icon.png" width="128" height="128" alt="Wartlock" />

# Wartlock

**A desktop wallet and GPU miner for Warthog — built by [Riven Labs](https://www.riven-labs.com/).**

[![License: MIT](https://img.shields.io/badge/license-MIT-3B82F6.svg)](LICENSE)
[![Platform: Windows](https://img.shields.io/badge/platform-Windows-lightgrey.svg)](#installation)
[![Built with: Electron](https://img.shields.io/badge/built%20with-Electron%2035-47848F.svg)](https://www.electronjs.org/)
[![UI: React + Tailwind](https://img.shields.io/badge/UI-React%20%2B%20Tailwind-38BDF8.svg)](https://tailwindcss.com/)

</div>

---

## What it is

Wartlock is a complete desktop stack for Warthog (WART):

- 🔐 **Wallet** — create, recover, or import. Private keys are encrypted with Fernet (PBKDF2‑SHA256, 480 000 iterations) and held in the OS keyring per session.
- 📈 **Live dashboard** — portfolio value, per-wallet balances with 30-second auto-refresh and delta indicators, 7-day WART price with sparkline, market cap, volume.
- ⛏️ **Mining** — one-click [bzminer](https://github.com/bzminer/bzminer) install, Eco / Balanced / Performance presets, session time limits, live hashrate and shares from bzminer's HTTP API, and an optional hashrate donation to support Wartlock development.
- 🖥️ **Hardware** — CPU, GPU(s), RAM, OS and storage at a glance, with a mining-readiness check.
- ❤️ **Support Warthog** — dedicated donate flow to the Warthog dev fund at `257edaceb6cb5ded59afd2051b93c5244053da527fc28d6a`.
- 🌐 **Explorer-linked** — every address and transaction hash opens in [wartscan.io](https://wartscan.io) with one click.
- 📱 **QR everything** — receive screens render a branded, downloadable QR card with the wallet logo inlaid; the send screen can scan a QR image back to fill the recipient field.

---

## Installation

### Option 1 — Download the installer

1. Grab the latest `wartlock-<version>-setup.exe` from the [Releases page](https://github.com/riven-labs/Wartlock/releases).
2. Run it.

> **SmartScreen warning**: the installer is not yet code-signed. Click _More info → Run anyway_ the first time.

### Option 2 — Build from source (Windows)

**Prerequisites**

- [Node.js 22](https://nodejs.org/) (LTS)
- **Visual Studio 2022** with the **Desktop development with C++** workload installed (this provides the Windows 10/11 SDK + MSVC toolchain that `better-sqlite3` and `keytar` need).

**Build**

```bash
git clone https://github.com/riven-labs/Wartlock.git
cd Wartlock
npm install
npm run build:icons
npm run build:win       # full installer → dist/wartlock-<version>-setup.exe
# or
npm run build:unpack    # unpacked folder  → dist/win-unpacked/wartlock.exe
```

---

## Features in depth

### Home — dashboard

Combined portfolio + market hero card:

- **Your portfolio** in large mono type, with a 24h dollar delta chip computed against the current WART price
- **WART price** with 24h / 7d change chips and a colored 7-day sparkline (green on the way up, red on the way down)
- **Per-wallet balances** polled live every 30 s with `+ / −` arrows showing deltas since the page was opened
- **Connection banner** surfaces if the configured Warthog node isn't responding, with a one-click link to Settings

### Mining

- **Auto-download bzminer** from GitHub releases with a progress bar. You can also point Wartlock at an existing binary.
- **Pinned default version** of `v21.5.3` — the last bzminer release with rock-solid Warthog support on modern NVIDIA GPUs. Override from the UI to try any other release tag.
- **Intensity presets**:
  - **Eco** — `--cpu_threads 2 --warthog_max_ram_gb 2 -i 15` (quiet background mining)
  - **Balanced** — `--cpu_threads 8 -i 30` (default)
  - **Performance** — `-i 60` (let bzminer pick CPU threads)
  - **Custom** — no preset flags; set your own in the Advanced drawer
- **Session duration** — auto-stop after N minutes
- **Donation mode** — optional, opt-in. While enabled, Wartlock spends 5 minutes out of every hour mining to the Wartlock dev wallet (`aca4916c89b8fb47784d37ad592d378897f616569d3ee0d4`) at `stratum+tcp://de.warthog.herominers.com:1143`, then swaps back to your config for the remaining 55 minutes. Shows a live countdown pill while active.
- **Live stats** pulled directly from bzminer's `/status?pass=` HTTP API — hashrate summed across GPUs, accepted/rejected shares, uptime. Updates every 3 seconds.
- **Proper stop behavior** — `taskkill /F /T /PID` on Windows so `bzminer.exe` actually dies when you click Stop.

### Hardware

Snapshot of the machine, refreshed every 30 seconds. Mining-readiness banner at the top (RAM ≥ 2 GB, at least one GPU with ≥ 2 GB VRAM). Per-GPU cards with temperature pills (green < 70 °C, amber < 85 °C, red above). OS + storage breakdown too.

### Support Warthog

Dedicated page with:

- The Warthog development fund's dev address: `257edaceb6cb5ded59afd2051b93c5244053da527fc28d6a`
- A copy button, a downloadable branded QR card, and an in-app donate flow (pick a wallet → enter amount → password → sign & send)
- Explorer link to verify the address on wartscan.io

### Wallet

- **Create**, **Recover** (from 12/24-word mnemonic), **Import by private key**, or **Import from an existing `wartwallet.db` file** (encrypted rows are re-decrypted with the source-file password, then re-encrypted under a new vault password).
- Session-scoped key unlock — the decrypted private key lives in the OS keyring for the active session only; you're prompted again on the next launch.
- Every wallet address and transaction hash deep-links to [wartscan.io](https://wartscan.io).

### Settings

- **Public node list** with labels (currently **Polaire Warthog Node** at `http://217.182.64.43:3001/`). Pick from the list or plug in your own URL.
- **Privacy warning banner** appears whenever a public node is selected — for maximum privacy, run a Warthog node locally.
- Language picker (English / 中文 — _see Known issues_).

---

## Known issues

- **Chinese translation is incomplete.** English is fully covered; the `zh` locale only partially tracks the English strings. Contributions welcome — edit [`src/renderer/src/i18n/locales/zh.json`](src/renderer/src/i18n/locales/zh.json).
- **bzminer Warthog support varies by version.** Recent releases (v22+, v23+, v24+) can error out with `wart is not supported on this device` on otherwise-capable GPUs. Wartlock pins the default download to **v21.5.3** for this reason. If that version also doesn't work for your card, try `v21.1.5` or `v20.0.0` via the "bzminer version" field in the Mining page.
- **Light mode is disabled.** The app is dark-only. A proper light palette is on the roadmap.
- **Builds are unsigned.** Windows SmartScreen will warn on first launch ("Windows protected your PC") — click _More info → Run anyway_. Code signing is planned once we have a certificate.
- **Only one wallet unlocked at a time.** Switching to a different wallet requires logging out of the current one. This is intentional to prevent accidental cross-wallet leakage.
- **CoinGecko free-tier rate limits.** Market data is cached for 5 minutes in the main process. If you see `—` where a price should be, CoinGecko is throttling the free tier.
- **Donation windows restart the miner process.** Every swap between your config and the donation config kills bzminer and respawns it — expect a brief hashrate dip around the top and bottom of each hour while donation mode is active.

---

## Security notes

- **Private keys are never stored in plaintext on disk.** At rest, they're encrypted with Fernet (AES-128-CBC + HMAC-SHA256) using a key derived from your password via PBKDF2-SHA256 with 480 000 iterations and a per-wallet 16-byte random salt. Ciphertext lives in `wartwallet.db`.
- **Session storage uses the OS keyring.** When you unlock a wallet, the decrypted key is stashed in the system credential manager via `keytar` (Windows Credential Manager / macOS Keychain / libsecret on Linux). It's removed when you log out.
- **No private key or mnemonic ever leaves your machine.** The app talks to your configured Warthog node for chain RPC and to CoinGecko for price data — neither sees your keys.
- **External nodes are a privacy tradeoff.** Using a public node reveals your wallet addresses and transaction patterns to the node operator. Settings shows a banner reminding you. Run a node locally if privacy matters.
- **Builds are reproducible but not yet audited.** Review the crypto in [`src/main/backend/crypto.ts`](src/main/backend/crypto.ts) and [`src/main/backend/wallet.ts`](src/main/backend/wallet.ts) before trusting significant amounts.

---

## Tech stack

- **Electron 35** main/preload/renderer split, `contextIsolation` enabled
- **React 18** + **TypeScript** in the renderer, bundled by **electron-vite** / Vite
- **Radix UI** headless primitives + **Tailwind CSS** for styling (no component library dependencies — everything is in [`src/renderer/src/components/ui/`](src/renderer/src/components/ui))
- **better-sqlite3** for local wallet storage, **keytar** for the OS keyring
- **BIP39** mnemonics, **secp256k1** via `elliptic` + `ethereum-cryptography`
- **Fernet** (PBKDF2-SHA256 / AES-128-CBC / HMAC-SHA256) for private-key-at-rest encryption
- **systeminformation** for the Hardware page
- **axios** for node RPC + CoinGecko with in-process TTL caching
- **jsqr** + **qrcode** for receive/send QR flows
- **bzminer** (external binary, auto-downloaded at runtime) for GPU mining

---

## Development

### Running locally

```bash
npm install
npm run dev        # renderer hot-reload + main auto-restart
npm run typecheck  # tsc --noEmit for main, preload, renderer
npm run lint       # eslint --cache
npm run format     # prettier --write
```

### Building installers

The Windows installer must be built on a Windows host (native modules plus `electron-builder` packing). Local builds:

```bash
npm run build:win        # full NSIS installer
npm run build:unpack     # unpacked folder (runnable exe, no installer)
```

CI releases happen through the workflow at `.github/workflows/release-windows.yml`:

1. Tag a commit with `v<X.Y.Z>` and push the tag — e.g. `git tag v1.0.0 && git push origin v1.0.0`
2. The workflow runs on `windows-latest`, builds the installer, and attaches it to a **draft** GitHub Release
3. Review the draft, publish when ready

The workflow can also be kicked off manually via the Actions tab's _Run workflow_ button.

### Docker

A Linux-based dev image is provided at [`Dockerfile`](Dockerfile). It's for **dev tasks only** — typecheck, lint, and scripting — because Electron's Windows installer can't be cross-built cleanly from a Linux container (native modules target the Windows ABI).

```bash
docker build -t wartlock-dev .
docker run --rm -v ${PWD}:/app wartlock-dev npm run typecheck
docker run --rm -v ${PWD}:/app wartlock-dev npm run lint
```

---

## Project layout

```
src/
├─ main/                      # Electron main process
│  ├─ backend/
│  │  ├─ crypto.ts            # Fernet + PBKDF2 encryption of private keys
│  │  ├─ wallet.ts            # secp256k1 + Warthog address derivation
│  │  ├─ network.ts           # Chain RPC + CoinGecko (with TTL cache)
│  │  ├─ db.ts                # sqlite wallet store + schema migrations
│  │  ├─ miner.ts             # bzminer lifecycle, donation scheduler, HTTP-API stats
│  │  ├─ downloader.ts        # auto-download bzminer from GitHub releases
│  │  ├─ hardware.ts          # CPU/GPU/RAM/disk snapshot
│  │  ├─ importDb.ts          # decrypt + bulk-import from an external .db
│  │  ├─ nodes.ts             # public node presets
│  │  └─ storage.ts           # keytar session-key storage
│  └─ index.ts                # BrowserWindow + IPC wiring
├─ preload/
│  ├─ index.ts                # contextBridge API surface
│  └─ index.d.ts              # window.<api>.* TypeScript types
└─ renderer/
   └─ src/
      ├─ app/                 # pages (wallets, mining, hardware, support, settings)
      ├─ components/ui/       # Radix-backed primitive library
      ├─ components/          # ExplorerLink, PasswordInput, ...
      ├─ lib/                 # qr.ts, cn.ts
      ├─ hooks/               # useDisclosure
      ├─ i18n/                # en.json, zh.json
      └─ router/              # react-router config
```

---

## Contributing

PRs welcome. Please:

1. Open an issue first for anything larger than a typo or one-file fix.
2. Make sure `npm run typecheck` and `npm run lint` both pass.
3. If you're touching crypto or the IPC boundary, flag it in the PR description so it gets an extra pair of eyes.
4. Don't commit `*.db`, `*.sqlite`, `.env`, or anything the [`.gitignore`](.gitignore) already excludes.

---

## License

[MIT](LICENSE).

---

## Credits

Built and maintained by [**Riven Labs**](https://www.riven-labs.com/).

Supporting Warthog? Send WART to `257edaceb6cb5ded59afd2051b93c5244053da527fc28d6a` — or use the Support Warthog tab inside the app.
