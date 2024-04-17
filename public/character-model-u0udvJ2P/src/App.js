import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { Environment } from '@react-three/drei'
import { Perf } from 'r3f-perf'
import { Suspense } from 'react'
import Ecctrl from 'ecctrl'

import Lights from './Lights'
import Map from './Map'
import CharacterModel from './CharacterModel'

export default function App() {
  return (
    <>
      <Canvas shadows>
        <Perf position="top-left" />
        <Environment background files="/night.hdr" />
        <Lights />
        <Physics timeStep="vary">
          <Suspense fallback={null}>
            <Ecctrl mode="PointToMove">
              <CharacterModel />
            </Ecctrl>
            <Map />
          </Suspense>
        </Physics>
      </Canvas>
    </>
  )
}
