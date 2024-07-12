// 'use client'
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
  useEffect,
  // useRef,
  useState,
  // useCallback,
  // ReactNode,
  // FC,
  Suspense,
  PointerEventHandler,
  SyntheticEvent,
} from 'react'

// ** APOLLO Imports
// ** Apollo Client 3 -- State Management using Cache/Store (via GraphQL)
// import { ApolloProvider } from '@apollo/client'
// import { ApolloConsumer } from '@apollo/client'
import { useApolloClient } from '@apollo/client'
import { useReactiveVar } from '@apollo/client'
// import { getApolloClient, getApolloContext } from '@apollo/client'
// import GetPreferences from '#/lib/api/graphql/scripts/getPreferences.gql'
// import GetProjects from '#/lib/api/graphql/scripts/getProjects.gql'
// import {
//   // ApolloLink,
//   // HttpLink,
//   getApolloContext
// } from '@apollo/client'
import {
  useQuery,
  useSuspenseQuery,
  useBackgroundQuery,
  useReadQuery,
  useFragment
} from '@apollo/experimental-nextjs-app-support/ssr'
// import stores from '#/lib/stores/apollo'
// import { stores, queries, mutations } from '#/lib/stores/apollo'
import {
  // stores,
  preferencesStore,
  projectStore,
  // queries,
  // mutations,
  // reactive vars:
  isPreferencesSetVar,
  preferencesDataVar,
} from '#/lib/stores/apollo'

// ** RADIX-UI Imports
import { 
  Box,
  Button,
  Grid,
  Flex,
  Text,
} from '@radix-ui/themes'
// ** MUI Imports
// import { styled } from '@mui/material/styles'
// mui: ui
// import Typography from '@mui/material/Typography'
// import Box from '@mui/material/Box'
// import Button from '@mui/material/Button'
// import MuiButton from '@mui/material/Button'
// import Grid from '@mui/material/Grid'
// import MDTabPanel, { tabProps } from '#/lib/mui/MDTabPanel'


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

// ** ThreeD using Leva GUI
import { ThreeDLevaControls, ThreeDLevaComponent } from '#/lib/threed/components/controls/LevaControls'

// ** ThreeD using Apollo + React to View Control + Info Panels (Apollo Store/ReactiveVar/State Access)
import ThreeDControlPanels from '#/lib/threed/components/controls/ControlPanels'
// const ThreeDControlPanels = dynamic(() => import('#/lib/threed/components/controls/ControlPanels'), { ssr: false })

// ** ThreeD Toolbar
import ThreeDToolbar from '~/src/lib/threed/components/controls/Toolbar'

// ** Modal Imports
import ThreeDModals from '#/lib/threed/components/modals/Modals'

// ** View Imports
import ThreeDViews from '#/lib/threed/components/views/ViewsFurniture'

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
import Spinner from '#/layout/ui/components/spinner'
// ** HELPFUL UTIL: COLORFUL CONSOLE MESSAGES (ccm)
import ccm from '#/lib/utils/console-colors'

// ==========================================================
// IMPORTS COMPLETE
// ==========================================================

// DEBUG PREFERENCES FOR THIS MODULE
const debug: boolean = false
const DEBUG: boolean = true

const appVersion = 'v0.16.0-beta'
// const appVersion = process.env.NEXT_PUBLIC_APP_VERSION
// const appVersion = process.env.npm_package_version
// const appVersion: string = require('package.json').version
// const appVersion: string = require('../../package.json').version

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

interface IPlayer {
  action: string
  actionTime: number | Date
  object: THREE.Object3D
  mixer: THREE.AnimationMixer
  setAction: Function
  getAction: Function
  toggleAnimation: Function
  move: Function
  movePlayer: Function
  playerControl: Function
}

// ==========================================================
// VARIABLES
// ==========================================================

// IF CLIENT BROWSER HAS A WINDOW OBJECT... (NOT SERVER SSR)
// if (typeof window != undefined) {
//   console.debug('[MM] HEY HEY HEY window', window)
//   // TESTING PARAMETERS FROM SERVER (PHP)
//   // const postdata = window?.postdata ? window.postdata : {}
//   // console.debug(postdata)
// }

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
// STYLED COMPONENTS (MUI: CSS) // legacy notes
// ==========================================================

const stylesModal = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '80vw',
  height: '60vh',
  bgcolor: '#09090D',
  border: '2px solid #000000',
  boxShadow: 24,
  p: 2,
}

// ==========================================================
// FUNCTIONAL STORES + NOUNS
// ==========================================================
// ==========================================================
// COMPONENTS

// ** HTML Modal Windows
const {
  ModalAbout,
  ModalLoading,
  ModalModel3d,
  ModalShare
} = ThreeDModals

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
// const ThreeDGarden = (): JSX.Element => {
const ThreeDGarden = (): React.ReactNode => {
  // **
  // ==========================================================
  // ** LOCAL VARS

  const word: string = `[MM] HEY HEY HEY @ ${new Date().toISOString()}`

  // return <Spinner />

  // ==========================================================
  // ** HOOKS

  // ==========================================================
  // ** USE SESSION
  // const { data: session, status } = useSession()
  // const { data, status } = useSession()
  // console.debug('useSession().data', data)

  // ==========================================================
  // ** USE CLIENT
  const client = useApolloClient()
  // console.debug('%c🦆 useApolloClient()', ccm.orangeAlert) // , client

  // **
  // const prefs = preferencesDataVar() // NO ??
  const prefs = useReactiveVar(preferencesDataVar) // YES !!
  // console.debug('%c⚙️ ThreeDGarden prefs', ccm.orangeAlert) // , prefs

  // // ** GET PREFERENCES
  const [isPrefsLoaded, setIsPrefsLoaded] = useState(useReactiveVar(isPreferencesSetVar))

  // ==========================================================
  // Component onMount hook
  // **
  useEffect(() => {

    // ** GET PREFERENCES
    const fetchData = async () => {
      try {
        // ** GET PREFERENCES
        if (!isPrefsLoaded) {
          // **
          const preferencesFromDataSource = await preferencesStore.actions.loadFromDataSource(client)
          // const preferencesFromDataSource = async () => await preferencesStore.actions.loadFromDataSource(client)
          // preferencesFromDataSource()
          if (DEBUG) console.debug('%c preferences loading...', ccm.greenAlert) // , preferencesFromDataSource
          if (preferencesFromDataSource) {
            if (DEBUG) console.debug('%c preferencesFromDataSource', ccm.greenAlert) // , preferencesFromDataSource
          }
        }

        const loadPreferencesMM = await preferencesStore.store.get('one')
        // const loadPreferencesMM = await preferencesStore.store.useStore('one')
        // console.debug('%c🦆 ThreeDGarden => APOLLO STORE: get one preferences => loadPreferencesMM', ccm.redAlert, loadPreferencesMM)
        preferencesDataVar(loadPreferencesMM.data)
        // console.debug('%c🦆 ThreeDGarden => APOLLO STORE: POST FETCH preferencesDataVar()', ccm.redAlert, preferencesDataVar())
        isPreferencesSetVar(true)
        setIsPrefsLoaded(isPreferencesSetVar())
        // console.debug('%c🦆 ThreeDGarden => APOLLO STORE: POST FETCH isPreferencesSetVar()', ccm.redAlert, isPreferencesSetVar())
        if (preferencesDataVar().doAutoLoadData) {
          const projectsFromDataSource = await projectStore.actions.loadFromDataSource(client)
          if (DEBUG) console.debug('%c projects loading...', ccm.orangeAlert, projectsFromDataSource)
          //   if (projectsFromDataSource) {
          //     console.debug('%c🥕 projectsFromDataSource', ccm.redAlert, projectsFromDataSource)
          //     // ** TODO
          //     // ** do more tasks here ??
          //   }
        }

      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }

    if (!isPrefsLoaded) {
      fetchData()
      if (DEBUG) console.debug('%c fetching data ...', ccm.blue)
    } else {
      // console.debug('%c🦆 ThreeDGarden => APOLLO STORE: preferencesDataVar()', ccm.redAlert, preferencesDataVar())
    }

  }, []) // useEffect

  // ==========================================================
  // ** USE CONTEXT
  // const abilities = useContext(AbilityContext)
  // const abilities = ['read', 'write', 'delete']

  // ==========================================================
  // TESTING: 'GUI CONTROL PANEL' + 'THREED PROJECT' NAME
  //
  // const [projectName, setProjectName] = useState(projectStore.store.get('one').data.title)
  // const [doAutoLoadData, setDoAutoLoadData] = useState(preferencesStore.store.get('one').doAutoLoadData)
  // const [doAutoRotate, setDoAutoRotate] = useState(preferencesStore.store.get('one').doAutoRotate)
  // **
  // const onClickSetProjectName = (projectName) => {
  //   setProjectName(projectName)
  //   localStorage.setItem('threed_projectName', projectName)
  // }
  // const onClickSetDoAutoLoadData = (bool) => {
  //   setDoAutoLoadData(bool)
  //   localStorage.setItem('threed_doAutoLoadData', bool)
  // }

  // ** LOAD NOUN FROM WP API VIA APOLLO INTO R3F + LEVA (+ VALTIO)
  const loadNounData = (_type: string = 'project', threeds: any = []) => {
    // load these threeds into r3f canvas
    if (DEBUG || debug) console.debug('%c🌱 ThreeDGarden loadNounData()', ccm.yellowAlert, _type, threeds)
    if (_type === 'project') {
      projectStore.actions.loadToCanvas(threeds, '_r3fCanvas1')
    }
    // return <Box>true</Box> // true
  }

  // ==========================================================

  if (DEBUG || debug) console.debug('%c🌱 ThreeDGarden mounting ...', ccm.darkgreenAlert, word)
  // if (DEBUG || debug) console.debug('%c=======================================================', ccm.darkgreenAlert)

  let project_title = 'NOT EVEN CLOSE'

  // ==========================================================
  // ** React returns JSX
  return (
    <Grid
      id='threed_garden'
      // columns={{ initial: '1', md: '1' }} 
      width='100%'
      px='2'
      py='1'
      // justify='end'
    >

      { !isPrefsLoaded && (
        <Spinner />
      )}

      { isPrefsLoaded && (
        <>
        <Grid
          // container
          id='threed_container'
          // columns={{ initial: '1', md: '1' }} 
          // gap='0'
          // flexGrow='1'
          // justify='between'
          // display='none'
          // direction='row'
          // direction='column'
          width='100%'
          style={{
            // borderTop: '1px solid darkgreen',
            border: '1px solid darkgreen',
            marginLeft: '2px',
            marginRight: '0px',
          }}
        >

          {/* THREED TOOLBAR */}
          <Flex
            // item
            id='threed_toolbar'
            // md={12}
            // xs={12}
            style={{
              display: 'none',
              // display: 'flex', 
              // justifyContent: 'flex-end',
              // borderTop: '1px solid darkgreen',
              paddingLeft: '5px',
            }}
            direction='column'
          >
            <ThreeDToolbar />
          </Flex>
          {/* END: THREED TOOLBAR */}
          
          {/* THREED CANVAS VIEWER */}
          {/* HEY HEY HEY -- THREED CANVAS: VIEWER COMPONENT WRAPPER */}
          <Flex
            // item
            id='threed_canvas_viewer'
            // md={12}
            // xs={12}
            style={{ 
              // display: 'flex', 
              // justifyContent: 'flex-end',
              // mx: 0,
              // px: 2,
              // borderTop: '1px solid darkgreen',
              // zIndex: 0, // this does not work.. no negative numbers !!!!
              width: '100%',
            }}
            direction='column'
          >
            <ThreeDCanvasViewer />
          </Flex>
          {/* END: THREED CANVAS VIEWER */}

          {/* THREED CONTROL PANELS */}
          {/* -- STORE ACCESS (apollo, valtio, leva) */}
          <Flex
            // item
            id='threed_control_panels'
            // md={12}
            // xs={12}
            style={{ 
              borderTop: '1px solid darkgreen' 
            }}
            direction='column'
          >
            <ThreeDControlPanels />
            {/* <ThreeDControlPanels tabs={tabProps} /> */}
          </Flex>
          {/* END: THREED CONTROL PANELS */}

          {/* THREED VIEWS */}
          <Flex
            // item
            id='threed_views'
            // md={12}
            // xs={12}
            style={{ 
              borderTop: '0px solid darkgreen' 
            }}
            direction='column'
          >
            {/* <CatalogView /> */}
            {/* <PropertiesView /> */}
            {/* <PlanView /> */}
            {/* <TheBottom /> */}
          </Flex>
          {/* END: THREED VIEWS */}

          {/* THREED MODALS */}
          <Flex
            // item
            id='threed_modals'
            // md={12}
            // xs={12}
            style={{ 
              borderTop: '0px solid darkgreen' 
            }}
            direction='column'
          >
            <ModalAbout />
            {/* <ModalModel3d /> */}
            {/* <ModalLoading /> */}
            {/* <ModalShare /> */}
          </Flex>
          {/* END: THREED MODALS */}

          {/* THREED FARMBOT */}
          <Flex
            // item
            id='threed_farmbot'
            // md={12}
            // xs={12}
            style={{ 
              // borderTop: '1px solid darkgreen', 
              // padding: '16px' 
            }}
            direction='column'
          >
            {/* <ThreeDFarmBotMain /> */}
          </Flex>
          {/* END: THREED FARMBOT */}

          {/* [MM] HEY HEY HEY */}
          {/* <Text>{project_title}</Text> */}
          {/* [MM] HEY HEY HEY */}
          
        </Grid>

        

        {/* THREED CONTROLS: ALL */}
        <Grid
          // item
          id='threed_controls'
          // columns={{ initial: '2', md: '2' }} 
          // gap='0' 
          // width='auto'
          width='50%'
          // direction='row'
          style={{
            // display: 'flex', 
            // justifyContent: 'between',
            // paddingLeft: '2px',
            // borderTop: '1px solid darkgreen',
            // width: '360px',
            // minWidth: '320px',
            // maxWidth: '480px',
            // position: 'absolute',
            // // minHeight: '48px',
            // // display: 'inline',
            // // position: 'fixed',
            // top: 2,
            // // left: 0,
            // right: '10%', 
            // // zIndex: 9999,
          }}
        >

          {/* THREED CONTROLS: LEVA GUI + CUSTOMIZED */}
          {/* <Flex
            // item
            id='leva_controls'
            // justify='start'
            // width='100%'
            // pl={'10px'}
            // md={4}
            // xs={12}
            style={{
              // display: 'flex', 
              // justifyContent: 'flex-start',
              // paddingLeft: 12,
              // px: 2.5, 
              // py: 2,
              // borderTop: '1px solid darkgreen',
              // width: '100%',
              width: '400px',
              minWidth: '320px',
              maxWidth: '480px',
              // position: 'absolute',
              // // minHeight: '48px',
              // // display: 'inline',
              // // position: 'fixed',
              // top: 2,
              // // left: 0,
              // right: '10%', 
              zIndex: 9999,
            }}
          > */}
            <Box
              width={'400px'}
            >
              <ThreeDLevaControls />
            </Box>
          {/* </Flex> */}
          {/* END THREED CONTROLS: LEVA GUI + CUSTOMIZED */}

          {/* THREED CLICK LOADERS */}
          {/* <Flex
            // item
            id='threed_actions'
            // md={8}
            // xs={12}
            style={{ 
              display: 'flex', 
              justifyContent: 'flex-end' 
            }}
            gap='1'
          > */}
            {/*
            <Button onClick={() => loadNounData('project', [])}>load project</Button>
            <Button onClick={() => loadNounData('scene', [])}>load scene</Button>
            <Button onClick={() => loadNounData('character', [])}>load character</Button>
            <Button onClick={() => loadNounData('farmbot', [])}>load farmbot</Button>
            */}
          {/* </Flex> */}
          {/* END THREED CLICK LOADERS */}

        </Grid>
        {/* END: THREED CONTROLS: ALL */}
        </>
      )}
    </Grid>
  )
}

// const ThreeDGarden_UseClient = dynamic(() => Promise.resolve(ThreeDGarden), {
//   ssr: false
// })
// export default ThreeDGarden_UseClient
export default ThreeDGarden
