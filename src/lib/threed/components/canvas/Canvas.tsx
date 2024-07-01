// 'use client'
// ==========================================================
// RESOURCES

// ** APOLLO CLIENT STORE+STATE Imports
import { useApolloClient, useReactiveVar } from '@apollo/client'
import {
  isPreferencesSetVar,
  preferencesDataVar,
  preferencesStore,
  projectStore,
  // ...stores
} from '#/lib/stores/apollo'
// ** ZUSTAND (X?) // for cameras, lights, canvas props
// import { create } from 'zustand'
import { createStore } from 'zustand-x'

// ** REACT Imports
import {
  Suspense,
  useState,
  useEffect,
  useRef,
  useTransition
} from 'react'

// ** THREE JS Imports
import * as THREE from 'three'

// ** R3F Imports
import {
  Canvas,
  // Camera, // use PerspectiveCamera from drei library
  useFrame,
  useThree,
  // extend, // if using function extend({ OrbitControls })
} from '@react-three/fiber'

// ** R3F HELPERS
import {
  PerspectiveCamera,
  // Environment, Stage,
  // KeyboardControls,
  // OrbitControls, TransformControls, PivotControls,
  // GizmoHelper, GizmoViewcube, GizmoViewport,
  // ContactShadows, BakeShadows,
  // softShadows, // softShadows()
  Preload,
  Loader, useProgress,
  Html, Center,
  // useGLTF, useFBX,
} from '@react-three/drei'

// ** RADIX-UI Imports
import * as Progress from '@radix-ui/react-progress'
import * as Collapsible from '@radix-ui/react-collapsible'
import * as Accordion from '@radix-ui/react-accordion'
import {
  ChevronDownIcon,
  RowSpacingIcon, 
  Cross2Icon,
} from '@radix-ui/react-icons'
import {
  Box,
  Button,
  Grid,
  Text,
} from '@radix-ui/themes'


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

// Model interactive 'modes' using TransformControls
const actionModes = ['translate', 'rotate', 'scale']

// example working simple <Loader />
function ThreeDLoaderSimple() {
  
  // ** using react-three-drei
  const { active, progress, errors, item, loaded, total } = useProgress()

  // ** using radix-ui
  // import React from 'react'
  // import * as Progress from '@radix-ui/react-progress'
  // import './styles.css'

  // const ProgressDisplay = () => {
    const [progressValue, setProgressValue] = useState(progress)

    useEffect(() => {
      const timer = setTimeout(() => setProgressValue(progress), 500)
      return () => clearTimeout(timer)
    }, [])

    // ** integrate drei with radix
    return (
      <Html center>
        <Progress.Root
          value={progressValue}
          className="ProgressRoot"
        >
          <span style={{paddingLeft: '8px'}}>THREED UI LOADING... {Math.round(progress)} %</span>
          <Progress.Indicator
            className="ProgressIndicator"
            style={{ transform: `translateX(-${100 - progress}%)` }}
          />
        </Progress.Root>
      </Html>
    )
  // }
  // export default ProgressDisplay
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


// ==========================================================
// CAMERA DATA INTERFACE (USING ZUSTAND SESSION STATE STORE)
// ==========================================================
// import { create } from 'zustand'
// const storeCamera = create(set => ({
//   position: [0, 0, 0],
//   setPosition: (position: number[]) => set({ position }),
//   // cameraPosition: [-16, 4, -16],
//   // setCameraPosition: (cameraPosition: number[]) => set({ cameraPosition })
// }))
// ** ZUSTAND-X : CAMERA STORE
const storeCamera = createStore('threedCamera')(({
  position: [-1, 1, -1],
  // setPosition: (position: number[]) => set({ position }),
  // cameraPosition: [-16, 4, -16],
  // setCameraPosition: (cameraPosition: number[]) => set({ cameraPosition })
}))
// // Note that the zustand(x) store is accessible through:
// // hook store
// storeCamera.useStore
// // vanilla store
// storeCamera.store
// // reactive (tracked) hooks
// storeCamera.useTracked.owner()
// // Getters
// // Don't overuse hooks. If you don't need to subscribe to the state, use instead the get method:
// storeCamera.get.name()
// storeCamera.get.stars()
// // You can also get the whole state object:
// storeCamera.get.state()
// **
// console.debug('%c storeCamera.get.state()', ccm.redAlert, storeCamera.get.state())
console.debug('%c storeCamera.get.state().position()', ccm.redAlert, storeCamera.get.position())
// console.debug('%c storeCamera.useTracked.position()', ccm.redAlert, storeCamera.useTracked.position())




const MyCameraReactsToStateChanges = () => {
  // ** GET + SET camera
  // @ts-expect-error
  const [x, y, z] = storeCamera(state => state.position)
  // @ ts-expect-error
  // const [x, y, z] = storeCamera(state => state.cameraPosition)
  // useFrame(state => {
  //   // @ ts-expect-error
  //   // state.camera.lerp({ x, y, z }, 0.1)
  //   // state.camera.lookAt(0, 0, 0)
    console.debug('%c MyCameraReactsToStateChanges: state.position', ccm.redAlert, x, y, z)
  // })
  // ** RETURN JSX (???)
  return <></>
}

const setTheCameraPosition = () => {
  // ** GET camera
  const getCameraPosition = useThree(state => {
    // console.debug('%c MyCameraReactsToStateChanges: state.camera', ccm.redAlert, state.camera)
    // get [state.camera.position.x, state.camera.position.y, state.camera.position.z]
    console.debug('%c MyCameraReactsToStateChanges: GET state.camera.position', ccm.redAlert, state.camera.position)
    return state.camera.position
  })
  // ** SET camera position -- TODO
  // const setCameraPosition = storeCamera(state => {
  //   console.debug('%c MyCameraReactsToStateChanges: SET state.camera.position', ccm.redAlert)
  //   // @ts-expect-error
  //   return state.setPosition([12,2,12])
  // })
}

// ==========================================================
// ** NOTES on CAMERAS
// // CREATE THREED CAMERA
// let threedCamera = { 
//   position: new THREE.Vector3(-12, 4, -16), 
//   fov: 32,
//   // near: 0.1,
//   // far: 1000,
// }
// LINK 1: https://discourse.threejs.org/t/accessing-the-camera-in-react-three-fiber-out-of-the-canvas/39137/2
// LINK 2: https://discourse.threejs.org/t/accessing-the-camera-in-react-three-fiber-out-of-the-canvas/39137/4
// response: "not sure what you mean by outside, the camera only exists within the canvas..
// you can access it after the canvas has been created
// <Canvas onCreated=(state => ({ state.camera.fov = 45, state.camera.position = [0, 0, 0] }))
// within every component
// <Canvas>
//   <Foo />
// function Foo() {
//   const camera = useThree(state => state.camera)
// you could also use a declarative camera
// import { PerspectiveCamera } '@react-three/drei'
// const config = { fov: 35, position: [0, 0, 10] }
// <Canvas>
//   <PerspectiveCamera {...config} />

// ** interact with camera using a HOOK
// const setCameraPosition = storeCamera(state => state.setPosition)

// moved inside experience
// const camera = useThree(state => state.camera)
// console.debug('get camera', camera)

// ==========================================================
// ** FOO -- GET CAMERA
function FooGetCamera() {
  const fooGetCamera = () => useThree(state => {
    state.camera
    // console.debug('Foo: get state.camera', state.camera)
    console.debug('FooGetCamera: state.camera.position', state.camera.position)
    // state.camera.position.x, state.camera.position.y, state.camera.position.z
  })
  return (
    <Html>
      <Button onClick={() => fooGetCamera()}>get cameraPosition</Button>
    </Html>
  )
}
// ==========================================================

// ** RETURN ThreeDCanvas
export const ThreeDCanvas = (
  { _id, threeds }: { _id: string, threeds: any[]}
) => {
  
  // **
  // if (debug) console.debug('%c📐 ThreeDCanvas props.threeds', ccm.darkredAlert, threeds)
  // if (debug) console.debug(`%c=======================================================`, ccm.darkred)

  // // ** HOOKS
  const prefs = useReactiveVar(preferencesDataVar)
  // console.debug('%c prefs', ccm.red, prefs)

  // ** REF-erences using REACT ???
  const ref: any = useRef<any>()

  // ** CREATE THREED CAMERA
  let threedCamera = { 
    // position: new THREE.Vector3(x, y, z),
    position: new THREE.Vector3(-16, 4, -32), // custom starting camera position
    fov: 24, // 100
    // near: 0.1,
    // far: 1000,
  }
  // LINK 1: https://discourse.threejs.org/t/accessing-the-camera-in-react-three-fiber-out-of-the-canvas/39137/2
  // LINK 2: https://discourse.threejs.org/t/accessing-the-camera-in-react-three-fiber-out-of-the-canvas/39137/4
  // response: "not sure what you mean by outside, the camera only exists within the canvas..
  // you can access it after the canvas has been created
  // <Canvas onCreated=(state => ({ state.camera.fov = 45, state.camera.position = [0, 0, 0] }))
  // within every component
  // <Canvas>
  //   <Foo />
  // function Foo() {
  //   const camera = useThree(state => state.camera)
  // you could also use a declarative camera
  // import { PerspectiveCamera } '@react-three/drei'
  // const config = { fov: 35, position: [0, 0, 10] }
  // <Canvas>
  //   <PerspectiveCamera {...config} />

  // ** interact with camera using a HOOK
  // const setCameraPosition = storeCamera(state => state.setPosition)

  // moved inside experience
  // const camera = useThree(state => state.camera)
  // console.debug('get camera', camera)

  // @ ts-expect-error
  // const [x, y, z] = storeCamera(state => state.position)
  // ** GET CAMERA
  // function FooGetCamera() {
    // const fooGetCamera = () => useThree(state => {
    //   state.camera
    //   // console.debug('Foo: get state.camera', state.camera)
    //   console.debug('FooGetCamera: state.camera.position', state.camera.position)
    //   // state.camera.position.x, state.camera.position.y, state.camera.position.z
    // })
  //   return (
  //     <Html>
  //       <Button onClick={() => fooGetCamera()}>get cameraPosition</Button>
  //     </Html>
  //   )
  // }

  // // @ ts-expect-error
  // const setTheCameraPosition = storeCamera(state => {
  //   // @ts-expect-error
  //   state.setPosition
  //   console.debug('HEY HEY HEY')
  // })

  // ** RETURN JSX
  return (
    <>

      {/* TUNNELING R3F with tunnelrat IO */}
      {/* <threedIO.Out /> */}

      {/* CHARACTER CONTROL JOYSTICK */}
      {/* <EcctrlJoystick ButtonNumber={5} /> */}
      {/* <EcctrlJoystickControls /> */}

      {/* CAMERA INTERACTIONS */}
      {/* <CameraPositionTestApp /> */}
      {/* <Button onClick={() => setTheCameraPosition([-10,2,-10])}>set cameraPosition</Button> */}
      {/* <Button onClick={() => fooGetCamera()}>get cameraPosition</Button> */}
      {/* <Button onClick={(e) => setTheCameraPosition()}>get+set cameraPosition</Button> */}
      {/* <Button onClick={() => FooGetCamera()}>get cameraPosition</Button> */}
      {/* <Button onClick={(e) => getCameraState()}>Get Camera State</Button> */}

      {/* THREED CANVAS */}
      <Canvas
        key={_id}
        // shadows={true}
        // dpr={[1, 2]} // target pixel ratio ???
                
        onCreated={
          (state) => {
            console.debug('%c Canvas onCreated state', ccm.redAlert, state)
            console.debug('%c Canvas onCreated state.camera', ccm.redAlert, state.camera)
            console.debug('%c Canvas onCreated state.camera.position', ccm.redAlert, state.camera.position)
            state.gl.toneMapping = THREE.AgXToneMapping
            // state.camera.fov = 32 // 8
            // state.camera.lookAt(2, -4, 8) // position [0, 0, 0]
            // threedCamera.position = new THREE.Vector3(2, -4, 8)
            // console.debug('%c Canvas onCreated state.camera.position(lookAt)', ccm.redAlert, state.camera.position)
          }
        }
        
        // ** CAMERA (not using declarative inside canvas)
        camera={threedCamera}

        // ** SCENE (needs to be declarative inside canvas)
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
        {/* INSIDE CANVAS (canvas props.children)... */}

        
        {/* USE DECLARATIVE THREED CAMERA (NOT WORKING YET) */}
        {/* <PerspectiveCamera 
          {...threedCamera} 
        /> */}
        {/* <MyCameraReactsToStateChanges /> */}
        {/* <FooGetCamera /> */}


        {/* TUNNEL RAT IO: TODO */}
        {/* <threedIO.Out /> */}


        {/* SUSPENSEFUL... */}
        {/* <Suspense fallback={null}> */}
        {/* <Suspense fallback={<Html>HEY HEY HEY</Html>}> */}
        {/* <Suspense fallback={<Html center><Spinner /></Html>}> */}
        {/* using radix-ui + react-three-drei */}
        {/* using react-three-drei Loader + useProgress */}
        {/* <Suspense fallback={
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
        }> */}
        <Suspense fallback={<ThreeDLoaderSimple />}>

          {/* PRELOAD objects ??? -- does it seem necessary? */}
          <Preload all />
          
          {/* THREED EXPERIENCE : VIEWER */}
          {/* ExperienceViewer = forwardRef(({ children, enableOrbit, ...props }, ref) => {} */}
          {/* @ ts-expect-error */}
          {/* <ThreeDExperienceViewer> */}
          {/* @ts-expect-error */}
          <ThreeDExperienceViewer ref={ref}>{/* enableOrbit={true} enablePerf={true}> */}

            {/* THREED MODELS: WORKING !!! */}
            {/* SEND THREEDS OF MODEL[S] TO A CANVAS */}
            <ThreeDModels
              threeds={threeds}
            />

          </ThreeDExperienceViewer>

        </Suspense>
      </Canvas>
    </>
  )
}

export default ThreeDCanvas
