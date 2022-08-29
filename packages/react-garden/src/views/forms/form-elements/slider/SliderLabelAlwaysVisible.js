// ** MUI Imports
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

const SliderLabelAlwaysVisible = () => {
  return (
    <Slider
      step={10}
      marks={marks}
      defaultValue={80}
      valueLabelDisplay='on'
      getAriaValueText={valuetext}
      aria-labelledby='label-always-visible-slider'
    />
  )
}

export default SliderLabelAlwaysVisible
