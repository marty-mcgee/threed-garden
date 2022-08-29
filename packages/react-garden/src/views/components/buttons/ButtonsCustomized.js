// ** MUI Imports
import { brown } from '@mui/material/colors'
import { styled } from '@mui/material/styles'
import Button from '@mui/material/Button'

// Styled component for a custom button
const CustomButton = styled(Button)(({ theme }) => ({
  backgroundColor: brown[500],
  color: theme.palette.getContrastText(brown[500]),
  '&:hover': {
    backgroundColor: brown[700]
  }
}))

// Styled component for a Bootstrap button
const BootstrapButton = styled(Button)({
  fontSize: 16,
  lineHeight: 1.5,
  boxShadow: 'none',
  border: '1px solid',
  padding: '6px 12px',
  textTransform: 'none',
  borderColor: '#0063cc',
  backgroundColor: '#0063cc',
  fontFamily: [
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif',
    '"Apple Color Emoji"',
    '"Segoe UI Emoji"',
    '"Segoe UI Symbol"'
  ].join(','),
  '&:hover': {
    boxShadow: 'none',
    borderColor: '#0062cc',
    backgroundColor: '#0069d9'
  },
  '&:active': {
    boxShadow: 'none',
    borderColor: '#005cbf',
    backgroundColor: '#0062cc'
  },
  '&:focus': {
    boxShadow: '0 0 0 0.2rem rgba(0,123,255,.5)'
  }
})

const ButtonsCustomized = () => {
  return (
    <div className='demo-space-x'>
      <CustomButton variant='contained'>Custom Color</CustomButton>
      <BootstrapButton variant='contained' disableRipple>
        Bootstrap
      </BootstrapButton>
    </div>
  )
}

export default ButtonsCustomized
