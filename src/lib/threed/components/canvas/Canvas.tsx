// 'use client'
// ==========================================================
// RESOURCES

import {
  Suspense,
  useState,
  useEffect,
  useRef,
  useTransition
} from 'react'

// THREE JS * ALL
import * as THREE from 'three'

// R3F
import {
  Canvas,
  Camera,
  useFrame,
  useThree,
  // extend, // extend({ OrbitControls })
} from '@react-three/fiber'

// R3F HELPERS
import {
  // Environment, Stage,
  // KeyboardControls,
  // OrbitControls, TransformControls, PivotControls,
  // GizmoHelper, GizmoViewcube, GizmoViewport,
  // ContactShadows, BakeShadows,
  // softShadows, // softShadows()
  Loader, useProgress,
  Preload,
  Html, Center,
  // useGLTF, useFBX,
} from '@react-three/drei'

// do stuff with IMPORTS ??
// extend({ OrbitControls })

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
// import ThreeDExperience from '#/lib/threed/components/canvas/Experience'
import ThreeDExperienceViewer from '#/lib/threed/components/canvas/ExperienceViewer'
import { threedIO } from '#/lib/threed/threedio/threedIO'

// ** LAYOUT Components (Head, Main, Foot)
// import CanvasWrapper from '#/lib/threed/components/canvas/CanvasWrapper'

// ** ThreeD Noun Imports
// import ThreeDScenes from '#/lib/threed/components/nouns/Scene/Scene'
// import ThreeDPlans from '#/lib/threed/components/nouns/Plan/Plan'
// import ThreeDThreeDs from '#/lib/threed/components/nouns/ThreeD/ThreeD'
import ThreeDModels from '#/lib/threed/components/nouns/Model/Model'
// ThreeD EXAMPLES
// import Character from '#/lib/threed/components/nouns/Character/Character'
// import StacyApp from '#/lib/threed/components/examples/Stacy/StacyApp'
// import Stacy from '#/lib/threed/components/examples/Stacy/Stacy'
// import Watch from '#/lib/threed/components/examples/Watch/Watch'
// import CoffeeCup from '#/lib/threed/components/examples/CoffeeCup/CoffeeCup'
// import JourneyLevel from '#/lib/threed/components/examples/JourneyLevel/App'
// import Shoes from '#/lib/threed/components/examples/Shoes/App'
// import TransformModel from '#/lib/threed/components/examples/TransformModel/App'
// import Shoe from '#/lib/threed/components/examples/Shoes/Shoe'

// ** HELPER Components
import Spinner from '#/layout/ui/components/spinner'
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



// CAMERA DATA INTERFACE (USING ZUSTAND SESSION STATE STORE)
import { create } from 'zustand'

const useStoreCamera = create(set => ({
  position: [-12, 4, -16],
  // @ts-expect-error
  setPosition: position => set({ position }),
  cameraPosition: [-16, 16, 16],
  // @ts-expect-error
  setCameraPosition: cameraPosition => set({ cameraPosition })
}))

// function CameraPositionTestApp() {
//   const setCameraPosition = useStoreCamera(state => state.setCameraPosition)
//   return (
//     <>
//       <Canvas>
//         <MyCameraReactsToStateChanges />
//       </Canvas>
//       <button onClick={() => setCameraPosition([0, 10, 20])}>set cameraPosition</button>
//     </>
//   )
// }

function MyCameraReactsToStateChanges() {
  // @ ts-expect-error
  // const [x, y, z] = useStoreCamera(state => state.cameraPosition)
  // @ts-expect-error
  const [x, y, z] = useStoreCamera(state => state.position)
  useFrame(state => {
    // @ts-expect-error
    state.camera.lerp({ x, y, z }, 0.1)
    state.camera.lookAt(0, 0, 0)
  })
}


export function ThreeDCanvas(
  { _id, threeds }: { _id: string, threeds: any[]}
) { // , sceneState ??
  // **
  // if (debug) console.debug('%c📐 ThreeDCanvas props.threeds', ccm.darkredAlert, threeds)
  // if (debug) console.debug(`%c=======================================================`, ccm.darkred)

  // // ** HOOKS
  // const prefs = useReactiveVar(preferencesDataVar)

  // ** REF-erences using REACT ???
  // const ref = useRef()

  // const setCameraPosition = useStoreCamera(state => state.setPosition)

  // **
  return (
    <>

      <EcctrlJoystick buttonNumber={5} />
      {/* <EcctrlJoystickControls /> */}

      {/* <CameraPositionTestApp /> */}
      {/* <button onClick={() => setCameraPosition([0, 10, 20])}>set cameraPosition</button> */}

      {/* TUNNELING R3F with tunnelrat IO */}
      {/* <threedIO.Out /> */}

      {/* HEY HEY HEY */}
      <Canvas
        
        // id={_id}
        
        style={{
          height: '72vh',
          // width: '100%',
        }}
        
        // camera={camera}
        camera={{ 
          position: [-12, 4, -16], 
          fov: 24,
          // near: 0.1,
          // far: 1000,
        }}

        dpr={[1, 2]}
        shadows

        onCreated={
          (state) => (state.gl.toneMapping = THREE.AgXToneMapping)
        }

        // ** SCENE
        // scene={sceneState.stuff}
        // scene={{
        //   // background: new THREE.CubeTextureLoader().load(cubeMapURLs), // ThreeDGarden1.tsx
        //   background: new THREE.Color(0x131313),
        // }}
        
        // ** JOYSTICK (optional)
        // onPointerDown={(e) => {
        //   if (e.pointerType === 'mouse') {
        //     (e.target as HTMLCanvasElement).requestPointerLock()
        //   }
        // }}
      >

        {/* <MyCameraReactsToStateChanges /> */}
  
        {/* <threedIO.Out /> */}

        {/* SUSPENSEFUL... */}
        {/* <Suspense fallback={<Html>HEY HEY HEY</Html>}> */}
        {/* <Suspense fallback={null}> */}
        {/* <Suspense fallback={<ThreeDLoaderSimple />}> */}
        {/* <Suspense fallback={<Html center><Spinner /></Html>}> */}
        <Suspense fallback={
          <Html center>
            <Spinner />
            <Loader
              // containerStyles={...container} // Flex layout styles
              // innerStyles={...inner} // Inner container styles
              // barStyles={...bar} // Loading-bar styles
              // dataStyles={...data} // Text styles
              dataInterpolation={(p) => `Building UI ${p.toFixed(0)}%`} // Text
              initialState={(active = false) => active} // Initial black out state
            />
          </Html>
        }>

        {/* PRELOAD objects ??? -- does it seem necessary? */}
        <Preload all />
          
          {/* THREED EXPERIENCE : VIEWER */}
          {/* <Experience /> */}
          {/* <ThreeDExperience /> */}
          {/* ExperienceViewer = forwardRef(({ children, enableOrbit, ...props }, ref) => {} */}
          {/* @ts-expect-error */}
          <ThreeDExperienceViewer>
          {/* <ThreeDExperienceViewer ref={ref} enableOrbit={true}> */}

            {/* THREED MODELS: WORKING !!! */}
            {/* SEND THREEDS OF MODEL[S] TO A CANVAS */}
            <ThreeDModels
              threeds={threeds}
            />

          </ThreeDExperienceViewer>

          {/* HERE ??? NO */}
          {/* <EcctrlJoystickControls /> */}

        </Suspense>
      </Canvas>
    </>
  )
}

export default ThreeDCanvas
