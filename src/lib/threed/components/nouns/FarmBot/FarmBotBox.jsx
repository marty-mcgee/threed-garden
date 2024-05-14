import * as THREE from 'three';
import WebGL from 'three/addons/capabilities/WebGL.js';
import ThreeMeshUI from 'three-mesh-ui';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Set up and attach to DOM
const controlsPopup = document.getElementById( 'controls-popup' );
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf4f4f4);

const camera = new THREE.PerspectiveCamera( 40, controlsPopup.clientWidth / controlsPopup.clientHeight, 0.1, 1000 );
camera.position.set( 0, -100, 180 );
camera.lookAt( 0, 0, 0 );

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize( controlsPopup.clientWidth, controlsPopup.clientHeight )
renderer.setPixelRatio(window.devicePixelRatio);
controlsPopup.appendChild( renderer.domElement );

// Electronics box
const loader = new GLTFLoader();

loader.load( '/electronics-box-optimized.gltf', function ( gltf ) {
  const electronicsBox = gltf.scene;
  electronicsBox.scale.set( 1000, 1000, 1000 );
  electronicsBox.rotation.z = Math.PI / 2;
  electronicsBox.position.set( 0, 50, -130 );
  scene.add(electronicsBox);
  }
);

// Button bases
loader.load( '/push-button.gltf', function ( gltf ) {
  const button1Base = gltf.scene;
  button1Base.scale.set( 1000, 1000, 1000 );
  button1Base.rotation.z = Math.PI / 2;

  // Button 1 (E-Stop)
  button1Base.position.set( 60, 20, 0 );
  scene.add(button1Base);

  // Button 2 (Unlock)
  const button2Base = button1Base.clone();
  button2Base.position.set(30, 20, 0);
  scene.add(button2Base);

  // Button 3
  const button3Base = button1Base.clone();
  button3Base.position.set(0, 20, 0);
  scene.add(button3Base);

  // Button 4
  const button4Base = button1Base.clone();
  button4Base.position.set(-30, 20, 0);
  scene.add(button4Base);

  // Button 5
  const button5Base = button1Base.clone();
  button5Base.position.set(-60, 20, 0);
  scene.add(button5Base);
});

// Buttons
  // Button 1 (E-Stop)
    // Center
    const button1CenterGeometry = new THREE.CylinderGeometry( 6.75, 6.75, 1 );
    const button1CenterMaterial = new THREE.MeshStandardMaterial( { color: 0xd4d4d4 } );
    let button1Center;
    button1Center = new THREE.Mesh( button1CenterGeometry, button1CenterMaterial );
    button1Center.position.set(60, 20, 2.1);
    button1Center.rotateX( Math.PI / 2 );
    scene.add(button1Center);
    // Color
    const button1ColorGeometry = new THREE.CylinderGeometry( 9, 9, 1 );
    const button1ColorMaterial = new THREE.MeshStandardMaterial( { color: 0xef6666 } );
    let button1Color;
    button1Color = new THREE.Mesh( button1ColorGeometry, button1ColorMaterial );
    button1Color.position.set(60, 20, 2);
    button1Color.rotateX( Math.PI / 2 );
    // Group
    var button1 = new THREE.Group();
    button1.add(button1Center);
    button1.add(button1Color);
    // Label
    const button1Label = new ThreeMeshUI.Block({
      width: 20,
      height: 8,
      padding: 1,
      borderRadius: 2,
      justifyContent: 'center',
      textAlign: 'center',
      fontFamily: '/Roboto-msdf.json',
      fontTexture: '/Roboto-msdf.png',
      fontColor: new THREE.Color(0xf4f4f4),
      backgroundOpacity: 0.75,
    });
    const button1LabelText = new ThreeMeshUI.Text({
      content: 'E-Stop',
      fontSize: 4
    });
    button1Label.add( button1LabelText );
    button1Label.position.set( 60, 35, 10 );
    button1Label.rotateX( Math.PI / 6 );
    scene.add(button1Label);

  // Button 2 (Unlock)
    // Center
    const button2CenterGeometry = new THREE.CylinderGeometry( 6.75, 6.75, 1 );
    const button2CenterMaterial = new THREE.MeshStandardMaterial( { color: 0xd4d4d4 } );
    let button2Center;
    button2Center = new THREE.Mesh( button2CenterGeometry, button2CenterMaterial );
    button2Center.position.set(30, 20, 2.1);
    button2Center.rotateX( Math.PI / 2 );
    scene.add(button2Center);
    // Color
    let offColor = new THREE.Color(0xffdd66);
    let onColor = new THREE.Color(0xffff00);
    const button2ColorGeometry = new THREE.CylinderGeometry( 9, 9, 1 );
    const button2ColorMaterial = new THREE.MeshStandardMaterial( { color: offColor } );
    let button2Color;
    button2Color = new THREE.Mesh( button2ColorGeometry, button2ColorMaterial );
    button2Color.position.set(30, 20, 2);
    button2Color.rotateX( Math.PI / 2 );
    // Blinking
    let isOffColor = true;
    setInterval(function() {
        if (isOffColor) {
          button2Color.material.color.set(onColor);
        } else {
          button2Color.material.color.set(offColor);
        }
        isOffColor = !isOffColor;
    }, 1000);
    // Group
    var button2 = new THREE.Group();
    button2.add(button2Center);
    button2.add(button2Color);
    // Label
    const button2Label = new ThreeMeshUI.Block({
      width: 20,
      height: 8,
      padding: 1,
      borderRadius: 2,
      justifyContent: 'center',
      textAlign: 'center',
      fontFamily: '/Roboto-msdf.json',
      fontTexture: '/Roboto-msdf.png',
      fontColor: new THREE.Color(0xf4f4f4),
      backgroundOpacity: 0.75,
     });
    const button2LabelText = new ThreeMeshUI.Text({
      content: 'Unlock',
      fontSize: 4
    });
    button2Label.add( button2LabelText );
    button2Label.position.set( 30, 35, 10 );
    button2Label.rotateX( Math.PI / 6 );
    scene.add(button2Label);
  // All buttons
  var allButtons = new THREE.Group();
  allButtons.add(button1);
  allButtons.add(button2);
  scene.add(allButtons);

// LED bases
loader.load( '/led-indicator.gltf', function ( gltf ) {
  const led1Base = gltf.scene;
  led1Base.scale.set( 1000, 1000, 1000 );
  led1Base.rotation.z = Math.PI / 2;

  // LED 1 (Sync)
  led1Base.position.set( 45, 0, -1 );
  scene.add(led1Base);
  // Color
  const led1ColorGeometry = new THREE.CylinderGeometry( 5, 5, 1 );
  const led1ColorMaterial = new THREE.MeshStandardMaterial( { color: 0x66aa44 } );
  let led1Color;
  led1Color = new THREE.Mesh( led1ColorGeometry, led1ColorMaterial );
  led1Color.position.set(45, 0, 0);
  led1Color.rotateX( Math.PI / 2 );
  scene.add(led1Color);

  // LED 2 (Connectivity)
  const led2Base = led1Base.clone();
  led2Base.position.set(15, 0, -1);
  scene.add(led2Base);
  // Color
  const led2ColorGeometry = new THREE.CylinderGeometry( 5, 5, 1 );
  const led2ColorMaterial = new THREE.MeshStandardMaterial( { color: 0x3377dd } );
  let led2Color;
  led2Color = new THREE.Mesh( led2ColorGeometry, led2ColorMaterial );
  led2Color.position.set(15, 0, 0);
  led2Color.rotateX( Math.PI / 2 );
  scene.add(led2Color);

  // LED 3
  const led3Base = led1Base.clone();
  led3Base.position.set(-15, 0, -1);
  scene.add(led3Base);
  // Color
  const led3ColorGeometry = new THREE.CylinderGeometry( 5, 5, 1 );
  const led3ColorMaterial = new THREE.MeshStandardMaterial( { color: 0xf4f4f4 } );
  let led3Color;
  led3Color = new THREE.Mesh( led3ColorGeometry, led3ColorMaterial );
  led3Color.position.set(-15, 0, 0);
  led3Color.rotateX( Math.PI / 2 );
  scene.add(led3Color);

  // LED 4
  const led4Base = led1Base.clone();
  led4Base.position.set(-45, 0, -1);
  scene.add(led4Base);
  // Color
  const led4ColorGeometry = new THREE.CylinderGeometry( 5, 5, 1 );
  const led4ColorMaterial = new THREE.MeshStandardMaterial( { color: 0xf4f4f4 } );
  let led4Color;
  led4Color = new THREE.Mesh( led4ColorGeometry, led4ColorMaterial );
  led4Color.position.set(-45, 0, 0);
  led4Color.rotateX( Math.PI / 2 );
  scene.add(led4Color);
});

// Lighting
var pointLight = new THREE.PointLight(0xFFFFFF, 1);
pointLight.position.set(0, 0, 200);
scene.add(pointLight);

var ambientLight = new THREE.AmbientLight(0x404040, 0.5);
scene.add(ambientLight);

// Fog to limit the view distance
scene.fog = new THREE.Fog(0xf4f4f4, 225, 325);

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
  const intersects = raycaster.intersectObjects( allButtons.children );

  if ( intersects.length > 0 ) {
    // Change the cursor to a pointer
    renderer.domElement.style.cursor = 'pointer';
    if ( intersects[0].object === button1Center || intersects[0].object === button1Color ) {
      // change the color of button1Center
      button1Center.material.color.set( 0xefefef );
    } else if ( intersects[0].object === button2Center || intersects[0].object === button2Color ) {
      // change the color of button2Center
      button2Center.material.color.set( 0xefefef );
    }
  } else {
    // restore original colors
    button1Center.material.color.set( 0xdddddd );
    button2Center.material.color.set( 0xdddddd );
    // Change the cursor back to default
    renderer.domElement.style.cursor = 'default';
  }
}

// Button press effects
window.addEventListener( 'mousedown', onMouseDown, false );

function onMouseDown( event ) {

  // calculate mouse position in normalized device coordinates
  // (-1 to +1) for both components
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  // update the picking ray with the camera and mouse position
  raycaster.setFromCamera( mouse, camera );

  // calculate objects intersecting the picking ray
  const intersects = raycaster.intersectObjects( allButtons.children );

  if ( intersects.length > 0 ) {
    if ( intersects[0].object === button1Center || intersects[0].object === button1Color ) {
      // press button1
      button1.position.z -= 3;
      console.log('E-Stop pressed');
    } else if ( intersects[0].object === button2Center || intersects[0].object === button2Color ) {
      // press button2
      button2.position.z -= 3;
      console.log('Unlock pressed');
    }
  }
}

window.addEventListener( 'mouseup', onMouseUp, false );

function onMouseUp( event ) {
  button1.position.z = 0;
  button2.position.z = 0;
}

// Render loop
function animate() {
	requestAnimationFrame( animate );
  ThreeMeshUI.update();
	renderer.render( scene, camera );
}

// Compatibility check
if ( WebGL.isWebGLAvailable() ) {
	animate();
} else {
	const warning = WebGL.getWebGLErrorMessage();
	document.getElementById( 'container' ).appendChild( warning );
}
