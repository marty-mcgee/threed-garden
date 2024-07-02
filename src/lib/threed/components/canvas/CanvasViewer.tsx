// 'use client'
// ==========================================================
// RESOURCES

// ** APOLLO CLIENT STORE+STATE Imports
import { useApolloClient, useReactiveVar } from '@apollo/client'
import {
  isPreferencesSetVar,
  preferencesDataVar,
  preferencesStore,
  projectStore,
  // ...stores
} from '#/lib/stores/apollo'
// temporarily while coding
import { useState } from 'react'

// ** RADIX-UI Imports
import * as Collapsible from '@radix-ui/react-collapsible'
import * as Accordion from '@radix-ui/react-accordion'
import {
  ChevronDownIcon,
  RowSpacingIcon, 
  Cross2Icon,
} from '@radix-ui/react-icons'
import {
  Box,
  Button,
  Grid,
  Flex,
  Text,
} from '@radix-ui/themes'

// ** THREED r3f Canvas Imports
import { ThreeDCanvas } from '#/lib/threed/components/canvas/Canvas'

// ** HELPER Components
// import Spinner from '#/layout/ui/components/spinner'
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
  // **
  // return <Spinner />
  const word: string = `[MM] ThreeDCanvasViewer @ ${new Date().toISOString()}`
  // console.debug(`%c=======================================================`, ccm.orange)
  // if (debug || DEBUG) 
  console.debug('%c🥕 ThreeDCanvasViewer ...', ccm.darkredAlert, word)
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
    <Flex 
      id='threedCanvasViewer'
      // display={'inline-flex'}
      direction={'column'}
    >

      {/* <Flex> */}

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
                className='AccordionTrigger'
              >
                <ChevronDownIcon className='AccordionChevron' aria-hidden />
                <span>Canvas 1</span>
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content 
              className='AccordionContent'
            >
              <Grid
                style={{ 
                  borderTop: '1px solid darkgreen',
                  minHeight: '30vh',
                  // display: 'flex', 
                  // alignItems: 'center', 
                  // justifyContent: 'space-between',
                  // flexDirection: 'column',
                }}
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
                className='AccordionTrigger'
              >
                <ChevronDownIcon className='AccordionChevron' aria-hidden />
                <span>Canvas 2</span>
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content 
              className='AccordionContent'
            >
              <Grid
                style={{ 
                  borderTop: '1px solid darkgreen',
                  minHeight: '15vh',
                }}
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

      {/* </Flex> */}

      {/* [MM] TESTING -- RADIX-UI.primitive.Collapsible */}
      <Flex>
        {/* <CollapsibleDemo /> */}
      </Flex>

    </Flex>
  )
}

// ** ======================================================================

// import React from 'react'
// import * as Collapsible from '@radix-ui/react-collapsible'
// import { RowSpacingIcon, Cross2Icon } from '@radix-ui/react-icons'
// import './styles.css'

const CollapsibleDemo = () => {
  const [openCanvas1, setOpenCanvas1] = useState(false)
  const [openCanvas2, setOpenCanvas2] = useState(false)
  return (
    <Flex>
      {/*  */}
      <Collapsible.Root className="CollapsibleRoot" open={openCanvas1} onOpenChange={setOpenCanvas1}>
        <div 
          style={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Collapsible.Trigger asChild>
            <button className="IconButton">{open ? <Cross2Icon /> : <RowSpacingIcon />}</button>
          </Collapsible.Trigger>
          <span className="Text">
            CANVAS 1
          </span>
        </div>
        {/*  */}
        <div className="Repository">
          <span className="Text">REPOSITORY 1: CANVAS 1</span>
        </div>
        {/*  */}
        <Collapsible.Content>
          <div className="Repository">
            <span className="Text">1: HEY HEY HEY 1</span>
          </div>
          <div className="Repository">
            <span className="Text">1: YO YO YO 1</span>
          </div>
        </Collapsible.Content>
      </Collapsible.Root>
      {/*  */}
      <Collapsible.Root className="CollapsibleRoot" open={openCanvas2} onOpenChange={setOpenCanvas2}>
        <div 
          style={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Collapsible.Trigger asChild>
            <button className="IconButton">{open ? <Cross2Icon /> : <RowSpacingIcon />}</button>
          </Collapsible.Trigger>
          <span className="Text">
            CANVAS 2
          </span>
        </div>
        {/*  */}
        <div className="Repository">
          <span className="Text">REPOSITORY 2: CANVAS 2</span>
        </div>
        {/*  */}
        <Collapsible.Content>
          <div className="Repository">
            <span className="Text">2: HEY HEY HEY 2</span>
          </div>
          <div className="Repository">
            <span className="Text">2: YO YO YO 2</span>
          </div>
        </Collapsible.Content>
      </Collapsible.Root>
    </Flex>
  )
}

// ** ======================================================================
export { CollapsibleDemo }
export default ThreeDCanvasViewer
// ** ======================================================================
