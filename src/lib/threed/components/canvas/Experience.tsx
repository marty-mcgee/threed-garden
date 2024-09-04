// 'use client'
// ==========================================================
// RESOURCES

// ** APOLLO Imports
import { useReactiveVar } from '@apollo/client'
import { preferencesDataVar } from '#/lib/stores/apollo'

// ** NEXT Imports
// import dynamic from 'next/dynamic'
// import Image from 'next/image'

// ** REACT Imports
import { 
  useEffect, 
  useState, 
  forwardRef, 
  Suspense 
} from 'react'

// THREE JS * ALL
import * as THREE from 'three'

// ** REACT THREE Imports
import { 
  KeyboardControls, 
  Grid,
} from '@react-three/drei'
// ** PHYSICS LIBRARY
import { Physics } from '@react-three/rapier'

// ** LEVA Imports
import { useControls } from 'leva'

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

// ** THREED OBJECTS
// import Camera from '#/lib/threed/components/canvas/Camera'
// import Lights from '#/lib/threed/components/canvas/Lights'
import Floor from '#/lib/threed/components/canvas/Floor'
import Ground from '#/lib/threed/components/canvas/Ground'

// ** THREED CHARACTER CONTROL Imports
import CharacterControls from '~/src/lib/ecctrl/src/Ecctrl'
// import CharacterControls from '~/src/lib/ecctrl/src/EcctrlNew'
// import CharacterControls from '~/src/lib/ecctrl/src/CharacterControls'

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

// ** THREED OBJECT INTERACTIVE EXAMPLES
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
import ThreeDFarmBotMain from '#/lib/farmbot/threed-farmbot/main-threed'
import ThreeDFarmBotGarden from '#/lib/farmbot/threed-farmbot/garden-threed'

// ** HELPER Imports
import Spinner from '#/layout/ui/components/spinner'
// ** HELPFUL UTIL: COLORFUL CONSOLE MESSAGES (ccm)
import ccm from '#/lib/utils/console-colors'
import { EcctrlAnimation } from '~/src/lib/ecctrl/src/EcctrlAnimation'

// ** THREED.AI
// import ThreeDAI from '#/lib/threed/components/tools/ThreeDAI' // TODO

// ** IMPORT RESOURCES complete

// **
// ** DEBUGGING
// **
const debug = false
const DEBUG = false

// ** RETURN ThreeDExperience
// export default function ThreeDExperience({ threeds }: { threeds: object[]}, ref: any) {
const ThreeDExperience = forwardRef((
  { threeds, ...props }:
  { threeds: object[]}, 
  ref: any
) => {

  // ** GET THREED PREFERENCES FROM APOLLO CLIENT STORE:STATE
  const prefs = useReactiveVar(preferencesDataVar)
  // console.debug(`%c EXPERIENCE: APOLLO prefs`, ccm.orangeAlert, prefs)
  // const prefs = {
  //   doWorldDebug: false,
  //   doWorldTesting: false,
  //   doWorldPhysics: false,
  //   doWorldUnfollowCam: false,
  // }
  // console.debug(`%c CHARACTER MODEL: prefs`, ccm.redAlert, prefs)

  // ** Delay physics activate
  const [pausedPhysics, setPausedPhysics] = useState(true)
  useEffect(() => {
    const timeout = setTimeout(() => {
      setPausedPhysics(false)
    }, 500)
    return () => clearTimeout(timeout)
  }, [])

  /**
   * World Preferences
   */
  const [{
    doWorldDebug,
    doWorldTesting,
    doWorldPhysics,
    doWorldUnfollowCam,
  }, setWorldPreferencesLeva] = useControls(
    'World Preferences',
    () => ({
      doWorldDebug: {
        label: 'World Debugger?',
        value: prefs.doWorldDebug,
      },
      doWorldTesting: {
        label: 'ThreeD Testing?',
        value: prefs.doWorldTesting,
      },
      doWorldPhysics: {
        label: 'Physics Debugger?',
        value: prefs.doWorldPhysics,
      },
      doWorldUnfollowCam: {
        label: 'Unfollow Character?',
        value: prefs.doWorldUnfollowCam,
      },
    }),
    {
      color: 'darkgreen',
      collapsed: true, // !!! bug: true throws error !!!
      order: 10,
    },
  )

  // ==========================================================
  // ** doWorldDebug
  // **
  useEffect(() => {
    let newData = {...prefs}
    // if (debug) console.debug('%c preset newData', ccm.green, newData)
    newData.doWorldDebug = doWorldDebug
    // if (debug) console.debug('%c preset newData UPDATED', ccm.green, newData)
    preferencesDataVar(newData)
    // if (debug) console.debug('%c preset preferencesDataVar', ccm.darkgreen, preferencesDataVar())
    if (debug) console.debug('%c⚙️ READ FROM MASTER REACTIVE VAR: prefs.doWorldDebug', ccm.yellowAlert, prefs.doWorldDebug)
  }, [doWorldDebug])

  // **
  useEffect(() => {
    // if (prefs.doWorldDebug != undefined) {
      setWorldPreferencesLeva({ doWorldDebug: prefs.doWorldDebug })
    // }
    if (debug) console.debug('%c⚙️ READ FROM MASTER REACTIVE VAR: prefs.doWorldDebug', ccm.greenAlert, prefs.doWorldDebug)
  }, [prefs.doWorldDebug])


// ==========================================================
  // ** doWorldTesting
  // **
  useEffect(() => {
    let newData = {...prefs}
    // if (debug) console.debug('%c preset newData', ccm.green, newData)
    newData.doWorldTesting = doWorldTesting
    // if (debug) console.debug('%c preset newData UPDATED', ccm.green, newData)
    preferencesDataVar(newData)
    // if (debug) console.debug('%c preset preferencesDataVar', ccm.darkgreen, preferencesDataVar())
    if (debug) console.debug('%c⚙️ READ FROM MASTER REACTIVE VAR: prefs.doWorldTesting', ccm.yellowAlert, prefs.doWorldTesting)
  }, [doWorldTesting])

  // **
  useEffect(() => {
    // if (prefs.doWorldTesting != undefined) {
      setWorldPreferencesLeva({ doWorldTesting: prefs.doWorldTesting })
    // }
    if (debug) console.debug('%c⚙️ READ FROM MASTER REACTIVE VAR: prefs.doWorldTesting', ccm.greenAlert, prefs.doWorldTesting)
  }, [prefs.doWorldTesting])


// ==========================================================
  // ** doWorldPhysics
  // **
  useEffect(() => {
    let newData = {...prefs}
    // if (debug) console.debug('%c preset newData', ccm.green, newData)
    newData.doWorldPhysics = doWorldPhysics
    // if (debug) console.debug('%c preset newData UPDATED', ccm.green, newData)
    preferencesDataVar(newData)
    // if (debug) console.debug('%c preset preferencesDataVar', ccm.darkgreen, preferencesDataVar())
    if (debug) console.debug('%c⚙️ READ FROM MASTER REACTIVE VAR: prefs.doWorldPhysics', ccm.yellowAlert, prefs.doWorldPhysics)
  }, [doWorldPhysics])

  // **
  useEffect(() => {
    // if (prefs.doWorldPhysics != undefined) {
      setWorldPreferencesLeva({ doWorldPhysics: prefs.doWorldPhysics })
    // }
    if (debug) console.debug('%c⚙️ READ FROM MASTER REACTIVE VAR: prefs.doWorldPhysics', ccm.greenAlert, prefs.doWorldPhysics)
  }, [prefs.doWorldPhysics])


// ==========================================================
  // ** doWorldUnfollowCam
  // **
  useEffect(() => {
    let newData = {...prefs}
    // if (debug) console.debug('%c preset newData', ccm.green, newData)
    newData.doWorldUnfollowCam = doWorldUnfollowCam
    // if (debug) console.debug('%c preset newData UPDATED', ccm.green, newData)
    preferencesDataVar(newData)
    // if (debug) console.debug('%c preset preferencesDataVar', ccm.darkgreen, preferencesDataVar())
    if (debug) console.debug('%c⚙️ READ FROM MASTER REACTIVE VAR: prefs.doWorldUnfollowCam', ccm.yellowAlert, prefs.doWorldUnfollowCam)
  }, [doWorldUnfollowCam])

  // **
  useEffect(() => {
    // if (prefs.doWorldUnfollowCam != undefined) {
      setWorldPreferencesLeva({ doWorldUnfollowCam: prefs.doWorldUnfollowCam })
    // }
    if (debug) console.debug('%c⚙️ READ FROM MASTER REACTIVE VAR: prefs.doWorldUnfollowCam', ccm.greenAlert, prefs.doWorldUnfollowCam)
  }, [prefs.doWorldUnfollowCam])


  // ==========================================================
  /**
   * Keyboard control preset
   */
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

  // const camera = new THREE.PerspectiveCamera()

  // ==========================================================
  // ** RETURN JSX
  return (
    <group ref={ref}>

      {/* EXAMPLES: BIRDS */}
      {/* <group rotation={[0, 0, 0]} scale={1.0} position={[0, 24, 0]}>
        <Birds />
      </group> */}

      {/* THREED USING PHYSICS */}
      <Physics
        // debug={prefs.doWorldPhysics}
        debug={true}
        // timeStep={1/60} // 'vary' does not work well, try (default) 1/60 | 1/30 | 1/15 | 1/120 etc
        paused={pausedPhysics}
      >

        {/* <Suspense fallback={null}> */}

        {/* baby steps */}
        {/* Steps -- aka: four-by-fours, 4"x4"[s], posts, logs */}
        <group rotation={[0, 0, 0]} scale={1.0} position={[0, 0.1, 0]}>
          <Steps />
        </group>

        {/* toddler steps (advanced degrees) */}
        {/* Rough Plane */}
        {/* <group rotation={[0, 0, 0]} scale={1.0} position={[8.4, -0.40, 10]}>
          <RoughPlane />
        </group> */}
        {/* Slopes + Stairs */}
        {/* <group rotation={[0, 0, 0]} scale={1.0} position={[0, -0.00, 0]}>
          <Slopes />
        </group> */}
        {/* Rigid Body Objects */}
        {/* <group rotation={[0, 0, 0]} scale={1.0} position={[-4, 10.00, 0]}>
          <RigidObjects />
        </group> */}

        {/* kinder steps (active objects) */}
        {/* Floating Platforms */}
        {/* <group rotation={[0, 0, 0]} scale={1.0}>
          <FloatingPlatforms />
        </group> */}

        {/* elementary steps (random active objects) */}
        {/* Dynamic Platforms */}
        {/* <group rotation={[0, 0, 0]} scale={1.0} position={[0, 2.01, 0]}>
          <DynamicPlatforms />
        </group> */}
        {/* Shot Cubes */}
        {/* <group rotation={[0, 0, 0]} scale={1.0} position={[0, 4.0, 0]}>
          <ShotCube />
        </group> */}

        {/* solid steps (levels, safety) */}
        {/* The Floor (Plane 0) */}
        <group rotation={[0, 0, 0]} scale={1.0} position={[0, 0, 0]}>
          <Floor color={'darkgreen'} opacity={0.8} />
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

        {/* THREED FARMBOT */}
        <group rotation={[-Math.PI/2, 0, Math.PI]} scale={0.002} position={[-8, 0.665, -2]}>
          <ThreeDFarmBotGarden />
        </group>
        {/* <group rotation={[-Math.PI/2, 0, -Math.PI/2]} scale={0.002} position={[-5.4, 0.4, -0.6]}>
          <ThreeDFarmBotMain />
        </group> */}

        {/* [MM] HEY HEY HEY : FALL FROM SKY.......................... */}
        {/* CHARACTER MODELS */}
        <KeyboardControls map={keyboardMap}>
          {/* CHARACTER MODEL */}
          <group key='character0' position={[-1.6, 0.396, -1.6]}>
            <CharacterControls
              // debug={prefs.doWorldDebug}
              debug={false}
              // animated={prefs.doCharacterAnimation}
              animated={false}
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
            >
              <CharacterModelChicken />
            </CharacterControls>
          </group>
          {/* END: CHARACTER MODEL */}
          {/* CHARACTER MODEL */}
          <group key='character1' position={[0, 0.396, 0]}>
            <CharacterControls
              debug={prefs.doWorldDebug}
              // debug={false}
              // animated={prefs.doCharacterAnimation}
              animated={false}
              disableFollowCam={prefs.doWorldUnfollowCam}
              // disableFollowCam={true}
              followLight={true}
              springK={2}
              dampingC={0.2}
              autoBalanceSpringK={1.2}
              autoBalanceDampingC={0.04}
              // autoBalanceSpringOnY={0.7} // CAN CAUSE HECK!!! if dispose={null}
              // autoBalanceDampingOnY={0.05} // CAN CAUSE HECK!!! if dispose={null}
              mode='FixedCamera'
            >
              {/* <CharacterModel /> */}
              {/* <CharacterModelFloating /> */}
              <CharacterModelFarmerWomanFloating />
              {/* <CharacterModelFarmerManFloating /> */}
            </CharacterControls>
          </group>
          {/* END: CHARACTER MODEL */}
        </KeyboardControls>

        {/* // import Map from './Map' */}
        {/* <group 
          rotation={[(-Math.PI/2) + 0, (-Math.PI/2), (-Math.PI/2) + 0]} 
          scale={1.4} 
          position={[0, 2, 26]}
        >
          <Map />
        </group> */}
          
        {/* THREED MODELS as props.children */}
        <group
          key='threed_models_children'
          scale={0.3}
        >
          {/* {children} */}
          {/* THREED MODELS: WORKING !!! */}
          {/* SEND THREEDS OF MODEL[S] TO A CANVAS */}
          <ThreeDModels
            threeds={threeds}
            // threeds={{}}
            // position={[ -4, 0, 0 ]}
          />
        </group>

        {/* </Suspense> */}
      </Physics>
    </group>
  )
}
) // end forwardRef

export default ThreeDExperience