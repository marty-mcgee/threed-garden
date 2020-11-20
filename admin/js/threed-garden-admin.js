/* ThreeDGarden - Custom Admin JavaScript */

//alert("HEY HEY HEY -- FROM ADMIN");
//console.log("HEY HEY HEY -- FROM ADMIN");
//console.log(THREE);
//console.log("-------------------------");

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
	
	let cube = getBox(30, 30, 30, 0x00ff00);
	let plane = getPlane(100, 100, 0xffffff);
	plane.rotation.x = 90;

	// add objects to scene
	scene.add(cube);
	scene.add(plane);
	console.log("-------------------------");
	console.log(scene);
	console.log("-------------------------");

	var camera = new THREE.PerspectiveCamera(
		45,
		window.innerWidth/window.innerHeight,
		0.1,
		1000
	);
	camera.position.x = 20;
	camera.position.y = 40;
	camera.position.z = 100;
	//camera.position.set( 20, 40, 100 );
	camera.lookAt(new THREE.Vector3(0, 0, 0));
	//camera.lookAt( 0, 0, 0 );
	//scene.add(camera);
	console.log("-------------------------");
	console.log(camera);
	console.log("-------------------------");
	
	let renderer = new THREE.WebGLRenderer();
	renderer.setSize(window.innerWidth - 240, window.innerHeight - 100);
	console.log("-------------------------");
	console.log(renderer);
	console.log("-------------------------");

	//document.getElementById('webgl').appendChild(renderer.domElement);
	//$( "#webgl" ).css("border","1px solid black").append(renderer.domElement);
	let canvas = $("#webgl");
	canvas.css("border","1px solid black").append(renderer.domElement);
	console.log("-------------------------");
	console.log(canvas);
	console.log("-------------------------");
	// renderer.render(
	// 	scene,
	// 	camera
	// )

	let animate = function () {
		requestAnimationFrame( animate );

		cube.rotation.x += 0.01;
		cube.rotation.y += 0.01;

		renderer.render( scene, camera );
	};

	animate();
}

function getBox(x, y, z, color){
	let geometry = new THREE.BoxGeometry(x, y, z);
	let material = new THREE.MeshBasicMaterial({
		color: color
	});
	let mesh = new THREE.Mesh(geometry, material);
	return mesh;
}

function getPlane(x, y, color, side){
	let geometry = new THREE.PlaneGeometry(x, y);
	let material = new THREE.MeshBasicMaterial({
		color: color,
		side: THREE.DoubleSide
	});
	let mesh = new THREE.Mesh(geometry, material);
	return mesh;
}

/**
 * run app on window load, when everything is ready
 */
$(window).on("load",function(){
	// init
	init();
});
/** ************************************************************************************* */
})( jQuery );
/** 
 * END FILE
 * ************************************************************************************** 
 */