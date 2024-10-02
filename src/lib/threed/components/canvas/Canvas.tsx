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
  useLoader,
} from '@react-three/fiber'
// ** QUESTION: do stuff with IMPORTS ??
// extend({ OrbitControls })

// ** R3F HELPERS Imports
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
  Grid,
  Flex,
  Box,
  Button,
  Text,
} from '@radix-ui/themes'

// ** THREED Config
import {
  Config, 
  INITIAL, 
  detailLevels, 
  modifyConfigsFromUrlParams, 
  getFocusFromUrlParams,
  seasonProperties,
} from "#/lib/farmbot/threed-farmbot/config-threed"
import { 
  PrivateOverlay, 
  PublicOverlay, 
  ToolTip 
} from "#/lib/farmbot/threed-farmbot/config_overlays"

// ** THREED EXPERIENCE Imports
// import ThreeDExperienceNew from '#/lib/ecctrl-new/example/Experience'
import ThreeDExperienceViewer from '#/lib/threed/components/canvas/ExperienceViewer'
// import { threedIO } from '#//lib/threed/threed.io/threedIO'
// import tunnel from 'tunnel-rat'
import tunnel from '#//lib/threed/threed.io/tunnelrat'
// import { threedAI } from '#//lib/threed/threed.ai/threedAI'

// ** HELPER Components
import Spinner from '#/layout/ui/spinner'
// ** UUID Imports
import { v4 as newUUID } from 'uuid'
// ** COLORFUL CONSOLE MESSAGES (ccm)
import ccm from '#/lib/utils/console-colors'
// console.debug('%c ccm', ccm)

// ==============================================================
// ** VARIABLES

const debug = false // false | true // ts: boolean
const DEBUG = false // false | true // ts: boolean


// ** TUNNEL: THREEDIO
// const t = tunnel()
const threedIO = tunnel()
const threedOI = tunnel()


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
      const timer = setTimeout(() => setProgressValue(progress), 0)
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

export function ThreeDLoaderMesh() {
  const [scale, setScale] = useState(1)
  const texture = useLoader(THREE.TextureLoader, "https://raw.githubusercontent.com/AaronClaes/my-site/main/public/react.webp")

  const handleClick = () => setScale(p => p + 0.1)

  return (
    <mesh onClick={handleClick} scale={scale}>
      <boxGeometry />
      <meshBasicMaterial map={texture} />
    </mesh>
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
console.debug('%c STORE storeCamera.get.state().position()', ccm.redAlert, storeCamera.get.position())
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
  { _id = 'heyheyhey_' + newUUID(), threeds = [] }: { _id: string, threeds: any[]}
) => {
  
  // **
  // if (debug) console.debug('%c📐 ThreeDCanvas props.threeds', ccm.darkredAlert, threeds)
  // if (debug) console.debug(`%c=======================================================`, ccm.darkred)

  // // ** HOOKS
  const prefs = useReactiveVar(preferencesDataVar)
  // console.debug('%c prefs', ccm.red, prefs)

  // ** REF-erences using REACT
  const refCanvas: any = useRef<any>()

  
  {/* ⚙️ &#x2699 */}
  const [config, setConfig] = useState<Config>(INITIAL)
  const [toolTip, setToolTip] = useState<ToolTip>({ timeoutId: 0, text: "" })
  const [activeFocus, setActiveFocus] = useState("")

  useEffect(() => {
    setConfig(modifyConfigsFromUrlParams(config))
    setActiveFocus(getFocusFromUrlParams())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally empty dependency array

  const common = {
    config, setConfig,
    toolTip, setToolTip,
    activeFocus, setActiveFocus,
  }



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


  // ==========================================================
  // ** RETURN JSX
  return (
    <>

      {/* TUNNELING R3F with tunnelrat IO
      <threedIO.Out />
      */}
      {/* TUNNELING R3F with tunnelrat OI
      <div id="oi">
        <threedOI.In>
          <mesh>
            <sphereGeometry args={[0.4,0.4,0.4]} />
            <meshBasicMaterial color={'blue'} />
          </mesh>
        </threedOI.In>
      </div>
      */}


      {/* CAMERA INTERACTIONS */}
      {/* <CameraPositionTestApp /> */}
      {/* <Button onClick={() => setTheCameraPosition([-10,2,-10])}>set cameraPosition</Button> */}
      {/* <Button onClick={() => setTheCameraPosition()}>get+set cameraPosition</Button> */}
      {/* <Button onClick={() => fooGetCamera()}>get cameraPosition</Button> */}
      {/* <Button onClick={() => FooGetCamera()}>get cameraPosition</Button> */}
      {/* <Button onClick={() => getCameraState()}>Get Camera State</Button> */}


      {/* THREED CANVAS */}
      <Canvas
        key={_id}

        style={{
          width: '100%',
          // height: '100%',
        }}

        shadows={true}
        dpr={[1, 2]} // dpr = target pixel ratio (need ???)
        
        // ** CAMERA (not using declarative inside canvas)
        // camera={threedCamera}

        // ** SCENE (needs to be declarative inside canvas)
        scene={{
          // background: new THREE.CubeTextureLoader().load(cubeMapURLs), // ThreeDGarden1.tsx
          background: new THREE.Color(0x171717),
        }}
        // onCreated={
        //   (state) => {
        //     // console.debug('%c Canvas onCreated state', ccm.darkred, state)
        //     // console.debug('%c Canvas onCreated state.camera', ccm.darkred, state.camera)
        //     console.debug('%c Canvas onCreated state.camera.position', ccm.darkred, state.camera.position)
        //     // state.gl.toneMapping = THREE.AgXToneMapping
        //     // state.camera.fov = 32 // 8
        //     // state.camera.lookAt(2, -4, 8) // position [0, 0, 0]
        //     // threedCamera.position = new THREE.Vector3(2, -4, 8)
        //     // console.debug('%c Canvas onCreated state.camera.position(lookAt)', ccm.redAlert, state.camera.position)
        //   }
        // }
        
        // ** JOYSTICK as mouse (optional)
        // onPointerDown={(e) => {
        //   if (e.pointerType === 'mouse') {
        //     // testing
        //     (e.target as HTMLCanvasElement).requestPointerLock()
        //   }
        // }}
        
      >
        {/* NOW INSIDE CANVAS (canvas.props.children)... */}

        {/* PRELOAD objects ??? -- does it seem necessary? */}
        <Preload all />

        
        {/* USE DECLARATIVE THREED CAMERA (NOT WORKING YET) */}
        {/* <PerspectiveCamera 
          {...threedCamera} 
        /> */}
        {/* <MyCameraReactsToStateChanges /> */}
        {/* <FooGetCamera /> */}


        {/* TUNNELING R3F with tunnelrat IO
        <threedIO.In>
          <span key='foo_span'>Very cool!</span>
        </threedIO.In>
        */}
        {/* TUNNELING R3F with tunnelrat OI
        <threedOI.Out />
        */}


        {/* SUSPENSEFUL... */}
        {/* <Suspense fallback={null}> */}
        {/* <Suspense fallback={<Html>HEY HEY HEY</Html>}> */}
        {/* <Suspense fallback={<Html center><Spinner /></Html>}> */}
        {/* using radix-ui + react-three-drei */}
        {/* <Suspense fallback={<ThreeDLoaderSimple />}> */}
        {/* using react-three-drei Loader + useProgress */}
        <Suspense fallback={
          <Html center>
            <Loader
              // containerStyles={...container} // Flex layout styles
              // innerStyles={...inner} // Inner container styles
              // barStyles={...bar} // Loading-bar styles
              // dataStyles={...data} // Text styles
              dataInterpolation={(p) => `THREED UI ${p.toFixed(0)}%`} // Text
              initialState={(active = false) => active} // Initial black out state
            />
          </Html>
        }>

          {/* PLANTS from THREED FARMBOT */}
          {/* <Model {...common} /> */}
          
          {/* THREED EXPERIENCE : VIEWER */}
          <ThreeDExperienceViewer
            // children={null}
            enableOrbit={true}
            enableGizmoCube={true}
            enableAxesHelper={true}
            enableGridHelper={true}
            enablePerf={true}

            threeds={threeds} 
            
            ref={refCanvas} // when using function as a forwardRef // THREED IO

            // config: Object, // Config
            config={config}
            setConfig={setConfig}
            // activeFocus: string,
            activeFocus={activeFocus}
            // setActiveFocus(focus: string): void,
            setActiveFocus={setActiveFocus}
          />

        </Suspense>
      </Canvas>
    </>
  )
}

export default ThreeDCanvas
