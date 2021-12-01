<template>
	<div class="threedgarden">
		<h1>{{ msg }}</h1>
		<h2>{{ subtitle }}</h2>
	</div>
</template>

<script>
/** 
 * ThreeDGarden - FarmBot JavaScript
 */
import { Farmbot } from "farmbot"

let SUPER_SECRET_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiJ1bmtub3duIiwic3ViIjoxNTI2NywiaWF0IjoxNjM2NjU3ODUxLCJqdGkiOiIwNTBiMzIxNC02NzcxLTRlYzktODhmMS02NTVhYWVhNWQzN2QiLCJpc3MiOiIvL215LmZhcm0uYm90OjQ0MyIsImV4cCI6MTY0MTg0MTg1MSwibXF0dCI6ImNsZXZlci1vY3RvcHVzLnJtcS5jbG91ZGFtcXAuY29tIiwiYm90IjoiZGV2aWNlXzE1Mjk3Iiwidmhvc3QiOiJ4aWNvbmZ1bSIsIm1xdHRfd3MiOiJ3c3M6Ly9jbGV2ZXItb2N0b3B1cy5ybXEuY2xvdWRhbXFwLmNvbTo0NDMvd3MvbXF0dCJ9.K8jzw-l_KduohGUgS_rkmNx4700XQyZX3-JCigk-5gXf4y-aemDNemzABGpIvULVj9D02RXEiLAzPtSxRpGS_AWpwd0OSU35HNO_pCL7-KLmtmpanAOxutflPe9KN_stU1AgZC42TmMYLYeMZY1ornQOZTaIgT6dYJkqJex7HV6D1LS-1yjvEdPM2E1UTh6OWUFDndq-fdwyVNuQfYdbu0CLhTua3SaNaXCueZ7qew3-XVUx48PS2X8XFACkveZbRfb55qgabT-WpcQB4KyujdKFbAotZqJeZ1_aCxTa4WT_y_zFV7gVptgeK2FAXC1DE9cH4FJXipt0AMPksQGShA"

let bot = new Farmbot({ token: SUPER_SECRET_TOKEN })

bot
	.connect()
	.then(function () {
		//alert("HEY HEY HEY")
		bot.setConfig("hey", "HEY HEY HEY")
		console.log(bot.getConfig("hey"))
		return bot.getConfig("hey")
	})
	.then(function () {
		return bot.moveRelative({ x: 1, y: 2, z: 3, speed: 100 })
	})

console.log("bot", bot)


/** 
 * ThreeDGarden - Custom JavaScript Vue
 * *************************************************************************************** */

// check for WebGL
//if ( ! Detector.webgl ) Detector.addGetWebGLMessage()

// console.log(window.postdata)
const postdata = window.postdata
console.log("MARTY: postdata", postdata)

/** PARAMETERS FROM PHP */
const pluginName = postdata.plugin_name
const pluginVersion = postdata.plugin_version
const pluginURL = postdata.plugin_url
const themeURI = postdata.theme_uri
const restURL = postdata.rest_url
const worldID = postdata.world_id
console.log("MARTY: pluginName", pluginName, pluginVersion)


/** INSTANTIATE COMMON VARIABLES */
let scene
let plane
let camera
let controls
let gui
	gui = new dat.GUI({ autoPlace: true, closeOnTop: true })
	gui.close()
	gui.domElement.id = "gui"
	let guiFolderRotation 		= gui.addFolder("Rotation + Animation")
	//let guiFolderAnimation 	= guiFolderRotation.addFolder("Animation")
	let guiFolderCameras 		= gui.addFolder("Camera Position")
	let guiFolderLights 		= gui.addFolder("Directional Light")
	let guiFolderAllotments 	= gui.addFolder("Allotments")
	let guiFolderBeds 			= gui.addFolder("Beds")
	let guiFolderPlants 		= gui.addFolder("Plants")
	//let guiFolderInfospots 	= gui.addFolder("Infospots")
	let guiFolderAnnotations 	= gui.addFolder("Annotations")
	let guiFolderPlayer 		= gui.addFolder("Character")
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
let stats

let cellSize = 16
let interactive = false
let levelIndex = 0
let _hints = 0
let score = 0
let debug = false
let debugPhysics = false
let cameraFade = 0.05
let mute = false
let collect = []

let messages = { 
	text: [ 
		"Welcome to your 3D Garden",
		"GO GROW!"
	],
	index: 0
}

let params = {
	/** SET MODES */
	modes: Object.freeze({
		NONE:   Symbol("none"),
		PRELOAD: Symbol("preload"),
		INITIALISING:  Symbol("initialising"),
		CREATING_LEVEL: Symbol("creating_level"),
		ACTIVE: Symbol("active"),
		GAMEOVER: Symbol("gameover")
	}),
	/** turn on/off animation */
	ANIMATE: false,
	/** where multimedia files located */
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
guiFolderRotation.add(params, "ANIMATE").name("Run Animation")

const sfxExt = SFX.supportsAudioType('mp3') ? 'mp3' : 'ogg'
const options = {
	assets:[
		`${params.assetsPath}sfx/gliss.${sfxExt}`,
		`${params.assetsPath}sfx/factory.${sfxExt}`,
		`${params.assetsPath}sfx/button.${sfxExt}`,
		`${params.assetsPath}sfx/door.${sfxExt}`,
		`${params.assetsPath}sfx/fan.${sfxExt}`,
		`${params.assetsPath}fbx/environment.fbx`,
		`${params.assetsPath}fbx/girl-walk.fbx`,
		`${params.assetsPath}fbx/usb.fbx`,
	],
	oncomplete: function(){
		init()
		//animate()
	}
}
anims.forEach( function(anim){ options.assets.push(`${params.assetsPath}fbx/anims2/${anim}.fbx`)})

params.mode = params.modes.PRELOAD

console.log("MARTY: params", params)
console.log("MARTY: options", options)

// example localStorage saving/reading
//if (localStorage && ! debug){
	//const levelIndex = Number(localStorage.getItem('levelIndex'))
	//if (levelIndex!=undefined) this.levelIndex = levelIndex
//}



/** 
 * END FILE
 * ************************************************************************************** 
 */

export default {
	name: "ThreeDGarden",
	props: {
		msg: String,
		subtitle: String,
	}
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
	margin: 40px 0 0;
}
ul {
	list-style-type: none;
	padding: 0;
}
li {
	display: inline-block;
	margin: 0 10px;
}
a {
	color: #96bc33;
}
.threedgarden {
	margin-bottom: 40px;
}
</style>
