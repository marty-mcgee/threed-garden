// @ :) ts-no-check

// ** REACT Imports
import { Suspense } from 'react'

// **
// THREED: this

// THREED: COMPONENTS
// ** ThreeD: Garden
import ThreeDGarden from '~/src/lib/threed/ThreeDGarden'

// ** ThreeD using Leva GUI
import { 
  ThreeDLevaControls, 
  ThreeDLevaComponent,
} from '#/lib/threed/components/controls/LevaControls'

// ** ThreeD using Apollo + React to View Control + Info Panels (Apollo Store/ReactiveVar/State Access)
import ThreeDControlPanels from '#/lib/threed/components/controls/ControlPanels'

// ** ThreeD Toolbar
import ThreeDToolbar from '#/lib/threed/components/controls/Toolbar'

// ** ThreeD : JSX Export
export default function ThreeDComponents(): JSX.Element {

  // ** THREED CONTROL(S)
  // console.debug('THREED CONTROL[S]: ALL')
  return (
    <>
      {/* <ThreeDToolbar /> */}
      {/* <Suspense fallback={null}> */}
        <ThreeDGarden />
        <ThreeDLevaControls />
        <ThreeDLevaComponent 
          projectName={'ThreeD: MM projectName'}
          setProjectName={() => (<></>)}
          projectNameFromLeva={'ThreeD: MM projectName'}
          setProjectNameFromLeva={() => (<></>)}
        />
        <ThreeDControlPanels />
        {/* <h1>ThreeD Control[s]: All</h1> */}
      {/* </Suspense> */}
    </>
  )
}
