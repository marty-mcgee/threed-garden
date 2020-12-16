/** 
 * ThreeDGarden - Custom Admin JavaScript 
 * *************************************************************************************** */

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

/** INSTANTIATE COMMON VARIABLES */
let scene;
let camera;
let controls;
let gui;
	gui = new dat.GUI({ autoPlace: true, closeOnTop: true });
	gui.close();
	gui.domElement.id = 'gui';
	let guiFolderRotation = gui.addFolder("Rotation + Animation");
	//let guiFolderAnimation = guiFolderRotation.addFolder("Animation");
	let guiFolderCameras = gui.addFolder("Camera Position");
	let guiFolderLights = gui.addFolder("Directional Light");
	let guiFolderAllotments = gui.addFolder("Allotments");
	let guiFolderBeds = gui.addFolder("Beds");
	let guiFolderPlants = gui.addFolder("Plants");
	//let guiFolderInfospots = gui.addFolder("Infospots");
	let guiFolderAnnotations = gui.addFolder("Annotations");
let renderer;
let canvasParent;
let canvas;
const loader = new THREE.TextureLoader();

let params = {
	ANIMATE: false,
	data: {
		world: [{id: worldID}],
		scene: [],
		allotment: [],
		bed: [],
		plant: [],
		planting_plan: []
	}
};
guiFolderRotation.add(params, "ANIMATE").name("Run Animation");

/** POINTER HOVERS + CLICKS */
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let INTERSECTED1;
let INTERSECTED2;

/** 
 * BEGIN MAIN
 * *************************************************************************************** */

/** REST API URLS */
const API_URL_SCENES = `${restURL}scene/?_embed&per_page=100`;
const API_URL_ALLOTMENTS = `${restURL}allotment/?_embed&per_page=100`;
const API_URL_BEDS = `${restURL}bed/?_embed&per_page=100`;
const API_URL_PLANTING_PLANS = `${restURL}planting_plan/?_embed&per_page=100`;
const API_URL_PLANTS = `${restURL}plant/?_embed&per_page=100`;

/**
 * init main constructor
 */
init();

function init() {

	let api_urls = [
		API_URL_SCENES,
		API_URL_ALLOTMENTS,
		API_URL_BEDS,
		API_URL_PLANTING_PLANS,
		API_URL_PLANTS
	];

	Promise.allSettled(
		api_urls.map(
			url => fetch(url)
					.then(results => results.json())
					.then(data => {
						let type = data[0].type;
						switch (type) {
							case "scene" :
								params.data.scene = [...data];
								break;
							case "allotment" :
								params.data.allotment = [...data];
								break;
							case "bed" :
								params.data.bed = [...data];
								break;
							case "plant" :
								params.data.plant = [...data];
								break;
							case "planting_plan" :
								params.data.planting_plan = [...data];
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
			console.log("params.data------");
			console.log(params.data);
			console.log("-----------------");
			/**
			 * init scene constructor
			 */
			buildScene();
		}
	);

	//throwError();
}

/** 
 * BUILD SCENE
 * *************************************************************************************** */
function buildScene() {

	// console.log("-----------------------");
	// console.log("params.data.scene------");
	// console.log(params.data.scene);
	// console.log(params.data.scene.length);
	// console.log("-----------------------");

	let wpScene = params.data.scene[0];
	sceneID = wpScene.id;

	// console.log("-----------------------");
	// console.log("wpScene----------------");
	// console.log(wpScene);
	// console.log("-----------------------");

	/** THREE JS SCENE ******************************************************************* */

	scene = new THREE.Scene();

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
		scene.background = reflectionCube;
	}
	// load the 2D background image?
	else if ( wpScene.acf.scene_background_image ) {
		// let bgTexture = loader.load(wpScene.acf.scene_background_image);
		// scene.background = bgTexture;
		let bgTexture = loader.load(
			wpScene.acf.scene_background_image,
			() => {
				const rt = new THREE.WebGLCubeRenderTarget(bgTexture.image.height);
				rt.fromEquirectangularTexture(renderer, bgTexture);
				scene.background = rt;
			}
		);
	}
	// load the background color?
	else if ( wpScene.acf.scene_background_color ) {
		scene.background = new THREE.Color(wpScene.acf.scene_background_color);
		//scene.fog = new THREE.Fog(0xFFFFFF, 0, 500);
	}

	/** GEOMETRIES *********************************************************************** */
	
	let plane = getPlane(
		wpScene.acf.scene_plane_width_x, 
		wpScene.acf.scene_plane_length_y, 
		wpScene.acf.scene_plane_background_color
	);
	plane.name = "plane-jane";
	plane.rotation.x = -Math.PI / 2; // -90 degrees in radians
	//plane.position.z = 10;
	//plane.rotation.z += 0.002;
	guiFolderRotation.add(plane.rotation, "x", -Math.PI, Math.PI).listen();
	guiFolderRotation.add(plane.rotation, "y", -Math.PI, Math.PI).listen();
	guiFolderRotation.add(plane.rotation, "z", -Math.PI, Math.PI).listen();

	/** TEXTURES ************************************************************************* */

	if ( wpScene.acf.scene_plane_texture_image ) {
		plane.material.roughness = 0.0;
		//plane.material.map = loader.load('/wp-content/plugins/threed-garden/admin/media/textures/grasslight-big.jpg');
		plane.material.map = loader.load(wpScene.acf.scene_plane_texture_image);
		// plane.material.bumpMap = loader.load('/wp-content/plugins/threed-garden/admin/media/textures/grasslight-big-nm.jpg');
		// plane.material.bumpMap = loader.load(wpScene.acf.scene_plane_texture_image);
		// plane.material.bumpScale = 0.01;
		let planeTextureMap = plane.material.map;
		planeTextureMap.wrapS = THREE.RepeatWrapping;
		planeTextureMap.wrapT = THREE.RepeatWrapping;
		planeTextureMap.repeat.set(4, 4);
	}

	/** LIGHTS *************************************************************************** */

	// let pointLight = getPointLight(0xFFFFFF, 4.0);
	// pointLight.position.set( -20, -60, 20 );
	// //pointLight.intensity = 3.0;

	// let spotLight = getSpotLight(0xFFFFFF, 4.0);
	// spotLight.position.set( -20, -60, 20 );
	// //spotLight.intensity = 3.0;

	let directionalLight = getDirectionalLight(0xFFFFFF, 2.1);
	directionalLight.position.set( -90, -120, 120 );
	//directionalLight.intensity = 2.4;

	let helper = new THREE.CameraHelper(directionalLight.shadow.camera);

	let ambientLight = getAmbientLight(0xFFFFFF, 0.2);
	//ambientLight.position.set( -100, -100, 25 );
	//ambientLight.intensity = 3.0;
	
	guiFolderLights.add(directionalLight, "intensity", 0, 20);
	guiFolderLights.add(directionalLight.position, "x", -500, 500);
	guiFolderLights.add(directionalLight.position, "y", -500, 500);
	guiFolderLights.add(directionalLight.position, "z", -500, 500);

	/** SCENE ***************************************************************************** */

	// add objects to scene
	//plane.add(structure);
	//plane.add(pointLight);
	//plane.add(spotLight);
	plane.add(directionalLight);
	plane.add(ambientLight);
	scene.add(helper);
	scene.add(plane);

	/** CAMERA **************************************************************************** */

	camera = new THREE.PerspectiveCamera(
		55,
		window.innerWidth/window.innerHeight,
		0.1,
		1000
	);
	camera.name = "gardencam1";
	camera.position.set(86, 64, 182);
	//camera.lookAt(new THREE.Vector3(0, 0, 0)); // overridden by OrbitControls.target

	guiFolderCameras.add(camera.position, "x", -500, 500).listen();
	guiFolderCameras.add(camera.position, "y", -500, 500).listen();
	guiFolderCameras.add(camera.position, "z", -500, 500).listen();

	/** RENDERER ************************************************************************** */
	
	renderer = new THREE.WebGLRenderer(
		{ 	alpha: true, 
			antialias: true 
		}
	);
	renderer.shadowMap.enabled = true;
	renderer.setSize(window.innerWidth - 240, window.innerHeight - 100);

	// utilize javascript prototyping.. add variables to the dom element :)
	renderer.domElement.camera = camera;
	renderer.domElement.targetList = plane.children;
	
	renderer.domElement.addEventListener("pointermove", onPointerMove, false);
	renderer.domElement.addEventListener("pointerdown", onPointerDown, false);
	
	/** CONTROLS *************************************************************************** */
		controls = new THREE.OrbitControls(camera, renderer.domElement);
		controls.enableDamping = true;
		controls.dampingFactor = 0.25;
		controls.enableZoom = true;
		controls.rotateSpeed = 0.5;
		controls.autoRotate = false;
		controls.autoRotateSpeed = 0.03;
		controls.minDistance = 0.01;
		controls.maxDistance = 240;
		controls.maxPolarAngle = Math.PI/2 - .04;
		controls.target = new THREE.Vector3(0, 0, 0); // where the camera actually points
		//controls.target.set(0, 5, 0); // alternate way of setting target of camera

		renderer.domElement.controls = controls;

	/** WEBGL CANVAS *********************************************************************** */

	canvasParent = document.querySelector('#webgl');
	canvasParent.append(gui.domElement);
	canvasParent.append(renderer.domElement);
	canvas = renderer.domElement;
	
	/** BUILD ALLOTMENTS ******************************************************************* */

	buildAllotments(
		params.data.allotment, 
		plane, 
		sceneID // the post-to-post relationship <3
	);

	/** ANIMATE + RENDER (continuous rendering) ******************************************** */

	//updateAnnotationPosition(camera, renderer.domElement);

	let animate = function () {
		/** CONTINUE PLEASE (MANDATORY) */
		watchPointer(camera, plane.children);
		controls.update();
		TWEEN.update();
		requestAnimationFrame(animate);
		// structure.rotation.x += 0.005;
		// structure.rotation.y += 0.005;
		// plane.rotation.x += 0.002;
		// plane.rotation.y += 0.002;
		if ( params.ANIMATE ) {
			plane.rotation.z -= 0.0007;
		}
		renderer.render(scene, camera);
		// infospot annotations
		// updateAnnotationOpacity(camera, 20, 25);
		// updateAnnotationPosition(
		// 	camera, 
		// 	renderer.domElement.width,
		// 	renderer.domElement.height,
		// 	positionX, positionY, positionZ, annotation
		// );
	};
	animate();

	//return scene;
}


/**
 * BUILD "ALLOTMENTS" FROM REST API POST OBJECT ************************************************************
 */
function buildAllotments(postObject, plane, sceneID) {

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
		allotment.images.featured = getFeaturedImage(key);
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

		let structure = getGeometry(
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
			structure.material.map = loader.load(allotment.images.texture);
			for (let i = 0; i < structure.material.length; i++) {
				// hightlight object
				//structure.material[i].color.set(0xff0000);
				structure.material[i].map = loader.load(allotment.images.texture);
				//structure.faces[i].materialIndex = 1;
				//console.log(intersects[i]);
				// structure.material[i].bumpMap = loader.load(allotment.images.texture);
				// structure.material[i].bumpScale = 0.05;
				let structureTextureMap = structure.material[i].map;
				structureTextureMap.wrapS = THREE.RepeatWrapping;
				structureTextureMap.wrapT = THREE.RepeatWrapping;
				structureTextureMap.repeat.set(4, 4);
			}
		}
		
		plane.add(structure);

		//guiFolderAllotments.add(structure.geometry.parameters, "depth", 0, allotment.parameters.z);
		
		// console.log("-------------------------");
		// console.log("allotment----------------");
		// console.log(structure);
		// console.log("-------------------------");

		/** BUILD BEDS IN THIS ALLOTMENT ************************************************** */

		buildBeds(
			params.data.bed, 
			plane, 
			allotment.postID, // the post-to-post relationship <3
			structure.position.x, structure.position.y, 0 //structure.position.z
		) 

		/** INFOSPOTS ********************************************************************* */

		let infospot = makeInfospotSphere(
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

		guiFolderAllotments.add(infospot, "visible").name("InfoSphere").listen();

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
function buildBeds(postObject, plane, allotmentID, posOffsetX, posOffsetY, posOffsetZ) {

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
		bed.images.featured = getFeaturedImage(key);
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

		let structure = getGeometry(
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
			structure.material.map = loader.load(bed.images.texture);
			for (let i = 0; i < structure.material.length; i++) {
				// hightlight object
				//structure.material[i].color.set(0xff0000);
				structure.material[i].map = loader.load(bed.images.texture);
				//structure.faces[i].materialIndex = 1;
				//console.log(intersects[i]);
				// structure.material[i].bumpMap = loader.load(bed.images.texture);
				// structure.material[i].bumpScale = 0.05;
				let structureTextureMap = structure.material[i].map;
				structureTextureMap.wrapS = THREE.RepeatWrapping;
				structureTextureMap.wrapT = THREE.RepeatWrapping;
				structureTextureMap.repeat.set(4, 4);
			}
		}
		
		plane.add(structure);
		
		// console.log("-------------------------");
		// console.log("bed----------------------");
		// console.log(structure);
		// console.log("-------------------------");

		/** BUILD PLANTS IN THIS BED, ACCORDING TO PLANTING PLANS ************************* */

		buildPlantingPlans(
			params.data.planting_plan, 
			plane, 
			bed.postID, // the post-to-post relationship <3
			structure.position.x, structure.position.y, 0 //structure.position.z
		) 
	
		/** INFOSPOTS ********************************************************************* */
	
		let infospot = makeInfospotSphere(
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

		guiFolderBeds.add(infospot, "visible").name("InfoSphere").listen();

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
function buildPlantingPlans(postObject, plane, bedID, posOffsetX, posOffsetY, posOffsetZ) {

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

	if ( filteredPostObject.length > 0 ) {
		console.log("filteredPostObject-------");
		console.log(filteredPostObject);
		console.log("-------------------------");
	}

	// for each planting plan..
	filteredPostObject.forEach( function(key) {

		console.log("-------------------------");
		console.log("key.id (filteredPostObject)------");
		console.log(key.id);
		console.log(key);
		console.log("-------------------------");

		// for each planting plan bed-plant schedule..
		key.acf.planting_plan_bed_plant_schedule.forEach(function(key2) {
			
			// console.log("key2-------");
			// console.log(key2);
			// console.log("-------------------------");

			if ( key2.planting_plan_bed == bedID ) {
			
				// show this plant (or multiple plants) in this bed..
				var filteredPlant = params.data.plant.filter(function (obj) {
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
					plant.images.featured = getFeaturedImage(key);
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

					let structure = getGeometry(
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
						structure.material.map = loader.load(plant.images.texture);
						for (let i = 0; i < structure.material.length; i++) {
							// hightlight object
							//structure.material[i].color.set(0xff0000);
							structure.material[i].map = loader.load(plant.images.texture);
							//structure.faces[i].materialIndex = 1;
							//console.log(intersects[i]);
							// structure.material[i].bumpMap = loader.load(plant.images.texture);
							// structure.material[i].bumpScale = 0.05;
							let structureTextureMap = structure.material[i].map;
							structureTextureMap.wrapS = THREE.RepeatWrapping;
							structureTextureMap.wrapT = THREE.RepeatWrapping;
							structureTextureMap.repeat.set(4, 4);
						}
					}
					
					plane.add(structure);
					
					console.log("-------------------------");
					console.log("plant structure----------");
					console.log(structure);
					console.log("-------------------------");
				
					/** INFOSPOTS ********************************************************************* */
				
					let infospot = makeInfospotSphere(
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

					guiFolderBeds.add(infospot, "visible").name("InfoSphere").listen();

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



function getGeometry(shape, x, y, z, color){
	let geometry;
	let material;
	let mesh;
	switch (shape) {
		case 'Box':
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

		case 'Cone':
			geometry = new THREE.ConeGeometry(x/2, y/2, z, 32, 1, true);
			material = new THREE.MeshStandardMaterial({
				color: color,
				side: THREE.DoubleSide
			});
			mesh = new THREE.Mesh(geometry, material);
			mesh.castShadow = true;
			mesh.rotation.x = Math.PI / 2; // 90 degrees in radians
			break;

		case 'Cylinder':
			geometry = new THREE.CylinderGeometry(x/2, y/2, z, 32, 1, true);
			material = new THREE.MeshStandardMaterial({
				color: color,
				side: THREE.DoubleSide
			});
			mesh = new THREE.Mesh(geometry, material);
			mesh.castShadow = true;
			mesh.rotation.x = Math.PI / 2; // 90 degrees in radians
			break;

		case 'InfoSphere':
			geometry = new THREE.SphereGeometry(x, y, z);
			material = new THREE.MeshStandardMaterial({
				color: color,
				side: THREE.DoubleSide
			});
			mesh = new THREE.Mesh(geometry, material);
			mesh.castShadow = true;
			//mesh.rotation.x = Math.PI / 2; // 90 degrees in radians
			break;

		case 'Sphere':
			geometry = new THREE.SphereGeometry(x, y, z);
			material = new THREE.MeshStandardMaterial({
				color: color,
				side: THREE.DoubleSide
			});
			mesh = new THREE.Mesh(geometry, material);
			mesh.castShadow = true;
			//mesh.rotation.x = Math.PI / 2; // 90 degrees in radians
			break;

		case 'Tree':
			let tree = new THREE.Tree({
				generations : 3,        // # for branch' hierarchy
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

		case 'Bush':
			// CAST
			geometry = new THREE.CubeGeometry(x, y, z);
			
			//color = new THREE.Color(0xff0000);
			color = new THREE.Color("rgb(153,90,0)");
			material = new THREE.MeshPhongMaterial({ color: color, wireframe: false });
			mesh = new THREE.Mesh(geometry, material);
			
			scene.add(mesh);  
			mesh.matrix.makeTranslation(0,-125,0);
			mesh.matrixAutoUpdate = false;
			
			var levels = 4; // slow? lower this
			var edge_w = 100;
			var edge_h = 150;

			function bush(n, mat, c) {
				if(n > 0) {
					var new_mat = new THREE.Matrix4();
					var new_mat2 = new THREE.Matrix4();
					var new_mat_t0 = new THREE.Matrix4();
					var new_mat_t = new THREE.Matrix4();
					var new_mat_r = new THREE.Matrix4();
					var new_mat_r2 = new THREE.Matrix4();
					var new_mat_s = new THREE.Matrix4();
					var mat2 = mat.clone();
					var col1 = c.clone();
					var col2 = c.clone();
					//col1.offsetHSL(0.12,0,0);
					col1.g += 0.64/levels;
					material = new THREE.MeshPhongMaterial( { color:col1, wireframe: false } );
					mesh = new THREE.Mesh(geometry, material);
					new_mat_t0.makeTranslation(edge_w/2,0,0);
					new_mat_t.makeTranslation(0,edge_h,0);
					new_mat_r.makeRotationZ(-Math.PI/4);
					new_mat_r2.makeRotationY(Math.PI/2);
					new_mat_s.makeScale(0.75,0.75,0.75);
					new_mat.multiply(new_mat_r2);  //      
					new_mat.multiply(new_mat_t0);
					new_mat.multiply(new_mat_r);        
					new_mat.multiply(new_mat_s);        
					new_mat.multiply(new_mat_t);
					new_mat.multiply(mat);
					mesh.matrix.copy(new_mat);
					mesh.matrixAutoUpdate=false;
					mesh.updateMatrix=false; //
					scene.add(mesh);
					bush(n-1, mesh.matrix.clone(), col1);
			
					//col2.offsetHSL(0.12,0,0);
					col2.g += 0.64/levels;
					material = new THREE.MeshPhongMaterial( { color:col2, wireframe: false } );
					mesh = new THREE.Mesh(geometry, material);
					new_mat_t0.makeTranslation(-edge_w/2,0,0);
					new_mat_t.makeTranslation(0,edge_h,0);
					new_mat_r.makeRotationZ(Math.PI/4);
					new_mat_r2.makeRotationY(Math.PI/2);
					new_mat_s.makeScale(0.75,0.75,0.75);
					new_mat2.multiply(new_mat_r2);  //      
					new_mat2.multiply(new_mat_t0);
					new_mat2.multiply(new_mat_r);        
					new_mat2.multiply(new_mat_s);        
					new_mat2.multiply(new_mat_t);
					new_mat2.multiply(mat);
					mesh.matrix.copy(new_mat2);
					mesh.matrixAutoUpdate=false;
					mesh.updateMatrix=false; //
					scene.add(mesh);
					bush(n-1, mesh.matrix.clone(), col2);
				}
			}
			
			bush(levels, mesh.matrix, color);

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

function getPlane(x, y, color){
	let geometry = new THREE.PlaneGeometry(x, y);
	let material = new THREE.MeshStandardMaterial({
		color: color,
		side: THREE.DoubleSide
	});
	let mesh = new THREE.Mesh(geometry, material);
	mesh.receiveShadow = true;
	return mesh;
}

function getPointLight(color, intensity){
	let light = new THREE.PointLight(color, intensity);
	light.castShadow = true;
	light.shadow.bias = 0.001;
	light.shadow.mapSize.width = 4096; //default = 1024
	light.shadow.mapSize.height = 4096; //default = 1024
	return light;
}

function getSpotLight(color, intensity){
	let light = new THREE.SpotLight(color, intensity);
	light.castShadow = true;
	light.shadow.bias = 0.001;
	light.shadow.mapSize.width = 2048; //default = 1024
	light.shadow.mapSize.height = 2048; //default = 1024
	return light;
}

function getDirectionalLight(color, intensity){
	let light = new THREE.DirectionalLight(color, intensity);
	light.castShadow = true;
	light.shadow.bias 			= 0.001;
	light.shadow.mapSize.width 	= 4096; //default = 1024
	light.shadow.mapSize.height = 4096; //default = 1024
	light.shadow.camera.left 	= -1000; //default = -5
	light.shadow.camera.bottom 	= -1000; //default = -5
	light.shadow.camera.right 	= 1000; //default = 5
	light.shadow.camera.top 	= 1000; //default = 5
	return light;
}

function getAmbientLight(color, intensity){
	let light = new THREE.AmbientLight(color, intensity);
	return light;
}


/**
 * INFOSPOTS **************************************************************************************
 */
function makeInfospotSprite(message, positionX, positionY, positionZ) {
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
	vector.project(camera);

	vector.x = Math.round((0.5 + vector.x / 2) * (renderer.domElement.width / window.devicePixelRatio));
	vector.y = Math.round((0.5 - vector.y / 2) * (renderer.domElement.height / window.devicePixelRatio));
	// vector.x = (structure.position.x / (window.innerWidth - 240)) * 2 - 1;
	// vector.y = -(structure.position.y / (window.innerHeight - 100)) * 2 + 1;
	// vector.x = Math.round( (   vector.x + 1 ) * renderer.domElement.width / 2 );
	// vector.y = Math.round( ( - vector.y + 1 ) * renderer.domElement.height / 2 );

	let annoPosTop = vector.x;
	let annoPosLeft = vector.y;
	//
	// let annoPosTop = 100;
	// let annoPosLeft = 240;

	let annotation = makeAnnotation(
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

function makeAnnotation(link, contentHTML, positionX, positionY) {

	let annoDiv = document.createElement('div');
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
	guiFolderAnnotations.add(annoDiv, "hidden").listen();
	guiFolderAnnotations.add(annoDiv.style, "display").listen();
	guiFolderAnnotations.add(annoDiv.style, "top").listen();
	guiFolderAnnotations.add(annoDiv.style, "left").listen();
	document.body.appendChild( annoDiv );

	// Make the DIV element draggable
	dragElement(annoDiv);

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

function makeTextSprite(message, parameters) {
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
		
	let newCanvas = document.createElement('canvas');
	let context = newCanvas.getContext('2d');
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
function roundRect(ctx, x, y, w, h, r) {
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

function updateAnnotationOpacity(camera, meshPosition, annotationPosition) {
    const meshDistance = camera.position.distanceTo(meshPosition);
    const annotationDistance = camera.position.distanceTo(annotationPosition);
    let annotationBehindObject = annotationDistance > meshDistance;
    //annotation.material.opacity = annotationBehindObject ? 0.5 : 1;

    // Do you want an infospot that changes size according to its position?
    // Comment out the following line and the `::before` pseudo-element.
    //annotation.material.opacity = 1;
}

function updateAnnotationPosition(camera, width, height, positionX, positionY, positionZ, annotation) {
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
function watchPointer(camera, targetList){
	
	// update the picking ray with the camera and pointer position
	raycaster.setFromCamera(pointer, camera);
	//raycaster.set( camera.getWorldPosition(), camera.getWorldDirection() );

	//let helper2 = new THREE.CameraHelper(directionalLight.shadow.camera);

	// calculate objects intersecting the picking ray
	const intersects = raycaster.intersectObjects(targetList);

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
		if ( intersects[0].object != INTERSECTED1 ) {

			// restore previous intersection object (if it exists) to its original color
			if ( INTERSECTED1 ) {
				if ( INTERSECTED1.material.constructor.name == "Array" ) {
					for (let i = 0; i < INTERSECTED1.material.length; i++) {
						INTERSECTED1.material[i].color.setHex( INTERSECTED1.currentHex );
					}
				} 
				else {
					INTERSECTED1.material.color.setHex( INTERSECTED1.currentHex );
				}
			}

			// store reference to closest object as current intersection object
			INTERSECTED1 = intersects[0].object;

			// console.log("-------------------------");
			// console.log("INTERSECTED1-------------");
			// console.log(INTERSECTED1);
			// console.log("-------------------------");

			if ( INTERSECTED1.material.constructor.name == "Array" ) {
				// SEPARATE FOR LOOPS !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
				// store color of closest object (for later restoration)
				for (let i = 0; i < INTERSECTED1.material.length; i++) {
					INTERSECTED1.currentHex = INTERSECTED1.material[i].color.getHex();
				}
				// set a new color for closest object
				for (let i = 0; i < INTERSECTED1.material.length; i++) {
					INTERSECTED1.material[i].color.setHex( 0xdddd00 );
				}
				// SEPARATE FOR LOOPS !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
			} 
			else {
				// store color of closest object (for later restoration)
				INTERSECTED1.currentHex = INTERSECTED1.material.color.getHex();
				// set a new color for closest object
				INTERSECTED1.material.color.setHex( 0xdddd00 );
			}
			
		}
	} 
	// there are no intersections
	else {
		// restore previous intersection object (if it exists) to its original color
		if ( INTERSECTED1 ) {
			if ( INTERSECTED1.material.constructor.name == "Array" ) {
				for (let i = 0; i < INTERSECTED1.material.length; i++) {
					INTERSECTED1.material[i].color.setHex( INTERSECTED1.currentHex );
				}
			} 
			else {
				INTERSECTED1.material.color.setHex( INTERSECTED1.currentHex );
			}
		}
		// remove previous intersection object reference
		// by setting current intersection object to "nothing"
		INTERSECTED1 = null;
	}
}


// when the pointer moves, call the given function
//document.addEventListener( 'pointermove', onPointerMove, false );
function onPointerMove( event ) {

	// the following line would stop any other event handler from firing
	// (such as the pointer's TrackballControls)
	// event.preventDefault();
	
	// update the pointer variable
	// pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	// pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
	// pointer.x = (event.offsetX / canvas.clientWidth) * 2 - 1;
	// pointer.y = -(event.offsetY / canvas.clientHeight) * 2 + 1;
	pointer.x = (event.offsetX / (window.innerWidth - 240)) * 2 - 1;
	pointer.y = -(event.offsetY / (window.innerHeight - 100)) * 2 + 1;
	// console.log("------------------");
	// console.log("pointer hover-------");
	// console.log(pointer.x, pointer.y);
	// console.log("------------------");
}

// when the pointer moves, call the given function
//document.addEventListener( 'pointerdown', onPointerDown, false );
function onPointerDown(event) {
	
	// console.log("------------------");
	// console.log("event------------");
	// console.log(event);
	// console.log("------------------");

	// the following line would stop any other event handler from firing
	// (such as the pointer's TrackballControls)
	// event.preventDefault();
	
	// update the pointer variable
	// pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	// pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
	// pointer.x = (event.offsetX / canvas.clientWidth) * 2 - 1;
	// pointer.y = -(event.offsetY / canvas.clientHeight) * 2 + 1;
	pointer.x = (event.offsetX / (window.innerWidth - 240)) * 2 - 1;
	pointer.y = -(event.offsetY / (window.innerHeight - 100)) * 2 + 1;
	// console.log("------------------");
	// console.log("pointer clicked-----");
	// console.log(pointer.x, pointer.y);
	// console.log("------------------");


	// find intersections

	// create a Ray with origin at the pointer position
	//   and direction into the scene (camera direction)
	// let vector = new THREE.Vector3( pointer.x, pointer.y, 1 );
	//projector.unprojectVector( vector, camera );
	// let raycaster2 = new THREE.Raycaster( 
	// 	event.target.camera.position, 
	// 	vector.sub( event.target.camera.position ).normalize() 
	// );
	let raycaster2 = new THREE.Raycaster();
	raycaster2.setFromCamera(pointer, event.target.camera);
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
		let intersectedObject = intersects[0].object;
		
		// for testing only
		// if ( intersectedObject != INTERSECTED2 ) {
		// 	console.log("-----------------------------");
		// 	console.log("INTERSECTED2 null------------");
		// 	console.log("intersectedObject NEW--------");
		// 	console.log(intersectedObject);
		// 	console.log("-----------------------------");
		// }
		// else {
		// 	console.log("-----------------------------");
		// 	console.log("INTERSECTED2 already stored--");
		// 	console.log("intersectedObject -----------");
		// 	console.log(intersectedObject);
		// 	console.log("-----------------------------");
		// }

		// restore previous intersection object (if it exists) to its original color
		if ( INTERSECTED2 ) {
			//INTERSECTED2.material[i].color.setHex( INTERSECTED2.currentHex );
			// zoom out
			//panCam(100, 200, 200, 800, event.target.camera, event.target.controls);
		} 
		else {
			// zoom in
			//panCam(INTERSECTED2.position.x, INTERSECTED2.position.y, INTERSECTED2.position.z, 800, event.target.camera, event.target.controls);	
		}
		// store reference to closest object as current intersection object
		INTERSECTED2 = intersectedObject;
		// store color of closest object (for later restoration)
		//INTERSECTED2.currentHex = INTERSECTED2.material.color.getHex();
		// set a new color for closest object
		//INTERSECTED2.material.color.setHex( 0xff0000 );
		
		// point the camera controls to the intersected object?
		//event.target.controls.reset();
		//event.target.controls.target = new THREE.Vector3(INTERSECTED2.position.x, INTERSECTED2.position.y, INTERSECTED2.position.z);
		//event.target.camera.position.set(100, 200, 200);
		// if (event.button == 2) {
		// 	// zoom in
		// 	panCam(INTERSECTED2.position.x, INTERSECTED2.position.y, INTERSECTED2.position.z, 1200, event.target.camera, event.target.controls);
		// } else if (event.button == 1) {
		// 	// zoom out
		// 	panCam(100, 200, 200, 1200, event.target.camera, event.target.controls);
		// }
		// console.log("------------------");
		// console.log("event.target.controls--------");
		// console.log(event.target.controls);
		// console.log("------------------");

		// show/hide infospheres
		if ( INTERSECTED2.userData.type === "structure" && event.button == 0 ) {

			let infospotObject = scene.getObjectByName( `INFOSPOT: ${INTERSECTED2.name}` ); // , true for recursive
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
		INTERSECTED2.children.forEach( function(key) {
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
		if ( INTERSECTED2.userData.annotation ) {
			console.log("------------------");
			console.log("ANNOTATION ------------");
			console.log(INTERSECTED2.userData.annotation);
			console.log("------------------");
		}
		else {
			console.log("------------------");
			console.log("ANNOTATION? ------------");
			console.log(INTERSECTED2.userData);
			console.log("------------------");
		}
		*/

	} 
	else // there are no intersections
	{
		// restore previous intersection object (if it exists) to its original color
		if ( INTERSECTED2 ) {
			//INTERSECTED2.material.color.setHex( INTERSECTED2.currentHex );
		}
		// remove previous intersection object reference
		//     by setting current intersection object to "nothing"
		INTERSECTED2 = null;
	}

}
function toString(v) { return "[ " + v.x + ", " + v.y + ", " + v.z + " ]"; }



function dismiss(el) {
	el.parentNode.hidden = true;
	el.parentNode.style.display = 'none';
};

function stringToBoolean(string) {
    switch(string.toString().toLowerCase().trim()){
        case "true": case "yes": case "1": return true;
        case "false": case "no": case "0": case null: return false;
        default: return Boolean(string);
    }
}


function dragElement(elmnt) {

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
function throwError() {
	// creates a new exception type:
	function FatalError(){ Error.apply(this, arguments); this.name = "FatalError"; }
	FatalError.prototype = Object.create(Error.prototype);

	// and then, use this to trigger the error:
	throw new FatalError("MANUAL ABORT");
}



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
 * TESTING ***************************************************************************************
 */

// controls.enabled = false;
// var xTarget=0;
// var yTarget=-0.7;
// var zTarget=-1.65;
// var tweenDuration=2000;

function panCam(xTarget, yTarget, zTarget, tweenDuration, camera, controls){

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
function getTaxonomies( postObject, isCat ) {

	let termLinks = [];
	let taxArray;
	if ( isCat ) {
		taxArray = postObject._embedded['wp:term'][0];
	} 
	else {
		taxArray = postObject._embedded['wp:term'][1];
	}
	for ( let term of taxArray ) {
		termLinks.push(`<a href="${term.link}" rel="${isCat ? 'category' : ''} tag">${term.name}</a>`);
	}

	termLinks = isCat ? termLinks.join('') : termLinks.join(', ');

	return termLinks;

}

/**
 * Get the featured image if it exists. 
 * @param  {object} postObject - The entire post object
 */
function getFeaturedImage( postObject ) {
	let featImage = {};
	// If there is no featured image, exit the function returning blank.
	if ( 0 === postObject.featured_media ) {
		return featImage;
	} 
	else {
		featImage.featuredObject = postObject._embedded['wp:featuredmedia'][0];
		featImage.imgUrl = featImage.featuredObject.source_url;
		featImage.imgMediumUrl = '';
		featImage.imgLargeUrl = '';
		featImage.imgWidth = featImage.featuredObject.media_details.width;
		featImage.imgHeight = featImage.featuredObject.media_details.height;
		if (featImage.featuredObject.media_details.sizes.hasOwnProperty("large")) {
			featImage.imgWidth = featImage.featuredObject.media_details.sizes.full.width;
			featImage.imgHeight = featImage.featuredObject.media_details.sizes.full.height;
			featImage.imgLargeUrl = featImage.featuredObject.media_details.sizes.large.source_url +  ' 1024w, ';
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
function buildNewPost( postObject ) {
	// Only output tag markup if there are actual tags for the post.
	let conditionalTags = ( postObject ) => {
		let tagMarkup = '';
		if (postObject.tagLinks !== '') {
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
	//document.querySelector('.load-previous').remove();

	// Create a article with appropriate classes to populate.
  	let postElement = document.createElement('article');
	postElement.className = 'post type-post format-standard hentry';
	postElement.innerHTML = output;
	
	// Append new article with all content to the bottom of the main element.
	document.querySelector('#webgl').append(postElement);

	//getPreviousPost();
}


/** 
 * OLD
 * *************************************************************************************** */

window.onload = function(e){ 

	/** QUERY FOR SCENES ***************************************************************** */

	// let queryURLScenes = `${restURL}scene/?_embed&per_page=100`;
	// fetch( queryURLScenes )
	// 	.then( response => response.json() )
	// 	/**
	// 	 * init main constructor
	// 	 */
	// 	.then( postObject => init(postObject) );

}


/** 
 * END FILE
 * ************************************************************************************** 
 */