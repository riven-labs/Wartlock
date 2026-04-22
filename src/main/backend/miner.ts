import axios from 'axios'
import type { ChildProcessByStdio } from 'child_process'
import { spawn, spawnSync } from 'child_process'
import { BrowserWindow } from 'electron'
import fs from 'fs'
import path from 'path'
import type { Readable } from 'stream'

/**
 * Manages a single bzminer child process. We spawn the binary the user points
 * us at, stream its stdout/stderr to the renderer through `miner:log` events,
 * and parse well-known lines (hashrate, shares) into a lightweight stats
 * object we cache and push out as `miner:stats`.
 *
 * Supports:
 *  - `sessionMinutes` — auto-stop after the given duration.
 *  - donation mode — every 1h, allocate 5 minutes of mining to the Wartlock
 *    dev wallet. Internally we swap the spawned config between the user's
 *    and the donation preset on a timer, and tell the renderer which mode
 *    is active.
 */

export type MinerConfig = {
  binaryPath: string
  algo: string
  pool: string
  walletAddress: string
  worker: string
  extraArgs: string
}

export type MinerIntensity = 'eco' | 'balanced' | 'performance' | 'custom'

export type MinerOptions = {
  sessionMinutes?: number | null
  donation?: boolean
  intensity?: MinerIntensity
}

export type MinerMode = 'user' | 'donation'

export type MinerStats = {
  hashrateHps: number | null
  unit: string | null
  accepted: number | null
  rejected: number | null
  gpus: number | null
  lastUpdate: number
}

export type MinerState = {
  running: boolean
  startedAt: number | null
  pid: number | null
  config: MinerConfig | null
  options: MinerOptions
  mode: MinerMode
  nextSwapAt: number | null
  autoStopAt: number | null
  stats: MinerStats
  logs: LogLine[]
  lastExitCode: number | null
}

export type LogLine = {
  ts: number
  stream: 'stdout' | 'stderr' | 'system'
  text: string
}

/** Wartlock dev donation preset — fixed pool + dev wallet. */
export const DONATION_CONFIG: MinerConfig = {
  binaryPath: '', // filled in from user's config at runtime
  algo: 'warthog',
  pool: 'stratum+tcp://de.warthog.herominers.com:1143',
  walletAddress: 'aca4916c89b8fb47784d37ad592d378897f616569d3ee0d4',
  worker: 'wartlock-donation',
  extraArgs: '',
}

const DONATION_INTERVAL_MS = 60 * 60_000 // every hour
const DONATION_WINDOW_MS = 5 * 60_000 // 5-minute window

const LOG_LIMIT = 500

let proc: ChildProcessByStdio<null, Readable, Readable> | null = null
let startedAt: number | null = null
let userConfig: MinerConfig | null = null
let options: MinerOptions = {}
let mode: MinerMode = 'user'
let nextSwapAt: number | null = null
let autoStopAt: number | null = null
let swapTimer: NodeJS.Timeout | null = null
let stopTimer: NodeJS.Timeout | null = null
let logs: LogLine[] = []
let stats: MinerStats = emptyStats()
let lastExitCode: number | null = null
let httpApiPort: number | null = null
let pollTimer: NodeJS.Timeout | null = null
let activeWin: BrowserWindow | null = null

function emptyStats(): MinerStats {
  return {
    hashrateHps: null,
    unit: null,
    accepted: null,
    rejected: null,
    gpus: null,
    lastUpdate: 0,
  }
}

function emit(
  win: BrowserWindow | null,
  channel: string,
  payload: unknown,
): void {
  if (!win || win.isDestroyed()) return
  win.webContents.send(channel, payload)
}

function pushSystemLog(win: BrowserWindow | null, text: string): void {
  const entry: LogLine = { ts: Date.now(), stream: 'system', text }
  logs.push(entry)
  if (logs.length > LOG_LIMIT) logs = logs.slice(-LOG_LIMIT)
  emit(win, 'miner:log', entry)
}

function pushLog(
  win: BrowserWindow | null,
  stream: 'stdout' | 'stderr',
  text: string,
): void {
  const cleaned = stripAnsi(text)
  const parts = cleaned.split('\n')
  for (const raw of parts) {
    const line = raw.replace(/\r/g, '').trimEnd()
    if (!line) continue
    const entry: LogLine = { ts: Date.now(), stream, text: line }
    logs.push(entry)
    if (logs.length > LOG_LIMIT) logs = logs.slice(-LOG_LIMIT)
    emit(win, 'miner:log', entry)
    parseLine(line, win)
  }
}

function parseLine(line: string, win: BrowserWindow | null): void {
  if (/(wart|warthog) is not supported on this device/i.test(line)) {
    pushSystemLog(
      win,
      'Hint: this bzminer release does not support this algo on your GPU. In Advanced options, try `warthog` (most reliable) or `wart`, or switch to a different bzminer version via Configuration → Update.',
    )
  }

  // bzminer prints `HTTP API Listening on 0.0.0.0:4014` (or similar) once on
  // startup. Once we know the port we can hit its HTTP stats endpoint, which
  // is far more reliable than regex-scraping the human-readable log tables.
  const portMatch = line.match(/HTTP API\s+Listening on\s+[^:]*:(\d+)/i)
  if (portMatch) {
    httpApiPort = parseInt(portMatch[1], 10)
    startHttpPolling(win)
  }

  // Share events — bzminer emits a line per accepted/rejected share. Counting
  // these events is resilient to whatever format the periodic status table
  // happens to use in this release.
  if (/accepted\s*(share|solution|block)/i.test(line)) {
    stats.accepted = (stats.accepted ?? 0) + 1
    stats.lastUpdate = Date.now()
    emit(win, 'miner:stats', stats)
  }
  if (/rejected\s*(share|solution|block)/i.test(line)) {
    stats.rejected = (stats.rejected ?? 0) + 1
    stats.lastUpdate = Date.now()
    emit(win, 'miner:stats', stats)
  }

  let updated = false
  const hr = line.match(
    /(?:total|speed|accepted speed|hashrate)[^\d]*(\d+(?:\.\d+)?)\s*([kKmMgGtT]?H)\/s/,
  )
  if (hr) {
    const value = parseFloat(hr[1])
    const unit = hr[2].toUpperCase() + '/s'
    const mult =
      hr[2][0].toLowerCase() === 't'
        ? 1e12
        : hr[2][0].toLowerCase() === 'g'
          ? 1e9
          : hr[2][0].toLowerCase() === 'm'
            ? 1e6
            : hr[2][0].toLowerCase() === 'k'
              ? 1e3
              : 1
    stats.hashrateHps = value * mult
    stats.unit = unit
    updated = true
  }
  const acc = line.match(/accepted[^\d]*(\d+)/i)
  if (acc && !/speed/i.test(line)) {
    stats.accepted = parseInt(acc[1], 10)
    updated = true
  }
  const rej = line.match(/rejected[^\d]*(\d+)/i)
  if (rej) {
    stats.rejected = parseInt(rej[1], 10)
    updated = true
  }
  const gpu = line.match(/(\d+)\s*gpu(?:s)?\s*found/i)
  if (gpu) {
    stats.gpus = parseInt(gpu[1], 10)
    updated = true
  }
  if (updated) {
    stats.lastUpdate = Date.now()
    emit(win, 'miner:stats', stats)
  }
}

function stripAnsi(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\x1b\[[0-9;]*m/g, '')
}

/**
 * bzminer exposes a /status?pass= JSON endpoint on its HTTP API (default
 * port 4014). The schema includes `pools[]` (one per configured algorithm,
 * with totals like `valid_solutions`, `rejected_solutions`, smoothed
 * `hashrate`) and `devices[]` (per-GPU arrays for instantaneous
 * `hashrate[]`, `total_solutions[]`, `core_temp`, etc.). We poll it and
 * project it into our flatter MinerStats.
 */
async function pollHttpApi(win: BrowserWindow | null): Promise<void> {
  if (!httpApiPort) return
  const url = `http://127.0.0.1:${httpApiPort}/status?pass=`
  try {
    const { data } = await axios.get(url, {
      timeout: 2_000,
      headers: { Accept: 'application/json' },
      // bzminer sometimes serves with text/plain content-type — let axios
      // still parse numbers/objects whatever the header says.
      transformResponse: (body) => {
        if (typeof body !== 'string') return body
        try {
          return JSON.parse(body)
        } catch {
          return body
        }
      },
    })
    if (!data || typeof data !== 'object') return
    const parsed = extractStatsFromBzminer(data)
    if (!parsed) return
    stats = {
      ...stats,
      ...parsed,
      lastUpdate: Date.now(),
    }
    emit(win, 'miner:stats', stats)
  } catch {
    // bzminer is still warming up or listening elsewhere — retry next tick.
  }
}

type BzPool = {
  algorithm?: string
  hashrate?: number
  valid_solutions?: number
  invalid_solutions?: number
  rejected_solutions?: number
  stale_solutions?: number
}

type BzDevice = {
  name?: string
  cuda?: boolean
  hashrate?: number[]
  valid_solutions?: number[]
}

function extractStatsFromBzminer(data: unknown): Partial<MinerStats> | null {
  if (!data || typeof data !== 'object') return null
  const obj = data as Record<string, unknown>
  const pools: BzPool[] = Array.isArray(obj.pools)
    ? (obj.pools as BzPool[])
    : []
  const devices: BzDevice[] = Array.isArray(obj.devices)
    ? (obj.devices as BzDevice[])
    : []
  if (!pools.length && !devices.length) return null

  const wantAlgo = (userConfig?.algo || 'warthog').toLowerCase()

  // Pick the pool matching the user's configured algo. Fall back to the
  // first pool that's actually producing solutions — some bzminer configs
  // list throwaway "zil" or placeholder pools.
  const byAlgo = pools.find(
    (p) => String(p.algorithm ?? '').toLowerCase() === wantAlgo,
  )
  const byActivity = pools.find(
    (p) => (p.valid_solutions ?? 0) > 0 || (p.hashrate ?? 0) > 0,
  )
  const pool = byAlgo ?? byActivity ?? pools[0]

  // Sum per-device hashrates (more responsive than the pool's smoothed avg).
  // Fall back to the pool hashrate if no devices are reporting yet.
  let deviceSum = 0
  for (const d of devices) {
    if (Array.isArray(d.hashrate)) {
      for (const h of d.hashrate) {
        if (typeof h === 'number' && Number.isFinite(h)) deviceSum += h
      }
    }
  }
  let hashrateHps: number | null = deviceSum > 0 ? deviceSum : null
  if (hashrateHps == null && typeof pool?.hashrate === 'number') {
    hashrateHps = pool.hashrate > 0 ? pool.hashrate : null
  }

  const accepted =
    typeof pool?.valid_solutions === 'number' ? pool.valid_solutions : null
  const rejected = pool
    ? (Number(pool.rejected_solutions) || 0) +
      (Number(pool.invalid_solutions) || 0)
    : null

  // Count GPUs specifically (skip CPU devices like "Intel(R) Core...").
  const gpus = devices.filter((d) => d.cuda === true).length || devices.length

  return {
    hashrateHps,
    unit: null,
    accepted,
    rejected,
    gpus: gpus || null,
  }
}

function startHttpPolling(win: BrowserWindow | null): void {
  if (pollTimer) return // already polling
  activeWin = win
  // bzminer defaults to port 4014 — start polling immediately. If the log
  // later announces a different port we pick it up via parseLine and
  // httpApiPort is updated in place.
  if (!httpApiPort) httpApiPort = 4014
  const tick = (): void => {
    void pollHttpApi(activeWin)
  }
  tick()
  pollTimer = setInterval(tick, 3_000)
}

function stopHttpPolling(): void {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
  httpApiPort = null
}

/**
 * Intensity preset → bzminer flags. Conservative values picked for Warthog
 * on typical gaming GPUs; bzminer silently clamps per-device. `custom` leaves
 * the whole thing to the user's extraArgs.
 */
/**
 * Warthog is a dual-algo coin: the GPU runs SHA while the CPU runs Verus
 * workers. bzminer defaults to using almost every CPU thread (minus 1-4) to
 * maximize Verus hashrate, which crushes laptops — `-i N` only throttles the
 * GPU, not the Verus workers. The correct knobs are `--cpu_threads` and
 * `--warthog_max_ram_gb`. Keep GPU `-i` on the conservative side too.
 */
function intensityPresetArgs(mode?: MinerIntensity): string[] {
  switch (mode) {
    case 'eco':
      // 2 Verus threads + 1 distributor + OS overhead ≈ ~10% CPU on an i9,
      // laptop stays usable. Cap Warthog RAM to 2 GB for systems with limited
      // memory headroom.
      return ['--cpu_threads', '2', '--warthog_max_ram_gb', '2', '-i', '15']
    case 'balanced':
      // Use roughly a quarter of available CPU — still leaves the system
      // responsive while giving Verus workers room to breathe.
      return ['--cpu_threads', '8', '-i', '30']
    case 'performance':
      // Let bzminer auto-pick cpu_threads (its default reserves a few for
      // the OS). Push GPU intensity.
      return ['-i', '60']
    case 'custom':
    default:
      return []
  }
}

function buildArgs(cfg: MinerConfig): string[] {
  const args: string[] = []
  args.push('-a', cfg.algo || 'warthog')
  if (cfg.pool) args.push('-p', cfg.pool)
  if (cfg.walletAddress) {
    const worker = cfg.worker ? `.${cfg.worker}` : ''
    args.push('-w', `${cfg.walletAddress}${worker}`)
  }
  // Apply intensity preset before extraArgs so a power user can still
  // override any flag by repeating it with a different value in extraArgs
  // (bzminer uses the last value).
  args.push(...intensityPresetArgs(options.intensity))
  if (cfg.extraArgs?.trim()) {
    args.push(...splitExtraArgs(cfg.extraArgs))
  }
  return args
}

function splitExtraArgs(raw: string): string[] {
  const out: string[] = []
  let buf = ''
  let inQuote = false
  for (const ch of raw) {
    if (ch === '"') {
      inQuote = !inQuote
      continue
    }
    if (/\s/.test(ch) && !inQuote) {
      if (buf) {
        out.push(buf)
        buf = ''
      }
      continue
    }
    buf += ch
  }
  if (buf) out.push(buf)
  return out
}

function clearTimers(): void {
  if (swapTimer) {
    clearTimeout(swapTimer)
    swapTimer = null
  }
  if (stopTimer) {
    clearTimeout(stopTimer)
    stopTimer = null
  }
  nextSwapAt = null
  autoStopAt = null
}

function spawnProcess(win: BrowserWindow | null, cfg: MinerConfig): void {
  const args = buildArgs(cfg)
  proc = spawn(cfg.binaryPath, args, {
    cwd: path.dirname(cfg.binaryPath),
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  startedAt = Date.now()
  stats = emptyStats()
  // Kick off HTTP polling right away — bzminer's API is up by the time the
  // miner finishes warming up, and the poll loop self-heals on 404 while
  // it's still booting.
  startHttpPolling(win)

  proc.stdout.on('data', (chunk: Buffer) =>
    pushLog(win, 'stdout', chunk.toString('utf8')),
  )
  proc.stderr.on('data', (chunk: Buffer) =>
    pushLog(win, 'stderr', chunk.toString('utf8')),
  )
  proc.on('error', (err) => {
    pushLog(win, 'stderr', `[spawn error] ${err.message}`)
  })
  proc.on('exit', (code) => {
    lastExitCode = code
    const existed = !!proc
    proc = null
    if (!existed) return

    // If we're exiting cleanly because we asked it to (donation swap, manual
    // stop, auto-stop) the outer caller handles re-spawn / teardown. If it
    // exited unexpectedly without an expected reason, tear down fully.
    if (expectedExit) {
      expectedExit = false
      return
    }
    clearTimers()
    stopHttpPolling()
    userConfig = null
    startedAt = null
    mode = 'user'
    emit(win, 'miner:exit', { code })
    pushSystemLog(win, `Miner exited with code ${code ?? 'null'}`)
    broadcastState(win)
  })
}

let expectedExit = false

/**
 * `child.kill()` on Windows only sends SIGTERM — bzminer ignores it under
 * GPU load and keeps mining. We have to escalate to `taskkill /F /T` to
 * terminate the whole process tree. Returns true if the kill call completed;
 * the caller still waits for the actual `exit` event to confirm.
 */
function forceKillProcess(pid: number | undefined): void {
  if (!pid) return
  if (process.platform === 'win32') {
    try {
      spawnSync('taskkill', ['/F', '/T', '/PID', String(pid)], {
        windowsHide: true,
      })
    } catch {
      /* fall through */
    }
    return
  }
  try {
    process.kill(pid, 'SIGTERM')
  } catch {
    /* noop */
  }
  // Escalate to SIGKILL after a short grace period
  setTimeout(() => {
    try {
      process.kill(pid, 'SIGKILL')
    } catch {
      /* noop */
    }
  }, 1500)
}

function killAndWait(timeoutMs = 5000): Promise<void> {
  return new Promise((resolve) => {
    if (!proc) return resolve()
    const target = proc
    expectedExit = true

    let settled = false
    const done = (): void => {
      if (settled) return
      settled = true
      resolve()
    }

    target.once('exit', done)
    try {
      forceKillProcess(target.pid)
    } catch {
      expectedExit = false
      return done()
    }

    // Hard cap — if the process somehow never fires 'exit' (shouldn't happen
    // after taskkill /F), resolve anyway so the UI doesn't hang.
    setTimeout(() => {
      if (!settled) {
        expectedExit = false
        // Last-ditch: try kill again with the stored pid
        forceKillProcess(target.pid)
      }
      done()
    }, timeoutMs)
  })
}

async function swapToDonation(win: BrowserWindow | null): Promise<void> {
  if (!userConfig) return
  pushSystemLog(
    win,
    'Donation window: mining for Wartlock developers for the next 5 minutes.',
  )
  await killAndWait()
  mode = 'donation'
  spawnProcess(win, { ...DONATION_CONFIG, binaryPath: userConfig.binaryPath })
  scheduleSwapAfter(win, DONATION_WINDOW_MS)
  broadcastState(win)
}

async function swapToUser(win: BrowserWindow | null): Promise<void> {
  if (!userConfig) return
  pushSystemLog(win, 'Donation window complete. Resuming your mining config.')
  await killAndWait()
  mode = 'user'
  spawnProcess(win, userConfig)
  scheduleSwapAfter(win, DONATION_INTERVAL_MS - DONATION_WINDOW_MS)
  broadcastState(win)
}

function scheduleSwapAfter(win: BrowserWindow | null, ms: number): void {
  if (swapTimer) clearTimeout(swapTimer)
  if (!options.donation || !userConfig) {
    swapTimer = null
    nextSwapAt = null
    return
  }
  nextSwapAt = Date.now() + ms
  swapTimer = setTimeout(() => {
    if (mode === 'user') void swapToDonation(win)
    else void swapToUser(win)
  }, ms)
}

function broadcastState(win: BrowserWindow | null): void {
  emit(win, 'miner:state', getState())
}

export function getState(): MinerState {
  return {
    running: proc !== null,
    startedAt,
    pid: proc?.pid ?? null,
    config: userConfig,
    options,
    mode,
    nextSwapAt,
    autoStopAt,
    stats,
    logs,
    lastExitCode,
  }
}

export function startMiner(
  win: BrowserWindow | null,
  config: MinerConfig,
  opts: MinerOptions = {},
): MinerState {
  if (proc) throw new Error('miner already running')
  if (!config.binaryPath) throw new Error('bzminer path not set')
  if (!fs.existsSync(config.binaryPath)) {
    throw new Error(`bzminer not found at ${config.binaryPath}`)
  }

  userConfig = config
  options = { ...opts }
  mode = 'user'
  logs = []
  lastExitCode = null
  activeWin = win

  spawnProcess(win, config)

  if (opts.sessionMinutes && opts.sessionMinutes > 0) {
    autoStopAt = Date.now() + opts.sessionMinutes * 60_000
    stopTimer = setTimeout(() => {
      pushSystemLog(
        win,
        `Session duration reached (${opts.sessionMinutes} min). Stopping miner.`,
      )
      stopMiner()
    }, opts.sessionMinutes * 60_000)
  }

  if (opts.donation) {
    // First donation window hits after 1h from start
    scheduleSwapAfter(win, DONATION_INTERVAL_MS - DONATION_WINDOW_MS)
    pushSystemLog(
      win,
      'Hashrate donation enabled. Every hour, 5 minutes of mining will go to the Wartlock developer wallet.',
    )
  }

  // TS narrows `proc` to `never` across the spawn call since it can't follow
  // module-scoped mutations — pull the pid via the public getter instead.
  emit(win, 'miner:started', { pid: getState().pid, startedAt })
  broadcastState(win)
  return getState()
}

export async function stopMiner(): Promise<void> {
  clearTimers()
  stopHttpPolling()
  userConfig = null
  mode = 'user'
  if (!proc) return

  // On Windows, proc.kill() sends SIGTERM — bzminer ignores it and keeps
  // mining while eating a GPU and a CPU core. We force-kill the whole tree
  // via `taskkill /F /T /PID`, and *wait* for the OS to reap it so the
  // renderer's "Stopped" state reflects reality before we return.
  const pid = proc.pid
  const existed = !!proc

  expectedExit = true
  try {
    forceKillProcess(pid)
  } catch {
    /* handled below via timeout */
  }

  // Wait up to 5s for the child to actually die.
  await new Promise<void>((resolve) => {
    if (!proc) return resolve()
    const target = proc
    let settled = false
    const finish = (): void => {
      if (settled) return
      settled = true
      resolve()
    }
    target.once('exit', finish)
    setTimeout(() => {
      // If it STILL hasn't exited, hit it again and move on.
      forceKillProcess(target.pid)
      finish()
    }, 5000)
  })

  // Explicitly fire the exit event for renderer state if it wasn't already
  // (race: exit handler may have suppressed it because expectedExit was set).
  if (existed) {
    proc = null
    startedAt = null
    emit(activeWin, 'miner:exit', { code: lastExitCode })
    pushSystemLog(activeWin, 'Miner stopped.')
    broadcastState(activeWin)
  }
}

/**
 * Enable/disable donation mid-session without restarting the miner. When
 * turning on mid-session, schedule the next swap based on how long we've
 * already been running (close enough for this use-case).
 */
export function setDonation(win: BrowserWindow | null, enabled: boolean): void {
  options.donation = enabled
  if (!userConfig || !proc) return

  if (!enabled) {
    if (swapTimer) clearTimeout(swapTimer)
    swapTimer = null
    nextSwapAt = null
    // If we're mid-donation when toggled off, swap back to user immediately.
    if (mode === 'donation') void swapToUser(win)
    pushSystemLog(win, 'Hashrate donation disabled.')
  } else {
    if (mode === 'user') {
      scheduleSwapAfter(win, DONATION_INTERVAL_MS - DONATION_WINDOW_MS)
    } else {
      scheduleSwapAfter(win, DONATION_WINDOW_MS)
    }
    pushSystemLog(win, 'Hashrate donation enabled.')
  }
  broadcastState(win)
}
