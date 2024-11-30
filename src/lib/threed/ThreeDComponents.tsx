

// ** REACT Imports
// import {
//   useRef,
// } from 'react'

// ** PANELS Imports
import { 
  Panel, 
  PanelGroup,
  PanelResizeHandle,
} from 'react-resizable-panels'
import PanelResizeHandleHorizontal from '#/layout/ui/resize-handle'

// THREED: COMPONENTS
// ** ThreeD: Garden
// import ThreeDGarden from '#/lib/threed/ThreeDGarden'
import ThreeDCanvasViewer from '#/lib/threed/components/canvas/CanvasViewer'

// ** ThreeD using Leva GUI
import { 
  ThreeDLevaControls, 
  ThreeDLevaComponent,
} from '#/lib/threed/components/controls/LevaControls'

// ** ThreeD using Apollo + React to View Control + Info Panels 
// ** (Apollo Store/ReactiveVar/State Access)
import ThreeDControlPanels from '#/lib/threed/components/controls/ControlPanels'

// ** ThreeD Toolbar
import ThreeDToolbar from '#/lib/threed/components/controls/Toolbar'

// ** return : JSX
export default function ThreeDComponents(): JSX.Element {
  // ** THREED COMPONENTS
  // console.debug('THREED COMPONENT[S]: ALL')

  // const refThreeDCanvas1 = useRef<any>(null)
  // const refThreeDCanvas2 = useRef<any>(null)
  // const refThreeDCanvas3 = useRef<any>(null)

  return (
    <PanelGroup
      direction='vertical'
      style={{
        // minHeight: '300px',
        // minHeight: '50vh',
        // minHeight: '50%',
        // height: '100%',
        // border: '1px solid darkgreen',
      }}
    >

      {/* THREED TOOLBAR */}
      <Panel
        defaultSize={10}
        minSize={10}
        maxSize={10}
        style={{
          // height: '100px',
          // border: '1px solid green',
        }}
      >
        <ThreeDToolbar />
      </Panel>

      <PanelResizeHandle />

      {/* THREED GARDEN (CANVAS + EXPERIENCE) */}
      <Panel
        defaultSize={60}
        minSize={60}
        maxSize={60}
        style={{
          // height: '100px',
          // border: '1px solid green',
        }}
      >
        <ThreeDCanvasViewer />
        {/* <ThreeDGarden /> */}
          {/* <ThreeDCanvas
            _id={'_r3fCanvas' + index}
            threeds={threeds}
            ref={refThreeDCanvas1}
          /> */}
      </Panel>

      <PanelResizeHandle />

      {/* THREED CONTROLS */}
      <Panel
        defaultSize={30}
        minSize={30}
        maxSize={30}
        style={{
          // height: '100px',
          // border: '1px solid green',
        }}
      >
        <ThreeDLevaControls />
        <ThreeDLevaComponent 
          projectName={'ThreeD: MM projectName'}
          setProjectName={() => (<></>)}
          projectNameFromLeva={'ThreeD: MM projectName'}
          setProjectNameFromLeva={() => (<></>)}
        />
        <ThreeDControlPanels />
      </Panel>

      {/* <PanelResizeHandle /> */}

      {/* TESTING PANEL */}
      {/* <Panel
        defaultSize={10}
        maxSize={10}
        style={{
          // height: '100px',
          // border: '1px solid green',
        }}
      >
        <h6>ThreeD Component[s]: All</h6>
      </Panel> */}

    </PanelGroup>
  )
}
