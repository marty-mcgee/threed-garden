// ==============================================================
// RESOURCES

// ** React Imports
import { FunctionComponent, ElementType } from 'react'

// ** MUI Imports
import { styled } from '@mui/material/styles'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Modal from '@mui/material/Modal'
import Typography from '@mui/material/Typography'
import MuiButton from '@mui/material/Button'
import MuiTabs from '@mui/material/Tabs'

// ** Next Imports
import Image from 'next/image'

// ** Store Imports
import { modalShareStore } from '#/lib/stores/apollo'

// ** CSS Styles Imports
import stylesGarden from '#/lib/threed/styles/garden.module.css'

// ==========================================================
// STYLES

const stylesModal: Object = {
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

// Modal: Share
const ModalShare: FunctionComponent = (): JSX.Element => {
  // console.debug("ModalShare called")

  // useEffect(() => {
  //   console.debug('ModalShare onMount')
  //   return () => {
  //     console.debug('ModalShare onUnmount')
  //   }
  // }, [])

  return (
    <Container id='ModalShareContainer'>
      <Modal
        id='ModalShare'
        open={modalShareStore.store.useStore('isVisible')}
        onClose={(e: any) => modalShareStore.actions.handleClose(e)}
        aria-labelledby='modal-share-title'
        aria-describedby='modal-share-description'
        sx={stylesModal}
      >
        <Box className={stylesGarden.modalContent}>
          <Box className={stylesGarden.modalHeader}>
            <Image
              src='/favicon/favicon.png'
              width={50}
              height={50}
              alt='ThreeD Garden Logo'
              title='ThreeD Garden'
            />
            <h2>ThreeD Garden</h2>
          </Box>

          <Box className={stylesGarden.smallModalBody}>
            <h3>Share Plan</h3>
            <Button
              id='getShareLinkBtn'
              className='mediumButton'
              // onClick={() => generateShareLink()}
            >
              Generate Share Link
            </Button>
            <Box style={{ margin: '10px 0px 10px 0px' }}>
              <Box style={{ paddingTop: '6px' }}>
                <label htmlFor='shareLinkUrl'>
                  Editable Copy
                  <br />
                  <input
                    type='text'
                    id='shareLinkUrl'
                    placeholder="Press 'Generate Share Link' Button"
                    style={{
                      width: '580px',
                      backgroundColor: '#4e4e4e',
                      border: '1px solid #2a2a2a',
                      fontSize: '14px',
                      color: 'white',
                      fontFamily: "'Courier New', Courier, monospace",
                      padding: '4px 24px 4px 24px',
                      pointerEvents: 'none',
                    }}
                  />
                  &nbsp;
                </label>
                <Button
                  id='copyShareLinkBtn'
                  className='smallButton'
                  // onClick={() => copyShareLink()}
                >
                  Copy
                </Button>
              </Box>

              <Box style={{ paddingTop: '6px' }}>
                <label htmlFor='shareLinkUrl3d'>
                  Read Only 3d View
                  <br />
                  <input
                    type='text'
                    id='shareLinkUrl3d'
                    placeholder="Press 'Generate Share Link' Button"
                    style={{
                      width: '580px',
                      backgroundColor: '#4e4e4e',
                      border: '1px solid #2a2a2a',
                      fontSize: '14px',
                      color: 'white',
                      fontFamily: "'Courier New', Courier, monospace",
                      padding: '4px 24px 4px 24px',
                      pointerEvents: 'none',
                    }}
                  />
                  &nbsp;
                </label>
                <Button
                  id='copyShareLinkBtn'
                  className='smallButton'
                  // onClick={() => copyShareLink3d()}
                >
                  Copy
                </Button>
              </Box>

              <Box style={{ paddingTop: '6px' }}>
                <label htmlFor='shareLinkUrlPlan'>
                  Read Only Plan View
                  <br />
                  <input
                    type='text'
                    id='shareLinkUrlPlan'
                    placeholder="Press 'Generate Share Link' Button"
                    style={{
                      width: '580px',
                      backgroundColor: '#4e4e4e',
                      border: '1px solid #2a2a2a',
                      fontSize: '14px',
                      color: 'white',
                      fontFamily: "'Courier New', Courier, monospace",
                      padding: '4px 24px 4px 24px',
                      pointerEvents: 'none',
                    }}
                  />
                  &nbsp;
                </label>
                <Button
                  id='copyShareLinkBtn'
                  className='smallButton'
                  // onClick={() => copyShareLinkPlan()}
                >
                  Copy
                </Button>
              </Box>
            </Box>
          </Box>

          <Box className={stylesGarden.modalFooter}>
            <Typography>
              🌱 a part of the <a href='https://threed.ai'>threed.ai</a> code family
            </Typography>
            <Button
              size='small'
              onClick={(e: any) => modalShareStore.actions.handleClose(e)}
            >
              [X]
            </Button>
          </Box>
        </Box>
      </Modal>
    </Container>
  )
}

export default ModalShare
