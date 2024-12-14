
import React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Cross2Icon } from '@radix-ui/react-icons'

const DialogModalsThreeD = () => {
  const [containerAboutModal, setContainerAboutModal] = React.useState(null)
  console.debug('containerAboutModal', containerAboutModal)
  
  return (
    <>
      <Dialog.Root>
        <Dialog.Trigger asChild>
          <button className='Button violet'>Show About Modal</button>
        </Dialog.Trigger>
        {/* <Dialog.Portal container={containerAboutModal}> */}
          <Dialog.Overlay className='DialogOverlay' />
          <Dialog.Content className='DialogContent'>
            <Dialog.Title className='DialogTitle'>
              About ThreeD Home Design
            </Dialog.Title>
            <Dialog.Description className='DialogDescription'>
              Make changes to your profile here. Click save when you're done.
            </Dialog.Description>
            {/* 
            <fieldset className='Fieldset'>
              <label className='Label' htmlFor='name'>
                Name
              </label>
              <input className='Input' id='name' defaultValue='Marty McGee' />
            </fieldset>
            <fieldset className='Fieldset'>
              <label className='Label' htmlFor='username'>
                Username
              </label>
              <input className='Input' id='username' defaultValue='@martymcgee' />
            </fieldset>
            <div
              style={{ display: 'flex', marginTop: 25, justifyContent: 'flex-end' }}
            >
              <Dialog.Close asChild>
                <button className='Button green'>Save changes</button>
              </Dialog.Close>
            </div>
            */}
            <Dialog.Close asChild>
              <button className='IconButton' aria-label='Close'>
                <Cross2Icon />
              </button>
            </Dialog.Close>
            {/* <div className='modal-content'>
              <div className='modal-header'>
              </div>
              <div className='modal-body'>

                <div className='tab'>
                  <button 
                    className='tablinks active' 
                    onClick={() => openTab('tab1')} 
                    id='tab1'
                  >
                    Intro
                  </button>
                </div>

                <div id='tab1Content' className='tabcontent' style={{display: 'block'}}>
                  <h3>ThreeD Home Design Introduction</h3>
                  <p>Plan + Share Ideas for your Home Design in 2D + 3D</p>
                  <div style={{padding: '12px'}}>
                    <div>
                      Save Plan Edits to local web storage? 
                      <input 
                        type='checkbox' 
                        id='saveEditsToLocalStorage' 
                        onChange={() => handleSaveEditsLocalStorageOption()}
                      />
                      <span className='tooltip'>
                        <span className='tooltiptext'>
                          <div>
                            Any edits you make to the plan will be saved to your browsers local web storage so that you don't lose any work between saves.<br/>The plan may be removed if you clean your browsers cookies and history, so to save your work long term, use the 'File-Save' option in the main <a href='https://threedgarden.com'>ThreeD Home Design</a> toolbar.<br/>
                            More info about 
                            <a href="https://www.w3schools.com/HTML/html5_webstorage.asp" target="_blank" rel="noreferrer">
                              Local Web Storage
                            </a>.
                          </div>
                        </span>
                      </span>
                      <div id='localStoragePlanDiv'>
                        <table>
                          <tbody>
                            <tr>
                              <td style={{ textAlign: 'center'}}>
                                Most Recent Edit saved in Local Web Storage.
                                <br />
                                <button 
                                  id='loadLocalStoragePlanBtn'
                                  onClick={() => loadFromLocalStorage()}
                                >
                                  Load Plan
                                </button>
                                <br />
                                <br />
                                <span id='localStoragePlanLastSavedDate'></span>
                              </td>
                              <td>
                                <div>
                                  <img 
                                    id='localStoragePlanImage' 
                                    onClick={() => loadFromLocalStorage()}
                                  />
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div id='featuredPlan'>
                      <table>
                        <tbody>
                          <tr>
                            <td style={{ textAlign: 'center', width: '300px'}}>
                              <button 
                                id='loadFeaturedPlanBtn'
                                className='largeButton'
                                onClick={() => loadExamplePlan()}
                              >
                                Load Example Plan
                              </button>
                              <br /><br />
                              or
                              <br />
                              <button onClick={() => closeAllModals()} className='largeButton'>Start New Plan</button>
                            </td>
                            <td>
                              <div><img id='featuredPlanImage' onClick={() => loadExamplePlan()} /></div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

              </div>
            </div> */}
          </Dialog.Content>
        {/* </Dialog.Portal> */}
      </Dialog.Root>

      {/* <div 
        id='modalAbout' 
        // className='modal' 
        ref={setContainerAboutModal}
      >
        <Text>HEY HEY HEY</Text>
      </div> */}

    </>
  )
}

export default DialogModalsThreeD
