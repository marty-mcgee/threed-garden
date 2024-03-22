// @ts-nocheck /* OR @ ts-ignore OR @ ts-expect-error */
'use client'
// ^ this file needs the 'use client' pragma

// ==============================================================
// ** RESOURCES
// ==============================================================

// ** Next Imports
import { useSession } from "next-auth/react"
// hint: const { data, data: session, status } = useSession()

// ** React Imports
import {
  useEffect,
  // useRef,
  useState,
  // useCallback,
  // ReactNode,
  FC,
  Suspense,
  PointerEventHandler,
  SyntheticEvent,
} from 'react'

// // ** Apollo Client 3 -- State Management using Cache/Store (via GraphQL)
// import { ApolloProvider } from '@apollo/client'
// import { client } from '#/lib/api/graphql/__client' // server-side-only
// import { getClient } from '#/lib/api/graphql/__client' // server-side-only
// // ** Apollo Client 3 -- Cache Store Imports
// // state management (instead of React.useState, Redux, Zustand)
// import { ApolloConsumer } from '@apollo/client'
// import { TestAC3Store } from '#/lib/stores/old'
import { useApolloClient } from '@apollo/client'
// import {
//   useQuery,
//   useSuspenseQuery,
//   useBackgroundQuery,
//   useReadQuery,
//   useFragment
// } from '@apollo/experimental-nextjs-app-support/ssr'
// import { stores, queries, mutations } from '#/lib/stores/apollo'
import stores from '#/lib/stores/apollo'
// import { preferencesStore } from '#/lib/stores/apollo'
import { makeVar, useReactiveVar } from '@apollo/client'

// ** Next Imports
// import Image from 'next/image'
// import dynamic from 'next/dynamic'

// ** MUI Imports
import { styled } from '@mui/material/styles'
// mui: ui
import Box from '@mui/material/Box'
import MuiButton from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import MDTabPanel, { tabProps } from '#/lib/mui/MDTabPanel'

// ** Helper Components
import Spinner from '#/ui/components/spinner'

// ** Three JS Imports (not here, use R3F)
// import * as THREE from 'three'
// ** Three JS Loading Progress
import { Html, Loader, useProgress } from '@react-three/drei'

// ** ThreeD Imports
// import { Canvas } from '@react-three/fiber'
import ThreeDCanvas from '#/lib/threed/components/canvas'
// ** Leva GUI
import { ThreeDLevaControls, ThreeDLevaComponent } from '#/lib/threed/components/controls/LevaControls'
// ** Control + Info Panels (Store Access)
import ThreeDControlPanels from '#/lib/threed/components/controls/ControlPanels'
// ** Toolbar
import ThreeDToolbar from '#/lib/threed/components/tools/Toolbar'

// ** Modal Imports
import modals from '#/lib/threed/components/modals'

// ** View Imports
// import views from '#/lib/threed/components/views'

// ** CSS Styles Imports
// import stylesDemo from '~/styles/demo/demo.module.css'

// ** Paper Imports (DEPRECATED -- requires jQuery)
// import paper from 'paper'

// ** jQuery Imports (DEPRECATED -- no no no, never again)
// import * as $ from 'jquery'

// ** HELPFUL UTIL: COLORFUL CONSOLE MESSAGES (ccm)
import ccm from '#/lib/utils/console-colors'

// ==========================================================
// IMPORTS COMPLETE
// ==========================================================

// DEBUG PREFERENCES FOR THIS MODULE
const debug: boolean = true
const debugPhysics: boolean = true
const debugAnimations: boolean = true
const DEBUG: boolean = true
// const doAutoLoadData: boolean = true // true | false (default)

const appVersion = 'v0.15.0-b'
// const appVersion = process.env.NEXT_PUBLIC_APP_VERSION
// const appVersion = process.env.npm_package_version
// const appVersion: string = require('package.json').version
// const appVersion: string = require('../../package.json').version

if (debug) {
  console.debug('%c🥕 ThreeDGarden<FC,R3F>: {.tsx}', ccm.green)
  console.debug("%c🌱 appVersion", ccm.darkgreen, appVersion)
  // console.debug(`%c====================================`, ccm.black)
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

if (debug) {
  console.debug('%c🌱 api plugin:', ccm.darkgreen, env.pluginName, env.pluginVersion, postdata)
  // console.debug('postdata', postdata)
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

const Button = styled(MuiButton)(({ theme }) => ({
  marginRight: `0.25rem !important`,
  padding: `0.5rem 0.5rem !important`,
  minWidth: `2.0rem !important`,
}))

// ==========================================================
// FUNCTIONAL STORES
// ==========================================================

const {
  preferencesStore,
  // nounStore,
  projectStore,
  // participantStore,
  // planStore,
  // threedStore,
  // fileStore,
  // sceneStore,
  // allotmentStore,
  // bedStore,
  // plantStore,
  // plantingPlanStore,
  // modalStore,
  // modalAboutStore,
  // modalModel3dStore,
  // modalLoadingStore,
  // modalShareStore,
  // modalStoreNoun,
} = stores
// console.debug('%cstores available', ccm.orange, stores)
// console.debug(`%c====================================`, ccm.black)
// console.debug('%csceneStore', ccm.orange, sceneStore)
// console.debug(`%c====================================`, ccm.black)

// ** USE REACTIVE VARS (APOLLO LOCAL STATE)
export const preferencesVar = makeVar(
  {
    doAutoLoadData: false, // true | false
    doAutoRotate: false, // true | false
    projectName: 'HEY HEY HEY: preferencesVar.projectName DEFAULT', // string: 'default'
  }
)
// Output ReactiveVar
console.log('%c SET SET SET SET SET SET preferencesVar()', ccm.yellow, preferencesVar())

// ==========================================================
// FUNCTIONAL NOUNS
// ==========================================================
if (debug) {
  // console.debug(`%c🥕 ThreeDGarden<FC,R3F>: {nouns()}`, ccm.blue)
  // console.debug(`%c====================================`, ccm.black)
}

// ==========================================================
// COMPONENTS

// ** Modal Windows
const {
  ModalAbout,
  ModalLoading,
  ModalModel3d,
  ModalShare
} = modals

// ** Views
// const { CatalogView, PlanView, PropertiesView, TheBottom } = views

// ==========================================================

// ** R3F Main Component
const ThreeDCanvasViewer = (): JSX.Element => {

  // **
  const word = `[MM] ThreeDCanvasViewer @ ${new Date().toISOString()}`
  // console.debug(`%c=======================================================`, ccm.black)
  // console.debug('%c🥕 ThreeDCanvasViewer {props.threeddata}', ccm.orange, threeddata)
  // console.debug(`%c=======================================================`, ccm.black)

  // ==========================================================

  // const project = projectStore.store.get('one')
  const project = projectStore.store.useStore('one')
  let project_title = project?.data?.title ? project.data.title : 'NOTHING YET, SIR: NOPE NOPE NOPE'
  console.debug('%c🥕 ThreeDCanvasViewer {project}', ccm.orange, project, project_title)
  let nodesToLoad = []
  let threeds = [] // threeds are nodes[] to load to canvas
  if (project) {
    nodesToLoad = project.data?.plans?.nodes[0]?.threedsActive?.nodes
    if (nodesToLoad) {
      threeds = nodesToLoad
      if (debug) console.debug('%c🥕 ThreeDCanvasViewer [nodesToLoad] as threeds', ccm.orange, threeds)
    }
  }

  // ** LOAD NOUN FROM WP API VIA APOLLO INTO R3F + LEVA (+ VALTIO)
  const loadNounData = (threeds) => {
    // load these threeds into r3f canvas
    projectStore.actions.loadToCanvas(threeds, '_r3fCanvas')
    // return <Box>true</Box> // true
  }

  // console.debug(`%c====================================`, ccm.black)
  return (
    <Grid
      container
      id='ThreeDCanvasViewer'
      sx={{ border: '1px solid darkgreen' }}
    >
      <Grid
        item
        id='metadata'
        md={4}
        xs={12}
        sx={{
          display: 'flex',
          justifyContent: 'flex-start'
        }}
      >
        <Grid
          style={{
            position: 'absolute',
            zIndex: 10,
            minWidth: '360px',
          }}
        >
          {/* THREED CONTROLS: LEVA GUI + CUSTOMIZED */}
          <ThreeDLevaControls />
          {/* THREED CONTROLS: LEVA GUI + CUSTOMIZED */}
        </Grid>
        {/* <Typography> */}
          {/* {project_title} */}
        {/* </Typography> */}
      </Grid>
      <Grid
        item
        id='actions[loadNounData()]'
        md={8}
        xs={12}
        style={{ display: 'flex', justifyContent: 'flex-end' }}
      >
        <Button onClick={() => loadNounData('project')}>load project</Button>
        <Button onClick={() => loadNounData('scene')}>load scene</Button>
        <Button onClick={() => loadNounData('character')}>load character</Button>
        <Button onClick={() => loadNounData('farmbot')}>load farmbot</Button>
      </Grid>
      <Grid
        container
        id='_r3fCameras'
      >
        <Grid
          item
          id='_r3f_camera_1'
          md={12}
          xs={12}
          sx={{ borderTop: '1px solid darkgreen' }}
        >

          {/* THREED CANVAS */}
          <ThreeDCanvas
            _id={'_r3fCanvas'}
            threeds={threeds}
          />
          {/* THREED CANVAS */}

        </Grid>
        {/* <Grid item id='_r3f_camera_2'
          md={6} xs={12} sx={{ border: '1px solid darkgreen' }}
        >
          <ThreeDCanvas
            _id={'_r3fCanvas2'}
            threeds={threeds}
          />
        </Grid> */}
        {/* <Grid item id='_r3f_camera_3'
          md={6} xs={12} sx={{ border: '1px solid darkgreen' }}
        >
          <ThreeDCanvas
            _id={'_r3fCanvas3'}
            threeds={threeds}
          />
        </Grid> */}
        {/* <Grid item id='_r3f_camera_4'
          md={6} xs={12} sx={{ border: '1px solid darkgreen' }}
        >
          <ThreeDCanvas
            _id={'_r3fCanvas4'}
            threeds={threeds}
          />
        </Grid> */}
      </Grid>
    </Grid>
  )
}

// const ThreeDGarden = ({ session }: { session: Session | null }): JSX.Element => {
// const ThreeDGarden = ({...props}): JSX.Element => {
// const ThreeDGarden = ({threedData}): JSX.Element => {
const ThreeDGarden = (): JSX.Element => {
  // **
  // ==========================================================
  // ** LOCAL VARS

  const word: string = `[MM] HEY HEY HEY @ ${new Date().toISOString()}`

  // ==========================================================
  // ** Hooks

  // ** USE SESSION
  // const { data: session, status } = useSession()
  // const { data, status } = useSession()
  const { data: session, status } = useSession()
  // console.debug('useSession()', useSession())
  // console.debug('useSession().data', data)
  // ** USE CLIENT
  const client = useApolloClient()
  // console.debug('useApolloClient()', client)
  // // ** USE REACTIVE VARS (APOLLO LOCAL STATE)
  // export const preferencesVar = makeVar(
  //   {
  //     doAutoLoadData: true,
  //     doAutoRotate: true,
  //     projectName: '',
  //   }
  // )

  // Output ReactiveVar
  // console.debug('preferencesVar()', preferencesVar())
  // ** USE CONTEXT
  // const abilities = useContext(AbilityContext)
  const abilities = ['read', 'write', 'delete']

  // ==========================================================
  // FOR REFERENCE: EXAMPLE PRIMARY USER 'DATA' OBJECT
  //
  // const threeddata = {
  //   status: status,
  //   abilities: abilities,
  //   session: session,
  //   client: client,
  //   preferences: preferencesVar(),
  //   store: projectStore, // default
  //   word: word,
  // }

  // ==========================================================
  // 'GUI CONTROL PANEL' + 'THREED PROJECT' NAME
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

  // ==========================================================
  // Component onMount hook
  //

  // **
  // const projectName = preferencesStore.store.useStore('projectName')
  const doAutoLoadData = preferencesStore.store.useStore('doAutoLoadData')
  console.log('%c🌱 doAutoLoadData', ccm.darkgreen, doAutoLoadData)
  const preferences = useReactiveVar(preferencesVar)
  if (preferences.doAutoLoadData) {
    console.log('%c🌱 preferences.doAutoLoadData', ccm.darkgreen)
    projectStore.actions.loadFromDataSource(client)
  }
  // const doAutoRotate = preferencesStore.store.useStore('doAutoRotate')
  // **

  // useEffect(() => {
  //   // **
  //   // console.debug('%c🥕 ThreeDGarden<FC,R3F>: onMount', ccm.blue, word)
  //   // console.debug(`%c====================================`, ccm.black)
  //   // ==========================================================
  //   // begin here ?? yes
  //   // bootManager()...
  //   // USE STORE
  //   // WORKING:
  //   // LOAD DEFAULT DATA ON START + REFRESH

  //   // console.log('%c🌱 doAutoLoadData', ccm.darkgreen, doAutoLoadData)
  //   // if (doAutoLoadData) {
  //   //   console.log('%c🌱 doAutoLoadData', ccm.darkgreen)
  //   //   projectStore.actions.loadFromDataSource(client)
  //   // }

  //   // ==========================================================
  //   return () => {
  //     console.debug('ThreeDGarden onUnmount', word)
  //   }
  // }, [])

  // ==========================================================
  // FC returns JSX
  return (
    <Box
      id='threedgarden'
      style={{width: '100%'}}
    >
      {/* SUSPENSEFUL... */}
      <Suspense fallback={<Spinner />}>

        {/* THREED TOOLBAR */}
        <ThreeDToolbar />

        {/* THREED CANVAS VIEWER */}
        {/* <ThreeDCanvasViewer threeddata={threeddata} projectName={projectName} setProjectName={setProjectName} /> */}
        <ThreeDCanvasViewer />

        {/* THREED CONTROL PANELS -- STORE ACCESS (apollo, valtio, leva) */}
        <ThreeDControlPanels tabs={tabProps} />

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

      </Suspense>
      {/* ...SUSPENSEFUL */}
    </Box>
  )
}

export default ThreeDGarden
