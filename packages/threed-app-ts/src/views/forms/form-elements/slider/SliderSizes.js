// ** MUI Imports
import Slider from '@mui/material/Slider'
import Typography from '@mui/material/Typography'

const SliderSizes = () => {
  return (
    <div>
      <Typography sx={{ fontWeight: 500 }}>Small</Typography>
      <Slider size='small' defaultValue={30} aria-labelledby='small-slider' />
      <Typography sx={{ fontWeight: 500 }}>Normal</Typography>
      <Slider defaultValue={30} aria-labelledby='normal-slider' />
    </div>
  )
}

export default SliderSizes
