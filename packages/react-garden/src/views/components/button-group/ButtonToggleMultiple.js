// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'

// ** Icons Imports
import FormatBold from 'mdi-material-ui/FormatBold'
import FormatItalic from 'mdi-material-ui/FormatItalic'
import FormatUnderline from 'mdi-material-ui/FormatUnderline'
import FormatColorFill from 'mdi-material-ui/FormatColorFill'

const ButtonToggleMultiple = () => {
  // ** State
  const [formats, setFormats] = useState(() => ['bold', 'italic'])

  const handleFormat = (event, newFormats) => {
    setFormats(newFormats)
  }

  return (
    <ToggleButtonGroup value={formats} onChange={handleFormat} aria-label='text alignment'>
      <ToggleButton value='bold' aria-label='bold'>
        <FormatBold />
      </ToggleButton>
      <ToggleButton value='italic' aria-label='italic'>
        <FormatItalic />
      </ToggleButton>
      <ToggleButton value='underlined' aria-label='underlined'>
        <FormatUnderline />
      </ToggleButton>
      <ToggleButton value='color' aria-label='color' disabled>
        <FormatColorFill />
      </ToggleButton>
    </ToggleButtonGroup>
  )
}

export default ButtonToggleMultiple
