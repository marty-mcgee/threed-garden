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
import { modalLoadingStore } from '#/lib/api/graphql/apollo'

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

// Modal: Loading
const ModalLoading: FunctionComponent = (): React.ReactNode => {
  // console.debug("ModalLoading called")

  // useEffect(() => {
  //   console.debug('ModalLoading onMount')
  //   return () => {
  //     console.debug('ModalLoading onUnmount')
  //   }
  // }, [])

  return (
    <Container id='ModalLoadingContainer'>
      <Modal
        id='ModalLoading'
        open={modalLoadingStore.store.useStore('isVisible')}
        onClose={(e: any) => modalLoadingStore.actions.handleClose(e)}
        aria-labelledby='modal-loading-title'
        aria-describedby='modal-loading-description'
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
            <h3>Loading Model Progress</h3>
            <textarea id='modalLoadingDataInfo'></textarea>
          </Box>

          <Box className={stylesThreeD.modalFooter}>
            <Typography>
              🌱 a part of the <a href='https://threed.ai'>threed.ai</a> code family
            </Typography>
            <Button
              size='small'
              onClick={(e: any) => modalLoadingStore.actions.handleClose(e)}
            >
              [X]
            </Button>
          </Box>
        </Box>
      </Modal>
    </Container>
  )
}

export default ModalLoading
