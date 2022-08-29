export const SliderBasicJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
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
`}</code>
  </pre>
)

export const SliderColorsJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
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
`}</code>
  </pre>
)

export const SliderControlledUncontrolledJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Slider from '@mui/material/Slider'
import Typography from '@mui/material/Typography'

const SliderControlledUncontrolled = () => {
  // ** State
  const [value, setValue] = useState(30)

  return (
    <div>
      <Typography sx={{ fontWeight: 500 }}>Controlled Slider</Typography>
      <Slider value={value} aria-labelledby='controlled-slider' onChange={(event, newValue) => setValue(newValue)} />
      <Typography sx={{ fontWeight: 500 }}>Uncontrolled Slider</Typography>
      <Slider defaultValue={30} aria-labelledby='uncontrolled-slider' />
    </div>
  )
}

export default SliderControlledUncontrolled
`}</code>
  </pre>
)

export const SliderCustomColorsJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import MuiSlider from '@mui/material/Slider'

// ** Util Import
import { hexToRGBA } from 'src/@core/utils/hex-to-rgba'

// Styled component for a success Slider
const SliderSuccess = styled(MuiSlider)(({ theme }) => ({
  color: theme.palette.success.main,
  '& .MuiSlider-thumb:hover, & .MuiSlider-thumb.Mui-focusVisible': {
    boxShadow: 0 0 0 {theme.spacing(2)} {hexToRGBA(theme.palette.success.main, 0.16)}
  },
  '@media(hover:none)': {
    '& .MuiSlider-thumb:hover, & .MuiSlider-thumb.Mui-focusVisible': {
      boxShadow: 'none'
    }
  },
  '& .MuiSlider-thumb.Mui-focusVisible.Mui-active': {
    boxShadow: 0 0 0 {theme.spacing(3.5)} {hexToRGBA(theme.palette.success.main, 0.16)}
  }
}))

// Styled component for a error Slider
const SliderError = styled(MuiSlider)(({ theme }) => ({
  color: theme.palette.error.main,
  '& .MuiSlider-thumb:hover, & .MuiSlider-thumb.Mui-focusVisible': {
    boxShadow: 0 0 0 {theme.spacing(2)} {hexToRGBA(theme.palette.error.main, 0.16)}
  },
  '@media(hover:none)': {
    '& .MuiSlider-thumb:hover, & .MuiSlider-thumb.Mui-focusVisible': {
      boxShadow: 'none'
    }
  },
  '& .MuiSlider-thumb.Mui-focusVisible.Mui-active': {
    boxShadow: 0 0 0 {theme.spacing(3.5)} {hexToRGBA(theme.palette.error.main, 0.16)}
  }
}))

// Styled component for a warning Slider
const SliderWarning = styled(MuiSlider)(({ theme }) => ({
  color: theme.palette.warning.main,
  '& .MuiSlider-thumb:hover, & .MuiSlider-thumb.Mui-focusVisible': {
    boxShadow: 0 0 0 {theme.spacing(2)} {hexToRGBA(theme.palette.warning.main, 0.16)}
  },
  '@media(hover:none)': {
    '& .MuiSlider-thumb:hover, & .MuiSlider-thumb.Mui-focusVisible': {
      boxShadow: 'none'
    }
  },
  '& .MuiSlider-thumb.Mui-focusVisible.Mui-active': {
    boxShadow: 0 0 0 {theme.spacing(3.5)} {hexToRGBA(theme.palette.warning.main, 0.16)}
  }
}))

// Styled component for a info Slider
const SliderInfo = styled(MuiSlider)(({ theme }) => ({
  color: theme.palette.info.main,
  '& .MuiSlider-thumb:hover, & .MuiSlider-thumb.Mui-focusVisible': {
    boxShadow: 0 0 0 {theme.spacing(2)} {hexToRGBA(theme.palette.info.main, 0.16)}
  },
  '@media(hover:none)': {
    '& .MuiSlider-thumb:hover, & .MuiSlider-thumb.Mui-focusVisible': {
      boxShadow: 'none'
    }
  },
  '& .MuiSlider-thumb.Mui-focusVisible.Mui-active': {
    boxShadow: 0 0 0 {theme.spacing(3.5)} {hexToRGBA(theme.palette.info.main, 0.16)}
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
`}</code>
  </pre>
)

export const SliderCustomMarksJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
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
  return {value}°C
}

const SliderCustomMarks = () => {
  return (
    <Slider
      step={10}
      marks={marks}
      defaultValue={20}
      valueLabelDisplay='auto'
      getAriaValueText={valuetext}
      aria-labelledby='custom-marks-slider'
    />
  )
}

export default SliderCustomMarks
`}</code>
  </pre>
)

export const SliderDiscreteJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import Slider from '@mui/material/Slider'

const valuetext = value => {
  return {value}°C
}

const SliderDiscrete = () => {
  return (
    <Slider
      marks
      min={10}
      max={110}
      step={10}
      defaultValue={30}
      valueLabelDisplay='auto'
      getAriaValueText={valuetext}
      aria-labelledby='discrete-slider'
    />
  )
}

export default SliderDiscrete
`}</code>
  </pre>
)

export const SliderMinimumDistanceJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Slider from '@mui/material/Slider'

const valuetext = value => {
  return {value}°C
}
const minDistance = 10

const SliderMinimumDistance = () => {
  // ** States
  const [value1, setValue1] = useState([20, 37])
  const [value2, setValue2] = useState([20, 37])

  const handleChange1 = (event, newValue, activeThumb) => {
    if (!Array.isArray(newValue)) {
      return
    }
    if (activeThumb === 0) {
      setValue1([Math.min(newValue[0], value1[1] - minDistance), value1[1]])
    } else {
      setValue1([value1[0], Math.max(newValue[1], value1[0] + minDistance)])
    }
  }

  const handleChange2 = (event, newValue, activeThumb) => {
    if (!Array.isArray(newValue)) {
      return
    }
    if (newValue[1] - newValue[0] < minDistance) {
      if (activeThumb === 0) {
        const clamped = Math.min(newValue[0], 100 - minDistance)
        setValue2([clamped, clamped + minDistance])
      } else {
        const clamped = Math.max(newValue[1], minDistance)
        setValue2([clamped - minDistance, clamped])
      }
    } else {
      setValue2(newValue)
    }
  }

  return (
    <div>
      <Slider
        disableSwap
        value={value1}
        onChange={handleChange1}
        valueLabelDisplay='auto'
        getAriaValueText={valuetext}
        getAriaLabel={() => 'Minimum distance'}
      />
      <Slider
        disableSwap
        value={value2}
        onChange={handleChange2}
        valueLabelDisplay='auto'
        getAriaValueText={valuetext}
        getAriaLabel={() => 'Minimum distance shift'}
      />
    </div>
  )
}

export default SliderMinimumDistance
`}</code>
  </pre>
)

export const SliderCustomizedJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
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
`}</code>
  </pre>
)

export const SliderRangeJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import Slider from '@mui/material/Slider'

const valuetext = value => {
  return {value}°C
}

const SliderRange = () => {
  return (
    <Slider
      defaultValue={[20, 37]}
      valueLabelDisplay='auto'
      getAriaValueText={valuetext}
      aria-labelledby='range-slider'
    />
  )
}

export default SliderRange
`}</code>
  </pre>
)

export const SliderInvertedTrackJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
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
  return {value}°C
}

const SliderInvertedTrack = () => {
  return (
    <Slider
      marks={marks}
      track='inverted'
      defaultValue={30}
      getAriaValueText={valuetext}
      aria-labelledby='inverted-track-slider'
    />
  )
}

export default SliderInvertedTrack
`}</code>
  </pre>
)

export const SliderLabelAlwaysVisibleJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
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
  return {value}°C
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
`}</code>
  </pre>
)

export const SliderRemovedTrackJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
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
  return {value}°C
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
`}</code>
  </pre>
)

export const SliderRestrictedValuesJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
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
  return {value}°C
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
`}</code>
  </pre>
)

export const SliderSmallStepsJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import Slider from '@mui/material/Slider'

const valuetext = value => {
  return {value}°C
}

const SliderSmallSteps = () => {
  return (
    <Slider
      marks
      step={5}
      defaultValue={20}
      valueLabelDisplay='auto'
      getAriaValueText={valuetext}
      aria-labelledby='small-steps-slider'
    />
  )
}

export default SliderSmallSteps
`}</code>
  </pre>
)

export const SliderSizesJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
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
`}</code>
  </pre>
)

export const SliderVerticalJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
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
  return {value}°C
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
`}</code>
  </pre>
)
