


// ** PANELS Imports
import { 
  Panel, 
  PanelGroup,
  PanelResizeHandle,
} from 'react-resizable-panels'
import PanelResizeHandleHorizontal from '#/layout/ui/resize-handle'

// THREED: COMPONENTS
// ** ThreeD: Garden
import ThreeDGarden from '~/src/lib/threed/ThreeDGarden'

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
  // ** THREED CONTROL(S)
  // console.debug('THREED CONTROL[S]: ALL')
  return (
    <>
    <PanelGroup
      direction='vertical'
      style={{
        minHeight: '100px',
        // border: '1px solid green',
      }}
    >
      <Panel
        defaultSize={10}
        maxSize={10}
        style={{
          // height: '100px',
          // border: '1px solid green',
        }}
      >
        <ThreeDToolbar />
      </Panel>
      <PanelResizeHandle />
      <Panel
        defaultSize={40}
        maxSize={100}
        style={{
          // height: '100px',
          // border: '1px solid green',
        }}
      >
        <ThreeDGarden />
          {/* <ThreeDCanvas
            _id={'_r3fCanvas' + index}
            threeds={threeds}
          /> */}
      </Panel>
      <PanelResizeHandle />
      <Panel
        defaultSize={40}
        maxSize={100}
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
      <PanelResizeHandle />
      <Panel
        defaultSize={10}
        maxSize={10}
        style={{
          // height: '100px',
          // border: '1px solid green',
        }}
      >
        <h6>ThreeD Control[s]: All</h6>
      </Panel>
    </PanelGroup>
    </>
  )
}
