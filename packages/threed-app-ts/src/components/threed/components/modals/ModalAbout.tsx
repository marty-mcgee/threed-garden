// ==============================================================
// RESOURCES

// ** React Imports
import { FunctionComponent, ElementType, useState, SyntheticEvent } from 'react'

// ** MUI Imports
import { styled, useTheme } from '@mui/material/styles'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Modal from '@mui/material/Modal'
import Typography from '@mui/material/Typography'
import MuiButton from '@mui/material/Button'
import MuiTabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import MDTabPanel, { tabProps } from '~/components/mui/MDTabPanel'

// ** Next Imports
import Image from 'next/future/image'

// ** Store Imports
import { modalAboutStore } from '~/stores/apollo'

// ** CSS Styles Imports
import stylesGarden from '~/components/threed/styles/garden.module.css'

// ==========================================================
// STYLES

const stylesModal: Object = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "80vw",
  height: "60vh",
  bgcolor: "#09090D",
  border: "2px solid #000000",
  boxShadow: 24,
  p: 2
}

const Tabs: ElementType = styled(MuiTabs)(({ theme }) => ({
  overflow: `scroll !important`,
}))

const Button: ElementType = styled(MuiButton)(({ theme }) => ({
  marginRight: `0.25rem !important`,
  padding: `0.5rem 0.5rem !important`,
  minWidth: `1.8rem !important`,
}))

// ==========================================================
// COMPONENTS

// Modal: About
const ModalAbout: FunctionComponent = (): JSX.Element => {
  // console.debug("ModalAbout called")

  // tabs (use React State)
  const [tabModalAbout, setTabModalAbout] = useState(0)
  const handleChangeTabModalAbout = (event: SyntheticEvent, newValue: number) => {
    setTabModalAbout(newValue)
  }

  const loadPlan = (planId: string) => {
    console.debug('loadPlan:', planId)
  }

  // useEffect(() => {
  //   console.debug("ModalAbout onMount")
  //   return () => {
  //     console.debug("ModalAbout onUnmount")
  //   }
  // }, [])

  return (
    <Container id="ModalAboutContainer">
      <Modal
        id="ModalAbout"
        open={modalAboutStore.store.useStore("isVisible")}
        onClose={(e: any) => modalAboutStore.actions.handleClose(e)}
        aria-labelledby="modal-about-title"
        aria-describedby="modal-about-description"
        sx={stylesModal}
      >
        <Box className={stylesGarden.modalContent}>

          <Box className={stylesGarden.modalHeader}>
            <Image src="/favicon/favicon.png"
              width={50}
              height={50}
              alt="ThreeD Garden Logo"
              title="ThreeD Garden"
            />
            <h2>ThreeD Garden</h2>
          </Box>

          <Box className={stylesGarden.modalBody}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabModalAbout} onChange={handleChangeTabModalAbout} aria-label="About Tabs">
                <Tab label="Intro" {...tabProps(0)} />
                <Tab label="Models" {...tabProps(1)} />
                <Tab label="Examples" {...tabProps(2)} />
                <Tab label="FAQ" {...tabProps(3)} />
                <Tab label="Contact" {...tabProps(4)} />
                <Tab label="Other" {...tabProps(5)} />
                <Tab label="Supporters" {...tabProps(6)} />
              </Tabs>
            </Box>
            <MDTabPanel value={tabModalAbout} index={0}>
              <h3 style={{ paddingBottom: 8 }}>
                Plan + Share Ideas for your Home + Garden in 2D + 3D
              </h3>
              <span className="tooltip">
                <span className="tooltipText">
                  Edits you make to plans will be saved to your browser&apos;s local storage so that you don&apos;t lose any work between saves. Plans will be deleted if you clean your browser&apos;s cookies, history, or local storage. To save your work long term, use the &quot;Actions: Save Plan&quot; option in the main toolbar.
                </span>
              </span>
              <div>
                <div style={{ textAlign: "center", padding: 10 }}>
                  <hr style={{ border: "1px solid #333", width: "50%" }} />
                  <div>
                    <div>
                      Automatically Save Plans to Browser&apos;s Local Storage?
                    </div>
                    <input
                      type="checkbox"
                      id="saveEditsToLocalStorage"
                      // onChange={() => handleSaveEditsLocalStorageOption}
                      style={{ marginLeft: 5, marginRight: 5 }}
                    />
                  </div>
                  <hr style={{ border: "1px solid #333", width: "50%" }} />
                  <div id="localStoragePlanDiv" style={{ textAlign: "center" }}>
                    <div>
                      Actions:
                    </div>
                    <Button
                      size="small"
                      // onClick={() => loadFromLocalStorage}
                      id="loadLocalStoragePlanBtn">
                      Load Plan from Local Storage
                    </Button>
                    <br />
                    <span id="localStoragePlanLastSavedDate" />
                    {/* <div>
                      <Image
                        id="localStoragePlanImage"
                        alt="Local Storage Plan Image"
                        src={null}
                        onClick={() => loadFromLocalStorage}
                      />
                    </div> */}
                  </div>
                </div>
                <div id="featuredPlan" style={{ textAlign: "center", padding: 10 }}>
                  <Button
                    size="small"
                    // onClick={() => loadExamplePlan}
                    id="loadFeaturedPlanBtn">
                    Load Example Plan
                  </Button>
                  <div>&nbsp;&nbsp;&nbsp;&nbsp;</div>
                  <Button
                    size="small"
                    // onClick={() => closeAllModals}
                  >
                    Start New Plan
                  </Button>
                  {/* <div>
                    <Image
                      id="featuredPlanImage"
                      alt="Featured Plan Image"
                      src={null}
                      onClick={() => loadExamplePlan}
                    />
                  </div> */}
                </div>
              </div>
            </MDTabPanel>
            <MDTabPanel value={tabModalAbout} index={1}>
              <div>
                ThreeD Garden uses many 3D models which can be found on the internet as Public Domain, Free Art or Creative Commons.
              </div>
              <br />
              <div>
                Models ideally should be:
              </div>
              <div>
                <ul style={{ paddingLeft: 20 }}>
                  <li>Saved as .obj format along with the .mtl file, plus any texture files used. Blender OBJ default export options work very well.</li>
                  <li>1 unit in Blender = 1cm in ThreeD Garden. Eg, a cube with X:100, Y:100, Z:100, will display as 1 Meter cubed box in the 3d and Plan views.</li>
                  <li>If using Blender, Y-Axis in your OBJ export should be UP. Blender IDE defaults with the Z-Axis being UP in normal creatiion mode, but the OBJ export plugin defaults to convert the exported OBJ with the Y-Axis being UP. This is good.</li>
                  <li>Try to keep model low poly and the total download size smaller than 1Mb. Not totally essential but it helps.</li>
                  <li>Your model should be released as public domain or licensed with a non restrictive open source license such as a Free Art or Creative Commons.</li>
                  <li>You should own the copyright on the 3d model and textures, or have the permission of the copyight holder, and provide the model to add to the catalog for unrestricted use as either Public Domain, Free Art or Creative Commons.</li>
                  <li>Add the author&apos;s name, copyright year and attribution url, if known.</li>
                  <li>Models with restrictive licenses should not be added.</li>
                </ul>
              </div>
            </MDTabPanel>
            <MDTabPanel value={tabModalAbout} index={2}>
              <h3>Tutorial Videos</h3>
              <Grid container alignItems="center"
                sx={{
                  border: "1px solid #2a2a2a",
                  px: 1,
                  py: 1
                }}>
                <Grid item xs={4}>
                  <h3>Mansard</h3>
                  <div>
                    <a href="#https://www.youtube.com/watch?v=Ppqp-dLwKIE" target="_blank"
                      rel="noopener" className="largeButton">
                      Watch Video
                    </a>
                    <Button onClick={() => loadPlan('42fbd8ff0f5a37fa1285ae8b6c6ca36529b930c2')}
                      className="largeButton">Load Plan</Button>
                  </div>
                </Grid>
                <Grid item xs={4}>
                  <a href="#https://www.youtube.com/watch?v=Ppqp-dLwKIE" target="_blank"
                    rel="noopener">
                    <Image
                      src="/demo/tuts/mansard.png"
                      alt=""
                      width={317}
                      height={205}
                      style={{ border: "2px solid #2a2a2a" }}
                    />
                  </a>
                </Grid>
                <Grid item xs={4}>
                  <h3>Gable with Valley Roof</h3>
                  <div>
                    <a href="#https://www.youtube.com/watch?v=DUaBywAS6Ik" target="_blank"
                      rel="noopener" className="largeButton">
                      Watch Video
                    </a>
                    <Button onClick={() => loadPlan('0d371f9acad19a943f38c3a32f6d5d140bc6c913')}
                      className="largeButton">Load Plan</Button>
                  </div>
                </Grid>
                <Grid item xs={4}>
                  <a href="#https://www.youtube.com/watch?v=DUaBywAS6Ik" target="_blank"
                    rel="noopener">
                    <Image
                      src="/demo/tuts/gableWithValley.png"
                      alt=""
                      width={317}
                      height={205}
                      style={{ border: "2px solid #2a2a2a" }}
                    />
                  </a>
                </Grid>
                <Grid item xs={4}>
                  <h3>Modern Dutch Gable (Hip with Gable)</h3>
                  <div>
                    <a href="#https://www.youtube.com/watch?v=0cmjXmp7D_E" target="_blank"
                      rel="noopener" className="largeButton">
                      Watch Video
                    </a>
                    <Button onClick={() => loadPlan('c0300edf03b952872c37744bf570a588184dd3d5')}
                      className="largeButton">Load Plan</Button>
                  </div>
                </Grid>
                <Grid item xs={4}>
                  <a href="#https://www.youtube.com/watch?v=0cmjXmp7D_E" target="_blank"
                    rel="noopener">
                    <Image
                      src="/demo/tuts/modernDutchGable.png"
                      alt=""
                      width={317}
                      height={205}
                      style={{ border: "2px solid #2a2a2a" }}
                    />
                  </a>
                </Grid>
              </Grid>
            </MDTabPanel>
            <MDTabPanel value={tabModalAbout} index={3}>
              FAQ
            </MDTabPanel>
            <MDTabPanel value={tabModalAbout} index={4}>
              Contact
            </MDTabPanel>
            <MDTabPanel value={tabModalAbout} index={5}>
              Other
            </MDTabPanel>
            <MDTabPanel value={tabModalAbout} index={6}>
              Supporters
            </MDTabPanel>
          </Box>

          <Box className={stylesGarden.modalFooter}>
            <Typography>
              🌱 a part of the <a href="https://threed.ai">threed.ai</a> code family
            </Typography>
            <Button size="small" onClick={(e: any) => modalAboutStore.actions.handleClose(e)}>
              [X]
            </Button>
          </Box>
        </Box>
      </Modal>
    </Container>
  )
}

export default ModalAbout
