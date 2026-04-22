import AdmZip from 'adm-zip'
import axios from 'axios'
import { app, BrowserWindow } from 'electron'
import fs from 'fs'
import os from 'os'
import path from 'path'
import * as tar from 'tar'

/**
 * Fetches the latest bzminer release from GitHub, picks the right asset for
 * the host OS + arch, downloads + extracts it into the app's user-data dir,
 * and returns the path to the resulting `bzminer`/`bzminer.exe` binary.
 *
 * Progress is emitted over `miner:download-progress` as { phase, percent, note }
 * so the renderer can render a proper progress bar.
 */

type Phase = 'resolving' | 'downloading' | 'extracting' | 'done' | 'failed'

type Progress = {
  phase: Phase
  percent: number
  note?: string
}

const LATEST_RELEASE_URL =
  'https://api.github.com/repos/bzminer/bzminer/releases/latest'
const TAG_RELEASE_URL = (tag: string): string =>
  `https://api.github.com/repos/bzminer/bzminer/releases/tags/${encodeURIComponent(
    tag,
  )}`

/**
 * Default pinned version. bzminer is a multi-algo miner and Warthog support
 * has been flaky across recent releases — the `wart` algo errors
 * "not supported on this device" on newer versions for modern NVIDIA cards.
 * v21.5.3 is a real published tag on the stable 21.x line that still ships
 * working Warthog support. Users can override this in the UI.
 */
export const DEFAULT_BZMINER_VERSION = 'v21.5.3'

function emit(win: BrowserWindow | null, p: Progress): void {
  if (!win || win.isDestroyed()) return
  win.webContents.send('miner:download-progress', p)
}

function bzminerBaseDir(): string {
  return path.join(app.getPath('userData'), 'bzminer')
}

export function getStoredBzminerPath(): string | null {
  const base = bzminerBaseDir()
  if (!fs.existsSync(base)) return null
  const binName = process.platform === 'win32' ? 'bzminer.exe' : 'bzminer'
  const candidates: Array<{ path: string; mtime: number }> = []
  const push = (p: string): void => {
    try {
      candidates.push({ path: p, mtime: fs.statSync(p).mtimeMs })
    } catch {
      /* ignore unreadable */
    }
  }
  const direct = path.join(base, binName)
  if (fs.existsSync(direct)) push(direct)
  for (const sub of fs.readdirSync(base)) {
    const p = path.join(base, sub, binName)
    if (fs.existsSync(p)) push(p)
  }
  if (!candidates.length) return null
  // Newest wins — when multiple versions coexist because a locked
  // previous version couldn't be cleaned up, we still auto-select the
  // one we just extracted.
  candidates.sort((a, b) => b.mtime - a.mtime)
  return candidates[0].path
}

function pickAsset(
  assets: Array<{ name: string; browser_download_url: string }>,
): { name: string; url: string } | null {
  const plat = process.platform
  const arch = process.arch // 'x64' | 'arm64' | ...
  // bzminer assets look like: bzminer_v22.3.0_windows_x64.zip, *_linux_x64.tar.gz
  const match = assets.find((a) => {
    const n = a.name.toLowerCase()
    if (plat === 'win32' && n.includes('windows') && n.endsWith('.zip')) {
      return arch === 'arm64' ? n.includes('arm') : !n.includes('arm')
    }
    if (plat === 'linux' && n.includes('linux') && n.endsWith('.tar.gz')) {
      return arch === 'arm64' ? n.includes('arm') : !n.includes('arm')
    }
    return false
  })
  if (!match) return null
  return { name: match.name, url: match.browser_download_url }
}

async function downloadToFile(
  url: string,
  dest: string,
  onProgress: (p: number) => void,
): Promise<void> {
  const response = await axios.get(url, {
    responseType: 'stream',
    timeout: 60_000,
    headers: { 'User-Agent': 'Wartlock' },
  })
  const total = parseInt(String(response.headers['content-length'] ?? '0'), 10)
  let loaded = 0

  await new Promise<void>((resolve, reject) => {
    const writer = fs.createWriteStream(dest)
    response.data.on('data', (chunk: Buffer) => {
      loaded += chunk.length
      if (total > 0) onProgress(Math.min(1, loaded / total))
    })
    response.data.on('error', reject)
    writer.on('error', reject)
    writer.on('finish', resolve)
    response.data.pipe(writer)
  })
}

async function extractArchive(
  archivePath: string,
  destDir: string,
): Promise<void> {
  if (archivePath.endsWith('.zip')) {
    const zip = new AdmZip(archivePath)
    zip.extractAllTo(destDir, true)
    return
  }
  if (archivePath.endsWith('.tar.gz') || archivePath.endsWith('.tgz')) {
    await tar.x({ file: archivePath, cwd: destDir })
    // bzminer on Linux ships a non-executable binary after extraction from tar
    const bin = path.join(destDir, 'bzminer')
    if (fs.existsSync(bin)) fs.chmodSync(bin, 0o755)
    // also scan subfolders one level deep for bzminer and chmod
    for (const sub of fs.readdirSync(destDir)) {
      const nested = path.join(destDir, sub, 'bzminer')
      if (fs.existsSync(nested)) fs.chmodSync(nested, 0o755)
    }
    return
  }
  throw new Error(`Unsupported archive: ${path.basename(archivePath)}`)
}

export async function downloadBzminer(
  win: BrowserWindow | null,
  version?: string | null,
): Promise<{ binaryPath: string; version: string }> {
  try {
    const wanted =
      version && version.trim() && version.trim().toLowerCase() !== 'latest'
        ? version.trim()
        : null
    const url = wanted ? TAG_RELEASE_URL(wanted) : LATEST_RELEASE_URL
    emit(win, {
      phase: 'resolving',
      percent: 0,
      note: wanted ? `Resolving ${wanted}…` : 'Checking latest release…',
    })

    let release:
      | {
          tag_name: string
          assets: Array<{ name: string; browser_download_url: string }>
        }
      | undefined
    try {
      const res = await axios.get<typeof release>(url, {
        timeout: 20_000,
        headers: {
          'User-Agent': 'Wartlock',
          Accept: 'application/vnd.github+json',
        },
      })
      release = res.data as typeof release
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404 && wanted) {
        // Tag doesn't exist — fetch a short list of real tags so the error is
        // actually actionable.
        const { data: releases } = await axios.get<Array<{ tag_name: string }>>(
          'https://api.github.com/repos/bzminer/bzminer/releases?per_page=10',
          {
            timeout: 15_000,
            headers: {
              'User-Agent': 'Wartlock',
              Accept: 'application/vnd.github+json',
            },
          },
        )
        const available = (releases || [])
          .map((r) => r.tag_name)
          .filter(Boolean)
          .slice(0, 8)
          .join(', ')
        throw new Error(
          `bzminer release "${wanted}" not found. Available: ${available}.`,
        )
      }
      throw err
    }
    if (!release) throw new Error('empty release response')

    const asset = pickAsset(release.assets)
    if (!asset) {
      throw new Error(
        `No bzminer binary for ${process.platform}-${process.arch} in release ${release.tag_name}`,
      )
    }

    // We intentionally do NOT wipe the whole bzminer/ directory — on Windows
    // the previous bzminer.exe is often still locked (the process may have
    // exited but Windows hasn't released the file handle yet, or the user
    // has a dangling bzminer from a crashed session). The archive always
    // contains its own tag-stamped subfolder, so the new install lands in
    // its own subdirectory and `getStoredBzminerPath()` prefers the newest
    // one by mtime. We snapshot what was here before and best-effort clean
    // up the old dirs at the end; any that fail stay around harmlessly
    // until the next successful update.
    const base = bzminerBaseDir()
    fs.mkdirSync(base, { recursive: true })
    const preExisting = new Set(
      fs
        .readdirSync(base, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name),
    )

    const tmp = path.join(os.tmpdir(), asset.name)
    emit(win, {
      phase: 'downloading',
      percent: 0,
      note: `${release.tag_name} · ${asset.name}`,
    })

    await downloadToFile(asset.url, tmp, (p) =>
      emit(win, {
        phase: 'downloading',
        percent: p,
        note: `${release.tag_name} · ${asset.name}`,
      }),
    )

    emit(win, { phase: 'extracting', percent: 0, note: 'Extracting…' })
    await extractArchive(tmp, base)
    try {
      fs.unlinkSync(tmp)
    } catch {
      /* noop */
    }

    const bin = getStoredBzminerPath()
    if (!bin) {
      throw new Error('Binary not found in archive after extraction')
    }

    // Best-effort cleanup of previous install dirs that weren't just created
    // by this extraction. Any failure (EBUSY from Windows holding a file
    // handle on a dead miner, etc.) is harmless — the new binary is already
    // on disk and selected.
    try {
      const currentDirs = fs.readdirSync(base, { withFileTypes: true })
      for (const entry of currentDirs) {
        if (!entry.isDirectory()) continue
        if (!preExisting.has(entry.name)) continue
        const victim = path.join(base, entry.name)
        // Don't delete the dir containing the just-installed binary even if
        // by coincidence it was already there (same tag re-install).
        if (bin.startsWith(victim + path.sep) || bin === victim) continue
        try {
          fs.rmSync(victim, { recursive: true, force: true })
        } catch {
          /* leave it — next update will try again */
        }
      }
    } catch {
      /* directory listing failed; nothing to clean up */
    }

    emit(win, { phase: 'done', percent: 1, note: bin })
    return { binaryPath: bin, version: release.tag_name }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    emit(win, { phase: 'failed', percent: 0, note: message })
    throw err
  }
}
