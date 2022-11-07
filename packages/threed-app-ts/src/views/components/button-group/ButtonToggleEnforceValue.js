// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'

// ** Icons Imports
import Laptop from 'mdi-material-ui/Laptop'
import Monitor from 'mdi-material-ui/Monitor'
import Cellphone from 'mdi-material-ui/Cellphone'
import FormatAlignLeft from 'mdi-material-ui/FormatAlignLeft'
import FormatAlignRight from 'mdi-material-ui/FormatAlignRight'
import FormatAlignCenter from 'mdi-material-ui/FormatAlignCenter'
import FormatAlignJustify from 'mdi-material-ui/FormatAlignJustify'

const ButtonToggleEnforceValue = () => {
  // ** States
  const [formats, setFormats] = useState(() => ['phone'])
  const [alignment, setAlignment] = useState('left')

  const handleAlignment = (event, newAlignment) => {
    if (newAlignment !== null) {
      setAlignment(newAlignment)
    }
  }

  const handleFormat = (event, newFormats) => {
    if (newFormats.length) {
      setFormats(newFormats)
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12} sm={6}>
        <Typography sx={{ fontWeight: 500, mb: 2 }}>Exclusive Selection</Typography>
        <ToggleButtonGroup exclusive value={alignment} onChange={handleAlignment} aria-label='text alignment'>
          <ToggleButton value='left' aria-label='left aligned'>
            <FormatAlignLeft />
          </ToggleButton>
          <ToggleButton value='center' aria-label='center aligned'>
            <FormatAlignCenter />
          </ToggleButton>
          <ToggleButton value='right' aria-label='right aligned'>
            <FormatAlignRight />
          </ToggleButton>
          <ToggleButton value='justify' aria-label='justified' disabled>
            <FormatAlignJustify />
          </ToggleButton>
        </ToggleButtonGroup>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography sx={{ fontWeight: 500, mb: 2 }}>Multiple Selection</Typography>
        <ToggleButtonGroup value={formats} onChange={handleFormat} aria-label='device'>
          <ToggleButton value='laptop' aria-label='laptop'>
            <Laptop />
          </ToggleButton>
          <ToggleButton value='desktop' aria-label='desktop'>
            <Monitor />
          </ToggleButton>
          <ToggleButton value='phone' aria-label='phone'>
            <Cellphone />
          </ToggleButton>
        </ToggleButtonGroup>
      </Grid>
    </Grid>
  )
}

export default ButtonToggleEnforceValue
