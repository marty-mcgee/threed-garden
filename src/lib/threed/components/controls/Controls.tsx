// @ts-no-check

// ** ThreeD using Leva GUI
import { ThreeDLevaControls, ThreeDLevaComponent } from '#/lib/threed/components/controls/LevaControls'

// ** ThreeD using Apollo + React to View Control + Info Panels (Apollo Store/ReactiveVar/State Access)
import ThreeDControlPanels from '#/lib/threed/components/controls/ControlPanels'
// const ThreeDControlPanels = dynamic(() => import('#/lib/threed/components/controls/ControlPanels'), { ssr: false })

// ** ThreeD Toolbar
import ThreeDToolbar from '#//lib/threed/components/controls/Toolbar'



const ThreeDControls = () => {

  return (
    <>
      {/* <h1>ThreeD Controls</h1> */}
      <ThreeDLevaControls />
    </>
  )
}

export default ThreeDControls
