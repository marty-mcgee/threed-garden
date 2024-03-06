// ==============================================================
// ** RESOURCES

import { proxy, useSnapshot } from 'valtio'

import { Suspense, useState, useRef } from 'react'

// ** Helper Components
import Spinner from '#/ui/components/spinner'

// THREE JS * ALL
import * as THREE from 'three'
// R3F
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber'
// R3F HELPERS
import { OrbitControls, TransformControls, Preload, Environment, Html, useProgress, useGLTF } from '@react-three/drei'
import { ContactShadows } from '@react-three/drei'
import { GizmoHelper, GizmoViewcube, GizmoViewport, Center, PivotControls } from '@react-three/drei'
import { Stage, BakeShadows } from '@react-three/drei'
import { softShadows } from '@react-three/drei' // softShadows()
// import { Loader } from '@react-three/drei'

// ** ThreeD Imports
// import Scene from '#/lib/threed/components/nouns/Scene'
// import Plan from '#/lib/threed/components/nouns/Plan'
// import ThreeD from '#/lib/threed/components/nouns/ThreeD'
import ThreeDModels from '#/lib/threed/components/nouns/Model'
// ThreeD EXAMPLES
// import Character from '~/lib/threed/components/nouns/Character'
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

const debug = false // false | true // ts: boolean
const DEBUG = true // false | true // ts: boolean

// Model interactive "modes" using TransformControls
const modes = ['translate', 'rotate', 'scale']

// example working simple <Loader />
function LoaderSimple() {
  const { progress } = useProgress()
  return <Html center>{Math.round(progress)} % loaded</Html>
}

// export default function ThreeDCanvas({ sceneState, threeds, nodes }) {
export default function ThreeDCanvas({ _id, nodes }) {
  // **
  const nodesToModelAndLoad = nodes
  // console.debug('%c nodesToModelAndLoad', ccm.orange, nodesToModelAndLoad)

  // if (sceneState) {
  //   if (debug) console.debug('%c sceneState to load to ThreeDCanvas', ccm.yellow, sceneState)
  //   if (sceneState.length) {
  //     // if (debug) console.debug('sceneState.length', sceneState.length)
  //   }
  // }
  // // THE THREEDS ==== // THE NOUNS (to use)
  // if (threeds) {
  //   if (debug) console.debug('%c threeds to load to ThreeDCanvas', ccm.yellow, threeds)
  //   if (threeds.length) {
  //     // if (debug) console.debug('threeds.length', threeds.length)
  //   }
  // }
  // // THE NODES ==== // THE NOUNS.NODES (to use)
  // if (nodes) {
  //   if (debug) console.debug('%c nodes to load to ThreeDCanvas', ccm.yellow, nodes)
  //   if (nodes.length) {
  //     // if (debug) console.debug('nodes.length', nodes.length)
  //   }
  // }

  // return <></>
  return (
    <>
    <Canvas
      // id={_id}
      camera={{ position: [-10, 10, 50], fov: 50 }}
      dpr={[1, 2]}
      shadows
      style={{
        height: '480px',
        width: '100%',
      }}
      // scene={sceneState.stuff}
      scene={{
        // background: new THREE.CubeTextureLoader().load(cubeMapURLs), // ThreeDGarden1.tsx
        background: new THREE.Color(0x131313),
      }}
    >
      {/* <Preload all /> */}

      {/* <Suspense fallback={<Html>HEY HEY HEY</Html>}> */}
      {/* <Suspense fallback={null}> */}
      {/* <Suspense fallback={<LoaderSimple />}> */}
      {/* <Suspense fallback={<Html center><Loader /></Html>}> */}
      {/* <Suspense fallback={<Html center><Spinner /></Html>}> */}

        {/* <Environment
          preset='night'
          background={'only'}
        /> */}

        {/* [MM] HEY HEY HEY */}

        {/* <ThreeDControls /> */}
        {/* makeDefault makes the controls known to r3f, now transform-controls can auto-disable them when active */}
        <OrbitControls
          makeDefault
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 1.75}
          autoRotate={false}
        />

        {/* NEED TO LOAD THREEDSCENE FILES TO A CANVAS */}
        {/* <ThreeDScene state={state} files={files} /> */}

        {/* NEED TO SEND THREEDS OF MODEL[S] TO A CANVAS */}
        {/* <ThreeDPlan state={state} models={models} /> */}
        {/* <ThreeDModel
          name='HEY HEY HEY -- LOAD STATES TO CANVAS' // todo: set appropriately
          modelState={modelState} // funzees in action -- communication points
          sceneState={sceneState} // funzees in action -- communication points
          storeState={storeState} // funzees in action -- communication points
          nodes={nodes} // YES, use this (load these nodes to canvas, as one model/many models)
          // file={nodes[0].nodes.file.url} // K.I.S.S.
        /> */}
        {nodesToModelAndLoad.length && (
          <ThreeDModels nodes={nodesToModelAndLoad} />
        )}
        {/* <CoffeeCup /> */}
        {/* [MM] HEY HEY HEY */}

        <BakeShadows />

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

        {/* <Stage environment="forest" intensity={0.7}> */}

        {/* SHOE + SHOES */}
        {/* <Stage intensity={0.7}>
          <Shoe color="tomato" position={[0, 0, 0]} />
          <Shoe color="orange" scale={-1} rotation={[0, 0.5, Math.PI]} position={[0, 0, -1]} />
        </Stage> */}

        {/* {children} */}
      {/* </Suspense> */}
    </Canvas>
    </>
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

// // EXAMPLE ANIMATION using hook 'useFrame' (with 'useRef' references)
// function ActionRig() {
//   return useFrame((state) => {
//     state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, 1 + state.mouse.x / 4, 0.075)
//     state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, 1.5 + state.mouse.y / 4, 0.075)
//   })
// }
