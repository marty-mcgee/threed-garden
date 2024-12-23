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
  useEffect,
  useState,
  // useCallback,
  // ReactNode,
  // Suspense,
  PointerEventHandler,
  SyntheticEvent,
} from 'react'

// ** APOLLO Imports
// ** Apollo Client 3 -- State Management using Cache/Store (via GraphQL)
import { 
  useApolloClient,
  useReactiveVar,
  // getApolloClient, 
  // getApolloContext,
} from '@apollo/client'
// import {
//   useQuery,
//   useSuspenseQuery,
//   useBackgroundQuery,
//   useReadQuery,
//   useFragment
// } from '@apollo/experimental-nextjs-app-support/ssr'
import {
  // stores,
  preferencesStore,
  projectStore,
  // queries,
  // mutations,
  // reactive vars:
  isPreferencesSetVar,
  preferencesDataVar,
} from '#/lib/api/graphql/apollo'

// ** RADIX-UI Imports
import {
  Button,
  Text,
} from '@radix-ui/themes'

// ** THREE JS Imports (not here, use R3F)
import * as THREE from 'three'
// ** Three JS Loading Progress
// import { Html, Loader, useProgress } from '@react-three/drei'

// ** ThreeD r3f Canvas Imports
import ThreeDCanvasViewer from '#/lib/threed/components/canvas/CanvasViewer'
// const ThreeDCanvasViewer = dynamic(() => import('#/lib/threed/components/canvas/CanvasViewer'), { ssr: false })
// import { Canvas } from '@react-three/fiber'
// import { ThreeDCanvasViewer } from '#/lib/threed/components/canvas/Canvas'
// import { ThreeDCanvas } from '#/lib/threed/components/canvas/Canvas'
// import { ThreeDEnvironment } from '#/lib/threed/components/canvas/Canvas'

// ** ThreeD Controls Imports
// import ThreeDControls from '~/src/lib/threed/Controls'

// ** ThreeD Leva Controls
import { ThreeDLevaControls, ThreeDLevaComponent } from '#/lib/threed/components/controls/LevaControls'

// ** ThreeD using Apollo + React to View Control + Info Panels (Apollo Store/ReactiveVar/State Access)
import ThreeDControlPanels from '#/lib/threed/components/controls/ControlPanels'
// const ThreeDControlPanels = dynamic(() => import('#/lib/threed/components/controls/ControlPanels'), { ssr: false })

// ** ThreeD Toolbar
import ThreeDToolbar from '#//lib/threed/components/controls/Toolbar'

// ** ThreeD Modal Imports
// import ThreeDModals from '#/lib/threed/components/modals/Modals'

// ** ThreeD View Imports
import ThreeDViews from '#/lib/threed/components/views/ViewsFurniture'
// import ThreeDViews from '#/lib/threed/components/views/ViewsPools'
// import ThreeDViews from '#/lib/threed/components/views/ViewsCities'

// ** ThreeD Joystick Imports
import { EcctrlJoystick } from '#/lib/ecctrl/src/EcctrlJoystick'

// ** CSS Styles Imports
// import stylesDemo from '#/layout/ui/styles/demo/demo.module.css'

// ** Paper Imports (DEPRECATED -- requires jQuery)
// import paper from 'paper'

// ** jQuery Imports (DEPRECATED -- no no no, never again)
// import * as $ from 'jquery'

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
const DEBUG: boolean = true

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

if (debug) {
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
const {
  CatalogView,
  PlanView,
  PropertiesView,
  TheBottom
} = ThreeDViews

// ==========================================================

// const ThreeDGarden = ({ session }: { session: Session | null }): JSX.Element => {
// const ThreeDGarden = ({...props}): JSX.Element => {
// const ThreeDGarden = ({threedData}): JSX.Element => {
const ThreeDGarden = (): JSX.Element => {
// const ThreeDGarden = (): React.ReactNode => {
  // **
  // ==========================================================
  // ** TESTING: JSX
  // return <Spinner />

  // ==========================================================
  // ** LOCAL VARS
  // const word: string = `[MM] HEY HEY HEY @ ${new Date().toISOString()}`

  // ==========================================================
  // ** HOOKS

  // ** USE SESSION
  // // const { data, status } = useSession()
  // const { data: sessionData, status: sessionStatus } = useSession()
  // console.debug('useSession().data', sessionData)
  // console.debug('useSession().status', sessionStatus)

  // ** USE CLIENT
  const client = useApolloClient()
  // console.debug('%c🦆 useApolloClient()', ccm.redAlert, client)

  // ** USE PREFERENCES
  // const prefs = preferencesDataVar() // NO
  const prefs = useReactiveVar(preferencesDataVar) // YES !!
  // console.debug('%c⚙️ ThreeD Garden prefs', ccm.orangeAlert, prefs)

  // ** INIT PREFERENCES
  const [isPageLoaded, setIsPageLoaded] = useState(false)
  const [isPrefsLoaded, setIsPrefsLoaded] = useState(useReactiveVar(isPreferencesSetVar))

  // ** refs moved to ThreeDCanvasViewer
  // const refThreeDCanvas1 = useRef<any>(null)
  // const refThreeDCanvas2 = useRef<any>(null)
  // const refThreeDCanvas3 = useRef<any>(null)

  // ==========================================================
  // Component onMount hook
  // **
  useEffect(() => {

    if (!isPageLoaded || !isPrefsLoaded) {
    
      // ** GET PREFERENCES
      const fetchData = async () => {
        try {
          // ** GET PREFERENCES
          if (!isPrefsLoaded) {
            // **
            const preferencesFromDataSource = await preferencesStore.actions.loadFromDataSource(client)
            // const preferencesFromDataSource = await preferencesStore.actions.loadFromDB(client)
            if (DEBUG) 
              console.debug('%c preferences loading...', ccm.greenAlert)
            if (preferencesFromDataSource) {
              if (DEBUG) 
                console.debug('%c preferencesFromDataSource', ccm.greenAlert)
            }
          }

          const loadPreferencesOne = await preferencesStore.store.get('one')
          // const loadPreferencesOne = await preferencesStore.store.useStore('one')
          // console.debug('%c🦆 APOLLO STORE: get one preferences => loadPreferencesOne', ccm.redAlert, loadPreferencesOne)
          preferencesDataVar(loadPreferencesOne.data)
          // console.debug('%c🦆 APOLLO STORE: FETCH preferencesDataVar()', ccm.redAlert, preferencesDataVar())
          isPreferencesSetVar(true)
          setIsPrefsLoaded(isPreferencesSetVar())
          // console.debug('%c🦆 APOLLO STORE: FETCH isPreferencesSetVar()', ccm.redAlert, isPreferencesSetVar())
          // if (preferencesDataVar().doAutoLoadData) {
          //   // const projectsFromDataSource = await projectStore.actions.loadFromDataSource(client)
          //   const projectsFromDataSource = await projectStore.actions.loadFromDB(client)
          //   if (DEBUG) 
          //     console.debug('%c projects loading...', ccm.orangeAlert)
          //   if (projectsFromDataSource) {
          //     // console.debug('%c🥕 projectsFromDataSource', ccm.redAlert)
          //     // ** TODO
          //     // ** do more tasks here ??
          //   }
          // }

          // ** READY TO GO ???
          setIsPageLoaded(true)

        } catch (error) {
          console.error('Error fetching data:', error);
        }
      }      
      fetchData()
      if (DEBUG) {
        console.debug('%c🫙 ThreeDGarden: fetching data ...', ccm.blueAlert)
      }
      // // ** LOAD NOUN FROM WP API VIA APOLLO INTO R3F + LEVA (+ VALTIO)
      // const loadNounData = (_type: string = 'project', threeds: any = []) => {
      //   // load these threeds into r3f canvas
      //   if (DEBUG || debug) 
      //     console.debug('%c🌱 ThreeDGarden loadNounData()', ccm.yellowAlert, _type, threeds)
      //   if (_type === 'project') {
      //     projectStore.actions.loadToCanvas(threeds, '_r3fCanvas1')
      //   }
      //   // return <Box>true</Box> // true
      // }
      
    } else if (isPageLoaded) {
      console.debug('%c🦆 ThreeDGarden => LOADED !!', ccm.greenAlert, isPageLoaded)
    } else {
      console.debug('%c🦆 ThreeDGarden => APOLLO STORE: preferencesDataVar()', ccm.redAlert, preferencesDataVar())
    }

  }, []) // useEffect

  // ==========================================================
  // ** USE CONTEXT
  // const abilities = useContext(AbilityContext)
  // const abilities = ['read', 'write', 'delete']

  // ==========================================================

  // if (DEBUG || debug) 
  //   console.debug('%c🌱 ThreeDGarden mounting ...', ccm.darkgreenAlert)

    
  let project_title = 'NOT EVEN CLOSE'
  // if (DEBUG || debug) 
  //   console.debug('%c🌱 ThreeDGarden mounting ...', ccm.darkgreen, project_title)


  


  const EcctrlJoystickControls = () => {
    // const [isTouchScreen, setIsTouchScreen] = useState(false)
    // useEffect(() => {
    //   // Check if using a touch control device, show/hide joystick
    //   if (('ontouchstart' in window) || (navigator.maxTouchPoints > 0)) {
    //     setIsTouchScreen(true)
    //   } else {
    //     setIsTouchScreen(false)
    //   }
    // }, [])
    // ** always|never a touch screen
    const [isTouchScreen, setIsTouchScreen] = useState(false)
    return (
      <>
      { isTouchScreen && 
        <EcctrlJoystick buttonNumber={5} />
      }
      </>
    )
  }



  // ==========================================================
  // ** RETURN JSX
  return (
    <>

      {/* [MM] HEY HEY HEY */}
      {/* <Text>{project_title}</Text> */}
      {/* [MM] HEY HEY HEY */}

      { (!isPageLoaded || !isPrefsLoaded) && (
        <>
          {/* LOADING... */}
          <Spinner />  
        </>
        
      )}

      { (isPageLoaded && isPrefsLoaded) && (
        
        <>

          {/* THREED: CONTROLS: ALL */}
          <>
            {/* <ThreeDControls /> */}

            {/* THREED: CONTROLS: LEVA GUI + CUSTOMIZED */}
            <>
              <ThreeDLevaControls />
            </>
            {/* END THREED CONTROLS: LEVA GUI + CUSTOMIZED */}


            {/* THREED: CONTROLS: CLICK LOADERS */}
            <>
              {/* <Button onClick={() => loadNounData('project', [])}>load project</Button> */}
              {/* <Button onClick={() => loadNounData('scene', [])}>load scene</Button> */}
              {/* <Button onClick={() => loadNounData('character', [])}>load character</Button> */}
              {/* <Button onClick={() => loadNounData('farmbot', [])}>load farmbot</Button> */}
            </>
            {/* END THREED CLICK LOADERS */}

          </>
          {/* END: THREED CONTROLS: ALL */}


          {/* THREED: TOOLBAR */}
          <>
            {/* <ThreeDToolbar /> */}
          </>
          {/* END: THREED TOOLBAR */}

          
          {/* THREED: CANVAS VIEWER */}
          <>
            <ThreeDCanvasViewer
              // ref={refThreeDCanvas1}
            />
          </>
          {/* END: THREED CANVAS VIEWER */}


          {/* THREED: CONTROL PANELS */}
          {/* -- STORE ACCESS (apollo + leva) */}
          <>
            <ThreeDControlPanels />
            {/* <ThreeDControlPanels tabs={tabProps} /> */}
          </>
          {/* END: THREED CONTROL PANELS */}


          {/* THREED: VIEWS */}
          <>
            {/* <CatalogView /> */}
            {/* <PropertiesView /> */}
            {/* <PlanView /> */}
            {/* <TheBottom /> */}
          </>
          {/* END: THREED VIEWS */}


          {/* THREED: MODALS */}
          <>
            {/* <ModalAbout /> */}
            {/* <ModalModel3d /> */}
            {/* <ModalLoading /> */}
            {/* <ModalShare /> */}
          </>
          {/* END: THREED MODALS */}


          {/* THREED FARMBOT */}
          <>
            {/* <ThreeDFarmBotMain /> */}
          </>
          {/* END: THREED FARMBOT */}

          
          {/* THREED: CHARACTER CONTROLS: JOYSTICK */}
          <>
            {/* CHARACTER CONTROL JOYSTICK */}
            {/* <EcctrlJoystick buttonNumber={0} /> */}
            {/* <EcctrlJoystick buttonNumber={5} /> */}
            {/* <EcctrlJoystickControls /> */}

          </>
          {/* END: THREED JOYSTICK */}

          
        </>
        
      )}
    </>
  )
}

// const ThreeDGarden_UseClient = dynamic(() => Promise.resolve(ThreeDGarden), {
//   ssr: false
// })
// export default ThreeDGarden_UseClient
export default ThreeDGarden
