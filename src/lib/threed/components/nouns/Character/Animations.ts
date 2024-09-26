// ==============================================================
// ** RESOURCES

// import * as THREE from 'three'
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

// ** DEBUG
const debug: boolean = true
const debugAnimation: boolean = true
  
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
  'Idle',
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
// const animationFilesFarming = [
//   'farming/box idle',
//   'farming/box idle',
//   'farming/box turn (2)',
//   'farming/box turn',
//   'farming/box walk arc',
//   'farming/cow milking',
//   'farming/dig and plant seeds',
//   'farming/holding idle',
//   'farming/holding turn left',
//   'farming/holding turn right',
//   'farming/holding walk',
//   'farming/kneeling idle',
//   'farming/pick fruit (2)',
//   'farming/pick fruit (3)',
//   'farming/pick fruit',
//   'farming/plant a plant',
//   'farming/plant tree',
//   'farming/pull plant (2)',
//   'farming/pull plant',
//   'farming/watering',
//   'farming/wheelbarrow dump',
//   'farming/wheelbarrow idle',
//   'farming/wheelbarrow walk (2)',
//   'farming/wheelbarrow walk turn (2)',
//   'farming/wheelbarrow walk turn',
//   'farming/wheelbarrow walk',
// ]
// animationFiles.push(...animationFilesFarming)

let animations: Object[] = []
// let name: String = 'Idle'

const player = {
  action: 'Idle',
  actionTime: Date.now(),
  // animations: new Array(),
  mixer: {
    clipAction: new Function(),
    stopAllAction: new Function(),
  }
}

function setAction(name: any = 'Idle') {
  // **
  const action = player.mixer.clipAction( animations[name] )
  action.time = 0
  player.mixer.stopAllAction()
  player.action = name
  player.actionTime = Date.now()
  console.debug("%c player", ccm.yellow, player)
  action.fadeIn(0.5)	
  action.play()
}

const ThreeDAnimations = () => {

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