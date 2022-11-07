// ==============================================================
// ** RESOURCES

import { proxy, useSnapshot } from 'valtio'

import { Suspense, useState } from 'react'

import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, TransformControls, Preload, Environment, Html, useProgress } from '@react-three/drei'

// import AppPage from '~/components/threed/pages/_app-page'
// import BoxPage from '~/components/threed/pages/box-page'
import BoxComponent from '~/components/threed/components/canvas/Box'
// import ShaderPage from '~/components/threed/pages/shader-page'
import ShaderComponent from '~/components/threed/components/canvas/Shader'

// ** ThreeD Imports
import ThreeD from '~/components/threed/components/canvas/Nouns/ThreeD'

// ** COLORFUL CONSOLE MESSAGES (ccm)
import { ccm0, ccm1, ccm2, ccm3, ccm4, ccm5, ccm6 } from '~/@core/utils/console-colors'

// ==============================================================
// ** VARIABLES

// Reactive state model (using valtio)
const state = proxy({ current: null, mode: 0 })

// Model interactive "modes" using TransformControls
const modes = ['translate', 'rotate', 'scale']

function Loader() {
  const { progress } = useProgress()
  return <Html center>{Math.round(progress)} % loaded</Html>
}

// Controls
function Controls() {
  // Get 'snap' notified on changes to state + scene
  const snap = useSnapshot(state)
  const scene = useThree((state) => state.scene)

  return (
    <>
      {/* As of drei@7.13 transform-controls can refer to the target by children, or the object prop */}
      {snap.current && (
        <TransformControls
          object={scene.getObjectByName(snap.current)}
          mode={modes[snap.mode]}
        />
      )}
      {/* makeDefault makes the controls known to r3f, now transform-controls can auto-disable them when active */}
      <OrbitControls
        makeDefault
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 1.75}
      />
    </>
  )
}

export default function VCanvas({ models, children }) {
  // inject models inside Suspense groups
  if (models) {
    console.debug('models', models)
    if (models.length) {
      console.debug('models.length', models.length)
    }
  }

  return (
    <Canvas
      camera={{ position: [-10, 10, 100], fov: 50 }}
      dpr={[1, 2]}
      style={{
        height: '480px',
        width: '100%',
      }}
    >
      <Controls />
      <Preload all />
      <Suspense fallback={<Loader />}>
        <axesHelper args={[100]} />
        <gridHelper args={[100, 10]} />
        <pointLight
          position={[100, 100, 100]}
          intensity={0.8}
        />
        <hemisphereLight
          color='#ffffff'
          groundColor='#b9b9b9'
          position={[-7, 25, 13]}
          intensity={0.85}
        />
        {/* [MM] HEY HEY HEY */}
        {/* NEED TO SEND A THREED_SCENE TO A CANVAS, BUT THIS IS FINE FOR NOW */}
        <ThreeD
          state={state}
          threedId={1}
          threed={{}}
        />
        {/* [MM] HEY HEY HEY */}
        {children}
        <Environment
          preset='forest'
          background
        />
      </Suspense>
    </Canvas>
  )
}
