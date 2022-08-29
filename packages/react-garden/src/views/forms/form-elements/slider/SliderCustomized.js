// ** MUI Imports
import { styled } from '@mui/material/styles'
import MuiSlider from '@mui/material/Slider'

const marks = [
  {
    value: 0
  },
  {
    value: 20
  },
  {
    value: 37
  },
  {
    value: 100
  }
]

// Styled Slider component
const Slider = styled(MuiSlider)(({ theme }) => ({
  height: 2,
  padding: '15px 0',
  color: theme.palette.primary.main,
  '& .MuiSlider-rail': {
    opacity: 0.5,
    backgroundColor: '#bfbfbf'
  },
  '& .MuiSlider-track': {
    border: 'none'
  },
  '& .MuiSlider-mark': {
    width: 1,
    height: 8,
    backgroundColor: '#bfbfbf',
    '&.MuiSlider-markActive': {
      opacity: 1,
      backgroundColor: 'currentColor'
    }
  },
  '& .MuiSlider-thumb': {
    width: 28,
    height: 28,
    backgroundColor: theme.palette.common.white,
    boxShadow: '0 3px 1px rgba(0,0,0,0.1),0 4px 8px rgba(0,0,0,0.13),0 0 0 1px rgba(0,0,0,0.02)',
    '&:focus, &:hover, &.Mui-active': {
      boxShadow: '0 3px 1px rgba(0,0,0,0.1),0 4px 8px rgba(0,0,0,0.3),0 0 0 1px rgba(0,0,0,0.02)',

      // Reset on touch devices, it doesn't add specificity
      '@media (hover: none)': {
        boxShadow: '0 3px 1px rgba(0,0,0,0.1),0 4px 8px rgba(0,0,0,0.13),0 0 0 1px rgba(0,0,0,0.02)'
      }
    }
  },
  '& .MuiSlider-valueLabel': {
    top: -6,
    fontSize: 12,
    fontWeight: 'normal',
    backgroundColor: 'unset',
    color: theme.palette.text.primary,
    '&:before': {
      display: 'none'
    },
    '& *': {
      background: 'transparent',
      color: theme.palette.mode === 'dark' ? theme.palette.common.white : theme.palette.common.black
    }
  }
}))

const SliderCustomized = () => (
  <Slider marks={marks} defaultValue={60} valueLabelDisplay='on' aria-labelledby='customized-slider' />
)

export default SliderCustomized
