import { useEffect, useRef, useState } from 'react'
import { Minus, Plus } from '@phosphor-icons/react'
import * as THREE from 'three'
import { ORGAN_SIGNALS, loadAnatomy, type Body } from './body/anatomy'
import { ASTROBONE_CREDIT, REPLACED_ORGANS, beat, fitLandmarks, isWeightBearing, loadAstroAnatomy, type AstroAnatomy, type Landmark, type VesselGroup } from './body/astrobone'
import type { Build, Vec3 } from './body/sdf'
import type { Level } from './triage'

export interface Hotspot {
  id: string
  label: string
  pos: Vec3
  level: Level
}

interface Props {
  build: Build
  hotspots: Hotspot[]
  /** Signal to highlight (hovered or open). */
  activeId: string | null
  /** Signal the camera should move to (the open one). */
  focusId: string | null
  /** Resting heart rate for the beating heart. Defaults to 60 bpm. */
  heartRate?: number
  onPick: (id: string) => void
}

export type System = 'all' | 'blood' | 'neuro' | 'organs' | 'bones' | 'muscles'
const SYSTEMS: { id: System; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'blood', label: 'Heart and blood' },
  { id: 'neuro', label: 'Brain, eyes, spine' },
  { id: 'organs', label: 'Organs' },
  { id: 'bones', label: 'Bones' },
  { id: 'muscles', label: 'Muscles' },
]
/** Signal shown on the weight-bearing bones (bone loss without enough resistance exercise). */
const BONE_SIGNAL = 'exercise'
/** Signals shown on AstroBone's heart and vessels. */
const HEART_SIGNALS = ['vitals', 'basics']
const VESSEL_SIGNALS: Record<VesselGroup, string[]> = { major: ['hematocrit'], arteries: ['hematocrit'], veins: ['ijv'], pulmonary: ['vitals'], renal: ['urine'], other: [] }
const VESSEL_COLOR: Record<VesselGroup, [number, number, number]> = {
  major: [1, 0.36, 0.45],
  arteries: [0.91, 0.32, 0.42],
  veins: [0.36, 0.53, 1],
  pulmonary: [0.55, 0.49, 1],
  renal: [0.7, 0.49, 1],
  other: [0.69, 0.42, 0.47],
}
const SYSTEM_OF: Record<string, System> = {
  brain: 'neuro',
  'right eyeball': 'neuro',
  'left eyeball': 'neuro',
  'spinal cord': 'neuro',
  'vertebral column': 'neuro',
  heart: 'blood',
  aorta: 'blood',
  'blood vessels': 'blood',
  'right internal jugular vein': 'blood',
  'left internal jugular vein': 'blood',
}
type View = 'full' | 'head' | 'chest'
const VIEWS: Record<View, { zoom: number; at: number }> = { full: { zoom: 1, at: 0.5 }, head: { zoom: 3.4, at: 0.92 }, chest: { zoom: 2.3, at: 0.72 } }
const MAX_ZOOM = 5

const MAX_HOT = 6
const TINT: Record<Level, [number, number, number]> = { green: [0.8, 0.82, 0.86], amber: [0.96, 0.65, 0.14], red: [1, 0.42, 0.45] }
const MARKER: Record<Level, string> = { green: 'border-ink/80 bg-ink/50', amber: 'border-check bg-check', red: 'border-urgent bg-urgent' }
const RANK: Record<Level, number> = { green: 0, amber: 1, red: 2 }
/** Labels that open to the left, so two markers close together do not cover each other. */
const LABEL_LEFT = new Set(['sleep', 'onsd'])

const VERT = /* glsl */ `
varying vec3 vN;
varying vec3 vV;
varying vec3 vP;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal);
  vV = normalize(-mv.xyz);
  vP = position;
  gl_Position = projectionMatrix * mv;
}`

// Smooth glass-like body surface: clear in the middle, brighter at the edges.
const SKIN_FRAG = /* glsl */ `
uniform vec4 uHot[${MAX_HOT}];
uniform vec3 uHotCol[${MAX_HOT}];
uniform int uHotN;
uniform float uScan;
uniform float uFade;
varying vec3 vN;
varying vec3 vV;
varying vec3 vP;
void main() {
  float rim = 1.0 - abs(dot(normalize(vN), normalize(vV)));
  vec3 col = vec3(0.72, 0.76, 0.84);
  float a = 0.05 + 0.62 * pow(rim, 2.2);
  for (int i = 0; i < ${MAX_HOT}; i++) {
    if (i < uHotN) {
      float w = 1.0 - smoothstep(0.0, uHot[i].w, distance(vP, uHot[i].xyz));
      col = mix(col, uHotCol[i], w);
      a += w * 0.28 * (0.35 + rim);
    }
  }
  a += (1.0 - smoothstep(0.0, 0.018, abs(vP.y - uScan))) * 0.16;
  gl_FragColor = vec4(col, a * uFade);
}`

const ORGAN_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
uniform float uFade;
varying vec3 vN;
varying vec3 vV;
void main() {
  float rim = 1.0 - abs(dot(normalize(vN), normalize(vV)));
  gl_FragColor = vec4(uColor, uOpacity * uFade * (0.25 + 0.75 * pow(rim, 1.3)));
}`

interface Stage {
  setBuild: (b: Build) => void
  setHotspots: (h: Hotspot[]) => void
  setActive: (id: string | null) => void
  setFocus: (id: string | null) => void
  setSystem: (s: System) => void
  setHeartRate: (bpm: number) => void
  setView: (v: View) => void
  zoomBy: (factor: number) => void
  dispose: () => void
}

function createStage(host: HTMLDivElement, markerOf: (id: string) => HTMLElement | null, onCredit: (text: string) => void): Stage {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
  host.prepend(renderer.domElement)
  renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;touch-action:none;cursor:grab'
  renderer.domElement.setAttribute('aria-hidden', 'true')

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 50)
  const group = new THREE.Group()
  const body = new THREE.Group()
  scene.add(group)
  group.add(body)

  const fade = { value: reduce ? 1 : 0 }
  const skinUniforms = {
    uHot: { value: Array.from({ length: MAX_HOT }, () => new THREE.Vector4(0, 0, 0, 0.001)) },
    uHotCol: { value: Array.from({ length: MAX_HOT }, () => new THREE.Vector3(1, 1, 1)) },
    uHotN: { value: 0 },
    uScan: { value: -1 },
    uFade: fade,
  }
  const common = { transparent: true, depthWrite: false, side: THREE.DoubleSide, vertexShader: VERT }
  const skinMaterial = new THREE.ShaderMaterial({ ...common, uniforms: skinUniforms, fragmentShader: SKIN_FRAG })
  const skin = new THREE.Mesh(new THREE.BufferGeometry(), skinMaterial)
  skin.renderOrder = 2
  skin.visible = false
  body.add(skin)
  const organGroup = new THREE.Group()
  body.add(organGroup)

  // AstroBone layers: bones, muscles, heart and vessels (14 MB). They replace the original heart, aorta,
  // vessels and vertebral column as soon as they load.
  const astroGroup = new THREE.Group()
  body.add(astroGroup)
  let astro: AstroAnatomy | null = null
  let heartHz = 1
  let heartPhase = 0
  const mat = (rgb: [number, number, number], opacity: number) =>
    new THREE.ShaderMaterial({ ...common, side: THREE.FrontSide, uniforms: { uColor: { value: new THREE.Vector3(...rgb) }, uOpacity: { value: opacity }, uFade: fade }, fragmentShader: ORGAN_FRAG })
  const boneMat = mat([0.86, 0.84, 0.78], 0.1)
  const loadBoneMat = mat([0.86, 0.84, 0.78], 0.1)
  const muscleMat = mat([0.78, 0.42, 0.42], 0)
  const heartMat = mat([1, 0.25, 0.47], 0.8)
  const vesselMats = Object.fromEntries((Object.keys(VESSEL_COLOR) as VesselGroup[]).map((g) => [g, mat(VESSEL_COLOR[g], 0.4)])) as Record<VesselGroup, THREE.ShaderMaterial>
  const vesselBase: Record<VesselGroup, number> = { major: 0.4, arteries: 0.4, veins: 0.4, pulmonary: 0.4, renal: 0.4, other: 0.4 }
  let heartBase = 0.8
  // Fit AstroBone's model inside the current reference body by matching landmarks, not just height.
  const fitAstro = () => {
    if (!astro || !current) return
    const organ = (name: string) => current?.organs.find((o) => o.name === name)?.center
    const lk = organ('left kidney')
    const rk = organ('right kidney')
    const target: Partial<Record<Landmark, Vec3 | undefined>> = {
      heart: organ('heart'),
      kidneys: lk && rk ? [(lk[0] + rk[0]) / 2, (lk[1] + rk[1]) / 2, (lk[2] + rk[2]) / 2] : undefined,
      skull: organ('brain'),
      pelvis: organ('urinary bladder'),
    }
    const pairs: [Vec3, Vec3][] = []
    for (const k of Object.keys(target) as Landmark[]) {
      const a = astro.landmarks[k]
      const c = target[k]
      if (a && c) pairs.push([a, c])
    }
    const { scale, offset } = pairs.length >= 2 ? fitLandmarks(pairs) : { scale: current.height, offset: [0, 0, 0] as Vec3 }
    astro.root.scale.setScalar(scale)
    astro.root.position.set(...offset)
  }
  void loadAstroAnatomy().then((a) => {
    if (disposed || !a) return
    astro = a
    for (const m of a.bones) {
      m.material = isWeightBearing(m.name) ? loadBoneMat : boneMat
      m.renderOrder = 1
    }
    for (const m of a.muscles) {
      m.material = muscleMat
      m.renderOrder = 1
    }
    if (a.heart) {
      a.heart.userData.baseScale = a.heart.scale.x
      a.heart.material = heartMat
      a.heart.renderOrder = 1
    }
    for (const v of a.vessels) {
      v.mesh.material = vesselMats[v.group]
      v.mesh.renderOrder = 1
    }
    astroGroup.add(a.root)
    fitAstro()
    if (current) onCredit(`${current.attribution}; ${ASTROBONE_CREDIT}`)
    refresh()
  })

  const floor = new THREE.Mesh(
    new THREE.RingGeometry(0.5, 0.504, 96),
    new THREE.MeshBasicMaterial({ color: 0x3a3a41, transparent: true, side: THREE.DoubleSide }),
  )
  floor.rotation.x = Math.PI / 2
  body.add(floor)

  let bodies: Record<Build, Body> | null = null
  let current: Body | null = null
  let build: Build = 'male'
  let hot: Hotspot[] = []
  let active: string | null = null
  let disposed = false
  let organs: { name: string; mat: THREE.ShaderMaterial; mesh: THREE.Mesh; flagged: boolean; base: number }[] = []
  let system: System = 'all'
  // Camera: zoom 1 = whole body. focusY is the height the camera looks at, measured from the body's middle.
  let zoom = 1
  let zoomTo = 1
  let focusY = 0
  let focusTo = 0
  let baseDist = 4.75
  const clampView = () => {
    zoomTo = Math.min(MAX_ZOOM, Math.max(1, zoomTo))
    const reach = ((current?.height ?? 1.75) / 2) * (1 - 1 / Math.max(zoomTo, 1.0001)) + 0.05
    focusTo = Math.min(reach, Math.max(-reach, focusTo))
  }
  const resolve = (h: Hotspot): Vec3 => current?.anchors[h.id] ?? h.pos

  const refresh = () => {
    const flaggedOnes = hot.filter((h) => h.level !== 'green').slice(0, MAX_HOT)
    skinUniforms.uHotN.value = flaggedOnes.length
    flaggedOnes.forEach((h, i) => {
      const p = resolve(h)
      skinUniforms.uHot.value[i].set(p[0], p[1], p[2], 0.11)
      skinUniforms.uHotCol.value[i].set(...TINT[h.level])
    })
    for (const o of organs) {
      const ids = ORGAN_SIGNALS[o.name] ?? []
      let level: Level = 'green'
      for (const h of hot) if (ids.includes(h.id) && RANK[h.level] > RANK[level]) level = h.level
      const isActive = active !== null && ids.includes(active)
      const inSystem = system === 'all' || (SYSTEM_OF[o.name] ?? 'organs') === system
      o.flagged = level !== 'green'
      o.base = o.flagged ? 0.95 : isActive ? 0.75 : !inSystem ? 0.025 : system === 'all' ? 0.2 : 0.6
      o.mat.uniforms.uOpacity.value = o.base
      o.mesh.visible = o.base > 0.03 && !(astro && REPLACED_ORGANS.has(o.name))
      o.mat.uniforms.uColor.value.set(...(o.flagged ? TINT[level] : isActive ? [0.95, 0.96, 1] : [0.56, 0.6, 0.68]))
    }
    if (astro) {
      const levelOf = (ids: string[]): Level => {
        let level: Level = 'green'
        for (const h of hot) if (ids.includes(h.id) && RANK[h.level] > RANK[level]) level = h.level
        return level
      }
      const inBlood = system === 'all' || system === 'blood'
      // Bones: faint in the overview, solid in the Bones view, a faint frame behind the muscles and the spine.
      const boneBase = system === 'bones' ? 0.55 : system === 'muscles' || system === 'neuro' ? 0.12 : system === 'all' ? 0.08 : 0
      const boneLevel = levelOf([BONE_SIGNAL])
      const boneActive = active === BONE_SIGNAL
      boneMat.uniforms.uOpacity.value = boneBase
      loadBoneMat.uniforms.uOpacity.value = boneLevel !== 'green' || boneActive ? Math.max(boneBase, 0.8) : boneBase
      loadBoneMat.uniforms.uColor.value.set(...(boneLevel !== 'green' ? TINT[boneLevel] : boneActive ? [0.95, 0.96, 1] : [0.86, 0.84, 0.78]))
      muscleMat.uniforms.uOpacity.value = system === 'muscles' ? 0.4 : 0
      for (const m of astro.bones) m.visible = boneBase > 0
      for (const m of astro.muscles) m.visible = system === 'muscles'
      // Heart and vessels: red arteries, blue veins; flagged ones take the signal colour.
      const heartLevel = levelOf(HEART_SIGNALS)
      const heartActive = HEART_SIGNALS.includes(active ?? '')
      heartBase = heartLevel !== 'green' || heartActive ? 0.95 : inBlood ? 0.8 : 0.06
      heartMat.uniforms.uOpacity.value = heartBase
      heartMat.uniforms.uColor.value.set(...(heartLevel !== 'green' ? TINT[heartLevel] : [1, 0.25, 0.47]))
      if (astro.heart) astro.heart.visible = heartBase > 0.03
      for (const g of Object.keys(vesselMats) as VesselGroup[]) {
        const level = levelOf(VESSEL_SIGNALS[g])
        const isActive = VESSEL_SIGNALS[g].includes(active ?? '')
        vesselBase[g] = level !== 'green' || isActive ? 0.85 : system === 'blood' ? 0.6 : system === 'all' ? 0.3 : 0.03
        vesselMats[g].uniforms.uOpacity.value = vesselBase[g]
        vesselMats[g].uniforms.uColor.value.set(...(level !== 'green' ? TINT[level] : VESSEL_COLOR[g]))
      }
      for (const v of astro.vessels) v.mesh.visible = vesselBase[v.group] > 0.03
    }
  }

  const show = () => {
    if (!bodies) return
    current = bodies[build]
    for (const o of organs) o.mat.dispose()
    organGroup.clear()
    organs = current.organs.map((o) => {
      const mat = new THREE.ShaderMaterial({
        ...common,
        side: THREE.FrontSide,
        uniforms: { uColor: { value: new THREE.Vector3(0.56, 0.6, 0.68) }, uOpacity: { value: 0.2 }, uFade: fade },
        fragmentShader: ORGAN_FRAG,
      })
      const mesh = new THREE.Mesh(o.geometry, mat)
      mesh.renderOrder = 1
      organGroup.add(mesh)
      return { name: o.name, mat, mesh, flagged: false, base: 0.2 }
    })
    skin.geometry = current.skin
    skin.visible = true
    fitAstro()
    body.position.y = -current.height / 2
    if (!reduce) fade.value = 0
    onCredit(astro ? `${current.attribution}; ${ASTROBONE_CREDIT}` : current.attribution)
    refresh()
  }

  loadAnatomy().then((b) => {
    if (disposed) return
    if (!b) return onCredit('failed')
    bodies = b
    show()
  })

  // Drag to turn the body. Left alone, it sways slowly so both sides can be seen.
  // One finger or the mouse: turn (and slide up/down when zoomed in). Two fingers: pinch to zoom. Wheel: zoom.
  let userRot = -0.3
  let velocity = 0
  let dragging = false
  let lastX = 0
  let lastY = 0
  let pinch = 0
  const touches = new Map<number, { x: number; y: number }>()
  const el = renderer.domElement
  const spread = () => {
    const [a, b] = [...touches.values()]
    return Math.hypot(a.x - b.x, a.y - b.y)
  }
  const down = (e: PointerEvent) => {
    touches.set(e.pointerId, { x: e.clientX, y: e.clientY })
    el.setPointerCapture(e.pointerId)
    if (touches.size === 2) {
      pinch = spread()
      dragging = false
      return
    }
    dragging = true
    lastX = e.clientX
    lastY = e.clientY
    el.style.cursor = 'grabbing'
  }
  const move = (e: PointerEvent) => {
    if (!touches.has(e.pointerId)) return
    touches.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (touches.size === 2) {
      const d = spread()
      if (pinch > 0) zoomTo *= d / pinch
      pinch = d
      clampView()
      return
    }
    if (!dragging) return
    velocity = (e.clientX - lastX) * 0.009
    userRot += velocity
    const visibleHeight = 2 * (baseDist / zoom) * Math.tan((camera.fov * Math.PI) / 360)
    focusTo += ((e.clientY - lastY) / (host.clientHeight || 1)) * visibleHeight
    clampView()
    lastX = e.clientX
    lastY = e.clientY
  }
  const up = (e: PointerEvent) => {
    touches.delete(e.pointerId)
    pinch = 0
    dragging = false
    el.style.cursor = 'grab'
  }
  const wheel = (e: WheelEvent) => {
    e.preventDefault()
    zoomTo *= Math.exp(-e.deltaY * 0.0015)
    clampView()
  }
  el.addEventListener('pointerdown', down)
  el.addEventListener('pointermove', move)
  el.addEventListener('pointerup', up)
  el.addEventListener('pointercancel', up)
  el.addEventListener('wheel', wheel, { passive: false })

  const resize = () => {
    const w = host.clientWidth || 1
    const h = host.clientHeight || 1
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    baseDist = Math.max(4.75, 0.6 / (w / h) / Math.tan((camera.fov * Math.PI) / 360))
    camera.updateProjectionMatrix()
  }
  const observer = new ResizeObserver(resize)
  observer.observe(host)
  resize()

  const clock = new THREE.Clock()
  const v = new THREE.Vector3()
  let raf = 0
  const frame = () => {
    raf = requestAnimationFrame(frame)
    if (document.hidden || host.clientHeight === 0) return
    const dt = Math.min(clock.getDelta(), 0.05)
    const t = clock.elapsedTime
    if (fade.value < 1) fade.value = Math.min(1, fade.value + dt / 0.6)
    if (!dragging) {
      userRot += velocity
      velocity *= 0.92
    }
    const ease = reduce ? 1 : Math.min(1, dt * 7)
    zoom += (zoomTo - zoom) * ease
    focusY += (focusTo - focusY) * ease
    camera.position.set(0, focusY, baseDist / zoom)
    group.rotation.y = userRot + (reduce ? 0 : (Math.sin(t * 0.28) * 0.4) / zoom)
    skinUniforms.uScan.value = reduce ? -1 : ((t * 0.3) % 1.6) * 1.9 - 0.4
    if (!reduce) for (const o of organs) if (o.flagged) o.mat.uniforms.uOpacity.value = o.base * (0.72 + 0.28 * Math.sin(t * 3.2))
    // Heartbeat at the person's resting rate: the heart swells and brightens, the arteries pulse with it.
    if (astro?.heart && !reduce) {
      heartPhase = (heartPhase + dt * heartHz) % 1
      const b = beat(heartPhase)
      astro.heart.scale.setScalar(astro.heart.userData.baseScale * (1 + b * 0.07))
      heartMat.uniforms.uOpacity.value = Math.min(1, heartBase * (0.85 + 0.25 * b))
      for (const g of ['major', 'arteries'] as const) vesselMats[g].uniforms.uOpacity.value = Math.min(1, vesselBase[g] * (0.8 + 0.35 * b))
    }
    renderer.render(scene, camera)

    const w = host.clientWidth
    const h = host.clientHeight
    for (const hs of hot) {
      const node = markerOf(hs.id)
      if (!node) continue
      const p = resolve(hs)
      v.set(p[0], p[1], p[2])
      body.localToWorld(v)
      const front = v.z > -0.03
      v.project(camera)
      node.style.transform = `translate(${((v.x + 1) / 2) * w}px, ${((1 - v.y) / 2) * h}px)`
      node.style.visibility = Math.abs(v.x) < 1 && Math.abs(v.y) < 1 ? 'visible' : 'hidden'
      node.style.opacity = front ? '1' : '0.3'
      node.style.zIndex = front ? '2' : '1'
    }
  }
  frame()

  return {
    setBuild: (b) => {
      if (b === build && current) return
      build = b
      show()
    },
    setHotspots: (list) => {
      hot = list
      refresh()
    },
    setActive: (id) => {
      active = id
      refresh()
    },
    setFocus: (id) => {
      const h = id ? hot.find((x) => x.id === id) : undefined
      if (h && current) {
        zoomTo = 2.6
        focusTo = resolve(h)[1] - current.height / 2
      } else {
        zoomTo = 1
        focusTo = 0
      }
      clampView()
    },
    setSystem: (s) => {
      system = s
      refresh()
    },
    setHeartRate: (bpm) => {
      heartHz = Math.min(3, Math.max(0.5, bpm / 60))
    },
    setView: (v) => {
      zoomTo = VIEWS[v].zoom
      focusTo = (VIEWS[v].at - 0.5) * (current?.height ?? 1.75)
      clampView()
    },
    zoomBy: (factor) => {
      zoomTo *= factor
      clampView()
    },
    dispose: () => {
      disposed = true
      cancelAnimationFrame(raf)
      observer.disconnect()
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
      el.removeEventListener('wheel', wheel)
      for (const o of organs) o.mat.dispose()
      for (const m of [boneMat, loadBoneMat, muscleMat, heartMat, ...Object.values(vesselMats)]) m.dispose()
      astroGroup.clear()
      skinMaterial.dispose()
      floor.geometry.dispose()
      ;(floor.material as THREE.Material).dispose()
      renderer.dispose()
      el.remove()
    },
  }
}

export default function BodyScan({ build, hotspots, activeId, focusId, onPick, heartRate = 60 }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const stage = useRef<Stage | null>(null)
  const markers = useRef(new Map<string, HTMLElement>())
  const [credit, setCredit] = useState('')
  const [system, setSystem] = useState<System>('all')

  useEffect(() => {
    if (!host.current) return
    let s: Stage
    try {
      s = createStage(host.current, (id) => markers.current.get(id) ?? null, setCredit)
    } catch {
      return // No 3D support: the signal list still works.
    }
    stage.current = s
    return () => {
      s.dispose()
      stage.current = null
    }
  }, [])

  useEffect(() => stage.current?.setBuild(build), [build])
  useEffect(() => stage.current?.setHotspots(hotspots), [hotspots])
  useEffect(() => stage.current?.setActive(activeId), [activeId])
  useEffect(() => stage.current?.setFocus(focusId), [focusId])
  useEffect(() => stage.current?.setSystem(system), [system])
  useEffect(() => stage.current?.setHeartRate(heartRate), [heartRate])

  return (
    <div ref={host} className="relative h-full w-full overflow-hidden" role="group" aria-label="Body view. Markers show where each signal is measured.">
      {hotspots.map((h) => {
        const flag = h.level !== 'green'
        const active = h.id === activeId
        return (
          <button
            key={h.id}
            ref={(node) => {
              if (node) markers.current.set(h.id, node)
              else markers.current.delete(h.id)
            }}
            onClick={() => onPick(h.id)}
            aria-label={`${h.label}: ${h.level === 'green' ? 'normal' : h.level === 'amber' ? 'needs a check' : 'urgent'}`}
            aria-pressed={active}
            className="group absolute top-0 left-0 -mt-[22px] -ml-[22px] flex h-11 w-11 items-center justify-center transition-opacity duration-300"
          >
            {flag && <span className={`marker-ring absolute h-3.5 w-3.5 rounded-full border ${h.level === 'red' ? 'border-urgent' : 'border-check'}`} />}
            <span
              className={`relative rounded-full border transition-transform duration-200 group-hover:scale-150 ${flag ? 'h-2.5 w-2.5' : 'h-2 w-2'} ${MARKER[h.level]} ${active ? 'scale-150 ring-2 ring-ink/70 ring-offset-2 ring-offset-ground' : ''}`}
            />
            <span
              className={`pointer-events-none absolute rounded-md border border-line bg-panel/95 px-2 py-1 text-xs whitespace-nowrap transition-opacity duration-200 ${LABEL_LEFT.has(h.id) ? 'right-9' : 'left-9'} ${flag || active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'} ${h.level === 'red' ? 'text-urgent' : h.level === 'amber' ? 'text-check' : 'text-muted'}`}
            >
              {h.label}
            </span>
          </button>
        )
      })}
      {(credit === '' || credit === 'failed') && (
        <p className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center px-8 text-center text-sm text-muted" role="status">
          {credit === '' ? 'Loading the 3D body (13 MB)...' : 'The 3D body could not be loaded. The signals on the right still work.'}
        </p>
      )}
      <div className="absolute top-1/2 left-4 z-[3] flex -translate-y-1/2 flex-col gap-1.5">
        <button onClick={() => stage.current?.zoomBy(1.4)} aria-label="Zoom in" className="press flex h-11 w-11 items-center justify-center rounded-[10px] border border-line-strong bg-panel/90 hover:border-muted">
          <Plus size={18} />
        </button>
        <button onClick={() => stage.current?.zoomBy(1 / 1.4)} aria-label="Zoom out" className="press flex h-11 w-11 items-center justify-center rounded-[10px] border border-line-strong bg-panel/90 hover:border-muted">
          <Minus size={18} />
        </button>
        {(['head', 'chest', 'full'] as const).map((v) => (
          <button key={v} onClick={() => stage.current?.setView(v)} className="press h-11 w-11 rounded-[10px] border border-line-strong bg-panel/90 text-[11px] font-medium text-muted hover:border-muted hover:text-ink">
            {v === 'full' ? 'Body' : v === 'head' ? 'Head' : 'Chest'}
          </button>
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-0 z-[3] flex flex-col gap-2 p-4">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Show body system">
          {SYSTEMS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSystem(s.id)}
              aria-pressed={system === s.id}
              className={`press min-h-9 rounded-full border px-3 text-xs font-medium ${system === s.id ? 'border-ink bg-ink text-ground' : 'border-line-strong bg-panel/90 text-muted hover:text-ink'}`}
            >
              {s.label}
            </button>
          ))}
        </div>
        {credit && credit !== 'failed' && <p className="pointer-events-none text-[11px] leading-snug text-dim">Drag to turn, pinch or scroll to zoom. Reference body, not a scan of this person: {credit}.</p>}
      </div>
    </div>
  )
}
