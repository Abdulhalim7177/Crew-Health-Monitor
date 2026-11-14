// AstroBone anatomy layers, merged in from AstroBone (MIT code; https://github.com/mysunatislam/astrobone-space-apps-2026):
// bones, muscles, the heart and the blood vessels. They replace the matching parts of the original body
// (vertebral column, heart, aorta, vessels). Skin, brain, eyes, lungs, kidneys and the rest stay from the original.
// Assets: Z-Anatomy (CC BY-SA 4.0), derived from BodyParts3D, The Database Center for Life Science (CC BY-SA 2.1 Japan).
// Full notice: public/anatomy/astrobone/SOURCE-LICENSE.txt. One male reference body, not a scan of the crew.

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'

export const ASTROBONE_CREDIT = 'bones, muscles, heart and vessels from Z-Anatomy / BodyParts3D, CC BY-SA 4.0, via AstroBone'

/** Original-body organs that AstroBone's layers replace once loaded. */
export const REPLACED_ORGANS = new Set(['heart', 'aorta', 'blood vessels', 'right internal jugular vein', 'left internal jugular vein', 'vertebral column'])

export type VesselGroup = 'major' | 'arteries' | 'veins' | 'pulmonary' | 'renal' | 'other'

export interface AstroAnatomy {
  /** Unit-height model: feet at y = 0, centred on x and z. Scale it to the body's height. */
  root: THREE.Group
  bones: THREE.Mesh[]
  muscles: THREE.Mesh[]
  /** The heart, with its pivot at its own centre so it can beat in place. */
  heart: THREE.Mesh | null
  vessels: { group: VesselGroup; mesh: THREE.Mesh }[]
}

/** Weight-bearing bones that lose density fastest in weightlessness (AstroBone's grouping). Matched by name. */
const WEIGHT_BEARING = /tibia|femur|hip bone|coxal|pelvi|ilium|ischium|pubis|sacrum|lumbar|L[1-5] vertebra|calcaneus|talus|patella/i
export const isWeightBearing = (name: string) => WEIGHT_BEARING.test(name)

/** Heartbeat shape over one beat (phase 0..1): a strong beat, then a smaller one. From AstroBone's twin scene. */
export function beat(phase: number): number {
  return Math.exp(-(((phase - 0.08) / 0.05) ** 2)) + 0.45 * Math.exp(-(((phase - 0.3) / 0.06) ** 2))
}

let pending: Promise<AstroAnatomy | null> | null = null

export function loadAstroAnatomy(): Promise<AstroAnatomy | null> {
  pending ??= (async () => {
    try {
      const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
      const dir = `${import.meta.env.BASE_URL}anatomy/astrobone/`
      const [atlas, cardio] = await Promise.all([loader.loadAsync(`${dir}musculoskeletal.glb`), loader.loadAsync(`${dir}cardiovascular.glb`)])
      atlas.scene.updateMatrixWorld(true)
      cardio.scene.updateMatrixWorld(true)
      // Both files share Z-Anatomy's coordinate frame: fit them together using the skeleton's bounds.
      const inner = new THREE.Group()
      const bones: THREE.Mesh[] = []
      const muscles: THREE.Mesh[] = []
      atlas.scene.traverse((n) => {
        const m = n as THREE.Mesh
        if (!m.isMesh) return
        const system = (m.userData.system as string | undefined) ?? (m.parent?.name === 'muscles' ? 'muscles' : 'bones')
        m.name = (m.userData.anatomyName as string | undefined) ?? m.name
        ;(system === 'muscles' ? muscles : bones).push(m)
      })
      for (const m of [...bones, ...muscles]) inner.attach(m)
      const box = new THREE.Box3().setFromObject(inner)
      let heart: THREE.Mesh | null = null
      const vessels: AstroAnatomy['vessels'] = []
      const cardioMeshes: THREE.Mesh[] = []
      cardio.scene.traverse((n) => void ((n as THREE.Mesh).isMesh && cardioMeshes.push(n as THREE.Mesh)))
      for (const m of cardioMeshes) {
        const group = ((m.userData.cardiovascularGroup as string | undefined) ?? m.name) as VesselGroup | 'heart'
        inner.attach(m)
        if (group === 'heart') {
          // Move the pivot to the heart's centre, keeping it where it is.
          m.geometry = m.geometry.clone()
          m.geometry.computeBoundingBox()
          const c = m.geometry.boundingBox!.getCenter(new THREE.Vector3())
          m.geometry.translate(-c.x, -c.y, -c.z)
          m.position.add(c.multiply(m.scale).applyQuaternion(m.quaternion))
          heart = m
        } else vessels.push({ group, mesh: m })
      }
      const size = box.getSize(new THREE.Vector3())
      const s = 1 / size.y
      inner.scale.setScalar(s)
      inner.position.set(-((box.min.x + box.max.x) / 2) * s, -box.min.y * s, -((box.min.z + box.max.z) / 2) * s)
      const root = new THREE.Group()
      root.add(inner)
      return { root, bones, muscles, heart, vessels }
    } catch {
      return null
    }
  })()
  return pending
}
