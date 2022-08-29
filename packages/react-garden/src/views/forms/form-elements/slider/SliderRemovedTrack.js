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

const SliderRemovedTrack = () => {
  return (
    <Slider
      track={false}
      marks={marks}
      defaultValue={30}
      getAriaValueText={valuetext}
      aria-labelledby='removed-track-slider'
    />
  )
}

export default SliderRemovedTrack
