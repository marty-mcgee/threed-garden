// ** MUI Imports
import Box from '@mui/material/Box'
import Slider from '@mui/material/Slider'

const marks = [
  {
    value: 0,
    label: '0°'
  },
  {
    value: 20,
    label: '20°'
  },
  {
    value: 37,
    label: '37°'
  },
  {
    value: 100,
    label: '100°'
  }
]

const valuetext = value => {
  return `${value}°C`
}

const SliderVertical = () => {
  return (
    <Box sx={{ height: 250, '& > :not(:last-child)': { mr: 8 }, '& > :last-child': { mr: 0 } }}>
      <Slider orientation='vertical' getAriaValueText={valuetext} defaultValue={30} aria-labelledby='vertical-slider' />
      <Slider
        disabled
        defaultValue={30}
        orientation='vertical'
        getAriaValueText={valuetext}
        aria-labelledby='vertical-disabled-slider'
      />
      <Slider
        marks={marks}
        orientation='vertical'
        defaultValue={[20, 37]}
        getAriaValueText={valuetext}
        aria-labelledby='vertical-marks-slider'
      />
    </Box>
  )
}

export default SliderVertical
