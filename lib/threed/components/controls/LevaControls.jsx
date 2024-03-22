import { useEffect, useRef } from 'react'
import {
  Leva, LevaPanel,
  useControls, useCreateStore,
  folder, monitor, button
} from 'leva'
import { useFullscreen } from 'react-use'
import { spring } from '@leva-ui/plugin-spring'
import { Noise } from 'noisejs'

// ** APOLLO Imports
// import { stores, queries, mutations } from '#/lib/stores/apollo'
import stores from '#/lib/stores/apollo'
import { makeVar, useReactiveVar, useApolloClient } from '@apollo/client'
import { preferencesVar } from '#/lib/threed/ThreeDGarden'

const noise = new Noise(Math.random())

// ==========================================================
// FUNCTIONAL STORES
// ==========================================================

const {
  // // nounStore,
  // projectStore,
  // participantStore,
  preferencesStore,
  // planStore,
  // threedStore,
  // fileStore,
  // sceneStore,
  // allotmentStore,
  // bedStore,
  // plantStore,
  // plantingPlanStore,
  // // bearStore,
  // // modalStore,
  // // modalAboutStore,
  // // modalModel3dStore,
  // // modalLoadingStore,
  // // modalShareStore,
  // // modalStoreNoun,
} = stores
// console.debug('%cstores available', ccm.orange, stores)
// console.debug(`%c====================================`, ccm.black)

// ==========================================================

function ThreeDPreferences() {
  // **
  const preferences = useReactiveVar(preferencesVar)
  console.log('SET SET SET SET SET SET BEFORE USE OF: preferences preferencesVar', preferences)
  console.debug('SET SET SET SET SET SET BEFORE USE OF: preferences preferencesVar', preferences)

  const doAutoLoadDataApollo = preferencesStore.store.useStore('doAutoLoadData')
  // const doAutoLoadDataApollo = useReactiveVar(preferencesVar).doAutoLoadData
  console.log('ThreeDLevaControls preferencesVar doAutoLoadDataApollo', doAutoLoadDataApollo)
  const doAutoLoadDataLeva = preferences.doAutoLoadData
  console.log('ThreeDLevaControls preferencesVar doAutoLoadDataLeva', doAutoLoadDataLeva)
  const doAutoLoadDataThreeD = useReactiveVar(preferencesVar).doAutoLoadData === doAutoLoadDataApollo === doAutoLoadDataLeva
  console.log('ThreeDLevaControls preferencesVar doAutoLoadDataThreeD', doAutoLoadDataThreeD)

  const doAutoRotateApollo = preferencesStore.store.useStore('doAutoRotate')
  // const doAutoRotateApollo = preferences.doAutoRotate
  console.log('ThreeDLevaControls preferencesVar doAutoRotateApollo', doAutoRotateApollo)
  const doAutoRotateLeva = preferences.doAutoRotate
  console.log('ThreeDLevaControls preferencesVar doAutoRotateLeva', doAutoRotateLeva)
  const doAutoRotateThreeD = useReactiveVar(preferencesVar).doAutoRotate === doAutoRotateApollo === doAutoRotateLeva
  console.log('ThreeDLevaControls preferencesVar doAutoRotateThreeD', doAutoRotateThreeD)


  const projectNameApollo = preferencesStore.store.useStore('projectName')
  // const projectNameApollo = preferences.projectName
  console.log('ThreeDLevaControls preferencesVar projectNameApollo', projectNameApollo)
  const projectNameLeva = preferences.projectName
  console.log('ThreeDLevaControls preferencesVar projectNameLeva', projectNameLeva)
  const projectNameThreeD = useReactiveVar(preferencesVar).projectName === projectNameApollo === projectNameLeva
  console.log('ThreeDLevaControls preferencesVar projectNameThreeD', projectNameThreeD)

  const [{
    doAutoRotate,
    doAutoLoadData,
  }, setUserPreferences] = useControls(
    'User Preferences',
    () => ({
      doAutoLoadData: {
        label: 'Auto Load Data?',
        value: doAutoLoadDataApollo,
      },
      doAutoRotate: {
        label: 'Auto Rotate?',
        value: doAutoRotateApollo,
      },
    }),
    {
      color: 'darkgreen',
      collapsed: false,
    },
  )

  const [{
    projectName,
    // refMonitor,
  }, setProjectPreferences] = useControls(
    'Project Preferences',
    () => ({
      projectName: {
        label: 'Project Name',
        value: projectNameApollo,
      },
      /** EXAMPLES
      number: { value: 10, step: 0.25 },
      image: { image: undefined },
      colorObj: { r: 1, g: 2, b: 3 },
      select: { options: ['x', 'y', ['x', 'y']] },
      interval: { min: -100, max: 100, value: [10, 15] },
      refMonitor: monitor(ref, { graph: true, interval: 60 }),
      showFolders: false,
      folders: folder(
        {
          // color2: '#fff',
          color: {
            value: '#ff005b',
            render: (get) => get('showFolders'),
          },
          folder2: folder(
            {
              'Hey Button': button(() => console.log('HEY HEY HEY')),
              folder3: folder(
                {
                  spring: spring(),
                  pos2d: { value: { x: 3, y: 4 } },
                  pos2dArr: { value: [100, 200], x: { max: 300 } },
                  pos3d: { value: { x: 0.3, k: 0.1, z: 0.5 }, j: { min: 0 } },
                  pos3dArr: [Math.PI / 2, 20, 4],
                },
                {
                  collapsed: true,
                  render: (get) => get('showFolders'),
                },
              ),
            },
            {
              collapsed: true,
              render: (get) => get('showFolders'),
            },
          ),
        },
        {
          collapsed: true,
          render: (get) => get('showFolders'),
        },
      ),
      */
    }),
    {
      color: 'darkgreen',
      collapsed: false,
    },
  )

  useEffect(() => {
    setUserPreferences({ doAutoLoadData: doAutoLoadDataApollo})
    preferencesStore.store.update('doAutoLoadData', doAutoLoadDataApollo)
  }, [doAutoLoadDataApollo])

  useEffect(() => {
    setUserPreferences({ doAutoRotate: doAutoRotateApollo})
    preferencesStore.store.update('doAutoRotate', doAutoRotateApollo)
  }, [doAutoRotateApollo])

  useEffect(() => {
    // set({ title: projectName})
    setProjectPreferences({ projectName: projectNameApollo})
    preferencesStore.store.update('projectName', projectNameApollo)
  }, [projectNameApollo])
}

// ==========================================================

export function ThreeDLevaControls() {
  // **
  const projectName = preferencesStore.store.useStore('projectName')
  console.log('ThreeDLevaControls projectName', projectName)
  // **
  const colorsStore = useCreateStore()
  const radiiStore = useCreateStore()
  const spaceStore = useCreateStore()
  const fontSizesStore = useCreateStore()
  const sizesStore = useCreateStore()
  const borderWidthsStore = useCreateStore()
  const fontWeightsStore = useCreateStore()

  const colors = useControls(
    {
      colors: folder({
        elevation1: '#09090D',
        elevation2: '#181C20',
        elevation3: '#373C4B',
        accent1: '#0066DC',
        accent2: '#007BFF',
        accent3: '#3C93FF',
        highlight1: '#535760',
        highlight2: '#8C92A4',
        highlight3: '#FEFEFE',
        vivid1: '#ffcc00',
      }),
    },
    { store: colorsStore }
  )

  const radii = useControls(
    {
      radii: folder({
        xs: '2px',
        sm: '3px',
        lg: '10px',
      }),
    },
    { store: radiiStore }
  )

  const space = useControls(
    {
      space: folder({
        sm: '6px',
        md: '6px',
        rowGap: '6px',
        colGap: '6px',
      }),
    },
    { store: spaceStore }
  )

  const fontSizes = useControls(
    {
      fontSizes: folder({
        root: '14px',
      }),
    },
    { store: fontSizesStore }
  )

  const sizes = useControls(
    {
      sizes: folder({
        rootWidth: '360px',
        controlWidth: '200px',
        numberInputMinWidth: '48px',
        scrubberWidth: '8px',
        scrubberHeight: '16px',
        rowHeight: '24px',
        folderHeight: '24px',
        folderTitleHeight: '24px',
        checkboxSize: '16px',
        joystickWidth: '100px',
        joystickHeight: '100px',
        colorPickerWidth: '200px',
        colorPickerHeight: '100px',
        monitorHeight: '64px',
        titleBarHeight: '40px',
      }),
    },
    { store: sizesStore }
  )

  const borderWidths = useControls(
    {
      borderWidths: folder({
        root: '0px',
        input: '1px',
        focus: '1px',
        hover: '1px',
        active: '1px',
        folder: '1px',
      }),
    },
    { store: borderWidthsStore }
  )

  const fontWeights = useControls(
    {
      fontWeights: folder({
        label: { value: 'normal', options: ['bold', 'light'] },
        folder: { value: 'normal', options: ['bold', 'light'] },
        button: { value: 'normal', options: ['bold', 'light'] },
      }),
    },
    { store: fontWeightsStore }
  )

  const theme = { colors, radii, space, fontSizes, sizes, borderWidths, fontWeights }


  // **
  const refMon = useRef(4) // 4 ?
  // **
  useEffect(() => {
    let x = 0
    setInterval(() => {
      x += 0.1
      const t = Date.now()
      refMon.current = 2 * noise.simplex2(3 * x + t, x) + (3 * Math.sin(x)) / x
    }, 30)
  }, [])


  // ** LEVA GUI CONTROL PANEL
  const [{
    showTitleBar,
    title,
    drag,
    filter,
    position,
    fullScreen,
    oneLineLabels,
    // **
    refMonitor
  }, set] = useControls(
    'Control Panel',
    () => ({
      showTitleBar: { value: true, render: (get) => get('Panel.showTitleBar') },
      title: { value: projectName, render: (get) => get('Panel.showTitleBar') },
      drag: { value: false, render: (get) => get('Panel.showTitleBar') },
      filter: { value: false, render: (get) => get('Panel.showTitleBar') },
      position: { value: { x: 0, y: 0 }, render: (get) => get('Panel.showTitleBar') },
      // fullScreen: false,
      // oneLineLabels: false,
      // **
      refMonitor: { value: monitor(refMon, { graph: true, interval: 60 }), render: (get) => get('Panel.showTitleBar') },
    }),
    {
      color: 'darkgreen',
      collapsed: false,
    },
  )

  useEffect(() => {
    set({ title: projectName})
    // set({ projectName: projectName})
  }, [projectName])

  // useFullscreen({ current: document.documentElement }, fullScreen, {
  //   onClose: () => set({ fullScreen: false }),
  // })

  return (
    <div style={{ backgroundColor: 'transparent', minHeight: '0vh' }}>
      <Leva
        titleBar={showTitleBar && { drag, title, filter, position }} // TITLE | PROJECT_NAME
        hideTitleBar={false} // default = false. true hides the GUI header
        theme={theme} // you can pass a custom theme (see the styling section)
        collapsed={false} // default = false. true makes the GUI collpased
        fill={true} // default = false. true makes the pane fill the parent dom node it's rendered in
        flat={true} // default = false. true removes border radius and shadow
        hidden={false} // default = false. true hides the GUI
        neverHide={true} // default = true. false allows hiding of the GUI
        oneLineLabels={false} // default = false. true makes labels + fields on separate rows
        hideCopyButton={true} // default = false. true hides the onHover copy button
      />
      <ThreeDPreferences />
      {/* <div
        style={{
          display: 'grid',
          width: 300,
          gap: 10,
          paddingBottom: 0,
          marginRight: 0,
          float: 'left',
          background: '#181C20',
        }}> */}
        {/* <LevaPanel fill flat titleBar={false} store={colorsStore} /> */}
        {/* <LevaPanel fill flat titleBar={false} store={radiiStore} /> */}
        {/* <LevaPanel fill flat titleBar={false} store={spaceStore} /> */}
        {/* <LevaPanel fill flat titleBar={false} store={fontSizesStore} /> */}
        {/* <LevaPanel fill flat titleBar={false} store={sizesStore} /> */}
        {/* <LevaPanel fill flat titleBar={false} store={borderWidthsStore} /> */}
        {/* <LevaPanel fill flat titleBar={false} store={fontWeightsStore} /> */}
      {/* </div> */}
      {/* <pre>{JSON.stringify(theme, null, '  ')}</pre> */}
    </div>
  )
}

export const ThreeDLevaComponent = ({ projectName, setProjectName }) => {
  // **
  const word = `[MM] ThreeDLevaComponent @ ${new Date().toISOString()}`
  // **
  // var [{ projectNameFromLeva }, set] = useControls(
  //   () => (
  //     {
  //       // projectNameFromLeva: projectName,
  //       projectName: projectName,
  //       doAutoLoadData: doAutoLoadData,
  //       doAutoRotate: doAutoRotate,
  //       word: word,
  //     }
  //   )
  // )

  // // ** onMount (on component loaded)
  // useEffect(() => {
  //   // leva set store (from react state)
  //   set({ projectNameFromLeva: projectName })
  //   // react set state
  //   setProjectName(projectName)
  //   // **
  // }, [projectName, set])
  // // }, [projectName])

  // // console.debug("MyComponent")
  // useEffect(() => {
  //   setProjectName(projectName)
  // //   console.debug('MyComponent onMount')
  // //   return () => {
  // //     console.debug('MyComponent onUnmount')
  // //   }
  // }, [projectName])

  // return <div>{projectNameFromLeva}: {projectName}</div>
}

export default ThreeDLevaControls
