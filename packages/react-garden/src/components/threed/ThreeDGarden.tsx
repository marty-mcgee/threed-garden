// ==============================================================
/* FUNCTIONAL NOUNS  (JS OBJECTS, SIMILAR TO CLASSES, BUT BETTER)
// ================
// * ThreeD           | as root JS Object       | interface IThreeD
// ================
// * Project          | as JS Object            | interface IProject
// * Plan             | as JS Object            | interface IPlan
// * File             | as JS Object from Any   | interface IFile
// * Edit             | Actions | Relationships | interface IEdit
// * View             | as JS Object | Settings | interface IView
// ================
// * Simulation       | as JS Object            | interface ISimulation
// * Game             | extends Simulation      | interface IGame
// * Demo             | extends Simulation      | interface IGame
// ================
// * World            | as JS Object            | interface IWorld
// * Character        | as JS Object            | interface ICharacter
// * Bear             | extends Character       | interface IBear
// * Gardener         | extends Character       | interface IGardener
// * Chicken          | extends Character       | interface IChicken
// * Scene            | extends THREE.Scene     | interface IScene
// * Plane            | extends THREE.Object3D  | interface IPlane
// * Structure        | extends THREE.Object3D  | interface IStructure
// * Farm             | extends THREE.Group     | interface IFarm
// * Garden           | extends THREE.Group     | interface IGarden
// * Allotment        | extends Structure       | interface IAllotment
// * Bed              | extends Structure       | interface IBed
// * Furniture        | extends Structure       | interface IFurniture
// * Equipment        | extends Structure       | interface IEquipment
// * Plant            | extends Structure       | interface IPlant
// * Soil             | extends Structure       | interface ISoil
// * SoilAddendum     | extends Soil            | interface ISoilAddendum
// * SoilPlan         | Actions | Relationships | interface ISoilPlan
// * PlantingPlan     | Actions | Relationships | interface IPlantingPlan
// * BuildingPlan     | Actions | Relationships | interface IBuildingPlan
// ================
// * Tool             | as JS Object | extends ThreeD?                      | interface ITool
// * PlaneTool        | extends Tool                                        | interface IPlane
// * Camera           | extends Tool | extends THREE.Camera                 | interface ICamera
// * Renderer         | extends Tool | extends THREE.Renderer               | interface IRenderer
// * Light            | extends Tool | extends THREE.Light.DirectionalLight | interface ILight
// * Raster           | extends Tool | extends THREE.Raster.Rasterizer      | interface IRaster
// * Shader           | extends Tool | extends THREE.Shader.Shaderizer      | interface IShader
// * Animation        | extends Tool | extends OBJ.animation                | interface IAnimation
*/

// ==============================================================
// RESOURCES

// ** React Imports
import {
  useEffect,
  useRef,
  useState,
  useCallback,
  FunctionComponent,
  MouseEventHandler,
  ReactNode,
  SyntheticEvent
} from "react"

// ** Zustand + Zustood Imports
// state management (instead of React.useState)
import create from "zustand"
import shallow from "zustand/shallow"
import { subscribeWithSelector } from "zustand/middleware"
import produce from "immer"
import { createStore } from '@udecode/zustood'

// ** Next Imports
import Image from "next/image"

// ** MUI Imports
import { styled, useTheme } from '@mui/material/styles'
// mui: ui
import MuiAppBar from "@mui/material/AppBar"
import MuiToolbar from "@mui/material/Toolbar"
import Container from "@mui/material/Container"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import IconButton from "@mui/material/IconButton"
import Menu from "@mui/material/Menu"
import MenuItem from "@mui/material/MenuItem"
import MenuList from "@mui/material/MenuList"
import MenuIcon from "@mui/icons-material/Menu"
import Grid from "@mui/material/Grid"
import Modal from "@mui/material/Modal"
import Tabs from "@mui/material/Tabs"
import Tab from "@mui/material/Tab"
import Tooltip from "@mui/material/Tooltip"
import Typography from "@mui/material/Typography"
import Avatar from "@mui/material/Avatar"
import AdbIcon from "@mui/icons-material/Adb"
// mui: Material Dashboard 2 PRO React TS components
import MDBox from "~/components/mui/MDBox"
import MDTypography from "~/components/mui/MDTypography"
import MDAlert from "~/components/mui/MDAlert"
import MDButton from "~/components/mui/MDButton"
import MDProgress from "~/components/mui/MDProgress"
import MDTabPanel, { a11yProps } from "~/components/mui/MDTabPanel"

import paper from "paper"

// import * as THREE from "three"
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls.js"
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader"
import { Sky } from "three/examples/jsm/objects/Sky.js"

// import { TWEEN } from "three/examples/jsm/libs/tween.module.min"
import TWEEN from "@tweenjs/tween.js"
import { Canvas, useFrame } from "@react-three/fiber"

// css
import "~/assets/demo/css/Demo.module.css"

// no no no, never again
// import * as $ from "jquery"

// ==========================================================
// UUID
import { v4 as newUUID } from "uuid"

// HMMM
import button from "~/themes/theme-dark/components/button"

// TOOL MODE ICONS
import ToolIconPointer from '@mui/icons-material/TouchApp'
import ToolIconHand from '@mui/icons-material/PanTool'
import ToolIconAddWall from "@mui/icons-material/HouseSiding"
import ToolIconAddFloor from "@mui/icons-material/ViewModule"
import ToolIconAddRoof from "@mui/icons-material/Roofing"
import ToolIconAddRuler from "@mui/icons-material/Straighten"
import ToolIconAddText from "@mui/icons-material/TextFields"

// ==========================================================
// COLORFUL CONSOLE MESSAGES (ccm)

const ccm0 = "color: white; font-size: 12px;"
const ccm1 = "color: green; font-size: 12px;"
const ccm2 = "color: red; font-size: 12px;"
const ccm3 = "color: orange; font-size: 12px;"
const ccm4 = "color: yellow; font-size: 12px;"
const ccm5 = "color: blue; font-size: 12px;"
console.log("%cThreeDGarden<FC>", ccm1)
// console.log("%cWHOOPSIES", ccm2)

// ==========================================================
// DELETE OBJECT KEYS: RESET OBJECT TO {}

const clearObject = (object: Object, option: number = 1) => {
  switch (option) {
    // option 1 // ES5
    case 1:
      Object.keys(object).forEach(key => {
        delete object[key]
      })
      break
    // option 2 // ES6
    case 2:
      for (const key in object) {
        delete object[key]
      }
      break
    // option 3 // ES5: for enumerable and non-enumerable properties
    case 3:
      Object.getOwnPropertyNames(object).forEach(function (key) {
        delete object[key]
      })
      break
    // option 4 // ES6: for enumerable and non-enumerable properties
    case 4:
      for (const key of Object.getOwnPropertyNames(object)) {
        delete object[key]
      }
  }
}

// ==========================================================
// STYLES
const styleModal = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "80vw",
  height: "60vh",
  bgcolor: "#09090D",
  border: "2px solid #000000",
  boxShadow: 24,
  p: 2
};

const AppBar = styled(MuiAppBar)(({ theme }) => ({
  // transition: 'none',
  // alignItems: 'center',
  // justifyContent: 'center',
  // padding: theme.spacing(0, 6),
  // backgroundColor: 'transparent',
  // color: theme.palette.text.primary,
  minHeight: `42px !important`,
  // [theme.breakpoints.down('sm')]: {
  //   paddingLeft: theme.spacing(4),
  //   paddingRight: theme.spacing(4)
  // }
}))

const Toolbar = styled(MuiToolbar)(({ theme }) => ({
  // width: '100%',
  // borderBottomLeftRadius: 10,
  // borderBottomRightRadius: 10,
  // padding: `${theme.spacing(0)} !important`,
  minHeight: `42px !important`,
  // transition: 'padding .25s ease-in-out, box-shadow .25s ease-in-out, backdrop-filter .25s ease-in-out'
}))

// ==========================================================
// TS INTERFACES + TYPES
// ==========================================================

// ==========================================================
// FUNCTIONAL NOUNS
// ==========================================================
// ThreeD

const useThreeDStore = create((set) => ({
  _id: newUUID() as string,
  _ts: new Date().toISOString() as string,
  threedCount: 0,
  threeds: [],
  threed: {
    _id: newUUID() as string,
    _ts: new Date().toISOString() as string,
    name: "HEY HEY HEY 0",
    layers: new Array,
    activeLayer: {
      name: "level0-MM",
      data: {}
    }
  },
  increaseThreeDCount: () => set(
    (state: any) => (
      { threedCount: state.threedCount + 1 }
    )
  ),
  removeAllThreeDs: () => set(
    {
      threedCount: 0,
      threeds: []
    }
  ),
  addThreeD: () => {
    // threedCurrent
    set(
      (state: any) => (
        {
          threed: {
            _id: newUUID() as string,
            _ts: new Date().toISOString() as string,
            name: "HEY HEY HEY 1",
            layers: new Array,
            activeLayer: {
              name: "level1-MM",
              data: {}
            }
          },
          threedCount: state.threedCount + 1,
        }
      )
    )
    // threedHistory
    set(
      (state: any) => (
        {
          threeds: [state.threed, ...state.threeds],
          threedCount: state.threeds.length,
        }
      )
    )
  },

})) // useThreeDStore

function ThreeDInfoPanel() {
  const threedCount = useThreeDStore((state: any) => state.threedCount)
  const threeds = useThreeDStore((state: any) => state.threeds)
  const threed = useThreeDStore((state: any) => state.threed)
  console.debug("%cthreed", ccm1, threed)
  return (
    <Box>
      <Typography>{threeds.length} threeds around here ...</Typography>
      {/* <Typography>{threedCount} threeds around here ...</Typography> */}
    </Box>
  )
}

function ThreeDControlPanel() {
  const increaseThreeDCount = useThreeDStore((state: any) => state.increaseThreeDCount)

  const addThreeD = useThreeDStore((state: any) => state.addThreeD)

  return (
    <Box>
      <Button onClick={addThreeD}>add threed</Button>
      {/* <Button onClick={increaseThreeDCount}>add to threed count</Button> */}
    </Box>
  )
}

// ==========================================================
// Project

const useProjectStore = create((set, get) => ({
  _id: newUUID() as string,
  _ts: new Date().toISOString() as string,
  projectCount: 0,
  projects: [],
  project: {
    _id: newUUID() as string,
    _ts: new Date().toISOString() as string,
    layers: new Array,
    activeLayer: {
      name: "level0-MM",
      data: {}
    }
  },
  increaseProjectCount: () => set(
    (state: any) => (
      { projectCount: state.projectCount + 1 }
    )
  ),
  removeAllProjects: () => set(
    {
      projectCount: 0,
      projects: []
    }
  ),
  addProject: (stated: any) => {
    // projectCurrent
    set(
      (state: any) => (
        {
          project: {
            _id: newUUID() as string,
            _ts: new Date().toISOString() as string,
            layers: new Array,
            activeLayer: {
              name: "level1-MM",
              data: {}
            }
          },
          projectCount: state.projectCount + 1,
        }
      )
    )
    // projectHistory
    set(
      (state: any) => (
        {
          projects: [state.project, ...state.projects],
          projectCount: state.projects.length,
        }
      )
    )
    // saveToDisk
    get().saveToDisk()
    // loadFromDisk
    get().loadFromDisk()

    console.debug("%cAddProject", ccm1, get().project)
  },
  saveProject: () => {
    // saveToDisk
    get().saveToDisk()
  },
  saveToDisk: () => {
    try {
      localStorage.setItem("threed_projectHistory", JSON.stringify({ subject: "projects", payload: get().projects }))
      console.debug("%cSaveToDisk", ccm1, get().projects)
      return true
    } catch (err) {
      console.debug("%cSaveToDisk", ccm3, err)
      return false
    }
  },
  loadFromDisk: () => {
    try {
      const loaded = localStorage.getItem("threed_projectHistory")
      if (loaded) {
        console.debug("%cLoadFromDisk", ccm1, true) // loaded
        return loaded // string[]
      }
      console.debug("%cLoadFromDisk", ccm3, loaded)
      return false
    } catch (err) {
      console.debug("%cLoadFromDisk", ccm3, err)
      return false
    }
  }

})) // useProjectStore

function ProjectInfoPanel() {
  const projectCount = useProjectStore((state: any) => state.projectCount)
  const projects = useProjectStore((state: any) => state.projects)
  const project = useProjectStore((state: any) => state.project)

  // console.debug("%cCurrentProject", ccm1, project)
  return (
    <Box>
      <Typography>{projects.length} projects around here ...</Typography>
      {/* <Typography>{projectCount} projects around here ...</Typography> */}
    </Box>
  )
}

function ProjectControlPanel() {
  // const increaseProjectCount = useProjectStore((state: any) => state.increaseProjectCount)

  const addProject = useProjectStore((state: any) => state.addProject)
  // const addProject = useProjectStore.getState().addProject() // this executes automatically !! bad
  const saveToDisk = useProjectStore((state: any) => state.saveToDisk)
  const loadFromDisk = useProjectStore((state: any) => state.loadFromDisk)

  const addProjectAsFunction = () => {
    const addProject = useProjectStore.getState().addProject() // this executes automatically !! good
  }

  return (
    <Box>
      <Button onClick={addProjectAsFunction}>add project()</Button>
      <Button onClick={addProject}>add project</Button>
      <Button onClick={saveToDisk}>save to disk</Button>
      <Button onClick={loadFromDisk}>load from disk</Button>
      {/* <Button onClick={increaseProjectCount}>add to project count</Button> */}
    </Box>
  )
}

// ==========================================================
// Plan

const usePlanStore = create((set, get) => ({
  _id: newUUID() as string,
  _ts: new Date().toISOString() as string,
  planCount: 0,
  plans: [],
  plan: {
    _id: newUUID() as string,
    _ts: new Date().toISOString() as string,
    levels: [{ id: 0, height: 0 }] as Object[],
    // levels[0]: { id: 0, height: 0 },
    floors: [] as Object[],
    roofs: [] as Object[],
    walls: [] as Object[],
    dimensions: [] as Object[],
    texts: [] as Object[],
    furniture: [] as Object[],

    verticalGuides: [] as Object[],
    horizontalGuides: [] as Object[],

    furnitureAddedKey: null as any,
    furnitureDirtyKey: null as any,
    furnitureDeletedKey: null as any,
    wallAddedKey: null as any,
    wallDirtyKey: null as any,
    wallDeletedKey: null as any,
    roofAddedKey: null as any,
    roofDirtyKey: null as any,
    roofDeletedKey: null as any,
    floorAddedKey: null as any,
    floorDirtyKey: null as any,
    floorDeletedKey: null as any,
    dimensionAddedKey: null as any,
    dimensionEditedKey: null as any,
    dimensionDeletedKey: null as any,
    textAddedKey: null as any,
    textEditedKey: null as any,
    textDeletedKey: null as any,

    wallDiffuse: null as string,
    wallOpacity: null as number,
    wallSpecular: null as string,
    roofDiffuse: null as string,
    roofOpacity: null as number,
    roofSpecular: null as string,
    floorDiffuse: null as string,
    floorOpacity: null as number,
    floorSpecular: null as string,
    groundDiffuse: null as string,
    groundOpacity: null as number,
    groundSpecular: null as string,

    depthWrite: null as any,
    sortObjects: null as any,

    azimuth: null as number,
    inclination: null as number
  },
  increasePlanCount: () => set(
    (state: any) => (
      { planCount: state.planCount + 1 }
    )
  ),
  removeAllPlans: () => set(
    {
      planCount: 0,
      plans: []
    }
  ),
  addPlan: () => {
    // planCurrent
    set(
      (state: any) => (
        {
          plan: {
            _id: newUUID() as string,
            _ts: new Date().toISOString() as string,
            levels: [{ id: 0, height: 0 }] as Object[],
            // levels[0]: { id: 0, height: 0 },
            floors: [] as Object[],
            roofs: [] as Object[],
            walls: [] as Object[],
            dimensions: [] as Object[],
            texts: [] as Object[],
            furniture: [] as Object[],

            verticalGuides: [] as Object[],
            horizontalGuides: [] as Object[],

            furnitureAddedKey: null as any,
            furnitureDirtyKey: null as any,
            furnitureDeletedKey: null as any,
            wallAddedKey: null as any,
            wallDirtyKey: null as any,
            wallDeletedKey: null as any,
            roofAddedKey: null as any,
            roofDirtyKey: null as any,
            roofDeletedKey: null as any,
            floorAddedKey: null as any,
            floorDirtyKey: null as any,
            floorDeletedKey: null as any,
            dimensionAddedKey: null as any,
            dimensionEditedKey: null as any,
            dimensionDeletedKey: null as any,
            textAddedKey: null as any,
            textEditedKey: null as any,
            textDeletedKey: null as any,

            wallDiffuse: wallMaterial.color.getHexString(),
            wallOpacity: wallMaterial.opacity,
            wallSpecular: wallMaterial.specular.getHexString(),
            roofDiffuse: roofMaterial.color.getHexString(),
            roofOpacity: roofMaterial.opacity,
            roofSpecular: roofMaterial.specular.getHexString(),
            floorDiffuse: floorMaterial.color.getHexString(),
            floorOpacity: floorMaterial.opacity,
            floorSpecular: floorMaterial.specular.getHexString(),
            groundDiffuse: groundMaterial.color.getHexString(),
            groundOpacity: groundMaterial.opacity,
            groundSpecular: groundMaterial.specular.getHexString(),

            depthWrite: "checked", // document.getElementById("depthWriteMode").checked,
            sortObjects: "checked", // document.getElementById("sortObjectsMode").checked,

            azimuth: azimuth,
            inclination: inclination
          },
          planCount: state.planCount + 1
        }
      )
    )
    // planHistory
    set(
      (state: any) => (
        {
          plans: [state.plan, ...state.plans],
          planCount: state.plans.length,
        }
      )
    )
    // saveToDisk
    get().saveToDisk()
    // loadFromDisk
    get().loadFromDisk()

    console.debug("%cAddPlan", ccm1, get().plan)
  },
  savePlan: () => {
    // saveToDisk
    get().saveToDisk()
  },
  saveToDisk: () => {
    try {
      localStorage.setItem("threed_planHistory", JSON.stringify({ subject: "plans", payload: get().plans }))
      console.debug("%cSaveToDisk", ccm1, get().plans)
      return true
    } catch (err) {
      console.debug("%cSaveToDisk", ccm3, err)
      return false
    }
  },
  loadFromDisk: () => {
    try {
      const loaded = localStorage.getItem("threed_planHistory")
      if (loaded) {
        console.debug("%cLoadFromDisk", ccm1, true) // loaded
        return loaded // string[]
      }
      console.debug("%cLoadFromDisk", ccm3, loaded)
      return false
    } catch (err) {
      console.debug("%cLoadFromDisk", ccm3, err)
      return false
    }
  }

})) // usePlanStore

function PlanInfoPanel() {
  const planCount = usePlanStore((state: any) => state.planCount)
  const plans = usePlanStore((state: any) => state.plans)
  const plan = usePlanStore((state: any) => state.plan)

  // console.debug("%cCurrentPlan", ccm1, plan)
  return (
    <Box>
      <Typography>{plans.length} plans around here ...</Typography>
      {/* <Typography>{planCount} plans around here ...</Typography> */}
    </Box>
  )
}

function PlanControlPanel() {
  // const increasePlanCount = usePlanStore((state: any) => state.increasePlanCount)

  const addPlan = usePlanStore((state: any) => state.addPlan)
  // const addPlan = usePlanStore.getState().addPlan() // this executes automatically !! bad
  const saveToDisk = usePlanStore((state: any) => state.saveToDisk)
  const loadFromDisk = usePlanStore((state: any) => state.loadFromDisk)

  const addPlanAsFunction = () => {
    const addPlan = usePlanStore.getState().addPlan() // this executes automatically !! good
  }

  return (
    <Box>
      <Button onClick={addPlanAsFunction}>add plan()</Button>
      <Button onClick={addPlan}>add plan</Button>
      <Button onClick={saveToDisk}>save to disk</Button>
      <Button onClick={loadFromDisk}>load from disk</Button>
      {/* <Button onClick={increasePlanCount}>add to plan count</Button> */}
    </Box>
  )
}

const createPlan = () => {
  const plan = usePlanStore(
    (state: any) => {
      state.addPlan
      state.increasePlanCount
    }
  )
  return plan
}

// ==========================================================
// File
const useFileStore = create((set) => ({
  fileCount: 0,
  files: [],
  file: {},
})) // useFileStore

function FileInfoPanel() {
  const fileCount = useFileStore((state: any) => state.fileCount)
  const files = useFileStore((state: any) => state.files)
  const file = useFileStore((state: any) => state.file)

  // console.debug("%cCurrentFile", ccm1, file)
  return (
    <Box>
      <Typography>{files.length} files around here ...</Typography>
      {/* <Typography>{fileCount} files around here ...</Typography> */}
    </Box>
  )
}

function FileControlPanel() {
  const increaseFileCount = useFileStore((state: any) => state.increaseFileCount)

  const addFile = useFileStore((state: any) => state.addFile)

  return (
    <Box>
      <Button onClick={addFile}>add file</Button>
      {/* <Button onClick={increaseFileCount}>add to file count</Button> */}
    </Box>
  )
}

const createFile = () => {
  const file = useFileStore(
    (state: any) => {
      state.addFile
      state.increaseFileCount
    }
  )
  return file
}

// ==========================================================
// Simulation


// ==========================================================
// Bear

const useBearStore = create((set) => ({
  bears: 0,
  increaseBearCount: () => set((state: any) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
}))

function BearInfoPanel() {
  const bears = useBearStore((state: any) => state.bears)
  return <Box>{bears} bears around here ...</Box>
}

function BearControlPanel() {
  const increaseBearCount = useBearStore((state: any) => state.increaseBearCount)
  return <Button onClick={increaseBearCount}>add a bear</Button>
}

// ==========================================================
// Modal

const modalStore = createStore('modal')({
  name: 'zustood',
  isOpenModalAbout: false,
  // handleOpenModalAbout: () => set(() => ({ isOpenModalAbout: true })),
  // handleCloseModalAbout: () => set(() => ({ isOpenModalAbout: false }))
  isOpenModalModel3d: false,
  isOpenModalLoading: false,
  isOpenModalShare: false,
})

const useModalStore = create((set, get) => ({
  name: 'zustand',
  isOpenAboutModal: false,
  handleOpenAboutModal: () => set(() => ({ isOpenAboutModal: true })),
  handleCloseAboutModal: () => set(() => ({ isOpenAboutModal: false })),
  isOpenModel3dModal: false,
  handleOpenModel3dModal: () => set(() => ({ isOpenModel3dModal: true })),
  handleCloseModel3dModal: () => set(() => ({ isOpenModel3dModal: false })),
  isOpenLoadingModal: false,
  handleOpenLoadingModal: () => set(() => ({ isOpenLoadingModal: true })),
  handleCloseLoadingModal: () => set(() => ({ isOpenLoadingModal: false })),
  isOpenShareModal: false,
  handleOpenShareModal: () => set(() => ({ isOpenShareModal: true })),
  handleCloseShareModal: () => set(() => ({ isOpenShareModal: false })),
}))

// ==========================================================
// BEGIN COMPONENT PROPERTIES (VARIABLES, PARAMETERS)
// ==========================================================

// const begin = () => {

let mouseMode = 0
let toolMode = "pointer"
let selectedItem
let defaultCursor = "default"
// let deselectAll
let UILayout = "default"

const Texts = {}
const Dimensions = {}
const Floors = {}
const Floors3d = {}
const Roofs = {}
const Walls = {}
const Furniture = {}

let textPath = ""
let textIdCounter = 0
let startedDrawingText = !1
let editingTextId = -1

let dimensionPath = ""
let dimensionIdCounter = 0
let dimensionHelperPath = ""
let startedDrawingDimension = !1

let floorPath = ""
let floorIdCounter = 0
let floorHelperPath = ""
let startedDrawingFloor = !1

let wallPath = ""
let wallIdCounter = 0
const wallsRectangles = {}
const wallsRectangles3d = {}
let wallHelperPath = ""
let wallHelperRectangle = ""
let startedDrawingWalls = !1

let roofPath = ""
let roofIdCounter = 0
let roofHelperPath = ""
const roofsRectangles = {}
const roofsRectangles3d = {}
let roofHelperRectangle = ""
let startedDrawingRoofs = !1

const maskObjects = {}
const maskObjectsApplied = {}
const maskObjectsAppliedRoof = {}

const clickableObjects = {}
let clickableObjectsCounter = -1

let backgroundRaster = ""
let backgroundRasterRatioX = 1
let backgroundRasterRatioY = 1

let levelButtons = ""
let otherLayerWallsRasters: any[] = []
let otherLayerFurnitureRasters: any[] = []

const verticalGuides = {}
const horizontalGuides = {}
let selectedGuideId = ""
let guideCounter = 0
let draggingNewGuide = !1
let snapTolerance = 1

const furnitureItems = {}
let furnitureToLoadCount = 0
let loadedFurnitureCount = 0

// THREE >>
let canvas3d
let camera
let renderer
let container
let scene = {}
let mesh
let ground
let controls
let tween
let raycaster
let mouse
// lights
let ambientLight
let dirLight
let hemiLight
let pointLight
// materials
let groundMaterial = {
  color: { getHexString: () => "#0xFFFFFF" },
  opacity: 1,
  specular: { getHexString: () => "#0xCCCCCC" }
}
let floorMaterial = {
  color: { getHexString: () => "#0xFFFFFF" },
  opacity: 1,
  specular: { getHexString: () => "#0xCCCCCC" }
}
let roofMaterial = {
  color: { getHexString: () => "#0xFFFFFF" },
  opacity: 1,
  specular: { getHexString: () => "#0xCCCCCC" }
}
let wallMaterial = {
  color: { getHexString: () => "#0xFFFFFF" },
  opacity: 1,
  specular: { getHexString: () => "#0xCCCCCC" }
}
// << THREE

// GROUPS
// Paper.Group !! 2D
// these should be arrays [] ??? YES, CHANGED
const furnitureGroup: any[] = []
// furnitureGroup[0] = new paper.Group()
const wallsGroup: any[] = []
// wallsGroup[0] = new paper.Group()
const roofsGroup: any[] = []
// roofsGroup[0] = new paper.Group()
const floorsGroup: any[] = []
// floorsGroup[0] = new paper.Group()
const dimensionsGroup: any[] = []
// dimensionsGroup[0] = new paper.Group()
const textsGroup: any[] = []
// textsGroup[0] = new paper.Group()
// these 3 should be const arrays [] ??
const guidesGroup: Object = {} // new paper.Group()
const toolsGroup: Object = {} // new paper.Group()
const gridGroup: Object = {} // new paper.Group()


let inclination = 0
let azimuth = 0


// ==========================================================
// NOUN HISTORY

// // THREED HISTORY
const threedHistory: Object[] = []
let threedHistoryPosition = 0

// // PROJECT HISTORY
const projectHistory: Object[] = []
let projectHistoryPosition = 0

// // PLAN HISTORY
const planHistory: Object[] = []
let planHistoryPosition = 0

// // SIMULATION HISTORY
const simulationHistory: Object[] = []
let simulationHistoryPosition = 0


// ==========================================================
// COMPONENTS

// Modal: About
const AboutModal: FunctionComponent = (): JSX.Element => {

  // const [isOpenAboutModal, setIsOpenAboutModal] = useState(false)
  // const handleOpenAboutModal = () => setIsOpenAboutModal(true)
  // const handleCloseAboutModal = () => setIsOpenAboutModal(false)

  // tabs
  const [tabAboutModal, setTabAboutModal] = useState(0)
  const handleChangeTabAboutModal = (event: SyntheticEvent, newValue: number) => {
    setTabAboutModal(newValue);
  }

  // console.debug("AboutModal")
  // useEffect(() => {
  //   console.debug("AboutModal onMount")
  //   return () => {
  //     console.debug("AboutModal onUnmount")
  //   }
  // }, [])

  return (
    <Box id="aboutModalContainer">
      {/* <Button size="small" onClick={handleOpenAboutModal}>
        Open About Modal
      </Button> */}
      <Modal
        id="aboutModal"
        // open={useModalStore.getState().isOpenAboutModal}
        open={modalStore.use.isOpenModalAbout()}
        onClose={useModalStore.getState().handleCloseAboutModal()}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box className="modal-content" sx={styleModal}>

          <Box className="modal-header" style={{ textAlign: "center" }}>
            <Image src="/favicon/favicon.png"
              width={50}
              height={50}
              alt="ThreeD Garden Logo"
              title="ThreeD Garden"
            />
            <h2>ThreeD Garden</h2>
          </Box>

          <Box className="modal-body" sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabAboutModal} onChange={handleChangeTabAboutModal} aria-label="basic tabs example">
                <Tab label="Intro" {...a11yProps(0)} />
                <Tab label="Models" {...a11yProps(1)} />
                <Tab label="Examples" {...a11yProps(2)} />
                <Tab label="FAQ" {...a11yProps(3)} />
                <Tab label="Contact" {...a11yProps(4)} />
                <Tab label="Other" {...a11yProps(5)} />
                <Tab label="Supporters" {...a11yProps(6)} />
              </Tabs>
            </Box>
            <MDTabPanel value={tabAboutModal} index={0}>
              <div style={{ paddingBottom: 8 }}>
                Plan + Share Ideas for your Home + Garden in 2D + 3D
              </div>
              <div style={{ border: "1px solid #272727", padding: 10 }}>
                <div style={{ textAlign: "center", padding: 10 }}>
                  <div>Save Plans to Browser&apos;s Local Storage?:</div>
                  <input
                    type="checkbox"
                    id="saveEditsToLocalStorage"
                    onChange={() => handleSaveEditsLocalStorageOption}
                    style={{ marginLeft: 5, marginRight: 5 }}
                  />
                  <br />
                  <br />
                  <span className="tooltip">
                    <span className="tooltiptext">
                      Edits you make to plans will be saved to your browser&apos;s local storage so that you don&apos;t lose any work between saves. Plans will be removed if you clean your browser&apos;s cookies and history, so to save your work long term, use the &quot;File: Save&quot; option in the main toolbar.
                    </span>
                  </span>
                  <br />
                  <br />
                  <div id="localStoragePlanDiv" style={{ textAlign: "center" }}>
                    <Button
                      size="small"
                      onClick={() => loadFromLocalStorage}
                      id="loadLocalStoragePlanBtn">
                      Load Plan from Local Storage
                    </Button>
                    <br />
                    <span id="localStoragePlanLastSavedDate" />
                    {/* <div>
                          <Image
                            id="localStoragePlanImage"
                            alt="Local Storage Plan Image"
                            src={null}
                            onClick={() => loadFromLocalStorage} />
                        </div> */}
                  </div>
                </div>
                <div id="featuredPlan" style={{ textAlign: "center", padding: 10 }}>
                  <Button
                    size="small"
                    onClick={() => loadExamplePlan}
                    id="loadFeaturedPlanBtn">
                    Load Example Plan
                  </Button>
                  <div>&nbsp;&nbsp;OR&nbsp;&nbsp;</div>
                  <Button
                    size="small"
                    onClick={() => closeAllModals}>
                    Start New Plan
                  </Button>
                  {/* <div>
                        <Image
                          id="featuredPlanImage"
                          alt="Featured Plan Image"
                          src={null}
                          onClick={() => loadExamplePlan} />
                      </div> */}
                </div>
              </div>
            </MDTabPanel>
            <MDTabPanel value={tabAboutModal} index={1}>
              <div>
                ThreeDGarden uses many 3D models which can be found on the internet as Public Domain, Free Art or Creative Commons.
              </div>
              <br />
              <div>
                Models ideally should be:
              </div>
              <div>
                <ul style={{ paddingLeft: 20 }}>
                  <li>Saved as .obj format along with the .mtl file, plus any texture files used. Blender OBJ default export options work very well.</li>
                  <li>1 unit in Blender = 1cm in ThreeDGarden. Eg, a cube with X:100, Y:100, Z:100, will display as 1 Meter cubed box in the 3d and Plan views.</li>
                  <li>If using Blender, Y-Axis in your OBJ export should be UP. Blender IDE defaults with the Z-Axis being UP in normal creatiion mode, but the OBJ export plugin defaults to convert the exported OBJ with the Y-Axis being UP. This is good.</li>
                  <li>Try to keep model low poly and the total download size smaller than 1Mb. Not totally essential but it helps.</li>
                  <li>Your model should be released as public domain or licensed with a non restrictive open source license such as a Free Art or Creative Commons.</li>
                  <li>You should own the copyright on the 3d model and textures, or have the permission of the copyight holder, and provide the model to add to the catalog for unrestricted use as either Public Domain, Free Art or Creative Commons.</li>
                  <li>Add the author&apos;s name, copyright year and attribution url, if known.</li>
                  <li>Models with restrictive licenses should not be added.</li>
                </ul>
              </div>
            </MDTabPanel>
            <MDTabPanel value={tabAboutModal} index={2}>
              <h3>Tutorial Videos</h3>
              <Grid container alignItems="center"
                sx={{
                  border: "1px solid #2a2a2a",
                  px: 1,
                  py: 1
                }}>
                <Grid item xs={4}>
                  <h3>Mansard</h3>
                  <div>
                    <a href="#https://www.youtube.com/watch?v=Ppqp-dLwKIE" target="_blank"
                      rel="noopener" className="largeButton">
                      Watch Video
                    </a>
                    <Button onClick={() => loadPlan('42fbd8ff0f5a37fa1285ae8b6c6ca36529b930c2')}
                      className="largeButton">Load Plan</Button>
                  </div>
                </Grid>
                <Grid item xs={4}>
                  <a href="#https://www.youtube.com/watch?v=Ppqp-dLwKIE" target="_blank"
                    rel="noopener">
                    <Image
                      src="/demo/tuts/mansard.png"
                      alt=""
                      width={317}
                      height={205}
                      style={{ border: "2px solid #2a2a2a" }}
                    />
                  </a>
                </Grid>
                <Grid item xs={4}>
                  <h3>Gable with Valley Roof</h3>
                  <div>
                    <a href="#https://www.youtube.com/watch?v=DUaBywAS6Ik" target="_blank"
                      rel="noopener" className="largeButton">
                      Watch Video
                    </a>
                    <Button onClick={() => loadPlan('0d371f9acad19a943f38c3a32f6d5d140bc6c913')}
                      className="largeButton">Load Plan</Button>
                  </div>
                </Grid>
                <Grid item xs={4}>
                  <a href="#https://www.youtube.com/watch?v=DUaBywAS6Ik" target="_blank"
                    rel="noopener">
                    <Image
                      src="/demo/tuts/gableWithValley.png"
                      alt=""
                      width={317}
                      height={205}
                      style={{ border: "2px solid #2a2a2a" }}
                    />
                  </a>
                </Grid>
                <Grid item xs={4}>
                  <h3>Modern Dutch Gable (Hip with Gable)</h3>
                  <div>
                    <a href="#https://www.youtube.com/watch?v=0cmjXmp7D_E" target="_blank"
                      rel="noopener" className="largeButton">
                      Watch Video
                    </a>
                    <Button onClick={() => loadPlan('c0300edf03b952872c37744bf570a588184dd3d5')}
                      className="largeButton">Load Plan</Button>
                  </div>
                </Grid>
                <Grid item xs={4}>
                  <a href="#https://www.youtube.com/watch?v=0cmjXmp7D_E" target="_blank"
                    rel="noopener">
                    <Image
                      src="/demo/tuts/modernDutchGable.png"
                      alt=""
                      width={317}
                      height={205}
                      style={{ border: "2px solid #2a2a2a" }}
                    />
                  </a>
                </Grid>
              </Grid>
            </MDTabPanel>
            <MDTabPanel value={tabAboutModal} index={3}>
              FAQ
            </MDTabPanel>
            <MDTabPanel value={tabAboutModal} index={4}>
              Contact
            </MDTabPanel>
            <MDTabPanel value={tabAboutModal} index={5}>
              Other
            </MDTabPanel>
            <MDTabPanel value={tabAboutModal} index={6}>
              Supporters
            </MDTabPanel>
          </Box>

          <Box className="modal-footer">
            <h3>&copy; <a href="https://threedgarden.com">ThreeDGarden</a></h3>
          </Box>
        </Box>
      </Modal>
    </Box>
  )
}

// Modal: Model3d
const Model3dModal: FunctionComponent = (): JSX.Element => {

  const [isOpenModel3dModal, setIsOpenModel3dModal] = useState(false)
  const handleOpenModel3dModal = () => setIsOpenModel3dModal(true)
  const handleCloseModel3dModal = () => setIsOpenModel3dModal(false)

  // console.debug("Model3dModal")
  // useEffect(() => {
  //   console.debug('Model3dModal onMount')
  //   return () => {
  //     console.debug('Model3dModal onUnmount')
  //   }
  // }, [])

  return (
    <Box id="model3dModalContainer">
      {/* <Button size="small" onClick={handleOpenModel3dModal}>
        Open Model3d Modal
      </Button> */}
      <Modal
        id="model3dModal"
        open={isOpenModel3dModal}
        onClose={handleCloseModel3dModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box className="modal-content" sx={styleModal}>

          <Box className="modal-header" style={{ textAlign: "center" }}>
            <Image src="/favicon/favicon.png"
              width={50}
              height={50}
              alt="ThreeD Garden Logo"
              title="ThreeD Garden"
            />
            <h2>ThreeD Garden</h2>
          </Box>

          <Box className="modal-body">
            <Box id="model3dView">
              <canvas id="model3dViewCanvas" />
            </Box>
            <Box id="modalModelDescription">
              <h3>3d Model Properties</h3>
              <table className="propertiesTable" style={{ width: "400px" }}>
                <tbody>
                  <tr>
                    <td>Name</td>
                    <td><span id="model3dNameModal" /></td>
                  </tr>
                  <tr>
                    <td>Author</td>
                    <td><span id="model3dAuthorModal" /></td>
                  </tr>
                  <tr>
                    <td>License</td>
                    <td><span id="model3dLicenseModal" /></td>
                  </tr>
                  <tr>
                    <td colSpan={2}>OBJ&nbsp;File&nbsp;Comments</td>
                  </tr>
                </tbody>
              </table>
              <textarea id="modalModel3dObjHeader" />
            </Box>
          </Box>

          <Box className="modal-footer">
            <h3><a href="http://threedgarden.com">ThreeDGarden</a></h3>
          </Box>
        </Box>
      </Modal>
    </Box>
  )
}

// Modal: Loading
const LoadingModal: FunctionComponent = (): JSX.Element => {

  const [isOpenLoadingModal, setIsOpenLoadingModal] = useState(false)
  const handleOpenLoadingModal = () => setIsOpenLoadingModal(true)
  const handleCloseLoadingModal = () => setIsOpenLoadingModal(false)

  // console.debug("LoadingModal")
  // useEffect(() => {
  //   console.debug('LoadingModal onMount')
  //   return () => {
  //     console.debug('LoadingModal onUnmount')
  //   }
  // }, [])

  return (
    <Box id="loadingModalContainer">
      {/* <Button size="small" onClick={handleOpenLoadingModal}>
        Open Loading Modal
      </Button> */}
      <Modal
        id="loadingModal"
        open={isOpenLoadingModal}
        onClose={handleCloseLoadingModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box className="modal-content" sx={styleModal}>

          <Box className="modal-header" style={{ textAlign: "center" }}>
            <Image src="/favicon/favicon.png"
              width={50}
              height={50}
              alt="ThreeD Garden Logo"
              title="ThreeD Garden"
            />
            <h2>ThreeD Garden</h2>
          </Box>

          <Box className="modal-body">
            <h3>Loading Model Progress</h3>
            <textarea id="modalLoadingDataInfo"></textarea>
          </Box>

          <Box className="modal-footer">
            <h3><a href="http://threedgarden.com">ThreeDGarden</a></h3>
          </Box>
        </Box>
      </Modal>
    </Box>
  )
}

// Modal: Share
const ShareModal: FunctionComponent = (): JSX.Element => {

  const [isOpenShareModal, setIsOpenShareModal] = useState(false)
  const handleOpenShareModal = () => setIsOpenShareModal(true)
  const handleCloseShareModal = () => setIsOpenShareModal(false)

  // console.debug("ShareModal")
  // useEffect(() => {
  //   console.debug('ShareModal onMount')
  //   return () => {
  //     console.debug('ShareModal onUnmount')
  //   }
  // }, [])

  return (
    <Box id="shareModalContainer">
      {/* <Button size="small" onClick={handleOpenShareModal}>
        Open Share Modal
      </Button> */}
      <Modal
        id="shareModal"
        open={isOpenShareModal}
        onClose={handleCloseShareModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box className="modal-content" sx={styleModal}>

          <Box className="modal-header" style={{ textAlign: "center" }}>
            <Image src="/favicon/favicon.png"
              width={50}
              height={50}
              alt="ThreeD Garden Logo"
              title="ThreeD Garden"
            />
            <h2>ThreeD Garden</h2>
          </Box>

          <Box className="smallModal-body">
            <h3>Share Plan</h3>
            <Button
              id="getShareLinkBtn"
              className="mediumButton"
              onClick={() => generateShareLink()}>
              Generate Share Link
            </Button>
            <Box style={{ margin: "10px 0px 10px 0px" }}>
              <Box style={{ paddingTop: "6px" }}>
                <label htmlFor="shareLinkUrl">Editable Copy<br />
                  <input
                    type="text"
                    id="shareLinkUrl"
                    placeholder="Press 'Generate Share Link' Button"
                    style={{
                      width: "580px",
                      backgroundColor: "#4e4e4e",
                      border: "1px solid #2a2a2a",
                      fontSize: "14px",
                      color: "white",
                      fontFamily: "'Courier New', Courier, monospace",
                      padding: "4px 24px 4px 24px",
                      pointerEvents: "none"
                    }} />&nbsp;
                </label>
                <Button
                  id="copyShareLinkBtn"
                  className="smallButton"
                  onClick={() => copyShareLink()}>
                  Copy
                </Button>
              </Box>

              <Box style={{ paddingTop: "6px" }}>
                <label htmlFor="shareLinkUrl3d">Read Only 3d View<br />
                  <input
                    type="text"
                    id="shareLinkUrl3d"
                    placeholder="Press 'Generate Share Link' Button"
                    style={{
                      width: "580px",
                      backgroundColor: "#4e4e4e",
                      border: "1px solid #2a2a2a",
                      fontSize: "14px",
                      color: "white",
                      fontFamily: "'Courier New', Courier, monospace",
                      padding: "4px 24px 4px 24px",
                      pointerEvents: "none"
                    }} />&nbsp;
                </label>
                <Button
                  id="copyShareLinkBtn"
                  className="smallButton"
                  onClick={() => copyShareLink3d()}>
                  Copy
                </Button>
              </Box>

              <Box style={{ paddingTop: "6px" }}>
                <label htmlFor="shareLinkUrlPlan">Read Only Plan View<br />
                  <input
                    type="text"
                    id="shareLinkUrlPlan"
                    placeholder="Press 'Generate Share Link' Button"
                    style={{
                      width: "580px",
                      backgroundColor: "#4e4e4e",
                      border: "1px solid #2a2a2a",
                      fontSize: "14px",
                      color: "white",
                      fontFamily: "'Courier New', Courier, monospace",
                      padding: "4px 24px 4px 24px",
                      pointerEvents: "none"
                    }} />&nbsp;
                </label>
                <Button
                  id="copyShareLinkBtn"
                  className="smallButton"
                  onClick={() => copyShareLinkPlan()}>
                  Copy
                </Button>
              </Box>
            </Box>
          </Box>

          <Box className="modal-footer">
            <h3><a href="http://threedgarden.com">ThreeDGarden</a></h3>
          </Box>
        </Box>
      </Modal>
    </Box>
  )
}

const ToolBar: FunctionComponent = (): JSX.Element => {

  const word = `[MM] @ ${new Date().toISOString()}`
  // console.debug("ToolBar", word)

  // const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null)
  const [anchorElActions, setAnchorElActions] = useState<null | HTMLElement>(null)
  const [anchorElFiles, setAnchorElFiles] = useState<null | HTMLElement>(null)
  const [anchorElEdits, setAnchorElEdits] = useState<null | HTMLElement>(null)
  const [anchorElViews, setAnchorElViews] = useState<null | HTMLElement>(null)
  const [anchorElLayers, setAnchorElLayers] = useState<null | HTMLElement>(null)
  const [anchorElTools, setAnchorElTools] = useState<null | HTMLElement>(null)

  // const handleOpenNavMenu = (event: MouseEvent<HTMLElement>) => {
  //   setAnchorElNav(event.currentTarget)
  // }
  // const handleCloseNavMenu = () => {
  //   setAnchorElNav(null)
  // }
  const handleOpenActionsMenu = (event: MouseEvent<HTMLElement>) => {
    setAnchorElActions(event.currentTarget)
  }
  const handleCloseActionsMenu = () => {
    setAnchorElActions(null)
  }
  const handleOpenFilesMenu = (event: MouseEvent<HTMLElement>) => {
    setAnchorElFiles(event.currentTarget)
  }
  const handleCloseFilesMenu = () => {
    setAnchorElFiles(null)
  }
  const handleOpenEditsMenu = (event: MouseEvent<HTMLElement>) => {
    setAnchorElEdits(event.currentTarget)
  }
  const handleCloseEditsMenu = () => {
    setAnchorElEdits(null)
  }
  const handleOpenViewsMenu = (event: MouseEvent<HTMLElement>) => {
    setAnchorElViews(event.currentTarget)
  }
  const handleCloseViewsMenu = () => {
    setAnchorElViews(null)
  }
  const handleOpenLayersMenu = (event: MouseEvent<HTMLElement>) => {
    setAnchorElLayers(event.currentTarget)
  }
  const handleCloseLayersMenu = () => {
    setAnchorElLayers(null)
  }
  const handleOpenToolsMenu = (event: MouseEvent<HTMLElement>) => {
    setAnchorElTools(event.currentTarget)
  }
  const handleCloseToolsMenu = () => {
    setAnchorElTools(null)
  }

  // ====================================================
  // FUNCTIONAL ACTIONS (FUNCTIONS ON FUNCTIONAL NOUNS)

  // MouseEventHandler<HTMLAnchorElement>
  const actionNewThreeD: any = (): any => {
    // alert("[MM] actionNewPlan")
    try {

      // TENTATIVE
      resetPlan() // clear all plan stuff, then create new plan...

      // PLAN
      // const plan = createPlan()
      createPlan()
      const plan = usePlanStore((state: any) => state.plan)
      const plans = usePlanStore((state: any) => state.plans)
      console.debug("actionNewPlan plan", plan)
      console.debug("actionNewPlan plans", plans)

      // PLAN HISTORY
      // const planHistory: Object[] = []
      // planHistory.push(plan) // push to end array position [array.length]
      planHistory.unshift(plan) // unshift to beginning array position [0]
      console.debug("planHistoryNew", planHistory)

      // latest plan position is now at the beginning of array
      // planHistoryPosition = planHistory.length - 1
      planHistoryPosition = 0

      // save to disk (if new plan only)
      localStorage.setItem("threed_planHistory", JSON.stringify({ subject: "plan", payload: planHistory }))

      setToolMode("pointer")

      // console.debug("[MM] TRY: actionNewPlan")
    } catch (e) {
      console.debug("[MM] CATCH: actionNewPlan", e)
    }
  }

  // MouseEventHandler<HTMLAnchorElement>
  const actionNewSimulation: any = (): any => {
    // alert("[MM] actionNewPlan")
    try {

      // TENTATIVE
      resetPlan() // clear all plan stuff, then create new plan...

      // PLAN
      // const plan = createPlan()
      createPlan()
      const plan = usePlanStore((state: any) => state.plan)
      const plans = usePlanStore((state: any) => state.plans)
      console.debug("actionNewPlan plan", plan)
      console.debug("actionNewPlan plans", plans)

      // PLAN HISTORY
      // const planHistory: Object[] = []
      // planHistory.push(plan) // push to end array position [array.length]
      planHistory.unshift(plan) // unshift to beginning array position [0]
      console.debug("planHistoryNew", planHistory)

      // latest plan position is now at the beginning of array
      // planHistoryPosition = planHistory.length - 1
      planHistoryPosition = 0

      // save to disk (if new plan only)
      localStorage.setItem("threed_planHistory", JSON.stringify({ subject: "plan", payload: planHistory }))

      setToolMode("pointer")

      // console.debug("[MM] TRY: actionNewPlan")
    } catch (e) {
      console.debug("[MM] CATCH: actionNewPlan", e)
    }
  }

  // MouseEventHandler<HTMLAnchorElement>
  const actionNewProject: any = (): any => {
    // alert("[MM] actionNewPlan")
    try {

      // TENTATIVE
      resetPlan() // clear all plan stuff, then create new plan...

      // PLAN
      // const plan = createPlan()
      createPlan()
      const plan = usePlanStore((state: any) => state.plan)
      const plans = usePlanStore((state: any) => state.plans)
      console.debug("actionNewPlan plan", plan)
      console.debug("actionNewPlan plans", plans)

      // PLAN HISTORY
      // const planHistory: Object[] = []
      // planHistory.push(plan) // push to end array position [array.length]
      planHistory.unshift(plan) // unshift to beginning array position [0]
      console.debug("planHistoryNew", planHistory)

      // latest plan position is now at the beginning of array
      // planHistoryPosition = planHistory.length - 1
      planHistoryPosition = 0

      // save to disk (if new plan only)
      localStorage.setItem("threed_planHistory", JSON.stringify({ subject: "plan", payload: planHistory }))

      setToolMode("pointer")

      // console.debug("[MM] TRY: actionNewPlan")
    } catch (e) {
      console.debug("[MM] CATCH: actionNewPlan", e)
    }
  }

  // MouseEventHandler<HTMLAnchorElement>
  const actionNewPlan: any = (): any => {
    // alert("[MM] actionNewPlan")
    try {

      // TENTATIVE -- [MM] HEY HEY HEY
      resetPlan() // clear all plan stuff, then create new plan...

      // PLAN
      // const plan = createPlan()
      createPlan()
      const plan = usePlanStore((state: any) => state.plan)
      const plans = usePlanStore((state: any) => state.plans)
      console.debug("actionNewPlan plan", plan)
      console.debug("actionNewPlan plans", plans)

      // PLAN HISTORY
      // const planHistory: Object[] = []
      // planHistory.push(plan) // push to end array position [array.length]
      planHistory.unshift(plan) // unshift to beginning array position [0]
      console.debug("planHistoryNew", planHistory)

      // latest plan position is now at the beginning of array
      // planHistoryPosition = planHistory.length - 1
      planHistoryPosition = 0

      // save to disk (if new plan only)
      localStorage.setItem("threed_planHistory", JSON.stringify({ subject: "plan", payload: planHistory }))

      setToolMode("pointer")

      // console.debug("[MM] TRY: actionNewPlan")
    } catch (e) {
      console.debug("[MM] CATCH: actionNewPlan", e)
    }
  }

  const resetPlan: any = (): any => {
    // alert("[MM] resetPlan")
    try {
      const resetPlan = { _ts: new Date().toISOString() }

      // save to disk
      localStorage.setItem("threed_resetPlan", JSON.stringify({ subject: "plan:reset", payload: resetPlan }))

      // console.debug("[MM] TRY: resetPlan")
    } catch (e) {
      console.debug("[MM] CATCH: resetPlan", e)
    }

    try {
      Object.keys(Texts).forEach(function (e) {
        let t = Texts[e]
        "object" == typeof t && deleteTextByKey(e)
      }),
        (textIdCounter = 0)
    } catch (e) {
      console.log("resetPlan : 1 : " + e)
    }
    try {
      Object.keys(Dimensions).forEach(function (e) {
        let t = Dimensions[e]
        "object" == typeof t && deleteDimensionByKey(e)
      }),
        (dimensionIdCounter = 0)
    } catch (e) {
      console.log("resetPlan : 2 : " + e)
    }
    try {
      Object.keys(Furniture).forEach(function (e) {
        let t = Furniture[e]
        "object" == typeof t &&
          (Furniture[e].data.toolsRectangleInner &&
            Furniture[e].data.toolsRectangleInner.remove(),
            Furniture[e].remove(),
            delete Furniture[e])
      })
    } catch (e) {
      console.log("resetPlan : 3 : " + e)
    }
    try {
      Object.keys(Floors).forEach(function (e) {
        let t = Floors[e]
        "object" == typeof t && (Floors[e].remove(), delete Floors[e])
      }),
        Object.keys(Floors3d).forEach(function (e) {
          let t = Floors3d[e]
          "object" == typeof t && (scene.remove(Floors3d[e]), delete Floors3d[e])
        }),
        (floorIdCounter = 0)
    } catch (e) {
      console.log("resetPlan : 4 : " + e)
    }
    try {
      Object.keys(Walls).forEach(function (e) {
        let t = Walls[e]
        "object" == typeof t && (Walls[e].remove(), delete Walls[e])
      })
      for (let e in wallsRectangles) wallsRectangles[e].remove()
    } catch (e) {
      console.log("resetPlan : 5 : " + e)
    }
    try {
      Object.keys(wallsRectangles3d).forEach(function (e) {
        let t = wallsRectangles3d[e]
        "object" == typeof t && scene.remove(wallsRectangles3d[e])
      })
    } catch (e) {
      console.log("resetPlan : 6 : " + e)
    }
    try {
      Object.keys(Roofs).forEach(function (e) {
        "object" == typeof Roofs[e] && (Roofs[e].remove(), delete Roofs[e])
      })
      for (let t in roofsRectangles) roofsRectangles[t].remove()
    } catch (e) {
      console.log("resetPlan : 5.1 : " + e)
    }
    try {
      Object.keys(roofsRectangles3d).forEach(function (e) {
        "object" == typeof roofsRectangles3d[e] &&
          scene.remove(roofsRectangles3d[e])
      })
    } catch (e) {
      console.log("resetPlan : 6.1 : " + e)
    }
    try {
      Object.keys(maskObjectsApplied).forEach(function (e) {
        "object" == typeof maskObjectsApplied[e] &&
          scene.remove(maskObjectsApplied[e])
      })
    } catch (e) {
      console.log("resetPlan : 6.5 : " + e)
    }
    try {
      Object.keys(maskObjectsAppliedRoof).forEach(function (e) {
        "object" == typeof maskObjectsAppliedRoof[e] &&
          scene.remove(maskObjectsAppliedRoof[e])
      })
    } catch (e) {
      console.log("resetPlan : 6.6 : " + e)
    }
    try {
      Object.keys(clickableObjects).forEach(function (e) {
        let t = clickableObjects[e]
        "object" == typeof t &&
          "groundLayer" != t.name &&
          (scene.remove(clickableObjects[e]), delete clickableObjects[e])
      })
    } catch (e) {
      console.log("resetPlan : 7 : " + e)
    }
    try {
      Object.keys(maskObjects).forEach(function (e) {
        let t = maskObjects[e]
        "object" == typeof t &&
          (scene.remove(maskObjects[e]), delete maskObjects[e])
      }),
        (clickableObjectsCounter = 0)
    } catch (e) {
      console.log("resetPlan : 8 : " + e)
    }
    try {
      backgroundRaster &&
        backgroundRaster.data &&
        (backgroundRaster.data.toolsRectangleInner &&
          backgroundRaster.data.toolsRectangleInner.remove(),
          backgroundRaster.remove(),
          (backgroundRaster = null),
          clearFileInput(document.getElementById("backgroundImageFile")))
    } catch (e) {
      console.log("resetPlan : 9 : " + e)
    }
    try {
      Object.keys(verticalGuides).forEach(function (e) {
        verticalGuides[e].remove(), delete verticalGuides[e]
      }),
        Object.keys(horizontalGuides).forEach(function (e) {
          horizontalGuides[e].remove(), delete horizontalGuides[e]
        }),
        (guideCounter = 0)
    } catch (e) {
      console.log("resetPlan : 10 : " + e)
    }
    try {
      furnitureToLoadCount = 0
      loadedFurnitureCount = 0
      wallIdCounter = 0
      clearObject(wallsRectangles)
      clearObject(wallsRectangles3d)
      clearObject(maskObjectsApplied)
      clearObject(maskObjectsAppliedRoof)
      roofIdCounter = 0
      clearObject(roofsRectangles)
      clearObject(roofsRectangles3d)

      clearObject(Dimensions)
      clearObject(Floors)
      clearObject(Floors3d)
      clearObject(Roofs)
      clearObject(Walls)
      clearObject(Texts)
      clearObject(Furniture)

      // clearObject(plan)
      //   ;
      // (plan.furniture = {}),
      //   (plan.walls = {}),
      //   (plan.roofs = {}),
      //   (plan.levels = []),
      //   (plan.levels[0] = { id: 0, height: 0 }),
      //   (plan.floors = {}),
      //   (plan.dimensions = {}),
      //   (plan.texts = {}),
      //   (plan.verticalGuides = {}),
      //   (plan.horizontalGuides = {}),
      //   (plan.furnitureAddedKey = null),
      //   (plan.furnitureDirtyKey = null),
      //   (plan.furnitureDeletedKey = null),
      //   (plan.wallAddedKey = null),
      //   (plan.wallDirtyKey = null),
      //   (plan.wallDeletedKey = null),
      //   (plan.roofAddedKey = null),
      //   (plan.roofDirtyKey = null),
      //   (plan.roofDeletedKey = null),
      //   (plan.floorAddedKey = null),
      //   (plan.floorDirtyKey = null),
      //   (plan.floorDeletedKey = null),
      //   (plan.dimensionAddedKey = null),
      //   (plan.dimensionEditedKey = null),
      //   (plan.dimensionDeletedKey = null),
      //   (plan.textAddedKey = null),
      //   (plan.textEditedKey = null),
      //   (plan.textDeletedKey = null),
      //   (plan.wallDiffuse = wallMaterial.color),
      //   (plan.wallOpacity = wallMaterial.opacity),
      //   (plan.wallSpecular = wallMaterial.specular),
      //   (plan.roofDiffuse = roofMaterial.color),
      //   (plan.roofOpacity = roofMaterial.opacity),
      //   (plan.roofSpecular = roofMaterial.specular),
      //   (plan.floorDiffuse = floorMaterial.color),
      //   (plan.floorOpacity = floorMaterial.opacity),
      //   (plan.floorSpecular = floorMaterial.specular),
      //   (plan.groundDiffuse = groundMaterial.color.getHexString()),
      //   (plan.groundOpacity = groundMaterial.opacity),
      //   (plan.groundSpecular = groundMaterial.specular.getHexString()),
      //   // (plan.depthWrite = document.getElementById("depthWriteMode").checked),
      //   // (plan.sortObjects = document.getElementById("sortObjectsMode").checked),
      //   (plan.azimuth = azimuth),
      //   (plan.inclination = inclination)

      // console.debug("%cresetPlan success", ccm1)
    } catch (e) {
      console.log("resetPlan : 11 : " + e)
    }
    try {
      otherLayerWallsRasters &&
        otherLayerWallsRasters.length > 0 &&
        (otherLayerWallsRasters.forEach(function (e) {
          e.remove()
        }),
          (otherLayerWallsRasters = [])),
        otherLayerFurnitureRasters &&
        otherLayerFurnitureRasters.length > 0 &&
        (otherLayerFurnitureRasters.forEach(function (e) {
          e.remove()
        }),
          (otherLayerFurnitureRasters = []))
    } catch (e) {
      console.log("resetPlan : 12 : " + e)
    }
    try {
      levelButtons || doAddNewLevel("0"), doSetLevel("0")
    } catch (e) {
      console.log("resetPlan : 13 : " + e)
    }
    try {
      Object.keys(levelButtons).forEach(function (e) {
        "0" !== e.toString() &&
          (levelButtons[e].parentNode.removeChild(levelButtons[e]),
            delete levelButtons[e],
            project.layers["level" + e].remove()
          )
      })
    } catch (e) {
      console.log("resetPlan : 14 : " + e)
    }
    try {
      project.layers.forEach(function (e: { data: { id: any }; remove: () => any }) {
        "0" !== e.data.id && e.remove()
      })

      project.activeLayer.name = "level0"
      project.activeLayer.data = { id: "0", height: 0 }

    } catch (e) {
      console.log("resetPlan : 15 : " + e)
    }

    try {
      // reset Groups
      // floorsGroup = {}
      floorsGroup.length = 0 // clearArray
      // floorsGroup[0] = new paper.Group()
      // roofsGroup = {}
      roofsGroup.length = 0 // clearArray
      // roofsGroup[0] = new paper.Group()
      // wallsGroup = {}
      wallsGroup.length = 0 // clearArray
      // wallsGroup[0] = new paper.Group()
      // dimensionsGroup = {}
      dimensionsGroup.length = 0 // clearArray
      // dimensionsGroup[0] = new paper.Group()
      // furnitureGroup = {}
      furnitureGroup.length = 0 // clearArray
      // furnitureGroup[0] = new paper.Group()
      // textsGroup = {}
      textsGroup.length = 0 // clearArray
      // textsGroup[0] = new paper.Group()

      // guidesGroup = new paper.Group()

      // deselectAll()
      // render()

    } catch (e) {
      console.log("resetPlan : 16 : " + e)
    }
  }

  const setToolMode: any = (mode): string => {

    try {
      switch (
      ("walls" === toolMode ? setEndDrawingWalls()
        : "floor" === toolMode ? setEndDrawingFloors()
          : "roof" === toolMode ? setEndDrawingRoofs()
            : "dimension" === toolMode ? setEndDrawingDimension()
              : "text" === toolMode ? setEndDrawingText()
                : "ground" === toolMode && setEndDrawingGround(),
        (toolMode = mode),
        mode)
      ) {
        case "pointer":
          // modalsActive || showMouseIndicators()
          defaultCursor = "default"
          // deselectAll()
          // document.getElementById("pointerTool").classList.add("activeTool")
          // document.getElementById("addWallTool").classList.remove("activeTool")
          // document.getElementById("addFloorTool").classList.remove("activeTool")
          // document.getElementById("addRoofTool").classList.remove("activeTool")
          // document.getElementById("addRulerTool").classList.remove("activeTool")
          // document.getElementById("addTextTool").classList.remove("activeTool")
          break
        case "walls":
          ; (defaultCursor = "crosshair"),
            deselectAll(),
            recalcAllUnjoinedWallSegments(-1),
            recalcAllWallSegmentsOnOtherLevels(-1, project.activeLayer.data.id),
            document.getElementById("pointerTool").classList.remove("activeTool"),
            document.getElementById("addWallTool").classList.add("activeTool"),
            document.getElementById("addFloorTool").classList.remove("activeTool"),
            document.getElementById("addRoofTool").classList.remove("activeTool"),
            document.getElementById("addRulerTool").classList.remove("activeTool"),
            document.getElementById("addTextTool").classList.remove("activeTool"),
            setPropertiesView("wallDefaults")
          break
        case "floor":
          ; (defaultCursor = "crosshair"),
            deselectAll(),
            document.getElementById("pointerTool").classList.remove("activeTool"),
            document.getElementById("addWallTool").classList.remove("activeTool"),
            document.getElementById("addFloorTool").classList.add("activeTool"),
            document.getElementById("addRoofTool").classList.remove("activeTool"),
            document.getElementById("addRulerTool").classList.remove("activeTool"),
            document.getElementById("addTextTool").classList.remove("activeTool"),
            recalcAllWallCorners(),
            setPropertiesView("floorDefaults")
          break
        case "roof":
          ; (defaultCursor = "crosshair"),
            deselectAll(),
            document.getElementById("pointerTool").classList.remove("activeTool"),
            document.getElementById("addWallTool").classList.remove("activeTool"),
            document.getElementById("addFloorTool").classList.remove("activeTool"),
            document.getElementById("addRoofTool").classList.add("activeTool"),
            document.getElementById("addRulerTool").classList.remove("activeTool"),
            document.getElementById("addTextTool").classList.remove("activeTool"),
            recalcAllRoofCorners(),
            setPropertiesView("roofDefaults")
          break
        case "dimension":
          ; (defaultCursor = "crosshair"),
            deselectAll(),
            document.getElementById("pointerTool").classList.remove("activeTool"),
            document.getElementById("addWallTool").classList.remove("activeTool"),
            document.getElementById("addFloorTool").classList.remove("activeTool"),
            document.getElementById("addRoofTool").classList.remove("activeTool"),
            document.getElementById("addRulerTool").classList.add("activeTool"),
            document.getElementById("addTextTool").classList.remove("activeTool"),
            recalcAllWallCorners(),
            recalcAllRoofCorners(),
            setPropertiesView("dimensionDefaults")
          break
        case "text":
          ; (defaultCursor = "crosshair"),
            deselectAll(),
            document.getElementById("pointerTool").classList.remove("activeTool"),
            document.getElementById("addWallTool").classList.remove("activeTool"),
            document.getElementById("addFloorTool").classList.remove("activeTool"),
            document.getElementById("addRoofTool").classList.remove("activeTool"),
            document.getElementById("addRulerTool").classList.remove("activeTool"),
            document.getElementById("addTextTool").classList.add("activeTool"),
            setPropertiesView("textnDefaults")
          break
        case "background":
          ; (defaultCursor = "default"),
            document.getElementById("pointerTool").classList.remove("activeTool"),
            document.getElementById("addWallTool").classList.remove("activeTool"),
            document.getElementById("addFloorTool").classList.remove("activeTool"),
            document.getElementById("addRoofTool").classList.remove("activeTool"),
            document.getElementById("addRulerTool").classList.remove("activeTool"),
            document.getElementById("addTextTool").classList.remove("activeTool")
          break
        case "ground":
          doSetLevel("0"),
            (toolMode = e),
            (defaultCursor = "default"),
            (wallsGroup[0].opacity = 0.25),
            (floorsGroup[0].opacity = 0.25),
            (furnitureGroup[0].opacity = 0.25),
            document.getElementById("pointerTool").classList.remove("activeTool"),
            document.getElementById("addWallTool").classList.remove("activeTool"),
            document.getElementById("addFloorTool").classList.remove("activeTool"),
            document.getElementById("addRoofTool").classList.remove("activeTool"),
            document.getElementById("addRulerTool").classList.remove("activeTool"),
            document.getElementById("addTextTool").classList.remove("activeTool"),
            setPropertiesView("ground")
          break
        default:
          defaultCursor = "default"
        // deselectAll()
        // document.getElementById("pointerTool").classList.remove("activeTool")
        // document.getElementById("addWallTool").classList.remove("activeTool")
        // document.getElementById("addFloorTool").classList.remove("activeTool")
        // document.getElementById("addRoofTool").classList.remove("activeTool")
        // document.getElementById("addRulerTool").classList.remove("activeTool")
        // document.getElementById("addTextTool").classList.remove("activeTool")
      }

      // planView.style.cursor = defaultCursor

    } catch (e) {
      console.debug("ERROR: setToolMode", mode, e)
    }

  }


  // =====================================================
  // doThings

  const doLoadFile: MouseEventHandler<HTMLAnchorElement> = (): any => {
    // alert("[MM] doLoadFile")
    try {
      const loaded = { ts: new Date().toISOString() }

      // save to disk
      // localStorage.clear()
      localStorage.setItem("threed_doLoadFile", JSON.stringify({ subject: "load", payload: loaded }))
      console.debug("[MM] TRY: doLoadFile")
    } catch (e) {
      console.debug("[MM] CATCH: doLoadFile", e)
    }
  }

  const doSaveFile: MouseEventHandler<HTMLAnchorElement> = (): any => {
    // alert("[MM] doSaveFile")
    try {
      const saved = { ts: new Date().toISOString() }

      // save to disk
      // localStorage.clear()
      localStorage.setItem("threed_doSaveFile", JSON.stringify({ subject: "save", payload: saved }))
      console.debug("[MM] TRY: doSaveFile")
    } catch (e) {
      console.debug("[MM] CATCH: doSaveFile", e)
    }
  }

  const doLoadFileAsText = (f: any) => {
    try {
      let t = f.target
      let o = new FileReader()
      // console.debug("%cFileReader", ccm1, o)
      o.onload = function () {
        let g = o.result
        actionNewPlan()
        // loadingProgressTxt = "Plan decoding\n" + loadingProgressTxt
        // document.getElementById("modalLoadingDataInfo").innerHTML = loadingProgressTxt
        console.debug("drawPlan", g)
        // drawPlan(JSON.parse(g))
        // clearFileInput(document.getElementById("file"))
      }
      // loadingProgressTxt = "Loading Saved Plan"
      // document.getElementById("modalLoadingDataInfo").innerHTML = loadingProgressTxt
      // $("#loadingModal").show()
      // hideMouseIndicators()
      o.readAsText(t.files[0])

      console.debug("%cFileReader", ccm1, o)

    } catch (e) {
      console.log("%cloadFileAsText : " + e, ccm2)
    }
  }

  const doOpenShareDialog = () => {
    try {
      $("#shareModal").show()
    } catch (e) {
      console.log("doOpenShareDialog : " + e)
    }
  }

  const doOpenFullscreen = (el: string) => {
    try {
      // alert(el)
      // let t = document.getElementById(el)
      let t = document.querySelector(el)
      if (!document.fullscreenElement) {
        t.requestFullscreen().catch(err => {
          alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`)
        })
      } else {
        document.exitFullscreen()
      }
      t.requestFullscreen
        ? t.requestFullscreen()
        : t.mozRequestFullScreen
          ? t.mozRequestFullScreen()
          : t.webkitRequestFullscreen
            ? t.webkitRequestFullscreen()
            : t.msRequestFullscreen && t.msRequestFullscreen()
    } catch (e) {
      // alert(e)
      console.log("doOpenFullscreen : " + e)
    }
  }

  const doAddNewLevel = (level) => {
    console.debug("%caddNewLevel called", ccm1, level)
    return (
      !1
    )
  }

  const doSetLevel = (level) => {
    console.debug("%csetLevel called", ccm1, level)
    return (
      !1
    )
  }

  const doUndo: MouseEventHandler<HTMLAnchorElement> = (): any => {
    // alert("[MM] doUndo")
    try {
      const undid = { ts: new Date().toISOString() }

      // save to disk
      // localStorage.clear()
      localStorage.setItem("threed_doUndo", JSON.stringify({ subject: "undo", payload: undid }))
      console.debug("[MM] TRY: doUndo")
    } catch (e) {
      console.debug("[MM] CATCH: doUndo", e)
    }
  }

  const doRedo: MouseEventHandler<HTMLAnchorElement> = (): any => {
    // alert("[MM] doRedo")
    try {
      const redid = { ts: new Date().toISOString() }

      // save to disk
      // localStorage.clear()
      localStorage.setItem("threed_doRedo", JSON.stringify({ subject: "redo", payload: redid }))
      console.debug("[MM] TRY: doRedo")
    } catch (e) {
      console.debug("[MM] CATCH: doRedo", e)
    }
  }

  // ============================================================

  // Component onMount hook
  useEffect(() => {
    const word = "YO YO YO"
    // console.debug("ToolBar onMount", word)
    return () => {
      // console.debug("ToolBar onUnmount", word)
    }
  }, [])

  const pages = ['Products', 'Pricing', 'Blog'];
  const settings = ['Profile', 'Account', 'Dashboard', 'Logout'];

  return (
    <AppBar id="toolBar" position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>

          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>

            <Button
              key="Actions"
              onClick={handleOpenActionsMenu}
              sx={{ color: '#FFFFFF', p: 0, ml: 2, mr: 3 }}
            >
              Actions
            </Button>
            <Menu
              sx={{ mt: 8 }}
              id="menu-appbar-actions"
              anchorEl={anchorElActions}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              open={Boolean(anchorElActions)}
              onClose={handleCloseActionsMenu}
            >
              <MenuItem key="New ThreeD" onClick={handleCloseActionsMenu}>
                <Typography onClick={() => useThreeDStore.getState().addThreeD()}>New ThreeD</Typography>
              </MenuItem>
              <MenuItem key="New Project" onClick={handleCloseActionsMenu}>
                <Typography onClick={() => useProjectStore.getState().addProject()}>New Project</Typography>
              </MenuItem>
              <MenuItem key="Save Project" onClick={handleCloseActionsMenu}>
                <Typography onClick={() => useProjectStore.getState().saveProject()}>Save Project</Typography>
              </MenuItem>
              <MenuItem key="New Plan" onClick={handleCloseActionsMenu}>
                <Typography onClick={() => usePlanStore.getState().addPlan()}>New Plan</Typography>
              </MenuItem>
              <MenuItem key="Save Plan" onClick={handleCloseActionsMenu}>
                <Typography id="saveBtn" onClick={usePlanStore.getState().savePlan()}>Save Plan</Typography>
              </MenuItem>
              <MenuItem key="New Simulation" onClick={handleCloseActionsMenu}>
                <Typography>New Simulation</Typography>
              </MenuItem>
            </Menu>

            <Button
              key="Files"
              onClick={handleOpenFilesMenu}
              sx={{ color: '#FFFFFF', p: 0, mr: 1 }}
            >
              Files
            </Button>
            <Menu
              sx={{ mt: 8 }}
              id="menu-appbar-files"
              anchorEl={anchorElFiles}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              open={Boolean(anchorElFiles)}
              onClose={handleCloseFilesMenu}
            >
              <MenuItem key="Load File" onClick={handleCloseFilesMenu}>
                <Typography id="loadBtn" onClick={doLoadFile}>Load File</Typography>
                <input
                  type="file"
                  style={{ display: "inline-block", marginLeft: "4px" }}
                  id="file"
                  name="file"
                  onChange={doLoadFileAsText}
                />
              </MenuItem>
              <MenuItem key="Save File" onClick={handleCloseFilesMenu}>
                <Typography id="saveBtn" onClick={doSaveFile}>Save File</Typography>
              </MenuItem>
              <MenuItem key="Export As OBJ" onClick={handleCloseFilesMenu}>
                <Typography id="exportBtn" onClick={() => exportToObj}>Export As OBJ</Typography>
              </MenuItem>
              <MenuItem key="Create Thumb" onClick={handleCloseFilesMenu}>
                <Typography id="createThumb" onClick={() => createThumbForHistory}>Create Thumb</Typography>
              </MenuItem>
            </Menu>

            <Button
              key="Edits"
              onClick={handleOpenEditsMenu}
              sx={{ color: '#FFFFFF', p: 0, mr: 1 }}
            >
              Edits
            </Button>
            <Menu
              sx={{ mt: 8 }}
              id="menu-appbar-edits"
              anchorEl={anchorElEdits}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              open={Boolean(anchorElEdits)}
              onClose={handleCloseEditsMenu}
            >
              <MenuItem key="Undo" onClick={handleCloseEditsMenu}>
                <Typography id="undoBtn" onClick={doUndo}>Undo</Typography>
              </MenuItem>
              <MenuItem key="Redo" onClick={handleCloseEditsMenu}>
                <Typography id="redoBtn" onClick={doRedo}>Redo</Typography>
              </MenuItem>
            </Menu>

            <Button
              key="Views"
              onClick={handleOpenViewsMenu}
              sx={{ color: '#FFFFFF', p: 0, mr: 2 }}
            >
              Views
            </Button>
            <Menu
              sx={{ mt: 8 }}
              id="menu-appbar-views"
              anchorEl={anchorElViews}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              open={Boolean(anchorElViews)}
              onClose={handleCloseViewsMenu}
            >
              <MenuItem key="Modal: About" onClick={handleCloseViewsMenu}>
                <Typography onClick={(e) => modalStore.set.isOpenModalAbout(true)}>Modal: About</Typography>
              </MenuItem>
              <MenuItem key="Modal: Model3d" onClick={handleCloseViewsMenu}>
                <Typography onClick={(e) => modalStore.set.isOpenModalModel3d(true)}>Modal: Model3d</Typography>
              </MenuItem>
              <MenuItem key="Modal: Loading" onClick={handleCloseViewsMenu}>
                <Typography onClick={(e) => modalStore.set.isOpenModalLoading(true)}>Modal: Loading</Typography>
              </MenuItem>
              <MenuItem key="Modal: Share" onClick={handleCloseViewsMenu}>
                <Typography onClick={(e) => modalStore.set.isOpenModalShare(true)}>Modal: Share</Typography>
              </MenuItem>
              <MenuItem key="Dialog: Share" onClick={handleCloseViewsMenu}>
                <Typography onClick={doOpenShareDialog}>Dialog: Share</Typography>
              </MenuItem>
              <MenuItem key="2D Plan Properties" onClick={handleCloseViewsMenu}>
                <Typography onClick={() => setPropertiesView('planView')}>2D Plan Properties</Typography>
              </MenuItem>
              <MenuItem key="2D Plan Fullscreen" onClick={handleCloseViewsMenu}>
                <Typography onClick={() => doOpenFullscreen('#planView')}>2D Plan Fullscreen</Typography>
              </MenuItem>
              <MenuItem key="3D Plan Properties" onClick={handleCloseViewsMenu}>
                <Typography onClick={() => setPropertiesView('3dView')}>3D Plan Properties</Typography>
              </MenuItem>
              <MenuItem key="3D Plan Fullscreen" onClick={handleCloseViewsMenu}>
                <Typography onClick={() => doOpenFullscreen('#view3d')}>3D Plan Fullscreen</Typography>
              </MenuItem>
              {/* <MenuItem key="Defaults" onClick={handleCloseViewsMenu}>
                <Typography onClick={() => setPropertiesView('defaults')}>Defaults</Typography>
              </MenuItem> */}
              {/* <MenuItem key="Ground Properties" onClick={handleCloseViewsMenu}>
                <Typography onClick={() => setToolMode('ground')} id="groundPropertiesBtn">Ground Properties</Typography>
              </MenuItem> */}
              <MenuItem key="Fullscreen" onClick={handleCloseViewsMenu}>
                <Typography onClick={() => doOpenFullscreen('body')} id="fullscreenApp">Fullscreen</Typography>
              </MenuItem>
            </Menu>

            <Button
              key="Layers"
              onClick={handleOpenLayersMenu}
              sx={{ color: '#FFFFFF', p: 0, mr: 2 }}
            >
              Layers
            </Button>
            <Menu
              sx={{ mt: 8 }}
              id="menu-appbar-layers"
              anchorEl={anchorElLayers}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              open={Boolean(anchorElLayers)}
              onClose={handleCloseLayersMenu}
            >
              <MenuItem key="New Noun Layer" onClick={handleCloseLayersMenu}>
                <Typography onClick={() => newLevel("noun")}>New Noun Layer</Typography>
              </MenuItem>
            </Menu>

            <Button
              key="Tools"
              onClick={handleOpenToolsMenu}
              sx={{ color: '#FFFFFF', p: 0, mr: 1 }}
            >
              Tools
            </Button>
            <Menu
              sx={{ mt: 8 }}
              id="menu-appbar-tools"
              anchorEl={anchorElTools}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              open={Boolean(anchorElTools)}
              onClose={handleCloseToolsMenu}
            >
              <MenuItem key="Tool 1" onClick={handleCloseToolsMenu}>
                <Typography onClick={() => tool1}>Tool 1</Typography>
              </MenuItem>
              <MenuItem key="Tool 2" onClick={handleCloseToolsMenu}>
                <Typography onClick={() => tool2}>Tool 2</Typography>
              </MenuItem>
              <MenuItem key="Tool 3" onClick={handleCloseToolsMenu}>
                <Typography onClick={() => tool3}>Tool 3</Typography>
              </MenuItem>
              <MenuItem key="Do Log" onClick={handleCloseToolsMenu}>
                <Typography onClick={() => doLog}>Do Log</Typography>
              </MenuItem>
              <MenuItem key="Show About" onClick={handleCloseToolsMenu}>
                <Typography onClick={() => showAbout}>Show About</Typography>
              </MenuItem>
            </Menu>

          </Box>

          <Box sx={{ flexGrow: 0, display: { xs: 'none', md: 'flex' } }}>
            {/* <Button color="inherit">-||- TOOL MODES -||-</Button> */}
            <Tooltip title="Pointer Tool">
              <IconButton
                id="pointerTool"
                onClick={() => setToolMode('pointer')}
                aria-label="Pointer Tool"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                size="medium"
                color="inherit"
                sx={{ mr: 1 }}
              >
                <ToolIconPointer />
              </IconButton>
            </Tooltip>
            <Tooltip title="Hand Tool">
              <IconButton
                id="handTool"
                onClick={() => setToolMode('hand')}
                aria-label="Hand Tool"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                size="medium"
                color="inherit"
                sx={{ mr: 1 }}
              >
                <ToolIconHand />
              </IconButton>
            </Tooltip>
            <Tooltip title="Wall Tool">
              <IconButton
                id="addWallTool"
                onClick={() => setToolMode('walls')}
                aria-label="Wall Tool"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                size="medium"
                color="inherit"
                sx={{ mr: 1 }}
              >
                <ToolIconAddWall />
              </IconButton>
            </Tooltip>
            <Tooltip title="Floor Tool">
              <IconButton
                id="addFloorTool"
                onClick={() => setToolMode('floor')}
                aria-label="Floor Tool"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                size="medium"
                color="inherit"
                sx={{ mr: 1 }}
              >
                <ToolIconAddFloor />
              </IconButton>
            </Tooltip>
            <Tooltip title="Roof Tool">
              <IconButton
                id="addRoofTool"
                onClick={() => setToolMode('roof')}
                aria-label="Roof Tool"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                size="medium"
                color="inherit"
                sx={{ mr: 1 }}
              >
                <ToolIconAddRoof />
              </IconButton>
            </Tooltip>
            <Tooltip title="Ruler Tool">
              <IconButton
                id="addRulerTool"
                onClick={() => setToolMode('dimension')}
                aria-label="Ruler Tool"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                size="medium"
                color="inherit"
                sx={{ mr: 1 }}
              >
                <ToolIconAddRuler />
              </IconButton>
            </Tooltip>
            <Tooltip title="Text Tool">
              <IconButton
                id="addTextTool"
                onClick={() => setToolMode('text')}
                aria-label="Text Tool"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                size="medium"
                color="inherit"
                sx={{ mr: 0 }}
              >
                <ToolIconAddText />
              </IconButton>
            </Tooltip>
          </Box>

        </Toolbar>
      </Container>
    </AppBar>
  )
}

const CatalogView: FunctionComponent = (): JSX.Element => {
  // console.debug("CatalogView")
  useEffect(() => {
    console.debug('CatalogView onMount')
    return () => {
      console.debug('CatalogView onUnmount')
    }
  }, [])
  return (
    <div id="catalogView">
      <div id="catalogFilters">
        <input type="text" id="catalogTextFilter" placeholder="Filter" />
      </div>
      <div id="catalogItems"></div>
    </div>
  )
}

const PropertiesView: FunctionComponent = (): JSX.Element => {
  // console.debug("PropertiesView")
  useEffect(() => {
    console.debug('PropertiesView onMount')
    return () => {
      console.debug('PropertiesView onUnmount')
    }
  }, [])
  return (
    <div id="propertiesView" style={{ paddingLeft: "10px" }}>
      <div id="furniture3DModelPropertiesView" style={{ display: "none" }}>
        <h3>3d Model Properties</h3>
        <table className="propertiesTable" style={{ minWidth: "290px" }}>
          <tr>
            <td colSpan="2" style={{ textAlign: "center" }}>
              <div
                onMouseDown="beginDrag(event, modalModel3dFurnitureId);"
                className="disableSelection">
                <img
                  id="model3dLargeThumb"
                  className="disableSelection"
                  style={{ pointerEvents: "none" }} />
              </div>
            </td>
          </tr>
          <tr>
            <td width="70">Name</td>
            <td><span id="model3dName"></span></td>
          </tr>
          <tr>
            <td>Author</td>
            <td><span id="model3dAuthor"></span></td>
          </tr>
          <tr>
            <td>License</td>
            <td><span id="model3dLicense"></span></td>
          </tr>
          <tr>
            <td>3D Model</td>
            <td>
              <Button className="moreInfoBtn" onClick={() => showModel3dView}>
                View
              </Button>
            </td>
          </tr>
        </table>
      </div>
      <div id="furniturePropertiesView" style={{ display: "none" }}>
        <h3>Furniture Properties</h3>
        <table className="propertiesTable" style={{ minWidth: "290px" }}>
          <tr>
            <td width="70">Id</td>
            <td><span id="objectId"></span></td>
          </tr>
          <tr>
            <td>Name</td>
            <td><span id="objectName"></span></td>
          </tr>
          <tr>
            <td>X</td>
            <td>
              <input
                type="text"
                id="furnitureXProp"
                style={{
                  width: "80px",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace"
                }}
                className="editable"
                onChange="validatePlusOrMinusNumber(this, updateFurniturePosX);"
                maxLength="8" />
              cm
            </td>
          </tr>
          <tr>
            <td>Z</td>
            <td>
              <input
                type="text"
                id="furnitureZProp"
                style={{
                  width: "80px",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace"
                }}
                className="editable"
                onChange="validatePlusOrMinusNumber(this, updateFurniturePosZ);"
                maxLength="8" />
              cm
            </td>
          </tr>
          <tr>
            <td>Y</td>
            <td>
              <input
                type="text"
                id="furnitureYProp"
                style={{
                  width: "80px",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace"
                }}
                className="editable"
                onChange="validatePlusOrMinusNumber(this, updateFurniturePosY);"
                maxLength="8" />
              cm
            </td>
          </tr>
          <tr>
            <td>Width</td>
            <td>
              <input
                type="text"
                id="furnitureWidthProp"
                style={{
                  width: "80px",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace"
                }}
                className="editable"
                onChange="validatePlusNumber(this, updateFurnitureWidth);"
                maxLength="8" />
              cm
              <input
                type="checkbox"
                id="flipX"
                onChange="flipX(this.checked)" />Flip X
            </td>
          </tr>
          <tr>
            <td>Depth</td>
            <td>
              <input
                type="text"
                id="furnitureDepthProp"
                style={{
                  width: "80px",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace"
                }}
                className="editable"
                onChange="validatePlusNumber(this, updateFurnitureDepth);"
                maxLength="8" />
              cm
              <input
                type="checkbox"
                id="flipZ"
                onChange="flipZ(this.checked)" />Flip Z
            </td>
          </tr>
          <tr>
            <td>Height</td>
            <td>
              <input
                type="text"
                id="furnitureHeightProp"
                style={{
                  width: "80px",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace"
                }}
                className="editable"
                onChange="validatePlusOrMinusNumber(this, updateFurnitureHeight);"
                maxLength="8" />
              cm
            </td>
          </tr>
          <tr>
            <td>Angle</td>
            <td><span id="furnitureAngleProp"></span>°</td>
          </tr>
          <tr>
            <td>Level</td>
            <td><span id="furnitureLevelProp"></span></td>
          </tr>
          <tr>
            <td>3D Model</td>
            <td>
              <Button className="moreInfoBtn" onClick="showModel3dView();">
                View
              </Button>
            </td>
          </tr>
        </table>
      </div>
      <div id="defaultsPropertiesView" style={{ display: "none" }}>
        <h3>Default Settings</h3>
        <table className="propertiesTable" style={{ minWidth: "290px" }}>
          <tr>
            <td>Compass Heading</td>
            <td>
              <input
                type="range"
                id="compassHdg"
                name="compassHdg"
                min="0"
                max="360"
                step="1"
                value="0"
                onInput="rotateCompass(this.value)"
                onChange="rotateCompass(this.value)" />
              <span id="compassHdgLbl">0°</span>
            </td>
          </tr>
        </table>
      </div>
      <div id="wallDefaultsPropertiesView" style={{ display: "none" }}>
        <h3>Default Wall Settings</h3>
        <table className="propertiesTable" style={{ minWidth: "290px" }}>
          <tr>
            <td width="70">Wall Height</td>
            <td>
              <input
                type="text"
                id="defaultWallHeightProp"
                style={{
                  width: "80px",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace"
                }}
                className="editable"
                onChange="validatePlusNumber(this, updateDefaultWallHeight);"
                maxLength="8" />
              cm
            </td>
          </tr>
          <tr>
            <td>Wall Thickness</td>
            <td>
              <input
                type="text"
                id="defaultWallThicknessProp"
                style={{
                  width: "80px",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace"
                }}
                className="editable"
                onChange="validatePlusNumber(this, updateDefaultWallThickness);"
                maxLength="8" />
              cm
            </td>
          </tr>
        </table>
      </div>
      <div id="floorDefaultsPropertiesView" style={{ display: "none" }}>
        <h3>Default Floor Settings</h3>
        <table className="propertiesTable" style={{ minWidth: "290px" }}>
          <tr>
            <td>Floor Thickness</td>
            <td>
              <input
                type="text"
                id="defaultFloorThicknessProp"
                style={{
                  width: "80px",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace"
                }}
                className="editable"
                onChange="validatePlusNumber(this, updateDefaultFloorThickness);"
                maxLength="8" />
              cm
            </td>
          </tr>
        </table>
      </div>
      <div id="roofDefaultsPropertiesView" style={{ display: "none" }}>
        <h3>Default Roof Settings</h3>
        <table className="propertiesTable" style={{ minWidth: "290px" }}>
          <tr>
            <td>Roof Thickness</td>
            <td>
              <input
                type="text"
                id="defaultRoofThicknessProp"
                style={{
                  width: "80px",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace"
                }}
                className="editable"
                onChange="validatePlusNumber(this, updateDefaultRoofThickness);"
                maxLength="8" />
              cm
            </td>
          </tr>
          <tr>
            <td>Rise</td>
            <td>
              <input
                type="text"
                id="defaultRoofRiseProp"
                style={{
                  width: "80px",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace"
                }}
                className="editable"
                onChange="validatePlusNumber(this, updateDefaultRoofRise);"
                maxLength="8" />
              cm
            </td>
          </tr>
          <tr>
            <td>Base Offset</td>
            <td>
              <input
                type="text"
                id="defaultRoofStartHeightProp"
                style={{
                  width: "80px",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace"
                }}
                className="editable"
                onChange="validatePlusOrMinusNumber(this, updateDefaultRoofStartHeight);"
                maxLength="8" />
              cm
            </td>
          </tr>
          <tr>
            <td>Run</td>
            <td>
              <input
                type="text"
                id="defaultRoofWidthProp"
                style={{
                  width: "80px",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace"
                }}
                className="editable"
                onChange="validatePlusNumber(this, updateDefaultRoofWidth);"
                maxLength="8" />
              cm
            </td>
          </tr>
          <tr>
            <td>Rafter Length</td>
            <td><span id="defaultRafterLengthProp"></span> cm</td>
          </tr>
          <tr>
            <td>Roof Pitch</td>
            <td><span id="defaultRoofPitchProp"></span>°</td>
          </tr>
        </table>
      </div>
      <div id="dimensionDefaultsPropertiesView" style={{ display: "none" }}>
        <h3>Default Dimension Settings</h3>
      </div>
      <div id="textDefaultsPropertiesView" style={{ display: "none" }}>
        <h3>Default Text Settings</h3>
      </div>

      <div id="planViewPropertiesView" style={{ display: "none" }}>
        <h3>Background Template</h3>
        <table className="propertiesTable" style={{ minWidth: "290px" }}>
          <tr>
            <td width="70">File</td>
            <td>
              <input
                type="file"
                id="backgroundImageFile"
                name="backgroundImageFile"
                onChange="loadBackgroundImage(event)" />
            </td>
          </tr>
          <tr>
            <td>Opacity</td>
            <td>
              <input
                type="range"
                id="bgTemplateOpacity"
                name="bgTemplateOpacity"
                min="0"
                max="1.0"
                step=".01"
                value="0.33"
                onInput="setBgTemplateOpacity(this.value)"
                onChange="setBgTemplateOpacity(this.value)" />
            </td>
          </tr>
          <tr>
            <td>Flip Horizontal</td>
            <td>
              <input
                type="checkbox"
                id="bgTplFlipX"
                onChange="flipBackgroundTemplateX(this.checked)" />
            </td>
          </tr>
          <tr>
            <td>Flip Vertical</td>
            <td>
              <input
                type="checkbox"
                id="bgTplFlipZ"
                onChange="flipBackgroundTemplateZ(this.checked)" />
            </td>
          </tr>
          <tr>
            <td width="60"></td>
            <td>
              <Button
                id="resizeBackgroundImageBtn"
                onClick="enableResizeBackgroundTemplate();"
                className="moreInfoBtn">
                Resize
              </Button>
            </td>
          </tr>
          <tr>
            <td width="60"></td>
            <td>
              <Button
                id="deleteBackgroundImageBtn"
                onClick="deleteBackgroundImage()"
                className="moreInfoBtn">
                Delete
              </Button>
            </td>
          </tr>
        </table>
      </div>
      <div id="3dViewPropertiesView" style={{ display: "none" }}>
        <h3>3d View Properties</h3>
        <table className="propertiesTable" style={{ minWidth: "290px" }}>
          <tr>
            <td width="70">Wall Color</td>
            <td>
              <input
                type="hidden"
                id="wallDiffuse"
                value="rgba(255,255,255,0.5)" />
            </td>
          </tr>
          <tr>
            <td width="70">Wall Specular</td>
            <td>
              <input type="hidden" id="wallSpecular" value="#00ff00" />
            </td>
          </tr>
          <tr>
            <td width="70">Wall Emissive</td>
            <td>
              <input type="hidden" id="wallEmissive" value="#ffffff" />
            </td>
          </tr>
          <tr>
            <td width="70">Floor Color</td>
            <td>
              <input
                type="hidden"
                id="floorDiffuse"
                value="rgba(15,15,15,0.5)" />
            </td>
          </tr>
          <tr>
            <td width="70">Floor Specular</td>
            <td>
              <input type="hidden" id="floorSpecular" value="#00ffff" />
            </td>
          </tr>
          <tr>
            <td width="70">Roof Color</td>
            <td>
              <input
                type="hidden"
                id="roofDiffuse"
                value="rgba(255,255,255,0.5)" />
            </td>
          </tr>
          <tr>
            <td width="70">Roof Specular</td>
            <td>
              <input type="hidden" id="roofSpecular" value="#ff0000" />
            </td>
          </tr>
          <tr>
            <td>Ground Color</td>
            <td>
              <input
                type="hidden"
                id="groundDiffuse"
                value="rgba(03,141,221,1.0)" />
            </td>
          </tr>
          <tr>
            <td>Ground Specular</td>
            <td>
              <input type="hidden" id="groundSpecular" value="#f2ff9c" />
            </td>
          </tr>
          <tr>
            <td width="70">Depth Write</td>
            <td>
              <input
                type="checkbox"
                id="depthWriteMode"
                onChange="setDepthWriteMode(this.checked);" />
            </td>
          </tr>
          <tr>
            <td width="70">Sort Objects</td>
            <td>
              <input
                type="checkbox"
                id="sortObjectsMode"
                onChange="setSortObjectsMode(this.checked);" />
            </td>
          </tr>
          <tr>
            <td>Sun Azimuth</td>
            <td>
              <input
                type="range"
                id="sunAzimuth"
                name="sunAzimuth"
                min="0"
                max="1.0"
                step=".01"
                value="0.33"
                onInput="setSunAzimuth(this.value)"
                onChange="setSunAzimuth(this.value)" />
            </td>
          </tr>
          <tr>
            <td>Sun Incline</td>
            <td>
              <input
                type="range"
                id="sunIncline"
                name="sunIncline"
                min="0"
                max="1.0"
                step=".01"
                value="0.0"
                onInput="setSunIncline(this.value)"
                onChange="setSunIncline(this.value)" />
            </td>
          </tr>
          <tr>
            <td>Ambient Intensity</td>
            <td>
              <input
                type="range"
                id="ambientLightBrightness"
                name="ambientLightBrightness"
                min="0.0"
                max="1.0"
                step="0.1"
                onInput="adjustAmbientLightBrightness(this.value)"
                onChange="adjustAmbientLightBrightness(this.value)" />
            </td>
          </tr>
          <tr>
            <td>Directional Intensity</td>
            <td>
              <input
                type="range"
                id="dirLightBrightness"
                name="dirLightBrightness"
                min="0.0"
                max="1.0"
                step="0.1"
                onInput="adjustDirLightBrightness(this.value)"
                onChange="adjustDirLightBrightness(this.value)" />
            </td>
          </tr>
          <tr>
            <td>Hemisphere Intensity</td>
            <td>
              <input
                type="range"
                id="hemiLightBrightness"
                name="hemiLightBrightness"
                min="0.0"
                max="1.0"
                step="0.1"
                onInput="adjustHemiLightBrightness(this.value)"
                onChange="adjustHemiLightBrightness(this.value)" />
            </td>
          </tr>
        </table>
      </div>
      <div id="wallPropertiesView" style={{ display: "none" }}>
        <h3>Wall Properties</h3>
        <table className="propertiesTable" style={{ minWidth: "290px" }}>
          <tr>
            <td width="70">Id</td>
            <td>
              <input type="hidden" id="wallIdHidden" />
              <span id="wallIdProp"></span>
            </td>
          </tr>
          <tr>
            <td>Height</td>
            <td>
              <input
                type="text"
                id="wallHeightProp"
                style={{
                  width: "80px",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace"
                }}
                className="editable"
                onChange="validatePlusNumber(this, updateWallHeight);"
                maxLength="8" />
              cm
            </td>
          </tr>
          <tr>
            <td>Height Start</td>
            <td>
              <input
                type="text"
                id="wallHeight0Prop"
                style={{
                  width: "80px",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace"
                }}
                className="editable"
                onChange="validatePlusNumber(this, updateWallHeight0);"
                maxLength="8" />
              cm
            </td>
          </tr>
          <tr>
            <td>Height End</td>
            <td>
              <input
                type="text"
                id="wallHeight1Prop"
                style={{
                  width: "80px",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace"
                }}
                className="editable"
                onChange="validatePlusNumber(this, updateWallHeight1);"
                maxLength="8" />
              cm
            </td>
          </tr>
          <tr>
            <td>Thickness</td>
            <td>
              <input
                type="text"
                id="wallThicknessProp"
                style={{
                  width: "80px",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace"
                }}
                className="editable"
                onChange="validatePlusNumber(this, updateWallThickness);"
                maxLength="8" />
              cm
            </td>
          </tr>
          <tr>
            <td>Level</td>
            <td><span id="wallLevelProp"></span></td>
          </tr>
        </table>
      </div>
      <div id="roofPropertiesView" style={{ display: "none" }}>
        <h3>Roof Properties</h3>
        <table className="propertiesTable" style={{ minWidth: "290px" }}>
          <tr>
            <td width="70">Id</td>
            <td>
              <input type="hidden" id="roofIdHidden" />
              <span id="roofIdProp"></span>
            </td>
          </tr>
          <tr>
            <td>Thickness</td>
            <td>
              <input
                type="text"
                id="roofThicknessProp"
                style={{
                  width: "80px",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace"
                }}
                className="editable"
                onChange="validatePlusNumber(this, updateRoofThickness);"
                maxLength="8" />
              cm
            </td>
          </tr>
          <tr>
            <td>Rise</td>
            <td>
              <input
                type="text"
                id="roofRiseProp"
                style={{
                  width: "80px",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace"
                }}
                className="editable"
                onChange="validatePlusNumber(this, updateRoofRise);"
                maxLength="8" />
              cm
            </td>
          </tr>
          <tr>
            <td>Base Offset</td>
            <td>
              <input
                type="text"
                id="roofStartHeightProp"
                style={{
                  width: "80px",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace"
                }}
                className="editable"
                onChange="validatePlusOrMinusNumber(this, updateRoofStartHeight);"
                maxLength="8" />
              cm
            </td>
          </tr>
          <tr>
            <td>Run</td>
            <td>
              <input
                type="text"
                id="roofWidthProp"
                style={{
                  width: "80px",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace"
                }}
                className="editable"
                onChange="validatePlusNumber(this, updateRoofWidth);"
                maxLength="8" />
              cm
            </td>
          </tr>
          <tr>
            <td>Rafter Length</td>
            <td><span id="rafterLengthProp"></span> cm</td>
          </tr>
          <tr>
            <td>Roof Pitch</td>
            <td><span id="roofPitchProp"></span>°</td>
          </tr>
          <tr>
            <td>Level</td>
            <td><span id="roofLevelProp"></span></td>
          </tr>
        </table>
      </div>
      <div id="floorPropertiesView" style={{ display: "none" }}>
        <h3>Floor Properties</h3>
        <table className="propertiesTable" style={{ minWidth: "290px" }}>
          <tr>
            <td width="70">Id</td>
            <td><span id="floorIdProp"></span></td>
          </tr>
          <tr>
            <td>Area</td>
            <td><span id="floorAreaProp"></span></td>
          </tr>
          <tr>
            <td>Thickness</td>
            <td><span id="floorThicknessProp"></span></td>
          </tr>
          <tr>
            <td>Level</td>
            <td><span id="floorLevelProp"></span></td>
          </tr>
        </table>
      </div>
      <div id="dimensionPropertiesView" style={{ display: "none" }}>
        <h3>Dimension Properties</h3>
        <table className="propertiesTable" style={{ minWidth: "290px" }}>
          <tr>
            <td width="70">Id</td>
            <td><span id="dimensionIdProp"></span></td>
          </tr>
          <tr>
            <td>Length</td>
            <td><span id="dimensionLengthProp"></span></td>
          </tr>
          <tr>
            <td>Adjacent</td>
            <td><span id="dimensionAdjacentProp"></span></td>
          </tr>
          <tr>
            <td>Level</td>
            <td><span id="dimensionLevelProp"></span></td>
          </tr>
        </table>
      </div>
      <div id="textPropertiesView" style={{ display: "none" }}>
        <h3>Text Annotation Properties</h3>
        <table className="propertiesTable" style={{ minWidth: "290px" }}>
          <tr>
            <td width="70">Id</td>
            <td><span id="textIdProp"></span></td>
          </tr>
          <tr>
            <td>Text</td>
            <td>
              <input
                type="text"
                id="textValueProp"
                style={{
                  width: "80px",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace"
                }}
                className="editable"
                onKeyUp="validateText(event, this, updateTextValue);"
                maxLength="100" />
            </td>
          </tr>
          <tr>
            <td>X</td>
            <td>
              <input
                type="text"
                id="textXProp"
                style={{
                  width: "80px",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace"
                }}
                className="editable"
                onChange="validatePlusOrMinusNumber(this, updateTextX);"
                maxLength="8" />
            </td>
          </tr>
          <tr>
            <td>Y</td>
            <td>
              <input
                type="text"
                id="textYProp"
                style={{
                  width: "80px",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace"
                }}
                className="editable"
                onChange="validatePlusOrMinusNumber(this, updateTextY);"
                maxLength="8" />
            </td>
          </tr>
          <tr>
            <td>Level</td>
            <td><span id="textLevelProp"></span></td>
          </tr>
        </table>
        <div>Type<span id="textDataTypeProp"></span></div>
        <div><Button id="deleteTextAnnotationBtn" onClick="deleteTextBtnClick()">Delete</Button></div>
      </div>
      <div id="levelPropertiesView" style={{ display: "none" }}>
        <h3>Level Properties</h3>
        <table className="propertiesTable" style={{ minWidth: "290px" }}>
          <tr>
            <td width="70">Id</td>
            <td><span id="levelIdProp"></span></td>
          </tr>
          <tr>
            <td>Name</td>
            <td><span id="levelNameProp"></span></td>
          </tr>
          <tr>
            <td>Height</td>
            <td>
              <input
                type="text"
                id="levelHeightProp"
                style={{
                  width: "80px",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace"
                }}
                className="editable"
                onChange="validatePlusOrMinusNumber(this, updateLevelHeight);"
                maxLength="8" />
            </td>
          </tr>
        </table>
      </div>
      <div id="groundPropertiesView" style={{ display: "none" }}>
        <h3>Ground Layer Properties</h3>
        <table className="propertiesTable" style={{ minWidth: "290px" }}>
          <tr>
            <td>Width</td>
            <td>
              <input
                type="text"
                id="groundWidthProp"
                style={{
                  width: "80px",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace"
                }}
                className="editable"
                onChange="validatePlusNumber(this, updateGroundWidth);"
                maxLength="8" />
              cm
            </td>
          </tr>
          <tr>
            <td>Legth</td>
            <td>
              <input
                type="text"
                id="groundLengthProp"
                style={{
                  width: "80px",
                  border: "1px solid #2a2a2a",
                  fontSize: "14px",
                  color: "white",
                  fontFamily: "'Courier New', Courier, monospace"
                }}
                className="editable"
                onChange="validatePlusNumber(this, updateGroundLength);"
                maxLength="8" />
              cm
            </td>
          </tr>
        </table>
      </div>
    </div>
  )
}

const PlanView: FunctionComponent = (): JSX.Element => {
  // console.debug("PlanView")
  useEffect(() => {
    console.debug('PlanView onMount')
    return () => {
      console.debug('PlanView onUnmount')
    }
  }, [])
  return (
    <div id="planView">
      <canvas id="planCanvas" width="1024" height="450"></canvas>
      <div id="overlayLogoPlanView" className="overlayLogo">
        <a
          href="https://threedgarden.com"
          style={{ float: "left", padding: "0px", marginTop: "0px" }}>
          <img
            src="/favicon/favicon.png"
            height="77px"
            title="ThreeDGarden"
            alt="ThreeDGarden" />
        </a>
        <a
          href="https://threedgarden.com"
          style={{ paddingLeft: "10px", textDecoration: "none", fontSize: "32px" }}
        >ThreeDGarden</a>
      </div>
      <div id="overlayMenuPlanView">
        <Button
          id="overlayPlanViewRecenterBtn"
          onClick="recenterPlanView()"
          className="smallButton">
          Recenter
        </Button>
        <Button
          id="overlayPlanViewGoto3dViewBtn"
          onClick="goto3dView()"
          className="smallButton">
          3d View
        </Button>
      </div>
    </div>
  )
}

const TheBottom: FunctionComponent = (): JSX.Element => {

  const word = `[MM] @ ${new Date().toISOString()}`

  // console.debug("MyComponent")
  useEffect(() => {
    console.debug('MyComponent onMount')
    return () => {
      console.debug('MyComponent onUnmount')
    }
  }, [])

  return (
    <Box>
      <canvas
        id="rulerLeft"
        width="30"
        height="500"
        onMouseDown="addVerticalGuide();"
        onMouseUp="removeVerticalGuide()"
      />
      <canvas
        id="rulerBottom"
        width="1024"
        height="20"
        onMouseDown="addHorizontalGuide();"
        onMouseUp="removeHorizontalGuide()"
      />

      <div id="mouseIndicatorY" />
      <div id="mouseIndicatorX" />

      <div id="compass" />

      <div id="view3d">

        <canvas id="threeCanvas" />

        <div id="overlayLogo3dView" className="overlayLogo">
          HEY HEY HEY
        </div>

        <div id="overlayMenu3dView">
          <Button
            id="overlay3dviewRecenterBtn"
            onClick="recenter3dview()"
            className="smallButton">
            Recenter
          </Button>
          <Button
            id="overlay3dviewGotoPlanViewBtn"
            onClick="gotoPlanView()"
            className="smallButton">
            Plan View
          </Button>
        </div>
      </div>

      <div id="verticalSlider" />
      <div id="horizontalSliderLeft" />
      <div id="horizontalSliderRight" />

      <div id="furnitureDragDiv" />

      <Image
        id="fullscreenPlanViewBtn"
        src="/demo/media/fullscreen.png"
        width={24}
        height={24}
        alt="fullscreenPlanViewBtn"
        onClick="doOpenFullscreen('planView');"
      />
      <Image
        id="fullscreen3dViewBtn"
        src="/demo/media/fullscreen.png"
        width={24}
        height={24}
        alt="fullscreen3dViewBtn"
        onClick="doOpenFullscreen('view3d');"
      />

      <progress value="50" max="100" className="center" id="progressBar" />

    </Box>
  )
}

const ReactThreeFiberView = (): JSX.Element => {

  const word = `[MM] @ ${new Date().toISOString()}`

  // console.debug("ReactThreeFiberView")
  // useEffect(() => {
  //   console.debug('ReactThreeFiberView onMount')
  //   return () => {
  //     console.debug('ReactThreeFiberView onUnmount')
  //   }
  // }, [])

  return (
    <Box id="rtf-canvas-container" style={{ width: "100%", minHeight: "20rem" }}>
      <Canvas>
        <mesh>
          <boxBufferGeometry />
          <meshBasicMaterial />
        </mesh>
      </Canvas>
    </Box>
  )
}

const MyComponent: FunctionComponent = (): JSX.Element => {

  const word = `[MM] @ ${new Date().toISOString()}`

  // console.debug("MyComponent")
  useEffect(() => {
    console.debug('MyComponent onMount')
    return () => {
      console.debug('MyComponent onUnmount')
    }
  }, [])

  return (
    <div>...MyComponent [returns] JSX here...</div>
  )
}

const ThreeDGarden: FunctionComponent = (): JSX.Element => {

  // ==========================================================
  // LOCAL VARS

  const word = `[MM] @ ${new Date().toISOString()}`
  // const title = useRef()
  // const root = useRef()
  // const scene = new THREE.Scene()

  // ==========================================================
  // Component onMount hook
  useEffect(() => {
    // console.debug("ThreeDGarden onMount", word)

    // begin here ?? yes
    // bootManager()...

    // ==========================================================
    // LOAD HISTORIES FROM DISK

    // // PROJECT HISTORY
    const projectHistoryFromDisk = useProjectStore.getState().loadFromDisk()
    // console.debug("projectHistoryFromDisk", projectHistoryFromDisk)
    // console.debug("projectHistoryFromDisk.payload", projectHistoryFromDisk?.payload)
    const savedProject = projectHistoryFromDisk?.payload ? projectHistoryFromDisk.payload : []
    // console.debug("savedProject", savedProject)
    if (savedProject.length) {
      projectHistory.unshift(...savedProject) // unshift to beginning of array[0]
    }
    // console.debug("projectHistory", projectHistory)

    // // PLAN HISTORY
    const planHistoryFromDisk = usePlanStore.getState().loadFromDisk()
    // console.debug("planHistoryFromDisk", planHistoryFromDisk)
    // console.debug("planHistoryFromDisk.payload", planHistoryFromDisk?.payload)
    const savedPlan = planHistoryFromDisk?.payload ? planHistoryFromDisk.payload : []
    // console.debug("savedPlan", savedPlan)
    if (savedPlan.length) {
      planHistory.unshift(...savedPlan) // unshift to beginning of array[0]
    }
    // console.debug("planHistory", planHistory)

    return () => {
      // console.debug('ThreeDGarden onUnmount', word)
    }
  }, [])

  // ==========================================================
  // FC returns JSX
  return (
    <div id="threedgarden-div" style={{ width: "100%" }}>
      {/* <div ref={title}>ThreeDGarden: {word}</div> */}
      {/* <div ref={root}>Three root</div> */}

      {/* jQuery Three Happy Messy */}
      <div id="DEMO">
        <ToolBar />

        {/* zustand */}
        <div id="zustandControlPanel" style={{ padding: "1rem" }}>

          {/* React Three Fiber - View */}
          <ReactThreeFiberView />
          <hr />
          <ThreeDInfoPanel />
          {/* <ThreeDControlPanel /> */}
          <hr />
          <ProjectInfoPanel />
          {/* <ProjectControlPanel /> */}
          <hr />
          <PlanInfoPanel />
          {/* <PlanControlPanel /> */}
          <hr />
          <FileInfoPanel />
          {/* <FileControlPanel /> */}
          <hr />
          {/* <CharacterInfoPanel /> */}
          {/* <CharacterControlPanel /> */}
          {/* <hr /> */}
          {/* <BearInfoPanel /> */}
          {/* <BearControlPanel /> */}
          {/* <hr /> */}
          {/* <GardenerInfoPanel /> */}
          {/* <GardenerControlPanel /> */}
          {/* <hr /> */}
          {/* <ChickenInfoPanel /> */}
          {/* <ChickenControlPanel /> */}
          {/* <hr /> */}
          {/* <AllotmentInfoPanel /> */}
          {/* <AllotmentControlPanel /> */}
          {/* <hr /> */}
          {/* <BedInfoPanel /> */}
          {/* <BedControlPanel /> */}
          {/* <hr /> */}
          {/* <FurnitureInfoPanel /> */}
          {/* <FurnitureControlPanel /> */}
          {/* <hr /> */}
          {/* <PlantInfoPanel /> */}
          {/* <PlantControlPanel /> */}
          {/* <hr /> */}
          {/* <PlantingPlanInfoPanel /> */}
          {/* <PlantingPlanControlPanel /> */}
          {/* <hr /> */}
        </div>

        <AboutModal />
        <Model3dModal />
        <LoadingModal />
        <ShareModal />

        {/* <CatalogView /> */}
        {/* <PropertiesView /> */}
        {/* <PlanView /> */}
        {/* <TheBottom /> */}
      </div>
    </div >
  )
}

export default ThreeDGarden
