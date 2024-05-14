'use client'

// REACT Imports
import { 
  forwardRef, 
  Suspense, 
  useImperativeHandle, 
  useRef 
} from 'react'

// R3F Imports
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
  // **
  useGLTF, useFBX,
  // **
  PerspectiveCamera, 
  View as ThreeDViewer, 
} from '@react-three/drei'

// THREED:IO Imports
import { ThreedIO } from '#/lib/threed/threedio/components/ThreedIO'
import ThreeDExperience from '#/lib/threed/components/canvas/Experience'

// export const Common = ({ color }) => (
//   <Suspense fallback={null}>
//     {color && <color attach='background' args={[color]} />}
//     <ambientLight />
//     <pointLight position={[20, 30, 10]} intensity={3} decay={0.2} />
//     <pointLight position={[-10, -10, -10]} color='blue' decay={0.2} />
//     <PerspectiveCamera makeDefault fov={40} position={[0, 0, 6]} />
//   </Suspense>
// )

const ExperienceViewer = forwardRef(({ enableOrbit, children, ...props }, ref) => {
  const localRef = useRef(null)
  useImperativeHandle(ref, () => localRef.current)

  return (
    <>
      <Html ref={localRef} {...props} />
      <ThreedIO>
        <ThreeDViewer track={localRef}>

          <ThreeDExperience />

          {children}


          {/* THREED ENVIRONMENT */}
          {/* <Stage environment='forest' intensity={0.7}></Stage> */}
          <ThreeDEnvironment />

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

        </ThreeDViewer>
      </ThreedIO>
    </>
  )
})
ExperienceViewer.displayName = 'ThreeD-View'

export { ExperienceViewer }
export default ExperienceViewer