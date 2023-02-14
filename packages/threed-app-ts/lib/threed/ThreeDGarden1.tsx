// @ts-nocheck
/** OR */
/** @ ts-ignore */
/** OR */
/** @ ts-expect-error */

import { useRef, useEffect } from 'react'

import * as THREE from 'three'
// import Stats from 'three/examples/jsm/libs/stats.module'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
// import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
// import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer'
// import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer'
// types
import type { Scene, Plane, Camera, Renderer, Object3D, AnimationMixer } from 'three'

// import { TWEEN } from 'three/examples/jsm/libs/tween.module.min'
import TWEEN from '@tweenjs/tween.js'

// three.js joystick
// import { JoystickControls, RotationJoystickControls } from 'three-joystick'

// dat.gui

// farmbot
// import FarmBot from "#/lib/farmbot/FarmBot"
// console.log("FarmBot", FarmBot)

// ================================================================
// TS
interface IPostData {
  plugin_name: string
  plugin_version: string
  plugin_url: string
  theme_uri: 'light' | 'dark'
  rest_url: string
  world_id: number | string
  scene_id: number | string
}

interface IThreeDEnv {
  pluginName: string
  pluginVersion: string
  pluginURL: string
  themeURI: 'light' | 'dark'
  restURL: string
  worldID: number | string
  sceneID: number | string
}

interface IPlayer {
  action: string
  actionTime: number | Date
  object: Object3D
  mixer: AnimationMixer
  setAction: Function
  getAction: Function
  toggleAnimation: Function
  move: Function
  movePlayer: Function
  playerControl: Function
}

// ================================================================
// VARIABLES
// INSTANTIATE COMMON VARIABLES

const debug: boolean = false
// const debugPhysics: boolean = false

// PARAMETERS FROM SERVER (PHP)
// console.log("window", window)
// console.log(window.postdata)
// const postdata = window?.postdata ? window.postdata : {}
// const appVersion = process.env.npm_package_version
const appVersion: string = require('../../../../../package.json').version
// console.log("appVersion", appVersion)
const postdata: IPostData = {
  plugin_name: 'ThreeD Garden',
  plugin_version: appVersion,
  plugin_url: 'https://garden.university.local/',
  theme_uri: 'dark',
  rest_url: 'https://garden.university.local/wp-json/wp/v2/',
  world_id: 1,
  scene_id: 1,
}

const env: IThreeDEnv = {
  pluginName: postdata.plugin_name,
  pluginVersion: postdata.plugin_version,
  pluginURL: postdata.plugin_url,
  themeURI: postdata.theme_uri,
  restURL: postdata.rest_url,
  worldID: postdata.world_id,
  sceneID: postdata.scene_id,
}

console.debug('pluginName', env.pluginName, env.pluginVersion)
console.debug('postdata', postdata)

// STATS
// const stats = Stats()
// document.body.appendChild(stats.dom)

// // DAT.GUI
// const gui = new dat.GUI({
//   name: "ThreeDGarden Controls",
//   autoPlace: true,
//   closeOnTop: true,
//   width: 180,
//   // closed: true,
//   // useLocalStorage: true,
// })
// gui.domElement.id = "gui"
// gui.close()
// // folders
// const guiFolderAnimation = gui.addFolder("Animation")
// const guiFolderRotation = gui.addFolder("Rotation")
// const guiFolderCameras = gui.addFolder("Camera")
// const guiFolderLights = gui.addFolder("Lights")
// const guiFolderAllotments = gui.addFolder("Allotments")
// const guiFolderBeds = gui.addFolder("Beds")
// const guiFolderPlants = gui.addFolder("Plants")
// // const guiFolderInfospots 	= gui.addFolder("Infospots")
// const guiFolderAnnotations = gui.addFolder("Annotations")
// const guiFolderPlayer = gui.addFolder("Character")

// =====================================================================
// THREE.JS ENVIRONMENT

let scene: Scene
let plane: Plane
let camera: Camera
let controls: any
let renderer: Renderer
let container: any
let canvas: any

const animations = {}
let anims = ['Breathing Idle', 'Driving', 'Idle', 'Left Turn', 'Pointing', 'Pointing Gesture']
anims = [...anims, 'Right Turn', 'Running', 'Talking', 'Turn', 'Walking', 'Walking Backwards']
// let anims2 = ["ascend-stairs", "gather-objects", "look-around", "push-button", "run"]
// let tweens = []

// let cellSize = 16
// let interactive = false
// let levelIndex = 0
// let _hints = 0
// let score = 0
// let cameraFade = 0.05
// let mute = false
// let collect = []

const player: IPlayer = {
  action: 'Idle', // player.action = "Idle"
  actionTime: Date.now(), // player.actionTime = Date.now()
  object: new THREE.Object3D(),
  mixer: new THREE.AnimationMixer(new THREE.Object3D()),
  move: () => {},
  /**
   * PLAYER "CHARACTER" ACTIONS
   */
  setAction(name: string) {
    const action = player.mixer.clipAction(animations[name])
    action.time = 0
    console.log('CHARACTER: action name', name)
    // console.log("CHARACTER: animations[name]", animations[name])
    // console.log("CHARACTER: action object", action)
    player.mixer.stopAllAction()
    player.action = name
    player.actionTime = Date.now()
    // console.log("player", player)
    // action.fadeIn(0.5) // causes arms to move awkwardly
    action.play()
  },
  getAction() {
    if (player === undefined || player.action === undefined) {
      return "doesn't exist yet"
    }
    return player.action
  },
  toggleAnimation() {
    if (player.action === 'Idle') {
      this.setAction('Pointing Gesture')
    } else {
      this.setAction('Idle')
    }
  },
  movePlayer(dt: any) {
    const pos = player.object.position.clone()
    pos.y += 60
    const dir = new THREE.Vector3()
    player.object.getWorldDirection(dir)
    if (player.move.forward < 0) dir.negate()
    let raycaster = new THREE.Raycaster(pos, dir)
    let blocked = false
    const { colliders } = params

    if (colliders !== undefined) {
      const intersect = raycaster.intersectObjects(colliders)
      if (intersect.length > 0) {
        if (intersect[0].distance < 50) blocked = true
      }
    }

    if (!blocked) {
      if (player.move.forward > 0) {
        const speed = player.action === 'Running' ? 24 : 8
        player.object.translateZ(dt * speed)
      } else if (player.move.forward < 0) {
        player.object.translateZ(-dt * 2)
      }
    }

    // COLLIDERS
    if (colliders !== undefined) {
      // cast left
      dir.set(-1, 0, 0)
      dir.applyMatrix4(player.object.matrix)
      dir.normalize()
      raycaster = new THREE.Raycaster(pos, dir)

      let intersect = raycaster.intersectObjects(colliders)
      if (intersect.length > 0) {
        if (intersect[0].distance < 50) player.object.translateX(100 - intersect[0].distance)
      }

      // cast right
      dir.set(1, 0, 0)
      dir.applyMatrix4(player.object.matrix)
      dir.normalize()
      raycaster = new THREE.Raycaster(pos, dir)

      intersect = raycaster.intersectObjects(colliders)
      if (intersect.length > 0) {
        if (intersect[0].distance < 50) player.object.translateX(intersect[0].distance - 100)
      }

      // cast down
      dir.set(0, -1, 0)
      pos.y += 200
      raycaster = new THREE.Raycaster(pos, dir)
      const gravity = 30

      intersect = raycaster.intersectObjects(colliders)
      if (intersect.length > 0) {
        const targetY = pos.y - intersect[0].distance
        if (targetY > player.object.position.y) {
          // Going up
          player.object.position.y = 0.8 * player.object.position.y + 0.2 * targetY
          player.velocityY = 0
        } else if (targetY < player.object.position.y) {
          // Falling
          if (player.velocityY === undefined) player.velocityY = 0
          player.velocityY += dt * gravity
          player.object.position.y -= player.velocityY
          if (player.object.position.y < targetY) {
            player.velocityY = 0
            player.object.position.y = targetY
          }
        }
      } else if (player.object.position.y > 0) {
        if (player.velocityY === undefined) player.velocityY = 0
        player.velocityY += dt * gravity
        player.object.position.y -= player.velocityY
        if (player.object.position.y < 0) {
          player.velocityY = 0
          player.object.position.y = 0
        }
      }
    }
    //

    player.object.rotateY(player.move.turn * dt)
  },

  playerControl(forward, turn) {
    turn = -turn

    if (forward > 0.2) {
      if (player.action !== 'Walking' && player.action !== 'Running') {
        this.setAction('Walking')
      }
    } else if (forward < -0.2) {
      if (player.action !== 'Walking Backwards') {
        this.setAction('Walking Backwards')
      }
    } else {
      forward = 0
      if (Math.abs(turn) > 0.05) {
        if (player.action !== 'Left Turn') {
          this.setAction('Left Turn')
        }
      } else if (player.action !== 'Idle') {
        this.setAction('Idle')
      }
      // else {
      // 	this.setAction("Idle")
      // }
    }

    // if ( forward === 0 && turn === 0 ) {
    //   player.move = {}
    // }
    // else {
    player.move = { forward, turn }
    // }
  },
}

// =====================================================================
// MESSAGES (to client)
const messages = {
  text: ['Welcome to your ThreeD Garden', 'GO GROW!'],
  index: 0,
}

// =====================================================================
// PARAMS (props)

const params = {
  /** SET MODES */
  mode: '',
  modes: Object.freeze({
    NONE: 'none',
    PRELOAD: 'preload',
    INITIALIZING: 'initializing',
    BUILDING: 'building',
    BUILT: 'built',
    LOADING: 'loading',
    LOADED: 'loaded',
    ACTIVE: 'active',
    GAMEOVER: 'game_over',
  }),
  /** turn on/off animation */
  ANIMATE: true, // starting value
  /** where multimedia files are located */
  assetsPath: `${env.pluginURL}assets/`,
  /** all the data from rest api calls to be stored here */
  data: {
    world: [{ id: env.worldID }],
    scene: [{ id: env.sceneID }],
    allotment: [{}],
    bed: [{}],
    plant: [{}],
    planting_plan: [{}],
  },
  /** POINTER HOVERS + CLICKS */
  intersectedObject1: {},
  intersectedObject2: {},
  /** PLAYER COLLISION INTO OBJECTS */
  colliders: [{}], // params.colliders.push(object3D)
  // town.fbx
  environment: {},
  // custom fbx
  farmhouse: {},
}
params.mode = params.modes.NONE
console.log('params.mode', params.mode)
// guiFolderAnimation.add(params, "ANIMATE").name("Run Animation")

params.mode = params.modes.PRELOAD
console.log('params.mode', params.mode)

console.log('params', params)

//
// PARAMS.ASSETS ???
//
// NEED TO LOAD AUDIO ASSET FILES ???
// const sfxExt = SFX.supportsAudioType('mp3') ? 'mp3' : 'ogg'
// console.log("SFX", SFX)
//
// NEED TO LOAD KNOWN ASSET FILES ???
// const blobs = {'fish.gltf': blob1, 'diffuse.png': blob2, 'normal.png': blob3} ???
// const options = {
//   assets: [
//     // `${params.assetsPath}sfx/gliss.${sfxExt}`,
//     // `${params.assetsPath}sfx/factory.${sfxExt}`,
//     // `${params.assetsPath}sfx/button.${sfxExt}`,
//     // `${params.assetsPath}sfx/door.${sfxExt}`,
//     // `${params.assetsPath}sfx/fan.${sfxExt}`,
//     `${params.assetsPath}fbx/environment.fbx`,
//     `${params.assetsPath}fbx/girl-walk.fbx`,
//     `${params.assetsPath}fbx/usb.fbx`,
//   ],
// }
// anims.forEach( function(anim){
//   options.assets.push(`${params.assetsPath}fbx/anims2/${anim}.fbx`)
// })
// console.log("options", options)

/** TIME CLOCK */
const clock = new THREE.Clock()
console.log('clock', clock)

/** POINTER HOVERS + CLICKS */
const raycaster = new THREE.Raycaster()
const raycaster2 = new THREE.Raycaster()
const pointer = new THREE.Vector2()
// create a Ray with origin at the pointer position and direction into the scene (camera direction)
// const vector = new THREE.Vector3( pointer.x, pointer.y, 1 )
// projector.unprojectVector( vector, camera )
// const raycaster2 = new THREE.Raycaster(
// 	event.target.camera.position,
// 	vector.sub( event.target.camera.position ).normalize()
// )

/** REST API URLS */
const API_URL_SCENES = `${env.restURL}scene/?_embed&per_page=100`
const API_URL_ALLOTMENTS = `${env.restURL}allotment/?_embed&per_page=100`
const API_URL_BEDS = `${env.restURL}bed/?_embed&per_page=100`
const API_URL_PLANTING_PLANS = `${env.restURL}planting_plan/?_embed&per_page=100`
const API_URL_PLANTS = `${env.restURL}plant/?_embed&per_page=100`

const API_URLS = [API_URL_SCENES, API_URL_ALLOTMENTS, API_URL_BEDS, API_URL_PLANTING_PLANS, API_URL_PLANTS]

// ================================================================
// LOGIC BEGINS HERE

// three.js
// LOADING MANAGER
// :) APP EXECUTION BEGINS HERE <3

THREE.DefaultLoadingManager.onStart = function (url, itemsLoaded, itemsTotal) {
  console.log('Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.')
}

THREE.DefaultLoadingManager.onLoad = function () {
  console.log('Loading Complete!')

  const startTime = new Date().toISOString()
  console.log('manager.onLoad', startTime)

  if (params.mode === params.modes.LOADING) {
    params.mode = params.modes.LOADED
    console.log('params.mode manager.onLoad', params.mode, startTime)
    player.setAction('Idle')
    animate()
    console.log('animating ****************************** ')
    params.mode = params.modes.ACTIVE
    console.log('params.mode manager.onLoad', params.mode, new Date().toISOString())
  } else {
    console.log('still building ************************* ')
    console.log('params.mode manager.onLoad', params.mode, startTime)
  }
}

THREE.DefaultLoadingManager.onProgress = function (url, itemsLoaded, itemsTotal) {
  console.log('Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.')
}

THREE.DefaultLoadingManager.onError = function (url) {
  console.log('There was an error loading ' + url)
}

// const [manager, setManager] = useState(new THREE.LoadingManager())
const bootManager = () => {
  const manager = new THREE.LoadingManager()

  // const wtfayd = toJSON(manager)
  // console.log("HEY HEY HEY wtfayd", wtfayd)

  manager.onStart = (url, itemsLoaded, itemsTotal) => {
    console.log(`Started loading file: ${url}.\nLoaded ${itemsLoaded} of ${itemsTotal} files.`)
  }

  manager.onProgress = (url, itemsLoaded, itemsTotal) => {
    // console.log(`Loading file: ${url}.\nLoaded ${itemsLoaded} of ${itemsTotal} files.`)
  }

  manager.onError = (url) => {
    console.error(`There was an error loading ${url}`)
  }

  manager.onLoad = () => {
    const startTime = new Date().toISOString()
    console.log('manager.onLoad', startTime)
    // console.log('starting timer...')
    // const millis = Date.now() - startTime
    // console.log(`milliseconds elapsed = ${Math.floor(millis)}`)
    // console.log(`seconds elapsed = ${Math.floor(millis / 1000)}`)

    if (params.mode === params.modes.LOADING) {
      params.mode = params.modes.LOADED
      console.log('params.mode manager.onLoad', params.mode, startTime)
      player.setAction('Idle')
      animate()
      console.log('animating ****************************** ')
      params.mode = params.modes.ACTIVE
      console.log('params.mode manager.onLoad', params.mode, new Date().toISOString())
    } else {
      console.log('still building ************************* ')
      console.log('params.mode manager.onLoad', params.mode, startTime)
    }
  }
  // }

  // const wtfayd2 = toJSON(manager)
  // console.log("HEY HEY HEY wtfayd2", wtfayd2)

  const loaders = {
    loaderFBX: new FBXLoader(manager),
    loaderGLTF: new GLTFLoader(manager),
    loaderOBJ: new OBJLoader(manager),
    loaderTexture: new THREE.TextureLoader(manager),
  }

  return <div>BEGIN BOOT PROCESS</div>
}

// ==================================================================
// LOADERS

// ==================================================================
// FUNCTIONS

// render scene + camera
const render = () => {
  renderer.render(scene, camera)
}

// watch for window resize, then adjust canvas appropriately
const onWindowResize = () => {
  console.log('window resize to: ', window.innerWidth, window.innerHeight)
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  // controls.handleResize() or something similar to update controls
  render()
}
// (now using vueuse useEventListener) ...
// watch for window resize, then adjust canvas appropriately
// window.addEventListener( 'resize', onWindowResize, false )

const getPlane = (x, y, color1) => {
  const geometry = new THREE.PlaneGeometry(x, y)
  const material = new THREE.MeshStandardMaterial({
    color: color1,
    side: THREE.DoubleSide,
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.receiveShadow = true
  return mesh
}

const getPointLight = (color, intensity) => {
  let light = new THREE.PointLight(color, intensity)
  light.castShadow = true
  light.shadow.bias = 0.001
  light.shadow.mapSize.width = 4096 //default = 1024
  light.shadow.mapSize.height = 4096 //default = 1024
  return light
}

const getSpotLight = (color, intensity) => {
  let light = new THREE.SpotLight(color, intensity)
  light.castShadow = true
  light.shadow.bias = 0.001
  light.shadow.mapSize.width = 2048 //default = 1024
  light.shadow.mapSize.height = 2048 //default = 1024
  return light
}

const getDirectionalLight = (color, intensity) => {
  let light = new THREE.DirectionalLight(color, intensity)
  light.castShadow = true
  light.shadow.bias = 0.0001
  light.shadow.mapSize.width = 4096 //default = 512
  light.shadow.mapSize.height = 4096 //default = 512
  light.shadow.camera.left = -1000 //default = -5
  light.shadow.camera.bottom = -1000 //default = -5
  light.shadow.camera.right = 1000 //default = 5
  light.shadow.camera.top = 1000 //default = 5
  light.shadow.camera.near = 0.5 // default
  light.shadow.camera.far = 500 // default
  return light
}

const getAmbientLight = (color, intensity) => {
  let light = new THREE.AmbientLight(color, intensity)
  return light
}

const getGeometry = (shape, x, y, z, color) => {
  let geometry
  let material
  let mesh
  switch (shape) {
    case 'Box':
      geometry = new THREE.BoxGeometry(x, y, z)
      // let opacMaterial = new THREE.MeshStandardMaterial({
      // 	transparent: true,
      // 	opacity: 0.0,
      // 	alphaTest: 1.0,
      // 	color: color,
      // 	side: THREE.DoubleSide,
      // 	depthWrite: false
      // })
      material = new THREE.MeshStandardMaterial({
        transparent: true,
        opacity: 0.8,
        color: color,
        side: THREE.DoubleSide,
        depthWrite: true,
      })
      mesh = new THREE.Mesh(geometry, [material, material, material, material])
      mesh.castShadow = true
      break

    case 'Cone':
      geometry = new THREE.ConeGeometry(x / 2, y / 2, z, 32, 1, true)
      material = new THREE.MeshStandardMaterial({
        color: color,
        side: THREE.DoubleSide,
      })
      mesh = new THREE.Mesh(geometry, material)
      mesh.castShadow = true
      mesh.rotation.x = Math.PI / 2 // 90 degrees in radians
      break

    case 'Cylinder':
      geometry = new THREE.CylinderGeometry(x / 2, y / 2, z, 32, 1, true)
      material = new THREE.MeshStandardMaterial({
        color: color,
        side: THREE.DoubleSide,
      })
      mesh = new THREE.Mesh(geometry, material)
      mesh.castShadow = true
      mesh.rotation.x = Math.PI / 2 // 90 degrees in radians
      break

    case 'InfoSphere':
      geometry = new THREE.SphereGeometry(x, y, z)
      material = new THREE.MeshStandardMaterial({
        color: color,
        side: THREE.DoubleSide,
      })
      mesh = new THREE.Mesh(geometry, material)
      mesh.castShadow = true
      //mesh.rotation.x = Math.PI / 2 // 90 degrees in radians
      break

    case 'Sphere':
      geometry = new THREE.SphereGeometry(x, y, z)
      material = new THREE.MeshStandardMaterial({
        color: color,
        side: THREE.DoubleSide,
      })
      mesh = new THREE.Mesh(geometry, material)
      mesh.castShadow = true
      //mesh.rotation.x = Math.PI / 2 // 90 degrees in radians
      break

    // case "Tree":
    // 	let tree = new THREE.Tree({
    // 		generations : 3,        // # for branch hierarchy
    // 		length      : 1.0,      // length of root branch
    // 		uvLength    : 3.0,      // uv.v ratio against geometry length (recommended is generations * length)
    // 		radius      : 0.1,      // radius of root branch
    // 		radiusSegments : 8,     // # of radius segments for each branch geometry
    // 		heightSegments : 8      // # of height segments for each branch geometry
    // 	})
    // 	geometry = THREE.TreeGeometry.build(tree)
    // 	//geometry = new THREE.SphereGeometry(x, y, z)
    // 	material = new THREE.MeshStandardMaterial({
    // 		color: color,
    // 		side: THREE.DoubleSide
    // 	})
    // 	mesh = new THREE.Mesh(geometry, material)
    // 	mesh.castShadow = true
    // 	//mesh.rotation.x = Math.PI / 2 // 90 degrees in radians
    // 	break

    case 'Bush':
      // [MM]

      // CAST
      geometry = new THREE.BoxGeometry(x, y, z)

      //color = new THREE.Color(0xff0000)
      color = new THREE.Color('rgb(153,90,0)')

      // material = new THREE.MeshPhongMaterial({ color: color, wireframe: false })
      // material = new THREE.MeshStandardMaterial({
      // 	transparent: true,
      // 	opacity: 0.8,
      // 	color: color,
      // 	side: THREE.DoubleSide,
      // 	depthWrite: true
      // })

      //mesh = new THREE.Mesh(geometry, material)
      // mesh = new THREE.Mesh(
      // 	geometry,
      // 	[
      // 		material, material,
      // 		material, material
      // 	]
      // )

      // mesh.castShadow = true

      // [MM]
      //plane.add(mesh)

      // mesh.matrix.makeTranslation(0,-125,0)
      // mesh.matrixAutoUpdate = false

      var levels = 4 // slow? lower this
      var edge_w = 100
      var edge_h = 150

      function bush(n, mat, c) {
        if (n > 0) {
          var new_mat = new THREE.Matrix4()
          var new_mat2 = new THREE.Matrix4()
          var new_mat_t0 = new THREE.Matrix4()
          var new_mat_t = new THREE.Matrix4()
          var new_mat_r = new THREE.Matrix4()
          var new_mat_r2 = new THREE.Matrix4()
          var new_mat_s = new THREE.Matrix4()
          var mat2 = mat.clone()
          var col1 = c.clone()
          var col2 = c.clone()
          //col1.offsetHSL(0.12,0,0)
          col1.g += 0.64 / levels
          material = new THREE.MeshPhongMaterial({ color: col1, wireframe: false })
          mesh = new THREE.Mesh(geometry, material)
          new_mat_t0.makeTranslation(edge_w / 2, 0, 0)
          new_mat_t.makeTranslation(0, edge_h, 0)
          new_mat_r.makeRotationZ(-Math.PI / 4)
          new_mat_r2.makeRotationY(Math.PI / 2)
          new_mat_s.makeScale(0.75, 0.75, 0.75)
          new_mat.multiply(new_mat_r2) //
          new_mat.multiply(new_mat_t0)
          new_mat.multiply(new_mat_r)
          new_mat.multiply(new_mat_s)
          new_mat.multiply(new_mat_t)
          new_mat.multiply(mat)
          mesh.matrix.copy(new_mat)
          mesh.matrixAutoUpdate = false
          mesh.updateMatrix = false //
          plane.add(mesh)
          bush(n - 1, mesh.matrix.clone(), col1)

          //col2.offsetHSL(0.12,0,0)
          col2.g += 0.64 / levels
          material = new THREE.MeshPhongMaterial({ color: col2, wireframe: false })
          mesh = new THREE.Mesh(geometry, material)
          new_mat_t0.makeTranslation(-edge_w / 2, 0, 0)
          new_mat_t.makeTranslation(0, edge_h, 0)
          new_mat_r.makeRotationZ(Math.PI / 4)
          new_mat_r2.makeRotationY(Math.PI / 2)
          new_mat_s.makeScale(0.75, 0.75, 0.75)
          new_mat2.multiply(new_mat_r2)
          new_mat2.multiply(new_mat_t0)
          new_mat2.multiply(new_mat_r)
          new_mat2.multiply(new_mat_s)
          new_mat2.multiply(new_mat_t)
          new_mat2.multiply(mat)
          mesh.matrix.copy(new_mat2)
          mesh.matrixAutoUpdate = false
          mesh.updateMatrix = false //
          plane.add(mesh)
          bush(n - 1, mesh.matrix.clone(), col2)
        }
      }

    // [MM]
    //bush(levels, mesh.matrix, color)

    default:
      geometry = new THREE.BoxGeometry(x, y, z)
      material = new THREE.MeshStandardMaterial({
        color: color,
        side: THREE.DoubleSide,
      })
      mesh = new THREE.Mesh(geometry, material)
      mesh.castShadow = true
      break
  }

  return mesh
}

// LOADERS
function loadTown() {
  loaders.loaderFBX.load(`${params.assetsPath}fbx/town.fbx`, function (object) {
    params.environment = object
    params.colliders = []
    object.scale.set(0.025, 0.025, 0.025)
    plane.add(object)
    object.traverse(function (child) {
      if (child.isMesh) {
        if (child.name.startsWith('proxy')) {
          params.colliders.push(child)
          child.material.visible = false
        } else {
          child.castShadow = true
          child.receiveShadow = true
        }
      }
    })

    loadNextAnim(loader)
  })
}

function loadFarmHouse() {
  // loaders.loaderFBX.load(`${params.assetsPath}fbx/SM_Bld_Farmhouse_01.fbx`, function(object){
  loaders.loaderFBX.load(`${params.assetsPath}fbx/Building_Farm_House_02.fbx`, function (object) {
    // loaders.loaderFBX.load(`${params.assetsPath}fbx/Building_Barn_Big_03.fbx`, function(object){
    params.farmhouse = object
    params.colliders = []
    object.rotation.y = 270 * (Math.PI / 180) // 90 degrees in radians
    object.rotation.z = 270 * (Math.PI / 180) // 90 degrees in radians
    object.position.set(0, -100, 0)
    // object.scale.set(0.025, 0.025, 0.025)
    object.scale.set(2.2, 2.2, 2.2)
    plane.add(object)
    object.traverse(function (child) {
      if (child.isMesh) {
        if (child.name.startsWith('proxy')) {
          params.colliders.push(child)
          child.material.visible = false
        } else {
          child.castShadow = true
          child.receiveShadow = true
        }
      }
    })
    // loaderTexture.load(`${params.assetsPath}textures/PolygonFarm_Texture_01_A.png`, function(texture) {
    loaderTexture.load(`${params.assetsPath}textures/SimpleFarm.png`, function (texture) {
      object.traverse(function (child) {
        if (child.isMesh) {
          child.material.map = texture
        }
      })
    })

    //loadNextAnim(loader)
  })
}

function loadFarmHouseGLTF() {
  // loaders.loaderFBX.load( `${params.assetsPath}fbx/Building_Farm_House_02.fbx`, function (object) {
  loaders.loaderGLTF.load(`${params.assetsPath}gltf/Residential House.glb`, function (object) {
    let model = object.scene
    model.name = 'Farm House'
    model.position.set(0, 0, 100)
    model.scale.set(20, 20, 20)
    model.traverse(function (child) {
      if (child.isMesh) child.castShadow = true
    })
    plane.add(model)

    helper = new THREE.SkeletonHelper(model)
    helper.material.linewidth = 5
    helper.visible = true
    plane.add(helper)

    console.log('loadFarmHouseGLTF object', object)
    console.log('loadFarmHouseGLTF model', model)

    guiFolderPlayer.add(model, 'visible').name('Show House').listen()
  })
}

function loadCoop() {
  loaders.loaderFBX.load(`${params.assetsPath}fbx/Prop_Chicken_Coop_02.fbx`, function (object) {
    params.farmhouse = object
    params.colliders = []
    object.rotation.x = 180 * (Math.PI / 180) // 90 degrees in radians
    object.rotation.y = 90 * (Math.PI / 180) // 90 degrees in radians
    object.rotation.z = 270 * (Math.PI / 180) // 90 degrees in radians
    object.position.set(80, 0, 0)
    object.scale.set(2.2, 2.2, 2.2)
    plane.add(object)
    object.traverse(function (child) {
      if (child.isMesh) {
        if (child.name.startsWith('proxy')) {
          params.colliders.push(child)
          child.material.visible = false
        } else {
          child.castShadow = true
          child.receiveShadow = true
        }
      }
    })
    loaderTexture.load(`${params.assetsPath}textures/SimpleFarm.png`, function (texture) {
      object.traverse(function (child) {
        if (child.isMesh) {
          child.material.map = texture
        }
      })
    })
  })
}

function loadChicken() {
  loaders.loaderGLTF.load(`${params.assetsPath}gltf/Chicken.glb`, function (object) {
    let model = object.scene
    model.name = 'Chicken GLB'
    model.position.set(-3, 0, 0)
    model.rotation.x = 90 * (Math.PI / 180) // 90 degrees in radians
    model.scale.set(4, 4, 4)
    model.traverse(function (child) {
      if (child.isMesh) child.castShadow = true
    })
    plane.add(model)

    // helper = new THREE.SkeletonHelper(model)
    // helper.material.linewidth = 5
    // helper.visible = true
    // plane.add(helper)

    console.log('loadChicken object', object)
    console.log('loadChicken model', model)

    //guiFolderPlayer.add(model, "visible").name("Show Chicken").listen()
  })
}

function loadChicken0() {
  loaders.loaderFBX.load(`${params.assetsPath}fbx/Chicken.fbx`, function (object) {
    console.log('BIRD----------------')
    console.log(object)

    //params.farmhouse = object
    //params.colliders = []
    //object.rotation.y = 90 * (Math.PI/180) // 90 degrees in radians
    object.position.set(0, 0, 0)
    //object.scale.set(2.2, 2.2, 2.2)
    plane.add(object)
    object.traverse(function (child) {
      if (child.isMesh) {
        // if (child.name.startsWith("proxy")){
        // 	params.colliders.push(child)
        // 	child.material.visible = false
        // }else{
        child.castShadow = true
        child.receiveShadow = true
        //}
      }
    })
    // loaderTexture.load(`${params.assetsPath}textures/SimpleAnimalsFarm.png`, function(texture) {
    // 	object.traverse( function ( child ) {
    // 		if ( child.isMesh ){
    // 			child.material.map = texture
    // 		}
    // 	} )
    // })
  })
}

function loadChicken1() {
  loaders.loaderFBX.load(`${params.assetsPath}fbx/SA_Animal_Birds.fbx`, function (object) {
    console.log('BIRD----------------')
    console.log(object)

    //params.farmhouse = object
    //params.colliders = []
    //object.rotation.y = 90 * (Math.PI/180) // 90 degrees in radians
    object.position.set(0, 0, 0)
    //object.scale.set(2.2, 2.2, 2.2)
    plane.add(object)
    object.traverse(function (child) {
      if (child.isMesh) {
        // if (child.name.startsWith("proxy")){
        // 	params.colliders.push(child)
        // 	child.material.visible = false
        // }else{
        child.castShadow = true
        child.receiveShadow = true
        //}
      }
    })
    loaderTexture.load(`${params.assetsPath}textures/SimpleAnimalsFarm.png`, function (texture) {
      object.traverse(function (child) {
        if (child.isMesh) {
          child.material.map = texture
        }
      })
    })
  })
}

function loadChicken2() {
  loaders.loaderFBX.load(`${params.assetsPath}fbx/SA_Animal_Pig.fbx`, function (object) {
    // loaders.loaderFBX.load( `${params.assetsPath}fbx/people/Trucker.fbx`, function (object) {
    // loaders.loaderFBX.load( `${params.assetsPath}characters/SK_Chr_Farmer_Male_01.fbx`, function (object) {

    console.log('object----------------')
    console.log(object)

    // object.mixer = new THREE.AnimationMixer( object )
    // mixers.push( object.mixer )
    // var action = object.mixer.clipAction( object.animations[ 0 ] )
    // action.play()
    // plane.add( object )

    /*
        object.mixer = new THREE.AnimationMixer( object )
        mixers.push( object.mixer )
        var action = object.mixer.clipAction( object.animations[ 0 ] )
        action.play()

        object.name = "Chicken"

        object.traverse( function ( child ) {
          if ( child.isMesh ) {
            child.castShadow = true
            child.receiveShadow = false
          }
        } )


        loaderTexture.load(`${params.assetsPath}textures/SimpleAnimalsFarm.png`, function(texture) {
        //loaderTexture.load(`${params.assetsPath}images/SimpleScarecrow.png`, function(texture) {
        //loaderTexture.load(`${params.assetsPath}images/SimpleFarmer_Farmer_Brown.png`, function(texture) {
        //loaderTexture.load(`${params.assetsPath}textures/PolygonFarm_Texture_01_A.png`, function(texture) {
          object.traverse( function ( child ) {
            if ( child.isMesh ){
              child.material.map = texture
            }
          } )
        })

        plane.add( object )

        console.log("-----------------------")
        console.log("object----------------")
        console.log(object)
        console.log("-----------------------")
    */
    /*
    player.mixer = object.mixer
    player.root = object.mixer.getRoot()

    object.name = "Chicken"

    object.traverse( function ( child ) {
      if ( child.isMesh ) {
        child.castShadow = true
        child.receiveShadow = false
      }
    } )


    loaderTexture.load(`${params.assetsPath}textures/SimpleAnimalsFarm.png`, function(texture) {
    //loaderTexture.load(`${params.assetsPath}images/SimpleScarecrow.png`, function(texture) {
    //loaderTexture.load(`${params.assetsPath}images/SimpleFarmer_Farmer_Brown.png`, function(texture) {
    //loaderTexture.load(`${params.assetsPath}textures/PolygonFarm_Texture_01_A.png`, function(texture) {
      object.traverse( function ( child ) {
        if ( child.isMesh ){
          child.material.map = texture
        }
      } )
    })

    console.log("-----------------------")
    console.log("object----------------")
    console.log(object)
    console.log("-----------------------")

    player.object = new THREE.Object3D()
    player.object.add(object)
    player.object.scale.set(0.022, 0.022, 0.022)
    player.object.rotation.x = Math.PI/2 // 90 degrees in radians
    player.mixer.clipAction(object.animations[0]).play()
    animations.Idle = object.animations[0]
    //setAction("Idle")
    plane.add(player.object)
    guiFolderPlayer.add(player.object, "visible").name("Show Chicken").listen()

    console.log("-----------------------")
    console.log("player.object----------------")
    console.log(player.object)
    console.log("-----------------------")

    */
  })
}

// NOT USED or TESTED
function loadChickenGLTF() {
  loaders.loaderGLTF.load(`${params.assetsPath}gltf/Animals.glb`, function (object) {
    console.log('Animals object----------------')
    console.log(object)

    object.mixer = new THREE.AnimationMixer(object.scene)
    player.mixer = object.mixer
    player.root = object.mixer.getRoot()

    object.name = 'Chicken Dance'

    object.scene.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = false
      }
    })

    player.object = new THREE.Object3D()
    player.object.add(object.scene)
    player.object.position.set(0, 0, 10)
    player.object.scale.set(4, 4, 4)
    player.object.rotation.x = Math.PI / 2 // 90 degrees in radians
    player.mixer.timeScale = 0.5
    player.mixer.clipAction(object.animations[2]).play()

    //animations.Idle = object.animations[0]
    //setAction("Idle")
    plane.add(player.object)
    //guiFolderPlayer.add(player.object, "visible").name("Show Character").listen()
  })
}
//

// NOT USED or TESTED
function loadChickGLTF() {
  loaders.loaderGLTF.load(`${params.assetsPath}gltf/Chick.glb`, function (object) {
    let model = object.scene
    model.name = 'Chick GLB'
    model.position.set(3, 0, 0)
    //model.rotation.y = 90 * (Math.PI/180) // 90 degrees in radians
    model.scale.set(2, 2, 2)
    model.traverse(function (child) {
      if (child.isMesh) child.castShadow = true
    })
    plane.add(model)

    // helper = new THREE.SkeletonHelper(model)
    // helper.material.linewidth = 5
    // helper.visible = true
    // plane.add(helper)

    console.log('loadChickGLTF object')
    console.log(object)
    console.log('loadChickGLTF model')
    console.log(model)

    //guiFolderPlayer.add(model, "visible").name("Show Chicken").listen()
  })
}
//

// NOT USED or TESTED
function loadHen() {
  loaders.loaderFBX.load(`${params.assetsPath}Hen&Chicken_FBX/Hen_HP.fbx`, function (object) {
    params.farmhouse = object
    params.colliders = []
    //object.rotation.y = 270 * (Math.PI/180) // 90 degrees in radians
    object.position.set(3, 0, 0)
    object.scale.set(0.05, 0.05, 0.05)

    object.traverse(function (child) {
      if (child.isMesh) {
        if (child.name.startsWith('proxy')) {
          params.colliders.push(child)
          child.material.visible = false
        } else {
          child.castShadow = true
          child.receiveShadow = true
        }
      }
    })

    loaderTexture.load(`${params.assetsPath}Hen&Chicken_FBX/Textures/Hen&Chicken_A.png`, function (texture) {
      object.traverse(function (child) {
        if (child.isMesh) {
          child.material.map = texture

          console.log('loadHen child----------')
          console.log(child)
          console.log(child.geometry.attributes.uv)
          console.log('-----------------------')
        }
      })
    })

    console.log('loadHen object----------------')
    console.log(object)

    plane.add(object)
  })
}

function loadHenGLTF() {
  // loaders.loaderFBX.load( `${params.assetsPath}fbx/Building_Farm_House_02.fbx`, function (object) {
  loaders.loaderGLTF.load(`${params.assetsPath}gltf/Hen_HP.glb`, function (object) {
    let model = object.scene
    //model.name = "Hen"
    //model.position.set(10, 0, 0)
    //model.scale.set(0.2, 0.2, 0.2)
    model.traverse(function (child) {
      if (child.isMesh) child.castShadow = true
    })
    plane.add(model)

    // helper = new THREE.SkeletonHelper(model)
    // helper.material.linewidth = 5
    // helper.visible = true
    // plane.add(helper)

    console.log('loadHenGLTF object----------------')
    console.log(object)
    console.log('loadHenGLTF model----------------')
    console.log(model)

    //guiFolderPlayer.add(model, "visible").name("Show Hen GLTF").listen()
  })
}

function loadKitchenSink() {
  loaders.loaderFBX.load(`${params.assetsPath}fbx/Prop_KitchenSink_Black.fbx`, function (object) {
    params.farmhouse = object
    params.colliders = []
    object.rotation.y = 270 * (Math.PI / 180) // 90 degrees in radians
    object.position.set(0, 0, 10)
    //object.scale.set(0.025, 0.025, 0.025)
    object.scale.set(2.2, 2.2, 2.2)
    plane.add(object)
    object.traverse(function (child) {
      if (child.isMesh) {
        if (child.name.startsWith('proxy')) {
          params.colliders.push(child)
          child.material.visible = false
        } else {
          child.castShadow = true
          child.receiveShadow = true
        }
      }
    })
    //loaderTexture.load(`${params.assetsPath}textures/PolygonFarm_Texture_01_A.png`, function(texture) {
    loaderTexture.load(`${params.assetsPath}textures/SimpleInteriorsHouses.png`, function (texture) {
      object.traverse(function (child) {
        if (child.isMesh) {
          child.material.map = texture
        }
      })
    })
  })
}

function loadChickenFree() {
  loaders.loaderOBJ.load(`${params.assetsPath}obj/chicken_01.obj`, function (object) {
    // params.farmhouse = object
    // params.colliders = []
    //object.rotation.y = 270 * (Math.PI/180) // 90 degrees in radians
    //object.position.set(0, 0, 10)
    //object.scale.set(0.025, 0.025, 0.025)
    //object.scale.set(2.2, 2.2, 2.2)
    plane.add(object)
    // object.traverse( function ( child ) {
    // 	if ( child.isMesh ) {
    // 		if (child.name.startsWith("proxy")){
    // 			params.colliders.push(child)
    // 			child.material.visible = false
    // 		}else{
    // 			child.castShadow = true
    // 			child.receiveShadow = true
    // 		}
    // 	}
    // } )
    // //loaderTexture.load(`${params.assetsPath}textures/PolygonFarm_Texture_01_A.png`, function(texture) {
    // loaderTexture.load(`${params.assetsPath}textures/SimpleInteriorsHouses.png`, function(texture) {
    // 	object.traverse( function ( child ) {
    // 		if ( child.isMesh ){
    // 			child.material.map = texture
    // 		}
    // 	} )
    // })
  })
}

function loadRooster() {
  loaders.loaderFBX.load(`${params.assetsPath}fbx/rooster_1.0.1.fbx`, function (object) {
    // params.farmhouse = object
    // params.colliders = []
    //object.rotation.y = 270 * (Math.PI/180) // 90 degrees in radians
    object.position.set(0, 0, 10)
    object.scale.set(0.025, 0.025, 0.025)
    //object.scale.set(2.2, 2.2, 2.2)
    plane.add(object)
    // object.traverse( function ( child ) {
    // 	if ( child.isMesh ) {
    // 		if (child.name.startsWith("proxy")){
    // 			params.colliders.push(child)
    // 			child.material.visible = false
    // 		}else{
    // 			child.castShadow = true
    // 			child.receiveShadow = true
    // 		}
    // 	}
    // } )
    // //loaderTexture.load(`${params.assetsPath}textures/PolygonFarm_Texture_01_A.png`, function(texture) {
    // loaderTexture.load(`${params.assetsPath}textures/SimpleInteriorsHouses.png`, function(texture) {
    // 	object.traverse( function ( child ) {
    // 		if ( child.isMesh ){
    // 			child.material.map = texture
    // 		}
    // 	} )
    // })
  })
}

// LOAD ROAD
function loadRoad() {
  let i
  let count = 8
  let startX = -45
  let offsetX = 0
  let startZ = -138
  let offsetZ = 20

  const roadPromise1 = new Promise((resolve, reject) => {
    // ROAD A
    for (i = 1; i <= count; i++) {
      loaders.loaderFBX.load(`${params.assetsPath}fbx/SM_Env_Road_Gravel_Straight_01.fbx`, function (object) {
        // console.log("ROAD object", object)

        //params.farmhouse = object
        //params.colliders = []
        object.rotation.x = 90 * (Math.PI / 180) // 90 degrees in radians
        object.position.set(startX, startZ, 0)
        startX = startX + offsetX
        startZ = startZ + offsetZ
        console.log('ROAD A startX, startZ', startX, startZ)
        object.scale.set(0.02, 0.01, 0.02)
        object.traverse(function (child) {
          if (child.isMesh) {
            // if (child.name.startsWith("proxy")) {
            // 	params.colliders.push(child)
            // 	child.material.visible = false
            // } else {
            child.castShadow = true
            child.receiveShadow = true
            // }
          }
        })
        loaderTexture.load(`${params.assetsPath}textures/PolygonFarm_Texture_03_A.png`, function (texture) {
          object.traverse(function (child) {
            if (child.isMesh) {
              //child.material.color.setHex(0x000000)
              child.material.transparent = true
              child.material.opacity = 0.7
              //child.material.depthWrite = true
              child.material.map = texture
            }
          })
        })

        plane.add(object)

        //console.log("ROAD A object", object)
      })
    }
    resolve(startX, startZ)
  })
  roadPromise1.then((startX, startZ) => {
    // ROAD T
    for (i = 1; i <= 1; i++) {
      loaders.loaderFBX.load(`${params.assetsPath}fbx/SM_Env_Road_Gravel_T_Section_01.fbx`, function (object) {
        console.log('ROAD T startX, startZ', startX, startZ)

        //params.farmhouse = object
        //params.colliders = []
        //object.rotation.y = 90 * (Math.PI/180) // 90 degrees in radians
        object.position.set(startX, 0, startZ)
        startX = startX + offsetX
        startZ = startZ + offsetZ
        console.log('ROAD T startX, startZ', startX, startZ)
        object.scale.set(0.02, 0.01, 0.02)
        object.traverse(function (child) {
          if (child.isMesh) {
            // if (child.name.startsWith("proxy")) {
            // 	params.colliders.push(child)
            // 	child.material.visible = false
            // } else {
            child.castShadow = true
            child.receiveShadow = true
            // }
          }
        })
        loaderTexture.load(`${params.assetsPath}textures/PolygonFarm_Texture_03_A.png`, function (texture) {
          object.traverse(function (child) {
            if (child.isMesh) {
              //child.material.color.setHex(0x000000)
              child.material.transparent = true
              child.material.opacity = 0.7
              //child.material.depthWrite = true
              child.material.map = texture
            }
          })
        })

        plane.add(object)

        //console.log("ROAD T object", object)
      })
    }
  })
}

/**
 * POINTER HOVERS + CLICKS
 */

// when the pointer moves and hovers
function watchPointer(camera: Camera, targetList) {
  //console.log("targetList", targetList)

  // update the picking ray with the camera and pointer position
  raycaster.setFromCamera(pointer, camera)
  //raycaster.set( camera.getWorldPosition(), camera.getWorldDirection() )

  //let helper2 = new THREE.CameraHelper(directionalLight.shadow.camera)

  // calculate objects intersecting the picking ray
  //const intersects = raycaster.intersectObjects(targetList, true)
  let intersects = []
  try {
    intersects = raycaster.intersectObjects(targetList, true)
  } catch (e) {
    intersects = []
  }

  // if there is one (or more) intersections
  if (intersects.length > 0) {
    // console.log("INTERSECTS", intersects)
    // return

    // do something to object intersected? (testing purposes only)
    // for (let i = 0;i < intersects.length;i++) {
    // 	// hightlight object
    // 	for (let j = 0;j < intersects[i].object.material.length;j++) {
    // 		intersects[i].object.material[j].color.setHex( 0xff0000 )
    // 	}
    // }

    // if the closest object intersected is not the currently stored intersection object
    if (intersects[0].object !== params.intersectedObject1) {
      // restore previous intersection object (if it exists) to its original color
      if (params.intersectedObject1) {
        if (params.intersectedObject1.material.constructor.name === 'Array') {
          for (let i = 0; i < params.intersectedObject1.material.length; i++) {
            params.intersectedObject1.material[i].color.setHex(params.intersectedObject1.currentHex)
          }
        } else {
          params.intersectedObject1.material.color.setHex(params.intersectedObject1.currentHex)
        }
      }

      // store reference to closest object as current intersection object
      params.intersectedObject1 = intersects[0].object

      // console.log("params.intersectedObject1, params.intersectedObject1)

      if (params.intersectedObject1.material.constructor.name === 'Array') {
        // SEPARATE FOR LOOPS !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        // store color of closest object (for later restoration)
        for (let i = 0; i < params.intersectedObject1.material.length; i++) {
          params.intersectedObject1.currentHex = params.intersectedObject1.material[i].color.getHex()
        }
        // set a new color for closest object
        for (let i = 0; i < params.intersectedObject1.material.length; i++) {
          params.intersectedObject1.material[i].color.setHex(0xdddd00)
        }
        // SEPARATE FOR LOOPS !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      } else {
        // store color of closest object (for later restoration)
        params.intersectedObject1.currentHex = params.intersectedObject1.material.color.getHex()
        // set a new color for closest object
        params.intersectedObject1.material.color.setHex(0xdddd00)
      }
    }
  }
  // there are no intersections
  else {
    // restore previous intersection object (if it exists) to its original color
    if (params.intersectedObject1) {
      if (params.intersectedObject1.material.constructor.name === 'Array') {
        for (let i = 0; i < params.intersectedObject1.material.length; i++) {
          params.intersectedObject1.material[i].color.setHex(params.intersectedObject1.currentHex)
        }
      } else {
        params.intersectedObject1.material.color.setHex(params.intersectedObject1.currentHex)
      }
    }
    // remove previous intersection object reference
    // by setting current intersection object to "nothing"
    params.intersectedObject1 = null
  }
}

// when the pointer moves, call the given function
//document.addEventListener( "pointermove", onPointerMove, false )
function onPointerMove(event) {
  // the following line would stop any other event handler from firing
  // (such as the pointer's TrackballControls)
  // event.preventDefault()

  // update the pointer variable
  // pointer.x = (event.clientX / window.innerWidth) * 2 - 1
  // pointer.y = -(event.clientY / window.innerHeight) * 2 + 1
  // pointer.x = (event.offsetX / (window.innerWidth - 240)) * 2 - 1
  // pointer.y = -(event.offsetY / (window.innerHeight - 100)) * 2 + 1
  pointer.x = (event.offsetX / canvas.clientWidth) * 2 - 1
  pointer.y = -(event.offsetY / canvas.clientHeight) * 2 + 1
  // console.log("pointer hover, pointer.x, pointer.y) // probably shouldn't log this
}

// when the pointer moves, call the given function
// document.addEventListener( "pointerdown", onPointerDown, false )
function onPointerDown(event) {
  console.log('event ****************************************', event)

  // the following line would stop any other event handler from firing
  // (such as the pointer's TrackballControls)
  event.preventDefault()

  // update the pointer variable
  // pointer.x = (event.clientX / window.innerWidth) * 2 - 1
  // pointer.y = -(event.clientY / window.innerHeight) * 2 + 1
  // pointer.x = (event.offsetX / (window.innerWidth - 240)) * 2 - 1
  // pointer.y = -(event.offsetY / (window.innerHeight - 100)) * 2 + 1
  pointer.x = (event.offsetX / canvas.clientWidth) * 2 - 1
  pointer.y = -(event.offsetY / canvas.clientHeight) * 2 + 1
  console.log('pointer clicked x y', pointer.x, pointer.y)

  // find intersections
  raycaster2.setFromCamera(pointer, event.target.camera)
  // raycaster2.set(
  // 	event.target.camera.getWorldPosition(),
  // 	event.target.camera.getWorldDirection()
  // )
  console.log('raycaster2', raycaster2)

  // create an array containing all objects in the scene with which the raycaster2 intersects
  //var intersects = raycaster2.intersectObjects(event.target.targetList)
  const intersects = raycaster2.intersectObjects(event.target.targetList)
  console.log('intersects', intersects)

  // if there is one (or more) intersections
  if (intersects.length > 0) {
    //console.log("Hit @ " + xyzToString( intersects[0].point ) )
    // change the color of the closest face.
    // intersects[0].face.color.setRGB( 0.8 * Math.random() + 0.2, 0, 0 )
    // intersects[0].object.geometry.colorsNeedUpdate = true

    // if the closest object intersected is not the currently stored intersection object
    const theIntersectedObject = intersects[0].object

    // for testing only
    // if ( theIntersectedObject !== params.intersectedObject2 ) {
    // 	console.log("-----------------------------")
    // 	console.log("params.intersectedObject2 null------------")
    // 	console.log("theIntersectedObject NEW--------")
    // 	console.log(theIntersectedObject)
    // 	console.log("-----------------------------")
    // }
    // else {
    // 	console.log("-----------------------------")
    // 	console.log("params.intersectedObject2 already stored--")
    // 	console.log("theIntersectedObject -----------")
    // 	console.log(theIntersectedObject)
    // 	console.log("-----------------------------")
    // }

    // restore previous intersection object (if it exists) to its original color
    if (params.intersectedObject2) {
      //params.intersectedObject2.material[i].color.setHex( params.intersectedObject2.currentHex )
      // zoom out
      //panCam(100, 200, 200, 800, event.target.camera, event.target.controls)
    } else {
      // zoom in
      //panCam(params.intersectedObject2.position.x, params.intersectedObject2.position.y, params.intersectedObject2.position.z, 800, event.target.camera, event.target.controls)
    }
    // store reference to closest object as current intersection object
    params.intersectedObject2 = theIntersectedObject
    // store color of closest object (for later restoration)
    //params.intersectedObject2.currentHex = params.intersectedObject2.material.color.getHex()
    // set a new color for closest object
    //params.intersectedObject2.material.color.setHex( 0xff0000 )

    // point the camera controls to the intersected object?
    //event.target.controls.reset()
    //event.target.controls.target = new THREE.Vector3(params.intersectedObject2.position.x, params.intersectedObject2.position.y, params.intersectedObject2.position.z)
    //event.target.camera.position.set(100, 200, 200)
    // if (event.button === 2) {
    // 	// zoom in
    // 	panCam(params.intersectedObject2.position.x, params.intersectedObject2.position.y, params.intersectedObject2.position.z, 1200, event.target.camera, event.target.controls)
    // } else if (event.button === 1) {
    // 	// zoom out
    // 	panCam(100, 200, 200, 1200, event.target.camera, event.target.controls)
    // }
    // console.log("------------------")
    // console.log("event.target.controls--------")
    // console.log(event.target.controls)
    // console.log("------------------")

    // show/hide infospheres
    if (params.intersectedObject2.userData.type === 'structure' && event.button === 0) {
      let infospotObject = scene.getObjectByName(`INFOSPOT: ${params.intersectedObject2.name}`) // , true for recursive
      if (infospotObject) {
        if (infospotObject.visible === true) {
          infospotObject.visible = false
        } else {
          infospotObject.visible = true
        }
      }
      // console.log("infospotObject", infospotObject)
    }

    // show/hide annotations
    params.intersectedObject2.children.forEach(function (key) {
      // console.log("--------------------------------------")
      // console.log("key (pre-process)------")
      // console.log(`key.type: ${key.type}`)
      // console.log(`key.visible: ${key.visible}`)
      // console.log(`key.element.hidden: ${key.element.hidden}`)
      // console.log(key)
      // console.log("--------------------------------------")
      // if ( key.type === "Sprite" && event.button === 1 ) {
      // 	if (key.visible === true) {
      // 		key.visible = false
      // 	}
      // 	else {
      // 		key.visible = true
      // 	}
      // }
      if (key.type === 'Object3D' && event.button === 0) {
        if (key.element.hidden === true) {
          //if (key.visible === false) {
          // console.log("-------------------------")
          // console.log("TRUE------")
          // console.log(key.element.hidden)
          // console.log("-------------------------")
          key.element.hidden = false
          key.element.style.display = 'block'
          key.visible = true // does nothing, but keeps status accurate
        } else {
          // console.log("-------------------------")
          // console.log("FALSE------")
          // console.log(key.element.hidden)
          // console.log("-------------------------")
          key.element.hidden = true
          key.element.style.display = 'none'
          key.visible = false // does nothing, but keeps status accurate
        }
        // console.log("--------------------------------------")
        // console.log("key (post-process)------")
        // console.log(`key.type: ${key.type}`)
        // console.log(`key.visible: ${key.visible}`)
        // console.log(`key.element.hidden: ${key.element.hidden}`)
        // console.log(key)
        // console.log("--------------------------------------")
      }
    })

    // if ( params.intersectedObject2.userData.annotation ) {
    // 	console.log("ANNOTATION", params.intersectedObject2.userData.annotation)
    // }
    // else {
    // 	console.log("ANNOTATION?", params.intersectedObject2.userData)
    // }
  } // there are no intersections
  else {
    // restore previous intersection object (if it exists) to its original color
    if (params.intersectedObject2) {
      //params.intersectedObject2.material.color.setHex( params.intersectedObject2.currentHex )
    }
    // remove previous intersection object reference by setting current intersection object to "nothing"
    params.intersectedObject2 = null
  }
}
// OR
// document.addEventListener( "mousedown", onDocumentMouseDown, false )
function onDocumentMouseDown(e) {
  e.preventDefault()

  var mouseVector = new THREE.Vector3(
    (e.clientX / window.innerWidth) * 2 - 1,
    -(e.clientY / window.innerHeight) * 2 + 1,
    1
  )

  projector.unprojectVector(mouseVector, camera)
  var raycaster = new THREE.Raycaster(camera.position, mouseVector.subSelf(camera.position).normalize())

  // create an array containing all objects in the scene with which the ray intersects
  var intersects = raycaster.intersectObjects(scene.children)
  console.log(intersects)
  if (intersects.length > 0) {
    console.log('Intersected object:', intersects.length)
    intersects[0].object.material.color.setHex(Math.random() * 0xffffff)
  }
}

/**
 * GET FEATURED IMAGE
 */
function getFeaturedImage(postObject) {
  let featImage = {}
  // If there is no featured image, exit the function returning blank.
  if (0 === postObject.featured_media) {
    return featImage
  } else {
    featImage.featuredObject = postObject._embedded['wp:featuredmedia'][0]
    featImage.imgUrl = featImage.featuredObject.source_url
    featImage.imgMediumUrl = ''
    featImage.imgLargeUrl = ''
    featImage.imgWidth = featImage.featuredObject.media_details.width
    featImage.imgHeight = featImage.featuredObject.media_details.height
    if (featImage.featuredObject.media_details.sizes.hasOwnProperty('large')) {
      featImage.imgWidth = featImage.featuredObject.media_details.sizes.full.width
      featImage.imgHeight = featImage.featuredObject.media_details.sizes.full.height
      featImage.imgLargeUrl = featImage.featuredObject.media_details.sizes.large.source_url + ' 1024w, '
    }
    // console.log("featImage", featImage)
  }

  return featImage
}

/**
 * CUSTOM ARRAY PROTOTYPES
 */
// check if an element exists in array using a comparer function
// comparer : function(currentElement)
Array.prototype.inArray = function (comparer) {
  for (let i = 0; i < this.length; i++) {
    if (comparer(this[i])) return true
  }
  return false
}
// adds an element to the array
// if it does not already exist using a comparer function
Array.prototype.pushIfNotExist = function (element, comparer) {
  if (!this.inArray(comparer)) {
    this.push(element)
  }
}

/** ANIMATE + RENDER (continuous rendering) ******************************************** */

const animate = () => {
  const dt = clock.getDelta()
  watchPointer(camera, plane.children)
  controls.update()
  TWEEN.update()

  requestAnimationFrame(animate)

  /** ANIMATE SCENE? */
  if (params.ANIMATE) {
    // plane.rotation.x += 0.002
    // plane.rotation.y += 0.002
    plane.rotation.z -= 0.0007
  }

  /** PLAYER CHARACTER */
  if (player.mixer !== undefined) {
    player.mixer.update(dt)
  }

  // Running
  if (player.action === 'Walking') {
    const elapsedTime = Date.now() - player.actionTime
    if (elapsedTime > 2000 && player.move.forward > 0.7) {
      //setAction("Running")
    }
  }

  // Move Player
  if (player.move !== undefined) {
    player.movePlayer(dt)
  }

  // Move Cameras
  if (player.cameras !== undefined && player.cameras.active !== undefined) {
    camera.position.lerp(player.cameras.active.getWorldPosition(new THREE.Vector3()), 0.05)
    const pos = player.object.position.clone()
    pos.y += 200
    camera.lookAt(pos)
  }

  // RENDER SCENE (CONTINUOUSLY)
  //renderer.render(scene, camera)
  render()

  // stats.update()
}

/** LOADERS (??? here ???) */
const loadAssets = () => {
  params.mode = params.modes.LOADING
  console.log('params.mode', params.mode)

  /** FBX ******************************************************************************** */

  //loaders.loaderFBX.load( `${params.assetsPath}characters/SimplePeople.fbx`, function (object) {
  //loaders.loaderFBX.load( `${params.assetsPath}fbx/people/FireFighter.fbx`, function (object) {
  //loaders.loaderFBX.load( `${params.assetsPath}fbx/people/Trucker.fbx`, function (object) {
  loaders.loaderFBX.load(`${params.assetsPath}characters/SK_Chr_Farmer_Male_01.fbx`, function (object) {
    object.mixer = new THREE.AnimationMixer(object)
    player.mixer = object.mixer
    player.root = object.mixer.getRoot()

    object.name = 'Gardener'

    object.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = false
      }
    })

    //loaderTexture.load(`${params.assetsPath}images/SimpleFarmer_Farmer_Brown.png`, function(texture) {
    loaderTexture.load(`${params.assetsPath}textures/PolygonFarm_Texture_01_B.png`, function (texture) {
      object.traverse(function (child) {
        if (child.isMesh) {
          child.material.map = texture
        }
      })
    })

    // console.log("object", object)

    player.object = new THREE.Object3D()
    player.object.add(object)
    //player.object.scale.set(0.022, 0.022, 0.022)
    player.object.scale.set(0.033, 0.033, 0.033)
    player.object.rotation.x = Math.PI / 2 // 90 degrees in radians
    //player.mixer.clipAction(object.animations[0]).play()
    //animations.Idle = object.animations[0]
    //setAction("Idle")

    // console.log("player.object", player.object)
    plane.add(player.object)
    // guiFolderPlayer.add(player.object, "visible").name("Show Character").listen()
  })

  /** LOAD 3D OBJECTS ******************************************************************** */

  //loadTown()

  loadFarmHouse()

  loadRoad()

  //loadKitchenSink()

  loadCoop()

  loadChicken() // PRIMARY WORKING CHICKEN (GLTF)
  //loadHen()
  //loadHenGLTF()
  //loadRooster()
  //loadChickenGLTF()
  //loadChickGLTF()
  //loadChickenFree()

  /**
   * LOAD ANIMATIONS
   */
  let loadNextAnim = function (loader) {
    let anim = anims.pop()
    // console.log("anim", anim)
    loader.load(`${params.assetsPath}fbx/anims2/${anim}.fbx`, function (object) {
      // console.log("object")
      animations[anim] = object.animations[0]
      if (anims.length > 0) {
        // console.log("anims.length")
        // console.log("getAction()")
        // console.log("player.action")
        loadNextAnim(loader)
      } else {
        // console.log("anims.length")
        anims = []
      }
    })
  }
  // RECURSIVE FUNCTION TO LOAD ANIMATIONS
  loadNextAnim(loaders.loaderFBX)
} // end loadAssets()

/**
 * BEGIN BUILD (MAIN/INIT)
 * ****************************************************** */
const build = async () => {
  params.mode = params.modes.BUILDING
  console.log('params.mode', params.mode)

  console.log('building ********************************* ')

  try {
    let a1 = await getSceneData()

    console.log('a1 boolean getSceneData', a1, new Date().toISOString())
    console.log('data retrieved ************************* ')

    let a2 = await buildScene(a1)
    console.log('a2 plane returned from buildScene', a2, new Date().toISOString())

    let a3 = async function (a4) {
      console.log('a4 plane object returned from buildScene', a4, new Date().toISOString())
      params.mode = params.modes.BUILT
      console.log('params.mode', params.mode)
      console.log('scene built ************************** ')
      loadAssets(a2)
      console.log('loading assets *********************** ')
    }
    await a3(a2)
    console.log('a3 async function (complete)', a3, new Date().toISOString())
  } catch (e) {
    console.log('error ***: ', e)
  }

  // const preloader = new Preloader(options)
  // console.log("preloader", preloader)
} // end build()

const getSceneData = async () => {
  // get data
  let getDataFromLocalStorage = true

  // LOCALSTORAGE -- look for data in localStorage first
  if (localStorage && getDataFromLocalStorage && !debug) {
    const getdata = localStorage.getItem('threedgarden') || ''
    const threedgarden = getdata ? JSON.parse(getdata) : undefined
    if (threedgarden !== undefined) {
      console.log('LOCALSTORAGE ITEM RETRIEVED', threedgarden)
      //this.threedgarden = threedgarden
      params.data = threedgarden.data
    } else {
      console.log('LOCALSTORAGE ITEM NOT RETRIEVED', threedgarden)
      getDataFromLocalStorage = false
    }
  } else {
    console.log('LOCALSTORAGE NOT AVAILABLE')
    getDataFromLocalStorage = false
  }

  if (1 === 0 || !getDataFromLocalStorage) {
    // PROMISE REST API -- call WP Rest API for data second
    await Promise.allSettled(
      API_URLS.map((url) =>
        fetch(url)
          .then((results) => results.json())
          .then((data) => {
            let type = data[0].type
            switch (type) {
              case 'scene':
                params.data.scene = [...data]
                break
              case 'allotment':
                params.data.allotment = [...data]
                break
              case 'bed':
                params.data.bed = [...data]
                break
              case 'plant':
                params.data.plant = [...data]
                break
              case 'planting_plan':
                params.data.planting_plan = [...data]
                break
              default:
                break
            }
            console.log('data', data)
          })
      )
    ).then((results) => {
      console.log('results', results)
      results.forEach((result, num) => {
        if (result.status === 'fulfilled') {
          //alert(`${urls[num]}: ${result.value.status}`)
          //console.log(result)
        }
        if (result.status === 'rejected') {
          //alert(`${urls[num]}: ${result.reason}`)
          console.log(result)
        }
      })
      console.log('params.data', params.data)

      // save to localStorage
      localStorage.setItem('threedgarden', JSON.stringify(params))

      // fulfill Promise?
      return true
    })
  } else if (getDataFromLocalStorage) {
    // fulfill Promise?
    return true
  } else {
    // fulfill Promise?
    return false
  }
}

/**
 * BUILD SCENE
 * *************************************************************************************** */
const buildScene = async (a5) => {
  console.log('a5 boolean === a1 boolean', a5)

  params.mode = params.modes.BUILDING
  console.log('params.mode', params.mode)

  console.log('params.data.scene', params.data.scene)

  let wpScene = params.data.scene[0]
  let sceneID = wpScene.id

  // console.log("wpScene", wpScene)

  /** THREE JS SCENE ******************************************************************* */

  scene = new THREE.Scene()

  scene.name = wpScene.title.rendered

  console.log('scene', scene)

  // load the 3D cube map?
  if (wpScene.acf.scene_background_image_px) {
    let cubeMapURLs = [
      wpScene.acf.scene_background_image_px,
      wpScene.acf.scene_background_image_nx,
      wpScene.acf.scene_background_image_py,
      wpScene.acf.scene_background_image_ny,
      wpScene.acf.scene_background_image_pz,
      wpScene.acf.scene_background_image_nz,
    ]
    let reflectionCube = new THREE.CubeTextureLoader().load(cubeMapURLs)
    reflectionCube.format = THREE.RGBFormat
    scene.background = reflectionCube
  }
  // load the 2D background image?
  else if (wpScene.acf.scene_background_image) {
    // let bgTexture = loaderTexture.load(wpScene.acf.scene_background_image)
    // scene.background = bgTexture
    let bgTexture = loaderTexture.load(wpScene.acf.scene_background_image, () => {
      const rt = new THREE.WebGLCubeRenderTarget(bgTexture.image.height)
      rt.fromEquirectangularTexture(renderer, bgTexture)
      scene.background = rt
    })
  }
  // load the background color?
  else if (wpScene.acf.scene_background_color) {
    scene.background = new THREE.Color(wpScene.acf.scene_background_color)
    //scene.fog = new THREE.Fog(0xFFFFFF, 0, 500)
  }

  /** GEOMETRIES *********************************************************************** */

  plane = getPlane(
    wpScene.acf.scene_plane_width_x,
    wpScene.acf.scene_plane_length_y,
    wpScene.acf.scene_plane_background_color
  )
  plane.name = 'plane-jane'
  plane.rotation.x = -Math.PI / 2 // -90 degrees in radians
  //plane.position.z = 10
  //plane.rotation.z += 0.002
  guiFolderRotation.add(plane.rotation, 'x', -Math.PI, Math.PI).listen()
  guiFolderRotation.add(plane.rotation, 'y', -Math.PI, Math.PI).listen()
  guiFolderRotation.add(plane.rotation, 'z', -Math.PI, Math.PI).listen()

  /** TEXTURES ************************************************************************* */

  if (wpScene.acf.scene_plane_texture_image) {
    plane.material.roughness = 0.0
    //plane.material.map = loaderTexture.load("/wp-content/plugins/threed-garden/admin/media/textures/grasslight-big.jpg")
    plane.material.map = loaderTexture.load(wpScene.acf.scene_plane_texture_image)
    // plane.material.bumpMap = loaderTexture.load("/wp-content/plugins/threed-garden/admin/media/textures/grasslight-big-nm.jpg")
    // plane.material.bumpMap = loaderTexture.load(wpScene.acf.scene_plane_texture_image)
    // plane.material.bumpScale = 0.01
    let planeTextureMap = plane.material.map
    planeTextureMap.wrapS = THREE.RepeatWrapping
    planeTextureMap.wrapT = THREE.RepeatWrapping
    planeTextureMap.repeat.set(4, 4)
  }

  /** LIGHTS *************************************************************************** */

  // let pointLight = getPointLight(0xFFFFFF, 4.0)
  // pointLight.position.set( -20, -60, 20 )
  // //pointLight.intensity = 3.0

  // let spotLight = getSpotLight(0xFFFFFF, 4.0)
  // spotLight.position.set( -20, -60, 20 )
  // //spotLight.intensity = 3.0

  // ambient sunlight
  let ambientLight = getAmbientLight(0xffffff, 0.75)
  //ambientLight.position.set( 0, 0, 0 ) // does nothing

  guiFolderLights.add(ambientLight, 'visible').name('Show Ambient Light')
  guiFolderLights.add(ambientLight, 'intensity', -2.0, 2.0)
  guiFolderLights.add(ambientLight.position, 'x', -800, 800)
  guiFolderLights.add(ambientLight.position, 'y', -800, 800)
  guiFolderLights.add(ambientLight.position, 'z', -800, 800)

  // the sun
  let directionalLight = getDirectionalLight(0xffffff, 0.75)
  // x = sun?, y = time of day?, z = ???
  directionalLight.position.set(-90, -120, 135)
  directionalLight.castShadow = true
  //directionalLight.intensity = 1.6 // overwrite?

  let helperDirectionalLight = new THREE.CameraHelper(directionalLight.shadow.camera)
  helperDirectionalLight.visible = false

  // indirect sunlight
  //let directionalLight2 = directionalLight.clone()
  let directionalLight2 = getDirectionalLight(0xffffff, 0.66)
  directionalLight2.position.set(-90, 135, 135) // direct opposite x,y of primary?
  directionalLight2.castShadow = false
  //directionalLight2.intensity = 1.0 // overwrite?

  let helperDirectionalLight2 = new THREE.CameraHelper(directionalLight2.shadow.camera)
  helperDirectionalLight2.visible = true

  guiFolderLights.add(directionalLight, 'visible').name('Show Light')
  guiFolderLights.add(helperDirectionalLight, 'visible').name('Show Light Helper')
  guiFolderLights.add(directionalLight, 'intensity', -2.0, 2.0)
  guiFolderLights.add(directionalLight.position, 'x', -800, 800)
  guiFolderLights.add(directionalLight.position, 'y', -800, 800)
  guiFolderLights.add(directionalLight.position, 'z', -800, 800)

  guiFolderLights.add(directionalLight2, 'visible').name('Show Light 2')
  guiFolderLights.add(helperDirectionalLight2, 'visible').name('Show Light 2 Helper')
  guiFolderLights.add(directionalLight2, 'intensity', -2.0, 2.0)
  guiFolderLights.add(directionalLight2.position, 'x', -800, 800)
  guiFolderLights.add(directionalLight2.position, 'y', -800, 800)
  guiFolderLights.add(directionalLight2.position, 'z', -800, 800)

  /** SCENE ***************************************************************************** */

  // add objects to scene
  //plane.add(structure)
  //plane.add(pointLight)
  //plane.add(spotLight)
  plane.add(directionalLight)
  plane.add(directionalLight2)
  plane.add(ambientLight)
  scene.add(helperDirectionalLight)
  scene.add(helperDirectionalLight2)
  scene.add(plane)

  /** CAMERA **************************************************************************** */

  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000)
  camera.name = 'gardencam1'
  camera.position.set(86, 64, 182)
  //camera.lookAt(new THREE.Vector3(0, 0, 0)) // overridden by OrbitControls.target

  let helperCamera = new THREE.CameraHelper(camera)
  helperCamera.visible = false
  scene.add(helperCamera)

  guiFolderCameras.add(helperCamera, 'visible', 0, 20).name('Show Camera Helper')
  guiFolderCameras.add(camera.position, 'x', -800, 800).listen()
  guiFolderCameras.add(camera.position, 'y', -800, 800).listen()
  guiFolderCameras.add(camera.position, 'z', -800, 800).listen()

  /** RENDERER ************************************************************************** */

  renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
  })
  renderer.shadowMap.enabled = true
  //renderer.setSize(window.innerWidth - 240, window.innerHeight - 100) //admin
  renderer.setSize(window.innerWidth - 100, window.innerHeight - 100) //public

  // utilize javascript prototyping.. add variables to the dom element :)
  renderer.domElement.camera = camera
  renderer.domElement.targetList = plane.children

  renderer.domElement.addEventListener('pointermove', onPointerMove, false)
  renderer.domElement.addEventListener('pointerdown', onPointerDown, false)
  //renderer.domElement.addEventListener("mousedown", onDocumentMouseDown, false)

  /** CONTROLS *************************************************************************** */
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.25
  controls.enableZoom = true
  controls.rotateSpeed = 0.5
  controls.autoRotate = false
  controls.autoRotateSpeed = 0.03
  controls.minDistance = 0.01
  controls.maxDistance = 340
  controls.maxPolarAngle = Math.PI / 2 - 0.04
  controls.target = new THREE.Vector3(0, 0, 0) // where the camera actually points
  //controls.target.set(0, 5, 0) // alternate way of setting target of camera

  renderer.domElement.controls = controls

  /** LOAD CAMERAS *********************************************************************** */

  //createCameras()

  /** WEBGL CANVAS *********************************************************************** */

  // console.log("document", document)
  container = document.getElementById('webgl')
  // console.log("container", container)
  canvas = renderer.domElement
  // console.log("canvas = renderer.domElement", canvas)
  container.append(gui.domElement)
  container.append(renderer.domElement)

  /** JOYSTICK <+> *********************************************************************** */

  // OG working
  let joystick = new JoyStick({
    onMove: playerControl,
    game: container, // document.querySelector("#webgl")
  })
  console.log('joystick', joystick)

  // Fried Chicken testing (meh)
  // const joystickControls = new JoystickControls(
  //   camera,
  //   scene,
  // )
  // const rotationJoystick = new RotationJoystickControls(
  //   camera,
  //   scene,
  //   player
  // )

  /** BUILD ALLOTMENTS ******************************************************************* */

  alert('HEY HEY HEY: BUILD ALLOTMENTS?')
  // return plane

  // buildAllotments(
  //   params.data.allotment,
  //   plane,
  //   sceneID // the post-to-post relationship <3
  // )

  // fulfill Promise
  // return true
  return plane
} // end buildScene

/**
 * BUILD "ALLOTMENTS" FROM REST API POST OBJECT ************************************************************
 */
function buildAllotments(postObject, plane, sceneID) {
  console.log('ALLOTMENTS', postObject)

  // alert("HEY HEY HEY: BUILD ALLOTMENTS..")

  var filteredPostObject = postObject.filter(function (obj) {
    return obj.acf.allotment_scene === sceneID
  })
  // console.log("filteredPostObject", filteredPostObject)

  filteredPostObject.forEach(function (key) {
    // console.log("-------------------------")
    // console.log("key.id (postObject)------")
    // console.log(key.id)
    // console.log(key)
    // console.log("-------------------------")

    // BUILD ALLOTMENT OBJECT GROUP
    let allotment = {}
    allotment.parameters = {}
    allotment.position = {}
    allotment.images = {}
    allotment.parameters.x = parseInt(key.acf.allotment_width)
    allotment.parameters.y = parseInt(key.acf.allotment_length)
    allotment.parameters.z = parseInt(key.acf.allotment_height) // 0
    allotment.position.x = parseInt(key.acf.allotment_position_x)
    allotment.position.y = parseInt(key.acf.allotment_position_y)
    allotment.position.z = parseInt(key.acf.allotment_position_z)
    allotment.images.texture = key.acf.allotment_texture_image
    allotment.images.featured = getFeaturedImage(key)
    allotment.shape = key.acf.allotment_shape
    allotment.color = key.acf.allotment_color
    allotment.title = key.title.rendered
    allotment.postID = key.id
    allotment.description = key.content.rendered
    allotment.link = key.link

    // console.log("allotment", allotment)

    let structure = getGeometry(
      allotment.shape,
      allotment.parameters.x,
      allotment.parameters.y,
      allotment.parameters.z,
      allotment.color
    )
    structure.name = allotment.title
    structure.userData.type = 'structure'

    structure.userData.postID = allotment.postID
    structure.userData.description = allotment.description
    structure.userData.annotation = allotment.title
    structure.userData.link = allotment.link
    structure.position.x = allotment.position.x
    structure.position.y = allotment.position.y
    structure.position.z = structure.geometry.parameters.depth / 2 + allotment.position.z // - 10 for gap between plane
    structure.material.roughness = 0.9
    if (allotment.images.texture !== null && allotment.images.texture !== false) {
      structure.material.map = loaderTexture.load(allotment.images.texture)
      for (let i = 0; i < structure.material.length; i++) {
        // hightlight object
        //structure.material[i].color.set(0xff0000)
        structure.material[i].map = loaderTexture.load(allotment.images.texture)
        //structure.faces[i].materialIndex = 1
        //console.log(intersects[i])
        // structure.material[i].bumpMap = loaderTexture.load(allotment.images.texture)
        // structure.material[i].bumpScale = 0.05
        let structureTextureMap = structure.material[i].map
        structureTextureMap.wrapS = THREE.RepeatWrapping
        structureTextureMap.wrapT = THREE.RepeatWrapping
        structureTextureMap.repeat.set(4, 4)
      }
    }

    plane.add(structure)

    //params.colliders.push(structure)

    //guiFolderAllotments.add(structure.geometry.parameters, "depth", 0, allotment.parameters.z)

    // console.log("allotment structure", structure)

    /** BUILD BEDS IN THIS ALLOTMENT ************************************************** */

    //alert("HEY HEY HEY: BUILD BEDS??")

    buildBeds(
      params.data.bed,
      plane,
      allotment.postID, // the post-to-post relationship <3
      structure.position.x,
      structure.position.y,
      0 //structure.position.z
    )

    /** INFOSPOTS ********************************************************************* */

    //alert("HEY HEY HEY: BUILD INFOSPOTS??")

    // let infospot = makeInfospotSphere(
    // 	structure.name,
    // 	structure.position.x,
    // 	structure.position.y,
    // 	allotment.parameters.z + 3,
    // 	allotment.postID,
    // 	structure.userData.annotation,
    // 	structure.userData.link
    // )
    // infospot.name = `INFOSPOT: ${structure.name}`
    // infospot.visible = true

    // guiFolderAllotments.add(infospot, "visible").name("InfoSphere").listen()

    // plane.add(infospot)
  }) /** END ALLOTMENTS ****************************************************************** */

  // console.log("plane.children", plane.children)
}

/**
 * BUILD "BEDS" FROM REST API POST OBJECT ************************************************************
 */
function buildBeds(postObject, plane, allotmentID, posOffsetX, posOffsetY, posOffsetZ) {
  // console.log("BEDS postObject", postObject)

  // only show beds for this allotment structure
  var filteredPostObject = postObject.filter(function (obj) {
    return obj.acf.bed_allotment === allotmentID
  })
  // console.log("filteredPostObject", filteredPostObject)

  filteredPostObject.forEach(function (key) {
    // console.log("-------------------------")
    // console.log("key.id (postObject)------")
    // console.log(key.id)
    // console.log(key)
    // console.log("-------------------------")

    let bed = {}
    bed.parameters = {}
    bed.position = {}
    bed.images = {}
    bed.parameters.x = parseInt(key.acf.bed_width) / 12
    bed.parameters.y = parseInt(key.acf.bed_length) / 12
    bed.parameters.z = parseInt(key.acf.bed_height) / 12
    bed.position.x = parseInt(key.acf.bed_position_x) / 12 + posOffsetX
    bed.position.y = parseInt(key.acf.bed_position_y) / 12 + posOffsetY
    bed.position.z = parseInt(key.acf.bed_position_z) / 12 + bed.parameters.z / 2 // + posOffsetZ
    bed.images.texture = key.acf.bed_texture_image
    bed.images.featured = getFeaturedImage(key)
    bed.shape = key.acf.bed_shape
    bed.color = key.acf.bed_color
    bed.title = key.title.rendered
    bed.postID = key.id
    bed.description = key.content.rendered
    bed.link = key.link

    // console.log("bed", bed)

    let structure = getGeometry(bed.shape, bed.parameters.x, bed.parameters.y, bed.parameters.z, bed.color)
    structure.name = bed.title
    structure.userData.type = 'structure'
    structure.userData.postID = bed.postID
    structure.userData.description = bed.description
    structure.userData.annotation = bed.title
    structure.userData.link = bed.link
    structure.position.x = bed.position.x ? bed.position.x : 0
    structure.position.y = bed.position.y ? bed.position.y : 0
    structure.position.z = bed.position.z ? bed.position.z : 0
    //structure.rotation.x = -Math.PI / 2 // -90 degrees in radians
    structure.material.roughness = 0.9
    if (bed.images.texture !== null && bed.images.texture !== false) {
      structure.material.map = loaderTexture.load(bed.images.texture)
      for (let i = 0; i < structure.material.length; i++) {
        // hightlight object
        //structure.material[i].color.set(0xff0000)
        structure.material[i].map = loaderTexture.load(bed.images.texture)
        //structure.faces[i].materialIndex = 1
        //console.log(intersects[i])
        // structure.material[i].bumpMap = loaderTexture.load(bed.images.texture)
        // structure.material[i].bumpScale = 0.05
        let structureTextureMap = structure.material[i].map
        structureTextureMap.wrapS = THREE.RepeatWrapping
        structureTextureMap.wrapT = THREE.RepeatWrapping
        structureTextureMap.repeat.set(4, 4)
      }
    }

    plane.add(structure)

    params.colliders.push(structure)

    // console.log("bed structure", structure)

    /** BUILD PLANTS IN THIS BED, ACCORDING TO PLANTING PLANS ************************* */

    //alert("HEY HEY HEY: BUILD PLANTING PLANS??")

    buildPlantingPlans(
      params.data.planting_plan,
      plane,
      bed.postID, // the post-to-post relationship <3
      structure.position.x,
      structure.position.y,
      0 //structure.position.z
    )

    /** INFOSPOTS ********************************************************************* */

    //alert("HEY HEY HEY: BUILD INFOSPOTS??")

    // let infospot = makeInfospotSphere(
    // 	structure.name,
    // 	structure.position.x,
    // 	structure.position.y,
    // 	bed.parameters.z + 3,
    // 	bed.postID,
    // 	structure.userData.annotation,
    // 	structure.userData.link
    // )
    // infospot.name = `INFOSPOT: ${structure.name}`
    // infospot.visible = false

    // guiFolderBeds.add(infospot, "visible").name("InfoSphere").listen()

    // plane.add(infospot)
  }) /** END BEDS *********************************************************************** */

  // console.log("plane.children", plane.children)
}

/**
 * BUILD "PLANTS" FROM REST API POST OBJECT ************************************************************
 */
function buildPlantingPlans(postObject, plane, bedID, posOffsetX, posOffsetY, posOffsetZ) {
  //console.log("PLANTING PLANS postObject", postObject)
  //return null

  // only show plants for this planting plan's bed structure
  var filteredPostObject = []
  var matches = []
  postObject.forEach(function (obj) {
    obj.acf.planting_plan_bed_plant_schedule.forEach(function (i) {
      if (i.planting_plan_bed === bedID) {
        //console.log("MATCHED at: ", i)
        //matches.push(i)
        //matches.push(obj)
        matches.pushIfNotExist(obj, function (e) {
          return e.id === obj.id
        })
      }
    })
    filteredPostObject = [...matches]
  })

  if (filteredPostObject.length > 0) {
    console.log('filteredPostObject', filteredPostObject)
  }

  // for each planting plan..
  filteredPostObject.forEach(function (key) {
    // console.log("-------------------------")
    // console.log("key.id (filteredPostObject)")
    // console.log(key.id)
    // console.log(key)
    // console.log("-------------------------")

    // for each planting plan bed-plant schedule..
    key.acf.planting_plan_bed_plant_schedule.forEach(function (key2) {
      // console.log("key2", key2)

      // only for this bed..
      if (key2.planting_plan_bed === bedID) {
        // show this plant (or multiple plants) in this bed..
        var filteredPlant = params.data.plant.filter(function (obj) {
          return obj.id === key2.planting_plan_plant
        })

        // console.log("filteredPlant", filteredPlant)

        // for this plant in this bed..
        filteredPlant.forEach(function (key3) {
          // console.log("key3", key3)

          let plant = {}
          plant.parameters = {}
          plant.position = {}
          plant.images = {}
          plant.parameters.x = Number(key3.acf.plant_width) / 12
          plant.parameters.y = Number(key3.acf.plant_length) / 12
          plant.parameters.z = Number(key3.acf.plant_height) / 12
          plant.position.x = parseInt(key2.plant_position_x) / 12 + posOffsetX
          plant.position.y = parseInt(key2.plant_position_y) / 12 + posOffsetY
          plant.position.z = parseInt(key2.plant_position_z) / 12 + plant.parameters.z / 2 // + posOffsetZ
          plant.images.texture = key3.acf.plant_texture_image
          plant.images.featured = getFeaturedImage(key)
          plant.shape = key3.acf.plant_shape
          plant.color = key3.acf.plant_color
          plant.title = key3.title.rendered
          plant.postID = key3.id
          plant.description = key3.content.rendered
          plant.link = key3.link

          console.log('PLANT', plant)

          let structure = getGeometry(
            plant.shape, // "Tree", "Bush", "Box",
            plant.parameters.x,
            plant.parameters.y,
            plant.parameters.z,
            plant.color
          )
          structure.name = plant.title
          structure.userData.type = 'structure'
          structure.userData.postID = plant.postID
          structure.userData.description = plant.description
          structure.userData.annotation = plant.title
          structure.userData.link = plant.link
          structure.position.x = plant.position.x ? plant.position.x : 0
          structure.position.y = plant.position.y ? plant.position.y : 0
          structure.position.z = plant.position.z ? plant.position.z : 0
          structure.rotation.x = Math.PI / 2 // 90 degrees in radians
          structure.material.roughness = 0.9
          if (plant.images.texture !== null && plant.images.texture !== false) {
            structure.material.map = loaderTexture.load(plant.images.texture)
            for (let i = 0; i < structure.material.length; i++) {
              // hightlight object
              //structure.material[i].color.set(0xff0000)
              structure.material[i].map = loaderTexture.load(plant.images.texture)
              //structure.faces[i].materialIndex = 1
              //console.log(intersects[i])
              // structure.material[i].bumpMap = loaderTexture.load(plant.images.texture)
              // structure.material[i].bumpScale = 0.05
              let structureTextureMap = structure.material[i].map
              structureTextureMap.wrapS = THREE.RepeatWrapping
              structureTextureMap.wrapT = THREE.RepeatWrapping
              structureTextureMap.repeat.set(4, 4)
            }
          }

          console.log('plant structure', structure)

          plane.add(structure)

          // colliders
          params.colliders.push(structure)

          /** INFOSPOTS ********************************************************************* */

          // let infospot = makeInfospotSphere(
          // 	structure.name,
          // 	structure.position.x,
          // 	structure.position.y,
          // 	plant.parameters.z + 3,
          // 	plant.postID,
          // 	structure.userData.annotation,
          // 	structure.userData.link
          // )
          // infospot.name = `INFOSPOT: ${structure.name}`
          // infospot.visible = false

          // guiFolderBeds.add(infospot, "visible").name("InfoSphere").listen()

          // plane.add(infospot)
        })
      } // end if
    })
  }) /** END PLANTS *************************************************************************** */

  // console.log("plane.children", plane.children)
}

const MyComponent = () => {
  useEffect(() => {
    console.log('MyComponent onMount')

    return () => {
      console.log('MyComponent onUnmount')
    }
  }, [])
  return <div>Component body here...</div>
}

const ThreeDGarden = (): JSX.Element => {
  const word = 'HEY HEY HEY'
  const title = useRef()
  const root = useRef()
  // const scene = new THREE.Scene()
  useEffect(() => {
    bootManager()
  }, [])
  return (
    <div>
      <div ref={title}>ThreeDGarden: {word}</div>
      <div
        id='root'
        ref={root}
      >
        Three root: {JSON.stringify(root)}
      </div>
      <MyComponent />
    </div>
  )
}

export default ThreeDGarden
