// ** MUI Imports
import Slider from '@mui/material/Slider'
import Typography from '@mui/material/Typography'

const SliderBasic = () => {
  return (
    <div>
      <Typography sx={{ fontWeight: 500 }}>Default Slider</Typography>
      <Slider defaultValue={30} aria-labelledby='continuous-slider' />
      <Typography sx={{ fontWeight: 500 }}>Disabled Slider</Typography>
      <Slider disabled defaultValue={30} aria-labelledby='disabled-slider' />
    </div>
  )
}

export default SliderBasic
