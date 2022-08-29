// ** MUI Imports
import { styled } from '@mui/material/styles'
import MuiBox from '@mui/material/Box'

// ** Icons Imports
import Alert from 'mdi-material-ui/Alert'
import CheckCircle from 'mdi-material-ui/CheckCircle'

// ** Util Imports
import { hexToRGBA } from 'src/@core/utils/hex-to-rgba'

// Styled Box component
const Box = styled(MuiBox)(({ theme }) => ({
  width: 20,
  height: 20,
  borderWidth: 3,
  borderRadius: '50%',
  borderStyle: 'solid',
  borderColor: hexToRGBA(theme.palette.primary.main, 0.12)
}))

const StepperCustomDot = props => {
  // ** Props
  const { active, completed, error } = props
  if (error) {
    return <Alert sx={{ width: 20, height: 20, color: 'error.main', transform: 'scale(1.2)' }} />
  } else if (completed) {
    return <CheckCircle sx={{ width: 20, height: 20, color: 'primary.main', transform: 'scale(1.2)' }} />
  } else {
    return (
      <Box
        sx={{
          ...(active && { borderWidth: 5, borderColor: 'primary.main', backgroundColor: 'common.white' })
        }}
      />
    )
  }
}

export default StepperCustomDot
