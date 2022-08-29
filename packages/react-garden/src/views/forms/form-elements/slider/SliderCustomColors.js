// ** MUI Imports
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import MuiSlider from '@mui/material/Slider'

// ** Util Import
import { hexToRGBA } from 'src/@core/utils/hex-to-rgba'

// Styled component for a success Slider
const SliderSuccess = styled(MuiSlider)(({ theme }) => ({
  color: theme.palette.success.main,
  '& .MuiSlider-thumb:hover, & .MuiSlider-thumb.Mui-focusVisible': {
    boxShadow: `0 0 0 ${theme.spacing(2)} ${hexToRGBA(theme.palette.success.main, 0.16)}`
  },
  '@media(hover:none)': {
    '& .MuiSlider-thumb:hover, & .MuiSlider-thumb.Mui-focusVisible': {
      boxShadow: 'none'
    }
  },
  '& .MuiSlider-thumb.Mui-focusVisible.Mui-active': {
    boxShadow: `0 0 0 ${theme.spacing(3.5)} ${hexToRGBA(theme.palette.success.main, 0.16)}`
  }
}))

// Styled component for a error Slider
const SliderError = styled(MuiSlider)(({ theme }) => ({
  color: theme.palette.error.main,
  '& .MuiSlider-thumb:hover, & .MuiSlider-thumb.Mui-focusVisible': {
    boxShadow: `0 0 0 ${theme.spacing(2)} ${hexToRGBA(theme.palette.error.main, 0.16)}`
  },
  '@media(hover:none)': {
    '& .MuiSlider-thumb:hover, & .MuiSlider-thumb.Mui-focusVisible': {
      boxShadow: 'none'
    }
  },
  '& .MuiSlider-thumb.Mui-focusVisible.Mui-active': {
    boxShadow: `0 0 0 ${theme.spacing(3.5)} ${hexToRGBA(theme.palette.error.main, 0.16)}`
  }
}))

// Styled component for a warning Slider
const SliderWarning = styled(MuiSlider)(({ theme }) => ({
  color: theme.palette.warning.main,
  '& .MuiSlider-thumb:hover, & .MuiSlider-thumb.Mui-focusVisible': {
    boxShadow: `0 0 0 ${theme.spacing(2)} ${hexToRGBA(theme.palette.warning.main, 0.16)}`
  },
  '@media(hover:none)': {
    '& .MuiSlider-thumb:hover, & .MuiSlider-thumb.Mui-focusVisible': {
      boxShadow: 'none'
    }
  },
  '& .MuiSlider-thumb.Mui-focusVisible.Mui-active': {
    boxShadow: `0 0 0 ${theme.spacing(3.5)} ${hexToRGBA(theme.palette.warning.main, 0.16)}`
  }
}))

// Styled component for a info Slider
const SliderInfo = styled(MuiSlider)(({ theme }) => ({
  color: theme.palette.info.main,
  '& .MuiSlider-thumb:hover, & .MuiSlider-thumb.Mui-focusVisible': {
    boxShadow: `0 0 0 ${theme.spacing(2)} ${hexToRGBA(theme.palette.info.main, 0.16)}`
  },
  '@media(hover:none)': {
    '& .MuiSlider-thumb:hover, & .MuiSlider-thumb.Mui-focusVisible': {
      boxShadow: 'none'
    }
  },
  '& .MuiSlider-thumb.Mui-focusVisible.Mui-active': {
    boxShadow: `0 0 0 ${theme.spacing(3.5)} ${hexToRGBA(theme.palette.info.main, 0.16)}`
  }
}))

const SliderCustomColors = () => {
  return (
    <div>
      <Typography sx={{ fontWeight: 500 }}>Success Slider</Typography>
      <SliderSuccess defaultValue={30} aria-labelledby='success-slider' />
      <Typography sx={{ fontWeight: 500 }}>Error Slider</Typography>
      <SliderError defaultValue={30} aria-labelledby='error-slider' />
      <Typography sx={{ fontWeight: 500 }}>Warning Slider</Typography>
      <SliderWarning defaultValue={30} aria-labelledby='warning-slider' />
      <Typography sx={{ fontWeight: 500 }}>Info Slider</Typography>
      <SliderInfo defaultValue={30} aria-labelledby='info-slider' />
    </div>
  )
}

export default SliderCustomColors
