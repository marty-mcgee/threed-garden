

// ** REACT Imports
import { 
  useState,
  // useRef,
  useEffect,
  // Suspense,
  // useCallback,
} from 'react'

// ** APOLLO Imports
import { 
  useReactiveVar, 
  useMutation,
} from '@apollo/client'
import { 
  isPreferencesDataSetVar, 
  preferencesDataVar,
  createPreferences,
  updatePreferences,
} from '#/lib/api/graphql/apollo'


import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

import {
	HamburgerMenuIcon,
	DotFilledIcon,
	CheckIcon,
	ChevronRightIcon,
} from '@radix-ui/react-icons'


// ** RADIX-UI DropdownMenu
export const ThreeDDropdownMenu = () => {

  // ** USE PREFERENCES
  // const prefs = preferencesDataVar() // NO
  const prefs = useReactiveVar(preferencesDataVar) // YES !!
  // console.debug('%c⚙️ ThreeD Garden prefs', ccm.orangeAlert, prefs)

  // ** MUTATE PREFERENCES
  // ** CREATE
  // const mutationCreatePreferences = () => {
    const [formStatePreferences, setFormStatePreferences] = useState({
      title: 'PREFERENCES: defaultStatePreferences',
      content: 'HEY HEY HEY -- HEY HEY HEY',
      status: 'draft',
      version: '0.17.0-beta.23',
    })
    const [ doCreatePreferences ] = useMutation(createPreferences, {
      // variables: {...formStatePreferences}
      variables: {
        // preferencesId 
        title: formStatePreferences.title,
        content: formStatePreferences.content,
        status: formStatePreferences.status,
        // link: tbd
        // owner: tbd
        // {
        //   node {
        //     userId
        //     userPassword
        //     userType
        //     username
        //     state
        //     version
        //   }
        // }
        // version: formStatePreferences.version,
        version: prefs.version + '_' + 'heyheyhey',
        projectName: prefs.projectName,
        doAutoLoadData: prefs.doAutoLoadData,
        doAutoRotate: prefs.doAutoRotate,
        // characterTrailColor: prefs.characterTrailColor,
        // doCharacterAnimation: prefs.doCharacterAnimation,
        // doWorldControl: prefs.doWorldControl,
        // doWorldDebug: prefs.doWorldDebug,
        doWorldPhysics: prefs.doWorldPhysics,
        // doWorldTesting: prefs.doWorldTesting,
        // doWorldUnfollowCam: prefs.doWorldUnfollowCam,
        // environmentBgBlur: prefs.environmentBgBlur,
        // environmentPreset: prefs.environmentPreset,
        showPanelFirst: prefs.showPanelFirst,
        showPanelLast: prefs.showPanelLast,
      }
    })
  // }
  // ** UPDATE
  // const mutationUpdatePreferences = () => {
    const [ doUpdatePreferences ] = useMutation(updatePreferences, {
      // variables: {...prefs}
      variables: {
        preferencesId: prefs.preferencesId,
        title: prefs.title,
        content: prefs.content,
        status: prefs.status,
        // link
        // owner {
        //   node {
        //     userId
        //     userPassword
        //     userType
        //     username
        //     state
        //     version
        //   }
        // }
        version: prefs.version + '_' + 'yoyoyo',
        projectName: prefs.projectName,
        doAutoLoadData: prefs.doAutoLoadData,
        doAutoRotate: prefs.doAutoRotate,
        // characterTrailColor: prefs.characterTrailColor,
        // doCharacterAnimation: prefs.doCharacterAnimation,
        // doWorldControl: prefs.doWorldControl,
        // doWorldDebug: prefs.doWorldDebug,
        doWorldPhysics: prefs.doWorldPhysics,
        // doWorldTesting: prefs.doWorldTesting,
        // doWorldUnfollowCam: prefs.doWorldUnfollowCam,
        // environmentBgBlur: prefs.environmentBgBlur,
        // environmentPreset: prefs.environmentPreset,
        showPanelFirst: prefs.showPanelFirst,
        showPanelLast: prefs.showPanelLast,
      }
    })
  // }

  const [doShowControls, setDoShowControls] = useState(true)
  const [doAutoRotate, setDoAutoRotate] = useState(false)
  const [doAutoLoadData, setDoAutoLoadData] = useState(false)

  // type TUILayout = '3dView' | 'planView' | 'default'
  const [currentUILayout, setCurrentUILayout] = useState('default') // [MM] preferencesUILayoutVar()
  // type TToolMode = 'pointer' | 'walls' | 'floor' | 'roof' | 'dimension' | 'text' | 'background' | 'ground' | 'defaults'
  const [currentToolMode, setCurrentToolMode] = useState('pointer') // [MM] preferencesToolModeVar()

  

  // const [{
  //   doAutoLoadData,
  //   doAutoRotate,
  // }, setUserPreferences] = useControls(
  //   'User Preferences',
  //   () => ({
  //     doAutoLoadData: {
  //       label: 'Auto Load Data?',
  //       value: prefs.doAutoLoadData,
  //     },
  //     doAutoRotate: {
  //       label: 'Auto Rotate?',
  //       value: prefs.doAutoRotate,
  //     },
  //   }),
  //   {
  //     color: 'darkgreen',
  //     collapsed: false,
  //     order: 0,
  //   },
  // )

  // const [{
  //   projectName,
  //   // refMonitor,
  // }, setProjectPreferences] = useControls(
  //   'Project Preferences',
  //   () => ({
  //     projectName: {
  //       label: 'Project Name',
  //       value: prefs.projectName,
  //     },
  //   }),
  //   {
  //     color: 'darkgreen',
  //     collapsed: false,
  //     order: -1,
  //   },
  // )

  // ==========================================================
  // isPreferencesDataSetVar() ??

  // ==========================================================
  // ** doAutoLoadData

  // **
  useEffect(() => {
    let newData = {...preferencesDataVar()} // latest prefs
    // console.debug('%c⚙️ doAutoLoadData newData', ccm.green, newData)
    newData.doAutoLoadData = doAutoLoadData
    // console.debug('%c⚙️ doAutoLoadData newData UPDATED', ccm.green, newData)
    preferencesDataVar(newData)
    // console.debug('%c⚙️ doAutoLoadData preferencesDataVar', ccm.darkgreen, preferencesDataVar())
    // doUpdatePreferences()
  }, [doAutoLoadData])

  // **
  // useEffect(() => {
  //   // if (prefs.doAutoLoadData != undefined) {
  //     setUserPreferences({ doAutoLoadData: prefs.doAutoLoadData })
  //   // }
  //   if (debug) console.debug('%c⚙️ READ FROM MASTER REACTIVE VAR: prefs.doAutoLoadData', ccm.greenAlert, prefs.doAutoLoadData)
  // }, [prefs.doAutoLoadData])

  // ==========================================================

  // ==========================================================
  // ** doAutoRotate

  // **
  useEffect(() => {
    let newData = {...preferencesDataVar()} // latest prefs
    // console.debug('%c⚙️ doAutoRotate newData', ccm.green, newData)
    newData.doAutoRotate = doAutoRotate
    // console.debug('%c⚙️ doAutoRotate newData UPDATED', ccm.green, newData)
    preferencesDataVar(newData)
    // console.debug('%c⚙️ doAutoRotate preferencesDataVar', ccm.darkgreen, preferencesDataVar())
    // doUpdatePreferences()
  }, [doAutoRotate])

  // **
  // useEffect(() => {
  //   // if (prefs.doAutoRotate != undefined) {
  //     setUserPreferences({ doAutoRotate: prefs.doAutoRotate })
  //   // }
  //   if (debug) console.debug('%c⚙️ READ FROM MASTER REACTIVE VAR: prefs.doAutoRotate', ccm.greenAlert, prefs.doAutoRotate)
  // }, [prefs.doAutoRotate])

  // ==========================================================

  // ==========================================================
  // ** projectName
  // useEffect(() => {
  //   // set({ Id: projectName})
  //   // if (prefs.projectName != undefined) {
  //     setControlPanel({ title: prefs.projectName})
  //     setProjectPreferences({ projectName: prefs.projectName })
  //   // }
  //   if (debug) console.debug('%c⚙️ READ FROM MASTER REACTIVE VAR: prefs.projectName', ccm.greenAlert, prefs.projectName)
  // }, [prefs.projectName])
  // // **
  // useEffect(() => {
  //   try {

  //     let newData = {...preferencesDataVar()} // latest prefs
  //     newData.projectName = projectName
  //     // console.debug('%c⚙️ projectName newData', ccm.redAlert, projectName)
  //     preferencesDataVar(newData)
  //     // console.debug('%c⚙️ projectName preferencesDataVar', ccm.darkgreen, preferencesDataVar())

  //     if (projectName != undefined) {
  //       setControlPanel({ title: projectName})
  //     }
  //     else {
  //       console.debug('%c⚙️ ERROR: projectName: UNDEFINED', ccm.redAlert, projectName)
  //     }

  //   } catch (ERR) {
  //     console.debug('%c⚙️ ERROR: setControlPanel title: projectName', ccm.redAlert, projectName)
  //   }
  // }, [projectName])




  return (
    <DropdownMenu.Root>

      <DropdownMenu.Trigger asChild>
        <button className='IconButton' aria-label='Set Preferences'>
          <HamburgerMenuIcon />
        </button>
      </DropdownMenu.Trigger>


      <DropdownMenu.Portal>

        <DropdownMenu.Content 
          className='DropdownMenuContent' 
          // sideOffset={5}
        >
          <DropdownMenu.Item 
            className='DropdownMenuItem'
            onClick={() => doUpdatePreferences()}
          >
            Save State
          </DropdownMenu.Item>

          {/* <DropdownMenu.Separator className='DropdownMenuSeparator' /> */}

                      {/* <DropdownMenu.Item 
                        className='DropdownMenuItem'
                        // onClick={() => handleShowModalAbout()}
                      >
                        About <div className='RightSlot'>⌘+A</div>
                      </DropdownMenu.Item>
                      <DropdownMenu.Item 
                        className='DropdownMenuItem'
                        // onClick={() => handleShowModal3dModel()}
                      >
                        3D Model <div className='RightSlot'>⌘+N</div>
                      </DropdownMenu.Item>
                      <DropdownMenu.Item 
                        className='DropdownMenuItem'
                        // onClick={() => handleShowModalShare()}
                      >
                        Share <div className='RightSlot'>⌘+N</div>
                      </DropdownMenu.Item>
                      <DropdownMenu.Item 
                        className='DropdownMenuItem'
                        // onClick={() => handleShowModalLoading()}
                      >
                        Loading <div className='RightSlot'>⌘+N</div>
                      </DropdownMenu.Item>
                      <DropdownMenu.Item 
                        className='DropdownMenuItem' 
                        disabled
                      >
                        New Private Modal <div className='RightSlot'>⇧+⌘+N</div>
                      </DropdownMenu.Item>
                      <DropdownMenu.Sub>
                        <DropdownMenu.SubTrigger className='DropdownMenuSubTrigger'>
                          Files
                          <div className='RightSlot'>
                            <ChevronRightIcon />
                          </div>
                        </DropdownMenu.SubTrigger>
                        <DropdownMenu.Portal>
                          <DropdownMenu.SubContent
                            className='DropdownMenuSubContent'
                            sideOffset={2}
                            alignOffset={-5}
                          >
                            <DropdownMenu.Item className='DropdownMenuItem'>
                              Save Page As… <div className='RightSlot'>⌘+S</div>
                            </DropdownMenu.Item>
                            <DropdownMenu.Item className='DropdownMenuItem'>
                              Create Shortcut…
                            </DropdownMenu.Item>
                            <DropdownMenu.Item className='DropdownMenuItem'>
                              Name Window…
                            </DropdownMenu.Item>
                            <DropdownMenu.Separator className='DropdownMenu.Separator' />
                            <DropdownMenu.Item className='DropdownMenuItem'>
                              Developer Tools
                            </DropdownMenu.Item>
                          </DropdownMenu.SubContent>
                        </DropdownMenu.Portal>
                      </DropdownMenu.Sub>
                      <DropdownMenu.Sub>
                        <DropdownMenu.SubTrigger className='DropdownMenuSubTrigger'>
                          Edits
                          <div className='RightSlot'>
                            <ChevronRightIcon />
                          </div>
                        </DropdownMenu.SubTrigger>
                        <DropdownMenu.Portal>
                          <DropdownMenu.SubContent
                            className='DropdownMenuSubContent'
                            sideOffset={2}
                            alignOffset={-5}
                          >
                            <DropdownMenu.Item className='DropdownMenuItem'>
                              Save Page As… <div className='RightSlot'>⌘+S</div>
                            </DropdownMenu.Item>
                            <DropdownMenu.Item className='DropdownMenuItem'>
                              Create Shortcut…
                            </DropdownMenu.Item>
                            <DropdownMenu.Item className='DropdownMenuItem'>
                              Name Window…
                            </DropdownMenu.Item>
                            <DropdownMenu.Separator className='DropdownMenu.Separator' />
                            <DropdownMenu.Item className='DropdownMenuItem'>
                              Developer Tools
                            </DropdownMenu.Item>
                          </DropdownMenu.SubContent>
                        </DropdownMenu.Portal>
                      </DropdownMenu.Sub>
                      <DropdownMenu.Sub>
                        <DropdownMenu.SubTrigger className='DropdownMenuSubTrigger'>
                          Plan Views
                          <div className='RightSlot'>
                            <ChevronRightIcon />
                          </div>
                        </DropdownMenu.SubTrigger>
                        <DropdownMenu.Portal>
                          <DropdownMenu.SubContent
                            className='DropdownMenuSubContent'
                            sideOffset={2}
                            alignOffset={-5}
                          >
                            <DropdownMenu.Item className='DropdownMenuItem'>
                              Save Page As… <div className='RightSlot'>⌘+S</div>
                            </DropdownMenu.Item>
                            <DropdownMenu.Item className='DropdownMenuItem'>
                              Create Shortcut…
                            </DropdownMenu.Item>
                            <DropdownMenu.Item className='DropdownMenuItem'>
                              Name Window…
                            </DropdownMenu.Item>
                            <DropdownMenu.Separator className='DropdownMenu.Separator' />
                            <DropdownMenu.Item className='DropdownMenuItem'>
                              Developer Tools
                            </DropdownMenu.Item>
                          </DropdownMenu.SubContent>
                        </DropdownMenu.Portal>
                      </DropdownMenu.Sub>
                      <DropdownMenu.Sub>
                        <DropdownMenu.SubTrigger className='DropdownMenuSubTrigger'>
                          3D Views
                          <div className='RightSlot'>
                            <ChevronRightIcon />
                          </div>
                        </DropdownMenu.SubTrigger>
                        <DropdownMenu.Portal>
                          <DropdownMenu.SubContent
                            className='DropdownMenuSubContent'
                            sideOffset={2}
                            alignOffset={-5}
                          >
                            <DropdownMenu.Item className='DropdownMenuItem'>
                              Save Page As… <div className='RightSlot'>⌘+S</div>
                            </DropdownMenu.Item>
                            <DropdownMenu.Item className='DropdownMenuItem'>
                              Create Shortcut…
                            </DropdownMenu.Item>
                            <DropdownMenu.Item className='DropdownMenuItem'>
                              Name Window…
                            </DropdownMenu.Item>
                            <DropdownMenu.Separator className='DropdownMenu.Separator' />
                            <DropdownMenu.Item className='DropdownMenuItem'>
                              Developer Tools
                            </DropdownMenu.Item>
                          </DropdownMenu.SubContent>
                        </DropdownMenu.Portal>
                      </DropdownMenu.Sub> */}

          <DropdownMenu.Separator className='DropdownMenuSeparator' />

                          <DropdownMenu.CheckboxItem
                            className='DropdownMenuCheckboxItem'
                            checked={doShowControls}
                            onCheckedChange={setDoShowControls}
                          >
                            <DropdownMenu.ItemIndicator className='DropdownMenuItemIndicator'>
                              <CheckIcon />
                            </DropdownMenu.ItemIndicator>
                            Show  Controls <div className='RightSlot'>⌘+B</div>
                          </DropdownMenu.CheckboxItem>
                          <DropdownMenu.CheckboxItem
                            className='DropdownMenuCheckboxItem'
                            checked={doAutoRotate}
                            onCheckedChange={setDoAutoRotate}
                          >
                            <DropdownMenu.ItemIndicator className='DropdownMenuItemIndicator'>
                              <CheckIcon />
                            </DropdownMenu.ItemIndicator>
                            Do Auto Rotate
                          </DropdownMenu.CheckboxItem>
                          <DropdownMenu.CheckboxItem
                            className='DropdownMenuCheckboxItem'
                            checked={doAutoLoadData}
                            onCheckedChange={setDoAutoLoadData}
                          >
                            <DropdownMenu.ItemIndicator className='DropdownMenuItemIndicator'>
                              <CheckIcon />
                            </DropdownMenu.ItemIndicator>
                            Do Auto Load Data
                          </DropdownMenu.CheckboxItem>

          <DropdownMenu.Separator className='DropdownMenuSeparator' />

                          <DropdownMenu.Label className='DropdownMenuLabel'>
                            Tool Mode
                          </DropdownMenu.Label>
                          <DropdownMenu.RadioGroup value={currentToolMode} onValueChange={setCurrentToolMode}>
                            <DropdownMenu.RadioItem
                              className='DropdownMenuRadioItem'
                              value='pointer'
                            >
                              <DropdownMenu.ItemIndicator className='DropdownMenuItemIndicator'>
                                <DotFilledIcon />
                              </DropdownMenu.ItemIndicator>
                              Pointer
                            </DropdownMenu.RadioItem>
                            <DropdownMenu.RadioItem
                              className='DropdownMenuRadioItem'
                              value='crop'
                            >
                              <DropdownMenu.ItemIndicator className='DropdownMenuItemIndicator'>
                                <DotFilledIcon />
                              </DropdownMenu.ItemIndicator>
                              Crop
                            </DropdownMenu.RadioItem>
                          </DropdownMenu.RadioGroup>

          <DropdownMenu.Separator className='DropdownMenuSeparator' />

                          <DropdownMenu.Label className='DropdownMenuLabel'>
                            UI Layout
                          </DropdownMenu.Label>
                          <DropdownMenu.RadioGroup value={currentUILayout} onValueChange={setCurrentUILayout}>
                            <DropdownMenu.RadioItem
                              className='DropdownMenuRadioItem'
                              value='default'
                            >
                              <DropdownMenu.ItemIndicator className='DropdownMenuItemIndicator'>
                                <DotFilledIcon />
                              </DropdownMenu.ItemIndicator>
                              Default
                            </DropdownMenu.RadioItem>
                            <DropdownMenu.RadioItem
                              className='DropdownMenuRadioItem'
                              value='planView'
                            >
                              <DropdownMenu.ItemIndicator className='DropdownMenuItemIndicator'>
                                <DotFilledIcon />
                              </DropdownMenu.ItemIndicator>
                              Plan View
                            </DropdownMenu.RadioItem>
                          </DropdownMenu.RadioGroup>

          <DropdownMenu.Separator className='DropdownMenuSeparator' />

                          {/* <DropdownMenu.Arrow className='DropdownMenuArrow' /> */}

        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}