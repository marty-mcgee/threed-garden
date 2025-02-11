'use client'
// ^ needs the 'use client' pragma (inheriting from parent page)
// ==============================================================
// ** RESOURCES

// ** NEXT Imports
// import dynamic from 'next/dynamic'
// import Image from 'next/image'

// ** NEXT AUTH Imports
// hint: const { data, data: session, status } = useSession()
// import { useSession } from 'next-auth/react'

// ** REACT Imports
import {
  // useRef,
  // forwardRef,
  // useEffect,
  useState,
  // useCallback,
  // ReactNode,
  // Suspense,
  // PointerEventHandler,
  // SyntheticEvent,
} from 'react'

// // ** APOLLO Imports
// import { 
//   useApolloClient,
//   useReactiveVar,
// } from '@apollo/client'
// import {
//   // stores,
//   preferencesStore,
//   projectStore,
//   // queries,
//   // mutations,
//   // reactive vars:
//   isPreferencesDataSetVar,
//   preferencesDataVar,
// } from '#/lib/api/graphql/apollo'

// // ** RADIX-UI Imports
// import {
//   Button,
//   Text,
// } from '@radix-ui/themes'


// ** ThreeD r3f Canvas Imports
import ThreeDCanvasViewer from '#/lib/threed/components/canvas/CanvasViewer'

// ** ThreeD Controls Imports
// import ThreeDControls from '~/src/lib/threed/Controls'

// ** ThreeD Leva Controls
import { ThreeDLevaControls, ThreeDLevaComponent } from '#/lib/threed/components/controls/LevaControls'

// ** ThreeD using Apollo + React to View Control + Info Panels (Apollo Store/ReactiveVar/State Access)
import ThreeDControlPanels from '#/lib/threed/components/controls/ControlPanels'
// const ThreeDControlPanels = dynamic(() => import('#/lib/threed/components/controls/ControlPanels'), { ssr: false })

// ** ThreeD Toolbar
import ThreeDToolbar from '#/lib/threed/components/controls/Toolbar'

// ** ThreeD Modal Imports
// import ThreeDModals from '#/lib/threed/components/modals/Modals'

// ** ThreeD View Imports
import ThreeDViews from '#/lib/threed/components/views/ViewsFurniture'
// import ThreeDViews from '#/lib/threed/components/views/ViewsPools'
// import ThreeDViews from '#/lib/threed/components/views/ViewsCities'

// ** ThreeD Joystick Imports
// import { EcctrlJoystick } from '#/lib/ecctrl/src/EcctrlJoystick'

// ** FARMBOT Imports
// import ThreeDFarmBot from '#/lib/farmbot/FarmBot'
// const ThreeDFarmBot = dynamic(() => import('#/lib/farmbot/FarmBot'), { ssr: false })
// const ThreeDFarmBotMain = dynamic(() => import('#/lib/threed/threed-farmbot/main'), { ssr: false })

// ** HELPER Components
import Spinner from '#/layout/ui/spinner'
// ** HELPFUL UTIL: COLORFUL CONSOLE MESSAGES (ccm)
import ccm from '#/lib/utils/console-colors'

// ==========================================================
// IMPORTS COMPLETE
// ==========================================================

// DEBUG PREFERENCES FOR THIS MODULE
const debug: boolean = false
const DEBUG: boolean = false

// const appVersion: string = 'v0.16.1'
const appVersion: string = require('package.json').version

if (debug || DEBUG) {
  console.debug('%c🥕 ThreeDGarden<FC,R3F>: {.tsx}', ccm.green)
  console.debug('%c🌱 appVersion', ccm.darkgreen, appVersion)
  console.debug(`%c====================================`, ccm.darkgreen)
}

// ==========================================================
// TS INTERFACES + TYPES
// ==========================================================

interface IPostData {
  plugin_name: string
  plugin_version: string
  plugin_url: string
  api_gql_url: string
  api_rest_url: string
  theme: 'dark' | 'light'
  world_id: number | string
  scene_id: number | string
}

interface IThreeDEnv {
  pluginName: string
  pluginVersion: string
  pluginURL: string
  apiGqlUrl: string
  apiRestUrl: string
  theme: 'light' | 'dark'
  worldID: number | string
  sceneID: number | string
}

// interface IPlayer {
//   action: string
//   actionTime: number | Date
//   object: THREE.Object3D
//   mixer: THREE.AnimationMixer
//   setAction: Function
//   getAction: Function
//   toggleAnimation: Function
//   move: Function
//   movePlayer: Function
//   playerControl: Function
// }

// ==========================================================
// JS VARIABLES
// ==========================================================

const postdata: IPostData = {
  plugin_name:    'ThreeD Garden',
  plugin_version: appVersion,
  plugin_url:     'https://threed.design/',
  api_gql_url:    'https://threed.design/graphql/',
  api_rest_url:   'https://threed.design/wp-json/wp/v2/',
  theme:          'dark', // dark | light
  world_id:       0, // default
  scene_id:       0, // default
}

const env: IThreeDEnv = {
  pluginName:     postdata.plugin_name,
  pluginVersion:  postdata.plugin_version,
  pluginURL:      postdata.plugin_url,
  apiGqlUrl:      postdata.api_gql_url,
  apiRestUrl:     postdata.api_rest_url,
  theme:          postdata.theme,
  worldID:        postdata.world_id,
  sceneID:        postdata.scene_id,
}

if (debug || DEBUG) {
  console.debug('%c🌱 api plugin:', ccm.darkgreen, env.pluginName, env.pluginVersion, postdata)
  console.debug('postdata', postdata)
  console.debug(`%c====================================`, ccm.darkgreen)
}

// ==========================================================
// FUNCTIONAL STORES + NOUNS
// ==========================================================
// ==========================================================
// COMPONENTS

// ** HTML Modal Windows
// const {
//   ModalAbout,
//   ModalLoading,
//   ModalModel3d,
//   ModalShare
// } = ThreeDModals

// ** Views
// const {
//   CatalogView,
//   PlanView,
//   PropertiesView,
//   TheBottom
// } = ThreeDViews

// ==========================================================

// const ThreeDGarden = ({ session }: { session: Session | null }): JSX.Element => {
// const ThreeDGarden = ({...props}): JSX.Element => {
// const ThreeDGarden = ({threedData}): JSX.Element => {
const ThreeDGarden = (): JSX.Element => {
// const ThreeDGarden = (): React.ReactNode => {
  
  // **

  // const EcctrlJoystickControls = () => {
  //   // const [isTouchScreen, setIsTouchScreen] = useState(false)
  //   // useEffect(() => {
  //   //   // Check if using a touch control device, show/hide joystick
  //   //   if (('ontouchstart' in window) || (navigator.maxTouchPoints > 0)) {
  //   //     setIsTouchScreen(true)
  //   //   } else {
  //   //     setIsTouchScreen(false)
  //   //   }
  //   // }, [])
  //   // ** always|never a touch screen
  //   const [isTouchScreen, setIsTouchScreen] = useState(false)
  //   return (
  //     <>
  //     { isTouchScreen && 
  //       <EcctrlJoystick buttonNumber={5} />
  //     }
  //     </>
  //   )
  // }

  // ==========================================================
  // ** RETURN JSX
  return (
    <>

      {/* THREED: TOOLBAR */}
      <ThreeDToolbar />
      
      {/* THREED: CANVAS VIEWER */}
      <ThreeDCanvasViewer
        // ref={refThreeDCanvas1}
      />

      {/* THREED: CONTROLS: LEVA GUI + CUSTOMIZED */}
      {/* <ThreeDLevaControls /> */}
      
      {/* THREED: CONTROL PANELS */}
      <ThreeDControlPanels />
    
      
      {/* THREED: CONTROLS: ALL */}
      {/* <ThreeDControls /> */}
      {/* THREED: CONTROLS: CLICK LOADERS */}
      {/* <Button onClick={() => loadNounData('project', [])}>load project</Button> */}
      {/* <Button onClick={() => loadNounData('scene', [])}>load scene</Button> */}
      {/* <Button onClick={() => loadNounData('character', [])}>load character</Button> */}
      {/* <Button onClick={() => loadNounData('farmbot', [])}>load farmbot</Button> */}
        
      {/* THREED: VIEWS */}
      {/* <CatalogView /> */}
      {/* <PropertiesView /> */}
      {/* <PlanView /> */}
      {/* <TheBottom /> */}

      {/* THREED: MODALS */}
      {/* <ModalAbout /> */}
      {/* <ModalModel3d /> */}
      {/* <ModalLoading /> */}
      {/* <ModalShare /> */}

      {/* THREED FARMBOT */}
      {/* <ThreeDFarmBotMain /> */}
      
      {/* THREED: CHARACTER CONTROLS: JOYSTICK */}
      {/* CHARACTER CONTROL JOYSTICK */}
      {/* <EcctrlJoystick buttonNumber={0} /> */}
      {/* <EcctrlJoystick buttonNumber={5} /> */}
      {/* <EcctrlJoystickControls /> */}

    </>
  )
}

export default ThreeDGarden
