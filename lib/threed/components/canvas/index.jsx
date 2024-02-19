// ==============================================================
// ** RESOURCES

import { proxy, useSnapshot } from 'valtio'

import { Suspense, useState, useRef } from 'react'

// ** Helper Components
import Spinner from '#/ui/components/spinner'

import * as THREE from 'three'
import { Canvas, extend, useFrame, useThree } from '@react-three/fiber'
import { softShadows } from '@react-three/drei' // softShadows()
import { OrbitControls, TransformControls, Preload, Environment, Html, useProgress } from '@react-three/drei'
import { useGLTF, PresentationControls, ContactShadows } from '@react-three/drei'
import { GizmoHelper, GizmoViewcube, GizmoViewport, Center, PivotControls } from '@react-three/drei'
import { Stage, BakeShadows } from '@react-three/drei'
// import { Loader } from '@react-three/drei'

// import AppPage from '#/lib/threed/pages/_app-page'
// import BoxPage from '#/lib/threed/pages/box-page'
import BoxComponent from '#/lib/threed/components/box'
// import ShaderPage from '#/lib/threed/pages/shader-page'
import ShaderComponent from '#/lib/threed/components/shader'

// ** ThreeD Imports
import ThreeD from '#/lib/threed/components/nouns/ThreeD'
import Character from '~/lib/threed/components/nouns/Character'
// import StacyApp from '~/lib/threed/components/examples/Stacy/StacyApp'
// import Stacy from '~/lib/threed/components/examples/Stacy/Stacy'
// import Watch from '~/lib/threed/components/examples/Watch/Watch'
// import CoffeeCup from '~/lib/threed/components/examples/CoffeeCup/CoffeeCup'
// import JourneyLevel from '~/lib/threed/components/examples/JourneyLevel/App'
// import Shoes from '~/lib/threed/components/examples/Shoes/App'
// import TransformModel from '~/lib/threed/components/examples/TransformModel/App'
// import Shoe from '~/lib/threed/components/examples/Shoes/Shoe'

// ** COLORFUL CONSOLE MESSAGES (ccm)
import ccm from '#/lib/utils/console-colors'
// console.debug('%c~ccm', ccm)

// ==============================================================
// ** VARIABLES

// Reactive state model (using valtio)
const state = proxy({ current: null, mode: 0 })

// Model interactive "modes" using TransformControls
const modes = ['translate', 'rotate', 'scale']

// example working simple <Loader />
function LoaderSimple() {
  const { progress } = useProgress()
  return <Html center>{Math.round(progress)} % loaded</Html>
}

// Controls
function ThreeDControls() {
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
        autoRotate={false}
      />
    </>
  )
}

export default function ThreeDCanvas({ scene, models, children }) {
  // **
  // THE SCENE
  if (scene) {
    // console.debug('scene', scene)
    if (scene.length) {
      // console.debug('scene.length', scene.length)
    }
  }
  // inject models inside Suspense groups
  if (models) {
    // console.debug('models', models)
    if (models.length) {
      // console.debug('models.length', models.length)
    }
  }

  return (
    <Canvas
      camera={{ position: [-10, 10, 50], fov: 50 }}
      dpr={[1, 2]}
      shadows
      style={{
        height: '540px',
        width: '100%',
      }}
      // scene={scene}
      scene={{
        // background: new THREE.CubeTextureLoader().load(cubeMapURLs), // ThreeDGarden1.tsx
        background: new THREE.Color(0x111111),
      }}
    >
      <Preload all />

      {/* <Suspense fallback={<Html>HEY HEY HEY</Html>}> */}
      {/* <Suspense fallback={null}> */}
      {/* <Suspense fallback={<LoaderSimple />}> */}
      {/* <Suspense fallback={<Html center><Loader /></Html>}> */}
      <Suspense fallback={<Html center><Spinner /></Html>}>

        {/* <Environment
          preset='night'
          background={'only'}
        /> */}

        <ThreeDControls />

        {/* */}
        <GizmoHelper
          alignment='top-right'
          margin={[100, 100]}
        >
          <group scale={0.85}>
            <GizmoViewcube />
          </group>
          <group
            scale={1.75}
            position={[-30, -30, -30]}
          >
            <GizmoViewport
              labelColor='white'
              axisHeadScale={0.525}
              hideNegativeAxes
            />
          </group>
        </GizmoHelper>

        <ambientLight intensity={0.5} />
        <spotLight
          position={[10, 10, 10]}
          angle={0.15}
          penumbra={1}
          shadow-mapSize={[512, 512]}
          castShadow
        />

        <directionalLight
          castShadow
          position={[2.5, 5, 5]}
          intensity={1.5}
          shadow-mapSize={[1024, 1024]}
        >
          <orthographicCamera
            attach='shadow-camera'
            args={[-5, 5, 5, -5, 1, 50]}
          />
        </directionalLight>

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

        <ContactShadows
          position={[0, -1.4, 0]}
          opacity={0.75}
          scale={10}
          blur={2.5}
          far={4}
        />

        <axesHelper args={[100]} />
        <gridHelper args={[100, 10]} />

        {/* MODEL -- Monaco Watch
          auto-generated by: https://github.com/pmndrs/gltfjsx
          author: ar-watches (https://sketchfab.com/ar-watches)
          license: CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/)
          source: https://sketchfab.com/3d-models/tag-heuer-monaco-x-gulf-watch-31ba7140fb3146b2af3cbdc13022421c
          title: Tag Heuer Monaco X GULF Watch
        */}
        {/* <PresentationControls
          // global
          config={{ mass: 2, tension: 500 }}
          snap={{ mass: 4, tension: 1500 }}
          rotation={[0, 0.3, 0]}
          polar={[-Math.PI / 3, Math.PI / 3]}
          azimuth={[-Math.PI / 1.4, Math.PI / 2]}>
          <Watch rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} scale={0.005} />
        </PresentationControls> */}
        {/* MODEL -- Monaco Watch */}
        {/* <PresentationControls
          global
          config={{ mass: 2, tension: 500 }}
          snap={{ mass: 4, tension: 1500 }}
          rotation={[0, 0.3, 0]}
          polar={[-Math.PI / 3, Math.PI / 3]}
          azimuth={[-Math.PI / 1.4, Math.PI / 2]}>
          <CoffeeCup position={[1.25, 1, 3.25]} scale={2.5} />
        </PresentationControls> */}
        <PresentationControls
          // global
          config={{ mass: 2, tension: 500 }}
          snap={{ mass: 4, tension: 1500 }}
          rotation={[0, 0.3, 0]}
          polar={[-Math.PI / 3, Math.PI / 3]}
          azimuth={[-Math.PI / 1.4, Math.PI / 2]}
        >
          {/* <StacyApp position={[1.25, 1, 3.25]} scale={3.0} /> */}
          {/* <Stacy position={[1.25, 0.7, 3.25]} scale={5.0} /> */}
          <Character
            type='gardener'
            state={state}
            threedId={2}
            threed={{}}
            position={[1.25, 0.7, 3.25]}
            rotation={[0, 90, 0]}
            scale={5.0}
          />
        </PresentationControls>

        {/* Camera Action Rig */}
        {/*
          <ActionRig />
        */}

        {/* Transform Model using TransformControls */}
        {/*
        <TransformModel
          name='Zeppelin' // must match node name
          state={state}
          modes={modes}
          position={[-20, 10, 10]}
          rotation={[3, -1, 3]}
          scale={0.005}
        />
        */}

        {/* [MM] HEY HEY HEY */}
        {/* NEED TO SEND A THREED_SCENE TO A CANVAS, BUT THIS IS FINE FOR NOW */}
        <ThreeD state={state} threedId={1} threed={{}} />
        {/* [MM] HEY HEY HEY */}

        {/* <Stage environment="forest" intensity={0.7}> */}

        {/* SHOE + SHOES */}
        {/* <Stage intensity={0.7}>
          <Shoe color="tomato" position={[0, 0, 0]} />
          <Shoe color="orange" scale={-1} rotation={[0, 0.5, Math.PI]} position={[0, 0, -1]} />
        </Stage> */}

        <BakeShadows />

        {/* {children} */}
      </Suspense>
    </Canvas>
  )
}

// function Watch(props) {
//   const ref = useRef()
//   const { nodes, materials } = useGLTF('/objects/examples/watch-v1.glb')
//   useFrame((state) => {
//     const t = state.clock.getElapsedTime()
//     ref.current.rotation.x = -Math.PI / 1.75 + Math.cos(t / 4) / 8
//     ref.current.rotation.y = Math.sin(t / 4) / 8
//     ref.current.rotation.z = (1 + Math.sin(t / 1.5)) / 20
//     ref.current.position.y = (1 + Math.sin(t / 1.5)) / 10
//   })
//   return (
//     <group ref={ref} {...props} dispose={null}>
//       <mesh geometry={nodes.Object005_glass_0.geometry} material={materials.glass}>
//         <Html scale={100} rotation={[Math.PI / 2, 0, 0]} position={[180, -350, 50]} transform occlude>
//           <div className='annotation'>
//             <span style={{ fontSize: '1.5em' }}>🥕</span> 6,550
//           </div>
//         </Html>
//       </mesh>
//       <mesh castShadow receiveShadow geometry={nodes.Object006_watch_0.geometry} material={materials.watch} />
//     </group>
//   )
// }

// function CoffeeCup(props) {
//   const { nodes, materials } = useGLTF('/objects/examples/coffee-transformed.glb')
//   console.debug('materials', materials)
//   return (
//     <mesh
//       receiveShadow
//       castShadow
//       geometry={nodes.coffee_cup_top_16oz.geometry}
//       material={materials['13 - Default']}
//       {...props}
//       dispose={null}
//     />
//   )
// }

// EXAMPLE ANIMATION using hook 'useFrame' (with 'useRef' references)
function ActionRig() {
  return useFrame((state) => {
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, 1 + state.mouse.x / 4, 0.075)
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, 1.5 + state.mouse.y / 4, 0.075)
  })
}
