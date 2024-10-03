// @ :) ts-no-check

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
// const ThreeDControlPanels = dynamic(() => import('#/lib/threed/components/controls/ControlPanels'), { ssr: false })

// ** ThreeD Toolbar
import ThreeDToolbar from '#/lib/threed/components/controls/Toolbar'

// ** ThreeD : JSX Export
// export default
const ThreeDControls = () => {

  // ** THREED CONTROL(S)
  // console.debug('THREED CONTROL[S]: ALL')
  return (
    <>
      <ThreeDLevaControls />
      <ThreeDControlPanels />
      <ThreeDToolbar />
      <ThreeDGarden />
      <ThreeDLevaComponent 
        projectName={'ThreeD: MM projectName'}
        setProjectName={() => (<></>)}
        projectNameFromLeva={'ThreeD: MM projectName'}
        setProjectNameFromLeva={() => (<></>)}
      />
      {/* <h1>ThreeD Control[s]: All</h1> */}
    </>
  )
}

export default ThreeDControls
