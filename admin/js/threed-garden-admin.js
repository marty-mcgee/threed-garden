/** ThreeDGarden - Custom Admin JavaScript */

(function( $ ) {
'use strict';

const pluginName = postdata.plugin_name;
const pluginVersion = postdata.plugin_version;
const pluginURL = postdata.plugin_url;
const themeURI = postdata.theme_uri;
const restURL = postdata.rest_url;
// console.log("-------------------------");
// console.log(pluginName, pluginVersion, pluginURL, themeURI, restURL);
// console.log("-------------------------");

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

	/** QUERY FOR BOXES ****************************************************************** */

	let queryURLAllotments = `${restURL}allotment/?_embed`;
	fetch( queryURLAllotments )
		.then( response => response.json() )
		.then( postObject => buildAllotments( postObject, plane ) );
		
	// let queryURLPlantingPlans = `${restURL}planting_plan/?_embed`;
	// fetch( queryURLPlantingPlans )
	// 	.then( response => response.json() )
	// 	.then( postObject => buildPlantingPlans( postObject, plane ) );

	/** TEXTURES ************************************************************************* */

	let loader = new THREE.TextureLoader();
	plane.material.map = loader.load('/wp-content/plugins/threed-garden/admin/media/textures/grasslight-big.jpg');
	//plane.material.bumpMap = loader.load('/wp-content/plugins/threed-garden/admin/media/textures/grasslight-big-nm.jpg');
	//plane.material.bumpScale = 0.05;

	// let loader = new THREE.TextureLoader();
	// cube.material.map = loader.load('/wp-content/plugins/threed-garden/admin/media/textures/fence-lattice-redwood-100x100-white.png');
	//cube.material.bumpMap = loader.load('/wp-content/plugins/threed-garden/admin/media/textures/fence-lattice-redwood-100x100-white.png');
	//cube.material.bumpScale = 0.05;

	let texturePlane = plane.material.map;
	texturePlane.wrapS = THREE.RepeatWrapping;
	texturePlane.wrapT = THREE.RepeatWrapping;
	texturePlane.repeat.set(4, 4);

	// let textureCube = cube.material.map;
	// textureCube.wrapS = THREE.RepeatWrapping;
	// textureCube.wrapT = THREE.RepeatWrapping;
	// textureCube.repeat.set(4, 4);

	/** BACKGROUND *************************************************************************** */

	// manipulate materials
	// load the cube map
	var path = '/wp-content/plugins/threed-garden/admin/media/textures/cube/Forest-Meadow-Cube-Map-2/';
	var format = '.png';
	var urls = [
		path + 'px' + format, path + 'nx' + format,
		path + 'py' + format, path + 'ny' + format,
		path + 'pz' + format, path + 'nz' + format
	];
	var reflectionCube = new THREE.CubeTextureLoader().load(urls);
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
	//plane.add(cube);
	//plane.add(pointLight);
	//plane.add(spotLight);
	plane.add(directionalLight);
	plane.add(ambientLight);
	plane.add(helper);
	scene.add(plane);
	// console.log("-------------------------");
	// console.log(plane);
	// console.log("-------------------------");

	/** CAMERA **************************************************************************** */

	var camera = new THREE.PerspectiveCamera(
		55,
		window.innerWidth/window.innerHeight,
		0.1,
		1000
	);
	camera.position.set( -55, 40, 200 );
	camera.lookAt(new THREE.Vector3(0, 0, 0));
	// console.log("-------------------------");
	// console.log(camera);
	// console.log("-------------------------");

	/** RENDERER ************************************************************************** */
	
	let renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
	renderer.shadowMap.enabled = true;
	renderer.setSize(window.innerWidth - 240, window.innerHeight - 100);
	//renderer.setClearColor(0xFFFFFF);
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
	// folder3.add(cube.material, "roughness", 0, 1);
	//gui.add(cube.position, "z", -100, 100);
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


	/** ANIMATE + RENDER (continuous rendering) ******************************************** */

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

	/** RETURN SCENE *********************************************************************** */
	return scene;
}

function getCube(x, y, z, color){
	let geometry = new THREE.BoxGeometry(x, y, z);
	let material = new THREE.MeshStandardMaterial({
		color: color,
		side: THREE.DoubleSide
	});
	let mesh = new THREE.Mesh(geometry, material);
	mesh.castShadow = true;
	return mesh;
}

function getPlane(x, y, color, side){
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
function update(renderer, scene, camera){
	renderer.render( scene, camera );
	// recursive function loading
	requestAnimationFrame( function(){
		update(renderer, scene, camera);
	} );
}


function buildAllotments(postObject, plane){
	//alert("HEY HEY HEY -- FROM JS");
	console.log("-------------------------");
	console.log("postObject---------------");
	console.log(postObject);
	console.log("-------------------------");

	let loader = new THREE.TextureLoader();

	postObject.forEach( function(key){

		console.log("-------------------------");
		console.log("key.id (postObject)------");
		console.log(key.id);
		console.log(key);
		console.log("-------------------------");

		//buildNewPost(key);
		let image = getFeaturedImage(key);
		console.log("-------------------------");
		console.log("image--------------------");
		console.log(image);
		console.log("-------------------------");

		let cube = getCube(32, 16, 5, 0x772200);
		cube.position.x = 40;
		cube.position.y = -12;
		cube.position.z = cube.geometry.parameters.depth / 2;
		cube.material.roughness = 0.9;
		cube.material.map = loader.load('/wp-content/plugins/threed-garden/admin/media/textures/fence-lattice-redwood-100x100-white.png');
		plane.add(cube);
		console.log("-------------------------");
		console.log("cube--------------------");
		console.log(cube);
		console.log("-------------------------");
	});



	// let cube1 = getCube(32, 16, 5, 0x772200);
	// cube1.position.x = 40;
	// cube1.position.y = -12;
	// cube1.position.z = cube1.geometry.parameters.depth / 2;
	// cube1.material.roughness = 0.9;
	// cube1.material.map = loader.load('/wp-content/plugins/threed-garden/admin/media/textures/fence-lattice-redwood-100x100-white.png');
	// console.log("-------------------------");
	// console.log("cube1--------------------");
	// console.log(cube1);
	// console.log("-------------------------");
	
	let cube2 = getCube(88, 22, 8, 0x773300);
	cube2.position.x = -80;
	cube2.position.y = 40;
	cube2.position.z = cube2.geometry.parameters.depth / 2;
	cube2.rotation.z = Math.PI / 2;
	cube2.material.roughness = 0.9;
	cube2.material.map = loader.load('/wp-content/plugins/threed-garden/admin/media/textures/fence-lattice-redwood-100x100-white.png');
	// console.log("-------------------------");
	// console.log("cube2--------------------");
	// console.log(cube2);
	// console.log("-------------------------");
	
	let cube3 = getCube(10, 16, 12, 0x772200);
	cube3.position.x = 10;
	cube3.position.y = 20;
	cube3.position.z = cube3.geometry.parameters.depth / 2;
	cube3.rotation.z = Math.PI / 2;
	cube3.material.roughness = 0.9;
	cube3.material.map = loader.load('/wp-content/plugins/threed-garden/admin/media/textures/fence-lattice-redwood-100x100-white.png');
	// console.log("-------------------------");
	// console.log("cube3--------------------");
	// console.log(cube3);
	// console.log("-------------------------");

	//plane.add(cube1);
	plane.add(cube2);
	plane.add(cube3);
}

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
		console.log("-------------------------");
		console.log("featImage----------------");
		console.log(featImage);
		console.log("-------------------------");
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
				<div class="post-meta-wrapper post-meta-single post-meta-single-bottom">
					<ul class="post-meta">
						<li class="post-tags meta-wrapper">
							<span class="meta-icon">
								<span class="screen-reader-text">Tags</span>
								<svg class="svg-icon" aria-hidden="true" role="img" focusable="false" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18"><path fill="" d="M15.4496399,8.42490555 L8.66109799,1.63636364 L1.63636364,1.63636364 L1.63636364,8.66081885 L8.42522727,15.44178 C8.57869221,15.5954158 8.78693789,15.6817418 9.00409091,15.6817418 C9.22124393,15.6817418 9.42948961,15.5954158 9.58327627,15.4414581 L15.4486339,9.57610048 C15.7651495,9.25692435 15.7649133,8.74206554 15.4496399,8.42490555 Z M16.6084423,10.7304545 L10.7406818,16.59822 C10.280287,17.0591273 9.65554997,17.3181054 9.00409091,17.3181054 C8.35263185,17.3181054 7.72789481,17.0591273 7.26815877,16.5988788 L0.239976954,9.57887876 C0.0863319284,9.4254126 0,9.21716044 0,9 L0,0.818181818 C0,0.366312477 0.366312477,0 0.818181818,0 L9,0 C9.21699531,0 9.42510306,0.0862010512 9.57854191,0.239639906 L16.6084423,7.26954545 C17.5601275,8.22691012 17.5601275,9.77308988 16.6084423,10.7304545 Z M5,6 C4.44771525,6 4,5.55228475 4,5 C4,4.44771525 4.44771525,4 5,4 C5.55228475,4 6,4.44771525 6,5 C6,5.55228475 5.55228475,6 5,6 Z"></path></svg>						
							</span>
							<span class="meta-text">
								${getTaxonomies( postObject, false )}						
							</span>
						</li>
					</ul><!-- .post-meta -->
				</div>
			`;
		}   
		
		return tagMarkup;
	}

	let output = `
		<hr class="styled-separator is-style-wide" aria-hidden="true">
		<header class="entry-header has-text-align-center header-footer-group">
			<div class="entry-header-inner section-inner medium">
				<div class="entry-categories">
					<span class="screen-reader-text">Categories</span>
					<div class="entry-categories-inner">
						${getTaxonomies( postObject, true )}
					</div><!-- .entry-categories-inner -->
				</div><!-- .entry-categories -->
				<h2 class="entry-title"><a href="${postObject.link}">${postObject.title.rendered}</a></h2>
			</div>
		</header>

		${getFeaturedImage( postObject )}
		
		<div class="post-inner thin">
			<div class="entry-content">
				${postObject.content.rendered}
			</div>
		</div>

		${conditionalTags( postObject )}

		<nav class="pagination-single section-inner load-previous ${postObject.previous_post_ID}" aria-label="Post" role="navigation">
			<hr class="styled-separator is-style-wide" aria-hidden="true">
			<div class="pagination-single-inner">
				<span class="nav-subtitle">Previous post</span>
				<div class="nav-links">
					<div class="nav-previous">
						<a href="javascript:void(0)" data-id="${postObject.previous_post_ID}">
							${postObject.previous_post_title}
						</a>
					</div>
				</div>
				<div class="js-loader">
					<img src="${pluginURL}/media/spinner_font_awesome.svg" width="32" height="32">
				</div>
			</div><!-- .pagination-single-inner -->
			<hr class="styled-separator is-style-wide" aria-hidden="true">
		</nav>
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