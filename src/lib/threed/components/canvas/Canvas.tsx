// 'use client'
// ==========================================================
// RESOURCES

// ** APOLLO CLIENT STORE+STATE Imports
import { 
  useApolloClient, 
  useReactiveVar,
} from '@apollo/client'
import {
  isPreferencesSetVar,
  preferencesDataVar,
  preferencesStore,
  canvasStateStore,
  isCanvasStateSetVar,
  canvasStateVar,
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
  useTransition,
  forwardRef,
  useImperativeHandle,
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
// ** INTERFACES + TYPES

interface IViewerProps {
  // children: ReactNode, 
  _id: string, // = 'heyheyhey_' + newUUID(), 
  threeds: any[], // = [],
}

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
          <span style={{paddingLeft: '8px'}}>THREED UI LOADING... {Math.round(progress).toFixed(0)} %</span>
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


// ==========================================================
// CAMERA DATA INTERFACE (USING ZUSTAND SESSION STATE STORE)
// ==========================================================
// import { create } from 'zustand'
// const storeCameraZ = create(set => ({
//   position: [0, 0, 0],
//   setPosition: (position: number[]) => set({ position }),
//   // cameraPosition: [-16, 4, -16],
//   // setCameraPosition: (cameraPosition: number[]) => set({ cameraPosition })
// }))
// ** ZUSTAND-X : CAMERA STORE
const storeCameraZ = createStore('threedCamera')(({
  position: [-1, 1, -1],
  // setPosition: (position: number[]) => set({ position }),
  // cameraPosition: [-16, 4, -16],
  // setCameraPosition: (cameraPosition: number[]) => set({ cameraPosition })
}))
// // Note that the zustand(x) store is accessible through:
// // hook store
// storeCameraZ.useStore
// // vanilla store
// storeCameraZ.store
// // reactive (tracked) hooks
// storeCameraZ.useTracked.owner()
// // Getters
// // Don't overuse hooks. If you don't need to subscribe to the state, use instead the get method:
// storeCameraZ.get.name()
// storeCameraZ.get.stars()
// // You can also get the whole state object:
// storeCameraZ.get.state()
// **
// console.debug('%c storeCameraZ.get.state()', ccm.redAlert, storeCameraZ.get.state())
// console.debug('%c STORE storeCameraZ.get.state().position()', ccm.redAlert, storeCameraZ.get.position())
// console.debug('%c storeCameraZ.useTracked.position()', ccm.redAlert, storeCameraZ.useTracked.position())

// ==========================================================

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
// const setCameraPosition = storeCameraZ(state => state.setPosition)

// moved inside experience
// const camera = useThree(state => state.camera)
// console.debug('get camera', camera)

// ==========================================================

const MyCameraReactsToStateChanges = () => {
  // ** GET + SET camera
  // @ts-expect-error
  const [x, y, z] = storeCameraZ(state => state.position)
  // @ ts-expect-error
  // const [x, y, z] = storeCameraZ(state => state.cameraPosition)
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
  // const setCameraPosition = storeCameraZ(state => {
  //   console.debug('%c MyCameraReactsToStateChanges: SET state.camera.position', ccm.redAlert)
  //   // @ts-expect-error
  //   return state.setPosition([12,2,12])
  // })
}

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

// // ** GET THREED CAMERA + SCENE from inside <Canvas />
// const ThreeForwardRef = forwardRef((props, refCanvas) => {
//   const { scene, camera } = useThree()
//   useImperativeHandle(refCanvas, () => ({
//     scene,
//     camera,
//   }), [scene, camera])
// }
// )

// ==========================================================

// ** RETURN ThreeDCanvas
export const ThreeDCanvas = forwardRef((
  { 
    _id, 
    threeds,
  }: IViewerProps,
  refCanvas // the forwarded ref
) => {

  // ** DEBUGGING
  // if (debug) 
  //   console.debug('%c📐 ThreeDCanvas props.threeds', ccm.darkredAlert, threeds)

  // ** HOOKS
  const prefs = useReactiveVar(preferencesDataVar)
  // console.debug('%c prefs', ccm.red, prefs)
  const canvasState = useReactiveVar(canvasStateVar)
  // console.debug('%c canvasState', ccm.red, canvasState)
  
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

  // ** SET CANVAS STATE VAR (APOLLO CLIENT)
  function setCanvasStateVar (state: any) {
    let newData = {...canvasStateVar()} // latest canvas state
    // console.debug('%c⚙️ setCanvasStateVar newData', ccm.green, newData)
    newData.state = state
    newData.scene = state.scene
    newData.camera = state.camera
    newData.gl = state.gl
    // console.debug('%c⚙️ setCanvasStateVar newData UPDATED', ccm.green, newData)
    canvasStateVar(newData)
    // console.debug('%c⚙️ setCanvasStateVar canvasStateVar', ccm.darkgreen, canvasStateVar())
  }

  // ** DECLARATIVE THREED SCENE
  let threedScene = {
    // background: new THREE.CubeTextureLoader().load(cubeMapURLs), // ThreeDGarden1.tsx
    background: new THREE.Color(0x171717),
  }
  // ** DECLARATIVE THREED CAMERA
  // let threedCamera = { 
  //   // position: new THREE.Vector3(x, y, z),
  //   position: new THREE.Vector3(-16, 4, -32), // custom starting camera position
  //   fov: 24, // 100
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
  // const setCameraPosition = storeCameraZ(state => state.setPosition)

  // moved inside experience
  // const camera = useThree(state => state.camera)
  // console.debug('get camera', camera)

  // const [x, y, z] = storeCameraZ(state => state.position)
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
  // const setTheCameraPosition = storeCameraZ(state => {
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

        shadows={true}
        dpr={[1, 2]} // dpr = target pixel ratio (need ???)

        // style={{
        //   width: '100%',
        //   // height: '100%',
        //   minHeight: '300px',
        // }}
        
        // ** CAMERA (using declarative inside canvas ExperienceViewer)
        // camera={threedCamera}

        // ** SCENE (needs to be declarative inside canvas)
        scene={threedScene}

        // ** CANVAS STATE
        onCreated={
          (state) => {
            console.debug('%c Canvas onCreated state', ccm.darkredAlert, state)
            // console.debug('%c Canvas onCreated state.camera', ccm.darkredAlert, state.camera)
            // console.debug('%c Canvas onCreated state.camera.position', ccm.darkredAlert, state.camera.position)
            // state.gl.toneMapping = THREE.AgXToneMapping
            // state.camera.fov = 32 // 8
            // state.camera.lookAt(200, -4, 8) // position [0, 0, 0]
            // state.camera.position = new THREE.Vector3(2, -4, 8)
            // console.debug('%c Canvas onCreated state.camera.position(lookAt)', ccm.redAlert, state.camera.position)
            // ** SET CANVAS STATE
            setCanvasStateVar(state)
          }
        }
        
        // ** JOYSTICK as mouse (optional)
        // onPointerDown={(e) => {
        //   if (e.pointerType === 'mouse') {
        //     // testing
        //     (e.target as HTMLCanvasElement).requestPointerLock()
        //   }
        // }}
        
      >
        {/* NOW INSIDE CANVAS 
            (canvas.props.children)... 
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
              // initialState={(active = false) => active} // Initial black out state
            />
          </Html>
        }>


          {/* FORWARD REF ??? */}
          {/* <ThreeForwardRef ref={refCanvas} /> */}


          {/* PRELOAD objects ??? -- does it seem necessary? */}
          {/* <Preload all /> */}

          
          {/* USE DECLARATIVE THREED CAMERA (NOT WORKING YET) */}
          {/* <PerspectiveCamera 
            {...threedCamera} 
          /> */}
          {/* <MyCameraReactsToStateChanges /> */}
          {/* <FooGetCamera /> */}


          {/* TUNNELING R3F with tunnelrat IO */}
          {/* <threedIO.In>
            <span key='foo_span'>Very cool!</span>
          </threedIO.In> */}
          {/* TUNNELING R3F with tunnelrat OI */}
          {/* <threedOI.Out /> */}

          
          {/* THREED EXPERIENCE : VIEWER */}
          <ThreeDExperienceViewer
            ref={refCanvas} // when using function as a forwardRef // THREED IO

            threeds={threeds}

            enableOrbit={true}
            enableGizmoCube={true}
            enableAxesHelper={true}
            enableGridHelper={true}
            enablePerf={true}

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
) // forwardRef end

export default ThreeDCanvas
