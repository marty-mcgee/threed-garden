/** 
 * ThreeDGarden - Custom Admin JavaScript 
 * *************************************************************************************** */

/** init main constructor */
window.onload = function(e){ 
	let garden = new Game();
	window.garden = garden;
}

/** main class */
class Game {
	constructor () {
		if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

		const game = this;

		console.log("-----------------------");
		console.log("game-----------------");
		console.log(game);
		console.log("-----------------------");

		/** PARAMETERS FROM PHP */
		const pluginName = postdata.plugin_name;
		const pluginVersion = postdata.plugin_version;
		const pluginURL = postdata.plugin_url;
		const themeURI = postdata.theme_uri;
		const restURL = postdata.rest_url;
		const worldID = postdata.world_id;
		console.log("-----------------------");
		console.log("pluginName-------------");
		console.log(pluginName, pluginVersion);
		console.log("-----------------------");

		/** INSTANTIATE GAME MODES */
		this.modes = Object.freeze({
			NONE:   Symbol("none"),
			PRELOAD: Symbol("preload"),
			INITIALISING:  Symbol("initialising"),
			CREATING_LEVEL: Symbol("creating_level"),
			ACTIVE: Symbol("active"),
			GAMEOVER: Symbol("gameover")
		});
		this.mode = this.modes.NONE;

		/** INSTANTIATE COMMON VARIABLES */
		this.scene;
		this.plane;
		this.camera;
		this.renderer;
		this.container;
		this.canvas;
		this.controls;
		this.gui = new dat.GUI({ autoPlace: true, closeOnTop: true });
			this.gui.close();
			this.gui.domElement.id = "gui";
			this.guiFolderRotation = this.gui.addFolder("Rotation + Animation");
			//this.guiFolderAnimation = this.guiFolderRotation.addFolder("Animation");
			this.guiFolderCameras = this.gui.addFolder("Camera Position");
			this.guiFolderLights = this.gui.addFolder("Directional Light");
			this.guiFolderAllotments = this.gui.addFolder("Allotments");
			this.guiFolderBeds = this.gui.addFolder("Beds");
			this.guiFolderPlants = this.gui.addFolder("Plants");
			//this.guiFolderInfospots = this.gui.addFolder("Infospots");
			this.guiFolderAnnotations = this.gui.addFolder("Annotations");
			this.guiFolderPlayer = this.gui.addFolder("Character");
		this.player = {};
			this.player.action = "Idle";
			this.player.actionTime = Date.now();
		this.animations = {};
		this.anims = ["Driving", "Pointing", "Pointing Gesture", "Running", "Talking", "Turn", "Walking", "Walking Backwards"];
		this.anims2 = ["ascend-stairs", "gather-objects", "look-around", "push-button", "run"];
		this.tweens = [];
		this.stats;
		
		const sfxExt = SFX.supportsAudioType('mp3') ? 'mp3' : 'ogg';		

		this.cellSize = 16;
		this.interactive = false;
		this.levelIndex = 0;
		this._hints = 0;
		this.score = 0;
		this.debug = false;
		this.debugPhysics = false;
		this.cameraFade = 0.05;
        this.mute = false;
        this.collect = [];
		
		this.messages = { 
			text: [
				"Welcome to your 3D Garden",
				"GO GROW!"
			],
			index: 0
		}

		/** GAME CLOCK "dt" DELTA */
		this.clock = new THREE.Clock();

		/** LOADERS */
		this.loaderFBX = new THREE.FBXLoader();
		this.loaderGLTF = new THREE.GLTFLoader();
		this.loaderOBJ = new THREE.OBJLoader();
		this.loaderTexture = new THREE.TextureLoader();

		/** POINTER HOVERS + CLICKS */
		this.raycaster = new THREE.Raycaster();
		this.pointer = new THREE.Vector2();

		this.params = {
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
			colliders: [], // this.params.colliders.push(object3D);
			// town.fbx
			environment: {},
			// custom fbx
			farmhouse: {},
		};
		this.guiFolderRotation.add(this.params, "ANIMATE").name("Run Animation");
		
		if (localStorage && !this.debug){
			//const levelIndex = Number(localStorage.getItem('levelIndex'));
			//if (levelIndex!=undefined) this.levelIndex = levelIndex;
		}

		/** REST API URLS */
		this.API_URL_SCENES = `${restURL}scene/?_embed&per_page=100`;
		this.API_URL_ALLOTMENTS = `${restURL}allotment/?_embed&per_page=100`;
		this.API_URL_BEDS = `${restURL}bed/?_embed&per_page=100`;
		this.API_URL_PLANTING_PLANS = `${restURL}planting_plan/?_embed&per_page=100`;
		this.API_URL_PLANTS = `${restURL}plant/?_embed&per_page=100`;

		this.api_urls = [
			this.API_URL_SCENES,
			this.API_URL_ALLOTMENTS,
			this.API_URL_BEDS,
			this.API_URL_PLANTING_PLANS,
			this.API_URL_PLANTS
		];
		
		const options = {
			assets:[
                `${this.params.assetsPath}sfx/gliss.${sfxExt}`,
				`${this.params.assetsPath}sfx/factory.${sfxExt}`,
				`${this.params.assetsPath}sfx/button.${sfxExt}`,
				`${this.params.assetsPath}sfx/door.${sfxExt}`,
                `${this.params.assetsPath}sfx/fan.${sfxExt}`,
				`${this.params.assetsPath}fbx/environment.fbx`,
				`${this.params.assetsPath}fbx/girl-walk.fbx`,
                `${this.params.assetsPath}fbx/usb.fbx`,
			],
			oncomplete: function(){
				this.init();
				this.animate();
			}
		}
		
		this.anims.forEach( function(anim){ options.assets.push(`${game.params.assetsPath}fbx/anims2/${anim}.fbx`)});
		
		this.mode = this.modes.PRELOAD;
		
		document.getElementById("camera-btn").onclick = function(){ this.switchCamera(); };
		document.getElementById("briefcase-btn").onclick = function(){ this.toggleBriefcase(); };
		document.getElementById("action-btn").onclick = function(){ this.contextAction(); };
        document.getElementById("sfx-btn").onclick = function(){ this.toggleSound(); };
		
		this.actionBtn = document.getElementById("action-btn");

		//const preloader = new Preloader(options);
		this.init();
		//this.animate();

		window.onError = function(error){
			console.error(JSON.stringify(error));
		}
	}

	/** 
	 * BEGIN MAIN
	 * *************************************************************************************** */
	init() {

		Promise.allSettled(
			this.api_urls.map(
				url => fetch(url)
						.then(results => results.json())
						.then(data => {
							let type = data[0].type;
							switch (type) {
								case "scene" :
									this.params.data.scene = [...data];
									break;
								case "allotment" :
									this.params.data.allotment = [...data];
									break;
								case "bed" :
									this.params.data.bed = [...data];
									break;
								case "plant" :
									this.params.data.plant = [...data];
									break;
								case "planting_plan" :
									this.params.data.planting_plan = [...data];
									break;
								default :
									break;
							}
							// console.log("-----------------");
							// console.log(data);
							// console.log("-----------------");
						})
			)
		)
		.then(results => { // (*)
				//console.log(results);
				results.forEach((result, num) => {
					if (result.status == "fulfilled") {
						//alert(`${urls[num]}: ${result.value.status}`);
						//console.log(result);
					}
					if (result.status == "rejected") {
						//alert(`${urls[num]}: ${result.reason}`);
						console.log(result);
					}
				})
				console.log("-----------------");
				console.log("this.params.data------");
				console.log(this.params.data);
				console.log("-----------------");
				/**
				 * init scene constructor
				 */
				this.buildScene();
			}
		)
		//.catch(() => { return null });

		//throwError();
	}

	/** 
	 * BUILD SCENE
	 * *************************************************************************************** */
	buildScene() {

		let game = this;

		// console.log("-----------------------");
		// console.log("this.params.data.scene------");
		// console.log(this.params.data.scene);
		// console.log(this.params.data.scene.length);
		// console.log("-----------------------");

		let wpScene = this.params.data.scene[0];
		this.sceneID = wpScene.id;

		// console.log("-----------------------");
		// console.log("wpScene----------------");
		// console.log(wpScene);
		// console.log("-----------------------");

		/** THREE JS SCENE ******************************************************************* */

		this.scene = new THREE.Scene();

		// load the 3D cube map?
		if ( wpScene.acf.scene_background_image_px ) {
			let cubeMapURLs = [
				wpScene.acf.scene_background_image_px,
				wpScene.acf.scene_background_image_nx,
				wpScene.acf.scene_background_image_py,
				wpScene.acf.scene_background_image_ny,
				wpScene.acf.scene_background_image_pz,
				wpScene.acf.scene_background_image_nz
			];
			let reflectionCube = new THREE.CubeTextureLoader().load(cubeMapURLs);
			reflectionCube.format = THREE.RGBFormat;
			this.scene.background = reflectionCube;
		}
		// load the 2D background image?
		else if ( wpScene.acf.scene_background_image ) {
			// let bgTexture = loaderTexture.load(wpScene.acf.scene_background_image);
			// scene.background = bgTexture;
			let bgTexture = this.loaderTexture.load(
				wpScene.acf.scene_background_image,
				() => {
					const rt = new THREE.WebGLCubeRenderTarget(bgTexture.image.height);
					rt.fromEquirectangularTexture(this.renderer, bgTexture);
					this.scene.background = rt;
				}
			);
		}
		// load the background color?
		else if ( wpScene.acf.scene_background_color ) {
			this.scene.background = new THREE.Color(wpScene.acf.scene_background_color);
			//scene.fog = new THREE.Fog(0xFFFFFF, 0, 500);
		}

		/** GEOMETRIES *********************************************************************** */
		
		this.plane = this.getPlane(
			wpScene.acf.scene_plane_width_x, 
			wpScene.acf.scene_plane_length_y, 
			wpScene.acf.scene_plane_background_color
		);
		this.plane.name = "plane-jane";
		this.plane.rotation.x = -Math.PI / 2; // -90 degrees in radians
		//this.plane.position.z = 10;
		//this.plane.rotation.z += 0.002;
		this.guiFolderRotation.add(this.plane.rotation, "x", -Math.PI, Math.PI).listen();
		this.guiFolderRotation.add(this.plane.rotation, "y", -Math.PI, Math.PI).listen();
		this.guiFolderRotation.add(this.plane.rotation, "z", -Math.PI, Math.PI).listen();

		/** TEXTURES ************************************************************************* */

		if ( wpScene.acf.scene_plane_texture_image ) {
			this.plane.material.roughness = 0.0;
			//plane.material.map = loaderTexture.load("/wp-content/plugins/threed-garden/admin/media/textures/grasslight-big.jpg");
			this.plane.material.map = this.loaderTexture.load(wpScene.acf.scene_plane_texture_image);
			// plane.material.bumpMap = loaderTexture.load("/wp-content/plugins/threed-garden/admin/media/textures/grasslight-big-nm.jpg");
			// plane.material.bumpMap = loaderTexture.load(wpScene.acf.scene_plane_texture_image);
			// plane.material.bumpScale = 0.01;
			let planeTextureMap = this.plane.material.map;
			planeTextureMap.wrapS = THREE.RepeatWrapping;
			planeTextureMap.wrapT = THREE.RepeatWrapping;
			planeTextureMap.repeat.set(4, 4);
		}

		/** LIGHTS *************************************************************************** */

		// let pointLight = this.getPointLight(0xFFFFFF, 4.0);
		// pointLight.position.set( -20, -60, 20 );
		// //pointLight.intensity = 3.0;

		// let spotLight = this.getSpotLight(0xFFFFFF, 4.0);
		// spotLight.position.set( -20, -60, 20 );
		// //spotLight.intensity = 3.0;

		let directionalLight = this.getDirectionalLight(0xFFFFFF, 2.1);
		directionalLight.position.set( -90, -120, 120 );
		//directionalLight.intensity = 2.4;

		let helperDirectionalLight = new THREE.CameraHelper(directionalLight.shadow.camera);
		helperDirectionalLight.visible = false;

		// let directionalLight2 = this.getDirectionalLight(0xFFFFFF, 1.0);
		// directionalLight2.castShadow = false;
		// directionalLight2.position.set( 90, 120, 120 );
		// //directionalLight2.intensity = 1.4;

		// let helperDirectionalLight2 = new THREE.CameraHelper(directionalLight2.shadow.camera);
		// helperDirectionalLight2.visible = true;

		//let ambientLight = this.getAmbientLight(0xFFFFFF, 0.1);
		//ambientLight.position.set( -100, -100, 25 );
		
		this.guiFolderLights.add(helperDirectionalLight, "visible", 0, 20).name("Show Light Helper");
		this.guiFolderLights.add(directionalLight, "intensity", 0, 20);
		this.guiFolderLights.add(directionalLight.position, "x", -500, 500);
		this.guiFolderLights.add(directionalLight.position, "y", -500, 500);
		this.guiFolderLights.add(directionalLight.position, "z", -500, 500);
		// guiFolderLights.add(helperDirectionalLight2, "visible", 0, 20).name("Show Light 2 Helper");
		// guiFolderLights.add(directionalLight2, "intensity", 0, 20);
		// guiFolderLights.add(directionalLight2.position, "x", -500, 500);
		// guiFolderLights.add(directionalLight2.position, "y", -500, 500);
		// guiFolderLights.add(directionalLight2.position, "z", -500, 500);

		/** SCENE ***************************************************************************** */

		// add objects to scene
		//this.plane.add(structure);
		//this.plane.add(pointLight);
		//this.plane.add(spotLight);
		this.plane.add(directionalLight);
		//this.plane.add(directionalLight2);
		//this.plane.add(ambientLight);
		this.scene.add(helperDirectionalLight);
		//this.scene.add(helperDirectionalLight2);
		this.scene.add(this.plane);

		/** CAMERA **************************************************************************** */

		this.camera = new THREE.PerspectiveCamera(
			55,
			window.innerWidth / window.innerHeight,
			0.01,
			10000
		);
		this.camera.name = "garden-cam";
		this.camera.position.set(86, 64, 182);
		//this.camera.lookAt(new THREE.Vector3(0, 0, 0)); // overridden by OrbitControls.target

		let helperCamera = new THREE.CameraHelper(this.camera);
		helperCamera.visible = false;
		this.scene.add(helperCamera);

		this.guiFolderCameras.add(helperCamera, "visible", 0, 20).name("Show Camera Helper");
		this.guiFolderCameras.add(this.camera.position, "x", -500, 500).listen();
		this.guiFolderCameras.add(this.camera.position, "y", -500, 500).listen();
		this.guiFolderCameras.add(this.camera.position, "z", -500, 500).listen();

		/** RENDERER ************************************************************************** */
		
		this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
		this.renderer.shadowMap.enabled = true;
		this.renderer.setSize(window.innerWidth - 240, window.innerHeight - 100);
		
		/** POINTER HOVERS + CLICKS */
		this.renderer.domElement.addEventListener("pointermove", function(){ game.onPointerMove(game.pointer); }, false);
		this.renderer.domElement.addEventListener("pointerdown", function(){ game.onPointerDown(game.pointer); }, false);
		
		/** CONTROLS *************************************************************************** */

		this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
		this.controls.enableDamping = true;
		this.controls.dampingFactor = 0.25;
		this.controls.enableZoom = true;
		this.controls.rotateSpeed = 0.5;
		this.controls.autoRotate = false;
		this.controls.autoRotateSpeed = 0.03;
		this.controls.minDistance = 0.01;
		this.controls.maxDistance = 340;
		this.controls.maxPolarAngle = Math.PI/2 - .04;
		this.controls.target = new THREE.Vector3(0, 0, 0); // where the camera actually points
		//this.controls.target.set(0, 5, 0); // alternate way of setting target of camera

		/** utilize javascript prototyping.. add variables to the dom element :) *************** */

		this.renderer.domElement.camera = this.camera;
		this.renderer.domElement.targetList = this.plane.children;
		this.renderer.domElement.controls = this.controls;

		/** WEBGL CANVAS *********************************************************************** */

		this.container = document.querySelector("#webgl");
		this.container.append(this.gui.domElement);
		this.container.append(this.renderer.domElement);
		this.canvas = this.renderer.domElement;

		/** FBX ******************************************************************************** */
		
		//this.loaderFBX.load( `${this.params.assetsPath}characters/SimplePeople.fbx`, function (object) {
		//this.loaderFBX.load( `${this.params.assetsPath}fbx/people/FireFighter.fbx`, function (object) {
		this.loaderFBX.load( `${this.params.assetsPath}fbx/people/Trucker.fbx`, function (object) {
		//this.loaderFBX.load( `${this.params.assetsPath}characters/SK_Chr_Farmer_Male_01.fbx`, function (object) {

			object.mixer = new THREE.AnimationMixer( object );
			this.player.mixer = object.mixer;
			this.player.root = object.mixer.getRoot();
				
			object.name = "Gardener";
					
			object.traverse( function ( child ) {
				if ( child.isMesh ) {
					child.castShadow = true;
					child.receiveShadow = false;		
				}
			} );

			this.loaderTexture.load(`${params.assetsPath}images/SimpleFarmer_Farmer_Brown.png`, function(texture) {
			//loaderTexture.load(`${params.assetsPath}textures/PolygonFarm_Texture_01_A.png`, function(texture) {
				object.traverse( function ( child ) {
					if ( child.isMesh ){
						child.material.map = texture;
					}
				} );
			});

			// console.log("-----------------------");
			// console.log("object----------------");
			// console.log(object);
			// console.log("-----------------------");

			this.player.object = new THREE.Object3D();
			this.player.object.add(object);
			this.player.object.scale.set(0.022, 0.022, 0.022);
			this.player.object.rotation.x = Math.PI/2; // 90 degrees in radians
			this.player.mixer.clipAction(object.animations[0]).play();
			this.animations.Idle = object.animations[0];
			//this.setAction("Idle");

			this.plane.add(this.player.object);
			this.guiFolderPlayer.add(this.player.object, "visible").name("Show Character").listen();

			// console.log("-----------------------");
			// console.log("this.player.object----------------");
			// console.log(this.player.object);
			// console.log("-----------------------");

			this.loadNextAnim(this.loaderFBX);

		} );
			
		//this.createCameras();

		this.joystick = new JoyStick({
			onMove: this.playerControl,
			game: this.container
		});


		this.loadFarmHouse();
		//this.loadChickenCoop();
			//this.loadHen();
		//this.loadChicken();
			//this.loadHenGLTF();
			//this.loadRooster();
			//this.loadChickenGLTF();
			//this.loadChickGLTF();
			//this.loadKitchenSink();
			//this.loadChickenFree();
		//this.loadRoad();
		
		
		/** BUILD ALLOTMENTS ******************************************************************* */

		this.buildAllotments(
			this.params.data.allotment, 
			this.plane, 
			this.sceneID // the post-to-post relationship <3
		);

		this.animate();

		//return this.scene;
	}

	/** ANIMATE + RENDER (continuous rendering) ******************************************** */
		
	animate() {

		const game = this;

		const dt = this.clock.getDelta();

		this.watchPointer(this.camera, this.plane.children);
		this.controls.update();
		TWEEN.update();

		//requestAnimationFrame(this.animate);
		requestAnimationFrame( function(){ game.animate(); } );

		if ( this.params.ANIMATE ) {
			// this.plane.rotation.x += 0.002;
			// this.plane.rotation.y += 0.002;
			this.plane.rotation.z -= 0.0007;
		}

		/** PLAYER CHARACTER */
		if ( this.player.mixer !== undefined ) {
			this.player.mixer.update(dt);
		}
		
		if ( this.player.action == "Walking" ) {
			const elapsedTime = Date.now() - this.player.actionTime;
			if ( elapsedTime > 2000 && this.player.move.forward > 0.7 ){
				this.setAction("Running");
			}
		}
		
		if ( this.player.move !== undefined ) {
			this.movePlayer(dt);
		}
		
		if ( this.player.cameras != undefined && this.player.cameras.active != undefined ) {
			this.camera.position.lerp( this.player.cameras.active.getWorldPosition(new THREE.Vector3()), 0.05 );
			const pos = this.player.object.position.clone();
			pos.y += 200;
			this.camera.lookAt(pos);
		}
		
		//if (directionalLight != undefined){
			// directionalLight.position.x = player.object.position.x;
			// directionalLight.position.y = player.object.position.y + 200;
			// directionalLight.position.z = player.object.position.z + 100;
			// directionalLight.target = player.object;
		//}
		
		this.renderer.render(this.scene, this.camera);
	};

	loadNextAnim(loader) {
		let anim = this.anims.pop();
		// console.log("-----------------------");
		// console.log("anim-------------------");
		// console.log(anim);
		// console.log("-----------------------");
		loader.load( `${this.params.assetsPath}fbx/anims2/${anim}.fbx`, function(object) {
			// console.log("-----------------------");
			// console.log("object-----------------");
			// console.log(object);
			// console.log("-----------------------");
			this.animations[anim] = object.animations[0];
			if (this.anims.length > 0){
				// console.log("-----------------------");
				// console.log("this.anims.length-----------");
				// console.log(this.anims.length);
				// console.log("-----------------------");
				// console.log("-----------------------");
				// console.log("this.getAction()-----------");
				// console.log(this.getAction());
				// console.log("-----------------------");
				// console.log("this.player.action----------");
				// console.log(this.player.action);
				// console.log("-----------------------");
				this.loadNextAnim(loader);
			} 
			else {
				// console.log("-----------------------");
				// console.log("this.anims.length = 0-------");
				// console.log(this.anims.length);
				// console.log("-----------------------");
				this.anims = [];
				this.setAction("Idle");
				this.animate();
			}
		});	
	}

	setAction(name) {
		const action = this.player.mixer.clipAction( animations[name] );
		action.time = 0;
		// console.log("-----------------------");
		// console.log("action-----------------");
		// console.log(action);
		// console.log("-----------------------");
		this.player.mixer.stopAllAction();
		this.player.action = name;
		this.player.actionTime = Date.now();
		// console.log("-----------------------");
		// console.log("this.player-----------------");
		// console.log(this.player);
		// console.log("-----------------------");
		
		action.fadeIn(0.5);	
		action.play();
	}

	getAction() {
		if (this.player === undefined || this.player.action === undefined) {
			return "doesn't exist yet";
		}
		return this.player.action;
	}

	toggleAnimation() {
		if ( this.player.action == "Idle" ) {
			this.setAction("Pointing Gesture");
		}
		else {
			this.setAction("Idle");
		}
	}

	movePlayer1(dt) {	
		// console.log("-------------------------");
		// console.log("this.player.move.forward------");
		// console.log(this.player.move.forward);
		// console.log("-------------------------");
		if ( this.player.move.forward > 0 ) {
			const speed = ( this.player.action == "Running" ) ? 24 : 8;
			this.player.object.translateZ( dt * speed );
		}
		else if ( this.player.move.forward < 0 ) {
			this.player.object.translateZ( -dt * 2);
		}
		this.player.object.rotateY( this.player.move.turn * dt );
	}

	movePlayer(dt){
		const pos = this.player.object.position.clone();
		pos.y += 60;
		let dir = new THREE.Vector3();
		this.player.object.getWorldDirection(dir);
		if (this.player.move.forward < 0) dir.negate();
		let raycaster = new THREE.Raycaster(pos, dir);
		let blocked = false;
		const colliders = this.params.colliders;

		// if (colliders!==undefined){ 
		// 	const intersect = raycaster.intersectObjects(colliders);
		// 	if (intersect.length>0){
		// 		if (intersect[0].distance<50) blocked = true;
		// 	}
		// }
		
		if (!blocked){
			if ( this.player.move.forward > 0 ){
				const speed = (this.player.action == "Running") ? 24 : 8;
				this.player.object.translateZ(dt*speed);
			}
			else if ( this.player.move.forward < 0 ) {
				this.player.object.translateZ(-dt*2);
			}
		}
		
		/*
		if (colliders!==undefined){
			//cast left
			dir.set(-1,0,0);
			dir.applyMatrix4(player.object.matrix);
			dir.normalize();
			raycaster = new THREE.Raycaster(pos, dir);

			let intersect = raycaster.intersectObjects(colliders);
			if (intersect.length>0){
				if (intersect[0].distance<50) this.player.object.translateX(100-intersect[0].distance);
			}
			
			//cast right
			dir.set(1,0,0);
			dir.applyMatrix4(player.object.matrix);
			dir.normalize();
			raycaster = new THREE.Raycaster(pos, dir);

			intersect = raycaster.intersectObjects(colliders);
			if (intersect.length>0){
				if (intersect[0].distance<50) this.player.object.translateX(intersect[0].distance-100);
			}
			
			//cast down
			dir.set(0,-1,0);
			pos.y += 200;
			raycaster = new THREE.Raycaster(pos, dir);
			const gravity = 30;

			intersect = raycaster.intersectObjects(colliders);
			if (intersect.length>0){
				const targetY = pos.y - intersect[0].distance;
				if (targetY > this.player.object.position.y){
					//Going up
					this.player.object.position.y = 0.8 * this.player.object.position.y + 0.2 * targetY;
					this.player.velocityY = 0;
				}else if (targetY < this.player.object.position.y){
					//Falling
					if (this.player.velocityY==undefined) this.player.velocityY = 0;
					this.player.velocityY += dt * gravity;
					this.player.object.position.y -= this.player.velocityY;
					if (this.player.object.position.y < targetY){
						this.player.velocityY = 0;
						this.player.object.position.y = targetY;
					}
				}
			}else if (this.player.object.position.y>0){
				if (this.player.velocityY==undefined) this.player.velocityY = 0;
				this.player.velocityY += dt * gravity;
				this.player.object.position.y -= this.player.velocityY;
				if (this.player.object.position.y < 0){
					this.player.velocityY = 0;
					this.player.object.position.y = 0;
				}
			}
		}
		*/
		
		this.player.object.rotateY(this.player.move.turn*dt);
	}


	playerControl(forward, turn) {
		
		turn = -turn;

		if ( forward > 0.2 ) {
			if ( this.player.action != "Walking" && this.player.action != "Running" ) {
				this.setAction("Walking");
			}
		} 
		else if ( forward < -0.2 ) {
			if ( this.player.action != "Walking Backwards" ) {
				this.setAction("Walking Backwards");
			}
		} 
		else {
			forward = 0;
			if ( Math.abs(turn) > 0.05 ) {
				if ( this.player.action != "Turn" ) {
					this.setAction("Turn");
				}
			} 
			else if ( this.player.action != "Idle" ) {
				this.setAction("Idle");
			}
			// else {
			// 	this.setAction("Idle");
			// }
		}

		// if ( forward == 0 && turn == 0 ) {
		//     this.player.move = {};
		// } 
		// else {
			this.player.move = { forward, turn };
		// }
	}

	createCameras() {
		const offset = new THREE.Vector3(0, 80, 0);
		const front = new THREE.Object3D();
		front.position.set(112, 100, 600);
		front.parent = this.player.object;
		const back = new THREE.Object3D();
		back.position.set(0, 300, -600);
		back.parent = this.player.object;
		const wide = new THREE.Object3D();
		wide.position.set(178, 139, 1665);
		wide.parent = this.player.object;
		const overhead = new THREE.Object3D();
		overhead.position.set(0, 400, 0);
		overhead.parent = this.player.object;
		const collect = new THREE.Object3D();
		collect.position.set(40, 82, 94);
		collect.parent = this.player.object;
		this.player.cameras = { front, back, wide, overhead, collect };
		this.setActiveCamera(player.cameras.back);
	}

	setActiveCamera(object) {
		this.player.cameras.active = object;
	}


	loadEnvironment(loader) {
		loader.load(`${this.params.assetsPath}fbx/town.fbx`, function(object){
			this.params.environment = object;
			this.params.colliders = [];
			object.scale.set(0.025, 0.025, 0.025);
			this.scene.add(object);
			object.traverse( function ( child ) {
				if ( child.isMesh ) {
					if (child.name.startsWith("proxy")){
						this.params.colliders.push(child);
						child.material.visible = false;
					}else{
						child.castShadow = true;
						child.receiveShadow = true;
					}
				}
			} );
		})
	}

	loadFarmHouse() {
		let game = this;
		//this.loaderFBX.load(`${this.params.assetsPath}fbx/SM_Bld_Farmhouse_01.fbx`, function(object){
		this.loaderFBX.load(`${this.params.assetsPath}fbx/Building_Farm_House_02.fbx`, function(object){
		//this.loaderFBX.load(`${this.params.assetsPath}fbx/Building_Barn_Big_03.fbx`, function(object){
			this.params.farmhouse = object;
			this.params.colliders = [];
			object.rotation.y = 270 * (Math.PI/180); // 90 degrees in radians
			object.position.set(0, 0, 100);
			//object.scale.set(0.025, 0.025, 0.025);
			object.scale.set(2.2, 2.2, 2.2);
			this.scene.add(object);
			object.traverse( function ( child ) {
				if ( child.isMesh ) {
					if (child.name.startsWith("proxy")){
						this.params.colliders.push(child);
						child.material.visible = false;
					}else{
						child.castShadow = true;
						child.receiveShadow = true;
					}
				}
			} );
			//this.loaderTexture.load(`${this.params.assetsPath}textures/PolygonFarm_Texture_01_A.png`, function(texture) {
			this.loaderTexture.load(`${this.params.assetsPath}textures/SimpleFarm.png`, function(texture) {
				object.traverse( function ( child ) {
					if ( child.isMesh ){
						child.material.map = texture;
					}
				} );
			});
		})
	}

	loadFarmHouseGLTF() {
		
		// loaderFBX.load( `${params.assetsPath}fbx/Building_Farm_House_02.fbx`, function (object) {
		loaderGLTF.load( `${params.assetsPath}gltf/Residential House.glb`, function (object) {

			let model = object.scene;
			model.name = "Farm House";
			model.position.set(0, 0, 100);
			model.scale.set(20, 20, 20);
			model.traverse( function ( child ) {
				if ( child.isMesh ) child.castShadow = true;
			} );
			scene.add(model);

			helper = new THREE.SkeletonHelper(model);
			helper.material.linewidth = 5;
			helper.visible = true;
			scene.add(helper);
			
			console.log("-----------------------");
			console.log("loadFarmHouse object----------------");
			console.log(object);
			console.log("-----------------------");

			console.log("-----------------------");
			console.log("loadFarmHouse model----------------");
			console.log(model);
			console.log("-----------------------");

			guiFolderPlayer.add(model, "visible").name("Show House").listen();

		} );
	}

	loadChickenCoop() {
		loaderFBX.load(`${params.assetsPath}fbx/Prop_Chicken_Coop_02.fbx`, function(object){
			params.farmhouse = object;
			params.colliders = [];
			object.rotation.y = 90 * (Math.PI/180); // 90 degrees in radians
			object.position.set(80, 0, -10);
			object.scale.set(2.2, 2.2, 2.2);
			scene.add(object);
			object.traverse( function ( child ) {
				if ( child.isMesh ) {
					if (child.name.startsWith("proxy")){
						params.colliders.push(child);
						child.material.visible = false;
					}else{
						child.castShadow = true;
						child.receiveShadow = true;
					}
				}
			} );
			loaderTexture.load(`${params.assetsPath}textures/SimpleFarm.png`, function(texture) {
				object.traverse( function ( child ) {
					if ( child.isMesh ){
						child.material.map = texture;
					}
				} );
			});
			
			//loadNextAnim(loader);
		})
	}

	loadChicken() {
		
		loaderGLTF.load( `${params.assetsPath}gltf/Chicken.glb`, function (object) {

			let model = object.scene;
			model.name = "Chicken GLB";
			model.position.set(-3, 0, 0);
			//model.rotation.y = 90 * (Math.PI/180); // 90 degrees in radians
			model.scale.set(4, 4, 4);
			model.traverse( function ( child ) {
				if ( child.isMesh ) child.castShadow = true;
			} );
			scene.add(model);

			// helper = new THREE.SkeletonHelper(model);
			// helper.material.linewidth = 5;
			// helper.visible = true;
			// scene.add(helper);
			
			console.log("-----------------------");
			console.log("loadChicken object----------------");
			console.log(object);
			console.log("-----------------------");

			console.log("-----------------------");
			console.log("loadChicken model----------------");
			console.log(model);
			console.log("-----------------------");

			//guiFolderPlayer.add(model, "visible").name("Show Chicken").listen();

		} );
	}

	loadChicken0() {
		loaderFBX.load(`${params.assetsPath}fbx/Chicken.fbx`, function(object){
			
			console.log("-----------------------");
			console.log("BIRD----------------");
			console.log(object);
			console.log("-----------------------");

			//params.farmhouse = object;
			//params.colliders = [];
			//object.rotation.y = 90 * (Math.PI/180); // 90 degrees in radians
			object.position.set(0, 0, 0);
			//object.scale.set(2.2, 2.2, 2.2);
			scene.add(object);
			object.traverse( function ( child ) {
				if ( child.isMesh ) {
					// if (child.name.startsWith("proxy")){
					// 	params.colliders.push(child);
					// 	child.material.visible = false;
					// }else{
						child.castShadow = true;
						child.receiveShadow = true;
					//}
				}
			} );
			// loaderTexture.load(`${params.assetsPath}textures/SimpleAnimalsFarm.png`, function(texture) {
			// 	object.traverse( function ( child ) {
			// 		if ( child.isMesh ){
			// 			child.material.map = texture;
			// 		}
			// 	} );
			// });
			
			//loadNextAnim(loader);
		})
	}

	loadChicken1() {
		loaderFBX.load(`${params.assetsPath}fbx/SA_Animal_Birds.fbx`, function(object){
			
			console.log("-----------------------");
			console.log("BIRD----------------");
			console.log(object);
			console.log("-----------------------");

			//params.farmhouse = object;
			//params.colliders = [];
			//object.rotation.y = 90 * (Math.PI/180); // 90 degrees in radians
			object.position.set(0, 0, 0);
			//object.scale.set(2.2, 2.2, 2.2);
			scene.add(object);
			object.traverse( function ( child ) {
				if ( child.isMesh ) {
					// if (child.name.startsWith("proxy")){
					// 	params.colliders.push(child);
					// 	child.material.visible = false;
					// }else{
						child.castShadow = true;
						child.receiveShadow = true;
					//}
				}
			} );
			loaderTexture.load(`${params.assetsPath}textures/SimpleAnimalsFarm.png`, function(texture) {
				object.traverse( function ( child ) {
					if ( child.isMesh ){
						child.material.map = texture;
					}
				} );
			});
			
			//loadNextAnim(loader);
		})
	}

	loadChickenGLTF() {
		
		loaderGLTF.load( `${params.assetsPath}gltf/Animals.glb`, function (object) {

			console.log("-----------------------");
			console.log("Animals object----------------");
			console.log(object);
			console.log("-----------------------");

			object.mixer = new THREE.AnimationMixer( object.scene );
			player.mixer = object.mixer;
			player.root = object.mixer.getRoot();
				
			object.name = "Chicken Dance";
					
			object.scene.traverse( function ( child ) {
				if ( child.isMesh ) {
					child.castShadow = true;
					child.receiveShadow = false;		
				}
			} );

			player.object = new THREE.Object3D();
			player.object.add(object.scene);
			player.object.position.set(0, 0, 10);
			player.object.scale.set(4, 4, 4);
			player.object.rotation.x = Math.PI/2; // 90 degrees in radians
			player.mixer.timeScale = 0.5;
			player.mixer.clipAction(object.animations[2]).play();
			
			//animations.Idle = object.animations[0];
			//setAction("Idle");
			plane.add(player.object);
			//guiFolderPlayer.add(player.object, "visible").name("Show Character").listen();

			//animate();
			// OR
			//loadNextAnim(loaderFBX);
			// OR
			//loadEnvironment(loaderFBX);

		} );
	}

	loadChickGLTF() {
		
		loaderGLTF.load( `${params.assetsPath}gltf/Chick.glb`, function (object) {

			let model = object.scene;
			model.name = "Chick GLB";
			model.position.set(3, 0, 0);
			//model.rotation.y = 90 * (Math.PI/180); // 90 degrees in radians
			model.scale.set(2, 2, 2);
			model.traverse( function ( child ) {
				if ( child.isMesh ) child.castShadow = true;
			} );
			scene.add(model);

			// helper = new THREE.SkeletonHelper(model);
			// helper.material.linewidth = 5;
			// helper.visible = true;
			// scene.add(helper);
			
			console.log("-----------------------");
			console.log("loadChickGLTF object----------------");
			console.log(object);
			console.log("-----------------------");

			console.log("-----------------------");
			console.log("loadChickGLTF model----------------");
			console.log(model);
			console.log("-----------------------");

			//guiFolderPlayer.add(model, "visible").name("Show Chicken").listen();

		} );
	}

	loadHen() {
		loaderFBX.load(`${params.assetsPath}Hen&Chicken_FBX/Hen_HP.fbx`, function(object){
			params.farmhouse = object;
			params.colliders = [];
			//object.rotation.y = 270 * (Math.PI/180); // 90 degrees in radians
			object.position.set(3, 0, 0);
			object.scale.set(0.05, 0.05, 0.05);

			object.traverse( function ( child ) {
				if ( child.isMesh ) {
					if (child.name.startsWith("proxy")){
						params.colliders.push(child);
						child.material.visible = false;
					}else{
						child.castShadow = true;
						child.receiveShadow = true;
					}
				}
			} );

			loaderTexture.load(`${params.assetsPath}Hen&Chicken_FBX/Textures/Hen&Chicken_A.png`, function(texture) {
				object.traverse( function ( child ) {
					if ( child.isMesh ){
						child.material.map = texture;

						console.log("-----------------------");
						console.log("loadHen child----------------");
						console.log(child);
						console.log(child.geometry.attributes.uv);
						console.log("-----------------------");
					}
				} );
			});

			console.log("-----------------------");
			console.log("loadHen object----------------");
			console.log(object);
			console.log("-----------------------");

			scene.add(object);
			
			//loadNextAnim(loader);
		})
	}

	loadHenGLTF() {
		
		// loaderFBX.load( `${params.assetsPath}fbx/Building_Farm_House_02.fbx`, function (object) {
		loaderGLTF.load( `${params.assetsPath}gltf/Hen_HP.glb`, function (object) {

			let model = object.scene;
			//model.name = "Hen";
			//model.position.set(10, 0, 0);
			//model.scale.set(0.2, 0.2, 0.2);
			model.traverse( function ( child ) {
				if ( child.isMesh ) child.castShadow = true;
			} );
			scene.add(model);

			// helper = new THREE.SkeletonHelper(model);
			// helper.material.linewidth = 5;
			// helper.visible = true;
			// scene.add(helper);
			
			console.log("-----------------------");
			console.log("loadHenGLTF object----------------");
			console.log(object);
			console.log("-----------------------");

			console.log("-----------------------");
			console.log("loadHenGLTF model----------------");
			console.log(model);
			console.log("-----------------------");

			//guiFolderPlayer.add(model, "visible").name("Show Hen GLTF").listen();

		} );
	}

	loadKitchenSink() {
		loaderFBX.load(`${params.assetsPath}fbx/Prop_KitchenSink_Black.fbx`, function(object){
			params.farmhouse = object;
			params.colliders = [];
			object.rotation.y = 270 * (Math.PI/180); // 90 degrees in radians
			object.position.set(0, 0, 10);
			//object.scale.set(0.025, 0.025, 0.025);
			object.scale.set(2.2, 2.2, 2.2);
			scene.add(object);
			object.traverse( function ( child ) {
				if ( child.isMesh ) {
					if (child.name.startsWith("proxy")){
						params.colliders.push(child);
						child.material.visible = false;
					}else{
						child.castShadow = true;
						child.receiveShadow = true;
					}
				}
			} );
			//loaderTexture.load(`${params.assetsPath}textures/PolygonFarm_Texture_01_A.png`, function(texture) {
			loaderTexture.load(`${params.assetsPath}textures/SimpleInteriorsHouses.png`, function(texture) {
				object.traverse( function ( child ) {
					if ( child.isMesh ){
						child.material.map = texture;
					}
				} );
			});
			
			//loadNextAnim(loader);
		})
	}

	loadChickenFree() {
		loaderOBJ.load(`${params.assetsPath}obj/chicken_01.obj`, function(object){
			// params.farmhouse = object;
			// params.colliders = [];
			//object.rotation.y = 270 * (Math.PI/180); // 90 degrees in radians
			//object.position.set(0, 0, 10);
			//object.scale.set(0.025, 0.025, 0.025);
			//object.scale.set(2.2, 2.2, 2.2);
			scene.add(object);
			// object.traverse( function ( child ) {
			// 	if ( child.isMesh ) {
			// 		if (child.name.startsWith("proxy")){
			// 			params.colliders.push(child);
			// 			child.material.visible = false;
			// 		}else{
			// 			child.castShadow = true;
			// 			child.receiveShadow = true;
			// 		}
			// 	}
			// } );
			// //loaderTexture.load(`${params.assetsPath}textures/PolygonFarm_Texture_01_A.png`, function(texture) {
			// loaderTexture.load(`${params.assetsPath}textures/SimpleInteriorsHouses.png`, function(texture) {
			// 	object.traverse( function ( child ) {
			// 		if ( child.isMesh ){
			// 			child.material.map = texture;
			// 		}
			// 	} );
			// });
			
			//loadNextAnim(loader);
		})
	}

	loadRooster() {
		loaderFBX.load(`${params.assetsPath}fbx/rooster_1.0.1.fbx`, function(object){
			// params.farmhouse = object;
			// params.colliders = [];
			//object.rotation.y = 270 * (Math.PI/180); // 90 degrees in radians
			object.position.set(0, 0, 10);
			object.scale.set(0.025, 0.025, 0.025);
			//object.scale.set(2.2, 2.2, 2.2);
			scene.add(object);
			// object.traverse( function ( child ) {
			// 	if ( child.isMesh ) {
			// 		if (child.name.startsWith("proxy")){
			// 			params.colliders.push(child);
			// 			child.material.visible = false;
			// 		}else{
			// 			child.castShadow = true;
			// 			child.receiveShadow = true;
			// 		}
			// 	}
			// } );
			// //loaderTexture.load(`${params.assetsPath}textures/PolygonFarm_Texture_01_A.png`, function(texture) {
			// loaderTexture.load(`${params.assetsPath}textures/SimpleInteriorsHouses.png`, function(texture) {
			// 	object.traverse( function ( child ) {
			// 		if ( child.isMesh ){
			// 			child.material.map = texture;
			// 		}
			// 	} );
			// });
			
			//loadNextAnim(loader);
		})
	}

	loadRoad() {

		let i;
		let count = 9;
		let startX = -45;
		let offsetX = 0;
		let startZ = -138;
		let offsetZ = 20;

		// ROAD A
		for ( i = 1; i <= count; i++ ) {
			loaderFBX.load(`${params.assetsPath}fbx/SM_Env_Road_Gravel_Straight_01.fbx`, function(object){
				
				// console.log("-----------------------");
				// console.log("ROAD----------------");
				// console.log(object);
				// console.log("-----------------------");

				//params.farmhouse = object;
				//params.colliders = [];
				//object.rotation.y = 90 * (Math.PI/180); // 90 degrees in radians
				object.position.set(startX, 0, startZ);
				startX = startX + offsetX;
				startZ = startZ + offsetZ;
				object.scale.set(0.02, 0.01, 0.02);
				object.traverse( function ( child ) {
					if ( child.isMesh ) {
						// if (child.name.startsWith("proxy")){
						// 	params.colliders.push(child);
						// 	child.material.visible = false;
						// }else{
							child.castShadow = true;
							child.receiveShadow = true;
						//}
					}
				} );
				loaderTexture.load(`${params.assetsPath}textures/PolygonFarm_Texture_03_A.png`, function(texture) {
					object.traverse( function ( child ) {
						if ( child.isMesh ){
							//child.material.color.setHex(0x000000);
							child.material.transparent = true;
							child.material.opacity = 0.7;
							//child.material.depthWrite = true;
							child.material.map = texture;
						}
					} );
				});
				
				scene.add(object);
				
				console.log("-----------------------");
				console.log("ROAD----------------");
				console.log(object);
				console.log("-----------------------");
				
				//loadNextAnim(loader);
			});

		}
		// ROAD T
		for ( i = 1; i <= 1; i++ ) {
			loaderFBX.load(`${params.assetsPath}fbx/SM_Env_Road_Gravel_T_Section_01.fbx`, function(object){
				
				console.log("-----------------------");
				console.log("ROAD T----------------");
				console.log(startX, startZ);
				console.log("-----------------------");

				//params.farmhouse = object;
				//params.colliders = [];
				//object.rotation.y = 90 * (Math.PI/180); // 90 degrees in radians
				object.position.set(startX, 0, startZ);
				startX = startX + offsetX;
				startZ = startZ + offsetZ;
				object.scale.set(0.02, 0.01, 0.02);
				object.traverse( function ( child ) {
					if ( child.isMesh ) {
						// if (child.name.startsWith("proxy")){
						// 	params.colliders.push(child);
						// 	child.material.visible = false;
						// }else{
							child.castShadow = true;
							child.receiveShadow = true;
						//}
					}
				} );
				loaderTexture.load(`${params.assetsPath}textures/PolygonFarm_Texture_03_A.png`, function(texture) {
					object.traverse( function ( child ) {
						if ( child.isMesh ){
							//child.material.color.setHex(0x000000);
							child.material.transparent = true;
							child.material.opacity = 0.7;
							//child.material.depthWrite = true;
							child.material.map = texture;
						}
					} );
				});
				
				scene.add(object);
				
				console.log("-----------------------");
				console.log("ROAD T----------------");
				console.log(object);
				console.log("-----------------------");
				
				//loadNextAnim(loader);
			});

		}
	}


	/**
	 * BUILD "ALLOTMENTS" FROM REST API POST OBJECT ************************************************************
	 */
	buildAllotments(postObject, plane, sceneID) {

		let game = this;

		// console.log("-------------------------");
		// console.log("postObject ALLOTMENTS----");
		// console.log(postObject);
		// console.log("-------------------------");
		
		var filteredPostObject = postObject.filter(function (obj) {
			return obj.acf.allotment_scene == sceneID;
		});
		// console.log("filteredPostObject-------");
		// console.log(filteredPostObject);
		// console.log("-------------------------");

		filteredPostObject.forEach( function(key) {

			// console.log("-------------------------");
			// console.log("key.id (postObject)------");
			// console.log(key.id);
			// console.log(key);
			// console.log("-------------------------");

			// BUILD ALLOTMENT OBJECT GROUP
			let allotment = {};
			allotment.parameters = {};
			allotment.position = {};
			allotment.images = {};
			allotment.parameters.x = parseInt(key.acf.allotment_width);
			allotment.parameters.y = parseInt(key.acf.allotment_length);
			allotment.parameters.z = parseInt(key.acf.allotment_height); // 0
			allotment.position.x = parseInt(key.acf.allotment_position_x);
			allotment.position.y = parseInt(key.acf.allotment_position_y);
			allotment.position.z = parseInt(key.acf.allotment_position_z);
			allotment.images.texture = key.acf.allotment_texture_image;
			allotment.images.featured = game.getFeaturedImage(key);
			allotment.shape = key.acf.allotment_shape;
			allotment.color = key.acf.allotment_color;
			allotment.title = key.title.rendered;
			allotment.postID = key.id;
			allotment.description = key.content.rendered;
			allotment.link = key.link;

			// console.log("-------------------------");
			// console.log("allotment----------------");
			// console.log(allotment);
			// console.log("-------------------------");

			let structure = game.getGeometry(
				allotment.shape,
				allotment.parameters.x, 
				allotment.parameters.y, 
				allotment.parameters.z, 
				allotment.color
			);
			structure.name = allotment.title;
			structure.userData.type = "structure";
			structure.userData.postID = allotment.postID;
			structure.userData.description = allotment.description;
			structure.userData.annotation = allotment.title;
			structure.userData.link = allotment.link;
			structure.position.x = allotment.position.x;
			structure.position.y = allotment.position.y;
			structure.position.z = (structure.geometry.parameters.depth / 2) + allotment.position.z; // - 10 for gap between plane
			structure.material.roughness = 0.9;
			if (allotment.images.texture != null && allotment.images.texture != false) {
				structure.material.map = game.loaderTexture.load(allotment.images.texture);
				for (let i = 0; i < structure.material.length; i++) {
					// hightlight object
					//structure.material[i].color.set(0xff0000);
					structure.material[i].map = game.loaderTexture.load(allotment.images.texture);
					//structure.faces[i].materialIndex = 1;
					//console.log(intersects[i]);
					// structure.material[i].bumpMap = loaderTexture.load(allotment.images.texture);
					// structure.material[i].bumpScale = 0.05;
					let structureTextureMap = structure.material[i].map;
					structureTextureMap.wrapS = THREE.RepeatWrapping;
					structureTextureMap.wrapT = THREE.RepeatWrapping;
					structureTextureMap.repeat.set(4, 4);
				}
			}
			
			plane.add(structure);

			//params.colliders.push(structure);

			//guiFolderAllotments.add(structure.geometry.parameters, "depth", 0, allotment.parameters.z);
			
			// console.log("-------------------------");
			// console.log("allotment----------------");
			// console.log(structure);
			// console.log("-------------------------");

			/** BUILD BEDS IN THIS ALLOTMENT ************************************************** */

			game.buildBeds(
				game.params.data.bed, 
				plane, 
				allotment.postID, // the post-to-post relationship <3
				structure.position.x, structure.position.y, 0 //structure.position.z
			) 

			/** INFOSPOTS ********************************************************************* */

			let infospot = game.makeInfospotSphere(
				structure.name, 
				structure.position.x, 
				structure.position.y, 
				allotment.parameters.z + 3,
				allotment.postID,
				structure.userData.annotation,
				structure.userData.link 
			);
			infospot.name = `INFOSPOT: ${structure.name}`;
			infospot.visible = true;

			game.guiFolderAllotments.add(infospot, "visible").name("InfoSphere").listen();

			plane.add(infospot);

		}); /** END ALLOTMENTS ****************************************************************** */
		
		// console.log("-------------------------");
		// console.log("plane.children-----------");
		// console.log(plane.children);
		// console.log("-------------------------");

		// return plane.children;
	}

	/**
	 * BUILD "BEDS" FROM REST API POST OBJECT ************************************************************
	 */
	buildBeds(postObject, plane, allotmentID, posOffsetX, posOffsetY, posOffsetZ) {

		let game = this;

		// console.log("-------------------------");
		// console.log("postObject BEDS----------");
		// console.log(postObject);
		// console.log("-------------------------");
		
		// only show beds for this allotment structure
		var filteredPostObject = postObject.filter(function (obj) {
			return obj.acf.bed_allotment == allotmentID;
		});
		// console.log("filteredPostObject-------");
		// console.log(filteredPostObject);
		// console.log("-------------------------");

		filteredPostObject.forEach( function(key) {

			// console.log("-------------------------");
			// console.log("key.id (postObject)------");
			// console.log(key.id);
			// console.log(key);
			// console.log("-------------------------");

			let bed = {};
			bed.parameters = {};
			bed.position = {};
			bed.images = {};
			bed.parameters.x = parseInt(key.acf.bed_width) / 12;
			bed.parameters.y = parseInt(key.acf.bed_length) / 12;
			bed.parameters.z = parseInt(key.acf.bed_height) / 12;
			bed.position.x = parseInt(key.acf.bed_position_x) / 12 + posOffsetX;
			bed.position.y = parseInt(key.acf.bed_position_y) / 12 + posOffsetY;
			bed.position.z = parseInt(key.acf.bed_position_z) / 12 + (bed.parameters.z / 2); // + posOffsetZ;
			bed.images.texture = key.acf.bed_texture_image;
			bed.images.featured = game.getFeaturedImage(key);
			bed.shape = key.acf.bed_shape;
			bed.color = key.acf.bed_color;
			bed.title = key.title.rendered;
			bed.postID = key.id;
			bed.description = key.content.rendered;
			bed.link = key.link;

			// console.log("-------------------------");
			// console.log("bed----------------");
			// console.log(bed);
			// console.log("-------------------------");

			let structure = game.getGeometry(
				bed.shape,
				bed.parameters.x, 
				bed.parameters.y, 
				bed.parameters.z, 
				bed.color
			);
			structure.name = bed.title;
			structure.userData.type = "structure";
			structure.userData.postID = bed.postID;
			structure.userData.description = bed.description;
			structure.userData.annotation = bed.title;
			structure.userData.link = bed.link;
			structure.position.x = bed.position.x ? bed.position.x : 0;
			structure.position.y = bed.position.y ? bed.position.y : 0;
			structure.position.z = bed.position.z ? bed.position.z : 0;
			//structure.rotation.x = -Math.PI / 2; // -90 degrees in radians
			structure.material.roughness = 0.9;
			if (bed.images.texture != null && bed.images.texture != false) {
				structure.material.map = game.loaderTexture.load(bed.images.texture);
				for (let i = 0; i < structure.material.length; i++) {
					// hightlight object
					//structure.material[i].color.set(0xff0000);
					structure.material[i].map = game.loaderTexture.load(bed.images.texture);
					//structure.faces[i].materialIndex = 1;
					//console.log(intersects[i]);
					// structure.material[i].bumpMap = loaderTexture.load(bed.images.texture);
					// structure.material[i].bumpScale = 0.05;
					let structureTextureMap = structure.material[i].map;
					structureTextureMap.wrapS = THREE.RepeatWrapping;
					structureTextureMap.wrapT = THREE.RepeatWrapping;
					structureTextureMap.repeat.set(4, 4);
				}
			}
			
			plane.add(structure);

			game.params.colliders.push(structure);
			
			// console.log("-------------------------");
			// console.log("bed----------------------");
			// console.log(structure);
			// console.log("-------------------------");

			/** BUILD PLANTS IN THIS BED, ACCORDING TO PLANTING PLANS ************************* */

			game.buildPlantingPlans(
				game.params.data.planting_plan, 
				plane, 
				bed.postID, // the post-to-post relationship <3
				structure.position.x, structure.position.y, 0 //structure.position.z
			) 
		
			/** INFOSPOTS ********************************************************************* */
		
			let infospot = game.makeInfospotSphere(
				structure.name, 
				structure.position.x, 
				structure.position.y, 
				bed.parameters.z + 3,
				bed.postID,
				structure.userData.annotation,
				structure.userData.link 
			);
			infospot.name = `INFOSPOT: ${structure.name}`;
			infospot.visible = false;

			game.guiFolderBeds.add(infospot, "visible").name("InfoSphere").listen();

			plane.add(infospot);

		}); /** END BEDS *********************************************************************** */
		
		// console.log("-------------------------");
		// console.log("plane.children-----------");
		// console.log(plane.children);
		// console.log("-------------------------");

		// return plane.children;
	}

	/**
	 * BUILD "PLANTS" FROM REST API POST OBJECT ************************************************************
	 */
	buildPlantingPlans(postObject, plane, bedID, posOffsetX, posOffsetY, posOffsetZ) {

		let game = this;

		// console.log("-------------------------");
		// console.log("postObject PLANTING PLANS");
		// console.log(postObject);
		// console.log("-------------------------");

		// only show plants for this planting plan's bed structure
		var filteredPostObject = [];
		var matches = [];
		postObject.forEach(function (obj) {
			obj.acf.planting_plan_bed_plant_schedule.forEach(function(i) {
				if ( i.planting_plan_bed == bedID ) {
					//console.log("MATCHED at: ", i);
					//matches.push(i);
					//matches.push(obj);
					matches.pushIfNotExist(obj, function(e) { 
						return e.id === obj.id; 
					});
				}
			})
			filteredPostObject = [...matches];
		});

		// if ( filteredPostObject.length > 0 ) {
		// 	console.log("filteredPostObject-------");
		// 	console.log(filteredPostObject);
		// 	console.log("-------------------------");
		// }

		// for each planting plan..
		filteredPostObject.forEach( function(key) {

			// console.log("-------------------------");
			// console.log("key.id (filteredPostObject)------");
			// console.log(key.id);
			// console.log(key);
			// console.log("-------------------------");

			// for each planting plan bed-plant schedule..
			key.acf.planting_plan_bed_plant_schedule.forEach(function(key2) {
				
				// console.log("key2-------");
				// console.log(key2);
				// console.log("-------------------------");

				// only for this bed..
				if ( key2.planting_plan_bed == bedID ) {
				
					// show this plant (or multiple plants) in this bed..
					var filteredPlant = game.params.data.plant.filter(function (obj) {
						return obj.id == key2.planting_plan_plant;
					});

					// console.log("filteredPlant------------");
					// console.log(filteredPlant);
					// console.log("-------------------------");

					// for this plant in this bed..
					filteredPlant.forEach(function(key3) {

						// console.log("key3---------------------");
						// console.log(key3);
						// console.log("-------------------------");

						let plant = {};
						plant.parameters = {};
						plant.position = {};
						plant.images = {};
						plant.parameters.x = parseInt(key3.acf.plant_width) / 12;
						plant.parameters.y = parseInt(key3.acf.plant_length) / 12;
						plant.parameters.z = parseInt(key3.acf.plant_height) / 12;
						plant.position.x = parseInt(key2.plant_position_x) / 12 + posOffsetX;
						plant.position.y = parseInt(key2.plant_position_y) / 12 + posOffsetY;
						plant.position.z = parseInt(key2.plant_position_z) / 12 + (plant.parameters.z / 2); // + posOffsetZ;
						plant.images.texture = key3.acf.plant_texture_image;
						plant.images.featured = game.getFeaturedImage(key);
						plant.shape = key3.acf.plant_shape;
						plant.color = key3.acf.plant_color;
						plant.title = key3.title.rendered;
						plant.postID = key3.id;
						plant.description = key3.content.rendered;
						plant.link = key3.link;

						// console.log("-------------------------");
						// console.log("plant----------------");
						// console.log(plant);
						// console.log("-------------------------");

						let structure = game.getGeometry(
							"Tree", // "Bush", // plant.shape,
							plant.parameters.x, 
							plant.parameters.y, 
							plant.parameters.z, 
							plant.color
						);
						structure.name = plant.title;
						structure.userData.type = "structure";
						structure.userData.postID = plant.postID;
						structure.userData.description = plant.description;
						structure.userData.annotation = plant.title;
						structure.userData.link = plant.link;
						structure.position.x = plant.position.x ? plant.position.x : 0;
						structure.position.y = plant.position.y ? plant.position.y : 0;
						structure.position.z = plant.position.z ? plant.position.z : 0;
						structure.rotation.x = Math.PI / 2; // 90 degrees in radians
						structure.material.roughness = 0.9;
						if (plant.images.texture != null && plant.images.texture != false) {
							structure.material.map = game.loaderTexture.load(plant.images.texture);
							for (let i = 0; i < structure.material.length; i++) {
								// hightlight object
								//structure.material[i].color.set(0xff0000);
								structure.material[i].map = loaderTexture.load(plant.images.texture);
								//structure.faces[i].materialIndex = 1;
								//console.log(intersects[i]);
								// structure.material[i].bumpMap = loaderTexture.load(plant.images.texture);
								// structure.material[i].bumpScale = 0.05;
								let structureTextureMap = structure.material[i].map;
								structureTextureMap.wrapS = THREE.RepeatWrapping;
								structureTextureMap.wrapT = THREE.RepeatWrapping;
								structureTextureMap.repeat.set(4, 4);
							}
						}
						
						plane.add(structure);

						game.params.colliders.push(structure);
						
						console.log("-------------------------");
						console.log("plant structure----------");
						console.log(structure);
						console.log("-------------------------");
					
						/** INFOSPOTS ********************************************************************* */
					
						let infospot = game.makeInfospotSphere(
							structure.name, 
							structure.position.x, 
							structure.position.y, 
							plant.parameters.z + 3,
							plant.postID,
							structure.userData.annotation,
							structure.userData.link 
						);
						infospot.name = `INFOSPOT: ${structure.name}`;
						infospot.visible = false;

						game.guiFolderBeds.add(infospot, "visible").name("InfoSphere").listen();

						plane.add(infospot);
				
					})

				} // end if

			})

		}); /** END PLANTS *************************************************************************** */
		
		// console.log("-------------------------");
		// console.log("plane.children-----------");
		// console.log(plane.children);
		// console.log("-------------------------");

		// return plane.children;
	}



	getGeometry(shape, x, y, z, color){
		let geometry;
		let material;
		let mesh;
		switch (shape) {
			case "Box":
				geometry = new THREE.BoxGeometry(x, y, z);
				// let opacMaterial = new THREE.MeshStandardMaterial({
				// 	transparent: true, 
				// 	opacity: 0.0,
				// 	alphaTest: 1.0,
				// 	color: color,
				// 	side: THREE.DoubleSide,
				// 	depthWrite: false
				// });
				material = new THREE.MeshStandardMaterial({
					transparent: true, 
					opacity: 0.8,
					color: color,
					side: THREE.DoubleSide,
					depthWrite: true
				});
				mesh = new THREE.Mesh(
					geometry, 
					[
						material, material, 
						material, material
					]
				);
				mesh.castShadow = true;
				break;

			case "Cone":
				geometry = new THREE.ConeGeometry(x/2, y/2, z, 32, 1, true);
				material = new THREE.MeshStandardMaterial({
					color: color,
					side: THREE.DoubleSide
				});
				mesh = new THREE.Mesh(geometry, material);
				mesh.castShadow = true;
				mesh.rotation.x = Math.PI / 2; // 90 degrees in radians
				break;

			case "Cylinder":
				geometry = new THREE.CylinderGeometry(x/2, y/2, z, 32, 1, true);
				material = new THREE.MeshStandardMaterial({
					color: color,
					side: THREE.DoubleSide
				});
				mesh = new THREE.Mesh(geometry, material);
				mesh.castShadow = true;
				mesh.rotation.x = Math.PI / 2; // 90 degrees in radians
				break;

			case "InfoSphere":
				geometry = new THREE.SphereGeometry(x, y, z);
				material = new THREE.MeshStandardMaterial({
					color: color,
					side: THREE.DoubleSide
				});
				mesh = new THREE.Mesh(geometry, material);
				mesh.castShadow = true;
				//mesh.rotation.x = Math.PI / 2; // 90 degrees in radians
				break;

			case "Sphere":
				geometry = new THREE.SphereGeometry(x, y, z);
				material = new THREE.MeshStandardMaterial({
					color: color,
					side: THREE.DoubleSide
				});
				mesh = new THREE.Mesh(geometry, material);
				mesh.castShadow = true;
				//mesh.rotation.x = Math.PI / 2; // 90 degrees in radians
				break;

			case "Tree":
				let tree = new THREE.Tree({
					generations : 3,        // # for branch hierarchy
					length      : 1.0,      // length of root branch
					uvLength    : 3.0,      // uv.v ratio against geometry length (recommended is generations * length)
					radius      : 0.1,      // radius of root branch
					radiusSegments : 8,     // # of radius segments for each branch geometry
					heightSegments : 8      // # of height segments for each branch geometry
				});
				geometry = THREE.TreeGeometry.build(tree);
				//geometry = new THREE.SphereGeometry(x, y, z);
				material = new THREE.MeshStandardMaterial({
					color: color,
					side: THREE.DoubleSide
				});
				mesh = new THREE.Mesh(geometry, material);
				mesh.castShadow = true;
				//mesh.rotation.x = Math.PI / 2; // 90 degrees in radians
				break;

			default:
				geometry = new THREE.BoxGeometry(x, y, z);
				material = new THREE.MeshStandardMaterial({
					color: color,
					side: THREE.DoubleSide
				});
				mesh = new THREE.Mesh(geometry, material);
				mesh.castShadow = true;
				break;
		}
		
		return mesh;
	}

	getPlane(x, y, color){
		let geometry = new THREE.PlaneGeometry(x, y);
		let material = new THREE.MeshStandardMaterial({
			color: color,
			side: THREE.DoubleSide
		});
		let mesh = new THREE.Mesh(geometry, material);
		mesh.receiveShadow = true;
		return mesh;
	}

	getPointLight(color, intensity){
		let light = new THREE.PointLight(color, intensity);
		light.castShadow = true;
		light.shadow.bias = 0.001;
		light.shadow.mapSize.width = 4096; //default = 1024
		light.shadow.mapSize.height = 4096; //default = 1024
		return light;
	}

	getSpotLight(color, intensity){
		let light = new THREE.SpotLight(color, intensity);
		light.castShadow = true;
		light.shadow.bias = 0.001;
		light.shadow.mapSize.width = 2048; //default = 1024
		light.shadow.mapSize.height = 2048; //default = 1024
		return light;
	}

	getDirectionalLight(color, intensity){
		let light = new THREE.DirectionalLight(color, intensity);
		light.castShadow = true;
		light.shadow.bias 			= 0.0001;
		light.shadow.mapSize.width 	= 4096; //default = 512
		light.shadow.mapSize.height = 4096; //default = 512
		light.shadow.camera.left 	= -1000; //default = -5
		light.shadow.camera.bottom 	= -1000; //default = -5
		light.shadow.camera.right 	= 1000; //default = 5
		light.shadow.camera.top 	= 1000; //default = 5
		light.shadow.camera.near 	= 0.5; // default
		light.shadow.camera.far 	= 500; // default
		return light;
	}

	getAmbientLight(color, intensity){
		let light = new THREE.AmbientLight(color, intensity);
		return light;
	}


	/**
	 * INFOSPOTS **************************************************************************************
	 */
	makeInfospotSprite(message, positionX, positionY, positionZ) {
		/**
		 * infospot
		 */
		let infospotCanvas = document.querySelector("#infospot")
		let ctx = infospotCanvas.getContext("2d");
		let x = 32;
		let y = 32;
		let radius = 30;
		let startAngle = 0;
		let endAngle = Math.PI * 2;
		// background
		ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
		ctx.beginPath();
		ctx.arc(x, y, radius, startAngle, endAngle);
		ctx.fill();
		// border
		ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
		ctx.lineWidth = 4;
		ctx.beginPath();
		ctx.arc(x, y, radius, startAngle, endAngle);
		ctx.stroke();
		// foreground
		ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
		ctx.font = "40px sans-serif";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		// text
		ctx.fillText(message, x, y);


		const infospotTexture = new THREE.CanvasTexture(
			infospotCanvas[0]
			//document.querySelector("#infospot")
			//$("#infospot")
		);

		const infospotMaterial = new THREE.SpriteMaterial({
			map: infospotTexture,
			opacity: 0.8,
			transparent: true,
			depthTest: false,
			depthWrite: false
		});

		let infospot = new THREE.Sprite(infospotMaterial);
		infospot.position.set(positionX, positionY, positionZ);
		infospot.scale.set(2, 2, 2);
		infospot.visible = true;

		return infospot;
	}

	makeInfospotSphere(message, positionX, positionY, positionZ, postID, contentHTML, link) {

		let game = this;

		/**
		 * INFOSPOT ********************************************************************
		 */
		let structure = this.getGeometry(
			"InfoSphere",
			0.90, // radius
			32, // width segments
			32, // height segments
			0x2e3959
		);	
		structure.name = message;
		structure.userData.type = "infospot";
		structure.userData.postID = postID;
		structure.userData.description = "";
		structure.userData.annotation = contentHTML;
		structure.userData.link = link;
		// structure.position.x = positionX;
		// structure.position.y = positionY;
		// structure.position.z = positionZ;
		structure.position.set(positionX, positionY, positionZ);
		//structure.rotation.x = -Math.PI / 2; // -90 degrees in radians
		//structure.scale.set(2, 2, 2);
		structure.visible = true;
			
		/** 
		 * ANNOTATION ****************************************************************** 
		 */
		//
		let vector = new THREE.Vector3(structure.position.x, structure.position.y, 0); //camera.position.z //structure.position.z
		// camera.updateProjectionMatrix();
		// camera.updateMatrixWorld();
		// let vector = new THREE.Vector3();
		// vector.setFromMatrixPosition(structure.matrixWorld);
		vector.project(this.camera);

		vector.x = Math.round((0.5 + vector.x / 2) * (this.renderer.domElement.width / window.devicePixelRatio));
		vector.y = Math.round((0.5 - vector.y / 2) * (this.renderer.domElement.height / window.devicePixelRatio));
		// vector.x = (structure.position.x / (window.innerWidth - 240)) * 2 - 1;
		// vector.y = -(structure.position.y / (window.innerHeight - 100)) * 2 + 1;
		// vector.x = Math.round( (   vector.x + 1 ) * this.renderer.domElement.width / 2 );
		// vector.y = Math.round( ( - vector.y + 1 ) * this.renderer.domElement.height / 2 );

		let annoPosTop = vector.x;
		let annoPosLeft = vector.y;
		//
		// let annoPosTop = 100;
		// let annoPosLeft = 240;

		let annotation = this.makeAnnotation(
			structure.userData.link,
			structure.name,
			annoPosTop, 
			annoPosLeft
		)
		annotation.name = `ANNOTATION: ${structure.name}`;
		annotation.userData.type = "annotation";
		annotation.userData.postID = postID;
		annotation.userData.description = "";
		annotation.userData.annotation = structure.name;
		annotation.userData.link = link;
		annotation.visible = false; // does nothing, but keeps status accurate

		// console.log("-------------------------");
		// console.log("annotation---------------------");
		// console.log(annotation);
		// console.log("-------------------------");
		
		structure.add(annotation);
		
		return structure;
	}

	makeAnnotation(link, contentHTML, positionX, positionY) {

		let game = this;

		let annoDiv = document.createElement("div");
		annoDiv.classList.add("annotation");
		annoDiv.innerHTML = `
			<a href="${link}" target="_blank">${contentHTML}</a>
			(${positionX}, ${positionY})
			<span class="dismiss" onclick="dismiss(this);">x</span>
		`;
		annoDiv.hidden = true;
		annoDiv.style.display = "none"; //block
		annoDiv.style.top = `${positionY}px`;
		annoDiv.style.left = `${positionX}px`;
		this.guiFolderAnnotations.add(annoDiv, "hidden").listen();
		this.guiFolderAnnotations.add(annoDiv.style, "display").listen();
		this.guiFolderAnnotations.add(annoDiv.style, "top").listen();
		this.guiFolderAnnotations.add(annoDiv.style, "left").listen();
		document.body.appendChild( annoDiv );

		// Make the DIV element draggable
		this.dragElement(annoDiv);

		let cssObject = new THREE.CSS3DObject( annoDiv );
		// trying to do stuff to a cssObject does nothing :(
		// // we reference the same position and rotation 
		// cssObject.position = rendererDomElement.position;
		// cssObject.rotation = rendererDomElement.rotation;
		// cssObject.position.set(positionX, positionY, positionZ);
		// cssObject.scale.set(3, 3, 3);
		// cssObject.visible = true;
		// console.log("------------------");
		// console.log("cssObject---------");
		// console.log(cssObject);
		// console.log("------------------");

		//return annoDiv;
		return cssObject;
	}

	makeTextSprite(message, parameters) {
		if ( parameters === undefined ) parameters = {};
		let fontface = parameters.hasOwnProperty("fontface") ? 
			parameters["fontface"] : "Arial";
		let fontsize = parameters.hasOwnProperty("fontsize") ? 
			parameters["fontsize"] : 18;
		let borderThickness = parameters.hasOwnProperty("borderThickness") ? 
			parameters["borderThickness"] : 4;
		let borderColor = parameters.hasOwnProperty("borderColor") ?
			parameters["borderColor"] : { r:0, g:0, b:0, a:1.0 };
		let backgroundColor = parameters.hasOwnProperty("backgroundColor") ?
			parameters["backgroundColor"] : { r:255, g:255, b:255, a:1.0 };
			
		let newCanvas = document.createElement("canvas");
		let context = newCanvas.getContext("2d");
		context.font = "Bold " + fontsize + "px " + fontface;
		//context.textAlign = "center";
		
		// get size data (height depends only on font size)
		let metrics = context.measureText( message );
		let textWidth = metrics.width;
		// console.log("-------------------------");
		// console.log("metrics------------------");
		// console.log(textWidth);
		// console.log("-------------------------");

		// background color
		context.fillStyle   = "rgba(" + backgroundColor.r + "," + backgroundColor.g + ","
									+ backgroundColor.b + "," + backgroundColor.a + ")";
		// border color
		context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + ","
									+ borderColor.b + "," + borderColor.a + ")";

		context.lineWidth = borderThickness;
		roundRect(
			context, 
			borderThickness/2, 
			borderThickness/2, 
			textWidth + borderThickness, 
			fontsize * 1.4 + borderThickness, 
			6
		);
		// 1.4 is extra height factor for text below baseline: g,j,p,q.
		
		// text color
		context.fillStyle = "rgba(0, 0, 0, 1.0)";

		context.fillText( message, borderThickness, fontsize + borderThickness);
		
		// canvas contents will be used for a texture
		let texture = new THREE.Texture(newCanvas);
		texture.needsUpdate = true;

		let spriteMaterial = new THREE.SpriteMaterial( 
			{ 
				map: texture,
				transparent: true,
				depthTest: false,
				depthWrite: false 
			} //, useScreenCoordinates: false, alignment: spriteAlignment
		);
		let sprite = new THREE.Sprite( spriteMaterial );
		sprite.scale.set(50, 25, 1.0);

		return sprite;
	}

	// function for drawing rounded rectangles
	roundRect(ctx, x, y, w, h, r) {
		ctx.beginPath();
		ctx.moveTo(x+r, y);
		ctx.lineTo(x+w-r, y);
		ctx.quadraticCurveTo(x+w, y, x+w, y+r);
		ctx.lineTo(x+w, y+h-r);
		ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
		ctx.lineTo(x+r, y+h);
		ctx.quadraticCurveTo(x, y+h, x, y+h-r);
		ctx.lineTo(x, y+r);
		ctx.quadraticCurveTo(x, y, x+r, y);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();   
	}

	updateAnnotationOpacity(camera, meshPosition, annotationPosition) {
		const meshDistance = camera.position.distanceTo(meshPosition);
		const annotationDistance = camera.position.distanceTo(annotationPosition);
		let annotationBehindObject = annotationDistance > meshDistance;
		//annotation.material.opacity = annotationBehindObject ? 0.5 : 1;

		// Do you want an infospot that changes size according to its position?
		// Comment out the following line and the `::before` pseudo-element.
		//annotation.material.opacity = 1;
	}

	updateAnnotationPosition(camera, width, height, positionX, positionY, positionZ, annotation) {
		let vector = new THREE.Vector3(positionX, positionY, positionZ);
		//let annotation = $(".annotation")[0];

		vector.project(camera);

		vector.x = Math.round((0.5 + vector.x / 2) * (width / window.devicePixelRatio));
		vector.y = Math.round((0.5 - vector.y / 2) * (height / window.devicePixelRatio));

		annotation.style.top = `${vector.y}px`;
		annotation.style.left = `${vector.x}px`;
		//annotation.style.opacity = annotationBehindObject ? 0.25 : 1;
		annotation.style.opacity = 1;
		annotation.style.display = "block";
		// console.log("------------------");
		// console.log("annotation--------");
		// console.log(annotation);
		// console.log("------------------");	
	}

	/**
	 * POINTER HOVERS + CLICKS ********************************************************************
	 */

	// when the pointer moves and hovers
	watchPointer(camera, targetList) {
		
		// update the picking ray with the camera and pointer position
		this.raycaster.setFromCamera(this.pointer, camera);
		//this.raycaster.set( this.camera.getWorldPosition(), this.camera.getWorldDirection() );

		// calculate objects intersecting the picking ray
		const intersects = this.raycaster.intersectObjects(targetList);

		// if there is one (or more) intersections
		if ( intersects.length > 0 ) {

			/* do something to object intersected? (testing purposes only)
			for (let i = 0; i < intersects.length; i++) {
				// hightlight object
				for (let j = 0; j < intersects[i].object.material.length; j++) {
					intersects[i].object.material[j].color.setHex( 0xff0000 );
				}
			} */

			// if the closest object intersected is not the currently stored intersection object
			if ( intersects[0].object != this.params.intersectedObject1 ) {

				// restore previous intersection object (if it exists) to its original color
				if ( this.params.intersectedObject1 ) {
					if ( this.params.intersectedObject1.material.constructor.name == "Array" ) {
						for (let i = 0; i < this.params.intersectedObject1.material.length; i++) {
							this.params.intersectedObject1.material[i].color.setHex( this.params.intersectedObject1.currentHex );
						}
					} 
					else {
						this.params.intersectedObject1.material.color.setHex( this.params.intersectedObject1.currentHex );
					}
				}

				// store reference to closest object as current intersection object
				this.params.intersectedObject1 = intersects[0].object;

				// console.log("-------------------------");
				// console.log("this.params.intersectedObject1-------------");
				// console.log(this.params.intersectedObject1);
				// console.log("-------------------------");

				if ( this.params.intersectedObject1.material.constructor.name == "Array" ) {
					// SEPARATE FOR LOOPS !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
					// store color of closest object (for later restoration)
					for (let i = 0; i < this.params.intersectedObject1.material.length; i++) {
						this.params.intersectedObject1.currentHex = this.params.intersectedObject1.material[i].color.getHex();
					}
					// set a new color for closest object
					for (let i = 0; i < this.params.intersectedObject1.material.length; i++) {
						this.params.intersectedObject1.material[i].color.setHex( 0xdddd00 );
					}
					// SEPARATE FOR LOOPS !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
				} 
				else {
					// store color of closest object (for later restoration)
					this.params.intersectedObject1.currentHex = this.params.intersectedObject1.material.color.getHex();
					// set a new color for closest object
					this.params.intersectedObject1.material.color.setHex( 0xdddd00 );
				}
				
			}
		} 
		// there are no intersections
		else {
			// restore previous intersection object (if it exists) to its original color
			if ( this.params.intersectedObject1 ) {
				if ( this.params.intersectedObject1.material.constructor.name == "Array" ) {
					for (let i = 0; i < this.params.intersectedObject1.material.length; i++) {
						this.params.intersectedObject1.material[i].color.setHex( this.params.intersectedObject1.currentHex );
					}
				} 
				else {
					this.params.intersectedObject1.material.color.setHex( this.params.intersectedObject1.currentHex );
				}
			}
			// remove previous intersection object reference
			// by setting current intersection object to "nothing"
			this.params.intersectedObject1 = null;
		}
	}


	// when the pointer moves, call the given function
	//document.addEventListener( "pointermove", onPointerMove, false );
	onPointerMove( event ) {

		const game = this;

		// the following line would stop any other event handler from firing
		// (such as the pointer's TrackballControls)
		// event.preventDefault();
		
		// update the pointer variable
		// game.pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
		// game.pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
		// game.pointer.x = (event.offsetX / canvas.clientWidth) * 2 - 1;
		// game.pointer.y = -(event.offsetY / canvas.clientHeight) * 2 + 1;
		game.pointer.x = (event.offsetX / (window.innerWidth - 240)) * 2 - 1;
		game.pointer.y = -(event.offsetY / (window.innerHeight - 100)) * 2 + 1;
		// console.log("------------------");
		// console.log("game.pointer hover-------");
		// console.log(game.pointer.x, game.pointer.y);
		// console.log("------------------");
	}

	// when the pointer moves, call the given function
	//document.addEventListener( "pointerdown", onPointerDown, false );
	onPointerDown(event) {
		
		// console.log("------------------");
		// console.log("event------------");
		// console.log(event);
		// console.log("------------------");

		// the following line would stop any other event handler from firing
		// (such as the pointer's TrackballControls)
		// event.preventDefault();
		
		// update the pointer variable
		// game.pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
		// game.pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
		// game.pointer.x = (event.offsetX / canvas.clientWidth) * 2 - 1;
		// game.pointer.y = -(event.offsetY / canvas.clientHeight) * 2 + 1;
		game.pointer.x = (event.offsetX / (window.innerWidth - 240)) * 2 - 1;
		game.pointer.y = -(event.offsetY / (window.innerHeight - 100)) * 2 + 1;
		// console.log("------------------");
		// console.log("game.pointer clicked-----");
		// console.log(game.pointer.x, game.pointer.y);
		// console.log("------------------");


		// find intersections

		// create a Ray with origin at the pointer position
		//   and direction into the scene (camera direction)
		// let vector = new THREE.Vector3( pointer.x, pointer.y, 1 );
		// projector.unprojectVector( vector, camera );
		// let raycaster2 = new THREE.Raycaster( 
		// 	event.target.camera.position, 
		// 	vector.sub( event.target.camera.position ).normalize() 
		// );
		let raycaster2 = new THREE.Raycaster();
		raycaster2.setFromCamera(game.pointer, event.target.camera);
		// raycaster2.set( 
		// 	event.target.camera.getWorldPosition(), 
		// 	event.target.camera.getWorldDirection() 
		// );
		// console.log("------------------");
		// console.log("raycaster2--------");
		// console.log(raycaster2);
		// console.log("------------------");

		// create an array containing all objects in the scene with which the raycaster2 intersects
		var intersects = raycaster2.intersectObjects( event.target.targetList );
		// console.log("------------------");
		// console.log("intersects--------");
		// console.log(intersects);
		// console.log("------------------");
		
		// if there is one (or more) intersections
		if ( intersects.length > 0 )
		{
			//console.log("Hit @ " + toString( intersects[0].point ) );
			// change the color of the closest face.
			// intersects[0].face.color.setRGB( 0.8 * Math.random() + 0.2, 0, 0 ); 
			// intersects[0].object.geometry.colorsNeedUpdate = true;

			// if the closest object intersected is not the currently stored intersection object
			let theIntersectedObject = intersects[0].object;
			
			// for testing only
			// if ( theIntersectedObject != this.params.intersectedObject2 ) {
			// 	console.log("-----------------------------");
			// 	console.log("this.params.intersectedObject2 null------------");
			// 	console.log("theIntersectedObject NEW--------");
			// 	console.log(theIntersectedObject);
			// 	console.log("-----------------------------");
			// }
			// else {
			// 	console.log("-----------------------------");
			// 	console.log("this.params.intersectedObject2 already stored--");
			// 	console.log("theIntersectedObject -----------");
			// 	console.log(theIntersectedObject);
			// 	console.log("-----------------------------");
			// }

			// restore previous intersection object (if it exists) to its original color
			if ( this.params.intersectedObject2 ) {
				//this.params.intersectedObject2.material[i].color.setHex( this.params.intersectedObject2.currentHex );
				// zoom out
				//panCam(100, 200, 200, 800, event.target.camera, event.target.controls);
			} 
			else {
				// zoom in
				//panCam(this.params.intersectedObject2.position.x, this.params.intersectedObject2.position.y, this.params.intersectedObject2.position.z, 800, event.target.camera, event.target.controls);	
			}
			// store reference to closest object as current intersection object
			this.params.intersectedObject2 = theIntersectedObject;
			// store color of closest object (for later restoration)
			//this.params.intersectedObject2.currentHex = this.params.intersectedObject2.material.color.getHex();
			// set a new color for closest object
			//this.params.intersectedObject2.material.color.setHex( 0xff0000 );
			
			// point the camera controls to the intersected object?
			//event.target.controls.reset();
			//event.target.controls.target = new THREE.Vector3(this.params.intersectedObject2.position.x, this.params.intersectedObject2.position.y, this.params.intersectedObject2.position.z);
			//event.target.camera.position.set(100, 200, 200);
			// if (event.button == 2) {
			// 	// zoom in
			// 	panCam(this.params.intersectedObject2.position.x, this.params.intersectedObject2.position.y, this.params.intersectedObject2.position.z, 1200, event.target.camera, event.target.controls);
			// } else if (event.button == 1) {
			// 	// zoom out
			// 	panCam(100, 200, 200, 1200, event.target.camera, event.target.controls);
			// }
			// console.log("------------------");
			// console.log("event.target.controls--------");
			// console.log(event.target.controls);
			// console.log("------------------");

			// show/hide infospheres
			if ( this.params.intersectedObject2.userData.type === "structure" && event.button == 0 ) {

				let infospotObject = scene.getObjectByName( `INFOSPOT: ${this.params.intersectedObject2.name}` ); // , true for recursive
				if ( infospotObject ) {
					if (infospotObject.visible === true) {
						infospotObject.visible = false;
					}
					else {
						infospotObject.visible = true;
					}
				}
				// console.log("------------------");
				// console.log("infospotObject----");
				// console.log(infospotObject);
				// console.log("------------------");
			}

			// show/hide annotations
			this.params.intersectedObject2.children.forEach( function(key) {
				// console.log("--------------------------------------");
				// console.log("key (pre-process)------");
				// console.log(`key.type: ${key.type}`);
				// console.log(`key.visible: ${key.visible}`);
				// console.log(`key.element.hidden: ${key.element.hidden}`);
				// console.log(key);
				// console.log("--------------------------------------");
				// if ( key.type === "Sprite" && event.button == 1 ) {
				// 	if (key.visible === true) {
				// 		key.visible = false;
				// 	}
				// 	else {
				// 		key.visible = true;
				// 	}
				// }
				if ( key.type === "Object3D" && event.button == 0 ) {
					if (key.element.hidden === true) {
					//if (key.visible == false) {
						// console.log("-------------------------");
						// console.log("TRUE------");
						// console.log(key.element.hidden);
						// console.log("-------------------------");
						key.element.hidden = false;
						key.element.style.display = "block";
						key.visible = true; // does nothing, but keeps status accurate
					}
					else {
						// console.log("-------------------------");
						// console.log("FALSE------");
						// console.log(key.element.hidden);
						// console.log("-------------------------");
						key.element.hidden = true;
						key.element.style.display = "none";
						key.visible = false; // does nothing, but keeps status accurate
					}
					// console.log("--------------------------------------");
					// console.log("key (post-process)------");
					// console.log(`key.type: ${key.type}`);
					// console.log(`key.visible: ${key.visible}`);
					// console.log(`key.element.hidden: ${key.element.hidden}`);
					// console.log(key);
					// console.log("--------------------------------------");
				}
			});

			/* 
			if ( this.params.intersectedObject2.userData.annotation ) {
				console.log("------------------");
				console.log("ANNOTATION ------------");
				console.log(this.params.intersectedObject2.userData.annotation);
				console.log("------------------");
			}
			else {
				console.log("------------------");
				console.log("ANNOTATION? ------------");
				console.log(this.params.intersectedObject2.userData);
				console.log("------------------");
			}
			*/

		} 
		else // there are no intersections
		{
			// restore previous intersection object (if it exists) to its original color
			if ( this.params.intersectedObject2 ) {
				//this.params.intersectedObject2.material.color.setHex( this.params.intersectedObject2.currentHex );
			}
			// remove previous intersection object reference
			//     by setting current intersection object to "nothing"
			this.params.intersectedObject2 = null;
		}

	}
	toString(v) { return "[ " + v.x + ", " + v.y + ", " + v.z + " ]"; }



	dismiss(el) {
		el.parentNode.hidden = true;
		el.parentNode.style.display = "none";
	};

	stringToBoolean(string) {
		switch(string.toString().toLowerCase().trim()){
			case "true": case "yes": case "1": return true;
			case "false": case "no": case "0": case null: return false;
			default: return Boolean(string);
		}
	}


	dragElement(elmnt) {

		// console.log("-------------------------");
		// console.log("elmnt--------------");
		// console.log(elmnt);
		// console.log("-------------------------");

		var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
		
		if (document.getElementById(elmnt.id + "header")) {
			// if present, the header is where you move the DIV from:
			document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
		} else {
			// otherwise, move the DIV from anywhere inside the DIV:
			elmnt.onmousedown = dragMouseDown;
		}

		function dragMouseDown(e) {
			e = e || window.event;
			e.preventDefault();
			// get the mouse cursor position at startup:
			pos3 = e.clientX;
			pos4 = e.clientY;

			// console.log("-------------------------");
			// console.log("pos3, pos4---------------");
			// console.log(pos3, pos4);
			// console.log("-------------------------");

			document.onmouseup = closeDragElement;
			// call a function whenever the cursor moves:
			document.onmousemove = elementDrag;
		}
		
		function elementDrag(e) {
			e = e || window.event;
			e.preventDefault();
			// calculate the new cursor position:
			pos1 = pos3 - e.clientX;
			pos2 = pos4 - e.clientY;
			pos3 = e.clientX;
			pos4 = e.clientY;

			// console.log("-------------------------");
			// console.log("pos1, pos2, pos3, pos4---");
			// console.log(pos1, pos2, pos3, pos4);
			// console.log("-------------------------");

			// set the element's new position:
			// elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
			// elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
			elmnt.style.top = (pos4) + "px";
			elmnt.style.left = (pos3) + "px";
		}
		
		function closeDragElement() {
			// stop moving when mouse button is released:
			document.onmouseup = null;
			document.onmousemove = null;
		}
	}


	/// throw manual abort of script
	throwError() {
		// creates a new exception type:
		function FatalError(){ Error.apply(this, arguments); this.name = "FatalError"; }
		FatalError.prototype = Object.create(Error.prototype);

		// and then, use this to trigger the error:
		throw new FatalError("MANUAL ABORT");
	}



	/**
	 * TESTING ***************************************************************************************
	 */

	// controls.enabled = false;
	// var xTarget=0;
	// var yTarget=-0.7;
	// var zTarget=-1.65;
	// var tweenDuration=2000;

	panCam(xTarget, yTarget, zTarget, tweenDuration, camera, controls){

		var camNewPosition= { x : xTarget, y : yTarget, z : zTarget};
		var targetNewPos = {x : xTarget, y : yTarget, z : -1.65};

		var camTween = new TWEEN.Tween(camera.position)
			.to(camNewPosition, tweenDuration)
			.easing(TWEEN.Easing.Quadratic.Out)
			.onComplete(function() {
				camera.position.copy(camNewPosition);
				console.log("onComplete camera---------");
			})
			.start();
		var targetTween = new TWEEN.Tween(controls.target)
			.to(targetNewPos, tweenDuration)
			.easing(TWEEN.Easing.Quadratic.Out)
			.onComplete(function() {
				controls.target.copy(targetNewPos);
				console.log("onComplete controls---------");
			})
			.start();

		console.log("------------------");
		console.log("camTween, targetTween---------");
		console.log(camTween);
		console.log(targetTween);
		console.log("------------------");
		
	}

	/**
	 * TESTING ***************************************************************************************
	 */

	/**
	 * Get the current category IDs and request their category objects.
	 * @param  {object} postObject - The entire post object
	 * @param  {bool}   isCat      - Is the query a category (true) or a tag (false)
	 * @return {string} termLinks  - String of HTML for either list of categories or list of tags 
	 */
	getTaxonomies( postObject, isCat ) {

		let termLinks = [];
		let taxArray;
		if ( isCat ) {
			taxArray = postObject._embedded["wp:term"][0];
		} 
		else {
			taxArray = postObject._embedded["wp:term"][1];
		}
		for ( let term of taxArray ) {
			termLinks.push(`<a href="${term.link}" rel="${isCat ? 'category' : ''} tag">${term.name}</a>`);
		}

		termLinks = isCat ? termLinks.join("") : termLinks.join(", ");

		return termLinks;

	}

	/**
	 * Get the featured image if it exists. 
	 * @param  {object} postObject - The entire post object
	 */
	getFeaturedImage( postObject ) {
		let featImage = {};
		// If there is no featured image, exit the function returning blank.
		if ( 0 === postObject.featured_media ) {
			return featImage;
		} 
		else {
			featImage.featuredObject = postObject._embedded["wp:featuredmedia"][0];
			featImage.imgUrl = featImage.featuredObject.source_url;
			featImage.imgMediumUrl = "";
			featImage.imgLargeUrl = "";
			featImage.imgWidth = featImage.featuredObject.media_details.width;
			featImage.imgHeight = featImage.featuredObject.media_details.height;
			if (featImage.featuredObject.media_details.sizes.hasOwnProperty("large")) {
				featImage.imgWidth = featImage.featuredObject.media_details.sizes.full.width;
				featImage.imgHeight = featImage.featuredObject.media_details.sizes.full.height;
				featImage.imgLargeUrl = featImage.featuredObject.media_details.sizes.large.source_url +  " 1024w, ";
			}
			// console.log("-------------------------");
			// console.log("featImage----------------");
			// console.log(featImage);
			// console.log("-------------------------");
		}

		return featImage;
	}

	/**
	 * Builds out the HTML of the new post.
	 * @param {object} postObject - modified post object with available term lists added
	 */
	buildNewPost( postObject ) {
		// Only output tag markup if there are actual tags for the post.
		let conditionalTags = ( postObject ) => {
			let tagMarkup = "";
			if (postObject.tagLinks !== "") {
				tagMarkup = `
					<pre>${getTaxonomies( postObject, false )}</pre>
				`;
			}
			return tagMarkup;
		}

		let output = `
			<pre>${getTaxonomies( postObject, true )}</pre>
			<pre>${getFeaturedImage( postObject )}</pre>
			<pre>${conditionalTags( postObject )}</pre>
		`;

		// Remove "load previous" container.
		//document.querySelector(".load-previous").remove();

		// Create a article with appropriate classes to populate.
		let postElement = document.createElement("article");
		postElement.className = "post type-post format-standard hentry";
		postElement.innerHTML = output;
		
		// Append new article with all content to the bottom of the main element.
		document.querySelector("#webgl").append(postElement);

		//getPreviousPost();
	}
} // END GAME


// check if an element exists in array using a comparer function
// comparer : function(currentElement)
Array.prototype.inArray = function(comparer) { 
    for(var i=0; i < this.length; i++) { 
        if(comparer(this[i])) return true; 
    }
    return false; 
}; 

// adds an element to the array if it does not already exist using a comparer 
// function
Array.prototype.pushIfNotExist = function(element, comparer) { 
    if (!this.inArray(comparer)) {
        this.push(element);
    }
}; 
/** 
 * END FILE
 * ************************************************************************************** 
 */