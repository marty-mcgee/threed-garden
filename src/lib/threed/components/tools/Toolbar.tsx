// @ts-nocheck /* OR @ ts-ignore OR @ ts-expect-error */
// 'use client'
// ==============================================================
// RESOURCES

// ** REACT Imports
import {
  useEffect,
  // useRef,
  useState,
  // useCallback,
  // ReactNode,
  FC,
  Suspense,
  PointerEventHandler,
  SyntheticEvent,
} from 'react'

// ** NEXT Imports
import Image from 'next/image'

// ** MUI Imports
import { styled } from '@mui/material/styles'
// mui: ui
import MuiAppBar from '@mui/material/AppBar'
import MuiToolbar from '@mui/material/Toolbar'
import Box from '@mui/material/Box'
import MuiButton from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

// ** ICON Imports
// Tool Mode Icons
import ToolIconPointer from '@mui/icons-material/TouchApp'
import ToolIconHand from '@mui/icons-material/PanTool'
import ToolIconAddWall from '@mui/icons-material/HouseSiding'
import ToolIconAddFloor from '@mui/icons-material/ViewModule'
import ToolIconAddRoof from '@mui/icons-material/Roofing'
import ToolIconAddRuler from '@mui/icons-material/Straighten'
import ToolIconAddText from '@mui/icons-material/TextFields'

// ** HELPER Components
import Spinner from '#/layout/ui/components/spinner'
// ** HELPFUL UTIL: DELETE OBJECT KEYS: RESET OBJECT TO {}
import clearObject from '#/lib/utils/clear-object'
// ** HELPFUL UTIL: COLORFUL CONSOLE MESSAGES (ccm)
import ccm from '#/lib/utils/console-colors'

// ==========================================================
// IMPORTS COMPLETE
// ==========================================================

// DEBUG PREFERENCES FOR THIS MODULE
const debug: boolean = true
const DEBUG: boolean = true
const debug_deep: boolean = false

// ==========================================================

const AppBar = styled(MuiAppBar)(({ theme }) => ({
  position: 'static',
  // transition: 'none',
  // alignItems: 'center',
  // justifyContent: 'center',
  padding: theme.spacing(0, 0),
  backgroundColor: 'transparent',
  color: theme.palette.text.primary,
  minHeight: `32px !important`,
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
  minHeight: `32px !important`,
  // transition: 'padding .25s ease-in-out, box-shadow .25s ease-in-out, backdrop-filter .25s ease-in-out'
}))

const Button = styled(MuiButton)(({ theme }) => ({
  marginRight: `0.25rem !important`,
  padding: `0.5rem 0.5rem !important`,
  minWidth: `2.0rem !important`,
}))

// ** Main ThreeDToolbar
const ThreeDToolbar: FC = ({data}): JSX.Element => {
  // **
  // console.debug("ThreeDToolbar props.data", data)

  const word = `[MM] ThreeDToolbar @ ${new Date().toISOString()}`
  // console.debug("ThreeDToolbar", word)

  // const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null)
  const [anchorElActions, setAnchorElActions] = useState<null | HTMLElement>(null)
  const [anchorElFiles, setAnchorElFiles] = useState<null | HTMLElement>(null)
  const [anchorElEdits, setAnchorElEdits] = useState<null | HTMLElement>(null)
  const [anchorElViews, setAnchorElViews] = useState<null | HTMLElement>(null)
  const [anchorElLayers, setAnchorElLayers] = useState<null | HTMLElement>(null)
  const [anchorElTools, setAnchorElTools] = useState<null | HTMLElement>(null)

  // const handleOpenNavMenu = (event: PointerEvent<HTMLElement>) => {
  //   setAnchorElNav(event.currentTarget)
  // }
  // const handleCloseNavMenu = () => {
  //   setAnchorElNav(null)
  // }
  const handleOpenActionsMenu = (event: PointerEvent<HTMLElement>) => {
    setAnchorElActions(event.currentTarget)
  }
  const handleCloseActionsMenu = () => {
    setAnchorElActions(null)
  }
  const handleOpenFilesMenu = (event: PointerEvent<HTMLElement>) => {
    setAnchorElFiles(event.currentTarget)
  }
  const handleCloseFilesMenu = () => {
    setAnchorElFiles(null)
  }
  const handleOpenEditsMenu = (event: PointerEvent<HTMLElement>) => {
    setAnchorElEdits(event.currentTarget)
  }
  const handleCloseEditsMenu = () => {
    setAnchorElEdits(null)
  }
  const handleOpenViewsMenu = (event: PointerEvent<HTMLElement>) => {
    setAnchorElViews(event.currentTarget)
  }
  const handleCloseViewsMenu = () => {
    setAnchorElViews(null)
  }
  const handleOpenLayersMenu = (event: PointerEvent<HTMLElement>) => {
    setAnchorElLayers(event.currentTarget)
  }
  const handleCloseLayersMenu = () => {
    setAnchorElLayers(null)
  }
  const handleOpenToolsMenu = (event: PointerEvent<HTMLElement>) => {
    setAnchorElTools(event.currentTarget)
  }
  const handleCloseToolsMenu = () => {
    setAnchorElTools(null)
  }

  // =======================================================
  // FUNCTIONAL ACTIONS (FUNCTIONS ON FUNCTIONAL NOUNS)
  // =======================================================
  // doThings

  // OLD
  const resetPlan: any = (): any => {
    // alert("[MM] resetPlan")
    try {
      const resetPlan = { _ts: new Date().toISOString() }

      // save to disk
      localStorage.setItem('threed_resetPlan', JSON.stringify({ subject: 'plan:reset', payload: resetPlan }))

      // console.debug("[MM] TRY: resetPlan")
    } catch (e) {
      console.debug('[MM] CATCH: resetPlan', e)
    }

    try {
      Object.keys(Texts).forEach(function (e) {
        let t = Texts[e]
        'object' === typeof t && deleteTextByKey(e)
      }),
        (textIdCounter = 0)
    } catch (e) {
      console.debug('resetPlan : 1 : ' + e)
    }
    try {
      Object.keys(Dimensions).forEach(function (e) {
        let t = Dimensions[e]
        'object' === typeof t && deleteDimensionByKey(e)
      }),
        (dimensionIdCounter = 0)
    } catch (e) {
      console.debug('resetPlan : 2 : ' + e)
    }
    try {
      Object.keys(Furniture).forEach(function (e) {
        let t = Furniture[e]
        'object' === typeof t &&
          (Furniture[e].data.toolsRectangleInner && Furniture[e].data.toolsRectangleInner.remove(),
          Furniture[e].remove(),
          delete Furniture[e])
      })
    } catch (e) {
      console.debug('resetPlan : 3 : ' + e)
    }
    try {
      Object.keys(Floors).forEach(function (e) {
        let t = Floors[e]
        'object' === typeof t && (Floors[e].remove(), delete Floors[e])
      }),
        Object.keys(Floors3d).forEach(function (e) {
          let t = Floors3d[e]
          'object' === typeof t && (scene.remove(Floors3d[e]), delete Floors3d[e])
        }),
        (floorIdCounter = 0)
    } catch (e) {
      console.debug('resetPlan : 4 : ' + e)
    }
    try {
      Object.keys(Walls).forEach(function (e) {
        let t = Walls[e]
        'object' === typeof t && (Walls[e].remove(), delete Walls[e])
      })
      for (let e in wallsRectangles) wallsRectangles[e].remove()
    } catch (e) {
      console.debug('resetPlan : 5 : ' + e)
    }
    try {
      Object.keys(wallsRectangles3d).forEach(function (e) {
        let t = wallsRectangles3d[e]
        'object' === typeof t && scene.remove(wallsRectangles3d[e])
      })
    } catch (e) {
      console.debug('resetPlan : 6 : ' + e)
    }
    try {
      Object.keys(Roofs).forEach(function (e) {
        'object' === typeof Roofs[e] && (Roofs[e].remove(), delete Roofs[e])
      })
      for (let t in roofsRectangles) roofsRectangles[t].remove()
    } catch (e) {
      console.debug('resetPlan : 5.1 : ' + e)
    }
    try {
      Object.keys(roofsRectangles3d).forEach(function (e) {
        'object' === typeof roofsRectangles3d[e] && scene.remove(roofsRectangles3d[e])
      })
    } catch (e) {
      console.debug('resetPlan : 6.1 : ' + e)
    }
    try {
      Object.keys(maskObjectsApplied).forEach(function (e) {
        'object' === typeof maskObjectsApplied[e] && scene.remove(maskObjectsApplied[e])
      })
    } catch (e) {
      console.debug('resetPlan : 6.5 : ' + e)
    }
    try {
      Object.keys(maskObjectsAppliedRoof).forEach(function (e) {
        'object' === typeof maskObjectsAppliedRoof[e] && scene.remove(maskObjectsAppliedRoof[e])
      })
    } catch (e) {
      console.debug('resetPlan : 6.6 : ' + e)
    }
    try {
      Object.keys(clickableObjects).forEach(function (e) {
        let t = clickableObjects[e]
        'object' === typeof t &&
          'groundLayer' !== t._name &&
          (scene.remove(clickableObjects[e]), delete clickableObjects[e])
      })
    } catch (e) {
      console.debug('resetPlan : 7 : ' + e)
    }
    try {
      Object.keys(maskObjects).forEach(function (e) {
        let t = maskObjects[e]
        'object' === typeof t && (scene.remove(maskObjects[e]), delete maskObjects[e])
      }),
        (clickableObjectsCounter = 0)
    } catch (e) {
      console.debug('resetPlan : 8 : ' + e)
    }
    try {
      backgroundRaster &&
        backgroundRaster.data &&
        (backgroundRaster.data.toolsRectangleInner && backgroundRaster.data.toolsRectangleInner.remove(),
        backgroundRaster.remove(),
        (backgroundRaster = null),
        clearFileInput(document.getElementById('backgroundImageFile')))
    } catch (e) {
      console.debug('resetPlan : 9 : ' + e)
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
      console.debug('resetPlan : 10 : ' + e)
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

      // console.debug("%cresetPlan success", ccm.yellow)
    } catch (e) {
      console.debug('resetPlan : 11 : ' + e)
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
      console.debug('resetPlan : 12 : ' + e)
    }
    try {
      levelButtons || doAddNewLevel('0'), doSetLevel('0')
    } catch (e) {
      console.debug('resetPlan : 13 : ' + e)
    }
    try {
      Object.keys(levelButtons).forEach(function (e) {
        '0' !== e.toString() &&
          (levelButtons[e].parentNode.removeChild(levelButtons[e]),
          delete levelButtons[e],
          project.layers['level' + e].remove())
      })
    } catch (e) {
      console.debug('resetPlan : 14 : ' + e)
    }
    try {
      project.layers.forEach(function (e: { data: { id: any }; remove: () => any }) {
        '0' !== e.data.id && e.remove()
      })

      project.layers[0].data = { id: '0', _name: 'level0', height: 0 }
    } catch (e) {
      console.debug('resetPlan : 15 : ' + e)
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
      console.debug('resetPlan : 16 : ' + e)
    }
  }

  const setToolMode: any = (mode): string => {
    try {
      switch (
        ('walls' === toolMode
          ? setEndDrawingWalls()
          : 'floor' === toolMode
          ? setEndDrawingFloors()
          : 'roof' === toolMode
          ? setEndDrawingRoofs()
          : 'dimension' === toolMode
          ? setEndDrawingDimension()
          : 'text' === toolMode
          ? setEndDrawingText()
          : 'ground' === toolMode && setEndDrawingGround(),
        (toolMode = mode),
        mode)
      ) {
        case 'pointer':
          // modalsActive || showMouseIndicators()
          defaultCursor = 'default'
          // deselectAll()
          // document.getElementById("pointerTool").classList.add("activeTool")
          // document.getElementById("addWallTool").classList.remove("activeTool")
          // document.getElementById("addFloorTool").classList.remove("activeTool")
          // document.getElementById("addRoofTool").classList.remove("activeTool")
          // document.getElementById("addRulerTool").classList.remove("activeTool")
          // document.getElementById("addTextTool").classList.remove("activeTool")
          break
        case 'walls':
          (defaultCursor = 'crosshair'),
            deselectAll(),
            recalcAllUnjoinedWallSegments(-1),
            recalcAllWallSegmentsOnOtherLevels(-1, project.layers[0].data.id),
            document.getElementById('pointerTool').classList.remove('activeTool'),
            document.getElementById('addWallTool').classList.add('activeTool'),
            document.getElementById('addFloorTool').classList.remove('activeTool'),
            document.getElementById('addRoofTool').classList.remove('activeTool'),
            document.getElementById('addRulerTool').classList.remove('activeTool'),
            document.getElementById('addTextTool').classList.remove('activeTool'),
            setPropertiesView('wallDefaults')
          break
        case 'floor':
          (defaultCursor = 'crosshair'),
            deselectAll(),
            document.getElementById('pointerTool').classList.remove('activeTool'),
            document.getElementById('addWallTool').classList.remove('activeTool'),
            document.getElementById('addFloorTool').classList.add('activeTool'),
            document.getElementById('addRoofTool').classList.remove('activeTool'),
            document.getElementById('addRulerTool').classList.remove('activeTool'),
            document.getElementById('addTextTool').classList.remove('activeTool'),
            recalcAllWallCorners(),
            setPropertiesView('floorDefaults')
          break
        case 'roof':
          (defaultCursor = 'crosshair'),
            deselectAll(),
            document.getElementById('pointerTool').classList.remove('activeTool'),
            document.getElementById('addWallTool').classList.remove('activeTool'),
            document.getElementById('addFloorTool').classList.remove('activeTool'),
            document.getElementById('addRoofTool').classList.add('activeTool'),
            document.getElementById('addRulerTool').classList.remove('activeTool'),
            document.getElementById('addTextTool').classList.remove('activeTool'),
            recalcAllRoofCorners(),
            setPropertiesView('roofDefaults')
          break
        case 'dimension':
          (defaultCursor = 'crosshair'),
            deselectAll(),
            document.getElementById('pointerTool').classList.remove('activeTool'),
            document.getElementById('addWallTool').classList.remove('activeTool'),
            document.getElementById('addFloorTool').classList.remove('activeTool'),
            document.getElementById('addRoofTool').classList.remove('activeTool'),
            document.getElementById('addRulerTool').classList.add('activeTool'),
            document.getElementById('addTextTool').classList.remove('activeTool'),
            recalcAllWallCorners(),
            recalcAllRoofCorners(),
            setPropertiesView('dimensionDefaults')
          break
        case 'text':
          (defaultCursor = 'crosshair'),
            deselectAll(),
            document.getElementById('pointerTool').classList.remove('activeTool'),
            document.getElementById('addWallTool').classList.remove('activeTool'),
            document.getElementById('addFloorTool').classList.remove('activeTool'),
            document.getElementById('addRoofTool').classList.remove('activeTool'),
            document.getElementById('addRulerTool').classList.remove('activeTool'),
            document.getElementById('addTextTool').classList.add('activeTool'),
            setPropertiesView('textnDefaults')
          break
        case 'background':
          (defaultCursor = 'default'),
            document.getElementById('pointerTool').classList.remove('activeTool'),
            document.getElementById('addWallTool').classList.remove('activeTool'),
            document.getElementById('addFloorTool').classList.remove('activeTool'),
            document.getElementById('addRoofTool').classList.remove('activeTool'),
            document.getElementById('addRulerTool').classList.remove('activeTool'),
            document.getElementById('addTextTool').classList.remove('activeTool')
          break
        case 'ground':
          doSetLevel('0'),
            (toolMode = e),
            (defaultCursor = 'default'),
            (wallsGroup[0].opacity = 0.25),
            (floorsGroup[0].opacity = 0.25),
            (furnitureGroup[0].opacity = 0.25),
            document.getElementById('pointerTool').classList.remove('activeTool'),
            document.getElementById('addWallTool').classList.remove('activeTool'),
            document.getElementById('addFloorTool').classList.remove('activeTool'),
            document.getElementById('addRoofTool').classList.remove('activeTool'),
            document.getElementById('addRulerTool').classList.remove('activeTool'),
            document.getElementById('addTextTool').classList.remove('activeTool'),
            setPropertiesView('ground')
          break
        default:
          defaultCursor = 'default'
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
      console.debug('ERROR: setToolMode', mode, e)
    }
  }

  const doLoadFile: PointerEventHandler<HTMLAnchorElement> = (): any => {
    // alert("[MM] doLoadFile")
    try {
      const loaded = { ts: new Date().toISOString() }

      // save to disk
      // localStorage.clear()
      localStorage.setItem('threed_doLoadFile', JSON.stringify({ subject: 'load', payload: loaded }))
      console.debug('[MM] TRY: doLoadFile')
    } catch (e) {
      console.debug('[MM] CATCH: doLoadFile', e)
    }
  }

  const doSaveFile: PointerEventHandler<HTMLAnchorElement> = (): any => {
    // alert("[MM] doSaveFile")
    try {
      const saved = { ts: new Date().toISOString() }

      // save to disk
      // localStorage.clear()
      localStorage.setItem('threed_doSaveFile', JSON.stringify({ subject: 'save', payload: saved }))
      console.debug('[MM] TRY: doSaveFile')
    } catch (e) {
      console.debug('[MM] CATCH: doSaveFile', e)
    }
  }

  const doLoadFileAsText = (f: any) => {
    try {
      let t = f.target
      let o = new FileReader()
      // console.debug("%cFileReader", ccm.yellow, o)
      o.onload = function () {
        let g = o.result
        // resetPlan()
        // loadingProgressTxt = "Plan decoding\n" + loadingProgressTxt
        // document.getElementById("modalLoadingDataInfo").innerHTML = loadingProgressTxt
        console.debug('drawPlan', g)
        // drawPlan(JSON.parse(g))
        // clearFileInput(document.getElementById("file"))
      }
      // loadingProgressTxt = "Loading Saved Plan"
      // document.getElementById("modalLoadingDataInfo").innerHTML = loadingProgressTxt
      // $("#ModalLoading").show()
      // hideMouseIndicators()
      o.readAsText(t.files[0])

      console.debug('%cFileReader', ccm.yellow, o)
    } catch (e) {
      console.debug('%cloadFileAsText : ' + e, ccm.orange)
    }
  }

  const doOpenShareDialog = () => {
    try {
      $('#ModalShare').show()
    } catch (e) {
      console.debug('doOpenShareDialog : ' + e)
    }
  }

  const doOpenFullscreen = (el: string) => {
    try {
      // alert(el)
      // let t = document.getElementById(el)
      let t = document.querySelector(el)
      if (!document.fullscreenElement) {
        t.requestFullscreen().catch((err) => {
          alert(`Error attempting to enable full-screen mode: ${err.message} (${err._name})`)
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
      console.debug('doOpenFullscreen : ' + e)
    }
  }

  const doAddNewLevel = (level) => {
    console.debug('%caddNewLevel called', ccm.yellow, level)
    return !1
  }

  const doSetLevel = (level) => {
    console.debug('%csetLevel called', ccm.yellow, level)
    return !1
  }

  const doUndo: PointerEventHandler<HTMLAnchorElement> = (): any => {
    // alert("[MM] doUndo")
    try {
      const undid = { ts: new Date().toISOString() }

      // save to disk
      // localStorage.clear()
      localStorage.setItem('threed_doUndo', JSON.stringify({ subject: 'undo', payload: undid }))
      console.debug('[MM] TRY: doUndo')
    } catch (e) {
      console.debug('[MM] CATCH: doUndo', e)
    }
  }

  const doRedo: PointerEventHandler<HTMLAnchorElement> = (): any => {
    // alert("[MM] doRedo")
    try {
      const redid = { ts: new Date().toISOString() }

      // save to disk
      // localStorage.clear()
      localStorage.setItem('threed_doRedo', JSON.stringify({ subject: 'redo', payload: redid }))
      console.debug('[MM] TRY: doRedo')
    } catch (e) {
      console.debug('[MM] CATCH: doRedo', e)
    }
  }

  // ============================================================

  // // Component onMount hook
  // useEffect(() => {
  //   const word = 'YO YO YO'
  //   // console.debug("ThreeDToolbar onMount", word)
  //   return () => {
  //     // console.debug("ThreeDToolbar onUnmount", word)
  //   }
  // }, [])

  // const pages = ['Products', 'Pricing', 'Blog']
  // const settings = ['Profile', 'Account', 'Dashboard', 'Logout']

  return (
    <AppBar
      id='appBar'
      // position='static'
    >
      {/* <Box
        maxWidth='xl'
        // sx={{ paddingLeft: 0, paddingRight: 0 }}
      > */}
        <Toolbar
          disableGutters
        >
          <Box
            sx={{ flexGrow: 1 }} // , display: { xs: 'none', md: 'flex' }
          >
            <Button
              key='Actions'
              onClick={handleOpenActionsMenu}
              sx={{ color: '#FFFFFF', p: 0, ml: 0, mr: 2 }}
            >
              Actions
            </Button>
            <Menu
              sx={{ mt: 8 }}
              id='menu-appbar-actions'
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
              <MenuItem
                key='New ThreeD'
                onClick={handleCloseActionsMenu}
              >
                <Typography onClick={() => threedStore.actions.getState().addNew()}>New ThreeD</Typography>
              </MenuItem>
              <MenuItem
                key='New Project'
                onClick={handleCloseActionsMenu}
              >
                <Typography onClick={() => useProjectStore.getState().addProject()}>New Project</Typography>
              </MenuItem>
              <MenuItem
                key='Save Project'
                onClick={handleCloseActionsMenu}
              >
                <Typography onClick={() => useProjectStore.getState().saveProject()}>Save Project</Typography>
              </MenuItem>
              <MenuItem
                key='New Plan'
                onClick={handleCloseActionsMenu}
              >
                <Typography onClick={() => usePlanStore.getState().addPlan()}>New Plan</Typography>
              </MenuItem>
              <MenuItem
                key='Save Plan'
                onClick={handleCloseActionsMenu}
              >
                <Typography
                  id='saveBtn'
                  onClick={() => usePlanStore.getState().savePlan()}
                >
                  Save Plan
                </Typography>
              </MenuItem>
              <MenuItem
                key='New Simulation'
                onClick={handleCloseActionsMenu}
              >
                <Typography>New Simulation</Typography>
              </MenuItem>
            </Menu>

            <Button
              key='Files'
              onClick={handleOpenFilesMenu}
              sx={{ color: '#FFFFFF', p: 0, mr: 1 }}
            >
              Files
            </Button>
            <Menu
              sx={{ mt: 8 }}
              id='menu-appbar-files'
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
              <MenuItem
                key='Load File'
                onClick={handleCloseFilesMenu}
              >
                <Typography
                  id='loadBtn'
                  onClick={doLoadFile}
                >
                  Load File
                </Typography>
                <input
                  type='file'
                  style={{ display: 'inline-block', marginLeft: '4px' }}
                  id='file'
                  name='file'
                  onChange={doLoadFileAsText}
                />
              </MenuItem>
              <MenuItem
                key='Save File'
                onClick={handleCloseFilesMenu}
              >
                <Typography
                  id='saveBtn'
                  onClick={doSaveFile}
                >
                  Save File
                </Typography>
              </MenuItem>
              <MenuItem
                key='Export As OBJ'
                onClick={handleCloseFilesMenu}
              >
                <Typography
                  id='exportBtn'
                  onClick={() => exportToObj}
                >
                  Export As OBJ
                </Typography>
              </MenuItem>
              <MenuItem
                key='Create Thumb'
                onClick={handleCloseFilesMenu}
              >
                <Typography
                  id='createThumb'
                  onClick={() => createThumbForHistory}
                >
                  Create Thumb
                </Typography>
              </MenuItem>
            </Menu>

            <Button
              key='Edits'
              onClick={handleOpenEditsMenu}
              sx={{ color: '#FFFFFF', p: 0, mr: 1 }}
            >
              Edits
            </Button>
            <Menu
              sx={{ mt: 8 }}
              id='menu-appbar-edits'
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
              <MenuItem
                key='Undo'
                onClick={handleCloseEditsMenu}
              >
                <Typography
                  id='undoBtn'
                  onClick={doUndo}
                >
                  Undo
                </Typography>
              </MenuItem>
              <MenuItem
                key='Redo'
                onClick={handleCloseEditsMenu}
              >
                <Typography
                  id='redoBtn'
                  onClick={doRedo}
                >
                  Redo
                </Typography>
              </MenuItem>
            </Menu>

            <Button
              key='Views'
              onClick={handleOpenViewsMenu}
              sx={{ color: '#FFFFFF', p: 0, mr: 2 }}
            >
              Views
            </Button>
            <Menu
              sx={{ mt: 8 }}
              id='menu-appbar-views'
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
              <MenuItem
                key='Modal: About'
                onClick={handleCloseViewsMenu}
              >
                <Typography onClick={(e) => modalAboutStore.actions.handleOpen(e)}>Modal: About</Typography>
              </MenuItem>
              <MenuItem
                key='Modal: Model3d'
                onClick={handleCloseViewsMenu}
              >
                <Typography onClick={(e) => modalModel3dStore.actions.handleOpen(e)}>Modal: Model3d</Typography>
              </MenuItem>
              <MenuItem
                key='Modal: Loading'
                onClick={handleCloseViewsMenu}
              >
                <Typography onClick={(e) => modalLoadingStore.actions.handleOpen(e)}>Modal: Loading</Typography>
              </MenuItem>
              <MenuItem
                key='Modal: Share'
                onClick={handleCloseViewsMenu}
              >
                <Typography onClick={(e) => modalShareStore.actions.handleOpen(e)}>Modal: Share</Typography>
              </MenuItem>
              <MenuItem
                key='Spacer: 1'
                onClick={handleCloseViewsMenu}
              >
                <Typography>==============</Typography>
              </MenuItem>
              {/* <MenuItem key="Dialog: Share" onClick={handleCloseViewsMenu}>
                <Typography onClick={doOpenShareDialog}>Dialog: Share</Typography>
              </MenuItem> */}
              <MenuItem
                key='2D Plan Properties'
                onClick={handleCloseViewsMenu}
              >
                <Typography onClick={(e) => setPropertiesView('planView')}>2D Plan Properties</Typography>
              </MenuItem>
              <MenuItem
                key='2D Plan Fullscreen'
                onClick={handleCloseViewsMenu}
              >
                <Typography onClick={(e) => doOpenFullscreen('#planView')}>2D Plan Fullscreen</Typography>
              </MenuItem>
              <MenuItem
                key='3D Plan Properties'
                onClick={handleCloseViewsMenu}
              >
                <Typography onClick={(e) => setPropertiesView('3dView')}>3D Plan Properties</Typography>
              </MenuItem>
              <MenuItem
                key='3D Plan Fullscreen'
                onClick={handleCloseViewsMenu}
              >
                <Typography onClick={(e) => doOpenFullscreen('#view3d')}>3D Plan Fullscreen</Typography>
              </MenuItem>
              {/* <MenuItem key="Defaults" onClick={handleCloseViewsMenu}>
                <Typography onClick={() => setPropertiesView('defaults')}>Defaults</Typography>
              </MenuItem> */}
              {/* <MenuItem key="Ground Properties" onClick={handleCloseViewsMenu}>
                <Typography onClick={() => setToolMode('ground')} id="groundPropertiesBtn">Ground Properties</Typography>
              </MenuItem> */}
              <MenuItem
                key='Fullscreen'
                onClick={handleCloseViewsMenu}
              >
                <Typography
                  onClick={() => doOpenFullscreen('body')}
                  id='fullscreenApp'
                >
                  Fullscreen
                </Typography>
              </MenuItem>
            </Menu>

            <Button
              key='Layers'
              onClick={handleOpenLayersMenu}
              sx={{ color: '#FFFFFF', p: 0, mr: 2 }}
            >
              Layers
            </Button>
            <Menu
              sx={{ mt: 8 }}
              id='menu-appbar-layers'
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
              <MenuItem
                key='New Noun Layer'
                onClick={handleCloseLayersMenu}
              >
                <Typography onClick={() => newLevel('noun')}>New Noun Layer</Typography>
              </MenuItem>
            </Menu>

            <Button
              key='Tools'
              onClick={handleOpenToolsMenu}
              sx={{ color: '#FFFFFF', p: 0, mr: 1 }}
            >
              Tools
            </Button>
            <Menu
              sx={{ mt: 8 }}
              id='menu-appbar-tools'
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
              <MenuItem
                key='Tool 1'
                onClick={handleCloseToolsMenu}
              >
                <Typography onClick={() => tool1}>Tool 1</Typography>
              </MenuItem>
              <MenuItem
                key='Tool 2'
                onClick={handleCloseToolsMenu}
              >
                <Typography onClick={() => tool2}>Tool 2</Typography>
              </MenuItem>
              <MenuItem
                key='Tool 3'
                onClick={handleCloseToolsMenu}
              >
                <Typography onClick={() => tool3}>Tool 3</Typography>
              </MenuItem>
              <MenuItem
                key='Do Log'
                onClick={handleCloseToolsMenu}
              >
                <Typography onClick={() => doLog}>Do Log</Typography>
              </MenuItem>
              <MenuItem
                key='Show About'
                onClick={handleCloseToolsMenu}
              >
                <Typography onClick={() => showAbout}>Show About</Typography>
              </MenuItem>
            </Menu>
          </Box>

          <Box
            sx={{ flexGrow: 0 }} // , display: { xs: 'none', md: 'flex' }
          >
            {/* <Button color="inherit">-||- TOOL MODES -||-</Button> */}
            <Tooltip title='Pointer Tool'>
              <IconButton
                id='pointerTool'
                onClick={() => setToolMode('pointer')}
                aria-label='Pointer Tool'
                aria-controls='menu-appbar'
                aria-haspopup='true'
                size='medium'
                color='inherit'
                sx={{ mr: 1 }}
              >
                <ToolIconPointer />
              </IconButton>
            </Tooltip>
            <Tooltip title='Hand Tool'>
              <IconButton
                id='handTool'
                onClick={() => setToolMode('hand')}
                aria-label='Hand Tool'
                aria-controls='menu-appbar'
                aria-haspopup='true'
                size='medium'
                color='inherit'
                sx={{ mr: 1 }}
              >
                <ToolIconHand />
              </IconButton>
            </Tooltip>
            <Tooltip title='Wall Tool'>
              <IconButton
                id='addWallTool'
                onClick={() => setToolMode('walls')}
                aria-label='Wall Tool'
                aria-controls='menu-appbar'
                aria-haspopup='true'
                size='medium'
                color='inherit'
                sx={{ mr: 1 }}
              >
                <ToolIconAddWall />
              </IconButton>
            </Tooltip>
            <Tooltip title='Floor Tool'>
              <IconButton
                id='addFloorTool'
                onClick={() => setToolMode('floor')}
                aria-label='Floor Tool'
                aria-controls='menu-appbar'
                aria-haspopup='true'
                size='medium'
                color='inherit'
                sx={{ mr: 1 }}
              >
                <ToolIconAddFloor />
              </IconButton>
            </Tooltip>
            <Tooltip title='Roof Tool'>
              <IconButton
                id='addRoofTool'
                onClick={() => setToolMode('roof')}
                aria-label='Roof Tool'
                aria-controls='menu-appbar'
                aria-haspopup='true'
                size='medium'
                color='inherit'
                sx={{ mr: 1 }}
              >
                <ToolIconAddRoof />
              </IconButton>
            </Tooltip>
            <Tooltip title='Ruler Tool'>
              <IconButton
                id='addRulerTool'
                onClick={() => setToolMode('dimension')}
                aria-label='Ruler Tool'
                aria-controls='menu-appbar'
                aria-haspopup='true'
                size='medium'
                color='inherit'
                sx={{ mr: 1 }}
              >
                <ToolIconAddRuler />
              </IconButton>
            </Tooltip>
            <Tooltip title='Text Tool'>
              <IconButton
                id='addTextTool'
                onClick={() => setToolMode('text')}
                aria-label='Text Tool'
                aria-controls='menu-appbar'
                aria-haspopup='true'
                size='medium'
                color='inherit'
                sx={{ mr: 0 }}
              >
                <ToolIconAddText />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      {/* </Box> */}
    </AppBar>
  )
}

export default ThreeDToolbar
