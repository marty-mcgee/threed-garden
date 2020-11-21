/* ThreeDGarden - Custom Admin JavaScript */

(function( $ ) {
'use strict';

/**
* All of the code for your admin-facing JavaScript source
* should reside in this file.
*
* Note: It has been assumed you will write jQuery code here, so the
* $ function reference has been prepared for usage within the scope
* of this function.
*
* This enables you to define handlers, for when the DOM is ready:
*
* $(function() {
*
* });
*
* When the window is loaded:
*
* $( window ).load(function() {
*
* });
*
* ...and/or other possibilities.
*
* Ideally, it is not considered best practise to attach more than a
* single DOM-ready or window-load handler for a particular page.
* Although scripts in the WordPress core, Plugins and Themes may be
* practising this, we should strive to set a better example in our own work.
*/

function init() {
	let scene = new THREE.Scene();
	scene.background = new THREE.Color(0x333333);
	//scene.fog = new THREE.Fog(0xFFFFFF, 0, 500);

	let cube = getBox(32, 16, 5, 0x007700);
	cube.position.z = cube.geometry.parameters.depth / 2;

	let plane = getPlane(100, 100, 0x000000);
	plane.name = "plane-1";
	plane.rotation.x = -Math.PI / 2; //-90 degrees in radians
	//plane.position.y = 0;

	let pointLight = getPointLight(0xFFFFFF, 4.0);
	pointLight.position.set( -20, -60, 20 );
	//pointLight.intensity = 3.0;
	console.log("-------------------------");
	console.log(pointLight);
	console.log("-------------------------");

	let gui = new dat.GUI({ autoPlace: true, closeOnTop: true });
	gui.close();
	gui.add(pointLight, "intensity", 0, 10);
	gui.add(pointLight.position, "x", -100, 100);
	gui.add(pointLight.position, "y", -100, 100);
	gui.add(pointLight.position, "z", -100, 100);
	gui.add(cube.position, "z", -100, 100);
	//gui.add(plane, "name");
	console.log("-------------------------");
	console.log(gui);
	console.log("-------------------------");
	
	// add objects to scene
	plane.add(cube);
	plane.add(pointLight);
	scene.add(plane);
	console.log("-------------------------");
	console.log(plane);
	console.log("-------------------------");

	var camera = new THREE.PerspectiveCamera(
		45,
		window.innerWidth/window.innerHeight,
		0.1,
		1000
	);
	// camera.position.x = 20;
	// camera.position.y = 40;
	// camera.position.z = 100;
	camera.position.set( 20, 40, 100 );
	//camera.lookAt( 0, 0, 0 );
	camera.lookAt(new THREE.Vector3(0, 0, 0));
	//scene.add(camera);
	console.log("-------------------------");
	console.log(camera);
	console.log("-------------------------");
	
	let renderer = new THREE.WebGLRenderer({ alpha: true }); //{ alpha: true }
	renderer.shadowMap.enabled = true;
	renderer.setSize(window.innerWidth - 240, window.innerHeight - 100);
	renderer.setClearColor(0xFFFFFF);
	console.log("-------------------------");
	console.log(renderer);
	console.log("-------------------------");

	let controls = new THREE.OrbitControls(camera, renderer.domElement);
	controls.enableDamping = true;
	controls.dampingFactor = 0.25;
	controls.enableZoom = true;
	controls.autoRotate = false;
	console.log("-------------------------");
	console.log(controls);
	console.log("-------------------------");

	//document.getElementById('webgl').appendChild(renderer.domElement);
	//$( "#webgl" ).css("border","1px solid black").append(renderer.domElement);
	let canvas = $("#webgl");
	canvas.css("border","0px solid black")
		.append(gui.domElement)
		.append(renderer.domElement);
	console.log("-------------------------");
	console.log(canvas);
	console.log("-------------------------");

	// render + animate (continuous rendering)
	//update(renderer, scene, camera);
	let animate = function () {
		controls.update();
		requestAnimationFrame( animate );
		// cube.rotation.x += 0.005;
		// cube.rotation.y += 0.005;
		// plane.rotation.x += 0.002;
		// plane.rotation.y += 0.002;
		renderer.render( scene, camera );
	};
	animate();

	return scene;
}

function getBox(x, y, z, color){
	let geometry = new THREE.BoxGeometry(x, y, z);
	let material = new THREE.MeshPhongMaterial({
		color: color
	});
	let mesh = new THREE.Mesh(geometry, material);
	mesh.castShadow = true;
	return mesh;
}

function getPlane(x, y, color, side){
	let geometry = new THREE.PlaneGeometry(x, y);
	let material = new THREE.MeshPhongMaterial({
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
	return light;
}

// maybe
function update(renderer, scene, camera){
	renderer.render( scene, camera );
	// recursive function loading
	requestAnimationFrame( function(){
		update(renderer, scene, camera);
	} );
}

/**
 * run app on window load, when everything is ready
 */
$(window).on("load",function(){
	// init
	let garden = init();
	console.log("-------------------------");
	console.log(garden);
	console.log("-------------------------");

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