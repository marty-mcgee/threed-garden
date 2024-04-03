'use client'
// ==========================================================

import { useApolloClient } from '@apollo/client'
import {
  isPreferencesSetVar,
  preferencesDataVar,
  preferencesStore,
  projectStore,
  // ...stores
} from '#/lib/stores/apollo'

// ** MUI Imports
import { styled } from '@mui/material/styles'
import Grid from '@mui/material/Grid'
import MuiButton from '@mui/material/Button'

// ** ThreeD r3f Canvas Imports
// import ThreeDCanvasViewer from '#/lib/threed/components/canvas/CanvasViewer'
// import { Canvas } from '@react-three/fiber'
// import { ThreeDCanvasViewer } from '#/lib/threed/components/canvas/Canvas'
import { ThreeDCanvas } from '#/lib/threed/components/canvas/Canvas'
// import { ThreeDEnvironment } from '#/lib/threed/components/canvas/Canvas'

// ** Helper Components
import Spinner from '#/ui/components/spinner'
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

const Button = styled(MuiButton)(({ theme }) => ({
  marginRight: `0.25rem !important`,
  padding: `0.5rem 0.5rem !important`,
  minWidth: `2.0rem !important`,
}))

// ==========================================================

// ** export default
export const ThreeDCanvasViewer = () => {

  // return <Spinner />

  // **
  const word: string = `[MM] ThreeDCanvasViewer @ ${new Date().toISOString()}`
  // console.debug(`%c=======================================================`, ccm.orange)
  console.debug('%c🥕 ThreeDCanvasViewer ', ccm.orange)
  // console.debug(`%c=======================================================`, ccm.black)

  // ** USE CLIENT
  // const client = useApolloClient()

  // ** DECIDE WHETHER TO USE CANVAS, DEPENDING ON AVAILABLE threeds[nodes]
  let threeds: [] = [] // threeds are nodes[] to load to canvas

  // return <Spinner />

  // if (isPreferencesSetVar()) {
  //   if (debug || DEBUG || debug_deep) console.debug('%c🥕 ThreeDCanvasViewer isPreferencesSetVar() ', ccm.greenAlert, isPreferencesSetVar())
  //   // const project = projectStore.store.get('one')
  //   const project = projectStore.store.useStore('one')
  //   if (DEBUG || debug_deep) console.debug('%c🥕 ThreeDCanvasViewer {project} ', ccm.orange, project)
  //   if (project) {
  //     let project_title = project?.data?.title ? project.data.title : 'NOTHING YET, SIR: NOPE NOPE NOPE'
  //     if (DEBUG || debug_deep) console.debug('%c🥕 ThreeDCanvasViewer {project}.project_title ', ccm.orange, project_title)
  //     if (project.data?.plans) {
  //       let nodesToLoad: [] = []
  //           nodesToLoad = project.data.plans.nodes[0]?.threedsActive?.nodes
  //       if (DEBUG || debug_deep) console.debug('%c🥕 ThreeDCanvasViewer {project}.[nodesToLoad] ', ccm.orange, nodesToLoad)
  //       if (nodesToLoad) {
  //         threeds = nodesToLoad
  //         if (DEBUG || debug_deep) console.debug('%c🥕 ThreeDCanvasViewer [nodesToLoad] as [threeds] ', ccm.orange, threeds)
  //       }
  //     }
  //   }
  // }

  // else {
  //   if (debug || DEBUG || debug_deep) console.debug('%c🥕 ThreeDCanvasViewer isPreferencesSetVar() ', ccm.orangeAlert, isPreferencesSetVar(), 'begin querying preferences')
  //   const isPrefsLoadedFromDataSouce = false // preferencesStore.actions.loadFromDB(client)
  //   // const isPrefsLoadedFromDataSouce = preferencesStore.actions.loadFromDataSource(client)
  //   if (DEBUG) console.debug('%c preferences loading...', ccm.greenAlert, isPrefsLoadedFromDataSouce)
  //   // ** SET REACTIVE VARS FROM DATA SOURCE
  //   if (isPrefsLoadedFromDataSouce) {
  //     const preferencesStoreData = preferencesStore.store.useStore('one').data
  //     if (DEBUG) console.debug('%c🌱 preferencesStoreData', ccm.darkgreen, preferencesStoreData)
  //     // ** TODO !!!
  //     if (preferencesStoreData.projectName) { // HACK !!! for apollo error: mappedpath[s]

  //       if (DEBUG) console.debug('%c====================================', ccm.yellowAlert)
  //       if (DEBUG) console.debug('%c🌱 TODO: SET preferencesDataVar to ', ccm.yellowAlert, preferencesStoreData)
  //       const preferencesDataVarNew = preferencesDataVar(preferencesStoreData)
  //       if (DEBUG) console.debug('%c🌱 DONE: SET preferencesDataVar', ccm.yellowAlert, preferencesDataVarNew)

  //       if (DEBUG) console.debug('%c====================================', ccm.yellowAlert)
  //       if (DEBUG) console.debug('%c🌱 TODO: SET isPreferencesSetVar()', ccm.yellowAlert, isPreferencesSetVar())
  //       isPreferencesSetVar(true)
  //       if (DEBUG) console.debug('%c🌱 DONE: SET isPreferencesSetVar()', ccm.yellowAlert, isPreferencesSetVar())

  //       if (DEBUG) console.debug('%c====================================', ccm.yellowAlert)
  //     }
  //   }
  // }

  // ** TODO !!!
  // ** LOAD NOUN FROM WP API VIA APOLLO INTO R3F + LEVA (+ VALTIO)
  // const loadNounData = (threeds: [] = []) => {
  //   // load these threeds into r3f canvas
  //   projectStore.actions.loadToCanvas(threeds, '_r3fCanvas')
  //   // return <Box>true</Box> // true
  // }

  console.debug(`%c=======================================================`, ccm.orange)
  return (
    <Grid
      container
      id='_r3fCameras'
    >
      <Grid
        item
        id='_r3f_camera_1'
        md={12}
        xs={12}
        sx={{ borderTop: '1px solid darkgreen' }}
      >

        {/* THREED CANVAS */}
        <ThreeDCanvas
          _id={'_r3fCanvas'}
          threeds={threeds}
        />
        {/* THREED CANVAS */}

      </Grid>
      {/* <Grid item id='_r3f_camera_2'
        md={6} xs={12} sx={{ border: '1px solid darkgreen' }}
      >
        <ThreeDCanvas
          _id={'_r3fCanvas2'}
          threeds={threeds}
        />
      </Grid> */}
      {/* <Grid item id='_r3f_camera_3'
        md={6} xs={12} sx={{ border: '1px solid darkgreen' }}
      >
        <ThreeDCanvas
          _id={'_r3fCanvas3'}
          threeds={threeds}
        />
      </Grid> */}
      {/* <Grid item id='_r3f_camera_4'
        md={6} xs={12} sx={{ border: '1px solid darkgreen' }}
      >
        <ThreeDCanvas
          _id={'_r3fCanvas4'}
          threeds={threeds}
        />
      </Grid> */}
    </Grid>
  )
}

export default ThreeDCanvasViewer
