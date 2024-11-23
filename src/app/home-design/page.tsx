// ==============================================================
// Home Design Page (main landing page for 2D-3D Demo)

'use client'

// ==============================================================
// RESOURCES

// ** NEXT Imports
// import type { NextPage } from 'next'
import type { TNextPageWithProps } from '#/lib/types/TAppProps'
import dynamic from 'next/dynamic'

// ** APOLLO Imports
// ** Apollo Client 3 -- State Management using Cache/Store (via GraphQL)
// // import { ApolloProvider } from '@apollo/client'
// // import { ApolloConsumer } from '@apollo/client'
import { useApolloClient } from '@apollo/client'
import { useReactiveVar } from '@apollo/client'
// // import { getApolloClient, getApolloContext } from '@apollo/client'
// // import {
// //   // ApolloLink,
// //   // HttpLink,
// //   getApolloContext
// // } from '@apollo/client'
// import {
//   useQuery,
//   useSuspenseQuery,
//   useBackgroundQuery,
//   useReadQuery,
//   useFragment
// } from '@apollo/experimental-nextjs-app-support/ssr'
// // import stores from '#/lib/stores/apollo'
// // import { stores, queries, mutations } from '#/lib/stores/apollo'
import {
  // stores,
  preferencesStore,
  canvasStateStore,
  // projectStore,
  homeDesignStore,
  // queries,
  // mutations,
  // reactive vars:
  isPreferencesSetVar,
  preferencesDataVar,
  isCanvasStateSetVar,
  canvasStateVar,
} from '#/lib/stores/apollo'

import { useSession } from 'next-auth/react'
// import { auth } from '#/lib/auth/auth'
// import { useAuth } from '#/lib/auth/hooks/useAuth'
// import SessionData from '~/src/layout/ui/session-data'
// import CustomLink from '~/src/layout/ui/custom-link'

// ** REACT Imports
import { 
  useState,
  useRef,
  useEffect,
  Suspense,
} from 'react'

// ** PAPER Imports
import paper from 'paper'

// ** THREED Imports
// import ThreeDComponents from '~/src/lib/threed/threed'
const ThreeDComponents = dynamic(() => import('~/src/lib/threed/ThreeDComponents'), { ssr: false })

// ** R3F Imports
import {
  Canvas,
  // Camera, // use PerspectiveCamera from drei library
  useFrame,
  useThree,
  useLoader,
  // extend, // if using function extend({ OrbitControls })
} from '@react-three/fiber'

// ** R3F HELPERS Imports
import {
  PerspectiveCamera,
  // Environment, Stage,
  // KeyboardControls,
  OrbitControls, TransformControls, PivotControls,
  GizmoHelper, GizmoViewcube, GizmoViewport,
  // ContactShadows, BakeShadows,
  // softShadows, // softShadows()
  Preload,
  Loader, useProgress,
  Html, Center,
  // useGLTF, useFBX,
} from '@react-three/drei'
// ** QUESTION: do stuff with IMPORTS ??
// extend({ OrbitControls })

// ** RADIX-UI Imports
import {
  Flex,
  Grid,
  Container,
  Button, 
  Heading,
  Text,
} from '@radix-ui/themes'

// ** PANELS Imports
import { 
  Panel, 
  PanelGroup,
  PanelResizeHandle,
} from 'react-resizable-panels'
import PanelResizeHandleHorizontal from '#/layout/ui/resize-handle'

// moved to layout
// // ** STYLE Imports
// // import '#/layout/styles/styles-radix-ui-themes.css'
// // import '#/layout/styles/styles-radix-ui-custom.css'
// import '#/lib/home-design/src/styles/radix-ui.css'
// import stylesPanels from '#/layout/styles/styles-panels.module.css'
// // ** THREED CSS Imports
// import '#/lib/home-design/src/styles/threed-home-design.css'
// // import '#/lib/home-design/src/styles/annotations.css'
// // import '#/lib/home-design/src/styles/fa-550.css'

// ** ICON Imports
import { 
  ArrowLeftEndOnRectangleIcon,
  ArrowRightEndOnRectangleIcon,
} from '@heroicons/react/24/outline'

// ** LAYOUT Components (Head, Body, Foot)
// import Header from '#/layout/header'
// import Footer from '#/layout/footer'

// ** COMPONENT Imports
import Logo from '#/layout/ui/logo'

// ** STATIC DATA Imports
import objectsJSON from '#/app/api/home-design/objects.json'
// import planJSON from 'plans/threed-plan-example-001.threed'
import planJSON from '#/app/api/home-design/threed-plan-demo-1.json'

// ** Helper Components
// import Spinner from '#/layout/ui/spinner'
// ** Colorful Console Messages: Utility
import ccm from '#/lib/utils/console-colors'

// import React from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import {
	HamburgerMenuIcon,
	DotFilledIcon,
	CheckIcon,
	ChevronRightIcon,
} from '@radix-ui/react-icons'

// ==============================================================

// ==============================================================
// ** DEMO Imports
// ☑️<script type='text/javascript' src='scripts/jquery-1.11.3.min.js'></script>
// ☑️<script type='text/javascript' src='scripts/paper-full.js?a=1'></script>
// ☑️<script type='text/javascript' src='scripts/three.min.js'></script>
import * as THREE from 'three'
// console.debug('THREE', THREE)
// 🟢<script type='text/javascript' src='scripts/threed.js'></script>
// 🟢ex: import threed from './scripts/threed'
// 🔘<script type='text/javascript' src='scripts/trackballcontrols.js'></script>
// 🔘<script type='text/javascript' src='scripts/tween.js'></script>
// ☑️<script type='text/javascript' src='scripts/MTLLoader.js'></script>
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js'
// ☑️<script type='text/javascript' src='scripts/OBJLoader.js'></script>
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
// 🔘<script type='text/javascript' src='scripts/OBJExporter.js'></script>
// 🔘<script type='text/javascript' src='scripts/sky.js'></script>
// 🔘<script type='text/javascript' src='scripts/ThreeCSG.js'></script>
// 🔘<script type='text/javascript' src='scripts/jquery.minicolors.min.js'></script>
// ==============================================================
// ☑️ others
// <!-- <script type='text/javascript' src='scripts/jsonc.min.js'></script> -->
// <!-- SHADERS + PROCESSORS -->
// <!-- <script type='text/javascript' src='scripts/shaders/CopyShader.js'></script> -->
// <!-- <script type='text/javascript' src='scripts/volumeMaskShader.js'></script> -->
// <!-- <script type='text/javascript' src='scripts/shaders/RGBShiftShader.js'></script> -->
// <!-- <script type='text/javascript' src='scripts/postprocessing/EffectComposer.js'></script> -->
// <!-- <script type='text/javascript' src='scripts/postprocessing/RenderPass.js'></script> -->
// <!-- <script type='text/javascript' src='scripts/postprocessing/ShaderPass.js'></script> -->
// ==============================================================

// ==============================================================
// IMPORTS COMPLETE
// ==============================================================

// DEBUG PREFERENCES FOR THIS MODULE
const debug: boolean = true
const DEBUG: boolean = true

// const appVersion: string = 'v0.16.1'
const appVersion: string = require('package.json').version

if (debug || DEBUG) {
  console.debug('%c🥕 ThreeDHomeDesign<FC,R3F>: {.tsx}', ccm.green)
  console.debug('%c🌱 appVersion', ccm.darkgreen, appVersion)
  console.debug(`%c====================================`, ccm.darkgreen)
}

// ==============================================================
// ** 🟣 TYPED VARIABLES

const enableOrbit: boolean = true
const enableGizmoCube: boolean = true

// <script type='text/javascript' data-cfasync='false'>
let fragment: any = null
let readOnly: boolean = false
let UILayout: string = 'default' // 3dView | planView | default
let objectsURL: string = 'https://threedpublic.s3.amazonaws.com/demo/'
// </script>

let threedHomeDesign: string = 'HEY HEY HEY _________________________',
  mouseMode: number = 0,
  toolMode: string = 'pointer', // pointer | walls | floor | roof | dimension | text | background | ground | defaults
  selectedItem: any,
  defaultCursor: string = 'default',
  deselectAll: Function,
  toolsGroup: any = {},
  gridGroup = {},
  threedGroup = {},
  wallsGroup = {},
  roofsGroup = {},
  floorsGroup = {},
  dimensionsGroup = {},
  textsGroup = {},
  guidesGroup = {},
  defaultWallHeight: number = 265,
  defaultWallThickness: number = 20,
  defaultRoofThickness: number = 25,
  defaultRoofWidth: number = 350,
  defaultRoofRise: number = 300,
  defaultRoofStartHeight: number = 0,
  defaultFloorThickness: number = 25,
  rotateIcon: any,
  resizeIcon: any,
  elevateIcon: any,
  heightIcon: any,
  planView: HTMLElement,
  rulerLeft,
  rulerLeftCtx,
  rulerBottom,
  rulerBottomCtx,
  mouseIndicatorX: number = 0,
  mouseIndicatorY: number = 0,
  fullscreenPlanViewBtn,
  fullscreen3dViewBtn,
  modalCloseBtnAbout,
  modalCloseBtnModel3d,
  movePointIcons = [],
  movePointIconSelectedId: number = 0,
  selectedMovePointIcon,
  wallPath,
  wallIdCounter: number = 0,
  wallsRectangles = {},
  wallsRectangles3d = {},
  wallHelperPath,
  wallHelperRectangle,
  startedDrawingWalls: boolean = false,
  floorPath,
  floorIdCounter: number = 0,
  floorHelperPath,
  startedDrawingFloor: boolean = false,
  roofPath,
  roofIdCounter: number = 0,
  roofHelperPath,
  roofsRectangles = {},
  roofsRectangles3d = {},
  roofHelperRectangle,
  startedDrawingRoofs: boolean = false,
  dimensionPath,
  dimensionIdCounter: number = 0,
  dimensionHelperPath,
  startedDrawingDimension: boolean = false,
  stretchYPath,
  stretchYStartHeight: number = 0,
  elevatePath,
  elevating: boolean = false,
  elevateStartHeight: number = 0,
  dragging: boolean = false,
  scalingXY: boolean = false,
  scalingY: boolean = false,
  rotating: boolean = false,
  wallHelper3dCube,
  roofHelper3dCube,
  redrawGrid: Function,
  xLines = [],
  yLines = [],
  threedToLoadCount: number = 0,
  loadedThreedCount: number = 0,
  tools,
  offsetMousePoint: any, // Object = {x: 0, y: 0}, // number = 0,
  ctrlKeyPressed: boolean = false,
  scaleFactor: number = 1.1,
  cumulclick: number = 0,
  screenScale: number = 1,
  ratioX: number = 0,
  ratioY: number = 0,
  lastNewWallSegmentClick: number = 0,
  lastNewRoofSegmentClick: number = 0,
  lastNewFloorSegmentClick: number = 0,
  // **
  threedItems: Object[] = objectsJSON,
  // **
  canvas3d,
  camera,
  renderer,
  container,
  scene: Object = {
    // background: new THREE.CubeTextureLoader().load(cubeMapURLs), // ThreeDGarden1.tsx
    background: new THREE.Color(0x171717),
  },
  mesh,
  ground,
  groundMat,
  hemiLight,
  dirLight,
  ambientLight,
  pointLight,
  controls: any,
  wallMaterial,
  floorMaterial,
  roofMaterial,
  tween,
  raycaster,
  mouse,
  clickableObjects: Object[] = [],
  clickableObjectsCounter: number = 0,
  maskObjects: Object[] = [],
  maskObjectsApplied: Object[] = [],
  maskObjectsAppliedRoof: Object[] = [],
  // **
  verticalSlider,
  verticalSliderDragging: boolean,
  horizontalSliderLeft: HTMLElement,
  horizontalSliderLeftDragging: boolean,
  horizontalSliderRight: HTMLElement,
  horizontalSliderRightDragging: boolean,
  // **
  threedDragDiv: HTMLElement, // JSX.Element = <div></div>,
  draggingThreedIcon:boolean = false,
  draggingThreedItem: any, // number = 0, // -1
  draggingThreedAngle: number = 0,
  draggingThreedRectangle: any,
  // draggingThreedRectangle = new paper.Path.Rectangle(
  //   new paper.Point(-1, -1),
  //   new paper.Point(1, 1)
  // ),
  // **
  wallCornersX = [],
  wallCornersY = [],
  roofCornersX = [],
  roofCornersY = [],
  snapPoint,
  unjoinedWallSegments = [],
  allWallSegments = [],
  unjoinedRoofSegments = [],
  allRoofSegments = [],
  snapPointOverride = {},
  textPath,
  textIdCounter: number = 0,
  startedDrawingText: boolean = false,
  editingTextId = -1,
  Threed = {},
  Walls = {},
  Roofs = {},
  Floors = {},
  Floors3d = {},
  Dimensions = {},
  Texts = {},
  plan: Object = {
    threed: {},
    walls: {},
    roofs: {},
    floors: {},
    levels: [
      { id: 0, height: 0 },
    ],
    dimensions: {},
    texts: {},
    verticalGuides: {},
    horizontalGuides: {}
  },
  // **
  planHistory = [
    JSON.stringify(plan)
    // planHistory.push(JSON.stringify(plan))
  ],
  planHistoryPosition: number = 0,
  // **
  backgroundRaster,
  backgroundRasterRatioX: number = 1,
  backgroundRasterRatioY: number = 1,
  idToCopyPaste: number = -1,
  lastPasteX: number = 0,
  lastPasteY: number = 0,
  progressBar: HTMLElement,
  focusPoint,
  selectedItem3DAxes,
  activeLevel,
  levelButtons,
  otherLayerWallsRasters = [],
  otherLayerThreedRasters = [],
  extrudeSettings = {
    steps: 1,
    depth: defaultFloorThickness,
    bevelEnabled: false,
  },
  modalModel3dThreedId: number = -1,
  model3dObjectRef,
  model3dViewOpen: boolean = false,
  model3dScene,
  model3dSceneRenderer,
  model3dViewContainer,
  model3dSceneCamera,
  model3dViewCanvas,
  loadingProgressTxt: string = '',
  lastMousePoint,
  dltext: string = '',
  zoomRectangle,
  sky,
  sunSphere,
  inclination,
  azimuth,
  examplePlan,
  fLineX,
  fLineY,
  fLineZ,
  modalsActive: boolean = false,
  shareLinkUrl: string = '',
  shareLinkUrl3d: string = '',
  shareLinkUrlPlan: string = '',
  verticalGuides = {},
  horizontalGuides = {},
  selectedGuideId = -1,
  guideCounter: number = 0,
  draggingNewGuide: boolean = false,
  snapTolerance: number = 1,
  groundWidth: number = 5e3,
  groundLength: number = 5e3

// ==============================================================

/* */

// // import React from 'react'
// import * as Dialog from '@radix-ui/react-dialog'
// import { Cross2Icon } from '@radix-ui/react-icons'
// // import './styles.css' 

// const DialogModals = () => {
//   const [containerAboutModal, setContainerAboutModal] = useState(null)
//   console.debug('containerAboutModal', containerAboutModal)
  
//   return (
//     <>
//       <Dialog.Root>
//         <Dialog.Trigger asChild>
//           <button className='Button violet'>Show About Modal</button>
//         </Dialog.Trigger>
//         {/* <Dialog.Portal container={containerAboutModal}> */}
//           <Dialog.Overlay className='DialogOverlay' />
//           <Dialog.Content className='DialogContent'>
//             <Dialog.Title className='DialogTitle'>
//               About ThreeD Home Design
//             </Dialog.Title>
//             <Dialog.Description className='DialogDescription'>
//               Make changes to your profile here. Click save when you're done.
//             </Dialog.Description>
//             {/* 
//             <fieldset className='Fieldset'>
//               <label className='Label' htmlFor='name'>
//                 Name
//               </label>
//               <input className='Input' id='name' defaultValue='Marty McGee' />
//             </fieldset>
//             <fieldset className='Fieldset'>
//               <label className='Label' htmlFor='username'>
//                 Username
//               </label>
//               <input className='Input' id='username' defaultValue='@martymcgee' />
//             </fieldset>
//             <div
//               style={{ display: 'flex', marginTop: 25, justifyContent: 'flex-end' }}
//             >
//               <Dialog.Close asChild>
//                 <button className='Button green'>Save changes</button>
//               </Dialog.Close>
//             </div>
//             */}
//             <Dialog.Close asChild>
//               <button className='IconButton' aria-label='Close'>
//                 <Cross2Icon />
//               </button>
//             </Dialog.Close>
//             <div className='modal-content'>
//               <div className='modal-header'>
//                 {/* <span className='close'><br/>-X-<br/></span> */}
//                 {/* <a href='https://threedgarden.com/' title='ThreeD Garden'
//                   // style='color: #FFFFFF text-decoration: none'
//                 >        
//                   <img src='favicon/favicon.png' 
//                     height='48px' 
//                     // 
//                     alt='ThreeD Home Design' 
//                   />
//                   <h2>ThreeD Home Design</h2>
//                 </a> */}
//               </div>
//               <div className='modal-body'>

//                 <div className='tab'>
//                   <button 
//                     className='tablinks active' 
//                     onClick={() => openTab('tab1')} 
//                     id='tab1'
//                   >
//                     Intro
//                   </button>
//                 </div>

//                 <div id='tab1Content' className='tabcontent' style={{display: 'block'}}>
//                   <h3>ThreeD Home Design Introduction</h3>
//                   <p>Plan + Share Ideas for your Home Design in 2D + 3D</p>
//                   <div style={{padding: '12px'}}>
//                     <div>
//                       Save Plan Edits to local web storage? 
//                       <input 
//                         type='checkbox' 
//                         id='saveEditsToLocalStorage' 
//                         onChange={() => handleSaveEditsLocalStorageOption()}
//                       />
//                       <span className='tooltip'>
//                         {/* <img src='media/info.png' className='tooltip' /> */}
//                         <span className='tooltiptext'>
//                           <div>
//                             Any edits you make to the plan will be saved to your browsers local web storage so that you don't lose any work between saves.<br/>The plan may be removed if you clean your browsers cookies and history, so to save your work long term, use the 'File-Save' option in the main <a href='http://threedgarden.com'>ThreeD Home Design</a> toolbar.<br/>
//                             More info about 
//                             <a href='https://www.w3schools.com/HTML/html5_webstorage.asp' target='_blank' rel='noreferrer'>
//                               Local Web Storage
//                             </a>.
//                           </div>
//                         </span>
//                       </span>
//                       <div id='localStoragePlanDiv'>
//                         <table>
//                           <tbody>
//                             <tr>
//                               <td style={{ textAlign: 'center'}}>
//                                 Most Recent Edit saved in Local Web Storage.
//                                 <br />
//                                 <button 
//                                   id='loadLocalStoragePlanBtn'
//                                   onClick={() => loadFromLocalStorage()}
//                                 >
//                                   Load Plan
//                                 </button>
//                                 <br />
//                                 <br />
//                                 <span id='localStoragePlanLastSavedDate'></span>
//                               </td>
//                               <td>
//                                 <div>
//                                   <img 
//                                     id='localStoragePlanImage' 
//                                     onClick={() => loadFromLocalStorage()}
//                                   />
//                                 </div>
//                               </td>
//                             </tr>
//                           </tbody>
//                         </table>
//                       </div>
//                     </div>
//                     <div id='featuredPlan'>
//                       <table>
//                         <tbody>
//                           <tr>
//                             <td style={{ textAlign: 'center', width: '300px'}}>
//                               <button 
//                                 id='loadFeaturedPlanBtn'
//                                 className='largeButton'
//                                 onClick={() => loadExamplePlan()}
//                               >
//                                 Load Example Plan
//                               </button>
//                               <br /><br />
//                               or
//                               <br />
//                               <button onClick={() => closeAllModals()} className='largeButton'>Start New Plan</button>
//                             </td>
//                             <td>
//                               <div><img id='featuredPlanImage' onClick={() => loadExamplePlan()} /></div>
//                             </td>
//                           </tr>
//                         </tbody>
//                       </table>
//                     </div>
//                   </div>
//                 </div>

//               </div>
//             </div>
//           </Dialog.Content>
//         {/* </Dialog.Portal> */}
//       </Dialog.Root>

//       {/* <div 
//         id='modalAbout' 
//         // className='modal' 
//         ref={setContainerAboutModal}
//       >
//         <Text>HEY HEY HEY</Text>
//       </div> */}

//     </>
//   )
// }

// export default DialogModals
// ==============================================================

/* */

// ==============================================================
// ** PAPER.JS
const draw1 = () => {
  let myPath = new paper.Path()

  paper.view.onMouseDown = (event: any) => {
    // @ts-expect-error
    myPath.strokeColor = 'white'
    myPath.strokeWidth = 3
  }

  paper.view.onMouseDrag = (event: any) => {
    myPath.add(event.point)
  }

  // @ts-expect-error
  paper.view.draw()
}

const PaperCanvas = (props: any) => {
  
  const planCanvasRef = useRef(null)
  
  useEffect(() => {
    const planCanvas = planCanvasRef.current
    // paper.install(window)
    paper.setup(planCanvas)
    paper.settings.hitTolerance = 3
    draw1()
  }, [])
  
  return (
    <canvas 
      ref={planCanvasRef} 
      {...props} 
      id='planCanvas' 
      resize='true'
      style={{
        height: '100%',
        width: '100%',
      }}
    />
  )
}
// ** END: PAPER.JS
// ==============================================================

/* */

// ==============================================================
// ** 🟣 TYPES
// ==============================================================

type TThreedItem = { 
  title: string, 
  license: string, 
  author: string,
  threedLink: string,
  size?: TThreedItemSize,
  scale?: TThreedItemScale,
  pivot?: number,
  useMask?: boolean,
}
type TThreedItemSize = {
  x: number,
  y: number,
  z: number,
}
type TThreedItemScale = {
  x: number,
  y: number,
  z: number,
}
// ==============================================================

/* */

// ==============================================================
// ** 🟣 FUNCTIONS: THREED HOME DESIGN
// ==============================================================

function camelCaseToSentence(e: string) {
  e = e.replace(/([A-Z])/g, " $1")
  e = e.replace(/_/g, " ")
  e = e.replace(/\b\w/g, function (e) {
    return e.toUpperCase()
  })
  e = e.charAt(0).toUpperCase() + e.slice(1)
  return e
}

function validatePlusOrMinusNumber(element: any, numberT: any) {
  console.debug('validatePlusOrMinusNumber', element, numberT, '[MM] Testing')
  var regexOh = /^[-]?[0-9]*\.?[0-9]+$/
  element.value && null !== element.value.match(regexOh)
    ? ((element.style.backgroundColor = "#4e4e4e"), numberT(element.value), element.blur())
    : ((element.style.backgroundColor = "#ff8888"), element.focus())
}

function openTab(tab: string = 'tab1') {
  console.debug('openTab(tab)')
}
function handleSaveEditsLocalStorageOption() {
  console.debug('handleSaveEditsLocalStorageOption()')
}
function loadFromLocalStorage() {
  console.debug('loadFromLocalStorage()')
}
function loadExamplePlan() {
  console.debug('loadExamplePlan()')
}
function closeAllModals() {
  console.debug('closeAllModals()')
}

/* */

// ==============================================================
// ** VIEWS (COMPONENTS)

// ** VIEW: PROPERTIES (of a threed object, or other dom element)
const ViewProperties = (props: any) => {
  console.debug('PropertiesView loading...')

  return (
    <>
    <div 
      id='propertiesView' 
      style={{ 
        height: '100%',
        padding: '6px',
        // paddingLeft: '10px',
        // border: '1px solid orange',
      }}
    >
      <div 
        id='threed3DModelPropertiesView' 
        // style={{ display: 'none' }}
      >
        <h3>Model Properties</h3>
        <table 
          className='propertiesTable' 
          // style={{ minWidth: '290px', minHeight: '290px' }}
        >
          <tbody>
            <tr>
              <td>
                <div 
                  // onMouseDown={(event) => beginDrag(event, props.t.title)} 
                  className='disableSelection'
                  style={{ textAlign: 'center' }}
                >
                  <img
                    id='model3dLargeThumb'
                    className='disableSelection' 
                    style={{ pointerEvents: 'none' }} 
                    src='/images/thumb3dview.png'
                  />
                </div>
              </td>
            </tr>
            <tr>
              <td>Name</td>
              <td><span id='model3dName'></span></td>
            </tr>
            <tr>
              <td>Author</td>
              <td><span id='model3dAuthor'></span></td>
            </tr>
            <tr>
              <td>License</td>
              <td><span id='model3dLicense'></span></td>
            </tr>
            <tr>
              <td>Link</td>
              <td><span id='model3dLink'></span></td>
            </tr>
            <tr>
              <td>
                <button className='moreInfoBtn' 
                  onClick={(event) => showModel3dView(event)}
                >
                  View
                </button>
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div 
        id='threedPropertiesView'
        style={{ display: 'none' }}
      >
        <h3>Threed Properties</h3>
        <table className='propertiesTable' style={{ minWidth: '290px' }}>
                      <tbody>
          <tr>
            <td>Id</td>
            <td><span id='objectId'></span></td>
          </tr>
          <tr>
            <td>Name</td>
            <td><span id='objectName'></span></td>
          </tr>
          <tr>
            <td>X</td>
            <td>
              <input type='text' id='threedXProp'
                style={{
                  // 'width: 80px border: 1px solid #2a2a2a font-size: 14px color: white font-family: 'Courier New', Courier, monospace'
                }}
                className='editable' 
                // onChange={() => validatePlusOrMinusNumber(this, updateThreedPosX)}
                maxLength={8} />
              cm
            </td>
          </tr>
          <tr>
            <td>Y</td>
            <td>
              <input type='text' id='threedYProp'
                style={{
                  // 'width: 80px border: 1px solid #2a2a2a font-size: 14px color: white font-family: 'Courier New', Courier, monospace'
                }}
                className='editable' 
                // onChange={() => validatePlusOrMinusNumber(this, updateThreedPosY)}
                maxLength={8} 
              />
              cm
            </td>
          </tr>
          <tr>
            <td>Z</td>
            <td>
              <input type='text' id='threedZProp'
                style={{
                  // 'width: 80px border: 1px solid #2a2a2a font-size: 14px color: white font-family: 'Courier New', Courier, monospace'
                }}
                className='editable' 
                // onChange={() => validatePlusOrMinusNumber(this, updateThreedPosZ)}
                maxLength={8} 
              />
              cm
            </td>
          </tr>
          <tr>
            <td>Width</td>
            <td>
              <input type='text' id='threedWidthProp'
                style={{
                  // 'width: 80px border: 1px solid #2a2a2a font-size: 14px color: white font-family: 'Courier New', Courier, monospace'
                }}
                className='editable' 
                // onChange={() => validatePlusNumber(this, updateThreedWidth)} 
                maxLength={8} 
              />
              cm
              <input type='checkbox' id='flipX' 
                // onChange={() => flipX(this.checked)} 
              />
              Flip X
            </td>
          </tr>
          <tr>
            <td>Height</td>
            <td><input type='text' id='threedHeightProp'
                style={{
                  // 'width: 80px border: 1px solid #2a2a2a font-size: 14px color: white font-family: 'Courier New', Courier, monospace'
                }}
                className='editable' 
                // onChange={() => validatePlusOrMinusNumber(this, updateThreedHeight)}
                maxLength={8} /> cm</td>
          </tr>
          <tr>
            <td>Depth</td>
            <td>
              <input type='text' 
                id='threedDepthProp'
                style={{
                  // 'width: 80px border: 1px solid #2a2a2a font-size: 14px color: white font-family: 'Courier New', Courier, monospace'
                }}
                className='editable' 
                // onChange={() => validatePlusNumber(this, updateThreedDepth)} 
                maxLength={8} 
              />
              cm
              <input type='checkbox' 
                id='flipZ' 
                // onChange={() => flipZ(this.checked)} 
              />
              Flip Z
            </td>
          </tr>
          <tr>
            <td>Angle</td>
            <td><span id='threedAngleProp'></span>°</td>
          </tr>
          <tr>
            <td>Level</td>
            <td><span id='threedLevelProp'></span></td>
          </tr>
          <tr>
            <td>3D Model</td>
            <td>
              <button 
                className='moreInfoBtn' 
                // onClick={() => showModel3dView()}
              >
                View
              </button>
            </td>
          </tr>
                      </tbody>
        </table>
      </div>
      <div id='defaultsPropertiesView' style={{ display: 'none' }}>
        <h3>Default Settings</h3>
        <table className='propertiesTable' style={{ minWidth: '290px' }}>
                      <tbody>
          <tr>
            <td>Compass Heading</td>
            <td>
              <input type='range' id='compassHdg' name='compassHdg' min='0' max='360' step='1' defaultValue='0'
                // onInput={() => rotateCompass(this.value)} 
                // onChange={() => rotateCompass(this.value)} 
              />
              <span id='compassHdgLbl'>0°</span>
            </td>
          </tr>
                      </tbody>
        </table>
      </div>
      <div id='wallDefaultsPropertiesView' style={{ display: 'none' }}>
        <h3>Default Wall Settings</h3>
        <table className='propertiesTable' style={{ minWidth: '290px' }}>
                      <tbody>
          <tr>
            <td width='70'>Wall Height</td>
            <td><input type='text' id='defaultWallHeightProp'
                style={{
                  // 'width: 80px border: 1px solid #2a2a2a font-size: 14px color: white font-family: 'Courier New', Courier, monospace'
                }}
                className='editable' 
                // onChange={() => validatePlusNumber(this, updateDefaultWallHeight)}
                maxLength={8} />
              cm</td>
          </tr>
          <tr>
            <td>Wall Thickness</td>
            <td><input type='text' id='defaultWallThicknessProp'
                style={{
                  // 'width: 80px border: 1px solid #2a2a2a font-size: 14px color: white font-family: 'Courier New', Courier, monospace'
                }}
                className='editable' 
                // onChange={() => validatePlusNumber(this, updateDefaultWallThickness)}
                maxLength={8} />
              cm</td>
          </tr>
                      </tbody>
        </table>
      </div>
      <div id='floorDefaultsPropertiesView' style={{ display: 'none' }}>
        <h3>Default Floor Settings</h3>
        <table className='propertiesTable' style={{ minWidth: '290px' }}>
                      <tbody>
          <tr>
            <td>Floor Thickness</td>
            <td><input type='text' id='defaultFloorThicknessProp'
                style={{
                  // 'width: 80px border: 1px solid #2a2a2a font-size: 14px color: white font-family: 'Courier New', Courier, monospace'
                }}
                className='editable' 
                // onChange={() => validatePlusNumber(this, updateDefaultFloorThickness)}
                maxLength={8} /> cm</td>
          </tr>
                      </tbody>
        </table>
      </div>
      <div id='roofDefaultsPropertiesView' style={{ display: 'none' }}>
        <h3>Default Roof Settings</h3>
        <table className='propertiesTable' style={{ minWidth: '290px' }}>
                      <tbody>
          <tr>
            <td>Roof Thickness</td>
            <td><input type='text' id='defaultRoofThicknessProp'
                style={{
                  // 'width: 80px border: 1px solid #2a2a2a font-size: 14px color: white font-family: 'Courier New', Courier, monospace'
                }}
                className='editable' 
                // onChange={() => validatePlusNumber(this, updateDefaultRoofThickness)}
                maxLength={8} />
              cm</td>
          </tr>
          <tr>
            <td>Rise</td>
            <td><input type='text' id='defaultRoofRiseProp'
                style={{
                  // 'width: 80px border: 1px solid #2a2a2a font-size: 14px color: white font-family: 'Courier New', Courier, monospace'
                }}
                className='editable' 
                // onChange={() => validatePlusNumber(this, updateDefaultRoofRise)}
                maxLength={8} />
              cm</td>
          </tr>
          <tr>
            <td>Base Offset</td>
            <td><input type='text' id='defaultRoofStartHeightProp'
                style={{
                  // 'width: 80px border: 1px solid #2a2a2a font-size: 14px color: white font-family: 'Courier New', Courier, monospace'
                }}
                className='editable' 
                // onChange={() => validatePlusOrMinusNumber(this, updateDefaultRoofStartHeight)}
                maxLength={8} />
              cm</td>
          </tr>
          <tr>
            <td>Run</td>
            <td><input type='text' id='defaultRoofWidthProp'
                style={{
                  // 'width: 80px border: 1px solid #2a2a2a font-size: 14px color: white font-family: 'Courier New', Courier, monospace'
                }}
                className='editable' 
                // onChange={() => validatePlusNumber(this, updateDefaultRoofWidth)}
                maxLength={8} />
              cm</td>
          </tr>
          <tr>
            <td>Rafter Length</td>
            <td><span id='defaultRafterLengthProp'></span> cm</td>
          </tr>
          <tr>
            <td>Roof Pitch</td>
            <td><span id='defaultRoofPitchProp'></span>°</td>
          </tr>
                      </tbody>
        </table>
      </div>
      <div id='dimensionDefaultsPropertiesView' style={{ display: 'none' }}>
        <h3>Default Dimension Settings</h3>
      </div>
      <div id='textDefaultsPropertiesView' style={{ display: 'none' }}>
        <h3>Default Text Settings</h3>
      </div>

      <div 
        id='planViewPropertiesView' 
        style={{ display: 'none' }}
      >
        <h3>Background Template</h3>
        <table className='propertiesTable' style={{ minWidth: '290px' }}>
                      <tbody>
          <tr>
            <td width='70'>File</td>
            <td>
              <input type='file' 
                id='backgroundImageFile' 
                name='backgroundImageFile'
                // onChange={() => loadBackgroundImage(event)} 
              />
            </td>
          </tr>
          <tr>
            <td>Opacity</td>
            <td>
              <input type='range' id='bgTemplateOpacity' name='bgTemplateOpacity' min='0' max='1.0' step='.01'
                defaultValue='0.33' 
                // onInput={() => setBgTemplateOpacity(this.value)}
                // onChange={() => setBgTemplateOpacity(this.value)} 
              />
            </td>
          </tr>
          <tr>
            <td>Flip Horizontal</td>
            <td>
              <input type='checkbox' id='bgTplFlipX' 
                // onChange={() => flipBackgroundTemplateX(this.checked)} 
              />
            </td>
          </tr>
          <tr>
            <td>Flip Vertical</td>
            <td>
              <input type='checkbox' id='bgTplFlipZ' 
                // onChange={() => flipBackgroundTemplateZ(this.checked)} 
              />
            </td>
          </tr>
          <tr>
            <td width='60'></td>
            <td>
              <button id='resizeBackgroundImageBtn' 
                // onClick={() => enableResizeBackgroundTemplate()}
                className='moreInfoBtn'
              >
                Resize
              </button>
            </td>
          </tr>
          <tr>
            <td width='60'></td>
            <td>
              <button id='deleteBackgroundImageBtn' 
                // onClick={() => deleteBackgroundImage()}
                className='moreInfoBtn'
              >
                Delete
              </button>
            </td>
          </tr>
                      </tbody>
        </table>
      </div>
      <div id='3dViewPropertiesView' style={{ display: 'none' }}>
        <h3>3d View Properties</h3>
        <table className='propertiesTable' style={{ minWidth: '290px' }}>
                      <tbody>
          <tr>
            <td width='70'>Wall Color</td>
            <td>
              <input type='hidden' id='wallDiffuse' value='rgba(255,255,255,0.5)' />
            </td>
          </tr>
          <tr>
            <td width='70'>Wall Specular</td>
            <td>
              <input type='hidden' id='wallSpecular' value='#00ff00' />
            </td>
          </tr>
          {/* <tr>
            <td width='70'>Wall Emissive</td>
            <td>
              <input type='hidden' id='wallEmissive' value='#ffffff' />
            </td>
          </tr> */}
          <tr>
            <td width='70'>Floor Color</td>
            <td>
              <input type='hidden' id='floorDiffuse' value='rgba(15,15,15,0.5)' />
            </td>
          </tr>
          <tr>
            <td width='70'>Floor Specular</td>
            <td>
              <input type='hidden' id='floorSpecular' value='#00ffff' />
            </td>
          </tr>
          <tr>
            <td width='70'>Roof Color</td>
            <td>
              <input type='hidden' id='roofDiffuse' value='rgba(255,255,255,0.5)' />
            </td>
          </tr>
          <tr>
            <td width='70'>Roof Specular</td>
            <td>
              <input type='hidden' id='roofSpecular' value='#ff0000' />
            </td>
          </tr>
          <tr>
            <td>Ground Color</td>
            <td>
              <input type='hidden' id='groundDiffuse' value='rgba(03,141,221,1.0)' />
            </td>
          </tr>
          <tr>
            <td>Ground Specular</td>
            <td>
              <input type='hidden' id='groundSpecular' value='#f2ff9c' />
            </td>
          </tr>

          {/* <tr>
            <td width='70'>Depth Write</td>
            <td>
              <input type='checkbox' id='depthWriteMode' onChange={() => setDepthWriteMode(this.checked)} />
            </td>
          </tr>
          <tr>
            <td width='70'>Sort Objects</td>
            <td>
              <input type='checkbox' id='sortObjectsMode' onChange={() => setSortObjectsMode(this.checked)} />
            </td>
          </tr>
          <tr>
            <td>Sun Azimuth</td>
            <td>
              <input type='range' id='sunAzimuth' name='sunAzimuth' min='0' max='1.0' step='.01' value='0.33'
                onInput={() => setSunAzimuth(this.value)} onChange={() => setSunAzimuth(this.value)} />
            </td>
          </tr>
          <tr>
            <td>Sun Incline</td>
            <td>
              <input type='range' id='sunIncline' name='sunIncline' min='0' max='1.0' step='.01' value='0.0'
                onInput={() => setSunIncline(this.value)} onChange={() => setSunIncline(this.value)} />
            </td>
          </tr>
          <tr>
            <td>Ambient Intensity</td>
            <td>
              <input type='range' id='ambientLightBrightness' name='ambientLightBrightness' min='0.0'
                max='1.0' step='0.1' onInput={() => adjustAmbientLightBrightness(this.value)}
                onChange={() => adjustAmbientLightBrightness(this.value)} />
            </td>
          </tr>
          <tr>
            <td>Directional Intensity</td>
            <td>
              <input type='range' id='dirLightBrightness' name='dirLightBrightness' min='0.0' max='1.0'
                step='0.1' onInput={() => adjustDirLightBrightness(this.value)}
                onChange={() => adjustDirLightBrightness(this.value)} />
            </td>
          </tr>
          <tr>
            <td>Hemisphere Intensity</td>
            <td>
              <input type='range' id='hemiLightBrightness' name='hemiLightBrightness' min='0.0' max='1.0'
                step='0.1' onInput={() => adjustHemiLightBrightness(this.value)}
                onChange={() => adjustHemiLightBrightness(this.value)} />
            </td>
          </tr> */}



                      </tbody>
        </table>
      </div>
      <div id='wallPropertiesView' style={{ display: 'none' }}>
        <h3>Wall Properties</h3>
        <table className='propertiesTable' style={{ minWidth: '290px' }}>
                      <tbody>
          <tr>
            <td width='70'>Id</td>
            <td>
              <input type='hidden' id='wallIdHidden' />
              <span id='wallIdProp'></span>
            </td>
          </tr>
          {/* <tr>
            <td>Height</td>
            <td><input type='text' id='wallHeightProp'
                style={{
                  // 'width: 80px border: 1px solid #2a2a2a font-size: 14px color: white font-family: 'Courier New', Courier, monospace'
                }}
                className='editable' onChange={() => validatePlusNumber(this, updateWallHeight)} maxLength={8} /> cm
            </td>
          </tr>
          <tr>
            <td>Height Start</td>
            <td><input type='text' id='wallHeight0Prop'
                style={{
                  // 'width: 80px border: 1px solid #2a2a2a font-size: 14px color: white font-family: 'Courier New', Courier, monospace'
                }}
                className='editable' onChange={() => validatePlusNumber(this, updateWallHeight0)} maxLength={8} /> cm
            </td>
          </tr>
          <tr>
            <td>Height End</td>
            <td><input type='text' id='wallHeight1Prop'
                style={{
                  // 'width: 80px border: 1px solid #2a2a2a font-size: 14px color: white font-family: 'Courier New', Courier, monospace'
                }}
                className='editable' onChange={() => validatePlusNumber(this, updateWallHeight1)} maxLength={8} /> cm
            </td>
          </tr>
          <tr>
            <td>Thickness</td>
            <td><input type='text' id='wallThicknessProp'
                style={{
                  // 'width: 80px border: 1px solid #2a2a2a font-size: 14px color: white font-family: 'Courier New', Courier, monospace'
                }}
                className='editable' onChange={() => validatePlusNumber(this, updateWallThickness)} maxLength={8} />
              cm</td>
          </tr> */}
          <tr>
            <td>Level</td>
            <td><span id='wallLevelProp'></span></td>
          </tr>
                      </tbody>
        </table>
      </div>
      <div id='roofPropertiesView' style={{ display: 'none' }}>
        <h3>Roof Properties</h3>
        <table className='propertiesTable' style={{ minWidth: '290px' }}>
                      <tbody>
          <tr>
            <td width='70'>Id</td>
            <td>
              <input type='hidden' id='roofIdHidden' />
              <span id='roofIdProp'></span>
            </td>
          </tr>
          {/* <tr>
            <td>Thickness</td>
            <td><input type='text' id='roofThicknessProp'
                style={{
                  // 'width: 80px border: 1px solid #2a2a2a font-size: 14px color: white font-family: 'Courier New', Courier, monospace'
                }}
                className='editable' onChange={() => validatePlusNumber(this, updateRoofThickness)} maxLength={8} />
              cm</td>
          </tr>
          <tr>
            <td>Rise</td>
            <td><input type='text' id='roofRiseProp'
                style={{
                  // 'width: 80px border: 1px solid #2a2a2a font-size: 14px color: white font-family: 'Courier New', Courier, monospace'
                }}
                className='editable' onChange={() => validatePlusNumber(this, updateRoofRise)} maxLength={8} />
              cm</td>
          </tr>
          <tr>
            <td>Base Offset</td>
            <td><input type='text' id='roofStartHeightProp'
                style={{
                  // 'width: 80px border: 1px solid #2a2a2a font-size: 14px color: white font-family: 'Courier New', Courier, monospace'
                }}
                className='editable' onChange={() => validatePlusOrMinusNumber(this, updateRoofStartHeight)}
                maxLength={8} />
              cm</td>
          </tr>
          <tr>
            <td>Run</td>
            <td><input type='text' id='roofWidthProp'
                style={{
                  // 'width: 80px border: 1px solid #2a2a2a font-size: 14px color: white font-family: 'Courier New', Courier, monospace'
                }}
                className='editable' onChange={() => validatePlusNumber(this, updateRoofWidth)} maxLength={8} />
              cm</td>
          </tr> */}
          <tr>
            <td>Rafter Length</td>
            <td><span id='rafterLengthProp'></span> cm</td>
          </tr>
          <tr>
            <td>Roof Pitch</td>
            <td><span id='roofPitchProp'></span>°</td>
          </tr>
          <tr>
            <td>Level</td>
            <td><span id='roofLevelProp'></span></td>
          </tr>
                      </tbody>
        </table>
      </div>
      <div id='floorPropertiesView' style={{ display: 'none' }}>
        <h3>Floor Properties</h3>
        <table className='propertiesTable' style={{ minWidth: '290px' }}>
                      <tbody>
          <tr>
            <td width='70'>Id</td>
            <td><span id='floorIdProp'></span></td>
          </tr>
          <tr>
            <td>Area</td>
            <td><span id='floorAreaProp'></span></td>
          </tr>
          <tr>
            <td>Thickness</td>
            <td><span id='floorThicknessProp'></span></td>
          </tr>
          <tr>
            <td>Level</td>
            <td><span id='floorLevelProp'></span></td>
          </tr>
                      </tbody>
        </table>
      </div>
      <div id='dimensionPropertiesView' style={{ display: 'none' }}>
        <h3>Dimension Properties</h3>
        <table className='propertiesTable' style={{ minWidth: '290px' }}>
                      <tbody>
          <tr>
            <td width='70'>Id</td>
            <td><span id='dimensionIdProp'></span></td>
          </tr>
          <tr>
            <td>Length</td>
            <td><span id='dimensionLengthProp'></span></td>
          </tr>
          <tr>
            <td>Adjacent</td>
            <td><span id='dimensionAdjacentProp'></span></td>
          </tr>
          <tr>
            <td>Level</td>
            <td><span id='dimensionLevelProp'></span></td>
          </tr>
                      </tbody>
        </table>
      </div>
      <div id='textPropertiesView' style={{ display: 'none' }}>
        <h3>Text Annotation Properties</h3>
        <table className='propertiesTable' style={{ minWidth: '290px' }}>
                      <tbody>
          <tr>
            <td width='70'>Id</td>
            <td><span id='textIdProp'></span></td>
          </tr>
          {/* <tr>
            <td>Text</td>
            <td><input type='text' id='textValueProp'
                style={{
                  // 'width: 80px border: 1px solid #2a2a2a font-size: 14px color: white font-family: 'Courier New', Courier, monospace'
                }}
                className='editable' onKeyUp={() => validateText(event, this, updateTextValue)} maxLength={100} />
            </td>
          </tr>
          <tr>
            <td>X</td>
            <td><input type='text' id='textXProp'
                style={{
                  // 'width: 80px border: 1px solid #2a2a2a font-size: 14px color: white font-family: 'Courier New', Courier, monospace'
                }}
                className='editable' onChange={() => validatePlusOrMinusNumber(this, updateTextX)} maxLength={8} />
            </td>
          </tr>
          <tr>
            <td>Y</td>
            <td><input type='text' id='textYProp'
                style={{
                  // 'width: 80px border: 1px solid #2a2a2a font-size: 14px color: white font-family: 'Courier New', Courier, monospace'
                }}
                className='editable' onChange={() => validatePlusOrMinusNumber(this, updateTextY)} maxLength={8} />
            </td>
          </tr> */}
          <tr>
            <td>Level</td>
            <td><span id='textLevelProp'></span></td>
          </tr>
                      </tbody>
        </table>
        {/* <div>Type<span id='textDataTypeProp'></span></div> */}
        {/* <div><button id='deleteTextAnnotationBtn' onClick={() => deleteTextBtnClick()}>Delete</button></div> */}
      </div>
      <div id='levelPropertiesView' style={{ display: 'none' }}>
        <h3>Level Properties</h3>
        <table className='propertiesTable' style={{ minWidth: '290px' }}>
                      <tbody>
          <tr>
            <td width='70'>Id</td>
            <td><span id='levelIdProp'></span></td>
          </tr>
          <tr>
            <td>Name</td>
            <td><span id='levelNameProp'></span></td>
          </tr>
          <tr>
            <td>Height</td>
            <td>
              <input type='text' id='levelHeightProp'
                style={{
                  // 'width: 80px border: 1px solid #2a2a2a font-size: 14px color: white font-family: 'Courier New', Courier, monospace'
                }}
                className='editable' 
                // onChange={() => validatePlusOrMinusNumber(this, updateLevelHeight)}
                maxLength={8} 
              />
            </td>
          </tr>
                      </tbody>
        </table>
      </div>
      <div 
        id='groundPropertiesView' 
        style={{ display: 'none' }}
      >
        <h3>Ground Layer Properties</h3>
        <table className='propertiesTable' style={{ minWidth: '290px' }}>
                      <tbody>
          <tr>
            <td>Width</td>
            <td><input type='text' id='groundWidthProp'
                style={{
                  // 'width: 80px border: 1px solid #2a2a2a font-size: 14px color: white font-family: 'Courier New', Courier, monospace'
                }}
                className='editable' 
                // onChange={() => validatePlusNumber(this, updateGroundWidth)} 
                maxLength={8} 
                />
              cm</td>
          </tr>
          <tr>
            <td>Length</td>
            <td><input type='text' id='groundLengthProp'
                style={{
                  // 'width: 80px border: 1px solid #2a2a2a font-size: 14px color: white font-family: 'Courier New', Courier, monospace'
                }}
                className='editable' 
                // onChange={() => validatePlusNumber(this, updateGroundLength)} 
                maxLength={8} 
                />
              cm</td>
          </tr>
                      </tbody>
        </table>
      </div>
    </div>
    </>
  )
}

// ** VIEW: MODALS (window dialogs, show|hide)
const ViewModals = (props: any) => {
  
  // ** MODALS
  const [showModalAbout, setShowModalAbout] = useState(false)
  const [showModal3dModel, setShowModal3dModel] = useState(false)
  const [showModalShare, setShowModalShare] = useState(false)
  const [showModalLoading, setShowModalLoading] = useState(false)

  function handleShowModalAbout() {
    console.debug('handleShowModalAbout()')
    setShowModalAbout(true)
    console.debug('showModalAbout', showModalAbout)
    // $('.supportEmail').text('support@companyjuice.com'),
    //   $('#showModalAbout').show(),
    //   hideMouseIndicators()
  }
  function handleShowModal3dModel() {
    console.debug('handleShowModal3dModel()')
    setShowModal3dModel(true)
    console.debug('showModal3dModel', showModal3dModel)
  }
  function handleShowModalShare() {
    console.debug('handleShowModalShare()')
    setShowModalShare(true)
    console.debug('showModalShare', showModalShare)
  }
  function handleShowModalLoading() {
    console.debug('handleShowModalLoading()')
    setShowModalLoading(true)
    console.debug('showModalLoading', showModalLoading)
  }
  // ** END MODALS

  return (
    
    <Grid>
    {/* MODALS: OPTIONS */}
    <Flex 
      id='modals'
      direction='row'
      align='center'
      justify='center'
      // style={{
      //   position: 'absolute',
      //   bottom: '32px',
      // }}
    >
      { showModalAbout && (
        <div 
          id='modalAbout' 
          // className='modal'
        >
          <div className='modal-content'>
            <div className='modal-header'>
              <span 
                className='close'
                onClick={() => setShowModalAbout(false)}
              >
                -X-
              </span>
              <h2>ThreeD Home Design</h2>
            </div>
            <div className='modal-body'>

              <div className='tab'>
                <button 
                  className='tablinks active' 
                  // onClick={() => openTab('tab1')} 
                  id='tab1'
                >
                  Intro
                </button>
              </div>

              <div id='tab1Content' className='tabcontent' style={{display: 'block'}}>
                <h3>ThreeD Home Design Introduction</h3>
                <p>Plan + Share Ideas for your Home Design in 2D + 3D</p>
                <div style={{padding: '12px'}}>
                  <div>
                    Save Plan Edits to local web storage? 
                    <input 
                      type='checkbox' 
                      id='saveEditsToLocalStorage' 
                      // onChange={() => handleSaveEditsLocalStorageOption()}
                    />
                    <span className='tooltip'>
                      {/* <img src='media/info.png' className='tooltip' /> */}
                      <span className='tooltiptext'>
                        <div>
                          Any edits you make to the plan will be saved to your browsers local web storage so that you don't lose any work between saves.<br/>The plan may be removed if you clean your browsers cookies and history, so to save your work long term, use the 'File-Save' option in the main <a href='http://threedgarden.com'>ThreeD Home Design</a> toolbar.<br/>
                          More info about 
                          <a href='https://www.w3schools.com/HTML/html5_webstorage.asp' target='_blank' rel='noreferrer'>
                            Local Web Storage
                          </a>.
                        </div>
                      </span>
                    </span>
                    <div id='localStoragePlanDiv'>
                      <table>
                        <tbody>
                          <tr>
                            <td style={{ textAlign: 'center'}}>
                              Most Recent Edit saved in Local Web Storage.
                              <br />
                              <button 
                                id='loadLocalStoragePlanBtn'
                                // onClick={() => loadFromLocalStorage()}
                              >
                                Load Plan
                              </button>
                              <br />
                              <br />
                              <span id='localStoragePlanLastSavedDate'></span>
                            </td>
                            <td>
                              <div>
                                <img 
                                  id='localStoragePlanImage' 
                                  // onClick={() => loadFromLocalStorage()}
                                />
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div id='featuredPlan'>
                    <table>
                      <tbody>
                        <tr>
                          <td style={{ textAlign: 'center', width: '300px'}}>
                            <button 
                              id='loadFeaturedPlanBtn'
                              className='largeButton'
                              // onClick={() => loadExamplePlan()}
                            >
                              Load Example Plan
                            </button>
                            <br /><br />
                            or
                            <br />
                            <button 
                              // onClick={() => closeAllModals()} 
                              className='largeButton'
                            >
                              Start New Plan
                            </button>
                          </td>
                          <td>
                            <div>
                              <img id='featuredPlanImage' 
                                // onClick={() => loadExamplePlan()} 
                              />
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>
            <div className='modal-footer'>
              <h3><a href='https://threedgarden.com'>Modal: Footer</a></h3>
            </div>
          </div>
        </div>
      )}
      { showModal3dModel && (
        <div 
          id='modal3dModel' 
          // className='modal'
        >
          <div className='modal-content'>
            <div className='modal-header'>
              <span 
                className='close'
                onClick={() => setShowModal3dModel(false)}
              >
                -X-
              </span>
              <h2>ThreeD Home Design</h2>
            </div>
            <div className='modal-body'>
              <div id='model3dView'>
                <canvas id='model3dViewCanvas'></canvas>
              </div>
              <div id='modalModelDescription'>
                <h3>3d Model Properties</h3>
                <table className='propertiesTable'>
                  <tbody>
                    <tr>
                      <td width='70'>Name</td>
                      <td><span id='model3dNameModal'></span></td>
                    </tr>
                    <tr>
                      <td>Author</td>
                      <td><span id='model3dAuthorModal'></span></td>
                    </tr>
                    <tr>
                      <td>License</td>
                      <td><span id='model3dLicenseModal'></span></td>
                    </tr>
                    <tr>
                      <td>OBJ&nbspFile&nbspComments</td>
                    </tr>
                  </tbody>
                </table>
                <textarea id='modalModel3dObjHeader'></textarea>

              </div>
            </div>
            <div className='modal-footer'>
              <h3><a href='https://threedgarden.com'>Modal: Footer</a></h3>
            </div>
          </div>
        </div>
      )}
      { showModalShare && (
        <div 
          id='modalShare' 
          // className='modal-small'
        >
          <div className='modal-small-content'>
            <div className='modal-small-header'>
              <span 
                className='close'
                onClick={() => setShowModalShare(false)}
              >
                -X-
              </span>
              <h2>ThreeD Home Design</h2>
            </div>
            <div className='modal-small-body'>
              <h3>Share Plan</h3>
              <button 
                id='getShareLinkBtn' 
                className='mediumButton' 
                // onClick={() => generateShareLink()}
              >
                Generate Share Link
              </button>
              {/* <div style='margin:10px 0px 10px 0px'>
                <div style='padding-top:6px'>
                  <label for='shareLinkUrl'>Editable Copy</label><br />
                  <input type='text' id='shareLinkUrl' placeholder='Press 'Generate Share Link' button'
                    style='width: 580px background-color: #4e4e4e border: 1px solid #2a2a2a font-size: 14px color: white font-family: 'Courier New', Courier, monospace padding: 4px 24px 4px 24px pointer-events: none' />&nbsp
                  <button id='copyShareLinkBtn' className='smallButton' onClick={() => copyShareLink()}>Copy</button>
                </div>

                <div style='padding-top:6px'>
                  <label for='shareLinkUrl3d'>Read Only 3d View</label><br />
                  <input type='text' id='shareLinkUrl3d' placeholder='Press 'Generate Share Link' button'
                    style='width: 580px background-color: #4e4e4e border: 1px solid #2a2a2a font-size: 14px color: white font-family: 'Courier New', Courier, monospace padding: 4px 24px 4px 24px pointer-events: none' />&nbsp
                  <button id='copyShareLinkBtn' className='smallButton' onClick={() => copyShareLink3d()}>Copy</button>
                </div>

                <div style='padding-top:6px'>
                  <label for='shareLinkUrlPlan'>Read Only Plan View</label><br />
                  <input type='text' id='shareLinkUrlPlan' placeholder='Press 'Generate Share Link' button'
                    style='width: 580px background-color: #4e4e4e border: 1px solid #2a2a2a font-size: 14px color: white font-family: 'Courier New', Courier, monospace padding: 4px 24px 4px 24px pointer-events: none' />&nbsp
                  <button id='copyShareLinkBtn' className='smallButton' onClick={() => copyShareLinkPlan()}>Copy</button>
                </div>
              </div> */}
            </div>
            <div className='modal-small-footer'>
              <h3><a href='https://threedgarden.com'>Modal: Footer</a></h3>
            </div>
          </div>
        </div>
      )}
      { showModalLoading && (
        <div 
          id='modalLoading' 
          // className='modal-small'
        >
          <div className='modal-small-content'>
            <div className='modal-small-header'>
              <span 
                className='close'
                onClick={() => setShowModalLoading(false)}
              >
                -X-
              </span>
              <h2>ThreeD Home Design</h2>
            </div>
            <div className='modal-small-body'>
              <h3>Loading Model Progress</h3>
              <textarea id='modalLoadingDataInfo'></textarea>
            </div>
            <div className='modal-small-footer'>
              <h3><a href='https://threedgarden.com'>Modal: Footer</a></h3>
            </div>
          </div>
        </div>
      )}

      
      {/* <ul> */}
        {/* <li className='brandImg'>
          <a onClick={() => showModalAbout()} 
            style={{padding: '0px', margin: '0px'}}
          >
            <img
              src='favicon/favicon.png' 
              width='48px' 
              height='48px' 
              title='ThreeD Home Design' 
              alt='ThreeD Home Design' 
            />
          </a>
        </li> */}
        {/* <li className='brand'>
          <a onClick={() => showModalAbout()} 
            style={{textAlign: 'center', paddingTop: '15px', paddingLeft: '18px', paddingRight: '24px', paddingBottom: '15px', textDecoration: 'none', fontSize: '21px',}}
          >
            ThreeD Home Design
          </a>
        </li> */}
        
        
        {/* 
        <li className='dropdown'>
          <a 
            href='#javascript:void(0)' 
            className='dropbtn'
          >
            File
          </a>
          <div className='dropdown-content'>
            <a onClick={() => setNewPlan()}>New</a>
            <a onClick={() => loadExamplePlan()}>Load Demo</a>
            <a id='loadBtn' onClick={() => document.getElementById('file').click()}>Load</a>
            <input type='file' style={{ display: 'none' }} id='file' name='file' onChange={() => loadFileAsText(event)} />
            <a id='saveBtn' onClick={() => savePlan()}>Save</a>
            <a id='shareBtn' onClick={() => openShareDialog()}>Share</a>
            <a id='defaultsBtn' onClick={() => setPropertiesView('defaults')}>Defaults</a>
            <!--<a  id='groundPropertiesButton' onClick={() => setToolMode('ground')}>Ground Properties</a>-->
            <a id='fullscreenApp' onClick={() => openFullscreen('appBody')}>Fullscreen</a>
          </div>
        </li> */}
        {/* <li className='dropdown'>
          <a href='#javascript:void(0)' className='dropbtn'>Edit</a>
          <div className='dropdown-content'>
            <a id='undoBtn' onClick={() => doUndo()}>Undo</a>
            <a id='redoBtn' onClick={() => doRedo()}>Redo</a>
          </div>
        </li> */}
        {/* <li className='dropdown'>
          <a href='#javascript:void(0)' className='dropbtn'>Plan View</a>
          <div className='dropdown-content'>
            <a onClick={() => setPropertiesView('planView')}>Background Template</a>
            <a onClick={() => newLevel()}>Add Level</a>
            <a onClick={() => openFullscreen('planView')}>Fullscreen</a>
          </div>
        </li> */}
        {/* <li className='dropdown'>
          <a href='#javascript:void(0)' className='dropbtn'>3D View</a>
          <div className='dropdown-content'>
            <a onClick={() => setPropertiesView('3dView')}>Properties</a>
            <a onClick={() => openFullscreen('view3d')}>Fullscreen</a>
            <a onClick={() => exportToObj()}>Export As OBJ</a>
            <!--<a  id='createThumb' onClick={() => createThumbForHistory()}>Create Thumb</a>-->
          </div>
        </li> */}
        {/* <!--<li>
          <a  onClick={() => doLog()}>Log</a>
        </li>-->
        <!-- <li>
          <a onClick={() => showModalAbout()}>About</a>
        </li> --> */}
        {/* <li>
          <a id='pointerTool' onClick={() => setToolMode('pointer')} className='toolButton activeTool'
            title='Pointer Select' alt='Pointer Select'>
            <img src='media/pointericonWhite.png' height='42px'>
          </a>
        </li> */}
        {/* <!-- <li>
          <a onClick={() => setToolMode('hand')}>
            <img src='media/handicon.png' width='50px'>
          </a>
        </li> --> */}
        {/* <li>
          <a id='addWallTool' onClick={() => setToolMode('walls')} className='toolButton' title='Add Wall' alt='Add Wall'>
            <img src='media/newWallWhite2.png' height='42px'>
          </a>
        </li> */}
        {/* <li>
          <a id='addFloorTool' onClick={() => setToolMode('floor')} className='toolButton' title='Add Floor'
            alt='Add Floor'>
            <img src='media/newFloorWhite2.png' height='42px'>
          </a>
        </li> */}
        {/* <li>
          <a id='addRoofTool' onClick={() => setToolMode('roof')} className='toolButton' title='Add Roof' alt='Add Roof'>
            <img src='media/newRoofWhite2.png' height='42px'>
          </a>
        </li> */}
        {/* <li>
          <a id='addRulerTool' onClick={() => setToolMode('dimension')} className='toolButton' title='Add Dimension'
            alt='Add Dimension'>
            <img src='media/newRulerWhite2.png' height='42px'>
          </a>
        </li> */}
        {/* <li>
          <a id='addTextTool' onClick={() => setToolMode('text')} className='toolButton' title='Add Text Annotation'
            alt='Add Text Annotation'>
            <img src='media/newTextWhite.png' height='42px'>
          </a>
        </li> */}
      {/* </ul> */}
    </Flex>

    {/* MODALS: CONTAINERS */}
    <Flex>
      <div id='modal3dModel' className='modal'>
        <div className='modal-content'>
          <div className='modal-header'>
            <span className='close'>-X-</span>
            <img src='favicon/favicon.png' height='48px' 
              title='ThreeD Home Design' alt='ThreeD Home Design' />
            <h2>ThreeD Home Design</h2>
          </div>
          <div className='modal-body'>
            <div id='model3dView'>
              <canvas id='model3dViewCanvas'></canvas>
            </div>
            <div id='modalModelDescription'>
              <h3>3d Model Properties</h3>
              <table className='propertiesTable' style={{ width: '400px'}}>
                <tbody>
                  <tr>
                    <td width='70'>Name</td>
                    <td><span id='model3dNameModal'></span></td>
                  </tr>
                  <tr>
                    <td>Author</td>
                    <td><span id='model3dAuthorModal'></span></td>
                  </tr>
                  <tr>
                    <td>License</td>
                    <td><span id='model3dLicenseModal'></span></td>
                  </tr>
                  <tr>
                    <td>OBJ&nbspFile&nbspComments</td>
                  </tr>
                </tbody>
              </table>
              <textarea id='modalModel3dObjHeader'></textarea>

            </div>
          </div>
          <div className='modal-footer'>
            <h3><a href='http://threedgarden.com'>ThreeD Home Design</a></h3>
          </div>
        </div>
      </div>

      <div id='modalLoading' className='modal-small'>
        <div className='modal-small-content'>
          <div className='modal-small-header'>
            <img src='favicon/favicon.png' height='48px' 
              title='ThreeD Home Design' alt='ThreeD Home Design' />
            <h2>ThreeD Home Design</h2>
          </div>
          <div className='modal-small-body'>
            <h3>Loading Model Progress</h3>
            <textarea id='modalLoadingDataInfo'></textarea>
          </div>
          <div className='modal-small-footer'>
            <h3><a href='http://threedgarden.com'>ThreeD Home Design</a></h3>
          </div>
        </div>
      </div>

      <div id='modalShare' className='modal-small'>
        <div className='modal-small-content'>
          <div className='modal-small-header'>
            <span className='close'>-X-</span>
            <img src='favicon/favicon.png' height='48px' 
              title='ThreeD Home Design' alt='ThreeD Home Design' />
            <h2>ThreeD Home Design</h2>
          </div>
          <div className='modal-small-body'>
            <h3>Share Plan</h3>
            {/* <button id='getShareLinkBtn' className='mediumButton' onClick={() => generateShareLink()}>Generate Share
              Link</button>
            <div style='margin:10px 0px 10px 0px'>
              <div style='padding-top:6px'>
                <label for='shareLinkUrl'>Editable Copy</label><br />
                <input type='text' id='shareLinkUrl' placeholder='Press 'Generate Share Link' button'
                  style='width: 580px background-color: #4e4e4e border: 1px solid #2a2a2a font-size: 14px color: white font-family: 'Courier New', Courier, monospace padding: 4px 24px 4px 24px pointer-events: none' />&nbsp
                <button id='copyShareLinkBtn' className='smallButton' onClick={() => copyShareLink()}>Copy</button>
              </div>

              <div style='padding-top:6px'>
                <label for='shareLinkUrl3d'>Read Only 3d View</label><br />
                <input type='text' id='shareLinkUrl3d' placeholder='Press 'Generate Share Link' button'
                  style='width: 580px background-color: #4e4e4e border: 1px solid #2a2a2a font-size: 14px color: white font-family: 'Courier New', Courier, monospace padding: 4px 24px 4px 24px pointer-events: none' />&nbsp
                <button id='copyShareLinkBtn' className='smallButton' onClick={() => copyShareLink3d()}>Copy</button>
              </div>

              <div style='padding-top:6px'>
                <label for='shareLinkUrlPlan'>Read Only Plan View</label><br />
                <input type='text' id='shareLinkUrlPlan' placeholder='Press 'Generate Share Link' button'
                  style='width: 580px background-color: #4e4e4e border: 1px solid #2a2a2a font-size: 14px color: white font-family: 'Courier New', Courier, monospace padding: 4px 24px 4px 24px pointer-events: none' />&nbsp
                <button id='copyShareLinkBtn' className='smallButton' onClick={() => copyShareLinkPlan()}>Copy</button>
              </div>
            </div> */}
          </div>
          <div className='modal-small-footer'>
            <h3><a href='http://threedgarden.com'>ThreeD Home Design</a></h3>
          </div>
        </div>
      </div>
    </Flex>
  </Grid>
  )
}
// ==============================================================

/* */

// ==============================================================

function showModel3dView(event: any) {
  console.debug('showModel3dView', event)
  // var e = modalModel3dThreedId
  // e !== -1 &&
  //   (model3dObjectRef && model3dScene.remove(model3dObjectRef),
  //     new MTLLoader()
  //       .setCrossOrigin('anonymous')
  //       .setPath(objectsURL + "objects/")
  //       .load(e + ".mtl", function (t) {
  //         ; (t.baseUrl = objectsURL + "objects/"),
  //           t.preload(),
  //           new OBJLoader()
  //             .setMaterials(t)
  //             .setPath(objectsURL + "objects/")
  //             .load(
  //               e + ".obj",
  //               function (t) {
  //                 try {
  //                   var o = new THREE.Box3().setFromObject(t)
  //                     ; (t.userData.width = o.max.x - o.min.x),
  //                       (t.userData.height = o.max.y - o.min.y),
  //                       (t.userData.depth = o.max.z - o.min.z)
  //                   for (var a = 0; a < t.children.length; a++) {
  //                     var numberN = o.min.x + (o.max.x - o.min.x) / 2,
  //                       l =
  //                         o.min.y +
  //                         (o.max.y - o.min.y) / 2 -
  //                         (o.max.y - o.min.y) / 2,
  //                       i = o.min.z + (o.max.z - o.min.z) / 2
  //                     t.children[a].translateX(-numberN),
  //                       t.children[a].translateY(-l),
  //                       t.children[a].translateZ(-i)
  //                   }
  //                   ; (t.position.x = 80),
  //                     (t.position.y = -(t.userData.height / 2)),
  //                     (t.position.z = 0),
  //                     model3dScene.add(t),
  //                     (model3dObjectRef = t),
  //                     renderModel3d()
  //                   var r = "",
  //                     s = new XMLHttpRequest()
  //                     ; (s.onreadystatechange = function () {
  //                       if (4 == this.readyState && 200 == this.status) {
  //                         var e = this.responseText,
  //                           t = e.split("\n")
  //                         t.forEach(function (e) {
  //                           e.startsWith("#") && (r += e + "\n")
  //                         }),
  //                           (document.getElementById(
  //                             "modalModel3dObjHeader"
  //                           ).value = r)
  //                       }
  //                     }),
  //                       s.open("GET", objectsURL + "objects/" + e + ".obj", true),
  //                       s.send()
  //                 } catch (e) {
  //                   console.dir(e)
  //                 }
  //                 setModalModelDescription(e),
  //                   $("#model3dModal").show(),
  //                   hideMouseIndicators(),
  //                   (model3dViewOpen = true),
  //                   (progressBar.style.display = "none")
  //               },
  //               onProgress,
  //               onError
  //             )
  //       }))
}

function setToolMode(toolModeName: string) {
  console.debug('setToolMode to', toolModeName)
  // switch (
  // ("walls" === toolMode
  //   ? setEndDrawingWalls()
  //   : "floor" === toolMode
  //     ? setEndDrawingFloors()
  //     : "roof" === toolMode
  //       ? setEndDrawingRoofs()
  //       : "dimension" === toolMode
  //         ? setEndDrawingDimension()
  //         : "text" === toolMode
  //           ? setEndDrawingText()
  //           : "ground" === toolMode && setEndDrawingGround(),
  //   (toolMode = toolModeName),
  //   toolModeName)
  // ) {
  //   case "pointer":
  //     modalsActive || showMouseIndicators(),
  //       (defaultCursor = "default"),
  //       deselectAll(),
  //       document.getElementById("pointerTool").classList.add("activeTool"),
  //       document.getElementById("addWallTool").classList.remove("activeTool"),
  //       document.getElementById("addFloorTool").classList.remove("activeTool"),
  //       document.getElementById("addRoofTool").classList.remove("activeTool"),
  //       document.getElementById("addRulerTool").classList.remove("activeTool"),
  //       document.getElementById("addTextTool").classList.remove("activeTool")
  //     break
  //   case "walls":
  //     ; (defaultCursor = "crosshair"),
  //       deselectAll(),
  //       recalcAllUnjoinedWallSegments(-1),
  //       recalcAllWallSegmentsOnOtherLevels(-1, paper.project.activeLayer.data.id),
  //       document.getElementById("pointerTool").classList.remove("activeTool"),
  //       document.getElementById("addWallTool").classList.add("activeTool"),
  //       document.getElementById("addFloorTool").classList.remove("activeTool"),
  //       document.getElementById("addRoofTool").classList.remove("activeTool"),
  //       document.getElementById("addRulerTool").classList.remove("activeTool"),
  //       document.getElementById("addTextTool").classList.remove("activeTool"),
  //       setPropertiesView("wallDefaults")
  //     break
  //   case "floor":
  //     ; (defaultCursor = "crosshair"),
  //       deselectAll(),
  //       document.getElementById("pointerTool").classList.remove("activeTool"),
  //       document.getElementById("addWallTool").classList.remove("activeTool"),
  //       document.getElementById("addFloorTool").classList.add("activeTool"),
  //       document.getElementById("addRoofTool").classList.remove("activeTool"),
  //       document.getElementById("addRulerTool").classList.remove("activeTool"),
  //       document.getElementById("addTextTool").classList.remove("activeTool"),
  //       recalcAllWallCorners(),
  //       setPropertiesView("floorDefaults")
  //     break
  //   case "roof":
  //     ; (defaultCursor = "crosshair"),
  //       deselectAll(),
  //       document.getElementById("pointerTool").classList.remove("activeTool"),
  //       document.getElementById("addWallTool").classList.remove("activeTool"),
  //       document.getElementById("addFloorTool").classList.remove("activeTool"),
  //       document.getElementById("addRoofTool").classList.add("activeTool"),
  //       document.getElementById("addRulerTool").classList.remove("activeTool"),
  //       document.getElementById("addTextTool").classList.remove("activeTool"),
  //       recalcAllRoofCorners(),
  //       setPropertiesView("roofDefaults")
  //     break
  //   case "dimension":
  //     ; (defaultCursor = "crosshair"),
  //       deselectAll(),
  //       document.getElementById("pointerTool").classList.remove("activeTool"),
  //       document.getElementById("addWallTool").classList.remove("activeTool"),
  //       document.getElementById("addFloorTool").classList.remove("activeTool"),
  //       document.getElementById("addRoofTool").classList.remove("activeTool"),
  //       document.getElementById("addRulerTool").classList.add("activeTool"),
  //       document.getElementById("addTextTool").classList.remove("activeTool"),
  //       recalcAllWallCorners(),
  //       recalcAllRoofCorners(),
  //       setPropertiesView("dimensionDefaults")
  //     break
  //   case "text":
  //     ; (defaultCursor = "crosshair"),
  //       deselectAll(),
  //       document.getElementById("pointerTool").classList.remove("activeTool"),
  //       document.getElementById("addWallTool").classList.remove("activeTool"),
  //       document.getElementById("addFloorTool").classList.remove("activeTool"),
  //       document.getElementById("addRoofTool").classList.remove("activeTool"),
  //       document.getElementById("addRulerTool").classList.remove("activeTool"),
  //       document.getElementById("addTextTool").classList.add("activeTool"),
  //       setPropertiesView("textnDefaults")
  //     break
  //   case "background":
  //     ; (defaultCursor = "default"),
  //       document.getElementById("pointerTool").classList.remove("activeTool"),
  //       document.getElementById("addWallTool").classList.remove("activeTool"),
  //       document.getElementById("addFloorTool").classList.remove("activeTool"),
  //       document.getElementById("addRoofTool").classList.remove("activeTool"),
  //       document.getElementById("addRulerTool").classList.remove("activeTool"),
  //       document.getElementById("addTextTool").classList.remove("activeTool")
  //     break
  //   case "ground":
  //     setLevel("0"),
  //       (toolMode = toolModeName),
  //       (defaultCursor = "default"),
  //       (wallsGroup[0].opacity = 0.25),
  //       (floorsGroup[0].opacity = 0.25),
  //       (threedGroup[0].opacity = 0.25),
  //       document.getElementById("pointerTool").classList.remove("activeTool"),
  //       document.getElementById("addWallTool").classList.remove("activeTool"),
  //       document.getElementById("addFloorTool").classList.remove("activeTool"),
  //       document.getElementById("addRoofTool").classList.remove("activeTool"),
  //       document.getElementById("addRulerTool").classList.remove("activeTool"),
  //       document.getElementById("addTextTool").classList.remove("activeTool"),
  //       setPropertiesView("ground")
  //     break
  //   case "defaults":
  //     ; (defaultCursor = "default"),
  //       deselectAll(),
  //       document.getElementById("pointerTool").classList.remove("activeTool"),
  //       document.getElementById("addWallTool").classList.remove("activeTool"),
  //       document.getElementById("addFloorTool").classList.remove("activeTool"),
  //       document.getElementById("addRoofTool").classList.remove("activeTool"),
  //       document.getElementById("addRulerTool").classList.remove("activeTool"),
  //       document.getElementById("addTextTool").classList.remove("activeTool")
  // }
  // planView.style.cursor = defaultCursor
}

function setPropertiesView(element: string) {
  console.debug('setPropertiesView', element)
  switch (
    /*
    // "background" != element && "background" === toolMode && setToolMode("pointer"),
    // document.getElementById("threed3DModelPropertiesView").style.display = "none",
    // document.getElementById("threedPropertiesView").style.display = "none",
    // document.getElementById("planViewPropertiesView").style.display = "none",
    // document.getElementById("3dViewPropertiesView").style.display = "none",
    // document.getElementById("wallPropertiesView").style.display = "none",
    // document.getElementById("roofPropertiesView").style.display = "none",
    // document.getElementById("floorPropertiesView").style.display = "none",
    // document.getElementById("dimensionPropertiesView").style.display = "none",
    // document.getElementById("textPropertiesView").style.display = "none",
    // document.getElementById("defaultsPropertiesView").style.display = "none",
    // document.getElementById("wallDefaultsPropertiesView").style.display = "none",
    // document.getElementById("floorDefaultsPropertiesView").style.display = "none",
    // document.getElementById("roofDefaultsPropertiesView").style.display = "none",
    // document.getElementById("dimensionDefaultsPropertiesView").style.display = "none",
    // document.getElementById("textDefaultsPropertiesView").style.display = "none",
    // document.getElementById("levelPropertiesView").style.display = "none",
    // document.getElementById("groundPropertiesView").style.display = "none",
    */
    element
  ) {
    case "model3dMeta":
      document.getElementById("threed3DModelPropertiesView").style.display = "block"
      break
    case "threed":
      document.getElementById("threedPropertiesView").style.display = "block"
      break
    case 'planView':
      document.getElementById("planViewPropertiesView").style.display = "block"
      break
    case "3dView":
      document.getElementById("3dViewPropertiesView").style.display = "block"
      break
    case "wallPath":
      document.getElementById("wallPropertiesView").style.display = "block"
      break
    case "roofPath":
      document.getElementById("roofPropertiesView").style.display = "block"
      break
    case "floor":
      document.getElementById("floorPropertiesView").style.display = "block"
      break
    case "dimension":
      document.getElementById("dimensionPropertiesView").style.display = "block"
      break
    case "text":
      document.getElementById("textPropertiesView").style.display = "block"
      break
    case "level":
      document.getElementById("levelPropertiesView").style.display = "block"
      break
    case "ground":
      document.getElementById("groundPropertiesView").style.display = "block"
      // document.getElementById("groundWidthProp").value = groundWidth
      // document.getElementById("groundLengthProp").value = groundLength
      break
    case "defaults":
      document.getElementById("defaultsPropertiesView").style.display = "block"
      break
    case "wallDefaults":
      document.getElementById("defaultWallHeightProp").style.backgroundColor = "#4e4e4e"
      // document.getElementById("defaultWallHeightProp").value = defaultWallHeight
      document.getElementById("defaultWallThicknessProp").style.backgroundColor = "#4e4e4e"
      // document.getElementById("defaultWallThicknessProp").value = defaultWallThickness
      document.getElementById("wallDefaultsPropertiesView").style.display = "block"
      break
    case "floorDefaults":
      document.getElementById("defaultFloorThicknessProp").style.backgroundColor = "#4e4e4e"
      // document.getElementById("defaultFloorThicknessProp").value = defaultFloorThickness
      document.getElementById("floorDefaultsPropertiesView").style.display = "block"
      break
    case "roofDefaults":
      document.getElementById("defaultRoofThicknessProp").style.backgroundColor = "#4e4e4e"
      // document.getElementById("defaultRoofThicknessProp").value = defaultRoofThickness
      document.getElementById("defaultRoofWidthProp").style.backgroundColor = "#4e4e4e"
      // document.getElementById("defaultRoofWidthProp").value = defaultRoofWidth
      document.getElementById("defaultRoofRiseProp").style.backgroundColor = "#4e4e4e"
      // document.getElementById("defaultRoofRiseProp").value = defaultRoofRise
      document.getElementById("defaultRoofStartHeightProp").style.backgroundColor = "#4e4e4e"
      // document.getElementById("defaultRoofStartHeightProp").value = defaultRoofStartHeight
      document.getElementById("roofDefaultsPropertiesView").style.display = "block"
      // updateExtraDefaultRoofInfo()
      break
    case "dimensionDefaults":
      break
    case "textDefaults":
  }
}


function showThreedLicenseSummary(threedItem: TThreedItem) {
  console.debug('showThreedLicenseSummary', threedItem)
  // const threedItem = threedItem // threedItems[threedItem]
  try {
    document.getElementById("model3dName").innerText = threedItem.title
    let o = threedItem.author
    document.getElementById("model3dAuthor").innerText = threedItem.author
    let licenseLink = "License: Default"

    switch (threedItem.license) {
      case "Free Art License 1.3":
        licenseLink =
          "<a href='http://artlibre.org/licence/lal/en/' target='_blank' rel='noreferrer'>" +
          threedItem.license +
          "</a>"
        break
      case "CC-0":
        licenseLink =
          "<a href='https://creativecommons.org/publicdomain/zero/1.0/' target='_blank' rel='noreferrer'>" +
          threedItem.license +
          "</a>"
        break
      case "CC BY 3.0":
        licenseLink =
          "<a href='https://creativecommons.org/licenses/by/3.0/' target='_blank' rel='noreferrer'>" +
          threedItem.license +
          "</a>"
        break
      case "CC BY 4.0":
        licenseLink =
          "<a href='https://creativecommons.org/licenses/by/4.0/' target='_blank' rel='noreferrer'>" +
          threedItem.license +
          "</a>"
        break
      default:
        licenseLink = threedItem.license
        // "<a href='https://creativecommons.org/licenses/by/4.0/' target='_blank' rel='noreferrer'>" +
        //   threedItem.license +
        // "</a>"
    }
    document.getElementById("model3dLicense").innerHTML = licenseLink
    // @ts-expect-error
    document.getElementById("model3dLargeThumb").src = objectsURL + "objects/" + threedItem.title + ".png"
    document.getElementById("model3dLink").innerHTML = 
      "<a href='" + threedItem.threedLink + "' target='_blank' rel='noreferrer'>" +
      "click here" +
      "</a>"
    setPropertiesView("model3dMeta")
  } catch (err) {
    console.debug(err)
  }
}

// ** Drag Functions
function beginDrag(event: any, threedItem: TThreedItem) {

  const thisEvent = event // the triggering event sent to this function
  // const threedItem = threedItem // threedItems[threedItem]
  // console.debug('drag: beginDrag', event, threedItem, threedItem)
  console.debug('%c drag: beginDrag threedItem', ccm.yellowAlert, threedItem)

  try {
    showThreedLicenseSummary(threedItem)
    setToolMode("pointer")
    draggingThreedItem = threedItem
    draggingThreedIcon = true

    let o = paper.view.viewToProject(
      new paper.Point(
        event.pageX - planView.offsetLeft,
        event.pageY - planView.offsetTop
      )
    )
    draggingThreedRectangle = new paper.Path.Rectangle(
      new paper.Point(-1, -1),
      new paper.Point(1, 1)
    )
    draggingThreedRectangle.position = o

    if (threedItem) {
      threedItem.scale && threedItem.scale.x
        ? draggingThreedRectangle.bounds.width = threedItem.size.x * threedItem.scale.x
        : draggingThreedRectangle.bounds.width = threedItem.size.x
      threedItem.scale && threedItem.scale.z
        ? draggingThreedRectangle.bounds.height = threedItem.size.z * threedItem.scale.z
        : draggingThreedRectangle.bounds.height = threedItem.size.z
    }
    draggingThreedRectangle.visible = false
    // threedDragDiv = document.getElementById("threedDragDiv")
    
    threedDragDiv.style.background = "url('" + objectsURL + "objects/" + threedItem.title + "_top.png')"
    threedDragDiv.style.backgroundRepeat = "no-repeat"
    
    var widthA, heightN
    widthA = 100 // draggingThreedRectangle.bounds.width
    heightN = 100 // draggingThreedRectangle.bounds.height
    widthA *= paper.view.zoom
    heightN *= paper.view.zoom
    threedDragDiv.style.left = event.clientX - widthA / 2 + "px"
    threedDragDiv.style.top = event.clientY - heightN / 2 + "px"
    threedDragDiv.style.width = widthA + "px"
    threedDragDiv.style.height = heightN + "px"
    threedDragDiv.style.backgroundSize = widthA + "px " + heightN + "px"
    threedDragDiv.style.display = "block"

  } catch (err) {
    console.debug(err)
  }
}

function addThreed(event: any, scene: any) {
  console.debug('addThreed event', event)
  var t = draggingThreedRectangle.position
  t.x > paper.view.bounds.left
    ? t.y > paper.view.bounds.top && t.y < paper.view.bounds.bottom
      ? initThreed(t, scene)
      : t.y > paper.view.bounds.bottom
        ? console.debug("dropped inside 3dview drop. todo implement")
        : console.debug("dropped not inside views")
    : console.debug("dropped not inside views")
    threedDragDiv.style.display = "none"
    draggingThreedItem = draggingThreedItem
    draggingThreedIcon = false
    threedDragDiv.style.background = "url('media/tmp.png')"
    draggingThreedRectangle.visible = false
    event.preventDefault()
}

function initThreed(event: any, scene: any) {
  console.debug('initThreed event', event)
  console.debug('initThreed scene', scene)

  event.x = parseInt(event.x)
  event.y = parseInt(event.y)
  var t = draggingThreedItem.title
  var o = draggingThreedAngle
  new MTLLoader()
    .setCrossOrigin('anonymous')
    .setPath(objectsURL + "objects/")
    .load(t + ".mtl", function (a) {
      a.baseUrl = objectsURL + "objects/"
      a.preload()
      new OBJLoader()
      .setMaterials(a)
      .setPath(objectsURL + "objects/")
      .load(
        t + ".obj",
        function (a: any) {
          try {
            var imageN = new Image()
            imageN.crossOrigin = 'anonymous'
            imageN.src = objectsURL + "objects/" + t + "_top.png"
            imageN.onload = function () {
              var l = new THREE.Box3().setFromObject(a)
              a.userData.width = l.max.x - l.min.x
              a.userData.height = l.max.y - l.min.y
              a.userData.depth = l.max.z - l.min.z
              for (var i = 0; i < a.children.length; i++) {
                var r = l.min.x + (l.max.x - l.min.x) / 2
                var s = l.min.y + (l.max.y - l.min.y) / 2 - (l.max.y - l.min.y) / 2
                var d = l.min.z + (l.max.z - l.min.z) / 2
                a.children[i].translateX(-r)
                a.children[i].translateY(-s)
                a.children[i].translateZ(-d)
              }
              var c = new THREE.BoxHelper(a, 16711680)
              c.material.linewidth = 5
              c.visible = false
              a.add(c)
              a.position.y =
                0.1 +
                paper.project.activeLayer.data.height +
                defaultFloorThickness
              a.position.x = event.x
              a.position.z = event.y
// scene.add(a)
              clickableObjectsCounter++
              var u = clickableObjectsCounter
              a.name = u
              clickableObjects[u] = a

              var p = new THREE.BoxGeometry(
                a.userData.width,
                a.userData.height,
                a.userData.depth
              )

              var rasterImageN = new paper.Raster(imageN)
              rasterImageN.visible = false
              rasterImageN.onLoad = function () {
                if (
                  (
                    (rasterImageN.data.type = "threed"),
                    (rasterImageN.opacity = 0.5),
                    (rasterImageN.bounds.width = l.max.x - l.min.x),
                    (rasterImageN.bounds.height = l.max.z - l.min.z),
                    (rasterImageN.position = event),
                    (rasterImageN.data.flipX = 1),
                    (rasterImageN.data.flipZ = 1),
                    (rasterImageN.fillColor = new paper.Color(1, 1, 1, 1)),
                    (rasterImageN.selectedColor = new paper.Color(0, 0, 0, 0)),

                    readOnly ||
                    (rasterImageN.onMouseDown = function (e: any) {
                      if ("pointer" === toolMode) {
                        deselectAll()
                        selectedItem = this
                        mouseMode = 0
                        offsetMousePoint = selectedItem.position.subtract(e.point)
                        offsetMousePoint.x = parseInt(offsetMousePoint.x)
                        offsetMousePoint.y = parseInt(offsetMousePoint.y)
                        selectedItem.bringToFront()
                        this.data.toolsRectangleInner && this.data.toolsRectangleInner.remove()
                        this.rotation = 0
                        var rectangleOh = new paper.Path.Rectangle(this.bounds)
                          ; (this.rotation = this.data.angle),
                            (rectangleOh.data.type = "toolsRectangle"),
                            (rectangleOh.strokeColor = "#b19064"),
                            (rectangleOh.strokeWidth = 1),
                            (rectangleOh.strokeScaling = false),
                            (rectangleOh.locked = true),
                            rectangleOh.rotate(this.data.angle),
                            (this.data.toolsRectangleInner = rectangleOh),
                            (rectangleOh.visible = true),
                            (this.data.boxHelper.visible = true),
                            redrawGrid(),
                            (rotateIcon.visible = true),
                            (resizeIcon.visible = true),
                            (elevateIcon.visible = true),
                            (heightIcon.visible = true),
                            (toolsGroup.position =
                              selectedItem.bounds.center),
                            (toolsGroup.visible = true),
                            toolsGroup.bringToFront(),
                            rotateIcon.bringToFront(),
                            resizeIcon.bringToFront(),
                            elevateIcon.bringToFront(),
                            heightIcon.bringToFront(),
                            (rotateIcon.data.level =
                              paper.project.activeLayer.data.id),
                            (resizeIcon.data.level =
                              paper.project.activeLayer.data.id),
                            (elevateIcon.data.level =
                              paper.project.activeLayer.data.id),
                            (heightIcon.data.level =
                              paper.project.activeLayer.data.id),
                            (toolsGroup.data.level =
                              paper.project.activeLayer.data.id),
                            (modalModel3dThreedId = t),
                            updateObjectPropertiesWindow()
                      }
                    }),

                    (rasterImageN.data.id = u),
                    (rasterImageN.data.name = t),
                    (rasterImageN.data.boxHelper = c),
                    (rasterImageN.data.level = paper.project.activeLayer.data.id),

                    threedItem.useMask
                  )
                ) 
                {
                  rasterImageN.useMask = true
                  var meshN = new THREE.Mesh(
                    p,
                    new THREE.MeshStandardMaterial({})
                  )
                    ; (imageN.position.x = a.position.x),
                      (imageN.position.y = a.position.y),
                      (imageN.position.z = a.position.z),
                      imageN.geometry.translate(0, a.userData.height / 2, 0),
                      (imageN.visible = false),
                      scene.add(meshN),
                      (maskObjects[u] = meshN),
                      (imageN.name = "mask" + u)
                }


                // **
                if (rectangleOh) {
                  var i = (rectangleOh + 360) % 360
                  rasterImageN.rotate(i),
                    (rasterImageN.data.angle = i),
                    clickableObjects[u].rotateY((-i / 180) * Math.PI),
                    maskObjects[u] &&
                    (maskObjects[u].rotateY((-i / 180) * Math.PI),
                      (maskObjects[u].scale.x = 1),
                      (maskObjects[u].scale.y = 1),
                      (maskObjects[u].scale.z = 1))
                } else rasterImageN.data.angle = 0
                  ; (tween = new TWEEN.Tween(controls.target)
                    .to(a.position, 500)
                    .onUpdate(render)
                    .start()),
                    (rasterImageN.visible = true),
                    (Threed[u] = m),
                    threedGroup[paper.project.activeLayer.data.id].addChild(
                      Threed[u]
                    ),
                    (plan.threed[u] = {
                      id: u,
                      name: t,
                      position: clickableObjects[u].position,
                      scale: clickableObjects[u].scale,
                      rotation: clickableObjects[u].rotation,
                      width: rasterImageN.bounds.width,
                      depth: rasterImageN.bounds.height,
                      angle: rasterImageN.data.angle,
                      level: rasterImageN.data.level,
                      flipX: rasterImageN.data.flipX,
                      flipZ: rasterImageN.data.flipZ,
                    }),
                    (progressBar.style.display = "none")
                for (
                  var r = rasterImageN.canvas.getContext("2d"),
                  s = r.getImageData(0, 0, rasterImageN.width, rasterImageN.height),
                  d = s.data,
                  g = 0;
                  g < d.length;
                  g += 4
                )
                  (d[g] = 255 - d[g]),
                    (d[g + 1] = 255 - d[g + 1]),
                    (d[g + 2] = 255 - d[g + 2])
                r.putImageData(s, 0, 0),
                  updatePlanHistory(
                    plan,
                    u,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null
                  )
              } // end rasterImageN.onload function
            } // end imageN.onload function


          } catch (e) {
            console.dir(e)
          }
        },
        // onProgress,
        // onError
      )
    })
}

// ==============================================================

/* */

// ==============================================================
// ** 🟣 CATALOG ITEMS
const CatalogItems = (props: any): JSX.Element => {
  // console.debug('objectsJSON', objectsJSON)
  const [objects, setObjects] = useState(objectsJSON)

  // async function fetchObjects() {
  //   let res = await fetch('/api/home-design') // objects.json
  //   let data = await res.json()
  //   console.debug('fetchObjects data', data)
  //   // if (!objects) {
  //     setObjects(data)
  //   // }
  // }
  // if (!objects) {
  //   fetchObjects()
  // }
  if (!objects) {
    setObjects(objectsJSON)
  }

  if (!objects) {
    return <div>Loading...</div>
  }

  return (
    <div id='catalogItemObjects'>
      {/* 👇️ Iterate the array's OBJECTS */}
      {objects.map((object: any) => {
        return (
          <div 
            key={object.title + '_' + Math.random()} 
            id={object.title} 
            className='threedItem disableSelection' 
            onMouseDown={(event) => beginDrag(event, object)}
          >
            <img 
              src={objectsURL + "objects/" + object.title + ".png"}
              className='threedThumb' 
              alt={object.title}
              title={object.title}
            />
          </div>
        )
      })}
      {/* 👇️ Iterate the object's KEYS */}
      {/* {Object.keys(objects).map((object) => {
        return (
          <div 
            key={object} 
            id={object} 
            className='threedItem disableSelection' 
            onMouseDown={(event) => beginDrag(event, object)}
          >
            <img 
              src={objectsURL + "objects/" + object + ".png"}
              className='threedThumb' 
              alt={object}
              title={object}
            />
          </div>
        )
      })} */}
    </div>
  )
}

// const HomeDesignPage = (props) => {
// const HomeDesignPage: NextPage<TPageProps> = (props) => {
// const HomeDesignPage: NextPage = (): JSX.Element => {
// const HomeDesignPage: TNextPageWithProps = (): JSX.Element => {
export default function HomeDesignPage<TNextPageWithProps> (): JSX.Element { 
  
  // ==========================================================
  // ** HOOKS
  // const auth = useAuth()
  // ** USE SESSION
  // // const { data, status } = useSession()
  // const { data: sessionData, status: sessionStatus } = useSession()
  // console.debug('useSession().data', sessionData)
  // console.debug('useSession().status', sessionStatus)

  // ** USE CLIENT
  const client = useApolloClient()
  // console.debug('%c🦆 useApolloClient()', ccm.orangeAlert) // , client

  // ** USE PREFERENCES
  // const prefs = preferencesDataVar() // NO
  const prefs = useReactiveVar(preferencesDataVar) // YES !!
  // console.debug('%c⚙️ ThreeD Home Design prefs', ccm.orangeAlert, prefs)

  // ** INIT PREFERENCES
  const [isPageLoaded, setIsPageLoaded] = useState(false)
  const [isPrefsLoaded, setIsPrefsLoaded] = useState(useReactiveVar(isPreferencesSetVar))

  // ** PANELS (React State)
  // const [showPanelFirst, setShowPanelFirst] = useState(prefs.showPanelFirst)
  // const [showPanelLast, setShowPanelLast] = useState(prefs.showPanelLast)

  // ** USE CANVAS STATE
  const canvasState = useReactiveVar(canvasStateVar) // YES !!
  console.debug('%c⚙️ ThreeD Home Design canvasState', ccm.orangeAlert, canvasState)
  // ** INIT CANVAS STATE
  const [isCanvasLoaded, setIsCanvasLoaded] = useState(false)
  const [isCanvasStateLoaded, setIsCanvasStateLoaded] = useState(useReactiveVar(isCanvasStateSetVar))
  // // ** get scene + camera from child component ThreeDCanvasViewer refCanvas
  // // const scene = useRef()
  // const getThreeState = useThree((state) => state.get)
  // // getThreeState() // Get fresh state from anywhere you want
  // console.debug('getThreeState()', getThreeState())
  
  // ==========================================================
  // Component onMount hook
  // **
  useEffect(() => {

    if (!isPageLoaded && !isPrefsLoaded) {
    
      // ** GET PREFERENCES
      const fetchData = async () => {
        // try {
          // ** GET PREFERENCES
          if (!isPrefsLoaded) {
            // **
            // const preferencesFromDataSource = await preferencesStore.actions.loadFromDataSource(client)
            const preferencesFromDataSource = await preferencesStore.actions.loadFromDB(client)
            if (DEBUG) 
              console.debug('%c preferences loading...', ccm.greenAlert)
            if (preferencesFromDataSource) {
              if (DEBUG) 
                console.debug('%c preferencesFromDataSource', ccm.greenAlert)
            }
          }

          const loadPreferencesOne = await preferencesStore.store.get('one')
          // const loadPreferencesOne = await preferencesStore.store.useStore('one')
          // console.debug('%c🦆 APOLLO STORE: get one preferences => loadPreferencesOne', ccm.redAlert, loadPreferencesOne)
          preferencesDataVar(loadPreferencesOne.data)
          // console.debug('%c🦆 APOLLO STORE: FETCH preferencesDataVar()', ccm.redAlert, preferencesDataVar())
          isPreferencesSetVar(true)
          setIsPrefsLoaded(isPreferencesSetVar())
          // console.debug('%c🦆 APOLLO STORE: FETCH isPreferencesSetVar()', ccm.redAlert, isPreferencesSetVar())
          if (preferencesDataVar().doAutoLoadData) {
            // // const homeDesignsFromDataSource = await homeDesignStore.actions.loadFromDataSource(client)
            // const homeDesignsFromDataSource = await homeDesignStore.actions.loadFromDB(client)
            if (DEBUG) 
              console.debug('%c homeDesigns loading...', ccm.orangeAlert)
            // if (homeDesignsFromDataSource) {
            //   console.debug('%c🥕 homeDesignsFromDataSource', ccm.redAlert)
            //   // ** TODO
            //   // ** do more tasks here ??
            // }
          }

          // ** READY TO GO ???
          setIsPageLoaded(true)

        // } catch (error) {
        //   console.error('Error fetching data:', error);
        // }
      }
      // ** DO THE DATA FETCH
      fetchData()
      if (DEBUG) 
        console.debug('%c fetching data ...', ccm.blue)


      // ** LOAD NOUN FROM WP API VIA APOLLO INTO R3F + LEVA (+ VALTIO)
      const loadNounData = (_type: string = 'project', threeds: any = []) => {
        // load these threeds into r3f canvas
        if (DEBUG || debug) 
          console.debug('%c🌱 ThreeD Home Design loadNounData()', ccm.yellowAlert, _type, threeds)
        if (_type === 'project') {
          homeDesignStore.actions.loadToCanvas(threeds, '_r3fCanvas1')
        }
        // return <Box>true</Box> // true
      }
      
    } else if (isPageLoaded) {
      console.debug('%c🦆 ThreeD Home Design => LOADED !!', ccm.greenAlert, isPageLoaded)
    } else {
      // console.debug('%c🦆 ThreeDGarden => APOLLO STORE: preferencesDataVar()', ccm.redAlert, preferencesDataVar())
    }

  }, []) // useEffect

  // ==========================================================
  // ** prefs.showPanelFirst
  // **
  // useEffect(() => {
  //   let newData = {...preferencesDataVar()} // latest prefs
  //   // console.debug('%c⚙️ showPanelFirstLeva newData', ccm.green, newData)
  //   newData.showPanelFirst = showPanelFirstLeva
  //   // console.debug('%c⚙️ showPanelFirstLeva newData UPDATED', ccm.green, newData)
  //   preferencesDataVar(newData)
  //   // console.debug('%c⚙️ showPanelFirstLeva preferencesDataVar', ccm.darkgreen, preferencesDataVar())
  // }, [showPanelFirstLeva])
  // // **
  // useEffect(() => {
  //   // if (prefs.showPanelFirstLeva != undefined) {
  //     setHomeDesignPreferencesLeva({ showPanelFirstLeva: prefs.showPanelFirst })
  //   // }
  //   if (debug) console.debug('%c⚙️ READ FROM MASTER REACTIVE VAR: prefs.showPanelFirst', ccm.greenAlert, prefs.showPanelFirst)
  // }, [prefs.showPanelFirst])
  function setShowPanelFirst () {
    let newData = {...preferencesDataVar()} // latest prefs
    // console.debug('%c⚙️ showPanelFirstLeva newData', ccm.green, newData)
    newData.showPanelFirst = !prefs.showPanelFirst // showPanelFirstLeva
    // console.debug('%c⚙️ showPanelFirstLeva newData UPDATED', ccm.green, newData)
    preferencesDataVar(newData)
    // console.debug('%c⚙️ showPanelFirstLeva preferencesDataVar', ccm.darkgreen, preferencesDataVar())
  }

  // ==========================================================

  // ==========================================================
  // ** USE CONTEXT
  // const abilities = useContext(AbilityContext)
  // const abilities = ['read', 'write', 'delete']

  // ==========================================================

  // if (DEBUG || debug) 
  //   console.debug('%c🌱 ThreeD Home Design mounting ...', ccm.darkgreenAlert)

    
  let project_title = 'NOT EVEN CLOSE'
  // if (DEBUG || debug) 
  //   console.debug('%c🌱 ThreeD Home Design mounting ...', ccm.darkgreen, project_title)


  // ** load old data.. no
  useEffect(() => {
    // // ** setup dom elements
    // switch (UILayout) {
    //   case "3dView":
    //     readOnly = true
    //     document.getElementById('planView').style.display = "none"
    //     document.getElementById("view3d").style.top = "0px"
    //     document.getElementById("view3d").style.bottom = "0px"
    //     document.getElementById("view3d").style.left = "0px"
    //     document.getElementById("view3d").style.right = "0px"
    //     document.getElementById("view3d").style.display = "block"
    //     document.getElementById("catalogView").style.display = "none"
    //     document.getElementById("verticalSlider").style.display = "none"
    //     document.getElementById("horizontalSliderLeft").style.display = "none"
    //     document.getElementById("horizontalSliderRight").style.display = "none"
    //     document.getElementById("fullscreenPlanViewBtn").style.display = "none"
    //     document.getElementById("fullscreen3dViewBtn").style.right = "6px"
    //     document.getElementById("fullscreen3dViewBtn").style.bottom = "6px"
    //     document.getElementById("fullscreen3dViewBtn").style.opacity = "0.33"
    //     document.getElementById("fullscreen3dViewBtn").style.display = "block"
    //     document.getElementById("propertiesView").style.display = "none"
    //     document.getElementById("rulerLeft").style.display = "none"
    //     document.getElementById("rulerBottom").style.display = "none"
    //     document.getElementById("mouseIndicatorX").style.display = "none"
    //     document.getElementById("mouseIndicatorY").style.display = "none"
    //     document.getElementById("overlayLogo3dView").style.display = "block"
    //     document.getElementById("overlayMenu3dView").style.display = "block"
    //     break
    //   case 'planView':
    //     readOnly = true
    //     document.getElementById('planView').style.top = "0px"
    //     document.getElementById('planView').style.bottom = "0px"
    //     document.getElementById('planView').style.left = "0px"
    //     document.getElementById('planView').style.right = "0px"
    //     document.getElementById('planView').style.display = "block"
    //     document.getElementById("view3d").style.display = "none"
    //     document.getElementById("catalogView").style.display = "none"
    //     document.getElementById("verticalSlider").style.display = "none"
    //     document.getElementById("horizontalSliderLeft").style.display = "none"
    //     document.getElementById("horizontalSliderRight").style.display = "none"
    //     document.getElementById("fullscreenPlanViewBtn").style.right = "6px"
    //     document.getElementById("fullscreenPlanViewBtn").style.bottom = "30px"
    //     document.getElementById("fullscreenPlanViewBtn").style.opacity = "0.33"
    //     document.getElementById("fullscreenPlanViewBtn").style.display = "block"
    //     document.getElementById("fullscreen3dViewBtn").style.display = "none"
    //     document.getElementById("propertiesView").style.display = "none"
    //     document.getElementById("rulerLeft").style.top = "0px"
    //     document.getElementById("rulerLeft").style.bottom = "20px"
    //     document.getElementById("rulerLeft").style.left = "0px"
    //     document.getElementById("rulerLeft").style.display = "block"
    //     document.getElementById("rulerBottom").style.marginTop = "-20px"
    //     document.getElementById("rulerBottom").style.bottom = "0px"
    //     document.getElementById("rulerBottom").style.left = "30px"
    //     document.getElementById("rulerBottom").style.right = "0px"
    //     document.getElementById("rulerBottom").style.display = "block"
    //     document.getElementById("mouseIndicatorX").style.top = "0px"
    //     document.getElementById("mouseIndicatorX").style.left = "0px"
    //     document.getElementById("mouseIndicatorX").style.width = "1px"
    //     document.getElementById("mouseIndicatorX").style.bottom = "0px"
    //     document.getElementById("mouseIndicatorX").style.display = "block"
    //     document.getElementById("mouseIndicatorY").style.top = "0px"
    //     document.getElementById("mouseIndicatorY").style.left = "0px"
    //     document.getElementById("mouseIndicatorY").style.right = "0px"
    //     document.getElementById("mouseIndicatorY").style.height = "1px"
    //     document.getElementById("mouseIndicatorY").style.display = "block"
    //     document.getElementById("overlayLogoPlanView").style.display = "block"
    //     document.getElementById("overlayMenuPlanView").style.display = "block"
    //     break
    //   default:
    //     UILayout = "default"

    //     document.getElementById('planView').style.top = "54px"
    //     document.getElementById('planView').style.bottom = "50%"
    //     document.getElementById('planView').style.left = "318px"
    //     document.getElementById('planView').style.right = "0px"
    //     document.getElementById('planView').style.display = "block"
        
    //     document.getElementById("view3d").style.top = "50%"
    //     document.getElementById("view3d").style.bottom = "0px"
    //     document.getElementById("view3d").style.left = "318px"
    //     document.getElementById("view3d").style.right = "0px"
    //     document.getElementById("view3d").style.display = "block"

    //     document.getElementById("catalogView").style.top = "54px"
    //     document.getElementById("catalogView").style.left = "0px"
    //     document.getElementById("catalogView").style.width = "316px"
    //     document.getElementById("catalogView").style.height = "832px"
    //     document.getElementById("catalogView").style.display = "block"
        

    //     // document.getElementById("verticalSlider").style.top = "54px"
    //     // document.getElementById("verticalSlider").style.bottom = "0px"
    //     // document.getElementById("verticalSlider").style.left = "316px"
    //     // document.getElementById("verticalSlider").style.width = "4px"
    //     // document.getElementById("verticalSlider").style.display = "block"
    //     // document.getElementById("horizontalSliderLeft").style.top = "879px"
    //     // document.getElementById("horizontalSliderLeft").style.left = "0px"
    //     // document.getElementById("horizontalSliderLeft").style.width = "316px"
    //     // document.getElementById("horizontalSliderLeft").style.height = "4px"
    //     // document.getElementById("horizontalSliderLeft").style.display = "block"
    //     // document.getElementById("horizontalSliderRight").style.top = "50%"
    //     // document.getElementById("horizontalSliderRight").style.left = "318px"
    //     // document.getElementById("horizontalSliderRight").style.width = "100%"
    //     // document.getElementById("horizontalSliderRight").style.height = "4px"
    //     // document.getElementById("horizontalSliderRight").style.display = "block"
    //     // document.getElementById("fullscreenPlanViewBtn").style.right = "6px"
    //     // document.getElementById("fullscreenPlanViewBtn").style.top = "50%"
    //     // document.getElementById("fullscreenPlanViewBtn").style.opacity = "0.33"
    //     // document.getElementById("fullscreenPlanViewBtn").style.marginTop = "-58px"
    //     // document.getElementById("fullscreenPlanViewBtn").style.display = "block"
    //     // document.getElementById("fullscreen3dViewBtn").style.right = "6px"
    //     // document.getElementById("fullscreen3dViewBtn").style.bottom = "6px"
    //     // document.getElementById("fullscreen3dViewBtn").style.opacity = "0.33"
    //     // document.getElementById("fullscreen3dViewBtn").style.display = "block"
        
        
    //     // // document.getElementById("propertiesView").style.top = "880px"
    //     // // document.getElementById("propertiesView").style.left = "0px"
    //     // // document.getElementById("propertiesView").style.width = "306px"
    //     // // document.getElementById("propertiesView").style.bottom = "0px"
        
    //     // document.getElementById("propertiesView").style.display = "block"


    //     // document.getElementById("rulerLeft").style.top = "54px"
    //     // document.getElementById("rulerLeft").style.bottom = "50px"
    //     // document.getElementById("rulerLeft").style.left = "318px"
    //     // document.getElementById("rulerLeft").style.display = "block"
    //     // document.getElementById("rulerBottom").style.top = "50%"
    //     // document.getElementById("rulerBottom").style.marginTop = "-20px"
    //     // document.getElementById("rulerBottom").style.bottom = "0px"
    //     // document.getElementById("rulerBottom").style.left = "318px"
    //     // document.getElementById("rulerBottom").style.right = "0px"
    //     // document.getElementById("rulerBottom").style.display = "block"
    //     // document.getElementById("mouseIndicatorX").style.top = "54px"
    //     // document.getElementById("mouseIndicatorX").style.left = "318px"
    //     // document.getElementById("mouseIndicatorX").style.width = "1px"
    //     // document.getElementById("mouseIndicatorX").style.bottom = "50%"
    //     // document.getElementById("mouseIndicatorX").style.display = "block"
    //     // document.getElementById("mouseIndicatorY").style.top = "57px"
    //     // document.getElementById("mouseIndicatorY").style.left = "318px"
    //     // document.getElementById("mouseIndicatorY").style.right = "0px"
    //     // document.getElementById("mouseIndicatorY").style.height = "1px"
    //     // document.getElementById("mouseIndicatorY").style.display = "block")
    // }

  /* */

    // "default" === UILayout &&
    if (UILayout === 'default') {
      // $("#catalogItems").scroll(function () {
      //   loadInViewThumbs()
      // })
      focusPoint = new paper.Point(0, 0)
      raycaster = new THREE.Raycaster()
      mouse = new THREE.Vector2()
      
      // DONE
      // async function fetchObjects() {
      //   let res = await fetch('api/objects.json')
      //   let data = await res.json()
      //   console.debug('fetchObjects data', data)
      //   setObjects(data)
      //   // let arr = Array.from(Object.entries(data))
      //   // setObjects(arr)
      //   // console.debug('fetchObjects data arr', arr)
      // }
      // fetchObjects()

      // DONE
      /*
      $.ajax({
        url: "api/objects.json",
        type: "GET",
        contentType: "application/json",
        success: function (e) {
          if (((threedItems = e), "default" === UILayout)) {
            var t = 0
            Object.keys(threedItems)
              // .sort()
              .forEach(function (e) {
                var o = camelCaseToSentence(e)
                $("#catalogItems").append(
                  "<div id='" +
                  e +
                  "' class='threedItem disableSelection' onmousedown='beginDrag(event, \"" +
                  e +
                  "\");'><img " +
                  (t < 32
                    ? "src='" + objectsURL + "objects/" + e + ".png'"
                    : "src='media/thumbPlaceHolder.png'") +
                  " realsrc='" + objectsURL + "objects/" +
                  e +
                  ".png' class='threedThumb' alt='" +
                  o +
                  "' title='" +
                  o +
                  "' /></div>"
                ),
                  t++
              })
          }
        */  

        // WORKING ON...
        
        /*
          if (
            ($.ajax({
              url: "plans/threed-plan-example-001.threed",
              type: "GET",
              contentType: "application/json",
              success: function (e) {
                var t = JSON.parse(e)
                featuredPlanImage.src = t.thumb
              },
              error: function (e) {
                console.debug("document.ready : get thumb ajax : " + e)
              },
            }),
              "default" === UILayout &&
              ($("#wallDiffuse").minicolors({
                opacity: true,
                change: function (e, t) {
                  var o = parseInt(e.replace("#", "0x"))
                    ; (wallMaterial.color = new THREE.Color(o)),
                      (wallMaterial.opacity = parseFloat(t)),
                      (plan.wallDiffuse = wallMaterial.color),
                      (plan.wallOpacity = wallMaterial.opacity),
                      render()
                },
              }),
                $("#roofDiffuse").minicolors({
                  opacity: true,
                  change: function (e, t) {
                    var o = parseInt(e.replace("#", "0x"))
                      ; (roofMaterial.color = new THREE.Color(o)),
                        (roofMaterial.opacity = parseFloat(t)),
                        (plan.roofDiffuse = roofMaterial.color),
                        (plan.roofOpacity = roofMaterial.opacity),
                        render()
                  },
                }),
                $("#wallSpecular").minicolors({
                  change: function (e) {
                    var t = parseInt(e.replace("#", "0x"))
                      ; (wallMaterial.specular = new THREE.Color(t)),
                        (plan.wallSpecular = wallMaterial.specular),
                        render()
                  },
                }),
                $("#roofSpecular").minicolors({
                  change: function (e) {
                    var t = parseInt(e.replace("#", "0x"))
                      ; (roofMaterial.specular = new THREE.Color(t)),
                        (plan.roofSpecular = roofMaterial.specular),
                        render()
                  },
                }),
                $("#floorDiffuse").minicolors({
                  opacity: true,
                  change: function (e, t) {
                    var o = parseInt(e.replace("#", "0x"))
                      ; (floorMaterial.color = new THREE.Color(o)),
                        (floorMaterial.opacity = parseFloat(t)),
                        (plan.floorDiffuse = floorMaterial.color),
                        (plan.floorOpacity = floorMaterial.opacity),
                        render()
                  },
                }),
                $("#floorSpecular").minicolors({
                  change: function (e) {
                    var t = parseInt(e.replace("#", "0x"))
                      ; (floorMaterial.specular = new THREE.Color(t)),
                        (plan.floorSpecular = floorMaterial.specular),
                        render()
                  },
                }),
                $("#groundDiffuse").minicolors({
                  opacity: true,
                  change: function (e, t) {
                    var o = parseInt(e.replace("#", "0x"))
                      ; (groundMat.color = new THREE.Color(o)),
                        (groundMat.opacity = parseFloat(t)),
                        (plan.groundDiffuse = groundMat.color.getHexString()),
                        (plan.groundOpacity = groundMat.opacity),
                        render()
                  },
                }),
                $("#groundSpecular").minicolors({
                  change: function (e) {
                    var t = parseInt(e.replace("#", "0x"))
                      ; (groundMat.specular = new THREE.Color(t)),
                        (plan.groundSpecular = groundMat.specular.getHexString()),
                        render()
                  },
                })),
              fragment)
          )
            $.ajax({
              url: "api/getsharelink/" + fragment,
              type: "GET",
              contentType: "application/json",
              success: function (e) {
                var t = JSON.parse(e)
                e.error
                  ? console.debug(e.error)
                  : ((loadingProgressTxt = "Loading Shared Plan"),
                    (document.getElementById("modalLoadingDataInfo").innerHTML =
                      loadingProgressTxt),
                    $("#loadingModal").show(),
                    hideMouseIndicators(),
                    drawPlan(t))
              },
              error: function (e) {
                console.debug("document.ready : getsharelink : " + e)
              },
            })
          else {
            var o = localStorage.getItem("plan")
            if (o) {
              var o = JSON.parse(o)
                ; (loadingProgressTxt = "Loading Cached Plan"),
                  (document.getElementById("modalLoadingDataInfo").innerHTML =
                    loadingProgressTxt),
                  $("#loadingModal").show(),
                  hideMouseIndicators(),
                  drawPlan(o)
            } else showAbout(), setNewPlan()
          }
        },
        error: function (e) {
          console.dir(e)
        },
      }),
      (progressBar = document.getElementById("progressBar")),
      (progressBar.style.display = "none"),
      (verticalSlider = document.getElementById("verticalSlider")),
      (verticalSliderDragging = false),
      (verticalSlider.onmousedown = function (e) {
        ; (verticalSliderDragging = true),
          (verticalSlider.style.left = e.x - 2 + "px")
      }),
      (horizontalSliderLeft = document.getElementById("horizontalSliderLeft")),
      (horizontalSliderLeftDragging = false),
      (horizontalSliderLeft.onmousedown = function (e) {
        ; (horizontalSliderLeftDragging = true),
          (horizontalSliderLeft.style.top = e.y - 2 + "px")
      }),
      (horizontalSliderRight = document.getElementById("horizontalSliderRight")),
      (horizontalSliderRightDragging = false),
      (horizontalSliderRight.onmousedown = function (e) {
        ; (horizontalSliderRightDragging = true),
          (horizontalSliderRight.style.top = e.y - 2 + "px")
      }),
      */

      // ** ================================================

      // paper.install(window),
      // paper.setup(planCanvas),
      // (paper.settings.hitTolerance = 3),

      // ** ================================================

      // initPlanView(),
      // initThreeJS(),
      // resize3dView(),
      // resizePlanView(),
      // animate(),
      
      // ** ================================================

      threedDragDiv = document.getElementById('threedDragDiv')
      planView = document.getElementById('planView')
      
      // document.getElementById("catalogTextFilter").onInput = function (e) {
      //   var t = this.value.toLowerCase()
      //   t.length > 0
      //     ? Object.keys(threedItems).forEach(function (e) {
      //       e.toLowerCase().indexOf(t) > -1
      //         ? (document.getElementById(e).style.display = "block")
      //         : (document.getElementById(e).style.display = "none")
      //     })
      //     : Object.keys(threedItems).forEach(function (e) {
      //       document.getElementById(e).style.display = "block"
      //     }),
      //     loadInViewThumbs()
      // }
      
      /* end if ajax true */
      // ** ================================================
    }
/**/
    document.onmousemove = function (e) {
      // if (verticalSliderDragging) {
      //   return (
      //     verticalSlider.style.left = e.x - 2 + "px"
      //     catalogView.style.width = e.x - 2 + "px"
      //     propertiesView.style.width = e.x - 12 + "px"
      //     planView.style.left = e.x + 2 + "px"
      //     rulerLeft.style.left = e.x + 2 + "px"
      //     rulerBottom.style.left = e.x + 2 + "px"
      //     mouseIndicatorY.style.left = e.x + 2 + "px"
      //     view3d.style.left = e.x + 2 + "px"
      //     horizontalSliderLeft.style.width = e.x - 2 + "px"
      //     horizontalSliderRight.style.left = e.x + 2 + "px"
      //     Object.keys(levelButtons).forEach(function (t) {
      //       levelButtons[t].style.left = e.x + 37 + "px"
      //     })
      //     resize3dView()
      //     resizePlanView()
      //     loadInViewThumbs()
      //     false
      //   )
      // }
      // if (horizontalSliderLeftDragging) {
      //   return (
      //     horizontalSliderLeft.style.top = e.y - 2 + "px"
      //     catalogView.style.height = e.y - 56 + "px"
      //     propertiesView.style.top = e.y + 2 + "px"
      //     loadInViewThumbs()
      //     false
      //   )
      // }
      // if (horizontalSliderRightDragging) {
      //   return (
      //     horizontalSliderRight.style.top = e.y - 2 + "px"
      //     planView.style.height = e.y - 66 + "px"
      //     rulerLeft.style.bottom = e.y - 66 + "px"
      //     rulerBottom.style.top = e.y - 2 + "px"
      //     mouseIndicatorX.style.height = e.y - 58 + "px"
      //     view3d.style.top = e.y + 2 + "px"
      //     fullscreenPlanViewBtn.style.top = e.y - 2 + "px"
      //     Object.keys(levelButtons).forEach(function (t) {
      //       levelButtons[t].style.top = e.y - 48 + "px"
      //     }
      //     resize3dView()
      //     resizePlanView()
      //     false
      //   )
      // }
      if (draggingThreedIcon) {
        // console.debug('draggingThreedIcon', draggingThreedIcon)
        var widthT, heightOh
            widthT = draggingThreedRectangle.bounds.width
            heightOh = draggingThreedRectangle.bounds.height
            widthT *= paper.view.zoom
            heightOh *= paper.view.zoom
        var a = paper.view.viewToProject(
          new paper.Point(
            e.pageX - planView.offsetLeft,
            e.pageY - planView.offsetTop
          )
        )
        // console.debug('a', a)
        let thingN = null
        if (draggingThreedItem.useMask) {
          var l = 51,
            i = 0
          if (
            (Object.keys(Walls).forEach(function (e) {
              var t = Walls[e]
              if (
                "object" == typeof t &&
                t.data.level === paper.project.activeLayer.data.id
              ) {
                var o = t.getNearestPoint(a),
                  r = a.getDistance(o)
                if (r < 50 && r < l) {
                  ; (l = r), (thingN = o)
                  var s = t.segments[0].point.subtract(t.segments[1].point)
                  i = s.angle
                }
              }
            }),
              thingN)
          ) {
            new paper.Path.Circle({
              center: thingN,
              radius: screenScale / 2,
              fillColor: new paper.Color(0.3, 1, 0.5, 0.75),
              strokeWidth: 1,
            })
            .removeOnMove()
            .removeOnDrag()
            a = thingN
            var r = "rotate(" + i + "deg)"
              threedDragDiv.style.transform = r
              draggingThreedAngle = i
          } else {
            var r = "rotate(0deg)"
              threedDragDiv.style.transform = r
              draggingThreedAngle = 0
          }
        }
        if (null === thingN) {
          var s: any
          Object.keys(verticalGuides).forEach(function (e) {
            console.debug('e', e)
            a.x >= verticalGuides[e].position.x - 10 &&
              a.x <= verticalGuides[e].position.x + 10 &&
              (s = new paper.Point(verticalGuides[e].position.x, a.y))
          })
          Object.keys(horizontalGuides).forEach(function (e) {
            a.y >= horizontalGuides[e].position.y - 10 &&
              a.y <= horizontalGuides[e].position.y + 10 &&
              (s
                ? (s.y = horizontalGuides[e].position.y)
                : (s = new paper.Point(a.x, horizontalGuides[e].position.y)))
          })
          if (s) {
            a = s
            new paper.Path.Circle({
              center: a,
              radius: screenScale / 2,
              fillColor: new paper.Color(1, 0.3, 0.5, 0.75),
              strokeWidth: 1,
            })
            .removeOnMove()
            .removeOnDrag()
          }
        }
        if (draggingThreedItem.pivot) {
          var d = a.add(
            new paper.Point(draggingThreedItem.pivot).rotate(draggingThreedAngle)
          ),
          c = a,
          u = c.subtract(d)
          a = a.add(u)
        }
        draggingThreedRectangle.position = a
        var p = paper.view.projectToView(a)
        threedDragDiv.style.left = p.x + planView.offsetLeft - widthT / 2 + "px"
        threedDragDiv.style.top = p.y + planView.offsetTop - heightOh / 2 + "px"
        // [MM]
        // threedDragDiv.style.display = "block"
      }
      // if (draggingNewGuide) {
      //   var m = paper.view.viewToProject(
      //     new paper.Point(
      //       e.pageX - planView.offsetLeft,
      //       e.pageY - planView.offsetTop
      //     )
      //   )
      //   9 === mouseMode
      //     ? (verticalGuides[selectedGuideId].position.x =
      //       parseInt(rasterImageN.x / snapTolerance) * snapTolerance)
      //     : 10 === mouseMode &&
      //     (horizontalGuides[selectedGuideId].position.y =
      //       parseInt(rasterImageN.y / snapTolerance) * snapTolerance)
      // }
    }
    // ** 
    document.onmouseup = function (e) {
      draggingThreedIcon = false
      return  verticalSliderDragging
              ? ((verticalSliderDragging = false), false)
              : horizontalSliderLeftDragging
              ? ((horizontalSliderLeftDragging = false), false)
              : horizontalSliderRightDragging
              ? ((horizontalSliderRightDragging = false), false)
              : (draggingThreedItem !== -1 && addThreed(e, scene),
                void (draggingNewGuide && (draggingNewGuide = false)))
    }
    


  }, []) // end load data useEffect (client)

  
  // // ** MODALS
  // const [showModalAbout, setShowModalAbout] = useState(false)
  // const [showModal3dModel, setShowModal3dModel] = useState(false)
  // const [showModalShare, setShowModalShare] = useState(false)
  // const [showModalLoading, setShowModalLoading] = useState(false)
  // function handleShowModalAbout() {
  //   console.debug('handleShowModalAbout()')
  //   setShowModalAbout(true)
  //   console.debug('showModalAbout', showModalAbout)
  //   // $('.supportEmail').text('support@companyjuice.com'),
  //   //   $('#showModalAbout').show(),
  //   //   hideMouseIndicators()
  // }
  // function handleShowModal3dModel() {
  //   console.debug('handleShowModal3dModel()')
  //   setShowModal3dModel(true)
  //   console.debug('showModal3dModel', showModal3dModel)
  // }
  // function handleShowModalShare() {
  //   console.debug('handleShowModalShare()')
  //   setShowModalShare(true)
  //   console.debug('showModalShare', showModalShare)
  // }
  // function handleShowModalLoading() {
  //   console.debug('handleShowModalLoading()')
  //   setShowModalLoading(true)
  //   console.debug('showModalLoading', showModalLoading)
  // }
  // ** END MODALS


  // {/* BASIC JSX ACTION BUTTONS */}
  // {/* <Flex>
  // <Button onClick={() => handleShowModalAbout()}>
  //   Show Modal: About
  // </Button>
  // <Button onClick={() => handleShowModal3dModel()}>
  //   Show Modal: 3D Model
  // </Button>
  // <Button onClick={() => handleShowModalShare()}>
  //   Show Modal: Share
  // </Button>
  // <Button onClick={() => handleShowModalLoading()}>
  //   Show Modal: Loading
  // </Button>
  // </Flex> */}




  // ** RADIX-UI DropdownMenu
  const DropdownMenuThreeD = () => {
    const [bookmarksChecked, setBookmarksChecked] = useState(true)
    const [urlsChecked, setUrlsChecked] = useState(false)
    const [person, setPerson] = useState('marty')
  
    return (
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className='IconButton' aria-label='Customise options'>
            <HamburgerMenuIcon />
          </button>
        </DropdownMenu.Trigger>
  
        <DropdownMenu.Portal>
          <DropdownMenu.Content 
            className='DropdownMenuContent' 
            // sideOffset={5}
          >
            <DropdownMenu.Item 
              className='DropdownMenuItem'
              // onClick={() => handleShowModalAbout()}
            >
              About <div className='RightSlot'>⌘+A</div>
            </DropdownMenu.Item>
            <DropdownMenu.Item 
              className='DropdownMenuItem'
              // onClick={() => handleShowModal3dModel()}
            >
              3D Model <div className='RightSlot'>⌘+N</div>
            </DropdownMenu.Item>
            <DropdownMenu.Item 
              className='DropdownMenuItem'
              // onClick={() => handleShowModalShare()}
            >
              Share <div className='RightSlot'>⌘+N</div>
            </DropdownMenu.Item>
            <DropdownMenu.Item 
              className='DropdownMenuItem'
              // onClick={() => handleShowModalLoading()}
            >
              Loading <div className='RightSlot'>⌘+N</div>
            </DropdownMenu.Item>
            <DropdownMenu.Item 
              className='DropdownMenuItem' 
              disabled
            >
              New Private Modal <div className='RightSlot'>⇧+⌘+N</div>
            </DropdownMenu.Item>
            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger className='DropdownMenuSubTrigger'>
                Files
                <div className='RightSlot'>
                  <ChevronRightIcon />
                </div>
              </DropdownMenu.SubTrigger>
              <DropdownMenu.Portal>
                <DropdownMenu.SubContent
                  className='DropdownMenuSubContent'
                  sideOffset={2}
                  alignOffset={-5}
                >
                  <DropdownMenu.Item className='DropdownMenuItem'>
                    Save Page As… <div className='RightSlot'>⌘+S</div>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item className='DropdownMenuItem'>
                    Create Shortcut…
                  </DropdownMenu.Item>
                  <DropdownMenu.Item className='DropdownMenuItem'>
                    Name Window…
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator className='DropdownMenu.Separator' />
                  <DropdownMenu.Item className='DropdownMenuItem'>
                    Developer Tools
                  </DropdownMenu.Item>
                </DropdownMenu.SubContent>
              </DropdownMenu.Portal>
            </DropdownMenu.Sub>
            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger className='DropdownMenuSubTrigger'>
                Edits
                <div className='RightSlot'>
                  <ChevronRightIcon />
                </div>
              </DropdownMenu.SubTrigger>
              <DropdownMenu.Portal>
                <DropdownMenu.SubContent
                  className='DropdownMenuSubContent'
                  sideOffset={2}
                  alignOffset={-5}
                >
                  <DropdownMenu.Item className='DropdownMenuItem'>
                    Save Page As… <div className='RightSlot'>⌘+S</div>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item className='DropdownMenuItem'>
                    Create Shortcut…
                  </DropdownMenu.Item>
                  <DropdownMenu.Item className='DropdownMenuItem'>
                    Name Window…
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator className='DropdownMenu.Separator' />
                  <DropdownMenu.Item className='DropdownMenuItem'>
                    Developer Tools
                  </DropdownMenu.Item>
                </DropdownMenu.SubContent>
              </DropdownMenu.Portal>
            </DropdownMenu.Sub>
            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger className='DropdownMenuSubTrigger'>
                Plan Views
                <div className='RightSlot'>
                  <ChevronRightIcon />
                </div>
              </DropdownMenu.SubTrigger>
              <DropdownMenu.Portal>
                <DropdownMenu.SubContent
                  className='DropdownMenuSubContent'
                  sideOffset={2}
                  alignOffset={-5}
                >
                  <DropdownMenu.Item className='DropdownMenuItem'>
                    Save Page As… <div className='RightSlot'>⌘+S</div>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item className='DropdownMenuItem'>
                    Create Shortcut…
                  </DropdownMenu.Item>
                  <DropdownMenu.Item className='DropdownMenuItem'>
                    Name Window…
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator className='DropdownMenu.Separator' />
                  <DropdownMenu.Item className='DropdownMenuItem'>
                    Developer Tools
                  </DropdownMenu.Item>
                </DropdownMenu.SubContent>
              </DropdownMenu.Portal>
            </DropdownMenu.Sub>
            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger className='DropdownMenuSubTrigger'>
                3D Views
                <div className='RightSlot'>
                  <ChevronRightIcon />
                </div>
              </DropdownMenu.SubTrigger>
              <DropdownMenu.Portal>
                <DropdownMenu.SubContent
                  className='DropdownMenuSubContent'
                  sideOffset={2}
                  alignOffset={-5}
                >
                  <DropdownMenu.Item className='DropdownMenuItem'>
                    Save Page As… <div className='RightSlot'>⌘+S</div>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item className='DropdownMenuItem'>
                    Create Shortcut…
                  </DropdownMenu.Item>
                  <DropdownMenu.Item className='DropdownMenuItem'>
                    Name Window…
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator className='DropdownMenu.Separator' />
                  <DropdownMenu.Item className='DropdownMenuItem'>
                    Developer Tools
                  </DropdownMenu.Item>
                </DropdownMenu.SubContent>
              </DropdownMenu.Portal>
            </DropdownMenu.Sub>
  
            <DropdownMenu.Separator className='DropdownMenuSeparator' />
  
            <DropdownMenu.CheckboxItem
              className='DropdownMenuCheckboxItem'
              checked={bookmarksChecked}
              onCheckedChange={setBookmarksChecked}
            >
              <DropdownMenu.ItemIndicator className='DropdownMenuItemIndicator'>
                <CheckIcon />
              </DropdownMenu.ItemIndicator>
              Show Bookmarks <div className='RightSlot'>⌘+B</div>
            </DropdownMenu.CheckboxItem>
            <DropdownMenu.CheckboxItem
              className='DropdownMenuCheckboxItem'
              checked={urlsChecked}
              onCheckedChange={setUrlsChecked}
            >
              <DropdownMenu.ItemIndicator className='DropdownMenuItemIndicator'>
                <CheckIcon />
              </DropdownMenu.ItemIndicator>
              Show Full URLs
            </DropdownMenu.CheckboxItem>
  
            <DropdownMenu.Separator className='DropdownMenuSeparator' />
  
            <DropdownMenu.Label className='DropdownMenuLabel'>
              People
            </DropdownMenu.Label>
            <DropdownMenu.RadioGroup value={person} onValueChange={setPerson}>
              <DropdownMenu.RadioItem
                className='DropdownMenuRadioItem'
                value='marty'
              >
                <DropdownMenu.ItemIndicator className='DropdownMenuItemIndicator'>
                  <DotFilledIcon />
                </DropdownMenu.ItemIndicator>
                Marty McGee
              </DropdownMenu.RadioItem>
              <DropdownMenu.RadioItem
                className='DropdownMenuRadioItem'
                value='alex'
              >
                <DropdownMenu.ItemIndicator className='DropdownMenuItemIndicator'>
                  <DotFilledIcon />
                </DropdownMenu.ItemIndicator>
                Alex Uychocde
              </DropdownMenu.RadioItem>
            </DropdownMenu.RadioGroup>
  
            <DropdownMenu.Arrow className='DropdownMenuArrow' />
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    )
  }


  // ** RETURN JSX
  // ** Return Jsx
  // ** retuRn JSX.Element
  return (
    <Flex
      // direction='row'
      style={{
        height: '90vh',
        width: '99.8%',
      }}
    >

      {/* PAGE PANELS */}
      <PanelGroup 
        direction='vertical'
        // autoSaveId='ThreeDHomeDesignLayoutMain'
      >
        {/* PANELS: HEADER */}
        {/* PAGE LOADING PROGRESS? */}
        {/* <Panel 
          className='Panel'
          defaultSize={4}
          maxSize={4}
          style={{
            // height: '4vh',
            // border: '1px solid darkgreen',
          }}
        >
          <progress 
            id='progressBar'
            value='20' 
            max='100' 
            className='center' 
          ></progress> 
        </Panel> */}

        {/* <PanelResizeHandle /> */}

        <Panel 
          className='Panel'
          defaultSize={4}
          maxSize={32}
          style={{
            // border: '1px solid darkgreen',
          }}
        >
          <Container 
            style={{ 
              marginLeft: '4px', 
              // marginRight: '6px' 
            }}
          >
            {/* MAIN ACTIONS DROPDOWN MENU */}
            <DropdownMenuThreeD />

            {/* PANEL SHOW/HIDE */}
            <span>
              <Button
                // className={styles.Button}
                style={{
                  backgroundColor: 'transparent',
                  border: '0px',
                  width: '16px',
                  height: '16px',
                  padding: '0px',
                  marginLeft: '4px', 
                }}
                // onClick={() => setShowPanelFirst(!prefs.showPanelFirst)}
              >
                {/* {showPanelFirst ? "hide" : "show"} panel left */}
                { prefs.showPanelFirst && (
                  <ArrowLeftEndOnRectangleIcon
                    style={{
                      color: '#504191', // '#3B3269',
                    }}
                  />
                )}
                { !prefs.showPanelFirst && (
                  <ArrowRightEndOnRectangleIcon
                    style={{
                      color: '#504191', // '#3B3269',
                    }}
                  />
                )}
              </Button>
              &nbsp;
              <Button
                // className={styles.Button}
                style={{
                  backgroundColor: 'transparent',
                  border: '0px',
                  width: '16px',
                  height: '16px',
                  padding: '0px',
                  marginLeft: '0px', 
                }}
                // onClick={() => setShowPanelLast(!prefs.showPanelLast)}
              >
                {/* {showPanelLast ? "hide" : "show"} panel right */}
                { prefs.showPanelLast && (
                  <ArrowRightEndOnRectangleIcon
                    style={{
                      color: '#504191', // '#3B3269',
                    }}
                  />
                )}
                { !prefs.showPanelLast && (
                  <ArrowLeftEndOnRectangleIcon
                    style={{
                      color: '#504191', // '#3B3269',
                    }}
                  />
                )}
              </Button>
            </span>
            <span>
              {/* <Heading as='h4'>
                🥕 Welcome to ThreeD Garden
              </Heading> */}
            </span>
          </Container>
        </Panel>
        
        {/* <PanelResizeHandle /> */}

        <Panel 
          className='Panel'
          defaultSize={80}
          // maxSize={64}
          style={{
            // border: '1px solid darkgreen',
          }}
        >
          <PanelGroup 
            direction='vertical'
            // autoSaveId='ThreeDHomeDesignLayoutSub'
          >
            {/* EXAMPLE PANEL: SUB-HEADER */}
            {/* <Panel
              className='Panel'
              defaultSize={4}
              maxSize={80}
              style={{
                // border: '1px solid darkgreen',
              }}
            >
              <Container
                className='PanelContent'
              >
                <Heading as='h2'>
                  🌱 ThreeD: Next.js: app (router): home-design: page .tsx
                </Heading>
              </Container>
            </Panel> */}
            {/*  */}
            
            {/* <PanelResizeHandle /> */}
            
            <Panel
              className='Panel'
              defaultSize={88}
              maxSize={100}
              style={{
                // border: '1px solid darkgreen',
              }}
            >
              <PanelGroup 
                direction='horizontal'
                // autoSaveId='ThreeDHomeDesignLayoutSub2'
              >
                {/* VIEWS: OBJECT CATALOG */}
                {prefs.showPanelFirst && (
                  <>
                    {/* LEFT PANEL */}
                    <Panel
                      id='panelLeft'
                      // className='Panel'
                      defaultSize={24}
                      maxSize={48}
                      style={{
                        // border: '1px solid darkred',
                      }}
                    >
                      <PanelGroup
                        direction='vertical'
                        // autoSaveId='ThreeDHomeDesignLayoutSub3'
                      >
                        <Panel 
                          id='catalogView'
                          className='Panel'
                          defaultSize={60}
                          // maxSize={64}
                          style={{
                            // border: '1px solid darkgreen',
                          }}
                        >
                          <div id='catalogFilters'>
                            { false && (
                              <Container>
                                <input 
                                  type='text' 
                                  id='catalogTextFilter' 
                                  placeholder='🔍' 
                                  // width='32' 
                                />
                              </Container>
                            )}
                          </div>
                          <div id='catalogItems'>
                            { true && (
                              <CatalogItems />
                            )}
                          </div>
                        </Panel>

                        <PanelResizeHandle />
                        
                        <Panel 
                          id='viewProperties'
                          className='Panel'
                          defaultSize={40}
                          // maxSize={64}
                          style={{
                            // border: '1px solid darkgreen',
                          }}
                        >
                          { true && (
                            <ViewProperties />
                          )}
                        </Panel>

                      </PanelGroup>
                    </Panel>

                    <PanelResizeHandle />
                  </>
                )}

                {/* VIEWS: CANVASES */}
                {prefs.showPanelLast && (
                  <>
                    {/* RIGHT PANEL */}
                    <Panel
                      // className='Panel'
                      defaultSize={76}
                      maxSize={100}
                      style={{
                        // border: '1px solid darkblue',
                      }}
                    >
                      {/* MAIN CANVASES (TOP + BOTTOM) */}
                      <PanelGroup 
                        direction='vertical'
                      >
                        {/* TOP PANEL: 2D PAPER CANVAS */}
                        <Panel
                          className='Panel'
                          defaultSize={50}
                          maxSize={100}
                        >
                          <Grid 
                            id='planView'
                            style={{
                              border: '1px solid #222222',
                            }}
                          >
                            {/* <Text>
                              Main Content (children)
                            </Text> */}
                            {/* <SessionData 
                              session={session} 
                            /> */}
                            {/* THREED HOME DESIGN: 2D PAPER PLAN VIEW */}
                            {/* <Canvas 
                              id='planCanvas'
                              key={'planCanvas'}
                            >
                              <Preload all />
                              <></>
                            </Canvas> */}

                            <PaperCanvas />
                            
                            <div id='overlayLogoPlanView' className='overlayLogo'>
                              <a href='https://threedgarden.com/demo/'
                                // style='float:leftpadding:0px margin-top:0px'
                              >
                                <img
                                  src='/favicon/favicon.png' height='32px' title='ThreeD Home Design' alt='ThreeD Home Design' 
                                />
                              </a>
                              &nbsp
                              <a href='https://threedgarden.com/demo/'
                                // style='padding-left: 10px text-decoration: none font-size: 32px'
                              >
                                ThreeD Home Design
                              </a>
                            </div>
                            {/* 
                            <div id='overlayMenuPlanView'>
                              <button id='overlayPlanViewRecenterBtn' onClick={() => recenterPlanView()} className='smallButton'>Recenter</button>
                              <button id='overlayPlanViewGoto3dViewBtn' onClick={() => goto3dView()} className='smallButton'>3d View</button>
                            </div>
                            */}
                          </Grid>
                        </Panel>
                        
                        <PanelResizeHandle />
                        
                        {/* BOTTOM PANEL: 3D FIBER CANVAS */}
                        <Panel
                          className='Panel'
                          defaultSize={50}
                          maxSize={100}
                          style={{
                            // border: '1px solid darkblue',
                          }}
                        >
                          <Grid 
                            id='view3d'
                            style={{
                              height: '100%',
                              // width: '100%',
                              border: '1px solid #222222',
                            }}
                          >
                            {/* <Text>
                              Main Content (2nd Level)
                            </Text> */}
                            {/* <SessionData 
                              session={session} 
                            /> */}
                            {/* THREED HOME DESIGN: 3D CANVAS */}

                            {/* DO RUN THIS */}
                            { true && (
                            <ThreeDComponents 
                            
                            />
                            )}
                            
                            {/* DO NOT RUN THIS */}
                            { false && (
                            <Canvas
                              id={'threeCanvas'}
                              key={'threeCanvas'}

                              style={{
                                width: '100%',
                                height: '100%',
                                // border: '1px solid #222222',
                                // display: 'none !important',
                              }}

                              shadows={true}
                              dpr={[1, 2]} // dpr = target pixel ratio (need ???)
                              
                              // ** CAMERA (not using declarative inside canvas)
                              // camera={threedCamera}

                              // ** SCENE (needs to be declarative inside canvas)
                              // scene={{
                              //   // background: new THREE.CubeTextureLoader().load(cubeMapURLs), // ThreeDGarden1.tsx
                              //   background: new THREE.Color(0x171717),
                              // }}
                              scene={scene}
                              onCreated={
                                (state) => {
                                  console.debug('%c Canvas onCreated state', ccm.darkred, state)
                                  // console.debug('%c Canvas onCreated state.camera', ccm.darkred, state.camera)
                                  console.debug('%c Canvas onCreated state.camera.position', ccm.darkred, state.camera.position)
                                  state.gl.toneMapping = THREE.AgXToneMapping
                                  // state.camera.fov = 32 // 8
                                  // state.camera.lookAt(2, -4, 8) // position [0, 0, 0]
                                  // threedCamera.position = new THREE.Vector3(2, -4, 8)
                                  // console.debug('%c Canvas onCreated state.camera.position(lookAt)', ccm.redAlert, state.camera.position)
                                }
                              }
                              
                              // ** JOYSTICK as mouse (optional)
                              // onPointerDown={(e) => {
                              //   if (e.pointerType === 'mouse') {
                              //     // testing
                              //     (e.target as HTMLCanvasElement).requestPointerLock()
                              //   }
                              // }}
                              
                            >
                              <Preload all />
                            
                              {/* ORBIT CONTROLS (CAMERA CONTROLS) */}
                              {/* makeDefault makes the controls known to r3f,
                                  now transform-controls can auto-disable them when active */}
                              {enableOrbit && (
                                <>
                                  <OrbitControls
                                    makeDefault
                                    minDistance={0.25}
                                    maxDistance={480}
                                    // // minZoom={10}
                                    // // maxZoom={20}
                                    // // minAzimuthAngle={-Math.PI / 4}
                                    // // maxAzimuthAngle={Math.PI / 4}
                                    minPolarAngle={-Math.PI / 1.8}
                                    maxPolarAngle={Math.PI / 1.8}
                                    enableZoom={true}
                                    zoomToCursor={false} // default is false
                                    zoomSpeed={1.0} // default is 1.0
                                    enableRotate={true}
                                    // autoRotate={prefs.showPanelFirst} // default is false
                                    autoRotate={false}
                                    autoRotateSpeed={1.0} // default is 2.0
                                    rotateSpeed={1.0} // default is 1.0
                                    enableDamping={false} // slows down rotation after mouse release
                                    dampingFactor={0.2} // default is 0.05
                                    enablePan={true}
                                    screenSpacePanning={true}

                                    // target={camera.target}
                                  />

                                  {/* ORBIT CONTROLS GIZMO HELPER */}
                                  {enableGizmoCube && (
                                    <GizmoHelper
                                      alignment='top-right'
                                      margin={[64, 48]}
                                    >
                                      <group scale={0.7}>
                                        <GizmoViewcube />
                                      </group>
                                      <group
                                        scale={1.4}
                                        position={[-24, -24, -24]}
                                      >
                                        <GizmoViewport
                                          labelColor='white'
                                          axisHeadScale={0.5}
                                          hideNegativeAxes
                                        />
                                      </group>
                                    </GizmoHelper>
                                  )}
                                </>
                              )}

                            </Canvas>
                            )}
                            {/* <div id='overlayLogo3dView' className='overlayLogo'>
                              <a href='https://threedgarden.com/home-design/'><img
                                  src='favicon/favicon.png' height='32px' title='ThreeD Home Design' alt='ThreeD Home Design' /></a>&nbsp
                              <a href='https://threedgarden.com/home-design/'>ThreeD Home Design</a>
                            </div>
                            <div id='overlayMenu3dView'>
                              <button id='overlay3dviewRecenterBtn' onClick={() => recenter3dview()} className='smallButton'>Recenter</button>
                              <button id='overlay3dviewGotoPlanViewBtn' onClick={() => gotoPlanView()} className='smallButton'>Plan View</button>
                            </div> */}
                          </Grid>
                        </Panel>
                        
                      </PanelGroup>

                    </Panel>
                  </>
                )}
              </PanelGroup>
              
            </Panel>

          </PanelGroup>

          <PanelResizeHandle />

        </Panel>

        {/* <PanelResizeHandle /> */}

        {/* PANELS: FOOTER */}
        {/* <Panel 
          className='Panel'
          defaultSize={4}
          maxSize={8}
          style={{
            // height: '4vh',
            // border: '1px solid darkgreen',
          }}
        >
          <progress value='90' max='100' className='center' id='progressBar'></progress> 
        </Panel> */}

      </PanelGroup>

      {/* VIEWS: PROPERTIES */}
      {/* <ViewProperties /> */}

      {/* VIEWS: MODALS */}
      {/* <ViewModals /> */}

      

      {/*
      <canvas id='rulerLeft' width='30' height='500' onmousedown='addVerticalGuide()}
        onmouseup='removeVerticalGuide()}></canvas>
      <canvas id='rulerBottom' width='1024' height='20' onmousedown='addHorizontalGuide()}
        onmouseup='removeHorizontalGuide()}></canvas>
      */}

      <div id='mouseIndicatorY'></div>
      <div id='mouseIndicatorX'></div>

      <div id='compass'></div>

      <div id='verticalSlider'></div>
      <div id='horizontalSliderLeft'></div>
      <div id='horizontalSliderRight'></div>

      <div id='threedDragDiv'></div>

      {/*
      <img id='fullscreenPlanViewBtn' src='media/fullscreen.png' width='30' height='30'
        onClick={() => openFullscreen('planView')} />
      <img id='fullscreen3dViewBtn' src='media/fullscreen.png' width='30' height='30'
        onClick={() => openFullscreen('view3d')} />
      */}
      
    </Flex>
  )
}
