// 'use client'
// ==========================================================
// RESOURCES

// ** APOLLO Imports
import { useReactiveVar } from '@apollo/client'
import {
  isPreferencesSetVar,
  preferencesDataVar,
  preferencesStore,
  projectStore,
} from '#/lib/stores/apollo'

// ** VALTIO ??
import { proxy, useSnapshot } from 'valtio'

import {
  Suspense,
  useState,
  useEffect,
  useRef,
  useTransition
} from 'react'

// ** LEVA CONTROLS Imports
import { useControls } from 'leva'

// THREE JS * ALL
import * as THREE from 'three'
// R3F
import {
  Canvas,
  useFrame,
  useThree,
  extend
} from '@react-three/fiber'

// R3F HELPERS
import {
  Environment, Stage,
  KeyboardControls,
  OrbitControls, TransformControls, PivotControls,
  GizmoHelper, GizmoViewcube, GizmoViewport,
  ContactShadows, BakeShadows,
  // softShadows, // softShadows()
  Loader, useProgress,
  Preload,
  Html, Center,
  useGLTF, useFBX,
} from '@react-three/drei'

// ** ThreeD Experience Imports
// import { Physics } from '@react-three/rapier'
// import { Perf } from 'r3f-perf'
// import Ecctrl from '#/lib/ecctrl/src/Ecctrl'
// import { EcctrlAnimation } from '#/lib/ecctrl/src/EcctrlAnimation'
import { EcctrlJoystick } from '#/lib/ecctrl/src/EcctrlJoystick'
// Components
// import Lights from './Lights'
// import Map from './Map'
// import CharacterModel from './CharacterModel'
// import Experience from '#/lib/ecctrl/example/Experience'
import ThreeDExperience from '#/lib/threed/components/canvas/Experience'

// ** ThreeD Noun Imports
// import ThreeDScenes from '#/lib/threed/components/nouns/Scene/Scene'
// import ThreeDPlans from '#/lib/threed/components/nouns/Plan/Plan'
// import ThreeDThreeDs from '#/lib/threed/components/nouns/ThreeD/ThreeD'
import ThreeDModels from '#/lib/threed/components/nouns/Model/Model'
// ThreeD EXAMPLES
// import Character from '~/lib/threed/components/nouns/Character/Character'
// import StacyApp from '~/lib/threed/components/examples/Stacy/StacyApp'
// import Stacy from '~/lib/threed/components/examples/Stacy/Stacy'
// import Watch from '~/lib/threed/components/examples/Watch/Watch'
// import CoffeeCup from '~/lib/threed/components/examples/CoffeeCup/CoffeeCup'
// import JourneyLevel from '~/lib/threed/components/examples/JourneyLevel/App'
// import Shoes from '~/lib/threed/components/examples/Shoes/App'
// import TransformModel from '~/lib/threed/components/examples/TransformModel/App'
// import Shoe from '~/lib/threed/components/examples/Shoes/Shoe'

// ** HELPER Components
import Spinner from '#/ui/components/spinner'
// ** UUID Imports
// import { v4 as newUUID } from 'uuid'
// ** COLORFUL CONSOLE MESSAGES (ccm)
import ccm from '#/lib/utils/console-colors'
// console.debug('%c ccm', ccm)

// ==============================================================
// ** VARIABLES

const debug = false // false | true // ts: boolean
const DEBUG = true // false | true // ts: boolean
const debug_deep = false // false | true // ts: boolean

// Model interactive 'modes' using TransformControls
const actionModes = ['translate', 'rotate', 'scale']

// example working simple <Loader />
function ThreeDLoaderSimple() {
  const { active, progress, errors, item, loaded, total } = useProgress()
  return <Html center>THREED GUI LOADING... {Math.round(progress)} %</Html>
}

export function ThreeDEnvironment() {

  // ** HOOKS
  let prefs = useReactiveVar(preferencesDataVar)

  // const [envPreset, setEnvPreset] = useState(prefs.environmentPreset) // 'park'
  // You can use the 'inTransition' boolean to react to the loading in-between state,
  // For instance by showing a message
  const [inTransition, startTransition] = useTransition()

  const [{ preset, blur }, setScenePreferencesLeva] = useControls(
    'Scene Preferences',
    () => (
      {
        preset: {
          label: 'Environment',
          value: prefs.environmentPreset, // envPreset,
          // const presetsObj = {
          //   apartment: 'lebombo_1k.hdr',
          //   city: 'potsdamer_platz_1k.hdr',
          //   dawn: 'kiara_1_dawn_1k.hdr',
          //   forest: 'forest_slope_1k.hdr',
          //   lobby: 'st_fagans_interior_1k.hdr',
          //   night: 'dikhololo_night_1k.hdr',
          //   park: 'rooitou_park_1k.hdr',
          //   studio: 'studio_small_03_1k.hdr',
          //   sunset: 'venice_sunset_1k.hdr',
          //   warehouse: 'empty_warehouse_01_1k.hdr'
          // };
          // export { presetsObj };
          options: [
            'park', 'sunset', 'dawn', 'night', 'forest',
            'studio', 'warehouse', 'apartment', 'lobby', 'city'
          ],
          // If onChange is present the value will not be reactive,
          // see https://github.com/pmndrs/leva/blob/main/docs/advanced/controlled-inputs.md#onchange
          // Instead we transition the preset value, which will prevents the suspense bound from triggering its fallback
          // That way we can hang onto the current environment until the new one has finished loading ...
          // onChange: (value) => startTransition(() => setEnvPreset(value))
        },
        blur: {
          label: 'Bg Blur',
          value: prefs.environmentBgBlur, // 0.00,
          min: 0.00,
          max: 0.20,
        },
      }
    ),
    {
      color: 'darkgreen',
      collapsed: false,
    },
  )

  // ==========================================================
  // ** environmentPreset
  // **
  useEffect(() => {
    let newData = {...prefs}
    // if (debug) console.debug('%c preset newData', ccm.green, newData)
    newData.environmentPreset = preset
    // if (debug) console.debug('%c preset newData UPDATED', ccm.green, newData)
    preferencesDataVar(newData)
    // if (debug) console.debug('%c preset preferencesDataVar', ccm.darkgreen, preferencesDataVar())
    if (debug) console.debug('%c⚙️ READ FROM MASTER REACTIVE VAR: prefs.environmentPreset', ccm.yellowAlert, prefs.environmentPreset)
  }, [preset])

  // **
  useEffect(() => {
    // if (prefs.environmentPreset != undefined) {
      setScenePreferencesLeva({ preset: prefs.environmentPreset })
    // }
    if (debug) console.debug('%c⚙️ READ FROM MASTER REACTIVE VAR: prefs.environmentPreset', ccm.greenAlert, prefs.environmentPreset)
  }, [prefs.environmentPreset])

  // ==========================================================
  // ** environmentBgBlur
  // **
  useEffect(() => {
    let newData = {...prefs}
    // console.debug('%c blur newData', ccm.green, newData)
    newData.environmentBgBlur = Math.round((blur + Number.EPSILON) * 100) / 100 // rounds to 2 decimal places
    // console.debug('%c blur newData UPDATED', ccm.green, newData)
    preferencesDataVar(newData)
    // console.debug('%c blur preferencesDataVar', ccm.darkgreen, preferencesDataVar())
    // setScenePreferencesLeva({ blur: blur })
    if (debug) console.debug('%c⚙️ READ FROM MASTER REACTIVE VAR: prefs.environmentBgBlur', ccm.yellowAlert, preferencesDataVar().environmentBgBlur)
  }, [blur])

  // **
  useEffect(() => {
    // if (prefs.environmentBgBlur != undefined) {
      setScenePreferencesLeva({ blur: prefs.environmentBgBlur })
    // }
    if (debug) console.debug('%c⚙️ READ FROM MASTER REACTIVE VAR: prefs.environmentBgBlur', ccm.greenAlert, prefs.environmentBgBlur)
  }, [prefs.environmentBgBlur])

  // ==========================================================

  return (
    <Environment
      preset={prefs.environmentPreset}
      blur={prefs.environmentBgBlur}
      // blur={preferencesDataVar().environmentBgBlur}
      background
    />
  )
}

// const controls = new OrbitControls(camera, renderer.domElement)
// camera.lookAt(0.5, 0.5, 0.5)
// controls.target.set(.5, .5, .5)
// controls.update()
// controls.addEventListener('change', () => console.debug('Controls Change'))
// controls.addEventListener('start', () => console.debug('Controls Start Event'))
// controls.addEventListener('end', () => console.debug('Controls End Event'))

// EXAMPLE ANIMATION using hook 'useFrame' (with 'useRef' references)
// function ActionRig() {
//   return useFrame((state) => {
//     // state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, 1 + state.mouse.x / 4, 0.01)
//     // state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, 1.5 + state.mouse.y / 4, 0.01)
//   })
// }



const EcctrlJoystickControls = () => {
  const [isTouchScreen, setIsTouchScreen] = useState(false)
  useEffect(() => {
    // Check if using a touch control device, show/hide joystick
    if (('ontouchstart' in window) ||
      (navigator.maxTouchPoints > 0)) {
      setIsTouchScreen(true)
    } else {
      setIsTouchScreen(false)
    }
  }, [])
  return (
    <>
      {isTouchScreen && <EcctrlJoystick buttonNumber={5} />}
    </>
  )
}


export function ThreeDCanvas({ _id, threeds }) { // , sceneState ??
  // **
  // if (debug) console.debug('%c📐 ThreeDCanvas props.threeds', ccm.darkredAlert, threeds)
  // if (debug) console.debug(`%c=======================================================`, ccm.darkred)

  // ** HOOKS
  const prefs = useReactiveVar(preferencesDataVar)

  // **
  return (
    <>

      <EcctrlJoystickControls />

      <Canvas
        // id={_id}
        camera={{ position: [-16, 16, 16], fov: 80 }}
        dpr={[1, 2]}
        shadows
        style={{
          height: '50vh',
          width: '100%',
        }}
        // ** SCENE
        // scene={sceneState.stuff}
        // scene={{
        //   // background: new THREE.CubeTextureLoader().load(cubeMapURLs), // ThreeDGarden1.tsx
        //   background: new THREE.Color(0x131313),
        // }}
        // ** JOYSTICK
        // onPointerDown={(e) => {
        //   if (e.pointerType === 'mouse') {
        //     e.target.requestPointerLock();
        //   }
        // }}
      >

        {/* <Preload all /> */}

        {/* SUSPENSEFUL... */}
        {/* <Suspense fallback={<Html>HEY HEY HEY</Html>}> */}
        {/* <Suspense fallback={null}> */}
        {/* <Suspense fallback={<ThreeDLoaderSimple />}> */}
        {/* <Suspense fallback={<Html center><Spinner /></Html>}> */}
        <Suspense fallback={
          <Html center>
            <Loader
              // containerStyles={...container} // Flex layout styles
              // innerStyles={...inner} // Inner container styles
              // barStyles={...bar} // Loading-bar styles
              // dataStyles={...data} // Text styles
              dataInterpolation={(p) => `Building UI ${p.toFixed(0)}%`} // Text
              initialState={(active = true) => active} // Initial black out state
            />
          </Html>
        }>

          {/* THREED ENVIRONMENT */}
          {/* <Stage environment='forest' intensity={0.7}></Stage> */}
          <ThreeDEnvironment />

          {/* <axesHelper args={[1024]} /> */}
          <gridHelper args={[1024, 16]} />
          {/* <Lights /> */}
          {/* <Perf position='top-left' minimal /> */}

          {/* THREED EXPERIENCE */}
          <ThreeDExperience />
          {/* <Experience /> */}

          {/* THREED SCENE FILES TO CANVAS */}
          {/* <ThreeDScene /> */}

          {/* THREED MODELS: WORKING !!! */}
          {/* SEND THREEDS OF MODEL[S] TO A CANVAS */}
          {/* {threeds.length && ( */}
            <ThreeDModels
              threeds={threeds}
            />
          {/* )} */}
          {/* <ThreeDControls /> */}

          {/* makeDefault makes the controls known to r3f,
              now transform-controls can auto-disable them when active */}
          <OrbitControls
            makeDefault
            minDistance={0.5}
            maxDistance={1024}
            // minZoom={10}
            // maxZoom={20}
            // minAzimuthAngle={-Math.PI / 4}
            // maxAzimuthAngle={Math.PI / 4}
            minPolarAngle={-1.75}
            maxPolarAngle={Math.PI / 1.75}
            enableZoom={true}
            zoomToCursor={false} // default is false
            zoomSpeed={1.0} // default is 1.0
            enableRotate={true}
            autoRotate={prefs.doAutoRotate} // default is false
            // autoRotate={preferencesDataVar().doAutoRotate} // default is false
            autoRotateSpeed={1.0} // default is 2.0
            rotateSpeed={1.0} // default is 1.0
            enableDamping={true} // slows down rotation after mouse release
            dampingFactor={0.04} // default is 0.05
            enablePan={true}
            screenSpacePanning={true}
          />

          {/* GIZMO HELPER */}
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

          {/* EFFECTS */}
          <ContactShadows
            position={[0, -1.4, 0]}
            opacity={0.75}
            scale={10}
            blur={2.5}
            far={4}
          />
          <BakeShadows />

          {/* Camera + Animation Action Rig */}
          {/* <ActionRig /> */}

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

          {/* SHOE + SHOES */}
          {/*
            <Stage intensity={0.7}>
              <Shoe color='tomato' position={[0, 0, 0]} />
              <Shoe color='orange' scale={-1} rotation={[0, 0.5, Math.PI]} position={[0, 0, -1]} />
            </Stage>
          */}

          {/* {children} */}
        </Suspense>
      </Canvas>
    </>
  )
}

export default ThreeDCanvas

// ** NOTES
// **
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
