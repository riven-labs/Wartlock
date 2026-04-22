import { Resvg } from '@resvg/resvg-js'
import { readFileSync, writeFileSync } from 'fs'
import { dirname, resolve } from 'path'
import toIco from 'to-ico'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

const SVG_SRC = resolve(ROOT, 'src/renderer/src/assets/images/Logo.svg')
const svg = readFileSync(SVG_SRC, 'utf-8')

/**
 * Rasterize the logo SVG at a given size. Because the mark sits against a very dark
 * chip, we want a small outer margin baked into the final PNG so OS chrome
 * (taskbar, shortcut overlay) doesn't clip the rounded corners.
 */
function rasterize(size) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
    background: 'rgba(0,0,0,0)',
  })
  return resvg.render().asPng()
}

const ICO_SIZES = [16, 24, 32, 48, 64, 128, 256]
const icoBuffers = ICO_SIZES.map((s) => rasterize(s))
const ico = await toIco(icoBuffers)

writeFileSync(resolve(ROOT, 'build/icon.ico'), ico)
writeFileSync(resolve(ROOT, 'build/icon.png'), rasterize(512))
writeFileSync(resolve(ROOT, 'resources/icon.png'), rasterize(512))

console.log('wrote build/icon.ico, build/icon.png, resources/icon.png')
