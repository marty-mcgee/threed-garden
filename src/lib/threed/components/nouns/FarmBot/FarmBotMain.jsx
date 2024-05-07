import * as THREE from 'three';
import { ArcballControls } from 'three/addons/controls/ArcballControls.js';
import WebGL from 'three/addons/capabilities/WebGL.js';
import ThreeMeshUI from 'three-mesh-ui';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import GardenImage from "/image.jpeg";

// FarmBot dimensions
const xAxisLength = 2800;
const yAxisLength = 1300;
const bedHeight = 300;

// Set up and attach to DOM
const scene = new THREE.Scene();

// Perspective camera
// const camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 100, 10000 );

// Orthographic camera
const camera = new THREE.OrthographicCamera(
  window.innerWidth / - 2 * 1000,
  window.innerWidth / 2 * 1000,
  window.innerHeight / 2 * 1000,
  window.innerHeight / - 2 * 1000,
  100, 10000
);

// Camera position
camera.position.set( 0, 0, 2750 );
camera.lookAt( 0, 0, 0 );

const renderer = new THREE.WebGLRenderer({ antialias: true });
// renderer.shadowMap.enabled = true;
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild( renderer.domElement );

const controls = new ArcballControls( camera, renderer.domElement, scene );
controls.cursorZoom = true;
controls.enableAnimations = false;
controls.maxDistance = 7500; // Perspective camera only
controls.minDistance = 250; // Perspective camera only
controls.maxZoom = 7500; // Orthographic camera only
controls.minZoom = 250; // Orthographic camera only
controls.setGizmosVisible( false );

controls.addEventListener( 'change', function () {
	renderer.render( scene, camera );
} );

// Ground
const groundGeometry = new THREE.PlaneGeometry(10000, 10000);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0xf4f4f4 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.position.set(0, 0, -bedHeight);
ground.receiveShadow = true;
scene.add(ground);

// Raised bed
const bedGeometry = new THREE.BoxGeometry( xAxisLength + 100, yAxisLength + 100, bedHeight );
const bedMaterial = new THREE.MeshStandardMaterial( { color: 0xc39f7a } );
const bed = new THREE.Mesh( bedGeometry, bedMaterial );
bed.position.set(0, 0, -bedHeight / 2);
bed.castShadow = true;
bed.receiveShadow = true;
scene.add( bed );

// Soil
const soilGeometry = new THREE.BoxGeometry( xAxisLength, yAxisLength, bedHeight + 10 );
const soilMaterial = new THREE.MeshStandardMaterial( { color: 0x8e5e31 } );
const soil = new THREE.Mesh( soilGeometry, soilMaterial );
soil.position.set(0, 0, -bedHeight / 2);
soil.receiveShadow = true;
soil.castShadow = true;
scene.add( soil );

// Plants
const plantMaterial = new THREE.MeshStandardMaterial({ color: 0x66aa44, opacity: 0.8, transparent: true });

for (let i = 0; i < 150; i++) {
    // Create plant geometry with random diameter between 30 and 100
    const plantGeometry = new THREE.SphereGeometry(Math.random() * (100 - 30) + 30);

    // Create plant
    const plant = new THREE.Mesh(plantGeometry, plantMaterial);

    // Set random position in bed
    plant.position.x = Math.random() * xAxisLength - xAxisLength / 2;
    plant.position.y = Math.random() * yAxisLength - yAxisLength / 2;
    plant.position.z = 0;

    // Add plant to scene
    plant.castShadow = true;
    plant.receiveShadow = true;
    scene.add(plant);
}

// Weeds
const weedMaterial = new THREE.MeshStandardMaterial({ color: 0xee6666, opacity: 0.8, transparent: true });

for (let i = 0; i < 150; i++) {
    // Create weed geometry with random diameter between 10 and 50
    const weedGeometry = new THREE.SphereGeometry(Math.random() * (50 - 10) + 10);

    // Create weed
    const weed = new THREE.Mesh(weedGeometry, weedMaterial);

    // Set random position in bed
    weed.position.x = Math.random() * xAxisLength - xAxisLength / 2;
    weed.position.y = Math.random() * yAxisLength - yAxisLength / 2;
    weed.position.z = 0;

    // Add weed to scene
    weed.castShadow = true;
    weed.receiveShadow = true;
    scene.add(weed);
}

// Grid lines
function createGrid() {
  let material = new THREE.LineBasicMaterial({ color: 0x434343 });
  let grid = new THREE.Group();

  // X-axis lines
  for (let i = -yAxisLength / 2; i <= yAxisLength / 2; i += 100) {
      let hPoints = [];
      hPoints.push( new THREE.Vector3(-xAxisLength / 2, i, 10), new THREE.Vector3(xAxisLength / 2, i, 10));
      let hGeometry = new THREE.BufferGeometry().setFromPoints( hPoints );
      let hLine = new THREE.Line(hGeometry, material);
      grid.add(hLine);

      // Add labels
      const gridLabel = new ThreeMeshUI.Block({
        width: 80,
        height: 40,
        padding: 10,
        borderRadius: 10,
        justifyContent: 'center',
        textAlign: 'center',
        fontFamily: '/Roboto-msdf.json',
        fontTexture: '/Roboto-msdf.png',
        fontColor: new THREE.Color(0xf4f4f4),
        backgroundOpacity: 0.5,
       });
      const gridLabelText = new ThreeMeshUI.Text({
        content: i.toFixed(0),
        fontSize: 20
      });
      gridLabel.add( gridLabelText );
      gridLabel.position.set( -xAxisLength/2 - 50, i, 1 );
      scene.add( gridLabel );
  }

  // Y-axis lines
  for (let i = -xAxisLength / 2; i <= xAxisLength / 2; i += 100) {
      let vPoints = [];
      vPoints.push( new THREE.Vector3(i, -yAxisLength / 2, 10), new THREE.Vector3(i, yAxisLength / 2, 10));
      let vGeometry = new THREE.BufferGeometry().setFromPoints( vPoints );
      let vLine = new THREE.Line(vGeometry, material);
      grid.add(vLine);

      // Add labels
      const gridLabel = new ThreeMeshUI.Block({
        width: 80,
        height: 40,
        padding: 10,
        borderRadius: 10,
        justifyContent: 'center',
        textAlign: 'center',
        fontFamily: '/Roboto-msdf.json',
        fontTexture: '/Roboto-msdf.png',
        fontColor: new THREE.Color(0xf4f4f4),
        backgroundOpacity: 0.5,
       });
      const gridLabelText = new ThreeMeshUI.Text({
        content: i.toFixed(0),
        fontSize: 20
      });
      gridLabel.add( gridLabelText );
      gridLabel.position.set( i, -yAxisLength/2 - 25, 1 );
      scene.add( gridLabel );
  }

  scene.add(grid);
}

// Add text using https://felixmariotto.github.io/three-mesh-ui/
const textContainer = new ThreeMeshUI.Block({
	width: 1200,
	height: 300,
	padding: 80,
  borderRadius: 25,
	justifyContent: 'center',
	textAlign: 'center',
  fontFamily: '/Roboto-msdf.json',
  fontTexture: '/Roboto-msdf.png',
  fontColor: new THREE.Color(0xf4f4f4),
  backgroundOpacity: 0.5,
 });

const text = new ThreeMeshUI.Text({
  content: "FarmBot 3D Demo (click to toggle)",
  fontSize: 100
});

textContainer.add( text );
textContainer.position.set( 0, -yAxisLength/1.8, 200 );
textContainer.rotation.x = Math.PI / 8;

scene.add( textContainer );

// Add photo using https://felixmariotto.github.io/three-mesh-ui/
const photoContainer = new ThreeMeshUI.Block({
  height: 800,
  width: 600,
});
new THREE.TextureLoader().load(GardenImage, (texture) => {
  photoContainer.set({
    backgroundTexture: texture,
  });
});
photoContainer.position.set( 0, 0, 20 );
scene.add( photoContainer );

// FarmBot CAD
let gantryColumnLeft, gantryColumnRight, gantryMainBeam;
let farmBotLayer = new THREE.Group();

const loader = new GLTFLoader();

loader.load( '/gantry-column-left.gltf', function ( gltf ) {
  gltf.scene.traverse(function (node) {
    if (node instanceof THREE.Mesh) {
      node.castShadow = true;
    }
  });

  gantryColumnLeft = gltf.scene;
  gantryColumnLeft.scale.set( 1000, 1000, 1000 );
  gantryColumnLeft.rotation.z = Math.PI / 2;
  gantryColumnLeft.position.set( -1200, -yAxisLength / 2 - 50, 60 );
  gantryColumnLeft.castShadow = true;
  farmBotLayer.add(gantryColumnLeft);
  scene.add(farmBotLayer);
});

loader.load( '/gantry-column-right.gltf', function ( gltf ) {
  gltf.scene.traverse(function (node) {
    if (node instanceof THREE.Mesh) {
      node.castShadow = true;
    }
  });

  gantryColumnRight = gltf.scene;
  gantryColumnRight.scale.set( 1000, 1000, 1000 );
  gantryColumnRight.rotation.z = Math.PI / 2;
  gantryColumnRight.position.set( -1200, yAxisLength / 2 + 50, 60 );
  gantryColumnRight.castShadow = true;
  farmBotLayer.add(gantryColumnRight);
  scene.add(farmBotLayer);
});

loader.load( '/gantry-main-beam.gltf', function ( gltf ) {
  gltf.scene.traverse(function (node) {
    if (node instanceof THREE.Mesh) {
      node.castShadow = true;
    }
  });

  gantryMainBeam = gltf.scene;
  gantryMainBeam.scale.set( 1000, 1000, 1000 );
  gantryMainBeam.rotation.z = Math.PI / 2;
  gantryMainBeam.position.set( -1177.5, -750, 620 );
  gantryMainBeam.castShadow = true;
  farmBotLayer.add(gantryMainBeam);
  scene.add(farmBotLayer);
});

function toggleFarmBotLayer() {
  console.log("toggleFarmBotLayer");
  if (farmBotLayer.visible) {
    farmBotLayer.visible = false;
  } else {
    farmBotLayer.visible = true;
  }
}



// Lighting (to illuminate the CAD model)
var pointLight = new THREE.PointLight(0xFFFFFF, 1.25);
pointLight.position.set(-4000, 3000, 4000);
pointLight.castShadow = true;
pointLight.shadow.mapSize.width = 1500;
pointLight.shadow.mapSize.height = 1500;
pointLight.shadow.camera.near = 0.1;
pointLight.shadow.camera.far = 10000;
scene.add(pointLight);

var ambientLight = new THREE.AmbientLight(0x404040, 1);
scene.add(ambientLight);

// LED strip using spotlights
// function createLEDStrip(start, end, numPoints, color, intensity) {
//   var points = [];
//
//   // Create points along the line
//   for (var i = 0; i < numPoints; i++) {
//       var x = start.x + (end.x - start.x) * (i / (numPoints - 1));
//       var y = start.y + (end.y - start.y) * (i / (numPoints - 1));
//       var z = start.z + (end.z - start.z) * (i / (numPoints - 1));
//
//       // Create a spotlight at each point
//       var spotLight = new THREE.SpotLight(color, intensity);
//       spotLight.position.set(x, y, z);
//
//       // Point the light downwards
//       spotLight.target.position.set(x, y, z - 1);
//       scene.add(spotLight.target);
//
//       // Add the light to the scene
//       scene.add(spotLight);
//   };
// }
//
// var start = new THREE.Vector3(-1177.5, -700, 620);
// var end = new THREE.Vector3(-1177.5, 700, 620);
// createLEDStrip(start, end, 5, 0xffffee, 0.25);

// LED strip using rect area light
const rectLight = new THREE.RectAreaLight( 0xffffee, 100, 20, 1500 );
rectLight.position.set( -1177.5, 0, 560 );
rectLight.lookAt( -1177.5, 0, 0 );
scene.add( rectLight )

// Mouse raycasting
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let rect;
function updateRect() {
    rect = renderer.domElement.getBoundingClientRect();
}
window.addEventListener('resize', updateRect);
updateRect();

// Button hover effects
window.addEventListener( 'mousemove', onMouseMove, false );

function onMouseMove( event ) {

  // calculate mouse position in normalized device coordinates
  // (-1 to +1) for both components
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  // update the picking ray with the camera and mouse position
  raycaster.setFromCamera( mouse, camera );

  // calculate objects intersecting the picking ray
  const intersects = raycaster.intersectObjects( [textContainer] );

  if ( intersects.length > 0 ) {
    // Change the cursor to a pointer
    renderer.domElement.style.cursor = 'pointer';
    // change the background color of the text container
    textContainer.set({ backgroundOpacity: 0.8 });
  } else {
    // restore background opacity
    textContainer.set({ backgroundOpacity: 0.5 });
    // Change the cursor back to default
    renderer.domElement.style.cursor = 'default';
  }
}

// Button click action
window.addEventListener( 'click', onClick, false );

function onClick( event ) {

  // calculate mouse position in normalized device coordinates
  // (-1 to +1) for both components
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  // update the picking ray with the camera and mouse position
  raycaster.setFromCamera( mouse, camera );

  // calculate objects intersecting the picking ray
  const intersects = raycaster.intersectObjects( [textContainer] );

  if ( intersects.length > 0 ) {
    toggleFarmBotLayer()
  }
}

// Render loop
function animate() {
	requestAnimationFrame( animate );
  ThreeMeshUI.update();

  // Pan camera back
  // camera.position.y -= 5;

  // Move "sun"
  // pointLight.position.x += 50;

  controls.update();

  // update ThreeMeshUI components
  textContainer.updateMatrixWorld();
  text.updateMatrixWorld();

	renderer.render( scene, camera );
}

// Compatibility check
if ( WebGL.isWebGLAvailable() ) {
  createGrid();
	animate();
} else {
	const warning = WebGL.getWebGLErrorMessage();
	document.getElementById( 'container' ).appendChild( warning );
}
