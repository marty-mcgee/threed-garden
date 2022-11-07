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

const valueLabelFormat = value => {
  return marks.findIndex(mark => mark.value === value) + 1
}

const SliderRestrictedValues = () => {
  return (
    <Slider
      step={null}
      marks={marks}
      defaultValue={20}
      valueLabelDisplay='auto'
      getAriaValueText={valuetext}
      valueLabelFormat={valueLabelFormat}
      aria-labelledby='restricted-values-slider'
    />
  )
}

export default SliderRestrictedValues
