// 'use client'
// ==========================================================
// RESOURCES

// ** REACT Imports
import { 
  useRef,
  forwardRef,
  // useState,
  // useEffect,
} from 'react'

// ** NEXT Imports
import Image from 'next/image'

// ** APOLLO CLIENT STORE+STATE Imports
import { 
  useApolloClient, 
  useReactiveVar,
} from '@apollo/client'
import {
  isPreferencesDataSetVar,
  preferencesDataVar,
  preferencesStore,
  projectStore,
  // ...stores
} from '#/lib/api/graphql/apollo'

// ** RADIX-UI Imports
import {
  // Box,
  // Button,
  // Grid,
  Flex,
  // Text,
} from '@radix-ui/themes'

// ** THREED r3f Canvas Imports
import { ThreeDCanvas } from '#/lib/threed/components/canvas/Canvas'

// ** HELPER Components
// import Spinner from '#/layout/ui/spinner'
// ** HELPFUL UTIL: COLORFUL CONSOLE MESSAGES (ccm)
import ccm from '#/lib/utils/console-colors'

// ==========================================================

// DEBUG PREFERENCES FOR THIS MODULE
const debug: boolean = false
const DEBUG: boolean = false

// ==========================================================

const ThreeDCanvasCamera = forwardRef((
  { index = 0, canvasKey = '0', threeds = [] }: 
  { index: number, canvasKey: string, threeds: Object[] },
  refCanvas
) => {
  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        flexGrow: '1',
      }}
    >
      <ThreeDCanvas
        _id={'_r3fCanvas' + index}
        threeds={threeds}
        ref={refCanvas}
      />
    </div>
  )
}
) // end forwardRef

// ** export default
export const ThreeDCanvasViewer = () => {
  // **
  // return <Spinner />
  // const word: string = `[MM] ThreeDCanvasViewer @ ${new Date().toISOString()}`

  // ** threeds[nodes] to provide a canvas
  let threeds: Object[] = [] // threeds are nodes[] to load to canvas
  
  if (debug || DEBUG) {
    console.debug('%c🥕 ThreeDCanvasViewer ...', ccm.darkredAlert)
    // console.debug(`%c=======================================================`, ccm.black)
  }

  // ** USE CLIENT
  // const client = useApolloClient()

  // ** ⚙️ PREFERENCES STATE
  // const prefs = preferencesDataVar() // NO
  const prefs = useReactiveVar(preferencesDataVar) // YES
  // console.debug('%c⚙️ ThreeDGarden prefs', ccm.orangeAlert, prefs)

  // ** CANVAS DOM REFERENCES (REACT)
  const refThreeDCanvas1 = useRef<any>(null)
  const refThreeDCanvas2 = useRef<any>(null)
  const refThreeDCanvas3 = useRef<any>(null)

  // ** GET DATA (NOT HERE !!!)
  // let project = projectStore.store.get('one')
  // if (prefs.doAutoLoadData) {
  //   // if (debug || DEBUG) console.debug('%c🥕 TRYING... ThreeDCanvasViewer {project} ', ccm.orange)
  //   try {
  //     // const project = projectStore.store.get('one')
  //     // const project = projectStore.store.useStore('one') // causes an error, but may still be the way to go
  //     // project = async () => await projectStore.store.useStore('one') // same error
  //     if (debug || DEBUG) console.debug('%c🥕 ThreeDCanvasViewer {project} ', ccm.orange, project)
  //     // if (debug || DEBUG) console.debug('%c🥕 ThreeDCanvasViewer {project} ', ccm.orange, project())
  //     if (project) {
  //       let project_title = project?.data?.title ? project.data.title : 'NOTHING YET, SIR: NOPE NOPE NOPE'
  //       // if (debug || DEBUG) console.debug('%c🥕 ThreeDCanvasViewer {project}.project_title ', ccm.orange, project_title)
  //       if (project.data.plans) {
  //         let nodesToLoad: [] = []
  //         // ** [MM] HEY HEY HEY
  //             nodesToLoad = project.data.plans.nodes[0].threedsActive.nodes
  //         // ** [MM] HEY HEY HEY
  //         // if (debug || DEBUG) console.debug('%c🥕 ThreeDCanvasViewer {project}.[nodesToLoad] ', ccm.orange, nodesToLoad)
  //         // ** [MM] HEY HEY HEY
  //         if (nodesToLoad) {
  //           // ** SET threeds[]
  //           // ** [MM] HEY HEY HEY
  //           threeds = nodesToLoad
  //           // ** [MM] HEY HEY HEY
  //           if (debug || DEBUG) console.debug('%c🥕 ThreeDCanvasViewer [nodesToLoad] as [threeds] ', ccm.orange, threeds)
  //         }
  //         // ** [MM] HEY HEY HEY
  //       }
  //     }
  //   } catch (ERROR) {
  //     console.error(ERROR)
  //   }
  // }
  

  // RETURN JSX
  return (
    <Flex 
      id='threedCanvasViewer'
      // display={'inline-flex'}
      // direction={'column'}
      style={{ 
        display: 'inline-flex', 
        flexDirection: 'row',
        flexGrow: '1',
        width: '100%',
        height: '100%',
        minHeight: '20vh',
        // maxHeight: '60vh',
        // minWidth: '50vw',
        // maxWidth: '90vw',
      }}
    >

      {/* CANVAS[ES] as accordion */}

      {/* THREED CANVAS VIEWER 1 */}
      {/* <Accordion.Root 
        key={'Canvas1'} 
        // type='multiple' // single | multiple
        type='single'
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
      > */}
        {/* THREED CANVAS 1 : CAMERA 1 */}
        <ThreeDCanvasCamera 
          index={1} 
          canvasKey={'1'}
          threeds={threeds}
          ref={refThreeDCanvas1}
        />
        {/* THREED CANVAS 1 : CAMERA 2 */}
        {/* <ThreeDCanvasCamera 
          index={2} 
          canvasKey={'1'}
          threeds={threeds} 
          ref={refThreeDCanvas1}
        /> */}
        {/* THREED CANVAS 1 : CAMERA 3 */}
        {/* <ThreeDCanvasCamera 
          index={3} 
          canvasKey={'1'}
          threeds={threeds}
          ref={refThreeDCanvas1}
        /> */}
        {/**/}
      {/* </Accordion.Root> */}

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
          ref={refThreeDCanvas2}
        /> */}
        {/* THREED CANVAS 2 : CAMERA 2 */}
        {/* <ThreeDCanvasCamera 
          index={5} 
          threeds={threeds} 
          ref={refThreeDCanvas2}
        /> */}
        {/* THREED CANVAS 2 : CAMERA 3 */}
        {/* <ThreeDCanvasCamera 
          index={6} 
          threeds={threeds}
          ref={refThreeDCanvas2}
        /> */}
        {/**/}
      {/* </Accordion.Root> */}

      {/* [MM] HEY HEY HEY
        * [MM] TESTING -- RADIX-UI.primitive.Collapsible */}
      {/* <CollapsibleDemo /> */}

    </Flex>
  )
}

// ** ======================================================================

// import React from 'react'
// import * as Collapsible from '@radix-ui/react-collapsible'
// import { RowSpacingIcon, Cross2Icon } from '@radix-ui/react-icons'
// import './styles.css'

// const CollapsibleDemo = () => {
//   const [openCanvas1, setOpenCanvas1] = useState(false)
//   const [openCanvas2, setOpenCanvas2] = useState(false)
//   return (
//     <Flex>
//       {/*  */}
//       <Collapsible.Root className="CollapsibleRoot" open={openCanvas1} onOpenChange={setOpenCanvas1}>
//         <div 
//           style={{ 
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'space-between',
//           }}
//         >
//           <Collapsible.Trigger asChild>
//             <button className="IconButton">{open ? <Cross2Icon /> : <RowSpacingIcon />}</button>
//           </Collapsible.Trigger>
//           <span className="Text">
//             CANVAS 1
//           </span>
//         </div>
//         {/*  */}
//         <div className="Repository">
//           <span className="Text">REPOSITORY 1: CANVAS 1</span>
//         </div>
//         {/*  */}
//         <Collapsible.Content>
//           {/* <div className="Repository">
//             <span className="Text">1: HEY HEY HEY 1</span>
//           </div>
//           <div className="Repository">
//             <span className="Text">1: YO YO YO 1</span>
//           </div> */}
//           {/* THREED CANVAS 1 : CAMERA 7 */}
//           <ThreeDCanvasCamera 
//             index={7} 
//             canvasKey={'1'}
//             threeds={[]} 
//           />
//         </Collapsible.Content>
//       </Collapsible.Root>
//       {/*  */}
//       <Collapsible.Root className="CollapsibleRoot" open={openCanvas2} onOpenChange={setOpenCanvas2}>
//         <div 
//           style={{ 
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'space-between',
//           }}
//         >
//           <Collapsible.Trigger asChild>
//             <button className="IconButton">{open ? <Cross2Icon /> : <RowSpacingIcon />}</button>
//           </Collapsible.Trigger>
//           <span className="Text">
//             CANVAS 2
//           </span>
//         </div>
//         {/*  */}
//         <div className="Repository">
//           <span className="Text">REPOSITORY 2: CANVAS 2</span>
//         </div>
//         {/*  */}
//         <Collapsible.Content>
//           {/* <div className="Repository">
//             <span className="Text">2: HEY HEY HEY 2</span>
//           </div>
//           <div className="Repository">
//             <span className="Text">2: YO YO YO 2</span>
//           </div> */}
//           {/* THREED CANVAS 2 : CAMERA 8 */}
//           <ThreeDCanvasCamera 
//             index={8}
//             canvasKey={'2'}
//             threeds={[]} 
//           />
//         </Collapsible.Content>
//       </Collapsible.Root>
//     </Flex>
//   )
// }

// ** ======================================================================

// module properties
ThreeDCanvasViewer.displayName = 'ThreeD-CanvasViewer'

// export { CollapsibleDemo }
export default ThreeDCanvasViewer