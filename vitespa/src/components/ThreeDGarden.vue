<template>
  <div class="threedgarden">
    <h3>
      Mouse: x={{x}} y={{y}} |
      Counter: {{count}}
      <a @click='inc()' style='margin-right:10px'>+</a>
      <a @click='dec()'>-</a>
      <!-- Mode: {{params.mode}} -->
    </h3>
    <h1>{{ msg }}</h1>
    <h2>{{ subtitle }}</h2>
    <!-- {{isWebGLSupported() ? ( -->
      <div id="webgl" ref="root"></div>
    <!-- ) : (
      <div>WebGL is not supported</div>
    )}} -->
  </div>
</template>

<!-- <script setup lang="ts"> -->
<script lang="ts">
// import { getCurrentInstance } from 'vue'
// const apple = getCurrentInstance()
// const $global = apple.appContext.config.globalProperties
// console.log("$global", $global)

// check for required WebGL and/or WebGL2
import { isWebGLSupported, isWebGL2Supported } from 'webgl-detector'
if (!isWebGLSupported()){
  alert('WebGL is not supported.')
  console.log('WebGL is not supported.')
// } else {
//   alert('WebGL is supported.')
//   console.log('WebGL is supported.')
}
if (!isWebGL2Supported()){
  alert('WebGL2 is not supported.')
  console.log('WebGL2 is not supported.')
// } else {
//   alert('WebGL2 is supported.')
//   console.log('WebGL2 is supported.')
}

// vueuse components
import { useMouse, useCounter } from '@vueuse/core'
const { x, y } = useMouse()
const { count, inc, dec } = useCounter()

// three.js
import * as THREE from 'three'
// import Stats from 'three/examples/jsm/libs/stats.module'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer'
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min'

// three.js joystick
// import { JoystickControls, RotationJoystickControls } from 'three-joystick'

// dat.gui
import * as dat from 'dat.gui'

// farmbot
// ~ is an alias to /src
// import FarmBot from "~/components/FarmBot.vue"
// console.log("FarmBot", FarmBot)

//
// LOGIC BEGINS HERE ****
//
// direct instance creation
const data = { 
  that: this,
  a: 1
}

/** STATS */
// const stats = Stats()
// document.body.appendChild(stats.dom)

/** PARAMETERS FROM PHP */
// console.log("window", window)
// console.log(window.postdata)
const postdata = window.postdata ? window.postdata : {}
const pluginName = postdata.plugin_name
const pluginVersion = postdata.plugin_version
const pluginURL = postdata.plugin_url
const themeURI = postdata.theme_uri
const restURL = postdata.rest_url
const worldID = postdata.world_id
console.log("pluginName", pluginName, pluginVersion)
console.log("postdata", postdata)

/** INSTANTIATE COMMON VARIABLES */
const debug = false
const debugPhysics = false

const gui = new dat.GUI({ autoPlace: true, closeOnTop: true })
      gui.close()
      gui.domElement.id = "gui"
      let guiFolderRotation 		= gui.addFolder("Rotation + Animation")
      //let guiFolderAnimation 	= guiFolderRotation.addFolder("Animation")
      let guiFolderCameras 		  = gui.addFolder("Camera Position")
      let guiFolderLights 		  = gui.addFolder("Directional Light")
      let guiFolderAllotments 	= gui.addFolder("Allotments")
      let guiFolderBeds 			  = gui.addFolder("Beds")
      let guiFolderPlants 		  = gui.addFolder("Plants")
      //let guiFolderInfospots 	= gui.addFolder("Infospots")
      let guiFolderAnnotations 	= gui.addFolder("Annotations")
      let guiFolderPlayer 		  = gui.addFolder("Character")

let scene
let plane
let camera
let controls
let renderer
let container
let canvas
let player = {}
    player.action = "Idle"
    player.actionTime = Date.now()
let animations = {}
let anims = ["Breathing Idle", "Driving", "Idle", "Left Turn", "Pointing", "Pointing Gesture"]
    anims = [...anims, "Right Turn", "Running", "Talking", "Turn", "Walking", "Walking Backwards"]
let anims2 = ["ascend-stairs", "gather-objects", "look-around", "push-button", "run"]
let tweens = []

let cellSize = 16
let interactive = false
let levelIndex = 0
let _hints = 0
let score = 0
let cameraFade = 0.05
let mute = false
let collect = []

let messages = {
  text: [ 
    "Welcome to your ThreeD Garden",
    "GO GROW!"
  ],
  index: 0
}

// PARAMS
const params = {
  /** SET MODES */
  modes: Object.freeze({
    NONE: "none",
    PRELOAD: "preload",
    INITIALIZING: "initializing",
    BUILDING: "building",
    BUILT: "built",
    LOADING: "loading",
    LOADED: "loaded",
    ACTIVE: "active",
    GAMEOVER: "game_over"
  }),
  mode: "",
  /** turn on/off animation */
  ANIMATE: false,
  /** where multimedia files are located */
  assetsPath: `${pluginURL}assets/`,
  /** all the data from rest api calls to be stored here */
  data: {
    world: [{id: worldID}],
    scene: [],
    allotment: [],
    bed: [],
    plant: [],
    planting_plan: []
  },
  /** POINTER HOVERS + CLICKS */
  intersectedObject1: null,
  intersectedObject2: null,
  /** PLAYER COLLISION INTO OBJECTS */
  colliders: [], // params.colliders.push(object3D)
  // town.fbx
  environment: {},
  // custom fbx
  farmhouse: {},
}
params.mode = params.modes.NONE
console.log("params.mode", params.mode)
guiFolderRotation.add(params, "ANIMATE").name("Run Animation")

params.mode = params.modes.PRELOAD
console.log("params.mode", params.mode)

console.log("params", params)
// console.log("options", options)

/** 
 * three.js 
 * LOADING MANAGER 
 * :) APP EXECUTION STARTS HERE <3
 */
const manager = new THREE.LoadingManager()

manager.onStart = (url, itemsLoaded, itemsTotal) => {
	console.log( 'Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' )
}
manager.onProgress = function ( url, itemsLoaded, itemsTotal ) {
	//console.log( 'Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' )
}
manager.onError = function ( url ) {
	console.error( 'There was an error loading ' + url )
}
manager.onLoad = () => {
  const startTime = new Date().toISOString()
  console.log("manager.onLoad", startTime)
  // console.log('starting timer...')
  // const millis = Date.now() - startTime
  // console.log(`milliseconds elapsed = ${Math.floor(millis)}`)
  // console.log(`seconds elapsed = ${Math.floor(millis / 1000)}`)
  
  if (params.mode == params.modes.LOADING) {
    params.mode = params.modes.LOADED
    console.log("params.mode manager.onLoad", params.mode, startTime)
    setAction("Idle")
    animate()
    console.log("animating ****************************** ")
    params.mode = params.modes.ACTIVE
    console.log("params.mode manager.onLoad", params.mode, startTime)
  } else {
    console.log("still building ************************* ")
    console.log("params.mode manager.onLoad", params.mode, startTime)
  }
  
}

/** LOADERS */
const loaderFBX = new FBXLoader(manager)
const loaderGLTF = new GLTFLoader(manager)
const loaderOBJ = new OBJLoader(manager)
const loaderTexture = new THREE.TextureLoader(manager)

/** 
 * LOADER OPTIONS ???
 */
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

/** TIME CLOCK */
const clock = new THREE.Clock()

/** POINTER HOVERS + CLICKS */
const raycaster = new THREE.Raycaster()
const raycaster2 = new THREE.Raycaster()
const pointer = new THREE.Vector2()
// create a Ray with origin at the pointer position and direction into the scene (camera direction)
// let vector = new THREE.Vector3( pointer.x, pointer.y, 1 )
// projector.unprojectVector( vector, camera )
// let raycaster2 = new THREE.Raycaster( 
// 	event.target.camera.position, 
// 	vector.sub( event.target.camera.position ).normalize() 
// )

/** REST API URLS */
const API_URL_SCENES = `${restURL}scene/?_embed&per_page=100`
const API_URL_ALLOTMENTS = `${restURL}allotment/?_embed&per_page=100`
const API_URL_BEDS = `${restURL}bed/?_embed&per_page=100`
const API_URL_PLANTING_PLANS = `${restURL}planting_plan/?_embed&per_page=100`
const API_URL_PLANTS = `${restURL}plant/?_embed&per_page=100`

const api_urls = [
  API_URL_SCENES,
  API_URL_ALLOTMENTS,
  API_URL_BEDS,
  API_URL_PLANTING_PLANS,
  API_URL_PLANTS
]


/** REFs */
const root = ref(null)


/** FUNCTIONS */

// render scene + camera
function render() {
    renderer.render(scene, camera)
}

// watch for window resize, then adjust canvas appropriately
const onWindowResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize( window.innerWidth, window.innerHeight )
  //controls.handleResize() or something similar to update controls
  render()
}
// watch for window resize, then adjust canvas appropriately
window.addEventListener( 'resize', onWindowResize, false )

const getPlane = (x, y, color) => {
  let geometry = new THREE.PlaneGeometry(x, y)
  let material = new THREE.MeshStandardMaterial({
    color: color,
    side: THREE.DoubleSide
  })
  let mesh = new THREE.Mesh(geometry, material)
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
  light.shadow.bias 			= 0.0001
  light.shadow.mapSize.width 	= 4096 //default = 512
  light.shadow.mapSize.height = 4096 //default = 512
  light.shadow.camera.left 	= -1000 //default = -5
  light.shadow.camera.bottom 	= -1000 //default = -5
  light.shadow.camera.right 	= 1000 //default = 5
  light.shadow.camera.top 	= 1000 //default = 5
  light.shadow.camera.near 	= 0.5 // default
  light.shadow.camera.far 	= 500 // default
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
    case "Box":
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
        depthWrite: true
      })
      mesh = new THREE.Mesh(
        geometry, 
        [
          material, material, 
          material, material
        ]
      )
      mesh.castShadow = true
      break

    case "Cone":
      geometry = new THREE.ConeGeometry(x/2, y/2, z, 32, 1, true)
      material = new THREE.MeshStandardMaterial({
        color: color,
        side: THREE.DoubleSide
      })
      mesh = new THREE.Mesh(geometry, material)
      mesh.castShadow = true
      mesh.rotation.x = Math.PI / 2 // 90 degrees in radians
      break

    case "Cylinder":
      geometry = new THREE.CylinderGeometry(x/2, y/2, z, 32, 1, true)
      material = new THREE.MeshStandardMaterial({
        color: color,
        side: THREE.DoubleSide
      })
      mesh = new THREE.Mesh(geometry, material)
      mesh.castShadow = true
      mesh.rotation.x = Math.PI / 2 // 90 degrees in radians
      break

    case "InfoSphere":
      geometry = new THREE.SphereGeometry(x, y, z)
      material = new THREE.MeshStandardMaterial({
        color: color,
        side: THREE.DoubleSide
      })
      mesh = new THREE.Mesh(geometry, material)
      mesh.castShadow = true
      //mesh.rotation.x = Math.PI / 2 // 90 degrees in radians
      break

    case "Sphere":
      geometry = new THREE.SphereGeometry(x, y, z)
      material = new THREE.MeshStandardMaterial({
        color: color,
        side: THREE.DoubleSide
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

    case "Bush":

      // [MM]

      // CAST
      geometry = new THREE.BoxGeometry(x, y, z)

      //color = new THREE.Color(0xff0000)
      color = new THREE.Color("rgb(153,90,0)")

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
      //scene.add(mesh)

      // mesh.matrix.makeTranslation(0,-125,0)
      // mesh.matrixAutoUpdate = false
      
      var levels = 4 // slow? lower this
      var edge_w = 100
      var edge_h = 150

      function bush(n, mat, c) {
        if(n > 0) {
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
          col1.g += 0.64/levels
          material = new THREE.MeshPhongMaterial( { color:col1, wireframe: false } )
          mesh = new THREE.Mesh(geometry, material)
          new_mat_t0.makeTranslation(edge_w/2,0,0)
          new_mat_t.makeTranslation(0,edge_h,0)
          new_mat_r.makeRotationZ(-Math.PI/4)
          new_mat_r2.makeRotationY(Math.PI/2)
          new_mat_s.makeScale(0.75,0.75,0.75)
          new_mat.multiply(new_mat_r2)  //      
          new_mat.multiply(new_mat_t0)
          new_mat.multiply(new_mat_r)        
          new_mat.multiply(new_mat_s)        
          new_mat.multiply(new_mat_t)
          new_mat.multiply(mat)
          mesh.matrix.copy(new_mat)
          mesh.matrixAutoUpdate=false
          mesh.updateMatrix=false //
          scene.add(mesh)
          bush(n-1, mesh.matrix.clone(), col1)
      
          //col2.offsetHSL(0.12,0,0)
          col2.g += 0.64/levels
          material = new THREE.MeshPhongMaterial( { color:col2, wireframe: false } )
          mesh = new THREE.Mesh(geometry, material)
          new_mat_t0.makeTranslation(-edge_w/2,0,0)
          new_mat_t.makeTranslation(0,edge_h,0)
          new_mat_r.makeRotationZ(Math.PI/4)
          new_mat_r2.makeRotationY(Math.PI/2)
          new_mat_s.makeScale(0.75,0.75,0.75)
          new_mat2.multiply(new_mat_r2)
          new_mat2.multiply(new_mat_t0)
          new_mat2.multiply(new_mat_r)
          new_mat2.multiply(new_mat_s)
          new_mat2.multiply(new_mat_t)
          new_mat2.multiply(mat)
          mesh.matrix.copy(new_mat2)
          mesh.matrixAutoUpdate=false
          mesh.updateMatrix=false //
          scene.add(mesh)
          bush(n-1, mesh.matrix.clone(), col2)
        }
      }
      
      // [MM]
      //bush(levels, mesh.matrix, color)

    default:
      geometry = new THREE.BoxGeometry(x, y, z)
      material = new THREE.MeshStandardMaterial({
        color: color,
        side: THREE.DoubleSide
      })
      mesh = new THREE.Mesh(geometry, material)
      mesh.castShadow = true
      break
  }
  
  return mesh
}

// LOADERS
function loadEnvironment(loader) {
  loader.load(`${params.assetsPath}fbx/town.fbx`, function(object){
    params.environment = object
    params.colliders = []
    object.scale.set(0.025, 0.025, 0.025)
    scene.add(object)
    object.traverse( function ( child ) {
      if ( child.isMesh ) {
        if (child.name.startsWith("proxy")){
          params.colliders.push(child)
          child.material.visible = false
        }else{
          child.castShadow = true
          child.receiveShadow = true
        }
      }
    } )
    
    loadNextAnim(loader)
  })
}

function loadFarmHouse(plane) {
  //loaderFBX.load(`${params.assetsPath}fbx/SM_Bld_Farmhouse_01.fbx`, function(object){
  loaderFBX.load(`${params.assetsPath}fbx/Building_Farm_House_02.fbx`, function(object){
  //loaderFBX.load(`${params.assetsPath}fbx/Building_Barn_Big_03.fbx`, function(object){
    params.farmhouse = object
    params.colliders = []
    object.rotation.y = 270 * (Math.PI/180) // 90 degrees in radians
    object.position.set(0, 0, 100)
    //object.scale.set(0.025, 0.025, 0.025)
    object.scale.set(2.2, 2.2, 2.2)
    scene.add(object)
    object.traverse( function ( child ) {
      if ( child.isMesh ) {
        if (child.name.startsWith("proxy")){
          params.colliders.push(child)
          child.material.visible = false
        }else{
          child.castShadow = true
          child.receiveShadow = true
        }
      }
    } )
    //loaderTexture.load(`${params.assetsPath}textures/PolygonFarm_Texture_01_A.png`, function(texture) {
    loaderTexture.load(`${params.assetsPath}textures/SimpleFarm.png`, function(texture) {
      object.traverse( function ( child ) {
        if ( child.isMesh ){
          child.material.map = texture
        }
      } )
    })
    
    //loadNextAnim(loader)
  })
}

function loadFarmHouseGLTF(plane) {
  
  // loaderFBX.load( `${params.assetsPath}fbx/Building_Farm_House_02.fbx`, function (object) {
  loaderGLTF.load( `${params.assetsPath}gltf/Residential House.glb`, function (object) {

    let model = object.scene
    model.name = "Farm House"
    model.position.set(0, 0, 100)
    model.scale.set(20, 20, 20)
    model.traverse( function ( child ) {
      if ( child.isMesh ) child.castShadow = true
    } )
    scene.add(model)

    helper = new THREE.SkeletonHelper(model)
    helper.material.linewidth = 5
    helper.visible = true
    scene.add(helper)
    
    console.log("loadFarmHouse object", object)
    console.log("loadFarmHouse model", model)

    guiFolderPlayer.add(model, "visible").name("Show House").listen()

  } )
}

function loadChickenCoop(plane) {
  loaderFBX.load(`${params.assetsPath}fbx/Prop_Chicken_Coop_02.fbx`, function(object) {
    params.farmhouse = object
    params.colliders = []
    object.rotation.y = 90 * (Math.PI/180) // 90 degrees in radians
    object.position.set(80, 0, -10)
    object.scale.set(2.2, 2.2, 2.2)
    scene.add(object)
    object.traverse( function ( child ) {
      if (child.isMesh) {
        if (child.name.startsWith("proxy")) {
          params.colliders.push(child)
          child.material.visible = false
        } else {
          child.castShadow = true
          child.receiveShadow = true
        }
      }
    } )
    loaderTexture.load(`${params.assetsPath}textures/SimpleFarm.png`, function(texture) {
      object.traverse( function ( child ) {
        if (child.isMesh){
          child.material.map = texture
        }
      } )
    })
  })
}

function loadChicken(plane) {
  
  loaderGLTF.load( `${params.assetsPath}gltf/Chicken.glb`, function (object) {

    let model = object.scene
    model.name = "Chicken GLB"
    model.position.set(-3, 0, 0)
    //model.rotation.y = 90 * (Math.PI/180) // 90 degrees in radians
    model.scale.set(4, 4, 4)
    model.traverse( function ( child ) {
      if ( child.isMesh ) child.castShadow = true
    } )
    scene.add(model)

    // helper = new THREE.SkeletonHelper(model)
    // helper.material.linewidth = 5
    // helper.visible = true
    // scene.add(helper)
    
    console.log("loadChicken object", object)
    console.log("loadChicken model", model)

    //guiFolderPlayer.add(model, "visible").name("Show Chicken").listen()

  } )
}

function loadChicken0(plane) {
  loaderFBX.load(`${params.assetsPath}fbx/Chicken.fbx`, function(object){
    
    console.log("BIRD----------------")
    console.log(object)

    //params.farmhouse = object
    //params.colliders = []
    //object.rotation.y = 90 * (Math.PI/180) // 90 degrees in radians
    object.position.set(0, 0, 0)
    //object.scale.set(2.2, 2.2, 2.2)
    scene.add(object)
    object.traverse( function ( child ) {
      if ( child.isMesh ) {
        // if (child.name.startsWith("proxy")){
        // 	params.colliders.push(child)
        // 	child.material.visible = false
        // }else{
          child.castShadow = true
          child.receiveShadow = true
        //}
      }
    } )
    // loaderTexture.load(`${params.assetsPath}textures/SimpleAnimalsFarm.png`, function(texture) {
    // 	object.traverse( function ( child ) {
    // 		if ( child.isMesh ){
    // 			child.material.map = texture
    // 		}
    // 	} )
    // })
  })
}

function loadChicken1(plane) {
  loaderFBX.load(`${params.assetsPath}fbx/SA_Animal_Birds.fbx`, function(object){
    
    console.log("BIRD----------------")
    console.log(object)

    //params.farmhouse = object
    //params.colliders = []
    //object.rotation.y = 90 * (Math.PI/180) // 90 degrees in radians
    object.position.set(0, 0, 0)
    //object.scale.set(2.2, 2.2, 2.2)
    scene.add(object)
    object.traverse( function ( child ) {
      if ( child.isMesh ) {
        // if (child.name.startsWith("proxy")){
        // 	params.colliders.push(child)
        // 	child.material.visible = false
        // }else{
          child.castShadow = true
          child.receiveShadow = true
        //}
      }
    } )
    loaderTexture.load(`${params.assetsPath}textures/SimpleAnimalsFarm.png`, function(texture) {
      object.traverse( function ( child ) {
        if ( child.isMesh ){
          child.material.map = texture
        }
      } )
    })
  })
}

function loadChicken2(plane) {
  loaderFBX.load(`${params.assetsPath}fbx/SA_Animal_Pig.fbx`, function(object) {
  //loaderFBX.load( `${params.assetsPath}fbx/people/Trucker.fbx`, function (object) {
  //loaderFBX.load( `${params.assetsPath}characters/SK_Chr_Farmer_Male_01.fbx`, function (object) {

    console.log("object----------------")
    console.log(object)

    // object.mixer = new THREE.AnimationMixer( object )
    // mixers.push( object.mixer )
    // var action = object.mixer.clipAction( object.animations[ 0 ] )
    // action.play()
    // scene.add( object )

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
    scene.add(player.object)
    guiFolderPlayer.add(player.object, "visible").name("Show Chicken").listen()

    console.log("-----------------------")
    console.log("player.object----------------")
    console.log(player.object)
    console.log("-----------------------")


    //animate()
    // OR
    loadNextAnim(loaderFBX)
    // OR
    //loadEnvironment(loaderFBX)
    */
  } )
}

function loadChickenGLTF(plane) {
  
  loaderGLTF.load( `${params.assetsPath}gltf/Animals.glb`, function (object) {

    console.log("Animals object----------------")
    console.log(object)

    object.mixer = new THREE.AnimationMixer( object.scene )
    player.mixer = object.mixer
    player.root = object.mixer.getRoot()
      
    object.name = "Chicken Dance"
        
    object.scene.traverse( function ( child ) {
      if ( child.isMesh ) {
        child.castShadow = true
        child.receiveShadow = false		
      }
    } )

    player.object = new THREE.Object3D()
    player.object.add(object.scene)
    player.object.position.set(0, 0, 10)
    player.object.scale.set(4, 4, 4)
    player.object.rotation.x = Math.PI/2 // 90 degrees in radians
    player.mixer.timeScale = 0.5
    player.mixer.clipAction(object.animations[2]).play()
    
    //animations.Idle = object.animations[0]
    //setAction("Idle")
    plane.add(player.object)
    //guiFolderPlayer.add(player.object, "visible").name("Show Character").listen()

  } )
}

function loadChickGLTF(plane) {
  
  loaderGLTF.load( `${params.assetsPath}gltf/Chick.glb`, function (object) {

    let model = object.scene
    model.name = "Chick GLB"
    model.position.set(3, 0, 0)
    //model.rotation.y = 90 * (Math.PI/180) // 90 degrees in radians
    model.scale.set(2, 2, 2)
    model.traverse( function ( child ) {
      if ( child.isMesh ) child.castShadow = true
    } )
    scene.add(model)

    // helper = new THREE.SkeletonHelper(model)
    // helper.material.linewidth = 5
    // helper.visible = true
    // scene.add(helper)
    
    console.log("loadChickGLTF object")
    console.log(object)
    console.log("loadChickGLTF model")
    console.log(model)

    //guiFolderPlayer.add(model, "visible").name("Show Chicken").listen()

  } )
}

function loadHen(plane) {
  loaderFBX.load(`${params.assetsPath}Hen&Chicken_FBX/Hen_HP.fbx`, function(object){
    params.farmhouse = object
    params.colliders = []
    //object.rotation.y = 270 * (Math.PI/180) // 90 degrees in radians
    object.position.set(3, 0, 0)
    object.scale.set(0.05, 0.05, 0.05)

    object.traverse( function ( child ) {
      if ( child.isMesh ) {
        if (child.name.startsWith("proxy")){
          params.colliders.push(child)
          child.material.visible = false
        }else{
          child.castShadow = true
          child.receiveShadow = true
        }
      }
    } )

    loaderTexture.load(`${params.assetsPath}Hen&Chicken_FBX/Textures/Hen&Chicken_A.png`, function(texture) {
      object.traverse( function ( child ) {
        if ( child.isMesh ){
          child.material.map = texture

          console.log("loadHen child----------")
          console.log(child)
          console.log(child.geometry.attributes.uv)
          console.log("-----------------------")
        }
      } )
    })

    console.log("loadHen object----------------")
    console.log(object)

    scene.add(object)
  })
}

function loadHenGLTF(plane) {
  
  // loaderFBX.load( `${params.assetsPath}fbx/Building_Farm_House_02.fbx`, function (object) {
  loaderGLTF.load( `${params.assetsPath}gltf/Hen_HP.glb`, function (object) {

    let model = object.scene
    //model.name = "Hen"
    //model.position.set(10, 0, 0)
    //model.scale.set(0.2, 0.2, 0.2)
    model.traverse( function ( child ) {
      if ( child.isMesh ) child.castShadow = true
    } )
    scene.add(model)

    // helper = new THREE.SkeletonHelper(model)
    // helper.material.linewidth = 5
    // helper.visible = true
    // scene.add(helper)
    
    console.log("loadHenGLTF object----------------")
    console.log(object)
    console.log("loadHenGLTF model----------------")
    console.log(model)

    //guiFolderPlayer.add(model, "visible").name("Show Hen GLTF").listen()

  } )
}

function loadKitchenSink(plane) {
  loaderFBX.load(`${params.assetsPath}fbx/Prop_KitchenSink_Black.fbx`, function(object){
    params.farmhouse = object
    params.colliders = []
    object.rotation.y = 270 * (Math.PI/180) // 90 degrees in radians
    object.position.set(0, 0, 10)
    //object.scale.set(0.025, 0.025, 0.025)
    object.scale.set(2.2, 2.2, 2.2)
    scene.add(object)
    object.traverse( function ( child ) {
      if ( child.isMesh ) {
        if (child.name.startsWith("proxy")){
          params.colliders.push(child)
          child.material.visible = false
        }else{
          child.castShadow = true
          child.receiveShadow = true
        }
      }
    } )
    //loaderTexture.load(`${params.assetsPath}textures/PolygonFarm_Texture_01_A.png`, function(texture) {
    loaderTexture.load(`${params.assetsPath}textures/SimpleInteriorsHouses.png`, function(texture) {
      object.traverse( function ( child ) {
        if ( child.isMesh ){
          child.material.map = texture
        }
      } )
    })
  })
}

function loadChickenFree(plane) {
  loaderOBJ.load(`${params.assetsPath}obj/chicken_01.obj`, function(object){
    // params.farmhouse = object
    // params.colliders = []
    //object.rotation.y = 270 * (Math.PI/180) // 90 degrees in radians
    //object.position.set(0, 0, 10)
    //object.scale.set(0.025, 0.025, 0.025)
    //object.scale.set(2.2, 2.2, 2.2)
    scene.add(object)
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

function loadRooster(plane) {
  loaderFBX.load(`${params.assetsPath}fbx/rooster_1.0.1.fbx`, function(object){
    // params.farmhouse = object
    // params.colliders = []
    //object.rotation.y = 270 * (Math.PI/180) // 90 degrees in radians
    object.position.set(0, 0, 10)
    object.scale.set(0.025, 0.025, 0.025)
    //object.scale.set(2.2, 2.2, 2.2)
    scene.add(object)
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

function loadRoad(plane) {

  let i
  let count = 8
  let startX = -45
  let offsetX = 0
  let startZ = -138
  let offsetZ = 20

  const roadPromise1 = new Promise((resolve, reject) => {

    // ROAD A
    for ( i = 1;i <= count;i++ ) {
      loaderFBX.load(`${params.assetsPath}fbx/SM_Env_Road_Gravel_Straight_01.fbx`, function(object) {
        
        // console.log("ROAD object", object)

        //params.farmhouse = object
        //params.colliders = []
        //object.rotation.y = 90 * (Math.PI/180) // 90 degrees in radians
        object.position.set(startX, 0, startZ)
        startX = startX + offsetX
        startZ = startZ + offsetZ
        console.log("ROAD A startX, startZ", startX, startZ)
        object.scale.set(0.02, 0.01, 0.02)
        object.traverse( function (child) {
          if (child.isMesh) {
            // if (child.name.startsWith("proxy")) {
            // 	params.colliders.push(child)
            // 	child.material.visible = false
            // } else {
              child.castShadow = true
              child.receiveShadow = true
            // }
          }
        } )
        loaderTexture.load(`${params.assetsPath}textures/PolygonFarm_Texture_03_A.png`, function(texture) {
          object.traverse( function (child) {
            if (child.isMesh) {
              //child.material.color.setHex(0x000000)
              child.material.transparent = true
              child.material.opacity = 0.7
              //child.material.depthWrite = true
              child.material.map = texture
            }
          } )
        })
        
        scene.add(object)
        
        //console.log("ROAD A object", object)
      })

    }
    resolve(startX, startZ)
  })
  roadPromise1.then((startX, startZ) => {
    // ROAD T
    for ( i = 1;i <= 1;i++ ) {
      loaderFBX.load(`${params.assetsPath}fbx/SM_Env_Road_Gravel_T_Section_01.fbx`, function(object) {
        
        console.log("ROAD T startX, startZ", startX, startZ)

        //params.farmhouse = object
        //params.colliders = []
        //object.rotation.y = 90 * (Math.PI/180) // 90 degrees in radians
        object.position.set(startX, 0, startZ)
        startX = startX + offsetX
        startZ = startZ + offsetZ
        console.log("ROAD T startX, startZ", startX, startZ)
        object.scale.set(0.02, 0.01, 0.02)
        object.traverse( function (child) {
          if (child.isMesh) {
            // if (child.name.startsWith("proxy")) {
            // 	params.colliders.push(child)
            // 	child.material.visible = false
            // } else {
              child.castShadow = true
              child.receiveShadow = true
            // }
          }
        } )
        loaderTexture.load(`${params.assetsPath}textures/PolygonFarm_Texture_03_A.png`, function(texture) {
          object.traverse( function ( child ) {
            if ( child.isMesh ){
              //child.material.color.setHex(0x000000)
              child.material.transparent = true
              child.material.opacity = 0.7
              //child.material.depthWrite = true
              child.material.map = texture
            }
          } )
        })
        
        scene.add(object)
        
        //console.log("ROAD T object", object)
      })

    }

  })

}

/**
 * POINTER HOVERS + CLICKS
 */

// when the pointer moves and hovers
function watchPointer(camera, targetList) {

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
  } catch(e) {
    intersects = []
  }

  // if there is one (or more) intersections
  if ( intersects.length > 0 ) {

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
    if ( intersects[0].object != params.intersectedObject1 ) {

      // restore previous intersection object (if it exists) to its original color
      if ( params.intersectedObject1 ) {
        if ( params.intersectedObject1.material.constructor.name == "Array" ) {
          for (let i = 0;i < params.intersectedObject1.material.length;i++) {
            params.intersectedObject1.material[i].color.setHex( params.intersectedObject1.currentHex )
          }
        } 
        else {
          params.intersectedObject1.material.color.setHex( params.intersectedObject1.currentHex )
        }
      }

      // store reference to closest object as current intersection object
      params.intersectedObject1 = intersects[0].object

      // console.log("params.intersectedObject1, params.intersectedObject1)

      if ( params.intersectedObject1.material.constructor.name == "Array" ) {
        // SEPARATE FOR LOOPS !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        // store color of closest object (for later restoration)
        for (let i = 0;i < params.intersectedObject1.material.length;i++) {
          params.intersectedObject1.currentHex = params.intersectedObject1.material[i].color.getHex()
        }
        // set a new color for closest object
        for (let i = 0;i < params.intersectedObject1.material.length;i++) {
          params.intersectedObject1.material[i].color.setHex( 0xdddd00 )
        }
        // SEPARATE FOR LOOPS !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      } 
      else {
        // store color of closest object (for later restoration)
        params.intersectedObject1.currentHex = params.intersectedObject1.material.color.getHex()
        // set a new color for closest object
        params.intersectedObject1.material.color.setHex( 0xdddd00 )
      }
      
    }
  } 
  // there are no intersections
  else {
    // restore previous intersection object (if it exists) to its original color
    if ( params.intersectedObject1 ) {
      if ( params.intersectedObject1.material.constructor.name == "Array" ) {
        for (let i = 0;i < params.intersectedObject1.material.length;i++) {
          params.intersectedObject1.material[i].color.setHex( params.intersectedObject1.currentHex )
        }
      } 
      else {
        params.intersectedObject1.material.color.setHex( params.intersectedObject1.currentHex )
      }
    }
    // remove previous intersection object reference
    // by setting current intersection object to "nothing"
    params.intersectedObject1 = null
  }
}

// when the pointer moves, call the given function
//document.addEventListener( "pointermove", onPointerMove, false )
function onPointerMove( event ) {

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
  
  console.log("event ****************************************", event)

  // the following line would stop any other event handler from firing
  // (such as the pointer's TrackballControls)
  event.preventDefault()
  
  // update the pointer variable
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1
  // pointer.x = (event.offsetX / canvas.clientWidth) * 2 - 1
  // pointer.y = -(event.offsetY / canvas.clientHeight) * 2 + 1
  // pointer.x = (event.offsetX / (window.innerWidth - 240)) * 2 - 1
  // pointer.y = -(event.offsetY / (window.innerHeight - 100)) * 2 + 1
  console.log("pointer clicked x y", pointer.x, pointer.y)

  // find intersections
  raycaster2.setFromCamera(pointer, event.target.camera)
  // raycaster2.set( 
  // 	event.target.camera.getWorldPosition(), 
  // 	event.target.camera.getWorldDirection() 
  // )
  console.log("raycaster2", raycaster2)

  // create an array containing all objects in the scene with which the raycaster2 intersects
  //var intersects = raycaster2.intersectObjects(event.target.targetList)
  const intersects = raycaster2.intersectObjects(event.target.targetList)
  console.log("intersects", intersects)
  
  // if there is one (or more) intersections
  if (intersects.length > 0) {
    //console.log("Hit @ " + xyzToString( intersects[0].point ) )
    // change the color of the closest face.
    // intersects[0].face.color.setRGB( 0.8 * Math.random() + 0.2, 0, 0 ) 
    // intersects[0].object.geometry.colorsNeedUpdate = true

    // if the closest object intersected is not the currently stored intersection object
    const theIntersectedObject = intersects[0].object
    
    // for testing only
    // if ( theIntersectedObject != params.intersectedObject2 ) {
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
    if ( params.intersectedObject2 ) {
      //params.intersectedObject2.material[i].color.setHex( params.intersectedObject2.currentHex )
      // zoom out
      //panCam(100, 200, 200, 800, event.target.camera, event.target.controls)
    } 
    else {
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
    // if (event.button == 2) {
    // 	// zoom in
    // 	panCam(params.intersectedObject2.position.x, params.intersectedObject2.position.y, params.intersectedObject2.position.z, 1200, event.target.camera, event.target.controls)
    // } else if (event.button == 1) {
    // 	// zoom out
    // 	panCam(100, 200, 200, 1200, event.target.camera, event.target.controls)
    // }
    // console.log("------------------")
    // console.log("event.target.controls--------")
    // console.log(event.target.controls)
    // console.log("------------------")

    // show/hide infospheres
    if ( params.intersectedObject2.userData.type === "structure" && event.button == 0 ) {

      let infospotObject = scene.getObjectByName( `INFOSPOT: ${params.intersectedObject2.name}` ) // , true for recursive
      if ( infospotObject ) {
        if (infospotObject.visible === true) {
          infospotObject.visible = false
        }
        else {
          infospotObject.visible = true
        }
      }
      // console.log("infospotObject", infospotObject)
    }

    // show/hide annotations
    params.intersectedObject2.children.forEach( function(key) {
      // console.log("--------------------------------------")
      // console.log("key (pre-process)------")
      // console.log(`key.type: ${key.type}`)
      // console.log(`key.visible: ${key.visible}`)
      // console.log(`key.element.hidden: ${key.element.hidden}`)
      // console.log(key)
      // console.log("--------------------------------------")
      // if ( key.type === "Sprite" && event.button == 1 ) {
      // 	if (key.visible === true) {
      // 		key.visible = false
      // 	}
      // 	else {
      // 		key.visible = true
      // 	}
      // }
      if ( key.type === "Object3D" && event.button == 0 ) {
        if (key.element.hidden === true) {
        //if (key.visible == false) {
          // console.log("-------------------------")
          // console.log("TRUE------")
          // console.log(key.element.hidden)
          // console.log("-------------------------")
          key.element.hidden = false
          key.element.style.display = "block"
          key.visible = true // does nothing, but keeps status accurate
        }
        else {
          // console.log("-------------------------")
          // console.log("FALSE------")
          // console.log(key.element.hidden)
          // console.log("-------------------------")
          key.element.hidden = true
          key.element.style.display = "none"
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

  } 
  else // there are no intersections
  {
    // restore previous intersection object (if it exists) to its original color
    if ( params.intersectedObject2 ) {
      //params.intersectedObject2.material.color.setHex( params.intersectedObject2.currentHex )
    }
    // remove previous intersection object reference by setting current intersection object to "nothing"
    params.intersectedObject2 = null
  }

}
// OR
// document.addEventListener( "mousedown", onDocumentMouseDown, false )
function onDocumentMouseDown( e ) {
  e.preventDefault();

  var mouseVector = new THREE.Vector3(
    ( e.clientX / window.innerWidth ) * 2 - 1,
    - ( e.clientY / window.innerHeight) * 2 + 1,
    1 
  );

  projector.unprojectVector( mouseVector, camera );
  var raycaster = new THREE.Raycaster( camera.position, mouseVector.subSelf( camera.position ).normalize() );

  // create an array containing all objects in the scene with which the ray intersects
  var intersects = raycaster.intersectObjects( scene.children );
  console.log(intersects);
  if (intersects.length>0){
    console.log("Intersected object:", intersects.length);
    intersects[ 0 ].object.material.color.setHex( Math.random() * 0xffffff );
  }
}

/**
 * GET FEATURED IMAGE
 */
function getFeaturedImage( postObject ) {
  let featImage = {}
  // If there is no featured image, exit the function returning blank.
  if ( 0 === postObject.featured_media ) {
    return featImage
  } 
  else {
    featImage.featuredObject = postObject._embedded["wp:featuredmedia"][0]
    featImage.imgUrl = featImage.featuredObject.source_url
    featImage.imgMediumUrl = ""
    featImage.imgLargeUrl = ""
    featImage.imgWidth = featImage.featuredObject.media_details.width
    featImage.imgHeight = featImage.featuredObject.media_details.height
    if (featImage.featuredObject.media_details.sizes.hasOwnProperty("large")) {
      featImage.imgWidth = featImage.featuredObject.media_details.sizes.full.width
      featImage.imgHeight = featImage.featuredObject.media_details.sizes.full.height
      featImage.imgLargeUrl = featImage.featuredObject.media_details.sizes.large.source_url +  " 1024w, "
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
Array.prototype.inArray = function(comparer) { 
    for(let i = 0;i < this.length;i++) { 
        if (comparer(this[i])) return true
    }
    return false
} 
// adds an element to the array 
// if it does not already exist using a comparer function
Array.prototype.pushIfNotExist = function(element, comparer) { 
    if (!this.inArray(comparer)) {
        this.push(element)
    }
} 

/**
 * PLAYER "CHARACTER" ACTION
 */
function setAction(name) {
  const action = player.mixer.clipAction( animations[name] )
  action.time = 0
  console.log("CHARACTER: action name", name)
  //console.log("CHARACTER: animations[name]", animations[name])
  //console.log("CHARACTER: action object", action)
  player.mixer.stopAllAction()
  player.action = name
  player.actionTime = Date.now()
  //console.log("player", player)
  //action.fadeIn(0.5) // causes arms to move awkwardly
  action.play()
}

function getAction() {
  if (player === undefined || player.action === undefined) {
    return "doesn't exist yet"
  }
  return player.action
}

function toggleAnimation() {
  if ( player.action == "Idle" ) {
    setAction("Pointing Gesture")
  }
  else {
    setAction("Idle")
  }
}

function movePlayer(dt){
  const pos = player.object.position.clone()
  pos.y += 60
  let dir = new THREE.Vector3()
  player.object.getWorldDirection(dir)
  if (player.move.forward<0) dir.negate()
  let raycaster = new THREE.Raycaster(pos, dir)
  let blocked = false
  const colliders = params.colliders

  // if (colliders!==undefined){
  // 	const intersect = raycaster.intersectObjects(colliders)
  // 	if (intersect.length>0){
  // 		if (intersect[0].distance<50) blocked = true
  // 	}
  // }
  
  if (!blocked){
    if (player.move.forward>0){
      const speed = (player.action=="Running") ? 24 : 8
      player.object.translateZ(dt*speed)
    }
    else if ( player.move.forward < 0 ) {
      player.object.translateZ(-dt*2)
    }
  }
  
  /** COLLIDERS
  if (colliders!==undefined){
    //cast left
    dir.set(-1,0,0)
    dir.applyMatrix4(player.object.matrix)
    dir.normalize()
    raycaster = new THREE.Raycaster(pos, dir)

    let intersect = raycaster.intersectObjects(colliders)
    if (intersect.length>0){
      if (intersect[0].distance<50) player.object.translateX(100-intersect[0].distance)
    }
    
    //cast right
    dir.set(1,0,0)
    dir.applyMatrix4(player.object.matrix)
    dir.normalize()
    raycaster = new THREE.Raycaster(pos, dir)

    intersect = raycaster.intersectObjects(colliders)
    if (intersect.length>0){
      if (intersect[0].distance<50) player.object.translateX(intersect[0].distance-100)
    }
    
    //cast down
    dir.set(0,-1,0)
    pos.y += 200
    raycaster = new THREE.Raycaster(pos, dir)
    const gravity = 30

    intersect = raycaster.intersectObjects(colliders)
    if (intersect.length>0){
      const targetY = pos.y - intersect[0].distance
      if (targetY > player.object.position.y){
        //Going up
        player.object.position.y = 0.8 * player.object.position.y + 0.2 * targetY
        player.velocityY = 0
      }else if (targetY < player.object.position.y){
        //Falling
        if (player.velocityY==undefined) player.velocityY = 0
        player.velocityY += dt * gravity
        player.object.position.y -= player.velocityY
        if (player.object.position.y < targetY){
          player.velocityY = 0
          player.object.position.y = targetY
        }
      }
    }else if (player.object.position.y>0){
      if (player.velocityY==undefined) player.velocityY = 0
      player.velocityY += dt * gravity
      player.object.position.y -= player.velocityY
      if (player.object.position.y < 0){
        player.velocityY = 0
        player.object.position.y = 0
      }
    }
  }
  */
  
  player.object.rotateY(player.move.turn*dt)
}

function playerControl(forward, turn) {
  
  turn = -turn

  if ( forward > 0.2 ) {
    if ( player.action != "Walking" && player.action != "Running" ) {
      setAction("Walking")
    }
  } 
  else if ( forward < -0.2 ) {
    if ( player.action != "Walking Backwards" ) {
      setAction("Walking Backwards")
    }
  } 
  else {
    forward = 0
    if ( Math.abs(turn) > 0.05 ) {
      if ( player.action != "Left Turn" ) {
        setAction("Left Turn")
      }
    } 
    else if ( player.action != "Idle" ) {
      setAction("Idle")
    }
    // else {
    // 	setAction("Idle")
    // }
    }

    // if ( forward == 0 && turn == 0 ) {
    //   player.move = {}
    // } 
  // else {
    player.move = { forward, turn }
  // }
}

/** ANIMATE + RENDER (continuous rendering) ******************************************** */
  
const animate = () => {

  const dt = clock.getDelta()
  //watchPointer(camera, plane.children)
  controls.update()
  TWEEN.update()

  requestAnimationFrame(animate)

  /** ANIMATE SCENE? */
  if ( params.ANIMATE ) {
    // plane.rotation.x += 0.002
    // plane.rotation.y += 0.002
    plane.rotation.z -= 0.0007
  }

  /** PLAYER CHARACTER */
  if ( player.mixer !== undefined ) {
    player.mixer.update(dt)
  }
  
  // Running
  if ( player.action == "Walking" ) {
    const elapsedTime = Date.now() - player.actionTime
    if ( elapsedTime > 2000 && player.move.forward > 0.7 ){
      //setAction("Running")
    }
  }
  
  // Move Player
  if ( player.move !== undefined ) {
    movePlayer(dt)
  }
  
  // Move Cameras
  if ( player.cameras != undefined && player.cameras.active != undefined ) {
    camera.position.lerp( player.cameras.active.getWorldPosition(new THREE.Vector3()), 0.05 )
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
const loadAssets = (plane) => {

  params.mode = params.modes.LOADING
  console.log("params.mode", params.mode)

  /** FBX ******************************************************************************** */
  
  //loaderFBX.load( `${params.assetsPath}characters/SimplePeople.fbx`, function (object) {
  //loaderFBX.load( `${params.assetsPath}fbx/people/FireFighter.fbx`, function (object) {
  //loaderFBX.load( `${params.assetsPath}fbx/people/Trucker.fbx`, function (object) {
  loaderFBX.load( `${params.assetsPath}characters/SK_Chr_Farmer_Male_01.fbx`, function (object) {

    object.mixer = new THREE.AnimationMixer( object )
    player.mixer = object.mixer
    player.root = object.mixer.getRoot()
      
    object.name = "Gardener"
    
    object.traverse( function ( child ) {
      if ( child.isMesh ) {
        child.castShadow = true
        child.receiveShadow = false		
      }
    } )

    //loaderTexture.load(`${params.assetsPath}images/SimpleFarmer_Farmer_Brown.png`, function(texture) {
    loaderTexture.load(`${params.assetsPath}textures/PolygonFarm_Texture_01_B.png`, function(texture) {
      object.traverse( function ( child ) {
        if ( child.isMesh ){
          child.material.map = texture
        }
      } )
    })

    // console.log("object", object)

    player.object = new THREE.Object3D()
    player.object.add(object)
    //player.object.scale.set(0.022, 0.022, 0.022)
    player.object.scale.set(0.033, 0.033, 0.033)
    player.object.rotation.x = Math.PI/2 // 90 degrees in radians
    //player.mixer.clipAction(object.animations[0]).play()
    //animations.Idle = object.animations[0]
    //setAction("Idle")

    // console.log("player.object", player.object)
    plane.add(player.object)
    guiFolderPlayer.add(player.object, "visible").name("Show Character").listen()

  } )

  /** LOAD 3D OBJECTS ******************************************************************** */

  loadFarmHouse(plane)
  
  loadRoad(plane)

  //loadKitchenSink(plane)
  
  loadChickenCoop(plane)

  loadChicken(plane) // PRIMARY WORKING CHICKEN (GLTF)
  //loadHen(plane)
  //loadHenGLTF(plane)
  //loadRooster(plane)
  //loadChickenGLTF(plane)
  //loadChickGLTF(plane)
  //loadChickenFree(plane)

  /**
   * LOAD ANIMATIONS
   */
  let loadNextAnim = function (loader) {
    let anim = anims.pop()
    // console.log("anim", anim)
    loader.load( `${params.assetsPath}fbx/anims2/${anim}.fbx`, function(object) {
      // console.log("object")
      animations[anim] = object.animations[0]
      if (anims.length > 0){
        // console.log("anims.length")
        // console.log("getAction()")
        // console.log("player.action")
        loadNextAnim(loader)
      } 
      else {
        // console.log("anims.length")
        anims = []
      }
    })	
  }
  // RECURSIVE FUNCTION TO LOAD ANIMATIONS
  loadNextAnim(loaderFBX)

} // end loadAssets()

/** 
 * BEGIN BUILD (MAIN/INIT)
 * ****************************************************** */
const build = async () => {

  params.mode = params.modes.BUILDING
  console.log("params.mode", params.mode)

  console.log("building ********************************* ")

  try {
    let a1 = await getSceneData()

    console.log("a1 boolean getSceneData", a1, new Date().toISOString())
    console.log("data retrieved ************************* ")

    let a2 = await buildScene(a1)
    console.log("a2 plane returned from buildScene", a2, new Date().toISOString())

    let a3 = async function(a4) {
      console.log("a4 plane object returned from buildScene", a4, new Date().toISOString())
      params.mode = params.modes.BUILT
      console.log("params.mode", params.mode)
      console.log("scene built ************************** ")
      loadAssets(a2)
      console.log("loading assets *********************** ")
    }
    await a3(a2)
    console.log("a3 boolean (complete)", a3, new Date().toISOString())

  } catch (e) {
    console.log("error ***", e.message, e)
  }

  // const preloader = new Preloader(options)
  // console.log("preloader", preloader)

} // end build()

const getSceneData = async () => {
  
  // get data
  let getDataFromLocalStorage = true

  // LOCALSTORAGE -- look for data in localStorage first
  if (localStorage && getDataFromLocalStorage && !debug) {
    const getdata = localStorage.getItem('threedgarden') || ""
    const threedgarden = JSON.parse(getdata)
    if (threedgarden != undefined) {
      console.log("LOCALSTORAGE ITEM RETRIEVED", threedgarden)
      //this.threedgarden = threedgarden
      params.data = threedgarden.data
    } else {
      console.log("LOCALSTORAGE ITEM NOT RETRIEVED", threedgarden)
      getDataFromLocalStorage = false
    }
  } else {
    console.log("LOCALSTORAGE NOT AVAILABLE")
    getDataFromLocalStorage = false
  }

  if (1 === 0 || !getDataFromLocalStorage) {

    // PROMISE REST API -- call WP Rest API for data second
    await Promise.allSettled(
      api_urls.map(
        url => fetch(url)
              .then(results => results.json())
              .then(data => {
                let type = data[0].type
                switch (type) {
                  case "scene" :
                    params.data.scene = [...data]
                    break
                  case "allotment" :
                    params.data.allotment = [...data]
                    break
                  case "bed" :
                    params.data.bed = [...data]
                    break
                  case "plant" :
                    params.data.plant = [...data]
                    break
                  case "planting_plan" :
                    params.data.planting_plan = [...data]
                    break
                  default :
                    break
                }
                console.log("data", data)
              })
      )
    )
    .then(results => {
        console.log("results", results)
        results.forEach((result, num) => {
          if (result.status == "fulfilled") {
            //alert(`${urls[num]}: ${result.value.status}`)
            //console.log(result)
          }
          if (result.status == "rejected") {
            //alert(`${urls[num]}: ${result.reason}`)
            console.log(result)
          }
        })
        console.log("params.data", params.data)

        // save to localStorage
        localStorage.setItem('threedgarden', JSON.stringify(params))

        // fulfill Promise?
        return true
      }
    )
  } 
  else if (getDataFromLocalStorage) {
    // fulfill Promise?
    return true
  } 
  else {
    // fulfill Promise?
    return false
  }
}

/** 
 * BUILD SCENE
 * *************************************************************************************** */
const buildScene = async (a5) => {

  console.log("a5 boolean === a1 boolean", a5)

  params.mode = params.modes.BUILDING
  console.log("params.mode", params.mode)

  console.log("params.data.scene", params.data.scene)

  let wpScene = params.data.scene[0]
  let sceneID = wpScene.id

  // console.log("wpScene", wpScene)

  /** THREE JS SCENE ******************************************************************* */

  scene = new THREE.Scene()
  
  scene.name = wpScene.title.rendered

  console.log("scene", scene)

  // load the 3D cube map?
  if ( wpScene.acf.scene_background_image_px ) {
    let cubeMapURLs = [
      wpScene.acf.scene_background_image_px,
      wpScene.acf.scene_background_image_nx,
      wpScene.acf.scene_background_image_py,
      wpScene.acf.scene_background_image_ny,
      wpScene.acf.scene_background_image_pz,
      wpScene.acf.scene_background_image_nz
    ]
    let reflectionCube = new THREE.CubeTextureLoader().load(cubeMapURLs)
    reflectionCube.format = THREE.RGBFormat
    scene.background = reflectionCube
  }
  // load the 2D background image?
  else if ( wpScene.acf.scene_background_image ) {
    // let bgTexture = loaderTexture.load(wpScene.acf.scene_background_image)
    // scene.background = bgTexture
    let bgTexture = loaderTexture.load(
      wpScene.acf.scene_background_image,
      () => {
        const rt = new THREE.WebGLCubeRenderTarget(bgTexture.image.height)
        rt.fromEquirectangularTexture(renderer, bgTexture)
        scene.background = rt
      }
    )
  }
  // load the background color?
  else if ( wpScene.acf.scene_background_color ) {
    scene.background = new THREE.Color(wpScene.acf.scene_background_color)
    //scene.fog = new THREE.Fog(0xFFFFFF, 0, 500)
  }

  /** GEOMETRIES *********************************************************************** */
  
  let plane = getPlane(
    wpScene.acf.scene_plane_width_x, 
    wpScene.acf.scene_plane_length_y, 
    wpScene.acf.scene_plane_background_color
  )
  plane.name = "plane-jane"
  plane.rotation.x = -Math.PI / 2 // -90 degrees in radians
  //plane.position.z = 10
  //plane.rotation.z += 0.002
  guiFolderRotation.add(plane.rotation, "x", -Math.PI, Math.PI).listen()
  guiFolderRotation.add(plane.rotation, "y", -Math.PI, Math.PI).listen()
  guiFolderRotation.add(plane.rotation, "z", -Math.PI, Math.PI).listen()

  /** TEXTURES ************************************************************************* */

  if ( wpScene.acf.scene_plane_texture_image ) {
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

  //let ambientLight = getAmbientLight(0xFFFFFF, 0.1)
  //ambientLight.position.set( -100, -100, 25 )

  //let shadowIntensity = 0.5;// between 0 and 1 -- suggestion

  let directionalLight = getDirectionalLight(0xFFFFFF, 1.6)
  directionalLight.position.set( -90, -120, 120 )
  directionalLight.castShadow = true
  //directionalLight.intensity = 1.6

  let helperDirectionalLight = new THREE.CameraHelper(directionalLight.shadow.camera)
  helperDirectionalLight.visible = false

  //let directionalLight2 = directionalLight.clone()
  let directionalLight2 = getDirectionalLight(0xFFFFFF, 1.0)
  directionalLight2.position.set( 90, 120, 120 ) // direct opposite x,y of primary
  directionalLight2.castShadow = false
  //directionalLight2.intensity = 1.0

  let helperDirectionalLight2 = new THREE.CameraHelper(directionalLight2.shadow.camera)
  helperDirectionalLight2.visible = true
  
  guiFolderLights.add(helperDirectionalLight, "visible", 0, 20).name("Show Light Helper")
  guiFolderLights.add(directionalLight, "intensity", 0, 20)
  guiFolderLights.add(directionalLight.position, "x", -500, 500)
  guiFolderLights.add(directionalLight.position, "y", -500, 500)
  guiFolderLights.add(directionalLight.position, "z", -500, 500)

  guiFolderLights.add(helperDirectionalLight2, "visible", 0, 20).name("Show Light 2 Helper")
  guiFolderLights.add(directionalLight2, "intensity", 0, 20)
  guiFolderLights.add(directionalLight2.position, "x", -500, 500)
  guiFolderLights.add(directionalLight2.position, "y", -500, 500)
  guiFolderLights.add(directionalLight2.position, "z", -500, 500)

  /** SCENE ***************************************************************************** */

  // add objects to scene
  //plane.add(structure)
  //plane.add(pointLight)
  //plane.add(spotLight)
  plane.add(directionalLight)
  plane.add(directionalLight2)
  //plane.add(ambientLight)
  scene.add(helperDirectionalLight)
  scene.add(helperDirectionalLight2)
  scene.add(plane)

  /** CAMERA **************************************************************************** */

  camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth/window.innerHeight,
    0.1,
    1000
  )
  camera.name = "gardencam1"
  camera.position.set(86, 64, 182)
  //camera.lookAt(new THREE.Vector3(0, 0, 0)) // overridden by OrbitControls.target

  let helperCamera = new THREE.CameraHelper(camera)
  helperCamera.visible = false
  scene.add(helperCamera)

  guiFolderCameras.add(helperCamera, "visible", 0, 20).name("Show Camera Helper")
  guiFolderCameras.add(camera.position, "x", -500, 500).listen()
  guiFolderCameras.add(camera.position, "y", -500, 500).listen()
  guiFolderCameras.add(camera.position, "z", -500, 500).listen()

  /** RENDERER ************************************************************************** */
  
  renderer = new THREE.WebGLRenderer(
    {
      alpha: true, 
      antialias: true 
    }
  )
  renderer.shadowMap.enabled = true
  //renderer.setSize(window.innerWidth - 240, window.innerHeight - 100) //admin
  renderer.setSize(window.innerWidth -100, window.innerHeight) //public

  // utilize javascript prototyping.. add variables to the dom element :)
  renderer.domElement.camera = camera
  renderer.domElement.targetList = plane.children
  
  renderer.domElement.addEventListener("pointermove", onPointerMove, false)
  renderer.domElement.addEventListener("pointerdown", onPointerDown, false)
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
  controls.maxPolarAngle = Math.PI/2 - .04
  controls.target = new THREE.Vector3(0, 0, 0) // where the camera actually points
  //controls.target.set(0, 5, 0) // alternate way of setting target of camera

  renderer.domElement.controls = controls
  
  /** LOAD CAMERAS *********************************************************************** */
  
  //createCameras()
  

  /** WEBGL CANVAS *********************************************************************** */

  // console.log("document", document)
  container = document.getElementById("webgl")
  // console.log("container", container)
  canvas = renderer.domElement
  // console.log("canvas = renderer.domElement", canvas)
  container.append(gui.domElement)
  container.append(renderer.domElement)


  /** JOYSTICK <+> *********************************************************************** */

  // OG working
  let joystick = new JoyStick({
  	onMove: playerControl,
  	game: container // document.querySelector("#webgl")
  })
  console.log("joystick", joystick)

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

  //alert("HEY HEY HEY: BUILD ALLOTMENTS?")
  //return null

  buildAllotments(
    params.data.allotment, 
    plane, 
    sceneID // the post-to-post relationship <3
  )

  // fulfill Promise
  // return true
  return plane

} // end buildScene

/**
 * BUILD "ALLOTMENTS" FROM REST API POST OBJECT ************************************************************
 */
function buildAllotments(postObject, plane, sceneID) {

  console.log("ALLOTMENTS", postObject)

  //alert("HEY HEY HEY: BUILD ALLOTMENTS..")
  
  var filteredPostObject = postObject.filter(function (obj) {
    return obj.acf.allotment_scene == sceneID
  })
  // console.log("filteredPostObject", filteredPostObject)

  filteredPostObject.forEach( function(key) {

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
    structure.userData.type = "structure"
    structure.userData.postID = allotment.postID
    structure.userData.description = allotment.description
    structure.userData.annotation = allotment.title
    structure.userData.link = allotment.link
    structure.position.x = allotment.position.x
    structure.position.y = allotment.position.y
    structure.position.z = (structure.geometry.parameters.depth / 2) + allotment.position.z // - 10 for gap between plane
    structure.material.roughness = 0.9
    if (allotment.images.texture != null && allotment.images.texture != false) {
      structure.material.map = loaderTexture.load(allotment.images.texture)
      for (let i = 0;i < structure.material.length;i++) {
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
      structure.position.x, structure.position.y, 0 //structure.position.z
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
    return obj.acf.bed_allotment == allotmentID
  })
  // console.log("filteredPostObject", filteredPostObject)

  filteredPostObject.forEach( function(key) {

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
    bed.position.z = parseInt(key.acf.bed_position_z) / 12 + (bed.parameters.z / 2) // + posOffsetZ
    bed.images.texture = key.acf.bed_texture_image
    bed.images.featured = getFeaturedImage(key)
    bed.shape = key.acf.bed_shape
    bed.color = key.acf.bed_color
    bed.title = key.title.rendered
    bed.postID = key.id
    bed.description = key.content.rendered
    bed.link = key.link

    // console.log("bed", bed)

    let structure = getGeometry(
      bed.shape,
      bed.parameters.x, 
      bed.parameters.y, 
      bed.parameters.z, 
      bed.color
    )
    structure.name = bed.title
    structure.userData.type = "structure"
    structure.userData.postID = bed.postID
    structure.userData.description = bed.description
    structure.userData.annotation = bed.title
    structure.userData.link = bed.link
    structure.position.x = bed.position.x ? bed.position.x : 0
    structure.position.y = bed.position.y ? bed.position.y : 0
    structure.position.z = bed.position.z ? bed.position.z : 0
    //structure.rotation.x = -Math.PI / 2 // -90 degrees in radians
    structure.material.roughness = 0.9
    if (bed.images.texture != null && bed.images.texture != false) {
      structure.material.map = loaderTexture.load(bed.images.texture)
      for (let i = 0;i < structure.material.length;i++) {
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
      structure.position.x, structure.position.y, 0 //structure.position.z
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
    obj.acf.planting_plan_bed_plant_schedule.forEach(function(i) {
      if ( i.planting_plan_bed == bedID ) {
        //console.log("MATCHED at: ", i)
        //matches.push(i)
        //matches.push(obj)
        matches.pushIfNotExist(obj, function(e) {
          return e.id === obj.id 
        })
      }
    })
    filteredPostObject = [...matches]
  })

  if ( filteredPostObject.length > 0 ) {
    console.log("filteredPostObject", filteredPostObject)
  }

  // for each planting plan..
  filteredPostObject.forEach( function(key) {

    // console.log("-------------------------")
    // console.log("key.id (filteredPostObject)")
    // console.log(key.id)
    // console.log(key)
    // console.log("-------------------------")

    // for each planting plan bed-plant schedule..
    key.acf.planting_plan_bed_plant_schedule.forEach(function(key2) {
      
      // console.log("key2", key2)

      // only for this bed..
      if ( key2.planting_plan_bed == bedID ) {
      
        // show this plant (or multiple plants) in this bed..
        var filteredPlant = params.data.plant.filter(function (obj) {
          return obj.id == key2.planting_plan_plant
        })

        // console.log("filteredPlant", filteredPlant)

        // for this plant in this bed..
        filteredPlant.forEach(function(key3) {

          // console.log("key3", key3)

          let plant = {}
          plant.parameters = {}
          plant.position = {}
          plant.images = {}
          plant.parameters.x = Number(key3.acf.plant_width ) / 12
          plant.parameters.y = Number(key3.acf.plant_length) / 12
          plant.parameters.z = Number(key3.acf.plant_height) / 12
          plant.position.x = parseInt(key2.plant_position_x) / 12 + posOffsetX
          plant.position.y = parseInt(key2.plant_position_y) / 12 + posOffsetY
          plant.position.z = parseInt(key2.plant_position_z) / 12 + (plant.parameters.z / 2) // + posOffsetZ
          plant.images.texture = key3.acf.plant_texture_image
          plant.images.featured = getFeaturedImage(key)
          plant.shape = key3.acf.plant_shape
          plant.color = key3.acf.plant_color
          plant.title = key3.title.rendered
          plant.postID = key3.id
          plant.description = key3.content.rendered
          plant.link = key3.link

          console.log("PLANT", plant)

          let structure = getGeometry(
            plant.shape, // "Tree", "Bush", "Box",
            plant.parameters.x, 
            plant.parameters.y, 
            plant.parameters.z, 
            plant.color
          )
          structure.name = plant.title
          structure.userData.type = "structure"
          structure.userData.postID = plant.postID
          structure.userData.description = plant.description
          structure.userData.annotation = plant.title
          structure.userData.link = plant.link
          structure.position.x = plant.position.x ? plant.position.x : 0
          structure.position.y = plant.position.y ? plant.position.y : 0
          structure.position.z = plant.position.z ? plant.position.z : 0
          structure.rotation.x = Math.PI / 2 // 90 degrees in radians
          structure.material.roughness = 0.9
          if (plant.images.texture != null && plant.images.texture != false) {
            structure.material.map = loaderTexture.load(plant.images.texture)
            for (let i = 0;i < structure.material.length;i++) {
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
          
          console.log("plant structure", structure)
          
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

// onMounted ( () => {
//   // the DOM element will be assigned to the ref after initial render
//   console.log("root.value (your $el, found in this.$refs.root)", root.value) // this is your $el

//   params.mode = params.modes.INITIALIZING
//   console.log("params.mode onMounted", params.mode)

//   /**
//    * initiate build process (getData, then build scene)
//    */
//   build()

// })

// /script>
// script lang="ts">

// console.log("this", this) // is a window

export default {
  name: "ThreeDGarden",
  props: {
    msg: String,
    subtitle: String,
  },
  beforeCreate() {
    return {
      martyEL: "#webgl" // ???
    }
  },
  data() {
    //return data
    return {
      that: this,
      //electron: process.versions.electron,
      name: this.$route.name,
      //node: process.versions.node,
      path: this.$route.path,
      //platform: require('os').platform(),
      //vue: require('vue/package.json').version
    }
  },
  mounted() {
    // no access to params from here
    params.mode = params.modes.INITIALIZING
    console.log("params.mode export default mounted", params.mode)
    /**
     * initiate build process (getData, then build scene)
     */
    build()
  },
  setup(props, context) {
    const root = ref(null)
    onMounted(() => {
      // the DOM element will be assigned to the ref after initial render
      console.log("root.value (your $el, found in this.$refs.root)", root.value) // this is your $el
      console.log("params.mode onMounted", params.mode)
    })
    return {
      root
    }
  }
}
</script>




<!-- TESTING
<script>
// AUDIO???
const sfxExt = SFX.supportsAudioType('mp3') ? 'mp3' : 'ogg'
console.log("SFX", SFX)





var element = document.getElementById("APP")
//element.classList.add("progressStyle")
var progress = document.createElement('div')
  progress.classList.add("progress-style")
var progressBar = document.createElement('div')
  progressBar.classList.add("progress-bar")

progress.appendChild(progressBar)

//document.body.appendChild(progress)
element.appendChild(progress)

var manager = new THREE.LoadingManager()
manager.onProgress = function ( item, loaded, total ) {
  progressBar.style.width = (loaded / total * 100) + '%'
  console.log("item", item, loaded, total)
};

function addRandomPlaceHoldItImage() {
  var r = Math.round(Math.random() * 4000)
  new THREE.ImageLoader(manager).load('//picsum.photos/' + r + '/' + r)
}

for(var i = 0;i < 10;i++) {
  addRandomPlaceHoldItImage()
  //console.log("manager", manager)
}

console.log("manager", manager)






/* [MM] */
// let actionBtn = document.getElementById("action-btn")
// document.getElementById("camera-btn").onclick = function(){ switchCamera() }
// document.getElementById("briefcase-btn").onclick = function(){ toggleBriefcase() }
// actionBtn.onclick = function(){ contextAction() }
// document.getElementById("sfx-btn").onclick = function(){ toggleSound() }





function createCameras() {
  const offset = new THREE.Vector3(0, 80, 0)
  const front = new THREE.Object3D()
  front.position.set(112, 100, 600)
  front.parent = player.object
  const back = new THREE.Object3D()
  back.position.set(0, 300, -600)
  back.parent = player.object
  const wide = new THREE.Object3D()
  wide.position.set(178, 139, 1665)
  wide.parent = player.object
  const overhead = new THREE.Object3D()
  overhead.position.set(0, 400, 0)
  overhead.parent = player.object
  const collect = new THREE.Object3D()
  collect.position.set(40, 82, 94)
  collect.parent = player.object
  player.cameras = { front, back, wide, overhead, collect }
  setActiveCamera(player.cameras.back)
}

function setActiveCamera(object) {
  player.cameras.active = object
}




/**
 * INFOSPOTS **************************************************************************************
 */
function makeInfospotSprite(message, positionX, positionY, positionZ) {
  /**
   * infospot
   */
  let infospotCanvas = document.querySelector("#infospot")
  let ctx = infospotCanvas.getContext("2d")
  let x = 32
  let y = 32
  let radius = 30
  let startAngle = 0
  let endAngle = Math.PI * 2
  // background
  ctx.fillStyle = "rgba(0, 0, 0, 0.8)"
  ctx.beginPath()
  ctx.arc(x, y, radius, startAngle, endAngle)
  ctx.fill()
  // border
  ctx.strokeStyle = "rgba(255, 255, 255, 0.8)"
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.arc(x, y, radius, startAngle, endAngle)
  ctx.stroke()
  // foreground
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)"
  ctx.font = "40px sans-serif"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  // text
  ctx.fillText(message, x, y)

  const infospotTexture = new THREE.CanvasTexture(
    infospotCanvas[0]
    //document.querySelector("#infospot")
    //$("#infospot")
  )

  const infospotMaterial = new THREE.SpriteMaterial({
    map: infospotTexture,
    opacity: 0.8,
    transparent: true,
    depthTest: false,
    depthWrite: false
  })

  let infospot = new THREE.Sprite(infospotMaterial)
  infospot.position.set(positionX, positionY, positionZ)
  infospot.scale.set(2, 2, 2)
  infospot.visible = true

  return infospot
}

function makeInfospotSphere(message, positionX, positionY, positionZ, postID, contentHTML, link) {
  /**
   * INFOSPOT ********************************************************************
   */
  let structure = getGeometry(
    "InfoSphere",
    0.90, // radius
    32, // width segments
    32, // height segments
    0x2e3959
  )	
  structure.name = message
  structure.userData.type = "infospot"
  structure.userData.postID = postID
  structure.userData.description = ""
  structure.userData.annotation = contentHTML
  structure.userData.link = link
  // structure.position.x = positionX
  // structure.position.y = positionY
  // structure.position.z = positionZ
  structure.position.set(positionX, positionY, positionZ)
  //structure.rotation.x = -Math.PI / 2 // -90 degrees in radians
  //structure.scale.set(2, 2, 2)
  structure.visible = true
    
  /** 
   * ANNOTATION ****************************************************************** 
   */
  //
  let vector = new THREE.Vector3(structure.position.x, structure.position.y, 0) //camera.position.z //structure.position.z
  // camera.updateProjectionMatrix()
  // camera.updateMatrixWorld()
  // let vector = new THREE.Vector3()
  // vector.setFromMatrixPosition(structure.matrixWorld)
  vector.project(camera)

  vector.x = Math.round((0.5 + vector.x / 2) * (renderer.domElement.width / window.devicePixelRatio))
  vector.y = Math.round((0.5 - vector.y / 2) * (renderer.domElement.height / window.devicePixelRatio))
  // vector.x = (structure.position.x / (window.innerWidth - 240)) * 2 - 1
  // vector.y = -(structure.position.y / (window.innerHeight - 100)) * 2 + 1
  // vector.x = Math.round( (   vector.x + 1 ) * renderer.domElement.width / 2 )
  // vector.y = Math.round( ( - vector.y + 1 ) * renderer.domElement.height / 2 )

  let annoPosTop = vector.x
  let annoPosLeft = vector.y

  let annotation = makeAnnotation(
    structure.userData.link,
    structure.name,
    annoPosTop, 
    annoPosLeft
  )
  annotation.name = `ANNOTATION: ${structure.name}`
  annotation.userData.type = "annotation"
  annotation.userData.postID = postID
  annotation.userData.description = ""
  annotation.userData.annotation = structure.name
  annotation.userData.link = link
  annotation.visible = false // does nothing, but keeps status accurate

  // console.log("annotation", annotation)
  
  structure.add(annotation)
  
  return structure
}

function makeAnnotation(link, contentHTML, positionX, positionY) {

  let annoDiv = document.createElement("div")
  annoDiv.classList.add("annotation")
  annoDiv.innerHTML = `
    <a href="${link}" target="_blank">${contentHTML}</a>
    (${positionX}, ${positionY})
    <span class="dismiss" onclick="dismiss(this)">x</span>
  `
  annoDiv.hidden = true
  annoDiv.style.display = "none" // block
  annoDiv.style.top = `${positionY}px`
    annoDiv.style.left = `${positionX}px`
  guiFolderAnnotations.add(annoDiv, "hidden").listen()
  guiFolderAnnotations.add(annoDiv.style, "display").listen()
  guiFolderAnnotations.add(annoDiv.style, "top").listen()
  guiFolderAnnotations.add(annoDiv.style, "left").listen()
  document.body.appendChild( annoDiv )

  // make the div element draggable
  dragElement(annoDiv)

  let cssObject = { userData: {} } // new THREE.CSS3DObject( annoDiv )
  // trying to do stuff to a cssObject does nothing :(
  // // we reference the same position and rotation 
  // cssObject.position = rendererDomElement.position
  // cssObject.rotation = rendererDomElement.rotation
  // cssObject.position.set(positionX, positionY, positionZ)
  // cssObject.scale.set(3, 3, 3)
  // cssObject.visible = true
  
  // console.log("cssObject", cssObject)
  
  //return annoDiv
  return cssObject
}

function makeTextSprite(message, parameters) {
  if ( parameters === undefined ) parameters = {}
  let fontface = parameters.hasOwnProperty("fontface") ? 
    parameters["fontface"] : "Arial"
  let fontsize = parameters.hasOwnProperty("fontsize") ? 
    parameters["fontsize"] : 18
  let borderThickness = parameters.hasOwnProperty("borderThickness") ? 
    parameters["borderThickness"] : 4
  let borderColor = parameters.hasOwnProperty("borderColor") ?
    parameters["borderColor"] : { r:0, g:0, b:0, a:1.0 }
  let backgroundColor = parameters.hasOwnProperty("backgroundColor") ?
    parameters["backgroundColor"] : { r:255, g:255, b:255, a:1.0 }
    
  let newCanvas = document.createElement("canvas")
  let context = newCanvas.getContext("2d")
  context.font = "Bold " + fontsize + "px " + fontface
  //context.textAlign = "center"
    
  // get size data (height depends only on font size)
  let metrics = context.measureText( message )
  let textWidth = metrics.width
  // console.log("textWidth metrics", textWidth)

  // background color
  context.fillStyle   = "rgba(" + backgroundColor.r + "," + backgroundColor.g + ","
                  + backgroundColor.b + "," + backgroundColor.a + ")"
  // border color
  context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + ","
                  + borderColor.b + "," + borderColor.a + ")"

  context.lineWidth = borderThickness
  roundRect(
    context, 
    borderThickness/2, 
    borderThickness/2, 
    textWidth + borderThickness, 
    fontsize * 1.4 + borderThickness, 
    6
  )
  // 1.4 is extra height factor for text below baseline: g,j,p,q.
  
  // text color
  context.fillStyle = "rgba(0, 0, 0, 1.0)"

  context.fillText( message, borderThickness, fontsize + borderThickness)
  
  // canvas contents will be used for a texture
  let texture = new THREE.Texture(newCanvas)
  texture.needsUpdate = true

  let spriteMaterial = new THREE.SpriteMaterial( 
    {
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false 
    } //, useScreenCoordinates: false, alignment: spriteAlignment
  )
  let sprite = new THREE.Sprite( spriteMaterial )
  sprite.scale.set(50, 25, 1.0)

  return sprite
}

// function for drawing rounded rectangles
function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath()
    ctx.moveTo(x+r, y)
    ctx.lineTo(x+w-r, y)
    ctx.quadraticCurveTo(x+w, y, x+w, y+r)
    ctx.lineTo(x+w, y+h-r)
    ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h)
    ctx.lineTo(x+r, y+h)
    ctx.quadraticCurveTo(x, y+h, x, y+h-r)
    ctx.lineTo(x, y+r)
    ctx.quadraticCurveTo(x, y, x+r, y)
    ctx.closePath()
    ctx.fill()
  ctx.stroke()   
}

function updateAnnotationOpacity(camera, meshPosition, annotationPosition) {
    const meshDistance = camera.position.distanceTo(meshPosition)
    const annotationDistance = camera.position.distanceTo(annotationPosition)
    let annotationBehindObject = annotationDistance > meshDistance
    //annotation.material.opacity = annotationBehindObject ? 0.5 : 1

    // Do you want an infospot that changes size according to its position?
    // Comment out the following line and the `::before` pseudo-element.
    //annotation.material.opacity = 1
}

function updateAnnotationPosition(camera, width, height, positionX, positionY, positionZ, annotation) {
    let vector = new THREE.Vector3(positionX, positionY, positionZ)
  //let annotation = $(".annotation")[0]

    vector.project(camera)

    vector.x = Math.round((0.5 + vector.x / 2) * (width / window.devicePixelRatio))
    vector.y = Math.round((0.5 - vector.y / 2) * (height / window.devicePixelRatio))

    annotation.style.top = `${vector.y}px`
    annotation.style.left = `${vector.x}px`
    //annotation.style.opacity = annotationBehindObject ? 0.25 : 1
  annotation.style.opacity = 1
  annotation.style.display = "block"
  // console.log("------------------")
  // console.log("annotation--------")
  // console.log(annotation)
  // console.log("------------------")
}



function dismiss(el) {
  el.parentNode.hidden = true
  el.parentNode.style.display = "none"
}

function stringToBoolean(string) {
    switch(string.xyzToString().toLowerCase().trim()){
        case "true": case "yes": case "1": return true
        case "false": case "no": case "0": case null: return false
        default: return Boolean(string)
    }
}

function xyzToString(v) { return "[ " + v.x + ", " + v.y + ", " + v.z + " ]" }


function dragElement(elmnt) {

  // console.log("elmnt", elmnt)

  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0
  
  if (document.getElementById(elmnt.id + "header")) {
    // if present, the header is where you move the DIV from:
    document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown
  } else {
    // otherwise, move the DIV from anywhere inside the DIV:
    elmnt.onmousedown = dragMouseDown
  }

  function dragMouseDown(e) {
    e = e || window.event
    e.preventDefault()
    // get the mouse cursor position at startup:
    pos3 = e.clientX
    pos4 = e.clientY

    // console.log("pos3, pos4", pos3, pos4)

    document.onmouseup = closeDragElement
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag
  }
  
  function elementDrag(e) {
    e = e || window.event
    e.preventDefault()
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX
    pos2 = pos4 - e.clientY
    pos3 = e.clientX
    pos4 = e.clientY

    // console.log("pos1, pos2, pos3, pos4", pos1, pos2, pos3, pos4)

    // set the element's new position:
    // elmnt.style.top = (elmnt.offsetTop - pos2) + "px"
    // elmnt.style.left = (elmnt.offsetLeft - pos1) + "px"
    elmnt.style.top = (pos4) + "px"
    elmnt.style.left = (pos3) + "px"
  }
  
  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null
    document.onmousemove = null
  }
}



/**
 * TESTING ***************************************************************************************
 */

// controls.enabled = false
// var xTarget = 0
// var yTarget = -0.7
// var zTarget = -1.65
// var tweenDuration = 2000

function panCam(xTarget, yTarget, zTarget, tweenDuration, camera, controls) {

  var camNewPosition= { x : xTarget, y : yTarget, z : zTarget}
  var targetNewPos = {x : xTarget, y : yTarget, z : -1.65}

  var camTween = new TWEEN.Tween(camera.position)
    .to(camNewPosition, tweenDuration)
    .easing(TWEEN.Easing.Quadratic.Out)
    .onComplete(function() {
      camera.position.copy(camNewPosition)
      console.log("onComplete camera---------")
    })
    .start()
  var targetTween = new TWEEN.Tween(controls.target)
    .to(targetNewPos, tweenDuration)
    .easing(TWEEN.Easing.Quadratic.Out)
    .onComplete(function() {
      controls.target.copy(targetNewPos)
      console.log("onComplete controls---------")
    })
    .start()

  console.log("camTween, targetTween", camTween, targetTween)
  
}

/**
 * TESTING ***************************************************************************************
 */

/**
 * Get the current category IDs and request their category objects.
 * param  {object} postObject - The entire post object
 * param  {bool}   isCat      - Is the query a category (true) or a tag (false)
 * return {string} termLinks  - String of HTML for either list of categories or list of tags 
 */
function getTaxonomies( postObject, isCat ) {

  let termLinks = []
  let taxArray
  if ( isCat ) {
    taxArray = postObject._embedded["wp:term"][0]
  } 
  else {
    taxArray = postObject._embedded["wp:term"][1]
  }
  for ( let term of taxArray ) {
    termLinks.push(`<a href="${term.link}" rel="${isCat ? 'category' : ''} tag">${term.name}</a>`)
  }

  termLinks = isCat ? termLinks.join("") : termLinks.join(", ")

  return termLinks

}

/**
 * Builds out the HTML of the new post.
 * param {object} postObject - modified post object with available term lists added
 */
function buildNewPost( postObject ) {
  // Only output tag markup if there are actual tags for the post.
  let conditionalTags = ( postObject ) => {
    let tagMarkup = ""
    if (postObject.tagLinks !== "") {
      tagMarkup = `
        <pre>${getTaxonomies( postObject, false )}</pre>
      `
    }
    return tagMarkup
  }

  let output = `
    <pre>${getTaxonomies( postObject, true )}</pre>
    <pre>${getFeaturedImage( postObject )}</pre>
    <pre>${conditionalTags( postObject )}</pre>
  `

  // Remove "load previous" container.
  //document.querySelector(".load-previous").remove()

  // Create a article with appropriate classes to populate.
    let postElement = document.createElement("article")
  postElement.className = "post type-post format-standard hentry"
  postElement.innerHTML = output
  
  // Append new article with all content to the bottom of the main element.
  document.querySelector("#webgl").append(postElement)

  //getPreviousPost()
}

</script>
-->

<style scoped>
.threedgarden {
  margin-bottom: 0px;
}
html, body, h1, h2, h3, p {
  font-family: 'Noto Serif', serif;
  user-select: none;
}
#app {
  text-align: center;
  color: rgba(0,0,0,0.4);
}
img {
  width: 500px;
}
a {
  color: #96bc33;
  text-decoration: none;
  cursor: pointer;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
</style>