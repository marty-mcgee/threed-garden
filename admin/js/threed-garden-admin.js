/** ThreeDGarden - Custom Admin JavaScript */

(function( $ ) {
'use strict';

/** PARAMETERS FROM PHP */
const pluginName = postdata.plugin_name;
const pluginVersion = postdata.plugin_version;
const pluginURL = postdata.plugin_url;
const themeURI = postdata.theme_uri;
const restURL = postdata.rest_url;
// console.log("-------------------------");
// console.log(pluginName, pluginVersion, pluginURL, themeURI, restURL);
// console.log("-------------------------");

/** MOUSE CLICKS */
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let INTERSECTED;
let INTERSECTED2;
let targetList = [];

/** MAIN INIT */
function init() {
	let scene = new THREE.Scene();
	scene.background = new THREE.Color(0x333333);
	//scene.fog = new THREE.Fog(0xFFFFFF, 0, 500);

	/** GEOMETRIES *********************************************************************** */
	
	let plane = getPlane(200, 200, 0xFFFFFF);
	plane.name = "plane-1";
	plane.rotation.x = -Math.PI / 2; //-90 degrees in radians
	//plane.position.y = 0;
	plane.material.roughness = 0.0;

	/** TEXTURES ************************************************************************* */

	let loader = new THREE.TextureLoader();
	plane.material.map = loader.load('/wp-content/plugins/threed-garden/admin/media/textures/grasslight-big.jpg');
	// plane.material.bumpMap = loader.load('/wp-content/plugins/threed-garden/admin/media/textures/grasslight-big-nm.jpg');
	// plane.material.bumpScale = 0.01;
	let planeTextureMap = plane.material.map;
	planeTextureMap.wrapS = THREE.RepeatWrapping;
	planeTextureMap.wrapT = THREE.RepeatWrapping;
	planeTextureMap.repeat.set(4, 4);

	/** BACKGROUND *************************************************************************** */

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
	// console.log("-------------------------");
	// console.log(pointLight);
	// console.log("-------------------------");

	// let spotLight = getSpotLight(0xFFFFFF, 4.0);
	// spotLight.position.set( -20, -60, 20 );
	// //spotLight.intensity = 3.0;
	// console.log("-------------------------");
	// console.log(spotLight);
	// console.log("-------------------------");

	let directionalLight = getDirectionalLight(0xFFFFFF, 3.5);
	directionalLight.position.set( -100, -100, 55 );
	//directionalLight.intensity = 3.0;
	// console.log("-------------------------");
	// console.log(directionalLight);
	// console.log("-------------------------");

	let helper = new THREE.CameraHelper(directionalLight.shadow.camera);

	let ambientLight = getAmbientLight(0xFFFFFF, 0.2);
	//ambientLight.position.set( -100, -100, 25 );
	//ambientLight.intensity = 3.0;
	// console.log("-------------------------");
	// console.log(ambientLight);
	// console.log("-------------------------");
	
	/** SCENE ***************************************************************************** */

	// add objects to scene
	//plane.add(structure);
	//plane.add(pointLight);
	//plane.add(spotLight);
	plane.add(directionalLight);
	plane.add(ambientLight);
	//scene.add(helper);
	scene.add(plane);

	/** CAMERA **************************************************************************** */

	let camera = new THREE.PerspectiveCamera(
		55,
		window.innerWidth/window.innerHeight,
		0.1,
		1000
	);
	camera.name = "mycamera";
	camera.position.set(86, 64, 182);
	camera.lookAt(new THREE.Vector3(0, 0, 0));
	// console.log("-------------------------");
	// console.log(camera);
	// console.log("-------------------------");

	/** RENDERER ************************************************************************** */
	
	let renderer = new THREE.WebGLRenderer(
		{ 	alpha: true, 
			antialias: true 
		}
	);
	renderer.shadowMap.enabled = true;
	renderer.setSize(window.innerWidth - 240, window.innerHeight - 100);
	//renderer.setClearColor(0xFFFFFF);
	renderer.domElement.camera = camera;
	//renderer.domElement.targetList = targetList;
	renderer.domElement.targetList = plane.children;
	// renderer.domElement.addEventListener("pointermove", 
	// 	function (event) { onPointerMove(event) }, false);
	renderer.domElement.addEventListener("pointermove", onPointerMove, false);
	// renderer.domElement.addEventListener("pointerdown", 
	// 	function (event, camera, targetList) { onPointerDown(event, camera, targetList) }, false);
	renderer.domElement.addEventListener("pointerdown", onPointerDown, false);
	// console.log("-------------------------");
	// console.log(renderer);
	// console.log("-------------------------");

	/** CONTROLS ************************************************************************** */

	let controls = new THREE.OrbitControls(camera, renderer.domElement);
	controls.enableDamping = true;
	controls.dampingFactor = 0.25;
	controls.enableZoom = true;
	controls.autoRotate = false;
	// console.log("-------------------------");
	// console.log(controls);
	// console.log("-------------------------");

	/** DAT.GUI *************************************************************************** */

	let gui = new dat.GUI({ autoPlace: true, closeOnTop: true });
	gui.close();
	gui.domElement.id = 'gui';
	let folder1 = gui.addFolder("Camera Position");
	folder1.add(camera.position, "x", -100, 100).listen();
	folder1.add(camera.position, "y", -100, 100).listen();
	folder1.add(camera.position, "z", -100, 100).listen();
	let folder2 = gui.addFolder("Directional Light");
	folder2.add(directionalLight, "intensity", 0, 20);
	folder2.add(directionalLight.position, "x", -500, 500);
	folder2.add(directionalLight.position, "y", -500, 500);
	folder2.add(directionalLight.position, "z", -500, 500);
	let folder3 = gui.addFolder("Roughness");
	folder3.add(plane.material, "roughness", 0, 1);
	// folder3.add(structure.material, "roughness", 0, 1);
	//gui.add(structure.position, "z", -100, 100);
	//gui.add(plane, "name");
	// console.log("-------------------------");
	// console.log(gui);
	// console.log("-------------------------");

	/** WEBGL CANVAS *********************************************************************** */

	//document.getElementById('webgl').appendChild(renderer.domElement);
	//$( "#webgl" ).append(renderer.domElement);
	let canvas = $("#webgl");
	canvas.css("border","0px solid black")
		.append(gui.domElement)
		.append(renderer.domElement);
	// console.log("-------------------------");
	// console.log(canvas);
	// console.log("-------------------------");

	/** QUERY FOR BOXES ****************************************************************** */

	let queryURLAllotments = `${restURL}allotment/?_embed`;
	fetch( queryURLAllotments )
		.then( response => response.json() )
		.then( postObject => buildAllotments( postObject, plane, canvas, gui ) );
		
	// let queryURLPlantingPlans = `${restURL}planting_plan/?_embed`;
	// fetch( queryURLPlantingPlans )
	// 	.then( response => response.json() )
	// 	.then( postObject => buildPlantingPlans( postObject, plane ) );


	/** ANIMATE + RENDER (continuous rendering) ******************************************** */

	//update(renderer, scene, camera);
	let animate = function () {

		/** MOUSE CLICKS *********************************************************************/
		
		// update the picking ray with the camera and mouse position
		raycaster.setFromCamera(mouse, camera);
		//raycaster.set( camera.getWorldPosition(), camera.getWorldDirection() );

		//let helper2 = new THREE.CameraHelper(directionalLight.shadow.camera);

		// calculate objects intersecting the picking ray
		const intersects = raycaster.intersectObjects(plane.children);
		
		for (let i = 0; i < intersects.length; i ++) {
			// hightlight object
			//intersects[ i ].object.material.color.set(0xff0000);
		}

		// if there is one (or more) intersections
		if ( intersects.length > 0 )
		{
			// if the closest object intersected is not the currently stored intersection object
			if ( intersects[ 0 ].object != INTERSECTED ) 
			{
				// restore previous intersection object (if it exists) to its original color
				if ( INTERSECTED ) 
					INTERSECTED.material.color.setHex( INTERSECTED.currentHex );
				// store reference to closest object as current intersection object
				INTERSECTED = intersects[ 0 ].object;
				// store color of closest object (for later restoration)
				INTERSECTED.currentHex = INTERSECTED.material.color.getHex();
				// set a new color for closest object
				INTERSECTED.material.color.setHex( 0xffff00 );
				
				// update text, if it has a "name" field.
				if ( intersects[ 0 ].object.name )
				{
					
				}
				else
				{
					
				}
			}
		} 
		else // there are no intersections
		{
			// restore previous intersection object (if it exists) to its original color
			if ( INTERSECTED ) 
				INTERSECTED.material.color.setHex( INTERSECTED.currentHex );
			// remove previous intersection object reference
			//     by setting current intersection object to "nothing"
			INTERSECTED = null;
		}
		/** MOUSE CLICKS END *****************************************************************/

		/** CONTINUE PLEASE (MANDATORY) */
		controls.update();
		requestAnimationFrame( animate );
		// structure.rotation.x += 0.005;
		// structure.rotation.y += 0.005;
		// plane.rotation.x += 0.002;
		// plane.rotation.y += 0.002;
		renderer.render( scene, camera );
	};
	animate();

	/** RETURN SCENE *********************************************************************** */
	return scene;
}

function getGeometry(shape, x, y, z, color){
	let geometry;
	switch (shape) {
		case 'box':
			geometry = new THREE.BoxGeometry(x, y, z);
			break;
		case 'cone':
			geometry = new THREE.ConeGeometry(x, y, z);
			break;
		case 'cylinder':
			geometry = new THREE.CylinderGeometry(x, y, z, 50);
			break;
		default:
			geometry = new THREE.BoxGeometry(x, y, z);
			break;
	}
	let material = new THREE.MeshStandardMaterial({
		color: color,
		side: THREE.DoubleSide
	});
	let mesh = new THREE.Mesh(geometry, material);
	mesh.castShadow = true;
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
	light.shadow.bias 			= 0.001;
	light.shadow.mapSize.width 	= 2048; //default = 1024
	light.shadow.mapSize.height = 2048; //default = 1024
	light.shadow.camera.left 	= -500; //default = -5
	light.shadow.camera.bottom 	= -500; //default = -5
	light.shadow.camera.right 	= 500; //default = 5
	light.shadow.camera.top 	= 500; //default = 5
	return light;
}

function getAmbientLight(color, intensity){
	let light = new THREE.AmbientLight(color, intensity);
	return light;
}

// maybe
// function update(renderer, scene, camera){
// 	renderer.render( scene, camera );
// 	// recursive function loading
// 	requestAnimationFrame( function(){
// 		update(renderer, scene, camera);
// 	} );
// }



/**
 * BUILD FROM REST API POST OBJECT ************************************************************
 */
function buildAllotments(postObject, plane, canvas, gui) {
	//alert("HEY HEY HEY -- FROM JS");
	console.log("-------------------------");
	console.log("postObject---------------");
	console.log(postObject);
	console.log("-------------------------");

	let loader = new THREE.TextureLoader();

	let sprites = [];
	let folderHey = gui.addFolder("Annotations");
	//let targetList = [];

	postObject.forEach( function(key){

		console.log("-------------------------");
		console.log("key.id (postObject)------");
		console.log(key.id);
		console.log(key);
		console.log("-------------------------");

		let allotment = {};
		allotment.parameters = {};
		allotment.position = {};
		allotment.images = {};
		allotment.parameters.x = parseInt(key.acf.allotment_width);
		allotment.parameters.y = parseInt(key.acf.allotment_length);
		allotment.parameters.z = parseInt(key.acf.allotment_height);
		allotment.position.x = parseInt(key.acf.allotment_position_x);
		allotment.position.y = parseInt(key.acf.allotment_position_y);
		allotment.position.z = parseInt(key.acf.allotment_position_z);
		allotment.images.texture = key.acf.allotment_texture_image;
		allotment.images.featured = getFeaturedImage(key);
		allotment.shape = key.acf.allotment_shape;
		allotment.color = key.acf.allotment_color;
		allotment.title = key.title.rendered;
		allotment.description = key.content.rendered;
		console.log("-------------------------");
		console.log("allotment----------------");
		console.log(allotment);
		console.log("-------------------------");

		// annotations + additional media
		//buildNewPost(key);

		let structure = getGeometry(
			allotment.shape,
			allotment.parameters.x, 
			allotment.parameters.y, 
			allotment.parameters.z, 
			allotment.color
		);
		structure.name = allotment.title;
		structure.position.x = allotment.position.x;
		structure.position.y = allotment.position.y;
		structure.position.z = (structure.geometry.parameters.depth / 2); // + allotment.position.z
		structure.material.roughness = 0.9;
		structure.material.map = loader.load(allotment.images.texture);
		// structure.material.bumpMap = loader.load(allotment.images.texture);
		// structure.material.bumpScale = 0.05;
		let structureTextureMap = structure.material.map;
		structureTextureMap.wrapS = THREE.RepeatWrapping;
		structureTextureMap.wrapT = THREE.RepeatWrapping;
		structureTextureMap.repeat.set(4, 4);
		
		plane.add(structure);
		// console.log("-------------------------");
		// console.log("structure---------------------");
		// console.log(structure);
		// console.log("-------------------------");

		sprites[key] = makeTextSprite(
			structure.name, 
			{ 	fontsize: 24, 
				fontface: "Calibri", 
				borderColor: {r:255, g:0, b:0, a:0.7}, 
				backgroundColor: {r:255, g:255, b:255, a:0.7} 
			} 
		);
		sprites[key].position.set(5, 5, allotment.parameters.z + 15);
		sprites[key].visible = false;
		
		structure.add(sprites[key]);
		console.log("-------------------------");
		console.log("structure---------------------");
		console.log(structure);
		console.log("-------------------------");

		folderHey.add(sprites[key], "visible").listen();

		targetList.push(structure);

	});

	return true;
}

/**
 * TEXT *******************************************************************************************
 */
function makeTextSprite( message, parameters )
{
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

	//let spriteAlignment = THREE.SpriteAlignment.topLeft;
		
	let canvas = document.createElement('canvas');
	let context = canvas.getContext('2d');
	context.font = "Bold " + fontsize + "px " + fontface;
	//context.textAlign = "center";
    
	// get size data (height depends only on font size)
	let metrics = context.measureText( message );
	let textWidth = metrics.width;
	console.log("-------------------------");
	console.log("metrics------------------");
	console.log(textWidth);
	console.log("-------------------------");

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
	let texture = new THREE.Texture(canvas);
	texture.needsUpdate = true;

	let spriteMaterial = new THREE.SpriteMaterial( 
		{ map: texture } //, useScreenCoordinates: false, alignment: spriteAlignment
	);
	let sprite = new THREE.Sprite( spriteMaterial );
	sprite.scale.set(50, 25, 1.0);

	return sprite;
}

// function for drawing rounded rectangles
function roundRect(ctx, x, y, w, h, r) 
{
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

/**
 * MOUSE CLICKS **********************************************************************************
 */

// when the mouse moves, call the given function
//document.addEventListener( 'pointermove', onPointerMove, false );
function onPointerMove( event ) 
{
	// the following line would stop any other event handler from firing
	// (such as the mouse's TrackballControls)
	// event.preventDefault();
	
	// update the mouse variable
	// mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	// mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
	// mouse.x = (event.offsetX / canvas.clientWidth) * 2 - 1;
	// mouse.y = -(event.offsetY / canvas.clientHeight) * 2 + 1;
	mouse.x = (event.offsetX / (window.innerWidth - 240)) * 2 - 1;
	mouse.y = -(event.offsetY / (window.innerHeight - 100)) * 2 + 1;
	// console.log("------------------");
	// console.log("mouse hover-------");
	// console.log(mouse.x, mouse.y);
	// console.log("------------------");
}

// when the mouse moves, call the given function
//document.addEventListener( 'pointerdown', onPointerDown, false );
function onPointerDown(event) 
{
	// the following line would stop any other event handler from firing
	// (such as the mouse's TrackballControls)
	// event.preventDefault();
	
	// update the mouse variable
	// mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	// mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
	// mouse.x = (event.offsetX / canvas.clientWidth) * 2 - 1;
	// mouse.y = -(event.offsetY / canvas.clientHeight) * 2 + 1;
	mouse.x = (event.offsetX / (window.innerWidth - 240)) * 2 - 1;
	mouse.y = -(event.offsetY / (window.innerHeight - 100)) * 2 + 1;
	// console.log("------------------");
	// console.log("mouse clicked-----");
	// console.log(mouse.x, mouse.y);
	// console.log("------------------");
	
	// let camera = scene.getObjectByName("mycamera");
	console.log("------------------");
	console.log("event------------");
	console.log(event);
	console.log("------------------");


	// find intersections

	// create a Ray with origin at the mouse position
	//   and direction into the scene (camera direction)
	// let vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
	//projector.unprojectVector( vector, camera );
	// let raycaster2 = new THREE.Raycaster( 
	// 	event.originalTarget.camera.position, 
	// 	vector.sub( event.originalTarget.camera.position ).normalize() 
	// );
	let raycaster2 = new THREE.Raycaster();
	raycaster2.setFromCamera(mouse, event.originalTarget.camera);
	// raycaster2.set( 
	// 	event.originalTarget.camera.getWorldPosition(), 
	// 	event.originalTarget.camera.getWorldDirection() 
	// );
	console.log("------------------");
	console.log("raycaster2--------");
	console.log(raycaster2);
	console.log("------------------");

	// create an array containing all objects in the scene with which the raycaster2 intersects
	var intersects = raycaster2.intersectObjects( event.originalTarget.targetList );
	console.log("------------------");
	console.log("intersects--------");
	console.log(intersects);
	console.log("------------------");
	
	// if there is one (or more) intersections
	if ( intersects.length > 0 )
	{
		console.log("Hit @ " + toString( intersects[0].point ) );
		// change the color of the closest face.
		// intersects[ 0 ].face.color.setRGB( 0.8 * Math.random() + 0.2, 0, 0 ); 
		// intersects[ 0 ].object.geometry.colorsNeedUpdate = true;

		// if the closest object intersected is not the currently stored intersection object
		let intersectedObject = intersects[ 0 ].object;
		// if ( intersectedObject != INTERSECTED2 ) 
		// {
			console.log("------------------");
			console.log("intersectedObject--------");
			console.log(intersectedObject);
			console.log("------------------");

			// restore previous intersection object (if it exists) to its original color
			if ( INTERSECTED2 ) 
			{
				//INTERSECTED2.material.color.setHex( INTERSECTED2.currentHex );
				
			}
			// store reference to closest object as current intersection object
			INTERSECTED2 = intersectedObject;
			// store color of closest object (for later restoration)
			//INTERSECTED2.currentHex = INTERSECTED2.material.color.getHex();
			// set a new color for closest object
			//INTERSECTED2.material.color.setHex( 0xff0000 );
			
			intersectedObject.children.forEach( function(key) {
				// console.log("-------------------------");
				// console.log("key.type (intersectedObject.children)------");
				// console.log(key.type);
				// console.log(key);
				// console.log("-------------------------");
				if (key.type === "Sprite"){
					if (key.visible === true){
						key.visible = false;
					}
					else {
						key.visible = true;
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
$(window).on("load",function(){
	// init
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