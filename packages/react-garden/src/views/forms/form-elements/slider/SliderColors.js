// ** MUI Imports
import Slider from '@mui/material/Slider'
import Typography from '@mui/material/Typography'

const SliderColors = () => {
  return (
    <div>
      <Typography sx={{ fontWeight: 500 }}>Primary Slider</Typography>
      <Slider defaultValue={30} aria-labelledby='primary-slider' />
      <Typography sx={{ fontWeight: 500 }}>Secondary Slider</Typography>
      <Slider defaultValue={30} color='secondary' aria-labelledby='secondary-slider' />
    </div>
  )
}

export default SliderColors
