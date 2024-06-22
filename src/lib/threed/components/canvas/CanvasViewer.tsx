// 'use client'
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

// ** RADIX-UI Imports
import * as Accordion from '@radix-ui/react-accordion'
import { ChevronDownIcon } from '@radix-ui/react-icons'
import {
  Box,
  Button,
  Grid,
  Text,
} from '@radix-ui/themes'

// ** THREED r3f Canvas Imports
// import { Canvas } from '@react-three/fiber'
import { ThreeDCanvas } from '#/lib/threed/components/canvas/Canvas'
// import { ThreeDEnvironment } from '#/lib/threed/components/canvas/Canvas'

// ** HELPER Components
import Spinner from '#/layout/ui/components/spinner'
// ** HELPFUL UTIL: COLORFUL CONSOLE MESSAGES (ccm)
import ccm from '#/lib/utils/console-colors'

// ==========================================================
// IMPORTS COMPLETE
// ==========================================================

// DEBUG PREFERENCES FOR THIS MODULE
const debug: boolean = false
const DEBUG: boolean = false

// ==========================================================

// ** export default
export const ThreeDCanvasViewer = () => {

  // return <Spinner />

  // **
  const word: string = `[MM] ThreeDCanvasViewer @ ${new Date().toISOString()}`
  // console.debug(`%c=======================================================`, ccm.orange)
  if (debug || DEBUG) console.debug('%c🥕 ThreeDCanvasViewer ...', ccm.darkredAlert)
  // console.debug(`%c=======================================================`, ccm.black)

  // ** USE CLIENT
  // const client = useApolloClient()

  // ** threeds[nodes] to provide a canvas
  let threeds: [] = [] // threeds are nodes[] to load to canvas

  // return <Spinner />
  // ** ⚙️ PREFERENCES
  // const prefs = preferencesDataVar() // NO ??
  const prefs = useReactiveVar(preferencesDataVar) // YES ??
  // console.debug('%c⚙️ ThreeDGarden prefs', ccm.orangeAlert, prefs)

  let project = projectStore.store.get('one')
  if (prefs.doAutoLoadData) {
    // if (debug || DEBUG) console.debug('%c🥕 TRYING... ThreeDCanvasViewer {project} ', ccm.orange)
    try {
      // const project = projectStore.store.get('one')
      // const project = projectStore.store.useStore('one') // causes an error, but may still be the way to go
      // project = async () => await projectStore.store.useStore('one') // same error
      if (debug || DEBUG) console.debug('%c🥕 ThreeDCanvasViewer {project} ', ccm.orange, project)
      // if (debug || DEBUG) console.debug('%c🥕 ThreeDCanvasViewer {project} ', ccm.orange, project())
      if (project) {
        let project_title = project?.data?.title ? project.data.title : 'NOTHING YET, SIR: NOPE NOPE NOPE'
        // if (debug || DEBUG) console.debug('%c🥕 ThreeDCanvasViewer {project}.project_title ', ccm.orange, project_title)
        if (project.data.plans) {
          let nodesToLoad: [] = []
          // ** [MM] HEY HEY HEY
              nodesToLoad = project.data.plans.nodes[0].threedsActive.nodes
          // ** [MM] HEY HEY HEY
          // if (debug || DEBUG) console.debug('%c🥕 ThreeDCanvasViewer {project}.[nodesToLoad] ', ccm.orange, nodesToLoad)
          // ** [MM] HEY HEY HEY
          if (nodesToLoad) {
            // ** SET threeds[]
            // ** [MM] HEY HEY HEY
            threeds = nodesToLoad
            // ** [MM] HEY HEY HEY
            if (debug || DEBUG) console.debug('%c🥕 ThreeDCanvasViewer [nodesToLoad] as [threeds] ', ccm.orange, threeds)
          }
          // ** [MM] HEY HEY HEY
        }
      }
    } catch (ERROR) {
      console.error(ERROR)
    }
  }

  // console.debug(`%c=======================================================`, ccm.orange)
  return (
    <Box id='threedCanvasViewer'>

      {/* CANVAS[ES] as accordion */}
      <Accordion.Root 
        type='multiple' 
        // orientation='vertical' 
        // @ ts-expect-error
        // collapsible={'true'} // string 'true' | 'false' -- bug: should be boolean, not string
        defaultValue={['Canvas 1']}
        // value={tabControlValue}
        // onChange={onChangeTabControlValue}
        // aria-label='ThreeD Canvas[es] Viewer'
        className='AccordionRoot'
      >

        {/* THREED CANVAS 1 */}
        <Accordion.Item 
          value={'Canvas 1'}
          className='AccordionItem'
        >
          <Accordion.Header
            className='AccordionHeader'
          >
            <Accordion.Trigger 
              // className='AccordionTrigger'
            >
              <ChevronDownIcon className='AccordionChevron' aria-hidden />
              <span>Canvas 1</span>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content 
            // className='AccordionContent'
          >
            <Grid
              key='_r3fCanvas1'
              style={{ borderTop: '1px solid darkgreen' }}
            >
              <ThreeDCanvas
                _id={'_r3fCanvas1'}
                threeds={threeds}
              />
            </Grid>
          </Accordion.Content>
        </Accordion.Item>
        
        {/* THREED CANVAS 2 */}
        <Accordion.Item 
          value={'Canvas 2'}
          className='AccordionItem'
        >
          <Accordion.Header
            className='AccordionHeader'
          >
            <Accordion.Trigger 
              // className='AccordionTrigger'
            >
              <ChevronDownIcon className='AccordionChevron' aria-hidden />
              <span>Canvas 2</span>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content 
            // className='AccordionContent'
          >
            <Grid
              key='_r3fCanvas2'
              style={{ borderTop: '1px solid darkgreen' }}
            >
              <ThreeDCanvas
                _id={'_r3fCanvas2'}
                threeds={threeds}
              />
            </Grid>
          </Accordion.Content>
        </Accordion.Item>

        {/**/}
      </Accordion.Root>
    </Box>
  )
}

export default ThreeDCanvasViewer
