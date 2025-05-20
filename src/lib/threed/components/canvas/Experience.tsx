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

// ** ***************************************************

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
  // ** TODO: set from prefs
  const capsuleHalfHeight: number = 0.60  // Adjust your model's height (default: 0.35)
  const capsuleRadius: number = 0.3       // Adjust your model's width (default: 0.3)
  const floatHeight: number = 0.0         // Adjust floating height above ground (default: 0.3)
  
  // ** PROGRESS LOADER using react-three-drei
  // const { active, progress, errors, item, loaded, total } = useProgress()

  // ** PHYSICS delay physics activation
  const [pausedPhysics, setPausedPhysics] = useState(prefs.doWorldPhysics)
  useEffect(() => {
    const timeout = setTimeout(() => {
      setPausedPhysics(false)
    }, 3000)
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
              <Floor 
                color={'white'} 
                opacity={1.00} 
              />
            </group>
            {/* ** The Basement Floor (Plane -1) */}
            {/* <group 
              scale={1.0} 
              position={[0, -400, 0]}
              rotation={[0, 0, 0]}
            >
              <Floor 
                color={'saddlebrown'} 
                opacity={1.00} 
              />
            </group> */}
            {/* ** SUB FLOORS[s] (Plane < 0) */}
            {/* <SubFloor level={`${level[index]}`} /> */}
            {/* ** END FLOORS ** */}

            {/* R3F BOUNDS: 
                SELECT TO ZOOM IN ON OBJECTS 
            */}
            <SelectToZoom>

              {/* STEPS -- aka: four-by-fours, 4"x4"[s], posts, logs */}
              <group 
                scale={0.010} 
                position={[0, 0.1, 0]}
                rotation={[0, 0, 0]}
              >
                <Steps />
              </group>

              {/* ROUGH PLANE */}
              <group 
                scale={1.0} 
                position={[8, -0.3, 10]}
                rotation={[0, 0, 0]} 
                // onClick={handleClick}
              >
                <RoughPlane />
              </group>

              {/* SLOPES + STAIRS */}
              {/* 
              <group 
                scale={0.0} 
                position={[10, 0, 10]}
                rotation={[0, 0, 0]} 
              >
                <Slopes />
              </group>
              */}

              {/* RIGID BODY OBJECTS (basic rapier components) */}
              <group 
                scale={0.010} 
                position={[-0.4, 2.20, 0]}
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
                  scale={0.24} 
                  position={[0, 12, 0]}
                  rotation={[0, 0, 0]} 
                >
                  <Birds />
                </group>
              )}

              {/* EXAMPLE MAP: TAVERN */}
              <group
                scale={0.080} 
                position={[0.8, 1.4, -16]}
                rotation={[(Math.PI/2) + 0, (-Math.PI/1), (-Math.PI/2) + 0]}
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
                scale={0.00160} 
                position={[-4, 0.5, -3]}
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
                  // position={[0, -0.5, 0]}
                  // scale={[0.01, 0.01, 0.01]}
                  // scale={[0.1, 0.1, 0.1]}
                  // scale={[10.0, 10.0, 10.0]}
                  // scale={[100.0, 100.0, 100.0]}
                  // rotation={[(Math.PI/2) + 0, (-Math.PI/1), (Math.PI/1) + 0]}
                  // quaternion={[0,0,0,0]}
                >
                  <CharacterControls
                    // ** PROPS
                    debug={false}
                    // debug={true}
                    // debug={prefs.doWorldDebug}

                    // 'drop from' position
                    position={[0, 4, 0]}

                    // do not scale here
                    // scale={[100, 100, 100]}
                    // scale={[1.0, 1.0, 1.0]}
                    // scale={[0.1, 0.1, 0.1]}
                    // scale={[0.01, 0.01, 0.01]}
                    // scale={[0.001, 0.001, 0.001]}
                    
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


                    // ** CURRENT ERROR(S)
                    // THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values


                    // ** MICRO-CONTROLS
                    // ** custom model props...

                    // // Core Physics (calculated for 0.1 scale model)
                    capsuleHalfHeight={capsuleHalfHeight}   // TODO: set from prefs
                    capsuleRadius={capsuleRadius}           // TODO: set from prefs
                    floatHeight={floatHeight}               // TODO: set from prefs
                    
                    // // Movement (human-like physics at this scale)
                    // maxVelLimit={2.5}             // 2.5 m/s max speed (scaled to model)
                    // turnVelMultiplier={0.25}      // Balanced turning
                    // turnSpeed={12}                // Moderate rotation speed
                    // sprintMult={1.8}              // 80% speed boost when sprinting
                    // jumpVel={4}                   // 4 m/s jump velocity
                    // jumpForceToGroundMult={5}     // Reasonable ground reaction
                    // slopJumpMult={0.25}           // Standard slope jump effect
                    // sprintJumpMult={1.2}          // 20% jump boost when sprinting
                    // airDragMultiplier={0.15}      // Slight air control
                    airDragMultiplier={0.60}         // [MM] + is ??? MAYBE
                    // dragDampingC={0.2}            // Good stopping friction
                    // dragDampingC={0.1}            // [MM] - is ??? YES
                    // dragDampingC={0.05}           // [MM] - is ??? YES
                    dragDampingC={0.01}              // [MM] - is ??? MAYBE
                    // accDeltaTime={8}              // Responsive acceleration
                    // moveImpulsePointY={0.5}       // Center of mass position
                    
                    // // Floating Ray (stability system)
                    // rayOriginOffset={{ x: 0, y: -0.4, z: 0 }}  // Just below capsule
                    // rayHitForgiveness={0.05}       // Small forgiveness margin
                    // rayLength={0.5}                // Slightly longer than capsule
                    // floatingDis={0.05}             // Target hover distance
                    // springK={30}                   // Firm but not extreme spring
                    // springK={120}                  // [MM] + is bouncy
                    // springK={10}                   // [MM] - is ???
                    // dampingC={0.8}                 // Strong enough damping
                    // dampingC={2.0}                 // [MM] + is ??? NO: chaos
                    // dampingC={0.6}                 // [MM] - is ??? MAYBE
                    // dampingC={0.2}                 // [MM] - is ??? MAYBE

                    // // Slope Handling
                    // slopeMaxAngle={0.5}            // ~30 degree max slope (radians)
                    // slopeRayOriginOffest={0.18}    // Slightly inset from edge
                    // slopeRayLength={0.5}           // Matching main ray
                    // slopeUpExtraForce={0.1}        // Gentle slope assist
                    // slopeDownExtraForce={0.15}     // Slightly stronger downhill
                    
                    // // Auto-Balance
                    // autoBalanceSpringK={3}         // Moderate upright force
                    // autoBalanceDampingC={0.15}     // Smooth corrections
                    // autoBalanceSpringOnY={2}       // Slightly softer Y-axis
                    // autoBalanceDampingOnY={0.1}    // Less Y damping
                    
                    // // Camera
                    // camFollowMult={8}              // Smooth follow
                    // camLerpMult={15}               // Nice camera lerp
                    // fallingGravityScale={2}        // Realistic fall speed
                    // fallingMaxVel={-15}            // Terminal velocity
                  >
                    <ThreeDCharacter 
                      position={[0, -0.88, 0]} 
                    />
                  </CharacterControls>
                </group>
                )}
                {/* END: CHARACTER MODEL */}

                {/* EXAMPLE: CHARACTER MODEL: ANIMATION STACY */}
                { true && (
                <group 
                  key='character2' 
                  position={[9, 0.5, -10]}
                >
                  <ThreeDMercedes 
                    scale={0.10} 
                  />
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
                  <CharacterModelStacy 
                    scale={0.12} 
                  />
                </group>
                )}
                {/* END: CHARACTER MODEL */}

                {/* EXAMPLE: CHARACTER MODEL: CHICKEN */}
                { false && (
                <group 
                  key='character3' 
                  position={[-200, 0, 0]}
                >
                  <CharacterModelChicken 
                    scale={160} 
                  />
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
