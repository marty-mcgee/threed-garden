// ==============================================================
// Home Design Page (main landing page for 2D-3D Demo)

'use client'
// ==============================================================

// ** NEXT Imports
import type { NextPage } from 'next'
// import type { TNextPageWithProps } from '#/lib/types/TAppProps'

// ** REACT Imports
import { 
  useState,
  useRef,
  useEffect,
} from 'react'

// ** PAPER Imports
import paper from 'paper'

// ** R3F Imports
import {
  Canvas,
  // Camera, // use PerspectiveCamera from drei library
  useFrame,
  useThree,
  // extend, // if using function extend({ OrbitControls })
  useLoader,
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

// import React from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import {
	HamburgerMenuIcon,
	DotFilledIcon,
	CheckIcon,
	ChevronRightIcon,
} from '@radix-ui/react-icons'
import '#/lib/home-design/src/styles/radix-ui.css'

// ==============================================================
// ** THREED CSS Imports
// import '#/lib/home-design/src/styles/radix-ui.css'
// import '#/lib/home-design/src/styles/globals.css'
// import '#/lib/home-design/src/styles/index.css'
// import '#/lib/home-design/src/styles/annotations.css'
// import '#/lib/home-design/src/styles/fa-550.css'
import '#/lib/home-design/src/styles/threed.css'

// ==============================================================
// ** DEMO Imports
// <script type='text/javascript' src='scripts/jquery-1.11.3.min.js'></script>

// <script type='text/javascript' src='scripts/paper-full.js?a=1'></script>

// <script type='text/javascript' src='scripts/three.min.js'></script>
import * as THREE from 'three'
  // console.debug('THREE', THREE)

// <script type='text/javascript' src='scripts/trackballcontrols.js'></script>

// <script type='text/javascript' src='scripts/tween.js'></script>

// <script type='text/javascript' src='scripts/MTLLoader.js'></script>

// <script type='text/javascript' src='scripts/OBJLoader.js'></script>

// <script type='text/javascript' src='scripts/OBJExporter.js'></script>

// <script type='text/javascript' src='scripts/sky.js'></script>

// <script type='text/javascript' src='scripts/ThreeCSG.js'></script>

// <script type='text/javascript' src='scripts/jquery.minicolors.min.js'></script>

// <!-- <script type='text/javascript' src='scripts/jsonc.min.js'></script> -->
// <!-- SHADERS + PROCESSORS -->
// <!-- <script type='text/javascript' src='scripts/shaders/CopyShader.js'></script> -->
// <!-- <script type='text/javascript' src='scripts/volumeMaskShader.js'></script> -->
// <!-- <script type='text/javascript' src='scripts/shaders/RGBShiftShader.js'></script> -->
// <!-- <script type='text/javascript' src='scripts/postprocessing/EffectComposer.js'></script> -->
// <!-- <script type='text/javascript' src='scripts/postprocessing/RenderPass.js'></script> -->
// <!-- <script type='text/javascript' src='scripts/postprocessing/ShaderPass.js'></script> -->

// <script type='text/javascript' data-cfasync='false'>
var fragment = null
var readOnly = false
var UILayout = 'default' // 3dView | planView | default
// </script>

// <script type='text/javascript' src='scripts/threed.js'></script>
// import threed from './scripts/threed'

var mouseMode = 0,
  toolMode = 'pointer',
  selectedItem,
  defaultCursor = 'default',
  deselectAll,
  toolsGroup,
  gridGroup,
  threedGroup = {},
  wallsGroup = {},
  roofsGroup = {},
  floorsGroup = {},
  dimensionsGroup = {},
  textsGroup = {},
  guidesGroup,
  defaultWallHeight = 265,
  defaultWallThickness = 20,
  defaultRoofThickness = 25,
  defaultRoofWidth = 350,
  defaultRoofRise = 300,
  defaultRoofStartHeight = 0,
  defaultFloorThickness = 25,
  rotateIcon,
  resizeIcon,
  elevateIcon,
  heightIcon,
  planView,
  rulerLeft,
  rulerLeftCtx,
  rulerBottom,
  rulerBottomCtx,
  mouseIndicatorX,
  mouseIndicatorY,
  fullscreenPlanViewBtn,
  fullscreen3dViewBtn,
  modalCloseBtnAbout,
  modalCloseBtnModel3d,
  movePointIcons = [],
  movePointIconSelectedId = 0,
  selectedMovePointIcon,
  wallPath,
  wallIdCounter = 0,
  wallsRectangles = {},
  wallsRectangles3d = {},
  wallHelperPath,
  wallHelperRectangle,
  startedDrawingWalls = !1,
  floorPath,
  floorIdCounter = 0,
  floorHelperPath,
  startedDrawingFloor = !1,
  roofPath,
  roofIdCounter = 0,
  roofHelperPath,
  roofsRectangles = {},
  roofsRectangles3d = {},
  roofHelperRectangle,
  startedDrawingRoofs = !1,
  dimensionPath,
  dimensionIdCounter = 0,
  dimensionHelperPath,
  startedDrawingDimension = !1,
  stretchYPath,
  stretchYStartHeight = 0,
  elevatePath,
  elevating = !1,
  elevateStartHeight = 0,
  dragging = !1,
  scalingXY = !1,
  scalingY = !1,
  rotating = !1,
  wallHelper3dCube,
  roofHelper3dCube,
  redrawGrid,
  xLines = [],
  yLines = [],
  threedToLoadCount = 0,
  loadedThreedCount = 0,
  tools,
  offsetMousePoint,
  ctrlKeyPressed = !1,
  scaleFactor = 1.1,
  cumulclick = 0,
  screenScale,
  ratioX = 0,
  ratioY = 0,
  lastNewWallSegmentClick = Date.now(),
  lastNewRoofSegmentClick = Date.now(),
  lastNewFloorSegmentClick = Date.now(),
  threedItems = {},
  canvas3d,
  camera,
  renderer,
  container,
  scene,
  mesh,
  ground,
  groundMat,
  hemiLight,
  dirLight,
  ambientLight,
  pointLight,
  controls,
  wallMaterial,
  floorMaterial,
  roofMaterial,
  tween,
  raycaster,
  mouse,
  clickableObjects = {},
  clickableObjectsCounter = -1,
  maskObjects = {},
  maskObjectsApplied = {},
  maskObjectsAppliedRoof = {},
  verticalSlider,
  verticalSliderDragging,
  horizontalSliderLeft,
  horizontalSliderLeftDragging,
  horizontalSliderRight,
  horizontalSliderRightDragging,
  threedDragDiv,
  draggingThreedIcon = !1,
  draggingThreedId = -1,
  draggingThreedAngle = 0,
  draggingThreedRectangle,
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
  textIdCounter = 0,
  startedDrawingText = !1,
  editingTextId = -1,
  Threed = {},
  Walls = {},
  Roofs = {},
  Floors = {},
  Floors3d = {},
  Dimensions = {},
  Texts = {},
  plan = {
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
  
  planHistory = [
    // planHistory.push(JSON.stringify(plan)),
    JSON.stringify(plan)
  ],
  planHistoryPosition = 0,

  backgroundRaster,
  backgroundRasterRatioX = 1,
  backgroundRasterRatioY = 1,
  idToCopyPaste = -1,
  lastPasteX = 0,
  lastPasteY = 0,
  progressBar,
  focusPoint,
  selectedItem3DAxes,
  activeLevel,
  levelButtons,
  otherLayerWallsRasters = [],
  otherLayerThreedRasters = [],
  extrudeSettings = {
    steps: 1,
    depth: defaultFloorThickness,
    bevelEnabled: !1,
  },
  modalModel3dThreedId = -1,
  model3dObjectRef,
  model3dViewOpen = !1,
  model3dScene,
  model3dSceneRenderer,
  model3dViewContainer,
  model3dSceneCamera,
  model3dViewCanvas,
  loadingProgressTxt = '',
  lastMousePoint,
  dltext,
  zoomRectangle,
  sky,
  sunSphere,
  inclination,
  azimuth,
  examplePlan,
  fLineX,
  fLineY,
  fLineZ,
  modalsActive = !1,
  shareLinkUrl = '',
  shareLinkUrl3d = '',
  shareLinkUrlPlan = '',
  verticalGuides = {},
  horizontalGuides = {},
  selectedGuideId,
  guideCounter = 0,
  draggingNewGuide = !1,
  snapTolerance = 1,
  groundWidth = 5e3,
  groundLength = 5e3

const enableOrbit = true
const enableGizmoCube = true


// export default DropdownMenuThreeD

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


// ==============================================================
// ** PAPER.JS
const draw1 = () => {
  let myPath = new paper.Path();

  paper.view.onMouseDown = (event: any) => {
    // @ts-expect-error
    myPath.strokeColor = "white";
    myPath.strokeWidth = 3;
  };

  paper.view.onMouseDrag = (event: any) => {
    myPath.add(event.point);
  };

  // @ts-expect-error
  paper.view.draw();
};

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
    />
  )
}
// ** END: PAPER.JS
// ==============================================================


// const HomeDesignPage = (props) => {
// const HomeDesignPage: FC<TPageProps> = (props) => {
// const HomeDesignPage: NextPage<TPageProps> = (props) => {
// const HomeDesignPage: TNextPageWithProps = (): JSX.Element => {
const HomeDesignPage: NextPage = (): JSX.Element => {
  
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
              onClick={() => handleShowModalAbout()}
            >
              About <div className='RightSlot'>⌘+A</div>
            </DropdownMenu.Item>
            <DropdownMenu.Item 
              className='DropdownMenuItem'
              onClick={() => handleShowModal3dModel()}
            >
              3D Model <div className='RightSlot'>⌘+N</div>
            </DropdownMenu.Item>
            <DropdownMenu.Item 
              className='DropdownMenuItem'
              onClick={() => handleShowModalShare()}
            >
              Share <div className='RightSlot'>⌘+N</div>
            </DropdownMenu.Item>
            <DropdownMenu.Item 
              className='DropdownMenuItem'
              onClick={() => handleShowModalLoading()}
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
  return (

    <>
      <Flex
        // columns='2'
        direction='column'
        // gap='2'
        style={{
          // padding: '8px',
          // display: 'inline-block'
          // position: 'fixed'
        }}
        // justify='start'
      >

        {/* <Heading as='h5'>
          🥕 ThreeD Home Design
        </Heading>
        <Heading as='h6'>
          🌱 part of the threed.ai family
        </Heading>
        <Text as='p'>
          🦆 Home Design Page (/app/home-design/page.tsx)
        </Text>
        <Text as='p'>
          🦉 This is the 'Home Design' Landing Page.
        </Text>  */}
        
        <Flex 
          id='toolBar'
          // direction='row'
          justify='start'
          align='center'
          style={{
            // position: 'absolute',
            // bottom: '32px',
            paddingLeft: '7px',
          }}
        >
          {/* MAIN ACTIONS DROPDOWN MENU */}
          <DropdownMenuThreeD />
          {/* BASIC ACTION BUTTONS */}
          <Flex>
            {/* <Button onClick={() => handleShowModalAbout()}>
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
            </Button> */}
          </Flex>
          {/* TESTING COMPONENTS */}
          {/* <DialogModals /> */}
        </Flex>


        <Flex
          // direction='column'
          // columns='2'
          // columns={{ initial: "1", md: "2" }}
        >
          
          <Grid
            style={{
              width: '33%',    
            }}
          >
            <div id='catalogView'>
              <div id='catalogFilters'>
                <input type='text' id='catalogTextFilter' placeholder='Filter' />
              </div>
              <div id='catalogItems'>
              </div>
            </div>
          </Grid>

          <Grid
            style={{
              width: '67%',    
            }}
          >
            {/* THREED HOME DESIGN: 2D PAPER PLAN VIEW */}
            <div
              id='planView'
              style={{
                width: '99%',
                // height: '100%',
                minHeight: '100px',
                height: '200px',
                border: '1px solid #222222',
                marginBottom: '4px',
              }}
            >
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
                <button id='overlayPlanViewRecenterBtn' onClick='recenterPlanView()' className='smallButton'>Recenter</button>
                <button id='overlayPlanViewGoto3dViewBtn' onClick='goto3dView()' className='smallButton'>3d View</button>
              </div>
              */}
            </div>

            {/* THREED HOME DESIGN: 3D CANVAS */}
            <div id='view3d'>
              <Canvas
                id={'threeCanvas'}
                key={'threeCanvas'}

                style={{
                  width: '99%',
                  // height: '100%',
                  minHeight: '100px',
                  height: '200px',
                  border: '1px solid #222222',
                }}

                shadows={true}
                dpr={[1, 2]} // dpr = target pixel ratio (need ???)
                
                // ** CAMERA (not using declarative inside canvas)
                // camera={threedCamera}

                // ** SCENE (needs to be declarative inside canvas)
                scene={{
                  // background: new THREE.CubeTextureLoader().load(cubeMapURLs), // ThreeDGarden1.tsx
                  background: new THREE.Color(0x171717),
                }}
                // onCreated={
                //   (state) => {
                //     // console.debug('%c Canvas onCreated state', ccm.darkred, state)
                //     // console.debug('%c Canvas onCreated state.camera', ccm.darkred, state.camera)
                //     console.debug('%c Canvas onCreated state.camera.position', ccm.darkred, state.camera.position)
                //     // state.gl.toneMapping = THREE.AgXToneMapping
                //     // state.camera.fov = 32 // 8
                //     // state.camera.lookAt(2, -4, 8) // position [0, 0, 0]
                //     // threedCamera.position = new THREE.Vector3(2, -4, 8)
                //     // console.debug('%c Canvas onCreated state.camera.position(lookAt)', ccm.redAlert, state.camera.position)
                //   }
                // }
                
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
                      // autoRotate={prefs.doAutoRotate} // default is false
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
              {/* <div id='overlayLogo3dView' className='overlayLogo'>
                <a href='https://threedgarden.com/home-design/'><img
                    src='favicon/favicon.png' height='32px' title='ThreeD Home Design' alt='ThreeD Home Design' /></a>&nbsp
                <a href='https://threedgarden.com/home-design/'>ThreeD Home Design</a>
              </div>
              <div id='overlayMenu3dView'>
                <button id='overlay3dviewRecenterBtn' onClick='recenter3dview()' className='smallButton'>Recenter</button>
                <button id='overlay3dviewGotoPlanViewBtn' onClick='gotoPlanView()' className='smallButton'>Plan View</button>
              </div> */}
            </div>

            {/*
            <canvas id='rulerLeft' width='30' height='500' onmousedown='addVerticalGuide()'
              onmouseup='removeVerticalGuide()'></canvas>
            <canvas id='rulerBottom' width='1024' height='20' onmousedown='addHorizontalGuide()'
              onmouseup='removeHorizontalGuide()'></canvas>
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
              onClick='openFullscreen('planView')' />
            <img id='fullscreen3dViewBtn' src='media/fullscreen.png' width='30' height='30'
              onClick='openFullscreen('view3d')' />
            */}

            {/* 
            <progress value='50' max='100' className='center' id='progressBar'></progress> 
            */}

          </Grid>
        </Flex>
    


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
                        onClick={() => openTab('tab1')} 
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
                            onChange={() => handleSaveEditsLocalStorageOption()}
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
                                      onClick={() => loadFromLocalStorage()}
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
                                        onClick={() => loadFromLocalStorage()}
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
                                    onClick={() => loadExamplePlan()}
                                  >
                                    Load Example Plan
                                  </button>
                                  <br /><br />
                                  or
                                  <br />
                                  <button onClick={() => closeAllModals()} className='largeButton'>Start New Plan</button>
                                </td>
                                <td>
                                  <div><img id='featuredPlanImage' onClick={() => loadExamplePlan()} /></div>
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
                      // onClick='generateShareLink()'
                    >
                      Generate Share Link
                    </button>
                    {/* <div style='margin:10px 0px 10px 0px'>
                      <div style='padding-top:6px'>
                        <label for='shareLinkUrl'>Editable Copy</label><br />
                        <input type='text' id='shareLinkUrl' placeholder='Press 'Generate Share Link' button'
                          style='width: 580px background-color: #4e4e4e border: 1px solid #2a2a2a font-size: 14px color: white font-family: 'Courier New', Courier, monospace padding: 4px 24px 4px 24px pointer-events: none' />&nbsp
                        <button id='copyShareLinkBtn' className='smallButton' onClick='copyShareLink()'>Copy</button>
                      </div>

                      <div style='padding-top:6px'>
                        <label for='shareLinkUrl3d'>Read Only 3d View</label><br />
                        <input type='text' id='shareLinkUrl3d' placeholder='Press 'Generate Share Link' button'
                          style='width: 580px background-color: #4e4e4e border: 1px solid #2a2a2a font-size: 14px color: white font-family: 'Courier New', Courier, monospace padding: 4px 24px 4px 24px pointer-events: none' />&nbsp
                        <button id='copyShareLinkBtn' className='smallButton' onClick='copyShareLink3d()'>Copy</button>
                      </div>

                      <div style='padding-top:6px'>
                        <label for='shareLinkUrlPlan'>Read Only Plan View</label><br />
                        <input type='text' id='shareLinkUrlPlan' placeholder='Press 'Generate Share Link' button'
                          style='width: 580px background-color: #4e4e4e border: 1px solid #2a2a2a font-size: 14px color: white font-family: 'Courier New', Courier, monospace padding: 4px 24px 4px 24px pointer-events: none' />&nbsp
                        <button id='copyShareLinkBtn' className='smallButton' onClick='copyShareLinkPlan()'>Copy</button>
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
              {/* <li className='dropdown'>
                <a href='#javascript:void(0)' className='dropbtn'>File</a>
                <div className='dropdown-content'>
                  <a onClick='setNewPlan()'>New</a>
                  <a onClick='loadExamplePlan()'>Load Demo</a>
                  <a id='loadBtn' onClick='document.getElementById('file').click()'>Load</a>
                  <input type='file' style='display:none' id='file' name='file' onchange='loadFileAsText(event)' />
                  <a id='saveBtn' onClick='savePlan()'>Save</a>
                  <a id='shareBtn' onClick='openShareDialog()'>Share</a>
                  <a id='defaultsBtn' onClick='setPropertiesView('defaults')'>Defaults</a>
                  <!--<a  id='groundPropertiesButton' onClick='setToolMode('ground')'>Ground Properties</a>-->
                  <a id='fullscreenApp' onClick='openFullscreen('appBody')'>Fullscreen</a>
                </div>
              </li> */}
              {/* <li className='dropdown'>
                <a href='#javascript:void(0)' className='dropbtn'>Edit</a>
                <div className='dropdown-content'>
                  <a id='undoBtn' onClick='doUndo()'>Undo</a>
                  <a id='redoBtn' onClick='doRedo()'>Redo</a>
                </div>
              </li> */}
              {/* <li className='dropdown'>
                <a href='#javascript:void(0)' className='dropbtn'>Plan View</a>
                <div className='dropdown-content'>
                  <a onClick='setPropertiesView('planView')'>Background Template</a>
                  <a onClick='newLevel()'>Add Level</a>
                  <a onClick='openFullscreen('planView')'>Fullscreen</a>
                </div>
              </li> */}
              {/* <li className='dropdown'>
                <a href='#javascript:void(0)' className='dropbtn'>3D View</a>
                <div className='dropdown-content'>
                  <a onClick='setPropertiesView('3dView')'>Properties</a>
                  <a onClick='openFullscreen('view3d')'>Fullscreen</a>
                  <a onClick='exportToObj()'>Export As OBJ</a>
                  <!--<a  id='createThumb' onClick='createThumbForHistory()'>Create Thumb</a>-->
                </div>
              </li> */}
              {/* <!--<li>
                <a  onClick='doLog()'>Log</a>
              </li>-->
              <!-- <li>
                <a onClick='showModalAbout()'>About</a>
              </li> --> */}
              {/* <li>
                <a id='pointerTool' onClick='setToolMode('pointer')' className='toolButton activeTool'
                  title='Pointer Select' alt='Pointer Select'>
                  <img src='media/pointericonWhite.png' height='42px'>
                </a>
              </li> */}
              {/* <!-- <li>
                <a onClick='setToolMode('hand')'>
                  <img src='media/handicon.png' width='50px'>
                </a>
              </li> --> */}
              {/* <li>
                <a id='addWallTool' onClick='setToolMode('walls')' className='toolButton' title='Add Wall' alt='Add Wall'>
                  <img src='media/newWallWhite2.png' height='42px'>
                </a>
              </li> */}
              {/* <li>
                <a id='addFloorTool' onClick='setToolMode('floor')' className='toolButton' title='Add Floor'
                  alt='Add Floor'>
                  <img src='media/newFloorWhite2.png' height='42px'>
                </a>
              </li> */}
              {/* <li>
                <a id='addRoofTool' onClick='setToolMode('roof')' className='toolButton' title='Add Roof' alt='Add Roof'>
                  <img src='media/newRoofWhite2.png' height='42px'>
                </a>
              </li> */}
              {/* <li>
                <a id='addRulerTool' onClick='setToolMode('dimension')' className='toolButton' title='Add Dimension'
                  alt='Add Dimension'>
                  <img src='media/newRulerWhite2.png' height='42px'>
                </a>
              </li> */}
              {/* <li>
                <a id='addTextTool' onClick='setToolMode('text')' className='toolButton' title='Add Text Annotation'
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
                  {/* <button id='getShareLinkBtn' className='mediumButton' onClick='generateShareLink()'>Generate Share
                    Link</button>
                  <div style='margin:10px 0px 10px 0px'>
                    <div style='padding-top:6px'>
                      <label for='shareLinkUrl'>Editable Copy</label><br />
                      <input type='text' id='shareLinkUrl' placeholder='Press 'Generate Share Link' button'
                        style='width: 580px background-color: #4e4e4e border: 1px solid #2a2a2a font-size: 14px color: white font-family: 'Courier New', Courier, monospace padding: 4px 24px 4px 24px pointer-events: none' />&nbsp
                      <button id='copyShareLinkBtn' className='smallButton' onClick='copyShareLink()'>Copy</button>
                    </div>

                    <div style='padding-top:6px'>
                      <label for='shareLinkUrl3d'>Read Only 3d View</label><br />
                      <input type='text' id='shareLinkUrl3d' placeholder='Press 'Generate Share Link' button'
                        style='width: 580px background-color: #4e4e4e border: 1px solid #2a2a2a font-size: 14px color: white font-family: 'Courier New', Courier, monospace padding: 4px 24px 4px 24px pointer-events: none' />&nbsp
                      <button id='copyShareLinkBtn' className='smallButton' onClick='copyShareLink3d()'>Copy</button>
                    </div>

                    <div style='padding-top:6px'>
                      <label for='shareLinkUrlPlan'>Read Only Plan View</label><br />
                      <input type='text' id='shareLinkUrlPlan' placeholder='Press 'Generate Share Link' button'
                        style='width: 580px background-color: #4e4e4e border: 1px solid #2a2a2a font-size: 14px color: white font-family: 'Courier New', Courier, monospace padding: 4px 24px 4px 24px pointer-events: none' />&nbsp
                      <button id='copyShareLinkBtn' className='smallButton' onClick='copyShareLinkPlan()'>Copy</button>
                    </div>
                  </div> */}
                </div>
                <div className='modal-small-footer'>
                  <h3><a href='http://threedgarden.com'>ThreeD Home Design</a></h3>
                </div>
              </div>
            </div>

            {/* <div id='propertiesView' style='padding-left: 10px'>
              <div id='threed3DModelPropertiesView' style='display: none'>
                <h3>3d Model Properties</h3>
                <table className='propertiesTable' style='min-width: 290px'>
                  <tr>
                    <td colspan='2' style='text-align: center'>
                      <div onmousedown='beginDrag(event, modalModel3dThreedId)' className='disableSelection'><img
                          id='model3dLargeThumb' className='disableSelection' style='pointer-events: none' /></div>
                    </td>
                  </tr>
                  <tr>
                    <td width='70'>Name</td>
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
                    <td>3D Model</td>
                    <td>
                      <button className='moreInfoBtn' onClick='showModel3dView()'>View</button>
                    </td>
                  </tr>
                </table>
              </div>
              <div id='threedPropertiesView' style='display: none'>
                <h3>Threed Properties</h3>
                <table className='propertiesTable' style='min-width: 290px'>
                  <tr>
                    <td width='70'>Id</td>
                    <td><span id='objectId'></span></td>
                  </tr>
                  <tr>
                    <td>Name</td>
                    <td><span id='objectName'></span></td>
                  </tr>
                  <tr>
                    <td>X</td>
                    <td><input type='text' id='threedXProp'
                        style='width: 80px border: 1px solid #2a2a2a font-size: 14px color: white font-family: 'Courier New', Courier, monospace'
                        className='editable' onChange='validatePlusOrMinusNumber(this, updateThreedPosX)'
                        maxlength='8' />
                      cm</td>
                  </tr>
                  <tr>
                    <td>Z</td>
                    <td><input type='text' id='threedZProp'
                        style='width: 80px border: 1px solid #2a2a2afont-size: 14px color: white font-family: 'Courier New', Courier, monospace'
                        className='editable' onChange='validatePlusOrMinusNumber(this, updateThreedPosZ)'
                        maxlength='8' />
                      cm</td>
                  </tr>
                  <tr>
                    <td>Y</td>
                    <td><input type='text' id='threedYProp'
                        style='width: 80px border: 1px solid #2a2a2afont-size: 14px color: white font-family: 'Courier New', Courier, monospace'
                        className='editable' onChange='validatePlusOrMinusNumber(this, updateThreedPosY)'
                        maxlength='8' />
                      cm</td>
                  </tr>
                  <tr>
                    <td>Width</td>
                    <td>
                      <input type='text' id='threedWidthProp'
                        style='width:80px border: 1px solid #2a2a2afont-size: 14px color: white font-family: 'Courier New', Courier, monospace'
                        className='editable' onChange='validatePlusNumber(this, updateThreedWidth)' maxlength='8' />
                      cm
                      <input type='checkbox' id='flipX' onchange='flipX(this.checked)'>Flip X
                    </td>
                  </tr>
                  <tr>
                    <td>Depth</td>
                    <td>
                      <input type='text' id='threedDepthProp'
                        style='width:80px border: 1px solid #2a2a2afont-size: 14px color: white font-family: 'Courier New', Courier, monospace'
                        className='editable' onChange='validatePlusNumber(this, updateThreedDepth)' maxlength='8' />
                      cm
                      <input type='checkbox' id='flipZ' onchange='flipZ(this.checked)'>Flip Z
                    </td>
                  </tr>
                  <tr>
                    <td>Height</td>
                    <td><input type='text' id='threedHeightProp'
                        style='width:80px border: 1px solid #2a2a2afont-size: 14px color: white font-family: 'Courier New', Courier, monospace'
                        className='editable' onChange='validatePlusOrMinusNumber(this, updateThreedHeight)'
                        maxlength='8' /> cm</td>
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
                    <td><button className='moreInfoBtn' onClick='showModel3dView()'>View</button></td>
                  </tr>
                </table>
              </div>
              <div id='defaultsPropertiesView' style='display:none'>
                <h3>Default Settings</h3>
                <table className='propertiesTable' style='min-width:290px'>
                  <tr>
                    <td>Compass Heading</td>
                    <td><input type='range' id='compassHdg' name='compassHdg' min='0' max='360' step='1' value='0'
                        oninput='rotateCompass(this.value)' onchange='rotateCompass(this.value)' />
                      <span id='compassHdgLbl'>0°</span>
                    </td>
                  </tr>
                </table>
              </div>
              <div id='wallDefaultsPropertiesView' style='display:none'>
                <h3>Default Wall Settings</h3>
                <table className='propertiesTable' style='min-width:290px'>
                  <tr>
                    <td width='70'>Wall Height</td>
                    <td><input type='text' id='defaultWallHeightProp'
                        style='width:80px border: 1px solid #2a2a2afont-size: 14px color: white font-family: 'Courier New', Courier, monospace'
                        className='editable' onChange='validatePlusNumber(this, updateDefaultWallHeight)'
                        maxlength='8' />
                      cm</td>
                  </tr>
                  <tr>
                    <td>Wall Thickness</td>
                    <td><input type='text' id='defaultWallThicknessProp'
                        style='width:80px border: 1px solid #2a2a2afont-size: 14px color: white font-family: 'Courier New', Courier, monospace'
                        className='editable' onChange='validatePlusNumber(this, updateDefaultWallThickness)'
                        maxlength='8' />
                      cm</td>
                  </tr>
                </table>
              </div>
              <div id='floorDefaultsPropertiesView' style='display:none'>
                <h3>Default Floor Settings</h3>
                <table className='propertiesTable' style='min-width:290px'>
                  <tr>
                    <td>Floor Thickness</td>
                    <td><input type='text' id='defaultFloorThicknessProp'
                        style='width:80px border: 1px solid #2a2a2afont-size: 14px color: white font-family: 'Courier New', Courier, monospace'
                        className='editable' onChange='validatePlusNumber(this, updateDefaultFloorThickness)'
                        maxlength='8' /> cm</td>
                  </tr>
                </table>
              </div>
              <div id='roofDefaultsPropertiesView' style='display:none'>
                <h3>Default Roof Settings</h3>
                <table className='propertiesTable' style='min-width:290px'>
                  <tr>
                    <td>Roof Thickness</td>
                    <td><input type='text' id='defaultRoofThicknessProp'
                        style='width:80px border: 1px solid #2a2a2afont-size: 14px color: white font-family: 'Courier New', Courier, monospace'
                        className='editable' onChange='validatePlusNumber(this, updateDefaultRoofThickness)'
                        maxlength='8' />
                      cm</td>
                  </tr>
                  <tr>
                    <td>Rise</td>
                    <td><input type='text' id='defaultRoofRiseProp'
                        style='width:80px border: 1px solid #2a2a2afont-size: 14px color: white font-family: 'Courier New', Courier, monospace'
                        className='editable' onChange='validatePlusNumber(this, updateDefaultRoofRise)'
                        maxlength='8' />
                      cm</td>
                  </tr>
                  <tr>
                    <td>Base Offset</td>
                    <td><input type='text' id='defaultRoofStartHeightProp'
                        style='width:80px border: 1px solid #2a2a2afont-size: 14px color: white font-family: 'Courier New', Courier, monospace'
                        className='editable' onChange='validatePlusOrMinusNumber(this, updateDefaultRoofStartHeight)'
                        maxlength='8' />
                      cm</td>
                  </tr>
                  <tr>
                    <td>Run</td>
                    <td><input type='text' id='defaultRoofWidthProp'
                        style='width:80px border: 1px solid #2a2a2afont-size: 14px color: white font-family: 'Courier New', Courier, monospace'
                        className='editable' onChange='validatePlusNumber(this, updateDefaultRoofWidth)'
                        maxlength='8' />
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
                </table>
              </div>
              <div id='dimensionDefaultsPropertiesView' style='display:none'>
                <h3>Default Dimension Settings</h3>
              </div>
              <div id='textDefaultsPropertiesView' style='display:none'>
                <h3>Default Text Settings</h3>
              </div>

              <div id='planViewPropertiesView' style='display:none'>
                <h3>Background Template</h3>
                <table className='propertiesTable' style='min-width:290px'>
                  <tr>
                    <td width='70'>File</td>
                    <td>
                      <input type='file' id='backgroundImageFile' name='backgroundImageFile'
                        onchange='loadBackgroundImage(event)' />
                    </td>
                  </tr>
                  <tr>
                    <td>Opacity</td>
                    <td>
                      <input type='range' id='bgTemplateOpacity' name='bgTemplateOpacity' min='0' max='1.0' step='.01'
                        value='0.33' oninput='setBgTemplateOpacity(this.value)'
                        onchange='setBgTemplateOpacity(this.value)' />
                    </td>
                  </tr>
                  <tr>
                    <td>Flip Horizontal</td>
                    <td>
                      <input type='checkbox' id='bgTplFlipX' onchange='flipBackgroundTemplateX(this.checked)'>
                    </td>
                  </tr>
                  <tr>
                    <td>Flip Vertical</td>
                    <td>
                      <input type='checkbox' id='bgTplFlipZ' onchange='flipBackgroundTemplateZ(this.checked)'>
                    </td>
                  </tr>
                  <tr>
                    <td width='60'></td>
                    <td><button id='resizeBackgroundImageBtn' onClick='enableResizeBackgroundTemplate()'
                        className='moreInfoBtn'>Resize</button></td>
                  </tr>
                  <tr>
                    <td width='60'></td>
                    <td><button id='deleteBackgroundImageBtn' onClick='deleteBackgroundImage()'
                        className='moreInfoBtn'>Delete</button></td>
                  </tr>
                </table>
              </div>
              <div id='3dViewPropertiesView' style='display:none'>
                <h3>3d View Properties</h3>
                <table className='propertiesTable' style='min-width:290px'>
                  <tr>
                    <td width='70'>Wall Color</td>
                    <td>
                      <input type='hidden' id='wallDiffuse' value='rgba(255,255,255,0.5)'>
                    </td>
                  </tr>
                  <tr>
                    <td width='70'>Wall Specular</td>
                    <td>
                      <input type='hidden' id='wallSpecular' value='#00ff00'>
                    </td>
                  </tr>
                  <!--<tr>
                    <td width='70'>Wall Emissive</td>
                    <td>
                      <input type='hidden' id='wallEmissive' value='#ffffff'>
                    </td>
                  </tr>-->
                  <tr>
                    <td width='70'>Floor Color</td>
                    <td>
                      <input type='hidden' id='floorDiffuse' value='rgba(15,15,15,0.5)'>
                    </td>
                  </tr>
                  <tr>
                    <td width='70'>Floor Specular</td>
                    <td>
                      <input type='hidden' id='floorSpecular' value='#00ffff'>
                    </td>
                  </tr>
                  <tr>
                    <td width='70'>Roof Color</td>
                    <td>
                      <input type='hidden' id='roofDiffuse' value='rgba(255,255,255,0.5)'>
                    </td>
                  </tr>
                  <tr>
                    <td width='70'>Roof Specular</td>
                    <td>
                      <input type='hidden' id='roofSpecular' value='#ff0000'>
                    </td>
                  </tr>
                  <tr>
                    <td>Ground Color</td>
                    <td>
                      <input type='hidden' id='groundDiffuse' value='rgba(03,141,221,1.0)'>
                    </td>
                  </tr>
                  <tr>
                    <td>Ground Specular</td>
                    <td>
                      <input type='hidden' id='groundSpecular' value='#f2ff9c'>
                    </td>
                  </tr>
                  <tr>
                    <td width='70'>Depth Write</td>
                    <td>
                      <input type='checkbox' id='depthWriteMode' onChange='setDepthWriteMode(this.checked)'>
                    </td>
                  </tr>
                  <tr>
                    <td width='70'>Sort Objects</td>
                    <td>
                      <input type='checkbox' id='sortObjectsMode' onChange='setSortObjectsMode(this.checked)'>
                    </td>
                  </tr>
                  <tr>
                    <td>Sun Azimuth</td>
                    <td>
                      <input type='range' id='sunAzimuth' name='sunAzimuth' min='0' max='1.0' step='.01' value='0.33'
                        oninput='setSunAzimuth(this.value)' onchange='setSunAzimuth(this.value)' />
                    </td>
                  </tr>
                  <tr>
                    <td>Sun Incline</td>
                    <td>
                      <input type='range' id='sunIncline' name='sunIncline' min='0' max='1.0' step='.01' value='0.0'
                        oninput='setSunIncline(this.value)' onchange='setSunIncline(this.value)' />
                    </td>
                  </tr>
                  <tr>
                    <td>Ambient Intensity</td>
                    <td>
                      <input type='range' id='ambientLightBrightness' name='ambientLightBrightness' min='0.0'
                        max='1.0' step='0.1' oninput='adjustAmbientLightBrightness(this.value)'
                        onchange='adjustAmbientLightBrightness(this.value)' />
                    </td>
                  </tr>
                  <tr>
                    <td>Directional Intensity</td>
                    <td>
                      <input type='range' id='dirLightBrightness' name='dirLightBrightness' min='0.0' max='1.0'
                        step='0.1' oninput='adjustDirLightBrightness(this.value)'
                        onchange='adjustDirLightBrightness(this.value)' />
                    </td>
                  </tr>
                  <tr>
                    <td>Hemisphere Intensity</td>
                    <td>
                      <input type='range' id='hemiLightBrightness' name='hemiLightBrightness' min='0.0' max='1.0'
                        step='0.1' oninput='adjustHemiLightBrightness(this.value)'
                        onchange='adjustHemiLightBrightness(this.value)' />
                    </td>
                  </tr>
                </table>
              </div>
              <div id='wallPropertiesView' style='display:none'>
                <h3>Wall Properties</h3>
                <table className='propertiesTable' style='min-width:290px'>
                  <tr>
                    <td width='70'>Id</td>
                    <td>
                      <input type='hidden' id='wallIdHidden'>
                      <span id='wallIdProp'></span>
                    </td>
                  </tr>
                  <tr>
                    <td>Height</td>
                    <td><input type='text' id='wallHeightProp'
                        style='width:80px border: 1px solid #2a2a2afont-size: 14px color: white font-family: 'Courier New', Courier, monospace'
                        className='editable' onChange='validatePlusNumber(this, updateWallHeight)' maxlength='8' /> cm
                    </td>
                  </tr>
                  <tr>
                    <td>Height Start</td>
                    <td><input type='text' id='wallHeight0Prop'
                        style='width:80px border: 1px solid #2a2a2afont-size: 14px color: white font-family: 'Courier New', Courier, monospace'
                        className='editable' onChange='validatePlusNumber(this, updateWallHeight0)' maxlength='8' /> cm
                    </td>
                  </tr>
                  <tr>
                    <td>Height End</td>
                    <td><input type='text' id='wallHeight1Prop'
                        style='width:80px border: 1px solid #2a2a2afont-size: 14px color: white font-family: 'Courier New', Courier, monospace'
                        className='editable' onChange='validatePlusNumber(this, updateWallHeight1)' maxlength='8' /> cm
                    </td>
                  </tr>
                  <tr>
                    <td>Thickness</td>
                    <td><input type='text' id='wallThicknessProp'
                        style='width:80px border: 1px solid #2a2a2afont-size: 14px color: white font-family: 'Courier New', Courier, monospace'
                        className='editable' onChange='validatePlusNumber(this, updateWallThickness)' maxlength='8' />
                      cm</td>
                  </tr>
                  <tr>
                    <td>Level</td>
                    <td><span id='wallLevelProp'></span></td>
                  </tr>
                </table>
              </div>
              <div id='roofPropertiesView' style='display:none'>
                <h3>Roof Properties</h3>
                <table className='propertiesTable' style='min-width:290px'>
                  <tr>
                    <td width='70'>Id</td>
                    <td>
                      <input type='hidden' id='roofIdHidden'>
                      <span id='roofIdProp'></span>
                    </td>
                  </tr>
                  <tr>
                    <td>Thickness</td>
                    <td><input type='text' id='roofThicknessProp'
                        style='width:80px border: 1px solid #2a2a2afont-size: 14px color: white font-family: 'Courier New', Courier, monospace'
                        className='editable' onChange='validatePlusNumber(this, updateRoofThickness)' maxlength='8' />
                      cm</td>
                  </tr>
                  <tr>
                    <td>Rise</td>
                    <td><input type='text' id='roofRiseProp'
                        style='width:80px border: 1px solid #2a2a2afont-size: 14px color: white font-family: 'Courier New', Courier, monospace'
                        className='editable' onChange='validatePlusNumber(this, updateRoofRise)' maxlength='8' />
                      cm</td>
                  </tr>
                  <tr>
                    <td>Base Offset</td>
                    <td><input type='text' id='roofStartHeightProp'
                        style='width:80px border: 1px solid #2a2a2afont-size: 14px color: white font-family: 'Courier New', Courier, monospace'
                        className='editable' onChange='validatePlusOrMinusNumber(this, updateRoofStartHeight)'
                        maxlength='8' />
                      cm</td>
                  </tr>
                  <tr>
                    <td>Run</td>
                    <td><input type='text' id='roofWidthProp'
                        style='width:80px border: 1px solid #2a2a2afont-size: 14px color: white font-family: 'Courier New', Courier, monospace'
                        className='editable' onChange='validatePlusNumber(this, updateRoofWidth)' maxlength='8' />
                      cm</td>
                  </tr>
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
                </table>
              </div>
              <div id='floorPropertiesView' style='display:none'>
                <h3>Floor Properties</h3>
                <table className='propertiesTable' style='min-width:290px'>
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
                </table>
              </div>
              <div id='dimensionPropertiesView' style='display:none'>
                <h3>Dimension Properties</h3>
                <table className='propertiesTable' style='min-width:290px'>
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
                </table>
              </div>
              <div id='textPropertiesView' style='display:none'>
                <h3>Text Annotation Properties</h3>
                <table className='propertiesTable' style='min-width:290px'>
                  <tr>
                    <td width='70'>Id</td>
                    <td><span id='textIdProp'></span></td>
                  </tr>
                  <tr>
                    <td>Text</td>
                    <td><input type='text' id='textValueProp'
                        style='width:120px border: 1px solid #2a2a2afont-size: 14px color: white font-family: 'Courier New', Courier, monospace'
                        className='editable' onkeyup='validateText(event, this, updateTextValue)' maxlength='100' />
                    </td>
                  </tr>
                  <tr>
                    <td>X</td>
                    <td><input type='text' id='textXProp'
                        style='width:100px border: 1px solid #2a2a2afont-size: 14px color: white font-family: 'Courier New', Courier, monospace'
                        className='editable' onChange='validatePlusOrMinusNumber(this, updateTextX)' maxlength='8' />
                    </td>
                  </tr>
                  <tr>
                    <td>Y</td>
                    <td><input type='text' id='textYProp'
                        style='width:100px border: 1px solid #2a2a2afont-size: 14px color: white font-family: 'Courier New', Courier, monospace'
                        className='editable' onChange='validatePlusOrMinusNumber(this, updateTextY)' maxlength='8' />
                    </td>
                  </tr>
                  <tr>
                    <td>Level</td>
                    <td><span id='textLevelProp'></span></td>
                  </tr>
                </table>
                <!--<div>Type<span id='textDataTypeProp'></span></div>-->
                <!--<div><button id='deleteTextAnnotationBtn' onClick='deleteTextBtnClick()'>Delete</button></div>-->
              </div>
              <div id='levelPropertiesView' style='display:none'>
                <h3>Level Properties</h3>
                <table className='propertiesTable' style='min-width:290px'>
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
                        style='width:100px border: 1px solid #2a2a2afont-size: 14px color: white font-family: 'Courier New', Courier, monospace'
                        className='editable' onChange='validatePlusOrMinusNumber(this, updateLevelHeight)'
                        maxlength='8' />
                    </td>
                  </tr>
                </table>
              </div>
              <div id='groundPropertiesView' style='display:none'>
                <h3>Ground Layer Properties</h3>
                <table className='propertiesTable' style='min-width:290px'>
                  <tr>
                    <td>Width</td>
                    <td><input type='text' id='groundWidthProp'
                        style='width:80px border: 1px solid #2a2a2afont-size: 14px color: white font-family: 'Courier New', Courier, monospace'
                        className='editable' onChange='validatePlusNumber(this, updateGroundWidth)' maxlength='8' />
                      cm</td>
                  </tr>
                  <tr>
                    <td>Legth</td>
                    <td><input type='text' id='groundLengthProp'
                        style='width:80px border: 1px solid #2a2a2afont-size: 14px color: white font-family: 'Courier New', Courier, monospace'
                        className='editable' onChange='validatePlusNumber(this, updateGroundLength)' maxlength='8' />
                      cm</td>
                  </tr>
                </table>
              </div>
            </div> */}
          </Flex>
        </Grid>



      </Flex>
    </>
  )
}

// HomeDesignPage.getLayout = (page: any) => {page}
// HomeDesignPage.getLayout = (page: any) => <UserLayout>{page}</UserLayout>
// HomeDesignPage.getLayout = (page: any) => <BlankLayout>{page}</BlankLayout>
// HomeDesignPage.authGuard = true
// HomeDesignPage.guestGuard = true

export default HomeDesignPage
