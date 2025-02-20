// 'use client'
// ==========================================================
// RESOURCES

// ** APOLLO Imports
import { useReactiveVar } from '@apollo/client'
import { preferencesDataVar } from '#/lib/api/graphql/apollo'

// ** NEXT Imports
// import dynamic from 'next/dynamic'
// import Image from 'next/image'

// ** REACT Imports
import { 
  useEffect, 
  useState, 
  useRef,
  forwardRef, 
  Suspense 
} from 'react'

// ** THREE JS Imports
import * as THREE from 'three'

// ** REACT THREE Imports
import { 
  KeyboardControls, 
  // Grid,
  Bounds, 
  useBounds,
  Loader, 
  // useProgress,
  Html,
  // Text,
  // Center,
  TransformControls,

  //   PerspectiveCamera,
  //   // Environment, Stage,
  //   // KeyboardControls,
  //   // OrbitControls, TransformControls, PivotControls,
  //   // GizmoHelper, GizmoViewcube, GizmoViewport,
  //   // ContactShadows, BakeShadows,
  //   // softShadows, // softShadows()
  //   Preload,
  //   Loader, useProgress,
  //   Html, Center,
  //   // useGLTF, useFBX,
} from '@react-three/drei'

// ** PHYSICS LIBRARY
import { Physics } from '@react-three/rapier'

// ** LEVA Imports
// import { useControls } from 'leva'

// ** THREED NOUN Imports
// import ThreeDScenes from '#/lib/threed/components/nouns/Scene/Scene' // A THREED:SCENE IS A THREED:NOUN[i]
// import ThreeDPlans from '#/lib/threed/components/nouns/Plan/Plan' // A THREED:PLAN IS A THREED:NOUN[i]
// import ThreeDThreeDs from '#/lib/threed/components/nouns/ThreeD/ThreeD' // A THREED:THREED IS A THREED:NOUN[i]
import ThreeDModels from '#/lib/threed/components/nouns/Model/Model' // A THREED:MODEL IS A THREED:NOUN[i]

// ** THREED NOUN EXAMPLES Imports
// import TransformModel from '#/lib/threed/components/examples/TransformModel/App'
// import Character from '#/lib/threed/components/nouns/Character/Character'
// import StacyApp from '#/lib/threed/components/examples/Stacy/StacyApp'
// import Stacy from '#/lib/threed/components/examples/Stacy/Stacy'
// import Watch from '#/lib/threed/components/examples/Watch/Watch'
// import CoffeeCup from '#/lib/threed/components/examples/CoffeeCup/CoffeeCup'
// import JourneyLevel from '#/lib/threed/components/examples/JourneyLevel/App'
// import Shoes from '#/lib/threed/components/examples/Shoes/App'
// import Shoe from '#/lib/threed/components/examples/Shoes/Shoe'

// ** THREED CHARACTER CONTROL Imports
// import Ecctrl, { EcctrlAnimation } from 'ecctrl'
// import CharacterControls from '#/lib/ecctrl/src-old/Ecctrl'
// import CharacterControls from '#/lib/ecctrl/src-old/CharacterControls'
import CharacterControls from '#/lib/ecctrl/src/Ecctrl'
// ** THREED CHARACTER MODEL Imports
import CharacterModel from '#/lib/threed/components/nouns/Character/CharacterModel'
import CharacterModelDemon from '#/lib/threed/components/nouns/Character/CharacterModelDemon'
import CharacterModelFloating from '#/lib/threed/components/nouns/Character/CharacterModelFloating'
// import CharacterModelFarmerMan from '#/lib/threed/components/nouns/Character/FarmerMan'
// import CharacterModelLegacy from '#/lib/threed/components/nouns/Character/Character'
import CharacterModelFarmerManFloating from '#/lib/threed/components/nouns/Character/FarmerManFloating'
import CharacterModelFarmerWomanFloating from '#/lib/threed/components/nouns/Character/FarmerWomanFloating'
// import CharacterModelFarmerBoyFloating from '#/lib/threed/components/nouns/Character/FarmerBoyFloating'
// import CharacterModelFarmerGirlFloating from '#/lib/threed/components/nouns/Character/FarmerGirlFloating'
import CharacterModelChicken from '#/lib/threed/components/nouns/Character/Chicken'
import CharacterModelStacy from '#/lib/threed/components/nouns/Character/Stacy'

// ** THREED OBJECTS
import Floor from '#/lib/threed/components/canvas/Floor'
import Ground from '#/lib/threed/components/canvas/Ground'
// ** THREED OBJECTS: INTERACTIVE EXAMPLES
import Steps from '#/lib/threed/components/examples/Steps'
import Slopes from '#/lib/threed/components/examples/Slopes'
import RoughPlane from '#/lib/threed/components/examples/RoughPlane'
import RigidObjects from '#/lib/threed/components/examples/RigidObjects'
import FloatingPlatforms from '#/lib/threed/components/examples/FloatingPlatforms'
import DynamicPlatforms from '#/lib/threed/components/examples/DynamicPlatforms'
import ShotCube from '#/lib/threed/components/examples/ShotCube'
import Map from '#/lib/threed/components/examples/Map'
import Birds from '#/lib/threed/components/examples/Birds/Birds'

// ** FARMBOT Imports
// import ThreeDFarmBot from '#/lib/farmbot/FarmBot'
// import ThreeDFarmBotMain from '#/lib/farmbot/threed-farmbot/main-threed'
import ThreeDFarmBotGarden from '#/lib/farmbot/threed-farmbot/garden-threed'
import { ThreeDGarden as ThreeDFarmBotGarden2 } from '#/lib/farmbot/frontend/three_d_garden/index'

// HELPER Imports
// ** UUID Generator
import { v4 as newUUID } from 'uuid'
// ** HELPFUL UTIL: COLORFUL CONSOLE MESSAGES (ccm)
import ccm from '#/lib/utils/console-colors'

// ** THREED.AI
// import ThreeDAI from '#/lib/threed/components/tools/ThreeDAI' // TODO

// **
// ** DEBUGGING
// **
const debug: boolean = false
const DEBUG: boolean = true

/**
 * Character Model URL (default)
 */
const CHARACTER_MODEL_URL = new URL(
  '/public/objects/SK_Chr_Farmer_Female_01.glb',
  import.meta.url,
).href

/**
 * Character animation set preset
 */
const animationSet = {
  idle: "CharacterArmature|Idle",
  walk: "CharacterArmature|Walk",
  run: "CharacterArmature|Run",
  jump: "CharacterArmature|Jump",
  jumpIdle: "CharacterArmature|Jump_Idle",
  jumpLand: "CharacterArmature|Jump_Land",
  fall: "CharacterArmature|Duck", // This is for falling from high sky
  action1: "CharacterArmature|Wave",
  action2: "CharacterArmature|Death",
  action3: "CharacterArmature|HitReact",
  action4: "CharacterArmature|Punch",
}

// ** BOUNDS
// This function component wraps children in a group with a click handler
// Clicking any object will refresh and fit bounds
const SelectToZoom = ({ children }: { children: any }) => {
  const api = useBounds()
  // console.debug('SelectToZoom: api', api)
  // const ref = useRef<THREE.Group>(null)
  return (
    <group 
      // ref={ref}
      onClick={(e) => handleSelectToZoom(e, api)}
      // onPointerMissed={(e) => handleOnPointerMissed(e, api)}
    >
      {children}
    </group>
  )
}
const handleSelectToZoom = (e: any, api: any): void => {
  // console.debug('handleSelectToZoom', e, api)
  e.stopPropagation()
  e.delta <= 2 && 
  api.refresh(e.object).fit()
}
const handleOnPointerMissed = (e: any, api: any): void => {
  // console.debug('handleOnPointerMissed', e, api)
  // e.stopPropagation()
  e.button === 0 && 
  api.refresh().fit()
}

// ** RETURN ThreeDExperience
// export default function ThreeDExperience({ threeds }: { threeds: Object[]}, ref: any) {
const ThreeDExperience = forwardRef((
  { 
    threeds, 
    ...props 
  }:
  { 
    threeds: Object[],
    // props
  }, 
  refCanvas: any
) => {

  // ** GET THREED PREFERENCES FROM APOLLO CLIENT STORE:STATE
  const prefs = useReactiveVar(preferencesDataVar)
  // console.debug(`%c EXPERIENCE: APOLLO prefs`, ccm.orangeAlert, prefs)

  // ** PROGRESS LOADER using react-three-drei
  // const { active, progress, errors, item, loaded, total } = useProgress()

  // ** PHYSICS delay physics activation
  const [pausedPhysics, setPausedPhysics] = useState(prefs.doWorldPhysics)
  useEffect(() => {
    const timeout = setTimeout(() => {
      setPausedPhysics(false)
    }, 1000)
    return () => clearTimeout(timeout)
  }, [])

  // ** KEYBOARD control presets
  const keyboardMap = [
    { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
    { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
    { name: 'leftward', keys: ['ArrowLeft', 'KeyA'] },
    { name: 'rightward', keys: ['ArrowRight', 'KeyD'] },
    { name: 'jump', keys: ['Space'] },
    { name: 'run', keys: ['Shift'] },
    { name: 'action1', keys: ['1'] },
    { name: 'action2', keys: ['2'] },
    { name: 'action3', keys: ['3'] },
    { name: 'action4', keys: ['KeyF'] },
  ]

  // ** R3F BOUNDS behavior
  const configBounds = {
    fit: false,
    clip: false,
    observe: true,
    margin: 1.0,
    maxDuration: 1,
    interpolateFunc0: (t: number) => 1 - Math.exp(-5 * t) + 0.007 * t, // Matches the default Bounds behavior
    interpolateFunc1: (t: number) => -t * t * t + 2 * t * t,           // Start smoothly, finish linearly
    interpolateFunc2: (t: number) => -t * t * t + t * t + t,           // Start linearly, finish smoothly
  }

  // ==========================================================
  // ** RETURN JSX
  return (
    // {/* REACT SUSPENSE */}
    <Suspense fallback={null}>

      <group 
        ref={refCanvas}
      >

        {/* EXAMPLES: BIRDS */}
        { false && (
          <group rotation={[0, 0, 0]} scale={100.0} position={[0, 2400, 0]}>
            <Birds />
          </group>
        )}

        {/* THREED USING PHYSICS */}
        <Physics
          debug={prefs.doWorldPhysics}
          // debug={true}
          // timeStep={1/120} // 'vary' does not work well, try (default) 1/60 | 1/30 | 1/15 | 1/120 etc
          paused={pausedPhysics}
        >

          {/* ** FLOORS ** */}
          {/* solid steps (levels, safety) */}
          {/* The Floor (Plane 0) */}
          <group rotation={[0, 0, 0]} scale={1.0} position={[0, 0, 0]}>
            <Floor color={'darkgreen'} opacity={0.4} />
          </group>
          {/* backup solid steps (levels[1+], safety) */}
          {/* Sub-Floor[s] (Plane < 0) */}
          {/* <SubFloor level={`${level[index]}`} /> */}
          {/* <group rotation={[0, 0, 0]} scale={1.0} position={[0, -128, 0]}>
            <Floor color={'saddlebrown'} opacity={0.4} />
          </group> */}
          {/* HELPFUL FLOOR/PLANE/GRID (PREVENTS INFINITE FALL):
              DEEP BELOW SEA LEVEL */}
          {/* <group rotation={[0, 0, 0]} scale={1.0} position={[0, -256, 0]}>
            <Floor color={'darkblue'} opacity={0.2} />
          </group> */}
          {/* DEFAULT GROUND BOUNDARY (PREVENTS INFINITE FALL BACKUP):
              DEEP DEEP DEEP BELOW SEA LEVEL */}
          {/* <group rotation={[0, 0, 0]} scale={1.0} position={[0, -1024, 0]}>
            <Ground color={'black'} opacity={0.0} />
          </group> */}

          {/* REACT SUSPENSE */}
          {/* <Suspense fallback={<Html>LOADING HEY HEY HEY ...</Html>}> */}
          <Suspense fallback={
            <Html center>
              <Loader
                // containerStyles={...container} // Flex layout styles
                // innerStyles={...inner} // Inner container styles
                // barStyles={...bar} // Loading-bar styles
                // dataStyles={...data} // Text styles
                dataInterpolation={(p: number) => `THREED UI ${p.toFixed(0)}%`} // Text
                // initialState={(active = false) => active} // Initial black out state
              />
            </Html>
          }>

            {/* R3F BOUNDS */}
            <Bounds 
              fit={configBounds.fit} 
              clip={configBounds.clip}
              observe={configBounds.observe}
              margin={configBounds.margin}
              // maxDuration={configBounds.maxDuration} 
              // interpolateFunc={configBounds.interpolateFunc2}
            >

              {/* R3F BOUNDS: SELECT TO ZOOM IN ON OBJECTS */}
              <SelectToZoom>

                {/* Steps -- aka: four-by-fours, 4"x4"[s], posts, logs */}
                <group rotation={[0, 0, 0]} scale={1.0} position={[0, 6, 0]}>
                  <Steps />
                </group>

                {/* Rough Plane */}
                <group rotation={[0, 0, 0]} scale={100.0} position={[800, -30, 1000]}
                  // onClick={handleClick}
                >
                  <RoughPlane />
                </group>

                {/* Slopes + Stairs */}
                {/* 
                <group rotation={[0, 0, 0]} scale={100.0} position={[100, 0, 100]}>
                  <Slopes />
                </group>
                */}

                {/* Rigid Body Objects */}
                <group rotation={[0, 0, 0]} scale={1.0} position={[-4, 10.00, 0]}>
                  <RigidObjects />
                </group>

                {/* Floating Platforms */}
                {/* 
                <group rotation={[0, 0, 0]} scale={1.0}>
                  <FloatingPlatforms />
                </group>
                */}

                {/* Dynamic Platforms */}
                {/* 
                <group rotation={[0, 0, 0]} scale={1.0} position={[0, 2.01, 0]}>
                  <DynamicPlatforms />
                </group>
                */}
                {/* Shot Cubes */}
                {/* 
                <group rotation={[0, 0, 0]} scale={1.0} position={[0, 4.0, 0]}>
                  <ShotCube />
                </group>
                */}

                {/* THREED FARMBOTS */}
                <group rotation={[-Math.PI/2, 0, 0]} scale={0.160} position={[-400, 50, -300]}>
                  <ThreeDFarmBotGarden 
                    key={'ThreeDFarmBotGarden_' + newUUID()} 
                  />
                </group>
                {/* <group rotation={[0, 0, 0]} scale={1.000} position={[-4000, 50, -3000]}>
                  <ThreeDFarmBotGarden2 
                    key={'ThreeDFarmBotGarden_2' + newUUID()} 
                  />
                </group> */}
                {/* 
                <group rotation={[-Math.PI/2, 0, -Math.PI/2]} scale={0.002} position={[-5.4, 0.4, -0.6]}>
                  <ThreeDFarmBotMain />
                </group>
                */}

                {/* [MM] HEY HEY HEY : FALL FROM SKY.......................... */}
                {/* CHARACTER MODELS */}
                {/* <Suspense fallback={null}> */}

                <KeyboardControls map={keyboardMap}>

                  {/* CHARACTER MODEL */}
                  { false && (
                  <group key='character0' position={[800, 0, 0]}>
                    {/* <CharacterControls
                      debug={prefs.doWorldDebug}
                      // debug={false}
                      animated={prefs.doCharacterAnimation}
                      // animated={false}
                      disableControl={prefs.doWorldControl}
                      // disableControl={false}
                      // disableFollowCam={prefs.doWorldUnfollowCam}
                      disableFollowCam={true}
                      followLight={true}
                      // springK={2}
                      // dampingC={0.2}
                      // autoBalanceSpringK={1.2}
                      // autoBalanceDampingC={0.04}
                      // // autoBalanceSpringOnY={0.7} // CAN CAUSE HECK!!! if dispose={null}
                      // // autoBalanceDampingOnY={0.05} // CAN CAUSE HECK!!! if dispose={null}
                      // mode='FixedCamera'
                      // mode='CameraBasedMovement'
                    > */}
                      {/* <CharacterModel /> */}
                      {/* <CharacterModelFloating /> */}
                      {/* <CharacterModelStacy /> */}
                      <CharacterModelStacy scale={1.2} />
                      {/* <CharacterModelChicken scale={2.0} /> */}
                    {/* </CharacterControls> */}
                  </group>
                  )}
                  {/* END: CHARACTER MODEL */}
                  
                  {/* CHARACTER MODEL */}
                  { true && (
                  <group key='character1' position={[0, 0, 0]}>
                    <CharacterControls
                      // debug={false}
                      // debug={true}
                      debug={prefs.doWorldDebug}
                      // animated={false}
                      // animated={true}
                      animated={prefs.doCharacterAnimation}
                      // disableControl={false}
                      // disableControl={true}
                      disableControl={prefs.doWorldControl}
                      // disableFollowCam={false}
                      // disableFollowCam={true}
                      disableFollowCam={prefs.doWorldUnfollowCam}
                      // followLight={false}
                      followLight={true}
                      // followLight={prefs.doWorldFollowLight}
                      // **
                      // springK={2}
                      // dampingC={0.2}
                      // autoBalanceSpringK={1.2}
                      // autoBalanceDampingC={0.04}
                      // // autoBalanceSpringOnY={0.7} // CAN CAUSE HECK!!! if dispose={null}
                      // // autoBalanceDampingOnY={0.05} // CAN CAUSE HECK!!! if dispose={null}
                      // mode='FixedCamera'
                      // mode='CameraBasedMovement'
                    >
                      <CharacterModelFarmerWomanFloating scale={1.0} />
                      {/* <CharacterModelFarmerManFloating scale={1.016} /> */}
                    </CharacterControls>
                  </group>
                  )}
                  {/* END: CHARACTER MODEL */}

                  {/* CHARACTER MODEL */}
                  { false && (
                  <group key='character2' position={[-200, 0, 0]}>
                    {/* <CharacterControls
                      debug={prefs.doWorldDebug}
                      // debug={false}
                      animated={prefs.doCharacterAnimation}
                      // animated={false}
                      disableControl={prefs.doWorldControl}
                      // disableControl={false}
                      // disableFollowCam={prefs.doWorldUnfollowCam}
                      disableFollowCam={true}
                      followLight={true}
                      // springK={2}
                      // dampingC={0.2}
                      // autoBalanceSpringK={1.2}
                      // autoBalanceDampingC={0.04}
                      // // autoBalanceSpringOnY={0.7} // CAN CAUSE HECK!!! if dispose={null}
                      // // autoBalanceDampingOnY={0.05} // CAN CAUSE HECK!!! if dispose={null}
                      // mode='FixedCamera'
                      // mode='CameraBasedMovement'
                    > */}
                      <CharacterModelChicken scale={160} />
                    {/* </CharacterControls> */}
                  </group>
                  )}
                  {/* END: CHARACTER MODEL */}
                
                </KeyboardControls>

                {/* </Suspense> */}
                {/* END: CHARACTER MODELS */}

                {/* EXAMPLE MAP: TAVERN */}
                <group 
                  // rotation={[(Math.PI/2) + 0, (-Math.PI/2), (Math.PI/2) + 0]}
                  rotation={[(Math.PI/2) + 0, (-Math.PI/1), (Math.PI/1) + 0]}
                  // quaternion={[0,0,0,0]}
                  scale={8.0} 
                  position={[80, 140, -1200]}
                >
                  <Map />
                </group>
                  
                {/* THREED MODELS as props.threeds */}
                {/* 
                <group
                  key='threed_models_children'
                  // scale all threeds?
                  scale={100.3}
                >
                  <ThreeDModels
                    threeds={threeds} // threeds={{}}
                    // master position for all threeds?
                    // position={[-4, 0, 0]}
                    // position={[0, -1, 0]}
                  />
                </group>
                */}

              </SelectToZoom>
              {/* END: SELECT TO ZOOM */}
              
            </Bounds>
            {/* END: R3F BOUNDS */}
          
          </Suspense>
          {/* END: REACT SUSPENSE */}

        </Physics>
        {/* END: PHYSICS RAPIER */}

      </group>
      {/* END: CANVAS GROUP REF */}

    </Suspense>
    // {/* END: REACT SUSPENSE */}
  )
}
) // end forwardRef

export default ThreeDExperience
