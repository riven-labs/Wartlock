import react from '@vitejs/plugin-react'
import {
  bytecodePlugin,
  defineConfig,
  externalizeDepsPlugin,
  swcPlugin,
} from 'electron-vite'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import tsconfigPaths from 'vite-tsconfig-paths'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8')) as {
  version: string
}

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin(), bytecodePlugin(), swcPlugin()],
  },
  preload: {
    plugins: [externalizeDepsPlugin(), bytecodePlugin()],
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
        '@renderer': resolve('src/renderer/src'),
        '@main': resolve('src/main'),
        '@preload': resolve('src/preload'),
      },
    },
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
    plugins: [react(), tsconfigPaths()],
  },
})
