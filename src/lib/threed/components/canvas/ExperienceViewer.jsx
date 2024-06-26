// 'use client'
// ==========================================================
// RESOURCES

// ** APOLLO Imports
import { useReactiveVar } from '@apollo/client'
import {
  // isPreferencesSetVar,
  preferencesDataVar,
  // preferencesStore,
  // projectStore,
} from '#/lib/stores/apollo'

// ** LEVA CONTROLS Imports
import { useControls } from 'leva'

// ** VALTIO ??
// import { proxy, useSnapshot } from 'valtio'

// REACT Imports
import { 
  forwardRef, 
  Suspense, 
  useImperativeHandle, 
  useRef,

  // Suspense,
  useState,
  useEffect,
  // useRef,
  useTransition,

} from 'react'

// R3F Imports
import {
  Environment, Stage,
  // KeyboardControls,
  OrbitControls, TransformControls, PivotControls,
  GizmoHelper, GizmoViewcube, GizmoViewport,
  ContactShadows, BakeShadows,
  // softShadows, // softShadows()
  // Loader, useProgress,
  // Preload,
  Html, Center,
  // **
  // useGLTF, useFBX,
  // **
  PerspectiveCamera, 
  View as ThreeDViewImpl, 
} from '@react-three/drei'

// THREED:IO Imports
import { ThreedIO } from '#/lib/threed/threedio/components/ThreedIO'
import ThreeDExperience from '#/lib/threed/components/canvas/Experience'

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

// export const Common = ({ color }) => (
//   <Suspense fallback={null}>
//     {color && <color attach='background' args={[color]} />}
//     <ambientLight />
//     <pointLight position={[20, 30, 10]} intensity={3} decay={0.2} />
//     <pointLight position={[-10, -10, -10]} color='blue' decay={0.2} />
//     <PerspectiveCamera makeDefault fov={40} position={[0, 0, 6]} />
//   </Suspense>
// )

export function ThreeDEnvironment() {

  // ** HOOKS
  const prefs = useReactiveVar(preferencesDataVar)

  // const [envPreset, setEnvPreset] = useState(prefs.environmentPreset) // 'park'
  // You can use the 'inTransition' boolean to react to the loading in-between state,
  // For instance by showing a message
  // const [inTransition, startTransition] = useTransition()

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
      order: 0,
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

const ExperienceViewer = forwardRef(({ enableOrbit, children, ...props }, ref) => {

  // ** HOOKS
  const prefs = useReactiveVar(preferencesDataVar)

  // ** THREED IO
  const localRef = useRef(null)
  useImperativeHandle(ref, () => localRef.current)

  return (
    <>
      {/* <Html ref={localRef} {...props} /> */}
      
      {/* <ThreedIO>
        <ThreeDViewImpl track={localRef}> */}

          {/* ThreeD Models as props.children */}
          {children}

        {/* </ThreeDViewImpl>
      </ThreedIO> */}

          {/* THREED ENVIRONMENT */}
          <ThreeDEnvironment />
          <ThreeDExperience />

          <axesHelper args={[1024]} />
          <gridHelper args={[1024, 16]} />

          {/* THREED SCENE FILES TO CANVAS */}
          {/* <ThreeDScene /> */}


          {/* makeDefault makes the controls known to r3f,
              now transform-controls can auto-disable them when active */}
          {/* {enableOrbit && <OrbitControls />} */}
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
            <group scale={0.8}>
              <GizmoViewcube />
            </group>
            <group
              scale={1.6}
              position={[-30, -30, -30]}
            >
              <GizmoViewport
                labelColor='white'
                axisHeadScale={0.5}
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
    </>
  )
})
ExperienceViewer.displayName = 'ThreeD-ExperienceViewer'

export { ExperienceViewer }
export default ExperienceViewer