// Bones and muscles layer, merged in from AstroBone (MIT code; https://github.com/mysunatislam/astrobone-space-apps-2026).
// Asset: Z-Anatomy (CC BY-SA 4.0) derived from BodyParts3D, The Database Center for Life Science (CC BY-SA 2.1 Japan).
// Full notice: public/anatomy/musculoskeletal/SOURCE-LICENSE.txt. One male reference skeleton, not a scan of the crew.

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'

export const SKELETON_CREDIT = 'bones and muscles from Z-Anatomy / BodyParts3D, CC BY-SA 4.0, via AstroBone'

export interface Skeleton {
  /** Unit-height model: feet at y = 0, centred on x and z. Scale it to the body's height. */
  root: THREE.Group
  bones: THREE.Mesh[]
  muscles: THREE.Mesh[]
}

/** Weight-bearing bones that lose density fastest in weightlessness (AstroBone's grouping). Matched by name. */
const WEIGHT_BEARING = /tibia|femur|hip bone|coxal|pelvi|ilium|ischium|pubis|sacrum|lumbar|L[1-5] vertebra|calcaneus|talus|patella/i

export const isWeightBearing = (name: string) => WEIGHT_BEARING.test(name)

let pending: Promise<Skeleton | null> | null = null

export function loadSkeleton(): Promise<Skeleton | null> {
  pending ??= new GLTFLoader()
    .setMeshoptDecoder(MeshoptDecoder)
    .loadAsync(`${import.meta.env.BASE_URL}anatomy/musculoskeletal/musculoskeletal.glb`)
    .then((gltf) => {
      const model = gltf.scene
      model.updateMatrixWorld(true)
      const bones: THREE.Mesh[] = []
      const muscles: THREE.Mesh[] = []
      model.traverse((n) => {
        const m = n as THREE.Mesh
        if (!m.isMesh) return
        const system = (m.userData.system as string | undefined) ?? (m.parent?.name === 'muscles' ? 'muscles' : 'bones')
        m.name = (m.userData.anatomyName as string | undefined) ?? m.name
        ;(system === 'muscles' ? muscles : bones).push(m)
      })
      const root = new THREE.Group()
      for (const m of [...bones, ...muscles]) root.attach(m)
      const box = new THREE.Box3().setFromObject(root)
      const size = box.getSize(new THREE.Vector3())
      const inner = new THREE.Group()
      while (root.children.length) inner.add(root.children[0])
      const s = 1 / size.y
      inner.scale.setScalar(s)
      inner.position.set(-((box.min.x + box.max.x) / 2) * s, -box.min.y * s, -((box.min.z + box.max.z) / 2) * s)
      root.add(inner)
      return { root, bones, muscles }
    })
    .catch(() => null)
  return pending
}
