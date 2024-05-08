// 'use client'
// ==========================================================
// RESOURCES

// ** APOLLO Imports
import { useReactiveVar } from '@apollo/client'
import { preferencesDataVar } from '#/lib/stores/apollo'

// ** REACT Imports
import { useEffect, useState } from 'react'

// ** REACT THREE Imports
import { Grid, KeyboardControls } from '@react-three/drei'
import { Physics } from '@react-three/rapier'

// ** LEVA Imports
import { useControls } from 'leva'

// ** THREED.AI
// ** THREED OBJECTS
import Floor from '#/lib/threed/components/canvas/Floor'
import Lights from '#/lib/threed/components/canvas/Lights'
// ** THREED CHARACTER CONTROL Imports
import Ecctrl from '#/lib/ecctrl/src/Ecctrl'
import CharacterModel0 from '#/lib/threed/components/nouns/Character/CharacterModelDemon'
import CharacterModel1 from '#/lib/threed/components/nouns/Character/CharacterModelFloating'
// import CharacterModel2 from '#/lib/threed/components/nouns/Character/FarmerMan'
// import CharacterModel3 from '#/lib/threed/components/nouns/Character/Character'
import CharacterModel4 from '#/lib/threed/components/nouns/Character/FarmerManFloating'
import CharacterModel5 from '#/lib/threed/components/nouns/Character/FarmerWomanFloating'
// import CharacterModel6 from '#/lib/threed/components/nouns/Character/FarmerBoyFloating'
// import CharacterModel7 from '#/lib/threed/components/nouns/Character/FarmerGirlFloating'
import Birds from '#/lib/threed/components/examples/Birds/Birds'
// ** THREED OBJECT EXAMPLES
import Steps from '#/lib/threed/components/examples/threed/Steps'
import Slopes from '#/lib/threed/components/examples/threed/Slopes'
import RoughPlane from '#/lib/threed/components/examples/threed/RoughPlane'
import RigidObjects from '#/lib/threed/components/examples/threed/RigidObjects'
import FloatingPlatform from '#/lib/threed/components/examples/threed/FloatingPlatform'
import DynamicPlatforms from '#/lib/threed/components/examples/threed/DynamicPlatforms'
import ShotCube from '#/lib/threed/components/examples/threed/ShotCube'
import Map from '#/lib/threed/components/examples/threed/Map'

// ** HELPER Imports
import { Perf, PerfHeadless, usePerf } from 'r3f-perf'
import Spinner from '#/ui/components/spinner'
// ** HELPFUL UTIL: COLORFUL CONSOLE MESSAGES (ccm)
import ccm from '#/lib/utils/console-colors'

// ** IMPORT RESOURCES complete

// **
// ** DEBUGGING
// **
const debug = false
const testing = false

// ** MAIN FUNCTION to return JSX "EXPERIENCE"
export default function Experience() {

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
        label: 'Testing?',
        value: prefs.doWorldTesting,
      },
      doWorldPhysics: {
        label: 'Physics Debugger?',
        value: prefs.doWorldPhysics,
      },
      doWorldUnfollowCam: {
        label: 'Camera Unfollow?',
        value: prefs.doWorldUnfollowCam,
      },
    }),
    {
      color: 'darkgreen',
      collapsed: false,
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

  return (
    <>

      {/* LIGHTS */}
      <Lights />

      {/* // import Birds from './Birds' */}
      <group rotation={[0, 0, 0]} scale={1.0} position={[0, 24, 0]}>
        <Birds />
      </group>

      <Physics
        // debug={prefs.doWorldPhysics}
        debug={false}
        // timeStep='vary'
        // paused={pausedPhysics}
      >

        {/* [MM] HEY HEY HEY : FALL FROM SKY..........................
            CHARACTER MODEL[S] GROUP */}
        <group rotation={[0, 0, 0]} scale={1.0} position={[0, 16, 0]}>

        {/* Character Model 1 Control */}
        {/* THREED CHARACTER [n] -- FARMER FEMALE */}
        {/* Keyboard preset */}
        <KeyboardControls map={keyboardMap}>
          <Ecctrl
            // debug={prefs.doWorldDebug}
            debug={false}
            // animated={prefs.doCharacterAnimation}
            animated={false}
            // disableFollowCam={prefs.doWorldUnfollowCam}
            disableFollowCam={true}
            // followLight={false}
            // springK={2}
            // dampingC={0.2}
            // autoBalanceSpringK={1.2}
            // autoBalanceDampingC={0.04}
            // // autoBalanceSpringOnY={0.7} // CAUSES HECK!!!
            // // autoBalanceDampingOnY={0.05} // CAUSES HECK!!!
          >
            {/* GROUND DWELLER / DEMON PETE / AWWW */}
            <group rotation={[0, 0, 0]} scale={0.016} position={[0, 0, 0]}>
              {/* <CharacterModel0 /> */}
              <CharacterModel1 />
            </group>
            {/* FARMER: FEMALE */}
            <group rotation={[0, 0, 0]} scale={0.016} position={[0, -0.63, 0]}>
              <CharacterModel5 />
            </group>
            {/* FARMER: MALE */}
            {/* <group rotation={[0, 0, 0]} scale={0.016} position={[0, -0.63, 0]}>
              <CharacterModel4 />
            </group> */}
          </Ecctrl>
        </KeyboardControls>     
        
        {/* END: CHARACTER MODEL[S] GROUP */}
        </group>

        {/* // import Map from './Map' */}
        <group rotation={[0, -Math.PI/2, 0]} scale={0.16} position={[0, 2.5, 24]}>
          <Map />
        </group>

        {/* baby steps
            flat-XY on the floor['ground']
            aka: four-by-fours, 4"x4"[s], posts, logs
            rotation={[0, 0, 0]} scale={1.0} position={[0, 1.01, 0]}
        */}
        <group rotation={[0, 0, 0]} scale={1.0} position={[0, 0.00, 0]}>
          <Steps />
        </group>

        {/* toddler steps (advanced degrees)
            flat-XY on the floor['ground']
            aka: four-by-fours, 4"x4"[s], posts, logs
            rotation={[0, 0, 0]} scale={1.0} position={[0, 1.01, 0]}
        */}
        <group rotation={[0, 0, 0]} scale={1.0} position={[8.4, -0.40, 10]}>
          {/* Rough plane */}
          <RoughPlane />
        </group>
        <group rotation={[0, 0, 0]} scale={1.0} position={[0, -0.00, 0]}>
          {/* Slopes and stairs */}
          <Slopes />
        </group>
        <group rotation={[0, 0, 0]} scale={1.0} position={[0, 0.00, 0]}>
          {/* Rigid body objects */}
          <RigidObjects />
        </group>

        {/* kinder steps (active objects)
            flat-XY on the floor['ground']
            aka: four-by-fours, 4"x4"[s], posts, logs
            rotation={[0, 0, 0]} scale={1.0} position={[0, 1.01, 0]}
        */}
        <group rotation={[0, 0, 0]} scale={1.0} position={[0, 100.01, 0]}>
          {/* Floating platform */}
          <FloatingPlatform />
        </group>

        {/* elementary steps (random active objects)
            flat-XY on the floor['ground']
            aka: four-by-fours, 4"x4"[s], posts, logs
            rotation={[0, 0, 0]} scale={1.0} position={[0, 1.01, 0]}
        */}
        <group rotation={[0, 0, 0]} scale={1.0} position={[0, 40.01, 0]}>
          {/* Dynamic platforms */}
          <DynamicPlatforms />
          {/* Shoting cubes */}
          <ShotCube />
        </group>

        {/* solid steps (levels, safety)
            flat-XY on the floor['ground']
            aka: four-by-fours, 4"x4"[s], posts, logs
            rotation={[0, 0, 0]} scale={1.0} position={[0, 1.01, 0]}
        */}
        {/* The Floor (Plane 0) */}
        <group rotation={[0, 0, 0]} scale={1.0} position={[0, 0, 0]}>
          <Floor />
        </group>

        {/* backup solid steps (levels[1+], safety)
            flat-XY on the floor['ground']
            aka: four-by-fours, 4"x4"[s], posts, logs
            rotation={[0, 0, 0]} scale={1.0} position={[0, 1.01, 0]}
        */}
        {/* Sub-Floor[s] (Plane < 0) */}
        {/* <SubFloor level={`${level[index]}`} /> */}
        <group rotation={[0, 0, 0]} scale={1.0} position={[0, -16, 0]}>
          <Floor />
        </group>
        {/* HELPFUL FLOOR/PLANE/GRID (PREVENTS INFINITE FALL):
            SHALLOW BELOW SEA LEVEL -48 (-4rem)
        */}
        <group rotation={[0, 0, 0]} scale={1.0} position={[0, -48, 0]}>
          <Floor />
        </group>
        {/* <Grid
          args={[64, 64]} // x = 4rem, z = 4rem
          sectionColor={'darkgray'}
          cellColor={'black'}
          position={[0, -16, 0]} // sea level : -1rem
          userData={{
            camExcludeCollision: false, // collide by camera ray? true | false
          }}
        /> */}

      </Physics>

      {/* <Perf
        position='bottom-left'
        // minimal
      /> */}
    </>
  )
}
