import { useEffect, useRef } from 'react'
import { useControls, useCreateStore, folder, Leva, LevaPanel, monitor, button } from 'leva'
import { useFullscreen } from 'react-use'
import { spring } from '@leva-ui/plugin-spring'
import { Noise } from 'noisejs'

const noise = new Noise(Math.random())

function Controls() {
  // **
  const DO_AUTO_ROTATE = true
  const DO_AUTO_LOAD_DATA = true
  const PROJECT_NAME = 'PROJECT ALOHA'
  const OFFSET_X = 20
  const LAMPS_NB = 10
  const LAMPS_SPEED = 0.8
  const TREES_NB = 16
  const TREES_SPEED = 0.4
  const FAR_TREES_NB = 12
  const FAR_TREES_SPEED = 0.08
  const ROCKS_NB = 6
  const ROCKS_SPEED = 0.5
  const RANDOMIZER_STRENGTH_SCALE = 0.42
  const RANDOMIZER_STRENGTH_POSITION = 1

  // **
  const ref = useRef(4)
  useEffect(() => {
    let x = 0
    setInterval(() => {
      x += 0.1
      const t = Date.now()
      ref.current = 2 * noise.simplex2(3 * x + t, x) + (3 * Math.sin(x)) / x
    }, 30)
  }, [])

  useControls({
    // number: { value: 10, step: 0.25 },
    image: { image: undefined },
    // colorObj: { r: 1, g: 2, b: 3 },
    // select: { options: ['x', 'y', ['x', 'y']] },
    // interval: { min: -100, max: 100, value: [10, 15] },
    refMonitor: monitor(ref, { graph: true, interval: 30 }),
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
  })
  // **
  const {
    doAutoRotate,
    doAutoLoadData,
    projectName,
    // **
    // lampsNb,
    // treesNb,
    // farTreesNb,
    // rocksNb,
    // lampsSpeed,
    // treesSpeed,
    // farTreesSpeed,
    // rocksSpeed,
  } = useControls({
    doAutoRotate: {
      value: DO_AUTO_ROTATE,
    },
    doAutoLoadData: {
      value: DO_AUTO_LOAD_DATA,
    },
    projectName: {
      value: PROJECT_NAME,
    },
    // **
    // lampsNb: {
    //   value: LAMPS_NB,
    //   min: 1,
    //   max: 100,
    //   step: 1,
    // },
    // lampsSpeed: {
    //   value: LAMPS_SPEED,
    //   min: 0.1,
    //   max: 2,
    //   step: 0.05,
    // },
    // treesNb: {
    //   value: TREES_NB,
    //   min: 1,
    //   max: 100,
    //   step: 1,
    // },
    // treesSpeed: {
    //   value: TREES_SPEED,
    //   min: 0.1,
    //   max: 2,
    //   step: 0.05,
    // },
    // farTreesNb: {
    //   value: FAR_TREES_NB,
    //   min: 1,
    //   max: 100,
    //   step: 1,
    // },
    // farTreesSpeed: {
    //   value: FAR_TREES_SPEED,
    //   min: 0.1,
    //   max: 2,
    //   step: 0.01,
    // },
    // rocksNb: {
    //   value: ROCKS_NB,
    //   min: 1,
    //   max: 100,
    //   step: 1,
    // },
    // rocksSpeed: {
    //   value: ROCKS_SPEED,
    //   min: 0.1,
    //   max: 2,
    //   step: 0.05,
    // },
  })

  return null
}

export default function ThreeDLevaControls({ data, projectName}) {
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
        md: '10px',
        rowGap: '7px',
        colGap: '7px',
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
        controlWidth: '160px',
        scrubberWidth: '8px',
        scrubberHeight: '16px',
        rowHeight: '24px',
        folderHeight: '20px',
        checkboxSize: '16px',
        joystickWidth: '100px',
        joystickHeight: '100px',
        colorPickerWidth: '160px',
        colorPickerHeight: '100px',
        monitorHeight: '60px',
        titleBarHeight: '39px',
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

  // ** LEVA GUI CONTROL PANEL
  const [{ showTitleBar, title, drag, filter, fullScreen, oneLineLabels }, set] = useControls(
    'Panel',
    () => ({
      showTitleBar: true,
      title: { value: projectName, render: (get) => get('Panel.showTitleBar') },
      drag: { value: false, render: (get) => get('Panel.showTitleBar') },
      filter: { value: false, render: (get) => get('Panel.showTitleBar') },
      // fullScreen: false,
      // oneLineLabels: false,
    }),
    { color: 'green' }
  )
  // useFullscreen({ current: document.documentElement }, fullScreen, {
  //   onClose: () => set({ fullScreen: false }),
  // })

  return (
    <div style={{ backgroundColor: 'transparent', minHeight: '0vh' }}>
      <Leva
        theme={theme} // you can pass a custom theme (see the styling section)
        fill={true} // default = false,  true makes the pane fill the parent dom node it's rendered in
        flat={true} // default = false,  true removes border radius and shadow
        hideTitleBar={false} // default = false, hides the GUI header
        collapsed={true} // default = false, when true the GUI is collpased
        hidden={false} // default = false, when true the GUI is hidden
        titleBar={showTitleBar && { drag, title, filter }}
        // oneLineLabels={oneLineLabels} // default = false, alternate layout with labels + fields on separate rows
      />
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
      <Controls />
    </div>
  )
}

export const ThreeDLevaComponent = ({ projectName, setProjectName }) => {
  // **
  const word = `[MM] ThreeDLevaComponent @ ${new Date().toISOString()}`
  // **
  var [{ Id }, set] = useControls(
    () => (
      {
        Id: projectName
      }
    )
  )

  useEffect(() => {
    set({ Id: projectName })
  }, [projectName, set])

  // console.debug("MyComponent")
  useEffect(() => {
    setProjectName(projectName)
  //   console.debug('MyComponent onMount')
  //   return () => {
  //     console.debug('MyComponent onUnmount')
  //   }
  }, [projectName])

  return <div>{Id}: {projectName}</div>
}
