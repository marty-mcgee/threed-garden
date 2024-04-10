'use client'
// ==========================================================
// RESOURCES

import { useApolloClient, useReactiveVar } from '@apollo/client'
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

// ** THREED r3f Canvas Imports
// import ThreeDCanvasViewer from '#/lib/threed/components/canvas/CanvasViewer'
// import { Canvas } from '@react-three/fiber'
// import { ThreeDCanvasViewer } from '#/lib/threed/components/canvas/Canvas'
import { ThreeDCanvas } from '#/lib/threed/components/canvas/Canvas'
// import { ThreeDEnvironment } from '#/lib/threed/components/canvas/Canvas'

// ** HELPER Components
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
  // **
  // const prefs = preferencesDataVar() // NO ??
  const prefs = useReactiveVar(preferencesDataVar) // YES ??
  console.debug('%c ThreeDGarden prefs', ccm.orangeAlert, prefs)

  let project = projectStore.store.get('one')
  if (prefs.doAutoLoadData) {
    // if (DEBUG || debug_deep) console.debug('%c🥕 TRYING... ThreeDCanvasViewer {project} ', ccm.orange)
    try {
      // const project = projectStore.store.get('one')
      // const project = projectStore.store.useStore('one') // causes an error, but may still be the way to go
      // project = async () => await projectStore.store.useStore('one') // same error
      if (DEBUG || debug_deep) console.debug('%c🥕 ThreeDCanvasViewer {project} ', ccm.orange, project)
      // if (DEBUG || debug_deep) console.debug('%c🥕 ThreeDCanvasViewer {project} ', ccm.orange, project())
      if (project) {
        let project_title = project?.data?.title ? project.data.title : 'NOTHING YET, SIR: NOPE NOPE NOPE'
        // if (DEBUG || debug_deep) console.debug('%c🥕 ThreeDCanvasViewer {project}.project_title ', ccm.orange, project_title)
        if (project.data.plans) {
          let nodesToLoad: [] = []
          // ** [MM] HEY HEY HEY
              nodesToLoad = project.data.plans.nodes[0].threedsActive.nodes
          // ** [MM] HEY HEY HEY
          // if (DEBUG || debug_deep) console.debug('%c🥕 ThreeDCanvasViewer {project}.[nodesToLoad] ', ccm.orange, nodesToLoad)
          // ** [MM] HEY HEY HEY
          if (nodesToLoad) {
            // ** SET threeds[]
            // ** [MM] HEY HEY HEY
            threeds = nodesToLoad
            // ** [MM] HEY HEY HEY
            if (DEBUG || debug_deep) console.debug('%c🥕 ThreeDCanvasViewer [nodesToLoad] as [threeds] ', ccm.orange, threeds)
          }
          // ** [MM] HEY HEY HEY
        }
      }
    } catch (ERROR) {
      console.error(ERROR)
    }
  }

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
