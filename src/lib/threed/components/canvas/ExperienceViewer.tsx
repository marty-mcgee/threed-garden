// 'use client'
// ==========================================================
// RESOURCES

// ** APOLLO Imports
import { useReactiveVar } from '@apollo/client'
import {
  // isPreferencesDataSetVar,
  preferencesDataVar,
  // preferencesStore,
  // projectStore,
} from '#/lib/api/graphql/apollo'

// REACT Imports
import { 
  forwardRef, 
  Suspense, 
  useImperativeHandle, 
  useRef,
  useState,
  useEffect,
  useTransition,
} from 'react'

// ** R3F Imports
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
  View as ThreeDViewImpl,
  // PerspectiveCamera,
  Grid,
  Bvh,
} from '@react-three/drei'
// ** React Spring
import { 
  useSpring, 
  animated 
} from '@react-spring/three'

// ** LEVA CONTROLS Imports
import { useControls } from 'leva'

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

// ** THREED:IO Imports
// import { ThreedIO } from '#/lib/threed/threedio/components/ThreedIO'

// ** THREED OBJECTS
import ThreeDLights from '#/lib/threed/components/canvas/Lights'
import ThreeDCamera from '#/lib/threed/components/canvas/Camera'
import ThreeDExperience from '#/lib/threed/components/canvas/Experience'

// ** HELPER Components
// import Spinner from '#/layout/ui/spinner'
// ** UUID Imports
// import { v4 as newUUID } from 'uuid'
// ** Performance Monitor
import { Perf, PerfHeadless, usePerf } from 'r3f-perf'
// ** COLORFUL CONSOLE MESSAGES (ccm)
import ccm from '#/lib/utils/console-colors'
// console.debug('%c ccm', ccm)

// ==============================================================
// ** INTERFACES + TYPES

interface IViewerProps {
  // children: any,
  enableOrbit: boolean, 
  enableGizmoCube: boolean,
  enableAxesHelper: boolean,
  enableGridHelper: boolean,
  enableGridHelper2: boolean,
  enablePerf: boolean, 
  threeds: Object[],
  // ModelProps
  config: Config,
  setConfig: Function, // setConfig REACT.useState props cascading...
  activeFocus: string,
  setActiveFocus(focus: string): void,
}

// ==============================================================
// ** VARIABLES

const debug = true // false | true // ts: boolean
const DEBUG = true // false | true // ts: boolean

// ** Environment
function ThreeDEnvironment() {

  // ** HOOKS
  const prefs = useReactiveVar(preferencesDataVar)
  // ==========================================================

  return (
    <Environment
      // @ts-expect-error
      preset={prefs.environmentPreset}
      blur={prefs.environmentBgBlur}
      background
    />
  )
}

// ==========================================================

// ** RETURN ThreeDExperienceViewer
const ThreeDExperienceViewer = forwardRef((
  { 
    // children, 
    enableOrbit, 
    enableGizmoCube,
    enableAxesHelper,
    enableGridHelper,
    enableGridHelper2,
    enablePerf, 
    threeds, 
    // ...props 
    // ModelProps
    config,
    setConfig,
    activeFocus,
    setActiveFocus,
  }: IViewerProps,
  // }, 
  refCanvas // the forwarded ref
) => {

  // ** HOOKS
  const prefs = useReactiveVar(preferencesDataVar)

  // ** THREED IO
  // const localRef = useRef(null)
  // useImperativeHandle(ref, () => localRef.current)

  // ==========================================================
  // ** RETURN JSX
  return (
    <>

      {/* <Bvh firstHitOnly> */}

      {/* THREED IO */}
      {/* <Html ref={localRef} {...props} /> */}
      {/* 
      <ThreedIO>
        <ThreeDViewImpl track={localRef}> */}

          {/* BACKGROUND COLOR? */}
          <color attach="background" args={['#1e2243']} />

          {/* LIGHTS, CAMERA, ACTION */}

          {/* THREED LIGHTS */}
          <ThreeDLights />
          {/* <ThreeDLights /> */}

          {/* THREED CAMERA */}
          <ThreeDCamera
            config={config}
            activeFocus={activeFocus}
          />
          
          {/* THREED ACTION */}
          {/* TESTING: Camera + Animation Action Rig */}
          {/* <ActionRig /> */}

          {/* AXES + GRID HELPERS */}
          {enableAxesHelper && (
            <axesHelper args={[3200]} />
          )}
          {enableGridHelper && (
            <>
              {enableGridHelper2 && (
                <gridHelper args={[25600, 256, 0x333333, 0x222222]}/>
              )}

              <Grid
                args={[6400, 6400]} // x = 20rem, z = 20rem
                sectionColor={'black'}
                cellColor={'black'}
                position={[0, 0, 0]} // sea level?
                // userData={{
                //   camExcludeCollision: true, // collide by camera ray? true | false
                // }}
              />
            </>
          )}

          {/* THREED SCENE
            * Imports "Custom" Files/Assets via API for ThreeDs into Canvas */}
          {/* <ThreeDScene /> */}

          {/* THREED ENVIRONMENT */}
          <ThreeDEnvironment />

          {/* THREED EXPERIENCE */}
          <ThreeDExperience 
            threeds={threeds} 
            ref={refCanvas} 
          />
          {/* <ThreeDExperienceNew /> */}

          {/* SHADOW EFFECTS */}
          <ContactShadows
            position={[0, 0, 0]}
            opacity={0.75}
            scale={10}
            blur={2.5}
            far={4}
          />
          <BakeShadows />

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

          {/* EXAMPLE: SHOE + SHOES */}
          {/*
            <Stage intensity={0.7}>
              <Shoe color='tomato' position={[0, 0, 0]} />
              <Shoe color='orange' scale={-1} rotation={[0, 0.5, Math.PI]} position={[0, 0, -1]} />
            </Stage>
          */}

          {/* ORBIT CONTROLS (CAMERA CONTROLS) */}
          {/* makeDefault makes the controls known to r3f,
              now transform-controls can auto-disable them when active */}
          {enableOrbit && (
            <>
              <OrbitControls
                makeDefault
                minDistance={0.25}
                maxDistance={4800}
                // // minZoom={10}
                // // maxZoom={20}
                // // minAzimuthAngle={-Math.PI / 4}
                // // maxAzimuthAngle={Math.PI / 4}
                minPolarAngle={-Math.PI / 1.8}
                maxPolarAngle={Math.PI / 1.8}
                enableZoom={true}
                zoomToCursor={false} // default is false
                zoomSpeed={1.0} // default is 1.0
                enableRotate={true}
                autoRotate={prefs.doAutoRotate} // default is false
                autoRotateSpeed={1.0} // default is 2.0
                rotateSpeed={1.0} // default is 1.0
                enableDamping={false} // slows down rotation after mouse release
                dampingFactor={0.2} // default is 0.05
                enablePan={true}
                screenSpacePanning={true}

                // target={camera.target}
              />

              {/* ORBIT CONTROLS GIZMO HELPER */}
              {enableGizmoCube && (
                <GizmoHelper
                  alignment='top-right'
                  margin={[64, 48]}
                >
                  <group scale={0.7}>
                    <GizmoViewcube />
                  </group>
                  <group
                    scale={1.4}
                    position={[-24, -24, -24]}
                  >
                    <GizmoViewport
                      labelColor='white'
                      axisHeadScale={0.5}
                      hideNegativeAxes
                    />
                  </group>
                </GizmoHelper>
              )}
            </>
          )}
          
          {enablePerf && (
            <Perf
              position='bottom-right'
              minimal
            />
          )}

      {/* 
        </ThreeDViewImpl>
      </ThreedIO> 
      */}

      {/* </Bvh> */}
    </>
  )
}
) // forwardRef end

// module properties
ThreeDExperienceViewer.displayName = 'ThreeD-ExperienceViewer'

export { ThreeDExperienceViewer }
export default ThreeDExperienceViewer