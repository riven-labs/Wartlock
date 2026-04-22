const fs = require('fs')
const os = require('os')
const path = require('path')
const asar = require('@electron/asar')

/**
 * electron-builder@25 has a tree-walker bug that nests `call-bind-apply-helpers`
 * under `call-bind/node_modules/` instead of hoisting it to top-level. Peers
 * like `dunder-proto` / `get-intrinsic` then fail `require('call-bind-apply-helpers')`.
 * Mirror the nested copy to the top-level node_modules so Node can resolve it.
 *
 * Handles both asar and non-asar builds.
 */
exports.default = async function afterPack(context) {
  const missing = ['call-bind-apply-helpers']
  const asarPath = path.join(context.appOutDir, 'resources', 'app.asar')
  const unpackedRoot = path.join(context.appOutDir, 'resources', 'app')

  if (fs.existsSync(asarPath)) {
    await patchAsar(asarPath, missing)
  } else if (fs.existsSync(unpackedRoot)) {
    patchUnpacked(unpackedRoot, missing)
  }
}

function patchUnpacked(appRoot, missing) {
  const nm = path.join(appRoot, 'node_modules')
  for (const name of missing) {
    const dest = path.join(nm, name)
    if (fs.existsSync(dest)) continue
    const nested = path.join(nm, 'call-bind', 'node_modules', name)
    if (!fs.existsSync(nested)) {
      console.warn(`[afterPack] nested ${name} not found; skipping`)
      continue
    }
    fs.cpSync(nested, dest, { recursive: true })
    console.log(`[afterPack] hoisted ${name} to top-level (unpacked)`)
  }
}

async function patchAsar(asarPath, missing) {
  // Extract, patch, repack. asar archives for our app are ~25MB; this takes seconds.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wartlock-asar-'))
  try {
    asar.extractAll(asarPath, tmp)

    const nm = path.join(tmp, 'node_modules')
    let patched = false
    for (const name of missing) {
      const dest = path.join(nm, name)
      if (fs.existsSync(dest)) continue
      const nested = path.join(nm, 'call-bind', 'node_modules', name)
      if (!fs.existsSync(nested)) {
        console.warn(`[afterPack] nested ${name} not found inside asar; skipping`)
        continue
      }
      fs.cpSync(nested, dest, { recursive: true })
      console.log(`[afterPack] hoisted ${name} to top-level (asar)`)
      patched = true
    }

    if (patched) {
      await asar.createPackage(tmp, asarPath)
      console.log('[afterPack] repacked app.asar')
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
}
