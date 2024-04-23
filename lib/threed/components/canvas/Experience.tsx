// 'use client'
// ==========================================================
// RESOURCES

// ** APOLLO Imports
import { useReactiveVar } from '@apollo/client'
// import { preferencesDataVar } from '#/lib/threed/components/nouns/Preferences/Preferences'
import { preferencesDataVar } from '#/lib/stores/apollo'

// ** REACT Imports
import React, { useEffect, useState } from 'react'

// ** REACT THREE Imports
import { Grid, KeyboardControls } from '@react-three/drei'
import { Physics } from '@react-three/rapier'

// ** LEVA Imports
import { useControls } from 'leva'

// ** THREED.AI
// ** THREED CHARACTER CONTROL Imports
import Ecctrl from '#/lib/ecctrl/src/Ecctrl'
// import CharacterModel0 from '#/lib/threed/components/nouns/Character/CharacterModelDemon'
// import CharacterModel1 from '#/lib/threed/components/nouns/Character/CharacterModelFloating'
// import CharacterModel2 from '#/lib/threed/components/nouns/Character/FarmerMan'
// import CharacterModel3 from '#/lib/threed/components/nouns/Character/Character'
import CharacterModel4 from '#/lib/threed/components/nouns/Character/FarmerManFloating'
// ** THREED OBJECTS
import Floor from './Floor'
import Lights from './Lights'
import Steps from './Steps'
import Slopes from './Slopes'
import RoughPlane from './RoughPlane'
import RigidObjects from './RigidObjects'
import FloatingPlatform from './FloatingPlatform'
import DynamicPlatforms from './DynamicPlatforms'
import ShotCube from './ShotCube'
import Map from './Map'

// ** HELPER Imports
import { Perf } from 'r3f-perf'
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
  /**
   * Delay physics activate
   */
  const [pausedPhysics, setPausedPhysics] = useState(true)
  useEffect(() => {
    const timeout = setTimeout(() => {
      setPausedPhysics(false)
    }, 500)

    return () => clearTimeout(timeout)
  }, [])

  const prefs = useReactiveVar(preferencesDataVar)
  console.debug(`%c EXPERIENCE: prefs`, ccm.orangeAlert, prefs)

  /**
   * World Preferences
   */
  const [{
    enableWorldDebug,
    enableWorldTesting,
    enableWorldPhysics,
    enableWorldCharacterAnimation,
    disableWorldFollowCam,
  }, setWorldPreferencesLeva] = useControls(
    'World Preferences',
    () => ({
      // enableWorldDebug
      enableWorldDebug: {
        label: 'World Debugger?',
        value: false, // prefs.enableWorldDebug,
      },
      // enableWorldTesting
      enableWorldTesting: {
        label: 'Testing?',
        value: false, // prefs.enableWorldTesting,
      },
      // enableWorldPhysics
      enableWorldPhysics: {
        label: 'Physics Debugger?',
        value: false, // prefs.enableWorldPhysics,
      },
      // enableWorldCharacterAnimation
      enableWorldCharacterAnimation: {
        label: 'Animate Characters?',
        value: false, // prefs.enableWorldCharacterAnimation,
      },
      // worldDisableFollowCam
      disableWorldFollowCam: {
        label: 'Camera Unfollow?',
        value: false, // prefs.worldDisableFollowCam,
      },
    }),
    {
      color: 'darkgreen',
      collapsed: false,
      order: 10,
    },
  )

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
      {/* <Perf
        position='bottom-right'
        // minimal
      /> */}

      {/* <Grid
        args={[480, 480]}
        sectionColor={'darkgray'}
        cellColor={'black'}
        position={[0, 0, 0]}
        userData={{ camExcludeCollision: true }} // this won't collide by camera ray
      /> */}

      <Lights />

      <Physics
        debug={prefs.enableWorldPhysics}
        timeStep='vary'
        paused={pausedPhysics}
      >

        {/* Keyboard preset */}
        {/* <KeyboardControls
          map={keyboardMap}
        > */}
          {/* Character 1 Control */}
          {/* <Ecctrl
            debug={prefs.enableWorldDebug}

            animated={prefs.enableWorldCharacterAnimation}

            followLight={false}

            springK={2}
            dampingC={0.2}

            autoBalanceSpringK={1.2}
            autoBalanceDampingC={0.04}
            autoBalanceSpringOnY={0.7}
            autoBalanceDampingOnY={0.05}

            disableFollowCam={prefs.disableWorldFollowCam}
          > */}

            {/* THREED CHARACTER [0] -- DEMON / CHICKEN */}
            {/* <group rotation={[0, 0, 0]} scale={0.7} position={[-1, 0.1, -1]}>
              <CharacterModel0 />
            </group> */}

            {/* THREED CHARACTER [1] -- FLOATING PHYSICS CAPSULE*/}
            {/* <group rotation={[0, 0, 0]} scale={1.0} position={[0, 0.2, 2]}>
              <CharacterModel1 />
            </group> */}

            {/* THREED CHARACTER [2] -- FARMERS */}
            {/* <group rotation={[0, 0, 0]} scale={0.02} position={[0, 0.0, 0]}> */}
              {/* <CharacterModel2 /> */}
              {/* <CharacterModel4 /> */}
            {/* </group> */}

            {/* THREED CHARACTER [3] -- TESTING */}
            {/* <group rotation={[0, 0, 0]} scale={0.3} position={[0, 0.1, 0]}>
              <CharacterModel3 />
            </group> */}

          {/* </Ecctrl> */}
        {/* </KeyboardControls> */}

        {/* Keyboard preset */}
        {/* { prefs.enableWorldDebug &&
          prefs.enableTesting && ( */}
        <KeyboardControls
          map={keyboardMap}
        >
          {/* Character 2 Control */}
          <Ecctrl
            debug={prefs.enableWorldDebug}

            animated={prefs.enableWorldCharacterAnimation}

            followLight={false}

            disableFollowCam={prefs.disableWorldFollowCam}

            // springK={2}
            // dampingC={0.2}

            // autoBalanceSpringK={1.2}
            // autoBalanceDampingC={0.04}
            // autoBalanceSpringOnY={0.7}
            // autoBalanceDampingOnY={0.05}
          >

            {/* THREED CHARACTER [0] -- DEMON / CHICKEN */}
            {/* <group rotation={[0, 0, 0]} scale={0.7} position={[-1, 0.1, -1]}>
              <CharacterModel0 />
            </group> */}

            {/* THREED CHARACTER [1] -- FLOATING PHYSICS CAPSULE*/}
            {/* <group rotation={[0, 0, 0]} scale={1.0} position={[0, 0.2, 2]}>
              <CharacterModel1 />
            </group> */}

            {/* THREED CHARACTER [2] -- FARMERS */}
            <group rotation={[0, 0, 0]} scale={0.02} position={[0, 0.0, 0]}>
              {/* <CharacterModel2 /> */}
              <CharacterModel4 />
            </group>

            {/* THREED CHARACTER [3] -- TESTING */}
            {/* <group rotation={[0, 0, 0]} scale={0.3} position={[0, 0.1, 0]}>
              <CharacterModel3 />
            </group> */}

          </Ecctrl>
        </KeyboardControls>
        {/* )} // end testing */}

        {/* // import Map from './Map' */}
        <group rotation={[0, -Math.PI/2, 0]} scale={1.0} position={[0, 0, 24]}>
          <Map />
        </group>

        {/* Rough plane */}
        <RoughPlane />

        {/* Slopes and stairs */}
        <Slopes />

        {/* Small steps */}
        <Steps />

        {/* Rigid body objects */}
        <RigidObjects />

        {/* Floating platform */}
        <FloatingPlatform />

        {/* Dynamic platforms */}
        <DynamicPlatforms />

        {/* Floor */}
        <Floor />

        {/* Shoting cubes */}
        <ShotCube />

      </Physics >
    </>
  )
}
