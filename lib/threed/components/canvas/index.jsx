// ==============================================================
// ** RESOURCES

import { proxy, useSnapshot } from 'valtio'

import { Suspense, useState, useRef, useTransition } from 'react'
import { useControls } from 'leva'

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

// ** UUID Imports
import { v4 as newUUID } from 'uuid'

// ** COLORFUL CONSOLE MESSAGES (ccm)
import ccm from '#/lib/utils/console-colors'
// console.debug('%c~ccm', ccm)

// ==============================================================
// ** VARIABLES

const debug = false // false | true // ts: boolean
const DEBUG = true // false | true // ts: boolean

// Model interactive "modes" using TransformControls
const actionModes = ['translate', 'rotate', 'scale']

// example working simple <Loader />
function LoaderSimple() {
  const { progress } = useProgress()
  return <Html center>{Math.round(progress)} % loaded</Html>
}

function Env() {
  const [preset, setPreset] = useState('park')
  // You can use the "inTransition" boolean to react to the loading in-between state,
  // For instance by showing a message
  const [inTransition, startTransition] = useTransition()
  const { blur } = useControls({
    blur: { value: 0.17, min: 0.00, max: 1.00 },
    preset: {
      value: preset,
      options: ['sunset', 'dawn', 'night', 'warehouse', 'forest', 'apartment', 'studio', 'city', 'park', 'lobby'],
      // If onChange is present the value will not be reactive, see https://github.com/pmndrs/leva/blob/main/docs/advanced/controlled-inputs.md#onchange
      // Instead we transition the preset value, which will prevents the suspense bound from triggering its fallback
      // That way we can hang onto the current environment until the new one has finished loading ...
      onChange: (value) => startTransition(() => setPreset(value))
    }
  })
  return <Environment preset={preset} background blur={blur} />
}

function LevaControls() {

  const OFFSET_X = 20;
  const LAMPS_NB = 10;
  const LAMPS_SPEED = 0.8;
  const TREES_NB = 16;
  const TREES_SPEED = 0.4;
  const FAR_TREES_NB = 12;
  const FAR_TREES_SPEED = 0.08;
  const ROCKS_NB = 6;
  const ROCKS_SPEED = 0.5;
  const RANDOMIZER_STRENGTH_SCALE = 0.42;
  const RANDOMIZER_STRENGTH_POSITION = 1;

  const {
    lampsNb,
    treesNb,
    farTreesNb,
    rocksNb,
    lampsSpeed,
    treesSpeed,
    farTreesSpeed,
    rocksSpeed,
  } = useControls({
    lampsNb: {
      value: LAMPS_NB,
      min: 1,
      max: 100,
      step: 1,
    },
    lampsSpeed: {
      value: LAMPS_SPEED,
      min: 0.1,
      max: 2,
      step: 0.05,
    },
    treesNb: {
      value: TREES_NB,
      min: 1,
      max: 100,
      step: 1,
    },
    treesSpeed: {
      value: TREES_SPEED,
      min: 0.1,
      max: 2,
      step: 0.05,
    },
    farTreesNb: {
      value: FAR_TREES_NB,
      min: 1,
      max: 100,
      step: 1,
    },
    farTreesSpeed: {
      value: FAR_TREES_SPEED,
      min: 0.1,
      max: 2,
      step: 0.01,
    },
    rocksNb: {
      value: ROCKS_NB,
      min: 1,
      max: 100,
      step: 1,
    },
    rocksSpeed: {
      value: ROCKS_SPEED,
      min: 0.1,
      max: 2,
      step: 0.05,
    },
  });
}

// const controls = new OrbitControls(camera, renderer.domElement)
// camera.lookAt(0.5, 0.5, 0.5)
// controls.target.set(.5, .5, .5)
// controls.update()
// controls.addEventListener('change', () => console.log("Controls Change"))
// controls.addEventListener('start', () => console.log("Controls Start Event"))
// controls.addEventListener('end', () => console.log("Controls End Event"))

// export default function ThreeDCanvas({ sceneState, threeds, nodes }) {
export default function ThreeDCanvas({ _id, nodes }) {
  // **
  console.debug('%c props._id, props.nodes', ccm.orange, _id, nodes)
  // const nodesToModelAndLoad = nodes
  // console.debug('%c nodesToModelAndLoad', ccm.orange, nodesToModelAndLoad)

  // map threed to THREED, to pass on to Model
  const group = {
    group_id: newUUID(),
    group_position: [0, 0, 0],
    group_rotation: [-1.570796, 0, 0], // [0, 0, 0], // rotation: 1.570796 radians = 90 degrees
    group_scale: 0.05, // 0.01 | 0.05 | 0.5 | 1.0 | 5.0 | 50.0 | 100.0
  }

  return (
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

        {/* [MM] HEY HEY HEY */}

        {/* <Environment
          preset='dawn'
          background={'only'}
        /> */}
        <Env />

        <LevaControls />

        {/* makeDefault makes the controls known to r3f,
            now transform-controls can auto-disable them when active */}
        {/* <ThreeDControls /> */}
        <OrbitControls
          makeDefault
          minDistance={0.5}
          maxDistance={1600}
          // minZoom={10}
          // maxZoom={20}
          // minAzimuthAngle={-Math.PI / 4}
          // maxAzimuthAngle={Math.PI / 4}
          minPolarAngle={-1.75}
          maxPolarAngle={Math.PI / 1.75}
          enableZoom={true}
          zoomToCursor={true} // default is false
          zoomSpeed={1.0} // default is 1.0
          enableRotate={true}
          autoRotate={true} // default is false
          autoRotateSpeed={1.0} // default is 2.0
          rotateSpeed={1.0} // default is 1.0
          enableDamping={true} // slows down rotation after mouse release
          dampingFactor={0.01} // default is 0.05
          enablePan={true}
          screenSpacePanning={true}
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
        {nodes && (
          <ThreeDModels
            nodes={nodes}
            group={group}
          />
        )}
        {/* <CoffeeCup /> */}
        {/* [MM] HEY HEY HEY */}

        <BakeShadows />

        {/* */}
        <GizmoHelper
          alignment='top-right'
          margin={[64, 64]}
        >
          <group scale={1.00}>
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
          modes={actionModes}
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
