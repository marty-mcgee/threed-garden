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
import { modalModel3dStore } from '#/lib/api/graphql/apollo'

// ** CSS Styles Imports
import stylesThreeD from '#/lib/threed/styles/threed.module.css'

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

// Modal: Model3d
const ModalModel3d: FunctionComponent = (): React.ReactNode => {
  // console.debug("ModalModel3d called")

  // useEffect(() => {
  //   console.debug('ModalModel3d onMount')
  //   return () => {
  //     console.debug('ModalModel3d onUnmount')
  //   }
  // }, [])

  return (
    <Container id='ModalModel3dContainer'>
      <Modal
        id='ModalModel3d'
        open={modalModel3dStore.store.useStore('isVisible')}
        onClose={(e: any) => modalModel3dStore.actions.handleClose(e)}
        aria-labelledby='modal-model3d-title'
        aria-describedby='modal-model3d-description'
        sx={stylesModal}
      >
        <Box className={stylesThreeD.modalContent}>
          <Box className={stylesThreeD.modalHeader}>
            <Image
              src='/favicon/favicon.png'
              width={50}
              height={50}
              alt='ThreeD Garden Logo'
              title='ThreeD Garden'
            />
            <h2>ThreeD Garden</h2>
          </Box>

          <Box className='modalBody'>
            <Box id='model3dView'>
              <canvas id='model3dViewCanvas' />
            </Box>
            <Box id='modalModelDescription'>
              <h3>3d Model Properties</h3>
              <table
                className='propertiesTable'
                style={{ width: '100%' }}
              >
                <tbody>
                  <tr>
                    <td>Name</td>
                    <td>
                      <span id='model3dNameModal' />
                    </td>
                  </tr>
                  <tr>
                    <td>Author</td>
                    <td>
                      <span id='model3dAuthorModal' />
                    </td>
                  </tr>
                  <tr>
                    <td>License</td>
                    <td>
                      <span id='model3dLicenseModal' />
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2}>OBJ&nbsp;File&nbsp;Comments</td>
                  </tr>
                </tbody>
              </table>
              <textarea id='modalModel3dObjHeader' />
            </Box>
          </Box>

          <Box className={stylesThreeD.modalFooter}>
            <Typography>
              🌱 a part of the <a href='https://threed.ai'>threed.ai</a> code family
            </Typography>
            <Button
              size='small'
              onClick={(e: any) => modalModel3dStore.actions.handleClose(e)}
            >
              [X]
            </Button>
          </Box>
        </Box>
      </Modal>
    </Container>
  )
}

export default ModalModel3d
