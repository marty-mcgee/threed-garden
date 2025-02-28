// ==============================================================
// Home Design Page (main landing page for 2D-3D Demo)

'use client'

// ==============================================================
// RESOURCES

// ** NEXT Imports
import dynamic from 'next/dynamic'
import Image from 'next/image'

// ** APOLLO Imports
import { 
  getApolloContext,

  useApolloClient,
  useReactiveVar,
  
  useQuery,
  useSuspenseQuery,
  useBackgroundQuery,
  useReadQuery,
  useFragment,

  useMutation,
} from '@apollo/client'
import {
  // stores,
  preferencesStore,
  canvasStateStore,
  projectStore,
  // queries,
  // mutations,
  registerUser,
  loginUser,
  refreshJwtAuthToken,
  // reactive state vars:
  isPreferencesDataSetVar,
  preferencesDataVar,
  isCanvasStatePaperSetVar,
  canvasStatePaperVar,
  isCanvasStateThreeDSetVar,
  canvasStateThreeDVar,
  isPaperCanvasLoadedVar,
  isThreeDCanvasLoadedVar,
} from '#/lib/api/graphql/apollo'

import { useSession } from 'next-auth/react'
// import { auth } from '#/lib/auth/auth'
// import { useAuth } from '#/lib/auth/hooks/useAuth'
// import SessionData from '#/layout/ui/session-data'
// import CustomLink from '#/layout/ui/custom-link'

// ** REACT Imports
import { 
  // Suspense,
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react'

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
// import PanelResizeHandleHorizontal from '#/layout/ui/resize-handle'

// ** ICON Imports
import { 
  ArrowLeftEndOnRectangleIcon,
  ArrowRightEndOnRectangleIcon,
} from '@heroicons/react/24/outline'
// import {
// 	HamburgerMenuIcon,
// 	DotFilledIcon,
// 	CheckIcon,
// 	ChevronRightIcon,
// } from '@radix-ui/react-icons'

// ** COMPONENT Imports
// import Logo from '#/layout/ui/logo'

// ** PAPER Imports
import paper from 'paper'

// ** THREED Imports
// import ThreeDComponents from '#/lib/threed/threed'
// const ThreeD = dynamic(() => import('#/lib/threed/ThreeD'), { ssr: false })
// ** ThreeD r3f Canvas Imports
// import ThreeDCanvasViewer from '#/lib/threed/components/canvas/CanvasViewer'
const ThreeDCanvasViewer = dynamic(() => import('#/lib/threed/components/canvas/CanvasViewer'), { ssr: false })
// ** ThreeD Toolbar
import ThreeDToolbar from '#/lib/threed/components/controls/Toolbar'
// ** ThreeD Leva Controls
// import { ThreeDLevaControls, ThreeDLevaComponent } from '#/lib/threed/components/controls/LevaControls'
// ** ThreeD using Apollo + React to View Control + Info Panels 
// ** (Apollo Store/ReactiveVar/State Access)
import ThreeDControlPanels from '#/lib/threed/components/controls/ControlPanels'
// import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ThreeDDropdownMenu } from '#/lib/threed/components/controls/DropdownControls'
// import * as Dialog from '@radix-ui/react-dialog'
// import { ThreeDDialogModals } from '#/lib/threed/components/controls/DialogModals'

// ** STATIC DATA Imports
import threedItemsJSON from '#/app/api/home-design/objects.json'
// import currentPlanJSON from 'plans/threed-plan-example-001.threed'
import currentPlanJSON from '#/app/api/home-design/threed-plan-demo-1.json'

// ** HELPER Imports
// import Spinner from '#/layout/ui/spinner'
import ccm from '#/lib/utils/console-colors'

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
// ☑️<script type='text/javascript' src='scripts/trackballcontrols.js'></script>
// import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js'
// ☑️<script type='text/javascript' src='scripts/tween.js'></script>
// import * as TWEEN from '@tweenjs/tween.js'
// ☑️<script type='text/javascript' src='scripts/MTLLoader.js'></script>
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js'
// ☑️<script type='text/javascript' src='scripts/OBJLoader.js'></script>
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js'
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

// ** DEBUG: this module
const debug: boolean = false
const DEBUG: boolean = true

// const appVersion: string = require('package.json').version

if (false && (debug || DEBUG)) {
  console.debug('%c====================================', ccm.darkgreen)
  console.debug('%c🥕 ThreeDHomeDesign<FC,R3F>: {.tsx}', ccm.green)
  console.debug('%c====================================', ccm.darkgreen)
}

// ==============================================================
// ** 🟣 TYPED VARIABLES

type TUILayout = 'default' | 'planView' | '3dView' 
type TThreedTool = 'pointer' | 'walls' | 'floor' | 'roof' | 'dimension' | 'text' | 'background' | 'ground' | 'defaults'

let threedUILayout: TUILayout = 'default'
let threedTool: TThreedTool = 'pointer'
let threedItemsURL: string = 'https://threedpublic.s3.amazonaws.com/demo/'

let enableOrbit: boolean = true
let enableGizmoCube: boolean = true

let fragment: any = null
let readOnly: boolean = false

let threedHomeDesign: string = 'HEY HEY HEY ___',
// **
// **
// **
// redrawGrid: Function = () => {},
// redrawTexts: Function = () => {},
xLines: Object[] = [],
yLines: Object[] = [],
// **
// **
threedItems: Object[] = threedItemsJSON,
selectedItem: any,
deselectAll: Function = () => {},
// **
mouseMode: number = 0,
defaultCursor: string = 'default',
// **
toolsGroup: Object[] = [],
gridGroup: Object[] = [],
threedGroup: Object[] = [],
wallsGroup: Object[] = [],
roofsGroup: Object[] = [],
floorsGroup: Object[] = [],
dimensionsGroup: Object[] = [],
textsGroup: Object[] = [],
guidesGroup: Object[] = [],
// **
rotateIcon: paper.Raster,
resizeIcon: paper.Raster,
elevateIcon: paper.Raster,
heightIcon: paper.Raster,
// **
planView: HTMLElement,
mouseIndicatorX: HTMLElement,
mouseIndicatorY: HTMLElement,
rulerLeft: HTMLCanvasElement = null,
rulerLeftCtx: any,
rulerBottom: HTMLCanvasElement = null,
rulerBottomCtx: any,
fullscreenPlanViewBtn,
fullscreen3dViewBtn,
modalCloseBtnAbout,
modalCloseBtnModel3d,
// **
threedToLoadCount: number = 0,
loadedThreedCount: number = 0,
// **
defaultWallHeight: number = 265,
defaultWallThickness: number = 20,
defaultRoofThickness: number = 25,
defaultRoofWidth: number = 350,
defaultRoofRise: number = 300,
defaultRoofStartHeight: number = 0,
defaultFloorThickness: number = 25,
// **
tools,
// **
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
// **
canvas3d,
camera,
renderer,
container,
// https://github.com/three-types/three-ts-types/blob/master/types/three/src/scenes/Scene.d.ts
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
tween,
raycaster: THREE.Raycaster = new THREE.Raycaster(),
mouse: THREE.Vector2 = new THREE.Vector2(),
clickableObjects: Object[] = [],
clickableObjectsCounter: number = 0,
maskObjects: Object[] = [],
maskObjectsApplied: Object[] = [],
maskObjectsAppliedRoof: Object[] = [],
// **
verticalSlider: HTMLElement,
verticalSliderDragging: boolean,
horizontalSliderLeft: HTMLElement,
horizontalSliderLeftDragging: boolean,
horizontalSliderRight: HTMLElement,
horizontalSliderRightDragging: boolean,
// **
threedDragDiv: HTMLElement, // React.ReactNode = <div></div>,
draggingThreedIcon: boolean = false,
draggingThreedItem: TThreedItem, // Object = {},
draggingThreedAngle: number = 0,
draggingThreedRectangle: paper.Path.Rectangle = null, 
// project is null
// draggingThreedRectangle = new paper.Path.Rectangle(
//   new paper.Point(-1, -1),
//   new paper.Point(1, 1)
// ),
// **
// **
// **
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
// **
// **
movePointIcons: Object[] = [],
movePointIconSelectedId: number = 0,
selectedMovePointIcon: any = null,
wallPath: paper.Path = null,
wallIdCounter: number = 0,
wallsRectangles: Object[] = [],
wallsRectangles3d: Object[] = [],
wallHelperPath: paper.Path = null,
wallHelperRectangle: paper.Path.Rectangle = null,
startedDrawingWalls: boolean = false,
floorPath: paper.Path = null,
floorIdCounter: number = 0,
floorHelperPath: paper.Path = null,
startedDrawingFloor: boolean = false,
roofPath: paper.Path = null,
roofIdCounter: number = 0,
roofHelperPath: paper.Path = null,
roofsRectangles: Object[] = [],
roofsRectangles3d: Object[] = [],
roofHelperRectangle: paper.Path.Rectangle = null,
startedDrawingRoofs: boolean = false,
dimensionPath: paper.Path = null,
dimensionIdCounter: number = 0,
dimensionHelperPath: paper.Path = null,
startedDrawingDimension: boolean = false,
stretchYPath: paper.Path = null,
stretchYStartHeight: number = 0,
elevatePath: paper.Path = null,
elevating: boolean = false,
elevateStartHeight: number = 0,
dragging: boolean = false,
scalingXY: boolean = false,
scalingY: boolean = false,
rotating: boolean = false,
wallHelper3dCube: THREE.Mesh = null, // new THREE.Mesh(),
roofHelper3dCube: THREE.Mesh = null, // new THREE.Mesh(),
// **
// **
// **
wallMaterial: THREE.Material = null,
floorMaterial: THREE.Material = null,
roofMaterial: THREE.Material = null,
wallCornersX: Object[] = [],
wallCornersY: Object[] = [],
roofCornersX: Object[] = [],
roofCornersY: Object[] = [],
snapPoint: paper.Point = null,
unjoinedWallSegments: Object[] = [],
allWallSegments: Object[] = [],
unjoinedRoofSegments = [],
allRoofSegments = [],
snapPointOverride = {},
textPath: paper.Path = null,
textIdCounter: number = 0,
startedDrawingText: boolean = false,
editingTextId = -1,
Threed: Object[] = [],
Walls: Object[] = [],
Roofs: Object[] = [],
Floors: Object[] = [],
Floors3d: Object[] = [],
Dimensions: Object[] = [],
Texts: Object[] = [],
// **
backgroundRaster: paper.Raster = null,
backgroundRasterRatioX: number = 1,
backgroundRasterRatioY: number = 1,
idToCopyPaste: number = -1,
lastPasteX: number = 0,
lastPasteY: number = 0,
progressBar: HTMLElement,
focusPoint: paper.Point = null, // = new paper.Point(0, 0),
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
// **
// **
modalModel3dThreedId: number = -1,
model3dObjectRef,
model3dViewOpen: boolean = false,
model3dScene,
model3dSceneRenderer,
model3dViewContainer,
model3dSceneCamera,
model3dViewCanvas,
// **
// **
// **
loadingProgressTxt: string = '',
lastMousePoint,
dltext: string = '',
zoomRectangle,
// **
sky,
sunSphere,
inclination,
azimuth,
// **
examplePlan,
// **
fLineX,
fLineY,
fLineZ,
// **
modalsActive: boolean = false,
shareLinkUrl: string = '',
shareLinkUrl3d: string = '',
shareLinkUrlPlan: string = '',
// **
// **
verticalGuides: Object[] = [],
horizontalGuides: Object[] = [],
selectedGuideId: number = -1,
guideCounter: number = 0,
draggingNewGuide: boolean = false,
// **
// **
snapTolerance: number = 1,
groundWidth: number = 5e3,
groundLength: number = 5e3

let busy: boolean = false
// let screenAvg = 1000 // (screen.width + screen.height) / 2
let redrawing: boolean = false
let strokeWidth: number = 0

function roundTo(value: number, digits: number) {
  value = value * Math.pow(10, digits)
  value = Math.round(value)
  value = value / Math.pow(10, digits)
  return value
}
const onProgress = function (e: any) {
  if (false) { // run this??
    if (e.lengthComputable) {
      var t = (e.loaded / e.total) * 100
      // @ts-expect-error
      progressBar.value = t
      progressBar.style.display = 'block'
    }
  }
}
const onError = function (e: any) {
  console.debug('onError: e', e)
}
const getAngleRadians = function (e: any, t: any) {
  return Math.atan2(t.y - e.y, t.x - e.x)
}
const getDistance = function (e: any, t: any) {
  var o = e.x - t.x,
    a = e.y - t.y,
    n = Math.sqrt(o * o + a * a)
  return n
}
// String.prototype.capitalize = function () {
//   return this.replace(/(^|\s)([a-z])/g, function (e, t, o) {
//     return t + o.toUpperCase()
//   })
// }

// ** [MM] firefox browser mouse controls
function MMeMouseRedrawGrid (e: any) {
  
  // let
  planView = document.getElementById('planView')
  var t = e.wheelDelta ? e.wheelDelta / 40 : e.detail ? -e.detail : 0
  if (t) {
    var o = cumulclick
    cumulclick += Math.min(Math.max(t / 3, -1), 1)
    var a = Math.pow(scaleFactor, cumulclick)
    if (a > 0.0625 && a < 16) {
      paper.view.zoom = a
      var n = paper.view.viewToProject(
        new paper.Point(
          e.pageX - planView.offsetLeft,
          e.pageY - planView.offsetTop
        )
      )
      var l = 0.11 * (paper.view.center.x - n.x)
      var i = 0.11 * (paper.view.center.y - n.y)

      if (t > 0) {
        var r = paper.view.center.x - l
        var s = paper.view.center.y - i
        var d = new paper.Point(r, s)
        paper.view.center = d
      } 
      else {
        var r = paper.view.center.x + l
        var s = paper.view.center.y + i
        var d = new paper.Point(r, s)
        paper.view.center = d
      }

      redrawGrid()
      redrawTexts()
    
    } else {
      cumulclick = o
    }
  }
  return e.preventDefault() && false
}

function recenterPlanView () {
  const planView = document.getElementById('planView')
  paper.view.center = new paper.Point(planView.clientWidth / 2, planView.clientHeight / 2)
  redrawGrid()
  redrawTexts()
}

// ==============================================================
// **
// ** DIALOG MODALS (now imported as separate component)
// **
// ==============================================================

// ==============================================================
// **
// ** 🖼️ PAPER.JS CANVAS
// **
const PaperCanvas = (props: any) => {
  
  // ** PLAN CANVAS 'planCanvas'
  
  // ** 🧇🧇🧇🧇🧇 follow the waffles
  const planCanvasRef = useRef(null)

  // ** REACT STATE -- isPaperCanvasLoaded?
  // ** to prevent setting up Paper more than once
  const [ isPaperCanvasLoaded, setIsPaperCanvasLoaded ] = useState(false)
  // ** planView width:height
  const [ statePlanViewWidth, setStatePlanViewWidth ] = useState(0)
  const [ statePlanViewHeight, setStatePlanViewHeight ] = useState(0)
  
  // init: intentionally run this client-only listener on every react.render
  useEffect(() => {

    // ** SET PAPER CANVAS REACT REF
    const planCanvas = planCanvasRef.current
    // console.debug('%c PaperCanvas planCanvasRef.current', ccm.darkorangeAlert, planCanvasRef.current)

    // ** PAPER.JS -- load?
    if (!isPaperCanvasLoadedVar()) {
    
      // console.debug('%c PaperCanvas planCanvasRef.current', ccm.darkorangeAlert, planCanvasRef.current)

      if (planCanvasRef.current !== null) {

        // let
        // planCanvas = document.getElementById('planCanvas')
        // const thisStatePlanViewWidth = roundTo(paper.view.bounds.width, 0)
        // const thisStatePlanViewHeight = roundTo(paper.view.bounds.height, 0)
        const thisStatePlanViewWidth = roundTo(planCanvas.parentNode.getBoundingClientRect().width, 0)
        const thisStatePlanViewHeight = roundTo(planCanvas.parentNode.getBoundingClientRect().height + 100, 0)
        planCanvas.width = thisStatePlanViewWidth
        planCanvas.height = thisStatePlanViewHeight

        // ** STATE SET
        setStatePlanViewWidth(thisStatePlanViewWidth)
        setStatePlanViewHeight(thisStatePlanViewHeight)

        // ** ================================================

        // ** PAPER.JS -- SETUP
        // paper.install(window)
        paper.setup(planCanvas)
        // paper.settings.hitTolerance = 3 // do not set this here (yet)

        // ** ================================================
          
        // console.debug('%c PaperCanvas paper.view.bounds.width:height = ', ccm.darkredAlert, 
        //   roundTo(paper.view.bounds.width, 0)
        //   + ' : ' +
        //   roundTo(paper.view.bounds.height, 0)
        // )

        // ** ================================================

        // ** PAPER.JS -- TESTING : DEBUGGING

            // ** draw a circle at paper view center
            var startCircle = new paper.Path.Circle({
              center: paper.view.center,
              radius: 20,
              fillColor: 'orange'
            })

            // ** DOES NOT WORK AS EXPECTED
            // ** when view is resized...
            // paper.view.onResize = function() {
            //   // ...debug new view width
            //   console.debug('PaperCanvas paper.view.bounds.width is now: ' + paper.view.bounds.width)
            //   // ...place circle at new view center
            //   startCircle.position = paper.view.center
            // }
            
            // ** draw instructions
            // var startInstructions = new paper.PointText({
            //   content: 'Resize the window and see that view is automatically resized',
            //   point: paper.view.center.subtract(80),
            //   justification: 'center',
            //   color: new paper.Color(255, 255, 255, 1),
            // })

        // ** ================================================

        // ** THREED PAPER.JS
        
        initThreeDPaperPlanView(planCanvas)
        initPaperOrbitControls()
        // drawFreestyle()
        // ** 
        // console.debug('%c PaperCanvas THREED PAPER JS: initThreeDPaperPlanView(planCanvasRef)', ccm.darkorangeAlert, planCanvasRef.current)
        // console.debug(`%c PaperCanvas planCanvas`, ccm.darkgreenAlert, planCanvas)

        // ** THREED APOLLO STATE REACTIVE VAR
        isPaperCanvasLoadedVar(true)

      } // planCanvasRef.current !== null
      // ** ================================================

    }
    
  }, []) // intentionally run this client-only listener on every react.render
  // END useEffect
  
  // ** RETURN JSX
  return (
    <canvas 
      id='planCanvas'
      ref={planCanvasRef}
      // width={props.width? props.width : '2000'}
      // width={statePlanViewWidth}
      // height={props.height? props.height : '1000'}
      // height={statePlanViewHeight}
    />
  )
}

// ** SIMPLE DRAWING FUNCTION
const drawFreestyle = () => {
  let myPath = new paper.Path()
  // **
  paper.view.onMouseDown = (event: any) => {
    // myPath.remove()
    // @ts-expect-error
    myPath.strokeColor = 'orange'
    myPath.strokeWidth = 4
  }
  // **
  paper.view.onMouseDrag = (event: any) => {
    myPath.add(event.point)
    // myPath.remove()
  }
  // **
  paper.view.onMouseUp = (event: any) => {
    // @ts-expect-error
    myPath.strokeColor = 'darkgreen'
    myPath.strokeWidth = 4
    // reset myPath
    myPath = new paper.Path()
  }
  // **
  // @ts-expect-error
  paper.view.draw()
}

// ** SIMPLE 2D PAPER ORBITCONTROLS FUNCTION
const initPaperOrbitControls = () => {
  // let myPath = new paper.Path()
  // **
  paper.view.onMouseDown = (event: any) => {
    // // myPath.remove()
    // // @ts-expect-error
    // myPath.strokeColor = 'orange'
    // myPath.strokeWidth = 3
  }
  // **
  paper.view.onMouseDrag = (event: any) => {
    // myPath.add(event.point)
    // // myPath.remove()
  }
  // **
  paper.view.onMouseUp = (event: any) => {
    // // @ts-expect-error
    // myPath.strokeColor = 'darkgreen'
    // myPath.strokeWidth = 3
    // // reset myPath
    // myPath = new paper.Path()
  }
  // **
  // // @ts-expect-error
  // paper.view.draw()
}

// ** MAIN PAPER VIEW on a PaperCanvas
function initThreeDPaperPlanView(planCanvas: any) {

  // ** let planView is parent container for planCanvas
  planView = document.getElementById('planView')
  
  // ** let planCanvas is the main paper canvas
  // planCanvas = document.getElementById('planCanvas')
  // planCanvas.width = roundTo(planCanvas.parentNode.getBoundingClientRect().width, 0)
  // planCanvas.height = roundTo(planCanvas.parentNode.getBoundingClientRect().height, 0)
  // planCanvas.width = roundTo(planView.getBoundingClientRect().width, 0)
  // planCanvas.height = roundTo(planView.getBoundingClientRect().height, 0)
  // console.debug(
  //   '%c PaperCanvas: initThreeDPaperPlanView: planCanvas width:height', 
  //   ccm.blueAlert, 
  //   planCanvas.width, 
  //   planCanvas.height
  // )
  // // ** disable default context menu on planCanvas
  // planCanvas.oncontextmenu = function () {
  //   return false
  // }

  // ** ================================================
  
  // ** CURRENT SCREEN DIMENSIONS
  // screenScale = ((screen.width + screen.height) / 2) / paper.view.zoom / 75
  screenScale = ((screen.width + screen.height) / 2) / paper.view.zoom

  // **
  focusPoint = new paper.Point(0, 0)

  // **
  threedDragDiv = document.getElementById('threedDragDiv')

  // **
  progressBar = document.getElementById('progressBar')
  progressBar.style.display = 'none'

  // ** ================================================

  // ** ACTIVATE PAPER PROJECT LAYER
  paper.project.activeLayer.name = 'level_0'
  paper.project.activeLayer.data = { id: '0', height: 0 }

  // ==============================================================
  // ** GROUPS
  gridGroup[0] = new paper.Group()
  floorsGroup[0] = new paper.Group()
  roofsGroup[0] = new paper.Group()
  wallsGroup[0] = new paper.Group()
  dimensionsGroup[0] = new paper.Group()
  threedGroup[0] = new paper.Group()
  textsGroup[0] = new paper.Group()
  guidesGroup[0] = new paper.Group()
  toolsGroup[0] = new paper.Group()

  // ==============================================================
  // ** SLIDERS
  verticalSlider = document.getElementById('verticalSlider')
  verticalSliderDragging = false
  verticalSlider.onmousedown = function (e: any) {
    verticalSliderDragging = true
    verticalSlider.style.left = e.x - 2 + 'px'
  }
  horizontalSliderLeft = document.getElementById('horizontalSliderLeft')
  horizontalSliderLeftDragging = false
  horizontalSliderLeft.onmousedown = function (e: any) {
    horizontalSliderLeftDragging = true
    horizontalSliderLeft.style.top = e.y - 2 + 'px'
  }
  horizontalSliderRight = document.getElementById('horizontalSliderRight')
  horizontalSliderRightDragging = false
  horizontalSliderRight.onmousedown = function (e: any) {
    horizontalSliderRightDragging = true
    horizontalSliderRight.style.top = e.y - 2 + 'px'
  }

  // ==============================================================
  // ** RULERS
  // @ts-expect-error
  rulerLeft = document.getElementById('rulerLeft')
  // @ts-expect-error
  rulerBottom = document.getElementById('rulerBottom')
  // rulerBottom.style.width = planCanvas.parentNode.getBoundingClientRect().width
  // rulerLeft.style.height = planCanvas.parentNode.getBoundingClientRect().height
  // ** RULER CONTEXTS
  rulerLeft.oncontextmenu = function () {
    return false
  }
  rulerBottom.oncontextmenu = function () {
    return false
  }
  rulerLeftCtx = rulerLeft.getContext('2d')
  rulerBottomCtx = rulerBottom.getContext('2d')

  // ==============================================================
  // ** MOUSE INDICATORS
  // mouseIndicatorX = document.getElementById('mouseIndicatorX')
  // mouseIndicatorY = document.getElementById('mouseIndicatorY')
  // (document.getElementsByClassName('close')[0].onclick = function () {
  //   closeAllModals(), showMouseIndicators()
  // }),
  // (document.getElementsByClassName('close')[1].onclick = function () {
  //   closeAllModals(), showMouseIndicators()
  // }),
  // (document.getElementsByClassName('close')[2].onclick = function () {
  //   closeAllModals(), showMouseIndicators()
  // }),
  // ** CROSSHAIRS mouse indicators x,y onmousemove
  // planCanvas.addEventListener(
  //   'mousemove',
  //   function (e: any) {
  //     mouseIndicatorX.style.left = e.clientX + 'px'
  //     mouseIndicatorY.style.top = e.clientY + 'px'
  //   },
  //   false
  // )

  // ** MOUSE MOVEMENTS -- SUPPORT FIREFOX + OTHERS
  let MMtUserAgent = /Firefox/i.test(navigator.userAgent)
    ? 'DOMMouseScroll'
    : 'mousewheel'
  planCanvas.addEventListener(MMtUserAgent, MMeMouseRedrawGrid)

  // ==============================================================
  // ** DRAGGING A SIMPLE RECTANGLE
  draggingThreedRectangle = new paper.Path.Rectangle(
    new paper.Point(-1, -1),
    new paper.Point(1, 1)
  )
  draggingThreedRectangle.strokeColor = new paper.Color(177, 144, 100, 1) // '#b19064'
  draggingThreedRectangle.strokeWidth = 2
  draggingThreedRectangle.strokeScaling = false
  draggingThreedRectangle.position = new paper.Point(0, 0)
  draggingThreedRectangle.visible = false
  // @ts-expect-error
  threedGroup[paper.project.activeLayer.data.id].addChild(
    draggingThreedRectangle
  )

  // ==============================================================
  // ** TOOLS: PAPER GROUP OF TOOLS
  // toolsGroup[0] = new paper.Group()
  // @ts-expect-error
  toolsGroup[0].rotation = 0
  
  // ** 
  rotateIcon = new paper.Raster('images/homedesign/rotate.png')
  rotateIcon.data.type = 'rotateThreedTool'
  rotateIcon.onMouseEnter = function (e: any) {
    planView.style.cursor = 'move'
  }
  rotateIcon.onMouseLeave = function (e: any) {
    planView.style.cursor = 'default'
  }
  rotateIcon.visible = false
  // @ts-expect-error
  toolsGroup[0].addChild(rotateIcon)
  
  // **
  resizeIcon = new paper.Raster('images/homedesign/expand.png')
  resizeIcon.data.type = 'stretchThreedXZTool'
  resizeIcon.onMouseEnter = function (e: any) {
    planView.style.cursor = 'move'
  }
  resizeIcon.onMouseLeave = function (e: any) {
    planView.style.cursor = 'default'
  }
  resizeIcon.visible = false
  // @ts-expect-error
  toolsGroup[0].addChild(resizeIcon)

  // **
  elevateIcon = new paper.Raster('images/homedesign/elevation.png')
  elevateIcon.data.type = 'elevateThreedTool'
  elevateIcon.onMouseEnter = function (e: any) {
    planView.style.cursor = 'row-resize'
  }
  elevateIcon.onMouseLeave = function (e: any) {
    planView.style.cursor = 'default'
  }
  elevateIcon.visible = false
  // @ts-expect-error
  toolsGroup[0].addChild(elevateIcon)

  // **
  heightIcon = new paper.Raster('images/homedesign/height.png')
  heightIcon.data.type = 'stretchThreedYTool'
  heightIcon.onMouseEnter = function (e: any) {
    planView.style.cursor = 'ns-resize'
  }
  heightIcon.onMouseLeave = function (e: any) {
    planView.style.cursor = 'default'
  }
  heightIcon.visible = false
  // @ts-expect-error
  toolsGroup[0].addChild(heightIcon)
  
  // ==============================================================
  // **
  wallHelperPath = new paper.Path.Line(
    new paper.Point(0, 0),
    new paper.Point(0, 0)
  )
  wallHelperPath.visible = false
  wallHelperPath.strokeColor = new paper.Color(0, 0, 0, 0)
  wallHelperPath.strokeWidth = 2
  wallHelperPath.strokeScaling = false
  // @ts-expect-error
  wallsGroup[paper.project.activeLayer.data.id].addChild(wallHelperPath)
  roofHelperPath = new paper.Path.Line(
    new paper.Point(0, 0),
    new paper.Point(0, 0)
  )
  roofHelperPath.visible = false
  roofHelperPath.strokeColor = new paper.Color(0, 0, 0, 0)
  roofHelperPath.strokeWidth = 2
  roofHelperPath.strokeScaling = false
  // @ts-expect-error
  roofsGroup[paper.project.activeLayer.data.id].addChild(roofHelperPath)
  floorHelperPath = new paper.Path.Line(
    new paper.Point(0, 0),
    new paper.Point(0, 0)
  )
  floorHelperPath.visible = false
  floorHelperPath.strokeColor = new paper.Color(177, 144, 100, 1) // '#b19064'
  floorHelperPath.strokeWidth = 2
  floorHelperPath.strokeScaling = false
  // @ts-expect-error
  floorsGroup[paper.project.activeLayer.data.id].addChild(floorHelperPath)
  dimensionHelperPath = new paper.Path.Line(
    new paper.Point(0, 0),
    new paper.Point(0, 0)
  )
  dimensionHelperPath.visible = false
  dimensionHelperPath.strokeColor = new paper.Color(177, 144, 100, 1) // '#b19064'
  dimensionHelperPath.strokeWidth = 2
  dimensionHelperPath.strokeScaling = false
  // @ts-expect-error
  dimensionsGroup[paper.project.activeLayer.data.id].addChild(dimensionHelperPath)


  var s = new paper.Rectangle(
    new paper.Point(0, 0), 
    new paper.Point(0, 0)
  )
  wallHelperRectangle = new paper.Path.Rectangle(s)
  wallHelperRectangle.strokeColor = new paper.Color(177, 144, 100, 1) // '#b19064'
  wallHelperRectangle.strokeWidth = 2
  wallHelperRectangle.strokeScaling = false
  s = new paper.Rectangle(
    new paper.Point(0, 0), 
    new paper.Point(0, 0)
  )
  roofHelperRectangle = new paper.Path.Rectangle(s)
  roofHelperRectangle.strokeColor = new paper.Color(177, 144, 100, 1) // '#b19064'
  roofHelperRectangle.strokeWidth = 2
  roofHelperRectangle.strokeScaling = false
  offsetMousePoint = new paper.Point(0, 0)

  /* */
  
  // ==============================================================
  // ** TOOLS: PAPER TOOL MANAGER
  tools = new paper.Tool()

  // ** TOOLS: MOUSE EVENT LISTENERS

  // ** ON MOUSE DOWN
  tools.onMouseDown = function (e: any) {
    // **
    console.debug('initThreeDPaperPlanView: tools.onMouseDown', e)

    /*
    if ('pointer' === threedTool)
      if (2 === e.event.buttons) mouseMode = -1
      else if (readOnly) mouseMode = -1
      else {
        var t = paper.project.hitTest(e.point)
        if (t) {
          if (t.item.data)
            if (t.item.data.level === paper.project.activeLayer.data.id.toString())
              if ('toolsRectangle' === t.item.data.type)
                (mouseMode = 0),
                  (offsetMousePoint = selectedItem.position.subtract(
                    e.point
                  )),
                  (offsetMousePoint.x = parseInt(offsetMousePoint.x)),
                  (offsetMousePoint.y = parseInt(offsetMousePoint.y))
              else if ('rotateThreedTool' === t.item.data.type)
                (mouseMode = 1), console.debug('isRotateTool')
              else if ('stretchThreedXZTool' === t.item.data.type)
                (mouseMode = 2), console.debug('isStretchXY')
              else if ('stretchThreedYTool' === t.item.data.type)
                console.debug('isStretchYTool'),
                  (mouseMode = 4),
                  (snapPoint = e.point),
                  (snapPoint.x = parseInt(e.point.x)),
                  (snapPoint.y = parseInt(e.point.y)),
                  scalingY
                    ? console.debug('this should never happen : scalingY')
                    : ((scalingY = true),
                      (stretchYStartHeight =
                        clickableObjects[selectedItem.data.id].userData.height 
                        *
                        clickableObjects[selectedItem.data.id].scale.y),
                      (stretchYPath = new paper.Path()),
                      // (stretchYPath.strokeColor = 'black'),
                      stretchYPath.add(snapPoint),
                      stretchYPath.add(snapPoint),
                      (stretchYPath.visible = true))
              else if ('elevateThreedTool' === t.item.data.type)
                (mouseMode = 5),
                  console.debug('isElevateTool'),
                  (snapPoint = e.point),
                  (snapPoint.x = parseInt(e.point.x)),
                  (snapPoint.y = parseInt(e.point.y)),
                  elevating
                    ? console.debug('this should never happen : elevating')
                    : ((elevating = true),
                      (elevateStartHeight =
                        clickableObjects[selectedItem.data.id].position.y),
                      (elevatePath = new paper.Path()),
                      // (elevatePath.strokeColor = 'black'),
                      elevatePath.add(snapPoint),
                      elevatePath.add(snapPoint),
                      (elevatePath.visible = true))
              else if ('threed' === t.item.data.type)
                selectedItem.data.id &&
                  (tween = new TWEEN.Tween(controls.target)
                    .to(clickableObjects[selectedItem.data.id].position, 500)
                    .onUpdate(render)
                    .start())
              else if ('wallRectangle' === t.item.data.type) {
                deselectAll()
                var o = Walls[t.item.data.id]
                o.bringToFront(),
                  (o.selected = true),
                  (selectedItem = o),
                  o.segments.forEach(function (e: any) {
                    var t = new paper.Raster('images/homedesign/movePointIcon.png')
                      ; (t.data.type = 'movePointIconWalls'),
                        (t.data.id = e.index),
                        (t.data.level = project.activeLayer.data.id),
                        (t.data.wallId = o.data.id),
                        (t.bounds.width = screenScale),
                        (t.bounds.height = screenScale),
                        (t.position = e.point),
                        (t.onMouseEnter = function (e: any) {
                          planView.style.cursor = 'move'
                        }),
                        (t.onMouseLeave = function (e: any) {
                          planView.style.cursor = 'default'
                        }),
                        (t.visible = true),
                        t.bringToFront(),
                        movePointIcons.push(t)
                  }),
                  (selectedMovePointIcon = null),
                  (movePointIconSelectedId = null)
                  // updateObjectPropertiesWindow()
              } else if ('roofRectangle' === t.item.data.type) {
                deselectAll()
                var a = Roofs[t.item.data.id]
                a.bringToFront(),
                  (a.selected = true),
                  (selectedItem = a),
                  a.segments.forEach(function (e: any) {
                    var t = new paper.Raster('images/homedesign/movePointIcon.png')
                      ; (t.data.type = 'movePointIconRoofs'),
                        (t.data.id = e.index),
                        (t.data.level = project.activeLayer.data.id),
                        (t.data.roofId = a.data.id),
                        (t.bounds.width = screenScale),
                        (t.bounds.height = screenScale),
                        (t.position = e.point),
                        (t.onMouseEnter = function (e: any) {
                          planView.style.cursor = 'move'
                        }),
                        (t.onMouseLeave = function (e: any) {
                          planView.style.cursor = 'default'
                        }),
                        (t.visible = true),
                        t.bringToFront(),
                        movePointIcons.push(t)
                  }),
                  (selectedMovePointIcon = null),
                  (movePointIconSelectedId = null)
                  // updateObjectPropertiesWindow()
              } else if ('movePointIconWalls' === t.item.data.type)
                movePointIcons.forEach(function (e: any) {
                  e.selected = false
                }),
                  (selectedMovePointIcon = t.item),
                  (selectedMovePointIcon.selected = true),
                  (movePointIconSelectedId = t.item.data.id),
                  // recalcAllUnjoinedWallSegments(selectedItem.data.id),
                  (mouseMode = 3)
              else if ('movePointIconRoofs' === t.item.data.type)
                movePointIcons.forEach(function (e: any) {
                  e.selected = false
                }),
                  (selectedMovePointIcon = t.item),
                  (selectedMovePointIcon.selected = true),
                  (movePointIconSelectedId = t.item.data.id),
                  // recalcAllUnjoinedRoofSegments(selectedItem.data.id),
                  (mouseMode = 11)
              else if ('movePointIconFloors' === t.item.data.type)
                movePointIcons.forEach(function (e: any) {
                  e.selected = false
                }),
                  (selectedMovePointIcon = t.item),
                  (selectedMovePointIcon.selected = true),
                  (movePointIconSelectedId = t.item.data.id),
                  // recalcAllWallCorners(),
                  (mouseMode = 6)
              else if ('floor' === t.item.data.type) {
                deselectAll()
                var n = Floors[t.item.data.id]
                  ; (n.selected = true),
                    (selectedItem = n),
                    n.segments.forEach(function (e: any) {
                      var t = new paper.Raster('images/homedesign/movePointIcon.png')
                        ; (t.data.type = 'movePointIconFloors'),
                          (t.data.id = e.index),
                          (t.data.level = project.activeLayer.data.id),
                          (t.bounds.width = screenScale),
                          (t.bounds.height = screenScale),
                          (t.position = e.point),
                          (t.onMouseEnter = function (e: any) {
                            planView.style.cursor = 'move'
                          }),
                          (t.onMouseLeave = function (e: any) {
                            planView.style.cursor = 'default'
                          }),
                          (t.visible = true),
                          t.bringToFront(),
                          movePointIcons.push(t)
                    }),
                    (selectedMovePointIcon = null),
                    (movePointIconSelectedId = null)
                    // updateObjectPropertiesWindow()
                for (
                  var l = { x: 0, y: 0, z: 0 },
                  i =
                    Floors3d[selectedItem.data.id].geometry.attributes
                      .position.array,
                  r = 0;
                  r < i.length;
                  r += 3
                )
                  (l.x += i[r]), (l.y += i[r + 2]), (l.z += i[r + 1])
                    ; (l.x /= i.length / 3),
                      (l.y /= i.length / 3),
                      (l.z /= i.length / 3),
                      (tween = new TWEEN.Tween(controls.target)
                        .to(l, 500)
                        .onUpdate(render)
                        .start())
                      // recalcAllWallCorners()
              } else
                'dimension' === t.item.data.type
                  ? (
                    deselectAll(),
                    (selectedItem = Dimensions[t.item.data.id].text),
                    (Dimensions[selectedItem.data.id].text.selected = true),
                    (Dimensions[selectedItem.data.id].line.selected = true),
                    updateObjectPropertiesWindow(),
                    recalcAllWallCorners(),
                    recalcAllRoofCorners()
                    )
                  : 'text' === t.item.data.type
                    ? (
                      deselectAll(),
                      (mouseMode = 7),
                      (selectedItem = Texts[t.item.data.id]),
                      (Texts[t.item.data.id].selected = true),
                      (editingTextId = t.item.data.id),
                      updateObjectPropertiesWindow()
                      )
                    : console.debug('mouse down not handled')
            else
              t.item.data.level === -1 &&
                ('verticalGuide' === t.item.data.type
                  ? ((selectedGuideId = t.item.data.id), (mouseMode = 9))
                  : 'horizontalGuide' === t.item.data.type &&
                  ((selectedGuideId = t.item.data.id), (mouseMode = 10)))
        } else console.debug('hit result nothing'), (mouseMode = -1)
      }
    else if ('walls' === threedTool)
      if (2 === e.event.buttons) mouseMode = -1
      else {
        if (((mouseMode = 0), Date.now() - lastNewWallSegmentClick > 250)) {
          if (
            ((snapPoint = e.point),
              (snapPoint.x = parseInt(e.point.x)),
              (snapPoint.y = parseInt(e.point.y)),
              ctrlKeyPressed &&
              ((snapPoint.x = snapPoint.x - (snapPoint.x % 10)),
                (snapPoint.y = snapPoint.y - (snapPoint.y % 10))),
              recalcAllUnjoinedWallSegments(wallIdCounter),
              recalcAllWallSegmentsOnOtherLevels(
                wallIdCounter,
                paper.project.activeLayer.data.id
              ),
              startedDrawingWalls)
          ) {
            var s = e.point.subtract(wallHelperPath.segments[0].point)
            ctrlKeyPressed && (s.angle = 15 * Math.round(s.angle / 15)),
              (snapPoint = wallHelperPath.segments[0].point.add(s)),
              snapPointOverride.id &&
              ((snapPoint = new paper.Point(
                snapPointOverride.x,
                snapPointOverride.y
              )),
                (snapPointOverride = {}))
            try {
              var d = wallPath.add(snapPoint),
                c = wallPath.segments[wallPath.segments.length - 2].point,
                u = wallPath.segments[wallPath.segments.length - 1].point,
                p = getAngleRadians(c, u),
                m = new paper.Path()
                ; (m.data.type = 'wallRectangle'),
                  (m.data.id = wallPath.data.id),
                  (m.data.level = project.activeLayer.data.id),
                  (m.fillColor = new paper.Color(1, 0.9, 0, 0.25)),
                  (m.strokeColor = '#b19064'),
                  (m.strokeWidth = 1),
                  (m.strokeScaling = false),
                  (m.segments = wallHelperRectangle.segments),
                  (m.closed = true),
                  (wallsRectangles[wallPath.data.id] = m),
                  wallsGroup[project.activeLayer.data.id].addChild(
                    wallsRectangles[wallPath.data.id]
                  )
              var g = wallHelper3dCube.geometry.clone(),
                y = new THREE.Mesh(g, wallMaterial)
                ; (y.position.x = wallHelper3dCube.position.x),
                  (y.position.y = wallHelper3dCube.position.y),
                  (y.position.z = wallHelper3dCube.position.z),
                  (y.userData.id = wallPath.data.id),
                  (y.userData.level = wallPath.data.level),
                  (y.frustumCulled = false),
                  y.geometry.computeFlatVertexNormals(),
                  scene.add(y),
                  (wallsRectangles3d[wallPath.data.id] = y),
                  (d.data = { angleRadians: p, id: wallPath.data.id }),
                  (plan.walls[wallPath.data.id] = {
                    id: wallPath.data.id,
                    wallPath: wallPath,
                  }),
                  relinkWallReferences(project.activeLayer.data.id),
                  updatePlanHistory(
                    plan,
                    null,
                    null,
                    null,
                    wallPath.data.id,
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
                  ),
                  wallPath.segments.length > 2 &&
                  alert('problem to many segments'),
                  (wallPath = new paper.Path()),
                  (wallPath.strokeColor = new paper.Color(0, 0, 0, 0)),
                  wallPath.add(snapPoint),
                  (wallPath.data.join0 = { id: null, seg: null }),
                  (wallPath.data.join1 = { id: null, seg: null }),
                  updateObjectPropertiesWindow(),
                  wallIdCounter++,
                  (wallPath.data.id = wallIdCounter),
                  (wallPath.data.type = 'wallPath'),
                  (wallPath.data.thickness = defaultWallThickness),
                  (wallPath.data.height = [
                    defaultWallHeight,
                    defaultWallHeight,
                  ]),
                  (wallPath.data.level = project.activeLayer.data.id),
                  (Walls[wallPath.data.id] = wallPath),
                  (selectedItem = wallPath)
            } catch (e) {
              console.debug(e)
            }
          } else
            (startedDrawingWalls = true),
              (wallPath = new paper.Path()),
              (wallPath.strokeColor = new paper.Color(0, 0, 0, 0)),
              snapPointOverride.id &&
              ((snapPoint = new paper.Point(
                snapPointOverride.x,
                snapPointOverride.y
              )),
                (snapPointOverride = {})),
              wallPath.add(snapPoint),
              wallIdCounter++,
              (wallPath.data.id = wallIdCounter),
              (wallPath.data.join0 = { id: null, seg: null }),
              (wallPath.data.join1 = { id: null, seg: null }),
              (wallPath.data.type = 'wallPath'),
              (wallPath.data.thickness = defaultWallThickness),
              (wallPath.data.height = [defaultWallHeight, defaultWallHeight]),
              (wallPath.data.level = project.activeLayer.data.id),
              (Walls[wallPath.data.id] = wallPath),
              (selectedItem = wallPath),
              updateObjectPropertiesWindow()
              ; (wallHelperPath.segments[0].point = snapPoint),
                (wallHelperPath.segments[1].point = snapPoint),
                wallHelperPath.bringToFront(),
                (wallHelperPath.visible = true),
                (wallHelperRectangle.segments[0].point = new Point(0, 0)),
                (wallHelperRectangle.segments[1].point = new Point(0, 0)),
                (wallHelperRectangle.segments[2].point = new Point(0, 0)),
                (wallHelperRectangle.segments[3].point = new Point(0, 0)),
                (wallHelperRectangle.visible = true),
                (wallHelper3dCube.geometry.vertices[1].x =
                  wallHelperRectangle.segments[0].point.x),
                (wallHelper3dCube.geometry.vertices[1].z =
                  wallHelperRectangle.segments[0].point.y),
                (wallHelper3dCube.geometry.vertices[3].x =
                  wallHelperRectangle.segments[0].point.x),
                (wallHelper3dCube.geometry.vertices[3].z =
                  wallHelperRectangle.segments[0].point.y),
                (wallHelper3dCube.geometry.vertices[0].x =
                  wallHelperRectangle.segments[1].point.x),
                (wallHelper3dCube.geometry.vertices[0].z =
                  wallHelperRectangle.segments[1].point.y),
                (wallHelper3dCube.geometry.vertices[2].x =
                  wallHelperRectangle.segments[1].point.x),
                (wallHelper3dCube.geometry.vertices[2].z =
                  wallHelperRectangle.segments[1].point.y),
                (wallHelper3dCube.geometry.vertices[5].x =
                  wallHelperRectangle.segments[2].point.x),
                (wallHelper3dCube.geometry.vertices[5].z =
                  wallHelperRectangle.segments[2].point.y),
                (wallHelper3dCube.geometry.vertices[7].x =
                  wallHelperRectangle.segments[2].point.x),
                (wallHelper3dCube.geometry.vertices[7].z =
                  wallHelperRectangle.segments[2].point.y),
                (wallHelper3dCube.geometry.vertices[4].x =
                  wallHelperRectangle.segments[3].point.x),
                (wallHelper3dCube.geometry.vertices[4].z =
                  wallHelperRectangle.segments[3].point.y),
                (wallHelper3dCube.geometry.vertices[6].x =
                  wallHelperRectangle.segments[3].point.x),
                (wallHelper3dCube.geometry.vertices[6].z =
                  wallHelperRectangle.segments[3].point.y),
                (wallHelper3dCube.geometry.verticesNeedUpdate = true),
                (wallHelper3dCube.visible = true),
                (tween = new TWEEN.Tween(controls.target)
                  .to(wallHelper3dCube.position, 500)
                  .onUpdate(render)
                  .start()),
                snapPointOverride.id &&
                ((snapPointOverride = {}), setEndDrawingWalls())
        }
        lastNewWallSegmentClick = Date.now()
      }
    else if ('roof' === threedTool)
      if (2 === e.event.buttons) mouseMode = -1
      else {
        if (((mouseMode = 0), Date.now() - lastNewRoofSegmentClick > 250)) {
          if (
            ((snapPoint = e.point),
              (snapPoint.x = parseInt(e.point.x)),
              (snapPoint.y = parseInt(e.point.y)),
              ctrlKeyPressed &&
              ((snapPoint.x = snapPoint.x - (snapPoint.x % 10)),
                (snapPoint.y = snapPoint.y - (snapPoint.y % 10))),
              recalcAllUnjoinedRoofSegments(roofIdCounter),
              recalcAllRoofSegmentsOnOtherLevels(
                roofIdCounter,
                project.activeLayer.data.id
              ),
              startedDrawingRoofs)
          ) {
            var s = e.point.subtract(roofHelperPath.segments[0].point)
            ctrlKeyPressed && (s.angle = 15 * Math.round(s.angle / 15)),
              (snapPoint = roofHelperPath.segments[0].point.add(s)),
              snapPointOverride.id &&
              ((snapPoint = new paper.Point(
                snapPointOverride.x,
                snapPointOverride.y
              )),
                (snapPointOverride = {}))
            try {
              var d = roofPath.add(snapPoint),
                c = roofPath.segments[roofPath.segments.length - 2].point,
                u = roofPath.segments[roofPath.segments.length - 1].point,
                p = getAngleRadians(c, u),
                f = new Path()
                ; (f.data.type = 'roofRectangle'),
                  (f.data.id = roofPath.data.id),
                  (f.data.level = project.activeLayer.data.id),
                  (f.fillColor = new paper.Color(0.35, 0.65, 0.85, 0.25)),
                  (f.strokeColor = '#b19064'),
                  (f.strokeWidth = 1),
                  (f.strokeScaling = false),
                  (f.segments = roofHelperRectangle.segments),
                  (f.closed = true),
                  (roofsRectangles[roofPath.data.id] = f),
                  roofsGroup[project.activeLayer.data.id].addChild(
                    roofsRectangles[roofPath.data.id]
                  )
              var g = roofHelper3dCube.geometry.clone(),
                h = new THREE.Mesh(g, roofMaterial)
                ; (h.position.x = roofHelper3dCube.position.x),
                  (h.position.y = roofHelper3dCube.position.y),
                  (h.position.z = roofHelper3dCube.position.z),
                  (h.userData.id = roofPath.data.id),
                  (h.userData.level = roofPath.data.level),
                  (h.frustumCulled = false),
                  h.geometry.computeFlatVertexNormals(),
                  scene.add(h),
                  (roofsRectangles3d[roofPath.data.id] = h),
                  (d.data = { angleRadians: p, id: roofPath.data.id }),
                  (plan.roofs[roofPath.data.id] = {
                    id: roofPath.data.id,
                    roofPath: roofPath,
                  }),
                  relinkRoofReferences(project.activeLayer.data.id),
                  updatePlanHistory(
                    plan,
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
                    roofPath.data.id,
                    null,
                    null
                  ),
                  roofPath.segments.length > 2 &&
                  alert('problem to many segments'),
                  (roofPath = new paper.Path()),
                  (roofPath.strokeColor = new paper.Color(0, 0, 0, 0)),
                  roofPath.add(snapPoint),
                  (roofPath.data.join0 = { id: null, seg: null }),
                  (roofPath.data.join1 = { id: null, seg: null }),
                  updateObjectPropertiesWindow(),
                  roofIdCounter++,
                  (roofPath.data.id = roofIdCounter),
                  (roofPath.data.type = 'roofPath'),
                  (roofPath.data.width = defaultRoofWidth),
                  (roofPath.data.rise = defaultRoofRise),
                  (roofPath.data.startHeight = defaultRoofStartHeight),
                  (roofPath.data.thickness = defaultRoofThickness),
                  (roofPath.data.level = project.activeLayer.data.id),
                  (Roofs[roofPath.data.id] = roofPath),
                  (selectedItem = roofPath)
            } catch (e) {
              console.debug(e)
            }
          } else
            (startedDrawingRoofs = true),
              (roofPath = new paper.Path()),
              (roofPath.strokeColor = new paper.Color(0, 0, 0, 0)),
              snapPointOverride.id &&
              ((snapPoint = new paper.Point(
                snapPointOverride.x,
                snapPointOverride.y
              )),
                (snapPointOverride = {})),
              roofPath.add(snapPoint),
              roofIdCounter++,
              (roofPath.data.id = roofIdCounter),
              (roofPath.data.join0 = { id: null, seg: null }),
              (roofPath.data.join1 = { id: null, seg: null }),
              (roofPath.data.type = 'roofPath'),
              (roofPath.data.width = defaultRoofWidth),
              (roofPath.data.rise = defaultRoofRise),
              (roofPath.data.startHeight = defaultRoofStartHeight),
              (roofPath.data.thickness = defaultRoofThickness),
              (roofPath.data.level = project.activeLayer.data.id),
              (Roofs[roofPath.data.id] = roofPath),
              (selectedItem = roofPath),
              updateObjectPropertiesWindow()
              ; (roofHelperPath.segments[0].point = snapPoint),
                (roofHelperPath.segments[1].point = snapPoint),
                roofHelperPath.bringToFront(),
                (roofHelperPath.visible = true),
                (roofHelperRectangle.segments[0].point = new Point(0, 0)),
                (roofHelperRectangle.segments[1].point = new Point(0, 0)),
                (roofHelperRectangle.segments[2].point = new Point(0, 0)),
                (roofHelperRectangle.segments[3].point = new Point(0, 0)),
                (roofHelperRectangle.visible = true),
                (roofHelper3dCube.geometry.vertices[1].x =
                  roofHelperRectangle.segments[0].point.x),
                (roofHelper3dCube.geometry.vertices[1].z =
                  roofHelperRectangle.segments[0].point.y),
                (roofHelper3dCube.geometry.vertices[3].x =
                  roofHelperRectangle.segments[0].point.x),
                (roofHelper3dCube.geometry.vertices[3].z =
                  roofHelperRectangle.segments[0].point.y),
                (roofHelper3dCube.geometry.vertices[0].x =
                  roofHelperRectangle.segments[1].point.x),
                (roofHelper3dCube.geometry.vertices[0].z =
                  roofHelperRectangle.segments[1].point.y),
                (roofHelper3dCube.geometry.vertices[2].x =
                  roofHelperRectangle.segments[1].point.x),
                (roofHelper3dCube.geometry.vertices[2].z =
                  roofHelperRectangle.segments[1].point.y),
                (roofHelper3dCube.geometry.vertices[5].x =
                  roofHelperRectangle.segments[2].point.x),
                (roofHelper3dCube.geometry.vertices[5].z =
                  roofHelperRectangle.segments[2].point.y),
                (roofHelper3dCube.geometry.vertices[7].x =
                  roofHelperRectangle.segments[2].point.x),
                (roofHelper3dCube.geometry.vertices[7].z =
                  roofHelperRectangle.segments[2].point.y),
                (roofHelper3dCube.geometry.vertices[4].x =
                  roofHelperRectangle.segments[3].point.x),
                (roofHelper3dCube.geometry.vertices[4].z =
                  roofHelperRectangle.segments[3].point.y),
                (roofHelper3dCube.geometry.vertices[6].x =
                  roofHelperRectangle.segments[3].point.x),
                (roofHelper3dCube.geometry.vertices[6].z =
                  roofHelperRectangle.segments[3].point.y)
          var v = defaultRoofThickness / 2,
            w = defaultRoofRise / 2
            ; (roofHelper3dCube.geometry.vertices[0].y = v - w),
              (roofHelper3dCube.geometry.vertices[1].y = v - w),
              (roofHelper3dCube.geometry.vertices[4].y = v + w),
              (roofHelper3dCube.geometry.vertices[5].y = v + w),
              (roofHelper3dCube.geometry.vertices[2].y = -v - w),
              (roofHelper3dCube.geometry.vertices[3].y = -v - w),
              (roofHelper3dCube.geometry.vertices[6].y = -v + w),
              (roofHelper3dCube.geometry.vertices[7].y = -v + w),
              (roofHelper3dCube.geometry.verticesNeedUpdate = true),
              (roofHelper3dCube.visible = true),
              (tween = new TWEEN.Tween(controls.target)
                .to(roofHelper3dCube.position, 500)
                .onUpdate(render)
                .start()),
              snapPointOverride.id &&
              ((snapPointOverride = {}), setEndDrawingRoofs())
        }
        lastNewRoofSegmentClick = Date.now()
      }
    else if ('background' === threedTool) {
      var t = project.hitTest(e.point)
      t && t.item.data
        ? 'background' === t.item.data.type
          ? ((mouseMode = 0),
            (offsetMousePoint = selectedItem.position.subtract(e.point)),
            (offsetMousePoint.x = parseInt(offsetMousePoint.x)),
            (offsetMousePoint.y = parseInt(offsetMousePoint.y)))
          : 'stretchThreedXZTool' === t.item.data.type
            ? (mouseMode = 2)
            : 'verticalGuide' === t.item.data.type
              ? (console.debug(t.item.data.type),
                (selectedGuideId = t.item.data.id),
                (mouseMode = 9))
              : 'horizontalGuide' === t.item.data.type &&
              (console.debug(t.item.data.type),
                (selectedGuideId = t.item.data.id),
                (mouseMode = 10))
        : (mouseMode = -1)
    } else if ('floor' === threedTool)
      2 === e.event.buttons
        ? (mouseMode = -1)
        : ((mouseMode = 0),
          Date.now() - lastNewFloorSegmentClick > 250 &&
          (startedDrawingFloor
            ? (floorPath.add(snapPoint),
              (floorHelperPath.segments[0].point = snapPoint),
              (floorHelperPath.segments[1].point = snapPoint),
              redrawFloor(floorPath),
              (plan.floors[floorPath.data.id] = {
                id: floorPath.data.id,
                floorPath: floorPath,
              }),
              2 === floorPath.segments.length
                ? updatePlanHistory(
                  plan,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  floorPath.data.id,
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
                : updatePlanHistory(
                  plan,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  floorPath.data.id,
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
                ),
              render())
            : ((startedDrawingFloor = true),
              (floorPath = new Path()),
              (floorPath.data.type = 'floor'),
              (floorPath.strokeColor = '#b19064'),
              (floorPath.strokeWidth = 2),
              (floorPath.strokeScaling = false),
              (floorPath.fillColor = new paper.Color(0.5, 0.5, 0.5, 0.5)),
              floorPath.add(snapPoint),
              floorIdCounter++,
              (floorPath.data.id = floorIdCounter),
              (floorPath.data.thickness = defaultFloorThickness),
              (floorPath.data.level = project.activeLayer.data.id),
              (Floors[floorIdCounter] = floorPath),
              floorsGroup[project.activeLayer.data.id].addChild(
                Floors[floorIdCounter]
              ),
              (floorHelperPath.segments[0].point = snapPoint),
              (floorHelperPath.segments[1].point = snapPoint),
              (floorHelperPath.visible = true))),
          (lastNewFloorSegmentClick = Date.now()))
    else if ('dimension' === threedTool)
      if (2 === e.event.buttons) mouseMode = -1
      else if (((mouseMode = 0), startedDrawingDimension))
        if (1 === dimensionPath.segments.length) dimensionPath.add(snapPoint)
        else {
          var s = dimensionHelperPath.segments[1].point.subtract(
            dimensionHelperPath.segments[0].point
          ),
            I = dimensionHelperPath.segments[1].point.subtract(snapPoint),
            P = (I.angle - s.angle + 360) % 360,
            b = (P / 180) * Math.PI,
            x = I.length * Math.sin(b)
            ; (dimensionPath.data.adjacent = x), (dimensionPath.visible = false)
          var s = dimensionPath.segments[1].point.subtract(
            dimensionPath.segments[0].point
          ),
            R = new paper.Path()
            ; (R.data.id = dimensionPath.data.id),
              (R.data.level = project.activeLayer.data.id),
              (R.data.type = 'dimension'),
              (R.style = {
                strokeColor: 'white',
                strokeWidth: 1,
                strokeScaling: false,
              }),
              R.moveTo(dimensionPath.segments[0].point),
              R.lineBy(s.normalize(x).rotate(-90)),
              R.lineBy(s.normalize(7.5).rotate(-270)),
              R.lineBy(s.normalize(10).rotate(-225)),
              R.lineBy(s.normalize(20).rotate(-45)),
              R.lineBy(s.normalize(10).rotate(-225)),
              R.lineBy(s.normalize(s.length / 2))
          var M = R.lastSegment.point
          R.lineBy(s.normalize(s.length / 2)),
            R.lineBy(s.normalize(10).rotate(-225)),
            R.lineBy(s.normalize(20).rotate(-45)),
            R.lineBy(s.normalize(10).rotate(-225)),
            R.lineBy(s.normalize(7.5).rotate(-90)),
            R.lineBy(s.normalize(x).rotate(90))
          var k = new paper.PointText({})
          Math.abs(s.angle) > 90
            ? ((k.fontFamily = 'Courier New'),
              (k.fillColor = 'white'),
              (k.point = M.add(s.normalize(-8).rotate(-90))),
              (k.justification = 'center'),
              (k.fontSize = screenScale / 1.5),
              k.rotate(180 + s.angle),
              (k.data.id = dimensionPath.data.id),
              (k.data.level = project.activeLayer.data.id),
              (k.data.type = 'dimension'))
            : ((k.fontFamily = 'Courier New'),
              (k.fillColor = 'white'),
              (k.point = M.add(s.normalize(8).rotate(-90))),
              (k.justification = 'center'),
              (k.fontSize = screenScale / 1.5),
              k.rotate(s.angle),
              (k.data.id = dimensionPath.data.id),
              (k.data.level = project.activeLayer.data.id),
              (k.data.type = 'dimension'))
          var E = s.length
            ; (k.content = Math.floor(1e3 * E) / 1e3),
              (Dimensions[dimensionPath.data.id] = {
                id: dimensionPath.data.id,
                dimensionPath: dimensionPath,
                line: R,
                text: k,
              }),
              (plan.dimensions[dimensionPath.data.id] = {
                id: dimensionPath.data.id,
                dimensionPath: dimensionPath,
              }),
              updatePlanHistory(
                plan,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                dimensionPath.data.id,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null
              ),
              setEndDrawingDimension()
        }
      else
        (startedDrawingDimension = true),
          (dimensionPath = new Path()),
          (dimensionPath.data.type = 'dimension'),
          (dimensionPath.strokeColor = 'white'),
          dimensionPath.add(snapPoint),
          dimensionIdCounter++,
          (dimensionPath.data.id = dimensionIdCounter),
          (dimensionPath.data.adjacent = 0),
          (dimensionPath.data.level = project.activeLayer.data.id),
          (dimensionPath.visible = false),
          dimensionsGroup[dimensionPath.data.level].addChild(dimensionPath),
          (dimensionHelperPath.segments[0].point = snapPoint),
          (dimensionHelperPath.segments[1].point = snapPoint),
          (dimensionHelperPath.visible = true)
    else if ('text' === threedTool)
      if (2 === e.event.buttons) mouseMode = -1
      else if (((mouseMode = 0), !startedDrawingText)) {
        deselectAll(), (startedDrawingText = true)
        var k = new paper.PointText({})
          ; (k.fontFamily = 'Courier New'),
            (k.fillColor = 'white'),
            (k.point = e.point),
            (k.justification = 'center'),
            (k.fontSize = screenScale / 1.5),
            textIdCounter++,
            (k.data.id = textIdCounter),
            (editingTextId = k.data.id),
            (k.data.type = 'text'),
            (k.data.value = ''),
            (k.data.x = k.point.x),
            (k.data.y = k.point.y),
            (k.data.level = project.activeLayer.data.id),
            textsGroup[project.activeLayer.data.id].addChild(k),
            (k.content = k.data.value),
            (Texts[k.data.id] = k),
            (plan.texts[k.data.id] = { id: k.data.id, data: k.data }),
            updatePlanHistory(
              plan,
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
              k.data.id,
              null,
              null,
              null,
              null,
              null
            ),
            (selectedItem = Texts[k.data.id]),
            (Texts[k.data.id].selected = true),
            updateObjectPropertiesWindow(),
            (document.getElementById('textValueProp').style.backgroundColor =
              '#4e4e4e'),
            document.getElementById('textValueProp').select(),
            (startedDrawingText = false)
      }
    */
  }

  // ** ON MOUSE UP
  tools.onMouseUp = function (e: any) {
    // **
    console.debug('initThreeDPaperPlanView: tools.onMouseUp', e)

    /*
    0 === mouseMode && dragging
      ? selectedItem &&
        selectedItem.data &&
        'threed' === selectedItem.data.type
        ? ((dragging = false),
          (mouseMode = -1),
          updatePlanHistory(
            plan,
            null,
            selectedItem.data.id,
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
          ),
          applyMasksToWalls(project.activeLayer.data.id),
          applyMasksToRoofs(project.activeLayer.data.id),
          redrawLevelsFloors(project.activeLayer.data.id))
        : console.debug('*** mouseup, mousemode=0, ' + selectedItem)
      : 1 === mouseMode && rotating
        ? ((rotating = false),
          (mouseMode = -1),
          (selectedItem.data.angle = selectedItem.rotation),
          updatePlanHistory(
            plan,
            null,
            selectedItem.data.id,
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
          ),
          applyMasksToWalls(project.activeLayer.data.id),
          applyMasksToRoofs(project.activeLayer.data.id),
          redrawLevelsFloors(project.activeLayer.data.id))
        : 2 === mouseMode && scalingXY
          ? ((scalingXY = false),
            (mouseMode = -1),
            updatePlanHistory(
              plan,
              null,
              selectedItem.data.id,
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
            ),
            applyMasksToWalls(project.activeLayer.data.id),
            applyMasksToRoofs(project.activeLayer.data.id),
            redrawLevelsFloors(project.activeLayer.data.id))
          : 3 === mouseMode
            ? (snapPointOverride.id &&
              ((selectedItem.segments[movePointIconSelectedId].point.x =
                snapPointOverride.x),
                (selectedItem.segments[movePointIconSelectedId].point.y =
                  snapPointOverride.y),
                (snapPointOverride = {})),
              relinkWallReferences(project.activeLayer.data.id),
              updatePlanHistory(
                plan,
                null,
                null,
                null,
                null,
                selectedItem.data.id,
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
              ))
            : 11 === mouseMode
              ? (snapPointOverride.id &&
                ((selectedItem.segments[movePointIconSelectedId].point.x =
                  snapPointOverride.x),
                  (selectedItem.segments[movePointIconSelectedId].point.y =
                    snapPointOverride.y),
                  (snapPointOverride = {})),
                relinkRoofReferences(project.activeLayer.data.id),
                updatePlanHistory(
                  plan,
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
                  selectedItem.data.id,
                  null
                ))
              : 4 === mouseMode && scalingY
                ? ((scalingY = false),
                  (mouseMode = -1),
                  (stretchYPath.visible = false),
                  (clickableObjects[selectedItem.data.id].userData.height +=
                    stretchYPath.length),
                  updatePlanHistory(
                    plan,
                    null,
                    selectedItem.data.id,
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
                  ),
                  applyMasksToWalls(project.activeLayer.data.id),
                  applyMasksToRoofs(project.activeLayer.data.id),
                  redrawLevelsFloors(project.activeLayer.data.id))
                : 5 === mouseMode && elevating
                  ? ((elevating = false),
                    (mouseMode = -1),
                    (elevatePath.visible = false),
                    updatePlanHistory(
                      plan,
                      null,
                      selectedItem.data.id,
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
                    ),
                    applyMasksToWalls(project.activeLayer.data.id),
                    applyMasksToRoofs(project.activeLayer.data.id),
                    redrawLevelsFloors(project.activeLayer.data.id))
                  : 6 === mouseMode
                    ? updatePlanHistory(
                      plan,
                      null,
                      null,
                      null,
                      null,
                      null,
                      null,
                      null,
                      selectedItem.data.id,
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
                    : 7 === mouseMode
                      ? updatePlanHistory(
                        plan,
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
                        selectedItem.data.id,
                        null,
                        null,
                        null,
                        null
                      )
                      : 9 === mouseMode
                        ? ((selectedGuideId = -1), (mouseMode = -1))
                        : 10 === mouseMode && ((selectedGuideId = -1), (mouseMode = -1))

    */
  } // END tools.onMouseUp()

  // ** ON MOUSE DRAG
  tools.onMouseDrag = function (e: any) {
    // **
    // console.debug('initThreeDPaperPlanView: tools.onMouseDrag', e)

    /*
    var t = e.downPoint.subtract(e.point)
    if (mouseMode === -1) {
      paper.view.center = paper.view.center.add(t)
      redrawGrid()
    }
    else if (9 === mouseMode) {
      verticalGuides[selectedGuideId].position.x =
        parseInt(e.point.x / snapTolerance) * snapTolerance
    }
    else if (10 === mouseMode) {
      horizontalGuides[selectedGuideId].position.y =
        parseInt(e.point.y / snapTolerance) * snapTolerance
    }
    else if ('pointer' === threedTool) {
      if (0 === mouseMode) {
        if (
          ((dragging = true),
            (snapPoint = e.point),
            (snapPoint.x = parseInt(e.point.x)),
            (snapPoint.y = parseInt(e.point.y)),
            ctrlKeyPressed &&
            ((snapPoint.x = snapPoint.x - (snapPoint.x % 10)),
              (snapPoint.y = snapPoint.y - (snapPoint.y % 10))),
            selectedItem)
        ) {
          var o = null
          if (selectedItem.useMask) {
            var a = 25,
              n = 0,
              l = -1
            if (
              (Object.keys(Walls).forEach(function (e: any) {
                var t = Walls[e]
                if (
                  'object' == typeof t &&
                  t.data.level === project.activeLayer.data.id
                ) {
                  var i = t.getNearestPoint(snapPoint),
                    r = snapPoint.getDistance(i)
                  if (r <= a) {
                    ; (a = r), (o = i)
                    var s = t.segments[0].point.subtract(t.segments[1].point)
                      ; (n = s.angle), (l = e)
                  }
                }
              }),
                o)
            ) {
              new Path.Circle({
                center: o,
                radius: screenScale / 2,
                fillColor: new paper.Color(0.3, 1, 0.5, 0.75),
                strokeWidth: 1,
              })
                .removeOnMove()
                .removeOnDrag(),
                (snapPoint = o),
                (selectedItem.data.angle = n),
                selectedItem.data.toolsRectangleInner &&
                selectedItem.data.toolsRectangleInner.remove(),
                (selectedItem.rotation = 0)
              var i = new paper.Path.Rectangle(selectedItem.bounds)
                ; (selectedItem.rotation = selectedItem.data.angle),
                  (i.data.type = 'toolsRectangle'),
                  (i.strokeColor = '#b19064'),
                  (i.strokeWidth = 1),
                  (i.strokeScaling = false),
                  (i.locked = true),
                  (selectedItem.data.toolsRectangleInner = i),
                  i.rotate(selectedItem.data.angle),
                  (threedAngleProp.innerText = (
                    (selectedItem.rotation + 360) %
                    360
                  ).toFixed(2)),
                  (plan.threed[selectedItem.data.id].angle =
                    selectedItem.rotation),
                  (rotateIcon.position =
                    selectedItem.data.toolsRectangleInner.segments[1].point),
                  (resizeIcon.position =
                    selectedItem.data.toolsRectangleInner.segments[3].point),
                  (heightIcon.position =
                    selectedItem.data.toolsRectangleInner.segments[2].point),
                  (elevateIcon.position =
                    selectedItem.data.toolsRectangleInner.segments[0].point),
                  (clickableObjects[selectedItem.data.id].rotation.y =
                    (((selectedItem.rotation + 180) % 360) / 180) * Math.PI),
                  (clickableObjects[selectedItem.data.id].rotation.x = Math.PI),
                  (clickableObjects[selectedItem.data.id].rotation.z = Math.PI),
                  maskObjects[selectedItem.data.id] &&
                  ((maskObjects[selectedItem.data.id].rotation.y =
                    (((selectedItem.rotation + 180) % 360) / 180) * Math.PI),
                    (maskObjects[selectedItem.data.id].rotation.x = Math.PI),
                    (maskObjects[selectedItem.data.id].rotation.z = Math.PI)),
                  (selectedItem.position = snapPoint),
                  (toolsGroup[0].position = snapPoint),
                  applyMasksToWall(
                    l,
                    wallsRectangles3d[l],
                    project.activeLayer.data.id
                  )
            } else snapPoint = snapPoint.add(offsetMousePoint)
          } else snapPoint = snapPoint.add(offsetMousePoint)
          if (null === o) {
            var r
            Object.keys(verticalGuides).forEach(function (e: any) {
              snapPoint.x >= verticalGuides[e].position.x - 10 &&
                snapPoint.x <= verticalGuides[e].position.x + 10 &&
                (r = new paper.Point(
                  verticalGuides[e].position.x,
                  snapPoint.y
                ))
            }),
              Object.keys(horizontalGuides).forEach(function (e: any) {
                snapPoint.y >= horizontalGuides[e].position.y - 10 &&
                  snapPoint.y <= horizontalGuides[e].position.y + 10 &&
                  (r
                    ? (r.y = horizontalGuides[e].position.y)
                    : (r = new paper.Point(
                      snapPoint.x,
                      horizontalGuides[e].position.y
                    )))
              }),
              r &&
              ((snapPoint = r),
                new Path.Circle({
                  center: snapPoint,
                  radius: screenScale / 2,
                  fillColor: new paper.Color(1, 0.3, 0.5, 0.75),
                  strokeWidth: 1,
                })
                  .removeOnMove()
                  .removeOnDrag())
          }
          if (threedItems[selectedItem.data.name].pivot) {
            var s = threedItems[selectedItem.data.name].pivot
            if (1 === selectedItem.data.flipZ) {
              var d = snapPoint.add(new paper.Point(s).rotate(n)),
                c = snapPoint,
                u = c.subtract(d)
              snapPoint = snapPoint.add(u)
            } else {
              var d = snapPoint.add(new paper.Point(s.x, -s.y).rotate(n)),
                c = snapPoint,
                u = c.subtract(d)
              snapPoint = snapPoint.add(u)
            }
          }
          ; (selectedItem.position = snapPoint),
            (toolsGroup[0].position = snapPoint),
            (selectedItem.data.toolsRectangleInner.position =
              selectedItem.position)
          var p = snapPoint.x,
            m = snapPoint.y
          selectedItem.data.id &&
            ((clickableObjects[selectedItem.data.id].position.x = p),
              (clickableObjects[selectedItem.data.id].position.z = m),
              maskObjects[selectedItem.data.id] &&
              ((maskObjects[selectedItem.data.id].position.x = p),
                (maskObjects[selectedItem.data.id].position.z = m)),
              (controls.target.x = p),
              (controls.target.z = m),
              setTimeout(function () {
                render()
              }, 1)),
            (threedXProp.value = p.toFixed(3)),
            (threedZProp.value = m.toFixed(3))
        }
      } else if (1 === mouseMode) {
        var g = selectedItem.bounds.center,
          y = g.subtract(e.lastPoint),
          f = g.subtract(e.point),
          n = (f.angle - y.angle + 360) % 360
        if (((selectedItem.data.angle += n), ctrlKeyPressed)) {
          var h = 15 * Math.round(selectedItem.data.angle / 15)
          selectedItem.data.toolsRectangleInner &&
            selectedItem.data.toolsRectangleInner.remove(),
            (selectedItem.rotation = 0)
          var i = new paper.Path.Rectangle(selectedItem.bounds)
            ; (selectedItem.rotation = h),
              (i.data.type = 'toolsRectangle'),
              (i.strokeColor = '#b19064'),
              (i.strokeWidth = 1),
              (i.strokeScaling = false),
              (i.locked = true),
              (selectedItem.data.toolsRectangleInner = i),
              i.rotate(h)
        } else {
          selectedItem.data.toolsRectangleInner &&
            selectedItem.data.toolsRectangleInner.remove(),
            (selectedItem.rotation = 0)
          var i = new paper.Path.Rectangle(selectedItem.bounds)
            ; (selectedItem.rotation = selectedItem.data.angle),
              (i.data.type = 'toolsRectangle'),
              (i.strokeColor = '#b19064'),
              (i.strokeWidth = 1),
              (i.strokeScaling = false),
              (i.locked = true),
              (selectedItem.data.toolsRectangleInner = i),
              i.rotate(selectedItem.data.angle)
        }
        ; (threedAngleProp.innerText = (
          (selectedItem.rotation + 360) %
          360
        ).toFixed(2)),
          (plan.threed[selectedItem.data.id].angle =
            selectedItem.rotation),
          (rotateIcon.position =
            selectedItem.data.toolsRectangleInner.segments[1].point),
          (resizeIcon.position =
            selectedItem.data.toolsRectangleInner.segments[3].point),
          (heightIcon.position =
            selectedItem.data.toolsRectangleInner.segments[2].point),
          (elevateIcon.position =
            selectedItem.data.toolsRectangleInner.segments[0].point),
          selectedItem.data.id &&
          ((rotating = true),
            (clickableObjects[selectedItem.data.id].rotation.y =
              (((selectedItem.rotation + 180) % 360) / 180) * Math.PI),
            (clickableObjects[selectedItem.data.id].rotation.x = Math.PI),
            (clickableObjects[selectedItem.data.id].rotation.z = Math.PI),
            maskObjects[selectedItem.data.id] &&
            ((maskObjects[selectedItem.data.id].rotation.y =
              (((selectedItem.rotation + 180) % 360) / 180) * Math.PI),
              (maskObjects[selectedItem.data.id].rotation.x = Math.PI),
              (maskObjects[selectedItem.data.id].rotation.z = Math.PI)),
            render())
      } else if (2 === mouseMode) {
        if (selectedItem.data.id) {
          scalingXY = true
          try {
            var v = (selectedItem.data.angle / 90) * Math.PI,
              w = e.point,
              I = selectedItem.position.subtract(
                e.point.subtract(selectedItem.position)
              ),
              P = w.subtract(I),
              b = P.angleInRadians - v,
              x = P.length * Math.cos(b),
              R = P.length * Math.sin(b),
              M = new paper.Point(
                selectedItem.position.x + x / 2,
                selectedItem.position.y - R / 2
              ),
              k = new paper.Point(
                selectedItem.position.x - x / 2,
                selectedItem.position.y + R / 2
              )
              ; (selectedItem.data.toolsRectangleInner.segments[3].point = w),
                (selectedItem.data.toolsRectangleInner.segments[1].point = I),
                (selectedItem.data.toolsRectangleInner.segments[2].point = M),
                (selectedItem.data.toolsRectangleInner.segments[0].point = k)
            var E = k.subtract(w),
              j = M.subtract(w),
              T = E.length,
              H = j.length
            if (Math.abs(T) >= 1e-5 && Math.abs(H) >= 1e-5) {
              ; (clickableObjects[selectedItem.data.id].scale.x =
                T /
                (clickableObjects[selectedItem.data.id].userData.width *
                  selectedItem.data.flipX)),
                (clickableObjects[selectedItem.data.id].scale.z =
                  H /
                  (clickableObjects[selectedItem.data.id].userData.depth *
                    selectedItem.data.flipZ)),
                maskObjects[selectedItem.data.id] &&
                ((maskObjects[selectedItem.data.id].scale.x = Math.abs(
                  clickableObjects[selectedItem.data.id].scale.x
                )),
                  (maskObjects[selectedItem.data.id].scale.z = Math.abs(
                    clickableObjects[selectedItem.data.id].scale.z
                  )))
              var C = selectedItem.position,
                B = selectedItem.rotation
                ; (selectedItem.rotation = 0),
                  (selectedItem.bounds.width = Math.abs(T)),
                  (selectedItem.bounds.height = Math.abs(H)),
                  (plan.threed[selectedItem.data.id].width = T),
                  (plan.threed[selectedItem.data.id].depth = H),
                  (selectedItem.rotation = B),
                  (selectedItem.position = C),
                  render(),
                  (threedWidthProp.value = (
                    clickableObjects[selectedItem.data.id].userData.width *
                    clickableObjects[selectedItem.data.id].scale.x
                  ).toFixed(3)),
                  (threedDepthProp.value = (
                    clickableObjects[selectedItem.data.id].userData.depth *
                    clickableObjects[selectedItem.data.id].scale.z
                  ).toFixed(3))
            }
            ; (rotateIcon.position =
              selectedItem.data.toolsRectangleInner.segments[1].point),
              (resizeIcon.position =
                selectedItem.data.toolsRectangleInner.segments[3].point),
              (heightIcon.position =
                selectedItem.data.toolsRectangleInner.segments[2].point),
              (elevateIcon.position =
                selectedItem.data.toolsRectangleInner.segments[0].point)
          } catch (e) {
            console.debug(e)
          }
        }
      } else if (3 === mouseMode) {
        ; (snapPoint = e.point),
          (snapPoint.x = parseInt(e.point.x)),
          (snapPoint.y = parseInt(e.point.y)),
          ctrlKeyPressed &&
          ((snapPoint.x = snapPoint.x - (snapPoint.x % 10)),
            (snapPoint.y = snapPoint.y - (snapPoint.y % 10))),
          (snapPointOverride = {})
        e: for (var L = 0; L < unjoinedWallSegments.length; L++)
          if (
            e.point.x >= unjoinedWallSegments[L].x - 10 &&
            e.point.x <= unjoinedWallSegments[L].x + 10 &&
            e.point.y >= unjoinedWallSegments[L].y - 10 &&
            e.point.y <= unjoinedWallSegments[L].y + 10
          ) {
            ; (snapPoint = new paper.Point(
              unjoinedWallSegments[L].x,
              unjoinedWallSegments[L].y
            )),
              new Path.Circle({
                center: snapPoint,
                radius: screenScale / 2,
                fillColor: new paper.Color(1, 0.3, 0.5, 0.75),
                strokeWidth: 1,
              })
                .removeOnMove()
                .removeOnDrag(),
              (snapPointOverride = {
                id: unjoinedWallSegments[L].id,
                x: unjoinedWallSegments[L].x,
                y: unjoinedWallSegments[L].y,
              })
            break e
          }
        if (!snapPointOverride.id)
          e: for (var L = 0; L < allWallSegments.length; L++)
            if (
              e.point.x >= allWallSegments[L].x - 10 &&
              e.point.x <= allWallSegments[L].x + 10 &&
              e.point.y >= allWallSegments[L].y - 10 &&
              e.point.y <= allWallSegments[L].y + 10
            ) {
              ; (snapPoint = new paper.Point(
                allWallSegments[L].x,
                allWallSegments[L].y
              )),
                new Path.Circle({
                  center: snapPoint,
                  radius: screenScale / 2,
                  fillColor: new paper.Color(1, 0.3, 0.5, 0.75),
                  strokeWidth: 1,
                }).removeOnMove(),
                (snapPointOverride = {
                  id: allWallSegments[L].id,
                  x: allWallSegments[L].x,
                  y: allWallSegments[L].y,
                })
              break e
            }
        var r = null,
          t = selectedItem.data.thickness / 2,
          z = selectedItem.data.thickness / 4
        snapPointOverride.id ||
          (Object.keys(verticalGuides).forEach(function (o) {
            e.point.x >= verticalGuides[o].position.x - z &&
              e.point.x <= verticalGuides[o].position.x + z &&
              (r = new paper.Point(verticalGuides[o].position.x, e.point.y)),
              null === r &&
              e.point.x >= verticalGuides[o].position.x - t - z &&
              e.point.x <= verticalGuides[o].position.x - t + z &&
              (r = new paper.Point(
                verticalGuides[o].position.x - t,
                e.point.y
              )),
              null === r &&
              e.point.x >= verticalGuides[o].position.x + t - z &&
              e.point.x <= verticalGuides[o].position.x + t + z &&
              (r = new paper.Point(
                verticalGuides[o].position.x + t,
                e.point.y
              ))
          }),
            Object.keys(horizontalGuides).forEach(function (o) {
              var a = null
              e.point.y >= horizontalGuides[o].position.y - z &&
                e.point.y <= horizontalGuides[o].position.y + z &&
                (a = horizontalGuides[o].position.y),
                null === a &&
                e.point.y >= horizontalGuides[o].position.y - t - z &&
                e.point.y <= horizontalGuides[o].position.y - t + z &&
                (a = horizontalGuides[o].position.y - t),
                null === a &&
                e.point.y >= horizontalGuides[o].position.y + t - z &&
                e.point.y <= horizontalGuides[o].position.y + t + z &&
                (a = horizontalGuides[o].position.y + t),
                a && (r ? (r.y = a) : (r = new paper.Point(e.point.x, a)))
            }),
            r &&
            ((snapPoint = r),
              new Path.Circle({
                center: snapPoint,
                radius: screenScale / 2,
                fillColor: new paper.Color(1, 0.3, 0.5, 0.75),
                strokeWidth: 1,
              })
                .removeOnMove()
                .removeOnDrag())),
          (selectedMovePointIcon.position = snapPoint),
          (selectedItem.segments[movePointIconSelectedId].point = snapPoint),
          relinkWallReferences(project.activeLayer.data.id)
      } else if (11 === mouseMode) {
        ; (snapPoint = e.point),
          (snapPoint.x = parseInt(e.point.x)),
          (snapPoint.y = parseInt(e.point.y)),
          ctrlKeyPressed &&
          ((snapPoint.x = snapPoint.x - (snapPoint.x % 10)),
            (snapPoint.y = snapPoint.y - (snapPoint.y % 10))),
          (snapPointOverride = {})
        var r = null,
          t = selectedItem.data.width / 2,
          z = selectedItem.data.width / 10
        Object.keys(verticalGuides).forEach(function (o) {
          e.point.x >= verticalGuides[o].position.x - z &&
            e.point.x <= verticalGuides[o].position.x + z &&
            (r = new paper.Point(verticalGuides[o].position.x, e.point.y)),
            null === r &&
            e.point.x >= verticalGuides[o].position.x - t - z &&
            e.point.x <= verticalGuides[o].position.x - t + z &&
            (r = new paper.Point(
              verticalGuides[o].position.x - t,
              e.point.y
            )),
            null === r &&
            e.point.x >= verticalGuides[o].position.x + t - z &&
            e.point.x <= verticalGuides[o].position.x + t + z &&
            (r = new paper.Point(
              verticalGuides[o].position.x + t,
              e.point.y
            ))
        }),
          Object.keys(horizontalGuides).forEach(function (o) {
            var a = null
            e.point.y >= horizontalGuides[o].position.y - z &&
              e.point.y <= horizontalGuides[o].position.y + z &&
              (a = horizontalGuides[o].position.y),
              null === a &&
              e.point.y >= horizontalGuides[o].position.y - t - z &&
              e.point.y <= horizontalGuides[o].position.y - t + z &&
              (a = horizontalGuides[o].position.y - t),
              null === a &&
              e.point.y >= horizontalGuides[o].position.y + t - z &&
              e.point.y <= horizontalGuides[o].position.y + t + z &&
              (a = horizontalGuides[o].position.y + t),
              a && (r ? (r.y = a) : (r = new paper.Point(e.point.x, a)))
          }),
          r &&
          ((snapPoint = r),
            new Path.Circle({
              center: snapPoint,
              radius: screenScale / 2,
              fillColor: new paper.Color(1, 0.3, 0.5, 0.75),
              strokeWidth: 1,
            })
              .removeOnMove()
              .removeOnDrag()),
          (selectedMovePointIcon.position = snapPoint),
          (selectedItem.segments[movePointIconSelectedId].point = snapPoint),
          relinkRoofReferences(project.activeLayer.data.id)
      } else if (4 === mouseMode) {
        if (selectedItem.data.id)
          try {
            ; (snapPoint = e.point),
              (snapPoint.x = stretchYPath.segments[0].point.x),
              (stretchYPath.segments[1].point = snapPoint)
            var u = stretchYPath.segments[1].point.subtract(
              stretchYPath.segments[0].point
            ),
              O = stretchYPath.length
            u.angle > 0 && (O *= -1),
              (clickableObjects[selectedItem.data.id].scale.y =
                (stretchYStartHeight + O) /
                clickableObjects[selectedItem.data.id].userData.height),
              maskObjects[selectedItem.data.id] &&
              (maskObjects[selectedItem.data.id].scale.y = Math.abs(
                clickableObjects[selectedItem.data.id].scale.y
              )),
              drawHeight(
                stretchYPath.segments[0].point,
                stretchYPath.segments[1].point,
                stretchYStartHeight
              ),
              render(),
              (threedHeightProp.value = (
                clickableObjects[selectedItem.data.id].userData.height *
                clickableObjects[selectedItem.data.id].scale.y
              ).toFixed(3))
          } catch (e) {
            console.debug(e)
          }
      } else if (5 === mouseMode) {
        if (selectedItem.data.id)
          try {
            ; (snapPoint = e.point),
              (snapPoint.x = elevatePath.segments[0].point.x),
              (elevatePath.segments[1].point = snapPoint)
            var u = elevatePath.segments[1].point.subtract(
              elevatePath.segments[0].point
            ),
              O = elevatePath.length
            u.angle > 0 && (O *= -1),
              (clickableObjects[selectedItem.data.id].position.y =
                elevateStartHeight + O),
              maskObjects[selectedItem.data.id] &&
              (maskObjects[selectedItem.data.id].position.y =
                elevateStartHeight + O),
              drawHeight(
                elevatePath.segments[0].point,
                elevatePath.segments[1].point,
                elevateStartHeight
              ),
              (controls.target.y =
                clickableObjects[selectedItem.data.id].position.y),
              render(),
              (threedYProp.value = (elevateStartHeight + O).toFixed(3))
          } catch (e) {
            console.debug(e)
          }
      } else if (6 === mouseMode) {
        ; (snapPoint = e.point),
          (snapPoint.x = parseInt(e.point.x)),
          (snapPoint.y = parseInt(e.point.y)),
          ctrlKeyPressed &&
          ((snapPoint.x = snapPoint.x - (snapPoint.x % 10)),
            (snapPoint.y = snapPoint.y - (snapPoint.y % 10)))
        e: for (var L = 0; L < wallCornersX.length; L++)
          if (
            e.point.x >= wallCornersX[L] - 10 &&
            e.point.x <= wallCornersX[L] + 10 &&
            e.point.y >= wallCornersY[L] - 10 &&
            e.point.y <= wallCornersY[L] + 10
          ) {
            ; (snapPoint = new paper.Point(wallCornersX[L], wallCornersY[L])),
              new Path.Circle({
                center: snapPoint,
                radius: screenScale / 2,
                fillColor: new paper.Color(1, 0.3, 0.5, 0.75),
                strokeWidth: 1,
              })
                .removeOnMove()
                .removeOnDrag()
            break e
          }
        var r
        Object.keys(verticalGuides).forEach(function (t) {
          e.point.x >= verticalGuides[t].position.x - 10 &&
            e.point.x <= verticalGuides[t].position.x + 10 &&
            (r = new paper.Point(verticalGuides[t].position.x, e.point.y))
        }),
          Object.keys(horizontalGuides).forEach(function (t) {
            e.point.y >= horizontalGuides[t].position.y - 10 &&
              e.point.y <= horizontalGuides[t].position.y + 10 &&
              (r
                ? (r.y = horizontalGuides[t].position.y)
                : (r = new paper.Point(
                  e.point.x,
                  horizontalGuides[t].position.y
                )))
          }),
          r &&
          ((snapPoint = r),
            new Path.Circle({
              center: snapPoint,
              radius: screenScale / 2,
              fillColor: new paper.Color(1, 0.3, 0.5, 0.75),
              strokeWidth: 1,
            })
              .removeOnMove()
              .removeOnDrag()),
          (selectedMovePointIcon.position = snapPoint),
          (selectedItem.segments[movePointIconSelectedId].point = snapPoint),
          setTimeout(function () {
            redrawFloor(selectedItem)
          }, 1),
          (document.getElementById('floorAreaProp').innerHTML =
            Math.abs(selectedItem.area / 1e4).toFixed(3) + ' M&sup2;')
      } else
        7 === mouseMode &&
          ((snapPoint = e.point),
            (snapPoint.x = parseInt(e.point.x)),
            (snapPoint.y = parseInt(e.point.y)),
            ctrlKeyPressed &&
            ((snapPoint.x = snapPoint.x - (snapPoint.x % 10)),
              (snapPoint.y = snapPoint.y - (snapPoint.y % 10))),
            (selectedItem.position = snapPoint.add(offsetMousePoint)),
            (plan.texts[selectedItem.data.id].data.x = snapPoint.x),
            (plan.texts[selectedItem.data.id].data.y = snapPoint.y),
            (document.getElementById('textXProp').value =
              snapPoint.x.toFixed(3)),
            (document.getElementById('textYProp').value =
              snapPoint.y.toFixed(3)))
    }
    else if ('background' === threedTool) {
      if (2 === e.event.buttons)
        (paper.view.center = paper.view.center.add(t)), redrawGrid()
      else if (0 === mouseMode) {
        ; (dragging = true),
          (snapPoint = e.point),
          (snapPoint.x = parseInt(e.point.x)),
          (snapPoint.y = parseInt(e.point.y)),
          ctrlKeyPressed &&
          ((snapPoint.x = snapPoint.x - (snapPoint.x % 10)),
            (snapPoint.y = snapPoint.y - (snapPoint.y % 10)))
        var o = snapPoint.add(offsetMousePoint)
        backgroundRaster &&
          ((backgroundRaster.position = o),
            (toolsGroup[0].position = o),
            (backgroundRaster.data.toolsRectangleInner.position =
              backgroundRaster.position),
            (resizeIcon.position =
              selectedItem.data.toolsRectangleInner.segments[3].point))
      } else if (2 === mouseMode) {
        scalingXY = true
        try {
          if (e.point.x > 1 && e.point.y > 1) {
            ; (backgroundRasterRatioX = Math.abs(
              backgroundRaster.bounds.right / backgroundRaster.bounds.left
            )),
              (backgroundRasterRatioY = Math.abs(
                backgroundRaster.bounds.bottom / backgroundRaster.bounds.top
              ))
            var S = new paper.Point(
              -e.point.x / backgroundRasterRatioX,
              -e.point.y / backgroundRasterRatioY
            ),
              D = e.point
              ; (backgroundRaster.data.toolsRectangleInner.bounds =
                new Rectangle(S, D)),
                (backgroundRaster.bounds.width =
                  backgroundRaster.data.toolsRectangleInner.bounds.width),
                (backgroundRaster.bounds.height =
                  backgroundRaster.data.toolsRectangleInner.bounds.height),
                (backgroundRaster.position.x =
                  backgroundRaster.data.toolsRectangleInner.position.x),
                (backgroundRaster.position.y =
                  backgroundRaster.data.toolsRectangleInner.position.y),
                (resizeIcon.position =
                  backgroundRaster.data.toolsRectangleInner.segments[3].point)
          }
        } catch (e) {
          console.debug(e)
        }
      }
    }
    */
  }

  // ** ON MOUSE MOVE
  tools.onMouseMove = function (e: any) {
    // **
    // console.debug('initThreeDPaperPlanView: tools.onMouseMove', e)
    /*
    if (((lastMousePoint = e.point), 'walls' === threedTool)) {
      if (((snapPoint = null), startedDrawingWalls)) {
        var t = e.point.subtract(wallHelperPath.segments[0].point)
        ctrlKeyPressed && (t.angle = 15 * Math.round(t.angle / 15)),
          (snapPoint = wallHelperPath.segments[0].point.add(t))
        var o = wallHelperPath.segments[0],
          a = snapPoint,
          n = getAngleRadians(o.point, a)
          ; (wallHelperRectangle.segments[0].point = new Point(
            o.point.x + (Math.sin(n) * defaultWallThickness) / 2,
            o.point.y - (Math.cos(n) * defaultWallThickness) / 2
          )),
            (wallHelperRectangle.segments[1].point = new Point(
              a.x + (Math.sin(n) * defaultWallThickness) / 2,
              a.y - (Math.cos(n) * defaultWallThickness) / 2
            )),
            (wallHelperRectangle.segments[2].point = new Point(
              a.x - (Math.sin(n) * defaultWallThickness) / 2,
              a.y + (Math.cos(n) * defaultWallThickness) / 2
            )),
            (wallHelperRectangle.segments[3].point = new Point(
              o.point.x - (Math.sin(n) * defaultWallThickness) / 2,
              o.point.y + (Math.cos(n) * defaultWallThickness) / 2
            )),
            (wallHelperPath.segments[1].point = snapPoint),
            drawLength(
              wallHelperPath.segments[0].point,
              wallHelperPath.segments[1].point,
              n < 0 ? -1 : 1
            ),
            (wallHelper3dCube.geometry.vertices[1].x =
              wallHelperRectangle.segments[0].point.x),
            (wallHelper3dCube.geometry.vertices[1].z =
              wallHelperRectangle.segments[0].point.y),
            (wallHelper3dCube.geometry.vertices[3].x =
              wallHelperRectangle.segments[0].point.x),
            (wallHelper3dCube.geometry.vertices[3].z =
              wallHelperRectangle.segments[0].point.y),
            (wallHelper3dCube.geometry.vertices[0].x =
              wallHelperRectangle.segments[1].point.x),
            (wallHelper3dCube.geometry.vertices[0].z =
              wallHelperRectangle.segments[1].point.y),
            (wallHelper3dCube.geometry.vertices[2].x =
              wallHelperRectangle.segments[1].point.x),
            (wallHelper3dCube.geometry.vertices[2].z =
              wallHelperRectangle.segments[1].point.y),
            (wallHelper3dCube.geometry.vertices[5].x =
              wallHelperRectangle.segments[2].point.x),
            (wallHelper3dCube.geometry.vertices[5].z =
              wallHelperRectangle.segments[2].point.y),
            (wallHelper3dCube.geometry.vertices[7].x =
              wallHelperRectangle.segments[2].point.x),
            (wallHelper3dCube.geometry.vertices[7].z =
              wallHelperRectangle.segments[2].point.y),
            (wallHelper3dCube.geometry.vertices[4].x =
              wallHelperRectangle.segments[3].point.x),
            (wallHelper3dCube.geometry.vertices[4].z =
              wallHelperRectangle.segments[3].point.y),
            (wallHelper3dCube.geometry.vertices[6].x =
              wallHelperRectangle.segments[3].point.x),
            (wallHelper3dCube.geometry.vertices[6].z =
              wallHelperRectangle.segments[3].point.y),
            (wallHelper3dCube.geometry.verticesNeedUpdate = true),
            (tween = new TWEEN.Tween(controls.target)
              .to(wallHelper3dCube.position, 1)
              .onUpdate(render)
              .start())
      }
      snapPointOverride = {}
      var l = null,
        i = null,
        r = defaultWallThickness / 2,
        s = defaultWallThickness / 4
      if (
        (snapPointOverride.id ||
          (Object.keys(verticalGuides).forEach(function (t) {
            e.point.x >= verticalGuides[t].position.x - s &&
              e.point.x <= verticalGuides[t].position.x + s &&
              ((l = new paper.Point(verticalGuides[t].position.x, e.point.y)),
                (i = verticalGuides[t].data.id)),
              null === l &&
              e.point.x >= verticalGuides[t].position.x - r - s &&
              e.point.x <= verticalGuides[t].position.x - r + s &&
              ((l = new paper.Point(
                verticalGuides[t].position.x - r,
                e.point.y
              )),
                (i = verticalGuides[t].data.id)),
              null === l &&
              e.point.x >= verticalGuides[t].position.x + r - s &&
              e.point.x <= verticalGuides[t].position.x + r + s &&
              ((l = new paper.Point(
                verticalGuides[t].position.x + r,
                e.point.y
              )),
                (i = verticalGuides[t].data.id))
          }),
            Object.keys(horizontalGuides).forEach(function (t) {
              var o = null
              e.point.y >= horizontalGuides[t].position.y - s &&
                e.point.y <= horizontalGuides[t].position.y + s &&
                (o = horizontalGuides[t].position.y),
                null === o &&
                e.point.y >= horizontalGuides[t].position.y - r - s &&
                e.point.y <= horizontalGuides[t].position.y - r + s &&
                (o = horizontalGuides[t].position.y - r),
                null === o &&
                e.point.y >= horizontalGuides[t].position.y + r - s &&
                e.point.y <= horizontalGuides[t].position.y + r + s &&
                (o = horizontalGuides[t].position.y + r),
                o &&
                ((i = horizontalGuides[t].data.id),
                  l ? (l.y = o) : (l = new paper.Point(e.point.x, o)))
            }),
            l &&
            ((snapPoint = l),
              new Path.Circle({
                center: snapPoint,
                radius: screenScale / 2,
                fillColor: new paper.Color(1, 0.3, 0.5, 0.75),
                strokeWidth: 1,
              }).removeOnMove(),
              (snapPointOverride = { id: i, x: snapPoint.x, y: snapPoint.y }))),
          !snapPointOverride.id)
      )
        e: for (var d = 0; d < unjoinedWallSegments.length; d++)
          if (
            e.point.x >= unjoinedWallSegments[d].x - 10 &&
            e.point.x <= unjoinedWallSegments[d].x + 10 &&
            e.point.y >= unjoinedWallSegments[d].y - 10 &&
            e.point.y <= unjoinedWallSegments[d].y + 10
          ) {
            ; (snapPoint = new paper.Point(
              unjoinedWallSegments[d].x,
              unjoinedWallSegments[d].y
            )),
              new Path.Circle({
                center: snapPoint,
                radius: screenScale / 2,
                fillColor: new paper.Color(1, 0.3, 0.5, 0.75),
                strokeWidth: 1,
              }).removeOnMove(),
              (snapPointOverride = {
                id: unjoinedWallSegments[d].id,
                x: unjoinedWallSegments[d].x,
                y: unjoinedWallSegments[d].y,
              })
            break e
          }
      if (!snapPointOverride.id)
        e: for (var d = 0; d < allWallSegments.length; d++)
          if (
            e.point.x >= allWallSegments[d].x - 10 &&
            e.point.x <= allWallSegments[d].x + 10 &&
            e.point.y >= allWallSegments[d].y - 10 &&
            e.point.y <= allWallSegments[d].y + 10
          ) {
            ; (snapPoint = new paper.Point(
              allWallSegments[d].x,
              allWallSegments[d].y
            )),
              new Path.Circle({
                center: snapPoint,
                radius: screenScale / 2,
                fillColor: new paper.Color(1, 0.3, 0.5, 0.75),
                strokeWidth: 1,
              }).removeOnMove(),
              (snapPointOverride = {
                id: allWallSegments[d].id,
                x: allWallSegments[d].x,
                y: allWallSegments[d].y,
              })
            break e
          }
    } 
    else if ('roof' === threedTool) {
      if (startedDrawingRoofs) {
        var t = e.point.subtract(roofHelperPath.segments[0].point)
        ctrlKeyPressed && (t.angle = 15 * Math.round(t.angle / 15)),
          (snapPoint = roofHelperPath.segments[0].point.add(t))
        var o = roofHelperPath.segments[0],
          a = snapPoint,
          n = getAngleRadians(o.point, a)
          ; (roofHelperRectangle.segments[0].point = new Point(
            o.point.x + (Math.sin(n) * defaultRoofWidth) / 2,
            o.point.y - (Math.cos(n) * defaultRoofWidth) / 2
          )),
            (roofHelperRectangle.segments[1].point = new Point(
              a.x + (Math.sin(n) * defaultRoofWidth) / 2,
              a.y - (Math.cos(n) * defaultRoofWidth) / 2
            )),
            (roofHelperRectangle.segments[2].point = new Point(
              a.x - (Math.sin(n) * defaultRoofWidth) / 2,
              a.y + (Math.cos(n) * defaultRoofWidth) / 2
            )),
            (roofHelperRectangle.segments[3].point = new Point(
              o.point.x - (Math.sin(n) * defaultRoofWidth) / 2,
              o.point.y + (Math.cos(n) * defaultRoofWidth) / 2
            )),
            (roofHelperPath.segments[1].point = snapPoint),
            drawLength(
              roofHelperPath.segments[0].point,
              roofHelperPath.segments[1].point,
              n < 0 ? -1 : 1
            ),
            (roofHelper3dCube.geometry.vertices[1].x =
              roofHelperRectangle.segments[0].point.x),
            (roofHelper3dCube.geometry.vertices[1].z =
              roofHelperRectangle.segments[0].point.y),
            (roofHelper3dCube.geometry.vertices[3].x =
              roofHelperRectangle.segments[0].point.x),
            (roofHelper3dCube.geometry.vertices[3].z =
              roofHelperRectangle.segments[0].point.y),
            (roofHelper3dCube.geometry.vertices[0].x =
              roofHelperRectangle.segments[1].point.x),
            (roofHelper3dCube.geometry.vertices[0].z =
              roofHelperRectangle.segments[1].point.y),
            (roofHelper3dCube.geometry.vertices[2].x =
              roofHelperRectangle.segments[1].point.x),
            (roofHelper3dCube.geometry.vertices[2].z =
              roofHelperRectangle.segments[1].point.y),
            (roofHelper3dCube.geometry.vertices[5].x =
              roofHelperRectangle.segments[2].point.x),
            (roofHelper3dCube.geometry.vertices[5].z =
              roofHelperRectangle.segments[2].point.y),
            (roofHelper3dCube.geometry.vertices[7].x =
              roofHelperRectangle.segments[2].point.x),
            (roofHelper3dCube.geometry.vertices[7].z =
              roofHelperRectangle.segments[2].point.y),
            (roofHelper3dCube.geometry.vertices[4].x =
              roofHelperRectangle.segments[3].point.x),
            (roofHelper3dCube.geometry.vertices[4].z =
              roofHelperRectangle.segments[3].point.y),
            (roofHelper3dCube.geometry.vertices[6].x =
              roofHelperRectangle.segments[3].point.x),
            (roofHelper3dCube.geometry.vertices[6].z =
              roofHelperRectangle.segments[3].point.y)
        var c = defaultRoofThickness / 2,
          u = defaultRoofRise / 2
          ; (roofHelper3dCube.geometry.vertices[0].y = c - u),
            (roofHelper3dCube.geometry.vertices[1].y = c - u),
            (roofHelper3dCube.geometry.vertices[4].y = c + u),
            (roofHelper3dCube.geometry.vertices[5].y = c + u),
            (roofHelper3dCube.geometry.vertices[2].y = -c - u),
            (roofHelper3dCube.geometry.vertices[3].y = -c - u),
            (roofHelper3dCube.geometry.vertices[6].y = -c + u),
            (roofHelper3dCube.geometry.vertices[7].y = -c + u),
            (roofHelper3dCube.geometry.verticesNeedUpdate = true),
            (tween = new TWEEN.Tween(controls.target)
              .to(roofHelper3dCube.position, 1)
              .onUpdate(render)
              .start())
      }
      snapPointOverride = {}
      var l = null,
        i = null,
        r = defaultRoofWidth / 2,
        s = defaultRoofWidth / 10
      Object.keys(verticalGuides).forEach(function (t) {
        e.point.x >= verticalGuides[t].position.x - s &&
          e.point.x <= verticalGuides[t].position.x + s &&
          ((l = new paper.Point(verticalGuides[t].position.x, e.point.y)),
            (i = verticalGuides[t].data.id)),
          null === l &&
          e.point.x >= verticalGuides[t].position.x - r - s &&
          e.point.x <= verticalGuides[t].position.x - r + s &&
          ((l = new paper.Point(
            verticalGuides[t].position.x - r,
            e.point.y
          )),
            (i = verticalGuides[t].data.id)),
          null === l &&
          e.point.x >= verticalGuides[t].position.x + r - s &&
          e.point.x <= verticalGuides[t].position.x + r + s &&
          ((l = new paper.Point(
            verticalGuides[t].position.x + r,
            e.point.y
          )),
            (i = verticalGuides[t].data.id))
      }),
        Object.keys(horizontalGuides).forEach(function (t) {
          var o = null
          e.point.y >= horizontalGuides[t].position.y - s &&
            e.point.y <= horizontalGuides[t].position.y + s &&
            (o = horizontalGuides[t].position.y),
            null === o &&
            e.point.y >= horizontalGuides[t].position.y - r - s &&
            e.point.y <= horizontalGuides[t].position.y - r + s &&
            (o = horizontalGuides[t].position.y - r),
            null === o &&
            e.point.y >= horizontalGuides[t].position.y + r - s &&
            e.point.y <= horizontalGuides[t].position.y + r + s &&
            (o = horizontalGuides[t].position.y + r),
            o &&
            ((i = horizontalGuides[t].data.id),
              l ? (l.y = o) : (l = new paper.Point(e.point.x, o)))
        }),
        l &&
        ((snapPoint = l),
          new Path.Circle({
            center: snapPoint,
            radius: screenScale / 2,
            fillColor: new paper.Color(1, 0.3, 0.5, 0.75),
            strokeWidth: 1,
          }).removeOnMove(),
          (snapPointOverride = { id: i, x: snapPoint.x, y: snapPoint.y }))
    } 
    else if ('floor' === threedTool) {
      snapPoint = e.point
      e: for (var d = 0; d < wallCornersX.length; d++)
        if (
          e.point.x >= wallCornersX[d] - 10 &&
          e.point.x <= wallCornersX[d] + 10 &&
          e.point.y >= wallCornersY[d] - 10 &&
          e.point.y <= wallCornersY[d] + 10
        ) {
          ; (snapPoint = new paper.Point(wallCornersX[d], wallCornersY[d])),
            new Path.Circle({
              center: snapPoint,
              radius: screenScale / 2,
              fillColor: new paper.Color(1, 0.3, 0.5, 0.75),
              strokeWidth: 1,
            }).removeOnMove()
          break e
        }
      var l
      Object.keys(verticalGuides).forEach(function (t) {
        e.point.x >= verticalGuides[t].position.x - 10 &&
          e.point.x <= verticalGuides[t].position.x + 10 &&
          ((l = new paper.Point(verticalGuides[t].position.x, e.point.y)),
            (i = verticalGuides[t].data.id))
      }),
        Object.keys(horizontalGuides).forEach(function (t) {
          e.point.y >= horizontalGuides[t].position.y - 10 &&
            e.point.y <= horizontalGuides[t].position.y + 10 &&
            (l
              ? (l.y = horizontalGuides[t].position.y)
              : (l = new paper.Point(
                e.point.x,
                horizontalGuides[t].position.y
              )),
              (i = horizontalGuides[t].data.id))
        }),
        l &&
        ((snapPoint = l),
          new Path.Circle({
            center: snapPoint,
            radius: screenScale / 2,
            fillColor: new paper.Color(1, 0.3, 0.5, 0.75),
            strokeWidth: 1,
          }).removeOnMove()),
        startedDrawingFloor && (floorHelperPath.segments[1].point = snapPoint)
    } 
    else if ('dimension' === threedTool) {
      snapPoint = e.point
      e: for (var d = 0; d < wallCornersX.length; d++)
        if (
          e.point.x >= wallCornersX[d] - 10 &&
          e.point.x <= wallCornersX[d] + 10 &&
          e.point.y >= wallCornersY[d] - 10 &&
          e.point.y <= wallCornersY[d] + 10
        ) {
          ; (snapPoint = new paper.Point(wallCornersX[d], wallCornersY[d])),
            new Path.Circle({
              center: snapPoint,
              radius: screenScale / 2,
              fillColor: new paper.Color(1, 0.3, 0.5, 0.75),
              strokeWidth: 1,
            }).removeOnMove()
          break e
        }
      if (startedDrawingDimension)
        if (1 === dimensionPath.segments.length)
          (dimensionHelperPath.segments[1].point = snapPoint),
            drawDimension(
              dimensionHelperPath.segments[0].point,
              dimensionHelperPath.segments[1].point,
              10
            )
        else {
          var t = dimensionHelperPath.segments[1].point.subtract(
            dimensionHelperPath.segments[0].point
          ),
            p = dimensionHelperPath.segments[1].point.subtract(snapPoint),
            m = (p.angle - t.angle + 360) % 360,
            g = (m / 180) * Math.PI,
            y = p.length * Math.sin(g)
          drawDimension(
            dimensionHelperPath.segments[0].point,
            dimensionHelperPath.segments[1].point,
            y
          )
        }
    }
    
    */
  }
  /* */

  // ==============================================================
  // ** ON MOUSE DOUBLE-CLICK
  planCanvas.addEventListener(
    'dblclick',
    function (e: any) {
      if ('pointer' === threedTool) {
        deselectAll()
      } else if ('floor' === threedTool && startedDrawingFloor) {
        startedDrawingFloor = false
        floorHelperPath.visible = false
        floorPath.closed = true
      }
    },
    false
  )

  // ==============================================================
  // ** PAPER CANVAS:
  // ** -- PREPARE CANVAS
  // ** -- DRAW PREPARED CONTENT
  // ** -- RESET GRID
  // @ ts-expect-error
  // paper.view.center = [0, 0]
  // paper.view.center = [400, 200]
  // @ ts-expect-error
  // paper.view.draw()

  // ** DRAW GRID path lines x,y
  // drawGrid()
  // drawGridNew(paper, 20)
  redrawGrid()
  
} // END initThreeDPaperPlanView()

// ** END: ThreeD PAPER.JS planView PaperCanvas
// ==============================================================

/* */

// ==============================================================
// ** 🟣 TYPES + INTERFACES
// ==============================================================

interface TThreedItem { 
  title: string, 
  license: string, 
  author: string,
  threedLink: string,
  size?: TThreedItemSize,
  scale?: TThreedItemScale,
  pivot?: number,
  useMask?: boolean,
}
interface TThreedItemSize {
  x: number,
  y: number,
  z: number,
}
interface TThreedItemScale {
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
  e = e.replace(/([A-Z])/g, ' $1')
  e = e.replace(/_/g, ' ')
  e = e.replace(/\b\w/g, function (e: any) {
    return e.toUpperCase()
  })
  e = e.charAt(0).toUpperCase() + e.slice(1)
  return e
}

function validatePlusOrMinusNumber(element: any, numberT: any) {
  console.debug('validatePlusOrMinusNumber', element, numberT, '[MM] Testing')
  var regexOh = /^[-]?[0-9]*\.?[0-9]+$/
  element.value && null !== element.value.match(regexOh)
    ? ((element.style.backgroundColor = '#4e4e4e'), numberT(element.value), element.blur())
    : ((element.style.backgroundColor = '#ff8888'), element.focus())
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
const ViewProperties = () => {
  // console.debug('PropertiesView loading...')

  // ** HOOKS
  const useCanvasStateThreeDVar: Object = useReactiveVar(canvasStateThreeDVar)

  return (
    <>
    <div 
      id='propertiesView' 
      style={{ 
        // display: 'flex',
        // flexDirection: 'row',
        // height: '100%',
        padding: '6px',
        // paddingLeft: '10px',
        // border: '1px solid orange',
      }}
    >
      <div 
        id='threed3DButtons' 
        style={{ 
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <button className='moreInfoBtn' 
          onClick={(event) => showModel3dView(event)}
        >
          Preview
        </button>
        <button className='moreInfoBtn' 
          // @ts-expect-error
          // onClick={(event) => addThreed(event, draggingThreedItem, canvasStateThreeDVar().state.scene)}
          onClick={(event) => addThreed(event, draggingThreedItem, useCanvasStateThreeDVar.state.scene)}
          // onClick={(event) => {
          //   if (("state" in useCanvasStateThreeDVar)) {
          //     if (("scene" in useCanvasStateThreeDVar.state)) {
          //       addThreed(event, draggingThreedItem, useCanvasStateThreeDVar.state.scene)
          //     }
          //   }
          // }}
        >
          Add To Canvas
        </button>
        <button className='moreInfoBtn' 
          onClick={() => recenterPlanView()}
        >
          Recenter
        </button>
        <button className='moreInfoBtn' 
          onClick={() => drawGridNew(paper, 10)}
        >
          Draw Grid
        </button>
        <button className='moreInfoBtn' 
          onClick={() => redrawGrid()}
        >
          ReDraw Grid
        </button>
      </div>

      <div 
        id='threed3DModelPropertiesView' 
        style={{ 
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <h4>Model Properties</h4>
        <table 
          className='propertiesTable'
        >
          <tbody>
            <tr>
              <td>
                <div 
                  onMouseDown={(event) => beginDrag(event, draggingThreedItem)} 
                  // onMouseUp={(event) => addThreed(event, draggingThreedItem, canvasStateThreeDVar().state.scene)}
                  className='disableSelection'
                  style={{ textAlign: 'center' }}
                >
                  <img // Image
                    id='model3dLargeThumb'
                    alt='model3dLargeThumb'
                    width={100}
                    height={100}
                    className='disableSelection' 
                    style={{ pointerEvents: 'none' }} 
                    src='/images/homedesign/thumbPlaceHolder.png'
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
          </tbody>
        </table>
      </div>

      {/* <hr/> */}
      
      <div 
        id='threedPropertiesView'
        style={{
          display: 'flex',
          flexDirection: 'column',
          marginTop: '8px',
          paddingTop: '8px',
        }}
      >
        <h4>Threed Properties</h4>
        <table 
          className='propertiesTable' 
          // style={{ minWidth: '290px' }}
        >
          <tbody>
          {/* <tr>
            <td>Id</td>
            <td><span id='objectId'></span></td>
          </tr>
          <tr>
            <td>Name</td>
            <td><span id='objectName'></span></td>
          </tr> */}
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
              <input type='text' 
                id='threedYProp'
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
              <input type='text' 
                id='threedZProp'
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
              <input type='text' 
                id='threedWidthProp'
                className='editable' 
                // onChange={() => validatePlusNumber(this, updateThreedWidth)} 
                maxLength={8} 
              />
              cm
              |
              Flip X
              <input type='checkbox' 
                id='flipX' 
                // onChange={() => flipX(this.checked)} 
              />
            </td>
          </tr>
          <tr>
            <td>Height</td>
            <td>
              <input type='text' 
                id='threedHeightProp'
                className='editable' 
                // onChange={() => validatePlusOrMinusNumber(this, updateThreedHeight)}
                maxLength={8} 
              />
              cm
            </td>
          </tr>
          <tr>
            <td>Depth</td>
            <td>
              <input type='text' 
                id='threedDepthProp'
                className='editable' 
                // onChange={() => validatePlusNumber(this, updateThreedDepth)} 
                maxLength={8} 
              />
              cm
              |
              Flip Z
              <input type='checkbox' 
                id='flipZ' 
                // onChange={() => flipZ(this.checked)} 
              />
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
                onClick={(event) => showModel3dView(event)}
              >
                VIEW 3D MODEL
              </button>
            </td>
          </tr>
          </tbody>
        </table>
      </div>

      {/* <hr/> */}

      <div 
        id='defaultsPropertiesView' 
        style={{ display: 'flex' }}
      >
        <h4>Default Settings</h4>
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

      <hr/>
      
      <div id='wallDefaultsPropertiesView' style={{ display: 'flex' }}>
        <h4>Default Wall Settings</h4>
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
      <div id='floorDefaultsPropertiesView' style={{ display: 'flex' }}>
        <h4>Default Floor Settings</h4>
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
      <div id='roofDefaultsPropertiesView' style={{ display: 'flex' }}>
        <h4>Default Roof Settings</h4>
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
      <div id='dimensionDefaultsPropertiesView' style={{ display: 'flex' }}>
        <h4>Default Dimension Settings</h4>
      </div>
      <div id='textDefaultsPropertiesView' style={{ display: 'flex' }}>
        <h4>Default Text Settings</h4>
      </div>

      {/* <hr/> */}

      <div 
        id='planViewPropertiesView' 
        style={{
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <h4>Background Template</h4>
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

      <hr/>
      
      <div id='3dViewPropertiesView' style={{ display: 'none' }}>
        <h4>3d View Properties</h4>
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
        <h4>Wall Properties</h4>
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
        <h4>Roof Properties</h4>
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
        <h4>Floor Properties</h4>
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
        <h4>Dimension Properties</h4>
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

      <hr/>

      <div id='textPropertiesView' style={{
          display: 'flex',
          flexDirection: 'column',
      }}>
        <h4>Text Annotation Properties</h4>
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
      
      <hr/>

      <div 
        id='levelPropertiesView' 
        style={{
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <h4>Level Properties</h4>
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
                  className='editable' 
                  // onChange={() => validatePlusOrMinusNumber(this, updateLevelHeight)}
                  maxLength={8} 
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <hr/>
      
      <div 
        id='groundPropertiesView' 
        style={{
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <h4>Ground Layer Properties</h4>
        <table className='propertiesTable' style={{ minWidth: '290px' }}>
          <tbody>
            <tr>
              <td>Width</td>
              <td><input type='text' id='groundWidthProp'
                  className='editable' 
                  // onChange={() => validatePlusNumber(this, updateGroundWidth)} 
                  maxLength={8} 
                  />
                cm</td>
            </tr>
            <tr>
              <td>Length</td>
              <td><input type='text' id='groundLengthProp'
                  className='editable' 
                  // onChange={() => validatePlusNumber(this, updateGroundLength)} 
                  maxLength={8} 
                  />
                cm</td>
            </tr>
          </tbody>
        </table>
      </div>

      <hr/>

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
              <h2>ThreeD HD</h2>
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
                <h4>ThreeD HD Introduction</h4>
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
                      {/* <img src='images/homedesign/info.png' className='tooltip' /> */}
                      <span className='tooltiptext'>
                        <div>
                          Any edits you make to the plan will be saved to your browsers local web storage so that you don't lose any work between saves.<br/>The plan may be removed if you clean your browsers cookies and history, so to save your work long term, use the 'File-Save' option in the main <a href='https://threedgarden.com'>ThreeD HD</a> toolbar.<br/>
                          More info about 
                          <a href="https://www.w3schools.com/HTML/html5_webstorage.asp" target="_blank" rel="noreferrer">
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
              <h4><a href='https://threedgarden.com'>Modal: Footer</a></h4>
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
              <h2>ThreeD HD</h2>
            </div>
            <div className='modal-body'>
              <div id='model3dView'>
                <canvas id='model3dViewCanvas'></canvas>
              </div>
              <div id='modalModelDescription'>
                <h4>3d Model Properties</h4>
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
              <h4><a href='https://threedgarden.com'>Modal: Footer</a></h4>
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
              <h2>ThreeD HD</h2>
            </div>
            <div className='modal-small-body'>
              <h4>Share Plan</h4>
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
              <h4><a href='https://threedgarden.com'>Modal: Footer</a></h4>
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
              <h2>ThreeD HD</h2>
            </div>
            <div className='modal-small-body'>
              <h4>Loading Model Progress</h4>
              <textarea id='modalLoadingDataInfo'></textarea>
            </div>
            <div className='modal-small-footer'>
              <h4><a href='https://threedgarden.com'>Modal: Footer</a></h4>
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
              title='ThreeD HD' 
              alt='ThreeD HD' 
            />
          </a>
        </li> */}
        {/* <li className='brand'>
          <a onClick={() => showModalAbout()} 
            style={{textAlign: 'center', paddingTop: '15px', paddingLeft: '18px', paddingRight: '24px', paddingBottom: '15px', textDecoration: 'none', fontSize: '21px',}}
          >
            ThreeD HD
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
            <!--<a  id='groundPropertiesButton' onClick={() => setThreedTool('ground')}>Ground Properties</a>-->
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
          <a id='pointerTool' onClick={() => setThreedTool('pointer')} className='toolButton activeTool'
            title='Pointer Select' alt='Pointer Select'>
            <img src='images/homedesign/pointericonWhite.png' height='42px'>
          </a>
        </li> */}
        {/* <!-- <li>
          <a onClick={() => setThreedTool('hand')}>
            <img src='images/homedesign/handicon.png' width='50px'>
          </a>
        </li> --> */}
        {/* <li>
          <a id='addWallTool' onClick={() => setThreedTool('walls')} className='toolButton' title='Add Wall' alt='Add Wall'>
            <img src='images/homedesign/newWallWhite2.png' height='42px'>
          </a>
        </li> */}
        {/* <li>
          <a id='addFloorTool' onClick={() => setThreedTool('floor')} className='toolButton' title='Add Floor'
            alt='Add Floor'>
            <img src='images/homedesign/newFloorWhite2.png' height='42px'>
          </a>
        </li> */}
        {/* <li>
          <a id='addRoofTool' onClick={() => setThreedTool('roof')} className='toolButton' title='Add Roof' alt='Add Roof'>
            <img src='images/homedesign/newRoofWhite2.png' height='42px'>
          </a>
        </li> */}
        {/* <li>
          <a id='addRulerTool' onClick={() => setThreedTool('dimension')} className='toolButton' title='Add Dimension'
            alt='Add Dimension'>
            <img src='images/homedesign/newRulerWhite2.png' height='42px'>
          </a>
        </li> */}
        {/* <li>
          <a id='addTextTool' onClick={() => setThreedTool('text')} className='toolButton' title='Add Text Annotation'
            alt='Add Text Annotation'>
            <img src='images/homedesign/newTextWhite.png' height='42px'>
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
              title='ThreeD HD' alt='ThreeD HD' />
            <h2>ThreeD HD</h2>
          </div>
          <div className='modal-body'>
            <div id='model3dView'>
              <canvas id='model3dViewCanvas'></canvas>
            </div>
            <div id='modalModelDescription'>
              <h4>3d Model Properties</h4>
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
            <h4><a href='https://threedgarden.com'>ThreeD HD</a></h4>
          </div>
        </div>
      </div>

      <div id='modalLoading' className='modal-small'>
        <div className='modal-small-content'>
          <div className='modal-small-header'>
            <img src='favicon/favicon.png' height='48px' 
              title='ThreeD HD' alt='ThreeD HD' />
            <h2>ThreeD HD</h2>
          </div>
          <div className='modal-small-body'>
            <h4>Loading Model Progress</h4>
            <textarea id='modalLoadingDataInfo'></textarea>
          </div>
          <div className='modal-small-footer'>
            <h4><a href='https://threedgarden.com'>ThreeD HD</a></h4>
          </div>
        </div>
      </div>

      <div id='modalShare' className='modal-small'>
        <div className='modal-small-content'>
          <div className='modal-small-header'>
            <span className='close'>-X-</span>
            <img src='favicon/favicon.png' height='48px' 
              title='ThreeD HD' alt='ThreeD HD' />
            <h2>ThreeD HD</h2>
          </div>
          <div className='modal-small-body'>
            <h4>Share Plan</h4>
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
            <h4><a href='https://threedgarden.com'>ThreeD HD</a></h4>
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
  //       .setPath(threedItemsURL + 'objects/')
  //       .load(e + '.mtl', function (t) {
  //         ; (t.baseUrl = threedItemsURL + 'objects/'),
  //           t.preload(),
  //           new OBJLoader()
  //             .setMaterials(t)
  //             .setPath(threedItemsURL + 'objects/')
  //             .load(
  //               e + '.obj',
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
  //                   var r = '',
  //                     s = new XMLHttpRequest()
  //                     ; (s.onreadystatechange = function () {
  //                       if (4 == this.readyState && 200 == this.status) {
  //                         var e = this.responseText,
  //                           t = e.split('\n')
  //                         t.forEach(function (e: any) {
  //                           e.startsWith('#') && (r += e + '\n')
  //                         }),
  //                           (document.getElementById(
  //                             'modalModel3dObjHeader'
  //                           ).value = r)
  //                       }
  //                     }),
  //                       s.open('GET', threedItemsURL + 'objects/' + e + '.obj', true),
  //                       s.send()
  //                 } catch (e) {
  //                   console.dir(e)
  //                 }
  //                 setModalModelDescription(e),
  //                   $('#model3dModal').show(),
  //                   hideMouseIndicators(),
  //                   (model3dViewOpen = true),
  //                   (progressBar.style.display = 'none')
  //               },
  //               onProgress,
  //               onError
  //             )
  //       }))
}

function setThreedTool(threedToolName: string) {
  console.debug('setThreedTool to', threedToolName)
  // switch (
  // ('walls' === threedTool
  //   ? setEndDrawingWalls()
  //   : 'floor' === threedTool
  //     ? setEndDrawingFloors()
  //     : 'roof' === threedTool
  //       ? setEndDrawingRoofs()
  //       : 'dimension' === threedTool
  //         ? setEndDrawingDimension()
  //         : 'text' === threedTool
  //           ? setEndDrawingText()
  //           : 'ground' === threedTool && setEndDrawingGround(),
  //   (threedTool = threedToolName),
  //   threedToolName)
  // ) {
  //   case 'pointer':
  //     modalsActive || showMouseIndicators(),
  //       (defaultCursor = 'default'),
  //       deselectAll(),
  //       document.getElementById('pointerTool').classList.add('activeTool'),
  //       document.getElementById('addWallTool').classList.remove('activeTool'),
  //       document.getElementById('addFloorTool').classList.remove('activeTool'),
  //       document.getElementById('addRoofTool').classList.remove('activeTool'),
  //       document.getElementById('addRulerTool').classList.remove('activeTool'),
  //       document.getElementById('addTextTool').classList.remove('activeTool')
  //     break
  //   case 'walls':
  //     ; (defaultCursor = 'crosshair'),
  //       deselectAll(),
  //       recalcAllUnjoinedWallSegments(-1),
  //       recalcAllWallSegmentsOnOtherLevels(-1, paper.project.activeLayer.data.id),
  //       document.getElementById('pointerTool').classList.remove('activeTool'),
  //       document.getElementById('addWallTool').classList.add('activeTool'),
  //       document.getElementById('addFloorTool').classList.remove('activeTool'),
  //       document.getElementById('addRoofTool').classList.remove('activeTool'),
  //       document.getElementById('addRulerTool').classList.remove('activeTool'),
  //       document.getElementById('addTextTool').classList.remove('activeTool'),
  //       setPropertiesView('wallDefaults')
  //     break
  //   case 'floor':
  //     ; (defaultCursor = 'crosshair'),
  //       deselectAll(),
  //       document.getElementById('pointerTool').classList.remove('activeTool'),
  //       document.getElementById('addWallTool').classList.remove('activeTool'),
  //       document.getElementById('addFloorTool').classList.add('activeTool'),
  //       document.getElementById('addRoofTool').classList.remove('activeTool'),
  //       document.getElementById('addRulerTool').classList.remove('activeTool'),
  //       document.getElementById('addTextTool').classList.remove('activeTool'),
  //       recalcAllWallCorners(),
  //       setPropertiesView('floorDefaults')
  //     break
  //   case 'roof':
  //     ; (defaultCursor = 'crosshair'),
  //       deselectAll(),
  //       document.getElementById('pointerTool').classList.remove('activeTool'),
  //       document.getElementById('addWallTool').classList.remove('activeTool'),
  //       document.getElementById('addFloorTool').classList.remove('activeTool'),
  //       document.getElementById('addRoofTool').classList.add('activeTool'),
  //       document.getElementById('addRulerTool').classList.remove('activeTool'),
  //       document.getElementById('addTextTool').classList.remove('activeTool'),
  //       recalcAllRoofCorners(),
  //       setPropertiesView('roofDefaults')
  //     break
  //   case 'dimension':
  //     ; (defaultCursor = 'crosshair'),
  //       deselectAll(),
  //       document.getElementById('pointerTool').classList.remove('activeTool'),
  //       document.getElementById('addWallTool').classList.remove('activeTool'),
  //       document.getElementById('addFloorTool').classList.remove('activeTool'),
  //       document.getElementById('addRoofTool').classList.remove('activeTool'),
  //       document.getElementById('addRulerTool').classList.add('activeTool'),
  //       document.getElementById('addTextTool').classList.remove('activeTool'),
  //       recalcAllWallCorners(),
  //       recalcAllRoofCorners(),
  //       setPropertiesView('dimensionDefaults')
  //     break
  //   case 'text':
  //     ; (defaultCursor = 'crosshair'),
  //       deselectAll(),
  //       document.getElementById('pointerTool').classList.remove('activeTool'),
  //       document.getElementById('addWallTool').classList.remove('activeTool'),
  //       document.getElementById('addFloorTool').classList.remove('activeTool'),
  //       document.getElementById('addRoofTool').classList.remove('activeTool'),
  //       document.getElementById('addRulerTool').classList.remove('activeTool'),
  //       document.getElementById('addTextTool').classList.add('activeTool'),
  //       setPropertiesView('textnDefaults')
  //     break
  //   case 'background':
  //     ; (defaultCursor = 'default'),
  //       document.getElementById('pointerTool').classList.remove('activeTool'),
  //       document.getElementById('addWallTool').classList.remove('activeTool'),
  //       document.getElementById('addFloorTool').classList.remove('activeTool'),
  //       document.getElementById('addRoofTool').classList.remove('activeTool'),
  //       document.getElementById('addRulerTool').classList.remove('activeTool'),
  //       document.getElementById('addTextTool').classList.remove('activeTool')
  //     break
  //   case 'ground':
  //     setLevel('0'),
  //       (threedTool = threedToolName),
  //       (defaultCursor = 'default'),
  //       (wallsGroup[0].opacity = 0.25),
  //       (floorsGroup[0].opacity = 0.25),
  //       (threedGroup[0].opacity = 0.25),
  //       document.getElementById('pointerTool').classList.remove('activeTool'),
  //       document.getElementById('addWallTool').classList.remove('activeTool'),
  //       document.getElementById('addFloorTool').classList.remove('activeTool'),
  //       document.getElementById('addRoofTool').classList.remove('activeTool'),
  //       document.getElementById('addRulerTool').classList.remove('activeTool'),
  //       document.getElementById('addTextTool').classList.remove('activeTool'),
  //       setPropertiesView('ground')
  //     break
  //   case 'defaults':
  //     ; (defaultCursor = 'default'),
  //       deselectAll(),
  //       document.getElementById('pointerTool').classList.remove('activeTool'),
  //       document.getElementById('addWallTool').classList.remove('activeTool'),
  //       document.getElementById('addFloorTool').classList.remove('activeTool'),
  //       document.getElementById('addRoofTool').classList.remove('activeTool'),
  //       document.getElementById('addRulerTool').classList.remove('activeTool'),
  //       document.getElementById('addTextTool').classList.remove('activeTool')
  // }
  // planView.style.cursor = defaultCursor
}

function setPropertiesView(element: string) {
  console.debug('setPropertiesView', element)
  switch (
    /*
    // 'background' != element && 'background' === threedTool && setThreedTool('pointer'),
    // document.getElementById('threed3DModelPropertiesView').style.display = 'none',
    // document.getElementById('threedPropertiesView').style.display = 'none',
    // document.getElementById('planViewPropertiesView').style.display = 'none',
    // document.getElementById('3dViewPropertiesView').style.display = 'none',
    // document.getElementById('wallPropertiesView').style.display = 'none',
    // document.getElementById('roofPropertiesView').style.display = 'none',
    // document.getElementById('floorPropertiesView').style.display = 'none',
    // document.getElementById('dimensionPropertiesView').style.display = 'none',
    // document.getElementById('textPropertiesView').style.display = 'none',
    // document.getElementById('defaultsPropertiesView').style.display = 'none',
    // document.getElementById('wallDefaultsPropertiesView').style.display = 'none',
    // document.getElementById('floorDefaultsPropertiesView').style.display = 'none',
    // document.getElementById('roofDefaultsPropertiesView').style.display = 'none',
    // document.getElementById('dimensionDefaultsPropertiesView').style.display = 'none',
    // document.getElementById('textDefaultsPropertiesView').style.display = 'none',
    // document.getElementById('levelPropertiesView').style.display = 'none',
    // document.getElementById('groundPropertiesView').style.display = 'none',
    */
    element
  ) {
    case 'model3dMeta':
      document.getElementById('threed3DModelPropertiesView').style.display = 'block'
      break
    case 'threed':
      document.getElementById('threedPropertiesView').style.display = 'block'
      break
    case 'planView':
      document.getElementById('planViewPropertiesView').style.display = 'block'
      break
    case '3dView':
      document.getElementById('3dViewPropertiesView').style.display = 'block'
      break
    case 'wallPath':
      document.getElementById('wallPropertiesView').style.display = 'block'
      break
    case 'roofPath':
      document.getElementById('roofPropertiesView').style.display = 'block'
      break
    case 'floor':
      document.getElementById('floorPropertiesView').style.display = 'block'
      break
    case 'dimension':
      document.getElementById('dimensionPropertiesView').style.display = 'block'
      break
    case 'text':
      document.getElementById('textPropertiesView').style.display = 'block'
      break
    case 'level':
      document.getElementById('levelPropertiesView').style.display = 'block'
      break
    case 'ground':
      document.getElementById('groundPropertiesView').style.display = 'block'
      // document.getElementById('groundWidthProp').value = groundWidth
      // document.getElementById('groundLengthProp').value = groundLength
      break
    case 'defaults':
      document.getElementById('defaultsPropertiesView').style.display = 'block'
      break
    case 'wallDefaults':
      document.getElementById('defaultWallHeightProp').style.backgroundColor = '#4e4e4e'
      // document.getElementById('defaultWallHeightProp').value = defaultWallHeight
      document.getElementById('defaultWallThicknessProp').style.backgroundColor = '#4e4e4e'
      // document.getElementById('defaultWallThicknessProp').value = defaultWallThickness
      document.getElementById('wallDefaultsPropertiesView').style.display = 'block'
      break
    case 'floorDefaults':
      document.getElementById('defaultFloorThicknessProp').style.backgroundColor = '#4e4e4e'
      // document.getElementById('defaultFloorThicknessProp').value = defaultFloorThickness
      document.getElementById('floorDefaultsPropertiesView').style.display = 'block'
      break
    case 'roofDefaults':
      document.getElementById('defaultRoofThicknessProp').style.backgroundColor = '#4e4e4e'
      // document.getElementById('defaultRoofThicknessProp').value = defaultRoofThickness
      document.getElementById('defaultRoofWidthProp').style.backgroundColor = '#4e4e4e'
      // document.getElementById('defaultRoofWidthProp').value = defaultRoofWidth
      document.getElementById('defaultRoofRiseProp').style.backgroundColor = '#4e4e4e'
      // document.getElementById('defaultRoofRiseProp').value = defaultRoofRise
      document.getElementById('defaultRoofStartHeightProp').style.backgroundColor = '#4e4e4e'
      // document.getElementById('defaultRoofStartHeightProp').value = defaultRoofStartHeight
      document.getElementById('roofDefaultsPropertiesView').style.display = 'block'
      // updateExtraDefaultRoofInfo()
      break
    case 'dimensionDefaults':
      break
    case 'textDefaults':
  }
}


function showThreedLicenseSummary(threedItem: TThreedItem) {
  console.debug('showThreedLicenseSummary', threedItem)
  // const threedItem = threedItem // threedItems[threedItem]
  try {
    document.getElementById('model3dName').innerText = threedItem.title
    let o = threedItem.author
    document.getElementById('model3dAuthor').innerText = threedItem.author
    let licenseLink = 'License: Default'

    switch (threedItem.license) {
      case 'Free Art License 1.3':
        licenseLink =
          '<a href="http://artlibre.org/licence/lal/en/" target="_blank" rel="noreferrer">' +
          threedItem.license +
          '</a>'
        break
      case 'CC0':
        licenseLink =
          '<a href="https://creativecommons.org/publicdomain/zero/1.0/" target="_blank" rel="noreferrer">' +
          threedItem.license +
          '</a>'
        break
      case 'CC BY 3.0':
        licenseLink =
          '<a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">' +
          threedItem.license +
          '</a>'
        break
      case 'CC BY 4.0':
        licenseLink =
          '<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">' +
          threedItem.license +
          '</a>'
        break
      default:
        licenseLink = threedItem.license
        // '<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">' +
        //   threedItem.license +
        // '</a>'
    }
    document.getElementById('model3dLicense').innerHTML = licenseLink
    // @ts-expect-error
    document.getElementById('model3dLargeThumb').src = threedItemsURL + 'objects/' + threedItem.title + '.png'
    document.getElementById('model3dLink').innerHTML = 
      '<a href="' + threedItem.threedLink + '" target="_blank" rel="noreferrer">' +
      'external' +
      '</a>'
    setPropertiesView('model3dMeta')
  } catch (err) {
    console.debug(err)
  }
}

// ** Drag Functions
function beginDrag(event: any, threedItem: TThreedItem) {

  // const thisEvent = event // the triggering event sent to this function
  // const threedItem = threedItem // threedItems[threedItem]
  console.debug('%c beginDrag: event', ccm.yellowAlert, event)
  console.debug('%c beginDrag: threedItem', ccm.yellowAlert, threedItem)

  try {
    showThreedLicenseSummary(threedItem)
    setThreedTool('pointer')

    // **
    // ** ?? ONLY DO THIS IF NEEDED/INTENDED (with intent) ;) [MM]
    // **
    // if (threedItem != draggingThreedItem) {

      draggingThreedItem = threedItem // set global var to this function parameter
      draggingThreedIcon = true
      planView = document.getElementById('planView')

      let PAPERviewToProject = paper.view.viewToProject(
        new paper.Point(
          event.pageX - planView.offsetLeft,
          event.pageY - planView.offsetTop
        )
      )
      // console.debug('beginDrag: PAPERviewToProject', PAPERviewToProject)
      draggingThreedRectangle.position = PAPERviewToProject
      draggingThreedRectangle.visible = false

      // if (threedItem) {
      threedItem.scale && threedItem.scale.x
        ? draggingThreedRectangle.bounds.width = threedItem.size.x * threedItem.scale.x
        : draggingThreedRectangle.bounds.width = threedItem.size.x
      threedItem.scale && threedItem.scale.z
        ? draggingThreedRectangle.bounds.height = threedItem.size.z * threedItem.scale.z
        : draggingThreedRectangle.bounds.height = threedItem.size.z
      // }

      threedDragDiv = document.getElementById('threedDragDiv')
      threedDragDiv.style.background = 'url(' + threedItemsURL + 'objects/' + threedItem.title + '_top.png)'
      threedDragDiv.style.backgroundRepeat = 'no-repeat'
      
      let widthA = draggingThreedRectangle.bounds.width
      let heightN = draggingThreedRectangle.bounds.height
      widthA *= paper.view.zoom
      heightN *= paper.view.zoom
      
      threedDragDiv.style.left = event.clientX - widthA / 2 + 'px'
      threedDragDiv.style.top = event.clientY - heightN / 2 + 'px'
      threedDragDiv.style.width = widthA + 'px'
      threedDragDiv.style.height = heightN + 'px'
      threedDragDiv.style.backgroundSize = widthA + 'px ' + heightN + 'px'
      threedDragDiv.style.display = 'block'
    
    // }

  } catch (err) {
    console.debug('%c beginDrag: err', ccm.redAlert, err)
  }
}

function addThreed(event: any, threedItem: any, scene: any) {
  console.debug('addThreed: ================================')
  console.debug('addThreed: event', event)
  console.debug('addThreed: scene', scene)
  console.debug('addThreed: threedItem', threedItem)
  try {
    if (!draggingThreedRectangle?.position) {
      console.debug('addThreed: draggingThreedRectangle POSITION DOES NOT EXIST', draggingThreedRectangle)
      draggingThreedRectangle = new paper.Path.Rectangle(
        // new paper.Point(-1, -1),
        new paper.Point(event.x, event.y),
        new paper.Point(1, 1)
      )
    }
    console.debug('addThreed: draggingThreedRectangle', draggingThreedRectangle)
    console.debug('addThreed: paper', paper)
    // console.debug('addThreed: paper.view.bounds', paper.view.bounds)

    if (draggingThreedRectangle.position.x > paper.view.bounds.left + 0) { // [MM] plus N pixel movement
      if ( draggingThreedRectangle.position.y > paper.view.bounds.top 
        && draggingThreedRectangle.position.y < paper.view.bounds.bottom ) {
        console.debug('addThreed: dropped inside planView successfully', draggingThreedRectangle)
        // **
        initThreed(draggingThreedItem, scene)
        // **
      } else if (draggingThreedRectangle.position.y > paper.view.bounds.bottom) {
          console.debug('addThreed: dropped inside 3dView -- todo: implement')
          // **
          initThreed(draggingThreedItem, scene)
          // **
      } else {
        console.debug('addThreed: not dropped inside views 2')
        // **
        initThreed(draggingThreedItem, scene)
        // **
      }
    } else {
      console.debug('addThreed: dropped not inside views 1')
      // **
      initThreed(draggingThreedItem, scene)
      // **
    }

    draggingThreedIcon = false
    threedDragDiv.style.display = 'none'
    threedDragDiv.style.background = 'url("images/homedesign/thumbPlaceHolder.png")'
    draggingThreedRectangle.visible = false
    // draggingThreedRectangle.position.x = 0 // NO !!!
    // draggingThreedRectangle.position.y = 0 // NO !!!
    // threedItem = draggingThreedItem
    // console.debug('addThreed: threedItem', threedItem)
    event.preventDefault()

  } catch (err) {
    console.debug('%c addThreed: err', ccm.redAlert, err)
  }
}

function initThreed(threedItem: any, scene: any) {
  console.debug('initThreed: threedItem', threedItem)
  console.debug('initThreed: scene', scene)

  try {
    new MTLLoader()
      .setCrossOrigin('anonymous')
      .setPath(threedItemsURL + 'objects/')
      .load(threedItem.title + '.mtl', function (MTLa: any) {
        MTLa.baseUrl = threedItemsURL + 'objects/'
        MTLa.preload()
        new OBJLoader()
        .setMaterials(MTLa)
        .setPath(threedItemsURL + 'objects/')
        .load(
          threedItem.title + '.obj',
          function (OBJa: any) {
            console.debug('initThreed: OBJa', OBJa)
            try {
              const mmScalePercentage = 1 // 0.02 // 1 | 0.1
              OBJa.scale.x = mmScalePercentage
              OBJa.scale.y = mmScalePercentage
              OBJa.scale.z = mmScalePercentage

              var imageN = document.createElement('img') // new Image()
              imageN.crossOrigin = 'anonymous'
              imageN.src = threedItemsURL + 'objects/' + threedItem.title + '_top.png'
              imageN.onload = function () {
                var OBJaBox = new THREE.Box3().setFromObject(OBJa)
                OBJa.userData.width  = OBJaBox.max.x - OBJaBox.min.x
                OBJa.userData.height = OBJaBox.max.y - OBJaBox.min.y
                OBJa.userData.depth  = OBJaBox.max.z - OBJaBox.min.z
                for (var i = 0; i < OBJa.children.length; i++) {
                  var r = OBJaBox.min.x + (OBJaBox.max.x - OBJaBox.min.x) / 2
                  var s = OBJaBox.min.y + (OBJaBox.max.y - OBJaBox.min.y) / 2 - (OBJaBox.max.y - OBJaBox.min.y) / 2
                  var d = OBJaBox.min.z + (OBJaBox.max.z - OBJaBox.min.z) / 2
                  OBJa.children[i].translateX(-r)
                  OBJa.children[i].translateY(-s)
                  OBJa.children[i].translateZ(-d)
                }
                var OBJaBoxHelper = new THREE.BoxHelper(OBJa, 16711680)
                OBJaBoxHelper.material.linewidth = 5
                OBJaBoxHelper.visible = false
                OBJa.add(OBJaBoxHelper)
                OBJa.position.x = draggingThreedRectangle.position.x
                OBJa.position.z = draggingThreedRectangle.position.y
                // OBJa.position.y = (threedItem.size.z * mmScalePercentage / 1) // / 2 // half the total diameter of the object
                // OBJa.position.y = (OBJa.userData.height * mmScalePercentage / 1) // half the total diameter of the object
                OBJa.position.y = 0 // floor
                  // 0.1 +
                  // paper.project.activeLayer.data.height +
                  // defaultFloorThickness
                console.debug('draggingThreedRectangle', draggingThreedRectangle)
                console.debug('paper.project.activeLayer', paper.project.activeLayer)
                console.debug('OBJaBox', OBJaBox)

                // // scene.add(OBJa)
                // // canvasStateThreeDVar().scene.add(OBJa)
                // canvasStateThreeDVar().state.scene.add(OBJa)

                clickableObjectsCounter++
                var draggingThreedItemU = clickableObjectsCounter
                OBJa.name = draggingThreedItemU
                clickableObjects[draggingThreedItemU] = OBJa

                var OBJaBoxGeometry = new THREE.BoxGeometry(
                  OBJa.userData.width,
                  OBJa.userData.height,
                  OBJa.userData.depth
                )
                console.debug('OBJa', OBJa)

                let rectangleOh: paper.Path.Rectangle = null // new paper.Path.Rectangle(this.bounds)

                var rasterImageN = new paper.Raster(imageN)
                rasterImageN.visible = false
                rasterImageN.onLoad = function () {
                  // if (
                    
                    rasterImageN.data.type = 'threed'
                    rasterImageN.opacity = 0.5
                    rasterImageN.bounds.width = OBJaBox.max.x - OBJaBox.min.x
                    rasterImageN.bounds.height = OBJaBox.max.z - OBJaBox.min.z
                    rasterImageN.position = draggingThreedRectangle.position
                    rasterImageN.data.flipX = 1
                    rasterImageN.data.flipZ = 1
                    rasterImageN.fillColor = new paper.Color(100, 100, 100, 1)
                    rasterImageN.selectedColor = new paper.Color(0, 0, 0, 0)

                    // readOnly ||
                    rasterImageN.onMouseDown = function (e: any) {
                      if ('pointer' === threedTool) {
                        deselectAll()
                        selectedItem = this
                        mouseMode = 0
                        offsetMousePoint = selectedItem.position.subtract(e.point)
                        offsetMousePoint.x = parseInt(offsetMousePoint.x)
                        offsetMousePoint.y = parseInt(offsetMousePoint.y)
                        selectedItem.bringToFront()
                        this.data.toolsRectangleInner && this.data.toolsRectangleInner.remove()
                        this.rotation = 0
                        rectangleOh = new paper.Path.Rectangle(this.bounds)
                        this.rotation = this.data.angle
                        rectangleOh.data.type = 'toolsRectangle'
                        rectangleOh.strokeColor = new paper.Color(177, 144, 100, 1) // '#b19064'
                        rectangleOh.strokeWidth = 1
                        rectangleOh.strokeScaling = false
                        rectangleOh.locked = true
                        rectangleOh.rotate(this.data.angle)
                        this.data.toolsRectangleInner = rectangleOh
                        rectangleOh.visible = true
                        this.data.boxHelper.visible = true
                        redrawGrid()
                        rotateIcon.visible = true
                        resizeIcon.visible = true
                        elevateIcon.visible = true
                        heightIcon.visible = true
                        // @ts-expect-error
                        toolsGroup[0].position = selectedItem.bounds.center
                        // @ts-expect-error
                        toolsGroup[0].visible = true
                        // @ts-expect-error
                        toolsGroup[0].bringToFront()
                        rotateIcon.bringToFront()
                        resizeIcon.bringToFront()
                        elevateIcon.bringToFront()
                        heightIcon.bringToFront()
                        rotateIcon.data.level = paper.project.activeLayer.data.id
                        resizeIcon.data.level = paper.project.activeLayer.data.id
                        elevateIcon.data.level = paper.project.activeLayer.data.id
                        heightIcon.data.level = paper.project.activeLayer.data.id
                        // @ts-expect-error
                        toolsGroup[0].data.level = paper.project.activeLayer.data.id
                        modalModel3dThreedId = threedItem.title
                        // updateObjectPropertiesWindow()
                      }
                    }

                    rasterImageN.data.id = draggingThreedItemU
                    rasterImageN.data.name = threedItem.title
                    rasterImageN.data.boxHelper = OBJaBoxHelper
                    rasterImageN.data.level = paper.project.activeLayer.data.id
                    
                  // )

                  if (threedItem.useMask) {
                    // @ts-expect-error
                    rasterImageN.useMask = true
                    var meshN = new THREE.Mesh(
                      OBJaBoxGeometry,
                      new THREE.MeshStandardMaterial({})
                    )
                    console.debug('meshN', meshN)
                    // @ts-expect-error
                    imageN.position.x = OBJa.position.x
                    // @ts-expect-error
                    imageN.position.y = OBJa.position.y
                    // @ts-expect-error
                    imageN.position.z = OBJa.position.z
                    // @ts-expect-error
                    imageN.geometry.translate(0, OBJa.userData.height / 2, 0)
                    // @ts-expect-error
                    imageN.visible = false
                    
                    // scene.add(meshN)
                    // @ts-expect-error
                    canvasStateThreeDVar().state.scene.add(meshN)
                    console.debug('meshN added to scene')

                    maskObjects[draggingThreedItemU] = meshN
                    imageN.name = 'mask' + draggingThreedItemU
                  }


                  // scene.add(OBJa)
                  // @ts-expect-error
                  canvasStateThreeDVar().state.scene.add(OBJa)
                  console.debug('OBJa added to scene')


                  // **
                  if (rectangleOh) {
                    var i = (rectangleOh.bounds.left + 360) % 360
                    rasterImageN.rotate(i)
                    rasterImageN.data.angle = i
                    // @ts-expect-error
                    clickableObjects[draggingThreedItemU].rotateY((-i / 180) * Math.PI)
                    if (maskObjects[draggingThreedItemU]) {
                      // @ts-expect-error
                      maskObjects[draggingThreedItemU].rotateY((-i / 180) * Math.PI)
                      // @ts-expect-error
                      maskObjects[draggingThreedItemU].scale.x = 1
                      // @ts-expect-error
                      maskObjects[draggingThreedItemU].scale.y = 1
                      // @ts-expect-error
                      maskObjects[draggingThreedItemU].scale.z = 1
                    }
                  } 
                  else {
                    rasterImageN.data.angle = 0
                    // DO NOT USE TRACKBALL CONTROLS (OR TWEEN)
                    // tween = new TWEEN.Tween(controls.target)
                    // .to(OBJa.position, 500)
                    // .onUpdate(render)
                    // .start()
                    rasterImageN.visible = true
                    Threed[draggingThreedItemU] = threedItem
                    try {
                      // @ts-expect-error
                      threedGroup[paper.project.activeLayer.data.id].addChild(
                        Threed[draggingThreedItemU]
                      )
                    } catch (err) {
                      console.debug('err', err)
                    }
                    // @ts-expect-error
                    plan.threed[draggingThreedItemU] = {
                      id: draggingThreedItemU,
                      name: threedItem.title,
                      // @ts-expect-error
                      position: clickableObjects[draggingThreedItemU].position,
                      // @ts-expect-error
                      scale: clickableObjects[draggingThreedItemU].scale,
                      // @ts-expect-error
                      rotation: clickableObjects[draggingThreedItemU].rotation,
                      width: rasterImageN.bounds.width,
                      depth: rasterImageN.bounds.height,
                      angle: rasterImageN.data.angle,
                      level: rasterImageN.data.level,
                      flipX: rasterImageN.data.flipX,
                      flipZ: rasterImageN.data.flipZ,
                    }
                    progressBar.style.display = 'none'
                  }
                  for (
                    var r = rasterImageN.canvas.getContext('2d'),
                        s = r.getImageData(0, 0, rasterImageN.width, rasterImageN.height),
                        d = s.data,
                        g = 0;
                        g < d.length;
                        g += 4
                  )
                  d[g] = 255 - d[g]
                  d[g + 1] = 255 - d[g + 1]
                  d[g + 2] = 255 - d[g + 2]
                  r.putImageData(s, 0, 0)
                  // updatePlanHistory(
                  //   plan,
                  //   draggingThreedItemU,
                  //   null,
                  //   null,
                  //   null,
                  //   null,
                  //   null,
                  //   null,
                  //   null,
                  //   null,
                  //   null,
                  //   null,
                  //   null,
                  //   null,
                  //   null,
                  //   null,
                  //   null,
                  //   null,
                  //   null
                  // )
                
                } // end rasterImageN.onload function
              } // end imageN.onload function


            } catch (e) {
              console.dir(e)
            }
          },
          onProgress,
          onError
        )
      })
  } catch (err) {
    console.debug('%c initThreed: err', ccm.redAlert, err)
  }
}

// ** DRAW GRID path lines x,y
function drawGridNew(paperScope: paper.PaperScope, gridSize: number) {

  const { view, Path } = paperScope
  // let { width, height } = view.size
  let planCanvas = document.getElementById('planCanvas')
  // @ts-expect-error
  planCanvas.width = roundTo(planCanvas.parentNode.getBoundingClientRect().width, 0)
  // @ts-expect-error
  planCanvas.height = roundTo(planCanvas.parentNode.getBoundingClientRect().height, 0)
  // @ts-expect-error
  let width = roundTo(planCanvas.width, 0)
  // @ts-expect-error
  let height = roundTo(planCanvas.height, 0)
  console.debug('%c drawGridNew: width:height', ccm.darkgrayAlert, width, height)

  // x lines
  for (let x = 0; x <= width; x += gridSize) {
    let pathLineX = new Path.Line({
      from: [x, 0],
      to: [x, height],
      strokeColor: new paper.Color(96, 96, 96, 1),
      strokeWidth: 0.50,
      strokeScaling: true,
    })
    xLines.push(pathLineX)
    // @ts-expect-error
    gridGroup[0].addChild(pathLineX)
  }
  // y lines
  for (let y = 0; y <= height; y += gridSize) {
    let pathLineY = new Path.Line({
      from: [0, y],
      to: [width, y],
      strokeColor: new paper.Color(96, 96, 96, 1),
      strokeWidth: 0.50,
      strokeScaling: true,
    })
    yLines.push(pathLineY)
    // @ts-expect-error
    gridGroup[0].addChild(pathLineY)
  }
}
// ** REDRAW Functions
function redrawTexts() {
  Object.keys(Dimensions).forEach(function (e: any) {
    var t = Dimensions[e as any]
    // @ts-expect-error
    "object" == typeof t && (Dimensions[e].text.fontSize = screenScale / 1.5)
  })
  Object.keys(Texts).forEach(function (e: any) {
    var t = Texts[e as any]
    // @ts-expect-error
    "object" == typeof t && (Texts[e].fontSize = screenScale / 1.5)
  })
}
function redrawGrid(): boolean {
  // **
  if (redrawing = true && threedUILayout != '3dView') {
    console.debug('redrawGrid: redrawing?', true)
    
    if (paper.view == null) {
      // redrawing = false
      // default: did not redrawGrid
      return false

    } else {

      // draw initial grid on paper planCanvas
      drawGridNew(paper, 20)

      // dimensions of planView container of planCanvas
      const planView = document.getElementById('planView')
      const planViewWidth = planView.clientWidth
      const planViewHeight = planView.clientHeight
      // console.debug('redrawGrid: planView.width:height', planViewWidth, planViewHeight)
      // dimensions of planCanvas
      const planCanvas = document.getElementById('planCanvas')
      // @ts-expect-error
      planCanvas.width = planViewWidth
      // @ts-expect-error
      planCanvas.height = planViewHeight
      const planCanvasWidth = planCanvas.clientWidth
      const planCanvasHeight = planCanvas.clientHeight
      // console.debug('redrawGrid: planCanvas.width:height', planCanvasWidth, planCanvasHeight)

      // console.debug('redrawGrid: screen.width:height', screen.width, screen.height)
      // screenScale = ((screen.width + screen.height) / 2) / paper.view.zoom / 75
      // screenScale = ((screen.width + screen.height) / 2)
      // console.debug('redrawGrid: screenScale', screenScale)


      // ** [MM] SELECTED ITEM -- Testing
      console.debug('selectedItem?', selectedItem)
      if (selectedItem && selectedItem.data) {
        console.debug('selectedItem.data', selectedItem.data)
        if ('wallPath' === selectedItem.data.type) {
          console.debug('selectedItem.data.type', selectedItem.data.type)
          var e = 0
          selectedItem.segments.forEach(function (t: any) {
            movePointIcons[e] &&
              // @ts-expect-error
              ((movePointIcons[e].position = t.point),
              // @ts-expect-error
                (movePointIcons[e].bounds.width = screenScale),
              // @ts-expect-error
                (movePointIcons[e].bounds.height = screenScale),
                e++)
          })
        } 
        else if ('roofPath' === selectedItem.data.type) {
          console.debug('selectedItem.data.type', selectedItem.data.type)
          var e = 0
          selectedItem.segments.forEach(function (t: any) {
            movePointIcons[e] &&
              // @ts-expect-error
              ((movePointIcons[e].position = t.point),
              // @ts-expect-error
                (movePointIcons[e].bounds.width = screenScale),
              // @ts-expect-error
                (movePointIcons[e].bounds.height = screenScale),
                e++)
          })
        } 
        else if ('threed' === selectedItem.data.type) {
          console.debug('selectedItem.data.type', selectedItem.data.type)
          rotateIcon.bounds.width = screenScale
          rotateIcon.bounds.height = screenScale
          rotateIcon.position =
            selectedItem.data.toolsRectangleInner.segments[1].point
          resizeIcon.bounds.width = screenScale
          resizeIcon.bounds.height = screenScale
          resizeIcon.position =
            selectedItem.data.toolsRectangleInner.segments[3].point
          heightIcon.bounds.width = screenScale
          heightIcon.bounds.height = screenScale
          heightIcon.position =
            selectedItem.data.toolsRectangleInner.segments[2].point
          elevateIcon.bounds.width = screenScale
          elevateIcon.bounds.height = screenScale
          elevateIcon.position =
            selectedItem.data.toolsRectangleInner.segments[0].point
        } 
        else if ('background' === selectedItem.data.type) {
          console.debug('selectedItem.data.type', selectedItem.data.type)
          resizeIcon.bounds.width = screenScale
          resizeIcon.bounds.height = screenScale
          resizeIcon.position =
              backgroundRaster.data.toolsRectangleInner.segments[3].point
        } 
        else if ('floor' === selectedItem.data.type) {
          console.debug('selectedItem.data.type', selectedItem.data.type)
          var e = 0
          selectedItem.segments.forEach(function (t: any) {
            movePointIcons[e] &&
              // @ts-expect-error
              ((movePointIcons[e].position = t.point),
              // @ts-expect-error
                (movePointIcons[e].bounds.width = screenScale),
              // @ts-expect-error
                (movePointIcons[e].bounds.height = screenScale),
                e++)
          })
        }
      }

      // ** [MM] Paper: Hit Tolerance and Zoom Amount
      var hitToleranceT = 0,
          o = 0
      paper.view.zoom < 0.1875
      
      ? ((hitToleranceT = 200),
        (o = 2e3),
        (snapTolerance = 100),
        (paper.settings.hitTolerance = 3))
      
      : paper.view.zoom < 0.375

        ? ((hitToleranceT = 100),
          (o = 1e3),
          (snapTolerance = 50),
          (paper.settings.hitTolerance = 3))
        
        : paper.view.zoom < 0.75

          ? ((hitToleranceT = 50),
            (o = 500),
            (snapTolerance = 25),
            (paper.settings.hitTolerance = 3))
            
          : paper.view.zoom < 1.5

            ? ((hitToleranceT = 20),
              (o = 200),
              (snapTolerance = 10),
              (paper.settings.hitTolerance = 3))

            : paper.view.zoom < 3

              ? ((hitToleranceT = 10),
                (o = 100),
                (snapTolerance = 5),
                (paper.settings.hitTolerance = 3))

              : paper.view.zoom < 6

                ? ((hitToleranceT = 5),
                  (o = 50),
                  (snapTolerance = 2),
                  (paper.settings.hitTolerance = 3))

                : paper.view.zoom < 12

                  ? ((hitToleranceT = 2),
                    (o = 20),
                    (snapTolerance = 1),
                    (paper.settings.hitTolerance = 2))
                    
                  : paper.view.zoom < 24 &&

                    ((hitToleranceT = 1),
                      (o = 10),
                      (snapTolerance = 0.5),
                      (paper.settings.hitTolerance = 1))
      // ** [MM] END: Paper: Hit Tolerance ???
      console.debug('redrawGrid: hitToleranceT', hitToleranceT)
      

      // ** [MM] RULER CONTEXT ??? 
      // ** YES -- THIS CLEARS THE GRID BEFORE REDRAWING
      rulerLeftCtx.clearRect(0, 0, 30, rulerLeft.height)
      rulerBottomCtx.clearRect(0, 0, rulerBottom.width, 20)

      // ** [MM] RULER LINES ???
      var a = paper.view.bounds.left % hitToleranceT
      var n = 0
      xLines.forEach(function (e: any) {
        e.segments[0].point.x = paper.view.bounds.left + n - a
        e.segments[0].point.y = paper.view.bounds.top
        e.segments[1].point.x = paper.view.bounds.left + n - a
        e.segments[1].point.y = paper.view.bounds.bottom
        var x = parseInt(e.segments[0].point.x)
        0 === x
          ? ((e.style.strokeColor = 'white'),
            rulerBottomCtx.fillText(
              '0cm',
              (x - paper.view.bounds.left) * paper.view.zoom,
              14
            ))
          : x % o === 0
            ? ((e.style.strokeColor = '#81673a'),
              rulerBottomCtx.fillText(
                (paper.view.bounds.left + n - a).toString() + '',
                (x - paper.view.bounds.left) * paper.view.zoom,
                14
              ))
            : (e.style.strokeColor = '#564c3a')
        n += hitToleranceT
      })
      var l = paper.view.bounds.top % hitToleranceT
          n = 0
      yLines.forEach(function (e: any) {
        e.segments[0].point.x = paper.view.bounds.left
        e.segments[0].point.y = paper.view.bounds.top + n - l
        e.segments[1].point.x = paper.view.bounds.right
        e.segments[1].point.y = paper.view.bounds.top + n - l
        var y = parseInt(e.segments[0].point.y)
        0 === y
          ? ((e.style.strokeColor = 'white'),
            rulerLeftCtx.fillText(
              '0cm',
              26,
              (y - paper.view.bounds.top) * paper.view.zoom + 4
            ))
          : y % o === 0
            ? ((e.style.strokeColor = '#81673a'),
              rulerLeftCtx.fillText(
                (paper.view.bounds.top + n - l).toString() + '',
                26,
                (y - paper.view.bounds.top) * paper.view.zoom + 4
              ))
            : (e.style.strokeColor = '#564c3a')
        n += hitToleranceT
      })
      //

      Object.keys(verticalGuides).forEach(function (e: any) {
        // @ts-expect-error
        verticalGuides[e].segments[0].point.y = paper.view.bounds.top
        // @ts-expect-error
        verticalGuides[e].segments[1].point.y = paper.view.bounds.bottom
      })
      Object.keys(horizontalGuides).forEach(function (e: any) {
        // @ts-expect-error
        horizontalGuides[e].segments[0].point.x = paper.view.bounds.left
        // @ts-expect-error
        horizontalGuides[e].segments[1].point.x = paper.view.bounds.right
      })

      // ** done: set redrawing to false
      redrawing = false
      return true
    }
  }
  // default: did not redrawGrid
  return false
}

// ==============================================================

/* */

// ==============================================================
// ** 🟣 CATALOG ITEMS
const CatalogItems = (props: any): React.ReactNode => {
  // console.debug('threedItemsJSON', threedItemsJSON)
  const [catalogItems, setCatalogItems] = useState(threedItemsJSON)

  // async function fetchObjects() {
  //   let res = await fetch('/api/home-design') // objects.json
  //   let data = await res.json()
  //   console.debug('fetchObjects data', data)
  //   // if (!catalogItems) {
  //     setCatalogItems(data)
  //   // }
  // }
  // if (!catalogItems) {
  //   fetchObjects()
  // }
  if (!catalogItems) {
    setCatalogItems(threedItemsJSON)
  }

  if (!catalogItems) {
    return <div>Loading...</div>
  }

  return (
    <div id='catalogItemObjects'>
      {/* 👇️ Iterate the array's OBJECTS */}
      {threedItems.map((object: any) => {
        return (
          <div 
            key={object.title + '_' + Math.random()} 
            id={object.title} 
            className='threedItem disableSelection' 
            onMouseDown={(event) => beginDrag(event, object)}
          >
            <img 
              src={threedItemsURL + 'objects/' + object.title + '.png'}
              className='threedThumb' 
              alt={object.title}
              title={object.title}
            />
          </div>
        )
      })}
    </div>
  )
}

/* */

// ==============================================================
// ** EXPORT JSX
export default function ThreeDHomeDesign({
  panelLayout,
}: {
  panelLayout: number[][]
}): React.ReactNode { 

  // ** CAN USE MUTATION HOOK HERE 
  // -- must use inside the provider's children, inside a component function
  // -- so, move this to (page)?
  const username: string = process.env.NEXT_PUBLIC_WP_GRAPHQL_API_USERNAME
  const password: string = process.env.NEXT_PUBLIC_WP_GRAPHQL_API_PASSWORD
  // console.debug('LOGIN: password:', password)
  try {

    // ** use mutation
    const [login, { data, loading, error }] = useMutation(loginUser)
    // ** handle call mutation
    const handleLogin = async () => {
      try {
        const response = await login({
          variables: {
            // id: 'uniqueClientMutationId', // clientMutationId
            username: username,
            password: password,
          },
        })
        console.debug('LOGIN: successful:', response.data)
        // ** set Apollo ReactiveVar for User to this response.data

        // ** set localStorage.token to this response.data.login.authToken
        const currentToken = response.data.login.authToken
        localStorage.setItem('token', currentToken)

      } catch (err) {
        console.error('LOGIN: error:', err)
      }
    }
    // ** call mutation onMount
    useEffect(() => {
      handleLogin()
    }, [])

    // if (loading) {
    //   console.debug('ApolloClientWrapper LOADING: getLoginUser', loading)
    //   // return 'ApolloClientWrapper Submitting...'
    // }
  
    // if (error) {
    //   console.debug('ApolloClientWrapper ERROR: getLoginUser', error)
    //   // return `ApolloClientWrapper Submission error! ${error.message}`
    // }

    // currentToken = localStorage.getItem('token')
    // currentToken = process.env.GRAPHQL_JWT_TOKEN // NO!
  }
  catch (err) {
    console.debug('LOGIN: ERROR: getLoginUser', err)
  }

  // ==========================================================
  // ** PANEL LAYOUTS
  // ** get panel layout from cookies
  const onThreeDPanelGroup1 = (sizes: number[]) => {
    // console.debug('onThreeDPanelGroup1 sizes', sizes)
    document.cookie = `react-resizable-panels:ThreeDPanelGroup1:layout=${JSON.stringify(sizes)}`
  }
  const onThreeDPanelGroup2 = (sizes: number[]) => {
    // console.debug('onThreeDPanelGroup2 sizes', sizes)
    document.cookie = `react-resizable-panels:ThreeDPanelGroup2:layout=${JSON.stringify(sizes)}`
  }
  const onThreeDPanelGroup3 = (sizes: number[]) => {
    // console.debug('onThreeDPanelGroup3 sizes', sizes)
    document.cookie = `react-resizable-panels:ThreeDPanelGroup3:layout=${JSON.stringify(sizes)}`
  }
  
  // ==========================================================
  // ** HOOKS (into [onMount] STATES)
  // ==========================================================

  // **
  // console.debug('ThreeDHomeDesign: =================================')
  // console.debug('ThreeDHomeDesign: getApolloContext()', getApolloContext())
  // console.debug('ThreeDHomeDesign: preferencesStore', preferencesStore)
  // console.debug('ThreeDHomeDesign: preferencesStore.store.getState()', preferencesStore.store.getState())
  // console.debug('ThreeDHomeDesign: preferencesStore.actions.getState()', preferencesStore.actions.getState())
  // console.debug('ThreeDHomeDesign: preferencesDataVar()', preferencesDataVar())
  // console.debug('ThreeDHomeDesign: canvasStateThreeDVar()', canvasStateThreeDVar())
  // console.debug('ThreeDHomeDesign: =================================')

  // ** USE AUTH STATE
  // const auth = useAuth()
  // console.debug('useAuth(): auth', auth)
  
  // ** USE SESSION STATE
  // // const { data, status } = useSession()
  // const { data: sessionData, status: sessionStatus } = useSession()
  // console.debug('useSession().data', sessionData)
  // console.debug('useSession().status', sessionStatus)

  // ** USE CLIENT STATE
  const client = useApolloClient()
  // console.debug('%c🦆 useApolloClient()', ccm.orangeAlert) // , client

  // ** USE PREFERENCES STATE
  // const prefs = preferencesDataVar() // NO
  const prefs = useReactiveVar(preferencesDataVar) // YES !!
  // console.debug('%c⚙️ prefs', ccm.orangeAlert, prefs)
  // ** INIT PREFERENCES STATE
  // const [isPrefsLoaded, setIsPrefsLoaded] = useState(isPreferencesDataSetVar())

  // ** USE CANVAS STATE (Paper + ThreeD)
  // ** PAPER
  const useCanvasStatePaperVar = useReactiveVar(canvasStatePaperVar) // YES !!
  // console.debug('%c⚙️ useCanvasStatePaperVar', ccm.orangeAlert, useCanvasStatePaperVar)
  // ** CHECK CANVAS STATE Paper
  const [isCanvasPaperLoaded, setIsCanvasPaperLoaded] = useState(false)
  // const [isCanvasStatePaperLoaded, setIsCanvasStatePaperLoaded] = useState(isCanvasStatePaperSetVar())
  // ** THREED
  const useCanvasStateThreeDVar = useReactiveVar(canvasStateThreeDVar) // YES !!
  // console.debug('%c⚙️ useCanvasStateThreeDVar', ccm.orangeAlert, useCanvasStateThreeDVar)
  // ** CHECK CANVAS STATE ThreeD
  const [isCanvasThreeDLoaded, setIsCanvasThreeDLoaded] = useState(false)
  // const [isCanvasStateThreeDLoaded, setIsCanvasStateThreeDLoaded] = useState(isCanvasStateThreeDSetVar())

  // ** CHECK PAGE LOADED STATE
  const [isPageLoaded, setIsPageLoaded] = useState(false)

  // ==========================================================
  // ** USE CONTEXTS STATE (role-based abilities)
  // const abilities = useContext(AbilityContext)
  // const abilities = ['read', 'write', 'delete']
  // ==========================================================

  // ==========================================================
  // ** TESTING: THREE CANVAS[ES] as React State Variables
  // // ** get scene + camera from child component ThreeDCanvasViewer refCanvas
  // // const scene = useRef(null)
  // const getThreeState = useThree((state) => state.get)
  // // getThreeState() // Get fresh state from anywhere you want
  // console.debug('getThreeState()', getThreeState())
  // ** END TESTING: THREE CANVAS[ES] as React State Variables
  // ==========================================================

  // // ==========================================================
  // // ** TESTING: DOM ELEMENT as React State Variables
  // // ** USE DOM ELEMENT STATE
  // const [domElement, setDomElement] = useState(null)
  // useEffect(() => {
  //   console.debug('useEffect: document.body', document.body)
  //   setDomElement(document.body)
  //   // console.debug('useEffect: domElement', domElement)
  // }, [])
  // useEffect(() => {
  //   console.debug('useEffect: domElement', domElement)
  // }, [domElement])
  // const onDomElementChange = useCallback((event: any) => {
  //   console.debug('onChange: useCallback event', event)
  //   setDomElement(event.target.domElement)
  //   console.debug('onChange: useCallback domElement', domElement)
  // }, [])
  // // ** END TESTING: DOM ELEMENT as React State Variables
  // // ==========================================================

  // ==========================================================
  // ** USE PANELS STATE
  // ** PANELS as React State Variables
  // const [showPanelFirst, setShowPanelFirst] = useState(prefs.showPanelFirst)
  // const [showPanelLast, setShowPanelLast] = useState(prefs.showPanelLast)
  // ==========================================================
  
  // ==========================================================
  // Component onMount hook
  // **
  useEffect(() => {

    if (
      true &&
      !isPageLoaded && !isPreferencesDataSetVar()
    ) {
    
      // ** GET PREFERENCES
      const fetchData = async () => {
        // try {
          
        // ** GET PREFERENCES
          if (!isPreferencesDataSetVar()) {
            // **
            // const preferencesFromDataSource = await preferencesStore.actions.loadFromDataSource(client)
            const preferencesFromDataSource = await preferencesStore.actions.loadFromDB(client)
            if (DEBUG) 
              console.debug('%c preferences loading...', ccm.greenAlert)
            if (preferencesFromDataSource) {
              if (DEBUG) 
                console.debug('%c preferencesFromDataSource', ccm.greenAlert)
              const loadPreferencesOne = await preferencesStore.store.get('one')
              // const loadPreferencesOne = await preferencesStore.store.useStore('one')
              // console.debug('%c🦆 APOLLO STORE: get one preferences => loadPreferencesOne', ccm.redAlert, loadPreferencesOne)
              preferencesDataVar(loadPreferencesOne.data)
              console.debug('%c🦆 APOLLO STORE: FETCH preferencesDataVar()', ccm.redAlert, preferencesDataVar())
            }
          }
          isPreferencesDataSetVar(true)
          // setIsPrefsLoaded(isPreferencesDataSetVar())
          // console.debug('%c🦆 APOLLO STORE: FETCH isPreferencesDataSetVar()', ccm.redAlert, isPreferencesDataSetVar())
          if (preferencesDataVar().doAutoLoadData) {
            if (DEBUG) 
              console.debug('%c projects loading...', ccm.orangeAlert)
            // // const projectsFromDataSource = await projectStore.actions.loadFromDataSource(client)
            // const projectsFromDataSource = await projectStore.actions.loadFromDB(client)
            if (DEBUG) 
              console.debug('%c projects loaded!', ccm.orangeAlert)
            // if (projectsFromDataSource) {
            //   console.debug('%c🥕 projectsFromDataSource', ccm.redAlert)
            //   // ** TODO
            //   // ** do more tasks here ??
            // }
          }

          // ** GET CANVAS STATE: PAPER
          if (false && !isCanvasStatePaperSetVar()) {
            // **
            // const canvasStatePaperFromDataSource = await canvasStateStore.actions.loadFromDataSource(client)
            const canvasStatePaperFromDataSource = await canvasStateStore.actions.loadFromDB(client)
            if (DEBUG) 
              console.debug('%c canvasStatePaper loading...', ccm.greenAlert)
            if (canvasStatePaperFromDataSource) {
              if (DEBUG) 
                console.debug('%c canvasStatePaperFromDataSource', ccm.greenAlert)
              const loadCanvasStatePaperOne = await canvasStateStore.store.get('one')
              // const loadCanvasStatePaperOne = await canvasStateStore.store.useStore('one')
              // console.debug('%c🦆 APOLLO STORE: get one canvasStatePaper => loadCanvasStatePaperOne', ccm.redAlert, loadCanvasStatePaperOne)
              if (loadCanvasStatePaperOne) {
                canvasStatePaperVar(loadCanvasStatePaperOne.data)
                // console.debug('%c🦆 APOLLO STORE: FETCH canvasStatePaperVar()', ccm.redAlert, canvasStatePaperVar())
              }
            }
          }
          isCanvasStatePaperSetVar(true)
          // console.debug('%c🦆 APOLLO STORE: FETCH isPreferencesDataSetVar()', ccm.redAlert, isPreferencesDataSetVar())
          // // @ts-expect-error
          // if (canvasStatePaperVar().state?.scene !== null) {
          //   if (DEBUG) 
          //     console.debug('%c canvas states paper loading...', ccm.orangeAlert)
          // }

          // ** GET CANVAS STATE: THREED
          if (false && !isCanvasStateThreeDSetVar()) {
            // **
            // const canvasStateThreeDFromDataSource = await canvasStateStore.actions.loadFromDataSource(client)
            const canvasStateThreeDFromDataSource = await canvasStateStore.actions.loadFromDB(client)
            if (DEBUG) 
              console.debug('%c canvasStateThreeD loading...', ccm.greenAlert)
            if (canvasStateThreeDFromDataSource) {
              if (DEBUG) 
                console.debug('%c canvasStateThreeDFromDataSource', ccm.greenAlert)
              const loadCanvasStateThreeDOne = await canvasStateStore.store.get('one')
              // const loadCanvasStateThreeDOne = await canvasStateStore.store.useStore('one')
              // console.debug('%c🦆 APOLLO STORE: get one canvasStateThreeD => loadCanvasStateThreeDOne', ccm.redAlert, loadCanvasStateThreeDOne)
              canvasStateThreeDVar(loadCanvasStateThreeDOne.data)
              // console.debug('%c🦆 APOLLO STORE: FETCH canvasStateThreeDVar()', ccm.redAlert, canvasStateThreeDVar())
            }
          }
          isCanvasStateThreeDSetVar(true)
          // console.debug('%c🦆 APOLLO STORE: FETCH isPreferencesDataSetVar()', ccm.redAlert, isPreferencesDataSetVar())
          // // @ts-expect-error
          // if (canvasStateThreeDVar().state?.scene !== null) {
          //   if (DEBUG) 
          //     console.debug('%c canvas states threed loading...', ccm.orangeAlert)
          // }

          // ** READY TO GO ???
          setIsPageLoaded(true)

        // } catch (error) {
        //   console.error('Error fetching data:', error);
        // }
      }
      // ** DO THE DATA FETCH
      fetchData()
      if (DEBUG) 
        console.debug('%c🫙 ThreeD HD: fetching data ...', ccm.blueAlert)
      
    } else if (isPageLoaded) {
      console.debug('%c🦆 ThreeD HD: LOADED !!', ccm.redAlert, isPageLoaded)
    } else {
      console.debug('%c🦆 ThreeD HD: APOLLO: preferencesDataVar()', ccm.greenAlert, preferencesDataVar())
      console.debug('%c🦆 ThreeD HD: APOLLO: canvasStatePaperVar()', ccm.greenAlert, canvasStatePaperVar())
      console.debug('%c🦆 ThreeD HD: APOLLO: canvasStateThreeDVar()', ccm.greenAlert, canvasStateThreeDVar())
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
    // redrawGrid() // does not work here
  }
  function setShowPanelLast () {
    let newData = {...preferencesDataVar()} // latest prefs
    // console.debug('%c⚙️ showPanelLastLeva newData', ccm.green, newData)
    newData.showPanelLast = !prefs.showPanelLast // showPanelLastLeva
    // console.debug('%c⚙️ showPanelLastLeva newData UPDATED', ccm.green, newData)
    preferencesDataVar(newData)
    // console.debug('%c⚙️ showPanelLastLeva preferencesDataVar', ccm.darkgreen, preferencesDataVar())
    // redrawGrid() // does not work here
  }

  // ==========================================================

  // ==========================================================

  // if (DEBUG || debug) 
  //   console.debug('%c🌱 ThreeD HD mounting ...', ccm.darkgreenAlert)

    
  let project_title = 'NOT EVEN CLOSE'
  // if (DEBUG || debug) 
  //   console.debug('%c🌱 ThreeD HD mounting ...', ccm.darkgreen, project_title)


  // ** load old data.. no
  useEffect(() => {
    // // ** setup dom elements
    // switch (threedUILayout) {
    //   case '3dView':
    //     readOnly = true
    //     document.getElementById('planView').style.display = 'none'
    //     document.getElementById('view3d').style.top = '0px'
    //     document.getElementById('view3d').style.bottom = '0px'
    //     document.getElementById('view3d').style.left = '0px'
    //     document.getElementById('view3d').style.right = '0px'
    //     document.getElementById('view3d').style.display = 'block'
    //     document.getElementById('catalogView').style.display = 'none'
    //     document.getElementById('verticalSlider').style.display = 'none'
    //     document.getElementById('horizontalSliderLeft').style.display = 'none'
    //     document.getElementById('horizontalSliderRight').style.display = 'none'
    //     document.getElementById('fullscreenPlanViewBtn').style.display = 'none'
    //     document.getElementById('fullscreen3dViewBtn').style.right = '6px'
    //     document.getElementById('fullscreen3dViewBtn').style.bottom = '6px'
    //     document.getElementById('fullscreen3dViewBtn').style.opacity = '0.33'
    //     document.getElementById('fullscreen3dViewBtn').style.display = 'block'
    //     document.getElementById('propertiesView').style.display = 'none'
    //     document.getElementById('rulerLeft').style.display = 'none'
    //     document.getElementById('rulerBottom').style.display = 'none'
    //     document.getElementById('mouseIndicatorX').style.display = 'none'
    //     document.getElementById('mouseIndicatorY').style.display = 'none'
    //     document.getElementById('overlayLogo3dView').style.display = 'block'
    //     document.getElementById('overlayMenu3dView').style.display = 'block'
    //     break
    //   case 'planView':
    //     readOnly = true
    //     document.getElementById('planView').style.top = '0px'
    //     document.getElementById('planView').style.bottom = '0px'
    //     document.getElementById('planView').style.left = '0px'
    //     document.getElementById('planView').style.right = '0px'
    //     document.getElementById('planView').style.display = 'block'
    //     document.getElementById('view3d').style.display = 'none'
    //     document.getElementById('catalogView').style.display = 'none'
    //     document.getElementById('verticalSlider').style.display = 'none'
    //     document.getElementById('horizontalSliderLeft').style.display = 'none'
    //     document.getElementById('horizontalSliderRight').style.display = 'none'
    //     document.getElementById('fullscreenPlanViewBtn').style.right = '6px'
    //     document.getElementById('fullscreenPlanViewBtn').style.bottom = '30px'
    //     document.getElementById('fullscreenPlanViewBtn').style.opacity = '0.33'
    //     document.getElementById('fullscreenPlanViewBtn').style.display = 'block'
    //     document.getElementById('fullscreen3dViewBtn').style.display = 'none'
    //     document.getElementById('propertiesView').style.display = 'none'
    //     document.getElementById('rulerLeft').style.top = '0px'
    //     document.getElementById('rulerLeft').style.bottom = '20px'
    //     document.getElementById('rulerLeft').style.left = '0px'
    //     document.getElementById('rulerLeft').style.display = 'block'
    //     document.getElementById('rulerBottom').style.marginTop = '-20px'
    //     document.getElementById('rulerBottom').style.bottom = '0px'
    //     document.getElementById('rulerBottom').style.left = '30px'
    //     document.getElementById('rulerBottom').style.right = '0px'
    //     document.getElementById('rulerBottom').style.display = 'block'
    //     document.getElementById('mouseIndicatorX').style.top = '0px'
    //     document.getElementById('mouseIndicatorX').style.left = '0px'
    //     document.getElementById('mouseIndicatorX').style.width = '1px'
    //     document.getElementById('mouseIndicatorX').style.bottom = '0px'
    //     document.getElementById('mouseIndicatorX').style.display = 'block'
    //     document.getElementById('mouseIndicatorY').style.top = '0px'
    //     document.getElementById('mouseIndicatorY').style.left = '0px'
    //     document.getElementById('mouseIndicatorY').style.right = '0px'
    //     document.getElementById('mouseIndicatorY').style.height = '1px'
    //     document.getElementById('mouseIndicatorY').style.display = 'block'
    //     document.getElementById('overlayLogoPlanView').style.display = 'block'
    //     document.getElementById('overlayMenuPlanView').style.display = 'block'
    //     break
    //   default:
    //     threedUILayout = 'default'

    //     document.getElementById('planView').style.top = '54px'
    //     document.getElementById('planView').style.bottom = '50%'
    //     document.getElementById('planView').style.left = '318px'
    //     document.getElementById('planView').style.right = '0px'
    //     document.getElementById('planView').style.display = 'block'
        
    //     document.getElementById('view3d').style.top = '50%'
    //     document.getElementById('view3d').style.bottom = '0px'
    //     document.getElementById('view3d').style.left = '318px'
    //     document.getElementById('view3d').style.right = '0px'
    //     document.getElementById('view3d').style.display = 'block'

    //     document.getElementById('catalogView').style.top = '54px'
    //     document.getElementById('catalogView').style.left = '0px'
    //     document.getElementById('catalogView').style.width = '316px'
    //     document.getElementById('catalogView').style.height = '832px'
    //     document.getElementById('catalogView').style.display = 'block'
        

    //     // document.getElementById('verticalSlider').style.top = '54px'
    //     // document.getElementById('verticalSlider').style.bottom = '0px'
    //     // document.getElementById('verticalSlider').style.left = '316px'
    //     // document.getElementById('verticalSlider').style.width = '4px'
    //     // document.getElementById('verticalSlider').style.display = 'block'
    //     // document.getElementById('horizontalSliderLeft').style.top = '879px'
    //     // document.getElementById('horizontalSliderLeft').style.left = '0px'
    //     // document.getElementById('horizontalSliderLeft').style.width = '316px'
    //     // document.getElementById('horizontalSliderLeft').style.height = '4px'
    //     // document.getElementById('horizontalSliderLeft').style.display = 'block'
    //     // document.getElementById('horizontalSliderRight').style.top = '50%'
    //     // document.getElementById('horizontalSliderRight').style.left = '318px'
    //     // document.getElementById('horizontalSliderRight').style.width = '100%'
    //     // document.getElementById('horizontalSliderRight').style.height = '4px'
    //     // document.getElementById('horizontalSliderRight').style.display = 'block'
    //     // document.getElementById('fullscreenPlanViewBtn').style.right = '6px'
    //     // document.getElementById('fullscreenPlanViewBtn').style.top = '50%'
    //     // document.getElementById('fullscreenPlanViewBtn').style.opacity = '0.33'
    //     // document.getElementById('fullscreenPlanViewBtn').style.marginTop = '-58px'
    //     // document.getElementById('fullscreenPlanViewBtn').style.display = 'block'
    //     // document.getElementById('fullscreen3dViewBtn').style.right = '6px'
    //     // document.getElementById('fullscreen3dViewBtn').style.bottom = '6px'
    //     // document.getElementById('fullscreen3dViewBtn').style.opacity = '0.33'
    //     // document.getElementById('fullscreen3dViewBtn').style.display = 'block'
        
        
    //     // // document.getElementById('propertiesView').style.top = '880px'
    //     // // document.getElementById('propertiesView').style.left = '0px'
    //     // // document.getElementById('propertiesView').style.width = '306px'
    //     // // document.getElementById('propertiesView').style.bottom = '0px'
        
    //     // document.getElementById('propertiesView').style.display = 'block'


        // document.getElementById('rulerLeft').style.top = '56px'
        // document.getElementById('rulerLeft').style.bottom = '56px'
        // document.getElementById('rulerLeft').style.left = '320px'
        // document.getElementById('rulerLeft').style.display = 'block'
        // document.getElementById('rulerBottom').style.top = '50%'
        // document.getElementById('rulerBottom').style.marginTop = '-20px'
        // document.getElementById('rulerBottom').style.bottom = '0px'
        // document.getElementById('rulerBottom').style.left = '320px'
        // document.getElementById('rulerBottom').style.right = '0px'
        // document.getElementById('rulerBottom').style.display = 'block'
        document.getElementById('mouseIndicatorX').style.width = '1px'
        document.getElementById('mouseIndicatorX').style.position = 'absolute'
        document.getElementById('mouseIndicatorX').style.top = '20%'
        document.getElementById('mouseIndicatorX').style.bottom = '56px'
        document.getElementById('mouseIndicatorX').style.left = '320px'
        // document.getElementById('mouseIndicatorX').style.display = 'inline-flex'
        document.getElementById('mouseIndicatorX').style.display = 'none'

        document.getElementById('mouseIndicatorY').style.height = '1px'
        document.getElementById('mouseIndicatorY').style.position = 'absolute'
        document.getElementById('mouseIndicatorY').style.top = '56px'
        document.getElementById('mouseIndicatorY').style.left = '320px'
        document.getElementById('mouseIndicatorY').style.right = '0px'
        // document.getElementById('mouseIndicatorY').style.display = 'inline-flex'
        document.getElementById('mouseIndicatorY').style.display = 'none'
    // }

  /* */

    // 'default' === threedUILayout &&
    if (threedUILayout === 'default') {
      // $('#catalogItems').scroll(function () {
      //   loadInViewThumbs()
      // })
      

        // WORKING ON...
        
        /*
          if (
            ($.ajax({
              url: 'plans/threed-plan-example-001.threed',
              type: 'GET',
              contentType: 'application/json',
              success: function (e: any) {
                var t = JSON.parse(e)
                featuredPlanImage.src = t.thumb
              },
              error: function (e: any) {
                console.debug('document.ready : get thumb ajax : ' + e)
              },
            }),
              'default' === threedUILayout &&
              ($('#wallDiffuse').minicolors({
                opacity: true,
                change: function (e, t) {
                  var o = parseInt(e.replace('#', '0x'))
                    ; (wallMaterial.color = new THREE.Color(o)),
                      (wallMaterial.opacity = parseFloat(t)),
                      (plan.wallDiffuse = wallMaterial.color),
                      (plan.wallOpacity = wallMaterial.opacity),
                      render()
                },
              }),
                $('#roofDiffuse').minicolors({
                  opacity: true,
                  change: function (e, t) {
                    var o = parseInt(e.replace('#', '0x'))
                      ; (roofMaterial.color = new THREE.Color(o)),
                        (roofMaterial.opacity = parseFloat(t)),
                        (plan.roofDiffuse = roofMaterial.color),
                        (plan.roofOpacity = roofMaterial.opacity),
                        render()
                  },
                }),
                $('#wallSpecular').minicolors({
                  change: function (e: any) {
                    var t = parseInt(e.replace('#', '0x'))
                      ; (wallMaterial.specular = new THREE.Color(t)),
                        (plan.wallSpecular = wallMaterial.specular),
                        render()
                  },
                }),
                $('#roofSpecular').minicolors({
                  change: function (e: any) {
                    var t = parseInt(e.replace('#', '0x'))
                      ; (roofMaterial.specular = new THREE.Color(t)),
                        (plan.roofSpecular = roofMaterial.specular),
                        render()
                  },
                }),
                $('#floorDiffuse').minicolors({
                  opacity: true,
                  change: function (e, t) {
                    var o = parseInt(e.replace('#', '0x'))
                      ; (floorMaterial.color = new THREE.Color(o)),
                        (floorMaterial.opacity = parseFloat(t)),
                        (plan.floorDiffuse = floorMaterial.color),
                        (plan.floorOpacity = floorMaterial.opacity),
                        render()
                  },
                }),
                $('#floorSpecular').minicolors({
                  change: function (e: any) {
                    var t = parseInt(e.replace('#', '0x'))
                      ; (floorMaterial.specular = new THREE.Color(t)),
                        (plan.floorSpecular = floorMaterial.specular),
                        render()
                  },
                }),
                $('#groundDiffuse').minicolors({
                  opacity: true,
                  change: function (e, t) {
                    var o = parseInt(e.replace('#', '0x'))
                      ; (groundMat.color = new THREE.Color(o)),
                        (groundMat.opacity = parseFloat(t)),
                        (plan.groundDiffuse = groundMat.color.getHexString()),
                        (plan.groundOpacity = groundMat.opacity),
                        render()
                  },
                }),
                $('#groundSpecular').minicolors({
                  change: function (e: any) {
                    var t = parseInt(e.replace('#', '0x'))
                      ; (groundMat.specular = new THREE.Color(t)),
                        (plan.groundSpecular = groundMat.specular.getHexString()),
                        render()
                  },
                })),
              fragment)
          )
            $.ajax({
              url: 'api/getsharelink/' + fragment,
              type: 'GET',
              contentType: 'application/json',
              success: function (e: any) {
                var t = JSON.parse(e)
                e.error
                  ? console.debug(e.error)
                  : ((loadingProgressTxt = 'Loading Shared Plan'),
                    (document.getElementById('modalLoadingDataInfo').innerHTML =
                      loadingProgressTxt),
                    $('#loadingModal').show(),
                    hideMouseIndicators(),
                    drawPlan(t))
              },
              error: function (e: any) {
                console.debug('document.ready : getsharelink : ' + e)
              },
            })
          else {
            var o = localStorage.getItem('plan')
            if (o) {
              var o = JSON.parse(o)
                ; (loadingProgressTxt = 'Loading Cached Plan'),
                  (document.getElementById('modalLoadingDataInfo').innerHTML =
                    loadingProgressTxt),
                  $('#loadingModal').show(),
                  hideMouseIndicators(),
                  drawPlan(o)
            } else showAbout(), setNewPlan()
          }
        },
        error: function (e: any) {
          console.dir(e)
        },
      }),
      */
      
      
      /* end if ajax true */
      // ** ================================================
    }
/**/
    document.onmousemove = function (e: any) {
      // if (verticalSliderDragging) {
      //   return (
      //     verticalSlider.style.left = e.x - 2 + 'px'
      //     catalogView.style.width = e.x - 2 + 'px'
      //     propertiesView.style.width = e.x - 12 + 'px'
      //     planView.style.left = e.x + 2 + 'px'
      //     rulerLeft.style.left = e.x + 2 + 'px'
      //     rulerBottom.style.left = e.x + 2 + 'px'
      //     mouseIndicatorY.style.left = e.x + 2 + 'px'
      //     view3d.style.left = e.x + 2 + 'px'
      //     horizontalSliderLeft.style.width = e.x - 2 + 'px'
      //     horizontalSliderRight.style.left = e.x + 2 + 'px'
      //     Object.keys(levelButtons).forEach(function (t) {
      //       levelButtons[t].style.left = e.x + 37 + 'px'
      //     })
      //     resize3dView()
      //     resizePlanView()
      //     loadInViewThumbs()
      //     false
      //   )
      // }
      // if (horizontalSliderLeftDragging) {
      //   return (
      //     horizontalSliderLeft.style.top = e.y - 2 + 'px'
      //     catalogView.style.height = e.y - 56 + 'px'
      //     propertiesView.style.top = e.y + 2 + 'px'
      //     loadInViewThumbs()
      //     false
      //   )
      // }
      // if (horizontalSliderRightDragging) {
      //   return (
      //     horizontalSliderRight.style.top = e.y - 2 + 'px'
      //     planView.style.height = e.y - 66 + 'px'
      //     rulerLeft.style.bottom = e.y - 66 + 'px'
      //     rulerBottom.style.top = e.y - 2 + 'px'
      //     mouseIndicatorX.style.height = e.y - 58 + 'px'
      //     view3d.style.top = e.y + 2 + 'px'
      //     fullscreenPlanViewBtn.style.top = e.y - 2 + 'px'
      //     Object.keys(levelButtons).forEach(function (t) {
      //       levelButtons[t].style.top = e.y - 48 + 'px'
      //     }
      //     resize3dView()
      //     resizePlanView()
      //     false
      //   )
      // }
      if (draggingThreedIcon) {
        console.debug('draggingThreedIcon', draggingThreedIcon)
        var widthT, heightOh
            widthT = draggingThreedRectangle.bounds.width
            heightOh = draggingThreedRectangle.bounds.height
            widthT *= paper.view.zoom
            heightOh *= paper.view.zoom
        var PAPERa = paper.view.viewToProject(
          new paper.Point(
            e.pageX - planView.offsetLeft,
            e.pageY - planView.offsetTop
          )
        )
        // console.debug('PAPERa', PAPERa)
        let thingN = null

        // ** USEMASK?
        // if (draggingThreedItem.useMask) {
        //   console.debug('draggingThreedItem.useMask', draggingThreedItem)
        //   var l = 51,
        //     i = 0
        //   if (
        //     (Object.keys(Walls).forEach(function (e: string) {
        //       // @ ts-expect-error
        //       // var t = Walls[e]
        //       var t = Walls[e as keyof typeof Walls] // type T = keyof Walls
        //       if (
        //         'object' == typeof t &&
        //         // @ts-expect-error
        //         t.data.level === paper.project.activeLayer.data.id
        //       ) {
        //         // @ts-expect-error
        //         var o = t.getNearestPoint(PAPERa),
        //             r = PAPERa.getDistance(o)
        //         if (r < 50 && r < l) {
        //           ; (l = r), (thingN = o)
        //           // @ts-expect-error
        //           var s = t.segments[0].point.subtract(t.segments[1].point)
        //           i = s.angle
        //         }
        //       }
        //     }),
        //       thingN)
        //   ) {
        //     new paper.Path.Circle({
        //       center: thingN,
        //       radius: screenScale / 2,
        //       fillColor: new paper.Color(0.3, 1, 0.5, 0.75),
        //       strokeWidth: 1,
        //     })
        //     .removeOnMove()
        //     // .removeOnDrag()
        //     var r = 'rotate(' + i + 'deg)'
        //       threedDragDiv.style.transform = r
        //       draggingThreedAngle = i
        //   } else {
        //     var r = 'rotate(0deg)'
        //       threedDragDiv.style.transform = r
        //       draggingThreedAngle = 0
        //   }
        // }

        if (null === thingN) {
          // console.debug('thingN === null', thingN)
          var s: any

          Object.keys(verticalGuides).forEach(function (verticalGuide: string) {
            console.debug('verticalGuide', verticalGuide)
            // thingN.x >= verticalGuides[verticalGuide].position.x - 10 &&
            //   thingN.x <= verticalGuides[verticalGuide].position.x + 10 &&
            //   (s = new paper.Point(verticalGuides[verticalGuide].position.x, thingN.y))
          })
          Object.keys(horizontalGuides).forEach(function (horizontalGuides: string) {
            console.debug('horizontalGuides', horizontalGuides)
            // thingN.y >= horizontalGuides[horizontalGuides].position.y - 10 &&
            //   thingN.y <= horizontalGuides[horizontalGuides].position.y + 10 &&
            //   (s
            //     ? (s.y = horizontalGuides[horizontalGuides].position.y)
            //     : (s = new paper.Point(thingN.x, horizontalGuides[horizontalGuides].position.y)))
          })
          if (s) {
            console.debug('s', s)
            PAPERa = s
            new paper.Path.Circle({
              center: PAPERa,
              radius: screenScale / 2,
              fillColor: new paper.Color(1, 0.3, 0.5, 0.75),
              strokeWidth: 1,
            })
            .removeOnMove()
            // .removeOnDrag()
          }
        }
        // ** PIVOT?
        // if (draggingThreedItem.pivot) {
        //   console.debug('draggingThreedItem.pivot', draggingThreedItem)
        //   var d = PAPERa.add(
        //     // @ts-expect-error
        //     new paper.Point(draggingThreedItem.pivot).rotate(draggingThreedAngle)
        //   ),
        //   c = PAPERa,
        //   draggingThreedItemU = c.subtract(d)
        //   PAPERa = PAPERa.add(draggingThreedItemU)
        // }
        
        draggingThreedRectangle.position = PAPERa

        var PAPERprojectToView = paper.view.projectToView(PAPERa)
        // console.debug('PAPERprojectToView', PAPERprojectToView)
        threedDragDiv.style.left = PAPERprojectToView.x + planView.offsetLeft - widthT / 2 + 'px'
        threedDragDiv.style.top = PAPERprojectToView.y + planView.offsetTop - heightOh / 2 + 'px'
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
    // END: document.onmousemove = function (e: any) {}

    paper.tool.onMouseUp = function (e: any) {
      console.debug('PAPER threedTool', threedTool)
      console.debug('PAPER tool', paper.tool)

      // ** RETURN
      return
    }
    
    // ** [MM] NEEDS ATTENTION [MM]
    // ** CAN WE DO THIS WITHIN A SUB "TOOL" MODE? Yes please.
    document.onmouseup = function (e: any) {
      
      // var PAPERscript = paper.PaperScript
      // console.debug('PAPERscript', PAPERscript)

      // console.debug('PAPER threedTool', threedTool)
      // console.debug('PAPER tool', paper.tool)

      // ** MOVE TO threedTool.pointer
      draggingThreedIcon = false

      // **
      if (verticalSliderDragging) {
        verticalSliderDragging = false
      }
      if (horizontalSliderLeftDragging) {
        horizontalSliderLeftDragging = false
      }
      if (horizontalSliderRightDragging) {
        horizontalSliderRightDragging = false
      }

      // ** [MM] CLOSER...
      // -- DON'T DO THIS UNTIL YOU HAVE IT AS A threedTool.pointer
      if (draggingThreedItem) {
        
            var PAPERa = paper.view.viewToProject(
              new paper.Point(
                e.pageX - planView.offsetLeft,
                e.pageY - planView.offsetTop
              )
            )
            console.debug('PAPERa', PAPERa)
            var PAPERprojectToView = paper.view.projectToView(PAPERa)
            console.debug('PAPERprojectToView', PAPERprojectToView)
            var PAPERb = paper.view.bounds
            console.debug('PAPERb', PAPERb)

        // @ts-expect-error
        addThreed(e, draggingThreedItem, canvasStateThreeDVar().state?.scene)
        // addThreed(e, draggingThreedItem, useCanvasStateThreeDVar.state?.scene)
        void (draggingNewGuide && (draggingNewGuide = false))
      }

      // ** RETURN
      return
    }
    // END: document.onmouseup = function (e: any) {}
    

  }, []) // end load data useEffect (client)

  
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


  // ** RETURN JSX
  return (
    
    <div
      style={{
        // display: 'inline-block',
        // display: 'inline-flex',
        display: 'flex',
        flexDirection: 'column',
        // flexGrow: '1',
        // height: '92vh',
        // width: '99.9%',
        width: '100vw',
        height: 'calc(100vh - 64px)',
        overflow: 'hidden',
      }}
    >
      
      {/* <Heading as='h4'>
        🥕 Welcome to ThreeD HD
      </Heading> */}

      {/* TESTING: DOM ELEMENT as React State Variables */}
      <>
        {/* 
        <Canvas>
          <OrbitControls domElement={domElement} onChange={onChange} />
        </Canvas>
        <Canvas>
          <OrbitControls domElement={domElement} onChange={onChange} />
        </Canvas>
        <Canvas>
          <OrbitControls domElement={domElement} onChange={onChange} />
        </Canvas> 
        */}
      </>

      {/* BASIC JSX ACTION BUTTONS */}
      <div 
        style={{ 
          // display: 'flex',
          display: 'none',
          flexDirection: 'row',
          // marginLeft: '4px', 
          // marginRight: '6px' 
        }}
      >
        <Button onClick={() => handleShowModalAbout()}>
          Show Modal: About
        </Button>
        <Button onClick={() => handleShowModal3dModel()}>
          Show Modal: 3D Model
        </Button>
        <Button onClick={() => handleShowModalShare()}>
          Show Modal: Share
        </Button>
        <Button onClick={() => handleShowModalLoading()}>
          Show Modal: Loading
        </Button>
      </div>

      <div 
        style={{
          display: 'none',
          position: 'absolute',
          zIndex: 99999
        }}
      >
        <progress id='progressBar' value='0' max='100' className='center'></progress> 
      </div>

      {/* THREED: TOOLBAR (ACTIONS) */}
      <div 
        style={{ 
          display: 'flex',
          // display: 'none',
          flexDirection: 'row',
          // marginLeft: '4px', 
          // marginRight: '6px' 
        }}
      >

        <div 
          style={{ 
            display: 'inline-flex',
            // display: 'none',
            flexDirection: 'row',
            alignItems: 'center',
            marginLeft: '4px', 
            marginRight: '6px' 
          }}
        >
          {/* MAIN ACTIONS DROPDOWN MENU */}
          <ThreeDDropdownMenu
          
          />

          {/* PANEL SHOW/HIDE */}
          <Button
            // className={styles.Button}
            style={{
              backgroundColor: 'transparent',
              border: '0px',
              width: '16px',
              height: '16px',
              padding: '0px',
              marginLeft: '6px', 
            }}
            onClick={() => setShowPanelFirst()}
          >
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
            onClick={() => setShowPanelLast()}
          >
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
        </div>

        {/* THREED: TOOLBAR (ACTIONS) */}
        <ThreeDToolbar />
                
        {/* THREED: CONTROLS: LEVA GUI */}
        {/* <ThreeDLevaControls /> */}
                
      </div>

      {/* PAGE LAYOUT PANELS */}
      <PanelGroup 
        direction='horizontal'
        autoSaveId='ThreeDPanelGroup1'
        onLayout={onThreeDPanelGroup1}
      >
        {/* VIEWS: OBJECT CATALOG */}
        {prefs.showPanelFirst && (
          
          // {/* LEFT PANEL */}
          <Panel
            id='panelLeft'
            // className='Panel'
            order={1}
            // defaultSize={25}
            defaultSize={panelLayout[0][0]}
            minSize={0}
            maxSize={100}
            // style={{
            //   // border: '1px solid darkred',
            // }}
            onResize={() => redrawGrid()} // ** TESTING
          >
            <PanelGroup
              direction='vertical'
              autoSaveId='ThreeDPanelGroup2'
              onLayout={onThreeDPanelGroup2}
            >
                      
              {/* THREED: CONTROL PANELS (NOUNS, API) */}
              <ThreeDControlPanels />
              
              <Panel 
                id='viewProperties'
                // className='Panel'
                order={3}
                // defaultSize={50}
                defaultSize={panelLayout[1][0]}
                maxSize={100}
                style={{
                  // border: '1px solid #1A1A1A',
                  overflow: 'auto',
                }}
              >
                { true && (
                  <ViewProperties />
                )}
              </Panel>

              <PanelResizeHandle />

              <Panel 
                id='catalogView'
                // className='Panel'
                order={4}
                // defaultSize={50}
                defaultSize={panelLayout[1][1]}
                maxSize={100}
                style={{
                  // border: '1px solid #1A1A1A',
                  overflow: 'auto',
                }}
              >
                <div id='catalogFilters'>
                  { true && (
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

            </PanelGroup>
          </Panel>
          
        )}

        <PanelResizeHandle />

        {/* VIEWS: CANVASES */}
        {prefs.showPanelLast && (

          // {/* RIGHT PANEL */}
          <Panel
            id='panelRight'
            order={2}
            // className='Panel'
            // defaultSize={75}
            defaultSize={panelLayout[0][1]}
            minSize={0}
            maxSize={100}
            style={{
              // border: '1px solid darkblue',
            }}
            onResize={() => redrawGrid()} // ** TESTING
          >
            {/* MAIN CANVASES (TOP + BOTTOM) */}
            <PanelGroup 
              direction='vertical'
              autoSaveId='ThreeDPanelGroup3'
              onLayout={onThreeDPanelGroup3}
            >
              
              {/* PANEL: 3D FIBER CANVAS */}
              <Panel
                id='panel3DCanvas'
                order={5}
                // className='Panel'
                // defaultSize={50}
                defaultSize={panelLayout[2][0]}
                minSize={0}
                maxSize={100}
                style={{
                  // overflow: 'auto',
                  // border: '1px solid #003300',
                }}
                // onResize={() => redrawGrid()} // ** TESTING
              >
                <div 
                  id='view3d'
                  style={{
                    display: 'flex',
                    // flexDirection: 'column',
                    width: '100%',
                    height: '100%',
                    // height: 'calc(100% - 0px)',
                    // border: '1px solid #003300',
                  }}
                >

                  {/* THREED HOME DESIGN: 3D CANVAS */}
                  { true && (
                    <>
                      {/* THREED: COMPONENTS (ALL) */}
                      {/* <ThreeD /> */}

                      {/* THREED: TOOLBAR (ACTIONS) */}
                      {/* <ThreeDToolbar /> */}
                      
                      {/* THREED: CANVAS VIEWER */}
                      <ThreeDCanvasViewer />
                
                      {/* THREED: CONTROLS: LEVA GUI */}
                      {/* <ThreeDLevaControls /> */}
                      
                      {/* THREED: CONTROL PANELS (NOUNS, API) */}
                      {/* <ThreeDControlPanels /> */}
                    </>
                  )}

                  {/* 
                  <div id='overlayLogo3dView' className='overlayLogo'>
                    <a href='https://threedgarden.com/home-design/'><img
                        src='favicon/favicon.png' height='32px' title='ThreeD HD' alt='ThreeD HD' /></a>&nbsp
                    <a href='https://threedgarden.com/home-design/'>ThreeD HD</a>
                  </div>
                  <div id='overlayMenu3dView'>
                    <button id='overlay3dviewRecenterBtn' onClick={() => recenter3dview()} className='smallButton'>Recenter</button>
                    <button id='overlay3dviewGotoPlanViewBtn' onClick={() => gotoPlanView()} className='smallButton'>Plan View</button>
                  </div> 
                  */}

                </div>
              </Panel>
              
              <PanelResizeHandle />

              {/* PANEL: 2D PAPER */}
              <Panel
                id='panel2DCanvas'
                order={6}
                // className='Panel'
                // defaultSize={50}
                defaultSize={panelLayout[2][1]}
                minSize={0}
                maxSize={100}
                style={{
                  display: 'inline-block',
                  // display: 'flex',
                  // display: 'inline-flex',
                  // flexGrow: '0',
                  // overflow: 'auto', // no
                  // height: '100%',
                  // width: '100%',
                  // border: '1px solid #1A1A1A',
                  backgroundColor: '#222222', // 'rgba(68, 22, 147, 1.0)', 
                }}
                onResize={() => redrawGrid()} // ** TESTING
              >
                <div
                  id='paperView'
                  style={{
                    // display: 'inline-block',
                    display: 'flex',
                    // display: 'inline-flex',
                    // flexGrow: '0',
                    // width: '100%',
                    // width: 'calc(100% - 20px)',
                    // height: '100%',
                    height: 'calc(100% - 20px)', // !important
                    // backgroundColor: 'darkorange', // '#222222',
                    // backgroundColor: 'rgba(116, 70, 6, 1.0)', // '#636363',
                  }}
                > 
                  <div
                    id='rulerLeftContainer'
                    style={{
                      // display: 'inline-block',
                      // display: 'flex',
                      // display: 'inline-flex',
                      // flexGrow: '0',
                      // width: '20px', // !important???
                      // maxWidth: '20px',
                      // height: '100%',
                      // backgroundColor: 'darkred', // '#FFFFFF',
                      // backgroundColor: 'rgba(116, 6, 6, 1.0)', // '#636363',
                      backgroundColor: 'transparent',
                    }}
                  >
                    <canvas 
                      id='rulerLeft' 
                      width={20}
                      // width={props.width? props.width : '2000'}
                      // width={statePlanViewWidth}
                      // height={'100%'}
                      // height={props.height? props.height : '1000'}
                      // height={statePlanViewHeight}
                      // onMouseDown={() => addVerticalGuide()}
                      // onMouseUp={() => removeVerticalGuide()}
                    ></canvas>
                  </div>
                  <div 
                    id='planView'
                    style={{
                      display: 'inline-block',
                      // display: 'flex',
                      // display: 'inline-flex',
                      // flexGrow: '1',
                      width: 'calc(100% - 0px)', // !important
                      // height: 'calc(100% - 20px)',
                      backgroundColor: 'rgba(8, 133, 22, 0.10)', // '#222222',
                    }}
                  >
                    <PaperCanvas />
                  </div>
                </div>
                <div
                  id='rulerBottomContainer'
                  style={{
                    // display: 'block',
                    // display: 'inline-block',
                    display: 'flex',
                    // display: 'inline-flex',
                    // flexGrow: '0',
                    // width: '100%',
                    height: '20px',
                    // maxHeight: '20px',
                    backgroundColor: 'yellow', // '#636363',
                    // backgroundColor: 'rgba(244, 244, 12, 1.0)', // '#636363',
                    // backgroundColor: 'transparent',
                  }}
                >
                  <canvas 
                    id='rulerBottom' 
                    width={1600}
                    // width={props.width? props.width : '2000'}
                    // width={statePlanViewWidth}
                    height={20}
                    // height={props.height? props.height : '1000'}
                    // height={statePlanViewHeight}
                    // onMouseDown={() => addHorizontalGuide()}
                    // onMouseUp={() => removeHorizontalGuide()}
                  ></canvas>
                </div>
              </Panel>
            </PanelGroup>
          </Panel>
        )}
      </PanelGroup>
      
      <div 
        id='planHelpers'
        style={{
          // display: 'flex',
        }}
      >

        <div id='threedDragDiv'></div>

        <div id='mouseIndicatorY'></div>
        <div id='mouseIndicatorX'></div>

        <div id='compass'></div>

        <div id='verticalSlider'></div>
        <div id='horizontalSliderLeft'></div>
        <div id='horizontalSliderRight'></div>

        {/*
        <img id='fullscreenPlanViewBtn' src='images/homedesign/fullscreen.png' width='30' height='30'
          onClick={() => openFullscreen('planView')} />
        <img id='fullscreen3dViewBtn' src='images/homedesign/fullscreen.png' width='30' height='30'
          onClick={() => openFullscreen('view3d')} />
        */}

        {/* 
        <div id='overlayMenuPlanView'>
          <button id='overlayPlanViewRecenterBtn' onClick={() => recenterPlanView()} className='smallButton'>Recenter</button>
          <button id='overlayPlanViewGoto3dViewBtn' onClick={() => goto3dView()} className='smallButton'>3d View</button>
        </div>
        */}
      
        {/* 
        <div 
          id='overlayLogoPlanView' 
          className='overlayLogo'
        >
          <a href='https://threedgarden.com/demo/'
            // style='float:leftpadding:0px margin-top:0px'
          >
            <img
              src='/favicon/favicon.png' height='32px' title='ThreeD HD' alt='ThreeD HD' 
            />
          </a>
          &nbsp
          <a href='https://threedgarden.com/demo/'
            // style='padding-left: 10px text-decoration: none font-size: 32px'
          >
            ThreeD HD
          </a>
        </div> 
        */}

      </div>
    </div>

  )
}
