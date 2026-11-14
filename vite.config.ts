import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Writes dist/sw.js listing every built file, so the app works offline after one visit.
// No runtime network calls beyond the app's own files; /api is never cached.
function offlineServiceWorker(): Plugin {
  let outDir = 'dist'
  return {
    name: 'motivaid-offline-sw',
    apply: 'build',
    configResolved(c) {
      outDir = c.build.outDir
    },
    closeBundle() {
      const walk = (d: string): string[] => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]))
      const files = walk(outDir).map((f) => relative(outDir, f).split('\\').join('/')).filter((f) => f !== 'sw.js')
      const hash = createHash('sha256')
      for (const f of files) hash.update(f).update(readFileSync(join(outDir, f)))
      const version = hash.digest('hex').slice(0, 12)
      const sw = `// Generated at build time. Cache-first for the app's own files; network-first for pages.
const CACHE = 'motivaid-${version}'
const FILES = ${JSON.stringify(['./', ...files.filter((f) => f !== 'index.html')])}
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()))
})
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()))
})
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)
  if (e.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.includes('/api/')) return
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).catch(() => caches.match('./', { ignoreVary: true })))
    return
  }
  e.respondWith(caches.match(e.request, { ignoreVary: true }).then((hit) => hit || fetch(e.request)))
})
`
      writeFileSync(join(outDir, 'sw.js'), sw)
    },
  }
}

export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), tailwindcss(), offlineServiceWorker()],
  server: { port: 5173, strictPort: true, proxy: { '/api': 'http://127.0.0.1:8787' } },
})
