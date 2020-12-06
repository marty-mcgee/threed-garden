/** ThreeDGarden - Custom Admin JavaScript */

/** PARAMETERS FROM PHP */
const pluginName = postdata.plugin_name;
const pluginVersion = postdata.plugin_version;
const pluginURL = postdata.plugin_url;
const themeURI = postdata.theme_uri;
const restURL = postdata.rest_url;
const worldID = 1;
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
	let guiFolderCameras = gui.addFolder("Camera Position");
	let guiFolderLights = gui.addFolder("Directional Light");
	let guiFolderAllotments = gui.addFolder("Allotments");
	let guiFolderBeds = gui.addFolder("Beds");
	let guiFolderPlants = gui.addFolder("Plants");
	let guiFolderInfospots = gui.addFolder("Infospots");
	let guiFolderAnnotations = gui.addFolder("Annotations");
let renderer;
let canvasParent;
let canvas;
const loader = new THREE.TextureLoader();

/** POINTER HOVERS + CLICKS */
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let INTERSECTED1;
let INTERSECTED2;


/** JQUERY ************************************************************************************ */
(function( $ ) {
'use strict';


/** MAIN INIT */
function init() {

	/** THREE JS SCENE ******************************************************************* */

	scene = new THREE.Scene();
	scene.background = new THREE.Color(0x333333);
	//scene.fog = new THREE.Fog(0xFFFFFF, 0, 500);

	/** GEOMETRIES *********************************************************************** */
	
	let plane = getPlane(200, 200, 0xFFFFFF);
	plane.name = "plane-1";
	plane.rotation.x = -Math.PI / 2; // -90 degrees in radians
	//plane.position.z = 10;
	plane.material.roughness = 0.0;

	/** TEXTURES ************************************************************************* */

	plane.material.map = loader.load('/wp-content/plugins/threed-garden/admin/media/textures/grasslight-big.jpg');
	// plane.material.bumpMap = loader.load('/wp-content/plugins/threed-garden/admin/media/textures/grasslight-big-nm.jpg');
	// plane.material.bumpScale = 0.01;
	let planeTextureMap = plane.material.map;
	planeTextureMap.wrapS = THREE.RepeatWrapping;
	planeTextureMap.wrapT = THREE.RepeatWrapping;
	planeTextureMap.repeat.set(4, 4);

	/** BACKGROUND *********************************************************************** */

	// manipulate materials
	// load the cube map
	let path = '/wp-content/plugins/threed-garden/admin/media/textures/cube/Forest-Meadow-Cube-Map-2/';
	let format = '.png';
	let urls = [
		path + 'px' + format, path + 'nx' + format,
		path + 'py' + format, path + 'ny' + format,
		path + 'pz' + format, path + 'nz' + format
	];
	let reflectionCube = new THREE.CubeTextureLoader().load(urls);
	reflectionCube.format = THREE.RGBFormat;

	scene.background = reflectionCube;

	/** LIGHTS *************************************************************************** */

	// let pointLight = getPointLight(0xFFFFFF, 4.0);
	// pointLight.position.set( -20, -60, 20 );
	// //pointLight.intensity = 3.0;

	// let spotLight = getSpotLight(0xFFFFFF, 4.0);
	// spotLight.position.set( -20, -60, 20 );
	// //spotLight.intensity = 3.0;

	let directionalLight = getDirectionalLight(0xFFFFFF, 3.5);
	directionalLight.position.set( -90, -90, 90 );
	directionalLight.intensity = 2.6;

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
	//renderer.setClearColor(0xFFFFFF);

	// utilize javascript prototyping.. add variables to the dom element :)
	renderer.domElement.camera = camera;
	renderer.domElement.targetList = plane.children;
	
	renderer.domElement.addEventListener("pointermove", onPointerMove, false);
	renderer.domElement.addEventListener("pointerup", onPointerUp, false);
	
	/** CONTROLS ************************************************************************** */
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

	//document.getElementById('webgl').appendChild(renderer.domElement);
	//$( "#webgl" ).append(renderer.domElement);
	canvasParent = $("#webgl");
	canvasParent.css("border","0px solid black")
		.append(gui.domElement)
		.append(renderer.domElement);
	//canvas = renderer.domElement;

	/** QUERY FOR BOXES ****************************************************************** */

	let queryURLAllotments = `${restURL}allotment/?_embed&per_page=100`;
	fetch( queryURLAllotments )
		.then( response => response.json() )
		.then( postObject => buildAllotments(postObject, plane, gui, camera, renderer) );
		
	// let queryURLPlantingPlans = `${restURL}planting_plan/?_embed`;
	// fetch( queryURLPlantingPlans )
	// 	.then( response => response.json() )
	// 	.then( postObject => buildPlantingPlans(postObject, plane, gui, camera, renderer) );


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
		// plane.rotation.z += 0.002;
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

	/** RETURN SCENE *********************************************************************** */
	return scene;
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
				opacity: 0.9,
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
			geometry = new THREE.ConeGeometry(x/2, y/2, z);
			material = new THREE.MeshStandardMaterial({
				color: color,
				side: THREE.DoubleSide
			});
			mesh = new THREE.Mesh(geometry, material);
			mesh.castShadow = true;
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
	light.shadow.mapSize.width = 2048; //default = 1024
	light.shadow.mapSize.height = 2048; //default = 1024
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
	light.shadow.bias 			= 0.00001;
	light.shadow.mapSize.width 	= 2048; //default = 1024
	light.shadow.mapSize.height = 2048; //default = 1024
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
 * BUILD FROM REST API POST OBJECT ************************************************************
 */
function buildAllotments(postObject, plane, gui, camera, renderer, worldID) {

	console.log("-------------------------");
	console.log("postObject ALLOTMENTS----");
	console.log(postObject);
	console.log("-------------------------");

	postObject.forEach( function(key) {

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
		structure.userData.postID = allotment.postID;
		structure.userData.description = allotment.description;
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

		guiFolderAllotments.add(structure.geometry.parameters, "depth", 0, allotment.parameters.z);
		
		console.log("-------------------------");
		console.log("allotment----------------");
		console.log(structure);
		console.log("-------------------------");

		// SEND AJAX FETCH TO RETRIEVE BEDS IN THIS ALLOTMENT
		let queryURLBeds = `${restURL}bed/?_embed&per_page=100`;
		fetch( queryURLBeds )
			.then( response => response.json() )
			.then( postObject => buildBeds(
					postObject, plane, gui, camera, renderer, 
					structure.userData.postID, structure.position.x, structure.position.y, 0 //structure.position.z
				) 
			);

		// BUILD OUT SPRITES AND INFOSPOTS AND ANNOTATIONS
		let sprite = makeTextSprite(
			structure.name, 
			{ 	fontsize: 24, 
				fontface: "Calibri", 
				borderColor: {r:255, g:0, b:0, a:0.7}, 
				backgroundColor: {r:255, g:255, b:255, a:0.7} 
			} 
		);
		// sprite = makeInfospot(
		// 	structure.name, 
		// 	0, 0, structure.geometry.parameters.depth + 5
		// );
		sprite.name = `SPRITE: ${structure.name}`;
		sprite.position.set(0, 0, structure.geometry.parameters.depth + 5);
		sprite.visible = false;

		guiFolderInfospots.add(sprite, "visible");
		
		structure.add(sprite);

		// console.log("-------------------------");
		// console.log("structure---------------------");
		// console.log(structure);
		// console.log("-------------------------");

		/** INFOSPOTS ********************************************************************* */

		let infospot = makeInfospot(
			"i", 
			structure.position.x, 
			structure.position.y, 
			structure.geometry.parameters.depth + 3
		);
		infospot.name = `INFOSPOT: ${structure.name}`;
		infospot.visible = true;

		guiFolderInfospots.add(infospot, "visible");

		plane.add(infospot);

		/** ANNOTATIONS ****************************************************************** */

		let vector = new THREE.Vector3(structure.position.x, structure.position.y, structure.position.z);
		// camera.updateProjectionMatrix();
		// camera.updateMatrixWorld();
		// let vector = new THREE.Vector3();
        // vector.setFromMatrixPosition(structure.matrixWorld);
		vector.project(camera);

		// console.log("------------------");
		// console.log("vector1--------");
		// console.log(vector);
		// console.log("------------------");

		// vector.x = Math.round((0.5 + vector.x / 2) * (renderer.domElement.width / window.devicePixelRatio));
		// vector.y = Math.round((0.5 - vector.y / 2) * (renderer.domElement.height / window.devicePixelRatio));
		// vector.x = (structure.position.x / (window.innerWidth - 240)) * 2 - 1;
		// vector.y = -(structure.position.y / (window.innerHeight - 100)) * 2 + 1;
		vector.x = Math.round( (   vector.x + 1 ) * renderer.domElement.width / 2 );
    	vector.y = Math.round( ( - vector.y + 1 ) * renderer.domElement.height / 2 );
		
		// console.log("------------------");
		// console.log("vector2--------");
		// console.log(vector);
		// console.log("------------------");

		let annoPosTop = vector.x; //structure.position.y + 10
		let annoPosLeft = vector.y; //structure.position.x + 10
		let annoPosZ = structure.geometry.parameters.depth + 10;

		let annotation = makeAnnotation(
			allotment.link,
			structure.name,
			annoPosTop, 
			annoPosLeft,
			annoPosZ,
			guiFolderInfospots
		)
		annotation.name = `ANNOTATION: ${structure.name}`;
		//annotation.visible = false; // does nothing

		// console.log("-------------------------");
		// console.log("annotation---------------------");
		// console.log(annotation);
		// console.log("-------------------------");

		//guiFolderInfospots.add(annotation, "hidden");
		//guiFolderInfospots.add(annotation, "visible");

		//plane.parent.add(annotation);
		//scene2.add(annotation);
		structure.add(annotation);

	}); /** END ALLOTMENTS ****************************************************************** */
	
	// console.log("-------------------------");
	// console.log("plane.children-----------");
	// console.log(plane.children);
	// console.log("-------------------------");

	return plane.children;
}

/**
 * BUILD FROM REST API POST OBJECT ************************************************************
 */
function buildBeds(postObject, plane, gui, camera, renderer, allotmentID, posOffsetX, posOffsetY, posOffsetZ) {

	// console.log("-------------------------");
	// console.log("postObject BEDS----------");
	// console.log(postObject);
	// console.log("-------------------------");

	//let guiFolderBeds = gui.addFolder("Beds");

	postObject.forEach( function(key) {

		// console.log("-------------------------");
		// console.log("key.id (postObject)------");
		// console.log(key.id);
		// console.log(key);
		// console.log("-------------------------");

		// only show beds for this allotment structure
		if ( key.acf.bed_allotment[0].ID != null && key.acf.bed_allotment[0].ID == allotmentID ) {

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

			console.log("-------------------------");
			console.log("bed----------------");
			console.log(bed);
			console.log("-------------------------");

			let structure = getGeometry(
				bed.shape,
				bed.parameters.x, 
				bed.parameters.y, 
				bed.parameters.z, 
				bed.color
			);
			structure.name = bed.title;
			structure.userData.postID = bed.postID;
			structure.userData.description = bed.description;
			structure.position.x = bed.position.x ? bed.position.x : 0;
			structure.position.y = bed.position.y ? bed.position.y : 0;
			//structure.position.z = bed.position.z ? bed.position.z - (structure.geometry.parameters.depth) : - (structure.geometry.parameters.depth);
			//structure.position.z = bed.position.z ? bed.position.z + (structure.geometry.parameters.depth / 2) : (structure.geometry.parameters.depth / 2);
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
		
			let sprite = makeTextSprite(
				structure.name, 
				{ 	fontsize: 24, 
					fontface: "Calibri", 
					borderColor: {r:255, g:0, b:0, a:0.7}, 
					backgroundColor: {r:255, g:255, b:255, a:0.7} 
				} 
			);
			// sprite = makeInfospot(
			// 	structure.name, 
			// 	0, 0, structure.geometry.parameters.depth + 5
			// );
			sprite.name = `SPRITE: ${structure.name}`;
			sprite.position.set(0, 0, structure.geometry.parameters.depth + 5);
			sprite.visible = false;

			//guiFolderBeds.add(sprite, "visible");
			
			structure.add(sprite);

			// console.log("-------------------------");
			// console.log("structure---------------------");
			// console.log(structure);
			// console.log("-------------------------");
		
			/** INFOSPOTS ********************************************************************* */
		
			let infospot = makeInfospot(
				"i", 
				structure.position.x, 
				structure.position.y, 
				structure.geometry.parameters.depth + 3
			);
			infospot.name = `INFOSPOT: ${structure.name}`;
			infospot.visible = true;

			//guiFolderBeds.add(infospot, "visible");

			plane.add(infospot);
		
			/** ANNOTATIONS ****************************************************************** */
		
			let vector = new THREE.Vector3(structure.position.x, structure.position.y, structure.position.z);
			// camera.updateProjectionMatrix();
			// camera.updateMatrixWorld();
			// let vector = new THREE.Vector3();
			// vector.setFromMatrixPosition(structure.matrixWorld);
			vector.project(camera);
			// console.log("------------------");
			// console.log("vector1--------");
			// console.log(vector);
			// console.log("------------------");

			// vector.x = Math.round((0.5 + vector.x / 2) * (renderer.domElement.width / window.devicePixelRatio));
			// vector.y = Math.round((0.5 - vector.y / 2) * (renderer.domElement.height / window.devicePixelRatio));
			// vector.x = (structure.position.x / (window.innerWidth - 240)) * 2 - 1;
			// vector.y = -(structure.position.y / (window.innerHeight - 100)) * 2 + 1;
			vector.x = Math.round( (   vector.x + 1 ) * renderer.domElement.width / 2 );
			vector.y = Math.round( ( - vector.y + 1 ) * renderer.domElement.height / 2 );
			
			// console.log("------------------");
			// console.log("vector2--------");
			// console.log(vector);
			// console.log("------------------");

			let annoPosTop = vector.x; //structure.position.y + 10
			let annoPosLeft = vector.y; //structure.position.x + 10
			let annoPosZ = structure.geometry.parameters.depth + 10;

			let annotation = makeAnnotation(
				bed.link,
				structure.name,
				annoPosTop, 
				annoPosLeft,
				annoPosZ,
				gui
			)
			annotation.name = `ANNOTATION: ${structure.name}`;
			//annotation.visible = false; // does nothing
			// console.log("-------------------------");
			// console.log("annotation---------------------");
			// console.log(annotation);
			// console.log("-------------------------");

			//guiFolderBeds.add(annotation, "hidden");
			//guiFolderBeds.add(annotation, "visible");

			//plane.parent.add(annotation);
			//scene2.add(annotation);
			structure.add(annotation);
		
		}
	}); /** END BEDS *********************************************************************** */
	
	// console.log("-------------------------");
	// console.log("plane.children-----------");
	// console.log(plane.children);
	// console.log("-------------------------");

	return plane.children;
}

/**
 * INFOSPOTS **************************************************************************************
 */
function makeInfospot(message, positionX, positionY, positionZ) {
	/**
	 * infospot
	 */
	let infospotCanvas = $("#infospot"); //document.querySelector("#infospot")
	let ctx = infospotCanvas[0].getContext("2d");
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
		//alphaTest: 0.5,
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

function makeAnnotation(link, contentHTML, positionX, positionY, positionZ, gui) {

	//let annoDiv = document.createElement('div');
	let annoDiv = $(".annotation")[0];
	annoDiv = annoDiv.cloneNode();
	document.body.appendChild( annoDiv );
	// annoDiv.classList.add("annotation");
	//let link = `http://garden.university.local/bed/mcgee-home-garden-1/`;
	annoDiv.innerHTML = `<a href="${link}" target="_blank">${contentHTML}</a> (${positionX}, ${positionY})`;
	annoDiv.style.display = "none"; //block
	annoDiv.style.top = `${positionY}px`;
    annoDiv.style.left = `${positionX}px`;
	// gui.add(annoDiv.style, "display");
	// gui.add(annoDiv.style, "top");
	// gui.add(annoDiv.style, "left");

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

		// do something to object intersected? (testing purposes only)
		// for (let i = 0; i < intersects.length; i++) {
			// hightlight object
			// intersects[i].object.material.color.set(0xff0000);
			// console.log("------------------");
			// console.log("intersects[i]-----");
			// console.log(intersects[i]);
			// console.log("------------------");
		// }

		// if the closest object intersected is not the currently stored intersection object
		if ( intersects[0].object != INTERSECTED1 ) {

			// restore previous intersection object (if it exists) to its original color
			if ( INTERSECTED1 ) {
				for (let i = 0; i < INTERSECTED1.material.length; i++) {
					INTERSECTED1.material[i].color.setHex( INTERSECTED1.currentHex );
				}
			}
			// store reference to closest object as current intersection object
			INTERSECTED1 = intersects[0].object;

			// SEPARATE FOR LOOPS !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
			for (let i = 0; i < INTERSECTED1.material.length; i++) {
				// store color of closest object (for later restoration)
				INTERSECTED1.currentHex = INTERSECTED1.material[i].color.getHex();
			}
			for (let i = 0; i < INTERSECTED1.material.length; i++) {
				// set a new color for closest object
				INTERSECTED1.material[i].color.setHex( 0xffff00 );
			}
			// update text, if it has a "name" field.
			if ( intersects[0].object.name ) {
				
			}
			else {
				
			}
		}
	} 
	// there are no intersections
	else {
		// restore previous intersection object (if it exists) to its original color
		if ( INTERSECTED1 ) {
			for (let i = 0; i < INTERSECTED1.material.length; i++) {
				INTERSECTED1.material[i].color.setHex( INTERSECTED1.currentHex );
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
//document.addEventListener( 'pointerup', onPointerUp, false );
function onPointerUp(event) {
	
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
		// if ( intersectedObject != INTERSECTED2 ) 
		// {
			// console.log("------------------");
			// console.log("intersectedObject--------");
			// console.log(intersectedObject);
			// console.log("------------------");

			// restore previous intersection object (if it exists) to its original color
			if ( INTERSECTED2 ) {
				//INTERSECTED2.material[i].color.setHex( INTERSECTED2.currentHex );
				INTERSECTED2 = intersectedObject;
				// zoom out
				//panCam(100, 200, 200, 800, event.target.camera, event.target.controls);
			} else {
				INTERSECTED2 = intersectedObject;
				// zoom in
				//panCam(INTERSECTED2.position.x, INTERSECTED2.position.y, INTERSECTED2.position.z, 800, event.target.camera, event.target.controls);	
			}
			// store reference to closest object as current intersection object
			//INTERSECTED2 = intersectedObject;
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

			intersectedObject.children.forEach( function(key) {
				// console.log("-------------------------");
				// console.log("key.type (intersectedObject.children)------");
				// console.log(key.type);
				// console.log(key);
				// console.log("-------------------------");
				if (key.type === "Sprite" && event.button == 1) {
					if (key.visible === true) {
						key.visible = false;
					}
					else {
						key.visible = true;
					}
				}
				if (key.type === "Object3D" && event.button == 2) {
					if (key.element.hidden === true) {
						key.element.hidden = false;
						key.element.style.display = "block";
						key.visible = true; // does nothing, but keeps status accurate
					}
					else {
						key.element.hidden = true;
						key.element.style.display = "none";
						key.visible = false; // does nothing, but keeps status accurate
					}
				}
			});

			// update text, if it has a "name" field.
			if ( intersectedObject.name )
			{
				
			}
			else
			{
				
			}
		// }
		// else
		// {
		// 	console.log("INTERSECTED2 already stored.");
		// 	console.log("------------------");
		// 	console.log("intersectedObject--------");
		// 	console.log(intersectedObject);
		// 	console.log("------------------");
		// }
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
	} else {
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
	} else {
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




/** ************************************************************************************* */
/**
 * run app on window load, when everything is ready
 */
$(window).on("load", function() {

	/**
	 * init
	 */
	let garden = init();
	// console.log("-------------------------");
	// console.log(garden);
	// console.log("-------------------------");

});
/** ************************************************************************************* */
})( jQuery );
/** ************************************************************************************* */








/**
 * query wordpress rest api for garden post types + taxonomies
 */



/** 
 * END FILE
 * ************************************************************************************** 
 */