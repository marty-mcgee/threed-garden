// 'use client'
// ==========================================================
// RESOURCES

// ** REACT Imports
import {
  useEffect,
  useRef,
  useState,
  // useCallback,
  ReactNode,
  FC,
  Suspense,
  PointerEventHandler,
  SyntheticEvent,
} from 'react'
import { useFrame, useThree } from '@react-three/fiber'

// ** APOLLO Imports
import { useReactiveVar, useApolloClient } from '@apollo/client'
import { preferencesDataVar } from '#/lib/stores/apollo'
// import { stores, queries, mutations } from '#/lib/stores/apollo'
import stores from '#/lib/stores/apollo'

// ** Leva GUI
// import { ThreeDLevaControls, ThreeDLevaComponent } from '#/lib/threed/components/controls/LevaControls'

// ** RADIX-UI Imports
import * as Accordion from '@radix-ui/react-accordion'
import {
  Box,
  Button,
  Text,
} from '@radix-ui/themes'
// ** MUI Imports
// import { styled } from '@mui/material/styles'
// import Box from '@mui/material/Box'
// import MuiButton from '@mui/material/Button'
// import MuiTabs from '@mui/material/Tabs'
// import Tab from '@mui/material/Tab'
// import Accordion.Item, { tabProps } from '#/lib/mui/Accordion.Item'
// import Text from '@mui/material/Text'

// ** HELPER Imports
import { Perf, PerfHeadless, usePerf } from 'r3f-perf'
// import Cubes from './Cubes' // for PerfHeadless
import Spinner from '#/layout/ui/components/spinner'
// ** HELPFUL UTIL: COLORFUL CONSOLE MESSAGES (ccm)
import ccm from '#/lib/utils/console-colors'


// ==========================================================
// Debugging (Perf: Monitor Reports)
// https://codesandbox.io/p/sandbox/perlin-cubes-r3f-perf-headless-forked-zq734s
// **
const DebugHeadless = () => {

  // @ts-expect-error
  const [log, getReport] = usePerf((s) => [s.log, s.getReport])
  // console.log(getReport())

  return (
    <div>
      <div><b>LOG Realtime:</b></div>
      <code>
        {log &&
          Object.entries(log).map(([key, val]) => (
            <div key={key}>
              {/* @ts-expect-error */}
              {key}: {parseFloat(val).toFixed(3)}
            </div>
          ))}
      </code>
      <br/>
      <div><b>REPORT: Data gathered for {parseFloat(getReport().sessionTime).toFixed(2)}s</b></div>
      <code>
        averages:
        {Object.entries(getReport().log).map(([key, val]) => (
          <div key={key}>
            {/* @ts-expect-error */}
            {key}: {parseFloat(val).toFixed(3)}
          </div>
        ))}
      </code>
    </div>
  )
}
const Debug = () => {
  const { width } = useThree((s) => s.size)
  return (
    /* This is it -> */
    <PerfHeadless 
      // logsPerSecond?: 10, // Refresh rate of the logs
      // antialias?: true, // Take a bit more performances but render the text with antialiasing
      // overClock?: false, // Disable the limitation of the monitor refresh rate for the fps
      // deepAnalyze?: false, // More detailed informations about gl programs
      // showGraph?: true // show the graphs
      // minimal?: false // condensed version with the most important informations (gpu/memory/fps/custom data)
      // customData?: {
      //   value: 0, // initial value,
      //   name: '', // name to show
      //   round: 2, // precision of the float
      //   info: '', // additional information about the data (fps/ms for instance)
      // }
      // matrixUpdate?: false // count the number of time matrixWorldUpdate is called per frame
      // chart?: {
      //   hz: 60, // graphs refresh frequency parameter
      //   length: 120, // number of values shown on the monitor
      // }
      // colorBlind?: false // Color blind colors for accessibility
      // className?: '' // override CSS class
      // style?: {} // override style
      // position?: 'top-right'|'top-left'|'bottom-right'|'bottom-left' // quickly set the position, default is top-right
      minimal={width < 712} 
      showGraph={false} // show the graphs
      // logsPerSecond={1} // Refresh rate of the logs
      // chart={{
      //   hz: 1, // graphs refresh frequency parameter
      //   length: 12, // number of values shown on the monitor
      // }}
    />
  )
}

// const Controls = () => {
//   const { camera, gl, invalidate } = useThree()
//   const ref = useRef()
//   useFrame(() => ref.current.update())
//   useEffect(() => void ref.current.addEventListener('change', invalidate), [])
//   return <orbitControls ref={ref} enableDamping args={[camera, gl.domElement]} />
// }

function DebugView() {
  // const control = useRef()

  return (
    <>
      <DebugHeadless />
      {/* <Canvas
        linear={false}
        concurrent
        shadowMap
        orthographic
        pixelRatio={[1, 2]}
        camera={{ position: [0, 0, 10], near: 1, far: 15, zoom: 50 }}>
        <Controls ref={control} />
        <ambientLight />
        <directionalLight />
        <Suspense fallback={null}>
          <Cubes position={[0, 0, 0]} rotation={[0, 0, Math.PI]} />
          <Debug />
        </Suspense>
      </Canvas> */}
    </>
  )
}


// ==========================================================

// const Tabs = styled(MuiTabs)(({ theme }) => ({
//   overflow: `scroll !important`,
// }))

// const Button = styled(MuiButton)(({ theme }) => ({
//   marginRight: `0.25rem !important`,
//   padding: `0.5rem 0.5rem !important`,
//   minWidth: `2.0rem !important`,
// }))

// ==========================================================
// FUNCTIONAL STORES
// ==========================================================

const {
  // nounStore,
  projectStore,
  participantStore,
  preferencesStore,
  planStore,
  threedStore,
  fileStore,
  sceneStore,
  allotmentStore,
  bedStore,
  plantStore,
  plantingPlanStore,
  // bearStore,
  // modalStore,
  // modalAboutStore,
  // modalModel3dStore,
  // modalLoadingStore,
  // modalShareStore,
  // modalStoreNoun,
} = stores
// console.debug('%cstores available', ccm.orange, stores)
// console.debug(`%c====================================`, ccm.black)

// **
export const ThreeDControlPanels = (
  // { projectName,
  //   setProjectName
  // }: {
  //   projectName: string,
  //   setProjectName: Function
  // }
): ReactNode => {

  // ==========================================================
  // Tabs
  //
  const [tabControlValue, setTabControlValue] = useState('Preferences')
  const onChangeTabControlValue = (event: SyntheticEvent, newValue: string) => {
    setTabControlValue(newValue)
    localStorage.setItem('threed_tabControlValue', newValue)
  }

  // ==========================================================
  // Component onMount hook
  //
  useEffect(() => {
    // **
    // set open tab
    const openTab: string = String(localStorage.getItem('threed_tabControlValue'))
    setTabControlValue(openTab ? openTab : 'Preferences')

    // ==========================================================
    // return () => {
    //   console.debug('ThreeDGarden onUnmount', word)
    // }
  }, [])

  // **
  return (
    <Box id='threedStoresControlPanel'>

      {/* <Tabs
        value={tabControlValue}
        onChange={onChangeTabControlValue}
        aria-label='ThreeD Control Panel'
      >
        <Tab label='Preferences' {...tabProps(0)} />
        <Tab label='Projects' {...tabProps(1)} />
        <Tab label='Plans' {...tabProps(2)} />
        <Tab label='ThreeDs' {...tabProps(3)} />
        <Tab label='Files' {...tabProps(4)} />
        <Tab label='Scenes' {...tabProps(5)} />
        <Tab label='Allotments' {...tabProps(6)} />
        <Tab label='Beds' {...tabProps(7)} />
        <Tab label='Plants' {...tabProps(8)} />
        <Tab label='Schedules' {...tabProps(9)} />
        <Tab label='Tests' {...tabProps(10)} />
      </Tabs> */}
        
      {/**/}

      <Accordion.Root 
        type="multiple" 
        // orientation="horizontal" 
        collapsible={'true'}
        defaultValue="Preferences"
        // value={tabControlValue}
        // onChange={onChangeTabControlValue}
        // aria-label='ThreeD Control Panel'
      >
        {/**/}

        <Accordion.Item value={'Tests'} key={tabControlValue + '_T'}>
          <Accordion.Header>
            <Accordion.Trigger 
              className="AccordionTrigger"
            >
              Tests
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="AccordionContent">
            <Box>
              <DebugView />
              {/* <CharacterControlPanel /> */}
              {/* <CharacterInfoPanel /> */}
              {/* <hr /> */}
              {/* <FurnitureControlPanel /> */}
              {/* <FurnitureInfoPanel /> */}
              {/* <hr /> */}
              {/* <ChickenControlPanel /> */}
              {/* <ChickenInfoPanel /> */}
              {/* <hr /> */}
              {/* <BearControlPanel /> */}
              {/* <BearInfoPanel /> */}
              {/* <hr /> */}
            </Box>
            {/* <Box style={{ paddingLeft: 2}}>
              <ThreeDLevaComponent projectName={projectName} setProjectName={setProjectName} />
              <input type='button' onClick={(e) => setProjectName('TEST')} value='TEST' />
              <input type='button' onClick={(e) => setProjectName('PROJECT MMMM')} value='DEFAULT' />
            </Box> */}
          </Accordion.Content>
        </Accordion.Item>
        
        <Accordion.Item value={'Preferences'} key={tabControlValue + '_0'}>
          <Accordion.Header>
            <Accordion.Trigger 
              // className="AccordionTrigger"
            >
              Preferences
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="AccordionContent">
            <PreferencesControlPanel />
            <PreferencesInfoPanel />
          </Accordion.Content>
        </Accordion.Item>

        <Accordion.Item value={'Projects'} key={tabControlValue + '_1'}>
          <Accordion.Header>
            <Accordion.Trigger 
              // className="AccordionTrigger"
            >
              Projects
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="AccordionContent">
            <ProjectControlPanel />
            <ProjectInfoPanel />
          </Accordion.Content>
        </Accordion.Item>

        <Accordion.Item value={'Plans'} key={tabControlValue + '_2'}>
          <Accordion.Header>
            <Accordion.Trigger>Plans</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="AccordionContent">
            <PlanControlPanel />
            <PlanInfoPanel />
          </Accordion.Content>
        </Accordion.Item>

        <Accordion.Item value={'ThreeDs'} key={tabControlValue + '_3'}>
          <Accordion.Header>
            <Accordion.Trigger>ThreeDs</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="AccordionContent">
            <ThreeDControlPanel />
            <ThreeDInfoPanel />
          </Accordion.Content>
        </Accordion.Item>

        <Accordion.Item value={'Files'} key={tabControlValue + '_4'}>
          <Accordion.Header>
            <Accordion.Trigger>Files</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="AccordionContent">
            <FileControlPanel />
            <FileInfoPanel />
          </Accordion.Content>
        </Accordion.Item>

        <Accordion.Item value={'Scenes'} key={tabControlValue + '_5'}>
          <Accordion.Header>
            <Accordion.Trigger>Scenes</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="AccordionContent">
            <SceneControlPanel />
            <SceneInfoPanel />
          </Accordion.Content>
        </Accordion.Item>

        <Accordion.Item value={'Allotments'} key={tabControlValue + '_6'}>
          <Accordion.Header>
            <Accordion.Trigger>Allotments</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="AccordionContent">
            <AllotmentControlPanel />
            <AllotmentInfoPanel />
          </Accordion.Content>
        </Accordion.Item>

        <Accordion.Item value={'Beds'} key={tabControlValue + '_7'}>
          <Accordion.Header>
            <Accordion.Trigger>Beds</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="AccordionContent">
            <BedControlPanel />
            <BedInfoPanel />
          </Accordion.Content>
        </Accordion.Item>

        <Accordion.Item value={'Plants'} key={tabControlValue + '_8'}>
          <Accordion.Header>
            <Accordion.Trigger>Plants</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="AccordionContent">
            <PlantControlPanel />
            <PlantInfoPanel />
          </Accordion.Content>
        </Accordion.Item>

        <Accordion.Item value={'Planting Plans'} key={tabControlValue + '_9'}>
          <Accordion.Header>
            <Accordion.Trigger>Planting Plans</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="AccordionContent">
            <PlantingPlanControlPanel />
            <PlantingPlanInfoPanel />
          </Accordion.Content>
        </Accordion.Item>

        {/**/}
      </Accordion.Root>

    </Box>
  )
}

// ==========================================================
// Preferences

const PreferencesInfoPanel = (): JSX.Element => {
  // **
  const prefs = useReactiveVar(preferencesDataVar)
  // **
  const preferencesCount = preferencesStore.store.useStore('count')
  const preferencess = preferencesStore.store.useStore('all')
  const preferences = preferencesStore.store.useStore('one')
  // console.debug('preferences info panel ##', preferencesCount)
  // console.debug('preferences info panel []', preferencess)
  // console.debug('preferences info panel {}', preferences)
  // const preferencessDB = preferencesStore.store.useStore('allDB')
  // const preferencesDB = preferencesStore.store.useStore('oneDB')

  return (
    <Box style={{ paddingLeft: 2 }}>
      <Text as='div'><strong>prefs.projectName: {prefs.projectName}</strong></Text>
      <Text as='div'>preferences[s].length: {preferencess.length} | count: {preferencesCount}</Text>
      { preferences?._id && (
        <Text as='div'>preferences._id: {preferences._id}</Text>
      )}
        {/* <Text as='div'>preferences._ts: {preferences._ts}</Text> */}
        <Text as='div'>preferences._name: {preferences._name}</Text>
        <Text as='div'>preferences.data.title: {preferences.data.title}</Text>
        <Text as='div'>preferences.data.doAutoLoadData: {preferences.data?.doAutoLoadData?.toString()}</Text>
        <Text as='div'>preferences.data.doAutoRotate: {preferences.data?.doAutoRotate?.toString()}</Text>
        <Text as='div'>preferences.data.projectName: {preferences.data?.projectName?.toString()}</Text>
    </Box>
  )
}

const PreferencesControlPanel = (): JSX.Element => {

  const client = useApolloClient()

  const addNew = () => preferencesStore.actions.addNew()
  const saveToDisk = () => preferencesStore.actions.saveToDisk()
  const loadFromDisk = () => preferencesStore.actions.loadFromDisk()
  const loadFromDB = () => preferencesStore.actions.loadFromDB(client)
  const saveToDB = () => preferencesStore.actions.saveToDB(client)
  const removeAll = () => preferencesStore.actions.removeAll()
  const increaseCount = () => preferencesStore.store.update('count', preferencesStore.actions.increaseCount())
  const decreaseCount = () => preferencesStore.store.update('count', preferencesStore.actions.decreaseCount())
  const getState = () => preferencesStore.actions.getState()

  return (
    <Box>
      <Button onClick={loadFromDB} style={{color: 'orange'}}>load from db</Button>
      <Button onClick={saveToDB}>save to db</Button>
      <Button onClick={loadFromDisk} style={{color: 'orange'}}>load from disk</Button>
      <Button onClick={saveToDisk}>save to disk</Button>
      <Button onClick={addNew}>add new</Button>
      <Button onClick={removeAll} style={{color: 'darkred'}}>remove all</Button>
      {/* <Button onClick={increaseCount}>+</Button> */}
      {/* <Button onClick={decreaseCount}>-</Button> */}
      <Button onClick={getState}>get state</Button>
    </Box>
  )
}

// ==========================================================
// Project

const ProjectInfoPanel = (): JSX.Element => {
  // **
  const prefs = useReactiveVar(preferencesDataVar)
  // **
  const projectCount = projectStore.store.useStore('count')
  const projects = projectStore.store.useStore('all')
  const project = projectStore.store.useStore('one')
  // const projectsDB = projectStore.store.useStore('allDB')
  // const projectDB = projectStore.store.useStore('oneDB')
  let projectName = project._name
      projectName = project.data?.title
      projectName = prefs.projectName

  return (
    <Box style={{ paddingLeft: 2 }}>
      <Text as='div'><strong>prefs.projectName: {projectName}</strong></Text>
      <Text as='div'>projects.length: {projects.length} | count: {projectCount}</Text>
      {/* <Text as='div'>projectsDB: {projectsDB.length}</Text> */}
      <Text as='div'>project._id: {project._id}</Text>
      {/* <Text as='div'>project._ts: {project._ts}</Text> */}
      <Text as='div'>project._name: {project._name}</Text>
      <Text as='div'>project.data.title: {project.data?.title}</Text>
      <Text as='div'>project.data.scene[s]: {project.data?.scenes?.nodes[0].title}</Text>
      <Text as='div'>project.data.plan[s]: {project.data?.plans?.nodes[0].title}</Text>
    </Box>
  )
}

const ProjectControlPanel = (): JSX.Element => {

  const client = useApolloClient()

  const addNew = () => projectStore.actions.addNew()
  const saveToDisk = () => projectStore.actions.saveToDisk()
  const loadFromDisk = () => projectStore.actions.loadFromDisk()
  const loadFromDB = () => projectStore.actions.loadFromDB(client)
  const saveToDB = () => projectStore.actions.saveToDB(client)
  const removeAll = () => projectStore.actions.removeAll()
  const increaseCount = () => projectStore.store.update('count', projectStore.actions.increaseCount())
  const decreaseCount = () => projectStore.store.update('count', projectStore.actions.decreaseCount())
  const getState = () => projectStore.actions.getState()
  // **
  const loadToCanvas = () => {

    // LOAD APOLLO STORE STATE TO VALTIO STATE ????

    let nodesToCreateOnCanvas = []
    nodesToCreateOnCanvas = projectStore.actions.loadToCanvas(
      client,
      // [],
      projectStore.store.get('one').data.plans.nodes[0].threedsActive.nodes, // plans[] of threeds[]
      'project', // _type
      'plansOfThreeDNodes', // _requestType
      '3333', // _id
      '_r3fCanvas' // _r3fCanvas id to write changes to
    )

    return (
      nodesToCreateOnCanvas
    )
  }

  return (
    <Box>
      <Button onClick={loadFromDB} style={{color: 'orange'}}>load from db</Button>
      <Button onClick={saveToDB}>save to db</Button>
      <Button onClick={loadFromDisk} style={{color: 'orange'}}>load from disk</Button>
      <Button onClick={saveToDisk}>save to disk</Button>
      <Button onClick={addNew}>add new</Button>
      <Button onClick={removeAll} style={{color: 'darkred'}}>remove all</Button>
      {/* <Button onClick={increaseCount}>+</Button> */}
      {/* <Button onClick={decreaseCount}>-</Button> */}
      <Button onClick={getState}>get state</Button>
      <Button onClick={loadToCanvas} style={{color: 'blue'}}>load to canvas</Button>
    </Box>
  )
}

// ==========================================================
// Participant

const ParticipantInfoPanel = (): JSX.Element => {
  const participantCount = participantStore.store.useStore('count')
  const participants = participantStore.store.useStore('all')
  const participant = participantStore.store.useStore('one')
  // const participantsDB = participantStore.store.useStore('allDB')
  // const participantDB = participantStore.store.useStore('oneDB')

  return (
    <Box style={{ paddingLeft: 2 }}>
      <Text as='div'>{participantCount} participants around here ...</Text>
      <Text as='div'>participants: {participants.length}</Text>
      {/* <Text as='div'>participantsDB: {participantsDB.length}</Text> */}
      <Text as='div'>participant._id: {participant._id}</Text>
      <Text as='div'>participant._ts: {participant._ts}</Text>
      <Text as='div'>participant._name: {participant._name}</Text>
      <Text as='div'>participant.data.title: {participant.data?.title}</Text>
    </Box>
  )
}

const ParticipantControlPanel = (): JSX.Element => {

  const client = useApolloClient()

  const addNew = () => participantStore.actions.addNew()
  const saveToDisk = () => participantStore.actions.saveToDisk()
  const loadFromDisk = () => participantStore.actions.loadFromDisk()
  const loadFromDB = () => participantStore.actions.loadFromDB(client)
  const saveToDB = () => participantStore.actions.saveToDB(client)
  const removeAll = () => participantStore.actions.removeAll()
  const increaseCount = () => participantStore.store.update('count', participantStore.actions.increaseCount())
  const decreaseCount = () => participantStore.store.update('count', participantStore.actions.decreaseCount())
  const getState = () => participantStore.actions.getState()
  const loadToCanvas = () => participantStore.actions.loadToCanvas()

  return (
    <Box>
      <Button onClick={loadFromDB} style={{color: 'orange'}}>load from db</Button>
      <Button onClick={saveToDB}>save to db</Button>
      <Button onClick={loadFromDisk} style={{color: 'orange'}}>load from disk</Button>
      <Button onClick={saveToDisk}>save to disk</Button>
      <Button onClick={addNew}>add new</Button>
      <Button onClick={removeAll} style={{color: 'darkred'}}>remove all</Button>
      {/* <Button onClick={increaseCount}>+</Button> */}
      {/* <Button onClick={decreaseCount}>-</Button> */}
      {/*  */}
      <Button onClick={getState}>get state</Button>
      <Button onClick={loadToCanvas} style={{color: 'blue'}}>load to canvas</Button>
    </Box>
  )
}

// ==========================================================
// Plan

const PlanInfoPanel = (): JSX.Element => {
  const planCount = planStore.store.useStore('count')
  const plans = planStore.store.useStore('all')
  const plan = planStore.store.useStore('one')
  // const plansDB = planStore.store.useStore('allDB')
  // const planDB = planStore.store.useStore('oneDB')

  return (
    <Box style={{ paddingLeft: 2 }}>
      <Text as='div'>{planCount} plans around here ...</Text>
      <Text as='div'>plans: {plans.length}</Text>
      {/* <Text as='div'>plansDB: {plansDB.length}</Text> */}
      <Text as='div'>plan._id: {plan._id}</Text>
      <Text as='div'>plan._ts: {plan._ts}</Text>
      <Text as='div'>plan._name: {plan._name}</Text>
      <Text as='div'>plan.data.title: {plan.data?.title}</Text>
    </Box>
  )
}

const PlanControlPanel = (): JSX.Element => {

  const client = useApolloClient()

  const addNew = () => planStore.actions.addNew()
  const saveToDisk = () => planStore.actions.saveToDisk()
  const loadFromDisk = () => planStore.actions.loadFromDisk()
  const loadFromDB = () => planStore.actions.loadFromDB(client)
  const saveToDB = () => planStore.actions.saveToDB(client)
  const removeAll = () => planStore.actions.removeAll()
  const increaseCount = () => planStore.store.update('count', planStore.actions.increaseCount())
  const decreaseCount = () => planStore.store.update('count', planStore.actions.decreaseCount())
  const getState = () => planStore.actions.getState()
  const loadToCanvas = () => planStore.actions.loadToCanvas()

  return (
    <Box>
      <Button onClick={loadFromDB} style={{color: 'orange'}}>load from db</Button>
      <Button onClick={saveToDB}>save to db</Button>
      <Button onClick={loadFromDisk} style={{color: 'orange'}}>load from disk</Button>
      <Button onClick={saveToDisk}>save to disk</Button>
      <Button onClick={addNew}>add new</Button>
      <Button onClick={removeAll} style={{color: 'darkred'}}>remove all</Button>
      {/* <Button onClick={increaseCount}>+</Button> */}
      {/* <Button onClick={decreaseCount}>-</Button> */}
      {/*  */}
      <Button onClick={getState}>get state</Button>
      <Button onClick={loadToCanvas} style={{color: 'blue'}}>load to canvas</Button>
    </Box>
  )
}

// ==========================================================
// ThreeD

const ThreeDInfoPanel = (): JSX.Element => {
  const threedCount = threedStore.store.useStore('count')
  const threeds = threedStore.store.useStore('all')
  const threed = threedStore.store.useStore('one')
  // const threedsDB = threedStore.store.useStore('allDB')
  // const threedDB = threedStore.store.useStore('oneDB')

  return (
    <Box style={{ paddingLeft: 2 }}>
      <Text as='div'>{threedCount} threeds around here ...</Text>
      <Text as='div'>threeds: {threeds.length}</Text>
      {/* <Text as='div'>threedsDB: {threedsDB.length}</Text> */}
      <Text as='div'>threed._id: {threed._id}</Text>
      <Text as='div'>threed._ts: {threed._ts}</Text>
      <Text as='div'>threed._name: {threed._name}</Text>
      <Text as='div'>threed.data.title: {threed.data?.title}</Text>
    </Box>
  )
}

const ThreeDControlPanel = (): JSX.Element => {

  const client = useApolloClient()

  const addNew = () => threedStore.actions.addNew()
  const saveToDisk = () => threedStore.actions.saveToDisk()
  const loadFromDisk = () => threedStore.actions.loadFromDisk()
  const loadFromDB = () => threedStore.actions.loadFromDB(client)
  const saveToDB = () => threedStore.actions.saveToDB(client)
  const removeAll = () => threedStore.actions.removeAll()
  const increaseCount = () => threedStore.store.update('count', threedStore.actions.increaseCount())
  const decreaseCount = () => threedStore.store.update('count', threedStore.actions.decreaseCount())
  const getState = () => threedStore.actions.getState()
  const loadToCanvas = () => threedStore.actions.loadToCanvas()

  return (
    <Box>
      <Button onClick={loadFromDB} style={{color: 'orange'}}>load from db</Button>
      <Button onClick={saveToDB}>save to db</Button>
      <Button onClick={loadFromDisk} style={{color: 'orange'}}>load from disk</Button>
      <Button onClick={saveToDisk}>save to disk</Button>
      <Button onClick={addNew}>add new</Button>
      <Button onClick={removeAll} style={{color: 'darkred'}}>remove all</Button>
      {/* <Button onClick={increaseCount}>+</Button> */}
      {/* <Button onClick={decreaseCount}>-</Button> */}
      {/*  */}
      <Button onClick={getState}>get state</Button>
      <Button onClick={loadToCanvas} style={{color: 'blue'}}>load to canvas</Button>
    </Box>
  )
}

// ==========================================================
// File

const FileInfoPanel = (): JSX.Element => {
  const fileCount = fileStore.store.useStore('count')
  const files = fileStore.store.useStore('all')
  const file = fileStore.store.useStore('one')
  // const filesDB = fileStore.store.useStore('allDB')
  // const fileDB = fileStore.store.useStore('oneDB')

  return (
    <Box style={{ paddingLeft: 2 }}>
      <Text as='div'>{fileCount} files around here ...</Text>
      <Text as='div'>files: {files.length}</Text>
      {/* <Text as='div'>filesDB: {filesDB.length}</Text> */}
      <Text as='div'>file._id: {file._id}</Text>
      <Text as='div'>file._ts: {file._ts}</Text>
      <Text as='div'>file._name: {file._name}</Text>
      <Text as='div'>file.data.title: {file.data?.title}</Text>
    </Box>
  )
}

const FileControlPanel = (): JSX.Element => {

  const client = useApolloClient()

  const addNew = () => fileStore.actions.addNew()
  const saveToDisk = () => fileStore.actions.saveToDisk()
  const loadFromDisk = () => fileStore.actions.loadFromDisk()
  const loadFromDB = () => fileStore.actions.loadFromDB(client)
  const saveToDB = () => fileStore.actions.saveToDB(client)
  const removeAll = () => fileStore.actions.removeAll()
  const increaseCount = () => fileStore.store.update('count', fileStore.actions.increaseCount())
  const decreaseCount = () => fileStore.store.update('count', fileStore.actions.decreaseCount())
  const getState = () => fileStore.actions.getState()
  const loadToCanvas = () => fileStore.actions.loadToCanvas()

  return (
    <Box>
      <Button onClick={loadFromDB} style={{color: 'orange'}}>load from db</Button>
      <Button onClick={saveToDB}>save to db</Button>
      <Button onClick={loadFromDisk} style={{color: 'orange'}}>load from disk</Button>
      <Button onClick={saveToDisk}>save to disk</Button>
      <Button onClick={addNew}>add new</Button>
      <Button onClick={removeAll} style={{color: 'darkred'}}>remove all</Button>
      {/* <Button onClick={increaseCount}>+</Button> */}
      {/* <Button onClick={decreaseCount}>-</Button> */}
      {/*  */}
      <Button onClick={getState}>get state</Button>
      <Button onClick={loadToCanvas} style={{color: 'blue'}}>load to canvas</Button>
    </Box>
  )
}

// ==========================================================
// Simulation

// ==========================================================
// Scene

const SceneInfoPanel = (): JSX.Element => {
  const sceneCount = sceneStore.store.useStore('count')
  // const sceneCountDB = sceneStore.store.useStore('countDB')
  const scenes = sceneStore.store.useStore('all')
  const scene = sceneStore.store.useStore('one')
  // const scenesDB = sceneStore.store.useStore('allDB')
  // const sceneDB = sceneStore.store.useStore('oneDB')

  return (
    <Box style={{ paddingLeft: 2 }}>
      <Text as='div'>all.length: {scenes.length}</Text>
      <Text as='div'>one._id: {scene._id}</Text>
      <Text as='div'>one._ts: {scene._ts}</Text>
      <Text as='div'>one._name: {scene._name}</Text>
      <Text as='div'>one.data.title: {scene.data?.title}</Text>
    </Box>
  )
}

const SceneControlPanel = (): JSX.Element => {

  const client = useApolloClient()

  const addNew = () => sceneStore.actions.addNew()
  const saveToDisk = () => sceneStore.actions.saveToDisk()
  const loadFromDisk = () => sceneStore.actions.loadFromDisk()
  const loadFromDB = () => sceneStore.actions.loadFromDB(client)
  const saveToDB = () => sceneStore.actions.saveToDB(client)
  const removeAll = () => sceneStore.actions.removeAll()
  const increaseCount = () => sceneStore.store.update('count', sceneStore.actions.increaseCount())
  const decreaseCount = () => sceneStore.store.update('count', sceneStore.actions.decreaseCount())
  const getState = () => sceneStore.actions.getState()
  const loadToCanvas = () => sceneStore.actions.loadToCanvas()

  return (
    <Box>
      <Button onClick={loadFromDB}>load from db</Button>
      <Button onClick={saveToDB}>save to db</Button>
      <Button onClick={loadFromDisk}>load from disk</Button>
      <Button onClick={saveToDisk}>save to disk</Button>
      <Button onClick={addNew}>add new</Button>
      <Button onClick={removeAll}>remove all</Button>
      {/* <Button onClick={increaseCount}>+</Button> */}
      {/* <Button onClick={decreaseCount}>-</Button> */}
      {/*  */}
      <Button onClick={getState}>get state</Button>
      <Button onClick={loadToCanvas}>load to canvas</Button>
    </Box>
  )
}

// ==========================================================
// Allotment

const AllotmentInfoPanel = (): JSX.Element => {
  const allotmentCount = allotmentStore.store.useStore('count')
  const allotments = allotmentStore.store.useStore('all')
  const allotment = allotmentStore.store.useStore('one')
  // const allotmentsDB = allotmentStore.store.useStore('allDB')
  // const allotmentDB = allotmentStore.store.useStore('oneDB')

  return (
    <Box style={{ paddingLeft: 2 }}>
      <Text as='div'>{allotmentCount} allotments around here ...</Text>
      <Text as='div'>allotments: {allotments.length}</Text>
      {/* <Text as='div'>allotmentsDB: {allotmentsDB.length}</Text> */}
      <Text as='div'>allotment._id: {allotment._id}</Text>
      <Text as='div'>allotment._ts: {allotment._ts}</Text>
      <Text as='div'>allotment._name: {allotment._name}</Text>
      <Text as='div'>allotment.data.title: {allotment.data?.title}</Text>
    </Box>
  )
}

const AllotmentControlPanel = (): JSX.Element => {

  const client = useApolloClient()

  const addNew = () => allotmentStore.actions.addNew()
  const saveToDisk = () => allotmentStore.actions.saveToDisk()
  const loadFromDisk = () => allotmentStore.actions.loadFromDisk()
  const loadFromDB = () => allotmentStore.actions.loadFromDB(client)
  const saveToDB = () => allotmentStore.actions.saveToDB(client)
  const removeAll = () => allotmentStore.actions.removeAll()
  const increaseCount = () => allotmentStore.store.update('count', allotmentStore.actions.increaseCount())
  const decreaseCount = () => allotmentStore.store.update('count', allotmentStore.actions.decreaseCount())
  const getState = () => allotmentStore.actions.getState()
  const loadToCanvas = () => allotmentStore.actions.loadToCanvas()

  return (
    <Box>
      <Button onClick={loadFromDB} style={{color: 'orange'}}>load from db</Button>
      <Button onClick={saveToDB}>save to db</Button>
      <Button onClick={loadFromDisk} style={{color: 'orange'}}>load from disk</Button>
      <Button onClick={saveToDisk}>save to disk</Button>
      <Button onClick={addNew}>add new</Button>
      <Button onClick={removeAll} style={{color: 'darkred'}}>remove all</Button>
      {/* <Button onClick={increaseCount}>+</Button> */}
      {/* <Button onClick={decreaseCount}>-</Button> */}
      {/*  */}
      <Button onClick={getState}>get state</Button>
      <Button onClick={loadToCanvas} style={{color: 'blue'}}>load to canvas</Button>
    </Box>
  )
}

// ==========================================================
// Bed

const BedInfoPanel = (): JSX.Element => {
  const bedCount = bedStore.store.useStore('count')
  const beds = bedStore.store.useStore('all')
  const bed = bedStore.store.useStore('one')
  // const bedsDB = bedStore.store.useStore('allDB')
  // const bedDB = bedStore.store.useStore('oneDB')

  return (
    <Box style={{ paddingLeft: 2 }}>
      <Text as='div'>{bedCount} beds around here ...</Text>
      <Text as='div'>beds: {beds.length}</Text>
      {/* <Text as='div'>bedsDB: {bedsDB.length}</Text> */}
      <Text as='div'>bed._id: {bed._id}</Text>
      <Text as='div'>bed._ts: {bed._ts}</Text>
      <Text as='div'>bed._name: {bed._name}</Text>
      <Text as='div'>bed.data.title: {bed.data?.title}</Text>
    </Box>
  )
}

const BedControlPanel = (): JSX.Element => {

  const client = useApolloClient()

  const addNew = () => bedStore.actions.addNew()
  const saveToDisk = () => bedStore.actions.saveToDisk()
  const loadFromDisk = () => bedStore.actions.loadFromDisk()
  const loadFromDB = () => bedStore.actions.loadFromDB(client)
  const saveToDB = () => bedStore.actions.saveToDB(client)
  const removeAll = () => bedStore.actions.removeAll()
  const increaseCount = () => bedStore.store.update('count', bedStore.actions.increaseCount())
  const decreaseCount = () => bedStore.store.update('count', bedStore.actions.decreaseCount())
  const getState = () => bedStore.actions.getState()
  const loadToCanvas = () => bedStore.actions.loadToCanvas()

  return (
    <Box>
      <Button onClick={loadFromDB} style={{color: 'orange'}}>load from db</Button>
      <Button onClick={saveToDB}>save to db</Button>
      <Button onClick={loadFromDisk} style={{color: 'orange'}}>load from disk</Button>
      <Button onClick={saveToDisk}>save to disk</Button>
      <Button onClick={addNew}>add new</Button>
      <Button onClick={removeAll} style={{color: 'darkred'}}>remove all</Button>
      {/* <Button onClick={increaseCount}>+</Button> */}
      {/* <Button onClick={decreaseCount}>-</Button> */}
      {/*  */}
      <Button onClick={getState}>get state</Button>
      <Button onClick={loadToCanvas} style={{color: 'blue'}}>load to canvas</Button>
    </Box>
  )
}

// ==========================================================
// Plant

const PlantInfoPanel = (): JSX.Element => {
  const plantCount = plantStore.store.useStore('count')
  const plants = plantStore.store.useStore('all')
  const plant = plantStore.store.useStore('one')
  // const plantsDB = plantStore.store.useStore('allDB')
  // const plantDB = plantStore.store.useStore('oneDB')

  return (
    <Box style={{ paddingLeft: 2 }}>
      <Text as='div'>{plantCount} plants around here ...</Text>
      <Text as='div'>plants: {plants.length}</Text>
      {/* <Text as='div'>plantsDB: {plantsDB.length}</Text> */}
      <Text as='div'>plant._id: {plant._id}</Text>
      <Text as='div'>plant._ts: {plant._ts}</Text>
      <Text as='div'>plant._name: {plant._name}</Text>
      <Text as='div'>plant.data.title: {plant.data?.title}</Text>
    </Box>
  )
}

const PlantControlPanel = (): JSX.Element => {

  const client = useApolloClient()

  const addNew = () => plantStore.actions.addNew()
  const saveToDisk = () => plantStore.actions.saveToDisk()
  const loadFromDisk = () => plantStore.actions.loadFromDisk()
  const loadFromDB = () => plantStore.actions.loadFromDB(client)
  const saveToDB = () => plantStore.actions.saveToDB(client)
  const removeAll = () => plantStore.actions.removeAll()
  const increaseCount = () => plantStore.store.update('count', plantStore.actions.increaseCount())
  const decreaseCount = () => plantStore.store.update('count', plantStore.actions.decreaseCount())
  const getState = () => plantStore.actions.getState()
  const loadToCanvas = () => plantStore.actions.loadToCanvas()

  return (
    <Box>
      <Button onClick={loadFromDB} style={{color: 'orange'}}>load from db</Button>
      <Button onClick={saveToDB}>save to db</Button>
      <Button onClick={loadFromDisk} style={{color: 'orange'}}>load from disk</Button>
      <Button onClick={saveToDisk}>save to disk</Button>
      <Button onClick={addNew}>add new</Button>
      <Button onClick={removeAll} style={{color: 'darkred'}}>remove all</Button>
      {/* <Button onClick={increaseCount}>+</Button> */}
      {/* <Button onClick={decreaseCount}>-</Button> */}
      {/*  */}
      <Button onClick={getState}>get state</Button>
      <Button onClick={loadToCanvas} style={{color: 'blue'}}>load to canvas</Button>
    </Box>
  )
}

// ==========================================================
// PlantingPlan

const PlantingPlanInfoPanel = (): JSX.Element => {
  const plantingPlanCount = plantingPlanStore.store.useStore('count')
  const plantingPlans = plantingPlanStore.store.useStore('all')
  const plantingPlan = plantingPlanStore.store.useStore('one')
  // const plantingPlansDB = plantingPlanStore.store.useStore('allDB')
  // const plantingPlanDB = plantingPlanStore.store.useStore('oneDB')

  return (
    <Box style={{ paddingLeft: 2 }}>
      <Text as='div'>{plantingPlanCount} plantingPlans around here ...</Text>
      <Text as='div'>plantingPlans: {plantingPlans.length}</Text>
      {/* <Text as='div'>plantingPlansDB: {plantingPlansDB.length}</Text> */}
      <Text as='div'>plantingPlan._id: {plantingPlan._id}</Text>
      <Text as='div'>plantingPlan._ts: {plantingPlan._ts}</Text>
      <Text as='div'>plantingPlan._name: {plantingPlan._name}</Text>
      <Text as='div'>plantingPlan.data.title: {plantingPlan.data?.title}</Text>
    </Box>
  )
}

const PlantingPlanControlPanel = (): JSX.Element => {

  const client = useApolloClient()

  const addNew = () => plantingPlanStore.actions.addNew()
  const saveToDisk = () => plantingPlanStore.actions.saveToDisk()
  const loadFromDisk = () => plantingPlanStore.actions.loadFromDisk()
  const loadFromDB = () => plantingPlanStore.actions.loadFromDB(client)
  const saveToDB = () => plantingPlanStore.actions.saveToDB(client)
  const removeAll = () => plantingPlanStore.actions.removeAll()
  const increaseCount = () => plantingPlanStore.store.update('count', plantingPlanStore.actions.increaseCount())
  const decreaseCount = () => plantingPlanStore.store.update('count', plantingPlanStore.actions.decreaseCount())
  const getState = () => plantingPlanStore.actions.getState()
  const loadToCanvas = () => plantingPlanStore.actions.loadToCanvas()

  return (
    <Box>
      <Button onClick={loadFromDB} style={{color: 'orange'}}>load from db</Button>
      <Button onClick={saveToDB}>save to db</Button>
      <Button onClick={loadFromDisk} style={{color: 'orange'}}>load from disk</Button>
      <Button onClick={saveToDisk}>save to disk</Button>
      <Button onClick={addNew}>add new</Button>
      <Button onClick={removeAll} style={{color: 'darkred'}}>remove all</Button>
      {/* <Button onClick={increaseCount}>+</Button> */}
      {/* <Button onClick={decreaseCount}>-</Button> */}
      {/*  */}
      <Button onClick={getState}>get state</Button>
      <Button onClick={loadToCanvas} style={{color: 'blue'}}>load to canvas</Button>
    </Box>
  )
}

// ==========================================================
// Bear (zustand)

// function BearInfoPanel() {
//   const bears = bearStore((state: any) => state.bears)
//   return <Box>{bears} bears around here ...</Box>
// }

// function BearControlPanel() {
//   const increaseBearCount = bearActions((state: any) => state.increaseBearCount)
//   return <Button onClick={increaseBearCount}>add a bear</Button>
// }

// ==========================================================

export default ThreeDControlPanels
