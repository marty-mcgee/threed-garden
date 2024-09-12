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
import { useEffect } from 'react'

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

const ThreeDCanvasCamera = (
  { index = 0, canvasKey = '0', threeds = [] }: 
  { index: number, canvasKey: string, threeds: any[] }
) => {
  return (
    <Accordion.Item 
      value={'Canvas 1 Camera ' + index}
      className='AccordionItem'
      style={{ 
        // borderTop: '1px solid darkgreen',
        // height: '100%',
        // minHeight: '30%',
        // minHeight: '100vh',
        // display: 'flex', 
        // alignItems: 'start', 
        // justifyContent: 'space-between',
        // flexDirection: 'row',
        // width: '100%',
        // minHeight: '40vh',
        // maxHeight: '50vh',
        // minWidth: '50vw',
        // maxWidth: '90vw',
      }}
    >
      <Accordion.Header
        className='AccordionHeader'
      >
        <Flex
          id={'threed_configs_overlays_' + index}
          direction='row'
        > 
          {/* ⚙️ &#x2699; */}
          {
            // !config.config && 
            // <img className={"gear"} src={'/favicon/favicon-16x16.png'} // {ASSETS.other.gear}
            <img className={'gear'} src={'/images/icons/gear.svg'} width={16} height={16}
              style={{ color: 'gray', backgroundColor: 'darkgreen', paddingLeft: '10px', paddingRight: '10px', paddingTop: '2px', paddingBottom: '2px' }}
              // onClick={() => setConfig({ ...config, config: true })} 
            />
          }

          {/* <PublicOverlay {...common} /> */}

          {/* {
            config.config &&
            <PrivateOverlay {...common} />
          } */}

          {/* <span className={"tool-tip"} hidden={!toolTip.text}>
            {toolTip.text}
          </span> */}

          <Accordion.Trigger 
            className='AccordionTrigger'
          >
            {/* <ChevronDownIcon 
              className='AccordionChevron' 
              aria-hidden 
            /> */}
            <span style={{ position: 'relative' }}>
              Camera {index}
            </span>
          </Accordion.Trigger>
          
        </Flex>
      </Accordion.Header>

      <Accordion.Content 
        // className='AccordionContent'
        style={{ 
          // borderTop: '1px solid darkgreen',
          // height: '100%',
          height: '48vh',
          // minHeight: '40%',
          // maxHeight: '40vh',
          // width: '100%',
          // minWidth: '100%',
          // maxWidth: '90vw',
        }}
      >

        <ThreeDCanvas
          _id={'_r3fCanvas' + index}
          threeds={threeds}
        />
        
      </Accordion.Content>
    </Accordion.Item>
  )
}

// ** export default
export const ThreeDCanvasViewer = () => {
  // **
  // return <Spinner />
  const word: string = `[MM] ThreeDCanvasViewer @ ${new Date().toISOString()}`
  // console.debug(`%c=======================================================`, ccm.orange)
  // if (debug || DEBUG) 
  console.debug('%c🥕 ThreeDCanvasViewer ...', ccm.darkredAlert)
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
    <Grid 
      id='threedCanvasViewer'
      // display={'inline-flex'}
      // direction={'column'}
      style={{ 
        // display: 'flex', 
        // flexDirection: 'row',
        // minHeight: '40vh',
        // maxHeight: '60vh',
        // minWidth: '50vw',
        // maxWidth: '90vw',
        // width: '100%',
      }}
    >

      {/* CANVAS[ES] as accordion */}

      {/* THREED CANVAS VIEWER 1 */}
      <Accordion.Root 
        key={'Canvas1'} 
        type='multiple' // single | multiple
        // orientation='horizontal' // vertical | horizontal 
        // @ts-expect-error
        collapsible={'true'} // string 'true' | 'false' -- bug: should be boolean, not string
        defaultValue={[
          'Canvas 1 Camera 1', 
          // 'Canvas 1 Camera 2',
          // 'Canvas 1 Camera 3',
          // 'Canvas 2 Camera 4',
          // 'Canvas 2 Camera 5',
          // 'Canvas 2 Camera 6',
        ]}
        // value={tabControlValue}
        // onChange={onChangeTabControlValue}
        aria-label='ThreeD Canvas Viewer 1'
        className='AccordionRoot'
        style={{ 
          // display: 'flex', 
          // flexDirection: 'row',
          // minHeight: '40vh',
          // maxHeight: '60vh',
          // minWidth: '50vw',
          // maxWidth: '90vw',
          // width: '100%',
        }}
      >
        {/* THREED CANVAS 1 : CAMERA 1 */}
        <ThreeDCanvasCamera 
          index={1} 
          canvasKey={'1'}
          threeds={threeds} 
        />
        {/* THREED CANVAS 1 : CAMERA 2 */}
        <ThreeDCanvasCamera 
          index={2} 
          canvasKey={'1'}
          threeds={threeds} 
        />
        {/* THREED CANVAS 1 : CAMERA 3 */}
        <ThreeDCanvasCamera 
          index={3} 
          canvasKey={'1'}
          threeds={threeds}
        />
        {/**/}
      </Accordion.Root>

      {/* THREED CANVAS VIEWER 2 */}
      {/* <Accordion.Root 
        key={'Canvas2'} 
        type='multiple' // single | multiple
        // orientation='horizontal' // vertical | horizontal 
        // @ts-expect-error
        collapsible={'true'} // string 'true' | 'false' -- bug: should be boolean, not string
        defaultValue={['Canvas 1 Camera 1', 'Canvas 1 Camera 2']} // , 'Canvas 1 Camera 3'
        // value={tabControlValue}
        // onChange={onChangeTabControlValue}
        aria-label='ThreeD Canvas Viewer 2'
        className='AccordionRoot'
        style={{ 
          // display: 'flex', 
          // flexDirection: 'row',
          // minHeight: '40vh',
          // maxHeight: '60vh',
          // minWidth: '50vw',
          // maxWidth: '90vw',
          // width: '100%',
        }}
      > */}
        {/* THREED CANVAS 2 : CAMERA 1 */}
        {/* <ThreeDCanvasCamera 
          index={4} 
          threeds={threeds} 
        /> */}
        {/* THREED CANVAS 2 : CAMERA 2 */}
        {/* <ThreeDCanvasCamera 
          index={5} 
          threeds={threeds} 
        /> */}
        {/* THREED CANVAS 2 : CAMERA 3 */}
        {/* <ThreeDCanvasCamera 
          index={6} 
          threeds={threeds}
        /> */}
        {/**/}
      {/* </Accordion.Root> */}

      {/* [MM] HEY HEY HEY
        * [MM] TESTING -- RADIX-UI.primitive.Collapsible */}
      {/* <CollapsibleDemo /> */}

    </Grid>
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
          {/* <div className="Repository">
            <span className="Text">1: HEY HEY HEY 1</span>
          </div>
          <div className="Repository">
            <span className="Text">1: YO YO YO 1</span>
          </div> */}
          {/* THREED CANVAS 1 : CAMERA 7 */}
          <ThreeDCanvasCamera 
            index={7} 
            canvasKey={'1'}
            threeds={[]} 
          />
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
          {/* <div className="Repository">
            <span className="Text">2: HEY HEY HEY 2</span>
          </div>
          <div className="Repository">
            <span className="Text">2: YO YO YO 2</span>
          </div> */}
          {/* THREED CANVAS 2 : CAMERA 8 */}
          <ThreeDCanvasCamera 
            index={8}
            canvasKey={'2'}
            threeds={[]} 
          />
        </Collapsible.Content>
      </Collapsible.Root>
    </Flex>
  )
}

// ** ======================================================================
export { CollapsibleDemo }
export default ThreeDCanvasViewer
// ** ======================================================================
