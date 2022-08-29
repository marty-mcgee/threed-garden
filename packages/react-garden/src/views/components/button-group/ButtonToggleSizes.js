// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'

// ** Icons Imports
import FormatAlignLeft from 'mdi-material-ui/FormatAlignLeft'
import FormatAlignRight from 'mdi-material-ui/FormatAlignRight'
import FormatAlignCenter from 'mdi-material-ui/FormatAlignCenter'
import FormatAlignJustify from 'mdi-material-ui/FormatAlignJustify'

const ButtonToggleSizes = () => {
  // ** State
  const [alignment, setAlignment] = useState('left')

  const handleAlignment = (event, newAlignment) => {
    setAlignment(newAlignment)
  }

  return (
    <div className='demo-space-y'>
      <div>
        <ToggleButtonGroup
          exclusive
          size='small'
          value={alignment}
          onChange={handleAlignment}
          aria-label='text alignment'
        >
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
      </div>
      <div>
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
      </div>
      <div>
        <ToggleButtonGroup
          exclusive
          size='large'
          value={alignment}
          onChange={handleAlignment}
          aria-label='text alignment'
        >
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
      </div>
    </div>
  )
}

export default ButtonToggleSizes
