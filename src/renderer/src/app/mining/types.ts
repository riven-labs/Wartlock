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
  sessionMinutes: number | null
  donation: boolean
  intensity: MinerIntensity
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

export type LogLine = {
  ts: number
  stream: 'stdout' | 'stderr' | 'system'
  text: string
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

export type DownloadProgress = {
  phase: 'resolving' | 'downloading' | 'extracting' | 'done' | 'failed'
  percent: number
  note?: string
}

export const DEFAULT_CONFIG: MinerConfig = {
  binaryPath: '',
  algo: 'warthog',
  pool: '',
  walletAddress: '',
  worker: 'rig1',
  extraArgs: '',
}

export const DEFAULT_OPTIONS: MinerOptions = {
  sessionMinutes: null,
  donation: false,
  intensity: 'balanced',
}

export const CONFIG_STORAGE_KEY = 'wartlock.miner.config'
export const OPTIONS_STORAGE_KEY = 'wartlock.miner.options'
// Bumped to v2 so old cached version strings (like the fabricated v22.3.0)
// get dropped and the shipped default wins on next mount.
export const BZMINER_VERSION_STORAGE_KEY = 'wartlock.miner.bzminerVersion.v2'

export const DONATION_DEV_ADDRESS =
  'aca4916c89b8fb47784d37ad592d378897f616569d3ee0d4'
export const DONATION_POOL = 'stratum+tcp://de.warthog.herominers.com:1143'
