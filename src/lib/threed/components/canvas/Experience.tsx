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
// import ThreeDScenes from '#/lib/threed/components/nouns/Scene/Scene'
// import ThreeDPlans from '#/lib/threed/components/nouns/Plan/Plan'
// import ThreeDThreeDs from '#/lib/threed/components/nouns/ThreeD/ThreeD'
import ThreeDModels from '#/lib/threed/components/nouns/Model/Model'

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
// import CharacterControls from 'ecctrl'
import CharacterControls from '#/lib/ecctrl/src/Ecctrl'
// import CharacterControls from '#/lib/ecctrl/src/EcctrlCustom' // testing, not functional
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
import ModelWithAnimations from '#/lib/threed/components/nouns/Character/ModelWithAnimations'
import ModelWithAnimationsFBXLoader from '#/lib/threed/components/nouns/Character/ModelWithAnimationsFBXLoader'
import ThreeDCharacter from '~/src/lib/threed/components/nouns/Character/ThreeDCharacter'
import ThreeDMercedes from '~/src/lib/threed/components/nouns/Character/ThreeDMercedes'

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
// import { ThreeDGarden as ThreeDFarmBotGarden } from '#/lib/farmbot/frontend/three_d_garden'

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
// const CHARACTER_MODEL_URL = new URL(
//   '/public/objects/SK_Chr_Farmer_Female_01.glb',
//   import.meta.url,
// ).href

/**
 * Character animation set preset
 */
const animationSet = {
  idle:     "CharacterArmature|Idle",
  walk:     "CharacterArmature|Walk",
  run:      "CharacterArmature|Run",
  jump:     "CharacterArmature|Jump",
  jumpIdle: "CharacterArmature|Jump_Idle",
  jumpLand: "CharacterArmature|Jump_Land",
  fall:     "CharacterArmature|Duck",
  action1:  "CharacterArmature|Wave",
  action2:  "CharacterArmature|Death",
  action3:  "CharacterArmature|HitReact",
  action4:  "CharacterArmature|Punch",
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

  // console.debug(`%c EXPERIENCE: props.threeds`, ccm.redAlert, threeds)

  // ** GET THREED PREFERENCES FROM APOLLO CLIENT STORE:STATE
  const prefs = useReactiveVar(preferencesDataVar)
  // console.debug(`%c EXPERIENCE: APOLLO prefs`, ccm.orangeAlert, prefs)
  const capsuleHalfHeight: number = 5.8   // Adjust your model's height
  const capsuleRadius: number = 3.2       // Adjust your model's width
  const floatHeight: number = 0.0         // Adjust floating height above ground
  
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
    observe: false,
    margin: 1.0,
    maxDuration: 1,
    interpolateFunc0: (t: number) => 1 - Math.exp(-5 * t) + 0.007 * t, // Matches default behavior
    interpolateFunc1: (t: number) => -t * t * t + 2 * t * t, // Start smooth, finish linear
    interpolateFunc2: (t: number) => -t * t * t + t * t + t, // Start linear, finish smooth
  }

  // ==========================================================
  // ** RETURN JSX
  return (
    // {/* REACT SUSPENSE */}
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

      {/* <group 
        ref={refCanvas}
      > */}

        {/* THREED USING PHYSICS */}
        <Physics
          debug={true}
          // debug={prefs.doWorldPhysics}
          // gravity={[0, -9.81, 0]} // default [0, -9.81, 0] 
          // interpolation={false} 
          // colliders={'trimesh'}
          timeStep={1/60} // (default) 1/60 | 1/30 | 1/15 | 1/120 | 'vary' | 
          // timeStep={'vary'}
          paused={pausedPhysics}
        >

          {/* R3F BOUNDS */}
          <Bounds 
            fit={configBounds.fit} 
            clip={configBounds.clip}
            observe={configBounds.observe}
            margin={configBounds.margin}
            maxDuration={configBounds.maxDuration} 
            interpolateFunc={configBounds.interpolateFunc2}
          >

            {/* ** FLOORS (PLANES +/- 0 GROUND) */}
            {/* ** The Floor (Plane 0) */}
            <group 
              scale={1.0} 
              position={[0, 0, 0]}
              rotation={[0, 0, 0]} 
            >
              <Floor color={'darkgreen'} opacity={0.80} />
            </group>
            {/* ** The Basement Floor (Plane -1) */}
            <group 
              scale={1.0} 
              position={[0, -400, 0]}
              rotation={[0, 0, 0]}
            >
              <Floor color={'saddlebrown'} opacity={0.20} />
            </group>
            {/* ** SUB FLOORS[s] (Plane < 0) */}
            {/* <SubFloor level={`${level[index]}`} /> */}
            {/* ** END FLOORS ** */}

            {/* R3F BOUNDS: 
                SELECT TO ZOOM IN ON OBJECTS 
            */}
            <SelectToZoom>

              {/* STEPS -- aka: four-by-fours, 4"x4"[s], posts, logs */}
              <group 
                scale={0.10} 
                position={[0, 1, 0]}
                rotation={[0, 0, 0]}
              >
                <Steps />
              </group>

              {/* ROUGH PLANE */}
              <group 
                scale={10.0} 
                position={[80, -3, 100]}
                rotation={[0, 0, 0]} 
                // onClick={handleClick}
              >
                <RoughPlane />
              </group>

              {/* SLOPES + STAIRS */}
              {/* 
              <group 
                scale={10.0} 
                position={[10, 0, 10]}
                rotation={[0, 0, 0]} 
              >
                <Slopes />
              </group>
              */}

              {/* RIGID BODY OBJECTS (basic rapier components) */}
              <group 
                scale={0.10} 
                position={[-4, 10.00, 0]}
                rotation={[0, 0, 0]}
              >
                <RigidObjects />
              </group>

              {/* FLOATING PLATFORMS
              <group rotation={[0, 0, 0]} scale={1.0}>
                <FloatingPlatforms />
              </group>
              */}

              {/* DYNAMIC PLATFORMS
              <group rotation={[0, 0, 0]} scale={1.0} position={[0, 2.01, 0]}>
                <DynamicPlatforms />
              </group>
              */}

              {/* INTERACTIVE "SHOT CUBES"
              <group rotation={[0, 0, 0]} scale={1.0} position={[0, 4.0, 0]}>
                <ShotCube />
              </group>
              */}

              {/* EXAMPLE: BIRDS */}
              { true && (
                <group 
                  scale={2.4} 
                  position={[0, 128, 0]}
                  rotation={[0, 0, 0]} 
                >
                  <Birds />
                </group>
              )}

              {/* EXAMPLE MAP: TAVERN */}
              <group
                scale={0.80} 
                position={[8, 14, -160]}
                rotation={[(Math.PI/2) + 0, (-Math.PI/1), (Math.PI/1) + 0]}
                // quaternion={[0,0,0,0]}
              >
                <Map />
              </group>
                
              {/* testing... */}
              {/* THREED MODELS as props.threeds */}
              { threeds.length > 0 && (
                <group
                  key='threed_models_children'
                  // master position for all threeds?
                  // position={[-4, 0, 0]}
                  // position={[0, -1, 0]}
                  // scale all threeds?
                  // scale={1.3}
                >
                  <ThreeDModels
                    threeds={threeds}
                  />
                </group>
              )}
              {/* ...testing */}

              {/* THREED FARMBOTS */}
              <group 
                key="farmbot1"
                scale={0.0160} 
                position={[-40, 5, -30]}
                rotation={[-Math.PI/2, 0, -Math.PI]}
              >
                <ThreeDFarmBotGarden 
                  key={'ThreeDFarmBotGarden_' + newUUID()} 
                />
              </group>
              {/* 
              <group 
                key="farmbot0"
                scale={0.002} 
                position={[-5.4, 0.4, -0.6]}
                rotation={[-Math.PI/2, 0, -Math.PI/2]}
              >
                <ThreeDFarmBotMain />
              </group>
              */}

              {/* THREED CHARACTER MODELS */}
              <KeyboardControls map={keyboardMap}>
                
                {/* CHARACTER MODEL: MAIN FARMER */}
                { true && (
                <group 
                  key='character1' 
                  // position={[0, 200, 0]}
                  // scale={[0.01, 0.01, 0.01]}
                  // scale={[0.1, 0.1, 0.1]}
                  // scale={[10.0, 10.0, 10.0]}
                  // scale={[100.0, 100.0, 100.0]}
                  // rotation={[(Math.PI/2) + 0, (-Math.PI/1), (Math.PI/1) + 0]}
                  // quaternion={[0,0,0,0]}
                >
                  <CharacterControls

                    // ** PROPS
                    
                    // scale={[100, 100, 100]}
                    // scale={[1.0, 1.0, 1.0]}
                    // scale={[0.1, 0.1, 0.1]}
                    // scale={[0.01, 0.01, 0.01]}
                    // scale={[0.001, 0.001, 0.001]}
                    
                    // debug={false}
                    // debug={true}
                    debug={prefs.doWorldDebug}
                    
                    // animated={false}
                    animated={true}
                    // animated={prefs.doCharacterAnimation}
                    
                    // mode={'FixedCamera'}
                    // mode='CameraBasedMovement'

                    // gravityScale={20}
                    
                    disableControl={false}
                    // disableControl={true}
                    // disableControl={prefs.doWorldControl}
                    
                    // disableFollowCam={false}
                    disableFollowCam={true}
                    // disableFollowCam={prefs.doWorldUnfollowCam}
                    
                    followLight={false}
                    // followLight={true}
                    // followLight={prefs.doWorldFollowLight}
                    
                    // ** MICRO-CONTROLS
                    // custom model (10x scale) props...
                    capsuleHalfHeight={capsuleHalfHeight}   // TODO: set from prefs
                    capsuleRadius={capsuleRadius}           // TODO: set from prefs
                    floatHeight={floatHeight}               // TODO: set from prefs

                    // Movement (Gentler to prevent tipping)
                    maxVelLimit={1.0}            // Increase max velocity for larger scale
                    rejectVelMult={4000.0}          // Counteracts sliding. Helps counteract unwanted sliding (especially on slopes): BUG -- The character's velocity isn't being properly clamped
                    turnVelMultiplier={1.0}
                    turnSpeed={10}
                    sprintMult={2.0}
                    jumpVel={2.0}                // Adjust jump strength
                    jumpForceToGroundMult={5.0}
                    slopJumpMult={0.25}
                    sprintJumpMult={1.2}
                    airDragMultiplier={20}
                    dragDampingC={200.0}            // Higher: faster stopping. Acts like friction.  Higher values kill velocity faster
                    accDeltaTime={1}              // Lower: snappier response. Smaller values reduce "input lag" when stopping
                    moveImpulsePointY={0.5}
                    
                    // Floating Ray setups
                    rayOriginOffset={{ x: 0, y: -capsuleHalfHeight, z: 0 }}
                    rayHitForgiveness={0.1}
                    rayLength={capsuleRadius + 2}     // Adjust ray length for ground detection
                    rayDir={{ x: 0, y: -1, z: 0 }}
                    // floatingDis={capsuleRadius + floatHeight}
                    floatingDis={capsuleHalfHeight / 2}
                    // floatingDis={0.0000000000}
                    springK={400.60}                    // Default: 1.2 (firmer ground contact)
                    dampingC={40}                    // Default: 0.08 (less oscillation)
                    
                    // Slope Ray setups
                    showSlopeRayOrigin={false}
                    slopeMaxAngle={1}                 // radians
                    slopeRayOriginOffest={capsuleRadius - 0.03}
                    slopeRayLength={capsuleRadius + 3}
                    slopeRayDir={{ x: 0, y: -1, z: 0 }}
                    slopeUpExtraForce={0.1}
                    slopeDownExtraForce={0.2}

                    // Auto-Balance Force (Critical for stability)
                    autoBalance={true}
                    autoBalanceSpringK={6000.0}       // Default: 0.3 (stronger upright force)
                    autoBalanceDampingC={40.00}     // Default: 0.03 (smoother corrections)
                    autoBalanceSpringOnY={6000.0}     // Default: 0.5 (stronger Y-axis balance)
                    autoBalanceDampingOnY={20.00}   // Default: 0.015 (damping on Y-axis)
                    
                    // Camera & Control
                    camFollowMult={11}                // Cam follow speed (may need increase)
                    camLerpMult={25}                  // Cam smoothing
                    fallingGravityScale={2.5}
                    fallingMaxVel={-40}
                    wakeUpDelay={200}
                    
                    // EXAMPLE IMPROVEMENTS: Lock Rotations (Optional)
                    // lockX={true}                  // Prevent falling sideways?
                    // lockZ={true}                  // Prevent leaning forward/backward?
                  >
                    <ThreeDCharacter 
                      position={[0, -9, 0]}
                    />
                    {/* <ModelWithAnimations /> */}
                    {/* <ModelWithAnimationsFBXLoader /> */}
                    {/* <CharacterModelFarmerWomanFloating scale={1.016} /> */}
                    {/* <CharacterModelFarmerManFloating scale={1.016} /> */}
                  </CharacterControls>
                </group>
                )}
                {/* END: CHARACTER MODEL */}

                {/* EXAMPLE: CHARACTER MODEL: ANIMATION STACY */}
                { true && (
                <group 
                  key='character2' 
                  position={[80, 0, -110]}
                >
                  <ThreeDMercedes scale={1.0} />
                </group>
                )}
                {/* END: CHARACTER MODEL */}

                {/* EXAMPLE: CHARACTER MODEL: ANIMATION STACY */}
                { false && (
                <group 
                  key='character2' 
                  position={[80, 0, 0]}
                >
                  {/* <CharacterModel /> */}
                  {/* <CharacterModelFloating /> */}
                  <CharacterModelStacy scale={0.12} />
                </group>
                )}
                {/* END: CHARACTER MODEL */}

                {/* EXAMPLE: CHARACTER MODEL: CHICKEN */}
                { false && (
                <group 
                  key='character3' 
                  position={[-200, 0, 0]}
                >
                  <CharacterModelChicken scale={160} />
                </group>
                )}
                {/* END: CHARACTER MODEL */}
              
              </KeyboardControls>

              {/* </Suspense> */}
              {/* END: CHARACTER MODELS */}

            </SelectToZoom>
            {/* END: SELECT TO ZOOM */}
            
          </Bounds>
          {/* END: R3F BOUNDS */}

        </Physics>
        {/* END: PHYSICS RAPIER */}

      {/* </group> */}
      {/* END: CANVAS GROUP REF */}

    </Suspense>
    // {/* END: REACT SUSPENSE */}
  )
}
) // end forwardRef

// module properties
ThreeDExperience.displayName = 'ThreeD-Experience'

export default ThreeDExperience
