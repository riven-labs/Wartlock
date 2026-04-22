import os from 'os'
import si from 'systeminformation'

/**
 * Snapshot of host hardware the user might care about when deciding whether
 * to mine. We pull from `systeminformation` for rich GPU + storage info and
 * fall back to Node's `os` for sizes/names when si doesn't return anything
 * useful. Result is safe to stringify and send over IPC.
 */

export type HardwareSnapshot = {
  os: {
    platform: string
    distro: string
    release: string
    arch: string
    hostname: string
    kernel: string
  }
  cpu: {
    manufacturer: string
    brand: string
    speedGHz: number
    physicalCores: number
    cores: number
    cacheL3KB: number | null
    temperatureC: number | null
    family: string | null
  }
  memory: {
    totalBytes: number
    availableBytes: number
    swapTotalBytes: number
    sticks: Array<{
      sizeBytes: number
      type: string | null
      speedMHz: number | null
      manufacturer: string | null
    }>
  }
  gpus: Array<{
    vendor: string | null
    model: string
    vramBytes: number | null
    driverVersion: string | null
    temperatureC: number | null
    utilizationGpu: number | null
    memoryUsedBytes: number | null
  }>
  disks: Array<{
    name: string | null
    type: string | null
    sizeBytes: number | null
    vendor: string | null
  }>
}

export async function getHardwareSnapshot(): Promise<HardwareSnapshot> {
  const [cpuInfo, cpuTemp, memInfo, memLayout, graphics, osInfo, diskLayout] =
    await Promise.all([
      si.cpu().catch(() => null),
      si.cpuTemperature().catch(() => null),
      si.mem().catch(() => null),
      si.memLayout().catch(() => []),
      si.graphics().catch(() => ({
        controllers: [] as si.Systeminformation.GraphicsControllerData[],
      })),
      si.osInfo().catch(() => null),
      si.diskLayout().catch(() => []),
    ])

  // --- OS ------------------------------------------------------------------
  const osBlock: HardwareSnapshot['os'] = {
    platform: osInfo?.platform ?? os.platform(),
    distro: osInfo?.distro ?? '',
    release: osInfo?.release ?? os.release(),
    arch: osInfo?.arch ?? os.arch(),
    hostname: osInfo?.hostname ?? os.hostname(),
    kernel: osInfo?.kernel ?? os.version(),
  }

  // --- CPU -----------------------------------------------------------------
  const nodeCpus = os.cpus()
  const cpuBlock: HardwareSnapshot['cpu'] = {
    manufacturer: cpuInfo?.manufacturer ?? '',
    brand: cpuInfo?.brand ?? nodeCpus[0]?.model ?? 'Unknown',
    speedGHz:
      cpuInfo && typeof cpuInfo.speed === 'number'
        ? cpuInfo.speed
        : nodeCpus[0]
          ? (nodeCpus[0].speed ?? 0) / 1000
          : 0,
    physicalCores: cpuInfo?.physicalCores ?? nodeCpus.length,
    cores: cpuInfo?.cores ?? nodeCpus.length,
    cacheL3KB: cpuInfo?.cache?.l3 ? cpuInfo.cache.l3 / 1024 : null,
    temperatureC:
      typeof cpuTemp?.main === 'number' && cpuTemp.main > 0
        ? cpuTemp.main
        : null,
    family: cpuInfo?.family ?? null,
  }

  // --- Memory --------------------------------------------------------------
  const memBlock: HardwareSnapshot['memory'] = {
    totalBytes: memInfo?.total ?? os.totalmem(),
    availableBytes: memInfo?.available ?? os.freemem(),
    swapTotalBytes: memInfo?.swaptotal ?? 0,
    sticks: (memLayout ?? []).map((s) => ({
      sizeBytes: s.size ?? 0,
      type: s.type ?? null,
      speedMHz: s.clockSpeed ?? null,
      manufacturer: s.manufacturer ?? null,
    })),
  }

  // --- GPUs ----------------------------------------------------------------
  const gpus: HardwareSnapshot['gpus'] = (graphics?.controllers ?? []).map(
    (g) => ({
      vendor: g.vendor ?? null,
      model: g.model ?? 'Unknown GPU',
      vramBytes: typeof g.vram === 'number' ? g.vram * 1024 * 1024 : null,
      driverVersion: g.driverVersion ?? null,
      temperatureC:
        typeof g.temperatureGpu === 'number' && g.temperatureGpu > 0
          ? g.temperatureGpu
          : null,
      utilizationGpu:
        typeof g.utilizationGpu === 'number' ? g.utilizationGpu : null,
      memoryUsedBytes:
        typeof g.memoryUsed === 'number' ? g.memoryUsed * 1024 * 1024 : null,
    }),
  )

  // --- Disks ---------------------------------------------------------------
  const disks: HardwareSnapshot['disks'] = (diskLayout ?? []).map((d) => ({
    name: d.name || null,
    type: d.type || null,
    sizeBytes: typeof d.size === 'number' ? d.size : null,
    vendor: d.vendor || null,
  }))

  return {
    os: osBlock,
    cpu: cpuBlock,
    memory: memBlock,
    gpus,
    disks,
  }
}
