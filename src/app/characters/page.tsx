'use client'

import "./App.css"
import { Canvas } from "@react-three/fiber"
import { Physics, RigidBody } from "@react-three/rapier"
import { KeyboardControls } from "@react-three/drei"
import { Suspense } from "react"
import Ecctrl, { EcctrlAnimation } from "ecctrl"
import CharacterModel from "./components/CharacterModel"
import SceneModel from "./components/Scene"
import { CHARACTER_MODEL_URL } from "./Constants"

export default function CharacterDemoApp() {
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

  /**
   * Keyboard control preset
   */
  const keyboardMap = [
    { name: "forward", keys: ["ArrowUp", "KeyW"] },
    { name: "backward", keys: ["ArrowDown", "KeyS"] },
    { name: "leftward", keys: ["ArrowLeft", "KeyA"] },
    { name: "rightward", keys: ["ArrowRight", "KeyD"] },
    { name: "jump", keys: ["Space"] },
    { name: "run", keys: ["Shift"] },
    { name: "action1", keys: ["1"] },
    { name: "action2", keys: ["2"] },
    { name: "action3", keys: ["3"] },
    { name: "action4", keys: ["KeyF"] },
  ]

  return (
    <div id='root'>
      <Canvas shadows>
        <directionalLight
          intensity={2.5}
          color={"#FFFFFF"}
          castShadow
          shadow-bias={-0.00006}
          position={[-5, 25, -1]}
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-top={30}
          shadow-camera-right={30}
          shadow-camera-bottom={-30}
          shadow-camera-left={-30}
        />
        <hemisphereLight args={[0x8dc1de, 0x00668d, 2.5]} />

        <Suspense fallback={null}>
          <Physics timeStep="vary">
            <KeyboardControls map={keyboardMap}>
              <Ecctrl 
                animated 
                position={[0, 4, 0]}
                // disableFollowCam
              >
                <EcctrlAnimation
                  characterURL={CHARACTER_MODEL_URL}
                  animationSet={animationSet}
                >
                  <CharacterModel />
                </EcctrlAnimation>
              </Ecctrl>
            </KeyboardControls>
            <RigidBody type="fixed" colliders="trimesh" ccd>
              <SceneModel />
            </RigidBody>
          </Physics>
        </Suspense>
      </Canvas>
    </div>
  )
}
