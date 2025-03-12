// ==============================================================
// ** RESOURCES

import * as THREE from 'three'
// import { TextureLoader } from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
// import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'

// ==============================================================
// ** COMPONENTS

// const loaderTexture = new THREE.TextureLoader()
// const loaderTexture = new TextureLoader()
const loaderFBX = new FBXLoader()
// const loaderGLTF = new GLTFLoader()
// const loaderOBJ = new OBJLoader()

// const clock = new THREE.Clock()

/** POINTER HOVERS + CLICKS */
// const raycaster = new THREE.Raycaster()
// const pointer = new THREE.Vector2()

// ** HELPER Imports
// import { Perf } from 'r3f-perf'
// import Spinner from '#/layout/ui/spinner'
// ** HELPFUL UTIL: COLORFUL CONSOLE MESSAGES (ccm)
import ccm from '#/lib/utils/console-colors'
  
// **
// ** PROPERTIES ****************************************
// **

// ** DEBUG: this module
const debug: boolean = false
const DEBUG: boolean = false
  
// **
// ** ANIMATIONS ****************************************
// **
const animationFiles = [
  'Breathing Idle',
  'Crouch To Stand',
  'Crouching Idle',
  'Crouching',
  'Driving',
  'Entering Car',
  'Exiting Car',
  'Idle', // default action/animation
  'Left Turn',
  'Moonwalk',
  // 'Planting A Plant',
  'Pointing Gesture',
  'Pointing',
  'Push Up',
  'Right Turn',
  'Running',
  'Standing To Crouched',
  'Talking',
  'Turn',
  'Walking Backwards',
  'Walking',
]
// ** ADD-ON ANIMATIONS (SUB-DIRECTORIES)
const animationFilesFarming = [
  'farming/box idle',
  'farming/box idle',
  'farming/box turn (2)',
  'farming/box turn',
  'farming/box walk arc',
  'farming/cow milking',
  'farming/dig and plant seeds',
  'farming/holding idle',
  'farming/holding turn left',
  'farming/holding turn right',
  'farming/holding walk',
  'farming/kneeling idle',
  'farming/pick fruit (2)',
  'farming/pick fruit (3)',
  'farming/pick fruit',
  'farming/plant a plant',
  'farming/plant tree',
  'farming/pull plant (2)',
  'farming/pull plant',
  'farming/watering',
  'farming/wheelbarrow dump',
  'farming/wheelbarrow idle',
  'farming/wheelbarrow walk (2)',
  'farming/wheelbarrow walk turn (2)',
  'farming/wheelbarrow walk turn',
  'farming/wheelbarrow walk',
]
animationFiles.push(...animationFilesFarming)
// export const names = animationFiles

// ** THREED ANIMATIONS [][]
// let animations: Object[] = []
// let name: String = 'Idle'
let animations: any = []
animations[0] = animationFiles
console.debug('MARTY animations: ', animations)

// ** THREED PLAYER
let player = {
  action: 'Idle',
  actionTime: Date.now(),
  animations: new Array(), // animationFiles, animationObjects (FBX)
  mixer: {
    clipAction: new Function(),
    stopAllAction: new Function(),
  },
  // mixer: new THREE.AnimationMixer(new THREE.Object3D()),
}

/**
 * THREED CHARACTER "PLAYER" ACTIONS
 */
export const ThreeDPlayer = {
  // ** 
  player: player,
  mixer: new THREE.AnimationMixer(new THREE.Object3D()),
  move: () => {},
  setAction(name: string = 'Idle') {
    const action = this.player.mixer.clipAction(animations[0]) // [name]
    action.time = 0
    console.log('CHARACTER: action name', name)
    // console.log("CHARACTER: animations[name]", animations[name])
    // console.log("CHARACTER: action object", action)
    this.player.mixer.stopAllAction()
    this.player.action = name
    this.player.actionTime = Date.now()
    console.debug("%c this.player", ccm.yellow, this.player)
    // action.fadeIn(0.5) // causes arms to move awkwardly
    action.play()
  },
  getAction() {
    if (this.player === undefined 
      || this.player.action === undefined) {
      return "doesn't exist yet"
    }
    return this.player.action
  },
  toggleAnimation() {
    if (this.player.action === 'Idle') {
      this.setAction('Pointing Gesture')
    } else {
      this.setAction('Idle')
    }
  },
}
// const player = character
// const player = ThreeDPlayer


export const ThreeDAnimations = () => {

  console.debug('%c animationFiles', ccm.darkred, animationFiles)
  // console.debug("%c animations", ccm.red, animations)

  for (const animationFile of animationFiles) {
    // let animationFileEx = `/public/objects/animations/Idle.fbx`
    const animationFileLoc = `objects/animations/${animationFile}.fbx`
    loaderFBX.load(animationFileLoc, function(object) {
      // console.debug("%c object", ccm.darkred, object)
      animations.push(object.animations[0])
      // if (animationFiles.length > 0){
      //   loadNextAnim(loader)
      // } 
      // else {
      //   animationFiles = []
      //   setAction("Idle")
      //   // animate()
      // }
    })	
  }
	console.debug("%c animations", ccm.red, animations)

  // ==============================================================
  // ANIMATIONS (FOR ALL CHARACTERS)

  // useFrame(({ clock }) => {
  //   const a = clock.getElapsedTime()
  //   // THREEDCHARACTER.ref.current.rotation.x = a
  // })

  // return R3F JSX
  return animations
}

export default ThreeDAnimations