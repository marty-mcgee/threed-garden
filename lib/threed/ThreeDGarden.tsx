// @ts-nocheck /* OR @ ts-ignore OR @ ts-expect-error */
'use client'
// ^ this file needs the 'use client' pragma

// ==============================================================
// ** RESOURCES
// ==============================================================

// ** Next Imports
// import dynamic from 'next/dynamic'
// import Image from 'next/image'

// ** NEXT AUTH Imports
import { useSession } from "next-auth/react" // hint: const { data, data: session, status } = useSession()

// ** React Imports
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
// import { useReactiveVar } from '@apollo/client'
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

// ** MUI Imports
// import { styled } from '@mui/material/styles'
// mui: ui
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
// import MuiButton from '@mui/material/Button'
import Grid from '@mui/material/Grid'
// import MDTabPanel, { tabProps } from '#/lib/mui/MDTabPanel'

// ** Three JS Imports (not here, use R3F)
// import * as THREE from 'three'
// ** Three JS Loading Progress
import { Html, Loader, useProgress } from '@react-three/drei'

// ** ThreeD r3f Canvas Imports
import ThreeDCanvasViewer from '#/lib/threed/components/canvas/CanvasViewer'
// import { Canvas } from '@react-three/fiber'
// import { ThreeDCanvasViewer } from '#/lib/threed/components/canvas/Canvas'
// import { ThreeDCanvas } from '#/lib/threed/components/canvas/Canvas'
// import { ThreeDEnvironment } from '#/lib/threed/components/canvas/Canvas'

// ** ThreeD using Leva GUI
import { ThreeDLevaControls, ThreeDLevaComponent } from '#/lib/threed/components/controls/LevaControls'

// ** ThreeD using Apollo + React to View Control + Info Panels (Apollo Store/ReactiveVar/State Access)
import ThreeDControlPanels from '#/lib/threed/components/controls/ControlPanels'

// ** ThreeD Toolbar
import ThreeDToolbar from '#/lib/threed/components/tools/Toolbar'

// ** Modal Imports
import ThreeDModals from '#/lib/threed/components/modals/Modals'

// ** View Imports
// import views from '#/lib/threed/components/views'

// ** CSS Styles Imports
// import stylesDemo from '~/styles/demo/demo.module.css'

// ** Paper Imports (DEPRECATED -- requires jQuery)
// import paper from 'paper'

// ** jQuery Imports (DEPRECATED -- no no no, never again)
// import * as $ from 'jquery'

// ** Helper Components
import Spinner from '#/ui/components/spinner'
// ** HELPFUL UTIL: COLORFUL CONSOLE MESSAGES (ccm)
import ccm from '#/lib/utils/console-colors'

// ==========================================================
// IMPORTS COMPLETE
// ==========================================================

// DEBUG PREFERENCES FOR THIS MODULE
const debug: boolean = true
const DEBUG: boolean = true
const debug_deep: boolean = false

const appVersion = 'v0.15.0-b'
// const appVersion = process.env.NEXT_PUBLIC_APP_VERSION
// const appVersion = process.env.npm_package_version
// const appVersion: string = require('package.json').version
// const appVersion: string = require('../../package.json').version

if ((debug || DEBUG) && debug_deep) {
  console.debug('%c🥕 ThreeDGarden<FC,R3F>: {.tsx}', ccm.green)
  console.debug("%c🌱 appVersion", ccm.darkgreen, appVersion)
  console.debug(`%c====================================`, ccm.darkgreen)
}

// ==========================================================
// TS INTERFACES + TYPES
// ==========================================================

interface IPostData {
  plugin_name: string
  plugin_version: string
  plugin_url: string
  theme_uri: 'light' | 'dark'
  rest_url: string
  world_id: number | string
  scene_id: number | string
}

interface IThreeDEnv {
  pluginName: string
  pluginVersion: string
  pluginURL: string
  themeURI: 'light' | 'dark'
  restURL: string
  worldID: number | string
  sceneID: number | string
}

interface IPlayer {
  action: string
  actionTime: number | Date
  object: Object3D
  mixer: AnimationMixer
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

// PARAMETERS FROM SERVER (PHP)
// console.debug("window", window)
// console.debug(window.postdata)
// const postdata = window?.postdata ? window.postdata : {}

const postdata: IPostData = {
  plugin_name: 'ThreeD Garden',
  plugin_version: appVersion,
  plugin_url: 'https://threed.design/',
  theme_uri: 'dark', // dark | light
  rest_url: 'https://threed.design/wp-json/wp/v2/',
  world_id: 1, // default
  scene_id: 1, // default
}

const env: IThreeDEnv = {
  pluginName: postdata.plugin_name,
  pluginVersion: postdata.plugin_version,
  pluginURL: postdata.plugin_url,
  themeURI: postdata.theme_uri,
  restURL: postdata.rest_url,
  worldID: postdata.world_id,
  sceneID: postdata.scene_id,
}

if (debug_deep) {
  console.debug('%c🌱 api plugin:', ccm.darkgreen, env.pluginName, env.pluginVersion, postdata)
  console.debug('postdata', postdata)
  console.debug(`%c====================================`, ccm.darkgreen)
}

// ==========================================================
// STYLES
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

// ** Modal Windows
// const {
//   ModalAbout,
//   ModalLoading,
//   ModalModel3d,
//   ModalShare
// } = ThreeDModals

// ** Views
// const { CatalogView, PlanView, PropertiesView, TheBottom } = views

// ==========================================================

// ** R3F Canvas Component
// const { ThreeDCanvasViewer } = ThreeDCanvas
// const ThreeDCanvasViewer = () => {

//   // **
//   const word: string = `[MM] ThreeDCanvasViewer @ ${new Date().toISOString()}`
//   // console.debug(`%c=======================================================`, ccm.orange)
//   console.debug('%c🥕 ThreeDCanvasViewer ', ccm.orange)
//   // console.debug(`%c=======================================================`, ccm.black)

//   // ** USE CLIENT
//   const client = useApolloClient()

//   // ** DECIDE WHETHER TO USE CANVAS, DEPENDING ON AVAILABLE threeds[nodes]
//   let threeds = [] // threeds are nodes[] to load to canvas

//   if (isPreferencesSetVar()) {
//     if (debug || DEBUG || debug_deep) console.debug('%c🥕 ThreeDCanvasViewer isPreferencesSetVar() ', ccm.greenAlert, isPreferencesSetVar())
//     // // const project = projectStore.store.get('one')
//     // const project = projectStore.store.useStore('one')
//     // if (DEBUG || debug_deep) console.debug('%c🥕 ThreeDCanvasViewer {project} ', ccm.orange, project)
//     // if (project) {
//     //   let project_title = project?.data?.title ? project.data.title : 'NOTHING YET, SIR: NOPE NOPE NOPE'
//     //   if (DEBUG || debug_deep) console.debug('%c🥕 ThreeDCanvasViewer {project}.project_title ', ccm.orange, project_title)
//     //   if (project.data?.plans) {
//     //     let nodesToLoad = []
//     //         nodesToLoad = project.data.plans.nodes[0]?.threedsActive?.nodes
//     //     if (DEBUG || debug_deep) console.debug('%c🥕 ThreeDCanvasViewer {project}.[nodesToLoad] ', ccm.orange, nodesToLoad)
//     //     if (nodesToLoad) {
//     //       threeds = nodesToLoad
//     //       if (DEBUG || debug_deep) console.debug('%c🥕 ThreeDCanvasViewer [nodesToLoad] as [threeds] ', ccm.orange, threeds)
//     //     }
//     //   }
//     // }
//   }
//   else {
//     if (debug || DEBUG || debug_deep) console.debug('%c🥕 ThreeDCanvasViewer isPreferencesSetVar() ', ccm.orangeAlert, isPreferencesSetVar(), 'begin querying preferences')

//     const isPrefsLoadedFromDataSouce = preferencesStore.actions.loadFromDB(client)
//     // const isPrefsLoadedFromDataSouce = preferencesStore.actions.loadFromDataSource(client)
//     if (DEBUG) console.debug('%c preferences loading...', ccm.greenAlert, isPrefsLoadedFromDataSouce)
//     // ** SET REACTIVE VARS FROM DATA SOURCE
//     if (isPrefsLoadedFromDataSouce) {
//       const preferencesStoreData = preferencesStore.store.useStore('one').data
//       if (DEBUG) console.debug('%c🌱 preferencesStoreData', ccm.darkgreen, preferencesStoreData)
//       // ** TODO !!!
//       if (preferencesStoreData.projectName) { // HACK !!! for apollo error: mappedpath[s]

//         if (DEBUG) console.debug('%c====================================', ccm.yellowAlert)
//         if (DEBUG) console.debug('%c🌱 TODO: SET preferencesDataVar to ', ccm.yellowAlert, preferencesStoreData)
//         const preferencesDataVarNew = preferencesDataVar(preferencesStoreData)
//         if (DEBUG) console.debug('%c🌱 DONE: SET preferencesDataVar', ccm.yellowAlert, preferencesDataVarNew)

//         if (DEBUG) console.debug('%c====================================', ccm.yellowAlert)
//         if (DEBUG) console.debug('%c🌱 TODO: SET isPreferencesSetVar()', ccm.yellowAlert, isPreferencesSetVar())
//         isPreferencesSetVar(true)
//         if (DEBUG) console.debug('%c🌱 DONE: SET isPreferencesSetVar()', ccm.yellowAlert, isPreferencesSetVar())

//         if (DEBUG) console.debug('%c====================================', ccm.yellowAlert)
//       }
//     }


//   }

//   // ** LOAD NOUN FROM WP API VIA APOLLO INTO R3F + LEVA (+ VALTIO)
//   const loadNounData = (threeds) => {
//     // load these threeds into r3f canvas
//     projectStore.actions.loadToCanvas(threeds, '_r3fCanvas')
//     // return <Box>true</Box> // true
//   }

//   console.debug(`%c=======================================================`, ccm.orange)
//   return (
//     <Grid
//       container
//       id='ThreeDCanvasViewer'
//       sx={{ border: '1px solid darkgreen' }}
//     >
//       <Grid
//         item
//         id='metadata'
//         md={4}
//         xs={12}
//         sx={{
//           display: 'flex',
//           justifyContent: 'flex-start'
//         }}
//       >
//         <Grid
//           style={{
//             position: 'absolute',
//             zIndex: 10,
//             minWidth: '416px',
//           }}
//         >
//           {/* THREED CONTROLS: LEVA GUI + CUSTOMIZED */}
//           <ThreeDLevaControls />
//           {/* THREED CONTROLS: LEVA GUI + CUSTOMIZED */}
//         </Grid>
//         {/* <Typography> */}
//           {/* {project_title} */}
//         {/* </Typography> */}
//       </Grid>
//       <Grid
//         item
//         id='actions[loadNounData(noun)]'
//         md={8}
//         xs={12}
//         style={{ display: 'flex', justifyContent: 'flex-end' }}
//       >
//         <Button onClick={() => loadNounData('project')}>load project</Button>
//         <Button onClick={() => loadNounData('scene')}>load scene</Button>
//         <Button onClick={() => loadNounData('character')}>load character</Button>
//         <Button onClick={() => loadNounData('farmbot')}>load farmbot</Button>
//       </Grid>
//       <Grid
//         container
//         id='_r3fCameras'
//       >
//         <Grid
//           item
//           id='_r3f_camera_1'
//           md={12}
//           xs={12}
//           sx={{ borderTop: '1px solid darkgreen' }}
//         >

//           {/* THREED CANVAS */}
//           <ThreeDCanvas
//             _id={'_r3fCanvas'}
//             threeds={threeds}
//           />
//           {/* THREED CANVAS */}

//         </Grid>
//         {/* <Grid item id='_r3f_camera_2'
//           md={6} xs={12} sx={{ border: '1px solid darkgreen' }}
//         >
//           <ThreeDCanvas
//             _id={'_r3fCanvas2'}
//             threeds={threeds}
//           />
//         </Grid> */}
//         {/* <Grid item id='_r3f_camera_3'
//           md={6} xs={12} sx={{ border: '1px solid darkgreen' }}
//         >
//           <ThreeDCanvas
//             _id={'_r3fCanvas3'}
//             threeds={threeds}
//           />
//         </Grid> */}
//         {/* <Grid item id='_r3f_camera_4'
//           md={6} xs={12} sx={{ border: '1px solid darkgreen' }}
//         >
//           <ThreeDCanvas
//             _id={'_r3fCanvas4'}
//             threeds={threeds}
//           />
//         </Grid> */}
//       </Grid>
//     </Grid>
//   )
// }

// const ThreeDGarden = ({ session }: { session: Session | null }): JSX.Element => {
// const ThreeDGarden = ({...props}): JSX.Element => {
// const ThreeDGarden = ({threedData}): JSX.Element => {
const ThreeDGarden = (): JSX.Element => {
  // **
  // ==========================================================
  // ** LOCAL VARS

  const word: string = `[MM] HEY HEY HEY @ ${new Date().toISOString()}`

  // return <Spinner />

  // ==========================================================
  // ** HOOKS (client-side only)

  // ==========================================================
  // ** USE SESSION
  const { data: session, status } = useSession()
  // const { data, status } = useSession()
  // console.debug('useSession().data', data)

  // ==========================================================
  // ** USE CLIENT
  const client = useApolloClient()
  // console.debug('useApolloClient()', client)

  // // ** GET PREFERENCES
  const [isPrefsLoaded, setIsPrefsLoaded] = useState(isPreferencesSetVar())
  // if (!isPreferencesSetVar()) {
  //   // **
  //   const preferencesFromDataSource = preferencesStore.actions.loadFromDB(client)
  //   if (DEBUG) console.debug('%c preferences loading...', ccm.greenAlert, typeof preferencesFromDataSource)
  // }
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
          const preferencesFromDataSource = await preferencesStore.actions.loadFromDB(client)
          if (DEBUG) console.debug('%c preferences loading...', ccm.greenAlert, typeof preferencesFromDataSource)
        }
        const loadPreferencesMM = await preferencesStore.store.get('one')
        // console.debug('%c🦆 ThreeDGarden => APOLLO STORE: get one preferences => loadPreferencesMM', ccm.redAlert, loadPreferencesMM)
        preferencesDataVar(loadPreferencesMM.data)
        console.debug('%c🦆 ThreeDGarden => APOLLO STORE: POST FETCH preferencesDataVar()', ccm.redAlert, preferencesDataVar())
        isPreferencesSetVar(true)
        setIsPrefsLoaded(isPreferencesSetVar())
        // console.debug('%c🦆 ThreeDGarden => APOLLO STORE: POST FETCH isPreferencesSetVar()', ccm.redAlert, isPreferencesSetVar())
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }

    if (!isPrefsLoaded) {
      fetchData()
      if (DEBUG) console.debug('%c fetching data...', ccm.greenAlert)
    } else {
      console.debug('%c🦆 ThreeDGarden => APOLLO STORE: preferencesDataVar()', ccm.redAlert, preferencesDataVar())
    }

    //   const preferencesFromDataSource = preferencesStore.actions.loadFromDB(client)
    //   if (DEBUG) console.debug('%c preferences loading...', ccm.greenAlert, typeof preferencesFromDataSource)
    //   // preferencesDataVar(preferencesFromDataSource.data)
    //   // isPreferencesSetVar(true)
    //   // if (preferencesDataVar().doAutoLoadData) {
    //   //   const projectsFromDataSource = projectStore.actions.loadFromDataSource(client)
    //   //   if (DEBUG) console.debug('%c projects loading...', ccm.orangeAlert)
    //   //   //   if (projectsFromDataSource) {
    //   //   //     console.debug('%c🥕 projectsFromDataSource', ccm.redAlert, projectsFromDataSource)
    //   //   //     // ** TODO
    //   //   //     // ** do more tasks here ??
    //   //   //   }
    //   // }

    //   // return <Spinner />
    // }

    // // ** getApolloContext()
    // const apolloContext = getApolloContext()
    // console.debug('%c🦆 ThreeDGarden getApolloContext()', ccm.greenAlert, apolloContext)

    // ** USE QUERIES -- HEY HEY HEY
    // client.query:
    // **
    // const { data, loading, error } = useQuery(queries.GetPreferences)
    // if (data) {
    //   console.debug('%c APOLLO STORE QUERIES: GetPreferences', ccm.redAlert, data, loading, error)
    // }
    // const { data, loading, error } = useQuery(queries.GetProjects)
    // if (data) {
    //   console.debug('%c APOLLO STORE QUERIES: GetProjects', ccm.orange, data, loading, error)
    // }

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
  const loadNounData = (_type = 'project', threeds = []) => {
    // load these threeds into r3f canvas
    if (DEBUG || debug_deep) console.debug('%c🌱 ThreeDGarden loadNounData()', ccm.yellowAlert, _type, threeds)
    if (_type === 'project') {
      projectStore.actions.loadToCanvas(threeds, '_r3fCanvas')
    }
    // return <Box>true</Box> // true
  }

  // ==========================================================

  if (DEBUG || debug_deep) console.debug('%c🌱 ThreeDGarden mounting...', ccm.yellowAlert, word, isPreferencesSetVar())
  if (DEBUG || debug_deep) console.debug('%c=======================================================', ccm.yellowAlert)

  // ==========================================================
  // ** React returns JSX
  return (
    <Box
      id='threed_garden'
      style={{width: '100%'}}
    >
      {/* SUSPENSEFUL... */}
      {/* <Suspense> */}
      {/* <Suspense fallback={null}> */}
      {/* <Suspense fallback={<Spinner />}> */}

      { isPrefsLoaded && (
        <Grid
          container
          id='threed_grid'
          sx={{ border: '1px solid darkgreen' }}
        >
          <Grid
            item
            id='threed_controls'
            md={4}
            xs={12}
            sx={{
              display: 'flex',
              justifyContent: 'flex-start'
            }}
          >
            {/* THREED CONTROL PANELS -- STORE ACCESS (apollo, valtio, leva) */}
            <Grid
              item
              id='leva_controls'
              style={{
                position: 'absolute',
                zIndex: 10,
                minWidth: '416px',
              }}
            >
              {/* THREED CONTROLS: LEVA GUI + CUSTOMIZED */}
              <ThreeDLevaControls />
              {/* THREED CONTROLS: LEVA GUI + CUSTOMIZED */}
              {/* <Typography> */}
              {/* {project_title} */}
              {/* </Typography> */}
            </Grid>
          </Grid>
          <Grid
            item
            id='threed_actions'
            md={8}
            xs={12}
            style={{ display: 'flex', justifyContent: 'flex-end' }}
          >
            <Button onClick={() => loadNounData('project', [])}>load project</Button>
            <Button onClick={() => loadNounData('scene', [])}>load scene</Button>
            <Button onClick={() => loadNounData('character', [])}>load character</Button>
            <Button onClick={() => loadNounData('farmbot', [])}>load farmbot</Button>
          </Grid>
          <Grid
            item
            id='threed_canvas_viewer'
            md={12}
            xs={12}
            sx={{ borderTop: '1px solid darkgreen' }}
          >
            {/* THREED CANVAS VIEWER */}
            <ThreeDCanvasViewer />
            {/* THREED CANVAS VIEWER */}
          </Grid>
          <Grid
            item
            id='threed_control_panels'
            md={12}
            xs={12}
            sx={{ borderTop: '1px solid darkgreen' }}
          >
            {/* THREED CANVAS VIEWER */}
            {/* <ThreeDControlPanels tabs={tabProps} /> */}
            <ThreeDControlPanels />
            {/* THREED CANVAS VIEWER */}
          </Grid>

          {/* THREED MODALS */}
          {/* <ModalAbout /> */}
          {/* <ModalModel3d /> */}
          {/* <ModalLoading /> */}
          {/* <ModalShare /> */}

          {/* THREED VIEWS */}
          {/* <CatalogView /> */}
          {/* <PropertiesView /> */}
          {/* <PlanView /> */}
          {/* <TheBottom /> */}

          {/* THREED TOOLBAR */}
          {/* <ThreeDToolbar /> */}
        </Grid>
      )}
      {/* </Suspense> */}
      {/* ...SUSPENSEFUL */}
    </Box>
  )
}

export default ThreeDGarden
// const ThreeDGarden_UseClient = dynamic(() => Promise.resolve(ThreeDGarden), {
//   ssr: false
// })
// export default ThreeDGarden_UseClient
